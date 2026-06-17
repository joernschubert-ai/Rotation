export function earlyWarningEngine(data: any) {

/* ================= INPUT ================= */

const breadth20 = Number(data.breadth20 ?? 0);
const breadth50 = Number(data.breadth50 ?? 0);
const breadth200 = Number(data.breadth200 ?? 0);

const concentration = Number(data.concentrationScore ?? 0);
const distribution = Number(data.distributionScore ?? 0);
const liquidity = Number(data.marketLiquidityScore ?? 50);

const participation =
Number(
data.participation ??
data.participationScore ??
50
);

const phase = data.phase;

const phasePersistence = Number(
data.historyMetrics?.phasePersistence ?? 0
);

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

/* ================= INTERNAL DIVERGENCE ================= */

const internalDivergence =
data.internalDivergence ?? null;

const divergenceSeverity =
Number(
internalDivergence?.severity ?? 0
);

const divergenceState =
internalDivergence?.state ??
"NONE";

const hiddenDistribution =
internalDivergence?.hiddenDistribution ??
false;

const participationCollapse =
internalDivergence?.participationCollapse ??
false;

const narrowLeadership =
internalDivergence?.narrowLeadership ??
false;

/* ================= COMPONENTS ================= */

let divergenceScore = 0; // max 5
let distributionScore = 0; // max 4
let concentrationScore = 0; // max 3
let liquidityAdj = 0; // max 2
let internalDivergenceScore = 0; // max 3
let participationScore = 0; // max 3

/* ================= 1. BREADTH DIVERGENCE ================= */

if (breadth20 < breadth50 - 0.1) divergenceScore += 2;
if (breadth50 < breadth200 - 0.1) divergenceScore += 2;

if (breadth20 < 40) divergenceScore += 1;
if (breadth50 < 50) divergenceScore += 1;

divergenceScore = Math.min(divergenceScore, 5);

/* ================= 2. DISTRIBUTION ================= */

if (distribution >= 3) distributionScore += 1;
if (distribution >= 5) distributionScore += 1;
if (distribution >= 6) distributionScore += 1;

/* ================= INTERNAL DISTRIBUTION BOOST ================= */

if (hiddenDistribution) {
distributionScore += 1;
}

distributionScore = Math.min(distributionScore, 4);

/* ================= 3. CONCENTRATION ================= */

if (concentration >= 2) concentrationScore += 1;
if (concentration >= 4) concentrationScore += 1;
if (concentration >= 6) concentrationScore += 1;

/* ================= 4. LIQUIDITY ================= */

if (liquidity < 45) liquidityAdj += 1;
if (liquidity < 35) liquidityAdj += 1;

/* ================= 5. PARTICIPATION ================= */

if (participation <= 50) {
participationScore += 1;
}

if (participation <= 45) {
participationScore += 2;
}

participationScore =
Math.min(participationScore, 3);

/* ================= 6. INTERNAL DIVERGENCE ================= */

/*
WICHTIG:
Nur Verstärker.
Nicht Basislogik ersetzen.
*/

if (divergenceSeverity >= 25) {
internalDivergenceScore += 1;
}

if (divergenceSeverity >= 45) {
internalDivergenceScore += 1;
}

if (
participationCollapse &&
narrowLeadership
) {
internalDivergenceScore += 1;
}

internalDivergenceScore =
Math.min(internalDivergenceScore, 3);

/* ================= HISTORY SIGNALS ================= */

let historyScore = 0;

/* ---------- BREADTH TREND ---------- */

if (breadthTrend < -5) historyScore += 1;
if (breadthTrend < -10) historyScore += 1;

/* ---------- ACCELERATION ---------- */

if (breadthAcceleration < -3) historyScore += 1;

/* ---------- PARTICIPATION DECAY ---------- */

if (participationDecay > 10) historyScore += 1;
if (participationDecay > 20) historyScore += 1;

/* ---------- LEADERSHIP DECAY ---------- */

if (leadershipDecay > 10) {
historyScore += 1;
}

if (leadershipDecay > 20) {
historyScore += 1;
}

/* ---------- PHASE PERSISTENCE ---------- */

if (phasePersistence >= 6) historyScore += 1;
if (phasePersistence >= 10) historyScore += 1;

/* clamp */
historyScore = Math.min(historyScore, 3);

/* ================= TOTAL ================= */

let total =
divergenceScore +
distributionScore +
concentrationScore +
liquidityAdj +
participationScore +
internalDivergenceScore +
historyScore;

/* ================= PHASE CONTEXT ================= */

if (
phase === "PHASE_1_EXPANSION" ||
phase === "PHASE_2_WARNING"
) {
total += 1;
}

if (
phase === "PHASE_5_BREAKDOWN" ||
phase === "PHASE_6_ACCELERATION"
) {
total -= 1;
}

/* ================= INTERNAL DIVERGENCE BOOST ================= */

if (
divergenceState ===
"HIDDEN_DISTRIBUTION"
) {
total += 1;
}

/* ================= CLAMP ================= */

total = Math.max(
0,
Math.min(total, 14)
);

/* ================= STATE ================= */

let state = "CLEAN";
let color = "#52c41a";

if (total >= 8) {
state = "HIGH RISK";
color = "#ff4d4f";
}
else if (total >= 6) {
state = "WARNING";
color = "#fa8c16";
}
else if (total >= 3) {
state = "EARLY WARNING";
color = "#fadb14";
}

/* ================= SIGNAL ================= */

const active = total >= 3;

/* ================= RETURN ================= */

return {

active,
state,
color,

score: {
value: total,
max: 14
},

components: {

divergence: {
value: divergenceScore,
max: 5
},

distribution: {
value: distributionScore,
max: 4
},

concentration: {
value: concentrationScore,
max: 3
},

liquidity: {
value: liquidityAdj,
max: 2
},

participation: {
value: participationScore,
max: 3
},

internalDivergence: {
value: internalDivergenceScore,
max: 3
}
},

meta: {

divergenceSeverity,
divergenceState,

hiddenDistribution,
participationCollapse,
narrowLeadership,

participation,

historyScore,

breadthTrend,
breadthAcceleration,

participationDecay,
leadershipDecay,

phasePersistence

}
};
}
