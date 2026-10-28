// /lib/engine/signalEngine.ts

// =====================================================
// SIGNAL ENGINE V4
// =====================================================
//
// PURPOSE:
//
// Pure signal / classification layer.
//
// The engine does NOT:
//
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
// IMPORTANT ARCHITECTURE:
//
// Phase = market regime
// Mode = trading posture
// Signal = directional opportunity
//
// These three concepts are deliberately separated.
//
// The Trade Stack is contextual evidence.
// It is NOT the authority for directional signal generation.
//
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
Math.min(
max,
Number(value) || 0
)
);


const num = (
value: any,
fallback = 0
) =>
Number.isFinite(
Number(value)
)
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
//
// =====================================================

function normalizeEarlyWarning(
earlyWarning: any
) {

const rawScore =
earlyWarning?.score;

const score =
typeof rawScore === "object"
? num(
rawScore?.value,
0
)
: num(
rawScore,
0
);

const max =
typeof rawScore === "object"
? num(
rawScore?.max,
14
)
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


// ===================================================
// PRICE MOMENTUM
// ===================================================

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


/*
* Acceleration is a directional/change value.
*
* It is NOT a 0..100 score.
*
* Therefore the neutral default is 0.
*/

const priceAcceleration =
num(
momentumSource?.acceleration ??
momentumSource?.momentumAcceleration ??
momentumSource?.velocity,
0
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


// ===================================================
// EARLY WARNING
// ===================================================

const warning =
normalizeEarlyWarning(
earlyWarning
);


// ===================================================
// REGIME / EXECUTION CONTEXT
// ===================================================

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


const marketMode =
executionState?.marketMode ??
"RISK_ON";


// ===================================================
// CRASH
// ===================================================

const crashScore =
num(
crash?.score,
0
);


const crashProbability =
num(
crash?.probability,
0
);


const crashActive =
crashScore >= 60 ||
crashProbability >= 50;


const severeCrash =
crashScore >= 75 ||
crashProbability >= 70;


// ===================================================
// MARKET FLOW
// ===================================================

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


// ===================================================
// ROTATION
// ===================================================

const rotationState =
rotationConfirm?.state ??
rotation?.state ??
"EARLY";


const rotationConfidence =
num(
rotationConfirm?.confidence ??
rotation?.confidence,
40
);


const rotationQuality =
num(
rotationConfirm?.quality ??
rotation?.quality,
50
);


const sustainability =
num(
rotationConfirm?.sustainability ??
rotation?.sustainability,
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


// ===================================================
// PUT TIMING
// ===================================================

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


// ===================================================
// TRADE STACK
// ===================================================
//
// IMPORTANT:
//
// TradeStack is contextual evidence.
//
// It is NOT required to create a directional
// signal anymore.
//
// This is deliberate.
//
// Signal authority:
//
// Phase
// + structural confirmation
// + directional confirmation
//
// TradeStack can strengthen the result.
//
// ===================================================

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


// ===================================================
// PHASE CLASSIFICATION
// ===================================================

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


const crashPhase =
breakdownPhase ||
accelerationPhase ||
capitulationPhase;


// ===================================================
// MASTER SCORE CONTEXT
// ===================================================
//
// Master Score is risk intensity.
//
// LOW = constructive / CALL
// HIGH = defensive / PUT
//
// It is NOT used as a direct mode assignment.
//
// ===================================================

const masterRiskScore =
clamp(
num(
master?.score ??
masterScore?.score ??
masterScore,
50
)
);


const masterPutZone =
masterRiskScore >= 65;


const masterStrongPutZone =
masterRiskScore >= 80;


const masterCallZone =
masterRiskScore <= 35;


// ===================================================
// STRUCTURAL SHORT ENVIRONMENT
// ===================================================
//
// IMPORTANT:
//
// P3 DISTRIBUTION is NOT a short signal.
//
// Distribution means:
//
// "market structure is deteriorating"
//
// but does not automatically mean:
//
// "directional short opportunity is confirmed".
//
// Therefore structuralShort begins at P4.
//
// ===================================================

const structuralShort =
riskPhase ||
breakdownPhase ||
accelerationPhase ||
capitulationPhase;


// ===================================================
// SHORT STRUCTURE QUALITY
// ===================================================
//
// This measures defensive structural evidence.
//
// Higher = stronger short evidence.
//
// ===================================================

const shortStructureQuality =
clamp(
(
stackStrength * 0.15 +

decayScore * 0.15 +

fragilityScore * 0.20 +

(100 - liquidityScore) * 0.10 +

(100 - participationScore) * 0.15 +

(100 - breadthScore) * 0.10 +

warning.ratio * 100 * 0.05 +

crashScore * 0.10

)
);


// ===================================================
// DEFENSIVE STRUCTURAL EVIDENCE
// ===================================================

const weakParticipation =
participationScore <= 35;


const severeWeakParticipation =
participationScore <= 25;


const weakLiquidity =
liquidityScore <= 40;


const severeWeakLiquidity =
liquidityScore <= 30;


const highFragility =
fragilityScore >= 68;


const severeFragility =
fragilityScore >= 82;


const highRotationDecay =
decayScore >= 55;


const severeRotationDecay =
decayScore >= 70;


const weakBreadth =
breadthScore <= 40;


const severeBreadth =
breadthScore <= 30;


const elevatedSqueeze =
squeezeScore >= 65;


const extremeSqueeze =
squeezeScore >= 80;


const structuralRiskCount =

Number(
highFragility
) +

Number(
highRotationDecay
) +

Number(
weakParticipation
) +

Number(
weakLiquidity
) +

Number(
weakBreadth
) +

Number(
warning.active
) +

Number(
crashActive
) +

Number(
masterPutZone
);


const strongDefensiveStructure =
structuralRiskCount >= 4;


const moderateDefensiveStructure =
structuralRiskCount >= 3;


// ===================================================
// P4 SHORT CONFIRMATION
// ===================================================
//
// P4 is a risk regime.
//
// It can produce a PUT signal, but only when
// the underlying deterioration is sufficiently
// confirmed.
//
// This prevents:
//
// P4 + RISK
//
// from automatically becoming PUT.
//
// ===================================================

const p4DefensiveConfirmation =

(
strongDefensiveStructure
) ||

(
severeFragility &&
(
highRotationDecay ||
weakParticipation ||
weakBreadth ||
crashActive
)
) ||

(
highFragility &&
highRotationDecay &&
(
weakParticipation ||
weakBreadth ||
crashActive ||
warning.active
)
) ||

(
crashActive &&
(
highFragility ||
highRotationDecay ||
weakParticipation ||
weakBreadth
)
);


// ===================================================
// CRASH PHASE CONFIRMATION
// ===================================================
//
// P5-P7 represent materially more severe regimes.
//
// These phases require less additional evidence,
// because the phase engine has already identified
// a major structural deterioration.
//
// =====================================================

const crashPhaseConfirmation =

crashPhase &&

(
severeFragility ||

severeRotationDecay ||

severeBreadth ||

severeWeakParticipation ||

crashActive ||

warning.active ||

masterStrongPutZone
);


// ===================================================
// PUT TIMING CONFIRMATION
// ===================================================
//
// PutTiming is supporting evidence.
//
// It must NOT independently create a PUT signal.
//
// ===================================================

const structuralPutTiming =
putDecision ===
"STRUCTURAL_BUILD";


const activePutTiming =
putDecision !==
"NO_TRADE" &&
putTimingState !==
"WAIT";


// ===================================================
// SHORT DIRECTIONAL CONFIRMATION
// ===================================================
//
// Final short confirmation.
//
// IMPORTANT:
//
// P3 is explicitly excluded.
//
// P4 requires stronger structural evidence.
//
// P5-P7 use the crash-phase confirmation.
//
// ===================================================

let shortConfirmation =
false;


if (
riskPhase
) {

shortConfirmation =
p4DefensiveConfirmation;

}


if (
crashPhase
) {

shortConfirmation =
crashPhaseConfirmation;

}


// ===================================================
// P3 DISTRIBUTION GUARD
// ===================================================
//
// Distribution can create:
//
// RISK_WARNING
//
// but NOT automatically:
//
// SHORT_SETUP
//
// This is the explicit protection against the
// 2022 / 2024 false PUT cases.
//
// ===================================================

if (
distribution
) {

shortConfirmation =
false;

}


// ===================================================
// LONG ENVIRONMENT
// ===================================================

const strongRotation =
rotationState ===
"CONFIRMED" ||

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


// ===================================================
// LONG CONFIRMATION
// ===================================================
//
// TradeStack may support the long setup, but the
// structural market conditions remain authoritative.
//
// ===================================================

const longConfirmation =

stackType === "LONG" &&

stackStrength >= 20 &&

longEnvironment &&

bullishPrice;


// ===================================================
// ROTATION SIGNAL
// ===================================================

const rotationSignal =

strongRotation &&

rotationQuality >= 65 &&

sustainability >= 60 &&

decayScore < 60;


// ===================================================
// RISK WARNING
// ===================================================
//
// Risk Warning is deliberately broader than a
// directional PUT signal.
//
// Therefore:
//
// high risk != automatic PUT
//
// ===================================================

const riskWarning =

dangerLevel === "HIGH" ||

dangerEscalation ||

riskState === "BREAKDOWN" ||

riskState === "CRISIS" ||

fragilityScore >= 75 ||

decayScore >= 65 ||

warning.active ||

(
marketMode === "RISK_OFF" &&
moderateDefensiveStructure
);


// ===================================================
// SIGNAL SELECTION
// ===================================================
//
// Priority:
//
// 1. SHORT_SETUP
// 2. LONG_SETUP
// 3. ROTATION_SIGNAL
// 4. RISK_WARNING
// 5. NONE
//
// ===================================================

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


// ===================================================
// SHORT SETUP
// ===================================================

if (
shortConfirmation
) {

/*
* Base structural strength.
*/

let shortStrength =

20 +

shortStructureQuality * 0.55;


/*
* Phase confirmation.
*/

if (
riskPhase
) {

shortStrength += 8;

}


if (
breakdownPhase
) {

shortStrength += 12;

}


if (
accelerationPhase
) {

shortStrength += 16;

}


if (
capitulationPhase
) {

shortStrength += 14;

}


/*
* Independent confirmation.
*/

if (
bearishPrice
) {

shortStrength += 10;

}


if (
crashActive
) {

shortStrength += 8;

}


if (
severeFragility
) {

shortStrength += 6;

}


if (
severeRotationDecay
) {

shortStrength += 5;

}


if (
warning.active
) {

shortStrength += 4;

}


/*
* PutTiming supports but does not dominate.
*/

if (
structuralPutTiming
) {

shortStrength += 4;

}


if (
activePutTiming
) {

shortStrength += 2;

}


/*
* TradeStack can reinforce the signal.
*
* It cannot create it.
*/

if (
stackType === "SHORT"
) {

shortStrength +=
Math.min(
8,
stackStrength * 0.10
);

}


strength =
clamp(
Math.round(
shortStrength
)
);


type =
"SHORT_SETUP";


priority =
strength >= 75
? "HIGH"
: strength >= 50
? "MEDIUM"
: "LOW";


if (
capitulationPhase ||
accelerationPhase ||
breakdownPhase
) {

message =
bearishPrice
? "Confirmed crash structure + downside price confirmation"
: "Confirmed crash structure supports defensive short positioning";

}

else {

message =
bearishPrice
? "Confirmed risk structure + downside price confirmation"
: "Confirmed risk structure supports defensive short positioning";

}


quality =
severeCrash ||
(
severeFragility &&
severeRotationDecay
)
? "CONFIRMED"
: strongDefensiveStructure
? "STRUCTURAL"
: "EARLY";

}


// ===================================================
// LONG SETUP
// ===================================================

else if (
longConfirmation
) {

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


// ===================================================
// ROTATION SIGNAL
// ===================================================

else if (
rotationSignal
) {

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


// ===================================================
// RISK WARNING
// ===================================================
//
// This is intentionally separate from SHORT_SETUP.
//
// This is where P3 Distribution should normally land.
//
// ===================================================

else if (
riskWarning
) {

strength =
clamp(
Math.round(

Math.max(

warning.ratio * 100,

decayScore,

fragilityScore,

crashScore,

masterRiskScore >= 65
? masterRiskScore
: 0,

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


if (
distribution
) {

message =
"Distribution structure detected → defensive warning";

}

else if (
warning.active
) {

message =
"Early warning active → defensive posture";

}

else {

message =
"Market risk elevated → defensive posture";

}


quality =
strength >= 75
? "CONFIRMED"
: "EARLY";

}


// ===================================================
// NONE
// ===================================================

else {

type =
"NONE";


strength =
0;


priority =
"LOW";


message =
"No actionable market signal";


quality =
"LOW";

}


// ===================================================
// CONTEXT
// ===================================================

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
putScore,

structural:
structuralPutTiming,

active:
activePutTiming

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
Boolean(
momentumSource
),

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

crash: {

score:
crashScore,

probability:
crashProbability,

active:
crashActive,

severe:
severeCrash

},

master: {

score:
masterRiskScore,

putZone:
masterPutZone,

strongPutZone:
masterStrongPutZone,

callZone:
masterCallZone

},

defensiveStructure: {

count:
structuralRiskCount,

moderate:
moderateDefensiveStructure,

strong:
strongDefensiveStructure,

highFragility,

severeFragility,

highRotationDecay,

severeRotationDecay,

weakParticipation,

severeWeakParticipation,

weakLiquidity,

severeWeakLiquidity,

weakBreadth,

severeBreadth,

elevatedSqueeze,

extremeSqueeze

},

signalConfirmation: {

structuralShort,

p4DefensiveConfirmation,

crashPhaseConfirmation,

shortConfirmation,

longEnvironment,

longConfirmation,

rotationSignal

},

regime: {

syncAligned,

syncScore,

dangerLevel,

riskState,

executionMode,

marketMode

}

}

};


// ===================================================
// ANTI SPAM
// ===================================================

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


// ===================================================
// SAVE
// ===================================================

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


// ===================================================
// RETURN
// =====================================================

return {

signal,

history

};

}
