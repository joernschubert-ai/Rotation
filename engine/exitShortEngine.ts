// /lib/engine/exitShortEngine.ts

export function exitShortEngine(input: any) {

const {
phase,
marketPhase,

master = {},
tradeStack = {},
dangerZone = {},
crash = {},
rotationDecay = {},
rotationConfirm = {},
systemHeat = {},
participation = {},
liquidity = {},
fragility = {},
priceMomentum = {}
} = input;

/* =====================================================
SAFE INPUTS
===================================================== */

const currentPhase =
phase ??
marketPhase ??
"PHASE_3_DISTRIBUTION";

const crashProbability =
Number(crash?.probability ?? 0);

const decayScore =
Number(rotationDecay?.score ?? 0);

const decayState =
rotationDecay?.state ?? "HEALTHY_ROTATION";

const rotationState =
rotationConfirm?.state ?? "NONE";

const rotationConfidence =
Number(rotationConfirm?.confidence ?? 0);

const participationScore =
Number(participation?.score ?? 50);

const liquidityScore =
Number(liquidity?.score ?? 50);

const fragilityScore =
Number(fragility?.score ?? 50);

const masterScore =
Number(master?.score ?? 50);

const dangerScore =
Number(dangerZone?.score ?? 0);

const heat =
Number(systemHeat?.value ?? 0);

/* =====================================================
TRADE STACK — ACTUAL NASDAQ PUT STRENGTH
===================================================== */

const tradeStrength =
Number(
tradeStack?.nasdaqPut?.strength ??
tradeStack?.primaryFlow?.strength ??
tradeStack?.strength ??
0
);

const tradeState =
tradeStack?.nasdaqPut?.state ??
"NEUTRAL";

/* =====================================================
PRICE
===================================================== */

const ndxPrice =
priceMomentum?.ndx ??
priceMomentum ??
{};


const ndxPriceScore =
Number(
ndxPrice?.score ??
50
);


const bearishImpulse =
Boolean(
ndxPrice?.bearishImpulse ??
priceMomentum?.bearishImpulse
);


const bullishImpulse =
Boolean(
ndxPrice?.bullishImpulse ??
priceMomentum?.bullishImpulse
);


const priceDirection =
ndxPrice?.direction ??
"FLAT";


/* =====================================================
FULL SYSTEM COLLAPSE
===================================================== */

if (

currentPhase === "PHASE_7_CAPITULATION" ||

dangerScore >= 90 ||

crashProbability >= 90 ||

heat <= -2.2

) {

return {

instrument: "NASDAQ_PUT",

direction: "SHORT",

action: "EXIT MAJORITY",

sizeReduction: 80,

reason:
"Capitulation or systemic reversal risk",

priority: "CRITICAL"

};
}

/* =====================================================
CRASH / PANIC CLIMAX
===================================================== */

if (

crashProbability >= 80 ||

dangerScore >= 80 ||

(
currentPhase === "PHASE_6_ACCELERATION" &&
fragilityScore >= 80
)

) {

return {

instrument: "NASDAQ_PUT",

direction: "SHORT",

action: "REDUCE HARD",

sizeReduction: 70,

reason:
"Crash climax / high reversal risk",

priority: "HIGH"

};
}

/* =====================================================
VOLATILITY CLIMAX
===================================================== */

if (

dangerScore >= 70 &&

fragilityScore >= 75 &&

crashProbability >= 60

) {

return {

instrument: "NASDAQ_PUT",

direction: "SHORT",

action: "TRIM FAST",

sizeReduction: 50,

reason:
"Volatility climax detected",

priority: "HIGH"

};
}

/* =====================================================
BULLISH REVERSAL AGAINST SHORT
===================================================== */

if (

bullishImpulse &&

ndxPriceScore >= 75 &&

priceDirection === "UP"

) {

return {

instrument: "NASDAQ_PUT",

direction: "SHORT",

action: "TRIM",

sizeReduction: 50,

reason:
"Strong bullish NASDAQ reversal against short",

priority: "HIGH"

};
}

/* =====================================================
STRUCTURAL RECOVERY
===================================================== */

if (

masterScore >= 65 &&

dangerScore < 40 &&

fragilityScore < 55 &&

decayScore < 45 &&

participationScore >= 60 &&

rotationState === "CONFIRMED" &&

tradeStrength < 40

) {

return {

instrument: "NASDAQ_PUT",

direction: "SHORT",

action: "TRIM",

sizeReduction: 35,

reason:
"Internal market recovery weakening short thesis",

priority: "MEDIUM"

};
}

/* =====================================================
ROTATION RECOVERY
===================================================== */

if (

decayState === "HEALTHY_ROTATION" &&

decayScore < 35 &&

rotationState === "CONFIRMED" &&

participationScore >= 65

) {

return {

instrument: "NASDAQ_PUT",

direction: "SHORT",

action: "TRIM",

sizeReduction: 25,

reason:
"Rotation recovery reduces short edge",

priority: "MEDIUM"

};
}

/* =====================================================
PRICE RECOVERY
===================================================== */

if (

ndxPriceScore >= 65 &&

!bearishImpulse &&

tradeStrength < 45

) {

return {

instrument: "NASDAQ_PUT",

direction: "SHORT",

action: "TRIM",

sizeReduction: 20,

reason:
"NASDAQ price recovery without sufficient short confirmation",

priority: "LOW"

};
}

/* =====================================================
HOLD STRONG SHORT
===================================================== */

if (

tradeStrength >= 60 &&

(
currentPhase === "PHASE_4_RISK" ||
currentPhase === "PHASE_5_BREAKDOWN" ||
currentPhase === "PHASE_6_ACCELERATION"
) &&

dangerScore >= 35 &&

fragilityScore >= 55

) {

return {

instrument: "NASDAQ_PUT",

direction: "SHORT",

action: "HOLD SHORT",

sizeReduction: 0,

reason:
"Short thesis remains structurally supported",

priority: "NORMAL"

};
}

/* =====================================================
DEFAULT
===================================================== */

return {

instrument: "NASDAQ_PUT",

direction: "SHORT",

action: "HOLD SHORT",

sizeReduction: 0,

reason:
tradeState !== "NEUTRAL"
? "Current short structure remains valid"
: "No confirmed short exit trigger",

priority: "NORMAL"

};
}
