// /lib/engine/signalEngine.ts

// =====================================================
// SIGNAL ENGINE V2
// =====================================================
//
// Architecture:
//
// 1. Regime / Risk
// 2. Rotation Confirmation
// 3. Rotation Decay
// 4. Price Momentum
// 5. Market Flow
// 6. Signal Construction
// 7. Priority / Quality
// 8. Anti Spam / History
//
// V1 is intentionally kept separately as backup.
// Existing imports remain unchanged.
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
Math.min(max, Number(value) || 0)
);


const num = (
value: any,
fallback = 50
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
// ENGINE
// =====================================================

export function signalEngine({

phase,
phaseConfirmation,

crash,
putTiming,
rotation,
earlyWarning,

exit,
decision,
tradeStack,
divergence,
sizing,

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

// ===================================================
// NEW V2 INPUT
// ===================================================
//
// The engine accepts the Price Momentum Engine in a
// deliberately flexible way so the integration does
// not break if the exact backend naming differs.
//
priceMomentum,
priceMomentumEngine,

// Optional Master Score object. This allows V2 to use
// the already integrated momentum component without
// forcing a second implementation.
master,
masterScore

}: any) {

// ===================================================
// PRICE MOMENTUM SOURCE
// ===================================================

const momentumSource =
priceMomentum ??
priceMomentumEngine ??
master?.priceMomentum ??
masterScore?.priceMomentum ??
master?.components?.priceMomentum ??
masterScore?.components?.priceMomentum ??
null;


// ===================================================
// REGIME SYNC
// ===================================================

const syncAligned =
regimeSync?.aligned ??
regimeSync?.regimeAlignment ??
false;

const syncScore =
num(
regimeSync?.score ??
regimeSync?.regimeSyncScore,
50
);


// ===================================================
// DANGER / EXECUTION
// ===================================================

const dangerLevel =
dangerZone?.level ??
"NORMAL";

const dangerEscalation =
bool(
dangerZone?.escalation,
false
);

const executionMode =
executionState?.executionMode ??
"WAIT";

const riskState =
executionState?.riskState ??
"STABLE";


// ===================================================
// ROTATION CONFIRM
// ===================================================

const rotationState =
rotationConfirm?.state ??
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

const phaseConfirmed =
bool(
rotationConfirm?.phaseConfirmed,
true
);

const phaseConfidence =
num(
rotationConfirm?.phaseConfidence,
50
);

const participationValue =
num(
rotationConfirm?.participation,
50
);

const liquiditySupport =
num(
rotationConfirm?.liquiditySupport,
50
);

const falseBreakRisk =
num(
rotationConfirm?.falseBreakRisk,
50
);

const squeezeRisk =
bool(
rotationConfirm?.squeezeRisk,
false
);

const megaCapOnly =
bool(
rotationConfirm?.megaCapOnly,
false
);

const fragileStructure =
bool(
rotationConfirm?.fragileStructure,
false
);


// ===================================================
// ROTATION DECAY
// ===================================================

const decayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";

const decayScore =
num(
rotationDecay?.score,
0
);

const rotationMomentumQuality =
num(
rotationDecay?.momentumQuality,
70
);

const narrowLeadership =
bool(
rotationDecay?.signals?.narrowLeadership
);

const hiddenDistribution =
bool(
rotationDecay?.signals?.hiddenDistribution
);

const structuralDeterioration =
bool(
rotationDecay?.signals?.structuralDeterioration
);

const thrustFailure =
bool(
rotationDecay?.signals?.thrustFailure
);


// ===================================================
// FLOW OVERLAYS
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

const squeezeRiskScore =
num(
squeeze?.score,
50
);

const participationScore =
num(
participation?.score,
50
);

const breadthThrustScore =
num(
breadthThrust?.score,
50
);


// ===================================================
// PRICE MOMENTUM V2
// ===================================================
//
// IMPORTANT:
//
// Price momentum is not treated as an independent
// trading system.
//
// It is a confirmation / veto layer.
//
// This prevents:
//
// strong price momentum + weak structure
//
// from automatically becoming a long signal.
//
// ===================================================

const priceMomentumScore =
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


const priceMomentumState =
momentumSource?.state ??
momentumSource?.momentumState ??
(
priceMomentumScore >= 72
? "STRONG"
: priceMomentumScore >= 55
? "POSITIVE"
: priceMomentumScore <= 28
? "STRONG_NEGATIVE"
: priceMomentumScore <= 45
? "NEGATIVE"
: "NEUTRAL"
);


const priceMomentumTrend =
momentumSource?.trend ??
momentumSource?.direction ??
momentumSource?.momentumDirection ??
"NEUTRAL";


const priceMomentumAcceleration =
num(
momentumSource?.acceleration ??
momentumSource?.momentumAcceleration ??
momentumSource?.velocity,
50
);


const priceMomentumConfirmedLong =
priceMomentumScore >= 65 &&
(
priceMomentumState === "STRONG" ||
priceMomentumState === "POSITIVE" ||
priceMomentumTrend === "UP" ||
priceMomentumTrend === "BULLISH"
);


const priceMomentumConfirmedShort =
priceMomentumScore <= 35 &&
(
priceMomentumState === "STRONG_NEGATIVE" ||
priceMomentumState === "NEGATIVE" ||
priceMomentumTrend === "DOWN" ||
priceMomentumTrend === "BEARISH"
);


const priceMomentumWeakLong =
priceMomentumScore < 45;


const priceMomentumWeakShort =
priceMomentumScore > 55;


const priceMomentumDeteriorating =
priceMomentumAcceleration < 40;


const priceMomentumImproving =
priceMomentumAcceleration > 60;


// ===================================================
// BASE SIGNAL
// ===================================================

let signal: any = {
active: false,
type: "NONE",
strength: 0,
message: "",
priority: "LOW",
timestamp: Date.now(),
quality: "LOW",

context: {

phase,

tradeStack,
divergence,
sizing,

regimeSync,
dangerZone,
executionState,

rotationConfirm,
rotationDecay,

priceMomentum:
momentumSource
? {
score: priceMomentumScore,
state: priceMomentumState,
trend: priceMomentumTrend,
acceleration:
priceMomentumAcceleration
}
: null
}
};


// ===================================================
// HARD RISK BLOCK
// ===================================================

const hardRiskBlock =
dangerLevel === "EXTREME" ||
riskState === "CRISIS";


// ===================================================
// LONG ENVIRONMENT
// ===================================================

const lowQualityRotation =
rotationQuality < 52;

const extremeFalseBreakRisk =
falseBreakRisk >= 78;

const dangerousLongEnvironment =

extremeFalseBreakRisk ||

(
squeezeRisk &&
megaCapOnly
) ||

fragilityScore >= 72 ||

liquidityScore <= 38 ||

participationScore <= 42;


// ===================================================
// ROTATION DECAY
// ===================================================

const severeDecay =

decayState === "ROTATION_FAILURE" ||

decayScore >= 72;


const internalBreakdown =

decayState === "INTERNAL_BREAKDOWN" ||

decayScore >= 52;


const weakRotationMomentum =
rotationMomentumQuality < 52;


const institutionalBreakdown =

hiddenDistribution ||

structuralDeterioration ||

narrowLeadership ||

thrustFailure;


// ===================================================
// QUALITY BOOST
// ===================================================

let qualityBoost = 0;


if (syncAligned) {
qualityBoost += 10;
}


if (syncScore >= 78) {
qualityBoost += 8;
}


if (
executionMode ===
"ADD_ON_PULLBACKS"
) {
qualityBoost += 8;
}


if (
rotationState ===
"CONFIRMED"
) {
qualityBoost += 8;
}


if (phaseConfirmed) {
qualityBoost += 6;
}


if (phaseConfidence >= 70) {
qualityBoost += 6;
}


if (
rotationState ===
"INSTITUTIONAL_CONFIRMATION"
) {
qualityBoost += 18;
}


if (rotationConfidence >= 82) {
qualityBoost += 8;
}


if (rotationQuality >= 78) {
qualityBoost += 12;
}


if (sustainability >= 72) {
qualityBoost += 8;
}


if (participationValue >= 72) {
qualityBoost += 8;
}


if (liquiditySupport >= 72) {
qualityBoost += 8;
}


if (!fragileStructure) {
qualityBoost += 5;
}


if (
decayState ===
"HEALTHY_ROTATION" &&
decayScore < 18
) {
qualityBoost += 15;
}


if (
rotationMomentumQuality >= 82
) {
qualityBoost += 10;
}


if (
breadthThrustScore >= 78
) {
qualityBoost += 8;
}


// ===================================================
// PRICE MOMENTUM QUALITY BOOST
// ===================================================

//
// Momentum gets a controlled boost.
//
// It does NOT override structure.
//

if (priceMomentumConfirmedLong) {
qualityBoost += 10;
}


if (priceMomentumImproving) {
qualityBoost += 5;
}


// ===================================================
// QUALITY PENALTIES
// ===================================================

let qualityPenalty = 0;


if (dangerLevel === "HIGH") {
qualityPenalty += 15;
}


if (dangerEscalation) {
qualityPenalty += 20;
}


if (riskState === "BREAKDOWN") {
qualityPenalty += 25;
}


if (
rotationState ===
"FAILING"
) {
qualityPenalty += 25;
}


if (rotationQuality < 50) {
qualityPenalty += 20;
}


if (!phaseConfirmed) {
qualityPenalty += 12;
}


if (phaseConfidence < 40) {
qualityPenalty += 8;
}


if (falseBreakRisk >= 65) {
qualityPenalty += 15;
}


if (falseBreakRisk >= 80) {
qualityPenalty += 25;
}


if (squeezeRisk) {
qualityPenalty += 15;
}


if (megaCapOnly) {
qualityPenalty += 20;
}


if (participationValue < 55) {
qualityPenalty += 15;
}


if (fragileStructure) {
qualityPenalty += 15;
}


// ===================================================
// DECAY PENALTIES
// ===================================================

if (
decayState ===
"EARLY_DECAY"
) {
qualityPenalty += 15;
}


if (internalBreakdown) {
qualityPenalty += 30;
}


if (severeDecay) {
qualityPenalty += 45;
}


if (weakRotationMomentum) {
qualityPenalty += 20;
}


if (narrowLeadership) {
qualityPenalty += 20;
}


if (hiddenDistribution) {
qualityPenalty += 25;
}


if (structuralDeterioration) {
qualityPenalty += 25;
}


if (thrustFailure) {
qualityPenalty += 20;
}


// ===================================================
// FLOW PENALTIES
// ===================================================

if (fragilityScore >= 70) {
qualityPenalty += 15;
}


if (liquidityScore <= 40) {
qualityPenalty += 15;
}


if (squeezeRiskScore >= 75) {
qualityPenalty += 15;
}


if (participationScore <= 45) {
qualityPenalty += 15;
}


if (fragilityScore >= 85) {
qualityPenalty += 25;
}


if (liquidityScore <= 30) {
qualityPenalty += 25;
}


if (participationScore <= 35) {
qualityPenalty += 20;
}


// ===================================================
// PRICE MOMENTUM PENALTIES
// ===================================================

//
// Weak momentum is particularly important for longs.
//

if (priceMomentumWeakLong) {
qualityPenalty += 18;
}


if (
priceMomentumScore < 35
) {
qualityPenalty += 12;
}


if (
priceMomentumDeteriorating &&
priceMomentumScore < 55
) {
qualityPenalty += 10;
}


// ===================================================
// SHORT ATTACK
// ===================================================

if (

!hardRiskBlock &&

tradeStack?.type ===
"SHORT" &&

tradeStack?.strength >= 3 &&

crash?.score > 62 &&

(
dangerLevel === "HIGH" ||
dangerEscalation ||
internalBreakdown
)

) {

let strength =
92 +
qualityBoost -
qualityPenalty;


//
// Downside price momentum is a major confirmation.
//

if (
priceMomentumConfirmedShort
) {
strength += 8;
}


signal = {

active: true,

type: "PUT_ATTACK",

strength:
clamp(strength),

priority: "HIGH",

message:
priceMomentumConfirmedShort
? "Downside price momentum confirmed → attack shorts aggressively"
: "Downside structure confirmed → attack shorts",

timestamp:
Date.now(),

quality:
syncAligned &&
priceMomentumConfirmedShort
? "INSTITUTIONAL"
: priceMomentumConfirmedShort
? "CONFIRMED"
: "TACTICAL",

context: {

tradeStack,
divergence,

regimeSync,
dangerZone,
executionState,

rotationConfirm,
rotationDecay,

priceMomentum: {
score:
priceMomentumScore,

state:
priceMomentumState,

trend:
priceMomentumTrend,

acceleration:
priceMomentumAcceleration,

confirmed:
priceMomentumConfirmedShort
}
}
};
}


// ===================================================
// SHORT BUILD
// ===================================================

else if (

tradeStack?.type ===
"SHORT" &&

tradeStack?.strength >= 2 &&

earlyWarning?.score > 12

) {

let strength =
72 +
qualityBoost -
qualityPenalty;


if (
priceMomentumConfirmedShort
) {
strength += 8;
}


signal = {

active: true,

type: "PUT_BUILD",

strength:
clamp(strength),

priority:
syncAligned
? "HIGH"
: "MEDIUM",

message:
priceMomentumConfirmedShort
? "Risk building + downside price momentum → scale into puts"
: "Risk building → scale into puts",

timestamp:
Date.now(),

quality:
syncAligned &&
priceMomentumConfirmedShort
? "INSTITUTIONAL"
: syncAligned
? "CONFIRMED"
: "TACTICAL",

context: {

tradeStack,
divergence,

regimeSync,
dangerZone,
executionState,

rotationConfirm,
rotationDecay,

priceMomentum: {
score:
priceMomentumScore,

state:
priceMomentumState,

trend:
priceMomentumTrend,

acceleration:
priceMomentumAcceleration,

confirmed:
priceMomentumConfirmedShort
}
}
};
}


// ===================================================
// LONG ATTACK
// ===================================================

else if (

!hardRiskBlock &&

!dangerousLongEnvironment &&

!lowQualityRotation &&

phaseConfirmed &&

phaseConfidence >= 60 &&

!severeDecay &&

!internalBreakdown &&

!institutionalBreakdown &&

decayScore < 28 &&

syncAligned &&

dangerLevel !== "EXTREME" &&

tradeStack?.type ===
"LONG" &&

tradeStack?.strength >= 3 &&

rotation?.score > 74 &&

(
rotationState ===
"CONFIRMED" ||

rotationState ===
"INSTITUTIONAL_CONFIRMATION"
) &&

//
// NEW V2:
// price momentum must not contradict the
// institutional long setup.
//

!priceMomentumWeakLong

) {

let strength =
82 +
qualityBoost -
qualityPenalty;


if (
priceMomentumConfirmedLong
) {
strength += 8;
}


signal = {

active: true,

type: "LONG_ATTACK",

strength:
clamp(strength),

priority: "HIGH",

message:
priceMomentumConfirmedLong
? "Institutional rotation + price momentum confirmed → aggressively add longs"
: "Institutional rotation confirmed → push long exposure",

timestamp:
Date.now(),

quality:
rotationQuality >= 78 &&
priceMomentumConfirmedLong
? "INSTITUTIONAL"
: syncAligned &&
priceMomentumConfirmedLong
? "CONFIRMED"
: "TACTICAL",

context: {

tradeStack,
divergence,

regimeSync,
dangerZone,
executionState,

rotationConfirm,
rotationDecay,

priceMomentum: {
score:
priceMomentumScore,

state:
priceMomentumState,

trend:
priceMomentumTrend,

acceleration:
priceMomentumAcceleration,

confirmed:
priceMomentumConfirmedLong
}
}
};
}


// ===================================================
// LONG BUILD / ROTATION BUILD
// ===================================================

else if (

!hardRiskBlock &&

!dangerousLongEnvironment &&

phaseConfidence >= 45 &&

!severeDecay &&

decayScore < 42 &&

tradeStack?.type ===
"LONG" &&

tradeStack?.strength >= 3 &&

dangerLevel !== "EXTREME" &&

rotationState !== "FAILING"

) {

//
// NEW V2:
//
// A developing long setup with negative price
// momentum is downgraded heavily.
//

let strength =
55 +
qualityBoost -
qualityPenalty;


if (
priceMomentumConfirmedLong
) {
strength += 8;
}


if (
priceMomentumWeakLong
) {
strength -= 15;
}


signal = {

active: true,

type:
priceMomentumWeakLong
? "ROTATION_BUILD"
: "ROTATION_BUILD",

strength:
clamp(strength),

priority:
priceMomentumConfirmedLong
? "HIGH"
: rotationQuality >= 75
? "HIGH"
: syncAligned
? "HIGH"
: "MEDIUM",

message:

priceMomentumWeakLong

? "Rotation developing, but price momentum is weak → build longs cautiously"

: executionMode ===
"ADD_ON_PULLBACKS"

? "Aligned regime + price momentum → add on pullbacks"

: priceMomentumConfirmedLong

? "Rotation developing + price momentum confirmed → build longs"

: "Rotation developing → build longs gradually",

timestamp:
Date.now(),

quality:

rotationQuality >= 75 &&
priceMomentumConfirmedLong

? "INSTITUTIONAL"

: syncAligned &&
priceMomentumConfirmedLong

? "CONFIRMED"

: "EARLY",

context: {

tradeStack,
divergence,

regimeSync,
dangerZone,
executionState,

rotationConfirm,
rotationDecay,

priceMomentum: {
score:
priceMomentumScore,

state:
priceMomentumState,

trend:
priceMomentumTrend,

acceleration:
priceMomentumAcceleration,

confirmed:
priceMomentumConfirmedLong
}
}
};
}


// ===================================================
// EARLY REDUCE
// ===================================================

else if (

decayScore >= 65 &&

participationScore <= 50 &&

!severeDecay &&

!internalBreakdown

) {

signal = {

active: true,

type: "EARLY_REDUCE",

strength: 75,

priority: "HIGH",

message:
"Rotation decay + weak participation detected → reduce exposure early",

timestamp:
Date.now(),

quality:
"DEFENSIVE",

context: {

tradeStack,
divergence,

regimeSync,
dangerZone,
executionState,

rotationConfirm,
rotationDecay,

priceMomentum: {
score:
priceMomentumScore,

state:
priceMomentumState,

trend:
priceMomentumTrend,

acceleration:
priceMomentumAcceleration
}
}
};
}


// ===================================================
// REDUCE
// ===================================================

else if (

exit?.net?.sizeReduction > 15 ||

dangerEscalation ||

severeDecay ||

internalBreakdown

) {

signal = {

active: true,

type: "REDUCE",

strength:

severeDecay
? 95
: internalBreakdown
? 85
: dangerEscalation
? 80
: 65,

priority:
"HIGH",

message:

severeDecay
? "Rotation collapse detected → aggressively reduce exposure"

: internalBreakdown
? "Internal breakdown detected → reduce exposure"

: dangerEscalation
? "Danger escalation → reduce exposure"

: "Risk rising → reduce exposure",

timestamp:
Date.now(),

quality:
"DEFENSIVE",

context: {

tradeStack,
divergence,

regimeSync,
dangerZone,
executionState,

rotationConfirm,
rotationDecay,

priceMomentum: {
score:
priceMomentumScore,

state:
priceMomentumState,

trend:
priceMomentumTrend,

acceleration:
priceMomentumAcceleration
}
}
};
}


// ===================================================
// NO SIGNAL
// ===================================================

//
// If no actionable path fired, keep NONE.
//
// This is intentional.
// V2 should prefer WAIT over forcing a trade.
//


// ===================================================
// FINAL STRENGTH
// ===================================================

signal.strength =
clamp(
signal.strength
);


// ===================================================
// FINAL SIGNAL METADATA
// ===================================================

signal.context = {

...signal.context,

phase,

priceMomentum:
momentumSource
? {
available: true,

score:
priceMomentumScore,

state:
priceMomentumState,

trend:
priceMomentumTrend,

acceleration:
priceMomentumAcceleration,

confirmedLong:
priceMomentumConfirmedLong,

confirmedShort:
priceMomentumConfirmedShort,

deteriorating:
priceMomentumDeteriorating,

improving:
priceMomentumImproving
}
: {
available: false,

score: 50,

state: "UNAVAILABLE",

trend: "NEUTRAL",

acceleration: 50,

confirmedLong: false,

confirmedShort: false,

deteriorating: false,

improving: false
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

signal: {

...signal,

phase
},

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
// ===================================================

return {

signal: {

...signal,

phase
},

history
};
}
