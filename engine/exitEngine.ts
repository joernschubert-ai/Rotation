import { exitShortEngine } from "./exitShortEngine";
import { exitLongEngine } from "./exitLongEngine";

// =====================================================
// EXIT ENGINE V2
// =====================================================
//
// PURPOSE:
//
// Central exit orchestration layer.
//
// Handles:
//
// - NASDAQ PUT
// - NASDAQ CALL
// - RUSSELL CALL
//
// Important:
//
// Portfolio action is NOT simply the maximum
// instrument reduction.
//
// A short exit can mean:
// bullish recovery / short thesis weakening.
//
// A long exit can mean:
// defensive portfolio reduction.
//
// Therefore:
// directional reductions are separated.
// =====================================================

export function exitEngine(input: any) {

const {
phase,
marketPhase,

systemHeat = {},
rotationDecay = {},
rotationConfirm = {},
fragility = {},
liquidity = {},
participation = {},
crash = {},
dangerZone = {},
master = {},
tradeStack = {}

} = input;


/* =====================================================
SAFE PHASE
===================================================== */

const currentPhase =
phase ??
marketPhase ??
"PHASE_3_DISTRIBUTION";


const heat =
Number(systemHeat?.value ?? 0);


const decayScore =
Number(rotationDecay?.score ?? 0);


const fragilityScore =
Number(fragility?.score ?? 50);


const crashProbability =
Number(crash?.probability ?? 0);


const dangerScore =
Number(dangerZone?.score ?? 0);


/* =====================================================
1. SYSTEMIC EXIT
===================================================== */

const systemicExit =

currentPhase === "PHASE_7_CAPITULATION" ||

crashProbability >= 85 ||

dangerScore >= 95 ||

heat <= -2.2 ||

(
decayScore >= 90 &&
fragilityScore >= 90
);


if (systemicExit) {

const nasdaqPut = {
instrument: "NASDAQ_PUT",
direction: "SHORT",
action: "EXIT MAJORITY",
sizeReduction: 80,
reason:
"Systemic collapse / extreme reversal regime",
priority: "CRITICAL"
};


const nasdaqCall = {
instrument: "NASDAQ_CALL",
direction: "LONG",
action: "EXIT LONG",
sizeReduction: 100,
reason:
"Systemic collapse regime",
priority: "CRITICAL"
};


const russellCall = {
instrument: "RUSSELL_CALL",
direction: "LONG",
action: "EXIT LONG",
sizeReduction: 100,
reason:
"Systemic collapse regime",
priority: "CRITICAL"
};


return {

nasdaqPut,
nasdaqCall,
russellCall,

short: nasdaqPut,
long: nasdaqCall,

net: {

action: "SYSTEM EXIT",

sizeReduction: 100,

reason:
"Systemic collapse regime"

},

bias:
"SYSTEM_EXIT",

systemic:
true,

activeExits: [

nasdaqPut,
nasdaqCall,
russellCall

],

summary: {

shortReduction:
80,

longReduction:
100,

maxReduction:
100,

activeExitCount:
3

}

};

}


/* =====================================================
2. INDIVIDUAL EXIT ENGINES
===================================================== */

const engineInput = {

...input,

phase:
currentPhase,

marketPhase:
currentPhase,

tradeStack,

master,

rotationDecay,

rotationConfirm,

fragility,

liquidity,

participation,

crash,

systemHeat,

dangerZone

};


const nasdaqPut =
exitShortEngine(
engineInput
);


const nasdaqCall =
exitLongEngine(
engineInput,
"NASDAQ_CALL"
);


const russellCall =
exitLongEngine(
engineInput,
"RUSSELL_CALL"
);


/* =====================================================
3. REDUCTION ANALYSIS
===================================================== */

const shortReduction =
Number(
nasdaqPut?.sizeReduction ?? 0
);


const nasdaqCallReduction =
Number(
nasdaqCall?.sizeReduction ?? 0
);


const russellCallReduction =
Number(
russellCall?.sizeReduction ?? 0
);


const longReduction =
Math.max(
nasdaqCallReduction,
russellCallReduction
);


const maxReduction =
Math.max(
shortReduction,
longReduction
);


/* =====================================================
4. LONG SIDE PORTFOLIO ACTION
===================================================== */

let netAction =
"HOLD";


let portfolioReduction =
0;


/*
Important:

Long reduction represents actual
defensive portfolio de-risking.

Short reduction represents
short thesis exit risk.
*/


if (longReduction >= 100) {

netAction =
"EXIT LONG EXPOSURE";

portfolioReduction =
100;

}

else if (longReduction >= 70) {

netAction =
"REDUCE HARD";

portfolioReduction =
70;

}

else if (longReduction >= 50) {

netAction =
"TRIM FAST";

portfolioReduction =
50;

}

else if (longReduction >= 30) {

netAction =
"TRIM EXPOSURE";

portfolioReduction =
30;

}

else if (longReduction > 0) {

netAction =
"ACTIVE MANAGEMENT";

portfolioReduction =
longReduction;

}


/* =====================================================
5. DIRECTIONAL BIAS
===================================================== */

let bias =
"STABLE";


if (

shortReduction >= 70 &&
longReduction < 30

) {

bias =
"SHORT_EXIT_RISK";

}


else if (

longReduction >= 70 &&
shortReduction < 30

) {

bias =
"LONG_EXIT_RISK";

}


else if (

shortReduction >= 30 &&
longReduction >= 30

) {

bias =
"MULTI_DIRECTIONAL_RISK";

}


else if (

longReduction >= 25

) {

bias =
"LONG_CAUTION";

}


else if (

shortReduction >= 25

) {

bias =
"SHORT_CAUTION";

}


/* =====================================================
6. ACTIVE EXITS
===================================================== */

const activeExits = [

nasdaqPut,
nasdaqCall,
russellCall

]

.filter(

item =>
Number(
item?.sizeReduction ?? 0
) > 0

)

.map(

item => ({

instrument:
item.instrument,

direction:
item.direction,

action:
item.action,

sizeReduction:
item.sizeReduction,

reason:
item.reason,

priority:
item.priority

})

);


/* =====================================================
7. NET REASON
===================================================== */

let netReason =
"No confirmed long portfolio reduction trigger";


if (
bias === "SHORT_EXIT_RISK"
) {

netReason =
"Short exposure is facing confirmed exit risk while long-side risk remains limited";

}


else if (
activeExits.length > 0
) {

netReason =
activeExits

.map(
item =>
`${item.instrument}: ${item.reason}`
)

.join(" | ");

}


/* =====================================================
RETURN
===================================================== */

return {


/* ============================================
THREE WAY STRUCTURE
============================================ */

nasdaqPut,

nasdaqCall,

russellCall,


/* ============================================
COMPATIBILITY
============================================ */

short:
nasdaqPut,

long:
nasdaqCall,


/* ============================================
NET
============================================ */

net: {

action:
netAction,

sizeReduction:
portfolioReduction,

reason:
netReason

},


bias,


systemic:
false,


activeExits,


/* ============================================
SUMMARY
============================================ */

summary: {

maxReduction,

shortReduction,

longReduction,

portfolioReduction,

nasdaqPutReduction:
shortReduction,

nasdaqCallReduction,

russellCallReduction,

activeExitCount:
activeExits.length

}

};

}
