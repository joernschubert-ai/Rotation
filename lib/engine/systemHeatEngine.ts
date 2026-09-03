// /lib/engine/systemHeat.ts

export function systemHeatEngine(data: any) {

/* =====================================================
INPUTS
===================================================== */

const breadth50 =
Number(data.breadth50 ?? 50);

const breadth20 =
Number(data.breadth20 ?? 50);


const liquidityScore =
Number(
data.marketLiquidityScore ??
data.liquidity?.score ??
50
);


/* =====================================================
INSTITUTIONAL QUALITY
===================================================== */

const participationScore =
Number(
data.participationScore ??
data.participation?.score ??
50
);


const breadthThrustScore =
Number(
data.breadthThrustScore ??
data.breadthThrust?.score ??
50
);


const rotationScore =
Number(
data.rotationScore ??
data.rotation?.score ??
50
);


const rotationDecayScore =
Number(
data.rotationDecayScore ??
data.rotationDecay?.score ??
0
);


const fragilityScore =
Number(
data.fragilityScore ??
data.fragility?.score ??
50
);


/* =====================================================
RISK INPUTS
===================================================== */

const crashScore =
Number(
data.crash?.score ??
0
);


const crashProbability =
Number(
data.crash?.probability ??
0
);


/* =====================================================
MARKET DRIVERS
===================================================== */

const vix =
Number(
data.vix ??
20
);


const credit =
Number(
data.creditRatio ??
0.85
);


const vixTerm =
Number(
data.vixTermRatio ??
1
);


const gamma =
Number(
data.gammaExposure ??
0
);


/* =====================================================
BREADTH MOMENTUM
===================================================== */

const breadthMomentumRaw =
(breadth20 + breadth50) / 2;


/* =====================================================
NORMALIZED COMPONENTS
ALL COMPONENTS USE -2 TO +2 SPACE
===================================================== */

const momentum =
normalizeScore(
breadthMomentumRaw
);


const breadth =
normalizeScore(
breadth50
);


const liquidity =
normalizeScore(
liquidityScore
);


const participation =
normalizeScore(
participationScore
);


const rotation =
normalizeScore(
rotationScore
);


const thrust =
normalizeScore(
breadthThrustScore
);


/*
High crash score = negative environment
*/

const crashRisk =
normalizeScore(
100 - crashScore
);


/*
High fragility = negative environment
*/

const fragility =
normalizeScore(
100 - fragilityScore
);


/*
Rotation decay is inverse.

High decay = negative.
*/

const rotationDecay =
normalizeScore(
100 - rotationDecayScore
);


/* =====================================================
VOLATILITY
===================================================== */

const vixClamped =
clamp(
vix,
10,
45
);


/*
VIX 10 = very positive
VIX 45 = very negative
*/

const volatility =
clamp(
2 -
(
(vixClamped - 10) /
35
) * 4,
-2,
2
);


/* =====================================================
CREDIT
===================================================== */

/*
Assumption:

creditRatio around:
0.70 = weak
0.85 = neutral
1.00 = strong

We deliberately normalize around 0.85.
*/

const creditScore =
clamp(
(
credit - 0.85
) * 8,
-2,
2
);


/* =====================================================
VIX TERM STRUCTURE
===================================================== */

let termScore = 0;


/*
Backwardation / stress
*/

if (
vixTerm < 0.90
) {

termScore = -2;

}

else if (
vixTerm < 0.97
) {

termScore = -1;

}

else if (
vixTerm > 1.10
) {

termScore = 1;

}

else if (
vixTerm > 1.20
) {

termScore = 2;

}


/* =====================================================
GAMMA
===================================================== */

let gammaScore = 0;


if (
gamma > 0
) {

gammaScore = 1;

}

else if (
gamma < 0
) {

gammaScore = -1;

}


/* =====================================================
BASE SYSTEM HEAT
===================================================== */

let heat =

/* MARKET STRUCTURE */

momentum * 0.10 +

breadth * 0.10 +

liquidity * 0.12 +


/* INSTITUTIONAL QUALITY */

participation * 0.18 +

rotation * 0.15 +

thrust * 0.08 +


/* RISK */

crashRisk * 0.10 +

fragility * 0.08 +

rotationDecay * 0.05 +


/* SECONDARY MARKET CONDITIONS */

volatility * 0.02 +

creditScore * 0.01 +

termScore * 0.005 +

gammaScore * 0.005;


/* =====================================================
STRUCTURAL QUALITY
===================================================== */

const strongInstitutionalStructure =

participationScore >= 60 &&

rotationScore >= 55 &&

breadthThrustScore >= 55;


const weakInstitutionalStructure =

participationScore < 45 ||

rotationScore < 40;


const severeInstitutionalWeakness =

participationScore < 35 &&

rotationScore < 35 &&

breadthThrustScore < 40;


/* =====================================================
STRUCTURAL PENALTIES
===================================================== */

if (
severeInstitutionalWeakness
) {

heat -= 0.35;

}


else if (
weakInstitutionalStructure
) {

heat -= 0.18;

}


if (
breadth50 < 50 &&
participationScore < 50
) {

heat -= 0.15;

}


if (
rotationDecayScore >= 70
) {

heat -= 0.18;

}


else if (
rotationDecayScore >= 55
) {

heat -= 0.08;

}


/* =====================================================
LIQUIDITY QUALITY
===================================================== */

/*
High liquidity alone is NOT bullish.

If participation/rotation are weak,
liquidity can mask internal deterioration.
*/

if (

liquidityScore >= 70 &&

(
participationScore < 45 ||
rotationScore < 40
)

) {

heat -= 0.20;

}


/*
Genuine positive liquidity environment
*/

if (

liquidityScore >= 70 &&

participationScore >= 60 &&

rotationScore >= 55

) {

heat += 0.10;

}


/* =====================================================
VOLATILITY / GAMMA STRESS
===================================================== */

if (
vixTerm < 0.95
) {

heat -= 0.15;

}


if (
gamma < 0
) {

heat -= 0.12;

}


if (

vixTerm < 0.95 &&

gamma < 0

) {

heat -= 0.18;

}


/* =====================================================
CRASH OVERRIDE
===================================================== */

if (
crashScore >= 85
) {

heat =
Math.min(
heat,
-1.40
);

}


else if (
crashScore >= 75
) {

heat =
Math.min(
heat,
-0.90
);

}


else if (
crashProbability >= 70
) {

heat =
Math.min(
heat,
-0.60
);

}


/* =====================================================
STRUCTURAL RISK CAP

Important:

Weak participation + weak rotation
must not produce a bullish System Heat
just because liquidity/VIX look good.
===================================================== */

if (

participationScore < 45 &&

rotationScore < 45

) {

heat =
Math.min(
heat,
0.25
);

}


if (

participationScore < 35 ||

rotationScore < 30

) {

heat =
Math.min(
heat,
0
);

}


/* =====================================================
FINAL CLAMP
===================================================== */

heat =
clamp(
heat,
-2,
2
);


heat =
Number(
heat.toFixed(2)
);


/* =====================================================
ENVIRONMENT FLAGS
===================================================== */

const bullishStructure =

heat >= 0.40 &&

participationScore >= 55 &&

rotationScore >= 50 &&

crashScore < 40;


const strongRiskOn =

heat >= 1.20 &&

participationScore >= 65 &&

rotationScore >= 60 &&

breadth50 >= 65 &&

crashScore < 30;


const structuralWarning =

heat <= -0.40 ||

weakInstitutionalStructure;


const riskOff =

heat <= -1.20 ||

crashScore >= 75;


/* =====================================================
LABEL
===================================================== */

let label =
"TRANSITION";


let state =
"NEUTRAL";


if (
strongRiskOn
) {

label =
"RISK ON";

state =
"STRONG_BULLISH";

}


else if (
bullishStructure
) {

label =
"BULLISH";

state =
"BULLISH";

}


else if (
riskOff
) {

label =
"RISK OFF";

state =
"BEARISH";

}


else if (
structuralWarning
) {

label =
"RISK WARNING";

state =
"DEFENSIVE";

}


else {

label =
"TRANSITION";

state =
"NEUTRAL";

}


/* =====================================================
RETURN
===================================================== */

return {

value:
heat,

label,

state,


/* =================================================
COMPONENTS
================================================= */

components: {

momentum,

breadth,

liquidity,

participation,

rotation,

thrust,

crashRisk,

fragility,

rotationDecay,

volatility,

credit:
creditScore,

term:
termScore,

gamma:
gammaScore

},


/* =================================================
QUALITY
================================================= */

quality: {

strongInstitutionalStructure,

weakInstitutionalStructure,

severeInstitutionalWeakness,

bullishStructure,

strongRiskOn,

structuralWarning,

riskOff

},


/* =================================================
CONTROL
================================================= */

control: {

crashOverride:
crashScore >= 75,

termStress:
vixTerm < 0.95,

negativeGamma:
gamma < 0,

doubleStress:
vixTerm < 0.95 &&
gamma < 0,

liquidityTrap:

liquidityScore >= 70 &&

(
participationScore < 45 ||
rotationScore < 40
),

structuralCap:

participationScore < 45 &&
rotationScore < 45,

severeStructuralCap:

participationScore < 35 ||
rotationScore < 30

},


/* =================================================
RAW INPUTS
================================================= */

inputs: {

breadth20,

breadth50,

liquidityScore,

participationScore,

breadthThrustScore,

rotationScore,

rotationDecayScore,

fragilityScore,

crashScore,

crashProbability,

vix,

credit,

vixTerm,

gamma

}

};

}


/* =====================================================
HELPERS
===================================================== */

function normalizeScore(
value: number
) {

return clamp(
(
(value - 50) /
50
) * 2,
-2,
2
);

}


function clamp(
value: number,
min: number,
max: number
) {

return Math.max(
min,
Math.min(
max,
value
)
);

}
