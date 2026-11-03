import {prepareReportTemporalContext} from '@/lib/aiResearch/aiResearchReportTemporalContext';
import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {runAIResearchFromHistory} from '@/lib/aiResearch/aiResearchRunner';
import {describeResearchPresentation} from '@/lib/aiResearch/aiResearchPresentationPolicy';
import {prepareReportDomainContext} from '@/lib/aiResearch/aiResearchReportDomainContext';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,modelRequestsUsed:0,message:'Bitte in der App anmelden.'},{status:401,headers});
 try{
  const result=await runAIResearchFromHistory({task:'DAILY_MARKET_REVIEW',allowAIGeneration:false}),report=result.report,frame=report?.decisionSupport?.snapshotTimestamp;
  return Response.json({ok:result.status==='SUCCESS',version:'PRESENTATION_READ_V79_6',readOnly:true,modelRequestsUsed:0,reportStatus:result.status,
   reportGeneratedAt:report?.generatedAt??null,presentation:describeResearchPresentation(report,frame),domainContext:prepareReportDomainContext(report,frame),temporalContext:prepareReportTemporalContext(report,frame),
   originalModel:report?.aiSynthesis?{generatedAt:report.aiSynthesis.generatedAt,cached:true,snapshotTimestamp:report.aiSynthesis.snapshotTimestamp}:null,
   message:report?'Gespeicherten Bericht gelesen; kein neuer KI-Aufruf oder neues Markt-Research.':'Kein passender gespeicherter Bericht verfügbar. Keine Ersatzgenerierung.',diagnostics:result.diagnostics},{headers});
 }catch{return Response.json({ok:false,version:'PRESENTATION_READ_V79_6',readOnly:true,modelRequestsUsed:0,message:'Leseprüfung derzeit nicht verfügbar. Keine KI-Anfrage oder automatische Wiederholung gestartet.'},{status:503,headers});}
}
