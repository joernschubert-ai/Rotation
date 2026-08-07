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

/* =====================================================
PRICE / INDEX MOMENTUM
===================================================== */

ndxPriceTrend: number;
ndxMomentum5D: number;
ndxMomentum20D: number;
ndxAcceleration: number;

spxPriceTrend: number;
spxMomentum5D: number;
spxMomentum20D: number;

rutPriceTrend: number;
rutMomentum5D: number;
rutMomentum20D: number;

priceMomentumScore: number;

priceTrend:
| "STRONG_BULLISH"
| "BULLISH"
| "NEUTRAL"
| "BEARISH"
| "STRONG_BEARISH";


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
PRICE HELPERS
===================================================== */

function getNDXPrice(snapshot: any): number {
return Number(
snapshot?.indices?.ndx?.value ?? 0
);
}

function getSPXPrice(snapshot: any): number {
return Number(
snapshot?.indices?.spx?.value ?? 0
);
}

function getRUTPrice(snapshot: any): number {
return Number(
snapshot?.indices?.rut?.value ?? 0
);
}

function priceReturn(
newestPrice: number,
oldPrice: number
): number {

if (
!Number.isFinite(newestPrice) ||
!Number.isFinite(oldPrice) ||
oldPrice <= 0
) {
return 0;
}

return (
(newestPrice / oldPrice) - 1
) * 100;
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

/* PRICE / INDEX MOMENTUM */

ndxPriceTrend: 0,
ndxMomentum5D: 0,
ndxMomentum20D: 0,
ndxAcceleration: 0,

spxPriceTrend: 0,
spxMomentum5D: 0,
spxMomentum20D: 0,

rutPriceTrend: 0,
rutMomentum5D: 0,
rutMomentum20D: 0,

priceMomentumScore: 50,

priceTrend: "NEUTRAL",

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
PRICE SNAPSHOTS
===================================== */

const ndxNewest =
getNDXPrice(newest);

const ndxMid =
getNDXPrice(mid);

const ndxOldest =
getNDXPrice(oldest);

const spxNewest =
getSPXPrice(newest);

const spxMid =
getSPXPrice(mid);

const spxOldest =
getSPXPrice(oldest);

const rutNewest =
getRUTPrice(newest);

const rutMid =
getRUTPrice(mid);

const rutOldest =
getRUTPrice(oldest);

/* =====================================
PRICE RETURNS
===================================== */

const ndxMomentum5D =
priceReturn(
ndxNewest,
ndxMid
);

const ndxMomentum20D =
priceReturn(
ndxNewest,
ndxOldest
);

const spxMomentum5D =
priceReturn(
spxNewest,
spxMid
);

const spxMomentum20D =
priceReturn(
spxNewest,
spxOldest
);

const rutMomentum5D =
priceReturn(
rutNewest,
rutMid
);

const rutMomentum20D =
priceReturn(
rutNewest,
rutOldest
);

/* =====================================
PRICE TREND
===================================== */

const ndxPriceTrend =
ndxMomentum20D;

const spxPriceTrend =
spxMomentum20D;

const rutPriceTrend =
rutMomentum20D;

/* =====================================
NASDAQ ACCELERATION
===================================== */

/*
Vergleicht kurzfristiges Momentum
mit dem längerfristigen Momentum.

Beispiel:

5D = +10%
20D = +4%

=> klar beschleunigender Aufwärtsmarkt
*/

const ndxAcceleration =
ndxMomentum5D -
(ndxMomentum20D / 4);

/* =====================================
PRICE MOMENTUM SCORE
===================================== */

let priceMomentumScore = 50;

/* NASDAQ */

priceMomentumScore +=
Math.max(
-20,
Math.min(
20,
ndxMomentum5D * 2
)
);

priceMomentumScore +=
Math.max(
-15,
Math.min(
15,
ndxMomentum20D
)
);

/* S&P CONFIRMATION */

priceMomentumScore +=
Math.max(
-10,
Math.min(
10,
spxMomentum5D
)
);

/* RUSSELL */

priceMomentumScore +=
Math.max(
-5,
Math.min(
5,
rutMomentum5D
)
);

/* ACCELERATION */

if (ndxAcceleration > 5) {
priceMomentumScore += 10;
}

if (ndxAcceleration < -5) {
priceMomentumScore -= 10;
}

priceMomentumScore =
Math.max(
0,
Math.min(
100,
Math.round(priceMomentumScore)
)
);

/* =====================================
PRICE TREND CLASSIFICATION
===================================== */

let priceTrend:
"STRONG_BULLISH"
| "BULLISH"
| "NEUTRAL"
| "BEARISH"
| "STRONG_BEARISH";

if (
priceMomentumScore >= 75 &&
ndxMomentum5D >= 5
) {

priceTrend =
"STRONG_BULLISH";

}

else if (
priceMomentumScore >= 60
) {

priceTrend =
"BULLISH";

}

else if (
priceMomentumScore <= 25 &&
ndxMomentum5D <= -5
) {

priceTrend =
"STRONG_BEARISH";

}

else if (
priceMomentumScore <= 40
) {

priceTrend =
"BEARISH";

}

else {

priceTrend =
"NEUTRAL";

}


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

newestNDX:
ndxNewest,

ndxMomentum5D,
ndxMomentum20D,
ndxAcceleration,

spxMomentum5D,
spxMomentum20D,

rutMomentum5D,
rutMomentum20D,

priceMomentumScore,
priceTrend,

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

/* PRICE / INDEX MOMENTUM */

ndxPriceTrend,
ndxMomentum5D,
ndxMomentum20D,
ndxAcceleration,

spxPriceTrend,
spxMomentum5D,
spxMomentum20D,

rutPriceTrend,
rutMomentum5D,
rutMomentum20D,

priceMomentumScore,
priceTrend,


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
