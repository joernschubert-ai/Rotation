// /lib/engine/marketEngine.ts

import { rotationEngine } from "./rotationEngine";
import { putTimingEngine } from "./putTimingEngine";
import { positionEngine } from "./positionEngine";
import { crashEngine } from "./crashEngine";
import { russellEngine } from "./russellEngine";
import { rotationDecisionEngine } from "./rotationDecisionEngine";
import { confidenceEngine } from "./confidenceEngine";
import { executionEngine } from "./executionEngine";
import { exitEngine } from "./exitEngine";
import { positionStateEngine } from "./positionStateEngine";
import { masterScoreEngine } from "./masterScoreEngine";
import { positionSizingV2 } from "./positionSizingV2";
import { systemHeatEngine } from "./systemHeatEngine";
import { earlyWarningEngine } from "./earlyWarningEngine";
import { riskLoopEngine } from "./riskLoopEngine";
import { signalEngine } from "./signalEngine";
import { superSignalEngine } from "./superSignalEngine";
import { phaseConfirmationEngine } from "./phaseConfirmationEngine";
import { nasdaqEngine } from "./nasdaqEngine";
import { driversEngine } from "./driversEngine";
import { marketDriversEngine } from "./marketDriversEngine";
import { structureEngine } from "./structureEngine";
import { marketPhaseEngine } from "./marketPhaseEngine";
import { marketQualityEngine } from "./marketQualityEngine";
import { edgeStateEngine } from "./edgeStateEngine";
import { tradeStackEngine } from "./tradeStackEngine";
import { rotationConfirmEngine } from "./rotationConfirmEngine";
import { rotationDecayEngine } from "./rotationDecayEngine";
import { regimePersistenceEngine } from "./regimePersistenceEngine";
import { executionStateEngine } from "./executionStateEngine";
import { regimeSyncEngine } from "./regimeSyncEngine";
import { dangerZoneEngine } from "./dangerZoneEngine";
import { liquidityEngine } from "./liquidityEngine";
import { breadthThrustEngine } from "./breadthThrustEngine";
import { breadthVelocityEngine } from "./breadthVelocityEngine";
import { internalDivergenceEngine } from "./internalDivergenceEngine";
import { fragilityEngine } from "./fragilityEngine";
import { squeezeEngine } from "./squeezeEngine";
import { participationEngine } from "./participationEngine";
import { priceMomentumEngine, priceMomentumForIndex } from "./priceMomentumEngine";
import { engineDataIssues, guardOwnPriceEntry } from "./marketInputIntegrity";
import { gammaEngine } from "./gammaEngine";
import { historicalReplay } from "../history/historicalReplay";
import { historyEngine } from "../history/historyEngine";

export function marketEngine(
  data: any,
  options: { skipHistoricalReplay?: boolean } = {}
) {
  /* =====================================================
  HISTORICAL SCENARIO MODE
  ===================================================== */

  const isHistoricalScenario =
    data?.historicalScenario === true &&
    data?.historicalScenarioInput?.historicalScenario === true;

  const inputIssues = isHistoricalScenario ? [] : engineDataIssues(data);
  if (inputIssues.length) throw new Error('Market input incomplete: ' + inputIssues.join(', '));

  const historicalInput = isHistoricalScenario
    ? data.historicalScenarioInput
    : null;

  /* =====================================================
  DRIVERS / STRUCTURE
  ===================================================== */

  const driversCore = driversEngine(data);
  const marketDrivers = marketDriversEngine(data);
  const structure = structureEngine(data);

  /* =====================================================
  NUMERIC HELPERS
  ===================================================== */

  function finiteValue(value: any): number | null {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      for (const key of ["value", "current", "score"]) {
        const candidate = value[key];

        if (
          typeof candidate === "number" ||
          typeof candidate === "string"
        ) {
          const parsed = finiteValue(candidate);

          if (parsed !== null) {
            return parsed;
          }
        }
      }
    }

    return null;
  }

  function finiteOr(value: any, fallback: number): number {
    return finiteValue(value) ?? fallback;
  }

  // Heat -2..0 maps to stress 10..0.
  // Positive heat contributes no execution stress.
  function executionStress(heat: any): number {
    const value = finiteOr(heat, 0);
    return Math.max(0, Math.min(10, -value * 5));
  }

  /* =====================================================
  CLEAN INPUT
  ===================================================== */

  const breadth20 = finiteOr(structure?.breadth?.b20, 50);
  const breadth50 = finiteOr(structure?.breadth?.b50, 50);
  const breadth200 = finiteOr(structure?.breadth?.b200, 50);
  const vix = finiteOr(data.marketData?.["^VIX"], 20);
  const creditInput = {
    creditRatio: data.creditRatio,
    creditRatioMA50: data.creditRatioMA50,
    creditRatioToMA50: data.creditRatioToMA50,
    creditDistancePct: data.creditDistancePct,
    creditSignal: data.creditSignal,
    creditDataQuality: data.creditDataQuality
  };

  const historyContext = {
    universeVersion: data.breadthDataQuality?.universeVersion ?? null
  };
  const historyMetrics = data.historyMetrics ?? historyEngine(data.history ?? [], historyContext);

  /* =====================================================
  HISTORY ACCESS
  Oldest observation first, newest last.
  ===================================================== */

  const history =
    Array.isArray(historyMetrics?.history)
      ? historyMetrics.history
      : historyEngine(data.history ?? [], historyContext).history;

  function getHistoryValue(
    offset: number,
    paths: string[],
    fallback: number | undefined
  ): number | undefined {
    if (!Array.isArray(history) || history.length <= offset) {
      return fallback;
    }

    const snapshot = history[history.length - 1 - offset];

    if (!snapshot) {
      return fallback;
    }

    for (const path of paths) {
      let value = snapshot;

      for (const part of path.split(".")) {
        if (value === null || value === undefined) {
          value = undefined;
          break;
        }

        value = value[part];
      }

      const numeric = finiteValue(value);

      if (numeric !== null) {
        return numeric;
      }
    }

    return fallback;
  }

  function getHistorySeriesValue(
    seriesNames: string[],
    offset: number,
    paths: string[],
    fallback: number | undefined
  ): number | undefined {
    for (const name of seriesNames) {
      const series = historyMetrics?.[name];

      if (Array.isArray(series) && series.length > offset) {
        const value = finiteValue(
          series[series.length - 1 - offset]
        );

        if (value !== null) {
          return value;
        }
      }
    }

    return getHistoryValue(offset, paths, fallback);
  }

  /* =====================================================
  HISTORICAL COMPARISONS
  Missing values remain undefined.
  ===================================================== */

  const breadth20_5dAgo = getHistorySeriesValue(
    ["breadth20History"],
    5,
    [
      "breadth20",
      "breadth.b20",
      "structure.breadth.b20.value",
      "structure.breadth.b20"
    ],
    undefined
  );

  const breadth50_5dAgo = getHistorySeriesValue(
    ["breadth50History"],
    5,
    [
      "breadth50",
      "breadth.b50",
      "structure.breadth.b50.value",
      "structure.breadth.b50"
    ],
    undefined
  );

  const breadth50_10dAgo = getHistorySeriesValue(
    ["breadth50History"],
    10,
    [
      "breadth50",
      "breadth.b50",
      "structure.breadth.b50.value",
      "structure.breadth.b50"
    ],
    undefined
  );

  const breadth200_10dAgo = getHistorySeriesValue(
    ["breadth200History"],
    10,
    [
      "breadth200",
      "breadth.b200",
      "structure.breadth.b200.value",
      "structure.breadth.b200"
    ],
    undefined
  );

  const breadth200_20dAgo = getHistorySeriesValue(
    ["breadth200History"],
    20,
    [
      "breadth200",
      "breadth.b200",
      "structure.breadth.b200.value",
      "structure.breadth.b200"
    ],
    undefined
  );

  const advanceDecline_5dAgo = getHistorySeriesValue(
    ["advanceDeclineHistory", "adHistory"],
    5,
    [
      "advanceDecline",
      "ad",
      "structure.advanceDecline.value",
      "structure.advanceDecline"
    ],
    undefined
  );

  const spxCurrent =
    finiteValue(data.indices?.spx) ??
    finiteValue(data.indices?.sp500) ??
    finiteValue(data.indices?.SPX) ??
    finiteValue(data.marketData?.["^GSPC"]) ??
    0;

  const spx5dAgo = getHistorySeriesValue(
    ["spxHistory", "SPXHistory"],
    5,
    [
      "spx",
      "SPX",
      "indices.spx",
      "indices.sp500",
      "indices.SPX",
      "structure.spx.value"
    ],
    undefined
  );

  /* =====================================================
  PRICE MOMENTUM / LEGACY DIVERGENCE
  ===================================================== */

  const priceMomentumPre = priceMomentumEngine({
    historyMetrics,
    indices: data.indices ?? {}
  });

  const divergence = (() => {
    const breadth = finiteValue(structure?.breadth?.b50);
    const ad = finiteValue(structure?.advanceDecline);

    let score = 0;

    if (breadth !== null && ad !== null) {
      if (breadth > 80 && ad < 0) score -= 2;
      if (breadth < 40 && ad > 0) score += 2;
    }

    return {
      score,
      state:
        score > 1
          ? "BULLISH_DIVERGENCE"
          : score < -1
            ? "BEARISH_DIVERGENCE"
            : "NONE"
    };
  })();

  /* =====================================================
  LIQUIDITY / PRELIMINARY FRAGILITY
  ===================================================== */

  const liquidityPre = liquidityEngine({
    marketLiquidityScore: data.marketLiquidityScore,
    ...creditInput,
    gammaExposure: data.gammaExposure,
    vixTermRatio: data.vixTermRatio,
    volOfVolRatio: data.volOfVolRatio,
    marketData: data.marketData ?? {},
    breadth50: finiteValue(structure?.breadth?.b50) ?? undefined,
    breadth200: finiteValue(structure?.breadth?.b200) ?? undefined,
    correlationScore: data.correlationScore,
    historyMetrics
  });

  const fragilityPre = fragilityEngine({
    history,
    historyMetrics,
    crash: {
      probability: Number(
        data.crash?.probability ??
        data.crashProbability ??
        0
      )
    },
    breadth50,
    breadth200,
    gammaExposure: Number(data.gammaExposure ?? 0),
    correlationScore: Number(data.correlationScore ?? 0),
    vix,
    volOfVolRatio: Number(data.volOfVolRatio ?? 1),
    vixTermRatio: Number(data.vixTermRatio ?? 1),
    liquidity: liquidityPre,
    structure
  });

  /* =====================================================
  SQUEEZE / ROTATION BASE
  ===================================================== */

  const squeezePre = squeezeEngine({
    gammaExposure: data.gammaExposure,
    vix: finiteValue(data.marketData?.["^VIX"]) ?? undefined,
    moveIndex: data.moveIndex ?? data.marketDrivers?.raw?.move,
    breadth50: finiteValue(structure?.breadth?.b50) ?? undefined,
    breadth200: finiteValue(structure?.breadth?.b200) ?? undefined,
    vixTermRatio: data.vixTermRatio,
    ...creditInput,
    marketLiquidityScore: data.marketLiquidityScore,
    putCallRatio: data.putCallRatio,
    shortInterest: data.shortInterest,
    structuralGammaFloor: data.structuralGammaFloor,
    passiveGammaCompression: data.passiveGammaCompression,
    dealerCompression: data.dealerCompression,
    passiveFlowRisk: data.passiveFlowRisk,
    volSuppression: data.volSuppression
  });

  const rotationBase = rotationEngine({
    ...data.rotation,
    concentrationScore: Number(data.concentrationScore ?? 0),
    futuresVsCash: Number(data.futuresVsCash ?? 0),
    marketData: data.marketData ?? {},
    liquidity: liquidityPre,
    fragility: fragilityPre,
    squeeze: squeezePre,
    breadthTrend: historyMetrics?.breadthTrend ?? 0,
    breadthAcceleration: historyMetrics?.breadthAcceleration ?? 0,
    participationDecay: historyMetrics?.participationDecay ?? 0,
    leadershipDecay: historyMetrics?.leadershipDecay ?? 0,
    relativeBreadthWeakness: historyMetrics?.relativeBreadthWeakness ?? 0,
    structure
  });

  /* =====================================================
  PARTICIPATION / BREADTH THRUST
  ===================================================== */

  const participation = participationEngine({
    historyMetrics,
    breadth20,
    breadth50,
    breadth200,
    structure,
    highs: Number(structure?.highsLows?.highs ?? 0),
    lows: Number(structure?.highsLows?.lows ?? 0),
    rsEqual: rotationBase?.rsEqual,
    rsSmall: rotationBase?.rsSmall,
    rotation: rotationBase,
    divergenceState: divergence.state,
    concentrationScore: Number(data.concentrationScore ?? 50),
    rotationScore: Number(rotationBase?.score ?? 50)
  });

  // Final liquidity uses the available participation/rotation-base context.
  // Final rotation, decay and fragility must not feed back into this pass.
  const liquidity = liquidityEngine({
    historyMetrics,
    marketLiquidityScore: data.marketLiquidityScore,
    ...creditInput,
    gammaExposure: data.gammaExposure,
    vixTermRatio: data.vixTermRatio,
    volOfVolRatio: data.volOfVolRatio,
    marketData: data.marketData ?? {},
    breadth50: finiteValue(structure?.breadth?.b50) ?? undefined,
    breadth200: finiteValue(structure?.breadth?.b200) ?? undefined,
    correlationScore: data.correlationScore,
    participationScore: participation.score,
    rsSmall: rotationBase.rsSmall,
    rsEqual: rotationBase.rsEqual,
    rsGrowth: rotationBase.rsGrowth,
    rotationScore: rotationBase.score,
    fragilityScore: fragilityPre.score
  });

  const squeeze = squeezeEngine({
    gammaExposure: data.gammaExposure,
    vix: finiteValue(data.marketData?.["^VIX"]) ?? undefined,
    moveIndex: data.moveIndex ?? data.marketDrivers?.raw?.move,
    breadth50: finiteValue(structure?.breadth?.b50) ?? undefined,
    breadth200: finiteValue(structure?.breadth?.b200) ?? undefined,
    vixTermRatio: data.vixTermRatio,
    ...creditInput,
    marketLiquidityScore: data.marketLiquidityScore,
    putCallRatio: data.putCallRatio,
    shortInterest: data.shortInterest,
    structuralGammaFloor: data.structuralGammaFloor,
    passiveGammaCompression: data.passiveGammaCompression,
    dealerCompression: data.dealerCompression,
    passiveFlowRisk: data.passiveFlowRisk,
    volSuppression: data.volSuppression,
    participationScore: participation.score,
    rsSmall: rotationBase.rsSmall,
    rsEqual: rotationBase.rsEqual,
    rsGrowth: rotationBase.rsGrowth
  });

  const breadthThrust = breadthThrustEngine({
    breadth20,
    breadth50,
    breadth200,
    structure,
    advanceDecline: finiteOr(structure?.advanceDecline, 0),
    rsEqual: rotationBase?.rsEqual,
    rsSmall: rotationBase?.rsSmall,
    rotationScore: rotationBase?.score,
    participationScore: participation?.score,
    concentrationScore: Number(data.concentrationScore ?? 50),
    divergenceState: divergence.state
  });

  /* =====================================================
  BREADTH VELOCITY
  ===================================================== */

  const breadthVelocity = breadthVelocityEngine({
    structure,
    breadth20: finiteValue(structure?.breadth?.b20) ?? undefined,
    breadth20_5dAgo,
    breadth50: finiteValue(structure?.breadth?.b50) ?? undefined,
    breadth50_5dAgo,
    breadth50_10dAgo,
    breadth200: finiteValue(structure?.breadth?.b200) ?? undefined,
    breadth200_10dAgo,
    breadth200_20dAgo,
    advanceDecline:
      finiteValue(structure?.advanceDecline) ?? undefined,
    advanceDecline_5dAgo,
    spx: spxCurrent,
    spx5dAgo
  });

  /* =====================================================
  INTERNAL DIVERGENCE

  spxMomentum is the signed SPX 5D percentage change.
  Do not pass the aggregate 0..100 price score here.
  ===================================================== */

  const internalDivergence = internalDivergenceEngine({
    spxTrend: Number(breadthVelocity?.slopes?.spxSlope5d ?? 0),
    spxMomentum: finiteOr(priceMomentumPre?.spx?.momentum5D, 0),
    breadth20,
    breadth50,
    breadth200,
    breadth20Slope5d:
      Number(breadthVelocity?.slopes?.b20Slope5d ?? 0),
    breadth50Slope5d:
      Number(breadthVelocity?.slopes?.b50Slope5d ?? 0),
    breadth200Slope10d:
      Number(breadthVelocity?.slopes?.b200Slope10d ?? 0),
    adLine: finiteOr(structure?.advanceDecline, 0),
    adSlope5d: Number(breadthVelocity?.slopes?.adSlope5d ?? 0),
    rsEqual: Number(rotationBase?.rsEqual ?? 1),
    rsSmall: Number(rotationBase?.rsSmall ?? 1),
    rsGrowth: Number(rotationBase?.rsGrowth ?? 1),
    participationScore: Number(participation?.score ?? 50),
    rotationScore: Number(rotationBase?.score ?? 50),
    concentrationScore: Number(data.concentrationScore ?? 50),
    liquidityScore: Number(liquidity?.score ?? 50),
    vix,
    gammaExposure: Number(data.gammaExposure ?? 0)
  });

  /* =====================================================
  GAMMA
  ===================================================== */

  const gamma = gammaEngine({
    gammaDataQuality: data.gammaDataQuality,
    gammaExposure: Number(data.gammaExposure ?? 0),
    vix,
    breadth50,
    liquidityScore: Number(liquidity?.score ?? 50),
    vixTermRatio: Number(data.vixTermRatio ?? 1),
    rsSmall: Number(rotationBase?.rsSmall ?? 1),
    rsEqual: Number(rotationBase?.rsEqual ?? 1),
    rsGrowth: Number(rotationBase?.rsGrowth ?? 1),
    participationScore: Number(participation?.score ?? 50)
  });

  /* =====================================================
  PERSISTENCE HISTORY
  ===================================================== */

  function persistenceHistory(metrics: any) {
    const snapshots = Array.isArray(metrics?.history)
      ? metrics.history
      : metrics === historyMetrics
        ? history
        : [];

    return {
      breadth50History:
        Array.isArray(metrics?.breadth50History)
          ? metrics.breadth50History
          : [],
      breadth200History:
        Array.isArray(metrics?.breadth200History)
          ? metrics.breadth200History
          : [],
      participationHistory:
        Array.isArray(metrics?.participationHistory)
          ? metrics.participationHistory
          : [],
      rotationDecayHistory:
        Array.isArray(metrics?.rotationDecayHistory)
          ? metrics.rotationDecayHistory
          : [],
      internalDivergenceHistory:
        Array.isArray(metrics?.internalDivergenceHistory)
          ? metrics.internalDivergenceHistory
          : snapshots.map(
              (snapshot: any) =>
                finiteValue(snapshot?.internalDivergence?.score)
            )
    };
  }

  /* =====================================================
  REGIME PERSISTENCE — PRE PHASE
  ===================================================== */

  const regimePersistencePre = regimePersistenceEngine({
    breadth50,
    breadth200,
    participationScore: finiteOr(participation?.score, 50),
    rotationDecayScore: 0,
    dangerScore: 0,
    fragilityScore: Number(fragilityPre?.score ?? 50),
    internalDivergenceScore: Number(internalDivergence?.score ?? 0),
    breadth50History:
      Array.isArray(historyMetrics?.breadth50History)
        ? historyMetrics.breadth50History
        : [],
    breadth200History:
      Array.isArray(historyMetrics?.breadth200History)
        ? historyMetrics.breadth200History
        : [],
    participationHistory:
      Array.isArray(historyMetrics?.participationHistory)
        ? historyMetrics.participationHistory
        : [],
    rotationDecayHistory:
      Array.isArray(historyMetrics?.rotationDecayHistory)
        ? historyMetrics.rotationDecayHistory
        : [],
    internalDivergenceHistory:
      persistenceHistory(historyMetrics).internalDivergenceHistory
  });

  /* =====================================================
  ROTATION / CRASH / EARLY WARNING
  ===================================================== */

  const rotation = rotationEngine({
    ...data.rotation,
    concentrationScore: Number(data.concentrationScore ?? 0),
    futuresVsCash: Number(data.futuresVsCash ?? 0),
    marketData: data.marketData ?? {},
    liquidity,
    fragility: fragilityPre,
    squeeze,
    participation,
    breadthThrust,
    breadthTrend: historyMetrics?.breadthTrend ?? 0,
    breadthAcceleration: historyMetrics?.breadthAcceleration ?? 0,
    participationDecay: historyMetrics?.participationDecay ?? 0,
    leadershipDecay: historyMetrics?.leadershipDecay ?? 0,
    relativeBreadthWeakness: historyMetrics?.relativeBreadthWeakness ?? 0,
    structure
  });

  const crash = crashEngine({
    ...data,
    // Canonical structure uses percent. Raw backend breadth remains fractional.
    structure,
    breadth20, breadth50, breadth200,
    participation,
    participationScore: participation.score,
    rotation,
    rotationScore: rotation.score,
    ad: finiteOr(structure?.advanceDecline, 0),
    highs: finiteOr(structure?.highsLows?.highs, 0),
    lows: finiteOr(structure?.highsLows?.lows, 0),
    distributionScore: finiteOr(structure?.distribution, 0),
    internalDivergence,
    // Retain date slots; only expose compatible stored model measurements.
    history: history.map((snapshot: any) => ({
      timestamp: snapshot.timestamp,
      breadth50: finiteValue(snapshot.structure?.breadth?.b50) ?? undefined,
      breadth200: finiteValue(snapshot.structure?.breadth?.b200) ?? undefined,
      participationScore: snapshot.calculationVersions?.participation === "STRONGEST_SHARED_LEADERSHIP_PENALTY" ||
        snapshot.participation?.diagnostics?.aggregationPolicy === "STRONGEST_SHARED_LEADERSHIP_PENALTY"
        ? finiteValue(snapshot.participation?.score) ?? undefined : undefined,
      marketLiquidityScore: finiteValue(snapshot.liquidity?.marketLiquidityScore) ??
        finiteValue(snapshot.liquidity?.metrics?.liquidity) ?? undefined,
      highLowDelta: finiteValue(snapshot.structure?.highsLows?.highs) !== null &&
        finiteValue(snapshot.structure?.highsLows?.lows) !== null
        ? Number(snapshot.structure.highsLows.highs) - Number(snapshot.structure.highsLows.lows) : undefined
    })),
    historyMetrics,
    vix,
    vixTermRatio: Number(data.vixTermRatio ?? 1),
    moveIndex: Number(
      data.moveIndex ??
      data.marketDrivers?.raw?.move ??
      0
    ),
    volOfVolRatio: Number(data.volOfVolRatio ?? 1),
    gammaExposure: Number(data.gammaExposure ?? 0),
    correlationScore: Number(data.correlationScore ?? 0),
    drivers: driversCore
  });

  const earlyWarning = earlyWarningEngine({
    ...data,
    historyMetrics
  });

  /* =====================================================
  TEMP PUT / RUSSELL
  ===================================================== */

  const putTimingTemp = putTimingEngine({
    structure,
    breadth20,
    breadth50,
    breadth200,
    fragility: fragilityPre,
    vix,
    participation,
    liquidity,
    breadthThrust,
    phase: "TEMP",
    rotation,
    crash,
    earlyWarning,
    historyMetrics,
    priceMomentum: priceMomentumForIndex(priceMomentumPre, "ndx")
  });

  const russellTemp = russellEngine({
    rsSmall: rotation.rsSmall,
    rsGrowth: rotation.rsGrowth,
    breadth50,
    breadth200,
    concentrationScore: Number(data.concentrationScore ?? 0),
    phase: "TEMP",
    crash,
    vix,
    historyMetrics
  });

  /* =====================================================
  HISTORICAL PHASE INPUTS
  ===================================================== */

  const phaseCrash = isHistoricalScenario
    ? {
        ...crash,
        score: Number(historicalInput.crash.score),
        probability: Number(historicalInput.crash.probability)
      }
    : crash;

  const phaseRotation = isHistoricalScenario
    ? {
        ...rotation,
        score: Number(historicalInput.rotation.score),
        rsSmall: Number(historicalInput.rotation.rsSmall),
        rsEqual: Number(historicalInput.rotation.rsEqual),
        rsGrowth: Number(historicalInput.rotation.rsGrowth)
      }
    : rotation;

  const phaseParticipation = isHistoricalScenario
    ? {
        ...participation,
        score: Number(historicalInput.participation.score)
      }
    : participation;

  const phaseBreadthThrust = isHistoricalScenario
    ? {
        ...breadthThrust,
        score: Number(historicalInput.breadthThrust.score)
      }
    : breadthThrust;

  const phaseLiquidity = isHistoricalScenario
    ? {
        ...liquidity,
        score: Number(historicalInput.liquidity.score)
      }
    : liquidity;

  const phaseFragility = isHistoricalScenario
    ? {
        ...fragilityPre,
        score: Number(historicalInput.fragility.score)
      }
    : fragilityPre;

  const phaseRotationDecay = isHistoricalScenario
    ? {
        ...rotationDecayEngine({
          historyMetrics,
          rotation,
          structure,
          crash,
          earlyWarning,
          liquidity,
          fragility: fragilityPre,
          squeeze,
          participation,
          breadthThrust,
          regimeSync: {},
          executionState: {},
          breadth50,
          breadth200,
          vix,
          concentrationScore: Number(data.concentrationScore ?? 0),
          gammaExposure: Number(data.gammaExposure ?? 0),
          ...creditInput,
          marketLiquidityScore: Number(data.marketLiquidityScore ?? 50),
          breadthTrend: historyMetrics?.breadthTrend,
          breadthAcceleration: historyMetrics?.breadthAcceleration,
          participationDecay: historyMetrics?.participationDecay,
          leadershipDecay: historyMetrics?.leadershipDecay,
          relativeBreadthWeakness: historyMetrics?.relativeBreadthWeakness
        }),
        score: Number(historicalInput.rotationDecay.score)
      }
    : null;

  const phaseInternalDivergence = isHistoricalScenario
    ? {
        ...internalDivergence,
        score: Number(historicalInput.internalDivergence.score),
        severity: Number(historicalInput.internalDivergence.severity)
      }
    : internalDivergence;

  const phaseRegimeSync = isHistoricalScenario
    ? {
        score: Number(historicalInput.regimeSync.score),
        state:
          historicalInput.regimeSync.score <= 35
            ? "BREAKDOWN"
            : historicalInput.regimeSync.score >= 65
              ? "SYNCHRONIZED"
              : "TRANSITION"
      }
    : null;

  const phaseConfirmationInput = isHistoricalScenario
    ? historicalInput.phaseConfirmation
    : null;

  const phasePutTiming = isHistoricalScenario
    ? {
        ...putTimingTemp,
        score: Number(historicalInput.putTiming.score)
      }
    : putTimingTemp;

  const phaseRotationDecayInput = isHistoricalScenario
    ? phaseRotationDecay
    : { score: 0 };

  /* =====================================================
  PHASE
  ===================================================== */

  const phaseData = marketPhaseEngine({
    breadthVelocity,
    vix,
    crash: phaseCrash,
    rotation: phaseRotation,
    putTiming: phasePutTiming,
    earlyWarning,
    structure,
    russell: russellTemp,
    historyMetrics,
    priceMomentum: priceMomentumPre,
    regimePersistence: regimePersistencePre,
    liquidity: phaseLiquidity,
    fragility: phaseFragility,
    internalDivergence: phaseInternalDivergence,
    regimeSync: phaseRegimeSync ?? undefined,
    phaseConfirmation: phaseConfirmationInput ?? undefined,
    participation: phaseParticipation,
    breadthThrust: phaseBreadthThrust,
    rotationDecay: phaseRotationDecayInput
  });

  const phase = phaseData.phase;

  const regime = {
    label: phase,
    score: phaseCrash.score
  };

  const phaseStage = {
    phase,
    phaseData
  };

  /* =====================================================
  SYSTEM HEAT — PRELIMINARY
  ===================================================== */

  const systemHeatPre = systemHeatEngine({
    crash,
    liquidity,
    participation,
    rotation,
    breadthThrust,
    fragility: fragilityPre,
    rotationDecayScore: 0,
    breadth20,
    breadth50,
    vix,
    marketLiquidityScore: data.marketLiquidityScore,
    ...creditInput,
    vixTermRatio: data.vixTermRatio,
    gammaExposure: data.gammaExposure
  });

  /* =====================================================
  REGIME SYNC — PRE
  ===================================================== */

  const regimeSyncPre = regimeSyncEngine({
    internalDivergence,
    phase,
    crash,
    rotation,
    structure,
    earlyWarning,
    vix,
    gammaExposure: Number(data.gammaExposure ?? 0),
    liquidityScore: Number(liquidity?.score ?? 50),
    ...creditInput,
    breadth50,
    breadth200,
    fragility: fragilityPre,
    participation,
    breadthThrust
  });

  /* =====================================================
  DANGER ZONE
  ===================================================== */

  const dangerZone = dangerZoneEngine({
    crashProbability: Number(crash?.probability ?? 0),
    crashMomentum: Number(crash?.momentum ?? 0),
    breadth50,
    breadth200,
    liquidityVacuumScore: Number(data.liquidityVacuumScore ?? 0),
    correlationScore: Number(data.correlationScore ?? 0),
    gammaExposure: Number(data.gammaExposure ?? 0),
    volOfVolRatio: Number(data.volOfVolRatio ?? 1),
    ...creditInput,
    vix,
    history: historyMetrics
  });

  /* =====================================================
  EXECUTION STATE — PRE
  ===================================================== */

  const executionStatePre = executionStateEngine({
    regimeSignal: phase ?? "NEUTRAL",
    crashProbability: Number(crash?.probability ?? 0),
    dangerScore: Number(dangerZone?.score ?? 0),
    stressScore: executionStress(systemHeatPre?.value),
    rotationSignal: rotation?.signal ?? "neutral",
    rotationStrength: Number(rotation?.score ?? 0),
    breadth200,
    breadth50,
    gammaExposure: Number(data.gammaExposure ?? 0),
    liquidityScore: Number(liquidity?.score ?? 50),
    volatilityState: vix > 25 ? "HIGH_VOL" : "NORMAL",
    regimeSyncScore: Number(regimeSyncPre?.score ?? 50),
    regimeSyncState: regimeSyncPre?.state ?? "TRANSITION",
    regimeSyncAligned: regimeSyncPre?.aligned,
    rotationDecayScore: 0,
    fragilityScore: Number(fragilityPre?.score ?? 50),
    participationScore: Number(participation?.score ?? 50),
    squeezeRisk: Number(squeeze?.risk ?? 0),
    divergenceState: divergence?.state ?? "NONE",
    internalDivergence,
    regimePersistence: regimePersistencePre,
    concentrationScore: Number(data.concentrationScore ?? 50),
    vix,
    masterScore: Number(data.masterScore ?? 50)
  });

  /* =====================================================
  ROTATION DECAY
  ===================================================== */

  const rotationDecay = rotationDecayEngine({
    historyMetrics,
    rotation,
    structure,
    crash,
    earlyWarning,
    liquidity,
    fragility: fragilityPre,
    squeeze,
    participation,
    breadthThrust,
    regimeSync: regimeSyncPre,
    executionState: executionStatePre,
    breadth50,
    breadth200,
    vix,
    concentrationScore: Number(data.concentrationScore ?? 0),
    gammaExposure: Number(data.gammaExposure ?? 0),
    ...creditInput,
    marketLiquidityScore: Number(data.marketLiquidityScore ?? 50),
    breadthTrend: historyMetrics?.breadthTrend,
    breadthAcceleration: historyMetrics?.breadthAcceleration,
    participationDecay: historyMetrics?.participationDecay,
    leadershipDecay: historyMetrics?.leadershipDecay,
    relativeBreadthWeakness: historyMetrics?.relativeBreadthWeakness
  });

  /* =====================================================
  ROTATION CONFIRM / RUSSELL
  ===================================================== */

  const rotationConfirm = rotationConfirmEngine({
    rotation,
    structure,
    crash,
    earlyWarning,
    drivers: marketDrivers,
    positioning: {},
    volatility: { vix },
    executionState: executionStatePre,
    regimeSync: regimeSyncPre,
    liquidity,
    fragility: fragilityPre,
    squeeze,
    participation,
    breadthThrust,
    rotationDecay,
    historyMetrics,
    gamma
  });

  /* =====================================================
  PHASE CONFIRMATION / MARKET QUALITY
  ===================================================== */

  const phaseConfirmation = phaseConfirmationEngine({
    phase,
    phaseData,
    rotation,
    crash,
    earlyWarning,
    participation,
    breadthThrust,
    liquidity,
    fragility: fragilityPre,
    rotationDecay,
    historyMetrics
  });

  const marketQuality = marketQualityEngine({
    structure,
    participation,
    rotation,
    breadthThrust,
    rotationDecay,
    liquidity,
    fragility: fragilityPre,
    phaseConfirmation,
    internalDivergence,
    regimeSync: regimeSyncPre,
    concentrationScore: Number(data.concentrationScore ?? 50)
  });

  /* =====================================================
  FRAGILITY — FINAL
  ===================================================== */

  const fragility = fragilityEngine({
    history,
    historyMetrics,
    crash,
    breadth50,
    breadth200,
    gammaExposure: Number(data.gammaExposure ?? 0),
    correlationScore: Number(data.correlationScore ?? 0),
    vix,
    volOfVolRatio: Number(data.volOfVolRatio ?? 1),
    vixTermRatio: Number(data.vixTermRatio ?? 1),
    liquidity,
    structure,
    participation,
    breadthThrust,
    rotation: {
      ...rotation,
      decayScore: rotationDecay.score,
      rotationDecayScore: rotationDecay.score,
      rotationDecayState: rotationDecay.state
    },
    marketQuality
  });

  /* Final structure context is available only after final fragility.
   * Early consumers retain the independent preliminary price result.
   * Price scores and momentum use the same inputs in both passes.
   */
  const priceMomentum = priceMomentumEngine({
    historyMetrics,
    indices: data.indices ?? {},
    structure,
    participation,
    rotation,
    liquidity,
    fragility
  });

  // Evaluate the final Russell candidate with completed quality and price context.
  // Preliminary Russell remains separate for earlier structural consumers.
  const russell = guardOwnPriceEntry(russellEngine({
    rsSmall: rotation.rsSmall, rsGrowth: rotation.rsGrowth,
    breadth50, breadth200, concentrationScore: data.concentrationScore,
    phase, phaseData, phaseConfirmation, crash, vix, historyMetrics,
    rotationDecay, rotationConfirm, participation, internalDivergence,
    marketQuality, priceMomentum, gamma
  }), priceMomentum.rut, "RUSSELL_CALL", isHistoricalScenario);

  /* =====================================================
  SYSTEM HEAT — FINAL
  ===================================================== */

  const systemHeat = systemHeatEngine({
    crash,
    breadth20,
    breadth50,
    vix,
    liquidity,
    participation,
    rotation,
    breadthThrust,
    fragility,
    rotationDecay,
    marketLiquidityScore: data.marketLiquidityScore,
    ...creditInput,
    vixTermRatio: data.vixTermRatio,
    gammaExposure: data.gammaExposure
  });

  /* =====================================================
  REGIME SYNC / PERSISTENCE — FINAL
  ===================================================== */

  const regimeSync = regimeSyncEngine({
    internalDivergence,
    rotationDecay,
    phase,
    crash,
    rotation,
    structure,
    earlyWarning,
    vix,
    gammaExposure: Number(data.gammaExposure ?? 0),
    liquidityScore: Number(liquidity?.score ?? 50),
    ...creditInput,
    breadth50,
    breadth200,
    fragility,
    participation,
    breadthThrust,
    marketQuality
  });

  const regimePersistence = regimePersistenceEngine({
    ...persistenceHistory(historyMetrics),
    breadth50,
    breadth200,
    participationScore: finiteOr(participation?.score, 50),
    rotationDecayScore: finiteOr(rotationDecay?.score, 0),
    dangerScore: finiteOr(dangerZone?.score, 0),
    fragilityScore: finiteOr(fragility?.score, 50),
    internalDivergenceScore: finiteOr(internalDivergence?.score, 0),
    phase
  });

  /* =====================================================
  FINAL PUT TIMING
  ===================================================== */

  const putTiming = guardOwnPriceEntry(putTimingEngine({
    structure,
    breadth20,
    breadth50,
    breadth200,
    fragility,
    vix,
    phase, phaseData, rotation, rotationConfirm, crash,
    earlyWarning, historyMetrics, priceMomentum: priceMomentumForIndex(priceMomentum, "ndx"),
    participation, liquidity, dangerZone, marketDrivers,
    regimeSync, breadthThrust, marketQuality, rotationDecay,
    regimePersistence, gamma
  }), priceMomentum.ndx, "NASDAQ_PUT", isHistoricalScenario);

  /* Risk confirmation uses the completed risk components.
   * It is consumed by the decision layer, not Execution State.
   * Retain the existing phase/scenario crash and rotation sources.
   * Do not invent a structuralRisk alias from fragility.score.
   */
  const confidence = confidenceEngine({
    ...data,
    phase,
    crash: phaseCrash,
    rotation: phaseRotation,
    rotationDecay,
    fragility,
    liquidity,
    participation,
    squeeze,
    breadthThrust,
    regimeSync,
    rotationConfirm
  });

  /* =====================================================
  MASTER INPUT NORMALIZATION
  ===================================================== */

  const masterCrash = isHistoricalScenario
    ? {
        ...crash,
        score: Number(historicalInput.crash.score),
        probability: Number(historicalInput.crash.probability)
      }
    : crash;

  const masterRotation = isHistoricalScenario
    ? {
        ...rotation,
        score: Number(historicalInput.rotation.score),
        rsSmall: Number(historicalInput.rotation.rsSmall),
        rsEqual: Number(historicalInput.rotation.rsEqual),
        rsGrowth: Number(historicalInput.rotation.rsGrowth)
      }
    : rotation;

  const masterParticipation = isHistoricalScenario
    ? {
        ...participation,
        score: Number(historicalInput.participation.score)
      }
    : participation;

  const masterBreadthThrust = isHistoricalScenario
    ? {
        ...breadthThrust,
        score: Number(historicalInput.breadthThrust.score)
      }
    : breadthThrust;

  const masterLiquidity = isHistoricalScenario
    ? {
        ...liquidity,
        score: Number(historicalInput.liquidity.score)
      }
    : liquidity;

  const masterFragility = isHistoricalScenario
    ? {
        ...fragility,
        score: Number(historicalInput.fragility.score)
      }
    : fragility;

  const masterRotationDecay = isHistoricalScenario
    ? {
        ...rotationDecay,
        score: Number(historicalInput.rotationDecay.score)
      }
    : rotationDecay;

  const masterRegimeSync = isHistoricalScenario
    ? {
        ...regimeSync,
        score: Number(historicalInput.regimeSync.score)
      }
    : regimeSync;

  const masterPutTiming = isHistoricalScenario
    ? {
        ...putTiming,
        score: Number(historicalInput.putTiming.score)
      }
    : putTiming;

  /* =====================================================
  HISTORICAL MARKET QUALITY / PERSISTENCE
  ===================================================== */

  const masterMarketQuality = isHistoricalScenario
    ? marketQualityEngine({
        structure,
        participation: masterParticipation,
        rotation: masterRotation,
        breadthThrust: masterBreadthThrust,
        rotationDecay: masterRotationDecay,
        liquidity: masterLiquidity,
        fragility: masterFragility,
        phaseConfirmation: historicalInput.phaseConfirmation,
        internalDivergence: phaseInternalDivergence,
        regimeSync: masterRegimeSync,
        concentrationScore: Number(historicalInput.concentrationScore)
      })
    : marketQuality;

  const masterPhaseConfirmation = isHistoricalScenario
    ? historicalInput.phaseConfirmation
    : phaseConfirmation;

  const masterRegimePersistence = isHistoricalScenario
    ? regimePersistenceEngine({
        ...persistenceHistory(historicalInput.historyMetrics),
        breadth50,
        breadth200,
        participationScore: finiteOr(masterParticipation?.score, 50),
        rotationDecayScore: finiteOr(masterRotationDecay?.score, 0),
        dangerScore: finiteOr(dangerZone?.score, 0),
        fragilityScore: finiteOr(masterFragility?.score, 50),
        internalDivergenceScore: finiteOr(phaseInternalDivergence?.score, 0),
        phase
      })
    : regimePersistence;

  /* =====================================================
  MASTER DIAGNOSTICS
  ===================================================== */

  const masterDiagnostics = {
    crash: masterCrash?.score,
    crashProbability: masterCrash?.probability,
    rotation: masterRotation?.score,
    putTiming: masterPutTiming?.score,
    russell:
      russell?.confidence ??
      russell?.score?.value ??
      russell?.score,
    participation: masterParticipation?.score,
    breadthThrust: masterBreadthThrust?.score,
    liquidity: masterLiquidity?.score,
    fragility: masterFragility?.score,
    marketQuality: masterMarketQuality?.score,
    rotationDecay: masterRotationDecay?.score,
    phaseConfirmation: masterPhaseConfirmation?.confidence,
    regimeSync: masterRegimeSync?.score,
    priceMomentum: priceMomentum?.score,
    regimePersistence: masterRegimePersistence?.score
  };

  const nonFiniteMasterInputs = Object.entries(masterDiagnostics)
    .filter(([, value]) => finiteValue(value) === null)
    .map(([name, value]) => ({ name, value }));

  if (nonFiniteMasterInputs.length > 0) {
    console.error(
      "[MASTER SCORE DIAGNOSTIC] Non-finite input detected",
      {
        timestamp: new Date().toISOString(),
        skipHistoricalReplay: options.skipHistoricalReplay === true,
        historicalScenario: isHistoricalScenario,
        scenarioId: data?.scenarioId,
        masterInputs: masterDiagnostics,
        nonFinite: nonFiniteMasterInputs
      }
    );
  }

  /* =====================================================
  MASTER
  ===================================================== */

  const master = masterScoreEngine({
    breadthVelocity,
    dangerZone,
    internalDivergence: phaseInternalDivergence,
    crash: masterCrash,
    rotation: masterRotation,
    putTiming: masterPutTiming,
    russell,
    phaseData,
    structure,
    participation: masterParticipation,
    breadthThrust: masterBreadthThrust,
    liquidity: masterLiquidity,
    fragility: masterFragility,
    marketQuality: masterMarketQuality,
    rotationDecay: masterRotationDecay,
    phaseConfirmation: masterPhaseConfirmation,
    regimeSync: masterRegimeSync,
    phaseStage,
    historyMetrics,
    priceMomentum,
    regimePersistence: masterRegimePersistence,
    gamma
  });

  if (!Number.isFinite(Number(master?.score))) {
    console.error(
      "[MASTER SCORE DIAGNOSTIC] Master score is non-finite",
      {
        timestamp: new Date().toISOString(),
        masterScore: master?.score,
        masterInputs: masterDiagnostics,
        nonFinite: nonFiniteMasterInputs,
        phase,
        rotationState: rotation?.state,
        rotationSignal: rotation?.signal,
        regimePersistence: masterRegimePersistence?.score
      }
    );
  }

  /* =====================================================
  EXECUTION STATE — FINAL
  ===================================================== */

  const executionState = executionStateEngine({
    regimeSignal: phase ?? "NEUTRAL",
    crashProbability: Number(crash?.probability ?? 0),
    dangerScore: Number(dangerZone?.score ?? 0),
    stressScore: executionStress(systemHeat?.value),
    rotationSignal: rotation?.signal ?? "neutral",
    rotationStrength: Number(rotation?.score ?? 0),
    breadth200,
    breadth50,
    gammaExposure: Number(data.gammaExposure ?? 0),
    liquidityScore: Number(liquidity?.score ?? 50),
    volatilityState: vix > 25 ? "HIGH_VOL" : "NORMAL",
    regimeSyncScore: Number(regimeSync?.score ?? 50),
    regimeSyncState: regimeSync?.state ?? "TRANSITION",
    regimeSyncAligned: regimeSync?.aligned,
    rotationDecayScore: Number(rotationDecay?.score ?? 0),
    fragilityScore: Number(fragility?.score ?? 50),
    participationScore: Number(participation?.score ?? 50),
    squeezeRisk: Number(squeeze?.risk ?? 0),
    divergenceState: divergence?.state ?? "NONE",
    internalDivergence,
    regimePersistence,
    concentrationScore: Number(data.concentrationScore ?? 50),
    vix,
    masterScore: Number(master?.score ?? 50)
  });

  /* =====================================================
  EDGE / NASDAQ CALL
  ===================================================== */

  const edgeState = edgeStateEngine({
    liquidity,
    vix,
    rotation, russell, structure, earlyWarning, crash, master,
    marketQuality, rotationDecay, rotationConfirm, participation,
    divergence, priceMomentum, executionState, regimeSync,
    dangerZone, marketData: data.marketData ?? {}, gamma
  });

  const nasdaqCall = guardOwnPriceEntry(nasdaqEngine({
    ...data,
    phase, phaseData, crash, rotation, putTiming, earlyWarning,
    historyMetrics, priceMomentum, marketQuality, participation,
    breadthThrust, liquidity, regimeSync, executionState,
    master, gamma
  }), priceMomentum.ndx, "NASDAQ_CALL", isHistoricalScenario);

  /* =====================================================
  POSITIONING
  ===================================================== */

  const positioning = {
    bias:
      (rotation.score ?? 0) > 60
        ? "BULLISH"
        : (rotation.score ?? 0) < 40
          ? "BEARISH"
          : "NEUTRAL",
    crowding:
      breadth50 > 85
        ? "CROWDED_LONG"
        : breadth50 < 30
          ? "CROWDED_SHORT"
          : "BALANCED",
    state:
      earlyWarning?.active
        ? "FRAGILE"
        : crash?.probability > 40
          ? "RISK"
          : "STABLE",
    score: Math.round(
      Number(rotation?.score ?? 50) * 0.5 +
      finiteOr(structure?.health, 0) * 0.3 -
      Number(crash?.probability ?? 0) * 0.2
    )
  };

  /* =====================================================
  TRADE STACK
  ===================================================== */

  const tradeStack = tradeStackEngine({
    phase, putTiming, nasdaqCall, russell, priceMomentum,
    edgeState, master, marketQuality, phaseConfirmation,
    rotationConfirm, rotationDecay, executionState, regimeSync,
    historyMetrics, regimePersistence, gamma
  });

  /* =====================================================
  POSITION STATE — PRE / SIZING
  ===================================================== */

  const statePre = data.positionState ?? null;
  const currentPositionSize = Number(statePre?.size ?? 0);

  const sizingState = statePre ?? {
    size: 0,
    entryPrice: 0,
    pnl: Number(data.pnl ?? 0),
    realized: 0,
    hasReduced: false,
    isRunner: false
  };

  const sizing = positionSizingV2({
    master, crash, putTiming, russell, positioning,
    state: sizingState,
    systemHeat, earlyWarning, rotation, structure, edgeState,
    tradeStack, divergence, regimeSync, dangerZone, executionState,
    rotationConfirm, rotationDecay, liquidity, breadthThrust,
    fragility, marketQuality, squeeze, participation, phase,
    historyMetrics, priceMomentum, regimePersistence, gamma
  });

  /* =====================================================
  EXIT / POSITION STATE — FINAL
  ===================================================== */

  const exit = exitEngine({
    position: { size: currentPositionSize },
    crash, vix, breadth50,
    pnl: Number(data.pnl ?? 0),
    phase, rotation, rotationConfirm, rotationDecay, russell,
    systemHeat, fragility, liquidity, participation, gamma
  });

  const state = positionStateEngine({
    prevState: statePre,
    sizing,
    exit,
    pnl: Number(data.pnl ?? 0)
  });

  /* =====================================================
  POSITION / DECISION
  ===================================================== */

  const position = positionEngine({
    pnl: Number(data.pnl ?? 0),
    phase,
    crash,
    rotation
  });

  const decision = rotationDecisionEngine({
    phase, crash, putTiming, russell, confidence,
    earlyWarning, master, positioning, edgeState,
    rotation, rotationConfirm, executionState,
    tradeStack, sizing, nasdaq: nasdaqCall
  });

  /* =====================================================
  SIGNAL / SUPER SIGNAL
  ===================================================== */

  const signalResult = signalEngine({
    phase, phaseConfirmation, crash, putTiming, rotation,
    earlyWarning, exit, decision, tradeStack, divergence,
    sizing, regimeSync, dangerZone, executionState,
    rotationConfirm, rotationDecay, liquidity, breadthThrust,
    fragility, squeeze, participation, marketQuality,
    priceMomentum, regimePersistence, gamma
  });

  const signal = {
    ...(signalResult?.signal ?? { active: false }),
    phase
  };

  const superSignal = superSignalEngine({
    signal, phaseConfirmation, rotationConfirm, rotationDecay,
    tradeStack, regimeSync, dangerZone, executionState, structure,
    marketDrivers, crash, rotation, divergence, liquidity,
    breadthThrust, fragility, squeeze, participation,
    marketQuality, regimePersistence
  });

  /* =====================================================
  EXECUTION / RISK / REPLAY
  ===================================================== */

  const execution = executionEngine({
    superSignal, marketQuality, vix, breadth20, breadth50,
    crash, phase, executionState, dangerZone, regimeSync,
    rotationConfirm, liquidity, breadthThrust, fragility,
    squeeze, participation, gamma
  });

  const risk = riskLoopEngine({
    sizing,
    exit,
    state
  });

  const replay = options.skipHistoricalReplay
    ? null
    : historicalReplay();

  /* =====================================================
  RETURN
  ===================================================== */

  return {
    crash,
    phase,
    phaseData,
    priceMomentum,
    phaseConfirmation,
    regime,
    rotation,
    rotationConfirm,
    rotationDecay,
    gamma,
    breadthVelocity,
    internalDivergence,
    regimePersistence,
    regimePersistencePre,
    signal,
    superSignal,
    decision,
    execution,
    executionState,
    executionStatePre,
    regimeSync,
    regimeSyncPre,
    dangerZone,
    liquidity,
    liquidityPre,
    breadthThrust,
    fragility,
    fragilityPre,
    squeeze,
    squeezePre,
    participation,
    marketQuality,
    position,
    positioning,
    sizing,
    exit,
    state,
    statePre,
    currentPositionSize,
    risk,
    putTiming,
    russell,
    nasdaqCall,
    master,
    confidence,
    systemHeat,
    systemHeatPre,
    earlyWarning,
    structure,
    tradeStack,
    edgeState,
    divergence,
    driversCore,
    marketDrivers,
    replay,
    historyMetrics,
    indices: data.indices ?? {},
    futures: data.futures ?? {},
    historicalScenario: isHistoricalScenario,
    historicalScenarioId: isHistoricalScenario
      ? data.scenarioId
      : undefined
  };
}
