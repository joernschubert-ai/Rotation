import type {ContextLinkPolicy} from './aiResearchScenarioContextLinks';
/** Display-only accounting. Never infer that an unselected fact was ignored or understood. */
export function contextSelectionCoverage(policy:ContextLinkPolicy,view:unknown){
 const rows=Array.isArray(view)?view:null;
 return {version:'CONTEXT_SELECTION_COVERAGE_V1',origin:'APP_COUNTS_NOT_MODEL_REASONING',status:rows?'VALID_SELECTION_AVAILABLE':'NO_VALID_SELECTION',markets:policy.catalog.map(c=>{
  const row=rows?.find(r=>r?.market===c.market);
  const selected=new Set<string>(Array.isArray(row?.links)?row.links.map((l:any)=>l.context?.id).filter((id:unknown):id is string=>typeof id==='string'):[]);
  const domain=(name:string,ids:string[])=>({domain:name,availableIds:ids,selectedIds:ids.filter(id=>selected.has(id)),notSelectedIds:ids.filter(id=>!selected.has(id)),availableCount:ids.length,selectedCount:ids.filter(id=>selected.has(id)).length,status:!row?'NOT_ASSESSED':!ids.length?'NO_ELIGIBLE_SOURCES':ids.some(id=>selected.has(id))?'REFERENCED_IN_SELECTION':'NO_REFERENCE_SELECTED'});
  return {market:c.market,unresolved:row?row.unresolved:null,domains:[domain('COT',c.cotIds),domain('HISTORICAL_STUDIES',c.historyIds),domain('SHARED_CONTEXT',c.riskIds)]};
 }),limits:'Eine gewählte Kennung belegt nur einen Querverweis. Keine gewählte Kennung bedeutet nicht, dass die KI die Quelle ignoriert hat. Weder vollständiges Verständnis, unabhängige Bestätigung, passende Gewichtung noch Prognosequalität sind damit geprüft.'};
}
