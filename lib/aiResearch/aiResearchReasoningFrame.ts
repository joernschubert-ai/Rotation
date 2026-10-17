import type { SynthesisEvidence } from "./aiResearchSynthesisEvidence";
import { buildInstrumentBriefs } from "./aiResearchInstrumentBriefs";

export const COT_HORIZONS = ["WEEK", "FOUR_WEEKS", "THIRTEEN_WEEKS"] as const;
export type COTHorizon = typeof COT_HORIZONS[number];
export type HistoryEffect = "SUPPORTS_DIRECTION" | "OPPOSES_DIRECTION" | "NEUTRAL" | "UNKNOWN";
export const RISK_MECHANISMS = {
  NASDAQ_PUT: ["REBOUND", "FAILED_CONTINUATION", "NO_CLEAR_EDGE", "DATA_LIMITATIONS"],
  NASDAQ_CALL: ["FURTHER_DOWNSIDE", "FAILED_REBOUND", "NO_CLEAR_EDGE", "DATA_LIMITATIONS"],
  RUSSELL_CALL: ["FURTHER_DOWNSIDE", "FAILED_REBOUND", "NO_CLEAR_EDGE", "DATA_LIMITATIONS"],
} as const;
export function historyDirectionEffect(instrument: string, mean: unknown): HistoryEffect {
  if (typeof mean !== "number" || !Number.isFinite(mean)) return "UNKNOWN";
  if (mean === 0) return "NEUTRAL";
  return mean * (instrument === "NASDAQ_PUT" ? -1 : 1) > 0 ? "SUPPORTS_DIRECTION" : "OPPOSES_DIRECTION";
}
export function cotHorizonFact(group: ReturnType<typeof buildInstrumentBriefs>[number]["cot"][number], horizon: unknown): string | null {
  if (horizon === "WEEK") return "Eine Woche: " + group.weeklyFact;
  if (horizon === "FOUR_WEEKS") return "Vier Wochen: " + group.change4WFact;
  if (horizon === "THIRTEEN_WEEKS") return "13 Wochen: " + group.change13WFact;
  return null;
}
export function buildReasoningFrames(evidence: SynthesisEvidence[]) {
  const app = evidence.find(item => item.id === "APP")?.data;
  const structures = app?.instrumentStructure as Record<string, unknown> | undefined;
  return buildInstrumentBriefs(evidence).map(brief => ({
    instrument: brief.instrument,
    ownStructure: structures?.[brief.instrument === "RUSSELL_CALL" ? "RUSSELL_2000" : "NASDAQ"] ?? null,
    priceRef: brief.priceRef, cotRef: brief.cotRef,
    historyChoices: brief.histories.map(study => ({id: study.id, meanIndexReturn: study.meanPct,
      directionEffect: historyDirectionEffect(brief.instrument, study.meanPct), comparisonFact: study.comparisonFact,
      asOfDate: study.asOfDate, currentMatch: study.currentMatch, sampleSize: study.sampleSize,
      medianPct: study.medianPct, p10Pct: study.p10Pct, p90Pct: study.p90Pct})),
    cot: brief.cot.map(group => ({group: group.group, observationDate: group.reportDate,
      horizons: COT_HORIZONS.map(horizon => ({horizon, fact: cotHorizonFact(group, horizon)}))})),
    riskMechanisms: RISK_MECHANISMS[brief.instrument],
    note: "Directional effect describes only the historical index mean, not a trading edge. COT is context without a validated directional rule."
  }));
}
/** Assemble only reviewed per-instrument judgments; no second unbound global thesis. */
export function aggregateReviewedFlows(flows: Array<{instrument: string; assessment: string; opportunityMechanism?: string}>) {
  flows = flows.filter(flow => flow && typeof flow === "object");
  const names: Record<string,string> = {NASDAQ_PUT: "Nasdaq Put", NASDAQ_CALL: "Nasdaq Call", RUSSELL_CALL: "Russell Call"};
  const actions: Record<string,string> = {WATCH: "beobachten", PREPARE: "vorbereiten", STARTER_CANDIDATE: "frühen Kandidaten prüfen", CONFIRM: "Bestätigung prüfen", REDUCE: "Risiko prüfen"};
  const mechanisms: Record<string,string> = {CONTINUATION: "Fortsetzung der bisherigen Bewegung als Hypothese", REVERSAL: "mögliche Gegenbewegung als Hypothese", NONE: "kein konkreter früher Vorteil begründet"};
  return {
    summary: flows.map(flow => `${names[flow.instrument]}: ${actions[flow.assessment] ?? flow.assessment}.`).join(" "),
    asymmetry: flows.map(flow => `${names[flow.instrument]}: ${mechanisms[flow.opportunityMechanism ?? "NONE"] ?? "unbekannter Mechanismus"}.`).join(" ") + " Ein quantifiziertes Options-Chance-Risiko-Verhältnis ist damit nicht belegt. Die KI-Begründung und Gegenrisiken stehen beim jeweiligen Instrument."
  };
}
