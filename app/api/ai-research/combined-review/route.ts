import {researchAuthorized} from '@/lib/aiResearch/aiResearchSession';
import {readCombinedReview} from '@/lib/aiResearch/aiResearchCombinedReview';
import {combinedReviewPage} from '@/lib/aiResearch/aiResearchCombinedReviewPage';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const json=(v:unknown,status=200)=>Response.json(v,{status,headers});
export async function GET(request:Request){if(!researchAuthorized(request))return json({ok:false,modelRequestsUsed:0},401);return new Response(combinedReviewPage(),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});}
export async function POST(request:Request){
 if(!researchAuthorized(request))return json({ok:false,modelRequestsUsed:0},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false,modelRequestsUsed:0},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({ok:false,modelRequestsUsed:0},415);
 try{if(Number(request.headers.get('content-length')??0)>1024)return json({ok:false,modelRequestsUsed:0},413);const text=await request.text();if(Buffer.byteLength(text)>1024)return json({ok:false,modelRequestsUsed:0},413);const b=JSON.parse(text);if(!b||Array.isArray(b)||typeof b!=='object'||Object.keys(b).length!==2||b.action!=='read'||!Object.hasOwn(b,'baseEpisodeId'))throw Error('READ_ONLY_ACTION');return json(await readCombinedReview(b.baseEpisodeId));}
 catch(error){return json({ok:false,version:'COMBINED_REVIEW_V1',readOnly:true,modelRequestsUsed:0,memoryWritten:false,message:error instanceof Error?error.message:'READ_UNAVAILABLE',note:'Keine Ersatzgenerierung und keine automatische Wiederholung.'},400);}
}
