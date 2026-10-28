export function driversEngine(data: any) {

/* ================= INPUT ================= */

const vix = Number(data.marketData?.["^VIX"]?.current ?? 0);
const vixTerm = Number(data.vixTermRatio ?? 1);
const volOfVol = Number(data.volOfVolRatio ?? 1);
const skew = Number(data.optionsSkewRatio ?? 1);
const gamma = Number(data.gammaExposure ?? 0);

const liquidity = Number(data.marketLiquidityScore ?? 50);
const credit = Number(data.creditRatio ?? 0.85);

const correlation = Number(data.correlationScore ?? 0);
const breadth = Number(data.breadth50 ?? 0);

const move = Number(data.moveIndex ?? 50);

/* ================= 🔥 TERM STRUCTURE FIX ================= */

let isBackwardation = false;

/* Nur echtes Stress-Backwardation */
if (vix > 22 && (vixTerm < 0.8 || vixTerm > 1.2)) {
isBackwardation = true;
}

/* ================= SCORING ================= */

let volScore = 0;
let optionsScore = 0;
let liquidityScore = 0;
let structureScore = 0;

/* ================= VOL ================= */

if (vix > 18) volScore += 5;
if (vix > 22) volScore += 10;
if (vix > 30) volScore += 10;

/* 🔥 FIX: nur echtes Stresssignal */
if (isBackwardation) volScore += 15;

/* VOL OF VOL */
if (volOfVol > 1.2) volScore += 5;
if (volOfVol > 1.4) volScore += 5;

/* ================= OPTIONS ================= */

if (skew > 1.1) optionsScore += 5;
if (skew > 1.2) optionsScore += 5;

if (gamma < 0) optionsScore += 10;

/* ================= LIQUIDITY ================= */

if (liquidity < 60) liquidityScore += 5;
if (liquidity < 40) liquidityScore += 10;

if (credit < 0.85) liquidityScore += 5;
if (credit < 0.8) liquidityScore += 10;

/* ================= STRUCTURE ================= */

if (correlation > 1) structureScore += 5;
if (correlation > 2) structureScore += 10;

if (breadth < 0.6) structureScore += 5;
if (breadth < 0.4) structureScore += 10;

if (move > 80) structureScore += 5;
if (move > 100) structureScore += 10;

/* ================= TOTAL ================= */

const total =
volScore +
optionsScore +
liquidityScore +
structureScore;

const score = Math.min(total, 100);

/* ================= FRAGILITY ================= */

let fragility = 0;

if (isBackwardation) fragility += 3;
if (gamma < 0) fragility += 2;
if (correlation > 1) fragility += 1;
if (volOfVol > 1.2) fragility += 1;

const fragilityScore = Math.min(fragility * 10, 100);

/* ================= STATE ================= */

let state = "NEUTRAL";

if (score > 60) state = "RISK_OFF";
else if (score < 25) state = "RISK_ON";

/* ================= RETURN ================= */

return {
score,
state,
fragility: fragilityScore,

components: {
vol: volScore,
options: optionsScore,
liquidity: liquidityScore,
structure: structureScore
},

signals: {
vixTerm: isBackwardation ? "BACKWARDATION" : "CONTANGO",
gamma: gamma < 0 ? "NEGATIVE" : "POSITIVE",
}
};
}
