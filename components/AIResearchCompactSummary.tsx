import type {AIResearchReport} from '@/lib/aiResearch/aiResearchTypes';
import type {researchQuickView} from '@/lib/aiResearch/aiResearchQuickView';
import {anticyclicalInstrumentReading} from './AIResearchEntryContext';
const tone=(value:string)=>value==='good'?'border-emerald-700 bg-emerald-950/40 text-emerald-200':value==='bad'?'border-rose-700 bg-rose-950/40 text-rose-200':value==='watch'?'border-amber-700 bg-amber-950/30 text-amber-200':'border-slate-600 bg-slate-900/50 text-slate-300';
function dateNumber(value:string){const time=Date.parse(value+'T00:00:00Z');return Number.isFinite(time)?time:NaN;}
function closeInTime(a:{date:string}|undefined,b:{date:string}|undefined,maxDays=4){if(!a||!b)return false;const x=dateNumber(a.date),y=dateNumber(b.date);return Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=maxDays*86400000;}
function antiFactorSummary(report:AIResearchReport,instrument:string){
 const sequence=report.appFacts?.sequenceAnalysis;
 if(sequence?.status!=='AVAILABLE')return '';
 const events=sequence.sequence;
 const dated=events.filter(event=>Number.isFinite(dateNumber(event.date))).sort((a,b)=>a.date.localeCompare(b.date));
 if(!dated.length)return '';
 const latestDate=dated[dated.length-1].date,cutoff=dateNumber(latestDate)-7*86400000;
 const recent=dated.filter(event=>dateNumber(event.date)>=cutoff);
 const all=(factor:string,direction:string)=>recent.filter(event=>event.factor===factor&&event.direction===direction);
 const last=(factor:string,direction:string)=>all(factor,direction).at(-1);
 const dateLabel=(event:{date:string}|undefined)=>event?new Date(event.date+'T12:00:00Z').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',timeZone:'UTC'}):'';
 const parts:string[]=[];
 const isPut=instrument==='NASDAQ_PUT';
 const priceDown=last('NASDAQ_INDEX_OBSERVATION','DOWN'),priceUp=last('NASDAQ_INDEX_OBSERVATION','UP');
 const breadthUp=[last('BREADTH20','UP'),last('BREADTH50','UP')].filter((event):event is NonNullable<typeof event>=>Boolean(event));
 const breadthDown=[last('BREADTH20','DOWN'),last('BREADTH50','DOWN')].filter((event):event is NonNullable<typeof event>=>Boolean(event));
 const vixUp=last('VIX_LEVEL','UP'),vixDown=last('VIX_LEVEL','DOWN');
 if(isPut){
   const price=priceUp,breadth=breadthDown.find(event=>!price||event.date>=price.date);
   if(price&&breadth&&closeInTime(price,breadth,7))parts.push(`Nach dem Nasdaq-Anstieg am ${dateLabel(price)} ließ die Breite am ${dateLabel(breadth)} nach – das stützt die antizyklische Put-Prüfung.`);
   if(price&&vixUp&&vixUp.date>=price.date&&closeInTime(price,vixUp,7))parts.push(`Der VIX zog am ${dateLabel(vixUp)} ebenfalls an.`);
 }else{
   const price=priceDown;
   const improving=breadthUp.filter(event=>!price||event.date>=price.date);
   const recovery=price&&improving.length>0&&closeInTime(price,improving[improving.length-1],7);
   if(recovery){
     const breadthDates=[...new Set(improving.map(dateLabel))].join(' und ');
     parts.push(`Nach dem Nasdaq-Rückgang am ${dateLabel(price)} verbesserte sich die Breite am ${breadthDates}${priceUp&&priceUp.date>price.date?`; am ${dateLabel(priceUp)} stieg auch der Nasdaq wieder`:''} – das stützt die antizyklische Call-Prüfung, bestätigt aber keine Trendwende.`);
     if(vixUp&&vixDown&&vixUp.date<=vixDown.date&&closeInTime(price,vixDown,7))parts.push(`Der VIX zog am ${dateLabel(vixUp)} zunächst an und gab am ${dateLabel(vixDown)} wieder nach.`);
     else if(vixDown&&closeInTime(price,vixDown,7))parts.push(`Der VIX gab am ${dateLabel(vixDown)} nach.`);
     else if(vixUp&&closeInTime(price,vixUp,7))parts.push(`Der VIX zog am ${dateLabel(vixUp)} an.`);
   }else if(price&&vixUp&&closeInTime(price,vixUp,4)){
     parts.push(`Nasdaq-Rückgang am ${dateLabel(price)} und VIX-Anstieg am ${dateLabel(vixUp)} bilden Stresskontext für die antizyklische Call-Prüfung; eine Umkehr ist nicht bestätigt.`);
   }
 }
 if(instrument==='RUSSELL_CALL'){
   const relative=last('SMALL_VS_TECH','UP');
   if(relative)parts.push(`Russell gewinnt relativ zu Tech (${dateLabel(relative)}) – zusätzliche relative Unterstützung für den Russell Call.`);
 }
 return parts.join(' ');
}
/** Read-only projection of existing approved app state and explicitly unverified model text. */
export function AIResearchCompactSummary({report,view}:{report:AIResearchReport;view:ReturnType<typeof researchQuickView>}){
 return <section aria-label="Research auf einen Blick" className="mt-4 rounded-xl border border-slate-600 bg-slate-950/30 p-3">
  <h4 className="font-semibold text-white">Research auf einen Blick</h4>
  <div className="mt-3 grid gap-3 sm:grid-cols-3">{view.cards.map(card=>{
   const d=card.dashboard,current=view.appFrameCurrent;
   const f=current?report.appFacts?.facts.find(f=>f.id===(card.instrument==='RUSSELL_CALL'?'R-F-ENTRY-TIMING':'N-F-ENTRY-TIMING')&&f.asOf===d.index.asOf):null;
   const anti=anticyclicalInstrumentReading(f,card.instrument);
   const factorSequence=antiFactorSummary(report,card.instrument);
   const chart=current?report.aiSynthesis?.priceReferences?.find(x=>x.instrument===card.instrument&&x.asOfDate===d.index.asOf):undefined;
   const lower=chart?.downLevels?.[0],upper=chart?.upLevels?.[0];
   const row=card.status==='AVAILABLE'?report.aiSynthesis?.sourceReview?.view?.find(r=>r.instrument===card.instrument):null;
   const review=card.status==='AVAILABLE'?report.aiSynthesis?.sourceReview?.entryTimingReview?.instruments.find(r=>r.instrument===card.instrument):null;
   const concrete=review?.concreteEntryUse;
   const raw=row?.interpretation.text??'',match=/Neueinstieg\s*:\s*([\s\S]*)/i.exec(raw);
   const snippet=(match?.[1]??raw).replace(/\[[NR]-ENTRY-[A-Z]+\]/g,'').replace(/\s+/g,' ').trim();
   return <article key={card.instrument} className="min-w-0 rounded-lg border border-slate-700 bg-[#121d2a] p-3">
    <h5 className="font-semibold text-white">{card.title}</h5>
    <div className={'mt-2 rounded border px-2 py-2 '+tone(current?d.status.tone:'neutral')}><span className="text-[10px] opacity-80">App-Einstieg</span><p className="mt-1 font-medium">{current?d.status.label:'Datenstand abgleichen'}</p>{current&&d.finalModelSize!==null&&<p className="mt-1 text-[10px]">{d.appModelSize!==null?'Freigegebener Modellanteil':'Finale Modellgröße, keine Freigabe'} · {d.finalModelSize.toLocaleString('de-DE',{maximumFractionDigits:2})} %</p>}</div>
    <div className={'mt-2 rounded border px-2 py-2 '+tone(anti?.tone??'neutral')}><span className="text-[10px] opacity-80">Antizyklisch</span><p className="mt-1 font-medium">{anti?.label??'Einordnung offen'}</p>{anti&&<p className="mt-1 text-[10px]">RSI14 {anti.rsi.toLocaleString('de-DE',{maximumFractionDigits:2})} · {anti.areas??0} Bereich{anti.areas===1?'':'e'}: {anti.signalAreas?.length?anti.signalAreas.join(' + '):'keine weiteren Bereiche'}</p>}{current&&factorSequence&&<p className="mt-2 break-words rounded border border-cyan-800/70 bg-cyan-950/20 px-2 py-1 text-[10px] leading-relaxed text-cyan-100"><span className="font-medium">Antizyklische Verstärkung · </span>{factorSequence}</p>}</div>
    {current&&<section className="mt-3 rounded border border-slate-700 bg-slate-950/40 p-2"><p className="font-medium text-slate-200">Nächste Chartmarken {chart?.asOfDate??'· kein passender Stand'}</p>{chart?.status==='AVAILABLE'?<div className="mt-1 grid grid-cols-2 gap-2"><p className="text-[10px] text-emerald-200">Tiefere Referenz<br/><strong className="tabular-nums">{lower?lower.price.toLocaleString('de-DE',{maximumFractionDigits:2}):'—'}</strong>{lower&&<span className="block break-words text-slate-400">{lower.label}</span>}</p><p className="text-[10px] text-amber-200">Obere Referenz<br/><strong className="tabular-nums">{upper?upper.price.toLocaleString('de-DE',{maximumFractionDigits:2}):'—'}</strong>{upper&&<span className="block break-words text-slate-400">{upper.label}</span>}</p></div>:<p className="mt-1 text-[10px] text-slate-400">Keine passend datierte Chartreferenz verfügbar.</p>}<p className="mt-1 text-[9px] text-slate-500">Datiertes Kursniveau, kein bestätigter Boden oder Widerstand und kein Kursziel.</p></section>}
    <p className="mt-3 text-[10px] text-slate-400">KI · ungeprüfte Abwägung</p><p className="mt-1 text-[11px] text-sky-200">{card.modelContext}</p>
    {snippet&&<p className={'mt-1 line-clamp-2 text-[11px] leading-relaxed '+(card.factContradictions.length||card.statisticsWarnings.length?'text-amber-200':'text-slate-300')} title={raw}>{snippet}</p>}
    {!!card.factContradictions.length&&<details className="mt-2 text-[10px] text-amber-200"><summary className="cursor-pointer">Faktenwiderspruch · Begründung</summary>{card.factContradictions.map((f,i)=><div key={i} className="mt-2"><p>{f.explanation}</p><p className="mt-1 text-slate-400">Original: „{f.quote}“</p></div>)}</details>}
    {!!card.statisticsWarnings.length&&<details className="mt-2 text-[10px] text-amber-200"><summary className="cursor-pointer">Statistikdeutung · Prüfhinweis</summary>{card.statisticsWarnings.map((f,i)=><div key={i} className="mt-2"><p>{f.explanation}</p><p className="mt-1 text-slate-400">Original: „{f.quote}“</p></div>)}</details>}
    {concrete?.status==='CONTEXT_NOT_EXPLICIT'&&(!concrete.checks.signalOrAbsence||!concrete.checks.longerHorizon)&&<p className="mt-1 text-[10px] text-amber-200">Antizyklische Abwägung noch nicht ausdrücklich ausgewiesen.</p>}
   </article>;
  })}</div>
 </section>;
}
