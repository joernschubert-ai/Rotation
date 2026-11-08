import type {AppFact} from './aiResearchAppFacts';
import type {MeaningIssue} from './aiResearchSelectionMeaning';
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const exempt=(text:string,index:number,length:number)=>/[„“«»"]/.test(text)||/\b(?:wenn|falls|w[üu]rde|k[öo]nnte|nicht|kein\w*|falsch|irrt[üu]mlich)\b/i.test(text.slice(Math.max(0,index-55),index))||/^(?:\s+ist)?\s+(?:falsch|unrichtig|nicht\s+zutreffend)/i.test(text.slice(index+length,index+length+45));
/** Checks only explicit local contradictions against own dated facts. Absence of a finding is not verification. */
export function auditRecoveryStatements(text:string,instrument:string,own:AppFact[]):MeaningIssue[]{
 const findings:MeaningIssue[]=[],entry=own.find(f=>/-F-ENTRY-TIMING$/.test(f.id)),a=entry?.values.anticyclical as Record<string,any>|undefined;
 const current=a?.version==='ANTICYCLICAL_ENTRY_CONTEXT_V1'&&a.status==='AVAILABLE'&&a.asOf===entry?.asOf;
 const reclaim=current&&finite(a?.rsi14)&&a.rsi14>=30&&Array.isArray(a.rules)&&a.rules.some((r:any)=>r.id==='RSI_RECLAIM'&&r.current?.active===true);
 const returns:Array<{value:number;source:string}>=[];
 for(const f of own){
  if(f.domain==='Historische Vergleiche'&&(f.values.periodBinding as Record<string,any>|undefined)?.kind==='HISTORICAL_FORWARD_RETURN'){
   const stats=f.values.statistics as Record<string,any>|undefined;for(const k of ['meanPct','medianPct'])if(finite(stats?.[k]))returns.push({value:stats![k],source:f.id});
  }
 }
 if(current){
  for(const rule of Array.isArray(a.rules)?a.rules:[])for(const h of Array.isArray(rule.horizons)?rule.horizons:[])for(const k of ['meanReturnPct','medianReturnPct'])if(finite(h.statistics?.[k]))returns.push({value:h.statistics[k],source:`${entry!.id}/${rule.id}/${h.horizonIntervals}`});
  for(const rule of Array.isArray(a.asymmetricEvidence?.studies)?a.asymmetricEvidence.studies:[])for(const h of Array.isArray(rule.horizons)?rule.horizons:[])for(const k of ['meanPct','medianPct'])if(finite(h.cases?.[k]))returns.push({value:h.cases[k],source:`${entry!.id}/${rule.id}/${h.intervals}`});
 }
 // Decimal points stay in their number; unrelated later sentences cannot supply a match.
 for(const clause of text.split(/(?<!\d)[.!?]|[.!?](?!\d)|\n/).filter(Boolean)){
  const wrongDirection=/\bRSI(?:\s*14)?[-\s]*(?:Rückkehr|Rueckkehr|Reclaim)(?:\s+(?:erfolgt|erfolgte|geht))?\s+nach\s+unten|\bRSI(?:\s*14)?\s+(?:fällt|faellt|sinkt|kehrt)\s+(?:(?:wieder|jetzt|neu)\s+)?(?:unter\s*(?:die\s+)?30(?!\d|[.,]\d)|nach\s+unten)/i.exec(clause);
  if(reclaim&&wrongDirection&&!exempt(clause,wrongDirection.index,wrongDirection[0].length))findings.push({instrument,code:'RSI_RECLAIM_DIRECTION_CONTRADICTION',quote:clause.trim(),explanation:`Eigener RSI14 ${a!.rsi14.toFixed(2)} am ${a!.asOf}: frische Rückkehr von unter 30 auf/über 30, also nach oben. Das ist ein frühes Erholungszeichen, keine bestätigte Bodenbildung und kein neuer Abwärtsübertritt.`});
  const typed=/Volatilit(?:ät|aet)[^;!?]{0,90}(?:Median|Mittel(?:wert)?|Rendite)[^\d+-]{0,15}([+-]?\d{1,3}(?:[.,]\d+)?)\s*%/i.exec(clause);
  if(typed&&!exempt(clause,typed.index,typed[0].length)){
   const value=Number(typed[1].replace(',','.')),matched=returns.find(r=>Math.abs(r.value-value)<=.006);
   if(matched)findings.push({instrument,code:'HISTORICAL_RETURN_IS_NOT_VOLATILITY',quote:clause.trim(),explanation:`Die zugeordnete Zahl ${typed[1]} % stammt aus einer historischen folgenden Indexrendite, nicht aus einer Volatilitätsmessung. Ein positiver Folgerenditewert ist Erholungskontext und kein Beleg für größere Falltiefe oder einen Optionsgewinn.`});
  }
 }
 return findings;
}
