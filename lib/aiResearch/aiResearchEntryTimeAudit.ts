import type {AppFacts} from './aiResearchAppFacts';
export interface EntryTimeFinding {code:string;quote:string;sourceIds:string[];explanation:string;}
export function auditEntryTimeUnits(text:string,instrument:string,facts:AppFacts):EntryTimeFinding[]{
 const prefix=instrument==='RUSSELL_CALL'?'R-F':'N-F',own=facts.facts.filter(f=>f.id.startsWith(prefix+'-')),findings:EntryTimeFinding[]=[];
 const windows=own.filter(f=>f.domain==='Kursverlauf'&&typeof f.values.sessions==='number');
 const weekValues=own.filter(f=>f.domain==='Kalenderwochen'&&f.values.week&&typeof f.values.week==='object').map(f=>({id:f.id,week:f.values.week as Record<string,any>}));
 for(const m of text.matchAll(/\b((?:\d{1,3}\s*[\/,]\s*)*\d{1,3})\s*[-– ]?\s*(?:Wochen|weeks?)(?:[-– ](?:Trend|Rendite|Fenster|Momentum))?/gi)){
  const at=m.index??0,start=Math.max(text.lastIndexOf('.',at-1),text.lastIndexOf(';',at-1),text.lastIndexOf(':',at-1))+1,clause=text.slice(start,Math.min(text.length,at+m[0].length+35));
  if(/COT|Kontrakt|Positionier|Nettoänder/i.test(clause)||/(?:COT|Nettoänderung|Positionierung|Kontrakte)[^.;:]{0,50}:?[^.;:]{0,8}$/i.test(text.slice(Math.max(0,at-65),at)))continue;
  const counts=m[1].split(/[\/,]/).map(Number),sources=windows.filter(f=>counts.includes(f.values.sessions as number));
  if(sources.length)findings.push({code:'SESSION_INTERVALS_CALLED_WEEKS',quote:m[0],sourceIds:sources.map(f=>f.id),explanation:`Die gelieferten ${sources.map(f=>f.values.sessions).join('/')} Fenster zählen beobachtete Sitzungsintervalle. Eine gleich lange Wochen-Trendreihe ist hier nicht belegt.`});
 }
 // A rolling five-interval return can coincide with a completed calendar week.
 // Do not flag it if the supplied week independently supports the quoted number.
 for(const m of text.matchAll(/([+-]?\d+(?:[.,]\d+)?)\s*%\s*(?:in|über)\s*(?:der|die|einer?)\s+Woche/gi)){
  const value=Number(m[1].replace(',','.')),decimals=m[1].split(/[.,]/)[1]?.length??0,tolerance=.5*Math.pow(10,-decimals)+1e-8;
  if(weekValues.some(({week})=>week.available===true&&typeof week.returnPct==='number'&&Math.abs(week.returnPct-value)<=tolerance))continue;
  const source=windows.find(f=>f.values.sessions===5&&typeof f.values.returnPct==='number'&&Math.abs((f.values.returnPct as number)-value)<=tolerance);
  if(source)findings.push({code:'ROLLING_RETURN_CALLED_CALENDAR_WEEK',quote:m[0],sourceIds:[source.id],explanation:'Die Zahl passt zum rollierenden Fünf-Intervall-Fenster; eine passende abgeschlossene Kalenderwoche ist in den gelieferten Fakten nicht belegt.'});
 }
 return findings;
}
