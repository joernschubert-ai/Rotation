import type { AIResearchReport, AIResearchSnapshot } from "./aiResearchTypes";

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function text(value: unknown): string { return typeof value === "string" ? value : ""; }
function numeric(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Descriptive decision aid. Does not change any engine, approval or allocation. */
export function buildAIResearchDecisionSupport(
  report: AIResearchReport,
  snapshot: AIResearchSnapshot,
  now = Date.now()
): NonNullable<AIResearchReport["decisionSupport"]> {
  const stack = object(snapshot.tradeStack);
  const sizing = object(snapshot.positionSizing ?? snapshot.sizing);
  const assessment = report.evidenceAssessment;
  const flowDefinitions = [
    { key: "nasdaqPut", instrument: "Nasdaq Put", timing: object(snapshot.putTiming) },
    { key: "nasdaqCall", instrument: "Nasdaq Call", timing: object(snapshot.nasdaqCall) },
    { key: "russellCall", instrument: "Russell Call", timing: object(snapshot.russell) },
  ];
  const flows = flowDefinitions.map(({ key, instrument, timing }) => {
    const candidate = object(stack[key]);
    const allocation = object(sizing[key]);
    const modelSize = numeric(allocation.size);
    const execution = text(timing.execution) || text(allocation.mode) || "UNKNOWN";
    const blocks = Array.isArray(candidate.blockReasons) ? candidate.blockReasons.filter(item => typeof item === "string") as string[] : [];
    const putOpen = key !== "nasdaqPut" || (timing.entryWindow === "OPEN" && ["SMALL STARTER", "PARTIAL SIZE", "FULL SIZE"].includes(text(timing.execution)));
    const eligible = candidate.eligible === true && modelSize !== null && modelSize > 0 && modelSize <= 100 && blocks.length === 0 && putOpen;
    return { instrument, eligible, modelSize, execution,
      reason: blocks.join(" · ") || (eligible ? "TradeStack und Positionsmodell geben diesen Flow frei." : "Kein gemeinsam freigegebener Flow mit positiver Modellgröße.") };
  });
  const approved = flows.filter(flow => flow.eligible);
  const snapshotTimestamp = text(snapshot.timestamp);
  const snapshotTime = Date.parse(snapshotTimestamp);
  const stale = !Number.isFinite(snapshotTime) || snapshotTime > now || now - snapshotTime > 86400000;
  const state = assessment?.opportunityState ?? "WAIT";
  const entryAllowed = ["EARLY_STARTER", "CONFIRM", "SCALE_IN"].includes(state);
  let action = "Beobachten – kein neuer Einstieg";
  if (entryAllowed && approved.length === 1) action = `${approved[0].instrument}: ${state === "EARLY_STARTER" ? "kleinen Modellstarter prüfen" : "Modellfreigabe prüfen"}`;
  else if (entryAllowed && approved.length > 1) action = "Mehrere freigegebene Flows getrennt prüfen";
  else if (state === "ARMED") action = "Einstieg vorbereiten – Freigabe abwarten";
  else if (state === "REDUCE") action = "Bestehendes Risiko überprüfen – nicht nachsetzen";
  if (!entryAllowed && state !== "REDUCE" && approved.some(flow => flow.instrument === "Russell Call")) {
    action = "Nasdaq abwarten; Russell-Call-Freigabe getrennt prüfen";
  }
  if (stale) action = "Daten aktualisieren – Einstieg nicht beurteilen";
  const modelFreed = approved.length ? approved.map(flow => `${flow.instrument}: ${flow.modelSize}% Modellanteil`).join("; ") : "Kein Flow mit positiver Größe gemeinsam freigegeben.";
  return {
    action, snapshotTimestamp,
    reason: `Struktur ${assessment?.structuralBias ?? "UNKNOWN"}; Bestätigung ${assessment?.confirmation ?? "NONE"}; Gegenargumente ${assessment?.contradiction ?? "UNKNOWN"}. ${modelFreed}`,
    asymmetry: state === "EARLY_STARTER" && approved.length > 0
      ? "Früher Einstiegskandidat: Ein kleiner freigegebener Modellanteil kann die Exposition begrenzen. Ein günstiges Gewinn-Verlust-Verhältnis oder positiver Erwartungswert ist damit noch nicht belegt."
      : "Ein asymmetrischer Vorteil ist noch nicht quantifiziert. Historie, Positionierung und Nachrichten liefern Kontext; konkrete Einstiegs-, Ausstiegs- und Produktpreise fehlen für eine belastbare Berechnung.",
    flows,
    evidence: (assessment?.evidence ?? []).map(block => ({ category: block.category, state: block.state, summary: block.summary })),
    confirmation: report.forwardTestClaims.map(claim => claim.confirmationCondition).filter((item): item is string => Boolean(item)),
    invalidation: [...new Set([
      ...report.thesis.invalidationConditions,
      ...report.forwardTestClaims.map(claim => claim.invalidationCondition).filter((item): item is string => Boolean(item)),
    ])],
    limitations: [
      "Modellanteile sind Zielgrößen, keine zusätzlichen Kaufaufträge und kein maximaler Depotverlust.",
      "Keine automatischen Orders. Für Ausbau müssen TradeStack, Timing und Positionsmodell erneut freigeben.",
      "Der Research-Zeitpunkt ist nicht der Kurszeitpunkt. Die Entscheidung basiert auf dem angegebenen gespeicherten Snapshot.",
      ...(stale ? ["Der Snapshot ist ungültig, zukünftig oder älter als 24 Stunden."] : []),
      ...(report.historicalEvidence ? [`Historischer Datenstand ${report.historicalEvidence.asOfDate ?? "unbekannt"}; deskriptiv, kein unabhängiger Prognosenachweis.`] : ["Keine historischen Vergleichsdaten im Bericht verfügbar."]),
    ],
  };
}
