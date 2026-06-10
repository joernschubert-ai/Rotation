// /lib/engine/exitShortEngine.ts

export function exitShortEngine(input: any) {

const {
position,
crash = {},
vix,
breadth50,
pnl,
phase,

rotationDecay = {},
participation = {},
liquidity = {}
} = input;

/* =====================================================
SAFE INPUTS
===================================================== */

const crashProbability =
Number(crash?.probability ?? 0);

const decayScore =
Number(rotationDecay?.score ?? 0);

const participationScore =
Number(participation?.score ?? 50);

const liquidityScore =
Number(liquidity?.score ?? 50);

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
reason:
"No short exposure"
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
"Extreme downside extension"
};
}

/* =====================================================
PROFIT CORE
===================================================== */

if (pnl >= 100) {

return {
action: "LOCK PROFITS",
sizeReduction: 70,
reason:
"Capitulation gains secured"
};
}

if (pnl >= 70) {

return {
action: "TRIM PROFITS",
sizeReduction: 50,
reason:
"Strong downside move"
};
}

/* =====================================================
CAPITULATION EXIT
===================================================== */

if (
phase ===
"PHASE_7_CAPITULATION"
) {

return {
action: "EXIT MAJORITY",
sizeReduction: 80,
reason:
"High reversal probability"
};
}

/* =====================================================
CRASH PEAK
===================================================== */

if (
crashProbability > 82
) {

return {
action: "REDUCE HARD",
sizeReduction: 70,
reason:
"Crash peak zone"
};
}

/* =====================================================
VOLATILITY CLIMAX
===================================================== */

if (
vix > 34
) {

return {
action: "TRIM FAST",
sizeReduction: 50,
reason:
"Volatility climax"
};
}

/* =====================================================
INTERNAL RECOVERY
===================================================== */

if (

breadth50 > 0.72 &&

decayScore < 25 &&

participationScore >= 60 &&

liquidityScore >= 55 &&

pnl > 20

) {

return {
action: "REDUCE",
sizeReduction: 40,
reason:
"Market internals stabilizing"
};
}

/* =====================================================
SHORT SQUEEZE RISK
===================================================== */

if (
vix < 18 &&
breadth50 > 0.8 &&
pnl > 15
) {

return {
action: "TRIM",
sizeReduction: 35,
reason:
"Squeeze/reversal risk rising"
};
}

/* =====================================================
HOLD
===================================================== */

return {
action: "HOLD SHORT",
sizeReduction: 0,
reason:
"Downtrend intact"
};

}
