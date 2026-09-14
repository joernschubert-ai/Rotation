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
* LOW SCORE -> GREEN -> CALL
* HIGH SCORE -> RED -> PUT
*
* ALL component scores use the same semantic:
*
* LOW = constructive / CALL
* HIGH = risk / PUT
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


/*
* BLOCKED / NO_TRADE Russell does NOT mean
* maximum risk.
*
* It means that Russell provides no usable
* directional information.
*/

const russellBlocked =
russell?.state === "BLOCKED" ||
russell?.decision === "NO_TRADE" ||
russell?.action === "NO_TRADE";

const russellScore =
russellBlocked
? 50
: Number(
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
phaseConfirmation?.confidence ??
50
);

const phaseConfirmed =
Boolean(
phaseConfirmation?.confirmed ??
false
);


/*
* CENTRAL PHASE FLAGS
*
* These flags are used throughout the Master Score.
*
* P3 = distribution / transition
* P5-P7 = hard crash regime
*/

const distributionPhase =
phase === "PHASE_3_DISTRIBUTION";

const crashPhase =
phase === "PHASE_5_BREAKDOWN" ||
phase === "PHASE_6_ACCELERATION" ||
phase === "PHASE_7_CAPITULATION";


const participationScore =
Number(
participation?.score ??
50
);

const thrustScore =
Number(
breadthThrust?.score ??
50
);

const liquidityScore =
Number(
liquidity?.score ??
50
);

const fragilityScore =
Number(
fragility?.score ??
50
);

const rotationDecayScore =
Number(
rotationDecay?.score ??
0
);

const marketQualityScore =
Number(
marketQuality?.score ??
50
);

const breadthVelocityScore =
Number(
breadthVelocity?.score ??
50
);

const regimeSyncScore =
Number(
regimeSync?.score ??
50
);

const dangerScore =
Number(
dangerZone?.score ??
0
);


/* =====================================================
REGIME PERSISTENCE
===================================================== */

const persistenceScore =
Number(
regimePersistence?.score ??
0
);

const distributionRisk =
Number(
regimePersistence?.distributionRisk ??
0
);

const falseRecoveryRisk =
Number(
regimePersistence?.falseRecoveryRisk ??
0
);

const marketFatigue =
Number(
regimePersistence?.marketFatigue ??
0
);

const bearishPersistence =
Boolean(
regimePersistence?.bearishPersistence ??
false
);

const bullishPersistence =
Boolean(
regimePersistence?.bullishPersistence ??
false
);

const persistenceTrend =
regimePersistence?.trend ??
"STABLE";


/* =====================================================
PRICE MOMENTUM
===================================================== */

const priceMomentumScore =
Number(
priceMomentum?.score ??
50
);

const priceMomentumTrend =
priceMomentum?.trend ??
priceMomentum?.direction ??
"NEUTRAL";

const priceMomentumAcceleration =
Number(
priceMomentum?.acceleration ??
0
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
* PutTiming uses a 0..24 scale.
*
* 0 = no PUT timing pressure
* 24 = maximum PUT timing pressure
*/

const timingRisk =
clamp(
(timingRaw / 24) * 100
);

const timingRiskScore =
timingRisk;


/* =====================================================
RISK COMPONENTS
===================================================== */

/*
* CRASH
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
*/

const rotationRisk =
riskFromConstructive(
rotationScore
);


/*
* RUSSELL
*
* BLOCKED remains neutral.
*/

const russellRisk =
russellBlocked
? 50
: riskFromConstructive(
russellScore
);


/*
* PARTICIPATION
*/

const participationRisk =
riskFromConstructive(
participationScore
);


/*
* BREADTH THRUST
*/

const thrustRisk =
riskFromConstructive(
thrustScore
);


/*
* BREADTH VELOCITY
*
* HIGH = deterioration
* LOW = healthy / stable
*
* Already risk-oriented.
*/

const breadthVelocityRisk =
clamp(
breadthVelocityScore
);


/*
* LIQUIDITY
*/

const liquidityRisk =
riskFromConstructive(
liquidityScore
);


/*
* FRAGILITY
*
* Already risk-oriented.
*/

const fragilityRisk =
clamp(
fragilityScore
);


/*
* ROTATION DECAY
*
* Already risk-oriented.
*/

const rotationDecayRisk =
clamp(
rotationDecayScore
);


/*
* MARKET QUALITY
*/

const marketQualityRisk =
riskFromConstructive(
marketQualityScore
);


/*
* REGIME SYNC
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

const historicalFragilityRisk =
historicalFragility;


/*
* Historical risk remains deliberately small.
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
weight: 0.13
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
},
{
value: timingRiskScore,
weight: 0.03
}
]);


/* =====================================================
BASE MASTER RISK
===================================================== */

let score =
weightedAverage([
{
value: currentMarketRisk,
weight: 0.70
},
{
value: structuralRisk,
weight: 0.20
},
{
value: historicalRisk,
weight: 0.05
},
{
value: crashRisk,
weight: 0.05
}
]);


/* =====================================================
PHASE ADJUSTMENT
===================================================== */

let phaseAdjustment = 0;

switch (phase) {

case "PHASE_1_EXPANSION":

phaseAdjustment = -4;

break;

case "PHASE_2_WARNING":

phaseAdjustment = +2;

break;

case "PHASE_3_DISTRIBUTION":

phaseAdjustment = +4;

break;

case "PHASE_4_RISK":

phaseAdjustment = +5;

break;

case "PHASE_5_BREAKDOWN":

phaseAdjustment = +8;

break;

case "PHASE_6_ACCELERATION":

phaseAdjustment = +10;

break;

case "PHASE_7_CAPITULATION":

phaseAdjustment = +5;

break;

default:

phaseAdjustment = 0;

}


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

score =
50 +
(score - 50) * 0.75;

}

score +=
phaseAdjustment;


/* =====================================================
REGIME PERSISTENCE OVERLAY
===================================================== */

let persistenceAdjustment = 0;


/*
* Distribution risk.
*/

persistenceAdjustment +=
clamp(
distributionRisk
) * 0.04;


/*
* False recovery risk.
*/

persistenceAdjustment +=
clamp(
falseRecoveryRisk
) * 0.03;


/*
* Market fatigue.
*/

persistenceAdjustment +=
clamp(
marketFatigue
) * 0.02;


/*
* Explicit bearish persistence.
*/

if (
bearishPersistence
) {

persistenceAdjustment += 1;

}


/*
* Persistent distribution history.
*/

if (
historyPersistentDistribution
) {

persistenceAdjustment += 1;

}


/*
* Prolonged bear regime.
*/

if (
prolongedBearRegime
) {

persistenceAdjustment += 1;

}


/*
* Improving persistence reduces risk slightly.
*/

if (
bullishPersistence &&
persistenceTrend === "IMPROVING"
) {

persistenceAdjustment -= 3;

}


persistenceAdjustment =
clamp(
persistenceAdjustment,
-5,
8
);

score +=
persistenceAdjustment;


/* =====================================================
STRUCTURAL WARNING ADJUSTMENTS
===================================================== */

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
Boolean(
prolongedBearRegime
);


if (
deterioratingBreadth
) {

warningAdjustment += 1;

}

if (
acceleratingBreadthDecay
) {

warningAdjustment += 1;

}

if (
leadershipConcentration
) {

warningAdjustment += 1;

}

if (
risingCrashRisk
) {

warningAdjustment += 1;

}

if (
broadParticipationFailure
) {

warningAdjustment += 1;

}

if (
prolongedBearHistory &&
Number(institutionalPressure) > 70
) {

warningAdjustment += 1;

}

if (
Number(phasePersistence) >= 85
) {

warningAdjustment += 1;

}

if (
historyPersistentDistribution
) {

warningAdjustment += 1;

}

if (
Boolean(acceleratingWeakness)
) {

warningAdjustment += 1;

}


warningAdjustment =
clamp(
warningAdjustment,
0,
6
);

score +=
warningAdjustment;


/* =====================================================
EXECUTION ADJUSTMENT
===================================================== */

let executionAdjustment = 0;

if (
marketMode === "RISK_OFF"
) {

executionAdjustment += 2;

}

if (
riskState === "BREAKDOWN"
) {

executionAdjustment += 3;

}

if (
executionMode === "REDUCE_RISK"
) {

executionAdjustment += 2;

}

executionAdjustment =
clamp(
executionAdjustment,
0,
6
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
* STANDARD SIGNAL THRESHOLDS:
*
* 0..35 = CALL
* 36..64 = NEUTRAL
* 65..100 = PUT
*
*
* DISTRIBUTION OVERRIDE:
*
* P3 represents structural distribution / transition.
*
* Therefore a P3 risk score of 65..74 is deliberately
* NOT promoted to a directional PUT signal.
*
* P3 requires >=75 before the Master Signal becomes PUT.
*
* This preserves the distinction:
*
* P3 = structural warning
* P4 = active risk
* P5-P7 = crash
*
* The underlying risk score is NOT changed.
*/

const putThreshold =
distributionPhase
? 75
: 65;

const neutralUpperThreshold =
putThreshold - 1;


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
score >= putThreshold
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
(
(score - putThreshold) /
(100 - putThreshold)
) * 100
);

}

else {

signalStrength =
Math.round(
100 -
(
Math.abs(
score - 50
) * 2
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

breadthVelocityScore > 55 ||

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

Number(
rotation?.rsGrowth ?? 1
) > 1.03 &&

Number(
rotation?.rsSmall ?? 1
) < 0.995 &&

Number(
rotation?.rsEqual ?? 1
) < 0.995

);


/* =====================================================
DEFENSIVE STRUCTURAL CONFIRMATION
===================================================== */

const rotationBreakdown =
rotation?.signal === "RISK_OFF_ROTATION" ||
rotation?.state === "BREAKDOWN" ||
rotationScore <= 35;

const fragilityBreakdown =
fragilityScore >= 75;

const marketQualityBreakdown =
marketQuality?.state === "STRUCTURAL_BREAKDOWN" ||
marketQualityScore <= 35;

const weakParticipation =
participation?.state === "WEAK" ||
participationScore < 45;

const defensiveTiming =
putTiming?.decision === "DEFENSIVE_BUILD" ||
putTiming?.decision === "STRUCTURAL_BUILD" ||
timingRiskScore >= 65;

const defensiveEvidenceCount = [
rotationBreakdown,
fragilityBreakdown,
marketQualityBreakdown,
weakParticipation,
defensiveTiming,
prolongedBearRegime,
acceleratingWeakness
]
.filter(Boolean)
.length;


/*
* P3 requires the same minimum structural evidence
* as every other phase, but confirmation does NOT
* itself change P3 into RISK mode.
*/

const defensiveStructuralConfirmation =
score >= 65 &&
defensiveEvidenceCount >= 3;


/*
* Strong structure is a stronger confirmation layer.
*/

const strongDefensiveStructure =
score >= 75 &&
defensiveEvidenceCount >= 3;


/* =====================================================
MODE
===================================================== */

let mode:
| "LONG"
| "NEUTRAL"
| "RISK"
| "CRASH";

mode =
"LONG";


/*
* Distribution baseline.
*
* P3 is a transition regime.
*/

if (
distributionPhase
) {

mode =
"NEUTRAL";

}


/*
* Risk phase.
*/

if (
phase === "PHASE_4_RISK"
) {

mode =
"RISK";

}


/*
* Crash phases.
*
* P5-P7 are explicitly crash regimes.
*/

if (
crashPhase
) {

mode =
"CRASH";

}


/*
* Defensive structural confirmation.
*
* P3 is deliberately excluded.
*
* Crash phases are also excluded because they
* already have the hard CRASH classification.
*/

if (
defensiveStructuralConfirmation &&
!distributionPhase &&
!crashPhase
) {

mode =
"RISK";

}


/*
* Strong defensive structure.
*
* P3 remains NEUTRAL.
* P5-P7 remain CRASH.
*/

if (
strongDefensiveStructure &&
!distributionPhase &&
!crashPhase
) {

mode =
"RISK";

}


/*
* Prolonged bear confirmation.
*
* P3 cannot be promoted by this overlay.
* Crash phases cannot be downgraded.
*/

if (
prolongedBearRegime &&
institutionalPressure > 70 &&
score >= 65 &&
!distributionPhase &&
!crashPhase
) {

mode =
"RISK";

}


/*
* Accelerating weakness.
*
* P3 remains a distribution / transition state.
* Crash phases remain CRASH.
*/

if (
acceleratingWeakness &&
score >= 65 &&
!distributionPhase &&
!crashPhase
) {

mode =
"RISK";

}


/*
* Explicit execution override.
*
* Only LONG can be promoted by this layer.
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

mode =
"RISK";

}


/*
* Narrow leadership is diagnostic only.
*
* It may neutralize a P1 LONG state.
* It can never downgrade RISK or CRASH.
*/

if (
narrowLeadership &&
weakInternals &&
phase === "PHASE_1_EXPANSION" &&
mode === "LONG"
) {

mode =
"NEUTRAL";

}


/* =====================================================
FINAL MODE INVARIANTS
===================================================== */

/*
* HARD PHASE/MODE CONSISTENCY.
*
* These are final safety invariants.
*
* P5-P7 are crash phases.
*
* Nothing downstream is allowed to reinterpret
* them as ordinary RISK.
*/

if (
crashPhase
) {

mode =
"CRASH";

}


/*
* P3 is a distribution / transition phase.
*
* Nothing downstream is allowed to promote it
* to RISK or CRASH through the Master Mode layer.
*
* TradeStack and independent PUT timing may still
* identify a PUT opportunity separately.
*/

if (
distributionPhase
) {

mode =
"NEUTRAL";

}


/* =====================================================
FINAL SIGNAL/MODE CONSISTENCY
===================================================== */

/*
* P3 is a transition regime.
*
* A P3 score of 65..74 is deliberately NEUTRAL.
*
* The risk score itself remains unchanged.
*/

if (
distributionPhase &&
score < 75
) {

signal =
"NEUTRAL";

color =
"YELLOW";

signalStrength =
Math.round(
100 -
(
Math.abs(
score - 50
) * 2
)
);

signalStrength =
clamp(
signalStrength
);

}


/* =====================================================
NET EXPOSURE
===================================================== */

let netExposure = 0;

switch (mode) {

case "LONG":

netExposure =
40;

break;

case "NEUTRAL":

netExposure =
0;

break;

case "RISK":

netExposure =
-40;

break;

case "CRASH":

netExposure =
-85;

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

regime =
"LONG";


if (
distributionPhase &&
mode === "NEUTRAL"
) {

regime =
"TRANSITION";

}


if (
mode === "RISK"
) {

regime =
"RISK";

}


if (
mode === "CRASH"
) {

regime =
"CRASH";

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
mode === "RISK" &&
signal === "PUT"
) {

summary =
"Defensive structural regime | PUT bias";

}


if (
mode === "RISK" &&
signal === "NEUTRAL"
) {

summary =
"Defensive posture | structural risk elevated";

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

signal,

color,

signalStrength,

mode,

netExposure,

regime,

summary,


/* ===================================================
META
=================================================== */

meta: {

scoreType:
"RISK",

scoreInterpretation:
"LOW=CALL | HIGH=PUT",

callThreshold:
35,

neutralLowerThreshold:
36,

neutralUpperThreshold,

putThreshold,

signal,

color,

signalStrength,


/* Execution */

riskState,

marketMode,

executionMode,


/* Phase */

phaseConfirmed,

phaseConfidence,


/* Momentum */

priceMomentumScore,

priceMomentumTrend,

priceMomentumAcceleration,


/* Structural flags */

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


/* Regime persistence */

persistenceScore,

distributionRisk,

falseRecoveryRisk,

marketFatigue,

bearishPersistence,

bullishPersistence,

persistenceTrend,


/* Defensive confirmation */

defensiveEvidenceCount,

rotationBreakdown,

fragilityBreakdown,

marketQualityBreakdown,

weakParticipation,

defensiveTiming,

distributionPhase,

crashPhase,

defensiveStructuralConfirmation,

strongDefensiveStructure,

russellBlocked,


/* Diagnostics */

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
),

russellRisk:
Math.round(
russellRisk
)

},


/* ===================================================
RISK-ORIENTED COMPONENTS
=================================================== */

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


/* Persistence components */

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
