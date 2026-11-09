import {completedDailyCutoff} from './aiResearchChartContext';
import {confirmedRecoveryLows,type EarlySignal} from './aiResearchEarlyRecoverySignals';
type Row={date:string;close:number;lows:number;valid:number;identity:string};
const number=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const members=(x:unknown):x is string[]=>Array.isArray(x)&&x.every(s=>typeof s==='string'&&s.length>0)&&new Set(x).size===x.length;
/** Exact observed member identity; no historical member reconstruction or missing-day fill. */
export function newLowDivergence(history:any[],market:string,sessions:{date:string;close:number}[],snapshotTimestamp:string,asOf:string):EarlySignal{
 const byDate=new Map<string,Row>(),conflicts=new Set<string>();
 const times=sessions.map(s=>s.date),validSessions=sessions.every((s,i)=>/^\d{4}-\d{2}-\d{2}$/.test(s.date)&&number(s.close)&&s.close>0&&(i===0||s.date>times[i-1]));
 if(validSessions&&Number.isFinite(Date.parse(snapshotTimestamp)))for(const f of history){
  if(!Number.isFinite(Date.parse(f?.timestamp))||Date.parse(f.timestamp)>Date.parse(snapshotTimestamp))continue;
  const q=f.breadthDataQuality?.[market==='NASDAQ'?'nasdaq100':'russell2000']?.dataQuality,o=q?.highLowObservation;
  if(q?.available!==true||!number(q.minimumCoverage)||q.minimumCoverage<0.95||q.minimumCoverage>1||typeof q.universeVersion!=='string'||!q.universeVersion||typeof q.constituentFingerprint!=='string'||!q.constituentFingerprint||o?.version!=='CONSTITUENT_CLOSE_EXTREMES_V1'||o.inputValid!==true||o.referenceDate!==q.referenceDate||o.definition!=='252_OBSERVED_CLOSE_WINDOW_INCLUDING_CURRENT_TIES_INCLUDED'||!members(o.validMembers)||!members(o.newLowMembers)||!Number.isInteger(o.expected)||o.expected<=0||o.valid!==o.validMembers.length||o.valid>o.expected||o.newLows!==o.newLowMembers.length||!o.newLowMembers.every((s:string)=>o.validMembers.includes(s))||o.valid/o.expected<q.minimumCoverage)continue;
  const session=sessions.find(s=>s.date===o.referenceDate);if(!session||session.date>asOf||session.date>completedDailyCutoff(new Date(f.timestamp)))continue;
  const row={date:session.date,close:session.close,lows:o.newLows,valid:o.valid,identity:JSON.stringify([q.universeVersion,q.constituentFingerprint,[...o.validMembers].sort()])};
  const old=byDate.get(row.date);if(old&&JSON.stringify(old)!==JSON.stringify(row))conflicts.add(row.date);else byDate.set(row.date,row);
 }
 const rows:Row[]=[];let identity:string|undefined;
 for(let i=sessions.length-1;validSessions&&i>=0;i--){const r=byDate.get(sessions[i].date);if(!r||conflicts.has(r.date)||identity&&identity!==r.identity)break;rows.unshift(r);identity=r.identity;}
 const events:number[]=[],pivots:number[]=[],pivotRows=rows.map(r=>({...r,rsi14:null}));
 for(let i=0;i<rows.length;i++){const p=confirmedRecoveryLows(pivotRows,i);if(p===null)continue;const prior=pivots.at(-1);if(prior!==undefined&&p-prior>=5&&p-prior<=60&&rows[p].close<=rows[prior].close*.999&&rows[prior].lows>0&&rows[p].lows<rows[prior].lows)events.push(i);pivots.push(p);}
 const ready=rows.length>=65&&rows.at(-1)?.date===asOf,last=events.at(-1),age=last===undefined?null:rows.length-1-last;
 return {id:'NEW_LOW_DIVERGENCE',title:'Weniger neue Mitgliedertiefs',family:'BREADTH_NEW_LOWS',status:!ready?'UNAVAILABLE':age===0?'TODAY':age!==null&&age<=10?'RECENT':'NONE',active:ready?age===0:null,signalDate:ready&&last!==undefined?rows[last].date:null,ageIntervals:ready?age:null,explanation:'Neues Index-Schlusstief, aber weniger Mitglieder erreichen ihr 252-Beobachtungs-Schlusstief. MÃ¶gliches Nachlassen des Verkaufsdrucks.',detail:`Eigene Kontextregel, ohne zusÃ¤tzliches Gewicht: zwei bestÃ¤tigte Schlusskurstiefs (je 2 Beobachtungen links/rechts), Abstand 5â€“60 Intervalle, zweiter Indexschluss mindestens 0,1 % tiefer, weniger neue Tiefs bei exakt gleicher beobachteter Mitgliedergruppe. Erst zwei Beobachtungen nach dem Tief bekannt. ${rows.length}/65 vergleichbare Beobachtungen; keine Trefferquote, kein Intraday-52-Wochen-Tief und keine Einstiegsfreigabe.`};
}
