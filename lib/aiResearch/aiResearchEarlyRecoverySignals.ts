import {completedDailyCutoff} from './aiResearchChartContext';
export type RecoveryObservation={date:string;close:number;rsi14:number|null};
export type EarlySignal={id:string;title:string;family:string;status:'TODAY'|'RECENT'|'NONE'|'UNAVAILABLE';active:boolean|null;signalDate:string|null;ageIntervals:number|null;explanation:string;detail:string};
const finite=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n);
function signal(id:string,title:string,family:string,explanation:string,dates:string[],events:number[],ready:boolean,detail=''):EarlySignal{
 const last=events.at(-1),age=last===undefined?null:dates.length-1-last;
 return {id,title,family,status:!ready?'UNAVAILABLE':age===0?'TODAY':age!==null&&age<=10?'RECENT':'NONE',active:ready?age===0:null,signalDate:last===undefined?null:dates[last],ageIntervals:age,explanation,detail};
}
/** A two-sided pivot becomes known ONLY two observations after its low. No backdating. */
export function confirmedRecoveryLows(rows:RecoveryObservation[],i:number){
 const p=i-2;if(p<2)return null;
 return rows[p].close<rows[p-1].close&&rows[p].close<rows[p-2].close&&rows[p].close<=rows[p+1].close&&rows[p].close<=rows[p+2].close?p:null;
}
export function recoveryPatternEvents(rows:RecoveryObservation[]){
 const divergence:number[]=[],failureSwing:number[]=[],lows:number[]=[];
 let phase=0,start=-1,peak=0;
 for(let i=0;i<rows.length;i++){
  const p=confirmedRecoveryLows(rows,i);
  if(p!==null){
   const prior=lows.at(-1);
   if(prior!==undefined&&p-prior>=5&&p-prior<=60&&finite(rows[prior].rsi14)&&finite(rows[p].rsi14)&&rows[prior].rsi14!<30&&rows[p].close<=rows[prior].close*.999&&rows[p].rsi14!>=rows[prior].rsi14!+3)divergence.push(i);
   lows.push(p);
  }
  const v=rows[i].rsi14,prev=rows[i-1]?.rsi14;
  if(!finite(v)){phase=0;continue;}
  if(v<30){phase=1;start=i;continue;}
  if(phase&&i-start>30){phase=0;}
  if(phase===1){phase=2;peak=v;}
  else if(phase===2){if(v>peak)peak=v;else if(finite(prev)&&v<prev)phase=3;}
  else if(phase===3&&v>peak){failureSwing.push(i);phase=0;}
 }
 return {divergence,failureSwing};
}
export function priceRecoverySignals(rows:RecoveryObservation[]){
 const events=recoveryPatternEvents(rows),dates=rows.map(r=>r.date),current=rows.at(-1),previous=rows.at(-2);
 return {version:'EARLY_RECOVERY_SIGNALS_V1',asOf:current?.date??null,rsiPrevious:previous?.rsi14??null,rsiChange:finite(current?.rsi14)&&finite(previous?.rsi14)?current!.rsi14!-previous!.rsi14!:null,
  signals:[
   signal('RSI_DIVERGENCE','RSI-Divergenz','PRICE_MOMENTUM','Neues Kurstief, aber höheres RSI-Tief: Abwärtsmomentum lässt möglicherweise nach.',dates,events.divergence,rows.length>=80&&rows.slice(-65).every(r=>finite(r.rsi14)),'App-Regel: zwei bestätigte Schlusskurstiefs (2 Beobachtungen links/rechts), Abstand 5–60 Intervalle, zweiter Schluss mindestens 0,1 % tiefer, RSI mindestens 3 Punkte höher; erster RSI unter 30. Bekannt erst nach Bestätigung, nicht am Tief.'),
   signal('RSI_FAILURE_SWING','RSI-Erholungsmuster','PRICE_MOMENTUM','Nach Rückkehr über 30 hält der RSI beim Rücksetzer diese Schwelle und überwindet sein Zwischenhoch.',dates,events.failureSwing,rows.length>=45&&rows.slice(-31).every(r=>finite(r.rsi14)),'Wilder Failure Swing als feste App-Regel: unter 30, Rückkehr auf/über 30, Rücksetzer ohne erneutes Unterschreiten von 30, dann über das RSI-Zwischenhoch; Ablauf nach 30 Beobachtungen seit letztem RSI unter 30.')
  ],limits:'Aktuelles technisches Muster, keine validierte Trefferquote. RSI-Muster stammen aus derselben Preisreihe und zählen nicht als unabhängige Bestätigungen.'};
}
type BreadthRow={date:string;close:number;b20:number;b50:number;advances:number;declines:number;identity:string};
/** Only a continuous suffix of dated, identical-universe, identical-observed-member rows is usable. */
export function recoveryBreadthRows(history:any[],market:string,sessions:{date:string;close:number}[],snapshotTimestamp:string){
 const byDate=new Map<string,BreadthRow>();const conflicts=new Set<string>();
 for(const frame of [...history].filter(x=>typeof x?.timestamp==='string'&&Number.isFinite(Date.parse(x.timestamp))&&Date.parse(x.timestamp)<=Date.parse(snapshotTimestamp)).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp))){
  const row=frame.breadthDataQuality?.[market==='NASDAQ'?'nasdaq100':'russell2000'],q=row?.dataQuality;
  if(!q||q.available!==true||typeof q.referenceDate!=='string'||q.unit!=='FRACTION'||!finite(q.coverage)||!finite(q.minimumCoverage)||q.coverage<q.minimumCoverage||!Array.isArray(q.accepted)||!q.accepted.length||new Set(q.accepted).size!==q.accepted.length||!q.accepted.every((v:unknown)=>typeof v==='string')||typeof q.constituentFingerprint!=='string'||!q.constituentFingerprint||typeof q.universeVersion!=='string')continue;
  if(q.referenceDate>completedDailyCutoff(new Date(frame.timestamp)))continue;
  const session=sessions.find(s=>s.date===q.referenceDate);if(!session)continue;
  if(![row.b20,row.b50].every(v=>finite(v)&&v>=0&&v<=1)||![row.advances,row.declines,q.valid].every(v=>Number.isInteger(v)&&v>=0)||q.valid!==q.accepted.length||row.advances+row.declines>q.valid||row.advances+row.declines===0)continue;
  const identity=JSON.stringify([q.universeVersion,q.constituentFingerprint,[...q.accepted].sort()]);
  const value={date:session.date,close:session.close,b20:row.b20*100,b50:row.b50*100,advances:row.advances,declines:row.declines,identity};
  const old=byDate.get(value.date);
  // Conflicting same-observation-date reads are excluded, rather than selecting a convenient revision.
  if(old&&JSON.stringify(old)!==JSON.stringify(value))conflicts.add(value.date);else if(!old)byDate.set(value.date,value);
 }
 const out:BreadthRow[]=[];let identity:string|undefined;
 for(let i=sessions.length-1;i>=0;i--){const row=byDate.get(sessions[i].date);if(!row||conflicts.has(row.date)||identity&&identity!==row.identity)break;identity=row.identity;out.unshift(row);}
 return out;
}
function ema(values:number[],period:number){const out:Array<number|null>=values.map(()=>null);if(values.length<period)return out;let value=values.slice(0,period).reduce((a,b)=>a+b,0)/period;out[period-1]=value;for(let i=period;i<values.length;i++){value+=(values[i]-value)*2/(period+1);out[i]=value;}return out;}
export function breadthRecoverySignals(rows:BreadthRow[],asOf:string){
 const dates=rows.map(r=>r.date),ready=dates.at(-1)===asOf,thrust:number[]=[],cross:number[]=[],improve:number[]=[],div:number[]=[],lows:number[]=[];
 const ratio=rows.map(r=>r.advances/(r.advances+r.declines)),z=ema(ratio,10),net=rows.map(r=>1000*(r.advances-r.declines)/(r.advances+r.declines)),fast=ema(net,19),slow=ema(net,39),osc=fast.map((f,i)=>f===null||slow[i]===null?null:f-slow[i]!);
 for(let i=0;i<rows.length;i++){
  if(i>=5&&rows[i-5].b20<=40&&rows[i].b20-rows[i-5].b20>=10&&!(i>=6&&rows[i-6].b20<=40&&rows[i-1].b20-rows[i-6].b20>=10))improve.push(i);
  if(i>=59&&z[i]!==null&&z[i-1]!==null&&z[i]!>.615&&z[i-1]!<=.615&&z.slice(i-10,i).some(v=>v!==null&&v<.4))thrust.push(i);
  if(i>=79&&osc[i]!==null&&osc[i-1]!==null&&osc[i]!>0&&osc[i-1]!<=0)cross.push(i);
  const p=confirmedRecoveryLows(rows.map(r=>({...r,rsi14:null})),i);
  if(p!==null){const previous=lows.at(-1);if(previous!==undefined&&p-previous>=5&&p-previous<=60&&rows[p].close<=rows[previous].close*.999&&rows[previous].b50<50&&rows[p].b50>=rows[previous].b50+5)div.push(i);lows.push(p);}
 }
 return [
  signal('BREADTH_IMPROVEMENT','Breite erholt sich','BREADTH','Mehr Aktien erobern ihren MA20 zurück: Erholung gewinnt an Teilnahme.',dates,improve,ready&&rows.length>=6,'App-Frühregel: MA20-Anteil steigt in 5 beobachteten Intervallen um mindestens 10 Prozentpunkte von höchstens 40 %. Kein klassischer Zweig Thrust.'),
  signal('BREADTH_DIVERGENCE','Breitendivergenz','BREADTH','Der Index macht ein neues Tief, aber mehr Aktien liegen über ihrem MA50.',dates,div,ready&&rows.length>=65,'App-Regel: bestätigte Schlusskurstiefs, Abstand 5–60 Intervalle, Preis mindestens 0,1 % tiefer, MA50-Anteil mindestens 5 Prozentpunkte höher; erster Anteil unter 50 %.'),
  signal('BREADTH_THRUST_PROXY','Breitenschub · eigene Indexvariante','BREADTH','Viele Aktien wechseln rasch auf die steigende Seite; breitere Nachfrage.',dates,thrust,ready&&rows.length>=60,'Zweig-artige App-Variante: EMA10 von Advances/(Advances+Declines) von unter 0,40 auf über 0,615 innerhalb von 10 beobachteten Intervallen. Mindestens 60 gleichartige Beobachtungen. Nasdaq-/IWM-Universum, kein klassischer NYSE-Zweig-Nachweis.'),
  signal('MCCLELLAN_PROXY','McClellan · eigene Indexvariante','BREADTH','Kurzfristige Marktbreite verbessert sich gegenüber der längerfristigen Breite.',dates,cross,ready&&rows.length>=80,'Ratio-adjusted: EMA19 minus EMA39 von 1000 × (Advances−Declines)/(Advances+Declines). Frischer Wechsel über null, mindestens 80 identische Beobachtungen; kein offizieller NYSE-/Nasdaq-Gesamtmarktindikator.'),
  signal('BPI_BULL_ALERT','P&F-Breite · BPI Bull Alert','BREADTH_PNF','Zeigt eine P&F-Erholung vieler einzelner Aktien aus einem überverkauften Bereich.',dates,[],false,'Noch nicht berechenbar: historische P&F-Kauf-/Verkaufssignale der einzelnen Mitglieder fehlen. MA-Breite ersetzt keinen BPI.')
 ];
}
