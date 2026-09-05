// /lib/engine/marketQualityEngine.ts

export interface MarketQualityEngineInput {
structure?: any;

participation?: any;
rotation?: any;
breadthThrust?: any;
rotationDecay?: any;

liquidity?: any;
fragility?: any;

phaseConfirmation?: any;

breadth50?: number;
breadth200?: number;

participationScore?: number;
rotationScore?: number;
breadthThrustScore?: number;

rsEqual?: number;
rsSmall?: number;
rsGrowth?: number;

concentrationScore?: number;

internalDivergence?: any;
regimeSync?: any;
}


export interface MarketQualityEngineOutput {

score: number;

marketIntegrity: number;

state:
| "INSTITUTIONAL_EXPANSION"
| "HEALTHY"
| "FRAGILE"
| "INTERNALLY_WEAK"
| "DISTRIBUTION"
| "STRUCTURAL_BREAKDOWN";

quality:
| "HIGH"
| "MEDIUM"
| "LOW";

institutionalParticipation: boolean;

internalSynchronization: boolean;

leadership:
| "BROAD"
| "NARROW"
| "MEGA_CAP_DISTORTED";

institutionalDistortion: boolean;

leadershipBreadth: number;

passiveDependence: number;

liquidityCharacter:
| "BROAD"
| "PASSIVE"
| "NARROW"
| "FRAGILE"
| "ILLUSION";

summary: string;

metrics: {

breadth50: number;
breadth200: number;

participationScore: number;
rotationScore: number;
breadthThrustScore: number;

rsEqual: number;
rsSmall: number;
rsGrowth: number;

concentrationScore: number;

rotationDecayScore: number;

divergenceScore: number;
regimeSyncScore: number;

liquidityScore: number;
fragilityScore: number;

phaseConfidence: number;

participationIntegrity: number;
breadthIntegrity: number;
rotationIntegrity: number;
leadershipIntegrity: number;
liquidityIntegrity: number;

leadershipBreadth: number;
passiveDependence: number;

};

}


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


export function marketQualityEngine(
input: MarketQualityEngineInput
): MarketQualityEngineOutput {


/* =====================================================
INPUT
===================================================== */

const breadth50 =
clamp(
Number(
input.breadth50 ??
input.structure?.breadth?.b50?.value ??
50
)
);


const breadth200 =
clamp(
Number(
input.breadth200 ??
input.structure?.breadth?.b200?.value ??
50
)
);


const participationScore =
clamp(
Number(
input.participationScore ??
input.participation?.score ??
50
)
);


const rotationScore =
clamp(
Number(
input.rotationScore ??
input.rotation?.score ??
50
)
);


const breadthThrustScore =
clamp(
Number(
input.breadthThrustScore ??
input.breadthThrust?.score ??
50
)
);


const rsEqual =
Number(
input.rsEqual ??
input.rotation?.rsEqual ??
1
);


const rsSmall =
Number(
input.rsSmall ??
input.rotation?.rsSmall ??
1
);


const rsGrowth =
Number(
input.rsGrowth ??
input.rotation?.rsGrowth ??
1
);


const concentrationScore =
clamp(
Number(
input.concentrationScore ??
input.rotation?.concentrationScore ??
50
)
);


const rotationDecayScore =
clamp(
Number(
input.rotationDecay?.score ??
0
)
);


/*
* HIGH divergence score = structural deterioration.
*/

const divergenceScore =
clamp(
Number(
input.internalDivergence?.score ??
0
)
);


/*
* HIGH regime sync = constructive synchronization.
*/

const regimeSyncScore =
clamp(
Number(
input.regimeSync?.score ??
50
)
);


/*
* Liquidity score:
*
* HIGH = healthy liquidity
* LOW = liquidity stress
*/

const liquidityScore =
clamp(
Number(
input.liquidity?.score ??
50
)
);


/*
* Fragility:
*
* HIGH = structural risk
*/

const fragilityScore =
clamp(
Number(
input.fragility?.score ??
50
)
);


/*
* Confidence is diagnostic only.
*
* High confidence does NOT mean
* high market quality.
*/

const phaseConfidence =
clamp(
Number(
input.phaseConfirmation?.confidence ??
50
)
);


const liquidityEngineCharacter =
input.liquidity?.liquidityState ??
null;



/* =====================================================
LEADERSHIP STRUCTURE
===================================================== */

const narrowLeadership =

rsGrowth > 1.03 &&

rsEqual < 0.99 &&

rsSmall < 0.99;


const severeNarrowLeadership =

rsGrowth > 1.06 &&

rsEqual < 0.97 &&

rsSmall < 0.97;


const institutionalDistortion =

severeNarrowLeadership &&

concentrationScore >= 80;



/* =====================================================
LEADERSHIP BREADTH
===================================================== */

let leadershipBreadth = 58;


leadershipBreadth +=
Math.round(
(breadth50 - 50) * 0.22
);


leadershipBreadth +=
Math.round(
(breadth200 - 50) * 0.18
);


if (rsEqual < 0.99) {

leadershipBreadth -= 10;

}


if (rsSmall < 0.99) {

leadershipBreadth -= 10;

}


if (narrowLeadership) {

leadershipBreadth -= 12;

}


if (institutionalDistortion) {

leadershipBreadth -= 14;

}


leadershipBreadth =
clamp(
Math.round(
leadershipBreadth
)
);



/* =====================================================
PASSIVE DEPENDENCE
===================================================== */

let passiveDependence = 18;


if (narrowLeadership) {

passiveDependence += 18;

}


if (breadth50 < 50) {

passiveDependence += 10;

}


if (participationScore < 48) {

passiveDependence += 12;

}


if (concentrationScore >= 75) {

passiveDependence += 14;

}


if (rsEqual < 0.97) {

passiveDependence += 8;

}


if (divergenceScore >= 60) {

passiveDependence += 8;

}


passiveDependence =
clamp(
Math.round(
passiveDependence
)
);



/* =====================================================
PARTICIPATION
===================================================== */

const strongParticipation =

participationScore >= 68 &&

breadth50 >= 68 &&

breadth200 >= 60;


const weakParticipation =
participationScore < 50;



/* =====================================================
PARTICIPATION INTEGRITY
===================================================== */

let participationIntegrity = 55;


participationIntegrity +=
Math.round(
(participationScore - 50) * 0.65
);


participationIntegrity +=
Math.round(
(breadth50 - 50) * 0.18
);


participationIntegrity +=
Math.round(
(breadth200 - 50) * 0.14
);


if (weakParticipation) {

participationIntegrity -= 10;

}


if (divergenceScore >= 70) {

participationIntegrity -= 8;

}


participationIntegrity =
clamp(
participationIntegrity
);



/* =====================================================
BREADTH INTEGRITY
===================================================== */

let breadthIntegrity = 55;


breadthIntegrity +=
Math.round(
(breadth50 - 50) * 0.38
);


breadthIntegrity +=
Math.round(
(breadth200 - 50) * 0.32
);


breadthIntegrity +=
Math.round(
(breadthThrustScore - 50) * 0.18
);


if (breadth50 < 45) {

breadthIntegrity -= 10;

}


if (breadth200 < 40) {

breadthIntegrity -= 10;

}


if (divergenceScore >= 75) {

breadthIntegrity -= 8;

}


breadthIntegrity =
clamp(
breadthIntegrity
);



/* =====================================================
ROTATION INTEGRITY
===================================================== */

let rotationIntegrity = 55;


rotationIntegrity +=
Math.round(
(rotationScore - 50) * 0.40
);


rotationIntegrity -=
Math.round(
rotationDecayScore * 0.28
);


if (rotationScore < 40) {

rotationIntegrity -= 8;

}


if (divergenceScore >= 70) {

rotationIntegrity -= 6;

}


rotationIntegrity =
clamp(
rotationIntegrity
);



/* =====================================================
LEADERSHIP INTEGRITY
===================================================== */

let leadershipIntegrity = 60;


leadershipIntegrity +=
Math.round(
(leadershipBreadth - 50) * 0.35
);


if (narrowLeadership) {

leadershipIntegrity -= 15;

}


if (institutionalDistortion) {

leadershipIntegrity -= 18;

}


if (
narrowLeadership &&
rsEqual < 0.97
) {

leadershipIntegrity -= 10;

}


leadershipIntegrity =
clamp(
leadershipIntegrity
);



/* =====================================================
LIQUIDITY INTEGRITY
===================================================== */

let liquidityIntegrity = 55;


liquidityIntegrity +=
Math.round(
(liquidityScore - 50) * 0.45
);


liquidityIntegrity +=
Math.round(
(regimeSyncScore - 50) * 0.15
);


liquidityIntegrity -=
Math.round(
Math.max(
0,
fragilityScore - 50
) * 0.35
);


if (
liquidityEngineCharacter === "ILLUSION"
) {

liquidityIntegrity -= 14;

}

else if (
liquidityEngineCharacter === "FRAGILE"
) {

liquidityIntegrity -= 8;

}

else if (
liquidityEngineCharacter === "NARROW"
) {

liquidityIntegrity -= 5;

}


if (passiveDependence >= 70) {

liquidityIntegrity -= 8;

}


liquidityIntegrity =
clamp(
liquidityIntegrity
);



/* =====================================================
MARKET INTEGRITY
===================================================== */

let marketIntegrity =

participationIntegrity * 0.32 +

breadthIntegrity * 0.25 +

rotationIntegrity * 0.18 +

leadershipIntegrity * 0.15 +

liquidityIntegrity * 0.10;



/* =====================================================
STRUCTURAL OVERLAYS
===================================================== */

/*
* Divergence is a direct structural warning.
*/

if (divergenceScore >= 80) {

marketIntegrity -= 12;

}

else if (divergenceScore >= 65) {

marketIntegrity -= 8;

}

else if (divergenceScore >= 50) {

marketIntegrity -= 4;

}


/*
* Passive market structure.
*/

if (passiveDependence >= 75) {

marketIntegrity -= 10;

}

else if (passiveDependence >= 65) {

marketIntegrity -= 6;

}


/*
* Strong synchronized expansion.
*/

if (
strongParticipation &&
leadershipBreadth >= 65 &&
regimeSyncScore >= 60 &&
divergenceScore < 35
) {

marketIntegrity += 5;

}


/*
* Severe fragility.
*/

if (fragilityScore >= 80) {

marketIntegrity -= 10;

}


/*
* Internal leadership failure.
*/

if (
narrowLeadership &&
weakParticipation
) {

marketIntegrity -= 8;

}


marketIntegrity =
clamp(
Math.round(
marketIntegrity
)
);


const score =
marketIntegrity;



/* =====================================================
INTERNAL SYNCHRONIZATION
===================================================== */

const internalSynchronization =

breadth50 >= 60 &&

breadth200 >= 55 &&

participationScore >= 58 &&

rotationScore >= 55 &&

liquidityScore >= 55 &&

fragilityScore < 60 &&

regimeSyncScore >= 60 &&

divergenceScore < 40 &&

!narrowLeadership;



/* =====================================================
LIQUIDITY CHARACTER
===================================================== */

let liquidityCharacter:
| "BROAD"
| "PASSIVE"
| "NARROW"
| "FRAGILE"
| "ILLUSION";


/*
* Liquidity Engine is the primary source.
*/

if (
liquidityEngineCharacter === "BROAD" ||
liquidityEngineCharacter === "PASSIVE" ||
liquidityEngineCharacter === "NARROW" ||
liquidityEngineCharacter === "FRAGILE" ||
liquidityEngineCharacter === "ILLUSION"
) {

liquidityCharacter =
liquidityEngineCharacter;

}


else if (
strongParticipation &&
leadershipBreadth >= 65 &&
passiveDependence < 40
) {

liquidityCharacter =
"BROAD";

}


else if (
passiveDependence >= 75 ||
fragilityScore >= 75
) {

liquidityCharacter =
"ILLUSION";

}


else if (narrowLeadership) {

liquidityCharacter =
"NARROW";

}


else if (weakParticipation) {

liquidityCharacter =
"FRAGILE";

}


else {

liquidityCharacter =
"PASSIVE";

}



/* =====================================================
STATE
===================================================== */

let state:
| "INSTITUTIONAL_EXPANSION"
| "HEALTHY"
| "FRAGILE"
| "INTERNALLY_WEAK"
| "DISTRIBUTION"
| "STRUCTURAL_BREAKDOWN";


/*
* Structural breakdown has highest priority.
*/

if (

marketIntegrity < 35 ||

(
fragilityScore >= 85 &&
divergenceScore >= 70
)

) {

state =
"STRUCTURAL_BREAKDOWN";

}


/*
* Distribution is structural and must not be hidden
* behind a medium integrity score.
*/

else if (

passiveDependence >= 70 ||

(
narrowLeadership &&
weakParticipation &&
divergenceScore >= 55
)

) {

state =
"DISTRIBUTION";

}


else if (

marketIntegrity >= 78 &&

internalSynchronization

) {

state =
"INSTITUTIONAL_EXPANSION";

}


else if (
marketIntegrity >= 64
) {

state =
"HEALTHY";

}


else if (
marketIntegrity >= 52
) {

state =
"FRAGILE";

}


else {

state =
"INTERNALLY_WEAK";

}



/* =====================================================
QUALITY
===================================================== */

let quality:
| "HIGH"
| "MEDIUM"
| "LOW";


if (marketIntegrity >= 72) {

quality =
"HIGH";

}

else if (marketIntegrity >= 48) {

quality =
"MEDIUM";

}

else {

quality =
"LOW";

}



/* =====================================================
LEADERSHIP
===================================================== */

let leadership:
| "BROAD"
| "NARROW"
| "MEGA_CAP_DISTORTED";


if (institutionalDistortion) {

leadership =
"MEGA_CAP_DISTORTED";

}

else if (narrowLeadership) {

leadership =
"NARROW";

}

else {

leadership =
"BROAD";

}



/* =====================================================
SUMMARY
===================================================== */

let summary =
"Institutional market quality stable";


if (
state === "INSTITUTIONAL_EXPANSION"
) {

summary =
"Broad synchronized institutional expansion";

}


else if (
state === "HEALTHY"
) {

summary =
"Healthy institutional market structure";

}


else if (
state === "FRAGILE"
) {

summary =
"Market structure remains fragile";

}


else if (
state === "INTERNALLY_WEAK"
) {

summary =
"Internal market structure deteriorating";

}


else if (
state === "DISTRIBUTION"
) {

summary =
"Distribution structure developing beneath headline market strength";

}


else if (
state === "STRUCTURAL_BREAKDOWN"
) {

summary =
"Structural market breakdown active";

}


if (narrowLeadership) {

summary +=
" | Narrow leadership";

}


if (passiveDependence >= 65) {

summary +=
" | Passive dependence elevated";

}


if (liquidityCharacter === "ILLUSION") {

summary +=
" | Liquidity illusion";

}


if (divergenceScore >= 60) {

summary +=
" | Internal divergence elevated";

}



/* =====================================================
RETURN
===================================================== */

return {

score,

marketIntegrity,

state,

quality,

institutionalParticipation:
strongParticipation,

internalSynchronization,

leadership,

institutionalDistortion,

leadershipBreadth,

passiveDependence,

liquidityCharacter,

summary,


metrics: {

breadth50,
breadth200,

participationScore,
rotationScore,
breadthThrustScore,

rsEqual,
rsSmall,
rsGrowth,

concentrationScore,

rotationDecayScore,

divergenceScore,

regimeSyncScore,

liquidityScore,

fragilityScore,

phaseConfidence,

participationIntegrity,

breadthIntegrity,

rotationIntegrity,

leadershipIntegrity,

liquidityIntegrity,

leadershipBreadth,

passiveDependence

}

};

}
