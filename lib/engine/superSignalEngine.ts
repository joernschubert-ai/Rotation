export interface SuperSignalInput {
signal?: any;

rotationConfirm?: any;
rotationDecay?: any;

tradeStack?: any;

regimeSync?: any;
dangerZone?: any;
executionState?: any;

structure?: any;
marketDrivers?: any;

crash?: any;
rotation?: any;

divergence?: any;

liquidity?: any;
breadthThrust?: any;
fragility?: any;
squeeze?: any;
participation?: any;
}

export interface SuperSignalOutput {
active: boolean;

trigger: boolean;

type: string;

strength: number;

quality:
| "LOW"
| "TACTICAL"
| "CONFIRMED"
| "INSTITUTIONAL";

priority:
| "LOW"
| "MEDIUM"
| "HIGH";

institutionalScore: number;

confirmation: {
regimeAligned: boolean;
breadthConfirmed: boolean;
liquiditySupported: boolean;
participationHealthy: boolean;
lowFragility: boolean;
squeezeRisk: boolean;
megaCapRisk: boolean;
falseBreakRisk: boolean;
breadthThrustActive: boolean;

rotationHealthy: boolean;
decayWarning: boolean;
};

state:
| "INVALID"
| "EARLY"
| "BUILDING"
| "CONFIRMED"
| "HIGH_CONVICTION";

summary: string;
}

export function superSignalEngine(
input: SuperSignalInput
): SuperSignalOutput {

const {
signal,
rotationConfirm,
rotationDecay,

tradeStack,

regimeSync,
dangerZone,
executionState,

structure,
marketDrivers,

crash,
rotation,

divergence,

liquidity,
breadthThrust,
fragility,
squeeze,
participation
} = input;

/* =====================================================
BASE SIGNAL
===================================================== */

const signalActive =
signal?.active ?? false;

const signalStrength =
Number(signal?.strength ?? 0);

const signalType =
signal?.type ?? "NONE";

/* =====================================================
ROTATION QUALITY
===================================================== */

const rotationQuality =
Number(rotationConfirm?.quality ?? 50);

const sustainability =
Number(rotationConfirm?.sustainability ?? 50);

const participationScore =
Number(
participation?.score ??
rotationConfirm?.participation ??
50
);

const liquiditySupport =
Number(
liquidity?.score ??
rotationConfirm?.liquiditySupport ??
50
);

const falseBreakRisk =
Number(rotationConfirm?.falseBreakRisk ?? 50);

const squeezeRisk =
Number(
squeeze?.risk ??
rotationConfirm?.squeezeRisk ??
50
);

const megaCapDependency =
rotationConfirm?.megaCapOnly
? 80
: 30;

const fragilityScore =
Number(
fragility?.score ??
50
);

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

const decayWarning =
decayScore >= 24;

const severeDecay =
decayScore >= 45;

const rotationFailure =
decayScore >= 65;

const rotationHealthy =
decayScore < 20;

/* =====================================================
REGIME
===================================================== */

const regimeAligned =
regimeSync?.aligned ?? false;

const regimeScore =
Number(regimeSync?.score ?? 50);

/* =====================================================
DANGER
===================================================== */

const dangerLevel =
dangerZone?.level ?? "LOW";

const dangerEscalation =
dangerZone?.escalation ?? false;

/* =====================================================
EXECUTION
===================================================== */

const executionMode =
executionState?.executionMode ?? "WAIT";

const riskState =
executionState?.riskState ?? "STABLE";

/* =====================================================
STRUCTURE
===================================================== */

const breadth50 =
Number(
structure?.breadth?.b50?.value ?? 0
);

const breadth200 =
Number(
structure?.breadth?.b200?.value ?? 0
);

const adValue =
Number(
structure?.advanceDecline?.value ?? 0
);

const breadthConfirmed = (

breadth50 > 60 &&

breadth200 > 54 &&

adValue > -5
);

/* =====================================================
DIVERGENCE
===================================================== */

const bearishDivergence =
divergence?.state ===
"BEARISH_DIVERGENCE";

const bullishDivergence =
divergence?.state ===
"BULLISH_DIVERGENCE";

/* =====================================================
BREADTH THRUST
===================================================== */

const thrustActive =
breadthThrust?.active ?? false;

const thrustStrength =
Number(
breadthThrust?.strength ?? 0
);

/* =====================================================
LIQUIDITY
===================================================== */

const liquidityScore =
Number(
liquidity?.score ??
marketDrivers?.raw?.liquidity ??
50
);

const liquidityConfirmed =
liquidityScore > 60;

/* =====================================================
PARTICIPATION
===================================================== */

const participationHealthy =
participationScore >= 60;

/* =====================================================
FRAGILITY
===================================================== */

const lowFragility = (

fragilityScore < 45 &&

dangerLevel !== "HIGH" &&

dangerLevel !== "EXTREME"
);

/* =====================================================
RISKS
===================================================== */

const squeezeDetected =
squeezeRisk >= 65;

const megaCapRisk =
megaCapDependency >= 70;

const falseBreakDetected =
falseBreakRisk >= 65;

const structuralErosion = (

breadth50 < 58 ||

breadth200 < 50 ||

participationScore < 55 ||

bearishDivergence ||

megaCapRisk
)

/* =====================================================
INSTITUTIONAL SCORE
===================================================== */

let institutionalScore = 0;

/* ---------- SIGNAL ---------- */

institutionalScore +=
signalStrength * 0.12;

/* ---------- ROTATION ---------- */

institutionalScore +=
rotationQuality * 0.22;

institutionalScore +=
sustainability * 0.16;

/* ---------- PARTICIPATION ---------- */

institutionalScore +=
participationScore * 0.16;

/* ---------- LIQUIDITY ---------- */

institutionalScore +=
liquiditySupport * 0.12;

/* ---------- REGIME ---------- */

institutionalScore +=
regimeScore * 0.10;

/* ---------- STRUCTURE ---------- */

if (breadthConfirmed) {
institutionalScore += 10;
}

/* ---------- THRUST ---------- */

if (thrustActive) {
institutionalScore += 8;
}

if (thrustStrength > 75) {
institutionalScore += 5;
}

/* ---------- EXECUTION ---------- */

if (
executionMode ===
"ADD_ON_PULLBACKS"
) {
institutionalScore += 8;
}

/* ---------- MOMENTUM ---------- */

institutionalScore +=
momentumQuality * 0.04;

if (rotationHealthy) {
institutionalScore += 6;
}

/* =====================================================
PENALTIES
===================================================== */

if (dangerEscalation) {
institutionalScore -= 18;
}

if (
riskState === "BREAKDOWN"
) {
institutionalScore -= 15;
}

if (
riskState === "CRISIS"
) {
institutionalScore -= 28;
}

if (falseBreakDetected) {
institutionalScore -= 18;
}

if (squeezeDetected) {
institutionalScore -= 12;
}

if (megaCapRisk) {
institutionalScore -= 20;
}

if (!breadthConfirmed) {
institutionalScore -= 15;
}

if (!liquidityConfirmed) {
institutionalScore -= 12;
}

if (fragilityScore > 75) {
institutionalScore -= 25;
}
else if (fragilityScore > 60) {
institutionalScore -= 15;
}

/* =====================================================
STRUCTURAL EROSION
===================================================== */

if (structuralErosion) {
institutionalScore -= 12;
}

if (
participationScore < 50
) {
institutionalScore -= 10;
}

if (
breadth50 < 55 &&
breadth200 < 48
) {
institutionalScore -= 12;
}

/* =====================================================
DECAY
===================================================== */

if (decayWarning) {
institutionalScore -= 12;
}

if (severeDecay) {
institutionalScore -= 22;
}

if (rotationFailure) {
institutionalScore -= 40;
}

if (momentumQuality < 45) {
institutionalScore -= 12;
}

/* =====================================================
DIVERGENCE
===================================================== */

if (bearishDivergence) {
institutionalScore -= 12;
}

if (
bullishDivergence &&
tradeStack?.type === "SHORT"
) {
institutionalScore -= 10;
}

/* =====================================================
CRASH OVERLAY
===================================================== */

if (
Number(crash?.probability ?? 0) > 60
) {
institutionalScore -= 15;
}

if (
Number(crash?.probability ?? 0) > 75
) {
institutionalScore -= 10;
}

if (
Number(rotation?.score ?? 0) > 70 &&
tradeStack?.type === "LONG"
) {
institutionalScore += 5;
}

/* =====================================================
CLAMP
===================================================== */

institutionalScore = Math.max(
0,
Math.min(
100,
Math.round(institutionalScore)
)
);

/* =====================================================
QUALITY
===================================================== */

let quality:
| "LOW"
| "TACTICAL"
| "CONFIRMED"
| "INSTITUTIONAL";

if (institutionalScore >= 86) {
quality = "INSTITUTIONAL";
}
else if (institutionalScore >= 72) {
quality = "CONFIRMED";
}
else if (institutionalScore >= 52) {
quality = "TACTICAL";
}
else {
quality = "LOW";
}

/* =====================================================
STATE
===================================================== */

let state:
| "INVALID"
| "EARLY"
| "BUILDING"
| "CONFIRMED"
| "HIGH_CONVICTION";

if (

!signalActive ||

dangerLevel === "EXTREME" ||

rotationFailure

) {

state = "INVALID";
}

else if (
institutionalScore >= 86
) {

state = "HIGH_CONVICTION";
}

else if (
institutionalScore >= 72
) {

state = "CONFIRMED";
}

else if (
institutionalScore >= 52
) {

state = "BUILDING";
}

else {

state = "EARLY";
}

/* =====================================================
TRIGGER
===================================================== */

const trigger = (

activeSignalCheck(signalType) &&

institutionalScore >= 72 &&

rotationQuality >= 66 &&

participationScore >= 58 &&

liquiditySupport >= 55 &&

!dangerEscalation &&

riskState !== "CRISIS" &&

!rotationFailure &&

!bearishDivergence &&

!megaCapRisk
);

/* =====================================================
ACTIVE
===================================================== */

const active =
signalActive &&
state !== "INVALID";

/* =====================================================
SUMMARY
===================================================== */

let summary =
`${quality} | ${state}`;

if (regimeAligned) {
summary += " | Regime aligned";
}

if (thrustActive) {
summary += " | Breadth thrust";
}

if (decayWarning) {
summary += " | Rotation decay";
}

if (severeDecay) {
summary += " | Internal deterioration";
}

if (rotationFailure) {
summary += " | Rotation failure";
}

if (falseBreakDetected) {
summary += " | False-break risk";
}

if (squeezeDetected) {
summary += " | Squeeze risk";
}

if (megaCapRisk) {
summary += " | Mega-cap dependent";
}

if (bearishDivergence) {
summary += " | Bearish divergence";
}

/* =====================================================
RETURN
===================================================== */

return {
active,

trigger,

type: signalType,

strength: institutionalScore,

quality,

priority:
institutionalScore >= 72
? "HIGH"
: institutionalScore >= 52
? "MEDIUM"
: "LOW",

institutionalScore,

confirmation: {
regimeAligned,
breadthConfirmed,

liquiditySupported:
liquidityConfirmed,

participationHealthy,

lowFragility,

squeezeRisk:
squeezeDetected,

megaCapRisk,

falseBreakRisk:
falseBreakDetected,

breadthThrustActive:
thrustActive,

rotationHealthy,
decayWarning
},

state,

summary
};

}

function activeSignalCheck(
type: string
) {

return [
"PUT_ATTACK",
"PUT_BUILD",
"LONG_ATTACK",
"ROTATION_BUILD",
"ROTATION_FLOW",
"SHORT_FLOW"
].includes(type);

}


