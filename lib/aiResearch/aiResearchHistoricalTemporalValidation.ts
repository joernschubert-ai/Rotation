import { historicalMarketStateSeries, type HistoricalStudyDay } from './aiResearchHistoricalMarketStudies';
type Episode={state:string;start:number;end:number;leftCensored:boolean};
type Outcome={start:number;end:number;state:string;value:number};
function summary(items:Outcome[]){
 const values=items.map(x=>x.value).sort((a,b)=>a-b),mean=values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
 const q=(p:number)=>{if(!values.length)return null;const i=(values.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return values[lo]+(values[hi]-values[lo])*(i-lo);};
 return {count:items.length,meanReturn:mean,medianReturn:q(.5),p10Return:q(.1),p90Return:q(.9),positiveRate:values.length?100*values.filter(x=>x>0).length/values.length:null};
}
export function buildHistoricalTemporalValidation(input:HistoricalStudyDay[],asOfDate:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)||!Number.isFinite(Date.parse(asOfDate+'T00:00:00Z'))||new Date(asOfDate+'T00:00:00Z').toISOString().slice(0,10)!==asOfDate)throw Error('Valid historical cutoff date required');
 const sorted=[...input].sort((a,b)=>a.date.localeCompare(b.date)),seen=new Set<string>();
 for(const d of sorted){const n=Date.parse(d.date+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==d.date||seen.has(d.date)||![d.nasdaq,d.russell,d.sp500,d.vix].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>0))throw Error('Unique valid historical dates and positive prices required');seen.add(d.date);}
 const days=sorted.filter(d=>d.date<=asOfDate);
 const studies=[];
 for(const market of ['NASDAQ','RUSSELL_2000'] as const){
  const price=days.map(d=>market==='NASDAQ'?d.nasdaq:d.russell);
  for(const family of historicalMarketStateSeries(days,market)){
   const states=family.states,episodes:Episode[]=[];
   for(let i=0;i<states.length;i++){const state=states[i];if(state===null)continue;const prior=episodes.at(-1);if(i>0&&states[i-1]===state&&prior){prior.end=i;}else episodes.push({state,start:i,end:i,leftCensored:i===0||states[i-1]===null});}
   const known=episodes.filter(e=>!e.leftCensored),labels=[...new Set(episodes.map(e=>e.state))].sort(),first=states.findIndex(s=>s!==null),current=states.at(-1)??null;
   const cut1=first<0?0:first+Math.floor((days.length-first)*.6),cut2=first<0?0:first+Math.floor((days.length-first)*.8);
   const describe=(e:Episode)=>({state:e.state,startDate:days[e.start].date,endDate:days[e.end].date,observedIntervals:e.end-e.start,leftCensored:e.leftCensored,ongoing:e.end===days.length-1});
   const statistics=([5,20,60] as const).map(horizon=>{
    const mature:Outcome[]=known.filter(e=>e.start+horizon<days.length).map(e=>({start:e.start,end:e.start+horizon,state:e.state,value:100*(price[e.start+horizon]/price[e.start]-1)}));
    const stateResults=labels.map(state=>{const matched=mature.filter(e=>e.state===state),selected:Outcome[]=[];for(const o of matched)if(!selected.length||o.start>=selected[selected.length-1].end)selected.push(o);
     return {state,currentState:state===current,observedDays:states.filter(s=>s===state).length,knownEpisodeStarts:known.filter(e=>e.state===state).length,mature:summary(matched),notYetMatureStarts:known.filter(e=>e.state===state&&e.start+horizon>=days.length).length,
      nonOverlappingEpisodeStarts:summary(selected),adjacentOutcomeOverlapCount:matched.filter((o,i)=>i>0&&o.start<matched[i-1].end).length};});
    const folds=([{testStart:cut1,testEnd:cut2-1},{testStart:cut2,testEnd:days.length-1}]).filter(f=>f.testStart>0&&f.testEnd>=f.testStart).map((f,i)=>{
     const training=mature.filter(o=>o.end<f.testStart),testing=mature.filter(o=>o.start>=f.testStart&&o.start<=f.testEnd&&o.end<=f.testEnd);
     const unresolved=known.filter(e=>e.start>=f.testStart&&e.start<=f.testEnd&&e.start+horizon>f.testEnd);
     return {fold:i+1,testStartDate:days[f.testStart].date,testEndDate:days[f.testEnd].date,
      latestTrainingOutcomeEndDate:training.length?days[Math.max(...training.map(o=>o.end))].date:null,
      earliestTestEntryDate:testing.length?days[Math.min(...testing.map(o=>o.start))].date:null,
      latestTestOutcomeEndDate:testing.length?days[Math.max(...testing.map(o=>o.end))].date:null,
      trainingReference:summary(training),testReference:summary(testing),excludedUnmaturedTestStarts:unresolved.length,
      states:labels.map(state=>{const train=summary(training.filter(o=>o.state===state)),test=summary(testing.filter(o=>o.state===state));return {state,train,test,trainExcessMeanPp:train.meanReturn!==null&&summary(training).meanReturn!==null?train.meanReturn-summary(training).meanReturn!:null,testExcessMeanPp:test.meanReturn!==null&&summary(testing).meanReturn!==null?test.meanReturn-summary(testing).meanReturn!:null,meanSignAgreement:train.meanReturn===null||test.meanReturn===null?'UNKNOWN':Math.sign(train.meanReturn)===Math.sign(test.meanReturn)?'SAME_SIGN':'DIFFERENT_SIGN'};})};
    });
    return {horizonIntervals:horizon,referenceEpisodeOutcomes:summary(mature),states:stateResults,folds};
   });
   studies.push({market,family:family.family,definition:family.definition,currentState:current,firstEligibleDate:first<0?null:days[first].date,totalEpisodes:episodes.length,knownEpisodeStarts:known.length,leftCensoredEpisodes:episodes.filter(e=>e.leftCensored).length,currentEpisode:episodes.length?describe(episodes[episodes.length-1]):null,lastFiveEpisodes:episodes.slice(-5).map(describe),statistics});
  }
 }
 return {version:'HISTORY_EPISODES_V1' as const,asOfDate:days.at(-1)?.date??null,requestedCutoff:asOfDate,observations:days.length,excludedAfterCutoff:sorted.length-days.length,
  validationStatus:'CHRONOLOGICAL_DESCRIPTIVE_NOT_PREDICTIVE_VALIDATION' as const,predictiveEdgeValidated:false as const,
  policy:{entry:'Known state-transition close',reference:'All known-start episode transitions in same family and period',folds:'Fixed 60/20/20 chronological split after state warmup; only matured outcomes within each boundary',fit:'No training or parameter optimization; all states reported, no winner selection'},studies,
  limitations:[
   'Episodes mean consecutive supplied observations, not a verified complete exchange calendar. First warmup episode is left-censored and excluded from entry statistics.',
   'Episode-start returns differ from daily-state studies; their baseline is episode transitions, not daily dates or matched controls.',
   'Outcome windows may overlap even between episodes. Spacing and folds do not prove independent samples or predictive superiority.',
   'Fixed-rule chronological holdouts are descriptive stability diagnostics, not a validated live forecast or a fitted model out-of-sample result.',
   'No confidence intervals, statistical significance, multiple-testing correction, historical breadth universe, macro vintages or option returns computed.'
  ]};
}
export type HistoricalTemporalValidation=ReturnType<typeof buildHistoricalTemporalValidation>;
