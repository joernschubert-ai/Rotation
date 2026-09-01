// /lib/engine/superSignalEngine.ts

export interface SuperSignalInput {
signal?: any;

phaseConfirmation?: any;

rotationConfirm?: any;
rotationDecay?: any;

tradeStack?: any;
marketQuality?: any;

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

regimePersistence?: any;
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

phaseConfirmed: boolean;
phaseConfidence: number;

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

phaseConfirmation,

rotationConfirm,
rotationDecay,

tradeStack,
marketQuality,

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
SIGNAL DIRECTION
===================================================== */

const isLongSignal =
[
"LONG_ATTACK",
"ROTATION_BUILD",
"ROTATION_FLOW"
].includes(signalType);

const isShortSignal =
[
"PUT_ATTACK",
"PUT_BUILD",
"SHORT_FLOW"
].includes(signalType);

const signalDirection =
isLongSignal
? "LONG"
: isShortSignal
? "SHORT"
: "NEUTRAL";


/* =====================================================
PHASE CONFIRMATION
===================================================== */

const phaseConfirmed =
phaseConfirmation?.confirmed ?? false;

const phaseConfidence =
Number(
phaseConfirmation?.confidence ?? 50
);

const phaseState =
phaseConfirmation?.state ??
"UNCONFIRMED";


/* =====================================================
ROTATION QUALITY
===================================================== */

const rotationQuality =
Number(
rotationConfirm?.quality ??
rotationConfirm?.score ??
50
);

const sustainability =
Number(
rotationConfirm?.sustainability ??
50
);


/* =====================================================
PARTICIPATION
===================================================== */

const participationScore =
Number(
participation?.score ??
rotationConfirm?.participation ??
50
);


/* =====================================================
LIQUIDITY
===================================================== */

const liquidityScore =
Number(
liquidity?.score ??
rotationConfirm?.liquiditySupport ??
marketDrivers?.raw?.liquidity ??
50
);

const liquiditySupport =
liquidityScore;


/* =====================================================
FRAGILITY
===================================================== */

const fragilityScore =
Number(
fragility?.score ??
50
);


/* =====================================================
FALSE BREAK
===================================================== */

const falseBreakRisk =
Number(
rotationConfirm?.falseBreakRisk ??
0
);


/* =====================================================
SQUEEZE
===================================================== */

const squeezeRisk =
Number(
squeeze?.risk ??
rotationConfirm?.squeezeRisk ??
0
);


/* =====================================================
MEGA CAP DEPENDENCY
===================================================== */

const megaCapDependency =
Number(
rotationConfirm?.megaCapDependency ??
(
rotationConfirm?.megaCapOnly
? 80
: 30
)
);


/* =====================================================
ROTATION DECAY
===================================================== */

const decayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";

const decayScore =
Number(
rotationDecay?.score ?? 0
);

const momentumQuality =
Number(
rotationDecay?.momentumQuality ?? 50
);

const decayWarning =
decayScore >= 24;

const severeDecay =
decayScore >= 45;

const rotationFailure =
decayScore >= 65;

const rotationHealthy =
decayScore < 24;


/* =====================================================
REGIME
===================================================== */

const regimeAligned =
regimeSync?.aligned ?? false;

const regimeScore =
Number(
regimeSync?.score ?? 50
);


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
structure?.breadth?.b50?.value ?? 50
);

const breadth200 =
Number(
structure?.breadth?.b200?.value ?? 50
);

const adValue =
Number(
structure?.advanceDecline?.value ?? 0
);


/* =====================================================
DIRECTIONAL BREADTH CONFIRMATION
===================================================== */

const bullishBreadthConfirmed =
breadth50 >= 60 &&
breadth200 >= 54 &&
adValue > -5;

const bearishBreadthConfirmed =
breadth50 <= 50 ||
(
breadth50 < 55 &&
adValue < 0
);

const breadthConfirmed =
isLongSignal
? bullishBreadthConfirmed
: isShortSignal
? bearishBreadthConfirmed
: false;


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
DIRECTIONAL PARTICIPATION
===================================================== */

const participationHealthy =
isLongSignal
? participationScore >= 58
: isShortSignal
? participationScore <= 50
: participationScore >= 55;


/* =====================================================
DIRECTIONAL LIQUIDITY
===================================================== */

const liquidityConfirmed =
isLongSignal
? liquidityScore >= 55
: isShortSignal
? liquidityScore <= 55
: liquidityScore >= 50;


/* =====================================================
FRAGILITY STATE
===================================================== */

const lowFragility =
fragilityScore < 45 &&
dangerLevel !== "HIGH" &&
dangerLevel !== "EXTREME";


/* =====================================================
DIRECTIONAL FRAGILITY SUPPORT
===================================================== */

const fragilitySupportsTrade =
isLongSignal
? fragilityScore < 60
: isShortSignal
? fragilityScore >= 55
: true;


/* =====================================================
RISKS
===================================================== */

const squeezeDetected =
squeezeRisk >= 65;

const megaCapRisk =
megaCapDependency >= 70;

const falseBreakDetected =
falseBreakRisk >= 65;


/* =====================================================
STRUCTURAL STATE
===================================================== */

const bullishStructuralErosion =
breadth50 < 58 ||
breadth200 < 50 ||
participationScore < 55 ||
bearishDivergence ||
megaCapRisk;

const bearishStructuralConfirmation =
breadth50 < 55 ||
participationScore < 52 ||
bearishDivergence ||
fragilityScore > 60;


/* =====================================================
MARKET QUALITY
===================================================== */

const marketQualityScore =
Number(
marketQuality?.score ?? 50
);


/* =====================================================
INSTITUTIONAL SCORE
===================================================== */

let institutionalScore = 0;


/* ---------- BASE SIGNAL ---------- */

institutionalScore +=
signalStrength * 0.10;


/* ---------- ROTATION ---------- */

institutionalScore +=
rotationQuality * 0.18;

institutionalScore +=
sustainability * 0.12;


/* ---------- REGIME ---------- */

institutionalScore +=
regimeScore * 0.10;


/* ---------- PHASE ---------- */

institutionalScore +=
phaseConfidence * 0.10;

if (phaseConfirmed) {
institutionalScore += 8;
}


/* =====================================================
LONG-SPECIFIC SCORING
===================================================== */

if (isLongSignal) {

institutionalScore +=
participationScore * 0.12;

institutionalScore +=
liquidityScore * 0.10;

institutionalScore +=
marketQualityScore * 0.08;

if (bullishBreadthConfirmed) {
institutionalScore += 10;
}

if (thrustActive) {
institutionalScore += 8;
}

if (thrustStrength >= 75) {
institutionalScore += 5;
}

if (rotationHealthy) {
institutionalScore += 6;
}

if (executionMode === "ADD_ON_PULLBACKS") {
institutionalScore += 6;
}

if (fragilityScore > 75) {
institutionalScore -= 25;
}
else if (fragilityScore > 60) {
institutionalScore -= 15;
}

if (bullishStructuralErosion) {
institutionalScore -= 15;
}

if (!liquidityConfirmed) {
institutionalScore -= 12;
}

if (!participationHealthy) {
institutionalScore -= 10;
}

if (!bullishBreadthConfirmed) {
institutionalScore -= 12;
}

if (bearishDivergence) {
institutionalScore -= 15;
}

if (megaCapRisk) {
institutionalScore -= 18;
}
}


/* =====================================================
SHORT / PUT-SPECIFIC SCORING
===================================================== */

if (isShortSignal) {

/*
Bei SHORT/PUT ist schwache Participation
keine negative Confirmation.

Sie bestätigt die interne Marktverschlechterung.
*/

if (participationScore < 55) {
institutionalScore += 10;
}

if (participationScore < 50) {
institutionalScore += 5;
}

/*
Breadth deterioration bestätigt SHORT.
*/

if (bearishBreadthConfirmed) {
institutionalScore += 12;
}

if (breadth50 < 50) {
institutionalScore += 6;
}

/*
Hohe Fragility unterstützt defensive /
Short-Setups.
*/

if (fragilityScore >= 55) {
institutionalScore += 8;
}

if (fragilityScore >= 70) {
institutionalScore += 6;
}

/*
Rotation Decay ist bei einem PUT kein
automatischer negativer Faktor.

Moderate bis hohe Decay-Werte bestätigen
die institutionelle Verschlechterung.
*/

if (decayWarning) {
institutionalScore += 8;
}

if (severeDecay) {
institutionalScore += 10;
}

if (rotationFailure) {
institutionalScore += 12;
}

/*
Bearish divergence ist positive
Confirmation für SHORT.
*/

if (bearishDivergence) {
institutionalScore += 12;
}

/*
Mega-Cap Dependency ist ein Fragility-Signal.
Für defensive / PUT-Setups kann dies
strukturell unterstützend sein.
*/

if (megaCapRisk) {
institutionalScore += 6;
}

if (bearishStructuralConfirmation) {
institutionalScore += 8;
}

/*
Sehr hohe Liquidität ist für defensive
Short-Setups weniger unterstützend.
*/

if (liquidityScore > 70) {
institutionalScore -= 5;
}

/*
Bullish Breadth Thrust arbeitet gegen
das SHORT-Setup.
*/

if (thrustActive && thrustStrength >= 70) {
institutionalScore -= 12;
}

/*
Bullish Divergence arbeitet gegen SHORT.
*/

if (bullishDivergence) {
institutionalScore -= 15;
}
}


/* =====================================================
NEUTRAL FALLBACK
===================================================== */

if (
!isLongSignal &&
!isShortSignal
) {

institutionalScore +=
participationScore * 0.10;

institutionalScore +=
liquidityScore * 0.08;

institutionalScore +=
marketQualityScore * 0.08;
}


/* =====================================================
GLOBAL PENALTIES
===================================================== */

if (dangerEscalation) {
institutionalScore -= 15;
}

if (
riskState === "CRISIS" &&
isLongSignal
) {
institutionalScore -= 25;
}

if (
riskState === "BREAKDOWN" &&
isLongSignal
) {
institutionalScore -= 15;
}

if (falseBreakDetected) {
institutionalScore -= 15;
}

/*
Squeeze-Risk ist primär für LONG problematisch.
*/

if (
squeezeDetected &&
isLongSignal
) {
institutionalScore -= 10;
}


/* =====================================================
PHASE PENALTIES
===================================================== */

if (!phaseConfirmed) {
institutionalScore -= 10;
}

if (phaseConfidence < 40) {
institutionalScore -= 8;
}


/* =====================================================
CRASH OVERLAY
===================================================== */

const crashProbability =
Number(
crash?.probability ?? 0
);

if (
crashProbability > 60 &&
isLongSignal
) {
institutionalScore -= 15;
}

if (
crashProbability > 75 &&
isLongSignal
) {
institutionalScore -= 10;
}

/*
Erhöhte Crash-Wahrscheinlichkeit unterstützt
defensive PUT-Setups moderat.
*/

if (
crashProbability > 50 &&
isShortSignal
) {
institutionalScore += 6;
}

if (
crashProbability > 65 &&
isShortSignal
) {
institutionalScore += 6;
}


/* =====================================================
MOMENTUM QUALITY
===================================================== */

if (isLongSignal) {

institutionalScore +=
momentumQuality * 0.04;

if (momentumQuality < 45) {
institutionalScore -= 10;
}
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
signalDirection === "NEUTRAL" ||
dangerLevel === "EXTREME"
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

let trigger = false;


/*
LONG TRIGGER
*/

if (isLongSignal) {

trigger = (

activeSignalCheck(signalType) &&

institutionalScore >= 72 &&

rotationQuality >= 60 &&

phaseConfirmed &&

bullishBreadthConfirmed &&

participationScore >= 55 &&

liquidityScore >= 55 &&

!dangerEscalation &&

riskState !== "CRISIS" &&

!bearishDivergence &&

!falseBreakDetected
);
}


/*
SHORT / PUT TRIGGER
*/

if (isShortSignal) {

trigger = (

activeSignalCheck(signalType) &&

institutionalScore >= 72 &&

phaseConfirmed &&

(
bearishBreadthConfirmed ||
bearishDivergence ||
severeDecay ||
fragilityScore >= 60
) &&

!falseBreakDetected &&

!bullishDivergence &&

dangerLevel !== "EXTREME"
);
}


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
`${signalDirection} | ${quality} | ${state}`;

if (phaseConfirmed) {
summary += " | Phase confirmed";
}
else {
summary += ` | Phase ${phaseState}`;
}

if (regimeAligned) {
summary += " | Regime aligned";
}

if (isLongSignal && thrustActive) {
summary += " | Breadth thrust";
}

if (isShortSignal && bearishBreadthConfirmed) {
summary += " | Breadth deterioration";
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
summary += " | Mega-cap dependency";
}

if (bearishDivergence) {
summary += " | Bearish divergence";
}

if (bullishDivergence) {
summary += " | Bullish divergence";
}


/* =====================================================
RETURN
===================================================== */

return {

active,

trigger,

type: signalType,

strength:
institutionalScore,

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

phaseConfirmed,

phaseConfidence,

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


/* =====================================================
ACTIVE SIGNAL CHECK
===================================================== */

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
