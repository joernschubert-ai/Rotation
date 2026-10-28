import { researchEvidenceReferences } from './aiResearchEvidenceReferences';
import type { SemanticFinding } from './aiResearchSemanticBindingAudit';
const object=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
function sourceRows(text:string|undefined){
 const out=new Map<string,unknown>();if(typeof text!=='string')return out;
 for(const match of text.matchAll(/^\[([^\]\n]+)\] (.+)$/gm))try{out.set(match[1],JSON.parse(match[2]));}catch{/* malformed source row is not proof */}
 return out;
}
/** Explicit own citations and narrow wordings only. REVIEW is not a forecast rejection. */
export function auditPeriodCitations(blocks:Array<{market:string;title:string;body:string}>,indices:Record<string,any>,inputText?:string):SemanticFinding[]{
 const findings:SemanticFinding[]=[],sources=sourceRows(inputText);
 for(const block of blocks){
  const prefix=block.market==='NASDAQ'?'N-F':'R-F',chart=indices[block.market]?.completedChart;
  for(const sentence of block.body.split(/(?<=[.!?])\s+|\n/)){
   const text=sentence.trim(),refs=researchEvidenceReferences(text);if(!text)continue;
   const negated=/\b(?:nicht|kein\w*|unbelegt|unbekannt)\b/iu.test(text);
   const add=(code:string,correction:string)=>findings.push({code,market:block.market,quote:text,severity:'REVIEW',correction:'Prüfhinweis: '+correction});
   const unitClaim=(count:number)=>{const m=new RegExp('\\b'+count+'\\s*[- ]?Wochen[- ]?(?:Dynamik|Rendite|Rotation|Verlauf|Fenster)\\b','iu').exec(text);return !!m&&!/(?:nicht|kein\w*)\s*$/iu.test(text.slice(0,m.index))&&!/für\s+die\s+(?:nächsten|kommenden)|in\s+den\s+(?:nächsten|kommenden)/iu.test(text);};
   {
    for(const ref of refs){
     const window=new RegExp('^'+prefix+'-WINDOW-(\\d+)$').exec(ref);
     if(window){
      const count=Number(window[1]),source=chart?.priceTrajectory?.windows?.find((w:any)=>w.sessions===count&&w.toDate===chart.asOfDate);
      if(source&&unitClaim(count))add('OBSERVED_INTERVALS_AS_WEEKS_REVIEW',`${ref} beschreibt ${count} beobachtete Sitzungsintervalle (${source.fromDate??'?'} bis ${source.toDate??'?'}), nicht ${count} Kalenderwochen. Keine feste Umrechnung wegen Feiertagen oder Datenlücken.`);
     }
     const h= new RegExp('^'+prefix+'-H(\\d+)$').exec(ref);
     if(h&&unitClaim(20)){
      const history=indices[block.market]?.historicalStudies?.[Number(h[1])];
      if(history?.family==='ROTATION_20D')add('ROTATION_INTERVALS_AS_WEEKS_REVIEW',`${ref}: ROTATION_20D nutzt 20 Sitzungsintervalle zur Zustandsauswahl; die gelieferte Folgestudie betrifft anschließend 20 Sitzungsintervalle. Beides sind keine 20 Wochen und keine aktuelle Wochenrendite.`);
     }
    }
   }
   const summary=sources.get(prefix+'-CASE-SUMMARY');
   if(refs.includes(prefix+'-CASE-SUMMARY')&&typeof summary==='string'&&/12 Gemischter Markt:\s*gestützt(?:[;.]|$)/u.test(summary)&&/Gemischt\w*\s+Markt(?:es)?/iu.test(text)&&/(?:bleibt|ist|gilt)[^.!?]{0,25}(?:ungestützt|nicht\s+gestützt)/iu.test(text)&&!/Handelsidee|Einstieg|Freigabe|trotz[^.!?]{0,30}gestützt|Abgleich[^.!?]{0,30}gestützt/iu.test(text))add('SUPPORTED_CASE_DISMISSED_REVIEW','Der zitierte aktuelle App-Abgleich markiert Fall 12 „Gemischter Markt“ als gestützt. Das ist keine historische Erfolgsquote oder Handelsfreigabe. Eine skeptische Gesamteinschätzung bleibt möglich; den gelieferten Abgleich davon getrennt wiedergeben.');
   if(!negated&&!/möglich|hypothetisch|potenziell|\bfalls\b|\bwenn\b/iu.test(text)&&/MA\s*200[- ]?Support|Support[^.!?]{0,15}MA\s*200/iu.test(text)&&refs.some(id=>id.startsWith(prefix+'-MA200'))&&!refs.some(id=>/PATH|REACTION|SUPPORT_TEST/.test(id)))add('MA200_SUPPORT_NOT_ESTABLISHED_REVIEW','Die MA200-Zahlenrelation belegt keinen bewährten Support und keine Ursache einer Erholung. Ein erfundener ABOVE-Beleg ersetzt keinen datierten Reaktionsverlauf. Eine ausdrücklich hypothetische Support-Idee bleibt zu prüfen.');
  }
 }
 return findings;
}
