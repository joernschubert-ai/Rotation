import {Redis} from '@upstash/redis';
import {randomUUID} from 'node:crypto';
import {digest,object} from './aiResearchMemoryProtocol';
import {memoryBounded,MEMORY_PREFIX} from './aiResearchMemoryStore';
const PREFIX=MEMORY_PREFIX+':cron-audit:v1';
type Start={id:string;startedAt:string;startPersisted:boolean};
type Finish={status:'COMPLETED'|'FAILED';stage:string;snapshotSaved:boolean;snapshotTimestamp?:unknown;maintenanceStatus:string;researchMemory?:unknown;errorCode?:string};
async function put(id:string,event:'start'|'finish',record:unknown,startedAt:string){
 const text=JSON.stringify(record);if(Buffer.byteLength(text)>16000)throw Error('CRON_AUDIT_SIZE');
 const payload=JSON.stringify({text,hash:digest(text)});
 if(event==='finish')return Number(await memoryBounded(Redis.fromEnv().set(PREFIX+':run:'+id+':finish',payload,{nx:true}),600)!==null);
 const score=Date.parse(startedAt);
 return Number(await memoryBounded(Redis.fromEnv().eval(
  "-- CRON_AUDIT_START_NX_V1\nif redis.call('EXISTS',KEYS[1])==1 then return 0 end redis.call('SET',KEYS[1],ARGV[1]) local old=redis.call('GET',KEYS[2]) local newer=true if old then local ok,v=pcall(cjson.decode,old) if ok and (tonumber(v.startedMs or 0)>tonumber(ARGV[2]) or (tonumber(v.startedMs or 0)==tonumber(ARGV[2]) and tostring(v.id or '')>ARGV[3])) then newer=false end end if newer then redis.call('SET',KEYS[2],ARGV[4]) end return 1",
  [PREFIX+':run:'+id+':start',PREFIX+':latest'],[payload,String(score),id,JSON.stringify({id,startedMs:score})]),600))===1;
}
/** Optional diagnostic only. No provider calls, forecast changes or business-data writes. */
export async function beginCronAudit(startedMs:number):Promise<Start>{
 const startedAt=new Date(startedMs).toISOString(),id=digest({startedAt,nonce:randomUUID()});
 const record={version:'CRON_AUDIT_V1',id,startedAt,status:'STARTED',authorized:true,scheduledInvocationVerified:false,modelRequestsUsed:0};
 let startPersisted=false;try{startPersisted=!!await put(id,'start',record,startedAt);}catch{}
 return {id,startedAt,startPersisted};
}
export async function finishCronAudit(start:Start|null,finish:Finish){
 if(!start)return {persisted:false,status:'NOT_STARTED',modelRequestsUsed:0};
 const memory=object(finish.researchMemory),diagnostic=object(memory.maintenanceDiagnostic);
 // Allowlisted summary, never arbitrary provider bodies or exception messages.
 const record={version:'CRON_AUDIT_V1',id:start.id,startedAt:start.startedAt,finishedAt:new Date().toISOString(),status:finish.status,stage:finish.stage,snapshotSaved:finish.snapshotSaved,snapshotTimestamp:typeof finish.snapshotTimestamp==='string'?finish.snapshotTimestamp:null,maintenanceStatus:finish.maintenanceStatus,maintenanceResultOk:typeof memory.ok==='boolean'?memory.ok:null,maintenanceDiagnosticId:typeof diagnostic.id==='string'&&/^[a-f0-9]{64}$/.test(diagnostic.id)?diagnostic.id:null,maintenanceDiagnosticPersisted:diagnostic.persisted===true,errorCode:finish.errorCode??null,modelRequestsUsed:0,scheduledInvocationVerified:false};
 let persisted=false;try{persisted=!!await put(start.id,'finish',record,start.startedAt);}catch{}
 return {id:start.id,startPersisted:start.startPersisted,persisted,status:record.status,maintenanceStatus:record.maintenanceStatus,modelRequestsUsed:0};
}
function decode(raw:unknown,id:string){const e=object(raw);if(typeof e.text!=='string'||Buffer.byteLength(e.text)>16000||digest(e.text)!==e.hash)throw Error('CRON_AUDIT_HASH');const r=object(JSON.parse(e.text));if(r.id!==id||r.version!=='CRON_AUDIT_V1')throw Error('CRON_AUDIT_FRAME');return r;}
export async function readCronAudit(){
 const pointer=object(await memoryBounded(Redis.fromEnv().get(PREFIX+':latest')));
 if(pointer.id===undefined)return {status:'NOT_RECORDED',latest:null,readOnly:true,modelRequestsUsed:0,memoryWritten:false,meaning:'Noch kein autorisierter Routenstart protokolliert. Kein Nachweis eines erfolgreichen oder ausgebliebenen geplanten Laufs.'};
 if(typeof pointer.id!=='string'||!/^[a-f0-9]{64}$/.test(pointer.id))throw Error('CRON_AUDIT_POINTER');
 const rows=await memoryBounded(Redis.fromEnv().mget<unknown[]>(PREFIX+':run:'+pointer.id+':start',PREFIX+':run:'+pointer.id+':finish'));
 const start=decode(rows[0],pointer.id);if(Date.parse(String(start.startedAt))!==pointer.startedMs||start.status!=='STARTED')throw Error('CRON_AUDIT_START_FRAME');
 const end=rows[1]===null?null:decode(rows[1],pointer.id);
 if(end&&(end.startedAt!==start.startedAt||!['COMPLETED','FAILED'].includes(String(end.status))))throw Error('CRON_AUDIT_FINISH_FRAME');
 return {status:end?'AVAILABLE':'START_WITHOUT_FINISH',latest:{start,finish:end},readOnly:true,modelRequestsUsed:0,memoryWritten:false,meaning:end?'Letzter protokollierter autorisierter Routenaufruf nach Startzeit. Geplanter und manueller Aufruf sind hier nicht sicher unterscheidbar.':'Start gespeichert, kein Abschluss gespeichert: Lauf kann noch aktiv, abgebrochen oder die Abschluss-Speicherung fehlgeschlagen sein. Keine eindeutige Fehlerursache belegt.'};
}
