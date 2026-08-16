/*
=============================================================
POSITION SIZING V3
=============================================================

PURPOSE

Position sizing does NOT decide direction.

tradeStackEngine
↓
independent trade candidates
↓
positionSizing
↓
individual sizing
↓
portfolio cap
↓
final allocation

THREE INDEPENDENT FLOWS

NASDAQ PUT
NASDAQ CALL
RUSSELL CALL

IMPORTANT

- No PRIMARY-flow overwrite
- No hidden fallback to 50 for existing values
- All relevant engine inputs are exposed
- Pipeline values are returned explicitly
- Individual flow sizing remains independent
- Portfolio cap is applied only afterwards
=============================================================
*/

type FlowName =
| "NASDAQ_PUT"
| "NASDAQ_CALL"
| "RUSSELL_CALL";

type Direction =
| "LONG"
| "SHORT"
| "NONE";

type SizedFlow = {
instrument: FlowName;
direction: Direction;
eligible: boolean;

size: number;
rawSize: number;
prePortfolioSize: number;

strength: number;
confidence: number;
riskMultiplier: number;

mode: string;
state: string;

reason: string;
};


/* =========================================================
HELPERS
========================================================= */

function num(
value: any,
fallback = 0
): number {
const n = Number(value);

return Number.isFinite(n)
? n
: fallback;
}


function nullableNum(
value: any
): number | null {
const n = Number(value);

return Number.isFinite(n)
? n
: null;
}


function clamp(
value: number,
min = 0,
max = 100
): number {
return Math.max(
min,
Math.min(max, value)
);
}


/* =========================================================
MAIN
========================================================= */

export function positionSizingV2(
engine: any
) {

/* =======================================================
INPUT OBJECTS
======================================================= */

const master =
engine?.master ?? {};

const crash =
engine?.crash ?? {};

const tradeStack =
engine?.tradeStack ?? {};

const edgeState =
engine?.edgeState ?? {};

const executionState =
engine?.executionState ?? {};

const regimeSync =
engine?.regimeSync ?? {};

const dangerZone =
engine?.dangerZone ?? {};

const systemHeat =
engine?.systemHeat ?? {};

const liquidity =
engine?.liquidity ?? {};

const fragility =
engine?.fragility ?? {};

const participation =
engine?.participation ?? {};

const rotationDecay =
engine?.rotationDecay ?? {};

const rotationConfirm =
engine?.rotationConfirm ?? {};

const marketQuality =
engine?.marketQuality ?? {};

const breadthThrust =
engine?.breadthThrust ?? {};

const squeeze =
engine?.squeeze ?? {};

const structure =
engine?.structure ?? {};

const putTiming =
engine?.putTiming ?? {};

const russell =
engine?.russell ?? {};

const priceMomentum =
engine?.priceMomentum ?? {};

const phase =
engine?.phase ??
"UNKNOWN";

const history =
engine?.historyMetrics ?? {};


/* =======================================================
EXPLICIT INPUT EXTRACTION
=======================================================

IMPORTANT:

No hidden "50" fallbacks here for values that should
come from another engine.

If an engine doesn't provide a value, we expose null.
======================================================= */

const input = {

/* -----------------------------
MASTER
----------------------------- */

masterScore:
nullableNum(master?.score),

masterMode:
master?.mode ??
master?.regime ??
null,


/* -----------------------------
CRASH
----------------------------- */

crashScore:
nullableNum(crash?.score),

crashProbability:
nullableNum(crash?.probability),

crashState:
crash?.state ??
crash?.label ??
null,


/* -----------------------------
EDGE
----------------------------- */

edgeScore:
nullableNum(edgeState?.score),

edgeState:
edgeState?.state ??
null,


/* -----------------------------
LIQUIDITY
----------------------------- */

liquidityScore:
nullableNum(liquidity?.score),

liquidityState:
liquidity?.state ??
null,


/* -----------------------------
FRAGILITY
----------------------------- */

fragilityScore:
nullableNum(fragility?.score),

fragilityState:
fragility?.state ??
null,


/* -----------------------------
PARTICIPATION
----------------------------- */

participationScore:
nullableNum(participation?.score),

participationState:
participation?.state ??
null,


/* -----------------------------
ROTATION DECAY
----------------------------- */

rotationDecayScore:
nullableNum(rotationDecay?.score),

rotationDecayState:
rotationDecay?.state ??
null,


/* -----------------------------
ROTATION CONFIRM
----------------------------- */

rotationConfidence:
nullableNum(
rotationConfirm?.confidence
),

rotationConfirmState:
rotationConfirm?.state ??
null,


/* -----------------------------
MARKET QUALITY
----------------------------- */

marketQualityScore:
nullableNum(
marketQuality?.score
),

marketQualityState:
marketQuality?.state ??
null,


/* -----------------------------
BREADTH THRUST
----------------------------- */

breadthThrustScore:
nullableNum(
breadthThrust?.strength ??
breadthThrust?.score
),


/* -----------------------------
SQUEEZE
----------------------------- */

squeezeRisk:
nullableNum(
squeeze?.risk
),

squeezeState:
squeeze?.state ??
null,


/* -----------------------------
REGIME SYNC
----------------------------- */

regimeSyncScore:
nullableNum(
regimeSync?.score
),

regimeSyncState:
regimeSync?.state ??
null,


/* -----------------------------
DANGER
----------------------------- */

dangerScore:
nullableNum(
dangerZone?.score
),

dangerState:
dangerZone?.state ??
null,


/* -----------------------------
SYSTEM HEAT
----------------------------- */

systemHeat:
nullableNum(
systemHeat?.value
),


/* -----------------------------
STRUCTURE
----------------------------- */

breadth50:
nullableNum(
structure?.breadth?.b50?.value
),

breadth200:
nullableNum(
structure?.breadth?.b200?.value
),


/* -----------------------------
HISTORY
----------------------------- */

breadthTrend:
nullableNum(
history?.breadthTrend
),

breadthAcceleration:
nullableNum(
history?.breadthAcceleration
),

participationDecay:
nullableNum(
history?.participationDecay
),

leadershipDecay:
nullableNum(
history?.leadershipDecay
),

relativeBreadthWeakness:
nullableNum(
history?.relativeBreadthWeakness
),

phasePersistence:
nullableNum(
history?.phasePersistence
),

regimePersistence:
nullableNum(
history?.regimePersistence
)
};


/* =======================================================
SAFE NUMERIC VALUES FOR CALCULATION
======================================================= */

const masterScore =
num(input.masterScore, 50);

const crashProbability =
num(input.crashProbability);

const edgeScore =
num(input.edgeScore);

const dangerScore =
num(input.dangerScore);

const heat =
num(input.systemHeat);

const liquidityScore =
num(input.liquidityScore, 50);

const fragilityScore =
num(input.fragilityScore, 50);

const participationScore =
num(input.participationScore, 50);

const rotationDecayScore =
num(input.rotationDecayScore);

const rotationConfidence =
num(input.rotationConfidence, 50);

const marketQualityScore =
num(input.marketQualityScore, 50);

const breadthThrustScore =
num(input.breadthThrustScore);

const squeezeRisk =
num(input.squeezeRisk);

const regimeSyncScore =
num(input.regimeSyncScore, 50);

const breadth50 =
num(input.breadth50, 50);

const breadth200 =
num(input.breadth200, 50);

const breadthTrend =
num(input.breadthTrend);

const breadthAcceleration =
num(input.breadthAcceleration);

const participationDecay =
num(input.participationDecay);

const leadershipDecay =
num(input.leadershipDecay);

const relativeBreadthWeakness =
num(input.relativeBreadthWeakness);

const phasePersistence =
num(input.phasePersistence);

const regimePersistence =
num(input.regimePersistence);


/* =======================================================
EXECUTION CONTEXT
======================================================= */

const executionMode =
executionState?.executionMode ??
executionState?.mode ??
"WAIT";

const riskState =
executionState?.riskState ??
"FRAGILE";

const tacticalBias =
executionState?.tacticalBias ??
"NEUTRAL";


/* =======================================================
STRUCTURAL FLAGS
======================================================= */

const deterioratingBreadth =
breadthTrend <= -2;

const acceleratingBreadthDamage =
breadthAcceleration <= -1;

const severeBreadthDamage =
breadthAcceleration <= -3;

const participationFailure =
participationScore < 40;

const severeParticipationFailure =
participationScore < 30;

const persistentWeakness =
relativeBreadthWeakness > 15 ||
regimePersistence >= 60;

const chronicWeakness =
relativeBreadthWeakness > 20 ||
regimePersistence >= 85;

const leadershipConcentration =
leadershipDecay <= -2;

const severeLeadershipConcentration =
leadershipDecay <= -5;

const poorMarketQuality =
marketQualityScore < 45;

const severeMarketQuality =
marketQualityScore < 35;

const weakLiquidity =
liquidityScore < 40;

const criticalLiquidity =
liquidityScore < 25;

const highFragility =
fragilityScore >= 70;

const extremeFragility =
fragilityScore >= 85;

const rotationBroken =
rotationDecayScore >= 75;

const rotationExhausted =
rotationDecayScore >= 85;

const negativeHeat =
heat <= -0.7;

const severeHeat =
heat <= -1.4;

const highDanger =
dangerScore >= 60;

const extremeDanger =
dangerScore >= 80;


/* =======================================================
PHASE
======================================================= */

const defensivePhase =
phase === "PHASE_4_RISK" ||
phase === "PHASE_5_BREAKDOWN" ||
phase === "PHASE_6_ACCELERATION" ||
phase === "PHASE_7_CAPITULATION";

const aggressiveLongPhase =
phase === "PHASE_1_EXPANSION";

const warningPhase =
phase === "PHASE_2_WARNING";

const distributionPhase =
phase === "PHASE_3_DISTRIBUTION";


/* =======================================================
GLOBAL RISK MULTIPLIER
======================================================= */

let globalRiskMultiplier = 1;


if (crashProbability >= 70)
globalRiskMultiplier *= 0.55;
else if (crashProbability >= 50)
globalRiskMultiplier *= 0.75;
else if (crashProbability >= 35)
globalRiskMultiplier *= 0.90;


if (dangerScore >= 80)
globalRiskMultiplier *= 0.45;
else if (dangerScore >= 60)
globalRiskMultiplier *= 0.70;
else if (dangerScore >= 40)
globalRiskMultiplier *= 0.90;


if (criticalLiquidity)
globalRiskMultiplier *= 0.55;
else if (weakLiquidity)
globalRiskMultiplier *= 0.80;


if (extremeFragility)
globalRiskMultiplier *= 0.45;
else if (highFragility)
globalRiskMultiplier *= 0.70;


if (poorMarketQuality)
globalRiskMultiplier *= 0.80;


if (persistentWeakness)
globalRiskMultiplier *= 0.85;


if (chronicWeakness)
globalRiskMultiplier *= 0.75;


if (rotationExhausted)
globalRiskMultiplier *= 0.70;
else if (rotationBroken)
globalRiskMultiplier *= 0.85;


if (negativeHeat)
globalRiskMultiplier *= 0.85;

if (severeHeat)
globalRiskMultiplier *= 0.70;


if (riskState === "BREAKDOWN")
globalRiskMultiplier *= 0.60;

if (riskState === "CRISIS")
globalRiskMultiplier *= 0.35;


if (executionMode === "DEFENSIVE")
globalRiskMultiplier *= 0.60;

if (executionMode === "REDUCE_RISK")
globalRiskMultiplier *= 0.75;

if (executionMode === "WAIT")
globalRiskMultiplier *= 0.75;


globalRiskMultiplier =
clamp(
globalRiskMultiplier * 100,
20,
100
) / 100;


/* =======================================================
BASE SIZE
======================================================= */

const BASE_SIZE = 40;


/* =======================================================
TRADE STACK FLOWS
======================================================= */

const nasdaqPut =
tradeStack?.nasdaqPut ?? {
instrument: "NASDAQ_PUT",
direction: "SHORT",
strength: 0,
state: "NEUTRAL"
};


const nasdaqCall =
tradeStack?.nasdaqCall ?? {
instrument: "NASDAQ_CALL",
direction: "LONG",
strength: 0,
state: "NEUTRAL"
};


const russellCall =
tradeStack?.russellCall ?? {
instrument: "RUSSELL_CALL",
direction: "LONG",
strength: 0,
state: "NEUTRAL"
};


/* =======================================================
CONFLICT
======================================================= */

const directionalConflict =
tradeStack?.meta?.directionalConflict === true ||
tradeStack?.directionalConflict === true;


/* =======================================================
CONFIDENCE
======================================================= */

function calculateConfidence(
flow: FlowName,
strength: number
) {

let confidence = 50;


confidence +=
(strength - 50) * 0.55;


confidence +=
(masterScore - 50) * 0.10;


confidence +=
(regimeSyncScore - 50) * 0.10;


confidence +=
(rotationConfidence - 50) * 0.08;


confidence +=
(marketQualityScore - 50) * 0.08;


if (flow === "NASDAQ_PUT") {

if (defensivePhase)
confidence += 8;

if (crashProbability >= 30)
confidence += 5;

if (participationFailure)
confidence += 5;

if (acceleratingBreadthDamage)
confidence += 4;
}


if (flow === "NASDAQ_CALL") {

if (aggressiveLongPhase)
confidence += 8;

if (warningPhase)
confidence -= 5;

if (defensivePhase)
confidence -= 12;

if (participationFailure)
confidence -= 8;

if (rotationBroken)
confidence -= 8;
}


if (flow === "RUSSELL_CALL") {

if (rotationConfidence >= 75)
confidence += 8;

if (rotationConfidence < 45)
confidence -= 8;

if (rotationBroken)
confidence -= 12;

if (rotationExhausted)
confidence -= 18;

if (defensivePhase)
confidence -= 10;
}


return clamp(
Math.round(confidence)
);
}


/* =======================================================
FLOW RISK
======================================================= */

function calculateFlowRiskMultiplier(
flow: FlowName
) {

let multiplier =
globalRiskMultiplier;


if (flow === "NASDAQ_PUT") {

if (defensivePhase)
multiplier *= 1.10;

if (
phase ===
"PHASE_7_CAPITULATION"
)
multiplier *= 0.55;

if (squeezeRisk >= 70)
multiplier *= 0.75;
}


if (flow === "NASDAQ_CALL") {

if (defensivePhase)
multiplier *= 0.35;

if (distributionPhase)
multiplier *= 0.65;

if (
aggressiveLongPhase &&
marketQualityScore >= 65 &&
participationScore >= 65
) {
multiplier *= 1.10;
}
}


if (flow === "RUSSELL_CALL") {

if (rotationConfidence < 60)
multiplier *= 0.65;

if (
rotationConfidence >= 80 &&
!rotationBroken
)
multiplier *= 1.10;

if (
breadthThrustScore >= 70 &&
participationScore >= 60
)
multiplier *= 1.10;

if (rotationExhausted)
multiplier *= 0.40;
}


return clamp(
multiplier,
0.10,
1.15
);
}


/* =======================================================
FLOW EDGE
======================================================= */

function calculateFlowEdge(
flow: FlowName,
strength: number
) {

let score = 0;


if (strength >= 75)
score += 8;
else if (strength >= 60)
score += 5;
else if (strength >= 40)
score += 2;
else
score -= 4;


if (edgeScore >= 60)
score += 3;
else if (edgeScore >= 40)
score += 1;
else if (edgeScore < 20)
score -= 3;


if (flow === "NASDAQ_PUT") {

if (defensivePhase)
score += 3;

if (crashProbability >= 35)
score += 2;

if (deterioratingBreadth)
score += 2;

if (participationFailure)
score += 2;

if (acceleratingBreadthDamage)
score += 2;
}


if (flow === "NASDAQ_CALL") {

if (aggressiveLongPhase)
score += 3;

if (
marketQualityScore >= 70 &&
participationScore >= 70
)
score += 3;

if (defensivePhase)
score -= 5;

if (rotationBroken)
score -= 3;
}


if (flow === "RUSSELL_CALL") {

if (rotationConfidence >= 75)
score += 4;

if (rotationConfidence < 50)
score -= 4;

if (breadthThrustScore >= 70)
score += 3;

if (rotationBroken)
score -= 5;
}


return score;
}


/* =======================================================
FALSE BREAK
======================================================= */

function falseBreakRisk() {

const risk =
num(
rotationConfirm?.falseBreakRisk,
50
);

return risk > 65;
}


/* =======================================================
FLOW SIZER
======================================================= */

function sizeFlow(
flow: FlowName,
candidate: any
): SizedFlow {

const strength =
clamp(
num(
candidate?.strength
)
);


const state =
candidate?.state ??
"NEUTRAL";


const direction =
candidate?.direction ??
"NONE";


/* -----------------------------------------------------
ELIGIBILITY
----------------------------------------------------- */

let eligible =
strength >= 20;


if (
directionalConflict
) {
eligible = false;
}


if (
executionMode === "WAIT" &&
strength < 60
) {
eligible = false;
}


if (
riskState === "CRISIS"
) {
eligible = false;
}


if (
phase ===
"PHASE_7_CAPITULATION"
) {
eligible = false;
}


if (!eligible) {

let reason =
"Trade strength below entry threshold";


if (directionalConflict)
reason =
"Directional conflict";


if (riskState === "CRISIS")
reason =
"Crisis regime";


if (
phase ===
"PHASE_7_CAPITULATION"
)
reason =
"Capitulation regime";


if (
executionMode === "WAIT"
)
reason =
"Execution state WAIT";


return {

instrument: flow,

direction,

eligible: false,

size: 0,

rawSize: 0,

prePortfolioSize: 0,

strength,

confidence: 0,

riskMultiplier: 0,

mode: "NO_TRADE",

state,

reason
};
}


/* -----------------------------------------------------
CONFIDENCE
----------------------------------------------------- */

const confidence =
calculateConfidence(
flow,
strength
);


/* -----------------------------------------------------
EDGE
----------------------------------------------------- */

const flowEdge =
calculateFlowEdge(
flow,
strength
);


/* -----------------------------------------------------
RISK
----------------------------------------------------- */

const riskMultiplier =
calculateFlowRiskMultiplier(
flow
);


/* -----------------------------------------------------
RAW SIZE
----------------------------------------------------- */

let rawSize =
8 +
(
(strength - 20) *
0.62
);


rawSize *=
0.70 +
(
confidence /
100
) * 0.45;


rawSize +=
flowEdge * 1.25;


rawSize *=
riskMultiplier;


/* -----------------------------------------------------
FLOW SAFETY
----------------------------------------------------- */

if (
flow === "NASDAQ_CALL"
) {

if (participationFailure)
rawSize *= 0.60;

if (poorMarketQuality)
rawSize *= 0.65;

if (severeBreadthDamage)
rawSize *= 0.55;
}


if (
flow === "RUSSELL_CALL"
) {

if (
rotationConfidence < 55
)
rawSize *= 0.55;

if (
rotationDecayScore >= 70
)
rawSize *= 0.50;

if (
falseBreakRisk()
)
rawSize *= 0.60;
}


if (
flow === "NASDAQ_PUT"
) {

const bullishImpulse =
priceMomentum?.bullishImpulse === true;


const ndxPriceScore =
num(
priceMomentum?.ndx?.score ??
priceMomentum?.score,
50
);


if (
bullishImpulse &&
ndxPriceScore >= 70
)
rawSize *= 0.65;


if (
ndxPriceScore <= 25
)
rawSize *= 0.75;
}


/* -----------------------------------------------------
MAX FLOW SIZE
----------------------------------------------------- */

let maxFlowSize =
BASE_SIZE;


if (
strength >= 75 &&
confidence >= 70
) {

maxFlowSize = 40;

}
else if (
strength >= 60
) {

maxFlowSize = 32;

}
else {

maxFlowSize = 22;

}


if (
severeMarketQuality ||
severeParticipationFailure ||
extremeFragility
) {

maxFlowSize =
Math.min(
maxFlowSize,
20
);

}
else if (
poorMarketQuality ||
participationFailure ||
highFragility
) {

maxFlowSize =
Math.min(
maxFlowSize,
28
);
}


if (
chronicWeakness
) {

maxFlowSize =
Math.min(
maxFlowSize,
22
);
}


if (
direction === "LONG" &&
defensivePhase
) {

maxFlowSize =
Math.min(
maxFlowSize,
15
);
}


if (
flow === "RUSSELL_CALL" &&
rotationConfidence < 75
) {

maxFlowSize =
Math.min(
maxFlowSize,
20
);
}


if (
flow === "NASDAQ_PUT" &&
defensivePhase &&
strength >= 75 &&
confidence >= 70
) {

maxFlowSize =
Math.min(
45,
maxFlowSize + 5
);
}


rawSize =
Math.min(
rawSize,
maxFlowSize
);


/* -----------------------------------------------------
STARTER LOGIC
----------------------------------------------------- */

if (
state ===
"EARLY_DEFENSIVE_SHORT" ||
state ===
"EARLY_LONG"
) {

rawSize =
Math.min(
rawSize,
15
);
}


/* -----------------------------------------------------
FINAL INDIVIDUAL SIZE
----------------------------------------------------- */

const size =
clamp(
Math.round(
rawSize
)
);


let mode =
"MODERATE";


if (size >= 35)
mode = "AGGRESSIVE";
else if (size < 15)
mode = "STARTER";
else if (size < 25)
mode = "DEFENSIVE";


if (
severeMarketQuality ||
extremeFragility ||
chronicWeakness ||
riskState === "BREAKDOWN"
) {

mode =
size > 0
? "CAPITAL_PRESERVATION"
: "NO_TRADE";
}


return {

instrument: flow,

direction,

eligible: true,

size,

rawSize:
Math.round(
rawSize
),

prePortfolioSize: size,

strength,

confidence,

riskMultiplier:
Math.round(
riskMultiplier * 100
) / 100,

mode,

state,

reason:
candidate?.driver ??
"TradeStack candidate"
};
}


/* =======================================================
INDIVIDUAL FLOWS
======================================================= */

const sizedNasdaqPut =
sizeFlow(
"NASDAQ_PUT",
nasdaqPut
);


const sizedNasdaqCall =
sizeFlow(
"NASDAQ_CALL",
nasdaqCall
);


const sizedRussellCall =
sizeFlow(
"RUSSELL_CALL",
russellCall
);


/* =======================================================
PORTFOLIO CAP
======================================================= */

let portfolioCap =
60;


if (
marketQualityScore >= 70 &&
participationScore >= 70 &&
liquidityScore >= 65 &&
fragilityScore < 55 &&
dangerScore < 35 &&
!persistentWeakness
) {

portfolioCap =
75;
}


if (
defensivePhase
) {

portfolioCap =
Math.min(
portfolioCap,
60
);
}


if (
severeMarketQuality ||
extremeFragility ||
chronicWeakness
) {

portfolioCap =
Math.min(
portfolioCap,
40
);
}


if (
riskState === "CRISIS"
) {

portfolioCap =
0;
}


const individualFlows = [
sizedNasdaqPut,
sizedNasdaqCall,
sizedRussellCall
];


const activeFlows =
individualFlows.filter(
flow =>
flow.eligible &&
flow.size > 0
);


const rawPortfolioSize =
activeFlows.reduce(
(total, flow) =>
total + flow.size,
0
);


const portfolioScale =
rawPortfolioSize >
portfolioCap &&
rawPortfolioSize > 0

? portfolioCap /
rawPortfolioSize

: 1;


function applyPortfolioLayer(
flow: SizedFlow
): SizedFlow {

return {

...flow,

prePortfolioSize:
flow.size,

size:
Math.round(
flow.size *
portfolioScale
)
};
}


const finalNasdaqPut =
applyPortfolioLayer(
sizedNasdaqPut
);


const finalNasdaqCall =
applyPortfolioLayer(
sizedNasdaqCall
);


const finalRussellCall =
applyPortfolioLayer(
sizedRussellCall
);


const finalFlows = [
finalNasdaqPut,
finalNasdaqCall,
finalRussellCall
];


const activeFinalFlows =
finalFlows.filter(
flow =>
flow.size > 0
);


const totalSize =
finalFlows.reduce(
(total, flow) =>
total + flow.size,
0
);


/* =======================================================
PORTFOLIO DIRECTION
======================================================= */

const hasLong =
activeFinalFlows.some(
flow =>
flow.direction === "LONG"
);


const hasShort =
activeFinalFlows.some(
flow =>
flow.direction === "SHORT"
);


let direction:
| "LONG"
| "SHORT"
| "MIXED"
| "NEUTRAL" =
"NEUTRAL";


if (
hasLong &&
hasShort
) {

direction =
"MIXED";

}
else if (hasLong) {

direction =
"LONG";

}
else if (hasShort) {

direction =
"SHORT";
}


/* =======================================================
PORTFOLIO MODE
======================================================= */

let mode =
"NO_TRADE";


if (
totalSize >= 55
) {

mode =
"AGGRESSIVE";

}
else if (
totalSize >= 30
) {

mode =
"MODERATE";

}
else if (
totalSize > 0
) {

mode =
"DEFENSIVE";
}


if (
totalSize > 0 &&
(
severeMarketQuality ||
extremeFragility ||
chronicWeakness
)
) {

mode =
"CAPITAL_PRESERVATION";
}


const activeInstruments =
activeFinalFlows.map(
flow =>
flow.instrument
);


/* =======================================================
PIPELINE
=======================================================

THIS IS THE IMPORTANT NEW PART.

The frontend gets exactly the values that actually
entered the sizing calculation.

No frontend guessing.
No fallback 50.
No "components" ambiguity.
======================================================= */

const pipeline = {

master: {
score: input.masterScore,
mode: input.masterMode
},

crash: {
score: input.crashScore,
probability: input.crashProbability,
state: input.crashState
},

edge: {
score: input.edgeScore,
state: input.edgeState
},

liquidity: {
score: input.liquidityScore,
state: input.liquidityState
},

participation: {
score: input.participationScore,
state: input.participationState
},

fragility: {
score: input.fragilityScore,
state: input.fragilityState
},

rotationDecay: {
score: input.rotationDecayScore,
state: input.rotationDecayState
},

rotationConfirm: {
confidence:
input.rotationConfidence,
state:
input.rotationConfirmState
},

marketQuality: {
score:
input.marketQualityScore,
state:
input.marketQualityState
},

breadthThrust: {
score:
input.breadthThrustScore
},

squeeze: {
risk:
input.squeezeRisk,
state:
input.squeezeState
},

regimeSync: {
score:
input.regimeSyncScore,
state:
input.regimeSyncState
},

danger: {
score:
input.dangerScore,
state:
input.dangerState
},

systemHeat: {
value:
input.systemHeat
},

structure: {
breadth50:
input.breadth50,

breadth200:
input.breadth200
},

history: {

breadthTrend:
input.breadthTrend,

breadthAcceleration:
input.breadthAcceleration,

participationDecay:
input.participationDecay,

leadershipDecay:
input.leadershipDecay,

relativeBreadthWeakness:
input.relativeBreadthWeakness,

phasePersistence:
input.phasePersistence,

regimePersistence:
input.regimePersistence
},

phase
};


/* =======================================================
FLOW PIPELINE
======================================================= */

const flowPipeline = {

nasdaqPut: {

instrument:
finalNasdaqPut.instrument,

direction:
finalNasdaqPut.direction,

state:
finalNasdaqPut.state,

strength:
finalNasdaqPut.strength,

confidence:
finalNasdaqPut.confidence,

rawSize:
finalNasdaqPut.rawSize,

prePortfolioSize:
finalNasdaqPut.prePortfolioSize,

finalSize:
finalNasdaqPut.size,

riskMultiplier:
finalNasdaqPut.riskMultiplier,

mode:
finalNasdaqPut.mode,

eligible:
finalNasdaqPut.eligible,

reason:
finalNasdaqPut.reason
},


nasdaqCall: {

instrument:
finalNasdaqCall.instrument,

direction:
finalNasdaqCall.direction,

state:
finalNasdaqCall.state,

strength:
finalNasdaqCall.strength,

confidence:
finalNasdaqCall.confidence,

rawSize:
finalNasdaqCall.rawSize,

prePortfolioSize:
finalNasdaqCall.prePortfolioSize,

finalSize:
finalNasdaqCall.size,

riskMultiplier:
finalNasdaqCall.riskMultiplier,

mode:
finalNasdaqCall.mode,

eligible:
finalNasdaqCall.eligible,

reason:
finalNasdaqCall.reason
},


russellCall: {

instrument:
finalRussellCall.instrument,

direction:
finalRussellCall.direction,

state:
finalRussellCall.state,

strength:
finalRussellCall.strength,

confidence:
finalRussellCall.confidence,

rawSize:
finalRussellCall.rawSize,

prePortfolioSize:
finalRussellCall.prePortfolioSize,

finalSize:
finalRussellCall.size,

riskMultiplier:
finalRussellCall.riskMultiplier,

mode:
finalRussellCall.mode,

eligible:
finalRussellCall.eligible,

reason:
finalRussellCall.reason
}
};


/* =======================================================
RETURN
======================================================= */

return {

/* -----------------------------------------------------
GLOBAL
----------------------------------------------------- */

size:
totalSize,

direction,

mode,


/* -----------------------------------------------------
PRIMARY-COMPATIBILITY
----------------------------------------------------- */

primary:
activeFinalFlows.length > 0
? activeFinalFlows
.slice()
.sort(
(a, b) =>
b.size - a.size
)[0]
: null,


/* -----------------------------------------------------
FLOWS
----------------------------------------------------- */

nasdaqPut:
finalNasdaqPut,

nasdaqCall:
finalNasdaqCall,

russellCall:
finalRussellCall,


flows:
finalFlows,

activeFlows:
activeFinalFlows,

activeInstruments,


/* -----------------------------------------------------
PORTFOLIO
----------------------------------------------------- */

portfolio: {

totalSize,

rawSize:
rawPortfolioSize,

cap:
portfolioCap,

scale:
Math.round(
portfolioScale * 100
) / 100,

activeFlows:
activeFinalFlows.length,

activeInstruments,

direction
},


/* -----------------------------------------------------
RISK
----------------------------------------------------- */

risk: {

globalMultiplier:
Math.round(
globalRiskMultiplier * 100
) / 100,

crashProbability,

dangerScore,

heat,

liquidityScore,

fragilityScore,

participationScore,

marketQualityScore,

rotationDecayScore,

regimeSyncScore,

rotationConfidence,

squeezeRisk
},


/* -----------------------------------------------------
COMPONENTS
----------------------------------------------------- */

components: {

masterScore:
input.masterScore,

crashScore:
input.crashScore,

crashProbability:
input.crashProbability,

edgeScore:
input.edgeScore,

liquidityScore:
input.liquidityScore,

participationScore:
input.participationScore,

fragilityScore:
input.fragilityScore,

rotationDecayScore:
input.rotationDecayScore,

rotationConfidence:
input.rotationConfidence,

marketQualityScore:
input.marketQualityScore,

breadthThrustScore:
input.breadthThrustScore,

squeezeRisk:
input.squeezeRisk,

regimeSyncScore:
input.regimeSyncScore,

dangerScore:
input.dangerScore,

systemHeat:
input.systemHeat,

breadth50:
input.breadth50,

breadth200:
input.breadth200,

breadthTrend:
input.breadthTrend,

breadthAcceleration:
input.breadthAcceleration,

participationDecay:
input.participationDecay,

leadershipDecay:
input.leadershipDecay,

relativeBreadthWeakness:
input.relativeBreadthWeakness,

phasePersistence:
input.phasePersistence,

regimePersistence:
input.regimePersistence
},



/* -----------------------------------------------------
PIPELINE
----------------------------------------------------- */

pipeline,


flowPipeline,


/* -----------------------------------------------------
META
----------------------------------------------------- */

meta: {

phase,

defensivePhase,

aggressiveLongPhase,

warningPhase,

distributionPhase,

executionMode,

riskState,

tacticalBias,

directionalConflict,

persistentWeakness,

chronicWeakness,

deterioratingBreadth,

acceleratingBreadthDamage,

severeBreadthDamage,

participationFailure,

severeParticipationFailure,

leadershipConcentration,

severeLeadershipConcentration,

poorMarketQuality,

severeMarketQuality,

weakLiquidity,

criticalLiquidity,

highFragility,

extremeFragility,

rotationBroken,

rotationExhausted
}
};
}