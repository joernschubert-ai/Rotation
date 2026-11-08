import * as base from './aiResearchSelectionBaseContract';
import {sourceFacets} from './aiResearchSelectionFacets';
export {selectionContext,INSTRUMENTS} from './aiResearchSelectionBaseContract';
export type {SelectionContext,SelectionIssue,Stance} from './aiResearchSelectionBaseContract';
export const SELECTION_CONTRACT='EVIDENCE_ARGUMENTS_V2' as const;
export interface EvidenceArgument {side:'SUPPORTS'|'OPPOSES';sourceId:string;}
export interface Selection {instrument:base.Selection['instrument'];stance:base.Stance;arguments:EvidenceArgument[];hypothesis:string;changeConditionId:string|null;}
const object=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const exact=(v:Record<string,any>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
/** Projection for the existing safeguards and app view only. Never rewrites a model response. */
const project=(s:Selection):base.Selection=>({instrument:s.instrument,stance:s.stance,supports:s.arguments.filter(a=>a.side==='SUPPORTS').map(a=>a.sourceId),opposes:s.arguments.filter(a=>a.side==='OPPOSES').map(a=>a.sourceId),hypothesis:s.hypothesis,changeConditionId:s.changeConditionId});
export function validateSelection(raw:unknown,context:base.SelectionContext){
 const advisories:base.SelectionIssue[]=[];
 const issues:base.SelectionIssue[]=[],issue=(path:string,code:string,message:string)=>issues.push({path,code,message});
 let root:Record<string,any>;
 if(typeof raw!=='string'||raw.length>18000)return {ok:false,issues:[{path:'$',code:'OUTPUT_SIZE',message:'Keine passende Textantwort.'}],selections:[] as Selection[],advisories};
 try{root=object(JSON.parse(raw));}catch{return {ok:false,issues:[{path:'$',code:'JSON_FORMAT',message:'Keine unveränderte JSON-Ausgabe; keine automatische Reparatur.'}],selections:[] as Selection[],advisories};}
 if(!exact(root,['version','instruments'])||root.version!==SELECTION_CONTRACT||!Array.isArray(root.instruments)||root.instruments.length!==3)return {ok:false,issues:[{path:'$',code:'ARGUMENT_SCHEMA',message:'Erwartet wird EVIDENCE_ARGUMENTS_V2 mit genau drei Instrumenten und einer einzigen Argumentliste.'}],selections:[] as Selection[],advisories};
 const valid:Selection[]=[],seenInstruments=new Set<string>();
 for(const [index,item]of root.instruments.entries()){
  const row=object(item),p='instruments.'+index;
  if(!exact(row,['instrument','stance','arguments','hypothesis','changeConditionId'])||!base.INSTRUMENTS.includes(row.instrument)||seenInstruments.has(row.instrument)){issue(p,'INSTRUMENT_SCHEMA','Genau eigene Instrumentfelder erwartet; keine alten supports/opposes/readings und keine doppelten Instrumente.');continue;}
  seenInstruments.add(row.instrument);
  if(!Array.isArray(row.arguments)){issue(p+'.arguments','ARGUMENT_LIST','Eine einzige Argumentliste wird benötigt.');continue;}
  if(row.arguments.length>8)advisories.push({path:p+'.arguments',code:'MANY_ARGUMENTS',message:'Mehr als acht Quellen gewählt. Dies ist ein Darstellungshinweis, kein fachlicher Fehler. Abhängige MA-/P&F-Befunde nicht als unabhängige Stimmen zählen.'});
  const seenSources=new Set<string>(),usable:EvidenceArgument[]=[];
  for(const [n,value]of row.arguments.entries()){
   const a=object(value),at=p+'.arguments.'+n;
   if(!exact(a,['side','sourceId'])||!['SUPPORTS','OPPOSES'].includes(a.side)||typeof a.sourceId!=='string'){issue(at,'ARGUMENT_SCHEMA','Genau side SUPPORTS/OPPOSES und sourceId erwartet. Teilbefunde berechnet die App. Keine eigenen facets, Zahlen/Gruppen oder zusätzlichen Felder.');continue;}
   usable.push(a as EvidenceArgument);
   if(seenSources.has(a.sourceId))issue(at,'DUPLICATE_ARGUMENT','Eine Quelle darf je Instrument nur einmal auf einer Seite stehen.');seenSources.add(a.sourceId);

  }
  // Existing source/side checks inspect every structurally valid argument, including overlong lists.
  const projected=project({...row,arguments:usable} as Selection);
  const peers=base.INSTRUMENTS.filter(x=>x!==row.instrument).map(instrument=>({instrument,stance:'UNCLEAR',supports:[],opposes:[],hypothesis:'Ungeprüfte Platzhalterhypothese nur zur internen Prüfung des eigenen Instruments.',changeConditionId:null}));
  const result=base.validateSelection(JSON.stringify({version:base.SELECTION_CONTRACT,instruments:[projected,...peers]}),context);
  for(const problem of result.issues){if(problem.path.startsWith('instruments.0'))issue(problem.path.replace('instruments.0',p).replace('.supports','.arguments.SUPPORTS').replace('.opposes','.arguments.OPPOSES'),problem.code,problem.message);else issue(p,problem.code,problem.message);}
  valid.push(row as Selection);
 }
 if(seenInstruments.size!==3)issue('$','MISSING_INSTRUMENT','Alle drei Instrumente müssen genau einmal vorkommen.');
 return {ok:issues.length===0,issues,selections:issues.length===0?valid:[],advisories};
}
export function renderSelection(result:ReturnType<typeof validateSelection>,context:base.SelectionContext){
 if(!result.ok)return null;
 const cards=base.renderSelection({ok:true,issues:[],selections:result.selections.map(project)},context);
 return cards?.map((card,i)=>({...card,sourceReadings:result.selections[i].arguments.map(a=>({sourceId:a.sourceId,side:a.side==='SUPPORTS'?'supports':'opposes',facets:sourceFacets(context,a.sourceId),derivedBy:'APP_SOURCE_DATA'})),evidenceFamilies:groupEvidence(result.selections[i].arguments,context),interpretation:{...card.interpretation,sourceBindingVerified:false}}))??null;
}
export function selectionCatalog(context:base.SelectionContext){
 const old=base.selectionCatalog(context);
 const expanded=old.eligible.map(r=>({instrument:r.instrument,supports:r.supports,opposes:r.opposes}));
 const compact=old.eligible.map(r=>({instrument:r.instrument,either:r.supports.filter(id=>r.opposes.includes(id)),supports:r.supports.filter(id=>!r.opposes.includes(id)),opposes:r.opposes.filter(id=>!r.supports.includes(id))}));
 const facetRule='AUSGABE: arguments nur side+sourceId; keine facets/readings. App liefert COT-Teilbefunde. MA/P&F abhaengig, Historie kein Impuls. JE HYPOTHESIS: eigener RSI-Befund; Neueinstieg mit Paar-ID, Kurzfristig UND 60/80 Intervalle abwaegen. Erholung: Call-Kontext/Put-Gegenwind, keine Freigabe. Gegenidee/offen erlaubt.';
 // Encode repeated admissibility lists once. Every source and side remains unchanged.
 const allEither=compact[0].either.filter(id=>compact.every(r=>r.either.includes(id)));
 const nasdaqRows=compact.filter(r=>r.instrument.startsWith('NASDAQ_'));
 const nasdaqEither=nasdaqRows[0].either.filter(id=>!allEither.includes(id)&&nasdaqRows.every(r=>r.either.includes(id)));
 const roles={allEither,nasdaqEither,rows:compact.map(r=>({...r,either:r.either.filter(id=>!allEither.includes(id)&&!(r.instrument.startsWith('NASDAQ_')&&nasdaqEither.includes(id)))}))};
 const conditions=old.eligible.map(r=>({instrument:r.instrument,conditions:r.conditions.map(c=>({id:c.id,sourceFindingId:c.sourceFindingId,price:c.price,direction:c.direction,state:c.state,role:c.role,effect:c.effect}))}));
 const tuples=old.eligible.map(r=>({instrument:r.instrument,open:r.conditions.map(c=>[c.id,c.sourceFindingId,c.price,c.direction,c.role,c.effect])}));
 if(old.eligible.some(r=>r.conditions.some(c=>c.state!=='OPEN')))throw Error('CATALOG_CONDITION_NOT_OPEN');
 const text=old.text.replace(JSON.stringify(expanded),'allEither gilt allen drei Instrumenten, nasdaqEither nur Nasdaq Put/Call; beide bedeuten either. rows ergaenzt eigene either/supports/opposes. '+JSON.stringify(roles))
  .replace(JSON.stringify(conditions),'Alle Bedingungen OPEN. Tupel=[id,sourceFindingId,price,direction,role,effect]. '+JSON.stringify(tuples))+'\n'+facetRule;
 return {...old,version:'APP_DERIVED_CATALOG_V8',text,appDerivedCatalog:old.observationIds.map(id=>({sourceId:id,facets:sourceFacets(context,id),derivedBy:'APP_SOURCE_DATA'}))};
}

/** Descriptive families only: no score, ranking, vote count or independence claim. */
function groupEvidence(args:EvidenceArgument[],context:base.SelectionContext){
 const groups=new Map<string,string[]>();
 for(const a of args){const f=context.byId.get(a.sourceId);if(!f)continue;
  const family=['Kurse','Kursverlauf','P&F'].includes(f.domain)?'PRICE_AND_PNF':f.domain==='COT'?'POSITIONING':f.domain==='Historische Vergleiche'?'HISTORICAL_COMPARISONS':'OTHER_CONTEXT';
  groups.set(family,[...(groups.get(family)??[]),a.sourceId]);
 }
 return [...groups].map(([family,sourceIds])=>({family,sourceIds,independentVotes:false,note:'Thematische Gruppe; keine Anzahl unabhängiger Bestätigungen oder automatisch berechnete Gewichtung.'}));
}
