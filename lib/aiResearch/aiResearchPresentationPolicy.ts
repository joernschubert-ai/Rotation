import type {AIResearchReport} from './aiResearchTypes';
import {prepareReportDomainContext} from './aiResearchReportDomainContext';
import {historicalReading,groupReading} from './aiResearchContextReadings';
/** Presentation metadata only. Does not evaluate market direction, mutate reports or fetch anything. */
export function describeResearchPresentation(report:AIResearchReport|null|undefined,displayedSnapshot?:string,suspended=false){
 const frame=report?.decisionSupport?.snapshotTimestamp??null,synthesis=report?.aiSynthesis,review=synthesis?.sourceReview;
 const factsMatch=!!report?.appFacts&&frame!==null&&report.appFacts.snapshotTimestamp===frame;
 const reviewMatch=!!review&&frame!==null&&review.snapshotTimestamp===frame&&synthesis?.snapshotTimestamp===frame;
 const context=prepareReportDomainContext(report,displayedSnapshot,suspended),validFacts=context.status==='AVAILABLE';
 return {version:'RESEARCH_PRESENTATION_V79_5',scope:'SOURCE_REVIEW_REPORTS',reportSnapshotTimestamp:frame,
  matchesDisplayedSnapshot:frame!==null&&frame===displayedSnapshot,entryStatementsSuspended:suspended,
  appFactsMatchReportFrame:factsMatch,sourceReviewMatchesReportFrame:reviewMatch,
  mode:reviewMatch&&factsMatch&&validFacts?'APP_FACTS_WITH_MODEL_SOURCE_SELECTION':!report?'NO_REPORT':'DATED_OR_LEGACY_REPORT',domainContextStatus:context.status,
  sourceReviewDefaultFreeFactProse:false,modelStanceInitiallyCollapsed:true,modelHypothesisInitiallyCollapsed:true,quotedModelIssuesInitiallyCollapsed:true,
  modelRequestChanged:false,sourceValidationChanged:false,automaticModelRequest:false,originalResponseRetained:true,
  sourceSelection:reviewMatch&&factsMatch&&validFacts?(review?.view??[]).map(row=>({instrument:row.instrument,supportIds:row.supports.map(f=>f.id),oppositionIds:row.opposes.map(f=>f.id),openConditionId:row.changeCondition?.id??null})):[],
  appReadings:context.markets.map(m=>({market:m.market,cot:groupReading(m.groupComparison),history:m.history.map(h=>({sourceId:h.id,text:historicalReading(h)}))})),
  limitation:'Displaypolicy für Quellenberichte; kein Nachweis besserer Modellinterpretation oder einer verifizierten Gesamtprognose.'};
}
