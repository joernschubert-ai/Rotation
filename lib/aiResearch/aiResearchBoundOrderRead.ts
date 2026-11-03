import {Redis} from '@upstash/redis';
/** Existing comparison result GET only. No write, quota admission, retry or inference. */
export async function readCachedBoundOrder(id:string,snapshot:string){
 if(!/^[a-f0-9]{64}$/.test(id)||!Number.isFinite(Date.parse(snapshot)))return {status:'INVALID_FRAME',original:null};
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  const read=Redis.fromEnv().get<Record<string,any>>('rotation:research:cf:v1:full-comparison:v1:result:'+id+':gemma');
  const value=await Promise.race([read,new Promise<null>(resolve=>{timer=setTimeout(()=>resolve(null),1500);})]);
  if(!value)return {status:'CACHE_MISS_OR_TIMEOUT',original:null};
  if(value.inputId!==id||value.snapshotTimestamp!==snapshot||value.model!=='@cf/google/gemma-4-26b-a4b-it'||value.transportProfile!=='GEMMA_BOUND_ORDER_V1')return {status:'CACHE_FRAME_MISMATCH',original:null};
  if(value.ok!==true||typeof value.answerText!=='string')return {status:'CACHED_FAILURE',original:null};
  return {status:'CACHED_RESULT',original:value};
 }catch{return {status:'CACHE_UNAVAILABLE',original:null};}
 finally{if(timer!==undefined)clearTimeout(timer);}
}
