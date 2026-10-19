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
buildHistoricalRegimeDivergenceMatchRobustness,
} from "@/lib/historicalRegime/historicalRegimeDivergenceMatchRobustness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
HISTORICAL DIVERGENCE MATCH ROBUSTNESS TEST

Purpose:
- Validate temporal exclusion scenarios
- Verify one-to-one matching
- Verify forward outcomes and paired differences
- Compare matching coverage and quality
- Report 20D and 60D performance

No trading signals.
No optimization.
No persistence.
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

return (
values.reduce(
(sum, value) => sum + value,
0,
) / values.length
);
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
EXISTING HISTORICAL PIPELINE
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

const robustness =
buildHistoricalRegimeDivergenceMatchRobustness(
controls,
marketFeatures,
);

/* ================================================
INDEPENDENT REFERENCE DATA
================================================ */

const observationMap = new Map(
controls.observations.map(
(observation) => [
observation.date,
observation,
],
),
);

const featureMap = new Map(
marketFeatures.map(
(feature) => [
feature.date,
feature,
],
),
);

/* ================================================
SCENARIO VALIDATION
================================================ */

const scenarios =
robustness.scenarios.map(
(scenario) => {
const exclusion =
scenario.exclusionTradingDays;

const pairs =
scenario.pairs;

const uniqueEventDates =
new Set(
pairs.map(
(pair) => pair.eventDate,
),
).size === pairs.length;

const uniqueControlDates =
new Set(
pairs.map(
(pair) => pair.controlDate,
),
).size === pairs.length;

const correctGroups =
pairs.every(
(pair) => {
const event =
observationMap.get(
pair.eventDate,
);

const control =
observationMap.get(
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
pairs.every(
(pair) =>
pair.eventTrendBucket ===
pair.controlTrendBucket,
);

const calendarExclusionValid =
pairs.every(
(pair) =>
pair.calendarDistanceTradingDays >
exclusion &&
pair.calendarDistanceTradingDays <=
126 &&
pair.calendarDistanceTradingDays ===
Math.abs(
pair.eventMarketIndex -
pair.controlMarketIndex,
),
);

const featuresValid =
pairs.every(
(pair) => {
const event =
featureMap.get(
pair.eventDate,
);

const control =
featureMap.get(
pair.controlDate,
);

if (
!event ||
!control
) {
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
pairs.every(
(pair) => {
const event =
observationMap.get(
pair.eventDate,
);

const control =
observationMap.get(
pair.controlDate,
);

if (
!event ||
!control
) {
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
pairs.every(
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

const matchDistancesValid =
pairs.every(
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

const expected =
Math.sqrt(
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

const accountingValid =
scenario.diagnostics
.matchedEvents ===
pairs.length &&
scenario.diagnostics
.matchedEvents +
scenario.diagnostics
.unmatchedEvents ===
scenario.diagnostics
.inputEvents;

const horizonCountsValid =
scenario.horizonStats.every(
(stats) => {
const expected =
pairs.filter(
(pair) =>
stats.horizon === 20
? valid(
pair.difference20D,
)
: valid(
pair.difference60D,
),
).length;

return (
stats.availablePairs ===
expected
);
},
);

const checks = {
uniqueEventDates,
uniqueControlDates,
correctGroups,
sameTrendBucket,
calendarExclusionValid,
featuresValid,
forwardOutcomesValid,
pairedDifferencesValid,
matchDistancesValid,
accountingValid,
horizonCountsValid,

chronological:
scenario.diagnostics.chronological,

noForwardOutcomesUsedForMatching:
scenario.diagnostics
.matchingUsesForwardOutcomes ===
false,
};

const status =
Object.values(checks).every(
Boolean,
)
? "PASS"
: "REVIEW";

const averageDifferences =
scenario.horizonStats.map(
(stats) => ({
horizon:
stats.horizon,

availablePairs:
stats.availablePairs,

averageEventReturn:
round(
stats.averageEventReturn,
),

averageControlReturn:
round(
stats.averageControlReturn,
),

averagePairedDifference:
round(
stats.averagePairedDifference,
),

medianPairedDifference:
round(
stats.medianPairedDifference,
),

negativeDifferenceRatePercent:
round(
stats.negativeDifferenceRate,
2,
),
}),
);

return {
exclusionTradingDays:
exclusion,

status,

checks,

diagnostics: {
...scenario.diagnostics,

matchRate:
round(
scenario.diagnostics
.matchRate,
2,
),

averageCalendarDistance:
round(
scenario.diagnostics
.averageCalendarDistance,
),

medianCalendarDistance:
round(
scenario.diagnostics
.medianCalendarDistance,
),

averageMatchDistance:
round(
scenario.diagnostics
.averageMatchDistance,
),

maximumMatchDistance:
round(
scenario.diagnostics
.maximumMatchDistance,
),

averageAbsoluteReturnDifference:
round(
scenario.diagnostics
.averageAbsoluteReturnDifference,
),

averageAbsoluteVixDifference:
round(
scenario.diagnostics
.averageAbsoluteVixDifference,
),

averageAbsoluteMA200Difference:
round(
scenario.diagnostics
.averageAbsoluteMA200Difference,
),
},

forwardComparisons:
averageDifferences,

samplePairs:
pairs.slice(0, 5).map(
(pair) => ({
eventDate:
pair.eventDate,

controlDate:
pair.controlDate,

calendarDistanceTradingDays:
pair.calendarDistanceTradingDays,

matchDistance:
round(
pair.matchDistance,
),

difference20D:
round(
pair.difference20D,
),

difference60D:
round(
pair.difference60D,
),
}),
),
};
},
);

const globalChecks = {
threeScenarios:
robustness.scenarios.length === 3,

correctExclusionWindows:
JSON.stringify(
robustness.diagnostics
.exclusionWindows,
) ===
JSON.stringify(
[0, 20, 60],
),

sameInputEventsAcrossScenarios:
robustness.diagnostics
.sameInputEventsAcrossScenarios,

sameInputControlsAcrossScenarios:
robustness.diagnostics
.sameInputControlsAcrossScenarios,

noForwardOutcomesUsedForMatching:
robustness.diagnostics
.matchingUsesForwardOutcomes ===
false,

allScenariosPass:
scenarios.every(
(scenario) =>
scenario.status === "PASS",
),
};

const status =
Object.values(globalChecks).every(
Boolean,
)
? "PASS"
: "REVIEW";

return NextResponse.json({
status,

purpose:
"Temporal exclusion robustness of historical Nasdaq divergence matched controls",

period: {
firstDate:
market.firstDate,

lastDate:
market.lastDate,

marketDays:
market.count,

divergenceEpisodes:
episodes.count,
},

globalChecks,

scenarios,

methodology: {
matching:
"Greedy one-to-one nearest-neighbor matching without replacement.",

matchingFeatures: [
"Nasdaq trailing 20D return",
"VIX level",
"Nasdaq distance from MA200",
],

exclusionWindowsTradingDays:
[0, 20, 60],

maximumCalendarDistanceTradingDays:
126,

exclusionRule:
"Control calendar distance must be strictly greater than the exclusion window.",

limitations: [
"Temporal exclusion does not remove all overlapping forward windows between different events.",
"Retrospective controls may occur after the event.",
"Greedy matching does not guarantee globally optimal matching.",
"No statistical significance or tradable Optionsschein edge is claimed.",
],
},
});
} catch (error) {
console.error(
"[HistoricalDivergenceMatchRobustnessTest]",
error,
);

return NextResponse.json(
{
status: "ERROR",

error:
error instanceof Error
? error.message
: "Unknown robustness test error",
},
{
status: 500,
},
);
}
}

