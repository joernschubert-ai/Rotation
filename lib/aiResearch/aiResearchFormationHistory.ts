import { buildPointFigure, detectDoubleFormations, type Formation, type FormationPoint, type FormationContext } from './aiResearchFormations';
type Stage='FORMING'|'CONFIRMED'|'COUNT_FIXED';
interface Event {key:string;family:string;scale:number|null;bias:Formation['bias'];stage:Stage;recognizedIndex:number;recognizedAt:string;sourceDiscoveredAt:string;confirmationLevel:number;invalidationLevel:number;target:Formation['target'];}
interface Outcome {event:Event;entryIndex:number;exitIndex:number;entryDate:string;exitDate:string;rawReturnPct:number;directionalReturnPct:number;favorableClosePct:number;adverseClosePct:number;confirmationAtEntry:boolean;targetResult:'TARGET_FIRST'|'INVALIDATION_FIRST'|'NEITHER'|'NO_TARGET'|'ALREADY_BEHIND_ENTRY'|'AMBIGUOUS';confirmationResult:'CONFIRMATION_FIRST'|'INVALIDATION_FIRST'|'NEITHER'|'CONFIRMED_AT_ENTRY';}
const round=(x:number|null)=>x===null?null:Math.round(x*10000)/10000;
const average=(a:number[])=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
const quantile=(a:number[],q:number)=>{if(!a.length)return null;const sorted=a.slice().sort((x,y)=>x-y),p=(sorted.length-1)*q,i=Math.floor(p);return sorted[i]+(sorted[Math.ceil(p)]-sorted[i])*(p-i);};
export const FORMATION_HISTORY_POLICY='CLOSE_EVENTS_NEXT_CLOSE_FROZEN_LEVELS_V1';

/** Each event is captured when actually emitted by a chronological prefix. */
export function collectFormationEvents(points:FormationPoint[],warmupSessions=252):Event[]{
 const events:Event[]=[],seen=new Set<string>();
 const record=(f:Formation|null,stage:Stage,scale:number|null,i:number)=>{
  if(!f||f.status==='INVALIDATED')return;
  const key=(scale===null?'CLASSIC':String(scale))+':'+f.id+':'+stage;
  if(seen.has(key))return;seen.add(key);
  if(i<warmupSessions)return;
  events.push({key,family:f.family,scale,bias:f.bias,stage,recognizedIndex:i,recognizedAt:points[i].date,sourceDiscoveredAt:f.discoveredAt,
   confirmationLevel:f.confirmationLevel,invalidationLevel:f.invalidationLevel,target:f.target?{...f.target}:null});
 };
 for(const scale of [0.5,1])buildPointFigure(points,scale,obs=>{
  record(obs.forming,'FORMING',scale,obs.index);
  if(obs.latest?.confirmedAt===obs.date)record(obs.latest,'CONFIRMED',scale,obs.index);
  for(const fixed of obs.fixed)record(fixed,'COUNT_FIXED',scale,obs.index);
 });
 for(let i=29;i<points.length;i++)for(const f of detectDoubleFormations(points.slice(0,i+1))){
  if(f.status==='FORMING')record(f,'FORMING',null,i);
  if(f.status==='CONFIRMED')record(f,'CONFIRMED',null,i);
 }
 return events.sort((a,b)=>a.recognizedIndex-b.recognizedIndex||a.key.localeCompare(b.key));
}

/** Entry at the NEXT observed daily close; all barriers and targets frozen before it. */
export function evaluateFormationEvent(points:FormationPoint[],event:Event,horizon:number):Outcome|{excluded:'PENDING'|'INVALIDATED_AT_ENTRY'}{
 const entry=event.recognizedIndex+1,exit=entry+horizon;
 if(exit>=points.length)return {excluded:'PENDING'};
 const base=points[entry].close,bull=event.bias==='BULLISH',sign=bull?1:-1;
 const invalid=(value:number)=>bull?value<=event.invalidationLevel:value>=event.invalidationLevel;
 const confirmed=(value:number)=>bull?value>=event.confirmationLevel:value<=event.confirmationLevel;
 if(invalid(base))return {excluded:'INVALIDATED_AT_ENTRY'};
 const returns=points.slice(entry+1,exit+1).map(p=>100*(p.close/base-1)),signed=returns.map(r=>r*sign);
 let confirmationResult:Outcome['confirmationResult']=confirmed(base)?'CONFIRMED_AT_ENTRY':'NEITHER';
 const target=event.target?.price;
 const behind=target!==undefined&&(bull?target<=base:target>=base);
 let targetResult:Outcome['targetResult']=target===undefined?'NO_TARGET':behind?'ALREADY_BEHIND_ENTRY':'NEITHER';
 for(const point of points.slice(entry+1,exit+1)){
  if(confirmationResult==='NEITHER'){
   if(invalid(point.close))confirmationResult='INVALIDATION_FIRST';else if(confirmed(point.close))confirmationResult='CONFIRMATION_FIRST';
  }
  if(targetResult==='NEITHER'){
   const hit=target!==undefined&&(bull?point.close>=target:point.close<=target);
   if(hit&&invalid(point.close))targetResult='AMBIGUOUS';else if(invalid(point.close))targetResult='INVALIDATION_FIRST';else if(hit)targetResult='TARGET_FIRST';
  }
 }
 return {event,entryIndex:entry,exitIndex:exit,entryDate:points[entry].date,exitDate:points[exit].date,
  rawReturnPct:100*(points[exit].close/base-1),directionalReturnPct:100*(points[exit].close/base-1)*sign,
  favorableClosePct:Math.max(0,...signed),adverseClosePct:Math.min(0,...signed),confirmationAtEntry:confirmed(base),targetResult,confirmationResult};
}

function nonOverlapping(rows:Outcome[]){
 const selected:Outcome[]=[];let occupied=-1;
 for(const row of rows.slice().sort((a,b)=>a.entryIndex-b.entryIndex))if(row.entryIndex>occupied){selected.push(row);occupied=row.exitIndex;}
 return selected;
}
function describe(rows:Outcome[],baseline:number[],sign:number){
 const values=rows.map(r=>r.directionalReturnPct),non=nonOverlapping(rows),mean=average(values),base=average(baseline.map(r=>r*sign));
 return {sampleSize:rows.length,nonOverlappingCount:non.length,meanRawIndexReturnPct:round(average(rows.map(r=>r.rawReturnPct))),meanDirectionalReturnPct:round(mean),
  baselineDirectionalMeanPct:round(base),excessDirectionalMeanPp:round(mean===null||base===null?null:mean-base),medianDirectionalReturnPct:round(quantile(values,0.5)),p10DirectionalReturnPct:round(quantile(values,0.1)),p90DirectionalReturnPct:round(quantile(values,0.9)),
  positiveDirectionalRatePct:round(rows.length?100*rows.filter(r=>r.directionalReturnPct>0).length/rows.length:null),
  meanFavorableClosePct:round(average(rows.map(r=>r.favorableClosePct))),meanAdverseClosePct:round(average(rows.map(r=>r.adverseClosePct))),
  nonOverlappingMeanDirectionalPct:round(average(non.map(r=>r.directionalReturnPct))),
  quality:non.length<30?'LOW_SAMPLE':'DESCRIPTIVE_NOT_VALIDATED',
  targetFirst:rows.filter(r=>r.targetResult==='TARGET_FIRST').length,invalidationBeforeTarget:rows.filter(r=>r.targetResult==='INVALIDATION_FIRST').length,
  neitherTargetNorInvalidation:rows.filter(r=>r.targetResult==='NEITHER').length,ambiguousTargetOrder:rows.filter(r=>r.targetResult==='AMBIGUOUS').length,noTarget:rows.filter(r=>r.targetResult==='NO_TARGET').length,targetBehindEntry:rows.filter(r=>r.targetResult==='ALREADY_BEHIND_ENTRY').length,
  confirmedAtEntry:rows.filter(r=>r.confirmationResult==='CONFIRMED_AT_ENTRY').length,confirmationFirst:rows.filter(r=>r.confirmationResult==='CONFIRMATION_FIRST').length,invalidationBeforeConfirmation:rows.filter(r=>r.confirmationResult==='INVALIDATION_FIRST').length,neitherConfirmationNorInvalidation:rows.filter(r=>r.confirmationResult==='NEITHER').length,
 };
}

function calculate(points:FormationPoint[],warmupSessions:number){
 if(points.some((p,i)=>!Number.isFinite(p.close)||p.close<=0||(i>0&&p.date<=points[i-1].date)))throw Error('Invalid history');
 const events=collectFormationEvents(points,warmupSessions),splitIndex=Math.floor(points.length*0.7);
 const groups=new Map<string,Event[]>();
 for(const event of events){const key=event.family+':'+(event.scale??'CLASSIC')+':'+event.stage;groups.set(key,[...(groups.get(key)??[]),event]);}
 const studies=Array.from(groups,([key,group])=>{
  const sign=group[0].bias==='BULLISH'?1:-1;
  return {key,family:group[0].family,scale:group[0].scale,bias:group[0].bias,stage:group[0].stage,detectedEvents:group.length,
   horizons:[5,20,60].map(horizon=>{
    const evaluated=group.map(e=>evaluateFormationEvent(points,e,horizon)),rows=evaluated.filter((r):r is Outcome=>!('excluded' in r));
    const baseline:number[]=[];for(let i=warmupSessions+1;i+horizon<points.length;i++)baseline.push(100*(points[i+horizon].close/points[i].close-1));
    const early=rows.filter(r=>r.exitIndex<splitIndex),later=rows.filter(r=>r.entryIndex>=splitIndex);
    const earlyBase:number[]=[],laterBase:number[]=[];for(let i=warmupSessions+1;i+horizon<points.length;i++){const value=100*(points[i+horizon].close/points[i].close-1);if(i+horizon<splitIndex)earlyBase.push(value);if(i>=splitIndex)laterBase.push(value);}
    return {horizonSessions:horizon,...describe(rows,baseline,sign),baselineCount:baseline.length,
     pending:evaluated.filter(r=>'excluded' in r&&r.excluded==='PENDING').length,invalidatedAtEntry:evaluated.filter(r=>'excluded' in r&&r.excluded==='INVALIDATED_AT_ENTRY').length,
     segments:{earlier:describe(early,earlyBase,sign),later:describe(later,laterBase,sign),crossBoundaryEventsOmitted:rows.length-early.length-later.length}};
   })};
 });
 return {status:points.length>warmupSessions+61?'AVAILABLE':'INSUFFICIENT_DATA',policy:FORMATION_HISTORY_POLICY,asOfDate:points[points.length-1]?.date??null,firstDate:points[0]?.date??null,
  entryPolicy:'NEXT_OBSERVED_DAILY_CLOSE',grossOnly:true,predictiveEdgeValidated:false,studies,
  diagnostics:{observations:points.length,warmupSessions,totalEvents:events.length,chronologicalSplitDate:points[splitIndex]?.date??null,splitIsUntouchedOutOfSample:false,multipleTestsAdjusted:false},
  limitations:['Descriptive retrospective study; parameters were developed with knowledge of markets. Neither segment is untouched out-of-sample.','No fees, slippage, overnight/open execution, dividends, risk-free returns or option-product returns.','Fixed-horizon returns continue after invalidation; they are not a stop-loss trading strategy.','Barriers and targets frozen at recognition; PRELIMINARY targets are not retroactively replaced by later fixed counts.','Target and invalidation order uses daily closes only, not intraday touches. Target already behind next-close entry is reported separately.','Overlapping event groups and two P&F scales are correlated. Non-overlapping selection applies within each group/horizon, not across all tests.','Baseline is unconditional own-index history, not volatility/regime-matched controls. Difference in means is not validated alpha.','FORMING and CONFIRMED are separate event groups; next-close entry may already have crossed the confirmation threshold.','70/30 chronological segments describe stability only; outcomes crossing the boundary are excluded from both segment summaries.'],
 };
}
export type FormationHistory=ReturnType<typeof calculate>;
export function buildFormationHistory(points:FormationPoint[],warmupSessions=252):FormationHistory{
 return calculate(points,warmupSessions);
}

/** At most two matching studies, 20-session descriptive comparison only. */
export function compactFormationHistory(history:FormationHistory,context:FormationContext){
 const wanted:{family:string;scale:number|null;stage:Stage}[]=[];
 for(const p of context.pointFigure)if(p.forming)wanted.push({family:p.forming.family,scale:p.boxPercent,stage:'FORMING'});
 for(const f of context.classic)if(f.status!=='INVALIDATED')wanted.push({family:f.family,scale:null,stage:f.status==='FORMING'?'FORMING':'CONFIRMED'});
 for(const p of context.pointFigure){const last=p.signals[p.signals.length-1];if(last&&last.status!=='INVALIDATED'&&last.currentRelation==='ALIGNED_WITH_CURRENT_COLUMN')wanted.push({family:last.family,scale:p.boxPercent,stage:'CONFIRMED'});}
 const selected=wanted.slice(0,2).map(w=>{
  const study=history.studies.find(s=>s.family===w.family&&s.scale===w.scale&&s.stage===w.stage),stats=study?.horizons.find(h=>h.horizonSessions===20);
  return {family:w.family,scale:w.scale,stage:w.stage,horizonSessions:20,sampleSize:stats?.sampleSize??0,nonOverlappingCount:stats?.nonOverlappingCount??0,
   directionalMeanPct:stats?.meanDirectionalReturnPct??null,baselineDirectionalMeanPct:stats?.baselineDirectionalMeanPct??null,
   nonOverlappingMeanPct:stats?.nonOverlappingMeanDirectionalPct??null,quality:stats?.quality??'NO_COMPLETED_CASES'};
 });
 return {asOfDate:history.asOfDate,policy:history.policy,selected,omittedMatching:wanted.length-selected.length,
  meaning:'20-session gross signed INDEX returns after next-close entry; BULLISH positive sign, BEARISH reversed sign. Descriptive, overlapping, no validated alpha or option returns. Full 5/20/60 and segment statistics remain in report.'};
}
