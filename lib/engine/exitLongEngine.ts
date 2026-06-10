// /lib/engine/exitLongEngine.ts

export function exitLongEngine(input: any) {

const {
position,
russell,
rotation = {},
rotationConfirm = {},
rotationDecay = {},
crash = {},
phase,
pnl,

fragility = {},
liquidity = {},
participation = {}
} = input;

/* =====================================================
SAFE INPUTS
===================================================== */

const decayScore =
Number(rotationDecay?.score ?? 0);

const decayState =
rotationDecay?.state ?? "NONE";

const rotationState =
rotationConfirm?.state ?? "NONE";

const rotationConfidence =
Number(rotationConfirm?.confidence ?? 0);

const fragilityScore =
Number(fragility?.score ?? 50);

const liquidityScore =
Number(liquidity?.score ?? 50);

const participationScore =
Number(participation?.score ?? 50);

const crashProbability =
Number(crash?.probability ?? 0);

/* =====================================================
NO POSITION
===================================================== */

if (
!position ||
position.size <= 0
) {

return {
action: "NO POSITION",
sizeReduction: 0,
reason: "No long exposure"
};
}

/* =====================================================
EXTREME PROFIT
===================================================== */

if (pnl >= 140) {

return {
action: "LOCK MAJORITY",
sizeReduction: 85,
reason:
"Extreme upside extension"
};
}

if (pnl >= 100) {

return {
action: "TAKE MAJORITY",
sizeReduction: 75,
reason:
"Late-stage upside extension"
};
}

if (pnl >= 80) {

return {
action: "TAKE PROFITS",
sizeReduction: 65,
reason:
"Strong upside move"
};
}

/* =====================================================
FULL EXIT REGIME
===================================================== */

if (

phase === "PHASE_5_BREAKDOWN" ||
phase === "PHASE_6_PANIC" ||
phase === "PHASE_7_CAPITULATION" ||

crashProbability >= 65 ||

(
decayScore >= 85 &&
fragilityScore >= 80
)

) {

return {
action: "EXIT LONG",
sizeReduction: 100,
reason:
"Structural breakdown confirmed"
};
}

/* =====================================================
HEAVY REDUCTION
===================================================== */

if (

decayScore >= 72 ||

fragilityScore >= 75 ||

liquidityScore <= 30 ||

participationScore <= 28 ||

rotationState === "FAILED"

) {

return {
action: "REDUCE LONG",
sizeReduction: 70,
reason:
"Confirmed internal deterioration"
};
}

/* =====================================================
EARLY DECAY
===================================================== */

if (

decayState === "EARLY_DECAY" ||

(
decayScore >= 50 &&
rotationConfidence < 55
)

) {

return {
action: "TRIM LONG",
sizeReduction: 30,
reason:
"Early participation deterioration"
};
}

/* =====================================================
WEAK ROTATION
===================================================== */

if (

russell?.score?.value < 4 &&

rotationState !== "CONFIRMED"

) {

return {
action: "LIGHTEN LONG",
sizeReduction: 25,
reason:
"Weak broad participation"
};
}

/* =====================================================
HOLD HEALTHY ROTATION
===================================================== */

if (

rotationState === "EARLY" ||
rotationState === "CONFIRMED"

) {

return {
action: "HOLD LONG",
sizeReduction: 0,
reason:
"Rotation structure still intact"
};
}

/* =====================================================
DEFAULT
===================================================== */

return {
action: "MANAGE LONG",
sizeReduction: 15,
reason:
"Neutral transition regime"
};

}
