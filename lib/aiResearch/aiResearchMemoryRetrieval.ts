import {inspectMemoryAudit} from './aiResearchMemoryAudit';

export interface ForecastMemoryContext { text:string; caseCount:number; }
export const MEMORY_RETRIEVAL_SYSTEM_RULES = "Wenn der folgende historische Gedächtnisblock vorhanden ist, nutze ihn ausschließlich als datierten Vergleich früherer App-Prognosen mit beobachteten Indexschlusskursen. Vergleiche Abfolge und Kontext mit dem heutigen Stand, nenne Unterschiede und Unsicherheit. Die kleine oder überlappende Stichprobe liefert weder Trefferquote noch Wahrscheinlichkeit. Überstimme keine aktuellen App-Fakten und ändere keine App-Freigabe, Scores, Trade-Stack- oder Positionsgrößenentscheidung. Ein ähnlicher Fall ist kein Wiederholungsversprechen.";
const pct=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?`${v>0?'+':''}${v.toFixed(2)}%`:'unavailable';
async function bounded<T>(work:Promise<T>,ms=18000):Promise<T>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('MEMORY_RETRIEVAL_TIMEOUT')),ms);})]);}finally{if(timer)clearTimeout(timer);}}

/** Read-only pilot retrieval. Only exact, clean forecasts from the fixed clean-start cohort enter a model request. */
export async function loadResearchMemoryContext():Promise<ForecastMemoryContext>{
 try{
  const audit:any=await bounded(inspectMemoryAudit(0,0));
  const rows=Array.isArray(audit?.forecasts)?audit.forecasts:[];
  const check=audit?.retrievalCheck;
  if(check?.version!=='FORECAST_MEMORY_RETRIEVAL_DIAGNOSTIC_V1'||!Array.isArray(check.selectedCases))return {text:'',caseCount:-1};
  const selectedIds=new Set(check.selectedCases.map((item:any)=>item?.forecastId).filter((id:any)=>typeof id==='string'));
  const eligible=rows.filter((row:any)=>selectedIds.has(row?.plan?.id));
  if(eligible.length!==selectedIds.size)return {text:'',caseCount:-1};
  eligible.sort((a:any,b:any)=>Date.parse(b.plan.createdAt)-Date.parse(a.plan.createdAt));
  if(!eligible.length)return {text:'',caseCount:0};
  const episodeCount=new Set(eligible.map((row:any)=>row.plan.scenarioEpisodeId)).size;
  const lines=eligible.map((row:any)=>{
   const p=row.plan,assessment=row.currentSourceAssessment,anchor=assessment?.anchor;
   const outcomes=Array.isArray(assessment?.outcomes)?assessment.outcomes.filter((o:any)=>o?.status==='MATURED_OBSERVED'&&o?.metrics&&[5,10,20].includes(o.horizon)).map((o:any)=>{
    const m=o.metrics;return `${o.horizon}@${String(m.endDate).slice(5)} ${pct(m.indexReturnPct)} hit=${m.directionalHit===true?'yes':m.directionalHit===false?'no':'?'} path=${pct(m.maxCloseReturnPct)}/${pct(m.minCloseReturnPct)}`;
   }):[];
   return `- ${p.market}/${p.direction} ${String(p.createdAt).slice(5,10)} anchor=${anchor?.date?.slice(5)??'?'} ${outcomes.join(' ')} T:${String(p.statement).slice(0,55)} C:${String(p.counterargument).slice(0,35)}`;
  });
  return {caseCount:eligible.length,text:[
   `${eligible.length} geprüfte Fälle/${episodeCount} Ursprungsfolge(n); kleine Stichprobe, keine Trefferquote.`,
   ...lines,
   'Description: historical close-based cases; tiny or overlapping sample; not a hit rate, probability, option return, or actionable entry price.'
  ].join('\n')};
 }catch{return {text:'',caseCount:-1};}
}
