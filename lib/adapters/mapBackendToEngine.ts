// /lib/adapters/mapBackendToEngine.ts

function finiteNumber(value: any): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function numberOr(value: any, fallback: number): number {
  return finiteNumber(value) ?? fallback;
}

function positiveNumber(value: any): number | null {
  const parsed = finiteNumber(value);

  return parsed !== null && parsed > 0
    ? parsed
    : null;
}

export function mapBackendToEngine(data: any) {
  if (!data) return null;

  const marketData = data.marketData ?? {};

  function instrument(symbol: string) {
    const source = marketData[symbol] ?? {};

    return {
      value: positiveNumber(source.current),
      change: finiteNumber(source.change),
    };
  }

  function index(symbol: string) {
    return {
      ...instrument(symbol),
      priceMetrics: marketData[symbol] ?? {},
    };
  }

  const indices = {
    dow: index("^DJI"),
    ndx: index("^NDX"),
    spx: index("^GSPC"),
    rut: index("^RUT"),
  };

  const futures = {
    ym: instrument("YM=F"),
    nq: instrument("NQ=F"),
    es: instrument("ES=F"),
    rty: instrument("RTY=F"),
  };

  // Backend relative-performance differences arrive as decimals.
  function toRatio(value: any): number | null {
    const delta = finiteNumber(value);

    if (delta === null) return null;

    const ratio = 1 + delta;

    return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
  }

  const details = data.rotationDetails ?? {};

  const rsSmall = toRatio(details.rsSmall20);
  const rsGrowth = toRatio(details.rsGrowth20);

  // RSP minus SPY performance arrives in percentage points.
  const concentrationDivergence = finiteNumber(details.concentrationDivergence);

  const rsEqual = concentrationDivergence === null ? null : 1 + concentrationDivergence / 100;

  // Convert the discrete backend level 0..3 exactly once.
  const rawConcentration = finiteNumber(
    details.concentrationScore
  );

  const concentrationAvailable =
    rawConcentration !== null &&
    Number.isInteger(rawConcentration) &&
    rawConcentration >= 0 &&
    rawConcentration <= 3;

  const concentrationScoreRaw =
    concentrationAvailable ? rawConcentration : null;

  const concentrationScore =
    concentrationScoreRaw === null
      ? null
      : (concentrationScoreRaw / 3) * 100;

  const rotation = {
    rsSmall,
    rsGrowth,
    rsEqual,
    signal: data.rotationSignal ?? "none",
    strength: numberOr(data.rotationStrength, 0),
  };

  const moveIndex = positiveNumber(data.moveIndex);
  const vixTermRatio = positiveNumber(data.vixTermRatio);
  const volOfVolRatio = positiveNumber(data.volOfVolRatio);
  const skewRatio = positiveNumber(data.optionsSkewRatio);

  /*
   * Preserve distinct credit quantities:
   *
   * creditRatio:
   *   Raw HYG / IEF price ratio.
   *
   * creditRatioMA50:
   *   Its own 50-observation moving average.
   *
   * creditRatioToMA50:
   *   Raw ratio divided by its own moving average.
   *   Above 1 = constructive relative performance.
   *   Below 1 = defensive relative performance.
   *
   * Do not silently substitute one quantity for another.
   */
  const creditRatio = positiveNumber(data.creditRatio);

  const creditRatioMA50 = positiveNumber(
    data.creditRatioMA50
  );

  const creditRatioToMA50 = positiveNumber(
    data.creditRatioToMA50
  );

  // Zero distance is a valid observation.
  const creditDistancePct = finiteNumber(
    data.creditDistancePct
  );

  const sourceCreditQuality =
    data.creditDataQuality &&
    typeof data.creditDataQuality === "object" &&
    !Array.isArray(data.creditDataQuality)
      ? data.creditDataQuality
      : {};

  const creditValues = {
    creditRatio,
    creditRatioMA50,
    creditRatioToMA50,
    creditDistancePct,
  };

  const missingCreditInputs = Object.entries(creditValues)
    .filter(([, value]) => value === null)
    .map(([key]) => key);

  const creditAvailable =
    sourceCreditQuality.available !== false &&
    missingCreditInputs.length === 0;

  const suppliedCreditSignal =
    typeof data.creditSignal === "string"
      ? data.creditSignal.toLowerCase()
      : "unknown";

  const creditSignal =
    creditAvailable &&
    ["risk_on", "risk_off", "neutral"].includes(suppliedCreditSignal)
      ? suppliedCreditSignal
      : "unknown";

  const creditDataQuality = {
    ...sourceCreditQuality,

    available: creditAvailable,
    rawRatioAvailable: creditRatio !== null,
    missingInputs: missingCreditInputs,

    ratioDefinition: "HYG / IEF",

    normalizedDefinition:
      "(HYG / IEF) / MA50(HYG / IEF)",

    dateAlignmentVerified:
      sourceCreditQuality.dateAlignmentVerified === true,
  };

  // Preserve the producer's universe identity and coverage diagnostics.
  // Missing legacy metadata must not be assigned the current universe version.
  const sourceBreadthQuality =
    data.breadthDataQuality &&
    typeof data.breadthDataQuality === "object" &&
    !Array.isArray(data.breadthDataQuality)
      ? data.breadthDataQuality
      : null;

  const breadthDataQuality = sourceBreadthQuality
    ? {
        ...sourceBreadthQuality,
        universeVersion:
          typeof sourceBreadthQuality.universeVersion === "string" &&
          sourceBreadthQuality.universeVersion.trim() !== ""
            ? sourceBreadthQuality.universeVersion
            : null,
      }
    : null;

  return {
    rotation,
    breadthDataQuality,

    marketLiquidityScore:
      finiteNumber(data.marketLiquidityScore),

    gammaExposure:
      numberOr(data.gammaExposure, 0),
    gammaDataQuality: data.gammaDataQuality ?? null,

    creditRatio,
    creditRatioMA50,
    creditRatioToMA50,
    creditDistancePct,
    creditSignal,
    creditDataQuality,

    moveIndex,
    vixTermRatio,
    volOfVolRatio,
    skewRatio,

    crash: {
      score: numberOr(data.marketStressScore, 0),
      probability: numberOr(data.crashProbability, 0),
      momentum: numberOr(data.crashMomentum, 0),
    },

    breadth20: finiteNumber(data.breadth20),
    breadth50: finiteNumber(data.breadth50),
    breadth200: finiteNumber(data.breadth200),

    advanceDecline: numberOr(data.advanceDecline, 0),
    advances: numberOr(data.advances, 0),
    declines: numberOr(data.declines, 0),

    newHighs: numberOr(data.newHighs, 0),
    newLows: numberOr(data.newLows, 0),

    distributionScore:
      numberOr(data.distributionScore, 0),

    concentrationScore,
    concentrationScoreRaw,

    concentrationMeta: {
      sourceScale: "0..3",
      targetScale: "0..100",
      sourceAvailable: concentrationAvailable,
      normalization: "raw / 3 * 100",
    },

    correlationScore:
      numberOr(data.correlationScore, 0),

    liquidityVacuumScore:
      numberOr(data.liquidityVacuumScore, 0),

    marketData,
    indices,
    futures,

    historyMetrics: data.historyMetrics ?? {},
  };
}
