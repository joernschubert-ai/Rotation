type Bars={closes:number[];sessionDate:string};
/** Reuse supplied daily closes only. No I/O, no changes to existing high/low counts. */
export function buildConstituentExtremesObservation(expected:string[],accepted:string[],bars:Map<string,Bars>,referenceDate:string|null){
 const valid:string[]=[],highs:string[]=[],lows:string[]=[];
 const unique=[...new Set(expected)].sort();
 const inputValid=unique.length===expected.length&&new Set(accepted).size===accepted.length&&accepted.every(s=>unique.includes(s));
 if(inputValid&&referenceDate)for(const symbol of [...accepted].sort()){
  const row=bars.get(symbol),window=row?.closes.slice(-252);
  if(row?.sessionDate!==referenceDate||!window||window.length!==252||window.some(n=>!Number.isFinite(n)||n<=0))continue;
  valid.push(symbol);const current=window[251],prior=window.slice(0,251);
  if(current>=Math.max(...prior))highs.push(symbol);
  if(current<=Math.min(...prior))lows.push(symbol);
 }
 return {version:'CONSTITUENT_CLOSE_EXTREMES_V1',referenceDate,definition:'252_OBSERVED_CLOSE_WINDOW_INCLUDING_CURRENT_TIES_INCLUDED',inputValid,expected:unique.length,valid:valid.length,coverage:unique.length?valid.length/unique.length:0,validMembers:valid,newHighMembers:highs,newLowMembers:lows,newHighs:highs.length,newLows:lows.length,historicalMembershipReconstructed:false,intradayExtremes:false};
}
