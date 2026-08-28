/* =====================================================
HISTORY ENGINE
===================================================== */

export interface HistoryMetrics {

/* =====================================================
TRENDS
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

/* =====================================================
LEADERSHIP / RISK
===================================================== */

leadershipTrend: number;
leadershipDecay: number;

relativeBreadthWeakness: number;

crashTrend: number;

persistenceScore: number;
phasePersistence: number;

/* =====================================================
PERSISTENCE
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

/* =====================================================
AVERAGES
===================================================== */

averageBreadth: number;
averageParticipation: number;
averageRotation: number;
averageLiquidity: number;
averageFragility: number;

highestBreadth: number;
lowestBreadth: number;

highestRotation: number;
lowestRotation: number;

}


/* =====================================================
GENERIC HELPERS
===================================================== */

function toNumber(
value: any,
fallback = 0
): number {

if (typeof value === "number") {

return Number.isFinite(value)
? value
: fallback;

}

if (
value !== null &&
typeof value === "object"
) {

if (
typeof value.value === "number"
) {

return Number.isFinite(value.value)
? value.value
: fallback;

}

if (
typeof value.score === "number"
) {

return Number.isFinite(value.score)
? value.score
: fallback;

}

}

const parsed =
Number(value);

return Number.isFinite(parsed)
? parsed
: fallback;

}


/* =====================================================
BREADTH
===================================================== */

function getBreadth50(
snapshot: any
): number {

return toNumber(
snapshot?.structure?.breadth?.b50,
0
);

}


function getBreadth20(
snapshot: any
): number {

return toNumber(
snapshot?.structure?.breadth?.b20,
0
);

}


function getBreadth200(
snapshot: any
): number {

return toNumber(
snapshot?.structure?.breadth?.b200,
0
);

}


/* =====================================================
ADVANCE / DECLINE
===================================================== */

function getAdvanceDecline(
snapshot: any
): number {

return toNumber(
snapshot?.structure?.advanceDecline,
0
);

}


/* =====================================================
PARTICIPATION
===================================================== */

function getParticipation(
snapshot: any
): number {

return toNumber(
snapshot?.participation?.score,
0
);

}


/* =====================================================
ROTATION
===================================================== */

function getRotation(
snapshot: any
): number {

return toNumber(
snapshot?.rotation?.score,
0
);

}


/* =====================================================
LIQUIDITY
===================================================== */

function getLiquidity(
snapshot: any
): number {

return toNumber(
snapshot?.liquidity?.score,
0
);

}


/* =====================================================
FRAGILITY
===================================================== */

function getFragility(
snapshot: any
): number {

return toNumber(
snapshot?.fragility?.score,
0
);

}


/* =====================================================
LEADERSHIP
===================================================== */

function getLeadership(
snapshot: any
): number {

return toNumber(
snapshot?.participation?.leadershipBreadth ??
snapshot?.rotation?.leadershipBreadth ??
0,
0
);

}


/* =====================================================
CRASH
===================================================== */

function getCrash(
snapshot: any
): number {

return toNumber(
snapshot?.crash?.probability,
0
);

}


/* =====================================================
MASTER / PERSISTENCE
===================================================== */

function getPersistence(
snapshot: any
): number {

return toNumber(
snapshot?.master?.score,
0
);

}


/* =====================================================
NEW HIGHS / LOWS
===================================================== */

function getNewHighs(
snapshot: any
): number {

return toNumber(
snapshot?.structure?.highsLows?.highs,
0
);

}


function getNewLows(
snapshot: any
): number {

return toNumber(
snapshot?.structure?.highsLows?.lows,
0
);

}


/* =====================================================
DANGER
===================================================== */

function getDanger(
snapshot: any
): number {

return toNumber(
snapshot?.dangerZone?.score,
0
);

}


/* =====================================================
EXECUTION
===================================================== */

function getExecution(
snapshot: any
): number {

return toNumber(
snapshot?.executionState?.score,
0
);

}


/* =====================================================
EDGE
===================================================== */

function getEdge(
snapshot: any
): number {

return toNumber(
snapshot?.edgeState?.score,
0
);

}


/* =====================================================
PHASE
===================================================== */

/*
Snapshots können unterschiedliche Formen enthalten:

phase: "PHASE_4_RISK"

oder:

phase: {
phase: "PHASE_4_RISK"
}

oder:

phase: {
phase: "PHASE_4_RISK",
subPhase: "INTERNAL_DISTRIBUTION"
}

Deshalb niemals direkt snapshot.phase
vergleichen.
*/

function getPhase(
snapshot: any
): string {

const phase =
snapshot?.phase;

if (
typeof phase === "string"
) {

return phase;

}

if (
phase &&
typeof phase === "object"
) {

if (
typeof phase.phase === "string"
) {

return phase.phase;

}

if (
typeof phase.name === "string"
) {

return phase.name;

}

if (
typeof phase.state === "string"
) {

return phase.state;

}

}

return "";

}


/* =====================================================
SUB PHASE
===================================================== */

function getSubPhase(
snapshot: any
): string {

const phase =
snapshot?.phase;

if (
phase &&
typeof phase === "object" &&
typeof phase.subPhase === "string"
) {

return phase.subPhase;

}

return "";

}


/* =====================================================
REGIME
===================================================== */

function getRegimeState(
snapshot: any
): string {

const phase =
snapshot?.phase;

if (
phase &&
typeof phase === "object" &&
typeof phase.regimeState === "string"
) {

return phase.regimeState;

}

return "";

}


/* =====================================================
PRICE HELPERS
===================================================== */

function getIndexValue(
snapshot: any,
index: "ndx" | "spx" | "rut"
): number {

return toNumber(
snapshot?.indices?.[index],
0
);

}


function getNDXPrice(
snapshot: any
): number {

return getIndexValue(
snapshot,
"ndx"
);

}


function getSPXPrice(
snapshot: any
): number {

return getIndexValue(
snapshot,
"spx"
);

}


function getRUTPrice(
snapshot: any
): number {

return getIndexValue(
snapshot,
"rut"
);

}


/* =====================================================
PRICE RETURN
===================================================== */

function priceReturn(
newestPrice: number,
oldPrice: number
): number {

if (
!Number.isFinite(newestPrice) ||
!Number.isFinite(oldPrice) ||
newestPrice <= 0 ||
oldPrice <= 0
) {

return 0;

}

return (
(newestPrice / oldPrice) - 1
) * 100;

}


/* =====================================================
CLAMP
===================================================== */

function clamp(
value: number,
min: number,
max: number
): number {

return Math.max(
min,
Math.min(
max,
value
)
);

}


/* =====================================================
ROUND
===================================================== */

function round1(
value: number
): number {

return Math.round(
value * 10
) / 10;

}


/* =====================================================
EMPTY RESULT
===================================================== */

function emptyHistoryMetrics():
HistoryMetrics {

return {

breadthTrend: 0,
breadthAcceleration: 0,

participationTrend: 0,
participationDecay: 0,

rotationTrend: 0,
liquidityTrend: 0,
fragilityTrend: 0,

/* PRICE */

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

/* LEADERSHIP */

leadershipTrend: 0,
leadershipDecay: 0,

relativeBreadthWeakness: 0,

crashTrend: 0,

persistenceScore: 0,
phasePersistence: 0,

/* PERSISTENCE */

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

marketCharacter: "EXPANSION",

/* AVERAGES */

averageBreadth: 0,
averageParticipation: 0,
averageRotation: 0,
averageLiquidity: 0,
averageFragility: 0,

highestBreadth: 0,
lowestBreadth: 0,

highestRotation: 0,
lowestRotation: 0

};

}


/* =====================================================
ENGINE
===================================================== */

export function historyEngine(
history: any[]
): HistoryMetrics {


/* =====================================================
VALIDATE HISTORY
===================================================== */

if (
!Array.isArray(history) ||
history.length < 2
) {

return emptyHistoryMetrics();

}


/* =====================================================
CLEAN HISTORY
===================================================== */

const cleanHistory =
history.filter(
snapshot =>
snapshot &&
typeof snapshot === "object"
);


/*
Wenn nach dem Filtern nicht genügend
Snapshots vorhanden sind.
*/

if (
cleanHistory.length < 2
) {

return emptyHistoryMetrics();

}


/* =====================================================
BASIC REFERENCES
===================================================== */

const newest =
cleanHistory[0];

const historyLength =
cleanHistory.length;


/* =====================================================
WINDOWS
===================================================== */

const shortWindow =
Math.min(
5,
historyLength - 1
);

const longWindow =
Math.min(
20,
historyLength - 1
);

const mid =
cleanHistory[shortWindow];

const oldest =
cleanHistory[longWindow];


/* =====================================================
PHASE
===================================================== */

const newestPhase =
getPhase(newest);

const newestSubPhase =
getSubPhase(newest);

const newestRegimeState =
getRegimeState(newest);


/* =====================================================
PRICE SNAPSHOTS
===================================================== */

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


/* =====================================================
PRICE RETURNS
===================================================== */

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


/* =====================================================
PRICE TREND
===================================================== */

const ndxPriceTrend =
ndxMomentum20D;

const spxPriceTrend =
spxMomentum20D;

const rutPriceTrend =
rutMomentum20D;


/* =====================================================
NASDAQ ACCELERATION
===================================================== */

const ndxAcceleration =
ndxMomentum5D -
(ndxMomentum20D / 4);


/* =====================================================
PRICE DATA QUALITY
===================================================== */

const ndxDataAvailable =
ndxNewest > 0 &&
ndxOldest > 0;

const spxDataAvailable =
spxNewest > 0 &&
spxOldest > 0;

const rutDataAvailable =
rutNewest > 0 &&
rutOldest > 0;


/* =====================================================
PRICE MOMENTUM SCORE
===================================================== */

let priceMomentumScore =
50;


/* -----------------------------------------------------
NASDAQ
----------------------------------------------------- */

if (ndxDataAvailable) {

priceMomentumScore +=
clamp(
ndxMomentum5D * 2,
-20,
20
);

priceMomentumScore +=
clamp(
ndxMomentum20D,
-15,
15
);

}


/* -----------------------------------------------------
S&P
----------------------------------------------------- */

if (spxDataAvailable) {

priceMomentumScore +=
clamp(
spxMomentum5D,
-10,
10
);

}


/* -----------------------------------------------------
RUSSELL
----------------------------------------------------- */

if (rutDataAvailable) {

priceMomentumScore +=
clamp(
rutMomentum5D,
-5,
5
);

}


/* -----------------------------------------------------
ACCELERATION
----------------------------------------------------- */

if (
ndxDataAvailable &&
ndxAcceleration > 5
) {

priceMomentumScore += 10;

}

if (
ndxDataAvailable &&
ndxAcceleration < -5
) {

priceMomentumScore -= 10;

}


/* =====================================================
NORMALIZE PRICE SCORE
===================================================== */

priceMomentumScore =
clamp(
Math.round(
priceMomentumScore
),
0,
100
);


/* =====================================================
PRICE TREND CLASSIFICATION
===================================================== */

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


/* =====================================================
ROLLING STATISTICS
===================================================== */

let breadthSum =
0;

let participationSum =
0;

let rotationSum =
0;

let liquiditySum =
0;

let fragilitySum =
0;

let highestBreadth =
-Infinity;

let lowestBreadth =
Infinity;

let highestRotation =
-Infinity;

let lowestRotation =
Infinity;


/* =====================================================
CURRENT / HISTORICAL TRENDS
===================================================== */

const currentBreadth =
getBreadth50(newest);

const midBreadth =
getBreadth50(mid);

const oldestBreadth =
getBreadth50(oldest);

const currentParticipation =
getParticipation(newest);

const oldestParticipation =
getParticipation(oldest);

const currentRotation =
getRotation(newest);

const oldestRotation =
getRotation(oldest);

const currentLiquidity =
getLiquidity(newest);

const oldestLiquidity =
getLiquidity(oldest);

const currentFragility =
getFragility(newest);

const oldestFragility =
getFragility(oldest);

const currentLeadership =
getLeadership(newest);

const oldestLeadership =
getLeadership(oldest);

const currentCrash =
getCrash(newest);

const oldestCrash =
getCrash(oldest);


/* =====================================================
BREADTH TREND
===================================================== */

const breadthTrend =
currentBreadth -
oldestBreadth;


/* =====================================================
BREADTH ACCELERATION
===================================================== */

const breadthAcceleration =
currentBreadth -
midBreadth;


/* =====================================================
RELATIVE BREADTH WEAKNESS
===================================================== */

const relativeBreadthWeakness =
getBreadth50(newest) -
getBreadth20(newest);


/* =====================================================
PARTICIPATION
===================================================== */

const participationTrend =
currentParticipation -
oldestParticipation;


/*
New Highs:
fallende Highs = negativer Zustand.

Deshalb:

oldHighs - newHighs

positiver Wert =
Highs sind gefallen.
*/

const participationDecay =
getNewHighs(oldest) -
getNewHighs(newest);


/* =====================================================
ROTATION
===================================================== */

const rotationTrend =
currentRotation -
oldestRotation;


/* =====================================================
LIQUIDITY
===================================================== */

const liquidityTrend =
currentLiquidity -
oldestLiquidity;


/* =====================================================
FRAGILITY
===================================================== */

const fragilityTrend =
currentFragility -
oldestFragility;


/* =====================================================
LEADERSHIP
===================================================== */

const leadershipTrend =
currentLeadership -
oldestLeadership;


/*
Leadership decay wird als Verschlechterung
des Leadership-Breadth interpretiert.

Positiv = Leadership hat sich verschlechtert.
Negativ = Leadership hat sich verbessert.
*/

const leadershipDecay =
oldestLeadership -
currentLeadership;


/* =====================================================
CRASH
===================================================== */

const crashTrend =
currentCrash -
oldestCrash;


/* =====================================================
PERSISTENCE
===================================================== */

const persistenceScore =
getPersistence(newest);


/* =====================================================
PHASE PERSISTENCE
===================================================== */

/*
Wir zählen ausschließlich den aktuellen,
zusammenhängenden Phasenblock.

Beispiel:

PHASE_3
PHASE_3
PHASE_3
PHASE_2
PHASE_3

=> daysInPhase = 3

und NICHT 4.
*/

let daysInPhase =
0;

for (
const snapshot of cleanHistory
) {

if (
getPhase(snapshot) === newestPhase
) {

daysInPhase++;

}

else {

break;

}

}

const phasePersistence =
daysInPhase;


/* =====================================================
PERSISTENCE COUNTERS
===================================================== */

let breadthWeakDays =
0;

let participationWeakDays =
0;

let rotationWeakDays =
0;

let liquidityWeakDays =
0;

let fragilityHighDays =
0;

let distributionDays =
0;

let dangerPersistence =
0;

let executionPersistence =
0;

let edgePersistence =
0;


/* =====================================================
SEQUENTIAL DISTRIBUTION
===================================================== */

let currentDistributionStreak =
0;


/* =====================================================
HISTORY LOOP
===================================================== */

for (
const snapshot of cleanHistory
) {

const breadth =
getBreadth50(snapshot);

const participation =
getParticipation(snapshot);

const rotation =
getRotation(snapshot);

const liquidity =
getLiquidity(snapshot);

const fragility =
getFragility(snapshot);

const phase =
getPhase(snapshot);

const subPhase =
getSubPhase(snapshot);

const regimeState =
getRegimeState(snapshot);


/* -----------------------------------------------------
ROLLING SUMS
----------------------------------------------------- */

breadthSum +=
breadth;

participationSum +=
participation;

rotationSum +=
rotation;

liquiditySum +=
liquidity;

fragilitySum +=
fragility;


/* -----------------------------------------------------
EXTREMES
----------------------------------------------------- */

highestBreadth =
Math.max(
highestBreadth,
breadth
);

lowestBreadth =
Math.min(
lowestBreadth,
breadth
);

highestRotation =
Math.max(
highestRotation,
rotation
);

lowestRotation =
Math.min(
lowestRotation,
rotation
);


/* -----------------------------------------------------
WEAKNESS
----------------------------------------------------- */

if (
breadth < 55
) {

breadthWeakDays++;

}

if (
participation < 60
) {

participationWeakDays++;

}

if (
rotation < 60
) {

rotationWeakDays++;

}

if (
liquidity < 55
) {

liquidityWeakDays++;

}

if (
fragility > 60
) {

fragilityHighDays++;

}


/* -----------------------------------------------------
DISTRIBUTION
----------------------------------------------------- */

/*
Distribution kann über mehrere Ebenen
signalisiert werden:

1. PHASE_3_DISTRIBUTION
2. PHASE_4_RISK
3. INTERNAL_DISTRIBUTION
4. DISTRIBUTION
5. regimeState = DISTRIBUTION
*/

const isDistribution =
phase === "PHASE_3_DISTRIBUTION" ||
phase === "PHASE_4_RISK" ||
subPhase === "INTERNAL_DISTRIBUTION" ||
subPhase === "DISTRIBUTION" ||
regimeState === "DISTRIBUTION";


if (
isDistribution
) {

distributionDays++;

currentDistributionStreak++;

}

else {

currentDistributionStreak =
0;

}


/* -----------------------------------------------------
DANGER
----------------------------------------------------- */

if (
getDanger(snapshot) > 60
) {

dangerPersistence++;

}


/* -----------------------------------------------------
EXECUTION
----------------------------------------------------- */

if (
getExecution(snapshot) < 40
) {

executionPersistence++;

}


/* -----------------------------------------------------
EDGE
----------------------------------------------------- */

if (
getEdge(snapshot) < 40
) {

edgePersistence++;

}

}


/* =====================================================
AVERAGES
===================================================== */

const averageBreadth =
breadthSum /
historyLength;

const averageParticipation =
participationSum /
historyLength;

const averageRotation =
rotationSum /
historyLength;

const averageLiquidity =
liquiditySum /
historyLength;

const averageFragility =
fragilitySum /
historyLength;


/* =====================================================
INSTITUTIONAL PRESSURE
===================================================== */

let institutionalPressure =
0;


/*
Distribution
*/

institutionalPressure +=
Math.min(
distributionDays * 4,
30
);


/*
Breadth
*/

institutionalPressure +=
Math.min(
breadthWeakDays * 3,
20
);


/*
Participation
*/

institutionalPressure +=
Math.min(
participationWeakDays * 3,
15
);


/*
Rotation
*/

institutionalPressure +=
Math.min(
rotationWeakDays * 2,
10
);


/*
Liquidity
*/

institutionalPressure +=
Math.min(
liquidityWeakDays * 2,
10
);


/*
Fragility
*/

institutionalPressure +=
Math.min(
fragilityHighDays * 2,
15
);


institutionalPressure =
clamp(
Math.round(
institutionalPressure
),
0,
100
);


/* =====================================================
ROTATION PERSISTENCE
===================================================== */

const rotationPersistence =
clamp(
100 -
(rotationWeakDays * 5),
0,
100
);


/* =====================================================
LIQUIDITY PERSISTENCE
===================================================== */

const liquidityPersistence =
clamp(
100 -
(liquidityWeakDays * 5),
0,
100
);


/* =====================================================
FRAGILITY PERSISTENCE
===================================================== */

const fragilityPersistence =
clamp(
fragilityHighDays * 6,
0,
100
);


/* =====================================================
WEAKNESS ACCELERATION
===================================================== */

/*
Die Flagge soll nicht nur bedeuten,
dass irgendwann einmal Schwäche vorhanden war.

Sie soll bedeuten:

- historische Schwäche vorhanden
- und aktuell ebenfalls Verschlechterung
*/

const acceleratingWeakness =
(
breadthWeakDays >= 5 &&
participationWeakDays >= 5 &&
(
breadthTrend < -1 ||
participationTrend < -1 ||
breadthAcceleration < -1
)
)
||
(
currentFragility > 75 &&
currentLiquidity < 40 &&
currentParticipation < 50
);


/* =====================================================
PERSISTENT DISTRIBUTION
===================================================== */

const persistentDistribution =
distributionDays >= 7 ||
currentDistributionStreak >= 5;


/* =====================================================
PROLONGED BEAR REGIME
===================================================== */

const prolongedBearRegime =
distributionDays >= 15 &&
(
averageBreadth < 55 ||
averageParticipation < 55 ||
averageFragility > 65
);


/* =====================================================
MARKET CHARACTER
===================================================== */

let marketCharacter:
"EXPANSION"
| "TRANSITION"
| "DISTRIBUTION"
| "BEAR";


if (
prolongedBearRegime
) {

marketCharacter =
"BEAR";

}

else if (
persistentDistribution
) {

marketCharacter =
"DISTRIBUTION";

}

else if (
institutionalPressure > 35
) {

marketCharacter =
"TRANSITION";

}

else {

marketCharacter =
"EXPANSION";

}


/* =====================================================
DEBUG
===================================================== */

console.log(
"HISTORY ENGINE",
{

historyLength,

newestPhase,
newestSubPhase,
newestRegimeState,

daysInPhase,
phasePersistence,

/* PRICE */

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

/* CURRENT */

currentBreadth,
currentParticipation,
currentRotation,
currentLiquidity,
currentFragility,

currentLeadership,

/* TRENDS */

breadthTrend,
breadthAcceleration,

participationTrend,
participationDecay,

rotationTrend,
liquidityTrend,
fragilityTrend,

leadershipTrend,
leadershipDecay,

relativeBreadthWeakness,

crashTrend,

/* PERSISTENCE */

breadthWeakDays,
participationWeakDays,
rotationWeakDays,

liquidityWeakDays,
fragilityHighDays,

distributionDays,
currentDistributionStreak,

institutionalPressure,

rotationPersistence,
liquidityPersistence,
fragilityPersistence,

acceleratingWeakness,
persistentDistribution,
prolongedBearRegime,

marketCharacter

}
);


/* =====================================================
RETURN
===================================================== */

return {

breadthTrend,
breadthAcceleration,

/* PRICE */

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

/* TRENDS */

participationTrend,
participationDecay,

rotationTrend,
liquidityTrend,
fragilityTrend,

leadershipTrend,
leadershipDecay,

relativeBreadthWeakness,

crashTrend,

/* PERSISTENCE */

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

/* AVERAGES */

averageBreadth:
round1(
averageBreadth
),

averageParticipation:
round1(
averageParticipation
),

averageRotation:
round1(
averageRotation
),

averageLiquidity:
round1(
averageLiquidity
),

averageFragility:
round1(
averageFragility
),

highestBreadth,
lowestBreadth,

highestRotation,
lowestRotation

};

}
