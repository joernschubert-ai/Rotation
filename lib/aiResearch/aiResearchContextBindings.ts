import type {AppFact} from './aiResearchAppFacts';
export interface BindingFinding {instrument:string;section:string;code:string;quote:string;explanation:string;withhold:boolean;}
const patternNames=(text:string)=>[...new Set([...text.replace(/_/g,' ').matchAll(/\bDouble[\s-]+(Top|Bottom)[\s-]+(Breakout|Breakdown)s?\b/gi)].map(m=>('DOUBLE_'+m[1]+'_'+m[2]).toUpperCase()))];
const hypothetical=(s:string)=>/\b(?:wenn|falls|wäre|würde|könnte)\b|[„“«»"]/i.test(s);
/** Bind only explicit claims. An ambiguous family/scale never acquires an invented state. */
export function auditContextBindings(instrument:string,section:string,text:string,facts:AppFact[],snapshot:string){
 const market=instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ',prefix=market==='NASDAQ'?'N':'R';
 const own=facts.filter(f=>f.market===market&&f.status!=='MISSING'&&f.asOf!==null&&Number.isFinite(Date.parse(f.asOf))&&Date.parse(f.asOf)<=Date.parse(snapshot));
 const patterns=own.filter(f=>f.domain==='P&F'&&/^[NR]-F-PF[01]-(?:LAST|FORM|ADV)$/.test(f.id)).map(f=>{
  const m=/(?:Bedingung|Trigger) jetzt (true|false|unbekannt)\b/.exec(f.text);
  return {fact:f,names:patternNames(f.text),forming:/FORMING\s*=/.test(f.text),condition:m?.[1]==='true'?true:m?.[1]==='false'?false:null};
 });
 const findings:BindingFinding[]=[],add=(code:string,quote:string,explanation:string,withhold=false)=>findings.push({instrument,section,code,quote,explanation,withhold});
 for(const sentence of text.split(/(?<=[.!?])\s+|\n/)){
  const refs=[...new Set(sentence.match(/(?:[NR]-F-)?PF[01]-(?:LAST|FORM|ADV)\b/g)??[])].map(id=>/^[NR]-F-/.test(id)?id:prefix+'-F-'+id);
  for(const id of refs)if(!patterns.some(p=>p.fact.id===id))add('PNF_REFERENCE_UNAVAILABLE',sentence,id+' ist kein verfügbarer eigener datierter P&F-Befund in diesem Faktenrahmen.',true);
  const names=patternNames(sentence),specific=names.length>0||/(?:P&F|Muster|Formation|Signal)[^.!?]{0,100}(?:bestätigt|historisch|aktiv|ausgelöst|FORMING|CONFIRMED)/i.test(sentence);
  const conditional=hypothetical(sentence);
  if(specific&&!refs.length&&!conditional)add('PNF_CLAIM_UNBOUND',sentence,'Konkrete P&F-Aussage ohne eigene Quellenkennung. Keine automatische Zuordnung zu Skala oder Auslösung; dies behauptet nicht, dass der Satz inhaltlich falsch ist.',true);
  const negatedName=/\bkein\w*\s+Double|Double[\s-]+(?:Top|Bottom)[\s-]+(?:Breakout|Breakdown)s?\s+(?:ist\s+)?nicht\s+(?:geliefert|vorhanden|bestätigt|ausgelöst)/i.test(sentence);
  if(!conditional&&!negatedName&&names.length===1)for(const name of names){
   if(patterns.length&&!patterns.some(p=>p.names.includes(name)))add('PNF_PATTERN_NOT_SUPPLIED',sentence,'Die Formation '+name+' ist im eigenen gelieferten P&F-Bestand nicht vorhanden.',true);
   if(refs.length===1&&!/Vergleich|verglichen|Gegensatz|anders als|gegenüber/i.test(sentence)){const p=patterns.find(p=>p.fact.id===refs[0]);if(p&&p.names.length&&!p.names.includes(name))add('PNF_NAME_REFERENCE_CONTRADICTION',sentence,p.fact.id+' nennt '+p.names.join(', ')+', nicht '+name+'.',true);}
  }
  const conditionClaim=/\b(?:Preisbedingung|Bedingung|Trigger)\b([^.!?;]{0,60}?)\berfüllt\b/i.exec(sentence);
  if(conditionClaim&&!conditional&&!/\b(?:damals|seinerzeit|unbekannt|unklar|ob)\b|bei (?:der )?Auslösung/i.test(sentence)){
   const claimed=!/\bnicht\b|keineswegs/i.test(conditionClaim[1]);
   let candidates=refs.length?patterns.filter(p=>refs.includes(p.fact.id)):names.length?patterns.filter(p=>p.names.some(n=>names.includes(n))):[];
   if(!refs.length&&/historisch|bestätigt/i.test(sentence))candidates=candidates.filter(p=>!p.forming);
   if(!refs.length&&/FORMING|entsteh/i.test(sentence))candidates=candidates.filter(p=>p.forming);
   const known=new Set(candidates.map(p=>p.condition));
   if(candidates.length&&known.size===1&&!known.has(null)&&!known.has(claimed))add('PNF_CONDITION_STATE_CONTRADICTION',sentence,candidates.map(p=>p.fact.id).join(', ')+': gelieferte Preisbedingung '+String(candidates[0].condition)+'. Historischer Auslösestatus und heutige Preisrelation sind getrennt.',true);
   else if(candidates.length&&known.size===1&&known.has(null))add('PNF_CONDITION_NOT_SUPPLIED',sentence,'Der eigene Befund liefert keinen bekannten aktuellen Erfüllungszustand. Diesen nicht ergänzen.',true);
   else if(candidates.length&&known.size>1)add('PNF_CONDITION_AMBIGUOUS',sentence,'Mehrere passende Skalen/Befunde haben verschiedene oder unbekannte Zustände; keine automatische einheitliche Preisbedingung ableiten.');
  }
  if(!hypothetical(sentence)&&/\b(?:Large|groß\w*)\s+(?:Overhang|Überhang)/i.test(sentence)&&/Asset|Leveraged|COT/i.test(text))add('COT_SIZE_WITHOUT_SCALE',sentence,'Die Größenwertung benötigt einen belegten Vergleichsmaßstab. Ein Netto-Long-Zustand allein belegt keinen großen Überhang.');
  const reset=/erneut|wieder|nach[^.!?]{0,45}(?:Rückeroberung|Rückkehr|Anstieg|Rückfall)/i.test(sentence);
  if(!reset&&/wäre|würde|könnte|falls|wenn|künftig|zukünftig|offene\s+(?:Bedingung|Marke)/i.test(sentence)){
   const down=/Unterschreiten|Bruch unter/i.test(sentence),up=/Überschreiten|Rückeroberung|Bruch über/i.test(sentence);
   if(down!==up){const periods=[...new Set([...sentence.matchAll(/\bMA\s*(200|20|50)(?!\d)(?:\s*\/\s*(?:MA\s*)?(200|20|50)(?!\d))?/gi)].flatMap(m=>[m[1],m[2]].filter(Boolean)))];
    for(const period of periods){const f=own.find(f=>f.id===prefix+'-F-MA'+period);if(f&&f.values.relation===(down?'BELOW':'ABOVE'))add('MA_RELATION_ALREADY_PRESENT',sentence,f.text+' Die genannte Relation besteht bereits. Fortsetzung und ein neuer Kreuzungsfall nach vorheriger Rückeroberung sind zu unterscheiden.');}
   }
  }
 }
 return findings;
}


