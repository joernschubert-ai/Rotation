import type {prepareContextTrial} from './aiResearchContextTrial';
import {compactContextCatalog} from './aiResearchContextReadings';
export const ARGUMENT_ROLE_INSTRUCTION='QUELLENROLLEN: CLOSE/QUOTE/MAGNITUDE/DRAWDOWN/CASE-SUMMARY/HIST-TEMPORAL sind fester Sachkontext, nie arguments. WINDOW/WEEK/AFTER-WEEK nur direkter Rückblick: positives Vorzeichen Call-Stützung/Put-Gegenkontext, negatives umgekehrt; null/0 ohne Vorzug. Kein Zukunftssignal. Frühe Gegenhypothesen aus anderen eigenen Befunden bleiben möglich. Überlappende Fenster sind keine unabhängigen Stimmen.';
type Prepared=ReturnType<typeof prepareContextTrial>;
type Fact=Prepared['context']['facts']['facts'][number];
const object=(v:unknown):Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
export function argumentRole(f:Fact){
 if(/^[NR]-F-(?:CLOSE|QUOTE|MAGNITUDE|DRAWDOWN|CASE-SUMMARY)$/.test(f.id)||f.id.startsWith('HIST-TEMPORAL-'))return {kind:'FIXED_CONTEXT' as const,returnPct:null,reason:'Beobachtung oder Diagnose ohne eindeutige unmittelbare Instrumentwirkung. Bleibt vollständig im Faktenkontext.'};
 let value:unknown,known=false;
 if(/^[NR]-F-WINDOW-\d+$/.test(f.id)){value=f.values.returnPct;known=true;}
 else if(/^[NR]-F-WEEK-\d+$/.test(f.id)){const week=object(f.values.week);value=week.available===true?week.returnPct:null;known=true;}
 else if(/^[NR]-F-AFTER-WEEK$/.test(f.id)){value=object(f.values.after).returnPct;known=true;}
 if(known){
  if(!finite(value)||value===0||!f.asOf||!Number.isFinite(Date.parse(f.asOf)))return {kind:'FIXED_CONTEXT' as const,returnPct:finite(value)?value:null,reason:'Kein eindeutig gerichteter, datierter Rückblickwert. Null, fehlende Angaben und unbekannte Werte liefern keinen Richtungsvorzug.'};
  return {kind:'DIRECT_RETURN' as const,returnPct:value,reason:'Nur direkter Kontext der beobachteten Indexrendite, keine zukünftige Rendite, Einstiegserlaubnis oder Trendwende. Gegenhypothesen benötigen andere eigene Befunde.'};
 }
 return {kind:'EXISTING_RULES' as const,returnPct:null,reason:'Bestehende Quellen-, Markt-, Muster- und Seitenprüfung bleibt maßgeblich. Keine neue pauschale Richtung abgeleitet.'};
}
export function argumentRoleIssue(f:Fact,instrument:string,side:unknown){
 const role=argumentRole(f);
 if(role.kind==='FIXED_CONTEXT')return {code:'FIXED_CONTEXT_AS_ARGUMENT',message:'Diese Quelle ist fester Sach-/Diagnosekontext und kein alleiniger gerichteter Beleg. Sie wird nicht gelöscht oder umgedeutet.'};
 if(role.kind==='DIRECT_RETURN'){
  const expected=(role.returnPct!>0)===(instrument!=='NASDAQ_PUT')?'SUPPORTS':'OPPOSES';
  if(side!==expected)return {code:'DIRECT_RETURN_SIDE',message:'Die gewählte Seite widerspricht dem direkten Rückblickkontext der beobachteten Rendite. Eine Gegenhypothese kann durch andere eigene Befunde begründet werden; das Vorzeichen ist keine Prognose.'};
 }
 return null;
}
export function prepareArgumentRoles(p:Prepared){
 const eligible=p.eligible.map(row=>{
  const on=(side:'SUPPORTS'|'OPPOSES',ids:string[])=>ids.filter(id=>{const f=p.context.byId.get(id);return !!f&&!argumentRoleIssue(f,row.instrument,side);});
  const supports=on('SUPPORTS',[...row.either,...row.supports]),opposes=on('OPPOSES',[...row.either,...row.opposes]);
  return {instrument:row.instrument,either:supports.filter(id=>opposes.includes(id)),supports:supports.filter(id=>!opposes.includes(id)),opposes:opposes.filter(id=>!supports.includes(id))};
 });
 const fixed=p.observedIds.flatMap(id=>{const f=p.context.byId.get(id);if(!f)return [];const role=argumentRole(f);return role.kind==='FIXED_CONTEXT'?[{id:f.id,market:f.market,asOf:f.asOf,text:f.text,role:role.kind,reason:role.reason}]:[];});
 const compactCatalog=compactContextCatalog(eligible),lines=p.candidate.body.messages[1].content.split('\n'),index=lines.findIndex(s=>s.startsWith('ZULAESSIGE_BELEGKENNUNGEN:'));
 if(index<0)throw Error('ARGUMENT_ROLE_CATALOG_MISSING');
 const start=lines[index].indexOf('{');if(start<0)throw Error('ARGUMENT_ROLE_CATALOG_INVALID');
 lines[index]=lines[index].slice(0,start)+JSON.stringify(compactCatalog);
 // No source line, neutral table or open condition is removed. Only directional permissions change.
 return {eligible,compactCatalog,fixed,user:lines.join('\n'),version:'ARGUMENT_ROLES_V1',permissionsChanged:true,sourceFactsChanged:false,conditionsChanged:false};
}
