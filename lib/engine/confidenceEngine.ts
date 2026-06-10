// /lib/engine/confidenceEngine.ts

export function confidenceEngine(engine: any) {

if (!engine) {
return {
state: "INVALID",
score: 0
};
}

let score = 0;

/* =====================================================
SAFE INPUTS
===================================================== */

const rotationScore =
Number(engine.rotation?.score ?? 0);

const structuralRisk =
Number(engine.structuralRisk ?? 0);

const crashProbability =
Number(engine.crash?.probability ?? 0);

const rotationDecayScore =
Number(engine.rotationDecay?.score ?? 0);

const fragilityScore =
Number(engine.fragility?.score ?? 50);

const liquidityScore =
Number(engine.liquidity?.score ?? 50);

const participationScore =
Number(engine.participation?.score ?? 50);

const squeezeRisk =
Number(engine.squeeze?.risk ?? 0);

const breadthThrust =
Boolean(engine.breadthThrust?.active ?? false);

const regimeAligned =
Boolean(
engine.regimeSync?.aligned ??
false
);

const rotationConfirmState =
engine.rotationConfirm?.state ??
"EARLY";

const rotationQuality =
Number(
engine.rotationConfirm?.quality ?? 50
);

const falseBreakRisk =
Number(
engine.rotationConfirm?.falseBreakRisk ?? 50
);

/* =====================================================
DATA VALIDITY
===================================================== */

if (
isNaN(rotationScore) ||
isNaN(structuralRisk)
) {
return {
state: "INVALID",
score: 0
};
}

/* =====================================================
PHASE STRUCTURE
===================================================== */

switch (engine.phase) {

case "PHASE_1_EUPHORIA":
score -= 5;
break;

case "PHASE_2_WARNING":
score += 10;
break;

case "PHASE_3_DISTRIBUTION":
score += 25;
break;

case "PHASE_4_RISK":
score += 45;
break;

case "PHASE_5_BREAKDOWN":
score += 65;
break;

case "PHASE_6_PANIC":
score += 80;
break;

case "PHASE_7_CAPITULATION":
score += 90;
break;
}

/* =====================================================
ROTATION
===================================================== */

if (
engine.rotation?.signal ===
"RISK_OFF_ROTATION"
) {
score += 20;
}

if (
rotationConfirmState ===
"CONFIRMED"
) {
score += 10;
}

if (
rotationConfirmState ===
"INSTITUTIONAL_CONFIRMATION"
) {
score += 15;
}

if (rotationQuality >= 75) {
score += 5;
}

/* =====================================================
CRASH ENGINE
===================================================== */

if (crashProbability > 30) {
score += 5;
}

if (crashProbability > 45) {
score += 10;
}

if (crashProbability > 60) {
score += 20;
}

if (crashProbability > 75) {
score += 25;
}

/* =====================================================
STRUCTURAL RISK
===================================================== */

if (structuralRisk > 45) {
score += 5;
}

if (structuralRisk > 60) {
score += 10;
}

if (structuralRisk > 75) {
score += 15;
}

/* =====================================================
ROTATION DECAY
===================================================== */

if (rotationDecayScore > 25) {
score += 10;
}

if (rotationDecayScore > 45) {
score += 15;
}

if (rotationDecayScore > 65) {
score += 20;
}

/* =====================================================
FRAGILITY
===================================================== */

if (fragilityScore > 60) {
score += 10;
}

if (fragilityScore > 75) {
score += 15;
}

/* =====================================================
LIQUIDITY
===================================================== */

if (liquidityScore < 45) {
score += 10;
}

if (liquidityScore < 35) {
score += 15;
}

/* =====================================================
PARTICIPATION
===================================================== */

if (participationScore < 55) {
score += 5;
}

if (participationScore < 45) {
score += 10;
}

if (participationScore < 35) {
score += 15;
}

/* =====================================================
SQUEEZE / FALSE BREAK
===================================================== */

if (squeezeRisk >= 70) {
score += 10;
}

if (falseBreakRisk >= 65) {
score += 10;
}

if (falseBreakRisk >= 80) {
score += 15;
}

/* =====================================================
POSITIVE STRUCTURE OFFSETS
===================================================== */

if (
breadthThrust &&
regimeAligned &&
rotationDecayScore < 20
) {
score -= 10;
}

if (
rotationQuality >= 80 &&
liquidityScore >= 70 &&
participationScore >= 70
) {
score -= 10;
}

/* =====================================================
CLAMP
===================================================== */

score = Math.max(
0,
Math.min(100, Math.round(score))
);

/* =====================================================
STATE
===================================================== */

if (score < 25) {
return {
state: "EARLY",
score
};
}

if (score < 55) {
return {
state: "BUILDING",
score
};
}

return {
state: "CONFIRMED",
score
};

}
