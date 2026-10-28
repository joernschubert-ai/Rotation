import { researchAuthorized } from '@/lib/aiResearch/aiResearchSession';
import { runFixedDiagnostic } from '@/lib/aiResearch/aiResearchDiagnostic';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,message:'Bitte zuerst in der App anmelden.'},{status:401,headers});
 const plain=new URL(request.url).searchParams.get('mode')==='plain';
 return new Response(`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Research · kleine Gegenprobe</title>
 <style>body{background:#10151a;color:#e4eaf0;font:16px system-ui;max-width:900px;margin:40px auto;padding:20px}button{padding:12px;margin:8px 8px 8px 0;cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#19222b;padding:20px;font-size:13px}</style>
 <h1>Research · kleine Gegenprobe</h1><p><strong>Für den Vergleich ohne JSON: <a href="?mode=plain" style="color:#9bd">freie Gegenprobe öffnen</a>.</strong></p><p>Drei getrennte Fragen zu gespeicherten Daten vom 16.10.2026: Kurslage, historische Renditen, möglicher Wendemechanismus. Keine aktuelle Handelsempfehlung.</p>
 <p>Der Klick verbraucht einen KI-Versuch im bestehenden Tageskontingent. Ein bereits gespeichertes Ergebnis wird ohne neuen Versuch angezeigt. Die normale Research-Analyse bleibt unverändert.</p>
 <p>Gewählte Variante: <strong>${plain?'V33 · freie Antwort ohne JSON':'V32 · strukturierte Antwort'}</strong></p><button id="run">Gegenprobe einmal ausführen</button><button id="copy" disabled>Ergebnis kopieren</button><pre id="output">Noch keine Anfrage gestartet.</pre>
 <script>const run=document.getElementById('run'),out=document.getElementById('output'),copy=document.getElementById('copy');run.onclick=async()=>{run.disabled=true;out.textContent='Gegenprobe läuft …';try{const r=await fetch(location.pathname+location.search,{method:'POST'});out.textContent=JSON.stringify(await r.json(),null,2);copy.disabled=false}catch{out.textContent='Abruf fehlgeschlagen. Bitte nicht mehrfach wiederholen.'}finally{run.disabled=false}};copy.onclick=async()=>{try{await navigator.clipboard.writeText(out.textContent);copy.textContent='Kopiert'}catch{copy.textContent='Bitte den Text unten manuell kopieren'}};</script></html>`,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'"}});
}
export async function POST(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,message:'Bitte zuerst in der App anmelden.'},{status:401,headers});
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({ok:false,message:'Ungültiger Anfrageursprung.'},{status:403,headers});
 try{return Response.json(await runFixedDiagnostic(new URL(request.url).searchParams.get('mode')==='plain'?'plain':'structured'),{headers});}catch{return Response.json({ok:false,message:'Diagnose derzeit nicht verfügbar. Keine automatische Wiederholung.'},{status:500,headers});}
}
