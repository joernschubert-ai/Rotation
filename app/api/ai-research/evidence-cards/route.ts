import { researchAuthorized } from '@/lib/aiResearch/aiResearchSession';
import { evaluationInput } from '@/lib/aiResearch/aiResearchEvaluation';
import { buildEvidenceCards } from '@/lib/aiResearch/aiResearchEvidenceCards';
export const runtime='nodejs';export const dynamic='force-dynamic';
/** Read-only synthetic preview. No comparison runner, Redis, providers or model. */
export async function GET(request:Request){
  const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
  if(!researchAuthorized(request))return Response.json({ok:false,message:'Bitte in der App anmelden.',modelRequestsUsed:0},{status:401,headers});
  const id=new URL(request.url).searchParams.get('case')??'continuation';
  if(!['continuation','recovery'].includes(id))return Response.json({ok:false,message:'Prüffall nicht verfügbar.',modelRequestsUsed:0},{status:400,headers});
  try{const value=evaluationInput(id);if(!value)throw Error('Unavailable');return Response.json({ok:true,synthetic:true,evaluationCase:id,modelRequestsUsed:0,productionPromptChanged:false,...buildEvidenceCards(value.data)},{headers});}
  catch{return Response.json({ok:false,message:'Faktenkarten konnten nicht vorbereitet werden.',modelRequestsUsed:0},{status:500,headers});}
}
