// /lib/adapters/mapBackendToEngine.ts

/* =====================================================
NUMERIC HELPERS
===================================================== */

function finiteNumber(value: any): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return null;
}

function numberOr(
  value: any,
  fallback: number
): number {
  return finiteNumber(value) ?? fallback;
}

/* =====================================================
ADAPTER
===================================================== */

export function mapBackendToEngine(data: any) {
  if (!data) return null;

  const marketData = data.marketData ?? {};

  /* ===================================================
  INSTRUMENT HELPERS
  =================================================== */

  function instrument(symbol: string) {
    const source = marketData[symbol] ?? {};

    return {
      value: numberOr(source.current, 0),
      change: numberOr(source.change, 0)
    };
  }

  function index(symbol: string) {
    return {
      ...instrument(symbol),
      priceMetrics: marketData[symbol] ?? {}
    };
  }

  /* ===================================================
  INDICES
  =================================================== */

  const indices = {
    dow: index("^DJI"),
    ndx: index("^NDX"),
    spx: index("^GSPC"),
    rut: index("^RUT")
  };

  /* ===================================================
  FUTURES
  =================================================== */

  const futures = {
    ym: instrument("YM=F"),
    nq: instrument("NQ=F"),
    es: instrument("ES=F"),
    rty: instrument("RTY=F")
  };

  /* ===================================================
  RELATIVE STRENGTH

  Backend relative-performance differences arrive
  as decimals.

  Existing centered representation:
  0.039 -> 1.039
  =================================================== */

  function toRatio(value: any): number {
    const delta = finiteNumber(value);

    if (delta === null) {
      return 1;
    }

    const ratio = 1 + delta;

    return Number.isFinite(ratio)
      ? ratio
      : 1;
  }

  const details = data.rotationDetails ?? {};

  const rsSmall =
    toRatio(details.rsSmall20);

  const rsGrowth =
    toRatio(details.rsGrowth20);

  /*
   * concentrationDivergence is:
   *
   * RSP return minus SPY return,
   * expressed in percentage points.
   *
   * Therefore divide by 100 here.
   */

  const concentrationDivergence = numberOr(
    details.concentrationDivergence,
    0
  );

  const rsEqual =
    1 + concentrationDivergence / 100;

  /* ===================================================
  CONCENTRATION NORMALIZATION

  Backend score:
  discrete levels 0, 1, 2, 3.

  Engine risk scale:
  0..100.

  Linear mapping:
  0 -> 0
  1 -> 33.333...
  2 -> 66.666...
  3 -> 100

  Normalize once at this boundary.
  Do not normalize this value again in the engines.
  =================================================== */

  const rawConcentration =
    finiteNumber(details.concentrationScore);

  const concentrationAvailable =
    rawConcentration !== null &&
    Number.isInteger(rawConcentration) &&
    rawConcentration >= 0 &&
    rawConcentration <= 3;

  const concentrationScoreRaw =
    concentrationAvailable
      ? rawConcentration
      : null;

  const concentrationScore =
    concentrationScoreRaw === null
      ? 0
      : (concentrationScoreRaw / 3) * 100;

  /* ===================================================
  ROTATION
  =================================================== */

  const rotation = {
    rsSmall,
    rsGrowth,
    rsEqual,

    signal:
      data.rotationSignal ?? "none",

    strength:
      numberOr(data.rotationStrength, 0)
  };

  /* ===================================================
  MARKET DRIVERS

  Existing fallback values and ratio units retained.
  =================================================== */

  const moveIndex =
    numberOr(data.moveIndex, 0);

  const vixTermRatio =
    numberOr(data.vixTermRatio, 1);

  const volOfVolRatio =
    numberOr(data.volOfVolRatio, 1);

  const skewRatio =
    numberOr(data.optionsSkewRatio, 100);

  /* ===================================================
  RETURN
  =================================================== */

  return {
    rotation,

    /* CORE INPUTS */

    marketLiquidityScore:
      numberOr(data.marketLiquidityScore, 0),

    gammaExposure:
      numberOr(data.gammaExposure, 0),

    creditRatio:
      numberOr(data.creditRatio, 0),

    /* MARKET DRIVERS */

    moveIndex,
    vixTermRatio,
    volOfVolRatio,
    skewRatio,

    /* CRASH */

    crash: {
      score:
        numberOr(data.marketStressScore, 0),

      probability:
        numberOr(data.crashProbability, 0),

      momentum:
        numberOr(data.crashMomentum, 0)
    },

    /* BREADTH */

    breadth20:
      numberOr(data.breadth20, 0),

    breadth50:
      numberOr(data.breadth50, 0),

    breadth200:
      numberOr(data.breadth200, 0),

    /* ADVANCE / DECLINE */

    advanceDecline:
      numberOr(data.advanceDecline, 0),

    advances:
      numberOr(data.advances, 0),

    declines:
      numberOr(data.declines, 0),

    /* HIGHS / LOWS */

    newHighs:
      numberOr(data.newHighs, 0),

    newLows:
      numberOr(data.newLows, 0),

    /* DISTRIBUTION / CONCENTRATION */

    distributionScore:
      numberOr(data.distributionScore, 0),

    concentrationScore,
    concentrationScoreRaw,

    concentrationMeta: {
      sourceScale: "0..3",
      targetScale: "0..100",
      sourceAvailable: concentrationAvailable,
      normalization: "raw / 3 * 100"
    },

    /* OTHER STRUCTURAL INPUTS */

    correlationScore:
      numberOr(data.correlationScore, 0),

    liquidityVacuumScore:
      numberOr(data.liquidityVacuumScore, 0),

    /* MARKET REFERENCES */

    marketData,
    indices,
    futures,

    historyMetrics:
      data.historyMetrics ?? {}
  };
}