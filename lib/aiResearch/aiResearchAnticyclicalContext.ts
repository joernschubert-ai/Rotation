import {assessAsymmetricRecovery} from './aiResearchAsymmetricEvidence';
import {recoveryBreadthRows,breadthRecoverySignals} from './aiResearchEarlyRecoverySignals';
import type {AppFacts,AppFact} from './aiResearchAppFacts';
import {completedDailyCutoff} from './aiResearchChartContext';
const validDay=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const obj=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const round=(v:unknown)=>finite(v)?Math.round(v*100)/100:null;
export const ANTI_CONTEXT_VERSION='ANTICYCLICAL_ENTRY_CONTEXT_V1';
const rules=['DRAWDOWN_252','RSI_RECLAIM'] as const;
/** Fixed rule projection. Never select a rule by its backtest return. */
function summarizeRule(rule:Record<string,any>){
 const current=obj(rule.current);
 if(typeof current.active!=='boolean'||current.latestSignalDate!==null&&!validDay(current.latestSignalDate)||current.intervalsSinceSignal!==null&&(!Number.isInteger(current.intervalsSinceSignal)||current.intervalsSinceSignal<0))throw Error('ANTI_INVALID_RULE_FRAME');
 const horizons=[60,80].map(h=>{
  const rows=Array.isArray(rule.horizons)?rule.horizons.filter((r:any)=>r.horizonIntervals===h):[];
  if(rows.length!==1)throw Error('ANTI_HORIZON_MISSING');
  const row=rows[0],s=obj(row.nonOverlapping),baseline=obj(row.baseline);
  if(!Number.isInteger(s.matureCases)||s.matureCases<0||!Number.isInteger(baseline.matureCases)||baseline.matureCases<0)throw Error('ANTI_SAMPLE_INVALID');
  for(const k of ['meanReturnPct','medianReturnPct','p10ReturnPct','p90ReturnPct','medianWorstFurtherCloseChangePct'])if(s.matureCases>0?!finite(s[k]):s[k]!==null)throw Error('ANTI_STAT_INVALID');
  if(baseline.matureCases>0?!finite(baseline.meanReturnPct):baseline.meanReturnPct!==null)throw Error('ANTI_BASELINE_INVALID');
  if(s.matureCases&&(s.p10ReturnPct>s.medianReturnPct||s.medianReturnPct>s.p90ReturnPct||s.medianWorstFurtherCloseChangePct>0))throw Error('ANTI_STAT_ORDER');
  return {horizonIntervals:h,statistics:s,baseline,byMA200:row.byMA200??[],periods:row.periods??[]};
 });
 return {id:rule.id,title:rule.title,stage:rule.stage,definition:rule.definition,current,horizons};
}
function bindMarket(facts:AppFacts,study:unknown,market:string,entry:AppFact,history:any[]){
 const root=obj(study),rows=Array.isArray(root.markets)?root.markets.filter((m:any)=>m.market===market):[],m=obj(rows[0]),f=obj(m.currentFeatures),prefix=market==='NASDAQ'?'N-F':'R-F';
 const closes=facts.facts.filter(f=>f.id===prefix+'-CLOSE'&&f.market===market&&f.status!=='MISSING'),close=closes[0];
 if(root.version!=='ANTICYCLICAL_CLOSE_STUDY_V1'||root.ok!==true||rows.length!==1||m.symbol!==(market==='NASDAQ'?'^NDX':'^RUT')||m.status!=='AVAILABLE'||obj(m.coverage).historyIncludes2012!==true)throw Error('ANTI_HISTORY_UNAVAILABLE');
 if(closes.length!==1||!close||!entry.asOf||entry.asOf!==close.asOf||m.lastSuppliedDate!==entry.asOf||f.date!==entry.asOf||entry.asOf>completedDailyCutoff(new Date(facts.snapshotTimestamp))||!finite(close.values.close)||!finite(f.close)||Math.abs(close.values.close-f.close)>.005)throw Error('ANTI_PRICE_FRAME_MISMATCH');
 if(!finite(f.rsi14)||f.rsi14<0||f.rsi14>100||!finite(f.drawdown252)||f.drawdown252>0)throw Error('ANTI_CURRENT_FEATURE_INVALID');
 const selected=rules.map(id=>{const found=Array.isArray(m.studies)?m.studies.filter((r:any)=>r.id===id):[];if(found.length!==1)throw Error('ANTI_RULE_MISSING');return summarizeRule(found[0]);});
 for(const r of selected)if(r.current.latestSignalDate!==null&&r.current.latestSignalDate>entry.asOf)throw Error('ANTI_FUTURE_SIGNAL');
 return {version:ANTI_CONTEXT_VERSION,status:'AVAILABLE',market,asOf:entry.asOf,source:'ANTICYCLICAL_CLOSE_STUDY_V1',
  earlyRecovery:m.earlyRecovery?.version==='EARLY_RECOVERY_SIGNALS_V1'&&m.earlyRecovery.asOf===entry.asOf?{...m.earlyRecovery,signals:[...m.earlyRecovery.signals,...breadthRecoverySignals(recoveryBreadthRows(history,market,Array.isArray(m.recoverySessions)?m.recoverySessions:[],facts.snapshotTimestamp),entry.asOf)]}:null,
  asymmetricEvidence:m.asymmetricEvidence?.version==='ASYMMETRIC_INDEX_EVIDENCE_V1'&&m.asymmetricEvidence.asOf===entry.asOf?m.asymmetricEvidence:null,
  sourceCoverage:m.coverage,rsi14:f.rsi14,drawdown252Pct:f.drawdown252,rules:selected,ruleSelection:'FIXED_DRAWDOWN_252_AND_RSI_RECLAIM_NOT_BEST_RETURN',
  historicalReturnsAreOptionsReturns:false,calibratedProbability:false,positionSizingChanged:false,
  meaning:'60/80 beobachtete Folgeintervalle ab naechstem Schluss nach historischem Signal; alle Marktphasen. Kein heutiger Renditeimpuls oder garantierter Boden.'};
}
export function attachAnticyclicalContext(facts:AppFacts,study:unknown,history:any[]=[]):AppFacts{
 const changed=facts.facts.map(f=>{
  if(!['N-F-ENTRY-TIMING','R-F-ENTRY-TIMING'].includes(f.id)||f.status!=='CALCULATED')return f;
  let anti:Record<string,any>;
  try{anti=bindMarket(facts,study,f.market,f,history);}catch(error){anti={version:ANTI_CONTEXT_VERSION,status:'UNAVAILABLE',reason:error instanceof Error?error.message:'ANTI_UNAVAILABLE'};}
  if(anti.status==='AVAILABLE')anti.asymmetricDecision=assessAsymmetricRecovery(anti);
  const rule=anti.status==='AVAILABLE'?anti.rules.find((r:any)=>r.id==='RSI_RECLAIM'):null;
  const sentence=anti.status==='AVAILABLE'?` Antizyklischer Kontext ${anti.asOf}: RSI14 ${anti.rsi14.toFixed(2)}, Rueckkehr ueber30 ${rule.current.active?'heute erkannt':'heute nicht erkannt'}, Abstand252Hoch ${anti.drawdown252Pct.toFixed(2)}%. Eigene historische60/80-Intervall-Folgen mit Basis und weiteren Rueckgaengen separat in values.anticyclical; keine Optionsrendite/automatische Freigabe.`:'';
  const baseText=typeof f.values.anticyclicalBaseText==='string'?f.values.anticyclicalBaseText:f.text;
  return {...f,text:baseText+sentence,values:{...f.values,anticyclicalBaseText:baseText,anticyclical:anti}};
 });
 return {...facts,facts:changed};
}
/** One small named block inside the existing entry fact, not another source or vote. */
export function compactAnticyclicalContext(value:unknown){
 const a=obj(value);if(a.version!==ANTI_CONTEXT_VERSION||a.status!=='AVAILABLE'||!Array.isArray(a.rules))return undefined;
 const result:Record<string,unknown>={rsi14:round(a.rsi14),drawdown252Pct:round(a.drawdown252Pct),allMarketRegimes:true,columns:['n','meanPct','medianPct','p10Pct','p90Pct','medianFurtherLowPct','baselineMeanPct'],rules:[]};
 for(const id of rules){
  const r=a.rules.find((r:any)=>r.id===id);if(!r||!Array.isArray(r.horizons)||!r.current||![60,80].every(h=>r.horizons.filter((x:any)=>x.horizonIntervals===h&&x.statistics&&x.baseline).length===1))return undefined;
  const stats=[60,80].map(horizon=>{const h=r.horizons.find((x:any)=>x.horizonIntervals===horizon),s=h.statistics;return [s.matureCases,round(s.meanReturnPct),round(s.medianReturnPct),round(s.p10ReturnPct),round(s.p90ReturnPct),round(s.medianWorstFurtherCloseChangePct),round(h.baseline.meanReturnPct)];});
  (result.rules as unknown[]).push({id,currentSatisfied:r.current.active,ageIntervals:r.current.intervalsSinceSignal,follow60:stats[0],follow80:stats[1]});
 }
 if(a.earlyRecovery?.version==='EARLY_RECOVERY_SIGNALS_V1')result.early={rsiChange:round(a.earlyRecovery.rsiChange),events:a.earlyRecovery.signals.filter((s:any)=>s.status==='TODAY'||s.status==='RECENT').map((s:any)=>[s.id,s.ageIntervals])};
 if(a.asymmetricDecision?.version==='ASYMMETRIC_DECISION_V1'){const d=a.asymmetricDecision;result.asym=[({POSSIBLE_RECOVERY:'P',UNFAVORABLE_HISTORY:'U',NO_RECENT_SETUP:'N',NO_PRICE_SETUP:'N',OPEN:'O',UNKNOWN:'?'} as Record<string,string>)[d.status]??'?',d.weight,d.confluence.areas,({RSI_RECLAIM:'R',RSI_FAILURE_SWING:'F',RSI_DIVERGENCE:'D',MA20_RECLAIM_STRESS:'M'} as Record<string,string>)[d.basisId??'']??null];}
 return result;
}
