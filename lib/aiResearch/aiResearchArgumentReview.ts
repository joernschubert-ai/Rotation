import type {ContextLinkPolicy} from './aiResearchScenarioContextLinks';
/** Narrow review of explicit German predicates, not a general language or forecast validator. */
export function reviewScenarioArguments(policy:ContextLinkPolicy){
 const findings:Array<{market:string;field:string;code:string;quote:string;sourceIds:string[];explanation:string}>=[];
 const add=(market:string,field:string,code:string,quote:string,sourceIds:string[],explanation:string)=>findings.push({market,field,code,quote,sourceIds,explanation});
 for(const scenario of policy.base.scenarios){
  for(const field of ['reason','counterargument']){
   const text=typeof scenario[field]==='string'?scenario[field]:'';
   const references=[...new Set([...text.matchAll(/\b([NR]-F-PF[01]-(?:LAST|FORM|ADV))\b/g)].map(m=>m[1]))];
   const facts=references.map(id=>policy.byId.get(id)).filter(f=>f&&f.market===scenario.market);
   // This warning concerns the explicitly stated column opposition, not the historical signal itself.
   if(field==='counterargument'&&scenario.direction==='UP'&&/aktuelle\s+Säule\s+widerspricht\s+historischen\s+P&F-Auslösungen/iu.test(text)){
    const matching=facts.filter(f=>f&&/bearisch/i.test(f.text)&&/Säule gegenläufig|COUNTER_TO_CURRENT_COLUMN/.test(f.text));
    if(matching.length&&matching.length===facts.length)add(scenario.market,field,'COUNTERCOLUMN_EFFECT_REVIEW',text,matching.map(f=>f!.id),'Die ausdrücklich gegenläufige Säule relativiert die alten bearischen Auslösungen. Dieser Teilsatz ist deshalb für sich kein eindeutiges Gegenargument zur UP-These. Die historischen bearischen Signale können separat belastender Kontext bleiben. Keine neue bullische Bestätigung daraus ableiten.');
   }
   // Distinguish an explicit fresh-signal claim from a historically confirmed signal.
   if(/(?:frisches|neues|heutiges)\s+(?:bullisches\s+|bearisches\s+)?(?:P&F[- ]Signal|P&F[- ]Ausbruch|Signal)/iu.test(text)&&!/(?:kein|nicht|ohne)\s+(?:frisches|neues|heutiges)/iu.test(text)){
    const old=facts.filter(f=>f&&/keine heutige Auslösung|keine frische Bestätigung|keine heutige.*Prognose/i.test(f.text));
    if(old.length)add(scenario.market,field,'HISTORICAL_SIGNAL_FRESHNESS_REVIEW',text,old.map(f=>f!.id),'Die referenzierte App-Quelle beschreibt eine historische Auslösung und begründet kein frisches Signal. Historischer Status, aktuelle Säule und heutige Preisbedingung bleiben getrennt.');
   }
   // Alert only when an explicit O-column alone is called a bottom/turn confirmation.
   if(/O[- ]Säule.{0,45}(?:bestätigt|beweist).{0,35}(?:Boden|Aufwärtswende)/iu.test(text)&&!/(?:nicht|kein|keine).{0,20}(?:Boden|Aufwärtswende)/iu.test(text))add(scenario.market,field,'O_COLUMN_NOT_BOTTOM_PROOF',text,references,'Eine fallende O-Säule allein bestätigt keine Bodenbildung oder Aufwärtswende. Dafür ist ein eigener Formations-/Umkehrbefund nötig.');
  }
 }
 return {version:'SCENARIO_ARGUMENT_REVIEW_V1',origin:'APP_LIMITED_TEXT_REVIEW',baseEpisodeId:policy.base.id,factsHash:policy.base.factsHash,status:findings.length?'REVIEW_REQUIRED':'NO_COVERED_ISSUES_FOUND',findings,originalChanged:false,forecastChanged:false,semanticTruthVerified:false,scope:'Nur ausdrücklich formulierte deutsche Säulen-Gegenargumente, Frischesignalbehauptungen und O-Säulen-Bodenbeweise. Keine vollständige Sprach-, COT-, Gewichtungs- oder Prognoseprüfung. Fehlende Hinweise sind keine inhaltliche Freigabe.'};
}
