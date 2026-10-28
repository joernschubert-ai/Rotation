import type {AppFact} from './aiResearchAppFacts';
const obj=(v:unknown):Record<string,any>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
export interface SelectionContextCard {id:string;market:string;asOf:string|null;kind:'COT'|'HISTORY'|'PNF';sourceText:string;data:Record<string,any>;limitation:string;} 
/** Source-bound context, independent of the model's top-three selection. Not extra votes. */
export function selectionContextCards(facts:AppFact[],allowed:Set<string>,snapshotTimestamp:string){
 return facts.filter(f=>allowed.has(f.id)&&f.status!=='MISSING'&&f.asOf!==null&&Number.isFinite(Date.parse(f.asOf))&&Date.parse(f.asOf)<=Date.parse(snapshotTimestamp)&&['COT','Historische Vergleiche','P&F'].includes(f.domain)).flatMap<SelectionContextCard>(f=>{
  const v=f.values;
  if(f.domain==='COT'){
   const changes=Array.isArray(v.changes)?v.changes:[];
   return [{id:f.id,market:f.market,asOf:f.asOf,kind:'COT',sourceText:f.text,data:{position:{group:v.group??null,net:v.net??null,state:v.state??null},weekly:changes.filter(c=>c?.weeks===1),longerHorizons:changes.filter(c=>typeof c?.weeks==='number'&&c.weeks>1),conflictPairs:Array.isArray(v.conflictPairs)?v.conflictPairs:[],publicationTime:v.publicationTime??null},limitation:'Nettozustand ist keine neue Kauf-/Verkaufsaktivität oder automatische Kursrichtung. 1 Woche und längere Horizonte getrennt abwägen.'}];
  }
  if(f.domain==='Historische Vergleiche'){
   const stats=obj(v.statistics),mean=stats.meanPct;
   const finite=typeof mean==='number'&&Number.isFinite(mean);
   return [{id:f.id,market:f.market,asOf:f.asOf,kind:'HISTORY',sourceText:f.text,data:{family:v.family??null,state:v.state??null,currentMatch:v.currentMatch===true,followingIntervals:20,statistics:stats,positiveIndexMeanContext:finite&&mean>0?'CALL_CONTEXT_PUT_COUNTERCONTEXT':finite&&mean<0?'PUT_CONTEXT_CALL_COUNTERCONTEXT':'NO_SIGN_CONTEXT',validation:v.validation??null},limitation:'Folgende historische Indexrenditen, keine laufende Rendite oder Optionsrendite. Kein prognostischer Vorteil belegt; keine unabhängigen Stimmen aus überlappenden Studien.'}];
  }
  if(!/-PF\d+-(LAST|FORM|ADV)$/.test(f.id))return [];
  return [{id:f.id,market:f.market,asOf:f.asOf,kind:'PNF',sourceText:f.text,data:{timeRole:/-LAST$/.test(f.id)?'HISTORICAL_LAST_SIGNAL':/-FORM$/.test(f.id)?'FORMING_NOT_TRIGGERED':'ADVANCED_PATTERN_CONTEXT',freshSignalProven:false},limitation:'Historische Auslösung, aktuelle Säule und heutige Preisbedingung getrennt lesen. Erfüllte Preisbedingung beweist keine neue Auslösung. Originalbefund maßgeblich; Gegenidee bleibt möglich.'}];
 });
}
/** Replace existing source rows instead of appending duplicate COT/history evidence. */
export function modelContextRows(text:string,cards:ReturnType<typeof selectionContextCards>){
 const byId=new Map(cards.map(c=>[c.id,c]));
 return text.split('\n').map(line=>{const id=/^\[([^\]]+)\]/.exec(line)?.[1],c=id?byId.get(id):undefined;
  if(!c||c.kind==='PNF')return line;
  if(c.kind==='HISTORY')return '['+c.id+'] '+JSON.stringify(c.data);
  const data=c.data as any;
  // Full canonical changes (including previous net) remain in the app context cards.
  const compact=(xs:any[])=>xs.map(c=>({weeks:c.weeks,delta:c.delta,meaning:c.meaning}));
  return '['+c.id+'] '+JSON.stringify({...data,weekly:compact(data.weekly),longerHorizons:compact(data.longerHorizons)});
 }).join('\n');
}

