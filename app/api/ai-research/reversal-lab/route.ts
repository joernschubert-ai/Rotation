import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {loadPriceReversalStudy} from '@/lib/aiResearch/aiResearchPriceReversalService';
import {priceReversalPage} from '@/lib/aiResearch/aiResearchPriceReversalPage';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=30;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,modelRequestsUsed:0,message:'Bitte anmelden.'},{status:401,headers});
 if(new URL(request.url).searchParams.get('format')!=='json')return new Response(priceReversalPage(),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});
 try{return Response.json(await loadPriceReversalStudy(),{headers});}catch{return Response.json({ok:false,modelRequestsUsed:0,memoryWritten:false,productionChanged:false,message:'Historische Auswertung nicht verfügbar. Keine KI gestartet.'},{status:503,headers});}
}
