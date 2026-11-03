import {buildDomainBriefs} from './aiResearchDomainBriefs';
type Briefs=ReturnType<typeof buildDomainBriefs>;
const finite=(v:unknown):number|null=>typeof v==='number'&&Number.isFinite(v)?v:null;
const shown=(v:unknown)=>finite(v)===null?'unbekannt':String(v);
/** Explicit limits of the supplied observations; no trading thresholds or new predictions. */
export function buildDomainBoundaries(briefs:Briefs){
 return ['NASDAQ','RUSSELL_2000'].map(market=>{
  const cot=briefs.cot.filter(c=>c.market===market),history=briefs.history.filter(h=>h.market===market&&h.currentMatch);
  const cotLimits=cot.map(c=>{
   const reduction=c.horizons.filter(h=>h.quality==='CALCULATED_FROM_SUPPLIED_VALUES'&&h.transition==='SHORT_OVERHANG_SMALLER').map(h=>h.weeks);
   const crossings=c.horizons.filter(h=>h.quality==='CALCULATED_FROM_SUPPLIED_VALUES'&&['SHORT_TO_LONG','LONG_TO_SHORT'].includes(h.transition)).map(h=>({weeks:h.weeks,transition:h.transition}));
   return {sourceId:c.id,netState:c.netState,net:c.net,shortReductionHorizons:reduction,netCrossings:crossings,
    text:c.netState==='NET_SHORT'&&reduction.length?`${c.id}: Über ${reduction.join('/')} Woche(n) wird der Netto-Shortüberhang kleiner; aktuell weiterhin netto short (${c.net}). Das ist in diesen Fenstern kein Wechsel zu netto long und kein Nachweis einer Kurswende.`:
    `${c.id}: Aktueller Nettozustand ${c.netState}, netto ${c.net??'unbekannt'}. Änderungen je Fenster bleiben davon getrennt; nur ausdrücklich berechnete Netto-Nullwechsel als solche benennen.`,
    sizeOrSignificanceEvidence:'NOT_SUPPLIED_IN_THIS_CONTEXT'};
  });
  const histories=history.map(h=>{
   const s=h.statistics,mean=finite(s.meanPct),baseline=finite(s.baselineMeanPct),difference=mean!==null&&baseline!==null?mean-baseline:null,excess=difference!==null&&Number.isFinite(difference)?Number(difference.toFixed(10)):null,suppliedExcess=finite(s.excessMeanPp);
   const consistent=excess===null||suppliedExcess===null?null:Math.abs(excess-suppliedExcess)<0.000001;
   return {sourceId:h.id,meanPct:mean,baselineMeanPct:baseline,calculatedExcessPp:excess,suppliedExcessPp:suppliedExcess,excessConsistent:consistent,
    sampleSize:finite(s.sampleSize),nonOverlappingCount:finite(s.nonOverlappingCount),p10Pct:finite(s.p10Pct),p90Pct:finite(s.p90Pct),
    text:`${h.id}: Absolutes folgendes Indexmittel ${shown(mean)} %, Basis ${shown(baseline)} %. Rechnerische Differenz ${shown(excess)} Prozentpunkte${consistent===false?'; gelieferter Mehrertrag weicht ab, Widerspruch nicht auflösen':''}. p10/p90 ${shown(s.p10Pct)}/${shown(s.p90Pct)} %, Fälle ${shown(s.sampleSize)}, nichtüberlappende Fälle ${shown(s.nonOverlappingCount)}. Die Streuung bleibt bestehen; nichtüberlappend bedeutet nicht nachgewiesen unabhängig. Kein belegtes Konfidenzintervall für die nächste Rendite.`,
    proofLimit:'Kein nachgewiesener Prognosevorteil aus diesem Kontext. Das ist nicht der Nachweis, dass ein Vorteil fehlt. Negative relative Mehrerträge sind keine negativen absoluten Renditen.'};
  });
  return {market,cot:cotLimits,history:histories,
   groupLimit:'Gleichgerichtete Änderungen innerhalb desselben Fensters sind keine berechnete Zeitreihenkorrelation. Gegenläufige Zeitfenster sind kein Beleg gegeneinander handelnder Gruppen.',
   wordingLimit:'Unkalibrierte Nettokontraktzahlen belegen weder signifikant/groß/moderat im statistischen oder relativen Sinn noch eine Preiswirkung. Frühe bedingte Ideen bleiben möglich; Bestandsänderungen beweisen keine Kurs-Trendumkehr.',
   semanticTruthVerified:false};
 });
}
export function auditDomainBoundaries(raw:string,briefs:Briefs){
 const findings:Array<{instrument:string;code:string;message:string;quote:string}>=[];
 if(raw.length>18000)return findings;
 let root:any;try{root=JSON.parse(raw);}catch{return findings;}
 for(const r of Array.isArray(root?.instruments)?root.instruments:[]){
  if(!['NASDAQ_PUT','NASDAQ_CALL','RUSSELL_CALL'].includes(r?.instrument)||typeof r.hypothesis!=='string')continue;
  const market=r.instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ';
  for(const sentence of r.hypothesis.split(/(?<=[.!?;])\s+/)){
   const qualifier=/nachgewiesen|belegt|untersucht|berechnet|getestet/i;
   const add=(code:string,message:string)=>findings.push({instrument:r.instrument,code,message,quote:sentence});
   if(/\bsignifikant(?:e|en|er|es)?\b/i.test(sentence)&&!/\b(?:kein(?:e|en|er|es)?|nicht)\b.{0,35}signifikant|signifikant.{0,45}(?:nicht|unbekannt)/i.test(sentence)&&!qualifier.test(sentence))add('COT_SIZE_SIGNIFICANCE_REVIEW','Die Aussage verwendet signifikant ohne gelieferten Größenmaßstab oder Signifikanzprüfung. Als offene Prüfmarkierung verstehen, nicht automatisch als widerlegt.');
   if(/korrelier|korrelation/i.test(sentence)&&!/\b(?:kein(?:e|en|er|es)?|nicht|ohne)\b.{0,60}(?:korrelier|korrelation)|korrelation.{0,45}(?:nicht|unbekannt)/i.test(sentence))add('GROUP_ALIGNMENT_NOT_CORRELATION','Gleiche Änderungsrichtung ist beobachtet, eine Zeitreihenkorrelation wurde hier nicht berechnet.');
   if(/trendumkehr|trendwende/i.test(sentence)&&!/\b(?:kein(?:e|en|er|es)?|nicht|ohne)\b|möglich|hypothese|könnte|kann|falls|sofern|wenn|denkbar|potenziell|unklar|unbekannt/i.test(sentence))add('POSITION_SHIFT_NOT_PROVEN_TREND_REVERSAL','Ein Positionsüberhang kann kleiner werden und trotzdem bestehen bleiben. Netto-Nullwechsel nur aus dem konkreten Gruppen-/Horizontbefund benennen; eine Kurswende ist daraus nicht bewiesen.');
   const deniedProof=/\bkein(?:en|er|e|es)?\s+(?:Prognosevorteil|Vorhersagevorteil|prognostischen Vorteil)\s+(?:beweist|beweisen|belegt|belegen|nachweist|nachweisen)\b|\b(?:beweist|beweisen|belegt|belegen|nachweist|nachweisen)\s+kein(?:en|er|e|es)?\s+(?:Prognosevorteil|Vorhersagevorteil|prognostischen Vorteil)\b/i;
   if(/\b(?:ohne|kein(?:en|er|e|es)?)\s+(?:einen?\s+)?(?:Prognosevorteil|Vorhersagevorteil|prognostischen Vorteil)\b/i.test(sentence)&&!qualifier.test(sentence)&&!deniedProof.test(sentence))add('NO_PROVEN_EDGE_NOT_PROVEN_NO_EDGE','Kein Nachweis eines Prognosevorteils ist nicht gleichbedeutend mit nachgewiesen fehlendem Vorteil.');
  }
  const matched=briefs.history.some(h=>h.market===market&&h.currentMatch);
  if(matched&&/\bnicht[-\s]?überlappend\w*\s+(?:Sitzungs)?Intervall\w*/i.test(r.hypothesis))findings.push({instrument:r.instrument,code:'HISTORY_CASES_NOT_INTERVALS',quote:r.hypothesis,message:'Die gelieferte nichtüberlappende Fallzahl zählt Fälle, keine einzelnen Sitzungsintervalle. Formulierung prüfen; der folgende Renditehorizont ist davon getrennt.'});
  if(matched&&!/Streuung|p10|p90|Bandbreit|Verteilung|nicht.?überlapp|Stichprob|Fallzahl|Fälle/i.test(r.hypothesis))findings.push({instrument:r.instrument,code:'HISTORY_LIMITS_NOT_EXPLICIT',quote:r.hypothesis,message:'Im Text fehlt ein ausdrücklicher Hinweis auf historische Streuung oder Stichprobengrenzen. Dies ist nur eine begrenzte Wortlautprüfung, kein Nachweis, wie das Modell intern abgewogen hat.'});
 }
 return findings;
}
