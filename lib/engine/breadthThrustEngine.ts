// /lib/engine/breadthThrustEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

/* =====================================================
INPUT
===================================================== */

export interface BreadthThrustInput {
breadth20?: number;
breadth50?: number;
breadth200?: number;

structure?: any;

volumeRatio?: number;
advanceDecline?: number;

rsEqual?: number;
rsSmall?: number;
rsGrowth?: number;

participationScore?: number;
rotationScore?: number;
concentrationScore?: number;

divergenceState?: string;
}


/* =====================================================
OUTPUT
===================================================== */

export interface BreadthThrustOutput {
score: number;

thrust:
| "STRONG"
| "MODERATE"
| "WEAK"
| "NEGATIVE";

state:
| "EXPANSION"
| "ROTATION"
| "FRAGILE"
| "BREAKDOWN";

participation: number;

sustainability: number;

leadershipBreadth: number;

passiveDependence: number;

institutionalParticipation: number;

summary: string;

metrics: {
breadth20: number;
breadth50: number;
breadth200: number;

ad: number;

volumeRatio: number;

rsEqual: number;
rsSmall: number;
rsGrowth: number;

participationScore: number;
rotationScore: number;
concentrationScore: number;

leadershipBreadth: number;
passiveDependence: number;
institutionalParticipation: number;

narrowLeadership: boolean;
severeNarrowLeadership: boolean;

equalWeightWeakness: boolean;
smallCapWeakness: boolean;

breadthFailure: boolean;

volumeConfirmation: boolean;
bearishDivergence: boolean;
};
}


/* =====================================================
HELPERS
===================================================== */

function clamp(
value: number,
min = 0,
max = 100
) {

if (!Number.isFinite(value)) {
return min;
}

return Math.max(
min,
Math.min(max, value)
);

}


/*
* Breadth values can arrive as:
*
* 0.62
* or
* 62
*
* Convert into 0–100 space.
*/

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


/*
* Relative-strength values are expected as:
*
* 1.02
* 0.98
*
* Convert into index format:
*
* 102
* 98
*/

function normalizeRelativeStrength(
value: number
): number {

if (!Number.isFinite(value)) {
return 100;
}

return value <= 3
? value * 100
: value;

}


/* =====================================================
ENGINE
===================================================== */

export function breadthThrustEngine(
input: BreadthThrustInput
): BreadthThrustOutput {


/* ===================================================
INPUT
=================================================== */

const breadth20 =
clamp(
normalizePercent(
Number(
input.breadth20 ??
input.structure?.breadth?.b20?.value ??
50
)
)
);


const breadth50 =
clamp(
normalizePercent(
Number(
input.breadth50 ??
input.structure?.breadth?.b50?.value ??
50
)
)
);


const breadth200 =
clamp(
normalizePercent(
Number(
input.breadth200 ??
input.structure?.breadth?.b200?.value ??
50
)
)
);


const ad =
Number(
input.advanceDecline ??
input.structure?.advanceDecline?.value ??
0
);


const volumeRatio =
Number(
input.volumeRatio ??
1
);


/*
* RS values normalized around 100.
*/

const rsEqual =
normalizeRelativeStrength(
Number(
input.rsEqual ??
1
)
);


const rsSmall =
normalizeRelativeStrength(
Number(
input.rsSmall ??
1
)
);


const rsGrowth =
normalizeRelativeStrength(
Number(
input.rsGrowth ??
1
)
);


const participationScore =
clamp(
Number(
input.participationScore ??
50
)
);


const rotationScore =
clamp(
Number(
input.rotationScore ??
50
)
);


const concentrationScore =
clamp(
Number(
input.concentrationScore ??
50
)
);


const divergenceState =
input.divergenceState ??
"NONE";


/* ===================================================
CENTRAL MARKET STRUCTURE FLAGS
=================================================== */

const structureFlags =
getMarketStructureFlags({
rsGrowth: rsGrowth / 100,
rsSmall: rsSmall / 100,
rsEqual: rsEqual / 100,

breadth50,
breadth200
});


const {
narrowLeadership,
severeNarrowLeadership,
megaCapOnlyTape,
equalWeightWeakness,
smallCapWeakness,
breadthFailure
} = structureFlags;


/* ===================================================
VOLUME CONFIRMATION
=================================================== */

const volumeConfirmation =
volumeRatio >= 1.05;


const weakVolume =
volumeRatio < 0.90;


/* ===================================================
DIVERGENCE
=================================================== */

const bearishDivergence =
divergenceState ===
"BEARISH_DIVERGENCE";


/* ===================================================
LEADERSHIP BREADTH
=================================================== */

let leadershipBreadth = 58;


leadershipBreadth +=
Math.round(
(breadth50 - 50) * 0.24
);


leadershipBreadth +=
Math.round(
(breadth200 - 50) * 0.20
);


if (equalWeightWeakness) {
leadershipBreadth -= 10;
}


if (smallCapWeakness) {
leadershipBreadth -= 10;
}


if (narrowLeadership) {
leadershipBreadth -= 12;
}


if (severeNarrowLeadership) {
leadershipBreadth -= 8;
}


leadershipBreadth =
clamp(
leadershipBreadth
);


/* ===================================================
PASSIVE DEPENDENCE
=================================================== */

let passiveDependence = 18;


if (narrowLeadership) {
passiveDependence += 18;
}


if (severeNarrowLeadership) {
passiveDependence += 12;
}


if (megaCapOnlyTape) {
passiveDependence += 12;
}


if (breadth50 < 50) {
passiveDependence += 10;
}


if (breadth200 < 45) {
passiveDependence += 8;
}


if (concentrationScore >= 70) {
passiveDependence += 12;
}


if (equalWeightWeakness) {
passiveDependence += 6;
}


if (smallCapWeakness) {
passiveDependence += 6;
}


passiveDependence =
clamp(
passiveDependence
);


/* ===================================================
INSTITUTIONAL PARTICIPATION
=================================================== */

let institutionalParticipation = 55;


institutionalParticipation +=
Math.round(
(breadth20 - 50) * 0.12
);


institutionalParticipation +=
Math.round(
(breadth50 - 50) * 0.22
);


institutionalParticipation +=
Math.round(
(breadth200 - 50) * 0.18
);


institutionalParticipation +=
Math.round(
(participationScore - 50) * 0.20
);


if (ad > 0) {
institutionalParticipation += 5;
}


if (volumeConfirmation) {
institutionalParticipation += 4;
}


if (narrowLeadership) {
institutionalParticipation -= 12;
}


if (passiveDependence >= 65) {
institutionalParticipation -= 10;
}


if (bearishDivergence) {
institutionalParticipation -= 6;
}


institutionalParticipation =
clamp(
institutionalParticipation
);


/* ===================================================
BASE THRUST SCORE
=================================================== */

let score = 55;


/*
* Short-term breadth.
*/

score +=
Math.round(
(breadth20 - 50) * 0.10
);


/*
* Medium-term breadth.
*/

score +=
Math.round(
(breadth50 - 50) * 0.18
);


/*
* Structural breadth.
*/

score +=
Math.round(
(breadth200 - 50) * 0.14
);


/* ===================================================
ADVANCE / DECLINE
=================================================== */

if (ad > 8) {

score += 7;

}

else if (ad > 3) {

score += 4;

}

else if (ad < -8) {

score -= 6;

}

else if (ad < -20) {

score -= 10;

}


/* ===================================================
VOLUME CONFIRMATION
=================================================== */

if (volumeConfirmation) {

score += 4;

}


if (weakVolume) {

score -= 4;

}


/* ===================================================
PARTICIPATION
=================================================== */

score +=
Math.round(
(participationScore - 50) * 0.16
);


/* ===================================================
ROTATION
=================================================== */

score +=
Math.round(
(rotationScore - 50) * 0.10
);


/* ===================================================
LEADERSHIP STRUCTURE
=================================================== */

if (equalWeightWeakness) {

score -= 5;

}


if (smallCapWeakness) {

score -= 5;

}


if (narrowLeadership) {

score -= 10;

}


if (severeNarrowLeadership) {

score -= 8;

}


if (megaCapOnlyTape) {

score -= 10;

}


/* ===================================================
PASSIVE DEPENDENCE
=================================================== */

if (passiveDependence >= 70) {

score -= 10;

}

else if (passiveDependence >= 55) {

score -= 5;

}


/* ===================================================
CONCENTRATION
=================================================== */

if (concentrationScore >= 80) {

score -= 10;

}

else if (concentrationScore >= 70) {

score -= 6;

}


/* ===================================================
BREADTH FAILURE
=================================================== */

if (breadthFailure) {

score -= 12;

}


/* ===================================================
DIVERGENCE
=================================================== */

if (bearishDivergence) {

score -= 8;

}


/* ===================================================
STRONG STRUCTURAL THRUST
=================================================== */

const broadExpansion =
breadth20 >= 70 &&
breadth50 >= 65 &&
breadth200 >= 58 &&
participationScore >= 60 &&
!narrowLeadership;


if (broadExpansion) {

score += 8;

}


/* ===================================================
FINAL SCORE
=================================================== */

score =
clamp(
Math.round(score)
);


/* ===================================================
THRUST
=================================================== */

let thrust:
| "STRONG"
| "MODERATE"
| "WEAK"
| "NEGATIVE";


if (score >= 75) {

thrust = "STRONG";

}

else if (score >= 58) {

thrust = "MODERATE";

}

else if (score >= 35) {

thrust = "WEAK";

}

else {

thrust = "NEGATIVE";

}


/* ===================================================
STATE
=================================================== */

let state:
| "EXPANSION"
| "ROTATION"
| "FRAGILE"
| "BREAKDOWN";


if (
score >= 72 &&
institutionalParticipation >= 65 &&
passiveDependence < 40 &&
!narrowLeadership
) {

state = "EXPANSION";

}

else if (
score >= 55
) {

state = "ROTATION";

}

else if (
score >= 35
) {

state = "FRAGILE";

}

else {

state = "BREAKDOWN";

}


/* ===================================================
PARTICIPATION
=================================================== */

let participation =
Math.round(
breadth20 * 0.20 +
breadth50 * 0.24 +
breadth200 * 0.20 +
participationScore * 0.36
);


if (narrowLeadership) {

participation -= 8;

}


if (severeNarrowLeadership) {

participation -= 5;

}


participation =
clamp(
participation
);


/* ===================================================
SUSTAINABILITY
=================================================== */

let sustainability = 55;


sustainability +=
Math.round(
(breadth200 - 50) * 0.18
);


sustainability +=
Math.round(
(breadth50 - 50) * 0.12
);


sustainability +=
Math.round(
(rotationScore - 50) * 0.15
);


sustainability +=
Math.round(
(participationScore - 50) * 0.15
);


if (volumeConfirmation) {

sustainability += 4;

}


if (narrowLeadership) {

sustainability -= 10;

}


if (passiveDependence >= 65) {

sustainability -= 10;

}


if (bearishDivergence) {

sustainability -= 8;

}


sustainability =
clamp(
sustainability
);


/* ===================================================
SUMMARY
=================================================== */

let summary =
"Neutral breadth participation";


if (state === "EXPANSION") {

summary =
"Broad institutional thrust expansion";

}


if (state === "ROTATION") {

summary =
"Selective rotational breadth participation";

}


if (state === "FRAGILE") {

summary =
"Breadth momentum deteriorating beneath index stability";

}


if (state === "BREAKDOWN") {

summary =
"Breadth breakdown active across market internals";

}


if (narrowLeadership) {

summary +=
" | Narrow leadership";

}


if (passiveDependence >= 65) {

summary +=
" | Passive dependence elevated";

}


if (bearishDivergence) {

summary +=
" | Bearish divergence";

}


/* ===================================================
RETURN
=================================================== */

return {

score,

thrust,

state,

participation,

sustainability,

leadershipBreadth,

passiveDependence,

institutionalParticipation,

summary,


metrics: {

breadth20,

breadth50,

breadth200,

ad,

volumeRatio,

rsEqual,

rsSmall,

rsGrowth,

participationScore,

rotationScore,

concentrationScore,

leadershipBreadth,

passiveDependence,

institutionalParticipation,

narrowLeadership,

severeNarrowLeadership,

equalWeightWeakness,

smallCapWeakness,

breadthFailure,

volumeConfirmation,

bearishDivergence

}

};

}
