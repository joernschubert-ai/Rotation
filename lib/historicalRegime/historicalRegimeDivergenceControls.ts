import type {
HistoricalDivergenceFeatureDay,
} from "./historicalRegimeDivergenceFeatures";

import type {
HistoricalDivergenceForwardDataset,
} from "./historicalRegimeDivergenceForward";

import type {
HistoricalForwardOutcome,
} from "./historicalRegimeOutcomes";

/* =====================================================
HISTORICAL DIVERGENCE CONTROLS

Purpose:
- Compare divergence episode starts with non-divergence
Nasdaq-up observations
- Use only historical entry-date information
- Preserve existing forward outcomes
- Provide trend-stratified comparisons
- Provide horizon-specific non-overlapping samples

No scoring.
No trading signals.
No optionsschein pricing.
No optimization of thresholds from outcomes.

Important:
Controls require valid breadth information.
Missing breadth is never interpreted as healthy breadth.

Controls are descriptive and are NOT yet matched
on volatility, long-term trend, or market regime.
===================================================== */

export type HistoricalControlGroup =
| "DIVERGENCE_START"
| "NASDAQ_UP_NO_DIVERGENCE";

export type HistoricalTrendBucket =
| "UP_0_TO_2"
| "UP_2_TO_5"
| "UP_ABOVE_5";

export type HistoricalControlObservation = {
date: string;
group: HistoricalControlGroup;
trendBucket: HistoricalTrendBucket;

marketIndex: number;

nasdaqReturn20D: number;

forward5D: number | null;
forward20D: number | null;
forward60D: number | null;

mfe20D: number | null;
mae20D: number | null;

mfe60D: number | null;
mae60D: number | null;
};

export type HistoricalControlStatistics = {
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
};

export type HistoricalControlComparison = {
trendBucket: HistoricalTrendBucket | "ALL";

divergence: HistoricalControlStatistics;
control: HistoricalControlStatistics;

differenceAverage20D: number | null;
differenceAverage60D: number | null;
};

export type HistoricalNonOverlappingComparison = {
horizon: 20 | 60;

divergence: HistoricalControlStatistics;
control: HistoricalControlStatistics;

differenceAverageReturn: number | null;

selectionMethod:
"CHRONOLOGICAL_GREEDY_PER_GROUP";
};

export type HistoricalDivergenceControlDataset = {
observations: HistoricalControlObservation[];

comparisons: HistoricalControlComparison[];

nonOverlapping: HistoricalNonOverlappingComparison[];

diagnostics: {
inputDivergenceStarts: number;
matchedDivergenceStarts: number;
unmatchedDivergenceStarts: number;

controlCandidates: number;

duplicateDates: number;
chronological: boolean;

trendBucketCounts: Record<
HistoricalTrendBucket,
{
divergence: number;
control: number;
}
>;
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

function mean(
numbers: number[],
): number | null {
if (!numbers.length) {
return null;
}

return numbers.reduce(
(sum, value) => sum + value,
0,
) / numbers.length;
}

function median(
numbers: number[],
): number | null {
if (!numbers.length) {
return null;
}

const sorted = [...numbers].sort(
(a, b) => a - b,
);

const middle = Math.floor(
sorted.length / 2,
);

if (sorted.length % 2 === 1) {
return sorted[middle];
}

return (
sorted[middle - 1] +
sorted[middle]
) / 2;
}

function negativeRate(
numbers: number[],
): number | null {
if (!numbers.length) {
return null;
}

return (
numbers.filter(
(value) => value < 0,
).length / numbers.length
) * 100;
}

function extract(
observations: HistoricalControlObservation[],
selector: (
observation: HistoricalControlObservation,
) => number | null,
): number[] {
return observations
.map(selector)
.filter(valid);
}

function statistics(
observations: HistoricalControlObservation[],
): HistoricalControlStatistics {
const forward20D = extract(
observations,
(observation) => observation.forward20D,
);

const forward60D = extract(
observations,
(observation) => observation.forward60D,
);

return {
count: observations.length,

available20D: forward20D.length,
available60D: forward60D.length,

average20D: mean(forward20D),
median20D: median(forward20D),
negativeRate20D: negativeRate(forward20D),

average60D: mean(forward60D),
median60D: median(forward60D),
negativeRate60D: negativeRate(forward60D),

averageMFE20D: mean(
extract(
observations,
(observation) => observation.mfe20D,
),
),

averageMAE20D: mean(
extract(
observations,
(observation) => observation.mae20D,
),
),

averageMFE60D: mean(
extract(
observations,
(observation) => observation.mfe60D,
),
),

averageMAE60D: mean(
extract(
observations,
(observation) => observation.mae60D,
),
),
};
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

function trendBucket(
return20D: number,
): HistoricalTrendBucket | null {
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

function fromOutcome(
date: string,
group: HistoricalControlGroup,
bucket: HistoricalTrendBucket,
marketIndex: number,
nasdaqReturn20D: number,
outcome: HistoricalForwardOutcome,
): HistoricalControlObservation {
return {
date,
group,
trendBucket: bucket,
marketIndex,
nasdaqReturn20D,

forward5D: outcome.forward5D,
forward20D: outcome.forward20D,
forward60D: outcome.forward60D,

mfe20D: outcome.mfe20D,
mae20D: outcome.mae20D,

mfe60D: outcome.mfe60D,
mae60D: outcome.mae60D,
};
}

/* =====================================================
NON-OVERLAPPING SAMPLE

Greedy chronological selection:
- Require a complete forward horizon
- After selecting index i, next selected index
must be at least i + horizon

Each group is selected independently.

This reduces within-group overlapping outcome
windows but does not produce paired controls.
===================================================== */

function selectNonOverlapping(
observations: HistoricalControlObservation[],
horizon: 20 | 60,
): HistoricalControlObservation[] {
const sorted = [...observations].sort(
(a, b) =>
a.marketIndex - b.marketIndex,
);

const selected: HistoricalControlObservation[] = [];

let lastIndex =
Number.NEGATIVE_INFINITY;

for (const observation of sorted) {
const outcome =
horizon === 20
? observation.forward20D
: observation.forward60D;

if (!valid(outcome)) {
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

/* =====================================================
BUILD DATASET
===================================================== */

export function buildHistoricalRegimeDivergenceControls(
divergenceDays: HistoricalDivergenceFeatureDay[],
forward: HistoricalDivergenceForwardDataset,
outcomes: HistoricalForwardOutcome[],
): HistoricalDivergenceControlDataset {
const outcomeMap = new Map(
outcomes.map(
(outcome, index) => [
outcome.date,
{
outcome,
marketIndex: index,
},
]),
);

const divergenceMap = new Map(
divergenceDays.map(
(day) => [day.date, day],
),
);

const divergenceStartDates = new Set(
forward.observations.map(
(observation) => observation.date,
),
);

const observations: HistoricalControlObservation[] = [];

let unmatchedDivergenceStarts = 0;

/* ================================================
EVENT GROUP: EPISODE STARTS
================================================ */

for (const observation of forward.observations) {
const day = divergenceMap.get(
observation.date,
);

const market = outcomeMap.get(
observation.date,
);

if (
!day ||
!market ||
!valid(day.nasdaqReturn20D)
) {
unmatchedDivergenceStarts++;
continue;
}

const bucket = trendBucket(
day.nasdaqReturn20D,
);

if (!bucket) {
unmatchedDivergenceStarts++;
continue;
}

observations.push(
fromOutcome(
observation.date,
"DIVERGENCE_START",
bucket,
market.marketIndex,
day.nasdaqReturn20D,
market.outcome,
),
);
}

/* ================================================
CONTROL GROUP: NASDAQ UP, NO DIVERGENCE

A valid control requires:
- Positive Nasdaq 20D return
- Not in the target divergence state
- Not an episode start
- Available raw breadth50
- Available 20D breadth change
- Sufficient data for state classification

Missing breadth must never be treated as
evidence of a healthy market.
================================================ */

for (const day of divergenceDays) {
if (
day.state20D ===
"NASDAQ_UP_BREADTH_DOWN" ||
day.state20D ===
"INSUFFICIENT_DATA"
) {
continue;
}

if (divergenceStartDates.has(day.date)) {
continue;
}

if (
!valid(day.nasdaqReturn20D) ||
!valid(day.rawBreadth50) ||
!valid(day.breadth50Change20D)
) {
continue;
}

const bucket = trendBucket(
day.nasdaqReturn20D,
);

if (!bucket) {
continue;
}

const market = outcomeMap.get(
day.date,
);

if (!market) {
continue;
}

observations.push(
fromOutcome(
day.date,
"NASDAQ_UP_NO_DIVERGENCE",
bucket,
market.marketIndex,
day.nasdaqReturn20D,
market.outcome,
),
);
}

observations.sort(
(a, b) =>
a.date.localeCompare(b.date) ||
a.group.localeCompare(b.group),
);

const divergenceObservations =
observations.filter(
(observation) =>
observation.group ===
"DIVERGENCE_START",
);

const controlObservations =
observations.filter(
(observation) =>
observation.group ===
"NASDAQ_UP_NO_DIVERGENCE",
);

const buckets: HistoricalTrendBucket[] = [
"UP_0_TO_2",
"UP_2_TO_5",
"UP_ABOVE_5",
];

/* ================================================
TREND-STRATIFIED COMPARISONS
================================================ */

const comparisons: HistoricalControlComparison[] = [
"ALL" as const,
...buckets,
].map((bucket) => {
const divergenceSample =
bucket === "ALL"
? divergenceObservations
: divergenceObservations.filter(
(observation) =>
observation.trendBucket === bucket,
);

const controlSample =
bucket === "ALL"
? controlObservations
: controlObservations.filter(
(observation) =>
observation.trendBucket === bucket,
);

const divergenceStats =
statistics(divergenceSample);

const controlStats =
statistics(controlSample);

return {
trendBucket: bucket,

divergence: divergenceStats,
control: controlStats,

differenceAverage20D: difference(
divergenceStats.average20D,
controlStats.average20D,
),

differenceAverage60D: difference(
divergenceStats.average60D,
controlStats.average60D,
),
};
});

/* ================================================
NON-OVERLAPPING COMPARISONS
================================================ */

const nonOverlapping:
HistoricalNonOverlappingComparison[] =
([20, 60] as const).map((horizon) => {
const divergenceSample =
selectNonOverlapping(
divergenceObservations,
horizon,
);

const controlSample =
selectNonOverlapping(
controlObservations,
horizon,
);

const divergenceStats =
statistics(divergenceSample);

const controlStats =
statistics(controlSample);

const divergenceMean =
horizon === 20
? divergenceStats.average20D
: divergenceStats.average60D;

const controlMean =
horizon === 20
? controlStats.average20D
: controlStats.average60D;

return {
horizon,

divergence: divergenceStats,
control: controlStats,

differenceAverageReturn:
difference(
divergenceMean,
controlMean,
),

selectionMethod:
"CHRONOLOGICAL_GREEDY_PER_GROUP" as const,
};
});

const duplicateDates =
observations.length -
new Set(
observations.map(
(observation) => observation.date,
),
).size;

return {
observations,
comparisons,
nonOverlapping,

diagnostics: {
inputDivergenceStarts:
forward.observations.length,

matchedDivergenceStarts:
divergenceObservations.length,

unmatchedDivergenceStarts,

controlCandidates:
controlObservations.length,

duplicateDates,

chronological:
observations.every(
(observation, index) =>
index === 0 ||
observation.date >=
observations[index - 1].date,
),

trendBucketCounts:
Object.fromEntries(
buckets.map((bucket) => [
bucket,
{
divergence:
divergenceObservations.filter(
(observation) =>
observation.trendBucket === bucket,
).length,

control:
controlObservations.filter(
(observation) =>
observation.trendBucket === bucket,
).length,
},
]),
) as HistoricalDivergenceControlDataset[
"diagnostics"
]["trendBucketCounts"],
},
};
}

