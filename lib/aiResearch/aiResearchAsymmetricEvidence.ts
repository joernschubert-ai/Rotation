import {recoveryPatternEvents,type RecoveryObservation} from './aiResearchEarlyRecoverySignals';
type Feature=RecoveryObservation&{stress:boolean|null;ma20:number|null;return1:number|null;vix:number|null;vixPrevious:number|null};
const finite=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n);
const mean=(a:number[])=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
const quantile=(a:number[],p:number)=>{if(!a.length)return null;const s=[...a].sort((a,b)=>a-b),j=(s.length-1)*p,l=Math.floor(j);return s[l]+(s[Math.ceil(j)]-s[l])*(j-l);};
export const ASYMMETRIC_POLICY={version:'ASYMMETRIC_INDEX_EVIDENCE_V1',start:'2012-01-01',horizons:[60,80],recentStressIntervals:20,combinationWindow:10,minimumSample:10,minimumBlockSample:5,recentDisplayIntervals:3,blockSplit:'2022-01-01',weightsAreProbabilities:false,weightsAreOptimized:false,optionsReturns:false} as const;
/** Signal-time filtering and horizon-specific spacing happen BEFORE inspecting future returns. */
export function asymmetricOutcomes(rows:RecoveryObservation[],indices:number[],horizon:number,from:string,to:string,spaced=true){
 const selected:number[]=[];let previous=-Infinity;
 for(const i of indices){if(rows[i].date<from||rows[i].date>to||spaced&&i<=previous+horizon)continue;selected.push(i);previous=i;}
 const mature=selected.filter(i=>rows[i+1+horizon]&&rows[i+1+horizon].date<=to).map(i=>{
  const anchor=rows[i+1].close,path=rows.slice(i+1,i+horizon+2).map(p=>100*(p.close/anchor-1));
  return {returnPct:path.at(-1)!,furtherLowPct:Math.min(...path)};
 });
 const returns=mature.map(r=>r.returnPct),lows=mature.map(r=>r.furtherLowPct),median=quantile(returns,.5),low=quantile(lows,.5);
 return {n:mature.length,selectedBeforeMaturity:selected.length,pending:selected.length-mature.length,meanPct:mean(returns),medianPct:median,p10Pct:quantile(returns,.1),p90Pct:quantile(returns,.9),medianFurtherLowPct:low,worstFurtherLowPct:lows.length?Math.min(...lows):null,positiveCount:returns.filter(n=>n>0).length,
  medianBalanceRatio:median!==null&&low!==null&&low<0?median/Math.abs(low):null,overlapAllowed:!spaced};
}
type Stats=ReturnType<typeof asymmetricOutcomes>;
const favorable=(s:Stats)=>s.n>=ASYMMETRIC_POLICY.minimumSample&&s.medianPct!==null&&s.medianPct>0&&s.medianBalanceRatio!==null&&s.medianBalanceRatio>=1;
/** Own-index descriptive comparisons; no training/optimization or inferred option performance. */
export function buildAsymmetricIndexEvidence(features:Feature[]){
 const rows=features,last=rows.at(-1);if(!last)return null;
 const pattern=recoveryPatternEvents(features),div=new Set(pattern.divergence),failure=new Set(pattern.failureSwing);
 const stress=rows.map((_,i)=>rows.slice(Math.max(0,i-20),i+1).some(r=>r.stress===true));
 const signals:Record<string,boolean[]>={
  RSI_RECLAIM:rows.map((r,i)=>i>0&&finite(r.rsi14)&&finite(rows[i-1].rsi14)&&rows[i-1].rsi14!<30&&r.rsi14>=30),
  RSI_DIVERGENCE:rows.map((_,i)=>div.has(i)),RSI_FAILURE_SWING:rows.map((_,i)=>failure.has(i)),
  MA20_RECLAIM_STRESS:rows.map((r,i)=>i>0&&finite(r.ma20)&&finite(rows[i-1].ma20)&&rows[i-1].close<=rows[i-1].ma20!&&r.close>r.ma20&&rows.slice(Math.max(0,i-20),i).some(r=>r.stress===true)),
  VIX_RETREAT:rows.map(r=>finite(r.vix)&&finite(r.vixPrevious)&&finite(r.return1)&&r.vixPrevious>=30&&r.vix<=r.vixPrevious*.9&&r.return1>0)
 };
 signals.ANY_RSI=rows.map((_,i)=>signals.RSI_RECLAIM[i]||signals.RSI_DIVERGENCE[i]||signals.RSI_FAILURE_SWING[i]);
 for(const partner of ['MA20_RECLAIM_STRESS','VIX_RETREAT'])signals['RSI_PLUS_'+partner]=rows.map((_,i)=>(signals[partner][i]&&signals.ANY_RSI.slice(Math.max(0,i-10),i+1).some(Boolean))||(signals.ANY_RSI[i]&&signals[partner].slice(Math.max(0,i-10),i+1).some(Boolean)));
 const titles:Record<string,string>={RSI_RECLAIM:'RSI zurück über 30',RSI_DIVERGENCE:'RSI-Divergenz',RSI_FAILURE_SWING:'RSI-Erholungsmuster',MA20_RECLAIM_STRESS:'MA20 nach Verkaufsdruck zurückerobert',VIX_RETREAT:'VIX-Stress lässt nach',ANY_RSI:'Mindestens ein RSI-Erholungszeichen',RSI_PLUS_MA20_RECLAIM_STRESS:'RSI plus MA20-Rückeroberung',RSI_PLUS_VIX_RETREAT:'RSI plus VIX-Rückgang'};
 const baselineIndices=rows.map((r,i)=>stress[i]&&r.date>=ASYMMETRIC_POLICY.start?i:-1).filter(i=>i>=0);
 const baselineCache=new Map<string,Stats>();
 const baselineFor=(h:number,from:string,to:string)=>{const key=[h,from,to].join('|');let value=baselineCache.get(key);if(!value){value=asymmetricOutcomes(rows,baselineIndices,h,from,to,false);baselineCache.set(key,value);}return value;};
 const studies=Object.entries(signals).map(([id,on])=>{
  const candidates=on.map((v,i)=>v&&stress[i]&&rows[i].date>=ASYMMETRIC_POLICY.start&&(!on[i-1]||!stress[i-1])?i:-1).filter(i=>i>=0);
  const horizons=ASYMMETRIC_POLICY.horizons.map(h=>{
   const cases=asymmetricOutcomes(rows,candidates,h,ASYMMETRIC_POLICY.start,last.date),baseline=baselineFor(h,ASYMMETRIC_POLICY.start,last.date);
   const blocks=[['2012-01-01','2021-12-31'],['2022-01-01',last.date]].map(([from,to])=>{const c=asymmetricOutcomes(rows,candidates,h,from,to),b=baselineFor(h,from,to);return {from,to,cases:c,baseline:b,excessMeanPp:c.meanPct!==null&&b.meanPct!==null?c.meanPct-b.meanPct:null};});
   return {intervals:h,cases,baseline,excessMeanPp:cases.meanPct!==null&&baseline.meanPct!==null?cases.meanPct-baseline.meanPct:null,blocks,favorableIndexBalance:favorable(cases)};
  });
  const enough=horizons.every(h=>h.cases.n>=ASYMMETRIC_POLICY.minimumSample),consistent=enough&&horizons.every(h=>h.favorableIndexBalance&&h.blocks.every(b=>b.cases.n>=ASYMMETRIC_POLICY.minimumBlockSample&&b.excessMeanPp!==null&&b.excessMeanPp>0));
  const adverse=enough&&horizons.every(h=>h.cases.medianPct!==null&&h.cases.medianPct<=0);
  const weight:0|1|2=consistent?2:adverse?0:1;
  const latest=candidates.at(-1),age=latest===undefined?null:rows.length-1-latest;
  return {id,title:titles[id],family:id==='VIX_RETREAT'?'VOLATILITY':id.startsWith('RSI_PLUS')?'COMBINATION':'PRICE',weight,
   evidence:consistent?'CONSISTENT_EXPLORATORY':adverse?'UNFAVORABLE':!enough?'SMALL_SAMPLE':'MIXED_COMPARISON',
   weightReason:consistent?'In beiden Zeitabschnitten und Horizonten positiver Vergleich; weiterhin explorativ.':adverse?'In beiden Horizonten kein positiver Median.':!enough?'Zu wenige Vergleichsfälle: nur Frühhinweis, kein höheres Gewicht.':'Erholung historisch möglich; zusätzlicher Vorteil im Zeitvergleich uneinheitlich.',
   current:{detected:on.at(-1)===true&&stress.at(-1)===true,signalDate:latest===undefined?null:rows[latest].date,ageIntervals:age,recent:age!==null&&age<=ASYMMETRIC_POLICY.recentDisplayIntervals},horizons};
 });
 return {version:ASYMMETRIC_POLICY.version,asOf:last.date,policy:ASYMMETRIC_POLICY,studies,
  baselineMeaning:'Eigene Beobachtungstage ab 2012 mit Verkaufsdruck am Signal- oder einem der vorigen 20 Beobachtungstage: Tagesverlust >=3 %, Fuenf-Intervallverlust >=7 % oder Drawdown252 >=10 %. Kein exakt gleich schwerer oder kausal gematchter Stresszustand. Baseline-Tage ueberlappen.',
  limits:'Retrospektive Abschnitte 2012–2021 und ab 2022, kein unberuehrter Out-of-sample-Test. Beobachtete Index-Schlussrenditen ab NAECHSTEM Schluss, keine Optionsrenditen. Medianrendite / Betrag des medianen weiteren Schlussrueckgangs ist eine deskriptive Balance, kein individuelles CRV oder Gewinn-/Verlustrisiko. Keine optimierten Prozentgewichte, Signifikanz oder Prognosewahrscheinlichkeit.'};
}
/** Family contributions are capped; related RSI/MA signals and combinations cannot inflate a vote count. */
export function assessAsymmetricRecovery(anti:any){
 const e=anti?.asymmetricEvidence,early=anti?.earlyRecovery;
 if(e?.version!==ASYMMETRIC_POLICY.version||e.asOf!==anti.asOf||!Array.isArray(e.studies))return {version:'ASYMMETRIC_DECISION_V1',status:'UNKNOWN',tone:'neutral',label:'Asymmetrische Einordnung noch offen',reason:'Passende historische Signalvergleiche fehlen.',weight:null,families:[],examples:[],combinations:[],breadthCoverage:{ready:0,total:0,calibrated:false},confluence:{areas:0,signalCount:0,label:'Datenlage offen'},calibrated:false};
 const singles=e.studies.filter((s:any)=>s.family!=='COMBINATION'&&s.id!=='ANY_RSI'),current=singles.filter((s:any)=>s.current.recent),price=current.filter((s:any)=>s.family==='PRICE');
 const breadth=Array.isArray(early?.signals)?early.signals.filter((s:any)=>s.family==='BREADTH'):[],breadthReady=breadth.filter((s:any)=>s.status!=='UNAVAILABLE'),breadthOn=breadthReady.filter((s:any)=>s.status==='TODAY'||s.status==='RECENT'&&s.ageIntervals<=3);
 const priority=['RSI_RECLAIM','RSI_FAILURE_SWING','RSI_DIVERGENCE','MA20_RECLAIM_STRESS'];
 const primary=[...price].sort((a:any,b:any)=>a.current.ageIntervals-b.current.ageIntervals||priority.indexOf(a.id)-priority.indexOf(b.id))[0];
 const contrary=price.some((s:any)=>s.evidence==='UNFAVORABLE');
 const favorablePrimary=primary?.horizons.every((h:any)=>h.favorableIndexBalance)===true;
 let status='OPEN',tone='watch',label='Antizyklische Chance prüfen',reason='Frühe Hinweise oder historische Vergleichsfälle reichen für eine klare Indexbalance noch nicht aus.';
 if(favorablePrimary&&!contrary){status='POSSIBLE_RECOVERY';tone='good';label='Mögliche antizyklische Erholungschance';reason='Frisches/kurz zurückliegendes Preiszeichen; in beiden Horizonten positiver Median mindestens so groß wie der Betrag des medianen weiteren Rückgangs. Ein zusätzlicher Signalvorteil ist damit nicht bewiesen.';}
 else if(contrary){status='UNFAVORABLE_HISTORY';tone='bad';label='Historische Erholungsbalance ungünstig';reason='Die aktuell bezogenen Muster zeigen in beiden Horizonten keinen positiven Median; keine Aussage über jede mögliche Erholung.';}
 else if(!current.length&&!breadthOn.length){status=breadthReady.length===breadth.length&&breadth.length>0?'NO_RECENT_SETUP':'NO_PRICE_SETUP';tone=status==='NO_RECENT_SETUP'?'bad':'neutral';label=status==='NO_RECENT_SETUP'?'Kein frischer antizyklischer Ansatz':'Kein frisches Preiszeichen · Breite noch offen';reason='Kein eigenes Preis-/VIX-Erholungszeichen in den letzten drei Beobachtungsintervallen. Fehlende Breitenhistorie zählt nicht als Gegenbeweis.';}
 const volatility=current.filter((s:any)=>s.family==='VOLATILITY');
 const areas=Number(price.length>0)+Number(volatility.length>0)+Number(breadthOn.length>0),signalCount=price.length+volatility.length+breadthOn.length;
 const confluence={areas,signalCount,label:areas>=2?`${areas} Bereiche verbessern sich`:signalCount>=2?'Mehrere verwandte Hinweise':signalCount===1?'Ein früher Hinweis':'Noch keine gemeinsame Erholung',meaning:'Bereiche sind zusätzliche Perspektiven, keine bewiesene statistische Unabhängigkeit. Mehrere Preis-/RSI-Muster und Kombinationen werden nicht addiert.'};
 const family=(name:string,items:any[],weight:number|null)=>({name,weight,signals:items.map((s:any)=>s.id)});
 return {version:'ASYMMETRIC_DECISION_V1',status,tone,label,reason,weight:current.length?Math.max(...current.map((s:any)=>s.weight)):null,basisId:primary?.id??null,confluence,
  families:[family('Preis/Momentum',price,price.length?Math.max(...price.map((s:any)=>s.weight)):null),family('Volatilität',current.filter((s:any)=>s.family==='VOLATILITY'),current.some((s:any)=>s.family==='VOLATILITY')?Math.max(...current.filter((s:any)=>s.family==='VOLATILITY').map((s:any)=>s.weight)):null),family('Breite',breadthOn,null)],
  examples:price.map((s:any)=>({id:s.id,title:s.title,weight:s.weight,weightReason:s.weightReason,ageIntervals:s.current.ageIntervals,horizons:s.horizons.map((h:any)=>({intervals:h.intervals,...h.cases,excessMeanPp:h.excessMeanPp}))})),
  combinations:e.studies.filter((s:any)=>s.family==='COMBINATION').map((s:any)=>({id:s.id,title:s.title,weight:s.weight,weightReason:s.weightReason,current:s.current,horizons:s.horizons.map((h:any)=>({intervals:h.intervals,...h.cases,excessMeanPp:h.excessMeanPp}))})),
  breadthCoverage:{ready:breadthReady.length,total:breadth.length,calibrated:false},calibrated:false,meaning:'Gruppengewichte 0/1/2 sind explorative Evidenzstufen, keine Prozentgewichte, Wahrscheinlichkeiten oder Positionsgrößen. Kombinationen werden separat verglichen, nicht zusätzlich addiert. Indexbalance ist keine geprüfte Optionsasymmetrie.'};
}
