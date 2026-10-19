import type { SynthesisEvidence } from "./aiResearchSynthesisEvidence";
import { buildInstrumentBriefs } from "./aiResearchInstrumentBriefs";
const obj=(v:unknown):Record<string,any>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,any>:{};
const num=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)?v:null;
function patternName(f:Record<string,any>){
 if(/^PNF_.*BOTTOM_BREAKDOWN$/.test(String(f.family)))return "P&F-Bruch unter vorheriges O-Tief";
 if(/^PNF_.*TOP_BREAKOUT$/.test(String(f.family)))return "P&F-Ausbruch über vorheriges X-Hoch";
 return String(f.family??"UNKNOWN");
}
/** Clarifies source meanings; does not add an investment vote or replace the raw evidence. */
export function buildResearchFactCard(price:unknown,structure:unknown,chart:unknown,history:unknown){
 const p=obj(price),s=obj(structure),c=obj(chart),h=obj(history),formations=obj(c.formations);
 const scales=Array.isArray(formations.pointFigure)?formations.pointFigure:[];
 const event=(value:unknown)=>{const f=obj(value);return Object.keys(f).length?{name:patternName(f),bias:f.bias,status:f.status,date:f.confirmedAt??f.discoveredAt,relation:f.currentRelation,confirmationLevel:f.confirmationLevel,invalidationLevel:f.invalidationLevel,target:f.status==='INVALIDATED'?null:f.target}:null;};
 return {current:{asOfDate:c.asOfDate??s.referenceDate??null,momentum5D:num(p.momentum5D),momentum20D:num(p.momentum20D),breadth:s.breadth??null,participation:num(s.participation),quality:num(s.quality),columns:scales.map((v:any)=>({box:v.boxPercent,direction:v.currentColumn}))},
  classic:(Array.isArray(formations.classic)?formations.classic:[]).map(event),
  priorPriceEvents:scales.map((v:any)=>({box:v.boxPercent,event:event(v.latest)})),
  unconfirmedSetups:scales.map((v:any)=>({box:v.boxPercent,event:event(v.forming)})).filter(v=>v.event),
  historicalReturn:{horizonDays:h.horizonDays??null,indexMeanPct:num(h.meanPct),baselineMeanPct:num(h.baselineMeanPct),meaning:"Absolute Indexrendite und relativer Basisvergleich getrennt; keine aktuelle Trendbestätigung."}};
}
/** Keep measured chart context, but expose formations once with readable names, not duplicate family IDs. */
export function compactReadableChart(value:unknown):Record<string,unknown>|null{
 if(!value||typeof value!=='object')return null;
 const {formations,...rest}=obj(value);
 const readable=(v:any):any=>Array.isArray(v)?v.map(readable):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([key,item])=>[key,key==='family'&&typeof item==='string'?patternName({family:item}):readable(item)])):v;
 return readable(rest);
}
/** Imprecise shorthand is a visible caveat, not proof of a false trading thesis. */
export function sourceInterpretationNotes(flow:any,evidence:SynthesisEvidence[]):string[]{
 const market=flow.instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ';
 const chart=obj(evidence.find(e=>e.id==='CHART_'+market&&e.available)?.data),formations=obj(chart.formations);
 const scales=Array.isArray(formations.pointFigure)?formations.pointFigure:[];
 const text=[flow.reasoning,flow.whyNow,flow.counterargument].join(' '),notes:string[]=[];
 if(/doppelboden|doppeltop|doppelhoch/iu.test(text)&&scales.length)notes.push('Die KI verwendet verkürzte Formationsnamen. Maßgeblich ist das eigene P&F-Muster: Ausbruch über X-Hoch oder Bruch unter O-Tief; daraus folgt keine klassische Boden- oder Topbildung.');
 if(scales.some((v:any)=>obj(v.latest).currentRelation==='COUNTER_TO_CURRENT_COLUMN')&&/ausbruch|breakout/iu.test(text))notes.push('Die genannte frühere Auslösung steht teilweise gegen die aktuelle P&F-Säule. Sie ist keine aktuelle Richtungsbestätigung.');
 return notes;
}
/** Targeted checks for explicit observed contradictions, NOT comprehensive language verification. */
export function inspectSourceBoundClaims(flow:any,evidence:SynthesisEvidence[]):string[]{
 const issues:string[]=[],market=flow.instrument==="RUSSELL_CALL"?"RUSSELL_2000":"NASDAQ";
 const chart=obj(evidence.find(e=>e.id==="CHART_"+market&&e.available)?.data),formations=obj(chart.formations);
 const scales=Array.isArray(formations.pointFigure)?formations.pointFigure:[];
 const classic=Array.isArray(formations.classic)?formations.classic:[];
 const prose=[flow.reasoning,flow.whyNow,flow.counterargument].filter(v=>typeof v==="string").join(" ");
 const mean=buildInstrumentBriefs(evidence).find(b=>b.instrument===flow.instrument)?.histories.find(h=>h.family==='OWN_TREND')?.meanPct;
 for(const sentence of prose.split(/[.!?](?:\s|$)/u)){
  const negated=/kein(?:e[rmns]?)?\s+(?:klassische[rmns]?\s+)?doppelboden|nicht.{0,18}doppelboden/iu.test(sentence);
  // Explicit future classic-base hypotheses remain allowed; an existing P&F O-break is not one.
  if(!negated&&/klassische[rmns]?\s+doppelboden/iu.test(sentence)&&/bestätigt|gemessen|erkannt|liegt vor/iu.test(sentence)&&classic.length===0&&!/falls|wenn|künftig|zukünftig/iu.test(sentence))issues.push("PNF_O_BREAK_MISLABELED_AS_CLASSIC_BASE");
  if(/doppeltop.breite|doppelhoch.breite/iu.test(sentence))issues.push("UNSUPPLIED_FORMATION_METRIC");
  if(/historisch|historie|folgerendite/iu.test(sentence)&&(typeof mean==='number'&&mean>0||/positiv|\+\s*\d/iu.test(sentence))&&/(?:spricht|sprechen|argument).{0,35}gegen (?:steigende|steigend|einen kursanstieg)|verhindert.{0,20}(?:anstieg|erholung)/iu.test(sentence)&&!/basis|vergleich|relativ|trotz|nicht|kein/iu.test(sentence))issues.push("POSITIVE_INDEX_RETURN_SIGN_REVERSED");
  if(/(?:aktuell|jetzt|derzeit)/iu.test(sentence)&&/bestätigt/iu.test(sentence)&&/aufwärts/iu.test(sentence)&&/P&F|ausbruch/iu.test(sentence)&&scales.length&&scales.every((v:any)=>v.currentColumn==='O')&&!/nicht|kein|falls|wenn|künftig/iu.test(sentence))issues.push("PRIOR_EVENT_IS_NOT_CURRENT_UP_CONFIRMATION");
 }
 return [...new Set(issues)];
}
