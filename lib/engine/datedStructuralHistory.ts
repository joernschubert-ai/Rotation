import {sessionComparisons} from './sessionComparisons';
export const DATED_STRUCTURAL_POLICY='DATED_STRUCTURAL_HISTORY_V2';
const paths:Record<string,string[]>={
 breadth20:['structure.breadth.b20','breadth20'],breadth50:['structure.breadth.b50','breadth50'],breadth200:['structure.breadth.b200','breadth200'],
 participationScore:['participation.score','participationScore'],liquidityScore:['liquidity.score','liquidityScore'],marketLiquidityScore:['liquidity.marketLiquidityScore','liquidity.metrics.liquidity','marketLiquidityScore'],
 marketQualityScore:['marketQuality.score','marketQualityScore'],gammaExposure:['gammaExposure','gamma.effectiveGamma'],creditRatio:['credit.rawRatio','creditRatio']};
const n=(v:any):number|null=>{if(typeof v==='number')return Number.isFinite(v)?v:null;if(v&&typeof v==='object')return n(v.value??v.current??v.score);return null;};
const read=(s:any,p:string[])=>{for(const key of p){const value=n(key.split('.').reduce((a,k)=>a?.[k],s));if(value!==null)return value;}return null;};
export function datedStructuralHistory(data:any,history:any[],now=Date.now()){
 const selector=sessionComparisons(data,history,now),rows:Record<number,any>={},dates:Record<number,string|null>={};
 for(const offset of [5,10,20]){
  const found=selector.row(offset);dates[offset]=selector.targetDate(offset);
  if(!found){rows[offset]=null;continue;}
  const output:any={observationDate:found.target,capturedAt:found.latest.timestamp};
  for(const [field,p]of Object.entries(paths)){
   const value=read(found.latest,p);output[field]=value!==null&&found.tied.every(s=>read(s,p)===value)?value:null;
  }
  rows[offset]=output;
 }
 return {policy:DATED_STRUCTURAL_POLICY,anchorDate:selector.anchorDate,structureDate:selector.structureDate,rows,dates,calendarVerified:false,legacyArchivePreserved:true};
}
const required:Record<string,Array<[number,string]>>={
 PARTICIPATION:[[5,'breadth50'],[10,'breadth50'],[10,'breadth200'],[20,'breadth200'],[5,'participationScore'],[10,'participationScore'],[20,'participationScore']],
 FRAGILITY:[[10,'participationScore'],[10,'breadth50'],[10,'liquidityScore'],[10,'marketQualityScore']],
 LIQUIDITY:[[10,'marketLiquidityScore'],[20,'marketLiquidityScore'],[10,'gammaExposure'],[10,'breadth50']],
 CRASH:[[10,'participationScore'],[10,'breadth50'],[10,'breadth200'],[10,'marketLiquidityScore']]};
export function structuralPeriodQuality(context:any,kind:string){
 if(context?.policy!==DATED_STRUCTURAL_POLICY)return {policy:'LEGACY_REPLAY_OR_UNDATED_CONTEXT',complete:false,verified:false,legacyCompatibility:true,missing:[] as string[]};
 const fields=required[kind]??[],missing=fields.filter(([off,key])=>n(context.rows?.[off]?.[key])===null).map(([off,key])=>off+':'+key);
 return {policy:DATED_STRUCTURAL_POLICY,complete:missing.length===0,verified:true,calendarVerified:false,anchorDate:context.anchorDate,structureDate:context.structureDate,dates:context.dates,missing,
  meaning:'Only dated matching own-universe observations. Missing trend inputs are not measured zero; compatibility arithmetic is partial. Legacy persistence history is retained separately.'};
}
