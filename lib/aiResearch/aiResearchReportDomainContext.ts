import type {AIResearchReport} from './aiResearchTypes';
import type {AppFacts,AppFact} from './aiResearchAppFacts';
import {buildDomainBriefs} from './aiResearchDomainBriefs';
import {buildDomainBoundaries,auditDomainBoundaries} from './aiResearchDomainBoundaries';
import {domainLanguageFindings} from './aiResearchDomainFocus';
export const REPORT_DOMAIN_CONTEXT='REPORT_DOMAIN_CONTEXT_V79_4' as const;
type Report=Pick<AIResearchReport,'appFacts'|'decisionSupport'|'aiSynthesis'>;
type Note={instrument:string;code:string;message:string;quote?:string};
const obj=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const validStamp=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
/** Pure display projection. No providers, model calls, permissions or cached report writes. */
export function prepareReportDomainContext(report:Report|null|undefined,displayedSnapshot?:string,suspended=false){
 const facts=report?.appFacts,frame=report?.decisionSupport?.snapshotTimestamp;
 const base={version:REPORT_DOMAIN_CONTEXT,reportSnapshotTimestamp:validStamp(frame)?frame:null,factsSnapshotTimestamp:validStamp(facts?.snapshotTimestamp)?facts!.snapshotTimestamp:null,
  matchesDisplayedSnapshot:validStamp(frame)&&frame===displayedSnapshot,entryStatementsSuspended:suspended,origin:'APP_REPORT_FACTS_NOT_MODEL_SELECTION',semanticTruthVerified:false,modelRequestsUsed:0};
 const empty=(status:string,message:string)=>({...base,status,message,markets:[] as ReturnType<typeof marketCards>,interpretationNotes:[] as Note[],notesScope:'Keine freie Interpretation mit passenden Fakten geprüft.'});
 if(!facts)return empty('MISSING_FACTS','Für diesen Bericht sind keine vollständigen App-Fakten gespeichert. Es werden keine aktuellen Daten nachgeladen.');
 if(!validStamp(frame)||!validStamp(facts.snapshotTimestamp)||frame!==facts.snapshotTimestamp)return empty('SNAPSHOT_MISMATCH','Berichtstand und App-Fakten passen nicht zusammen. Der zusätzliche Fachkontext wird nicht mit anderen Daten rekonstruiert.');
 if(facts.version!=='APP_FACTS_V71'||!Array.isArray(facts.facts)||facts.facts.length>500||!Array.isArray(facts.limitations))return empty('INVALID_FACTS','Kein geeigneter vollständiger Faktenbestand für diese Darstellung.');
 const ids=new Set<string>();
 for(const row of facts.facts){const f=obj(row);if(typeof f.id!=='string'||f.id.length>120||ids.has(f.id)||typeof f.domain!=='string'||!['NASDAQ','RUSSELL_2000','SHARED'].includes(f.market)||!['CALCULATED','SUPPLIED','MISSING'].includes(f.status)||typeof f.text!=='string'||f.text.length>18000||f.values===null||typeof f.values!=='object'||Array.isArray(f.values))return empty('INVALID_FACTS','Ungültige oder doppelte App-Fakten. Der zusätzliche Kontext bleibt zurückgehalten.');ids.add(f.id);}
 const briefs=buildDomainBriefs(facts,ids),boundaries=buildDomainBoundaries(briefs),markets=marketCards(facts,briefs,boundaries);
 const raw=report?.aiSynthesis?.sourceReview;
 const notesAllowed=base.matchesDisplayedSnapshot&&!suspended&&raw?.snapshotTimestamp===frame&&typeof raw.originalText==='string'&&raw.originalText.length<=18000;
 const interpretationNotes:Note[]=notesAllowed?[...domainLanguageFindings(raw.originalText),...auditDomainBoundaries(raw.originalText,briefs)]:[];
 return {...base,status:'AVAILABLE',message:'COT und historische Vergleiche aus genau diesem gespeicherten Bericht. Keine neue KI-Abwägung oder Einstiegserlaubnis.',markets,interpretationNotes,
  notesScope:notesAllowed?'Begrenzte Wortlaut-Prüfhinweise zur vorhandenen Originalantwort. Kein vollständiger Sprach-, Zahlen- oder Prognosetest.':'Keine aktuelle passende KI-Originalantwort für zusätzliche Wortlaut-Prüfhinweise verwendet.'};
}
function marketCards(facts:AppFacts,briefs:ReturnType<typeof buildDomainBriefs>,boundaries:ReturnType<typeof buildDomainBoundaries>){
 return ['NASDAQ','RUSSELL_2000'].map(market=>{
  const cot=briefs.cot.filter(c=>c.market===market),history=briefs.history.filter(h=>h.market===market&&h.currentMatch),ids=new Set([...cot,...history].map(c=>c.id));
  const relevant=facts.facts.filter(f=>f.market===market&&['COT','Historische Vergleiche'].includes(f.domain));
  const excludedSources=relevant.filter(f=>!ids.has(f.id)).map(f=>({id:f.id,asOf:f.asOf,reason:exclusionReason(f,facts.snapshotTimestamp)}));
  return {market,cot,history,groupComparison:briefs.groupComparisons.find(g=>g.market===market)!,boundaries:boundaries.find(b=>b.market===market)!,
   sources:relevant.filter(f=>ids.has(f.id)).map(f=>({id:f.id,asOf:f.asOf,text:f.text,status:f.status})),excludedSources,
   missingGroups:['LEVERAGED_MONEY','ASSET_MANAGER'].filter(g=>!cot.some(c=>c.group===g)),empty:cot.length===0&&history.length===0};
 });
}
function exclusionReason(f:AppFact,stamp:string){return f.status==='MISSING'?'MISSING':!validStamp(f.asOf)?'UNKNOWN_DATE':Date.parse(f.asOf)>Date.parse(stamp)?'FUTURE_OBSERVATION':f.domain==='Historische Vergleiche'&&f.values.currentMatch!==true?'NO_CURRENT_MATCH':'NOT_INCLUDED';}
