// /lib/engine/masterScoreEngine.ts

export function masterScoreEngine(engine: any) {

/* =====================================================
INPUT
===================================================== */

const crash = engine.crash ?? {};
const rotation = engine.rotation ?? {};
const putTiming = engine.putTiming ?? {};
const russell = engine.russell ?? {};
const phaseData = engine.phaseData ?? {};
const structure = engine.structure ?? {};
const participation = engine.participation ?? {};
const breadthThrust = engine.breadthThrust ?? {};
const liquidity = engine.liquidity ?? {};
const fragility = engine.fragility ?? {};
const rotationDecay = engine.rotationDecay ?? {};
const regimeSync = engine.regimeSync ?? {};
const breadthVelocity = engine.breadthVelocity ?? {};
const regimePersistence = engine.regimePersistence ?? {};
const marketQuality = engine.marketQuality ?? {};
const historyMetrics = engine.historyMetrics ?? {};
const dangerZone = engine.dangerZone ?? {};
const executionState = engine.executionState ?? {};
const phaseConfirmation = engine.phaseConfirmation ?? {};
const priceMomentum = engine.priceMomentum ?? {};

/* =====================================================
SAFE VALUES
===================================================== */

const crashScore =
Number(crash?.score ?? 0);

const crashProbability =
Number(crash?.probability ?? 0);

const rotationScore =
Number(rotation?.score ?? 50);

const russellScore =
Number(
russell?.confidence ??
russell?.score?.value ??
50
);

const timingRaw =
Number(
putTiming?.score?.value ??
putTiming?.score ??
0
);

/*
* putTiming is a DEFENSIVE/PUT timing score.
*
* It therefore must NOT directly increase the
* bullish Master Score.
*
* 0 = no put pressure
* 12 = maximum put timing pressure
*/

const timingScore =
Math.max(
0,
Math.min(
100,
(timingRaw / 12) * 100
)
);

const phase =
phaseData?.phase ??
"PHASE_1_EXPANSION";

const phaseConfidence =
Number(
phaseConfirmation?.confidence ?? 50
);

const phaseConfirmed =
Boolean(
phaseConfirmation?.confirmed ?? false
);

const participationScore =
Number(
participation?.score ?? 50
);

const thrustScore =
Number(
breadthThrust?.score ?? 50
);

const liquidityScore =
Number(
liquidity?.score ?? 50
);

const fragilityScore =
Number(
fragility?.score ?? 50
);

const rotationDecayScore =
Number(
rotationDecay?.score ?? 0
);

const marketQualityScore =
Number(
marketQuality?.score ?? 50
);

const breadthVelocityScore =
Number(
breadthVelocity?.score ?? 50
);

const regimeSyncScore =
Number(
regimeSync?.score ?? 50
);

const dangerScore =
Number(
dangerZone?.score ?? 0
);

/* =====================================================
PRICE MOMENTUM
===================================================== */

const priceMomentumScore =
Number(
priceMomentum?.score ?? 50
);

const priceMomentumTrend =
priceMomentum?.trend ??
priceMomentum?.direction ??
"NEUTRAL";

const priceMomentumAcceleration =
Number(
priceMomentum?.acceleration ?? 0
);

/* =====================================================
HISTORY
===================================================== */

const {
phasePersistence = 0,

daysInPhase = 0,

participationDecay = 0,

breadthTrend = 0,

breadthAcceleration = 0,

leadershipDecay = 0,

crashTrend = 0,

relativeBreadthWeakness = 0,

institutionalPressure = 0,

marketCharacter = "EXPANSION",

averageBreadth = 50,
averageParticipation = 50,
averageRotation = 50,
averageLiquidity = 50,
averageFragility = 50,

acceleratingWeakness = false,

regimePersistence: regimePersistenceHistory = 0,

persistentDistribution:
historyPersistentDistribution = false,

prolongedBearRegime = false

} = historyMetrics;

/* =====================================================
EXECUTION
===================================================== */

const riskState =
executionState?.riskState ??
"NORMAL";

const executionMode =
executionState?.executionMode ??
"NORMAL";

const marketMode =
executionState?.marketMode ??
"RISK_ON";

/* =====================================================
NORMALIZATION
===================================================== */

function clamp(
value: number,
min = 0,
max = 100
) {

return Math.max(
min,
Math.min(
max,
value
)
);

}

/*
* Converts a risk score into a constructive score.
*
* Example:
*
* fragility 88
* =>
* constructive 12
*/

function invert(
value: number
) {

return 100 - clamp(value);

}

/*
* Safe weighted average.
*/

function weightedAverage(
values: Array<{
value: number;
weight: number;
}>
) {

let numerator = 0;
let denominator = 0;

for (const item of values) {

const value =
clamp(
Number(item.value)
);

const weight =
Math.max(
0,
Number(item.weight)
);

numerator +=
value * weight;

denominator +=
weight;
}

if (denominator <= 0) {
return 50;
}

return numerator / denominator;

}

/* =====================================================
CONSTRUCTIVE COMPONENTS
===================================================== */

/*
* CRASH
*
* crash.score and crash.probability are risk
* measurements.
*
* Therefore both are inverted.
*/

const crashConstructive =
weightedAverage([
{
value: invert(crashScore),
weight: 0.50
},
{
value: invert(crashProbability),
weight: 0.50
}
]);

/*
* ROTATION
*
* rotation.score is already directional:
*
* high = constructive
* low = risk-off
*/

const rotationConstructive =
clamp(rotationScore);

/*
* PUT TIMING
*
* Put timing is the opposite of a bullish signal.
*
* High put timing =
* stronger defensive setup.
*/

const timingConstructive =
invert(timingScore);

/*
* RUSSELL
*/

const russellConstructive =
clamp(russellScore);

/*
* PARTICIPATION
*/

const participationConstructive =
clamp(participationScore);

/*
* BREADTH THRUST
*/

const thrustConstructive =
clamp(thrustScore);

/*
* BREADTH VELOCITY
*/

const breadthVelocityConstructive =
clamp(breadthVelocityScore);

/*
* LIQUIDITY
*/

const liquidityConstructive =
clamp(liquidityScore);

/*
* FRAGILITY
*
* High fragility = bad.
*/

const fragilityConstructive =
invert(fragilityScore);

/*
* ROTATION DECAY
*
* High decay = deteriorating rotation.
*/

const rotationDecayConstructive =
invert(rotationDecayScore);

/*
* MARKET QUALITY
*/

const marketQualityConstructive =
clamp(marketQualityScore);

/*
* REGIME SYNC
*/

const regimeSyncConstructive =
clamp(regimeSyncScore);

/*
* DANGER ZONE
*
* High danger = bad.
*/

const dangerConstructive =
invert(dangerScore);

/*
* PRICE MOMENTUM
*/

const priceMomentumConstructive =
clamp(priceMomentumScore);

/* =====================================================
HISTORICAL QUALITY
===================================================== */

const historicalBreadth =
clamp(
Number(averageBreadth)
);

const historicalParticipation =
clamp(
Number(averageParticipation)
);

const historicalRotation =
clamp(
Number(averageRotation)
);

const historicalLiquidity =
clamp(
Number(averageLiquidity)
);

const historicalFragility =
invert(
Number(averageFragility)
);

const historicalQuality =
weightedAverage([
{
value: historicalBreadth,
weight: 0.20
},
{
value: historicalParticipation,
weight: 0.20
},
{
value: historicalRotation,
weight: 0.15
},
{
value: historicalLiquidity,
weight: 0.20
},
{
value: historicalFragility,
weight: 0.25
}
]);

/* =====================================================
STRUCTURAL QUALITY
===================================================== */

const structuralQuality =
weightedAverage([
{
value: marketQualityConstructive,
weight: 0.30
},
{
value: participationConstructive,
weight: 0.20
},
{
value: breadthVelocityConstructive,
weight: 0.15
},
{
value: rotationDecayConstructive,
weight: 0.15
},
{
value: fragilityConstructive,
weight: 0.20
}
]);

/* =====================================================
CURRENT MARKET QUALITY
===================================================== */

const currentQuality =
weightedAverage([
{
value: rotationConstructive,
weight: 0.12
},
{
value: participationConstructive,
weight: 0.12
},
{
value: thrustConstructive,
weight: 0.08
},
{
value: breadthVelocityConstructive,
weight: 0.08
},
{
value: liquidityConstructive,
weight: 0.10
},
{
value: fragilityConstructive,
weight: 0.14
},
{
value: rotationDecayConstructive,
weight: 0.08
},
{
value: marketQualityConstructive,
weight: 0.16
},
{
value: priceMomentumConstructive,
weight: 0.05
},
{
value: regimeSyncConstructive,
weight: 0.04
},
{
value: dangerConstructive,
weight: 0.03
}
]);

/* =====================================================
BASE MASTER SCORE
===================================================== */

/*
* The Master Score is deliberately NOT created by
* adding/subtracting dozens of arbitrary points.
*
* It is a normalized weighted quality score.
*
* This guarantees:
*
* 0 <= score <= 100
*
* and prevents the score from collapsing to zero
* merely because many independent warning conditions
* happen to be active simultaneously.
*/

let score =
weightedAverage([
{
value: currentQuality,
weight: 0.55
},
{
value: structuralQuality,
weight: 0.25
},
{
value: historicalQuality,
weight: 0.10
},
{
value: crashConstructive,
weight: 0.10
}
]);

/* =====================================================
PHASE ADJUSTMENT
===================================================== */

/*
* Phase is a regime classifier and therefore gets
* a bounded adjustment only.
*
* It must NOT completely overwrite the underlying
* quantitative score.
*/

let phaseAdjustment = 0;

switch (phase) {

case "PHASE_1_EXPANSION":
phaseAdjustment = +5;
break;

case "PHASE_2_WARNING":
phaseAdjustment = -3;
break;

case "PHASE_3_DISTRIBUTION":
phaseAdjustment = -7;
break;

case "PHASE_4_RISK":
phaseAdjustment = -10;
break;

case "PHASE_5_BREAKDOWN":
phaseAdjustment = -15;
break;

case "PHASE_6_ACCELERATION":
phaseAdjustment = -20;
break;

case "PHASE_7_CAPITULATION":
phaseAdjustment = -10;
break;

default:
phaseAdjustment = 0;
}

/*
* Confirmed phases get a small additional weighting.
*
* The confidence adjustment is deliberately small.
*/

if (
phaseConfirmed &&
phaseConfidence >= 70
) {

phaseAdjustment *= 1.15;

}

else if (
!phaseConfirmed &&
phaseConfidence < 40
) {

/*
* Uncertainty should pull the score toward
* the neutral center, not directly make it
* extremely bearish.
*/

score =
50 +
(score - 50) * 0.75;

}

score += phaseAdjustment;

/* =====================================================
STRUCTURAL WARNING ADJUSTMENTS
===================================================== */

/*
* These are bounded adjustments.
*
* They are NOT additional component scores.
*/

let warningAdjustment = 0;

const deterioratingBreadth =
Number(breadthTrend) <= -2;

const acceleratingBreadthDecay =
Number(breadthAcceleration) <= -1;

const leadershipConcentration =
Number(leadershipDecay) <= -2;

const risingCrashRisk =
Number(crashTrend) >= 3;

const broadParticipationFailure =
Number(relativeBreadthWeakness) > 10;

const prolongedBearHistory =
Boolean(prolongedBearRegime);

if (deterioratingBreadth) {
warningAdjustment -= 2;
}

if (acceleratingBreadthDecay) {
warningAdjustment -= 3;
}

if (leadershipConcentration) {
warningAdjustment -= 2;
}

if (risingCrashRisk) {
warningAdjustment -= 2;
}

if (broadParticipationFailure) {
warningAdjustment -= 3;
}

if (
prolongedBearHistory &&
Number(institutionalPressure) > 70
) {

warningAdjustment -= 3;

}

if (
Number(phasePersistence) >= 85
) {

warningAdjustment -= 2;

}

/*
* Historical bear persistence is relevant, but should
* never by itself force the Master Score to zero.
*/

if (
Boolean(historyPersistentDistribution)
) {

warningAdjustment -= 2;

}

/*
* Accelerating weakness is a confirmation signal.
*/

if (
Boolean(acceleratingWeakness)
) {

warningAdjustment -= 2;

}

score += warningAdjustment;

/* =====================================================
EXECUTION ADJUSTMENT
===================================================== */

/*
* Execution state is a risk overlay.
*
* It should influence the Master Score only slightly.
*/

let executionAdjustment = 0;

if (
marketMode === "RISK_OFF"
) {

executionAdjustment -= 4;

}

if (
riskState === "BREAKDOWN"
) {

executionAdjustment -= 5;

}

if (
executionMode === "REDUCE_RISK"
) {

executionAdjustment -= 3;

}

score += executionAdjustment;

/* =====================================================
CLAMP
===================================================== */

score =
Math.max(
0,
Math.min(
100,
Math.round(score)
)
);

/* =====================================================
STRUCTURAL FLAGS
===================================================== */

const weakInternals = (

participationScore < 50 ||

breadthVelocityScore < 45 ||

marketQualityScore < 45 ||

rotationDecayScore > 45 ||

daysInPhase >= 10 ||

institutionalPressure > 65 ||

averageBreadth < 55 ||

averageParticipation < 55 ||

averageLiquidity < 50 ||

averageFragility > 60 ||

participationDecay > 15 ||

deterioratingBreadth ||

acceleratingBreadthDecay ||

leadershipConcentration ||

broadParticipationFailure ||

prolongedBearRegime

);

const narrowLeadership = (

Number(rotation?.rsGrowth ?? 1) > 1.03 &&

Number(rotation?.rsSmall ?? 1) < 0.995 &&

Number(rotation?.rsEqual ?? 1) < 0.995

);

/* =====================================================
MODE
===================================================== */

let mode:
| "LONG"
| "NEUTRAL"
| "RISK"
| "CRASH";

/*
* Mode is deliberately separated from score.
*
* The score describes market quality.
* The phase describes the regime.
* Mode describes the resulting trading posture.
*/

mode = "LONG";

if (
phase === "PHASE_3_DISTRIBUTION"
) {

mode = "NEUTRAL";

}

if (
phase === "PHASE_4_RISK"
) {

mode = "RISK";

}

if (
phase === "PHASE_5_BREAKDOWN" ||
phase === "PHASE_6_ACCELERATION" ||
phase === "PHASE_7_CAPITULATION"
) {

mode = "CRASH";

}

/*
* Strong structural deterioration can move a
* supposedly earlier phase into risk mode.
*/

if (
prolongedBearRegime &&
broadParticipationFailure
) {

mode = "RISK";

}

if (
acceleratingBreadthDecay &&
risingCrashRisk
) {

mode = "RISK";

}

/*
* Execution layer may force defensive mode.
*/

const executionOverride = (

marketMode === "RISK_OFF" ||

riskState === "BREAKDOWN" ||

executionMode === "REDUCE_RISK"

);

if (
executionOverride &&
mode === "LONG"
) {

mode = "RISK";

}

/*
* Do NOT downgrade RISK/CRASH back to NEUTRAL
* merely because of narrow leadership.
*/

if (
narrowLeadership &&
weakInternals &&
phase !== "PHASE_1_EXPANSION" &&
mode === "LONG"
) {

mode = "NEUTRAL";

}

/* =====================================================
NET EXPOSURE
===================================================== */

let netExposure = 0;

switch (mode) {

case "LONG":
netExposure = 40;
break;

case "NEUTRAL":
netExposure = 0;
break;

case "RISK":
netExposure = -40;
break;

case "CRASH":
netExposure = -85;
break;

}

/* =====================================================
REGIME
===================================================== */

let regime:
| "LONG"
| "TRANSITION"
| "RISK"
| "CRASH";

regime = "LONG";

if (
phase === "PHASE_3_DISTRIBUTION"
) {

regime = "TRANSITION";

}

if (
mode === "RISK"
) {

regime = "RISK";

}

if (
mode === "CRASH"
) {

regime = "CRASH";

}

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Balanced institutional regime";

if (
mode === "LONG"
) {

summary =
"Constructive long environment";

}

if (
mode === "NEUTRAL"
) {

summary =
"Neutral transition regime";

}

if (
mode === "RISK"
) {

summary =
"Defensive risk regime";

}

if (
mode === "CRASH"
) {

summary =
"Crash regime active";

}

/* =====================================================
RETURN
===================================================== */

return {

score,

mode,

netExposure,

regime,

summary,

meta: {

/*
* Execution
*/

riskState,
marketMode,
executionMode,

/*
* Phase
*/

phaseConfirmed,
phaseConfidence,

/*
* Momentum
*/

priceMomentumScore,
priceMomentumTrend,
priceMomentumAcceleration,

/*
* Structural flags
*/

weakInternals,
narrowLeadership,

rotationDecayScore,
marketQualityScore,
participationScore,
breadthVelocityScore,

phasePersistence,
participationDecay,

breadthTrend,
breadthAcceleration,

leadershipDecay,
crashTrend,

relativeBreadthWeakness,

daysInPhase,

institutionalPressure,

marketCharacter,

averageBreadth,
averageParticipation,
averageRotation,
averageLiquidity,
averageFragility,

regimePersistenceHistory,

deterioratingBreadth,
acceleratingBreadthDecay,

leadershipConcentration,
risingCrashRisk,

broadParticipationFailure,
prolongedBearRegime,

/*
* Diagnostics
*/

phaseAdjustment,
warningAdjustment,
executionAdjustment,

currentQuality:
Math.round(
currentQuality
),

structuralQuality:
Math.round(
structuralQuality
),

historicalQuality:
Math.round(
historicalQuality
),

crashConstructive:
Math.round(
crashConstructive
),

timingConstructive:
Math.round(
timingConstructive
)

},

/*
* IMPORTANT:
*
* These are NORMALIZED COMPONENT SCORES.
*
* They are NOT intended to be summed.
*
* Every component is independently in the
* range 0..100.
*/

components: {

crash:
Math.round(
crashConstructive
),

rotation:
Math.round(
rotationConstructive
),

priceMomentum:
Math.round(
priceMomentumConstructive
),

timing:
Math.round(
timingConstructive
),

russell:
Math.round(
russellConstructive
),

participation:
Math.round(
participationConstructive
),

breadthThrust:
Math.round(
thrustConstructive
),

breadthVelocity:
Math.round(
breadthVelocityConstructive
),

rotationDecay:
Math.round(
rotationDecayConstructive
),

liquidity:
Math.round(
liquidityConstructive
),

marketQuality:
Math.round(
marketQualityConstructive
),

fragility:
Math.round(
fragilityConstructive
),

regimeSync:
Math.round(
regimeSyncConstructive
),

dangerZone:
Math.round(
dangerConstructive
)

}

};

}
