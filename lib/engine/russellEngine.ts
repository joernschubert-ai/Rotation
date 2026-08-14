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

/* =====================================================
ABSOLUTE PERFORMANCE

IMPORTANT:
The old fields

nasdaq5dReturn
russell5dReturn
sp500_5dReturn

are not reliably present in the current snapshot.

Therefore use the real current momentum
data as fallback.

The values are percentage changes,
e.g. +0.79 = +0.79%.
===================================================== */

const nasdaq5dReturn =
Number(
history.nasdaq5dReturn ??
history.ndxMomentum5D ??
priceMomentum?.ndx?.momentum5D ??
priceMomentum?.momentum5D ??
0
);

const russell5dReturn =
Number(
history.russell5dReturn ??
history.rutMomentum5D ??
priceMomentum?.rut?.momentum5D ??
0
);

const sp5005dReturn =
Number(
history.sp500_5dReturn ??
history.sp5005dReturn ??
history.spxMomentum5D ??
priceMomentum?.spx?.momentum5D ??
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
Number(
data.rsSmall ??
rotationMetrics.rsSmall ??
data.rotation?.rsSmall ??
1
);

const rsGrowth =
Number(
data.rsGrowth ??
rotationMetrics.rsGrowth ??
data.rotation?.rsGrowth ??
1
);

/* =====================================================
BREADTH

Current snapshot stores these primarily inside
rotation.metrics.

Support both flattened and nested structure.
===================================================== */

const breadth50Raw =
Number(
data.breadth50 ??
rotationMetrics.breadth50 ??
0
);

const breadth200Raw =
Number(
data.breadth200 ??
rotationMetrics.breadth200 ??
0
);

/*
If breadth is already 0..100 keep it.
If it is 0..1 normalize it.
*/

const breadth50 =
breadth50Raw <= 1
? breadth50Raw * 100
: breadth50Raw;

const breadth200 =
breadth200Raw <= 1
? breadth200Raw * 100
: breadth200Raw;

/* =====================================================
CONCENTRATION
===================================================== */

const concentration =
Number(
data.concentrationScore ??
rotationMetrics.concentrationScore ??
0
);

/* =====================================================
ROTATION DECAY
===================================================== */

const rotationDecayScore =
Number(
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
"HEALTHY_ROTATION";

/* =====================================================
ROTATION CONFIRM
===================================================== */

const rotationConfidence =
Number(
rotationConfirm?.confidence ?? 50
);

const rotationQuality =
Number(
rotationConfirm?.quality ?? 50
);

const falseBreakRisk =
Number(
rotationConfirm?.falseBreakRisk ?? 50
);

const rotationConfirmState =
rotationConfirm?.state ??
"UNKNOWN";

/* =====================================================
PARTICIPATION
===================================================== */

const participationScore =
Number(
participation?.score ??
data.participationScore ??
rotationMetrics.participation ??
data.master?.components?.participation ??
50
);

/* =====================================================
DIVERGENCE
===================================================== */

const divergenceSeverity =
Number(
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
Number(
marketQuality?.score ??
marketQuality?.value ??
data.master?.components?.marketQuality ??
46
);

/* =====================================================
PHASE CONFIRMATION
===================================================== */

const phaseConfirmationScore =
Number(
phaseConfirmation?.score ??
phaseConfirmation?.confidence ??
data.master?.meta?.phaseConfidence ??
50
);

const phaseConfirmationState =
phaseConfirmation?.state ??
"UNKNOWN";

/* =====================================================
PRICE MOMENTUM
===================================================== */

const priceMomentumScore =
Number(
priceMomentum?.score ??
data.master?.components?.priceMomentum ??
50
);

const priceMomentumState =
priceMomentum?.state ??
"UNKNOWN";

const ndxPriceScore =
Number(
priceMomentum?.ndx?.score ??
priceMomentumScore
);

const rutPriceScore =
Number(
priceMomentum?.rut?.score ??
priceMomentumScore
);

const rutMomentum5D =
Number(
priceMomentum?.rut?.momentum5D ??
history.rutMomentum5D ??
0
);

const rutMomentum20D =
Number(
priceMomentum?.rut?.momentum20D ??
history.rutMomentum20D ??
0
);

const rutAcceleration =
Number(
priceMomentum?.rut?.acceleration ??
0
);

/* =====================================================
VIX
===================================================== */

const vix =
Number(
data.vix ??
rotationMetrics.vix ??
data.rotation?.metrics?.vix ??
20
);

/* =====================================================
HISTORY
===================================================== */

const breadthTrend =
Number(
history.breadthTrend ?? 0
);

const breadthAcceleration =
Number(
history.breadthAcceleration ?? 0
);

const participationDecay =
Number(
history.participationDecay ?? 0
);

const leadershipDecay =
Number(
history.leadershipDecay ?? 0
);

const phasePersistence =
Number(
history.phasePersistence ?? 0
);

const relativeBreadthWeakness =
Number(
history.relativeBreadthWeakness ?? 0
);

const regimePersistence =
Number(
history.regimePersistence ??
data.master?.meta?.regimePersistenceHistory ??
0
);

const crashTrend =
Number(
history.crashTrend ?? 0
);

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

const russellRelativeWeakness =
rsSmall < 0.98;

/* =====================================================
RUSSELL ABSOLUTE STATE
===================================================== */

const russellAbsoluteStrength =
russell5dReturn > 1;

const russellAbsoluteWeakness =
russell5dReturn < -1;

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

const leadershipConcentration =
leadershipDecay <= -2;

const risingCrashRisk =
crashTrend >= 3;

const severeRisingCrashRisk =
crashTrend >= 6;

/* =====================================================
STRUCTURE SCORE

Maximum output is normalized to 0..5.

Important:
A Russell setup needs BOTH relative AND absolute
strength. Relative strength alone is not enough.
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

if (russellAbsoluteWeakness) {
structureScore -= 1;
}

if (russell5dReturn < -3) {
structureScore -= 2;
}

if (russell5dReturn < -5) {
structureScore -= 2;
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
structureScore -= 1;
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

if (participationScore < 50) {
structureScore -= 1;
}

if (participationScore < 40) {
structureScore -= 1;
}

/* Rotation confirmation */

if (rotationConfirmed) {
structureScore += 1;
}

if (rotationWeak) {
structureScore -= 1;
}

if (rotationFalseBreak) {
structureScore -= 1;
}

/* Normalize */

structureScore =
Math.max(
0,
Math.min(
structureScore,
5
)
);

/* =====================================================
REGIME SCORE
===================================================== */

if (
data.phase === "PHASE_1_EXPANSION"
) {
regimeScore = 3;
}
else if (
data.phase === "PHASE_2_WARNING"
) {
regimeScore = 2;
}
else if (
data.phase === "PHASE_3_DISTRIBUTION"
) {
regimeScore = 1;
}
else {
regimeScore = 0;
}

/* =====================================================
RISK SCORE
===================================================== */

/* Phase */

if (
data.phase === "PHASE_5_BREAKDOWN"
) {
riskScore -= 2;
}

if (
data.phase === "PHASE_6_ACCELERATION"
) {
riskScore -= 1;
}

/* Crash */

const crashProbability =
Number(
crash?.probability ?? 0
);

if (crashProbability > 70) {
riskScore -= 2;
}

if (crashProbability > 85) {
riskScore -= 3;
}

/* VIX */

if (vix < 20) {
riskScore += 1;
}

if (vix > 25) {
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

if (hiddenDistribution) {
riskScore -= 1;
}

if (participationCollapse) {
riskScore -= 1;
}

/* History */

if (breadthTrend <= -2) {
riskScore -= 1;
}

if (breadthAcceleration <= -1) {
riskScore -= 1;
}

if (participationDecay > 10) {
riskScore -= 1;
}

if (leadershipDecay >= -2) {
riskScore -= 1;
}

if (phasePersistence >= 60) {
riskScore -= 1;
}

if (phasePersistence >= 85) {
riskScore -= 1;
}

if (relativeBreadthWeakness > 10) {
riskScore -= 1;
}

if (relativeBreadthWeakness > 20) {
riskScore -= 1;
}

if (regimePersistence >= 60) {
riskScore -= 1;
}

if (regimePersistence >= 85) {
riskScore -= 1;
}

if (crashTrend >= 3) {
riskScore -= 1;
}

if (crashTrend >= 6) {
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

/* Price momentum */

if (priceMomentumScore < 40) {
riskScore -= 1;
}

if (priceMomentumScore < 30) {
riskScore -= 1;
}

/* Normalize */

riskScore =
Math.max(
-5,
Math.min(
riskScore,
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
RUSSELL LONG GATE

This is intentionally strict.

A Russell CALL requires:

    acceptable phase
    Russell relative strength
    Russell absolute strength
    healthy breadth
    confirmed rotation
    no exhausted rotation
    no distribution
    no participation collapse
    acceptable market quality
    sufficient price momentum
    ===================================================== */

const acceptablePhase =
data.phase !== "PHASE_5_BREAKDOWN" &&
data.phase !== "PHASE_6_ACCELERATION" &&
data.phase !== "PHASE_7_CAPITULATION";

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

priceMomentumScore >= 50;

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

marketQualityScore < 40 ||

phaseConfirmationScore < 30 ||

priceMomentumScore < 30 ||

data.phase === "PHASE_5_BREAKDOWN" ||

data.phase === "PHASE_6_ACCELERATION" ||

data.phase === "PHASE_7_CAPITULATION";

/* =====================================================
ADDITIONAL DISTRIBUTION BLOCK

In PHASE 3 we allow Russell only if the market
actually proves the rotation.

This prevents:

"Distribution + good breadth"
from being interpreted as an automatic Russell CALL.
===================================================== */

const distributionConfirmationRequired =
data.phase === "PHASE_3_DISTRIBUTION" &&
!rotationConfirmed;

/* =====================================================
MARKET STATE
===================================================== */

const marketState = {

absoluteRiskOff,

broadMarketWeakness,

severeMarketBreakdown,

russellRelativeStrength,

russellRelativeWeakness,

russellAbsoluteStrength,

russellAbsoluteWeakness,

russellHealthyBreadth,

russellStrongBreadth,

russellWeakBreadth,

rotationConfirmed,

rotationWeak,

rotationFalseBreak,

rotationHealthy,

rotationDistribution,

rotationExhausted,

russellLongGate,

russellLongBlocked,

distributionConfirmationRequired

};

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

/* Phase 4 requires complete confirmation */

if (
data.phase === "PHASE_4_RISK" &&
!russellLongGate
) {
return "NO_TRADE";
}

/* General gate */

if (!russellLongGate) {
return "NO_TRADE";
}

/* Score */

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

if (rotationExhausted) {
confidence -= 20;
}

confidence =
Math.max(
0,
Math.min(
confidence,
100
)
);
}

/* =====================================================
RETURN
===================================================== */

return {

action: decision,

decision,

score: {
value: totalScore,
max: 10
},

confidence,

state:
decision === "NO_TRADE"
? "BLOCKED"
: "LONG_SETUP",

setup: {

relativeStrength:
russellRelativeStrength,

absoluteStrength:
russellAbsoluteStrength,

healthyBreadth:
russellHealthyBreadth,

rotationConfirmed,

rotationExhausted,

marketQuality:
marketQualityScore,

phase:
data.phase

},

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

sp5005dReturn

},

marketState,

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
value: riskScore + 5,
max: 7
}

},

meta: {

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

breadth50,

breadth200,

vix

}

};

}
