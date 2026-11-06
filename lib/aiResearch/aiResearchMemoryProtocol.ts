import {equivalentMemoryCloses} from './aiResearchMemoryCloseComparison';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {prepareReportDomainContext} from './aiResearchReportDomainContext';
export const MEMORY_VERSION='RESEARCH_MEMORY_V1';
export const EVALUATION_POLICY='FIRST_CLOSE_AFTER_ISSUE_NY_DAY_5_10_20_V1';
export const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const object=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
export const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
export const validDay=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
export type MemoryMarket='NASDAQ'|'RUSSELL_2000';
export type MemoryBar={market:MemoryMarket;date:string;close:number;observedAt:string;source:string;conflict?:boolean};
export type MemoryForecast={id:string;sourceRecordId:string;createdAt:string;market:MemoryMarket;direction:'UP'|'DOWN';statement:string;counterargument:string;invalidation:{comparison:'>='|'<=';price:number}|null;attribution:'USER_REGISTERED'|'AI_GENERATED';evaluationPolicy:string;horizons:readonly number[];primaryHorizon?:20;scenarioEpisodeId?:string;modelRequestId?:string;monitorConditionId?:string|null};
export function makeMemoryRecord(result:unknown,task:string,capturedAt:string,provenance:Record<string,unknown>|null=null){
 const root=object(result),report=object(root.report),facts=object(report.appFacts),synthesis=object(report.aiSynthesis),review=object(synthesis.sourceReview);
 if(root.status!=='SUCCESS'||!Number.isFinite(Date.parse(capturedAt))||prepareReportDomainContext(report as any,facts.snapshotTimestamp).status!=='AVAILABLE'||Date.parse(facts.snapshotTimestamp)>Date.parse(capturedAt))throw Error('MEMORY_INVALID_REPORT_FRAME');
 const modelFrameMatches=!synthesis.snapshotTimestamp||synthesis.snapshotTimestamp===facts.snapshotTimestamp;
 const synthetic=root.synthetic===true||report.synthetic===true||!!root.evaluationCase||!!report.evaluationCase;
 const originalText=typeof review.originalText==='string'?review.originalText:typeof object(synthesis.quality).providerText==='string'?synthesis.quality.providerText:null;
 const factsHash=digest(facts),reviewMatches=review.snapshotTimestamp===facts.snapshotTimestamp&&review.factsHash===factsHash,modelTimeValid=typeof synthesis.generatedAt==='string'&&Number.isFinite(Date.parse(synthesis.generatedAt))&&Date.parse(synthesis.generatedAt)<=Date.parse(capturedAt);
 const kind=synthetic?'SYNTHETIC_DIAGNOSTIC':originalText===null?'FACTS_ONLY':review.status==='VALID_SELECTION'&&reviewMatches&&modelTimeValid&&modelFrameMatches?'SOURCE_SELECTION':'MODEL_DIAGNOSTIC';
 const rawHash=digest(originalText),model=typeof synthesis.model==='string'?synthesis.model:null;
 const id=digest({version:MEMORY_VERSION,synthetic,task,snapshot:facts.snapshotTimestamp,factsHash,model,modelGeneratedAt:synthesis.generatedAt??null,rawHash});
 const text=JSON.stringify(result);if(Buffer.byteLength(text)>4_000_000)throw Error('MEMORY_RECORD_TOO_LARGE');
 const payload=gzipSync(text).toString('base64');if(payload.length>900_000)throw Error('MEMORY_COMPRESSED_RECORD_TOO_LARGE');
 return {meta:{id,version:MEMORY_VERSION,kind,task,capturedAt,snapshotTimestamp:facts.snapshotTimestamp,factsHash,rawHash,model,modelGeneratedAt:synthesis.generatedAt??null,
  modelSnapshotTimestamp:synthesis.snapshotTimestamp??null,sourceReviewSnapshotTimestamp:review.snapshotTimestamp??null,sourceReviewVersion:review.version??null,sourceReviewStatus:review.status??null,provenance,repeatFrameGroup:digest({task,snapshot:facts.snapshotTimestamp,factsHash,model}),forecastInferred:false,approvedTrainingExample:false,eligibleForForecast:kind==='SOURCE_SELECTION'||kind==='FACTS_ONLY'},payload,payloadHash:digest(text)};
}
export function unpackMemoryRecord(entry:ReturnType<typeof makeMemoryRecord>){
 const text=gunzipSync(Buffer.from(entry.payload,'base64'),{maxOutputLength:4_000_000}).toString('utf8');
 if(digest(text)!==entry.payloadHash)throw Error('MEMORY_PAYLOAD_HASH_MISMATCH');return JSON.parse(text);
}
export function makeMemoryForecast(source:ReturnType<typeof makeMemoryRecord>['meta'],input:unknown,createdAt:string):MemoryForecast{
 const r=object(input),keys=['sourceRecordId','market','direction','statement','counterargument','invalidation'];
 if(Object.keys(r).length!==keys.length||!keys.every(k=>Object.hasOwn(r,k)))throw Error('FORECAST_EXACT_FIELDS_REQUIRED');
 if(!source.eligibleForForecast||!['SOURCE_SELECTION','FACTS_ONLY'].includes(source.kind)||r.sourceRecordId!==source.id||!Number.isFinite(Date.parse(createdAt))||Date.parse(createdAt)<Date.parse(source.capturedAt))throw Error('FORECAST_SOURCE_NOT_ELIGIBLE');
 if(!['NASDAQ','RUSSELL_2000'].includes(r.market)||!['UP','DOWN'].includes(r.direction)||typeof r.statement!=='string'||r.statement.trim().length<20||r.statement.length>1000||typeof r.counterargument!=='string'||r.counterargument.trim().length<20||r.counterargument.length>1000)throw Error('FORECAST_EXPLICIT_SPEC_REQUIRED');
 if(r.invalidation!==null){const x=object(r.invalidation);if(Object.keys(x).length!==2||!['>=','<='].includes(x.comparison)||!finite(x.price)||x.price<=0)throw Error('FORECAST_INVALID_INVALIDATION');}
 // Identity omits registration time: repeating the same specification cannot restart its clock.
 const identity={sourceRecordId:source.id,market:r.market,direction:r.direction,statement:r.statement,counterargument:r.counterargument,invalidation:r.invalidation===null?null:{comparison:r.invalidation.comparison,price:r.invalidation.price}};
 const id=digest({version:MEMORY_VERSION,...identity,evaluationPolicy:EVALUATION_POLICY});
 return {id,sourceRecordId:source.id,createdAt,market:r.market,direction:r.direction,statement:r.statement,counterargument:r.counterargument,invalidation:r.invalidation,attribution:'USER_REGISTERED',evaluationPolicy:EVALUATION_POLICY,horizons:[5,10,20]};
}
export function evaluateMemoryForecast(plan:MemoryForecast,bars:MemoryBar[],evaluatedAt:string){
 const at=Date.parse(evaluatedAt),issued=Date.parse(plan.createdAt);if(!Number.isFinite(at)||!Number.isFinite(issued)||at<issued)throw Error('MEMORY_EVALUATION_TIME');
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(issued));const part=(k:string)=>parts.find(p=>p.type===k)!.value;const issuedDay=`${part('year')}-${part('month')}-${part('day')}`;
 const grouped=new Map<string,MemoryBar[]>();
 for(const b of bars){if(b.market!==plan.market||!validDay(b.date)||!finite(b.close)||b.close<=0||!Number.isFinite(Date.parse(b.observedAt))||Date.parse(b.observedAt)>at||Date.parse(b.observedAt)<Date.parse(b.date+'T00:00:00Z'))continue;const available=Date.parse(b.date+'T00:00:00Z')+86400000;if(b.date<=issuedDay||available>at)continue;grouped.set(b.date,[...(grouped.get(b.date)??[]),b]);}
 const rows=[...grouped.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([day,values])=>({...values[0],date:day,conflict:values.some(v=>v.conflict)||!equivalentMemoryCloses(Math.min(...values.map(v=>v.close)),Math.max(...values.map(v=>v.close)))}));
 const anchor=rows[0]??null;
 return {version:EVALUATION_POLICY,forecastId:plan.id,evaluatedAt,attribution:plan.attribution,anchor:anchor?{date:anchor.date,close:anchor.close,observedAt:anchor.observedAt}:null,
  outcomes:plan.horizons.map(horizon=>{
   const path=rows.slice(0,horizon+1),end=path.length===horizon+1?path[horizon]:null;
   const base={horizon,unit:'OBSERVED_DAILY_CLOSE_INTERVALS',observedIntervals:Math.max(0,path.length-1)};
   if(path.some(b=>b.conflict))return {...base,status:'SOURCE_CONFLICT',metrics:null};
   if(!anchor||!end)return {...base,status:anchor?'WAITING_FOR_HORIZON':'WAITING_FOR_FUTURE_ANCHOR',metrics:null};
   const indexReturnPct=(end.close/anchor.close-1)*100,closeReturns=path.map(b=>(b.close/anchor.close-1)*100);
   if(!finite(indexReturnPct)||!closeReturns.every(finite))return {...base,status:'INVALID_NUMERIC_PATH',metrics:null};
   const invalidation=plan.invalidation?path.find(b=>plan.invalidation!.comparison==='>='?b.close>=plan.invalidation!.price:b.close<=plan.invalidation!.price):undefined;
   return {...base,status:'MATURED_OBSERVED',metrics:{endDate:end.date,indexReturnPct,alwaysUpComparisonReturnPct:indexReturnPct,directionAlignedIndexChangePct:plan.direction==='UP'?indexReturnPct:-indexReturnPct,
    directionalHit:plan.direction==='UP'?indexReturnPct>0:indexReturnPct<0,maxCloseReturnPct:Math.max(...closeReturns),minCloseReturnPct:Math.min(...closeReturns),invalidationFirstObservedAt:invalidation?.date??null,
    sourceDates:path.map(b=>b.date),anchorDelayCalendarDays:(Date.parse(anchor.date+'T00:00:00Z')-Date.parse(issuedDay+'T00:00:00Z'))/86400000}};
  }),limitations:['Observed closes are not verified exchange-calendar completeness or intraday prices. Missing sessions are not invented.','Baseline is the first observed close after the issue New York calendar day, evaluated no earlier than the next UTC day; it is not yesterday\'s actionable entry.','Index changes and direction-aligned changes are not option returns, execution P&L or validated predictive edge.','Invalidated cases remain in the record. Horizons and repeated same-frame cases overlap; no independent trials or calibrated probabilities inferred.']};
}

