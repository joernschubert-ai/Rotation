import {inspectMemoryAudit} from './aiResearchMemoryAudit';
import {Redis} from '@upstash/redis';
import {memoryBounded,MEMORY_PREFIX} from './aiResearchMemoryStore';
import {MEMORY_COHORT} from './aiResearchMemoryCohort';

export interface ForecastMemoryContext { text:string; caseCount:number; }
export const MEMORY_RETRIEVAL_SYSTEM_RULES = "Wenn der folgende historische Gedächtnisblock vorhanden ist, nutze ihn ausschließlich als datierten Vergleich früherer App-Prognosen mit beobachteten Indexschlusskursen. Vergleiche Abfolge und Kontext mit dem heutigen Stand, nenne Unterschiede und Unsicherheit. Die kleine oder überlappende Stichprobe liefert weder Trefferquote noch Wahrscheinlichkeit. Überstimme keine aktuellen App-Fakten und ändere keine App-Freigabe, Scores, Trade-Stack- oder Positionsgrößenentscheidung. Ein ähnlicher Fall ist kein Wiederholungsversprechen.";
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
  const targets=indexedCount<=3?[0,Math.floor((indexedCount-1)/2),indexedCount-1]:[0,Math.floor((indexedCount-1)/2),indexedCount-1];
  const offsets=[...new Set(targets.map(rank=>Math.floor(Math.min(rank,100000)/10)*10))];
  const pages=await bounded(Promise.allSettled(offsets.map(offset=>inspectMemoryAudit(0,offset))),7500);
  const episodes=new Map<string,Array<{plan:any;currentSourceAssessment:any}>>();
  for(const result of pages){
   if(result.status!=='fulfilled')continue;
   const audit:any=result.value,check=audit?.retrievalCheck;
   if(check?.version!=='FORECAST_MEMORY_RETRIEVAL_DIAGNOSTIC_V1'||!Array.isArray(check.rowChecks))continue;
   const eligibleIds=new Set(check.rowChecks.filter((row:any)=>row?.eligible===true&&typeof row.forecastId==='string').map((row:any)=>row.forecastId));
   for(const row of Array.isArray(audit.forecasts)?audit.forecasts:[]){
    const plan=row?.plan,id=plan?.scenarioEpisodeId;
    if(!eligibleIds.has(plan?.id)||typeof id!=='string')continue;
    episodes.set(id,[...(episodes.get(id)??[]),{plan,currentSourceAssessment:row.currentSourceAssessment}]);
   }
  }
  if(!episodes.size)return {text:'',caseCount:0};
  const selected=[...episodes.entries()].sort((a,b)=>Date.parse(b[1][0].plan.createdAt)-Date.parse(a[1][0].plan.createdAt)).slice(0,3);
  const lines=selected.flatMap(([,rows])=>{
   const first=rows[0],created=String(first.plan.createdAt),date=Number.isFinite(Date.parse(created))?created.slice(5,10):'??-??';
   const scenarios=rows.slice(0,3).map(({plan:p,currentSourceAssessment:assessment})=>{
    const anchor=assessment?.anchor;
    const outcomes=Array.isArray(assessment?.outcomes)?assessment.outcomes.filter((o:any)=>o?.status==='MATURED_OBSERVED'&&o?.metrics&&[5,10,20].includes(o.horizon)).map((o:any)=>{
     const m=o.metrics;return `${o.horizon}@${String(m.endDate).slice(5)} ${pct(m.indexReturnPct)} hit=${m.directionalHit===true?'yes':m.directionalHit===false?'no':'?'} path=${pct(m.maxCloseReturnPct)}/${pct(m.minCloseReturnPct)}`;
    }):[];
    return `  ${p.market}/${p.direction} anchor=${anchor?.date?.slice(5)??'?'} ${outcomes.join(' ')} T:${String(p.statement).slice(0,55)} C:${String(p.counterargument).slice(0,35)}`;
   });
   return [`Episode ${date}:`,...scenarios];
  });
  return {caseCount:selected.length,text:[
   `Lebenslang indexierte Zeitstichprobe: ${indexedCount} Prognoseeinträge seit ${MEMORY_COHORT.startsAt.slice(0,10)}; ${selected.length} geprüfte Episoden aus früher, mittlerer und jüngerer Archivposition. Kleine, nicht unabhängige Auswahl; keine Trefferquote.`,
   ...lines,
   'Nur datierter Vergleich. Keine Wahrscheinlichkeit, Optionsrendite oder Handlungsanweisung.'
  ].join('\n')};
 }catch{return {text:'',caseCount:-1};}
}
