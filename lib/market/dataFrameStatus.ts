const day=(v:unknown):string|null=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v?v:null;
export function describeMarketFrames(map:any){
 const indexDates=['nasdaq','sp500','russell'].map(name=>{const q=map?.indices?.[name]?.priceMetrics?.dataQuality;const stamp=q?.lastValidBarTimestamp??q?.currentObservationTimestamp??q?.latestBarTimestamp;return {name,date:day(typeof stamp==='string'?stamp.slice(0,10):null)};});
 const rows=[...indexDates,{name:'Marktbreite',date:day(map?.breadthDataQuality?.referenceDate)},{name:'Kredit',date:day(map?.creditDataQuality?.asOfDate)},{name:'Volatilität',date:day(map?.volatilityDataQuality?.asOfDate)}];
 const observed=rows.filter(r=>r.date!==null),dates=[...new Set(observed.map(r=>r.date!))].sort();
 return {policy:'OBSERVED_FRAME_ALIGNMENT_V1',status:dates.length>1?'MIXED_DATES':observed.length<rows.length?'INCOMPLETE_DATES':'ALIGNED_DATES',rows,newestObservedDate:dates.at(-1)??null,oldestObservedDate:dates[0]??null,missing:rows.filter(r=>r.date===null).map(r=>r.name),calendarVerified:false,alignmentIsNotFreshnessOrFinality:true};
}
