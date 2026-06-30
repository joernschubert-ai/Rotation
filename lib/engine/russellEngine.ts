export function russellEngine(data: any) {

/* ================= ABSOLUTE PERFORMANCE ================= */

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

/* ================= COMPONENTS ================= */

let structureScore = 0; // max 5
let regimeScore = 0; // max 3
let riskScore = 0; // max 2

const rsSmall = Number(data.rsSmall ?? 1);
const rsGrowth = Number(data.rsGrowth ?? 1);

/* 🔥 FIX: BREADTH NORMALIZATION */
const breadth50 = Number(data.breadth50 ?? 0) * 100;
const breadth200 = Number(data.breadth200 ?? 0) * 100;

const concentration = Number(data.concentrationScore ?? 0);

/* ================= ROTATION DECAY ================= */

const rotationDecayScore =
Number(
data.rotationDecay?.score ?? 0
);

const rotationDecayState =
data.rotationDecay?.state ??
"HEALTHY_ROTATION";

/* ================= ROTATION CONFIRM ================= */

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

/* ================= PARTICIPATION ================= */

const participationScore =
Number(
data.participation?.score ?? 50
);

/* ================= DIVERGENCES ================= */

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

/* ================= HISTORY ================= */

const breadthTrend =
Number(data.historyMetrics?.breadthTrend ?? 0);

const breadthAcceleration =
Number(data.historyMetrics?.breadthAcceleration ?? 0);

const participationDecay =
Number(data.historyMetrics?.participationDecay ?? 0);

const leadershipDecay =
Number(data.historyMetrics?.leadershipDecay ?? 0);

const phasePersistence =
Number(data.historyMetrics?.phasePersistence ?? 0);

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

/* ================= ABSOLUTE MARKET STATE ================= */

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

/* ================= STRUCTURE ================= */

// Small Caps vs Large
if (rsSmall > 1.02) structureScore += 3;
else if (rsSmall > 1.0) structureScore += 1;
else if (rsSmall < 0.98) structureScore -= 2;

/* ================= ABSOLUTE PERFORMANCE FILTER ================= */

if (
rsSmall > 1 &&
russell5dReturn < 0
) {
structureScore -= 2;
}

if (
rsSmall > 1 &&
russell5dReturn < -3
) {
structureScore -= 3;
}

// Growth Bias
if (rsGrowth > 1.02) structureScore += 1;
else if (rsGrowth < 0.98) structureScore -= 1;

// Breadth (JETZT KORREKT)
if (breadth200 > 70) structureScore += 2;
if (breadth50 > 60) structureScore += 1;

// Concentration
if (concentration <= 1) structureScore += 2;
else if (concentration >= 3) structureScore -= 1;

/* ================= ROTATION QUALITY ================= */

if (rotationConfidence >= 75)
structureScore += 1;

if (rotationQuality >= 75)
structureScore += 1;

if (participationScore < 50)
structureScore -= 1;

if (participationScore < 40)
structureScore -= 1;

if (falseBreakRisk > 70)
structureScore -= 1;

structureScore = Math.max(0, Math.min(structureScore, 5));

/* ================= REGIME ================= */

if (data.phase === "PHASE_1_EXPANSION") regimeScore = 3;
else if (data.phase === "PHASE_2_WARNING") regimeScore = 2;
else if (data.phase === "PHASE_3_DISTRIBUTION") regimeScore = 1;
else regimeScore = 0;

/* ================= RISK ================= */

if (data.phase === "PHASE_5_BREAKDOWN") riskScore -= 2;
if (data.phase === "PHASE_6_ACCELERATION") riskScore -= 1;

if (data.crash?.probability > 70) riskScore -= 2;
if (data.crash?.probability > 85) riskScore -= 3;

if (data.vix < 20) riskScore += 1;
if (data.vix > 25) riskScore -= 1;

/* ================= ABSOLUTE PERFORMANCE RISK ================= */

if (broadMarketWeakness)
riskScore -= 1;

if (absoluteRiskOff)
riskScore -= 2;

if (severeMarketBreakdown)
riskScore -= 3;

/* ================= ROTATION DECAY RISK ================= */

if (rotationDecayScore > 45)
riskScore -= 1;

if (rotationDecayScore > 60)
riskScore -= 1;

if (rotationDecayScore > 75)
riskScore -= 1;

if (
rotationDecayState ===
"DISTRIBUTION_ROTATION"
) {
riskScore -= 1;
}

if (
rotationDecayState ===
"EXHAUSTED_ROTATION"
) {
riskScore -= 2;
}

/* ================= DIVERGENCE RISK ================= */

if (divergenceSeverity > 40)
riskScore -= 1;

if (hiddenDistribution)
riskScore -= 1;

if (participationCollapse)
riskScore -= 1;

/* ================= HISTORY RISK ================= */

if (breadthTrend <= -2)
riskScore -= 1;

if (breadthAcceleration <= -1)
riskScore -= 1;

if (participationDecay > 10)
riskScore -= 1;

if (leadershipDecay >= -2)
riskScore -= 1;

if (phasePersistence >= 60)
riskScore -= 1;

if (phasePersistence >= 85)
riskScore -= 1;

if (relativeBreadthWeakness > 10)
riskScore -= 1;

if (relativeBreadthWeakness > 20)
riskScore -= 1;

if (regimePersistence >= 60)
riskScore -= 1;

if (regimePersistence >= 85)
riskScore -= 1;

if (crashTrend >= 3)
riskScore -= 1;

if (crashTrend >= 6)
riskScore -= 1;

riskScore = Math.max(-5, Math.min(riskScore, 2));

/* ================= TOTAL ================= */

const totalScore = Math.max(
0,
Math.min(structureScore + regimeScore + riskScore, 10)
);

const marketState = {
absoluteRiskOff,
broadMarketWeakness,
severeMarketBreakdown
};

/* ================= DECISION ================= */

function getRussellDecision() {

/* ================= ABSOLUTE MARKET FILTER ================= */

if (absoluteRiskOff) {
return "NO_TRADE";
}

if (severeMarketBreakdown) {
return "NO_TRADE";
}

if (
data.phase === "PHASE_4_RISK" ||
data.phase === "PHASE_5_BREAKDOWN" ||
data.phase === "PHASE_6_ACCELERATION" ||
data.phase === "PHASE_7_CAPITULATION"
) {
return "NO_TRADE";
}

if (data.crash?.probability > 70) {
return "NO_TRADE";
}

if (
rotationDecayScore >= 75 &&
(
hiddenDistribution ||
participationCollapse
)
) {
return "NO_TRADE";
}

if (
phasePersistence >= 85 &&
participationDecay > 15
) {
return "NO_TRADE";
}

if (
regimePersistence >= 85 &&
relativeBreadthWeakness > 20
) {
return "NO_TRADE";
}

if (
crashTrend >= 6 &&
participationDecay > 15
) {
return "NO_TRADE";
}

if (totalScore >= 2 && totalScore < 4) return "EARLY";
if (totalScore >= 4 && totalScore < 6) return "BUILD";
if (totalScore >= 6 && totalScore < 8) return "ADD";
if (totalScore >= 8) return "AGGRESSIVE";

return "NO_TRADE";
}

const decision = getRussellDecision();

const confidence =

decision === "NO_TRADE"
? Math.min(totalScore * 5, 40)
: totalScore * 10;


/* ================= RETURN ================= */

return {
action: decision,
decision,

score: {
value: totalScore,
max: 10
},

confidence,

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
}
};
}
