import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {loadWeighingV4Lab,readWeighingV4,runWeighingV4,validateWeighingV4Lab,readArchivedWeighingV4} from '@/lib/aiResearch/aiResearchWeighingV4Lab';
import {weighingV4Page} from '@/lib/aiResearch/aiResearchWeighingV4Page';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const json=(v:unknown,status=200)=>{
 const r=v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
 const e=r.episode;
 const outcome=e?{stage:e.original?.ok!==true?'PROVIDER_FAILURE':e.validation?.ok!==true?'SELECTION_REJECTED':r.archiveConfirmed===false?'ARCHIVE_UNCONFIRMED':'ARCHIVED_REVIEW',providerOk:e.original?.ok===true,selectionOk:e.validation?.ok===true,archived:r.archiveConfirmed===true,summary:e.original?.ok!==true?'Modellaufruf fehlgeschlagen; Diagnose bleibt erhalten.':e.validation?.ok!==true?'Modell hat geantwortet; Auswahlprüfung hält das Ergebnis zurück.':r.archiveConfirmed===false?'Antwort geprüft; Archivierung nicht bestätigt.':'Antwort geprüft und archiviert; Gewichtungsqualität bleibt ungeprüft.'}:r.contractChecks?{stage:'PREVIEW',providerOk:null,selectionOk:null,archived:false,summary:'Auftrag und interne Vertragsprüfungen vorbereitet; noch kein Modellaufruf.'}:null;
 return Response.json({...r,...(outcome?{outcome}:{})},{status,headers});
};
export async function GET(request:Request){if(!researchAuthorized(request))return json({ok:false,modelRequestsUsed:0},401);return new Response(weighingV4Page(),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});}
export async function POST(request:Request){
 if(!researchAuthorized(request))return json({ok:false,modelRequestsUsed:0},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false,modelRequestsUsed:0},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({ok:false,modelRequestsUsed:0},415);
 try{
  if(Number(request.headers.get('content-length')??0)>20000)return json({ok:false,modelRequestsUsed:0},413);
  const text=await request.text();if(Buffer.byteLength(text)>20000)return json({ok:false,modelRequestsUsed:0},413);
  const b=JSON.parse(text);if(!b||typeof b!=='object'||Array.isArray(b)||!['preview','validate','run','read','original'].includes(b.action))throw Error('CONTEXT_ACTION');
  if(b.action==='original'){if(Object.keys(b).length!==2||!Object.hasOwn(b,'reviewId'))throw Error('CONTEXT_EXACT_FIELDS');return json(await readArchivedWeighingV4(b.reviewId));}
  const keys=b.action==='preview'?['action','baseEpisodeId']:b.action==='validate'?['action','baseEpisodeId','answer']:['action','baseEpisodeId','inputId','factsHash'];
  if(Object.keys(b).length!==keys.length||!keys.every(k=>Object.hasOwn(b,k)))throw Error('CONTEXT_EXACT_FIELDS');
  const p=await loadWeighingV4Lab(b.baseEpisodeId);
  if(b.action==='validate')return json({version:'CONTEXT_WEIGHING_LAB_V4',modelRequestsUsed:0,memoryWritten:false,provenance:'OFFLINE_IMPORTED_UNVERIFIED',validation:validateWeighingV4Lab(p,b.answer)});
  if(b.action==='run')return json(await runWeighingV4(p,b.inputId,b.factsHash));
  if(b.action==='read')return json(await readWeighingV4(p,b.inputId,b.factsHash));
  return json(p.preview);
 }catch(error){return json({ok:false,modelRequestsUsed:0,memoryWritten:false,forecastsChanged:false,message:error instanceof Error?error.message:'CONTEXT_UNAVAILABLE',note:'Vorbereitung oder Lesen nicht verfügbar. Keine Ersatzgenerierung oder automatische Wiederholung.'},400);}
}



