import { researchEvidenceReferences } from './aiResearchEvidenceReferences';
import type { SemanticFinding } from './aiResearchSemanticBindingAudit';

/** Narrow explicit citation-role checks; never rejects an entire thesis or edits provider prose. */
export function auditInstrumentCitations(blocks:Array<{market:string;title:string;body:string}>,concepts:Record<string,any>):SemanticFinding[]{
 const findings:SemanticFinding[]=[];
 for(const block of blocks){
  const prefix=block.market==='NASDAQ'?'N-F':'R-F',conditions=concepts[block.market]?.conditions??[];
  for(const sentence of block.body.split(/(?<=[.!?])\s+|\n/)){
   const text=sentence.trim(),refs=researchEvidenceReferences(text);
   if(!text||/\b(?:nicht|kein\w*|unbelegt)\b/iu.test(text))continue;
   const add=(code:string,correction:string)=>findings.push({code,market:block.market,quote:text,severity:'REVIEW',correction:'Prüfhinweis: '+correction});
   if(/Call/iu.test(block.title)&&/(?:stärkste\w*|größte\w*)\s+Gegenrisiko/iu.test(text)&&refs.includes('G-PUT_TIMING'))add('CALL_RISK_WITH_PUT_TIMING_REFERENCE','Das Put-Zeitfenster ist kein Beleg für das richtungsbezogene Call-Gegenrisiko. Dafür gilt die eigene Call-Zuordnung (weitere Schwäche), gegebenenfalls mit einer passenden eigenen Preisreferenz.');
   const required=/\b(?:notwendig\w*|zwingend\w*|unerlässlich\w*)\s+(?:Bedingung|Voraussetzung)|\b(?:Bedingung|Voraussetzung)[^.!?]{0,25}\bnotwendig\w*/iu.test(text);
   if(required&&/Call|Erholung|Gegenbewegung|Put/iu.test(text)&&conditions.some((c:any)=>c.role==='REFERENCE'&&refs.includes(c.id)))add('REFERENCE_AS_MANDATORY_ENTRY_REVIEW','Die zitierte MA-/Extremreferenz ist eine mögliche bedingte Stärkung/Schwächung, keine notwendige Voraussetzung jeder frühen Gegenidee oder eines Einstiegs. Ein konkreter bestätigter Musterbruch darf eigene notwendige Musterbedingungen haben.');
   if(/Trigger|Auslöse(?:preis|marke|schwelle)|Musterbedingung/iu.test(text)&&refs.some(id=>new RegExp('^'+prefix+'-PF[01]-(?:MECHANICS|COLUMN)$').test(id))){
    const numbers=[...text.matchAll(/\d+(?:[.,]\d+)?/g)].map(m=>Number(m[0].replace(',','.')));
    const matching=conditions.filter((c:any)=>c.role==='PATTERN_TRIGGER'&&numbers.some(n=>Math.abs(n-c.price)<0.011));
    const owners=[...new Set<string>(matching.map((c:any)=>c.id.replace(/-TRIGGER$/,'')))];
    if(owners.length&&!owners.some(id=>refs.includes(id))&&!matching.some((c:any)=>refs.includes(c.id)))add('PATTERN_TRIGGER_WITH_MECHANICS_REFERENCE',`Der genannte Preis passt zu einer eigenen Musterbedingung, aber MECHANICS/COLUMN belegt diesen konkreten Mustertrigger nicht. Passender Musterbeleg: ${owners.join(', ')}; zugehörige Bedingungen: ${matching.map((c:any)=>c.id).join(', ')}. Preisberührung bestätigt das Muster nicht automatisch.`);
   }
   const expected=/Put/iu.test(block.title)?'N-BIND-PUT':block.market==='NASDAQ'?'N-BIND-CALL':'R-BIND-CALL';
   if(/Gegenrisiko|Preisbedingung/iu.test(text)&&refs.some(id=>['N-BIND-PUT','N-BIND-CALL','R-BIND-CALL'].includes(id)&&id!==expected)&&!/anders\s+als|Gegensatz|Vergleich/iu.test(text))add('WRONG_INSTRUMENT_BINDING_REFERENCE',`Für diesen Abschnitt ist ${expected} die eigene Instrumentzuordnung. Ein anderes Instrument kann im ausdrücklich erläuterten Vergleich sinnvoll sein, ersetzt hier aber nicht die eigene Zuordnung.`);
  }
 }
 return findings;
}
