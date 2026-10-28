// /lib/engine/positionSizingV2.ts

type FlowName = "NASDAQ_PUT" | "NASDAQ_CALL" | "RUSSELL_CALL";
type Direction = "LONG" | "SHORT" | "NONE";

type SizedFlow = {
  instrument: FlowName;
  direction: Direction;
  eligible: boolean;
  size: number;
  rawSize: number;
  prePortfolioSize: number;
  strength: number;
  confidence: number;
  riskMultiplier: number;
  mode: string;
  state: string;
  reason: string;
  diagnostics?: Record<string, any>;
};

function nullableNum(value: unknown): number | null {
  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function num(value: unknown, fallback = 0): number {
  return nullableNum(value) ?? fallback;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(
    min,
    Math.min(max, Number.isFinite(value) ? value : min)
  );
}

function hasNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

function extractNumericValue(value: any): number | null {
  if (
    value !== null &&
    typeof value === "object" &&
    "value" in value
  ) {
    return nullableNum(value.value);
  }

  return nullableNum(value);
}

function normalizePhase(value: any): string {
  if (typeof value === "string") return value;

  if (value && typeof value === "object") {
    if (typeof value.phase === "string") return value.phase;
    if (typeof value.state === "string") return value.state;
  }

  return "UNKNOWN";
}

export function positionSizingV2(engine: any) {
  const master = engine?.master ?? {};
  const crash = engine?.crash ?? {};
  const tradeStack = engine?.tradeStack ?? {};
  const edgeState = engine?.edgeState ?? {};
  const executionState = engine?.executionState ?? {};
  const regimeSync = engine?.regimeSync ?? {};
  const dangerZone = engine?.dangerZone ?? {};
  const systemHeat = engine?.systemHeat ?? {};
  const liquidity = engine?.liquidity ?? {};
  const fragility = engine?.fragility ?? {};
  const participation = engine?.participation ?? {};
  const rotationDecay = engine?.rotationDecay ?? {};
  const rotationConfirm = engine?.rotationConfirm ?? {};
  const marketQuality = engine?.marketQuality ?? {};
  const breadthThrust = engine?.breadthThrust ?? {};
  const squeeze = engine?.squeeze ?? engine?.squeezeRisk ?? {};
  const structure = engine?.structure ?? {};
  const priceMomentum = engine?.priceMomentum ?? {};
  const history = engine?.historyMetrics ?? {};
  const persistence = engine?.regimePersistence ?? {};

  const phase = normalizePhase(engine?.phase);

  const input = {
    master: {
      score: nullableNum(master.score),
      mode: master.mode ?? master.regime ?? null,
    },
    crash: {
      score: nullableNum(crash.score),
      probability: nullableNum(crash.probability),
      state: crash.state ?? crash.label ?? null,
    },
    edge: {
      score: nullableNum(edgeState.score),
      state: edgeState.state ?? null,
    },
    liquidity: {
      score: nullableNum(liquidity.score),
      state: liquidity.state ?? null,
    },
    fragility: {
      score: nullableNum(fragility.score),
      state: fragility.state ?? null,
    },
    participation: {
      score: nullableNum(participation.score),
      state: participation.state ?? null,
    },
    rotationDecay: {
      score: nullableNum(rotationDecay.score),
      state: rotationDecay.state ?? null,
    },
    rotationConfirm: {
      confidence: nullableNum(rotationConfirm.confidence),
      state: rotationConfirm.state ?? null,
      falseBreakRisk: nullableNum(rotationConfirm.falseBreakRisk),
    },
    marketQuality: {
      score: nullableNum(marketQuality.score),
      state: marketQuality.state ?? null,
    },
    breadthThrust: {
      score: nullableNum(breadthThrust.strength ?? breadthThrust.score),
    },
    squeeze: {
      risk: nullableNum(squeeze.risk ?? squeeze.score),
      state: squeeze.state ?? null,
    },
    regimeSync: {
      score: nullableNum(regimeSync.score),
      state: regimeSync.state ?? null,
    },
    danger: {
      score: nullableNum(dangerZone.score),
      state: dangerZone.state ?? dangerZone.level ?? null,
    },
    systemHeat: {
      value: nullableNum(systemHeat.value),
    },
    structure: {
      breadth50: extractNumericValue(structure?.breadth?.b50),
      breadth200: extractNumericValue(structure?.breadth?.b200),
    },
    history: {
      breadthTrend: nullableNum(history.breadthTrend),
      breadthAcceleration: nullableNum(history.breadthAcceleration),
      participationDecay: nullableNum(history.participationDecay),
      leadershipDecay: nullableNum(history.leadershipDecay),
      relativeBreadthWeakness: nullableNum(history.relativeBreadthWeakness),
      phasePersistence: nullableNum(history.phasePersistence),
      regimePersistence: nullableNum(
        persistence.score ?? history.regimePersistence
      ),
    },
  };

  const masterScore = num(input.master.score);
  const crashProbability = num(input.crash.probability);
  const edgeScore = num(input.edge.score);
  const dangerScore = num(input.danger.score);
  const heat = num(input.systemHeat.value);
  const liquidityScore = num(input.liquidity.score);
  const fragilityScore = num(input.fragility.score);
  const participationScore = num(input.participation.score);
  const rotationDecayScore = num(input.rotationDecay.score);
  const rotationConfidence = num(input.rotationConfirm.confidence);
  const marketQualityScore = num(input.marketQuality.score);
  const breadthThrustScore = num(input.breadthThrust.score);
  const squeezeRisk = num(input.squeeze.risk);
  const regimeSyncScore = num(input.regimeSync.score);
  const breadth50 = num(input.structure.breadth50);
  const breadth200 = num(input.structure.breadth200);
  const breadthTrend = num(input.history.breadthTrend);
  const breadthAcceleration = num(input.history.breadthAcceleration);
  const participationDecay = num(input.history.participationDecay);
  const leadershipDecay = num(input.history.leadershipDecay);
  const relativeBreadthWeakness = num(input.history.relativeBreadthWeakness);
  const phasePersistence = num(input.history.phasePersistence);
  const regimePersistence = num(input.history.regimePersistence);

  const executionMode =
    executionState.executionMode ?? executionState.mode ?? "WAIT";

  const riskState = executionState.riskState ?? "UNKNOWN";
  const tacticalBias = executionState.tacticalBias ?? "NEUTRAL";
  const rotationState = rotationConfirm.state ?? "UNKNOWN";

  const bullishRotation =
    rotationState === "BULLISH_CONFIRMED" ||
    rotationState === "BULLISH_CONFIRMING" ||
    (
      ["CONFIRMED", "INSTITUTIONAL_CONFIRMATION"].includes(rotationState) &&
      rotationConfirm.direction === "BULLISH"
    );

  const ndxMomentum5D = nullableNum(priceMomentum?.ndx?.momentum5D);
  const ndxAcceleration = nullableNum(priceMomentum?.ndx?.acceleration);
  const ndxQuality = priceMomentum?.ndx?.dataQuality ?? {};
  const ndxShortAvailable = ndxQuality.momentum5DAvailable === true && ndxMomentum5D !== null;
  const ndxMediumAvailable = ndxQuality.momentum20DAvailable === true && nullableNum(priceMomentum?.ndx?.momentum20D) !== null;
  const ndxAccelerationAvailable = ndxQuality.accelerationAvailable === true && ndxAcceleration !== null;
  const ndxScoreAvailable = ndxShortAvailable && ndxMediumAvailable && nullableNum(priceMomentum?.ndx?.score) !== null;

  const ndxBullishImpulse =
    ndxShortAvailable && ndxAccelerationAvailable && ndxMomentum5D !== null && ndxAcceleration !== null
      ? ndxMomentum5D >= 3 && ndxAcceleration >= 0.5
      : false;

  const deterioratingBreadth =
    hasNumber(input.history.breadthTrend) && breadthTrend <= -2;

  const acceleratingBreadthDamage =
    hasNumber(input.history.breadthAcceleration) &&
    breadthAcceleration <= -1;

  const severeBreadthDamage =
    hasNumber(input.history.breadthAcceleration) &&
    breadthAcceleration <= -3;

  const participationFailure =
    hasNumber(input.participation.score) && participationScore < 40;

  const severeParticipationFailure =
    hasNumber(input.participation.score) && participationScore < 30;

  const persistentWeakness =
    typeof persistence.bearishPersistence === "boolean"
      ? persistence.bearishPersistence
      : (
          (
            hasNumber(input.history.relativeBreadthWeakness) &&
            relativeBreadthWeakness > 15
          ) ||
          (
            hasNumber(input.history.regimePersistence) &&
            regimePersistence >= 60
          )
        );

  const chronicWeakness =
    (
      hasNumber(input.history.relativeBreadthWeakness) &&
      relativeBreadthWeakness > 20
    ) ||
    (
      hasNumber(input.history.regimePersistence) &&
      regimePersistence >= 85
    );

  // Positive leadership decay means deterioration.
  const leadershipConcentration =
    hasNumber(input.history.leadershipDecay) && leadershipDecay >= 2;

  const severeLeadershipConcentration =
    hasNumber(input.history.leadershipDecay) && leadershipDecay >= 5;

  const poorMarketQuality =
    hasNumber(input.marketQuality.score) && marketQualityScore < 45;

  const severeMarketQuality =
    hasNumber(input.marketQuality.score) && marketQualityScore < 35;

  const weakLiquidity =
    hasNumber(input.liquidity.score) && liquidityScore < 40;

  const criticalLiquidity =
    hasNumber(input.liquidity.score) && liquidityScore < 25;

  const highFragility =
    hasNumber(input.fragility.score) && fragilityScore >= 70;

  const extremeFragility =
    hasNumber(input.fragility.score) && fragilityScore >= 85;

  const rotationBroken =
    hasNumber(input.rotationDecay.score) && rotationDecayScore >= 75;

  const rotationExhausted =
    hasNumber(input.rotationDecay.score) && rotationDecayScore >= 85;

  const negativeHeat =
    hasNumber(input.systemHeat.value) && heat <= -0.7;

  const severeHeat =
    hasNumber(input.systemHeat.value) && heat <= -1.4;

  const highDanger =
    hasNumber(input.danger.score) && dangerScore >= 60;

  const extremeDanger =
    hasNumber(input.danger.score) && dangerScore >= 80;

  const defensivePhase = [
    "PHASE_4_RISK",
    "PHASE_5_BREAKDOWN",
    "PHASE_6_ACCELERATION",
    "PHASE_7_CAPITULATION",
  ].includes(phase);

  const aggressiveLongPhase = phase === "PHASE_1_EXPANSION";
  const warningPhase = phase === "PHASE_2_WARNING";
  const distributionPhase = phase === "PHASE_3_DISTRIBUTION";

  const defensiveStructuralConfirmationCount = [
    distributionPhase || defensivePhase,
    crashProbability >= 30,
    deterioratingBreadth,
    acceleratingBreadthDamage,
    participationFailure,
    highFragility,
    poorMarketQuality,
    weakLiquidity,
    rotationBroken,
    persistentWeakness,
    highDanger,
    negativeHeat,
  ].filter(Boolean).length;

  const defensiveStructuralConfirmed =
    defensiveStructuralConfirmationCount >= 3;

  const strongDefensiveStructuralConfirmed =
    defensiveStructuralConfirmationCount >= 5;

  let globalRiskMultiplier = 1;

  if (hasNumber(input.crash.probability)) {
    if (crashProbability >= 70) globalRiskMultiplier *= 0.60;
    else if (crashProbability >= 50) globalRiskMultiplier *= 0.78;
    else if (crashProbability >= 35) globalRiskMultiplier *= 0.92;
  }

  if (hasNumber(input.danger.score)) {
    if (dangerScore >= 80) globalRiskMultiplier *= 0.55;
    else if (dangerScore >= 60) globalRiskMultiplier *= 0.75;
    else if (dangerScore >= 40) globalRiskMultiplier *= 0.92;
  }

  if (criticalLiquidity) globalRiskMultiplier *= 0.65;
  else if (weakLiquidity) globalRiskMultiplier *= 0.85;

  if (extremeFragility) globalRiskMultiplier *= 0.60;
  else if (highFragility) globalRiskMultiplier *= 0.80;

  if (poorMarketQuality) globalRiskMultiplier *= 0.85;
  if (persistentWeakness) globalRiskMultiplier *= 0.90;
  if (chronicWeakness) globalRiskMultiplier *= 0.82;
  if (negativeHeat) globalRiskMultiplier *= 0.90;
  if (severeHeat) globalRiskMultiplier *= 0.80;
  if (riskState === "BREAKDOWN") globalRiskMultiplier *= 0.75;
  if (riskState === "CRISIS") globalRiskMultiplier *= 0.60;
  if (executionMode === "DEFENSIVE") globalRiskMultiplier *= 0.85;
  if (executionMode === "REDUCE_RISK") globalRiskMultiplier *= 0.80;
  if (executionMode === "WAIT") globalRiskMultiplier *= 0.85;

  globalRiskMultiplier =
    clamp(globalRiskMultiplier * 100, 20, 110) / 100;

  const BASE_SIZE = 40;

  const nasdaqPut = tradeStack.nasdaqPut ?? {
    instrument: "NASDAQ_PUT",
    direction: "SHORT",
    strength: 0,
    state: "NEUTRAL",
  };

  const nasdaqCall = tradeStack.nasdaqCall ?? {
    instrument: "NASDAQ_CALL",
    direction: "LONG",
    strength: 0,
    state: "NEUTRAL",
  };

  const russellCall = tradeStack.russellCall ?? {
    instrument: "RUSSELL_CALL",
    direction: "LONG",
    strength: 0,
    state: "NEUTRAL",
  };

  const tradeStackDirectionalConflict =
    tradeStack.meta?.directionalConflict === true ||
    tradeStack.directionalConflict === true;

  // Compatibility field: heuristic candidate support, not probability.
  function calculateConfidence(flow: FlowName, strength: number) {
    let confidence = 50 + (strength - 50) * 0.55;

    if (hasNumber(input.master.score)) {
      confidence += flow === "NASDAQ_PUT"
        ? (masterScore - 50) * 0.18
        : (50 - masterScore) * 0.10;
    }

    if (hasNumber(input.regimeSync.score)) {
      confidence += (regimeSyncScore - 50) * 0.08;
    }

    if (
      hasNumber(input.rotationConfirm.confidence) &&
      flow === "RUSSELL_CALL"
    ) {
      confidence += (rotationConfidence - 50) * 0.12;
    }

    if (
      hasNumber(input.marketQuality.score) &&
      flow !== "NASDAQ_PUT"
    ) {
      confidence += (marketQualityScore - 50) * 0.08;
    }

    if (flow === "NASDAQ_PUT") {
      if (distributionPhase) confidence += 6;
      if (defensivePhase) confidence += 12;
      if (crashProbability >= 30) confidence += 5;
      if (crashProbability >= 50) confidence += 5;
      if (participationFailure) confidence += 6;
      if (deterioratingBreadth) confidence += 5;
      if (acceleratingBreadthDamage) confidence += 5;
      if (highFragility) confidence += 5;
      if (extremeFragility) confidence += 3;
      if (poorMarketQuality) confidence += 4;
      if (weakLiquidity) confidence += 4;
      if (rotationBroken) confidence += 4;
      if (persistentWeakness) confidence += 4;

      if (strongDefensiveStructuralConfirmed) confidence += 8;
      else if (defensiveStructuralConfirmed) confidence += 4;

      if (squeezeRisk >= 70) confidence -= 8;
      if (squeezeRisk >= 85) confidence -= 6;
      if (riskState === "CRISIS") confidence -= 4;
    }

    if (flow === "NASDAQ_CALL") {
      if (aggressiveLongPhase) confidence += 10;
      if (warningPhase) confidence -= 5;
      if (distributionPhase) confidence -= 8;
      if (defensivePhase) confidence -= 18;
      if (participationFailure) confidence -= 10;
      if (rotationBroken) confidence -= 8;
      if (highFragility) confidence -= 8;
      if (poorMarketQuality) confidence -= 6;
      if (riskState === "CRISIS") confidence -= 20;
    }

    if (flow === "RUSSELL_CALL") {
      if (rotationConfidence >= 75) confidence += 10;
      if (rotationConfidence < 45) confidence -= 10;
      if (rotationBroken) confidence -= 12;
      if (rotationExhausted) confidence -= 20;
      if (defensivePhase) confidence -= 12;
      if (breadthThrustScore >= 70) confidence += 5;
      if (participationFailure) confidence -= 8;
      if (riskState === "CRISIS") confidence -= 20;
    }

    return clamp(Math.round(confidence));
  }

  function calculateFlowRiskMultiplier(flow: FlowName) {
    let multiplier = globalRiskMultiplier;

    if (flow === "NASDAQ_PUT") {
      if (distributionPhase) multiplier *= 1.08;
      if (defensivePhase) multiplier *= 1.22;
      if (highFragility) multiplier *= 1.08;
      if (extremeFragility) multiplier *= 1.05;
      if (weakLiquidity) multiplier *= 1.05;
      if (rotationBroken) multiplier *= 1.08;
      if (persistentWeakness) multiplier *= 1.05;

      if (strongDefensiveStructuralConfirmed) multiplier *= 1.15;
      else if (defensiveStructuralConfirmed) multiplier *= 1.08;

      if (riskState === "CRISIS") multiplier *= 0.80;
      if (phase === "PHASE_7_CAPITULATION") multiplier *= 0.45;
      if (squeezeRisk >= 70) multiplier *= 0.85;
      if (squeezeRisk >= 85) multiplier *= 0.75;
      if (ndxBullishImpulse) multiplier *= 0.88;
    }

    if (flow === "NASDAQ_CALL") {
      if (defensivePhase) multiplier *= 0.30;
      if (distributionPhase) multiplier *= 0.60;
      if (highFragility) multiplier *= 0.70;
      if (criticalLiquidity) multiplier *= 0.70;
      if (riskState === "CRISIS") multiplier *= 0.20;

      if (
        aggressiveLongPhase &&
        marketQualityScore >= 65 &&
        participationScore >= 65
      ) {
        multiplier *= 1.10;
      }
    }

    if (flow === "RUSSELL_CALL") {
      if (rotationConfidence < 60) multiplier *= 0.65;
      if (rotationConfidence >= 80 && !rotationBroken) multiplier *= 1.10;
      if (breadthThrustScore >= 70 && participationScore >= 60) multiplier *= 1.10;
      if (rotationBroken) multiplier *= 0.65;
      if (rotationExhausted) multiplier *= 0.35;
      if (defensivePhase) multiplier *= 0.70;
      if (riskState === "CRISIS") multiplier *= 0.20;
    }

    return clamp(multiplier, 0.05, 1.30);
  }

  // Existing heuristic sizing modifier; not a statistical edge estimate.
  function calculateFlowEdge(flow: FlowName, strength: number) {
    let score = strength >= 75
      ? 8
      : strength >= 60 ? 5 : strength >= 40 ? 2 : -4;

    // The Edge Engine measures constructive long conditions.
    if (flow !== "NASDAQ_PUT" && hasNumber(input.edge.score)) {
      if (edgeScore >= 60) score += 3;
      else if (edgeScore >= 40) score += 1;
      else if (edgeScore < 20) score -= 3;
    }

    if (flow === "NASDAQ_PUT") {
      if (distributionPhase) score += 3;
      if (defensivePhase) score += 5;
      if (crashProbability >= 30) score += 2;
      if (crashProbability >= 50) score += 2;
      if (deterioratingBreadth) score += 3;
      if (participationFailure) score += 3;
      if (acceleratingBreadthDamage) score += 3;
      if (highFragility) score += 3;
      if (poorMarketQuality) score += 2;
      if (weakLiquidity) score += 2;
      if (rotationBroken) score += 2;
      if (persistentWeakness) score += 2;

      if (strongDefensiveStructuralConfirmed) score += 5;
      else if (defensiveStructuralConfirmed) score += 3;
    }

    if (flow === "NASDAQ_CALL") {
      if (aggressiveLongPhase) score += 4;
      if (marketQualityScore >= 70 && participationScore >= 70) score += 3;
      if (defensivePhase) score -= 6;
      if (rotationBroken) score -= 3;
    }

    if (flow === "RUSSELL_CALL") {
      if (rotationConfidence >= 75) score += 4;
      if (rotationConfidence < 50) score -= 4;
      if (breadthThrustScore >= 70) score += 3;
      if (rotationBroken) score -= 5;
    }

    return score;
  }

  function falseBreakRisk() {
    const value = input.rotationConfirm.falseBreakRisk;
    return value !== null && value > 65;
  }

  function isDefensivePutEligible(
    strength: number,
    direction: Direction
  ) {
    if (direction !== "SHORT") return false;
    if (strength >= 60) return true;
    if (strength >= 45 && defensiveStructuralConfirmed) return true;

    return strength >= 35 &&
      strongDefensiveStructuralConfirmed &&
      (distributionPhase || defensivePhase);
  }

  function sizeFlow(flow: FlowName, candidate: any): SizedFlow {
    const own = engine?.russellSizingOverride;
    if (flow === "RUSSELL_CALL" && own?.instrument === "RUSSELL_CALL") {
      const approved = candidate?.eligible === true && !(candidate.blockReasons?.length > 0) && !tradeStackDirectionalConflict &&
        own.eligible === true && own.direction === "LONG" && Number.isFinite(own.size) && own.size > 0 &&
        engine?.crash?.panicState?.state !== "PANIC" && num(engine?.crash?.probability) <= 70;
      const adjusted = approved ? Math.floor(own.size * Math.min(1, globalRiskMultiplier)) : 0;
      return { ...own, instrument: "RUSSELL_CALL", direction: "LONG", eligible: approved && adjusted > 0,
        size: adjusted, prePortfolioSize: adjusted, reason: approved ? own.reason : "Independent Russell or shared risk gate blocks entry",
        diagnostics: { ...own.diagnostics, independentRussellContext: true, sharedRiskMultiplierApplied: globalRiskMultiplier } };
    }
    const strength = clamp(num(candidate?.strength));
    const state = candidate?.state ?? "NEUTRAL";
    const direction = candidate?.direction ?? "NONE";

    // The explicit current-structure probe is a separate, capped admission
    // path. It need not satisfy the mature defensive-build confirmation count.
    // All hard vetoes and risk reductions below still apply.
    const earlyCurrentPutStarter = flow === "NASDAQ_PUT" &&
      candidate?.eligible === true && direction === "SHORT" && strength >= 45 &&
      engine?.putTiming?.decision === "DEFENSIVE_BUILD" &&
      engine?.putTiming?.execution === "SMALL STARTER" &&
      engine?.putTiming?.meta?.earlyCurrentTrigger === true &&
      engine?.putTiming?.meta?.earlyQualityPolicy === "MARKET_QUALITY_PRODUCER_STATES_V1" &&
      ["currentStructureAvailable", "eligiblePhase", "earlyWarningActive", "weakBreadth",
        "weakParticipation", "weakMarketQuality", "bearishRotationContext",
        "ownNasdaqTimingAvailable", "ownNasdaqCooling", "noBullishCountermove",
        "noPanic", "limitedContradiction"].every(key => engine?.putTiming?.meta?.earlyCurrentChecks?.[key] === true) &&
      ndxShortAvailable && ndxMediumAvailable && ndxAccelerationAvailable && ndxScoreAvailable &&
      !ndxBullishImpulse;

    let eligible = strength >= 20;

    if (direction === "NONE") eligible = false;

    if (flow === "NASDAQ_PUT") {
      eligible = isDefensivePutEligible(strength, direction) || earlyCurrentPutStarter;
    } else if (executionMode === "WAIT" && strength < 65) {
      eligible = false;
    }

    if (riskState === "CRISIS" && flow !== "NASDAQ_PUT") {
      eligible = false;
    }

    const expectedDirection = flow === "NASDAQ_PUT" ? "SHORT" : "LONG";

    const missingCoreInputs = [
      "master", "liquidity", "fragility",
      "participation", "marketQuality",
    ].filter(key => !hasNumber((input as any)[key].score));

    const upstreamBlocked =
      candidate?.eligible === false ||
      (
        Array.isArray(candidate?.blockReasons) &&
        candidate.blockReasons.length > 0
      ) ||
      tradeStackDirectionalConflict ||
      candidate?.managementAction === "REDUCE_RISK" ||
      (
        flow === "NASDAQ_PUT" &&
        engine?.putTiming?.decision === "PANIC_SHORT"
      );

    const longExecutionBlocked =
      flow !== "NASDAQ_PUT" &&
      (
        !["BUILD_POSITION", "ADD_ON_PULLBACKS"].includes(executionMode) ||
        ["BREAKDOWN", "INTERNAL_BREAKDOWN", "CRISIS", "UNKNOWN"].includes(riskState) ||
        (flow === "RUSSELL_CALL" && !bullishRotation)
      );

    if (
      direction !== expectedDirection ||
      upstreamBlocked ||
      longExecutionBlocked ||
      missingCoreInputs.length > 0 ||
      phase === "UNKNOWN" ||
      riskState === "UNKNOWN"
    ) {
      eligible = false;
    }

    if (phase === "PHASE_7_CAPITULATION") eligible = false;

    if (!eligible) {
      let reason = "Trade strength below entry threshold";

      if (direction === "NONE") reason = "No valid trade direction";
      if (flow === "NASDAQ_PUT") {
        reason = "Defensive PUT lacks sufficient structural confirmation";
      }
      if (
        flow !== "NASDAQ_PUT" &&
        executionMode === "WAIT" &&
        strength < 65
      ) {
        reason = "Execution WAIT with insufficient strength";
      }
      if (riskState === "CRISIS" && flow !== "NASDAQ_PUT") {
        reason = "Crisis regime blocks bullish exposure";
      }
      if (phase === "PHASE_7_CAPITULATION") reason = "Capitulation regime";
      if (longExecutionBlocked) reason = "Long execution or risk gate blocks this flow";
      if (direction !== expectedDirection) reason = "Trade direction does not match instrument";
      if (
        missingCoreInputs.length > 0 ||
        phase === "UNKNOWN" ||
        riskState === "UNKNOWN"
      ) {
        reason = "Incomplete sizing inputs";
      }
      if (upstreamBlocked) {
        reason = "TradeStack blocks new entry or requests risk management";
      }

      return {
        instrument: flow,
        direction,
        eligible: false,
        size: 0,
        rawSize: 0,
        prePortfolioSize: 0,
        strength,
        confidence: 0,
        riskMultiplier: 0,
        mode: "NO_TRADE",
        state,
        reason,
        diagnostics: {
          missingCoreInputs,
          upstreamBlocked,
          longExecutionBlocked,
          confidenceType: "CANDIDATE_SUPPORT_HEURISTIC",
          postRiskMinimumSize: 0,
        },
      };
    }

    const confidence = calculateConfidence(flow, strength);
    const flowEdge = calculateFlowEdge(flow, strength);
    const riskMultiplier = calculateFlowRiskMultiplier(flow);

    let rawSize = 8 + (strength - 20) * 0.62;
    const baseSize = rawSize;

    rawSize *= 0.70 + (confidence / 100) * 0.45;
    rawSize += flowEdge * 1.25;
    const supportAdjustedSize = rawSize;

    rawSize *= riskMultiplier;
    const riskAdjustedSize = rawSize;

    if (flow === "NASDAQ_CALL") {
      if (participationFailure) rawSize *= 0.60;
      if (poorMarketQuality) rawSize *= 0.65;
      if (severeBreadthDamage) rawSize *= 0.55;
      if (highFragility) rawSize *= 0.70;
    }

    if (flow === "RUSSELL_CALL") {
      if (rotationConfidence < 55) rawSize *= 0.55;
      if (rotationDecayScore >= 70) rawSize *= 0.50;
      if (falseBreakRisk()) rawSize *= 0.60;
    }

    if (flow === "NASDAQ_PUT") {
      const ndxPriceScore = nullableNum(
        ndxScoreAvailable ? priceMomentum?.ndx?.score : null
      );

      if (
        ndxBullishImpulse &&
        ndxPriceScore !== null &&
        ndxPriceScore >= 70
      ) {
        rawSize *= 0.72;
      }

      if (ndxPriceScore !== null && ndxPriceScore <= 25) {
        rawSize *= 0.80;
      }

      if (defensiveStructuralConfirmed) rawSize *= 1.08;
      if (strongDefensiveStructuralConfirmed) rawSize *= 1.10;
    }

    const safetyAdjustedSize = rawSize;

    let maxFlowSize = BASE_SIZE;

    if (strength >= 75 && confidence >= 70) maxFlowSize = 40;
    else if (strength >= 60) maxFlowSize = 32;
    else maxFlowSize = 22;

    if (flow !== "NASDAQ_PUT") {
      if (
        severeMarketQuality ||
        severeParticipationFailure ||
        extremeFragility
      ) {
        maxFlowSize = Math.min(maxFlowSize, 20);
      } else if (
        poorMarketQuality ||
        participationFailure ||
        highFragility
      ) {
        maxFlowSize = Math.min(maxFlowSize, 28);
      }

      if (chronicWeakness) maxFlowSize = Math.min(maxFlowSize, 22);
    }

    if (flow === "NASDAQ_PUT") {
      if (
        defensivePhase &&
        strength >= 75 &&
        confidence >= 70
      ) {
        maxFlowSize = 45;
      } else if (
        defensivePhase &&
        strength >= 55 &&
        confidence >= 60
      ) {
        maxFlowSize = 35;
      } else if (
        defensiveStructuralConfirmed &&
        strength >= 45
      ) {
        maxFlowSize = 25;
      }

      // Severe structural breakdown retains the existing defensive ceiling.
      if (["BREAKDOWN", "CRISIS"].includes(riskState)) maxFlowSize = Math.min(maxFlowSize, 20);
    }

    if (direction === "LONG" && defensivePhase) {
      maxFlowSize = Math.min(maxFlowSize, 15);
    }

    if (flow === "RUSSELL_CALL" && rotationConfidence < 75) {
      maxFlowSize = Math.min(maxFlowSize, 20);
    }

    // The current-structure entry is a probe, not a full defensive build.
    // Preserve every upstream veto and risk multiplier; this is only a ceiling.
    if (flow === "NASDAQ_PUT" &&
      engine?.putTiming?.meta?.earlyCurrentTrigger === true &&
      engine?.putTiming?.decision === "DEFENSIVE_BUILD" &&
      engine?.putTiming?.execution === "SMALL STARTER") {
      maxFlowSize = Math.min(maxFlowSize, 5);
    }
    rawSize = Math.min(rawSize, maxFlowSize);

    const earlyStarterState =
      state === "EARLY_DEFENSIVE_SHORT" ||
      state === "EARLY_LONG";

    if (earlyStarterState) rawSize = Math.min(rawSize, 15);

    // No minimum allocation is applied after risk reduction.
    const size = clamp(Math.round(rawSize));

    let mode = "MODERATE";
    if (size >= 35) mode = "AGGRESSIVE";
    else if (size < 15) mode = "STARTER";
    else if (size < 25) mode = "DEFENSIVE";

    if (
      flow !== "NASDAQ_PUT" &&
      (
        severeMarketQuality ||
        extremeFragility ||
        chronicWeakness ||
        riskState === "BREAKDOWN" ||
        riskState === "CRISIS"
      )
    ) {
      mode = size > 0 ? "CAPITAL_PRESERVATION" : "NO_TRADE";
    }

    if (
      flow === "NASDAQ_PUT" &&
      size > 0 &&
      (defensivePhase || distributionPhase)
    ) {
      if (size < 15) mode = "DEFENSIVE_STARTER";
      else if (size < 25) mode = "DEFENSIVE_BUILD";
    }

    return {
      instrument: flow,
      direction,
      eligible: size > 0,
      size,
      rawSize: Math.round(rawSize),
      prePortfolioSize: size,
      strength,
      confidence,
      riskMultiplier: Math.round(riskMultiplier * 100) / 100,
      mode: size > 0 ? mode : "NO_TRADE",
      state,
      reason: size <= 0
        ? "Risk-adjusted allocation rounds to zero"
        : candidate?.driver ?? candidate?.reason ?? "TradeStack candidate",
      diagnostics: {
        earlyCurrentPutStarter,
        baseSize,
        supportAdjustedSize,
        flowEdge,
        riskAdjustedSize,
        safetyAdjustedSize,
        maxFlowSize,
        postRiskMinimumSize: 0,
        exactRiskMultiplier: riskMultiplier,
        priceDataQuality: { ndxMomentum5DAvailable: ndxShortAvailable, ndxMomentum20DAvailable: ndxMediumAvailable, ndxAccelerationAvailable, ndxScoreAvailable, ndxBullishImpulse, measured: { momentum5D: ndxShortAvailable ? ndxMomentum5D : null, momentum20D: ndxMediumAvailable ? nullableNum(priceMomentum?.ndx?.momentum20D) : null, acceleration: ndxAccelerationAvailable ? ndxAcceleration : null }, aggregatePriceFallbackUsed: false },
        confidenceType: "CANDIDATE_SUPPORT_HEURISTIC",
        confidenceIsProbability: false,
        edgeIsStatisticalEstimate: false,
      },
    };
  }

  const sizedNasdaqPut = sizeFlow("NASDAQ_PUT", nasdaqPut);
  const sizedNasdaqCall = sizeFlow("NASDAQ_CALL", nasdaqCall);
  const sizedRussellCall = sizeFlow("RUSSELL_CALL", russellCall);

  const individualFlows = [
    sizedNasdaqPut,
    sizedNasdaqCall,
    sizedRussellCall,
  ];

  const activeBeforePortfolio = individualFlows.filter(
    flow => flow.eligible && flow.size > 0
  );

  const hasShortCandidate = activeBeforePortfolio.some(
    flow => flow.direction === "SHORT"
  );

  const hasLongCandidate = activeBeforePortfolio.some(
    flow => flow.direction === "LONG"
  );

  const portfolioDirectionalConflict =
    hasShortCandidate && hasLongCandidate;

  let portfolioCap = 60;

  if (
    marketQualityScore >= 70 &&
    participationScore >= 70 &&
    liquidityScore >= 65 &&
    fragilityScore < 55 &&
    dangerScore < 35 &&
    !persistentWeakness
  ) {
    portfolioCap = 75;
  }

  if (defensivePhase) portfolioCap = Math.min(portfolioCap, 60);
  if (distributionPhase) portfolioCap = Math.min(portfolioCap, 65);
  if (portfolioDirectionalConflict) portfolioCap = Math.min(portfolioCap, 50);

  if (
    severeMarketQuality ||
    extremeFragility ||
    chronicWeakness
  ) {
    portfolioCap = Math.min(portfolioCap, 40);
  }

  if (riskState === "BREAKDOWN") portfolioCap = Math.min(portfolioCap, 50);
  if (["BREAKDOWN", "CRISIS"].includes(riskState)) portfolioCap = Math.min(portfolioCap, 25);

  const rawPortfolioSize = activeBeforePortfolio.reduce(
    (total, flow) => total + flow.size,
    0
  );

  const portfolioScale =
    rawPortfolioSize > portfolioCap && rawPortfolioSize > 0
      ? portfolioCap / rawPortfolioSize
      : 1;

  function applyPortfolioLayer(flow: SizedFlow): SizedFlow {
    if (!flow.eligible || flow.size <= 0) {
      return { ...flow, prePortfolioSize: flow.size, size: 0 };
    }

    return {
      ...flow,
      prePortfolioSize: flow.size,
      size: Math.floor(flow.size * portfolioScale),
    };
  }

  let finalNasdaqPut = applyPortfolioLayer(sizedNasdaqPut);
  let finalNasdaqCall = applyPortfolioLayer(sizedNasdaqCall);
  let finalRussellCall = applyPortfolioLayer(sizedRussellCall);

  let finalFlows = [
    finalNasdaqPut,
    finalNasdaqCall,
    finalRussellCall,
  ];

  const currentTotal = finalFlows.reduce(
    (total, flow) => total + flow.size,
    0
  );

  let remaining = Math.max(
    0,
    Math.floor(portfolioCap - currentTotal)
  );

  if (portfolioScale < 1 && remaining > 0) {
    const ranked = individualFlows
      .map((flow, index) => {
        const exact = flow.size * portfolioScale;
        return {
          index,
          remainder: exact - Math.floor(exact),
          eligible: flow.eligible && flow.size > 0,
        };
      })
      .filter(item => item.eligible)
      .sort((a, b) => b.remainder - a.remainder);

    let cursor = 0;

    while (remaining > 0 && ranked.length > 0) {
      const item = ranked[cursor % ranked.length];
      const projectedTotal = finalFlows.reduce(
        (total, flow) => total + flow.size,
        0
      );

      if (projectedTotal >= portfolioCap) break;

      finalFlows[item.index] = {
        ...finalFlows[item.index],
        size: finalFlows[item.index].size + 1,
      };

      remaining--;
      cursor++;
    }
  }

  [finalNasdaqPut, finalNasdaqCall, finalRussellCall] = finalFlows;

  const activeFinalFlows = finalFlows.filter(flow => flow.size > 0);

  const totalSize = finalFlows.reduce(
    (total, flow) => total + flow.size,
    0
  );

  const hasLong = activeFinalFlows.some(flow => flow.direction === "LONG");
  const hasShort = activeFinalFlows.some(flow => flow.direction === "SHORT");

  let direction: "LONG" | "SHORT" | "MIXED" | "NEUTRAL" = "NEUTRAL";

  if (hasLong && hasShort) direction = "MIXED";
  else if (hasLong) direction = "LONG";
  else if (hasShort) direction = "SHORT";

  let mode = "NO_TRADE";

  if (totalSize >= 55) mode = "AGGRESSIVE";
  else if (totalSize >= 30) mode = "MODERATE";
  else if (totalSize > 0) mode = "DEFENSIVE";

  if (
    totalSize > 0 &&
    (severeMarketQuality || extremeFragility || chronicWeakness)
  ) {
    mode = "CAPITAL_PRESERVATION";
  }

  if (activeFinalFlows.length === 1 && finalNasdaqPut.size > 0) {
    mode = finalNasdaqPut.size < 15
      ? "DEFENSIVE_STARTER"
      : "DEFENSIVE_PUT_BUILD";
  }

  const activeInstruments = activeFinalFlows.map(
    flow => flow.instrument
  );

  const pipeline = {
    master: input.master,
    crash: input.crash,
    edge: input.edge,
    liquidity: input.liquidity,
    participation: input.participation,
    fragility: input.fragility,
    rotationDecay: input.rotationDecay,
    rotationConfirm: input.rotationConfirm,
    marketQuality: input.marketQuality,
    breadthThrust: input.breadthThrust,
    squeeze: input.squeeze,
    regimeSync: input.regimeSync,
    danger: input.danger,
    systemHeat: input.systemHeat,
    structure: input.structure,
    history: input.history,
    phase,
    defensiveStructuralConfirmationCount,
    defensiveStructuralConfirmed,
    strongDefensiveStructuralConfirmed,
  };

  function buildFlowPipeline(flow: SizedFlow) {
    return {
      instrument: flow.instrument,
      direction: flow.direction,
      state: flow.state,
      strength: flow.strength,
      confidence: flow.confidence,
      rawSize: flow.rawSize,
      prePortfolioSize: flow.prePortfolioSize,
      finalSize: flow.size,
      riskMultiplier: flow.riskMultiplier,
      mode: flow.mode,
      eligible: flow.eligible,
      reason: flow.reason,
      diagnostics: flow.diagnostics,
    };
  }

  const flowPipeline = {
    nasdaqPut: buildFlowPipeline(finalNasdaqPut),
    nasdaqCall: buildFlowPipeline(finalNasdaqCall),
    russellCall: buildFlowPipeline(finalRussellCall),
  };

  return {
    size: totalSize,
    direction,
    mode,

    primary: activeFinalFlows.length > 0
      ? activeFinalFlows.slice().sort((a, b) => b.size - a.size)[0]
      : null,

    nasdaqPut: finalNasdaqPut,
    nasdaqCall: finalNasdaqCall,
    russellCall: finalRussellCall,
    flows: finalFlows,
    activeFlows: activeFinalFlows,
    activeInstruments,

    portfolio: {
      totalSize,
      rawSize: rawPortfolioSize,
      cap: portfolioCap,
      scale: Math.round(portfolioScale * 100) / 100,
      activeFlows: activeFinalFlows.length,
      activeInstruments,
      direction,
      directionalConflict: portfolioDirectionalConflict,
      tradeStackDirectionalConflict,
    },

    risk: {
      globalMultiplier: Math.round(globalRiskMultiplier * 100) / 100,
      crashProbability: input.crash.probability,
      dangerScore: input.danger.score,
      heat: input.systemHeat.value,
      liquidityScore: input.liquidity.score,
      fragilityScore: input.fragility.score,
      participationScore: input.participation.score,
      marketQualityScore: input.marketQuality.score,
      rotationDecayScore: input.rotationDecay.score,
      regimeSyncScore: input.regimeSync.score,
      rotationConfidence: input.rotationConfirm.confidence,
      squeezeRisk: input.squeeze.risk,
      defensiveStructuralConfirmationCount,
      defensiveStructuralConfirmed,
      strongDefensiveStructuralConfirmed,
    },

    components: {
      masterScore: input.master.score,
      crashScore: input.crash.score,
      crashProbability: input.crash.probability,
      edgeScore: input.edge.score,
      liquidityScore: input.liquidity.score,
      participationScore: input.participation.score,
      fragilityScore: input.fragility.score,
      rotationDecayScore: input.rotationDecay.score,
      rotationConfidence: input.rotationConfirm.confidence,
      marketQualityScore: input.marketQuality.score,
      breadthThrustScore: input.breadthThrust.score,
      squeezeRisk: input.squeeze.risk,
      regimeSyncScore: input.regimeSync.score,
      dangerScore: input.danger.score,
      systemHeat: input.systemHeat.value,
      breadth50: input.structure.breadth50,
      breadth200: input.structure.breadth200,
      breadthTrend: input.history.breadthTrend,
      breadthAcceleration: input.history.breadthAcceleration,
      participationDecay: input.history.participationDecay,
      leadershipDecay: input.history.leadershipDecay,
      relativeBreadthWeakness: input.history.relativeBreadthWeakness,
      phasePersistence: input.history.phasePersistence,
      regimePersistence: input.history.regimePersistence,
      defensiveStructuralConfirmationCount,
      defensiveStructuralConfirmed,
      strongDefensiveStructuralConfirmed,
    },

    pipeline,
    flowPipeline,

    meta: {
      confidenceType: "CANDIDATE_SUPPORT_HEURISTIC",
      confidenceIsProbability: false,
      defensiveEvidenceIsIndependent: false,
      postRiskMinimumSize: 0,
      putUsesConstructiveEdgeScore: false,
      weightsCalibratedByThisAudit: false,
      phase,
      defensivePhase,
      aggressiveLongPhase,
      warningPhase,
      distributionPhase,
      executionMode,
      riskState,
      tacticalBias,
      tradeStackDirectionalConflict,
      portfolioDirectionalConflict,
      persistentWeakness,
      chronicWeakness,
      deterioratingBreadth,
      acceleratingBreadthDamage,
      severeBreadthDamage,
      participationFailure,
      severeParticipationFailure,
      leadershipConcentration,
      severeLeadershipConcentration,
      poorMarketQuality,
      severeMarketQuality,
      weakLiquidity,
      criticalLiquidity,
      highFragility,
      extremeFragility,
      rotationBroken,
      rotationExhausted,
      highDanger,
      extremeDanger,
      defensiveStructuralConfirmationCount,
      defensiveStructuralConfirmed,
      strongDefensiveStructuralConfirmed,
      falseBreakRisk: falseBreakRisk(),
    },
  };
}
