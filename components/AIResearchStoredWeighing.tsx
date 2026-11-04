"use client";
import {useEffect,useRef,useState} from 'react';
import {reportSourceIdentityFields} from '@/lib/aiResearch/aiResearchReportIdentity';
import type {AIResearchReport} from '@/lib/aiResearch/aiResearchTypes';

function candidateTime(value:unknown){if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))return 'Ausgabezeit nicht im Archivverzeichnis verfügbar';return 'Ausgabezeit: '+new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Berlin'}).format(new Date(value))+' (Europe/Berlin, Archivangabe)';}

/** Explicit read only. No mount fetch, no report mutation, no model-generating route. */
export function AIResearchStoredWeighing({report,displayedSnapshotTimestamp,suspended=false}:{report:AIResearchReport;displayedSnapshotTimestamp?:string;suspended?:boolean}){
 const facts=report.appFacts,stamp=facts?.snapshotTimestamp;
 const serializedFacts=facts?JSON.stringify(facts):'';
 const sourceIdentity=JSON.stringify(reportSourceIdentityFields(report));
 const frameKey=sourceIdentity+'|'+report.generatedAt+'|'+(stamp??'')+'|'+serializedFacts;
 const frameRef=useRef(frameKey);frameRef.current=frameKey;
 const seq=useRef(0),pending=useRef(false),controller=useRef<AbortController|null>(null);
 const [stored,setStored]=useState<{key:string;payload:Record<string,any>}|null>(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState<string|null>(null);
 useEffect(()=>{controller.current?.abort();++seq.current;pending.current=false;setBusy(false);setMessage(null);return()=>{controller.current?.abort();++seq.current;pending.current=false;};},[frameKey,suspended]);
 const eligible=!suspended&&!!stamp&&report.decisionSupport?.snapshotTimestamp===stamp&&(!displayedSnapshotTimestamp||displayedSnapshotTimestamp===stamp);
 const payload=eligible&&stored?.key===frameKey?stored.payload:null;
 async function read(baseEpisodeId?:string){
  if(!eligible||!facts||!stamp||pending.current)return;
  pending.current=true;setBusy(true);setMessage(null);const id=++seq.current,key=frameKey,request=new AbortController();controller.current?.abort();controller.current=request;
  try{
   const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(serializedFacts));const factsHash=Array.from(new Uint8Array(bytes)).map(n=>n.toString(16).padStart(2,'0')).join('');
   const identityBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sourceIdentity));const sourceIdentityHash=Array.from(new Uint8Array(identityBytes)).map(n=>n.toString(16).padStart(2,'0')).join('');
   if(id!==seq.current||frameRef.current!==key||request.signal.aborted)return;
   const response=await fetch('/api/ai-research/report-weighing',{method:'POST',cache:'no-store',credentials:'same-origin',signal:request.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'read',snapshotTimestamp:stamp,factsHash,reportGeneratedAt:report.generatedAt,sourceIdentityHash,...(baseEpisodeId?{baseEpisodeId}:{})})});
   const data=await response.json();if(id!==seq.current||frameRef.current!==key||request.signal.aborted)return;
   if(['AVAILABLE','MULTIPLE_MATCHING_SCENARIOS','SEARCH_LIMIT_REACHED'].includes(data.status)&&(data.reportSnapshotTimestamp!==stamp||data.factsHash!==factsHash||data.reportGeneratedAt!==report.generatedAt||data.sourceIdentityHash!==sourceIdentityHash))throw Error('Antwort gehört nicht zum angezeigten Quellenbericht.');
   if(baseEpisodeId&&data.status==='AVAILABLE'&&data.baseEpisodeId!==baseEpisodeId)throw Error('Antwort gehört nicht zum ausdrücklich gewählten Szenario.');
   setStored({key,payload:data});
  }catch(error){if(id===seq.current&&!request.signal.aborted){setStored(null);setMessage(error instanceof Error?error.message:'Gespeicherte Ergänzung nicht lesbar.');}}
  finally{if(id===seq.current){pending.current=false;setBusy(false);}}
 }
 return <section className="rounded-xl border border-slate-700 bg-[#101820] p-4 text-xs text-slate-300" aria-label="Gespeicherte Abwägung zum Bericht">
  <h3 className="font-semibold text-slate-100">Gespeicherte Abwägung zu diesem Quellenbericht</h3>
  <p className="mt-2 text-slate-400">Optionaler früherer Modellauftrag, nur bei exakt gleichem Bericht und Faktenstand. Keine neue KI-Anfrage, Prognose oder Einstiegserlaubnis. Der normale Bericht und dessen Kopierfunktion bleiben unverändert; der Zusatz besitzt unten einen eigenen vollständigen Ausdruck.</p>
  {!eligible?<p className="mt-2 text-amber-200">Ergänzung ausgesetzt, bis Bericht und angezeigter Marktstand zusammenpassen.</p>:<button type="button" disabled={busy} onClick={()=>void read()} className="mt-3 rounded border border-slate-600 px-3 py-2 disabled:opacity-50">{busy?'Gespeicherte Ergänzung wird gelesen …':'Gespeicherte Abwägung lesen · ohne KI'}</button>}
  {message&&<p role="status" className="mt-3 text-amber-200">{message} Keine neue KI-Anfrage gestartet.</p>}
  {payload&&<>
   <p role="status" className="mt-3">{payload.message}</p>
   <p className="mt-1 text-slate-500">{payload.status} · neue KI-Aufrufe: {payload.modelRequestsUsed??0}</p>
   {payload.status==='MULTIPLE_MATCHING_SCENARIOS'&&Array.isArray(payload.candidates)&&payload.candidates.filter((c:Record<string,unknown>)=>typeof c.id==='string'&&/^[a-f0-9]{64}$/.test(c.id)).map((c:Record<string,any>)=><button key={c.id} type="button" disabled={busy} onClick={()=>void read(c.id)} className="mt-2 block break-all rounded border border-slate-700 p-2"><span className="block text-left font-semibold">{candidateTime(c.issuedAt)}</span><span className="mt-1 block text-left">Szenario {c.id}</span><span className="mt-1 block text-left">Diesen Szenariobezug gezielt lesen · ohne KI</span></button>)}
   {payload.status==='AVAILABLE'&&<>
    {typeof payload.baseEpisodeId==='string'&&/^[a-f0-9]{64}$/.test(payload.baseEpisodeId)&&<a href={'/api/ai-research/scenario-overview?baseEpisodeId='+encodeURIComponent(payload.baseEpisodeId)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded border border-slate-500 px-3 py-2 text-slate-100 underline">Lesbare Gesamtansicht dieses Szenarios öffnen · ohne KI</a>}
    <p className="mt-2 text-slate-400">Archivierter Quellenstand {payload.reportSnapshotTimestamp}; Modellausgabe {payload.modelGeneratedAt}. Quellenprüfung bestanden, Gewichtungsqualität ungeprüft.</p>
    {Array.isArray(payload.markets)&&payload.markets.map((row:Record<string,any>)=><article key={row.market} className="mt-3 rounded border border-slate-700 p-3">
     <h4 className="font-semibold">{row.market} · gespeicherte Basis {row.baseDirection}</h4>
     <p className="mt-1">{row.judgement==='OPEN'?'Modell lässt die Abwägung offen':row.judgement==='BASE_CONTEXT_STRONGER'?'Modellschwerpunkt beim Basisszenario':'Modellschwerpunkt bei der Gegenidee'}</p>
     {Array.isArray(row.decisiveEffects)&&row.decisiveEffects.map((e:Record<string,any>)=><p key={e.effectId} className="mt-2">Schlüsselbeleg: {e.effectId} · {e.meaning}</p>)}
     <details className="mt-2"><summary className="cursor-pointer">Gewählte Belege, Gegenkontext und Originalquelle</summary><pre className="mt-2 whitespace-pre-wrap break-words">{JSON.stringify({sameEffects:row.sameEffects,oppositeEffects:row.oppositeEffects,cot:row.cot,history:row.history,decisiveSourceTexts:row.decisiveSourceTexts},null,2)}</pre></details>
    </article>)}
    <p className="mt-3 text-slate-400">{payload.limits}</p>
   </>}
   <details className="mt-3"><summary className="cursor-pointer">Vollständige gespeicherte Ergänzung · zum Kopieren öffnen</summary><pre className="mt-2 whitespace-pre-wrap break-words">{JSON.stringify(payload,null,2)}</pre></details>
  </>}
 </section>;
}
