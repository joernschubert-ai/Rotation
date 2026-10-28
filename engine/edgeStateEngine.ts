// /lib/engine/edgeStateEngine.ts

/* =====================================================
HELPERS
===================================================== */

function numericValue(value: unknown): number | null {
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

    const numeric = Number(candidate);

    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return null;
}

function clamp(
  value: number,
  max = 100
): number {
  return Math.max(0, Math.min(max, value));
}

/* =====================================================
ENGINE
===================================================== */

export function edgeStateEngine(input: any) {
  const safeInput = input ?? {};

  /* =====================================================
  INPUT OBJECTS
  ===================================================== */

  const rotation = safeInput.rotation ?? {};
  const russell = safeInput.russell ?? {};
  const structure = safeInput.structure ?? {};
  const crash = safeInput.crash ?? {};
  const master = safeInput.master ?? {};
  const rotationDecay = safeInput.rotationDecay ?? {};
  const rotationConfirm = safeInput.rotationConfirm ?? {};
  const participation = safeInput.participation ?? {};

  const marketData =
    safeInput.marketData ??
    safeInput.indices ??
    {};

  const executionState =
    safeInput.executionState ?? {};

  const regimeSync =
    safeInput.regimeSync ?? {};

  const dangerZone =
    safeInput.dangerZone ?? {};

  /* =====================================================
  INPUTS

  Missing inputs remain distinguishable.
  They must not award constructive points.
  ===================================================== */

  const rotationScore =
    numericValue(rotation.score);

  const russellDecision =
    russell.decision ?? "NO_TRADE";

  const breadth50 =
    numericValue(structure?.breadth?.b50);

  const breadth200 =
    numericValue(structure?.breadth?.b200);

  const ad =
    numericValue(structure.advanceDecline);

  // Crash score and crash probability are different quantities.
  const crashProb =
    numericValue(crash.probability);

  const masterScore =
    numericValue(master.score);

  const participationScore =
    numericValue(participation.score);

  const rotationDecayScore =
    numericValue(rotationDecay.score) ??
    numericValue(rotationConfirm.rotationDecayScore);

  const rsGrowth =
    numericValue(rotation.rsGrowth) ?? 1;

  const rsSmall =
    numericValue(rotation.rsSmall) ?? 1;

  const rsEqual =
    numericValue(rotation.rsEqual) ?? 1;

  const vix =
    numericValue(safeInput.vix) ??
    numericValue(marketData["^VIX"]) ??
    numericValue(marketData.vix);

  // Prefer calculated liquidity over nominal market liquidity.
  const liquidityScore =
    numericValue(safeInput.liquidity?.score) ??
    numericValue(safeInput.liquidityScore) ??
    numericValue(marketData.liquidityScore);

  /* =====================================================
  REGIME / EXECUTION CONTEXT
  ===================================================== */

  const executionMode =
    executionState.executionMode ?? "UNKNOWN";

  const riskState =
    executionState.riskState ?? "UNKNOWN";

  const regimeState =
    regimeSync.state ?? "UNKNOWN";

  const dangerLevel =
    dangerZone.level ??
    dangerZone.state ??
    "UNKNOWN";

  /* =====================================================
  STRUCTURE HELPERS
  ===================================================== */

  const adHealthy =
    ad !== null && ad > -10;

  const narrowLeadership =
    rsGrowth > 1.03 &&
    rsSmall < 1 &&
    rsEqual < 1;

  const weakParticipation =
    participationScore !== null &&
    participationScore < 45;

  const dangerousDecay =
    rotationDecayScore !== null &&
    rotationDecayScore > 65;

  /* =====================================================
  FRAGILITY CORE

  Master score is a risk score:
  HIGH = PUT / RISK.
  ===================================================== */

  const fragileInternalStructure =
    masterScore !== null &&
    masterScore >= 50 &&
    (
      (
        rotationScore !== null &&
        rotationScore < 35
      ) ||
      weakParticipation ||
      dangerousDecay
    );

  /* =====================================================
  BASE SCORE
  ===================================================== */

  let score = 0;

  /* ROTATION */

  if (
    rotationScore !== null &&
    rotationScore >= 55
  ) {
    score += 14;
  } else if (
    rotationScore !== null &&
    rotationScore >= 40
  ) {
    score += 8;
  }

  /* BREADTH */

  if (
    breadth50 !== null &&
    breadth50 >= 65
  ) {
    score += 10;
  }

  if (
    breadth200 !== null &&
    breadth200 >= 60
  ) {
    score += 8;
  }

  /* PARTICIPATION */

  if (
    participationScore !== null &&
    participationScore >= 60
  ) {
    score += 10;
  } else if (
    participationScore !== null &&
    participationScore >= 50
  ) {
    score += 5;
  }

  /* LIQUIDITY */

  if (
    liquidityScore !== null &&
    liquidityScore >= 70
  ) {
    score += 8;
  } else if (
    liquidityScore !== null &&
    liquidityScore >= 55
  ) {
    score += 5;
  }

  /* MARKET HEALTH */

  if (adHealthy) {
    score += 5;
  }

  if (
    vix !== null &&
    vix < 20
  ) {
    score += 5;
  }

  /* RISK */

  if (
    crashProb !== null &&
    crashProb < 30
  ) {
    score += 6;
  } else if (
    crashProb !== null &&
    crashProb > 45
  ) {
    score -= 10;
  }

  if (
    masterScore !== null &&
    masterScore <= 40
  ) {
    score += 5;
  }

  /* RUSSELL */

  if (russellDecision === "BUILD") {
    score += 6;
  }

  if (russellDecision === "ADD") {
    score += 8;
  }

  if (russellDecision === "AGGRESSIVE") {
    score += 10;
  }

  /* SOFT PENALTIES */

  if (weakParticipation) {
    score -= 8;
  }

  if (narrowLeadership) {
    score -= 6;
  }

  if (dangerousDecay) {
    score -= 10;
  }

  if (fragileInternalStructure) {
    score -= 12;
  }

  /* DANGER */

  if (dangerLevel === "HIGH") {
    score -= 8;
  }

  if (dangerLevel === "EXTREME") {
    score -= 15;
  }

  /* =====================================================
  CURRENT REGIME BRAKES

  Defensive execution does not represent a tradable
  bullish edge.
  ===================================================== */

  const longEdgeBlocked =
    [
      "CRISIS",
      "BREAKDOWN",
      "INTERNAL_BREAKDOWN"
    ].includes(riskState) ||
    [
      "DEFENSIVE",
      "REDUCE_RISK",
      "CAPITAL_PRESERVATION"
    ].includes(executionMode) ||
    regimeState === "BREAKDOWN";

  let scoreCap = 100;

  if (regimeState === "FRAGILE") {
    scoreCap = Math.min(scoreCap, 75);
  }

  if (executionMode === "REDUCE_RISK") {
    scoreCap = Math.min(scoreCap, 65);
  }

  if (executionMode === "CAPITAL_PRESERVATION") {
    scoreCap = Math.min(scoreCap, 55);
  }

  if (longEdgeBlocked) {
    scoreCap = 0;
  }

  score = clamp(score, scoreCap);

  /* =====================================================
  EMA

  Current brakes apply after smoothing as well.
  Previous high scores cannot override current restrictions.
  ===================================================== */

  const previousValue =
    numericValue(safeInput.edgeState?.emaScore);

  const prevEdgeScore =
    previousValue === null
      ? score
      : clamp(previousValue);

  const alpha = 0.35;

  const finalScore = clamp(
    alpha * score +
    (1 - alpha) * prevEdgeScore,
    scoreCap
  );

  /* =====================================================
  STATE LOGIC
  ===================================================== */

  let state = "NEUTRAL";
  let strength = 0;

  if (finalScore >= 80) {
    state = "ATTACK";
    strength = 4;
  } else if (finalScore >= 65) {
    state = "EXPAND";
    strength = 3;
  } else if (finalScore >= 45) {
    state = "CONFIRM";
    strength = 2;
  } else if (finalScore >= 25) {
    state = "BUILD";
    strength = 1;
  }

  /* WATCH OVERRIDE */

  if (
    !longEdgeBlocked &&
    masterScore !== null &&
    masterScore >= 50 &&
    rotationScore !== null &&
    rotationScore < 35
  ) {
    state = "WATCH";
    strength = Math.max(0, strength - 1);
  }

  /* =====================================================
  LABEL
  ===================================================== */

  const labelMap: Record<string, string> = {
    BUILD: "Early Rotation",
    CONFIRM: "Rotation Confirming",
    EXPAND: "Momentum Expansion",
    ATTACK: "Full Risk-On",
    WATCH: "Fragile Confirmation",
    NEUTRAL: "No Clear Edge"
  };

  const label = labelMap[state];

  /* =====================================================
  TIER
  ===================================================== */

  let tier = "NO_EDGE";

  if (finalScore >= 80) {
    tier = "ASYMMETRIC";
  } else if (finalScore >= 60) {
    tier = "HIGH_EDGE";
  } else if (finalScore >= 40) {
    tier = "TRADEABLE";
  } else if (finalScore >= 20) {
    tier = "EARLY_EDGE";
  }

  if (state === "WATCH") {
    tier =
      finalScore >= 40
        ? "EARLY_EDGE"
        : "NO_EDGE";
  }

  /* =====================================================
  OUTPUT
  ===================================================== */

  return {
    state,
    label,
    tier,
    strength,

    score: Number(finalScore.toFixed(2)),

    rawScore: score,
    emaScore: finalScore,

    marketCondition: "STRUCTURAL_EDGE",

    components: {
      rotationScore,
      rotationDecayScore,
      participationScore,
      liquidityScore,
      masterScore,
      vix,
      ad,
      narrowLeadership,
      fragileInternalStructure,
      regimeState,
      executionMode,
      dangerLevel,

      riskState,
      longEdgeBlocked,
      scoreCap
    }
  };
}