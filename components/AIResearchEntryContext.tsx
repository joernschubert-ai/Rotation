/** Same instrument-specific colour projection for compact overview and full card. */
export function anticyclicalInstrumentReading(fact:any,instrument?:string){
 const a=fact?.values?.anticyclical;
 if(a?.version!=='ANTICYCLICAL_ENTRY_CONTEXT_V1'||a.status!=='AVAILABLE'||a.asOf!==fact?.asOf||!Number.isFinite(a.rsi14))return null;
 const d=a.asymmetricDecision?.version==='ASYMMETRIC_DECISION_V1'?a.asymmetricDecision:null,put=instrument==='NASDAQ_PUT';
 return {tone:put?(d?.tone==='good'?'bad':'neutral'):(d?.tone??'neutral'),label:put?(d?.tone==='good'?'Erholung · Gegenwind für neue Puts':'Put-Einstieg separat prüfen'):(d?.label??'Antizyklische Einordnung offen'),areas:d?.confluence?.areas??null,rsi:a.rsi14,asOf:a.asOf};
}
const pp=(v:any)=>typeof v==='number'&&Number.isFinite(v)?`${v>0?'+':''}${v.toLocaleString('de-DE',{maximumFractionDigits:2})} Prozentpunkte`:'unbekannt';
export function AIResearchAnticyclicalSummary({fact,instrument}:{fact:any;instrument?:string}){
 const anti=fact?.values?.anticyclical;
 if(anti?.version!=='ANTICYCLICAL_ENTRY_CONTEXT_V1'||anti.status!=='AVAILABLE'||anti.asOf!==fact?.asOf||!Number.isFinite(anti.rsi14))return null;
 const early=anti.earlyRecovery?.version==='EARLY_RECOVERY_SIGNALS_V1'&&anti.earlyRecovery.asOf===anti.asOf?anti.earlyRecovery:null;
 const rows=Array.isArray(early?.signals)?early.signals:[];
 const detected=rows.filter((s:any)=>s.status==='TODAY'||s.status==='RECENT');
 const decision=anti.asymmetricDecision?.version==='ASYMMETRIC_DECISION_V1'?anti.asymmetricDecision:null;
 const put=instrument==='NASDAQ_PUT';
 const reading=anticyclicalInstrumentReading(fact,instrument);
 const tone=reading?.tone??'neutral';
 const colors=tone==='good'?'border-emerald-600 bg-emerald-950/40 text-emerald-100':tone==='bad'?'border-rose-700 bg-rose-950/30 text-rose-100':tone==='watch'?'border-amber-700 bg-amber-950/30 text-amber-100':'border-slate-600 bg-slate-900/40 text-slate-200';
 const active=anti.rules?.find((r:any)=>r.id==='RSI_RECLAIM')?.current?.active===true;
 return <div className={'mt-3 rounded-lg border px-3 py-2 text-xs '+colors}>
  {decision&&<div className="mb-3 border-b border-current/20 pb-2"><p className="font-semibold">{put?(decision.tone==='good'?'Erholungschance · Gegenwind für neue Puts':'Antizyklischer Kontext · Put-Einstieg separat prüfen'):decision.label}</p><p className="mt-1 text-[11px]">{decision.confluence?.label}</p><p className="mt-1 text-[10px] opacity-80">Historischer Indexkontext · keine automatische Einstiegsfreigabe</p></div>}
  <p className="font-semibold">Antizyklisch: RSI14 {anti.rsi14.toLocaleString('de-DE',{maximumFractionDigits:2})}</p>
  <p className="mt-1">{active?'Rückkehr über 30 erkannt · frühes Erholungszeichen':'Keine neue Rückkehr über 30 erkannt'}</p>
  <p className="mt-1 text-[10px] text-slate-300">RSI misst Aufwärts- gegen Abwärtsmomentum. Zurück über 30: erstes Erholungszeichen nach Überverkauftheit.</p>
  {typeof early?.rsiChange==='number'&&<p className="mt-1 text-[11px]">RSI zur Vorperiode: {early.rsiChange>0?'+':''}{early.rsiChange.toLocaleString('de-DE',{maximumFractionDigits:2})} Punkte</p>}
  {detected.map((s:any)=><div key={s.id} className="mt-2 border-t border-sky-800 pt-2"><p className="font-medium text-sky-200">{s.title} · {s.status==='TODAY'?'neu erkannt':`${s.ageIntervals} Intervalle zuvor`}</p><p className="mt-1 text-[11px] text-slate-300">{s.explanation}</p></div>)}
  {decision&&<details className="mt-3 text-[11px]"><summary className="cursor-pointer font-medium">Gewichtung, Kombinationen und historische Balance</summary>
   <p className="mt-2">{decision.reason}</p><p className="mt-2 text-slate-300">0 = historisch ungünstig · 1 = Frühhinweis / uneinheitlich · 2 = konsistenter im Rückblick. Keine Prozentgewichte; pro Bereich höchstens die höchste Stufe, keine Addition.</p>
   {decision.families?.map((f:any)=><p key={f.name} className="mt-1">{f.name}: {f.signals.length?`${f.signals.length} Hinweis(e)`: 'kein frischer Hinweis'} · {f.weight===null?'historische Gewichtung offen':`Evidenzstufe ${f.weight}`}</p>)}
   <p className="mt-2 text-slate-300">Breite: {decision.breadthCoverage.ready}/{decision.breadthCoverage.total} Kennzahlen mit ausreichender Datenbasis. Mehr Bereiche = breiter abgestützt, keine bewiesene höhere Erfolgswahrscheinlichkeit.</p>
   <p className="mt-2 text-slate-400">Vergleich ab nächstem Schluss nach Signal. Verhältnis aus Medianrendite und Betrag des medianen weiteren Rückgangs beschreibt die Indexbalance; es ist kein begrenztes Verlustrisiko eines konkreten Kaufs.</p>
   {decision.examples?.map((s:any)=><div key={s.id} className="mt-3 border-t border-slate-700 pt-2"><strong>{s.title} · Stufe {s.weight}</strong><p className="mt-1">{s.weightReason}</p>{s.horizons.map((h:any)=><p key={h.intervals} className="mt-1">{h.intervals} Intervalle · n={h.n} · Median {pct(h.medianPct)} · weiterer Rückgang im Median {pct(h.medianFurtherLowPct)} · p10/p90 {pct(h.p10Pct)} / {pct(h.p90Pct)} · schlechtester weiterer Rückgang {pct(h.worstFurtherLowPct)} · Mehr-/Minderertrag zum Stressvergleich {pp(h.excessMeanPp)}</p>)}</div>)}
   <details className="mt-3"><summary className="cursor-pointer">Historische Kombinationen · kein Zusatzpunkt</summary><p className="mt-2 text-slate-400">RSI und Partnerzeichen innerhalb von 10 Beobachtungsintervallen. Andere Signalzeitpunkte als bei Einzelsignalen; keine kausal bewiesene Verbesserung.</p>{decision.combinations?.map((s:any)=><div key={s.id} className="mt-2"><strong>{s.title} · Stufe {s.weight}</strong><p>{s.weightReason}</p>{s.horizons.map((h:any)=><p key={h.intervals}>{h.intervals} Intervalle · n={h.n} · Median {pct(h.medianPct)} · weiterer Rückgang im Median {pct(h.medianFurtherLowPct)} · Mehr-/Minderertrag {pp(h.excessMeanPp)}</p>)}</div>)}</details>
   <p className="mt-3 text-slate-400">Retrospektive Prüfung seit 2012 in zwei Abschnitten: bis 2021 und ab 2022. Stufe 2 verlangt mindestens 10 Fälle insgesamt und 5 je Abschnitt, günstige Balance und positiven Vergleich in beiden Horizonten. Diese Prüfgrenzen sind vorläufig. Kein unberührter Zukunftstest, keine Optionsrendite. Breitenkombinationen sind mangels Langfristhistorie noch nicht kalibriert.</p>
  </details>}
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
