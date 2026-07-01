// /lib/engine/marketPhaseEngine.ts

export function marketPhaseEngine(engine: any) {

/* =====================================================
INPUT
===================================================== */

const master = engine.master ?? {};
const crash = engine.crash ?? {};
const rotation = engine.rotation ?? {};
const earlyWarning = engine.earlyWarning ?? {};
const structure = engine.structure ?? {};
const russell = engine.russell ?? {};
const breadthVelocity =
engine.breadthVelocity ?? {};

/* ================= NEW ================= */

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
averageFragility = 0,

} = historyMetrics;


/* =====================================================
SAFE
===================================================== */

const masterScore =
Number(master.score ?? 0);

const crashScore =
Number(crash.score ?? 0);

const crashProbability =
Number(crash.probability ?? 0);

const rotationScore =
Number(rotation.score ?? 0);

const early =
earlyWarning?.active ?? false;

const earlyScore =
Number(
earlyWarning?.score?.value ??
earlyWarning?.score ??
0
);

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
NEW BREADTH VELOCITY INPUTS
===================================================== */

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

const russellDecision =
russell?.decision ?? "NONE";

/* =====================================================
ROTATION INPUTS
===================================================== */

const rsSmall =
Number(rotation?.rsSmall ?? 1);

const rsGrowth =
Number(rotation?.rsGrowth ?? 1);

const rsEqual =
Number(rotation?.rsEqual ?? 1);

/* =====================================================
NEW INTERNAL DIVERGENCE
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

const narrowLeadershipDivergence =
internalDivergence?.narrowLeadership ??
false;

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
regimePersistence?.bearishPersistence ??
false;

const bullishPersistence =
regimePersistence?.bullishPersistence ??
false;

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

const persistentWeakness =
(
bearishPersistence &&
persistenceScore >= 60
);

const severePersistentWeakness =
(
bearishPersistence &&
persistenceScore >= 75
);

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
prolongedBearRegime;

const severeBearRegime =

prolongedBearRegime &&

institutionalPressure > 75;

const broadParticipationFailure =
relativeBreadthWeakness > 10;

const severeParticipationFailure =
relativeBreadthWeakness > 20;

const structuralDeterioration =

(
deterioratingBreadth &&
participationErosion
)

||

(
acceleratingBreadthDecay &&
risingCrashRisk
)

||

(
broadParticipationFailure &&
participationErosion
)

||

(
prolongedBearRegime &&
deterioratingBreadth
);



/* =====================================================
FLAGS
===================================================== */

const strongBreadth =
breadth50 > 80 &&
breadth200 > 70;

const mediumBreadth =
breadth50 > 65 &&
breadth200 > 55;

const weakBreadth =
breadth50 < 50 ||
breadth200 < 45;

const extremeBreadth =
breadth50 > 90;

const weakInternals =
ad <= 0;

const severeInternalWeakness =
ad < 0 &&
highs < lows &&
breadth50 < 58;

const healthyInternals =
ad > 0 &&
highs >= lows;

const rotationActive =
[
"BUILD",
"ADD",
"AGGRESSIVE"
].includes(russellDecision);

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
NEW TRANSITION FLAGS
===================================================== */

const equalWeightWeakness =
rsEqual < 0.985;

const smallCapWeakness =
rsSmall < 0.985;

/* =====================================================
NEW BREADTH VELOCITY FLAGS
===================================================== */

const breadthMomentumLoss =
velocity20 < 0 &&
velocity50 < 0;

const aggressiveBreadthMomentumLoss =
velocity20 < -4 &&
velocity50 < -3;

const breadthImpulseBreak =
breadthVelocityScore < 42;

const severeBreadthImpulseBreak =
breadthVelocityScore < 30;

const earlyDistributionDynamics =

breadthMomentumLoss &&

(
narrowLeadership ||
rotationalWeakness
);

/* =====================================================
NEW INTERNAL DISTRIBUTION FLAGS
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
NEW PHASE REGIME MAP
===================================================== */

let regimeState =
"RISK_ON";

/* =====================================================
NEW PHASE 4 SUBPHASES
===================================================== */

let subPhase =
"HEALTHY_EXPANSION";

/* =====================================================
PHASE
===================================================== */

let phase =
"PHASE_1_EXPANSION";

let confidence = 50;

/* =====================================================
🔴 CAPITULATION
===================================================== */

if (
crashScore > 85
) {

phase =
"PHASE_7_CAPITULATION";

regimeState =
"CAPITULATION";

subPhase =
"FORCED_LIQUIDATION";

confidence = 95;
}

/* =====================================================
🔴 ACCELERATION
===================================================== */

else if (
crashScore > 75
) {

phase =
"PHASE_6_ACCELERATION";

regimeState =
"CRISIS";

subPhase =
"LIQUIDITY_BREAK";

confidence = 90;
}

/* =====================================================
🔴 BREAKDOWN
===================================================== */

else if (
crashScore > 65
) {

phase =
"PHASE_5_BREAKDOWN";

regimeState =
"RISK_OFF";

subPhase =
"STRUCTURAL_BREAKDOWN";

confidence = 85;
}

/* =====================================================
🟠 PHASE 4 — FRAGILE
INSTITUTIONAL TRANSITION DETECTION
===================================================== */

else if (

(
narrowLeadership &&

(
rotationalWeakness ||
breadthMomentumLoss ||
breadthImpulseBreak
)
)

||

(
equalWeightWeakness &&
smallCapWeakness &&
breadth50 < 62
)

||

(
participationCollapse &&
hiddenDistribution
)

||

(
persistentDistribution
)

||

(
breadthMomentumLoss &&
weakInternals
)

||

(
breadthImpulseBreak &&
rotationScore < 48
)

||

(
health < 60 &&
narrowLeadership
)

||

(
aggressiveBreadthMomentumLoss
)

||

(
severePersistentDistribution
)

||

(
crashScore > 55
)

||

structuralDeterioration

||

distributionRisk > 65

||

falseRecoveryRisk > 70

||

marketFatigue > 75

) {

phase =
"PHASE_4_RISK";

regimeState =
"FRAGILE";

/* =====================================================
PRE-CRASH TRANSITION
===================================================== */

if (

(
severePersistentDistribution
)

||

(
participationCollapse &&
hiddenDistribution &&
breadth50 < 55
)

||

(
aggressiveBreadthMomentumLoss &&
severeBreadthImpulseBreak
)

||

(
crashScore > 62
)

||
(
severeBearRegime &&
severeParticipationFailure
)

) {

subPhase =
"PRE_CRASH_TRANSITION";

confidence = 90;
}

/* =====================================================
INTERNAL DISTRIBUTION
===================================================== */

else if (

(
narrowLeadership &&
rotationalWeakness
)

||

(
equalWeightWeakness &&
smallCapWeakness
)

||

(
breadthMomentumLoss &&
weakInternals
)

||

(
breadthImpulseBreak &&
rotationScore < 50
)

||

(
persistentDistribution
)

) {

subPhase =
"INTERNAL_DISTRIBUTION";

confidence = 84;
}

/* =====================================================
PASSIVE LIQUIDITY TRAP
===================================================== */

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

confidence = 73;
}

/* =====================================================
ROTATIONAL BREAKDOWN
===================================================== */

else if (

rotationScore < 45 &&

(
rsSmall < 0.97 ||
rsEqual < 0.97
)

) {

subPhase =
"ROTATIONAL_BREAKDOWN";

confidence = 78;
}

/* =====================================================
DEFAULT
===================================================== */

else {

subPhase =
"HEALTHY_PULLBACK";

confidence = 64;
}
}

/* =====================================================
🟡 DISTRIBUTION = TRANSITION
===================================================== */

else if (

(
early &&

(
weakInternals ||
rotationScore < 45 ||
health < 70 ||
earlyDistributionDynamics ||
breadthImpulseBreak
)
)

||

persistentDistribution ||

hiddenInstitutionalDistribution


||

distributionRisk > 55

||

marketFatigue > 60


) {

phase =
"PHASE_3_DISTRIBUTION";

regimeState =
"TRANSITION";

if (

persistentDistribution &&

hiddenInstitutionalDistribution

) {

subPhase =
"PERSISTENT_HIDDEN_DISTRIBUTION";

confidence = 86;
}

else if (
breadthMomentumLoss &&
narrowLeadership
) {

subPhase =
"EARLY_INSTITUTIONAL_DISTRIBUTION";

confidence = 80;

}

else {

subPhase =
"EARLY_DISTRIBUTION";

confidence = 72;
}
}

/* =====================================================
🟡 WARNING / LATE EXPANSION
===================================================== */

else if (
early &&
strongBreadth
) {

phase =
"PHASE_2_WARNING";

regimeState =
"LATE_EXPANSION";

if (
breadthMomentumLoss ||
persistentWeakness
) {

subPhase =
"ROLLING_OVER_BREADTH";

confidence = 80;

} else {

subPhase =
"LATE_EXPANSION";

confidence = 75;
}
}

/* =====================================================
🟢 ROTATION EXPANSION
===================================================== */

else if (

rotationActive &&
rotationScore >= 40 &&
crashScore < 30 &&
!persistentWeakness &&

trendStability > 60 &&

recoveryQuality > 55

) {

phase =
"PHASE_2_WARNING";

regimeState =
"ROTATIONAL_EXPANSION";

if (
broadParticipation &&
breadthVelocityScore > 60 &&
bullishPersistence
) {

subPhase =
"BROADENING_EXPANSION";

confidence = 76;
}

else if (
narrowLeadership
) {

subPhase =
"NARROW_AI_EXPANSION";

confidence = 62;
}

else {

subPhase =
"ROTATION_BUILD";

confidence = 65;
}
}

/* =====================================================
🟢 CLEAN EXPANSION
===================================================== */

else if (

strongBreadth &&
!early &&
crashScore < 30 &&
!breadthMomentumLoss &&
!persistentWeakness &&
!hiddenInstitutionalDistribution

) {

phase =
"PHASE_1_EXPANSION";

regimeState =
"RISK_ON";

if (
broadParticipation &&
health > 80 &&
breadthVelocityScore > 68 &&
bullishPersistence
) {

subPhase =
"INSTITUTIONAL_EXPANSION";

confidence = 88;
}

else if (
narrowLeadership
) {

subPhase =
"AI_MELTUP";

confidence = 72;
}

else {

subPhase =
"HEALTHY_EXPANSION";

confidence = 70;
}
}

/* =====================================================
FALLBACK
===================================================== */

else {

phase =
persistentWeakness
? "PHASE_3_DISTRIBUTION"
: "PHASE_2_WARNING";

regimeState =
persistentWeakness
? "TRANSITION"
: "RISK_ON";

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

)

&&

phase==="PHASE_1_EXPANSION"

) {

phase =
"PHASE_2_WARNING";

regimeState =
"LATE_EXPANSION";

subPhase =
"PERSISTENT_INTERNAL_WEAKNESS";

confidence =
Math.min(confidence, 68);
}

/* =====================================================
OUTPUT
===================================================== */

return {

phase,
regimeState,

subPhase,

confidence,

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

marketCharacter


}
};

}
