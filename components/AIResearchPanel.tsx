"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AIResearchReport, AIResearchResult } from "@/lib/aiResearch/aiResearchTypes";
import { SYNTHESIS_CONTRACT } from "@/lib/aiResearch/aiResearchSynthesisTypes";
import type { ResearchSynthesis } from "@/lib/aiResearch/aiResearchSynthesisTypes";

type ResponseData = AIResearchResult & { ok?: boolean; error?: string };
function date(value?: string | null): string {
  if (!value) return "unbekannt";
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? parsed.toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "short", timeStyle: "short" }) : "unbekannt";
}
function pct(value: number | null | undefined, points = false): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value > 0 ? "+" : ""}${value.toLocaleString("de-DE", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}${points ? " Pp." : "%"}` : "—";
}
function safeURL(value: string): string | undefined {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}
function List({ items, empty = "Noch keine Aussage verfügbar." }: { items: string[]; empty?: string }) {
  return items.length ? <ul className="space-y-2 pl-4 text-xs leading-relaxed text-[#aaa] list-disc">
    {items.map((item, index) => <li key={index}>{item}</li>)}
  </ul> : <p className="text-xs text-[#777]">{empty}</p>;
}
function Detail({ title, children }: { title: string; children: ReactNode }) {
  return <details className="border border-[#292929] bg-[#101010] p-4">
    <summary className="cursor-pointer text-xs font-semibold text-[#bbb]">{title}</summary>
    <div className="mt-4 space-y-4">{children}</div>
  </details>;
}
const labels: Record<string, string> = {
  BEARISH: "Defensiv", BULLISH: "Konstruktiv", MIXED: "Gemischt", NEUTRAL: "Neutral",
  NONE: "Keine", WEAK: "Schwach", PARTIAL: "Teilweise", STRONG: "Stark", VERY_STRONG: "Sehr stark",
  LOW: "Gering", MODERATE: "Mäßig", HIGH: "Hoch", VERY_HIGH: "Sehr hoch",
  BUILDING: "Im Aufbau", ESTABLISHED: "Etabliert", PERSISTENT: "Anhaltend", EXTREME: "Ausgeprägt",
  STRUCTURE: "App-Struktur", HISTORY: "Vergleichbare App-Historie", PRICE: "Kurse", ROTATION: "Rotation",
  LIQUIDITY: "Liquidität", POSITIONING: "COT-Positionierung", EXTERNAL: "Nachrichten",
  SUPPORTS: "Unterstützt die These", CONTRADICTS: "Widerspricht der These", UNRESOLVED: "Ungeklärt", NOT_AVAILABLE: "Nicht verfügbar",
  EARLY: "Früh", IMMATURE: "Noch unreif", DEVELOPING: "In Entwicklung", CONFIRMING: "In Bestätigung", MATURE: "Fortgeschritten", EXHAUSTED: "Weit gelaufen",
};
const label = (value?: string) => value ? labels[value] ?? value : "Unbekannt";

/** Reusable compact summary for later placement at the top of the main page. */
export function AIResearchDecisionSummary({ report, snapshotTimestamp, suspended = false }: {
  report: AIResearchReport; snapshotTimestamp?: string; suspended?: boolean;
}) {
  const support = report.decisionSupport;
  const assessment = report.evidenceAssessment;
  const timestamp = support?.snapshotTimestamp ?? snapshotTimestamp;
  const age = timestamp ? Date.now() - Date.parse(timestamp) : NaN;
  const stale = !Number.isFinite(age) || age < 0 || age > 86400000;
  const unavailable = suspended || stale;
  return <section className="border border-[#3a3a3a] bg-[#111] p-4 sm:p-5" aria-label="Research Entscheidungshilfe">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-[#888]">Research · Entscheidungshilfe</div>
        <h3 className="mt-2 text-lg font-bold text-white">{unavailable ? "Daten prüfen – keine aktuelle Einstiegsaussage" : support?.action ?? "Entscheidungshilfe noch nicht verfügbar"}</h3>
      </div>
      <div className="text-[10px] leading-relaxed text-[#888]">Snapshot {date(timestamp)}<br />Research {date(report.generatedAt)}</div>
    </div>
    <p className="mt-3 text-xs leading-relaxed text-[#bbb]">{support?.reason ?? report.thesis.statement}</p>
    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 text-xs">
      {[["Struktur", label(assessment?.structuralBias)], ["Bestätigung", label(assessment?.confirmation)],
        ["Gegenargumente", label(assessment?.contradiction)], ["Einstiegsreife", label(assessment?.entryMaturity)]].map(([key, value]) =>
        <div key={key} className="border-l border-[#444] pl-3"><span className="text-[#777]">{key}</span><div className="mt-1 font-semibold text-[#ddd]">{value}</div></div>)}
    </div>
    {support && <>
      <p className="mt-4 text-xs leading-relaxed text-amber-200/80">{support.asymmetry}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {support.flows.map(flow => <div key={flow.instrument} className="border border-[#292929] p-3 text-xs">
          <div className="font-semibold text-[#ccc]">{flow.instrument}</div>
          <div className={`mt-1 ${flow.eligible && !unavailable ? "text-amber-300" : "text-[#888]"}`}>
            {unavailable ? "Freigabe erneut prüfen" : flow.eligible ? "Im Snapshot freigegeben" : "Keine gemeinsame Freigabe"}
          </div>
          <div className="mt-1 text-[#999]">Modellanteil {flow.modelSize === null ? "—" : `${flow.modelSize}%`}</div>
        </div>)}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div><h4 className="mb-2 text-xs font-semibold text-[#ccc]">Bestätigung / Ausbau prüfen</h4><List items={support.confirmation} /></div>
        <div><h4 className="mb-2 text-xs font-semibold text-[#ccc]">These verwerfen / Risiko neu prüfen</h4><List items={support.invalidation.slice(0, 3)} /></div>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-[#888]">Modellanteile sind keine zusätzlichen Kaufaufträge und kein maximaler Depotverlust. Kein automatischer Handel.</p>
    </>}
  </section>;
}

export function AIResearchSynthesisSummary({ synthesis, snapshotTimestamp, suspended = false }: {
  synthesis?: ResearchSynthesis; snapshotTimestamp?: string; suspended?: boolean;
}) {
  const age = snapshotTimestamp ? Date.now() - Date.parse(snapshotTimestamp) : NaN;
  const current = !suspended && Number.isFinite(age) && age >= 0 && age <= 86400000 && synthesis?.snapshotTimestamp === snapshotTimestamp;
  const content = current && synthesis?.status === "SUCCESS" && synthesis.quality?.contractVersion === SYNTHESIS_CONTRACT ? synthesis.content : undefined;
  const conclusion = { WATCH_ONLY: "Vorerst beobachten", PREPARATION: "Einstiege vorbereiten", CANDIDATES: "Einstiegskandidaten getrennt prüfen", RISK_REVIEW: "Instrumentrisiken neu prüfen" };
  const instrumentNames = { NASDAQ_PUT: "Nasdaq Put", NASDAQ_CALL: "Nasdaq Call", RUSSELL_CALL: "Russell Call" };
  const assessments = { WATCH: "Beobachten", PREPARE: "Vorbereiten", STARTER_CANDIDATE: "Früher Einstiegskandidat", CONFIRM: "Bestätigung prüfen", REDUCE: "Risiko reduzieren prüfen" };
  return <section className="border border-[#344656] bg-[#10151a] p-4 sm:p-5" aria-label="Unabhängige KI-Einschätzung">
    <h3 className="text-sm font-semibold text-[#c4d8e8]">Unabhängige KI-Einschätzung</h3>
    {content ? <>
      <div className="mt-2 font-semibold text-white">{conclusion[content.conclusion]}</div>
      <p className="mt-3 text-xs leading-relaxed text-[#ddd]">{content.summary}</p>
      <p className="mt-3 text-xs leading-relaxed text-amber-200/80">{content.asymmetry}</p>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">{content.flows.map(flow => <div key={flow.instrument} className="border border-[#344656] p-3 text-xs leading-relaxed">
        <h4 className="font-semibold text-[#ddd]">{instrumentNames[flow.instrument]}</h4>
        <p className="mt-1 text-[#c4d8e8]">{assessments[flow.assessment]}</p>
        <p className="mt-3 text-[#bbb]">{flow.reasoning}</p>
        <p className="mt-2 text-[#aaa]"><strong className="text-[#ccc]">Warum jetzt?</strong> {flow.whyNow}</p>
        <p className="mt-2 text-[#aaa]"><strong className="text-[#ccc]">Gegenargument:</strong> {flow.counterargument}</p>
        <p className="mt-2 text-[#aaa]"><strong className="text-[#ccc]">Bestätigung:</strong> {flow.confirmation}</p>
        <p className="mt-2 text-[#aaa]"><strong className="text-[#ccc]">Verwerfen:</strong> {flow.invalidation}</p>
      </div>)}</div>
      <Detail title="Gemeinsame Gegenargumente und Grenzen"><List items={content.counterarguments} /><List items={content.limitations} /></Detail>
      <p className="mt-4 text-[10px] leading-relaxed text-[#888]">Cloudflare · Llama 3.3 70B · erstellt {date(synthesis?.generatedAt)}{synthesis?.cached ? " · gespeichert wiederverwendet" : ""}. KI-Kandidaten sind keine App-Freigaben. Die Modellanteile oben bleiben unverändert; wirtschaftliche Richtigkeit und Handelsvorteil sind nicht bewiesen.</p>
    </> : <p className="mt-3 text-xs text-[#999]">{!current ? "Aktuelle KI-Einschätzung ausgesetzt, bis Marktstand und Research abgeglichen sind." : synthesis?.status === "SUCCESS" ? "Die gespeicherte KI-Antwort verwendet noch die bisherige Prüfung. Research bitte aktualisieren." : synthesis?.message ?? "Noch keine KI-Einschätzung verfügbar. Angezeigt wird die regelbasierte App-Auswertung."}</p>}
  </section>;
}

export default function AIResearchPanel({ expectedSnapshotTimestamp, marketReady = true }: {
  expectedSnapshotTimestamp?: string;
  marketReady?: boolean;
} = {}) {
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    if (!marketReady) return;
    const id = ++requestId.current;
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/ai-research/dashboard?task=DAILY_MARKET_REVIEW", { method: "POST", cache: "no-store", credentials: "same-origin", signal: request.signal });
      const result: ResponseData = await response.json();
      if (!response.ok || result.status !== "SUCCESS" || !result.report) throw new Error(result.error ?? "Kein vollständiger Research-Bericht verfügbar.");
      if (id === requestId.current && !request.signal.aborted) setData(result);
    } catch (failure) {
      if (id === requestId.current && !request.signal.aborted) setError(failure instanceof Error ? failure.message : "Research konnte nicht geladen werden.");
    } finally {
      if (id === requestId.current && !request.signal.aborted) setLoading(false);
    }
  }, [marketReady, expectedSnapshotTimestamp]);
  useEffect(() => { if (marketReady) void load(); return () => { controller.current?.abort(); }; }, [load, marketReady]);
  const report = data?.report;
  const reportSnapshotTimestamp = report?.decisionSupport?.snapshotTimestamp ?? data?.diagnostics?.snapshotTimestamp;
  const snapshotMismatch = Boolean(report && expectedSnapshotTimestamp && reportSnapshotTimestamp !== expectedSnapshotTimestamp);
  const evidence = report?.evidenceAssessment?.evidence ?? [];
  const historical = report?.historicalEvidence;
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-xs font-semibold text-[#999]">AI RESEARCH</div>
      <button type="button" disabled={loading || !marketReady} onClick={() => void load()} className="border border-[#444] bg-[#181818] px-3 py-2 text-xs text-[#bbb] hover:bg-[#252525] disabled:opacity-50">
        {loading ? "Wird aktualisiert …" : "Research aktualisieren"}
      </button>
    </div>
    {error && <p role="alert" className="border border-red-900 p-3 text-xs text-red-300">{error}{report ? " Angezeigt wird der vorherige Bericht; seine Einstiegsaussage ist ausgesetzt." : ""}</p>}
    {!marketReady && <p className="border border-[#292929] p-3 text-xs text-[#999]">Research wartet auf den erfolgreich gespeicherten aktuellen Marktstand.</p>}
    {snapshotMismatch && <p role="status" className="border border-amber-900 p-3 text-xs text-amber-200">Research und Dashboard verwenden unterschiedliche Snapshots. Die Einstiegsaussage ist ausgesetzt. Bitte den Marktstand erneut aktualisieren.</p>}
    {!report && marketReady && <p className="border border-[#292929] p-4 text-xs text-[#999]">{loading ? "Research wird geladen …" : "Noch kein Research-Bericht verfügbar."}</p>}
    {report && <>
      <AIResearchDecisionSummary report={report} snapshotTimestamp={data?.diagnostics?.snapshotTimestamp} suspended={loading || Boolean(error) || !marketReady || snapshotMismatch} />
      <AIResearchSynthesisSummary synthesis={report.aiSynthesis} snapshotTimestamp={reportSnapshotTimestamp} suspended={loading || Boolean(error) || !marketReady || snapshotMismatch} />
      <Detail title="Begründung: App, Kurse, COT und Nachrichten">
        <p className="text-xs leading-relaxed text-[#bbb]">{report.thesis.statement}</p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{evidence.map(block => <div key={block.category} className="border border-[#292929] p-3">
          <div className="text-xs font-semibold text-[#ccc]">{label(block.category)} · {label(block.state)}</div>
          <p className="mt-2 text-xs leading-relaxed text-[#999]">{block.summary}</p>
          <details className="mt-3 text-xs text-[#888]"><summary className="cursor-pointer">Belege</summary><div className="mt-2"><List items={block.evidence} /></div></details>
        </div>)}</div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div><h4 className="mb-2 text-xs font-semibold text-[#ccc]">Für die These</h4><List items={report.thesis.supportingEvidence} /></div>
          <div><h4 className="mb-2 text-xs font-semibold text-[#ccc]">Gegen die These</h4><List items={report.thesis.counterEvidence} /></div>
        </div>
      </Detail>
      <Detail title={`Historische Vergleiche · Datenstand ${historical?.asOfDate ?? "unbekannt"}`}>
        {!historical ? <p className="text-xs text-[#888]">Keine historischen Vergleichsdaten verfügbar.</p> : <>
          <p className="text-xs leading-relaxed text-[#999]">Gruppenrendite und unbedingter Nasdaq-Vergleich sind beschreibende Durchschnittswerte. Die Differenz ist kein nachgewiesener Handelsvorteil. Überlappende Zeiträume sind keine unabhängigen Fälle.</p>
          {historical.currentStates.map((state, index) => {
            const observations = historical.observations.filter(item => item.family === state.family && item.market === state.market && item.state === state.state).sort((a, b) => a.horizonDays - b.horizonDays);
            return <div key={`${state.family}-${index}`} className="border border-[#292929] p-3">
              <div className="text-xs font-semibold text-[#ccc]">{state.family} · {state.state}</div>
              <p className="mt-1 text-[11px] text-[#888]">Zustand vom {state.asOfDate}: {state.comparable ? "Abgleich zum Snapshot-Markttag" : "Älterer Kontext, kein aktueller Zustandsabgleich"}</p>
              <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[550px] text-right text-xs text-[#aaa]">
                <thead><tr className="border-b border-[#444]"><th className="p-2 text-left">Horizont</th><th className="p-2">Gruppe</th><th className="p-2">Nasdaq-Vergleich</th><th className="p-2">Differenz</th><th className="p-2">Fälle Gruppe / Vergleich</th></tr></thead>
                <tbody>{observations.map(item => <tr key={item.horizonDays} className="border-b border-[#222]"><td className="p-2 text-left">{item.horizonDays} Handelstage</td><td className="p-2">{pct(item.averageForwardReturn)}</td><td className="p-2">{pct(item.baselineAverageReturn)}</td><td className="p-2">{pct(item.excessReturn, true)}</td><td className="p-2">{item.sampleSize} / {item.baselineSampleSize ?? "—"}</td></tr>)}</tbody>
              </table></div>
              {!observations.length && <p className="mt-2 text-xs text-[#888]">Keine Vergleichsgruppe vorhanden.</p>}
            </div>;
          })}
        </>}
      </Detail>
      <Detail title="Szenarien, Risiken und nächste Überprüfung">
        {report.forwardTestClaims.map((claim, index) => <div key={index} className="border border-[#292929] p-3 text-xs leading-relaxed text-[#aaa]">
          <p className="font-semibold text-[#ccc]">{claim.claim}</p><p className="mt-2">Überprüfung nach {claim.horizonDays ?? "—"} Handelstagen; das ist kein verpflichtendes Warten bis zum Einstieg.</p>
          <p className="mt-2">Bestätigung: {claim.confirmationCondition ?? "Nicht angegeben"}</p><p className="mt-2">Widerlegung: {claim.invalidationCondition ?? "Nicht angegeben"}</p>
        </div>)}
        <List items={report.risks.map(risk => `${risk.risk}: ${risk.explanation}`)} />
        <List items={report.decisionSupport?.limitations ?? []} />
      </Detail>
      <Detail title={`Nachrichtenquellen (${report.sources.length})`}>
        {report.sources.map((source, index) => <div key={index} className="border-b border-[#292929] pb-3 text-xs">
          {safeURL(source.url) ? <a href={safeURL(source.url)} target="_blank" rel="noopener noreferrer" className="text-[#ccc] underline hover:text-white">{source.title}</a> : <span className="text-[#ccc]">{source.title}</span>}
          <p className="mt-1 text-[#777]">{source.publisher ?? "Quelle unbekannt"} · {date(source.publishedAt)}</p>
        </div>)}
      </Detail>
    </>}
  </div>;
}
