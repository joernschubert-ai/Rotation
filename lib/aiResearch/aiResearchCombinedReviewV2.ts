import {readCombinedReview} from './aiResearchCombinedReview';
import {loadScenarioContext} from './aiResearchScenarioContext';
import {prepareWeighingV4Lab,readWeighingV4,validateWeighingV4Lab} from './aiResearchWeighingV4Lab';
import {digest,object} from './aiResearchMemoryProtocol';

/** Optional third archive. Never replaces the accepted two-part view or starts inference. */
export async function readCombinedReviewV2(baseId:string){
 const responses=await Promise.allSettled([readCombinedReview(baseId),(async()=>{
  const context=await loadScenarioContext(baseId),prepared=prepareWeighingV4Lab(context);
  return {prepared,result:await readWeighingV4(prepared,prepared.request.id,prepared.base.factsHash)};
 })()]);
 if(responses[0].status==='rejected')throw Error('COMBINED_BASE_READ_UNAVAILABLE');
 const base=responses[0].value;
 const inspect=()=>{
  const part=responses[1];if(part.status==='rejected')return {status:'READ_FAILED',issue:'Optionale V4-Abwägung konnte nicht vorbereitet oder gelesen werden. Bisherige Ansicht bleibt verfügbar.',expectedId:null,episode:null,view:null};
  const {prepared:p,result}=part.value,e=object(result).episode;
  if(!e)return {status:'ARCHIVE_MISSING',issue:'Keine archivierte V4-Abwägung für diesen Auftrag. Keine Ersatzgenerierung.',expectedId:p.request.id,episode:null,view:null};
  const absent=(status:string,issue:string)=>({status,issue,expectedId:p.request.id,episode:e,view:null});
  if(base.baseEpisodeId!==p.base.id||base.factsHash!==p.base.factsHash||base.sourceSnapshot!==p.base.sourceSnapshot||e.version!=='CONTEXT_WEIGHING_LAB_V4'||e.id!==p.request.id||e.baseEpisodeId!==p.base.id||e.sourceRecordId!==p.entry.meta.id||e.factsHash!==p.base.factsHash||e.sourceSnapshot!==p.base.sourceSnapshot||digest(e.request?.body??null)!==p.request.id||e.provenance!=='MATCHED_MODEL_REQUEST'||e.original?.inputId!==p.request.id||e.original?.snapshotTimestamp!==p.base.sourceSnapshot||e.original?.generatedAt!==e.issuedAt||e.original?.ok!==true||e.original?.truncated===true||/length|max[_ -]?tokens|output[_ -]?limit/i.test(String(e.original?.finishReason))||e.newForecasts!==0)return absent('FRAME_OR_PROVENANCE_MISMATCH','V4-Original ist nicht vollständig an denselben Basis- und Datenstand gebunden.');
  if(digest(e.appStatements??null)!==digest(p.appStatements)||digest(e.effectCatalog??null)!==digest(p.effects.effects)||digest(e.weighingCatalog??null)!==digest(p.policy.catalog)||digest(e.decisionCatalog??null)!==digest(p.policy.decisions))return absent('CATALOG_MISMATCH','V4-Quellen- oder Entscheidungskatalog stimmt nicht mit dem Basisrahmen überein.');
  let raw:unknown;try{raw=JSON.parse(e.original.answerText);}catch{return absent('INVALID_ORIGINAL','V4-Original enthält keine lesbare Auswahl.');}
  const v=validateWeighingV4Lab(p,raw);if(!v.ok||e.validation?.ok!==true)return absent('INVALID_SELECTION','V4-Auswahl besteht die passende Prüfung nicht.');
  if(digest(e.view??null)!==digest(v.view))return absent('VIEW_MISMATCH','Gespeicherte und erneut berechnete V4-Darstellung stimmen nicht überein.');
  return {status:'AVAILABLE',issue:null,expectedId:p.request.id,episode:e,view:v.view};
 };
 const weighing=inspect();
 return {...base,version:'COMBINED_REVIEW_V2',baseViewVersion:base.version,parts:{...base.parts,weighing},weighingRequestId:weighing.expectedId,completeWithWeighing:base.ok&&weighing.status==='AVAILABLE',markets:base.markets.map(m=>({...m,weighingSelection:weighing.view?.find((r:any)=>r.market===m.market)??null,weighingGap:weighing.status==='AVAILABLE'?null:'Optionale V4-Abwägung nicht verfügbar. Die bisherigen Auswahlen bleiben unverändert.'})),readOnly:true,modelRequestsUsed:0,memoryWritten:false,originalV5Changed:false,acceptedV2Changed:false,forecastsChanged:false,newForecasts:0,limits:'Drei getrennte Modellaufträge auf demselben archivierten Faktenstand. Die V4-Abwägung wird als eigener Auftrag gezeigt, nicht als Reparatur früherer Antworten oder als neue Prognose. Auswahl-/Gewichtungsqualität ungeprüft. Fehlende V4-Ergebnisse blockieren die bisherige Zweiteilansicht nicht und werden nicht ersetzt.'};
}
