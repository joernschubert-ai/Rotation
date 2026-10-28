// /lib/engine/nasdaqEngine.ts

export function nasdaqEngine(data: any) {
data = data ?? {};
function finite(value: any, fallback: number): number {
  if (value === null || value === undefined || typeof value === "boolean" || (typeof value === "string" && value.trim() === "")) return fallback;
  if (typeof value === "object") return finite(value.value ?? value.score ?? value.current, fallback);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/* =====================================================
INPUT
===================================================== */

const phase =
typeof data?.phase === "string" ? data.phase : data?.phase?.phase ?? "UNKNOWN";

const crash =
data?.crash ?? {};

const rotation =
data?.rotation ?? {};

const putTiming =
data?.putTiming ?? {};

const earlyWarning =
data?.earlyWarning ?? {};

const historyMetrics =
data?.historyMetrics ?? {};

const phaseData =
data?.phaseData ?? {};

const marketQuality =
data?.marketQuality ?? {};

const participation =
data?.participation ?? {};

const breadthThrust =
data?.breadthThrust ?? {};

const liquidity =
data?.liquidity ?? {};

const regimeSync =
data?.regimeSync ?? {};

const executionState =
data?.executionState ?? {};

const master =
data?.master ?? {};


/* =====================================================
NORMALIZED INPUT
===================================================== */

const crashProbability =
Number(
crash?.probability ??
data?.crashProbability ??
0
);

const crashScore =
Number(
crash?.score ??
data?.crashScore ??
0
);

const rotationScore =
Number(
rotation?.score ?? 50
);

const putScore =
Number(
putTiming?.score?.value ??
putTiming?.score ??
0
);

const earlyScore =
finite(earlyWarning?.score, 0);

const qualityScore =
Number(
marketQuality?.score ??
50
);

const participationScore =
Number(
participation?.score ??
50
);

const breadthThrustScore =
Number(
breadthThrust?.score ??
50
);

const liquidityScore =
Number(
liquidity?.score ??
50
);

const regimeSyncScore =
Number(
regimeSync?.score ??
50
);

const executionScore =
finite(executionState?.score, NaN);

const phaseConfidence =
Number(
master?.meta?.phaseConfidence ??
phaseData?.confidence ??
0
);


/* =====================================================
HISTORY
===================================================== */

const breadthTrend =
Number(
historyMetrics?.breadthTrend ??
0
);

const breadthAcceleration =
Number(
historyMetrics?.breadthAcceleration ??
0
);

const participationDecay =
Number(
historyMetrics?.participationDecay ??
0
);

const leadershipDecay =
Number(
historyMetrics?.leadershipDecay ??
0
);

const phasePersistence =
Number(
historyMetrics?.phasePersistence ??
0
);

const regimePersistence =
Number(
historyMetrics?.regimePersistence ??
0
);

const relativeBreadthWeakness =
Number(
historyMetrics?.relativeBreadthWeakness ??
0
);


/* =====================================================
MARKET FLAGS
===================================================== */

const earlyPhase =
phase === "PHASE_1_EXPANSION" ||
phase === "PHASE_2_WARNING";

const distribution =
phase === "PHASE_3_DISTRIBUTION";

const risk =
phase === "PHASE_4_RISK";

const breakdown =
phase === "PHASE_5_BREAKDOWN";

const acceleration =
phase === "PHASE_6_ACCELERATION";

const capitulation =
phase === "PHASE_7_CAPITULATION";


const deterioratingBreadth =
breadthTrend <= -2;

const acceleratingBreadthDecay =
breadthAcceleration <= -1;

const participationErosion =
participationDecay > 10;

const severeParticipationErosion =
participationDecay > 20;

const leadershipConcentration =
leadershipDecay >= 2;

const prolongedDistribution =
historyMetrics.prolongedDistribution === true;

const prolongedBearRegime =
historyMetrics.prolongedBearRegime === true;

const severeBearRegime =
historyMetrics.severeBearRegime === true;

const broadParticipationFailure =
relativeBreadthWeakness > 10;

const severeParticipationFailure =
relativeBreadthWeakness > 20;


/* =====================================================
CORE LONG ENVIRONMENT

NASDAQ CALL requires a fundamentally
constructive environment.
===================================================== */

let strength = 0;

let driver = "NONE";

let decision = "NONE";

let mode = "OFF";

let execution = "NONE";

let note = "No Nasdaq long opportunity";

let active = false;


/* =====================================================
BASE MARKET ENVIRONMENT
===================================================== */

if (earlyPhase) {

strength += 20;

}


/*
* Expansion is the strongest natural
* environment for a Nasdaq CALL.
*/

if (phase === "PHASE_1_EXPANSION") {

strength += 15;

}


/*
* Warning is still tradable, but
* requires confirmation.
*/

if (phase === "PHASE_2_WARNING") {

strength += 5;

}


/* =====================================================
ROTATION
===================================================== */

if (rotationScore >= 70) {

strength += 18;
driver = "NASDAQ_MOMENTUM";

}

else if (rotationScore >= 55) {

strength += 12;
driver = "NASDAQ_RELATIVE_STRENGTH";

}

else if (rotationScore >= 40) {

strength += 5;

if (driver === "NONE")
driver = "BALANCED_ROTATION";

}

else if (rotationScore < 25) {

strength -= 8;

}


/* =====================================================
CRASH RISK
===================================================== */

if (crashProbability < 20) {

strength += 15;

}

else if (crashProbability < 30) {

strength += 10;

}

else if (crashProbability < 40) {

strength += 4;

}

else if (crashProbability < 55) {

strength -= 10;

}

else {

strength -= 25;

}


/* =====================================================
CRASH SCORE
===================================================== */

if (crashScore < 20) {

strength += 8;

}

else if (crashScore < 40) {

strength += 2;

}

else if (crashScore >= 60) {

strength -= 15;

}


/* =====================================================
PUT PRESSURE

Important:
PUT pressure does not directly create
a CALL signal. It removes confidence.
===================================================== */

if (putScore >= 3 && putScore < 5) {

strength -= 5;

}

else if (putScore >= 5 && putScore < 7) {

strength -= 12;

}

else if (putScore >= 7) {

strength -= 25;

}


/* =====================================================
EARLY WARNING
===================================================== */

if (earlyWarning?.active) {

strength -= 15;

}

if (earlyScore >= 10) {

strength -= 8;

}


/* =====================================================
BREADTH
===================================================== */

if (deterioratingBreadth) {

strength -= 8;

}

if (acceleratingBreadthDecay) {

strength -= 8;

}


/* =====================================================
PARTICIPATION
===================================================== */

if (participationScore >= 70) {

strength += 8;

}

else if (participationScore >= 55) {

strength += 3;

}

else if (participationScore < 40) {

strength -= 10;

}


if (participationErosion) {

strength -= 10;

}

if (severeParticipationErosion) {

strength -= 12;

}


/* =====================================================
BREADTH THRUST
===================================================== */

if (breadthThrustScore >= 70) {

strength += 8;

}

else if (breadthThrustScore >= 55) {

strength += 4;

}

else if (breadthThrustScore < 35) {

strength -= 8;

}


/* =====================================================
MARKET QUALITY
===================================================== */

if (qualityScore >= 75) {

strength += 10;

}

else if (qualityScore >= 60) {

strength += 5;

}

else if (qualityScore < 40) {

strength -= 10;

}


/* =====================================================
LIQUIDITY
===================================================== */

if (liquidityScore >= 70) {

strength += 6;

}

else if (liquidityScore < 35) {

strength -= 10;

}


/* =====================================================
REGIME ALIGNMENT
===================================================== */

if (regimeSyncScore >= 70) {

strength += 6;

}

else if (regimeSyncScore < 40) {

strength -= 10;

}


/* =====================================================
EXECUTION
===================================================== */

if (executionScore >= 70) {

strength += 5;

}

else if (executionScore < 40) {

strength -= 8;

}


/* =====================================================
LEADERSHIP CONCENTRATION

Important:
Nasdaq concentration is not automatically
bullish. Excessive concentration becomes
fragile when breadth deteriorates.
===================================================== */

if (
leadershipConcentration &&
deterioratingBreadth
) {

strength -= 8;

}


/* =====================================================
STRUCTURAL FAILURE
===================================================== */

if (broadParticipationFailure) {

strength -= 10;

}

if (severeParticipationFailure) {

strength -= 12;

}


/* =====================================================
LONG-TERM REGIME DAMAGE
===================================================== */

if (prolongedDistribution) {

strength -= 10;

}

if (prolongedBearRegime) {

strength -= 12;

}

if (severeBearRegime) {

strength -= 15;

}


/* =====================================================
PHASE HARD BLOCKS
===================================================== */

if (distribution) {

strength =
Math.min(
strength,
35
);

}

if (risk) {

strength =
Math.min(
strength,
20
);

}

if (breakdown) {

strength =
Math.min(
strength,
10
);

}

if (acceleration) {

strength = 0;

}

if (capitulation) {

strength = 0;

}


/* =====================================================
PHASE CONFIDENCE
===================================================== */

if (phaseConfidence < 55) {

strength -= 10;

}

else if (phaseConfidence >= 80) {

strength += 5;

}


/* =====================================================
FINAL NORMALIZATION
===================================================== */

strength =
Math.max(
0,
Math.min(
100,
Math.round(strength)
)
);


/* =====================================================
DECISION

These are intentionally different from
strength. Strength = conviction.
Decision = executable classification.
===================================================== */

if (
strength >= 75 &&
(
phase === "PHASE_1_EXPANSION" ||
phase === "PHASE_2_WARNING"
)
) {

decision = "AGGRESSIVE";

}

else if (strength >= 55) {

decision = "ADD";

}

else if (strength >= 40) {

decision = "BUILD";

}

else if (
strength >= 25 &&
earlyPhase
) {

decision = "EARLY";

}

else {

decision = "NONE";

}


/* =====================================================
MODE
===================================================== */

if (decision === "AGGRESSIVE") {

mode = "MOMENTUM_LONG";

execution = "FAST_ENTRY";

note =
"Strong Nasdaq long environment";

active = true;

}

else if (decision === "ADD") {

mode = "TACTICAL_LONG";

execution = "LIGHT_SCALE_IN";

note =
"Constructive Nasdaq environment";

active = true;

}

else if (decision === "BUILD") {

mode = "PULLBACK_LONG";

execution = "SMALL_PROBE";

note =
"Nasdaq long setup developing";

active = true;

}

else if (decision === "EARLY") {

mode = "EARLY_LONG";

execution = "WATCH";

note =
"Early Nasdaq recovery setup";

active = true;

}


/* =====================================================
HARD SAFETY BLOCK
===================================================== */
const blockReasons: string[] = [];
if (!/^PHASE_[1-7]_/.test(String(phase))) blockReasons.push("UNKNOWN_MARKET_PHASE");
if (["CRISIS", "BREAKDOWN", "INTERNAL_BREAKDOWN"].includes(executionState.riskState)) blockReasons.push("LONG_RISK_BLOCK");
if (!["BUILD_POSITION", "ADD_ON_PULLBACKS"].includes(executionState.executionMode)) blockReasons.push("LONG_EXECUTION_NOT_ALLOWED");
const requiredInputs = { crashProbability: crash?.probability ?? data?.crashProbability, crashScore: crash?.score ?? data?.crashScore, rotationScore: rotation?.score, putScore: putTiming?.score, qualityScore: marketQuality?.score, participationScore: participation?.score, liquidityScore: liquidity?.score, breadthThrustScore: breadthThrust?.score, regimeSyncScore: regimeSync?.score };
const missingInputs = Object.entries(requiredInputs).filter(([, value]) => !Number.isFinite(finite(value, NaN))).map(([key]) => key);
if (missingInputs.length) blockReasons.push("MISSING_CORE_INPUTS");

if (
phase === "PHASE_3_DISTRIBUTION" ||
phase === "PHASE_4_RISK" ||
phase === "PHASE_5_BREAKDOWN" ||
phase === "PHASE_6_ACCELERATION" ||
phase === "PHASE_7_CAPITULATION"
) {
blockReasons.push("HOSTILE_MARKET_PHASE");

/*
* A Nasdaq CALL may still receive
* an informational strength score,
* but it cannot become an executable
* long trade in these regimes.
*/

active = false;

decision = "NONE";

mode = "OFF";

execution = "NONE";

note =
"Risk regime – Nasdaq CALL blocked";

}


/* =====================================================
EXTREME CRASH BLOCK
===================================================== */

if (crashProbability >= 55) {
blockReasons.push("CRASH_RISK_LIMIT");

active = false;

decision = "NONE";

mode = "OFF";

execution = "NONE";

note =
"Crash risk too high – Nasdaq CALL blocked";

}


/* =====================================================
EXTREME PUT PRESSURE BLOCK
===================================================== */

if (putScore >= 8) {
blockReasons.push("PUT_PRESSURE_LIMIT");

active = false;

decision = "NONE";

mode = "OFF";

execution = "NONE";

note =
"Put pressure dominant – Nasdaq CALL blocked";

}


/* =====================================================
SIZE MULTIPLIER
===================================================== */
if (blockReasons.length) {
  active = false; decision = "NONE"; mode = "OFF"; execution = "NONE";
  note = `Nasdaq CALL blocked: ${blockReasons.join(", ")}`;
}

let sizeMultiplier = 0;

if (decision === "AGGRESSIVE") {

sizeMultiplier = 0.60;

}

else if (decision === "ADD") {

sizeMultiplier = 0.50;

}

else if (decision === "BUILD") {

sizeMultiplier = 0.30;

}

else if (decision === "EARLY") {

sizeMultiplier = 0.15;

}


/* =====================================================
FINAL SAFETY
===================================================== */

if (!active) {

sizeMultiplier = 0;

}


/* =====================================================
RETURN
===================================================== */

return {

instrument:
"NASDAQ_CALL",

direction:
"LONG",

active,

decision,

mode,

strength,

execution,

note,

sizeMultiplier,

driver,
blockReasons,
dataQuality: { complete: missingInputs.length === 0, missingInputs, priceUsedForEntry: false },

meta: {

phase,

phaseConfidence,

crashProbability,

crashScore,

putScore,

rotationScore,

earlyScore,

qualityScore,

participationScore,

breadthThrustScore,

liquidityScore,

regimeSyncScore,

executionScore: Number.isFinite(executionScore) ? executionScore : null
,
executionMode: executionState.executionMode ?? "UNKNOWN",
riskState: executionState.riskState ?? "UNKNOWN",
putPressureThreshold: 8,
putPressureMaxScore: finite(putTiming.maxScore, 24),
confidenceIsProbability: false

},

history: {

breadthTrend,

breadthAcceleration,

participationDecay,

leadershipDecay,

phasePersistence,

regimePersistence,

relativeBreadthWeakness,

deterioratingBreadth,

acceleratingBreadthDecay,

participationErosion,

severeParticipationErosion,

leadershipConcentration,

prolongedDistribution,

prolongedBearRegime,

severeBearRegime,

broadParticipationFailure,

severeParticipationFailure

}

};

}
