import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {runAIResearchFromHistory} from '@/lib/aiResearch/aiResearchRunner';
import {prepareReportDomainContext} from '@/lib/aiResearch/aiResearchReportDomainContext';
import type {AIResearchTask} from '@/lib/aiResearch/aiResearchTypes';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const tasks:AIResearchTask[]=['DAILY_MARKET_REVIEW','REGIME_REVIEW','ROTATION_REVIEW','CRASH_RISK_REVIEW','TRADE_SETUP_REVIEW','ANOMALY_REVIEW','FORWARD_TEST_REVIEW'];
/** Read the existing frozen report only. Never prepare or generate a replacement report. */
export async function GET(request:Request){
 if(!researchAuthorized(request))return Response.json({ok:false,message:'Bitte in der App anmelden.',modelRequestsUsed:0},{status:401,headers});
 try{
  const url=new URL(request.url),parameter=url.searchParams.get('task') as AIResearchTask,task=tasks.includes(parameter)?parameter:'DAILY_MARKET_REVIEW';
  const result=await runAIResearchFromHistory({task,question:url.searchParams.get('question')?.slice(0,500),allowAIGeneration:false});
  const frame=result.report?.decisionSupport?.snapshotTimestamp,domainContext=prepareReportDomainContext(result.report,frame);
  return Response.json({ok:result.status==='SUCCESS'&&domainContext.status==='AVAILABLE',version:'DOMAIN_CONTEXT_READ_V79_4',modelRequestsUsed:0,readOnly:true,
   reportStatus:result.status,reportGeneratedAt:result.report?.generatedAt??null,reportSnapshotTimestamp:frame??null,
   savedModelReport:{generatedAt:result.report?.aiSynthesis?.generatedAt??null,cached:result.report?.aiSynthesis?.cached??null,modelRequestsUsed:result.report?.aiSynthesis?.modelRequestsUsed??0},
   domainContext,diagnostics:result.diagnostics},{headers});
 }catch{return Response.json({ok:false,version:'DOMAIN_CONTEXT_READ_V79_4',modelRequestsUsed:0,readOnly:true,message:'Gespeicherter Fachkontext derzeit nicht verfügbar. Kein neuer Bericht oder Modellaufruf gestartet.'},{status:503,headers});}
}
