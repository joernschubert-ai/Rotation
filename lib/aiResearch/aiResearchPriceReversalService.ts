import {fetchRecoverySeries} from './aiResearchAnticyclicalService';
import {completedDailyCutoff} from './aiResearchChartContext';
import {buildPriceReversalStudy} from './aiResearchPriceReversalStudy';
async function read(cutoff:string){const [n,r]=await Promise.all([fetchRecoverySeries('^NDX',cutoff),fetchRecoverySeries('^RUT',cutoff)]);return {...buildPriceReversalStudy({nasdaq:n.points,russell:r.points},cutoff),retrievedAt:new Date().toISOString(),sources:[n,r].map(({points,...source})=>source),servedFromCache:false};}
type Result=Awaited<ReturnType<typeof read>>;
let cached:{cutoff:string;until:number;value:Result}|undefined;
const pending=new Map<string,Promise<Result>>();
export async function loadPriceReversalStudy(now=new Date()){
 const cutoff=completedDailyCutoff(now);
 if(cached?.cutoff===cutoff&&Date.now()<cached.until)return {...cached.value,servedFromCache:true};
 const existing=pending.get(cutoff);if(existing)return existing;
 const task=read(cutoff).then(value=>{if(value.sources.every(s=>s.ok)&&value.markets.every(m=>m.status==='AVAILABLE'&&m.includes2012))cached={cutoff,until:Date.now()+6*3600000,value};return value;});
 pending.set(cutoff,task);try{return await task;}finally{if(pending.get(cutoff)===task)pending.delete(cutoff);}
}
