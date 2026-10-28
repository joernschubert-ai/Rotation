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

rotationConfirmed: boolean;
rotationConfirming: boolean;
rotationDirection:
| "BULLISH"
| "BEARISH"
| "NEUTRAL";

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


/* ============================================================
SUPER SIGNAL ENGINE
============================================================ */

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
participation,

regimePersistence
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

const signalDirection:
| "LONG"
| "SHORT"
| "NEUTRAL" =

isLongSignal
? "LONG"
: isShortSignal
? "SHORT"
: "NEUTRAL";


/* =====================================================
PHASE CONFIRMATION
===================================================== */

const phaseConfirmed =
Boolean(
phaseConfirmation?.confirmed
);

const phaseConfidence =
Number(
phaseConfirmation?.confidence ?? 50
);

const phaseState =
phaseConfirmation?.state ??
"UNCONFIRMED";


/* =====================================================
ROTATION CONFIRM
===================================================== */

/*
* RotationConfirmEngine ist die zentrale
* Richtungsbestätigung.
*
* confirmed bedeutet:
*
* BULLISH_CONFIRMED
* BEARISH_CONFIRMED
* INTERNAL_BREAKDOWN
*
* confirming bedeutet:
*
* BULLISH_CONFIRMING
* BEARISH_CONFIRMING
*/

const rotationState =
rotationConfirm?.state ??
"BULLISH_EARLY";

const rotationDirection =
rotationConfirm?.direction ??
"NEUTRAL";

const rotationConfirmed =
Boolean(
rotationConfirm?.confirmed
);

const rotationConfirming =
Boolean(
rotationConfirm?.confirming
);

const rotationConfidence =
Number(
rotationConfirm?.confidence ?? 45
);

const rotationQuality =
Number(
rotationConfirm?.quality ?? 50
);

const sustainability =
Number(
rotationConfirm?.sustainability ?? 50
);

const bearishRotationConfirmed =
rotationDirection === "BEARISH" &&
rotationConfirmed;

const bullishRotationConfirmed =
rotationDirection === "BULLISH" &&
rotationConfirmed;

const bearishRotationConfirming =
rotationDirection === "BEARISH" &&
rotationConfirming;

const bullishRotationConfirming =
rotationDirection === "BULLISH" &&
rotationConfirming;

const internalBreakdown =
rotationState ===
"INTERNAL_BREAKDOWN";


/* =====================================================
ROTATION DIRECTION ALIGNMENT
===================================================== */

const rotationDirectionAligned =
isLongSignal
? (
rotationDirection === "BULLISH" ||
rotationDirection === "NEUTRAL"
)
: isShortSignal
? (
rotationDirection === "BEARISH" ||
rotationDirection === "NEUTRAL"
)
: true;

const rotationDirectionConflict =
isLongSignal
? rotationDirection === "BEARISH"
: isShortSignal
? rotationDirection === "BULLISH"
: false;


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


/* =====================================================
FRAGILITY
===================================================== */

const fragilityScore =
Number(
fragility?.score ??
50
);


/* =====================================================
FALSE BREAK RISK
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
squeeze?.score ??
rotationConfirm?.squeezeRisk ??
0
);


/* =====================================================
MEGA CAP RISK
===================================================== */

/*
* Finale RotationConfirmEngine liefert
* megaCapDistortion unter metrics.
*/

const megaCapRisk =
Boolean(
rotationConfirm?.megaCapDependency >= 70 ||
rotationConfirm?.megaCapOnly ||
rotationConfirm?.metrics?.megaCapDistortion ||
rotationConfirm?.metrics?.narrowLeadership
);


/* =====================================================
ROTATION DECAY
===================================================== */

const decayState =
rotationDecay?.state ??
rotationConfirm?.rotationDecayState ??
"HEALTHY_ROTATION";

const decayScore =
Number(
rotationDecay?.score ??
rotationConfirm?.rotationDecayScore ??
0
);

const momentumQuality =
Number(
rotationDecay?.momentumQuality ??
50
);

/*
* Diese Schwellen müssen mit der
* RotationConfirmEngine konsistent sein.
*/

const decayWarning =
decayScore >= 45;

const severeDecay =
decayScore >= 65;

const rotationFailure =
decayScore >= 80;

const rotationHealthy =
decayScore < 45;


/* =====================================================
REGIME
===================================================== */

const regimeAligned =
Boolean(
regimeSync?.aligned
);

const regimeScore =
Number(
regimeSync?.score ?? 50
);


/* =====================================================
DANGER
===================================================== */

const dangerLevel =
dangerZone?.level ??
"LOW";

const dangerEscalation =
Boolean(
dangerZone?.escalation
);


/* =====================================================
EXECUTION
===================================================== */

const executionMode =
executionState?.executionMode ??
"WAIT";

const riskState =
executionState?.riskState ??
"STABLE";


/* =====================================================
STRUCTURE
===================================================== */

const breadth50 =
Number(
structure?.breadth?.b50?.value ??
structure?.breadth?.b50 ??
50
);

const breadth200 =
Number(
structure?.breadth?.b200?.value ??
structure?.breadth?.b200 ??
50
);

const adValue =
Number(
structure?.advanceDecline?.value ??
structure?.advanceDecline ??
0
);


/* =====================================================
DIRECTIONAL BREADTH
===================================================== */

const bullishBreadthConfirmed =
breadth50 >= 58 &&
breadth200 >= 52 &&
adValue > 0;

const bearishBreadthConfirmed =
breadth50 < 55 ||
breadth200 < 52 ||
(
breadth50 < 58 &&
adValue < 0
);

const severeBearishBreadth =
breadth50 < 45 ||
breadth200 < 48;


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
Boolean(
breadthThrust?.active
);

const thrustStrength =
Number(
breadthThrust?.strength ??
breadthThrust?.score ??
0
);

const strongBullishThrust =
thrustActive &&
thrustStrength >= 70;


/* =====================================================
DIRECTIONAL PARTICIPATION
===================================================== */

const participationHealthy =
isLongSignal
? participationScore >= 55
: isShortSignal
? participationScore < 55
: participationScore >= 55;


/* =====================================================
DIRECTIONAL LIQUIDITY
===================================================== */

/*
* Bei LONG:
* hohe Liquidität unterstützt Risikoassets.
*
* Bei PUT:
* schwache Liquidität unterstützt
* defensive Marktverschlechterung.
*/

const liquidityConfirmed =
isLongSignal
? liquidityScore >= 50
: isShortSignal
? liquidityScore < 55
: liquidityScore >= 50;


/* =====================================================
FRAGILITY
===================================================== */

const lowFragility =
fragilityScore < 45 &&
dangerLevel !== "HIGH" &&
dangerLevel !== "EXTREME";

const fragilitySupportsTrade =
isLongSignal
? fragilityScore < 60
: isShortSignal
? fragilityScore >= 60
: true;


/* =====================================================
RISK FLAGS
===================================================== */

const squeezeDetected =
squeezeRisk >= 65;

const falseBreakDetected =
falseBreakRisk >= 65;


/* =====================================================
MARKET QUALITY
===================================================== */

const marketQualityScore =
Number(
marketQuality?.score ?? 50
);


/* =====================================================
CRASH
===================================================== */

const crashProbability =
Number(
crash?.probability ?? 0
);

const crashScore =
Number(
crash?.score ?? 0
);


/* =====================================================
REGIME PERSISTENCE
===================================================== */

const persistenceScore =
Number(
regimePersistence?.score ??
regimePersistence?.persistenceScore ??
50
);


/* =====================================================
INSTITUTIONAL SCORE
===================================================== */

let institutionalScore = 0;


/* -----------------------------------------------------
BASE SIGNAL
----------------------------------------------------- */

institutionalScore +=
signalStrength * 0.08;


/* -----------------------------------------------------
ROTATION QUALITY
----------------------------------------------------- */

institutionalScore +=
rotationQuality * 0.12;

institutionalScore +=
sustainability * 0.08;


/* -----------------------------------------------------
ROTATION CONFIDENCE
----------------------------------------------------- */

institutionalScore +=
rotationConfidence * 0.08;


/* -----------------------------------------------------
REGIME
----------------------------------------------------- */

institutionalScore +=
regimeScore * 0.08;


/* -----------------------------------------------------
PHASE
----------------------------------------------------- */

institutionalScore +=
phaseConfidence * 0.08;


/* =====================================================
LONG-SPECIFIC SCORING
===================================================== */

if (isLongSignal) {

institutionalScore +=
participationScore * 0.12;

institutionalScore +=
liquidityScore * 0.08;

institutionalScore +=
marketQualityScore * 0.08;

institutionalScore +=
momentumQuality * 0.04;


/* ---------------------------------------------------
DIRECTIONAL ROTATION
--------------------------------------------------- */

if (bullishRotationConfirmed) {
institutionalScore += 15;
}
else if (bullishRotationConfirming) {
institutionalScore += 8;
}


if (rotationDirectionConflict) {
institutionalScore -= 25;
}


/* ---------------------------------------------------
BREADTH
--------------------------------------------------- */

if (bullishBreadthConfirmed) {
institutionalScore += 10;
}
else {
institutionalScore -= 12;
}


/* ---------------------------------------------------
PARTICIPATION
--------------------------------------------------- */

if (!participationHealthy) {
institutionalScore -= 12;
}


/* ---------------------------------------------------
LIQUIDITY
--------------------------------------------------- */

if (!liquidityConfirmed) {
institutionalScore -= 10;
}


/* ---------------------------------------------------
THRUST
--------------------------------------------------- */

if (thrustActive) {
institutionalScore += 6;
}

if (strongBullishThrust) {
institutionalScore += 6;
}


/* ---------------------------------------------------
ROTATION DECAY
--------------------------------------------------- */

if (rotationHealthy) {
institutionalScore += 6;
}

if (decayWarning) {
institutionalScore -= 8;
}

if (severeDecay) {
institutionalScore -= 15;
}


/* ---------------------------------------------------
EXECUTION
--------------------------------------------------- */

if (
executionMode ===
"ADD_ON_PULLBACKS"
) {
institutionalScore += 5;
}


/* ---------------------------------------------------
FRAGILITY
--------------------------------------------------- */

if (fragilityScore >= 80) {
institutionalScore -= 25;
}
else if (fragilityScore >= 65) {
institutionalScore -= 18;
}
else if (fragilityScore >= 55) {
institutionalScore -= 8;
}


/* ---------------------------------------------------
DIVERGENCE
--------------------------------------------------- */

if (bearishDivergence) {
institutionalScore -= 18;
}


/* ---------------------------------------------------
MEGA CAP RISK
--------------------------------------------------- */

if (megaCapRisk) {
institutionalScore -= 15;
}


/* ---------------------------------------------------
FALSE BREAK
--------------------------------------------------- */

if (falseBreakDetected) {
institutionalScore -= 15;
}


/* ---------------------------------------------------
SQUEEZE
--------------------------------------------------- */

if (squeezeDetected) {
institutionalScore -= 10;
}


/* ---------------------------------------------------
CRASH
--------------------------------------------------- */

if (crashProbability > 60) {
institutionalScore -= 12;
}

if (crashProbability > 75) {
institutionalScore -= 10;
}


/* ---------------------------------------------------
EXECUTION RISK
--------------------------------------------------- */

if (riskState === "BREAKDOWN") {
institutionalScore -= 15;
}

if (riskState === "CRISIS") {
institutionalScore -= 25;
}


/* ---------------------------------------------------
DANGER
--------------------------------------------------- */

if (dangerEscalation) {
institutionalScore -= 12;
}

if (dangerLevel === "HIGH") {
institutionalScore -= 10;
}


/* ---------------------------------------------------
MOMENTUM
--------------------------------------------------- */

if (momentumQuality < 45) {
institutionalScore -= 10;
}
}


/* =====================================================
SHORT / PUT-SPECIFIC SCORING
===================================================== */

if (isShortSignal) {

/*
Bei PUTs ist entscheidend:

Die RotationConfirmEngine muss
bearishe Struktur bestätigen.

Schwache Participation, schwache
Liquidität, hohe Fragility und
Rotation Decay sind positive
Confirmation.
*/


institutionalScore +=
marketQualityScore * 0.04;


/* ---------------------------------------------------
DIRECTIONAL ROTATION
--------------------------------------------------- */

if (bearishRotationConfirmed) {
institutionalScore += 18;
}
else if (bearishRotationConfirming) {
institutionalScore += 10;
}


if (internalBreakdown) {
institutionalScore += 15;
}


/*
Bullish bestätigte Rotation arbeitet
direkt gegen das PUT-Setup.
*/

if (bullishRotationConfirmed) {
institutionalScore -= 30;
}
else if (bullishRotationConfirming) {
institutionalScore -= 15;
}


/* ---------------------------------------------------
PARTICIPATION
--------------------------------------------------- */

if (participationScore < 55) {
institutionalScore += 10;
}

if (participationScore < 50) {
institutionalScore += 6;
}

if (participationScore < 45) {
institutionalScore += 4;
}


/* ---------------------------------------------------
BREADTH
--------------------------------------------------- */

if (bearishBreadthConfirmed) {
institutionalScore += 12;
}

if (severeBearishBreadth) {
institutionalScore += 6;
}


/* ---------------------------------------------------
FRAGILITY
--------------------------------------------------- */

if (fragilityScore >= 60) {
institutionalScore += 8;
}

if (fragilityScore >= 70) {
institutionalScore += 6;
}

if (fragilityScore >= 85) {
institutionalScore += 5;
}


/* ---------------------------------------------------
LIQUIDITY
--------------------------------------------------- */

if (liquidityScore < 55) {
institutionalScore += 6;
}

if (liquidityScore < 40) {
institutionalScore += 5;
}

if (liquidityScore < 30) {
institutionalScore += 4;
}


/* ---------------------------------------------------
ROTATION DECAY
--------------------------------------------------- */

if (decayWarning) {
institutionalScore += 8;
}

if (severeDecay) {
institutionalScore += 10;
}

if (rotationFailure) {
institutionalScore += 8;
}


/* ---------------------------------------------------
DIVERGENCE
--------------------------------------------------- */

if (bearishDivergence) {
institutionalScore += 12;
}

if (bullishDivergence) {
institutionalScore -= 18;
}


/* ---------------------------------------------------
MEGA CAP DEPENDENCY
--------------------------------------------------- */

if (megaCapRisk) {
institutionalScore += 6;
}


/* ---------------------------------------------------
BULLISH THRUST
--------------------------------------------------- */

if (strongBullishThrust) {
institutionalScore -= 15;
}
else if (thrustActive) {
institutionalScore -= 6;
}


/* ---------------------------------------------------
LIQUIDITY EXCEPTION
--------------------------------------------------- */

if (liquidityScore > 75) {
institutionalScore -= 5;
}


/* ---------------------------------------------------
CRASH OVERLAY
--------------------------------------------------- */

if (crashProbability > 50) {
institutionalScore += 5;
}

if (crashProbability > 65) {
institutionalScore += 6;
}


/*
Ein extremer Crash kann für neue PUT-Einstiege
problematisch sein, weil das Timing bereits
zu spät sein könnte.

Deshalb kein unbegrenztes Bonus-System.
*/

if (crashProbability > 85) {
institutionalScore -= 8;
}


/* ---------------------------------------------------
FALSE BREAK
--------------------------------------------------- */

/*
Wichtig:

FalseBreakRisk blockiert einen PUT NICHT
automatisch.

RotationConfirm liefert dieses Risiko
primär als Qualitäts-/Marktstrukturinformation.

Nur bei gleichzeitig bullischer Struktur
wird es problematisch.
*/

if (
falseBreakDetected &&
bullishRotationConfirming
) {
institutionalScore -= 8;
}


/* ---------------------------------------------------
DANGER
--------------------------------------------------- */

/*
EXTREME bleibt ein Hard Stop.

HIGH ist bei einem bestehenden defensiven
Setup kein automatisches Gegenargument.
*/

if (
dangerEscalation &&
!bearishRotationConfirmed &&
!internalBreakdown
) {
institutionalScore -= 8;
}


/* ---------------------------------------------------
REGIME PERSISTENCE
--------------------------------------------------- */

if (
persistenceScore >= 60 &&
(
bearishRotationConfirmed ||
bearishRotationConfirming
)
) {
institutionalScore += 5;
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
PHASE CONFIRMATION
===================================================== */

/*
PhaseConfirmation bleibt wichtig.

Sie ist aber NICHT die einzige
Richtungsbestätigung.

RotationConfirm kann bereits eine
institutionelle bearish Confirmation liefern.
*/

if (phaseConfirmed) {

institutionalScore += 8;

}
else {

institutionalScore -= 6;
}


if (phaseConfidence < 40) {
institutionalScore -= 6;
}


/* =====================================================
REGIME ALIGNMENT
===================================================== */

if (regimeAligned) {

institutionalScore += 5;

}
else if (
institutionalScore > 0 &&
signalDirection !== "NEUTRAL"
) {

institutionalScore -= 3;
}


/* =====================================================
FINAL CLAMP
===================================================== */

institutionalScore =
clamp(
institutionalScore,
0,
100
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
institutionalScore >= 86 &&
(
bullishRotationConfirmed ||
bearishRotationConfirmed ||
internalBreakdown
)
) {

state = "HIGH_CONVICTION";

}
else if (
institutionalScore >= 72 &&
(
rotationConfirmed ||
rotationConfirming ||
phaseConfirmed
)
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


/* -----------------------------------------------------
LONG TRIGGER
----------------------------------------------------- */

if (isLongSignal) {

trigger = (

activeSignalCheck(signalType) &&

institutionalScore >= 72 &&

rotationDirection === "BULLISH" &&

(
bullishRotationConfirmed ||
bullishRotationConfirming
) &&

(
phaseConfirmed ||
phaseConfidence >= 65
) &&

bullishBreadthConfirmed &&

participationScore >= 55 &&

liquidityScore >= 50 &&

!dangerEscalation &&

dangerLevel !== "EXTREME" &&

riskState !== "CRISIS" &&

!bearishDivergence &&

!bullishRotationConfirmed === false &&

!rotationDirectionConflict
);
}


/* -----------------------------------------------------
SHORT / PUT TRIGGER
----------------------------------------------------- */

if (isShortSignal) {

/*
Ein PUT darf jetzt durch die finale
RotationConfirmEngine institutionell
bestätigt werden.

Kein künstlicher Zwang mehr, dass
gleichzeitig eine bullische Definition
von "phaseConfirmed" vorhanden sein muss.
*/

trigger = (

activeSignalCheck(signalType) &&

institutionalScore >= 72 &&

rotationDirection === "BEARISH" &&

(
bearishRotationConfirmed ||
internalBreakdown ||
(
bearishRotationConfirming &&
(
bearishBreadthConfirmed ||
severeDecay ||
fragilityScore >= 65
)
)
) &&

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
PRIORITY
===================================================== */

const priority:
| "LOW"
| "MEDIUM"
| "HIGH" =

institutionalScore >= 72
? "HIGH"
: institutionalScore >= 52
? "MEDIUM"
: "LOW";


/* =====================================================
SUMMARY
===================================================== */

let summary =
`${signalDirection} | ${quality} | ${state}`;


/* -----------------------------------------------------
ROTATION
----------------------------------------------------- */

summary +=
` | Rotation ${rotationState}`;


if (rotationConfirmed) {
summary += " | Direction confirmed";
}
else if (rotationConfirming) {
summary += " | Direction building";
}


/* -----------------------------------------------------
PHASE
----------------------------------------------------- */

if (phaseConfirmed) {

summary +=
" | Phase confirmed";

}
else {

summary +=
` | Phase ${phaseState}`;
}


/* -----------------------------------------------------
REGIME
----------------------------------------------------- */

if (regimeAligned) {
summary += " | Regime aligned";
}


/* -----------------------------------------------------
LONG
----------------------------------------------------- */

if (
isLongSignal &&
bullishBreadthConfirmed
) {
summary += " | Broad participation";
}

if (
isLongSignal &&
thrustActive
) {
summary += " | Breadth thrust";
}


/* -----------------------------------------------------
SHORT
----------------------------------------------------- */

if (
isShortSignal &&
bearishBreadthConfirmed
) {
summary += " | Breadth deterioration";
}

if (
isShortSignal &&
bearishRotationConfirmed
) {
summary += " | Bearish rotation confirmed";
}

if (internalBreakdown) {
summary += " | Internal breakdown";
}


/* -----------------------------------------------------
DECAY
----------------------------------------------------- */

if (decayWarning) {
summary += " | Rotation decay";
}

if (severeDecay) {
summary += " | Severe internal deterioration";
}

if (rotationFailure) {
summary += " | Rotation failure";
}


/* -----------------------------------------------------
RISKS
----------------------------------------------------- */

if (
falseBreakDetected &&
isLongSignal
) {
summary += " | False-break risk";
}

if (squeezeDetected) {
summary += " | Squeeze risk";
}

if (megaCapRisk) {
summary += " | Narrow / mega-cap leadership";
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

type:
signalType,

strength:
institutionalScore,

quality,

priority,

institutionalScore,

confirmation: {

regimeAligned,

phaseConfirmed,

phaseConfidence,

rotationConfirmed,

rotationConfirming,

rotationDirection,

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


/* ============================================================
ACTIVE SIGNAL CHECK
============================================================ */

function activeSignalCheck(
type: string
): boolean {

return [

"PUT_ATTACK",
"PUT_BUILD",
"SHORT_FLOW",

"LONG_ATTACK",
"ROTATION_BUILD",
"ROTATION_FLOW"

].includes(type);
}


/* ============================================================
CLAMP
============================================================ */

function clamp(
value: number,
min: number,
max: number
): number {

return Math.max(
min,
Math.min(
max,
Math.round(value)
)
);
}
