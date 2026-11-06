const num=(v:any):number|null=>typeof v==='number'&&Number.isFinite(v)?v:null;
const day=(v:any):string|null=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v?v:null;
export function buildEntryContext(frame:any){
 const now=Date.parse(frame?.timestamp??''),indices=frame?.indices??{},futures=frame?.futures??{};
 const specs=[{market:'NASDAQ',index:indices.nasdaq??indices.ndx,future:futures.nasdaq??futures.nq,symbol:'NQ=F'},{market:'RUSSELL_2000',index:indices.russell??indices.rut,future:futures.russell??futures.rty,symbol:'RTY=F'}];
 return {version:'STRUCTURE_VS_NEW_ENTRY_CONTEXT_V1',snapshotTimestamp:frame?.timestamp??null,productionEntryRulesChanged:false,heuristicCalibrated:false,markets:specs.map(s=>{
  const q=s.index?.priceMetrics?.dataQuality??{},rows=Array.isArray(q.observedSessions)?q.observedSessions:[];
  const ordered=rows.length>=2&&rows.every((r:any,i:number)=>day(r.date)!==null&&(i===0||rows[i-1].date<r.date));
  const last=rows.at(-1),prior=rows.at(-2),cashDate=ordered&&q.latestEndpointAvailable!==false?day(last?.date):null;
  const priceOK=cashDate!==null&&Number.isFinite(now)&&cashDate<=new Date(now).toISOString().slice(0,10)&&num(last?.close)!==null&&last.close>0&&num(prior?.close)!==null&&prior.close>0;
  const return1D=priceOK?(last.close/prior.close-1)*100:null;
  const earlier:number[]=[];
  if(priceOK)for(let i=1;i<rows.length-1;i++)if(num(rows[i].close)!==null&&rows[i].close>0&&num(rows[i-1].close)!==null&&rows[i-1].close>0)earlier.push((rows[i].close/rows[i-1].close-1)*100);
  const absRank=return1D!==null&&earlier.length>=20?100*earlier.filter(v=>Math.abs(v)<Math.abs(return1D)).length/earlier.length:null;
  const exceptionalDecline=return1D!==null&&return1D<0&&absRank!==null&&absRank>=95;
  const f=s.future,ref=f?.dataQuality?.sessionReference,observed=Date.parse(f?.quoteTimestamp??''),referenceTime=Date.parse(ref?.referenceTimestamp??'');
  const refOK=ref?.status==='AVAILABLE_OBSERVED_REFERENCE'&&ref.feedSymbol===s.symbol&&ref.referenceDate===cashDate&&ref.referenceDefinition==='SAME_CONTINUOUS_FEED_PROVIDER_BAR_TIMESTAMP_1600_NEW_YORK'&&num(ref.returnPct)!==null&&Number.isFinite(observed)&&Number.isFinite(referenceTime)&&referenceTime<observed&&observed<=now+60000&&now-observed<=30*60000&&ref.observationTimestamp===f.quoteTimestamp;
  const referenceMove=refOK?ref.returnPct:null;
  const entryReview=exceptionalDecline?'REVIEW_AFTER_EXCEPTIONAL_DECLINE':return1D!==null&&return1D<0?'DECLINE_NOT_EQUAL_TO_ENTRY_EDGE':'NO_EXCEPTIONAL_DECLINE_FLAG';
  return {market:s.market,cashDate,return1D,comparisonCount:earlier.length,priorAbsoluteMovesSmallerPct:absRank,exceptionalDecline,reviewRule:'NEGATIVE_MOVE_AND_ABSOLUTE_RANK_AT_LEAST_95_MIN_20_PRIOR_OBSERVED_MOVES',futuresReferenceMovePct:referenceMove,futuresAsOf:refOK?f.quoteTimestamp:null,referenceDate:refOK?ref.referenceDate:null,contractContinuityVerified:false,futuresContext:referenceMove===null?'UNKNOWN':referenceMove>0?'COUNTERMOVE_UP':referenceMove<0?'CONTINUATION_DOWN':'UNCHANGED',entryReview,structureSource:'CASH_CLOSE_AND_EXISTING_APP_RULES_UNCHANGED',existingPositionManagement:'SEPARATE_FROM_NEW_ENTRY',limits:'95%-Rang ist vorläufiger Prüfhinweis, keine Ereigniswahrscheinlichkeit, Bodenbestätigung oder Handelsregel. Vergleich aus bis zu 59 früheren Renditen der gespeicherten 61 Balken, nicht der längeren Research-Historie. Optionspreis/IV/ATR nicht geliefert; neuer Put-Vorteil und antizyklischer Call-Vorteil nicht bewiesen.'};
 })};
}
