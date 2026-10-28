// /lib/engine/systemHeatEngine.ts
import { getCreditContext } from "./creditContext";

export function systemHeatEngine(data: any) {
  const breadth50 = readNumber(50, data.breadth50);
  const breadth20 = readNumber(50, data.breadth20);
  const liquidityScore = readNumber(50, data.marketLiquidityScore, data.liquidity?.score);
  const participationScore = readNumber(50, data.participationScore, data.participation?.score);
  const breadthThrustScore = readNumber(50, data.breadthThrustScore, data.breadthThrust?.score);
  const rotationScore = readNumber(50, data.rotationScore, data.rotation?.score);
  const rotationDecayScore = readNumber(0, data.rotationDecayScore, data.rotationDecay?.score);
  const fragilityScore = readNumber(50, data.fragilityScore, data.fragility?.score);
  const crashScore = readNumber(0, data.crash?.score);
  const crashProbability = readNumber(0, data.crash?.probability);
  const vix = readPositive(20, data.vix);
  const creditContext = getCreditContext(data);
  const credit = creditContext.rawRatio;
  // Backend: VIX / VIX3M. Zero means the denominator was unavailable.
  const vixTerm = readPositive(1, data.vixTermRatio);
  const gamma = readNumber(0, data.gammaExposure);

  const breadthMomentumRaw = (breadth20 + breadth50) / 2;
  const momentum = normalizeScore(breadthMomentumRaw);
  const breadth = normalizeScore(breadth50);
  const liquidity = normalizeScore(liquidityScore);
  const participation = normalizeScore(participationScore);
  const rotation = normalizeScore(rotationScore);
  const thrust = normalizeScore(breadthThrustScore);
  const crashRisk = normalizeScore(100 - crashScore);
  const fragility = normalizeScore(100 - fragilityScore);
  const rotationDecay = normalizeScore(100 - rotationDecayScore);

  const vixClamped = clamp(vix, 10, 45);
  const volatility = clamp(2 - ((vixClamped - 10) / 35) * 4, -2, 2);

  // The producer defines direction relative to the ratio's own MA50.
  const creditScore = creditContext.riskOn ? 1 : creditContext.riskOff ? -1 : 0;

  // Use the boundaries already defined by the backend for VIX / VIX3M.
  let termScore = 0;
  if (vixTerm >= 1.15) termScore = -2;
  else if (vixTerm >= 1.05) termScore = -1;
  else if (vixTerm < 0.90) termScore = 2;
  const termStress = vixTerm >= 1.05;

  let gammaScore = 0;
  if (gamma > 0) gammaScore = 1;
  else if (gamma < 0) gammaScore = -1;

  let heat =
    momentum * 0.10 + breadth * 0.10 + liquidity * 0.12 +
    participation * 0.18 + rotation * 0.15 + thrust * 0.08 +
    crashRisk * 0.10 + fragility * 0.08 + rotationDecay * 0.05 +
    volatility * 0.02 + creditScore * 0.01 +
    termScore * 0.005 + gammaScore * 0.005;

  const strongInstitutionalStructure =
    participationScore >= 60 && rotationScore >= 55 && breadthThrustScore >= 55;
  const weakInstitutionalStructure = participationScore < 45 || rotationScore < 40;
  const severeInstitutionalWeakness =
    participationScore < 35 && rotationScore < 35 && breadthThrustScore < 40;

  if (severeInstitutionalWeakness) heat -= 0.35;
  else if (weakInstitutionalStructure) heat -= 0.18;
  if (breadth50 < 50 && participationScore < 50) heat -= 0.15;
  if (rotationDecayScore >= 70) heat -= 0.18;
  else if (rotationDecayScore >= 55) heat -= 0.08;

  const liquidityTrap = liquidityScore >= 70 &&
    (participationScore < 45 || rotationScore < 40);
  if (liquidityTrap) heat -= 0.20;
  if (liquidityScore >= 70 && participationScore >= 60 && rotationScore >= 55) {
    heat += 0.10;
  }

  const negativeGamma = gamma < 0;
  const doubleStress = termStress && negativeGamma;
  if (termStress) heat -= 0.15;
  if (negativeGamma) heat -= 0.12;
  if (doubleStress) heat -= 0.18;

  // Preserve existing override thresholds and caps.
  if (crashScore >= 85) heat = Math.min(heat, -1.40);
  else if (crashScore >= 75) heat = Math.min(heat, -0.90);
  else if (crashProbability >= 70) heat = Math.min(heat, -0.60);
  const crashOverride = crashScore >= 75 || crashProbability >= 70;

  const structuralCap = participationScore < 45 && rotationScore < 45;
  const severeStructuralCap = participationScore < 35 || rotationScore < 30;
  if (structuralCap) heat = Math.min(heat, 0.25);
  if (severeStructuralCap) heat = Math.min(heat, 0);
  heat = Number(clamp(heat, -2, 2).toFixed(2));

  const bullishStructure = heat >= 0.40 && participationScore >= 55 &&
    rotationScore >= 50 && crashScore < 40;
  const strongRiskOn = heat >= 1.20 && participationScore >= 65 &&
    rotationScore >= 60 && breadth50 >= 65 && crashScore < 30;
  const structuralWarning = heat <= -0.40 || weakInstitutionalStructure;
  const riskOff = heat <= -1.20 || crashScore >= 75;

  let label = "TRANSITION";
  let state = "NEUTRAL";
  if (strongRiskOn) {
    label = "RISK ON";
    state = "STRONG_BULLISH";
  } else if (bullishStructure) {
    label = "BULLISH";
    state = "BULLISH";
  } else if (riskOff) {
    label = "RISK OFF";
    state = "BEARISH";
  } else if (structuralWarning) {
    label = "RISK WARNING";
    state = "DEFENSIVE";
  }

  return {
    value: heat,
    label,
    state,
    components: {
      momentum, breadth, liquidity, participation, rotation, thrust,
      crashRisk, fragility, rotationDecay, volatility,
      credit: creditScore, term: termScore, gamma: gammaScore
    },
    quality: {
      strongInstitutionalStructure, weakInstitutionalStructure,
      severeInstitutionalWeakness, bullishStructure, strongRiskOn,
      structuralWarning, riskOff
    },
    control: {
      crashOverride, termStress, negativeGamma, doubleStress,
      liquidityTrap, structuralCap, severeStructuralCap
    },
    inputs: {
      breadth20, breadth50, liquidityScore, participationScore,
      breadthThrustScore, rotationScore, rotationDecayScore, fragilityScore,
      crashScore, crashProbability, vix, credit, creditContext, vixTerm, gamma
    }
  };
}

function finiteValue(value: any): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const candidate of [value.value, value.score, value.current]) {
      if (typeof candidate !== "number" && typeof candidate !== "string") continue;
      const parsed = finiteValue(candidate);
      if (parsed !== null) return parsed;
    }
  }
  return null;
}

function readNumber(fallback: number, ...values: any[]): number {
  for (const value of values) {
    const parsed = finiteValue(value);
    if (parsed !== null) return parsed;
  }
  return fallback;
}

function readPositive(fallback: number, ...values: any[]): number {
  for (const value of values) {
    const parsed = finiteValue(value);
    if (parsed !== null && parsed > 0) return parsed;
  }
  return fallback;
}

function normalizeScore(value: number): number {
  return clamp(((value - 50) / 50) * 2, -2, 2);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
