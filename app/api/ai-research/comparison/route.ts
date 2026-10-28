import { researchAuthorized } from '@/lib/aiResearch/aiResearchSession';
import { runAIResearchFromHistory } from '@/lib/aiResearch/aiResearchRunner';
import { readFrozenRequest, runFullComparison } from '@/lib/aiResearch/aiResearchComparison';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,message:'Bitte in der App anmelden.'},{status:401,headers});
 try{
  const url=new URL(request.url),id=url.searchParams.get('id')??undefined;
  if(id&&!/^[a-f0-9]{64}$/.test(id))return Response.json({ok:false,message:'Ungültige Eingabe-ID.'},{status:400,headers});
  if(!id)await runAIResearchFromHistory({task:'DAILY_MARKET_REVIEW',allowAIGeneration:false,prepareComparisonInput:true});
  const frozen=await readFrozenRequest(id);
  if(!frozen)return Response.json({ok:false,message:'Noch keine volle Eingabe vorbereitet. Aktuellen Marktstand speichern und Seite erneut öffnen. Kein Modellaufruf gestartet.'},{headers});
  if(url.searchParams.get('format')==='json')return Response.json({ok:true,modelRequestsUsed:0,frozen},{headers});
  return new Response(`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Research · voller Modellvergleich</title>
  <style>body{font:16px system-ui;background:#10151a;color:#e4eaf0;max-width:1000px;margin:30px auto;padding:20px}button{padding:12px;margin:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#19222b;padding:16px}a{color:#9bd}</style>
  <h1>Research · identische Gesamteingabe</h1><p>Diese Seite hat keinen KI-Aufruf gestartet. Standardmodell der normalen Research-Auswertung ist jetzt Gemma 4 im Direktmodus. Die übrigen Modelle sind ausschließlich manuelle Vergleichskandidaten, kein automatischer Fallback.</p>
  <p>Jeder Modellknopf startet höchstens EINEN Versuch im gemeinsamen Tageslimit. 90 Sekunden Abstand. Bereits gespeicherte Antworten werden erneut gelesen. Kein automatischer Zweitaufruf.</p>
  <p>GLM, Nemotron und Gemma nutzen den dokumentierten Direktmodus ohne internen Denkmodus. Nachrichten und Ausgabebudget bleiben gleich; der zusätzliche Direktmodus-Parameter ist eine offengelegte Konfigurationsänderung. Eine vorhandene Qwen-Antwort mit derselben Eingabe-ID behalten, nicht erneut anfordern.</p>
  <p>Nur im bestehenden Cloudflare-Free-Tarif verwenden; keine Tarifänderung oder Zahlmethode erforderlich. Ein 403/Limitfehler bleibt ein Fehler, kein Upgrade/Fallback.</p>
  <p><a href="?id=${frozen.id}&format=json">Vollständige vorbereitete Eingabe anzeigen/kopieren – ohne Modellaufruf</a></p>
  <p>Snapshot: ${Number.isFinite(Date.parse(frozen.snapshotTimestamp))?new Date(frozen.snapshotTimestamp).toISOString():'Zeitpunkt unbekannt'}</p><p>Eingabe-ID: ${frozen.id}</p><button data-model="gemma">Gemma 4 · Standardmodell · ein Versuch</button><button data-model="qwen">Qwen · ein Versuch</button><button data-model="glm">GLM-4.7-Flash · ein Versuch</button><button data-model="nemotron">Nemotron 3 Super · ein Versuch</button><button id="copy" disabled>Ergebnis kopieren</button><pre id="output">Eingabe vorbereitet. Noch kein Vergleich gestartet.</pre>
  <script>const id=${JSON.stringify(frozen.id)},buttons=[...document.querySelectorAll('[data-model]')],out=document.getElementById('output'),copy=document.getElementById('copy');for(const b of buttons)b.onclick=async()=>{buttons.forEach(x=>x.disabled=true);out.textContent='Ein Vergleich läuft …';try{const r=await fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,model:b.dataset.model})});out.textContent=JSON.stringify(await r.json(),null,2);copy.disabled=false}catch{out.textContent='Abruf fehlgeschlagen. Kein automatischer Wiederholungsversuch.'}finally{buttons.forEach(x=>x.disabled=false)}};copy.onclick=async()=>{try{await navigator.clipboard.writeText(out.textContent);copy.textContent='Kopiert'}catch{copy.textContent='Text bitte manuell kopieren'}};</script></html>`,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'"}});
 }catch{return Response.json({ok:false,message:'Vorbereitung nicht verfügbar. Kein Modellaufruf gestartet.'},{status:500,headers});}
}
export async function POST(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,message:'Bitte in der App anmelden.'},{status:401,headers});
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({ok:false,message:'Ungültiger Anfrageursprung.'},{status:403,headers});
 try{
  const raw=await request.text();if(raw.length>512)return Response.json({ok:false,message:'Anfrage zu groß.'},{status:400,headers});
  const body=JSON.parse(raw);
  if(typeof body.id!=='string'||!/^[a-f0-9]{64}$/.test(body.id)||!['qwen','glm','nemotron','gemma'].includes(body.model))return Response.json({ok:false,message:'Ungültige Vergleichsauswahl.'},{status:400,headers});
  return Response.json(await runFullComparison(body.id,body.model),{headers});
 }catch{return Response.json({ok:false,message:'Vergleich nicht verfügbar. Keine automatische Wiederholung.'},{status:500,headers});}
}

