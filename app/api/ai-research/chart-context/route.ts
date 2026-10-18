import { NextResponse } from 'next/server';
import { researchAuthorized } from '@/lib/aiResearch/aiResearchSession';
import { loadResearchChartContext } from '@/lib/aiResearch/aiResearchChartService';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(!researchAuthorized(request))return NextResponse.json({ok:false,error:'Bitte zuerst in der App anmelden.'},{status:401,headers});
 try{
  const chartContext=await loadResearchChartContext();
  const ready=chartContext.nasdaq.status==='AVAILABLE'&&chartContext.russell.status==='AVAILABLE';
  return NextResponse.json({ok:true,status:ready?'AVAILABLE':'PARTIAL',generatedAt:new Date().toISOString(),chartContext,aiRequestsUsed:0},{headers});
 }catch{return NextResponse.json({ok:false,error:'Chartdaten derzeit nicht verfügbar.',aiRequestsUsed:0},{status:503,headers});}
}
