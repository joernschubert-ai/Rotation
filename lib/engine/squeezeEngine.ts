// /lib/engine/squeezeEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

export interface SqueezeEngineInput {
  gammaExposure?: number;
  vix?: number;
  moveIndex?: number;
  breadth50?: number;
  breadth200?: number;
  putCallRatio?: number;
  shortInterest?: number;

  vixTermRatio?: number;
  creditRatio?: number;
  marketLiquidityScore?: number;

  dealerCompression?: number;
  passiveFlowRisk?: number;
  volSuppression?: number;
  structuralGammaFloor?: number;
  passiveGammaCompression?: number;

  rsSmall?: number;
  rsEqual?: number;
  rsGrowth?: number;
  participationScore?: number;
}

export interface SqueezeEngineOutput {
  risk: number;

  state:
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "EXTREME";

  squeezeType:
    | "NONE"
    | "SHORT_SQUEEZE"
    | "VOL_SQUEEZE"
    | "LIQUIDITY_SQUEEZE"
    | "PASSIVE_FLOW_SQUEEZE";

  instability: number;

  effectiveGamma: number;
  structuralGammaFloor: number;
  passiveGammaCompression: number;
  dealerCompression: number;
  passiveFlowRisk: number;
  volSuppression: number;

  narrowLeadership: boolean;
  weakBreadth: boolean;
  weakParticipation: boolean;

  summary: string;
  metrics: Record<string, any>;
  components: Record<string, any>;
  dataQuality: Record<string, any>;
}

function numeric(value: unknown): number | null {
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
      const candidate = (value as any)[key];

      if (
        typeof candidate !== "number" &&
        typeof candidate !== "string"
      ) {
        continue;
      }

      const parsed = numeric(candidate);
      if (parsed !== null) return parsed;
    }
  }

  return null;
}

function positive(value: unknown): number | null {
  const parsed = numeric(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(
    min,
    Math.min(max, Number.isFinite(value) ? value : min)
  );
}

export function squeezeEngine(
  input: SqueezeEngineInput
): SqueezeEngineOutput {
  const data = input ?? {};

  const measured = {
    gamma: numeric(data.gammaExposure),
    vix: positive(data.vix),
    move: positive(data.moveIndex),

    breadth50: numeric(data.breadth50),
    breadth200: numeric(data.breadth200),

    putCall: positive(data.putCallRatio),
    shortInterest: numeric(data.shortInterest),

    vixTerm: positive(data.vixTermRatio),
    credit: positive(data.creditRatio),
    liquidity: numeric(data.marketLiquidityScore),

    rsSmall: positive(data.rsSmall),
    rsEqual: positive(data.rsEqual),
    rsGrowth: positive(data.rsGrowth),

    participation: numeric(data.participationScore)
  };

  const rawGamma = measured.gamma ?? 0;
  const vix = measured.vix ?? 20;
  const move = measured.move ?? 80;

  const breadth50 = clamp(measured.breadth50 ?? 50);
  const breadth200 = clamp(measured.breadth200 ?? 50);

  const putCall = measured.putCall ?? 1;
  const shortInterest = clamp(measured.shortInterest ?? 50);

  const vixTerm = measured.vixTerm ?? 1;
  const credit = measured.credit ?? 1;
  const liquidity = clamp(measured.liquidity ?? 50);

  const rsSmall = measured.rsSmall ?? 1;
  const rsEqual = measured.rsEqual ?? 1;
  const rsGrowth = measured.rsGrowth ?? 1;

  const participationScore = clamp(
    measured.participation ?? 50
  );

  const flags = getMarketStructureFlags({
    rsGrowth,
    rsSmall,
    rsEqual,
    breadth50,
    breadth200,
    participationScore
  });

  const narrowLeadership = flags.narrowLeadership;
  const severeNarrowLeadership = flags.severeNarrowLeadership;
  const megaCapOnlyTape = flags.megaCapOnlyTape;
  const equalWeightWeakness = flags.equalWeightWeakness;
  const smallCapWeakness = flags.smallCapWeakness;

  const breadthFailure =
    measured.breadth50 !== null &&
    measured.breadth200 !== null &&
    measured.participation !== null &&
    flags.breadthFailure;

  // Backend ratio: VIX / VIX3M.
  const contango =
    measured.vixTerm !== null &&
    vixTerm < 1;

  const calmVolatility =
    measured.vix !== null &&
    vix < 18;

  const veryCalmVolatility =
    measured.vix !== null &&
    vix < 17;

  const lowVolatility =
    measured.vix !== null &&
    vix < 20;

  const weakBreadth =
    measured.breadth50 !== null &&
    breadth50 < 58;

  const severeWeakBreadth =
    measured.breadth50 !== null &&
    breadth50 < 45;

  const weakParticipation =
    measured.participation !== null &&
    participationScore < 50;

  const severeWeakParticipation =
    measured.participation !== null &&
    participationScore < 42;

  const external = {
    structuralGammaFloor:
      numeric(data.structuralGammaFloor),

    passiveGammaCompression:
      numeric(data.passiveGammaCompression),

    dealerCompression:
      numeric(data.dealerCompression),

    passiveFlowRisk:
      numeric(data.passiveFlowRisk),

    volSuppression:
      numeric(data.volSuppression)
  };

  // Explicit zero is preserved.
  let structuralGammaFloor =
    external.structuralGammaFloor ?? 0;

  if (
    external.structuralGammaFloor === null &&
    rawGamma >= 0 &&
    contango
  ) {
    if (lowVolatility) {
      structuralGammaFloor = 35;
    }

    if (calmVolatility && narrowLeadership) {
      structuralGammaFloor = Math.max(
        structuralGammaFloor,
        45
      );
    }

    if (
      lowVolatility &&
      megaCapOnlyTape &&
      weakBreadth
    ) {
      structuralGammaFloor = Math.max(
        structuralGammaFloor,
        55
      );
    }

    if (
      lowVolatility &&
      weakBreadth &&
      weakParticipation
    ) {
      structuralGammaFloor = Math.max(
        structuralGammaFloor,
        60
      );
    }
  }

  structuralGammaFloor = clamp(
    structuralGammaFloor
  );

  // A diagnostic floor must not hide measured negative gamma.
  const effectiveGamma = rawGamma < 0
    ? rawGamma
    : Math.max(rawGamma, structuralGammaFloor);

  let passiveGammaCompression =
    external.passiveGammaCompression ?? 0;

  if (external.passiveGammaCompression === null) {
    if (contango) passiveGammaCompression += 15;
    if (lowVolatility) passiveGammaCompression += 15;
    if (calmVolatility) passiveGammaCompression += 10;
    if (narrowLeadership) passiveGammaCompression += 18;
    if (weakBreadth) passiveGammaCompression += 18;
    if (weakParticipation) passiveGammaCompression += 12;
    if (megaCapOnlyTape) passiveGammaCompression += 12;

    if (
      severeWeakBreadth &&
      severeWeakParticipation
    ) {
      passiveGammaCompression += 10;
    }
  }

  passiveGammaCompression = clamp(
    Math.round(passiveGammaCompression)
  );

  let dealerCompression =
    external.dealerCompression ?? 0;

  if (external.dealerCompression === null) {
    if (effectiveGamma >= 20) dealerCompression += 18;
    if (effectiveGamma >= 35) dealerCompression += 15;
    if (effectiveGamma >= 50) dealerCompression += 8;

    if (calmVolatility) dealerCompression += 15;
    if (weakBreadth) dealerCompression += 15;
    if (severeWeakBreadth) dealerCompression += 8;

    dealerCompression += Math.round(
      passiveGammaCompression * 0.18
    );

    if (
      effectiveGamma >= 30 &&
      calmVolatility &&
      weakBreadth
    ) {
      dealerCompression += 12;
    }
  }

  dealerCompression = clamp(
    Math.round(dealerCompression)
  );

  let passiveFlowRisk =
    external.passiveFlowRisk ?? 0;

  if (external.passiveFlowRisk === null) {
    if (effectiveGamma > 10) passiveFlowRisk += 12;
    if (veryCalmVolatility) passiveFlowRisk += 15;
    if (weakBreadth) passiveFlowRisk += 20;

    if (
      measured.liquidity !== null &&
      liquidity > 65
    ) {
      passiveFlowRisk += 8;
    }

    if (narrowLeadership) passiveFlowRisk += 10;

    passiveFlowRisk += Math.round(
      passiveGammaCompression * 0.18
    );

    if (
      measured.breadth50 !== null &&
      breadth50 < 55 &&
      veryCalmVolatility
    ) {
      passiveFlowRisk += 12;
    }
  }

  passiveFlowRisk = clamp(
    Math.round(passiveFlowRisk)
  );

  let volSuppression =
    external.volSuppression ?? 0;

  if (external.volSuppression === null) {
    if (veryCalmVolatility) volSuppression += 20;
    if (contango) volSuppression += 15;
    if (effectiveGamma >= 20) volSuppression += 12;
    if (weakBreadth) volSuppression += 12;

    if (
      measured.move !== null &&
      move > 85
    ) {
      volSuppression += 8;
    }

    if (passiveGammaCompression >= 60) {
      volSuppression += 10;
    }

    if (narrowLeadership) volSuppression += 8;
  }

  volSuppression = clamp(
    Math.round(volSuppression)
  );

  const riskComponents: Record<string, number> = {
    base: 15,

    passiveGamma:
      Math.round(passiveGammaCompression * 0.14),

    dealerCompression:
      Math.round(dealerCompression * 0.14),

    passiveFlow:
      Math.round(passiveFlowRisk * 0.13),

    volatilitySuppression:
      Math.round(volSuppression * 0.14),

    combinedPassiveRegime:
      (
        calmVolatility &&
        weakBreadth &&
        effectiveGamma >= 25
          ? 8
          : 0
      ) +
      (
        veryCalmVolatility &&
        measured.breadth50 !== null &&
        breadth50 < 55 &&
        effectiveGamma >= 30
          ? 6
          : 0
      ),

    negativeGamma:
      (rawGamma < 0 ? 20 : 0) +
      (rawGamma < -5 ? 8 : 0) +
      (rawGamma < -15 ? 8 : 0),

    structuralCompression:
      (
        effectiveGamma >= 35 &&
        calmVolatility &&
        weakBreadth
          ? 7
          : 0
      ) +
      (passiveGammaCompression >= 65 ? 8 : 0),

    volatility:
      (
        measured.vix !== null && vix > 22
          ? 8
          : 0
      ) +
      (
        measured.vix !== null && vix > 30
          ? 10
          : 0
      ) +
      (
        measured.vix !== null && vix > 40
          ? 8
          : 0
      ),

    bondVolatility:
      (
        measured.move !== null && move > 100
          ? 8
          : 0
      ) +
      (
        measured.move !== null && move > 120
          ? 8
          : 0
      ),

    breadth:
      (
        measured.breadth50 !== null && breadth50 < 50
          ? 5
          : 0
      ) +
      (
        measured.breadth50 !== null && breadth50 < 40
          ? 8
          : 0
      ) +
      (
        measured.breadth200 !== null && breadth200 < 40
          ? 6
          : 0
      ) +
      (breadthFailure ? 8 : 0),

    participation:
      (weakParticipation ? 5 : 0) +
      (severeWeakParticipation ? 7 : 0),

    positioning:
      (
        measured.putCall !== null && putCall > 1.10
          ? 6
          : 0
      ) +
      (
        measured.putCall !== null && putCall > 1.25
          ? 6
          : 0
      ) +
      (
        measured.shortInterest !== null && shortInterest > 70
          ? 8
          : 0
      ) +
      (
        measured.shortInterest !== null && shortInterest > 85
          ? 8
          : 0
      ),

    // Existing credit direction retained pending producer verification.
    credit:
      (
        measured.credit !== null && credit < 0.98
          ? 4
          : 0
      ) +
      (
        measured.credit !== null && credit < 0.95
          ? 8
          : 0
      ),

    liquidity:
      (
        measured.liquidity !== null && liquidity < 40
          ? 7
          : 0
      ) +
      (
        measured.liquidity !== null && liquidity < 30
          ? 8
          : 0
      ),

    reflexiveMeltup:
      (
        dealerCompression >= 60 &&
        passiveFlowRisk >= 55 &&
        volSuppression >= 55
          ? 10
          : 0
      ) +
      (
        passiveGammaCompression >= 70 &&
        weakBreadth &&
        weakParticipation
          ? 12
          : 0
      ) +
      (
        megaCapOnlyTape &&
        calmVolatility &&
        weakParticipation
          ? 8
          : 0
      )
  };

  const unclampedRisk = Object.values(
    riskComponents
  ).reduce((sum, value) => sum + value, 0);

  const risk = clamp(
    Math.round(unclampedRisk)
  );

  const state: SqueezeEngineOutput["state"] =
    risk >= 80
      ? "EXTREME"
      : risk >= 60
        ? "HIGH"
        : risk >= 35
          ? "MODERATE"
          : "LOW";

  // Preserve type priority. These types are not trade signals.
  const squeezeType: SqueezeEngineOutput["squeezeType"] =
    dealerCompression >= 60 &&
    passiveFlowRisk >= 60 &&
    passiveGammaCompression >= 55
      ? "PASSIVE_FLOW_SQUEEZE"
      : measured.shortInterest !== null &&
        shortInterest > 70 &&
        rawGamma < 0
        ? "SHORT_SQUEEZE"
        : measured.breadth50 !== null &&
          breadth50 < 40 &&
          rawGamma < 0
          ? "LIQUIDITY_SQUEEZE"
          : measured.vix !== null &&
            measured.move !== null &&
            vix > 28 &&
            move > 100
            ? "VOL_SQUEEZE"
            : "NONE";

  const instabilityComponents = {
    risk,

    negativeGamma:
      rawGamma < 0 ? 8 : 0,

    forcedVolatility:
      measured.vix !== null &&
      measured.move !== null &&
      vix > 30 &&
      move > 110
        ? 8
        : 0,

    dealerCompression:
      dealerCompression >= 60 ? 8 : 0,

    passiveGamma:
      passiveGammaCompression >= 65 ? 8 : 0,

    passiveFlow:
      passiveFlowRisk >= 65 && weakBreadth
        ? 8
        : 0
  };

  const instabilityUnclamped = Object.values(
    instabilityComponents
  ).reduce((sum, value) => sum + value, 0);

  const instability = clamp(
    Math.round(instabilityUnclamped)
  );

  const missingInputs = Object.entries(measured)
    .filter(([, value]) => value === null)
    .map(([key]) => key);

  let summary =
    squeezeType === "PASSIVE_FLOW_SQUEEZE"
      ? "Reflexive passive-flow squeeze structure detected"
      : squeezeType === "SHORT_SQUEEZE"
        ? "Short positioning and negative gamma squeeze risk elevated"
        : squeezeType === "LIQUIDITY_SQUEEZE"
          ? "Liquidity squeeze risk elevated under weak market breadth"
          : squeezeType === "VOL_SQUEEZE"
            ? "Volatility squeeze and forced positioning environment"
            : state === "EXTREME"
              ? "Extreme forced positioning and squeeze instability"
              : state === "HIGH"
                ? "High positioning and squeeze risk environment"
                : state === "MODERATE"
                  ? "Elevated squeeze dynamics beneath market stability"
                  : "Low positioning and squeeze instability";

  if (
    megaCapOnlyTape &&
    squeezeType !== "PASSIVE_FLOW_SQUEEZE"
  ) {
    summary += " | Narrow leadership distortion";
  }

  if (passiveGammaCompression >= 65) {
    summary += " | Passive gamma compression elevated";
  }

  if (missingInputs.length > 0) {
    summary += " | Incomplete positioning inputs";
  }

  return {
    risk,
    state,
    squeezeType,
    instability,

    effectiveGamma,
    structuralGammaFloor,
    passiveGammaCompression,
    dealerCompression,
    passiveFlowRisk,
    volSuppression,

    narrowLeadership,
    weakBreadth,
    weakParticipation,
    summary,

    components: {
      risk: riskComponents,
      instability: instabilityComponents,

      unclampedRisk,
      instabilityUnclamped,

      saturated:
        unclampedRisk > 100,

      scoreType:
        "POSITIONING_INSTABILITY",

      directionalSignal:
        "NONE",

      creditConventionVerified: false,

      termRatioDefinition:
        "VIX / VIX3M",

      weightsCalibratedByThisAudit: false
    },

    dataQuality: {
      missingInputs,
      measured,

      explicitDiagnostics: Object.fromEntries(
        Object.entries(external).map(
          ([key, value]) => [key, value !== null]
        )
      ),

      derivedGammaFloorIsEstimate:
        external.structuralGammaFloor === null,

      missingValuesAreNotMeasurements: true
    },

    metrics: {
      gamma: rawGamma,
      effectiveGamma,
      structuralGammaFloor,

      vix,
      move,
      breadth50,
      breadth200,
      putCall,
      shortInterest,
      vixTerm,
      credit,
      liquidity,

      dealerCompression,
      passiveFlowRisk,
      volSuppression,
      passiveGammaCompression,

      rsSmall,
      rsEqual,
      rsGrowth,
      participationScore,

      narrowLeadership,
      severeNarrowLeadership,
      megaCapOnlyTape,
      equalWeightWeakness,
      smallCapWeakness,
      weakBreadth,
      breadthFailure,
      weakParticipation,
      contango
    }
  };
}