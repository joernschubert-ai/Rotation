// /lib/engine/breadthVelocityEngine.ts

export interface BreadthVelocityInput {
  structure?: any;

  spx?: number;
  spx5dAgo?: number;

  breadth20?: number;
  breadth20_5dAgo?: number;

  breadth50?: number;
  breadth50_5dAgo?: number;
  breadth50_10dAgo?: number;

  breadth200?: number;
  breadth200_10dAgo?: number;
  breadth200_20dAgo?: number;

  advanceDecline?: number;
  advanceDecline_5dAgo?: number;
}

export interface BreadthVelocityOutput {
  score: number;

  state:
    | "EXPANDING"
    | "STABLE"
    | "DIVERGING"
    | "DISTRIBUTION"
    | "INTERNAL_BREAKDOWN";

  institutionalDivergence: boolean;

  velocity20: number;
  velocity50: number;

  breadth50Trend: number;
  breadth50Slope: number;

  breadth200Trend: number;
  breadth200Slope: number;

  breadthParticipationDecay: number;

  breadth50Trend_10d: number;
  breadth200Trend_20d: number;

  decayPersistence: number;

  slopes: {
    b20Slope5d: number;
    b50Slope5d: number;
    b50Slope10d: number;
    b200Slope10d: number;
    b200Slope20d: number;
    adSlope5d: number;

    // Absolute SPX change in index points.
    spxSlope5d: number;

    // SPX percentage return used for divergence thresholds.
    spxChange5dPct: number;
  };

  signals: {
    shortTermWeakness: boolean;
    mediumTermWeakness: boolean;
    longTermWeakness: boolean;

    adDeterioration: boolean;

    spxBreadthDivergence: boolean;
    severeDivergence: boolean;

    rollingDistribution: boolean;
    internalBreakdown: boolean;
  };

  dataQuality: {
    complete: boolean;
    availableComparisons: number;
    totalComparisons: number;
    missingComparisons: string[];

    comparisons: {
      b20_5d: boolean;
      b50_5d: boolean;
      b50_10d: boolean;
      b200_10d: boolean;
      b200_20d: boolean;
      ad_5d: boolean;
      spx_5d: boolean;
    };
  };

  summary: string;
}

/* =====================================================
HELPERS
===================================================== */

function clamp(
  value: number,
  min = 0,
  max = 100
): number {
  return Math.max(min, Math.min(max, value));
}

/*
 * Supports finite numbers, numeric strings and wrappers.
 * Missing values, empty strings and booleans stay missing.
 * A valid zero remains zero.
 */

function finiteValue(value: any): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
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

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const candidates = [
      value.value,
      value.current,
      value.score
    ];

    for (const candidate of candidates) {
      if (
        typeof candidate !== "number" &&
        typeof candidate !== "string"
      ) {
        continue;
      }

      const parsed = finiteValue(candidate);

      if (parsed !== null) {
        return parsed;
      }
    }
  }

  return null;
}

/*
 * Existing numeric output fields retain zero as fallback.
 * Availability is reported separately in dataQuality.
 */

function difference(
  current: number | null,
  previous: number | null
): number {
  if (
    current === null ||
    previous === null
  ) {
    return 0;
  }

  const result = current - previous;

  return Number.isFinite(result)
    ? Number(result.toFixed(2))
    : 0;
}

/* =====================================================
ENGINE
===================================================== */

export function breadthVelocityEngine(
  input: BreadthVelocityInput
): BreadthVelocityOutput {
  const structure = input.structure ?? {};

  /* ===================================================
  CURRENT VALUES
  =================================================== */

  const breadth20 =
    finiteValue(input.breadth20) ??
    finiteValue(structure.breadth?.b20);

  const breadth50 =
    finiteValue(input.breadth50) ??
    finiteValue(structure.breadth?.b50);

  const breadth200 =
    finiteValue(input.breadth200) ??
    finiteValue(structure.breadth?.b200);

  const ad =
    finiteValue(input.advanceDecline) ??
    finiteValue(structure.advanceDecline);

  const spx = finiteValue(input.spx);

  /* ===================================================
  HISTORICAL VALUES

  Missing values stay missing.
  Different historical horizons are not substituted.
  =================================================== */

  const breadth20_5dAgo =
    finiteValue(input.breadth20_5dAgo);

  const breadth50_5dAgo =
    finiteValue(input.breadth50_5dAgo);

  const breadth50_10dAgo =
    finiteValue(input.breadth50_10dAgo);

  const breadth200_10dAgo =
    finiteValue(input.breadth200_10dAgo);

  const breadth200_20dAgo =
    finiteValue(input.breadth200_20dAgo);

  const ad_5dAgo =
    finiteValue(input.advanceDecline_5dAgo);

  const spx5dAgo =
    finiteValue(input.spx5dAgo);

  /* ===================================================
  DATA QUALITY
  =================================================== */

  const comparisons = {
    b20_5d:
      breadth20 !== null &&
      breadth20_5dAgo !== null,

    b50_5d:
      breadth50 !== null &&
      breadth50_5dAgo !== null,

    b50_10d:
      breadth50 !== null &&
      breadth50_10dAgo !== null,

    b200_10d:
      breadth200 !== null &&
      breadth200_10dAgo !== null,

    b200_20d:
      breadth200 !== null &&
      breadth200_20dAgo !== null,

    ad_5d:
      ad !== null &&
      ad_5dAgo !== null,

    spx_5d:
      spx !== null &&
      spx > 0 &&
      spx5dAgo !== null &&
      spx5dAgo > 0 &&
      Number.isFinite(
        ((spx / spx5dAgo) - 1) * 100
      )
  };

  const missingComparisons =
    Object.entries(comparisons)
      .filter(([, available]) => !available)
      .map(([name]) => name);

  const totalComparisons =
    Object.keys(comparisons).length;

  const dataQuality = {
    complete: missingComparisons.length === 0,

    availableComparisons:
      totalComparisons - missingComparisons.length,

    totalComparisons,
    missingComparisons,
    comparisons
  };

  /* ===================================================
  SLOPES

  Breadth changes are percentage-point differences.
  SPX percentage return is calculated separately.
  =================================================== */

  const b20Slope5d =
    difference(breadth20, breadth20_5dAgo);

  const b50Slope5d =
    difference(breadth50, breadth50_5dAgo);

  const b50Slope10d =
    difference(breadth50, breadth50_10dAgo);

  const b200Slope10d =
    difference(breadth200, breadth200_10dAgo);

  const b200Slope20d =
    difference(breadth200, breadth200_20dAgo);

  const adSlope5d =
    difference(ad, ad_5dAgo);

  const spxSlope5d =
    comparisons.spx_5d
      ? difference(spx, spx5dAgo)
      : 0;

  const spxChange5dPct =
    comparisons.spx_5d
      ? Number(
          (
            ((spx! / spx5dAgo!) - 1) * 100
          ).toFixed(4)
        )
      : 0;

  /* ===================================================
  RELATIVE BREADTH SYSTEM
  =================================================== */

  const breadth50Trend = Math.round(
    b50Slope5d * 0.6 +
    b50Slope10d * 0.4
  );

  const breadth50Slope =
    Math.round(b50Slope5d);

  const breadth200Trend = Math.round(
    b200Slope10d * 0.55 +
    b200Slope20d * 0.45
  );

  const breadth200Slope =
    Math.round(b200Slope10d);

  let breadthParticipationDecay = 0;

  if (b20Slope5d < 0) {
    breadthParticipationDecay += 3;
  }

  if (b50Slope5d < 0) {
    breadthParticipationDecay += 5;
  }

  if (adSlope5d < 0) {
    breadthParticipationDecay += 3;
  }

  breadthParticipationDecay = Math.min(
    30,
    breadthParticipationDecay
  );

  /* ===================================================
  VELOCITY
  =================================================== */

  const velocity20 =
    Math.round(b20Slope5d);

  const velocity50 =
    Math.round(b50Slope5d);

  /* ===================================================
  PERSISTENCE
  =================================================== */

  let decayPersistence = 0;

  if (b50Slope10d < 0) {
    decayPersistence += 4;
  }

  if (b200Slope10d < 0) {
    decayPersistence += 3;
  }

  if (b200Slope20d < 0) {
    decayPersistence += 3;
  }

  decayPersistence = Math.min(
    20,
    decayPersistence
  );

  /* ===================================================
  FLAGS
  =================================================== */

  const shortTermWeakness =
    b20Slope5d < -3;

  const mediumTermWeakness =
    b50Slope5d < -2;

  const longTermWeakness =
    b200Slope10d < -2;

  const adDeterioration =
    adSlope5d < 0;

  /* ===================================================
  INSTITUTIONAL DIVERGENCE

  SPX thresholds refer to percentage returns:
  > 1 means more than +1%.
  > 2 means more than +2%.
  =================================================== */

  const spxBreadthDivergence =
    comparisons.spx_5d &&
    spxChange5dPct > 1 &&
    b50Slope5d < -2;

  const severeDivergence =
    comparisons.spx_5d &&
    spxChange5dPct > 2 &&
    b50Slope5d < -3 &&
    adSlope5d < 0;

  const rollingDistribution =
    spxBreadthDivergence &&
    mediumTermWeakness &&
    adDeterioration;

  const internalBreakdown =
    b20Slope5d < -5 &&
    b50Slope5d < -4 &&
    b200Slope10d < -2 &&
    adSlope5d < 0 &&
    breadth50 !== null &&
    breadth50 < 45;

  const institutionalDivergence =
    spxBreadthDivergence ||
    rollingDistribution ||
    severeDivergence;

  /* ===================================================
  SCORE
  Existing weights retained.
  =================================================== */

  let score = 0;

  if (shortTermWeakness) {
    score += 10;
  }

  if (b20Slope5d < -6) {
    score += 8;
  }

  if (mediumTermWeakness) {
    score += 14;
  }

  if (b50Slope5d < -5) {
    score += 10;
  }

  if (longTermWeakness) {
    score += 14;
  }

  if (b200Slope10d < -5) {
    score += 10;
  }

  if (adDeterioration) {
    score += 10;
  }

  if (adSlope5d < -150) {
    score += 8;
  }

  if (spxBreadthDivergence) {
    score += 12;
  }

  if (severeDivergence) {
    score += 12;
  }

  if (rollingDistribution) {
    score += 10;
  }

  if (internalBreakdown) {
    score += 15;
  }

  score += Math.round(
    breadthParticipationDecay * 0.7
  );

  score += Math.round(
    decayPersistence * 0.9
  );

  score = clamp(Math.round(score));

  /* ===================================================
  MEASURED EXPANSION

  A low deterioration score alone does not prove
  expansion. Require available breadth comparisons
  and observed short-term improvement.
  =================================================== */

  const breadthComparisonsComplete =
    comparisons.b20_5d &&
    comparisons.b50_5d &&
    comparisons.b50_10d &&
    comparisons.b200_10d &&
    comparisons.b200_20d;

  const measuredExpansion =
    breadthComparisonsComplete &&
    b20Slope5d > 0 &&
    b50Slope5d > 0 &&
    b50Slope10d >= 0 &&
    b200Slope10d >= 0 &&
    b200Slope20d >= 0;

  /* ===================================================
  STATE

  STABLE with incomplete data is a compatibility
  fallback. Check dataQuality before interpreting it
  as a confirmed market condition.
  =================================================== */

  let state: BreadthVelocityOutput["state"];

  if (score >= 75) {
    state = "INTERNAL_BREAKDOWN";
  } else if (score >= 55) {
    state = "DISTRIBUTION";
  } else if (score >= 35) {
    state = "DIVERGING";
  } else if (score >= 15) {
    state = "STABLE";
  } else {
    state = measuredExpansion
      ? "EXPANDING"
      : "STABLE";
  }

  /* ===================================================
  SUMMARY
  =================================================== */

  let summary =
    "No significant deterioration in available comparisons";

  if (state === "EXPANDING") {
    summary = "Measured breadth expansion";
  }

  if (
    state === "STABLE" &&
    dataQuality.complete
  ) {
    summary =
      "Breadth stable with minor internal rotation";
  }

  if (state === "DIVERGING") {
    summary = institutionalDivergence
      ? "SPX advancing while breadth deteriorates"
      : "Elevated breadth deterioration without confirmed SPX divergence";
  }

  if (state === "DISTRIBUTION") {
    summary =
      "Distribution-level breadth deterioration";
  }

  if (state === "INTERNAL_BREAKDOWN") {
    summary =
      "Severe breadth deterioration";
  }

  if (!dataQuality.complete) {
    summary +=
      ` | Incomplete data: ${dataQuality.availableComparisons}/${totalComparisons} comparisons available`;
  }

  /* ===================================================
  RETURN
  =================================================== */

  return {
    score,
    state,
    institutionalDivergence,

    velocity20,
    velocity50,

    breadth50Trend,
    breadth50Slope,

    breadth200Trend,
    breadth200Slope,

    breadthParticipationDecay,

    breadth50Trend_10d: b50Slope10d,
    breadth200Trend_20d: b200Slope20d,

    decayPersistence,

    slopes: {
      b20Slope5d,
      b50Slope5d,
      b50Slope10d,
      b200Slope10d,
      b200Slope20d,
      adSlope5d,
      spxSlope5d,
      spxChange5dPct
    },

    signals: {
      shortTermWeakness,
      mediumTermWeakness,
      longTermWeakness,

      adDeterioration,

      spxBreadthDivergence,
      severeDivergence,

      rollingDistribution,
      internalBreakdown
    },

    dataQuality,
    summary
  };
}