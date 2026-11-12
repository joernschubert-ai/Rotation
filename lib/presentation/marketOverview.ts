const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const n=(v:any):number|null=>finite(v)?v:null;
const price=(v:any):number|null=>{const candidate=finite(v)?v:finite(v?.current)?v.current:finite(v?.value)?v.value:null;return candidate!==null&&candidate>0?candidate:null;};
const day=(v:any):string|null=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))?v:null;
function observation(item:any){const q=item?.priceMetrics?.dataQuality;return day(item?.priceMetrics?.observedMarketDate)??day((q?.currentObservationTimestamp??q?.latestBarTimestamp??q?.lastValidBarTimestamp)?.slice?.(0,10));}
export function overviewPhase(phase:unknown){
 const labels:Record<string,{label:string;tone:string}>={PHASE_1_EXPANSION:{label:'Phase 1 · Expansion',tone:'good'},PHASE_2_WARNING:{label:'Phase 2 · Warnung',tone:'watch'},PHASE_3_DISTRIBUTION:{label:'Phase 3 · Distribution',tone:'watch'},PHASE_4_RISK:{label:'Phase 4 · Risiko',tone:'bad'},PHASE_5_BREAKDOWN:{label:'Phase 5 · Breakdown',tone:'bad'},PHASE_6_ACCELERATION:{label:'Phase 6 · Beschleunigung',tone:'bad'},PHASE_7_CAPITULATION:{label:'Phase 7 · Kapitulation',tone:'bad'}};
 return typeof phase==='string'?labels[phase]??{label:phase||'Phase unbekannt',tone:'neutral'}:{label:'Phase unbekannt',tone:'neutral'};
}
/** Display only: copies existing engine numbers; no market fetch, history write or entry calculation. */
export function marketOverview(engine:any,map:any,snapshotTimestamp?:string){
 const cash=engine?.indices??map?.indices??{},futures=engine?.futures??map?.futures??{};
 const rows=[['Dow Jones','dow','dow','ym','dow'],['Nasdaq 100','ndx','nasdaq','nq','nasdaq'],['S&P 500','spx','sp500','es','sp500'],['Russell 2000','rut','russell','rty','russell']].map(([name,key,alias,fkey,falias])=>{
  const c=cash[key]??cash[alias],f=futures[fkey]??futures[falias],q=f?.dataQuality??{},paused=q.observationMode==='DATED_SCHEDULED_PAUSE',ref=q.sessionReference;
  const useReference=!paused&&ref?.available===true&&finite(ref.returnPct),interval=f?.changePeriod==='OBSERVED_5_MINUTE_INTERVAL';
  return {name,cash:price(c?.value),cashChange:n(c?.change),cashDate:observation(c),future:price(f?.value),futureChange:useReference?ref.returnPct:interval?n(f?.change):null,futurePeriod:useReference?'seit 16:00 NY':interval?'5 Min.':'Zeitraum offen',paused,futureTimestamp:typeof f?.quoteTimestamp==='string'?f.quoteTimestamp:null,reference:ref??null,terminalQuote:q.terminalQuoteSeparated?q.terminalQuote??null:null};
 });
 const structure=engine?.structure??{},ad=structure.advanceDecline??{},hl=structure.highsLows??{},b=structure.breadth??{},d=structure.distribution??{};
 const advances=n(ad.advances),declines=n(ad.declines),highs=n(hl.highs),lows=n(hl.lows),hasHL=highs!==null&&lows!==null&&(highs!==0||lows!==0),sum=hasHL?highs!+lows!:null;
 const rawVix=map?.marketData?.['^VIX'];
 // Adapter values are relative-return ratios: 1.096 means +9.6 pp versus the comparator.
 // The Equal Weight value is RSP minus SPY, already expressed in percentage points.
 const rotation=map?.rotation??{};
 const spread=(v:any)=>finite(v)?(v-1)*100:null;
 const relativeLeadership={smallVsTech:spread(rotation.rsSmall),growthVsValue:spread(rotation.rsGrowth),equalVsMega:spread(rotation.rsEqual)};
 return {snapshotTimestamp:snapshotTimestamp??null,phase:overviewPhase(engine?.phase),rows,
  vix:{value:map?.volatilityDataQuality?.available===false?null:price(rawVix),date:day(map?.volatilityDataQuality?.asOfDate),change:typeof rawVix==='object'&&rawVix!==null?n(rawVix.change):null,termRatio:n(map?.vixTermRatio)},
  breadth:[20,50,200].map(period=>({period,value:n(b['b'+period]?.value),delta:n(b['b'+period]?.delta)})),
  participation:{ad:n(ad.value)??(advances!==null&&declines!==null?advances-declines:null),advances,declines,momentum:n(ad.delta),highs,lows,netHL:hasHL?highs!-lows!:null,hlStrength:sum!==null&&sum>0?100*(highs!-lows!)/sum:null,distribution:n(d.value??d.score),distributionMax:n(d.max)},
  relativeLeadership,
  breadthDate:day(map?.breadthDataQuality?.referenceDate),breadthUniverse:map?.breadthDataQuality?.definition??null,
  limit:'Marktbreite und Teilnahme beziehen sich auf das bestehende Nasdaq-Universum. Änderungen stammen unverändert aus der Engine; kein neuer Börsenkalendervergleich.'};
}
