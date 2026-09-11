// /lib/engine/marketPhaseEngine.ts

export function marketPhaseEngine(engine: any) {

/* =====================================================
INPUT
===================================================== */

const master =
engine.master ?? {};

const crash =
engine.crash ?? {};

const rotation =
engine.rotation ?? {};

const earlyWarning =
engine.earlyWarning ?? {};

const structure =
engine.structure ?? {};

const russell =
engine.russell ?? {};

const breadthVelocity =
engine.breadthVelocity ?? {};

const internalDivergence =
engine.internalDivergence ?? {};

const regimePersistence =
engine.regimePersistence ?? {};


/* =====================================================
HISTORY METRICS
===================================================== */

const historyMetrics =
engine.historyMetrics ?? {};

const {
breadthTrend = 0,
breadthAcceleration = 0,
participationDecay = 0,
relativeBreadthWeakness = 0,
crashTrend = 0,
phasePersistence = 0,
daysInPhase = 0,
institutionalPressure = 0,
marketCharacter = "EXPANSION",
prolongedBearRegime = false,
acceleratingWeakness = false,
averageBreadth = 0,
averageParticipation = 0,
averageRotation = 0,
averageLiquidity = 0,
averageFragility = 0
} = historyMetrics;


/* =====================================================
SAFE INPUTS
===================================================== */

const masterScore =
Number(
master?.score ?? 0
);

const crashScore =
Number(
crash?.score ?? 0
);

const crashProbability =
Number(
crash?.probability ?? 0
);

const rotationScore =
Number(
rotation?.score ?? 0
);


/* =====================================================
EARLY WARNING
===================================================== */

const early =
Boolean(
earlyWarning?.active ?? false
);

const earlyScore =
Number(
earlyWarning?.score?.value ??
earlyWarning?.score ??
0
);


/* =====================================================
STRUCTURE
===================================================== */

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

const health =
Number(
structure?.health?.value ?? 0
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


/* =====================================================
BREADTH VELOCITY
===================================================== */

/*
* IMPORTANT:
*
* breadthVelocity.score is RISK-oriented:
*
* 0 = little deterioration
* 100 = severe deterioration
*
* Therefore HIGH values are dangerous.
*/

const breadthVelocityScore =
Number(
breadthVelocity?.score ?? 0
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


/* =====================================================
RUSSELL
===================================================== */

const russellDecision =
russell?.decision ??
"NONE";


/* =====================================================
ROTATION
===================================================== */

const rsSmall =
Number(
rotation?.rsSmall ?? 1
);

const rsGrowth =
Number(
rotation?.rsGrowth ?? 1
);

const rsEqual =
Number(
rotation?.rsEqual ?? 1
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
Boolean(
internalDivergence?.hiddenDistribution ??
false
);

const participationCollapse =
Boolean(
internalDivergence?.participationCollapse ??
false
);

const narrowLeadershipDivergence =
Boolean(
internalDivergence?.narrowLeadership ??
false
);


/* =====================================================
REGIME PERSISTENCE
===================================================== */

const persistenceScore =
Number(
regimePersistence?.score ?? 50
);

const persistenceState =
regimePersistence?.state ??
"NEUTRAL";

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

const regimeAge =
Number(
regimePersistence?.regimeAge ?? 0
);

const distributionRisk =
Number(
regimePersistence?.distributionRisk ?? 0
);

const recoveryQuality =
Number(
regimePersistence?.recoveryQuality ?? 0
);

const falseRecoveryRisk =
Number(
regimePersistence?.falseRecoveryRisk ?? 0
);

const trendStability =
Number(
regimePersistence?.trendStability ?? 50
);

const marketFatigue =
Number(
regimePersistence?.marketFatigue ?? 0
);


/* =====================================================
PERSISTENCE FLAGS
===================================================== */

const persistentWeakness =
bearishPersistence &&
persistenceScore >= 60;

const severePersistentWeakness =
bearishPersistence &&
persistenceScore >= 75;


/* =====================================================
HISTORY FLAGS
===================================================== */

const deterioratingBreadth =
breadthTrend < -10;

const acceleratingBreadthDecay =
breadthAcceleration < -5;

const participationErosion =
participationDecay > 10;

const severeParticipationErosion =
participationDecay > 20;

const risingCrashRisk =
crashTrend > 5;

const severeRisingCrashRisk =
crashTrend > 10;

const prolongedDistribution =
phasePersistence >= 6;

const prolongedBearHistory =
Boolean(
prolongedBearRegime
);

const severeBearRegime =
prolongedBearRegime &&
institutionalPressure > 75;

const broadParticipationFailure =
relativeBreadthWeakness > 10;

const severeParticipationFailure =
relativeBreadthWeakness > 20;


/* =====================================================
STRUCTURAL DETERIORATION
===================================================== */

const structuralDeterioration =
(
deterioratingBreadth &&
participationErosion
) ||
(
acceleratingBreadthDecay &&
risingCrashRisk
) ||
(
broadParticipationFailure &&
participationErosion
) ||
(
prolongedBearRegime &&
deterioratingBreadth
);


/* =====================================================
BREADTH FLAGS
===================================================== */

/*
* Expansion should not require perfect breadth.
*
* strongBreadth = clearly constructive
* mediumBreadth = constructive but not perfect
* weakBreadth = structurally weak
*/

const strongBreadth =
breadth50 >= 75 &&
breadth200 >= 65;

const mediumBreadth =
breadth50 >= 60 &&
breadth200 >= 50;

const weakBreadth =
breadth50 < 50 ||
breadth200 < 45;


/* =====================================================
INTERNALS
===================================================== */

const weakInternals =
ad <= 0;

const severeInternalWeakness =
ad < 0 &&
highs < lows &&
breadth50 < 58;

const healthyInternals =
ad > 0 &&
highs >= lows;


/* =====================================================
ROTATION FLAGS
===================================================== */

const rotationActive =
[
"BUILD",
"ADD",
"AGGRESSIVE"
].includes(
russellDecision
);

const narrowLeadership =
rsGrowth > 1.05 &&
rsSmall < 0.97 &&
rsEqual < 0.97;

const severeNarrowLeadership =
rsSmall < 0.94 &&
rsEqual < 0.94;

const broadParticipation =
rsSmall > 1 &&
rsEqual > 1 &&
breadth50 > 65;

const rotationalWeakness =
rsSmall < 0.98 ||
rsEqual < 0.98;


/* =====================================================
TRANSITION FLAGS
===================================================== */

const equalWeightWeakness =
rsEqual < 0.985;

const smallCapWeakness =
rsSmall < 0.985;


/* =====================================================
BREADTH MOMENTUM
===================================================== */

const breadthMomentumLoss =
velocity20 < 0 &&
velocity50 < 0;

const aggressiveBreadthMomentumLoss =
velocity20 < -4 &&
velocity50 < -3;


/*
* CORRECTED SEMANTICS
*
* breadthVelocity.score:
* HIGH = deterioration
*
* Therefore:
*
* >55 = deterioration
* >70 = severe deterioration
*/

const breadthImpulseBreak =
breadthVelocityScore > 55;

const severeBreadthImpulseBreak =
breadthVelocityScore > 70;


/* =====================================================
EARLY DISTRIBUTION
===================================================== */

const earlyDistributionDynamics =
breadthMomentumLoss &&
(
narrowLeadership ||
rotationalWeakness
);


/* =====================================================
HIDDEN DISTRIBUTION
===================================================== */

const hiddenInstitutionalDistribution =
hiddenDistribution &&
(
divergenceSeverity >= 35 ||
participationCollapse
);

const severeHiddenDistribution =
hiddenDistribution &&
divergenceSeverity >= 50 &&
participationCollapse;


/* =====================================================
PERSISTENT DISTRIBUTION
===================================================== */

const persistentDistribution =
persistentWeakness &&
(
hiddenInstitutionalDistribution ||
breadthMomentumLoss ||
weakInternals
);

const severePersistentDistribution =
severePersistentWeakness &&
(
severeHiddenDistribution ||
aggressiveBreadthMomentumLoss
);


/* =====================================================
COMBINED STRUCTURAL RISK
===================================================== */

/*
* Count independent deterioration signals.
*
* This prevents a single noisy metric from
* automatically forcing PHASE_4_RISK.
*/

let structuralRiskCount = 0;

if (
deterioratingBreadth
) {
structuralRiskCount++;
}

if (
acceleratingBreadthDecay
) {
structuralRiskCount++;
}

if (
participationErosion
) {
structuralRiskCount++;
}

if (
rotationalWeakness
) {
structuralRiskCount++;
}

if (
weakInternals
) {
structuralRiskCount++;
}

if (
breadthImpulseBreak
) {
structuralRiskCount++;
}

if (
hiddenInstitutionalDistribution
) {
structuralRiskCount++;
}

if (
persistentWeakness
) {
structuralRiskCount++;
}

if (
broadParticipationFailure
) {
structuralRiskCount++;
}


/*
* Strong structural deterioration.
*/

const strongStructuralDeterioration =
structuralRiskCount >= 3;


/*
* Moderate structural deterioration.
*/

const moderateStructuralDeterioration =
structuralRiskCount >= 2;


/* =====================================================
PHASE INITIALIZATION
===================================================== */

let primaryPhase =
"PHASE_1_EXPANSION";

let regimeState =
"RISK_ON";

let subPhase =
"HEALTHY_EXPANSION";

let confidence =
50;


/* =====================================================
PHASE PRESSURE SYSTEM
===================================================== */

let phasePressure =
"STABLE";

let secondaryPhase =
"PHASE_1_EXPANSION";

let phaseDirection =
"NEUTRAL";

let phaseProgression =
0;


/* =====================================================
PHASE 7 — CAPITULATION
===================================================== */

if (
crashScore > 85
) {

primaryPhase =
"PHASE_7_CAPITULATION";

regimeState =
"CAPITULATION";

subPhase =
"FORCED_LIQUIDATION";

confidence =
95;

}


/* =====================================================
PHASE 6 — ACCELERATION
===================================================== */

else if (
crashScore > 75
) {

primaryPhase =
"PHASE_6_ACCELERATION";

regimeState =
"CRISIS";

subPhase =
"LIQUIDITY_BREAK";

confidence =
90;

}


/* =====================================================
PHASE 5 — BREAKDOWN
===================================================== */

else if (
crashScore > 65
) {

primaryPhase =
"PHASE_5_BREAKDOWN";

regimeState =
"RISK_OFF";

subPhase =
"STRUCTURAL_BREAKDOWN";

confidence =
85;

}


/* =====================================================
PHASE 4 — RISK
===================================================== */

/*
* PHASE_4 requires either:
*
* 1. genuinely severe deterioration
* 2. several independent structural failures
* 3. strong persistent structural weakness
* 4. a major crash warning
*
* A single distribution/fatigue score is no longer
* sufficient.
*/

else if (

severePersistentDistribution ||

(
severeBearRegime &&
severeParticipationFailure
) ||

(
participationCollapse &&
hiddenInstitutionalDistribution &&
breadth50 < 55
) ||

(
strongStructuralDeterioration &&
(
distributionRisk >= 55 ||
falseRecoveryRisk >= 60 ||
marketFatigue >= 60
)
) ||

(
moderateStructuralDeterioration &&
(
persistentWeakness ||
hiddenInstitutionalDistribution ||
falseRecoveryRisk >= 75
)
) ||

(
severeBreadthImpulseBreak &&
(
weakInternals ||
participationErosion ||
rotationalWeakness
)
) ||

(
crashScore > 55 &&
(
weakInternals ||
weakBreadth ||
participationErosion ||
rotationalWeakness
)
) ||

(
structuralDeterioration &&
(
participationCollapse ||
severeInternalWeakness ||
severeParticipationFailure
)
)

) {

primaryPhase =
"PHASE_4_RISK";

regimeState =
"FRAGILE";


/* -----------------------------------------------
PRE CRASH
----------------------------------------------- */

if (

severePersistentDistribution ||

(
participationCollapse &&
hiddenInstitutionalDistribution &&
breadth50 < 55
) ||

(
aggressiveBreadthMomentumLoss &&
severeBreadthImpulseBreak
) ||

crashScore > 62 ||

(
severeBearRegime &&
severeParticipationFailure
)

) {

subPhase =
"PRE_CRASH_TRANSITION";

confidence =
90;

}


/* -----------------------------------------------
INTERNAL DISTRIBUTION
----------------------------------------------- */

else if (

(
narrowLeadership &&
rotationalWeakness
) ||

(
equalWeightWeakness &&
smallCapWeakness
) ||

(
breadthMomentumLoss &&
weakInternals
) ||

(
breadthImpulseBreak &&
rotationScore < 50
) ||

persistentDistribution

) {

subPhase =
"INTERNAL_DISTRIBUTION";

confidence =
84;

}


/* -----------------------------------------------
LIQUIDITY TRAP
----------------------------------------------- */

else if (

narrowLeadership &&
strongBreadth &&
health > 65 &&
breadth50 > 60 &&
rotationScore < 52 &&
!healthyInternals

) {

subPhase =
"PASSIVE_LIQUIDITY_TRAP";

confidence =
73;

}


/* -----------------------------------------------
ROTATION BREAKDOWN
----------------------------------------------- */

else if (

rotationScore < 45 &&
(
rsSmall < 0.97 ||
rsEqual < 0.97
)

) {

subPhase =
"ROTATIONAL_BREAKDOWN";

confidence =
78;

}


/* -----------------------------------------------
DEFAULT
----------------------------------------------- */

else {

subPhase =
"HEALTHY_PULLBACK";

confidence =
64;

}

}


/* =====================================================
PHASE 3 — DISTRIBUTION
===================================================== */

/*
* Distribution is now a transitional regime.
*
* It requires actual structural evidence.
*
* Persistence values alone are not enough.
*/

else if (

(
early &&
(
earlyDistributionDynamics ||
hiddenInstitutionalDistribution ||
(
weakInternals &&
(
weakBreadth ||
rotationalWeakness
)
)
)
) ||

persistentDistribution ||

hiddenInstitutionalDistribution ||

(
distributionRisk > 65 &&
(
moderateStructuralDeterioration ||
narrowLeadership ||
weakBreadth
)
) ||

(
marketFatigue > 70 &&
(
moderateStructuralDeterioration ||
persistentWeakness
)
) ||

(
breadthMomentumLoss &&
(
narrowLeadership ||
rotationalWeakness ||
weakInternals
)
) ||

(
narrowLeadershipDivergence &&
(
divergenceSeverity >= 35 ||
hiddenDistribution
)
)

) {

primaryPhase =
"PHASE_3_DISTRIBUTION";

regimeState =
"TRANSITION";


if (
persistentDistribution &&
hiddenInstitutionalDistribution
) {

subPhase =
"PERSISTENT_HIDDEN_DISTRIBUTION";

confidence =
86;

}

else if (
breadthMomentumLoss &&
narrowLeadership
) {

subPhase =
"EARLY_INSTITUTIONAL_DISTRIBUTION";

confidence =
80;

}

else {

subPhase =
"EARLY_DISTRIBUTION";

confidence =
72;

}

}


/* =====================================================
PHASE 2 — WARNING
===================================================== */

/*
* Warning is allowed even when breadth is not perfect.
*/

else if (

(
early &&
(
mediumBreadth ||
strongBreadth
) &&
!moderateStructuralDeterioration
) ||

(
rotationActive &&
rotationScore >= 40 &&
crashScore < 30 &&
!persistentWeakness &&
trendStability > 60 &&
recoveryQuality > 55
) ||

(
mediumBreadth &&
(
breadthMomentumLoss ||
narrowLeadership
)
)

) {

primaryPhase =
"PHASE_2_WARNING";

regimeState =
"LATE_EXPANSION";


if (
breadthMomentumLoss ||
persistentWeakness
) {

subPhase =
"ROLLING_OVER_BREADTH";

confidence =
80;

}

else if (
rotationActive
) {

subPhase =
"ROTATIONAL_EXPANSION";

confidence =
72;

}

else {

subPhase =
"LATE_EXPANSION";

confidence =
75;

}

}


/* =====================================================
PHASE 1 — CLEAN EXPANSION
===================================================== */

/*
* Expansion should represent a genuinely constructive
* market, not necessarily a perfect one.
*/

else if (

(
strongBreadth ||
(
mediumBreadth &&
healthyInternals
)
) &&

!early &&

crashScore < 30 &&

!breadthMomentumLoss &&

!persistentWeakness &&

!hiddenInstitutionalDistribution &&

!moderateStructuralDeterioration

) {

primaryPhase =
"PHASE_1_EXPANSION";

regimeState =
"RISK_ON";


if (

broadParticipation &&
health > 75 &&
breadthVelocityScore < 35 &&
bullishPersistence

) {

subPhase =
"INSTITUTIONAL_EXPANSION";

confidence =
88;

}

else if (
narrowLeadership
) {

subPhase =
"AI_MELTUP";

confidence =
72;

}

else {

subPhase =
"HEALTHY_EXPANSION";

confidence =
70;

}

}


/* =====================================================
FALLBACK
===================================================== */

/*
* Important:
*
* If the market is not clearly dangerous and no strong
* distribution structure exists, default to WARNING,
* not DISTRIBUTION.
*/

else {

primaryPhase =
persistentWeakness
? "PHASE_3_DISTRIBUTION"
: "PHASE_2_WARNING";

regimeState =
persistentWeakness
? "TRANSITION"
: "LATE_EXPANSION";

subPhase =
persistentWeakness
? "PERSISTENT_TRANSITION"
: "TRANSITION";

confidence =
persistentWeakness
? 68
: 50;

}


/* =====================================================
ANTI SNAPBACK FILTER
===================================================== */

if (

(
persistentWeakness ||
persistentDistribution ||
structuralDeterioration
) &&

primaryPhase ===
"PHASE_1_EXPANSION"

) {

primaryPhase =
"PHASE_2_WARNING";

regimeState =
"LATE_EXPANSION";

subPhase =
"PERSISTENT_INTERNAL_WEAKNESS";

confidence =
Math.min(
confidence,
68
);

}


/* =====================================================
PHASE PRESSURE CALCULATION
===================================================== */

const phaseNumber =
Number(
primaryPhase
.replace(
"PHASE_",
""
)
.split("_")[0]
);


/* =====================================================
DOWNSIDE PRESSURE
===================================================== */

const downsidePressure =

(crashScore * 0.30) +

(distributionRisk * 0.15) +

(falseRecoveryRisk * 0.10) +

(marketFatigue * 0.10) +

(persistentWeakness ? 15 : 0) +

(persistentDistribution ? 15 : 0) +

(structuralDeterioration ? 15 : 0) +

(aggressiveBreadthMomentumLoss ? 10 : 0) +

(participationCollapse ? 15 : 0);


/* =====================================================
UPSIDE PRESSURE
===================================================== */

const upsidePressure =

(recoveryQuality * 0.20) +

(trendStability * 0.20) +

(bullishPersistence ? 20 : 0) +

(broadParticipation ? 15 : 0) +

/*
* CORRECTED BREADTH VELOCITY SEMANTICS
*
* Low deterioration = constructive.
*/

(
breadthVelocityScore < 35
? 15
: 0
) +

(health > 70 ? 10 : 0);


/* =====================================================
PRESSURE DIFFERENCE
===================================================== */

const pressureDelta =
downsidePressure -
upsidePressure;


/* =====================================================
PHASE DIRECTION
===================================================== */

if (
pressureDelta > 25
) {

phaseDirection =
"DETERIORATING";

}

else if (
pressureDelta > 10
) {

phaseDirection =
"WEAKENING";

}

else if (
pressureDelta < -25
) {

phaseDirection =
"RECOVERING";

}

else if (
pressureDelta < -10
) {

phaseDirection =
"STABILIZING";

}

else {

phaseDirection =
"STABLE";

}


/* =====================================================
SECONDARY PHASE
===================================================== */

const phaseMap:
Record<number, string> = {

1:
"PHASE_1_EXPANSION",

2:
"PHASE_2_WARNING",

3:
"PHASE_3_DISTRIBUTION",

4:
"PHASE_4_RISK",

5:
"PHASE_5_BREAKDOWN",

6:
"PHASE_6_ACCELERATION",

7:
"PHASE_7_CAPITULATION"

};


if (

phaseDirection ===
"DETERIORATING" ||

phaseDirection ===
"WEAKENING"

) {

secondaryPhase =
phaseMap[
Math.min(
7,
phaseNumber + 1
)
];

}

else if (

phaseDirection ===
"RECOVERING" ||

phaseDirection ===
"STABILIZING"

) {

secondaryPhase =
phaseMap[
Math.max(
1,
phaseNumber - 1
)
];

}

else {

secondaryPhase =
primaryPhase;

}


/* =====================================================
PHASE PRESSURE LABEL
===================================================== */

if (
phaseDirection ===
"DETERIORATING"
) {

phasePressure =
"STRONG DOWNWARD PRESSURE";

}

else if (
phaseDirection ===
"WEAKENING"
) {

phasePressure =
"DOWNWARD PRESSURE";

}

else if (
phaseDirection ===
"RECOVERING"
) {

phasePressure =
"STRONG RECOVERY PRESSURE";

}

else if (
phaseDirection ===
"STABILIZING"
) {

phasePressure =
"RECOVERY PRESSURE";

}

else {

phasePressure =
"STABLE";

}


/* =====================================================
PHASE PROGRESSION
===================================================== */

let progressionBase =
50;


/* -----------------------------------------------
DOWNSIDE
----------------------------------------------- */

if (
phaseDirection ===
"DETERIORATING"
) {

progressionBase =
Math.min(
100,
60 +
Math.max(
0,
pressureDelta
)
);

}


/* -----------------------------------------------
WEAKENING
----------------------------------------------- */

else if (
phaseDirection ===
"WEAKENING"
) {

progressionBase =
Math.min(
75,
50 +
Math.max(
0,
pressureDelta
)
);

}


/* -----------------------------------------------
RECOVERY
----------------------------------------------- */

else if (
phaseDirection ===
"RECOVERING"
) {

progressionBase =
Math.max(
0,
40 +
pressureDelta
);

}


/* -----------------------------------------------
STABLE
----------------------------------------------- */

else {

progressionBase =
50;

}


phaseProgression =
Math.round(
Math.max(
0,
Math.min(
100,
progressionBase
)
)
);


/* =====================================================
PHASE OUTPUT
===================================================== */

return {

/* =================================================
COMPATIBILITY
================================================= */

phase:
primaryPhase,


/* =================================================
PHASE STRUCTURE
================================================= */

primaryPhase,

secondaryPhase,

phasePressure,

phaseDirection,

phaseProgression,


/* =================================================
REGIME
================================================= */

regimeState,

subPhase,

confidence,


/* =================================================
DRIVERS
================================================= */

drivers: {

masterScore,

crashScore,

crashProbability,

rotationScore,

breadth20,

breadth50,

breadth200,

breadthVelocityScore,

velocity20,

velocity50,

velocityState,

health,

ad,

highs,

lows,

rsSmall,

rsGrowth,

rsEqual,

strongBreadth,

mediumBreadth,

weakBreadth,

breadthMomentumLoss,

aggressiveBreadthMomentumLoss,

breadthImpulseBreak,

severeBreadthImpulseBreak,

weakInternals,

healthyInternals,

narrowLeadership,

severeNarrowLeadership,

broadParticipation,

rotationActive,

earlyWarning:
early,

earlyScore,

russellDecision,

persistenceScore,

persistenceState,

bearishPersistence,

bullishPersistence,

persistenceTrend,

divergenceSeverity,

divergenceState,

hiddenDistribution,

participationCollapse,

narrowLeadershipDivergence,

persistentWeakness,

severePersistentWeakness,

persistentDistribution,

severePersistentDistribution,

equalWeightWeakness,

smallCapWeakness,

breadthTrend,

breadthAcceleration,

participationDecay,

crashTrend,

phasePersistence,

regimeAge,

relativeBreadthWeakness,

prolongedBearRegime,

severeBearRegime,

broadParticipationFailure,

severeParticipationFailure,

deterioratingBreadth,

acceleratingBreadthDecay,

participationErosion,

severeParticipationErosion,

risingCrashRisk,

severeRisingCrashRisk,

prolongedDistribution,

structuralDeterioration,

distributionRisk,

recoveryQuality,

falseRecoveryRisk,

trendStability,

marketFatigue,

averageBreadth,

averageParticipation,

averageRotation,

averageLiquidity,

averageFragility,

daysInPhase,

institutionalPressure,

marketCharacter,

/*
* NEW DIAGNOSTIC
*/

structuralRiskCount,

moderateStructuralDeterioration,

strongStructuralDeterioration,

/*
* PRESSURE
*/

downsidePressure,

upsidePressure,

pressureDelta

}

};

}
