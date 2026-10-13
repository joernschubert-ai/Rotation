// /lib/engine/participationEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

/* =====================================================
INPUT
===================================================== */

export interface ParticipationEngineInput {
  history?: any[];
  historyMetrics?: any;

  marketDrivers?: any;
  systemHeat?: any;
  driversCore?: any;

  /*
   * Direct breadth inputs use percent by default.
   * Fractional inputs require an explicit unit.
   *
   * Persisted structure and history series use percent.
   */
  breadthUnit?: "PERCENT" | "FRACTION";

  breadth20?: number;
  breadth50?: number;
  breadth200?: number;

  structure?: any;

  highs?: number;
  lows?: number;

  rsEqual?: number;
  rsSmall?: number;
  rsGrowth?: number;

  rotation?: any;
  divergenceState?: string;
  concentrationScore?: number;
  rotationScore?: number;

  previousParticipationScore?: number;
  previousParticipation10d?: number;
  previousParticipation20d?: number;

  previousLeadershipBreadth?: number;
  previousPassiveDependence?: number;

  previousRsEqual?: number;
  previousRsSmall?: number;
  previousGrowthBreadth?: number;

  previousBreadth50?: number;
  previousBreadth50_10d?: number;

  previousBreadth200?: number;
  previousBreadth200_20d?: number;
}

/* =====================================================
OUTPUT
===================================================== */

export interface ParticipationEngineOutput {
  score: number;

  state:
    | "STRONG"
    | "HEALTHY"
    | "FRAGILE"
    | "WEAK";

  quality:
    | "HIGH"
    | "MEDIUM"
    | "LOW";

  expansion: boolean;

  participationVelocity: number;
  participationDecayRate: number;
  participationSlope: number;
  participationAcceleration: number;

  breadth50Trend: number;
  breadth50Slope: number;

  breadth200Trend: number;
  breadth200Slope: number;

  breadthParticipationDecay: number;

  leadershipBreadthTrend: number;
  megaCapDependenceTrend: number;

  equalWeightTrend: number;
  smallCapTrend: number;
  growthBreadthTrend: number;

  decayPersistence: number;

  narrowLeadership: boolean;
  severeNarrowLeadership: boolean;

  equalWeightWeakness: boolean;
  smallCapWeakness: boolean;
  breadthFailure: boolean;

  institutionalParticipation: number;
  passiveDependence: number;
  leadershipBreadth: number;

  summary: string;
  metrics: any;

  components: Record<string, number | boolean>;
  diagnostics: Record<string, any>;

  dataQuality: {
    completeCurrentStructure: boolean;
    missingCurrentInputs: string[];
    missingComparisons: string[];

    historyOrder: "OLDEST_FIRST";
    directBreadthUnit: "PERCENT" | "FRACTION";
  };
}

/* =====================================================
HELPERS
===================================================== */

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

function clamp(
  value: number,
  min = 0,
  max = 100
): number {
  return Math.max(min, Math.min(max, value));
}

function read(
  snapshot: any,
  paths: string[]
): number | null {
  return first(
    ...paths.map(path =>
      path.split(".").reduce(
        (current: any, key) => current?.[key],
        snapshot
      )
    )
  );
}

/*
 * Numeric compatibility:
 * unavailable comparisons return zero change.
 * dataQuality identifies these as missing comparisons.
 */
function change(
  current: number,
  previous: number | null
): number {
  return previous === null
    ? 0
    : current - previous;
}

/* =====================================================
ENGINE
===================================================== */

export function participationEngine(
  input: ParticipationEngineInput
): ParticipationEngineOutput {
  const safeInput = input ?? {};
  const historyMetrics = safeInput.historyMetrics ?? {};

  const unit =
    safeInput.breadthUnit === "FRACTION"
      ? "FRACTION"
      : "PERCENT";

  function directBreadth(
    value: unknown
  ): number | null {
    const n = numeric(value);

    return n === null
      ? null
      : clamp(
          n * (unit === "FRACTION" ? 100 : 1)
        );
  }

  /* ===================================================
  CURRENT INPUTS
  =================================================== */

  const raw = {
    breadth20: first(
      directBreadth(safeInput.breadth20),
      safeInput.structure?.breadth?.b20
    ),

    breadth50: first(
      directBreadth(safeInput.breadth50),
      safeInput.structure?.breadth?.b50
    ),

    breadth200: first(
      directBreadth(safeInput.breadth200),
      safeInput.structure?.breadth?.b200
    ),

    highs: first(
      safeInput.highs,
      safeInput.structure?.highsLows?.highs
    ),

    lows: first(
      safeInput.lows,
      safeInput.structure?.highsLows?.lows
    ),

    rsEqual: first(
      safeInput.rsEqual,
      safeInput.rotation?.rsEqual
    ),

    rsSmall: first(
      safeInput.rsSmall,
      safeInput.rotation?.rsSmall
    ),

    rsGrowth: first(
      safeInput.rsGrowth,
      safeInput.rotation?.rsGrowth
    ),

    concentrationScore: first(
      safeInput.concentrationScore,
      safeInput.rotation?.concentrationScore
    ),

    rotationScore: first(
      safeInput.rotationScore,
      safeInput.rotation?.score
    )
  };

  const breadth20 = clamp(raw.breadth20 ?? 50);
  const breadth50 = clamp(raw.breadth50 ?? 50);
  const breadth200 = clamp(raw.breadth200 ?? 50);

  const highs = raw.highs ?? 0;
  const lows = raw.lows ?? 0;

  const rsEqual = raw.rsEqual ?? 1;
  const rsSmall = raw.rsSmall ?? 1;
  const rsGrowth = raw.rsGrowth ?? 1;

  const concentrationScore =
    clamp(raw.concentrationScore ?? 50);

  const rotationScore =
    clamp(raw.rotationScore ?? 50);

  const divergenceState =
    safeInput.divergenceState ?? "NONE";

  /* ===================================================
  HISTORY

  Expected chronological daily observations:
  oldest first, newest last.
  =================================================== */

  const history = Array.isArray(safeInput.history)
    ? safeInput.history
    : Array.isArray(historyMetrics.history)
    ? historyMetrics.history
    : [];

  function at(offset: number): any {
    return history.length > offset
      ? history[history.length - 1 - offset]
      : null;
  }

  function historical(
    seriesName: string,
    offset: number,
    paths: string[]
  ): number | null {
    if (seriesName === "participationHistory" && at(offset)?.participation?.diagnostics?.aggregationPolicy !== "STRONGEST_SHARED_LEADERSHIP_PENALTY") {
      return null; // Do not report model revisions as measured participation changes.
    }
    const series = historyMetrics[seriesName];

    if (
      Array.isArray(series) &&
      series.length > offset
    ) {
      /*
       * Preserve the selected observation.
       * Missing values must not shift the comparison.
       */
      return numeric(
        series[series.length - 1 - offset]
      );
    }

    return read(at(offset), paths);
  }

  const comparisons = {
    breadth50_5d: first(
      directBreadth(safeInput.previousBreadth50),
      historical(
        "breadth50History",
        5,
        ["structure.breadth.b50", "breadth50"]
      )
    ),

    breadth50_10d: first(
      directBreadth(safeInput.previousBreadth50_10d),
      historical(
        "breadth50History",
        10,
        ["structure.breadth.b50", "breadth50"]
      )
    ),

    breadth200_10d: first(
      directBreadth(safeInput.previousBreadth200),
      historical(
        "breadth200History",
        10,
        ["structure.breadth.b200", "breadth200"]
      )
    ),

    breadth200_20d: first(
      directBreadth(safeInput.previousBreadth200_20d),
      historical(
        "breadth200History",
        20,
        ["structure.breadth.b200", "breadth200"]
      )
    ),

    participation_5d: first(
      safeInput.previousParticipationScore,
      historical(
        "participationHistory",
        5,
        ["participation.score", "participationScore"]
      )
    ),

    participation_10d: first(
      safeInput.previousParticipation10d,
      historical(
        "participationHistory",
        10,
        ["participation.score", "participationScore"]
      )
    ),

    participation_20d: first(
      safeInput.previousParticipation20d,
      historical(
        "participationHistory",
        20,
        ["participation.score", "participationScore"]
      )
    ),

    leadership_5d: first(
      safeInput.previousLeadershipBreadth,
      read(at(5), [
        "participation.leadershipBreadth",
        "rotation.leadershipBreadth"
      ])
    ),

    passive_5d: first(
      safeInput.previousPassiveDependence,
      read(at(5), [
        "participation.passiveDependence"
      ])
    ),

    equal_5d: first(
      safeInput.previousRsEqual,
      read(at(5), ["rotation.rsEqual", "rsEqual"])
    ),

    small_5d: first(
      safeInput.previousRsSmall,
      read(at(5), ["rotation.rsSmall", "rsSmall"])
    ),

    growth_5d: first(
      safeInput.previousGrowthBreadth,
      read(at(5), ["rotation.rsGrowth", "rsGrowth"])
    )
  };

  /* ===================================================
  BREADTH TRENDS
  =================================================== */

  const breadth50Slope = Math.round(
    change(breadth50, comparisons.breadth50_5d)
  );

  const breadth50Trend =
    comparisons.breadth50_5d !== null &&
    comparisons.breadth50_10d !== null
      ? Math.round(
          change(
            breadth50,
            comparisons.breadth50_5d
          ) * 0.60 +
          change(
            breadth50,
            comparisons.breadth50_10d
          ) * 0.40
        )
      : 0;

  const breadth200Slope = Math.round(
    change(breadth200, comparisons.breadth200_10d)
  );

  const breadth200Trend =
    comparisons.breadth200_10d !== null &&
    comparisons.breadth200_20d !== null
      ? Math.round(
          change(
            breadth200,
            comparisons.breadth200_10d
          ) * 0.55 +
          change(
            breadth200,
            comparisons.breadth200_20d
          ) * 0.45
        )
      : 0;

  /* ===================================================
  HISTORICAL / ENVIRONMENTAL INPUTS

  Optional legacy metrics remain supported.
  Missing environmental inputs are neutral.
  =================================================== */

  const participationPersistence = clamp(
    numeric(historyMetrics.participationPersistence) ?? 50
  );

  const averageParticipation = clamp(
    numeric(historyMetrics.averageParticipation) ?? 50
  );

  const measuredAverageParticipation =
    numeric(historyMetrics.averageParticipation) !== null &&
    (
      !historyMetrics.dataQuality ||
      (
        numeric(
          historyMetrics.dataQuality.dailyObservations
        ) !== null &&
        historyMetrics.dataQuality.dailyObservations > 0 &&
        numeric(
          historyMetrics.dataQuality.missingValues?.participation
        ) !== null &&
        historyMetrics.dataQuality.missingValues.participation <
          historyMetrics.dataQuality.dailyObservations
      )
    );

  const institutionalParticipationTrend =
    numeric(historyMetrics.institutionalParticipation) ?? 50;

  const participationAccelerationHistory =
    numeric(historyMetrics.participationAcceleration) ?? 0;

  const passiveFlowRisk = clamp(
    numeric(safeInput.marketDrivers?.passiveFlowRisk) ?? 0
  );

  /*
   * Actual System Heat components use -2..+2,
   * centered around zero.
   */
  const systemHeatBreadth = clamp(
    numeric(safeInput.systemHeat?.components?.breadth) ?? 0,
    -2,
    2
  );

  /*
   * Drivers Core uses 0..100,
   * centered around 50.
   */
  const driversSource =
    numeric(safeInput.driversCore?.score);

  const driversParticipation =
    clamp(driversSource ?? 50);

  /* ===================================================
  CENTRAL FLAGS
  =================================================== */

  const flags = getMarketStructureFlags({
    rsGrowth,
    rsSmall,
    rsEqual,
    breadth50,
    breadth200,
    highs,
    lows
  });

  const {
    equalWeightWeakness,
    smallCapWeakness,
    narrowLeadership,
    severeNarrowLeadership,
    breadthFailure
  } = flags;

  /* ===================================================
  LEADERSHIP BREADTH
  =================================================== */

  let leadershipBreadth =
    58 +
    Math.round((breadth50 - 50) * 0.22) +
    Math.round((breadth200 - 50) * 0.18);

  if (equalWeightWeakness) leadershipBreadth -= 12;
  if (smallCapWeakness) leadershipBreadth -= 12;
  if (narrowLeadership) leadershipBreadth -= 14;

  leadershipBreadth = clamp(leadershipBreadth);

  /* ===================================================
  PASSIVE DEPENDENCE
  =================================================== */

  let passiveDependence = 18;

  if (narrowLeadership) passiveDependence += 18;
  if (breadth50 < 50) passiveDependence += 12;
  if (breadth200 < 45) passiveDependence += 10;
  if (concentrationScore >= 70) passiveDependence += 14;
  if (equalWeightWeakness) passiveDependence += 8;
  if (smallCapWeakness) passiveDependence += 6;
  if (severeNarrowLeadership) passiveDependence += 10;

  passiveDependence = clamp(passiveDependence);

  /* ===================================================
  INSTITUTIONAL PARTICIPATION
  =================================================== */

  let institutionalParticipation =
    55 +
    Math.round((breadth20 - 50) * 0.10) +
    Math.round((breadth50 - 50) * 0.22) +
    Math.round((breadth200 - 50) * 0.18);

  if (highs > lows) institutionalParticipation += 6;
  if (narrowLeadership) institutionalParticipation -= 14;
  if (severeNarrowLeadership) institutionalParticipation -= 8;
  if (passiveDependence >= 65) institutionalParticipation -= 12;
  if (breadthFailure) institutionalParticipation -= 10;

  institutionalParticipation = clamp(
    institutionalParticipation
  );

  /* ===================================================
  SCORE CONTRIBUTIONS

  Existing structural thresholds and deductions retained.
  =================================================== */

  let relativeBreadthPenalty = 0;

  if (breadth50Trend < -4) relativeBreadthPenalty -= 6;
  if (breadth50Trend < -8) relativeBreadthPenalty -= 4;
  if (breadth200Trend < -3) relativeBreadthPenalty -= 6;
  if (breadth200Trend < -7) relativeBreadthPenalty -= 4;

  let leadershipPenalty = 0;

  if (equalWeightWeakness) leadershipPenalty -= 6;
  if (smallCapWeakness) leadershipPenalty -= 6;
  if (narrowLeadership) leadershipPenalty -= 10;
  if (severeNarrowLeadership) leadershipPenalty -= 8;

  let passivePenalty = 0;

  if (narrowLeadership && rsEqual < 0.97) {
    passivePenalty -= 12;
  }

  if (passiveDependence >= 70) {
    passivePenalty -= 10;
  }

  if (passiveDependence >= 85) {
    passivePenalty -= 6;
  }

  const highLow =
    highs > lows
      ? 6
      : lows > highs
      ? -Math.round(
          Math.min(8, Math.abs(lows - highs)) * 0.50
        )
      : 0;

  // Both penalties reuse the same leadership/breadth conditions.
  // Keep their strongest existing deduction, rather than adding both.
  const groupedLeadershipPenalty = Math.min(leadershipPenalty, passivePenalty);

  const components = {
    base: 60,

    drivers: Math.round(
      clamp(
        (driversParticipation - 50) / 5,
        -10,
        10
      ) * 0.40
    ),

    systemHeat:
      Math.round(systemHeatBreadth * 8),

    breadth:
      Math.round((breadth20 - 50) * 0.08) +
      Math.round((breadth50 - 50) * 0.18) +
      Math.round((breadth200 - 50) * 0.16),

    relativeBreadthPenalty,
    highLow,
    leadershipPenalty: groupedLeadershipPenalty,
    passivePenalty: 0,

    rotation:
      0, // Rotation is derived from overlapping structure; diagnostic only.

    breadthFailure:
      breadthFailure ? -12 : 0,

    divergence:
      divergenceState === "BEARISH_DIVERGENCE"
        ? -6
        : 0,

    structuralBonus:
      breadth50 > 72 &&
      breadth200 > 62 &&
      !narrowLeadership
        ? 8
        : 0,

    velocityPenalty: 0,
    historicalOverlay: 0
  };

  const beforeHistory = Object.values(components).reduce(
    (sum, value) => sum + value,
    0
  );

  /*
   * Compare historical final scores with a bounded
   * current score, not a negative raw sum.
   */
  const measuredCurrentScore = clamp(
    Math.round(beforeHistory)
  );

  // Historical model-score velocity remains diagnostic only.

  /* ===================================================
  HISTORICAL OVERLAYS
  =================================================== */

  // Persistence/averages of this engine's own score are diagnostic only.

  

  

  

  if (passiveFlowRisk > 25) {
    components.historicalOverlay -= 6;
  }

  if (passiveFlowRisk > 50) {
    components.historicalOverlay -= 4;
  }

  const unclampedScore = Object.values(components).reduce(
    (sum, value) => sum + value,
    0
  );

  const score = clamp(
    Math.round(unclampedScore)
  );

  /* ===================================================
  FINAL SCORE TRENDS

  Exported trends describe the actual final score.
  =================================================== */

  const participationVelocity = Math.round(
    change(score, comparisons.participation_5d)
  );

  const participationDecayRate = Math.round(
    change(score, comparisons.participation_10d)
  );

  const participationSlope = Math.round(
    change(score, comparisons.participation_20d) / 2
  );

  const participationAcceleration =
    comparisons.participation_5d !== null &&
    comparisons.participation_10d !== null
      ? Math.round(
          participationVelocity -
          participationDecayRate / 2
        )
      : 0;

  const leadershipBreadthTrend = Math.round(
    change(
      leadershipBreadth,
      comparisons.leadership_5d
    )
  );

  const megaCapDependenceTrend = Math.round(
    change(
      passiveDependence,
      comparisons.passive_5d
    )
  );

  const equalWeightTrend = Number(
    (
      change(rsEqual, comparisons.equal_5d) * 100
    ).toFixed(2)
  );

  const smallCapTrend = Number(
    (
      change(rsSmall, comparisons.small_5d) * 100
    ).toFixed(2)
  );

  const growthBreadthTrend = Number(
    (
      change(rsGrowth, comparisons.growth_5d) * 100
    ).toFixed(2)
  );

  /* ===================================================
  DECAY DIAGNOSTICS
  =================================================== */

  const breadthParticipationDecay = Math.min(
    30,

    (breadth50Slope < 0 ? 4 : 0) +
    (breadth50Trend < 0 ? 5 : 0) +
    (breadth200Slope < 0 ? 3 : 0) +
    (breadth200Trend < 0 ? 4 : 0) +
    (participationVelocity < 0 ? 4 : 0) +
    (participationDecayRate < 0 ? 5 : 0)
  );

  const decayPersistence = Math.min(
    20,

    (participationVelocity < 0 ? 3 : 0) +
    (participationDecayRate < 0 ? 4 : 0) +
    (participationSlope < 0 ? 5 : 0) +
    (leadershipBreadthTrend < 0 ? 3 : 0) +
    (equalWeightTrend < 0 ? 2 : 0) +
    (smallCapTrend < 0 ? 2 : 0) +
    (breadth50Trend < 0 ? 3 : 0) +
    (breadth200Trend < 0 ? 3 : 0) +
    (megaCapDependenceTrend > 0 ? 3 : 0)
  );

  /* ===================================================
  STATE / QUALITY
  =================================================== */

  const state: ParticipationEngineOutput["state"] =
    score >= 70
      ? "STRONG"
      : score >= 52
      ? "HEALTHY"
      : score >= 42
      ? "FRAGILE"
      : "WEAK";

  const quality: ParticipationEngineOutput["quality"] =
    score >= 72 &&
    !narrowLeadership &&
    passiveDependence < 45
      ? "HIGH"
      : score >= 48
      ? "MEDIUM"
      : "LOW";

  const missingCurrentInputs = Object.entries(raw)
    .filter(([, value]) => value === null)
    .map(([name]) => name);

  const expansion =
    missingCurrentInputs.length === 0 &&
    breadth20 > 72 &&
    breadth50 > 68 &&
    breadth200 > 60 &&
    highs > lows &&
    rsEqual >= 1 &&
    rsSmall >= 1 &&
    !narrowLeadership &&
    participationPersistence >= 55 &&
    driversSource !== null &&
    driversParticipation >= 5;

  /* ===================================================
  SUMMARY
  =================================================== */

  let summary =
    state === "STRONG"
      ? "Broad institutional participation"
      : state === "HEALTHY"
      ? "Healthy institutional participation"
      : state === "WEAK"
      ? "Participation breakdown active"
      : passiveDependence >= 60
      ? "Participation fragile | passive liquidity masking weakening internals"
      : narrowLeadership
      ? "Participation fragile | concentrated in narrow leadership"
      : "Participation becoming structurally fragile";

  if (severeNarrowLeadership) {
    summary += " | Severe leadership concentration";
  }

  if (decayPersistence >= 14) {
    summary += " | Persistent deterioration";
  }

  if (missingCurrentInputs.length) {
    summary += " | Incomplete current inputs";
  }

  /* ===================================================
  RETURN
  =================================================== */

  return {
    score,
    state,
    quality,
    expansion,

    participationVelocity,
    participationDecayRate,
    participationSlope,
    participationAcceleration,

    breadth50Trend,
    breadth50Slope,

    breadth200Trend,
    breadth200Slope,

    breadthParticipationDecay,

    leadershipBreadthTrend,
    megaCapDependenceTrend,

    equalWeightTrend,
    smallCapTrend,
    growthBreadthTrend,

    decayPersistence,

    narrowLeadership,
    severeNarrowLeadership,

    equalWeightWeakness,
    smallCapWeakness,
    breadthFailure,

    institutionalParticipation,
    passiveDependence,
    leadershipBreadth,

    summary,
    diagnostics: { aggregationPolicy: "STRONGEST_SHARED_LEADERSHIP_PENALTY", leadershipPenaltyCandidate: leadershipPenalty, passivePenaltyCandidate: passivePenalty, rotationContributionCandidate: Math.round((rotationScore - 50) * 0.10), historicalModelScoresUsedForScoring: false, weightsCalibratedByThisAudit: false },

    components: {
      ...components,

      scoreBeforeHistory: beforeHistory,
      unclampedScore,

      saturatedLow: unclampedScore < 0,
      saturatedHigh: unclampedScore > 100
    },

    dataQuality: {
      completeCurrentStructure:
        missingCurrentInputs.length === 0,

      missingCurrentInputs,

      missingComparisons: Object.entries(comparisons)
        .filter(([, value]) => value === null)
        .map(([name]) => name),

      historyOrder: "OLDEST_FIRST",
      directBreadthUnit: unit
    },

    metrics: {
      breadth20,
      breadth50,
      breadth200,

      breadth50Trend,
      breadth50Slope,

      breadth200Trend,
      breadth200Slope,

      breadthParticipationDecay,

      highs,
      lows,

      rsEqual,
      rsSmall,
      rsGrowth,

      concentrationScore,
      rotationScore,

      institutionalParticipation,
      passiveDependence,
      leadershipBreadth,

      participationPersistence,
      averageParticipation,
      institutionalParticipationTrend,
      participationAccelerationHistory,

      driversParticipation,
      systemHeatBreadth,
      passiveFlowRisk,

      narrowLeadership,
      severeNarrowLeadership,

      equalWeightWeakness,
      smallCapWeakness,
      breadthFailure
    }
  };
}
