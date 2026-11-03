import type {AIResearchReport} from './aiResearchTypes';
import {prepareReportDomainContext} from './aiResearchReportDomainContext';
import {buildTemporalGroups} from './aiResearchTemporalGroups';
type Report=Pick<AIResearchReport,'appFacts'|'decisionSupport'|'aiSynthesis'>;
/** Own stored report frame only. Existing fact validation is reused; no reconstruction or fetch. */
export function prepareReportTemporalContext(report:Report|null|undefined,displayedSnapshot?:string,suspended=false){
 const guard=prepareReportDomainContext(report,displayedSnapshot,suspended);
 const base={version:'REPORT_TEMPORAL_CONTEXT_V79_6',origin:'OWN_STORED_REPORT_APP_FACTS',reportSnapshotTimestamp:guard.reportSnapshotTimestamp,factsSnapshotTimestamp:guard.factsSnapshotTimestamp,
  matchesDisplayedSnapshot:guard.matchesDisplayedSnapshot,entryStatementsSuspended:suspended,modelRequestsUsed:0,modelRequestChanged:false,sourceValidationChanged:false};
 if(guard.status!=='AVAILABLE'||!report?.appFacts)return {...base,status:guard.status,message:guard.message,groups:null};
 const facts=report.appFacts;
 return {...base,status:'AVAILABLE',message:'Zeitfenster aus genau diesem gespeicherten Bericht. Keine neue KI-Abwägung oder Einstiegserlaubnis.',
  groups:buildTemporalGroups(facts.facts,facts.snapshotTimestamp,new Set(facts.facts.map(f=>f.id)))};
}
