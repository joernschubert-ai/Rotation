import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {runAIResearchFromHistory} from '@/lib/aiResearch/aiResearchRunner';
import {prepareContextTrial,contextTrialPreview,evaluateContextTrial,runContextTrial,readStoredContextTrial} from '@/lib/aiResearch/aiResearchContextTrial';
import {contextTrialPage} from '@/lib/aiResearch/aiResearchContextTrialPage';
import corpus from '@/lib/aiResearch/aiResearchSelectionFixtures.json';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'},json=(v:unknown,status=200)=>Response.json(v,{status,headers});
export async function GET(request:Request){if(!researchAuthorized(request))return json({ok:false,message:'Bitte in der App anmelden.',modelRequestsUsed:0},401);return new Response(contextTrialPage(corpus.cases.map(c=>({id:c.id,title:c.title}))),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});}
export async function POST(request:Request){
 if(!researchAuthorized(request))return json({ok:false,message:'Bitte in der App anmelden.',modelRequestsUsed:0},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false,message:'Ungültiger Anfrageursprung.',modelRequestsUsed:0},403);
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({ok:false,message:'JSON erforderlich.',modelRequestsUsed:0},415);
 let b:Record<string,any>;try{if(Number(request.headers.get('content-length')??0)>4000000)return json({ok:false,message:'Anfrage zu groß.',modelRequestsUsed:0},413);const raw=await request.text();if(Buffer.byteLength(raw)>4000000)return json({ok:false,message:'Anfrage zu groß.',modelRequestsUsed:0},413);b=JSON.parse(raw);if(!b||typeof b!=='object'||Array.isArray(b))throw Error();}catch{return json({ok:false,message:'Ungültige JSON-Daten.',modelRequestsUsed:0},400);}
 if(!['preview','validate','run','read'].includes(b.action))return json({ok:false,message:'Unbekannte Aktion.',modelRequestsUsed:0},400);
 let p:ReturnType<typeof prepareContextTrial>;
 try{
  if(b.caseId&&b.report)return json({ok:false,message:'Nur eine Quelle wählen.',modelRequestsUsed:0},400);
  let source:unknown=b.report;
  if(b.caseId==='latest'){const read=await runAIResearchFromHistory({task:'DAILY_MARKET_REVIEW',allowAIGeneration:false});if(read.status!=='SUCCESS'||!read.report)return json({ok:false,message:'Kein passender gespeicherter Gesamtbericht. Keine Ersatzgenerierung oder KI-Anfrage gestartet.',modelRequestsUsed:0,diagnostics:read.diagnostics});source=read.report;}
  else if(b.caseId){const fixture=corpus.cases.find(c=>c.id===b.caseId);if(!fixture)return json({ok:false,message:'Unbekannter Referenzfall.',modelRequestsUsed:0},400);source=fixture.report;}
  if(!source)return json({ok:false,message:'Quelle fehlt.',modelRequestsUsed:0},400);
  p=prepareContextTrial(source);
 }catch{return json({ok:false,message:'Vorbereitung nicht verfügbar, Faktenrahmen unpassend oder Eingabegrenze überschritten. Kein Modellaufruf gestartet.',modelRequestsUsed:0},400);}
 if(b.action==='preview')return json(contextTrialPreview(p));
 if(b.action==='validate')return json(evaluateContextTrial(p,b.answerText));
 if(b.action==='read')return json(await readStoredContextTrial(p,b.expectedId,b.expectedFactsHash));
 try{return json(await runContextTrial(p,b.expectedId,b.expectedFactsHash));}catch{return json({ok:false,message:'Versuch unterbrochen. Ob bereits ein Modellaufruf gezählt wurde, ist hier nicht sicher feststellbar. Keine automatische Wiederholung.',modelRequestsUsed:null,modelUsageUnknown:true},503);}
}
