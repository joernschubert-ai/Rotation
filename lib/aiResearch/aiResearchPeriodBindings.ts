import type { AppFact } from './aiResearchAppFacts';
export interface PeriodBinding {
 kind:'OBSERVED_ROLLING_RETURN'|'HISTORICAL_FORWARD_RETURN'|'COMPLETED_CALENDAR_WEEK';
 count:number;unit:'OBSERVED_SESSION_INTERVALS'|'CALENDAR_WEEK';
 fromDate:string|null;toDate:string|null;selectionLookbackIntervals?:20;
}
const date=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const object=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
/** Unit/role labels for existing source facts. No new return or conversion between sessions and weeks. */
export function periodBinding(f:AppFact):PeriodBinding|null{
 const v=f.values;if(f.status==='MISSING')return null;
 if(f.domain==='Kursverlauf'&&/-WINDOW-\d+$/.test(f.id)&&typeof v.sessions==='number'&&Number.isInteger(v.sessions)&&v.sessions>0&&Number(f.id.split('-').at(-1))===v.sessions&&typeof v.returnPct==='number'&&Number.isFinite(v.returnPct)&&date(v.fromDate)&&date(v.toDate)&&v.fromDate<v.toDate&&v.toDate===f.asOf)
  return {kind:'OBSERVED_ROLLING_RETURN',count:v.sessions,unit:'OBSERVED_SESSION_INTERVALS',fromDate:v.fromDate,toDate:v.toDate};
 if(f.domain==='Historische Vergleiche'&&/^([NR]-F)-H\d+$/.test(f.id))
  return {kind:'HISTORICAL_FORWARD_RETURN',count:20,unit:'OBSERVED_SESSION_INTERVALS',fromDate:null,toDate:null,...(v.family==='ROTATION_20D'?{selectionLookbackIntervals:20 as const}:{})};
 const week=object(v.week);
 if(f.domain==='Kalenderwochen'&&/-WEEK-\d+$/.test(f.id)&&week.available===true&&date(week.calendarWeekStart)&&date(week.calendarWeekEnd)&&week.calendarWeekStart<=week.calendarWeekEnd)
  return {kind:'COMPLETED_CALENDAR_WEEK',count:1,unit:'CALENDAR_WEEK',fromDate:week.calendarWeekStart,toDate:week.calendarWeekEnd};
 return null;
}
