/* Trade candidates require an upstream setup. Structural risk alone is not an entry.
 * All hard blockers and execution caps are applied after scoring overlays.
 */
function numeric(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const object = value as Record<string, unknown>;
    for (const key of ["value", "score", "current"]) {
      const n = numeric(object[key], NaN);
      if (Number.isFinite(n)) return n;
    }
  }
  return fallback;
}
function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}
function explicitBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function tradeStackEngine(input: any) {
  const data = input ?? {};
  const putTiming = data.putTiming ?? {};
  const nasdaqCall = data.nasdaqCall ?? {};
  const russell = data.russell ?? {};
  const priceMomentum = data.priceMomentum ?? {};
  const edgeState = data.edgeState ?? {};
  const master = data.master ?? {};
  const rotationConfirm = data.rotationConfirm ?? {};
  const rotationDecay = data.rotationDecay ?? {};
  const executionState = data.executionState ?? {};
  const regimeSync = data.regimeSync ?? {};
  const historyMetrics = data.historyMetrics ?? {};
  const phaseConfirmation = data.phaseConfirmation ?? {};
  const persistence = data.regimePersistence ?? {};
  const phase = typeof data.phase === "string" ? data.phase : data.phase?.phase ?? "UNKNOWN";
  const putDecision = putTiming.decision ?? "NONE";
  const nasdaqCallDecision = nasdaqCall.decision ?? nasdaqCall.action ?? "NONE";
  const russellDecision = russell.decision ?? russell.action ?? "NONE";
  const mode = master.mode ?? "NEUTRAL";
  const executionMode = executionState.executionMode ?? "WAIT";
  const riskState = executionState.riskState ?? "UNKNOWN";
  const phaseConfirmed = explicitBoolean(phaseConfirmation.confirmed,
    explicitBoolean(master.meta?.phaseConfirmed));
  const phaseConfidence = clamp(numeric(phaseConfirmation.confidence,
    numeric(master.meta?.phaseConfidence)));
  const regimeAligned = regimeSync.aligned === true;
  const institutionalAligned = regimeSync.institutionallyAligned === true;
  const edgeScore = clamp(numeric(edgeState.score));
  const edgeTier = edgeState.tier ?? "NO_EDGE";
  const priceScore = clamp(numeric(priceMomentum.score, 50));
  const priceState = priceMomentum.state ?? "NEUTRAL";
  const priceDirection = priceMomentum.direction ?? "FLAT";
  const priceAcceleration = numeric(priceMomentum.acceleration);
  const bullishImpulse = priceMomentum.bullishImpulse === true;
  const bearishImpulse = priceMomentum.bearishImpulse === true;
  const coolingPrice = priceMomentum.cooling === true;
  const priceConflict = priceMomentum.conflict === true;

  const ndx = priceMomentum.ndx ?? {};
  const rut = priceMomentum.rut ?? {};
  function priceQuality(index: any) {
    const quality = index.dataQuality ?? {};
    const short = quality.momentum5DAvailable === true && Number.isFinite(numeric(index.momentum5D, NaN));
    const medium = quality.momentum20DAvailable === true && Number.isFinite(numeric(index.momentum20D, NaN));
    const acceleration = quality.accelerationAvailable === true && Number.isFinite(numeric(index.acceleration, NaN));
    return { complete: short && medium && acceleration && Number.isFinite(numeric(index.score, NaN)), momentum5DAvailable: short, momentum20DAvailable: medium, accelerationAvailable: acceleration,
      measured: { momentum5D: short ? numeric(index.momentum5D) : null, momentum20D: medium ? numeric(index.momentum20D) : null, acceleration: acceleration ? numeric(index.acceleration) : null }, numericFallbackIsMeasurement: false };
  }
  const ndxQuality = priceQuality(ndx);
  const rutQuality = priceQuality(rut);
  const aggregateComplete = priceMomentum.dataQuality?.complete === true;
  const ndxPriceScore = clamp(numeric(ndx.score, priceScore));
  const ndxMomentum5D = numeric(ndx.momentum5D);
  const ndxMomentum20D = numeric(ndx.momentum20D);
  const ndxAcceleration = numeric(ndx.acceleration);
  const ndxDirection = ndx.direction ?? priceDirection;
  const rutPriceScore = clamp(numeric(rut.score, priceScore));
  const rutMomentum5D = numeric(rut.momentum5D);
  const rutMomentum20D = numeric(rut.momentum20D);
  const rutAcceleration = numeric(rut.acceleration);
  const hasNdxImpulseInputs = ndxQuality.momentum5DAvailable && ndxQuality.accelerationAvailable;
  const ndxBullishImpulse = explicitBoolean(ndx.bullishImpulse,
    hasNdxImpulseInputs ? ndxMomentum5D >= 3 && ndxAcceleration >= 0.5 : false);
  const ndxBearishImpulse = hasNdxImpulseInputs && explicitBoolean(ndx.bearishImpulse,
    ndxMomentum5D <= -3 && ndxAcceleration <= -0.5);
  const hasNdxCoolingInputs = hasNdxImpulseInputs && ndxQuality.momentum20DAvailable;
  const ndxCooling = hasNdxCoolingInputs && explicitBoolean(ndx.cooling,
    ndxMomentum20D > 2 && ndxMomentum5D < ndxMomentum20D * 0.35 && ndxAcceleration < 0);

  const rotationState = rotationConfirm.state ?? "EARLY";
  const rotationConfidence = clamp(numeric(rotationConfirm.confidence));
  const rotationQuality = clamp(numeric(rotationConfirm.quality, 50));
  const sustainability = clamp(numeric(rotationConfirm.sustainability, 50));
  const rotationParticipation = clamp(numeric(rotationConfirm.participation, 50));
  const falseBreakRisk = clamp(numeric(rotationConfirm.falseBreakRisk, 50));
  const bullishConfirmed = rotationState === "BULLISH_CONFIRMED" ||
    (rotationConfirm.direction === "BULLISH" && ["CONFIRMED", "INSTITUTIONAL_CONFIRMATION"].includes(rotationState));
  const bullishConfirming = rotationState === "BULLISH_CONFIRMING";
  const bearishRotation = rotationConfirm.direction === "BEARISH" ||
    ["BEARISH_CONFIRMED", "BEARISH_CONFIRMING", "INTERNAL_BREAKDOWN"].includes(rotationState);
  const decayState = rotationDecay.state ?? "UNKNOWN";
  const decayScore = clamp(numeric(rotationDecay.score, 50));
  const breadthTrend = numeric(historyMetrics.breadthTrend);
  const breadthAcceleration = numeric(historyMetrics.breadthAcceleration);
  const participationDecay = numeric(historyMetrics.participationDecay);
  const leadershipDecay = numeric(historyMetrics.leadershipDecay);
  const crashTrend = numeric(historyMetrics.crashTrend);
  const phasePersistence = numeric(historyMetrics.phasePersistence);
  const regimePersistence = numeric(persistence.score, numeric(historyMetrics.regimePersistence));
  const relativeBreadthWeakness = numeric(historyMetrics.relativeBreadthWeakness);
  const deterioratingBreadth = breadthTrend <= -2;
  const acceleratingBreadthDecay = breadthAcceleration <= -1;
  const participationErosion = participationDecay > 10;
  const severeParticipationErosion = participationDecay > 20;
  const leadershipConcentration = leadershipDecay >= 2;
  const risingCrashRisk = crashTrend >= 3;
  const severeRisingCrashRisk = crashTrend >= 6;
  // Producer flags are not replaced by phase-age or unrelated score thresholds.
  const prolongedDistribution = historyMetrics.prolongedDistribution === true;
  const persistentDistribution = explicitBoolean(historyMetrics.persistentDistribution,
    persistence.state === "STRUCTURAL_DISTRIBUTION");
  const prolongedBearRegime = historyMetrics.prolongedBearRegime === true;
  const severeBearRegime = historyMetrics.severeBearRegime === true;
  const broadParticipationFailure = relativeBreadthWeakness > 10;
  const severeParticipationFailure = relativeBreadthWeakness > 20;
  const phaseRisk = phase === "PHASE_4_RISK";
  const hardLongPhase = ["PHASE_5_BREAKDOWN", "PHASE_6_ACCELERATION", "PHASE_7_CAPITULATION"].includes(phase);
  const hardLongRisk = ["CRISIS", "BREAKDOWN", "INTERNAL_BREAKDOWN"].includes(riskState);
  const longExecutionAllowed = ["BUILD_POSITION", "ADD_ON_PULLBACKS"].includes(executionMode) &&
    ["STABLE", "FRAGILE"].includes(riskState);
  const putBases: Record<string, {strength: number; driver: string; cap: number}> = {
    DEFENSIVE_BUILD: {strength: 42, driver: "DEFENSIVE_SHORT", cap: 55},
    STRUCTURAL_BUILD: {strength: 58, driver: "STRUCTURAL_SHORT", cap: 74},
    TACTICAL_BUILD: {strength: 68, driver: "TACTICAL_SHORT", cap: 74},
    STRONG_BUILD: {strength: 75, driver: "CONFIRMED_SHORT", cap: 100},
    TRANSITIONAL_SHORT: {strength: 68, driver: "TRANSITIONAL_SHORT", cap: 74},
    AGGRESSIVE: {strength: 75, driver: "PUT_FLOW", cap: 100},
    ADD: {strength: 60, driver: "PUT_FLOW", cap: 74},
    BUILD: {strength: 45, driver: "PUT_FLOW", cap: 55},
    EARLY: {strength: 30, driver: "EARLY_BREAKDOWN", cap: 55}
  };
  const longBases: Record<string, number> = {AGGRESSIVE: 70, ADD: 55, BUILD: 45, EARLY: 30};

  function edgeOverlay(strength: number): number {
    return strength + (edgeScore >= 80 ? 15 : edgeScore >= 60 ? 10 : edgeScore >= 40 ? 5 : edgeScore < 20 ? -15 : 0);
  }
  function historyLongPenalty(strength: number): number {
    if (deterioratingBreadth) strength -= 8;
    if (acceleratingBreadthDecay) strength -= 6;
    if (participationErosion) strength -= 12;
    if (risingCrashRisk) strength -= 10;
    if (prolongedDistribution || persistentDistribution) strength -= 10;
    if (prolongedBearRegime) strength -= 10;
    if (severeBearRegime) strength -= 15;
    if (broadParticipationFailure) strength -= 8;
    if (severeParticipationFailure) strength -= 12;
    return strength;
  }
  function finish(instrument: string, direction: string, rawStrength: number, driver: string,
    cap: number, blockReasons: string[], price: any) {
    const strength = blockReasons.length ? 0 : clamp(Math.round(rawStrength), 0, cap);
    const state = strength >= 75 ? (direction === "SHORT" ? "SHORT_ATTACK" : "LONG_ATTACK") :
      strength >= 40 ? (direction === "SHORT" ? "SHORT_BUILDING" : "LONG_BUILDING") :
      strength >= 20 ? (direction === "SHORT" ? "EARLY_DEFENSIVE_SHORT" : "EARLY_LONG") : "NEUTRAL";
    return {instrument, direction, state, strength, driver, price,
      eligible: blockReasons.length === 0 && strength >= 20,
      rawStrength, strengthCap: cap, blockReasons,
      managementAction: instrument === "NASDAQ_PUT" && putDecision === "PANIC_SHORT" ? "REDUCE_RISK" : "NONE"};
  }
  function evaluatePut() {
    const base = putBases[putDecision];
    const blocks: string[] = [];
    if (putDecision === "PANIC_SHORT") blocks.push("PANIC_MANAGEMENT_NO_NEW_ENTRY");
    else if (!base) blocks.push("NO_PUT_ENTRY_DECISION");
    if (phase === "PHASE_7_CAPITULATION") blocks.push("CAPITULATION_NO_NEW_PUTS");
    if (putTiming.entryWindow !== undefined && putTiming.entryWindow !== "OPEN") blocks.push("PUT_ENTRY_WINDOW_NOT_OPEN");
    if (["NONE", "REDUCE RISK", "REDUCE_RISK", "WAIT"].includes(putTiming.execution)) blocks.push("PUT_EXECUTION_NOT_OPEN");
    let strength = base?.strength ?? 0;
    // EdgeState measures constructive rotation; it is not a short-edge score.
    if (mode === "RISK") strength += 8;
    if (deterioratingBreadth) strength += 5;
    if (participationErosion) strength += 6;
    if (risingCrashRisk) strength += 6;
    if (prolongedDistribution || persistentDistribution) strength += 5;
    if (prolongedBearRegime) strength += 5;
    if (severeBearRegime) strength += 7;
    if (broadParticipationFailure) strength += 5;
    if (severeParticipationFailure) strength += 7;
    const decayBonuses: Record<string, number> = {
      INTERNAL_BREAKDOWN: 8, ROTATION_FAILURE: 12, DISTRIBUTION_ROTATION: 8, EXHAUSTED_ROTATION: 10
    };
    strength += decayBonuses[decayState] ?? 0;
    if (decayScore >= 75) strength += 6;
    if (phaseConfirmed && phaseConfidence >= 70) strength += 5;
    if (!phaseConfirmed && phaseRisk) strength -= 10;
    if (ndxQuality.complete && ndxPriceScore >= 75) strength -= 15;
    else if (ndxQuality.complete && ndxPriceScore >= 60) strength -= 8;
    if (ndxQuality.complete && ndxPriceScore <= 25) strength += 12;
    else if (ndxQuality.complete && ndxPriceScore <= 40) strength += 6;
    if (ndxBearishImpulse) strength += 8;
    if (ndxQuality.complete && ndxAcceleration < 0 && ndxDirection === "DOWN") strength += 5;
    if (ndxBullishImpulse) strength -= 10;
    if (ndxCooling && ndxDirection === "UP") strength -= 5;
    if (ndxQuality.complete && priceConflict && ndxPriceScore >= 70) strength -= 5;
    let cap = base?.cap ?? 0;
    if (putTiming.execution === "SMALL STARTER") cap = Math.min(cap, 55);
    if (putTiming.execution === "PARTIAL SIZE") cap = Math.min(cap, 74);
    if (["DEFENSIVE", "REDUCE_RISK", "CAPITAL_PRESERVATION"].includes(executionMode)) cap = Math.min(cap, 74);
    if (ndxQuality.complete && ndxBullishImpulse && ndxPriceScore >= 70 && !ndxBearishImpulse) cap = Math.min(cap, 55);
    return finish("NASDAQ_PUT", "SHORT", strength, base?.driver ?? (putDecision === "PANIC_SHORT" ? "PANIC_SHORT" : "NONE"), cap, blocks,
      {score: ndxPriceScore, momentum5D: ndxMomentum5D, momentum20D: ndxMomentum20D,
        acceleration: ndxAcceleration, state: ndxQuality.complete ? ndx.trend ?? priceState : "UNKNOWN", dataQuality: ndxQuality});
  }
  function longBlocks(decision: string): string[] {
    const blocks: string[] = [];
    if (longBases[decision] === undefined) blocks.push("NO_LONG_ENTRY_DECISION");
    if (hardLongPhase) blocks.push("LONG_PHASE_BLOCK");
    if (hardLongRisk) blocks.push("LONG_RISK_BLOCK");
    if (!longExecutionAllowed) blocks.push("LONG_EXECUTION_NOT_ALLOWED");
    if (mode === "CRASH") blocks.push("MASTER_CRASH_MODE");
    return blocks;
  }
  function evaluateNasdaqCall() {
    const blocks = longBlocks(nasdaqCallDecision);
    let strength = longBases[nasdaqCallDecision] ?? 0;
    strength = historyLongPenalty(strength);
    if (mode === "RISK") strength -= 15;
    const decayPenalties: Record<string, number> = {
      EARLY_DECAY: 5, INTERNAL_BREAKDOWN: 10, ROTATION_FAILURE: 12,
      DISTRIBUTION_ROTATION: 10, EXHAUSTED_ROTATION: 12
    };
    strength -= decayPenalties[decayState] ?? 0;
    if (decayScore > 70) strength -= 6;
    if (executionMode === "WAIT") strength -= 15;
    if (!phaseConfirmed) strength -= 20;
    if (phaseConfidence < 55) strength -= 10;
    if (!regimeAligned) strength -= 15;
    if (!institutionalAligned) strength -= 10;
    if (phaseConfirmed && phaseConfidence >= 80) strength += 5;
    if (ndxQuality.complete && ndxPriceScore >= 75) strength += 15;
    else if (ndxQuality.complete && ndxPriceScore >= 60) strength += 8;
    if (ndxBullishImpulse) strength += 8;
    if (ndxQuality.complete && ndxAcceleration > 0 && ndxDirection === "UP") strength += 5;
    if (ndxQuality.complete && ndxPriceScore <= 25) strength -= 18;
    else if (ndxQuality.complete && ndxPriceScore <= 40) strength -= 10;
    if (ndxBearishImpulse) strength -= 10;
    if (ndxQuality.complete && priceConflict && ndxPriceScore >= 60) strength -= 5;
    if (ndxQuality.complete && ndxBullishImpulse && ndxPriceScore >= 60 && strength >= 20) strength += 4;
    // Caps must follow all price/confirmation bonuses.
    let cap = nasdaqCallDecision === "EARLY" ? 35 : 100;
    if (phase === "PHASE_3_DISTRIBUTION") cap = Math.min(cap, 35);
    if (phaseRisk) cap = Math.min(cap, 20);
    return finish("NASDAQ_CALL", "LONG", strength,
      longBases[nasdaqCallDecision] === undefined ? "NONE" : nasdaqCallDecision === "EARLY" ? "NASDAQ_REBOUND" : "NASDAQ_CALL", cap, blocks,
      {score: ndxPriceScore, momentum5D: ndxMomentum5D, momentum20D: ndxMomentum20D,
        acceleration: ndxAcceleration, state: ndxQuality.complete ? ndx.trend ?? priceState : "UNKNOWN", dataQuality: ndxQuality});
  }
  function evaluateRussellCall() {
    const own = data.russellFlowOverride;
    if (own?.instrument === "RUSSELL_CALL") {
      const sharedPanic = data.crash?.panicState?.state === "PANIC" || numeric(data.crash?.probability) > 70;
      return { ...own, eligible: own.eligible === true && !sharedPanic, strength: sharedPanic ? 0 : own.strength,
        blockReasons: [...(own.blockReasons ?? []), ...(sharedPanic ? ["SHARED_SYSTEMIC_RISK"] : [])], independentRussellContext: true };
    }
    const blocks = longBlocks(russellDecision);
    if (bearishRotation || (!bullishConfirmed && !bullishConfirming)) blocks.push("NO_BULLISH_ROTATION_CONFIRMATION");
    let strength = edgeOverlay(longBases[russellDecision] ?? 0);
    strength = historyLongPenalty(strength);
    if (mode === "RISK") strength -= 15;
    if (leadershipConcentration) strength -= 5;
    if (bullishConfirmed) strength += rotationState === "INSTITUTIONAL_CONFIRMATION" ? 10 : 8;
    // High bearish-confirmation confidence cannot reward a long candidate.
    if (bullishConfirmed || bullishConfirming) {
      if (rotationConfidence >= 80) strength += 6;
      if (rotationQuality >= 75) strength += 5;
      if (sustainability >= 70) strength += 4;
      if (rotationParticipation >= 70) strength += 4;
    }
    if (falseBreakRisk > 65) strength -= 18;
    const decayPenalties: Record<string, number> = {
      EARLY_DECAY: 10, INTERNAL_BREAKDOWN: 18, ROTATION_FAILURE: 25,
      DISTRIBUTION_ROTATION: 20, EXHAUSTED_ROTATION: 25
    };
    strength -= decayPenalties[decayState] ?? 0;
    if (decayScore > 70) strength -= 10;
    if (!phaseConfirmed && phaseRisk) strength -= 10;
    if (phaseConfirmed && phaseConfidence > 70) strength += 5;
    if (executionMode === "WAIT") strength -= 20;
    if (!phaseConfirmed) strength -= 25;
    if (phaseConfidence < 55) strength -= 15;
    if (!regimeAligned) strength -= 15;
    if (!institutionalAligned) strength -= 10;
    if (rutQuality.complete && rutPriceScore >= 75) strength += 15;
    else if (rutQuality.complete && rutPriceScore >= 60) strength += 8;
    if (rutQuality.momentum5DAvailable && rutQuality.accelerationAvailable && rutMomentum5D >= 2 && rutAcceleration >= 0.5) strength += 8;
    if (rutQuality.complete && rutPriceScore <= 25) strength -= 18;
    else if (rutQuality.complete && rutPriceScore <= 40) strength -= 10;
    if (rutQuality.momentum5DAvailable && rutQuality.accelerationAvailable && rutMomentum5D <= -3 && rutAcceleration <= -0.5) strength -= 10;
    let cap = !bullishConfirmed || russellDecision === "EARLY" ? 35 : 100;
    if (rutQuality.complete && rutPriceScore <= 30 && rutAcceleration <= -0.5) cap = Math.min(cap, 20);
    if (phase === "PHASE_3_DISTRIBUTION") cap = Math.min(cap, 35);
    if (phaseRisk) cap = Math.min(cap, 15);
    return finish("RUSSELL_CALL", "LONG", strength,
      longBases[russellDecision] === undefined ? "NONE" : russellDecision === "EARLY" ? "ROTATION_EARLY" : "ROTATION", cap, blocks,
      {score: rutPriceScore, momentum5D: rutMomentum5D, momentum20D: rutMomentum20D,
        acceleration: rutAcceleration, state: rutQuality.complete ? rut.trend ?? priceState : "UNKNOWN", dataQuality: rutQuality});
  }

  const assessedCandidates = [evaluatePut(), evaluateNasdaqCall(), evaluateRussellCall()];
  const shortStrength = assessedCandidates[0].strength;
  const longStrength = Math.max(assessedCandidates[1].strength, assessedCandidates[2].strength);
  const directionalConflict = shortStrength >= 40 && longStrength >= 40 && Math.abs(shortStrength - longStrength) < 10;
  // Enforce WAIT for new entries in the actual flows consumed by position sizing.
  const candidates = directionalConflict ? assessedCandidates.map(candidate => ({...candidate,
    assessmentState: candidate.state, assessmentStrength: candidate.strength,
    state: "NEUTRAL", strength: 0, eligible: false,
    blockReasons: [...candidate.blockReasons, "DIRECTIONAL_CONFLICT"]
  })) : assessedCandidates;
  const active = candidates.filter(candidate => candidate.eligible);
  const primary = active.length ? [...active].sort((a, b) => b.strength - a.strength)[0] :
    {instrument: "NONE", direction: "NONE", state: "NEUTRAL", strength: 0, driver: "NONE"};
  const stackState = directionalConflict ? "CONFLICT" : primary.state;
  const driver = directionalConflict ? "DIRECTIONAL_CONFLICT" : primary.driver;
  if (data.debug === true) console.log("[TRADE STACK]", {phase, executionMode, riskState, directionalConflict,
    assessedCandidates, primary});
  return {
    state: stackState, type: primary.direction, strength: primary.strength, driver,
    directionalConflict,
    primaryFlow: {instrument: primary.instrument, direction: primary.direction,
      state: primary.state, strength: primary.strength, driver},
    nasdaqPut: candidates[0], nasdaqCall: candidates[1], russellCall: candidates[2],
    candidates, assessedCandidates,
    edge: {score: edgeScore, tier: edgeTier},
    priceMomentum: {dataQuality: priceMomentum.dataQuality ?? {complete: false}, score: priceScore, state: aggregateComplete ? priceState : "UNKNOWN", direction: priceDirection,
      acceleration: priceAcceleration, bullishImpulse, bearishImpulse, coolingPrice, conflict: priceConflict},
    meta: {putDecision, nasdaqCallDecision, russellDecision, mode, phase, phaseConfirmed,
      phaseConfidence, rotationState, rotationConfidence, rotationQuality, sustainability,
      participation: rotationParticipation, falseBreakRisk, decayState, decayScore,
      executionMode, riskState, regimeAligned, institutionalAligned, directionalConflict,
      bullishConfirmed, bullishConfirming, longExecutionAllowed,
      putEdgeOverlayApplied: false, panicIsManagementOnly: putDecision === "PANIC_SHORT"},
    history: {breadthTrend, breadthAcceleration, participationDecay, leadershipDecay,
      crashTrend, phasePersistence, regimePersistence, relativeBreadthWeakness,
      prolongedBearRegime, severeBearRegime, broadParticipationFailure, severeParticipationFailure,
      deterioratingBreadth, acceleratingBreadthDecay, participationErosion,
      severeParticipationErosion, leadershipConcentration, risingCrashRisk,
      severeRisingCrashRisk, prolongedDistribution, persistentDistribution}
  };
}

