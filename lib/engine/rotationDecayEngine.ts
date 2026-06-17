// /lib/engine/rotationDecayEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

export function rotationDecayEngine({
rotation,
structure,
earlyWarning,
crash,
participation,
liquidity,
fragility,
breadthThrust,
breadthVelocity,

regimeSync,
executionState,

vix,
gammaExposure,
creditRatio,
marketLiquidityScore,
concentrationScore,

internalDivergence,

historyMetrics

}: any) {

/* =====================================================
INPUT
===================================================== */

const rsSmall =
Number(rotation?.rsSmall ?? 1);

const rsGrowth =
Number(rotation?.rsGrowth ?? 1);

const rsEqual =
Number(rotation?.rsEqual ?? 1);

const rotationScore =
Number(rotation?.score ?? 50);

const breadth20 =
Number(
structure?.breadth?.b20?.value ?? 0
);

const breadth50 =
Number(
structure?.breadth?.b50?.value ?? 0
);

const breadth200 =
Number(
structure?.breadth?.b200?.value ?? 0
);

const breadth20Delta =
Number(
structure?.breadth?.b20?.delta ?? 0
);

const breadth50Delta =
Number(
structure?.breadth?.b50?.delta ?? 0
);

const breadth50Trend_10d =
Number(
breadthVelocity?.slopes?.b50Slope10d ??
breadthVelocity?.breadth50Trend_10d ??
0
);

const breadth200Trend_20d =
Number(
breadthVelocity?.slopes?.b200Slope20d ??
breadthVelocity?.breadth200Trend_20d ??
0
);

const ad =
Number(
structure?.advanceDecline?.value ?? 0
);

const highs =
Number(
structure?.highsLows?.highs ?? 0
);

const lows =
Number(
structure?.highsLows?.lows ?? 0
);

const participationScore =
Number(participation?.score ?? 50);

const participationSlope =
Number(
participation?.participationSlope ?? 0
);

const participationVelocity =
Number(
participation?.participationVelocity ?? 0
);

const participationAcceleration =
Number(
participation?.participationAcceleration ?? 0
);

const leadershipBreadthTrend =
Number(
participation?.leadershipBreadthTrend ?? 0
);

const megaCapDependenceTrend =
Number(
participation?.megaCapDependenceTrend ?? 0
);

const equalWeightTrend =
Number(
participation?.equalWeightTrend ?? 0
);

const smallCapTrend =
Number(
participation?.smallCapTrend ?? 0
);

const growthBreadthTrend =
Number(
participation?.growthBreadthTrend ?? 0
);

const decayPersistence =
Number(
participation?.decayPersistence ??
breadthVelocity?.decayPersistence ??
0
);

const liquidityScore =
Number(liquidity?.score ?? 50);

const fragilityScore =
Number(fragility?.score ?? 50);

const thrustScore =
Number(breadthThrust?.score ?? 50);

const breadthVelocityScore =
Number(
breadthVelocity?.score ?? 50
);

const velocity20 =
Number(
breadthVelocity?.velocity20 ?? 0
);

const velocity50 =
Number(
breadthVelocity?.velocity50 ?? 0
);

const velocityState =
breadthVelocity?.state ??
"STABLE";

const early =
earlyWarning?.active ?? false;

const earlyScore =
Number(
earlyWarning?.score?.value ??
earlyWarning?.score ??
0
);

const crashProbability =
Number(crash?.probability ?? 0);

const gamma =
Number(gammaExposure ?? 0);

const currentVix =
Number(vix ?? 20);

const credit =
Number(creditRatio ?? 1);

const concentration =
Number(concentrationScore ?? 50);

const historyBreadthTrend =
Number(
historyMetrics?.breadthTrend ?? 0
);

const historyBreadthAcceleration =
Number(
historyMetrics?.breadthAcceleration ?? 0
);

const historyParticipationDecay =
Number(
historyMetrics?.participationDecay ?? 0
);

const historyLeadershipDecay =
Number(
historyMetrics?.leadershipDecay ?? 0
);

const historyRelativeBreadthWeakness =
Number(
historyMetrics?.relativeBreadthWeakness ?? 0
);

const historyPhasePersistence =
Number(
historyMetrics?.phasePersistence ?? 0
);

const historyRegimePersistence =
Number(
historyMetrics?.regimePersistence ?? 0
);

/* =====================================================
INTERNAL DIVERGENCE
===================================================== */

const divergenceSeverity =
Number(
internalDivergence?.severity ?? 0
);

const divergenceState =
internalDivergence?.state ??
"NONE";

const hiddenDistribution =
internalDivergence?.hiddenDistribution ??
false;

const participationCollapse =
internalDivergence?.participationCollapse ??
false;

/* =====================================================
RELATIVE ROTATION DECAY
===================================================== */

const equalWeightWeakness =
rsEqual < 0.99;

const severeEqualWeightWeakness =
rsEqual < 0.975;

const smallCapWeakness =
rsSmall < 0.99;

const severeSmallCapWeakness =
rsSmall < 0.96;

const megaCapDominance =
rsGrowth > 1.015 &&
rsEqual < 0.99 &&
rsSmall < 0.99;

const severeMegaCapDominance =
rsGrowth > 1.03 &&
rsEqual < 0.975 &&
rsSmall < 0.95;

const rotationalExhaustion =
rotationScore < 45 &&
participationScore < 60;

const severeRotationalExhaustion =
rotationScore < 35 &&
participationScore < 52;

/* =====================================================
RELATIVE TREND DAMAGE
===================================================== */

const deterioratingBreadthTrend =
breadth50Trend_10d < -2;

const severeBreadthTrendDamage =
breadth50Trend_10d < -5 &&
breadth200Trend_20d < -4;

const participationTrendWeakening =
participationSlope < -2;

const severeParticipationTrendWeakening =
participationSlope < -5 &&
participationAcceleration < -3;

const leadershipTrendDeterioration =
leadershipBreadthTrend < -3;

const megaCapDependencyExpansion =
megaCapDependenceTrend > 4;

const relativeRotationDamage =
equalWeightTrend < -2 &&
smallCapTrend < -2;

const severeRelativeRotationDamage =
equalWeightTrend < -5 &&
smallCapTrend < -5;

/* =====================================================
FLAGS
===================================================== */

const narrowLeadership =
rsGrowth > 1.02 &&
rsSmall < 1 &&
rsEqual < 1;

const severeNarrowLeadership =
rsGrowth > 1.04 &&
rsSmall < 0.96 &&
rsEqual < 0.97;

const breadthRollover =
breadth20Delta < 0 &&
breadth50Delta < 0;

const aggressiveRollover =
breadth20Delta < -4 &&
breadth50Delta < -3;

const breadthMomentumLoss =
velocity20 < 0 &&
velocity50 < 0;

const aggressiveBreadthMomentumLoss =
velocity20 < -3 &&
velocity50 < -2;

const breadthImpulseBreak =
breadthVelocityScore < 45;

const severeBreadthImpulseBreak =
breadthVelocityScore < 35;

/* =====================================================
HEALTH FLAGS
===================================================== */

const healthyBreadth =
breadth50 > 60 &&
breadth200 > 55;

const strongBreadth =
breadth50 > 72 &&
breadth200 > 65;

const healthyInternals =
ad > 0 &&
highs > lows;

const calmTape =
currentVix < 20;

const noPanic =
crashProbability < 35;

const stableParticipation =
participationScore > 55;

const strongParticipation =
participationScore > 65;

const noDistribution =
!hiddenDistribution &&
ad > -50 &&
highs >= lows;

/* =====================================================
STRUCTURAL DAMAGE FLAGS
===================================================== */

const weakBreadth =
breadth50 < 50;

const severeBreadth =
breadth50 < 45 &&
breadth200 < 50 &&
ad < -150;

const weakParticipation =
participationScore < 50;

const collapsingParticipation =
participationScore < 40;

const liquidityStress =
liquidityScore < 42;

const fragileTape =
fragilityScore > 70;

const thrustFailure =
thrustScore < 45;

const severeThrustFailure =
thrustScore < 35;

const internalsWeak =
ad < 0 ||
highs < lows;

/* =====================================================
RAW DECAY
===================================================== */

let rawDecay = 8;

/* =====================================================
RELATIVE ROTATION DAMAGE
===================================================== */

if (equalWeightWeakness) {
rawDecay += 4;
}

if (severeEqualWeightWeakness) {
rawDecay += 6;
}

if (smallCapWeakness) {
rawDecay += 4;
}

if (severeSmallCapWeakness) {
rawDecay += 6;
}

if (megaCapDominance) {
rawDecay += 6;
}

if (severeMegaCapDominance) {
rawDecay += 10;
}

if (rotationalExhaustion) {
rawDecay += 6;
}

if (severeRotationalExhaustion) {
rawDecay += 10;
}

/* =====================================================
RELATIVE TREND DAMAGE
===================================================== */

if (deterioratingBreadthTrend) {
rawDecay += 5;
}

if (severeBreadthTrendDamage) {
rawDecay += 8;
}

if (participationTrendWeakening) {
rawDecay += 5;
}

if (severeParticipationTrendWeakening) {
rawDecay += 8;
}

if (leadershipTrendDeterioration) {
rawDecay += 5;
}

if (megaCapDependencyExpansion) {
rawDecay += 6;
}

if (relativeRotationDamage) {
rawDecay += 5;
}

if (severeRelativeRotationDamage) {
rawDecay += 8;
}

/* =====================================================
DECAY PERSISTENCE
===================================================== */

if (decayPersistence >= 5) {
rawDecay += 4;
}

if (decayPersistence >= 10) {
rawDecay += 6;
}

if (decayPersistence >= 14) {
rawDecay += 8;
}

/* =====================================================
HISTORY DECAY
===================================================== */

if (historyBreadthTrend < -5) {
rawDecay += 4;
}

if (historyBreadthTrend < -10) {
rawDecay += 6;
}

if (historyBreadthAcceleration < -5) {
rawDecay += 4;
}

if (historyBreadthAcceleration < -10) {
rawDecay += 8;
}

if (historyParticipationDecay > 10) {
rawDecay += 5;
}

if (historyParticipationDecay > 20) {
rawDecay += 8;
}

if (historyLeadershipDecay > 10) {
rawDecay += 4;
}

if (historyLeadershipDecay > 20) {
rawDecay += 8;
}

if (historyRelativeBreadthWeakness > 10) {
rawDecay += 3;
}

if (historyRelativeBreadthWeakness > 20) {
rawDecay += 6;
}

if (historyPhasePersistence >= 6) {
rawDecay += 4;
}

if (historyPhasePersistence >= 10) {
rawDecay += 8;
}

if (historyPhasePersistence >= 14) {
rawDecay += 12;
}

if (historyRegimePersistence >= 5) {
rawDecay += 4;
}

if (historyRegimePersistence >= 10) {
rawDecay += 8;
}


/* =====================================================
LEADERSHIP
===================================================== */

if (narrowLeadership) {
rawDecay += 4;
}

if (severeNarrowLeadership) {
rawDecay += 6;
}

/* =====================================================
DIVERGENCES
===================================================== */

rawDecay += Math.round(
divergenceSeverity * 0.3
);

if (hiddenDistribution) {
rawDecay += 10;
}

if (participationCollapse) {
rawDecay += 10;
}

/* =====================================================
BREADTH DAMAGE
===================================================== */

if (weakBreadth) {
rawDecay += 6;
}

if (breadthRollover) {
rawDecay += 5;
}

if (aggressiveRollover) {
rawDecay += 7;
}

if (breadthMomentumLoss) {
rawDecay += 6;
}

if (aggressiveBreadthMomentumLoss) {
rawDecay += 8;
}

if (breadthImpulseBreak) {
rawDecay += 5;
}

if (severeBreadthImpulseBreak) {
rawDecay += 8;
}

if (severeBreadth) {
rawDecay += 14;
}

/* =====================================================
PARTICIPATION
PRIORITÄT 2 FIX
Participation direkt in Decay einbeziehen
===================================================== */

if (weakParticipation) {
rawDecay += 6;
}

/*
Participation <= 50
=> zusätzlicher Decay
*/

if (participationScore <= 50) {
rawDecay += 5;
}

/*
Participation <= 45
=> deutlich stärkerer Decay
*/

if (participationScore <= 45) {
rawDecay += 10;
}

if (collapsingParticipation) {
rawDecay += 12;
}


/* =====================================================
INTERNALS
===================================================== */

if (internalsWeak) {
rawDecay += 5;
}

/* =====================================================
LIQUIDITY / FRAGILITY
===================================================== */

if (liquidityStress) {
rawDecay += 6;
}

if (fragileTape) {
rawDecay += 7;
}

if (thrustFailure) {
rawDecay += 5;
}

if (severeThrustFailure) {
rawDecay += 7;
}

/* =====================================================
EARLY WARNING
===================================================== */

if (early) {
rawDecay += 4;
}

if (earlyScore >= 8) {
rawDecay += 6;
}

/* =====================================================
CRASH PRESSURE
===================================================== */

if (crashProbability > 55) {
rawDecay += 10;
}
else if (crashProbability > 40) {
rawDecay += 5;
}

/* =====================================================
POSITIVE OFFSETS
===================================================== */

let positiveOffset = 0;

if (healthyBreadth) {
positiveOffset += 6;
}

if (strongBreadth) {
positiveOffset += 4;
}

if (healthyInternals) {
positiveOffset += 5;
}

if (stableParticipation) {
positiveOffset += 4;
}

if (strongParticipation) {
positiveOffset += 3;
}

if (calmTape) {
positiveOffset += 3;
}

if (noPanic) {
positiveOffset += 3;
}

if (noDistribution) {
positiveOffset += 3;
}

if (
liquidityScore > 65 &&
gamma > 0
) {
positiveOffset += 4;
}

const maxOffset =
rawDecay * 0.55;

positiveOffset =
Math.min(
positiveOffset,
maxOffset
);

/* =====================================================
FINAL SCORE
===================================================== */

let finalScore =
rawDecay - positiveOffset;

const structuralWeaknessPresent =
equalWeightWeakness ||
smallCapWeakness ||
narrowLeadership ||
breadthRollover ||
breadthMomentumLoss ||
deterioratingBreadthTrend ||
participationTrendWeakening ||
leadershipTrendDeterioration;

/*
PRIORITÄT 2 FIX:
Decay niemals auf 0 neutralisieren.
*/

const minimumDecayPersistence =
structuralWeaknessPresent
? 15
: 6;

finalScore =
Math.max(
finalScore,
minimumDecayPersistence
);

finalScore = Math.max(
0,
Math.min(
100,
Math.round(finalScore)
)
);

/* =====================================================
STATE
===================================================== */

let state =
"HEALTHY_ROTATION";

if (finalScore >= 15) {
state = "MATURE_ROTATION";
}

if (finalScore >= 28) {
state = "FRAGILE_ROTATION";
}

if (finalScore >= 42) {
state = "NARROW_ROTATION";
}

if (finalScore >= 58) {
state = "DISTRIBUTION_ROTATION";
}

if (finalScore >= 75) {
state = "EXHAUSTED_ROTATION";
}

/* =====================================================
MOMENTUM QUALITY
===================================================== */

let momentumQuality =
100 - (finalScore * 1.25);

if (equalWeightWeakness) {
momentumQuality -= 8;
}

if (smallCapWeakness) {
momentumQuality -= 8;
}

if (narrowLeadership) {
momentumQuality -= 6;
}

if (megaCapDominance) {
momentumQuality -= 10;
}

momentumQuality = Math.max(
0,
Math.min(
100,
Math.round(momentumQuality)
)
);

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Rotation structure stable";

if (state === "MATURE_ROTATION") {
summary =
"Healthy rotation but momentum breadth maturing";
}

if (state === "FRAGILE_ROTATION") {
summary =
"Selective rotation with weakening participation";
}

if (state === "NARROW_ROTATION") {
summary =
"Mega-cap leadership dominating while internals weaken";
}

if (state === "DISTRIBUTION_ROTATION") {
summary =
"Institutional participation deteriorating beneath index stability";
}

if (state === "EXHAUSTED_ROTATION") {
summary =
"Broad rotational collapse across participation and breadth";
}

/* =====================================================
RETURN
===================================================== */

return {

state,

score: finalScore,

rawDecay,

contextAdjustedDecay: finalScore,

contextAdjustment:
Math.round(positiveOffset),

momentumQuality,

breadthVelocityScore,

velocityState,

divergenceSeverity,
divergenceState,

decayPersistence,

trends: {
breadth50Trend_10d,
breadth200Trend_20d,

participationSlope,
participationVelocity,
participationAcceleration,

leadershipBreadthTrend,
megaCapDependenceTrend,

equalWeightTrend,
smallCapTrend,
growthBreadthTrend
},

signals: {

equalWeightWeakness,
severeEqualWeightWeakness,

smallCapWeakness,
severeSmallCapWeakness,

megaCapDominance,
severeMegaCapDominance,

rotationalExhaustion,
severeRotationalExhaustion,

deterioratingBreadthTrend,
severeBreadthTrendDamage,

participationTrendWeakening,
severeParticipationTrendWeakening,

leadershipTrendDeterioration,
megaCapDependencyExpansion,

relativeRotationDamage,
severeRelativeRotationDamage,

narrowLeadership,
severeNarrowLeadership,

breadthRollover,
aggressiveRollover,

breadthMomentumLoss,
aggressiveBreadthMomentumLoss,

breadthImpulseBreak,
severeBreadthImpulseBreak,

weakBreadth,
severeBreadth,

weakParticipation,
collapsingParticipation,

liquidityStress,
fragileTape,

thrustFailure,
severeThrustFailure,

internalsWeak,

hiddenDistribution,
participationCollapse,

healthyBreadth,
strongBreadth,
healthyInternals,
stableParticipation,
calmTape,
noPanic
},

history: {
breadthTrend: historyBreadthTrend,
breadthAcceleration: historyBreadthAcceleration,
participationDecay: historyParticipationDecay,
leadershipDecay: historyLeadershipDecay,
relativeBreadthWeakness:
historyRelativeBreadthWeakness,
phasePersistence:
historyPhasePersistence,
regimePersistence:
historyRegimePersistence
},

summary
};
}
