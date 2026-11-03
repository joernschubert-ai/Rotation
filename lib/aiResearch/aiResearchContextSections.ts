import {auditCotNetClaims} from './aiResearchCotNetAudit';
import {auditSelectionMeaning} from './aiResearchSelectionMeaning';
import {auditContextBindings} from './aiResearchContextBindings';
import {domainLanguageFindings} from './aiResearchDomainFocus';
import {auditDomainBoundaries} from './aiResearchDomainBoundaries';
import type {AppFact} from './aiResearchAppFacts';
import type {buildDomainBriefs} from './aiResearchDomainBriefs';
export const CONTEXT_SECTIONS=[
 {key:'pricePnf',label:'Preis, P&F und Marktstruktur',max:260},
 {key:'cot',label:'COT: Bestände, Änderungen und Konflikte',max:300},
 {key:'history',label:'Historischer Vergleich und Unsicherheit',max:260},
 {key:'synthesis',label:'Gesamtgewichtung und bedingte frühe Idee',max:300},
] as const;
export interface ContextSectionFinding {instrument:string;section:string;code:string;quote:string;explanation:string;withhold:boolean;}
/** Narrow explicit-reference diagnostics. Never repairs prose or proves unflagged text correct. */
export function auditContextSection(instrument:string,section:string,text:string,facts:AppFact[],briefs:ReturnType<typeof buildDomainBriefs>){
 const market=instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ',prefix=market==='NASDAQ'?'N':'R';
 const findings:ContextSectionFinding[]=[],add=(code:string,quote:string,explanation:string,withhold=false)=>findings.push({instrument,section,code,quote,explanation,withhold});
 const wrapped=JSON.stringify({instruments:[{instrument,arguments:[],hypothesis:text}]}),meaning=auditSelectionMeaning(wrapped,facts);
 for(const f of meaning.findings){
  if(f.code==='COT_GROUP_WITHOUT_SELECTED_SOURCE'&&briefs.cot.some(c=>c.market===market&&f.explanation.includes(c.id)))continue;
  add(f.code,f.quote,f.explanation,f.code==='MA_RELATION_CONTRADICTION');
 }
 for(const f of [...domainLanguageFindings(wrapped),...auditDomainBoundaries(wrapped,briefs)]){
  if(f.code==='HISTORY_LIMITS_NOT_EXPLICIT'&&section!=='history')continue;
  add(f.code,f.quote??text,f.message);
 }
 const ownCot=briefs.cot.filter(c=>c.market===market),comparison=briefs.groupComparisons.find(g=>g.market===market);
 if(section==='cot'){
  if(comparison?.sameObservationDate&&comparison.netStatesDiffer&&/(?:Gruppen|Bestände)[^.!?]{0,70}(?:strukturell\w*\s+Konflikt|gegeneinander)/i.test(text))add('COT_STATES_NOT_SHIFT_CONFLICT',text,'Unterschiedliche Nettobestände sind getrennt von den berechneten Gruppenänderungen je Zeitfenster zu lesen.');
  if(/kurzfristig\w*[^.!?]{0,75}(?:gegensätzlich|gegenläufig)|(?:gegensätzlich|gegenläufig)[^.!?]{0,75}kurzfristig/i.test(text)&&!/(?:1|4|13|26)\s*(?:W\b|Wochen?)/i.test(text))add('COT_CONFLICT_WINDOW_UNSPECIFIED',text,'Ein Konflikt benötigt ein konkretes Fenster. Gleichgerichtete 1W- und gegenläufige 4W-Änderungen können gleichzeitig vorliegen.');
 }
 if(section==='history'&&briefs.history.some(h=>h.market===market&&h.currentMatch)&&(!/(?:Mittel|Folgerendite|Durchschnitt|absolut)/i.test(text)||!/(?:Basis|Vergleichsrendite|Mehrertrag|relativ)/i.test(text)))add('HISTORY_COMPARISON_NOT_EXPLICIT',text,'Passende Studien sind vorhanden, aber absolutes Folgerendite-Mittel und Basisvergleich werden hier nicht beide ausdrücklich eingeordnet. Keine Behauptung über verborgenes Modellverständnis.');
 if(section==='history'&&/Impuls/i.test(text)&&!/\b(?:kein\w*|nicht|ohne)\b/i.test(text))add('HISTORY_NOT_CURRENT_IMPULSE',text,'Historische Folgerenditen sind kein nachgewiesener heutiger Marktimpuls. Diese Formulierung benötigt Prüfung.');
 for(const finding of auditCotNetClaims(text,ownCot))add(finding.code,finding.quote,finding.explanation,finding.withhold);
 for(const sentence of text.split(/(?<=[.!?;])\s+|\n/)){
  if(/\b(?:wenn|falls|würde|könnte|nicht|kein\w*|ohne)\b|[„“«»"]/i.test(sentence))continue;
  const windows=[...new Set([...sentence.matchAll(/\b(1|4|13|26)\s*(?:W\b|Wochen?)/gi)].map(m=>Number(m[1])))],conflict=/(?:Gruppen|Leveraged[^.!?]{0,80}Asset|Asset[^.!?]{0,80}Leveraged)[^.!?]{0,100}(?:gegensätzlich|gegenläufig)/i.test(sentence);
  if(windows.length===1&&conflict){const shift=comparison?.shifts.find(s=>s.weeks===windows[0]);if(shift&&/^ALIGNED_/.test(shift.relation))add('COT_GROUP_SHIFT_CONTRADICTION',sentence,'Die eigenen Gruppenänderungen über '+windows[0]+' Wochen sind '+shift.relation+'.',true);}
 }
 for(const sentence of text.split(/(?<=[.!?;])\s+|\n/)){
  const refs=[...new Set(sentence.match(/(?:[NR]-F-)?PF[01]-(?:LAST|FORM|ADV)\b/g)??[])];
  const resolved=refs.map(id=>id.startsWith('N-')||id.startsWith('R-')?id:prefix+'-F-'+id);
  for(const id of resolved){const f=facts.find(f=>f.id===id);if(!f||f.market!==market)add('PNF_REFERENCE_NOT_OWN',sentence,'Die ausdrückliche P&F-Kennung '+id+' ist kein vorhandener eigener Marktbeleg.',true);}
  // Multiple references/directions, quotations, negation and hypotheses need human reading.
  if(resolved.length!==1||/\b(?:wenn|falls|würde|könnte|nicht|kein\w*|ohne|weder)\b|[„“«»"]/i.test(sentence))continue;
  const f=facts.find(f=>f.id===resolved[0]&&f.market===market&&f.domain==='P&F');
  if(!f||f.status==='MISSING')continue;
  const supplied=/(?:,\s*(bullisch|bearisch|bärisch)\s*,|Richtung\s+(BULLISH|BEARISH))/i.exec(f.text);
  const expected=supplied?(/bull/i.test(supplied[1]??supplied[2])?'BULLISH':'BEARISH'):null;
  const directions=[...new Set((sentence.match(/\b(?:bullisch\w*|bearisch\w*|bärisch\w*)\b/gi)??[]).map(w=>/^bull/i.test(w)?'BULLISH':'BEARISH'))];
  if(expected&&directions.length===1&&directions[0]!==expected)add('PNF_DIRECTION_CONTRADICTION',sentence,f.id+': '+f.text,true);
  if(/FORMING\s*=/.test(f.text)&&/\b(?:bestätigt\w*|ausgelöst\w*|CONFIRMED)\b/i.test(sentence))add('PNF_FORMING_AS_TRIGGERED',sentence,f.id+' ist FORMING, keine ausgelöste Formation.',true);
  if(/HISTORISCH|Alter \d+ Kalendertage/.test(f.text)&&/(?:heute|jetzt|frisch\w*|neu\w*)\s+(?:bestätigt|ausgelöst)|(?:frisch\w*|heutig\w*|neu\w*)\s+(?:Ausbruch|Auslösung|Signal)/i.test(sentence))add('PNF_HISTORICAL_AS_FRESH',sentence,f.id+' ist eine datierte frühere Auslösung; kein aktueller Ausbruch nachgewiesen.',true);
 }
 return [...findings,...auditContextBindings(instrument,section,text,facts,briefs.snapshotTimestamp)];
}

