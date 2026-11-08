import {assessReversalFollowThrough,FOLLOW_THROUGH_POLICY} from './aiResearchReversalFollowThrough';
import {cleanRecoveryPoints,recoveryFeatures,type RecoveryPoint} from './aiResearchAnticyclicalStudy';
export const REVERSAL_POLICY={version:'PRICE_REVERSAL_LAB_V2',startDate:'2012-01-01',horizons:[5,20,60,80],fitted:false,family:'PRICE',entry:'NEXT_OBSERVED_CLOSE',parameters:{priorLowWindow:20,reclaimWithin:3,pivotLeft:2,pivotRight:2,pivotSpacingMin:5,pivotSpacingMax:60,retestTolerancePct:2,minimumBouncePct:3,bollingerPeriod:20,bollingerDeviations:2,standardDeviation:'POPULATION',wLowerLowPct:0.1,wConfirmationExpiry:20},productionChanged:false} as const;
type Row={date:string;close:number;stress:boolean|null;rsi14:number|null;ma200:number|null};
type Event={index:number;signalDate:string;reference:number|null;originDate:string;secondLowDate?:string;knownAt:string;detail:string};
const pct=(a:number,b:number)=>100*(a/b-1);
const avg=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
const q=(xs:number[],p:number)=>{if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y),j=(a.length-1)*p,k=Math.floor(j);return a[k]+(a[Math.ceil(j)]-a[k])*(j-k);};
export function reversalBands(prices:number[]){return prices.map((_,i)=>{if(i<19)return null;const a=prices.slice(i-19,i+1),middle=avg(a)!,sd=Math.sqrt(a.reduce((s,v)=>s+(v-middle)**2,0)/20);return {middle,lower:middle-2*sd,upper:middle+2*sd};});}
export function priceReversalEvents(rows:Row[]){
 const prices=rows.map(r=>r.close),bands=reversalBands(prices);
 const events:Record<string,Event[]>={FAILED_LOW_RECLAIM:[],PRICE_RETEST:[],BAND_REENTRY:[],W_EARLY:[],W_CONFIRMED:[]};
 const add=(id:string,i:number,reference:number|null,origin:number,detail:string,second?:number)=>events[id].push({index:i,signalDate:rows[i].date,knownAt:rows[i].date,reference,originDate:rows[origin].date,...(second===undefined?{}:{secondLowDate:rows[second].date}),detail});
 let failed:{i:number;level:number}|null=null;
 let pendingW:{known:number;first:number;second:number;resistance:number}|null=null;
 const pivots:number[]=[];
 for(let i=0;i<rows.length;i++){
  if(failed){if(i-failed.i<=3&&prices[i]>failed.level){add('FAILED_LOW_RECLAIM',i,failed.level,failed.i,'Vorher bekannte 20-Schluss-Tiefzone binnen 1–3 Beobachtungen zurückerobert.');failed=null;}else if(i-failed.i>=3)failed=null;}
  // After a window ends, only a newly broken prior-20 minimum can arm the next window.
  if(!failed&&i>=20){const level=Math.min(...prices.slice(i-20,i));if(prices[i]<level)failed={i,level};}
  if(i>=20&&bands[i-1]&&bands[i]&&prices[i-1]<bands[i-1]!.lower&&prices[i]>=bands[i]!.lower&&prices[i]<=bands[i]!.upper&&prices[i]>prices[i-1])add('BAND_REENTRY',i,bands[i]!.lower,i-1,'Steigender Schluss kehrt von unterhalb des unteren Bandes ins Band zurück.');
  const p=i-2;
  if(p>=2&&prices[p]<prices[p-1]&&prices[p]<prices[p-2]&&prices[p]<=prices[p+1]&&prices[p]<=prices[p+2]){
   const first=pivots.at(-1);
   if(first!==undefined&&p-first>=5&&p-first<=60){
    const peak=Math.max(...prices.slice(first+1,p)),bounce=pct(peak,prices[first]),distance=pct(prices[p],prices[first]);
    const stress=rows.slice(Math.max(0,first-10),first+1).some(r=>r.stress===true);
    if(stress&&Math.abs(distance)<=2&&bounce>=3&&prices[i]>prices[p])add('PRICE_RETEST',i,prices[first],first,'Zweiter bestätigter Schluss-Tiefbereich innerhalb ±2 %, vorher mindestens 3 % Erholung; keine Volumenbestätigung.',p);
    if(bands[first]&&bands[p]&&prices[first]<=bands[first]!.lower&&distance<=-0.1&&prices[p]>bands[p]!.lower&&bounce>=3){
     add('W_EARLY',i,peak,first,'Tieferes zweites Schluss-Tief, aber oberhalb seines unteren Bandes; Zwischenhoch noch gesondert prüfen.',p);
     pendingW={known:i,first,second:p,resistance:peak};
    }
   }
   pivots.push(p);
  }
  if(pendingW){if(i-pendingW.known>20||prices[i]<prices[pendingW.second])pendingW=null;else if(prices[i]>pendingW.resistance){add('W_CONFIRMED',i,pendingW.resistance,pendingW.first,'Schluss über dem beim zweiten Tief bereits bekannten Zwischenhoch.',pendingW.second);pendingW=null;}}
 }
 return {events,bands,pending:{failedLow:failed?{breakDate:rows[failed.i].date,reference:failed.level,remainingIntervals:3-(rows.length-1-failed.i)}:null,w:pendingW?{knownAt:rows[pendingW.known].date,secondLowDate:rows[pendingW.second].date,reference:pendingW.resistance,remainingIntervals:20-(rows.length-1-pendingW.known)}:null}};
}
export function reversalOutcome(points:RecoveryPoint[],i:number,h:number){
 const a=i+1,end=a+h;
 const base={signalDate:points[i].date,anchorDate:points[a]?.date??null,endDate:points[end]?.date??null,returnPct:null as number|null,worstFurtherClosePct:null as number|null};
 if(a>=points.length)return {...base,status:'WAITING_FOR_ANCHOR'};
 if(end>=points.length)return {...base,status:'WAITING_FOR_HORIZON'};
 return {...base,status:'MATURED',returnPct:pct(points[end].close,points[a].close),worstFurtherClosePct:pct(Math.min(...points.slice(a,end+1).map(p=>p.close)),points[a].close)};
}
type Outcome=ReturnType<typeof reversalOutcome>;
function summary(xs:Outcome[]){const a=xs.filter(x=>x.status==='MATURED'),r=a.map(x=>x.returnPct!),d=a.map(x=>x.worstFurtherClosePct!);return {matureCases:a.length,waitingForAnchor:xs.filter(x=>x.status==='WAITING_FOR_ANCHOR').length,waitingForHorizon:xs.filter(x=>x.status==='WAITING_FOR_HORIZON').length,meanReturnPct:avg(r),medianReturnPct:q(r,.5),p10ReturnPct:q(r,.1),p90ReturnPct:q(r,.9),positiveCases:r.filter(x=>x>0).length,negativeCases:r.filter(x=>x<0).length,flatCases:r.filter(x=>x===0).length,medianWorstFurtherClosePct:q(d,.5),worstFurtherClosePct:d.length?Math.min(...d):null,positiveAfter1To2PctDip:a.filter(x=>x.worstFurtherClosePct!<=-1&&x.worstFurtherClosePct!>=-2&&x.returnPct!>0).length,all1To2PctDips:a.filter(x=>x.worstFurtherClosePct!<=-1&&x.worstFurtherClosePct!>=-2).length};}
const definitions=[
 {id:'FAILED_LOW_RECLAIM',title:'Tiefbruch zurückerobert',stage:'FIRST_REACTION',definition:'Schluss unter dem vorherigen 20-Beobachtungs-Schlusstief. Diese Referenz wird eingefroren und innerhalb der nächsten 1–3 Beobachtungen per Schluss strikt überboten. Während des Fensters kein neuer Anker. Keine vollständige Wyckoff-Spring-Formation.'},
 {id:'PRICE_RETEST',title:'Tief-Test mit erster Reaktion',stage:'EARLY_PATTERN',definition:'Zwei Schluss-Tiefpunkte mit je zwei Beobachtungen links/rechts; Abstand 5–60 Intervalle. Erstes Tief in/kurz nach Stress (höchstens 10 Intervalle), danach mindestens 3 % Erholung, zweites Tief innerhalb ±2 % des ersten. Bekannt erst zwei Beobachtungen nach dem zweiten Tief und nur bei Schluss darüber. Preisnähe ist kein Nachweis nachlassenden Verkaufsvolumens.'},
 {id:'BAND_REENTRY',title:'Rückkehr ins Bollinger-Band',stage:'FIRST_REACTION',definition:'SMA20 ± 2 Populationsstandardabweichungen. Voriger Schluss unter seinem unteren Band; heutiger steigender Schluss zwischen den heutigen Bändern. Ein Bandkontakt allein reicht nicht.'},
 {id:'W_EARLY',title:'Bollinger-W · frühes Muster',stage:'EARLY_PATTERN',definition:'Bestätigte Schluss-Tiefs im Abstand 5–60 Intervalle. Erstes Tief auf/unter seinem unteren Band; mindestens 3 % Zwischenerholung; zweites Tief mindestens 0,1 % tiefer, aber über seinem eigenen unteren Band. Bekannt erst zwei Beobachtungen später. Ausbruch über das Zwischenhoch ist noch keine Voraussetzung.'},
 {id:'W_CONFIRMED',title:'Bollinger-W · Zwischenhoch überboten',stage:'LATER_CONFIRMATION',definition:'Nach erkanntem frühem W: Schluss strikt über dem eingefrorenen Zwischenhoch, spätestens 20 Beobachtungen nach Erkennung. Ein neuer Schluss unter dem zweiten Tief verwirft den Kandidaten. Kein rückwirkendes Signal am Tief.'},
];
export function buildPriceReversalMarket(market:string,raw:RecoveryPoint[],cutoff:string){
 const cleaned=cleanRecoveryPoints(raw,cutoff),points=cleaned.points,rows=recoveryFeatures(points,[]),found=priceReversalEvents(rows);
 const rsiEvents=rows.map((r,i)=>i>0&&r.rsi14!==null&&rows[i-1].rsi14!==null&&rows[i-1].rsi14!<30&&r.rsi14>=30?i:-1).filter(i=>i>=0);
 const nearRSI=(i:number)=>rsiEvents.some(j=>j<=i&&i-j<=10);
 const eligible=rows.map((r,i)=>i>=251&&r.date>=REVERSAL_POLICY.startDate?i:-1).filter(i=>i>=0);
 const comparison=(indices:number[],h:number)=>summary(indices.map(i=>reversalOutcome(points,i,h)));
 const spaced=(indices:number[],h:number)=>{const out:number[]=[];for(const i of indices)if(!out.length||i>out[out.length-1]+h+1)out.push(i);return out;};
 const studies=definitions.map(rule=>{
  const events=found.events[rule.id].filter(e=>e.signalDate>=REVERSAL_POLICY.startDate&&e.index>=251),starts=events.map(e=>e.index),last=starts.at(-1),lastIndex=points.length-1;
  return {...rule,family:'PRICE',knownEvents:events.length,followThrough:points.length>=252?assessReversalFollowThrough(points,events.at(-1),rule.id):{...assessReversalFollowThrough(points,undefined,rule.id),status:'UNAVAILABLE',label:'Zu wenig Beobachtungen für diesen Vergleich'},current:{asOf:points.at(-1)?.date??null,active:points.length>=252?last===lastIndex:null,latestSignalDate:last===undefined?null:points[last].date,ageIntervals:last===undefined?null:lastIndex-last},horizons:REVERSAL_POLICY.horizons.map(h=>{
   const selected=spaced(starts,h),all=starts.map(i=>reversalOutcome(points,i,h)),main=comparison(selected,h),baseline=comparison(eligible,h);
   return {horizonIntervals:h,nonOverlapping:main,allEvents:summary(all),baselineAllEligibleDays:baseline,baselineStressDays:comparison(eligible.filter(i=>rows[i].stress===true),h),excessMeanVsAllDaysPp:main.meanReturnPct===null||baseline.meanReturnPct===null?null:main.meanReturnPct-baseline.meanReturnPct,
    samePriceFamily:{withRSIReclaimInPrior10:comparison(selected.filter(nearRSI),h),withoutRSIReclaimInPrior10:comparison(selected.filter(i=>!nearRSI(i)),h),note:'RSI-Rückkehr am Signaltag oder höchstens 10 Intervalle zuvor. Beschreibende Überlappung, kein unabhängiger Zusatznutzen oder isolierter kausaler Effekt.'},
    periods:[['2012-01-01','2016-12-31'],['2017-01-01','2021-12-31'],['2022-01-01',cutoff]].map(([from,to])=>{const inside=all.filter(o=>o.signalDate>=from&&o.signalDate<=to);return {from,to,allEvents:summary(inside.filter(o=>o.endDate!==null&&o.endDate<=to)),notMatureWithinBlock:inside.filter(o=>o.endDate===null||o.endDate>to).length,baseline:summary(eligible.map(i=>reversalOutcome(points,i,h)).filter(o=>o.signalDate>=from&&o.signalDate<=to&&o.endDate!==null&&o.endDate<=to))};}),
    byMA200:['ABOVE_OR_ON','BELOW','UNKNOWN'].map(state=>({state,summary:comparison(selected.filter(i=>rows[i].ma200===null?state==='UNKNOWN':(rows[i].close>=rows[i].ma200!?'ABOVE_OR_ON':'BELOW')===state),h)})),
    episodes:events.map((e,j)=>({...e,...all[j],selectedNonOverlapping:selected.includes(e.index)}))};
  })};
 });
 return {market,status:points.length>=252?'AVAILABLE':points.length?'PARTIAL':'UNAVAILABLE',firstDate:points[0]?.date??null,lastDate:points.at(-1)?.date??null,observations:points.length,includes2012:points.some(p=>p.date.startsWith('2012-')),excludedAfterCutoff:cleaned.excludedAfterCutoff,duplicateRows:cleaned.duplicateCount,exchangeCalendarCompletenessVerified:false,currentBandRelation:found.bands.at(-1)&&points.at(-1)?{asOf:points.at(-1)!.date,close:points.at(-1)!.close,position:points.at(-1)!.close<found.bands.at(-1)!.lower?'BELOW':points.at(-1)!.close>found.bands.at(-1)!.upper?'ABOVE':'INSIDE'}:null,currentBands:found.bands.at(-1)??null,pending:found.pending,studies};
}
export function buildPriceReversalStudy(data:{nasdaq:RecoveryPoint[];russell:RecoveryPoint[]},cutoff:string){const markets=[buildPriceReversalMarket('NASDAQ',data.nasdaq,cutoff),buildPriceReversalMarket('RUSSELL_2000',data.russell,cutoff)];return {ok:markets.some(m=>m.status!=='UNAVAILABLE'),version:REVERSAL_POLICY.version,policy:REVERSAL_POLICY,followThroughPolicy:FOLLOW_THROUGH_POLICY,cutoff,modelRequestsUsed:0,memoryWritten:false,productionChanged:false,markets,limits:['Eigene vorab festgelegte Schlusskursvarianten; keine vollständig geprüfte Wyckoff-/Intradayformation.','Alle fünf Regeln gehören zur Preisfamilie. Keine Addition unabhängiger Stimmen und keine neuen Gewichtungen.','Nichtüberlappende Auswahl je Regel/Horizont: nächste Anker liegen strikt nach dem vorherigen Endschluss. Zwischen Regeln können Fälle überlappen.','Baseline umfasst die gleichen auswertbaren Beobachtungstage ab 2012; Stressvergleich ist zusätzlich, keine Regimebereinigung.','Signal erst nach Schluss; Start ist nächster beobachteter Schluss. Keine Gebühren, Ausführung oder Optionsrendite modelliert.','Keine Optimierung, Signifikanzprüfung oder validierte Prognosewahrscheinlichkeit. Weitere Verluste und offene Fälle bleiben sichtbar.','Fortbestand bezieht sich auf feste damals bekannte Referenzen, nicht auf optimierte Stopps. Frischegrenze 10 Intervalle ist eine Darstellungsregel, kein kalibriertes Verfallsdatum.']};}
