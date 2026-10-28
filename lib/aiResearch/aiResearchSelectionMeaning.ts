import type {AppFact} from './aiResearchAppFacts';
/** Only the direct context of the supplied price relation, never an entry rule or forecast. */
export function directRelationEffect(fact:AppFact,instrument:string):'STRENGTHENS'|'WEAKENS'|null{
 if(!/^[NR]-F-MA(?:20|50|200)$/.test(fact.id))return null;
 const relation=fact.values.relation;
 if(relation!=='ABOVE'&&relation!=='BELOW')return null;
 return (relation==='ABOVE')===(instrument!=='NASDAQ_PUT')?'STRENGTHENS':'WEAKENS';
}
export interface MeaningIssue {instrument:string;code:string;quote:string;explanation:string;}
/** Narrow diagnostics. No repair, no proof of truth when nothing is detected. */
export function auditSelectionMeaning(raw:unknown,facts:AppFact[]){
 const findings:MeaningIssue[]=[];
 let root:any;try{root=typeof raw==='string'?JSON.parse(raw):null;}catch{return {version:'SELECTION_MEANING_V7',findings,scope:'Keine prüfbare JSON-Antwort.',semanticTruthVerified:false};}
 for(const row of Array.isArray(root?.instruments)?root.instruments:[]){
  if(!['NASDAQ_PUT','NASDAQ_CALL','RUSSELL_CALL'].includes(row?.instrument)||typeof row.hypothesis!=='string')continue;
  const market=row.instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ';
  const own=facts.filter(f=>f.market===market);
  const selected=Array.isArray(row.arguments)?row.arguments.filter((a:any)=>a&&typeof a.sourceId==='string').map((a:any)=>a.sourceId):[...(Array.isArray(row.supports)?row.supports:[]),...(Array.isArray(row.opposes)?row.opposes:[])];
  const add=(code:string,quote:string,explanation:string)=>findings.push({instrument:row.instrument,code,quote,explanation});
  for(const group of [{name:'LEVERAGED_MONEY',pattern:/Leveraged[ -]?Money/i},{name:'ASSET_MANAGER',pattern:/Asset[ -]?Manager/i}]){const source=own.find(f=>f.domain==='COT'&&f.values.group===group.name);if(source&&group.pattern.test(row.hypothesis)&&!selected.includes(source.id))add('COT_GROUP_WITHOUT_SELECTED_SOURCE',row.hypothesis,'Die genannte COT-Gruppe stammt aus '+source.id+', ist aber nicht als eigener Beleg mit Teilbefunden gebunden. Das belegt keine falsche Nettozahl, sondern eine fehlende Quellenbindung.');}
  for(const sentence of row.hypothesis.split(/(?<=[.!?])\s+|\n/)){
   // Hypothetical, negated and quoted propositions are deliberately left to manual review.
   if(/\b(?:wenn|falls|würde|könnte|sollte|nicht|kein\w*)\b|[„“«»"]/.test(sentence))continue;
   const inverse=/\b(MA\s*\d+(?:(?:\s*\/\s*|\s*(?:und|sowie|,)\s*)(?:MA\s*)?\d+)*)\s+(?:liegen|liegt|stehen|steht)\s+(über|unter)\s+(?:dem\s+)?(?:aktuellen\s+)?(?:Kurs|Kursniveau|Niveau)/i.exec(sentence);
   const direct=/\b(?:Kurs|Index|Schlusskurs)\s+(?:liegt|steht|notiert)\s+(über|unter)\s+(?:der\s+|den\s+)?(MA\s*\d+(?:(?:\s*\/\s*|\s*(?:und|sowie|,)\s*)(?:MA\s*)?\d+)*)/i.exec(sentence);
   const list=inverse?.[1]??direct?.[2],word=inverse?.[2]??direct?.[1];
   if(list&&word){
    const claimed=(word.toLowerCase()==='über')!==!!inverse?'ABOVE':'BELOW';
    for(const period of list.match(/\d+/g)??[]){
     const fact=own.find(f=>f.id===`${market==='NASDAQ'?'N':'R'}-F-MA${period}`);
     if(fact&&['ABOVE','BELOW'].includes(String(fact.values.relation))&&fact.values.relation!==claimed)
      add('MA_RELATION_CONTRADICTION',sentence,fact.text);
    }
   }
   if(/Phase\s*2|PHASE_2_WARNING/i.test(sentence)&&/(?:deutet|belegt|zeigt|bedeutet)[^.!?]{0,60}(?:erhöhte|hohe|steigende)\s+Volatilität/i.test(sentence))
    add('PHASE_IS_NOT_VOLATILITY',sentence,'Die gelieferte Phase allein belegt kein Volatilitätsniveau oder dessen Veränderung.');
   if(/(?:negativ\w*|positiv\w*|fallend\w*|steigend\w*)\s+(?:Momentum|Steigung)\s+(?:der\s+)?MA\s*\d+/i.test(sentence))
    add('MA_RELATION_IS_NOT_SLOPE',sentence,'Eine Kursrelation zur MA belegt weder die Steigung noch das Momentum des Durchschnitts. Ein eigener Verlaufsbeleg fehlt in dieser Aussage.');
   if(/(?:Trendwechsel|Erholung|Call[- ]These)[^.!?]{0,50}(?:erfordert|setzt[^.!?]{0,15}voraus)[^.!?]{0,70}(?:über|Rückkehr|Rückeroberung)[^.!?]{0,30}MA\s*\d+/i.test(sentence))
    add('REFERENCE_NOT_MANDATORY',sentence,'Eine allgemeine MA-Referenz kann eine These stärken; ihre Notwendigkeit für eine frühe Gegenidee ist nicht belegt.');
  }
 }
 return {version:'SELECTION_MEANING_V7',findings,status:findings.length?'REVIEW_REQUIRED':'NO_COVERED_ISSUES_FOUND',scope:'Ausgewählte ausdrückliche MA-Relationen, MA-Steigung, Phasen-/Volatilitätsableitung und Pflichtreferenzen. Keine vollständige Sprach- oder COT-Prüfung; kein Befund bestätigt keine Richtigkeit.',semanticTruthVerified:false};
}
