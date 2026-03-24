export const runtime = "nodejs";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/* ================= MARKET CACHE ================= */

let cachedResponse: any = null;
let lastFetchTime = 0;
let previousCrashProbability = 0;
let smoothedBreadth200 = 0;
let smoothedBreadth50 = 0;

const CACHE_DURATION = 60 * 1000; // 60 Sekunden

/* ================= ETF DATA CACHE ================= */

const etfCache: Record<string, {data:number[], time:number}> = {};

/* ================= UTILITIES ================= */

function percentChange(current: number, previous: number) {
if (previous === 0) return 0;
return ((current - previous) / previous) * 100;
}

function movingAverage(data: number[], period: number) {
if (data.length < period) return null;

const slice = data.slice(-period);
const sum = slice.reduce((a, b) => a + b, 0);

return sum / period;
}

function movingAverageLast(data:number[], period:number){

if(data.length < period) return data[data.length-1] || 0

const slice = data.slice(-period)

const sum = slice.reduce((a,b)=>a+b,0)

return sum/period

}

function detectLowerHigh(closes: number[]) {

if (closes.length < 200) return false;

/* 90 Tage Hoch */

const recentHigh =
Math.max(...closes.slice(-90));

/* vorheriges 90 Tage Hoch */

const previousHigh =
Math.max(...closes.slice(-180,-90));

const difference =
(recentHigh - previousHigh) / previousHigh;

/* 1% reicht bereits */

return difference < -0.01;

}

function relativePerformance(a: number[], b: number[], lookback: number) {
if (a.length < lookback + 1 || b.length < lookback + 1) return 0;
const aReturn = a[a.length - 1] / a[a.length - 1 - lookback] - 1;
const bReturn = b[b.length - 1] / b[b.length - 1 - lookback] - 1;
return aReturn - bReturn;
}

/* ================= CREDIT SPREAD ================= */

async function calculateCreditSpread(fetchETF: any) {

const [hyg, ief] = await Promise.all([
fetchETF("HYG"),
fetchETF("IEF")
]);

if (hyg.length < 60 || ief.length < 60) {
return {
creditSignal: "neutral",
creditRatio: 0
};
}



/* Ratio berechnen */

const ratio = hyg.map((v: number, i: number) => {

if(!ief[i]) return v;

return v / ief[i];

});

/* 50 MA */

const last50 = ratio.slice(-50);
const ma50 =
last50.reduce((a: number, b: number) => a + b, 0) / 50;

const lastRatio = ratio[ratio.length - 1];

/* Signal */

let creditSignal = "neutral";

if (lastRatio > ma50) creditSignal = "risk_on";
if (lastRatio < ma50) creditSignal = "risk_off";

return {
creditSignal,
creditRatio: lastRatio
};

}



/* ================= GEOPOLITICAL / SYSTEMIC SHOCK ENGINE ================= */

function calculateShockEngine(
vix: number,
vixCloses: number[],
spClosesFull: number[]
) {
if(vixCloses.length < 6 || spClosesFull.length < 6){
return {
shockScore:0,
geopoliticalOverride:false,
systemicStress:false,
vix5d:0,
sp1d:0,
sp5d:0
};
}

let shockScore = 0;

const vix5d = percentChange(
vixCloses[vixCloses.length - 1],
vixCloses[vixCloses.length - 6]
);

const sp1d = percentChange(
spClosesFull[spClosesFull.length - 1],
spClosesFull[spClosesFull.length - 2]
);

const sp5d = percentChange(
spClosesFull[spClosesFull.length - 1],
spClosesFull[spClosesFull.length - 6]
);

// VIX Level
const vixRelative = vix / vixCloses[vixCloses.length-6];

if (vixRelative > 1.15) shockScore++;
if (vixRelative > 1.30) shockScore++;
if (vixRelative > 1.45) shockScore++;

// VIX Acceleration
if (vix5d > 25) shockScore++;
if (vix5d > 40) shockScore++;

// NUR 5-Tage Marktstress (1-Tages-Move bleibt berechnet, zählt aber nicht mehr)
if (sp5d < -5) shockScore++;
if (sp5d < -8) shockScore++;

const geopoliticalOverride = shockScore >= 4;
const systemicStress = shockScore >= 6;

return {
shockScore,
geopoliticalOverride,
systemicStress,
vix5d,
sp1d,
sp5d
};
}

/* ============================
REALISTIC DEALER GAMMA EXPOSURE
============================ */

async function calculateGammaExposure(
vix:number,
breadth50:number,
trendAcceleration:number
){

let gamma = 0;

/* Market Stability Proxy */

if(vix < 18 && breadth50 > 0.6){
gamma = 4000000000;
}

/* Crash Gamma */

/* Negative Gamma */

if(
vix > 22 &&
breadth50 < 0.6
){
gamma = -1000000000;
}

/* Stress Gamma */

if(
vix > 26 &&
breadth50 < 0.55 &&
trendAcceleration < -0.5
){
gamma = -3000000000;
}

/* Crash Gamma */

if(
vix > 30 &&
breadth50 < 0.45 &&
trendAcceleration < -1
){
gamma = -6000000000;
}

let regime="neutral";

if(gamma > 2000000000) regime="positive";
if(gamma < 0) regime="negative";
if(gamma < -5000000000) regime="unstable";

return{

gamma,
gammaBillions: gamma/1000000000,
regime

};

}


/* ================= PHASE 6 ACCELERATION TRIGGER ================= */

function calculatePhase6Acceleration(
vixCloses: number[],
spClosesFull: number[],
breadth50: number
) {

if (
vixCloses.length < 3 ||
spClosesFull.length < 4
) {
return {
trigger: false,
score: 0,
details: {}
};
}

/* VIX Momentum (2 Tage) */

const vix2d = percentChange(
vixCloses[vixCloses.length - 1],
vixCloses[vixCloses.length - 3]
);

/* SP 3-Day Move */

const sp3d = percentChange(
spClosesFull[spClosesFull.length - 1],
spClosesFull[spClosesFull.length - 4]
);

let score = 0;

/* VIX Beschleunigung */

if (vix2d > 12) score++;

/* Breadth Breakdown */

if (breadth50 < 0.45) score++;

/* Markt Momentum negativ */

if (sp3d < -1.5) score++;

return {

trigger: score >= 2,

score,

details: {
vix2d,
sp3d,
breadth50
}

};

}



/* ================= FEINE BREADTH LOGIK ================= */

function calculateBreadthScore(breadth200: number, breadth50: number) {
let score = 0;

if (breadth200 < 0.8) score++;
if (breadth200 < 0.6) score++;
if (breadth50 < 0.8) score++;
if (breadth50 < 0.6) score++;

const divergence = breadth200 - breadth50;
if (divergence > 0.25 && breadth200 < 0.7) score++;

if (score > 4) score = 4;

return {
breadthScore: score,
breadthDivergence: divergence
};
}

/* ================= % STOCKS ABOVE 20 DMA ================= */

async function calculateBreadth20(fetchETF:any){

const universe = [
"SPY","QQQ","IWM","DIA","MDY","VTI",
"RSP","MTUM","QUAL","SMH","XBI",
"XLK","XLF","XLE","XLV","XLI",
"XLY","XLP","XLU","XLB",
"SPHB","SPLV","IWO","IWN","MTUM",
"USMV","XRT","SOXX","XLRE"
];

let above20 = 0;
let valid = 0;

const results = await Promise.all(
universe.map(s => fetchETF(s))
);

results.forEach((closes)=>{

if(closes.length < 25) return;

valid++;

const current = closes[closes.length-1];
const ma20 = movingAverage(closes, 20) ?? 0;

if(current > ma20) above20++;

});

const percent = valid ? above20 / valid : 0;

let signal = "neutral";

if(percent < 0.4) signal = "weak";
if(percent < 0.25) signal = "panic";

return {
breadth20: percent,
breadth20Signal: signal
};

}


/* ================= ADVANCE DECLINE LINE ================= */

async function calculateAdvanceDecline(fetchETF:any) {

const universe = [
"SPY","QQQ","IWM","DIA","MDY","VTI",
"XLK","XLF","XLE","XLV","XLI",
"XLY","XLP","XLU","XLB","XLRE"
];

let advances = 0;
let declines = 0;

const results = await Promise.all(
universe.map(s => fetchETF(s))
);

results.forEach((closes)=>{

if (closes.length < 2) return;

const last = closes[closes.length-1];
const prev = closes[closes.length-2];

if (last > prev) advances++;
if (last < prev) declines++;

});

const adValue = advances - declines;

let signal = "neutral";

if (adValue < -2) signal = "weak";
if (adValue < -5) signal = "distribution";

return {
advances,
declines,
adValue,
adSignal: signal
};

}


/* ================= NEW HIGHS / NEW LOWS ================= */

async function calculateHighLowIndicator(fetchETF: (symbol: string) => Promise<number[]>) {

const universe = [
"SPY","QQQ","IWM","DIA","MDY","VTI",
"XLK","XLF","XLE","XLV","XLI",
"XLY","XLP","XLU","XLB","XLRE"
];

let newHighs = 0;
let newLows = 0;
let valid = 0;

const results = await Promise.all(
universe.map(s => fetchETF(s))
);

results.forEach((closes)=>{

if (closes.length < 252) return;

valid++;

const current = closes[closes.length - 1];

const highLookback = Math.min(252, closes.length);

const history = closes.slice(-highLookback, -1);

const high252 = Math.max(...history);
const low252 = Math.min(...history);

if (current >= high252 * 0.99) newHighs++;
if (current <= low252 * 1.01) newLows++;

});

let signal = "neutral";

if (newLows > newHighs) signal = "weak";
if (newLows > newHighs * 2) signal = "distribution";
if (newLows > newHighs * 4) signal = "collapse";

return {
newHighs,
newLows,
highLowSignal: signal
};

}


/* ================= INSTITUTIONELLE DISTRIBUTION ================= */

function calculateInstitutionalDistribution(
spCurrent:number,
spMA50:number,
spMA200:number,
trendAcceleration:number,
breadth200:number,
breadth50:number
){

/* ================= PRICE TREND ================= */

let priceTrend = 0;

if(spCurrent < spMA50) priceTrend += 2;
if(spCurrent < spMA200) priceTrend += 2;
if(trendAcceleration < -1) priceTrend += 2;

priceTrend = Math.min(priceTrend,7);


/* ================= BREADTH WEAKNESS ================= */

let breadthWeakness = 0;

if(breadth200 < 0.6) breadthWeakness += 2;
if(breadth200 < 0.5) breadthWeakness += 2;
if(breadth200 < 0.45) breadthWeakness += 2;
if(breadth50 < 0.4) breadthWeakness += 2;

breadthWeakness = Math.min(breadthWeakness,7);


/* ================= VOLUME (Fallback) ================= */

let volumeTrend = 4; // leicht bearish default


/* ================= FINAL SCORE ================= */

const rawScore =
(priceTrend * 0.4) +
(breadthWeakness * 0.4) +
(volumeTrend * 0.2);

let adjustedScore = rawScore;

// 🔥 Verstärkung bei kritischer Breite
if(breadth200 < 0.5) adjustedScore += 0.5;
if(breadth200 < 0.45) adjustedScore += 0.5;

// 🔥 Verstärkung bei negativem Trend
if(spCurrent < spMA200) adjustedScore += 0.5;

// Final
const score = Math.min(7, Math.round(adjustedScore));

/* ================= INTERPRETATION ================= */

return {
distributionScore: score,
institutionalDistribution: score >= 3,
distributionIntensity:
score >= 6
? "hoch"
: score >= 4
? "mittel"
: score >= 2
? "früh"
: "keine",
};
}


/* ================= ADAPTIVE CONFIDENCE ================= */

function calculateAdaptiveConfidence(
phase: string,
structureScore: number,
rotationScore: number,
stressScore: number,
breadthScore: number,
distributionScore: number,
shockScore: number
) {
let base = 100;

/* Vereinfachte institutionelle Gewichtung */
base -= structureScore * 6;
base -= rotationScore * 5;
base -= stressScore * 4;
base -= shockScore * 3;

/* Breadth & Distribution nur indirekt über Structure/Rotation */

return Math.max(20, Math.min(98, base));
}

/* ================= FRAGILITY INDEX ================= */

function calculateFragilityIndex(
breadth200:number,
breadth50:number,
distributionScore:number,
rotationScore:number,
trendAcceleration:number
){

let fragility = 0;

if(breadth200 < 0.7) fragility += 1;
if(breadth200 < 0.5) fragility += 2;

if(breadth50 < 0.6) fragility += 1;
if(breadth50 < 0.4) fragility += 2;

fragility += distributionScore * 0.5;
fragility += rotationScore * 0.5;

if(trendAcceleration < -1) fragility += 1;

let regime = "stable";

if(fragility > 3) regime = "fragile";
if(fragility > 6) regime = "high_risk";

return {
fragility,
fragilityRegime: regime
};

}

/* ================= REGIME STABILITY SCORE ================= */

function calculateRegimeStability(

structureScore:number,
breadth200:number,
breadth50:number,
distributionScore:number,
marketStressScore:number,
fragilityIndex:number,
gammaRegime:string,
creditSignal:string,
vix:number

){

let score = 100

/* Strukturprobleme */

score -= structureScore * 6

/* Marktbreite */

if(breadth200 < 0.7) score -= 5
if(breadth200 < 0.55) score -= 8
if(breadth200 < 0.4) score -= 10

if(breadth50 < 0.6) score -= 4
if(breadth50 < 0.4) score -= 6

/* Distribution */

score -= distributionScore * 3

/* Marktstress */

score -= marketStressScore * 4

/* Fragility */

score -= fragilityIndex * 2

/* Optionsstruktur */

if(gammaRegime === "negative") score -= 4
if(gammaRegime === "unstable") score -= 8

/* Kreditstress */

if(creditSignal === "risk_off") score -= 6

/* Volatilität */

if(vix > 25) score -= 4
if(vix > 30) score -= 6

score = Math.max(0,Math.min(100,Math.round(score)))

let regime="stable"

if(score < 70) regime="neutral"
if(score < 50) regime="fragile"
if(score < 30) regime="unstable"
if(score < 15) regime="crisis"

return{

score,
regime

}

}

/* ================= REGIME AMPEL ================= */

function calculateRegimeSignal(

crashProbability:number,
marketStress:number,
fragility:number,
correlationScore:number,
creditSignal:string

){

let score = 0

score += crashProbability * 0.04

score += marketStress * 2

score += fragility

score += correlationScore * 2

if(creditSignal === "risk_off")
score += 3

let regime="risk_on"

if(score > 8) regime="fragile"
if(score > 14) regime="risk_off"
if(score > 20) regime="crash_risk"

return{

score: Math.round(score),
regime

}

}


/* ================= MARKET STRESS PANEL ================= */

function calculateMarketStress(
vix:number,
move:number,
breadth200:number,
creditSignal:string,
fragility:number
){

let score = 0

// VIX
if(vix > 22) score += 1
if(vix > 28) score += 1
if(vix > 35) score += 1

// MOVE – Bond Market Stress

if(move > 110) score += 1
if(move > 130) score += 1
if(move > 150) score += 1

// Breadth
if(breadth200 < 0.7) score += 1
if(breadth200 < 0.5) score += 1

// Credit
if(creditSignal === "risk_off") score += 2

// Fragility
if(fragility > 3) score += 1
if(fragility > 6) score += 2

let regime="normal"

if(score >=3) regime="caution"
if(score >=5) regime="stress"
if(score >=7) regime="crash_risk"

score = Math.min(score, 5)
return{
score,
regime
}

}

/* ================= FINANCIAL CONDITIONS INDEX ================= */

function calculateFinancialConditions(

vix:number,
move:number,
creditSignal:string,
breadth200:number,
dxy:number

){

let score = 0

/* Volatility Stress */

if(vix > 20) score += 1
if(vix > 25) score += 1
if(vix > 30) score += 1

/* Bond Market Stress */

if(move > 110) score += 1
if(move > 130) score += 1

/* Credit */

if(creditSignal === "risk_off") score += 2

/* Market Breadth */

if(breadth200 < 0.7) score += 1
if(breadth200 < 0.5) score += 1

/* Dollar Stress */

if(dxy > 105) score += 1
if(dxy > 110) score += 1

let regime = "easy"

if(score >=3) regime = "neutral"
if(score >=5) regime = "tight"
if(score >=7) regime = "crisis"

return{

score,
regime

}

}

/* ================= FED STYLE MARKET LIQUIDITY INDEX ================= */

function calculateMarketLiquidityIndex(

vix:number,
move:number,
creditSignal:string,
breadth200:number,
dxy:number,
gammaRegime:string

){

let score = 100

/* VOLATILITY LIQUIDITY */

if(vix > 20) score -= 5
if(vix > 25) score -= 8
if(vix > 30) score -= 12

/* BOND MARKET LIQUIDITY */

if(move > 110) score -= 5
if(move > 130) score -= 8
if(move > 150) score -= 10

/* CREDIT CONDITIONS */

if(creditSignal === "risk_off") score -= 10

/* MARKET DEPTH */

if(breadth200 < 0.7) score -= 4
if(breadth200 < 0.55) score -= 6
if(breadth200 < 0.4) score -= 10

/* DOLLAR LIQUIDITY */

if(dxy > 105) score -= 3
if(dxy > 110) score -= 6

/* OPTIONS LIQUIDITY */

if(gammaRegime === "negative") score -= 4
if(gammaRegime === "unstable") score -= 8

score = Math.max(0,Math.min(100,Math.round(score)))

let regime = "abundant"

if(score < 80) regime = "normal"
if(score < 60) regime = "tightening"
if(score < 40) regime = "stress"
if(score < 25) regime = "liquidity_crisis"

return{

score,
regime

}

}


/* ================= CRASH PROBABILITY ENGINE ================= */

function calculateCrashProbability(
structureScore:number,
breadthScore:number,
distributionScore:number,
stressScore:number,
shockScore:number,
creditSignal:string,
gammaRegime:string,
internalMomentumScore:number,
concentrationScore:number
){

let score = 0;

score += structureScore * 0.5;
score += breadthScore * 0.4;
score += stressScore * 0.3;
score += shockScore * 0.25;
score += concentrationScore * 0.25;

/* Distribution nur Frühsignal */
score += Math.min(distributionScore,7) * 0.5;

if (creditSignal === "risk_off") score += 1.0;

if(gammaRegime === "negative") score += 0.5;

if(gammaRegime === "unstable") score += 1;

if(internalMomentumScore < -4) score += 2
else if(internalMomentumScore < -2) score += 1



/* logistische Wahrscheinlichkeit */

console.log({
structureScore,
breadthScore,
distributionScore,
stressScore,
shockScore,
creditSignal,
gammaRegime,
internalMomentumScore,
concentrationScore,
score
});

const normalizedScore =
Math.min(score, 12);

let rawProbability =
100 *
(1 /
(1 +
Math.exp(-(normalizedScore - 6.7))
));

/* ===== SMOOTHING + NOISE FILTER ===== */

let probability =
(previousCrashProbability * 0.4) +
(rawProbability * 0.6)

console.log({
normalizedScore,
rawProbability,
previousCrashProbability
});

/* kleine Bewegungen ignorieren */

if(Math.abs(probability - previousCrashProbability) < 1){
probability = previousCrashProbability
}

previousCrashProbability = probability

probability = Math.round(probability)

return {
probability,
regime:
probability > 80 ? "crash_imminent" :
probability > 60 ? "high_risk" :
probability > 40 ? "elevated" :
probability > 20 ? "watch" :
"low"
};

}

/* ================= CRASH ATTRIBUTION ENGINE ================= */

function calculateCrashAttribution(

breadth20:number,
spMomentum:string,
liquidityVacuumScore:number,
gammaRegime:string,
dealerPressureScore:number,
creditStressScore:number,
vix:number

){

/* STRUCTURE RISK */

let structureRisk = 0

if(breadth20 < 0.45) structureRisk += 5
if(breadth20 < 0.35) structureRisk += 5

if(spMomentum === "weak") structureRisk += 3
if(spMomentum === "downtrend") structureRisk += 7


/* LIQUIDITY RISK */

let liquidityRisk =
Math.min(liquidityVacuumScore * 2 , 20)


/* OPTIONS RISK */

let optionsRisk = 0

if(gammaRegime === "negative") optionsRisk += 6
if(gammaRegime === "unstable") optionsRisk += 10

optionsRisk += dealerPressureScore * 1.5


/* MACRO RISK */

let macroRisk = 0

macroRisk += creditStressScore * 2

if(vix > 22) macroRisk += 4
if(vix > 28) macroRisk += 6


return{

structureRisk: Math.round(structureRisk),
liquidityRisk: Math.round(liquidityRisk),
optionsRisk: Math.round(optionsRisk),
macroRisk: Math.round(macroRisk)

}

}


/* ================= CRASH RADAR (3-5 TAGE) ================= */

function calculateCrashRadar(

vixCloses:number[],
spCloses:number[],
breadth20:number,
breadth50:number,
gammaRegime:string

){

if(
vixCloses.length < 4 ||
spCloses.length < 4
){
return{
trigger:false,
score:0
};
}

const vix3d = percentChange(
vixCloses[vixCloses.length-1],
vixCloses[vixCloses.length-4]
);

const sp3d = percentChange(
spCloses[spCloses.length-1],
spCloses[spCloses.length-4]
);

let score = 0;



/* Gamma Stress */

if(gammaRegime === "negative"){
score += 1;
}

if(gammaRegime === "unstable"){
score += 2;
}

/* VIX explosion */

if(vix3d > 15) score++;
if(vix3d > 30) score++;

/* Momentum break */

if(sp3d < -2) score++;
if(sp3d < -4) score++;

/* Breadth collapse */

if(breadth20 < 0.4) score++;
if(breadth20 < 0.25) score++
if(breadth50 < 0.45) score++;
if(breadth50 < 0.35) score++;

return{

trigger: score >= 4,
score

};

}


/* ================= PUT DECISION ENGINE ================= */

function calculatePutDecision(

phase:string,
crashProbability:number,
distributionScore:number,
breadth200:number,
creditSignal:string,
vix:number,
vixTermStructure:string

){

let score = 0;
/* Frühe institutionelle Absicherung */

if(phase.includes("Phase 4")){
score += 1;

if(distributionScore >= 3)
score += 2;

if(distributionScore >= 5)
score += 3;
}

/* Phase */

if(phase.includes("Phase 5")) score += 2;
if(phase.includes("Phase 6")) score += 3;
if(phase.includes("Phase 7")) score += 4;

/* Crash Risk */

if(crashProbability > 40) score += 1;
if(crashProbability > 60) score += 2;
if(crashProbability > 75) score += 3;

/* Distribution */

if(distributionScore >= 3) score += 1;
if(distributionScore >= 5) score += 2;

/* Breadth */

if(breadth200 < 0.6) score += 1;
if(breadth200 < 0.4) score += 2;

/* Credit */

if(creditSignal === "risk_off") score += 2;

/* VIX */

if(vix > 25) score += 1;

/* Volatility Term Structure */

if(vixTermStructure === "backwardation") score += 2;

let decision = "NEUTRAL";

if(score <= 2) decision = "EXIT PUTS";

else if(score <= 4) decision = "REDUCE PUTS";

else if(score <= 7) decision = "HOLD PUTS";

else decision = "ADD PUTS";

score = Math.min(score,10)

return {

score,
decision

};

}



/* ================= SPX MOMENTUM REGIME ================= */

function calculateSPXMomentum(
spx:number,
ma50:number,
ma200:number,
spCloses:number[]
){

if(spCloses.length < 60){
return{score:0,regime:"neutral"}
}

let score = 0

/* Trend */

if(spx > ma50) score += 1
else score -= 1

if(spx > ma200) score += 1
else score -= 1

/* Trend Stärke */

const momentum20 =
percentChange(
spCloses[spCloses.length-1],
spCloses[spCloses.length-21]
)

if(momentum20 > 3) score += 1
if(momentum20 < -3) score -= 1

/* Trend Beschleunigung */

const momentum60 =
percentChange(
spCloses[spCloses.length-1],
spCloses[spCloses.length-61]
)

const acceleration =
momentum20 - momentum60

if(acceleration > 3) score += 1
if(acceleration < -3) score -= 1

let regime="neutral"

if(score >=3) regime="strong_bull"
else if(score >=1) regime="bull"
else if(score <= -3) regime="strong_bear"
else if(score <= -1) regime="bear"

return{
score,
regime
}

}


/* ================= VIX TERM STRUCTURE RATIO ================= */

function calculateVIXTermRatio(
vix:number,
vix3m:number
){

if(vix3m === 0){
return{
ratio:0,
regime:"neutral"
}
}

const ratio = vix / vix3m

let regime="normal"

if(ratio < 0.9) regime="risk_on"
else if(ratio < 1.05) regime="neutral"
else if(ratio < 1.15) regime="stress"
else regime="panic"

return{
ratio,
regime
}

}

/* ================= VOLATILITY OF VOLATILITY ================= */

function calculateVolatilityOfVol(
vix:number,
vix9d:number
){

if(vix === 0){
return{
ratio:0,
regime:"neutral"
}
}

const ratio = vix9d / vix

let regime="normal"

if(ratio > 1.2) regime="elevated"
if(ratio > 1.35) regime="stress"
if(ratio > 1.5) regime="panic"

return{
ratio,
regime
}

}

/* ================= VOL OF VOL TREND ================= */

function calculateVolOfVolTrend(
vixCloses:number[],
vix9dCloses:number[]
){

if(vixCloses.length < 2 || vix9dCloses.length < 2){
return "flat"
}

const todayRatio =
vix9dCloses[vix9dCloses.length-1] /
vixCloses[vixCloses.length-1]

const yesterdayRatio =
vix9dCloses[vix9dCloses.length-2] /
vixCloses[vixCloses.length-2]

const change = todayRatio - yesterdayRatio

if(change > 0.02) return "up"
if(change < -0.02) return "down"

return "flat"

}


/* ================= OPTIONS SKEW PROXY ================= */

function calculateOptionsSkew(
vix9d:number,
vix3m:number
){

if(vix3m === 0){
return{
ratio:0,
regime:"neutral"
}
}

const ratio = vix9d / vix3m

let regime="normal"

if(ratio > 1.05) regime="hedging"
if(ratio > 1.15) regime="heavy_hedging"
if(ratio > 1.3) regime="crash_hedging"

return{
ratio,
regime
}

}


/* ================= DEALER POSITIONING PRESSURE ================= */

function calculateDealerPressure(
gammaRegime:string,
vix:number,
vixTermRatio:number
){

let score = 0

/* Negative Gamma verstärkt Bewegungen */

if(gammaRegime === "negative") score += 1
if(gammaRegime === "unstable") score += 2

/* Volatility Stress */

if(vix > 22) score += 1
if(vix > 28) score += 1

/* Term Structure Stress */

if(vixTermRatio > 1.05) score += 1
if(vixTermRatio > 1.15) score += 1

let regime = "neutral"

if(score >= 2) regime = "pressure"
if(score >= 4) regime = "high_pressure"

return{
score,
regime
}

}

/* ================= LIQUIDITY VACUUM DETECTOR ================= */

function calculateLiquidityVacuum(

gammaRegime:string,
vix:number,
vixTermRatio:number,
breadth20:number,
sp3d:number

){

let score = 0

/* Negative Gamma */

if(gammaRegime === "negative") score += 1
if(gammaRegime === "unstable") score += 2

/* Volatility Stress */

if(vix > 22) score += 1
if(vix > 28) score += 1

/* Volatility Term Stress */

if(vixTermRatio > 1.05) score += 1
if(vixTermRatio > 1.15) score += 1

/* Breadth Collapse */

if(breadth20 < 0.4) score += 1
if(breadth20 < 0.25) score += 2

/* Price Acceleration */

if(sp3d < -2) score += 1
if(sp3d < -4) score += 2

let regime="normal"

if(score >= 3) regime="unstable_liquidity"
if(score >= 5) regime="liquidity_vacuum"
if(score >= 7) regime="crash_mode"

return{

score,
regime

}

}


/* ================= LIQUIDITY REGIME ================= */

function calculateLiquidityRegime(

creditSignal:string,
breadth50:number,
adValue:number

){

let liquidityScore = 0;

if(creditSignal === "risk_off") liquidityScore += 2;

if(breadth50 < 0.5) liquidityScore += 1;
if(adValue < -4) liquidityScore += 1;

let regime = "normal";

if(liquidityScore >= 2) regime = "tightening";
if(liquidityScore >= 4) regime = "stress";
if(liquidityScore >= 6) regime = "liquidity_crisis";

return {
liquidityScore,
liquidityRegime: regime
};

}

/* ================= MARKET INTERNAL MOMENTUM ================= */

function calculateInternalMomentum(
breadth20:number,
breadth50:number,
breadth200:number
){

let score = 0

/* kurzfristige Marktbreite */

if(breadth20 > 0.7) score += 1
if(breadth20 < 0.4) score -= 1
if(breadth20 < 0.25) score -= 2

/* mittelfristige Breite */

if(breadth50 > 0.7) score += 1
if(breadth50 < 0.5) score -= 1
if(breadth50 < 0.35) score -= 2

/* langfristige Struktur */

if(breadth200 > 0.75) score += 1
if(breadth200 < 0.6) score -= 1
if(breadth200 < 0.45) score -= 2

let regime = "neutral"

if(score >= 3) regime = "strong_bull"
else if(score >= 1) regime = "bull"
else if(score <= -3) regime = "strong_bear"
else if(score <= -1) regime = "bear"

return{
score,
regime
}

}

/* ================= CONCENTRATION RISK (RSP vs SPY) ================= */

function calculateConcentrationRisk(
rspCloses:number[],
spyCloses:number[]
){

if(rspCloses.length < 21 || spyCloses.length < 21){
return{
divergence:0,
score:0,
regime:"neutral"
}
}

const rsp20 =
percentChange(
rspCloses[rspCloses.length-1],
rspCloses[rspCloses.length-21]
)

const spy20 =
percentChange(
spyCloses[spyCloses.length-1],
spyCloses[spyCloses.length-21]
)

const divergence = rsp20 - spy20

let score = 0

if(divergence < -1) score += 1
if(divergence < -2) score += 1
if(divergence < -3) score += 1

let regime="normal"

if(score === 1) regime="mild_concentration"
if(score === 2) regime="high_concentration"
if(score === 3) regime="extreme_concentration"

return{
divergence,
score,
regime
}

}

/* ================= CROSS ASSET RISK ================= */

function calculateCrossAssetRisk(

sp20:number,
tlt20:number,
dxy20:number,
vix:number,
creditSignal:string

){

let score = 0;

/* Equity Momentum */

if(sp20 < -2) score += 1
if(sp20 < -5) score += 1

/* Bond Flight to Safety */

if(tlt20 > 2) score += 1
if(tlt20 > 5) score += 1

/* Dollar Stress */

if(dxy20 > 1.5) score += 1
if(dxy20 > 3) score += 1

/* Volatility */

if(vix > 22) score += 1
if(vix > 28) score += 1

/* Credit Stress */

if(creditSignal === "risk_off") score += 2

let regime = "risk_on"

if(score >=3) regime = "neutral"
if(score >=5) regime = "risk_off"
if(score >=7) regime = "systemic_risk"

return{

score,
regime

}

}

/* ================= CORRELATION SPIKE ================= */

function calculateCorrelationSpike(
spyCloses:number[],
qqqCloses:number[],
iwmCloses:number[],
tltCloses:number[],
hygCloses:number[]
){

if(
spyCloses.length < 10 ||
qqqCloses.length < 10 ||
iwmCloses.length < 10 ||
tltCloses.length < 10 ||
hygCloses.length < 10
){
return{
correlation:0,
score:0,
regime:"normal"
}
}

/* 5-Tage Returns */

function ret(series:number[]){
return percentChange(
series[series.length-1],
series[series.length-6]
)
}

const r1 = ret(spyCloses)
const r2 = ret(qqqCloses)
const r3 = ret(iwmCloses)
const r4 = ret(tltCloses)
const r5 = ret(hygCloses)

const returns = [r1,r2,r3,r4,r5]

/* einfache Dispersion */

const avg =
returns.reduce((a,b)=>a+b,0) / returns.length

const variance =
returns.reduce((a,b)=>a + Math.pow(b-avg,2),0) / returns.length

const dispersion = Math.sqrt(variance)

/* niedrige Dispersion = hohe Korrelation */

let score = 0

if(dispersion < 2) score += 1
if(dispersion < 1.5) score += 1
if(dispersion < 1) score += 1

let regime="normal"

if(score === 1) regime="rising_correlation"
if(score === 2) regime="high_correlation"
if(score === 3) regime="correlation_spike"

return{

correlation: Number(dispersion.toFixed(2)),
score,
regime

}

}


/* ================= HISTORIE ================= */

const historyFile = path.join(process.cwd(), "regime-history.json");

function saveRegimeSnapshot(snapshot: any) {
let history: any[] = [];

if (fs.existsSync(historyFile)) {
history = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
}

const today = new Date().toISOString().split("T")[0];

if (!history.some((e) => e.date.split("T")[0] === today)) {
history.push(snapshot);
if (history.length > 250)
history = history.slice(-250);
fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}
}

function loadHistory() {
if (!fs.existsSync(historyFile)) return [];
return JSON.parse(fs.readFileSync(historyFile, "utf-8"));
}

/* ================= INSTITUTIONELLE PHASENLOGIK 2.0 ================= */

function determinePhase(
structureScore: number,
rotationScore: number,
stressScore: number,
breadth200: number,
trendAcceleration: number,
breadthScore: number,
spAbove200: boolean
) {

if (!spAbove200 && structureScore >= 4 && breadth200 < 0.5) {
if (stressScore >= 2)
return "Phase 7 – Kapitulation";
return "Phase 6 – Bärische Kontraktion";
}

if (!spAbove200) {
return "Phase 5 – Späte Distribution";
}

let internalWeakness = 0;

if (rotationScore >= 2) internalWeakness++;
if (breadthScore >= 2) internalWeakness++;
if (trendAcceleration < -2) internalWeakness++;
if (stressScore >= 1) internalWeakness++;

if (internalWeakness >= 2) {
return "Phase 4 – Frühe Distribution";
}

if (breadth200 >= 0.8 && rotationScore <= 1) {
return "Phase 2 – Breite Expansion";
}

if (rotationScore <= 2 && trendAcceleration > 0) {
return "Phase 3 – Momentum-Expansion";
}

return "Phase 1 – Frühe Expansion";
}



/* ================= MACRO NEWS ENGINE ================= */

async function fetchNewsSentiment() {

try {

const res = await fetch(
`https://finnhub.io/api/v1/news?category=general&token=${process.env.FINNHUB_API_KEY}`
);

const data = await res.json();

const articles = Array.isArray(data) ? data.slice(0,15) : [];

const riskOffWords = [
"recession","crisis","war","inflation","rate hike",
"default","bankruptcy","layoffs","conflict",
"oil spike","yield spike","credit stress"
];

const riskOnWords = [
"growth","stimulus","rate cut","soft landing",
"ai boom","productivity","expansion",
"earnings beat","innovation"
];

let sentimentScore = 0;

for(const article of articles){

const text =
(article.headline + " " + article.summary).toLowerCase();

for(const word of riskOffWords){
if(text.includes(word)) sentimentScore -= 1;
}

for(const word of riskOnWords){
if(text.includes(word)) sentimentScore += 1;
}

}

const normalizedScore =
(sentimentScore / (articles.length * 2)) * 0.5;

let regime = "Neutral";

if(normalizedScore > 0.2) regime = "Risk-On";
if(normalizedScore < -0.2) regime = "Risk-Off";

return {

score: Number(normalizedScore.toFixed(2)),
overall: regime,

topHeadlines: articles.slice(0,5).map(a => ({
headline: a.headline,
source: a.source,
url: a.url
}))

};

} catch(err){

console.error("News Engine Error:", err);

return {
score: 0,
overall: "Neutral",
topHeadlines: []
};

}

}


/* ================= MAIN ================= */

export async function GET() {

const now = Date.now();

/* CACHE CHECK */

if (
cachedResponse &&
(now - lastFetchTime) < CACHE_DURATION
) {
return NextResponse.json(cachedResponse);
}

try {
const marketData: any = {};
const indices = [
{ key: "^DJI", label: "dow" },
{ key: "^NDX", label: "nasdaq" },
{ key: "^GSPC", label: "spx" },
{ key: "^RUT", label: "russell" }
];

const indexResults = await Promise.all(
indices.map(i => fetchIndex(i.key,"5d"))
);

indices.forEach((idx, i) => {

const closes = indexResults[i];

if (closes.length < 2) return;

const current = closes[closes.length - 1];
const previous = closes[closes.length - 2];

marketData[idx.key] = {
current,
previous,
change: percentChange(current, previous)
};

});

const etfs = [
"qqq.us","iwm.us","spy.us","dia.us","ivw.us","ive.us","rsp.us",
];

const etfResponses = await Promise.all(
etfs.map(s => fetch(`https://stooq.com/q/d/l/?s=${s}&i=d`))
);

const etfTexts = await Promise.all(
etfResponses.map(r => r.text())
);

etfs.forEach((s, i) => {

const rows = etfTexts[i].trim().split("\n");

if(rows.length < 3) return;

const last = rows[rows.length - 1].split(",");
const prev = rows[rows.length - 2].split(",");

marketData[s] = {
current: parseFloat(last[4]),
previous: parseFloat(prev[4]),
change: percentChange(parseFloat(last[4]), parseFloat(prev[4])),
};

});

const breadthUniverse = [
"SPY", // S&P500
"QQQ", // Nasdaq 100
"IWM", // Russell 2000
"DIA", // Dow
"MDY", // Midcap
"VTI", // Total Market

// Sektoren
"XLK", // Tech
"XLF", // Financials
"XLE", // Energy
"XLV", // Healthcare
"XLI", // Industrials
"XLY", // Consumer Discretionary
"XLP", // Consumer Staples
"XLU", // Utilities
"XLB", // Materials
"XLRE", // Real Estate
"SMH",
"XBI",
"ARKK",
"MTUM",
"QUAL",
"IYR"
];

async function fetchETF(symbol: string) {

/* CACHE HIT */

if (etfCache[symbol]){

const age =
Date.now() - etfCache[symbol].time

if(age < 15 * 60 * 1000){
return etfCache[symbol].data
}

}

try {

/* ================= YAHOO ================= */

const res = await fetch(
`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2y`,
{
headers:{
"User-Agent":"Mozilla/5.0",
"Accept":"application/json"
},
cache:"no-store"
}
)

const data = await res.json()

if(data?.chart?.result){

const closes =
data.chart.result[0].indicators.quote[0].close ?? []

const cleaned =
closes.filter((v:number)=>v !== null)

if(cleaned.length > 50){

etfCache[symbol] = {
data: cleaned,
time: Date.now()
}
return cleaned

}

}

/* ================= FALLBACK STOOQ ================= */

console.log("Yahoo failed -> using STOOQ:",symbol)

const stooqSymbol = symbol.toLowerCase() + ".us"

const res2 =
await fetch(`https://stooq.com/q/d/l/?s=${stooqSymbol}&i=d`)

const text = await res2.text()

const rows = text.trim().split("\n")

const closes =
rows.slice(1).map(r=>parseFloat(r.split(",")[4]))

etfCache[symbol] = {
data: closes,
time: Date.now()
}

return closes

}catch(err){

console.log("ETF Fetch Error:",symbol)

return []

}

}
async function fetchIndex(symbol: string, range = "2y") {

try {

const res = await fetch(
`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`,
{
headers: {
"User-Agent": "Mozilla/5.0",
"Accept": "application/json"
},
cache: "no-store"
}
);

const data = await res.json();

if (!data?.chart?.result) {
console.log("Index API error:", symbol);
return [];
}

const closes =
data.chart.result[0].indicators.quote[0].close ?? [];

return closes.filter((v: number) => v !== null);

} catch (e) {

console.log("Index fetch error:", symbol);
return [];

}
}


const spClosesFull = await fetchIndex("^GSPC","5y");

const spCurrent = spClosesFull.length ? spClosesFull[spClosesFull.length - 1] : 0;

const spMA200 = movingAverage(spClosesFull,200);
const spMA50 = movingAverage(spClosesFull,50);

/* ================= SPX MOMENTUM ================= */

const spMomentum =
spMA50 && spMA200
? calculateSPXMomentum(
spCurrent,
spMA50,
spMA200,
spClosesFull
)
: {score:0,regime:"neutral"}

if(!spMA50 || !spMA200){
console.log("SPX MA missing")
}

const spAbove200 = spMA200 ? spCurrent > spMA200 : false;
const spAbove50 = spMA50 ? spCurrent > spMA50 : false;

const spLowerHigh = detectLowerHigh(spClosesFull);

const breadthResults = await Promise.all(
breadthUniverse.map(s => fetchETF(s))
);

let above200Count = 0;
let above50Count = 0;
let validAssets = 0;

breadthResults.forEach((closes, i) => {

if (closes.length < 200) return;

validAssets++;

const current = closes[closes.length - 1];

const ma200 = movingAverage(closes,200);
const ma50 = movingAverage(closes,50);

if (current > ma200) above200Count++;
if (current > ma50) above50Count++;

});

let rawBreadth200 = validAssets ? above200Count / validAssets : 0;
let rawBreadth50 = validAssets ? above50Count / validAssets : 0;

/* ===== EMA SMOOTHING ===== */

if(smoothedBreadth200 === 0) smoothedBreadth200 = rawBreadth200;
else smoothedBreadth200 =
(smoothedBreadth200 * 0.5) + (rawBreadth200 * 0.5);

if(smoothedBreadth50 === 0) smoothedBreadth50 = rawBreadth50;
else smoothedBreadth50 =
(smoothedBreadth50 * 0.5) + (rawBreadth50 * 0.5);

const breadth200 = smoothedBreadth200;
const breadth50 = smoothedBreadth50;

console.log({
assets: validAssets,
above200Count,
above50Count
});

const { breadthScore, breadthDivergence } =
calculateBreadthScore(breadth200, breadth50);

/* HIGH LOW BREADTH */

const highLowData =
await calculateHighLowIndicator(fetchETF);

/* ADVANCE DECLINE */

const adData =
await calculateAdvanceDecline(fetchETF);

const breadth20Data =
await calculateBreadth20(fetchETF);

/* ================= INTERNAL MOMENTUM ================= */

const internalMomentum =
calculateInternalMomentum(
breadth20Data.breadth20,
breadth50,
breadth200
);

/* CREDIT SPREAD */

const creditData = await calculateCreditSpread(fetchETF);

const vixCloses = await fetchIndex("^VIX","5d");
const dxyCloses = await fetchIndex("DX-Y.NYB","5d");

const dxy =
dxyCloses.length ?
dxyCloses[dxyCloses.length - 1] : 0;

const dxy20 =
dxyCloses.length > 21
? percentChange(
dxyCloses[dxyCloses.length-1],
dxyCloses[dxyCloses.length-21]
)
: 0;

/* ================= MOVE INDEX ================= */

const moveCloses = await fetchIndex("^MOVE","5d");

const move =
moveCloses.length ?
moveCloses[moveCloses.length - 1] : 0;


/* ================= VOLATILITY TERM STRUCTURE ================= */

const vix3mCloses = await fetchIndex("^VIX3M","5d");
const vix = vixCloses.length ? vixCloses[vixCloses.length - 1] : 0;
const vix5DayAverage =
movingAverageLast(vixCloses,5);

const vix3m =
vix3mCloses.length ?
vix3mCloses[vix3mCloses.length - 1] : 0;

/* ================= VIX TERM RATIO ================= */

const vixTermRatio =
calculateVIXTermRatio(
vix,
vix3m
);

const vix9dCloses = await fetchIndex("^VIX9D","5d");

const vix9d =
vix9dCloses.length ?
vix9dCloses[vix9dCloses.length - 1] : 0;

/* ================= VOL OF VOL ================= */

const volOfVol =
calculateVolatilityOfVol(
vix,
vix9d
);

const volOfVolTrend =
calculateVolOfVolTrend(
vixCloses,
vix9dCloses
);


/* ================= OPTIONS SKEW ================= */

const optionsSkew =
calculateOptionsSkew(
vix9d,
vix3m
);

let vixTermStructure = "contango";

if(vix > vix3m){
vixTermStructure = "backwardation";
}

if(vix9d > vix3m){
vixTermStructure = "stress";
}

const vixSpread = vix3m - vix;

if(vixSpread < 0){
vixTermStructure = "backwardation";
}

if(vixSpread < -3){
vixTermStructure = "stress";
}


const shockData = calculateShockEngine(
vix,
vixCloses,
spClosesFull
);

marketData["^VIX"] = {
current: vix,
change: vixCloses.length > 1
? ((vix - vixCloses[vixCloses.length - 2]) /
vixCloses[vixCloses.length - 2]) * 100
: 0
};

/* PHASE 6 ACCELERATION */

const phase6Acceleration =
calculatePhase6Acceleration(
vixCloses,
spClosesFull,
breadth50
);

const sp = {
current: marketData["spy.us"]?.current || spCurrent,
previous: marketData["spy.us"]?.previous || spCurrent,
above200: spAbove200,
above50: spAbove50,
lowerHigh: spLowerHigh
};

const [qqq, iwm, ivw, ive, tlt, rsp, spy, hyg] = await Promise.all([
fetchETF("QQQ"),
fetchETF("IWM"),
fetchETF("IVW"),
fetchETF("IVE"),
fetchETF("TLT"),
fetchETF("RSP"),
fetchETF("SPY"),
fetchETF("HYG")
]);

const tlt20 =
tlt.length > 21
? percentChange(
tlt[tlt.length-1],
tlt[tlt.length-21]
)
: 0;

const rsSmall20 = relativePerformance(iwm, qqq, 20);
const rsSmall60 = relativePerformance(iwm, qqq, 60);
const rsGrowth20 = relativePerformance(ivw, ive, 20);
const rsGrowth60 = relativePerformance(ivw, ive, 60);

const rsShiftSmall = rsSmall20 - rsSmall60;
const rsShiftGrowth = rsGrowth20 - rsGrowth60;

/* ================= CONCENTRATION ================= */

const concentration =
calculateConcentrationRisk(
rsp,
spy
);

/* ================= LIQUIDITY PROXY ================= */

let liquidityFlow = "neutral";

if(tlt.length && spClosesFull.length){

if(spClosesFull.length < 61){
throw new Error("Not enough SP data");
}

const sp20Momentum =
percentChange(
spClosesFull[spClosesFull.length-1],
spClosesFull[spClosesFull.length-21]
);

if(tlt20 > sp20Momentum && creditData.creditSignal === "risk_off")
liquidityFlow = "risk_off";
if(tlt20 < sp20Momentum) liquidityFlow = "risk_on";

}


let structureScore = 0;
if (!sp.above200) structureScore += 2;
if (!sp.above50) structureScore += 1;
if (sp.lowerHigh) structureScore += 1;
if (breadth20Data.breadth20 < 0.4) structureScore += 1;

let rotationScore = 0;
if (rsSmall20 < -0.04) rotationScore++;
if (rsSmall20 < -0.07) rotationScore++;
if (rsGrowth20 < -0.03) rotationScore++;
if (rsGrowth20 < -0.06) rotationScore++;
if (rsShiftSmall < -0.04) rotationScore++;
if (rsShiftGrowth < -0.04) rotationScore++;
if (rotationScore > 5) rotationScore = 5;

if(spClosesFull.length < 61){
throw new Error("Not enough SP data");
}
const sp20 = percentChange(
spClosesFull[spClosesFull.length - 1],
spClosesFull[spClosesFull.length - 21]
);

const crossAssetRisk =
calculateCrossAssetRisk(

sp20,
tlt20,
dxy20,
vix,
creditData.creditSignal

)

/* ================= CORRELATION SPIKE ================= */

const correlationSpike =
calculateCorrelationSpike(
spy,
qqq,
iwm,
tlt,
hyg
)

const sp60 = percentChange(
spClosesFull[spClosesFull.length - 1],
spClosesFull[spClosesFull.length - 61]
);

const trendAcceleration = sp20 - sp60;

const gamma = await calculateGammaExposure(
vix,
breadth50,
trendAcceleration
);
const gammaRegime = gamma.regime;

/* ================= DEALER PRESSURE ================= */

const dealerPressure =
calculateDealerPressure(
gammaRegime,
vix,
vixTermRatio.ratio
);

const crashRadar = calculateCrashRadar(
vixCloses,
spClosesFull,
breadth20Data.breadth20,
breadth50,
gammaRegime
);

/* ================= LIQUIDITY VACUUM ================= */

const sp3dMove =
percentChange(
spClosesFull[spClosesFull.length-1],
spClosesFull[spClosesFull.length-4]
);

const liquidityVacuum =
calculateLiquidityVacuum(

gammaRegime,
vix,
vixTermRatio.ratio,
breadth20Data.breadth20,
sp3dMove

);

const distributionData =
calculateInstitutionalDistribution(
spCurrent,
spMA50,
spMA200,
trendAcceleration,
breadth200,
breadth50
);

const fragilityData =
calculateFragilityIndex(
breadth200,
breadth50,
distributionData.distributionScore,
rotationScore,
trendAcceleration
);

const marketStress =
calculateMarketStress(
vix,
move,
breadth200,
creditData.creditSignal,
fragilityData.fragility
)

/* ================= FINANCIAL CONDITIONS ================= */

const financialConditions =
calculateFinancialConditions(

vix,
move,
creditData.creditSignal,
breadth200,
dxy

)

/* ================= MARKET LIQUIDITY INDEX ================= */

const marketLiquidity =
calculateMarketLiquidityIndex(

vix,
move,
creditData.creditSignal,
breadth200,
dxy,
gammaRegime

)

/* ================= REGIME STABILITY ================= */

const regimeStability =
calculateRegimeStability(

structureScore,
breadth200,
breadth50,
distributionData.distributionScore,
marketStress.score,
fragilityData.fragility,
gammaRegime,
creditData.creditSignal,
vix

);

const basePhase = determinePhase(
structureScore,
rotationScore,
marketStress.score,
breadth200,
trendAcceleration,
breadthScore,
sp.above200
);

let finalPhase = basePhase;

if (shockData.systemicStress) {
finalPhase = "Override – Systemischer Stress";
} else if (shockData.geopoliticalOverride) {
finalPhase = "Override – Geopolitischer Stress";
}



const confidence =
calculateAdaptiveConfidence(
finalPhase,
structureScore,
rotationScore,
marketStress.score,
breadthScore,
distributionData.distributionScore,
shockData.shockScore
);

const crashRisk =
calculateCrashProbability(
structureScore,
breadthScore,
distributionData.distributionScore,
marketStress.score,
shockData.shockScore,
creditData.creditSignal,
gammaRegime,
internalMomentum.score,
concentration.score
);

/* ================= REGIME SIGNAL ================= */

const regimeSignal =
calculateRegimeSignal(

crashRisk.probability,
marketStress.score,
fragilityData.fragility,
correlationSpike.score,
creditData.creditSignal

)

/* ================= CRASH ATTRIBUTION ================= */

const crashAttribution =
calculateCrashAttribution(

breadth20Data.breadth20,
spMomentum.regime,
liquidityVacuum.score,
gammaRegime,
dealerPressure.score,
creditData.creditSignal === "risk_off" ? 2 : 0,
vix

);


/* ================= PUT DECISION ================= */

const putDecision =
calculatePutDecision(

finalPhase,
crashRisk.probability,
distributionData.distributionScore,
breadth200,
creditData.creditSignal,
vix,
vixTermStructure

);

const liquidityData =
calculateLiquidityRegime(
creditData.creditSignal,
breadth50,
adData.adValue
);

/* ================= KAPITULATIONS ALARM ================= */

const capitulationProbability = (
crashRisk.probability * 0.4 +
distributionData.distributionScore * 3 +
shockData.shockScore * 2
);

const capitulationAlarm = capitulationProbability > 60;


// ================= POSITION ENGINE =================

// Mapping deiner Phase → Risk Phase
let riskPhase = "LOW";

if(finalPhase.includes("Phase 7")) riskPhase = "CRASH BUILD";
else if(finalPhase.includes("Phase 6")) riskPhase = "ACCELERATION";
else if(finalPhase.includes("Phase 5")) riskPhase = "BREAKDOWN";
else if(finalPhase.includes("Phase 4")) riskPhase = "FRAGILE";

// POSITION SIZE
let positionSize = 0;

if(riskPhase === "CRASH BUILD") positionSize = 90;
else if(riskPhase === "ACCELERATION") positionSize = 75;
else if(riskPhase === "BREAKDOWN") positionSize = 60;
else if(riskPhase === "FRAGILE") positionSize = 30;
else positionSize = 10;

// Confidence (du hast "confidence", nicht decisionConfidence!)
if(confidence > 70) positionSize += 10;
if(confidence < 50) positionSize -= 10;

// Clamp
positionSize = Math.max(0, Math.min(100, positionSize));


// ================= EXIT ENGINE =================

let profitAction = "HOLD";

// Panic Signal = dein Kapitulationsalarm
const panicSignal = capitulationAlarm;

// Crash Level
const adjustedCrash = crashRisk.probability;

// Momentum Proxy (du hast keinen crashMomentum → wir nehmen internals)
const crashMomentum = internalMomentum.score;

// 1. PANIC → sofort sichern
if(panicSignal){
profitAction = "TAKE PROFIT (30-50%)";
}

// 2. Momentum Shift (SEHR WICHTIG)
else if(crashMomentum > -1){
profitAction = "REDUCE FAST";
}

// 3. Extrem hoher Crash → trimmen
else if(adjustedCrash > 75){
profitAction = "TRIM (20-30%)";
}

// 4. Perfekter Trend → laufen lassen
else if(riskPhase === "CRASH BUILD"){
profitAction = "LET RUN";
}



const snapshot = {
date: new Date().toISOString(),
phase: finalPhase,
structureScore,
rotationScore,
marketStressScore: marketStress.score,
confidence,
distributionScore: distributionData.distributionScore,
shockScore: shockData.shockScore,
geopoliticalOverride: shockData.geopoliticalOverride,
systemicStress: shockData.systemicStress
};

const newsSentiment = await fetchNewsSentiment();

saveRegimeSnapshot(snapshot);
const history = loadHistory();

const crashTrend =
history.length > 5
? history.slice(-5).map(h => h.shockScore)
: [];

const responseData = {
marketData,
spMA50,
spMA200,
spAbove50,
spAbove200,
structureScore,
rotationScore,
crashTrend,
vixTermStructure,
liquidityFlow,

spMomentumScore: spMomentum.score,
spMomentumRegime: spMomentum.regime,

internalMomentumScore: internalMomentum.score,
internalMomentumRegime: internalMomentum.regime,

vixTermRatio: vixTermRatio.ratio,
vixTermRatioRegime: vixTermRatio.regime,

volOfVolRatio: volOfVol.ratio,
volOfVolRegime: volOfVol.regime,
volOfVolTrend: volOfVolTrend,

optionsSkewRatio: optionsSkew.ratio,
optionsSkewRegime: optionsSkew.regime,

moveIndex: move,

financialConditionsScore: financialConditions.score,
financialConditionsRegime: financialConditions.regime,
dxyIndex: dxy,

crossAssetRiskScore: crossAssetRisk.score,
crossAssetRiskRegime: crossAssetRisk.regime,

correlationScore: correlationSpike.score,
correlationRegime: correlationSpike.regime,
correlationDispersion: correlationSpike.correlation,

regimeSignalScore: regimeSignal.score,
regimeSignal: regimeSignal.regime,

marketLiquidityScore: marketLiquidity.score,
marketLiquidityRegime: marketLiquidity.regime,

dxyMomentum20: dxy20,
tltMomentum20: tlt20,

putDecision: putDecision.decision,
putScore: putDecision.score,

positionSize,
profitAction,

creditSignal: creditData.creditSignal,
creditRatio: creditData.creditRatio,

liquidityVacuumScore: liquidityVacuum.score,
liquidityVacuumRegime: liquidityVacuum.regime,

structureRisk: crashAttribution.structureRisk,
liquidityRisk: crashAttribution.liquidityRisk,
optionsRisk: crashAttribution.optionsRisk,
macroRisk: crashAttribution.macroRisk,

regimeStabilityScore: regimeStability.score,
regimeStabilityRegime: regimeStability.regime,

phase6Acceleration,

cyclePhase: finalPhase,
confidence,
trendAcceleration,
breadth200,
breadth50,
breadthScore,
breadthDivergence,
shockScore: shockData.shockScore,
geopoliticalOverride: shockData.geopoliticalOverride,
systemicStress: shockData.systemicStress,
crashRadarTrigger: crashRadar.trigger,
crashRadarScore: crashRadar.score,
newsSentiment,

phase6AccelerationTrigger: phase6Acceleration.trigger,
phase6AccelerationScore: phase6Acceleration.score,
phase6AccelerationDetails: phase6Acceleration.details,

marketStressScore: marketStress.score,
marketStressRegime: marketStress.regime,

shockDetails: {
vix5d: shockData.vix5d,
sp1d: shockData.sp1d,
sp5d: shockData.sp5d
},

rotationDetails: {
rsSmall20,
rsSmall60,
rsGrowth20,
rsGrowth60,
rsShiftSmall,
rsShiftGrowth,
concentrationScore: concentration.score,
concentrationDivergence: concentration.divergence
},

distributionScore: distributionData.distributionScore,
institutionalDistribution: distributionData.institutionalDistribution,
distributionIntensity: distributionData.distributionIntensity,
newHighs: highLowData.newHighs,
newLows: highLowData.newLows,
highLowSignal: highLowData.highLowSignal,
advanceDecline: adData.adValue,
advances: adData.advances,
declines: adData.declines,
adSignal: adData.adSignal,

crashProbability: crashRisk.probability,
crashRiskRegime: crashRisk.regime,
breadth20: breadth20Data.breadth20,
breadth20Signal: breadth20Data.breadth20Signal,

liquidityScore: liquidityData.liquidityScore,
liquidityRegime: liquidityData.liquidityRegime,

fragilityIndex: fragilityData.fragility,
fragilityRegime: fragilityData.fragilityRegime,

gammaExposure: gamma.gammaBillions,
gammaRegime: gamma.regime,

dealerPressureScore: dealerPressure.score,
dealerPressureRegime: dealerPressure.regime,

capitulationProbability,
capitulationAlarm,
regimeHistory: history,
};

cachedResponse = responseData;
previousCrashProbability = responseData.crashProbability;

lastFetchTime = Date.now();

return NextResponse.json(responseData);

} catch (err) {
return NextResponse.json({ error: "API Fehler" });
}

}







