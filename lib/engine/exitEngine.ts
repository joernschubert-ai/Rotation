// /lib/engine/exitEngine.ts

import { exitShortEngine } from "./exitShortEngine";
import { exitLongEngine } from "./exitLongEngine";

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

const liquidityScore =
Number(liquidity?.score ?? 50);

const crashProbability =
Number(crash?.probability ?? 0);

const dangerScore =
Number(dangerZone?.score ?? 0);

/* =====================================================
1. SYSTEMIC EXIT

This is NOT an instrument decision.
It means the entire portfolio should be
treated defensively.
===================================================== */

const systemicExit =

currentPhase === "PHASE_7_CAPITULATION" ||

crashProbability >= 80 ||

heat <= -2.2 ||

dangerScore >= 95 ||

(
decayScore >= 90 &&
fragilityScore >= 90
);

if (systemicExit) {

const short = {
instrument: "NASDAQ_PUT",
direction: "SHORT",
action: "EXIT MAJORITY",
sizeReduction: 80,
reason:
"Systemic collapse / reversal regime",
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

short,
long: nasdaqCall,

nasdaqPut: short,
nasdaqCall,
russellCall,

net: {
action: "SYSTEM EXIT",
sizeReduction: 100,
reason:
"Systemic collapse regime"
},

bias: "SYSTEM_EXIT",

systemic: true

};
}

/* =====================================================
2. INDIVIDUAL EXIT ENGINES
===================================================== */

const nasdaqPut =
exitShortEngine({
...input,

phase: currentPhase,
marketPhase: currentPhase,

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
});

const nasdaqCall =
exitLongEngine(
{
...input,

phase: currentPhase,
marketPhase: currentPhase,

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
},
"NASDAQ_CALL"
);

const russellCall =
exitLongEngine(
{
...input,

phase: currentPhase,
marketPhase: currentPhase,

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
},
"RUSSELL_CALL"
);

/* =====================================================
3. ACTIVE EXIT

Highest individual reduction wins.
We deliberately DO NOT average them.
===================================================== */

const reductions = [
nasdaqPut.sizeReduction ?? 0,
nasdaqCall.sizeReduction ?? 0,
russellCall.sizeReduction ?? 0
];

const maxReduction =
Math.max(...reductions);

/* =====================================================
NET ACTION
===================================================== */

let netAction = "HOLD";

if (maxReduction >= 100) {
netAction = "EXIT POSITION";
}
else if (maxReduction >= 70) {
netAction = "REDUCE HARD";
}
else if (maxReduction >= 50) {
netAction = "TRIM FAST";
}
else if (maxReduction >= 30) {
netAction = "TRIM EXPOSURE";
}
else if (maxReduction > 0) {
netAction = "ACTIVE MANAGEMENT";
}

/* =====================================================
DIRECTIONAL INFORMATION
===================================================== */

const shortReduction =
nasdaqPut.sizeReduction ?? 0;

const longReduction =
Math.max(
nasdaqCall.sizeReduction ?? 0,
russellCall.sizeReduction ?? 0
);

let bias = "STABLE";

if (
shortReduction >= 70 &&
longReduction < 30
) {
bias = "SHORT_EXIT_RISK";
}
else if (
longReduction >= 70 &&
shortReduction < 30
) {
bias = "LONG_EXIT_RISK";
}
else if (
shortReduction >= 30 &&
longReduction >= 30
) {
bias = "MULTI_DIRECTIONAL_RISK";
}
else if (
maxReduction >= 25
) {
bias = "CAUTION";
}

/* =====================================================
ACTIVE INSTRUMENTS
===================================================== */

const activeExits = [
nasdaqPut,
nasdaqCall,
russellCall
]
.filter(
item =>
Number(item?.sizeReduction ?? 0) > 0
)
.map(
item => ({
instrument: item.instrument,
action: item.action,
sizeReduction: item.sizeReduction,
reason: item.reason,
priority: item.priority
})
);

/* =====================================================
RETURN
===================================================== */

return {

/* -----------------------------------------------
NEW THREE-WAY STRUCTURE
----------------------------------------------- */

nasdaqPut,
nasdaqCall,
russellCall,

/* -----------------------------------------------
COMPATIBILITY
Existing consumers can still access:
exit.short / exit.long
----------------------------------------------- */

short: nasdaqPut,
long: nasdaqCall,

/* -----------------------------------------------
NET
----------------------------------------------- */

net: {
action: netAction,
sizeReduction: maxReduction,
reason:
activeExits.length === 0
? "No active exit trigger"
: activeExits
.map(
item =>
`${item.instrument}: ${item.reason}`
)
.join(" | ")
},

bias,

systemic: false,

activeExits,

/* -----------------------------------------------
SUMMARY
----------------------------------------------- */

summary: {

maxReduction,

shortReduction,

longReduction,

nasdaqPutReduction:
nasdaqPut.sizeReduction,

nasdaqCallReduction:
nasdaqCall.sizeReduction,

russellCallReduction:
russellCall.sizeReduction,

activeExitCount:
activeExits.length

}

};
}
