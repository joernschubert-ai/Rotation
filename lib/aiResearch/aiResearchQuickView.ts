import {instrumentDashboard} from './aiResearchInstrumentDashboard';
import type {AIResearchReport} from './aiResearchTypes';
import {SYNTHESIS_CONTRACT} from './aiResearchSynthesisTypes';
/** Presentation only. Never infers forecasts, ranks evidence strength or mutates source data. */
export function researchQuickView(report:AIResearchReport,snapshot?:string,suspended=false,now=Date.now()){
 const age=snapshot?now-Date.parse(snapshot):NaN,s=report.aiSynthesis,r=s?.sourceReview;
 const matched=!!snapshot&&report.appFacts?.snapshotTimestamp===snapshot&&report.decisionSupport?.snapshotTimestamp===snapshot&&s?.snapshotTimestamp===snapshot&&r?.snapshotTimestamp===snapshot&&s?.quality?.contractVersion===SYNTHESIS_CONTRACT;
 const current=!suspended&&Number.isFinite(age)&&age>=0&&age<=86400000;
 const appFrameCurrent=current&&report.appFacts?.snapshotTimestamp===snapshot&&report.decisionSupport?.snapshotTimestamp===snapshot;
 const available=current&&matched&&s?.status==='SUCCESS'&&r&&['VALID_SELECTION','PARTIAL_SELECTION'].includes(r.status);
 const names={NASDAQ_PUT:'Nasdaq Put',NASDAQ_CALL:'Nasdaq Call',RUSSELL_CALL:'Russell Call'};
 const stances:Record<string,string>={CONTEXT_SUPPORTS:'KI sieht stützenden Kontext',CONTEXT_OPPOSES:'KI sieht mehr Gegenkontext',MIXED:'KI ordnet den Kontext gemischt ein',UNCLEAR:'KI-Einordnung offen'};
 const cards=(Object.keys(names) as Array<keyof typeof names>).map(instrument=>{
  const row=available?r.view?.find(v=>v.instrument===instrument):null;
  const fact=(f:{id:string;text:string;asOf?:string|null}|null|undefined)=>f&&typeof f.text==='string'?{id:f.id,text:f.text,asOf:f.asOf??null}:null;
  const findings=available?r.interpretationAudit.findings.filter(f=>f.instrument===instrument):[];
  return {dashboard:instrumentDashboard(report,instrument,appFrameCurrent,row?.stance),instrument,title:names[instrument],status:row?'AVAILABLE':'NOT_AVAILABLE',modelContext:row?stances[row.stance]??'KI-Einordnung offen':'Keine aktuelle passende KI-Quellenwahl',modelContextVerified:false,support:fact(row?.supports[0]),counter:fact(row?.opposes[0]),risk:row?.counterRisk.description??null,condition:row?.changeCondition?{id:row.changeCondition.id,text:'Offene Referenz: Schluss '+row.changeCondition.comparison+' '+row.changeCondition.price.toLocaleString('de-DE',{maximumFractionDigits:8})+'; '+(row.changeCondition.effect==='STRENGTHENS'?'stärkt':'schwächt')+' die Idee. Keine Pflichtschwelle.'}:null,findings:findings.length,firstEvidenceIsNotStrongest:true};
 });
 return {version:'RESEARCH_QUICK_VIEW_V1',status:suspended?'SUSPENDED':!current?'DATED_OR_UNAVAILABLE':available?'SOURCE_SELECTION_AVAILABLE':'NO_MATCHING_SELECTION',snapshot:snapshot??null,appFrameCurrent,modelGeneratedAt:s?.generatedAt??null,cards,interpretationFindings:available?r.interpretationAudit.findings.length:0,originalChanged:false,modelRequestsUsed:0,scope:'Kurzübersicht der bestehenden Put-/Call-Quellenwahl. Jeweils erster ausgewählter App-Beleg, keine berechnete Rangfolge oder neue Indexprognose. KI-Kontexteinordnung bleibt ungeprüft.'};
}
