// /lib/engine/tradeStackEngine.ts

export function tradeStackEngine({
phase,
putTiming,

nasdaqCall,
russell,

// NEU
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
CENTRAL EDGE
====================================================== */

const edgeScore =
Number(edgeState?.score ?? 0);

const edgeTier =
edgeState?.tier ?? "NO_EDGE";


/* ======================================================
PRICE MOMENTUM
====================================================== */

const priceScore =
Number(
priceMomentum?.score ?? 50
);

const priceMomentum5D =
Number(
priceMomentum?.momentum5D ?? 0
);

const priceMomentum20D =
Number(
priceMomentum?.momentum20D ?? 0
);

const priceAcceleration =
Number(
priceMomentum?.acceleration ?? 0
);

const priceState =
priceMomentum?.state ?? "NEUTRAL";

const priceDirection =
priceMomentum?.direction ?? "FLAT";

const priceStructureAlignment =
priceMomentum?.structureAlignment ??
"UNKNOWN";


/*
* Individual NASDAQ momentum
*
* Important:
* TradeStack is primarily a NASDAQ strategy.
*/

const ndxPriceScore =
Number(
priceMomentum?.ndx?.score ?? priceScore
);

const ndxMomentum5D =
Number(
priceMomentum?.ndx?.momentum5D ??
priceMomentum5D
);

const ndxMomentum20D =
Number(
priceMomentum?.ndx?.momentum20D ??
priceMomentum20D
);

const ndxAcceleration =
Number(
priceMomentum?.ndx?.acceleration ??
priceAcceleration
);


/*
* Russell momentum
*/

const rutPriceScore =
Number(
priceMomentum?.rut?.score ?? priceScore
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
PRICE FLAGS
====================================================== */

const strongBullishPrice =
priceScore >= 75;

const bullishPrice =
priceScore >= 60;

const neutralPrice =
priceScore > 40 &&
priceScore < 60;

const bearishPrice =
priceScore <= 40;

const strongBearishPrice =
priceScore <= 25;


const bullishImpulse =
Boolean(
priceMomentum?.bullishImpulse
);

const bearishImpulse =
Boolean(
priceMomentum?.bearishImpulse
);

const acceleratingPrice =
Boolean(
priceMomentum?.accelerating
);

const deceleratingPrice =
Boolean(
priceMomentum?.decelerating
);

const coolingPrice =
Boolean(
priceMomentum?.cooling
);

const priceLeadingStructure =
Boolean(
priceMomentum?.priceLeadingStructure
);

const structureLeadingPrice =
Boolean(
priceMomentum?.structureLeadingPrice
);

const priceConflict =
Boolean(
priceMomentum?.conflict
);


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
PRICE OVERLAY — NASDAQ PUT
====================================================== */

function applyPutPriceOverlay(
strength: number
) {

/*
* Strong downside momentum confirms the short.
*/

if (strongBearishPrice) {
strength += 12;
}
else if (bearishPrice) {
strength += 7;
}


/*
* Immediate downside impulse is more important
* than slow 20D deterioration.
*/

if (bearishImpulse) {
strength += 8;
}


/*
* Accelerating downside = stronger confirmation.
*/

if (
acceleratingPrice &&
priceDirection === "DOWN"
) {
strength += 5;
}


/*
* Strong bullish price action is a warning
* against initiating/increasing a PUT.
*/

if (strongBullishPrice) {
strength -= 15;
}
else if (bullishPrice) {
strength -= 8;
}


/*
* A bullish rebound while structure remains weak
* is not automatically a CALL signal.
*
* It simply reduces PUT conviction.
*/

if (
coolingPrice &&
priceDirection === "UP"
) {
strength -= 5;
}


/*
* Price/structure conflict:
*
* price bullish + structure bearish
* = do not aggressively short the rebound.
*/

if (
priceConflict &&
strongBullishPrice
) {
strength -= 8;
}


return strength;
}


/* ======================================================
PRICE OVERLAY — NASDAQ CALL
====================================================== */

function applyCallPriceOverlay(
strength: number
) {

/*
* CALL requires positive price confirmation.
*/

if (strongBullishPrice) {
strength += 15;
}
else if (bullishPrice) {
strength += 8;
}


/*
* Bullish impulse is the strongest fast
* confirmation for a rebound/trend continuation.
*/

if (bullishImpulse) {
strength += 8;
}


if (
acceleratingPrice &&
priceDirection === "UP"
) {
strength += 5;
}


/*
* Bearish price momentum heavily suppresses
* NASDAQ CALL.
*/

if (strongBearishPrice) {
strength -= 18;
}
else if (bearishPrice) {
strength -= 10;
}


if (bearishImpulse) {
strength -= 10;
}


/*
* Price/structure conflict:
*
* strong price rebound against weak structure
* = tactical rebound, NOT confirmed bull regime.
*
* Therefore only limited bonus.
*/

if (
priceLeadingStructure &&
bullishPrice
) {
strength -= 3;
}


return strength;
}


/* ======================================================
PRICE OVERLAY — RUSSELL CALL
====================================================== */

function applyRussellPriceOverlay(
strength: number
) {

/*
* Russell CALL needs Russell price confirmation.
*/

if (rutPriceScore >= 75) {
strength += 15;
}
else if (rutPriceScore >= 60) {
strength += 8;
}


/*
* Russell acceleration is especially important
* for detecting the beginning of rotation.
*/

if (
rutMomentum5D >= 2 &&
rutAcceleration >= 0.5
) {
strength += 8;
}


/*
* Strong Russell downside invalidates
* the rotation thesis.
*/

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

let state = "NEUTRAL";
let strength = 0;
let driver = "NONE";


/* --------------------------------------------------
BASE DECISION
-------------------------------------------------- */

if (putDecision === "PANIC_SHORT") {

state = "SHORT_ATTACK";
strength = 82;
driver = "PANIC_SHORT";

}

else if (putDecision === "TRANSITIONAL_SHORT") {

state = "SHORT_BUILDING";
strength = 68;
driver = "TRANSITIONAL_SHORT";

}

else if (putDecision === "STRUCTURAL_BUILD") {

state = "SHORT_BUILDING";
strength = 58;
driver = "STRUCTURAL_SHORT";

}

else if (putDecision === "DEFENSIVE_BUILD") {

state = "DEFENSIVE_SHORT";
strength = 42;
driver = "DEFENSIVE_SHORT";

}

/*
* Backward compatibility with old putTiming
*/

else if (putDecision === "AGGRESSIVE") {

state = "SHORT_ATTACK";
strength = 75;
driver = "PUT_FLOW";

}

else if (putDecision === "ADD") {

state = "SHORT_BUILDING";
strength = 60;
driver = "PUT_FLOW";

}

else if (putDecision === "BUILD") {

state = "DEFENSIVE_SHORT";
strength = 45;
driver = "PUT_FLOW";

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


/* --------------------------------------------------
EDGE
-------------------------------------------------- */

strength =
applyEdgeOverlay(strength);


/* --------------------------------------------------
RISK MODE
-------------------------------------------------- */

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


/* --------------------------------------------------
ROTATION BREAKDOWN SUPPORT
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


/* --------------------------------------------------
PHASE CONFIDENCE
-------------------------------------------------- */

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


/* --------------------------------------------------
PRICE MOMENTUM
-------------------------------------------------- */

strength =
applyPutPriceOverlay(strength);


/*
* A PUT can be structurally strong even while
* price momentum is temporarily bullish.
*
* But a strong bullish impulse prevents
* SHORT_ATTACK classification.
*/

if (
strongBullishPrice &&
!bearishImpulse
) {
strength =
Math.min(strength, 55);
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

driver,

price: {
score: priceScore,
momentum5D: ndxMomentum5D,
momentum20D: ndxMomentum20D,
acceleration: ndxAcceleration,
state: priceState,
alignment: priceStructureAlignment
}

};
}


/* ======================================================
NASDAQ CALL
====================================================== */

function evaluateNasdaqCall() {

let state = "NEUTRAL";
let strength = 0;
let driver = "NONE";


/* --------------------------------------------------
BASE DECISION
-------------------------------------------------- */

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

if (deterioratingBreadth)
strength -= 8;

if (participationErosion)
strength -= 12;

if (risingCrashRisk)
strength -= 10;

if (prolongedDistribution)
strength -= 10;
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

if (decayScore > 70)
strength -= 6;


/* --------------------------------------------------
PHASE FILTER
-------------------------------------------------- */

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


/* --------------------------------------------------
EXECUTION FILTER
-------------------------------------------------- */

if (
executionMode === "WAIT"
) {
strength -= 15;
}

if (!phaseConfirmed)
strength -= 20;

if (phaseConfidence < 55)
strength -= 10;


/* --------------------------------------------------
REGIME ALIGNMENT
-------------------------------------------------- */

if (!regimeAligned)
strength -= 15;

if (!institutionalAligned)
strength -= 10;


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
EDGE
-------------------------------------------------- */

if (edgeScore >= 80)
strength += 10;

else if (edgeScore >= 60)
strength += 6;

else if (edgeScore < 20)
strength -= 10;


/* --------------------------------------------------
PRICE MOMENTUM
-------------------------------------------------- */

strength =
applyCallPriceOverlay(strength);


/*
* Critical:
*
* A strong bullish price impulse is allowed
* to make an EARLY CALL attractive.
*
* But it cannot bypass structural filters.
*/

if (
bullishImpulse &&
priceScore >= 60 &&
strength >= 20
) {
strength += 4;
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
state: priceState,
alignment: priceStructureAlignment
}

};
}


/* ======================================================
RUSSELL CALL
====================================================== */

function evaluateRussellCall() {

let state = "NEUTRAL";
let strength = 0;
let driver = "NONE";


/* --------------------------------------------------
BASE ROTATION DECISION
-------------------------------------------------- */

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


/* --------------------------------------------------
EDGE
-------------------------------------------------- */

strength =
applyEdgeOverlay(strength);


/* --------------------------------------------------
RISK MODE
-------------------------------------------------- */

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


/* --------------------------------------------------
ROTATION QUALITY
-------------------------------------------------- */

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

if (decayScore > 70)
strength -= 10;


/* --------------------------------------------------
PHASE CONFIRMATION
-------------------------------------------------- */

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


/* --------------------------------------------------
EXECUTION
-------------------------------------------------- */

if (
executionMode === "WAIT"
) {
strength -= 20;
}

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
* Strong Russell momentum is useful only
* when rotation itself is not broken.
*/

if (
rutPriceScore >= 70 &&
rotationState !== "CONFIRMED" &&
rotationState !== "INSTITUTIONAL_CONFIRMATION"
) {
strength =
Math.min(strength, 35);
}


/*
* A strong Russell downside impulse is a
* direct rejection of the CALL.
*/

if (
rutPriceScore <= 30 &&
rutAcceleration <= -0.5
) {
strength =
Math.min(strength, 20);
}


/* --------------------------------------------------
PHASE CAPS
-------------------------------------------------- */

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
state: priceState,
alignment: priceStructureAlignment
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

score:
edgeScore,

tier:
edgeTier

},


priceMomentum: {

score:
priceScore,

momentum5D:
priceMomentum5D,

momentum20D:
priceMomentum20D,

acceleration:
priceAcceleration,

state:
priceState,

direction:
priceDirection,

structureAlignment:
priceStructureAlignment,

bullishImpulse,
bearishImpulse,
coolingPrice,
acceleratingPrice,
deceleratingPrice,

priceLeadingStructure,
structureLeadingPrice,
conflict:
priceConflict

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
