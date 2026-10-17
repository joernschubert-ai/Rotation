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
  if (horizon === "WEEK") return typeof group.weeklyFact === "string" ? "Eine Woche: " + group.weeklyFact : "Eine Woche: Veränderung nicht verfügbar.";
  if (horizon === "FOUR_WEEKS") return typeof group.change4WFact === "string" ? "Vier Wochen: " + group.change4WFact : "Vier Wochen: Veränderung nicht verfügbar.";
  if (horizon === "THIRTEEN_WEEKS") return typeof group.change13WFact === "string" ? "13 Wochen: " + group.change13WFact : "13 Wochen: Veränderung nicht verfügbar.";
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

export const TIMING_FOCUS = ["ALREADY_MOVED", "EARLY_DIVERGENCE", "WAIT_FOR_TURN", "DIRECTION_CONFIRMED", "DATA_INCOMPLETE"] as const;
export const STRUCTURE_FOCUS = ["BREADTH", "PARTICIPATION", "PHASE", "QUALITY"] as const;
const record = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
export function renderReviewedContext(instrument: string, timing: unknown, structureFocus: unknown, risk: unknown, evidence: SynthesisEvidence[]) {
  const names: Record<string,string> = {NASDAQ_PUT:"Nasdaq Put", NASDAQ_CALL:"Nasdaq Call", RUSSELL_CALL:"Russell Call"};
  const timingLabels: Record<string,string> = {
    ALREADY_MOVED:"Die bereits gelaufene Bewegung begrenzt nach Einschätzung der KI die frühe Gelegenheit.",
    EARLY_DIVERGENCE:"Die KI nennt eine frühe Divergenzhypothese. Ohne bezeichneten zeitgleichen Verlaufvergleich ist keine beobachtete Divergenz festgestellt.",
    WAIT_FOR_TURN:instrument === "NASDAQ_PUT" ? "Die KI wartet auf erneute eigene Abwärtsbestätigung, etwa nach einer scheiternden Erholung; deren Eintritt ist damit nicht behauptet." : "Die KI wartet auf eine eigene Aufwärtswende; diese wird hier nicht als bereits erfolgt behauptet.",
    DIRECTION_CONFIRMED:"Die KI ordnet die eigene Preisrichtung als bestätigt ein; die Richtungsprüfung erfolgt zusätzlich anhand der gelieferten Kurse.",
    DATA_INCOMPLETE:"Die KI hält die Datenbasis für diese These für unvollständig."
  };
  const structures = record(evidence.find(item=>item.id==="APP")?.data.instrumentStructure);
  const own = record(structures[instrument==="RUSSELL_CALL"?"RUSSELL_2000":"NASDAQ"]);
  const value = (raw: unknown) => {const v=typeof raw==="object"?record(raw).value:raw;return typeof v==="number"&&Number.isFinite(v)?v.toLocaleString("de-DE",{maximumFractionDigits:2}):"unbekannt";};
  const references: Record<string,string> = {
    BREADTH: "Eigene Breite über den Durchschnitten (20/50/200 Tage): "+["b20","b50","b200"].map(key=>value(record(own.breadth)[key])).join(" / ")+" Prozent.",
    PARTICIPATION:"Eigene Participation: "+value(own.participation)+" von hundert.",
    QUALITY:"Eigene Marktqualität: "+value(own.quality)+" von hundert.",
    PHASE:"Eigene Phase: "+(typeof own.phase==="string"?own.phase:"unbekannt")+"."
  };
  const risks: Record<string,string> = {
    REBOUND:"Eine Erholung des eigenen Index würde gegen die Put-Richtung wirken. Die tatsächliche historische Vergleichsstudie ist gesondert zu beurteilen.",
    FAILED_CONTINUATION:"Eine scheiternde Abwärtsfortsetzung mit eigener Kurserholung würde die Put-Hypothese schwächen.",
    FURTHER_DOWNSIDE:"Weitere Verluste des eigenen Index würden gegen die Call-Richtung wirken. Ein bloßer historischer Erholungsmittelwert schützt davor nicht.",
    FAILED_REBOUND:"Eine gescheiterte Erholung und erneute eigene Kursschwäche würden die Call-Hypothese schwächen.",
    NO_CLEAR_EDGE:"Der stärkste Einwand ist ein nicht belegter Vorteil nach Kosten, Volatilität und bereits erfolgter Bewegung.",
    DATA_LIMITATIONS:"Fehlende oder zeitlich nicht passende Daten begrenzen die These; historische Indexvergleiche ersetzen keine Produktbewertung."
  };
  return {whyNow:names[instrument]+": Von der KI gewählter Anlass: "+(timingLabels[String(timing)]??"Unbekannt.")+" Faktenbezug: "+(references[String(structureFocus)]??"Unbekannt."),
    counterargument:"Von der KI gewähltes Gegenszenario: "+(risks[String(risk)]??"Unbekannt.")};
}
export function buildCompactResearchInput(evidence: SynthesisEvidence[]) {
  const frames=buildReasoningFrames(evidence), briefs=buildInstrumentBriefs(evidence);
  const app=record(evidence.find(item=>item.id==="APP")?.data), history=record(evidence.find(item=>item.id==="HISTORY")?.data);
  return {
    markets:[frames[0],frames[2]].map((frame,index)=>({
      market:index===0?"NASDAQ":"RUSSELL_2000", currentIndexReturnsPct:briefs[index===0?0:2].price,
      ownStructure:frame.ownStructure,
      history20DayStudies:frame.historyChoices.map(({directionEffect,...study})=>study),
      cotObservationAndChanges:frame.cot,
      cotUseLimits:{role:"POSITIONING_CONTEXT_NOT_VALIDATED_DIRECTIONAL_SIGNAL",grossTransactionChangesKnown:false,
        note:"Changes in net positioning do not by themselves establish a Put/Call advantage. Contrarian interpretations need a stated mechanism and relevant evidence; preserve uncertainty."},
    })),
    instrumentTasks:frames.map(frame=>({instrument:frame.instrument,market:frame.instrument==="RUSSELL_CALL"?"RUSSELL_2000":"NASDAQ",
      desiredIndexDirection:frame.instrument==="NASDAQ_PUT"?"DOWN":"UP", riskChoices:frame.riskMechanisms,
      historicalDirectionFacts:frame.historyChoices.map(study=>({studyId:study.id,
        meaning:study.directionEffect==="SUPPORTS_DIRECTION"?"Der historische Indexmittelwert passt zur gewünschten Instrumentrichtung, beweist aber keinen heutigen Vorteil.":study.directionEffect==="OPPOSES_DIRECTION"?"Der historische Indexmittelwert wirkt gegen die gewünschte Instrumentrichtung; andere begründete Faktoren müssten eine Gegenhypothese tragen.":"Aus dem historischen Indexmittelwert ist keine Richtungsaussage verfügbar."}))})),
    sharedContext:{credit:app.credit, volatility:app.volatility, crash:app.crash, squeeze:app.squeeze, appPermissions:app.flows,
      historicalComparisons:history.comparisons, historyAsOf:history.asOf,
      news:evidence.filter(item=>item.kind==="NEWS").map(item=>({id:item.id,...item.data}))},
    interpretationLimits:"Index returns, not options returns. COT changes are lagged context without validated directional rule. Headlines are not verified articles. No live chart zones or combined edge study supplied."
  };
}

/** Known shortcut claims only; this is not a complete semantic truth judge. */
export function inspectPositioningInterpretation(instrument: string, prose: unknown, cotContext = false): string[] {
  if (typeof prose !== "string") return [];
  const issues: string[] = [];
  for (const sentence of prose.split(/[.!?;]/u)) {
    if (!cotContext && !/cot|netto|überhang|positionierung/iu.test(sentence)) continue;
    const justifiedMechanism = /weil|vorausgesetzt|nur zusammen|zusammen mit|bei gleichzeitig|sofern|falls|wenn/iu.test(sentence);
    const negatedShortcut = /kein(?:e|en)? (?:direktes? |automatisches? |belegtes? )?(?:signal|vorteil|chance)|nicht (?:allein|automatisch|zwangsläufig)|beweist (?:keinen|nicht)|lässt (?:sich )?keine/iu.test(sentence);
    if (!justifiedMechanism && !negatedShortcut && /was[^.!?]{0,35}(?:chance für (?:einen? )?(?:put|call)|(?:für|gegen) (?:einen? )?(?:put|call)[^.!?]{0,25}spricht)/iu.test(sentence)) issues.push("COT_DIRECTIONAL_SHORTCUT_WITHOUT_MECHANISM");
    const productOrExtensionArgument = /implizit|zeitwert|optionspreis|bereits gelaufen|schon gelaufen|kein gegenargument|nicht (?:als )?(?:risiko|gegenargument)/iu.test(sentence);
    if (!productOrExtensionArgument) {
      if (instrument !== "NASDAQ_PUT" && /(?:risiko|gegenargument)[^.!?]{0,55}(?:rallye|kurserholung|kursanstieg)|(?:rallye|kurserholung|kursanstieg)[^.!?]{0,40}(?:risiko|gegenargument)/iu.test(sentence)) issues.push("UPSIDE_ALONE_IS_NOT_CALL_RISK");
      if (instrument === "NASDAQ_PUT" && /(?:risiko|gegenargument)[^.!?]{0,55}(?:kursrückgang|korrektur)|(?:kursrückgang|korrektur)[^.!?]{0,40}(?:risiko|gegenargument)/iu.test(sentence)) issues.push("DOWNSIDE_ALONE_IS_NOT_PUT_RISK");
    }
  }
  return [...new Set(issues)];
}
