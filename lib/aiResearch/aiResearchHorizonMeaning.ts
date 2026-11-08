import type {AppFact} from './aiResearchAppFacts';
import type {MeaningIssue} from './aiResearchSelectionMeaning';
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
function conditionalOrQuoted(clause:string){return /[„“«»"]/.test(clause)||/\b(?:wenn|falls|w[üu]rde|k[öo]nnte)\b/i.test(clause)||/\?\s*$/.test(clause);}
/** Scoped diagnostics of attributed statistical claims, not a ban on qualitative contrary opinions. */
export function auditHorizonStatements(text:string,instrument:string,own:AppFact[]):MeaningIssue[]{
 const findings:MeaningIssue[]=[],entry=own.find(f=>/-F-ENTRY-TIMING$/.test(f.id)),a=entry?.values.anticyclical as Record<string,any>|undefined;
 if(entry?.status!=='CALCULATED'||a?.version!=='ANTICYCLICAL_ENTRY_CONTEXT_V1'||a.status!=='AVAILABLE'||a.asOf!==entry?.asOf||a.calibratedProbability!==false)return findings;
 const studies=Array.isArray(a.rules)?a.rules:[],descriptive=studies.some((r:any)=>(r.horizons??[]).some((h:any)=>h.statistics?.descriptiveOnly===true));
 if(!descriptive)return findings;
 const add=(code:string,quote:string,explanation:string)=>findings.push({instrument,code,quote:quote.trim(),explanation});
 for(const clause of text.split(/(?<!\bca\.)(?<!\bbzw\.)(?<!\bggf\.)(?<!z\.B\.)(?<=[.!?])\s+|\n/i)){
  if(conditionalOrQuoted(clause))continue;
  const statistics=/60\s*(?:\/|und|oder|bis|–|-)\s*80|historisch|Studie|Median|Mittelwert|statistisch/i.test(clause);
  if(!statistics)continue;
  const sig=/\bsignifikant\w*\b|\bSignifikanz\b/i.exec(clause);
  if(sig&&!/(?:keine?|nicht)\s+(?:statistische\s+)?Signifikanz\s+(?:belegt|nachgewiesen|untersucht)|Signifikanz(?:test)?\s+(?:fehlt|offen|unbekannt|nicht\s+(?:belegt|geprüft|geprueft|untersucht))|signifikant\w*[^.!?]{0,100}(?:nicht\s+(?:belegt|nachgewiesen)|unbelegt)|Signifikanz[^;.!?]{0,60}(?:nicht\s+(?:beurteilt|bewertet|untersucht|geprüft|geprueft|nachgewiesen|belegt)|unbekannt|offen|fehlt)/i.test(clause)){
   const local=clause.slice(Math.max(0,sig.index-65),sig.index+sig[0].length+75);
   if(/statistisch|Median|Rendite|R[üu]ckgang|R[üu]ckschlag|Erholung|Studie/i.test(local))add('HISTORICAL_SIGNIFICANCE_UNSUPPORTED',clause,'Geliefert sind beschreibende historische Vergleichszahlen, kein Signifikanztest. Weder statistische Signifikanz noch Nichtsignifikanz ist damit belegt; eine große Veränderung allein ist kein Testergebnis.');
  }
  const prob=/(?:sehr\s+)?(?:hohe|erh[öo]hte|gro(?:ß|ss)e)\s+(?:Erfolgs|Gewinn|Erholungs)?wahrscheinlichkeit|(?:Wahrscheinlichkeit|Erfolgschance)\s+(?:von|bei|betr[äa]gt)\s*\d+(?:[.,]\d+)?\s*%/i.exec(clause);
  if(prob){const before=clause.slice(Math.max(0,prob.index-45),prob.index),after=clause.slice(prob.index+prob[0].length);
   const denied=/(?:keine?|nicht|ohne)\s+(?:eine?\s+|als\s+|belegte\s+|nachgewiesene\s+)?$/i.test(before)||/^(?:[^;.!?]{0,55})(?:nicht\s+(?:belegt|nachgewiesen|ableitbar|kalibriert|behauptet)|unbelegt)/i.test(after);
   const explicitlyDenied=denied||/folgt[^;.!?]{0,25}nicht|fehlt[^;.!?]{0,25}(?:Beleg|Grundlage)/i.test(after);
   const forecast=/f[üu]r\s+(?:weitere\s+)?(?:R[üu]cksetzer|R[üu]ckg[äa]nge|Verluste|Erholung|Gewinne)|heute|jetzt|k[üu]nftig|kommend/i.test(clause);
   const pastOnly=/(?:damaligen|früheren|frueheren|vergangenen)\s+(?:Fällen|Faellen|Beobachtungen)/i.test(clause)&&!/heute|jetzt|k[üu]nftig|kommend/i.test(clause);
   if(!explicitlyDenied&&!pastOnly&&forecast)add('HISTORICAL_PROBABILITY_UNCALIBRATED',clause,'Die historischen Mediane oder Stichproben liefern keine kalibrierte heutige Wahrscheinlichkeit. Ein Verlaufstief-Median beschreibt die Tiefe früherer Schlussrückgänge; er ist weder eine heutige Rückschlagswahrscheinlichkeit noch die Endrendite. Eine qualitative vorsichtige Einschätzung bleibt möglich.');
  }
  if(/(?:Verlaufstief|R[üu]ckgangs?-?Median|R[üu]ckschlags?-?Median|weiterer?\s+R[üu]ckgang)/i.test(clause)&&/(?:beweist|bedeutet|belegt|garantiert)[^.!?]{0,70}(?:negative|fallende|schlechte)\s+(?:Endrendite|Folgerendite)/i.test(clause)&&!/(?:kein\w*|nicht)\s+(?:Beweis|Beleg|automatisch|die|eine)|(?:beweist|bedeutet|belegt|garantiert)\s+(?:kein\w*|nicht)\b/i.test(clause)){
   const paired=studies.some((r:any)=>(r.horizons??[]).some((h:any)=>finite(h.statistics?.medianReturnPct)&&h.statistics.medianReturnPct>0&&finite(h.statistics?.medianWorstFurtherCloseChangePct)&&h.statistics.medianWorstFurtherCloseChangePct<0));
   if(paired)add('PATH_LOW_IS_NOT_END_RETURN',clause,'Tiefster Schluss im Folgefenster und Schlussrendite am Horizont sind unterschiedliche Messgrößen. In den eigenen Vergleichen können positive Endrendite-Mediane und negative Verlaufstief-Mediane zugleich vorliegen; ein Rückschlag belegt keine negative Endrendite.');
  }
 }
 return findings;
}
