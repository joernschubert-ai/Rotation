type CountertrendInput = {
  phase?: string;
  crash?: any;
  executionState?: any;
  indices?: any;
  structure?: any;
  marketData?: any;
  volatilityDataQuality?: any;
  futures?: any;
};

const finite = (value: any): number | null => {
  if (value === null || value === undefined || typeof value === "boolean" || (typeof value === "string" && value.trim() === "")) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * Early countertrend context is deliberately separate from structural trend
 * confirmation. It uses dated cash observations for a turn, and treats
 * breadth/VIX as distinct corroborating families. Futures are context only.
 * No result is a probability or a validated trading edge.
 */
export function nasdaqCountertrendOpportunity(input: CountertrendInput) {
  const phase = input.phase ?? "UNKNOWN";
  const metrics = input.indices?.ndx?.priceMetrics ?? {};
  const quality = metrics.dataQuality ?? {};
  const return1D = finite(metrics.return1D);
  const return3D = finite(metrics.return3D);
  const return20D = finite(metrics.return20D);
  const cashDate = typeof quality.asOfDate === "string" ? quality.asOfDate :
    typeof quality.referenceDate === "string" ? quality.referenceDate :
    typeof quality.currentObservationTimestamp === "string" ? quality.currentObservationTimestamp.slice(0, 10) : null;
  const dailyDataValid = quality.source === "INDEX_DAILY_CLOSE_BARS" &&
    quality.latestEndpointAvailable === true && quality.stale !== true &&
    return1D !== null && return3D !== null;

  const structuralWeakness = ["PHASE_3_DISTRIBUTION", "PHASE_4_RISK", "PHASE_5_BREAKDOWN", "PHASE_6_ACCELERATION", "PHASE_7_CAPITULATION"].includes(phase) ||
    (return20D !== null && return20D < 0);
  const priceTurn = dailyDataValid && structuralWeakness &&
    (return1D! > 0 || return3D! > 0);

  const b20 = finite(input.structure?.breadth?.b20?.value ?? input.structure?.breadth?.b20);
  const b50 = finite(input.structure?.breadth?.b50?.value ?? input.structure?.breadth?.b50);
  const ad = finite(input.structure?.advanceDecline?.value ?? input.structure?.advanceDecline);
  const highs = finite(input.structure?.highsLows?.highs);
  const lows = finite(input.structure?.highsLows?.lows);
  const breadthAvailable = b20 !== null && b50 !== null;
  const participationSupport = breadthAvailable && b20! >= 50 &&
    (b50! >= 50 || (ad !== null && ad > 0) || (highs !== null && lows !== null && highs > lows));

  const vixSource = input.marketData?.["^VIX"] ?? {};
  const vixQuality = vixSource.dataQuality ?? input.volatilityDataQuality ?? {};
  const vix = finite(vixSource.current);
  const vixReturn1D = finite(vixSource.change ?? vixSource.return1D);
  const vixDailyValid = (vixQuality.latestEndpointAvailable === true || vixQuality.available === true) && vixQuality.stale !== true &&
    vix !== null && vixReturn1D !== null;
  const volatilityRelief = vixDailyValid && vixReturn1D! < 0;

  const nq = input.futures?.nq ?? {};
  const futuresAvailable = nq.dataQuality?.currentContextAvailable === true &&
    finite(nq.dailyChangePct) !== null && typeof nq.quoteTimestamp === "string";
  const futuresMovePct = futuresAvailable ? finite(nq.dailyChangePct) : null;
  const futuresContext = !futuresAvailable ? "UNAVAILABLE" :
    futuresMovePct! > 0 ? "UP" : futuresMovePct! < 0 ? "DOWN" : "FLAT";

  const families = [
    priceTurn ? "PRICE_TURN" : null,
    participationSupport ? "PARTICIPATION" : null,
    volatilityRelief ? "VIX_RELIEF" : null,
  ].filter(Boolean) as string[];

  const riskState = input.executionState?.riskState ?? "UNKNOWN";
  const crashProbability = finite(input.crash?.probability);
  const hardRiskBlock = ["PHASE_5_BREAKDOWN", "PHASE_6_ACCELERATION", "PHASE_7_CAPITULATION"].includes(phase) ||
    ["CRISIS", "BREAKDOWN", "INTERNAL_BREAKDOWN", "UNKNOWN"].includes(riskState) ||
    (crashProbability !== null && crashProbability >= 55);
  const starterReady = priceTurn && families.length >= 2 && !hardRiskBlock;
  const status = !dailyDataValid ? "DATA_UNAVAILABLE" : hardRiskBlock ? "BLOCKED" :
    starterReady ? "SMALL_STARTER" : families.length > 0 ? "WATCH" : "NONE";

  const evidence: string[] = [];
  if (priceTurn) evidence.push(`Schlusskursimpuls: 1T ${return1D!.toFixed(2)}%, 3T ${return3D!.toFixed(2)}%`);
  if (participationSupport) evidence.push(`Marktbreite: 20T ${b20!.toFixed(0)}%, 50T ${b50!.toFixed(0)}%`);
  if (volatilityRelief) evidence.push(`VIX fällt: ${vixReturn1D!.toFixed(2)}% am letzten Datenstand`);
  if (vix !== null) evidence.push(`VIX ${vix.toFixed(2)}${vix >= 25 ? " · erhöht" : ""}`);
  if (futuresAvailable) evidence.push(`NQ-Future ${futuresMovePct! > 0 ? "+" : ""}${futuresMovePct!.toFixed(2)}% · ${nq.quoteTimestamp}`);
  if (phase === "PHASE_4_RISK" && starterReady) evidence.push("Phase 4: Starter bleibt auf 5 Größenpunkte begrenzt");
  if (hardRiskBlock) evidence.push("Krisen-/Breakdown-Sperre aktiv");

  return {
    version: "NASDAQ_COUNTERTREND_OPPORTUNITY_V1",
    status,
    asOf: cashDate,
    supportedFamilies: families,
    familyCount: families.length,
    evidence,
    inputs: {
      dailyDataValid,
      return1D,
      return3D,
      return20D,
      breadth20: b20,
      breadth50: b50,
      advanceDecline: ad,
      vix,
      vixReturn1D: vixDailyValid ? vixReturn1D : null,
      futuresAvailable,
      futuresMovePct,
      futuresAsOf: futuresAvailable ? nq.quoteTimestamp : null,
      futuresContext,
    },
    structuralContext: { phase, riskState, crashProbability, structuralWeakness },
    policy: "WATCH_WITH_ONE_FAMILY_SMALL_STARTER_WITH_PRICE_TURN_AND_ONE_SEPARATE_CONFIRMING_FAMILY_MAX_SIZE_5; FUTURES_CONTEXT_ONLY; NO_CALIBRATED_PROBABILITY",
    limits: "Early countertrend candidate only. Not a floor, forecast, option recommendation, or validated win rate. Existing trend confirmation remains separate.",
  };
}
