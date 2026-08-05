// /lib/engine/phaseConfirmationEngine.ts

export function phaseConfirmationEngine(input: any) {

const phase =
input.phaseData?.phase ??
input.phase ??
"PHASE_1_EXPANSION";

const participation =
Number(input.participation?.score ?? 50);

const breadthVelocity =
Number(
input.breadthVelocity?.score ??
50
);

const liquidity =
Number(input.liquidity?.score ?? 50);

// Wird später automatisch genutzt,
// solange die MarketQualityEngine noch nicht existiert,
// bleibt der Wert neutral.
const marketQuality =
Number(input.marketQuality?.score ?? 50);

const rotationDecay =
Number(input.rotationDecay?.score ?? 0);

const fragility =
Number(input.fragility?.score ?? 50);

let confidence = 50;

/* =====================================================
PHASE ADJUSTMENT
===================================================== */

switch (phase) {

case "PHASE_1_EXPANSION":
confidence += 4;
break;

case "PHASE_2_WARNING":
confidence -= 2;
break;

case "PHASE_3_DISTRIBUTION":
confidence -= 5;
break;

case "PHASE_4_RISK":
confidence -= 8;
break;

case "PHASE_5_BREAKDOWN":
confidence -= 12;
break;

default:
break;
}

/* =====================================================
POSITIVE CONFIRMATION
===================================================== */

if (participation >= 60)
confidence += 8;

if (breadthVelocity >= 60)
confidence += 8;

if (liquidity >= 60)
confidence += 6;

if (marketQuality >= 60)
confidence += 8;

/* =====================================================
NEGATIVE CONFIRMATION
===================================================== */

if (rotationDecay > 45)
confidence -= 10;

if (rotationDecay > 65)
confidence -= 15;

if (fragility > 60)
confidence -= 8;

if (fragility > 75)
confidence -= 15;

if (participation < 45)
confidence -= 8;

if (breadthVelocity < 45)
confidence -= 8;

if (marketQuality < 45)
confidence -= 8;

/* =====================================================
CLAMP
===================================================== */

confidence = Math.max(
0,
Math.min(
100,
Math.round(confidence)
)
);

const confirmed =
confidence >= 60;

/* =====================================================
STATE
===================================================== */

let state:
| "UNCONFIRMED"
| "BUILDING"
| "CONFIRMED"
| "HIGH_CONFIDENCE";

if (confidence >= 85) {

state = "HIGH_CONFIDENCE";

} else if (confidence >= 70) {

state = "CONFIRMED";

} else if (confidence >= 55) {

state = "BUILDING";

} else {

state = "UNCONFIRMED";
}

/* =====================================================
RETURN
===================================================== */

return {

confirmed,

confidence,

state,

phase

};
}
