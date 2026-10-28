// /lib/engine/backtestEngine.ts

export interface ReplaySnapshot {
date: string

marketData: any

outputs: {
masterScore?: any
executionState?: any
regimeSync?: any
crash?: any
rotation?: any
liquidity?: any
participation?: any
breadthThrust?: any
rotationConfirm?: any
fragility?: any
}

futureReturns?: {
d5?: number
d10?: number
d20?: number
d60?: number
}
}

export interface BacktestResult {

summary: {

totalSnapshots: number

falseDefensive: number
missedCrashes: number
lateExits: number

/* NEW */
falseStabilityFailures: number
liquidityIllusionFailures: number
passiveFlowFailures: number
phase4Failures: number

opportunityCapture: number
crashCapture: number

edgePersistence: number
}

regimeStats: {

riskOnAccuracy: number
defensiveAccuracy: number
transitionAccuracy: number

phase4Accuracy: number
}

diagnostics: {

overfittingRisk:
| "LOW"
| "MODERATE"
| "HIGH"

robustness:
| "STRONG"
| "MODERATE"
| "WEAK"

consistency:
| "HIGH"
| "MEDIUM"
| "LOW"
}

timeline: Array<{

date: string

regime: string
mode: string

score: number

expectedMove: string
realizedMove: number

falseStability: boolean
liquidityIllusion: boolean
passiveFlowRegime: boolean

result:
| "CORRECT"
| "FALSE_DEFENSIVE"
| "MISSED_CRASH"
| "LATE_EXIT"
| "NOISE"
}>
}

function safeNumber(
value: any,
fallback = 0
) {

const n = Number(value);

return Number.isFinite(n)
? n
: fallback;
}

export function backtestEngine(
snapshots: ReplaySnapshot[]
): BacktestResult {

let falseDefensive = 0;
let missedCrashes = 0;
let lateExits = 0;

/* NEW */
let falseStabilityFailures = 0;
let liquidityIllusionFailures = 0;
let passiveFlowFailures = 0;
let phase4Failures = 0;

let opportunityCapture = 0;
let crashCapture = 0;

let riskOnCorrect = 0;
let riskOffCorrect = 0;
let transitionCorrect = 0;

let riskOnTotal = 0;
let riskOffTotal = 0;
let transitionTotal = 0;

let phase4Correct = 0;
let phase4Total = 0;

const timeline:
BacktestResult["timeline"] = [];

for (const snap of snapshots) {

const master =
snap.outputs?.masterScore ?? {};

const rotation =
snap.outputs?.rotation ?? {};

const liquidity =
snap.outputs?.liquidity ?? {};

const participation =
snap.outputs?.participation ?? {};

const fragility =
snap.outputs?.fragility ?? {};

const score =
safeNumber(master?.score, 50);

const regime =
master?.regime ?? "NEUTRAL";

const mode =
master?.mode ?? "NEUTRAL";

const future20 =
safeNumber(
snap.futureReturns?.d20,
0
);

/* =====================================================
STRUCTURAL STATES
===================================================== */

const rsGrowth =
safeNumber(rotation?.rsGrowth, 1);

const rsEqual =
safeNumber(rotation?.rsEqual, 1);

const rsSmall =
safeNumber(rotation?.rsSmall, 1);

const participationScore =
safeNumber(participation?.score, 50);

const liquidityScore =
safeNumber(liquidity?.score, 50);

const fragilityScore =
safeNumber(fragility?.score, 50);

const falseStability = (

participationScore < 48 &&
fragilityScore > 60 &&

rsGrowth > 1.03 &&
rsEqual < 0.99

);

const liquidityIllusion = (

liquidityScore > 70 &&

participationScore < 45 &&

rsGrowth > 1.04

);

const passiveFlowRegime = (

rsGrowth > 1.05 &&
rsEqual < 0.98 &&
rsSmall < 0.98

);

/* =====================================================
EXPECTED MOVE
===================================================== */

let expectedMove = "SIDEWAYS";

if (
regime === "RISK_ON" ||
mode === "OPPORTUNITY"
) {

expectedMove = "UP";
}

if (
regime === "HIGH_RISK" ||
regime === "CRASH" ||
mode === "RISK"
) {

expectedMove = "DOWN";
}

let result:
| "CORRECT"
| "FALSE_DEFENSIVE"
| "MISSED_CRASH"
| "LATE_EXIT"
| "NOISE";

result = "NOISE";

/* =====================================================
FALSE DEFENSIVE
===================================================== */

if (
expectedMove === "DOWN" &&
future20 > 8
) {

falseDefensive++;

result =
"FALSE_DEFENSIVE";
}

/* =====================================================
MISSED CRASH
===================================================== */

else if (
expectedMove !== "DOWN" &&
future20 < -12
) {

missedCrashes++;

result =
"MISSED_CRASH";
}

/* =====================================================
LATE EXIT
===================================================== */

else if (
expectedMove === "DOWN" &&
future20 < -4 &&
future20 > -10
) {

lateExits++;

result =
"LATE_EXIT";
}

else {

result = "CORRECT";
}

/* =====================================================
NEW VALIDATION
===================================================== */

if (
falseStability &&
expectedMove !== "DOWN"
) {

falseStabilityFailures++;
}

if (
liquidityIllusion &&
expectedMove !== "DOWN"
) {

liquidityIllusionFailures++;
}

if (
passiveFlowRegime &&
expectedMove !== "DOWN"
) {

passiveFlowFailures++;
}

if (
regime === "TRANSITION"
) {

phase4Total++;

if (
expectedMove === "DOWN"
) {

phase4Correct++;
}

else {

phase4Failures++;
}
}

/* =====================================================
ACCURACY
===================================================== */

if (
regime === "RISK_ON"
) {

riskOnTotal++;

if (future20 > 0) {
riskOnCorrect++;
}
}

else if (
regime === "HIGH_RISK" ||
regime === "CRASH"
) {

riskOffTotal++;

if (future20 < 0) {
riskOffCorrect++;
}
}

else {

transitionTotal++;

if (
future20 > -5 &&
future20 < 5
) {

transitionCorrect++;
}
}

/* =====================================================
EDGE CAPTURE
===================================================== */

if (
mode === "OPPORTUNITY" &&
future20 > 10
) {

opportunityCapture++;
}

if (
mode === "RISK" &&
future20 < -10
) {

crashCapture++;
}

timeline.push({

date: snap.date,

regime,
mode,

score,

expectedMove,

realizedMove:
future20,

falseStability,
liquidityIllusion,
passiveFlowRegime,

result
});
}

/* =====================================================
EDGE PERSISTENCE
===================================================== */

const totalErrors =

falseDefensive +
missedCrashes +
lateExits +

falseStabilityFailures +
liquidityIllusionFailures +
passiveFlowFailures +
phase4Failures;

const edgePersistence =
Math.max(
0,
Math.round(
100 -
(
totalErrors /
Math.max(1, snapshots.length)
) * 100
)
);

/* =====================================================
DIAGNOSTICS
===================================================== */

let overfittingRisk:
| "LOW"
| "MODERATE"
| "HIGH";

if (
totalErrors >
snapshots.length * 0.24
) {

overfittingRisk = "HIGH";
}

else if (
totalErrors >
snapshots.length * 0.12
) {

overfittingRisk =
"MODERATE";
}

else {

overfittingRisk = "LOW";
}

let robustness:
| "STRONG"
| "MODERATE"
| "WEAK";

if (
edgePersistence > 84 &&
missedCrashes < 4
) {

robustness = "STRONG";
}

else if (
edgePersistence > 68
) {

robustness = "MODERATE";
}

else {

robustness = "WEAK";
}

let consistency:
| "HIGH"
| "MEDIUM"
| "LOW";

if (

riskOnCorrect > 0 &&
riskOffCorrect > 0 &&
transitionCorrect > 0

) {

consistency = "HIGH";
}

else if (

riskOnCorrect > 0 ||
riskOffCorrect > 0

) {

consistency = "MEDIUM";
}

else {

consistency = "LOW";
}

/* =====================================================
RETURN
===================================================== */

return {

summary: {

totalSnapshots:
snapshots.length,

falseDefensive,
missedCrashes,
lateExits,

falseStabilityFailures,
liquidityIllusionFailures,
passiveFlowFailures,
phase4Failures,

opportunityCapture,
crashCapture,

edgePersistence
},

regimeStats: {

riskOnAccuracy:
Math.round(
(
riskOnCorrect /
Math.max(1, riskOnTotal)
) * 100
),

defensiveAccuracy:
Math.round(
(
riskOffCorrect /
Math.max(1, riskOffTotal)
) * 100
),

transitionAccuracy:
Math.round(
(
transitionCorrect /
Math.max(1, transitionTotal)
) * 100
),

phase4Accuracy:
Math.round(
(
phase4Correct /
Math.max(1, phase4Total)
) * 100
)
},

diagnostics: {
overfittingRisk,
robustness,
consistency
},

timeline
};
}
