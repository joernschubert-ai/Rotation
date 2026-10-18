export type MomentumState='UPTREND_CONTEXT'|'CORRECTION_CONTEXT'|'DOWNTREND_CONTEXT'|'REBOUND_CONTEXT'|'FLAT_OR_MIXED'|'INSUFFICIENT_DATA';
const rounded=(v:number|null)=>v===null?null:Math.round(v*10000)/10000;
const direction=(v:number|null)=>v===null?'UNKNOWN':v>0?'UP':v<0?'DOWN':'FLAT';
/** Price returns, not excess returns. 21/252 sessions approximate 1/12 months. */
export function buildMomentumContext(closes:number[]){
 if(closes.some(v=>!Number.isFinite(v)||v<=0))throw Error('Momentum requires valid positive closes');
 const n=closes.length;
 const change=(sessions:number,end=n)=>end>sessions?100*(closes[end-1]/closes[end-1-sessions]-1):null;
 const state=(fast:number|null,slow:number|null):MomentumState=>fast===null||slow===null?'INSUFFICIENT_DATA':slow>0&&fast>0?'UPTREND_CONTEXT':slow>0&&fast<0?'CORRECTION_CONTEXT':slow<0&&fast<0?'DOWNTREND_CONTEXT':slow<0&&fast>0?'REBOUND_CONTEXT':'FLAT_OR_MIXED';
 const fast=change(21),slow=change(252),previousFast=change(21,n-5),previousSlow=change(252,n-5);
 const currentState=state(fast,slow),previousState=state(previousFast,previousSlow);
 return {
  definition:'OWN_CLOSE_RETURN_21_252_V1',basis:'PRICE_RETURNS_NOT_EXCESS_RETURNS',
  fast:{sessions:21,returnPct:rounded(fast),direction:direction(fast)},
  intermediate:[63,126].map(sessions=>({sessions,returnPct:rounded(change(sessions)),direction:direction(change(sessions))})),
  slow:{sessions:252,returnPct:rounded(slow),direction:direction(slow)},
  state:currentState,previousState5SessionsAgo:previousState,
  stateChangedIn5Sessions:currentState==='INSUFFICIENT_DATA'||previousState==='INSUFFICIENT_DATA'?null:currentState!==previousState,
  fastReturnChange5SessionsPp:rounded(fast!==null&&previousFast!==null?fast-previousFast:null),
  oppositeFastSlow:fast===null||slow===null?null:fast*slow<0,
  forwardReturnForecast:null,entryPermission:false,
  limitations:['Descriptive own price-return context, not a confirmed turning point or Rotation-App phase.','21/252 sessions are fixed approximations; no risk-free return, monthly execution rule or original-paper strategy replication.','No calibrated probability, target, option return or validated predictive edge.','Intermediate horizons share the same underlying prices and are not independent confirmations.'],
 };
}
