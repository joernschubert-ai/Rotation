import {MEMORY_CLOSE_ABSOLUTE_TOLERANCE,MEMORY_CLOSE_COMPARISON_POLICY} from './aiResearchMemoryCloseComparison';
import {validDay,finite} from './aiResearchMemoryProtocol';
import {Redis} from '@upstash/redis';
import type {MemoryBar,MemoryForecast,makeMemoryRecord} from './aiResearchMemoryProtocol';
export const MEMORY_PREFIX='rotation:research:memory:v1';
const id=(s:string)=>{if(!/^[a-f0-9]{64}$/.test(s))throw Error('MEMORY_INVALID_ID');return s;};
export async function memoryBounded<T>(work:Promise<T>,ms=1200):Promise<T>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('MEMORY_STORE_TIMEOUT')),ms);})]);}finally{if(timer)clearTimeout(timer);}}
export async function storeMemoryRecord(entry:ReturnType<typeof makeMemoryRecord>){
 const lane=entry.meta.kind==='SYNTHETIC_DIAGNOSTIC'?'synthetic':'normal',key=MEMORY_PREFIX+':record:'+id(entry.meta.id);
 return Number(await memoryBounded(Redis.fromEnv().eval(
  "-- MEMORY_RECORD_NX_V1\nif redis.call('EXISTS',KEYS[1])==1 then return 0 end redis.call('SET',KEYS[1],ARGV[1]) redis.call('SET',KEYS[2],ARGV[2]) redis.call('ZADD',KEYS[3],ARGV[3],ARGV[4]) return 1",
  [key,MEMORY_PREFIX+':meta:'+entry.meta.id,MEMORY_PREFIX+':records:'+lane],[JSON.stringify(entry),JSON.stringify(entry.meta),String(Date.parse(entry.meta.capturedAt)),entry.meta.id])))===1;
}
export async function readMemoryRecord(recordId:string){return memoryBounded(Redis.fromEnv().get<ReturnType<typeof makeMemoryRecord>>(MEMORY_PREFIX+':record:'+id(recordId)));}
export async function listMemoryRecords(offset=0){
 const redis=Redis.fromEnv(),ids=await memoryBounded(redis.zrange<string[]>(MEMORY_PREFIX+':records:normal',offset,offset+19,{rev:true}));
 return ids.length?memoryBounded(redis.mget<unknown[]>(...ids.map(s=>MEMORY_PREFIX+':meta:'+id(s)))):[];
}
export async function storeMemoryForecast(plan:MemoryForecast){
 return Number(await memoryBounded(Redis.fromEnv().eval(
  "-- MEMORY_FORECAST_NX_V1\nif redis.call('EXISTS',KEYS[1])==1 then return 0 end redis.call('SET',KEYS[1],ARGV[1]) redis.call('ZADD',KEYS[2],ARGV[2],ARGV[3]) redis.call('ZADD',KEYS[3],ARGV[2],ARGV[3]) return 1",
  [MEMORY_PREFIX+':forecast:'+id(plan.id),MEMORY_PREFIX+':forecasts',MEMORY_PREFIX+':pending'],[JSON.stringify(plan),String(Date.parse(plan.createdAt)),plan.id])))===1;
}
export async function readMemoryForecast(forecastId:string){return memoryBounded(Redis.fromEnv().get<MemoryForecast>(MEMORY_PREFIX+':forecast:'+id(forecastId)));}
export async function listMemoryForecasts(pending=false,offset=0){
 const redis=Redis.fromEnv(),ids=await memoryBounded(redis.zrange<string[]>(MEMORY_PREFIX+(pending?':pending':':forecasts'),pending?0:offset,pending?5:offset+9,pending?{}:{rev:true}));
 return ids.length?memoryBounded(redis.mget<Array<MemoryForecast|null>>(...ids.map(s=>MEMORY_PREFIX+':forecast:'+id(s)))):[];
}
export async function storeMemoryBars(bars:MemoryBar[]){
 if(!bars.length)return 0;
 if(bars.some(b=>!b||!['NASDAQ','RUSSELL_2000'].includes(b.market)||!validDay(b.date)||!finite(b.close)||b.close<=0||typeof b.source!=='string'||!b.source||!Number.isFinite(Date.parse(b.observedAt))||Date.parse(b.observedAt)<Date.parse(b.date+'T00:00:00Z')))throw Error('MEMORY_INVALID_BAR_BATCH');
 return Number(await memoryBounded(Redis.fromEnv().eval(
  "-- MEMORY_CLOSES_FIRST_OBSERVATION_V2\nlocal rows=cjson.decode(ARGV[1]) local n=0 local tolerance=tonumber(ARGV[3])\nfor _,b in ipairs(rows) do\n local k=ARGV[2]..':bar:'..b.market..':'..b.date\n local prev=redis.call('GET',k)\n if not prev then\n  redis.call('SET',k,cjson.encode(b)) redis.call('ZADD',ARGV[2]..':bars:'..b.market,b.score,b.date) n=n+1\n  if b.conflict==true then redis.call('SET',k..':conflict',cjson.encode({policy=ARGV[4],status='INPUT_CONFLICT',first=b}),'NX') end\n else\n  local old=cjson.decode(prev)\n  if old.close~=b.close or b.conflict==true or old.conflict==true then\n   local delta=math.abs(old.close-b.close)\n   local material=delta>tolerance or b.conflict==true or old.conflict==true\n   local evidence={policy=ARGV[4],status=material and 'MATERIAL_CONFLICT' or 'WITHIN_ABSOLUTE_TOLERANCE',absoluteDifference=delta,tolerance=tolerance,first=old,incoming=b}\n   redis.call('SET',k..':comparison:latest',cjson.encode(evidence))\n   if material then redis.call('SET',k..':conflict',cjson.encode(evidence),'NX') end\n  end\n end\nend\nreturn n",
  [],[JSON.stringify(bars.map(b=>({...b,score:Date.parse(b.date+'T00:00:00Z')}))),MEMORY_PREFIX,String(MEMORY_CLOSE_ABSOLUTE_TOLERANCE),MEMORY_CLOSE_COMPARISON_POLICY])));
}
export async function barsForForecast(plan:MemoryForecast){
 const redis=Redis.fromEnv(),start=Date.parse(plan.createdAt)-86400000;
 const dates=await memoryBounded(redis.zrange<string[]>(MEMORY_PREFIX+':bars:'+plan.market,start,'+inf',{byScore:true,offset:0,count:64}));
 if(!dates.length)return [];
 const keys=dates.map(d=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(d))throw Error('MEMORY_INVALID_BAR_DATE');return MEMORY_PREFIX+':bar:'+plan.market+':'+d;});
 const [raw,conflicts]=await Promise.all([memoryBounded(redis.mget<Array<MemoryBar|null>>(...keys)),memoryBounded(redis.mget<unknown[]>(...keys.map(k=>k+':conflict')))]);
 if(raw.some(b=>!b))throw Error('MEMORY_BAR_INDEX_GAP');
 return raw.map((b,i)=>({...b!,conflict:b!.conflict===true||!!conflicts[i]}));
}
export async function storeMemoryAssessment(plan:MemoryForecast,assessment:any){
 const redis=Redis.fromEnv();
 const terminal=assessment.outcomes.every((o:any)=>o.status==='MATURED_OBSERVED'||o.status==='SOURCE_CONFLICT'||o.status==='INVALID_NUMERIC_PATH');
 const rows=assessment.outcomes.filter((o:any)=>o.status==='MATURED_OBSERVED').map((o:any)=>({horizon:o.horizon,value:JSON.stringify({...o,evaluationPolicy:assessment.version,forecastId:plan.id,evaluatedAt:assessment.evaluatedAt,anchor:assessment.anchor})}));
 await memoryBounded(redis.eval(
  "-- MEMORY_ASSESSMENTS_NX_V1\nlocal rows=cjson.decode(ARGV[1]) for _,r in ipairs(rows) do redis.call('SET',ARGV[2]..':assessment:'..ARGV[3]..':'..r.horizon,r.value,'NX') end if ARGV[5]=='1' then redis.call('ZREM',KEYS[1],ARGV[3]) else redis.call('ZADD',KEYS[1],ARGV[4],ARGV[3]) end return 1",
  [MEMORY_PREFIX+':pending'],[JSON.stringify(rows),MEMORY_PREFIX,plan.id,String(Date.parse(assessment.evaluatedAt)),terminal?'1':'0']));
}
export async function storedMemoryAssessments(plan:MemoryForecast){return memoryBounded(Redis.fromEnv().mget<unknown[]>(...plan.horizons.map(h=>MEMORY_PREFIX+':assessment:'+id(plan.id)+':'+h)));}
