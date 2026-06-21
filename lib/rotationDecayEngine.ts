// /lib/engine/rotationDecayEngine.ts

export function rotationDecayEngine({

participation,
breadthVelocity,
internalDivergence,

crash,
earlyWarning,

historyMetrics

}: any) {

/* =====================================================
CORE INPUTS
===================================================== */

const participationScore =
Number(participation?.score ?? 50);

const breadthVelocityScore =
Number(breadthVelocity?.score ?? 50);

const divergenceScore =
Number(internalDivergence?.score ?? 0);

const crashProbability =
Number(crash?.probability ?? 0);

const earlyScore =
Number(
earlyWarning?.score?.value ??
earlyWarning?.score ??
0
);

const decayPersistence =
Math.max(
Number(participation?.decayPersistence ?? 0),
Number(breadthVelocity?.decayPersistence ?? 0)
);

/* =====================================================
HISTORY
===================================================== */

const historyPhasePersistence =
Number(
historyMetrics?.phasePersistence ?? 0
);

const historyRegimePersistence =
Number(
historyMetrics?.regimePersistence ?? 0
);

/* =====================================================
NORMALIZATION
===================================================== */

const participationDecay =
100 - participationScore;

/* =====================================================
CORE DECAY
===================================================== */

let score = 0;

score += participationDecay * 0.40;

score += breadthVelocityScore * 0.25;

score += divergenceScore * 0.25;

score += decayPersistence * 0.60;

/* =====================================================
CONTEXT
===================================================== */

if (earlyScore >= 8) {
score += 4;
}

if (crashProbability > 40) {
score += 4;
}

if (crashProbability > 55) {
score += 6;
}

/* =====================================================
PERSISTENCE
===================================================== */

if (historyPhasePersistence >= 6) {
score += 4;
}

if (historyPhasePersistence >= 10) {
score += 6;
}

if (historyRegimePersistence >= 5) {
score += 4;
}

if (historyRegimePersistence >= 10) {
score += 6;
}

score =
Math.max(
0,
Math.min(
100,
Math.round(score)
)
);

/* =====================================================
STATE
===================================================== */

let state =
"HEALTHY_ROTATION";

if (score >= 20) {
state = "MATURE_ROTATION";
}

if (score >= 35) {
state = "FRAGILE_ROTATION";
}

if (score >= 50) {
state = "NARROW_ROTATION";
}

if (score >= 65) {
state = "DISTRIBUTION_ROTATION";
}

if (score >= 80) {
state = "EXHAUSTED_ROTATION";
}

/* =====================================================
MOMENTUM QUALITY
===================================================== */

const momentumQuality =
Math.max(
0,
Math.min(
100,
Math.round(
100 - score
)
)
);

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Healthy rotational structure";

if (state === "MATURE_ROTATION") {
summary =
"Internal participation beginning to soften";
}

if (state === "FRAGILE_ROTATION") {
summary =
"Breadth and participation deterioration expanding";
}

if (state === "NARROW_ROTATION") {
summary =
"Narrow leadership increasingly dominating";
}

if (state === "DISTRIBUTION_ROTATION") {
summary =
"Institutional distribution regime active";
}

if (state === "EXHAUSTED_ROTATION") {
summary =
"Advanced rotational decay across market internals";
}

return {

state,

score,

momentumQuality,

participationScore,

breadthVelocityScore,

divergenceScore,

decayPersistence,

history: {
phasePersistence:
historyPhasePersistence,

regimePersistence:
historyRegimePersistence
},

summary
};
}
