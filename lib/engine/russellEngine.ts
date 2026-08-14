// /lib/engine/russellEngine.ts

export function russellEngine(data: any) {

/* =====================================================
ABSOLUTE PERFORMANCE
===================================================== */

const nasdaq5dReturn =
Number(
data.historyMetrics?.nasdaq5dReturn ?? 0
);

const russell5dReturn =
Number(
data.historyMetrics?.russell5dReturn ?? 0
);

const sp5005dReturn =
Number(
data.historyMetrics?.sp500_5dReturn ?? 0
);

/* =====================================================
BASE COMPONENTS
===================================================== */

let structureScore = 0; // max 5
let regimeScore = 0; // max 3
let riskScore = 0; // internal range -5 ... +2

const rsSmall =
Number(data.rsSmall ?? 1);

const rsGrowth =
Number(data.rsGrowth ?? 1);

/* =====================================================
BREADTH NORMALIZATION
===================================================== */

const breadth50 =
Number(data.breadth50 ?? 0) * 100;

const breadth200 =
Number(data.breadth200 ?? 0) * 100;

const concentration =
Number(data.concentrationScore ?? 0);

/* =====================================================
ROTATION DECAY
===================================================== */

const rotationDecayScore =
Number(
data.rotationDecay?.score ?? 0
);

const rotationDecayState =
data.rotationDecay?.state ??
"HEALTHY_ROTATION";

/* =====================================================
ROTATION CONFIRM
===================================================== */

const rotationConfidence =
Number(
data.rotationConfirm?.confidence ?? 50
);

const rotationQuality =
Number(
data.rotationConfirm?.quality ?? 50
);

const falseBreakRisk =
Number(
data.rotationConfirm?.falseBreakRisk ?? 50
);

const rotationConfirmState =
data.rotationConfirm?.state ??
"UNKNOWN";

/* =====================================================
PARTICIPATION
===================================================== */

const participationScore =
Number(
data.participation?.score ?? 50
);

/* =====================================================
DIVERGENCE
===================================================== */

const divergenceSeverity =
Number(
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
MARKET QUALITY
===================================================== */

const marketQualityScore =
Number(
data.marketQuality?.score ??
data.marketQuality?.value ??
50
);

/* =====================================================
PHASE CONFIRMATION
===================================================== */

const phaseConfirmationScore =
Number(
data.phaseConfirmation?.score ?? 50
);

const phaseConfirmationState =
data.phaseConfirmation?.state ??
"UNKNOWN";

/* =====================================================
PRICE MOMENTUM
===================================================== */

const priceMomentumScore =
Number(
data.priceMomentum?.score ?? 50
);

const priceMomentumState =
data.priceMomentum?.state ??
"UNKNOWN";

/* =====================================================
HISTORY
===================================================== */

const breadthTrend =
Number(
data.historyMetrics?.breadthTrend ?? 0
);

const breadthAcceleration =
Number(
data.historyMetrics?.breadthAcceleration ?? 0
);

const participationDecay =
Number(
data.historyMetrics?.participationDecay ?? 0
);

const leadershipDecay =
Number(
data.historyMetrics?.leadershipDecay ?? 0
);

const phasePersistence =
Number(
data.historyMetrics?.phasePersistence ?? 0
);

const relativeBreadthWeakness =
Number(
data.historyMetrics?.relativeBreadthWeakness ?? 0
);

const regimePersistence =
Number(
data.historyMetrics?.regimePersistence ?? 0
);

const crashTrend =
Number(
data.historyMetrics?.crashTrend ?? 0
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
rotationDecayState ===
"HEALTHY_ROTATION";

const rotationDistribution =
rotationDecayState ===
"DISTRIBUTION_ROTATION";

const rotationExhausted =
rotationDecayScore >= 75 ||
rotationDecayState ===
"EXHAUSTED_ROTATION";

/* =====================================================
STRUCTURE SCORE
===================================================== */

/*
Relative strength
*/

if (russellRelativeStrength) {
structureScore += 2;
}
else if (rsSmall > 1.0) {
structureScore += 1;
}
else if (russellRelativeWeakness) {
structureScore -= 2;
}

/*
Absolute performance
*/

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

/*
Growth
*/

if (rsGrowth > 1.02) {
structureScore += 1;
}
else if (rsGrowth < 0.98) {
structureScore -= 1;
}

/*
Breadth
*/

if (breadth200 >= 70) {
structureScore += 1;
}

if (breadth50 >= 65) {
structureScore += 1;
}

if (russellWeakBreadth) {
structureScore -= 1;
}

/*
Concentration
*/

if (concentration <= 1) {
structureScore += 1;
}
else if (concentration >= 3) {
structureScore -= 1;
}

/*
Participation
*/

if (participationScore >= 70) {
structureScore += 1;
}

if (participationScore < 50) {
structureScore -= 1;
}

if (participationScore < 40) {
structureScore -= 1;
}

/*
Rotation confirmation
*/

if (rotationConfirmed) {
structureScore += 1;
}

if (rotationWeak) {
structureScore -= 1;
}

if (rotationFalseBreak) {
structureScore -= 1;
}

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
data.phase ===
"PHASE_1_EXPANSION"
) {
regimeScore = 3;
}
else if (
data.phase ===
"PHASE_2_WARNING"
) {
regimeScore = 2;
}
else if (
data.phase ===
"PHASE_3_DISTRIBUTION"
) {
regimeScore = 1;
}
else if (
data.phase ===
"PHASE_4_RISK"
) {
/*
Phase 4 is not automatically
a Russell ban.

It requires stronger
confirmation later.
*/
regimeScore = 0;
}
else {
regimeScore = 0;
}

/* =====================================================
RISK SCORE
===================================================== */

/*
Phase risk
*/

if (
data.phase ===
"PHASE_5_BREAKDOWN"
) {
riskScore -= 2;
}

if (
data.phase ===
"PHASE_6_ACCELERATION"
) {
riskScore -= 1;
}

/*
Crash
*/

if (
data.crash?.probability > 70
) {
riskScore -= 2;
}

if (
data.crash?.probability > 85
) {
riskScore -= 3;
}

/*
VIX
*/

if (
Number(data.vix ?? 20) < 20
) {
riskScore += 1;
}

if (
Number(data.vix ?? 20) > 25
) {
riskScore -= 1;
}

/* =====================================================
ABSOLUTE MARKET RISK
===================================================== */

if (broadMarketWeakness) {
riskScore -= 1;
}

if (absoluteRiskOff) {
riskScore -= 2;
}

if (severeMarketBreakdown) {
riskScore -= 3;
}

/* =====================================================
ROTATION LIFECYCLE RISK
===================================================== */

if (rotationHealthy) {
riskScore += 1;
}

if (rotationDistribution) {
riskScore -= 1;
}

if (rotationExhausted) {
riskScore -= 2;
}

/* =====================================================
DIVERGENCE RISK
===================================================== */

if (divergenceSeverity > 40) {
riskScore -= 1;
}

if (hiddenDistribution) {
riskScore -= 1;
}

if (participationCollapse) {
riskScore -= 1;
}

/* =====================================================
HISTORY RISK
===================================================== */

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

/* =====================================================
MARKET QUALITY RISK
===================================================== */

if (marketQualityScore < 40) {
riskScore -= 2;
}
else if (marketQualityScore < 55) {
riskScore -= 1;
}

/* =====================================================
PHASE CONFIRMATION RISK
===================================================== */

if (phaseConfirmationScore < 40) {
riskScore -= 1;
}

if (phaseConfirmationScore < 30) {
riskScore -= 1;
}

/* =====================================================
PRICE MOMENTUM RISK
===================================================== */

if (priceMomentumScore < 40) {
riskScore -= 1;
}

if (priceMomentumScore < 30) {
riskScore -= 1;
}

/*
Clamp internal risk score
*/

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
===================================================== */

/*
This is the central Russell
decision gate.

Russell calls require:

1. acceptable phase
2. relative strength
3. absolute strength
4. healthy breadth
5. confirmed rotation
6. no exhausted rotation
7. no hidden distribution
8. no participation collapse
9. acceptable market quality
*/

const russellLongGate =

data.phase !==
"PHASE_5_BREAKDOWN" &&

data.phase !==
"PHASE_6_ACCELERATION" &&

data.phase !==
"PHASE_7_CAPITULATION" &&

russellRelativeStrength &&

russellAbsoluteStrength &&

russellHealthyBreadth &&

rotationConfirmed &&

!rotationExhausted &&

!hiddenDistribution &&

!participationCollapse &&

marketQualityScore >= 55;

/* =====================================================
RUSSELL HARD BLOCK
===================================================== */

const russellLongBlocked =

absoluteRiskOff ||

severeMarketBreakdown ||

rotationExhausted ||

rotationFalseBreak ||

russellWeakBreadth ||

hiddenDistribution ||

participationCollapse ||

marketQualityScore < 40 ||

phaseConfirmationScore < 30 ||

priceMomentumScore < 30 ||

data.phase ===
"PHASE_5_BREAKDOWN" ||

data.phase ===
"PHASE_6_ACCELERATION" ||

data.phase ===
"PHASE_7_CAPITULATION";

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

russellLongBlocked

};

/* =====================================================
DECISION
===================================================== */

function getRussellDecision() {

/* ===================================================
HARD BLOCK
=================================================== */

if (russellLongBlocked) {
return "NO_TRADE";
}

/* ===================================================
PHASE 4
=================================================== */

/*
Phase 4 is allowed only
with the complete Russell
confirmation stack.
*/

if (
data.phase ===
"PHASE_4_RISK"
) {

if (
!russellLongGate
) {
return "NO_TRADE";
}

}

/* ===================================================
GENERAL GATE
=================================================== */

if (!russellLongGate) {
return "NO_TRADE";
}

/* ===================================================
SCORE
=================================================== */

if (
totalScore >= 8
) {
return "AGGRESSIVE";
}

if (
totalScore >= 6
) {
return "ADD";
}

if (
totalScore >= 4
) {
return "BUILD";
}

if (
totalScore >= 2
) {
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
decision ===
"NO_TRADE"
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

/*
Confirmation bonus
*/

if (
rotationConfirmed
) {
confidence += 5;
}

if (
russellStrongBreadth
) {
confidence += 5;
}

if (
marketQualityScore >= 70
) {
confidence += 5;
}

if (
rotationExhausted
) {
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

action:
decision,

decision,

score: {
value:
totalScore,
max: 10
},

confidence,

/*
Explicit Russell state
for TradeStack / UI
*/

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
value:
structureScore,
max: 5
},

regime: {
value:
regimeScore,
max: 3
},

/*
Keep external
0..7 representation
*/

risk: {
value:
riskScore + 5,
max: 7
}

}

};

}
