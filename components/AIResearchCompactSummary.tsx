import type {AIResearchReport} from '@/lib/aiResearch/aiResearchTypes';
import type {researchQuickView} from '@/lib/aiResearch/aiResearchQuickView';
import {anticyclicalInstrumentReading} from './AIResearchEntryContext';
const tone=(value:string)=>value==='good'?'border-emerald-700 bg-emerald-950/40 text-emerald-200':value==='bad'?'border-rose-700 bg-rose-950/40 text-rose-200':value==='watch'?'border-amber-700 bg-amber-950/30 text-amber-200':'border-slate-600 bg-slate-900/50 text-slate-300';
/** Read-only projection of existing approved app state and explicitly unverified model text. */
export function AIResearchCompactSummary({report,view}:{report:AIResearchReport;view:ReturnType<typeof researchQuickView>}){
 return <section aria-label="Research auf einen Blick" className="mt-4 rounded-xl border border-slate-600 bg-slate-950/30 p-3">
  <h4 className="font-semibold text-white">Research auf einen Blick</h4>
  <div className="mt-3 grid gap-3 sm:grid-cols-3">{view.cards.map(card=>{
   const d=card.dashboard,current=view.appFrameCurrent;
   const f=current?report.appFacts?.facts.find(f=>f.id===(card.instrument==='RUSSELL_CALL'?'R-F-ENTRY-TIMING':'N-F-ENTRY-TIMING')&&f.asOf===d.index.asOf):null;
   const anti=anticyclicalInstrumentReading(f,card.instrument);
   const chart=current?report.aiSynthesis?.priceReferences?.find(x=>x.instrument===card.instrument&&x.asOfDate===d.index.asOf):undefined;
   const lower=chart?.downLevels?.[0],upper=chart?.upLevels?.[0];
   const row=card.status==='AVAILABLE'?report.aiSynthesis?.sourceReview?.view?.find(r=>r.instrument===card.instrument):null;
   const review=card.status==='AVAILABLE'?report.aiSynthesis?.sourceReview?.entryTimingReview?.instruments.find(r=>r.instrument===card.instrument):null;
   const concrete=review?.concreteEntryUse;
   const raw=row?.interpretation.text??'',match=/Neueinstieg\s*:\s*([\s\S]*)/i.exec(raw);
   const snippet=(match?.[1]??raw).replace(/\[[NR]-ENTRY-[A-Z]+\]/g,'').replace(/\s+/g,' ').trim();
   return <article key={card.instrument} className="min-w-0 rounded-lg border border-slate-700 bg-[#121d2a] p-3">
    <h5 className="font-semibold text-white">{card.title}</h5>
    <div className={'mt-2 rounded border px-2 py-2 '+tone(current?d.status.tone:'neutral')}><span className="text-[10px] opacity-80">App-Einstieg</span><p className="mt-1 font-medium">{current?d.status.label:'Datenstand abgleichen'}</p>{current&&d.appModelSize!==null&&<p className="mt-1 text-[10px]">Modellanteil {d.appModelSize.toLocaleString('de-DE',{maximumFractionDigits:2})} %</p>}</div>
    <div className={'mt-2 rounded border px-2 py-2 '+tone(anti?.tone??'neutral')}><span className="text-[10px] opacity-80">Antizyklisch</span><p className="mt-1 font-medium">{anti?.label??'Einordnung offen'}</p>{anti&&<><p className="mt-1 text-[10px]">RSI14 {anti.rsi.toLocaleString('de-DE',{maximumFractionDigits:2})} · {anti.areas??0} Bereich{anti.areas===1?'':'e'}: {anti.signalAreas?.length?anti.signalAreas.join(' + '):'keine weiteren Bereiche'}</p><p className="mt-1 text-[9px] opacity-75">Ein fehlendes RSI-Signal löscht andere Bereiche nicht; Bereiche sind keine unabhängigen Stimmen.</p></>}</div>
    {current&&<section className="mt-3 rounded border border-slate-700 bg-slate-950/40 p-2"><p className="font-medium text-slate-200">Nächste Chartmarken {chart?.asOfDate??'· kein passender Stand'}</p>{chart?.status==='AVAILABLE'?<div className="mt-1 grid grid-cols-2 gap-2"><p className="text-[10px] text-emerald-200">Tiefere Referenz<br/><strong className="tabular-nums">{lower?lower.price.toLocaleString('de-DE',{maximumFractionDigits:2}):'—'}</strong>{lower&&<span className="block text-slate-400">{lower.label}</span>}</p><p className="text-[10px] text-amber-200">Obere Referenz<br/><strong className="tabular-nums">{upper?upper.price.toLocaleString('de-DE',{maximumFractionDigits:2}):'—'}</strong>{upper&&<span className="block text-slate-400">{upper.label}</span>}</p></div>:<p className="mt-1 text-[10px] text-slate-400">Keine passend datierte Chartreferenz verfügbar.</p>}<p className="mt-1 text-[9px] text-slate-500">Datiertes Kursniveau, kein bestätigter Boden/Widerstand und kein Kursziel.</p></section>}
    <p className="mt-3 text-[10px] text-slate-400">KI · ungeprüfte Abwägung</p><p className="mt-1 text-[11px] text-sky-200">{card.modelContext}</p>
    {snippet&&<p className={'mt-1 line-clamp-2 text-[11px] leading-relaxed '+(card.factContradictions.length||card.statisticsWarnings.length?'text-amber-200':'text-slate-300')} title={raw}>{snippet}</p>}
    {!!card.factContradictions.length&&<details className="mt-2 text-[10px] text-amber-200"><summary className="cursor-pointer">Faktenwiderspruch · Begründung</summary>{card.factContradictions.map((f,i)=><div key={i} className="mt-2"><p>{f.explanation}</p><p className="mt-1 text-slate-400">Original: „{f.quote}“</p></div>)}</details>}
    {!!card.statisticsWarnings.length&&<details className="mt-2 text-[10px] text-amber-200"><summary className="cursor-pointer">Statistikdeutung · Prüfhinweis</summary>{card.statisticsWarnings.map((f,i)=><div key={i} className="mt-2"><p>{f.explanation}</p><p className="mt-1 text-slate-400">Original: „{f.quote}“</p></div>)}</details>}
    {concrete?.status==='CONTEXT_NOT_EXPLICIT'&&(!concrete.checks.signalOrAbsence||!concrete.checks.longerHorizon)&&<p className="mt-1 text-[10px] text-amber-200">Antizyklische Abwägung noch nicht ausdrücklich ausgewiesen.</p>}
   </article>;
  })}</div>
 </section>;
}
