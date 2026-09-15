// /lib/forwardTest/forwardTestMetrics.ts

import type {
ForwardExcursion,
ForwardHorizon,
ForwardMarketSnapshot,
ForwardReturn,
ForwardTestDirection,
ForwardTestObservation,
} from "./forwardTestTypes";


/* =====================================================
* SAFE HELPERS
* ===================================================== */

function finiteNumber(
value: unknown
): number | null {

const number =
Number(value);

return Number.isFinite(number)
? number
: null;

}


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
* DIRECTION
* ===================================================== */

export function determineDirection(
percentageChange: number | null
): ForwardTestDirection {

if (
percentageChange === null ||
!Number.isFinite(percentageChange)
) {

return "FLAT";

}

if (
percentageChange > 0
) {

return "UP";

}

if (
percentageChange < 0
) {

return "DOWN";

}

return "FLAT";

}


/* =====================================================
* FORWARD RETURN
* ===================================================== */

export function calculateForwardReturn(
entryPrice: number,
futurePrice: number
): number | null {

if (
!Number.isFinite(entryPrice) ||
!Number.isFinite(futurePrice) ||
entryPrice === 0
) {

return null;

}

return (
(futurePrice - entryPrice) /
entryPrice
) * 100;

}


/* =====================================================
* DIRECTIONAL RETURN
* ===================================================== */

/**
* Converts the underlying return into directional
* trade performance.
*
* CALL:
* market up -> positive
* market down -> negative
*
* PUT:
* market down -> positive
* market up -> negative
*/
export function calculateDirectionalReturn(
underlyingReturn: number,
direction: "CALL" | "PUT"
): number {

if (
direction === "PUT"
) {

return -underlyingReturn;

}

return underlyingReturn;

}


/* =====================================================
* FORWARD RETURN OBJECT
* ===================================================== */

export function buildForwardReturn(
entrySnapshot: ForwardMarketSnapshot,
futureSnapshot: ForwardMarketSnapshot,
horizon: ForwardHorizon
): ForwardReturn | null {

const startPrice =
finiteNumber(
entrySnapshot.ndx
);

const endPrice =
finiteNumber(
futureSnapshot.ndx
);

if (
startPrice === null ||
endPrice === null
) {

return null;

}

const absoluteChange =
endPrice -
startPrice;

const percentageChange =
calculateForwardReturn(
startPrice,
endPrice
);

return {

horizon,

startPrice,

endPrice,

absoluteChange,

percentageChange,

direction:
determineDirection(
percentageChange
),

};

}


/* =====================================================
* MAXIMUM FAVORABLE EXCURSION
* ===================================================== */

export function calculateMaximumFavorableExcursion(
entryPrice: number,
futureSnapshots: ForwardMarketSnapshot[],
direction: "CALL" | "PUT"
): number | null {

if (
!Number.isFinite(entryPrice) ||
entryPrice === 0 ||
futureSnapshots.length === 0
) {

return null;

}

const prices =
futureSnapshots
.map(
snapshot =>
finiteNumber(
snapshot.ndx
)
)
.filter(
(
price
): price is number =>
price !== null
);

if (
prices.length === 0
) {

return null;

}

const favorablePrice =
direction === "CALL"
? Math.max(...prices)
: Math.min(...prices);

const excursion =
direction === "CALL"
? (
(favorablePrice - entryPrice) /
entryPrice
) * 100
: (
(entryPrice - favorablePrice) /
entryPrice
) * 100;

return excursion;

}


/* =====================================================
* MAXIMUM ADVERSE EXCURSION
* ===================================================== */

export function calculateMaximumAdverseExcursion(
entryPrice: number,
futureSnapshots: ForwardMarketSnapshot[],
direction: "CALL" | "PUT"
): number | null {

if (
!Number.isFinite(entryPrice) ||
entryPrice === 0 ||
futureSnapshots.length === 0
) {

return null;

}

const prices =
futureSnapshots
.map(
snapshot =>
finiteNumber(
snapshot.ndx
)
)
.filter(
(
price
): price is number =>
price !== null
);

if (
prices.length === 0
) {

return null;

}

const adversePrice =
direction === "CALL"
? Math.min(...prices)
: Math.max(...prices);

const excursion =
direction === "CALL"
? (
(adversePrice - entryPrice) /
entryPrice
) * 100
: (
(entryPrice - adversePrice) /
entryPrice
) * 100;

return excursion;

}


/* =====================================================
* EXCURSION OBJECT
* ===================================================== */

export function buildForwardExcursion(
entrySnapshot: ForwardMarketSnapshot,
futureSnapshots: ForwardMarketSnapshot[],
horizon: ForwardHorizon,
direction: "CALL" | "PUT"
): ForwardExcursion | null {

const entryPrice =
finiteNumber(
entrySnapshot.ndx
);

if (
entryPrice === null
) {

return null;

}

const mfe =
calculateMaximumFavorableExcursion(
entryPrice,
futureSnapshots,
direction
);

const mae =
calculateMaximumAdverseExcursion(
entryPrice,
futureSnapshots,
direction
);

if (
mfe === null ||
mae === null
) {

return null;

}

return {

horizon,

maximumFavorableExcursion:
mfe,

maximumAdverseExcursion:
mae,

};

}


/* =====================================================
* HIT TESTS
* ===================================================== */

export function didHitTarget(
directionalReturn: number | null,
targetPct: number
): boolean {

if (
directionalReturn === null
) {

return false;

}

return (
directionalReturn >=
targetPct
);

}


export function didHitStop(
directionalReturn: number | null,
stopPct: number
): boolean {

if (
directionalReturn === null
) {

return false;

}

return (
directionalReturn <=
stopPct
);

}


/* =====================================================
* OBSERVATION RETURN
* ===================================================== */

export function calculateObservationReturn(
observation: ForwardTestObservation,
futureSnapshot: ForwardMarketSnapshot,
horizon: ForwardHorizon
): ForwardReturn | null {

return buildForwardReturn(
observation.market,
futureSnapshot,
horizon
);

}


/* =====================================================
* NORMALIZED PERFORMANCE SCORE
* ===================================================== */

/**
* Helper only.
*
* This is NOT the Master Score.
*
* -100% -> 0
* 0% -> 50
* +100% -> 100
*/
export function normalizePerformanceScore(
returnPct: number
): number {

if (
!Number.isFinite(returnPct)
) {

return 50;

}

return clamp(
50 +
(
returnPct /
2
),
0,
100
);

}


/* =====================================================
* ROUNDING
* ===================================================== */

export function roundMetric(
value: number,
decimals = 2
): number {

if (
!Number.isFinite(value)
) {

return 0;

}

const factor =
Math.pow(
10,
decimals
);

return (
Math.round(
value * factor
) /
factor
);

}
