type Point={date:string;close:number};
const day=86400000;
/** Input is already validated, deduplicated, sorted and cut to completed closes. */
export function priceTrajectory(points:Point[],completedCutoff?:string){
 const last=points[points.length-1];
 if(!last)return {available:false,windows:[],completedWeeks:[],latestCompletedWeek:null,sinceCompletedWeek:null,limitations:'Keine gültigen Schlusskurse.'};
 const time=(d:string)=>Date.parse(d+'T00:00:00Z'),date=(t:number)=>new Date(t).toISOString().slice(0,10);
 const change=(a:number,b:number)=>Number(((a/b-1)*100).toFixed(4));
 const reference=completedCutoff??last.date;
 const weekday=new Date(time(reference)).getUTCDay();
 const monday=time(reference)-((weekday+6)%7)*day;
 // Latest observed Friday can complete its own week; earlier weekdays cannot.
 const completedMonday=weekday===5||weekday===6||weekday===0?monday:monday-7*day;
 const completedWeeks=Array.from({length:4},(_,i)=>{
  const start=completedMonday-i*7*day,end=start+4*day;
  const observations=points.filter(p=>time(p.date)>=start&&time(p.date)<=end);
  const base=points.filter(p=>time(p.date)<start).slice(-1)[0];
  const finish=observations[observations.length-1];
  const ready=!!base&&!!finish&&start-time(base.date)<=7*day;
  return {calendarWeekStart:date(start),calendarWeekEnd:date(end),available:ready,
   baselineDate:base?.date??null,baselineClose:base?.close??null,endDate:finish?.date??null,endClose:finish?.close??null,
   observedSessions:observations.length,returnPct:ready?change(finish.close,base.close):null};
 });
 const latest=completedWeeks[0];
 const windows=[1,5,10,20,30,60].map(sessions=>{
  const base=points[points.length-1-sessions];return {sessions,fromDate:base?.date??null,toDate:last.date,
   returnPct:base?change(last.close,base.close):null,definition:'Observed close-to-close intervals, not calendar weeks'};
 });
 const dailyMoves=points.slice(1).map((p,i)=>({date:p.date,fromDate:points[i].date,returnPct:100*(p.close/points[i].close-1)}));
 const magnitude=(index:number)=>{
  const move=dailyMoves[index];if(!move)return null;
  // Exclude the movement under examination and every later observation.
  const prior=dailyMoves.slice(Math.max(0,index-252),index);
  const absolute=Math.abs(move.returnPct);
  return {...move,returnPct:Number(move.returnPct.toFixed(4)),absolutePct:Number(absolute.toFixed(4)),
   historicalComparisonCount:prior.length,comparisonFrom:prior[0]?.fromDate??null,comparisonTo:prior[prior.length-1]?.date??null,
   priorAbsoluteMovesStrictlySmallerPct:prior.length>=20?Number((100*prior.filter(p=>Math.abs(p.returnPct)<absolute).length/prior.length).toFixed(2)):null};
 };
 const recentStart=Math.max(0,dailyMoves.length-10);
 let largest=-1;for(let i=recentStart;i<dailyMoves.length;i++)if(largest<0||Math.abs(dailyMoves[i].returnPct)>Math.abs(dailyMoves[largest].returnPct))largest=i;
 const magnitudeContext={latest:magnitude(dailyMoves.length-1),largestInLast10ObservedIntervals:magnitude(largest),
  meaning:'Magnitude compared with at most 252 earlier observed absolute one-interval returns; minimum 20 comparisons. Descriptive rank, not event probability, shock threshold, buy/sell signal or phase override. Intervals may span gaps in supplied bars. Recent large movement retained even after a rebound.'};
 return {available:true,asOfDate:last.date,windows,completedWeeks,latestCompletedWeek:latest,magnitudeContext,
  sinceCompletedWeek:latest.available?{fromDate:latest.endDate,toDate:last.date,
   observedIntervals:points.filter(p=>p.date>latest.endDate!).length,
   returnPct:change(last.close,latest.endClose!),
   cumulativeSinceWeekBaselinePct:change(last.close,latest.baselineClose!)}:null,
  limitations:'Calendar week Monday-Friday with last available prior close as baseline. Observed sessions only; no verified exchange-calendar completeness. Holidays or missing provider bars can shorten a week. Rolling five intervals and completed calendar week are different. No future bars, no phase or forecast inferred.'};
}
