import type {
HistoricalRegimeFeatures,
} from "./historicalRegimeFeatures";

/* =====================================================
HISTORICAL REGIME — PRICE / VIX FEATURES

Purpose:
- Analyze Nasdaq price structure independently
- Analyze VIX independently of market breadth
- Identify price/volatility divergences
- Identify observable trend transitions
- Preserve historical as-of correctness

No trading recommendations.
No synthetic market phases.
No Master Score.
No forward returns.
No threshold optimization.
===================================================== */

/* =====================================================
TYPES
===================================================== */

export type HistoricalPriceTrendState =
| "ABOVE_MA50_AND_MA200"
| "BELOW_MA50_ABOVE_MA200"
| "ABOVE_MA50_BELOW_MA200"
| "BELOW_MA50_AND_MA200"
| "INSUFFICIENT_DATA";

export type HistoricalVixTrendState =
| "RISING_ABOVE_MA20"
| "RISING_BELOW_MA20"
| "FALLING_ABOVE_MA20"
| "FALLING_BELOW_MA20"
| "MIXED_OR_FLAT"
| "INSUFFICIENT_DATA";

export type HistoricalPriceVixDivergence =
| "NASDAQ_UP_VIX_UP"
| "NASDAQ_UP_VIX_DOWN"
| "NASDAQ_DOWN_VIX_UP"
| "NASDAQ_DOWN_VIX_DOWN"
| "MIXED_OR_FLAT"
| "INSUFFICIENT_DATA";

export type HistoricalPriceTransition =
| "BREAK_BELOW_MA50"
| "RECOVER_ABOVE_MA50"
| "BREAK_BELOW_MA200"
| "RECOVER_ABOVE_MA200"
| "NONE";

export type HistoricalPriceVixFeatureDay = {
date: string;

nasdaq: number;
vix: number;

nasdaqReturn5D: number | null;
nasdaqReturn20D: number | null;
nasdaqReturn60D: number | null;

nasdaqDistanceMA20: number | null;
nasdaqDistanceMA50: number | null;
nasdaqDistanceMA200: number | null;

nasdaqDrawdown20D: number | null;
nasdaqDrawdown60D: number | null;

vixChange5D: number | null;
vixChange20D: number | null;
vixDistanceMA20: number | null;

priceTrendState: HistoricalPriceTrendState;

vixTrendState5D: HistoricalVixTrendState;
vixTrendState20D: HistoricalVixTrendState;

priceVixDivergence5D:
HistoricalPriceVixDivergence;

priceVixDivergence20D:
HistoricalPriceVixDivergence;

transitions: HistoricalPriceTransition[];

priceWeaknessVixConfirmation: boolean | null;

priceStrengthVixConfirmation: boolean | null;
};

export type HistoricalPriceVixFeatureDataset = {
days: HistoricalPriceVixFeatureDay[];

count: number;

firstDate: string | null;
lastDate: string | null;

diagnostics: {
inputDays: number;

validPriceTrendDays: number;
validVixTrend5DDays: number;
validVixTrend20DDays: number;

validDivergence5DDays: number;
validDivergence20DDays: number;

transitionCounts: {
breakBelowMA50: number;
recoverAboveMA50: number;

breakBelowMA200: number;
recoverAboveMA200: number;
};

priceTrendCounts:
Record<HistoricalPriceTrendState, number>;

divergence20DCounts:
Record<HistoricalPriceVixDivergence, number>;

chronological: boolean;
duplicateDates: number;
};
};

/* =====================================================
HELPERS
===================================================== */

function valid(
value: number | null | undefined,
): value is number {
return (
typeof value === "number" &&
Number.isFinite(value)
);
}

function sign(
value: number | null,
): -1 | 0 | 1 | null {
if (!valid(value)) {
return null;
}

if (value > 0) {
return 1;
}

if (value < 0) {
return -1;
}

return 0;
}

/* =====================================================
PRICE TREND
===================================================== */

function classifyPriceTrend(
distanceMA50: number | null,
distanceMA200: number | null,
): HistoricalPriceTrendState {
if (
!valid(distanceMA50) ||
!valid(distanceMA200)
) {
return "INSUFFICIENT_DATA";
}

const aboveMA50 =
distanceMA50 >= 0;

const aboveMA200 =
distanceMA200 >= 0;

if (aboveMA50 && aboveMA200) {
return "ABOVE_MA50_AND_MA200";
}

if (!aboveMA50 && aboveMA200) {
return "BELOW_MA50_ABOVE_MA200";
}

if (aboveMA50 && !aboveMA200) {
return "ABOVE_MA50_BELOW_MA200";
}

return "BELOW_MA50_AND_MA200";
}

/* =====================================================
VIX TREND
===================================================== */

function classifyVixTrend(
change: number | null,
distanceMA20: number | null,
): HistoricalVixTrendState {
if (
!valid(change) ||
!valid(distanceMA20)
) {
return "INSUFFICIENT_DATA";
}

if (change > 0 && distanceMA20 >= 0) {
return "RISING_ABOVE_MA20";
}

if (change > 0 && distanceMA20 < 0) {
return "RISING_BELOW_MA20";
}

if (change < 0 && distanceMA20 >= 0) {
return "FALLING_ABOVE_MA20";
}

if (change < 0 && distanceMA20 < 0) {
return "FALLING_BELOW_MA20";
}

return "MIXED_OR_FLAT";
}

/* =====================================================
PRICE / VIX DIVERGENCE

This is a descriptive joint-direction state.
It does not assert predictive divergence.
===================================================== */

function classifyPriceVix(
nasdaqReturn: number | null,
vixChange: number | null,
): HistoricalPriceVixDivergence {
const priceSign = sign(
nasdaqReturn,
);

const vixSign = sign(
vixChange,
);

if (
priceSign === null ||
vixSign === null
) {
return "INSUFFICIENT_DATA";
}

if (priceSign === 1 && vixSign === 1) {
return "NASDAQ_UP_VIX_UP";
}

if (priceSign === 1 && vixSign === -1) {
return "NASDAQ_UP_VIX_DOWN";
}

if (priceSign === -1 && vixSign === 1) {
return "NASDAQ_DOWN_VIX_UP";
}

if (priceSign === -1 && vixSign === -1) {
return "NASDAQ_DOWN_VIX_DOWN";
}

return "MIXED_OR_FLAT";
}

/* =====================================================
PRICE TRANSITIONS

A transition is registered only when the previous
and current observations are both valid.

A missing previous value never creates an event.
===================================================== */

function detectTransition(
previous: number | null,
current: number | null,
breakName: HistoricalPriceTransition,
recoveryName: HistoricalPriceTransition,
): HistoricalPriceTransition | null {
if (
!valid(previous) ||
!valid(current)
) {
return null;
}

if (previous >= 0 && current < 0) {
return breakName;
}

if (previous < 0 && current >= 0) {
return recoveryName;
}

return null;
}

/* =====================================================
BUILD FEATURES
===================================================== */

export function buildHistoricalRegimePriceVixFeatures(
marketFeatures: HistoricalRegimeFeatures[],
): HistoricalPriceVixFeatureDataset {
const sorted = [...marketFeatures].sort(
(a, b) =>
a.date.localeCompare(b.date),
);

const days: HistoricalPriceVixFeatureDay[] =
[];

let duplicateDates = 0;

const seenDates = new Set<string>();

const transitionCounts = {
breakBelowMA50: 0,
recoverAboveMA50: 0,

breakBelowMA200: 0,
recoverAboveMA200: 0,
};

const priceTrendCounts:
Record<HistoricalPriceTrendState, number> = {
ABOVE_MA50_AND_MA200: 0,
BELOW_MA50_ABOVE_MA200: 0,
ABOVE_MA50_BELOW_MA200: 0,
BELOW_MA50_AND_MA200: 0,
INSUFFICIENT_DATA: 0,
};

const divergence20DCounts:
Record<HistoricalPriceVixDivergence, number> = {
NASDAQ_UP_VIX_UP: 0,
NASDAQ_UP_VIX_DOWN: 0,
NASDAQ_DOWN_VIX_UP: 0,
NASDAQ_DOWN_VIX_DOWN: 0,
MIXED_OR_FLAT: 0,
INSUFFICIENT_DATA: 0,
};

let validPriceTrendDays = 0;

let validVixTrend5DDays = 0;
let validVixTrend20DDays = 0;

let validDivergence5DDays = 0;
let validDivergence20DDays = 0;

let previous:
HistoricalRegimeFeatures | null = null;

for (const current of sorted) {
if (
seenDates.has(current.date)
) {
duplicateDates += 1;
continue;
}

seenDates.add(current.date);

const priceTrendState =
classifyPriceTrend(
current.nasdaqDistanceMA50,
current.nasdaqDistanceMA200,
);

const vixTrendState5D =
classifyVixTrend(
current.vixChange5D,
current.vixDistanceMA20,
);

const vixTrendState20D =
classifyVixTrend(
current.vixChange20D,
current.vixDistanceMA20,
);

const priceVixDivergence5D =
classifyPriceVix(
current.nasdaqReturn5D,
current.vixChange5D,
);

const priceVixDivergence20D =
classifyPriceVix(
current.nasdaqReturn20D,
current.vixChange20D,
);

const transitions:
HistoricalPriceTransition[] = [];

if (previous) {
const ma50Transition =
detectTransition(
previous.nasdaqDistanceMA50,
current.nasdaqDistanceMA50,
"BREAK_BELOW_MA50",
"RECOVER_ABOVE_MA50",
);

if (ma50Transition) {
transitions.push(
ma50Transition,
);
}

const ma200Transition =
detectTransition(
previous.nasdaqDistanceMA200,
current.nasdaqDistanceMA200,
"BREAK_BELOW_MA200",
"RECOVER_ABOVE_MA200",
);

if (ma200Transition) {
transitions.push(
ma200Transition,
);
}
}

for (const transition of transitions) {
switch (transition) {
case "BREAK_BELOW_MA50":
transitionCounts.breakBelowMA50++;
break;

case "RECOVER_ABOVE_MA50":
transitionCounts.recoverAboveMA50++;
break;

case "BREAK_BELOW_MA200":
transitionCounts.breakBelowMA200++;
break;

case "RECOVER_ABOVE_MA200":
transitionCounts.recoverAboveMA200++;
break;

default:
break;
}
}

if (
priceTrendState !==
"INSUFFICIENT_DATA"
) {
validPriceTrendDays++;
}

if (
vixTrendState5D !==
"INSUFFICIENT_DATA"
) {
validVixTrend5DDays++;
}

if (
vixTrendState20D !==
"INSUFFICIENT_DATA"
) {
validVixTrend20DDays++;
}

if (
priceVixDivergence5D !==
"INSUFFICIENT_DATA"
) {
validDivergence5DDays++;
}

if (
priceVixDivergence20D !==
"INSUFFICIENT_DATA"
) {
validDivergence20DDays++;
}

priceTrendCounts[
priceTrendState
]++;

divergence20DCounts[
priceVixDivergence20D
]++;

const priceWeaknessVixConfirmation =
valid(current.nasdaqReturn20D) &&
valid(current.vixChange20D)
? (
current.nasdaqReturn20D < 0 &&
current.vixChange20D > 0
)
: null;

const priceStrengthVixConfirmation =
valid(current.nasdaqReturn20D) &&
valid(current.vixChange20D)
? (
current.nasdaqReturn20D > 0 &&
current.vixChange20D < 0
)
: null;

days.push({
date:
current.date,

nasdaq:
current.nasdaq,

vix:
current.vix,

nasdaqReturn5D:
current.nasdaqReturn5D,

nasdaqReturn20D:
current.nasdaqReturn20D,

nasdaqReturn60D:
current.nasdaqReturn60D,

nasdaqDistanceMA20:
current.nasdaqDistanceMA20,

nasdaqDistanceMA50:
current.nasdaqDistanceMA50,

nasdaqDistanceMA200:
current.nasdaqDistanceMA200,

nasdaqDrawdown20D:
current.nasdaqDrawdown20D,

nasdaqDrawdown60D:
current.nasdaqDrawdown60D,

vixChange5D:
current.vixChange5D,

vixChange20D:
current.vixChange20D,

vixDistanceMA20:
current.vixDistanceMA20,

priceTrendState,

vixTrendState5D,
vixTrendState20D,

priceVixDivergence5D,
priceVixDivergence20D,

transitions,

priceWeaknessVixConfirmation,

priceStrengthVixConfirmation,
});

previous = current;
}

return {
days,

count:
days.length,

firstDate:
days[0]?.date ?? null,

lastDate:
days[days.length - 1]?.date ?? null,

diagnostics: {
inputDays:
marketFeatures.length,

validPriceTrendDays,
validVixTrend5DDays,
validVixTrend20DDays,

validDivergence5DDays,
validDivergence20DDays,

transitionCounts,

priceTrendCounts,
divergence20DCounts,

chronological:
days.every(
(day, index) =>
index === 0 ||
day.date >
days[index - 1].date,
),

duplicateDates,
},
};
}

