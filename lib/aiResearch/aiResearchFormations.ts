export type FormationStatus='FORMING'|'CONFIRMED'|'INVALIDATED';
export interface Formation {
 id:string;family:'DOUBLE_BOTTOM'|'DOUBLE_TOP'|'PNF_DOUBLE_TOP_BREAKOUT'|'PNF_DOUBLE_BOTTOM_BREAKDOWN'|'PNF_TRIPLE_TOP_BREAKOUT'|'PNF_TRIPLE_BOTTOM_BREAKDOWN';
 bias:'BULLISH'|'BEARISH';status:FormationStatus;discoveredAt:string;asOfDate:string;confirmedAt:string|null;invalidatedAt:string|null;
 confirmationLevel:number;invalidationLevel:number;
 meaning:string;confirmation:string;invalidation:string;
 target:null|{price:number;method:string;status:'PRELIMINARY'|'FIXED';knownAt:string;countFixedAt:string|null};
 predictiveEdgeValidated:false;
 currentRelation?:'ALIGNED_WITH_CURRENT_COLUMN'|'COUNTER_TO_CURRENT_COLUMN'|'INVALIDATED';
 confirmationConditionMetNow?:boolean;
}
export type FormationPoint={date:string;close:number};
const round=(x:number)=>Math.round(x*10000)/10000;
const pct=(a:number,b:number)=>100*(a/b-1);
const rules=(bias:'BULLISH'|'BEARISH',confirm:number,invalid:number)=>({
 meaning:bias==='BULLISH'?'Mögliche Aufwärtsstruktur; keine Prognose oder automatische Call-Freigabe.':'Mögliche Abwärtsstruktur; keine Prognose oder automatische Put-Freigabe.',
 confirmation:bias==='BULLISH'?`Eigener Tagesschluss erreicht mindestens ${round(confirm)}.`:`Eigener Tagesschluss erreicht höchstens ${round(confirm)}.`,
 invalidation:bias==='BULLISH'?`Eigener Tagesschluss erreicht höchstens ${round(invalid)}.`:`Eigener Tagesschluss erreicht mindestens ${round(invalid)}.`,
});
function updateStatus(signal:Formation,point:FormationPoint,levels={confirmation:signal.confirmationLevel,invalidation:signal.invalidationLevel}){
 if(signal.status==='INVALIDATED')return;
 const bull=signal.bias==='BULLISH';
 const epsilon=1e-12*Math.max(1,point.close);
 if(bull?point.close<=levels.invalidation+epsilon:point.close>=levels.invalidation-epsilon){signal.status='INVALIDATED';signal.invalidatedAt=point.date;return;}
 if(signal.status==='FORMING'&&(bull?point.close>=levels.confirmation-epsilon:point.close<=levels.confirmation+epsilon)){signal.status='CONFIRMED';signal.confirmedAt=point.date;}
}

/** Fixed close-only operational definition; pivots become known three sessions later. */
export function detectDoubleFormations(points:FormationPoint[]):Formation[]{
 const n=points.length;if(n<30)return [];
 const pivots:{i:number;kind:'HIGH'|'LOW'}[]=[];
 for(let i=Math.max(10,n-120);i<n-3;i++){
  const neighbors=points.slice(i-3,i+4).filter((_,j)=>j!==3);
  if(neighbors.every(p=>p.close<points[i].close))pivots.push({i,kind:'HIGH'});
  if(neighbors.every(p=>p.close>points[i].close))pivots.push({i,kind:'LOW'});
 }
 const signals:Formation[]=[];
 for(const kind of ['LOW','HIGH'] as const){
  const own=pivots.filter(p=>p.kind===kind);
  for(let b=1;b<own.length;b++){
   const a=own[b-1].i,c=own[b].i,gap=c-a;
   if(gap<8||gap>60||n-1-(c+3)>63)continue;
   const first=points[a].close,second=points[c].close,bull=kind==='LOW';
   if(Math.abs(pct(second,first))>1.5)continue;
   const approach=pct(first,points[a-10].close);if(bull?approach> -3:approach<3)continue;
   const between=points.slice(a+1,c).map(p=>p.close);
   const neck=bull?Math.max(...between):Math.min(...between);
   if(bull?pct(neck,Math.max(first,second))<3:pct(Math.min(first,second),neck)<3)continue;
   const confirm=neck*(bull?1.005:0.995),invalid=(bull?Math.min(first,second):Math.max(first,second))*(bull?0.99:1.01);
   const bias=bull?'BULLISH':'BEARISH',family=bull?'DOUBLE_BOTTOM':'DOUBLE_TOP';
   const signal:Formation={id:family+':'+points[c].date,family,bias,status:'FORMING',discoveredAt:points[c+3].date,asOfDate:points[n-1].date,confirmedAt:null,invalidatedAt:null,
    confirmationLevel:round(confirm),invalidationLevel:round(invalid),...rules(bias,confirm,invalid),target:null,predictiveEdgeValidated:false};
   for(const point of points.slice(c+3))updateStatus(signal,point);
   // Keep the latest recognized instance per family; dates make recognition delay explicit.
   signals.push(signal);
  }
 }
 return signals.filter((s,i)=>!signals.slice(i+1).some(other=>other.family===s.family));
}

interface Column {direction:'X'|'O';low:number;high:number;startedAt:string;updatedAt:string;fixedAt:string|null;}
interface PnfEvent {signal:Formation;column:number;levels:{confirmation:number;invalidation:number};}
/** Geometric percentage grid anchored at price 1; it never rescales old boxes. */
export interface PnfObservation {index:number;date:string;forming:Formation|null;latest:Formation|null;fixed:Formation[];}
export function buildPointFigure(points:FormationPoint[],boxPercent:number,onObservation?:(value:PnfObservation)=>void){
 if(![0.5,1].includes(boxPercent))throw Error('Unsupported P&F scale');
 if(points.some((p,i)=>!Number.isFinite(p.close)||p.close<=0||(i>0&&p.date<=points[i-1].date)))throw Error('P&F data must be positive, unique and chronological');
 const reversal=3,step=Math.log(1+boxPercent/100);
 const up=(price:number)=>Math.floor(Math.log(price)/step+1e-9),down=(price:number)=>Math.ceil(Math.log(price)/step-1e-9);
 const price=(box:number)=>Math.exp(box*step);
 const columns:Column[]=[],events:PnfEvent[]=[];
 const seed=points.length?up(points[0].close):0;
 const add=(direction:'X'|'O',low:number,high:number,date:string)=>columns.push({direction,low,high,startedAt:date,updatedAt:date,fixedAt:null});
 const formingAt=(latestDate:string)=>{const ci=columns.length-1,last=columns[ci];
 // A developing signal is allowed before breakout, only within two grid boxes.
 let forming:Formation|null=null;
 if(last&&ci>=2&&!events.some(e=>e.column===ci)){
  const bull=last.direction==='X',previous=columns[ci-2],opposite=columns[ci-1];
  const remaining=bull?previous.high+1-last.high:last.low-(previous.low-1);
  if(remaining>=1&&remaining<=2){
   const confirm=price(bull?previous.high+1:previous.low-1),invalid=price(bull?opposite.low-1:opposite.high+1),bias=bull?'BULLISH':'BEARISH';
   const family=bull?'PNF_DOUBLE_TOP_BREAKOUT':'PNF_DOUBLE_BOTTOM_BREAKDOWN';
   forming={id:family+':'+boxPercent+':FORMING:'+last.startedAt,family,bias,status:'FORMING',discoveredAt:latestDate!,asOfDate:latestDate!,confirmedAt:null,invalidatedAt:null,
    confirmationLevel:round(confirm),invalidationLevel:round(invalid),...rules(bias,confirm,invalid),target:null,predictiveEdgeValidated:false};
  }
 }

 return forming;};
 const project=(event:PnfEvent,latestDate:string,lastClose:number):Formation=>{const last=columns[columns.length-1];

  const col=columns[event.column],bull=col.direction==='X',low=price(col.low),high=price(col.high);
  // Percentage-grid variant documented as price-height projection: bullish 3x,
  // bearish 2x (Dorsey 2/3 of three). Not a constant-box-count formula.
  const projected=bull?low+(high-low)*3:high-(high-low)*2;
  const currentRelation=event.signal.status==='INVALIDATED'?'INVALIDATED' as const:last?.direction===col.direction?'ALIGNED_WITH_CURRENT_COLUMN' as const:'COUNTER_TO_CURRENT_COLUMN' as const;

  const epsilon=1e-12*Math.max(1,lastClose??1);
  return {...event.signal,currentRelation,confirmationConditionMetNow:typeof lastClose==='number'&&(bull?lastClose>=event.levels.confirmation-epsilon:lastClose<=event.levels.confirmation+epsilon),asOfDate:latestDate!,target:projected>0?{price:round(projected),method:'GEOMETRIC_COLUMN_PRICE_HEIGHT_UP_3_DOWN_2',status:col.fixedAt?'FIXED' as const:'PRELIMINARY' as const,knownAt:col.fixedAt??latestDate!,countFixedAt:col.fixedAt}:null};
 };
 const advance=(point:FormationPoint)=>{
  const u=up(point.close),d=down(point.close);
  for(const event of events)updateStatus(event.signal,point,event.levels);
  let col=columns[columns.length-1];
  if(!col){if(u>=seed+1)add('X',seed+1,u,point.date);else if(d<=seed-1)add('O',d,seed-1,point.date);else return;}
  else if(col.direction==='X'){
   if(u>col.high){col.high=u;col.updatedAt=point.date;}
   else if(d<=col.high-reversal){col.fixedAt=point.date;add('O',d,col.high-1,point.date);}
  }else{
   if(d<col.low){col.low=d;col.updatedAt=point.date;}
   else if(u>=col.low+reversal){col.fixedAt=point.date;add('X',col.low+1,u,point.date);}
  }
  const ci=columns.length-1;col=columns[ci];
  if(ci<2||events.some(e=>e.column===ci))return;
  const previous=columns[ci-2],before=ci>=4?columns[ci-4]:undefined,bull=col.direction==='X';
  if(bull?col.high<=previous.high:col.low>=previous.low)return;
  const triple=before&&(bull?before.high===previous.high:before.low===previous.low);
  const family=bull?(triple?'PNF_TRIPLE_TOP_BREAKOUT':'PNF_DOUBLE_TOP_BREAKOUT'):(triple?'PNF_TRIPLE_BOTTOM_BREAKDOWN':'PNF_DOUBLE_BOTTOM_BREAKDOWN');
  const confirm=price(bull?previous.high+1:previous.low-1),opposite=columns[ci-1];
  const invalid=price(bull?opposite.low-1:opposite.high+1),bias=bull?'BULLISH':'BEARISH';
  events.push({column:ci,levels:{confirmation:confirm,invalidation:invalid},signal:{id:family+':'+boxPercent+':'+point.date,family,bias,status:'CONFIRMED',discoveredAt:point.date,confirmedAt:point.date,invalidatedAt:null,asOfDate:point.date,
   confirmationLevel:round(confirm),invalidationLevel:round(invalid),...rules(bias,confirm,invalid),target:null,predictiveEdgeValidated:false}});
 };
 for(let i=1;i<points.length;i++){advance(points[i]);if(onObservation)onObservation({index:i,date:points[i].date,forming:formingAt(points[i].date),latest:events.length?project(events[events.length-1],points[i].date,points[i].close):null,fixed:events.filter(e=>columns[e.column].fixedAt===points[i].date).map(e=>project(e,points[i].date,points[i].close))});}

 const latestDate=points[points.length-1]?.date??null,ci=columns.length-1,last=columns[ci];
 const forming=latestDate?formingAt(latestDate):null;
 const signals=latestDate?events.slice(-8).map(event=>project(event,latestDate,points[points.length-1].close)):[];
 return {boxPercent,reversalBoxes:reversal,gridAnchor:1,method:'DAILY_CLOSE_GEOMETRIC_GRID',asOfDate:latestDate,currentColumn:last?.direction??null,currentColumnSince:last?.startedAt??null,columnCount:columns.length,
  columns:columns.slice(-20).map(c=>({direction:c.direction,low:round(price(c.low)),high:round(price(c.high)),boxes:c.high-c.low+1,startedAt:c.startedAt,updatedAt:c.updatedAt,fixedAt:c.fixedAt})),
  signals,forming,
  limitations:['Fixed percentage settings, not optimized for either index.','P&F Double Top Breakout is bullish and is NOT the classic bearish double top.','Vertical targets are rough price-height scenarios; preliminary targets change until column reversal fixes the count.','No horizontal count, 45-degree trendline, target-hit probability, time target or option return.','Fixed target means fixed column count, not assured realization or independent activation.'],
 };
}

export function buildFormationContext(points:FormationPoint[]){
 if(points.some((p,i)=>!Number.isFinite(p.close)||p.close<=0||(i>0&&p.date<=points[i-1].date)))throw Error('Formation data must be positive, unique and chronological');
 return {version:'CLOSE_FORMATIONS_V1_1',asOfDate:points[points.length-1]?.date??null,
  classic:detectDoubleFormations(points),pointFigure:[buildPointFigure(points,0.5),buildPointFigure(points,1)],
  interpretation:{FORMING:'Nach Regel erkennbare entstehende Struktur, Bestätigung fehlt; frühe Hypothese darf ausdrücklich bedingt diskutiert werden.',CONFIRMED:'Definierte Preisbedingung ausgelöst; kein bestätigter künftiger Kursverlauf und keine App-Freigabe.',INVALIDATED:'Definierte Ungültigkeitsbedingung ausgelöst; ursprüngliche Hypothese nicht als gültigen Einstieg verwenden.'},
  definitions:{classicPivotConfirmationSessions:3,classicPivotGapSessions:[8,60],classicPivotTolerancePct:1.5,classicNecklineDepthPct:3,classicPriorApproachSessions:10,classicPriorApproachPct:3,classicBreakoutBufferPct:0.5,classicInvalidationBufferPct:1},
  predictiveEdgeValidated:false,automaticExecution:false,
  limitations:['Close-only operational definitions, not comprehensive discretionary chart analysis.','Pivots are recognized only after three subsequent completed sessions; discovery dates include that delay.','No head-and-shoulders, flags, triangles, candles or volume confirmation in this version.','Settings are hypotheses to evaluate historically, not established profitable thresholds.'],
 };
}

/** Bound model payload; full columns/history stay in the report, not the prompt. */
export function compactFormationContext(context:ReturnType<typeof buildFormationContext>){
 const pick=(f:Formation)=>({id:f.id,family:f.family,bias:f.bias,status:f.status,discoveredAt:f.discoveredAt,confirmedAt:f.confirmedAt,invalidatedAt:f.invalidatedAt,
  confirmationLevel:f.confirmationLevel,invalidationLevel:f.invalidationLevel,currentRelation:f.currentRelation,confirmationConditionMetNow:f.confirmationConditionMetNow,target:f.status==='INVALIDATED'?null:f.target});
 return {asOfDate:context.asOfDate,classic:context.classic.map(pick),pointFigure:context.pointFigure.map(p=>({boxPercent:p.boxPercent,reversalBoxes:p.reversalBoxes,currentColumn:p.currentColumn,currentColumnSince:p.currentColumnSince,
  latest:p.signals.length?pick(p.signals[p.signals.length-1]):null,forming:p.forming?pick(p.forming):null})),
  meaning:'FORMING = unconfirmed setup; CONFIRMED = historical trigger date, not necessarily current direction. Read currentColumn and currentRelation separately; a counter-column does not automatically invalidate the old pattern. INVALIDATED = hypothesis failed. P&F top breakout bullish, classic double top bearish. Targets are scenarios, not probabilities, times or warrant returns.'};
}

export type FormationContext=ReturnType<typeof buildFormationContext>;
