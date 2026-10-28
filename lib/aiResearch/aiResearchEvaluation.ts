import { buildFormationContext, compactFormationContext } from './aiResearchFormations';
import { buildFormationHistory, compactFormationHistory } from './aiResearchFormationHistory';
import { readableResearchFacts } from './aiResearchReadableFacts';
import { NARRATIVE_PROMPT } from './aiResearchNarrative';
import { freezeRequest } from './aiResearchComparison';

export const EVALUATION_CASES = [
 {id:'pnf-traps',title:'P&F: Trap ist noch kein einfaches Gegensignal',checks:[
  'Nasdaq Bull Trap wirkt bearisch; Russell Bear Trap wirkt bullisch. Letztes einfaches Signal und Gegen-Säule getrennt lesen.',
  'Trap ist Warnung, keine bestätigte Trendwende; eine Catapult bleibt möglich.',
  'Neue Familien haben hier keine abgeschlossenen Folgefälle. Keine Erfolgsquote oder fremde Familienstatistik erfinden.'
 ]},
 {id:'pnf-reversed',title:'P&F: Signal-Reversed mit umgekehrter Namensrichtung',checks:[
  'Nasdaq Bullish Signal Reversed wirkt bearisch; Russell Bearish Signal Reversed wirkt bullisch.',
  'Der Name beschreibt den vorherigen Trend, nicht die neue Wirkungsrichtung.',
  'Keine langfristige Wende oder unabhängige Mehrfachbestätigung aus dem Muster ableiten.'
 ]},
 {id:'pnf-catapults',title:'P&F: Catapult nach gescheiterter Trap',checks:[
  'Nasdaq bullische Catapult, Russell bearische Catapult; beide aus eigener Säulenfolge.',
  'Frühere Trap kann scheitern. Aktuelle Catapult nicht mit der Richtung der alten Trap verwechseln.',
  'Keine Horizontalprojektion oder Statistik eines einfachen Ausbruchs für die neue Familie erfinden.'
 ]},
 {id:'recovery',title:'Frühe Erholung trotz beschädigter Struktur',checks:[
  'Nasdaq über MA50/MA200, aber unter MA20; Russell über MA20, aber unter MA50/MA200.',
  'Frühe Call-Hypothese darf offen diskutiert werden; sie erfordert nicht erst die entfernte P&F-Widerlegungsmarke.',
  'Gegenrisiko für Calls: erneute Schwäche; Gegenrisiko für Put: weitere Erholung.',
  'Ein bereits überbotener Durchschnitt ist keine noch offene Rückeroberungsbedingung.'
 ]},
 {id:'continuation',title:'Abwärtsfortsetzung nach kleinem Rebound',checks:[
  'Beide Indizes unter allen Durchschnitten; kleiner Tagesrebound beweist keinen Boden.',
  'Bestätigter bearischer P&F-Bruch spricht für Fortsetzung, nicht für Aufwärtswende.',
  'Positive historische Folge-Indexrendite ist ein Gegenargument zur Put-These, kein Beleg für weitere Verluste.',
  'Eine bereits unterschrittene MA ist keine noch offene Abwärtsbedingung.'
 ]},
 {id:'positioning',title:'COT-Konflikt bei seitwärts laufenden Kursen',checks:[
  'Nasdaq Leveraged Money weiterhin netto short: 1 Woche Richtung Short, 4/13 Wochen Richtung Long.',
  'Russell Leveraged Money weiterhin netto long: 1 Woche Richtung Short, 4/13 Wochen Richtung Long.',
  'Nettozustand nicht mit Änderungsrichtung verwechseln; keine Bruttokäufe, Verkäufe oder Motive erfinden.',
  'Keine klare Richtung allein aus COT erzwingen; eigene Russell-Fakten verwenden.'
 ]}
] as const;

const date='2026-10-19';
function cot(group:string,net:number,deltas:number[]){return {group,observationDate:'2026-10-12',netPosition:net,netState:net>0?'NETTO_LONG':'NETTO_SHORT',changes:[1,4,13,26].map((weeks,i)=>({weeks,delta:deltas[i],shift:deltas[i]>0?'RICHTUNG_LONG':'RICHTUNG_SHORT'}))};}
function index(market:string,close:number,averages:number[],returns:number[],net:number,deltas:number[],scenario:string){
 const nas=market==='NASDAQ',recovery=scenario==='recovery',bear=scenario==='continuation';
 const low=nas?29000:2600,high=nas?32000:3000;
 const trigger=nas?28800:2580,invalidation=nas?33000:3100;
 return {
  structure:{source:'SYNTHETIC_EVALUATION_ONLY',referenceDate:date,phase:nas?'PHASE_2_WARNING':'PHASE_3_DISTRIBUTION',breadth:{b20:recovery?52:32,b50:40,b200:45},participation:recovery?55:38,quality:46},
  snapshotPrice:{current:close,observedMarketDate:date,momentum5D:returns[0],momentum20D:returns[2]},
  completedChart:{asOfDate:date,lastClose:close,averages:averages.map((average,i)=>({period:[20,50,200][i],average,relation:close>average?'ÜBER':close<average?'UNTER':'AUF',distancePct:(close/average-1)*100})),
   prior20:{highClose:high,lowClose:low},priceTrajectory:{windows:[5,10,20,30,60].map((sessions,i)=>({sessions,fromDate:['2026-10-12','2026-10-05','2026-09-21','2026-09-04','2026-07-24'][i],toDate:date,returnPct:returns[i]})),
    magnitudeContext:{latest:{fromDate:'2026-10-16',date,returnPct:recovery?1.4:0.2,historicalComparisonCount:252,priorAbsoluteMovesStrictlySmallerPct:recovery?75:15},largestInLast10ObservedIntervals:{fromDate:'2026-10-14',date:'2026-10-15',returnPct:bear?-3:-1.5,historicalComparisonCount:252,priorAbsoluteMovesStrictlySmallerPct:bear?97:80}}},
   formations:{classic:[],pointFigure:[{boxPercent:1,reversalBoxes:3,currentColumn:recovery?'X':'O',currentColumnSince:'2026-10-16',latest:{bias:'BEARISH',status:'CONFIRMED',discoveredAt:'2026-10-08',confirmedAt:'2026-10-08',confirmationLevel:trigger,invalidationLevel:invalidation,currentRelation:recovery?'COUNTER_TO_CURRENT_COLUMN':'ALIGNED_WITH_CURRENT_COLUMN',confirmationConditionMetNow:close<trigger}}]}},
  cotFacts:{groups:[cot('LEVERAGED_MONEY',net,deltas),cot('ASSET_MANAGER',nas?70000:30000,[-1000,3000,8000,9000])]},
  historicalStudies:[{family:'OWN_TREND',state:'SYNTHETIC_MATCHED_STATE',asOfDate:date,currentMatch:true,focus20D:{sampleSize:400,nonOverlappingCount:45,meanPct:2.5,baselineMeanPct:1.5,excessMeanPp:1,medianPct:2,p10Pct:-7,p90Pct:9}}]
 };
}

/** Real engine, synthetic observed weekday closes. No expected answer enters model facts. */
function attachAdvancedCase(data:any,caseId:string){
 const template=caseId==='pnf-traps'?[1000,1010,1004,1010,1004,1011,1008]:caseId==='pnf-reversed'?[1000,1010,1004,1012,1006,1014,1005]:[1000,1010,1004,1010,1004,1011,1008,1012];
 for(const market of ['NASDAQ','RUSSELL_2000']){
  const own=data.indices[market],mirror=market==='RUSSELL_2000',pattern=template.map(r=>mirror?2000-r:r);
  const desired=market==='NASDAQ'?30000:2700,step=Math.log(1.01),offset=Math.floor(Math.log(desired)/step)-pattern[pattern.length-1];
  const levels=[...Array(70).fill(pattern[0]),...pattern.slice(1)],dates:string[]=[];let cursor=new Date(date+'T00:00:00Z');
  while(dates.length<levels.length){if(cursor.getUTCDay()!==0&&cursor.getUTCDay()!==6)dates.unshift(cursor.toISOString().slice(0,10));cursor=new Date(cursor.getTime()-86400000);}
  const points=levels.map((r,i)=>({date:dates[i],close:Math.exp((r+offset)*step)})),last=points[points.length-1],close=last.close;
  const formations=buildFormationContext(points),history=buildFormationHistory(points,0);
  const trajectory=own.completedChart.priceTrajectory;
  trajectory.windows=[5,10,20,30,60].map(sessions=>({sessions,fromDate:points[points.length-1-sessions].date,toDate:last.date,returnPct:100*(close/points[points.length-1-sessions].close-1)}));
  const moves=points.slice(1).map((p,i)=>({fromDate:points[i].date,date:p.date,returnPct:100*(p.close/points[i].close-1)}));
  trajectory.magnitudeContext={latest:{...moves[moves.length-1],historicalComparisonCount:null,priorAbsoluteMovesStrictlySmallerPct:null},largestInLast10ObservedIntervals:{...moves.slice(-10).reduce((a,b)=>Math.abs(a.returnPct)>Math.abs(b.returnPct)?a:b),historicalComparisonCount:null,priorAbsoluteMovesStrictlySmallerPct:null}};
  own.snapshotPrice={current:close,observedMarketDate:last.date,momentum5D:trajectory.windows[0].returnPct,momentum20D:trajectory.windows[2].returnPct};
  own.completedChart={...own.completedChart,lastClose:close,averages:own.completedChart.averages.map((a:any)=>({...a,relation:close>a.average?'ÜBER':close<a.average?'UNTER':'AUF',distancePct:100*(close/a.average-1)})),prior20:{highClose:Math.max(...points.slice(-21,-1).map(p=>p.close)),lowClose:Math.min(...points.slice(-21,-1).map(p=>p.close))},formations:compactFormationContext(formations),formationHistory:compactFormationHistory(history,formations)};
 }
}

/** Controlled synthetic tests, not market observations or new training examples. */
export function evaluationInput(caseId:string){
 const spec=EVALUATION_CASES.find(c=>c.id===caseId);if(!spec)return null;
 const recovery=caseId==='recovery',bear=caseId==='continuation';
 const d={snapshotTimestamp:'2026-10-20T11:02:26.667Z',task:'SYNTHETIC_RESEARCH_EVALUATION',question:'Synthetischer Prüffall, keine aktuellen Marktdaten. Gleicher Researchauftrag für alle drei Instrumente.',
  indices:{NASDAQ:index('NASDAQ',recovery?30500:bear?28500:30000,[31000,30000,29000],recovery?[2,0,-3,-1,5]:bear?[-5,-6,-8,-10,-12]:[0.2,-0.3,0.1,0.2,1],-20000,caseId==='positioning'?[-4000,6000,12000,18000]:[4000,-6000,12000,18000],caseId),
   RUSSELL_2000:index('RUSSELL_2000',recovery?2800:bear?2550:2700,[2750,2900,2850],recovery?[3,1,-4,-6,-5]:bear?[-4,-7,-9,-12,-15]:[0.1,-0.2,0.2,0.1,-1],caseId==='positioning'?10000:-90000,[-3000,4000,9000,12000],caseId)},
  sharedContext:{master:{signal:'NEUTRAL',regime:'TRANSITION'},appFlows:[{instrument:'Nasdaq Put',eligible:false,modelSize:0},{instrument:'Nasdaq Call',eligible:false,modelSize:0},{instrument:'Russell Call',eligible:false,modelSize:0}]},weights:{marketStructure:35,chart:35,cot:10,history:15,news:5},news:[]};
 if(caseId.startsWith('pnf-'))attachAdvancedCase(d,caseId);
 const user=readableResearchFacts(d,{});
 return {spec,data:d,frozen:freezeRequest(d.snapshotTimestamp,NARRATIVE_PROMPT,user,0.7,2200)};
}
