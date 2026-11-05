import {listMemoryRecords} from './aiResearchMemoryStore';
import {listScenarioEpisodes} from './aiResearchScenarioEpisodes';
import {object} from './aiResearchMemoryProtocol';
const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export async function readWorkbenchIndex(recordOffset=0,scenarioOffset=0){
 if(![recordOffset,scenarioOffset].every(n=>Number.isInteger(n)&&n>=0&&n<=100000))throw Error('WORKBENCH_PAGE');
 const [records,scenarios]=await Promise.all([listMemoryRecords(recordOffset),listScenarioEpisodes(scenarioOffset)]);
 return {ok:true,version:'RESEARCH_WORKBENCH_INDEX_V1',readOnly:true,modelRequestsUsed:0,memoryWritten:false,recordOffset,scenarioOffset,recordPageSize:20,scenarioPageSize:20,recordsScanned:records.length,scenariosScanned:scenarios.length,records:records.map(object).filter(r=>id(r.id)&&id(r.factsHash)&&r.eligibleForForecast===true&&['SOURCE_SELECTION','FACTS_ONLY'].includes(r.kind)&&typeof r.snapshotTimestamp==='string'&&Number.isFinite(Date.parse(r.snapshotTimestamp))).map(r=>({id:r.id,factsHash:r.factsHash,snapshotTimestamp:r.snapshotTimestamp,capturedAt:r.capturedAt??null,kind:r.kind})),scenarios:scenarios.map(object).filter(s=>id(s.id)&&id(s.sourceRecordId)).map(s=>({id:s.id,sourceRecordId:s.sourceRecordId,sourceSnapshot:s.sourceSnapshot,issuedAt:s.issuedAt??null,status:s.status})),scope:'Nur Archivverzeichnisse. Quelle und Szenario ausdrücklich auswählen; keine jüngste Antwort als Standard. Vollständige Quellenbindung erfolgt durch die bestehenden Auftrags-/Lesewege.'};
}
