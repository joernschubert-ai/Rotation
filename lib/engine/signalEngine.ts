// /lib/engine/signalEngine.ts

// =====================================================
// SIGNAL ENGINE V3
// =====================================================
//
// PURPOSE:
//
// Pure signal / classification layer.
//
// The engine does NOT:
// - execute trades
// - size positions
// - override executionState
// - decide portfolio allocation
// - generate ATTACK / BUILD / REDUCE commands
//
// It classifies the current market setup:
//
// LONG_SETUP
// SHORT_SETUP
// RISK_WARNING
// ROTATION_SIGNAL
// NONE
//
// Execution remains the responsibility of the
// execution / state layer.
// =====================================================


// =====================================================
// GLOBAL STATE
// =====================================================

let lastSignal: any = null;
let history: any[] = [];


// =====================================================
// HELPERS
// =====================================================

const clamp = (
value: number,
min = 0,
max = 100
) =>
Math.max(
min,
Math.min(max, Number(value) || 0)
);


const num = (
value: any,
fallback = 0
) =>
Number.isFinite(Number(value))
? Number(value)
: fallback;


const bool = (
value: any,
fallback = false
) =>
typeof value === "boolean"
? value
: fallback;


// =====================================================
// EARLY WARNING NORMALIZATION
// =====================================================
//
// Supports both:
//
// score: 5
//
// and:
//
// score: {
// value: 5,
// max: 14
// }
// =====================================================

function normalizeEarlyWarning(
earlyWarning: any
) {

const rawScore =
earlyWarning?.score;

const score =
typeof rawScore === "object"
? num(rawScore?.value, 0)
: num(rawScore, 0);

const max =
typeof rawScore === "object"
? num(rawScore?.max, 14)
: 14;

return {

active:
bool(
earlyWarning?.active,
false
),

score,

max,

ratio:
max > 0
? score / max
: 0
};
}


// =====================================================
// ENGINE
// =====================================================

export function signalEngine({

phase,

crash,

putTiming,

rotation,

earlyWarning,

tradeStack,

regimeSync,

dangerZone,

executionState,

rotationConfirm,

rotationDecay,

liquidity,

breadthThrust,

fragility,

squeeze,

participation,

priceMomentum,

priceMomentumEngine,

master,

masterScore,

divergence,

sizing,

exit

}: any) {


// =====================================================
// PRICE MOMENTUM
// =====================================================

const momentumSource =
priceMomentum ??
priceMomentumEngine ??
master?.priceMomentum ??
masterScore?.priceMomentum ??
master?.components?.priceMomentum ??
masterScore?.components?.priceMomentum ??
null;


const priceScore =
clamp(
num(
momentumSource?.score ??
momentumSource?.priceMomentumScore ??
momentumSource?.momentumScore ??
momentumSource?.value ??
momentumSource?.totalScore,
50
)
);


const priceState =
momentumSource?.state ??
momentumSource?.momentumState ??
"NEUTRAL";


const priceDirection =
momentumSource?.direction ??
momentumSource?.trend ??
momentumSource?.momentumDirection ??
"FLAT";


const priceAcceleration =
num(
momentumSource?.acceleration ??
momentumSource?.momentumAcceleration ??
momentumSource?.velocity,
50
);


const bullishPrice =
priceScore >= 65 &&
(
priceState === "STRONG" ||
priceState === "POSITIVE" ||
priceDirection === "UP" ||
priceDirection === "BULLISH"
);


const bearishPrice =
priceScore <= 35 &&
(
priceState === "STRONG_NEGATIVE" ||
priceState === "NEGATIVE" ||
priceDirection === "DOWN" ||
priceDirection === "BEARISH"
);


// =====================================================
// EARLY WARNING
// =====================================================

const warning =
normalizeEarlyWarning(
earlyWarning
);


// =====================================================
// REGIME
// =====================================================

const syncAligned =
bool(
regimeSync?.aligned ??
regimeSync?.regimeAlignment,
false
);


const syncScore =
num(
regimeSync?.score ??
regimeSync?.regimeSyncScore,
50
);


const dangerLevel =
dangerZone?.level ??
"NORMAL";


const dangerEscalation =
bool(
dangerZone?.escalation,
false
);


const riskState =
executionState?.riskState ??
"STABLE";


const executionMode =
executionState?.executionMode ??
"WAIT";


// =====================================================
// MARKET FLOW
// =====================================================

const liquidityScore =
num(
liquidity?.score,
50
);


const fragilityScore =
num(
fragility?.score,
50
);


const participationScore =
num(
participation?.score,
50
);


const breadthScore =
num(
breadthThrust?.score ??
breadthThrust?.strength,
50
);


const squeezeScore =
num(
squeeze?.score,
50
);


// =====================================================
// ROTATION
// =====================================================

const rotationState =
rotationConfirm?.state ??
rotation?.state ??
"EARLY";


const rotationConfidence =
num(
rotationConfirm?.confidence,
40
);


const rotationQuality =
num(
rotationConfirm?.quality,
50
);


const sustainability =
num(
rotationConfirm?.sustainability,
50
);


const decayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";


const decayScore =
num(
rotationDecay?.score,
0
);


// =====================================================
// PUT TIMING
// =====================================================

const putDecision =
putTiming?.decision ??
"NO_TRADE";


const putTimingState =
putTiming?.timing ??
"WAIT";


const putScore =
num(
putTiming?.score?.value ??
putTiming?.score,
0
);


// =====================================================
// TRADE STACK
// =====================================================

const stackType =
tradeStack?.type ??
"NONE";


const stackStrength =
num(
tradeStack?.strength,
0
);


const stackState =
tradeStack?.state ??
"NEUTRAL";


// =====================================================
// PHASE CLASSIFICATION
// =====================================================

const distribution =
phase ===
"PHASE_3_DISTRIBUTION";


const riskPhase =
phase ===
"PHASE_4_RISK";


const breakdownPhase =
phase ===
"PHASE_5_BREAKDOWN";


const accelerationPhase =
phase ===
"PHASE_6_ACCELERATION";


const capitulationPhase =
phase ===
"PHASE_7_CAPITULATION";


// =====================================================
// STRUCTURAL SHORT ENVIRONMENT
// =====================================================
//
// Important:
//
// We don't require panic.
// A distribution / risk regime can already
// generate a SHORT_SETUP.
//
// =====================================================

const structuralShort =
distribution ||
riskPhase ||
breakdownPhase ||
accelerationPhase ||
capitulationPhase;


const shortStructureQuality =
clamp(
(
stackStrength * 0.35 +
decayScore * 0.20 +
fragilityScore * 0.15 +
(100 - liquidityScore) * 0.10 +
(100 - participationScore) * 0.10 +
(warning.ratio * 100) * 0.10
)
);


// =====================================================
// STRUCTURAL LONG ENVIRONMENT
// =====================================================

const strongRotation =
rotationState === "CONFIRMED" ||
rotationState ===
"INSTITUTIONAL_CONFIRMATION";


const healthyRotation =
decayState ===
"HEALTHY_ROTATION" &&
decayScore < 28;


const longEnvironment =
strongRotation &&
healthyRotation &&
syncAligned &&
rotationConfidence >= 75 &&
rotationQuality >= 70 &&
participationScore >= 60 &&
fragilityScore < 65 &&
liquidityScore > 40;


// =====================================================
// SHORT CONFIRMATION
// =====================================================

const shortConfirmation =
stackType === "SHORT" &&
stackStrength >= 10 &&
structuralShort &&
(
putDecision !== "NO_TRADE" ||
warning.active ||
decayScore >= 60 ||
fragilityScore >= 70
);


// =====================================================
// LONG CONFIRMATION
// =====================================================

const longConfirmation =
stackType === "LONG" &&
stackStrength >= 20 &&
longEnvironment &&
bullishPrice;


// =====================================================
// RISK WARNING
// =====================================================

const riskWarning =

dangerLevel === "HIGH" ||

dangerEscalation ||

riskState === "BREAKDOWN" ||

riskState === "CRISIS" ||

fragilityScore >= 75 ||

decayScore >= 65 ||

warning.active;


// =====================================================
// ROTATION SIGNAL
// =====================================================

const rotationSignal =

strongRotation &&

rotationQuality >= 65 &&

sustainability >= 60 &&

decayScore < 60;


// =====================================================
// SIGNAL SELECTION
// =====================================================
//
// Priority:
//
// 1. SHORT_SETUP
// 2. LONG_SETUP
// 3. ROTATION_SIGNAL
// 4. RISK_WARNING
// 5. NONE
//
// This prevents a generic risk warning from hiding
// an actual directional setup.
// =====================================================

let type =
"NONE";


let strength =
0;


let priority =
"LOW";


let message =
"No actionable market signal";


let quality =
"LOW";


// =====================================================
// SHORT SETUP
// =====================================================

if (shortConfirmation) {

strength =
clamp(
Math.round(
20 +
shortStructureQuality * 0.70 +
(bearishPrice ? 10 : 0) +
(warning.active ? 5 : 0)
)
);


type =
"SHORT_SETUP";


priority =
strength >= 70
? "HIGH"
: strength >= 45
? "MEDIUM"
: "LOW";


message =
bearishPrice
? "Distribution/risk structure + downside price confirmation"
: "Distribution/risk structure supports defensive short positioning";


quality =
bearishPrice
? "CONFIRMED"
: stackStrength >= 40
? "STRUCTURAL"
: "EARLY";
}


// =====================================================
// LONG SETUP
// =====================================================

else if (longConfirmation) {

strength =
clamp(
Math.round(
25 +
rotationConfidence * 0.25 +
rotationQuality * 0.20 +
sustainability * 0.15 +
priceScore * 0.15
)
);


type =
"LONG_SETUP";


priority =
strength >= 75
? "HIGH"
: strength >= 50
? "MEDIUM"
: "LOW";


message =
"Confirmed rotation + healthy structure + price momentum";


quality =
rotationState ===
"INSTITUTIONAL_CONFIRMATION"
? "INSTITUTIONAL"
: "CONFIRMED";
}


// =====================================================
// ROTATION SIGNAL
// =====================================================

else if (rotationSignal) {

strength =
clamp(
Math.round(
rotationConfidence * 0.40 +
rotationQuality * 0.30 +
sustainability * 0.20 +
syncScore * 0.10
)
);


type =
"ROTATION_SIGNAL";


priority =
strength >= 70
? "HIGH"
: "MEDIUM";


message =
"Rotation developing with structural confirmation";


quality =
rotationState ===
"INSTITUTIONAL_CONFIRMATION"
? "INSTITUTIONAL"
: "CONFIRMED";
}


// =====================================================
// RISK WARNING
// =====================================================

else if (riskWarning) {

strength =
clamp(
Math.round(
Math.max(
warning.ratio * 100,
decayScore,
fragilityScore,
dangerEscalation
? 75
: 0
)
)
);


type =
"RISK_WARNING";


priority =
strength >= 70
? "HIGH"
: "MEDIUM";


message =
warning.active
? "Early warning active → defensive posture"
: "Market risk elevated → defensive posture";


quality =
strength >= 75
? "CONFIRMED"
: "EARLY";
}


// =====================================================
// CONTEXT
// =====================================================

const signal = {

active:
type !== "NONE",

type,

strength,

priority,

message,

quality,

timestamp:
Date.now(),

context: {

phase,

tradeStack: {

type:
stackType,

state:
stackState,

strength:
stackStrength
},

putTiming: {

decision:
putDecision,

timing:
putTimingState,

score:
putScore
},

earlyWarning: {

active:
warning.active,

score:
warning.score,

max:
warning.max,

ratio:
warning.ratio
},

rotation: {

state:
rotationState,

confidence:
rotationConfidence,

quality:
rotationQuality,

sustainability,

decayState,

decayScore
},

priceMomentum: {

available:
Boolean(momentumSource),

score:
priceScore,

state:
priceState,

direction:
priceDirection,

acceleration:
priceAcceleration,

bullish:
bullishPrice,

bearish:
bearishPrice
},

market: {

liquidity:
liquidityScore,

participation:
participationScore,

fragility:
fragilityScore,

breadth:
breadthScore,

squeeze:
squeezeScore
},

regime: {

syncAligned,

syncScore,

dangerLevel,

riskState,

executionMode
}

}
};


// =====================================================
// ANTI SPAM
// =====================================================

if (
lastSignal &&

lastSignal.type ===
signal.type &&

lastSignal.message ===
signal.message
) {

return {

signal,

history
};
}


// =====================================================
// SAVE
// =====================================================

lastSignal =
signal;


history.unshift(
signal
);


if (
history.length > 30
) {

history =
history.slice(
0,
30
);
}


// =====================================================
// RETURN
// =====================================================

return {

signal,

history
};
}
