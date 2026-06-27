export interface HistoryMetrics {

/* =====================================================
Trends
===================================================== */

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

/* =====================================================
NEW
===================================================== */

daysInPhase: number;

breadthWeakDays: number;
participationWeakDays: number;
rotationWeakDays: number;

liquidityWeakDays: number;
fragilityHighDays: number;

distributionDays: number;

institutionalPressure: number;

rotationPersistence: number;
liquidityPersistence: number;
fragilityPersistence: number;

dangerPersistence: number;
executionPersistence: number;
edgePersistence: number;

acceleratingWeakness: boolean;
persistentDistribution: boolean;
prolongedBearRegime: boolean;

marketCharacter:
| "EXPANSION"
| "TRANSITION"
| "DISTRIBUTION"
| "BEAR";


averageBreadth:number;
averageParticipation:number;
averageRotation:number;
averageLiquidity:number;
averageFragility:number;

highestBreadth:number;
lowestBreadth:number;

highestRotation:number;
lowestRotation:number;

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

function getDanger(snapshot: any): number {
return Number(snapshot?.dangerZone?.score ?? 0);
}

function getExecution(snapshot: any): number {
return Number(snapshot?.executionState?.score ?? 0);
}

function getEdge(snapshot: any): number {
return Number(snapshot?.edgeState?.score ?? 0);
}

function getPhase(snapshot: any): string {
return snapshot?.phase ?? "";
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
phasePersistence: 0,

daysInPhase: 0,

breadthWeakDays: 0,
participationWeakDays: 0,
rotationWeakDays: 0,

liquidityWeakDays: 0,
fragilityHighDays: 0,

distributionDays: 0,

institutionalPressure: 0,

rotationPersistence: 0,
liquidityPersistence: 0,
fragilityPersistence: 0,

dangerPersistence: 0,
executionPersistence: 0,
edgePersistence: 0,

acceleratingWeakness: false,
persistentDistribution: false,
prolongedBearRegime: false,

averageBreadth: 0,
averageParticipation: 0,
averageRotation: 0,
averageLiquidity: 0,
averageFragility: 0,

highestBreadth: 0,
lowestBreadth: 0,

highestRotation: 0,
lowestRotation: 0,

marketCharacter: "EXPANSION"

};
}


const newest = history[0];

const historyLength = history.length;

const shortWindow =
Math.min(5, historyLength - 1);

const longWindow =
Math.min(20, historyLength - 1);

const mid = history[shortWindow];
const oldest = history[longWindow];

/* =====================================
ROLLING STATISTICS
===================================== */

let breadthSum = 0;
let participationSum = 0;
let rotationSum = 0;
let liquiditySum = 0;
let fragilitySum = 0;

let highestBreadth = -Infinity;
let lowestBreadth = Infinity;

let highestRotation = -Infinity;
let lowestRotation = Infinity;


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
NEW
===================================== */

let daysInPhase = 0;

let breadthWeakDays = 0;
let participationWeakDays = 0;
let rotationWeakDays = 0;

let liquidityWeakDays = 0;
let fragilityHighDays = 0;

let distributionDays = 0;

let dangerPersistence = 0;
let executionPersistence = 0;
let edgePersistence = 0;

let firstPhaseBreak = false;

for (const snap of history) {

const breadth = getBreadth50(snap);
const participation = getParticipation(snap);
const rotation = getRotation(snap);
const liquidity = getLiquidity(snap);
const fragility = getFragility(snap);

breadthSum += breadth;
participationSum += participation;
rotationSum += rotation;
liquiditySum += liquidity;
fragilitySum += fragility;

highestBreadth = Math.max(highestBreadth, breadth);
lowestBreadth = Math.min(lowestBreadth, breadth);

highestRotation = Math.max(highestRotation, rotation);
lowestRotation = Math.min(lowestRotation, rotation);

if (!firstPhaseBreak) {

if (getPhase(snap) === getPhase(newest))
daysInPhase++;
else
firstPhaseBreak = true;

}

if (breadth < 55)
breadthWeakDays++;

if (participation < 60)
participationWeakDays++;

if (rotation < 60)
rotationWeakDays++;

if (liquidity < 55)
liquidityWeakDays++;

if (fragility > 60)
fragilityHighDays++;

if (
snap.phase === "PHASE_3_DISTRIBUTION" ||
snap.phase === "PHASE_4_RISK"
) {
distributionDays++;
}

if (getDanger(snap) > 60)
dangerPersistence++;

if (getExecution(snap) < 40)
executionPersistence++;

if (getEdge(snap) < 40)
edgePersistence++;

}

let institutionalPressure = 0;

institutionalPressure += Math.min(distributionDays * 4, 30);

institutionalPressure += Math.min(breadthWeakDays * 3, 20);

institutionalPressure += Math.min(participationWeakDays * 3, 15);

institutionalPressure += Math.min(rotationWeakDays * 2, 10);

institutionalPressure += Math.min(liquidityWeakDays * 2, 10);

institutionalPressure += Math.min(fragilityHighDays * 2, 15);

institutionalPressure =
Math.min(institutionalPressure,100);

const rotationPersistence =
Math.max(0,100-rotationWeakDays*5);

const liquidityPersistence =
Math.max(0,100-liquidityWeakDays*5);

const fragilityPersistence =
Math.min(fragilityHighDays*6,100);

const acceleratingWeakness =
breadthWeakDays>=5 &&
participationWeakDays>=5;

const persistentDistribution =
distributionDays>=7;

const prolongedBearRegime =
distributionDays>=15;

let marketCharacter:
"EXPANSION"|
"TRANSITION"|
"DISTRIBUTION"|
"BEAR";

if(prolongedBearRegime){

marketCharacter="BEAR";

}else if(persistentDistribution){

marketCharacter="DISTRIBUTION";

}else if(institutionalPressure>35){

marketCharacter="TRANSITION";

}else{

marketCharacter="EXPANSION";

}

/* =====================================
AVERAGES
===================================== */

const averageBreadth =
breadthSum / history.length;

const averageParticipation =
participationSum / history.length;

const averageRotation =
rotationSum / history.length;

const averageLiquidity =
liquiditySum / history.length;

const averageFragility =
fragilitySum / history.length;

const round = (v:number)=>Math.round(v*10)/10;

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
phasePersistence,

daysInPhase,

breadthWeakDays,
participationWeakDays,
rotationWeakDays,

liquidityWeakDays,
fragilityHighDays,

distributionDays,

institutionalPressure,

rotationPersistence,
liquidityPersistence,
fragilityPersistence,

dangerPersistence,
executionPersistence,
edgePersistence,

acceleratingWeakness,
persistentDistribution,
prolongedBearRegime,

marketCharacter,

averageBreadth: round(averageBreadth),
averageParticipation: round(averageParticipation),
averageRotation: round(averageRotation),
averageLiquidity: round(averageLiquidity),
averageFragility: round(averageFragility),

highestBreadth,
lowestBreadth,

highestRotation,
lowestRotation

};

}
