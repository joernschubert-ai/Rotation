const positive=(v:any):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>0;
export function prepareFuturesObservation(result:any,symbol:string,now=Date.now()){
 const times=Array.isArray(result?.timestamp)?result.timestamp:[],raw=result?.indicators?.quote?.[0]?.close;
 const closes=Array.isArray(raw)?raw:[];const last=closes.length-1;
 const time=(i:number)=>typeof times[i]==='number'&&Number.isFinite(times[i])?times[i]*1000:null;
 const currentTime=time(last),valid=times.length===closes.length&&last>=0&&positive(closes[last])&&currentTime!==null&&currentTime<=now+60000&&now-currentTime<=30*60000;
 const tail:number[]=[];
 if(valid){for(let i=last;i>=0;i--){const t=time(i),next=time(i+1);if(!positive(closes[i])||t===null||(i<last&&(next===null||next-t!==300000)))break;tail.unshift(closes[i]);}}
 const previousTime=time(last-1),step=valid&&tail.length>=2?(tail[tail.length-1]/tail[tail.length-2]-1)*100:null;
 return {closes:tail,engineCloses:tail,current:valid?closes[last]:null,previous:step!==null?tail[tail.length-2]:null,change:step,change5m:step,changePeriod:'OBSERVED_5_MINUTE_INTERVAL',quoteTimestamp:valid?new Date(currentTime!).toISOString():null,
  previousObservationTimestamp:step!==null&&previousTime!==null?new Date(previousTime).toISOString():null,
  dailyChangePct:null,dailyReference:null,dailyReferenceReason:'NO_DATED_PREVIOUS_SETTLEMENT_OR_SESSION_CLOSE',
  dataQuality:{symbol,policy:'DATED_FUTURES_INTERVAL_V1',available:valid,reason:valid?null:'MISSING_INVALID_OR_STALE_FUTURES_ENDPOINT',contiguousBars:tail.length,minimumPriceBars:1,minimumHistoryBars:2,historySufficient:tail.length>=2,extendedHistoryBars:10,extendedHistorySufficient:tail.length>=10,missingBarSlotsPreserved:true,retrievedAt:new Date(now).toISOString()}};
}
