import {buildPriceReversalReading,PRICE_READING_VERSION} from './aiResearchPriceReversalReading';
import {buildRecoveryStudy,cleanRecoveryPoints,RECOVERY_POLICY,type RecoveryPoint} from './aiResearchAnticyclicalStudy';
import {completedDailyCutoff} from './aiResearchChartContext';
type Source={symbol:string;ok:boolean;points:RecoveryPoint[];firstDate:string|null;lastDate:string|null;rejectedNullRows:number;errorCode:string|null};
/** Dedicated bounded research read. Does not alter the established historical provider or normal report. */
export async function fetchRecoverySeries(symbol:string,cutoff:string):Promise<Source>{
 const fail=(code:string):Source=>({symbol,ok:false,points:[],firstDate:null,lastDate:null,rejectedNullRows:0,errorCode:code});
 try{
  cleanRecoveryPoints([],cutoff);
  const from=Math.floor(Date.parse(RECOVERY_POLICY.warmupStart+'T00:00:00Z')/1000),until=Math.floor(Date.parse(cutoff+'T00:00:00Z')/1000)+86400;
  const url='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(symbol)+'?interval=1d&period1='+from+'&period2='+until;
  const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},cache:'no-store',signal:AbortSignal.timeout(6500)});
  if(!r.ok)return fail('PRICE_HTTP_'+r.status);
  const data=await r.json(),chart=data?.chart?.result?.[0];
  if(data?.chart?.error||!chart||chart.meta?.symbol!==symbol)return fail('WRONG_OR_MISSING_SERIES');
  const times=chart.timestamp,closes=chart.indicators?.quote?.[0]?.close;
  if(!Array.isArray(times)||!Array.isArray(closes)||times.length!==closes.length)return fail('INVALID_SERIES_LENGTH');
  const points:RecoveryPoint[]=[];let rejectedNullRows=0;
  for(let i=0;i<times.length;i++){
   if(closes[i]===null){rejectedNullRows++;continue;}
   if(typeof times[i]!=='number'||!Number.isFinite(times[i])||typeof closes[i]!=='number'||!Number.isFinite(closes[i])||closes[i]<=0)return fail('INVALID_NUMERIC_ROW');
   // U.S. cash-index daily timestamps are mapped to their actual New York calendar day.
   const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(times[i]*1000));
   const get=(k:string)=>parts.find(p=>p.type===k)?.value;
   points.push({date:get('year')+'-'+get('month')+'-'+get('day'),close:closes[i]});
  }
  const cleaned=cleanRecoveryPoints(points,cutoff).points.filter(p=>p.date>=RECOVERY_POLICY.warmupStart);
  return {symbol,ok:cleaned.length>0,points:cleaned,firstDate:cleaned[0]?.date??null,lastDate:cleaned.at(-1)?.date??null,rejectedNullRows,errorCode:cleaned.length?null:'EMPTY_SERIES'};
 }catch(error){return fail(error instanceof Error&&error.message==='RECOVERY_CONFLICTING_DATE'?'CONFLICTING_DAILY_ROWS':'PRICE_READ_FAILED');}
}
let cached:{cutoff:string;expires:number;value:ReturnType<typeof buildRecoveryStudy>&{sources:Omit<Source,'points'>[];retrievedAt:string;servedFromCache:boolean;priceReversalReadings?:{version:string;markets:ReturnType<typeof buildPriceReversalReading>[]}}}|undefined;
let pending:{cutoff:string;promise:Promise<NonNullable<typeof cached>['value']>}|undefined;
export async function loadRecoveryStudy(now=new Date()){
 const cutoff=completedDailyCutoff(now);
 if(cached?.cutoff===cutoff&&Date.now()<cached.expires)return {...cached.value,servedFromCache:true};
 if(pending?.cutoff===cutoff)return pending.promise;
 const promise=(async()=>{
  const [nasdaq,russell,vix]=await Promise.all(['^NDX','^RUT','^VIX'].map(s=>fetchRecoverySeries(s,cutoff)));
  let priceReversalReadings: {version:string;markets:ReturnType<typeof buildPriceReversalReading>[]} | undefined;
  try{priceReversalReadings={version:PRICE_READING_VERSION,markets:[buildPriceReversalReading('NASDAQ',nasdaq.points,cutoff),buildPriceReversalReading('RUSSELL_2000',russell.points,cutoff)]};}catch{/* New diagnostics must not block existing studies. */}
  const value={...buildRecoveryStudy({nasdaq:nasdaq.points,russell:russell.points,vix:vix.points},cutoff),...(priceReversalReadings?{priceReversalReadings}:{}),sources:[nasdaq,russell,vix].map(({points,...source})=>source),retrievedAt:now.toISOString(),servedFromCache:false};
  // Failures remain visible and do not poison the long-lived successful-result cache.
  if([nasdaq,russell,vix].every(s=>s.ok&&s.lastDate===nasdaq.lastDate)&&value.markets.every(m=>m.status==='AVAILABLE'))cached={cutoff,expires:Date.now()+6*3600000,value};
  return value;
 })();
 const task={cutoff,promise};pending=task;
 try{return await promise;}finally{if(pending===task)pending=undefined;}
}
