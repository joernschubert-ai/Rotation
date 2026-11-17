import {inspectMemoryAudit} from './aiResearchMemoryAudit';

export interface ForecastMemoryContext { text:string; caseCount:number; }
export const MEMORY_RETRIEVAL_SYSTEM_RULES = "Wenn der folgende historische Gedächtnisblock vorhanden ist, nutze ihn ausschließlich als datierten Vergleich früherer App-Prognosen mit beobachteten Indexschlusskursen. Vergleiche Abfolge und Kontext mit dem heutigen Stand, nenne Unterschiede und Unsicherheit. Die kleine oder überlappende Stichprobe liefert weder Trefferquote noch Wahrscheinlichkeit. Überstimme keine aktuellen App-Fakten und ändere keine App-Freigabe, Scores, Trade-Stack- oder Positionsgrößenentscheidung. Ein ähnlicher Fall ist kein Wiederholungsversprechen.";
const pct=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?`${v>0?'+':''}${v.toFixed(2)}%`:'unavailable';
async function bounded<T>(work:Promise<T>,ms=1800):Promise<T>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('MEMORY_RETRIEVAL_TIMEOUT')),ms);})]);}finally{if(timer)clearTimeout(timer);}}

/** Read-only pilot retrieval. Only exact, clean forecasts from the fixed clean-start cohort enter a model request. */
export async function loadResearchMemoryContext():Promise<ForecastMemoryContext>{
 try{
  const audit:any=await bounded(inspectMemoryAudit(0,0));
  const rows=Array.isArray(audit?.forecasts)?audit.forecasts:[];
  const eligible=rows.filter((row:any)=>row?.plan?.attribution==='AI_GENERATED'&&
    ['NEW_GROUP_OBSERVED','NEW_GROUP_WAITING'].includes(row?.evaluationCohort?.group)&&
    Array.isArray(row?.audit?.issues)&&row.audit.issues.length===0&&
    row.audit.sourceCheck==='SOURCE_META_MATCHES'&&row.audit.scenarioCheck==='EXACT_ORIGINAL_FORECAST'&&
    row?.plan?.scenarioEpisodeId&&row?.plan?.market&&row?.plan?.direction)
   .sort((a:any,b:any)=>Date.parse(b.plan.createdAt)-Date.parse(a.plan.createdAt)).slice(0,4);
  if(!eligible.length)return {text:'',caseCount:0};
  const episodeCount=new Set(eligible.map((row:any)=>row.plan.scenarioEpisodeId)).size;
  const lines=eligible.map((row:any)=>{
   const p=row.plan,assessment=row.currentSourceAssessment,anchor=assessment?.anchor;
   const outcomes=Array.isArray(assessment?.outcomes)?assessment.outcomes.filter((o:any)=>o?.status==='MATURED_OBSERVED'&&o?.metrics&&[5,10,20].includes(o.horizon)).map((o:any)=>{
    const m=o.metrics;return `${o.horizon} observed closes through ${m.endDate}: index ${pct(m.indexReturnPct)}, directionalHit ${m.directionalHit===true?'yes':m.directionalHit===false?'no':'unknown'}, max/min close path ${pct(m.maxCloseReturnPct)}/${pct(m.minCloseReturnPct)}`;
   }):[];
   return `- ${p.market} ${p.direction}; issued ${String(p.createdAt).slice(0,10)}; first eligible observed close ${anchor?.date??'not observed'}${outcomes.length?'; '+outcomes.join('; '):'; outcome still waiting'}; thesis: ${String(p.statement).slice(0,220)}; counterpoint: ${String(p.counterargument).slice(0,160)}`;
  });
  return {caseCount:eligible.length,text:[
   `Fixed clean-start cohort; ${eligible.length} provenance-checked forecast(s), ${episodeCount} originating episode(s). Include all selected cases regardless of direction or result; this is a tiny, potentially overlapping sample, not a hit rate or calibrated probability. Dates/outcomes are observed index closes, not option returns or actionable entry prices.`,
   ...lines,
   'Description: historical close-based cases; tiny or overlapping sample; not a hit rate, probability, option return, or actionable entry price.'
  ].join('\n')};
 }catch{return {text:'',caseCount:0};}
}