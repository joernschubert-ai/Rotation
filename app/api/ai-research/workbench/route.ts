import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {readWorkbenchIndex} from '@/lib/aiResearch/aiResearchWorkbenchIndex';
import {researchWorkbenchPage} from '@/lib/aiResearch/aiResearchWorkbenchPage';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,modelRequestsUsed:0,message:'Bitte anmelden.'},{status:401,headers});
 const u=new URL(request.url);if(u.searchParams.get('format')!=='json')return new Response(researchWorkbenchPage(),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});
 try{return Response.json(await readWorkbenchIndex(Number(u.searchParams.get('recordOffset')??0),Number(u.searchParams.get('scenarioOffset')??0)),{headers});}
 catch{return Response.json({ok:false,readOnly:true,modelRequestsUsed:0,memoryWritten:false,message:'Archivverzeichnis nicht lesbar. Keine Generierung gestartet.'},{status:503,headers});}
}
