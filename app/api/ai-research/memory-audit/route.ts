import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {inspectMemoryAudit} from '@/lib/aiResearch/aiResearchMemoryAudit';
import {memoryAuditPage} from '@/lib/aiResearch/aiResearchMemoryAuditPage';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,modelRequestsUsed:0,message:'Bitte anmelden.'},{status:401,headers});
 const url=new URL(request.url);if(url.searchParams.get('format')!=='json')return new Response(memoryAuditPage(),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});
 try{return Response.json(await inspectMemoryAudit(Number(url.searchParams.get('recordOffset')??0),Number(url.searchParams.get('forecastOffset')??0)),{headers});}
 catch{return Response.json({ok:false,version:'RESEARCH_MEMORY_AUDIT_V1',readOnly:true,modelRequestsUsed:0,memoryWritten:false,message:'Leseprüfung nicht verfügbar. Kein Wartungs- oder Modellaufruf gestartet.'},{status:503,headers});}
}
