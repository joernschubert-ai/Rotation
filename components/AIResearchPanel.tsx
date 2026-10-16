"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AIResearchReport, AIResearchResult } from "@/lib/aiResearch/aiResearchTypes";
import { SYNTHESIS_CONTRACT } from "@/lib/aiResearch/aiResearchSynthesisTypes";
import type { ResearchSynthesis } from "@/lib/aiResearch/aiResearchSynthesisTypes";

type ResponseData = AIResearchResult & { ok?: boolean; error?: string };
/** Export the exact response in component state; never fetch or regenerate. */
export function serializeDisplayedResearch(data: ResponseData, expectedSnapshotTimestamp?: string, suspended = false): string {
  return JSON.stringify({ ...data, display: { copiedAt: new Date().toISOString(),
    expectedSnapshotTimestamp: expectedSnapshotTimestamp ?? null,
    displayedSnapshotTimestamp: data.report?.decisionSupport?.snapshotTimestamp ?? data.diagnostics?.snapshotTimestamp ?? null,
    entryStatementsSuspended: suspended,
    source: "EXACT_DISPLAYED_RESPONSE" } }, null, 2);
}
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

/** Compact overview; app permissions and independent research remain distinct. */
export function AIResearchOverview({ report, snapshotTimestamp, suspended = false }: {
  report: AIResearchReport; snapshotTimestamp?: string; suspended?: boolean;
}) {
  const synthesis = report.aiSynthesis;
  const age = snapshotTimestamp ? Date.now() - Date.parse(snapshotTimestamp) : NaN;
  const current = !suspended && Number.isFinite(age) && age >= 0 && age <= 86400000;
  const content = current && synthesis && synthesis.snapshotTimestamp === snapshotTimestamp && synthesis.status === "SUCCESS" &&
    synthesis.quality?.contractVersion === SYNTHESIS_CONTRACT ? synthesis.content : undefined;
  const names = { NASDAQ_PUT: "Nasdaq Put", NASDAQ_CALL: "Nasdaq Call", RUSSELL_CALL: "Russell Call" };
  const states = { WATCH: "Beobachten", PREPARE: "Vorbereiten", STARTER_CANDIDATE: "Früher Kandidat", CONFIRM: "Bestätigung prüfen", REDUCE: "Risiko prüfen" };
  const titles = { WATCH_ONLY: "Vorerst beobachten", PREPARATION: "Einstiege vorbereiten", CANDIDATES: "Frühe Chancen getrennt prüfen", RISK_REVIEW: "Risiken neu bewerten" };
  const overviewTitle = !current ? "Aktuellen Marktstand abgleichen" : content ? titles[content.conclusion] : "KI-Einschätzung noch nicht verfügbar";
  return <section aria-label="Research Überblick" className="overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900 via-[#101820] to-[#101114]">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-700/60 p-4 sm:px-5">
      <div><div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Unabhängige KI · Überblick</div>
        <h3 className="mt-1 text-lg font-semibold text-slate-100">{overviewTitle}</h3>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">App: {current ? report.decisionSupport?.action ?? "Auswertung verfügbar" : "Einstiegsaussagen vorübergehend ausgesetzt"}</p>
      </div>
      <div className="text-[10px] leading-relaxed text-slate-400">Marktstand {date(snapshotTimestamp)}<br />KI {date(synthesis?.generatedAt)}</div>
    </div>
    {!content && current && <p role="status" className="border-b border-slate-700/60 px-4 py-3 text-xs leading-relaxed text-amber-200 sm:px-5">{synthesis?.status === "SUCCESS" ? "Die KI-Antwort gehört zu einer früheren Auswertung. Research bitte aktualisieren." : synthesis?.message ?? "Noch keine KI-Einschätzung verfügbar."}</p>}
    <div className="grid grid-cols-1 gap-px bg-slate-700/40 sm:grid-cols-3">
      {(["NASDAQ_PUT", "NASDAQ_CALL", "RUSSELL_CALL"] as const).map(instrument => {
        const app = report.decisionSupport?.flows.find(flow => flow.instrument === instrument || flow.instrument === names[instrument]);
        const ai = content?.flows.find(flow => flow.instrument === instrument);
        const brief = current ? synthesis?.quality?.instrumentBriefs?.find(item => item.instrument === instrument) : undefined;
        const rejected = synthesis?.status === "UNAVAILABLE" && Boolean(synthesis.quality?.issues.length);
        const candidate = ai && ["STARTER_CANDIDATE", "CONFIRM"].includes(ai.assessment);
        const color = candidate ? "text-amber-200" : ai?.assessment === "REDUCE" ? "text-rose-300" : ai?.assessment === "PREPARE" ? "text-sky-300" : "text-slate-300";
        return <div key={instrument} className="bg-[#111a23] p-4 sm:p-5">
          <div className="text-xs font-semibold text-slate-100">{names[instrument]}</div>
          <div className={`mt-2 text-base font-semibold ${color}`}>{ai ? states[ai.assessment] : rejected && current ? "Nicht übernommen" : "Auswertung ausstehend"}</div>
          <div className="mt-1 text-[10px] text-slate-500">Unabhängige KI-Einschätzung</div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">{ai?.whyNow ?? (!current ? "Nach dem Abgleich erneut prüfen." : rejected ? "Die KI-Antwort wurde abgelehnt; keine Instrumentbewertung übernommen." : "Begründung und Status stehen in den Details.")}</p>
          {brief && <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-slate-400">
            <p className="font-semibold text-slate-300">Vorhandene Datenbasis · Index</p>
            <p>Snapshot-Kurs {brief.price.current?.toLocaleString("de-DE", { maximumFractionDigits: 2 }) ?? "—"} · 5 Tage {pct(brief.price.momentum5D)} · 20 Tage {pct(brief.price.momentum20D)}</p>
            <p>{brief.histories.length} historische Vergleichsstudien · {brief.cot.length} COT-Gruppen</p>
          </div>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/60 pt-3 text-[11px]">
            <span className="text-slate-400">App: {!current ? "ausgesetzt" : app?.eligible ? "freigegeben" : "keine Freigabe"}</span>
            <span className="font-semibold text-slate-200">Modellanteil {current && typeof app?.modelSize === "number" && Number.isFinite(app.modelSize) ? `${app.modelSize}%` : "—"}</span>
          </div>
        </div>;
      })}
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 px-4 py-3 text-[10px] text-slate-400 sm:px-5">
      <span>Struktur: {label(report.evidenceAssessment?.structuralBias)}</span><span>Bestätigung: {label(report.evidenceAssessment?.confirmation)}</span>
      <span>Einstiegsreife der App: {label(report.evidenceAssessment?.entryMaturity)}</span>
      <span>KI-Kandidat und App-Freigabe werden getrennt beurteilt.</span>
    </div>
  </section>;
}

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
        {flow.grounding && <div className="mt-3 space-y-2 rounded border border-slate-700 bg-slate-900/60 p-3 text-[11px] text-slate-400">
          <div className="font-semibold text-slate-300">Zahlen aus der Datenbasis</div>
          <p>Eigene Kursrendite: 5 Tage {pct(flow.grounding.price.momentum5D)} · 20 Tage {pct(flow.grounding.price.momentum20D)}</p>
          {flow.grounding.history ? <>
            <p>Historie · {{ OWN_TREND: "Eigener Trend", ROTATION_20D: "Relative Stärke", OWN_PRICE_VIX_5D: "Kurs und VIX" }[flow.grounding.history.family] ?? flow.grounding.history.family} · {flow.grounding.history.horizonDays} Tage · {flow.grounding.history.sampleSize} Fälle</p>
            <p>Mittel {pct(flow.grounding.history.meanPct)} gegenüber {pct(flow.grounding.history.baselineMeanPct)} Vergleich · Median {pct(flow.grounding.history.medianPct)}</p>
            <p>10.–90. Perzentil: {pct(flow.grounding.history.p10Pct)} bis {pct(flow.grounding.history.p90Pct)} · Stand {flow.grounding.history.asOfDate}{flow.grounding.history.currentMatch ? " · Zustandsabgleich zum Snapshot-Markttag" : " · datierter Kontext"}</p>
          </> : <p>Keine geeignete eigene historische Vergleichsstudie vorhanden.</p>}
          {flow.grounding.cot.map(item => <p key={item.group}>{item.group === "ASSET_MANAGER" ? "Asset Manager" : "Leveraged Money"} ({item.reportDate}): netto {item.netPosition?.toLocaleString("de-DE") ?? "—"}, Änderung 1 Woche {item.weeklyChange?.toLocaleString("de-DE") ?? "—"}, 13 Wochen {item.change13W?.toLocaleString("de-DE") ?? "—"} Kontrakte.</p>)}
          {!flow.grounding.cot.length && <p>Keine hinreichend aktuellen eigenen COT-Gruppen verfügbar.</p>}
          <p className="text-slate-500">Deskriptive Indexrenditen und verzögerte Positionierung; kein berechneter Optionsvorteil. Das Perzentilband ist kein Prognoseintervall.</p>
        </div>}
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
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    if (!marketReady) return;
    const id = ++requestId.current;
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setLoading(true); setError(null); setCopyStatus(null);
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
  const suspended = loading || Boolean(error) || !marketReady || snapshotMismatch;
  async function copyDisplayedReport() {
    if (!data?.report || loading) return;
    const serialized = serializeDisplayedResearch(data, expectedSnapshotTimestamp, suspended);
    try { await navigator.clipboard.writeText(serialized); setCopyStatus("Angezeigter Bericht kopiert."); }
    catch { setCopyStatus("Kopieren nicht möglich. Bitte JSON herunterladen verwenden."); }
  }
  function downloadDisplayedReport() {
    if (!data?.report || loading) return;
    const blob = new Blob([serializeDisplayedResearch(data, expectedSnapshotTimestamp, suspended)], { type: "application/json" });
    const url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url; anchor.download = `research-${data.report.generatedAt.replace(/[^0-9TZ-]/g, "-")}.json`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-xs font-semibold text-[#999]">AI RESEARCH</div>
      <div className="flex flex-wrap gap-2">
      <button type="button" disabled={!report || loading} onClick={() => void copyDisplayedReport()} className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50">Angezeigten Bericht kopieren</button>
      <button type="button" disabled={!report || loading} onClick={downloadDisplayedReport} className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50">JSON herunterladen</button>
      <button type="button" disabled={loading || !marketReady} onClick={() => void load()} className="border border-[#444] bg-[#181818] px-3 py-2 text-xs text-[#bbb] hover:bg-[#252525] disabled:opacity-50">
        {loading ? "Wird aktualisiert …" : "Research aktualisieren"}
      </button>
      </div>
    </div>
    {copyStatus && <p role="status" className="text-xs text-slate-400">{copyStatus}</p>}
    {error && <p role="alert" className="border border-red-900 p-3 text-xs text-red-300">{error}{report ? " Angezeigt wird der vorherige Bericht; seine Einstiegsaussage ist ausgesetzt." : ""}</p>}
    {!marketReady && <p className="border border-[#292929] p-3 text-xs text-[#999]">Research wartet auf den erfolgreich gespeicherten aktuellen Marktstand.</p>}
    {snapshotMismatch && <p role="status" className="border border-amber-900 p-3 text-xs text-amber-200">Research und Dashboard verwenden unterschiedliche Snapshots. Die Einstiegsaussage ist ausgesetzt. Bitte den Marktstand erneut aktualisieren.</p>}
    {!report && marketReady && <p className="border border-[#292929] p-4 text-xs text-[#999]">{loading ? "Research wird geladen …" : "Noch kein Research-Bericht verfügbar."}</p>}
    {report && <>
      <AIResearchOverview report={report} snapshotTimestamp={reportSnapshotTimestamp} suspended={loading || Boolean(error) || !marketReady || snapshotMismatch} />
      <AIResearchSynthesisSummary synthesis={report.aiSynthesis} snapshotTimestamp={reportSnapshotTimestamp} suspended={loading || Boolean(error) || !marketReady || snapshotMismatch} />
      <Detail title="App · Freigaben, Modellanteile und Einstiegsbedingungen">
        <AIResearchDecisionSummary report={report} snapshotTimestamp={data?.diagnostics?.snapshotTimestamp} suspended={loading || Boolean(error) || !marketReady || snapshotMismatch} />
      </Detail>
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
          {(historical.marketStudies ?? []).map(study => <Detail key={`${study.market}-${study.family}`} title={`${study.market === "NASDAQ" ? "Nasdaq" : "Russell 2000"} · ${{ OWN_TREND: "Eigener Trend", ROTATION_20D: "Relative Stärke", OWN_PRICE_VIX_5D: "Kurs und VIX" }[study.family]}`}>
            <p className="text-xs text-slate-300">{study.state} · {study.asOfDate} · {study.currentMatch ? "Zustandsabgleich zum Snapshot-Markttag" : "Datierter Vergleichskontext"}</p>
            <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-right text-xs text-slate-400">
              <thead><tr className="border-b border-slate-700"><th className="p-2 text-left">Horizont / Fälle</th><th className="p-2">Mittel</th><th className="p-2">Median</th><th className="p-2">10.–90. Perzentil</th><th className="p-2">Vergleich</th><th className="p-2">Differenz</th></tr></thead>
              <tbody>{study.statistics.map(stats => <tr key={stats.horizonDays} className="border-b border-slate-800"><td className="p-2 text-left">{stats.horizonDays} Tage / {stats.sampleSize}</td><td className="p-2">{pct(stats.meanReturn)}</td><td className="p-2">{pct(stats.medianReturn)}</td><td className="p-2">{pct(stats.p10Return)} bis {pct(stats.p90Return)}</td><td className="p-2">{pct(stats.baselineMeanReturn)}</td><td className="p-2">{pct(stats.excessMeanReturn, true)}</td></tr>)}</tbody>
            </table></div>
            <p className="text-[11px] text-slate-500">Index-Folgerenditen, keine Optionsrenditen. Überlappende Zeiträume sind keine unabhängigen Fälle. Das Perzentilband ist kein Prognoseintervall.</p>
          </Detail>)}
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
