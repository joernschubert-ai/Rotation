export function phaseConfirmationEngine(input: any) {

const phase = input.phaseData?.phase ?? "PHASE_1_EXPANSION";

const participation =
Number(input.participation?.score ?? 50);

const breadthVelocity =
Number(input.breadthVelocity?.score ?? 50);

const liquidity =
Number(input.liquidity?.score ?? 50);

const marketQuality =
Number(input.marketQuality?.score ?? 50);

const rotationDecay =
Number(input.rotationDecay?.score ?? 0);

const fragility =
Number(input.fragility?.score ?? 50);

let confidence = 50;
let confirmed = true;

/* Positive */

if (participation > 60) confidence += 8;
if (breadthVelocity > 60) confidence += 8;
if (liquidity > 60) confidence += 6;
if (marketQuality > 60) confidence += 8;

/* Negative */

if (rotationDecay > 45) confidence -= 10;
if (rotationDecay > 65) confidence -= 10;

if (fragility > 60) confidence -= 8;
if (fragility > 75) confidence -= 10;

if (participation < 45) confidence -= 8;
if (breadthVelocity < 45) confidence -= 8;
if (marketQuality < 45) confidence -= 8;

/* Clamp */

confidence = Math.max(0, Math.min(100, Math.round(confidence)));

confirmed = confidence >= 60;

return {

confirmed,

confidence,

state:
!confirmed
? "UNCONFIRMED"
: confidence >= 85
? "HIGH_CONFIDENCE"
: confidence >= 70
? "CONFIRMED"
: "BUILDING",

phase

};

}
