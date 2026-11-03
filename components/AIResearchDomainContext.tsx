import {historicalReading,groupReading} from '@/lib/aiResearch/aiResearchContextReadings';
import type {prepareReportDomainContext} from '@/lib/aiResearch/aiResearchReportDomainContext';
type Context=ReturnType<typeof prepareReportDomainContext>;
const n=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('de-DE',{maximumFractionDigits:4}):'unbekannt';
const groupName=(g:string)=>g==='LEVERAGED_MONEY'?'Leveraged Money':g==='ASSET_MANAGER'?'Asset Manager':g;
const words:Record<string,string>={NET_LONG:'netto long',NET_SHORT:'netto short',FLAT:'netto null',UNKNOWN:'unbekannt',UNCHANGED:'unverändert',SHORT_TO_LONG:'Wechsel von netto short zu netto long',LONG_TO_SHORT:'Wechsel von netto long zu netto short',SHORT_TO_FLAT:'Netto-Shortüberhang auf null',LONG_TO_FLAT:'Netto-Longüberhang auf null',FLAT_TO_LONG:'von netto null zu netto long',FLAT_TO_SHORT:'von netto null zu netto short',LONG_OVERHANG_LARGER:'Netto-Longüberhang größer',LONG_OVERHANG_SMALLER:'Netto-Longüberhang kleiner',SHORT_OVERHANG_LARGER:'Netto-Shortüberhang größer',SHORT_OVERHANG_SMALLER:'Netto-Shortüberhang kleiner',ALIGNED_TOWARD_LONG:'beide Änderungen Richtung Long',ALIGNED_TOWARD_SHORT:'beide Änderungen Richtung Short',OPPOSITE_SHIFTS:'entgegengesetzte Änderungsrichtungen',ZERO_CHANGE_PRESENT:'mindestens eine Nulländerung, keine Richtungsbestätigung',UNKNOWN_DATE_OR_GROUP:'wegen Datum oder fehlender Gruppe nicht vergleichbar'};
const word=(v:string)=>words[v]??v;
const quality:Record<string,string>={DUPLICATE_HORIZON:'Fenster mehrfach geliefert',INCONSISTENT_PREVIOUS:'Ausgangsnetto passt nicht zur Änderung',MISSING_CHANGE:'Nettoänderung fehlt',MISSING_NET:'Aktuelle Nettoposition fehlt'};
const excluded:Record<string,string>={MISSING:'Daten fehlen',UNKNOWN_DATE:'Beobachtungsdatum unbekannt',FUTURE_OBSERVATION:'Beobachtung liegt nach dem Berichtstand',NO_CURRENT_MATCH:'Kein passender Zustandsabgleich',NOT_INCLUDED:'Nicht als geeigneter Fachkontext verwendet'};
/** Rendering only: existing report facts and existing original interpretation, never an AI trigger. */
export function AIResearchDomainContext({context,current=false}:{context:Context;current?:boolean}){
 return <section className="border-b border-slate-700 p-4 text-xs leading-relaxed text-slate-300 sm:px-5" aria-label="COT und Historie aus dem Bericht">
  <h3 className="text-base font-semibold text-sky-200">COT und Historie · Fachkontext aus der App</h3>
  <p className="mt-2 text-slate-400">{context.message} {context.reportSnapshotTimestamp&&<>Berichtstand {context.reportSnapshotTimestamp}.</>} {!current&&'Gespeicherter Berichtstand; keine aktuelle Einstiegsbewertung.'}</p>
  {context.status==='AVAILABLE'&&<>
   <p className="mt-2 text-slate-400">Diese Befunde sind unabhängig von der KI-Quellenwahl vorhanden. Dieselben Nasdaq-Daten gelten als Kontext für Put und Call; sie sind keine unabhängigen Stimmen. COT liefert keine automatische Kursrichtung.</p>
   <div className="mt-4 grid gap-4 lg:grid-cols-2">{context.markets.map(m=><article key={m.market} className="rounded border border-slate-700 p-3">
    <h4 className="font-semibold text-slate-100">{m.market==='NASDAQ'?'Nasdaq-100':'Russell 2000'}</h4>
    {m.empty&&<p className="mt-2 text-amber-200">Kein geeigneter datierter COT-/Historienkontext verfügbar.</p>}
    {m.cot.map(c=><div key={c.id} className="mt-3 border-t border-slate-800 pt-3">
     <h5 className="font-semibold">{groupName(c.group)} · {word(c.netState)} · {n(c.net)} Kontrakte</h5><p className="text-slate-500">Beobachtung {c.asOf} · {c.id}</p>
     <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-[11px]"><thead><tr><th className="pr-3">Geliefertes Fenster</th><th className="pr-3">Ausgangsnetto</th><th className="pr-3">Nettoänderung</th><th>Bedeutung</th></tr></thead><tbody>{c.horizons.map((h,i)=><tr key={h.weeks+'-'+i}><td className="py-1 pr-3">{h.weeks} Woche(n)</td><td className="pr-3">{n(h.previous)}</td><td className="pr-3">{n(h.delta)}</td><td>{word(h.transition)}{h.quality!=='CALCULATED_FROM_SUPPLIED_VALUES'&&<span className="block text-amber-200">Datenhinweis: {quality[h.quality]??'Nicht eindeutig auswertbar'}</span>}</td></tr>)}</tbody></table></div>
     <p className="mt-2">1 Woche gegenüber {c.weekVsLong.map(w=>`${w.weeks} Wochen: ${word(w.relation)}`).join(' · ')}</p>
     <p className="mt-1 text-slate-500">Kalenderabdeckung nicht unabhängig verifiziert; Veröffentlichung {c.publicationTime===null?'unbekannt':String(c.publicationTime)}. Beobachtung und Veröffentlichung sind verschiedene Zeitpunkte.</p>
    </div>)}
    {m.missingGroups.length>0&&<p className="mt-2 text-amber-200">Nicht verfügbar: {m.missingGroups.map(groupName).join(', ')}. Keine Ersatzgruppe oder fremder Index verwendet.</p>}
    <p className="mt-3 text-slate-300">Gruppenänderungen: {groupReading(m.groupComparison)}</p>
    <details className="mt-3"><summary className="cursor-pointer font-semibold">Gruppenvergleich und COT-Einordnungsgrenzen</summary>
     <p className="mt-2">{m.groupComparison.sameObservationDate?'Gleiches Beobachtungsdatum.':'Kein vergleichbares gemeinsames Beobachtungsdatum.'} Unterschiedliche Nettozustände: {m.groupComparison.netStatesDiffer===null?'unbekannt':m.groupComparison.netStatesDiffer?'ja':'nein'}.</p>
     {m.groupComparison.shifts.map(h=><p key={h.weeks} className="mt-1">{h.weeks} Woche(n): {word(h.relation)}.</p>)}
     {m.boundaries.cot.map(c=><p key={c.sourceId} className="mt-2">{c.text}</p>)}<p className="mt-2 text-slate-400">{m.boundaries.groupLimit} {m.boundaries.wordingLimit}</p>
    </details>
    <div className="mt-4 border-t border-slate-800 pt-3"><h5 className="font-semibold">Historische Vergleiche · folgende 20 Sitzungsintervalle</h5>
     {!m.history.length&&<p className="mt-2 text-slate-400">Kein passender datierter historischer Vergleich verfügbar.</p>}
     {m.boundaries.history.map(h=>{const ownHistory=m.history.find(r=>r.id===h.sourceId);return <div key={h.sourceId} className="mt-3"><p className="font-semibold">{h.sourceId} · {String(m.history.find(r=>r.id===h.sourceId)?.family??'unbekannt')}</p>
      <p className="mt-1">Absolutes Mittel {n(h.meanPct)} % · Basis {n(h.baselineMeanPct)} % · Differenz {n(h.calculatedExcessPp)} Prozentpunkte.</p>
      {ownHistory&&<p className="mt-1 text-slate-300">Beschreibende Einordnung: {historicalReading(ownHistory)}</p>}
      <p className="mt-1">Historische p10/p90 {n(h.p10Pct)}/{n(h.p90Pct)} % · {n(h.sampleSize)} Fälle, {n(h.nonOverlappingCount)} nichtüberlappende Fälle.</p>
      {h.excessConsistent===false&&<p className="mt-1 text-amber-200">Gelieferter Mehrertrag {n(h.suppliedExcessPp)} Prozentpunkte weicht rechnerisch ab. Originalwert bleibt erhalten; mögliche Rundung oder Datenabweichung prüfen.</p>}
      <p className="mt-1 text-slate-400">{h.proofLimit} Nichtüberlappende Fälle sind nicht nachgewiesen unabhängig; p10/p90 ist kein Konfidenzintervall für die nächste Rendite.</p>
     </div>;})}
    </div>
    <details className="mt-3"><summary className="cursor-pointer">Originalbelege und ausgeklammerte Quellen</summary>{m.sources.map(s=><p key={s.id} className="mt-2">{s.id} · {s.asOf} · {s.text}</p>)}{m.excludedSources.map(s=><p key={s.id} className="mt-2 text-slate-500">Nicht verwendet: {s.id} · {s.asOf??'Datum unbekannt'} · {excluded[s.reason]??'Nicht geeignet'}</p>)}</details>
   </article>)}</div>
   <details className="mt-4"><summary className="cursor-pointer">Zusätzliche Prüfhinweise zur vorhandenen KI-Originalantwort · {context.interpretationNotes.length}</summary><p className="mt-2 text-slate-400">{context.notesScope} Fehlende Hinweise bestätigen keine Richtigkeit.</p>{context.interpretationNotes.map((note,i)=><p key={i} className="mt-2 text-amber-200">{note.instrument} · {note.code}: {note.message}<span className="block text-slate-400">Originalsatz: {note.quote}</span></p>)}</details>
  </>}
 </section>;
}
