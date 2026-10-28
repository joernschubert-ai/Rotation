type Row=Record<string,any>;
const row=(v:unknown):Row=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Row:{};
const rows=(v:unknown):Row[]=>Array.isArray(v)?v.map(row):[];
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:null;

/** Compact source-bound projections only; never recalculates a state or selects a signal. */
export function diagnosticModelValue(f:{id:string;domain:string;values:Record<string,unknown>}):unknown|undefined{
 const v=f.values;
 if(f.domain==='Historische Vergleiche')return {family:v.family,state:v.state,currentMatch:v.currentMatch,followingIntervals:20,...(v.family==='ROTATION_20D'?{selectionLookbackIntervals:20}:{}),statistics:v.statistics,validation:v.validation};
 if(f.domain==='Kursverlauf'&&/-WINDOW-\d+$/.test(f.id)&&row(v.periodBinding).kind==='OBSERVED_ROLLING_RETURN')return [v.sessions,'Sitzungsintervalle',v.fromDate,v.toDate,v.returnPct];
 if(f.domain==='Preisbedingungen')return {price:v.price,direction:v.direction,state:v.state};
 if(f.domain==='Instrumentbedingungen und Risiken'){
  const b=row(v.binding),risk=row(b.counterRisk);
  return {instrument:b.instrument,favorable:b.favorableReferenceIds,counterRisk:{direction:risk.direction,refs:risk.referenceIds},
   forming:rows(b.conditions).filter(c=>Array.isArray(b.formingTriggerIds)&&b.formingTriggerIds.includes(c.id)).map(c=>[c.id,c.sourceFindingId,c.price,c.direction,c.state,c.effect])};
 }
 if(f.domain==='Kurse'&&f.id.endsWith('-CLOSE'))return v;
 if(f.domain==='Kurse'&&f.id.endsWith('-DRAWDOWN'))return v;
 if(f.domain==='Kalenderwochen'&&f.id.endsWith('-AFTER-WEEK'))return v;
 if(f.domain==='Kurse'&&/-MA(?:20|50|200)$/.test(f.id))return {period:v.period,average:v.average,relation:v.relation};
 if(f.domain==='Struktur und Phase')return {phase:v.phase,breadth:v.breadth,participation:v.participation,quality:v.quality,coverage:v.coverage};
 if(f.domain==='Historische Zeitprüfung'){
  const current=row(v.current20),mature=row(current.mature),nonOverlap=row(current.nonOverlappingEpisodeStarts);
  return [v.family,v.currentState,number(mature.count),number(nonOverlap.count),
   rows(v.folds20).map(fold=>{
    const state=rows(fold.states).find(s=>s.state===v.currentState),test=row(state?.test);
    return [number(test.count),state?.meanSignAgreement==='SAME_SIGN'?true:state?.meanSignAgreement==='DIFFERENT_SIGN'?false:null];
   }),number(mature.meanReturn)];
 }
 if(f.id==='NEWS-EVENT-OVERVIEW'){
  const e=row(v.eventContext),records=rows(e.records),opposing=row(e.opposingWordings);
  return {lexicalHintsOnly:true,independentEvents:e.independentEventCount??null,
   modes:Object.fromEntries([...new Set(records.map(r=>r.modeHint))].map(mode=>[mode,records.filter(r=>r.modeHint===mode).map(r=>r.sourceCardId)])),
   candidates:rows(e.eventCandidates).map(c=>({key:c.key,sourceIds:c.sourceCardIds,confirmed:false})),
   opposingYieldWords:e.opposingWordings?{up:opposing.upSourceIds,down:opposing.downSourceIds,confirmedContradiction:false}:null,
   personalFinanceReview:records.filter(r=>r.personalFinanceReview===true).map(r=>r.sourceCardId)};
 }
 return undefined;
}
