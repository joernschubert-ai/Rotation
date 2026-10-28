import { selectionContextCards, modelContextRows } from './aiResearchSelectionContextCards';
import { directRelationEffect } from './aiResearchSelectionMeaning';
import { appFactsForModel, type AppFacts, type AppFact } from './aiResearchAppFacts';
import { modelEvidenceRegistry } from './aiResearchModelEvidenceRegistry';
import { buildInstrumentBindings, type InstrumentBinding } from './aiResearchInstrumentBindings';

export const SELECTION_CONTRACT='EVIDENCE_SELECTION_V1' as const;
export const INSTRUMENTS=['NASDAQ_PUT','NASDAQ_CALL','RUSSELL_CALL'] as const;
type Instrument=typeof INSTRUMENTS[number];
export type Stance='CONTEXT_SUPPORTS'|'CONTEXT_OPPOSES'|'MIXED'|'UNCLEAR';
export interface Selection {instrument:Instrument;stance:Stance;supports:string[];opposes:string[];hypothesis:string;changeConditionId:string|null;}
export interface SelectionContext {facts:AppFacts;modelText:string;byId:Map<string,AppFact>;allowed:Set<string>;bindings:InstrumentBinding[];}
export interface SelectionIssue {path:string;code:string;message:string;}
const object=(v:unknown):Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));

/** Detached lab only. Data is never loaded from a provider or written into the normal report. */
export function selectionContext(value:unknown):SelectionContext{
 const f=object(value);if(f.version!=='APP_FACTS_V71'||typeof f.snapshotTimestamp!=='string'||!Number.isFinite(Date.parse(f.snapshotTimestamp))||!Array.isArray(f.facts)||f.facts.length>500||!Array.isArray(f.limitations))throw Error('Ungültiger gespeicherter App-Faktenbestand.');
 const facts=value as AppFacts,byId=new Map<string,AppFact>();
 for(const row of facts.facts){if(!row||typeof row.id!=='string'||row.id.length>120||typeof row.domain!=='string'||!['NASDAQ','RUSSELL_2000','SHARED'].includes(row.market)||!['CALCULATED','SUPPLIED','MISSING'].includes(row.status)||typeof row.text!=='string'||row.text.length>18000||!row.values||typeof row.values!=='object'||Array.isArray(row.values)||byId.has(row.id))throw Error('Ungültige oder doppelte Faktenkennung.');byId.set(row.id,row);}
 const modelText=appFactsForModel(facts); // Provider limit is checked against the final prepared payload, after catalog projection.
 return {facts,modelText,byId,allowed:new Set(modelEvidenceRegistry(modelText).keys()),bindings:buildInstrumentBindings(facts.facts,facts.snapshotTimestamp)};
}

export function validateSelection(raw:unknown,context:SelectionContext){
 const issues:SelectionIssue[]=[],issue=(path:string,code:string,message:string)=>issues.push({path,code,message});let parsed:unknown;
 if(typeof raw!=='string'||raw.length>18000){issue('$','OUTPUT_SIZE','Keine passende Textantwort.');return {ok:false as const,issues,selections:[] as Selection[]};}
 try{parsed=JSON.parse(raw);}catch{issue('$','JSON_FORMAT','Keine unveränderte JSON-Ausgabe; keine automatische Reparatur.');return {ok:false as const,issues,selections:[] as Selection[]};}
 const root=object(parsed);if(!exact(root,['version','instruments'])||root.version!==SELECTION_CONTRACT||!Array.isArray(root.instruments)||root.instruments.length!==3){issue('$','SCHEMA','Erwartet wird der Auswahlvertrag mit genau drei Instrumenten.');return {ok:false as const,issues,selections:[] as Selection[]};}
 const selections:Selection[]=[],seen=new Set<string>();
 for(const [index,item]of root.instruments.entries()){
  const p='instruments.'+index,r=object(item);
  if(!exact(r,['instrument','stance','supports','opposes','hypothesis','changeConditionId'])||!INSTRUMENTS.includes(r.instrument as Instrument)||seen.has(String(r.instrument))){issue(p,'INSTRUMENT_SCHEMA','Fehlendes, doppeltes oder unbekanntes Instrument/Feld.');continue;}seen.add(String(r.instrument));
  const instrument=r.instrument as Instrument,b=context.bindings.find(b=>b.instrument===instrument)!;
  if(!['CONTEXT_SUPPORTS','CONTEXT_OPPOSES','MIXED','UNCLEAR'].includes(String(r.stance)))issue(p+'.stance','STANCE','Unbekannte qualitative Einordnung.');
  if(typeof r.hypothesis!=='string'||r.hypothesis.trim().length<20||r.hypothesis.length>650)issue(p+'.hypothesis','HYPOTHESIS','Eine kurze, ausdrücklich ungeprüfte Interpretation wird benötigt.');
  const all=new Set<string>();
  for(const role of ['supports','opposes'] as const){
   const ids=r[role];if(!Array.isArray(ids)){issue(p+'.'+role,'SELECTION_LIST','Erwartet wird eine Liste von Belegkennungen.');continue;}
   if(ids.some(id=>typeof id!=='string'))issue(p+'.'+role,'SELECTION_LIST','Belegkennungen müssen Text sein; vorhandene Textkennungen werden weiterhin einzeln geprüft.');
   for(const id of ids){
    if(typeof id!=='string')continue;
    if(all.has(id)){issue(p+'.'+role,'DUPLICATE_SELECTION','Ein Befund darf nicht mehrfach oder gleichzeitig auf beiden Seiten stehen.');continue;}all.add(id);
    const fact=context.byId.get(id);
    if(!fact||!context.allowed.has(id)){issue(p+'.'+role,'UNAVAILABLE_REFERENCE','Beleg ist nicht als eigene Faktenzeile im tatsächlichen Modellkontext vorhanden.');continue;}
    if(fact.status==='MISSING'||fact.asOf!==null&&(!Number.isFinite(Date.parse(fact.asOf))||Date.parse(fact.asOf)>Date.parse(context.facts.snapshotTimestamp))){issue(p+'.'+role,'MISSING_OR_FUTURE','Fehlende oder spätere Daten sind kein aktueller Befund.');continue;}
    if(fact.market!==b.market&&fact.market!=='SHARED'||fact.id==='G-PUT_TIMING'&&instrument!=='NASDAQ_PUT'){issue(p+'.'+role,'WRONG_MARKET','Fremder Index beziehungsweise fremdes Instrument.');continue;}
    if(instrument==='RUSSELL_CALL'&&['G-ROTATION','G-FRAGILITY','G-LIQUIDITY'].includes(id)){issue(p+'.'+role,'WRONG_MARKET','Dieser Kontext stammt aus dem Nasdaq-Zweig, nicht aus einer eigenen Russell-Messung.');continue;}
    const hints=Array.isArray(fact.values.marketHints)?fact.values.marketHints:[];
    if(fact.domain==='Nachrichten'&&hints.length&&hints.every(h=>['NASDAQ','RUSSELL_2000'].includes(String(h)))&&!hints.includes(b.market)){issue(p+'.'+role,'WRONG_MARKET','Die Nachricht ist nur dem anderen Index zugeordnet. Mögliche Übertragung bleibt gesonderte Interpretation.');continue;}
    if(['Preisbedingungen','Instrumentbedingungen und Risiken','App-Freigaben'].includes(fact.domain)){issue(p+'.'+role,'FUTURE_AS_OBSERVATION','Bedingungen, Risikozuordnungen und Ausführungsfreigaben sind keine beobachteten Richtungsargumente in diesen Listen.');continue;}
    const directEffect=directRelationEffect(fact,instrument);
    if(directEffect&&directEffect!==(role==='supports'?'STRENGTHENS':'WEAKENS'))issue(p+'.'+role,'MA_RELATION_EFFECT','Die direkte Kursrelation zur MA gehört auf die andere Instrumentseite. Eine Gegenidee bleibt durch andere Befunde begründbar. Keine automatische Handelsentscheidung.');
    const effects=[...new Set(b.conditions.filter(c=>c.role==='PATTERN_TRIGGER'&&c.sourceFindingId===id).map(c=>c.effect))];
    if(fact.domain==='P&F'&&effects.length!==1){issue(p+'.'+role,'NO_UNAMBIGUOUS_PATTERN_EFFECT','Nur ein eigener LAST-/FORM-/ADV-Befund mit eindeutiger zugeordneter Musterwirkung ist hier auswählbar. Mechanik/Säule/Skalen bleiben Zusatzkontext, keine direkte Musterrichtung.');continue;}
    if(effects.length===1&&effects[0]!== (role==='supports'?'STRENGTHENS':'WEAKENS'))issue(p+'.'+role,'PATTERN_EFFECT','Die direkte Musterwirkung passt nicht zu dieser Seite. Ein Gegenmuster kann gegen eine frühe Gegenidee stehen, verbietet sie aber nicht.');
    if(fact.domain==='Historische Vergleiche'){
     const mean=object(fact.values.statistics).meanPct;
     if(fact.values.currentMatch!==true)issue(p+'.'+role,'UNMATCHED_HISTORY','Kein bestätigter aktueller Zustandsabgleich.');
     if(typeof mean==='number'&&mean!==0){const positive=mean>0,effect=positive===(instrument!=='NASDAQ_PUT')?'STRENGTHENS':'WEAKENS';if(effect!==(role==='supports'?'STRENGTHENS':'WEAKENS'))issue(p+'.'+role,'HISTORY_EFFECT','Das absolute historische Indexmittel hat den entgegengesetzten Richtungskontext. Basisvergleich und Prognose bleiben davon getrennt.');}
    }
   }
  }
  const supportCount=Array.isArray(r.supports)?r.supports.length:0,opposeCount=Array.isArray(r.opposes)?r.opposes.length:0;
  if(r.stance==='CONTEXT_SUPPORTS'&&supportCount===0||r.stance==='CONTEXT_OPPOSES'&&opposeCount===0||r.stance==='MIXED'&&(supportCount===0||opposeCount===0))issue(p+'.stance','STANCE_WITHOUT_SELECTED_EVIDENCE','Die Einordnung benötigt passende ausgewählte Seiten. Bei fehlenden Befunden UNCLEAR verwenden statt Belege zu erfinden.');
  const condition=r.changeConditionId;
  if(condition!==null){const c=typeof condition==='string'?b.conditions.find(c=>c.id===condition):undefined;if(!c||c.state!=='OPEN'||!context.allowed.has(c.id)||!context.allowed.has(c.sourceFindingId))issue(p+'.changeConditionId','INVALID_OPEN_CONDITION','Nur eine eigene, geprüfte, noch offene und im Modell vorhandene Bedingung ist zulässig. Null ist erlaubt.');}
  selections.push(r as unknown as Selection);
 }
 if(seen.size!==3)issue('$','MISSING_INSTRUMENT','Alle drei Instrumente müssen genau einmal vorkommen.');
 return {ok:issues.length===0,issues,selections:issues.length===0?selections:[]};
}

/** Facts are rendered from source objects, never from model-supplied copies of prices or states. */
export function renderSelection(result:ReturnType<typeof validateSelection>,context:SelectionContext){
 if(!result.ok)return null;
 return result.selections.map(s=>{
  const b=context.bindings.find(b=>b.instrument===s.instrument)!;
  const sources=(ids:string[])=>ids.map(id=>{const f=context.byId.get(id)!;return {id,domain:f.domain,market:f.market,asOf:f.asOf,text:f.text,values:f.values};});
  const c=b.conditions.find(c=>c.id===s.changeConditionId);
  return {instrument:s.instrument,stance:s.stance,supports:sources(s.supports),opposes:sources(s.opposes),
   interpretation:{text:s.hypothesis,verified:false},counterRisk:{...b.counterRisk,meaning:'Richtungsrisiko des eigenen Index; kein berechnetes stärkstes Gesamtrisiko oder Optionswert.'},
   changeCondition:c?{...c,mandatoryEntryCondition:false}:null,entryPermission:'NOT_DERIVED',semanticTruthVerified:false};
 });
}

/** Eligibility comes from the same unchanged contract used after generation.
 * This is admissibility, not an automatic directional judgement or ranking. */
export function selectionCatalog(context:SelectionContext){
 const empty=()=>({version:SELECTION_CONTRACT,instruments:INSTRUMENTS.map(instrument=>({instrument,stance:'UNCLEAR',supports:[] as string[],opposes:[] as string[],hypothesis:'Ungeprüfte qualitative Hypothese; keine Handelsfreigabe.',changeConditionId:null as string|null}))});
 const eligible=INSTRUMENTS.map(instrument=>{
  const supports:string[]=[],opposes:string[]=[];
  for(const id of context.byId.keys())for(const role of ['supports','opposes'] as const){
   const trial=empty(),row=trial.instruments.find(r=>r.instrument===instrument)!;row[role]=[id];
   if(validateSelection(JSON.stringify(trial),context).ok)(role==='supports'?supports:opposes).push(id);
  }
  const b=context.bindings.find(b=>b.instrument===instrument)!;
  const conditions=b.conditions.filter(c=>c.state==='OPEN'&&context.allowed.has(c.id)&&context.allowed.has(c.sourceFindingId));
  return {instrument,supports,opposes,conditions};
 });
 const selected=new Set(eligible.flatMap(r=>[...r.supports,...r.opposes]));
 const contextCards=selectionContextCards(context.facts.facts,context.allowed,context.facts.snapshotTimestamp);
 const observations=modelContextRows(context.modelText,contextCards).split('\n').filter(line=>{const id=/^\[([^\]]+)\]/.exec(line)?.[1];return !!id&&selected.has(id);}).join('\n');
 // No original BIND rows or price-condition rows are appended to the observations.
 const text='BEFUNDKATALOG: datierte Beobachtungen und Vergleichskontext. Auswahl ist keine Bestätigung einer These.\n'+observations+
  '\nZULAESSIGE_BELEGKENNUNGEN_JE_INSTRUMENT: Die Seiten begrenzen nur die Zulässigkeit. Bei Kennungen auf beiden Seiten bleibt die Abwägung offen.\n'+JSON.stringify(eligible.map(r=>({instrument:r.instrument,supports:r.supports,opposes:r.opposes})))+
  '\nSZENARIOBEDINGUNGEN: ausschließlich optionales changeConditionId, niemals supports/opposes. Offen bedeutet noch nicht erfüllt; kein aktueller Stützungsbefund und keine Eintrittspflicht.\n'+JSON.stringify(eligible.map(r=>({instrument:r.instrument,conditions:r.conditions.map(c=>({id:c.id,sourceFindingId:c.sourceFindingId,price:c.price,direction:c.direction,state:c.state,role:c.role,effect:c.effect}))})))+
  '\nGRENZEN: COT position ist Zustand, weekly 1W-Änderung, longerHorizons längere Änderungen; conflictPairs bleiben getrennt. Netto-Long ist kein Kaufimpuls. Historische Folgerenditen sind keine Prognose. Musterstatus und Skalen sind keine unabhängigen Stimmen. Freie Hypothese bleibt ungeprüft. Keine Optionsbewertung oder Ausführungsfreigabe.';
 return {version:'SEPARATED_CATALOG_V4',contextCards,eligible,observationIds:[...selected],text};
}


