/* =====================================================
PRICE MOMENTUM ENGINE
=====================================================

Purpose:
--------
Detect price-driven market moves BEFORE the slower
structural engines fully confirm a regime change.

Important:
-----------
This engine does NOT decide CALL / PUT.

It provides:
- price momentum
- short-term momentum
- acceleration
- trend
- direction
- strength
- price/structure context

The engine is deliberately fast-reacting.

Structural engines answer:
"Is the market healthy?"

This engine answers:
"What is price doing RIGHT NOW?"

===================================================== */

export type PriceTrend =
| "STRONG_BULLISH"
| "BULLISH"
| "NEUTRAL"
| "BEARISH"
| "STRONG_BEARISH";

export type PriceDirection =
| "UP"
| "DOWN"
| "FLAT";

export type PriceMomentumState =
| "STRONG_BULLISH"
| "BULLISH"
| "BULLISH_COOLING"
| "NEUTRAL"
| "BEARISH_BUILDING"
| "BEARISH"
| "STRONG_BEARISH";

export type PriceStructureAlignment =
| "CONFIRMED_BULLISH"
| "BULLISH"
| "CONFLICT"
| "BEARISH"
| "CONFIRMED_BEARISH";


/* =====================================================
INPUT
===================================================== */

export interface PriceMomentumInput {

historyMetrics?: any;

indices?: {

ndx?: {
value?: number;
change?: number;
};

spx?: {
value?: number;
change?: number;
};

rut?: {
value?: number;
change?: number;
};

};

rotation?: any;

structure?: any;

participation?: any;

breadthThrust?: any;

liquidity?: any;

fragility?: any;

crash?: any;

}


/* =====================================================
OUTPUT
===================================================== */

export interface PriceMomentumResult {

/* ================= PRICE ================= */

ndx: {
value: number;

momentum5D: number;
momentum20D: number;

acceleration: number;

trend: PriceTrend;
direction: PriceDirection;

score: number;
};

spx: {
value: number;

momentum5D: number;
momentum20D: number;

acceleration: number;

trend: PriceTrend;
direction: PriceDirection;

score: number;
};

rut: {
value: number;

momentum5D: number;
momentum20D: number;

acceleration: number;

trend: PriceTrend;
direction: PriceDirection;

score: number;
};


/* ================= AGGREGATE ================= */

momentum5D: number;

momentum20D: number;

acceleration: number;

score: number;

trend: PriceTrend;

direction: PriceDirection;

state: PriceMomentumState;


/* ================= STRUCTURE ================= */

structureScore: number;

structureAlignment:
| PriceStructureAlignment
| "UNKNOWN";


/* ================= TRADE CONTEXT ================= */

earlyBullish:
boolean;

earlyBearish:
boolean;

bullishImpulse:
boolean;

bearishImpulse:
boolean;

cooling:
boolean;

accelerating:
boolean;

decelerating:
boolean;

priceLeadingStructure:
boolean;

structureLeadingPrice:
boolean;

conflict:
boolean;

summary: string;

}


/* =====================================================
HELPERS
===================================================== */

function num(
value: any,
fallback = 0
): number {

const n = Number(value);

return Number.isFinite(n)
? n
: fallback;
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
Math.min(max, value)
);

}


/* =====================================================
NORMALIZE MOMENTUM
===================================================== */

/*
Momentum is percentage.

Example:

+10% -> strongly bullish
+5% -> bullish
+1% -> neutral/slightly bullish
0% -> neutral
-5% -> bearish
-10% -> strongly bearish

The thresholds deliberately avoid reacting to
normal daily noise.
*/

function momentumScore(
momentum5D: number,
momentum20D: number
): number {

const shortScore =
clamp(
momentum5D * 5,
-50,
50
);

const mediumScore =
clamp(
momentum20D * 3,
-50,
50
);

return Math.round(
clamp(
50 +
shortScore * 0.55 +
mediumScore * 0.45,
0,
100
)
);

}


/* =====================================================
TREND CLASSIFICATION
===================================================== */

function classifyTrend(
score: number
): PriceTrend {

if (score >= 75)
return "STRONG_BULLISH";

if (score >= 60)
return "BULLISH";

if (score <= 25)
return "STRONG_BEARISH";

if (score <= 40)
return "BEARISH";

return "NEUTRAL";

}


/* =====================================================
DIRECTION
===================================================== */

function direction(
momentum5D: number,
momentum20D: number
): PriceDirection {

const combined =
momentum5D * 0.6 +
momentum20D * 0.4;

if (combined > 0.5)
return "UP";

if (combined < -0.5)
return "DOWN";

return "FLAT";

}


/* =====================================================
STRUCTURE SCORE
===================================================== */

function getStructureScore(
input: PriceMomentumInput
): number {

const breadth =
num(
input.structure?.breadth?.b50?.value,
50
);

const participation =
num(
input.participation?.score,
50
);

const rotation =
num(
input.rotation?.score,
50
);

const liquidity =
num(
input.liquidity?.score,
50
);

const fragility =
num(
input.fragility?.score,
50
);

/*
Fragility is inverse.

80 fragility is bad.
20 fragility is good.
*/

const fragilityHealth =
100 - fragility;

const score =
breadth * 0.30 +
participation * 0.25 +
rotation * 0.20 +
liquidity * 0.10 +
fragilityHealth * 0.15;

return Math.round(
clamp(score, 0, 100)
);

}


/* =====================================================
STRUCTURE ALIGNMENT
===================================================== */

function classifyAlignment(
priceScore: number,
structureScore: number
): PriceStructureAlignment {

const priceBull =
priceScore >= 60;

const priceBear =
priceScore <= 40;

const structureBull =
structureScore >= 60;

const structureBear =
structureScore <= 40;


if (
priceBull &&
structureBull
) {

return "CONFIRMED_BULLISH";

}


if (
priceBear &&
structureBear
) {

return "CONFIRMED_BEARISH";

}


if (
priceBull &&
!structureBear
) {

return "BULLISH";

}


if (
priceBear &&
!structureBull
) {

return "BEARISH";

}


return "CONFLICT";

}


/* =====================================================
MOMENTUM STATE
===================================================== */

function classifyState(
score: number,
momentum5D: number,
momentum20D: number,
acceleration: number
): PriceMomentumState {

/*
Strong immediate upside.

This is the important fast signal.
*/

if (
momentum5D >= 3 &&
momentum20D >= 5 &&
acceleration >= 0
) {

return "STRONG_BULLISH";

}


/*
Strong trend but short-term cooling.

Example:
+5% 20D
+1% 5D
negative acceleration

This is still bullish.
*/

if (
momentum20D >= 4 &&
momentum5D >= 0 &&
acceleration < 0
) {

return "BULLISH_COOLING";

}


if (
score >= 65
) {

return "BULLISH";

}


/*
Fast downside acceleration.
*/

if (
momentum5D <= -3 &&
momentum20D <= -4 &&
acceleration <= 0
) {

return "STRONG_BEARISH";

}


/*
Medium-term bearish but short-term
downside is still developing.
*/

if (
momentum20D <= -4 &&
momentum5D <= 0 &&
acceleration > 0
) {

return "BEARISH_BUILDING";

}


if (
score <= 35
) {

return "BEARISH";

}


return "NEUTRAL";

}


/* =====================================================
SUMMARY
===================================================== */

function buildSummary(
state: PriceMomentumState,
alignment: PriceStructureAlignment | "UNKNOWN",
momentum5D: number,
momentum20D: number,
acceleration: number
): string {

const short =
`${momentum5D >= 0 ? "+" : ""}${momentum5D.toFixed(2)}% 5D`;

const medium =
`${momentum20D >= 0 ? "+" : ""}${momentum20D.toFixed(2)}% 20D`;

const accel =
`${acceleration >= 0 ? "+" : ""}${acceleration.toFixed(2)}`;

return (
`PRICE ${state} | ` +
`${short} | ` +
`${medium} | ` +
`ACC ${accel} | ` +
`STRUCTURE ${alignment}`
);

}


/* =====================================================
ENGINE
===================================================== */

export function priceMomentumEngine(
input: PriceMomentumInput
): PriceMomentumResult {


/* ===================================================
INDEX DATA
=================================================== */

const ndxValue =
num(
input.indices?.ndx?.value,
0
);

const spxValue =
num(
input.indices?.spx?.value,
0
);

const rutValue =
num(
input.indices?.rut?.value,
0
);


/* ===================================================
HISTORY METRICS
=================================================== */

const history =
input.historyMetrics ?? {};


const ndxMomentum5D =
num(
history.ndxMomentum5D,
0
);

const ndxMomentum20D =
num(
history.ndxMomentum20D,
0
);

const ndxAcceleration =
num(
history.ndxAcceleration,
0
);


const spxMomentum5D =
num(
history.spxMomentum5D,
0
);

const spxMomentum20D =
num(
history.spxMomentum20D,
0
);

const spxAcceleration =
num(
history.spxAcceleration,
0
);


const rutMomentum5D =
num(
history.rutMomentum5D,
0
);

const rutMomentum20D =
num(
history.rutMomentum20D,
0
);

const rutAcceleration =
num(
history.rutAcceleration,
0
);


/* ===================================================
INDIVIDUAL SCORES
=================================================== */

const ndxScore =
momentumScore(
ndxMomentum5D,
ndxMomentum20D
);

const spxScore =
momentumScore(
spxMomentum5D,
spxMomentum20D
);

const rutScore =
momentumScore(
rutMomentum5D,
rutMomentum20D
);


/* ===================================================
AGGREGATE PRICE MOMENTUM
=================================================== */

/*
NASDAQ gets the largest weight because this is
the primary instrument of the rotation strategy.

Russell gets second-largest weight because it is
the rotation counterpart.

SPX provides broad market confirmation.
*/

const momentum5D =
ndxMomentum5D * 0.50 +
rutMomentum5D * 0.30 +
spxMomentum5D * 0.20;


const momentum20D =
ndxMomentum20D * 0.50 +
rutMomentum20D * 0.30 +
spxMomentum20D * 0.20;


const acceleration =
ndxAcceleration * 0.50 +
rutAcceleration * 0.30 +
spxAcceleration * 0.20;


const score =
Math.round(
clamp(
momentumScore(
momentum5D,
momentum20D
),
0,
100
)
);


const trend =
classifyTrend(score);


const dir =
direction(
momentum5D,
momentum20D
);


const state =
classifyState(
score,
momentum5D,
momentum20D,
acceleration
);


/* ===================================================
STRUCTURE
=================================================== */

const structureScore =
getStructureScore(input);


const structureAlignment =
classifyAlignment(
score,
structureScore
);


/* ===================================================
CONTEXT FLAGS
=================================================== */

const earlyBullish =
momentum5D >= 1 &&
momentum20D >= 2 &&
acceleration >= -0.5;


const earlyBearish =
momentum5D <= -1 &&
momentum20D <= -2 &&
acceleration <= 0.5;


const bullishImpulse =
momentum5D >= 3 &&
acceleration >= 0.5;


const bearishImpulse =
momentum5D <= -3 &&
acceleration <= -0.5;


const cooling =
momentum20D > 2 &&
momentum5D < momentum20D * 0.35 &&
acceleration < 0;


const accelerating =
acceleration >= 0.5;


const decelerating =
acceleration <= -0.5;


const priceLeadingStructure =
(
score >= 60 &&
structureScore < 55
);


const structureLeadingPrice =
(
structureScore >= 60 &&
score < 55
);


const conflict =
structureAlignment === "CONFLICT";


/* ===================================================
SUMMARY
=================================================== */

const summary =
buildSummary(
state,
structureAlignment,
momentum5D,
momentum20D,
acceleration
);


/* ===================================================
RETURN
=================================================== */

return {

ndx: {

value: ndxValue,

momentum5D:
ndxMomentum5D,

momentum20D:
ndxMomentum20D,

acceleration:
ndxAcceleration,

trend:
classifyTrend(ndxScore),

direction:
direction(
ndxMomentum5D,
ndxMomentum20D
),

score:
ndxScore

},


spx: {

value: spxValue,

momentum5D:
spxMomentum5D,

momentum20D:
spxMomentum20D,

acceleration:
spxAcceleration,

trend:
classifyTrend(spxScore),

direction:
direction(
spxMomentum5D,
spxMomentum20D
),

score:
spxScore

},


rut: {

value: rutValue,

momentum5D:
rutMomentum5D,

momentum20D:
rutMomentum20D,

acceleration:
rutAcceleration,

trend:
classifyTrend(rutScore),

direction:
direction(
rutMomentum5D,
rutMomentum20D
),

score:
rutScore

},


momentum5D,

momentum20D,

acceleration,

score,

trend,

direction:
dir,

state,

structureScore,

structureAlignment,

earlyBullish,

earlyBearish,

bullishImpulse,

bearishImpulse,

cooling,

accelerating,

decelerating,

priceLeadingStructure,

structureLeadingPrice,

conflict,

summary

};

}
