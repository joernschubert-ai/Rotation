import { researchEvidenceReferences } from './aiResearchEvidenceReferences';
import { auditSemanticBindings } from './aiResearchSemanticBindingAudit';
import { auditInstrumentCitations } from './aiResearchInstrumentCitationAudit';
import { auditPeriodCitations } from './aiResearchPeriodCitationAudit';
import { modelEvidenceRegistry } from './aiResearchModelEvidenceRegistry';
import { auditBoundPatternClaims } from './aiResearchBoundPatternAudit';
import { auditPriceEffects } from './aiResearchPriceEffectAudit';
import { buildResearchConcepts } from './aiResearchConcepts';
import { auditTemporalInterpretation } from './aiResearchTemporalSemantics';
import { auditReturnPeriods } from './aiResearchReturnPeriodAudit';
import { auditPNFNarrative } from './aiResearchPNFNarrativeAudit';
import { auditCOTNarrative } from './aiResearchCOTNarrativeAudit';
import type { SynthesisEvidence } from './aiResearchSynthesisEvidence';
import { buildNarrativeFacts } from './aiResearchNarrativeFacts';
export interface NarrativeAudit {version:'NARRATIVE_CHECK_V2'|'NARRATIVE_CHECK_V3'|'NARRATIVE_CHECK_V59'|'NARRATIVE_CHECK_V61'|'NARRATIVE_CHECK_V62'|'NARRATIVE_CHECK_V63'|'NARRATIVE_CHECK_V64'|'NARRATIVE_CHECK_V65'|'NARRATIVE_CHECK_V66'|'NARRATIVE_CHECK_V72'|'NARRATIVE_CHECK_V73'|'NARRATIVE_CHECK_V75'|'NARRATIVE_CHECK_V76'|'NARRATIVE_CHECK_V77'|'NARRATIVE_CHECK_V78';status:'ISSUES_FOUND'|'NO_COVERED_ISSUES_FOUND';scope:string;findings:Array<{code:string;market?:string;quote?:string;correction:string}>;}
/** Narrow contradiction checks, not a truth classifier for unrestricted language. */
export function auditNarrative(text:string,evidence:SynthesisEvidence[],inputText?:string):NarrativeAudit{
 const facts=buildNarrativeFacts(evidence),findings:NarrativeAudit['findings']=[];
 const headings=[...text.matchAll(/^\s*(?:#{1,6}\s*)?(?:\*\*)?(Nasdaq(?:-100)?(?: Put| Call)?|Russell(?: 2000)?(?: Call)?)[^\n]*$/gim)];
 const blocks=headings.map((h,i)=>({market:/Russell/i.test(h[1])?'RUSSELL_2000':'NASDAQ',title:h[1],body:text.slice(h.index!+h[0].length,headings[i+1]?.index??text.length)}));
 for(const block of blocks){
  const own=facts.indices[block.market],chart=own.completedChart;
  for(const sentence of block.body.split(/(?<=[.!?])\s+|\n/)){
   for(const ma of chart.averages){
    if(ma.relation==='UNBEKANNT'||ma.relation==='AUF')continue;
    const period=ma.period;
    // Only explicit current relation, never future recapture or hypothetical conditions.
    const above=new RegExp(`(?:liegt|steht|notiert|bleibt|ist)\\s+(?:noch\\s+|weiterhin\\s+|aktuell\\s+)?über\\s+(?:der\\s+)?MA\\s*${period}\\b`,'i');
    const below=new RegExp(`(?:liegt|steht|notiert|bleibt|ist)\\s+(?:noch\\s+|weiterhin\\s+|aktuell\\s+)?unter\\s+(?:der\\s+)?MA\\s*${period}\\b`,'i');
    const inverse=new RegExp(`MA\\s*${period}\\s+(?:noch\\s+)?(?:liegt|steht|bleibt|ist)\\s+(?:noch\\s+|weiterhin\\s+|aktuell\\s+)?(über|unter)\\s+dem\\s+Kurs`,'i').exec(sentence)
     ??new RegExp(`MA\\s*${period}\\s+(?:noch\\s+)?(über|unter)\\s+dem\\s+Kurs\\s+(?:liegt|steht|bleibt|ist)`,'i').exec(sentence);
    const enumerated=[...sentence.matchAll(/(?:liegt|steht|notiert|bleibt|ist)\s+(?:noch\s+|weiterhin\s+|aktuell\s+)?(über|unter)\s+(?:(?:der|den)\s+)?((?:MA\s*\d+)(?:(?:\s*,\s*|\s+(?:und|sowie)\s+|\s*\/\s*)(?:MA\s*)?\d+)*)/gi)].find(m=>[...m[2].matchAll(/\d+/g)].some(n=>Number(n[0])===period));
    const listed=enumerated&&!/\b(?:wenn|falls|sollte|würde|könnte|künftig|zukünftig)\b/i.test(sentence)?(enumerated[1].toLowerCase()==='über'?'ÜBER':'UNTER'):null;
    const relation=above.test(sentence)?'ÜBER':below.test(sentence)?'UNTER':listed??(inverse?(inverse[1].toLowerCase()==='über'?'UNTER':'ÜBER'):null);
    const allBelow=/(?:liegt|steht|notiert|bleibt|ist)\s+(?:aktuell\s+)?unter\s+allen\s+drei\s+(?:Moving Averages|Durchschnitten|MA-Linien)/i.test(sentence);
    if((relation&&relation!==ma.relation)||(allBelow&&ma.relation==='ÜBER'))findings.push({code:'MA_RELATION_CONTRADICTION',market:block.market,quote:sentence.trim(),correction:ma.fact});
    if(ma.relation==='UNTER'&&new RegExp(`MA\\s*${period}[^.!?]{0,45}(?:bleibt|ist|fungiert)[^.!?]{0,25}Unterstützung`,'i').test(sentence))findings.push({code:'MA_SUPPORT_NOT_ESTABLISHED',market:block.market,quote:sentence.trim(),correction:`${ma.fact} Eine bestehende Unterstützung an dieser oberhalb des Kurses liegenden MA ist aus diesem Kursvergleich nicht belegt.`});
   }
   if(/Call/i.test(block.title)&&/Anstieg|Kursanstieg|Erholung/i.test(sentence)&&/Call-Idee\s+schwächen/i.test(sentence))findings.push({code:'CALL_PRICE_DIRECTION_CONFLICT',market:block.market,quote:sentence.trim(),correction:'Steigender eigener Index wirkt grundsätzlich zugunsten eines Calls. Eine abweichende Optionsbewertung benötigt zusätzliche Optionsdaten, die hier nicht vorliegen.'});
   if(/Call/i.test(block.title)&&/(?:stärkstes|größtes)(?:\s+instrumentgerechtes)?\s+Gegenrisiko\s*:/i.test(sentence)&&/Rückkehr\s+über|Erholung\s+über|Kursanstieg/i.test(sentence)&&!/weitere\s+Schwäche|ausbleib|scheiter|\bnicht\b|\bkein\w*\b/i.test(sentence))findings.push({code:'CALL_COUNTER_RISK_REVERSED',market:block.market,quote:sentence.trim(),correction:'Eine Rückkehr des eigenen Index über eine höhere Kursreferenz würde die Call-Idee richtungsbezogen stärken. Das Gegenrisiko ist weitere Schwäche. Dies bewertet keine allgemeine Marktrichtung oder konkrete Optionsrendite.'});
   if(/historisch/i.test(sentence)&&/oft|häufig|meist|langfristig|länger|tiefer/i.test(sentence)&&!/\d+[,.]?\d*\s*%/.test(sentence)){
    const study=own.historicalStudies.find((s:any)=>s.family==='OWN_TREND'&&s.focus20D);
    const stats=study?.focus20D;
    findings.push({code:'HISTORICAL_CLAIM_NEEDS_EVIDENCE',market:block.market,quote:sentence.trim(),correction:stats?`Diese allgemeine Verlaufsbehauptung ist durch den mitgelieferten Mittelwertvergleich allein nicht belegt. Eigene 20-Sitzungs-Studie: Mittel ${stats.meanPct} %, Basis ${stats.baselineMeanPct} %, Mehrertrag ${stats.excessMeanPp} Prozentpunkte; p10/p90 ${stats.p10Pct}/${stats.p90Pct} %. Das beweist keine längeren oder tieferen Abwärtsverläufe.`:'Die historische Verlaufsbehauptung nennt keinen konkreten Studienbezug. Mit den verfügbaren Angaben ist sie nicht verifiziert; damit ist sie nicht automatisch widerlegt.'});
   }
  }
 }
 for(const title of ['Nasdaq Put','Nasdaq Call','Russell Call'])if(!blocks.some(b=>b.title.toLowerCase()===title.toLowerCase()))findings.push({code:'INSTRUMENT_SECTION_NOT_IDENTIFIED',correction:`Eigener Abschnitt ${title} nicht eindeutig erkannt; das ist eine Vollständigkeitsprüfung, kein Beweis fehlender Erwähnung im Fließtext.`});
 if(typeof inputText==='string'){
  const valid=new Set(modelEvidenceRegistry(inputText).keys());
  const unknown=new Set<string>();
  for(const id of researchEvidenceReferences(text)){
   if(valid.has(id)||unknown.has(id))continue;unknown.add(id);
   findings.push({code:'UNKNOWN_EVIDENCE_REFERENCE',quote:'['+id+']',correction:`Belegnummer ${id} ist in der tatsächlich übergebenen Eingabe nicht vorhanden. Keine automatische Ersetzung oder Bestätigung des zugehörigen Inhalts.`});
  }
 }
 findings.push(...auditCOTNarrative(blocks,facts.indices).filter(f=>!['COT_GROUP_NOT_IDENTIFIED','COT_NET_STATE_NOT_IDENTIFIED','COT_WEEK_NOT_IDENTIFIED','COT_HORIZON_CONFLICT_NOT_IDENTIFIED','COT_SECTION_NOT_IDENTIFIED'].includes(f.code)));
 findings.push(...auditPNFNarrative(blocks,facts.indices));
 findings.push(...auditReturnPeriods(blocks,facts.indices));
 findings.push(...auditTemporalInterpretation(blocks,facts.indices));
 const concepts=buildResearchConcepts(facts).indices;
 findings.push(...auditPriceEffects(blocks,concepts));
 findings.push(...auditSemanticBindings(blocks,facts.indices,concepts));
 findings.push(...auditInstrumentCitations(blocks,concepts));
 findings.push(...auditPeriodCitations(blocks,facts.indices,inputText));
 findings.push(...auditBoundPatternClaims(blocks,concepts,inputText));
 return {version:'NARRATIVE_CHECK_V78',status:findings.length?'ISSUES_FOUND':'NO_COVERED_ISSUES_FOUND',scope:'Begrenzte Sprachprüfung: Instrumentabschnitte, ausgewählte MA-Relationen/Unterstützungsbehauptungen, direkte Call-Richtungsfehler, historische Verlaufsbehauptungen ; keine Pflicht zum Abschreiben der Faktenkarten. Belege in eckigen und runden Klammern werden erkannt. Bei vorhandener Originaleingabe werden vollständige Belegnummern einschließlich Unterstrichen und NEWS-Kennungen auf Existenz geprüft, nicht auf inhaltliche Passung. Codeartige eckige Platzhalter werden ebenfalls geprüft; gewöhnliche Klammertexte und Linkbeschriftungen bleiben ausgenommen. Zahlenpakete und COT-Horizonte stehen vollständig in den Fachkarten; ihre Wiederholung im KI-Text ist nicht erforderlich. COT: begrenzte Prüfung auf eigene Gruppen, Nettozustände, Wochenänderungen, Konfliktnennung und ausgewählte eindeutige Zustands-/Überhangwidersprüche. Explizite 1W-Konfliktzusammenfassungen und dabei verwechselte Gruppenbelege werden begrenzt geprüft. Mehrdeutige Aussagen bleiben ungeprüft. P&F: ausgewählte ausdrückliche Bestätigungsbehauptungen benannter Formationen werden gegen FORMING/Widerlegung und zitierte Ereignisfamilien geprüft. Frühe Markthypothesen bleiben frei; keine allgemeine Richtungs- oder Prognoseprüfung. Explizite beobachtete N-Sitzungsrenditen werden zahlen-/zeitraumbezogen sowie auf ausdrücklich positives/negatives Vorzeichen geprüft; historische und hypothetische Aussagen sowie freie Umformulierungen sind nicht umfassend geprüft. Zusätzlich begrenzte Hinweise auf verwechselte historische Zeitrichtung, fehlende Einordnung historischer Auslösungen und explizite Bestätigungsschranken für frühe Thesen. Diese Begründungshinweise schreiben keine Marktrichtung vor. Konkrete referenzgebundene Preiswirkungen werden in ausgewählten eindeutigen Formulierungen geprüft; spätere Gegenbewegungen und komplexe Kausalität bleiben manuell zu prüfen. Zusätzliche Belegbindung prüft ausdrücklich zitierte Breitenwerte/-Verläufe, ausgewählte P&F-Rollen, COT-Qualifikationen/Konfliktpaare, erfüllte Preisbedingungen und historische Sicherheitsbehauptungen. Widersprüche und gesonderte Prüfhinweise sind unterschieden; keine vollständige semantische Wahrheitsprüfung. Rollenprüfung ergänzt Hinweise auf MA-Lage statt MA-Steigung, Säulenzustand statt konkreter Preisbedingung, Konstellationsabgleich statt historischer Studie und unbelegte MA-Kausalität/Widerstandsfunktion. Instrumentbindung ergänzt eng begrenzte Hinweise auf Call-Risiko mit Put-Timing-Beleg, notwendige allgemeine Preisreferenzen, Mustertrigger mit Mechanikbeleg und falsche Instrumentzuordnungen. Zeitprüfung ergänzt eigene WINDOW-/ROTATION-Belege gegen ausdrücklich als Wochen bezeichnete Dynamik und einen eng beleggebundenen CASE-Abgleich sowie MA200-Support-Hinweise. Das Belegregister erfasst zusätzlich geprüfte verschachtelte BIND-Trigger. Explizite FORM-Triggerrichtung und Instrumentwirkung sowie ausgewählte Episodenmittel-Behauptungen werden quellgebunden geprüft. Kein Befund bestätigt keine Richtigkeit.',findings};
}


