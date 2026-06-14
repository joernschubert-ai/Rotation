export interface HistoryMetrics {
breadthTrend: number;
breadthAcceleration: number;

participationDecay: number;

leadershipDecay: number;

relativeBreadthWeakness: number;

crashTrend: number;

phasePersistence: number;
}

export function historyEngine(history: any[]): HistoryMetrics {

if (!history || history.length < 5) {
return {
breadthTrend: 0,
breadthAcceleration: 0,
participationDecay: 0,
leadershipDecay: 0,
relativeBreadthWeakness: 0,
crashTrend: 0,
phasePersistence: 0
};
}

const newest = history[0];
const oldest = history[Math.min(history.length - 1, 10)];

const breadthTrend =
(newest.breadth50 ?? 0)
-
(oldest.breadth50 ?? 0);

const breadthAcceleration =
(history[0]?.breadth50 ?? 0)
-
(history[5]?.breadth50 ?? 0);

const participationDecay =
(oldest.newHighs ?? 0)
-
(newest.newHighs ?? 0);

const leadershipDecay =
(oldest.rotationDetails?.concentrationScore ?? 0)
-
(newest.rotationDetails?.concentrationScore ?? 0);

const relativeBreadthWeakness =
(newest.breadth50 ?? 0)
-
(newest.breadth20 ?? 0);

const crashTrend =
(newest.crashProbability ?? 0)
-
(oldest.crashProbability ?? 0);

const phasePersistence =
history.filter(
h => h.cyclePhase === newest.cyclePhase
).length;

return {
breadthTrend,
breadthAcceleration,
participationDecay,
leadershipDecay,
relativeBreadthWeakness,
crashTrend,
phasePersistence
};
}
