import type { AppFacts } from '@/lib/aiResearch/aiResearchAppFacts';
export function AIResearchAppFacts({facts}:{facts:AppFacts}){
  const domains=[...new Set(facts.facts.map(f=>f.domain))];
  return <section className="border-b border-slate-700 p-4 sm:px-5" aria-label="Verbindliche App-Fakten">
    <h3 className="text-base font-semibold text-slate-100">App-Fakten und Bedingungen</h3>
    <p className="mt-2 text-xs text-slate-400">Stand {facts.snapshotTimestamp}. Diese Ausgabe wird aus den gelieferten Daten berechnet, auch ohne KI. Berechnete Beziehungen, übernommener Kontext und Datenlücken sind getrennt. Keine Prognosegarantie.</p>
    <div className="mt-3 space-y-2">{domains.map(domain=><details key={domain} className="rounded border border-slate-700 p-3">
      <summary className="cursor-pointer text-sm text-slate-200">{domain}</summary>
      <ul className="mt-3 space-y-3">{facts.facts.filter(f=>f.domain===domain).map(f=><li key={f.id+f.market} className="text-xs leading-relaxed text-slate-300">
        <p className="font-semibold">{f.market} · {f.asOf??'Datum unbekannt'} · {f.status==='CALCULATED'?'Berechnete Beziehung':f.status==='SUPPLIED'?'Gelieferter Kontext':'Datenlücke'}</p><p>{f.text}</p>
        <details className="mt-1 text-slate-500"><summary>Beleg und Messwerte</summary><pre className="whitespace-pre-wrap break-words">{f.id+'\n'+JSON.stringify(f.values,null,2)}</pre></details>
      </li>)}</ul>
    </details>)}</div>
    <p className="mt-3 text-xs text-amber-200">Freie KI-Texte sind ungeprüfte Zusatzinterpretationen. Bei Widersprüchen gelten die datierten Fakten und App-Freigaben; ein fehlerhafter KI-Satz ändert sie nicht.</p>
  </section>;
}
