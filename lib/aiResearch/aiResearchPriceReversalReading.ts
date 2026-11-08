import {cleanRecoveryPoints,recoveryFeatures,type RecoveryPoint} from './aiResearchAnticyclicalStudy';
import {priceReversalEvents} from './aiResearchPriceReversalStudy';
import {assessReversalFollowThrough} from './aiResearchReversalFollowThrough';
export const PRICE_READING_VERSION='PRICE_REVERSAL_READINGS_V1';
/** Current reading only, from the same already-loaded closes. No extra fetch or re-estimation of historical weights. */
export function buildPriceReversalReading(market:string,raw:RecoveryPoint[],cutoff:string){
 const points=cleanRecoveryPoints(raw,cutoff).points;
 if(points.length<252)return {market,status:'UNAVAILABLE' as const,asOf:points.at(-1)?.date??null,close:points.at(-1)?.close??null,signals:[]};
 const found=priceReversalEvents(recoveryFeatures(points,[]));
 return {market,status:'AVAILABLE' as const,asOf:points.at(-1)!.date,close:points.at(-1)!.close,signals:['FAILED_LOW_RECLAIM','BAND_REENTRY'].map(id=>({id,...assessReversalFollowThrough(points,found.events[id].filter(e=>e.index>=251&&e.signalDate>='2012-01-01').at(-1),id)}))};
}
export function validPriceReversalReading(reading:any,asOf:string,close:number){
 const ids=['FAILED_LOW_RECLAIM','BAND_REENTRY'],states=['NO_EVENT','UNAVAILABLE','FRESH','HELD','AT_REFERENCE','REFERENCE_LOST','RECOVERED_AFTER_LOSS','HISTORICAL'];
 const consistent=(s:any)=>{
  if(s.status==='NO_EVENT'||s.status==='UNAVAILABLE')return s.signalDate===null&&s.ageIntervals===null&&s.reference===null;
  if(s.status==='HISTORICAL')return s.ageIntervals>10;
  if(s.ageIntervals>10)return false;
  if(s.status==='FRESH')return s.ageIntervals===0&&s.latestClose>s.reference&&!s.firstReferenceLostDate;
  if(s.status==='HELD')return s.ageIntervals>0&&s.latestClose>s.reference&&!s.firstReferenceLostDate;
  if(s.status==='AT_REFERENCE')return s.latestClose===s.reference&&!s.firstReferenceLostDate;
  if(s.status==='REFERENCE_LOST')return s.latestClose<s.reference&&!!s.firstReferenceLostDate;
  if(s.status==='RECOVERED_AFTER_LOSS')return s.latestClose>=s.reference&&!!s.firstReferenceLostDate;
  return false;
 };
 const day=(v:any)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
 return reading?.status==='AVAILABLE'&&reading.asOf===asOf&&typeof reading.close==='number'&&Number.isFinite(reading.close)&&Math.abs(reading.close-close)<=.005&&Array.isArray(reading.signals)&&reading.signals.length===2&&ids.every(id=>reading.signals.filter((s:any)=>s.id===id).length===1)&&reading.signals.every((s:any)=>s.version==='REVERSAL_FOLLOW_THROUGH_V1'&&s.asOf===asOf&&states.includes(s.status)&&consistent(s)&&s.latestClose===reading.close&&(s.signalDate===null?s.ageIntervals===null&&['NO_EVENT','UNAVAILABLE'].includes(s.status):day(s.signalDate)&&s.signalDate<=asOf&&s.knownAt===s.signalDate&&Number.isInteger(s.ageIntervals)&&s.ageIntervals>=0&&typeof s.reference==='number'&&Number.isFinite(s.reference)&&s.reference>0)&&(!s.firstReferenceLostDate||day(s.firstReferenceLostDate)&&s.firstReferenceLostDate>s.signalDate&&s.firstReferenceLostDate<=asOf));
}
export function compactPriceReversalReading(reading:any){
 if(reading?.version!==PRICE_READING_VERSION||!validPriceReversalReading(reading,reading.asOf,reading.close))return undefined;
 const states:Record<string,string>={FRESH:'FRESH',HELD:'HELD',AT_REFERENCE:'ON',REFERENCE_LOST:'LOST',RECOVERED_AFTER_LOSS:'RETURNED',HISTORICAL:'OLD',NO_EVENT:'NONE',UNAVAILABLE:'UNKNOWN'};
 return ['FAILED_LOW_RECLAIM','BAND_REENTRY'].map(id=>{const s=reading.signals.find((r:any)=>r.id===id),name=id==='FAILED_LOW_RECLAIM'?'LOW':'BAND';return s.status==='NO_EVENT'||s.status==='UNAVAILABLE'?[name,states[s.status]]:s.status==='HISTORICAL'?[name,'OLD',s.ageIntervals]:[name,states[s.status],s.ageIntervals,Math.round(s.reference*100)/100,s.firstReferenceLostDate??null];});
}
