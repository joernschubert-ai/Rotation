// /lib/engine/systemHeat.ts

export function systemHeatEngine(data: any) {

/* ================= INPUTS ================= */

const breadth50 = data.breadth50 ?? 0;
const breadth20 = data.breadth20 ?? 0;

const liquidity =
data.marketLiquidityScore ?? 50;

/* 🔥 INSTITUTIONAL QUALITY */

const participationScore =
Number(data.participationScore ?? data.participation?.score ?? 50);

const breadthThrustScore =
Number(data.breadthThrustScore ?? data.breadthThrust?.score ?? 50);

const rotationScore =
Number(data.rotationScore ?? data.rotation?.score ?? 50);

/* 🔥 DRIVERS */

const vix =
Number(data.vix ?? 20);

const credit =
Number(data.creditRatio ?? 0.85);

const vixTerm =
Number(data.vixTermRatio ?? 1);

const gamma =
Number(data.gammaExposure ?? 0);

/* ================= COMPONENTS ================= */

// Momentum
const momentumRaw =
(breadth20 + breadth50) / 2;

const momentum = normalize(momentumRaw);

// Breadth
const breadth = normalize(breadth50);

// Liquidity
const liq = normalize(liquidity);

// Participation
const participation = normalize(participationScore);

// Rotation
const rotation = normalize(rotationScore);

// Breadth thrust
const thrust = normalize(breadthThrustScore);

// Risk (Crash invertiert)
const risk = normalize(100 - (data.crash?.score ?? 0));

/* ================= SECONDARY ================= */

const vixClamped = Math.min(Math.max(vix, 10), 40);

const vol = normalize(100 - ((vixClamped - 10) * 3));

const creditScore = normalize(credit * 100);

/* ================= TERM STRUCTURE ================= */

let term = 0;

if (vixTerm < 0.9) term = -2;
else if (vixTerm < 1.0) term = -1;
else if (vixTerm > 1.1) term = 1;
else term = 0;

/* ================= GAMMA ================= */

const gammaScore =
gamma > 0 ? 1 : gamma < 0 ? -1 : 0;

/* ================= BASE HEAT ================= */

let heat =
(momentum * 0.18) +
(breadth * 0.12) +
(liq * 0.15) +
(participation * 0.22) +
(rotation * 0.20) +
(thrust * 0.08) +
(risk * 0.15) +
(vol * 0.05) +
(creditScore * 0.03) +
(term * 0.01) +
(gammaScore * 0.01);

/* =========================================================
SYSTEM CONTROL LAYER
========================================================= */

if (vixTerm < 0.95) {
heat = Math.min(heat, 0.8);
}

if (gamma < 0) {
heat *= 0.85;
}

if (liquidity > 70 && credit > 0.9) {
heat += 0.15;
}

if (
liquidity > 70 &&
(participationScore < 45 || rotationScore < 40)
) {
heat -= 0.18;
}

if (vixTerm < 0.95 && gamma < 0) {
heat = Math.min(heat, 0.4);
}

if (data.crash?.score > 80) {
heat = Math.min(heat, -0.5);
}

/* =========================================================
INSTITUTIONAL QUALITY PENALTY
========================================================= */

if (
participationScore < 40 &&
breadthThrustScore < 40 &&
rotationScore < 35
) {
heat -= 0.22;
}

if (
participationScore < 48 &&
rotationScore < 45
) {
heat -= 0.12;
}

if (
breadth50 < 50 &&
participationScore < 50
) {
heat -= 0.10;
}

/* =========================================================
STRUCTURAL HEAT DAMPENER
========================================================= */

const rotationDecayScore =
Number(data.rotationDecayScore ?? data.rotationDecay?.score ?? 0);

if (rotationScore < 25) heat -= 0.10;
if (participationScore < 50) heat -= 0.10;
if (rotationDecayScore > 60) heat -= 0.10;

/* =========================================================
FINAL CLAMP (VALUE SPACE)
========================================================= */

heat = Math.max(-2, Math.min(heat, 2));

/* =========================================================
🔥 RELABELING RULE (CRITICAL FIX)
========================================================= */

/*
HARD RULE:

Bullish requires structural participation + rotation.

Otherwise → TRANSITION
*/

const isBullishCandidate = heat >= 0.4;

/* ❌ BLOCK BULLISH IF STRUCTURE WEAK */

const blockedBullish =
participationScore < 30 ||
rotationScore < 30;

/* ================= LABEL ================= */

let label = "TRANSITION";

if (isBullishCandidate && !blockedBullish) {
label = "BULLISH";
}

if (heat >= 1.2 && !blockedBullish) {
label = "RISK ON 🔥";
}

if (heat <= -1.2) {
label = "RISK OFF ❄️";
}

if (heat <= -0.4 && heat > -1.2) {
label = "RISK WARNING";
}

/* ================= RETURN ================= */

return {
value: Number(heat.toFixed(2)),
label,

components: {
momentum,
breadth,
liquidity: liq,
participation,
rotation,
thrust,
risk,
vol,
credit: creditScore,
term,
gamma: gammaScore,
crash: normalize(data.crash?.score ?? 0) * -1
},

control: {
termCap: vixTerm < 0.95,
gammaDamp: gamma < 0,
liqCreditBoost: liquidity > 70 && credit > 0.9,
doubleStress: vixTerm < 0.95 && gamma < 0,
crashOverride: data.crash?.score > 80,

institutionalPenalty:
participationScore < 40 &&
breadthThrustScore < 40 &&
rotationScore < 35,

relabelingFix: true
}
};
}

/* ================= HELPERS ================= */

function normalize(value: number) {
return ((value - 50) / 50) * 2;
}
