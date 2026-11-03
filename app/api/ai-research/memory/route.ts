import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {runAIResearchFromHistory} from '@/lib/aiResearch/aiResearchRunner';
import {archiveResearchMemory,inspectResearchMemory,registerMemoryForecast,readResearchMemoryRecord} from '@/lib/aiResearch/aiResearchMemoryService';
import {researchMemoryPage} from '@/lib/aiResearch/aiResearchMemoryPage';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const json=(v:unknown,status=200)=>Response.json(v,{status,headers});
export async function GET(request:Request){if(!researchAuthorized(request))return json({ok:false,modelRequestsUsed:0,message:'Bitte in der App anmelden.'},401);return new Response(researchMemoryPage(),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});}
export async function POST(request:Request){
 if(!researchAuthorized(request))return json({ok:false,modelRequestsUsed:0,message:'Bitte in der App anmelden.'},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false,modelRequestsUsed:0,message:'Ungültiger Anfrageursprung.'},403);
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({ok:false,modelRequestsUsed:0,message:'JSON erforderlich.'},415);
 try{
  if(Number(request.headers.get('content-length')??0)>10000)return json({ok:false,modelRequestsUsed:0,message:'Anfrage zu groß.'},413);
  const text=await request.text();if(Buffer.byteLength(text)>10000)return json({ok:false,modelRequestsUsed:0,message:'Anfrage zu groß.'},413);const b=JSON.parse(text);
  if(b?.action==='inspect'&&Object.keys(b).every(k=>['action','recordOffset','forecastOffset'].includes(k)))return json(await inspectResearchMemory(b.recordOffset??0,b.forecastOffset??0));
  if(b?.action==='record'&&Object.keys(b).length===2&&typeof b.recordId==='string')return json(await readResearchMemoryRecord(b.recordId));
  if(b?.action==='scenario'&&Object.keys(b).length===2&&b.scenario)return json(await registerMemoryForecast(b.scenario));
  if(b?.action==='captureLatest'&&Object.keys(b).length===1){const saved=await runAIResearchFromHistory({task:'DAILY_MARKET_REVIEW',allowAIGeneration:false});if(saved.status!=='SUCCESS'||!saved.report)return json({ok:false,modelRequestsUsed:0,message:'Kein passender gespeicherter Bericht. Keine Ersatzgenerierung oder KI-Anfrage.'});return json(await archiveResearchMemory(saved,'DAILY_MARKET_REVIEW'));}
  return json({ok:false,modelRequestsUsed:0,message:'Unbekannte Aktion oder unzulässige Felder.'},400);
 }catch{return json({ok:false,modelRequestsUsed:0,message:'Protokollvorgang nicht bestätigt. Daten oder Speicherverbindung prüfen. Keine automatische Wiederholung; bestehende Berichte bleiben erhalten.'},400);}
}
