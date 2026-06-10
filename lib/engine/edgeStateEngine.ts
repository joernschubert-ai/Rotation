// /lib/engine/edgeStateEngine.ts

export function edgeStateEngine(input: any) {

/* =====================================================
SAFE INPUT
===================================================== */

const safeInput = input ?? {};

/* =====================================================
INPUT OBJECTS
===================================================== */

const rotation = safeInput.rotation ?? {};
const russell = safeInput.russell ?? {};
const structure = safeInput.structure ?? {};
const earlyWarning = safeInput.earlyWarning ?? {};
const crash = safeInput.crash ?? {};
const master = safeInput.master ?? {};
const rotationDecay = safeInput.rotationDecay ?? {};
const rotationConfirm = safeInput.rotationConfirm ?? {};
const participation = safeInput.participation ?? {};
const divergence = safeInput.divergence ?? {};
const marketData = safeInput.marketData ?? safeInput.indices ?? {};

const executionState = safeInput.executionState ?? {};
const regimeSync = safeInput.regimeSync ?? {};
const dangerZone = safeInput.dangerZone ?? {};

/* =====================================================
INPUTS
===================================================== */

const rotationScore = Number(rotation?.score ?? 0);
const russellDecision = russell?.decision ?? "NO_TRADE";

const breadth50 = Number(structure?.breadth?.b50?.value ?? 0);
const breadth200 = Number(structure?.breadth?.b200?.value ?? 0);
const ad = Number(structure?.advanceDecline?.value ?? 0);

const early = earlyWarning?.active ?? false;
const crashProb = Number(crash?.probability ?? crash?.score ?? 0);

const masterScore = Number(master?.score ?? 50);
const participationScore = Number(participation?.score ?? 50);

const rotationDecayScore = Number(
rotationDecay?.score ??
rotationConfirm?.rotationDecayScore ??
0
);

const rsGrowth = Number(rotation?.rsGrowth ?? 1);
const rsSmall = Number(rotation?.rsSmall ?? 1);
const rsEqual = Number(rotation?.rsEqual ?? 1);

const vix = Number(marketData?.vix ?? 18);

const liquidityScore = Number(marketData?.liquidityScore ?? 50);

/* =====================================================
REGIME / EXECUTION CONTEXT (CRITICAL FIX)
===================================================== */

const executionMode = executionState?.executionMode ?? "NORMAL";
const riskState = executionState?.riskState ?? "NORMAL";

const regimeState = regimeSync?.state ?? "NEUTRAL";
const regimeAligned = regimeSync?.aligned ?? false;

const dangerLevel = dangerZone?.level ?? "LOW";

/* =====================================================
STRUCTURE HELPERS
===================================================== */

const strongBreadth = breadth50 > 60 && breadth200 > 55;
const adHealthy = ad > -10;

const narrowLeadership =
rsGrowth > 1.03 && rsSmall < 1 && rsEqual < 1;

const weakParticipation = participationScore < 45;
const healthyParticipation = participationScore >= 55;

const dangerousDecay = rotationDecayScore > 65;

/* =====================================================
FRAGILITY CORE
===================================================== */

const fragileInternalStructure =
masterScore < 50 &&
(rotationScore < 35 || weakParticipation || dangerousDecay);

/* =====================================================
BASE SCORE
===================================================== */

let score = 0;

/* ================= ROTATION (REDUCED STACKING) ================= */

if (rotationScore >= 55) score += 14;
else if (rotationScore >= 40) score += 8;

/* ================= BREADTH ================= */

if (breadth50 >= 65) score += 10;
if (breadth200 >= 60) score += 8;

/* ================= PARTICIPATION ================= */

if (participationScore >= 60) score += 10;
else if (participationScore >= 50) score += 5;

/* ================= LIQUIDITY ================= */

if (liquidityScore >= 70) score += 8;
else if (liquidityScore >= 55) score += 5;

/* ================= MARKET HEALTH ================= */

if (adHealthy) score += 5;
if (vix < 20) score += 5;

/* ================= RISK (IMPORTANT BALANCE) ================= */

if (crashProb < 30) score += 6;
else if (crashProb > 45) score -= 10;

if (masterScore >= 60) score += 5;

/* ================= RUSSELL ================= */

if (russellDecision === "BUILD") score += 6;
if (russellDecision === "ADD") score += 8;
if (russellDecision === "AGGRESSIVE") score += 10;

/* ================= SOFT PENALTIES ================= */

if (weakParticipation) score -= 8;
if (narrowLeadership) score -= 6;
if (dangerousDecay) score -= 10;

/* ================= STRUCTURAL FRAILTY ================= */

if (fragileInternalStructure) score -= 12;

/* =====================================================
CRITICAL REGIME BRAKES (FIX #1)
===================================================== */

/* PHASE / DISTRIBUTION BRAKE */
if (regimeState === "FRAGILE") {
score = Math.min(score, 75);
}

/* EXECUTION BRAKE (VERY IMPORTANT) */
if (executionMode === "REDUCE_RISK") {
score = Math.min(score, 65);
}

if (executionMode === "CAPITAL_PRESERVATION") {
score = Math.min(score, 55);
}

/* HIGH RISK ENVIRONMENT */
if (dangerLevel === "HIGH") {
score -= 8;
}

if (dangerLevel === "EXTREME") {
score -= 15;
}

/* =====================================================
CLAMP
===================================================== */

score = Math.max(0, Math.min(100, score));

/* =====================================================
EMA (FIXED)
===================================================== */

const prevEdgeScore =
Number(safeInput.edgeState?.emaScore ?? score);

const alpha = 0.35;

const emaScore =
alpha * score + (1 - alpha) * prevEdgeScore;

/* =====================================================
STATE LOGIC
===================================================== */

let state = "NEUTRAL";
let strength = 0;

const finalScore = emaScore;

if (finalScore >= 80) {
state = "ATTACK";
strength = 4;
} else if (finalScore >= 65) {
state = "EXPAND";
strength = 3;
} else if (finalScore >= 45) {
state = "CONFIRM";
strength = 2;
} else if (finalScore >= 25) {
state = "BUILD";
strength = 1;
}

/* ================= WATCH OVERRIDE ================= */

if (
masterScore < 50 &&
rotationScore < 35
) {
state = "WATCH";
strength = Math.max(0, strength - 1);
}

/* =====================================================
LABEL
===================================================== */

const labelMap: any = {
BUILD: "Early Rotation",
CONFIRM: "Rotation Confirming",
EXPAND: "Momentum Expansion",
ATTACK: "Full Risk-On",
WATCH: "Fragile Confirmation",
NEUTRAL: "No Clear Edge"
};

const label = labelMap[state];

/* =====================================================
TIER (CLEANED)
===================================================== */

let tier = "NO_EDGE";

if (finalScore >= 80) tier = "ASYMMETRIC";
else if (finalScore >= 60) tier = "HIGH_EDGE";
else if (finalScore >= 40) tier = "TRADEABLE";
else if (finalScore >= 20) tier = "EARLY_EDGE";

if (state === "WATCH") {
tier = finalScore >= 40 ? "EARLY_EDGE" : "NO_EDGE";
}

/* =====================================================
OUTPUT
===================================================== */

return {
state,
label,
tier,
strength,

score: Number(finalScore.toFixed(2)),

rawScore: score,
emaScore: finalScore,

marketCondition: "STRUCTURAL_EDGE",

components: {
rotationScore,
rotationDecayScore,
participationScore,
liquidityScore,
masterScore,
vix,
ad,
narrowLeadership,
fragileInternalStructure,
regimeState,
executionMode,
dangerLevel
}
};
}
