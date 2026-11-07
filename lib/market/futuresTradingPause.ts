const format=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function local(t:number){const p=format.formatToParts(new Date(t)),get=(k:string)=>p.find(v=>v.type===k)?.value??'';return {weekday:get('weekday'),date:`${get('year')}-${get('month')}-${get('day')}`,minute:Number(get('hour'))*60+Number(get('minute'))};}
/** Regular CME equity-index schedule only. No holiday or emergency-session verification. */
export function futuresTradingPause(now:number,quoteTime:number|null){
 const unknown={kind:null as 'WEEKEND'|'DAILY_BREAK'|null,datedQuoteAllowed:false,schedule:'CME_EQUITY_INDEX_REGULAR_NEW_YORK_V1',exchangeCalendarVerified:false};
 if(!Number.isFinite(now))return unknown;
 const n=local(now);
 const kind=(n.weekday==='Fri'&&n.minute>=17*60)||n.weekday==='Sat'||(n.weekday==='Sun'&&n.minute<18*60)?'WEEKEND':['Mon','Tue','Wed','Thu'].includes(n.weekday)&&n.minute>=17*60&&n.minute<18*60?'DAILY_BREAK':null;
 if(kind===null||quoteTime===null||!Number.isFinite(quoteTime)||quoteTime>now)return {...unknown,kind};
 const q=local(quoteTime),closingWindow=q.minute>=16*60&&q.minute<=17*60+5;
 const datedQuoteAllowed=closingWindow&&(kind==='WEEKEND'?q.weekday==='Fri'&&now-quoteTime<=72*3600000:q.date===n.date&&now-quoteTime<=2*3600000);
 return {...unknown,kind,datedQuoteAllowed};
}

/** Separate only trailing null slots that each belong to the same scheduled pause.
 * Trading-time nulls, zeros, time gaps and future slots never qualify. Raw arrays are not mutated.
 */
export function separateClosedFuturesSlots(result:any,now:number){
 const times=Array.isArray(result?.timestamp)?result.timestamp:[],closes=result?.indicators?.quote?.[0]?.close;
 const end=Array.isArray(closes)?closes.length-1:-1;
 const none={lastIndex:end,separated:false,count:0,firstTimestamp:null as string|null,lastTimestamp:null as string|null};
 if(!Array.isArray(closes)||times.length!==closes.length||end<1||closes[end]!==null)return none;
 let last=end;while(last>=0&&closes[last]===null)last--;
 if(last<0||typeof closes[last]!=='number'||!Number.isFinite(closes[last])||closes[last]<=0)return none;
 const t=(i:number)=>typeof times[i]==='number'&&Number.isFinite(times[i])?times[i]*1000:NaN;
 const quote=t(last),pause=futuresTradingPause(now,quote);
 if(!Number.isFinite(quote)||pause.kind===null||!pause.datedQuoteAllowed)return none;
 for(let i=last+1;i<=end;i++){
  const slot=t(i),prior=t(i-1),atSlot=futuresTradingPause(slot,quote);
  if(!Number.isFinite(slot)||slot>now||slot-prior!==300000||atSlot.kind!==pause.kind||!atSlot.datedQuoteAllowed)return none;
 }
 return {lastIndex:last,separated:true,count:end-last,firstTimestamp:new Date(t(last+1)).toISOString(),lastTimestamp:new Date(t(end)).toISOString()};
}
