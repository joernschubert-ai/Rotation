/** Pure dated lookup. Archive capture days and missing daily bars are never compressed. */
const number=(v:any):number|null=>{if(typeof v==='number')return Number.isFinite(v)?v:null;if(v&&typeof v==='object')return number(v.value??v.current);return null;};
const day=(v:any):string|null=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v?v:null;
const read=(row:any,paths:string[])=>{for(const p of paths){const n=number(p.split('.').reduce((a,k)=>a?.[k],row));if(n!==null)return n;}return null;};
export function sessionComparisons(data:any,history:any[],now=Date.now()){
 const price=data.indices?.spx?.priceMetrics??data.indices?.sp500?.priceMetrics;
 const supplied=price?.dataQuality?.observedSessions;
 const sessions=Array.isArray(supplied)?supplied:[];
 const valid=sessions.length>0&&sessions.every((r:any,i:number)=>day(r?.date)&&r.date<=new Date(now).toISOString().slice(0,10)&&(!i||sessions[i-1].date<r.date));
 const anchor=valid?sessions[sessions.length-1].date:null;
 const currentStructureDate=day(data.breadthDataQuality?.referenceDate);
 const version=data.breadthDataQuality?.universeVersion;
 const diagnostics:any[]=[];
 const snapshot=(offset:number,paths:string[])=>{
  const target=valid&&sessions.length>offset?sessions[sessions.length-1-offset].date:null;
  const reason=!target?'NO_DATED_SESSION_WINDOW':currentStructureDate!==anchor?'CURRENT_STRUCTURE_DATE_MISMATCH':typeof version!=='string'||!version?'CURRENT_UNIVERSE_MISSING':null;
  if(reason){diagnostics.push({offset,target,available:false,reason});return undefined;}
  const candidates=(Array.isArray(history)?history:[]).filter(s=>s?.breadthDataQuality?.referenceDate===target&&s?.breadthDataQuality?.universeVersion===version&&typeof s.timestamp==='string'&&/(Z|[+-]\d{2}:\d{2})$/.test(s.timestamp)&&Number.isFinite(Date.parse(s.timestamp))&&Date.parse(s.timestamp)<=now).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
  const latest=candidates[0];
  // Ambiguous equal capture times do not silently select one conflicting row.
  const tied=latest?candidates.filter(s=>s.timestamp===latest.timestamp):[];
  const values=tied.map(s=>read(s,paths)),n=latest?read(latest,paths):null;
  const available=n!==null&&values.every(x=>x===n);
  diagnostics.push({offset,target,available,capturedAt:latest?.timestamp??null,reason:available?null:latest?'VALUE_MISSING_OR_CONFLICT':'NO_MATCHING_DATED_STRUCTURE'});
  return available?n!:undefined;
 };
 const spxCurrent=valid?number(sessions[sessions.length-1].close):null;
 const window=valid&&sessions.length>5?sessions.slice(-6):[];
 const priceReady=window.length===6&&window.every((r:any)=>{const n=number(r.close);return n!==null&&n>0;})&&spxCurrent!==null&&spxCurrent===price?.current&&price?.dataQuality?.stale!==true;
 return {snapshot,spxCurrent:priceReady?spxCurrent!:undefined,spx5dAgo:priceReady?number(window[0].close)!:undefined,
  diagnostics:{policy:'DATED_OBSERVED_SESSION_COMPARISONS_V1',anchorDate:anchor,structureDate:currentStructureDate,price5dAvailable:priceReady,priceFromDate:priceReady?window[0].date:null,structureComparisons:diagnostics,calendarVerified:false,legacyArchivePreserved:true}};
}
