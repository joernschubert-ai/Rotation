import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {readMemoryRecord,listMemoryRecords} from '@/lib/aiResearch/aiResearchMemoryStore';
import {validateScenarioAnswer} from '@/lib/aiResearch/aiResearchScenarioContract';
import {prepareScenarioModel,runScenarioModel,readScenarioModel,scenarioArchivePage} from '@/lib/aiResearch/aiResearchScenarioModel';
import {readScenarioEpisode} from '@/lib/aiResearch/aiResearchScenarioEpisodes';
import {researchScenarioPage} from '@/lib/aiResearch/aiResearchScenarioPage';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const json=(v:unknown,status=200)=>Response.json(v,{status,headers});
const exact=(b:Record<string,unknown>,keys:string[])=>Object.keys(b).length===keys.length&&keys.every(k=>Object.hasOwn(b,k));
export async function GET(request:Request){if(!researchAuthorized(request))return json({ok:false,modelRequestsUsed:0},401);return new Response(researchScenarioPage(),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});}
export async function POST(request:Request){
 if(!researchAuthorized(request))return json({ok:false,modelRequestsUsed:0},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false,modelRequestsUsed:0},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({ok:false,modelRequestsUsed:0},415);
 try{
  if(Number(request.headers.get('content-length')??0)>20000)return json({ok:false,modelRequestsUsed:0},413);
  const text=await request.text();if(Buffer.byteLength(text)>20000)return json({ok:false,modelRequestsUsed:0},413);
  const b=JSON.parse(text);if(!b||Array.isArray(b)||typeof b!=='object')throw Error('INVALID_ACTION');
  if(b.action==='history'&&exact(b,['action','offset']))return json(await scenarioArchivePage(b.offset));
  if(b.action==='episode'&&exact(b,['action','episodeId'])){const episode=await readScenarioEpisode(b.episodeId);return json({ok:!!episode,readOnly:true,modelRequestsUsed:0,memoryWritten:false,episode,...(!episode?{message:'Archivoriginal nicht vorhanden.'}:{})});}
  if(!['preview','validate','run','read'].includes(b.action))throw Error('INVALID_ACTION');
  const expected=b.action==='preview'?(b.recordId===undefined?['action']:['action','recordId']):b.action==='validate'?['action','recordId','answer']:['action','recordId','inputId','factsHash'];
  if(!exact(b,expected))throw Error('EXACT_ACTION_FIELDS');
  let recordId=b.recordId;
  if(recordId===undefined&&b.action==='preview'){const records=await listMemoryRecords();recordId=(records.find((r:any)=>r?.eligibleForForecast) as {id?:string}|undefined)?.id;}
  if(typeof recordId!=='string'||!/^[a-f0-9]{64}$/.test(recordId))throw Error('RECORD_REQUIRED');
  const entry=await readMemoryRecord(recordId);if(!entry)throw Error('RECORD_MISSING');
  if(b.action==='validate')return json(validateScenarioAnswer(entry,b.answer));
  const prepared=prepareScenarioModel(entry);
  if(b.action==='run')return json(await runScenarioModel(prepared,b.inputId,b.factsHash));
  if(b.action==='read')return json(await readScenarioModel(prepared,b.inputId,b.factsHash));
  return json({ok:true,readOnly:true,modelRequestsUsed:0,memoryWritten:false,productionChanged:false,...prepared.preview});
 }catch(error){return json({ok:false,modelRequestsUsed:0,memoryWritten:false,message:error instanceof Error?error.message:'SCENARIO_UNAVAILABLE',note:'Vorbereitung oder Lesen nicht verfügbar. Keine Ersatzgenerierung, automatische Kürzung oder Wiederholung.'},400);}
}

