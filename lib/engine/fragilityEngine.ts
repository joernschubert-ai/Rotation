// /lib/engine/fragilityEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

/* =====================================================
TYPES
===================================================== */

export interface FragilityEngineInput {
  history?: any[];
  historyMetrics?: any;
  crash?: any;

  breadth50?: number;
  breadth200?: number;

  gammaExposure?: number;
  correlationScore?: number;
  vix?: number;
  volOfVolRatio?: number;
  vixTermRatio?: number;

  liquidity?: any;
  structure?: any;
  participation?: any;
  breadthThrust?: any;
  rotation?: any;
  marketQuality?: any;
}

export interface FragilityEngineOutput {
  score: number;
  diagnostics: Record<string, any>;

  state:
    | "RESILIENT"
    | "STRETCHED"
    | "FRAGILE"
    | "STRUCTURALLY_UNSTABLE"
    | "BREAKDOWN_RISK";

  escalation: boolean;
  breakdownRisk: number;
  liquidityFragility: number;

  liquidityIllusion: boolean;
  passiveFragility: boolean;
  dealerCompression: boolean;

  structuralGammaFloor: number;
  effectiveGamma: number;

  summary: string;

  components: {
    coreStructuralRisk: number;
    structuralOverlay: number;
    liquidityOverlay: number;
    gammaOverlay: number;
    volatilityOverlay: number;
    historyOverlay: number;
    unclampedScore: number;
    saturated: boolean;
  };

  metrics: {
    crashProbability: number;
    breadth50: number;
    breadth200: number;

    gamma: number;
    effectiveGamma: number;
    structuralGammaFloor: number;

    correlation: number;
    vix: number;
    volOfVol: number;
    vixTerm: number;
    liquidity: number;

    participationScore: number;
    breadthThrustScore: number;
    rotationScore: number;
    rotationDecayScore: number;
    marketQualityScore: number;

    participationTrend: number;
    breadthTrend: number;
    liquidityTrend: number;
    marketQualityTrend: number;

    participationErosion: boolean;
    breadthErosion: boolean;
    liquidityErosion: boolean;
    qualityErosion: boolean;
    persistentErosion: boolean;

    narrowLeadership: boolean;
    severeNarrowLeadership: boolean;
    megaCapOnlyTape: boolean;
    equalWeightWeakness: boolean;
    smallCapWeakness: boolean;

    internalSynchronization: boolean | null;

    liquidityDependence: boolean;
    liquidityIllusion: boolean;
    latentFragility: boolean;
    passiveFragility: boolean;
    dealerCompression: boolean;

    phasePersistence: number;
    daysInPhase: number;
    institutionalPressure: number;
    participationDecay: number;
    breadthTrendHistory: number;
    breadthAcceleration: number;
    crashTrend: number;
    relativeBreadthWeakness: number;
    averageFragility: number;

    persistentDistribution: boolean;
    prolongedBearRegime: boolean;
    acceleratingWeakness: boolean;
  };
}

/* =====================================================
HELPERS
===================================================== */

function clamp(
  value: number,
  min = 0,
  max = 100
) {
  return Math.max(min, Math.min(max, value));
}

function numericValue(value: any): number | null {
  const candidates =
    value && typeof value === "object"
      ? [value.value, value.score, value.current]
      : [value];

  for (const candidate of candidates) {
    if (
      typeof candidate !== "number" &&
      typeof candidate !== "string"
    ) {
      continue;
    }

    if (
      typeof candidate === "string" &&
      candidate.trim() === ""
    ) {
      continue;
    }

    const parsed = Number(candidate);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function safeNumber(
  value: any,
  fallback = 0
) {
  return numericValue(value) ?? fallback;
}

function getHistoryValue(
  snapshot: any,
  keys: string[],
  fallback: number
) {
  if (!snapshot) {
    return fallback;
  }

  for (const key of keys) {
    let value = snapshot;

    for (const part of key.split(".")) {
      value = value?.[part];
    }

    const numeric = numericValue(value);

    if (numeric !== null) {
      return numeric;
    }
  }

  return fallback;
}

/*
 * Constructive score -> risk:
 * 100 constructive -> 0 risk
 * 50 constructive -> 50 risk
 * 0 constructive -> 100 risk
 */
function riskFromConstructive(value: number) {
  return 100 - clamp(value);
}

function weightedAverage(
  values: Array<{
    value: number;
    weight: number;
  }>
) {
  let numerator = 0;
  let denominator = 0;

  for (const item of values) {
    const value =
      clamp(safeNumber(item.value, 50));

    const weight =
      Math.max(0, safeNumber(item.weight, 0));

    numerator += value * weight;
    denominator += weight;
  }

  if (denominator <= 0) {
    return 50;
  }

  return numerator / denominator;
}

/* =====================================================
ENGINE
===================================================== */

export function fragilityEngine(
  input: FragilityEngineInput
): FragilityEngineOutput {
  input = input ?? {};
  /* =====================================================
  CURRENT DATA
  ===================================================== */

  const crashProbability =
    clamp(safeNumber(input.crash?.probability, 0));

  const breadth50 = clamp(
    safeNumber(
      input.breadth50 ??
      input.structure?.breadth?.b50,
      50
    )
  );

  const breadth200 = clamp(
    safeNumber(
      input.breadth200 ??
      input.structure?.breadth?.b200,
      50
    )
  );

  const rawGamma =
    safeNumber(input.gammaExposure, 0);
  const measuredGamma = numericValue(input.gammaExposure);

  const correlation =
    safeNumber(input.correlationScore, 0);

  const vix =
    safeNumber(input.vix, 20);

  const volOfVol =
    safeNumber(input.volOfVolRatio, 1);

  const rawVixTerm =
    safeNumber(input.vixTermRatio, 1);

  const vixTerm =
    rawVixTerm > 0 ? rawVixTerm : 1;

  // Backend contract: VIX / VIX3M.
  const termStress =
    vixTerm >= 1.05;

  const liquidity = clamp(
    safeNumber(
      input.liquidity?.score ??
      input.liquidity?.metrics?.liquidity ??
      input.liquidity?.liquidity,
      50
    )
  );

  const participationScore =
    clamp(safeNumber(input.participation?.score, 50));

  const breadthThrustScore =
    clamp(safeNumber(input.breadthThrust?.score, 50));

  const rotationScore =
    clamp(safeNumber(input.rotation?.score, 50));

  const rotationDecayScore = clamp(
    safeNumber(
      input.rotation?.decayScore ??
      input.rotation?.rotationDecayScore,
      0
    )
  );

  const rotationDecayState =
    input.rotation?.rotationDecayState ??
    input.rotation?.state ??
    "HEALTHY_ROTATION";

  const rsSmall =
    safeNumber(input.rotation?.rsSmall, 1);

  const rsGrowth =
    safeNumber(input.rotation?.rsGrowth, 1);

  const rsEqual =
    safeNumber(input.rotation?.rsEqual, 1);

  const marketQualityScore =
    clamp(safeNumber(input.marketQuality?.score, 50));

  /* =====================================================
  SYNCHRONIZATION DATA
  ===================================================== */

  const internalSynchronization =
    input.marketQuality?.internalSynchronization;

  const hasSynchronizationData =
    typeof internalSynchronization === "boolean";

  /* =====================================================
  HISTORY
  ===================================================== */

  const history =
    Array.isArray(input.history) ? input.history : [];

  const historyMetrics =
    input.historyMetrics ?? {};

  const h10 =
    history.length > 10
      ? history[history.length - 1 - 10]
      : null;

  const h20 =
    history.length >= 20
      ? history[history.length - 20]
      : null;

  void h20;

  /* =====================================================
  CURRENT TRENDS

  Preserve existing comparison position and fallbacks.
  Support current nested snapshots and legacy flat fields.
  ===================================================== */

  const historicalParticipation = getHistoryValue(
    h10?.participation?.diagnostics?.aggregationPolicy === "STRONGEST_SHARED_LEADERSHIP_PENALTY" ? h10 : null,
    [
      "participationScore",
      "participation.score",
      "participation"
    ],
    participationScore
  );

  const historicalBreadth = getHistoryValue(
    h10,
    [
      "breadth50",
      "structure.breadth.b50",
      "breadth.b50",
      "breadth"
    ],
    breadth50
  );

  const historicalLiquidity = getHistoryValue(
    h10,
    [
      "liquidityScore",
      "liquidity.score",
      "marketLiquidityScore",
      "liquidity"
    ],
    liquidity
  );

  const historicalQuality = getHistoryValue(
    h10?.marketQuality?.diagnostics?.aggregationPolicy === "WEIGHTED_INTEGRITY_WITHOUT_SHARED_WARNING_OVERLAYS" ? h10 : null,
    [
      "marketQualityScore",
      "marketQuality.score"
    ],
    marketQualityScore
  );

  const participationTrend =
    participationScore - historicalParticipation;

  const breadthTrend =
    breadth50 - historicalBreadth;

  const liquidityTrend =
    liquidity - historicalLiquidity;

  const marketQualityTrend =
    marketQualityScore - historicalQuality;

  /* =====================================================
  HISTORY METRICS
  ===================================================== */

  const phasePersistence =
    safeNumber(historyMetrics.phasePersistence, 0);

  const daysInPhase =
    safeNumber(historyMetrics.daysInPhase, 0);

  const institutionalPressure =
    clamp(safeNumber(historyMetrics.institutionalPressure, 0));

  const participationDecayHistory =
    safeNumber(historyMetrics.participationDecay, 0);

  const breadthTrendHistory =
    safeNumber(historyMetrics.breadthTrend, 0);

  const breadthAcceleration =
    safeNumber(historyMetrics.breadthAcceleration, 0);

  const crashTrend =
    safeNumber(historyMetrics.crashTrend, 0);

  const relativeBreadthWeakness =
    safeNumber(historyMetrics.relativeBreadthWeakness, 0);

  const averageFragility =
    clamp(safeNumber(historyMetrics.averageFragility, 50));

  const prolongedBearRegime =
    historyMetrics.prolongedBearRegime === true;

  const persistentDistribution =
    historyMetrics.persistentDistribution === true;

  const acceleratingWeakness =
    historyMetrics.acceleratingWeakness === true;

  /* =====================================================
  MARKET STRUCTURE FLAGS
  ===================================================== */

  const structureFlags = getMarketStructureFlags({
    rsGrowth,
    rsSmall,
    rsEqual,
    breadth50,
    breadth200,
    participationScore
  });

  const {
    narrowLeadership,
    severeNarrowLeadership,
    megaCapOnlyTape,
    equalWeightWeakness,
    smallCapWeakness
  } = structureFlags;

  /* =====================================================
  STRUCTURAL GAMMA FLOOR

  Diagnostic volatility-suppression floor.
  It is not measured dealer gamma or a direct crash signal.
  ===================================================== */

  let structuralGammaFloor = 0;

  if (
    vix < 20 &&
    !termStress
  ) {
    structuralGammaFloor = 35;
  }

  if (
    vix < 18 &&
    !termStress &&
    narrowLeadership
  ) {
    structuralGammaFloor = 45;
  }

  if (
    vix < 17 &&
    !termStress &&
    narrowLeadership &&
    breadth50 < 55
  ) {
    structuralGammaFloor = 55;
  }

  if (measuredGamma === null || rawGamma < 0) structuralGammaFloor = 0;
  const effectiveGamma =
    rawGamma < 0 ? rawGamma : Math.max(rawGamma, structuralGammaFloor);

  /* =====================================================
  STRUCTURAL CONDITIONS
  ===================================================== */

  const weakParticipation =
    participationScore < 48 ||
    breadth50 < 48;

  const severeParticipationFailure =
    participationScore < 38 &&
    breadth50 < 40;

  const weakRotation =
    rotationScore < 45 ||
    rotationDecayScore >= 45;

  const failedRotation =
    rotationScore < 35 ||
    rotationDecayScore >= 65 ||
    rotationDecayState === "ROTATION_FAILURE" ||
    rotationDecayState === "INTERNAL_BREAKDOWN";

  const weakBreadthStructure =
    breadth50 < 45 ||
    breadth200 < 42 ||
    breadthThrustScore < 42;

  const severeBreadthFailure =
    breadth50 < 35 &&
    breadth200 < 35 &&
    breadthThrustScore < 35;

  /* =====================================================
  SYNCHRONIZATION
  ===================================================== */

  const synchronizationFailure =
    weakParticipation && weakRotation && weakBreadthStructure;

  /* =====================================================
  LIQUIDITY CONDITIONS
  ===================================================== */

  const liquidityDependence =
    liquidity >= 65 &&
    (
      weakParticipation ||
      narrowLeadership
    );

  const liquidityIllusion =
    liquidity >= 68 &&
    (
      weakParticipation ||
      failedRotation ||
      megaCapOnlyTape
    );

  const latentFragility =
    vix < 20 &&
    liquidity >= 60 &&
    (
      weakParticipation ||
      failedRotation ||
      narrowLeadership ||
      synchronizationFailure
    );

  const passiveFragility =
    vix < 18 &&
    liquidity >= 65 &&
    (
      weakParticipation ||
      narrowLeadership ||
      failedRotation
    );

  const dealerCompression =
    effectiveGamma > 35 &&
    vix < 18 &&
    correlation < 3 &&
    (
      weakParticipation ||
      narrowLeadership
    );

  /* =====================================================
  HISTORICAL EROSION
  ===================================================== */

  const participationErosion =
    participationTrend < -8;

  const breadthErosion =
    breadthTrend < -8;

  const liquidityErosion =
    liquidityTrend < -10;

  const qualityErosion =
    marketQualityTrend < -10;

  const persistentErosion =
    (
      participationErosion &&
      breadthErosion
    ) ||
    (
      breadthErosion &&
      qualityErosion
    );

  /* =====================================================
  CORE RISK COMPONENTS
  ===================================================== */

  const participationRisk =
    riskFromConstructive(participationScore);

  const breadth50Risk =
    riskFromConstructive(breadth50);

  const breadth200Risk =
    riskFromConstructive(breadth200);

  const breadthThrustRisk =
    riskFromConstructive(breadthThrustScore);

  const breadthRisk = weightedAverage([
    { value: breadth50Risk, weight: 0.45 },
    { value: breadth200Risk, weight: 0.20 },
    { value: breadthThrustRisk, weight: 0.35 }
  ]);

  const rotationDirectionRisk =
    riskFromConstructive(rotationScore);

  const normalizedRotationDecayRisk =
    clamp(rotationDecayScore);

  const rotationRisk = weightedAverage([
    { value: rotationDirectionRisk, weight: 0.70 },
    { value: normalizedRotationDecayRisk, weight: 0.30 }
  ]);

  const marketQualityRisk =
    riskFromConstructive(marketQualityScore);

  const liquidityRisk =
    riskFromConstructive(liquidity);

  /* =====================================================
  CONCENTRATION RISK
  ===================================================== */

  let concentrationRisk = 0;

  if (narrowLeadership) concentrationRisk += 30;
  if (severeNarrowLeadership) concentrationRisk += 20;
  if (megaCapOnlyTape) concentrationRisk += 25;
  if (equalWeightWeakness) concentrationRisk += 15;
  if (smallCapWeakness) concentrationRisk += 10;

  concentrationRisk = clamp(concentrationRisk);
  const legacyConcentrationRisk = concentrationRisk;
  concentrationRisk = Math.max(
    narrowLeadership ? 30 + (severeNarrowLeadership ? 20 : 0) : 0,
    megaCapOnlyTape ? 25 : 0,
    (equalWeightWeakness ? 15 : 0) + (smallCapWeakness ? 10 : 0)
  );

  /* =====================================================
  CORE STRUCTURAL RISK

  Relative weights retained for the remaining core inputs.
  Excluding derived MarketQuality leaves 85%; normalize that sum.
  ===================================================== */

  const coreStructuralRisk = weightedAverage([
    { value: participationRisk, weight: 0.22 },
    { value: breadthRisk, weight: 0.20 },
    { value: rotationRisk, weight: 0.18 },
    // MarketQuality aggregates these same inputs; diagnostic only.
    { value: liquidityRisk, weight: 0.08 },
    { value: concentrationRisk, weight: 0.10 },
    { value: crashProbability, weight: 0.07 }
  ]);

  /* =====================================================
  STRUCTURAL OVERLAY / 25
  ===================================================== */

  let structuralOverlay = 0;

  if (severeParticipationFailure) {
    structuralOverlay += 5;
  } else if (weakParticipation) {
    structuralOverlay += 2;
  }

  if (failedRotation) {
    structuralOverlay += 4;
  } else if (weakRotation) {
    structuralOverlay += 2;
  }

  if (severeBreadthFailure) {
    structuralOverlay += 5;
  } else if (weakBreadthStructure) {
    structuralOverlay += 2;
  }

  if (synchronizationFailure) structuralOverlay += 3;
  if (persistentErosion) structuralOverlay += 3;
  if (narrowLeadership) structuralOverlay += 2;
  if (megaCapOnlyTape) structuralOverlay += 3;

  structuralOverlay =
    clamp(structuralOverlay, 0, 25);

  /* =====================================================
  LIQUIDITY / PASSIVE OVERLAY / 14
  ===================================================== */

  let liquidityOverlay = 0;

  if (liquidityDependence) liquidityOverlay += 3;
  if (liquidityIllusion) liquidityOverlay += 4;
  if (latentFragility) liquidityOverlay += 2;
  if (passiveFragility) liquidityOverlay += 3;
  if (dealerCompression) liquidityOverlay += 2;

  liquidityOverlay =
    clamp(liquidityOverlay, 0, 14);

  /* =====================================================
  GAMMA OVERLAY / 8
  ===================================================== */

  let gammaOverlay = 0;

  if (
    structuralGammaFloor >= 35 &&
    weakParticipation
  ) {
    gammaOverlay += 2;
  }

  if (
    structuralGammaFloor >= 45 &&
    narrowLeadership
  ) {
    gammaOverlay += 2;
  }

  if (rawGamma < 0) gammaOverlay += 3;
  if (rawGamma < -10) gammaOverlay += 3;

  gammaOverlay =
    clamp(gammaOverlay, 0, 8);
  const estimatedGammaOverlay = gammaOverlay;
  gammaOverlay = measuredGamma !== null && rawGamma < 0
    ? clamp((rawGamma < 0 ? 3 : 0) + (rawGamma < -10 ? 3 : 0), 0, 8)
    : 0;

  /* =====================================================
  VOLATILITY / CORRELATION OVERLAY / 10
  ===================================================== */

  let volatilityOverlay = 0;

  if (correlation > 5) volatilityOverlay += 2;
  if (correlation > 8) volatilityOverlay += 2;
  if (vix > 28) volatilityOverlay += 3;
  if (vix > 35) volatilityOverlay += 3;
  if (volOfVol > 1.4) volatilityOverlay += 2;

  volatilityOverlay =
    clamp(volatilityOverlay, 0, 10);

  /* =====================================================
  HISTORY OVERLAY / 25
  ===================================================== */

  let historyOverlay = 0;

  if (participationErosion) historyOverlay += 2;
  if (breadthErosion) historyOverlay += 2;
  if (liquidityErosion) historyOverlay += 1;
  if (qualityErosion) historyOverlay += 2;
  if (persistentErosion) historyOverlay += 3;

  if (phasePersistence >= 30) historyOverlay += 1;
  if (phasePersistence >= 50) historyOverlay += 2;
  if (daysInPhase >= 40) historyOverlay += 1;
  if (daysInPhase >= 60) historyOverlay += 2;

  if (persistentDistribution) historyOverlay += 2;
  if (prolongedBearRegime) historyOverlay += 2;
  if (institutionalPressure > 60) historyOverlay += 2;
  if (participationDecayHistory > 20) historyOverlay += 1;
  if (breadthTrendHistory < -1) historyOverlay += 1;

  // Negative acceleration indicates accelerating deterioration.
  if (breadthAcceleration < -1) historyOverlay += 2;

  if (relativeBreadthWeakness > 10) historyOverlay += 2;
  if (crashTrend > 5) historyOverlay += 2;
  if (acceleratingWeakness) historyOverlay += 2;
  if (averageFragility > 65) historyOverlay += 2;

  historyOverlay =
    clamp(historyOverlay, 0, 25);
  const legacyHistoryOverlay = historyOverlay;
  // Historical scores from older versions do not independently validate risk.
  // Shared regime-duration flags count as one strongest existing contribution.
  historyOverlay = Math.max(
    persistentDistribution ? 2 : 0,
    prolongedBearRegime ? 2 : 0,
    institutionalPressure > 60 ? 2 : 0,
    acceleratingWeakness ? 2 : 0
  ) + (breadthErosion ? 2 : 0) + (liquidityErosion ? 1 : 0) +
    (participationDecayHistory > 20 ? 1 : 0) +
    (breadthTrendHistory < -1 ? 1 : 0) +
    (breadthAcceleration < -1 ? 2 : 0) +
    (relativeBreadthWeakness > 10 ? 2 : 0) +
    (crashTrend > 5 ? 2 : 0);

  /* =====================================================
  FINAL SCORE

  Shared structural overlays are diagnostics, not additional core evidence.
  Independent stress and grouped history remain score contributions.
  ===================================================== */

  const unclampedScore =
    coreStructuralRisk +
    // Structural flags are already represented by the core inputs.
    Math.max(liquidityDependence ? 3 : 0, liquidityIllusion ? 4 : 0, latentFragility ? 2 : 0, passiveFragility ? 3 : 0, dealerCompression ? 2 : 0) +
    gammaOverlay +
    volatilityOverlay +
    historyOverlay;

  const score =
    clamp(Math.round(unclampedScore));

  /* =====================================================
  STATE
  ===================================================== */

  let state: FragilityEngineOutput["state"];

  if (
    score >= 86 ||
    (
      severeParticipationFailure &&
      failedRotation &&
      severeBreadthFailure
    )
  ) {
    state = "BREAKDOWN_RISK";
  } else if (
    score >= 68 ||
    liquidityIllusion ||
    (
      passiveFragility &&
      synchronizationFailure
    ) ||
    (
      liquidityDependence &&
      synchronizationFailure
    )
  ) {
    state = "STRUCTURALLY_UNSTABLE";
  } else if (
    score >= 48 ||
    (
      weakParticipation &&
      narrowLeadership
    )
  ) {
    state = "FRAGILE";
  } else if (
    score >= 32 ||
    weakRotation
  ) {
    state = "STRETCHED";
  } else {
    state = "RESILIENT";
  }

  /* =====================================================
  ESCALATION
  ===================================================== */

  const escalation =
    state === "BREAKDOWN_RISK" ||
    (
      rawGamma < 0 &&
      vix > 28 &&
      liquidity < 35
    ) ||
    (
      failedRotation &&
      severeParticipationFailure
    ) ||
    (
      liquidityIllusion &&
      synchronizationFailure
    );

  /* =====================================================
  BREAKDOWN RISK
  ===================================================== */

  let breakdownRisk = 0;

  if (severeParticipationFailure) breakdownRisk += 18;
  if (severeBreadthFailure) breakdownRisk += 18;
  if (failedRotation) breakdownRisk += 15;
  if (megaCapOnlyTape) breakdownRisk += 8;
  if (liquidityDependence) breakdownRisk += 7;
  if (liquidityIllusion) breakdownRisk += 10;
  if (passiveFragility) breakdownRisk += 8;
  if (dealerCompression) breakdownRisk += 5;
  if (synchronizationFailure) breakdownRisk += 8;
  if (marketQualityScore < 35) breakdownRisk += 10;
  if (persistentErosion) breakdownRisk += 10;

  if (
    participationErosion &&
    breadthErosion
  ) {
    breakdownRisk += 6;
  }

  if (persistentDistribution) breakdownRisk += 6;
  if (prolongedBearRegime) breakdownRisk += 5;
  if (institutionalPressure > 60) breakdownRisk += 4;
  if (acceleratingWeakness) breakdownRisk += 6;

  breakdownRisk =
    clamp(Math.round(breakdownRisk));

  /* =====================================================
  LIQUIDITY FRAGILITY
  ===================================================== */

  let liquidityFragility =
    Math.round((100 - liquidity) * 0.45);

  if (liquidityDependence) liquidityFragility += 12;
  if (liquidityIllusion) liquidityFragility += 16;
  if (passiveFragility) liquidityFragility += 8;

  if (
    liquidity >= 65 &&
    marketQualityScore < 42
  ) {
    liquidityFragility += 6;
  }

  liquidityFragility =
    clamp(liquidityFragility);

  /* =====================================================
  SUMMARY
  ===================================================== */

  let summary =
    "Structurally resilient market environment";

  if (state === "STRETCHED") {
    summary =
      "Market structure increasingly stretched beneath the surface";
  }

  if (state === "FRAGILE") {
    summary =
      "Fragile institutional structure with weakening resilience";
  }

  if (state === "STRUCTURALLY_UNSTABLE") {
    summary =
      "Structurally unstable market dependent on narrowing support";
  }

  if (state === "BREAKDOWN_RISK") {
    summary =
      "High structural breakdown risk across institutional internals";
  }

  if (liquidityIllusion) {
    summary += " | Liquidity illusion";
  }

  if (passiveFragility) {
    summary += " | Passive fragility";
  }

  if (dealerCompression) {
    summary += " | Dealer compression";
  }

  if (megaCapOnlyTape) {
    summary += " | Mega-cap concentration";
  }

  /* =====================================================
  RETURN
  ===================================================== */

  return {
    score,
    state,
    escalation,
    breakdownRisk,
    liquidityFragility,

    liquidityIllusion,
    passiveFragility,
    dealerCompression,

    structuralGammaFloor,
    effectiveGamma,
    summary,
    diagnostics: { aggregationPolicy: "CORE_WITHOUT_DERIVED_QUALITY_OR_REPEATED_STRUCTURAL_OVERLAYS", marketQualityRiskDiagnostic: marketQualityRisk, marketQualityUsedForCoreScore: false, structuralOverlayDiagnostic: structuralOverlay, estimatedGammaOverlayDiagnostic: estimatedGammaOverlay, legacyConcentrationRisk, concentrationRisk, legacyHistoryOverlay, historicalModelScoreLevelsUsedForScoring: false, coreWeightSumBeforeNormalization: 0.85, weightsCalibratedByThisAudit: false },

    components: {
      coreStructuralRisk,
      structuralOverlay: 0,
      liquidityOverlay: Math.max(liquidityDependence ? 3 : 0, liquidityIllusion ? 4 : 0, latentFragility ? 2 : 0, passiveFragility ? 3 : 0, dealerCompression ? 2 : 0),
      gammaOverlay,
      volatilityOverlay,
      historyOverlay,
      unclampedScore,
      saturated: Math.round(unclampedScore) >= 100
    },

    metrics: {
      crashProbability,
      breadth50,
      breadth200,

      gamma: rawGamma,
      effectiveGamma,
      structuralGammaFloor,

      correlation,
      vix,
      volOfVol,
      vixTerm,
      liquidity,

      participationScore,
      breadthThrustScore,
      rotationScore,
      rotationDecayScore,
      marketQualityScore,

      participationTrend,
      breadthTrend,
      liquidityTrend,
      marketQualityTrend,

      participationErosion,
      breadthErosion,
      liquidityErosion,
      qualityErosion,
      persistentErosion,

      narrowLeadership,
      severeNarrowLeadership,
      megaCapOnlyTape,
      equalWeightWeakness,
      smallCapWeakness,

      internalSynchronization:
        hasSynchronizationData
          ? Boolean(internalSynchronization)
          : null,

      liquidityDependence,
      liquidityIllusion,
      latentFragility,
      passiveFragility,
      dealerCompression,

      phasePersistence,
      daysInPhase,
      institutionalPressure,

      participationDecay: participationDecayHistory,
      breadthTrendHistory,
      breadthAcceleration,
      crashTrend,
      relativeBreadthWeakness,
      averageFragility,

      persistentDistribution,
      prolongedBearRegime,
      acceleratingWeakness
    }
  };
}
