import { NextResponse } from "next/server";

import {
loadHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeProvider";

import {
alignHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeAlignment";

import {
loadHistoricalRegimeRatesData,
} from "@/lib/historicalRegime/historicalRegimeRatesProvider";

import {
alignHistoricalRegimeRates,
} from "@/lib/historicalRegime/historicalRegimeRatesAlignment";

import {
buildHistoricalRegimeFeatures,
} from "@/lib/historicalRegime/historicalRegimeFeatures";

import {
buildHistoricalRegimePriceVixFeatures,
} from "@/lib/historicalRegime/historicalRegimePriceVixFeatures";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
HISTORICAL PRICE / VIX FEATURE TEST

Purpose:
- Validate historical price/VIX features
- Verify exact source alignment
- Verify MA50/MA200 transitions
- Verify 5D/20D price-VIX classifications
- Verify no duplicate dates
- Inspect latest market conditions

No forward-return research yet.
No signals.
No optimization.
===================================================== */

function valid(
value: number | null | undefined,
): value is number {
return (
typeof value === "number" &&
Number.isFinite(value)
);
}

function round(
value: number | null | undefined,
decimals = 4,
): number | null {
return valid(value)
? Number(value.toFixed(decimals))
: null;
}

function expectedPriceTrend(
distanceMA50: number | null,
distanceMA200: number | null,
): string {
if (
!valid(distanceMA50) ||
!valid(distanceMA200)
) {
return "INSUFFICIENT_DATA";
}

if (
distanceMA50 >= 0 &&
distanceMA200 >= 0
) {
return "ABOVE_MA50_AND_MA200";
}

if (
distanceMA50 < 0 &&
distanceMA200 >= 0
) {
return "BELOW_MA50_ABOVE_MA200";
}

if (
distanceMA50 >= 0 &&
distanceMA200 < 0
) {
return "ABOVE_MA50_BELOW_MA200";
}

return "BELOW_MA50_AND_MA200";
}

function expectedVixTrend(
change: number | null,
distanceMA20: number | null,
): string {
if (
!valid(change) ||
!valid(distanceMA20)
) {
return "INSUFFICIENT_DATA";
}

if (
change > 0 &&
distanceMA20 >= 0
) {
return "RISING_ABOVE_MA20";
}

if (
change > 0 &&
distanceMA20 < 0
) {
return "RISING_BELOW_MA20";
}

if (
change < 0 &&
distanceMA20 >= 0
) {
return "FALLING_ABOVE_MA20";
}

if (
change < 0 &&
distanceMA20 < 0
) {
return "FALLING_BELOW_MA20";
}

return "MIXED_OR_FLAT";
}

function expectedDivergence(
nasdaqReturn: number | null,
vixChange: number | null,
): string {
if (
!valid(nasdaqReturn) ||
!valid(vixChange)
) {
return "INSUFFICIENT_DATA";
}

if (
nasdaqReturn > 0 &&
vixChange > 0
) {
return "NASDAQ_UP_VIX_UP";
}

if (
nasdaqReturn > 0 &&
vixChange < 0
) {
return "NASDAQ_UP_VIX_DOWN";
}

if (
nasdaqReturn < 0 &&
vixChange > 0
) {
return "NASDAQ_DOWN_VIX_UP";
}

if (
nasdaqReturn < 0 &&
vixChange < 0
) {
return "NASDAQ_DOWN_VIX_DOWN";
}

return "MIXED_OR_FLAT";
}

function expectedTransitions(
previousMA50: number | null,
currentMA50: number | null,
previousMA200: number | null,
currentMA200: number | null,
): string[] {
const transitions: string[] = [];

if (
valid(previousMA50) &&
valid(currentMA50)
) {
if (
previousMA50 >= 0 &&
currentMA50 < 0
) {
transitions.push(
"BREAK_BELOW_MA50",
);
}

if (
previousMA50 < 0 &&
currentMA50 >= 0
) {
transitions.push(
"RECOVER_ABOVE_MA50",
);
}
}

if (
valid(previousMA200) &&
valid(currentMA200)
) {
if (
previousMA200 >= 0 &&
currentMA200 < 0
) {
transitions.push(
"BREAK_BELOW_MA200",
);
}

if (
previousMA200 < 0 &&
currentMA200 >= 0
) {
transitions.push(
"RECOVER_ABOVE_MA200",
);
}
}

return transitions;
}

export async function GET() {
try {
const [
marketData,
ratesData,
] = await Promise.all([
loadHistoricalRegimeMarketData(),
loadHistoricalRegimeRatesData(),
]);

/* ================================================
HISTORICAL DATA PIPELINE
================================================ */

const market =
alignHistoricalRegimeMarketData(
marketData,
);

const ratesAligned =
alignHistoricalRegimeRates(
market,
ratesData,
);

const marketFeatures =
buildHistoricalRegimeFeatures(
ratesAligned.days,
);

const dataset =
buildHistoricalRegimePriceVixFeatures(
marketFeatures,
);

/* ================================================
SOURCE VALIDATION
================================================ */

const sourceMap = new Map(
marketFeatures.map(
(feature) => [
feature.date,
feature,
],
),
);

const exactSourceAlignment =
dataset.days.every(
(day) => {
const source = sourceMap.get(
day.date,
);

return (
!!source &&
day.nasdaq === source.nasdaq &&
day.vix === source.vix &&
day.nasdaqReturn5D ===
source.nasdaqReturn5D &&
day.nasdaqReturn20D ===
source.nasdaqReturn20D &&
day.nasdaqDistanceMA50 ===
source.nasdaqDistanceMA50 &&
day.nasdaqDistanceMA200 ===
source.nasdaqDistanceMA200 &&
day.vixChange5D ===
source.vixChange5D &&
day.vixChange20D ===
source.vixChange20D
);
},
);

const priceStatesValid =
dataset.days.every(
(day) =>
day.priceTrendState ===
expectedPriceTrend(
day.nasdaqDistanceMA50,
day.nasdaqDistanceMA200,
),
);

const vixStatesValid =
dataset.days.every(
(day) =>
day.vixTrendState5D ===
expectedVixTrend(
day.vixChange5D,
day.vixDistanceMA20,
) &&
day.vixTrendState20D ===
expectedVixTrend(
day.vixChange20D,
day.vixDistanceMA20,
),
);

const divergencesValid =
dataset.days.every(
(day) =>
day.priceVixDivergence5D ===
expectedDivergence(
day.nasdaqReturn5D,
day.vixChange5D,
) &&
day.priceVixDivergence20D ===
expectedDivergence(
day.nasdaqReturn20D,
day.vixChange20D,
),
);

const transitionsValid =
dataset.days.every(
(day, index) => {
const previous =
index > 0
? dataset.days[index - 1]
: null;

const expected =
previous
? expectedTransitions(
previous.nasdaqDistanceMA50,
day.nasdaqDistanceMA50,
previous.nasdaqDistanceMA200,
day.nasdaqDistanceMA200,
)
: [];

return (
JSON.stringify(
day.transitions,
) ===
JSON.stringify(expected)
);
},
);

/* ================================================
DIAGNOSTIC CONSISTENCY
================================================ */

const transitionCounts = {
breakBelowMA50: 0,
recoverAboveMA50: 0,
breakBelowMA200: 0,
recoverAboveMA200: 0,
};

for (const day of dataset.days) {
for (const transition of
day.transitions) {
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
}

const transitionCountsValid =
JSON.stringify(
transitionCounts,
) ===
JSON.stringify(
dataset.diagnostics.transitionCounts,
);

const stateCountTotal =
Object.values(
dataset.diagnostics.priceTrendCounts,
).reduce(
(sum, count) => sum + count,
0,
);

const divergenceCountTotal =
Object.values(
dataset.diagnostics.divergence20DCounts,
).reduce(
(sum, count) => sum + count,
0,
);

const qualityChecks = {
marketAvailable:
market.count > 0,

ratesAligned:
ratesAligned.count > 0,

datasetAvailable:
dataset.count > 0,

countConsistent:
dataset.count ===
dataset.days.length,

exactSourceAlignment,

priceStatesValid,
vixStatesValid,
divergencesValid,
transitionsValid,

transitionCountsValid,

priceStateCountsValid:
stateCountTotal === dataset.count,

divergenceCountsValid:
divergenceCountTotal ===
dataset.count,

chronological:
dataset.diagnostics.chronological,

noDuplicateDates:
dataset.diagnostics.duplicateDates ===
0,
};

const status =
Object.values(qualityChecks).every(
Boolean,
)
? "PASS"
: "REVIEW";

/* ================================================
RECENT OBSERVATIONS
================================================ */

const recentDays =
dataset.days.slice(-10).map(
(day) => ({
date:
day.date,

nasdaq:
round(day.nasdaq, 2),

vix:
round(day.vix, 2),

nasdaqReturn20D:
round(day.nasdaqReturn20D),

nasdaqDistanceMA50:
round(day.nasdaqDistanceMA50),

nasdaqDistanceMA200:
round(day.nasdaqDistanceMA200),

vixChange5D:
round(day.vixChange5D),

vixChange20D:
round(day.vixChange20D),

priceTrendState:
day.priceTrendState,

vixTrendState5D:
day.vixTrendState5D,

priceVixDivergence20D:
day.priceVixDivergence20D,

transitions:
day.transitions,
}),
);

return NextResponse.json({
status,

purpose:
"Validate historical Nasdaq price structure and VIX feature classification",

period: {
firstDate:
dataset.firstDate,

lastDate:
dataset.lastDate,

marketDays:
market.count,

featureDays:
dataset.count,
},

qualityChecks,

diagnostics:
dataset.diagnostics,

recentDays,

methodology: {
priceTrend:
"Nasdaq location relative to trailing MA50 and MA200.",

vixTrend:
"VIX 5D/20D change combined with its trailing MA20.",

divergence:
"Joint Nasdaq/VIX return direction over identical lookback windows.",

transitions:
"Observable MA50/MA200 crossings between consecutive market sessions.",

limitations:
"Descriptive classifications only. No forward returns, no independent observations, and no demonstrated trading advantage.",
},
});
} catch (error) {
console.error(
"[HistoricalPriceVixTest]",
error,
);

return NextResponse.json(
{
status: "ERROR",

error:
error instanceof Error
? error.message
: "Unknown price/VIX test error",
},
{
status: 500,
},
);
}
}

