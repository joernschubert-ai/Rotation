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
const marketDrivers = engine.marketDrivers ?? {};
const executionState = engine.executionState ?? {};

/* =====================================================
SAFE VALUES
===================================================== */

const crashScore =
Number(crash?.score ?? 0);

const crashProbability =
Number(crash?.probability ?? 0);

const rotationScore =
Number(rotation?.score ?? 0);

const russellScore =
Number(russell?.confidence ?? 0);

const timingRaw =
Number(
putTiming?.score?.value ??
putTiming?.score ??
0
);

const timingScore =
(timingRaw / 12) * 100;

const phase =
phaseData?.phase ??
"PHASE_1_EXPANSION";

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

averageBreadth = 0,
averageParticipation = 0,
averageRotation = 0,
averageLiquidity = 0,
averageFragility = 0,

acceleratingWeakness = false,

regimePersistence: regimePersistenceHistory = 0,

persistentDistribution: historyPersistentDistribution = false,

prolongedBearRegime = false,

} = historyMetrics;


/* =====================================================
EXECUTION LAYER
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
STRUCTURAL FLAGS
===================================================== */

const deterioratingBreadth =
breadthTrend <= -2;

const acceleratingBreadthDecay =
breadthAcceleration <= -1;

const leadershipConcentration =
leadershipDecay <= -2;

const risingCrashRisk =
crashTrend >= 3;

const broadParticipationFailure =
relativeBreadthWeakness > 10;

const prolongedBearHistory =
prolongedBearRegime;

const weakInternals = (

participationScore < 50 ||

breadthVelocityScore < 45 ||

marketQualityScore < 45 ||

rotationDecayScore > 45 ||

daysInPhase >= 10

||

institutionalPressure > 65

||

averageBreadth < 55

||

averageParticipation < 55

||

averageLiquidity < 50

||

averageFragility > 60

||

participationDecay > 15 ||

deterioratingBreadth ||

acceleratingBreadthDecay ||

leadershipConcentration ||

broadParticipationFailure ||

prolongedBearRegime

);

const narrowLeadership = (

rotation?.rsGrowth > 1.03 &&
rotation?.rsSmall < 0.995 &&
rotation?.rsEqual < 0.995

);


/* =====================================================
SCORE
===================================================== */

let score = 50;

/* =====================================================
POSITIVE
===================================================== */

if (marketQualityScore > 60) score += 8;
if (participationScore > 55) score += 6;
if (breadthVelocityScore > 55) score += 6;
if (liquidityScore > 55) score += 4;
if (

averageBreadth > 65 &&

averageParticipation > 65

) {

score += 5;

}

if (

averageLiquidity > 60 &&

averageFragility < 45

) {

score += 4;

}


/* =====================================================
NEGATIVE
===================================================== */

if (marketQualityScore < 45) score -= 10;

if (participationScore < 45) score -= 10;

/* -------------------------------------------------
ROTATION DECAY
Phase-3 Distribution Penalty
------------------------------------------------- */

if (rotationDecayScore >= 80) {
score -= 15;
}

if (rotationDecayScore >= 70) {
score -= 10;
}

if (rotationDecayScore >= 60) {
score -= 5;
}

if (fragilityScore > 60) {
score -= 8;
}

if (
phasePersistence >= 60
) {

score -= 4;

}

if (
phasePersistence >= 85
) {

score -= 6;

}

if (
participationDecay > 15
) {
score -= 4;
}

if (
participationDecay > 25
) {
score -= 6;
}

if (
deterioratingBreadth
) {
score -= 4;
}

if (
acceleratingBreadthDecay
) {
score -= 5;
}

if (
leadershipConcentration
) {
score -= 4;
}

if (
risingCrashRisk
) {
score -= 4;
}

if (
broadParticipationFailure
) {
score -= 5;
}

if (

prolongedBearHistory &&

institutionalPressure > 70

) {

score -= 6;

}

if (averageBreadth < 50) {

score -= 5;

}

if (averageParticipation < 50) {

score -= 5;

}

if (averageLiquidity < 45) {

score -= 4;

}

if (averageFragility > 65) {

score -= 6;

}



/* -------------------------------------------------
NARROW LEADERSHIP
------------------------------------------------- */

if (
narrowLeadership &&
weakInternals
) {
score -= 12;
}

if (

deterioratingBreadth &&

participationDecay > 15 &&

rotationDecayScore > 60

) {

score -= 8;
}

if (

acceleratingBreadthDecay &&

risingCrashRisk

) {

score -= 8;
}

if (

broadParticipationFailure &&

leadershipConcentration

) {

score -= 8;
}



/* =====================================================
EXECUTION PRIORITY OVERRIDE
===================================================== */

const executionOverride = (

marketMode === "RISK_OFF" ||

riskState === "BREAKDOWN" ||

executionMode === "REDUCE_RISK"

);

/* =====================================================
CLAMP
===================================================== */

score = Math.max(
0,
Math.min(100, Math.round(score))
);

/* =====================================================
MODE
===================================================== */

let mode:
| "LONG"
| "NEUTRAL"
| "RISK"
| "CRASH";

mode = "LONG";

/* =====================================================
PHASE PRIORITY
===================================================== */

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

/* =====================================================
EXECUTION OVERRIDE
===================================================== */

if (executionOverride) {

mode = "RISK";
}

/* =====================================================
WEAK INTERNALS OVERRIDE
===================================================== */

if (
narrowLeadership &&
weakInternals &&
phase !== "PHASE_1_EXPANSION"
) {
mode = "NEUTRAL";
}

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

if (mode === "LONG") {
summary =
"Constructive long environment";
}

if (mode === "NEUTRAL") {
summary =
"Neutral transition regime";
}

if (mode === "RISK") {
summary =
"Defensive risk regime";
}

if (mode === "CRASH") {
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

riskState,
marketMode,
executionMode,

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
prolongedBearRegime
},

components: {

crash:
Math.round(crashScore),

rotation:
Math.round(rotationScore),

timing:
Math.round(timingScore),

russell:
Math.round(russellScore),

participation:
Math.round(participationScore),

breadthThrust:
Math.round(thrustScore),

breadthVelocity:
Math.round(breadthVelocityScore),

rotationDecay:
Math.round(rotationDecayScore),

liquidity:
Math.round(liquidityScore),

marketQuality:
Math.round(marketQualityScore),

fragility:
Math.round(fragilityScore)
}
};

}
