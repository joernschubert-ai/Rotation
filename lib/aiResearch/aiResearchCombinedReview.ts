import {reviewScenarioArguments} from './aiResearchArgumentReview';
import {loadScenarioContext,readScenarioContext,validateScenarioContext} from './aiResearchScenarioContext';
import {prepareEffectLab,readArgumentEffects,validateEffectLab} from './aiResearchArgumentEffectLab';
import {contextSelectionCoverage} from './aiResearchContextCoverage';
import {digest,object} from './aiResearchMemoryProtocol';

/** Read-only join by exact immutable base frame. No run/save/repair functions are called. */
export async function readCombinedReview(baseId:string){
 const context=await loadScenarioContext(baseId),effects=prepareEffectLab(context);
 const responses=await Promise.allSettled([readScenarioContext(context,context.request.id,context.base.factsHash),readArgumentEffects(effects,effects.request.id,effects.base.factsHash)]);
 const bind=(index:number,expectedId:string,kind:'CONTEXT'|'EFFECTS')=>{
  const response=responses[index];if(response.status==='rejected')return {status:'READ_FAILED',issue:'Archiv konnte nicht gelesen werden.',episode:null,view:null};
  const episode=object(response.value).episode;if(!episode)return {status:'ARCHIVE_MISSING',issue:'Kein bestätigtes Archiv für diesen exakten Auftrag. Keine Ersatzgenerierung.',episode:null,view:null};
  if(episode.id!==expectedId||episode.baseEpisodeId!==context.base.id||episode.factsHash!==context.base.factsHash||episode.sourceSnapshot!==context.base.sourceSnapshot||digest(episode.request?.body??null)!==expectedId||episode.provenance!=='MATCHED_MODEL_REQUEST'||episode.original?.inputId!==expectedId||episode.original?.snapshotTimestamp!==context.base.sourceSnapshot||digest(episode.appStatements??null)!==digest(context.appStatements))return {status:'FRAME_MISMATCH',issue:'Archiv passt nicht vollständig zum angefragten Basisrahmen.',episode,view:null};
  if(kind==='EFFECTS'&&digest(episode.effectCatalog??null)!==digest(effects.effects.effects))return {status:'CATALOG_MISMATCH',issue:'Gespeicherter und vorbereiteter Facettenkatalog stimmen nicht überein.',episode,view:null};
  let raw:unknown;try{raw=JSON.parse(episode.original.answerText);}catch{return {status:'INVALID_ORIGINAL',issue:'Originalantwort enthält keine lesbare Auswahl.',episode,view:null};}
  const validation=kind==='CONTEXT'?validateScenarioContext(context,raw):validateEffectLab(effects,raw);
  if(!validation.ok||episode.validation?.ok!==true)return {status:'INVALID_SELECTION',issue:'Archivierte Auswahl besteht die passende Quellenprüfung nicht.',episode,view:null};
  return {status:'AVAILABLE',issue:null,episode,view:validation.view};
 };
 const contextPart=bind(0,context.request.id,'CONTEXT'),effectPart=bind(1,effects.request.id,'EFFECTS');
 const markets=context.links.catalog.map(c=>{
  const contextRow=contextPart.view?.find((r:any)=>r.market===c.market),effectRow=effectPart.view?.find((r:any)=>r.market===c.market);
  const chosen=effectRow?.effects??[];
  const gaps:string[]=[];
  if(!contextRow)gaps.push('V2-Kontextauswahl fehlt oder ist nicht gültig gebunden.');
  if(!effectRow)gaps.push('Facettenauswahl fehlt oder ist nicht gültig gebunden.');
  if(contextRow?.unresolved||effectRow?.unresolved)gaps.push('Mindestens eine Modellantwort lässt die Abwägung ausdrücklich offen.');
  if(effectRow&&!chosen.some((e:any)=>e.relation==='OPPOSITE_DIRECTION_CONTEXT'))gaps.push('Keine entgegengesetzte Richtungsfacette gewählt. Das belegt keine vollständige Gegenargumentprüfung.');
  if(effectRow&&!chosen.some((e:any)=>e.facet==='POSITIONING_CONTEXT'))gaps.push('Keine COT-Facette gewählt. Die separate V2-Kontextwahl und die festen COT-Fakten bleiben daneben sichtbar.');
  return {market:c.market,baseDirection:c.baseDirection,contextSelection:contextRow??null,effectSelection:effectRow??null,gaps,independentVotes:false};
 });
 return {ok:contextPart.status==='AVAILABLE'&&effectPart.status==='AVAILABLE',version:'COMBINED_REVIEW_V1',readOnly:true,modelRequestsUsed:0,memoryWritten:false,baseEpisodeId:context.base.id,factsHash:context.base.factsHash,sourceSnapshot:context.base.sourceSnapshot,contextRequestId:context.request.id,effectRequestId:effects.request.id,parts:{context:contextPart,effects:effectPart},markets,appStatements:context.appStatements,argumentReview:reviewScenarioArguments(context.links),selectionCoverage:contextSelectionCoverage(context.links,contextPart.view),originalV5Changed:false,acceptedV2Changed:false,forecastsChanged:false,newForecasts:0,limits:'Nur gemeinsame Anzeige zweier getrennt erzeugter Auswahlen auf identischem Basisrahmen. Kein Nachweis einer gemeinsamen Modellabwägung, keine automatische Synthese, Stimmenzählung, Prognosekorrektur oder Handelsfreigabe. Fehlende Ergebnisse werden nicht ersetzt.'};
}

