import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {Redis} from '@upstash/redis';
import type {AIResearchResult,AIResearchTask} from './aiResearchTypes';
import {recheckSourceReview,sourceFactsHash} from './aiResearchSourceReview';
const VERSION='FROZEN_RESEARCH_V79_3',PREFIX='rotation:research:frozen:v79.3';
const MAX_RAW_BYTES=4_000_000,MAX_COMPRESSED_CHARACTERS=900_000;
interface FrozenFrame {version:string;snapshotTimestamp:string;task:AIResearchTask;questionHash:string;snapshotHash:string;preparedAt:number;priority:number;factsHash:string;payloadHash:string;payload:string;}
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
export const researchSnapshotHash=(snapshot:unknown)=>hash(JSON.stringify(snapshot));
const questionHash=(question?:string)=>hash((question??'').slice(0,500));
const key=(stamp:string,task:AIResearchTask,question?:string)=>PREFIX+':'+hash(JSON.stringify([stamp,task,questionHash(question)]));
const current=(stamp:string)=>Number.isFinite(Date.parse(stamp))&&Date.parse(stamp)<=Date.now()&&Date.now()-Date.parse(stamp)<=86400000;
async function bounded<T>(work:Promise<T>):Promise<T>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Frozen report store unavailable')),1200);})]);}finally{if(timer)clearTimeout(timer);}}
/** Full dated result: frozen app facts, news, interpretation and diagnostics travel together. */
export async function saveFrozenResearchReport(snapshotTimestamp:string,task:AIResearchTask,question:string|undefined,result:AIResearchResult,preparedAt:number,snapshotHash=researchSnapshotHash({timestamp:snapshotTimestamp})):Promise<boolean>{
 try{
  const facts=result.report?.appFacts;
  if(!current(snapshotTimestamp)||result.status!=='SUCCESS'||!facts||facts.version!=='APP_FACTS_V71'||!Array.isArray(facts.facts)||facts.snapshotTimestamp!==snapshotTimestamp||!Number.isFinite(preparedAt)||preparedAt>Date.now())return false;
  const text=JSON.stringify(result);if(Buffer.byteLength(text)>MAX_RAW_BYTES)return false;
  const payload=gzipSync(text).toString('base64');if(payload.length>MAX_COMPRESSED_CHARACTERS)return false;
  const status=result.report?.aiSynthesis?.sourceReview?.status;
  const frame:FrozenFrame={version:VERSION,snapshotTimestamp,task,questionHash:questionHash(question),snapshotHash,preparedAt,priority:status==='VALID_SELECTION'?2:status==='PARTIAL_SELECTION'?1:result.report?.aiSynthesis?.sourceReview?0:-1,factsHash:sourceFactsHash(facts),payloadHash:hash(text),payload};
  // A failed/partial refresh never displaces a fully valid result for this same frame.
  const written=await bounded(Redis.fromEnv().eval<string[],number>(
   "-- FROZEN_RESEARCH_V79_3\nlocal prev=redis.call('GET',KEYS[1]) if prev then local ok,v=pcall(cjson.decode,prev) if ok and type(v)=='table' and v.snapshotHash==ARGV[4] then if tonumber(v.preparedAt or '0')>tonumber(ARGV[2]) or tonumber(v.priority or '-1')>tonumber(ARGV[3]) then return 0 end end end redis.call('SET',KEYS[1],ARGV[1],'EX',86400) return 1",
   [key(snapshotTimestamp,task,question)],[JSON.stringify(frame),String(preparedAt),String(frame.priority),frame.snapshotHash]));
  return written===1;
 }catch{return false;}
}
/** Read-only: no provider refresh and no reconstruction with newly fetched headlines. */
export async function readFrozenResearchReport(snapshotTimestamp:string,task:AIResearchTask,question?:string,snapshotHash=researchSnapshotHash({timestamp:snapshotTimestamp})):Promise<AIResearchResult|null>{
 try{
  if(!current(snapshotTimestamp))return null;
  const frame=await bounded(Redis.fromEnv().get<FrozenFrame>(key(snapshotTimestamp,task,question)));
  if(!frame||frame.version!==VERSION||frame.snapshotTimestamp!==snapshotTimestamp||frame.task!==task||frame.questionHash!==questionHash(question)||frame.snapshotHash!==snapshotHash||!Number.isFinite(frame.preparedAt)||frame.preparedAt>Date.now()||typeof frame.payload!=='string'||frame.payload.length>MAX_COMPRESSED_CHARACTERS)return null;
  const text=gunzipSync(Buffer.from(frame.payload,'base64'),{maxOutputLength:MAX_RAW_BYTES}).toString('utf8');
  if(hash(text)!==frame.payloadHash)return null;
  const result=JSON.parse(text) as AIResearchResult,facts=result.report?.appFacts;
  if(result.status!=='SUCCESS'||!result.report||!facts||facts.version!=='APP_FACTS_V71'||!Array.isArray(facts.facts)||facts.snapshotTimestamp!==snapshotTimestamp||sourceFactsHash(facts)!==frame.factsHash||result.report.decisionSupport&&result.report.decisionSupport.snapshotTimestamp!==snapshotTimestamp)return null;
  const synthesis=result.report.aiSynthesis;
  if(synthesis){
   if(synthesis.snapshotTimestamp!==snapshotTimestamp)return null;
   if(synthesis.sourceReview){const review=recheckSourceReview(synthesis.sourceReview,facts);if(!review)return null;synthesis.sourceReview=review;synthesis.status=review.status==='VALID_SELECTION'?'SUCCESS':'UNAVAILABLE';}
   synthesis.modelRequestsUsed=0;synthesis.cached=true;
  }
  result.diagnostics={...result.diagnostics,snapshotTimestamp,warnings:[...new Set([...(result.diagnostics?.warnings??[]),'Gespeicherter vollständiger Researchstand: Nachrichten, App-Fakten und KI-Antwort stammen gemeinsam aus diesem Bericht. Beim Lesen wurden keine Quellen neu abgerufen und kein KI-Aufruf gestartet.'])]};
  return result;
 }catch{return null;}
}
