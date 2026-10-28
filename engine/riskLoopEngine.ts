// /lib/engine/riskLoopEngine.ts

export function riskLoopEngine(input: any) {

const {
sizing,
exit,
state = {},

/* 🔥 NEW */
regimeSync = {},
fragility = {},
participation = {},
liquidity = {},
crash = {}

} = input;

/* ================= SAFETY ================= */

if (!sizing || !exit) {
return {
longSize: 0,
shortSize: 0,
netSize: 0,
grossExposure: 0,
note: "Invalid input"
};
}

/* ================= BASE SPLIT ================= */

let shortSize =
sizing.direction === "SHORT"
? sizing.size
: 0;

let longSize =
sizing.direction === "LONG"
? sizing.size
: 0;

/* ================= REGIME DATA ================= */

const syncScore =
Number(regimeSync?.score ?? 50);

const regimeState =
regimeSync?.state ?? "STABLE";

const fragilityScore =
Number(fragility?.score ?? 50);

const fragilityState =
fragility?.state ?? "NORMAL";

const participationScore =
Number(participation?.score ?? 50);

const liquidityScore =
Number(liquidity?.score ?? 50);

const crashScore =
Number(crash?.score ?? 0);

/* ================= CONFIRMED BREAKDOWN ================= */

const structuralCluster = (

regimeState === "BREAKDOWN" ||

fragilityState === "EXTREME" ||

fragilityScore >= 85

);

const participationCluster =
participationScore < 35;

const liquidityCluster =
liquidityScore < 30;

const crashCluster =
crashScore >= 70;

const breakdownClusters = [

structuralCluster,
participationCluster,
liquidityCluster,
crashCluster

].filter(Boolean).length;

const confirmedBreakdown = (

breakdownClusters >= 3 &&

syncScore < 35

);

/* ================= APPLY EXIT ================= */

// 🔥 SHORT SIDE
if (exit.short) {

const reduction =
exit.short.sizeReduction || 0;

shortSize =
shortSize * (1 - reduction / 100);
}

// 🔥 LONG SIDE
if (exit.long) {

const reduction =
exit.long.sizeReduction || 0;

longSize =
longSize * (1 - reduction / 100);
}

/* ================= FEEDBACK LOOP ================= */

let adjustedShort = shortSize;
let adjustedLong = longSize;

/* =====================================================
PROFIT LOCK
===================================================== */

if (state?.pnl > 80) {

adjustedShort *= 0.8;
adjustedLong *= 0.8;
}

/* =====================================================
LOSS CONTROL
===================================================== */

if (state?.pnl < -20) {

adjustedShort *= 0.7;
adjustedLong *= 0.7;
}

/* =====================================================
CONFIRMED BREAKDOWN ONLY
===================================================== */

if (confirmedBreakdown) {

adjustedLong *= 0.35;

if (sizing.direction === "SHORT") {
adjustedShort *= 1.10;
}
}

/* =====================================================
FRAGILITY WITHOUT CONFIRMATION
===================================================== */

else if (

fragilityScore >= 75 &&

participationScore < 45

) {

adjustedLong *= 0.65;
adjustedShort *= 0.85;
}

/* =====================================================
LOW PARTICIPATION ONLY
===================================================== */

else if (

participationScore < 45 &&

syncScore >= 45

) {

adjustedLong *= 0.80;
}

/* =====================================================
LIQUIDITY STRESS ONLY
===================================================== */

else if (

liquidityScore < 35 &&

!confirmedBreakdown

) {

adjustedLong *= 0.75;
adjustedShort *= 0.75;
}

/* =====================================================
NORMALIZE
===================================================== */

adjustedShort =
Math.max(
0,
Math.min(adjustedShort, 100)
);

adjustedLong =
Math.max(
0,
Math.min(adjustedLong, 100)
);

/* ================= NET ================= */

const netSize =
Math.round(
adjustedLong - adjustedShort
);

/* ================= FINAL ================= */

return {

longSize:
Math.round(adjustedLong),

shortSize:
Math.round(adjustedShort),

netSize,

grossExposure:
Math.round(
adjustedLong + adjustedShort
),

note:
confirmedBreakdown
? "Confirmed synchronized breakdown"
: "Adaptive exposure control"
};

}
