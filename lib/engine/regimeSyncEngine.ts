// /lib/engine/regimeSyncEngine.ts
import { getCreditContext } from "./creditContext";
import type { CreditContextInput } from "./creditContext";

export interface RegimeSyncInput extends CreditContextInput {
  phase: string;
  crash: any;
  rotation: any;
  structure: any;
  earlyWarning: any;
  vix: number;
  gammaExposure: number;
  liquidityScore: number;
  creditRatio: number;
  breadth50: number;
  breadth200: number;
  participation?: any;
  breadthThrust?: any;
  fragility?: any;
  divergence?: any;
  rotationDecay?: any;
  internalDivergence?: any;
  marketQuality?: any;
}

export interface RegimeSyncOutput {
  aligned: boolean;
  score: number;
  state: "EXPANSION" | "STABLE" | "FRAGILE" | "INTERNALLY_DETERIORATING" | "DISTRIBUTION" | "BREAKDOWN";
  weakestLink: string;
  strongestLink: string;
  structurallyAligned: boolean;
  liquidityAligned: boolean;
  institutionallyAligned: boolean;
  accelerationContained: boolean;
  components: {
    structuralIntegrity: number;
    liquidityOverlay: number;
    accelerationOverlay: number;
    breadthQuality: number;
    participation: number;
    rotation: number;
    marketQuality: number;
    liquidity: number;
    volatility: number;
    gamma: number;
    credit: number | null;
    decay: number;
    divergence: number;
    fragility: number;
  };
  meta: {
    creditContext: ReturnType<typeof getCreditContext>;
    structuralIntegrityHealthy: boolean;
    liquidityEnvironmentHealthy: boolean;
    accelerationContained: boolean;
    participationHealthy: boolean;
    breadthHealthy: boolean;
    rotationHealthy: boolean;
    marketQualityHealthy: boolean;
    hiddenDistribution: boolean;
    participationCollapse: boolean;
    narrowLeadership: boolean;
    liquidityTrap: boolean;
    liquidityDependence: boolean;
    structuralBreakdown: boolean;
    distributionRegime: boolean;
    institutionalDistribution: boolean;
  };
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function numericValue(value: unknown, fallback: number): number {
  const candidates = value && typeof value === "object"
    ? [(value as any).value, (value as any).score, (value as any).current]
    : [value];
  for (const candidate of candidates) {
    if (typeof candidate !== "number" && typeof candidate !== "string") continue;
    if (typeof candidate === "string" && candidate.trim() === "") continue;
    const numeric = Number(candidate);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback;
}

export function regimeSyncEngine(input: RegimeSyncInput): RegimeSyncOutput {
  const {
    rotation, participation, fragility, rotationDecay, internalDivergence,
    marketQuality = {}
  } = input;

  const vix = numericValue(input.vix, 20);
  const gammaExposure = numericValue(input.gammaExposure, 0);
  const liquidityScore = numericValue(input.liquidityScore, 50);
  const creditContext = getCreditContext(input);
  const breadth50 = numericValue(input.breadth50, 50);
  const breadth200 = numericValue(input.breadth200, 50);
  const participationScore = numericValue(participation?.score, 50);
  const rotationScore = numericValue(rotation?.score, 50);
  const rsEqual = numericValue(rotation?.rsEqual, 1);
  const rsSmall = numericValue(rotation?.rsSmall, 1);
  const rsGrowth = numericValue(rotation?.rsGrowth, 1);
  const rotationDecayScore = numericValue(rotationDecay?.score, 0);
  const rotationDecayState = rotationDecay?.state ?? "HEALTHY_ROTATION";
  const fragilityScore = numericValue(fragility?.score, 50);
  const fragilityState = fragility?.state ?? "RESILIENT";
  const marketQualityScore = numericValue(marketQuality?.score, 50);
  const internalSynchronization = marketQuality?.internalSynchronization === true;
  const hiddenDistribution = internalDivergence?.hiddenDistribution === true;
  const participationCollapse = internalDivergence?.participationCollapse === true;

  // Thresholds use the numeric score; severity is a textual classification.
  // Numeric legacy severity is retained as a fallback.
  const internalDivergenceSeverity = numericValue(
    internalDivergence?.score,
    numericValue(internalDivergence?.severity, 0)
  );

  const narrowLeadership = rsGrowth > 1.03 && rsSmall < 0.995 && rsEqual < 0.995;
  const megaCapDistortion = rsGrowth > 1.05 && rsSmall < 0.97 && rsEqual < 0.97;
  const participationHealthy = participationScore >= 58;
  const breadthHealthy = breadth50 >= 58 && breadth200 >= 52;
  const rotationHealthy = rotationScore >= 55 && rotationDecayScore < 40;
  const marketQualityHealthy = marketQualityScore >= 60 && internalSynchronization;
  const liquidityTrap = liquidityScore >= 65 &&
    (participationScore < 45 || narrowLeadership || marketQualityScore < 45);
  const liquidityDependence = liquidityScore >= 65 &&
    (narrowLeadership || participationScore < 48 || rotationDecayScore >= 50);
  const institutionalDistribution = (
    (narrowLeadership || megaCapDistortion) && participationScore < 50 && rotationScore < 45 &&
    (hiddenDistribution || rotationDecayScore >= 45)
  ) || (rotationDecayScore >= 65 && participationScore <= 50);

  let structuralIntegrity = 55;
  structuralIntegrity += Math.round((participationScore - 50) * 0.28);
  structuralIntegrity += Math.round((breadth50 - 50) * 0.22);
  structuralIntegrity += Math.round((breadth200 - 50) * 0.18);
  structuralIntegrity += Math.round((rotationScore - 50) * 0.18);
  structuralIntegrity += Math.round((marketQualityScore - 50) * 0.24);
  if (narrowLeadership) structuralIntegrity -= 8;
  if (megaCapDistortion) structuralIntegrity -= 12;
  if (rotationDecayScore >= 50) structuralIntegrity -= 10;
  if (rotationDecayScore >= 60) structuralIntegrity -= 5;
  if (rotationDecayScore >= 70) structuralIntegrity -= 8;
  if (hiddenDistribution) structuralIntegrity -= 12;
  if (participationCollapse) structuralIntegrity -= 14;
  if (institutionalDistribution) structuralIntegrity -= 18;
  structuralIntegrity = clamp(Math.round(structuralIntegrity));

  let liquidityOverlay = 65;
  liquidityOverlay += Math.round((liquidityScore - 50) * 0.30);
  if (vix > 22) liquidityOverlay -= 10;
  if (vix > 30) liquidityOverlay -= 14;
  if (gammaExposure < 0) liquidityOverlay -= 10;
  if (gammaExposure < -10) liquidityOverlay -= 12;
  if (creditContext.riskOff) liquidityOverlay -= 10;
  if (liquidityTrap) liquidityOverlay -= 18;
  if (liquidityDependence) liquidityOverlay -= 12;
  if (institutionalDistribution) liquidityOverlay -= 10;
  liquidityOverlay = clamp(Math.round(liquidityOverlay));

  let accelerationOverlay = 75;
  accelerationOverlay -= Math.round(rotationDecayScore * 0.35);
  if (rotationDecayScore >= 60) accelerationOverlay -= 8;
  if (rotationDecayScore >= 70) accelerationOverlay -= 12;
  accelerationOverlay -= Math.round(internalDivergenceSeverity * 0.30);
  accelerationOverlay -= Math.round((fragilityScore - 50) * 0.20);
  if (hiddenDistribution) accelerationOverlay -= 14;
  if (participationCollapse) accelerationOverlay -= 16;
  if (institutionalDistribution) accelerationOverlay -= 18;
  if (rotationDecayState === "ROTATION_FAILURE") accelerationOverlay -= 18;
  if (rotationDecayState === "INTERNAL_BREAKDOWN") accelerationOverlay -= 22;
  if (fragilityState === "STRUCTURALLY_UNSTABLE") accelerationOverlay -= 12;
  if (fragilityState === "BREAKDOWN_RISK") accelerationOverlay -= 18;
  accelerationOverlay = clamp(Math.round(accelerationOverlay));

  const structurallyAligned = participationHealthy && breadthHealthy && rotationHealthy &&
    marketQualityHealthy && !hiddenDistribution && !institutionalDistribution;
  const liquidityAligned = liquidityOverlay >= 55 && !liquidityTrap && vix < 28;
  const institutionallyAligned = structurallyAligned && liquidityAligned &&
    !megaCapDistortion && !institutionalDistribution && fragilityScore < 60;
  const accelerationContained = accelerationOverlay >= 55 && rotationDecayScore < 50 && !participationCollapse;
  const structuralBreakdown = structuralIntegrity < 32 && accelerationOverlay < 35;
  const distributionRegime = hiddenDistribution || (narrowLeadership && participationScore < 50) ||
    (rotationDecayScore >= 65 && participationScore <= 50) || liquidityDependence;

  let state: RegimeSyncOutput["state"];
  if (structuralBreakdown || fragilityState === "BREAKDOWN_RISK") state = "BREAKDOWN";
  else if (distributionRegime || institutionalDistribution || accelerationOverlay < 40) state = "DISTRIBUTION";
  else if (!accelerationContained || rotationDecayScore >= 55) state = "INTERNALLY_DETERIORATING";
  else if (!institutionallyAligned || fragilityScore >= 50) state = "FRAGILE";
  else if (structurallyAligned && liquidityAligned) state = "EXPANSION";
  else state = "STABLE";

  // Existing weights retained; calibration is a separate review.
  const rotationWeight = 0.30;
  const participationWeight = 0.18;
  const liquidityWeight = 0.17;
  const decayWeight = 0.15;
  const score = clamp(Math.round(
    structuralIntegrity * 0.45 + liquidityOverlay * liquidityWeight + accelerationOverlay * 0.10 +
    rotationScore * rotationWeight + participationScore * participationWeight - rotationDecayScore * decayWeight
  ));

  const components = {
    structuralIntegrity,
    liquidityOverlay,
    accelerationOverlay,
    breadthQuality: Math.round((breadth50 + breadth200) / 2),
    participation: participationScore,
    rotation: rotationScore,
    marketQuality: marketQualityScore,
    liquidity: liquidityScore,
    volatility: clamp(Math.round(100 - vix * 2)),
    gamma: clamp(Math.round(70 + gammaExposure * 2)),
    // Categorical diagnostic, not a calibrated continuous health score.
    credit: !creditContext.available ? null : creditContext.riskOn ? 100 : creditContext.riskOff ? 0 : 50,
    decay: clamp(Math.round(100 - rotationDecayScore)),
    divergence: clamp(Math.round(100 - internalDivergenceSeverity)),
    fragility: clamp(Math.round(100 - fragilityScore))
  };
  const sorted = Object.entries(components)
    .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const strongestLink = sorted[0]?.[0] ?? "unknown";
  const weakestLink = sorted[sorted.length - 1]?.[0] ?? "unknown";
  const aligned = institutionallyAligned && accelerationContained && !institutionalDistribution &&
    state !== "DISTRIBUTION" && state !== "BREAKDOWN";

  return {
    aligned,
    score,
    state,
    weakestLink,
    strongestLink,
    structurallyAligned,
    liquidityAligned,
    institutionallyAligned,
    accelerationContained,
    components,
    meta: {
      creditContext,
      structuralIntegrityHealthy: structuralIntegrity >= 60,
      liquidityEnvironmentHealthy: liquidityOverlay >= 55,
      accelerationContained,
      participationHealthy,
      breadthHealthy,
      rotationHealthy,
      marketQualityHealthy,
      hiddenDistribution,
      participationCollapse,
      narrowLeadership,
      liquidityTrap,
      liquidityDependence,
      structuralBreakdown,
      distributionRegime,
      institutionalDistribution
    }
  };
}
