// /lib/engine/russellEngine.ts

export function russellEngine(data: any) {

/* =====================================================
INPUT / SAFE SOURCES
===================================================== */

const history = data.historyMetrics ?? {};
const rotationMetrics = data.rotation?.metrics ?? {};
const priceMomentum = data.priceMomentum ?? {};
const rotationConfirm = data.rotationConfirm ?? {};
const rotationDecay = data.rotationDecay ?? {};
const crash = data.crash ?? {};
const marketQuality = data.marketQuality ?? {};
const participation = data.participation ?? {};
const phaseConfirmation = data.phaseConfirmation ?? {};

const phase =
data.phase ??
data.marketPhase?.phase ??
"UNKNOWN";


/* =====================================================
SAFE NUMBER HELPER
===================================================== */

function num(value: any, fallback = 0) {

const parsed = Number(value);

return Number.isFinite(parsed)
? parsed
: fallback;
}


/* =====================================================
ABSOLUTE PERFORMANCE

Old fields are not always present.

Priority:

1. history
2. priceMomentum index object
3. fallback
===================================================== */

const nasdaq5dReturn =
num(
history.nasdaq5dReturn ??
history.ndxMomentum5D ??
priceMomentum?.ndx?.momentum5D ??
priceMomentum?.momentum5D ??
0
);

const russell5dReturn =
num(
history.russell5dReturn ??
history.rutMomentum5D ??
priceMomentum?.rut?.momentum5D ??
0
);

const sp5005dReturn =
num(
history.sp500_5dReturn ??
history.sp5005dReturn ??
history.spxMomentum5D ??
priceMomentum?.spx?.momentum5D ??
0
);


/* =====================================================
PRICE MOMENTUM – RUSSELL DETAIL
===================================================== */

const rutMomentum5D =
num(
priceMomentum?.rut?.momentum5D ??
history.rutMomentum5D ??
russell5dReturn
);

const rutMomentum20D =
num(
priceMomentum?.rut?.momentum20D ??
history.rutMomentum20D ??
0
);

const rutAcceleration =
num(
priceMomentum?.rut?.acceleration ??
0
);


/* =====================================================
BASE COMPONENTS
===================================================== */

let structureScore = 0;
let regimeScore = 0;
let riskScore = 0;


/* =====================================================
RELATIVE STRENGTH
===================================================== */

const rsSmall =
num(
data.rsSmall ??
rotationMetrics.rsSmall ??
data.rotation?.rsSmall ??
1,
1
);

const rsGrowth =
num(
data.rsGrowth ??
rotationMetrics.rsGrowth ??
data.rotation?.rsGrowth ??
1,
1
);


/* =====================================================
BREADTH

Support both:

- flattened snapshot fields
- rotation.metrics
- 0..1
- 0..100
===================================================== */

const breadth50Raw =
num(
data.breadth50 ??
rotationMetrics.breadth50 ??
0
);

const breadth200Raw =
num(
data.breadth200 ??
rotationMetrics.breadth200 ??
0
);

const breadth50 =
breadth50Raw > 0 && breadth50Raw <= 1
? breadth50Raw * 100
: breadth50Raw;

const breadth200 =
breadth200Raw > 0 && breadth200Raw <= 1
? breadth200Raw * 100
: breadth200Raw;


/* =====================================================
CONCENTRATION
===================================================== */

const concentration =
num(
data.concentrationScore ??
rotationMetrics.concentrationScore ??
data.master?.components?.concentration ??
0
);


/* =====================================================
ROTATION DECAY
===================================================== */

const rotationDecayScore =
num(
rotationDecay?.score ??
data.rotationDecayScore ??
data.master?.meta?.rotationDecayScore ??
rotationConfirm?.rotationDecayScore ??
0
);

const rotationDecayState =
rotationDecay?.state ??
rotationConfirm?.rotationDecayState ??
data.master?.meta?.rotationDecayState ??
"UNKNOWN";


/* =====================================================
ROTATION CONFIRM
===================================================== */

const rotationConfidence =
num(
rotationConfirm?.confidence ??
50,
50
);

const rotationQuality =
num(
rotationConfirm?.quality ??
50,
50
);

const falseBreakRisk =
num(
rotationConfirm?.falseBreakRisk ??
50,
50
);

const rotationConfirmState =
rotationConfirm?.state ??
"UNKNOWN";


/* =====================================================
PARTICIPATION
===================================================== */

const participationScore =
num(
participation?.score ??
data.participationScore ??
rotationMetrics.participation ??
data.master?.components?.participation ??
50,
50
);


/* =====================================================
INTERNAL DIVERGENCE
===================================================== */

const divergenceSeverity =
num(
data.internalDivergence?.severity ??
data.phaseData?.drivers?.divergenceSeverity ??
0
);

const hiddenDistribution =
Boolean(
data.internalDivergence?.hiddenDistribution ??
data.phaseData?.drivers?.hiddenDistribution ??
false
);

const participationCollapse =
Boolean(
data.internalDivergence?.participationCollapse ??
data.phaseData?.drivers?.participationCollapse ??
false
);


/* =====================================================
MARKET QUALITY
===================================================== */

const marketQualityScore =
num(
marketQuality?.score ??
marketQuality?.value ??
data.master?.components?.marketQuality ??
50,
50
);


/* =====================================================
PHASE CONFIRMATION
===================================================== */

const phaseConfirmationScore =
num(
phaseConfirmation?.score ??
phaseConfirmation?.confidence ??
data.master?.meta?.phaseConfidence ??
50,
50
);

const phaseConfirmationState =
phaseConfirmation?.state ??
"UNKNOWN";


/* =====================================================
PRICE MOMENTUM
===================================================== */

const priceMomentumScore =
num(
priceMomentum?.score ??
data.master?.components?.priceMomentum ??
50,
50
);

const priceMomentumState =
priceMomentum?.state ??
"UNKNOWN";

const ndxPriceScore =
num(
priceMomentum?.ndx?.score ??
priceMomentumScore,
priceMomentumScore
);

const rutPriceScore =
num(
priceMomentum?.rut?.score ??
priceMomentumScore,
priceMomentumScore
);


/* =====================================================
VIX
===================================================== */

const vix =
num(
data.vix ??
rotationMetrics.vix ??
data.rotation?.metrics?.vix ??
20,
20
);


/* =====================================================
HISTORY
===================================================== */

const breadthTrend =
num(history.breadthTrend ?? 0);

const breadthAcceleration =
num(history.breadthAcceleration ?? 0);

const participationDecay =
num(history.participationDecay ?? 0);

const leadershipDecay =
num(history.leadershipDecay ?? 0);

const phasePersistence =
num(history.phasePersistence ?? 0);

const relativeBreadthWeakness =
num(history.relativeBreadthWeakness ?? 0);

const regimePersistence =
num(
history.regimePersistence ??
data.master?.meta?.regimePersistenceHistory ??
0
);

const crashTrend =
num(history.crashTrend ?? 0);


/* =====================================================
ABSOLUTE MARKET STATE
===================================================== */

const absoluteRiskOff =
russell5dReturn < -3 &&
nasdaq5dReturn < -5;

const broadMarketWeakness =
russell5dReturn < 0 &&
nasdaq5dReturn < 0 &&
sp5005dReturn < 0;

const severeMarketBreakdown =
russell5dReturn < -5 &&
nasdaq5dReturn < -8;


/* =====================================================
RUSSELL RELATIVE STATE
===================================================== */

const russellRelativeStrength =
rsSmall > 1.02;

const russellRelativeNeutral =
rsSmall >= 0.99 &&
rsSmall <= 1.02;

const russellRelativeWeakness =
rsSmall < 0.98;


/* =====================================================
RUSSELL ABSOLUTE STATE
===================================================== */

const russellAbsoluteStrength =
russell5dReturn > 1;

const russellModerateStrength =
russell5dReturn > 0;

const russellAbsoluteWeakness =
russell5dReturn < -1;

const russellSevereWeakness =
russell5dReturn < -3;


/* =====================================================
RUSSELL MOMENTUM STATE
===================================================== */

const russellMomentumPositive =
rutMomentum5D > 0 &&
rutMomentum20D >= 0;

const russellMomentumStrong =
rutMomentum5D > 1 &&
rutMomentum20D > 1;

const russellMomentumAccelerating =
rutAcceleration > 0;

const russellMomentumWeak =
rutMomentum5D < 0 &&
rutMomentum20D < 0;


/* =====================================================
RUSSELL BREADTH STATE
===================================================== */

const russellHealthyBreadth =
breadth50 >= 60 &&
breadth200 >= 65;

const russellStrongBreadth =
breadth50 >= 65 &&
breadth200 >= 70;

const russellWeakBreadth =
breadth50 < 45 ||
breadth200 < 55;


/* =====================================================
ROTATION STATE
===================================================== */

const rotationConfirmed =
rotationConfidence >= 70 &&
rotationQuality >= 65 &&
falseBreakRisk < 40;

const rotationConstructive =
rotationConfidence >= 60 &&
rotationQuality >= 55 &&
falseBreakRisk < 50;

const rotationWeak =
rotationConfidence < 50 ||
rotationQuality < 50;

const rotationFalseBreak =
falseBreakRisk >= 60;

const rotationHealthy =
rotationDecayScore < 40 &&
rotationDecayState === "HEALTHY_ROTATION";

const rotationDistribution =
rotationDecayState === "DISTRIBUTION_ROTATION";

const rotationExhausted =
rotationDecayScore >= 75 ||
rotationDecayState === "EXHAUSTED_ROTATION";


/* =====================================================
STRUCTURAL RISK FLAGS
===================================================== */

const prolongedDistribution =
phasePersistence >= 60;

const prolongedBearRegime =
regimePersistence >= 60 ||
Boolean(
data.phaseData?.drivers?.prolongedBearRegime
);

const severeBearRegime =
regimePersistence >= 85 ||
Boolean(
data.phaseData?.drivers?.severeBearRegime
);

const broadParticipationFailure =
relativeBreadthWeakness > 10;

const severeParticipationFailure =
relativeBreadthWeakness > 20;

const deterioratingBreadth =
breadthTrend <= -2;

const acceleratingBreadthDecay =
breadthAcceleration <= -1;

const participationErosion =
participationDecay > 10;

const severeParticipationErosion =
participationDecay > 20;

/*
Important correction:

Previous version:

leadershipDecay >= -2

was almost always true.

A positive leadershipDecay should be interpreted
as deterioration only if the history engine uses
positive values for decay.

Based on the existing history semantics:
higher positive = stronger decay.
*/

const leadershipConcentration =
leadershipDecay > 2;

const severeLeadershipConcentration =
leadershipDecay > 5;

const risingCrashRisk =
crashTrend >= 3;

const severeRisingCrashRisk =
crashTrend >= 6;


/* =====================================================
STRUCTURE SCORE
MAX 0..5

A Russell setup requires:

- relative strength
- absolute strength
- constructive breadth
- participation
- rotation confirmation
===================================================== */


/* Relative strength */

if (russellRelativeStrength) {
structureScore += 2;
}
else if (rsSmall > 1.0) {
structureScore += 1;
}
else if (russellRelativeWeakness) {
structureScore -= 2;
}


/* Absolute performance */

if (russellAbsoluteStrength) {
structureScore += 2;
}
else if (russellModerateStrength) {
structureScore += 1;
}

if (russellAbsoluteWeakness) {
structureScore -= 1;
}

if (russellSevereWeakness) {
structureScore -= 2;
}


/* Russell momentum */

if (russellMomentumStrong) {
structureScore += 1;
}

if (russellMomentumAccelerating) {
structureScore += 1;
}

if (russellMomentumWeak) {
structureScore -= 1;
}


/* Growth relationship */

if (rsGrowth > 1.02) {
structureScore += 1;
}
else if (rsGrowth < 0.98) {
structureScore -= 1;
}


/* Breadth */

if (breadth200 >= 70) {
structureScore += 1;
}

if (breadth50 >= 65) {
structureScore += 1;
}

if (russellWeakBreadth) {
structureScore -= 2;
}


/* Concentration */

if (concentration <= 1) {
structureScore += 1;
}
else if (concentration >= 3) {
structureScore -= 1;
}


/* Participation */

if (participationScore >= 70) {
structureScore += 1;
}
else if (participationScore >= 60) {
structureScore += 0.5;
}

if (participationScore < 50) {
structureScore -= 1;
}

if (participationScore < 40) {
structureScore -= 1;
}


/* Rotation confirmation */

if (rotationConfirmed) {
structureScore += 2;
}
else if (rotationConstructive) {
structureScore += 1;
}

if (rotationWeak) {
structureScore -= 1;
}

if (rotationFalseBreak) {
structureScore -= 2;
}


/* Normalize */

structureScore =
Math.max(
0,
Math.min(
Math.round(structureScore),
5
)
);


/* =====================================================
REGIME SCORE
===================================================== */

if (
phase === "PHASE_1_EXPANSION"
) {

regimeScore = 3;

}
else if (
phase === "PHASE_2_WARNING"
) {

regimeScore = 2;

}
else if (
phase === "PHASE_3_DISTRIBUTION"
) {

/*
Russell can theoretically work here,
but only with confirmed rotation.
*/

regimeScore =
rotationConfirmed
? 1
: 0;

}
else {

regimeScore = 0;

}


/* =====================================================
RISK SCORE
RANGE -5 .. +2
===================================================== */


/* Phase */

if (
phase === "PHASE_4_RISK"
) {
riskScore -= 1;
}

if (
phase === "PHASE_5_BREAKDOWN"
) {
riskScore -= 2;
}

if (
phase === "PHASE_6_ACCELERATION"
) {
riskScore -= 3;
}

if (
phase === "PHASE_7_CAPITULATION"
) {
riskScore -= 4;
}


/* Crash */

const crashProbability =
num(
crash?.probability ??
data.master?.components?.crash ??
0
);

if (crashProbability > 50) {
riskScore -= 1;
}

if (crashProbability > 70) {
riskScore -= 2;
}

if (crashProbability > 85) {
riskScore -= 2;
}


/* VIX */

if (vix < 18) {
riskScore += 1;
}
else if (vix < 20) {
riskScore += 0.5;
}

if (vix > 25) {
riskScore -= 1;
}

if (vix > 30) {
riskScore -= 1;
}


/* Absolute market */

if (broadMarketWeakness) {
riskScore -= 1;
}

if (absoluteRiskOff) {
riskScore -= 2;
}

if (severeMarketBreakdown) {
riskScore -= 3;
}


/* Rotation lifecycle */

if (rotationHealthy) {
riskScore += 1;
}

if (rotationDistribution) {
riskScore -= 1;
}

if (rotationExhausted) {
riskScore -= 2;
}


/* Divergence */

if (divergenceSeverity > 40) {
riskScore -= 1;
}

if (divergenceSeverity > 60) {
riskScore -= 1;
}

if (hiddenDistribution) {
riskScore -= 2;
}

if (participationCollapse) {
riskScore -= 2;
}


/* History */

if (deterioratingBreadth) {
riskScore -= 1;
}

if (acceleratingBreadthDecay) {
riskScore -= 1;
}

if (participationErosion) {
riskScore -= 1;
}

if (severeParticipationErosion) {
riskScore -= 1;
}

if (leadershipConcentration) {
riskScore -= 1;
}

if (severeLeadershipConcentration) {
riskScore -= 1;
}

if (prolongedDistribution) {
riskScore -= 1;
}

if (broadParticipationFailure) {
riskScore -= 1;
}

if (severeParticipationFailure) {
riskScore -= 1;
}

if (prolongedBearRegime) {
riskScore -= 1;
}

if (severeBearRegime) {
riskScore -= 1;
}

if (risingCrashRisk) {
riskScore -= 1;
}

if (severeRisingCrashRisk) {
riskScore -= 1;
}


/* Market quality */

if (marketQualityScore < 40) {
riskScore -= 2;
}
else if (marketQualityScore < 55) {
riskScore -= 1;
}


/* Phase confirmation */

if (phaseConfirmationScore < 40) {
riskScore -= 1;
}

if (phaseConfirmationScore < 30) {
riskScore -= 1;
}


/* General momentum */

if (priceMomentumScore < 40) {
riskScore -= 1;
}

if (priceMomentumScore < 30) {
riskScore -= 1;
}


/* Russell momentum */

if (rutPriceScore < 40) {
riskScore -= 1;
}

if (russellMomentumWeak) {
riskScore -= 1;
}


/* Normalize */

riskScore =
Math.max(
-5,
Math.min(
Math.round(riskScore),
2
)
);


/* =====================================================
TOTAL SCORE
===================================================== */

const totalScore =
Math.max(
0,
Math.min(
structureScore +
regimeScore +
riskScore,
10
)
);


/* =====================================================
PHASE STATE
===================================================== */

const acceptablePhase =
phase === "PHASE_1_EXPANSION" ||
phase === "PHASE_2_WARNING" ||
phase === "PHASE_3_DISTRIBUTION" ||
phase === "PHASE_4_RISK";


/* =====================================================
RUSSELL LONG GATE

Strict confirmation gate.

Score alone can NEVER create a trade.

The score measures quality.

The gate determines whether the setup is
actually tradable.
===================================================== */

const russellLongGate =
acceptablePhase &&

russellRelativeStrength &&

russellAbsoluteStrength &&

russellHealthyBreadth &&

rotationConfirmed &&

!rotationExhausted &&

!rotationDistribution &&

!hiddenDistribution &&

!participationCollapse &&

marketQualityScore >= 55 &&

participationScore >= 55 &&

rutPriceScore >= 50 &&

priceMomentumScore >= 50;


/* =====================================================
PHASE 4 SPECIAL GATE

Phase 4 is structurally hostile.

A Russell CALL is only allowed if the Russell
itself proves exceptional leadership.

This is intentionally extremely strict.
===================================================== */

const phase4RussellGate =
phase !== "PHASE_4_RISK" ||

(
russellLongGate &&

russellStrongBreadth &&

russellMomentumPositive &&

rutPriceScore >= 60 &&

marketQualityScore >= 60 &&

participationScore >= 60
);


/* =====================================================
RUSSELL HARD BLOCK
===================================================== */

const russellLongBlocked =
absoluteRiskOff ||

severeMarketBreakdown ||

rotationExhausted ||

rotationFalseBreak ||

rotationDistribution ||

russellWeakBreadth ||

hiddenDistribution ||

participationCollapse ||

severeParticipationFailure ||

marketQualityScore < 40 ||

participationScore < 40 ||

phaseConfirmationScore < 30 ||

priceMomentumScore < 30 ||

rutPriceScore < 30 ||

phase === "PHASE_5_BREAKDOWN" ||

phase === "PHASE_6_ACCELERATION" ||

phase === "PHASE_7_CAPITULATION";


/* =====================================================
DISTRIBUTION CONFIRMATION BLOCK

Phase 3 allows Russell only with genuine rotation.

This prevents:

"Distribution + temporarily good breadth"

from being interpreted as a CALL setup.
===================================================== */

const distributionConfirmationRequired =
phase === "PHASE_3_DISTRIBUTION" &&
!rotationConfirmed;


/* =====================================================
MARKET STATE
===================================================== */

const marketState = {

absoluteRiskOff,

broadMarketWeakness,

severeMarketBreakdown,

russellRelativeStrength,

russellRelativeNeutral,

russellRelativeWeakness,

russellAbsoluteStrength,

russellModerateStrength,

russellAbsoluteWeakness,

russellSevereWeakness,

russellMomentumPositive,

russellMomentumStrong,

russellMomentumAccelerating,

russellMomentumWeak,

russellHealthyBreadth,

russellStrongBreadth,

russellWeakBreadth,

rotationConfirmed,

rotationConstructive,

rotationWeak,

rotationFalseBreak,

rotationHealthy,

rotationDistribution,

rotationExhausted,

prolongedDistribution,

prolongedBearRegime,

severeBearRegime,

broadParticipationFailure,

severeParticipationFailure,

participationErosion,

severeParticipationErosion,

leadershipConcentration,

severeLeadershipConcentration,

risingCrashRisk,

severeRisingCrashRisk,

russellLongGate,

phase4RussellGate,

russellLongBlocked,

distributionConfirmationRequired

};


/* =====================================================
BLOCK REASONS

Important for dashboard transparency.
===================================================== */

const blockReasons: string[] = [];

if (absoluteRiskOff) {
blockReasons.push("ABSOLUTE_RISK_OFF");
}

if (severeMarketBreakdown) {
blockReasons.push("SEVERE_MARKET_BREAKDOWN");
}

if (rotationExhausted) {
blockReasons.push("ROTATION_EXHAUSTED");
}

if (rotationDistribution) {
blockReasons.push("ROTATION_DISTRIBUTION");
}

if (rotationFalseBreak) {
blockReasons.push("FALSE_BREAK_RISK");
}

if (russellWeakBreadth) {
blockReasons.push("WEAK_BREADTH");
}

if (hiddenDistribution) {
blockReasons.push("HIDDEN_DISTRIBUTION");
}

if (participationCollapse) {
blockReasons.push("PARTICIPATION_COLLAPSE");
}

if (marketQualityScore < 40) {
blockReasons.push("LOW_MARKET_QUALITY");
}

if (participationScore < 40) {
blockReasons.push("LOW_PARTICIPATION");
}

if (rutPriceScore < 30) {
blockReasons.push("WEAK_RUSSELL_MOMENTUM");
}

if (
phase === "PHASE_5_BREAKDOWN" ||
phase === "PHASE_6_ACCELERATION" ||
phase === "PHASE_7_CAPITULATION"
) {
blockReasons.push("HOSTILE_MARKET_PHASE");
}

if (distributionConfirmationRequired) {
blockReasons.push("UNCONFIRMED_DISTRIBUTION_ROTATION");
}

if (
phase === "PHASE_4_RISK" &&
!phase4RussellGate
) {
blockReasons.push("PHASE_4_NOT_EXCEPTIONAL_ENOUGH");
}


/* =====================================================
DECISION
===================================================== */

function getRussellDecision() {

/* Hard block */

if (russellLongBlocked) {
return "NO_TRADE";
}


/* Distribution requires confirmation */

if (distributionConfirmationRequired) {
return "NO_TRADE";
}


/* General long gate */

if (!russellLongGate) {
return "NO_TRADE";
}


/* Phase 4 requires exceptional leadership */

if (!phase4RussellGate) {
return "NO_TRADE";
}


/* Score classification */

if (totalScore >= 8) {
return "AGGRESSIVE";
}

if (totalScore >= 6) {
return "ADD";
}

if (totalScore >= 4) {
return "BUILD";
}

if (totalScore >= 2) {
return "EARLY";
}

return "NO_TRADE";

}


const decision =
getRussellDecision();


/* =====================================================
CONFIDENCE
===================================================== */

let confidence = 0;


if (
decision === "NO_TRADE"
) {

/*
Confidence here means setup confidence,
not confidence that the block is correct.
*/

confidence =
Math.min(
totalScore * 5,
40
);

}
else {

confidence =
totalScore * 10;


if (rotationConfirmed) {
confidence += 5;
}

if (russellStrongBreadth) {
confidence += 5;
}

if (marketQualityScore >= 70) {
confidence += 5;
}

if (participationScore >= 70) {
confidence += 5;
}

if (russellMomentumStrong) {
confidence += 5;
}

if (russellMomentumAccelerating) {
confidence += 3;
}


/*
Phase 4 penalty.

Even exceptional Russell leadership
in a risk regime deserves less confidence.
*/

if (
phase === "PHASE_4_RISK"
) {
confidence -= 10;
}


confidence =
Math.max(
0,
Math.min(
Math.round(confidence),
100
)
);

}


/* =====================================================
EXECUTION MODEL

This is useful for the RussellPanel and Trade Engine.

The action remains the strategic signal.

execution gives sizing.
===================================================== */

let execution = "NONE";
let executionMode = "NONE";
let sizing = "0%";


if (decision === "EARLY") {

execution = "SMALL STARTER";
executionMode = "PROBE";
sizing = "25%";

}
else if (decision === "BUILD") {

execution = "BUILD POSITION";
executionMode = "SCALE_IN";
sizing = "50%";

}
else if (decision === "ADD") {

execution = "ADD POSITION";
executionMode = "CONFIRMED_ROTATION";
sizing = "75%";

}
else if (decision === "AGGRESSIVE") {

execution = "FULL LONG";
executionMode = "STRONG_ROTATION";
sizing = "100%";

}


/* =====================================================
SUMMARY
===================================================== */

let summary = "No structural Russell long edge";


if (decision === "AGGRESSIVE") {

summary =
"Strong Russell leadership with confirmed rotation and broad market support";

}
else if (decision === "ADD") {

summary =
"Confirmed Russell rotation – constructive conditions for increasing exposure";

}
else if (decision === "BUILD") {

summary =
"Russell long structure is active – build exposure selectively";

}
else if (decision === "EARLY") {

summary =
"Early Russell leadership – use only small starter exposure";

}
else if (blockReasons.length > 0) {

summary =
`Russell long blocked: ${blockReasons.join(", ")}`;

}


/* =====================================================
RETURN
===================================================== */

return {

action: decision,

decision,


/* =================================================
SCORE
================================================= */

score: {
value: totalScore,
max: 10
},


confidence,


state:
decision === "NO_TRADE"
? "BLOCKED"
: "LONG_SETUP",


/* =================================================
EXECUTION
================================================= */

execution,

executionMode,

sizing,


/* =================================================
SUMMARY
================================================= */

summary,


/* =================================================
BLOCK REASONS
================================================= */

blockReasons,


/* =================================================
SETUP
================================================= */

setup: {

relativeStrength:
russellRelativeStrength,

absoluteStrength:
russellAbsoluteStrength,

healthyBreadth:
russellHealthyBreadth,

strongBreadth:
russellStrongBreadth,

momentumPositive:
russellMomentumPositive,

momentumStrong:
russellMomentumStrong,

momentumAccelerating:
russellMomentumAccelerating,

rotationConfirmed,

rotationConstructive,

rotationExhausted,

marketQuality:
marketQualityScore,

participation:
participationScore,

phase

},


/* =================================================
HISTORY
================================================= */

history: {

breadthTrend,

breadthAcceleration,

participationDecay,

leadershipDecay,

relativeBreadthWeakness,

phasePersistence,

regimePersistence,

crashTrend,

nasdaq5dReturn,

russell5dReturn,

sp5005dReturn,

rutMomentum5D,

rutMomentum20D,

rutAcceleration

},


/* =================================================
MARKET STATE
================================================= */

marketState,


/* =================================================
COMPONENTS
================================================= */

components: {

structure: {
value: structureScore,
max: 5
},

regime: {
value: regimeScore,
max: 3
},

risk: {
/*
Display normalized positive value.

Internal range:
-5 .. +2

Display:
0 .. 7
*/

value: riskScore + 5,
max: 7
}

},


/* =================================================
META
================================================= */

meta: {

phase,

rotationConfirmState,

rotationConfidence,

rotationQuality,

falseBreakRisk,

rotationDecayScore,

rotationDecayState,

participationScore,

marketQualityScore,

phaseConfirmationScore,

phaseConfirmationState,

priceMomentumScore,

priceMomentumState,

ndxPriceScore,

rutPriceScore,

rutMomentum5D,

rutMomentum20D,

rutAcceleration,

breadth50,

breadth200,

rsSmall,

rsGrowth,

concentration,

crashProbability,

vix

}

};

}
