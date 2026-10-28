import type { SynthesisEvidence } from './aiResearchSynthesisEvidence';
const obj=(v:unknown):Record<string,any>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const num=(v:unknown):number|null=>typeof v==='number'&&Number.isFinite(v)?v:null;
export function explicitCOTFacts(value:unknown){
 const data=obj(value);
 return {observationOnly:true,publicationTimeKnown:false,
  groups:(Array.isArray(data.summaries)?data.summaries:[]).map((g:any)=>{
   const net=num(g.netPosition);
   return {group:g.group,observationDate:g.reportDate,netPosition:net,
    netState:net===null?'UNBEKANNT':net>0?'NETTO_LONG':net<0?'NETTO_SHORT':'AUSGEGLICHEN',
    changes:[['weeklyChange',1],['change4W',4],['change13W',13],['change26W',26]].map(([key,weeks])=>{
     const delta=num(g[String(key)]),previous=net!==null&&delta!==null?net-delta:null;
     return {weeks,delta,previousNet:previous,
      shift:delta===null?'UNBEKANNT':delta>0?'RICHTUNG_LONG':delta<0?'RICHTUNG_SHORT':'UNVERAENDERT',
      fact:net===null||delta===null?'Unbekannt':
       net<0&&delta>0?'Weniger netto short, NICHT netto long.':net>0&&delta<0?'Weniger netto long, NICHT netto short.':'Nettozustand und Änderungsrichtung getrennt.'};
    }),percentile52W:g.percentile,zScore:g.zScore};
  }),meaning:'Nettoänderung ist kein Nachweis neuer Brutto-Longs oder Brutto-Shorts. RICHTUNG_LONG bedeutet nicht NETTO_LONG. Keine Motive oder Signifikanz ableiten.'};
}
/** Compare only a completed close and averages from the SAME dated chart block. */
export function buildNarrativeFacts(evidence:SynthesisEvidence[]){
 const get=(id:string)=>{const e=evidence.find(e=>e.id===id&&e.available);return e?e.data:null;};
 const app=obj(get('APP'));
 return {inputVersion:'DATED_FACT_BLOCKS_V35',
  indices:Object.fromEntries(['NASDAQ','RUSSELL_2000'].map(market=>{
   const chart=obj(get('CHART_'+market)),close=num(chart.lastClose);
   const averages=(Array.isArray(chart.movingAverages)?chart.movingAverages:[]).map((m:any)=>{
    const average=num(m.closeAverage),period=num(m.period);
    const valid=close!==null&&close>0&&average!==null&&average>0;
    const relation=valid?(close!>average!?'ÜBER':close!<average!?'UNTER':'AUF'):'UNBEKANNT';
    return {period,average,relation,distancePct:valid?Number(((close!/average!-1)*100).toFixed(3)):null,
     fact:valid?`Schlusskurs ${close} liegt ${relation} MA${period} ${average}; Stand ${chart.asOfDate}.`:'Keine vergleichbare Kursrelation vorhanden.'};
   });
   const history=obj(get('HISTORY_'+market));
   return [market,{structure:obj(app.instrumentStructure)[market]??null,
    snapshotPrice:get('PRICE_'+market),
    completedChart:{asOfDate:chart.asOfDate??null,lastClose:close,averages,
     return5SessionsPct:chart.return5SessionsPct,return20SessionsPct:chart.return20SessionsPct,
     drawdownFrom252SessionHighClosePct:chart.drawdownFrom252SessionHighClosePct,
     formations:chart.formations??null,formationHistory:chart.formationHistory??null,prior20:chart.prior20??null,priceTrajectory:chart.priceTrajectory??null,
     note:'Relations above use chart close only. Snapshot quote may differ. Formation event date and current column are separate; do not invent pattern names.'},
    cotFacts:explicitCOTFacts(get('COT_'+market)),
    historicalStudies:(Array.isArray(history.studies)?history.studies:[]).map((s:any)=>({family:s.family,state:s.state,asOfDate:s.asOfDate,currentMatch:s.currentMatch,focus20D:s.focus20D})),
    historyMeaning:'20-session historical INDEX forward returns: meanPct absolute, baselineMeanPct comparison, excessMeanPp difference in percentage points. Not current trend or next-return forecast.'}];
  })),
  sharedContext:{rotationComparison:app.rotationComparison,master:app.master,volatility:app.volatility,volatilityDataQuality:app.volatilityDataQuality,credit:app.credit,
   nasdaqOnly:{rotation:app.rotation,fragility:app.fragility,liquidity:app.liquidity},appFlows:app.flows},
  news:evidence.filter(e=>e.kind==='NEWS'&&e.available).map(e=>e.data),
  weights:{marketStructure:35,chart:35,cot:10,history:15,news:5},
  limitations:'Weights are starting research priorities, no computed score or calibrated success odds. Missing evidence stays missing. No option prices, implied volatility or validated combined predictive edge supplied.'};
}
