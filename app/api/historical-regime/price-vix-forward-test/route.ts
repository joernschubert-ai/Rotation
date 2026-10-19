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

import {
buildHistoricalRegimeOutcomes,
} from "@/lib/historicalRegime/historicalRegimeOutcomes";

import {
buildHistoricalRegimePriceVixForward,
} from "@/lib/historicalRegime/historicalRegimePriceVixForward";

import type {
HistoricalPriceVixResearchObservation,
} from "@/lib/historicalRegime/historicalRegimePriceVixForward";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
PRICE / VIX FORWARD TEST

- Historical alignment
- Forward-return validation
- Group counts and statistics
- Transition event validation
- Descriptive results T+5 / T+20 / T+60

No parameter optimization.
No trade recommendation.
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

function approximatelyEqual(
actual: number | null,
expected: number | null,
tolerance = 1e-8,
): boolean {
if (
actual === null ||
expected === null
) {
return actual === expected;
}

return (
valid(actual) &&
valid(expected) &&
Math.abs(actual - expected) <= tolerance
);
}

function mean(
values: number[],
): number | null {
if (!values.length) {
return null;
}

return (
values.reduce(
(sum, value) => sum + value,
0,
) / values.length
);
}

function median(
values: number[],
): number | null {
if (!values.length) {
return null;
}

const sorted = [...values].sort(
(a, b) => a - b,
);

const middle =
Math.floor(sorted.length / 2);

return sorted.length % 2 === 1
? sorted[middle]
: (
sorted[middle - 1] +
sorted[middle]
) / 2;
}

function outcomeForHorizon(
observation:
HistoricalPriceVixResearchObservation,
horizon: 5 | 20 | 60,
): number | null {
if (horizon === 5) {
return observation.forward5D;
}

if (horizon === 20) {
return observation.forward20D;
}

return observation.forward60D;
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

const features =
buildHistoricalRegimePriceVixFeatures(
marketFeatures,
);

const outcomes =
buildHistoricalRegimeOutcomes(
market.days,
);

const forward =
buildHistoricalRegimePriceVixForward(
features,
outcomes,
);

/* ================================================
INDEPENDENT REFERENCE MAPS
================================================ */

const outcomeMap = new Map(
outcomes.map(
(outcome) => [
outcome.date,
outcome,
],
),
);

const featureMap = new Map(
features.days.map(
(feature) => [
feature.date,
feature,
],
),
);

const observations =
forward.observations;

/* ================================================
OBSERVATION VALIDATION
================================================ */

const exactForwardAlignment =
observations.every(
(observation) => {
const outcome =
outcomeMap.get(
observation.date,
);

if (!outcome) {
return false;
}

return (
approximatelyEqual(
observation.forward5D,
outcome.forward5D,
) &&
approximatelyEqual(
observation.forward20D,
outcome.forward20D,
) &&
approximatelyEqual(
observation.forward60D,
outcome.forward60D,
) &&
approximatelyEqual(
observation.mfe20D,
outcome.mfe20D,
) &&
approximatelyEqual(
observation.mae20D,
outcome.mae20D,
) &&
approximatelyEqual(
observation.mfe60D,
outcome.mfe60D,
) &&
approximatelyEqual(
observation.mae60D,
outcome.mae60D,
)
);
},
);

const exactFeatureAlignment =
observations.every(
(observation) => {
const feature =
featureMap.get(
observation.date,
);

return (
!!feature &&
observation.nasdaq ===
feature.nasdaq &&
observation.vix ===
feature.vix
);
},
);

const validStateMembership =
observations.every(
(observation) => {
const feature =
featureMap.get(
observation.date,
);

if (!feature) {
return false;
}

switch (
observation.family
) {
case "PRICE_TREND":
return (
observation.state ===
feature.priceTrendState
);

case "VIX_5D":
return (
observation.state ===
feature.vixTrendState5D
);

case "VIX_20D":
return (
observation.state ===
feature.vixTrendState20D
);

case "PRICE_VIX_5D":
return (
observation.state ===
feature.priceVixDivergence5D
);

case "PRICE_VIX_20D":
return (
observation.state ===
feature.priceVixDivergence20D
);

case "PRICE_TRANSITION":
return feature.transitions.some(
(transition) =>
transition ===
observation.state,
);

default:
return false;
}
},
);

const marketIndexValid =
observations.every(
(observation) =>
market.days[
observation.marketIndex
]?.date ===
observation.date,
);

/* ================================================
GROUP STATISTICS VALIDATION
================================================ */

const grouped = new Map<
string,
HistoricalPriceVixResearchObservation[]
>();

for (const observation of observations) {
const key =
`${observation.family}::${observation.state}`;

const group =
grouped.get(key) ?? [];

group.push(
observation,
);

grouped.set(
key,
group,
);
}

const statisticsValid =
forward.statistics.every(
(statistics) => {
const key =
`${statistics.family}::${statistics.state}`;

const group =
grouped.get(key);

if (
!group ||
group.length !==
statistics.observations
) {
return false;
}

return (
statistics.horizonStats.length ===
3 &&
statistics.horizonStats.every(
(horizonStats) => {
const horizon =
horizonStats.horizon;

const returns =
group
.map(
(observation) =>
outcomeForHorizon(
observation,
horizon,
),
)
.filter(valid);

const expectedMean =
mean(returns);

const expectedMedian =
median(returns);

const expectedPositiveRate =
returns.length
? (
returns.filter(
(value) =>
value > 0,
).length /
returns.length
) * 100
: null;

const expectedNegativeRate =
returns.length
? (
returns.filter(
(value) =>
value < 0,
).length /
returns.length
) * 100
: null;

const eligible =
group.filter(
(observation) =>
valid(
outcomeForHorizon(
observation,
horizon,
),
),
);

const mfe =
horizon === 5
? []
: eligible
.map(
(observation) =>
horizon === 20
? observation.mfe20D
: observation.mfe60D,
)
.filter(valid);

const mae =
horizon === 5
? []
: eligible
.map(
(observation) =>
horizon === 20
? observation.mae20D
: observation.mae60D,
)
.filter(valid);

return (
horizonStats.available ===
returns.length &&
approximatelyEqual(
horizonStats.averageReturn,
expectedMean,
) &&
approximatelyEqual(
horizonStats.medianReturn,
expectedMedian,
) &&
approximatelyEqual(
horizonStats.positiveRate,
expectedPositiveRate,
) &&
approximatelyEqual(
horizonStats.negativeRate,
expectedNegativeRate,
) &&
approximatelyEqual(
horizonStats.averageMFE,
mean(mfe),
) &&
approximatelyEqual(
horizonStats.averageMAE,
mean(mae),
)
);
},
)
);
},
);

const allGroupsRepresented =
forward.statistics.length ===
grouped.size &&
forward.statistics.every(
(statistics) =>
grouped.has(
`${statistics.family}::${statistics.state}`,
),
);

const expectedTransitionObservations =
features.days.reduce(
(sum, day) =>
sum +
day.transitions.filter(
(transition) =>
transition !== "NONE",
).length,
0,
);

const transitionCountValid =
forward.diagnostics
.transitionObservations ===
expectedTransitionObservations &&
observations.filter(
(observation) =>
observation.family ===
"PRICE_TRANSITION",
).length ===
expectedTransitionObservations;

/* ================================================
QUALITY CHECKS
================================================ */

const qualityChecks = {
marketAvailable:
market.count > 0,

featuresAvailable:
features.count > 0,

outcomesAvailable:
outcomes.length > 0,

allFeatureDaysMatched:
forward.diagnostics
.matchedFeatureDays ===
features.count,

noUnmatchedFeatureDays:
forward.diagnostics
.unmatchedFeatureDays ===
0,

exactForwardAlignment,
exactFeatureAlignment,

validStateMembership,
marketIndexValid,

statisticsValid,
allGroupsRepresented,
transitionCountValid,

noDuplicateOutcomeDates:
forward.diagnostics
.duplicateOutcomeDates ===
0,

noDuplicateFeatureDates:
forward.diagnostics
.duplicateFeatureDates ===
0,

chronological:
forward.diagnostics.chronological,

historicalFeaturesOnly:
forward.diagnostics
.usesOnlyHistoricalFeatures,

overlappingStatesFlagged:
forward.diagnostics
.includesOverlappingStateObservations,

transitionsSeparated:
forward.diagnostics
.transitionEventsAreSeparate,
};

const status =
Object.values(
qualityChecks,
).every(Boolean)
? "PASS"
: "REVIEW";

/* ================================================
COMPACT RESEARCH RESULTS
================================================ */

const results =
forward.statistics.map(
(statistics) => ({
family:
statistics.family,

state:
statistics.state,

observations:
statistics.observations,

firstDate:
statistics.firstDate,

lastDate:
statistics.lastDate,

horizons:
statistics.horizonStats.map(
(horizon) => ({
horizon:
horizon.horizon,

available:
horizon.available,

averageReturn:
round(
horizon.averageReturn,
),

medianReturn:
round(
horizon.medianReturn,
),

positiveRatePercent:
round(
horizon.positiveRate,
2,
),

negativeRatePercent:
round(
horizon.negativeRate,
2,
),

averageMFE:
round(
horizon.averageMFE,
),

averageMAE:
round(
horizon.averageMAE,
),
}),
),
}),
);

const recentObservations =
observations.slice(-12).map(
(observation) => ({
date:
observation.date,

family:
observation.family,

state:
observation.state,

forward5D:
round(
observation.forward5D,
),

forward20D:
round(
observation.forward20D,
),

forward60D:
round(
observation.forward60D,
),
}),
);

return NextResponse.json({
status,

purpose:
"Historical Nasdaq price/VIX forward-outcome research",

period: {
firstDate:
features.firstDate,

lastDate:
features.lastDate,

marketDays:
market.count,

featureDays:
features.count,
},

qualityChecks,

diagnostics:
forward.diagnostics,

results,

recentObservations,

methodology: {
horizons:
[5, 20, 60],

outcomeUnit:
"Percent Nasdaq underlying return",

rateUnit:
"Percent of observations",

excursions:
"MFE and MAE are Nasdaq underlying excursions, not warrant P&L.",

stateObservations:
"All eligible state days are included; forward windows overlap.",

transitionObservations:
"Only MA crossing dates are included as transition events.",

limitations: [
"Descriptive historical associations, not causal effects.",
"Overlapping state observations inflate effective sample size.",
"No regime-matched control groups or out-of-sample validation yet.",
"Historical outcomes do not include warrant theta, implied volatility or spreads.",
],
},
});
} catch (error) {
console.error(
"[HistoricalPriceVixForwardTest]",
error,
);

return NextResponse.json(
{
status: "ERROR",

error:
error instanceof Error
? error.message
: "Unknown price/VIX forward test error",
},
{
status: 500,
},
);
}
}

