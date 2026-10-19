import { createHash } from 'node:crypto';
import { Redis } from '@upstash/redis';
import type { AIResearchCOTData,COTMarket,COTTraderGroup } from './aiResearchCOTTypes';
import type { FetchCOTInput,FetchCOTResult } from './aiResearchCOTProvider';
const POLICY='DATED_COMPLETE_COT_LAST_VALID_V1';
const defaults:COTMarket[]=['NASDAQ','SP500','RUSSELL_2000','DOW'];
const groups:COTTraderGroup[]=['DEALER','ASSET_MANAGER','LEVERAGED_MONEY','OTHER_REPORTABLES','NON_REPORTABLES'];
interface CacheRecord {policy:string;fetchedAt:string;latestDate:string;marketDates:Record<string,string>;data:Omit<AIResearchCOTData,'history'|'dataQuality'>;}
interface Store {get(key:string):Promise<unknown>;eval(script:string,keys:string[],args:(string|number)[]):Promise<unknown>;}
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const day=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const recent=(v:unknown,now:number)=>day(v)&&Date.parse(v+'T00:00:00Z')<=now&&now-Date.parse(v+'T00:00:00Z')<=14*86400000;
function completeUnsafe(data:AIResearchCOTData|undefined,markets:COTMarket[],now:number):boolean{
 if(!data||!recent(data.latestReportDate,now)||!Number.isFinite(Date.parse(data.generatedAt))||Date.parse(data.generatedAt)>now||!Array.isArray(data.observations)||!Array.isArray(data.summaries)||!Array.isArray(data.divergences)||!data.observations.length)return false;
 if(data.observations.some(o=>!day(o.reportDate)||Date.parse(o.reportDate+'T00:00:00Z')>now||!o.contract||!o.positions))return false;
 return markets.every(m=>{
  const rows=data.observations.filter(o=>o.market===m),dates=[...new Set(rows.map(o=>o.reportDate))].sort(),latest=dates[dates.length-1];
  if(dates.length<2||!recent(latest,now)||new Set(rows.map(o=>o.contract.cftcCode??o.contract.contractName)).size!==1)return false;
  return (['ASSET_MANAGER','LEVERAGED_MONEY'] as const).every(group=>{
   const s=data.summaries.find(s=>s.market===m&&s.group===group&&s.reportDate===latest),p=rows.find(o=>o.reportDate===latest)?.positions[group];
   return !!s&&!!p&&finite(s.netPosition)&&finite(s.weeklyChange)&&finite(p.long)&&p.long>=0&&finite(p.short)&&p.short>=0&&finite(p.net)&&s.netPosition===p.net&&Math.abs(p.long-p.short-p.net)<0.001;
  });
 });
}
function complete(data:AIResearchCOTData|undefined,markets:COTMarket[],now:number){try{return completeUnsafe(data,markets,now);}catch{return false;}}
function pack(data:AIResearchCOTData,now:number):CacheRecord{
 const {history,dataQuality,...compact}=data;
 return {policy:POLICY,fetchedAt:new Date(now).toISOString(),latestDate:data.latestReportDate!,marketDates:Object.fromEntries([...new Set(data.observations.map(o=>o.market))].map(m=>[m,data.observations.filter(o=>o.market===m).map(o=>o.reportDate).sort().at(-1)!])),data:compact};
}
function unpack(r:CacheRecord):AIResearchCOTData{
 return {...r.data,history:[...new Set(r.data.observations.map(o=>o.market))].flatMap(m=>groups.filter(group=>r.data.observations.some(o=>o.market===m&&o.positions[group])).map(group=>({market:m,group,observations:r.data.observations.filter(o=>o.market===m)})))};
}
const regresses=(next:CacheRecord,old:CacheRecord)=>Object.entries(old.marketDates).some(([m,d])=>!next.marketDates[m]||next.marketDates[m]<d);
const STORE_IF_NOT_OLDER="local n=cjson.decode(ARGV[1]) local ok,old=pcall(cjson.decode,redis.call('GET',KEYS[1]) or '') if ok and type(old)=='table' and old.policy==n.policy and type(old.marketDates)=='table' and type(old.fetchedAt)=='string' then local valid=true for m,d in pairs(old.marketDates) do if type(d)~='string' or not string.match(d,'^%d%d%d%d%-%d%d%-%d%d$') or d>string.sub(n.fetchedAt,1,10) then valid=false end end if valid then local advanced=false for m,d in pairs(old.marketDates) do if not n.marketDates[m] or n.marketDates[m]<d then return 0 end if n.marketDates[m]>d then advanced=true end end if not advanced and old.fetchedAt>n.fetchedAt then return 0 end end end redis.call('SET',KEYS[1],ARGV[1],'EX',ARGV[2]) return 1";
const bounded=async<T>(work:Promise<T>):Promise<T>=>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<T>((_,reject)=>{timer=setTimeout(()=>reject(Error('Cache timeout')),1200);})]);}finally{if(timer)clearTimeout(timer);}};
/** Existing Redis only. No API key, paid service, model call or automatic provider retry. */
export function createCOTCachedFetcher(deps:{now?:()=>number;store?:()=>Store}={}){
 const memory=new Map<string,CacheRecord>(),flight=new Map<string,Promise<FetchCOTResult>>();
 return (input:FetchCOTInput,fetcher:(input:FetchCOTInput)=>Promise<FetchCOTResult>):Promise<FetchCOTResult>=>{
  const markets=[...new Set(input.markets??defaults)].sort(),lookbackWeeks=Math.max(5,Math.min(260,Math.round(finite(input.lookbackWeeks)?input.lookbackWeeks:52)));
  const key='rotation:research:cot:last-valid:v1:'+createHash('sha256').update(JSON.stringify({markets,lookbackWeeks})).digest('hex');
  if(flight.has(key))return flight.get(key)!;
  const task=(async()=>{
   const now=(deps.now??Date.now)(),warnings:string[]=[];let store:Store|undefined,record=memory.get(key);
   const valid=(r:CacheRecord|undefined)=>!!r&&r.policy===POLICY&&finite(Date.parse(r.fetchedAt))&&Date.parse(r.fetchedAt)<=now&&complete(unpack(r),markets,now);
   if(!valid(record))record=undefined;
   try{store=(deps.store??(()=>Redis.fromEnv()))();const raw=await bounded(store.get(key));let persisted:CacheRecord|undefined;try{persisted=(typeof raw==='string'?JSON.parse(raw):raw) as CacheRecord;}catch{persisted=undefined;}
    if(persisted){try{if(valid(persisted)&&(!record||!regresses(persisted,record)&&(regresses(record,persisted)||persisted.fetchedAt>record.fetchedAt)))record=persisted;}catch{/* Corrupt records cannot replace valid memory. */}}
   }catch{warnings.push('COT-Puffer: dauerhafter Speicher nicht erreichbar; vorhandener Prozesspuffer wird geprüft.');}
   const result=(data:AIResearchCOTData,status:'FETCHED'|'RECENT_CACHE'|'LAST_VALID_FALLBACK'|'UNAVAILABLE',fetchedAt:string|null,provider?:FetchCOTResult):FetchCOTResult=>{
    const fallbackUsed=status==='LAST_VALID_FALLBACK';
    const message=status==='UNAVAILABLE'?'COT-Stand fehlt oder ist unvollständig. Verfügbare einzelne Daten bleiben datiert erhalten.':fallbackUsed?'COT-Abruf fehlgeschlagen oder unvollständig; letzter gültiger gespeicherter Stand wird datiert verwendet.':status==='RECENT_CACHE'?'COT aus dem zuletzt erfolgreich geladenen Datenstand.':'COT erfolgreich vom Anbieter geladen.';
    const combined=[...new Set([...(data.diagnostics?.warnings??[]),...(provider?.diagnostics.warnings??[]),...warnings,...(fallbackUsed||status==='UNAVAILABLE'?[message]:[])])];
    const quality={policy:POLICY,status,lastSuccessfulFetchAt:fetchedAt,observationDate:data.latestReportDate,fallbackUsed,providerAttempted:status!=='RECENT_CACHE',message};
    return {data:{...data,dataQuality:quality,diagnostics:{source:data.diagnostics?.source??'CFTC',observationCount:data.observations.length,marketsCovered:[...new Set(data.observations.map(o=>o.market))],warnings:combined}},diagnostics:{source:provider?.diagnostics.source??data.diagnostics?.source??'CFTC',recordsFetched:provider?.diagnostics.recordsFetched??0,observationsCreated:data.observations.length,warnings:combined}};
   };
   if(record&&now-Date.parse(record.fetchedAt)<15*60000)return result(unpack(record),'RECENT_CACHE',record.fetchedAt);
   let loaded:FetchCOTResult|undefined;try{loaded=await fetcher({markets,lookbackWeeks});}catch{warnings.push('CFTC-Anfrage fehlgeschlagen.');}
   const evaluatedAt=(deps.now??Date.now)();
   if(loaded&&complete(loaded.data,markets,evaluatedAt)){
    const next=pack(loaded.data,evaluatedAt);
    if(record&&regresses(next,record))warnings.push('CFTC lieferte einen älteren Marktstand; gültiger Puffer wird beibehalten.');
    else{
     memory.set(key,next);
     const serialized=JSON.stringify(next);
     if(Buffer.byteLength(serialized,'utf8')>900000)warnings.push('COT-Datensatz zu groß für den begrenzten dauerhaften Puffer; nur Prozesspuffer aktualisiert.');
     else if(store)try{await bounded(store.eval(STORE_IF_NOT_OLDER,[key],[serialized,21*86400]));}catch{warnings.push('COT-Daten geladen, aber nicht dauerhaft gespeichert.');}
     return result(loaded.data,'FETCHED',next.fetchedAt,loaded);
    }
   }
   if(record)return result(unpack(record),'LAST_VALID_FALLBACK',record.fetchedAt,loaded);
   const data=loaded?.data??{generatedAt:new Date(now).toISOString(),latestReportDate:null,observations:[],summaries:[],divergences:[],history:[]};
   warnings.push('Kein vollständiger, ausreichend aktueller COT-Puffer vorhanden; fehlende Daten werden nicht ergänzt.');
   return result(data,'UNAVAILABLE',null,loaded);
  })();
  flight.set(key,task);return task.finally(()=>{flight.delete(key);});
 };
}
export const fetchCOTWithCache=createCOTCachedFetcher();
