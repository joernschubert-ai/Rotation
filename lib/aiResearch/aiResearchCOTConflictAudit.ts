import { researchEvidenceReferences } from './aiResearchEvidenceReferences';
import { cotGroupCard } from './aiResearchCOTSemantics';
/** Explicit within-group horizon conflicts, not inferred market direction. */
export function auditCOTConflicts(body:string,groups:any[],market:string){
 const findings:Array<{code:string;market:string;quote:string;correction:string}>=[];
 for(const sentence of body.split(/(?<=[.!?])\s+|\n/)){
  if(!/Konflikt|gegenläufig|entgegengesetzt|widerspr/i.test(sentence)||/\b(?:kein\w*|nicht|falls|wenn|könnte|würde)\b/i.test(sentence))continue;
  const conflictClause=sentence.split(/;\s*gleichgerichtet|,\s*aber\s+gleichgerichtet/i)[0];
  const weeks=[...conflictClause.matchAll(/(\d+(?:\s*\/\s*\d+)*)\s*[- ]?W(?:ochen?)?\b/gi)].flatMap(m=>m[1].split('/').map(Number));
  if(!weeks.includes(1))continue;
  const longer=[...new Set(weeks.filter(w=>[4,13,26].includes(w)))];if(!longer.length)continue;
  const named=groups.filter(g=>g.group==='LEVERAGED_MONEY'?/Leveraged[ _-]*(?:Money|Funds)/i.test(sentence):g.group==='ASSET_MANAGER'?/Asset[ _-]*Managers?/i.test(sentence):false);
  const targets=named.length?named:/beide[nr]?\s+Gruppen/i.test(sentence)?groups:[];
  for(const g of targets){
   const card=cotGroupCard(g),week=card.changes[0].delta;
   if(week===null||week===0)continue;
   const aligned=longer.filter(w=>{const d=card.changes.find(c=>c.weeks===w)?.delta;return d!==null&&d!==undefined&&d!==0&&Math.sign(d)===Math.sign(week);});
   if(aligned.length)findings.push({code:'COT_HORIZON_CONFLICT_CONTRADICTION',market,quote:sentence.trim(),correction:`${g.group}: 1W und ${aligned.map(w=>w+'W').join('/')} sind gleichgerichtet, kein Richtungskonflikt dieser Horizonte. Tatsächlicher belegter Konflikt: ${card.conflicts.length?'1W gegen '+card.conflicts.map(w=>w+'W').join('/'):'keiner'}. Gruppenvergleich und Horizontvergleich sind getrennt; daraus keine automatische Kursrichtung ableiten.`});
  }
  if(targets.length&&researchEvidenceReferences(sentence).some(id=>/^[NR]-F-COT-GROUP-\d+$/.test(id)))findings.push({code:'COT_CONFLICT_REFERENCE_TYPE_MISMATCH',market,quote:sentence.trim(),correction:'COT-GROUP-Belege beschreiben den Vergleich Asset Manager gegen Leveraged Money auf einem Zeitraum. Für Konflikte zwischen Horizonten innerhalb einer Gruppe deren eigenen COT0-/COT1-Beleg verwenden.'});
 }
 return findings;
}
