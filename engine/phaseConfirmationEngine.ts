// /lib/engine/phaseConfirmationEngine.ts

export function phaseConfirmationEngine(input: any) {

const phase =
input.phaseData?.phase ??
input.phase ??
"PHASE_1_EXPANSION";


/* =====================================================
INPUT
===================================================== */

const participation =
Number(
input.participation?.score ?? 50
);

const breadthVelocity =
Number(
input.breadthVelocity?.score ?? 50
);

const liquidity =
Number(
input.liquidity?.score ?? 50
);

const rotationDecay =
Number(
input.rotationDecay?.score ?? 0
);

const fragility =
Number(
input.fragility?.score ?? 50
);

const breadthThrust =
Number(
input.breadthThrust?.score ?? 50
);

const rotationScore =
Number(
input.rotation?.score ?? 50
);


/* =====================================================
BULLISH CONFIRMATION
===================================================== */

let bullishConfidence =
50;


/* -----------------------------------------------------
POSITIVE STRUCTURE
----------------------------------------------------- */

if (participation >= 60)
bullishConfidence += 10;

if (breadthVelocity >= 60)
bullishConfidence += 10;

if (breadthThrust >= 60)
bullishConfidence += 8;

if (liquidity >= 60)
bullishConfidence += 8;

if (rotationScore >= 60)
bullishConfidence += 8;


/* -----------------------------------------------------
NEGATIVE STRUCTURE
----------------------------------------------------- */

if (rotationDecay > 45)
bullishConfidence -= 10;

if (rotationDecay > 65)
bullishConfidence -= 10;

if (fragility > 60)
bullishConfidence -= 8;

if (fragility > 75)
bullishConfidence -= 10;

if (participation < 45)
bullishConfidence -= 8;

if (breadthVelocity < 45)
bullishConfidence -= 8;

if (liquidity < 40)
bullishConfidence -= 8;


/* =====================================================
BEARISH CONFIRMATION
===================================================== */

let bearishConfidence =
50;


/* -----------------------------------------------------
DISTRIBUTION / DECAY
----------------------------------------------------- */

if (rotationDecay >= 45)
bearishConfidence += 10;

if (rotationDecay >= 65)
bearishConfidence += 12;


/* -----------------------------------------------------
FRAGILITY
----------------------------------------------------- */

if (fragility >= 60)
bearishConfidence += 8;

if (fragility >= 75)
bearishConfidence += 12;


/* -----------------------------------------------------
PARTICIPATION FAILURE
----------------------------------------------------- */

if (participation < 50)
bearishConfidence += 8;

if (participation < 40)
bearishConfidence += 10;


/* -----------------------------------------------------
BREADTH DETERIORATION
----------------------------------------------------- */

/*
IMPORTANT:

Bei breadthVelocity gilt in deinem System:

HOHER SCORE = Verschlechterung.

Deshalb wird hier bewusst nicht
wie bei einer klassischen Breadth-Engine
ein hoher Wert als positiv interpretiert.
*/

if (breadthVelocity >= 55)
bearishConfidence += 8;

if (breadthVelocity >= 70)
bearishConfidence += 10;


/* -----------------------------------------------------
LIQUIDITY DETERIORATION
----------------------------------------------------- */

if (liquidity < 50)
bearishConfidence += 6;

if (liquidity < 35)
bearishConfidence += 12;


/* -----------------------------------------------------
WEAK ROTATION
----------------------------------------------------- */

if (rotationScore < 45)
bearishConfidence += 6;

if (rotationScore < 30)
bearishConfidence += 10;


/* =====================================================
PHASE ALIGNMENT
===================================================== */

const bullishPhase =
phase === "PHASE_1_EXPANSION";

const transitionalBullPhase =
phase === "PHASE_2_WARNING";

const bearishPhase =
phase === "PHASE_3_DISTRIBUTION" ||
phase === "PHASE_4_RISK";

const severeBearPhase =
phase === "PHASE_5_BREAKDOWN" ||
phase === "PHASE_6_ACCELERATION" ||
phase === "PHASE_7_CAPITULATION";


/* =====================================================
SELECT RELEVANT CONFIDENCE
===================================================== */

let confidence =
50;

let direction:
| "BULLISH"
| "BEARISH"
| "TRANSITION"
= "TRANSITION";


if (bullishPhase) {

direction = "BULLISH";

confidence =
bullishConfidence;

}


else if (bearishPhase) {

direction = "BEARISH";

confidence =
bearishConfidence;

}


else if (severeBearPhase) {

direction = "BEARISH";

confidence =
bearishConfidence + 5;

}


/*
PHASE 2 ist Übergang.

Hier darf keine harte Richtung
automatisch als bestätigt gelten.
*/

else if (transitionalBullPhase) {

direction = "TRANSITION";

confidence =
Math.max(
bullishConfidence,
bearishConfidence
) - 5;

}


confidence =
Math.max(
0,
Math.min(
100,
Math.round(confidence)
)
);


/* =====================================================
STATE
===================================================== */

let state:
| "UNCONFIRMED"
| "BUILDING"
| "CONFIRMED"
| "HIGH_CONFIDENCE";


if (confidence >= 85) {

state =
"HIGH_CONFIDENCE";

}

else if (confidence >= 70) {

state =
"CONFIRMED";

}

else if (confidence >= 55) {

state =
"BUILDING";

}

else {

state =
"UNCONFIRMED";

}


/* =====================================================
CONFIRMED
===================================================== */

const confirmed =
state === "CONFIRMED" ||
state === "HIGH_CONFIDENCE";


/* =====================================================
SUMMARY
===================================================== */

let summary =
"Phase structure remains unconfirmed";


if (direction === "BULLISH") {

summary =
confirmed
? "Bullish market structure confirms current phase"
: "Bullish structure remains incomplete";

}


if (direction === "BEARISH") {

summary =
confirmed
? "Bearish internal deterioration confirms current phase"
: "Bearish deterioration remains incomplete";

}


if (direction === "TRANSITION") {

summary =
"Market remains in transition without clear directional confirmation";

}


/* =====================================================
RETURN
===================================================== */

return {

confirmed,

confidence,

state,

phase,

direction,

bullishConfidence:
Math.max(
0,
Math.min(
100,
Math.round(bullishConfidence)
)
),

bearishConfidence:
Math.max(
0,
Math.min(
100,
Math.round(bearishConfidence)
)
),

summary

};

}
