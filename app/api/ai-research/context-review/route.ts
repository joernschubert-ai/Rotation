import {reviewScenarioArguments} from '@/lib/aiResearch/aiResearchArgumentReview';
import {contextSelectionCoverage} from '@/lib/aiResearch/aiResearchContextCoverage';
import {CONTEXT_LINKS} from '@/lib/aiResearch/aiResearchScenarioContextLinks';
import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {loadScenarioContext,readScenarioContext,runScenarioContext,validateScenarioContext,readArchivedScenarioContext} from '@/lib/aiResearch/aiResearchScenarioContext';
import {scenarioContextPage} from '@/lib/aiResearch/aiResearchScenarioContextPage';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const json=(v:unknown,status=200)=>Response.json(v,{status,headers});
export async function GET(request:Request){if(!researchAuthorized(request))return json({ok:false,modelRequestsUsed:0},401);return new Response(scenarioContextPage(),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});}
export async function POST(request:Request){
 if(!researchAuthorized(request))return json({ok:false,modelRequestsUsed:0},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false,modelRequestsUsed:0},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({ok:false,modelRequestsUsed:0},415);
 try{
  if(Number(request.headers.get('content-length')??0)>20000)return json({ok:false,modelRequestsUsed:0},413);
  const text=await request.text();if(Buffer.byteLength(text)>20000)return json({ok:false,modelRequestsUsed:0},413);
  const b=JSON.parse(text);if(!b||typeof b!=='object'||Array.isArray(b)||!['preview','validate','run','read','original'].includes(b.action))throw Error('CONTEXT_ACTION');
  if(b.action==='original'){if(Object.keys(b).length!==2||!Object.hasOwn(b,'reviewId'))throw Error('CONTEXT_EXACT_FIELDS');return json(await readArchivedScenarioContext(b.reviewId));}
  const keys=b.action==='preview'?['action','baseEpisodeId']:b.action==='validate'?['action','baseEpisodeId','answer']:['action','baseEpisodeId','inputId','factsHash'];
  if(Object.keys(b).length!==keys.length||!keys.every(k=>Object.hasOwn(b,k)))throw Error('CONTEXT_EXACT_FIELDS');
  const p=await loadScenarioContext(b.baseEpisodeId);
  if(b.action==='validate')return json({version:CONTEXT_LINKS,modelRequestsUsed:0,memoryWritten:false,provenance:'OFFLINE_IMPORTED_UNVERIFIED',validation:validateScenarioContext(p,b.answer)});
  if(b.action==='run'){const result=await runScenarioContext(p,b.inputId,b.factsHash);return json({...result,argumentReview:reviewScenarioArguments(p.links),selectionCoverage:contextSelectionCoverage(p.links,'episode' in result?result.episode?.view:null)});}
  if(b.action==='read'){const result=await readScenarioContext(p,b.inputId,b.factsHash);return json({...result,argumentReview:reviewScenarioArguments(p.links),selectionCoverage:contextSelectionCoverage(p.links,result.episode?.view)});}
  return json({...p.preview,argumentReview:reviewScenarioArguments(p.links),selectionCoverage:contextSelectionCoverage(p.links,null)});
 }catch(error){return json({ok:false,modelRequestsUsed:0,memoryWritten:false,forecastsChanged:false,message:error instanceof Error?error.message:'CONTEXT_UNAVAILABLE',note:'Vorbereitung oder Lesen nicht verfügbar. Keine Ersatzgenerierung oder automatische Wiederholung.'},400);}
}



