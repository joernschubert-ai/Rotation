export interface HistoryMetrics {
breadthTrend: number;
breadthAcceleration: number;

participationTrend: number;
participationDecay: number;

rotationTrend: number;
liquidityTrend: number;
fragilityTrend: number;

leadershipTrend: number;

relativeBreadthWeakness: number;

crashTrend: number;

persistenceScore: number;
phasePersistence: number;
}

/* =====================================================
HELPERS
===================================================== */

function getBreadth50(snapshot: any): number {
return Number(
snapshot?.structure?.breadth?.b50?.value ?? 0
);
}

function getBreadth20(snapshot: any): number {
return Number(
snapshot?.structure?.breadth?.b20?.value ?? 0
);
}

function getParticipation(snapshot: any): number {
return Number(
snapshot?.participation?.score ?? 0
);
}

function getRotation(snapshot: any): number {
return Number(
snapshot?.rotation?.score ?? 0
);
}

function getLiquidity(snapshot: any): number {
return Number(
snapshot?.liquidity?.score ?? 0
);
}

function getFragility(snapshot: any): number {
return Number(
snapshot?.fragility?.score ?? 0
);
}

function getLeadership(snapshot: any): number {
return Number(
snapshot?.participation?.leadershipBreadth ??
snapshot?.rotation?.leadershipBreadth ??
0
);
}

function getCrash(snapshot: any): number {
return Number(
snapshot?.crash?.probability ?? 0
);
}

function getPersistence(snapshot: any): number {
return Number(
snapshot?.master?.score ?? 0
);
}

function getNewHighs(snapshot: any): number {
return Number(
snapshot?.structure?.highsLows?.highs ?? 0
);
}

/* =====================================================
ENGINE
===================================================== */

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

const mid =
history[
Math.min(
history.length - 1,
5
)
];

/* =====================================
BREADTH
===================================== */

const breadthTrend =
getBreadth50(newest) -
getBreadth50(oldest);

const breadthAcceleration =
getBreadth50(newest) -
getBreadth50(mid);

const relativeBreadthWeakness =
getBreadth50(newest) -
getBreadth20(newest);

/* =====================================
PARTICIPATION
===================================== */

const participationTrend =
getParticipation(newest) -
getParticipation(oldest);

const participationDecay =
getNewHighs(oldest) -
getNewHighs(newest);

/* =====================================
ROTATION
===================================== */

const rotationTrend =
getRotation(newest) -
getRotation(oldest);

/* =====================================
LIQUIDITY
===================================== */

const liquidityTrend =
getLiquidity(newest) -
getLiquidity(oldest);

/* =====================================
FRAGILITY
===================================== */

const fragilityTrend =
getFragility(newest) -
getFragility(oldest);

/* =====================================
LEADERSHIP
===================================== */

const leadershipTrend =
getLeadership(newest) -
getLeadership(oldest);

/* =====================================
CRASH
===================================== */

const crashTrend =
getCrash(newest) -
getCrash(oldest);

/* =====================================
PERSISTENCE
===================================== */

const persistenceScore =
getPersistence(newest);

const phasePersistence =
history.filter(
h => h.phase === newest.phase
).length;

/* =====================================
DEBUG
===================================== */

console.log("HISTORY DEBUG", {

newestRotation:
  getRotation(newest),

oldestRotation:
  getRotation(oldest),

newestFragility:
  getFragility(newest),

oldestFragility:
  getFragility(oldest),

newestBreadth:
  getBreadth50(newest),

oldestBreadth:
  getBreadth50(oldest),

newestParticipation:
  getParticipation(newest),

oldestParticipation:
  getParticipation(oldest),

historyLength:
  history.length

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

relativeBreadthWeakness,


crashTrend,

persistenceScore,

phasePersistence

};
}
