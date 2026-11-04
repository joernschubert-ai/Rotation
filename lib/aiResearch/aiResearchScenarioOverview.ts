import {loadScenarioContext} from './aiResearchScenarioContext';
import {readCombinedReviewV2} from './aiResearchCombinedReviewV2';
import {buildScenarioNarrative} from './aiResearchScenarioNarrative';
/** Reuses the existing exact-frame/provenance/catalogue/view guards. No inference or writes. */
export async function readScenarioOverview(baseId:string){
 if(typeof baseId!=='string'||!/^[a-f0-9]{64}$/.test(baseId))throw Error('SCENARIO_OVERVIEW_ID');
 const [context,combined]=await Promise.all([loadScenarioContext(baseId),readCombinedReviewV2(baseId)]);
 if(combined.baseEpisodeId!==context.base.id||combined.factsHash!==context.base.factsHash||combined.sourceSnapshot!==context.base.sourceSnapshot)throw Error('SCENARIO_OVERVIEW_FRAME');
 const part=combined.parts.weighing;
 const narrative=buildScenarioNarrative({baseEpisodeId:context.base.id,factsHash:context.base.factsHash,sourceSnapshot:context.base.sourceSnapshot,scenarioIssuedAt:context.base.issuedAt,scenarios:context.base.scenarios,facts:context.prepared.p.context.facts.facts,weighing:{status:part.status,requestId:part.expectedId,issuedAt:part.status==='AVAILABLE'?part.episode.issuedAt:null,view:part.status==='AVAILABLE'?part.view:null},archiveStates:Object.fromEntries(Object.entries(combined.parts).map(([k,v])=>[k,v.status]))});
 return {ok:true,status:part.status==='AVAILABLE'?'BOUND_WEIGHING_AVAILABLE':'FACTS_WITHOUT_BOUND_WEIGHING',...narrative,version:'SCENARIO_OVERVIEW_READ_V1',narrativeVersion:narrative.version,externalProviderRequests:0,originalArchiveStatus:context.base.status,originalScenarioRequestId:context.base.id,weighingIssue:part.issue,scope:'Vorhandene Quellen-/Frame-Prüfungen unverändert wiederverwendet. Fehlende frühere Kontext-/Facettenarchive werden als eigener Status angezeigt und nicht als Voraussetzung für vorhandene gültige V4-Abwägung ausgegeben.'};
}
