export type RecoveryPoint={date:string;close:number};
export const RECOVERY_POLICY={version:'ANTICYCLICAL_CLOSE_STUDY_V1',startDate:'2012-01-01',warmupStart:'2011-01-01',horizons:[5,20,60,80] as const,
 entry:'FIRST_OBSERVED_CLOSE_AFTER_SIGNAL',parameters:{shock1DPct:-3,drop5Pct:-7,drawdown252Pct:-10,rsiPeriod:14,rsiOversold:30,maPeriod:20,recentStressIntervals:20,vixStress:30,vixDeclinePct:-10},
 fitted:false,optionsReturns:false,automaticExecution:false} as const;
const validDay=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const pct=(a:number,b:number)=>100*(a/b-1);
const mean=(a:number[])=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
const quantile=(a:number[],p:number)=>{if(!a.length)return null;const v=[...a].sort((x,y)=>x-y),j=(v.length-1)*p,l=Math.floor(j);return v[l]+(v[Math.ceil(j)]-v[l])*(j-l);};
export function cleanRecoveryPoints(raw:RecoveryPoint[],cutoff:string){
 if(!validDay(cutoff))throw Error('RECOVERY_INVALID_CUTOFF');
 const points=new Map<string,number>();let duplicateCount=0,excludedAfterCutoff=0;
 for(const row of raw){
  if(!row||!validDay(row.date)||typeof row.close!=='number'||!Number.isFinite(row.close)||row.close<=0)throw Error('RECOVERY_INVALID_ROW');
  if(row.date>cutoff){excludedAfterCutoff++;continue;}
  if(points.has(row.date)){duplicateCount++;if(points.get(row.date)!==row.close)throw Error('RECOVERY_CONFLICTING_DATE');}
  points.set(row.date,row.close);
 }
 return {points:[...points].sort(([a],[b])=>a.localeCompare(b)).map(([date,close])=>({date,close})),duplicateCount,excludedAfterCutoff};
}
/** Wilder smoothing; a flat initial window is explicitly 50, no gains 0, no losses 100. */
export function recoveryRSI(prices:number[],period=14):Array<number|null>{
 if(!Number.isInteger(period)||period<2||prices.some(p=>!Number.isFinite(p)||p<=0))throw Error('RSI_INVALID_INPUT');
 const out:Array<number|null>=prices.map(()=>null);if(prices.length<=period)return out;
 let gain=0,loss=0;
 const value=()=>loss===0?gain===0?50:100:100-100/(1+gain/loss);
 for(let i=1;i<=period;i++){const d=prices[i]-prices[i-1];gain+=Math.max(0,d)/period;loss+=Math.max(0,-d)/period;}
 out[period]=value();
 for(let i=period+1;i<prices.length;i++){const d=prices[i]-prices[i-1];gain=(gain*(period-1)+Math.max(0,d))/period;loss=(loss*(period-1)+Math.max(0,-d))/period;out[i]=value();}
 return out;
}
type Feature={date:string;close:number;return1:number|null;return5:number|null;drawdown252:number|null;rsi14:number|null;ma20:number|null;ma200:number|null;stress:boolean|null;vix:number|null;vixPrevious:number|null};
type Rule={id:string;title:string;stage:'EARLY_ZONE'|'FIRST_RECOVERY';definition:string;series:Array<boolean|null>};
export function recoveryFeatures(points:RecoveryPoint[],vix:RecoveryPoint[]){
 const closes=points.map(p=>p.close),rsi=recoveryRSI(closes),vol=new Map(vix.map(p=>[p.date,p.close]));
 return points.map((p,i):Feature=>{const return1=i?pct(p.close,closes[i-1]):null,return5=i>=5?pct(p.close,closes[i-5]):null;
  const drawdown252=i>=251?pct(p.close,Math.max(...closes.slice(i-251,i+1))):null;
  return {date:p.date,close:p.close,return1,return5,drawdown252,rsi14:rsi[i],ma20:i>=19?mean(closes.slice(i-19,i+1)):null,ma200:i>=199?mean(closes.slice(i-199,i+1)):null,
   stress:(return1!==null&&return1<=-3)||(return5!==null&&return5<=-7)||(drawdown252!==null&&drawdown252<=-10)?true:return1!==null&&return5!==null&&drawdown252!==null?false:null,
   vix:vol.get(p.date)??null,vixPrevious:i?vol.get(points[i-1].date)??null:null};});
}
function rules(features:Feature[]):Rule[]{
 const map=(f:(x:Feature,i:number)=>boolean|null)=>features.map(f);
 const stressBefore=(i:number)=>{const rows=features.slice(Math.max(0,i-20),i);return rows.some(r=>r.stress===true)?true:rows.length===20&&rows.every(r=>r.stress!==null)?false:null;};
 return [
  {id:'SHOCK_1D',title:'Starker Tagesabverkauf',stage:'EARLY_ZONE',definition:'Eigener Schlusskursverlust mindestens 3 Prozent in einem beobachteten Intervall.',series:map(x=>x.return1===null?null:x.return1<=-3)},
  {id:'DROP_5D',title:'Schneller Kursrueckgang',stage:'EARLY_ZONE',definition:'Eigener Schlusskursverlust mindestens 7 Prozent ueber fuenf beobachtete Intervalle.',series:map(x=>x.return5===null?null:x.return5<=-7)},
  {id:'DRAWDOWN_252',title:'Ausgepraegter Rueckgang vom Jahreshoch',stage:'EARLY_ZONE',definition:'Mindestens 10 Prozent unter dem hoechsten Schluss der letzten 252 Beobachtungen.',series:map(x=>x.drawdown252===null?null:x.drawdown252<=-10)},
  {id:'RSI_OVERSOLD',title:'RSI unter 30',stage:'EARLY_ZONE',definition:'Wilder-RSI ueber 14 Intervalle unter 30. Ueberverkauftheit, noch keine Umkehr.',series:map(x=>x.rsi14===null?null:x.rsi14<30)},
  {id:'RSI_RECLAIM',title:'RSI kehrt ueber 30 zurueck',stage:'FIRST_RECOVERY',definition:'Vorheriger RSI unter 30, heutiger RSI mindestens 30. Kein Rueckblick auf ein spaeteres Tief.',series:map((x,i)=>!i||x.rsi14===null||features[i-1].rsi14===null?null:features[i-1].rsi14!<30&&x.rsi14>=30)},
  {id:'MA20_RECLAIM_STRESS',title:'MA20 nach Verkaufsdruck zurueckerobert',stage:'FIRST_RECOVERY',definition:'Schluss wechselt von unter/auf MA20 nach ueber MA20; in den 20 vorherigen Intervallen mindestens ein definierter Stresszustand.',series:map((x,i)=>!i||x.ma20===null||features[i-1].ma20===null||stressBefore(i)===null?null:stressBefore(i)===true&&features[i-1].close<=features[i-1].ma20!&&x.close>x.ma20)},
  {id:'VIX_RETREAT',title:'Volatilitaetsstress laesst nach',stage:'FIRST_RECOVERY',definition:'VIX am vorigen eigenen Kurstag mindestens 30 und heute mindestens 10 Prozent tiefer; eigener Index steigt. VIX ist gemeinsamer SPX-Optionskontext.',series:map(x=>x.vix===null||x.vixPrevious===null||x.return1===null?null:x.vixPrevious>=30&&pct(x.vix,x.vixPrevious)<=-10&&x.return1>0)},
 ];
}
type Outcome={status:'MATURED'|'WAITING_FOR_ANCHOR'|'WAITING_FOR_HORIZON';signalDate:string;anchorDate:string|null;endDate:string|null;indexReturnPct:number|null;worstCloseChangePct:number|null;bestCloseChangePct:number|null;recoveredPrior20High:boolean|null;observedIntervals:number;};
function outcome(points:RecoveryPoint[],signal:number,horizon:number):Outcome{
 const anchor=signal+1,end=anchor+horizon,available=Math.max(0,points.length-1-anchor),reference=signal>=20?Math.max(...points.slice(signal-20,signal).map(p=>p.close)):null;
 const base={signalDate:points[signal].date,anchorDate:points[anchor]?.date??null,endDate:points[end]?.date??null,indexReturnPct:null,worstCloseChangePct:null,bestCloseChangePct:null,recoveredPrior20High:null,observedIntervals:Math.min(horizon,available)};
 if(anchor>=points.length)return {...base,status:'WAITING_FOR_ANCHOR'};
 if(end>=points.length)return {...base,status:'WAITING_FOR_HORIZON'};
 const path=points.slice(anchor,end+1).map(p=>p.close),start=points[anchor].close;
 return {...base,status:'MATURED',indexReturnPct:pct(points[end].close,start),worstCloseChangePct:pct(Math.min(...path),start),bestCloseChangePct:pct(Math.max(...path),start),recoveredPrior20High:reference===null?null:Math.max(...path)>=reference};
}
function summarize(outcomes:Outcome[]){
 const mature=outcomes.filter(o=>o.status==='MATURED'),returns=mature.map(o=>o.indexReturnPct!),loss=mature.map(o=>o.worstCloseChangePct!),n=mature.length;
 const dipped1to2=mature.filter(o=>o.worstCloseChangePct!>=-2&&o.worstCloseChangePct!<=-1);
 return {matureCases:n,waitingForAnchor:outcomes.filter(o=>o.status==='WAITING_FOR_ANCHOR').length,waitingForHorizon:outcomes.filter(o=>o.status==='WAITING_FOR_HORIZON').length,
  meanReturnPct:mean(returns),medianReturnPct:quantile(returns,.5),p10ReturnPct:quantile(returns,.1),p90ReturnPct:quantile(returns,.9),
  positiveCount:returns.filter(v=>v>0).length,positiveSharePct:n?100*returns.filter(v=>v>0).length/n:null,
  medianWorstFurtherCloseChangePct:quantile(loss,.5),p10WorstFurtherCloseChangePct:quantile(loss,.1),worstFurtherCloseChangePct:n?Math.min(...loss):null,
  atMost2PctFurtherLossCount:loss.filter(v=>v>=-2).length,
  dipped1to2PctCases:dipped1to2.length,positiveEndAfter1to2PctDipCount:dipped1to2.filter(o=>o.indexReturnPct!>0).length,
  recoveredPrior20HighCount:mature.filter(o=>o.recoveredPrior20High===true).length,
  descriptiveOnly:true};
}
export function buildOwnRecoveryStudy(market:'NASDAQ'|'RUSSELL_2000',symbol:string,raw:RecoveryPoint[],rawVix:RecoveryPoint[],cutoff:string){
 const cleaned=cleanRecoveryPoints(raw,cutoff),points=cleaned.points,vol=cleanRecoveryPoints(rawVix,cutoff),features=recoveryFeatures(points,vol.points);
 const eligibleIndex=points.findIndex(p=>p.date>=RECOVERY_POLICY.startDate),has2012=points.some(p=>p.date.startsWith('2012-'));
 const studies=rules(features).map(rule=>{
  const starts:number[]=[],leftCensored:number[]=[];
  for(let i=0;i<points.length;i++)if(points[i].date>=RECOVERY_POLICY.startDate&&rule.series[i]===true){if(i===0||rule.series[i-1]===null)leftCensored.push(i);else if(rule.series[i-1]===false)starts.push(i);}
  const eligible=features.map((f,i)=>f.date>=RECOVERY_POLICY.startDate&&rule.series[i]!==null?i:-1).filter(i=>i>=0);
  const horizons=RECOVERY_POLICY.horizons.map(h=>{
   const spaced:number[]=[];for(const i of starts)if(!spaced.length||i>spaced[spaced.length-1]+h)spaced.push(i);
   const all=starts.map(i=>outcome(points,i,h)),selected=spaced.map(i=>outcome(points,i,h));
   const baseline=eligible.map(i=>outcome(points,i,h)),reference=summarize(baseline),nonOverlapping=summarize(selected);
   const periods=[['2012-01-01','2016-12-31'],['2017-01-01','2021-12-31'],['2022-01-01',cutoff]].map(([from,to])=>{
    const inside=(o:Outcome)=>o.signalDate>=from&&o.signalDate<=to;
    // Endpoints must stay inside the same dated block; no later outcome enters an earlier block.
    const block=(xs:Outcome[])=>summarize(xs.filter(inside).filter(o=>o.endDate!==null&&o.endDate<=to));
    return {from,to,cases:block(all),baseline:block(baseline),notMatureWithinBlock:all.filter(o=>inside(o)&&(o.endDate===null||o.endDate>to)).length};
   });
   return {horizonIntervals:h,allEpisodeStarts:summarize(all),nonOverlapping,baseline:reference,
    excessMeanPp:nonOverlapping.meanReturnPct!==null&&reference.meanReturnPct!==null?nonOverlapping.meanReturnPct-reference.meanReturnPct:null,
    overlappingStartsExcluded:starts.length-spaced.length,periods,
    byMA200:['ABOVE_OR_ON','BELOW','UNKNOWN'].map(state=>({state,summary:summarize(spaced.filter(i=>features[i].ma200===null?state==='UNKNOWN':(features[i].close>=features[i].ma200!?'ABOVE_OR_ON':'BELOW')===state).map(i=>outcome(points,i,h)))})),
    episodes:starts.map((i,j)=>({...all[j],selectedNonOverlapping:spaced.includes(i)}))};
  });
  const lastStart=starts.at(-1),last=points.length-1;
  return {id:rule.id,title:rule.title,stage:rule.stage,definition:rule.definition,firstEligibleDate:eligible.length?points[eligible[0]].date:null,knownEpisodeStarts:starts.length,leftCensoredStartsExcluded:leftCensored.length,
   current:{active:rule.series.at(-1)??null,latestSignalDate:lastStart===undefined?null:points[lastStart].date,intervalsSinceSignal:lastStart===undefined?null:last-lastStart,recentSignalWithin10:lastStart!==undefined&&last-lastStart<=10},horizons};
 });
 return {market,symbol,status:points.length>=252?'AVAILABLE':points.length?'PARTIAL':'UNAVAILABLE',firstSuppliedDate:points[0]?.date??null,lastSuppliedDate:points.at(-1)?.date??null,
  coverage:{requestedStudyStart:RECOVERY_POLICY.startDate,firstStudyObservation:eligibleIndex<0?null:points[eligibleIndex].date,historyIncludes2012:has2012,observations:points.length,studyObservations:points.filter(p=>p.date>=RECOVERY_POLICY.startDate).length,duplicateRows:cleaned.duplicateCount,excludedAfterCutoff:cleaned.excludedAfterCutoff,exchangeCalendarCompletenessVerified:false},
  currentFeatures:features.at(-1)??null,studies};
}
export function buildRecoveryStudy(data:{nasdaq:RecoveryPoint[];russell:RecoveryPoint[];vix:RecoveryPoint[]},cutoff:string){
 const markets=[buildOwnRecoveryStudy('NASDAQ','^NDX',data.nasdaq,data.vix,cutoff),buildOwnRecoveryStudy('RUSSELL_2000','^RUT',data.russell,data.vix,cutoff)];
 return {ok:markets.some(m=>m.coverage.observations>0),status:markets.every(m=>m.status==='AVAILABLE')&&data.vix.length?'AVAILABLE':markets.some(m=>m.coverage.observations>0)?'PARTIAL':'UNAVAILABLE',version:RECOVERY_POLICY.version,policy:RECOVERY_POLICY,requestedCutoff:cutoff,modelRequestsUsed:0,memoryWritten:false,productionChanged:false,
  markets,
  missingHistoricalInputs:['Historical constituent breadth/BPI/advance-decline volume','OHLC/ATR and intraday execution prices','Historical option prices and implied volatility','Point-in-time macro explanations'],
  limitations:['Fixed descriptive rules, not optimized or validated tipping points. Oversold can persist. All rules and negative cases retained.',
   'Signal known at its own close; comparison begins at the NEXT observed close. Not an attainable intraday execution claim.',
   '5/20/60/80 observed intervals, not calendar weeks or exact months. No forward filling; calendar completeness not verified.',
   'All and spaced episodes reported separately. Spacing is horizon-specific and chosen before observing returns; no independent trial count or significance claim.',
   'Worst additional decline is the lowest daily close relative to anchor, not intraday drawdown. Unmatured cases remain pending.',
   'Price-index close returns exclude dividends, execution costs and option/warrant pricing. Historical index returns are not option/warrant returns. No automatic sizing, purchases or additions.']};
}
