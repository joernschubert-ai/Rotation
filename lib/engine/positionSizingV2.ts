// /lib/engine/positionSizingV2.ts

/*
=============================================================
POSITION SIZING V2
=============================================================

ARCHITECTURE

tradeStackEngine
↓
three independent trade flows
↓
┌─────────────────┬─────────────────┬─────────────────┐
│ NASDAQ PUT │ NASDAQ CALL │ RUSSELL CALL │
│ independent │ independent │ independent │
└─────────────────┴─────────────────┴─────────────────┘
↓
individual sizing
↓
portfolio layer
↓
final allocation

IMPORTANT:

- No PRIMARY FLOW reduction.
- No flow overwrites another flow.
- Each instrument gets its own size.
- Multiple valid flows may exist simultaneously.
- Portfolio cap is applied only AFTER individual sizing.
- Position sizing does NOT make the directional decision.
tradeStackEngine already does that.
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

type FlowState = {
instrument: FlowName;
direction: Direction;
state?: string;
strength?: number;
driver?: string;
};

type SizedFlow = {
instrument: FlowName;
direction: Direction;
eligible: boolean;
size: number;
rawSize: number;
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

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(
min,
Math.min(max, value)
);
}


function num(
value: any,
fallback = 0
) {
const n = Number(value);
return Number.isFinite(n)
? n
: fallback;
}


function bool(
value: any
) {
return value === true;
}


/* =========================================================
MAIN
========================================================= */

export function positionSizingV2(
engine: any
) {

/* =======================================================
INPUT
======================================================= */

const master =
engine.master ?? {};

const crash =
engine.crash ?? {};

const tradeStack =
engine.tradeStack ?? {};

const edgeState =
engine.edgeState ?? {};

const executionState =
engine.executionState ?? {};

const regimeSync =
engine.regimeSync ?? {};

const dangerZone =
engine.dangerZone ?? {};

const systemHeat =
engine.systemHeat ?? {};

const liquidity =
engine.liquidity ?? {};

const fragility =
engine.fragility ?? {};

const participation =
engine.participation ?? {};

const rotationDecay =
engine.rotationDecay ?? {};

const rotationConfirm =
engine.rotationConfirm ?? {};

const marketQuality =
engine.marketQuality ?? {};

const breadthThrust =
engine.breadthThrust ?? {};

const squeeze =
engine.squeeze ?? {};

const structure =
engine.structure ?? {};

const phase =
engine.phase ??
"PHASE_3_DISTRIBUTION";

const history =
engine.historyMetrics ?? {};


/* =======================================================
GLOBAL VALUES
======================================================= */

const crashProbability =
num(
crash?.probability,
0
);

const masterScore =
num(
master?.score,
50
);

const edgeScore =
num(
edgeState?.score,
0
);

const dangerScore =
num(
dangerZone?.score,
0
);

const heat =
num(
systemHeat?.value,
0
);

const liquidityScore =
num(
liquidity?.score,
50
);

const fragilityScore =
num(
fragility?.score,
50
);

const participationScore =
num(
participation?.score,
50
);

const rotationDecayScore =
num(
rotationDecay?.score,
0
);

const rotationConfidence =
num(
rotationConfirm?.confidence,
50
);

const marketQualityScore =
num(
marketQuality?.score,
50
);

const breadthThrustScore =
num(
breadthThrust?.strength ??
breadthThrust?.score,
0
);

const squeezeRisk =
num(
squeeze?.risk,
0
);

const regimeSyncScore =
num(
regimeSync?.score,
50
);

const executionMode =
executionState?.executionMode ??
"WAIT";

const riskState =
executionState?.riskState ??
"FRAGILE";

const tacticalBias =
executionState?.tacticalBias ??
"NEUTRAL";


/* =======================================================
STRUCTURE
======================================================= */

const breadth50 =
num(
structure?.breadth?.b50?.value,
50
);

const breadth200 =
num(
structure?.breadth?.b200?.value,
50
);

const breadthTrend =
num(
history?.breadthTrend,
0
);

const breadthAcceleration =
num(
history?.breadthAcceleration,
0
);

const participationDecay =
num(
history?.participationDecay,
0
);

const leadershipDecay =
num(
history?.leadershipDecay,
0
);

const phasePersistence =
num(
history?.phasePersistence,
0
);

const relativeBreadthWeakness =
num(
history?.relativeBreadthWeakness,
0
);

const regimePersistence =
num(
history?.regimePersistence,
0
);


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
PHASE CLASSIFICATION
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
=======================================================

This multiplier does NOT decide direction.

It only determines how much capital can be committed
to a valid trade.
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


if (
riskState === "BREAKDOWN"
) {
globalRiskMultiplier *= 0.60;
}

if (
riskState === "CRISIS"
) {
globalRiskMultiplier *= 0.35;
}


if (
executionMode === "DEFENSIVE"
) {
globalRiskMultiplier *= 0.60;
}

if (
executionMode === "REDUCE_RISK"
) {
globalRiskMultiplier *= 0.75;
}

if (
executionMode === "WAIT"
) {
globalRiskMultiplier *= 0.75;
}


globalRiskMultiplier =
clamp(
globalRiskMultiplier * 100,
20,
100
) / 100;


/* =======================================================
BASE SIZE
=======================================================

40 = normal maximum starting allocation
before flow-specific adjustments.
======================================================= */

const BASE_SIZE = 40;


/* =======================================================
FLOW EXTRACTION
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
DIRECTIONAL CONFLICT
=======================================================

tradeStackEngine already determines this.

When conflict exists, we do NOT select a winner.

Both directional flows are disabled.

This is deliberately different from PRIMARY selection.
======================================================= */

const directionalConflict =
tradeStack?.meta?.directionalConflict === true ||
tradeStack?.directionalConflict === true;


/* =======================================================
FLOW CONFIDENCE
======================================================= */

function calculateConfidence(
flow: FlowName,
strength: number
) {

let confidence = 50;

/*
TradeStack strength is the dominant input.
*/

confidence +=
(strength - 50) * 0.55;


/*
Master confirmation.
*/

confidence +=
(masterScore - 50) * 0.10;


/*
Regime synchronization.
*/

confidence +=
(regimeSyncScore - 50) * 0.10;


/*
Rotation confirmation.
*/

confidence +=
(rotationConfidence - 50) * 0.08;


/*
Market quality.
*/

confidence +=
(marketQualityScore - 50) * 0.08;


/*
Flow-specific adjustments.
*/

if (
flow === "NASDAQ_PUT"
) {

if (
defensivePhase
) {
confidence += 8;
}

if (
crashProbability >= 30
) {
confidence += 5;
}

if (
participationFailure
) {
confidence += 5;
}

if (
acceleratingBreadthDamage
) {
confidence += 4;
}
}


if (
flow === "NASDAQ_CALL"
) {

if (
aggressiveLongPhase
) {
confidence += 8;
}

if (
warningPhase
) {
confidence -= 5;
}

if (
defensivePhase
) {
confidence -= 12;
}

if (
participationFailure
) {
confidence -= 8;
}

if (
rotationBroken
) {
confidence -= 8;
}
}


if (
flow === "RUSSELL_CALL"
) {

/*
Russell needs actual rotation confirmation.
*/

confidence +=
rotationConfidence >= 75
? 8
: rotationConfidence < 45
? -8
: 0;

if (
rotationBroken
) {
confidence -= 12;
}

if (
rotationExhausted
) {
confidence -= 18;
}

if (
defensivePhase
) {
confidence -= 10;
}
}


return clamp(
Math.round(confidence)
);
}


/* =======================================================
FLOW RISK MULTIPLIER
======================================================= */

function calculateFlowRiskMultiplier(
flow: FlowName
) {

let multiplier =
globalRiskMultiplier;


/*
NASDAQ PUT
*/

if (
flow === "NASDAQ_PUT"
) {

/*
Defensive phase supports the PUT.
*/

if (
defensivePhase
) {
multiplier *= 1.10;
}

/*
Capitulation is not an automatic
invitation to increase short size.
*/

if (
phase === "PHASE_7_CAPITULATION"
) {
multiplier *= 0.55;
}

/*
Extreme squeeze/reversal risk.
*/

if (
squeezeRisk >= 70
) {
multiplier *= 0.75;
}
}


/*
NASDAQ CALL
*/

if (
flow === "NASDAQ_CALL"
) {

if (
defensivePhase
) {
multiplier *= 0.35;
}

if (
distributionPhase
) {
multiplier *= 0.65;
}

if (
aggressiveLongPhase &&
marketQualityScore >= 65 &&
participationScore >= 65
) {
multiplier *= 1.10;
}
}


/*
RUSSELL CALL
*/

if (
flow === "RUSSELL_CALL"
) {

/*
Russell is a rotation trade.
Without confirmation, size is reduced.
*/

if (
rotationConfidence < 60
) {
multiplier *= 0.65;
}

if (
rotationConfidence >= 80 &&
!rotationBroken
) {
multiplier *= 1.10;
}

if (
breadthThrustScore >= 70 &&
participationScore >= 60
) {
multiplier *= 1.10;
}

if (
rotationExhausted
) {
multiplier *= 0.40;
}
}


return clamp(
multiplier,
0.10,
1.15
);
}


/* =======================================================
FLOW-SPECIFIC EDGE
======================================================= */

function calculateFlowEdge(
flow: FlowName,
strength: number
) {

let score = 0;


/*
TradeStack strength.
*/

if (
strength >= 75
) {
score += 8;
}
else if (
strength >= 60
) {
score += 5;
}
else if (
strength >= 40
) {
score += 2;
}
else {
score -= 4;
}


/*
Global edge.
*/

score +=
edgeScore >= 60
? 3
: edgeScore >= 40
? 1
: edgeScore < 20
? -3
: 0;


/*
Flow-specific edge.
*/

if (
flow === "NASDAQ_PUT"
) {

if (
defensivePhase
) {
score += 3;
}

if (
crashProbability >= 35
) {
score += 2;
}

if (
deterioratingBreadth
) {
score += 2;
}

if (
participationFailure
) {
score += 2;
}

if (
acceleratingBreadthDamage
) {
score += 2;
}
}


if (
flow === "NASDAQ_CALL"
) {

if (
aggressiveLongPhase
) {
score += 3;
}

if (
marketQualityScore >= 70 &&
participationScore >= 70
) {
score += 3;
}

if (
defensivePhase
) {
score -= 5;
}

if (
rotationBroken
) {
score -= 3;
}
}


if (
flow === "RUSSELL_CALL"
) {

if (
rotationConfidence >= 75
) {
score += 4;
}

if (
rotationConfidence < 50
) {
score -= 4;
}

if (
breadthThrustScore >= 70
) {
score += 3;
}

if (
rotationBroken
) {
score -= 5;
}
}


return score;
}


/* =======================================================
FLOW SIZER
======================================================= */

function sizeFlow(
flow: FlowName,
candidate: FlowState
): SizedFlow {

const strength =
clamp(
num(
candidate?.strength,
0
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

/*
Position sizing never activates a flow
that TradeStack did not activate.
*/

let eligible =
strength >= 20;


/*
Conflict disables the competing
directional flows.

We deliberately don't select a winner.
*/

if (
directionalConflict &&
(
flow === "NASDAQ_CALL" ||
flow === "RUSSELL_CALL"
)
) {
eligible = false;
}

if (
directionalConflict &&
flow === "NASDAQ_PUT"
) {
eligible = false;
}


/*
WAIT means no new position.
*/

if (
executionMode === "WAIT"
) {
/*
EARLY / BUILD signals can still receive
a very small starter allocation.
*/

if (
strength < 60
) {
eligible = false;
}
}


/*
Crisis is not a new-entry environment.
*/

if (
riskState === "CRISIS"
) {
eligible = false;
}


/*
Capitulation is not a normal new-entry
sizing environment.
*/

if (
phase === "PHASE_7_CAPITULATION"
) {
eligible = false;
}


if (!eligible) {

return {
instrument: flow,
direction,
eligible: false,
size: 0,
rawSize: 0,
strength,
confidence: 0,
riskMultiplier: 0,
mode: "NO_TRADE",
state,
reason:
directionalConflict
? "Directional conflict"
: riskState === "CRISIS"
? "Crisis regime"
: phase === "PHASE_7_CAPITULATION"
? "Capitulation regime"
: executionMode === "WAIT"
? "Execution state WAIT"
: "Trade strength below entry threshold"
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
FLOW EDGE
----------------------------------------------------- */

const flowEdge =
calculateFlowEdge(
flow,
strength
);


/* -----------------------------------------------------
RISK MULTIPLIER
----------------------------------------------------- */

const riskMultiplier =
calculateFlowRiskMultiplier(
flow
);


/* -----------------------------------------------------
BASE STRENGTH
----------------------------------------------------- */

/*
Convert TradeStack strength into
an initial allocation.

20 strength → very small
40 strength → moderate
60 strength → stronger
80+ strength → aggressive candidate
*/

let rawSize =
8 +
((strength - 20) * 0.62);


/*
Confidence.
*/

rawSize *=
0.70 +
(confidence / 100) * 0.45;


/*
Edge.
*/

rawSize +=
flowEdge * 1.25;


/*
Global risk.
*/

rawSize *=
riskMultiplier;


/* -----------------------------------------------------
FLOW-SPECIFIC SAFETY
----------------------------------------------------- */

if (
flow === "NASDAQ_CALL"
) {

if (
participationFailure
) {
rawSize *= 0.60;
}

if (
poorMarketQuality
) {
rawSize *= 0.65;
}

if (
severeBreadthDamage
) {
rawSize *= 0.55;
}
}


if (
flow === "RUSSELL_CALL"
) {

/*
Russell must have rotation confirmation.
*/

if (
rotationConfidence < 55
) {
rawSize *= 0.55;
}

if (
rotationDecayScore >= 70
) {
rawSize *= 0.50;
}

if (
falseBreakRisk()
) {
rawSize *= 0.60;
}
}


if (
flow === "NASDAQ_PUT"
) {

/*
Strong bullish impulse should reduce
short sizing even when structure is weak.
*/

const bullishImpulse =
engine.priceMomentum?.bullishImpulse === true;

const ndxPriceScore =
num(
engine.priceMomentum?.ndx?.score ??
engine.priceMomentum?.score,
50
);

if (
bullishImpulse &&
ndxPriceScore >= 70
) {
rawSize *= 0.65;
}

/*
Very low price momentum means the
downside move may already be extended.
*/

if (
ndxPriceScore <= 25
) {
rawSize *= 0.75;
}
}


/* -----------------------------------------------------
STRUCTURAL CAPS
----------------------------------------------------- */

let maxFlowSize =
BASE_SIZE;


/*
Normal individual maximum.
*/

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


/*
Fragile structure.
*/

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


/*
Persistent deterioration.
*/

if (
chronicWeakness
) {
maxFlowSize =
Math.min(
maxFlowSize,
22
);
}


/*
Long flows are additionally capped
during defensive regimes.
*/

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


/*
Russell requires confirmed rotation
for larger allocations.
*/

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


/*
PUT can be larger during confirmed
structural risk, but never unlimited.
*/

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

/*
EARLY / BUILDING signals receive
smaller initial allocations.

The engine should not turn an EARLY
signal into a full position.
*/

if (
state === "EARLY_DEFENSIVE_SHORT" ||
state === "EARLY_LONG"
) {
rawSize =
Math.min(
rawSize,
15
);
}


if (
state === "SHORT_BUILDING" ||
state === "LONG_BUILDING"
) {
rawSize =
Math.min(
rawSize,
maxFlowSize
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

if (
size >= 35
) {
mode = "AGGRESSIVE";
}
else if (
size < 15
) {
mode = "STARTER";
}
else if (
size < 25
) {
mode = "DEFENSIVE";
}


/*
Capital preservation overrides
the descriptive mode.
*/

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
FALSE BREAK RISK
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
THREE INDEPENDENT SIZES
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
PORTFOLIO LAYER
=======================================================

ONLY HERE do we allow the three flows
to interact.

Individual sizing above remains untouched.

Example:

PUT 35
CALL 20
RUSSELL 25

raw total = 80

portfolio cap = 60

final:

PUT 26
CALL 15
RUSSELL 19

Relative proportions remain intact.
======================================================= */

const activeFlows =
[
sizedNasdaqPut,
sizedNasdaqCall,
sizedRussellCall
].filter(
flow =>
flow.eligible &&
flow.size > 0
);


/*
Portfolio cap.

We deliberately keep this below 100.
The remaining capital stays available
for later confirmation / averaging / reversal.
*/

let portfolioCap = 60;


/*
Very healthy regime allows somewhat
greater aggregate exposure.
*/

if (
marketQualityScore >= 70 &&
participationScore >= 70 &&
liquidityScore >= 65 &&
fragilityScore < 55 &&
dangerScore < 35 &&
!persistentWeakness
) {
portfolioCap = 75;
}


/*
Defensive regimes reduce total portfolio
exposure even when individual PUT sizing
is strong.
*/

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
portfolioCap = 0;
}


const rawPortfolioSize =
activeFlows.reduce(
(
total,
flow
) =>
total + flow.size,
0
);


/*
Scale only if necessary.

This preserves the independent
relative weighting of each flow.
*/

const portfolioScale =
rawPortfolioSize > portfolioCap &&
rawPortfolioSize > 0
? portfolioCap /
rawPortfolioSize
: 1;


function applyPortfolioLayer(
flow: SizedFlow
) {

const finalSize =
Math.round(
flow.size *
portfolioScale
);

return {
...flow,

prePortfolioSize:
flow.size,

size:
finalSize
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


/* =======================================================
FINAL PORTFOLIO STATE
======================================================= */

const finalFlows = [
finalNasdaqPut,
finalNasdaqCall,
finalRussellCall
];


const totalSize =
finalFlows.reduce(
(
total,
flow
) =>
total +
flow.size,
0
);


const activeFinalFlows =
finalFlows.filter(
flow =>
flow.size > 0
);


/* =======================================================
DIRECTION
======================================================= */

let direction:
| "LONG"
| "SHORT"
| "MIXED"
| "NEUTRAL" =
"NEUTRAL";


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


if (
hasLong &&
hasShort
) {
direction = "MIXED";
}
else if (
hasLong
) {
direction = "LONG";
}
else if (
hasShort
) {
direction = "SHORT";
}


/* =======================================================
PORTFOLIO MODE
======================================================= */

let mode =
"NO_TRADE";

if (
totalSize >= 55
) {
mode = "AGGRESSIVE";
}
else if (
totalSize >= 30
) {
mode = "MODERATE";
}
else if (
totalSize > 0
) {
mode = "DEFENSIVE";
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


/* =======================================================
FLOW SUMMARY
======================================================= */

const activeInstruments =
activeFinalFlows.map(
flow =>
flow.instrument
);


/* =======================================================
OUTPUT
======================================================= */

return {

/*
---------------------------------------------------------
LEGACY / GLOBAL
---------------------------------------------------------
*/

size:
totalSize,

direction,

mode,


/*
---------------------------------------------------------
THREE INDEPENDENT FLOWS
---------------------------------------------------------
*/

nasdaqPut:
finalNasdaqPut,

nasdaqCall:
finalNasdaqCall,

russellCall:
finalRussellCall,


/*
---------------------------------------------------------
ARRAY
---------------------------------------------------------
*/

flows:
finalFlows,


activeFlows:
activeFinalFlows,


activeInstruments,


/*
---------------------------------------------------------
PORTFOLIO
---------------------------------------------------------
*/

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


/*
---------------------------------------------------------
GLOBAL RISK
---------------------------------------------------------
*/

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

rotationConfidence
},


/*
---------------------------------------------------------
COMPONENTS
---------------------------------------------------------
*/

components: {

masterScore,

edgeScore,

breadth50,

breadth200,

breadthTrend,

breadthAcceleration,

participationDecay,

leadershipDecay,

phasePersistence,

relativeBreadthWeakness,

regimePersistence,

breadthThrustScore,

squeezeRisk
},


/*
---------------------------------------------------------
META
---------------------------------------------------------
*/

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
