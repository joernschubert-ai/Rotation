import { loadHistoricalRegimeMarketData } from '@/lib/historicalRegime/historicalRegimeProvider';
import { buildChartContext, completedDailyCutoff } from './aiResearchChartContext';
type Result=ReturnType<typeof buildChartContext>;
let cached:{value:Result;expires:number;cutoff:string}|undefined;
let pending:{promise:Promise<Result>;cutoff:string}|undefined;
export async function loadResearchChartContext(now=new Date()):Promise<Result>{
 const cutoff=completedDailyCutoff(now);
 if(cached&&cached.cutoff===cutoff&&Date.now()<cached.expires)return cached.value;
 if(pending?.cutoff===cutoff)return pending.promise;
 const promise=(async()=>{
  const data=await loadHistoricalRegimeMarketData();
  const result=buildChartContext(data,cutoff);
  // Do not retain missing/partial providers for an hour.
  if(result.nasdaq.status==='AVAILABLE'&&result.russell.status==='AVAILABLE')cached={value:result,cutoff,expires:Date.now()+3600000};
  return result;
 })();
 const current={promise,cutoff};pending=current;
 try{return await promise;}finally{if(pending===current)pending=undefined;}
}
