// /lib/history/snapshotEngine.ts

export function createMarketSnapshot({
  map,
  engine,
}: {
  map: any;
  engine: any;
}) {
  /* =====================================================
  BASE OBJECTS
  ===================================================== */

  const structure = engine.structure ?? {};
  const breadth = structure.breadth ?? {};
  const highsLows = structure.highsLows ?? {};

  const history =
    engine.historyMetrics ??
    map.historyMetrics ??
    {};

  const rotation = engine.rotation ?? {};
  const rotationDecay = engine.rotationDecay ?? {};
  const rotationConfirm = engine.rotationConfirm ?? {};

  const crash = engine.crash ?? {};
  const phase = engine.phaseData ?? {};
  const persistence = engine.regimePersistence ?? {};

  const participation = engine.participation ?? {};
  const liquidity = engine.liquidity ?? {};
  const fragility = engine.fragility ?? {};
  const breadthThrust = engine.breadthThrust ?? {};
  const breadthVelocity = engine.breadthVelocity ?? {};
  const internalDivergence = engine.internalDivergence ?? {};

  const gamma = engine.gamma ?? {};
  const squeeze = engine.squeeze ?? {};

  const earlyWarning = engine.earlyWarning ?? {};
  const marketQuality = engine.marketQuality ?? {};
  const regimeSync = engine.regimeSync ?? {};

  const executionState = engine.executionState ?? {};
  const dangerZone = engine.dangerZone ?? {};

  const priceMomentum = engine.priceMomentum ?? {};
  const putTiming = engine.putTiming ?? {};
  const russell = engine.russell ?? {};
  const nasdaqCall = engine.nasdaqCall ?? {};

  const master = engine.master ?? {};
  const tradeStack = engine.tradeStack ?? {};
  const edgeState = engine.edgeState ?? {};

  const signal = engine.signal ?? {};
  const superSignal = engine.superSignal ?? {};

  const positionSizing =
    engine.positionSizing ??
    engine.sizing ??
    engine.positionSizingV2 ??
    engine.positionSize ??
    {};

  /* =====================================================
  STRUCTURE VALUE EXTRACTION
  ===================================================== */

  function extractValue(value: any) {
    if (
      value !== null &&
      typeof value === "object" &&
      "value" in value
    ) {
      return value.value;
    }

    return value;
  }

  /* =====================================================
  MARKET DATA REFERENCES
  ===================================================== */

  const mapIndices = map?.indices ?? {};
  const mapFutures = map?.futures ?? {};
  const mapMarketData = map?.marketData ?? {};

  const persistedIndices = {
    dow:
      mapIndices?.dow ??
      mapIndices?.DJI ??
      mapMarketData?.["^DJI"] ??
      null,

    nasdaq:
      mapIndices?.ndx ??
      mapIndices?.nasdaq ??
      mapIndices?.NASDAQ ??
      mapMarketData?.["^NDX"] ??
      null,

    sp500:
      mapIndices?.spx ??
      mapIndices?.sp500 ??
      mapIndices?.SP500 ??
      mapMarketData?.["^GSPC"] ??
      null,

    russell:
      mapIndices?.rut ??
      mapIndices?.russell ??
      mapIndices?.RUSSELL ??
      mapMarketData?.["^RUT"] ??
      null,

    vix:
      mapIndices?.vix ??
      mapIndices?.VIX ??
      mapMarketData?.["^VIX"] ??
      mapMarketData?.VIX ??
      mapMarketData?.["VIX"] ??
      null,

    vixTermRatio:
      mapIndices?.vixTermRatio ??
      mapIndices?.VIX_TERM_RATIO ??
      map?.vixTermRatio ??
      liquidity.vixTermRatio ??
      null,

    volOfVolRatio:
      mapIndices?.volOfVolRatio ??
      mapIndices?.VOL_OF_VOL_RATIO ??
      map?.volOfVolRatio ??
      liquidity.volOfVolRatio ??
      null,
  };

  const persistedFutures = {
    dow:
      mapFutures?.ym ??
      mapFutures?.dow ??
      mapMarketData?.["YM=F"] ??
      null,

    nasdaq:
      mapFutures?.nq ??
      mapFutures?.nasdaq ??
      mapMarketData?.["NQ=F"] ??
      null,

    sp500:
      mapFutures?.es ??
      mapFutures?.sp500 ??
      mapMarketData?.["ES=F"] ??
      null,

    russell:
      mapFutures?.rty ??
      mapFutures?.russell ??
      mapMarketData?.["RTY=F"] ??
      null,
  };

  /* =====================================================
  SNAPSHOT
  ===================================================== */

  return {
    timestamp: new Date().toISOString(),

    credit: {
      rawRatio: map?.creditRatio ?? null,
      ma50: map?.creditRatioMA50 ?? null,
      ratioToMA50: map?.creditRatioToMA50 ?? null,
      distancePct: map?.creditDistancePct ?? null,
      signal: map?.creditSignal ?? "unknown",
      dataQuality: map?.creditDataQuality ?? null,
    },

    /* MARKET REGIME */

    phase: {
      phase: engine.phase,
      regimeState: phase.regimeState,
      subPhase: phase.subPhase,
      confidence: phase.confidence,
    },

    /* MASTER */

    master: {
      ...master,

      score: master.score,
      mode: master.mode,
      regime: master.regime,
      netExposure: master.netExposure,

      components: master.components
        ? {
            ...master.components,
            crash: master.components.crash,
            rotation: master.components.rotation,
            timing: master.components.timing,
            russell: master.components.russell,
            participation: master.components.participation,
            breadthThrust: master.components.breadthThrust,
            breadthVelocity: master.components.breadthVelocity,
            rotationDecay: master.components.rotationDecay,
            liquidity: master.components.liquidity,
            marketQuality: master.components.marketQuality,
            fragility: master.components.fragility,
            regimeSync: master.components.regimeSync,
            dangerZone: master.components.dangerZone,
            priceMomentum: master.components.priceMomentum,
          }
        : undefined,

      meta: master.meta
        ? {
            ...master.meta,
            scoreType: master.meta.scoreType,
            scoreInterpretation: master.meta.scoreInterpretation,
            callThreshold: master.meta.callThreshold,
            neutralLowerThreshold: master.meta.neutralLowerThreshold,
            neutralUpperThreshold: master.meta.neutralUpperThreshold,
            putThreshold: master.meta.putThreshold,
            signal: master.meta.signal,
            color: master.meta.color,
            signalStrength: master.meta.signalStrength,
            phaseAdjustment: master.meta.phaseAdjustment,
            persistenceAdjustment: master.meta.persistenceAdjustment,
            warningAdjustment: master.meta.warningAdjustment,
            executionAdjustment: master.meta.executionAdjustment,
            currentQuality: master.meta.currentQuality,
            structuralQuality: master.meta.structuralQuality,
            historicalQuality: master.meta.historicalQuality,
            crashRisk: master.meta.crashRisk,
            timingRisk: master.meta.timingRisk,
          }
        : undefined,
    },

    /* CRASH / RISK */

    crash: {
      score: crash.score,
      probability: crash.probability,
      label: crash.label,
      eventType: crash.eventType,

      structuralFragility: crash.structuralFragility
        ? {
            score: crash.structuralFragility.score,
            state: crash.structuralFragility.state,
          }
        : undefined,

      trigger: crash.trigger,
      panicState: crash.panicState,
      momentum: crash.momentum,
      trend: crash.trend,
    },

    /* MARKET STRUCTURE */

    structure: {
      breadth: {
        b20: extractValue(breadth.b20),
        b50: extractValue(breadth.b50),
        b200: extractValue(breadth.b200),
      },

      health: extractValue(structure.health),
      advanceDecline: extractValue(structure.advanceDecline),

      highsLows: {
        highs: extractValue(highsLows.highs),
        lows: extractValue(highsLows.lows),
      },

      distribution: extractValue(structure.distribution),
      marketStructure: structure.marketStructure,
    },

    /* ROTATION
     * Preserve the current engine output, including flags,
     * institutional participation, history inputs and metrics.
     * Legacy fields remain available when produced.
     */

    rotation: {
      ...rotation,

      score: rotation.score,
      signal: rotation.signal,
      regime: rotation.regime,
      state: rotation.state,

      rsSmall: rotation.rsSmall,
      rsGrowth: rotation.rsGrowth,
      rsEqual: rotation.rsEqual,

      smallCapLeadership: rotation.smallCapLeadership,
      growthLeadership: rotation.growthLeadership,

      confidence: rotation.confidence,
      timing: rotation.timing,
      phase: rotation.phase,
      squeezeDriven: rotation.squeezeDriven,
    },

    /* ROTATION DECAY */

    rotationDecay: {
      ...rotationDecay,

      score: rotationDecay.score,
      state: rotationDecay.state,
      trend: rotationDecay.trend,
      persistence: rotationDecay.persistence,
      exhaustion: rotationDecay.exhaustion,
      breadthVelocity: rotationDecay.breadthVelocity,
      internalDivergence: rotationDecay.internalDivergence,
    },

    /* ROTATION CONFIRMATION
     * Includes quality and all other fields actually produced.
     */

    rotationConfirm: {
      ...rotationConfirm,

      state: rotationConfirm.state,
      score: rotationConfirm.score,
      confidence: rotationConfirm.confidence,
      liquiditySupport: rotationConfirm.liquiditySupport,
      rotationDecayScore: rotationConfirm.rotationDecayScore,
      falseBreakRisk: rotationConfirm.falseBreakRisk,
    },

    /* BREADTH VELOCITY
     * Keep native signals/slopes and expose the previous
     * flat field names for compatibility.
     * A false flag or zero slope remains a valid value.
     */

    breadthVelocity: {
      ...breadthVelocity,

      score: breadthVelocity.score,
      state: breadthVelocity.state,

      shortTermWeakness:
        breadthVelocity.signals?.shortTermWeakness ??
        breadthVelocity.shortTermWeakness,

      mediumTermWeakness:
        breadthVelocity.signals?.mediumTermWeakness ??
        breadthVelocity.mediumTermWeakness,

      longTermWeakness:
        breadthVelocity.signals?.longTermWeakness ??
        breadthVelocity.longTermWeakness,

      adDeterioration:
        breadthVelocity.signals?.adDeterioration ??
        breadthVelocity.adDeterioration,

      spxBreadthDivergence:
        breadthVelocity.signals?.spxBreadthDivergence ??
        breadthVelocity.spxBreadthDivergence,

      severeDivergence:
        breadthVelocity.signals?.severeDivergence ??
        breadthVelocity.severeDivergence,

      rollingDistribution:
        breadthVelocity.signals?.rollingDistribution ??
        breadthVelocity.rollingDistribution,

      internalBreakdown:
        breadthVelocity.signals?.internalBreakdown ??
        breadthVelocity.internalBreakdown,

      breadthParticipationDecay:
        breadthVelocity.breadthParticipationDecay,

      decayPersistence: breadthVelocity.decayPersistence,

      institutionalDivergence:
        breadthVelocity.institutionalDivergence,

      b20Slope5d:
        breadthVelocity.slopes?.b20Slope5d ??
        breadthVelocity.b20Slope5d,

      b50Slope5d:
        breadthVelocity.slopes?.b50Slope5d ??
        breadthVelocity.b50Slope5d,

      b200Slope10d:
        breadthVelocity.slopes?.b200Slope10d ??
        breadthVelocity.b200Slope10d,

      adSlope5d:
        breadthVelocity.slopes?.adSlope5d ??
        breadthVelocity.adSlope5d,

      scoreMeaning:
        "0=low deterioration | 100=severe deterioration",
    },

    /* INTERNAL DIVERGENCE
     * Includes active, textual severity, signals,
     * summary and metrics from the current engine.
     * The numeric risk measure remains score.
     */

    internalDivergence: {
      ...internalDivergence,

      score: internalDivergence.score,
      state: internalDivergence.state,
      signal: internalDivergence.signal,
      confidence: internalDivergence.confidence,

      breadthDivergence: internalDivergence.breadthDivergence,
      participationDivergence:
        internalDivergence.participationDivergence,
      rotationDivergence: internalDivergence.rotationDivergence,
      leadershipDivergence: internalDivergence.leadershipDivergence,
      liquidityDivergence: internalDivergence.liquidityDivergence,
      institutionalDivergence:
        internalDivergence.institutionalDivergence,
      structuralBreak: internalDivergence.structuralBreak,
    },

    /* PARTICIPATION */

    participation: {
      ...participation,

      score: participation.score,
      state: participation.state,
      breadth: participation.breadth,
      leadership: participation.leadership,
      decay: participation.decay,
      participationFailure: participation.participationFailure,
      quality: participation.quality,
      institutional: participation.institutional,
      leadershipBreadth: participation.leadershipBreadth,
      passiveDependence: participation.passiveDependence,
      breadthStructure: participation.breadthStructure,
      equalWeight: participation.equalWeight,
      smallCaps: participation.smallCaps,
      warning: participation.warning,
    },

    /* BREADTH THRUST */

    breadthThrust: {
      score: breadthThrust.score,
      state: breadthThrust.state,
      signal: breadthThrust.signal,
      participation: breadthThrust.participation,
      sustainability: breadthThrust.sustainability,
      institutional: breadthThrust.institutional,
      leadershipBreadth: breadthThrust.leadershipBreadth,
      passiveDependence: breadthThrust.passiveDependence,
      volume: breadthThrust.volume,
      leadership: breadthThrust.leadership,
      breadthStructure: breadthThrust.breadthStructure,
      divergence: breadthThrust.divergence,
    },

    /* LIQUIDITY */

    liquidity: {
      ...liquidity,
      score: liquidity.score,
      state: liquidity.state,
      trend: liquidity.trend,
      creditRatio: liquidity.creditRatio,
      vixTermRatio: liquidity.vixTermRatio,
      volOfVolRatio: liquidity.volOfVolRatio,
      marketLiquidityScore: liquidity.marketLiquidityScore,
      institutionalLiquidity: liquidity.institutionalLiquidity,
      institutionalSupport: liquidity.institutionalSupport,
      support: liquidity.support,
      impulse: liquidity.impulse,
      rawLiquidity: liquidity.rawLiquidity,
      credit: liquidity.credit,
      vixTerm: liquidity.vixTerm,
      volOfVol: liquidity.volOfVol,
      components: liquidity.components,
      historicalAverage: liquidity.historicalAverage,
      institutionalPressure: liquidity.institutionalPressure,
      summary: liquidity.summary,
    },

    /* GAMMA */

    gamma: {
      score: gamma.score,
      state: gamma.state,
      regime: gamma.regime,
      gammaExposure: gamma.gammaExposure,
      effectiveGamma: gamma.effectiveGamma,
      structuralGammaFloor: gamma.structuralGammaFloor,
      dealerCompression: gamma.dealerCompression,
      passiveGammaCompression: gamma.passiveGammaCompression,
      passiveFlowRisk: gamma.passiveFlowRisk,
      volSuppression: gamma.volSuppression,
      structuralInstability: gamma.structuralInstability,
      warning: gamma.warning,
      components: gamma.components,
    },

    /* SQUEEZE */

    squeeze: {
      ...squeeze,
      score: squeeze.score,
      risk: squeeze.risk,
      instability: squeeze.instability,
      gammaRegime: squeeze.gammaRegime,
      effectiveGamma: squeeze.effectiveGamma,
      passiveGamma: squeeze.passiveGamma,
      dealerCompression: squeeze.dealerCompression,
      passiveFlow: squeeze.passiveFlow,
      volSuppression: squeeze.volSuppression,
      structuralCompression: squeeze.structuralCompression,
      weakBreadth: squeeze.weakBreadth,
      weakParticipation: squeeze.weakParticipation,
      state: squeeze.state,
    },

    /* FRAGILITY */

    fragility: {
      ...fragility,
      score: fragility.score,
      state: fragility.state,
      trend: fragility.trend,
      breakdownRisk: fragility.breakdownRisk,
      liquidityFragility: fragility.liquidityFragility,
      structuralRisk: fragility.structuralRisk,
      concentrationRisk: fragility.concentrationRisk,
      crashProbability: fragility.crashProbability,
      participationRisk: fragility.participationRisk,
      breadthRisk: fragility.breadthRisk,
      rotationRisk: fragility.rotationRisk,
      marketQualityRisk: fragility.marketQualityRisk,
      liquidityRisk: fragility.liquidityRisk,
      historyRisk: fragility.historyRisk,
      structuralFlags: fragility.structuralFlags,
    },

    /* MARKET QUALITY */

    marketQuality: {
      ...marketQuality,

      score: marketQuality.score,
      state: marketQuality.state,
      trend: marketQuality.trend,
      breadth: marketQuality.breadth,
      participation: marketQuality.participation,
      equalWeight: marketQuality.equalWeight,
      smallCaps: marketQuality.smallCaps,
      leadershipQuality: marketQuality.leadershipQuality,
      internalSynchronity: marketQuality.internalSynchronity,
      components: marketQuality.components,
    },

    /* EARLY WARNING */

    earlyWarning: {
      active: earlyWarning.active,

      score:
        typeof earlyWarning.score === "object"
          ? earlyWarning.score?.value
          : earlyWarning.score,

      state: earlyWarning.state,
      reasons: earlyWarning.reasons,
    },

    /* REGIME PERSISTENCE
     * Preserve the actual engine fields, including any
     * persistence/recovery flags it produces.
     */

    regimePersistence: {
      ...persistence,

      score: persistence.score,
      state: persistence.state,
      bearishPersistence: persistence.bearishPersistence,
      bullishPersistence: persistence.bullishPersistence,
      trend: persistence.trend,
      regimeAge: persistence.regimeAge,
      distributionRisk: persistence.distributionRisk,
      recoveryQuality: persistence.recoveryQuality,
      falseRecoveryRisk: persistence.falseRecoveryRisk,
      trendStability: persistence.trendStability,
      marketFatigue: persistence.marketFatigue,
    },

    /* PRICE MOMENTUM */

    priceMomentum: {
      ...priceMomentum,

      score: priceMomentum.score,
      direction: priceMomentum.direction,
      trend: priceMomentum.trend,
      bullishImpulse: priceMomentum.bullishImpulse,
      bearishImpulse: priceMomentum.bearishImpulse,
      acceleration: priceMomentum.acceleration,

      ndx: priceMomentum.ndx
        ? {
            ...priceMomentum.ndx,
            score: priceMomentum.ndx.score,
            acceleration: priceMomentum.ndx.acceleration,
            direction: priceMomentum.ndx.direction,
          }
        : undefined,
    },

    /* NASDAQ / PUT / CALL */

    putTiming: {
      ...putTiming,
      decision: putTiming.decision,
      timing: putTiming.timing,
      execution: putTiming.execution,
      score: putTiming.score,
      institutionState: putTiming.institutionState,
      reason: putTiming.reason,
    },

    nasdaqCall: {
      decision: nasdaqCall.decision,
      signal: nasdaqCall.signal,
      score: nasdaqCall.score,
      timing: nasdaqCall.timing,
      state: nasdaqCall.state,
    },

    russell: {
      action: russell.action,
      decision: russell.decision,
      score: russell.score,
      signal: russell.signal,
      state: russell.state,
      regime: russell.regime,
      confidence: russell.confidence,
    },

    /* REGIME SYNC */

    regimeSync: {
      ...regimeSync,
      score: regimeSync.score,
      state: regimeSync.state,
      signal: regimeSync.signal,
      transition: regimeSync.transition,
    },

    /* EXECUTION
     * Preserve confidence, urgency, regimeAlignment
     * and summary exactly as produced.
     * Confidence is not substituted for a legacy score.
     */

    executionState: {
      ...executionState,

      state: executionState.state,
      signal: executionState.signal,
      score: executionState.score,

      executionMode:
        executionState.executionMode ??
        executionState.mode,

      riskState: executionState.riskState,
      tacticalBias: executionState.tacticalBias,
      marketMode: executionState.marketMode,
    },

    dangerZone: {
      score: dangerZone.score,
      state: dangerZone.state,
      level: dangerZone.level,
    },

    /* TRADE STACK */

    tradeStack: {
      type: tradeStack.type,
      strength: tradeStack.strength,
      driver: tradeStack.driver,
      primaryFlow: tradeStack.primaryFlow,
      meta: tradeStack.meta,
      history: tradeStack.history,
      decision: tradeStack.decision,
      state: tradeStack.state,

      directionalConflict:
        tradeStack.directionalConflict ??
        tradeStack.meta?.directionalConflict,

      nasdaqPut: tradeStack.nasdaqPut,
      nasdaqCall: tradeStack.nasdaqCall,
      russellCall: tradeStack.russellCall,
    },

    /* POSITION SIZING */

    positionSizing: {
      size: positionSizing.size,
      direction: positionSizing.direction,
      mode: positionSizing.mode,
      activeInstruments: positionSizing.activeInstruments,

      primary: positionSizing.primary,

      nasdaqPut: positionSizing.nasdaqPut,
      nasdaqCall: positionSizing.nasdaqCall,
      russellCall: positionSizing.russellCall,

      flows: positionSizing.flows,
      activeFlows: positionSizing.activeFlows,

      portfolio: positionSizing.portfolio
        ? {
            totalSize: positionSizing.portfolio.totalSize,
            rawSize: positionSizing.portfolio.rawSize,
            cap: positionSizing.portfolio.cap,
            scale: positionSizing.portfolio.scale,
            activeFlows: positionSizing.portfolio.activeFlows,
            activeInstruments:
              positionSizing.portfolio.activeInstruments,
            direction: positionSizing.portfolio.direction,
            directionalConflict:
              positionSizing.portfolio.directionalConflict,
          }
        : undefined,

      risk: positionSizing.risk,
      components: positionSizing.components,
      pipeline: positionSizing.pipeline,
      flowPipeline: positionSizing.flowPipeline,
      meta: positionSizing.meta,
    },

    /* EDGE / SIGNAL */

    edgeState: {
      ...edgeState,
      score: edgeState.score,
      state: edgeState.state,
      direction: edgeState.direction,
    },

    signal: {
      active: signal.active,
      type: signal.type,
      direction: signal.direction,
      strength: signal.strength,
      score: signal.score,
    },

    superSignal: {
      active: superSignal.active,
      signal: superSignal.signal,
      direction: superSignal.direction,
      score: superSignal.score,
      confidence: superSignal.confidence,
    },

    /* HISTORY
     * Store selected metrics only.
     * Do not embed history.history or historical series
     * inside each new snapshot.
     */

    historyMetrics: {
      breadthTrend: history.breadthTrend,
      breadthAcceleration: history.breadthAcceleration,

      participationTrend: history.participationTrend,
      participationDecay: history.participationDecay,
      leadershipTrend: history.leadershipTrend,
      leadershipDecay: history.leadershipDecay,

      rotationTrend: history.rotationTrend,
      liquidityTrend: history.liquidityTrend,
      fragilityTrend: history.fragilityTrend,

      relativeBreadthWeakness: history.relativeBreadthWeakness,
      crashTrend: history.crashTrend,

      ndxPriceTrend: history.ndxPriceTrend,
      ndxMomentum5D: history.ndxMomentum5D,
      ndxMomentum20D: history.ndxMomentum20D,
      ndxAcceleration: history.ndxAcceleration,

      spxPriceTrend: history.spxPriceTrend,
      spxMomentum5D: history.spxMomentum5D,
      spxMomentum20D: history.spxMomentum20D,
      spxAcceleration: history.spxAcceleration,

      rutPriceTrend: history.rutPriceTrend,
      rutMomentum5D: history.rutMomentum5D,
      rutMomentum20D: history.rutMomentum20D,
      rutAcceleration: history.rutAcceleration,

      priceMomentumScore: history.priceMomentumScore,
      priceTrend: history.priceTrend,
      persistenceScore: history.persistenceScore,

      phasePersistence: history.phasePersistence,
      regimePersistence: history.regimePersistence,
      daysInPhase: history.daysInPhase,

      breadthWeakDays: history.breadthWeakDays,
      participationWeakDays: history.participationWeakDays,
      rotationWeakDays: history.rotationWeakDays,
      liquidityWeakDays: history.liquidityWeakDays,
      fragilityHighDays: history.fragilityHighDays,

      distributionDays: history.distributionDays,
      institutionalPressure: history.institutionalPressure,
      marketCharacter: history.marketCharacter,

      prolongedBearRegime: history.prolongedBearRegime,
      persistentDistribution: history.persistentDistribution,
      acceleratingWeakness: history.acceleratingWeakness,

      rotationPersistence: history.rotationPersistence,
      liquidityPersistence: history.liquidityPersistence,
      fragilityPersistence: history.fragilityPersistence,
      dangerPersistence: history.dangerPersistence,
      executionPersistence: history.executionPersistence,
      edgePersistence: history.edgePersistence,

      averageBreadth: history.averageBreadth,
      averageParticipation: history.averageParticipation,
      averageRotation: history.averageRotation,
      averageLiquidity: history.averageLiquidity,
      averageFragility: history.averageFragility,

      dataQuality: history.dataQuality,
    },

    /* MACRO / DRIVERS */

    marketDrivers: {
      score: engine.marketDrivers?.score,
      regime: engine.marketDrivers?.regime,
      state: engine.marketDrivers?.state,
    },

    driversCore: {
      score: engine.driversCore?.score,
      regime: engine.driversCore?.regime,
      state: engine.driversCore?.state,
    },

    /* SYSTEM HEAT
     * Persist components, quality, control and inputs
     * for diagnosing the calculated environment.
     */

    systemHeat: {
      ...(engine.systemHeat ?? {}),

      score: engine.systemHeat?.score,
      value: engine.systemHeat?.value,
      state: engine.systemHeat?.state,
    },

    /* INDICES */

    indices: {
      dow: persistedIndices.dow,
      nasdaq: persistedIndices.nasdaq,
      sp500: persistedIndices.sp500,
      russell: persistedIndices.russell,
      vix: persistedIndices.vix,
      vixTermRatio: persistedIndices.vixTermRatio,
      volOfVolRatio: persistedIndices.volOfVolRatio,
    },

    /* FUTURES */

    futures: persistedFutures,
  };
}
