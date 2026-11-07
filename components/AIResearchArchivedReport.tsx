import type {AIResearchReport} from '@/lib/aiResearch/aiResearchTypes';
import {AIResearchSourceReview} from './AIResearchSourceReview';
const date=(s?:string)=>s&&Number.isFinite(Date.parse(s))?new Date(s).toLocaleString('de-DE',{timeZone:'Europe/Berlin',dateStyle:'short',timeStyle:'short'}):'unbekannt';
/** Dated reading view, intentionally without app execution permissions or position sizes. */
export function AIResearchArchivedReport({report}:{report:AIResearchReport}){
 const s=report.aiSynthesis,r=s?.sourceReview;
 const names={NASDAQ_PUT:'Nasdaq Put',NASDAQ_CALL:'Nasdaq Call',RUSSELL_CALL:'Russell Call'};
 return <section aria-label="Letzter gespeicherter Researchbericht" className="rounded-xl border border-amber-800 bg-[#101820] p-4 text-xs text-slate-300 sm:p-5">
  <h3 className="text-lg font-semibold text-slate-100">Letzter gespeicherter KI-Bericht</h3>
  <p className="mt-2 text-amber-200">Marktstand {date(report.appFacts?.snapshotTimestamp)} · KI erstellt {date(s?.generatedAt)}. Früherer Stand, keine aktuelle Einstiegsaussage.</p>
  <p className="mt-2 text-slate-400">Der Bericht bleibt während des Wartens, bei einem fehlgeschlagenen Abruf und am Wochenende lesbar. Seine Daten wurden nicht mit dem heutigen Markt vermischt.</p>
  {r?.view&&<div className="mt-4 grid gap-3 xl:grid-cols-3">{r.view.map(row=><article key={row.instrument} className="rounded border border-slate-700 p-3">
   <h4 className="font-semibold text-slate-100">{names[row.instrument]}</h4>
   <p className="mt-2 whitespace-pre-wrap leading-relaxed">{row.interpretation.text}</p>
   <p className="mt-2 text-[10px] text-slate-500">Damals gespeicherte, inhaltlich ungeprüfte KI-Abwägung.</p>
  </article>)}</div>}
  {!r?.view&&<p className="mt-3 whitespace-pre-wrap">{s?.narrative?.text??report.summary}</p>}
  {r&&<details className="mt-4"><summary className="cursor-pointer text-sky-200">Datierte Fakten, Quellen und Prüfhinweise des gespeicherten Berichts</summary><AIResearchSourceReview review={r} archived /></details>}
 </section>;
}
