import { researchEvidenceReferences } from './aiResearchEvidenceReferences';
import type { SemanticFinding } from './aiResearchSemanticBindingAudit';

/** Source-role review hints only. A missing measurement never proves the opposite. */
export function auditRoleBindings(blocks:Array<{market:string;title:string;body:string}>):SemanticFinding[]{
 const findings:SemanticFinding[]=[];
 for(const block of blocks){
  const prefix=block.market==='NASDAQ'?'N-F':'R-F';
  for(const sentence of block.body.split(/(?<=[.!?])\s+|\n/)){
   const text=sentence.trim(),refs=researchEvidenceReferences(text),own=refs.filter(id=>id.startsWith(prefix+'-'));
   if(!text||!own.length)continue;
   const negated=/\b(?:nicht|kein\w*|unbelegt|unbekannt|ungestützt)\b/iu.test(text);
   const conditional=/\b(?:wenn|falls|würde|könnte|sollte)\b/iu.test(text);
   const add=(code:string,correction:string)=>findings.push({code,market:block.market,quote:text,severity:'REVIEW',correction:'Prüfhinweis: '+correction});
   const averages=own.filter(id=>new RegExp('^'+prefix+'-MA(?:20|50|200)(?:-(?:UP|DOWN))?$').test(id));
   const maTrend=/MA\s*(?:20|50|200)[^.!?]{0,65}(?:Richtung|Steigung)[^.!?]{0,35}(?:nach\s+(?:unten|oben)|fallend|steigend)|(?:fallend\w*|steigend\w*|sinkend\w*)\s+(?:MA\s*(?:20|50|200)|Durchschnitte)/iu.test(text);
   if(averages.length&&maTrend&&!negated&&!conditional&&!refs.some(id=>/PATH|SLOPE|TREND_SERIES/.test(id)))add('MA_LEVEL_AS_SLOPE_REVIEW','Die zitierte MA-Lage beziehungsweise UP/DOWN-Preisreferenz beschreibt den Kursvergleich, keine zeitliche Steigung des Durchschnitts. Für eine fallende/steigende MA ist eine eigene datierte MA-Reihe erforderlich; ihre Richtung bleibt hier offen.');
   if(own.some(id=>/-PF[01]-COLUMN$/.test(id))&&!negated&&/Preisbedingung/iu.test(text)&&/(?:Ausbleiben|Verbleib|Fortbestehen|keine\s+Säulenumkehr)/iu.test(text)&&!own.some(id=>/-GRID\d+$|-(?:TRIGGER|INVALID|UP|DOWN)$/.test(id)))add('COLUMN_STATE_AS_PRICE_CONDITION_REVIEW','Säulenrichtung oder das Ausbleiben einer Umkehr ist ein Zustandskriterium, keine konkrete offene Kursmarke. Der zitierte COLUMN-Beleg enthält keine Umkehrpreisschwelle. Eine zusätzliche datierte Grid-/Preisreferenz wäre getrennt zu nennen.');
   if(averages.length&&/Erholung|Rebound|Aufwärtsbewegung/iu.test(text)&&/ausgelöst|verursacht|erzwingt/iu.test(text)&&/Erreichen|Überschreiten|Überwinden|Rückkehr/iu.test(text)&&!negated)add('MA_REFERENCE_AS_CAUSE_REVIEW','Eine Rückkehr über die MA-Referenz kann die Hypothese stärken, belegt aber keine Ursache der Erholung. Die Erholung kann bereits darunter beginnen. Eine bedingte Formulierung allein beweist ebenfalls keine Kausalität.');
   if(own.some(id=>/-CASE-(?:SUMMARY|\d+)$/.test(id))&&/historisch\w*[^.!?]{0,30}(?:gestützt|bestätigt|belegt|validiert)|historisch\w*\s+(?:Erfolgsquote|Studie)/iu.test(text)&&!negated&&!refs.some(id=>/-H\d+$|^HIST-TEMPORAL-/.test(id)))add('CURRENT_CASE_AS_HISTORICAL_EVIDENCE_REVIEW','CASE kennzeichnet den aktuellen regelgebundenen Konstellationsabgleich, keine historische Erfolgsstudie. Für historische Folgerenditen und Fallzahlen ist ein passender HIST-/H-Beleg erforderlich.');
   if(averages.length&&/MA\s*(?:20|50|200)[- ]?(?:Widerstand|Unterstützung)|(?:Widerstand|Unterstützung)[^.!?]{0,12}(?:der|am|bei)\s+MA\s*(?:20|50|200)/iu.test(text)&&!negated&&!conditional&&!/möglich|potenziell|hypothetisch|zu\s+prüfen/iu.test(text)&&refs.every(id=>averages.includes(id)))add('MA_REFERENCE_AS_ESTABLISHED_LEVEL_REVIEW','Die eigene MA-Zahlenrelation belegt noch keinen tragfähigen Widerstand oder Support. Die Marke ist zunächst eine datierte Referenz; ihre Bewährung benötigt weitere Preisbeobachtungen.');
  }
 }
 return findings;
}
