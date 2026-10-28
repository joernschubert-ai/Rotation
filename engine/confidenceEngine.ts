// /lib/engine/confidenceEngine.ts

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

export function confidenceEngine(engine: any) {
  if (!engine) {
    return {
      state: "INVALID",
      score: 0
    };
  }

  /*
   * Risk-confirmation score:
   * Higher values mean stronger risk evidence.
   *
   * This is not a calibrated probability or
   * direction-neutral execution confidence.
   */

  const rotationScore =
    finiteNumber(engine.rotation?.score ?? 0);

  const structuralRisk =
    finiteNumber(engine.structuralRisk ?? 0);

  if (rotationScore === null || structuralRisk === null) {
    return {
      state: "INVALID",
      score: 0
    };
  }

  const crashProbability =
    numberOr(engine.crash?.probability, 0);

  const rotationDecayScore =
    numberOr(engine.rotationDecay?.score, 0);

  const fragilityScore =
    numberOr(engine.fragility?.score, 50);

  const liquidityScore =
    numberOr(engine.liquidity?.score, 50);

  const participationScore =
    numberOr(engine.participation?.score, 50);

  const squeezeRisk =
    numberOr(engine.squeeze?.risk, 0);

  const breadthThrust =
    engine.breadthThrust?.active === true;

  const regimeAligned =
    typeof engine.regimeSync?.aligned === "boolean"
      ? engine.regimeSync.aligned
      : engine.regimeSync?.state === "ALIGNED";

  const confirm =
    engine.rotationConfirm ?? {};

  const rotationConfirmState =
    confirm.state ?? "EARLY";

  const rotationQuality =
    numberOr(confirm.quality, 50);

  const falseBreakRisk =
    numberOr(confirm.falseBreakRisk, 50);

  const signal =
    engine.rotation?.signal;

  const riskOffRotation =
    signal === "RISK_OFF_ROTATION";

  /* =====================================================
  CONFIRMATION DIRECTION
  ===================================================== */

  const bearishConfirmed =
    rotationConfirmState === "BEARISH_CONFIRMED" ||
    rotationConfirmState === "INTERNAL_BREAKDOWN";

  const bearishConfirming =
    rotationConfirmState === "BEARISH_CONFIRMING";

  const bullishConfirmed =
    rotationConfirmState === "BULLISH_CONFIRMED";

  const bullishConfirming =
    rotationConfirmState === "BULLISH_CONFIRMING";

  const explicitlyBullish =
    bullishConfirmed ||
    bullishConfirming ||
    confirm.direction === "BULLISH";

  const legacyBearishConfirmation =
    !explicitlyBullish &&
    (
      riskOffRotation ||
      confirm.direction === "BEARISH"
    ) &&
    (
      rotationConfirmState === "CONFIRMED" ||
      rotationConfirmState === "INSTITUTIONAL_CONFIRMATION"
    );

  const bearishContext =
    !explicitlyBullish &&
    (
      bearishConfirmed ||
      bearishConfirming ||
      riskOffRotation ||
      legacyBearishConfirmation
    );

  const bullishContext =
    !bearishConfirmed &&
    !bearishConfirming &&
    !riskOffRotation &&
    (
      bullishConfirmed ||
      bullishConfirming ||
      signal === "RISK_ON"
    );

  let score = 0;

  /* =====================================================
  PHASE STRUCTURE

  Current phase names plus legacy aliases.
  Existing phase weights remain unchanged.
  ===================================================== */

  switch (engine.phase) {
    case "PHASE_1_EXPANSION":
    case "PHASE_1_EUPHORIA":
      score -= 5;
      break;

    case "PHASE_2_WARNING":
      score += 10;
      break;

    case "PHASE_3_DISTRIBUTION":
      score += 25;
      break;

    case "PHASE_4_RISK":
      score += 45;
      break;

    case "PHASE_5_BREAKDOWN":
      score += 65;
      break;

    case "PHASE_6_ACCELERATION":
    case "PHASE_6_PANIC":
      score += 80;
      break;

    case "PHASE_7_CAPITULATION":
      score += 90;
      break;
  }

  /* =====================================================
  ROTATION
  ===================================================== */

  if (riskOffRotation) {
    score += 20;
  }

  if (bearishConfirmed) {
    score += 10;
  } else if (legacyBearishConfirmation) {
    score +=
      rotationConfirmState === "INSTITUTIONAL_CONFIRMATION"
        ? 15
        : 10;
  }

  // Bullish confirmation quality must not add risk evidence.
  if (bearishContext && rotationQuality >= 75) {
    score += 5;
  }

  /* =====================================================
  CRASH ENGINE
  ===================================================== */

  if (crashProbability > 30) {
    score += 5;
  }

  if (crashProbability > 45) {
    score += 10;
  }

  if (crashProbability > 60) {
    score += 20;
  }

  if (crashProbability > 75) {
    score += 25;
  }

  /* =====================================================
  STRUCTURAL RISK
  ===================================================== */

  if (structuralRisk > 45) {
    score += 5;
  }

  if (structuralRisk > 60) {
    score += 10;
  }

  if (structuralRisk > 75) {
    score += 15;
  }

  /* =====================================================
  ROTATION DECAY
  ===================================================== */

  if (rotationDecayScore > 25) {
    score += 10;
  }

  if (rotationDecayScore > 45) {
    score += 15;
  }

  if (rotationDecayScore > 65) {
    score += 20;
  }

  /* =====================================================
  FRAGILITY
  ===================================================== */

  if (fragilityScore > 60) {
    score += 10;
  }

  if (fragilityScore > 75) {
    score += 15;
  }

  /* =====================================================
  LIQUIDITY
  ===================================================== */

  if (liquidityScore < 45) {
    score += 10;
  }

  if (liquidityScore < 35) {
    score += 15;
  }

  /* =====================================================
  PARTICIPATION
  ===================================================== */

  if (participationScore < 55) {
    score += 5;
  }

  if (participationScore < 45) {
    score += 10;
  }

  if (participationScore < 35) {
    score += 15;
  }

  /* =====================================================
  SQUEEZE / FALSE BREAK
  ===================================================== */

  if (squeezeRisk >= 70) {
    score += 10;
  }

  if (falseBreakRisk >= 65) {
    score += 10;
  }

  if (falseBreakRisk >= 80) {
    score += 15;
  }

  /* =====================================================
  POSITIVE STRUCTURE OFFSETS
  ===================================================== */

  if (
    breadthThrust &&
    regimeAligned &&
    rotationDecayScore < 20
  ) {
    score -= 10;
  }

  // Bearish confirmation quality is not a positive offset.
  if (
    bullishContext &&
    rotationQuality >= 80 &&
    liquidityScore >= 70 &&
    participationScore >= 70
  ) {
    score -= 10;
  }

  /* =====================================================
  CLAMP
  ===================================================== */

  score = Math.max(
    0,
    Math.min(100, Math.round(score))
  );

  /* =====================================================
  STATE / RETURN
  ===================================================== */

  const state =
    score < 25
      ? "EARLY"
      : score < 55
        ? "BUILDING"
        : "CONFIRMED";

  return {
    state,
    score,

    meta: {
      scoreType: "RISK_CONFIRMATION",
      scoreInterpretation: "HIGH=STRONGER_RISK_EVIDENCE"
    }
  };
}