import { auditCOTEvaluation } from '@/lib/aiResearch/aiResearchCOTNarrativeAudit';
import { Redis } from '@upstash/redis';
import { researchAuthorized } from '@/lib/aiResearch/aiResearchSession';
import { evaluationInput, EVALUATION_CASES } from '@/lib/aiResearch/aiResearchEvaluation';
import { saveFrozenRequest, runFullComparison } from '@/lib/aiResearch/aiResearchComparison';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,message:'Bitte in der App anmelden.'},{status:401,headers});
 const selected=new URL(request.url).searchParams.get('case');
 if(selected){const value=evaluationInput(selected);return value?Response.json({ok:true,synthetic:true,modelRequestsUsed:0,frozen:value.frozen,checks:value.spec.checks},{headers}):Response.json({ok:false,message:'Unbekannter Prüffall.'},{status:400,headers});}
 return new Response(`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gemma · feste Prüffälle</title>
 <style>body{font:16px system-ui;background:#10151a;color:#e4eaf0;max-width:1000px;margin:30px auto;padding:20px}button{padding:12px;margin:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#19222b;padding:16px}a{color:#9bd}section{border:1px solid #456;padding:16px;margin:16px 0}</style>
 <h1>Gemma · feste Prüffälle mit P&F-Erweiterung</h1><p>Synthetische Szenarien, keine aktuellen Marktanalysen. Der vorhandene Researchauftrag und die Faktenaufbereitung bleiben gleich. Die Musterantworten werden dem Modell nicht verraten.</p>
 <p>Diese Seite startet keinen Modellaufruf. Jeder Knopf startet höchstens einen Gemma-Versuch. Mindestens 90 Sekunden Abstand, gemeinsames Tageslimit 20; Cloudflare-Free-Budget gilt zusätzlich. Keine automatische Wiederholung. Bereits gespeicherte Antworten werden gelesen.</p>
 ${EVALUATION_CASES.map(c=>`<section><h2>${c.title}</h2><p><a href="?case=${c.id}">Eingabe und Prüfkriterien ansehen – ohne Modellaufruf</a></p><button data-case="${c.id}">Diesen Fall mit Gemma prüfen</button></section>`).join('')}
 <button id="copy" disabled>Ergebnis kopieren</button><pre id="output">Noch kein Versuch gestartet. Die Kriterien dienen der manuellen Prüfung, kein automatischer Qualitätsscore.</pre>
 <script>const buttons=[...document.querySelectorAll('[data-case]')],out=document.getElementById('output'),copy=document.getElementById('copy');for(const b of buttons)b.onclick=async()=>{buttons.forEach(x=>x.disabled=true);out.textContent='Ein Versuch läuft …';try{const r=await fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId:b.dataset.case})});out.textContent=JSON.stringify(await r.json(),null,2);copy.disabled=false}catch{out.textContent='Abruf fehlgeschlagen. Keine automatische Wiederholung.'}finally{buttons.forEach(x=>x.disabled=false)}};copy.onclick=async()=>{try{await navigator.clipboard.writeText(out.textContent);copy.textContent='Kopiert'}catch{copy.textContent='Text bitte manuell kopieren'}};</script></html>`,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'"}});
}
export async function POST(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,message:'Bitte in der App anmelden.'},{status:401,headers});
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({ok:false,message:'Ungültiger Anfrageursprung.'},{status:403,headers});
 try{
  const raw=await request.text();if(raw.length>128)return Response.json({ok:false,message:'Anfrage zu groß.'},{status:400,headers});
  const value=evaluationInput(JSON.parse(raw).caseId);if(!value)return Response.json({ok:false,message:'Unbekannter Prüffall.'},{status:400,headers});
  await saveFrozenRequest(Redis.fromEnv(),value.frozen,{updateLatest:false});
  const result=await runFullComparison(value.frozen.id,'gemma');
  return Response.json({...result,...(result.ok&&'answerText' in result&&typeof result.answerText==='string'?{cotAudit:auditCOTEvaluation(result.answerText,value.data)}:{}),synthetic:true,evaluationCase:value.spec.id,evaluationTitle:value.spec.title,checks:value.spec.checks,qualityVerdict:'Noch manuell zu prüfen. Keine automatische Freigabe.'},{headers});
 }catch{return Response.json({ok:false,message:'Prüffall nicht verfügbar. Keine automatische Wiederholung.'},{status:500,headers});}
}
