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
loadHistoricalRegimeLeadershipData,
} from "@/lib/historicalRegime/historicalRegimeLeadershipProvider";

import {
alignHistoricalRegimeLeadershipData,
} from "@/lib/historicalRegime/historicalRegimeLeadershipAlignment";

import {
buildHistoricalRegimeLeadershipFeatures,
} from "@/lib/historicalRegime/historicalRegimeLeadershipFeatures";

import {
loadHistoricalRegimeBreadthData,
} from "@/lib/historicalRegime/historicalRegimeBreadthProvider";

import {
buildHistoricalRegimeDivergenceFeatures,
} from "@/lib/historicalRegime/historicalRegimeDivergenceFeatures";

import {
buildHistoricalRegimeDivergenceEpisodes,
} from "@/lib/historicalRegime/historicalRegimeDivergenceEpisodes";

import {
buildHistoricalRegimeOutcomes,
} from "@/lib/historicalRegime/historicalRegimeOutcomes";

import {
buildHistoricalRegimeDivergenceForward,
} from "@/lib/historicalRegime/historicalRegimeDivergenceForward";

import {
buildHistoricalRegimeDivergenceControls,
} from "@/lib/historicalRegime/historicalRegimeDivergenceControls";

import {
buildHistoricalRegimeDivergenceMatchedControls,
} from "@/lib/historicalRegime/historicalRegimeDivergenceMatchedControls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
HISTORICAL DIVERGENCE MATCHED TEST

Technical validation:
- Correct event/control dates
- One-to-one assignment
- Correct historical features
- Correct forward outcomes
- Calendar distance <= 126 sessions
- Same Nasdaq trend bucket
- Reproducible matching distances
- Paired difference arithmetic

Research diagnostics:
- Matching coverage
- VIX differences
- Nasdaq trend differences
- MA200 distance differences
- Paired forward performance

No signal generation.
No threshold optimization.
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

function mean(
values: number[],
): number | null {
if (!values.length) {
return null;
}

return values.reduce(
(sum, value) => sum + value,
0,
) / values.length;
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

const middle = Math.floor(
sorted.length / 2,
);

return sorted.length % 2 === 1
? sorted[middle]
: (
sorted[middle - 1] +
sorted[middle]
) / 2;
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

function summarize(
values: number[],
) {
return {
count: values.length,
mean: round(mean(values)),
median: round(median(values)),
maximum: values.length
? round(Math.max(...values))
: null,
};
}

export async function GET() {
try {
const [
marketData,
ratesData,
leadershipData,
breadthData,
] = await Promise.all([
loadHistoricalRegimeMarketData(),
loadHistoricalRegimeRatesData(),
loadHistoricalRegimeLeadershipData(),
loadHistoricalRegimeBreadthData(),
]);

/* ================================================
BUILD EXISTING DATA PIPELINE
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

const leadershipAligned =
alignHistoricalRegimeLeadershipData(
market,
leadershipData,
);

const leadershipFeatures =
buildHistoricalRegimeLeadershipFeatures(
leadershipAligned.days,
);

const divergence =
buildHistoricalRegimeDivergenceFeatures(
leadershipFeatures,
breadthData.days,
);

const episodes =
buildHistoricalRegimeDivergenceEpisodes(
divergence,
);

const outcomes =
buildHistoricalRegimeOutcomes(
market.days,
);

const forward =
buildHistoricalRegimeDivergenceForward(
episodes,
divergence.days,
outcomes,
);

const controls =
buildHistoricalRegimeDivergenceControls(
divergence.days,
forward,
outcomes,
);

const matched =
buildHistoricalRegimeDivergenceMatchedControls(
controls,
marketFeatures,
);

/* ================================================
INDEPENDENT LOOKUPS
================================================ */

const featureMap = new Map(
marketFeatures.map(
(feature) => [
feature.date,
feature,
],
),
);

const observationMap = new Map(
controls.observations.map(
(observation) => [
observation.date,
observation,
],
),
);

/* ================================================
TECHNICAL QUALITY CHECKS
================================================ */

const correctGroups =
matched.pairs.every(
(pair) => {
const event = observationMap.get(
pair.eventDate,
);

const control = observationMap.get(
pair.controlDate,
);

return (
event?.group ===
"DIVERGENCE_START" &&
control?.group ===
"NASDAQ_UP_NO_DIVERGENCE"
);
},
);

const sameTrendBucket =
matched.pairs.every(
(pair) => {
const event = observationMap.get(
pair.eventDate,
);

const control = observationMap.get(
pair.controlDate,
);

return (
!!event &&
!!control &&
event.trendBucket ===
control.trendBucket
);
},
);

const calendarDistanceValid =
matched.pairs.every(
(pair) =>
Math.abs(
pair.eventMarketIndex -
pair.controlMarketIndex,
) ===
pair.calendarDistanceTradingDays &&
pair.calendarDistanceTradingDays <=
126,
);

const historicalFeaturesValid =
matched.pairs.every(
(pair) => {
const event = featureMap.get(
pair.eventDate,
);

const control = featureMap.get(
pair.controlDate,
);

if (!event || !control) {
return false;
}

return (
approximatelyEqual(
pair.eventNasdaqReturn20D,
event.nasdaqReturn20D,
) &&
approximatelyEqual(
pair.controlNasdaqReturn20D,
control.nasdaqReturn20D,
) &&
approximatelyEqual(
pair.eventVix,
event.vix,
) &&
approximatelyEqual(
pair.controlVix,
control.vix,
) &&
approximatelyEqual(
pair.eventDistanceMA200,
event.nasdaqDistanceMA200,
) &&
approximatelyEqual(
pair.controlDistanceMA200,
control.nasdaqDistanceMA200,
)
);
},
);

const forwardOutcomesValid =
matched.pairs.every(
(pair) => {
const event = observationMap.get(
pair.eventDate,
);

const control = observationMap.get(
pair.controlDate,
);

if (!event || !control) {
return false;
}

return (
approximatelyEqual(
pair.eventForward20D,
event.forward20D,
) &&
approximatelyEqual(
pair.controlForward20D,
control.forward20D,
) &&
approximatelyEqual(
pair.eventForward60D,
event.forward60D,
) &&
approximatelyEqual(
pair.controlForward60D,
control.forward60D,
)
);
},
);

const pairedDifferencesValid =
matched.pairs.every(
(pair) => {
const expected20D =
valid(pair.eventForward20D) &&
valid(pair.controlForward20D)
? pair.eventForward20D -
pair.controlForward20D
: null;

const expected60D =
valid(pair.eventForward60D) &&
valid(pair.controlForward60D)
? pair.eventForward60D -
pair.controlForward60D
: null;

return (
approximatelyEqual(
pair.difference20D,
expected20D,
) &&
approximatelyEqual(
pair.difference60D,
expected60D,
)
);
},
);

const matchingDistancesValid =
matched.pairs.every(
(pair) => {
const returnDifference =
(
pair.eventNasdaqReturn20D -
pair.controlNasdaqReturn20D
) / 5;

const vixDifference =
(
pair.eventVix -
pair.controlVix
) / 10;

const ma200Difference =
(
pair.eventDistanceMA200 -
pair.controlDistanceMA200
) / 10;

const expected = Math.sqrt(
returnDifference ** 2 +
vixDifference ** 2 +
ma200Difference ** 2,
);

return approximatelyEqual(
pair.matchDistance,
expected,
);
},
);

const uniquePairs =
matched.diagnostics.uniqueEventDates &&
matched.diagnostics.uniqueControlDates;

const accountingValid =
matched.diagnostics.matchedEvents +
matched.diagnostics.unmatchedEvents ===
matched.diagnostics.inputEvents;

const comparisonCountsValid =
matched.comparisons.every(
(comparison) => {
const expected = matched.pairs.filter(
(pair) =>
comparison.horizon === 20
? valid(pair.difference20D)
: valid(pair.difference60D),
).length;

return (
comparison.pairsAvailable ===
expected &&
comparison.pairedDifference.count ===
expected
);
},
);

const qualityChecks = {
marketAvailable:
market.count > 0,

marketFeaturesAvailable:
marketFeatures.length > 0,

divergenceEpisodesAvailable:
episodes.count > 0,

matchedPairsAvailable:
matched.pairs.length > 0,

correctGroups,
sameTrendBucket,
calendarDistanceValid,
historicalFeaturesValid,
forwardOutcomesValid,
pairedDifferencesValid,
matchingDistancesValid,
uniquePairs,
accountingValid,
comparisonCountsValid,

chronological:
matched.diagnostics.chronological,

noForwardOutcomesUsedForMatching:
matched.diagnostics
.matchingUsesForwardOutcomes === false,
};

/* ================================================
MATCH QUALITY DIAGNOSTICS

These are measurements, not PASS thresholds.
================================================ */

const absoluteReturnDifferences =
matched.pairs.map(
(pair) =>
Math.abs(
pair.eventNasdaqReturn20D -
pair.controlNasdaqReturn20D,
),
);

const absoluteVixDifferences =
matched.pairs.map(
(pair) =>
Math.abs(
pair.eventVix -
pair.controlVix,
),
);

const absoluteMA200Differences =
matched.pairs.map(
(pair) =>
Math.abs(
pair.eventDistanceMA200 -
pair.controlDistanceMA200,
),
);

const calendarDistances =
matched.pairs.map(
(pair) =>
pair.calendarDistanceTradingDays,
);

const matchDistances =
matched.pairs.map(
(pair) =>
pair.matchDistance,
);

const matchQuality = {
absoluteNasdaqReturn20DDifference:
summarize(
absoluteReturnDifferences,
),

absoluteVixDifference:
summarize(
absoluteVixDifferences,
),

absoluteMA200DistanceDifference:
summarize(
absoluteMA200Differences,
),

calendarDistanceTradingDays:
summarize(
calendarDistances,
),

standardizedMatchDistance:
summarize(
matchDistances,
),

controlsAfterEvents:
matched.pairs.filter(
(pair) =>
pair.controlMarketIndex >
pair.eventMarketIndex,
).length,

controlsBeforeEvents:
matched.pairs.filter(
(pair) =>
pair.controlMarketIndex <
pair.eventMarketIndex,
).length,
};

/* ================================================
FORWARD PERFORMANCE
================================================ */

const comparisons =
matched.comparisons.map(
(comparison) => ({
horizon:
comparison.horizon,

pairsAvailable:
comparison.pairsAvailable,

event: {
count:
comparison.event.count,

mean:
round(comparison.event.mean),

median:
round(comparison.event.median),

negativeSharePercent:
valid(
comparison.event.negativeShare,
)
? round(
comparison.event.negativeShare *
100,
2,
)
: null,
},

control: {
count:
comparison.control.count,

mean:
round(comparison.control.mean),

median:
round(comparison.control.median),

negativeSharePercent:
valid(
comparison.control.negativeShare,
)
? round(
comparison.control.negativeShare *
100,
2,
)
: null,
},

pairedDifference: {
count:
comparison.pairedDifference.count,

mean:
round(
comparison.pairedDifference.mean,
),

median:
round(
comparison.pairedDifference.median,
),

negativeSharePercent:
valid(
comparison.pairedDifference
.negativeShare,
)
? round(
comparison.pairedDifference
.negativeShare * 100,
2,
)
: null,
},
}),
);

const status =
Object.values(qualityChecks).every(Boolean)
? "PASS"
: "REVIEW";

return NextResponse.json({
status,

purpose:
"Retrospective one-to-one matched controls for Nasdaq breadth divergence episode starts",

period: {
marketFirstDate:
market.firstDate,

marketLastDate:
market.lastDate,

marketDays:
market.count,

ratesAlignedDays:
ratesAligned.count,

marketFeatureDays:
marketFeatures.length,

divergenceEpisodes:
episodes.count,
},

diagnostics:
matched.diagnostics,

qualityChecks,

matchQuality,

comparisons,

samplePairs:
matched.pairs
.slice(0, 10)
.map(
(pair) => ({
eventDate:
pair.eventDate,

controlDate:
pair.controlDate,

calendarDistanceTradingDays:
pair.calendarDistanceTradingDays,

eventVix:
round(pair.eventVix),

controlVix:
round(pair.controlVix),

matchDistance:
round(pair.matchDistance),

difference20D:
round(pair.difference20D),

difference60D:
round(pair.difference60D),
}),
),

methodology: {
matching:
"Chronological greedy nearest-neighbor, one-to-one without replacement.",

calendarWindow:
"Plus/minus 126 market trading sessions.",

variables:
"Nasdaq trailing 20D return, VIX level, Nasdaq distance from MA200.",

exactConstraint:
"Same Nasdaq trailing-return bucket.",

researchLimitations:
"Retrospective matching, potential overlap of forward windows, no formal uncertainty intervals, and no proof of a tradable Optionsschein advantage.",
},
});
} catch (error) {
console.error(
"[HistoricalDivergenceMatchedTest]",
error,
);

return NextResponse.json(
{
status: "ERROR",

error:
error instanceof Error
? error.message
: "Unknown matched-control test error",
},
{ status: 500 },
);
}
}

