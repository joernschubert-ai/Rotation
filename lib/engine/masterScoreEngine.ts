// /lib/engine/masterScoreEngine.ts

export function masterScoreEngine(engine: any) {

/* =====================================================
MASTER SCORE SEMANTICS
===================================================== */

/*
* IMPORTANT:
*
* The Master Score is a RISK SCORE.
*
* 0 = strong constructive / CALL environment
* 50 = neutral / transition
* 100 = strong defensive / PUT environment
*
* Therefore:
*
* LOW SCORE -> GREEN -> CALL
* HIGH SCORE -> RED -> PUT
*
* ALL component scores use exactly the same semantic:
*
* LOW = constructive / CALL
* HIGH = risk / PUT
*
* There is NO mixed constructive/risk interpretation
* inside the returned Master Score object.
*/


/* =====================================================
INPUT
===================================================== */

const crash = engine.crash ?? {};
const rotation = engine.rotation ?? {};
const putTiming = engine.putTiming ?? {};
const russell = engine.russell ?? {};
const phaseData = engine.phaseData ?? {};
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
REGIME PERSISTENCE
===================================================== */

const persistenceScore =
Number(
regimePersistence?.score ?? 0
);

const distributionRisk =
Number(
regimePersistence?.distributionRisk ?? 0
);

const falseRecoveryRisk =
Number(
regimePersistence?.falseRecoveryRisk ?? 0
);

const marketFatigue =
Number(
regimePersistence?.marketFatigue ?? 0
);

const bearishPersistence =
Boolean(
regimePersistence?.bearishPersistence ?? false
);

const bullishPersistence =
Boolean(
regimePersistence?.bullishPersistence ?? false
);

const persistenceTrend =
regimePersistence?.trend ??
"STABLE";


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
* Convert a constructive score into risk space.
*
* Example:
*
* constructive 100 -> risk 0
* constructive 50 -> risk 50
* constructive 0 -> risk 100
*/

function riskFromConstructive(
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

if (
denominator <= 0
) {

return 50;

}

return numerator / denominator;

}


/* =====================================================
TIMING NORMALIZATION
===================================================== */

/*
* putTiming historically uses a 0..12 scale.
*
* 0 = no PUT timing pressure
* 12 = maximum PUT timing pressure
*
* Therefore it is directly normalized into
* the common 0..100 RISK scale.
*/

const timingRisk =
clamp(
(timingRaw / 12) * 100
);


/* =====================================================
RISK COMPONENTS
===================================================== */

/*
* CRASH
*
* crash.score:
* high = more risk
*
* crash.probability:
* high = more risk
*/

const crashRisk =
weightedAverage([
{
value: crashScore,
weight: 0.50
},
{
value: crashProbability,
weight: 0.50
}
]);


/*
* ROTATION
*
* rotation.score:
* high = constructive
* low = risk
*
* Convert into risk space.
*/

const rotationRisk =
riskFromConstructive(
rotationScore
);


/*
* PUT TIMING
*
* Already risk-oriented after normalization.
*/

const timingRiskScore =
timingRisk;


/*
* RUSSELL
*
* Russell confidence:
* high = constructive
* low = weak / blocked
*
* Convert into risk space.
*/

const russellRisk =
riskFromConstructive(
russellScore
);


/*
* PARTICIPATION
*
* high = healthy
* low = weak
*/

const participationRisk =
riskFromConstructive(
participationScore
);


/*
* BREADTH THRUST
*
* high = healthy
* low = fragile
*/

const thrustRisk =
riskFromConstructive(
thrustScore
);


/*
* BREADTH VELOCITY
*
* high = healthy/stable
* low = deterioration
*/

const breadthVelocityRisk =
riskFromConstructive(
breadthVelocityScore
);


/*
* LIQUIDITY
*
* high = healthy
* low = stressed
*/

const liquidityRisk =
riskFromConstructive(
liquidityScore
);


/*
* FRAGILITY
*
* Already risk-oriented.
*
* high = dangerous
*/

const fragilityRisk =
clamp(
fragilityScore
);


/*
* ROTATION DECAY
*
* Already risk-oriented.
*
* high = deteriorating rotation
*/

const rotationDecayRisk =
clamp(
rotationDecayScore
);


/*
* MARKET QUALITY
*
* high = healthy
* low = structural deterioration
*/

const marketQualityRisk =
riskFromConstructive(
marketQualityScore
);


/*
* REGIME SYNC
*
* high = synchronized / constructive
* low = breakdown / divergence
*/

const regimeSyncRisk =
riskFromConstructive(
regimeSyncScore
);


/*
* DANGER ZONE
*
* Already risk-oriented.
*/

const dangerRisk =
clamp(
dangerScore
);


/*
* PRICE MOMENTUM
*
* high = constructive
* low = weak
*/

const priceMomentumRisk =
riskFromConstructive(
priceMomentumScore
);


/* =====================================================
HISTORICAL RISK
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
clamp(
Number(averageFragility)
);


/*
* Historical values are mostly constructive
* measurements.
*
* Convert every constructive measurement into
* the common risk space first.
*/

const historicalBreadthRisk =
riskFromConstructive(
historicalBreadth
);

const historicalParticipationRisk =
riskFromConstructive(
historicalParticipation
);

const historicalRotationRisk =
riskFromConstructive(
historicalRotation
);

const historicalLiquidityRisk =
riskFromConstructive(
historicalLiquidity
);


/*
* Historical fragility is already a risk measurement.
*/

const historicalFragilityRisk =
historicalFragility;


/*
* Historical risk.
*/

const historicalRisk =
weightedAverage([
{
value: historicalBreadthRisk,
weight: 0.20
},
{
value: historicalParticipationRisk,
weight: 0.20
},
{
value: historicalRotationRisk,
weight: 0.15
},
{
value: historicalLiquidityRisk,
weight: 0.20
},
{
value: historicalFragilityRisk,
weight: 0.25
}
]);


/* =====================================================
STRUCTURAL RISK
===================================================== */

/*
* All inputs below are already in RISK space.
*
* Therefore they can be combined directly.
*/

const structuralRisk =
weightedAverage([
{
value: marketQualityRisk,
weight: 0.30
},
{
value: participationRisk,
weight: 0.20
},
{
value: breadthVelocityRisk,
weight: 0.15
},
{
value: rotationDecayRisk,
weight: 0.15
},
{
value: fragilityRisk,
weight: 0.20
}
]);


/* =====================================================
CURRENT MARKET RISK
===================================================== */

/*
* All components are now directly risk-oriented.
*
* No second inversion is necessary.
*/

const currentMarketRisk =
weightedAverage([
{
value: rotationRisk,
weight: 0.12
},
{
value: participationRisk,
weight: 0.12
},
{
value: thrustRisk,
weight: 0.08
},
{
value: breadthVelocityRisk,
weight: 0.08
},
{
value: liquidityRisk,
weight: 0.10
},
{
value: fragilityRisk,
weight: 0.14
},
{
value: rotationDecayRisk,
weight: 0.08
},
{
value: marketQualityRisk,
weight: 0.16
},
{
value: priceMomentumRisk,
weight: 0.05
},
{
value: regimeSyncRisk,
weight: 0.04
},
{
value: dangerRisk,
weight: 0.03
}
]);


/* =====================================================
BASE MASTER RISK
===================================================== */

/*
* Master Score = RISK SCORE.
*
* Current market conditions have the largest weight.
* Structural quality provides the second layer.
* Historical conditions prevent short-term noise from
* dominating the score.
* Crash risk is deliberately kept as an additional
* independent risk input.
*/

let score =
weightedAverage([
{
value: currentMarketRisk,
weight: 0.55
},
{
value: structuralRisk,
weight: 0.25
},
{
value: historicalRisk,
weight: 0.10
},
{
value: crashRisk,
weight: 0.10
}
]);


/* =====================================================
PHASE ADJUSTMENT
===================================================== */

/*
* Phase is a bounded RISK overlay.
*
* Earlier phases:
* lower risk
*
* Later phases:
* higher risk
*
* PHASE_7_CAPITULATION receives a reduced adjustment
* because capitulation can represent exhaustion.
*/

let phaseAdjustment = 0;

switch (phase) {

case "PHASE_1_EXPANSION":

phaseAdjustment = -5;

break;

case "PHASE_2_WARNING":

phaseAdjustment = +3;

break;

case "PHASE_3_DISTRIBUTION":

phaseAdjustment = +7;

break;

case "PHASE_4_RISK":

phaseAdjustment = +10;

break;

case "PHASE_5_BREAKDOWN":

phaseAdjustment = +15;

break;

case "PHASE_6_ACCELERATION":

phaseAdjustment = +20;

break;

case "PHASE_7_CAPITULATION":

phaseAdjustment = +10;

break;

default:

phaseAdjustment = 0;

}


/*
* Confirmed phases receive slightly more weight.
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
* Low phase confidence pulls the score toward neutral.
*
* It does not directly create a bullish or bearish signal.
*/

score =
50 +
(score - 50) * 0.75;

}

score +=
phaseAdjustment;


/* =====================================================
REGIME PERSISTENCE OVERLAY
===================================================== */

/*
* Persistence is deliberately treated as an OVERLAY.
*
* It should confirm structural weakness but must never
* completely replace the underlying market score.
*/

let persistenceAdjustment = 0;


/*
* Distribution risk.
*/

persistenceAdjustment +=
clamp(
distributionRisk
) * 0.10;


/*
* False recovery risk.
*/

persistenceAdjustment +=
clamp(
falseRecoveryRisk
) * 0.08;


/*
* Market fatigue.
*/

persistenceAdjustment +=
clamp(
marketFatigue
) * 0.05;


/*
* Explicit bearish persistence.
*/

if (
bearishPersistence
) {

persistenceAdjustment += 6;

}


/*
* Persistent distribution history.
*/

if (
historyPersistentDistribution
) {

persistenceAdjustment += 4;

}


/*
* Prolonged bear regime.
*/

if (
prolongedBearRegime
) {

persistenceAdjustment += 4;

}


/*
* Improving persistence can reduce risk slightly.
*/

if (
bullishPersistence &&
persistenceTrend === "IMPROVING"
) {

persistenceAdjustment -= 5;

}


/*
* Bound persistence overlay.
*/

persistenceAdjustment =
clamp(
persistenceAdjustment,
-10,
20
);

score +=
persistenceAdjustment;


/* =====================================================
STRUCTURAL WARNING ADJUSTMENTS
===================================================== */

/*
* Warning signals are deliberately bounded overlays.
*
* They confirm risk but do not create an independent
* Master Score.
*/

let warningAdjustment = 0;


/*
* Breadth deterioration.
*/

const deterioratingBreadth =
Number(breadthTrend) <= -2;


/*
* Accelerating breadth deterioration.
*/

const acceleratingBreadthDecay =
Number(breadthAcceleration) <= -1;


/*
* Leadership concentration.
*/

const leadershipConcentration =
Number(leadershipDecay) <= -2;


/*
* Rising crash risk.
*/

const risingCrashRisk =
Number(crashTrend) >= 3;


/*
* Broad participation failure.
*/

const broadParticipationFailure =
Number(relativeBreadthWeakness) > 10;


/*
* Prolonged bear history.
*/

const prolongedBearHistory =
Boolean(prolongedBearRegime);


/*
* Apply bounded risk adjustments.
*/

if (
deterioratingBreadth
) {

warningAdjustment += 2;

}

if (
acceleratingBreadthDecay
) {

warningAdjustment += 3;

}

if (
leadershipConcentration
) {

warningAdjustment += 2;

}

if (
risingCrashRisk
) {

warningAdjustment += 2;

}

if (
broadParticipationFailure
) {

warningAdjustment += 3;

}

if (
prolongedBearHistory &&
Number(institutionalPressure) > 70
) {

warningAdjustment += 3;

}

if (
Number(phasePersistence) >= 85
) {

warningAdjustment += 2;

}

if (
historyPersistentDistribution
) {

warningAdjustment += 2;

}

if (
Boolean(acceleratingWeakness)
) {

warningAdjustment += 2;

}


/*
* Warning stack can never dominate the underlying score.
*/

warningAdjustment =
clamp(
warningAdjustment,
0,
20
);

score +=
warningAdjustment;


/* =====================================================
EXECUTION ADJUSTMENT
===================================================== */

/*
* Execution state is a small risk overlay.
*/

let executionAdjustment = 0;

if (
marketMode === "RISK_OFF"
) {

executionAdjustment += 4;

}

if (
riskState === "BREAKDOWN"
) {

executionAdjustment += 5;

}

if (
executionMode === "REDUCE_RISK"
) {

executionAdjustment += 3;

}

executionAdjustment =
clamp(
executionAdjustment,
0,
12
);

score +=
executionAdjustment;


/* =====================================================
FINAL SCORE
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
MASTER SIGNAL
===================================================== */

/*
* SINGLE SOURCE OF TRUTH FOR PANEL INTERPRETATION:
*
* 0..35 = CALL / GREEN
* 36..64 = NEUTRAL / YELLOW
* 65..100 = PUT / RED
*
* The panel should NOT invert these values again.
*/

let signal:
| "CALL"
| "NEUTRAL"
| "PUT";

let color:
| "GREEN"
| "YELLOW"
| "RED";

if (
score <= 35
) {

signal = "CALL";
color = "GREEN";

}

else if (
score >= 65
) {

signal = "PUT";
color = "RED";

}

else {

signal = "NEUTRAL";
color = "YELLOW";

}


/* =====================================================
SIGNAL STRENGTH
===================================================== */

/*
* Strength describes how far the score has moved
* into the corresponding directional zone.
*/

let signalStrength = 0;

if (
signal === "CALL"
) {

signalStrength =
Math.round(
((35 - score) / 35) * 100
);

}

else if (
signal === "PUT"
) {

signalStrength =
Math.round(
((score - 65) / 35) * 100
);

}

else {

signalStrength =
Math.round(
100 -
(
Math.abs(score - 50) * 2
)
);

}

signalStrength =
clamp(
signalStrength
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

prolongedBearRegime ||

bearishPersistence

);


/* =====================================================
LEADERSHIP
===================================================== */

const narrowLeadership = (

Number(rotation?.rsGrowth ?? 1) > 1.03 &&

Number(rotation?.rsSmall ?? 1) < 0.995 &&

Number(rotation?.rsEqual ?? 1) < 0.995

);


/* =====================================================
MODE
===================================================== */

/*
* IMPORTANT:
*
* Mode is NOT the Master Score.
*
* Master Score = risk intensity
* Mode = trading posture
*
* Both are deliberately independent.
*/

let mode:
| "LONG"
| "NEUTRAL"
| "RISK"
| "CRASH";

mode = "LONG";


/*
* Distribution.
*/

if (
phase === "PHASE_3_DISTRIBUTION"
) {

mode = "NEUTRAL";

}


/*
* Risk.
*/

if (
phase === "PHASE_4_RISK"
) {

mode = "RISK";

}


/*
* Crash phases.
*/

if (
phase === "PHASE_5_BREAKDOWN" ||
phase === "PHASE_6_ACCELERATION" ||
phase === "PHASE_7_CAPITULATION"
) {

mode = "CRASH";

}


/*
* Strong structural deterioration can promote
* an earlier phase into RISK.
*/

if (
prolongedBearRegime &&
broadParticipationFailure
) {

mode = "RISK";

}


/*
* Accelerating breadth weakness combined with
* rising crash risk confirms defensive posture.
*/

if (
acceleratingBreadthDecay &&
risingCrashRisk
) {

mode = "RISK";

}


/*
* Persistent bearish regime can promote LONG
* into RISK when distribution risk is significant.
*/

if (
bearishPersistence &&
distributionRisk >= 60 &&
mode === "LONG"
) {

mode = "RISK";

}


/*
* Execution layer may force defensive posture.
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
* Do NOT downgrade RISK/CRASH because of
* narrow leadership.
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
"Neutral institutional market quality";


if (
signal === "CALL"
) {

summary =
"Constructive market regime | CALL bias";

}


if (
signal === "NEUTRAL"
) {

summary =
"Balanced market regime | NEUTRAL bias";

}


if (
signal === "PUT"
) {

summary =
"Defensive market regime | PUT bias";

}


if (
mode === "CRASH"
) {

summary +=
" | Crash regime active";

}


if (
bearishPersistence
) {

summary +=
" | Persistent weakness";

}


if (
falseRecoveryRisk >= 50
) {

summary +=
" | False recovery risk elevated";

}


/* =====================================================
RETURN
===================================================== */

return {

score,

/*
* SINGLE SOURCE OF TRUTH FOR USER INTERFACE
*/

signal,

color,

signalStrength,

/*
* Trading posture.
*/

mode,

netExposure,

regime,

summary,


/* ===================================================
META
=================================================== */

meta: {

/*
* Master semantics
*/

scoreType:
"RISK",

scoreInterpretation:
"LOW=CALL | HIGH=PUT",

callThreshold:
35,

neutralLowerThreshold:
36,

neutralUpperThreshold:
64,

putThreshold:
65,

signal,
color,
signalStrength,


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
* Regime persistence
*/

persistenceScore,
distributionRisk,
falseRecoveryRisk,
marketFatigue,

bearishPersistence,
bullishPersistence,
persistenceTrend,


/*
* Diagnostics
*/

phaseAdjustment,

persistenceAdjustment,

warningAdjustment,

executionAdjustment,

currentQuality:
Math.round(
currentMarketRisk
),

structuralQuality:
Math.round(
structuralRisk
),

historicalQuality:
Math.round(
historicalRisk
),

crashRisk:
Math.round(
crashRisk
),

timingRisk:
Math.round(
timingRiskScore
)

},


/* ===================================================
RISK-ORIENTED COMPONENTS
=================================================== */

/*
* ALL components use exactly the same semantics:
*
* HIGH = RISK / PUT
* LOW = CONSTRUCTIVE / CALL
*
* The panel must display these values directly.
*
* DO NOT invert them in the UI.
*/

components: {

crash:
Math.round(
crashRisk
),

rotation:
Math.round(
rotationRisk
),

priceMomentum:
Math.round(
priceMomentumRisk
),

timing:
Math.round(
timingRiskScore
),

russell:
Math.round(
russellRisk
),

participation:
Math.round(
participationRisk
),

breadthThrust:
Math.round(
thrustRisk
),

breadthVelocity:
Math.round(
breadthVelocityRisk
),

rotationDecay:
Math.round(
rotationDecayRisk
),

liquidity:
Math.round(
liquidityRisk
),

marketQuality:
Math.round(
marketQualityRisk
),

fragility:
Math.round(
fragilityRisk
),

regimeSync:
Math.round(
regimeSyncRisk
),

dangerZone:
Math.round(
dangerRisk
),

/*
* Persistence components.
*
* These are also risk-oriented.
*/

regimePersistence:
Math.round(
clamp(
persistenceScore
)
),

distributionRisk:
Math.round(
clamp(
distributionRisk
)
),

falseRecoveryRisk:
Math.round(
clamp(
falseRecoveryRisk
)
),

marketFatigue:
Math.round(
clamp(
marketFatigue
)
)

}

};

}
