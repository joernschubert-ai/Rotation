// /lib/engine/participationEngine.ts

import {
getMarketStructureFlags
} from "./marketStructureFlags";


/* =====================================================
INPUT
===================================================== */

export interface ParticipationEngineInput {

history?: any[];
historyMetrics?: any;

marketDrivers?: any;
systemHeat?: any;
driversCore?: any;

breadth20?: number;
breadth50?: number;
breadth200?: number;

structure?: any;

highs?: number;
lows?: number;

rsEqual?: number;
rsSmall?: number;
rsGrowth?: number;

rotation?: any;

divergenceState?: string;

concentrationScore?: number;

rotationScore?: number;

previousParticipationScore?: number;
previousParticipation10d?: number;
previousParticipation20d?: number;

previousLeadershipBreadth?: number;
previousPassiveDependence?: number;

previousRsEqual?: number;
previousRsSmall?: number;
previousGrowthBreadth?: number;

previousBreadth50?: number;
previousBreadth50_10d?: number;

previousBreadth200?: number;
previousBreadth200_20d?: number;
}


/* =====================================================
OUTPUT
===================================================== */

export interface ParticipationEngineOutput {

score: number;

state:
| "STRONG"
| "HEALTHY"
| "FRAGILE"
| "WEAK";

quality:
| "HIGH"
| "MEDIUM"
| "LOW";

expansion: boolean;

participationVelocity: number;
participationDecayRate: number;
participationSlope: number;
participationAcceleration: number;

breadth50Trend: number;
breadth50Slope: number;

breadth200Trend: number;
breadth200Slope: number;

breadthParticipationDecay: number;

leadershipBreadthTrend: number;
megaCapDependenceTrend: number;

equalWeightTrend: number;
smallCapTrend: number;
growthBreadthTrend: number;

decayPersistence: number;

narrowLeadership: boolean;
severeNarrowLeadership: boolean;

equalWeightWeakness: boolean;
smallCapWeakness: boolean;

breadthFailure: boolean;

institutionalParticipation: number;

passiveDependence: number;

leadershipBreadth: number;

summary: string;

metrics: any;
}


/* =====================================================
HELPERS
===================================================== */

function normalizePercent(
value: number
): number {

if (!Number.isFinite(value)) {
return 50;
}

return value <= 1
? value * 100
: value;
}


function clamp(
value: number,
min = 0,
max = 100
): number {

return Math.max(
min,
Math.min(max, value)
);
}


function safeNumber(
value: any,
fallback = 50
): number {

const numeric = Number(value);

return Number.isFinite(numeric)
? numeric
: fallback;
}


/* =====================================================
ENGINE
===================================================== */

export function participationEngine(
input: ParticipationEngineInput
): ParticipationEngineOutput {


/* ===================================================
INPUT
==================================================== */

const breadth20 =
clamp(
normalizePercent(
safeNumber(
input.breadth20 ??
input.structure?.breadth?.b20?.value,
50
)
)
);


const breadth50 =
clamp(
normalizePercent(
safeNumber(
input.breadth50 ??
input.structure?.breadth?.b50?.value,
50
)
)
);


const breadth200 =
clamp(
normalizePercent(
safeNumber(
input.breadth200 ??
input.structure?.breadth?.b200?.value,
50
)
)
);


const highs =
safeNumber(
input.highs ??
input.structure?.highsLows?.highs,
0
);


const lows =
safeNumber(
input.lows ??
input.structure?.highsLows?.lows,
0
);


const rsEqual =
safeNumber(
input.rsEqual ??
input.rotation?.rsEqual,
1
);


const rsSmall =
safeNumber(
input.rsSmall ??
input.rotation?.rsSmall,
1
);


const rsGrowth =
safeNumber(
input.rsGrowth ??
input.rotation?.rsGrowth,
1
);


const divergenceState =
input.divergenceState ??
"NONE";


const concentrationScore =
clamp(
safeNumber(
input.concentrationScore ??
input.rotation?.concentrationScore,
50
)
);


const rotationScore =
clamp(
safeNumber(
input.rotationScore ??
input.rotation?.score,
50
)
);


/* ===================================================
HISTORY
==================================================== */

const history =
input.history ?? [];


const h5 =
history.length >= 5
? history[history.length - 5]
: null;


const h10 =
history.length >= 10
? history[history.length - 10]
: null;


const h20 =
history.length >= 20
? history[history.length - 20]
: null;


const historyMetrics =
input.historyMetrics ?? {};


const marketDrivers =
input.marketDrivers ?? {};


const systemHeat =
input.systemHeat ?? {};


const driversCore =
input.driversCore ?? {};


/* ===================================================
HISTORY METRICS
==================================================== */

const participationPersistence =
clamp(
safeNumber(
historyMetrics.participationPersistence,
50
)
);


const averageParticipation =
clamp(
safeNumber(
historyMetrics.averageParticipation,
50
)
);


const institutionalParticipationTrend =
safeNumber(
historyMetrics.institutionalParticipation,
50
);


const participationAccelerationHistory =
safeNumber(
historyMetrics.participationAcceleration,
0
);


const passiveFlowRisk =
clamp(
safeNumber(
marketDrivers.passiveFlowRisk,
0
)
);


const systemHeatBreadth =
safeNumber(
systemHeat.components?.breadth,
1
);


const driversParticipation =
safeNumber(
driversCore.score,
0
);


/* ===================================================
RELATIVE BREADTH SYSTEM
==================================================== */

const previousBreadth50 =
safeNumber(
input.previousBreadth50 ??
h5?.breadth50,
breadth50
);


const previousBreadth50_10d =
safeNumber(
input.previousBreadth50_10d ??
h10?.breadth50,
previousBreadth50
);


const previousBreadth200 =
safeNumber(
input.previousBreadth200 ??
h10?.breadth200,
breadth200
);


const previousBreadth200_20d =
safeNumber(
input.previousBreadth200_20d ??
h20?.breadth200,
previousBreadth200
);


const breadth50Slope =
Math.round(
breadth50 -
previousBreadth50
);


const breadth50Trend =
Math.round(
(
(breadth50 - previousBreadth50) * 0.60 +
(breadth50 - previousBreadth50_10d) * 0.40
)
);


const breadth200Slope =
Math.round(
breadth200 -
previousBreadth200
);


const breadth200Trend =
Math.round(
(
(breadth200 - previousBreadth200) * 0.55 +
(breadth200 - previousBreadth200_20d) * 0.45
)
);


/* ===================================================
CENTRAL MARKET STRUCTURE FLAGS
==================================================== */

const structureFlags =
getMarketStructureFlags({

rsGrowth,
rsSmall,
rsEqual,

breadth50,
breadth200,

highs,
lows

});


const {

equalWeightWeakness,
smallCapWeakness,

narrowLeadership,
severeNarrowLeadership,

breadthFailure

} = structureFlags;


/* ===================================================
LEADERSHIP BREADTH
==================================================== */

let leadershipBreadth = 58;


leadershipBreadth +=
Math.round(
(breadth50 - 50) * 0.22
);


leadershipBreadth +=
Math.round(
(breadth200 - 50) * 0.18
);


if (equalWeightWeakness) {
leadershipBreadth -= 12;
}


if (smallCapWeakness) {
leadershipBreadth -= 12;
}


if (narrowLeadership) {
leadershipBreadth -= 14;
}


leadershipBreadth =
clamp(
leadershipBreadth
);


/* ===================================================
PASSIVE DEPENDENCE
==================================================== */

let passiveDependence = 18;


if (narrowLeadership) {
passiveDependence += 18;
}


if (breadth50 < 50) {
passiveDependence += 12;
}


if (breadth200 < 45) {
passiveDependence += 10;
}


if (concentrationScore >= 70) {
passiveDependence += 14;
}


if (equalWeightWeakness) {
passiveDependence += 8;
}


if (smallCapWeakness) {
passiveDependence += 6;
}


if (severeNarrowLeadership) {
passiveDependence += 10;
}


passiveDependence =
clamp(
passiveDependence
);


/* ===================================================
INSTITUTIONAL PARTICIPATION
==================================================== */

let institutionalParticipation = 55;


institutionalParticipation +=
Math.round(
(breadth20 - 50) * 0.10
);


institutionalParticipation +=
Math.round(
(breadth50 - 50) * 0.22
);


institutionalParticipation +=
Math.round(
(breadth200 - 50) * 0.18
);


if (highs > lows) {
institutionalParticipation += 6;
}


if (narrowLeadership) {
institutionalParticipation -= 14;
}


if (severeNarrowLeadership) {
institutionalParticipation -= 8;
}


if (passiveDependence >= 65) {
institutionalParticipation -= 12;
}


if (breadthFailure) {
institutionalParticipation -= 10;
}


institutionalParticipation =
clamp(
institutionalParticipation
);


/* ===================================================
BASE SCORE
==================================================== */

let score = 60;


/*
* Drivers Core is only an environmental modifier.
* It must never dominate participation itself.
*/

score +=
Math.round(
clamp(
driversParticipation,
-10,
10
) * 0.40
);


/*
* System heat is centered around 1.
*/

score +=
Math.round(
(systemHeatBreadth - 1) * 8
);


/* ===================================================
BREADTH
==================================================== */

score +=
Math.round(
(breadth20 - 50) * 0.08
);


score +=
Math.round(
(breadth50 - 50) * 0.18
);


score +=
Math.round(
(breadth200 - 50) * 0.16
);


/* ===================================================
RELATIVE BREADTH PENALTIES
==================================================== */

if (breadth50Trend < -4) {
score -= 6;
}


if (breadth50Trend < -8) {
score -= 4;
}


if (breadth200Trend < -3) {
score -= 6;
}


if (breadth200Trend < -7) {
score -= 4;
}


/* ===================================================
HIGHS / LOWS
==================================================== */

if (highs > lows) {

score += 6;

}

else if (lows > highs) {

const hlDelta =
Math.min(
8,
Math.abs(lows - highs)
);

score -=
Math.round(
hlDelta * 0.50
);

}


/* ===================================================
LEADERSHIP QUALITY
==================================================== */

if (equalWeightWeakness) {
score -= 6;
}


if (smallCapWeakness) {
score -= 6;
}


if (narrowLeadership) {
score -= 10;
}


if (severeNarrowLeadership) {
score -= 8;
}


/* ===================================================
PASSIVE MARKET PENALTY
==================================================== */

if (
narrowLeadership &&
rsEqual < 0.97
) {

score -= 12;

}


if (passiveDependence >= 70) {

score -= 10;

}


if (passiveDependence >= 85) {

score -= 6;

}


/* ===================================================
ROTATION
==================================================== */

score +=
Math.round(
(rotationScore - 50) * 0.10
);


/* ===================================================
BREADTH FAILURE
==================================================== */

if (breadthFailure) {

score -= 12;

}


/* ===================================================
DIVERGENCE
==================================================== */

if (
divergenceState ===
"BEARISH_DIVERGENCE"
) {

score -= 6;

}


/* ===================================================
STRUCTURAL BONUS
==================================================== */

if (

breadth50 > 72 &&
breadth200 > 62 &&

!narrowLeadership

) {

score += 8;

}


/* ===================================================
VELOCITY / DECAY
==================================================== */

const previousParticipationScore =
safeNumber(
input.previousParticipationScore ??
h5?.participationScore,
score
);


const previousParticipation10d =
safeNumber(
input.previousParticipation10d ??
h10?.participationScore,
previousParticipationScore
);


const previousParticipation20d =
safeNumber(
input.previousParticipation20d ??
h20?.participationScore,
previousParticipation10d
);


const participationVelocity =
Math.round(
score -
previousParticipationScore
);


const participationDecayRate =
Math.round(
score -
previousParticipation10d
);


const participationSlope =
Math.round(
(
score -
previousParticipation20d
) / 2
);


/*
* Short-term movement relative to
* medium-term movement.
*/

const participationAcceleration =
Math.round(
participationVelocity -
(
participationDecayRate / 2
)
);


if (
participationDecayRate <= -15
) {

score -= 8;

}


if (
participationDecayRate <= -25
) {

score -= 6;

}


/* ===================================================
RELATIVE TRENDS
==================================================== */

const previousLeadershipBreadth =
safeNumber(
input.previousLeadershipBreadth,
leadershipBreadth
);


const previousPassiveDependence =
safeNumber(
input.previousPassiveDependence,
passiveDependence
);


const leadershipBreadthTrend =
Math.round(
leadershipBreadth -
previousLeadershipBreadth
);


const megaCapDependenceTrend =
Math.round(
passiveDependence -
previousPassiveDependence
);


const previousRsEqual =
safeNumber(
input.previousRsEqual,
rsEqual
);


const previousRsSmall =
safeNumber(
input.previousRsSmall,
rsSmall
);


const previousGrowthBreadth =
safeNumber(
input.previousGrowthBreadth,
rsGrowth
);


const equalWeightTrend =
Number(
(
(rsEqual - previousRsEqual) * 100
).toFixed(2)
);


const smallCapTrend =
Number(
(
(rsSmall - previousRsSmall) * 100
).toFixed(2)
);


const growthBreadthTrend =
Number(
(
(rsGrowth - previousGrowthBreadth) * 100
).toFixed(2)
);


/* ===================================================
BREADTH PARTICIPATION DECAY
==================================================== */

let breadthParticipationDecay = 0;


if (breadth50Slope < 0) {
breadthParticipationDecay += 4;
}


if (breadth50Trend < 0) {
breadthParticipationDecay += 5;
}


if (breadth200Slope < 0) {
breadthParticipationDecay += 3;
}


if (breadth200Trend < 0) {
breadthParticipationDecay += 4;
}


if (participationVelocity < 0) {
breadthParticipationDecay += 4;
}


if (participationDecayRate < 0) {
breadthParticipationDecay += 5;
}


breadthParticipationDecay =
Math.min(
30,
breadthParticipationDecay
);


/* ===================================================
DECAY PERSISTENCE
==================================================== */

let decayPersistence = 0;


if (participationVelocity < 0) {
decayPersistence += 3;
}


if (participationDecayRate < 0) {
decayPersistence += 4;
}


if (participationSlope < 0) {
decayPersistence += 5;
}


if (leadershipBreadthTrend < 0) {
decayPersistence += 3;
}


if (equalWeightTrend < 0) {
decayPersistence += 2;
}


if (smallCapTrend < 0) {
decayPersistence += 2;
}


if (breadth50Trend < 0) {
decayPersistence += 3;
}


if (breadth200Trend < 0) {
decayPersistence += 3;
}


if (megaCapDependenceTrend > 0) {
decayPersistence += 3;
}


decayPersistence =
Math.min(
20,
decayPersistence
);


/* ===================================================
HISTORICAL OVERLAYS
==================================================== */

if (
participationPersistence < 40
) {

score -= 6;

}


if (
averageParticipation < 55
) {

score -= 4;

}


if (
institutionalParticipationTrend < 45
) {

score -= 5;

}


if (
participationAccelerationHistory < -10
) {

score -= 5;

}


if (
passiveFlowRisk > 25
) {

score -= 6;

}


if (
passiveFlowRisk > 50
) {

score -= 4;

}


/* ===================================================
FINAL SCORE
==================================================== */

score =
clamp(
Math.round(score)
);


/* ===================================================
STATE
==================================================== */

let state:
| "STRONG"
| "HEALTHY"
| "FRAGILE"
| "WEAK";


if (score >= 70) {

state = "STRONG";

}

else if (score >= 52) {

state = "HEALTHY";

}

else if (score >= 42) {

state = "FRAGILE";

}

else {

state = "WEAK";

}


/* ===================================================
QUALITY
==================================================== */

let quality:
| "HIGH"
| "MEDIUM"
| "LOW";


if (
score >= 72 &&
!narrowLeadership &&
passiveDependence < 45
) {

quality = "HIGH";

}

else if (score >= 48) {

quality = "MEDIUM";

}

else {

quality = "LOW";

}


/* ===================================================
EXPANSION
==================================================== */

const expansion =

breadth20 > 72 &&
breadth50 > 68 &&
breadth200 > 60 &&

highs > lows &&

rsEqual >= 1 &&
rsSmall >= 1 &&

!narrowLeadership &&

participationPersistence >= 55 &&

driversParticipation >= 5;


/* ===================================================
SUMMARY
==================================================== */

let summary =
"Average market participation";


if (state === "STRONG") {

summary =
"Broad institutional participation";

}


if (state === "HEALTHY") {

summary =
"Healthy institutional participation";

}


if (state === "FRAGILE") {

if (
passiveDependence >= 60
) {

summary =
"Participation fragile | passive liquidity masking weakening internals";

}

else if (
narrowLeadership
) {

summary =
"Participation fragile | concentrated in narrow leadership";

}

else {

summary =
"Participation becoming structurally fragile";

}

}


if (state === "WEAK") {

summary =
"Participation breakdown active";

}


if (
severeNarrowLeadership
) {

summary +=
" | Severe leadership concentration";

}


if (
decayPersistence >= 14
) {

summary +=
" | Persistent deterioration";

}


/* ===================================================
RETURN
==================================================== */

return {

score,

state,
quality,

expansion,


participationVelocity,
participationDecayRate,
participationSlope,
participationAcceleration,


breadth50Trend,
breadth50Slope,

breadth200Trend,
breadth200Slope,


breadthParticipationDecay,


leadershipBreadthTrend,
megaCapDependenceTrend,

equalWeightTrend,
smallCapTrend,
growthBreadthTrend,


decayPersistence,


narrowLeadership,
severeNarrowLeadership,

equalWeightWeakness,
smallCapWeakness,

breadthFailure,


institutionalParticipation,

passiveDependence,

leadershipBreadth,


summary,


metrics: {

breadth20,
breadth50,
breadth200,


breadth50Trend,
breadth50Slope,

breadth200Trend,
breadth200Slope,


breadthParticipationDecay,


highs,
lows,


rsEqual,
rsSmall,
rsGrowth,


concentrationScore,

rotationScore,


institutionalParticipation,

passiveDependence,

leadershipBreadth,


participationPersistence,

averageParticipation,

institutionalParticipationTrend,

participationAccelerationHistory,


driversParticipation,

systemHeatBreadth,

passiveFlowRisk,


narrowLeadership,

severeNarrowLeadership,

equalWeightWeakness,

smallCapWeakness,

breadthFailure

}

};

}
