import { auditCOTConflicts } from './aiResearchCOTConflictAudit';
import { cotGroupCard, cotNumber } from './aiResearchCOTSemantics';
export interface COTNarrativeFinding {code:string;market?:string;quote?:string;correction:string;}
export interface COTNarrativeBlock {market:string;body:string;}
const groupName=(g:string)=>g==='LEVERAGED_MONEY'?'Leveraged Money':'Asset Manager';
const groupPattern=(g:string)=>g==='LEVERAGED_MONEY'?/Leveraged[ _-]*(?:Money|Funds)|gehebelte[nr]?\s+(?:Fonds|Marktteilnehmer)/i:/Asset[ _-]*Managers?|institutionelle[nr]?\s+(?:Anleger|Vermögensverwalter)/i;
const weekly=/(?:1\s*[- ]?W(?:oche[n]?)?\b|eine[rn]?\s+Woche|letzte[nr]?\s+Woche|wöchentlich\w*|Wochenänderung)/i;
const longer=/(?:4|13|26)(?:\s*[/–-]\s*(?:4|13|26))*\s*[-–]?\s*(?:W\b|Wochen)|Vierwochen|Dreizehnwochen/i;
/** Coverage is lexical; contradictions require an explicit own-group, single-week claim.
 * Never changes prose, blocks entry, assigns a score or retries the provider.
 */
export function auditCOTNarrative(blocks:COTNarrativeBlock[],indices:Record<string,any>):COTNarrativeFinding[]{
 const findings:COTNarrativeFinding[]=[];
 for(const market of ['NASDAQ','RUSSELL_2000']){
  const groups=(indices[market]?.cotFacts?.groups??[]).filter((g:any)=>['LEVERAGED_MONEY','ASSET_MANAGER'].includes(g?.group)&&cotNumber(g.netPosition)!==null);
  if(!groups.length)continue;
  const body=blocks.filter(b=>b.market===market).map(b=>b.body).join('\n');
  if(!body.trim()){findings.push({code:'COT_SECTION_NOT_IDENTIFIED',market,correction:'Eigener Marktabschnitt für die COT-Prüfung nicht erkannt. COT-Abdeckung und Aussagen bleiben ungeprüft.'});continue;}
  findings.push(...auditCOTConflicts(body,groups,market));
  for(const g of groups){
   const card=cotGroupCard(g),pattern=groupPattern(g.group),other=groupPattern(g.group==='LEVERAGED_MONEY'?'ASSET_MANAGER':'LEVERAGED_MONEY');
   const sentences=body.split(/(?<=[.!?])\s+|\n/).filter(s=>pattern.test(s));
   if(!sentences.length){findings.push({code:'COT_GROUP_NOT_IDENTIFIED',market,correction:`${groupName(g.group)} im eigenen Markttext nicht erkannt: COT nicht vollständig ausgewertet. ${card.promptText}`});continue;}
   const own=sentences.join(' ');
   if(!/netto[ -]*(?:long|short)|Netto[ -]*(?:Long|Short)(?:position|überhang|bestand)/i.test(own))findings.push({code:'COT_NET_STATE_NOT_IDENTIFIED',market,correction:`Nettozustand für ${groupName(g.group)} nicht ausdrücklich erkannt: ${card.state} (${card.net} Kontrakte). Erwähnung der Gruppe allein prüft keine inhaltliche Richtigkeit.`});
   if(card.changes[0].delta!==null&&!weekly.test(own))findings.push({code:'COT_WEEK_NOT_IDENTIFIED',market,correction:`Eigene Wochenänderung für ${groupName(g.group)} nicht eindeutig erkannt: ${card.changes[0].delta}, ${card.changes[0].meaning}.`});
   if(card.conflicts.length&&!(/Konflikt|gegenläufig|entgegengesetzt|widerspr|kurzfristig[\s\S]{0,160}(?:länger|langfristig)/i.test(own)&&longer.test(own)))findings.push({code:'COT_HORIZON_CONFLICT_NOT_IDENTIFIED',market,correction:`Horizontkonflikt für ${groupName(g.group)} nicht eindeutig erkannt: 1 Woche gegen ${card.conflicts.join('/')} Wochen. ${card.promptText}`});
   for(const sentence of sentences){
    // Mixed groups/horizons, negation and hypotheses are intentionally not classified.
    if(other.test(sentence)||/\b(?:nicht|kein\w*|könnte|würde|falls|wenn|möglich)\b/i.test(sentence))continue;
    const hasLong=/\bnetto[ -]*long\b/i.test(sentence),hasShort=/\bnetto[ -]*short\b/i.test(sentence);
    if(!/Wechsel|zuvor|vorher|von\s+netto|zu\s+netto|Richtung/i.test(sentence)&&hasLong!==hasShort&&((hasLong&&card.net!<0)||(hasShort&&card.net!>0)))findings.push({code:'COT_NET_STATE_CONTRADICTION',market,quote:sentence.trim(),correction:`Gelieferter aktueller Zustand für ${groupName(g.group)}: ${card.net} Kontrakte, ${card.state}.`});
    if(!weekly.test(sentence)||longer.test(sentence))continue;
    const change=card.changes[0];
    if(change.pattern==='SIGN_CROSSING'||change.pattern==='NEUTRAL_TRANSITION'||change.delta===null||card.net===null)continue;
    const short=/Short[ -]?(?:überhang|position(?:en)?|bestand)/i.test(sentence),long=/Long[ -]?(?:überhang|position(?:en)?|bestand)/i.test(sentence);
    if(short===long||!/(?:Netto|Überhang)/i.test(sentence))continue;
    const smaller=/verringer\w*|reduzier\w*|Abbau|Abnahme|kleiner|weniger|abnehm\w*/i.test(sentence);
    const larger=/vergrößer\w*|ausbau\w*|Ausweitung|Zunahme|größer|mehr|zunehm\w*/i.test(sentence);
    if(smaller===larger||(short&&card.net>=0)||(long&&card.net<=0))continue;
    const expectedSmaller=short?change.delta>0:change.delta<0;
    if(change.delta===0||smaller!==expectedSmaller)findings.push({code:'COT_WEEK_OVERHANG_CONTRADICTION',market,quote:sentence.trim(),correction:`${groupName(g.group)}: 1 Woche ${change.delta} Kontrakte; ${change.meaning}, weiterhin ${card.state}. Bestandsänderung, kein Transaktionsnachweis.`});
   }
  }
 }
 return findings;
}
/** Same limited checks for manual synthetic evaluations, with their own frozen facts. */
export function auditCOTEvaluation(text:string,data:{indices:Record<string,any>}){
 const headings=[...text.matchAll(/^\s*(?:#{1,6}\s*)?(?:\*\*)?(Nasdaq(?:-100)?(?: Put| Call)?|Russell(?: 2000)?(?: Call)?)[^\n]*$/gim)];
 const blocks=headings.map((h,i)=>({market:/Russell/i.test(h[1])?'RUSSELL_2000':'NASDAQ',body:text.slice(h.index!+h[0].length,headings[i+1]?.index??text.length)}));
 const findings=auditCOTNarrative(blocks,data.indices).filter(f=>!['COT_GROUP_NOT_IDENTIFIED','COT_NET_STATE_NOT_IDENTIFIED','COT_WEEK_NOT_IDENTIFIED','COT_HORIZON_CONFLICT_NOT_IDENTIFIED','COT_SECTION_NOT_IDENTIFIED'].includes(f.code));
 return {version:'COT_TEXT_CHECK_V64',status:findings.length?'ISSUES_FOUND':'NO_COVERED_ISSUES_FOUND',scope:'Begrenzte Prüfung ausdrücklicher COT-Aussagen; keine Abschreibpflicht für vollständige Fachkarten. Keine vollständige Semantikprüfung; kein Befund ist keine Freigabe.',findings};
}
