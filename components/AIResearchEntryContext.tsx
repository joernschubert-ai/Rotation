export function AIResearchAnticyclicalSummary({fact}:{fact:any}){
 const anti=fact?.values?.anticyclical;
 if(anti?.version!=='ANTICYCLICAL_ENTRY_CONTEXT_V1'||anti.status!=='AVAILABLE'||anti.asOf!==fact?.asOf||!Number.isFinite(anti.rsi14))return null;
 const early=anti.earlyRecovery?.version==='EARLY_RECOVERY_SIGNALS_V1'&&anti.earlyRecovery.asOf===anti.asOf?anti.earlyRecovery:null;
 const rows=Array.isArray(early?.signals)?early.signals:[];
 const detected=rows.filter((s:any)=>s.status==='TODAY'||s.status==='RECENT');
 const active=anti.rules?.find((r:any)=>r.id==='RSI_RECLAIM')?.current?.active===true;
 return <div className="mt-3 rounded-lg border border-sky-800 bg-sky-950/40 px-3 py-2 text-xs text-sky-100">
  <p className="font-semibold">Antizyklisch: RSI14 {anti.rsi14.toLocaleString('de-DE',{maximumFractionDigits:2})}</p>
  <p className="mt-1">{active?'Rückkehr über 30 erkannt · frühes Erholungszeichen':'Keine neue Rückkehr über 30 erkannt'}</p>
  <p className="mt-1 text-[10px] text-slate-300">RSI misst Aufwärts- gegen Abwärtsmomentum. Zurück über 30: erstes Erholungszeichen nach Überverkauftheit.</p>
  {typeof early?.rsiChange==='number'&&<p className="mt-1 text-[11px]">RSI zur Vorperiode: {early.rsiChange>0?'+':''}{early.rsiChange.toLocaleString('de-DE',{maximumFractionDigits:2})} Punkte</p>}
  {detected.map((s:any)=><div key={s.id} className="mt-2 border-t border-sky-800 pt-2"><p className="font-medium text-sky-200">{s.title} · {s.status==='TODAY'?'neu erkannt':`${s.ageIntervals} Intervalle zuvor`}</p><p className="mt-1 text-[11px] text-slate-300">{s.explanation}</p></div>)}
  {!!rows.length&&<details className="mt-2 text-[11px]"><summary className="cursor-pointer text-sky-200">Weitere Erholungszeichen · Bedeutung und Daten</summary>{rows.map((s:any)=><div key={s.id} className="mt-2"><p className="font-medium">{s.title}: {s.status==='UNAVAILABLE'?'Datenbasis reicht noch nicht':s.status==='TODAY'?'neu erkannt':s.status==='RECENT'?`${s.ageIntervals} Intervalle zuvor`:'kein neues Signal in den letzten 10 Intervallen'}</p><p className="mt-1 text-slate-300">{s.explanation}</p><p className="mt-1 text-slate-400">{s.detail}</p>{s.signalDate&&<p className="text-slate-400">Letzte Erkennung: {s.signalDate}</p>}</div>)}<p className="mt-2 text-slate-400">Preis-Muster und Breiten-Muster teilen jeweils ihre Datenbasis; keine unabhängigen Stimmen. Unzureichende Daten bedeuten nicht, dass es kein Signal gibt. Bisher keine validierten Trefferquoten dieser neuen Muster.</p></details>}
  <p className="mt-1 text-[10px] text-slate-400">Indexschluss {anti.asOf} · keine Bodenbestätigung</p>
 </div>;
}
const pct=(v:any)=>typeof v==='number'&&Number.isFinite(v)?`${v>0?'+':''}${v.toLocaleString('de-DE',{maximumFractionDigits:2})} %`:'unbekannt';
export function AIResearchEntryContext({fact,instrument}:{fact:any;instrument:string}){
 const c=fact?.values?.context;if(!c)return null;
 const put=instrument==='NASDAQ_PUT';
 const anti=fact?.values?.anticyclical,available=anti?.version==='ANTICYCLICAL_ENTRY_CONTEXT_V1'&&anti.status==='AVAILABLE'&&anti.asOf===fact.asOf;
 return <section className="mt-3 rounded border border-sky-900 bg-sky-950/20 p-3 text-[11px]">
  <h5 className="font-semibold text-sky-200">Aktuelle Bewegung und neuer Einstieg · App-Fakten</h5>
  <p className="mt-1">Index {fact.asOf??'unbekannt'}: {pct(c.return1D)} · Futures seit 16-Uhr-NY-Referenz: <strong>{pct(c.futuresReferenceMovePct)}</strong></p>
  {c.recentDecline&&<p className="mt-1 text-slate-300">Größter Rückgang der letzten 10 Intervalle: {c.recentDecline.date} · {pct(c.recentDecline.returnPct)}. Seither {pct(c.recentDecline.recoverySinceDeclineClosePct)} relativ zu dessen Schluss; {c.recentDecline.observedIntervalsSince} beobachtete Intervalle.</p>}
  {c.futuresAvailabilityReason==='SCHEDULED_PAUSE'&&<p className="mt-1 text-slate-400">Futures-Handelspause: keine laufende Gegenbewegung bewertet.</p>}
  <p className="mt-1 text-amber-200">{put?((c.exceptionalDecline||c.recentExceptionalDecline)?'Nach außergewöhnlichem Abverkauf: neuen Puts nicht allein wegen roter Struktur nachlaufen. Einstieg separat prüfen.':'Bearische Struktur und Attraktivität neuer Puts getrennt prüfen.'):(c.futuresContext==='COUNTERMOVE_UP'?'Gegenbewegung nach oben: frühe antizyklische Call-Idee prüfen. Boden unbestätigt.':'Frühe Call-Idee separat bewerten; keine Erholung aus dem Abverkauf allein ableiten.')}</p>
  {available&&<div className="mt-2 border-t border-sky-900 pt-2 text-slate-300">
   <details className="mt-2"><summary className="cursor-pointer text-sky-200">Längerer Horizont · historische60/80-Intervalle</summary>
    {anti.rules.map((r:any)=><div key={r.id} className="mt-2"><strong>{r.title}</strong>{r.horizons.map((h:any)=><p key={h.horizonIntervals}>{h.horizonIntervals} Intervalle · n={h.statistics.matureCases} · Median {pct(h.statistics.medianReturnPct)} · p10/p90 {pct(h.statistics.p10ReturnPct)} / {pct(h.statistics.p90ReturnPct)} · weiterer Rückgang im Median {pct(h.statistics.medianWorstFurtherCloseChangePct)} · Basismittel {pct(h.baseline.meanReturnPct)}.</p>)}</div>)}
    <a className="mt-2 block text-sky-200 underline" href="/api/ai-research/anticyclical" target="_blank" rel="noopener noreferrer">Vollständige historische Auswertung</a>
   </details></div>}
  <details className="mt-2 text-slate-400"><summary className="cursor-pointer">Bezugszeit und Grenzen</summary><p>Futuresstand {c.futuresAsOf??'unbekannt'}. Anbieterbalken, kein offizielles Settlement; Kontraktwechsel ungeprüft. Größenrang {pct(c.priorAbsoluteMovesSmallerPct)} aus {c.comparisonCount??0} früheren Vergleichen, keine Ereigniswahrscheinlichkeit. App-Freigabe und Modellgröße bleiben unverändert. Produktvorteil nicht geprüft.</p></details>
 </section>;
}
