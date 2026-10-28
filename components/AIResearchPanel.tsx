"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AIResearchSourceReview } from "./AIResearchSourceReview";
import { AIResearchAppFacts } from "./AIResearchAppFacts";
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

/** Also corrects descriptions in cached reports without a new model call. */
export function appPermissionSummary(support: AIResearchReport["decisionSupport"]): string {
  if (!support) return "App-Auswertung noch nicht verfügbar";
  const approved = support.flows.filter(flow => flow.eligible === true && typeof flow.modelSize === "number" && Number.isFinite(flow.modelSize) && flow.modelSize > 0 && flow.modelSize <= 100);
  if (approved.length) return approved.map(flow => flow.instrument + ": Modellfreigabe " + flow.modelSize + "%").join(" · ");
  return support.action || "Beobachten – kein freigegebener Einstieg";
}

/** Compact overview; app permissions and independent research remain distinct. */
export function AIResearchOverview({ report, snapshotTimestamp, suspended = false }: {
  report: AIResearchReport; snapshotTimestamp?: string; suspended?: boolean;
}) {
  const synthesis = report.aiSynthesis;
  const age = snapshotTimestamp ? Date.now() - Date.parse(snapshotTimestamp) : NaN;
  const current = !suspended && Number.isFinite(age) && age >= 0 && age <= 86400000;
  const content = current && synthesis && synthesis.snapshotTimestamp === snapshotTimestamp && synthesis.status === "SUCCESS" &&
    synthesis.quality?.contractVersion === SYNTHESIS_CONTRACT ? synthesis.content : undefined;
  const narrative=current&&synthesis?.status==='SUCCESS'&&synthesis.snapshotTimestamp===snapshotTimestamp&&synthesis.quality?.contractVersion===SYNTHESIS_CONTRACT?synthesis.narrative:undefined;
  const sourceReview=current&&synthesis&&synthesis.snapshotTimestamp===snapshotTimestamp&&synthesis.quality?.contractVersion===SYNTHESIS_CONTRACT?synthesis.sourceReview:undefined;
  const names = { NASDAQ_PUT: "Nasdaq Put", NASDAQ_CALL: "Nasdaq Call", RUSSELL_CALL: "Russell Call" };
  const states = { WATCH: "Beobachten", PREPARE: "Vorbereiten", STARTER_CANDIDATE: "Früher Kandidat", CONFIRM: "Bestätigung prüfen", REDUCE: "Risiko prüfen" };
  const titles = { WATCH_ONLY: "Vorerst beobachten", PREPARATION: "Einstiege vorbereiten", CANDIDATES: "Frühe Chancen getrennt prüfen", RISK_REVIEW: "Risiken neu bewerten" };
  const reviews=current&&synthesis?.snapshotTimestamp===snapshotTimestamp&&synthesis?.quality?.contractVersion===SYNTHESIS_CONTRACT?synthesis?.instrumentReviews??[]:[];
  const partial=Boolean(content&&reviews.some(r=>r.status!=="CHECKED"));
  const hasCaveats=Boolean(content?.flows.some(flow=>flow.interpretationNotes?.length));
  const overviewTitle = sourceReview ? "App-Befunde und getrennte KI-Abwägung" : narrative ? "App-Fakten und ungeprüfte KI-Interpretation" : !current ? "Aktuellen Marktstand abgleichen" : partial ? "KI-Auswertung teilweise zurückgehalten" : content ? titles[content.conclusion]+(hasCaveats?" · mit Vorbehalt":"") : reviews.length ? "KI-Antwort zur Prüfung zurückgehalten" : "KI-Einschätzung noch nicht verfügbar";
  return <section aria-label="Research Überblick" className="overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900 via-[#101820] to-[#101114]">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-700/60 p-4 sm:px-5">
      <div><div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Unabhängige KI · Überblick</div>
        <h3 className="mt-1 text-lg font-semibold text-slate-100">{overviewTitle}</h3>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">App: {current ? appPermissionSummary(report.decisionSupport) : "Einstiegsaussagen vorübergehend ausgesetzt"}</p>
      </div>
      <div className="text-[10px] leading-relaxed text-slate-400">Marktstand {date(snapshotTimestamp)}<br />KI {date(synthesis?.generatedAt)}</div>
    </div>
    {current&&synthesis?.cotDataQuality&&<p role="status" className={`border-b border-slate-700/60 px-4 py-2 text-xs sm:px-5 ${synthesis.cotDataQuality.fallbackUsed||synthesis.cotDataQuality.status==='UNAVAILABLE'?'text-amber-200':'text-slate-400'}`}>COT: {synthesis.cotDataQuality.message} Beobachtungsdatum: {synthesis.cotDataQuality.observationDate??'nicht verfügbar'}. {synthesis.cotDataQuality.lastSuccessfulFetchAt&&<>Letzter erfolgreicher Abruf: {date(synthesis.cotDataQuality.lastSuccessfulFetchAt)}.</>} Das Beobachtungsdatum ist kein bestätigter Veröffentlichungstermin.</p>}
    {!content && !narrative && !sourceReview && current && <p role="status" className="border-b border-slate-700/60 px-4 py-3 text-xs leading-relaxed text-amber-200 sm:px-5">{synthesis?.status === "SUCCESS" ? "Die KI-Antwort gehört zu einer früheren Auswertung. Research bitte aktualisieren." : synthesis?.message ?? "Noch keine KI-Einschätzung verfügbar."}</p>}
    {current&&synthesis&&synthesis.snapshotTimestamp===snapshotTimestamp&&<ResearchFactOverview synthesis={synthesis} />}
    {current&&synthesis&&synthesis.snapshotTimestamp===snapshotTimestamp&&synthesis.domainConcepts&&<ResearchDomainConcepts concepts={synthesis.domainConcepts} />}
    {current&&synthesis?.domainConcepts?.interpretationFrame&&<ResearchInterpretationFrame frame={synthesis.domainConcepts.interpretationFrame} />}
    {report.appFacts&&<AIResearchAppFacts facts={report.appFacts} />}
    {sourceReview&&<AIResearchSourceReview review={sourceReview} />}
    {narrative&&<ResearchNarrativeText narrative={narrative} />}
    <div className="grid grid-cols-1 gap-px bg-slate-700/40 sm:grid-cols-3">
      {(["NASDAQ_PUT", "NASDAQ_CALL", "RUSSELL_CALL"] as const).map(instrument => {
        const app = report.decisionSupport?.flows.find(flow => flow.instrument === instrument || flow.instrument === names[instrument]);
        const ai = content?.flows.find(flow => flow.instrument === instrument);
        const sourceChoice=sourceReview?.view?.find(row=>row.instrument===instrument);
        const brief = current ? synthesis?.quality?.instrumentBriefs?.find(item => item.instrument === instrument) : undefined;
        const review=reviews.find(item=>item.instrument===instrument);
        const rejected = review?review.status!=="CHECKED":synthesis?.status === "UNAVAILABLE" && Boolean(synthesis.quality?.issues.length);
        const candidate = ai && ["STARTER_CANDIDATE", "CONFIRM"].includes(ai.assessment);
        const color = candidate ? "text-amber-200" : ai?.assessment === "REDUCE" ? "text-rose-300" : ai?.assessment === "PREPARE" ? "text-sky-300" : "text-slate-300";
        return <div key={instrument} className="bg-[#111a23] p-4 sm:p-5">
          <div className="text-xs font-semibold text-slate-100">{names[instrument]}</div>
          <div className={`mt-2 text-base font-semibold ${color}`}>{ai ? states[ai.assessment] : sourceChoice ? "Quellenwahl verfügbar" : narrative ? "Einordnung im KI-Text" : rejected && current ? "Nicht übernommen" : "Auswertung ausstehend"}</div>
          <div className="mt-1 text-[10px] text-slate-500">Unabhängige KI-Einschätzung</div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">{ai?.whyNow ?? (sourceChoice ? "Belegte Zustandsangaben und gewählte Quellen stehen oben. Die freie KI-Abwägung ist getrennt und ungeprüft; keine neue Einstiegserlaubnis." : narrative ? "Die unabhängige Interpretation steht oben im vollständigen KI-Text. Kein automatisch abgeleitetes Instrumenturteil." : !current ? "Nach dem Abgleich erneut prüfen." : rejected ? "Diese Instrumentaussage ist nicht übernommen. Originaltext und Prüfhinweise stehen unten offen zur Einsicht." : "Begründung und Status stehen in den Details.")}</p>
          {ai?.assessmentExplanation&&<p className="mt-2 text-xs text-slate-400">{ai.assessmentExplanation}</p>}
          {Boolean(ai?.interpretationNotes?.length)&&<div className="mt-2 text-xs text-amber-200"><p className="font-semibold">Einordnung mit Vorbehalt</p>{ai?.interpretationNotes?.slice(0,2).map(note=><p key={note} className="mt-1">{note}</p>)}</div>}
          <ResearchPriceReferenceCard references={current?synthesis?.priceReferences?.find(r=>r.instrument===instrument):undefined}/>
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
        <h3 className="mt-2 text-lg font-bold text-white">{unavailable ? "Daten prüfen – keine aktuelle Einstiegsaussage" : appPermissionSummary(support)}</h3>
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
  const narrative=current&&synthesis?.status==='SUCCESS'&&synthesis.quality?.contractVersion===SYNTHESIS_CONTRACT?synthesis.narrative:undefined;
  if(narrative||(current&&synthesis?.sourceReview&&synthesis.quality?.contractVersion===SYNTHESIS_CONTRACT))return null; // Already visible, expanded, in the overview above.
  const conclusion = { WATCH_ONLY: "Vorerst beobachten", PREPARATION: "Einstiege vorbereiten", CANDIDATES: "Einstiegskandidaten getrennt prüfen", RISK_REVIEW: "Instrumentrisiken neu prüfen" };
  const instrumentNames = { NASDAQ_PUT: "Nasdaq Put", NASDAQ_CALL: "Nasdaq Call", RUSSELL_CALL: "Russell Call" };
  const assessments = { WATCH: "Beobachten", PREPARE: "Vorbereiten", STARTER_CANDIDATE: "Früher Einstiegskandidat", CONFIRM: "Bestätigung prüfen", REDUCE: "Risikogedanken prüfen" };
  return <section className="border border-[#344656] bg-[#10151a] p-4 sm:p-5" aria-label="Unabhängige KI-Einschätzung">
    <h3 className="text-sm font-semibold text-[#c4d8e8]">Unabhängige KI-Einschätzung</h3>
    {content ? <>
      <div className="mt-2 font-semibold text-white">{conclusion[content.conclusion]}</div>
      <p className="mt-3 text-xs leading-relaxed text-[#ddd]">{content.summary}</p>
      {synthesis?.instrumentReviews?.some(r=>r.status!=="CHECKED") && <p className="mt-2 text-xs text-amber-200">Die Zusammenfassung enthält nur die nicht zurückgehaltenen Instrumente. Weitere Modelltexte stehen unten deutlich als nicht übernommen.</p>}
      <p className="mt-3 text-xs leading-relaxed text-amber-200/80">{content.asymmetry}</p>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">{content.flows.map(flow => <div key={flow.instrument} className="border border-[#344656] p-3 text-xs leading-relaxed">
        <h4 className="font-semibold text-[#ddd]">{instrumentNames[flow.instrument]}</h4>
        <p className="mt-1 text-[#c4d8e8]">{assessments[flow.assessment]}</p>{flow.assessmentExplanation&&<p className="mt-2 text-slate-400">{flow.assessmentExplanation}</p>}{flow.assessment==="REDUCE"&&<p className="mt-2 text-slate-400">Bedingte Risikoprüfung, kein Verkaufsauftrag. Eine bestehende Nutzerposition wird nicht vorausgesetzt.</p>}
        <p className="mt-3 text-[#bbb]">{flow.reasoning}</p>
        {flow.cotInterpretations && <div className="mt-3 space-y-2 text-[#aaa]">
          {Object.entries(flow.cotInterpretations).map(([group, interpretation]) => <p key={group}><strong>{group === "ASSET_MANAGER" ? "Asset Manager" : "Leveraged Money"}:</strong> {interpretation}</p>)}
        </div>}
        {flow.grounding && <div className="mt-3 space-y-2 rounded border border-slate-700 bg-slate-900/60 p-3 text-[11px] text-slate-400">
          <div className="font-semibold text-slate-300">Zahlen aus der Datenbasis</div>
          <p>Eigene Kursrendite: 5 Tage {pct(flow.grounding.price.momentum5D)} · 20 Tage {pct(flow.grounding.price.momentum20D)}</p>
          {flow.grounding.history ? <>
            <p>Historie · {{ OWN_TREND: "Eigener Trend", ROTATION_20D: "Relative Stärke", OWN_PRICE_VIX_5D: "Kurs und VIX" }[flow.grounding.history.family] ?? flow.grounding.history.family} · {flow.grounding.history.horizonDays} Tage · {flow.grounding.history.sampleSize} Fälle</p>
            <p>Mittel {pct(flow.grounding.history.meanPct)} gegenüber {pct(flow.grounding.history.baselineMeanPct)} Vergleich · Median {pct(flow.grounding.history.medianPct)}</p>
            {flow.grounding.history.comparisonFact && <p className="text-slate-300">{flow.grounding.history.comparisonFact}</p>}
            <p>10.–90. Perzentil: {pct(flow.grounding.history.p10Pct)} bis {pct(flow.grounding.history.p90Pct)} · Stand {flow.grounding.history.asOfDate}{flow.grounding.history.currentMatch ? " · Zustandsabgleich zum Snapshot-Markttag" : " · datierter Kontext"}</p>
          </> : <p>Keine geeignete eigene historische Vergleichsstudie vorhanden.</p>}
          {flow.grounding.cot.map(item => <p key={item.group}>{item.group === "ASSET_MANAGER" ? "Asset Manager" : "Leveraged Money"} ({item.reportDate}): netto {item.netPosition?.toLocaleString("de-DE") ?? "—"}, Änderung 1 Woche {item.weeklyChange?.toLocaleString("de-DE") ?? "—"}, 13 Wochen {item.change13W?.toLocaleString("de-DE") ?? "—"} Kontrakte.</p>)}
          {flow.grounding.cot.map(item => item.weeklyFact || item.change13WFact ? <div key={`${item.group}-facts`}>
            <p className="text-slate-300">{item.group === "ASSET_MANAGER" ? "Asset Manager" : "Leveraged Money"}: 1 Woche · {item.weeklyFact ?? "nicht bestimmbar"}</p>
            <p>13 Wochen · {item.change13WFact ?? "nicht bestimmbar"}</p>
          </div> : null)}
          {!flow.grounding.cot.length && <p>Keine hinreichend aktuellen eigenen COT-Gruppen verfügbar.</p>}
          <p className="text-slate-500">Deskriptive Indexrenditen und verzögerte Netto-Positionierung; kein berechneter Optionsvorteil. Netto-Veränderungen beweisen keine einzelnen Brutto-Long-/Short-Transaktionen. Das Perzentilband ist kein Prognoseintervall.</p>
        </div>}
        {Boolean(flow.interpretationNotes?.length)&&<div className="mt-2 border-l-2 border-amber-700 pl-3 text-xs text-amber-200"><strong>Einordnung mit Vorbehalt</strong>{flow.interpretationNotes?.map(note=><p key={note}>{note}</p>)}</div>}
        <p className="mt-2 text-[#aaa]"><strong className="text-[#ccc]">{flow.assessment==="REDUCE"?"Risikogedanke:":"Frühe Gelegenheit / noch fehlender Vorteil:"}</strong> {flow.whyNow}</p>
        <p className="mt-2 text-[#aaa]"><strong className="text-[#ccc]">{flow.assessment==="REDUCE"?"Einwand gegen den Risikogedanken:":"Gegenargument:"}</strong> {flow.counterargument}</p>
        {flow.conditionOrigin==="SERVER_INSTRUMENT_AND_ASSESSMENT"&&<p className="mt-2 text-[10px] text-slate-500">Richtungsbedingungen aus Instrument und Urteil abgeleitet; keine von der KI berechneten Kursmarken.</p>}
        <p className="mt-2 text-[#aaa]"><strong className="text-[#ccc]">{flow.assessment==="REDUCE"?"Bestätigung des Risikogedankens:":"Bestätigung:"}</strong> {flow.confirmation}</p>
        <p className="mt-2 text-[#aaa]"><strong className="text-[#ccc]">{flow.assessment==="REDUCE"?"Risikogedanken verwerfen:":"Verwerfen:"}</strong> {flow.invalidation}</p>
      </div>)}</div>
      <Detail title="Gemeinsame Gegenargumente und Grenzen"><List items={content.counterarguments} /><List items={content.limitations} /></Detail>
      <p className="mt-4 text-[10px] leading-relaxed text-[#888]">Cloudflare · {synthesis?.model?.includes("gemma") ? "Gemma 4" : synthesis?.model?.includes("qwen") ? "Qwen3" : synthesis?.model ?? "KI"} · erstellt {date(synthesis?.generatedAt)}{synthesis?.cached ? " · gespeichert wiederverwendet" : ""}. KI-Kandidaten sind keine App-Freigaben. Die Modellanteile oben bleiben unverändert; wirtschaftliche Richtigkeit und Handelsvorteil sind nicht bewiesen.</p>
    </> : <p className="mt-3 text-xs text-[#999]">{!current ? "Aktuelle KI-Einschätzung ausgesetzt, bis Marktstand und Research abgeglichen sind." : synthesis?.status === "SUCCESS" ? "Die gespeicherte KI-Antwort verwendet noch die bisherige Prüfung. Research bitte aktualisieren." : synthesis?.message ?? "Noch keine KI-Einschätzung verfügbar. Angezeigt wird die regelbasierte App-Auswertung."}</p>}
    {current && synthesis?.quality?.contractVersion===SYNTHESIS_CONTRACT && <AIResearchReviewNotes synthesis={synthesis} />}
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
      <ResearchSequenceStatus synthesis={report.aiSynthesis} />
      <AIResearchOverview report={report} snapshotTimestamp={reportSnapshotTimestamp} suspended={loading || Boolean(error) || !marketReady || snapshotMismatch} />
      <ResearchWeightingPanel synthesis={report.aiSynthesis} suspended={loading || Boolean(error) || !marketReady || snapshotMismatch} />
      <ResearchChartPanel context={report.historicalEvidence?.chartContext} suspended={loading || Boolean(error) || !marketReady || snapshotMismatch} />
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

export function AIResearchReviewNotes({synthesis}:{synthesis:ResearchSynthesis}) {
  const reviews=synthesis.instrumentReviews?.filter(r=>r.status!=="CHECKED")??[];
  if(!reviews.length)return null;
  const names={NASDAQ_PUT:"Nasdaq Put",NASDAQ_CALL:"Nasdaq Call",RUSSELL_CALL:"Russell Call"};
  const reason=(issue:string)=>/EARLY_RATIONALE_NOT_SPECIFIC/.test(issue)?"Früher Kandidat ohne konkrete Vorlaufbegründung":/STRUCTURED_.*REQUIRED/.test(issue)?"Eindeutige Richtungsbedingung UP/DOWN fehlt":/PROVIDER_OUTPUT_LIMIT_REACHED/.test(issue)?"Anbieter meldet erreichtes Antwortlimit; letzter Textblock nicht übernommen":/HISTORICAL_FREQUENCY_NOT_SUPPLIED/.test(issue)?"Historische Trefferquote ohne gelieferte Statistik behauptet":/UNSUPPORTED_NUMERIC/.test(issue)?"Nicht berechnete Schwellenwerte genannt":/REVERSED_/.test(issue)?"Bestätigung oder Widerlegung passt nicht zur jeweiligen These oder Risikoprüfung":/IDENTICAL_/.test(issue)?"Interpretation verschiedener Instrumente ist gleich":/UNMEASURED_/.test(issue)?"Nicht gemessene Entwicklung als Tatsache dargestellt":/HISTORICAL_HORIZON/.test(issue)?"Historischen Zeitraum unzulässig verallgemeinert":/WEEKLY_COT_.*CONTRADICTS_SOURCE/.test(issue)?"COT-Aussage widerspricht dem gelieferten Wochenvergleich":/COT_STOCK_DOES_NOT_MEASURE/.test(issue)?"COT-Netto-Bestand belegt weder Kauf-/Verkaufsdruck noch Anlegermotive":/COT_HORIZON_NOT_IN_MODEL_INPUT/.test(issue)?"COT-Zeitraum ohne gelieferte Grundlage verwendet":/SCORE_MISLABELED/.test(issue)?"Participation oder Qualität mit Breadth-Prozentwert verwechselt":/RISK_PHASE_IS_NOT/.test(issue)?"Risikophase mit gemessener Anleger-Risikobereitschaft verwechselt":/MISSING|THREE_INSTRUMENTS/.test(issue)?"Aussage fehlt oder ist unvollständig":/POSITIVE_INDEX_MEAN_IS_NOT_CALL_COUNTERARGUMENT|SUPPORT_ALONE|UPSIDE_ALONE|DOWNSIDE_ALONE|PUT_EARLY_THESIS_ONLY_UPSIDE/.test(issue)?"Chance und Gegenrisiko nicht schlüssig zugeordnet":"Inhalt oder Zuordnung muss geprüft werden";
  return <section className="mt-5 space-y-3 border-t border-amber-900/70 pt-4" aria-label="Zurückgehaltene KI-Aussagen">
    <h4 className="text-sm font-semibold text-amber-200">Originalaussagen · nicht übernommen</h4>
    <p className="text-xs text-slate-400">Die folgenden Modelltexte können sachlich falsch sein. Sie sind keine Einstiegskandidaten oder App-Freigaben. Ihre Anzeige korrigiert die Analysequalität nicht.</p>
    {reviews.map(review=><article key={review.instrument} className="border border-amber-900/70 p-3 text-xs leading-relaxed">
      <h5 className="font-semibold text-amber-200">{names[review.instrument]} · {review.status==="MISSING"?"Auswertung fehlt":"zurückgehalten"}</h5>
      <ul className="my-2 list-disc pl-4 text-amber-100/80">{[...new Set(review.issues.map(reason))].map(text=><li key={text}>{text}</li>)}</ul>
      {review.draft?<div className="space-y-2 text-slate-400">{[["Beobachtung / These",review.draft.reasoning],[review.draft.assessment==="REDUCE"?"Risikogedanke":"Frühe Hypothese",review.draft.whyNow],["Gegenrisiko",review.draft.counterargument],[review.draft.assessment==="REDUCE"?"Genannte Bestätigung des Risikogedankens":"Genannte Bestätigung",review.draft.confirmation],[review.draft.assessment==="REDUCE"?"Genannte Widerlegung des Risikogedankens":"Genannte Widerlegung",review.draft.invalidation]].map(([label,text])=><p key={label}><strong>{label}:</strong> {text||"Nicht vorhanden"}</p>)}</div>:<p className="text-slate-400">Kein eindeutig zuordenbarer Textblock vorhanden.</p>}
    </article>)}
    {reviews.some(r=>!r.draft)&&synthesis.quality?.providerText&&<pre className="whitespace-pre-wrap break-words text-xs text-slate-500">{synthesis.quality.providerText}</pre>}
  </section>;
}

export function ResearchChartPanel({context,suspended=false}:{context?:import('@/lib/aiResearch/aiResearchChartContext').ResearchChartContext;suspended?:boolean}){
 if(suspended)return <section className="rounded-xl border border-slate-700 p-4 text-xs text-slate-400">Chartkontext wartet auf den passenden gespeicherten Marktstand.</section>;
 if(!context)return <section className="rounded-xl border border-slate-700 p-4 text-xs text-slate-400">Chart- und Momentumkontext derzeit nicht verfügbar.</section>;
 const labels:Record<string,string>={UPTREND_CONTEXT:'21 Börsentage: positiv · 252 Börsentage: positiv',CORRECTION_CONTEXT:'21 Börsentage: negativ · 252 Börsentage: positiv',DOWNTREND_CONTEXT:'21 Börsentage: negativ · 252 Börsentage: negativ',REBOUND_CONTEXT:'21 Börsentage: positiv · 252 Börsentage: negativ',FLAT_OR_MIXED:'21 oder 252 Börsentage: unveränderte Kursentwicklung',INSUFFICIENT_DATA:'Für 252 Börsentage fehlen noch Vergleichskurse'};
 const percent=(value:number|null)=>value===null?'—':`${value>0?'+':''}${value.toLocaleString('de-DE',{maximumFractionDigits:2})}%`;
 return <section aria-label="Chart und Momentum" className="overflow-hidden rounded-xl border border-slate-700 bg-[#101820]">
  <div className="px-4 py-3"><h3 className="text-sm font-semibold text-slate-100">Chart & Momentum · eigener Kurskontext</h3><p className="mt-1 text-xs text-slate-400">Abgeschlossene Tageskurse · ergänzende Beobachtung, keine Einstiegsfreigabe</p></div>
  <div className="grid grid-cols-1 gap-px bg-slate-700 md:grid-cols-2">{([['Nasdaq-100',context.nasdaq],['Russell 2000',context.russell]] as const).map(([name,chart])=><article key={name} className="bg-[#111a23] p-4">
   <div className="flex justify-between gap-3"><h4 className="font-semibold text-slate-100">{name}</h4><span className="text-xs text-slate-400">Stand {chart.asOfDate??'unbekannt'}</span></div>
   <p className="mt-2 text-sm text-sky-200">{labels[chart.momentum.state]??chart.momentum.state}</p>
   {chart.asOfDate&&Date.now()-Date.parse(chart.asOfDate+'T00:00:00Z')>5*86400000&&<p className="mt-2 text-xs text-amber-200">Älterer Datenstand – keine aktuelle Kursbeobachtung.</p>}
   <dl className="mt-3 grid grid-cols-3 gap-3 text-xs"><div><dt className="text-slate-400">21 Sitzungen</dt><dd className="mt-1 text-slate-100">{percent(chart.momentum.fast.returnPct)}</dd></div><div><dt className="text-slate-400">252 Sitzungen</dt><dd className="mt-1 text-slate-100">{percent(chart.momentum.slow.returnPct)}</dd></div><div><dt className="text-slate-400">Abstand Jahreshoch*</dt><dd className="mt-1 text-slate-100">{percent(chart.drawdownFrom252SessionHighClosePct)}</dd></div></dl>
   <details className="mt-3 border-t border-slate-700 pt-3 text-xs text-slate-300"><summary className="cursor-pointer text-slate-400">Verlauf und Kursbereiche</summary>
    <p className="mt-2">21-Sitzungs-Momentum gegenüber fünf Sitzungen zuvor: {chart.momentum.fastReturnChange5SessionsPp===null?'—':chart.momentum.fastReturnChange5SessionsPp.toLocaleString('de-DE',{maximumFractionDigits:2})+' Prozentpunkte'}.</p>
    {chart.movingAverages.map(ma=><p className="mt-1" key={ma.period}>Abstand zum {ma.period}-Tage-Durchschnitt: {percent(ma.distancePct)}</p>)}
    <p className="mt-2">Mehrfach angenäherter oberer Schlusskursbereich: {chart.observations.nearRepeatedHighCloseZone?'aktuell nahe':'nicht aktuell erkannt'}.</p>
    <p>Mehrfach angenäherter unterer Schlusskursbereich: {chart.observations.nearRepeatedLowCloseZone?'aktuell nahe':'nicht aktuell erkannt'}.</p>
    <p className="mt-2">Rückkehr nach Schlusskursausbruch nach oben: {chart.observations.failedPrior20CloseBreakout?'erkannt':'nicht erkannt'}; nach unten: {chart.observations.failedPrior20CloseBreakdown?'erkannt':'nicht erkannt'}.</p>
    <p className="mt-2 text-slate-500">Diese Kursbereiche allein bestätigen keinen Boden. Zielprojektionen stehen gesondert bei den P&F-Mustern. Ein nicht erkanntes Rückkehrmuster schließt einen laufenden Trend nicht aus.</p>
   </details>
   <FormationContextPanel context={chart.formations} />
   <FormationHistoryPanel history={chart.formationHistory} />
  </article>)}</div>
  <p className="px-4 py-3 text-xs text-slate-500">*Höchster Schlusskurs der letzten 252 Sitzungen. Positiv/negativ bezeichnet die Kursveränderung über den jeweils genannten Zeitraum, keinen bestätigten Trend oder eine App-Phase. Mehrere Kursindikatoren sind keine unabhängigen Bestätigungen.</p>
 </section>;
}


export function FormationContextPanel({context}:{context?:import('@/lib/aiResearch/aiResearchFormations').FormationContext}){
 if(!context)return null;
 const family:Record<string,string>={DOUBLE_BOTTOM:'Doppelboden aus Schlusskursen',DOUBLE_TOP:'Doppelhoch aus Schlusskursen',PNF_DOUBLE_TOP_BREAKOUT:'P&F-Ausbruch über vorheriges X-Hoch',PNF_DOUBLE_BOTTOM_BREAKDOWN:'P&F-Bruch unter vorheriges O-Tief',PNF_TRIPLE_TOP_BREAKOUT:'P&F-Ausbruch über zwei gleiche X-Hochs',PNF_TRIPLE_BOTTOM_BREAKDOWN:'P&F-Bruch unter zwei gleiche O-Tiefs'};
 const status:Record<string,string>={FORMING:'Entstehend · Bestätigung offen',CONFIRMED:'Preisbedingung ausgelöst',INVALIDATED:'Ungültig'};
 const entries=[...context.classic.map(f=>({scale:'Klassisch',f})),...context.pointFigure.flatMap(p=>{
  const latest=p.signals[p.signals.length-1];return [p.forming,latest].filter((f):f is NonNullable<typeof f>=>!!f).map(f=>({scale:`P&F ${p.boxPercent.toLocaleString('de-DE')}% · aktuelle Säule: ${p.currentColumn==='X'?'aufwärts':p.currentColumn==='O'?'abwärts':'offen'}`,f}));
 })];
 return <div className="mt-3 border-t border-slate-700 pt-3">
  <h5 className="text-xs font-semibold text-slate-200">Formationen & bedingte Szenarien</h5>
  {!entries.length&&<p className="mt-2 text-xs text-slate-400">Keine Formation nach den eingebauten Regeln erkannt.</p>}
  {entries.map(({scale,f})=><details key={f.id} className="mt-2 rounded border border-slate-700 p-2 text-xs text-slate-300">
   <summary className="cursor-pointer"><span className="text-slate-400">{scale}</span> · {family[f.family]??f.family}<br/><span className={f.status==='INVALIDATED'?'text-amber-300':'text-sky-200'}>{f.status==='CONFIRMED'?`Ausgelöst am ${f.confirmedAt}`:status[f.status]} · {f.bias==='BULLISH'?'Aufwärtsszenario':'Abwärtsszenario'}</span>{f.currentRelation==='COUNTER_TO_CURRENT_COLUMN'&&<span className="block text-amber-200">Aktuell Gegenbewegung zur früher ausgelösten Formation.</span>}</summary>
   <p className="mt-2">Erkannt: {f.discoveredAt}{f.confirmedAt?` · Preisbedingung ausgelöst: ${f.confirmedAt}`:''}{f.invalidatedAt?` · ungültig seit ${f.invalidatedAt}`:''}</p>
   <p className="mt-1">{f.meaning}</p><p className="mt-1">Bestätigung: {f.confirmation}</p><p className="mt-1">Ungültigkeit: {f.invalidation}</p>
   {f.target&&f.status!=='INVALIDATED'&&<p className="mt-2 text-slate-200">P&F-Zielprojektion: {f.target.price.toLocaleString('de-DE',{maximumFractionDigits:2})} Punkte · {f.target.status==='PRELIMINARY'?'vorläufig; Zählsäule noch offen':'Zählsäule fixiert'} · berechnet zum Stand {f.target.knownAt}. Kein zugesicherter Zielkurs oder Zeithorizont.</p>}
  </details>)}
  <p className="mt-2 text-xs text-slate-500">Regelbasierte Schlusskursmuster, keine geprüfte Trefferquote. Ein entstehendes Muster darf eine bedingte Frühhypothese liefern; ausgelöste Preisbedingungen beweisen keinen künftigen Kursverlauf.</p>
 </div>;
}

function FormationHistoryPanel({history}:{history?:import("@/lib/aiResearch/aiResearchFormationHistory").FormationHistory|null}) {
 if(!history||history.status!=="AVAILABLE")return <p className="mt-3 text-xs text-slate-400">Historischer Mustervergleich: noch keine ausreichende Kursreihe verfügbar.</p>;
 const value=(v:number|null)=>v===null?"—":`${v>0?"+":""}${v.toLocaleString("de-DE",{maximumFractionDigits:2})}%`;
 const family=(name:string)=>({DOUBLE_BOTTOM:"Doppelboden",DOUBLE_TOP:"Doppelhoch",PNF_DOUBLE_TOP_BREAKOUT:"P&F Ausbruch aufwärts",PNF_TRIPLE_TOP_BREAKOUT:"P&F Dreifachausbruch aufwärts",PNF_DOUBLE_BOTTOM_BREAKDOWN:"P&F Bruch abwärts",PNF_TRIPLE_BOTTOM_BREAKDOWN:"P&F Dreifachbruch abwärts"}[name]??name);
 return <details className="mt-4 rounded border border-slate-700 p-3 text-xs text-slate-300">
  <summary className="cursor-pointer font-semibold">Historischer Mustervergleich · {history.firstDate} bis {history.asOfDate}</summary>
  <p className="my-3">20 Börsentage ab dem nächsten Schlusskurs. Plus bedeutet Bewegung in Musterrichtung, bei Abwärtsmustern also fallende Kurse. Brutto-Indexwerte, keine Rendite von Puts oder Calls.</p>
  <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th className="p-2">Muster / Erkennungsstand</th><th className="p-2">Fälle / ohne Überlappung</th><th className="p-2">Ø Bewegung</th><th className="p-2">Normaler Marktverlauf*</th><th className="p-2">Ø ohne Überlappung</th></tr></thead><tbody>
   {history.studies.map(study=>{const stats=study.horizons.find(h=>h.horizonSessions===20);if(!stats)return null;return <tr key={study.key} className="border-t border-slate-800"><td className="p-2">{family(study.family)}{study.scale!==null?` · ${study.scale}%`:""}<br/>{study.stage==="FORMING"?"Entstehend":study.stage==="CONFIRMED"?"Preisregel ausgelöst":"P&F-Zählstand fixiert"}</td><td className="p-2">{stats.sampleSize} / {stats.nonOverlappingCount}{stats.nonOverlappingCount<30&&<span className="block text-amber-200">Kleine Stichprobe</span>}</td><td className="p-2">{value(stats.meanDirectionalReturnPct)}</td><td className="p-2">{value(stats.baselineDirectionalMeanPct)}</td><td className="p-2">{value(stats.nonOverlappingMeanDirectionalPct)}</td></tr>;})}
  </tbody></table></div>
  {!history.studies.length&&<p>Keine abgeschlossenen Musterfälle vorhanden.</p>}
  <p className="mt-3 text-slate-400">*Eigener Index über alle geeigneten 20-Tage-Zeiträume, ebenfalls in Musterrichtung gerechnet. Unterschiedliche Marktphasen wurden nicht angeglichen. Überlappungen und mehrere getestete Muster begrenzen die Aussagekraft. Auch die Zeitabschnitte sind kein unberührter Außentest. Kein statistisch bestätigter Handelsvorteil.</p>
 </details>;
}

export function ResearchSequenceStatus({synthesis}:{synthesis?:ResearchSynthesis}){
 const expert=synthesis?.cotAnalysis,previous=synthesis?.status==='UNAVAILABLE'?synthesis.previousSuccessful:undefined;
 const names:Record<string,string>={NASDAQ:'Nasdaq-100',RUSSELL_2000:'Russell 2000',NASDAQ_PUT:'Nasdaq Put',NASDAQ_CALL:'Nasdaq Call',RUSSELL_CALL:'Russell Call'};
 return <>
  {synthesis&&<section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-300">
   <h3 className="font-semibold text-white">COT-Faktenbasis der Gesamtauswertung</h3>
   <p className="mt-2">{expert?'Ein ergänzender separater COT-Fachbericht ist vorhanden.':'COT wird über berechnete Fakten und Fachkarten ausgewertet. Dafür ist kein separater KI-COT-Bericht erforderlich.'} Neue Modellaufrufe in diesem Vorgang: {synthesis.modelRequestsUsed??0}.</p>
   {expert&&<details className="mt-3"><summary className="cursor-pointer">Getrennte COT-Auswertung · erstellt {date(expert.generatedAt)}</summary>
    {Object.entries(expert.markets).map(([market,v])=><div key={market} className="mt-3 border-t border-slate-700 pt-3"><strong>{names[market]??market} · Positionen vom {v.observationDate}</strong>
     <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[440px] text-left text-[11px]"><caption className="mb-2 text-left text-slate-400">Berechnete COT-Fakten · Nettokontrakte; Veränderungen sind keine Kursprognosen</caption><thead><tr>{['Gruppe','Nettozustand','1 Woche','4 Wochen','13 Wochen'].map(t=><th key={t} className="p-2">{t}</th>)}</tr></thead><tbody>{(v.facts??[]).map(g=><tr key={g.group} className="border-t border-slate-700"><td className="p-2">{g.group==='ASSET_MANAGER'?'Asset Manager':'Leveraged Money'}</td><td className="p-2">{g.netPosition?.toLocaleString('de-DE')??'—'} · {g.netState==='NET_LONG'?'netto long':g.netState==='NET_SHORT'?'netto short':g.netState==='FLAT'?'ausgeglichen':'unbekannt'}</td>{[1,4,13].map(weeks=>{const h=g.horizons.find(h=>h.weeks===weeks);return <td key={weeks} className="p-2" title={h?.fact}>{h?.delta===null||h?.delta===undefined?'—':(h.delta>0?'+':'')+h.delta.toLocaleString('de-DE')}</td>;})}</tr>)}</tbody></table></div>
     <p className="mt-2 text-slate-400">Positive Nettoänderung = Verschiebung in Richtung Long; negative = Richtung Short. Der Nettozustand kann dabei weiter short bzw. long bleiben.</p>
     <p className="mt-3 font-semibold">KI-Einordnung</p><p className="mt-2">{v.reason}</p><p className="mt-2">{v.divergence}</p><p className="mt-2 text-slate-400">{v.limitation}</p>{(v.notes??[]).map(note=><p key={note} className="mt-2 text-amber-200">{note}</p>)}</div>)}
    <p className="mt-3 text-slate-400">Dieser Fachbericht sieht nur datierte COT-Positionen, keine Kurse oder Nachrichten. Keine eigenständige Einstiegsfreigabe.</p>
   </details>}
  </section>}
  {synthesis?.status==='SUCCESS'&&synthesis.indexScenarios&&Object.keys(synthesis.indexScenarios).length>0&&<section className="rounded-xl border border-slate-700 p-4 text-xs text-slate-300"><h3 className="font-semibold text-white">KI · Fortsetzung oder mögliche Wende?</h3><p className="mt-2 text-slate-400">Bedingte Hypothesen vor der Instrumentbewertung; kein nachgewiesener Vorlauf oder neuer App-Einstieg. Kursbedingungen werden aus den Daten ergänzt.</p>{Object.entries(synthesis.indexScenarios).map(([market,scenario])=><div key={market} className="mt-4"><strong>{names[market]??market}</strong>{scenario.basis&&<p className="mt-2 text-slate-400">{scenario.basis}</p>}{(scenario.notes??[]).map(note=><p key={note} className="mt-2 text-amber-200">{note}</p>)}<div className="mt-2 grid gap-3 md:grid-cols-2"><div className="border border-slate-700 p-3"><strong>Fortsetzung</strong><p className="mt-2">{scenario.continuation}</p>{scenario.continuationCondition&&<p className="mt-3 text-sky-200">Geprüfte Kursbedingung: {scenario.continuationCondition}</p>}</div><div className="border border-slate-700 p-3"><strong>Mögliche Wende</strong><p className="mt-2">{scenario.reversal}</p>{scenario.reversalCondition&&<p className="mt-3 text-sky-200">Geprüfte Kursbedingung: {scenario.reversalCondition}</p>}</div></div></div>)}</section>}
  {previous&&<section className="rounded-xl border border-amber-800 bg-amber-950/20 p-4 text-xs text-slate-300">
   <h3 className="font-semibold text-amber-200">Letzte erfolgreiche KI-Auswertung bleibt erhalten</h3>
   <p className="mt-2">Aktuelle Analyse nicht verfügbar: {synthesis?.message}</p>
   <p className="mt-2">Früherer Marktstand {date(previous.snapshotTimestamp)} · KI-Bericht {date(previous.generatedAt)}. Archivierter Stand; die alten Aussagen wurden mit dem aktuellen Markt nicht erneut geprüft.</p>
   {previous.sourceReview&&<AIResearchSourceReview review={previous.sourceReview} archived />}
   {previous.narrative&&<ResearchNarrativeText narrative={previous.narrative} archived />}
   <p className="mt-3">{previous.content?.summary}</p>
   <div className="mt-3 grid gap-3 md:grid-cols-3">{previous.content?.flows.map(flow=><div key={flow.instrument} className="border border-amber-900 p-3"><strong>{names[flow.instrument]??flow.instrument}</strong><p className="mt-2">{flow.reasoning}</p><p className="mt-2">{flow.whyNow}</p><p className="mt-2 text-slate-400">Gegenargument: {flow.counterargument}</p></div>)}</div>
  </section>}
 </>;
}
export function ResearchWeightingPanel({synthesis,suspended=false}:{synthesis?:import('@/lib/aiResearch/aiResearchSynthesisTypes').ResearchSynthesis;suspended?:boolean}){
 const contexts=synthesis?.weightingContexts;
 if(!contexts?.length)return null;
 const names={NASDAQ_PUT:'Nasdaq Put',NASDAQ_CALL:'Nasdaq Call',RUSSELL_CALL:'Russell Call'};
 const blocks={APP:'Marktstruktur',CHART:'Chart & Momentum',COT:'COT',HISTORY:'Historie',NEWS:'Nachrichten'};
 const readings={SUPPORTS:'Unterstützend',OPPOSES:'Gegenläufig',MIXED:'Gemischt',UNKNOWN:'Offen'};
 const n=(value:number)=>value.toLocaleString('de-DE',{maximumFractionDigits:2});
 return <section className="rounded border border-slate-700 bg-[#101820] p-4 text-xs text-slate-300">
  <h3 className="font-semibold text-slate-100">Research · feste Ausgangsgewichte</h3>
  <p className="mt-2 text-slate-400">Marktstruktur 35 % · Chart 35 % · COT 10 % · Historie 15 % · Nachrichten 5 %</p>
  <p className="mt-2 text-slate-400">Die festen Ausgangsgewichte und Datenabdeckung bleiben sichtbar. Der freie KI-Text wird nicht automatisch in Blockurteile oder Gewichtspunkte übersetzt; ein fehlender Saldo bedeutet keine neutrale Marktlage. Keine Erfolgswahrscheinlichkeit, Positionsgröße oder zusätzliche Einstiegsfreigabe.</p>
  {suspended?<p className="mt-3 text-amber-200">Gewichtete Beurteilung bis zum Snapshot-Abgleich ausgesetzt.</p>:<details className="mt-3"><summary className="cursor-pointer font-semibold">Beiträge und Nachrichtenbezug je Instrument</summary>
   <div className="mt-3 grid gap-3 xl:grid-cols-3">{contexts.map(context=>{
    const review=synthesis?.content?.flows.find(f=>f.instrument===context.instrument)?.weightedReview;
    const valid=review?.policy===context.policy;
    return <article key={context.instrument} className="rounded border border-slate-700 p-3">
     <h4 className="font-semibold text-slate-100">{names[context.instrument]}</h4>
     <p className="mt-1 text-slate-400">Richtung: {context.instrument==='NASDAQ_PUT'?'fallender Nasdaq':'steigender eigener Index'} · Kontext 20 Börsentage, keine Kursprognose</p>
     <p className="my-3">{valid&&review.assessedBalance!==null?<>Saldo beurteilter Beiträge: <strong>{review.assessedBalance>0?'+':''}{n(review.assessedBalance)} Gewichtspunkte</strong><br/>Beurteilt: {n(review.assessedWeight)} von 100 · Offen: {n(review.unassessedWeight)}</>:<>Noch keine gewichtete KI-Beurteilung. Die Ausgangsgewichte und Datenabdeckung sind bereits verfügbar.</>}</p>
     <table className="w-full text-left"><thead><tr><th className="py-1">Block</th><th>Max.*</th><th>KI / Beitrag</th></tr></thead><tbody>{context.blocks.map(block=>{
      const row=valid?review.blocks.find(b=>b.key===block.key):undefined;
      return <tr key={block.key} className="border-t border-slate-800"><td className="py-2" title={block.limitation}>{blocks[block.key]} ({block.baseWeight} %)</td><td>{n(block.effectiveWeight)}</td><td>{row?readings[row.reading]:'Ausstehend'}{row?.contribution!==null&&row?.contribution!==undefined?` / ${row.contribution>0?'+':''}${n(row.contribution)}`:''}</td></tr>;
     })}</tbody></table>
     {review?.source==='SHARED_INDEX_CONTEXT'&&<p className="mt-2 text-[10px] text-slate-400">Gemeinsame Indexbeurteilung, für Put rechnerisch umgekehrt. Das sind keine unabhängigen Prognosen; eine frühe Gegenidee darf trotzdem bestehen.</p>}
     {Boolean(review?.reviewNotes.length)&&<div className="mt-2 text-amber-200">{review?.reviewNotes.map(note=><p key={note}>{note}</p>)}</div>}
     <div className="mt-2 space-y-1 text-slate-400">{review?.blocks.filter(b=>b.marketReading||b.reason).map(b=><p key={b.key}><strong>{blocks[b.key]}:</strong> {b.marketReading==='BULLISH'?'Index aufwärtsgerichtet':b.marketReading==='BEARISH'?'Index abwärtsgerichtet':b.marketReading==='MIXED'?'Gemischt':'Nicht beurteilt'} · {b.reason||'Begründung fehlt'}</p>)}</div>
     <p className="mt-2 text-[10px] text-slate-400">*Verfügbarer Gewichtsrahmen nach Datenabdeckung; Nachrichten zusätzlich nach Indexbezug. Er wird bei Ausfällen nicht auf andere Blöcke verteilt. Gleiches Preismaterial bleibt abhängig.</p>
     <details className="mt-3"><summary className="cursor-pointer">Nachrichten für diesen Index · {context.news.items.length} ausgewählt</summary>
      {!context.news.items.length&&<p className="mt-2 text-slate-400">Keine geeignete datierte Quelle im gelieferten Nachrichtenbestand. Das bedeutet keine Entwarnung.</p>}
      {context.news.items.map(item=><div key={item.id} className="mt-3 border-t border-slate-700 pt-2"><a className="text-sky-300 underline" href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a><p className="mt-1 text-slate-400">{item.publisher||'Quelle nicht benannt'} · {item.publishedAt.slice(0,10)} · Indexbezug {item.relevance==='HIGH'?'hoch':item.relevance==='MEDIUM'?'mittel':'gering'}</p><p className="mt-1">{item.reason}</p>{item.eventRiskReview&&<p className="mt-1 text-amber-200">Ereignisrisiko gesondert prüfen; keine automatische Richtungsannahme oder Handelssperre.</p>}</div>)}
      <p className="mt-3 text-[10px] text-slate-400">Relevanzstufen innerhalb der 5 %: hoch bis 5, mittel bis 2,5, gering bis 1 Gewichtspunkte. Mehr Artikel erhöhen das Gewicht nicht. Nur gelieferte Überschriften und Zusammenfassungen, Volltexte nicht verifiziert. Relevanz ist keine Wirkungsrichtung. Dedupliziert: {context.news.duplicates}; weitere passende Quellen nicht im KI-Auszug: {context.news.omitted}.</p>
     </details>
    </article>;
   })}</div>
  </details>}
 </section>;
}


export function ResearchPriceReferenceCard({references}:{references?:NonNullable<ResearchSynthesis['priceReferences']>[number]}){
 if(references?.status!=='AVAILABLE')return <p className="mt-3 text-[11px] text-slate-500">Keine ausreichenden datierten Chartmarken verfügbar.</p>;
 const put=references.instrument==='NASDAQ_PUT',favorable=put?references.downLevels:references.upLevels,opposing=put?references.upLevels:references.downLevels;
 const price=(n:number)=>n.toLocaleString('de-DE',{maximumFractionDigits:2});
 const levels=(rows:typeof favorable,direction:string)=>rows.length?rows.map(row=><p key={row.id} className="mt-1"><strong>{direction} {price(row.price)}</strong> · Abstand {row.distancePct>0?'+':''}{row.distancePct.toLocaleString('de-DE',{maximumFractionDigits:2})}%<br/><span className="text-slate-500">{row.label}</span></p>):<p className="mt-1 text-slate-500">Keine passende Marke auf dieser Seite vorhanden.</p>;
 return <div className="mt-3 border-t border-slate-700 pt-3 text-[11px] text-slate-300">
  <p className="font-semibold">Chartmarken · Stand {references.asOfDate}</p>
  <p className="mt-1 text-slate-400">Letzter Schlusskurs {price(references.lastClose!)} · eigene Indexpunkte</p>
  <p className="mt-2 font-semibold">Für die {put?'Put':'Call'}-Richtung beobachten</p>
  {levels(favorable.slice(0,2),put?'Unterschreiten von':'Rückkehr über')}
  <p className="mt-2 font-semibold">Gegenbewegung beobachten</p>
  {levels(opposing.slice(0,1),put?'Rückkehr über':'Unterschreiten von')}
  <details className="mt-2"><summary className="cursor-pointer text-slate-400">Weitere Kursreferenzen</summary>{levels(favorable.slice(2),put?'Unter':'Über')}{levels(opposing.slice(1),put?'Über':'Unter')}</details>
  <p className="mt-2 text-[10px] text-slate-500">Tagesschlussbasis. Bedingte Hinweise, keine garantierten Widerstände, Kursziele oder Einstiegsfreigaben. Marken stammen aus den Daten, nicht aus frei gewählten KI-Zahlen.</p>
 </div>;
}

export function ResearchNarrativeText({narrative,archived=false}:{narrative:NonNullable<ResearchSynthesis['narrative']>;archived?:boolean}){
 return <section className="border-y border-slate-700/60 p-4 sm:p-5" aria-label={archived?'Archivierte freie KI-Analyse':'Freie unabhängige KI-Analyse'}>
  <h3 className="text-sm font-semibold text-sky-200">{archived?'Früherer KI-Text · ungeprüft':'Ungeprüfte KI-Zusatzinterpretation · Originaltext'}</h3>
  <p className="mt-2 text-[11px] text-slate-400">Originaltext der KI. Zahlenkarten und App-Freigaben werden separat dargestellt; kein automatisch klassifiziertes Instrumenturteil oder Gewichtungssaldo.</p>
  {narrative.truncated&&<p role="status" className="mt-3 text-xs text-amber-200">Die Antwort hat die Ausgabelänge erreicht und kann am Ende unvollständig sein.</p>}
  {narrative.audit&&<div role="status" className="mt-3 border border-amber-800 p-3 text-xs text-amber-100">
    <p className="font-semibold">{narrative.audit.findings.length?'Prüfung: konkrete Widersprüche oder Vollständigkeitshinweise gefunden':'Begrenzte Prüfung: keine erfassten Widersprüche gefunden'}</p>
    <p className="mt-2">{narrative.audit.scope}</p>
    {narrative.audit.findings.map((finding,index)=><div key={index} className="mt-3"><p>{finding.correction}</p>{finding.quote&&<p className="mt-1 text-slate-400">Beanstandete KI-Aussage: {finding.quote}</p>}</div>)}
  </div>}
  <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">{narrative.text}</div>
  <p className="mt-4 text-[11px] text-slate-400">Inhaltliche Richtigkeit und Vorhersagevorteil sind nicht automatisch bestätigt.</p>
 </section>;
}

/** Source-derived facts remain visible independently of model prose or inference status. */
export function ResearchFactOverview({synthesis}:{synthesis:ResearchSynthesis}){
 const briefs=synthesis.quality?.instrumentBriefs??[];
 const number=(n:number|null|undefined)=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('de-DE',{maximumFractionDigits:2}):'nicht verfügbar';
 return <section aria-label="Berechnete Faktenbasis" className="border-b border-slate-700 p-4 sm:p-5">
  <h3 className="text-sm font-semibold text-slate-100">Berechnete Faktenbasis</h3>
  <p className="mt-2 text-xs text-slate-400">Aus den gelieferten Daten berechnet, unabhängig vom KI-Text. Keine Prognose oder Einstiegsfreigabe. Quellenrichtigkeit und Börsenkalender sind damit nicht unabhängig geprüft.</p>
  <div className="mt-3 grid gap-4 sm:grid-cols-2">{(['NASDAQ_CALL','RUSSELL_CALL'] as const).map(instrument=>{
   const b=briefs.find(x=>x.instrument===instrument);const ref=synthesis.priceReferences?.find(x=>x.instrument===instrument);
   if(!b&&!ref)return <p key={instrument} className="text-xs text-slate-400">{instrument==='NASDAQ_CALL'?'Nasdaq-100':'Russell 2000'}: Faktenbasis nicht verfügbar.</p>;
   const levels=[...(ref?.upLevels??[]),...(ref?.downLevels??[])].filter(x=>/^MA(20|50|200)$/.test(x.id));
   return <div key={instrument} className="space-y-2 text-xs text-slate-300">
    <h4 className="font-semibold">{instrument==='NASDAQ_CALL'?'Nasdaq-100 · für Put und Call':'Russell 2000'}</h4>
    <p>Chartschluss {ref?.asOfDate??'nicht verfügbar'}: {number(ref?.lastClose)} Indexpunkte. Separater Snapshotkurs: {number(b?.price.current)}.</p>
    <p>5 Sitzungen {pct(b?.price.momentum5D)} · 20 Sitzungen {pct(b?.price.momentum20D)}</p>
    {levels.map(l=><p key={l.id}>Schlusskurs {typeof ref?.lastClose==='number'?(ref.lastClose>l.price?'über':ref.lastClose<l.price?'unter':'auf'):'Relation unbekannt'} {l.id}: {number(l.price)} Punkte ({l.asOfDate}).</p>)}
    {b?.cot.map(g=><div key={g.group}><p>{g.group==='LEVERAGED_MONEY'?'Leveraged Money':g.group==='ASSET_MANAGER'?'Asset Manager':g.group}, {g.reportDate}: netto {number(g.netPosition)} Kontrakte.</p><p>1 Woche: {g.weeklyFact??'nicht verfügbar'} 4 Wochen Nettoänderung: {number(g.change4W)} Kontrakte. {g.change4WFact??'nicht verfügbar'} 13 Wochen: {g.change13WFact??'nicht verfügbar'}</p></div>)}
    {b?.histories.filter(h=>h.currentMatch).map(h=><p key={h.id}>Historie {h.family}, Stand {h.asOfDate}: folgende 20 Sitzungen im Mittel {pct(h.meanPct)}, Basis {pct(h.baselineMeanPct)}, Differenz {pct(h.excessMeanPp,true)}; p10/p90 {pct(h.p10Pct)} / {pct(h.p90Pct)}. {h.sampleSize} Fälle, möglicherweise überlappend.</p>)}
    <p className="text-slate-500">Durchschnitte sind Referenzen, keine bewiesene Unterstützung. Historische Indexrenditen sind keine erwarteten Optionsrenditen. COT ist datierter Positionskontext.</p>
   </div>;
  })}</div>
 </section>;
}



export function ResearchInterpretationFrame({frame}:{frame:NonNullable<NonNullable<ResearchSynthesis['domainConcepts']>['interpretationFrame']>}){
 return <section className="border-b border-slate-700 p-4 sm:p-5" aria-label="Fachlicher Interpretationsrahmen">
 <h3 className="text-sm font-semibold text-sky-200">Fachlicher Interpretationsrahmen · berechnet</h3>
 <p className="mt-2 text-xs text-slate-400">Diese Fakten und bedingten Wirkungen werden aus den gelieferten Daten aufbereitet und der KI ebenfalls übergeben. Die KI wägt sie frei ab; sie muss die Zahlen nicht wiederholen. Kein berechnetes Gesamturteil oder Einstiegssignal.</p>
 <div className="mt-3 grid gap-4 sm:grid-cols-2">{frame.indices.map(index=><section key={index.market} className="space-y-3 text-xs leading-relaxed text-slate-300"><h4 className="font-semibold">{index.market==='NASDAQ'?'Nasdaq-100':'Russell 2000'}</h4>{index.cards.filter(c=>c.kind!=='PNF').map(c=><p key={c.id}><span className="text-slate-500">[{c.id}] {c.asOfDate??'Stand unbekannt'} · </span>{c.text}</p>)}<details><summary className="cursor-pointer text-sky-200">Formaler P&amp;F-Status</summary>{index.cards.filter(c=>c.kind==='PNF').map(c=><p key={c.id} className="mt-2"><span className="text-slate-500">[{c.id}] {c.asOfDate??'Stand unbekannt'} · </span>{c.text}</p>)}</details></section>)}</div>
 <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-300">{frame.instruments.map(c=><p key={c.id}><strong>{c.instrument==='NASDAQ_PUT'?'Nasdaq Put':c.instrument==='NASDAQ_CALL'?'Nasdaq Call':'Russell Call'}:</strong> {c.text}</p>)}</div>
 </section>;
}

export function ResearchDomainConcepts({concepts}:{concepts:NonNullable<ResearchSynthesis['domainConcepts']>}){
 return <details className="border-b border-slate-700 p-4 sm:p-5"><summary className="cursor-pointer text-sm font-semibold text-sky-200">Fachliche Vor-Auswertung · Marktkonstellationen, P&F, COT und Historie</summary>
 <p className="mt-3 text-xs text-slate-400">Regelgebundene Befunde aus den gelieferten Daten. Hier stehen alle Einzelprüfungen; die KI erhält eine gekürzte Auswahl für ihre freie Abwägung. Keine Gesamtmarktentscheidung oder automatische Handelsfreigabe.</p>
 {Object.values(concepts.indices).map(index=><section key={index.market} className="mt-4 space-y-2 text-xs leading-relaxed text-slate-300"><h4 className="font-semibold">{index.market==='NASDAQ'?'Nasdaq-100':'Russell 2000'} · {index.asOfDate??'Stand unbekannt'}</h4>
 {index.findings.map(f=><p key={f.id}><span className="text-slate-500">[{f.id}] {f.asOfDate??'Stand unbekannt'} · </span>{f.text}</p>)}
 <details><summary className="cursor-pointer">Preisbedingungen und bereits erfüllte Zustände</summary>{index.conditions.map(p=><p key={p.id} className="mt-2"><span className="text-slate-500">[{p.id}] </span>{p.text}</p>)}</details></section>)}
 <p className="mt-4 text-xs text-slate-500">{concepts.limits.join(' ')}</p></details>;
}

