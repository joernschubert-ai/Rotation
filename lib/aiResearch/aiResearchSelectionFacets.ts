import type {SelectionContext} from './aiResearchSelectionBaseContract';
export interface SourceFacet {key:string;sourceId:string;market:string;asOf:string|null;kind:string;data:Record<string,unknown>;meaning:string;}
const object=(v:unknown):Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
/** Canonical source fragments. No model-supplied dates, group names or numbers are rendered. */
export function sourceFacets(context:SelectionContext,id:string):SourceFacet[]{
 const f=context.byId.get(id);
 if(!f||!context.allowed.has(id)||f.status==='MISSING'||f.asOf!==null&&(!Number.isFinite(Date.parse(f.asOf))||Date.parse(f.asOf)>Date.parse(context.facts.snapshotTimestamp)))return [];
 const v=f.values,base={sourceId:id,market:f.market,asOf:f.asOf};
 if(f.domain==='COT'){
  const group=typeof v.group==='string'?v.group:null;
  const out:SourceFacet[]=[{...base,key:'NET',kind:'COT_NET_STATE',data:{group,net:v.net??null,state:v.state??null},meaning:'Nettozustand, kein aktueller Kauf-/Verkaufsimpuls oder Preisrichtung.'}];
  for(const item of Array.isArray(v.changes)?v.changes:[]){const c=object(item);if(typeof c.weeks==='number'&&Number.isInteger(c.weeks)&&c.weeks>0&&typeof c.delta==='number'&&Number.isFinite(c.delta))out.push({...base,key:'CHANGE_'+c.weeks+'W',kind:'COT_NET_CHANGE',data:{group,weeks:c.weeks,delta:c.delta,previous:c.previous??null,meaning:c.meaning??null},meaning:'Nettoänderung über benannten Horizont, keine Bruttotransaktionen, Motive oder automatische Preisrichtung.'});}
  if(Array.isArray(v.conflictPairs)&&v.conflictPairs.length)out.push({...base,key:'CONFLICTS',kind:'COT_HORIZON_CONFLICT',data:{group,pairs:v.conflictPairs},meaning:'Gegenläufige Änderungen verschiedener Horizonte, keine Auflösung durch Nettozustand.'});
  return out;
 }
 if(f.domain==='Historische Vergleiche')return [{...base,key:'FORWARD_20D',kind:'HISTORICAL_FORWARD_RETURN',data:{family:v.family??null,state:v.state??null,currentMatch:v.currentMatch??null,statistics:v.statistics??null,followingIntervals:20},meaning:'Folgende historische Indexrenditen, keine aktuelle Dynamik oder nächste Rendite; Stichprobengrenzen bleiben bestehen.'}];
 if(f.domain==='P&F')return [{...base,key:'PATTERN_CONTEXT',kind:'PNF_SOURCE_CONTEXT',data:{originalFinding:f.text},meaning:'Originalbefund mit historischem Status, aktueller Säule und Preisbedingung getrennt; keine neue Auslösung aus historischer Bestätigung ableiten.'}];
 if(/^[NR]-F-MA(?:20|50|200)$/.test(id))return [{...base,key:'RELATION',kind:'PRICE_TO_MA',data:{period:v.period??null,average:v.average??null,relation:v.relation??null},meaning:'Kursrelation, keine MA-Steigung, bewiesene Unterstützung oder Pflichtschwelle.'}];
 return [{...base,key:'CONTEXT',kind:'SOURCE_CONTEXT',data:{originalFinding:f.text,values:v},meaning:'Quellgebundener Kontext; keine zusätzlichen Eigenschaften aus der Kennung ableiten.'}];
}
export function requiredCOTFacets(context:SelectionContext,id:string){
 const all=sourceFacets(context,id),f=context.byId.get(id);if(f?.domain!=='COT')return [];
 const required=new Set(['NET']);
 if(all.some(x=>x.key==='CHANGE_1W'))required.add('CHANGE_1W');
 for(const pair of Array.isArray(f.values.conflictPairs)?f.values.conflictPairs:[]){const p=object(pair);if(p.leftWeeks===1||p.rightWeeks===1){for(const n of [p.leftWeeks,p.rightWeeks])if(typeof n==='number'&&all.some(x=>x.key==='CHANGE_'+n+'W'))required.add('CHANGE_'+n+'W');}}
 if(all.some(x=>x.key==='CONFLICTS'))required.add('CONFLICTS');
 return [...required];
}
