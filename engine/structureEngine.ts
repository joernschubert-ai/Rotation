// /lib/engine/structureEngine.ts

export function structureEngine(data: any) {

/* =====================================================
HELPERS
===================================================== */

function clamp(
value: number,
min = 0,
max = 100
) {

return Math.max(
min,
Math.min(max, value)
);

}


function safeNumber(
value: any,
fallback = 0
) {

const numeric =
Number(value);

return Number.isFinite(numeric)
? numeric
: fallback;

}


/* =====================================================
BREADTH
===================================================== */

/*
* Breadth values are expected as decimals
* from the backend.
*
* Example:
*
* 0.65 -> 65%
*/

const breadth20 =
clamp(
safeNumber(
data.breadth20,
0
) * 100
);

const breadth50 =
clamp(
safeNumber(
data.breadth50,
0
) * 100
);

const breadth200 =
clamp(
safeNumber(
data.breadth200,
0
) * 100
);


const breadth = {

b20: {

value:
Math.round(
breadth20
),

delta:
safeNumber(
data.breadth20Delta,
0
)

},

b50: {

value:
Math.round(
breadth50
),

delta:
safeNumber(
data.breadth50Delta,
0
)

},

b200: {

value:
Math.round(
breadth200
),

delta:
safeNumber(
data.breadth200Delta,
0
)

}

};


/* =====================================================
ADVANCE / DECLINE
===================================================== */

const advances =
safeNumber(
data.advances ??
data.advanceDecline?.advances,
0
);

const declines =
safeNumber(
data.declines ??
data.advanceDecline?.declines,
0
);


const adValue =
advances -
declines;


const advanceDecline = {

advances,

declines,

value:
adValue,

delta:
safeNumber(
data.adDelta ??
data.advanceDecline?.delta,
0
)

};


/* =====================================================
HIGHS / LOWS
===================================================== */

const highs =
safeNumber(
data.highs ??
data.newHighs,
0
);

const lows =
safeNumber(
data.lows ??
data.newLows,
0
);


const highsLows = {

highs,

lows,

deltaHighs:
safeNumber(
data.highsDelta,
0
),

deltaLows:
safeNumber(
data.lowsDelta,
0
)

};


/* =====================================================
DISTRIBUTION
===================================================== */

/*
* Distribution is a direct structural input.
*
* 0 = no distribution
* 7 = maximum distribution
*/

const distributionValue =
Math.max(
0,
Math.min(
7,
safeNumber(
data.distributionScore,
0
)
)
);


const distribution = {

value:
distributionValue,

max:
7

};


/* =====================================================
HIGH / LOW STRUCTURE
===================================================== */

const hasHighLowData =
highs !== 0 ||
lows !== 0;


const totalHighLow =
highs +
lows;


const highLowStrength =
hasHighLowData &&
totalHighLow > 0

? (
highs - lows
) /
totalHighLow

: 0;


/*
* Convert High/Low strength
* into a 0..100 structural score.
*
* -1 = 0
* 0 = 50
* +1 = 100
*/

const highLowScore =
clamp(
50 +
(
highLowStrength *
50
)
);


/* =====================================================
ADVANCE / DECLINE STRUCTURE
===================================================== */

/*
* A/D can have different absolute ranges
* depending on the universe.
*
* Therefore normalize the net result
* relative to total activity.
*/

const totalAD =
advances +
declines;


const adStrength =
totalAD > 0

? adValue /
totalAD

: 0;


/*
* -1 = 0
* 0 = 50
* +1 = 100
*/

const adScore =
clamp(
50 +
(
adStrength *
50
)
);


/* =====================================================
DISTRIBUTION RISK
===================================================== */

/*
* Distribution:
*
* 0 = healthy
* 7 = maximum structural risk
*/

const distributionRisk =
clamp(
(
distributionValue /
7
) * 100
);


const distributionHealth =
100 -
distributionRisk;


/* =====================================================
BREADTH HEALTH
===================================================== */

/*
* Breadth hierarchy:
*
* Breadth 20:
* short-term momentum participation
*
* Breadth 50:
* intermediate participation
*
* Breadth 200:
* long-term structural participation
*
* Breadth50 receives the highest weighting
* because it reacts faster than Breadth200
* but is more stable than Breadth20.
*/

const breadthHealth =
(
breadth20 * 0.20
) +

(
breadth50 * 0.45
) +

(
breadth200 * 0.35
);


/* =====================================================
BREADTH DIVERGENCE
===================================================== */

/*
* A structurally dangerous environment can occur
* when longer-term breadth still looks healthy
* while short/intermediate breadth deteriorates.
*
* This is a structural divergence,
* independent from RotationComposite.
*/

let divergencePenalty = 0;


/*
* Breadth200 remains strong
* while Breadth50 deteriorates.
*/

if (
breadth200 >= 70 &&
breadth50 < 55
) {

divergencePenalty += 8;

}


/*
* Strong long-term breadth but weak short-term
* participation.
*/

if (
breadth200 >= 70 &&
breadth20 < 45
) {

divergencePenalty += 6;

}


/*
* Severe intermediate deterioration.
*/

if (
breadth50 < 40 &&
breadth200 >= 65
) {

divergencePenalty += 8;

}


/*
* Breadth collapse across all horizons.
*/

if (
breadth20 < 35 &&
breadth50 < 40 &&
breadth200 < 50
) {

divergencePenalty += 10;

}


/* =====================================================
A/D DIVERGENCE
===================================================== */

/*
* Strong Breadth50 with negative A/D can indicate
* weakening internal participation.
*/

let adPenalty = 0;


if (
breadth50 > 75 &&
adStrength < 0
) {

adPenalty += 6;

}


/*
* Strong Breadth200 while current A/D
* is significantly negative.
*/

if (
breadth200 > 70 &&
adStrength < -0.10
) {

adPenalty += 8;

}


/* =====================================================
HIGH / LOW DIVERGENCE
===================================================== */

let highLowPenalty = 0;


/*
* Breadth appears strong,
* but new lows dominate.
*/

if (
hasHighLowData &&
breadth50 > 70 &&
highLowStrength < 0
) {

highLowPenalty += 6;

}


/*
* Severe new-low dominance.
*/

if (
hasHighLowData &&
highLowStrength < -0.30
) {

highLowPenalty += 8;

}


/* =====================================================
STRUCTURAL HEALTH
===================================================== */

/*
* IMPORTANT:
*
* Structure Health intentionally uses only
* Structure Engine data.
*
* It does NOT directly include:
*
* - Rotation Score
* - RotationConfirm
* - RotationDecay
* - Participation Engine
* - Fragility Engine
* - Liquidity Engine
* - Early Warning Engine
*
* Those engines already have their own panels
* and are integrated at higher composite levels.
*
* This prevents hidden double-counting.
*/

let healthScore =
(
breadthHealth *
0.60
) +

(
adScore *
0.15
) +

(
highLowScore *
0.10
) +

(
distributionHealth *
0.15
);


/* =====================================================
STRUCTURAL PENALTIES
===================================================== */

healthScore -=
divergencePenalty;

healthScore -=
adPenalty;

healthScore -=
highLowPenalty;


/* =====================================================
CLAMP
===================================================== */

healthScore =
clamp(
healthScore
);


/* =====================================================
HEALTH
===================================================== */

const health = {

value:
Math.round(
healthScore
),

max:
100

};


/* =====================================================
STRUCTURE STATE
===================================================== */

let structureState =
"BALANCED";


if (
healthScore >= 75
) {

structureState =
"HEALTHY";

}

else if (
healthScore >= 60
) {

structureState =
"STABLE";

}

else if (
healthScore >= 45
) {

structureState =
"TRANSITION";

}

else if (
healthScore >= 30
) {

structureState =
"WEAKENING";

}

else {

structureState =
"STRUCTURAL_FAILURE";

}


/* =====================================================
DIAGNOSTICS
===================================================== */

const diagnostics = {

breadthHealth:
Math.round(
breadthHealth
),

adScore:
Math.round(
adScore
),

highLowScore:
Math.round(
highLowScore
),

distributionHealth:
Math.round(
distributionHealth
),

divergencePenalty,

adPenalty,

highLowPenalty,

distributionRisk:
Math.round(
distributionRisk
)

};


/* =====================================================
RETURN
===================================================== */

return {

breadth,

advanceDecline,

highsLows,

distribution,

health,

structureState,

diagnostics

};

}
