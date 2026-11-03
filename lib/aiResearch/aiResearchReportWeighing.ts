import {reportSourceIdentityFields} from './aiResearchReportIdentity';
import {runAIResearchFromHistory} from './aiResearchRunner';
import {makeMemoryRecord,digest,object} from './aiResearchMemoryProtocol';
import {listScenarioEpisodes} from './aiResearchScenarioEpisodes';
import {readCombinedReviewV2} from './aiResearchCombinedReviewV2';

export type ReportWeighingExpected={snapshotTimestamp:string;factsHash:string;reportGeneratedAt:string;sourceIdentityHash:string;baseEpisodeId?:string};
export async function readNormalReportWeighing(expected?:ReportWeighingExpected){
 const result=await runAIResearchFromHistory({task:'DAILY_MARKET_REVIEW',allowAIGeneration:false});
 const report=result.report,facts=report?.appFacts,stamp=facts?.snapshotTimestamp;
 const finish=(status:string,message:string,extra:Record<string,unknown>={})=>({ok:status==='AVAILABLE',version:'REPORT_WEIGHING_LINK_V1',status,readOnly:true,modelRequestsUsed:0,memoryWritten:false,reportSnapshotTimestamp:stamp??null,reportGeneratedAt:report?.generatedAt??null,originalReportChanged:false,forecastsChanged:false,newForecasts:0,message,...extra});
 if(result.status!=='SUCCESS'||!report||!facts||!stamp||report.decisionSupport?.snapshotTimestamp!==stamp)return finish('REPORT_UNAVAILABLE','Kein passender eingefrorener normaler Bericht verfügbar. Keine Ersatzgenerierung.');
 const factsHash=digest(facts),sourceIdentityHash=digest(reportSourceIdentityFields(report));
 if(expected&&(expected.snapshotTimestamp!==stamp||expected.factsHash!==factsHash||expected.reportGeneratedAt!==report.generatedAt||expected.sourceIdentityHash!==sourceIdentityHash))return finish('REPORT_CHANGED','Der angezeigte Bericht stimmt nicht mehr mit dem gespeicherten Lesestand überein. Keine Abwägung zugemischt.',{factsHash});
 let identity:ReturnType<typeof makeMemoryRecord>['meta'];
 try{identity=makeMemoryRecord(result,'DAILY_MARKET_REVIEW',new Date().toISOString()).meta;}catch{return finish('REPORT_FRAME_INVALID','Berichtsrahmen konnte nicht exakt an das Researchgedächtnis gebunden werden.',{factsHash});}
 if(!identity.eligibleForForecast)return finish('REPORT_NOT_ELIGIBLE','Dieser Quellenbericht besitzt keinen geeigneten gespeicherten Szenariobezug.',{factsHash,sourceRecordId:identity.id});
 const reference={factsHash,sourceIdentityHash,sourceRecordId:identity.id};
 let candidates:Array<{id:string;sourceRecordId:string}> = [],scanned=0,scanComplete=false;
 if(expected?.baseEpisodeId){if(!/^[a-f0-9]{64}$/.test(expected.baseEpisodeId))return finish('INVALID_BASE_ID','Ungültiger Szenariobezug.',reference);candidates=[{id:expected.baseEpisodeId,sourceRecordId:identity.id}];}
 else{
  for(let offset=0;offset<100;offset+=20){const page=await listScenarioEpisodes(offset);scanned+=page.length;
   for(const raw of page){const m=object(raw);if(m.sourceRecordId===identity.id&&m.sourceSnapshot===stamp&&m.status==='UNVERIFIED_SCENARIOS_RECORDED'&&typeof m.id==='string'&&/^[a-f0-9]{64}$/.test(m.id)&&!candidates.some(c=>c.id===m.id))candidates.push({id:m.id,sourceRecordId:m.sourceRecordId});}
   if(page.length<20){scanComplete=true;break;}
  }
  if(!scanComplete)return finish('SEARCH_LIMIT_REACHED','Die begrenzte Archivrecherche ist nicht vollständig. Keine automatische Auswahl eines möglicherweise anderen Szenarios.',{...reference,scanned,candidates});
  if(!candidates.length)return finish('NO_MATCHING_SCENARIO','Zum exakt gleichen Quellenbericht ist kein geeigneter Szenariobezug gespeichert. Keine zusätzliche KI-Anfrage ausgelöst.',{...reference,scanned});
  if(candidates.length>1)return finish('MULTIPLE_MATCHING_SCENARIOS','Mehrere Szenarien gehören zu diesem Quellenbericht. Kein stiller Vorrang für die jüngste Antwort; einen Szenariobezug gezielt wählen.',{...reference,scanned,candidates});
 }
 const baseEpisodeId=candidates[0].id;
 let combined:Awaited<ReturnType<typeof readCombinedReviewV2>>;
 try{combined=await readCombinedReviewV2(baseEpisodeId);}catch{return finish('ARCHIVE_READ_FAILED','Passendes Szenario gefunden, Ergänzung derzeit nicht lesbar. Der normale Bericht bleibt unverändert.',{...reference,baseEpisodeId});}
 const part=combined.parts.weighing;
 if(combined.baseEpisodeId!==baseEpisodeId||combined.factsHash!==factsHash||combined.sourceSnapshot!==stamp)return finish('FRAME_MISMATCH','Archiv und normaler Bericht besitzen unterschiedliche Datenstände. Keine Übernahme.',{...reference,baseEpisodeId});
 if(part.status!=='AVAILABLE'||!part.episode||!part.view)return finish('NO_VALID_WEIGHING','Für diesen Quellenbericht liegt keine passend geprüfte V4-Abwägung vor. Keine Ersatzgenerierung.',{...reference,baseEpisodeId,weighingStatus:part.status});
 if(part.episode.sourceRecordId!==identity.id||part.episode.baseEpisodeId!==baseEpisodeId||part.episode.factsHash!==factsHash||part.episode.sourceSnapshot!==stamp)return finish('SOURCE_IDENTITY_MISMATCH','V4-Abwägung gehört nicht zum exakt gleichen Quellenbericht. Keine Übernahme.',{...reference,baseEpisodeId});
 return finish('AVAILABLE','Gespeicherte V4-Abwägung zum exakt gleichen Quellenbericht gelesen. Keine neue Analyse oder Prognose.',{...reference,baseEpisodeId,modelGeneratedAt:part.episode.issuedAt,weighingRequestId:part.episode.id,markets:part.view,appStatements:part.episode.appStatements,argumentReview:combined.argumentReview,modelOriginal:part.episode.original,limits:'Archivierter separater Modellauftrag, nicht die ursprüngliche Quellenwahl des normalen Berichts. Formal gültige Belege sind kein Nachweis guter Gewichtung, richtiger Prognosen oder einer Einstiegsfreigabe.'});
}
