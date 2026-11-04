import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {readScenarioOverview} from '@/lib/aiResearch/aiResearchScenarioOverview';
import {scenarioOverviewPage} from '@/lib/aiResearch/aiResearchScenarioOverviewPage';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,modelRequestsUsed:0,message:'Bitte anmelden.'},{status:401,headers});
 const url=new URL(request.url);
 if(url.searchParams.get('format')!=='json')return new Response(scenarioOverviewPage(),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});
 try{return Response.json(await readScenarioOverview(url.searchParams.get('baseEpisodeId')??''),{headers});}
 catch{return Response.json({ok:false,version:'SCENARIO_OVERVIEW_READ_V1',readOnly:true,modelRequestsUsed:0,memoryWritten:false,forecastsChanged:false,message:'Gesamtansicht für diese exakte Episodenkennung nicht verfügbar. Keine Ersatzdaten, Reparatur oder Modellanfrage.'},{status:503,headers});}
}
