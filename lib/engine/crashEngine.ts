// /lib/engine/crashEngine.ts

import { THRESHOLDS } from "./thresholds";
import { getMarketStructureFlags } from "./marketStructureFlags";

export function crashEngine(data: any) {

/* =====================================================
CONSTANTS
===================================================== */

const MAX = 25;

/* =====================================================
INPUTS
===================================================== */

const vix = Number(
data.vix ??
data.marketData?.["^VIX"]?.current ??
20
);

const vixTerm = Number(
data.vixTermRatio ?? 1
);

const move = Number(
data.moveIndex ??
data.marketDrivers?.raw?.move ??
80
);

const volOfVol = Number(
data.volOfVolRatio ??
data.marketDrivers?.raw?.volOfVol ??
1
);

const correlation = Number(
data.correlationScore ??
data.marketDrivers?.raw?.correlation ??
0
);

const gamma = Number(
data.gammaExposure ?? 0
);

const creditRatio = Number(
data.creditRatio ?? 1
);

const marketLiquidityScore = Number(
data.marketLiquidityScore ?? 50
);

const liquidityVacuumScore = Number(
data.liquidityVacuumScore ?? 0
);

const breadth50 = Number(
data.breadth50 ?? 50
);

const breadth200 = Number(
data.breadth200 ?? 50
);

/* =====================================================
INTERNALS
===================================================== */

const participationScore = Number(
data.participationScore ??
data.participation?.score ??
50
);

const rotationScore = Number(
data.rotationScore ??
data.rotation?.score ??
50
);

const rsGrowth = Number(
data.rsGrowth ??
data.rotation?.rsGrowth ??
1
);

const rsSmall = Number(
data.rsSmall ??
data.rotation?.rsSmall ??
1
);

const rsEqual = Number(
data.rsEqual ??
data.rotation?.rsEqual ??
1
);

const ad = Number(
data.ad ??
data.structure?.advanceDecline?.value ??
0
);

const highs = Number(
data.highs ??
data.structure?.highsLows?.highs ??
0
);

const lows = Number(
data.lows ??
data.structure?.highsLows?.lows ??
0
);

const distributionScore = Number(
data.distributionScore ??
data.structure?.distribution?.value ??
0
);

/* =====================================================
ROTATION DECAY
===================================================== */

const rotationDecayScore = Number(
data.rotationDecay?.score ?? 0
);

const rotationDecayState =
data.rotationDecay?.state ??
"HEALTHY_ROTATION";

/* =====================================================
INTERNAL DIVERGENCE
===================================================== */

const divergenceSeverity = Number(
data.internalDivergence?.severity ?? 0
);

const hiddenDistribution =
Boolean(
data.internalDivergence?.hiddenDistribution
);

const participationCollapse =
Boolean(
data.internalDivergence?.participationCollapse
);

/* =====================================================
HISTORY
===================================================== */

const breadthTrend = Number(
data.historyMetrics?.breadthTrend ?? 0
);

const breadthAcceleration = Number(
data.historyMetrics?.breadthAcceleration ?? 0
);

const participationDecay = Number(
data.historyMetrics?.participationDecay ?? 0
);

const leadershipDecay = Number(
data.historyMetrics?.leadershipDecay ?? 0
);

const phasePersistence = Number(
data.historyMetrics?.phasePersistence ?? 0
);


/* =====================================================
CENTRAL MARKET STRUCTURE FLAGS
===================================================== */

const structureFlags =
getMarketStructureFlags({
rsGrowth,
rsSmall,
rsEqual,

breadth50,
breadth200,

participationScore,

ad,

highs,
lows,

distributionScore
});

const {
narrowLeadership,
severeNarrowLeadership,

weakParticipation,
collapsingParticipation,

breadthFailure,
severeBreadthFailure,

equalWeightWeakness,
smallCapWeakness
} = structureFlags;

/* =====================================================
INTERNAL DETERIORATION
===================================================== */

const internalDeterioration = (

ad < -25 ||

(
breadth50 < 55 &&
participationScore < 45
)

);

const severeInternalDeterioration = (

ad < -80 &&

participationScore < 35

);

/* =====================================================
HIGH / LOW STRUCTURE
===================================================== */

let hlScore = 0;

const highLowDelta =
highs - lows;

if (highLowDelta < 0) {
hlScore += 4;
}

if (highLowDelta < -10) {
hlScore += 5;
}

if (highLowDelta < -25) {
hlScore += 6;
}

hlScore = Math.min(
hlScore,
MAX
);

/* =====================================================
A. STRUCTURAL FRAGILITY
===================================================== */

let structuralFragility = 0;

/* ---------- BREADTH ---------- */

if (
breadth200 <
THRESHOLDS.breadth.weak
) {
structuralFragility += 10;
}

else if (
breadth200 <
THRESHOLDS.breadth.neutral
) {
structuralFragility += 5;
}

if (
breadth50 <
THRESHOLDS.breadth.neutral
) {
structuralFragility += 6;
}

if (
breadth50 < 45
) {
structuralFragility += 5;
}

/* ---------- DISTRIBUTION ---------- */

if (distributionScore > 3) {
structuralFragility += 5;
}

if (distributionScore > 5) {
structuralFragility += 6;
}

/* ---------- PARTICIPATION ---------- */

if (weakParticipation) {
structuralFragility += 8;
}

if (collapsingParticipation) {
structuralFragility += 8;
}

/* ---------- INTERNALS ---------- */

if (internalDeterioration) {
structuralFragility += 6;
}

if (severeInternalDeterioration) {
structuralFragility += 8;
}

/* ---------- BREADTH FAILURE ---------- */

if (breadthFailure) {
structuralFragility += 6;
}

if (severeBreadthFailure) {
structuralFragility += 8;
}

/* ---------- LEADERSHIP ---------- */

if (narrowLeadership) {
structuralFragility += 5;
}

if (severeNarrowLeadership) {
structuralFragility += 8;
}

/* =====================================================
ROTATION INSTABILITY OVERLAY
===================================================== */

if (
rotationScore < 30 &&
participationScore < 50 &&
narrowLeadership
) {
structuralFragility += 8;
}

/* =====================================================
HIDDEN FRAGILITY OVERLAY
===================================================== */

if (
equalWeightWeakness &&
smallCapWeakness &&
breadth50 > 55
) {
structuralFragility += 5;
}

/* ---------- INTERNAL DIVERGENCES ---------- */

structuralFragility += Math.round(
divergenceSeverity * 0.15
);

if (hiddenDistribution) {
structuralFragility += 8;
}

if (participationCollapse) {
structuralFragility += 10;
}


/* =====================================================
STRUCTURAL INSTABILITY BOOST
===================================================== */

if (
rotationScore < 25 &&
participationScore < 45
) {
structuralFragility += 6;
}

if (
rotationScore < 20 &&
weakParticipation &&
breadth50 < 55
) {
structuralFragility += 5;
}

/* ---------- ROTATION ---------- */

if (rotationScore < 40) {
structuralFragility += 4;
}

if (rotationScore < 25) {
structuralFragility += 6;
}

structuralFragility += hlScore;

structuralFragility = Math.min(
structuralFragility,
100
);

/* ---------- ROTATION DECAY ---------- */

if (rotationDecayScore > 45) {
structuralFragility += 4;
}

if (rotationDecayScore > 60) {
structuralFragility += 6;
}

if (rotationDecayScore > 75) {
structuralFragility += 8;
}

if (
rotationDecayState ===
"DISTRIBUTION_ROTATION"
) {
structuralFragility += 5;
}

if (
rotationDecayState ===
"EXHAUSTED_ROTATION"
) {
structuralFragility += 8;
}

/* ---------- HISTORY DECAY ---------- */

if (breadthTrend < -10) {
structuralFragility += 4;
}

if (breadthAcceleration < -5) {
structuralFragility += 4;
}

if (participationDecay > 10) {
structuralFragility += 5;
}

if (participationDecay > 20) {
structuralFragility += 8;
}

if (leadershipDecay > 10) {
structuralFragility += 4;
}

if (leadershipDecay > 20) {
structuralFragility += 8;
}

if (phasePersistence >= 6) {
structuralFragility += 4;
}

if (phasePersistence >= 10) {
structuralFragility += 8;
}

structuralFragility = Math.min(
structuralFragility,
100
);

/* =====================================================
B. CRASH TRIGGER
===================================================== */

let crashTrigger = 0;

/* ---------- LIQUIDITY ---------- */

if (
liquidityVacuumScore >=
THRESHOLDS.liquidityVacuum.high
) {
crashTrigger += 15;
}

else if (
liquidityVacuumScore >=
THRESHOLDS.liquidityVacuum.medium
) {
crashTrigger += 10;
}

if (
marketLiquidityScore < 35
) {
crashTrigger += 8;
}

if (
marketLiquidityScore < 25
) {
crashTrigger += 8;
}

/* ---------- CREDIT ---------- */

if (creditRatio < 0.97) {
crashTrigger += 5;
}

if (creditRatio < 0.94) {
crashTrigger += 10;
}

/* ---------- OPTIONS ---------- */

if (gamma < 0) {
crashTrigger += 6;
}

if (gamma < -5) {
crashTrigger += 6;
}

if (volOfVol > 1.1) {
crashTrigger += 5;
}

if (volOfVol > 1.3) {
crashTrigger += 5;
}

/* ---------- VOLATILITY ---------- */

if (
vix >
THRESHOLDS.vix.risk
) {
crashTrigger += 6;
}

if (
vix >
THRESHOLDS.vix.panic
) {
crashTrigger += 10;
}

if (correlation > 2) {
crashTrigger += 5;
}

if (correlation > 4) {
crashTrigger += 5;
}

/* ---------- TERM STRUCTURE ---------- */

let isBackwardation = false;

if (vix > 22) {

if (
vixTerm < 0.92
) {
isBackwardation = true;
}
}

if (isBackwardation) {
crashTrigger += 12;
}

/* ---------- MOVE ---------- */

if (move > 85) {
crashTrigger += 3;
}

if (move > 100) {
crashTrigger += 5;
}

if (move > 120) {
crashTrigger += 5;
}

/* ---------- ACCELERATION ---------- */

if (
data.crashScoreDelta > 5
) {
crashTrigger += 5;
}

if (
data.crashScoreDelta > 10
) {
crashTrigger += 10;
}

crashTrigger = Math.min(
crashTrigger,
100
);

/* =====================================================
C. PANIC STATE
===================================================== */

let panicState = 0;

if (
vix > 35
) {
panicState += 20;
}

if (
vix > 45
) {
panicState += 20;
}

if (
breadth50 < 30
) {
panicState += 15;
}

if (
breadth200 < 35
) {
panicState += 15;
}

if (
correlation > 4
) {
panicState += 15;
}

if (
move > 120
) {
panicState += 10;
}

panicState = Math.min(
panicState,
100
);

/* =====================================================
FINAL SCORE
===================================================== */

const finalScore = Math.round(

(
structuralFragility * 0.55
) +

(
crashTrigger * 0.30
) +

(
panicState * 0.15
)

);

/* =====================================================
PROBABILITY
===================================================== */

let probability = Math.round(

(
crashTrigger * 0.55
) +

(
panicState * 0.23
) +

(
structuralFragility * 0.22
)

);

/* =====================================================
STRUCTURAL FLOOR
===================================================== */

if (

rotationScore < 30 &&

participationScore < 50 &&

narrowLeadership &&

probability < 25

) {

probability = 25;
}

if (

severeNarrowLeadership &&

weakParticipation &&

breadth50 < 55 &&

probability < 28

) {

probability = 28;
}

probability = Math.max(
0,
Math.min(100, probability)
);

if (

rotationDecayScore > 70 &&

hiddenDistribution &&

probability < 35

) {

probability = 35;
}

if (

phasePersistence >= 10 &&

participationDecay > 15 &&

probability < 40

) {

probability = 40;
}

probability = Math.max(
0,
Math.min(100, probability)
);

/* =====================================================
LABELS
===================================================== */

function structuralLabel(v: number) {

if (v >= 75) return "HIGH";
if (v >= 45) return "ELEVATED";
return "LOW";
}

function triggerLabel(v: number) {

if (v >= 70) return "HIGH";
if (v >= 40) return "MEDIUM";
return "LOW";
}

function panicLabel(v: number) {

if (v >= 70) return "PANIC";
if (v >= 40) return "STRESSED";
return "CALM";
}

/* =====================================================
EVENT TYPE
===================================================== */

let eventType =
"ORDERLY_RESET";

if (
structuralFragility >= 70 &&
crashTrigger >= 50
) {
eventType = "LIQUIDATION_EVENT";
}

if (
vix > 35 &&
volOfVol > 1.3 &&
isBackwardation
) {
eventType = "VOL_CRASH";
}

if (
creditRatio < 0.94 &&
marketLiquidityScore < 35
) {
eventType = "CREDIT_EVENT";
}

if (
panicState >= 75
) {
eventType = "PANIC_CAPITULATION";
}

/* =====================================================
SUMMARY
===================================================== */

const summary =

`Fragility ${structuralLabel(structuralFragility)} | Trigger ${triggerLabel(crashTrigger)} | Panic ${panicLabel(panicState)}`;

/* =====================================================
RETURN
===================================================== */

return {

score: finalScore,

max: 100,

probability,

label: structuralLabel(structuralFragility),

momentum: Math.round(
crashTrigger * 0.25
),

eventType,

structuralFragility: {
score: Math.round(structuralFragility),
state: structuralLabel(structuralFragility)
},

crashTrigger: {
score: Math.round(crashTrigger),
state: triggerLabel(crashTrigger)
},

panicState: {
score: Math.round(panicState),
state: panicLabel(panicState)
},

components: {

structural: {
value: Math.round(structuralFragility),
max: 100
},

trigger: {
value: Math.round(crashTrigger),
max: 100
},

panic: {
value: Math.round(panicState),
max: 100
},

highLow: {
value: hlScore,
max: MAX,
strength: highLowDelta
}
},

summary
};
}
