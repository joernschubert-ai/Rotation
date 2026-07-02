// /lib/engine/exitLongEngine.ts

export function exitLongEngine(input: any) {

const {

marketPhase,

master = {},

tradeStack = {},

dangerZone = {},

rotationDecay = {},

rotationConfirm = {},

crash = {},

fragility = {},

systemHeat = {},

participation = {},

liquidity = {}

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

const masterScore =
Number(master?.score ?? 50);

const tradeStrength =
Number(tradeStack?.tradeStrength ?? 50);

const dangerScore =
Number(dangerZone?.score ?? 0);

const heat =
Number(systemHeat?.value ?? 0);

const phase =
marketPhase ??
"PHASE_3_DISTRIBUTION";

const participationScore =
Number(participation?.score ?? 50);

const crashProbability =
Number(crash?.probability ?? 0);


/* =====================================================
FULL EXIT REGIME
===================================================== */

if (

phase === "PHASE_5_BREAKDOWN" ||

phase === "PHASE_6_ACCELERATION" ||

phase === "PHASE_7_CAPITULATION" ||

dangerScore >= 90 ||

masterScore <= 20 ||

heat <= -2 ||

crashProbability >= 70

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

dangerScore >= 70 ||

masterScore <= 35 ||

tradeStrength <= 35 ||

decayScore >= 70 ||

fragilityScore >= 75 ||

heat <= -1

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

dangerScore >= 50 ||

masterScore <= 45 ||

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
HOLD HEALTHY ROTATION
===================================================== */

if (

masterScore >= 60 &&

dangerScore < 40 &&

tradeStrength >= 60 &&

heat > -0.4

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
