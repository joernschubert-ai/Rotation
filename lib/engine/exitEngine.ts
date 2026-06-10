// /lib/engine/exitEngine.ts

import { exitShortEngine } from "./exitShortEngine";
import { exitLongEngine } from "./exitLongEngine";

export function exitEngine(input: any) {

const {
systemHeat,
rotationDecay = {},
rotationConfirm = {},
fragility = {},
liquidity = {},
participation = {},
crash = {},
phase
} = input;

const heat =
Number(systemHeat?.value ?? 0);

const decayScore =
Number(rotationDecay?.score ?? 0);

const fragilityScore =
Number(fragility?.score ?? 50);

const liquidityScore =
Number(liquidity?.score ?? 50);

const participationScore =
Number(participation?.score ?? 50);

const crashProbability =
Number(crash?.probability ?? 0);

/* =========================================================
FULL SYSTEM EXIT
========================================================= */

if (

phase === "PHASE_6_PANIC" ||
phase === "PHASE_7_CAPITULATION" ||

crashProbability >= 80 ||

heat <= -2.2 ||

(
decayScore >= 90 &&
fragilityScore >= 90
)

) {

return {
short: {},
long: {},
net: {
action: "FORCE EXIT",
sizeReduction: 100,
reason:
"Systemic collapse regime"
},
bias: "SYSTEM_EXIT"
};
}

/* =========================================================
HIGH RISK REDUCTION
========================================================= */

if (

heat <= -1.4 ||

(
decayScore >= 75 &&
fragilityScore >= 70
) ||

liquidityScore <= 25

) {

return {
short: {},
long: {},
net: {
action: "EXIT AGGRESSIVE",
sizeReduction: 75,
reason:
"Structural deterioration accelerating"
},
bias: "SYSTEM_REDUCE"
};
}

/* =========================================================
EARLY RISK MANAGEMENT
========================================================= */

if (

heat <= -0.7 ||

(
decayScore >= 58 &&
rotationConfirm?.state !== "CONFIRMED"
) ||

fragilityScore >= 72

) {

return {
short: {},
long: {},
net: {
action: "TRIM RISK",
sizeReduction: 35,
reason:
"Early deterioration emerging"
},
bias: "SYSTEM_CAUTION"
};
}

/* =========================================================
NORMAL FLOW
========================================================= */

const short =
exitShortEngine(input);

const long =
exitLongEngine(input);

/* =========================================================
PRIORITY
========================================================= */

if (
short.sizeReduction === 100
) {

return {
short,
long,
net: short,
bias: "SHORT_EXIT"
};
}

if (
long.sizeReduction === 100
) {

return {
short,
long,
net: long,
bias: "LONG_EXIT"
};
}

/* =========================================================
AGGREGATION
========================================================= */

const avgReduction = Math.round(
(
(short.sizeReduction || 0) +
(long.sizeReduction || 0)
) / 2
);

return {
short,
long,

net: {
action:
avgReduction >= 70
? "REDUCE HARD"
: avgReduction >= 35
? "TRIM EXPOSURE"
: avgReduction > 0
? "ACTIVE MANAGEMENT"
: "HOLD",

sizeReduction:
avgReduction
},

bias:
avgReduction >= 60
? "DEFENSIVE"
: avgReduction >= 25
? "CAUTION"
: "STABLE"
};

}
