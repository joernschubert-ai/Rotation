// /lib/engine/liquidityEngine.ts

export interface LiquidityEngineInput {
  history?: any[];
  historyMetrics?: any;
  marketDrivers?: any;
  systemHeat?: any;
  driversCore?: any;

  marketLiquidityScore?: number;
  gammaExposure?: number;
  creditRatio?: number;
  vixTermRatio?: number;
  volOfVolRatio?: number;
  marketData?: any;

  breadth50?: number;
  breadth200?: number;
  correlationScore?: number;
  participationScore?: number;

  rsSmall?: number;
  rsEqual?: number;
  rsGrowth?: number;

  rotationScore?: number;
  rotationDecayScore?: number;
  rotationDecayState?: string;
  fragilityScore?: number;

  hiddenDistribution?: boolean;
  participationCollapse?: boolean;
}

export interface LiquidityEngineOutput {
  // HIGH = supportive liquidity; LOW = stress.
  score: number;

  state:
    | "ABUNDANT"
    | "SUPPORTIVE"
    | "NEUTRAL"
    | "TIGHTENING"
    | "LIQUIDITY_STRESS";

  liquidityState:
    | "BROAD"
    | "PASSIVE"
    | "NARROW"
    | "FRAGILE"
    | "ILLUSION";

  liquidityImpulse: number;

  support:
    | "STRONG"
    | "MODERATE"
    | "WEAK"
    | "NEGATIVE";

  fragility:
    | "LOW"
    | "ELEVATED"
    | "HIGH";

  summary: string;

  marketQuality:
    | "HEALTHY"
    | "FRAGILE"
    | "DETERIORATING"
    | "INTERNALLY_WEAK";

  institutionalLiquidity: boolean;

  marketLiquidityScore: number;
  creditRatio: number;
  gammaExposure: number;
  vixTermRatio: number;
  volOfVolRatio: number;

  components: Record<string, any>;
  dataQuality: Record<string, any>;
  metrics: Record<string, any>;
}

function numeric(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    for (const key of ["value", "current", "score"]) {
      const candidate = (value as any)[key];

      if (
        typeof candidate !== "number" &&
        typeof candidate !== "string"
      ) {
        continue;
      }

      const parsed = numeric(candidate);
      if (parsed !== null) return parsed;
    }
  }

  return null;
}

function positive(value: unknown): number | null {
  const parsed = numeric(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(
    min,
    Math.min(max, Number.isFinite(value) ? value : min)
  );
}

function read(snapshot: any, paths: string[]): number | null {
  for (const path of paths) {
    const value = path.split(".").reduce(
      (current: any, key) => current?.[key],
      snapshot
    );

    const parsed = numeric(value);
    if (parsed !== null) return parsed;
  }

  return null;
}

function change(
  current: number | null,
  previous: number | null
): number {
  return current !== null && previous !== null
    ? current - previous
    : 0;
}

export function liquidityEngine(
  input: LiquidityEngineInput
): LiquidityEngineOutput {
  const data = input ?? {};

  const measured = {
    liquidity: numeric(data.marketLiquidityScore),
    gamma: numeric(data.gammaExposure),
    credit: positive(data.creditRatio),
    vixTerm: positive(data.vixTermRatio),
    volOfVol: positive(data.volOfVolRatio),

    breadth50: numeric(data.breadth50),
    breadth200: numeric(data.breadth200),
    correlation: numeric(data.correlationScore),
    vix: positive(data.marketData?.["^VIX"]),

    participation: numeric(data.participationScore),
    rsSmall: positive(data.rsSmall),
    rsEqual: positive(data.rsEqual),
    rsGrowth: positive(data.rsGrowth),

    rotation: numeric(data.rotationScore),
    decay: numeric(data.rotationDecayScore),
    fragility: numeric(data.fragilityScore)
  };

  const liquidity = clamp(measured.liquidity ?? 50);
  const rawGamma = measured.gamma ?? 0;
  const credit = measured.credit ?? 1;
  const vixTerm = measured.vixTerm ?? 1;
  const volOfVol = measured.volOfVol ?? 1;

  const breadth50 = clamp(measured.breadth50 ?? 50);
  const breadth200 = clamp(measured.breadth200 ?? 50);
  const correlation = measured.correlation ?? 0;
  const vix = measured.vix ?? 20;

  const participationScore = clamp(
    measured.participation ?? 50
  );

  const rsSmall = measured.rsSmall ?? 1;
  const rsEqual = measured.rsEqual ?? 1;
  const rsGrowth = measured.rsGrowth ?? 1;

  const rotationScore = clamp(measured.rotation ?? 50);
  const rotationDecayScore = clamp(measured.decay ?? 0);
  const fragilityScore = clamp(measured.fragility ?? 50);

  const hiddenDistribution =
    data.hiddenDistribution === true;

  const participationCollapse =
    data.participationCollapse === true;

  const historyMetrics = data.historyMetrics ?? {};

  // Expected order: oldest daily observation first.
  const history = Array.isArray(data.history)
    ? data.history
    : Array.isArray(historyMetrics.history)
      ? historyMetrics.history
      : [];

  const h10 = history.length >= 11
    ? history[history.length - 11]
    : null;

  const h20 = history.length >= 21
    ? history[history.length - 21]
    : null;

  const marketDrivers = data.marketDrivers ?? {};
  const driversCore = data.driversCore ?? {};

  const passiveFlowRisk = clamp(
    numeric(marketDrivers.passiveFlowRisk) ?? 0
  );

  const dealerCompressionRaw = clamp(
    numeric(marketDrivers.dealerCompression) ?? 0
  );

  // SystemHeat components use -2..2, neutral 0.
  // This remains a diagnostic, not a score contribution.
  const systemHeatCredit =
    numeric(data.systemHeat?.components?.credit) ?? 0;

  // DriversCore uses a constructive 0..100 scale.
  // Keep the environmental modifier small and centered.
  const driversLiquidity = clamp(
    numeric(driversCore.score) ?? 50
  );

  const driversModifier =
    clamp((driversLiquidity - 50) / 5, -10, 10) * 0.20;

  const persistenceValue = numeric(
    historyMetrics.liquidityPersistence
  );

  const averageValue = numeric(
    historyMetrics.averageLiquidity
  );

  const missingLiquidity = numeric(
    historyMetrics.dataQuality?.missingValues?.liquidity
  );

  const dailyCount = numeric(
    historyMetrics.dataQuality?.dailyObservations
  );

  const measuredHistory = dailyCount === null
    ? history.length > 0
    : dailyCount > 0 &&
      (
        missingLiquidity === null ||
        missingLiquidity < dailyCount
      );

  const averageAvailable =
    averageValue !== null && measuredHistory;

  const persistenceAvailable =
    persistenceValue !== null && measuredHistory;

  const liquidityPersistence = clamp(
    persistenceValue ?? 50
  );

  const averageLiquidity = clamp(
    averageValue ?? liquidity
  );

  const institutionalPressure = clamp(
    numeric(historyMetrics.institutionalPressure) ?? 0
  );

  /*
   * Compare raw headline liquidity with past raw headline
   * liquidity. The derived liquidity.score is a different
   * quantity and must not replace missing raw observations.
   */
  const rawPaths = [
    "liquidity.metrics.liquidity",
    "liquidity.marketLiquidityScore",
    "marketLiquidityScore",
    "liquidity.rawLiquidity"
  ];

  const liquidity10 = read(h10, rawPaths);
  const liquidity20 = read(h20, rawPaths);

  const credit10 = positive(
    read(h10, [
      "liquidity.metrics.credit",
      "liquidity.creditRatio",
      "creditRatio"
    ])
  );

  const gamma10 = read(h10, [
    "gamma.gammaExposure",
    "liquidity.metrics.gamma",
    "gammaExposure"
  ]);

  const breadth10 = read(h10, [
    "structure.breadth.b50",
    "breadth50"
  ]);

  const liquidityTrend = change(
    measured.liquidity,
    liquidity10
  );

  const creditTrend = change(
    measured.credit,
    credit10
  );

  const gammaTrend = change(
    measured.gamma,
    gamma10
  );

  const breadthTrend = change(
    measured.breadth50,
    breadth10
  );

  const accelerationAvailable =
    measured.liquidity !== null &&
    liquidity10 !== null &&
    liquidity20 !== null;

  const liquidityAcceleration = accelerationAvailable
    ? liquidityTrend - (liquidity10! - liquidity20!)
    : 0;

  /*
   * Existing credit interpretation retained.
   * Its producer contract still requires verification.
   */
  const stableCredit =
    measured.credit !== null && credit <= 0.95;

  const stressedCredit =
    measured.credit !== null && credit >= 1.10;

  const severeCreditStress =
    measured.credit !== null && credit >= 1.20;

  /*
   * Backend definition: VIX / VIX3M.
   * Low ratio = calm front end.
   * High ratio = front-end volatility stress.
   */
  const healthyTermStructure =
    measured.vixTerm !== null && vixTerm < 0.90;

  const fragileTermStructure =
    measured.vixTerm !== null && vixTerm >= 1.05;

  const backwardation =
    measured.vixTerm !== null && vixTerm > 1;

  const severeTermStress =
    measured.vixTerm !== null && vixTerm >= 1.15;

  const supportiveBreadth =
    breadth50 >= 60 && breadth200 >= 55;

  const weakBreadth =
    breadth50 < 45 || breadth200 < 40;

  const breadthFailure =
    breadth50 < 45 && breadth200 < 45;

  // Preserve the existing liquidity-specific thresholds.
  const narrowLeadership =
    rsGrowth > 1.03 &&
    rsSmall < 0.99 &&
    rsEqual < 0.99;

  const megaCapOnlyTape =
    rsGrowth > 1.05 &&
    rsSmall < 0.97 &&
    rsEqual < 0.97;

  const equalWeightWeakness = rsEqual < 0.99;
  const smallCapWeakness = rsSmall < 0.99;

  const weakParticipation = participationScore < 50;
  const severeRotationDecay = rotationDecayScore >= 60;

  const calmTerm =
    measured.vixTerm !== null && vixTerm <= 1;

  let structuralGammaFloor = 0;

  if (
    measured.vix !== null &&
    vix < 20 &&
    calmTerm
  ) {
    structuralGammaFloor = 35;
  }

  if (
    measured.vix !== null &&
    vix < 18 &&
    calmTerm &&
    narrowLeadership
  ) {
    structuralGammaFloor = 45;
  }

  if (
    measured.vix !== null &&
    vix < 17 &&
    calmTerm &&
    breadth50 < 55 &&
    narrowLeadership
  ) {
    structuralGammaFloor = 55;
  }

  const effectiveGamma = Math.max(
    rawGamma,
    structuralGammaFloor
  );

  const passiveFragility =
    liquidity >= 65 &&
    vix < 18 &&
    (
      weakParticipation ||
      narrowLeadership ||
      severeRotationDecay
    );

  const liquidityIllusion =
    liquidity >= 70 &&
    (
      megaCapOnlyTape ||
      narrowLeadership
    ) &&
    breadthFailure &&
    weakParticipation;

  const dealerCompression =
    effectiveGamma >= 35 &&
    vix < 18 &&
    measured.correlation !== null &&
    correlation < 3 &&
    weakParticipation;

  const qualityComponents: Record<string, number> = {
    base: 60,

    participation:
      (participationScore - 50) * 0.25,

    rotation:
      (rotationScore - 50) * 0.15,

    breadth:
      (breadth50 - 50) * 0.15,

    headline:
      (liquidity - 50) * 0.10,

    drivers:
      driversModifier,

    leadership:
      (narrowLeadership ? -8 : 0) +
      (megaCapOnlyTape ? -10 : 0) +
      (equalWeightWeakness ? -4 : 0) +
      (smallCapWeakness ? -4 : 0),

    externalFlags:
      (participationCollapse ? -14 : 0) +
      (hiddenDistribution ? -12 : 0),

    compression:
      (liquidityIllusion ? -15 : 0) +
      (passiveFragility ? -8 : 0) +
      (dealerCompression ? -6 : 0),

    trends:
      (liquidityTrend < -8 ? -5 : 0) +
      (breadthTrend < -8 ? -5 : 0) +
      (
        gammaTrend < -15 && breadthTrend < 0
          ? -4
          : 0
      ),

    history:
      (
        persistenceAvailable &&
        liquidityPersistence < 40
          ? -6
          : 0
      ) +
      (
        averageAvailable &&
        averageLiquidity < 60
          ? -4
          : 0
      ) +
      (institutionalPressure > 55 ? -5 : 0),

    passiveFlow:
      passiveFlowRisk > 25 ? -6 : 0
  };

  const qualityUnclamped = Object.values(
    qualityComponents
  ).reduce((sum, value) => sum + value, 0);

  const marketQualityScore = clamp(
    Math.round(qualityUnclamped)
  );

  const marketQuality: LiquidityEngineOutput["marketQuality"] =
    liquidityIllusion ||
    participationCollapse ||
    (
      breadthFailure &&
      weakParticipation &&
      narrowLeadership
    )
      ? "INTERNALLY_WEAK"
      : marketQualityScore < 45
        ? "DETERIORATING"
        : marketQualityScore >= 70 &&
          !weakParticipation &&
          !narrowLeadership
          ? "HEALTHY"
          : "FRAGILE";

  const scoreComponents: Record<string, number> = {
    base: 50,

    headline:
      (liquidity - 50) * 0.55,

    credit:
      (
        stableCredit
          ? 10
          : stressedCredit
            ? -10
            : 0
      ) +
      (severeCreditStress ? -8 : 0),

    term:
      (healthyTermStructure ? 6 : 0) +
      (fragileTermStructure ? -8 : 0) +
      (severeTermStress ? -8 : 0),

    gamma:
      rawGamma < -5
        ? -10
        : rawGamma > 5 && !dealerCompression
          ? 5
          : 0,

    breadth:
      weakBreadth ? -5 : 0,

    liquidityTrend:
      (liquidityTrend < -8 ? -5 : 0) +
      (liquidityTrend < -20 ? -5 : 0),

    acceleration:
      (liquidityAcceleration < -8 ? -4 : 0) +
      (liquidityAcceleration < -15 ? -4 : 0),

    creditTrend:
      (creditTrend > 0.08 ? -4 : 0) +
      (creditTrend > 0.15 ? -4 : 0),

    combinedInternals:
      narrowLeadership && weakParticipation
        ? -10
        : 0,

    compression:
      liquidityIllusion
        ? -18
        : passiveFragility
          ? -10
          : dealerCompression
            ? -8
            : 0,

    qualityOverlay:
      marketQuality === "INTERNALLY_WEAK"
        ? -10
        : marketQuality === "DETERIORATING"
          ? -6
          : 0,

    history:
      (
        persistenceAvailable &&
        liquidityPersistence < 40
          ? -4
          : 0
      ) +
      (
        averageAvailable &&
        averageLiquidity < 60
          ? -3
          : 0
      ) +
      (institutionalPressure > 55 ? -4 : 0),

    passiveFlow:
      passiveFlowRisk > 25 ? -5 : 0,

    dealerDiagnostic:
      dealerCompressionRaw > 40 ? -4 : 0
  };

  const unclampedScore = Object.values(
    scoreComponents
  ).reduce((sum, value) => sum + value, 0);

  const score = clamp(
    Math.round(unclampedScore)
  );

  const state: LiquidityEngineOutput["state"] =
    score >= 80
      ? "ABUNDANT"
      : score >= 65
        ? "SUPPORTIVE"
        : score >= 48
          ? "NEUTRAL"
          : score >= 30
            ? "TIGHTENING"
            : "LIQUIDITY_STRESS";

  const liquidityState: LiquidityEngineOutput["liquidityState"] =
    liquidityIllusion
      ? "ILLUSION"
      : breadthFailure ||
        (
          weakParticipation &&
          score < 50
        )
        ? "FRAGILE"
        : narrowLeadership ||
          (
            equalWeightWeakness &&
            smallCapWeakness
          )
          ? "NARROW"
          : supportiveBreadth &&
            participationScore >= 60 &&
            score >= 60
            ? "BROAD"
            : "PASSIVE";

  const support: LiquidityEngineOutput["support"] =
    score >= 75
      ? "STRONG"
      : score >= 58
        ? "MODERATE"
        : score >= 40
          ? "WEAK"
          : "NEGATIVE";

  const fragility: LiquidityEngineOutput["fragility"] =
    liquidityIllusion ||
    passiveFragility ||
    dealerCompression ||
    marketQuality === "INTERNALLY_WEAK"
      ? "HIGH"
      : score < 48 ||
        marketQuality === "FRAGILE" ||
        narrowLeadership
        ? "ELEVATED"
        : "LOW";

  const required = [
    "liquidity",
    "credit",
    "vixTerm",
    "breadth50",
    "breadth200",
    "participation",
    "rsSmall",
    "rsEqual",
    "rsGrowth"
  ] as const;

  const missingInputs = Object.entries(measured)
    .filter(([, value]) => value === null)
    .map(([key]) => key);

  const completeContext = required.every(
    key => measured[key] !== null
  );

  const institutionalLiquidity =
    completeContext &&
    score >= 65 &&
    stableCredit &&
    healthyTermStructure &&
    participationScore >= 55 &&
    !weakBreadth &&
    !narrowLeadership &&
    liquidityPersistence >= 45 &&
    !liquidityIllusion &&
    !passiveFragility;

  let summary =
    liquidityState === "BROAD"
      ? "Broad institutional liquidity participation"
      : liquidityState === "NARROW"
        ? "Liquidity concentrated in narrow market leadership"
        : liquidityState === "FRAGILE"
          ? "Liquidity backdrop is structurally fragile"
          : liquidityState === "ILLUSION"
            ? "Headline liquidity is masking severe internal weakness"
            : "Passive liquidity support with mixed market internals";

  if (
    dealerCompression &&
    liquidityState !== "ILLUSION"
  ) {
    summary += " | Dealer compression";
  }

  if (passiveFlowRisk >= 60) {
    summary += " | Passive flow risk elevated";
  }

  if (!completeContext) {
    summary += " | Incomplete liquidity/participation context";
  }

  return {
    score,
    state,
    liquidityState,
    liquidityImpulse: score - 50,
    support,
    fragility,
    summary,
    marketQuality,
    institutionalLiquidity,

    marketLiquidityScore: liquidity,
    creditRatio: credit,
    gammaExposure: rawGamma,
    vixTermRatio: vixTerm,
    volOfVolRatio: volOfVol,

    components: {
      score: scoreComponents,
      quality: qualityComponents,

      unclampedScore,
      qualityUnclamped,

      saturated:
        unclampedScore < 0 ||
        unclampedScore > 100,

      creditConventionVerified: false,

      termRatioDefinition:
        "VIX / VIX3M",

      weightsCalibratedByThisAudit: false
    },

    dataQuality: {
      missingInputs,
      completeContext,
      measured,

      historyOrder: "OLDEST_FIRST",

      has10ObservationWindow:
        history.length >= 11,

      has20ObservationWindow:
        history.length >= 21,

      averageAvailable,
      persistenceAvailable,

      comparisons: {
        liquidityTrend:
          measured.liquidity !== null &&
          liquidity10 !== null,

        liquidityAcceleration:
          accelerationAvailable,

        creditTrend:
          measured.credit !== null &&
          credit10 !== null,

        gammaTrend:
          measured.gamma !== null &&
          gamma10 !== null,

        breadthTrend:
          measured.breadth50 !== null &&
          breadth10 !== null
      }
    },

    metrics: {
      liquidity,
      gamma: rawGamma,
      effectiveGamma,
      structuralGammaFloor,
      credit,
      vixTerm,
      volOfVol,

      breadth50,
      breadth200,
      correlation,
      vix,

      participation: participationScore,
      rotation: rotationScore,
      decay: rotationDecayScore,
      fragility: fragilityScore,

      marketQualityScore,

      liquidityTrend,
      creditTrend,
      gammaTrend,
      breadthTrend,
      liquidityAcceleration,

      averageLiquidity,
      liquidityPersistence,
      institutionalPressure,

      passiveFlowRisk,
      dealerCompressionRaw,
      driversLiquidity,
      systemHeatCredit,

      narrowLeadership,
      weakParticipation,
      breadthFailure,
      equalWeightWeakness,
      smallCapWeakness,
      passiveFragility,
      liquidityIllusion,
      dealerCompression,

      healthyTermStructure,
      backwardation,
      severeTermStress
    }
  };
}