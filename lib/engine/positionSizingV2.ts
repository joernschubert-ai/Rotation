/*
=============================================================
POSITION SIZING ENGINE V5
=============================================================

PURPOSE

Position sizing does NOT decide market direction.

tradeStackEngine
↓
independent trade candidates
↓
positionSizing
↓
individual flow sizing
↓
portfolio conflict check
↓
portfolio cap
↓
final allocation

THREE INDEPENDENT FLOWS

NASDAQ PUT
NASDAQ CALL
RUSSELL CALL

IMPORTANT PRINCIPLES

- No PRIMARY-flow overwrite
- No hidden fallback to neutral 50
- Missing values remain distinguishable from neutral values
- Individual flow sizing remains independent
- Portfolio layer is applied afterwards
- Defensive PUT flow is not punished like bullish CALL flows
- Portfolio rounding must not exceed portfolio cap

V5 IMPORTANT FIXES

1. Phase object is normalized correctly
2. Structure values support both number and { value }
3. CRISIS no longer globally blocks defensive PUTs
4. CRISIS blocks bullish LONG flows
5. Defensive PUT can survive crisis with reduced sizing
6. PHASE_7_CAPITULATION remains a hard block for new PUTs
7. Defensive structural confirmation actually reaches sizing
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
value: unknown,
fallback = 0
): number {

const n = Number(value);

return Number.isFinite(n)
? n
: fallback;
}

function nullableNum(
value: unknown
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

function hasNumber(
value: number | null
): value is number {

return (
value !== null &&
Number.isFinite(value)
);
}

/*
Supports both:

b50: 44.9

and:

b50: {
value: 44.9
}
*/

function extractNumericValue(
value: any
): number | null {

if (
value !== null &&
typeof value === "object"
) {

if (
"value" in value
) {
return nullableNum(
value.value
);
}
}

return nullableNum(value);
}

/*
Normalize phase.

Supports:

engine.phase = "PHASE_3_DISTRIBUTION"

and:

engine.phase = {
phase: "PHASE_3_DISTRIBUTION"
}
*/

function normalizePhase(
value: any
): string {

if (
typeof value === "string"
) {
return value;
}

if (
value &&
typeof value === "object"
) {

if (
typeof value.phase === "string"
) {
return value.phase;
}

if (
typeof value.state === "string"
) {
return value.state;
}
}

return "UNKNOWN";
}

/* =========================================================
MAIN
========================================================= */

export function positionSizingV2(
engine: any
) {

/* =====================================================
INPUT OBJECTS
===================================================== */

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
engine?.squeeze ??
engine?.squeezeRisk ??
{};

const structure =
engine?.structure ?? {};

const priceMomentum =
engine?.priceMomentum ?? {};

const history =
engine?.historyMetrics ?? {};

/*
IMPORTANT V5 FIX

Snapshot phase is an object.
Normalize it into a string.
*/

const phase =
normalizePhase(
engine?.phase
);

/* =====================================================
EXPLICIT INPUT EXTRACTION
===================================================== */

const input = {

master: {

score:
nullableNum(master?.score),

mode:
master?.mode ??
master?.regime ??
null
},

crash: {

score:
nullableNum(crash?.score),

probability:
nullableNum(
crash?.probability
),

state:
crash?.state ??
crash?.label ??
null
},

edge: {

score:
nullableNum(
edgeState?.score
),

state:
edgeState?.state ??
null
},

liquidity: {

score:
nullableNum(
liquidity?.score
),

state:
liquidity?.state ??
null
},

fragility: {

score:
nullableNum(
fragility?.score
),

state:
fragility?.state ??
null
},

participation: {

score:
nullableNum(
participation?.score
),

state:
participation?.state ??
null
},

rotationDecay: {

score:
nullableNum(
rotationDecay?.score
),

state:
rotationDecay?.state ??
null
},

rotationConfirm: {

confidence:
nullableNum(
rotationConfirm?.confidence
),

state:
rotationConfirm?.state ??
null,

falseBreakRisk:
nullableNum(
rotationConfirm?.falseBreakRisk
)
},

marketQuality: {

score:
nullableNum(
marketQuality?.score
),

state:
marketQuality?.state ??
null
},

breadthThrust: {

score:
nullableNum(
breadthThrust?.strength ??
breadthThrust?.score
)
},

squeeze: {

risk:
nullableNum(
squeeze?.risk ??
squeeze?.score
),

state:
squeeze?.state ??
null
},

regimeSync: {

score:
nullableNum(
regimeSync?.score
),

state:
regimeSync?.state ??
null
},

danger: {

score:
nullableNum(
dangerZone?.score
),

state:
dangerZone?.state ??
dangerZone?.level ??
null
},

systemHeat: {

value:
nullableNum(
systemHeat?.value
)
},

structure: {

breadth50:
extractNumericValue(
structure?.breadth?.b50
),

breadth200:
extractNumericValue(
structure?.breadth?.b200
)
},

history: {

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
}
};

/* =====================================================
SAFE CALCULATION VALUES
===================================================== */

const masterScore =
num(input.master.score);

const crashProbability =
num(input.crash.probability);

const edgeScore =
num(input.edge.score);

const dangerScore =
num(input.danger.score);

const heat =
num(input.systemHeat.value);

const liquidityScore =
num(input.liquidity.score);

const fragilityScore =
num(input.fragility.score);

const participationScore =
num(input.participation.score);

const rotationDecayScore =
num(input.rotationDecay.score);

const rotationConfidence =
num(
input.rotationConfirm.confidence
);

const marketQualityScore =
num(input.marketQuality.score);

const breadthThrustScore =
num(input.breadthThrust.score);

const squeezeRisk =
num(input.squeeze.risk);

const regimeSyncScore =
num(input.regimeSync.score);

const breadth50 =
num(input.structure.breadth50);

const breadth200 =
num(input.structure.breadth200);

const breadthTrend =
num(input.history.breadthTrend);

const breadthAcceleration =
num(
input.history.breadthAcceleration
);

const participationDecay =
num(
input.history.participationDecay
);

const leadershipDecay =
num(
input.history.leadershipDecay
);

const relativeBreadthWeakness =
num(
input.history.relativeBreadthWeakness
);

const phasePersistence =
num(
input.history.phasePersistence
);

const regimePersistence =
num(
input.history.regimePersistence
);

/* =====================================================
EXECUTION CONTEXT
===================================================== */

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

/* =====================================================
STRUCTURAL FLAGS
===================================================== */

const deterioratingBreadth =
hasNumber(
input.history.breadthTrend
) &&
breadthTrend <= -2;

const acceleratingBreadthDamage =
hasNumber(
input.history.breadthAcceleration
) &&
breadthAcceleration <= -1;

const severeBreadthDamage =
hasNumber(
input.history.breadthAcceleration
) &&
breadthAcceleration <= -3;

const participationFailure =
hasNumber(
input.participation.score
) &&
participationScore < 40;

const severeParticipationFailure =
hasNumber(
input.participation.score
) &&
participationScore < 30;

const persistentWeakness =
(
hasNumber(
input.history.relativeBreadthWeakness
) &&
relativeBreadthWeakness > 15
) ||
(
hasNumber(
input.history.regimePersistence
) &&
regimePersistence >= 60
);

const chronicWeakness =
(
hasNumber(
input.history.relativeBreadthWeakness
) &&
relativeBreadthWeakness > 20
) ||
(
hasNumber(
input.history.regimePersistence
) &&
regimePersistence >= 85
);

const leadershipConcentration =
hasNumber(
input.history.leadershipDecay
) &&
leadershipDecay <= -2;

const severeLeadershipConcentration =
hasNumber(
input.history.leadershipDecay
) &&
leadershipDecay <= -5;

const poorMarketQuality =
hasNumber(
input.marketQuality.score
) &&
marketQualityScore < 45;

const severeMarketQuality =
hasNumber(
input.marketQuality.score
) &&
marketQualityScore < 35;

const weakLiquidity =
hasNumber(
input.liquidity.score
) &&
liquidityScore < 40;

const criticalLiquidity =
hasNumber(
input.liquidity.score
) &&
liquidityScore < 25;

const highFragility =
hasNumber(
input.fragility.score
) &&
fragilityScore >= 70;

const extremeFragility =
hasNumber(
input.fragility.score
) &&
fragilityScore >= 85;

const rotationBroken =
hasNumber(
input.rotationDecay.score
) &&
rotationDecayScore >= 75;

const rotationExhausted =
hasNumber(
input.rotationDecay.score
) &&
rotationDecayScore >= 85;

const negativeHeat =
hasNumber(
input.systemHeat.value
) &&
heat <= -0.7;

const severeHeat =
hasNumber(
input.systemHeat.value
) &&
heat <= -1.4;

const highDanger =
hasNumber(
input.danger.score
) &&
dangerScore >= 60;

const extremeDanger =
hasNumber(
input.danger.score
) &&
dangerScore >= 80;

/* =====================================================
PHASE
===================================================== */

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

/* =====================================================
DEFENSIVE STRUCTURAL CONFIRMATION
===================================================== */

const defensiveStructuralConfirmationCount = [

distributionPhase ||
defensivePhase,

crashProbability >= 30,

deterioratingBreadth,

acceleratingBreadthDamage,

participationFailure,

highFragility,

poorMarketQuality,

weakLiquidity,

rotationBroken,

persistentWeakness,

highDanger,

negativeHeat

].filter(Boolean).length;

const defensiveStructuralConfirmed =
defensiveStructuralConfirmationCount >= 3;

const strongDefensiveStructuralConfirmed =
defensiveStructuralConfirmationCount >= 5;

/* =====================================================
GLOBAL RISK MULTIPLIER
===================================================== */

let globalRiskMultiplier = 1;

if (
hasNumber(
input.crash.probability
)
) {

if (crashProbability >= 70)
globalRiskMultiplier *= 0.60;

else if (crashProbability >= 50)
globalRiskMultiplier *= 0.78;

else if (crashProbability >= 35)
globalRiskMultiplier *= 0.92;
}

if (
hasNumber(
input.danger.score
)
) {

if (dangerScore >= 80)
globalRiskMultiplier *= 0.55;

else if (dangerScore >= 60)
globalRiskMultiplier *= 0.75;

else if (dangerScore >= 40)
globalRiskMultiplier *= 0.92;
}

if (criticalLiquidity)
globalRiskMultiplier *= 0.65;

else if (weakLiquidity)
globalRiskMultiplier *= 0.85;

if (extremeFragility)
globalRiskMultiplier *= 0.60;

else if (highFragility)
globalRiskMultiplier *= 0.80;

if (poorMarketQuality)
globalRiskMultiplier *= 0.85;

if (persistentWeakness)
globalRiskMultiplier *= 0.90;

if (chronicWeakness)
globalRiskMultiplier *= 0.82;

if (negativeHeat)
globalRiskMultiplier *= 0.90;

if (severeHeat)
globalRiskMultiplier *= 0.80;

if (riskState === "BREAKDOWN")
globalRiskMultiplier *= 0.75;

/*
CRISIS reduces portfolio aggression.

It does NOT automatically mean
defensive PUT = invalid.
*/

if (riskState === "CRISIS")
globalRiskMultiplier *= 0.60;

if (executionMode === "DEFENSIVE")
globalRiskMultiplier *= 0.85;

if (executionMode === "REDUCE_RISK")
globalRiskMultiplier *= 0.80;

if (executionMode === "WAIT")
globalRiskMultiplier *= 0.85;

globalRiskMultiplier =
clamp(
globalRiskMultiplier * 100,
20,
110
) / 100;

/* =====================================================
BASE SIZE
===================================================== */

const BASE_SIZE = 40;

/* =====================================================
TRADE STACK FLOWS
===================================================== */

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

const tradeStackDirectionalConflict =
tradeStack?.meta?.directionalConflict === true ||
tradeStack?.directionalConflict === true;

/* =====================================================
CONFIDENCE
===================================================== */

function calculateConfidence(
flow: FlowName,
strength: number
) {

let confidence = 50;

confidence +=
(strength - 50) * 0.55;

if (
hasNumber(
input.master.score
)
) {

if (
flow === "NASDAQ_PUT"
) {

confidence +=
(masterScore - 50) *
0.18;

} else {

confidence +=
(50 - masterScore) *
0.10;
}
}

if (
hasNumber(
input.regimeSync.score
)
) {

confidence +=
(regimeSyncScore - 50) *
0.08;
}

if (
hasNumber(
input.rotationConfirm.confidence
) &&
flow === "RUSSELL_CALL"
) {

confidence +=
(rotationConfidence - 50) *
0.12;
}

if (
hasNumber(
input.marketQuality.score
) &&
flow !== "NASDAQ_PUT"
) {

confidence +=
(marketQualityScore - 50) *
0.08;
}

/* ===================================================
NASDAQ PUT
=================================================== */

if (
flow === "NASDAQ_PUT"
) {

if (distributionPhase)
confidence += 6;

if (defensivePhase)
confidence += 12;

if (crashProbability >= 30)
confidence += 5;

if (crashProbability >= 50)
confidence += 5;

if (participationFailure)
confidence += 6;

if (deterioratingBreadth)
confidence += 5;

if (acceleratingBreadthDamage)
confidence += 5;

if (highFragility)
confidence += 5;

if (extremeFragility)
confidence += 3;

if (poorMarketQuality)
confidence += 4;

if (weakLiquidity)
confidence += 4;

if (rotationBroken)
confidence += 4;

if (persistentWeakness)
confidence += 4;

if (
strongDefensiveStructuralConfirmed
) {

confidence += 8;

} else if (
defensiveStructuralConfirmed
) {

confidence += 4;
}

if (squeezeRisk >= 70)
confidence -= 8;

if (squeezeRisk >= 85)
confidence -= 6;

/*
Crisis is not automatically bearish edge.

It increases reversal/squeeze risk,
therefore modest confidence reduction.
*/

if (riskState === "CRISIS")
confidence -= 4;
}

/* ===================================================
NASDAQ CALL
=================================================== */

if (
flow === "NASDAQ_CALL"
) {

if (aggressiveLongPhase)
confidence += 10;

if (warningPhase)
confidence -= 5;

if (distributionPhase)
confidence -= 8;

if (defensivePhase)
confidence -= 18;

if (participationFailure)
confidence -= 10;

if (rotationBroken)
confidence -= 8;

if (highFragility)
confidence -= 8;

if (poorMarketQuality)
confidence -= 6;

if (riskState === "CRISIS")
confidence -= 20;
}

/* ===================================================
RUSSELL CALL
=================================================== */

if (
flow === "RUSSELL_CALL"
) {

if (rotationConfidence >= 75)
confidence += 10;

if (rotationConfidence < 45)
confidence -= 10;

if (rotationBroken)
confidence -= 12;

if (rotationExhausted)
confidence -= 20;

if (defensivePhase)
confidence -= 12;

if (breadthThrustScore >= 70)
confidence += 5;

if (participationFailure)
confidence -= 8;

if (riskState === "CRISIS")
confidence -= 20;
}

return clamp(
Math.round(confidence)
);
}

/* =====================================================
FLOW RISK MULTIPLIER
===================================================== */

function calculateFlowRiskMultiplier(
flow: FlowName
) {

let multiplier =
globalRiskMultiplier;

/* ===================================================
NASDAQ PUT
=================================================== */

if (
flow === "NASDAQ_PUT"
) {

if (distributionPhase)
multiplier *= 1.08;

if (defensivePhase)
multiplier *= 1.22;

if (highFragility)
multiplier *= 1.08;

if (extremeFragility)
multiplier *= 1.05;

if (weakLiquidity)
multiplier *= 1.05;

if (rotationBroken)
multiplier *= 1.08;

if (persistentWeakness)
multiplier *= 1.05;

if (
strongDefensiveStructuralConfirmed
) {

multiplier *= 1.15;

} else if (
defensiveStructuralConfirmed
) {

multiplier *= 1.08;
}

/*
Crisis reduces size,
but does NOT invalidate defensive PUT.
*/

if (riskState === "CRISIS")
multiplier *= 0.80;

/*
Capitulation remains dangerous for NEW PUTs.
*/

if (
phase === "PHASE_7_CAPITULATION"
) {
multiplier *= 0.45;
}

if (squeezeRisk >= 70)
multiplier *= 0.85;

if (squeezeRisk >= 85)
multiplier *= 0.75;

if (
priceMomentum?.bullishImpulse === true
) {
multiplier *= 0.88;
}
}

/* ===================================================
NASDAQ CALL
=================================================== */

if (
flow === "NASDAQ_CALL"
) {

if (defensivePhase)
multiplier *= 0.30;

if (distributionPhase)
multiplier *= 0.60;

if (highFragility)
multiplier *= 0.70;

if (criticalLiquidity)
multiplier *= 0.70;

if (riskState === "CRISIS")
multiplier *= 0.20;

if (
aggressiveLongPhase &&
marketQualityScore >= 65 &&
participationScore >= 65
) {
multiplier *= 1.10;
}
}

/* ===================================================
RUSSELL CALL
=================================================== */

if (
flow === "RUSSELL_CALL"
) {

if (rotationConfidence < 60)
multiplier *= 0.65;

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

if (rotationBroken)
multiplier *= 0.65;

if (rotationExhausted)
multiplier *= 0.35;

if (defensivePhase)
multiplier *= 0.70;

if (riskState === "CRISIS")
multiplier *= 0.20;
}

return clamp(
multiplier,
0.05,
1.30
);
}

/* =====================================================
FLOW EDGE
===================================================== */

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

if (
hasNumber(
input.edge.score
)
) {

if (edgeScore >= 60)
score += 3;

else if (edgeScore >= 40)
score += 1;

else if (edgeScore < 20)
score -= 3;
}

if (
flow === "NASDAQ_PUT"
) {

if (distributionPhase)
score += 3;

if (defensivePhase)
score += 5;

if (crashProbability >= 30)
score += 2;

if (crashProbability >= 50)
score += 2;

if (deterioratingBreadth)
score += 3;

if (participationFailure)
score += 3;

if (acceleratingBreadthDamage)
score += 3;

if (highFragility)
score += 3;

if (poorMarketQuality)
score += 2;

if (weakLiquidity)
score += 2;

if (rotationBroken)
score += 2;

if (persistentWeakness)
score += 2;

if (
strongDefensiveStructuralConfirmed
) {

score += 5;

} else if (
defensiveStructuralConfirmed
) {

score += 3;
}
}

if (
flow === "NASDAQ_CALL"
) {

if (aggressiveLongPhase)
score += 4;

if (
marketQualityScore >= 70 &&
participationScore >= 70
) {
score += 3;
}

if (defensivePhase)
score -= 6;

if (rotationBroken)
score -= 3;
}

if (
flow === "RUSSELL_CALL"
) {

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

/* =====================================================
FALSE BREAK RISK
===================================================== */

function falseBreakRisk() {

const value =
input.rotationConfirm.falseBreakRisk;

return (
value !== null &&
value > 65
);
}

/* =====================================================
DEFENSIVE PUT ELIGIBILITY
===================================================== */

function isDefensivePutEligible(
strength: number,
direction: Direction
) {

if (
direction !== "SHORT"
) {
return false;
}

if (strength >= 60)
return true;

if (
strength >= 45 &&
defensiveStructuralConfirmed
) {
return true;
}

if (
strength >= 35 &&
strongDefensiveStructuralConfirmed &&
(
distributionPhase ||
defensivePhase
)
) {
return true;
}

return false;
}

/* =====================================================
FLOW SIZER
===================================================== */

function sizeFlow(
flow: FlowName,
candidate: any
): SizedFlow {

const strength =
clamp(
num(candidate?.strength)
);

const state =
candidate?.state ??
"NEUTRAL";

const direction =
candidate?.direction ??
"NONE";

/* ===================================================
ELIGIBILITY
=================================================== */

let eligible =
strength >= 20;

if (
direction === "NONE"
) {
eligible = false;
}

/*
Defensive PUT has dedicated eligibility.
*/

if (
flow === "NASDAQ_PUT"
) {

eligible =
isDefensivePutEligible(
strength,
direction
);

} else {

if (
executionMode === "WAIT" &&
strength < 65
) {

eligible = false;
}
}

/*
V5 CRISIS RULE

Crisis blocks bullish LONG flows.

It does NOT automatically block
structurally confirmed defensive PUTs.
*/

if (
riskState === "CRISIS" &&
flow !== "NASDAQ_PUT"
) {

eligible = false;
}

/*
New PUTs are blocked in capitulation.
*/

if (
phase === "PHASE_7_CAPITULATION"
) {

eligible = false;
}

if (!eligible) {

let reason =
"Trade strength below entry threshold";

if (
direction === "NONE"
) {

reason =
"No valid trade direction";
}

if (
flow === "NASDAQ_PUT"
) {

reason =
"Defensive PUT lacks sufficient structural confirmation";
}

if (
flow !== "NASDAQ_PUT" &&
executionMode === "WAIT" &&
strength < 65
) {

reason =
"Execution WAIT with insufficient strength";
}

if (
riskState === "CRISIS" &&
flow !== "NASDAQ_PUT"
) {

reason =
"Crisis regime blocks bullish exposure";
}

if (
phase === "PHASE_7_CAPITULATION"
) {

reason =
"Capitulation regime";
}

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

/* ===================================================
CONFIDENCE
=================================================== */

const confidence =
calculateConfidence(
flow,
strength
);

/* ===================================================
EDGE
=================================================== */

const flowEdge =
calculateFlowEdge(
flow,
strength
);

/* ===================================================
RISK
=================================================== */

const riskMultiplier =
calculateFlowRiskMultiplier(
flow
);

/* ===================================================
RAW SIZE
=================================================== */

let rawSize =
8 +
(
(strength - 20) *
0.62
);

rawSize *=
0.70 +
(
confidence / 100
) * 0.45;

rawSize +=
flowEdge * 1.25;

rawSize *=
riskMultiplier;

/* ===================================================
NASDAQ CALL SAFETY
=================================================== */

if (
flow === "NASDAQ_CALL"
) {

if (participationFailure)
rawSize *= 0.60;

if (poorMarketQuality)
rawSize *= 0.65;

if (severeBreadthDamage)
rawSize *= 0.55;

if (highFragility)
rawSize *= 0.70;
}

/* ===================================================
RUSSELL CALL SAFETY
=================================================== */

if (
flow === "RUSSELL_CALL"
) {

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

if (falseBreakRisk())
rawSize *= 0.60;
}

/* ===================================================
NASDAQ PUT SAFETY
=================================================== */

if (
flow === "NASDAQ_PUT"
) {

const bullishImpulse =
priceMomentum?.bullishImpulse === true;

const ndxPriceScore =
nullableNum(
priceMomentum?.ndx?.score ??
priceMomentum?.score
);

if (
bullishImpulse &&
ndxPriceScore !== null &&
ndxPriceScore >= 70
) {
rawSize *= 0.72;
}

if (
ndxPriceScore !== null &&
ndxPriceScore <= 25
) {
rawSize *= 0.80;
}

if (
defensiveStructuralConfirmed
) {
rawSize *= 1.08;
}

if (
strongDefensiveStructuralConfirmed
) {
rawSize *= 1.10;
}
}

/* ===================================================
MAX FLOW SIZE
=================================================== */

let maxFlowSize =
BASE_SIZE;

if (
strength >= 75 &&
confidence >= 70
) {

maxFlowSize = 40;

} else if (
strength >= 60
) {

maxFlowSize = 32;

} else {

maxFlowSize = 22;
}

/*
Long flow caps.
*/

if (
flow !== "NASDAQ_PUT"
) {

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
}

/*
Defensive PUT structural ceiling.
*/

if (
flow === "NASDAQ_PUT"
) {

if (
defensivePhase &&
strength >= 75 &&
confidence >= 70
) {

maxFlowSize = 45;

} else if (
defensivePhase &&
strength >= 55 &&
confidence >= 60
) {

maxFlowSize = 35;

} else if (
defensiveStructuralConfirmed &&
strength >= 45
) {

maxFlowSize = 25;
}

/*
Crisis keeps PUT defensive.
*/

if (
riskState === "CRISIS"
) {

maxFlowSize =
Math.min(
maxFlowSize,
20
);
}
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

rawSize =
Math.min(
rawSize,
maxFlowSize
);

/* ===================================================
STARTER LOGIC
=================================================== */

const earlyStarterState =
state === "EARLY_DEFENSIVE_SHORT" ||
state === "EARLY_LONG";

if (
earlyStarterState
) {

rawSize =
Math.min(
rawSize,
15
);
}

/*
Defensive PUT starter floor.
*/

if (
flow === "NASDAQ_PUT" &&
defensiveStructuralConfirmed &&
strength >= 45 &&
rawSize > 0
) {

const starterFloor =
strongDefensiveStructuralConfirmed
? 12
: 8;

rawSize =
Math.max(
rawSize,
starterFloor
);
}

/*
Stronger structural PUT.
*/

if (
flow === "NASDAQ_PUT" &&
strongDefensiveStructuralConfirmed &&
strength >= 55
) {

rawSize =
Math.max(
rawSize,
15
);
}

/*
Crisis starter floor.

Important:
confirmed defensive hedge should not
collapse to zero merely because the
execution layer labels the environment CRISIS.
*/

if (
flow === "NASDAQ_PUT" &&
riskState === "CRISIS" &&
strongDefensiveStructuralConfirmed &&
strength >= 45
) {

rawSize =
Math.max(
rawSize,
10
);
}

/* ===================================================
FINAL INDIVIDUAL SIZE
=================================================== */

const size =
clamp(
Math.round(rawSize)
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
flow !== "NASDAQ_PUT" &&
(
severeMarketQuality ||
extremeFragility ||
chronicWeakness ||
riskState === "BREAKDOWN" ||
riskState === "CRISIS"
)
) {

mode =
size > 0
? "CAPITAL_PRESERVATION"
: "NO_TRADE";
}

if (
flow === "NASDAQ_PUT" &&
size > 0 &&
(
defensivePhase ||
distributionPhase
)
) {

if (size < 15)
mode = "DEFENSIVE_STARTER";

else if (size < 25)
mode = "DEFENSIVE_BUILD";
}

return {

instrument: flow,
direction,

eligible: true,

size,

rawSize:
Math.round(rawSize),

prePortfolioSize:
size,

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
candidate?.reason ??
"TradeStack candidate"
};
}

/* =====================================================
INDIVIDUAL FLOWS
===================================================== */

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

/* =====================================================
PORTFOLIO CONFLICT CHECK
===================================================== */

const individualFlows = [
sizedNasdaqPut,
sizedNasdaqCall,
sizedRussellCall
];

const activeBeforePortfolio =
individualFlows.filter(
flow =>
flow.eligible &&
flow.size > 0
);

const hasShortCandidate =
activeBeforePortfolio.some(
flow =>
flow.direction === "SHORT"
);

const hasLongCandidate =
activeBeforePortfolio.some(
flow =>
flow.direction === "LONG"
);

const portfolioDirectionalConflict =
hasShortCandidate &&
hasLongCandidate;

/* =====================================================
PORTFOLIO CAP
===================================================== */

let portfolioCap = 60;

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
distributionPhase
) {

portfolioCap =
Math.min(
portfolioCap,
65
);
}

if (
portfolioDirectionalConflict
) {

portfolioCap =
Math.min(
portfolioCap,
50
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
riskState === "BREAKDOWN"
) {

portfolioCap =
Math.min(
portfolioCap,
50
);
}

/*
V5 IMPORTANT

Crisis does NOT mean portfolioCap = 0.

It means severely restricted exposure.

A defensive hedge must remain possible.
*/

if (
riskState === "CRISIS"
) {

portfolioCap =
Math.min(
portfolioCap,
25
);
}

/* =====================================================
RAW PORTFOLIO SIZE
===================================================== */

const rawPortfolioSize =
activeBeforePortfolio.reduce(
(total, flow) =>
total + flow.size,
0
);

const portfolioScale =
rawPortfolioSize > portfolioCap &&
rawPortfolioSize > 0

? portfolioCap /
rawPortfolioSize

: 1;

/* =====================================================
PORTFOLIO ALLOCATION
===================================================== */

function applyPortfolioLayer(
flow: SizedFlow
): SizedFlow {

if (
!flow.eligible ||
flow.size <= 0
) {

return {
...flow,
prePortfolioSize:
flow.size,
size: 0
};
}

const scaledSize =
flow.size *
portfolioScale;

return {

...flow,

prePortfolioSize:
flow.size,

size:
Math.floor(
scaledSize
)
};
}

let finalNasdaqPut =
applyPortfolioLayer(
sizedNasdaqPut
);

let finalNasdaqCall =
applyPortfolioLayer(
sizedNasdaqCall
);

let finalRussellCall =
applyPortfolioLayer(
sizedRussellCall
);

let finalFlows = [
finalNasdaqPut,
finalNasdaqCall,
finalRussellCall
];

/* =====================================================
LARGEST REMAINDER ALLOCATION
===================================================== */

const currentTotal =
finalFlows.reduce(
(total, flow) =>
total + flow.size,
0
);

let remaining =
Math.max(
0,
Math.floor(
portfolioCap -
currentTotal
)
);

if (
portfolioScale < 1 &&
remaining > 0
) {

const ranked =
individualFlows
.map(
(flow, index) => {

const exact =
flow.size *
portfolioScale;

return {

index,

remainder:
exact -
Math.floor(exact),

eligible:
flow.eligible &&
flow.size > 0
};
}
)
.filter(
item =>
item.eligible
)
.sort(
(a, b) =>
b.remainder -
a.remainder
);

let cursor = 0;

while (
remaining > 0 &&
ranked.length > 0
) {

const item =
ranked[
cursor %
ranked.length
];

const projectedTotal =
finalFlows.reduce(
(total, flow) =>
total + flow.size,
0
);

if (
projectedTotal >=
portfolioCap
) {
break;
}

finalFlows[item.index] = {

...finalFlows[item.index],

size:
finalFlows[item.index]
.size + 1
};

remaining--;

cursor++;
}
}

[
finalNasdaqPut,
finalNasdaqCall,
finalRussellCall
] = finalFlows;

/* =====================================================
FINAL FLOWS
===================================================== */

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

/* =====================================================
PORTFOLIO DIRECTION
===================================================== */

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

if (hasLong && hasShort)
direction = "MIXED";

else if (hasLong)
direction = "LONG";

else if (hasShort)
direction = "SHORT";

/* =====================================================
PORTFOLIO MODE
===================================================== */

let mode =
"NO_TRADE";

if (totalSize >= 55)
mode = "AGGRESSIVE";

else if (totalSize >= 30)
mode = "MODERATE";

else if (totalSize > 0)
mode = "DEFENSIVE";

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

/*
Single defensive PUT.
*/

if (
activeFinalFlows.length === 1 &&
finalNasdaqPut.size > 0
) {

if (
finalNasdaqPut.size < 15
) {

mode =
"DEFENSIVE_STARTER";

} else {

mode =
"DEFENSIVE_PUT_BUILD";
}
}

const activeInstruments =
activeFinalFlows.map(
flow =>
flow.instrument
);

/* =====================================================
PIPELINE
===================================================== */

const pipeline = {

master:
input.master,

crash:
input.crash,

edge:
input.edge,

liquidity:
input.liquidity,

participation:
input.participation,

fragility:
input.fragility,

rotationDecay:
input.rotationDecay,

rotationConfirm:
input.rotationConfirm,

marketQuality:
input.marketQuality,

breadthThrust:
input.breadthThrust,

squeeze:
input.squeeze,

regimeSync:
input.regimeSync,

danger:
input.danger,

systemHeat:
input.systemHeat,

structure:
input.structure,

history:
input.history,

phase,

defensiveStructuralConfirmationCount,

defensiveStructuralConfirmed,

strongDefensiveStructuralConfirmed
};

/* =====================================================
FLOW PIPELINE
===================================================== */

function buildFlowPipeline(
flow: SizedFlow
) {

return {

instrument:
flow.instrument,

direction:
flow.direction,

state:
flow.state,

strength:
flow.strength,

confidence:
flow.confidence,

rawSize:
flow.rawSize,

prePortfolioSize:
flow.prePortfolioSize,

finalSize:
flow.size,

riskMultiplier:
flow.riskMultiplier,

mode:
flow.mode,

eligible:
flow.eligible,

reason:
flow.reason
};
}

const flowPipeline = {

nasdaqPut:
buildFlowPipeline(
finalNasdaqPut
),

nasdaqCall:
buildFlowPipeline(
finalNasdaqCall
),

russellCall:
buildFlowPipeline(
finalRussellCall
)
};

/* =====================================================
RETURN
===================================================== */

return {

/* ===================================================
GLOBAL
=================================================== */

size:
totalSize,

direction,

mode,

/* ===================================================
PRIMARY COMPATIBILITY
=================================================== */

primary:

activeFinalFlows.length > 0

? activeFinalFlows
.slice()
.sort(
(a, b) =>
b.size -
a.size
)[0]

: null,

/* ===================================================
FLOWS
=================================================== */

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

/* ===================================================
PORTFOLIO
=================================================== */

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

direction,

directionalConflict:
portfolioDirectionalConflict,

tradeStackDirectionalConflict
},

/* ===================================================
RISK
=================================================== */

risk: {

globalMultiplier:
Math.round(
globalRiskMultiplier * 100
) / 100,

crashProbability:
input.crash.probability,

dangerScore:
input.danger.score,

heat:
input.systemHeat.value,

liquidityScore:
input.liquidity.score,

fragilityScore:
input.fragility.score,

participationScore:
input.participation.score,

marketQualityScore:
input.marketQuality.score,

rotationDecayScore:
input.rotationDecay.score,

regimeSyncScore:
input.regimeSync.score,

rotationConfidence:
input.rotationConfirm.confidence,

squeezeRisk:
input.squeeze.risk,

defensiveStructuralConfirmationCount,

defensiveStructuralConfirmed,

strongDefensiveStructuralConfirmed
},

/* ===================================================
COMPONENTS
=================================================== */

components: {

masterScore:
input.master.score,

crashScore:
input.crash.score,

crashProbability:
input.crash.probability,

edgeScore:
input.edge.score,

liquidityScore:
input.liquidity.score,

participationScore:
input.participation.score,

fragilityScore:
input.fragility.score,

rotationDecayScore:
input.rotationDecay.score,

rotationConfidence:
input.rotationConfirm.confidence,

marketQualityScore:
input.marketQuality.score,

breadthThrustScore:
input.breadthThrust.score,

squeezeRisk:
input.squeeze.risk,

regimeSyncScore:
input.regimeSync.score,

dangerScore:
input.danger.score,

systemHeat:
input.systemHeat.value,

breadth50:
input.structure.breadth50,

breadth200:
input.structure.breadth200,

breadthTrend:
input.history.breadthTrend,

breadthAcceleration:
input.history.breadthAcceleration,

participationDecay:
input.history.participationDecay,

leadershipDecay:
input.history.leadershipDecay,

relativeBreadthWeakness:
input.history.relativeBreadthWeakness,

phasePersistence:
input.history.phasePersistence,

regimePersistence:
input.history.regimePersistence,

defensiveStructuralConfirmationCount,

defensiveStructuralConfirmed,

strongDefensiveStructuralConfirmed
},

/* ===================================================
PIPELINE
=================================================== */

pipeline,

flowPipeline,

/* ===================================================
META
=================================================== */

meta: {

phase,

defensivePhase,

aggressiveLongPhase,

warningPhase,

distributionPhase,

executionMode,

riskState,

tacticalBias,

tradeStackDirectionalConflict,

portfolioDirectionalConflict,

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

rotationExhausted,

highDanger,

extremeDanger,

defensiveStructuralConfirmationCount,

defensiveStructuralConfirmed,

strongDefensiveStructuralConfirmed,

falseBreakRisk:
falseBreakRisk()
}
};
}