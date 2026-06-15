// /lib/engine/tradeStackEngine.ts

export function tradeStackEngine({
phase,
putTiming,
russell,
edgeState,
master,
rotationConfirm,
rotationDecay,
executionState,
regimeSync,
historyMetrics
}: any) {

/* ======================================================
INPUT
====================================================== */

const putDecision =
putTiming?.decision ?? "NONE";

const russellDecision =
russell?.decision ?? "NONE";

const mode =
master?.mode ?? "NEUTRAL";

/* ======================================================
EXECUTION / ALIGNMENT
====================================================== */

const executionMode =
executionState?.executionMode ?? "WAIT";

const regimeAligned =
Boolean(regimeSync?.aligned);

const institutionalAligned =
Boolean(regimeSync?.institutionallyAligned);

/* ======================================================
CENTRAL EDGE SYSTEM
====================================================== */

const edgeScore =
Number(edgeState?.score ?? 0);

const edgeTier =
edgeState?.tier ?? "NO_EDGE";

/* ======================================================
ROTATION CONFIRMATION
====================================================== */

const rotationState =
rotationConfirm?.state ?? "EARLY";

const rotationConfidence =
Number(rotationConfirm?.confidence ?? 40);

const rotationQuality =
Number(rotationConfirm?.quality ?? 50);

const sustainability =
Number(rotationConfirm?.sustainability ?? 50);

const participation =
Number(rotationConfirm?.participation ?? 50);

const falseBreakRisk =
Number(rotationConfirm?.falseBreakRisk ?? 50);

/* ======================================================
ROTATION DECAY
====================================================== */

const decayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";

const decayScore =
Number(rotationDecay?.score ?? 20);

/* ======================================================
HISTORY
====================================================== */

const breadthTrend =
Number(historyMetrics?.breadthTrend ?? 0);

const breadthAcceleration =
Number(historyMetrics?.breadthAcceleration ?? 0);

const participationDecay =
Number(historyMetrics?.participationDecay ?? 0);

const leadershipDecay =
Number(historyMetrics?.leadershipDecay ?? 0);

const crashTrend =
Number(historyMetrics?.crashTrend ?? 0);

const phasePersistence =
Number(historyMetrics?.phasePersistence ?? 0);

/* ======================================================
HISTORY FLAGS
====================================================== */

const deterioratingBreadth =
breadthTrend < -10;

const acceleratingBreadthDecay =
breadthAcceleration < -5;

const participationErosion =
participationDecay > 10;

const severeParticipationErosion =
participationDecay > 20;

const leadershipConcentration =
leadershipDecay < -5;

const risingCrashRisk =
crashTrend > 5;

const severeRisingCrashRisk =
crashTrend > 10;

const prolongedDistribution =
phasePersistence >= 6;


/* ======================================================
BASE
====================================================== */

let state = "NEUTRAL";
let type = "NEUTRAL";
let strength = 0;
let driver = "NONE";

/* ======================================================
SHORT SIDE
====================================================== */

if (putDecision === "AGGRESSIVE") {

state = "SHORT_ATTACK";
type = "SHORT";
strength = 75;
driver = "PUT_FLOW";

if (
severeParticipationErosion ||
severeRisingCrashRisk
) {
strength += 10;
}


} else if (putDecision === "ADD") {

state = "SHORT_BUILDING";
type = "SHORT";
strength = 60;
driver = "PUT_FLOW";

if (
participationErosion ||
risingCrashRisk
) {
strength += 8;
}


} else if (putDecision === "BUILD") {

state = "DEFENSIVE_SHORT";
type = "SHORT";
strength = 45;
driver = "PUT_FLOW";

if (
deterioratingBreadth ||
participationErosion
) {
strength += 6;
}

} else if (
putDecision === "EARLY" &&
(
decayState === "INTERNAL_BREAKDOWN" ||
decayScore >= 60
)
) {

state = "EARLY_DEFENSIVE_SHORT";
type = "SHORT";
strength = 30;
driver = "EARLY_BREAKDOWN";
}

else if (

phase === "PHASE_3_DISTRIBUTION"

&&

(
participationErosion ||
risingCrashRisk ||
prolongedDistribution
)

) {

state = "EARLY_DEFENSIVE_SHORT";

type = "SHORT";

strength = 35;

driver = "HISTORICAL_DETERIORATION";
}

/* ======================================================
LONG SIDE
====================================================== */

else if (russellDecision === "AGGRESSIVE") {

state = "LONG_ATTACK";
type = "LONG";
strength = 70;
driver = "ROTATION";

} else if (russellDecision === "ADD") {

state = "LONG_BUILDING";
type = "LONG";
strength = 55;
driver = "ROTATION";

} else if (russellDecision === "BUILD") {

state = "LONG_BUILDING";
type = "LONG";
strength = 45;
driver = "ROTATION";
}

/* ======================================================
CENTRAL EDGE OVERLAY
====================================================== */

if (edgeScore >= 80) {
strength += 20;
}
else if (edgeScore >= 60) {
strength += 12;
}
else if (edgeScore >= 40) {
strength += 6;
}
else if (edgeScore < 20) {
strength -= 20;
}

/* ======================================================
MODE OVERLAY
====================================================== */

if (mode === "RISK") {

if (type === "SHORT") {

if (
deterioratingBreadth
) {
strength += 5;
}

if (
participationErosion
) {
strength += 8;
}

if (
risingCrashRisk
) {
strength += 8;
}

if (
prolongedDistribution
) {
strength += 6;
}

if (
severeParticipationErosion
) {
strength += 8;
}

if (
severeRisingCrashRisk
) {
strength += 8;
}


strength += 10;
}

if (type === "LONG") {

if (
deterioratingBreadth
) {
strength -= 8;
}

if (
participationErosion
) {
strength -= 12;
}

if (
risingCrashRisk
) {
strength -= 10;
}

if (
prolongedDistribution
) {
strength -= 10;
}

strength -= 15;

}

}

if (mode === "ROTATION") {

if (type === "LONG") {
strength += 8;
}

}

/* ======================================================
ROTATION QUALITY
====================================================== */

if (type === "LONG") {

if (
deterioratingBreadth
) {
strength -= 8;
}

if (
acceleratingBreadthDecay
) {
strength -= 6;
}

if (
participationErosion
) {
strength -= 12;
}

if (
risingCrashRisk
) {
strength -= 10;
}

if (
prolongedDistribution
) {
strength -= 10;
}

if (rotationState === "CONFIRMED") {
strength += 8;
}

if (
rotationState ===
"INSTITUTIONAL_CONFIRMATION"
) {
strength += 10;
}

if (rotationConfidence >= 80) {
strength += 6;
}

if (rotationQuality >= 75) {
strength += 5;
}

if (sustainability >= 70) {
strength += 4;
}

if (participation >= 70) {
strength += 4;
}

if (falseBreakRisk > 65) {
strength -= 18;
}

}

/* ======================================================
DECAY OVERLAY
====================================================== */

if (type === "LONG") {

if (decayState === "EARLY_DECAY") {
strength -= 10;
}

if (decayState === "INTERNAL_BREAKDOWN") {
strength -= 18;
}

if (decayState === "ROTATION_FAILURE") {
strength -= 25;
}

if (decayScore > 70) {
strength -= 10;
}

}

/* ======================================================
SHORT CONFIRMATION
====================================================== */

if (type === "SHORT") {

if (decayState === "INTERNAL_BREAKDOWN") {
strength += 8;
}

if (decayState === "ROTATION_FAILURE") {
strength += 12;
}

if (decayScore >= 80) {
strength += 8;
}

if (rotationConfidence <= 30) {
strength += 5;
}

if (falseBreakRisk >= 80) {
strength += 5;
}

}

/* ======================================================
EXECUTION FILTER
====================================================== */

if (
type === "LONG" &&
executionMode === "WAIT"
) {
strength -= 20;
}

/* ======================================================
REGIME FILTER
====================================================== */

if (
type === "LONG" &&
!regimeAligned
) {
strength -= 15;
}

if (
type === "LONG" &&
!institutionalAligned
) {
strength -= 10;
}

/* ======================================================
DEFENSIVE OVERLAY
====================================================== */

const defensiveBreakdown =
decayScore >= 70 &&
rotationConfidence <= 30 &&
falseBreakRisk >= 80;

if (
defensiveBreakdown &&
type !== "SHORT"
) {

state = "DEFENSIVE_SHORT";
type = "SHORT";
strength = 40;
driver = "ROTATION_BREAKDOWN";

}

/* ======================================================
PHASE FILTER
====================================================== */

if (
phase === "PHASE_3_DISTRIBUTION" &&
type === "LONG"
) {
strength = Math.min(strength, 35);
}

if (
phase === "PHASE_4_RISK" &&
type === "LONG"
) {
strength = Math.min(strength, 15);
}

/* ======================================================
CLEAN
====================================================== */

strength = Math.max(
0,
Math.min(
100,
Math.round(strength)
)
);

/* ======================================================
FINAL CLASSIFICATION
====================================================== */

if (type === "LONG") {

if (strength >= 75) {
state = "LONG_ATTACK";
}
else if (strength >= 40) {
state = "LONG_BUILDING";
}
else {
state = "EARLY_LONG";
}

}

if (type === "SHORT") {

if (strength >= 75) {
state = "SHORT_ATTACK";
}
else if (strength >= 40) {
state = "SHORT_BUILDING";
}
else {
state = "EARLY_DEFENSIVE_SHORT";
}

}

if (strength < 20) {

state = "NEUTRAL";
type = "NEUTRAL";
driver = "NONE";

}

/* ======================================================
RETURN
====================================================== */

return {
state,
type,
strength,
driver,

edge: {
score: edgeScore,
tier: edgeTier
},

meta: {
putDecision,
russellDecision,
mode,
rotationState,
rotationConfidence,
rotationQuality,
sustainability,
participation,
falseBreakRisk,
decayState,
decayScore,
executionMode,
regimeAligned,
institutionalAligned
},

history: {

breadthTrend,
breadthAcceleration,

participationDecay,
leadershipDecay,

crashTrend,

phasePersistence,

deterioratingBreadth,
acceleratingBreadthDecay,

participationErosion,
severeParticipationErosion,

leadershipConcentration,

risingCrashRisk,
severeRisingCrashRisk,

prolongedDistribution

}

};

}
