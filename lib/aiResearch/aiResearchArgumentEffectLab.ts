import {Redis} from '@upstash/redis';
import {randomBytes} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {freezeRequest,saveFrozenRequest,runFullComparison,comparisonBody} from './aiResearchComparison';
import {claimScenarioRequest,releaseUnstartedScenario} from './aiResearchScenarioEpisodes';
import {memoryBounded,MEMORY_PREFIX} from './aiResearchMemoryStore';
import {digest,object} from './aiResearchMemoryProtocol';
import {loadScenarioContext,type prepareScenarioContext} from './aiResearchScenarioContext';
import {prepareArgumentEffects,validateArgumentEffectSelection} from './aiResearchArgumentEffects';
const VERSION='ARGUMENT_EFFECT_LAB_V1',PREFIX=MEMORY_PREFIX+':argument-effects:v1:';
const validId=(id:string)=>{if(typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id))throw Error('EFFECT_INVALID_ID');return id;};
export function prepareEffectLab(context:ReturnType<typeof prepareScenarioContext>){
 const effects=prepareArgumentEffects(context);
 if(!effects.inputBudgetSatisfied)throw Error('EFFECT_INPUT_BUDGET '+effects.candidateInputCharacters);
 const schema={type:'object',additionalProperties:false,required:['version','baseEpisodeId','factsHash','markets'],properties:{version:{type:'string',enum:['ARGUMENT_EFFECT_SELECTION_V1']},baseEpisodeId:{type:'string',enum:[context.base.id]},factsHash:{type:'string',enum:[context.base.factsHash]},markets:{type:'array',minItems:2,maxItems:2,items:{type:'object',additionalProperties:false,required:['market','effectIds','unresolved'],properties:{market:{type:'string',enum:['NASDAQ','RUSSELL_2000']},effectIds:{type:'array',maxItems:6,items:{type:'string',enum:effects.effects.map(e=>e.effectId)}},unresolved:{type:'boolean'}}}}}};
 const format={type:'json_schema' as const,json_schema:{name:'rotation_scenario_context_v1',strict:true as const,schema}};
 const system=effects.candidateRequest.body.messages[0].content+' Nur JSON mit version ARGUMENT_EFFECT_SELECTION_V1, baseEpisodeId '+context.base.id+', factsHash '+context.base.factsHash+' und markets:[{market,effectIds,unresolved}]. Je Markt höchstens sechs eigene eindeutige effectIds. Bei offenem Urteil darf effectIds leer sein. Keine Auswahlpflicht aller Facetten. Die Richtung der Basis bleibt unverändert. /no_think';
 const request=freezeRequest(context.base.sourceSnapshot,system,effects.candidateRequest.body.messages[1].content,.7,2200,format);
 comparisonBody(request);
 return {entry:context.entry,base:context.base,request,effects,appStatements:context.appStatements,preview:{ok:true,version:VERSION,readOnly:true,modelRequestsUsed:0,memoryWritten:false,inputId:request.id,factsHash:context.base.factsHash,baseEpisodeId:context.base.id,sourceSnapshot:context.base.sourceSnapshot,inputCharacters:request.body.messages[1].content.length,effectCatalog:effects.effects,modelInput:request.body.messages,responseFormat:format,appStatements:context.appStatements,originalV5Changed:false,forecastsChanged:false,acceptedV2Changed:false,controls:{maxNewModelRequests:1,sharedDailyLimit:20,cooldownSeconds:90,timeoutMs:45000,automaticRetry:false},limits:effects.limits}};
}
type Prepared=ReturnType<typeof prepareEffectLab>;
export async function loadEffectLab(baseId:string){return prepareEffectLab(await loadScenarioContext(baseId));}
export function validateEffectLab(p:Prepared,raw:unknown){return validateArgumentEffectSelection(p.effects,raw);}
function key(id:string){return PREFIX+validId(id);}
async function storedId(id:string){const v=object(await memoryBounded(Redis.fromEnv().get(key(id))));if(!v.payload)return null;const text=gunzipSync(Buffer.from(v.payload,'base64'),{maxOutputLength:4000000}).toString('utf8');if(digest(text)!==v.hash)throw Error('CONTEXT_ARCHIVE_HASH');return JSON.parse(text);}
async function stored(p:Prepared){return storedId(p.request.id);}
export async function readArchivedArgumentEffects(id:string){const episode=await storedId(id);return {ok:!!episode?.validation.ok,version:VERSION,readOnly:true,modelRequestsUsed:0,memoryWritten:false,archiveConfirmed:!!episode,episode,forecastsChanged:false};}
async function cache(p:Prepared){return memoryBounded(Redis.fromEnv().get<Record<string,any>>('rotation:research:cf:v1:full-comparison:v1:result:'+p.request.id+':gemma'));}
function check(p:Prepared,id:unknown,hash:unknown){if(id!==p.request.id||hash!==p.base.factsHash)throw Error('CONTEXT_PREVIEW_CHANGED');}
export async function readArgumentEffects(p:Prepared,id:unknown,hash:unknown){check(p,id,hash);const episode=await stored(p);const cached=episode?null:await cache(p);return {ok:!!episode?.validation.ok,version:VERSION,archiveConfirmed:!!episode,readOnly:true,modelRequestsUsed:0,memoryWritten:false,episode,originalV5Changed:false,forecastsChanged:false,...(!episode?{original:cached??null,message:cached?'Antwort im Aufrufcache vorhanden, Archivierung noch nicht bestätigt. Ein ausdrücklicher Start kann diese vorhandene Antwort ohne neue Modellanfrage übernehmen.':'Kein Fachkommentar archiviert. Keine Ersatzgenerierung gestartet.'}:{})};}
async function archive(p:Prepared,original:Record<string,any>,calls:number){
 let parsed:unknown=null;try{if(typeof original.answerText==='string'&&original.answerText.length<=18000)parsed=JSON.parse(original.answerText);}catch{/* Keep original. */}
 const now=new Date().toISOString(),issued=Date.parse(original.generatedAt);
 const matched=original.ok===true&&original.inputId===p.request.id&&original.snapshotTimestamp===p.base.sourceSnapshot&&original.model==='@cf/google/gemma-4-26b-a4b-it'&&original.transportProfile==='GEMMA_SCENARIO_CONTEXT_V1'&&Number.isFinite(issued)&&issued>=Date.parse(p.base.capturedAt)&&issued<=Date.parse(now);
 const complete=original.truncated!==true&&!/length|max[_ -]?tokens|output[_ -]?limit/i.test(String(original.finishReason));
 const validation=matched&&complete?validateArgumentEffectSelection(p.effects,parsed):{ok:false,issues:[{code:'CONTEXT_MODEL_OR_COMPLETENESS'}],view:null,semanticTruthVerified:false};
 const episode={version:VERSION,id:p.request.id,baseEpisodeId:p.base.id,sourceRecordId:p.entry.meta.id,factsHash:p.base.factsHash,sourceSnapshot:p.base.sourceSnapshot,capturedAt:now,issuedAt:matched?original.generatedAt:null,request:p.request,original,validation,view:validation.view,appStatements:p.appStatements,effectCatalog:p.effects.effects,provenance:matched?'MATCHED_MODEL_REQUEST':'UNVERIFIED_DIAGNOSTIC',originalV5Changed:false,forecastsChanged:false,newForecasts:0,approvedTrainingExample:false,activeRetrieval:false};
 try{const text=JSON.stringify(episode);if(Buffer.byteLength(text)>4000000)throw Error('CONTEXT_SIZE');const payload=gzipSync(text).toString('base64');if(payload.length>900000)throw Error('CONTEXT_COMPRESSED_SIZE');
  const written=await memoryBounded(Redis.fromEnv().set(key(p.request.id),{payload,hash:digest(text)},{nx:true}));const kept=written?episode:await stored(p);
  return {ok:!!kept?.validation.ok,version:VERSION,modelRequestsUsed:calls,memoryWritten:!!written,archiveConfirmed:!!kept,episode:kept,originalV5Changed:false,forecastsChanged:false};
 }catch{return {ok:false,version:VERSION,modelRequestsUsed:calls,memoryWritten:false,archiveConfirmed:false,episode,originalV5Changed:false,forecastsChanged:false,message:'Antwort vorhanden, Ablage nicht bestätigt. Keinen Ersatzaufruf starten; nur gespeichertes Ergebnis lesen.'};}
}
export async function runArgumentEffects(p:Prepared,id:unknown,hash:unknown){
 check(p,id,hash);const existing=await stored(p);if(existing)return {ok:!!existing.validation.ok,version:VERSION,modelRequestsUsed:0,memoryWritten:false,archiveConfirmed:true,episode:existing,originalV5Changed:false,forecastsChanged:false};
 const token=randomBytes(16).toString('hex'),claimed=await claimScenarioRequest(p.request.id,token);
 if(!claimed){const cached=await cache(p);return cached?archive(p,cached,0):{ok:false,modelRequestsUsed:0,message:'Versuch vorgemerkt oder unterbrochen; keine erneute Modellanfrage. Später gespeichertes Ergebnis lesen.',forecastsChanged:false};}
 let entered=false;
 try{await saveFrozenRequest(Redis.fromEnv(),p.request,{updateLatest:false});entered=true;const original=object(await runFullComparison(p.request.id,'gemma'));
  if(original.modelRequestsUsed===0&&original.cached!==true){await releaseUnstartedScenario(p.request.id,token);return {...original,forecastsChanged:false};}
  if(original.modelRequestsUsed!==1&&original.cached!==true)return {ok:false,modelRequestsUsed:null,message:'Aufrufstatus unklar; nicht wiederholen.',forecastsChanged:false};
  return await archive(p,original,original.cached===true?0:1);
 }catch{return {ok:false,modelRequestsUsed:entered?null:0,message:'Vorgang unterbrochen; keine automatische Wiederholung. Nur gespeichertes Ergebnis lesen.',forecastsChanged:false};}
}









