// Compare index closes at the precision presented by the market data (0.01 index point).
// Provider float revisions below one displayed cent are treated as equivalent.
export const MEMORY_CLOSE_COMPARISON_POLICY='INDEX_CLOSE_ROUNDED_CENT_V3';
export const MEMORY_CLOSE_ABSOLUTE_TOLERANCE=0.005;
const cents=(value:number)=>Math.round(value*100);
export function equivalentMemoryCloses(a:number,b:number):boolean{
 return Number.isFinite(a)&&Number.isFinite(b)&&a>0&&b>0&&cents(a)===cents(b);
}
export function memoryConflictEvidence(flag:unknown){
 if(!flag)return null;
 if(typeof flag==='object'&&flag!==null&&!Array.isArray(flag))return flag;
 return {policy:'LEGACY_EXACT_COMPARISON_V1',status:'UNRESOLVED_LEGACY_FLAG',competingValueRetained:false,automaticClearAllowed:false};
}