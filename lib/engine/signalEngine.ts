// /lib/engine/signalEngine.ts

// 🔥 GLOBAL STATE
let lastSignal: any = null;
let history: any[] = [];

export function signalEngine({
phase,
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
participation
}: any) {

/* =====================================================
INPUTS
===================================================== */

const syncAligned =
regimeSync?.aligned ??
regimeSync?.regimeAlignment ??
false;

const syncScore =
regimeSync?.score ??
regimeSync?.regimeSyncScore ??
50;

const dangerLevel =
dangerZone?.level ??
"NORMAL";

const dangerEscalation =
dangerZone?.escalation ??
false;

const executionMode =
executionState?.executionMode ??
"WAIT";

const riskState =
executionState?.riskState ??
"STABLE";

/* =====================================================
ROTATION CONFIRM
===================================================== */

const rotationState =
rotationConfirm?.state ??
"EARLY";

const rotationConfidence =
Number(rotationConfirm?.confidence ?? 40);

const rotationQuality =
Number(rotationConfirm?.quality ?? 50);

const sustainability =
Number(rotationConfirm?.sustainability ?? 50);

const participationValue =
Number(rotationConfirm?.participation ?? 50);

const liquiditySupport =
Number(rotationConfirm?.liquiditySupport ?? 50);

const falseBreakRisk =
Number(rotationConfirm?.falseBreakRisk ?? 50);

const squeezeRisk =
Boolean(rotationConfirm?.squeezeRisk ?? false);

const megaCapOnly =
Boolean(rotationConfirm?.megaCapOnly ?? false);

const fragileStructure =
Boolean(rotationConfirm?.fragileStructure ?? false);

/* =====================================================
ROTATION DECAY
===================================================== */

const decayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";

const decayScore =
Number(rotationDecay?.score ?? 0);

const momentumQuality =
Number(
rotationDecay?.momentumQuality ?? 70
);

const narrowLeadership =
Boolean(
rotationDecay?.signals?.narrowLeadership
);

const hiddenDistribution =
Boolean(
rotationDecay?.signals?.hiddenDistribution
);

const structuralDeterioration =
Boolean(
rotationDecay?.signals?.structuralDeterioration
);

const thrustFailure =
Boolean(
rotationDecay?.signals?.thrustFailure
);

/* =====================================================
OVERLAYS
===================================================== */

const liquidityScore =
Number(liquidity?.score ?? 50);

const fragilityScore =
Number(fragility?.score ?? 50);

const squeezeRiskScore =
Number(squeeze?.score ?? 50);

const participationScore =
Number(participation?.score ?? 50);

const breadthThrustScore =
Number(breadthThrust?.score ?? 50);

/* =====================================================
BASE SIGNAL
===================================================== */

let signal = {
active: false,
type: "NONE",
strength: 0,
message: "",
priority: "LOW",
timestamp: Date.now(),

quality: "LOW",

context: {
tradeStack,
divergence,
regimeSync,
dangerZone,
executionState,
rotationConfirm,
rotationDecay
}
};

/* =====================================================
HARD BLOCKERS
===================================================== */

const hardRiskBlock =
dangerLevel === "EXTREME" ||
riskState === "CRISIS";

/* =====================================================
LONG ENVIRONMENT FILTERS
===================================================== */

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

/* =====================================================
ROTATION DECAY FILTERS
===================================================== */

const severeDecay =

decayState === "ROTATION_FAILURE" ||

decayScore >= 72;

const internalBreakdown =

decayState ===
"INTERNAL_BREAKDOWN" ||

decayScore >= 52;

const weakMomentum =
momentumQuality < 52;

const institutionalBreakdown =

hiddenDistribution ||

structuralDeterioration ||

narrowLeadership ||

thrustFailure;

/* =====================================================
QUALITY BOOST
===================================================== */

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
momentumQuality >= 82
) {
qualityBoost += 10;
}

if (
breadthThrustScore >= 78
) {
qualityBoost += 8;
}

/* =====================================================
QUALITY PENALTIES
===================================================== */

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

if (rotationState === "FAILING") {
qualityPenalty += 25;
}

if (rotationQuality < 50) {
qualityPenalty += 20;
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

/* =====================================================
DECAY PENALTIES
===================================================== */

if (decayState === "EARLY_DECAY") {
qualityPenalty += 15;
}

if (internalBreakdown) {
qualityPenalty += 30;
}

if (severeDecay) {
qualityPenalty += 45;
}

if (weakMomentum) {
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

/* =====================================================
FLOW PENALTIES
===================================================== */

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

/* =====================================================
SHORT ATTACK
===================================================== */

if (

!hardRiskBlock &&

tradeStack?.type === "SHORT" &&

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

signal = {
active: true,
type: "PUT_ATTACK",

strength:
Math.max(
0,
Math.min(100, strength)
),

priority: "HIGH",

message:
"Downside momentum confirmed → attack shorts aggressively",

timestamp: Date.now(),

quality:
syncAligned
? "INSTITUTIONAL"
: "TACTICAL",

context: {
tradeStack,
divergence,
regimeSync,
dangerZone,
executionState,
rotationConfirm,
rotationDecay
}
};
}

/* =====================================================
SHORT BUILD
===================================================== */

else if (

tradeStack?.type === "SHORT" &&

tradeStack?.strength >= 2 &&

earlyWarning?.score > 12

) {

let strength =
72 +
qualityBoost -
qualityPenalty;

signal = {
active: true,
type: "PUT_BUILD",

strength:
Math.max(
0,
Math.min(100, strength)
),

priority:
syncAligned
? "HIGH"
: "MEDIUM",

message:
"Risk building → scale into puts",

timestamp: Date.now(),

quality:
syncAligned
? "CONFIRMED"
: "TACTICAL",

context: {
tradeStack,
divergence,
regimeSync,
dangerZone,
executionState,
rotationConfirm,
rotationDecay
}
};
}

/* =====================================================
LONG ATTACK
===================================================== */

else if (

!hardRiskBlock &&
!dangerousLongEnvironment &&
!lowQualityRotation &&
!severeDecay &&
!internalBreakdown &&
!institutionalBreakdown &&

decayScore < 28 &&

syncAligned &&

dangerLevel !== "EXTREME" &&

tradeStack?.type === "LONG" &&

tradeStack?.strength >= 3 &&

rotation?.score > 74 &&

(
rotationState === "CONFIRMED" ||
rotationState ===
"INSTITUTIONAL_CONFIRMATION"
)

) {

let strength =
82 +
qualityBoost -
qualityPenalty;

signal = {
active: true,
type: "LONG_ATTACK",

strength:
Math.max(
0,
Math.min(100, strength)
),

priority: "HIGH",

message:
executionMode ===
"ADD_ON_PULLBACKS"
? "Institutional rotation alignment → aggressively add longs"
: "Rotation confirmed → push long exposure",

timestamp: Date.now(),

quality:
rotationQuality >= 78
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
rotationDecay
}
};
}

/* =====================================================
LONG BUILD
===================================================== */

else if (

!hardRiskBlock &&
!dangerousLongEnvironment &&
!severeDecay &&

decayScore < 42 &&

tradeStack?.type === "LONG" &&

tradeStack?.strength >= 3 &&

dangerLevel !== "EXTREME" &&

rotationState !== "FAILING"

) {

let strength =
55 +
qualityBoost -
qualityPenalty;

signal = {
active: true,
type: "ROTATION_BUILD",

strength:
Math.max(
0,
Math.min(100, strength)
),

priority:
rotationQuality >= 75
? "HIGH"
: syncAligned
? "HIGH"
: "MEDIUM",

message:
executionMode ===
"ADD_ON_PULLBACKS"
? "Aligned regime → add on pullbacks"
: "Rotation developing → build longs gradually",

timestamp: Date.now(),

quality:
rotationQuality >= 75
? "INSTITUTIONAL"
: syncAligned
? "CONFIRMED"
: "EARLY",

context: {
tradeStack,
divergence,
regimeSync,
dangerZone,
executionState,
rotationConfirm,
rotationDecay
}
};
}


/* =====================================================
EARLY REDUCE
PHASE 3 DISTRIBUTION
===================================================== */

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
"Rotation Decay + weak participation detected → reduce exposure early",

timestamp: Date.now(),

quality: "DEFENSIVE",

context: {
tradeStack,
divergence,
regimeSync,
dangerZone,
executionState,
rotationConfirm,
rotationDecay
}
};
}



/* =====================================================
REDUCE SIGNAL
===================================================== */

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

priority: "HIGH",

message:
severeDecay
? "Rotation collapse detected → aggressively reduce exposure"
: internalBreakdown
? "Internal breakdown detected → reduce exposure"
: dangerEscalation
? "Danger escalation → reduce exposure"
: "Risk rising → reduce exposure",

timestamp: Date.now(),

quality: "DEFENSIVE",

context: {
tradeStack,
divergence,
regimeSync,
dangerZone,
executionState,
rotationConfirm,
rotationDecay
}
};
}

/* =====================================================
CLAMP
===================================================== */

signal.strength = Math.max(
0,
Math.min(100, signal.strength)
);

/* =====================================================
ANTI SPAM
===================================================== */

if (

lastSignal &&

lastSignal.type === signal.type &&

lastSignal.message === signal.message

) {

return {
signal: lastSignal,
history
};
}

/* =====================================================
SAVE
===================================================== */

lastSignal = signal;

history.unshift(signal);

if (history.length > 30) {
history = history.slice(0, 30);
}

/* =====================================================
RETURN
===================================================== */

return {
signal,
history
};

}
