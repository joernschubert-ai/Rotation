"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {

const [isReady, setIsReady] = useState(false);
const router = useRouter();
const [data, setData] = useState<any>(null);
const [loading, setLoading] = useState(false);

const fetchData = async () => {
try {
setLoading(true);

const token = localStorage.getItem("token");

const res = await fetch("/api/market", {
headers: {
Authorization: token || ""
}
});

if (res.status === 401) {
window.location.href = "/login";
return;
}

const data = await res.json();

setData(data);
setIsReady(true);

} catch (err) {
console.error("FETCH ERROR", err);
} finally {
setLoading(false);
}
};

useEffect(() => {
const auth = localStorage.getItem("auth");

if (auth !== "true") {
router.push("/login");
} else {
fetchData(); // 🔥 HIER rein
}
}, []);

useEffect(() => {
console.log("DATA UPDATE", data);
}, [data]);


// === MASTER TREND ===
const [prevMasterScore, setPrevMasterScore] = useState<number | null>(null);
const [masterTrend, setMasterTrend] = useState<string>("FLAT");

// === CRASH MEMORY ===
const [adjustedCrash, setAdjustedCrash] = useState<number>(0);
const [crashHistory, setCrashHistory] = useState<number[]>([]);

const [distributionHistory, setDistributionHistory] = useState<number[]>([]);
const [smoothDistribution, setSmoothDistribution] = useState<number>(0);

useEffect(() => {

const current = data?.distributionScore ?? 0;

setDistributionHistory(prev => {
const newHist = [...prev, current].slice(-7);

const avg =
newHist.length > 0
? newHist.reduce((a,b)=>a+b,0) / newHist.length
: 0;

setSmoothDistribution(avg);

return newHist;
});

}, [data?.distributionScore]);

// === MASTER TREND EFFECT (FIXED POSITION) ===
useEffect(() => {

const stressScore = data?.marketStressScore ?? 0;
const breadth200 = (data?.breadth200 ?? 0);
const gamma = data?.gammaExposure ?? 0;

const computedScore = Math.round(
(stressScore*2) +
(data?.financialConditionsScore || 0) +
(data?.crossAssetRiskScore || 0) +
(data?.liquidityVacuumScore || 0) +
(100 - breadth200)/10 +
(gamma < 0 ? 10 : 0)
);

if(prevMasterScore === null){
setPrevMasterScore(computedScore);
return;
}

if(computedScore > prevMasterScore) setMasterTrend("RISING");
else if(computedScore < prevMasterScore) setMasterTrend("FALLING");
else setMasterTrend("FLAT");

setPrevMasterScore(computedScore);

}, [data]);


useEffect(() => {

const current = data?.crashProbability ?? 0;

setCrashHistory(prev => {
const newHistory = [...prev, current].slice(-5);

let smoothed;

if (prev.length === 0) {
smoothed = current;
} else {
smoothed = (adjustedCrash * 0.4) + (current * 0.6);
}

const breadth200_local = (data?.breadth200 ?? 0) * 100;
const gamma_local = data?.gammaExposure ?? 0;
const credit_local = data?.creditSignal ?? "neutral";

const structuralRisk =
(breadth200_local < 50 ? 1 : 0) +
(gamma_local < 0 ? 1 : 0) +
(credit_local === "risk_off" ? 1 : 0);

let dynamicFloor = 0;

if(structuralRisk === 3) dynamicFloor = 50;
else if(structuralRisk === 2) dynamicFloor = 40;
else if(structuralRisk === 1) dynamicFloor = 30;

let finalCrash = Math.max(smoothed, dynamicFloor);

setAdjustedCrash(Math.round(finalCrash));

return newHistory;
});

}, [data?.crashProbability]);

if (!isReady || loading) {
return <div className="p-10 text-white">Marktdaten werden geladen...</div>;
}

if (data.error) return <div className="p-10 text-red-500">API Fehler</div>;


/* ================= COLORS ================= */

const green = "#00ff88";
const yellow = "#ffd166";
const orange = "#ff8844";
const red = "#ff4d4f";
const blue = "#2f7df6";
const gray = "#888";

const earlyBg="#0a2e4d";
const structureBg="#4a3a00";
const crashBg="#4a0000";



/* ================= COLOR FUNCTIONS ================= */

const percentColor = (v:number) => v >= 0 ? green : red;

const relativeColor = (v:number) =>
v > 0.005 ? green :
v < -0.005 ? red :
gray;

const vixColor = (v:number) =>
v < 18 ? green :
v < 25 ? yellow :
v < 35 ? orange :
red;

const moveColor = (v:number)=>
v < 90 ? green :
v < 110 ? yellow :
v < 130 ? orange :
red;

const fciColor = (v:number)=>
v < 3 ? green :
v < 5 ? yellow :
v < 7 ? orange :
red;

const crossAssetColor = (v:number)=>
v<3?green:
v<5?yellow:
v<7?orange:
red;

const decisionColor = (d:string)=>{

if(!d) return gray;

const v = d.toUpperCase();

if(v.includes("BUILD")) return red;
if(v.includes("AGGRESSIVE")) return red;

if(v.includes("ADD")) return orange;

if(v.includes("HOLD")) return yellow;

if(v.includes("REDUCE")) return green;

return gray;

};

const confidenceColor = (v:number)=>
v > 70 ? green :
v > 50 ? yellow :
v > 35 ? orange :
red;


/* CORRELATION SPIKE */

const correlationColor = (s:number)=>
s===0?green:
s===1?yellow:
s===2?orange:
red;

/* REGIME SIGNAL */

const regimeColor = (r:string)=>
r==="risk_on"?green:
r==="fragile"?yellow:
r==="risk_off"?orange:
r==="crash_risk"?red:
gray;

const crashColor = (v:number)=>
v<45?green:
v<65?yellow:
v<80?orange:red;

const fragilityColor = (v:number)=>
v<4?green:
v<7?yellow:red;

const liquidityColor = (r:string)=>
r==="normal"?green:
r==="tightening"?yellow:
r==="stress"?orange:red;

const putDecisionColor = (d:string)=>{

if(!d) return gray;

const v = d.toUpperCase();

if(v.includes("BUILD")) return red;
if(v.includes("AGGRESSIVE")) return red;

if(v.includes("ADD")) return orange;

if(v.includes("HOLD")) return yellow;

if(v.includes("REDUCE")) return green;

return gray;

};

const callDecisionColor = (d:string)=>{

if(!d) return gray;

const v = d.toUpperCase();

if(v.includes("BUILD")) return green;
if(v.includes("AGGRESSIVE")) return green;

if(v.includes("ADD")) return "#86efac"; // hellgrün

if(v.includes("HOLD")) return yellow;

if(v.includes("REDUCE")) return orange;

return gray;

};

const crashRadarColor = (score:number)=>
score>=4?red:
score>=3?orange:
score>=2?yellow:green;

/* ===== NEW COLORS ===== */

const gammaColor = (g:number)=>
g>5?green:
g<0?red:yellow;

const adColor = (v:number)=>
v>0?green:
v<0?red:yellow;

const highLowColor = (v:number)=>
v>100?green:
v<-100?red:yellow;

const stressColor = (v:number)=>
v<3?green:
v<5?yellow:
v<7?orange:red;

const stabilityColor = (v:number)=>
v>80?green:
v>65?yellow:
v>45?orange:
red;

const liquidityIndexColor = (v:number)=>
v>80?green:
v>60?yellow:
v>40?orange:
red;

const vixCurveColor = (t:string)=>
t==="contango"?green:
t==="backwardation"?orange:red;

const spMomentumColor = (r:string)=>{

if(!r) return gray;

const v = r.toLowerCase();

if(v.includes("strong") && v.includes("bull")) return green;
if(v.includes("bull")) return yellow;
if(v.includes("strong") && v.includes("bear")) return red;
if(v.includes("bear")) return orange;

return blue;

};

const vixRatioColor = (v:number)=>{

if(!v) return gray;

return v<0.9?green:
v<1.05?yellow:
v<1.15?orange:
red;

};


/* ================= DATA ================= */

const md = data.marketData ?? {};


/* CORRELATION SPIKE */

const correlationScore = data.correlationScore ?? 0;
const correlationDispersion = data.correlationDispersion ?? 0;
const correlationRegime = data.correlationRegime ?? "normal";

/* REGIME SIGNAL */

const regimeSignal = data.regimeSignal ?? "risk_on";
const regimeSignalScore = data.regimeSignalScore ?? 0;

/* ================= LABELS ================= */

const indexLabels:any = {
"^DJI":"Dow Jones",
"^NDX":"NASDAQ",
"^GSPC":"S&P 500",
"^RUT":"Russell 2000"
};

const etfLabels:any = {
"qqq.us":"NASDAQ ETF (QQQ)",
"iwm.us":"Russell 2000 ETF (IWM)",
"spy.us":"S&P 500 ETF (SPY)",
"rsp.us":"Gleichgewichteter S&P ETF (RSP)",
"dia.us":"Dow Jones ETF (DIA)",
"ivw.us":"Growth ETF (IVW)",
"ive.us":"Value ETF (IVE)"
};

/* ================= BREADTH ================= */

const breadth200 = Math.round((data.breadth200 ?? 0)*100);
const breadth50 = Math.round((data.breadth50 ?? 0)*100);
const breadth20 = Math.round((data.breadth20 ?? 0)*100);

/* ================= CREDIT ================= */

const creditSignal = data.creditSignal ?? "neutral";
const creditRatio = data.creditRatio ?? 0;

const creditColor =
creditSignal === "risk_on" ? green :
creditSignal === "risk_off" ? red :
yellow;


/* ================= ROTATION ================= */

const rsSmall = data.rotationDetails?.rsSmall20 ?? 0;
const rsGrowth = data.rotationDetails?.rsGrowth20 ?? 0;

const rsEqual =
data.rotationDetails?.concentrationDivergence ?? 0;

let rotationLabel = "NEUTRAL";
let rotationColor = gray;

// === CLASSIC DIRECTION ===
if(rsSmall > 0.01){
rotationLabel = "NASDAQ → RUSSELL";
rotationColor = yellow;
}

else if(rsSmall < -0.01){
rotationLabel = "RUSSELL → NASDAQ";
rotationColor = green;
}

// === QUALITY OVERLAY (ÜBERSCHREIBT!) ===
if(rsSmall < -0.02 && rsEqual < -0.01){
rotationLabel = "DEFENSIVE CONCENTRATION";
rotationColor = orange;
}

else if(rsSmall > 0.02 && breadth50 > breadth200){
rotationLabel = "STRONG ROTATION TO RUSSELL";
rotationColor = green;
}

else if(
rsSmall < 0 &&
breadth50 < breadth200 &&
creditSignal === "risk_off"
){
rotationLabel = "ROTATION FAILURE";
rotationColor = red;
}


/* ================= VIX CURVE ================= */

const vixCurve = data.vixTermStructure ?? "contango";

/* ================= LIQUIDITY FLOW ================= */

const liquidityFlowColor =
data.liquidityFlow === "risk_off"
? red
: data.liquidityFlow === "risk_on"
? green
: gray;

const liquidityScore = data.liquidityScore ?? 0;

const liquidityScoreColor =
liquidityScore > 4 ? red :
liquidityScore > 2 ? yellow :
green;

const marketLiquidityScore = data.marketLiquidityScore ?? 0;
const marketLiquidityRegime = data.marketLiquidityRegime ?? "normal";

/* ================= MARKET STRESS ================= */

const stressScore = data.marketStressScore ?? 0;
const stressRegime = data.marketStressRegime ?? "normal";

/* ================= MASTER ENGINE ================= */

const masterScore =
Math.round(
(stressScore*2) +
(data.financialConditionsScore || 0) +
(data.crossAssetRiskScore || 0) +
(data.liquidityVacuumScore || 0) +
(100 - breadth200)/10 +
(data.gammaExposure < 0 ? 10 : 0)
);


// === CRASH MOMENTUM ===
const crashMomentum = data?.crashMomentum ?? 0;



// === FAKE CRASH FILTER ===
const fakeCrash =
(
correlationScore === 0 && // viel strenger!
vixCurve === "contango" &&
creditSignal === "risk_on" && // nur bei echtem Risk-On
adjustedCrash < 45 // nur bei niedriger Gefahr
);

const finalDecisionScore = Math.round(
(masterScore * 0.4) +
(adjustedCrash * 0.3) +
((data.marketStressScore ?? 0) * 5) +
((data.crossAssetRiskScore ?? 0) * 2)
);

// ================= DANGER ZONE ENGINE =================

// === INPUTS ===
const nasdaqPrice = md["^NDX"]?.current ?? 0;
const vix = md["^VIX"]?.current ?? 0;

const breadth200_raw = data?.breadth200 ?? 0;
const gamma = data?.gammaExposure ?? 0;
const credit = data?.creditSignal ?? "neutral";

// === LEVEL RISK (NASDAQ) ===
let levelRisk = 0;

if(nasdaqPrice < 24200) levelRisk = 20;
else if(nasdaqPrice < 24600) levelRisk = 50;
else if(nasdaqPrice < 25000) levelRisk = 75;
else levelRisk = 90;

// === VIX RISK (wichtig: invertiert!) ===
let vixRisk = 0;

if(vix > 25) vixRisk = 20;
else if(vix > 22) vixRisk = 40;
else if(vix > 20) vixRisk = 60;
else vixRisk = 85;

// === STRUCTURAL RISK ===
let structuralRisk = 0;

// Gamma (negativ = gut für Puts)
if(gamma >= 0) structuralRisk += 30;

// Credit
if(credit === "neutral") structuralRisk += 15;
if(credit === "risk_on") structuralRisk += 30;

// Breadth
if(breadth200_raw >= 0.5) structuralRisk += 20;

// === FINAL SCORE ===
const dangerScore = Math.round(
(levelRisk * 0.4) +
(vixRisk * 0.3) +
(structuralRisk * 0.3)
);

// === AMPEL ===
let dangerColor = "#00ff88";
let dangerLabel = "LOW RISK";

if(dangerScore > 75){
dangerColor = "#ff4d4f";
dangerLabel = "HIGH RISK";
}
else if(dangerScore > 55){
dangerColor = "#ff8844";
dangerLabel = "ELEVATED";
}
else if(dangerScore > 35){
dangerColor = "#ffd166";
dangerLabel = "MODERATE";
}


// ================= TIMING ENGINE =================

// ================= AUTO BOUNCE DETECTOR =================

// 1. Micro Bounce (reine kurzfristige Bewegung)
const microBounce =
breadth20 > breadth50 &&
data.spMomentumScore > 0;

// 2. Struktur prüfen (kein echter Bull Move!)
const badStructure =
breadth200 < 60 &&
data.gammaExposure < 0 &&
creditSignal === "risk_off";

// 3. Bounce Qualität
const bounceStrength =
(data.spMomentumScore ?? 0) +
(breadth20 - breadth50);

// 4. FAKE / WEAK BOUNCE (dein Sweet Spot)
const weakBounce =
microBounce &&
badStructure &&
bounceStrength < 25;

// 5. STRONG BOUNCE (Gefahr → kein sofortiger PUT Entry)
const strongBounce =
microBounce &&
bounceStrength >= 25 &&
breadth200 > 55;


// Panic Spike
const panicSignal =
(data.capitulationProbability ?? 0) > 70 &&
stressScore > 6;

// Trend Continuation
const trendBreakdown =
(data.spMomentumRegime ?? "").includes("bear") &&
breadth50 < breadth200;

// ================= EXECUTION ENGINE =================

// 1. RISK PHASE (basierend auf Crash + Struktur)
// === CRASH VALUE (FIX – STATE FALLBACK) ===
const crashBase = data?.crashProbability ?? 0;
const crashValue = adjustedCrash > 0 ? adjustedCrash : crashBase;

// === RISK PHASE ===
let riskPhase = "STABLE";

if(crashValue < 30) riskPhase = "STABLE";
else if(crashValue < 50) riskPhase = "FRAGILE";
else if(crashValue < 70) riskPhase = "BREAKDOWN";
else riskPhase = "CRASH BUILD";

console.log("RISK PHASE DEBUG", {
crashValue,
adjustedCrash,
crashBase,
riskPhase
});


// 2. TRIGGER (Momentum + Struktur kombiniert)
let trigger = "NONE";

if(adjustedCrash >= 40) trigger = "WATCH";
if(adjustedCrash >= 55) trigger = "PREPARE";
if(adjustedCrash >= 70) trigger = "ATTACK";

// Momentum Override
if(crashMomentum <= -4 && adjustedCrash > 50){
trigger = "ATTACK";
}


// 3. FINAL ACTION (TIMING + STRUKTUR)

let finalAction = "NO POSITION";

// === BASE REGIME ===
if(riskPhase === "STABLE"){
finalAction = "CALL BIAS / REDUCE PUTS";
}
else if(riskPhase === "FRAGILE"){
finalAction = "HOLD / WAIT";
}

if(trigger === "PREPARE" && riskPhase === "FRAGILE"){
finalAction = "PREPARE PUTS";
}
else if(riskPhase === "BREAKDOWN"){
finalAction = "HOLD PUTS";
}
else if(riskPhase === "CRASH BUILD"){
finalAction = "AGGRESSIVE PUTS";
}

// ================= TIMING LAYER =================

// 1. Weak Bounce = BEST ENTRY
if(weakBounce && riskPhase !== "STABLE"){
finalAction = "ADD PUTS (WEAK BOUNCE)";
}

// 2. Strong Bounce = warten (wichtig!)
if(strongBounce && riskPhase !== "STABLE"){
finalAction = "WAIT → POSSIBLE LOWER HIGH";
}

// 2. Panic = nicht jagen
if(panicSignal){
finalAction = "HOLD (PANIC)";
}

// 3. Trend bestätigt → laufen lassen
if(trendBreakdown && adjustedCrash > 50){
finalAction = "HOLD / ADD LIGHT";
}

// Fake Crash Filter bleibt

// === SCORE DECODER ===
const scoreRegime =
masterScore < 20 ? "LIQUID BULL" :
masterScore < 35 ? "NEUTRAL" :
masterScore < 50 ? "FRAGILE" :
"CRASH BUILD";

const scoreAction =
masterScore < 20 ? "CALLS" :
masterScore < 35 ? "WAIT" :
masterScore < 50 ? "HEDGE" :
"ADD PUTS";

const masterColor =
masterScore < 20 ? green :
masterScore < 40 ? yellow :
masterScore < 60 ? orange :
red;

/* EARLY WARNING */

let earlyWarning = "STABLE";
let earlyColor = green;

if(rotationLabel === "ROTATION FAILURE"){
earlyWarning = "SYSTEMIC RISK BUILD";
earlyColor = red;
}

else if(rotationLabel === "DEFENSIVE CONCENTRATION"){
earlyWarning = "HIDDEN DISTRIBUTION";
earlyColor = orange;
}

else if(crashMomentum <= -3){
earlyWarning = "CRASH PRESSURE RISING";
earlyColor = red;
}


if(
rsSmall < -0.03 &&
breadth50 < breadth200 &&
creditSignal === "risk_off"
){
earlyWarning = "ROTATION BREAKDOWN";
earlyColor = orange;
}

if(
data.gammaExposure < 0 &&
data.liquidityVacuumScore > 5 &&
stressScore > 5
){
earlyWarning = "CRASH BUILDUP";
earlyColor = red;
}


// ================= PRIORITY ENGINE =================

let marketPriority = "NORMAL";

// 1. PANIC hat höchste Priorität
if(panicSignal){
marketPriority = "PANIC";
}

// 2. Crash Momentum
else if(crashMomentum <= -4 && adjustedCrash > 60){
marketPriority = "ACCELERATION";
}

// 3. Struktureller Breakdown
else if(
breadth200 < 50 &&
data.gammaExposure < 0 &&
creditSignal === "risk_off"
){
marketPriority = "STRUCTURAL_BREAK";
}

// 4. Frühphase
else if(adjustedCrash > 40){
marketPriority = "EARLY_WARNING";
}


/* TRADE ENGINE */


console.log("PUT ENGINE INPUT:", {
adjustedCrash,
riskPhase,
trendBreakdown,
gamma: data.gammaExposure,
weakBounce,
panicSignal
});

// ================= PUT ENGINE (NASDAQ) =================

// ================= PUT ENGINE V2 =================

let putSignal = "NO TRADE";

// PRIORITY OVERRIDE
if(marketPriority === "PANIC"){
putSignal = "HOLD (PANIC)";
}

else if(marketPriority === "ACCELERATION"){
putSignal = "ADD AGGRESSIVE";
}

else if(marketPriority === "STRUCTURAL_BREAK"){
putSignal = "BUILD CORE PUTS";
}

// NORMAL LOGIK
else {

if(riskPhase === "CRASH BUILD"){
putSignal = "ADD PUTS";
}

else if(riskPhase === "BREAKDOWN"){
putSignal = "HOLD PUTS";
}

else if(weakBounce){
putSignal = "ADD ON WEAK BOUNCE";
}

else if(strongBounce){
putSignal = "WAIT (BOUNCE TOO STRONG)";
}

else if(riskPhase === "STABLE"){
putSignal = "WAIT";
}

}


// ================= CALL ENGINE V2 (FULL LOGIC) =================

let callSignal = "NO TRADE";
let callSize = 0; // % von Base Position
let callScaling = "NONE";
let callExit = callSize > 0 ? "HOLD" : "NO POSITION";

// ================= 1. REGIME FILTER =================

// Calls nur wenn echtes Risk-On Fenster
const callAllowed =
creditSignal !== "risk_off" &&
adjustedCrash < 55 &&
data.gammaExposure > 0;

// Hard Block
if(!callAllowed){
callSignal = "NO TRADE";
callSize = 0;
}
else{

// ================= 2. STRENGTH SCORE =================

let callStrength = 0;

if(rsSmall > 0.01) callStrength += 1;
if(rsSmall > 0.02) callStrength += 1;

if(breadth50 > breadth200) callStrength += 1;
if(breadth200 > 60) callStrength += 1;

if(data.gammaExposure > 5) callStrength += 1;
if(creditSignal === "risk_on") callStrength += 1;

// ================= 3. BASE SIGNAL =================

if(callStrength >= 5){
callSignal = "AGGRESSIVE BUILD";
}
else if(callStrength >= 3){
callSignal = "ADD CALLS";
}
else{
callSignal = "SMALL POSITION";
}

// ================= 4. SCALING ENGINE =================

// EARLY ROTATION (klein starten)
if(rsSmall > 0.01 && rsSmall <= 0.02){
callSize = 20;
callScaling = "STARTER";
}

// CONFIRMED ROTATION
if(rsSmall > 0.02 && breadth50 > breadth200){
callSize = 40;
callScaling = "BUILD";
}

// STRONG MOMENTUM
if(rsSmall > 0.03 && breadth200 > 60 && data.gammaExposure > 5){
callSize = 70;
callScaling = "PRESS";
}

// OVEREXTENSION → NICHT MEHR ADDEN
if(rsSmall > 0.05){
callScaling = "OVEREXTENDED";
}

// ================= 5. EXIT ENGINE =================

// Rotation kippt → sofort reagieren
if(rsSmall < 0){
callExit = "EXIT FULL";
callSize = 0;
}

// Momentum verliert Kraft
else if(rsSmall < 0.01){
callExit = "TRIM 50%";
callSize *= 0.5;
}

// Breadth kippt → Risiko rausnehmen
else if(breadth50 < breadth200){
callExit = "REDUCE 30%";
callSize *= 0.7;
}

// Crash steigt → raus
if(adjustedCrash > 50){
callExit = "EXIT FAST";
callSize = 0;
}

}

// ================= CALL RE-ENTRY ENGINE =================

let callReEntry = "NONE";

// === 1. EARLY SIGNAL ===
// Micro-Shift in Rotation + Momentum
const earlyRotation =
rsSmall > 0 &&
breadth20 > breadth50 &&
data.spMomentumScore > 0;

// Panic lässt nach
const panicRelease =
(data.capitulationProbability ?? 0) < 60 &&
crashMomentum > -2;

// Liquidity stabilisiert sich
const liquidityRecovery =
data.liquidityVacuumScore < 5;

if(earlyRotation && panicRelease && liquidityRecovery){
callReEntry = "WATCH";
}


// === 2. CONFIRMATION ===
// echte strukturelle Verbesserung
const rotationConfirmed =
rsSmall > 0.015 &&
breadth50 > breadth200 &&
creditSignal !== "risk_off";

const volSupport =
data.vixTermStructure === "contango";

if(rotationConfirmed && volSupport){
callReEntry = "ENTRY";
}


// === 3. FULL RE-ENTRY ===
// echte Risk-On Phase
const strongBreadth =
breadth200 > 60;

const positiveGamma =
data.gammaExposure > 0;

const lowCrash =
adjustedCrash < 40;

if(rotationConfirmed && strongBreadth && positiveGamma && lowCrash){
callReEntry = "FULL BUILD";
}

// ================= CALL RE-ENTRY INTEGRATION =================

// Re-Entry überschreibt nur wenn kein aktiver Call läuft
if(callSignal === "NO TRADE"){

if(callReEntry === "WATCH"){
callSignal = "WATCH FOR CALL ENTRY";
}

if(callReEntry === "ENTRY"){
callSignal = "START CALL POSITION";
callSize = Math.max(callSize, 20);
}

if(callReEntry === "FULL BUILD"){
callSignal = "BUILD CALL POSITION";
callSize = Math.max(callSize, 50);
}

}

// ================= MASTER DECISION PANEL =================

// NASDAQ DECISION (vereinfacht + klar)
let nasdaqDecision = finalAction;

if(putSignal.includes("AGGRESSIVE")) nasdaqDecision = "BUILD HEAVY PUTS";
else if(putSignal.includes("ADD")) nasdaqDecision = "ADD PUTS";
else if(putSignal.includes("HOLD")) nasdaqDecision = "HOLD PUTS";
else if(putSignal.includes("REDUCE")) nasdaqDecision = "REDUCE PUTS";

// RUSSELL DECISION
let russellDecision = callSignal;
// else if(callSignal.includes("EARLY")) russellDecision = "EARLY ENTRY";
// else if(callSignal.includes("REDUCE")) russellDecision = "REDUCE CALLS";

// CONFIDENCE SCORE (NEU – sehr wichtig)
const decisionConfidence = Math.round(
(100 - adjustedCrash) * 0.4 + // weniger Crash = mehr Sicherheit
(data.confidence ?? 50) * 0.3 + // dein Modell
(100 - data.regimeStabilityScore) * 0.3 // Instabilität = Opportunity
);

let dynamicExit = "HOLD";

// 1. PANIC EXIT
if(panicSignal){
dynamicExit = "TAKE PROFIT (50-70%)";
}

// 2. CRASH BESCHLEUNIGT
else if(crashMomentum <= -5 && adjustedCrash > 70){
dynamicExit = "TRIM FAST (30-50%)";
}

// 3. NORMALER CRASH
else if(adjustedCrash > 60){
dynamicExit = "TRIM (20-30%)";
}

// 4. MOMENTUM DREHT
else if(crashMomentum < 0){
dynamicExit = "REDUCE / EXIT";
}


// ================= DYNAMIC BASE SIZE =================

let dynamicBase = data.positionSize ?? 0;

// Danger reduziert die strategische Zielgröße!
if(dangerScore > 75){
dynamicBase *= 0.7;
}
else if(dangerScore > 55){
dynamicBase *= 0.85;
}
else if(dangerScore < 35){
dynamicBase *= 1.1;
}

// Deckel (wichtig!)
dynamicBase = Math.max(10, Math.min(100, dynamicBase));

const crashFactor =
adjustedCrash > 70 ? 1.2 :
adjustedCrash > 55 ? 1.1 :
adjustedCrash > 45 ? 1.0 :
0.9;

const momentumFactor =
crashMomentum <= -4 ? 1.1 :
crashMomentum >= -1 ? 0.85 :
1;

const panicFactor = panicSignal ? 0.75 : 1;

const confidenceFactor = decisionConfidence / 100;

// ================= DANGER POSITION FACTOR =================

let dangerFactor = 1.0;

if(dangerScore > 75){
dangerFactor = 0.6; // stark reduzieren
}
else if(dangerScore > 55){
dangerFactor = 0.8; // moderat reduzieren
}
else if(dangerScore > 35){
dangerFactor = 1.0; // neutral
}
else{
dangerFactor = 1.15; // aggressiver (Top-Zone)
}

// 🔥 FINAL (WEICH!)
const effectivePosition = Math.round(
dynamicBase *
(0.5 + confidenceFactor * 0.5) *
crashFactor *
momentumFactor *
panicFactor
);

// ================= HARD CAP =================

// Maximal leicht über Base erlaubt (5%)
const maxPosition = dynamicBase * 1.05;

// Final begrenzen
const finalPositionCapped = Math.min(effectivePosition, maxPosition);

// ================= ONE LOOK ENGINE =================

// 1. MAIN ACTION
let oneLookAction = nasdaqDecision;

if(nasdaqDecision.includes("BUILD")) oneLookAction = "BUILD PUTS";
else if(nasdaqDecision.includes("ADD")) oneLookAction = "ADD PUTS";
else if(nasdaqDecision.includes("HOLD")) oneLookAction = "HOLD PUTS";
else if(nasdaqDecision.includes("REDUCE")) oneLookAction = "REDUCE";

// 2. RISK LABEL
let oneLookRisk = riskPhase;

// 3. TIMING
let oneLookTiming = "WAIT";

if(weakBounce) oneLookTiming = "WEAK BOUNCE (ENTRY)";
else if(strongBounce) oneLookTiming = "STRONG BOUNCE (WAIT)";
else if(panicSignal) oneLookTiming = "PANIC";
else if(trendBreakdown) oneLookTiming = "TREND DOWN";

// 4. EXECUTION
let oneLookExecution = "";

if(oneLookAction.startsWith("BUILD")){

if(weakBounce){
oneLookExecution = "ADD ON BOUNCE";
}
else if(trendBreakdown && crashMomentum <= -4){
oneLookExecution = "ADD SMALL (TREND)";
}
else{
oneLookExecution = "WAIT FOR BOUNCE";
}

}
else if(oneLookAction.startsWith("ADD")){
oneLookExecution = "ADD ON BOUNCE";
}
else if(oneLookAction.startsWith("HOLD")){
oneLookExecution = "HOLD & MONITOR";
}
else if(oneLookAction.startsWith("REDUCE")){
oneLookExecution = "REDUCE / SCALE OUT";
}
else{
oneLookExecution = "WAIT";
}

console.log("EXECUTION:", oneLookExecution);

const indices = {
nasdaq: {
price: md["^NDX"]?.current ?? null,
change: md["^NDX"]?.change ?? null
},
sp500: {
price: md["^GSPC"]?.current ?? null,
change: md["^GSPC"]?.change ?? null
},
russell: {
price: md["^RUT"]?.current ?? null,
change: md["^RUT"]?.change ?? null
},
dow: {
price: md["^DJI"]?.current ?? null,
change: md["^DJI"]?.change ?? null
},

// 🔥 NEU – EXTREM WICHTIG
divergence: {
nasdaq_vs_russell:
(md["^NDX"]?.change ?? 0) - (md["^RUT"]?.change ?? 0),
sp_vs_equal:
(data.rotationDetails?.concentrationDivergence ?? 0)
}
};


// ================= SNAPSHOT =================

const snapshot = {
timestamp: new Date().toISOString(),

scores: {
masterScore,
stressScore,
breadth200,
breadth50,
breadth20,
distribution: Math.round(smoothDistribution),
crashProbability: adjustedCrash,
correlationScore,
concentrationScore: data.rotationDetails?.concentrationScore ?? 0,
dangerScore
},

market: {
vix: md["^VIX"]?.current ?? null,
vixTermStructure: data.vixTermStructure,
gamma: data.gammaExposure,
creditSignal,
liquidity: data.liquidityVacuumScore
},

internals: {
advanceDecline: data.advanceDecline,
newHighs: data.newHighs,
newLows: data.newLows
},

engines: {
riskPhase,
marketPriority,
crashMomentum,
panicSignal,
weakBounce,
strongBounce,
trendBreakdown
},

decisions: {
nasdaq: putSignal,
russell: callSignal,
oneLook: oneLookAction,
execution: oneLookExecution,
exit: dynamicExit
},

positioning: {
baseSize: Math.round(dynamicBase),
adjustedSize: finalPositionCapped,
confidence: decisionConfidence
},
indices
};

function copySnapshot(){
navigator.clipboard.writeText(
JSON.stringify(snapshot, null, 2)
);
console.log("SNAPSHOT COPIED", snapshot);
}

function downloadSnapshot(){

const blob = new Blob(
[JSON.stringify(snapshot, null, 2)],
{ type: "application/json" }
);

const url = URL.createObjectURL(blob);

const a = document.createElement("a");
a.href = url;
a.download = `snapshot-${Date.now()}.json`;
a.click();
}



/* CONCENTRATION */

let concentrationState = "HEALTHY";
let concentrationColorFinal = green;

if(rsEqual < -0.02){
concentrationState = "NARROW MARKET";
concentrationColorFinal = orange;
}

if(data.rotationDetails?.concentrationScore >=2){
concentrationState = "EXTREME CONCENTRATION";
concentrationColorFinal = red;
}


/* ================= HEATMAP LOGIK ================= */

const volRisk =
(md["^VIX"]?.current ??0) <18
? green
: (md["^VIX"]?.current ??0) <25
? yellow
: red;

const creditRisk =
creditSignal==="risk_on"
? green
: creditSignal==="neutral"
? yellow
: red;

const breadthRisk =
breadth200>60
? green
: breadth200>40
? yellow
: red;

const gammaRisk =
data.gammaExposure>5
? green
: data.gammaExposure>0
? yellow
: red;

const dealerRisk =
data.dealerPressureScore >=4
? red
: data.dealerPressureScore >=2
? orange
: green;

const liquidityRisk =
data.liquidityVacuumScore >=5
? red
: data.liquidityVacuumScore >=3
? orange
: liquidityScore>2
? yellow
: green;

const fciRisk =
data.financialConditionsScore >=7
? red
: data.financialConditionsScore >=5
? orange
: data.financialConditionsScore >=3
? yellow
: green;

const crossAssetDot =
data.crossAssetRiskScore >=7
? red
: data.crossAssetRiskScore >=5
? orange
: data.crossAssetRiskScore >=3
? yellow
: green;

const liquidityIndexDot =
marketLiquidityScore >80
? green
: marketLiquidityScore >60
? yellow
: marketLiquidityScore >40
? orange
: red;

/* ================= TIMELINE ================= */

const timelineColor = (phase:string) => {

const num = phase?.match(/\d+/)?.[0];

if(num==="1") return green;
if(num==="2") return blue;
if(num==="3") return yellow;
if(num==="4") return orange;
return red;

};

const executionColor = (e:string)=>{

if(!e) return gray;

const v = e.toUpperCase();

// AGGRESSIVE ACTION
if(v.includes("ADD") || v.includes("BUILD")) return red;

// HOLD ist NEUTRAL / DEFENSIV → NICHT grünlich!
if(v.includes("HOLD")) return orange;

// WAIT ist passiv
if(v.includes("WAIT")) return gray;

return gray;

};


const currentPhase =
data.cyclePhase?.match(/\d+/)?.[0] ?? "1";

/* ================= PANEL ================= */

const Panel = ({title,children,bg,defaultOpen=true}:any)=>{
const [open,setOpen] = useState(defaultOpen);

return(

<div className="border border-zinc-800 p-3 h-full flex flex-col" style={{background:bg}}>

<div
className="text-xs text-zinc-400 mb-3 tracking-widest uppercase cursor-pointer flex justify-between"
onClick={()=>setOpen(!open)}
>
<span>{title}</span>
<span>{open ? "−" : "+"}</span>
</div>

{open && children}

</div>

);
};

/* ================= GAUGE ================= */

const Gauge = ({value}:{value:number}) => {

const radius = 35;
const circumference = Math.PI * radius;
const safeValue = Math.max(0, Math.min(100, value));
const offset = circumference - (safeValue/100) * circumference;

let color = green;

if(value>30) color = yellow;
if(value>60) color = orange;
if(value>80) color = red;

return(

<svg width="120" height="70">

<path
d="M10 60 A35 35 0 0 1 110 60"
stroke="#222"
strokeWidth="10"
fill="none"
/>

<path
d="M10 60 A35 35 0 0 1 110 60"
stroke={color}
strokeWidth="10"
fill="none"
strokeDasharray={circumference}
strokeDashoffset={offset}
/>

<text
x="60"
y="55"
textAnchor="middle"
fontSize="16"
fill="white"
>
{value}%
</text>

</svg>

)

};

/* ================= RISK HEATMAP ================= */

const RiskDot = ({color,label}:{color:string,label:string}) =>(

<div className="flex flex-col items-center text-xs">

<div
className="w-4 h-4 rounded-full mb-1"
style={{background:color}}
/>

<span className="text-zinc-400">{label}</span>

</div>

);

/* ================= UI ================= */

return (

<div className="min-h-screen bg-black text-white font-mono p-6">

<div className="flex justify-between items-center mb-6">

<div className="text-xl tracking-widest text-zinc-300">
INSTITUTIONELLES MAKRO DASHBOARD
</div>

<div className="flex gap-2">

<button
onClick={copySnapshot}
className="text-xs px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
>
📋 Copy
</button>

<button
onClick={downloadSnapshot}
className="text-xs px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
>
⬇ Download
</button>
<button
onClick={fetchData}
className="text-xs px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
>
🔄 Reload
</button>
</div>
</div>

{/* ================= ONE LOOK PANEL ================= */}

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4 mb-6">

{/* ACTION */}
<Panel title="NASDAQ ACTION (PUTS)" bg="#0b1a2a">

<div className="text-xs text-zinc-400 mb-1">
PUT ENGINE
</div>

<div
className="text-lg font-bold"
style={{color:putDecisionColor(putSignal)}}
>
{putSignal}
</div>

<div className="text-xs text-zinc-400 mt-2">
Crash: {adjustedCrash}% | Gamma: {data.gammaExposure}
</div>

</Panel>

<Panel title="RUSSELL ACTION (CALLS)" bg="#0b1a2a">

<div className="text-xs text-zinc-400 mb-1">
CALL ENGINE
</div>

<div
className="text-lg font-bold"
style={{color:callDecisionColor(callSignal)}}
>
{callSignal}
</div>

<div className="text-xs text-zinc-400 mt-2">
Rotation: {(rsSmall*100).toFixed(2)}%
</div>
<div className="text-xs text-zinc-400 mt-2">
Size: {callSize}% | Mode: {callScaling}
</div>

<div className="text-xs mt-1">
Exit: {callExit}
</div>
<div className="text-xs text-zinc-400 mt-2">
Re-Entry: <span style={{
color:
callReEntry === "WATCH" ? "#ffd166" :
callReEntry === "ENTRY" ? "#86efac" :
callReEntry === "FULL BUILD" ? "#00ff88" :
"#888"
}}>
{callReEntry}
</span>
</div>
</Panel>

{/* POSITION */}
<Panel title="POSITION" bg="#0b1a2a">
<div
className="text-2xl font-bold"
style={{
color:
effectivePosition > 70 ? red :
effectivePosition > 40 ? orange :
effectivePosition > 20 ? yellow :
green
}}
>
{finalPositionCapped}%
</div>
<div className="text-xs text-zinc-400 mt-2">
Size (adjusted)
</div>
<div className="text-xs text-zinc-400 mt-2">
Danger Factor: {dangerFactor.toFixed(2)}
</div>
</Panel>

{/* RISK */}
<Panel title="RISK" bg="#0b1a2a">
<div
className="text-lg font-bold"
style={{
color:
riskPhase === "STABLE" ? green :
riskPhase === "FRAGILE" ? yellow :
riskPhase === "BREAKDOWN" ? orange :
red
}}
>
{riskPhase}
</div>
<div className="text-xs text-zinc-400 mt-2">
Crash {adjustedCrash}%
</div>
<div className="mt-3 border-t border-zinc-800 pt-3">

<div className="text-xs text-zinc-400 mb-1">
DANGER ZONE
</div>

<div
className="text-lg font-bold"
style={{color: dangerColor}}
>
{dangerLabel}
</div>

<div className="text-xs text-zinc-400 mt-1">
Score: {dangerScore}/100
</div>

</div>
</Panel>

{/* TIMING */}
<Panel title="TIMING" bg="#0b1a2a">
<div
className="text-lg font-bold"
style={{
color:
oneLookTiming === "PANIC" ? red :
oneLookTiming.includes("BOUNCE") ? orange :
yellow
}}
>
{oneLookTiming}
</div>
<div className="text-xs text-zinc-400 mt-2">
Entry Context
</div>
</Panel>

{/* EXECUTION */}
<Panel title="EXECUTION" bg="#0b1a2a">
<div
className="text-sm font-bold"
style={{color:executionColor(oneLookExecution)}}
>
{oneLookExecution}
</div>

<div className="text-xs text-zinc-400 mt-1">
Execution Plan
</div>


<div
className="text-xs mt-2"
style={{
color:
dynamicExit.includes("TAKE") ? red :
dynamicExit.includes("TRIM") ? orange :
dynamicExit.includes("REDUCE") ? yellow :
dynamicExit.includes("HOLD") ? gray :
gray
}}
>
{dynamicExit}
</div>

</Panel>

<Panel title="CONFIDENCE" bg="#0b1a2a">
<div
className="text-lg font-bold"
style={{color:confidenceColor(decisionConfidence)}}
>
{decisionConfidence}%
</div>
<div className="text-xs text-zinc-400 mt-2">
Execution Quality
</div>
</Panel>


</div>



<Panel title="POSITIONING" bg="#0b1a2a">

<div className="text-xs text-zinc-400 mt-2">
FINAL SIZE (EXECUTION)
</div>

<div
className="text-2xl font-bold"
style={{
color:
data.positionSize > 70 ? red :
data.positionSize > 40 ? orange :
data.positionSize > 20 ? yellow :
green
}}
>
{data.positionSize}%
</div>

<div className="text-xs text-zinc-400 mt-1">
Base (dynamic): {Math.round(dynamicBase)}% → Final: {finalPositionCapped}%
</div>

<div className="text-xs text-zinc-400 mt-2">
Risk Allocation
</div>

<div className="mt-3 text-xs text-zinc-400">
EXIT STRATEGY
</div>



<div
className="text-sm font-bold"
style={{
color:
data.profitAction?.includes("TAKE") ? red :
data.profitAction?.includes("TRIM") ? orange :
data.profitAction?.includes("REDUCE") ? orange :
green
}}
>
{dynamicExit}
</div>

</Panel>



{/* ================= MASTER BAR ================= */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

<Panel title="MASTER SCORE" bg="#111">

<div className="text-3xl font-bold" style={{color:masterColor}}>
{masterScore}
</div>

<div className="text-xs text-zinc-400">
Crash Pressure
</div>

<div className="text-xs mt-2" style={{
color:
masterTrend === "RISING" ? red :
masterTrend === "FALLING" ? green :
yellow
}}>
Trend: {masterTrend}
</div>

<div className="text-xs mt-2">
{scoreRegime}
</div>

<div className="text-xs mt-2">
Risk Phase: <span style={{color:
riskPhase === "STABLE" ? green :
riskPhase === "FRAGILE" ? yellow :
riskPhase === "BREAKDOWN" ? orange :
red
}}>
{riskPhase}
</span>
</div>

<div className="text-xs mt-1">
Trigger: <span style={{color:
trigger === "NONE" ? green :
trigger === "WATCH" ? yellow :
trigger === "PREPARE" ? orange :
red
}}>
{trigger}
</span>
</div>

<div className="text-sm font-bold mt-2" style={{
color:
finalAction.includes("AGGRESSIVE") ? red :
finalAction.includes("ADD") ? orange :
finalAction.includes("HOLD") ? orange :
finalAction.includes("WAIT") ? yellow :
green
}}>
{finalAction}
</div>



</Panel>

<Panel title="EARLY WARNING" bg="#111">

<div className="text-sm font-bold" style={{color:earlyColor}}>
{earlyWarning}
</div>

<div className="text-xs text-zinc-400 mt-2">
Lead Signal Engine
</div>

</Panel>

<Panel title="TRADE ENGINE" bg="#111">

<div className="grid grid-cols-2 gap-4">

{/* NASDAQ */}
<div>
<div className="text-xs text-zinc-400 mb-1">
NASDAQ (PUTS)
</div>

<div style={{color:putDecisionColor(putSignal)}}>
{putSignal}
</div>
</div>

{/* RUSSELL */}
<div>
<div className="text-xs text-zinc-400 mb-1">
RUSSELL (CALLS)
</div>

<div style={{color:callDecisionColor(callSignal)}}>
{callSignal}
</div>
</div>

</div>

</Panel>

<Panel title="CONCENTRATION" bg="#111">

<div style={{color:concentrationColorFinal}}>
{concentrationState}
</div>

<div className="text-xs text-zinc-400 mt-2">
Mag7 Dominance
</div>

</Panel>

</div>

<Panel title="MARKET DRIVERS" bg="#111">

<div className="grid grid-cols-3 gap-3 text-sm">

<div className="flex justify-between">
<span>Liquidity</span>
<span style={{color: liquidityRisk}}>
{data.liquidityVacuumScore}/10
</span>
</div>

<div className="flex justify-between">
<span>Breadth</span>
<span style={{color: breadthRisk}}>
{breadth200}%
</span>
</div>

<div className="flex justify-between">
<span>Gamma</span>
<span style={{color: gammaRisk}}>
{data.gammaExposure.toFixed(1)}
</span>
</div>

<div className="flex justify-between">
<span>Credit</span>
<span style={{color: crossAssetDot}}>
{data.crossAssetRiskScore}/10
</span>
</div>

<div className="flex justify-between">
<span>Correlation</span>
<span style={{color: correlationColor(data.correlationScore)}}>
{data.correlationScore}/3
</span>
</div>

<div className="flex justify-between">
<span>VIX</span>
<span style={{color:vixColor(md["^VIX"]?.current ??0)}}>
{md["^VIX"]?.current?.toFixed(2)}
</span>
</div>

</div>

</Panel>



{/* INDEX BAR */}

<Panel title="INDEX MARKETS" bg="#111">
<div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4">

{["^DJI","^NDX","^GSPC","^RUT"].map((k)=>(
<div key={k} className="border border-zinc-800 p-3">

<div className="text-xs text-zinc-500">
{indexLabels[k]}
</div>

<div className="text-lg">
{md[k]?.current ? md[k].current.toFixed(0) : "-"}
</div>

<div style={{color:percentColor(md[k]?.change ?? 0)}}>
{md[k]?.change >=0 ? "▲":"▼"}{" "}
{md[k]?.change?.toFixed(2)}%
</div>

</div>
))}

</div>

</Panel>

{/* ETF LEISTE */}

<Panel title="ETF MARKETS" bg="#111" defaultOpen={false}>

<div className="text-xs text-zinc-400 mb-3 tracking-widest">
MARKT ETFs
</div>

<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">

{Object.keys(etfLabels).map((k)=>(
<div key={k}>

<span className="text-zinc-400">
{etfLabels[k]}
</span>

<div>{md[k]?.current?.toFixed(2)}</div>

<div style={{color:percentColor(md[k]?.change ??0)}}>
{md[k]?.change?.toFixed(2)}%
</div>

</div>
))}



</div>
</Panel>

{/* MAKRO REGIME BAR */}

<Panel title="MAKRO REGIME BAR" bg="#111">

<div className="border border-zinc-800 p-3 mb-6">

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">

{/* PHASE TEXT */}

<div>

<div className="text-zinc-400 text-xs">MARKTPHASE</div>

<div className="flex items-center gap-2 mt-1">

<div
className="w-3 h-3 rounded-full"
style={{background:timelineColor(data.cyclePhase)}}
/>

<span className="text-sm">
{data.cyclePhase}
</span>

</div>

</div>

{/* PHASEN SKALA */}

<div>

<div className="flex gap-1">

{["1","2","3","4","5","6","7"].map((p)=>{

const phaseNum = parseInt(p);
const current = parseInt(currentPhase);

let color="#333";

if(phaseNum<current) color="#666";
if(phaseNum===current) color=timelineColor(data.cyclePhase);

return(

<div
key={p}
className="h-3 flex-1 rounded"
style={{background:color}}
/>

)

})}

</div>

<div className="flex justify-between text-xs text-zinc-500 mt-1">

{["1","2","3","4","5","6","7"].map((p)=>(
<span key={p}>{p}</span>
))}

</div>

</div>

{/* REGIME AMPEL */}

<div>

<div className="text-zinc-400 text-xs">MARKTREGIME</div>

<div
className="text-sm mt-1 font-bold"
style={{color:regimeColor(regimeSignal)}}
>
{regimeSignal.replaceAll("_"," ").toUpperCase()}
</div>

<div className="text-xs text-zinc-400">
Score {regimeSignalScore}
</div>

</div>


{/* MARKTRISIKO */}

<div className="flex flex-wrap justify-end gap-3">

<RiskDot color={volRisk} label="VOL"/>
<RiskDot color={creditRisk} label="CREDIT"/>
<RiskDot color={breadthRisk} label="BREADTH"/>
<RiskDot color={gammaRisk} label="GAMMA"/>
<RiskDot color={dealerRisk} label="DEALER"/>
<RiskDot color={liquidityRisk} label="LIQ VAC"/>
<RiskDot color={liquidityIndexDot} label="LIQ SYS"/>
<RiskDot color={fciRisk} label="FCI"/>
<RiskDot color={crossAssetDot} label="XAS"/>

</div>

</div>

</div>

</Panel>

{/* PHASENLEISTE */}

<Panel title="PHASENLEISTE" bg="#111">

<div className="border border-zinc-800 p-3 mb-6">

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 text-sm">

<div>
<div className="text-zinc-400">Kapitalrotation</div>
<div style={{color:rotationColor}}>{rotationLabel}</div>
</div>

{/* ===== MARKTPHASE ===== */}

<div>

<div className="text-zinc-400">SPX Momentum</div>

<div
style={{
color:spMomentumColor(data.spMomentumRegime ?? "neutral"),
fontWeight:"bold"
}}
>
{(data.spMomentumRegime ?? "neutral")
.replaceAll("_"," ")
.toUpperCase()}
</div>

<div className="text-xs text-zinc-400">
Score {data.spMomentumScore}
</div>

</div>

<div>
<div className="text-zinc-400">Modell-Konfidenz</div>
<div style={{color:blue}}>
{data.confidence}%
</div>
</div>

<div>
<div className="text-zinc-400">Liquiditätsfluss</div>
<div style={{color:liquidityFlowColor}}>
{data.liquidityFlow}
</div>
</div>

<div>
<div className="text-zinc-400">Liquiditätsindex</div>
<div style={{color:liquidityScoreColor}}>
{liquidityScore}
</div>
</div>

</div>

</div>

</Panel>

{/* FRÜHSIGNALE */}


<div className="text-sm mb-2 text-blue-400">FRÜHSIGNALE</div>

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">

<Panel title="RELATIVE STÄRKE" bg={earlyBg}>

<div className="flex justify-between text-sm">
<span>Small vs Tech</span>
<span style={{color:relativeColor(rsSmall)}}>
{(rsSmall*100).toFixed(2)}%
</span>
</div>

<div className="flex justify-between text-sm">
<span>Growth vs Value</span>
<span style={{color:relativeColor(rsGrowth)}}>
{(rsGrowth*100).toFixed(2)}%
</span>
</div>

<div className="flex justify-between text-sm">
<span>Equal vs Mega Caps</span>
<span style={{color:relativeColor(rsEqual)}}>
{rsEqual.toFixed(2)}%
</span>
</div>

<div className="flex justify-between text-sm">
<span>Concentration</span>
<span
style={{
color:
data.rotationDetails?.concentrationScore >=2 ? red :
data.rotationDetails?.concentrationScore ===1 ? yellow :
green
}}
>
{data.rotationDetails?.concentrationScore ?? 0}
</span>
</div>

<div className="flex justify-between text-sm mt-3">
<span>VIX</span>
<span style={{color:vixColor(md["^VIX"]?.current ??0)}}>
{md["^VIX"]?.current?.toFixed(2)}
</span>
</div>

</Panel>

<Panel title="KREDIT & LIQUIDITÄT" bg={earlyBg}>

<div className="flex justify-between text-sm">
<span>Kreditspread</span>
<span style={{color:creditColor}}>
{creditSignal}
</span>
</div>

<div className="flex justify-between text-sm">
<span>Kreditratio</span>
<span>{creditRatio.toFixed(2)}</span>
</div>

<div className="flex justify-between text-sm mt-2">
<span>MOVE Index</span>

<span style={{
color:moveColor(data.moveIndex)
}}>
{data.moveIndex?.toFixed(0)}
</span>

</div>

<div className="flex justify-between text-sm mt-2">
<span>Financial Conditions</span>

<span style={{
color:fciColor(data.financialConditionsScore)
}}>
{data.financialConditionsScore}
</span>

</div>

<div className="text-xs text-zinc-400">
{data.financialConditionsRegime}
</div>

<div className="flex justify-between text-sm mt-2">

<span>Cross Asset Risk</span>

<span style={{
color:crossAssetColor(data.crossAssetRiskScore)
}}>

{data.crossAssetRiskScore}/10

</span>

</div>

<div className="text-xs text-zinc-400">
{data.crossAssetRiskRegime}
</div>

<div className="flex justify-between text-sm mt-2">

<span>Market Liquidity</span>

<span style={{
color:liquidityIndexColor(marketLiquidityScore)
}}>

{marketLiquidityScore}/100

</span>

</div>

<div className="text-xs text-zinc-400">
{marketLiquidityRegime}
</div>

</Panel>

<Panel title="MARKT MIKROSTRUKTUR" bg={earlyBg}>

<div
className="flex justify-between text-sm mt-2"
style={{color:gammaColor(data.gammaExposure)}}
>
<span> Gamma </span>
{data.gammaExposure.toFixed(1)}B
</div>

<div className="text-xs text-zinc-400 mb-2">
{data.gammaRegime}
</div>

<div className="flex justify-between text-sm mt-2">
<span>Dealer Pressure</span>
<span
style={{
color:
data.dealerPressureScore >=4 ? red :
data.dealerPressureScore >=2 ? orange :
green
}}
>
{data.dealerPressureScore}/10
</span>
</div>

<div className="text-xs text-zinc-400">
{data.dealerPressureRegime}
</div>

{/* LIQUIDITY VACUUM */}

<div className="flex justify-between text-sm mt-3">
<span>Liquidity Vacuum</span>

<span
style={{
color:
data.liquidityVacuumScore >=7 ? red :
data.liquidityVacuumScore >=5 ? orange :
data.liquidityVacuumScore >=3 ? yellow :
green
}}
>
{data.liquidityVacuumScore}/10
</span>

</div>

<div className="text-xs text-zinc-400">
{data.liquidityVacuumRegime}
</div>

<div className="flex justify-between text-sm mt-2">

<span>Volatility of Vol</span>

<span style={{
color:
data.volOfVolRatio > 1.5 ? red :
data.volOfVolRatio > 1.35 ? orange :
data.volOfVolRatio > 1.2 ? yellow :
data.volOfVolRatio >  0.95 ? green :
blue
}}>

{data.volOfVolRatio?.toFixed(2)}

{" "}

{data.volOfVolTrend === "up" && "↑"}
{data.volOfVolTrend === "down" && "↓"}
{data.volOfVolTrend === "flat" && "→"}

</span>

</div>


</Panel>

<Panel title="VOLATILITÄTSSTRUKTUR" bg={earlyBg}>

<div className="flex justify-between text-sm mt-2">
<span>VIX Termstruktur</span></div>
<div
className="text-lg"
style={{color:vixCurveColor(vixCurve)}}
>
{vixCurve}
</div>

<div className="flex justify-between text-sm mt-2">
<span>VIX Termratio</span>

<span style={{color:vixRatioColor(data.vixTermRatio ?? 0)}}>
{data.vixTermRatio
? data.vixTermRatio.toFixed(2)
: "-"}
</span>
</div>

<div className="text-xs text-zinc-400 mt-1">
{data.vixTermRatioRegime}
</div>
<div className="flex justify-between text-sm mt-2">
<span>Options Skew</span>
<span style={{
color:
data.optionsSkewRatio > 1.25 ? red :
data.optionsSkewRatio > 1.1 ? orange :
data.optionsSkewRatio > 1.0 ? yellow :
green
}}>
{data.optionsSkewRatio?.toFixed(2)}
</span>
</div>

</Panel>

<Panel title="MARKTSTRESS" bg={earlyBg}>
<div className="flex justify-between text-sm mt-2">
<span>Marktstress Score</span></div>
<div
className="text-lg"
style={{color:stressColor(stressScore)}}
>
{stressScore}/10
</div>

<div>
{stressRegime}
</div>


{/* REGIME AMPEL */}

<div>
<div className="flex justify-between text-sm mt-2">
<span>Marktregime</span></div>

<div
className="text-sm mt-1 font-bold"
style={{color:regimeColor(regimeSignal)}}
>
{regimeSignal.replaceAll("_"," ").toUpperCase()}
</div>

<div className="text-xs text-zinc-400">
Score {regimeSignalScore}
</div>

</div>


</Panel>



<Panel title="CORRELATION SPIKE" bg={earlyBg}>

<div className="flex justify-between text-sm">
<span>Score</span>

<span style={{color:correlationColor(correlationScore)}}>
{correlationScore}/3
</span>

</div>

<div className="flex justify-between text-sm mt-2">
<span>Dispersion</span>

<span>
{correlationDispersion.toFixed(2)}
</span>

</div>

<div className="text-xs text-zinc-400 mt-1">
{correlationRegime}
</div>

</Panel>

</div>

{/* MARKTSTRUKTUR */}

<div className="text-sm mb-2 text-yellow-400">MARKTSTRUKTUR</div>

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">

<Panel title="MARKTBREITE" bg={structureBg}>

<div className="text-xs mb-1">200 Tage Durchschnitt {breadth200}%</div>
<div className="h-2 bg-zinc-800 mb-2">
<div className="h-full" style={{
width:`${breadth200}%`,
background: breadth200>70?green:breadth200>50?yellow:red
}}/>
</div>

<div className="text-xs mb-1">50 Tage Durchschnitt {breadth50}%</div>
<div className="h-2 bg-zinc-800 mb-2">
<div className="h-full" style={{
width:`${breadth50}%`,
background: breadth50>70?green:breadth50>50?yellow:red
}}/>
</div>

<div className="text-xs mb-1">20 Tage Durchschnitt {breadth20}%</div>
<div className="h-2 bg-zinc-800">
<div className="h-full" style={{
width:`${breadth20}%`,
background: breadth20>70?green:breadth20>50?yellow:red
}}/>
</div>

</Panel>

<Panel title="ADVANCE / DECLINE" bg={structureBg}>

<div className="flex justify-between text-sm">
<span>Adv</span>
<span>{data.advances}</span>
</div>

<div className="flex justify-between text-sm">
<span>Dec</span>
<span>{data.declines}</span>
</div>

<div style={{color:adColor(data.advanceDecline)}}>
A/D {data.advanceDecline}
</div>

</Panel>

<Panel title="NEW HIGHS / LOWS" bg={structureBg}>

<div className="flex justify-between text-sm">
<span>Highs</span>
<span>{data.newHighs}</span>
</div>

<div className="flex justify-between text-sm">
<span>Lows</span>
<span>{data.newLows}</span>
</div>

<div style={{color:highLowColor(data.newHighs-data.newLows)}}>
{data.highLowSignal}
</div>

</Panel>

<Panel title="DISTRIBUTION" bg={structureBg}>

<div className="text-sm">
Score {Math.round(smoothDistribution)}/7
</div>

<div className="h-2 bg-zinc-800 mt-2">
<div className="h-full" style={{
width:`${(Math.round(smoothDistribution)/7)*100}%`,
background:
Math.round(smoothDistribution)>=4?red:
Math.round(smoothDistribution)>=2?yellow:
green
}}/>
</div>

</Panel>

<Panel title="MARKTREGIME HISTORIE" bg={structureBg}>

<div className="flex gap-1">

{data.regimeHistory?.map((r:any,i:number)=>(
<div
key={i}
className="h-5 flex-1"
title={`${r.date} ${r.phase}`}
style={{background:timelineColor(r.phase)}}
/>
))}

</div>

</Panel>

</div>

{/* CRASH ENGINE */}

<div className="text-sm mb-2 text-red-400">CRASH ENGINE</div>

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">

<Panel title="CRASH WAHRSCHEINLICHKEIT" bg={crashBg}>

<div className="flex flex-col items-center">

<Gauge value={adjustedCrash}/>

<div className="text-xs mt-2" style={{
color:
crashMomentum > 10 ? red :
crashMomentum > 5 ? orange :
crashMomentum > 0 ? yellow :
green
}}>
Momentum: {crashMomentum.toFixed(1)}
</div>

<div className="text-sm mt-2">
{data.crashRiskRegime}
</div>

</div>

<div className="mt-3 text-sm space-y-1">

<div className="flex justify-between">
<span>Structure Risk</span>
<span>{data.structureRisk}%</span>
</div>

<div className="flex justify-between">
<span>Liquidity Risk</span>
<span>{data.liquidityRisk}%</span>
</div>

<div className="flex justify-between">
<span>Options Risk</span>
<span>{data.optionsRisk}%</span>
</div>

<div className="flex justify-between">
<span>Macro Risk</span>
<span>{data.macroRisk}%</span>
</div>

</div>

</Panel>

<Panel title="CRASH RADAR" bg={crashBg}>
<div className="text-lg" style={{color:crashRadarColor(data.crashRadarScore)}}>
Score {data.crashRadarScore}
</div>
<div className="mt-2 text-sm">
{data.crashRadarTrigger?"AUSGELÖST":"Normal"}
</div>

<div
className="text-lg"
style={{color:putDecisionColor(data.putDecision)}}
>
{data.putDecision}
</div>
<div className="mt-2 text-sm">

Score {data.putScore}/10
</div>

</Panel>

<Panel title="MARKTZUSTAND" bg={crashBg}>
<span>KAPITULATION</span>
<div className="text-lg" style={{
color:
data.capitulationProbability>70?red:
data.capitulationProbability>50?orange:
yellow
}}>

{data.capitulationProbability?.toFixed(0)}%
</div>
<div style={{
color:data.capitulationAlarm?red:green
}}>
{data.capitulationAlarm?"ALARM":"Normal"}
</div>

<span>MARKTFRAGILITÄT</span>
<div className="text-lg" style={{color:fragilityColor(data.fragilityIndex)}}>
{data.fragilityIndex?.toFixed(2)}
</div>
<div className="text-sm">
{data.fragilityRegime}
</div>

</Panel>

<Panel title="REGIME STABILITÄT" bg={crashBg}>

<div
className="text-lg"
style={{color:stabilityColor(data.regimeStabilityScore)}}
>
{data.regimeStabilityScore}/100
</div>

<div className="text-sm">
{data.regimeStabilityRegime}
</div>

<div className="h-2 bg-zinc-800 mt-2">
<div className="h-full"
style={{
width:`${data.regimeStabilityScore}%`,
background:stabilityColor(data.regimeStabilityScore)
}}/>
</div>

</Panel>

<Panel title="VOL REGIME" bg={crashBg}>

{/* VVIX PROXY */}
<div className="flex justify-between text-sm">
<span>Vol of Vol</span>
<span style={{
color:
data.volOfVolRatio > 1.5 ? red :
data.volOfVolRatio > 1.3 ? orange :
data.volOfVolRatio > 1.15 ? yellow :
green
}}>
{data.volOfVolRatio?.toFixed(2)}
</span>
</div>

<div className="text-xs text-zinc-400 mb-2">
Trend: {data.volOfVolTrend}
</div>

{/* VIX LEVEL */}
<div className="flex justify-between text-sm mt-2">
<span>VIX</span>
<span style={{color:vixColor(md["^VIX"]?.current ??0)}}>
{md["^VIX"]?.current?.toFixed(2)}
</span>
</div>

{/* VOL EXPANSION SIGNAL */}
<div className="flex justify-between text-sm mt-2">
<span>Vol Expansion</span>

<span style={{
color:
(data.volOfVolRatio > 1.3 && data.gammaExposure < 0)
? red
: yellow
}}>
{
(data.volOfVolRatio > 1.3 && data.gammaExposure < 0)
? "ACTIVE"
: "NORMAL"
}
</span>

</div>

</Panel>


</div>

</div>
);
}



