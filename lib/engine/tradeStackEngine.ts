// /lib/engine/tradeStackEngine.ts

export function tradeStackEngine({
phase,
putTiming,

// NEU:
nasdaqCall,
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

const nasdaqCallDecision =
nasdaqCall?.decision ??
nasdaqCall?.action ??
"NONE";

const russellDecision =
russell?.decision ?? "NONE";

const mode =
master?.mode ?? "NEUTRAL";


/* ======================================================
EXECUTION / ALIGNMENT
====================================================== */

const executionMode =
executionState?.executionMode ?? "WAIT";

const phaseConfirmed =
Boolean(
master?.meta?.phaseConfirmed ?? true
);

const phaseConfidence =
Number(
master?.meta?.phaseConfidence ?? 100
);

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
Number(
rotationConfirm?.confidence ?? 40
);

const rotationQuality =
Number(
rotationConfirm?.quality ?? 50
);

const sustainability =
Number(
rotationConfirm?.sustainability ?? 50
);

const participation =
Number(
rotationConfirm?.participation ?? 50
);

const falseBreakRisk =
Number(
rotationConfirm?.falseBreakRisk ?? 50
);


/* ======================================================
ROTATION DECAY
====================================================== */

const decayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";

const decayScore =
Number(
rotationDecay?.score ?? 20
);


/* ======================================================
HISTORY
====================================================== */

const breadthTrend =
Number(
historyMetrics?.breadthTrend ?? 0
);

const breadthAcceleration =
Number(
historyMetrics?.breadthAcceleration ?? 0
);

const participationDecay =
Number(
historyMetrics?.participationDecay ?? 0
);

const leadershipDecay =
Number(
historyMetrics?.leadershipDecay ?? 0
);

const crashTrend =
Number(
historyMetrics?.crashTrend ?? 0
);

const phasePersistence =
Number(
historyMetrics?.phasePersistence ?? 0
);

const regimePersistence =
Number(
historyMetrics?.regimePersistence ?? 0
);

const relativeBreadthWeakness =
Number(
historyMetrics?.relativeBreadthWeakness ?? 0
);


/* ======================================================
HISTORY FLAGS
====================================================== */

const deterioratingBreadth =
breadthTrend <= -2;

const acceleratingBreadthDecay =
breadthAcceleration <= -1;

const participationErosion =
participationDecay > 10;

const severeParticipationErosion =
participationDecay > 20;

const leadershipConcentration =
leadershipDecay <= -2;

const risingCrashRisk =
crashTrend >= 3;

const severeRisingCrashRisk =
crashTrend >= 6;

const prolongedDistribution =
phasePersistence >= 60;

const prolongedBearRegime =
regimePersistence >= 60;

const severeBearRegime =
regimePersistence >= 85;

const broadParticipationFailure =
relativeBreadthWeakness > 10;

const severeParticipationFailure =
relativeBreadthWeakness > 20;


/* ======================================================
SHARED HELPERS
====================================================== */

function applyEdgeOverlay(
strength: number
) {

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

return strength;
}


/* ======================================================
NASDAQ PUT
====================================================== */

function evaluateNasdaqPut() {

let state = "NEUTRAL";
let strength = 0;
let driver = "NONE";

/*
* Base decision
*/

if (putDecision === "AGGRESSIVE") {

state = "SHORT_ATTACK";
strength = 75;
driver = "PUT_FLOW";

if (
severeParticipationErosion ||
severeRisingCrashRisk
) {
strength += 10;
}

}

else if (putDecision === "ADD") {

state = "SHORT_BUILDING";
strength = 60;
driver = "PUT_FLOW";

if (
participationErosion ||
risingCrashRisk
) {
strength += 8;
}

}

else if (putDecision === "BUILD") {

state = "DEFENSIVE_SHORT";
strength = 45;
driver = "PUT_FLOW";

if (
deterioratingBreadth ||
participationErosion
) {
strength += 6;
}

}

else if (
putDecision === "EARLY" &&
(
decayState === "INTERNAL_BREAKDOWN" ||
decayScore >= 60
)
) {

state = "EARLY_DEFENSIVE_SHORT";
strength = 30;
driver = "EARLY_BREAKDOWN";
}

else if (
phase === "PHASE_3_DISTRIBUTION" &&
(
participationErosion ||
risingCrashRisk ||
prolongedDistribution ||
prolongedBearRegime ||
broadParticipationFailure
)
) {

state = "EARLY_DEFENSIVE_SHORT";
strength = 35;
driver = "HISTORICAL_DETERIORATION";
}


/*
* Edge
*/

strength = applyEdgeOverlay(strength);


/*
* Risk mode
*/

if (mode === "RISK") {

if (deterioratingBreadth)
strength += 5;

if (participationErosion)
strength += 8;

if (risingCrashRisk)
strength += 8;

if (prolongedDistribution)
strength += 6;

if (prolongedBearRegime)
strength += 6;

if (severeBearRegime)
strength += 8;

if (broadParticipationFailure)
strength += 6;

if (severeParticipationFailure)
strength += 8;

if (severeParticipationErosion)
strength += 8;

if (severeRisingCrashRisk)
strength += 8;

strength += 10;
}


/*
* Rotation breakdown supports PUT
*/

if (
decayState === "INTERNAL_BREAKDOWN"
) {
strength += 8;
}

if (
decayState === "ROTATION_FAILURE"
) {
strength += 12;
}

if (decayScore >= 80)
strength += 8;

if (rotationConfidence <= 30)
strength += 5;

if (falseBreakRisk >= 80)
strength += 5;

if (prolongedBearRegime)
strength += 5;

if (severeBearRegime)
strength += 8;

if (broadParticipationFailure)
strength += 5;

if (severeParticipationFailure)
strength += 8;


/*
* Phase confidence
*/

if (
!phaseConfirmed &&
phase === "PHASE_4_RISK"
) {
strength -= 10;
}

if (
phaseConfirmed &&
phaseConfidence > 70
) {
strength += 5;
}


/*
* Final
*/

strength = Math.max(
0,
Math.min(
100,
Math.round(strength)
)
);


if (strength >= 75)
state = "SHORT_ATTACK";

else if (strength >= 40)
state = "SHORT_BUILDING";

else if (strength >= 20)
state = "EARLY_DEFENSIVE_SHORT";

else
state = "NEUTRAL";


return {
instrument: "NASDAQ_PUT",
direction: "SHORT",
state,
strength,
driver
};
}


/* ======================================================
NASDAQ CALL
====================================================== */

function evaluateNasdaqCall() {

let state = "NEUTRAL";
let strength = 0;
let driver = "NONE";


/*
* Base CALL decision
*
* Wichtig:
* NASDAQ CALL ist NICHT automatisch Russell-Rotation.
*/

if (
nasdaqCallDecision === "AGGRESSIVE"
) {

state = "LONG_ATTACK";
strength = 70;
driver = "NASDAQ_CALL";

}

else if (
nasdaqCallDecision === "ADD"
) {

state = "LONG_BUILDING";
strength = 55;
driver = "NASDAQ_CALL";

}

else if (
nasdaqCallDecision === "BUILD"
) {

state = "LONG_BUILDING";
strength = 45;
driver = "NASDAQ_CALL";

}

else if (
nasdaqCallDecision === "EARLY"
) {

state = "EARLY_LONG";
strength = 30;
driver = "NASDAQ_REBOUND";

}


/*
* A CALL needs positive market confirmation.
*/

if (deterioratingBreadth)
strength -= 8;

if (acceleratingBreadthDecay)
strength -= 6;

if (participationErosion)
strength -= 12;

if (risingCrashRisk)
strength -= 10;

if (prolongedDistribution)
strength -= 10;

if (prolongedBearRegime)
strength -= 10;

if (severeBearRegime)
strength -= 15;

if (broadParticipationFailure)
strength -= 8;

if (severeParticipationFailure)
strength -= 12;


/*
* Risk regime is hostile to NASDAQ CALL.
*/

if (mode === "RISK") {

strength -= 15;

if (deterioratingBreadth)
strength -= 8;

if (participationErosion)
strength -= 12;

if (risingCrashRisk)
strength -= 10;

if (prolongedDistribution)
strength -= 10;
}


/*
* Rotation decay is also relevant.
*
* But unlike Russell CALL:
* decay is not necessarily a direct
* NASDAQ bearish signal.
*
* It mainly removes confidence
* from the long side.
*/

if (
decayState === "EARLY_DECAY"
) {
strength -= 5;
}

if (
decayState === "INTERNAL_BREAKDOWN"
) {
strength -= 10;
}

if (
decayState === "ROTATION_FAILURE"
) {
strength -= 12;
}

if (decayScore > 70)
strength -= 6;


/*
* Phase filter
*/

if (
phase === "PHASE_3_DISTRIBUTION"
) {
strength =
Math.min(strength, 35);
}

if (
phase === "PHASE_4_RISK"
) {
strength =
Math.min(strength, 20);
}


/*
* Execution filter
*/

if (
executionMode === "WAIT"
) {
strength -= 15;
}

if (!phaseConfirmed)
strength -= 20;

if (phaseConfidence < 55)
strength -= 10;


/*
* Regime alignment
*/

if (!regimeAligned)
strength -= 15;

if (!institutionalAligned)
strength -= 10;


/*
* Positive confirmation
*/

if (
phaseConfirmed &&
phaseConfidence >= 80
) {
strength += 5;
}

/*
* A CALL can benefit from a good edge,
* but not as aggressively as a short
* in a risk regime.
*/

if (edgeScore >= 80)
strength += 10;

else if (edgeScore >= 60)
strength += 6;

else if (edgeScore < 20)
strength -= 10;


/*
* Final
*/

strength = Math.max(
0,
Math.min(
100,
Math.round(strength)
)
);


if (strength >= 75)
state = "LONG_ATTACK";

else if (strength >= 40)
state = "LONG_BUILDING";

else if (strength >= 20)
state = "EARLY_LONG";

else
state = "NEUTRAL";


return {
instrument: "NASDAQ_CALL",
direction: "LONG",
state,
strength,
driver
};
}


/* ======================================================
RUSSELL CALL
====================================================== */

function evaluateRussellCall() {

let state = "NEUTRAL";
let strength = 0;
let driver = "NONE";


/*
* Base rotation decision
*/

if (
russellDecision === "AGGRESSIVE"
) {

state = "LONG_ATTACK";
strength = 70;
driver = "ROTATION";

}

else if (
russellDecision === "ADD"
) {

state = "LONG_BUILDING";
strength = 55;
driver = "ROTATION";

}

else if (
russellDecision === "BUILD"
) {

state = "LONG_BUILDING";
strength = 45;
driver = "ROTATION";
}


/*
* Central edge
*/

strength = applyEdgeOverlay(strength);


/*
* Risk mode
*/

if (mode === "RISK") {

if (deterioratingBreadth)
strength -= 8;

if (participationErosion)
strength -= 12;

if (risingCrashRisk)
strength -= 10;

if (leadershipConcentration)
strength += 5;

if (acceleratingBreadthDecay)
strength -= 6;

if (prolongedDistribution)
strength -= 10;

if (prolongedBearRegime)
strength -= 10;

if (severeBearRegime)
strength -= 15;

if (broadParticipationFailure)
strength -= 8;

if (severeParticipationFailure)
strength -= 12;

strength -= 15;
}


/*
* Rotation quality
*/

if (deterioratingBreadth)
strength -= 8;

if (leadershipConcentration)
strength -= 6;

if (acceleratingBreadthDecay)
strength -= 6;

if (participationErosion)
strength -= 12;

if (risingCrashRisk)
strength -= 10;

if (prolongedDistribution)
strength -= 10;

if (prolongedBearRegime)
strength -= 10;

if (severeBearRegime)
strength -= 15;

if (broadParticipationFailure)
strength -= 8;

if (severeParticipationFailure)
strength -= 12;


if (
rotationState === "CONFIRMED"
) {
strength += 8;
}

if (
rotationState ===
"INSTITUTIONAL_CONFIRMATION"
) {
strength += 10;
}

if (rotationConfidence >= 80)
strength += 6;

if (rotationQuality >= 75)
strength += 5;

if (sustainability >= 70)
strength += 4;

if (participation >= 70)
strength += 4;

if (falseBreakRisk > 65)
strength -= 18;


/*
* Rotation decay
*/

if (
decayState === "EARLY_DECAY"
) {
strength -= 10;
}

if (
decayState === "INTERNAL_BREAKDOWN"
) {
strength -= 18;
}

if (
decayState === "ROTATION_FAILURE"
) {
strength -= 25;
}

if (decayScore > 70)
strength -= 10;


/*
* Phase confirmation
*/

if (
!phaseConfirmed &&
phase === "PHASE_4_RISK"
) {
strength -= 10;
}

if (
phaseConfirmed &&
phaseConfidence > 70
) {
strength += 5;
}


/*
* Execution filter
*/

if (
executionMode === "WAIT"
) {
strength -= 20;
}

if (!phaseConfirmed)
strength -= 25;

if (phaseConfidence < 55)
strength -= 15;


/*
* Regime filter
*/

if (!regimeAligned)
strength -= 15;

if (!institutionalAligned)
strength -= 10;


/*
* Phase caps
*/

if (
phase === "PHASE_3_DISTRIBUTION"
) {
strength =
Math.min(strength, 35);
}

if (
phase === "PHASE_4_RISK"
) {
strength =
Math.min(strength, 15);
}


/*
* Final
*/

strength = Math.max(
0,
Math.min(
100,
Math.round(strength)
)
);


if (strength >= 75)
state = "LONG_ATTACK";

else if (strength >= 40)
state = "LONG_BUILDING";

else if (strength >= 20)
state = "EARLY_LONG";

else
state = "NEUTRAL";


return {
instrument: "RUSSELL_CALL",
direction: "LONG",
state,
strength,
driver
};
}


/* ======================================================
EVALUATE ALL THREE
====================================================== */

const nasdaqPutStack =
evaluateNasdaqPut();

const nasdaqCallStack =
evaluateNasdaqCall();

const russellCallStack =
evaluateRussellCall();


/* ======================================================
PRIMARY FLOW
====================================================== */

const candidates = [
nasdaqPutStack,
nasdaqCallStack,
russellCallStack
];

const activeCandidates =
candidates.filter(
candidate =>
candidate.strength >= 20
);


const primary =
activeCandidates.length > 0
? [...activeCandidates].sort(
(a, b) =>
b.strength - a.strength
)[0]
: {
instrument: "NONE",
direction: "NONE",
state: "NEUTRAL",
strength: 0,
driver: "NONE"
};


/* ======================================================
STACK STATE
====================================================== */

let stackState = "NEUTRAL";

if (
primary.instrument === "NASDAQ_PUT"
) {
stackState =
primary.strength >= 75
? "SHORT_ATTACK"
: primary.strength >= 40
? "SHORT_BUILDING"
: "EARLY_DEFENSIVE_SHORT";
}

else if (
primary.instrument === "NASDAQ_CALL"
) {
stackState =
primary.strength >= 75
? "LONG_ATTACK"
: primary.strength >= 40
? "LONG_BUILDING"
: "EARLY_LONG";
}

else if (
primary.instrument === "RUSSELL_CALL"
) {
stackState =
primary.strength >= 75
? "LONG_ATTACK"
: primary.strength >= 40
? "LONG_BUILDING"
: "EARLY_LONG";
}


/* ======================================================
RETURN
====================================================== */

return {

state:
stackState,

type:
primary.direction,

strength:
primary.strength,

driver:
primary.driver,

primaryFlow: {
instrument:
primary.instrument,

direction:
primary.direction,

state:
primary.state,

strength:
primary.strength,

driver:
primary.driver
},

nasdaqPut:
nasdaqPutStack,

nasdaqCall:
nasdaqCallStack,

russellCall:
russellCallStack,

candidates: [
nasdaqPutStack,
nasdaqCallStack,
russellCallStack
],

edge: {
score: edgeScore,
tier: edgeTier
},

meta: {
putDecision,
nasdaqCallDecision,
russellDecision,

mode,

phaseConfirmed,
phaseConfidence,

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
regimePersistence,

relativeBreadthWeakness,

prolongedBearRegime,
severeBearRegime,

broadParticipationFailure,
severeParticipationFailure,

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