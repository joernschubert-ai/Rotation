import { NextResponse } from "next/server";

import {
loadHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeProvider";

import {
alignHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeAlignment";

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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
HISTORICAL DIVERGENCE CONTROLS TEST

Validates:
- Episode-start and control group construction
- Exact date and outcome matching
- Trend-bucket classification
- Control-group eligibility
- Missing-breadth contamination
- Forward-horizon completeness
- Non-overlapping samples
- Comparison arithmetic

No trading signals.
No score optimization.
No optionsschein pricing.
===================================================== */

function valid(
value: number | null | undefined,
): value is number {
return (
typeof value === "number" &&
Number.isFinite(value)
);
}

function approximatelyEqual(
actual: number | null,
expected: number | null,
tolerance = 1e-9,
): boolean {
if (actual === null || expected === null) {
return actual === expected;
}

return (
valid(actual) &&
valid(expected) &&
Math.abs(actual - expected) <= tolerance
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

function expectedBucket(
return20D: number,
): string | null {
if (return20D <= 0) {
return null;
}

if (return20D <= 2) {
return "UP_0_TO_2";
}

if (return20D <= 5) {
return "UP_2_TO_5";
}

return "UP_ABOVE_5";
}

function difference(
first: number | null,
second: number | null,
): number | null {
if (!valid(first) || !valid(second)) {
return null;
}

return first - second;
}

function summarizeStatistics(
stats: {
count: number;
available20D: number;
available60D: number;
average20D: number | null;
median20D: number | null;
negativeRate20D: number | null;
average60D: number | null;
median60D: number | null;
negativeRate60D: number | null;
averageMFE20D: number | null;
averageMAE20D: number | null;
averageMFE60D: number | null;
averageMAE60D: number | null;
},
) {
return {
count: stats.count,

available20D: stats.available20D,
available60D: stats.available60D,

average20D: round(stats.average20D),
median20D: round(stats.median20D),
negativeRate20D:
round(stats.negativeRate20D, 2),

average60D: round(stats.average60D),
median60D: round(stats.median60D),
negativeRate60D:
round(stats.negativeRate60D, 2),

averageMFE20D:
round(stats.averageMFE20D),
averageMAE20D:
round(stats.averageMAE20D),

averageMFE60D:
round(stats.averageMFE60D),
averageMAE60D:
round(stats.averageMAE60D),
};
}

export async function GET() {
try {
const [
marketData,
leadershipData,
breadthData,
] = await Promise.all([
loadHistoricalRegimeMarketData(),
loadHistoricalRegimeLeadershipData(),
loadHistoricalRegimeBreadthData(),
]);

const market =
alignHistoricalRegimeMarketData(marketData);

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

/* ================================================
LOOKUP TABLES
================================================ */

const divergenceMap = new Map(
divergence.days.map(
(day) => [day.date, day],
),
);

const outcomeMap = new Map(
outcomes.map(
(outcome, index) => [
outcome.date,
{ outcome, index },
],
),
);

const episodeStartDates = new Set(
episodes.episodes.map(
(episode) => episode.startDate,
),
);

const eventObservations =
controls.observations.filter(
(observation) =>
observation.group ===
"DIVERGENCE_START",
);

const controlObservations =
controls.observations.filter(
(observation) =>
observation.group ===
"NASDAQ_UP_NO_DIVERGENCE",
);

/* ================================================
INDEPENDENT VALIDATION
================================================ */

const eventEligibilityValid =
eventObservations.every(
(observation) =>
episodeStartDates.has(
observation.date,
) &&
divergenceMap.get(
observation.date,
)?.state20D ===
"NASDAQ_UP_BREADTH_DOWN",
);

const controlEligibilityValid =
controlObservations.every(
(observation) => {
const day = divergenceMap.get(
observation.date,
);

return (
!!day &&
day.state20D !==
"NASDAQ_UP_BREADTH_DOWN" &&
!episodeStartDates.has(
observation.date,
) &&
valid(day.nasdaqReturn20D) &&
day.nasdaqReturn20D > 0
);
},
);

const trendBucketsValid =
controls.observations.every(
(observation) =>
observation.trendBucket ===
expectedBucket(
observation.nasdaqReturn20D,
),
);

const outcomeMatchingValid =
controls.observations.every(
(observation) => {
const matching = outcomeMap.get(
observation.date,
);

if (!matching) {
return false;
}

const expected = matching.outcome;

return (
observation.marketIndex ===
matching.index &&
approximatelyEqual(
observation.forward5D,
expected.forward5D,
) &&
approximatelyEqual(
observation.forward20D,
expected.forward20D,
) &&
approximatelyEqual(
observation.forward60D,
expected.forward60D,
) &&
approximatelyEqual(
observation.mfe20D,
expected.mfe20D,
) &&
approximatelyEqual(
observation.mae20D,
expected.mae20D,
) &&
approximatelyEqual(
observation.mfe60D,
expected.mfe60D,
) &&
approximatelyEqual(
observation.mae60D,
expected.mae60D,
)
);
},
);

const horizonCompletenessValid =
controls.observations.every(
(observation) =>
valid(observation.forward20D) ===
(
observation.marketIndex + 20 <
market.days.length
) &&
valid(observation.forward60D) ===
(
observation.marketIndex + 60 <
market.days.length
),
);

/*
* A missing-breadth day must not be treated
* as a healthy non-divergence control.
*
* This check is intentionally strict.
* If it fails, we investigate before
* interpreting control-group returns.
*/

const missingBreadthControls =
controlObservations.filter(
(observation) => {
const day = divergenceMap.get(
observation.date,
);

return (
!day ||
day.state20D ===
"INSUFFICIENT_DATA" ||
!valid(day.rawBreadth50) ||
!valid(day.breadth50Change20D)
);
},
);

const controlBreadthComplete =
missingBreadthControls.length === 0;

/* ================================================
NON-OVERLAPPING SAMPLE VALIDATION

Reconstruct chronological greedy selection
independently for each group and horizon.
================================================ */

function selectNonOverlapping(
observations: typeof controls.observations,
horizon: 20 | 60,
) {
const sorted = [...observations].sort(
(a, b) =>
a.marketIndex - b.marketIndex,
);

const selected: typeof controls.observations =
[];

let lastIndex =
Number.NEGATIVE_INFINITY;

for (const observation of sorted) {
const value =
horizon === 20
? observation.forward20D
: observation.forward60D;

if (!valid(value)) {
continue;
}

if (
observation.marketIndex <
lastIndex + horizon
) {
continue;
}

selected.push(observation);
lastIndex = observation.marketIndex;
}

return selected;
}

const nonOverlapChecks =
controls.nonOverlapping.map(
(comparison) => {
const horizon =
comparison.horizon;

const selectedEvents =
selectNonOverlapping(
eventObservations,
horizon,
);

const selectedControls =
selectNonOverlapping(
controlObservations,
horizon,
);

const eventsCountValid =
selectedEvents.length ===
comparison.divergence.count;

const controlsCountValid =
selectedControls.length ===
comparison.control.count;

const expectedDifference =
difference(
horizon === 20
? comparison.divergence.average20D
: comparison.divergence.average60D,

horizon === 20
? comparison.control.average20D
: comparison.control.average60D,
);

const arithmeticValid =
approximatelyEqual(
comparison.differenceAverageReturn,
expectedDifference,
);

const windowsValid = (
observations: typeof controls.observations,
) =>
observations.every(
(observation, index) =>
index === 0 ||
observation.marketIndex -
observations[index - 1]
.marketIndex >= horizon,
);

return {
horizon,

eventsSelected:
selectedEvents.length,

controlsSelected:
selectedControls.length,

eventsCountValid,
controlsCountValid,
arithmeticValid,

eventWindowsNonOverlapping:
windowsValid(selectedEvents),

controlWindowsNonOverlapping:
windowsValid(selectedControls),
};
},
);

const nonOverlappingValid =
nonOverlapChecks.every(
(check) =>
check.eventsCountValid &&
check.controlsCountValid &&
check.arithmeticValid &&
check.eventWindowsNonOverlapping &&
check.controlWindowsNonOverlapping,
);

const comparisonArithmeticValid =
controls.comparisons.every(
(comparison) =>
approximatelyEqual(
comparison.differenceAverage20D,
difference(
comparison.divergence.average20D,
comparison.control.average20D,
),
) &&
approximatelyEqual(
comparison.differenceAverage60D,
difference(
comparison.divergence.average60D,
comparison.control.average60D,
),
),
);

/* ================================================
QUALITY CHECKS
================================================ */

const qualityChecks = {
marketAvailable:
market.count > 0,

episodesAvailable:
episodes.count > 0,

allEpisodeStartsMatched:
controls.diagnostics
.unmatchedDivergenceStarts === 0 &&
controls.diagnostics
.matchedDivergenceStarts ===
forward.observations.length,

eventEligibilityValid,

controlEligibilityValid,

trendBucketsValid,

outcomeMatchingValid,

horizonCompletenessValid,

controlBreadthComplete,

nonOverlappingValid,

comparisonArithmeticValid,

uniqueDates:
controls.diagnostics
.duplicateDates === 0,

chronological:
controls.diagnostics
.chronological,
};

const status =
Object.values(qualityChecks).every(Boolean)
? "PASS"
: "REVIEW";

return NextResponse.json({
status,

purpose:
"Historical divergence versus Nasdaq-up control-group validation",

period: {
firstDate: divergence.firstDate,
lastDate: divergence.lastDate,
marketDays: market.count,
divergenceEpisodes: episodes.count,
},

diagnostics:
controls.diagnostics,

qualityChecks,

missingBreadthControls: {
count:
missingBreadthControls.length,

firstDates:
missingBreadthControls
.slice(0, 15)
.map(
(observation) =>
observation.date,
),
},

comparisons:
controls.comparisons.map(
(comparison) => ({
trendBucket:
comparison.trendBucket,

divergence:
summarizeStatistics(
comparison.divergence,
),

control:
summarizeStatistics(
comparison.control,
),

differenceAverage20D:
round(
comparison.differenceAverage20D,
),

differenceAverage60D:
round(
comparison.differenceAverage60D,
),
}),
),

nonOverlapping:
controls.nonOverlapping.map(
(comparison) => ({
horizon:
comparison.horizon,

divergence:
summarizeStatistics(
comparison.divergence,
),

control:
summarizeStatistics(
comparison.control,
),

differenceAverageReturn:
round(
comparison.differenceAverageReturn,
),

selectionMethod:
comparison.selectionMethod,
}),
),

nonOverlapChecks,

methodology: {
event:
"First day of a contiguous Nasdaq-up / breadth-down episode.",

control:
"Nasdaq positive over 20 days, but not in the divergence state.",

trendBuckets:
"Nasdaq trailing 20-day return: 0–2%, 2–5%, above 5%.",

nonOverlapping:
"Chronological greedy selection independently within event and control groups.",

limitations:
"Controls are not yet matched on VIX, market regime or calendar period. Independent greedy sampling is not paired matching.",
},
});
} catch (error) {
console.error(
"[HistoricalDivergenceControlsTest]",
error,
);

return NextResponse.json(
{
status: "ERROR",

error:
error instanceof Error
? error.message
: "Unknown divergence control test error",
},
{ status: 500 },
);
}
}

