// /lib/engine/shared/marketStructureFlags.ts

/* =====================================================
NUMERIC HELPERS

Supports numbers, numeric strings and wrapped values.
Missing or invalid values use the existing fallback.
A measured zero remains zero.
===================================================== */

function numericValue(
  value: unknown
): number | null {
  const candidates =
    value && typeof value === "object"
      ? [
          (value as any).value,
          (value as any).score,
          (value as any).current
        ]
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

function firstNumber(
  fallback: number,
  ...values: unknown[]
): number {
  for (const value of values) {
    const parsed = numericValue(value);

    if (parsed !== null) {
      return parsed;
    }
  }

  return fallback;
}

export function getMarketStructureFlags(data: any) {
  const input = data ?? {};

  /* =====================================================
  INPUTS
  ===================================================== */

  const rsGrowth = firstNumber(
    1,
    input.rsGrowth,
    input.rotation?.rsGrowth
  );

  const rsSmall = firstNumber(
    1,
    input.rsSmall,
    input.rotation?.rsSmall
  );

  const rsEqual = firstNumber(
    1,
    input.rsEqual,
    input.rotation?.rsEqual
  );

  const participationScore = firstNumber(
    50,
    input.participationScore,
    input.participation?.score
  );

  const breadth20 = firstNumber(
    50,
    input.breadth20,
    input.structure?.breadth?.b20
  );

  const breadth50 = firstNumber(
    50,
    input.breadth50,
    input.structure?.breadth?.b50
  );

  const breadth200 = firstNumber(
    50,
    input.breadth200,
    input.structure?.breadth?.b200
  );

  const ad = firstNumber(
    0,
    input.ad,
    input.structure?.advanceDecline
  );

  const highs = firstNumber(
    0,
    input.highs,
    input.structure?.highsLows?.highs
  );

  const lows = firstNumber(
    0,
    input.lows,
    input.structure?.highsLows?.lows
  );

  const distributionScore = firstNumber(
    0,
    input.distributionScore,
    input.structure?.distribution
  );

  const rotationScore = firstNumber(
    50,
    input.rotationScore,
    input.rotation?.score
  );

  /* =====================================================
  RELATIVE STRENGTH DELTAS
  ===================================================== */

  const dGrowth = rsGrowth - 1;
  const dSmall = 1 - rsSmall;
  const dEqual = 1 - rsEqual;

  /* =====================================================
  LEADERSHIP FLAGS
  ===================================================== */

  const narrowLeadership =
    rsGrowth > 1.02 &&
    rsSmall < 0.98 &&
    rsEqual < 0.985;

  const severeNarrowLeadership =
    rsGrowth > 1.04 &&
    rsSmall < 0.95 &&
    rsEqual < 0.97;

  /* =====================================================
  MEGA CAP DOMINANCE
  ===================================================== */

  const megaCapDominance =
    dGrowth > 0.03 &&
    dSmall > 0.025 &&
    dEqual > 0.015;

  const severeMegaCapDominance =
    dGrowth > 0.05 &&
    dSmall > 0.04 &&
    dEqual > 0.03;

  /* =====================================================
  RELATIVE STRUCTURE
  ===================================================== */

  const equalWeightWeakness =
    rsEqual < 0.985;

  const severeEqualWeightWeakness =
    rsEqual < 0.97;

  const smallCapWeakness =
    rsSmall < 0.98;

  const severeSmallCapWeakness =
    rsSmall < 0.95;

  /* =====================================================
  PARTICIPATION FLAGS
  ===================================================== */

  const weakParticipation =
    participationScore < 50;

  const collapsingParticipation =
    participationScore < 35;

  /* =====================================================
  BREADTH FAILURE
  ===================================================== */

  const breadthFailure =
    breadth50 < 55 ||
    breadth200 < 50 ||
    (
      breadth50 < 58 &&
      participationScore < 45
    );

  const severeBreadthFailure =
    breadth50 < 45 &&
    breadth200 < 40;

  /* =====================================================
  INTERNAL DETERIORATION
  ===================================================== */

  const internalDeterioration =
    ad < -25 ||
    (
      breadth50 < 55 &&
      participationScore < 45
    );

  const severeInternalDeterioration =
    ad < -80 &&
    participationScore < 35;

  /* =====================================================
  HIGH / LOW STRUCTURE
  ===================================================== */

  const highLowDelta =
    highs - lows;

  const highLowFailure =
    highLowDelta < 0;

  const severeHighLowFailure =
    highLowDelta < -20;

  /* =====================================================
  HIDDEN DISTRIBUTION
  ===================================================== */

  const hiddenDistribution =
    narrowLeadership &&
    (
      equalWeightWeakness ||
      smallCapWeakness
    ) &&
    breadth50 > 55 &&
    distributionScore >= 2;

  /* =====================================================
  ROTATIONAL EXHAUSTION
  ===================================================== */

  const rotationalExhaustion =
    rotationScore < 35 &&
    narrowLeadership;

  const severeRotationalExhaustion =
    rotationScore < 25 &&
    severeNarrowLeadership;

  /* =====================================================
  HEALTHY STATES
  ===================================================== */

  const healthyBreadth =
    breadth50 > 60 &&
    breadth200 > 55;

  const strongBreadth =
    breadth50 > 70 &&
    breadth200 > 65;

  const healthyParticipation =
    participationScore > 60;

  /* =====================================================
  SUMMARY STATE
  ===================================================== */

  let structureState = "BALANCED";

  if (
    narrowLeadership ||
    weakParticipation ||
    breadthFailure
  ) {
    structureState = "FRAGILE";
  }

  if (
    severeNarrowLeadership ||
    collapsingParticipation ||
    severeBreadthFailure
  ) {
    structureState = "BREAKDOWN";
  }

  /* =====================================================
  RETURN
  ===================================================== */

  return {
    narrowLeadership,
    severeNarrowLeadership,

    megaCapDominance,
    megaCapOnlyTape: megaCapDominance,
    severeMegaCapDominance,

    equalWeightWeakness,
    severeEqualWeightWeakness,

    smallCapWeakness,
    severeSmallCapWeakness,

    weakParticipation,
    collapsingParticipation,
    healthyParticipation,

    breadthFailure,
    severeBreadthFailure,
    healthyBreadth,
    strongBreadth,

    internalDeterioration,
    severeInternalDeterioration,

    hiddenDistribution,

    highLowFailure,
    severeHighLowFailure,
    highLowDelta,

    rotationalExhaustion,
    severeRotationalExhaustion,

    structureState,

    metrics: {
      rsGrowth,
      rsSmall,
      rsEqual,

      breadth20,
      breadth50,
      breadth200,

      participationScore,

      ad,
      highs,
      lows,

      distributionScore,
      rotationScore
    }
  };
}