import type { AppFact } from './aiResearchAppFacts';
type Direction='UP'|'DOWN';
type Instrument='NASDAQ_PUT'|'NASDAQ_CALL'|'RUSSELL_CALL';
export interface BoundCondition {
 id:string;sourceFindingId:string;asOf:string;price:number;direction:Direction;
 comparison:'>'|'<'|'>='|'<=';state:'OPEN'|'ALREADY_MET';
 role:'REFERENCE'|'PATTERN_TRIGGER'|'PATTERN_INVALIDATION';
 effect:'STRENGTHENS'|'WEAKENS';distancePct:number;
}
export interface InstrumentBinding {
 version:'INSTRUMENT_BINDINGS_V76';instrument:Instrument;market:'NASDAQ'|'RUSSELL_2000';
 status:'AVAILABLE'|'UNAVAILABLE';asOf:string|null;close:number|null;
 favorableDirection:Direction;counterRisk:{direction:Direction;description:string;referenceIds:string[]};
 favorableReferenceIds:string[];formingTriggerIds:string[];conditions:BoundCondition[];
 rejected:Array<{id:string;reason:string}>;
 selection:'NEAREST_TWO_OPEN_REFERENCES_PER_DIRECTION';mandatoryEntryCondition:false;
}
const positive=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>0;
const date=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;

/** Binds existing facts, never generates a new price, signal, probability or entry permission. */
export function buildInstrumentBindings(facts:AppFact[],snapshotTimestamp:string):InstrumentBinding[]{
 return (['NASDAQ_PUT','NASDAQ_CALL','RUSSELL_CALL'] as const).map(instrument=>{
  const market=instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ',prefix=market==='NASDAQ'?'N-F':'R-F';
  const favorableDirection:Direction=instrument==='NASDAQ_PUT'?'DOWN':'UP',riskDirection:Direction=favorableDirection==='UP'?'DOWN':'UP';
  const own=facts.filter(f=>f.market===market),closeFacts=own.filter(f=>f.id===prefix+'-CLOSE'),c=closeFacts.length===1?closeFacts[0]:undefined;
  const valid=!!c&&c.status==='CALCULATED'&&date(c.asOf)&&Number.isFinite(Date.parse(snapshotTimestamp))&&c.asOf<=snapshotTimestamp.slice(0,10)&&positive(c.values.close);
  const close=valid?c!.values.close as number:null,conditions:BoundCondition[]=[],rejected:InstrumentBinding['rejected']=[];
  const ids=new Map<string,AppFact[]>();for(const f of facts)ids.set(f.id,[...(ids.get(f.id)??[]),f]);
  for(const f of own.filter(f=>f.domain==='Preisbedingungen')){
   const reject=(reason:string)=>rejected.push({id:f.id,reason}),v=f.values;
   if(!valid){reject('NO_VALID_OWN_CLOSE');continue;}
   if(ids.get(f.id)?.length!==1){reject('DUPLICATE_ID');continue;}
   if(f.status!=='CALCULATED'||f.asOf!==c!.asOf||!positive(v.price)||!['UP','DOWN'].includes(String(v.direction))||!['OPEN','ALREADY_MET'].includes(String(v.state))){reject('INVALID_OR_MISALIGNED_CONDITION');continue;}
   const role=v.role as BoundCondition['role'],direction=v.direction as Direction;
   const reference=new RegExp('^'+prefix+'-(?:MA(?:20|50|200)|lowClose|highClose)-(UP|DOWN)$').exec(f.id);
   const pattern=new RegExp('^('+prefix+'-PF[01]-(?:LAST|FORM|ADV))-(TRIGGER|INVALID)$').exec(f.id);
   if((role==='REFERENCE'&&(!reference||reference[1]!==direction))||(role!=='REFERENCE'&&(!pattern||role!==(pattern[2]==='TRIGGER'?'PATTERN_TRIGGER':'PATTERN_INVALIDATION')))){reject('ID_ROLE_MISMATCH');continue;}
   const sourceFindingId=role==='REFERENCE'?f.id:pattern![1],sources=ids.get(sourceFindingId);
   if(!sources||sources.length!==1||sources[0].market!==market||sources[0].asOf!==c!.asOf||sources[0].status!=='CALCULATED'||role!=='REFERENCE'&&sources[0].domain!=='P&F'){reject('MISSING_OR_WRONG_SOURCE');continue;}
   const inclusive=role!=='REFERENCE',met=direction==='UP'?(inclusive?close!>=v.price:close!>v.price):(inclusive?close!<=v.price:close!<v.price);
   if(v.state!==(met?'ALREADY_MET':'OPEN')){reject('STATE_PRICE_CONTRADICTION');continue;}
   const expectedPut=direction==='DOWN'?'STRENGTHENS':'WEAKENS',effects=v.effects as {put?:unknown;call?:unknown}|undefined;
   if(effects?.put!==expectedPut||effects?.call===(effects?.put)||effects?.call!==(direction==='UP'?'STRENGTHENS':'WEAKENS')){reject('EFFECT_CONTRADICTION');continue;}
   conditions.push({id:f.id,sourceFindingId,asOf:c!.asOf!,price:v.price,direction,comparison:direction==='UP'?(inclusive?'>=':'>'):(inclusive?'<=':'<'),state:v.state as BoundCondition['state'],role,effect:direction===favorableDirection?'STRENGTHENS':'WEAKENS',distancePct:100*(v.price/close!-1)});
  }
  const nearest=(direction:Direction)=>conditions.filter(c=>c.role==='REFERENCE'&&c.state==='OPEN'&&c.direction===direction).sort((a,b)=>Math.abs(a.distancePct)-Math.abs(b.distancePct)||a.id.localeCompare(b.id)).slice(0,2).map(c=>c.id);
  return {version:'INSTRUMENT_BINDINGS_V76',instrument,market,status:valid?'AVAILABLE':'UNAVAILABLE',asOf:valid?c!.asOf:null,close,favorableDirection,
   counterRisk:{direction:riskDirection,description:instrument==='NASDAQ_PUT'?'Erholung des eigenen Index':'Weitere Schwäche des eigenen Index',referenceIds:nearest(riskDirection)},
   favorableReferenceIds:nearest(favorableDirection),formingTriggerIds:conditions.filter(c=>c.role==='PATTERN_TRIGGER'&&c.sourceFindingId.endsWith('-FORM')&&c.state==='OPEN').map(c=>c.id),
   conditions,rejected,selection:'NEAREST_TWO_OPEN_REFERENCES_PER_DIRECTION',mandatoryEntryCondition:false};
 });
}

export function instrumentBindingFact(binding:InstrumentBinding):AppFact{
 const id=binding.instrument==='NASDAQ_PUT'?'N-BIND-PUT':binding.instrument==='NASDAQ_CALL'?'N-BIND-CALL':'R-BIND-CALL';
 const show=(ids:string[])=>ids.map(id=>{const c=binding.conditions.find(c=>c.id===id)!;return `${c.comparison} ${c.price}, ${c.effect==='STRENGTHENS'?'stärkt':'schwächt'} die Idee (${c.id}; Beleg ${c.sourceFindingId})`;}).join('; ')||'keine passende offene Referenz verfügbar';
 return {id,domain:'Instrumentbedingungen und Risiken',market:binding.market,asOf:binding.asOf,status:binding.status==='AVAILABLE'?'CALCULATED':'MISSING',
  text:`${binding.instrument}: ${binding.counterRisk.description} ist das richtungsbezogene Gegenrisiko. ${binding.status==='AVAILABLE'?`Schluss ${binding.close}, Stand ${binding.asOf}. Günstige offene Referenzen: ${show(binding.favorableReferenceIds)}. Ungünstige offene Referenzen: ${show(binding.counterRisk.referenceIds)}. Offene entstehende P&F-Trigger: ${show(binding.formingTriggerIds)}.`:'Keine gültige eigene Preiszuordnung verfügbar.'} Die Referenzauswahl folgt nur dem Abstand zum Schluss, keiner Erfolgsrangliste. Keine notwendige Einstiegsschwelle, kein Optionswert und kein stärkstes Gesamtrisiko berechnet.`,values:{binding}};
}
