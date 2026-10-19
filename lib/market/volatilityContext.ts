type Series={symbol:string;timestamps:number[];closes:number[]};
const names=['^VIX','^VIX3M','^VIX9D'] as const;
const positive=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>0;
const date=(time:number)=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(time));const get=(key:string)=>parts.find(p=>p.type===key)?.value??'';return get('year')+'-'+get('month')+'-'+get('day');};
/** Select real observed bars on one common market date; never fill a missing bar. */
export function selectVolatilityContext(input:Series[],now=Date.now()){
 const maps=names.map(symbol=>{
  const source=input.find(s=>s.symbol===symbol),rows:{day:string;time:number;close:number;index:number}[]=[];let malformed=false;
  const times=source?.timestamps??[],closes=source?.closes??[];
  for(let i=0;i<Math.min(times.length,closes.length);i++){
   const time=times[i]*1000;if(!Number.isFinite(time)||time>now)continue;
   const day=date(time);if(rows.length&&day<=rows[rows.length-1].day){malformed=true;break;}
   rows.push({day,time,close:closes[i],index:i});
  }
  return {symbol,source,rows,malformed,endpoint:times.length===closes.length&&times.length>0&&Number.isFinite(times[times.length-1])?{day:date(times[times.length-1]*1000),available:positive(closes[closes.length-1])&&times[times.length-1]*1000<=now}:null};
 });
 const common=maps[0].rows.filter(r=>positive(r.close)&&maps.every(m=>!m.malformed&&m.rows.some(p=>p.day===r.day&&positive(p.close)))).map(r=>r.day).sort().reverse();
 const selected=common[0]??null;
 const windows=maps.map(m=>{const index=m.rows.findIndex(r=>r.day===selected);return {symbol:m.symbol,rows:index>=0?m.rows.slice(Math.max(0,index-4),index+1):[]};});
 const stamps=windows.map(w=>w.rows[w.rows.length-1]?.time??NaN),asOfTime=Math.min(...stamps);
 const alignedWindows=windows.every(w=>w.rows.length===5&&w.rows.every((r,i)=>positive(r.close)&&r.day===windows[0].rows[i]?.day));
 const available=selected!==null&&alignedWindows&&Number.isFinite(now)&&Number.isFinite(asOfTime)&&asOfTime<=now&&now-asOfTime<=5*86400000;
 const fallbackUsed=available&&maps.some(m=>!m.endpoint?.available||m.endpoint.day!==selected);
 const quality={policy:'DATED_VOLATILITY_FALLBACK_CONTINUES_V2',available,asOfDate:available?selected:null,asOfTimestamp:available?new Date(asOfTime).toISOString():null,
  retrievedAt:new Date(now).toISOString(),fallbackUsed,entryBlocked:!available,calendarAgeLimitDays:5,
  sourceEndpoints:maps.map(m=>({symbol:m.symbol,date:m.endpoint?.day??null,available:m.endpoint?.available??false})),
  windowDates:available?windows[0].rows.map(r=>r.day):[],datedFallback:fallbackUsed,syntheticBarsInserted:0,
  message:!available?'Kein ausreichend frischer, gemeinsamer Volatilitätsstand verfügbar.':fallbackUsed?`Volatilitätsdaten: letzter gemeinsamer gültiger Stand ${selected}. Aktueller Anbieter-Endpunkt fehlt oder ist zeitlich uneinheitlich. Berechnungen verwenden diesen datierten Stand; kein aktueller Livekurs.`:`Volatilitätsdaten auf gemeinsamem beobachteten Handelstag ${selected}; kein Nachweis eines Echtzeitkurses.`};
 return {quality,series:Object.fromEntries(windows.map(w=>[w.symbol,available?w.rows.map(r=>r.close):[]])) as Record<string,number[]>};
}
