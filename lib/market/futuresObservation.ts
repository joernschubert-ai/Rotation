import {futuresSessionReference} from './futuresSessionReference';
const positive=(v:any):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>0;
const INTERVAL=300000;
export function prepareFuturesObservation(result:any,symbol:string,now=Date.now(),referenceDate?:string|null){
 const times=Array.isArray(result?.timestamp)?result.timestamp:[],raw=result?.indicators?.quote?.[0]?.close;
 const closes=Array.isArray(raw)?raw:[];const rawLast=closes.length-1;
 const time=(i:number)=>typeof times[i]==='number'&&Number.isFinite(times[i])?times[i]*1000:null;
 const rawTime=time(rawLast);
 const rawValid=times.length===closes.length&&rawLast>=0&&positive(closes[rawLast])&&rawTime!==null&&rawTime<=now+60000&&now-rawTime<=30*60000;
 const prior=time(rawLast-1),before=time(rawLast-2);
 // Recognize only one appended off-grid quote after an established 5-minute grid.
 // Never skip a null/stale endpoint, missing interval or arbitrary irregular history.
 const terminalQuoteSeparated=rawValid&&rawLast>=2&&prior!==null&&before!==null&&positive(closes[rawLast-1])&&positive(closes[rawLast-2])&&prior%INTERVAL===0&&before%INTERVAL===0&&prior-before===INTERVAL&&rawTime!%INTERVAL!==0&&rawTime!>prior&&rawTime!-prior<INTERVAL;
 const last=terminalQuoteSeparated?rawLast-1:rawLast,currentTime=time(last);
 const valid=rawValid&&currentTime!==null&&now-currentTime<=30*60000;
 const tail:number[]=[];
 if(valid){for(let i=last;i>=0;i--){const t=time(i),next=time(i+1);if(!positive(closes[i])||t===null||(i<last&&(next===null||next-t!==INTERVAL)))break;tail.unshift(closes[i]);}}
 const previousTime=time(last-1),step=valid&&tail.length>=2?(tail[tail.length-1]/tail[tail.length-2]-1)*100:null;
 return {closes:tail,engineCloses:tail,current:valid?closes[last]:null,previous:step!==null?tail[tail.length-2]:null,change:step,change5m:step,changePeriod:'OBSERVED_5_MINUTE_INTERVAL',quoteTimestamp:valid?new Date(currentTime!).toISOString():null,
  previousObservationTimestamp:step!==null&&previousTime!==null?new Date(previousTime).toISOString():null,
  dailyChangePct:null,dailyReference:null,dailyReferenceReason:'NO_DATED_PREVIOUS_SETTLEMENT_OR_SESSION_CLOSE',
  dataQuality:{symbol,policy:'DATED_FUTURES_GRID_AND_TERMINAL_QUOTE_V2',available:valid,reason:valid?null:'MISSING_INVALID_OR_STALE_FUTURES_ENDPOINT',contiguousBars:tail.length,minimumPriceBars:1,minimumHistoryBars:2,historySufficient:tail.length>=2,extendedHistoryBars:10,extendedHistorySufficient:tail.length>=10,missingBarSlotsPreserved:true,terminalQuoteSeparated,terminalQuote:terminalQuoteSeparated?{value:closes[rawLast],timestamp:new Date(rawTime!).toISOString(),usedForFiveMinuteReturn:false}:null,sessionReference:futuresSessionReference(result,symbol,valid?closes[last]:null,valid?currentTime:null,referenceDate),displayPriceBasis:terminalQuoteSeparated?'LAST_REGULAR_FIVE_MINUTE_BAR':'LATEST_SUPPLIED_ENDPOINT',barFinality:'UNVERIFIED',retrievedAt:new Date(now).toISOString()}};
}
