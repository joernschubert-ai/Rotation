const pct=(v:any)=>typeof v==='number'&&Number.isFinite(v)?`${v>0?'+':''}${v.toLocaleString('de-DE',{maximumFractionDigits:2})} %`:'unbekannt';
export function AIResearchEntryContext({fact,instrument}:{fact:any;instrument:string}){
 const c=fact?.values?.context;if(!c)return null;
 const put=instrument==='NASDAQ_PUT';
 return <section className="mt-3 rounded border border-sky-900 bg-sky-950/20 p-3 text-[11px]">
  <h5 className="font-semibold text-sky-200">Aktuelle Bewegung und neuer Einstieg · App-Fakten</h5>
  <p className="mt-1">Index {fact.asOf??'unbekannt'}: {pct(c.return1D)} · Futures seit 16-Uhr-NY-Referenz: <strong>{pct(c.futuresReferenceMovePct)}</strong></p>
  {c.recentDecline&&<p className="mt-1 text-slate-300">Größter Rückgang der letzten 10 Intervalle: {c.recentDecline.date} · {pct(c.recentDecline.returnPct)}. Seither {pct(c.recentDecline.recoverySinceDeclineClosePct)} relativ zu dessen Schluss; {c.recentDecline.observedIntervalsSince} beobachtete Intervalle.</p>}
  {c.futuresAvailabilityReason==='SCHEDULED_PAUSE'&&<p className="mt-1 text-slate-400">Futures-Handelspause: keine laufende Gegenbewegung bewertet.</p>}
  <p className="mt-1 text-amber-200">{put?((c.exceptionalDecline||c.recentExceptionalDecline)?'Nach außergewöhnlichem Abverkauf: neuen Puts nicht allein wegen roter Struktur nachlaufen. Einstieg separat prüfen.':'Bearische Struktur und Attraktivität neuer Puts getrennt prüfen.'):(c.futuresContext==='COUNTERMOVE_UP'?'Gegenbewegung nach oben: frühe antizyklische Call-Idee prüfen. Boden unbestätigt.':'Frühe Call-Idee separat bewerten; keine Erholung aus dem Abverkauf allein ableiten.')}</p>
  <details className="mt-2 text-slate-400"><summary className="cursor-pointer">Bezugszeit und Grenzen</summary><p>Futuresstand {c.futuresAsOf??'unbekannt'}. Anbieterbalken, kein offizielles Settlement; Kontraktwechsel ungeprüft. Größenrang {pct(c.priorAbsoluteMovesSmallerPct)} aus {c.comparisonCount??0} früheren Vergleichen, keine Ereigniswahrscheinlichkeit. App-Freigabe und Modellgröße bleiben unverändert. Produktvorteil nicht geprüft.</p></details>
 </section>;
}
