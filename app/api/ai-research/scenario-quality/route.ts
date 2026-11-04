import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {inspectScenarioQuality} from '@/lib/aiResearch/aiResearchScenarioQuality';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,modelRequestsUsed:0,message:'Bitte anmelden.'},{status:401,headers});
 const url=new URL(request.url);
 try{return Response.json(await inspectScenarioQuality(url.searchParams.get('episodeId'),Number(url.searchParams.get('offset')??0)),{headers});}
 catch{return Response.json({ok:false,version:'SCENARIO_QUALITY_READ_V1',readOnly:true,modelRequestsUsed:0,memoryWritten:false,message:'Archivprüfung nicht verfügbar. Kein Modellaufruf, keine Reparatur oder Speicherung.'},{status:503,headers});}
}
