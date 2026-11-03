import type {AppFacts,AppFact} from './aiResearchAppFacts';
const object=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const finite=(v:unknown):number|null=>typeof v==='number'&&Number.isFinite(v)?v:null;
const state=(v:number|null)=>v===null?'UNKNOWN':v>0?'NET_LONG':v<0?'NET_SHORT':'FLAT';
const direction=(v:number|null)=>v===null?'UNKNOWN':v>0?'TOWARD_LONG':v<0?'TOWARD_SHORT':'UNCHANGED';
function transition(previous:number|null,net:number|null,delta:number|null){
 if(previous===null||net===null||delta===null)return 'UNKNOWN';
 if(delta===0)return 'UNCHANGED';
 if(previous<0&&net>0)return 'SHORT_TO_LONG';if(previous>0&&net<0)return 'LONG_TO_SHORT';
 if(net===0)return previous<0?'SHORT_TO_FLAT':'LONG_TO_FLAT';if(previous===0)return net>0?'FLAT_TO_LONG':'FLAT_TO_SHORT';
 return net>0?(delta>0?'LONG_OVERHANG_LARGER':'LONG_OVERHANG_SMALLER'):(delta>0?'SHORT_OVERHANG_SMALLER':'SHORT_OVERHANG_LARGER');
}
function pair(a:number|null,b:number|null){return a===null||b===null?'UNKNOWN':a===0||b===0?'ZERO_CHANGE_PRESENT':Math.sign(a)===Math.sign(b)?a>0?'ALIGNED_TOWARD_LONG':'ALIGNED_TOWARD_SHORT':'OPPOSITE_SHIFTS';}
function cotBrief(f:AppFact){
 const v=f.values,net=finite(v.net),changes=Array.isArray(v.changes)?v.changes:[],counts=new Map<number,number>(); for(const c of changes.map(object))if([1,4,13,26].includes(c.weeks))counts.set(c.weeks,(counts.get(c.weeks)??0)+1);
 const horizons=changes.map(object).filter(c=>[1,4,13,26].includes(c.weeks)).map(c=>{
  const delta=finite(c.delta),given=finite(c.previous),calculated=net===null||delta===null?null:net-delta,duplicate=(counts.get(c.weeks)??0)>1;
  const consistent=given===null||calculated===null||Math.abs(given-calculated)<0.000001;
  const previous=duplicate||!consistent?null:given??calculated;
  return {weeks:c.weeks,net,previous,delta:duplicate?null:delta,direction:duplicate?'UNKNOWN':direction(delta),transition:duplicate||!consistent?'UNKNOWN':transition(previous,net,delta),sourcePrevious:given,quality:duplicate?'DUPLICATE_HORIZON':!consistent?'INCONSISTENT_PREVIOUS':delta===null?'MISSING_CHANGE':net===null?'MISSING_NET':'CALCULATED_FROM_SUPPLIED_VALUES'};
 });
 const delta=(weeks:number)=>{const rows=horizons.filter(h=>h.weeks===weeks);return rows.length===1&&rows[0].quality==='CALCULATED_FROM_SUPPLIED_VALUES'?rows[0].delta:null;};
 return {id:f.id,market:f.market,asOf:f.asOf,group:typeof v.group==='string'?v.group:'UNKNOWN',net,netState:state(net),sourceState:v.state??null,horizons,weekVsLong:[4,13].map(weeks=>({weeks,relation:pair(delta(1),delta(weeks))})),publicationTime:v.publicationTime??null,calendarWindowVerified:false,priceDirectionDerived:false};
}
function historyBrief(f:AppFact){
 const v=f.values,stats=object(v.statistics),mean=finite(stats.meanPct),baseline=finite(stats.baselineMeanPct);
 return {id:f.id,market:f.market,asOf:f.asOf,family:v.family??null,state:v.state??null,currentMatch:v.currentMatch===true,followingIntervals:20,statistics:stats,
  absoluteIndexMean:mean===null?'UNKNOWN':mean>0?'POSITIVE':mean<0?'NEGATIVE':'ZERO',
  indexMeanVsBaseline:mean===null||baseline===null?'UNKNOWN':mean>baseline?'ABOVE':mean<baseline?'BELOW':'EQUAL',
  validation:v.validation??'UNKNOWN',independentPredictiveEdgeProven:false};
}
export function buildDomainBriefs(facts:AppFacts,allowed:Set<string>){
 const valid=facts.facts.filter(f=>allowed.has(f.id)&&f.status!=='MISSING'&&f.asOf!==null&&Number.isFinite(Date.parse(f.asOf))&&Date.parse(f.asOf)<=Date.parse(facts.snapshotTimestamp));
 const cot=valid.filter(f=>f.domain==='COT').map(cotBrief),history=valid.filter(f=>f.domain==='Historische Vergleiche').map(historyBrief);
 const groupComparisons=['NASDAQ','RUSSELL_2000'].map(market=>{
  const lm=cot.filter(c=>c.market===market&&c.group==='LEVERAGED_MONEY'),am=cot.filter(c=>c.market===market&&c.group==='ASSET_MANAGER'),a=lm.length===1?lm[0]:null,b=am.length===1?am[0]:null;
  const sameDate=!!a&&!!b&&a.asOf===b.asOf;
  const delta=(c:typeof a,w:number)=>{const hs=c?.horizons.filter(h=>h.weeks===w)??[];return hs.length===1&&hs[0].quality==='CALCULATED_FROM_SUPPLIED_VALUES'?hs[0].delta:null;};
  return {market,sourceIds:[...lm,...am].map(c=>c.id),sameObservationDate:sameDate,netStatesDiffer:sameDate?a!.netState==='UNKNOWN'||b!.netState==='UNKNOWN'?null:a!.netState!==b!.netState:null,
   shifts:[1,4,13,26].map(weeks=>({weeks,relation:sameDate?pair(delta(a,weeks),delta(b,weeks)):'UNKNOWN_DATE_OR_GROUP'})),priceDirectionDerived:false};
 });
 return {version:'DOMAIN_BRIEFS_V1',snapshotTimestamp:facts.snapshotTimestamp,cot,history,groupComparisons,limits:['Beschreibende Positionierung, keine automatische Preisrichtung.','Nettozustand und Änderungen sind verschiedene Größen; keine Bruttotransaktionen oder Motive.','Überlappende Horizonte und Studien sind keine unabhängigen Stimmen.','Historische positive Folgerendite ist kein aktueller Impuls; negativer Mehrertrag ist nicht dasselbe wie negative absolute Rendite.','Veröffentlichungszeit und Kalenderfenster bleiben bei fehlenden Quellangaben unbekannt.']};
}
/** Same source IDs and full app facts. Only COT/history presentation changes in this detached trial. */
export function domainModelView(baseline:string,briefs:ReturnType<typeof buildDomainBriefs>){
 const cots=new Map(briefs.cot.map(c=>[c.id,c])),histories=new Map(briefs.history.map(h=>[h.id,h]));
 const lines=baseline.split('\n').map(line=>{
  const id=/^\[([^\]]+)\]/.exec(line)?.[1];if(!id)return line;
  const c=cots.get(id);if(c)return '['+id+'] '+JSON.stringify({asOf:c.asOf,group:c.group,net:c.net,netState:c.netState,h:c.horizons.map(h=>[h.weeks,h.previous,h.delta,h.transition]),weekVsLong:c.weekVsLong.map(h=>[h.weeks,h.relation]),issues:c.horizons.filter(h=>h.quality!=='CALCULATED_FROM_SUPPLIED_VALUES').map(h=>[h.weeks,h.quality]),publicationTime:c.publicationTime});
  const h=histories.get(id);if(h)return '['+id+'] '+JSON.stringify({asOf:h.asOf,family:h.family,state:h.state,currentMatch:h.currentMatch,followingIntervals:20,statistics:h.statistics,absoluteIndexMean:h.absoluteIndexMean,indexMeanVsBaseline:h.indexMeanVsBaseline,validation:h.validation});
  return line;
 });
 const focused=lines.filter(l=>{const id=/^\[([^\]]+)\]/.exec(l)?.[1];return !!id&&(cots.has(id)||histories.has(id));}),rest=lines.filter(l=>{const id=/^\[([^\]]+)\]/.exec(l)?.[1];return !id||!cots.has(id)&&!histories.has(id);});
 return rest[0]+'\nCOT/HISTORIE ZUERST PRUEFEN: h=[Wochen,Ausgangsnetto,Nettoaenderung,Bestandsbedeutung]. Gruppenvergleich bezeichnet Positionsverschiebungen, keine Kauf-/Verkaufssignale.\n'+focused.join('\n')+'\nGRUPPENVERGLEICH (nur Kontext; sourceIds sind die auswählbaren Originalquellen): '+JSON.stringify(briefs.groupComparisons.map(c=>({market:c.market,sourceIds:c.sourceIds,sameDate:c.sameObservationDate,netStatesDiffer:c.netStatesDiffer,shifts:c.shifts.map(h=>[h.weeks,h.relation])})))+'\n'+rest.slice(1).join('\n');
}
