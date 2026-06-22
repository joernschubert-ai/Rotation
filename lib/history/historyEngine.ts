export interface HistoryMetrics {
breadthTrend: number;
breadthAcceleration: number;

participationTrend: number;
participationDecay: number;

rotationTrend: number;
liquidityTrend: number;
fragilityTrend: number;

leadershipTrend: number;

rsSmallTrend: number;
rsEqualTrend: number;
rsGrowthTrend: number;

relativeBreadthWeakness: number;

crashTrend: number;

persistenceScore: number;

phasePersistence: number;
}

export function historyEngine(
history: any[]
): HistoryMetrics {

if (!history || history.length < 5) {
return {
breadthTrend: 0,
breadthAcceleration: 0,

participationTrend: 0,
participationDecay: 0,

rotationTrend: 0,
liquidityTrend: 0,
fragilityTrend: 0,

leadershipTrend: 0,

rsSmallTrend: 0,
rsEqualTrend: 0,
rsGrowthTrend: 0,

relativeBreadthWeakness: 0,

crashTrend: 0,

persistenceScore: 0,

phasePersistence: 0
};
}

const newest = history[0];

const oldest =
history[
Math.min(
history.length - 1,
10
)
];

/* =====================================
BREADTH
===================================== */

const breadthTrend =
(newest.breadth50 ?? 0) -
(oldest.breadth50 ?? 0);

const breadthAcceleration =
(history[0]?.breadth50 ?? 0) -
(history[5]?.breadth50 ?? 0);

const relativeBreadthWeakness =
(newest.breadth50 ?? 0) -
(newest.breadth20 ?? 0);

/* =====================================
PARTICIPATION
===================================== */

const participationTrend =
(newest.newHighs ?? 0) -
(oldest.newHighs ?? 0);

const participationDecay =
(oldest.newHighs ?? 0) -
(newest.newHighs ?? 0);

/* =====================================
ROTATION
===================================== */

const rotationTrend =
(newest.rotationScore ??
newest.rotationStrength ??
0)
-
(oldest.rotationScore ??
oldest.rotationStrength ??
0);

/* =====================================
LIQUIDITY / FRAGILITY
===================================== */

const liquidityTrend =
(newest.liquidityScore ?? 0) -
(oldest.liquidityScore ?? 0);

const fragilityTrend =
(newest.fragilityScore ?? 0) -
(oldest.fragilityScore ?? 0);

/* =====================================
LEADERSHIP
===================================== */

const leadershipTrend =
(newest.breadth50 ?? 0) -
(oldest.breadth50 ?? 0);

/* =====================================
RELATIVE STRENGTH
===================================== */

const rsSmallTrend =
(newest.rsSmall20 ?? 0) -
(oldest.rsSmall20 ?? 0);

const rsEqualTrend = 0;

const rsGrowthTrend =
(newest.rsGrowth20 ?? 0) -
(oldest.rsGrowth20 ?? 0);

/* =====================================
CRASH
===================================== */

const crashTrend =
(newest.crashProbability ?? 0) -
(oldest.crashProbability ?? 0);

/* =====================================
PERSISTENCE
===================================== */

const persistenceScore =
phasePersistence;

const phasePersistence =
history.filter(
h => h.phase === newest.phase
).length;

console.log("HISTORY DEBUG", {
newestRotation: newest.rotationStrength,
oldestRotation: oldest.rotationStrength,

newestFragility: newest.fragilityScore,
oldestFragility: oldest.fragilityScore,

newestBreadth: newest.breadth50,
oldestBreadth: oldest.breadth50,

historyLength: history.length
});

return {
breadthTrend,
breadthAcceleration,

participationTrend,
participationDecay,

rotationTrend,
liquidityTrend,
fragilityTrend,

leadershipTrend,

rsSmallTrend,
rsEqualTrend,
rsGrowthTrend,

relativeBreadthWeakness,

crashTrend,

persistenceScore,

phasePersistence
};
}
