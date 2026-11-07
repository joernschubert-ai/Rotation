import {entryPairBinding} from './aiResearchEntryPairs';
import {auditEntryTimeUnits} from './aiResearchEntryTimeAudit';
import type {AppFacts} from './aiResearchAppFacts';
export function reviewEntryWeighing(raw:string,facts:AppFacts){
 let instruments:any[]=[];try{const r=JSON.parse(raw);if(Array.isArray(r?.instruments))instruments=r.instruments;}catch{}
 return {version:'ENTRY_WEIGHING_COVERAGE_V3',semanticTruthVerified:false,meaning:'Prüft ausdrückliche Gliederung, Themenabdeckung und ausgewählte Zeitangaben gegen Quellenfenster. Keine vollständige Sprachprüfung. Keine Wahrheit, Prognosequalität oder Handelsfreigabe. Originalantwort bleibt unverändert.',instruments:['NASDAQ_PUT','NASDAQ_CALL','RUSSELL_CALL'].map(instrument=>{
  const sourceId=instrument==='RUSSELL_CALL'?'R-F-ENTRY-TIMING':'N-F-ENTRY-TIMING';
  const relevant=facts.facts.some(f=>f.id===sourceId&&f.status==='CALCULATED');
  const matches=instruments.filter(r=>r?.instrument===instrument),row=matches.length===1?matches[0]:null;
  const text=typeof row?.hypothesis==='string'?row.hypothesis:'';
  const entry=facts.facts.find(f=>f.id===sourceId),context=entry?.values.context as Record<string,any>|undefined;
  const unavailable=context?.futuresReferenceMovePct===null;
  const availabilityAcknowledged=!unavailable||/Futures[^.;]{0,100}(?:unbekannt|fehlen|fehlend|nicht verfügbar|Handelspause|Wochenend|keine aktuellen)|(?:keine aktuellen|fehlende|unbekannte)[^.;]{0,35}Futures/i.test(text);
  const temporalFindings=auditEntryTimeUnits(text,instrument,facts);
  const binding=entryPairBinding(text,instrument,facts);
  const anti=entry?.values.anticyclical as Record<string,any>|undefined;
  const anticyclicalContext=anti?.version==='ANTICYCLICAL_ENTRY_CONTEXT_V1'&&anti.status==='AVAILABLE'?{available:true,asOf:anti.asOf,mentionsContext:/RSI|antizykl|60|80|langfrist|Monat/i.test(text),mentionsLongerHorizon:/60|80|langfrist|Monat/i.test(text),semanticTruthVerified:false}:undefined;
  const decision=anti?.asymmetricDecision as Record<string,any>|undefined;
  const concreteApplicable=anticyclicalContext?.available===true&&anti?.asOf===entry?.asOf&&decision?.version==='ASYMMETRIC_DECISION_V1';
  const concreteRSI=/RSI(?:14)?[^\d]{0,12}(\d{1,3}(?:[.,]\d+)?)/i.exec(text),expected=typeof anti?.rsi14==='number'?Math.round(anti.rsi14*100)/100:null;
  const rsiMatched=!!concreteRSI&&expected!==null&&Math.abs(Number(concreteRSI[1].replace(',','.'))-expected)<=.011;
  const noFresh=/kein(?:e|en|em)?[^.;]{0,45}(?:frisch|neu)[^.;]{0,35}(?:Preis|RSI|Signal|Erholungszeichen)|(?:Preis|RSI)[^.;]{0,35}(?:Signal|zeichen)[^.;]{0,25}(?:fehlt|offen)/i.test(text);
  const hasFreshMeaning=/R[üu]ckkehr|zur[üu]ck[^.;]{0,25}30|Divergenz|Erholungsmuster|Failure.?Swing|MA20[^.;]{0,30}(?:erobert|eroberung)/i.test(text);
  const longer=/60\s*(?:\/|und|oder|bis|–|-)\s*80|(?:60|80)[^.;]{0,15}(?:Intervall|Sitzung)/i.test(text);
  const concreteChecks={ownRSIValue:rsiMatched,signalOrAbsence:decision?.basisId?hasFreshMeaning:noFresh,longerHorizon:longer};
  const concreteEntryUse=concreteApplicable?{version:'CONCRETE_ENTRY_USE_V1',status:Object.values(concreteChecks).every(Boolean)?'EXPLICIT_CONTEXT_PRESENT':'CONTEXT_NOT_EXPLICIT',checks:concreteChecks,semanticTruthVerified:false,note:'Prueft ausdrueckliche eigene RSI-Zahl, Erholungszeichen/Abwesenheit und laengeren Horizont. Keine vollstaendige Bedeutungs- oder Prognosepruefung; Originalantwort unveraendert.'}:undefined;
  const checks={ownPairOrDeclaredOpen:['OWN_PAIR_REFERENCED','DECLARED_OPEN'].includes(binding.status),futuresAvailabilityAcknowledged:availabilityAcknowledged,structureLabel:/Struktur\s*:/i.test(text),currentLabel:/Jetzt\s*:/i.test(text),newEntryLabel:/Neueinstieg\s*:/i.test(text),mentionsFutures:/Futures/i.test(text)};
  const missingChecks=Object.entries(checks).filter(([,ok])=>!ok).map(([key])=>key);
  const formattingOnly=temporalFindings.length===0&&missingChecks.length===1&&missingChecks[0]==='structureLabel'&&/\bMA\s*(?:20|50|200)\b|Abwärtsstruktur|Aufwärtsstruktur|Marktstruktur|P&F/i.test(text);
  return {instrument,sourceId,applicable:relevant,status:!relevant?'NOT_APPLICABLE':!text?'NO_READABLE_HYPOTHESIS':temporalFindings.length?'TEMPORAL_REVIEW_REQUIRED':Object.values(checks).every(Boolean)?'EXPLICIT_WEIGHING_PRESENT':'INCOMPLETE_WEIGHING',checks,binding,temporalFindings,formattingOnly,formattingNote:formattingOnly?'Überschrift Struktur fehlt; ein Strukturbezug ist im Text ausdrücklich vorhanden. Keine vollständige inhaltliche Prüfung.':null,...(anticyclicalContext?{anticyclicalContext}:{}),...(concreteEntryUse?{concreteEntryUse}:{}),selectedEntrySource:Array.isArray(row?.arguments)&&row.arguments.some((a:any)=>a?.sourceId===sourceId),semanticTruthVerified:false};
 })};
}
