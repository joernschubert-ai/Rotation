import {Redis} from '@upstash/redis';
import {gzipSync,gunzipSync} from 'node:zlib';
import {digest,object,EVALUATION_POLICY,type MemoryForecast,type makeMemoryRecord} from './aiResearchMemoryProtocol';
import {memoryBounded,MEMORY_PREFIX} from './aiResearchMemoryStore';
import {validateScenarioAnswer} from './aiResearchScenarioContract';
import type {FrozenResearch} from './aiResearchComparison';

const PREFIX=MEMORY_PREFIX+':ai-scenarios:v1';
const key=(id:string)=>{if(!/^[a-f0-9]{64}$/.test(id))throw Error('SCENARIO_REQUEST_ID');return PREFIX+':episode:'+id;};
type Entry=ReturnType<typeof makeMemoryRecord>;
export function makeScenarioEpisode(entry:Entry,request:FrozenResearch,original:unknown,capturedAt:string){
 const r=object(original),now=Date.parse(capturedAt),issued=Date.parse(r.generatedAt);
 if(!Number.isFinite(now)||digest(request.body)!==request.id||request.snapshotTimestamp!==entry.meta.snapshotTimestamp)throw Error('SCENARIO_EPISODE_REQUEST');
 const matched=r.ok===true&&r.inputId===request.id&&r.snapshotTimestamp===entry.meta.snapshotTimestamp&&r.model==='@cf/google/gemma-4-26b-a4b-it'&&r.transportProfile==='GEMMA_INDEX_SCENARIOS_V2'&&Number.isFinite(issued)&&issued>=Date.parse(entry.meta.capturedAt)&&issued<=now;
 let parsed:unknown=null;try{if(typeof r.answerText==='string'&&r.answerText.length<=18000)parsed=JSON.parse(r.answerText);}catch{/* Original remains unchanged. */}
 const complete=r.truncated!==true&&!/length|max[_ -]?tokens|output[_ -]?limit/i.test(String(r.finishReason));
 const checked=matched&&complete?validateScenarioAnswer(entry,parsed):{ok:false,issues:[{path:'original',code:r.ok!==true?'PROVIDER_FAILURE':!matched?'MODEL_PROVENANCE_OR_TIME':'OUTPUT_INCOMPLETE'}],semanticTruthVerified:false,predictiveQualityVerified:false};
 const validation={...checked,provenance:matched?'MATCHED_MODEL_REQUEST':'UNVERIFIED_MODEL_PROVENANCE',modelBindingVerified:matched};
 const scenarios=validation.ok?object(parsed).scenarios as Array<Record<string,any>>:[];
 const forecasts:MemoryForecast[]=scenarios.filter(s=>s.direction!=='ABSTAIN').map(s=>({id:digest({version:'AI_INDEX_FORECAST_V1',requestId:request.id,market:s.market,evaluationPolicy:EVALUATION_POLICY}),sourceRecordId:entry.meta.id,createdAt:r.generatedAt,market:s.market,direction:s.direction,statement:s.reason,counterargument:s.counterargument,invalidation:null,attribution:'AI_GENERATED',evaluationPolicy:EVALUATION_POLICY,horizons:[5,10,20],primaryHorizon:20,scenarioEpisodeId:request.id,modelRequestId:request.id,monitorConditionId:s.monitorConditionId}));
 return {version:'AI_SCENARIO_EPISODE_V1',id:request.id,sourceRecordId:entry.meta.id,factsHash:entry.meta.factsHash,sourceSnapshot:entry.meta.snapshotTimestamp,capturedAt,issuedAt:matched?r.generatedAt:null,
  status:r.ok!==true?'PROVIDER_DIAGNOSTIC':validation.ok?'UNVERIFIED_SCENARIOS_RECORDED':'INVALID_MODEL_SCENARIOS',request,original,validation,scenarios,forecasts,
  primaryHorizon:20,secondaryHorizons:[5,10],abstentions:scenarios.filter(s=>s.direction==='ABSTAIN').map(s=>s.market),
  semanticTruthVerified:false,predictiveQualityVerified:false,approvedTrainingExample:false,activeRetrieval:false,
  limits:'Echte Modellherkunft und formaler Vertrag sind keine Inhalts- oder Prognosefreigabe. ABSTAIN bleibt im Originalarchiv und wird nicht als Treffer/Fehler ausgewertet. Monitorreferenzen sind keine automatischen Widerlegungen. Keine Optionsrendite oder gepoolte Trefferquote.'};
}
type Episode=ReturnType<typeof makeScenarioEpisode>;
function encode(episode:Episode){const text=JSON.stringify(episode);if(Buffer.byteLength(text)>4000000)throw Error('SCENARIO_EPISODE_TOO_LARGE');const payload=gzipSync(text).toString('base64');if(payload.length>900000)throw Error('SCENARIO_EPISODE_COMPRESSED_LIMIT');return {payload,payloadHash:digest(text)};}
function decode(raw:unknown):Episode{const e=object(raw);const text=gunzipSync(Buffer.from(e.payload,'base64'),{maxOutputLength:4000000}).toString('utf8');if(digest(text)!==e.payloadHash)throw Error('SCENARIO_EPISODE_HASH');return JSON.parse(text);}
export async function readScenarioEpisode(id:string){const raw=await memoryBounded(Redis.fromEnv().get(key(id)));return raw?decode(raw):null;}
export async function claimScenarioRequest(id:string,token:string){return Boolean(await memoryBounded(Redis.fromEnv().set(key(id)+':attempt',{token,claimedAt:new Date().toISOString()},{nx:true})));}
export async function releaseUnstartedScenario(id:string,token:string){return memoryBounded(Redis.fromEnv().eval("-- SCENARIO_RELEASE_UNSTARTED_V1\nlocal p=redis.call('GET',KEYS[1]) if p and cjson.decode(p).token==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0",[key(id)+':attempt'],[token]));}
export async function storeScenarioEpisode(episode:Episode){
 const record=encode(episode),meta={id:episode.id,sourceRecordId:episode.sourceRecordId,sourceSnapshot:episode.sourceSnapshot,issuedAt:episode.issuedAt,capturedAt:episode.capturedAt,status:episode.status,abstentions:episode.abstentions,forecastIds:episode.forecasts.map(f=>f.id)};
 const rows=episode.forecasts.map(plan=>({key:MEMORY_PREFIX+':forecast:'+plan.id,id:plan.id,score:Date.parse(plan.createdAt),value:JSON.stringify(plan)}));
 const result=Number(await memoryBounded(Redis.fromEnv().eval(
  "-- SCENARIO_EPISODE_AND_FORECASTS_NX_V1\nif redis.call('EXISTS',KEYS[1])==1 then return 0 end local rows=cjson.decode(ARGV[3]) for _,r in ipairs(rows) do if redis.call('EXISTS',r.key)==1 then return -1 end end redis.call('SET',KEYS[1],ARGV[1]) redis.call('SET',KEYS[2],ARGV[2]) redis.call('ZADD',KEYS[3],ARGV[4],ARGV[5]) for _,r in ipairs(rows) do redis.call('SET',r.key,r.value) redis.call('ZADD',KEYS[4],r.score,r.id) redis.call('ZADD',KEYS[5],r.score,r.id) end return 1",
  [key(episode.id),key(episode.id)+':meta',PREFIX+':episodes',MEMORY_PREFIX+':forecasts',MEMORY_PREFIX+':pending'],[JSON.stringify(record),JSON.stringify(meta),JSON.stringify(rows),String(Date.parse(episode.capturedAt)),episode.id])));
 if(result<0)throw Error('SCENARIO_FORECAST_ALREADY_EXISTS_WITHOUT_EPISODE');return result===1;
}
export async function listScenarioEpisodes(offset=0){
 if(!Number.isInteger(offset)||offset<0||offset>100000)throw Error('SCENARIO_PAGE');const redis=Redis.fromEnv(),ids=await memoryBounded(redis.zrange<string[]>(PREFIX+':episodes',offset,offset+19,{rev:true}));
 return ids.length?memoryBounded(redis.mget<unknown[]>(...ids.map(id=>key(id)+':meta'))):[];
}


