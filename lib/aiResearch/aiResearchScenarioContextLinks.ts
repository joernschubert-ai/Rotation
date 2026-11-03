import type {prepareScenarioInput} from './aiResearchScenarioInput';
export const CONTEXT_LINKS='SCENARIO_CONTEXT_LINKS_V2';
type Prepared=ReturnType<typeof prepareScenarioInput>;
type Base={id:string;factsHash:string;sourceSnapshot:string;scenarios:Array<Record<string,any>>};
const object=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const exact=(v:unknown,keys:string[])=>{const o=object(v);return Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));};
const value=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?String(v):'unbekannt';

export function buildContextLinkPolicy(p:Prepared,base:Base){
 const facts=p.p.context.facts.facts,byId=new Map(facts.map(f=>[f.id,f]));
 const catalog=base.scenarios.map(s=>{
  const chosen=new Set([...s.supports,...s.opposes,...s.contextSources]);
  const own=facts.filter(f=>f.market===s.market&&p.contextIds.includes(f.id));
  const priceIds=own.filter(f=>chosen.has(f.id)&&/^[NR]-F-(?:MA(?:20|50|200)|PF[01]-(?:LAST|FORM|ADV)|WINDOW-\d+|WEEK-\d+|AFTER-WEEK|CLOSE|PHASE|BREADTH|STRUCTURE)$/.test(f.id)).map(f=>f.id);
  const cotIds=own.filter(f=>f.domain==='COT').map(f=>f.id);
  const historyIds=own.filter(f=>f.domain==='Historische Vergleiche'&&f.values.currentMatch===true).map(f=>f.id);
  const riskIds=facts.filter(f=>p.contextIds.includes(f.id)&&f.market==='SHARED'&&!['COT','Historische Vergleiche'].includes(f.domain)).map(f=>f.id);
  return {market:s.market,baseDirection:s.direction,priceIds,cotIds,historyIds,riskIds,contextIds:[...cotIds,...historyIds,...riskIds]};
 });
 const appStatements=catalog.map(c=>{
  const card=(id:string)=>{const f=byId.get(id)!;return {sourceId:id,market:f.market,asOf:f.asOf,text:f.text,origin:'APP_FACTS_NOT_MODEL'};};
  const history=c.historyIds.map(id=>{
   const h=p.p.briefs.history.find(h=>h.id===id)!,s=h.statistics;
   const relation=h.indexMeanVsBaseline==='BELOW'?'unter der Basis':h.indexMeanVsBaseline==='ABOVE'?'über der Basis':h.indexMeanVsBaseline==='EQUAL'?'gleich der Basis':'Basisvergleich unbekannt';
   const sign=h.absoluteIndexMean==='POSITIVE'?'positiv':h.absoluteIndexMean==='NEGATIVE'?'negativ':h.absoluteIndexMean==='ZERO'?'null':'unbekannt';
   return {...card(id),text:'Historische folgende 20 Sitzungsintervalle: absolutes Indexmittel '+value(s.meanPct)+' % ('+sign+'); Basis '+value(s.baselineMeanPct)+' %; damit '+relation+'. Gelieferter Mehrertrag '+value(s.excessMeanPp)+' Prozentpunkte. p10/p90 '+value(s.p10Pct)+' / '+value(s.p90Pct)+' %; Fälle '+value(s.sampleSize)+', nichtüberlappende Fälle '+value(s.nonOverlappingCount)+'. Kein belegter Prognosevorteil oder Optionsgewinn.',absoluteMean:h.absoluteIndexMean,vsBaseline:h.indexMeanVsBaseline,statistics:s};
  });
  return {market:c.market,baseDirection:c.baseDirection,cot:c.cotIds.map(card),history,sharedRiskAndNews:c.riskIds.map(card),groupComparison:p.p.appReadings.markets.find(m=>m.market===c.market)?.cot??null,origin:'APP_FIXED_FACTS_NOT_MODEL',limits:'Originale Datenstände. Bestände, Änderungen, absolute Mittel und Basisvergleich sind getrennt. Keine unabhängigen Stimmen oder Erfolgsaussage.'};
 });
 function relation(c:typeof catalog[number],id:string){
  if(c.cotIds.includes(id))return {kind:'POSITIONING_CONTEXT',text:'Positionierungsbefund neben der Preisreferenz. Bestände und Änderungen getrennt lesen; daraus folgt keine automatische Preisrichtung oder unabhängige Bestätigung.'};
  if(c.historyIds.includes(id)){
   const h=p.p.briefs.history.find(h=>h.id===id)!;
   const meanUp=h.absoluteIndexMean==='POSITIVE',meanDown=h.absoluteIndexMean==='NEGATIVE';
   const counter=(c.baseDirection==='DOWN'&&meanUp)||(c.baseDirection==='UP'&&meanDown);
   const directionKnown=['UP','DOWN'].includes(c.baseDirection)&&(meanUp||meanDown);
   return {kind:!directionKnown?'HISTORY_WITHOUT_CLEAR_DIRECTION':counter?'HISTORICAL_COUNTERCONTEXT':'HISTORICAL_CONTEXT',text:!directionKnown?'Historischer Vergleich ohne eindeutige direkte Richtungszuordnung.':counter?'Das historische absolute Indexmittel ist ein möglicher Gegenkontext zur gespeicherten Richtung. Kein heutiger Impuls, Umkehrzwang oder nachgewiesener Prognosevorteil.':'Das historische absolute Indexmittel ist ein möglicher Kontext für die gespeicherte Richtung. Basisvergleich und Streuung bleiben separat; keine heutige Bestätigung oder belegte Erfolgswahrscheinlichkeit.'};
  }
  return {kind:'SHARED_RISK_CONTEXT',text:'Gemeinsamer Risiko- oder Nachrichtenkontext neben der eigenen Preisreferenz. Nur gelieferte Belegtiefe verwenden; keine kausale Preiswirkung oder Einstiegserlaubnis daraus ableiten.'};
 }
 return {catalog,appStatements,byId,relation,base};
}
export type ContextLinkPolicy=ReturnType<typeof buildContextLinkPolicy>;
export function validateContextLinks(p:ContextLinkPolicy,raw:unknown){
 const r=object(raw),issues:Array<{market:string;code:string;sourceId?:string}>=[];
 const add=(market:string,code:string,sourceId?:string)=>issues.push({market,code,...(sourceId?{sourceId}:{})});
 if(!exact(r,['version','baseEpisodeId','factsHash','markets'])||r.version!==CONTEXT_LINKS||r.baseEpisodeId!==p.base.id||r.factsHash!==p.base.factsHash||!Array.isArray(r.markets)||r.markets.length!==2)add('ALL','LINK_FRAME_OR_SCHEMA');
 const seen=new Set<string>(),view:Array<Record<string,any>>=[];
 for(const item of Array.isArray(r.markets)?r.markets:[]){const row=object(item),own=p.catalog.find(c=>c.market===row.market);
  if(!own||seen.has(row.market)||!exact(row,['market','coreLinks','riskLinks','unresolved'])){add(String(row.market),'LINK_OWN_UNIQUE_FIELDS');continue;}seen.add(row.market);
  if(typeof row.unresolved!=='boolean'||!Array.isArray(row.coreLinks)||!Array.isArray(row.riskLinks)||row.coreLinks.length>3||row.riskLinks.length>3){add(row.market,'LINK_LIST');continue;}
  const pairs=new Set<string>(),links:Array<Record<string,any>>=[];
  for(const tagged of [...row.coreLinks.map((link:unknown)=>({link,group:'CORE'})),...row.riskLinks.map((link:unknown)=>({link,group:'RISK'}))]){const link=object(tagged.link);
   if(!exact(link,['priceId','contextId'])||typeof link.priceId!=='string'||typeof link.contextId!=='string'){add(row.market,'LINK_EXACT_IDS');continue;}
   if(!own.priceIds.includes(link.priceId)){add(row.market,'LINK_PRICE_SCOPE',link.priceId);continue;}
   if(!(tagged.group==='CORE'?[...own.cotIds,...own.historyIds]:own.riskIds).includes(link.contextId)){add(row.market,'LINK_CONTEXT_SCOPE',link.contextId);continue;}
   const key=link.priceId+'|'+link.contextId;if(pairs.has(key)){add(row.market,'DUPLICATE_LINK');continue;}pairs.add(key);
   links.push({group:tagged.group,modelOrder:links.length+1,price:p.byId.get(link.priceId),context:p.byId.get(link.contextId),contextDisplayText:p.appStatements.find(m=>m.market===row.market)?.history.find(h=>h.sourceId===link.contextId)?.text??p.byId.get(link.contextId)!.text,appRelation:p.relation(own,link.contextId),relationOrigin:'APP_DESCRIPTIVE_RULE_NOT_MODEL_PROSE',independentVotes:false});
  }
  if(!row.unresolved&&own.priceIds.length&&own.contextIds.length&&!links.length)add(row.market,'LINK_OR_UNRESOLVED_REQUIRED');
  if(!row.unresolved&&(own.cotIds.length||own.historyIds.length)&&!links.some(l=>own.cotIds.includes(l.context.id)||own.historyIds.includes(l.context.id)))add(row.market,'COT_OR_HISTORY_LINK_REQUIRED');
  view.push({market:row.market,baseDirection:own.baseDirection,unresolved:row.unresolved,links,priorityQuality:'NOT_VERIFIED',modelMeaning:'Das Modell hat diese Querverweise gewählt und geordnet. Die Fakten und beschreibenden Beziehungstexte stammen aus der App; ihre Relevanzordnung ist ungeprüft.'});
 }
 return {ok:issues.length===0,issues,original:raw,view:issues.length?null:view,appStatements:p.appStatements,sourceBinding:'CLOSED_PAIRS_FROM_APP_CATALOG',modelProseAccepted:false,semanticTruthVerified:false,predictiveQualityVerified:false,scope:'Geschlossene eigene Quellenpaare und eindeutige Reihenfolge. Keine freie Faktennacherzählung. Unresolved ist zulässig. Auswahl/Ordnung sind keine geprüfte Gewichtung oder Prognose; App-Relationen sind beschreibend und keine unabhängigen Stimmen.'};
}

