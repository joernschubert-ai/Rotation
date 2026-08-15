// /lib/engine/exitLongEngine.ts

export function exitLongEngine(
input: any,
instrument:
| "NASDAQ_CALL"
| "RUSSELL_CALL" = "NASDAQ_CALL"
) {

const {
phase,
marketPhase,

master = {},
tradeStack = {},
dangerZone = {},
rotationDecay = {},
rotationConfirm = {},
crash = {},
fragility = {},
systemHeat = {},
participation = {},
liquidity = {},
priceMomentum = {},
russell = {},
rotation = {}
} = input;

/* =====================================================
SAFE INPUTS
===================================================== */

const currentPhase =
phase ??
marketPhase ??
"PHASE_3_DISTRIBUTION";

const dangerScore =
Number(dangerZone?.score ?? 0);

const decayScore =
Number(rotationDecay?.score ?? 0);

const decayState =
rotationDecay?.state ?? "HEALTHY_ROTATION";

const rotationState =
rotationConfirm?.state ?? "NONE";

const rotationConfidence =
Number(rotationConfirm?.confidence ?? 0);

const rotationQuality =
Number(rotationConfirm?.quality ?? 50);

const sustainability =
Number(rotationConfirm?.sustainability ?? 50);

const rotationParticipation =
Number(rotationConfirm?.participation ?? 50);

const falseBreakRisk =
Number(rotationConfirm?.falseBreakRisk ?? 50);

const fragilityScore =
Number(fragility?.score ?? 50);

const liquidityScore =
Number(liquidity?.score ?? 50);

const participationScore =
Number(participation?.score ?? 50);

const masterScore =
Number(master?.score ?? 50);

const crashProbability =
Number(crash?.probability ?? 0);

const heat =
Number(systemHeat?.value ?? 0);

/* =====================================================
INSTRUMENT-SPECIFIC TRADE STRENGTH
===================================================== */

const tradeStrength =
Number(
instrument === "RUSSELL_CALL"
? (
tradeStack?.russellCall?.strength ??
0
)
: (
tradeStack?.nasdaqCall?.strength ??
0
)
);

const tradeState =
instrument === "RUSSELL_CALL"
? (
tradeStack?.russellCall?.state ??
"NEUTRAL"
)
: (
tradeStack?.nasdaqCall?.state ??
"NEUTRAL"
);

/* =====================================================
PRICE
===================================================== */

const priceScore =
Number(
instrument === "RUSSELL_CALL"
? (
priceMomentum?.rut?.score ??
priceMomentum?.score ??
50
)
: (
priceMomentum?.ndx?.score ??
priceMomentum?.score ??
50
)
);

const momentum5D =
Number(
instrument === "RUSSELL_CALL"
? (
priceMomentum?.rut?.momentum5D ??
0
)
: (
priceMomentum?.ndx?.momentum5D ??
0
)
);

const acceleration =
Number(
instrument === "RUSSELL_CALL"
? (
priceMomentum?.rut?.acceleration ??
0
)
: (
priceMomentum?.ndx?.acceleration ??
0
)
);

const bullishImpulse =
Boolean(
priceMomentum?.bullishImpulse
);

const bearishImpulse =
Boolean(
priceMomentum?.bearishImpulse
);

/* =====================================================
RUSSELL-SPECIFIC ROTATION DATA
===================================================== */

const russellDecision =
russell?.decision ??
russell?.action ??
"NONE";

const rsSmall =
Number(
russell?.rsSmall ??
rotation?.rsSmall ??
1
);

const rsGrowth =
Number(
russell?.rsGrowth ??
rotation?.rsGrowth ??
1
);

/* =====================================================
FULL LONG EXIT
===================================================== */

if (

currentPhase === "PHASE_5_BREAKDOWN" ||

currentPhase === "PHASE_6_ACCELERATION" ||

currentPhase === "PHASE_7_CAPITULATION" ||

dangerScore >= 90 ||

masterScore <= 20 ||

crashProbability >= 75 ||

heat <= -2

) {

return {

instrument,

direction: "LONG",

action: "EXIT LONG",

sizeReduction: 100,

reason:
"Structural breakdown confirmed",

priority: "CRITICAL"

};
}

/* =====================================================
RUSSELL ROTATION FAILURE
===================================================== */

if (

instrument === "RUSSELL_CALL" &&

(
decayState === "ROTATION_FAILURE" ||
decayState === "DISTRIBUTION_ROTATION" ||
decayState === "EXHAUSTED_ROTATION"
) &&

decayScore >= 70

) {

return {

instrument,

direction: "LONG",

action: "EXIT RUSSELL",

sizeReduction:
decayScore >= 85
? 100
: 70,

reason:
"Russell rotation thesis invalidated",

priority: "HIGH"

};
}

/* =====================================================
RUSSELL FALSE BREAK
===================================================== */

if (

instrument === "RUSSELL_CALL" &&

falseBreakRisk >= 75 &&

rotationState !== "INSTITUTIONAL_CONFIRMATION"

) {

return {

instrument,

direction: "LONG",

action: "REDUCE RUSSELL",

sizeReduction: 60,

reason:
"High false-break risk in Russell rotation",

priority: "HIGH"

};
}

/* =====================================================
RUSSELL INTERNAL BREAKDOWN
===================================================== */

if (

instrument === "RUSSELL_CALL" &&

(
rotationState === "INTERNAL_BREAKDOWN" ||
rotationState === "ROTATION_FAILURE"
)

) {

return {

instrument,

direction: "LONG",

action: "REDUCE RUSSELL",

sizeReduction: 70,

reason:
"Russell internal rotation breakdown",

priority: "HIGH"

};
}

/* =====================================================
HEAVY STRUCTURAL REDUCTION
===================================================== */

if (

dangerScore >= 70 ||

masterScore <= 35 ||

fragilityScore >= 75 ||

heat <= -1 ||

crashProbability >= 60

) {

return {

instrument,

direction: "LONG",

action: "REDUCE LONG",

sizeReduction: 70,

reason:
"Confirmed structural deterioration",

priority: "HIGH"

};
}

/* =====================================================
RUSSELL MOMENTUM FAILURE
===================================================== */

if (

instrument === "RUSSELL_CALL" &&

(
priceScore <= 30 ||
momentum5D <= -3 ||
acceleration <= -0.5
)

) {

return {

instrument,

direction: "LONG",

action: "TRIM RUSSELL",

sizeReduction: 50,

reason:
"Russell price momentum invalidates rotation thesis",

priority: "MEDIUM"

};
}

/* =====================================================
NASDAQ MOMENTUM FAILURE
===================================================== */

if (

instrument === "NASDAQ_CALL" &&

priceScore <= 25 &&

bearishImpulse

) {

return {

instrument,

direction: "LONG",

action: "TRIM NASDAQ",

sizeReduction: 50,

reason:
"NASDAQ downside momentum invalidates long thesis",

priority: "MEDIUM"

};
}

/* =====================================================
EARLY DECAY
===================================================== */

if (

dangerScore >= 50 ||

decayState === "EARLY_DECAY" ||

(
decayScore >= 50 &&
rotationConfidence < 55
)

) {

return {

instrument,

direction: "LONG",

action:
instrument === "RUSSELL_CALL"
? "TRIM RUSSELL"
: "TRIM NASDAQ",

sizeReduction: 30,

reason:
"Early structural deterioration",

priority: "MEDIUM"

};
}

/* =====================================================
RUSSELL ROTATION QUALITY DETERIORATION
===================================================== */

if (

instrument === "RUSSELL_CALL" &&

(
rotationQuality < 50 ||
sustainability < 50 ||
rotationParticipation < 50
)

) {

return {

instrument,

direction: "LONG",

action: "TRIM RUSSELL",

sizeReduction: 25,

reason:
"Rotation quality deteriorating",

priority: "LOW"

};
}

/* =====================================================
RUSSELL RELATIVE STRENGTH FAILURE
===================================================== */

if (

instrument === "RUSSELL_CALL" &&

rsSmall < 0.995 &&

rsGrowth > rsSmall

) {

return {

instrument,

direction: "LONG",

action: "TRIM RUSSELL",

sizeReduction: 20,

reason:
"Small-cap relative strength losing leadership",

priority: "LOW"

};
}

/* =====================================================
HEALTHY NASDAQ LONG
===================================================== */

if (

instrument === "NASDAQ_CALL" &&

masterScore >= 60 &&

dangerScore < 40 &&

tradeStrength >= 60 &&

heat > -0.4 &&

participationScore >= 60

) {

return {

instrument,

direction: "LONG",

action: "HOLD NASDAQ",

sizeReduction: 0,

reason:
"NASDAQ long structure remains intact",

priority: "NORMAL"

};
}

/* =====================================================
HEALTHY RUSSELL LONG
===================================================== */

if (

instrument === "RUSSELL_CALL" &&

tradeStrength >= 60 &&

rotationState === "INSTITUTIONAL_CONFIRMATION" &&

rotationConfidence >= 70 &&

rotationQuality >= 65 &&

sustainability >= 60 &&

falseBreakRisk < 50 &&

decayScore < 45 &&

rsSmall >= 1

) {

return {

instrument,

direction: "LONG",

action: "HOLD RUSSELL",

sizeReduction: 0,

reason:
"Institutional Russell rotation remains intact",

priority: "NORMAL"

};
}

/* =====================================================
DEFAULT
===================================================== */

return {

instrument,

direction: "LONG",

action:
instrument === "RUSSELL_CALL"
? "MANAGE RUSSELL"
: "MANAGE NASDAQ",

sizeReduction: 15,

reason:
tradeState !== "NEUTRAL"
? "Neutral transition regime"
: "No confirmed long exit trigger",

priority: "LOW"

};
}
