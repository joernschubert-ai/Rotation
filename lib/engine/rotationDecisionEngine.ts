// /lib/engine/rotationDecisionEngine.ts

function numeric(
  value: unknown,
  fallback = 0
): number {
  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return fallback;
  }

  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function rotationDecisionEngine(input: any) {
  const safeInput = input ?? {};

  const {
    phase,
    crash = {},
    putTiming = {},
    russell = {},
    confidence = {},
    earlyWarning = {},
    master = {},
    positioning = {},
    edgeState = {},
    rotation = {},
    rotationConfirm = {},
    executionState = {},
    superSignal = {}
  } = safeInput;

  /* =====================================================
  SCORES

  Current Put Timing:
  score: number
  maxScore: 24

  Legacy wrapped scores may declare their own maximum.
  ===================================================== */

  const wrappedPutScore =
    putTiming.score &&
    typeof putTiming.score === "object";

  const putScore = numeric(
    wrappedPutScore
      ? putTiming.score.value
      : putTiming.score
  );

  const declaredMax = numeric(
    putTiming.maxScore ??
    putTiming.score?.max,
    wrappedPutScore ? 12 : 24
  );

  const putMax =
    declaredMax > 0
      ? declaredMax
      : wrappedPutScore
        ? 12
        : 24;

  const putNorm =
    clamp((putScore / putMax) * 100);

  const russellNorm =
    clamp(numeric(russell.confidence));

  const edge =
    putNorm - russellNorm;

  /* =====================================================
  EDGE / ROTATION / EXECUTION
  ===================================================== */

  const edgeLevel =
    numeric(edgeState.strength);

  const edgeLabel =
    edgeState.state ?? "NEUTRAL";

  const rotationSignal =
    rotation.signal ?? "NEUTRAL";

  const rotationConfidence =
    numeric(rotation.confidence, 50);

  const confirmState =
    rotationConfirm.state ?? "EARLY";

  const executionMode =
    executionState.executionMode ?? "WAIT";

  const riskState =
    executionState.riskState ?? "UNKNOWN";

  const institutional =
    superSignal.quality === "INSTITUTIONAL";

  /* =====================================================
  DIRECTIONAL CONFIRMATION

  Risk confirmation is not bullish confirmation.
  Missing execution context does not authorize longs.
  ===================================================== */

  const bullishConfirmed =
    confirmState === "BULLISH_CONFIRMED" ||
    (
      confirmState === "INSTITUTIONAL_CONFIRMATION" &&
      rotationConfirm.direction === "BULLISH"
    );

  const bullishConfirming =
    confirmState === "BULLISH_CONFIRMING";

  const executionAllowsLong =
    (
      riskState === "STABLE" ||
      riskState === "FRAGILE"
    ) &&
    (
      executionMode === "BUILD_POSITION" ||
      executionMode === "ADD_ON_PULLBACKS"
    );

  const longConfirmed =
    rotationSignal === "RISK_ON" &&
    (
      bullishConfirmed ||
      bullishConfirming
    ) &&
    executionAllowsLong;

  const riskConfirmed =
    confidence.state === "CONFIRMED";

  /* =====================================================
  CONSISTENT OUTPUT
  ===================================================== */

  function result(
    finalAction: string,
    direction: string,
    reason: string
  ) {
    return {
      finalAction,
      direction,

      edge,

      edgeState: edgeLabel,

      putScore: putNorm,
      russellScore: russellNorm,

      reason
    };
  }

  /* =====================================================
  HARD OVERRIDES

  Existing dominant-risk priorities and thresholds retained.
  ===================================================== */

  if (numeric(crash.probability) > 80) {
    return result(
      "MAX PUT EXPOSURE",
      "NET SHORT",
      "Crash dominant"
    );
  }

  if (numeric(master.score) > 80) {
    return result(
      "FULL DEFENSIVE",
      "NET SHORT",
      "Master risk extreme"
    );
  }

  /* =====================================================
  PHASE DOMINANCE
  ===================================================== */

  if (
    phase === "PHASE_5_BREAKDOWN" ||
    phase === "PHASE_6_ACCELERATION"
  ) {
    return result(
      "AGGRESSIVE PUTS",
      "NET SHORT",
      "Breakdown regime"
    );
  }

  /* =====================================================
  INSTITUTIONAL LONG
  ===================================================== */

  if (
    institutional &&
    bullishConfirmed &&
    longConfirmed &&
    executionMode === "ADD_ON_PULLBACKS" &&
    riskState === "STABLE"
  ) {
    return result(
      "INSTITUTIONAL LONG",
      "NET LONG",
      "Institutional alignment"
    );
  }

  /* =====================================================
  EDGE PRIORITY

  Early long returns require bullish confirmation
  and suitable execution conditions.
  ===================================================== */

  if (
    edgeLabel === "ATTACK" &&
    longConfirmed
  ) {
    return result(
      "FULL RISK-ON",
      "NET LONG",
      "Edge ATTACK state"
    );
  }

  if (
    edgeLabel === "EXPAND" &&
    longConfirmed
  ) {
    return result(
      "ADD RUSSELL AGGRESSIVE",
      "NET LONG",
      "Edge EXPAND state"
    );
  }

  /* =====================================================
  ROTATION OVERRIDE
  ===================================================== */

  const rotationOverrideActive =
    master.mode === "ROTATION" &&
    [
      "BUILD",
      "ADD",
      "AGGRESSIVE"
    ].includes(russell.decision) &&
    numeric(crash.probability) < 40 &&
    [
      "PHASE_1_EXPANSION",
      "PHASE_2_WARNING",
      "PHASE_3_DISTRIBUTION"
    ].includes(phase);

  if (
    rotationOverrideActive &&
    edgeLevel >= 1 &&
    edge > -10 &&
    rotationConfidence >= 65 &&
    longConfirmed
  ) {
    return result(
      "BUILD RUSSELL",
      "NET LONG",
      "Rotation + Edge alignment"
    );
  }

  /* =====================================================
  CONFIRMATION FILTER

  A high risk-confirmation score must not be required
  to authorize bullish exposure.
  ===================================================== */

  if (edge < -20) {
    if (!longConfirmed) {
      return result(
        "WAIT",
        "LOW EXPOSURE",
        "Bullish confirmation or execution missing"
      );
    }
  } else if (!riskConfirmed) {
    return result(
      "WAIT",
      "LOW EXPOSURE",
      "Risk evidence not confirmed"
    );
  }

  /* =====================================================
  EARLY WARNING
  ===================================================== */

  if (
    earlyWarning.active === true &&
    edgeLevel <= 1 &&
    edge > -10 &&
    edge < 15
  ) {
    return result(
      "DEFENSIVE BIAS",
      "LIGHT SHORT",
      "Weak edge + Early warning"
    );
  }

  /* =====================================================
  CORE DECISION
  ===================================================== */

  let finalAction =
    "WAIT / REDUCE";

  let direction =
    "LOW EXPOSURE";

  let reason =
    "No strong edge";

  if (edge > 20) {
    finalAction = "ADD PUTS";
    direction = "NET SHORT";
    reason = "Put edge dominant";
  } else if (edge < -20) {
    finalAction = "ENTER RUSSELL CALLS";
    direction = "NET LONG";
    reason = "Russell edge dominant";
  }

  /* =====================================================
  PHASE OVERLAY
  ===================================================== */

  if (
    phase === "PHASE_2_WARNING" &&
    edge < 10 &&
    edge > -10
  ) {
    finalAction = "WAIT";
    direction = "NEUTRAL";
    reason = "Early phase no edge";
  }

  if (
    phase === "PHASE_3_DISTRIBUTION" &&
    edge > 0
  ) {
    finalAction = "BUILD PUTS";
    direction = "NET SHORT";
    reason = "Distribution phase";
  }

  /* =====================================================
  POSITIONING

  Apply after core and phase logic.
  Crowding modifies an existing directional setup;
  it does not create an opposing trade by itself.
  ===================================================== */

  if (
    [
      "EXTREME_LONG",
      "CROWDED_LONG"
    ].includes(positioning.crowding) &&
    direction === "NET SHORT"
  ) {
    finalAction = "FADE LONGS";
    direction = "SHORT BIAS";
    reason = "Crowded longs + bearish setup";
  }

  if (
    [
      "EXTREME_SHORT",
      "CROWDED_SHORT"
    ].includes(positioning.crowding) &&
    direction === "NET LONG" &&
    longConfirmed
  ) {
    finalAction = "FADE SHORTS";
    direction = "LONG BIAS";
    reason = "Crowded shorts + bullish setup";
  }

  /* =====================================================
  NASDAQ OVERLAY
  ===================================================== */

  if (
    safeInput.nasdaq?.active === true &&
    direction === "NEUTRAL" &&
    longConfirmed
  ) {
    return result(
      "NASDAQ OPPORTUNITY",
      "LIGHT LONG",
      "Opportunistic Nasdaq setup"
    );
  }

  return result(
    finalAction,
    direction,
    reason
  );
}