// /lib/engine/tradeStackEngine.ts

export function tradeStackEngine({
phase,
putTiming,
nasdaqCall,
russell,

priceMomentum,

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
russell?.decision ??
russell?.action ??
"NONE";

const mode =
master?.mode ?? "NEUTRAL";


/* ======================================================
CENTRAL STATE
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
Boolean(
regimeSync?.aligned ?? false
);

const institutionalAligned =
Boolean(
regimeSync?.institutionallyAligned ?? false
);


/* ======================================================
EDGE
====================================================== */

const edgeScore =
Number(
edgeState?.score ?? 0
);

const edgeTier =
edgeState?.tier ?? "NO_EDGE";


/* ======================================================
PRICE MOMENTUM
====================================================== */

const priceScore =
Number(
priceMomentum?.score ?? 50
);

const priceState =
priceMomentum?.state ?? "NEUTRAL";

const priceDirection =
priceMomentum?.direction ?? "FLAT";

const priceAcceleration =
Number(
priceMomentum?.acceleration ?? 0
);

const bullishImpulse =
Boolean(
priceMomentum?.bullishImpulse
);

const bearishImpulse =
Boolean(
priceMomentum?.bearishImpulse
);

const coolingPrice =
Boolean(
priceMomentum?.cooling
);

const priceConflict =
Boolean(
priceMomentum?.conflict
);


/* ======================================================
NASDAQ MOMENTUM
====================================================== */

const ndxPriceScore =
Number(
priceMomentum?.ndx?.score ??
priceScore
);

const ndxMomentum5D =
Number(
priceMomentum?.ndx?.momentum5D ?? 0
);

const ndxMomentum20D =
Number(
priceMomentum?.ndx?.momentum20D ?? 0
);

const ndxAcceleration =
Number(
priceMomentum?.ndx?.acceleration ?? 0
);


/* ======================================================
RUSSELL MOMENTUM
====================================================== */

const rutPriceScore =
Number(
priceMomentum?.rut?.score ??
priceScore
);

const rutMomentum5D =
Number(
priceMomentum?.rut?.momentum5D ?? 0
);

const rutMomentum20D =
Number(
priceMomentum?.rut?.momentum20D ?? 0
);

const rutAcceleration =
Number(
priceMomentum?.rut?.acceleration ?? 0
);


/* ======================================================
ROTATION CONFIRM
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

const rotationParticipation =
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
GLOBAL BLOCKERS
====================================================== */

const phaseRisk =
phase === "PHASE_4_RISK";

const phaseBreakdown =
phase === "PHASE_5_BREAKDOWN";

const phaseAcceleration =
phase === "PHASE_6_ACCELERATION";

const phaseCapitulation =
phase === "PHASE_7_CAPITULATION";


/*
* These phases are fundamentally incompatible
* with aggressive long exposure.
*/

const longRiskPhase =
phaseRisk ||
phaseBreakdown ||
phaseAcceleration ||
phaseCapitulation;


/*
* Severe structural deterioration.
*/

const structuralStress =
participationErosion ||
broadParticipationFailure ||
prolongedDistribution ||
prolongedBearRegime;


/*
* Severe deterioration.
*/

const severeStructuralStress =
severeParticipationErosion ||
severeParticipationFailure ||
severeBearRegime ||
severeRisingCrashRisk;


/* ======================================================
EDGE OVERLAY
====================================================== */

function applyEdgeOverlay(
strength: number
) {

if (edgeScore >= 80) {
strength += 15;
}
else if (edgeScore >= 60) {
strength += 10;
}
else if (edgeScore >= 40) {
strength += 5;
}
else if (edgeScore < 20) {
strength -= 15;
}

return strength;
}


/* ======================================================
PUT PRICE OVERLAY
====================================================== */

function applyPutPriceOverlay(
strength: number
) {

if (ndxPriceScore >= 75) {
strength -= 15;
}
else if (ndxPriceScore >= 60) {
strength -= 8;
}

if (ndxPriceScore <= 25) {
strength += 12;
}
else if (ndxPriceScore <= 40) {
strength += 6;
}

if (bearishImpulse) {
strength += 8;
}

if (
ndxAcceleration < 0 &&
priceDirection === "DOWN"
) {
strength += 5;
}

if (bullishImpulse) {
strength -= 10;
}

if (
coolingPrice &&
priceDirection === "UP"
) {
strength -= 5;
}

/*
* Strong bullish price momentum against
* weak structure is treated as rebound risk,
* not automatically as a CALL.
*/

if (
priceConflict &&
ndxPriceScore >= 70
) {
strength -= 5;
}

return strength;
}


/* ======================================================
NASDAQ CALL PRICE OVERLAY
====================================================== */

function applyCallPriceOverlay(
strength: number
) {

if (ndxPriceScore >= 75) {
strength += 15;
}
else if (ndxPriceScore >= 60) {
strength += 8;
}

if (bullishImpulse) {
strength += 8;
}

if (
ndxAcceleration > 0 &&
priceDirection === "UP"
) {
strength += 5;
}

if (ndxPriceScore <= 25) {
strength -= 18;
}
else if (ndxPriceScore <= 40) {
strength -= 10;
}

if (bearishImpulse) {
strength -= 10;
}

/*
* Bullish price against weak structure:
* tactical rebound only.
*/

if (
priceConflict &&
ndxPriceScore >= 60
) {
strength -= 5;
}

return strength;
}


/* ======================================================
RUSSELL PRICE OVERLAY
====================================================== */

function applyRussellPriceOverlay(
strength: number
) {

if (rutPriceScore >= 75) {
strength += 15;
}
else if (rutPriceScore >= 60) {
strength += 8;
}

/*
* Russell acceleration is particularly
* important for rotation.
*/

if (
rutMomentum5D >= 2 &&
rutAcceleration >= 0.5
) {
strength += 8;
}

if (rutPriceScore <= 25) {
strength -= 18;
}
else if (rutPriceScore <= 40) {
strength -= 10;
}

if (
rutMomentum5D <= -3 &&
rutAcceleration <= -0.5
) {
strength -= 10;
}

return strength;
}


/* ======================================================
NASDAQ PUT
====================================================== */

function evaluateNasdaqPut() {

let strength = 0;
let state = "NEUTRAL";
let driver = "NONE";


/* --------------------------------------------------
BASE DECISION
-------------------------------------------------- */

if (putDecision === "PANIC_SHORT") {
strength = 82;
driver = "PANIC_SHORT";
}

else if (
putDecision === "TRANSITIONAL_SHORT"
) {
strength = 68;
driver = "TRANSITIONAL_SHORT";
}

else if (
putDecision === "STRUCTURAL_BUILD"
) {
strength = 58;
driver = "STRUCTURAL_SHORT";
}

else if (
putDecision === "DEFENSIVE_BUILD"
) {
strength = 42;
driver = "DEFENSIVE_SHORT";
}

else if (putDecision === "AGGRESSIVE") {
strength = 75;
driver = "PUT_FLOW";
}

else if (putDecision === "ADD") {
strength = 60;
driver = "PUT_FLOW";
}

else if (putDecision === "BUILD") {
strength = 45;
driver = "PUT_FLOW";
}

else if (putDecision === "EARLY") {
strength = 30;
driver = "EARLY_BREAKDOWN";
}


/* --------------------------------------------------
EDGE
-------------------------------------------------- */

strength =
applyEdgeOverlay(strength);


/* --------------------------------------------------
RISK SUPPORT
-------------------------------------------------- */

if (mode === "RISK") {
strength += 8;
}

if (deterioratingBreadth) {
strength += 5;
}

if (participationErosion) {
strength += 6;
}

if (risingCrashRisk) {
strength += 6;
}

if (prolongedDistribution) {
strength += 5;
}

if (prolongedBearRegime) {
strength += 5;
}

if (severeBearRegime) {
strength += 7;
}

if (broadParticipationFailure) {
strength += 5;
}

if (severeParticipationFailure) {
strength += 7;
}


/* --------------------------------------------------
ROTATION BREAKDOWN
-------------------------------------------------- */

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

if (
decayState === "DISTRIBUTION_ROTATION"
) {
strength += 8;
}

if (
decayState === "EXHAUSTED_ROTATION"
) {
strength += 10;
}

if (decayScore >= 75) {
strength += 6;
}


/* --------------------------------------------------
PHASE
-------------------------------------------------- */

if (
phaseConfirmed &&
phaseConfidence >= 70
) {
strength += 5;
}

if (
!phaseConfirmed &&
phaseRisk
) {
strength -= 10;
}


/* --------------------------------------------------
PRICE
-------------------------------------------------- */

strength =
applyPutPriceOverlay(strength);


/* --------------------------------------------------
HARD SAFETY
-------------------------------------------------- */

/*
* A strong bullish impulse may be a rebound,
* but it prevents an aggressive short classification.
*/

if (
bullishImpulse &&
ndxPriceScore >= 70 &&
!bearishImpulse
) {
strength =
Math.min(
strength,
55
);
}


strength =
Math.max(
0,
Math.min(
100,
Math.round(strength)
)
);


/* --------------------------------------------------
STATE
-------------------------------------------------- */

if (strength >= 75) {
state = "SHORT_ATTACK";
}
else if (strength >= 40) {
state = "SHORT_BUILDING";
}
else if (strength >= 20) {
state = "EARLY_DEFENSIVE_SHORT";
}
else {
state = "NEUTRAL";
}


return {

instrument: "NASDAQ_PUT",

direction: "SHORT",

state,

strength,

driver,

price: {
score: ndxPriceScore,
momentum5D: ndxMomentum5D,
momentum20D: ndxMomentum20D,
acceleration: ndxAcceleration,
state: priceState
}

};
}


/* ======================================================
NASDAQ CALL
====================================================== */

function evaluateNasdaqCall() {

let strength = 0;
let state = "NEUTRAL";
let driver = "NONE";


/* --------------------------------------------------
BASE
-------------------------------------------------- */

if (
nasdaqCallDecision === "AGGRESSIVE"
) {
strength = 70;
driver = "NASDAQ_CALL";
}

else if (
nasdaqCallDecision === "ADD"
) {
strength = 55;
driver = "NASDAQ_CALL";
}

else if (
nasdaqCallDecision === "BUILD"
) {
strength = 45;
driver = "NASDAQ_CALL";
}

else if (
nasdaqCallDecision === "EARLY"
) {
strength = 30;
driver = "NASDAQ_REBOUND";
}


/* --------------------------------------------------
STRUCTURAL FILTER
-------------------------------------------------- */

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


/* --------------------------------------------------
RISK MODE
-------------------------------------------------- */

if (mode === "RISK") {
strength -= 15;
}


/* --------------------------------------------------
ROTATION DECAY
-------------------------------------------------- */

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

if (
decayState === "DISTRIBUTION_ROTATION"
) {
strength -= 10;
}

if (
decayState === "EXHAUSTED_ROTATION"
) {
strength -= 12;
}

if (decayScore > 70) {
strength -= 6;
}


/* --------------------------------------------------
PHASE
-------------------------------------------------- */

if (phase === "PHASE_3_DISTRIBUTION") {
strength =
Math.min(
strength,
35
);
}

if (phaseRisk) {
strength =
Math.min(
strength,
20
);
}

if (
phaseBreakdown ||
phaseAcceleration ||
phaseCapitulation
) {
strength = 0;
}


/* --------------------------------------------------
EXECUTION
-------------------------------------------------- */

if (executionMode === "WAIT") {
strength -= 15;
}

if (!phaseConfirmed) {
strength -= 20;
}

if (phaseConfidence < 55) {
strength -= 10;
}


/* --------------------------------------------------
REGIME
-------------------------------------------------- */

if (!regimeAligned) {
strength -= 15;
}

if (!institutionalAligned) {
strength -= 10;
}


/* --------------------------------------------------
POSITIVE CONFIRMATION
-------------------------------------------------- */

if (
phaseConfirmed &&
phaseConfidence >= 80
) {
strength += 5;
}


/* --------------------------------------------------
PRICE
-------------------------------------------------- */

strength =
applyCallPriceOverlay(strength);


if (
bullishImpulse &&
ndxPriceScore >= 60 &&
strength >= 20
) {
strength += 4;
}


strength =
Math.max(
0,
Math.min(
100,
Math.round(strength)
)
);


/* --------------------------------------------------
STATE
-------------------------------------------------- */

if (strength >= 75) {
state = "LONG_ATTACK";
}
else if (strength >= 40) {
state = "LONG_BUILDING";
}
else if (strength >= 20) {
state = "EARLY_LONG";
}
else {
state = "NEUTRAL";
}


return {

instrument: "NASDAQ_CALL",

direction: "LONG",

state,

strength,

driver,

price: {
score: ndxPriceScore,
momentum5D: ndxMomentum5D,
momentum20D: ndxMomentum20D,
acceleration: ndxAcceleration,
state: priceState
}

};
}


/* ======================================================
RUSSELL CALL
====================================================== */

function evaluateRussellCall() {

let strength = 0;
let state = "NEUTRAL";
let driver = "NONE";


/* --------------------------------------------------
BASE ROTATION DECISION
-------------------------------------------------- */

if (
russellDecision === "AGGRESSIVE"
) {
strength = 70;
driver = "ROTATION";
}

else if (
russellDecision === "ADD"
) {
strength = 55;
driver = "ROTATION";
}

else if (
russellDecision === "BUILD"
) {
strength = 45;
driver = "ROTATION";
}

/*
* FIX:
* Russell EARLY was previously ignored.
*/

else if (
russellDecision === "EARLY"
) {
strength = 30;
driver = "ROTATION_EARLY";
}


/* --------------------------------------------------
EDGE
-------------------------------------------------- */

strength =
applyEdgeOverlay(strength);


/* --------------------------------------------------
RISK MODE
-------------------------------------------------- */

if (mode === "RISK") {
strength -= 15;
}

if (deterioratingBreadth)
strength -= 8;

if (participationErosion)
strength -= 12;

if (risingCrashRisk)
strength -= 10;

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


/*
* Leadership concentration is NOT
* automatically bullish for Russell.
*
* It only reduces confidence slightly
* because leadership may be narrow.
*/

if (leadershipConcentration)
strength -= 5;


/* --------------------------------------------------
ROTATION QUALITY
-------------------------------------------------- */

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

if (rotationParticipation >= 70)
strength += 4;

if (falseBreakRisk > 65)
strength -= 18;


/* --------------------------------------------------
ROTATION DECAY
-------------------------------------------------- */

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

if (
decayState === "DISTRIBUTION_ROTATION"
) {
strength -= 20;
}

if (
decayState === "EXHAUSTED_ROTATION"
) {
strength -= 25;
}

if (decayScore > 70)
strength -= 10;


/* --------------------------------------------------
PHASE CONFIRMATION
-------------------------------------------------- */

if (
!phaseConfirmed &&
phaseRisk
) {
strength -= 10;
}

if (
phaseConfirmed &&
phaseConfidence > 70
) {
strength += 5;
}


/* --------------------------------------------------
EXECUTION
-------------------------------------------------- */

if (executionMode === "WAIT")
strength -= 20;

if (!phaseConfirmed)
strength -= 25;

if (phaseConfidence < 55)
strength -= 15;


/* --------------------------------------------------
REGIME
-------------------------------------------------- */

if (!regimeAligned)
strength -= 15;

if (!institutionalAligned)
strength -= 10;


/* --------------------------------------------------
PRICE MOMENTUM
-------------------------------------------------- */

strength =
applyRussellPriceOverlay(strength);


/*
* Important:
*
* Strong Russell price momentum alone
* cannot create a confirmed rotation.
*/

if (
rutPriceScore >= 70 &&
rotationState !== "CONFIRMED" &&
rotationState !==
"INSTITUTIONAL_CONFIRMATION"
) {
strength =
Math.min(
strength,
35
);
}


/*
* Strong Russell downside rejects
* the CALL.
*/

if (
rutPriceScore <= 30 &&
rutAcceleration <= -0.5
) {
strength =
Math.min(
strength,
20
);
}


/* --------------------------------------------------
PHASE CAPS
-------------------------------------------------- */

if (
phase === "PHASE_3_DISTRIBUTION"
) {
strength =
Math.min(
strength,
35
);
}

if (phaseRisk) {
strength =
Math.min(
strength,
15
);
}

if (
phaseBreakdown ||
phaseAcceleration ||
phaseCapitulation
) {
strength = 0;
}


/* --------------------------------------------------
FINAL
-------------------------------------------------- */

strength =
Math.max(
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

driver,

price: {
score: rutPriceScore,
momentum5D: rutMomentum5D,
momentum20D: rutMomentum20D,
acceleration: rutAcceleration,
state: priceState
}

};
}


/* ======================================================
EVALUATE
====================================================== */

const nasdaqPutStack =
evaluateNasdaqPut();

const nasdaqCallStack =
evaluateNasdaqCall();

const russellCallStack =
evaluateRussellCall();


/* ======================================================
PRIMARY CANDIDATES
====================================================== */

const candidates = [
nasdaqPutStack,
nasdaqCallStack,
russellCallStack
];


/*
* Only candidates with meaningful
* strength are eligible.
*/

const activeCandidates =
candidates.filter(
candidate =>
candidate.strength >= 20
);


/* ======================================================
PRIMARY
====================================================== */

const primary =
activeCandidates.length > 0
? [...activeCandidates].sort(
(a, b) =>
b.strength -
a.strength
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
primary.instrument ===
"NASDAQ_PUT"
) {

stackState =
primary.strength >= 75
? "SHORT_ATTACK"
: primary.strength >= 40
? "SHORT_BUILDING"
: "EARLY_DEFENSIVE_SHORT";

}

else if (
primary.instrument ===
"NASDAQ_CALL"
) {

stackState =
primary.strength >= 75
? "LONG_ATTACK"
: primary.strength >= 40
? "LONG_BUILDING"
: "EARLY_LONG";

}

else if (
primary.instrument ===
"RUSSELL_CALL"
) {

stackState =
primary.strength >= 75
? "LONG_ATTACK"
: primary.strength >= 40
? "LONG_BUILDING"
: "EARLY_LONG";

}


/* ======================================================
TRADE CONFLICT
====================================================== */

const shortStrength =
nasdaqPutStack.strength;

const longStrength =
Math.max(
nasdaqCallStack.strength,
russellCallStack.strength
);


/*
* If short and long are nearly equally strong,
* the system should prefer WAIT rather than
* forcing a directional decision.
*/

const directionalConflict =
shortStrength >= 40 &&
longStrength >= 40 &&
Math.abs(
shortStrength -
longStrength
) < 10;


if (directionalConflict) {

stackState = "CONFLICT";

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
directionalConflict
? Math.min(
primary.strength,
35
)
: primary.strength,

driver:
directionalConflict
? "DIRECTIONAL_CONFLICT"
: primary.driver,


primaryFlow: {

instrument:
directionalConflict
? "NONE"
: primary.instrument,

direction:
directionalConflict
? "NONE"
: primary.direction,

state:
directionalConflict
? "NEUTRAL"
: primary.state,

strength:
directionalConflict
? 0
: primary.strength,

driver:
directionalConflict
? "DIRECTIONAL_CONFLICT"
: primary.driver

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

score:
edgeScore,

tier:
edgeTier

},


priceMomentum: {

score:
priceScore,

state:
priceState,

direction:
priceDirection,

acceleration:
priceAcceleration,

bullishImpulse,

bearishImpulse,

coolingPrice,

conflict:
priceConflict

},


meta: {

putDecision,

nasdaqCallDecision,

russellDecision,

mode,

phase,

phaseConfirmed,

phaseConfidence,

rotationState,

rotationConfidence,

rotationQuality,

sustainability,

participation:
rotationParticipation,

falseBreakRisk,

decayState,

decayScore,

executionMode,

regimeAligned,

institutionalAligned,

directionalConflict

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
