// /lib/engine/masterScoreEngine.ts

/*
 * Master Score:
 * LOW = constructive / CALL
 * HIGH = defensive / PUT
 *
 * Structural risk score.
 * Not a probability or entry-timing score.
 */

function numeric(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const n = Number(value);

    return Number.isFinite(n) ? n : null;
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const object = value as Record<string, unknown>;

    for (const key of ["value", "score", "current"]) {
      const candidate = object[key];

      if (
        typeof candidate === "number" ||
        typeof candidate === "string"
      ) {
        const n = numeric(candidate);

        if (n !== null) {
          return n;
        }
      }
    }
  }

  return null;
}

function first(...values: unknown[]): number | null {
  for (const value of values) {
    const n = numeric(value);

    if (n !== null) {
      return n;
    }
  }

  return null;
}

function num(
  value: unknown,
  fallback = 0
): number {
  return numeric(value) ?? fallback;
}

function clamp(
  value: number,
  min = 0,
  max = 100
): number {
  return Math.max(min, Math.min(max, value));
}

function weightedAverage(
  values: Array<{
    value: number;
    weight: number;
  }>
): number {
  let numerator = 0;
  let denominator = 0;

  for (const item of values) {
    if (
      !Number.isFinite(item.value) ||
      !Number.isFinite(item.weight) ||
      item.weight <= 0
    ) {
      continue;
    }

    numerator += clamp(item.value) * item.weight;
    denominator += item.weight;
  }

  return denominator > 0
    ? numerator / denominator
    : 50;
}

export function masterScoreEngine(engine: any) {
  /* =====================================================
  INPUT
  ===================================================== */

  const input = engine ?? {};

  const crash = input.crash ?? {};
  const rotation = input.rotation ?? {};
  const putTiming = input.putTiming ?? {};
  const russell = input.russell ?? {};
  const phaseData = input.phaseData ?? {};
  const participation = input.participation ?? {};
  const breadthThrust = input.breadthThrust ?? {};
  const liquidity = input.liquidity ?? {};
  const fragility = input.fragility ?? {};
  const rotationDecay = input.rotationDecay ?? {};
  const regimeSync = input.regimeSync ?? {};
  const breadthVelocity = input.breadthVelocity ?? {};
  const regimePersistence = input.regimePersistence ?? {};
  const marketQuality = input.marketQuality ?? {};
  const historyMetrics = input.historyMetrics ?? {};
  const dangerZone = input.dangerZone ?? {};
  const executionState = input.executionState ?? {};
  const phaseConfirmation = input.phaseConfirmation ?? {};
  const priceMomentum = input.priceMomentum ?? {};

  // A partial deterioration score is a lower bound, not measured absence of risk.
  const breadthVelocityIncomplete = breadthVelocity.dataQuality?.complete === false;

  /* =====================================================
  SAFE COMPONENT INPUTS

  Missing values use neutral risk for numeric compatibility.
  They remain explicitly marked as unavailable.
  ===================================================== */

  const raw = {
    crashScore: numeric(crash.score),
    crashProbability: numeric(crash.probability),
    rotation: numeric(rotation.score),
    participation: numeric(participation.score),
    breadthThrust: numeric(breadthThrust.score),
    liquidity: numeric(liquidity.score),
    fragility: numeric(fragility.score),
    rotationDecay: numeric(rotationDecay.score),
    marketQuality: numeric(marketQuality.score),
    breadthVelocity: numeric(breadthVelocity.score),
    regimeSync: numeric(regimeSync.score),
    dangerZone: numeric(dangerZone.score),
    priceMomentum: numeric(priceMomentum.score)
  };

  const missingInputs = Object.entries(raw)
    .filter(([, value]) => value === null)
    .map(([name]) => name);
  if (breadthVelocityIncomplete && !missingInputs.includes("breadthVelocity")) {
    missingInputs.push("breadthVelocity");
  }

  const crashScore = clamp(raw.crashScore ?? 50);
  const crashProbability = clamp(raw.crashProbability ?? 50);
  const rotationScore = clamp(raw.rotation ?? 50);
  const participationScore = clamp(raw.participation ?? 50);
  const thrustScore = clamp(raw.breadthThrust ?? 50);
  const liquidityScore = clamp(raw.liquidity ?? 50);
  const fragilityScore = clamp(raw.fragility ?? 50);
  const rotationDecayScore = clamp(raw.rotationDecay ?? 50);
  const marketQualityScore = clamp(raw.marketQuality ?? 50);
  const breadthVelocityScore = clamp(breadthVelocityIncomplete
    ? Math.max(50, raw.breadthVelocity ?? 50)
    : raw.breadthVelocity ?? 50);
  const regimeSyncScore = clamp(raw.regimeSync ?? 50);
  const dangerScore = clamp(raw.dangerZone ?? 50);
  const priceMomentumScore = clamp(raw.priceMomentum ?? 50);

  const russellScore = clamp(
    first(russell.confidence, russell.score) ?? 50
  );

  const russellBlocked =
    russell.state === "BLOCKED" ||
    russell.decision === "NO_TRADE" ||
    russell.action === "NO_TRADE";

  /* =====================================================
  TIMING / PHASE
  ===================================================== */

  const timingRaw = num(putTiming.score);

  const declaredTimingMax = first(
    putTiming.maxScore,
    putTiming.score?.max
  );

  const timingMax =
    declaredTimingMax !== null &&
    declaredTimingMax > 0
      ? declaredTimingMax
      : 24;

  const timingRiskScore = clamp(
    timingRaw / timingMax * 100
  );

  const phase =
    typeof phaseData.phase === "string"
      ? phaseData.phase
      : "UNKNOWN";

  const phaseConfidence = clamp(
    num(phaseConfirmation.confidence, 50)
  );

  const phaseConfirmed =
    phaseConfirmation.confirmed === true &&
    phaseData.dataQuality?.classificationIsProvisional !== true;

  const distributionPhase =
    phase === "PHASE_3_DISTRIBUTION";

  const crashPhase = [
    "PHASE_5_BREAKDOWN",
    "PHASE_6_ACCELERATION",
    "PHASE_7_CAPITULATION"
  ].includes(phase);

  /* =====================================================
  PERSISTENCE / PRICE
  ===================================================== */

  const persistenceScore =
    clamp(num(regimePersistence.score));

  const distributionRisk =
    clamp(num(regimePersistence.distributionRisk));

  const falseRecoveryRisk =
    clamp(num(regimePersistence.falseRecoveryRisk));

  const marketFatigue =
    clamp(num(regimePersistence.marketFatigue));

  const bearishPersistence =
    regimePersistence.bearishPersistence === true;

  const bullishPersistence =
    regimePersistence.bullishPersistence === true;

  const persistenceTrend =
    regimePersistence.trend ?? "STABLE";

  const priceMomentumTrend =
    priceMomentum.trend ??
    priceMomentum.direction ??
    "NEUTRAL";

  const priceMomentumAcceleration =
    num(priceMomentum.acceleration);

  /* =====================================================
  HISTORY
  ===================================================== */

  const phasePersistence =
    num(historyMetrics.phasePersistence);

  const daysInPhase =
    num(historyMetrics.daysInPhase);

  const participationDecay =
    num(historyMetrics.participationDecay);

  const breadthTrend =
    num(historyMetrics.breadthTrend);

  const breadthAcceleration =
    num(historyMetrics.breadthAcceleration);

  const leadershipDecay =
    num(historyMetrics.leadershipDecay);

  const crashTrend =
    num(historyMetrics.crashTrend);

  const relativeBreadthWeakness =
    num(historyMetrics.relativeBreadthWeakness);

  const institutionalPressure =
    num(historyMetrics.institutionalPressure);

  const marketCharacter =
    historyMetrics.marketCharacter ?? "UNKNOWN";

  const averageBreadth =
    clamp(num(historyMetrics.averageBreadth, 50));

  const averageParticipation =
    clamp(num(historyMetrics.averageParticipation, 50));

  const averageRotation =
    clamp(num(historyMetrics.averageRotation, 50));

  const averageLiquidity =
    clamp(num(historyMetrics.averageLiquidity, 50));

  const averageFragility =
    clamp(num(historyMetrics.averageFragility, 50));

  const regimePersistenceHistory =
    num(historyMetrics.regimePersistence);

  const historyPersistentDistribution =
    historyMetrics.persistentDistribution === true;

  const prolongedBearRegime =
    historyMetrics.prolongedBearRegime === true;

  /* =====================================================
  OPTIONAL EXECUTION CONTEXT
  ===================================================== */

  const riskState =
    executionState.riskState ?? "UNKNOWN";

  const executionMode =
    executionState.executionMode ?? "UNKNOWN";

  const marketMode =
    executionState.marketMode ?? "UNKNOWN";

  const inverse = (value: number) =>
    100 - clamp(value);

  /* =====================================================
  NORMALIZED RISK COMPONENTS
  ===================================================== */

  const crashRisk = weightedAverage([
    { value: crashScore, weight: 0.50 },
    { value: crashProbability, weight: 0.50 }
  ]);

  const rotationRisk = inverse(rotationScore);
  const russellRisk = inverse(russellScore);
  const participationRisk = inverse(participationScore);
  const thrustRisk = inverse(thrustScore);
  const breadthVelocityRisk = breadthVelocityScore;
  const liquidityRisk = inverse(liquidityScore);
  const fragilityRisk = fragilityScore;
  const rotationDecayRisk = rotationDecayScore;
  const marketQualityRisk = inverse(marketQualityScore);
  const regimeSyncRisk = inverse(regimeSyncScore);
  const dangerRisk = dangerScore;
  const priceMomentumRisk = inverse(priceMomentumScore);

  /* =====================================================
  RISK AGGREGATES

  Existing weights retained.
  Correlated components are not independent evidence.
  ===================================================== */

  const observedHistoricalRisk = weightedAverage([
    { value: inverse(averageBreadth), weight: 0.20 },
    { value: inverse(averageParticipation), weight: 0.20 },
    { value: inverse(averageRotation), weight: 0.15 },
    { value: inverse(averageLiquidity), weight: 0.20 },
    { value: averageFragility, weight: 0.25 }
  ]);

  const structuralRisk = weightedAverage([
    { value: marketQualityRisk, weight: 0.30 },
    { value: participationRisk, weight: 0.20 },
    { value: breadthVelocityRisk, weight: 0.15 },
    { value: rotationDecayRisk, weight: 0.15 },
    { value: fragilityRisk, weight: 0.20 }
  ]);

  const currentMarketRisk = weightedAverage([
    { value: rotationRisk, weight: 0.12 },
    { value: participationRisk, weight: 0.12 },
    { value: thrustRisk, weight: 0.08 },
    { value: breadthVelocityRisk, weight: 0.08 },
    { value: liquidityRisk, weight: 0.10 },
    { value: fragilityRisk, weight: 0.14 },
    { value: rotationDecayRisk, weight: 0.08 },
    { value: marketQualityRisk, weight: 0.16 },
    { value: priceMomentumRisk, weight: 0.05 },
    { value: regimeSyncRisk, weight: 0.04 },
    { value: dangerRisk, weight: 0.03 }
  ]);

  // Missing history contributes current component risk, not invented health.
  // Each historical component reaches its fixed maximum weight automatically.
  const historicalQuality = historyMetrics.dataQuality?.historicalComponents ?? {};
  const historicalMix = [
    { name: "breadth", historical: inverse(averageBreadth), current: inverse(numeric(input.structure?.breadth?.b50) ?? 50), weight: 0.20 },
    { name: "participation", historical: inverse(averageParticipation), current: participationRisk, weight: 0.20 },
    { name: "rotation", historical: inverse(averageRotation), current: rotationRisk, weight: 0.15 },
    { name: "liquidity", historical: inverse(averageLiquidity), current: liquidityRisk, weight: 0.20 },
    { name: "fragility", historical: averageFragility, current: fragilityRisk, weight: 0.25 }
  ].map(component => {
    const maturity = clamp(num(historicalQuality[component.name]?.maturity), 0, 1);
    return { ...component, maturity, value: component.current * (1 - maturity) + component.historical * maturity };
  });
  const historicalRisk = weightedAverage(historicalMix);
  const baseRisk = weightedAverage([
    { value: currentMarketRisk, weight: 0.70 },
    { value: structuralRisk, weight: 0.20 },
    { value: historicalRisk, weight: 0.05 },
    { value: crashRisk, weight: 0.05 }
  ]);

  let score = baseRisk;

  /* =====================================================
  PHASE ADJUSTMENT
  ===================================================== */

  const phaseAdjustments: Record<string, number> = {
    PHASE_1_EXPANSION: -4,
    PHASE_2_WARNING: 2,
    PHASE_3_DISTRIBUTION: 4,
    PHASE_4_RISK: 5,
    PHASE_5_BREAKDOWN: 8,
    PHASE_6_ACCELERATION: 10,
    PHASE_7_CAPITULATION: 5
  };

  let phaseAdjustment =
    phaseAdjustments[phase] ?? 0;

  if (
    phaseConfirmed &&
    phaseConfidence >= 70
  ) {
    phaseAdjustment *= 1.15;
  } else if (
    !phaseConfirmed &&
    phaseConfidence < 40
  ) {
    score = 50 + (score - 50) * 0.75;
  }

  const preOverlayRisk = score;

  score += phaseAdjustment;

  /* =====================================================
  PERSISTENCE OVERLAY
  ===================================================== */

  let persistenceAdjustment =
    distributionRisk * 0.06 +
    falseRecoveryRisk * 0.05 +
    marketFatigue * 0.03;

  if (bearishPersistence) {
    persistenceAdjustment += 4;
  }

  if (historyPersistentDistribution) {
    persistenceAdjustment += 2;
  }

  if (prolongedBearRegime) {
    persistenceAdjustment += 2;
  }

  if (
    bullishPersistence &&
    persistenceTrend === "IMPROVING"
  ) {
    persistenceAdjustment -= 3;
  }

  persistenceAdjustment = clamp(
    persistenceAdjustment,
    -5,
    8
  );

  score += persistenceAdjustment;

  /* =====================================================
  STRUCTURAL WARNINGS
  ===================================================== */

  const deterioratingBreadth =
    breadthTrend <= -2;

  const acceleratingBreadthDecay =
    breadthAcceleration <= -1;

  /*
   * historyEngine:
   * positive leadership decay = deterioration.
   */
  const leadershipConcentration =
    leadershipDecay >= 2;

  const risingCrashRisk =
    crashTrend >= 3;

  /*
   * Existing convention retained.
   * Its calibration is separate from numeric validation.
   */
  const broadParticipationFailure =
    relativeBreadthWeakness > 10;

  const warningAdjustment = clamp(
    Number(deterioratingBreadth) +
    Number(acceleratingBreadthDecay) +
    Number(leadershipConcentration) +
    Number(risingCrashRisk) +
    Number(broadParticipationFailure) +
    Number(
      prolongedBearRegime &&
      institutionalPressure > 70
    ),
    0,
    6
  );

  score += warningAdjustment;

  /* =====================================================
  OPTIONAL EXECUTION OVERLAY
  ===================================================== */

  let executionAdjustment = 0;

  if (marketMode === "RISK_OFF") {
    executionAdjustment += 2;
  }

  if (riskState === "BREAKDOWN") {
    executionAdjustment += 3;
  }

  if (executionMode === "REDUCE_RISK") {
    executionAdjustment += 2;
  }

  executionAdjustment = clamp(
    executionAdjustment,
    0,
    6
  );

  score += executionAdjustment;

  const unclampedScore = score;

  score = clamp(Math.round(score));

  /* =====================================================
  SIGNAL

  No artificial score cap in distribution phase.
  Distribution retains its higher PUT threshold.
  ===================================================== */

  const putThreshold =
    distributionPhase ? 75 : 65;

  const callAllowed =
    !distributionPhase &&
    !crashPhase &&
    missingInputs.length === 0 &&
    phase !== "UNKNOWN";

  let signal: "CALL" | "NEUTRAL" | "PUT";

  if (score >= putThreshold) {
    signal = "PUT";
  } else if (
    score <= 35 &&
    callAllowed
  ) {
    signal = "CALL";
  } else {
    signal = "NEUTRAL";
  }

  const color =
    signal === "CALL"
      ? "GREEN"
      : signal === "PUT"
      ? "RED"
      : "YELLOW";

  const neutralUpperThreshold =
    putThreshold - 1;

  const signalStrength = clamp(
    Math.round(
      signal === "CALL"
        ? (35 - score) / 35 * 100
        : signal === "PUT"
        ? (score - putThreshold) /
          (100 - putThreshold) * 100
        : 100 - Math.abs(score - 50) * 2
    )
  );

  /* =====================================================
  STRUCTURAL FLAGS
  ===================================================== */

  function historicalMeasurement(
    field: string,
    source: string
  ): boolean {
    if (numeric(historyMetrics[field]) === null) {
      return false;
    }

    const quality = historyMetrics.dataQuality;

    if (!quality) return false;

    const component = source === "breadth50" ? "breadth" : source;
    const measured = numeric(quality.historicalComponents?.[component]?.measuredObservations);
    if (measured !== null) return measured > 0;

    const observations =
      numeric(quality.dailyObservations);

    const missing =
      numeric(quality.missingValues?.[source]);

    return (
      observations !== null &&
      missing !== null &&
      observations > 0 &&
      missing < observations
    );
  }

  /*
   * Phase age alone does not establish weakness.
   * Unknown measurements must not count as evidence.
   */
  const weakInternals =
    (
      raw.participation !== null &&
      participationScore < 50
    ) ||
    (
      raw.breadthVelocity !== null &&
      breadthVelocityScore > 55
    ) ||
    (
      raw.marketQuality !== null &&
      marketQualityScore < 45
    ) ||
    (
      raw.rotationDecay !== null &&
      rotationDecayScore > 45
    ) ||
    institutionalPressure > 65 ||
    (
      historicalMeasurement("averageBreadth", "breadth50") &&
      averageBreadth < 55
    ) ||
    (
      historicalMeasurement("averageParticipation", "participation") &&
      averageParticipation < 55
    ) ||
    (
      historicalMeasurement("averageLiquidity", "liquidity") &&
      averageLiquidity < 50
    ) ||
    (
      historicalMeasurement("averageFragility", "fragility") &&
      averageFragility > 60
    ) ||
    participationDecay > 15 ||
    deterioratingBreadth ||
    acceleratingBreadthDecay ||
    leadershipConcentration ||
    broadParticipationFailure ||
    prolongedBearRegime ||
    bearishPersistence;

  const narrowLeadership =
    num(rotation.rsGrowth, 1) > 1.03 &&
    num(rotation.rsSmall, 1) < 0.995 &&
    num(rotation.rsEqual, 1) < 0.995;

  /* =====================================================
  DEFENSIVE EVIDENCE

  Count of model conditions, not independent confirmations.
  ===================================================== */

  const defensiveEvidenceCount = [
    raw.participation !== null &&
      participationScore < 50,

    raw.breadthVelocity !== null &&
      breadthVelocityScore > 55,

    raw.marketQuality !== null &&
      marketQualityScore < 45,

    raw.rotationDecay !== null &&
      rotationDecayScore > 55,

    raw.fragility !== null &&
      fragilityScore >= 68,

    raw.regimeSync !== null &&
      regimeSyncScore < 45,

    num(input.internalDivergence?.score) >= 60,

    russellBlocked
  ].filter(Boolean).length;

  const defensiveStructuralConfirmation =
    score >= 65 &&
    defensiveEvidenceCount >= 3;

  /* =====================================================
  MODE
  ===================================================== */

  let mode: "LONG" | "NEUTRAL" | "RISK" | "CRASH" =
    signal === "CALL"
      ? "LONG"
      : signal === "PUT"
      ? "RISK"
      : "NEUTRAL";

  if (phase === "PHASE_4_RISK") {
    mode = "RISK";
  }

  if (
    defensiveStructuralConfirmation &&
    !distributionPhase &&
    !crashPhase
  ) {
    mode = "RISK";
  }

  const strongDefensive =
    score >= 75 &&
    defensiveEvidenceCount >= 4 &&
    !distributionPhase &&
    !crashPhase;

  if (strongDefensive) {
    mode = "RISK";
  }

  if (
    prolongedBearRegime &&
    broadParticipationFailure &&
    !distributionPhase &&
    !crashPhase
  ) {
    mode = "RISK";
  }

  if (
    acceleratingBreadthDecay &&
    risingCrashRisk &&
    !distributionPhase &&
    !crashPhase
  ) {
    mode = "RISK";
  }

  if (
    bearishPersistence &&
    distributionRisk >= 60 &&
    mode === "LONG" &&
    !distributionPhase &&
    !crashPhase
  ) {
    mode = "RISK";
  }

  const executionOverride =
    marketMode === "RISK_OFF" ||
    riskState === "BREAKDOWN" ||
    executionMode === "REDUCE_RISK";

  if (
    executionOverride &&
    mode === "LONG"
  ) {
    mode = "RISK";
  }

  if (
    narrowLeadership &&
    weakInternals &&
    phase !== "PHASE_1_EXPANSION" &&
    mode === "LONG"
  ) {
    mode = "NEUTRAL";
  }

  /* Phase invariants */

  if (crashPhase) {
    mode = "CRASH";
  }

  if (distributionPhase) {
    mode = "NEUTRAL";
  }

  /* =====================================================
  REGIME CONTEXT

  This exposure is not executable portfolio sizing.
  Actual instrument sizing remains a separate layer.
  ===================================================== */

  const netExposure =
    mode === "LONG"
      ? 40
      : mode === "RISK"
      ? -40
      : mode === "CRASH"
      ? -85
      : 0;

  const regime =
    mode === "LONG"
      ? "LONG"
      : mode === "RISK"
      ? "RISK"
      : mode === "CRASH"
      ? "CRASH"
      : "TRANSITION";

  let summary =
    signal === "CALL"
      ? "Constructive market regime | CALL bias"
      : signal === "PUT"
      ? "Defensive market regime | PUT bias"
      : "Balanced market regime | NEUTRAL bias";

  if (mode === "CRASH") {
    summary += " | Crash regime active";
  }

  if (bearishPersistence) {
    summary += " | Persistent weakness";
  }

  if (falseRecoveryRisk >= 50) {
    summary += " | False recovery risk elevated";
  }

  if (missingInputs.length) {
    summary += " | Incomplete component inputs";
  }

  /* =====================================================
  EFFECTIVE BASE WEIGHTS

  Algebraic expansion of the existing nested weights.
  Before phase damping and additive overlays.
  ===================================================== */

  const baseWeights = {
    rotation: 0.084,
    participation: 0.124,
    breadthThrust: 0.056,
    breadthVelocity: 0.086,
    liquidity: 0.070,
    fragility: 0.138,
    rotationDecay: 0.086,
    marketQuality: 0.172,
    priceMomentum: 0.035,
    regimeSync: 0.028,
    dangerZone: 0.021,
    historicalRisk: 0.050,
    crashRisk: 0.050
  };

  const baseContributions = {
    rotation:
      rotationRisk * baseWeights.rotation,

    participation:
      participationRisk * baseWeights.participation,

    breadthThrust:
      thrustRisk * baseWeights.breadthThrust,

    breadthVelocity:
      breadthVelocityRisk * baseWeights.breadthVelocity,

    liquidity:
      liquidityRisk * baseWeights.liquidity,

    fragility:
      fragilityRisk * baseWeights.fragility,

    rotationDecay:
      rotationDecayRisk * baseWeights.rotationDecay,

    marketQuality:
      marketQualityRisk * baseWeights.marketQuality,

    priceMomentum:
      priceMomentumRisk * baseWeights.priceMomentum,

    regimeSync:
      regimeSyncRisk * baseWeights.regimeSync,

    dangerZone:
      dangerRisk * baseWeights.dangerZone,

    historicalRisk:
      historicalRisk * baseWeights.historicalRisk,

    crashRisk:
      crashRisk * baseWeights.crashRisk
  };

  /* =====================================================
  RETURN
  ===================================================== */

  return {
    score,
    signal,
    color,
    signalStrength,
    mode,
    netExposure,
    regime,
    summary,

    meta: {
      scoreType: "RISK",
      scoreInterpretation: "LOW=CALL | HIGH=PUT",

      callThreshold: 35,
      callAllowed,

      neutralLowerThreshold:
        callAllowed ? 36 : 0,

      neutralUpperThreshold,
      putThreshold,

      phaseConfirmed,
      phaseConfidence,

      riskState,
      marketMode,
      executionMode,

      phase,
      distributionPhase,
      crashPhase,

      priceMomentumScore,
      priceMomentumTrend,
      priceMomentumAcceleration,

      weakInternals,
      narrowLeadership,

      defensiveEvidenceCount,
      defensiveStructuralConfirmation,
      defensiveEvidenceIsIndependent: false,

      rotationDecayScore,
      marketQualityScore,
      participationScore,
      breadthVelocityScore,

      phasePersistence,
      participationDecay,
      breadthTrend,
      breadthAcceleration,
      leadershipDecay,
      crashTrend,
      relativeBreadthWeakness,
      daysInPhase,
      institutionalPressure,
      marketCharacter,

      averageBreadth,
      averageParticipation,
      averageRotation,
      averageLiquidity,
      averageFragility,

      regimePersistenceHistory,

      deterioratingBreadth,
      acceleratingBreadthDecay,
      leadershipConcentration,
      risingCrashRisk,
      broadParticipationFailure,
      prolongedBearRegime,

      persistenceScore,
      distributionRisk,
      falseRecoveryRisk,
      marketFatigue,
      bearishPersistence,
      bullishPersistence,
      persistenceTrend,

      phaseAdjustment,
      persistenceAdjustment,
      warningAdjustment,
      executionAdjustment,

      /*
       * Legacy names retained.
       * These values describe risk, not constructive quality.
       */
      currentQuality:
        Math.round(currentMarketRisk),

      structuralQuality:
        Math.round(structuralRisk),

      historicalQuality:
        Math.round(historicalRisk),

      currentRisk:
        Math.round(currentMarketRisk),

      structuralRisk:
        Math.round(structuralRisk),

      historicalRisk:
        Math.round(historicalRisk),

      legacyQualityFieldsAreRisk: true,

      crashRisk:
        Math.round(crashRisk),

      timingRisk:
        Math.round(timingRiskScore),

      exposureMeaning:
        "REGIME_CONTEXT_NOT_EXECUTABLE_POSITION_SIZE"
    },

    components: {
      crash: Math.round(crashRisk),
      rotation: Math.round(rotationRisk),
      priceMomentum: Math.round(priceMomentumRisk),
      timing: Math.round(timingRiskScore),
      russell: Math.round(russellRisk),
      participation: Math.round(participationRisk),
      breadthThrust: Math.round(thrustRisk),
      breadthVelocity: Math.round(breadthVelocityRisk),
      rotationDecay: Math.round(rotationDecayRisk),
      liquidity: Math.round(liquidityRisk),
      marketQuality: Math.round(marketQualityRisk),
      fragility: Math.round(fragilityRisk),
      regimeSync: Math.round(regimeSyncRisk),
      dangerZone: Math.round(dangerRisk),
      regimePersistence: Math.round(persistenceScore),
      distributionRisk: Math.round(distributionRisk),
      falseRecoveryRisk: Math.round(falseRecoveryRisk),
      marketFatigue: Math.round(marketFatigue)
    },

    diagnostics: {
      calculationVersion: "MATURITY_WEIGHTED_HISTORY_V4_INPUT_QUALITY",
      historicalMix,
      observedHistoricalRisk,
      historyTargetObservations: 21,
      baseRisk,
      preOverlayRisk,

      phaseAdjustment,
      persistenceAdjustment,
      warningAdjustment,
      executionAdjustment,

      unclampedScore,

      saturated:
        unclampedScore < 0 ||
        unclampedScore > 100,

      baseWeights,
      baseContributions,

      timingAndRussellDirectScoreWeight: 0,
      breadthVelocityInputScore: raw.breadthVelocity,
      breadthVelocityIncomplete,
      breadthVelocityMissingDataPolicy: "NEUTRAL_FLOOR_PRESERVE_OBSERVED_RISK",
      weightsCalibratedByThisAudit: false
    },

    dataQuality: {
      complete: missingInputs.length === 0,
      missingInputs,
      fallbackRisk: 50,
      missingInputsAreNotMeasuredNeutral: true
    }
  };
}
