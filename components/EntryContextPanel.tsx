import {buildEntryContext} from '@/lib/market/entryContext';
const pct=(v:number|null)=>v===null?'unbekannt':`${v>0?'+':''}${v.toLocaleString('de-DE',{maximumFractionDigits:2})} %`;
export default function EntryContextPanel({snapshot}:{snapshot:any}){
 const c=buildEntryContext(snapshot);
 return <section className="mb-4 rounded-lg border border-sky-900 bg-[#101923] p-4 text-xs text-slate-300">
  <h3 className="font-semibold text-slate-100">Struktur und neuer Einstieg · getrennte Betrachtung</h3>
  <div className="mt-3 grid gap-3 lg:grid-cols-2">{c.markets.map(m=><article key={m.market} className="rounded border border-slate-700 p-3">
   <strong>{m.market==='NASDAQ'?'Nasdaq-100':'Russell 2000'}</strong>
   <p className="mt-2">Letzter Indexdatenpunkt: {pct(m.return1D)} · {m.cashDate??'Datum unbekannt'}</p>
   <p className="mt-1 text-sky-200">Futures seit Referenz 16:00 NY: {pct(m.futuresReferenceMovePct)}{m.futuresContext==='COUNTERMOVE_UP'?' · Gegenbewegung nach oben':m.futuresContext==='CONTINUATION_DOWN'?' · weitere Schwäche':''}</p>
   <p className="mt-2 text-amber-200">{m.exceptionalDecline?'Außergewöhnlicher Abverkauf: neuen Put-Einstieg auf Überdehnung und Gegenbewegung prüfen.':m.return1D!==null&&m.return1D<0?'Fallende Kurse bestätigen eine Richtung, nicht automatisch einen günstigen neuen Put-Einstieg.':'Einstiegsvorteil separat von der Struktur bewerten.'}</p>
   {m.futuresContext==='COUNTERMOVE_UP'&&<p className="mt-1 text-sky-200">Erholungsszenario zur Prüfung; kein bestätigter Boden und keine neue Call-Freigabe.</p>}
   <details className="mt-2 text-[10px] text-slate-400"><summary className="cursor-pointer">Zeitbezug und Grenzen</summary><p className="mt-2">Futuresstand: {m.futuresAsOf??'unbekannt'} · Referenztag {m.referenceDate??'unbekannt'}. Anbieterbalken desselben kontinuierlichen Feeds, kein offizielles Settlement; Kontraktwechsel ungeprüft.</p><p className="mt-1">Größenrang: {pct(m.priorAbsoluteMovesSmallerPct)} · {m.comparisonCount} frühere Vergleiche. {m.limits}</p></details>
  </article>)}</div>
  <p className="mt-3 text-[10px] text-slate-500">Bestehende App-Freigaben und Modellgrößen bleiben unverändert. Eine bearische Struktur ist keine Bewertung des Kaufpreises eines Puts. Neue Positionen und Verwaltung bestehender Positionen sind getrennte Aufgaben.</p>
 </section>;
}
