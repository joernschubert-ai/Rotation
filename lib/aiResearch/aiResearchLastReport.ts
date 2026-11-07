import {listMemoryRecords,readMemoryRecord} from './aiResearchMemoryStore';
import {unpackMemoryRecord} from './aiResearchMemoryProtocol';
import {recheckSourceReview,sourceFactsHash} from './aiResearchSourceReview';
import type {AIResearchResult,AIResearchTask} from './aiResearchTypes';
/** Existing immutable archive only. No history refresh, providers, model calls or writes. */
export async function readLastDisplayedResearch(task:AIResearchTask){
 const now=Date.now(),rows=await listMemoryRecords(0);
 const candidates=(rows as Array<any>).filter(m=>m&&m.kind==='SOURCE_SELECTION'&&m.task===task&&m.eligibleForForecast===true&&
  typeof m.id==='string'&&/^[a-f0-9]{64}$/.test(m.id)&&Number.isFinite(Date.parse(m.modelGeneratedAt))&&Date.parse(m.modelGeneratedAt)<=now&&
  (!m.provenance||m.provenance.question==='')).sort((a,b)=>Date.parse(b.modelGeneratedAt)-Date.parse(a.modelGeneratedAt)).slice(0,4);
 for(const meta of candidates)try{
  const entry=await readMemoryRecord(meta.id);if(!entry||entry.meta.id!==meta.id||entry.meta.kind!=='SOURCE_SELECTION'||entry.meta.task!==task||!entry.meta.eligibleForForecast)continue;
  const result=unpackMemoryRecord(entry) as AIResearchResult,report=result.report,facts=report?.appFacts,synthesis=report?.aiSynthesis;
  if(result.status!=='SUCCESS'||!report||report.task!==task||!facts||!synthesis||synthesis.status!=='SUCCESS'||typeof synthesis.generatedAt!=='string'||!Number.isFinite(Date.parse(synthesis.generatedAt))||!synthesis.sourceReview||facts.snapshotTimestamp!==entry.meta.snapshotTimestamp||sourceFactsHash(facts)!==entry.meta.factsHash||
   synthesis.snapshotTimestamp!==facts.snapshotTimestamp||synthesis.generatedAt!==entry.meta.modelGeneratedAt||report.decisionSupport?.snapshotTimestamp!==facts.snapshotTimestamp||
   !Number.isFinite(Date.parse(facts.snapshotTimestamp))||Date.parse(facts.snapshotTimestamp)>Date.parse(synthesis.generatedAt)||Date.parse(synthesis.generatedAt)>now||
   entry.meta.provenance&&entry.meta.provenance.question!=='')continue;
  const review=recheckSourceReview(synthesis.sourceReview,facts);if(!review||review.status!=='VALID_SELECTION')continue;
  // Unpacking returns a fresh object; the original archived record is never modified.
  synthesis.sourceReview=review;synthesis.modelRequestsUsed=0;synthesis.cached=true;
  return {ok:true,...result,modelRequestsUsed:0,memoryWritten:false,externalProviderRequests:0,
   storedDisplay:{version:'LAST_AVAILABLE_RESEARCH_V1',archived:true,recordId:entry.meta.id,snapshotTimestamp:facts.snapshotTimestamp,
    scope:'LATEST_20_METADATA_UP_TO_4_VALIDATED_REPORTS',message:'Letzter verfÃƒÂ¼gbarer geprÃƒÂ¼fter Archivbericht. UnverÃƒÂ¤nderter Datenstand; keine neue MarktprÃƒÂ¼fung oder Einstiegsaussage.'}};
 }catch{/* A damaged/unreadable candidate does not replace another valid archived report. */}
 return {ok:false,status:'INSUFFICIENT_DATA',report:null,modelRequestsUsed:0,memoryWritten:false,externalProviderRequests:0,
  message:'Auf der jÃƒÂ¼ngsten Archivseite kein lesbarer passender erfolgreicher KI-Bericht vorhanden. Kein Ersatzbericht erzeugt.'};
}
