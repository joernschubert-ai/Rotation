import type {
HistoricalRatesAlignedDay,
} from "./historicalRegimeRatesAlignment";


/* =====================================================
HISTORICAL REGIME FEATURES

Purpose:
- Build observable historical market features
- Use only real aligned historical market data
- Use only rates known as-of historical day T
- No Rotation-App engine reconstruction
- No synthetic Master Scores
- No synthetic market phases
- No similarity scoring
===================================================== */


export type HistoricalRegimeFeatures = {

date: string;


/* ================= PRICE LEVELS ================= */

nasdaq: number;
sp500: number;
russell: number;
vix: number;


/* ================= RATES ================= */

fedFunds: number;

treasury2Y: number;

treasury10Y: number;

treasury10Y2YSpread: number;


/* ================= NASDAQ RETURNS ================= */

nasdaqReturn5D: number | null;
nasdaqReturn20D: number | null;
nasdaqReturn60D: number | null;


/* ================= S&P 500 RETURNS ================= */

sp500Return20D: number | null;


/* ================= RUSSELL RETURNS ================= */

russellReturn20D: number | null;


/* ================= RELATIVE STRENGTH ================= */

russellVsNasdaq20D: number | null;


/* ================= NASDAQ TREND ================= */

nasdaqMA20: number | null;
nasdaqMA50: number | null;
nasdaqMA200: number | null;

nasdaqDistanceMA20: number | null;
nasdaqDistanceMA50: number | null;
nasdaqDistanceMA200: number | null;


/* ================= DRAWDOWN ================= */

nasdaqDrawdown20D: number | null;
nasdaqDrawdown60D: number | null;


/* ================= VOLATILITY ================= */

vixChange5D: number | null;
vixChange20D: number | null;

vixMA20: number | null;

vixDistanceMA20: number | null;
};


/* =====================================================
HELPERS
===================================================== */

function percentChange(
current: number,
previous: number
): number | null {

if (
!Number.isFinite(current) ||
!Number.isFinite(previous) ||
previous === 0
) {
return null;
}

return (
(current / previous) - 1
) * 100;
}


function historicalReturn(
values: number[],
index: number,
lookback: number
): number | null {

if (
index < lookback ||
index >= values.length
) {
return null;
}

return percentChange(
values[index],
values[index - lookback]
);
}


function movingAverageAt(
values: number[],
index: number,
period: number
): number | null {

if (
period <= 0 ||
index < period - 1 ||
index >= values.length
) {
return null;
}

let sum = 0;

for (
let i = index - period + 1;
i <= index;
i++
) {

const value =
values[i];

if (!Number.isFinite(value)) {
return null;
}

sum += value;
}

return sum / period;
}


function distanceFromAverage(
value: number,
average: number | null
): number | null {

if (
average === null ||
average === 0 ||
!Number.isFinite(value)
) {
return null;
}

return (
(value / average) - 1
) * 100;
}


function drawdownAt(
values: number[],
index: number,
period: number
): number | null {

if (
index < period - 1 ||
index >= values.length
) {
return null;
}

let high =
Number.NEGATIVE_INFINITY;

for (
let i = index - period + 1;
i <= index;
i++
) {

const value =
values[i];

if (!Number.isFinite(value)) {
return null;
}

if (value > high) {
high = value;
}
}

if (
!Number.isFinite(high) ||
high === 0
) {
return null;
}

return (
(values[index] / high) - 1
) * 100;
}


/* =====================================================
BUILD FEATURES
===================================================== */

export function buildHistoricalRegimeFeatures(
days: HistoricalRatesAlignedDay[]
): HistoricalRegimeFeatures[] {

if (!days.length) {
return [];
}


const nasdaq =
days.map(
day => day.nasdaq
);

const sp500 =
days.map(
day => day.sp500
);

const russell =
days.map(
day => day.russell
);

const vix =
days.map(
day => day.vix
);


return days.map(
(day, index) => {

/* =============================================
RETURNS
============================================= */

const nasdaqReturn5D =
historicalReturn(
nasdaq,
index,
5
);

const nasdaqReturn20D =
historicalReturn(
nasdaq,
index,
20
);

const nasdaqReturn60D =
historicalReturn(
nasdaq,
index,
60
);


const sp500Return20D =
historicalReturn(
sp500,
index,
20
);


const russellReturn20D =
historicalReturn(
russell,
index,
20
);


/* =============================================
RELATIVE STRENGTH

Positive:
Russell outperformed Nasdaq over 20 sessions.

Negative:
Russell underperformed Nasdaq.
============================================= */

const russellVsNasdaq20D =
russellReturn20D !== null &&
nasdaqReturn20D !== null
? russellReturn20D -
nasdaqReturn20D
: null;


/* =============================================
NASDAQ MOVING AVERAGES
============================================= */

const nasdaqMA20 =
movingAverageAt(
nasdaq,
index,
20
);

const nasdaqMA50 =
movingAverageAt(
nasdaq,
index,
50
);

const nasdaqMA200 =
movingAverageAt(
nasdaq,
index,
200
);


const nasdaqDistanceMA20 =
distanceFromAverage(
day.nasdaq,
nasdaqMA20
);

const nasdaqDistanceMA50 =
distanceFromAverage(
day.nasdaq,
nasdaqMA50
);

const nasdaqDistanceMA200 =
distanceFromAverage(
day.nasdaq,
nasdaqMA200
);


/* =============================================
NASDAQ DRAWDOWN
============================================= */

const nasdaqDrawdown20D =
drawdownAt(
nasdaq,
index,
20
);

const nasdaqDrawdown60D =
drawdownAt(
nasdaq,
index,
60
);


/* =============================================
VIX
============================================= */

const vixChange5D =
historicalReturn(
vix,
index,
5
);

const vixChange20D =
historicalReturn(
vix,
index,
20
);


const vixMA20 =
movingAverageAt(
vix,
index,
20
);


const vixDistanceMA20 =
distanceFromAverage(
day.vix,
vixMA20
);


/* =============================================
OUTPUT

Rates are already validated as-of values.
No source date is allowed to be > day.date.
============================================= */

return {

date:
day.date,

nasdaq:
day.nasdaq,

sp500:
day.sp500,

russell:
day.russell,

vix:
day.vix,


fedFunds:
day.rates.fedFunds,

treasury2Y:
day.rates.treasury2Y,

treasury10Y:
day.rates.treasury10Y,

treasury10Y2YSpread:
day.rates.treasury10Y2YSpread,


nasdaqReturn5D,
nasdaqReturn20D,
nasdaqReturn60D,

sp500Return20D,

russellReturn20D,

russellVsNasdaq20D,

nasdaqMA20,
nasdaqMA50,
nasdaqMA200,

nasdaqDistanceMA20,
nasdaqDistanceMA50,
nasdaqDistanceMA200,

nasdaqDrawdown20D,
nasdaqDrawdown60D,

vixChange5D,
vixChange20D,

vixMA20,
vixDistanceMA20,

};

}
);
}
