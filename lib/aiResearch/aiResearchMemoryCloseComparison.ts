// Absolute tolerance: half of one 0.01 index point. No relative/percentage tolerance.
export const MEMORY_CLOSE_COMPARISON_POLICY='INDEX_CLOSE_ABSOLUTE_HALF_CENT_V2';
export const MEMORY_CLOSE_ABSOLUTE_TOLERANCE=0.005;
export function equivalentMemoryCloses(a:number,b:number):boolean{
 return Number.isFinite(a)&&Number.isFinite(b)&&a>0&&b>0&&Math.abs(a-b)<=MEMORY_CLOSE_ABSOLUTE_TOLERANCE;
}
export function memoryConflictEvidence(flag:unknown){
 if(!flag)return null;
 if(typeof flag==='object'&&flag!==null&&!Array.isArray(flag))return flag;
 return {policy:'LEGACY_EXACT_COMPARISON_V1',status:'UNRESOLVED_LEGACY_FLAG',competingValueRetained:false,automaticClearAllowed:false};
}
