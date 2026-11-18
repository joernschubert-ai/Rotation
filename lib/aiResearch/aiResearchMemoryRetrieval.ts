import {inspectMemoryAudit} from './aiResearchMemoryAudit';
import {Redis} from '@upstash/redis';
import {memoryBounded,MEMORY_PREFIX} from './aiResearchMemoryStore';
import {MEMORY_COHORT} from './aiResearchMemoryCohort';

export interface ForecastMemoryContext { text:string; caseCount:number; }
export const MEMORY_RETRIEVAL_SYSTEM_RULES = "Wenn historische Gedächtnisfälle vorhanden sind, vergleiche sie nur als datierte frühere App-Prognosen samt beobachteten Indexschlusskursen. Fälle sind nach Markt/Richtung ausgewählt; prüfe ihre frühere These und Gegenargumente gegen die heutige Lage. Nenne Ähnlichkeiten, Unterschiede und Unsicherheit. Zeitstichprobe und kleine/überlappende Stichprobe sind weder Trefferquote noch Wahrscheinlichkeit. Überstimme keine aktuellen App-Fakten und ändere keine Freigaben, Scores, Trade-Stack- oder Positionsgrößenentscheidung.";
const pct=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?`${v>0?'+':''}${v.toFixed(2)}%`:'unavailable';
async function bounded<T>(work:Promise<T>,ms=7500):Promise<T>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('MEMORY_RETRIEVAL_TIMEOUT')),ms);})]);}finally{if(timer)clearTimeout(timer);}}

/**
 * Read-only, lifetime-spanning retrieval from three evenly spaced positions in
 * the permanent forecast index. Each sampled page is checked by the existing
 * integrity audit. A short timeout keeps this optional context from blocking
 * the ordinary Research report.
 */
export async function loadResearchMemoryContext():Promise<ForecastMemoryContext>{
 try{
  const cohortStart=Date.parse(MEMORY_COHORT.startsAt);
  const indexedCount=Number(await memoryBounded(Redis.fromEnv().zcount(MEMORY_PREFIX+':forecasts',cohortStart,'+inf')));
  if(!Number.isFinite(indexedCount)||indexedCount<0)return {text:'',caseCount:-1};
  if(indexedCount===0)return {text:'',caseCount:0};
  const sampleRanks=[0,Math.floor((indexedCount-1)/2),indexedCount-1];
  const offsets=[...new Set(sampleRanks.map(rank=>Math.floor(Math.min(rank,100000)/10)*10))];
  const pages=await bounded(Promise.allSettled(offsets.map(offset=>inspectMemoryAudit(0,offset))),7500);
  const forecasts=new Map<string,{plan:any;currentSourceAssessment:any}>();
  for(const result of pages){
   if(result.status!=='fulfilled')continue;
   const audit:any=result.value,check=audit?.retrievalCheck;
   if(check?.version!=='FORECAST_MEMORY_RETRIEVAL_DIAGNOSTIC_V1'||!Array.isArray(check.rowChecks))continue;
   const eligibleIds=new Set(check.rowChecks.filter((row:any)=>row?.eligible===true&&typeof row.forecastId==='string').map((row:any)=>row.forecastId));
   for(const row of Array.isArray(audit.forecasts)?audit.forecasts:[]){
    const plan=row?.plan;
    if(!eligibleIds.has(plan?.id)||typeof plan?.scenarioEpisodeId!=='string')continue;
    forecasts.set(plan.id,{plan,currentSourceAssessment:row.currentSourceAssessment});
   }
  }
  const targets=[
   {market:'NASDAQ',direction:'DOWN',tag:'N/P'},
   {market:'NASDAQ',direction:'UP',tag:'N/C'},
   {market:'RUSSELL_2000',direction:'UP',tag:'R/C'},
  ];
  const all=[...forecasts.values()].sort((a,b)=>Date.parse(b.plan.createdAt)-Date.parse(a.plan.createdAt));
  const found=all.filter(({plan})=>targets.some(t=>plan.market===t.market&&plan.direction===t.direction));
  if(!found.length)return {text:'',caseCount:0};
  const selected:Array<{plan:any;currentSourceAssessment:any;tag:string}>=[];
  // First pass gives each strategy its most recent eligible case; second pass
  // adds an older time-spaced case where the archive has one.
  for(const older of [false,true])for(const target of targets){
   const matches=found.filter(({plan})=>plan.market===target.market&&plan.direction===target.direction);
   const choice=older?matches.at(-1):matches[0];
   if(choice&&!selected.some(x=>x.plan.id===choice.plan.id)&&(!older||matches.length>1))selected.push({...choice,tag:target.tag});
  }
  const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v))?v.slice(5,10):'??-??';
  const short=(v:unknown,n:number)=>typeof v==='string'?v.replace(/\s+/g,' ').trim().slice(0,n):'';
  const lines=selected.map(({plan:p,currentSourceAssessment:assessment,tag})=>{
   const anchor=assessment?.anchor,primary=Array.isArray(assessment?.outcomes)?assessment.outcomes.find((o:any)=>o?.horizon===20):null;
   const result=primary?.status==='MATURED_OBSERVED'&&primary.metrics
    ?`20 ${pct(primary.metrics.indexReturnPct)} / Tief ${pct(primary.metrics.minCloseReturnPct)}`
    :'20 wartet';
   return `- ${tag} ${date(p.createdAt)} Anker ${date(anchor?.date)} ${result}; These ${short(p.statement,38)}; Gegen ${short(p.counterargument,20)}`;
  });
  return {caseCount:found.length,text:[
   `Zeitstichprobe aus ${indexedCount} indexierten Prognosen seit ${MEMORY_COHORT.startsAt.slice(0,10)}; ${found.length} geprüfte Fälle für die drei Instrumentrichtungen gefunden, ${selected.length} kompakt ausgewählt. Keine Trefferquote.`,
   ...lines
  ].join('\n')};
 }catch{return {text:'',caseCount:-1};}
}
