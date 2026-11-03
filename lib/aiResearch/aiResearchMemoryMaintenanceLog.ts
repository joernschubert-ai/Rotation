import {Redis} from '@upstash/redis';
import {randomUUID} from 'node:crypto';
import {digest,object} from './aiResearchMemoryProtocol';
import {memoryBounded,MEMORY_PREFIX} from './aiResearchMemoryStore';
const PREFIX=MEMORY_PREFIX+':maintenance-audit:v1';
export type MemoryMaintenanceLog={startedAt:string;finishedAt:string;status:'COMPLETE'|'PARTIAL'|'FAILED';stage:string;completedCloseCutoff:string;sources:Array<{market:string;symbol:string;ok:boolean;observations:number;firstDate:string|null;lastDate:string|null;errorCode:string|null}>;barsSubmitted:number;newBarsStored:number;pendingFetched:number;forecastsChecked:number;forecastErrors:number;budgetSkipped:number;errorCode:string|null};
export function maintenanceErrorCode(error:unknown,priceSource=false){const e=object(error),message=error instanceof Error?error.message:String(e.message??'');if(priceSource&&e.name==='SyntaxError')return 'PRICE_RESPONSE_JSON_INVALID';if(e.name==='TimeoutError'||e.name==='AbortError')return 'PRICE_REQUEST_TIMEOUT';return /^MEMORY_(?:PRICE_HTTP_\d{3}|PRICE_FORMAT|WRONG_SYMBOL)$/.test(message)?message:'MAINTENANCE_STEP_FAILED';}
/** Separate diagnostic namespace; never overwrites forecasts, assessments, bars or market history. */
export async function recordMemoryMaintenance(record:MemoryMaintenanceLog){
 const id=digest({startedAt:record.startedAt,nonce:randomUUID()}),text=JSON.stringify({version:'MEMORY_MAINTENANCE_LOG_V1',id,...record,modelRequestsUsed:0,scheduledInvocationVerified:false});
 if(Buffer.byteLength(text)>20000)throw Error('MAINTENANCE_LOG_SIZE');const payload=JSON.stringify({text,hash:digest(text)}),score=Date.parse(record.startedAt);if(!Number.isFinite(score))throw Error('MAINTENANCE_LOG_TIME');
 const result=await memoryBounded(Redis.fromEnv().eval(
  "-- MEMORY_MAINTENANCE_LOG_NX_V1\nif redis.call('EXISTS',KEYS[1])==1 then return 0 end redis.call('SET',KEYS[1],ARGV[1]) redis.call('ZADD',KEYS[2],ARGV[2],ARGV[3]) local old=redis.call('GET',KEYS[3]) local setlast=true if old then local ok,v=pcall(cjson.decode,old) if ok and (tonumber(v.startedMs or 0)>tonumber(ARGV[2]) or (tonumber(v.startedMs or 0)==tonumber(ARGV[2]) and tostring(v.id or '')>ARGV[3])) then setlast=false end end if setlast then redis.call('SET',KEYS[3],ARGV[4]) end return 1",
  [PREFIX+':run:'+id,PREFIX+':runs',PREFIX+':latest'],[payload,String(score),id,JSON.stringify({id,startedMs:score})]),600);
 return {id,persisted:Number(result)===1};
}
export async function readMemoryMaintenanceAudit(){
 const pointer=object(await memoryBounded(Redis.fromEnv().get(PREFIX+':latest')));
 if(typeof pointer.id!=='string'||!/^[a-f0-9]{64}$/.test(pointer.id))return {status:'NOT_RECORDED',latest:null,readOnly:true,modelRequestsUsed:0,memoryWritten:false,meaning:'Noch kein Wartungsdiagnoseeintrag vorhanden. Das ist vor dem ersten Lauf nach Installation erwartbar.'};
 const envelope=object(await memoryBounded(Redis.fromEnv().get(PREFIX+':run:'+pointer.id)));
 if(typeof envelope.text!=='string'||Buffer.byteLength(envelope.text)>20000||digest(envelope.text)!==envelope.hash)throw Error('MAINTENANCE_LOG_HASH');const record=JSON.parse(envelope.text);
 if(record.id!==pointer.id||record.version!=='MEMORY_MAINTENANCE_LOG_V1'||Date.parse(record.startedAt)!==pointer.startedMs)throw Error('MAINTENANCE_LOG_FRAME');
 return {status:'AVAILABLE',latest:record,readOnly:true,modelRequestsUsed:0,memoryWritten:false,meaning:'Letzter protokollierter Wartungsaufruf nach Startzeit. Der Eintrag beweist nicht, ob Vercel ihn geplant oder manuell gestartet hat; dafür die Vercel-Logs abgleichen.'};
}
