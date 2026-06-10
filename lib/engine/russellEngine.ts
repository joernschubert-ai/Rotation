export function russellEngine(data: any) {

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

/* ================= STRUCTURE ================= */

// Small Caps vs Large
if (rsSmall > 1.02) structureScore += 3;
else if (rsSmall > 1.0) structureScore += 1;
else if (rsSmall < 0.98) structureScore -= 2;

// Growth Bias
if (rsGrowth > 1.02) structureScore += 1;
else if (rsGrowth < 0.98) structureScore -= 1;

// Breadth (JETZT KORREKT)
if (breadth200 > 70) structureScore += 2;
if (breadth50 > 60) structureScore += 1;

// Concentration
if (concentration <= 1) structureScore += 2;
else if (concentration >= 3) structureScore -= 1;

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

riskScore = Math.max(-2, Math.min(riskScore, 2));

/* ================= TOTAL ================= */

const totalScore = Math.max(
0,
Math.min(structureScore + regimeScore + riskScore, 10)
);

/* ================= DECISION ================= */

function getRussellDecision() {

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

if (totalScore >= 2 && totalScore < 4) return "EARLY";
if (totalScore >= 4 && totalScore < 6) return "BUILD";
if (totalScore >= 6 && totalScore < 8) return "ADD";
if (totalScore >= 8) return "AGGRESSIVE";

return "NO_TRADE";
}

const decision = getRussellDecision();

/* ================= RETURN ================= */

return {
action: decision,
decision,

score: {
value: totalScore,
max: 10
},

confidence: totalScore * 10,

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
value: riskScore + 2,
max: 4
}
}
};
}
