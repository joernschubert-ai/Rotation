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

const participationDecayHistory =
Number(historyMetrics?.participationDecay ?? 0);

const breadthTrend =
Number(historyMetrics?.breadthTrend ?? 0);

const breadthAcceleration =
Number(historyMetrics?.breadthAcceleration ?? 0);

const leadershipDecay =
Number(historyMetrics?.leadershipDecay ?? 0);

const crashTrend =
Number(historyMetrics?.crashTrend ?? 0);

const relativeBreadthWeakness =
Number(historyMetrics?.relativeBreadthWeakness ?? 0);

const institutionalPressure =
Number(historyMetrics?.institutionalPressure ?? 0);

const daysInPhase =
Number(historyMetrics?.daysInPhase ?? 0);

const averageBreadth =
Number(historyMetrics?.averageBreadth ?? 50);

const averageParticipation =
Number(historyMetrics?.averageParticipation ?? 50);

const averageRotation =
Number(historyMetrics?.averageRotation ?? 50);

const averageLiquidity =
Number(historyMetrics?.averageLiquidity ?? 50);

const averageFragility =
Number(historyMetrics?.averageFragility ?? 50);

const prolongedBearRegime =
Boolean(historyMetrics?.prolongedBearRegime);

const persistentDistribution =
Boolean(historyMetrics?.persistentDistribution);

const acceleratingWeakness =
Boolean(historyMetrics?.acceleratingWeakness);

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

if (daysInPhase >= 20)
score += 3;

if (daysInPhase >= 40)
score += 5;

if (daysInPhase >= 60)
score += 7;

if (persistentDistribution)
score += 6;

if (prolongedBearRegime)
score += 6;

if (institutionalPressure > 55)
score += 3;

if (institutionalPressure > 70)
score += 6;

if (participationDecayHistory > 15)
score += 4;

if (participationDecayHistory > 25)
score += 6;

if (breadthTrend < -1)
score += 3;

if (breadthTrend < -3)
score += 5;

if (breadthAcceleration < -1)
score += 5;

if (leadershipDecay < -5)
score += 4;

if (relativeBreadthWeakness > 8)
score += 3;

if (relativeBreadthWeakness > 15)
score += 5;

if (crashTrend > 5)
score += 4;

if (acceleratingWeakness)
score += 6;

if (averageBreadth < 55)
score += 3;

if (averageParticipation < 55)
score += 3;

if (averageRotation < 60)
score += 2;

if (averageLiquidity < 55)
score += 2;

if (averageFragility > 60)
score += 4;



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

daysInPhase,

participationDecay:
participationDecayHistory,

breadthTrend,

breadthAcceleration,

leadershipDecay,

crashTrend,

relativeBreadthWeakness,

institutionalPressure,

averageBreadth,
averageParticipation,
averageRotation,
averageLiquidity,
averageFragility,

persistentDistribution,

prolongedBearRegime,

acceleratingWeakness

},


summary
};
}
