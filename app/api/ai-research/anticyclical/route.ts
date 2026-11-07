import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {loadRecoveryStudy} from '@/lib/aiResearch/aiResearchAnticyclicalService';
import {anticyclicalPage} from '@/lib/aiResearch/aiResearchAnticyclicalPage';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=30;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,modelRequestsUsed:0,message:'Bitte anmelden.'},{status:401,headers});
 const url=new URL(request.url);
 if(url.searchParams.get('format')!=='json')return new Response(anticyclicalPage(),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});
 try{return Response.json(await loadRecoveryStudy(),{headers});}
 catch{return Response.json({ok:false,modelRequestsUsed:0,memoryWritten:false,productionChanged:false,message:'Historische Auswertung nicht verfuegbar. Keine KI gestartet.'},{status:503,headers});}
}
