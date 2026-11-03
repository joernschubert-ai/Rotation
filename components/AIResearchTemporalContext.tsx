import type {prepareReportTemporalContext} from '@/lib/aiResearch/aiResearchReportTemporalContext';
type Context=ReturnType<typeof prepareReportTemporalContext>;
const states:Record<string,string>={POSITIVE:'positiv',NEGATIVE:'negativ',ZERO:'null',MIXED:'gemischte Vorzeichen',INCOMPLETE:'unvollständig',NOT_COMPARABLE:'unterschiedliche Enddaten',UNKNOWN:'unbekannt'};
const issues:Record<string,string>={MISSING_SOURCE:'Quelle fehlt',DUPLICATE_SOURCE:'Quelle mehrfach vorhanden',WRONG_MARKET:'Fremder Index',OUTSIDE_OBSERVED_CONTEXT:'Nicht im passenden Quellenkontext',MISSING_DATA:'Daten fehlen',UNKNOWN_DATE:'Beobachtungsdatum unbekannt',FUTURE_DATA:'Spätere Beobachtung zurückgehalten',WEEK_NOT_AVAILABLE:'Kalenderwoche nicht verfügbar',INTERVAL_COUNT_MISMATCH:'Intervallzahl passt nicht',PERIOD_KIND_MISMATCH:'Zeitrahmenart passt nicht',BINDING_COUNT_MISMATCH:'Gebundene Intervallzahl passt nicht',PERIOD_BINDING_MISMATCH:'Periodenangaben widersprechen sich',UNKNOWN_PERIOD:'Zeitraum unbekannt',PERIOD_DATE_MISMATCH:'Periodendaten passen nicht',UNKNOWN_RETURN:'Rendite unbekannt'};
const percent=(n:number|null)=>typeof n==='number'&&Number.isFinite(n)?`${n>0?'+':''}${n.toLocaleString('de-DE',{maximumFractionDigits:4})} %`:'unbekannt';
/** Read-only report display. No effects, requests or interpretation of model prose. */
export function AIResearchTemporalContext({context,current=false}:{context:Context;current?:boolean}){
 const ownCurrent=current&&context.matchesDisplayedSnapshot&&!context.entryStatementsSuspended;
 return <section className="border-b border-slate-700 p-4 text-xs leading-relaxed text-slate-300 sm:px-5" aria-label="Zeitfenster aus dem Bericht">
  <h3 className="text-base font-semibold text-sky-200">Zeitfenster und gemeinsame Preisgrundlage · App-Kontext</h3>
  <p className="mt-2 text-slate-400">{context.message} {context.reportSnapshotTimestamp&&<>Berichtstand {context.reportSnapshotTimestamp}.</>} {!ownCurrent&&'Gespeicherter Berichtstand; keine aktuelle Einstiegsbewertung.'}</p>
  {context.status==='AVAILABLE'&&context.groups&&<>
   <p className="mt-2 text-slate-400">Vorzeichen gelieferter Rückblicke, keine neue Phase, Prognose oder berechnete KI-Gewichtung. Ein größerer Quellenumfang bedeutet keine stärkere unabhängige Bestätigung.</p>
   <div className="mt-4 grid gap-4 lg:grid-cols-2">{context.groups.markets.map(m=><article key={m.market} className="rounded border border-slate-700 p-3">
    <h4 className="font-semibold text-slate-100">{m.market==='NASDAQ'?'Nasdaq-100':'Russell 2000'}</h4>
    {m.cohorts.map(c=><div key={c.key} className="mt-3"><p className="font-semibold">{c.label}: {states[c.state]??'unbekannt'}</p><p>{c.sourceIds.map(id=>{const r=m.rolling.find(r=>r.sourceId===id)!;return `${r.observedIntervals} Intervall(e): ${percent(r.returnPct)}`;}).join(' · ')}</p><p className="text-slate-500">{c.commonEndDate?`Gemeinsames Enddatum ${c.commonEndDate}.`:'Kein vollständig vergleichbarer gemeinsamer Endstand.'}</p></div>)}
    {m.horizonDifferences.length>0&&<div className="mt-3 border-t border-slate-800 pt-2"><p className="font-semibold">Abweichende Rückblickvorzeichen</p>{m.horizonDifferences.map((d,i)=><p key={i} className="mt-1">{d.shorterSourceId} / {d.longerSourceId}: {d.meaning}</p>)}</div>}
    <details className="mt-3"><summary className="cursor-pointer font-semibold">Alle Perioden, Kalenderwoche und Entwicklung danach</summary>
     <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-[11px]"><thead><tr><th className="pr-3">Beobachtung</th><th className="pr-3">Rendite</th><th>Zeitraum</th></tr></thead><tbody>{[...m.rolling,m.calendarWeek,m.afterCompletedWeek].map(r=><tr key={r.sourceId}><td className="py-1 pr-3">{r.kind==='ROLLING'?`${r.observedIntervals} Sitzungsintervalle`:r.kind==='CALENDAR_WEEK'?'Abgeschlossene Kalenderwoche':'Nach abgeschlossener Woche'}<span className="block text-slate-500">{r.sourceId}</span></td><td className="pr-3">{percent(r.returnPct)}</td><td>{r.fromDate??'?'} bis {r.toDate??'?'}{r.baselineDate&&<span className="block">Basisdatum {r.baselineDate}</span>}{r.issue&&<span className="block text-amber-200">{issues[r.issue]??'Datenhinweis prüfen'}</span>}</td></tr>)}</tbody></table></div>
     <p className="mt-2 text-slate-400">Kalenderwochen und rollierende fünf Intervalle sind verschiedene Zeiträume. Die Bewegung danach wird separat ausgewiesen.</p>
     {[...m.rolling,m.calendarWeek,m.afterCompletedWeek].filter(r=>r.suppliedText).map(r=><p key={r.sourceId} className="mt-2 text-slate-500">{r.sourceId} · {r.asOf??'Datum unbekannt'} · {r.suppliedText}</p>)}
    </details>
    <details className="mt-3"><summary className="cursor-pointer">Zusammengehörige Preisbefunde · keine Stimmenzählung</summary>{m.priceEvidenceFamilies.map(f=><p key={f.family} className="mt-2">{f.family==='OBSERVED_RETURNS'?'Beobachtete Renditen':f.family==='MA_RELATIONS'?'MA-Relationen':'P&F-Zustände'}: {f.sourceIds.join(', ')||'keine passende Quelle'}</p>)}</details>
    <p className="mt-3 text-slate-400">{m.sharedBasis}</p>
   </article>)}</div>
   <p className="mt-3 text-slate-500">{context.groups.limits}</p>
  </>}
 </section>;
}
