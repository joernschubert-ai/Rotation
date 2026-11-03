import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {readNormalReportWeighing} from '@/lib/aiResearch/aiResearchReportWeighing';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const error=(message:string,status=503)=>Response.json({ok:false,version:'REPORT_WEIGHING_LINK_V1',readOnly:true,modelRequestsUsed:0,memoryWritten:false,message,originalReportChanged:false,forecastsChanged:false},{status,headers});
export async function GET(request:Request){if(!researchAuthorized(request))return error('Bitte anmelden.',401);try{return Response.json(await readNormalReportWeighing(),{headers});}catch{return error('Gespeicherte Ergänzung derzeit nicht lesbar. Keine Modellanfrage gestartet.');}}
export async function POST(request:Request){
 if(!researchAuthorized(request))return error('Bitte anmelden.',401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return error('Ungültiger Anfrageursprung.',403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return error('JSON erforderlich.',415);
 try{if(Number(request.headers.get('content-length')??0)>2048)return error('Anfrage zu groß.',413);const text=await request.text();if(Buffer.byteLength(text)>2048)return error('Anfrage zu groß.',413);const b=JSON.parse(text),keys=b?.baseEpisodeId===undefined?['action','snapshotTimestamp','factsHash','reportGeneratedAt','sourceIdentityHash']:['action','snapshotTimestamp','factsHash','reportGeneratedAt','sourceIdentityHash','baseEpisodeId'];
  if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).length!==keys.length||!keys.every(k=>Object.hasOwn(b,k))||b.action!=='read'||typeof b.snapshotTimestamp!=='string'||!Number.isFinite(Date.parse(b.snapshotTimestamp))||typeof b.factsHash!=='string'||!/^[a-f0-9]{64}$/.test(b.factsHash)||(typeof b.sourceIdentityHash!=='string'||!/^[a-f0-9]{64}$/.test(b.sourceIdentityHash))||typeof b.reportGeneratedAt!=='string'||!Number.isFinite(Date.parse(b.reportGeneratedAt))||(b.baseEpisodeId!==undefined&&(typeof b.baseEpisodeId!=='string'||!/^[a-f0-9]{64}$/.test(b.baseEpisodeId))))return error('Ungültiger Leseauftrag.',400);
  return Response.json(await readNormalReportWeighing(b),{headers});
 }catch{return error('Ergänzung konnte nicht gelesen werden. Keine Generierung oder Speicherung gestartet.');}
}
