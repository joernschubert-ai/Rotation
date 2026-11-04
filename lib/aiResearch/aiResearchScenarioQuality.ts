import {readScenarioEpisode,listScenarioEpisodes} from './aiResearchScenarioEpisodes';
import {readMemoryRecord} from './aiResearchMemoryStore';
import {prepareScenarioContract} from './aiResearchScenarioContract';
import {digest,object} from './aiResearchMemoryProtocol';
import {reviewScenarioMeaning} from './aiResearchScenarioMeaning';
/** Stored originals only, no prepare/run/save model functions. No repairs or reclassification. */
export async function inspectScenarioQuality(episodeId:string|null=null,offset=0){
 if(episodeId!==null&&!/^[a-f0-9]{64}$/.test(episodeId))throw Error('SCENARIO_QUALITY_ID');
 if(!Number.isInteger(offset)||offset<0||offset>100000)throw Error('SCENARIO_QUALITY_PAGE');
 const listed=episodeId?[]:await listScenarioEpisodes(offset);
 const candidates=episodeId?[episodeId]:listed.map(object).filter(m=>m.status==='UNVERIFIED_SCENARIOS_RECORDED'&&typeof m.id==='string').slice(0,3).map(m=>m.id as string);
 const reviews=[];
 for(const id of candidates){try{
  const e=await readScenarioEpisode(id);if(!e)throw Error('EPISODE_MISSING');
  const entry=await readMemoryRecord(e.sourceRecordId);if(!entry)throw Error('SOURCE_MISSING');
  if(e.id!==id||digest(e.request.body)!==id||entry.meta.id!==e.sourceRecordId||e.factsHash!==entry.meta.factsHash||e.sourceSnapshot!==entry.meta.snapshotTimestamp)throw Error('SOURCE_FRAME');
  const context=prepareScenarioContract(entry);
  reviews.push({episodeId:id,sourceRecordId:e.sourceRecordId,factsHash:e.factsHash,sourceSnapshot:e.sourceSnapshot,issuedAt:e.issuedAt,originalArchiveStatus:e.status,originalScenarios:e.scenarios,review:reviewScenarioMeaning(e.scenarios,context.usableSources,context.sourceSnapshot)});
 }catch{reviews.push({episodeId:id,status:'REVIEW_UNAVAILABLE',message:'Original und Quellenrahmen konnten nicht vollständig gebunden gelesen werden. Keine Ersatzdaten, Reparatur oder Modellanfrage.'});}}
 return {ok:reviews.every(r=>!('status' in r)),version:'SCENARIO_QUALITY_READ_V1',readOnly:true,modelRequestsUsed:0,memoryWritten:false,externalProviderRequests:0,originalChanged:false,forecastsChanged:false,offset,listedEpisodes:listed,reviewedLimit:3,reviews,semanticTruthVerified:false,predictiveQualityVerified:false,limits:'Bis zu drei archivierte gültige Szenarioepisoden der aktuellen Archivseite werden getrennt nach ihrem eigenen Quellenstand geprüft, nicht nach heutigen Marktdaten. Einzelabruf über episodeId möglich. Originalstatus und Prognosen werden nicht umbewertet oder ersetzt. Keine Trefferquote, vollständige Bedeutungsprüfung oder Prognosefreigabe.'};
}
