import {classifyMemoryCohort,summarizeMemoryCohort} from './aiResearchMemoryCohort';
import {memoryConflictEvidence,MEMORY_CLOSE_COMPARISON_POLICY,MEMORY_CLOSE_ABSOLUTE_TOLERANCE} from './aiResearchMemoryCloseComparison';
import {readCronAudit} from './aiResearchCronAudit';
import {readMemoryMaintenanceAudit} from './aiResearchMemoryMaintenanceLog';
import {Redis} from '@upstash/redis';
import {inspectResearchMemory} from './aiResearchMemoryService';
import {readMemoryRecord,memoryBounded,MEMORY_PREFIX} from './aiResearchMemoryStore';
import {readScenarioEpisode} from './aiResearchScenarioEpisodes';
import {completedDailyCutoff} from './aiResearchChartContext';
import {digest,object,finite,validDay,EVALUATION_POLICY,type MemoryForecast} from './aiResearchMemoryProtocol';
const stable=(v:unknown):unknown=>Array.isArray(v)?v.map(stable):v!==null&&typeof v==='object'?Object.fromEntries(Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,value])=>[k,stable(value)])):v;
const same=(a:unknown,b:unknown)=>digest(stable(a))===digest(stable(b));
const nyDay=(time:string)=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(time));const get=(k:string)=>parts.find(p=>p.type===k)!.value;return get('year')+'-'+get('month')+'-'+get('day');};
async function ledger(market:'NASDAQ'|'RUSSELL_2000',at:string){
 const redis=Redis.fromEnv(),key=MEMORY_PREFIX+':bars:'+market;
 const dates=await memoryBounded(redis.zrange<string[]>(key,0,11,{rev:true}));
 if(dates.some(d=>!validDay(d)))return {market,status:'INVALID_INDEX_DATES',newestObservedCloseDate:null,recent:[],issue:'Ungültiges Datumsformat im Kursindex. Keine Reparatur ausgelöst.'};
 if(!dates.length)return {market,status:'EMPTY',newestObservedCloseDate:null,recent:[],issue:'Kein Kurs im Prüfgedächtnis gespeichert; keine Aussage über den separaten Marktverlauf.'};
 const keys=dates.map(d=>MEMORY_PREFIX+':bar:'+market+':'+d);
 const [bars,flags,comparisons]=await Promise.all([memoryBounded(redis.mget<unknown[]>(...keys)),memoryBounded(redis.mget<unknown[]>(...keys.map(k=>k+':conflict'))),memoryBounded(redis.mget<unknown[]>(...keys.map(k=>k+':comparison:latest')))]);
 const recent=dates.map((date,i)=>{const b=object(bars[i]);const flag=object(flags[i]);const resolved=flag.status==='RESOLVED_WITHIN_ROUNDED_CENT';const valid=b.market===market&&b.date===date&&finite(b.close)&&b.close>0&&typeof b.observedAt==='string'&&Number.isFinite(Date.parse(b.observedAt))&&Date.parse(b.observedAt)>=Date.parse(date+'T00:00:00Z')&&Date.parse(b.observedAt)<=Date.parse(at);return {date,close:finite(b.close)?b.close:null,firstObservedAt:b.observedAt??null,source:b.source??null,conflict:!resolved&&(!!flags[i]||b.conflict===true),conflictResolved:resolved,conflictEvidence:memoryConflictEvidence(flags[i]),latestComparison:comparisons[i]??null,status:valid?'OBSERVED':'MISSING_OR_INVALID_ROW'};});
 return {market,comparisonPolicy:MEMORY_CLOSE_COMPARISON_POLICY,absoluteTolerance:MEMORY_CLOSE_ABSOLUTE_TOLERANCE,resolvedPriorConflictCount:recent.filter(r=>r.conflictResolved).length,status:recent.some(r=>r.status!=='OBSERVED'||r.conflict)?'REVIEW_REQUIRED':'OBSERVATIONS_PRESENT',newestObservedCloseDate:recent.find(r=>r.status==='OBSERVED')?.date??null,recent,issue:null};
}
export async function inspectMemoryAudit(recordOffset=0,forecastOffset=0){
 if(![recordOffset,forecastOffset].every(n=>Number.isInteger(n)&&n>=0&&n<=100000))throw Error('MEMORY_AUDIT_PAGE');
 const evaluatedAt=new Date().toISOString(),cutoff=completedDailyCutoff(new Date(evaluatedAt));
 const priorUtcDay=new Date(Date.parse(evaluatedAt.slice(0,10)+'T00:00:00Z')-86400000).toISOString().slice(0,10);
 const evaluationAvailabilityCutoff=cutoff<priorUtcDay?cutoff:priorUtcDay;
 const results=await Promise.allSettled([inspectResearchMemory(recordOffset,forecastOffset),ledger('NASDAQ',evaluatedAt),ledger('RUSSELL_2000',evaluatedAt),readMemoryMaintenanceAudit(),readCronAudit()] as const);
 if(results[0].status==='rejected')throw Error('MEMORY_INSPECTION_UNAVAILABLE');
 const memory=results[0].value;
 const episodeCache=new Map<string,ReturnType<typeof readScenarioEpisode>>(),sourceCache=new Map<string,ReturnType<typeof readMemoryRecord>>();
 const episode=(id:string)=>{if(!episodeCache.has(id))episodeCache.set(id,readScenarioEpisode(id));return episodeCache.get(id)!;};
 const source=(id:string)=>{if(!sourceCache.has(id))sourceCache.set(id,readMemoryRecord(id));return sourceCache.get(id)!;};
 const forecasts=await Promise.all(memory.forecasts.map(async item=>{
  const plan=item.plan as MemoryForecast,issues:string[]=[];let sourceSnapshotTimestamp:string|null=null;let sourceCheck='UNAVAILABLE',scenarioCheck=plan.attribution==='AI_GENERATED'?'UNAVAILABLE':'NOT_AN_AI_SCENARIO';
  try{const r=await source(plan.sourceRecordId);if(!r)issues.push('SOURCE_RECORD_MISSING');else if(r.meta.id!==plan.sourceRecordId||!r.meta.eligibleForForecast)issues.push('SOURCE_RECORD_NOT_ELIGIBLE');else if(Date.parse(plan.createdAt)<Date.parse(r.meta.capturedAt))issues.push('FORECAST_PRECEDES_SOURCE_CAPTURE');else {sourceCheck='SOURCE_META_MATCHES';sourceSnapshotTimestamp=r.meta.snapshotTimestamp;}}catch{issues.push('SOURCE_RECORD_READ_FAILED');}
  if(plan.attribution==='AI_GENERATED')try{if(!plan.scenarioEpisodeId)issues.push('SCENARIO_ID_MISSING');else{const e=await episode(plan.scenarioEpisodeId),original=object(e?.original);if(!e)issues.push('SCENARIO_EPISODE_MISSING');else if(e.id!==plan.scenarioEpisodeId||e.sourceRecordId!==plan.sourceRecordId||digest(e.request?.body??null)!==e.id||e.status!=='UNVERIFIED_SCENARIOS_RECORDED'||e.validation?.ok!==true||e.validation?.modelBindingVerified!==true||original.ok!==true||original.inputId!==e.id||original.generatedAt!==plan.createdAt||e.issuedAt!==plan.createdAt||plan.modelRequestId!==e.id)issues.push('SCENARIO_PROVENANCE_MISMATCH');else{const saved=e.forecasts.find(p=>p.id===plan.id);if(!saved||!same(plan,saved))issues.push('FORECAST_DIFFERS_FROM_ORIGINAL_SCENARIO');else scenarioCheck='EXACT_ORIGINAL_FORECAST';}}}catch{issues.push('SCENARIO_EPISODE_READ_FAILED');}
  let issuedNyDay:string|null=null;try{issuedNyDay=nyDay(plan.createdAt);}catch{issues.push('INVALID_ISSUE_TIME');}
  const current=item.currentSourceAssessment;
  const storedMetricsChecks=item.storedAssessments.map((saved:any,i)=>{
   const horizon=plan.horizons[i],o=current?.outcomes[i];
   if(!saved)return {horizon,status:'NOT_STORED'};
   const stored=object(saved.original);let status='RECOMPUTE_UNAVAILABLE';
   if(stored.forecastId!==plan.id||stored.horizon!==horizon||stored.evaluationPolicy!==EVALUATION_POLICY)status='STORED_ASSESSMENT_FRAME_MISMATCH';
   else if(o?.status==='SOURCE_CONFLICT')status='SOURCE_CONFLICT';
   else if(o?.metrics&&stored.metrics)status=same(o.metrics,stored.metrics)?'MATCHES_RECOMPUTED_METRICS':'STORED_METRICS_MISMATCH';
   if(status==='STORED_ASSESSMENT_FRAME_MISMATCH'||status==='STORED_METRICS_MISMATCH')issues.push(status+'_'+horizon);
   return {horizon,status};
  });
  const timing=!current?'ASSESSMENT_UNAVAILABLE':current.outcomes.some(o=>o.status==='SOURCE_CONFLICT'||o.status==='INVALID_NUMERIC_PATH')?'SOURCE_REVIEW_REQUIRED':current.outcomes.every(o=>o.status==='WAITING_FOR_FUTURE_ANCHOR')?(issuedNyDay&&evaluationAvailabilityCutoff<=issuedNyDay?'FUTURE_CLOSE_NOT_EXPECTED_YET':'NO_ELIGIBLE_ANCHOR_OBSERVED'):current.outcomes.some(o=>o.status==='MATURED_OBSERVED')?'ONE_OR_MORE_OBSERVED_HORIZONS_MATURED':'WAITING_FOR_MORE_OBSERVED_INTERVALS';
  const evaluationCohort=classifyMemoryCohort(plan,current,{issues,sourceCheck,scenarioCheck,sourceSnapshotTimestamp},evaluatedAt);
  return {...item,evaluationCohort,audit:{sourceCheck,scenarioCheck,sourceSnapshotTimestamp,issues,issuedNyDay,completedCloseCutoff:cutoff,evaluationAvailabilityCutoff,timing,storedEvaluationCount:item.storedAssessments.filter(Boolean).length,storedMetricsChecks,forecastChanged:false}};
 }));
 const ledgers=results.slice(1,3).map((r,i)=>r.status==='fulfilled'?r.value:{market:i?'RUSSELL_2000':'NASDAQ',status:'READ_FAILED',recent:[],issue:'Kursprotokoll nicht lesbar; kein Abruf oder Schreibvorgang ausgelöst.'});
 const auditSummary={forecastsOnPage:forecasts.length,forecastsWithIntegrityNotes:forecasts.filter(f=>f.audit.issues.length).length,assessmentsUnavailable:forecasts.filter(f=>!f.currentSourceAssessment).length,storedHorizonResults:forecasts.reduce((n,f)=>n+f.audit.storedEvaluationCount,0)};
 const maintenanceAudit=results[3].status==='fulfilled'?results[3].value:{status:'READ_FAILED',latest:null,readOnly:true,modelRequestsUsed:0,memoryWritten:false,meaning:'Wartungsdiagnose derzeit nicht lesbar; kein Wartungsaufruf ausgelöst.'};
 const cronAudit=results[4].status==='fulfilled'?results[4].value:{status:'READ_FAILED',latest:null,readOnly:true,modelRequestsUsed:0,memoryWritten:false};
 return {ok:true,evaluationCohortSummary:summarizeMemoryCohort(forecasts),auditSummary,maintenanceAudit,cronAudit,version:'RESEARCH_MEMORY_AUDIT_V1',readOnly:true,modelRequestsUsed:0,memoryWritten:false,externalProviderRequests:0,maintenanceTriggered:false,evaluatedAt,completedCloseCutoff:cutoff,evaluationAvailabilityCutoff,page:memory.page,records:memory.records,forecasts,ledgers,cronExecutionVerified:false,cronEvidence:'Diese Leseprüfung zeigt gespeicherte Erstbeobachtungen. Ein alter Kurszeitpunkt belegt nicht den letzten Cronlauf; storeMemoryBars überschreibt Erstbeobachtungen absichtlich nicht. cronAudit zeigt den letzten dauerhaft protokollierten autorisierten Routenaufruf. Er beweist allein nicht, ob dieser geplant oder manuell gestartet wurde.',policy:'Erster beobachteter Schlusskurs NACH dem New-York-Ausgabetag, dann 5/10/20 beobachtete Schlusskursintervalle; primär20. Kein Startkurs am Ausgabetag, keine erfundenen Börsensitzungen.',limits:'Keine Wartung, Kursabfrage, Reparatur, neue KI oder automatische Lernnutzung. Zehn Prognosen und20Quellenmetadaten je Seite; Kursansicht zeigt höchstens12letzte gespeicherte Tage pro Index. SOURCE_META_MATCHES ist keine neue vollständige fachliche Quellenprüfung. Richtungsänderungen sind keine Optionsrendite; überlappende Horizonte und wiederholte Rahmen sind keine unabhängigen Fälle. Keine gepoolte Trefferquote.'};
}

