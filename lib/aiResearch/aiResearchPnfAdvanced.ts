import type { Formation } from './aiResearchFormations';

/** V52: deliberately narrow, close-only operational definitions. Rows are integers. */
export const PNF_ADVANCED_POLICY='PNF_ADVANCED_CLOSE_GRID_V52';
export interface GridColumn {direction:'X'|'O';low:number;high:number;startedAt:string;updatedAt:string;fixedAt:string|null;}
export interface AdvancedFormation extends Formation {
 recognition:{version:typeof PNF_ADVANCED_POLICY;triggerRow:number;invalidationRow:number;sourceColumnStarts:string[];sourceColumns:{direction:'X'|'O';lowRow:number;highRow:number;startedAt:string}[];definition:string};
}
export function advancedCandidates(columns:readonly GridColumn[],boxPercent:number,date:string):AdvancedFormation[]{
 const c=columns.slice(-7),i=c.length-1,last=c[i],out:AdvancedFormation[]=[];
 if(!last)return out;
 const price=(row:number)=>Math.exp(row*Math.log(1+boxPercent/100));
 const emit=(family:Formation['family'],bull:boolean,triggerRow:number,invalidationRow:number,start:number,definition:string)=>{
  const confirmationLevel=price(triggerRow),invalidationLevel=price(invalidationRow);
  out.push({id:family+':'+boxPercent+':'+last.startedAt,family,bias:bull?'BULLISH':'BEARISH',status:'CONFIRMED',
   discoveredAt:date,asOfDate:date,confirmedAt:date,invalidatedAt:null,confirmationLevel,invalidationLevel,
   meaning:'Chronologisch erkannte regelgebundene Zusatzformation; kein unabhängiger Beweis oder validierter Prognosevorteil.',
   confirmation:'Tagesschluss hat die ganzzahlige Gitterbedingung ausgelöst.',
   invalidation:'Eigene musterspezifische Widerlegung; keine Pflichtmarke jeder Gegenbewegung.',target:null,predictiveEdgeValidated:false,
   recognition:{version:PNF_ADVANCED_POLICY,triggerRow,invalidationRow,sourceColumnStarts:c.slice(start).map(v=>v.startedAt),
    sourceColumns:c.slice(start).map(v=>({direction:v.direction,lowRow:v.low,highRow:v.high,startedAt:v.startedAt})),definition}});
 };
 if(i>=5){
  // The immediate reversal must follow exactly one box beyond two equal prior extremes.
  const a=c[i-5],b=c[i-4],d=c[i-3],e=c[i-2],breakout=c[i-1];
  if(last.direction==='O'&&a.direction==='X'&&a.high===d.high&&breakout.high===a.high+1&&last.low<=breakout.high-3)
   emit('PNF_BULL_TRAP',false,breakout.high-3,breakout.high+1,i-5,'Immediate three-box reversal after exactly one-box multiple-top breakout; no opposite basic sell required.');
  if(last.direction==='X'&&a.direction==='O'&&a.low===d.low&&breakout.low===a.low-1&&last.high>=breakout.low+3)
   emit('PNF_BEAR_TRAP',true,breakout.low+3,breakout.low-1,i-5,'Immediate three-box reversal after exactly one-box multiple-bottom breakdown; no opposite basic buy required.');
  // Strict highs AND lows; equality is deliberately excluded for the preceding trend.
  if(last.direction==='O'&&a.direction==='X'&&a.high<d.high&&d.high<breakout.high&&b.low<e.low&&last.low<=e.low-1)
   emit('PNF_BULLISH_SIGNAL_REVERSED',false,e.low-1,breakout.high+1,i-5,'Three X highs strictly rising and two O lows strictly rising; current O breaks the previous O low. Name describes the old bullish trend; outcome is bearish.');
  if(last.direction==='X'&&a.direction==='O'&&a.low>d.low&&d.low>breakout.low&&b.high>e.high&&last.high>=e.high+1)
   emit('PNF_BEARISH_SIGNAL_REVERSED',true,e.high+1,breakout.low-1,i-5,'Three O lows strictly falling and two X highs strictly falling; current X breaks the previous X high. Name describes the old bearish trend; outcome is bullish.');
 }
 if(i>=6){
  const a=c[i-6],b=c[i-5],d=c[i-4],e=c[i-3],breakout=c[i-2],pullback=c[i-1];
  // Seven adjacent columns only. Initial breakout 1-3 boxes; pullback returns to
  // the old level but never breaches either congestion low/high or prior opposite column.
  if(last.direction==='X'&&a.direction==='X'&&a.high===d.high&&breakout.high>a.high&&breakout.high<=a.high+3&&
   pullback.low<=a.high&&pullback.low>=e.low&&last.high>=breakout.high+1)
   emit('PNF_BULLISH_CATAPULT',true,breakout.high+1,pullback.low-1,i-6,'Strict adjacent seven-column multiple-top breakout (1-3 boxes), return into congestion without basic sell, second top breakout.');
  if(last.direction==='O'&&a.direction==='O'&&a.low===d.low&&breakout.low<a.low&&breakout.low>=a.low-3&&
   pullback.high>=a.low&&pullback.high<=e.high&&last.low<=breakout.low-1)
   emit('PNF_BEARISH_CATAPULT',false,breakout.low-1,pullback.high+1,i-6,'Strict adjacent seven-column multiple-bottom breakdown (1-3 boxes), return into congestion without basic buy, second bottom breakdown.');
 }
 return out;
}
