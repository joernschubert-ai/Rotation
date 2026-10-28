import { Redis } from '@upstash/redis';
import { researchAuthorized } from '@/lib/aiResearch/aiResearchSession';
import { conditionTrial, CONDITION_TRIAL_CASES } from '@/lib/aiResearch/aiResearchConditionTrial';
import { bindSelectedConditions } from '@/lib/aiResearch/aiResearchConditionBinding';
import { saveFrozenRequest, runFullComparison } from '@/lib/aiResearch/aiResearchComparison';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,message:'Bitte in der App anmelden.'},{status:401,headers});
 const url=new URL(request.url);
 if(url.searchParams.has('case')){
  const v=conditionTrial(url.searchParams.get('case')??'',url.searchParams.get('variant')??'candidate');
  return v?Response.json({ok:true,modelRequestsUsed:0,synthetic:true,variant:v.variant,baselineId:v.baselineId,dataHash:v.dataHash,frozen:v.frozen},{headers}):Response.json({ok:false,message:'Vergleich nicht verfügbar oder Basisauftrag geändert.'},{status:400,headers});
 }
 return new Response(`<!doctype html><html lang="de"><meta charset="utf-8"><title>Preisbedingung · separater Vergleich</title><style>body{font:16px system-ui;max-width:950px;margin:30px auto;padding:20px;background:#10151a;color:#e4eaf0}button{padding:12px;margin:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#9bd}</style><h1>Preisbedingung · separater Vergleich</h1><p>Der reguläre Researchauftrag bleibt unverändert. Zwei synthetische Fälle, jeweils Bestand und Kandidat mit exakt denselben Daten. Nur die Ausgabeauswahl der Preisbedingung unterscheidet sich.</p><p>Seitenaufruf und Eingabeansicht starten keinen Modellaufruf. Jeder Knopf startet höchstens einen Gemma-Versuch; vorhandene Antworten werden wiederverwendet. Gemeinsames Tageslimit 20 und 90 Sekunden Abstand. Keine automatische Testserie oder Wiederholung. Vier neue Antworten würden höchstens vier Versuche zählen.</p>${CONDITION_TRIAL_CASES.map(id=>`<section><h2>${id==='recovery'?'Frühe Erholung':'Abwärtsfortsetzung'}</h2><a href="?case=${id}&variant=candidate">Kandidat-Eingabe ansehen – ohne KI</a><button data-case="${id}" data-variant="baseline">Bestand mit Gemma</button><button data-case="${id}" data-variant="candidate">Kandidat mit Gemma</button></section>`).join('')}<pre id="output">Noch kein Versuch gestartet. Eine einzelne Antwort beweist keine Gesamtverbesserung.</pre><script>const buttons=[...document.querySelectorAll('button')],out=document.getElementById('output');for(const b of buttons)b.onclick=async()=>{buttons.forEach(x=>x.disabled=true);out.textContent='Ein Versuch läuft …';try{const r=await fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId:b.dataset.case,variant:b.dataset.variant})});out.textContent=JSON.stringify(await r.json(),null,2)}catch{out.textContent='Abruf fehlgeschlagen. Keine automatische Wiederholung.'}finally{buttons.forEach(x=>x.disabled=false)}};</script></html>`,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'"}});
}
export async function POST(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,message:'Bitte in der App anmelden.'},{status:401,headers});
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({ok:false,message:'Ungültiger Anfrageursprung.'},{status:403,headers});
 try{
  const raw=await request.text();if(raw.length>160)return Response.json({ok:false,message:'Anfrage zu groß.'},{status:400,headers});
  const body=JSON.parse(raw),v=conditionTrial(body.caseId,body.variant);if(!v)return Response.json({ok:false,message:'Vergleich nicht verfügbar oder Basisauftrag geändert.'},{status:400,headers});
  await saveFrozenRequest(Redis.fromEnv(),v.frozen,{updateLatest:false});
  const result=await runFullComparison(v.frozen.id,'gemma');
  const bindings=v.variant==='candidate'&&result.ok&&'answerText'in result&&typeof result.answerText==='string'?bindSelectedConditions(result.answerText,v.concepts,v.frozen.body.messages[1].content):undefined;
  return Response.json({...result,trial:v.version,variant:v.variant,synthetic:true,evaluationCase:v.spec.id,baselineId:v.baselineId,dataHash:v.dataHash,conditionBindings:bindings,qualityVerdict:'Preiszuordnung ist getrennt berechnet; freie Modellprosa und Gesamtverbesserung sind weiterhin manuell zu prüfen.'},{headers});
 }catch{return Response.json({ok:false,message:'Vergleich fehlgeschlagen. Keine automatische Wiederholung.'},{status:500,headers});}
}
