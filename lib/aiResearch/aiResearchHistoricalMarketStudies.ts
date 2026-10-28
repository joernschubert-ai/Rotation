import type { AIHistoricalMarketStudy, AIHistoricalStudyStatistics, AIHistoricalEvidenceHorizon } from "./aiResearchHistoricalEvidenceTypes";

export type HistoricalStudyDay = { date: string; nasdaq: number; russell: number; sp500: number; vix: number };
type Day = HistoricalStudyDay;
type Point = { index: number; date: string; value: number; rise: number; fall: number };
const horizons: AIHistoricalEvidenceHorizon[] = [5, 20, 60];
const mean = (values: number[]): number | null => values.length ? values.reduce((a,b) => a+b,0)/values.length : null;
function quantile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b)=>a-b), location=(sorted.length-1)*p;
  const lower=Math.floor(location), upper=Math.ceil(location);
  return sorted[lower]+(sorted[upper]-sorted[lower])*(location-lower);
}
const change = (values: number[], index: number, lookback: number): number | null => index >= lookback ? (values[index]/values[index-lookback]-1)*100 : null;
function average(values: number[], index: number, length: number): number | null {
  return index >= length-1 ? mean(values.slice(index-length+1,index+1)) : null;
}
function summarize(points: Point[], baseline: Point[], horizonDays: AIHistoricalEvidenceHorizon): AIHistoricalStudyStatistics {
  const values=points.map(p=>p.value), baselineMeanReturn=mean(baseline.map(p=>p.value));
  const selected: Point[]=[];
  for (const point of points) {
    if (!selected.length || point.index >= selected[selected.length-1].index+horizonDays) selected.push(point);
  }
  const meanReturn=mean(values);
  return { horizonDays, sampleSize:points.length, firstDate:points[0]?.date??null, lastDate:points.at(-1)?.date??null,
    meanReturn, medianReturn:quantile(values,.5), p10Return:quantile(values,.1), p90Return:quantile(values,.9),
    positiveRate:values.length?values.filter(v=>v>0).length/values.length*100:null,
    meanMaximumRise:mean(points.map(p=>p.rise)), meanMaximumFall:mean(points.map(p=>p.fall)),
    baselineSampleSize:baseline.length, baselineMeanReturn,
    excessMeanReturn:meanReturn!==null&&baselineMeanReturn!==null?meanReturn-baselineMeanReturn:null,
    nonOverlapping:{sampleSize:selected.length,meanReturn:mean(selected.map(p=>p.value)),medianReturn:quantile(selected.map(p=>p.value),.5)} };
}

/** Fixed definitions, no parameter search. State at T uses only dates <= T.
 * Outcomes use subsequent aligned observations; no missing horizons are extrapolated.
 */
export function buildHistoricalMarketStudies(input: Day[]): AIHistoricalMarketStudy[] {
  const seen=new Set<string>();
  const days=[...input].sort((a,b)=>a.date.localeCompare(b.date));
  for (const day of days) {
    const parsed = Date.parse(`${day.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0,10)!==day.date || seen.has(day.date) ||
      ![day.nasdaq,day.russell,day.sp500,day.vix].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>0)) {
      throw new Error('Historical market studies require unique valid dates and positive observed prices.');
    }
    seen.add(day.date);
  }
  if (!days.length) return [];
  const vix=days.map(d=>d.vix), result:AIHistoricalMarketStudy[]=[];
  for (const market of ['NASDAQ','RUSSELL_2000'] as const) {
    const prices=days.map(d=>market==='NASDAQ'?d.nasdaq:d.russell);
    const families=historicalMarketStateSeries(days,market);
    const future = new Map<number,Point[]>();
    for (const horizon of horizons) {
      const points:Point[]=[];
      for(let i=0;i+horizon<days.length;i++) {
        const path=prices.slice(i+1,i+horizon+1).map(p=>(p/prices[i]-1)*100);
        points.push({index:i,date:days[i].date,value:path.at(-1)!,rise:Math.max(0,...path),fall:Math.min(0,...path)});
      }
      future.set(horizon,points);
    }
    for(const family of families) {
      const current=family.states.at(-1);
      if(!current) continue;
      result.push({market,asOfDate:days.at(-1)!.date,currentMatch:true,family:family.family,state:current,definition:family.definition,
        statistics:horizons.map(h=>{
          const eligible=future.get(h)!.filter(p=>family.states[p.index]!==null);
          return summarize(eligible.filter(p=>family.states[p.index]===current),eligible,h);
        }),
        limitations:[
          'Descriptive underlying-index price returns, not option or warrant payoffs. No validated predictive edge.',
          'Daily closing-mark excursions include the starting zero; intraday high/low excursions are not available.',
          'Daily samples overlap. The non-overlapping subset is earliest-first with a horizon-length spacing; it is not proof of independence or an out-of-sample test.',
          'Horizons count aligned observations, not a verified complete exchange calendar. Latest daily bar finality is unverified.',
          'These are single fixed-condition studies, not a combined multi-factor or COT-conditioned forecast.'
        ]});
    }
  }
  return result;
}

/** Shared fixed definitions. Caller supplies sorted, valid observations. No future values read. */
export function historicalMarketStateSeries(days:Day[],market:'NASDAQ'|'RUSSELL_2000'):Array<{family:AIHistoricalMarketStudy['family'];definition:string;states:Array<string|null>}>{
    const prices=days.map(d=>market==='NASDAQ'?d.nasdaq:d.russell),other=days.map(d=>market==='NASDAQ'?d.russell:d.nasdaq),vix=days.map(d=>d.vix);
    return [
      {family:'OWN_TREND',definition:'Own index above/below its 50- and 200-observation simple moving averages.',states:prices.map((price,i)=>{
        const ma50=average(prices,i,50),ma200=average(prices,i,200);
        return ma50===null||ma200===null?null:`${price>=ma50?'ABOVE':'BELOW'}_MA50_${price>=ma200?'ABOVE':'BELOW'}_MA200`;
      })},
      {family:'ROTATION_20D',definition:'Own 20-observation return minus the other index return: positive LEADING, negative LAGGING, zero EQUAL. State is own-index relative.',states:prices.map((_,i)=>{
        const own=change(prices,i,20),peer=change(other,i,20);
        return own===null||peer===null?null:own>peer?'LEADING':own<peer?'LAGGING':'EQUAL';
      })},
      {family:'OWN_PRICE_VIX_5D',definition:'Signs of own-index and VIX returns over five aligned observations.',states:prices.map((_,i)=>{
        const own=change(prices,i,5),vol=change(vix,i,5);
        return own===null||vol===null?null:`PRICE_${own>0?'UP':own<0?'DOWN':'FLAT'}_VIX_${vol>0?'UP':vol<0?'DOWN':'FLAT'}`;
      })}
    ];
}
