import {buildScenarioEvidenceFrame,scenarioMeaningInstruction,reviewScenarioMeaning} from './aiResearchScenarioMeaning';
import {randomBytes} from 'node:crypto';
import {Redis} from '@upstash/redis';
import {freezeRequest,saveFrozenRequest,runFullComparison} from './aiResearchComparison';
import {prepareScenarioContract} from './aiResearchScenarioContract';
import {memoryBounded} from './aiResearchMemoryStore';
import {object,type makeMemoryRecord} from './aiResearchMemoryProtocol';
import {makeScenarioEpisode,readScenarioEpisode,claimScenarioRequest,releaseUnstartedScenario,storeScenarioEpisode,listScenarioEpisodes} from './aiResearchScenarioEpisodes';
type Entry=ReturnType<typeof makeMemoryRecord>;
const ids={type:'array',maxItems:500,items:{type:'string'}};
export const SCENARIO_RESPONSE_FORMAT={type:'json_schema' as const,json_schema:{name:'rotation_index_scenarios_v2',strict:true as const,schema:{type:'object',additionalProperties:false,required:['version','sourceRecordId','factsHash','scenarios'],properties:{version:{type:'string',enum:['INDEX_SCENARIOS_V2']},sourceRecordId:{type:'string'},factsHash:{type:'string'},scenarios:{type:'array',minItems:2,maxItems:2,items:{type:'object',additionalProperties:false,required:['market','direction','primaryHorizon','reason','counterargument','supports','opposes','contextSources','monitorConditionId'],properties:{market:{type:'string',enum:['NASDAQ','RUSSELL_2000']},direction:{type:'string',enum:['UP','DOWN','ABSTAIN']},primaryHorizon:{type:'integer',enum:[20]},reason:{type:'string',minLength:20,maxLength:1200},counterargument:{type:'string',minLength:20,maxLength:1200},supports:ids,opposes:ids,contextSources:{type:'array',maxItems:8,items:{type:'string'}},monitorConditionId:{type:['string','null']}}}}}}}};
export function prepareScenarioModel(entry:Entry){
 const {usableSources,...context}=prepareScenarioContract(entry);
 const meaningFrame=buildScenarioEvidenceFrame(usableSources,context.sourceSnapshot);
 const meaningInstruction=scenarioMeaningInstruction(meaningFrame);
 const system=context.system+meaningInstruction+'\nAUSGABEBUDGET: reason und counterargument jeweils ein knapper Satz, Ziel 80–180 Zeichen. Keine langen Zahlenlisten, Vorrede oder Codezäune. Vollständiges JSON für beide Indizes hat Vorrang.';
 const responseFormat=structuredClone(SCENARIO_RESPONSE_FORMAT);
 const schema=responseFormat.json_schema.schema.properties;
 schema.sourceRecordId={type:'string',enum:[context.sourceRecordId]} as any;schema.factsHash={type:'string',enum:[context.factsHash]} as any;
 const properties=schema.scenarios.items.properties;
 properties.contextSources.items={type:'string',enum:context.compactInput.contextIds.length?context.compactInput.contextIds:['__NO_CONTEXT_SOURCES__']} as any;
 const ownIds=[...new Set(context.compactInput.directionalPermissions.flatMap(r=>[...r.either,...r.supports,...r.opposes]))].filter(id=>usableSources.some(f=>f.id===id&&f.market!=='SHARED'));
 properties.supports.items={type:'string',enum:ownIds.length?ownIds:['__NO_DIRECTIONAL_SOURCES__']} as any;properties.opposes.items=structuredClone(properties.supports.items);
 properties.monitorConditionId={type:['string','null'],enum:[null,...context.compactInput.openConditionIds]} as any;
 properties.supports.maxItems=ownIds.length;properties.opposes.maxItems=ownIds.length;
 const fieldOrder=['market','direction','primaryHorizon','supports','opposes','contextSources','monitorConditionId','reason','counterargument'];
 schema.scenarios.items.properties=Object.fromEntries(fieldOrder.map(key=>[key,(properties as any)[key]])) as typeof properties;
 schema.scenarios.items.required=fieldOrder;
 const request=freezeRequest(context.sourceSnapshot,system,context.user,.7,2200,responseFormat);
 return {entry,request,meaningSources:usableSources,preview:{...context,system,meaningFrame,meaningInstructionCharacters:meaningInstruction.length,version:'SCENARIO_MODEL_LAB_V6',outputContract:'INDEX_SCENARIOS_V2',requestHash:request.id,inputId:request.id,dataContractHash:context.requestHash,modelInput:request.body.messages,responseFormat,transportReady:true,transportNote:'Getrennter Gemma-Aufruf angebunden; nur ausdrücklicher Start mit bestehendem Tageslimit, Cache und unveränderlichem Archiv.',contextReferencePolicy:'CANONICAL_OBSERVATION_REFERENCES_V4',patternAuditPolicy:'SCENARIO_PATTERN_AUDIT_V1',referenceBindingPolicy:'SCENARIO_REFERENCE_AUDIT_V1',selectionBeforeTextRequested:true,
  controls:{model:'@cf/google/gemma-4-26b-a4b-it',maxNewModelRequests:1,automaticCalls:false,sharedDailyLimit:20,cooldownSeconds:90,timeoutMs:45000,automaticRetry:false,sourceFactsAreArchived:true,normalReportChanged:false},
  sourceNote:'Dieser getrennte Versuch verwendet genau den angezeigten archivierten Faktenstand, keine aktuellen nachgeladenen Marktdaten. Ausgabezeit und Bewertungsanker stammen vom neuen Modellaufruf, nicht vom Datum des alten Quellberichts.'}};
}
type Prepared=ReturnType<typeof prepareScenarioModel>;
function check(p:Prepared,inputId:unknown,factsHash:unknown){if(inputId!==p.request.id||factsHash!==p.entry.meta.factsHash)throw Error('SCENARIO_PREVIEW_CHANGED');}
async function cachedOriginal(p:Prepared){return memoryBounded(Redis.fromEnv().get<Record<string,unknown>>('rotation:research:cf:v1:full-comparison:v1:result:'+p.request.id+':gemma'));}
function quality(p:Prepared,episode:NonNullable<Awaited<ReturnType<typeof readScenarioEpisode>>>){try{return reviewScenarioMeaning(episode.scenarios,p.meaningSources,p.preview.sourceSnapshot);}catch{return {status:'REVIEW_UNAVAILABLE',findings:[],scope:'Bedeutungsprüfung nicht verfügbar. Original und Archivstatus unverändert.',semanticTruthVerified:false,forecastChanged:false};}}
function storedResult(p:Prepared,episode:Awaited<ReturnType<typeof readScenarioEpisode>>,newCalls:number,extra:Record<string,unknown>={}){return {argumentQuality:episode?quality(p,episode):null,ok:episode?.status==='UNVERIFIED_SCENARIOS_RECORDED',version:'SCENARIO_MODEL_LAB_V6',status:episode?.status??'ARCHIVE_UNAVAILABLE',modelRequestsUsed:newCalls,productionChanged:false,semanticTruthVerified:false,predictiveQualityVerified:false,episode,...extra};}
export async function readScenarioModel(p:Prepared,inputId:unknown,factsHash:unknown){
 check(p,inputId,factsHash);const saved=await readScenarioEpisode(p.request.id);
 if(saved)return storedResult(p,saved,0,{readOnly:true,memoryWritten:false,archiveConfirmed:true});
 const cached=await cachedOriginal(p);
 return {ok:false,version:'SCENARIO_MODEL_LAB_V6',status:cached?'CACHED_RESPONSE_ARCHIVE_NOT_CONFIRMED':'NO_STORED_EPISODE',modelRequestsUsed:0,readOnly:true,memoryWritten:false,archiveConfirmed:false,original:cached??null,message:cached?'Antwort im Aufrufcache vorhanden. „Einmal erzeugen und protokollieren“ kann sie ohne neuen Modellaufruf übernehmen.':'Kein gespeichertes Szenario verfügbar. Keine Ersatzgenerierung gestartet.'};
}
async function archive(p:Prepared,original:unknown,newCalls:number){
 let episode:ReturnType<typeof makeScenarioEpisode>;try{episode=makeScenarioEpisode(p.entry,p.request,original,new Date().toISOString());}catch{return {ok:false,version:'SCENARIO_MODEL_LAB_V6',modelRequestsUsed:newCalls,status:'RESPONSE_DIAGNOSTIC_ARCHIVE_NOT_CONFIRMED',archiveConfirmed:false,memoryWritten:false,original,message:'Antwort vorhanden; lokale Vorbereitung der Ablage fehlgeschlagen. Keine erneute Modellanfrage starten.'};}
 try{const written=await storeScenarioEpisode(episode),stored=written?episode:await readScenarioEpisode(p.request.id);return storedResult(p,stored,newCalls,{archiveConfirmed:!!stored,memoryWritten:written});}
 catch{return storedResult(p,episode,newCalls,{archiveConfirmed:false,memoryWritten:false,message:'Modellantwort vorhanden, dauerhafte Ablage nicht bestätigt. Nur gespeichertes Ergebnis lesen; keinen Ersatzbericht starten. Die Originalantwort bleibt hier sichtbar.'});}
}
export async function runScenarioModel(p:Prepared,inputId:unknown,factsHash:unknown){
 check(p,inputId,factsHash);const saved=await readScenarioEpisode(p.request.id);
 if(saved)return storedResult(p,saved,0,{archiveConfirmed:true,memoryWritten:false,cached:true});
 // A permanent attempt marker prevents an interrupted invocation being silently replayed.
 const token=randomBytes(16).toString('hex'),claimed=await claimScenarioRequest(p.request.id,token);
 if(!claimed){const cached=await cachedOriginal(p);if(cached)return archive(p,cached,0);return {ok:false,version:'SCENARIO_MODEL_LAB_V6',status:'ATTEMPT_PENDING_OR_INTERRUPTED',modelRequestsUsed:0,memoryWritten:false,message:'Für diese exakte Eingabe wurde bereits ein Versuch vorgemerkt. Keine erneute Modellanfrage. Gespeichertes Ergebnis später lesen; bei dauerhaft fehlender Antwort Diagnose senden.'};}
 let invocationEntered=false;
 try{
  await saveFrozenRequest(Redis.fromEnv(),p.request,{updateLatest:false});invocationEntered=true;
  const original=object(await runFullComparison(p.request.id,'gemma'));
  if(original.modelRequestsUsed===0&&original.cached!==true){await releaseUnstartedScenario(p.request.id,token);return {...original,version:'SCENARIO_MODEL_LAB_V6',memoryWritten:false};}
  if(original.modelRequestsUsed!==1&&original.cached!==true)return {ok:false,version:'SCENARIO_MODEL_LAB_V6',modelRequestsUsed:null,status:'UNKNOWN_CALL_OUTCOME',memoryWritten:false,original,message:'Aufrufstatus unklar; keine automatische Wiederholung.'};
  return archive(p,original,original.cached===true?0:1);
 }catch{return {ok:false,version:'SCENARIO_MODEL_LAB_V6',modelRequestsUsed:invocationEntered?null:0,status:'ATTEMPT_INTERRUPTED',memoryWritten:false,message:'Vorgang unterbrochen. Keine automatische Wiederholung; gespeichertes Ergebnis lesen. Ein vorgemerkter Versuch wird nicht still zurückgesetzt.'};}
}
export async function scenarioArchivePage(offset=0){return {ok:true,version:'SCENARIO_MODEL_LAB_V6',readOnly:true,modelRequestsUsed:0,memoryWritten:false,offset,pageSize:20,episodes:await listScenarioEpisodes(offset),limits:'Auch ungültige Antworten, Providerdiagnosen und ABSTAIN bleiben erhalten. Keine Trefferquote oder Prognosefreigabe aus Vertragsprüfungen.'};}




