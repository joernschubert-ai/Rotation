"use client";

type Props={indices?:any;futures?:any};
const valid=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const number=(v:unknown)=>valid(v)?Math.round(v).toLocaleString('en-US'):'—';
const percent=(v:unknown)=>valid(v)?`${v>0?'+':''}${v.toFixed(2)}%`:'—';
const color=(v:unknown)=>!valid(v)?'text-zinc-500':v>0?'text-green-400':v<0?'text-red-400':'text-zinc-400';
const time=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v))?new Date(v).toLocaleString('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'unbekannt';
export default function IndicesPanel({indices={},futures={}}:Props){
 const cash=indices??{},future=futures??{};
 const rows=[
  {name:'Dow Jones',label:'Dow Futures',cash:cash.dow,future:future.ym??future.dow},
  {name:'NASDAQ',label:'NASDAQ Futures',cash:cash.ndx??cash.nasdaq,future:future.nq??future.nasdaq},
  {name:'S&P 500',label:'S&P Futures',cash:cash.spx??cash.sp500,future:future.es??future.sp500},
  {name:'Russell 2000',label:'Russell Futures',cash:cash.rut??cash.russell,future:future.rty??future.russell}
 ];
 function cell(label:string,item:any,isFuture:boolean){
  const period=isFuture?(item?.changePeriod==='OBSERVED_5_MINUTE_INTERVAL'?'5 Min.':'Zeitraum unklar'):'Tag';
  return <div className="flex min-h-[76px] min-w-0 items-center justify-between gap-3 py-3">
   <span className="min-w-0 text-sm text-zinc-400">{label}</span>
   <div className="shrink-0 text-right"><div className="text-base font-semibold tabular-nums text-zinc-100 sm:text-lg">{number(item?.value)}</div>
    <div className={`mt-0.5 text-sm font-semibold tabular-nums ${color(item?.change)}`}>{percent(item?.change)} <span className="text-[10px] font-normal text-zinc-500">{period}</span></div>
   </div>
  </div>;
 }
 return <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
  <h2 className="text-lg font-semibold text-zinc-100">Index Markets</h2>
  <p className="mb-4 mt-1 text-xs leading-relaxed text-zinc-500">Cash: Tagesänderung · Futures: letztes beobachtetes 5-Minuten-Intervall, zeitverzögerte Daten.</p>
  <div className="hidden grid-cols-2 gap-x-6 text-xs font-semibold tracking-wider text-zinc-500 lg:grid"><div>CASH INDICES</div><div>FUTURES</div></div>
  {rows.map(row=><div key={row.name} className="grid grid-cols-1 gap-x-6 border-b border-zinc-800/70 lg:grid-cols-2">
   {cell(row.name,row.cash,false)}{cell(row.label,row.future,true)}
  </div>)}
  <details className="mt-3 text-xs text-zinc-400">
   <summary className="cursor-pointer text-zinc-500">Datenstand und Futures-Details</summary>
   <p className="mb-2 mt-3 leading-relaxed">Die Futures-Prozentwerte sind keine Tagesrenditen. Preis und Veränderung verwenden dieselben regulären Beobachtungen. Zusatzkurse werden getrennt ausgewiesen; endgültige Balkenschlüsse sind nicht bestätigt.</p>
   {rows.map(row=><div key={row.name} className="border-t border-zinc-800 py-2 leading-relaxed">
    <strong>{row.label}</strong> · Kursstand: {time(row.future?.quoteTimestamp)}<br/>
    Vergleich: {time(row.future?.previousObservationTimestamp)} → {time(row.future?.quoteTimestamp)}<br/>
    Bewegung seit Referenz 16:00 NY: {percent(row.future?.dataQuality?.sessionReference?.returnPct)} · kein offizielles Settlement<br/>
    Tagesänderung: {percent(row.future?.dailyChangePct)}{row.future?.dailyChangePct==null?' · Schluss-/Settlementbezug fehlt':''}
    {row.future?.dataQuality?.terminalQuoteSeparated&&<><br/>Zusatzkurs: {number(row.future.dataQuality.terminalQuote?.value)} · {time(row.future.dataQuality.terminalQuote?.timestamp)} · nicht für die 5-Minuten-Rendite verwendet</>}
   </div>)}
  </details>
 </div>;
}
