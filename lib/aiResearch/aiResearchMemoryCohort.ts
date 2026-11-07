/** Read-only grouping. Never changes stored forecasts, source bars or evaluation clocks. */
export const MEMORY_COHORT={
 version:'MEMORY_CLEAN_START_V1',
 id:'ISSUED_FROM_2026_11_07_BERLIN',
 startsAt:'2026-11-06T23:00:00.000Z',
 startsAtBerlin:'07.11.2026, 00:00 Uhr Europe/Berlin',
};
type Frame={createdAt?:unknown;attribution?:unknown;evaluationPolicy?:unknown};
type Assessment={version?:unknown;anchor?:{date?:unknown}|null;outcomes?:Array<{horizon?:unknown;status?:unknown}>}|null;
type Audit={issues:string[];sourceCheck:string;scenarioCheck:string;sourceSnapshotTimestamp:string|null};
const validTime=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
export function classifyMemoryCohort(plan:Frame,current:Assessment,audit:Audit,asOf:string){
 const start=Date.parse(MEMORY_COHORT.startsAt),now=Date.parse(asOf);
 const base={cohortId:MEMORY_COHORT.id,startsAt:MEMORY_COHORT.startsAt,forecastChanged:false,qualityVerified:false};
 if(!validTime(plan.createdAt)||!Number.isFinite(now))return {...base,group:'INVALID_ISSUE_TIME',reasons:['INVALID_ISSUE_TIME'],observedMatureHorizons:[] as number[]};
 const issue=Date.parse(plan.createdAt);
 if(issue<start)return {...base,group:'LEGACY_ARCHIVE',reasons:['ISSUED_BEFORE_FIXED_START'],observedMatureHorizons:[] as number[]};
 const reasons:string[]=[];
 if(issue>now)reasons.push('FUTURE_ISSUE_TIME');
 if(plan.attribution!=='AI_GENERATED')reasons.push('NOT_AI_GENERATED');
 if(plan.evaluationPolicy!=='FIRST_CLOSE_AFTER_ISSUE_NY_DAY_5_10_20_V1')reasons.push('EVALUATION_POLICY_MISMATCH');
 if(audit.issues.length)reasons.push('INTEGRITY_REVIEW_REQUIRED');
 if(audit.sourceCheck!=='SOURCE_META_MATCHES'||audit.scenarioCheck!=='EXACT_ORIGINAL_FORECAST')reasons.push('ORIGINAL_BINDING_NOT_VERIFIED');
 if(!validTime(audit.sourceSnapshotTimestamp)||Date.parse(audit.sourceSnapshotTimestamp)<start||Date.parse(audit.sourceSnapshotTimestamp)>issue)reasons.push('SOURCE_OUTSIDE_NEW_FRAME');
 if(!current||!Array.isArray(current.outcomes)||current.outcomes.length!==3||![5,10,20].every(h=>current.outcomes!.filter(o=>o.horizon===h).length===1))reasons.push('ASSESSMENT_UNAVAILABLE_OR_INVALID');
 else{
  if(current.version!==plan.evaluationPolicy)reasons.push('ASSESSMENT_POLICY_MISMATCH');
  if(current.outcomes.some(o=>!['MATURED_OBSERVED','WAITING_FOR_FUTURE_ANCHOR','WAITING_FOR_HORIZON'].includes(String(o.status))))reasons.push('SOURCE_OR_PATH_REVIEW_REQUIRED');
 }
 // Conflicted or unavailable new cases remain in the denominator shown on this page.
 // This is not a hit-rate denominator and never selects cases by direction or return.
 const horizons=reasons.length?[]:(current?.outcomes??[]).filter(o=>o.status==='MATURED_OBSERVED').map(o=>Number(o.horizon));
 return {...base,group:reasons.length?'NEW_GROUP_REVIEW_REQUIRED':horizons.length?'NEW_GROUP_OBSERVED':'NEW_GROUP_WAITING',reasons,observedMatureHorizons:horizons};
}
export function summarizeMemoryCohort(rows:Array<{evaluationCohort:ReturnType<typeof classifyMemoryCohort>}>){
 const count=(group:string)=>rows.filter(r=>r.evaluationCohort.group===group).length;
 return {...MEMORY_COHORT,scope:'CURRENT_PAGE_ONLY',forecastsOnPage:rows.length,
 legacyArchive:count('LEGACY_ARCHIVE'),invalidIssueTime:count('INVALID_ISSUE_TIME'),
 newGroupTotal:rows.filter(r=>r.evaluationCohort.group.startsWith('NEW_GROUP_')).length,
 waiting:count('NEW_GROUP_WAITING'),reviewRequired:count('NEW_GROUP_REVIEW_REQUIRED'),withObservedHorizon:count('NEW_GROUP_OBSERVED'),
 observedHorizonResults:rows.reduce((n,r)=>n+r.evaluationCohort.observedMatureHorizons.length,0),
 modelRequestsUsed:0,memoryWritten:false,activeRetrieval:false,hitRateCalculated:false,
 limits:'Nur diese Archivseite. Alte und blockierte neue Faelle bleiben sichtbar. Horizonte und wiederholte Ausgaben sind keine unabhaengigen Faelle. Keine Trefferquote, Optionsrendite oder aktive Lernnutzung. Feste Zeitgrenze verschiebt keine urspruengliche Prognoseuhr.'};
}

