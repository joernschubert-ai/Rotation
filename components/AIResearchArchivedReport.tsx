import type {AIResearchReport} from '@/lib/aiResearch/aiResearchTypes';
import {AIResearchSourceReview} from './AIResearchSourceReview';
const date=(s?:string)=>s&&Number.isFinite(Date.parse(s))?new Date(s).toLocaleString('de-DE',{timeZone:'Europe/Berlin',dateStyle:'short',timeStyle:'short'}):'unbekannt';
/** Dated reading view, intentionally without app execution permissions or position sizes. */
export function AIResearchArchivedReport({report}:{report:AIResearchReport}){
 const s=report.aiSynthesis,r=s?.sourceReview;
 const ownDates=['N-F-CLOSE','R-F-CLOSE'].map(id=>report.appFacts?.facts?.find(f=>f.id===id)?.asOf).filter((d):d is string=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d));
 const dataDate=[...new Set(ownDates)].map(d=>new Date(d+'T12:00:00Z').toLocaleDateString('de-DE',{timeZone:'Europe/Berlin'})).join(' / ')||date(report.appFacts?.snapshotTimestamp);
 const names={NASDAQ_PUT:'Nasdaq Put',NASDAQ_CALL:'Nasdaq Call',RUSSELL_CALL:'Russell Call'};
 return <section aria-label="Letzter gespeicherter Researchbericht" className="rounded-xl border border-amber-800 bg-[#101820] p-4 text-xs text-slate-300 sm:p-5">
  <h3 className="text-lg font-semibold text-slate-100">KI-Bericht</h3>
  <p className="mt-2 text-slate-400">Keine aktuellen Daten. Verwendeter Datenstand: {dataDate}.</p>
  {r?.view&&<div className="mt-4 grid gap-3 xl:grid-cols-3">{r.view.map(row=><article key={row.instrument} className="rounded border border-slate-700 p-3">
   <h4 className="font-semibold text-slate-100">{names[row.instrument]}</h4>
   <p className="mt-2 whitespace-pre-wrap leading-relaxed">{row.interpretation.text}</p>
  </article>)}</div>}
  {!r?.view&&<p className="mt-3 whitespace-pre-wrap">{s?.narrative?.text??report.summary}</p>}
  {r&&<details className="mt-4"><summary className="cursor-pointer text-sky-200">Datierte Fakten, Quellen und Prüfhinweise des gespeicherten Berichts</summary><AIResearchSourceReview review={r} archived /></details>}
 </section>;
}
