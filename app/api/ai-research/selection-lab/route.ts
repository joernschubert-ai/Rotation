import { auditSelectionMeaning } from '@/lib/aiResearch/aiResearchSelectionMeaning';
import { researchAuthorized } from '@/lib/aiResearch/aiResearchSession';
import { prepareSelectionLab, selectionPreview, runSelectionLab } from '@/lib/aiResearch/aiResearchSelectionLab';
import { validateSelection, renderSelection } from '@/lib/aiResearch/aiResearchSelectionContract';
import { selectionPage } from '@/lib/aiResearch/aiResearchSelectionPage';
import corpus from '@/lib/aiResearch/aiResearchSelectionFixtures.json';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'},json=(v:unknown,status=200)=>Response.json(v,{status,headers});
export async function GET(request:Request){
 if(!researchAuthorized(request))return json({ok:false,message:'Bitte in der App anmelden.',modelRequestsUsed:0},401);
 return new Response(selectionPage(corpus.cases.map(c=>({id:c.id,title:c.title}))),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});
}
export async function POST(request:Request){
 if(!researchAuthorized(request))return json({ok:false,message:'Bitte in der App anmelden.',modelRequestsUsed:0},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false,message:'Ungültiger Anfrageursprung.',modelRequestsUsed:0},403);
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({ok:false,message:'JSON-Anfrage erforderlich.',modelRequestsUsed:0},415);
 let body:Record<string,unknown>;
 try{const declared=Number(request.headers.get('content-length')??0);if(declared>1048576)return json({ok:false,message:'Anfrage zu groß.',modelRequestsUsed:0},413);const raw=await request.text();if(Buffer.byteLength(raw,'utf8')>1048576)return json({ok:false,message:'Anfrage zu groß.',modelRequestsUsed:0},413);body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{return json({ok:false,message:'Ungültige JSON-Anfrage.',modelRequestsUsed:0},400);}
 if(!['preview','validate','run'].includes(String(body.action)))return json({ok:false,message:'Unbekannte Aktion.',modelRequestsUsed:0},400);
 let prepared:ReturnType<typeof prepareSelectionLab>;
 try{if(body.caseId&&body.report)return json({ok:false,message:'Nur eine Quelle auswählen.',modelRequestsUsed:0},400);const fixture=corpus.cases.find(c=>c.id===body.caseId);if(!fixture&&!body.report)return json({ok:false,message:'Gespeicherte Quelle oder Referenzfall fehlt.',modelRequestsUsed:0},400);prepared=prepareSelectionLab(fixture?fixture.report:body.report);}catch{return json({ok:false,message:'Faktenbestand ungültig oder Eingabegrenze überschritten. Keine Anfrage gestartet.',modelRequestsUsed:0},400);}
 if(body.action==='preview')return json(selectionPreview(prepared));
 if(body.action==='validate'){const validation=validateSelection(body.answerText,prepared.context);return json({ok:validation.ok,modelRequestsUsed:0,validation,contextCards:prepared.catalog.contextCards,interpretationAudit:auditSelectionMeaning(body.answerText,prepared.context.facts.facts),view:renderSelection(validation,prepared.context),semanticTruthVerified:false,requiresManualReview:true});}
 try{return json(await runSelectionLab(prepared,body.variant,body.expectedId,body.expectedFactsHash));}catch{return json({ok:false,message:'Vergleich nicht verfügbar. Keine automatische Wiederholung.',modelRequestsUsed:0},503);}
}
