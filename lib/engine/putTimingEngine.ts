// /lib/engine/putTimingEngine.ts

/* =====================================================
PUT TIMING ENGINE V2

Structural short justification, price execution,
panic and contradiction remain separate layers.

Score range: 0–24.
===================================================== */

type PutTimingDecision =
  | "WAIT"
  | "STRUCTURAL_BUILD"
  | "DEFENSIVE_BUILD"
  | "TACTICAL_BUILD"
  | "STRONG_BUILD"
  | "PANIC_SHORT";

type PutTimingTiming =
  | "WAIT"
  | "EARLY"
  | "BUILD"
  | "TACTICAL"
  | "STRONG"
  | "PANIC";

type PutTimingExecution =
  | "NONE"
  | "SMALL STARTER"
  | "PARTIAL SIZE"
  | "FULL SIZE"
  | "REDUCE RISK";

/* =====================================================
HELPERS
===================================================== */

const clamp = (
  value: number,
  min = 0,
  max = 100
) =>
  Math.max(
    min,
    Math.min(
      max,
      Number.isFinite(value) ? value : min
    )
  );

const num = (
  value: unknown,
  fallback = 0
): number => {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : fallback;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

function numericValue(
  value: unknown,
  fallback: number
): number {
  const candidates =
    value && typeof value === "object"
      ? [
          (value as any).value,
          (value as any).score,
          (value as any).current
        ]
      : [value];

  for (const candidate of candidates) {
    const parsed = num(candidate, NaN);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

const bool = (value: unknown) =>
  value === true;

const phaseRank = (phase?: string) => {
  switch (phase) {
    case "PHASE_1_EXPANSION":
      return 1;
    case "PHASE_2_WARNING":
      return 2;
    case "PHASE_3_DISTRIBUTION":
      return 3;
    case "PHASE_4_RISK":
      return 4;
    case "PHASE_5_BREAKDOWN":
      return 5;
    case "PHASE_6_ACCELERATION":
      return 6;
    case "PHASE_7_CAPITULATION":
      return 7;
    default:
      return 0;
  }
};

export function putTimingEngine(input: any) {
  /* =====================================================
  INPUT
  ===================================================== */

  const {
    phase,
    rotation,
    crash,
    earlyWarning,
    historyMetrics = {},
    priceMomentum,
    participation,
    liquidity,
    dangerZone,
    marketDrivers,
    regimeSync,
    breadthThrust,
    marketQuality,
    rotationDecay
  } = input ?? {};

  /* =====================================================
  HISTORY

  Consume existing upstream flags.
  Do not derive substitute flags from persistence counts.
  ===================================================== */

  const persistentDistribution =
    bool(historyMetrics.persistentDistribution);

  const prolongedBearRegime =
    bool(historyMetrics.prolongedBearRegime);

  const severeBearRegime =
    bool(historyMetrics.severeBearRegime);

  const acceleratingWeakness =
    bool(historyMetrics.acceleratingWeakness);

  const deterioratingBreadth = bool(
    historyMetrics.deterioratingBreadth ??
    historyMetrics.breadthDeteriorating
  );

  const acceleratingBreadthDecay = bool(
    historyMetrics.acceleratingBreadthDecay ??
    historyMetrics.breadthDecayAccelerating
  );

  const participationErosion = bool(
    historyMetrics.participationErosion ??
    historyMetrics.participationEroding
  );

  const severeParticipationErosion =
    bool(historyMetrics.severeParticipationErosion);

  const risingCrashRisk = bool(
    historyMetrics.risingCrashRisk ??
    historyMetrics.crashRiskRising
  );

  const severeRisingCrashRisk = bool(
    historyMetrics.severeRisingCrashRisk ??
    historyMetrics.severeCrashRiskRise
  );

  const broadParticipationFailure =
    bool(historyMetrics.broadParticipationFailure);

  const severeParticipationFailure =
    bool(historyMetrics.severeParticipationFailure);

  const phasePersistence =
    num(historyMetrics.phasePersistence);

  const daysInPhase =
    num(historyMetrics.daysInPhase);

  const institutionalPressure =
    num(historyMetrics.institutionalPressure);

  const breadthTrend =
    num(historyMetrics.breadthTrend);

  const breadthAcceleration =
    num(historyMetrics.breadthAcceleration);

  const participationDecay =
    num(historyMetrics.participationDecay);

  const relativeBreadthWeakness =
    num(historyMetrics.relativeBreadthWeakness);

  /* =====================================================
  CURRENT STRUCTURE
  ===================================================== */

  const phaseData =
    input?.phaseData ?? {};

  const phaseConfidence = num(
    phaseData?.confidence ??
    phaseData?.phaseConfidence,
    0
  );

  const rotationDecayScore =
    num(rotationDecay?.score, 0);

  const rotationDecayState =
    rotationDecay?.state ??
    rotationDecay?.rotationDecayState ??
    "UNKNOWN";

  const rotationConfirmState =
    input?.rotationConfirm?.state ?? "UNKNOWN";

  const rotationScore =
    num(rotation?.score, 50);

  const rotationConfidence =
    num(rotation?.confidence, 0);

  const rotationBreakdown =
    rotation?.state === "BREAKDOWN" ||
    rotationConfirmState === "INTERNAL_BREAKDOWN";

  const exhaustedRotation =
    rotationDecayState === "EXHAUSTED_ROTATION";

  /* =====================================================
  BREADTH

  Supports scalar and wrapped values.
  Existing missing-input defaults remain unchanged.
  ===================================================== */

  const breadth20 = numericValue(
    input?.breadth20,
    numericValue(input?.structure?.breadth?.b20, 50)
  );

  const breadth50 = numericValue(
    input?.breadth50,
    numericValue(input?.structure?.breadth?.b50, 50)
  );

  const breadth200 = numericValue(
    input?.breadth200,
    numericValue(input?.structure?.breadth?.b200, 50)
  );

  const ad =
    numericValue(input?.structure?.advanceDecline, 0);

  const breadthWeak =
    breadth20 < 60 || breadth50 < 65;

  const breadthSevere =
    breadth20 < 45 || breadth50 < 50;

  /* =====================================================
  PARTICIPATION / LIQUIDITY
  ===================================================== */

  const participationScore =
    num(participation?.score, 50);

  const participationWeak =
    participationScore < 60;

  const participationHealthy =
    participationScore >= 65;

  const liquidityScore =
    num(liquidity?.score, 50);

  const liquidityStress =
    liquidity?.state === "LIQUIDITY_STRESS" ||
    liquidity?.support === "NEGATIVE" ||
    liquidityScore < 30;

  const liquiditySupport =
    liquidityScore >= 60;

  /* =====================================================
  FRAGILITY / MARKET QUALITY
  ===================================================== */

  const fragilityScore =
    num(input?.fragility?.score, 50);

  const structuralFragility =
    fragilityScore >= 70;

  const extremeFragility =
    fragilityScore >= 90;

  const marketQualityScore = num(
    marketQuality?.score ??
    marketQuality?.value ??
    marketQuality?.qualityScore,
    50
  );

  const deterioratingQuality =
    marketQuality?.state === "DETERIORATING" ||
    marketQuality?.marketQuality === "DETERIORATING" ||
    marketQualityScore < 45;

  /* =====================================================
  PRICE MOMENTUM

  Price is not part of structurePoints.
  ===================================================== */

  const priceScore =
    num(priceMomentum?.score, 50);

  const momentum5D =
    num(priceMomentum?.momentum5D);

  const momentum20D =
    num(priceMomentum?.momentum20D);

  const acceleration =
    num(priceMomentum?.acceleration);

  const priceDirection =
    priceMomentum?.direction ?? "NEUTRAL";

  const bearishImpulse =
    bool(priceMomentum?.bearishImpulse);

  const bullishImpulse =
    bool(priceMomentum?.bullishImpulse);

  const bearishConfirmation =
    bool(priceMomentum?.bearishConfirmation);

  const bullishCounterMove =
    bool(priceMomentum?.bullishCounterMove);

  const priceConflict = bool(
    priceMomentum?.conflict ??
    (priceMomentum?.structureAlignment === "CONFLICT")
  );

  const priceNeutral =
    priceScore >= 43 && priceScore <= 57;

  /* =====================================================
  PANIC / CRASH
  ===================================================== */

  const crashProbability =
    num(crash?.probability, 0);

  const crashScore =
    num(crash?.score, 0);

  const panicScore =
    num(crash?.panicState?.score, 0);

  const panicConfirmed =
    crash?.panicState?.state === "PANIC" ||
    bool(input?.panicConfirmed ?? false);

  const panicEligible =
    panicConfirmed ||
    panicScore >= 70 ||
    crashProbability >= 60;

  /* =====================================================
  STRUCTURAL SCORE / 20
  ===================================================== */

  let structurePoints = 0;

  if (phaseRank(phase) >= 3) structurePoints += 3;
  if (phaseRank(phase) >= 4) structurePoints += 2;
  if (phaseRank(phase) >= 5) structurePoints += 1;
  if (persistentDistribution) structurePoints += 3;
  if (prolongedBearRegime) structurePoints += 2;
  if (severeBearRegime) structurePoints += 1;
  if (rotationBreakdown) structurePoints += 2;
  if (exhaustedRotation) structurePoints += 1;
  if (structuralFragility) structurePoints += 2;
  if (liquidityStress) structurePoints += 1;
  if (deterioratingBreadth) structurePoints += 1;

  structurePoints =
    Math.round(clamp(structurePoints, 0, 20));

  /* =====================================================
  PHASE SCORE / 9
  ===================================================== */

  let phasePoints = 0;

  if (phaseRank(phase) >= 3) phasePoints += 3;
  if (phaseRank(phase) >= 4) phasePoints += 2;
  if (phaseRank(phase) >= 5) phasePoints += 2;
  if (phaseRank(phase) >= 6) phasePoints += 1;
  if (phaseConfidence >= 70) phasePoints += 1;

  phasePoints =
    Math.round(clamp(phasePoints, 0, 9));

  /* =====================================================
  ROTATION SCORE / 6
  ===================================================== */

  let rotationPoints = 0;

  if (rotationBreakdown) rotationPoints += 2;
  if (exhaustedRotation) rotationPoints += 2;
  if (rotationDecayScore >= 80) rotationPoints += 1;

  if (
    rotationConfidence >= 50 ||
    rotationConfirmState === "INTERNAL_BREAKDOWN"
  ) {
    rotationPoints += 1;
  }

  rotationPoints =
    Math.round(clamp(rotationPoints, 0, 6));

  /* =====================================================
  PRICE SCORE / 14
  ===================================================== */

  let pricePoints = 0;

  if (bearishImpulse) {
    pricePoints += 5;
  } else if (bearishConfirmation) {
    pricePoints += 4;
  } else if (
    priceDirection === "DOWN" &&
    momentum20D < -1
  ) {
    pricePoints += 3;
  } else if (priceDirection === "DOWN") {
    pricePoints += 2;
  }

  if (momentum5D < -0.5) pricePoints += 2;
  if (acceleration < 0) pricePoints += 2;
  if (priceScore < 45) pricePoints += 2;
  if (priceConflict) pricePoints -= 1;
  if (bullishImpulse) pricePoints -= 5;
  if (bullishCounterMove) pricePoints -= 2;

  pricePoints =
    Math.round(clamp(pricePoints, 0, 14));

  /* =====================================================
  PANIC SCORE / 10
  ===================================================== */

  let panicPoints = 0;

  if (panicConfirmed) panicPoints += 6;
  if (panicScore >= 70) panicPoints += 2;
  if (crashProbability >= 60) panicPoints += 2;

  if (
    priceScore < 35 &&
    momentum20D < -4
  ) {
    panicPoints += 2;
  }

  panicPoints =
    Math.round(clamp(panicPoints, 0, 10));

  /* =====================================================
  CONTRADICTION / 8
  ===================================================== */

  let contradictionPoints = 0;

  if (bullishImpulse) contradictionPoints += 5;
  if (bullishCounterMove) contradictionPoints += 2;

  if (
    priceConflict &&
    priceDirection !== "DOWN"
  ) {
    contradictionPoints += 1;
  }

  contradictionPoints =
    Math.round(clamp(contradictionPoints, 0, 8));

  /* =====================================================
  STRUCTURAL TRIGGERS
  ===================================================== */

  const internalDeterioration =
    deterioratingBreadth ||
    acceleratingBreadthDecay ||
    rotationBreakdown ||
    structuralFragility ||
    liquidityStress;

  const structuralBreakdown =
    structurePoints >= 10 &&
    (
      phaseRank(phase) >= 3 ||
      persistentDistribution ||
      prolongedBearRegime
    );

  const structuralPutTrigger =
    structuralBreakdown &&
    structurePoints >= 12 &&
    rotationPoints >= 3;

  const earlyStructuralTrigger =
    structurePoints >= 8 &&
    (
      earlyWarning?.active === true ||
      deterioratingBreadth ||
      risingCrashRisk
    );

  /* =====================================================
  DECISION LOGIC

  PANIC -> STRONG -> TACTICAL -> STRUCTURAL -> DEFENSIVE
  ===================================================== */

  let decision: PutTimingDecision = "WAIT";
  let timing: PutTimingTiming = "WAIT";
  let execution: PutTimingExecution = "NONE";

  if (
    panicPoints >= 7 &&
    contradictionPoints <= 2
  ) {
    decision = "PANIC_SHORT";
    timing = "PANIC";
    execution = "REDUCE RISK";
  } else if (
    structuralPutTrigger &&
    pricePoints >= 8 &&
    contradictionPoints <= 2 &&
    panicPoints < 7
  ) {
    decision = "STRONG_BUILD";
    timing = "STRONG";
    execution = "FULL SIZE";
  } else if (
    structuralPutTrigger &&
    pricePoints >= 5 &&
    contradictionPoints <= 3 &&
    panicPoints < 7
  ) {
    decision = "TACTICAL_BUILD";
    timing = "TACTICAL";
    execution = "PARTIAL SIZE";
  } else if (
    structuralPutTrigger &&
    contradictionPoints <= 3
  ) {
    decision = "STRUCTURAL_BUILD";
    timing = "BUILD";
    execution = priceNeutral
      ? "PARTIAL SIZE"
      : "SMALL STARTER";
  } else if (
    earlyStructuralTrigger &&
    structurePoints >= 7 &&
    contradictionPoints <= 2
  ) {
    decision = "DEFENSIVE_BUILD";
    timing = "EARLY";
    execution = "SMALL STARTER";
  }

  /* TACTICAL ABORT */

  if (
    bullishImpulse &&
    decision !== "PANIC_SHORT"
  ) {
    decision = "WAIT";
    timing = "WAIT";
    execution = "NONE";
  }

  /* =====================================================
  ENTRY WINDOW / INSTITUTIONAL STATE
  ===================================================== */

  const entryWindow =
    decision !== "WAIT" && decision !== "PANIC_SHORT"
      ? "OPEN"
      : decision === "PANIC_SHORT"
        ? "EXTENDED"
        : "CLOSED";

  const institutionalState =
    decision === "PANIC_SHORT"
      ? "PANIC_SHORT"
      : structuralPutTrigger
        ? "STRUCTURAL_SHORT"
        : earlyStructuralTrigger
          ? "DEFENSIVE_SHORT"
          : "NEUTRAL";

  /* =====================================================
  TOTAL SCORE / 24
  ===================================================== */

  const structuralComposite =
    (structurePoints / 20) * 0.45 +
    (phasePoints / 9) * 0.25 +
    (rotationPoints / 6) * 0.20 +
    (pricePoints / 14) * 0.10;

  const score = Math.round(
    clamp(
      Math.round(structuralComposite * 24),
      0,
      24
    )
  );

  /* =====================================================
  SUMMARY
  ===================================================== */

  let summary = "No structural short edge";

  if (decision === "PANIC_SHORT") {
    summary = "Panic environment | avoid chasing new puts";
  } else if (decision === "STRONG_BUILD") {
    summary = "Strong structural short setup with price confirmation";
  } else if (decision === "TACTICAL_BUILD") {
    summary = "Structural short setup with tactical price confirmation";
  } else if (decision === "STRUCTURAL_BUILD") {
    summary = "Structural short setup | price timing still developing";
  } else if (decision === "DEFENSIVE_BUILD") {
    summary = "Early structural deterioration | defensive short build";
  } else if (internalDeterioration) {
    summary = "Structural deterioration detected | waiting for entry confirmation";
  }

  /* =====================================================
  RETURN
  ===================================================== */

  return {
    decision,
    timing,
    execution,
    score,
    maxScore: 24,
    entryWindow,

    triggerQuality:
      structuralPutTrigger
        ? "STRUCTURAL_BREAKDOWN"
        : earlyStructuralTrigger
          ? "EARLY_STRUCTURAL"
          : "NONE",

    summary,

    layers: {
      structure: {
        score: structurePoints,
        max: 20,
        state:
          structuralPutTrigger
            ? "STRONG_BEARISH"
            : structurePoints >= 8
              ? "BEARISH"
              : "NEUTRAL"
      },

      phase: {
        score: phasePoints,
        max: 9
      },

      rotation: {
        score: rotationPoints,
        max: 6,
        state:
          exhaustedRotation
            ? "EXHAUSTED_ROTATION"
            : rotationBreakdown
              ? "BREAKDOWN"
              : "NORMAL"
      },

      price: {
        score: pricePoints,
        max: 14,
        state:
          bearishImpulse || bearishConfirmation
            ? "BEARISH_CONFIRMATION"
            : bullishImpulse
              ? "BULLISH_COUNTER_MOVE"
              : "NEUTRAL"
      },

      panic: {
        score: panicPoints,
        max: 10,
        confirmed: panicConfirmed
      },

      contradiction: {
        score: contradictionPoints,
        max: 8
      }
    },

    price: {
      score: priceScore,
      momentum5D,
      momentum20D,
      acceleration,

      state:
        priceNeutral
          ? "NEUTRAL"
          : priceScore < 43
            ? "BEARISH"
            : "BULLISH",

      structureAlignment:
        priceConflict ? "CONFLICT" : "ALIGNED",

      direction: priceDirection,

      earlyBearish:
        priceDirection === "DOWN" &&
        momentum20D < -1,

      bearishImpulse,
      bullishImpulse,

      cooling: bool(priceMomentum?.cooling),
      accelerating: bool(priceMomentum?.accelerating),
      decelerating: bool(priceMomentum?.decelerating),
      priceLeadingStructure: bool(priceMomentum?.priceLeadingStructure),
      structureLeadingPrice: bool(priceMomentum?.structureLeadingPrice),

      bearishConfirmation,
      strongBearish: pricePoints >= 8,
      bullishCounterMove
    },

    meta: {
      panicConfirmed,
      panicEligible,
      structuralBreakdown,
      internalDeterioration,
      earlyStructuralTrigger,
      structuralPutTrigger,

      lowVolatility:
        numericValue(
          input?.vix,
          numericValue(input?.marketData?.["^VIX"], 20)
        ) < 18,

      volatilityExpansion:
        bool(input?.volatilityExpansion ?? false),

      regimeAligned:
        typeof regimeSync?.aligned === "boolean"
          ? regimeSync.aligned
          : regimeSync?.state === "ALIGNED",

      institutionalState,
      phase,
      phaseRank: phaseRank(phase),
      phaseConfidence,

      structuralScore: structurePoints,
      priceExecutionScore: pricePoints,
      contradictionScore: contradictionPoints,

      rotationDecayScore,
      rotationDecayState,
      rotationConfirmState,

      liquidityStress,
      structuralFragility,

      persistentDistribution,
      prolongedBearRegime,
      severeBearRegime,
      acceleratingWeakness,
      deterioratingBreadth,
      acceleratingBreadthDecay,
      participationErosion,
      risingCrashRisk,
      severeRisingCrashRisk,
      institutionalPressure
    },

    historyState: {
      breadthTrend,
      breadthAcceleration,
      participationDecay,

      leadershipDecay:
        num(historyMetrics.leadershipDecay),

      crashTrend:
        num(historyMetrics.crashTrend),

      phasePersistence,

      regimePersistence:
        num(historyMetrics.regimePersistence),

      relativeBreadthWeakness,

      prolongedDistribution:
        bool(historyMetrics.prolongedDistribution),

      prolongedBearRegime,
      severeBearRegime,
      broadParticipationFailure,
      severeParticipationFailure,
      deterioratingBreadth,
      acceleratingBreadthDecay,
      participationErosion,
      severeParticipationErosion,
      risingCrashRisk,
      severeRisingCrashRisk,
      persistentDistribution,
      acceleratingWeakness,
      daysInPhase,
      institutionalPressure
    },

    components: {
      phase: {
        value: phasePoints,
        max: 9
      },

      rotation: {
        value: rotationPoints,
        max: 6
      },

      crash: {
        value: 0,
        max: 6
      },

      earlyWarning: {
        value: earlyWarning?.active ? 1 : 0,
        max: 2
      },

      decay: {
        value:
          rotationDecayScore >= 80
            ? 4
            : rotationDecayScore >= 60
              ? 3
              : rotationDecayScore >= 40
                ? 2
                : rotationDecayScore >= 20
                  ? 1
                  : 0,
        max: 4
      },

      structural: {
        value: structurePoints,
        max: 20
      },

      price: {
        value: pricePoints,
        max: 14
      },

      panic: {
        value: panicPoints,
        max: 10
      },

      contradiction: {
        value: contradictionPoints,
        max: 8
      }
    }
  };
}