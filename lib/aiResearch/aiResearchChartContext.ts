import { priceTrajectory } from "./aiResearchPriceTrajectory";
import { buildFormationHistory, type FormationHistory } from "./aiResearchFormationHistory";
import { buildFormationContext } from "./aiResearchFormations";
import { buildMomentumContext } from "./aiResearchMomentumContext";
export type ChartPoint = { date: string; close: number };
const validDate=(date:string)=>{const time=Date.parse(date+'T00:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===date;};
const mean=(xs:number[])=>xs.reduce((a,b)=>a+b,0)/xs.length;
const pct=(a:number,b:number)=>100*(a/b-1);
const rounded=(x:number|null)=>x===null?null:Math.round(x*10000)/10000;

/** Conservative daily-only cut: today's bar is excluded before 18:00 New York. */
export function completedDailyCutoff(now:Date):string{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const get=(name:string)=>parts.find(p=>p.type===name)?.value??'';
 const day=`${get('year')}-${get('month')}-${get('day')}`;
 return Number(get('hour'))>=18?day:new Date(Date.parse(day+'T00:00:00Z')-86400000).toISOString().slice(0,10);
}

export function buildOwnChartContext(symbol:string,raw:ChartPoint[],asOfDate:string){
 if(!validDate(asOfDate))throw Error('Invalid chart cutoff');
 const byDate=new Map<string,number>();let rejected=0,duplicates=0;
 for(const p of raw){
  if(!p||typeof p.date!=='string'||!validDate(p.date)||typeof p.close!=='number'||!Number.isFinite(p.close)||p.close<=0){rejected++;continue;}
  if(p.date>asOfDate)continue;
  if(byDate.has(p.date)){duplicates++;if(byDate.get(p.date)!==p.close)throw Error('Conflicting daily chart observations');}
  byDate.set(p.date,p.close);
 }
 const points=Array.from(byDate,([date,close])=>({date,close})).sort((a,b)=>a.date.localeCompare(b.date));
 const closes=points.map(p=>p.close),n=closes.length,last=closes[n-1]??null;
 const moving=(period:number,end=n)=>end>=period?mean(closes.slice(end-period,end)):null;
 const ma=(period:number)=>{const value=moving(period),previous=moving(period,n-5);return {period,closeAverage:rounded(value),distancePct:rounded(last!==null&&value!==null?pct(last,value):null),slope5SessionsPct:rounded(value!==null&&previous!==null?pct(value,previous):null)};};
 const extrema=(period:number)=>{const values=closes.slice(Math.max(0,n-1-period),n-1);return values.length===period?{highClose:Math.max(...values),lowClose:Math.min(...values)}:null;};
 const prior20=extrema(20),prior63=extrema(63),prior252=extrema(252);
 const episodes=(level:number,window:number)=>{
  let count=0,lastTouch=-100;
  const start=Math.max(0,n-1-window);
  for(let i=start;i<n-1;i++)if(Math.abs(pct(closes[i],level))<=0.5){if(i-lastTouch>=4)count++;lastTouch=i;}
  return count;
 };
 const zone=(level:number,side:'HIGH'|'LOW')=>({basis:'PRIOR_20_SESSION_CLOSE_EXTREME' as const,side,referenceClose:rounded(level),tolerancePct:0.5,independentTouchEpisodes:episodes(level,20),distancePct:rounded(last===null?null:pct(last,level)),nearZone:last!==null&&Math.abs(pct(last,level))<=1});
 const highZone=prior20?zone(prior20.highClose,'HIGH'):null,lowZone=prior20?zone(prior20.lowClose,'LOW'):null;
 const previousWindow=closes.slice(n-22,n-2);
 const breakoutReference=n>=22?{high:Math.max(...previousWindow),low:Math.min(...previousWindow)}:null;
 const failedUp=!!(breakoutReference&&last!==null&&closes[n-2]>breakoutReference.high&&last<=breakoutReference.high);
 const failedDown=!!(breakoutReference&&last!==null&&closes[n-2]<breakoutReference.low&&last>=breakoutReference.low);
 const width=(end:number)=>{if(end<20)return null;const values=closes.slice(end-20,end);return pct(Math.max(...values),Math.min(...values));};
 const currentWidth=width(n),previousWidth=width(n-20);
 const max252=n>=252?Math.max(...closes.slice(-252)):null;
 let formationHistory:FormationHistory|null=null;let formationHistoryError:string|null=null;
 try { formationHistory=buildFormationHistory(points); } catch { formationHistoryError="Historical formation study unavailable"; }
 return {
  symbol,asOfDate:points[n-1]?.date??null,requestedCutoff:asOfDate,status:n>=200?'AVAILABLE':n>=21?'PARTIAL':'INSUFFICIENT_DATA',observationCount:n,
  basis:'DAILY_CLOSE_ONLY' as const,lastClose:last,priceTrajectory:priceTrajectory(points,asOfDate),momentum:buildMomentumContext(closes),formations:buildFormationContext(points),formationHistory,
  return5SessionsPct:rounded(n>5?pct(last!,closes[n-6]):null),return20SessionsPct:rounded(n>20?pct(last!,closes[n-21]):null),
  movingAverages:[ma(20),ma(50),ma(200)],prior20,prior63,prior252,
  drawdownFrom252SessionHighClosePct:rounded(last!==null&&max252!==null?pct(last,max252):null),
  zones:{high:highZone,low:lowZone},
  observations:{nearRepeatedHighCloseZone:!!(highZone&&highZone.nearZone&&highZone.independentTouchEpisodes>=3),nearRepeatedLowCloseZone:!!(lowZone&&lowZone.nearZone&&lowZone.independentTouchEpisodes>=3),
   failedPrior20CloseBreakout:failedUp,failedPrior20CloseBreakdown:failedDown,
   closeRange20SessionsPct:rounded(currentWidth),previous20SessionRangePct:rounded(previousWidth),
   narrowerCloseRange:currentWidth!==null&&previousWidth!==null?currentWidth<previousWidth:null},
  diagnostics:{rejectedObservations:rejected,duplicateObservations:duplicates,formationHistoryError},
  limitations:['Close-derived zones are descriptive references, not validated support/resistance or trading signals.','No OHLC, intraday, volume, ATR, candle patterns or all-time-high claim. Only explicitly labelled conditional P&F projections, no guaranteed targets.','Fixed tolerances and lookbacks are definitions, not optimized or statistically validated edges.','Touch episodes require at least three sessions without a near-zone touch between episodes.','No future observations used; daily dates do not establish intraday entry availability.'],
 };
}

export function buildChartContext(data:{nasdaq:{points:ChartPoint[]};russell:{points:ChartPoint[]}},asOfDate:string){
 const nasdaq=buildOwnChartContext('^NDX',data.nasdaq.points,asOfDate);
 const russell=buildOwnChartContext('^RUT',data.russell.points,asOfDate);
 return {version:'DAILY_CLOSE_FORMATION_RESEARCH_V4',cutoff:asOfDate,nasdaq,russell,
  predictiveEdgeValidated:false,automaticExecution:false,
  note:'Independent own-index observations; Russell is not gated by Nasdaq. No AI model call.'};
}


export type ResearchChartContext=ReturnType<typeof buildChartContext>;
