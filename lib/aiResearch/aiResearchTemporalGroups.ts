import type {AppFact} from './aiResearchAppFacts';
type Fact=AppFact;
const obj=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v))?v:null;
const sign=(v:number|null)=>v===null?'UNKNOWN':v>0?'POSITIVE':v<0?'NEGATIVE':'ZERO';
/** Descriptive grouping only; never a phase engine, numerical weight, vote or forecast. */
export function buildTemporalGroups(facts:Fact[],snapshotTimestamp:string,allowed:ReadonlySet<string>){
 const stamp=Date.parse(snapshotTimestamp);
 if(!Number.isFinite(stamp))throw Error('TEMPORAL_INVALID_SNAPSHOT');
 return {version:'APP_TEMPORAL_GROUPS_V1',snapshotTimestamp,origin:'APP_SOURCE_VALUES_NOT_MODEL',markets:['NASDAQ','RUSSELL_2000'].map(market=>{
  const prefix=market==='NASDAQ'?'N-F-':'R-F-';
  function observation(id:string,kind:'ROLLING'|'CALENDAR_WEEK'|'AFTER_WEEK',count:number|null){
   const matches=facts.filter(f=>f.id===id),f=matches.length===1?matches[0]:undefined;
   let issue=matches.length>1?'DUPLICATE_SOURCE':!f?'MISSING_SOURCE':f.market!==market?'WRONG_MARKET':!allowed.has(id)?'OUTSIDE_OBSERVED_CONTEXT':f.status==='MISSING'?'MISSING_DATA':!date(f.asOf)?'UNKNOWN_DATE':Date.parse(f.asOf!)>stamp?'FUTURE_DATA':null;
   const value=obj(f?.values),payload=kind==='ROLLING'?value:kind==='CALENDAR_WEEK'?obj(value.week):obj(value.after),binding=obj(value.periodBinding);
   const supplied=payload.returnPct;
   const fromDate=date(kind==='CALENDAR_WEEK'?payload.calendarWeekStart:payload.fromDate),toDate=date(kind==='CALENDAR_WEEK'?payload.calendarWeekEnd:payload.toDate);
   if(!issue&&kind==='CALENDAR_WEEK'&&payload.available!==true)issue='WEEK_NOT_AVAILABLE';
   if(!issue&&kind==='ROLLING'&&payload.sessions!==count)issue='INTERVAL_COUNT_MISMATCH';
   if(!issue&&kind==='ROLLING'&&binding.kind!==undefined&&binding.kind!=='OBSERVED_ROLLING_RETURN')issue='PERIOD_KIND_MISMATCH';
   if(!issue&&kind==='CALENDAR_WEEK'&&binding.kind!==undefined&&binding.kind!=='COMPLETED_CALENDAR_WEEK')issue='PERIOD_KIND_MISMATCH';
   if(!issue&&binding.count!==undefined&&kind==='ROLLING'&&binding.count!==count)issue='BINDING_COUNT_MISMATCH';
   if(!issue&&binding.fromDate!==undefined&&binding.fromDate!==fromDate)issue='PERIOD_BINDING_MISMATCH';
   if(!issue&&binding.toDate!==undefined&&binding.toDate!==toDate)issue='PERIOD_BINDING_MISMATCH';
   if(!issue&&(!fromDate||!toDate))issue='UNKNOWN_PERIOD';
   if(!issue&&fromDate&&toDate&&(Date.parse(fromDate)>Date.parse(toDate)||Date.parse(toDate)>Date.parse(f!.asOf!)))issue='PERIOD_DATE_MISMATCH';
   if(!issue&&!finite(supplied))issue='UNKNOWN_RETURN';
   const valuePct=!issue&&finite(supplied)?supplied:null;
   return {sourceId:id,kind,observedIntervals:kind==='ROLLING'?count:null,fromDate,toDate,asOf:f?.asOf??null,returnPct:valuePct,sign:sign(valuePct),available:issue===null,issue,
    baselineDate:kind==='CALENDAR_WEEK'?date(payload.baselineDate):null,observedSessions:kind==='CALENDAR_WEEK'&&finite(payload.observedSessions)?payload.observedSessions:null,
    cumulativeSinceWeekBaselinePct:kind==='AFTER_WEEK'&&finite(payload.cumulativeSinceWeekBaselinePct)?payload.cumulativeSinceWeekBaselinePct:null,
    suppliedText:f?.text??null};
  }
  const rolling=[1,5,10,20,30,60].map(n=>observation(prefix+'WINDOW-'+n,'ROLLING',n));
  function cohort(key:string,intervals:number[],label:string){
   const members=rolling.filter(r=>intervals.includes(r.observedIntervals!)),complete=members.every(r=>r.available),sameEnd=complete&&new Set(members.map(r=>r.toDate)).size===1;
   const signs=[...new Set(members.map(r=>r.sign))];
   const state=!complete?'INCOMPLETE':!sameEnd?'NOT_COMPARABLE':signs.length===1?signs[0]:'MIXED';
   return {key,label,sourceIds:members.map(r=>r.sourceId),complete,commonEndDate:sameEnd?members[0].toDate:null,state,
    meaning:'Nur Vorzeichen gelieferter Rückblicke. Keine Fortsetzung, Trendwende oder unabhängige Bestätigung daraus abgeleitet.'};
  }
  const cohorts=[cohort('LATEST_INTERVAL',[1],'Letztes beobachtetes Intervall'),cohort('SHORT_CONTEXT',[5,10],'Jüngere Entwicklung · 5/10 Intervalle'),cohort('MAIN_CONTEXT',[20,30],'Schwerpunkt · 20/30 Intervalle'),cohort('LONG_CONTEXT',[60],'Übergeordneter Kontext · 60 Intervalle')];
  const horizon=rolling.filter(r=>r.observedIntervals!==1),differences=[];
  for(let i=1;i<horizon.length;i++){const a=horizon[i-1],b=horizon[i];if(a.available&&b.available&&a.toDate===b.toDate&&['POSITIVE','NEGATIVE'].includes(a.sign)&&['POSITIVE','NEGATIVE'].includes(b.sign)&&a.sign!==b.sign)differences.push({shorterSourceId:a.sourceId,longerSourceId:b.sourceId,commonEndDate:a.toDate,meaning:'Unterschiedliche Vorzeichen benachbarter Rückblickfenster; kein Wende- oder Einstiegssignal.'});}
  const own=facts.filter(f=>f.market===market&&allowed.has(f.id)&&f.status!=='MISSING'&&date(f.asOf)&&Date.parse(f.asOf!)<=stamp);
  return {market,rolling,cohorts,horizonDifferences:differences,
   calendarWeek:observation(prefix+'WEEK-0','CALENDAR_WEEK',null),afterCompletedWeek:observation(prefix+'AFTER-WEEK','AFTER_WEEK',null),
   priceEvidenceFamilies:[{family:'OBSERVED_RETURNS',sourceIds:own.filter(f=>/-F-(?:WINDOW-\d+|WEEK-0|AFTER-WEEK)$/.test(f.id)).map(f=>f.id)},{family:'MA_RELATIONS',sourceIds:own.filter(f=>/-F-MA(?:20|50|200)$/.test(f.id)).map(f=>f.id)},{family:'PNF_STATES',sourceIds:own.filter(f=>/-F-PF[01]-(?:LAST|FORM|ADV)$/.test(f.id)).map(f=>f.id)}],
   sharedBasis:'Rückblickrenditen, MA und P&F desselben Index beruhen auf dessen Preisverlauf. Keine gemessene Korrelation oder Anzahl unabhängiger Beweise.',independentVotes:false};
 }),limits:'Alle Originalbefunde bleiben erhalten. Kalenderwochen sind keine rollierenden Fünferfenster. Beobachtete Intervalle sind keine unabhängig bestätigte Börsenkalender-Vollständigkeit. Gruppen erzeugen keine Gewichte, Phase, Einstiegserlaubnis oder Prognose.',modelInputChanged:false};
}
