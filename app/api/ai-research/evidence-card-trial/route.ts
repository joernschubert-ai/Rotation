import { Redis } from '@upstash/redis';
import { researchAuthorized } from '@/lib/aiResearch/aiResearchSession';
import { evidenceCardTrial } from '@/lib/aiResearch/aiResearchEvidenceCardTrial';
import { saveFrozenRequest, runFullComparison } from '@/lib/aiResearch/aiResearchComparison';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request){
  if(!researchAuthorized(request))return Response.json({ok:false,message:'Bitte in der App anmelden.',modelRequestsUsed:0},{status:401,headers});
  const url=new URL(request.url);
  if(url.searchParams.has('case')){const v=evidenceCardTrial(url.searchParams.get('case')??'',url.searchParams.get('variant')??'candidate');return v?Response.json({ok:true,modelRequestsUsed:0,...v},{headers}):Response.json({ok:false,message:'Fall oder Basisauftrag nicht verfügbar.',modelRequestsUsed:0},{status:400,headers});}
  return new Response(`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Befundkarten</title><style>body{font:16px system-ui;max-width:940px;margin:30px auto;padding:20px;background:#111820;color:#e8edf2}a{color:#acf}button{padding:12px;margin:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>Befundkarten · separater Kandidat</h1><p>V66 bleibt produktiv. Dieser Versuch ergänzt geprüfte Befundkarten und einen Lesehinweis. Gleiche Quelldaten, anders aufbereiteter Nutzertext. Kein V67-Auswahlformat.</p><p>Seitenaufruf und Eingabeansicht: 0 KI-Aufrufe. Jeder Modellknopf kann einen neuen Versuch verbrauchen. Vorhandener exakter Cache wird genutzt; ein Cachetreffer ist nicht garantiert. Gemeinsames Tageslimit und 90 Sekunden Pause gelten. Keine automatische Serie.</p>${['continuation','recovery'].map(id=>`<section><h2>${id==='continuation'?'Abwärtsfortsetzung':'Frühe Erholung · Regression'}</h2><a href="?case=${id}&variant=candidate">Eingabe ansehen · ohne KI</a><button data-case="${id}" data-variant="baseline">Bestand ansehen/abrufen</button><button data-case="${id}" data-variant="candidate">Kandidat mit Gemma</button></section>`).join('')}<pre id="out">Noch kein Versuch gestartet. Zunächst Abwärtsfortsetzung prüfen. Nur bei brauchbarem Ergebnis den Erholungsfall als Gegenprobe verwenden.</pre><script>const buttons=[...document.querySelectorAll('button')],out=document.getElementById('out');for(const b of buttons)b.onclick=async()=>{buttons.forEach(x=>x.disabled=true);out.textContent='Ein Versuch läuft …';try{const r=await fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId:b.dataset.case,variant:b.dataset.variant})});out.textContent=JSON.stringify(await r.json(),null,2)}catch{out.textContent='Fehlgeschlagen. Keine automatische Wiederholung.'}finally{buttons.forEach(x=>x.disabled=false)}};</script></html>`,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});
}
export async function POST(request:Request){
  if(!researchAuthorized(request))return Response.json({ok:false,message:'Bitte in der App anmelden.',modelRequestsUsed:0},{status:401,headers});
  if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({ok:false,message:'Ungültiger Anfrageursprung.',modelRequestsUsed:0},{status:403,headers});
  try{const raw=await request.text();if(raw.length>160)return Response.json({ok:false,message:'Anfrage zu groß.',modelRequestsUsed:0},{status:400,headers});
    const body=JSON.parse(raw),v=evidenceCardTrial(body.caseId,body.variant);if(!v)return Response.json({ok:false,message:'Fall oder Basisauftrag nicht verfügbar.',modelRequestsUsed:0},{status:400,headers});
    await saveFrozenRequest(Redis.fromEnv(),v.frozen,{updateLatest:false});
    const result=await runFullComparison(v.frozen.id,'gemma');
    return Response.json({...result,trial:v.version,variant:v.variant,synthetic:true,evaluationCase:v.spec.id,baselineId:v.baselineId,dataHash:v.dataHash,sourceFactsHash:v.sourceFactsHash,userPromptHash:v.userPromptHash,presentation:v.presentation,
      qualityVerdict:'Freie Argumentation und Erhalt funktionierender Eigenschaften manuell prüfen. Keine automatische Produktionsübernahme.'},{headers});
  }catch{return Response.json({ok:false,message:'Vergleich fehlgeschlagen. Keine automatische Wiederholung.'},{status:500,headers});}
}

