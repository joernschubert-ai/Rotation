// /lib/engine/regimePersistenceEngine.ts

export interface RegimePersistenceEngineInput {
  breadth50?: number;
  breadth200?: number;

  participationScore?: number;
  rotationDecayScore?: number;

  dangerScore?: number;
  fragilityScore?: number;

  internalDivergenceScore?: number;

  breadth50History?: Array<number | null>;
  breadth200History?: Array<number | null>;

  participationHistory?: Array<number | null>;
  rotationDecayHistory?: Array<number | null>;

  internalDivergenceHistory?: Array<number | null>;

  phase?: string;
}

export interface RegimePersistenceEngineOutput {
  /* =====================================================
  LEGACY / COMPATIBILITY
  ===================================================== */

  persistentWeaknessDays: number;

  persistentBreadthDecay: boolean;
  persistentParticipationFailure: boolean;

  persistentRotationStress: boolean;
  persistentInternalDivergence: boolean;

  escalationBias: number;

  state:
    | "STABLE"
    | "TRANSITION"
    | "PERSISTENT_WEAKNESS"
    | "STRUCTURAL_DISTRIBUTION";

  summary: string;

  metrics: {
    breadthWeakDays: number;
    participationWeakDays: number;
    rotationStressDays: number;
    divergenceDays: number;
  };

  /* =====================================================
  REGIME PERSISTENCE MODEL
  ===================================================== */

  score: number;

  bearishPersistence: boolean;
  bullishPersistence: boolean;

  trend:
    | "IMPROVING"
    | "STABLE"
    | "DETERIORATING";

  regimeAge: number;

  distributionRisk: number;
  recoveryQuality: number;
  falseRecoveryRisk: number;
  trendStability: number;
  marketFatigue: number;
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

function finiteNumber(value: unknown): number | null {
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

  return null;
}

function safeNumber(
  value: unknown,
  fallback = 0
): number {
  return finiteNumber(value) ?? fallback;
}

function historyArray(
  value: unknown
): Array<number | null> {
  return Array.isArray(value)
    ? value.map(finiteNumber)
    : [];
}

/* =====================================================
COUNT HISTORY

Counts measured weak observations in the supplied window.
These counts are not consecutive-day streaks.
Missing observations do not count as measured weakness.
===================================================== */

function countBelow(
  values: Array<number | null>,
  threshold: number
): number {
  return values.filter(
    value => value !== null && value < threshold
  ).length;
}

function countAbove(
  values: Array<number | null>,
  threshold: number
): number {
  return values.filter(
    value => value !== null && value > threshold
  ).length;
}

function countAtLeast(
  values: Array<number | null>,
  threshold: number
): number {
  return values.filter(
    value => value !== null && value >= threshold
  ).length;
}

/* =====================================================
TREND
===================================================== */

type PersistenceTrend =
  | "IMPROVING"
  | "STABLE"
  | "DETERIORATING";

function calculateTrend(
  history: Array<number | null>,
  higherIsBetter = true
): PersistenceTrend {
  /*
   * Compare two complete three-observation windows.
   *
   * Missing observations must not shorten or shift
   * the comparison windows.
   */

  if (history.length < 6) {
    return "STABLE";
  }

  const window = history.slice(-6);

  if (window.some(value => value === null)) {
    return "STABLE";
  }

  const values = window as number[];

  const previousAverage =
    (values[0] + values[1] + values[2]) / 3;

  const recentAverage =
    (values[3] + values[4] + values[5]) / 3;

  const delta =
    (recentAverage - previousAverage) *
    (higherIsBetter ? 1 : -1);

  if (delta > 3) {
    return "IMPROVING";
  }

  if (delta < -3) {
    return "DETERIORATING";
  }

  return "STABLE";
}

/* =====================================================
REGIME PERSISTENCE ENGINE
===================================================== */

export function regimePersistenceEngine(
  input: RegimePersistenceEngineInput
): RegimePersistenceEngineOutput {
  /* =====================================================
  INPUT
  ===================================================== */

  const breadth50 =
    safeNumber(input.breadth50, 50);

  const breadth200 =
    safeNumber(input.breadth200, 50);

  const participationScore =
    safeNumber(input.participationScore, 50);

  const rotationDecayScore =
    safeNumber(input.rotationDecayScore, 0);

  const dangerScore =
    safeNumber(input.dangerScore, 0);

  const fragilityScore =
    safeNumber(input.fragilityScore, 50);

  const internalDivergenceScore =
    safeNumber(input.internalDivergenceScore, 0);

  /* =====================================================
  HISTORY

  Expected order: oldest observation first, newest last.
  ===================================================== */

  const breadth50History =
    historyArray(input.breadth50History);

  const breadth200History =
    historyArray(input.breadth200History);

  const participationHistory =
    historyArray(input.participationHistory);

  const rotationDecayHistory =
    historyArray(input.rotationDecayHistory);

  const internalDivergenceHistory =
    historyArray(input.internalDivergenceHistory);

  const phase =
    input.phase ?? "PHASE_1_EXPANSION";

  /* =====================================================
  HISTORY COUNTS
  ===================================================== */

  const breadthWeakDays = Math.max(
    countBelow(breadth50History, 55),
    countBelow(breadth200History, 52)
  );

  const participationWeakDays =
    countBelow(participationHistory, 45);

  const rotationStressDays =
    countAbove(rotationDecayHistory, 40);

  /*
   * Only actual divergence observations establish
   * divergence persistence.
   *
   * A live score can indicate current divergence,
   * but cannot prove five historical observations.
   */

  const measuredDivergenceDays =
    countAtLeast(internalDivergenceHistory, 50);

  const divergenceDays =
    internalDivergenceScore >= 50
      ? Math.max(1, measuredDivergenceDays)
      : 0;

  /* =====================================================
  PERSISTENCE FLAGS
  ===================================================== */

  const persistentBreadthDecay =
    breadthWeakDays >= 8;

  const persistentParticipationFailure =
    participationWeakDays >= 6;

  const persistentRotationStress =
    rotationStressDays >= 6;

  const persistentInternalDivergence =
    divergenceDays >= 5 &&
    internalDivergenceScore >= 50;

  const persistentWeaknessDays = Math.max(
    breadthWeakDays,
    participationWeakDays,
    rotationStressDays
  );

  /* =====================================================
  LIVE WEAKNESS COMPONENTS
  ===================================================== */

  const breadthWeakness = clamp(
    (55 - breadth50) * 1.3 +
    (52 - breadth200) * 0.7
  );

  const participationWeakness =
    clamp(50 - participationScore);

  const rotationStress =
    clamp(rotationDecayScore);

  const divergenceStress =
    clamp(internalDivergenceScore);

  const fragilityStress =
    clamp(fragilityScore);

  /* =====================================================
  PERSISTENCE COMPONENT
  ===================================================== */

  const historicalPersistence = clamp(
    breadthWeakDays * 2 +
    participationWeakDays * 2 +
    rotationStressDays * 1.5 +
    divergenceDays * 1.5
  );

  /* =====================================================
  REGIME AGE
  ===================================================== */

  const regimeAge = Math.max(
    breadthWeakDays,
    participationWeakDays,
    rotationStressDays,
    divergenceDays
  );

  /* =====================================================
  TREND

  Higher breadth / participation is better.
  Higher rotation decay is worse.
  ===================================================== */

  const breadthTrend =
    calculateTrend(breadth50History);

  const participationTrend =
    calculateTrend(participationHistory);

  const rotationTrend =
    calculateTrend(rotationDecayHistory, false);

  const trends = [
    breadthTrend,
    participationTrend,
    rotationTrend
  ];

  const deterioratingSignals =
    trends.filter(
      value => value === "DETERIORATING"
    ).length;

  const improvingSignals =
    trends.filter(
      value => value === "IMPROVING"
    ).length;

  const trend: PersistenceTrend =
    deterioratingSignals >= 2
      ? "DETERIORATING"
      : improvingSignals >= 2
        ? "IMPROVING"
        : "STABLE";

  /* =====================================================
  TREND STABILITY
  ===================================================== */

  const trendStability = clamp(
    50 +
    persistentWeaknessDays * 1.5 +
    (trend === "DETERIORATING" ? 15 : 0) +
    (trend === "IMPROVING" ? -10 : 0)
  );

  /* =====================================================
  MARKET FATIGUE
  ===================================================== */

  const marketFatigue = clamp(
    persistentWeaknessDays * 2 +
    breadthWeakness * 0.5 +
    participationWeakness * 0.4 +
    rotationStress * 0.3
  );

  /* =====================================================
  DISTRIBUTION RISK
  ===================================================== */

  let distributionRisk =
    breadthWeakness * 0.25 +
    participationWeakness * 0.20 +
    rotationStress * 0.15 +
    divergenceStress * 0.15 +
    historicalPersistence * 0.20 +
    fragilityStress * 0.05;

  if (persistentBreadthDecay) {
    distributionRisk += 8;
  }

  if (persistentParticipationFailure) {
    distributionRisk += 8;
  }

  if (persistentRotationStress) {
    distributionRisk += 6;
  }

  if (persistentInternalDivergence) {
    distributionRisk += 10;
  }

  distributionRisk = clamp(distributionRisk);

  /* =====================================================
  RECOVERY QUALITY
  ===================================================== */

  let recoveryQuality = 50;

  if (trend === "IMPROVING") {
    recoveryQuality += 20;
  }

  if (breadth50 > 65) {
    recoveryQuality += 10;
  }

  if (breadth200 > 55) {
    recoveryQuality += 10;
  }

  if (participationScore > 60) {
    recoveryQuality += 10;
  }

  if (rotationDecayScore < 30) {
    recoveryQuality += 5;
  }

  if (fragilityScore > 70) {
    recoveryQuality -= 15;
  }

  if (distributionRisk > 60) {
    recoveryQuality -= 15;
  }

  recoveryQuality = clamp(recoveryQuality);

  /* =====================================================
  FALSE RECOVERY RISK
  ===================================================== */

  let falseRecoveryRisk = 0;

  if (
    breadth50 > 60 &&
    participationScore < 50
  ) {
    falseRecoveryRisk += 20;
  }

  if (
    breadth50 > 60 &&
    persistentWeaknessDays >= 6
  ) {
    falseRecoveryRisk += 20;
  }

  if (
    rotationDecayScore > 50 &&
    breadth50 > 60
  ) {
    falseRecoveryRisk += 20;
  }

  if (fragilityScore > 70) {
    falseRecoveryRisk += 15;
  }

  if (dangerScore > 50) {
    falseRecoveryRisk += 15;
  }

  falseRecoveryRisk = clamp(falseRecoveryRisk);

  /* =====================================================
  BEARISH / BULLISH PERSISTENCE
  ===================================================== */

  const bearishPersistence =
    (
      persistentBreadthDecay ||
      persistentParticipationFailure ||
      persistentRotationStress
    ) &&
    (
      trend !== "IMPROVING" ||
      distributionRisk >= 55
    );

  const bullishPersistence =
    breadth50 > 65 &&
    breadth200 > 55 &&
    participationScore > 55 &&
    rotationDecayScore < 40 &&
    trend === "IMPROVING";

  /* =====================================================
  ESCALATION BIAS
  ===================================================== */

  let escalationBias = 0;

  if (persistentBreadthDecay) {
    escalationBias += 10;
  }

  if (persistentParticipationFailure) {
    escalationBias += 10;
  }

  if (persistentRotationStress) {
    escalationBias += 8;
  }

  if (persistentInternalDivergence) {
    escalationBias += 12;
  }

  if (
    breadth50 < 50 &&
    breadth200 < 52
  ) {
    escalationBias += 6;
  }

  if (participationScore < 40) {
    escalationBias += 8;
  }

  if (rotationDecayScore > 50) {
    escalationBias += 8;
  }

  if (dangerScore > 55) {
    escalationBias += 6;
  }

  if (fragilityScore > 70) {
    escalationBias += 6;
  }

  if (phase === "PHASE_3_DISTRIBUTION") {
    escalationBias += 6;
  }

  if (phase === "PHASE_4_RISK") {
    escalationBias += 10;
  }

  escalationBias = clamp(escalationBias);

  /* =====================================================
  SCORE
  ===================================================== */

  let score =
    distributionRisk * 0.45 +
    escalationBias * 0.25 +
    marketFatigue * 0.15 +
    falseRecoveryRisk * 0.15;

  if (
    recoveryQuality > 75 &&
    !persistentBreadthDecay &&
    !persistentParticipationFailure
  ) {
    score -= 15;
  }

  score = clamp(score);

  /* =====================================================
  STATE
  ===================================================== */

  let state: RegimePersistenceEngineOutput["state"];

  if (
    persistentInternalDivergence &&
    persistentParticipationFailure &&
    persistentBreadthDecay
  ) {
    state = "STRUCTURAL_DISTRIBUTION";
  } else if (
    persistentBreadthDecay ||
    persistentParticipationFailure ||
    persistentRotationStress
  ) {
    state = "PERSISTENT_WEAKNESS";
  } else if (
    escalationBias >= 18 ||
    score >= 35
  ) {
    state = "TRANSITION";
  } else {
    state = "STABLE";
  }

  /* =====================================================
  SUMMARY
  ===================================================== */

  let summary =
    "Market regime stable without persistent deterioration";

  if (state === "TRANSITION") {
    summary =
      "Early persistent weakness emerging beneath the surface";
  }

  if (state === "PERSISTENT_WEAKNESS") {
    summary =
      "Persistent institutional deterioration developing";
  }

  if (state === "STRUCTURAL_DISTRIBUTION") {
    summary =
      "Persistent institutional distribution regime detected";
  }

  /* =====================================================
  RETURN
  ===================================================== */

  return {
    persistentWeaknessDays,

    persistentBreadthDecay,
    persistentParticipationFailure,

    persistentRotationStress,
    persistentInternalDivergence,

    escalationBias,
    state,
    summary,

    metrics: {
      breadthWeakDays,
      participationWeakDays,
      rotationStressDays,
      divergenceDays
    },

    score: Math.round(score),

    bearishPersistence,
    bullishPersistence,
    trend,
    regimeAge,

    distributionRisk: Math.round(distributionRisk),
    recoveryQuality: Math.round(recoveryQuality),
    falseRecoveryRisk: Math.round(falseRecoveryRisk),
    trendStability: Math.round(trendStability),
    marketFatigue: Math.round(marketFatigue)
  };
}