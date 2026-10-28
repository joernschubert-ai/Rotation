import type { SynthesisEvidence } from './aiResearchSynthesisEvidence';
import { buildInstrumentPriceReferences } from './aiResearchPriceReferences';
const obj=(v:unknown):Record<string,any>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
export interface ScenarioReview {
 continuation:string;reversal:string;continuationCondition?:string;reversalCondition?:string;basis?:string;notes?:string[];
}
export function buildScenarioStates(evidence:SynthesisEvidence[],snapshot:string){
 const refs=buildInstrumentPriceReferences(evidence,snapshot);
 return Object.fromEntries(['NASDAQ','RUSSELL_2000'].map(m=>{
  const chart=obj(evidence.find(e=>e.id==='CHART_'+m&&e.available)?.data),own=refs.find(r=>r.market===m),close=own?.lastClose??null;
  const move=finite(chart.return5SessionsPct)?chart.return5SessionsPct:null;
  const direction=move===null||move===0?'UNKNOWN':move>0?'UP':'DOWN';
  const levels=[...own?.upLevels??[],...own?.downLevels??[]];
  const candidates=(side:'UP'|'DOWN'|'UNKNOWN')=>levels.filter(l=>close!==null&&(side==='UP'?l.price>close:side==='DOWN'?l.price<close:false));
  const opposite=direction==='UP'?'DOWN':direction==='DOWN'?'UP':'UNKNOWN';
  const ma=(Array.isArray(chart.movingAverages)?chart.movingAverages:[]).filter((v:any)=>finite(v.closeAverage)&&finite(close)).map((v:any)=>({id:'MA'+v.period,average:v.closeAverage,relation:close!>v.closeAverage?'ABOVE':close!<v.closeAverage?'BELOW':'EQUAL'}));
  const scales=obj(chart.formations).pointFigure;
  const formations=Array.isArray(scales)?scales.map((s:any)=>({boxPercent:s.boxPercent,currentColumn:s.currentColumn,
   historicalEvent:s.latest?{family:s.latest.family,triggerDate:s.latest.confirmedAt,role:'HISTORICAL_PRICE_EVENT_NOT_A_NEW_TRIGGER',relation:s.latest.currentRelation}:null,
   pendingEvent:s.forming?{family:s.forming.family,role:'PENDING_NOT_TRIGGERED',price:s.forming.confirmationLevel}:null})):[];
  return [m,{asOfDate:own?.asOfDate??null,lastClose:close,return5SessionsPct:move,measuredDirection:direction,
   basis:'Abgeschlossene Schlusskurse; Richtung ausschließlich aus der Kursänderung über fünf Sitzungen, kein Phasen- oder Handelssignal.',
   averages:ma,formations,continuation:{direction,candidates:candidates(direction)},reversal:{direction:opposite,candidates:candidates(opposite)}}];
 }));
}
/** Model may select only a not-yet-met own-index reference; numbers and state are server-owned. */
export function scenarioResponseSchema(states:ReturnType<typeof buildScenarioStates>){
 const branch=(v:any)=>({type:'object',additionalProperties:false,properties:{hypothesis:{type:'string',minLength:25,maxLength:650,description:'Deutsch. Eigene bedingte Hypothese samt Gegenargument, keine bereits erfüllte Bedingung als neuer Auslöser.'},triggerRef:{type:'string',enum:['NONE',...v.candidates.map((l:any)=>l.id)]}},required:['hypothesis','triggerRef']});
 return {type:'object',additionalProperties:false,properties:Object.fromEntries(Object.entries(states).map(([m,s])=>[m,{type:'object',additionalProperties:false,properties:{continuation:branch(s.continuation),reversal:branch(s.reversal)},required:['continuation','reversal']}])),required:Object.keys(states)};
}
export function resolveScenarios(raw:unknown,evidence:SynthesisEvidence[],snapshot:string):Record<string,ScenarioReview>{
 const states=buildScenarioStates(evidence,snapshot),output:Record<string,ScenarioReview>={};
 for(const [m,state]of Object.entries(states)){
  const r=obj(obj(raw)[m]),notes:string[]=[];
  const text=(v:any)=>typeof v==='string'?v:typeof v?.hypothesis==='string'?v.hypothesis:'';
  const continuation=text(r.continuation).trim().slice(0,650),reversal=text(r.reversal).trim().slice(0,650);
  if(continuation.length<25||reversal.length<25)continue;
  const condition=(role:'continuation'|'reversal')=>{
   const branch=state[role],selected=obj(r[role]).triggerRef;
   if(selected==='NONE')return 'Kein neuer Kursauslöser gewählt; Szenario bleibt eine Hypothese.';
   const level=branch.candidates.find((v:any)=>v.id===selected);
   if(!level){notes.push('Die '+(role==='continuation'?'Fortsetzungs-':'Wende-')+'Referenz fehlt oder ist nicht mehr als offene eigene Bedingung geeignet.');return 'Keine gültige neue Kursbedingung übernommen.';}
   return (branch.direction==='UP'?'Schlusskurs über ':'Schlusskurs unter ')+level.price.toLocaleString('de-DE',{maximumFractionDigits:2})+' · '+level.id+' · Stand '+level.asOfDate+' · auf dieser Schlusskursbasis noch offen; kein Kursziel.';
  };
  const allText=continuation+'. '+reversal;
  notes.push(...scenarioTextStateNotes(allText,evidence,m,snapshot));
  if(/\b(?:the|with|could|if the|remains|maintains)\b/iu.test(allText))notes.push('Die KI hat die deutsche Sprachvorgabe für die Szenarien nicht eingehalten.');
  for(const a of state.averages){
   const label='(?:MA\\s*'+a.id.slice(2)+'(?!\\d)|'+a.id.slice(2)+'[- ]day moving average)';
   if(a.relation==='BELOW'&&new RegExp('(?:maintain|hold|stay|remain|hält|bleibt)[^.!?]{0,60}(?:above|über)[^.!?]{0,25}'+label,'iu').test(allText))notes.push('Das Szenario unterstellt einen bereits gehaltenen Kurs über '+a.id+'. Der letzte Schlusskurs liegt darunter; eine Rückeroberung wäre erst künftig zu prüfen.');
  }
  output[m]={continuation,reversal,continuationCondition:condition('continuation'),reversalCondition:condition('reversal'),
   basis:'Schlusskursstand '+(state.asOfDate??'unbekannt')+' · fünf Sitzungen '+(state.return5SessionsPct===null?'nicht verfügbar':state.return5SessionsPct.toLocaleString('de-DE',{maximumFractionDigits:2})+' %')+' · beobachtete Richtung '+(state.measuredDirection==='DOWN'?'abwärts':state.measuredDirection==='UP'?'aufwärts':'nicht eindeutig')+'.',notes};
 }
 return output;
}
export function scenarioTextStateNotes(text:string,evidence:SynthesisEvidence[],market:string,snapshot:string):string[]{
 const state=buildScenarioStates(evidence,snapshot)[market],notes:string[]=[];if(!state)return notes;
 for(const a of state.averages){
  const period=a.id.slice(2),ma='(?:MA\\s*'+period+'(?!\\d)|'+period+'[- ]day moving average)';
  if(a.relation==='BELOW'&&new RegExp('(?:breakdown|break|fall|bruch|unterschreiten)[^.!?]{0,35}(?:below|unter)[^.!?]{0,20}'+ma,'iu').test(text))notes.push('Ein neuer Bruch unter '+a.id+' wird als Auslöser genannt, obwohl der letzte Schlusskurs bereits darunter liegt. Ein erneuter Bruch würde zunächst eine Rückeroberung voraussetzen.');
  if(a.relation==='ABOVE'&&new RegExp('(?:breakout|break|rise|ausbruch|überschreiten)[^.!?]{0,35}(?:above|über)[^.!?]{0,20}'+ma,'iu').test(text))notes.push('Ein neuer Ausbruch über '+a.id+' wird als Auslöser genannt, obwohl der letzte Schlusskurs bereits darüber liegt.');
 }
 const oldUp=state.formations.some((s:any)=>String(s.historicalEvent?.family).includes('TOP_BREAKOUT')&&s.currentColumn==='O');
 if(oldUp&&/confirmed.{0,35}(?:P&F )?breakout|bestätigt.{0,35}(?:aufwärtsausbruch|ausbruch)/iu.test(text)&&!/historical|frühere[rnms]?|damalig/iu.test(text))notes.push('Der bestätigte P&F-Aufwärtsausbruch liegt in der Vergangenheit und steht gegen die aktuelle Abwärtssäule; er ist keine neue Aufwärtsbestätigung.');
 return notes;
}
