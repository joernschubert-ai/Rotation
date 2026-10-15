import type {
HistoricalForwardOutcome,
} from "./historicalRegimeOutcomes";

import type {
HistoricalPriceVixFeatureDataset,
HistoricalPriceVixFeatureDay,
} from "./historicalRegimePriceVixFeatures";

/* =====================================================
HISTORICAL REGIME — PRICE / VIX FORWARD RESEARCH

Purpose:
- Evaluate historical Nasdaq forward outcomes
- Compare independent price and VIX conditions
- Evaluate joint price/VIX states
- Separate persistent states from transition events
- Report coverage, return distributions and excursions

No synthetic trading signals.
No parameter optimization.
No Optionsschein pricing.
No forward-looking features.
===================================================== */

/* =====================================================
TYPES
===================================================== */

export type HistoricalPriceVixResearchFamily =
| "PRICE_TREND"
| "VIX_5D"
| "VIX_20D"
| "PRICE_VIX_5D"
| "PRICE_VIX_20D"
| "PRICE_TRANSITION";

export type HistoricalPriceVixResearchObservation = {
date: string;

marketIndex: number;

family: HistoricalPriceVixResearchFamily;

state: string;

nasdaq: number;

vix: number;

forward5D: number | null;
forward20D: number | null;
forward60D: number | null;

mfe20D: number | null;
mae20D: number | null;

mfe60D: number | null;
mae60D: number | null;
};

export type HistoricalPriceVixHorizonStatistics = {
horizon: 5 | 20 | 60;

available: number;

averageReturn: number | null;
medianReturn: number | null;

positiveRate: number | null;
negativeRate: number | null;

averageMFE: number | null;
averageMAE: number | null;
};

export type HistoricalPriceVixResearchStatistics = {
family: HistoricalPriceVixResearchFamily;

state: string;

observations: number;

firstDate: string | null;
lastDate: string | null;

horizonStats:
HistoricalPriceVixHorizonStatistics[];
};

export type HistoricalPriceVixForwardDataset = {
/* One observation per aligned date, regardless of state. Descriptive, not matched control. */
baselineStatistics?: HistoricalPriceVixHorizonStatistics[];
observations:
HistoricalPriceVixResearchObservation[];

statistics:
HistoricalPriceVixResearchStatistics[];

diagnostics: {
inputFeatureDays: number;
inputOutcomeDays: number;

matchedFeatureDays: number;
unmatchedFeatureDays: number;

totalObservations: number;
totalGroups: number;

transitionObservations: number;

duplicateOutcomeDates: number;
duplicateFeatureDates: number;

chronological: boolean;

usesOnlyHistoricalFeatures: true;
includesOverlappingStateObservations: true;
transitionEventsAreSeparate: true;
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

if (sorted.length % 2 === 1) {
return sorted[middle];
}

return (
sorted[middle - 1] +
sorted[middle]
) / 2;
}

function rate(
values: number[],
predicate: (value: number) => boolean,
): number | null {
if (!values.length) {
return null;
}

const matches =
values.filter(predicate).length;

return (
matches / values.length
) * 100;
}

function outcomeValue(
observation:
HistoricalPriceVixResearchObservation,
horizon: 5 | 20 | 60,
): number | null {
switch (horizon) {
case 5:
return observation.forward5D;

case 20:
return observation.forward20D;

case 60:
return observation.forward60D;
}
}

function excursionValues(
observations:
HistoricalPriceVixResearchObservation[],
horizon: 5 | 20 | 60,
): {
mfe: number[];
mae: number[];
} {
if (horizon === 5) {
return {
mfe: [],
mae: [],
};
}

const mfe: number[] = [];
const mae: number[] = [];

for (const observation of observations) {
const forward =
outcomeValue(
observation,
horizon,
);

if (!valid(forward)) {
continue;
}

const favorable =
horizon === 20
? observation.mfe20D
: observation.mfe60D;

const adverse =
horizon === 20
? observation.mae20D
: observation.mae60D;

if (valid(favorable)) {
mfe.push(favorable);
}

if (valid(adverse)) {
mae.push(adverse);
}
}

return {
mfe,
mae,
};
}

/* =====================================================
GROUP STATISTICS
===================================================== */

function buildHorizonStatistics(
observations:
HistoricalPriceVixResearchObservation[],
horizon: 5 | 20 | 60,
): HistoricalPriceVixHorizonStatistics {
const returns =
observations
.map(
(observation) =>
outcomeValue(
observation,
horizon,
),
)
.filter(valid);

const excursions =
excursionValues(
observations,
horizon,
);

return {
horizon,

available:
returns.length,

averageReturn:
mean(returns),

medianReturn:
median(returns),

positiveRate:
rate(
returns,
(value) => value > 0,
),

negativeRate:
rate(
returns,
(value) => value < 0,
),

averageMFE:
mean(excursions.mfe),

averageMAE:
mean(excursions.mae),
};
}

/* =====================================================
OBSERVATION CREATION
===================================================== */

function createObservation(
feature: HistoricalPriceVixFeatureDay,
outcome: HistoricalForwardOutcome,
marketIndex: number,
family: HistoricalPriceVixResearchFamily,
state: string,
): HistoricalPriceVixResearchObservation {
return {
date:
feature.date,

marketIndex,

family,
state,

nasdaq:
feature.nasdaq,

vix:
feature.vix,

forward5D:
outcome.forward5D,

forward20D:
outcome.forward20D,

forward60D:
outcome.forward60D,

mfe20D:
outcome.mfe20D,

mae20D:
outcome.mae20D,

mfe60D:
outcome.mfe60D,

mae60D:
outcome.mae60D,
};
}

/* =====================================================
BUILD RESEARCH DATASET
===================================================== */

export function buildHistoricalRegimePriceVixForward(
features: HistoricalPriceVixFeatureDataset,
outcomes: HistoricalForwardOutcome[],
): HistoricalPriceVixForwardDataset {
const sortedFeatures =
[...features.days].sort(
(a, b) =>
a.date.localeCompare(b.date),
);

const outcomeMap =
new Map<
string,
HistoricalForwardOutcome
>();

let duplicateOutcomeDates = 0;

for (const outcome of outcomes) {
if (
outcomeMap.has(outcome.date)
) {
duplicateOutcomeDates++;
continue;
}

outcomeMap.set(
outcome.date,
outcome,
);
}

const observations:
HistoricalPriceVixResearchObservation[] = [];

const seenFeatureDates =
new Set<string>();

let duplicateFeatureDates = 0;

let matchedFeatureDays = 0;
let unmatchedFeatureDays = 0;

let transitionObservations = 0;
const baselineDays: HistoricalPriceVixResearchObservation[] = [];

for (
let index = 0;
index < sortedFeatures.length;
index++
) {
const feature =
sortedFeatures[index];

if (
seenFeatureDates.has(
feature.date,
)
) {
duplicateFeatureDates++;
continue;
}

seenFeatureDates.add(
feature.date,
);

const outcome =
outcomeMap.get(
feature.date,
);

if (!outcome) {
unmatchedFeatureDays++;
continue;
}

matchedFeatureDays++;
baselineDays.push(createObservation(feature, outcome, index, "PRICE_TREND", "UNCONDITIONAL_BASELINE"));

const states: {
family: HistoricalPriceVixResearchFamily;
state: string;
}[] = [];

if (
feature.priceTrendState !==
"INSUFFICIENT_DATA"
) {
states.push({
family:
"PRICE_TREND",

state:
feature.priceTrendState,
});
}

if (
feature.vixTrendState5D !==
"INSUFFICIENT_DATA"
) {
states.push({
family:
"VIX_5D",

state:
feature.vixTrendState5D,
});
}

if (
feature.vixTrendState20D !==
"INSUFFICIENT_DATA"
) {
states.push({
family:
"VIX_20D",

state:
feature.vixTrendState20D,
});
}

if (
feature.priceVixDivergence5D !==
"INSUFFICIENT_DATA"
) {
states.push({
family:
"PRICE_VIX_5D",

state:
feature.priceVixDivergence5D,
});
}

if (
feature.priceVixDivergence20D !==
"INSUFFICIENT_DATA"
) {
states.push({
family:
"PRICE_VIX_20D",

state:
feature.priceVixDivergence20D,
});
}

for (const state of states) {
observations.push(
createObservation(
feature,
outcome,
index,
state.family,
state.state,
),
);
}

for (
const transition of
feature.transitions
) {
if (
transition === "NONE"
) {
continue;
}

observations.push(
createObservation(
feature,
outcome,
index,
"PRICE_TRANSITION",
transition,
),
);

transitionObservations++;
}
}

/* ================================================
AGGREGATE GROUPS
================================================ */

const groups = new Map<
string,
HistoricalPriceVixResearchObservation[]
>();

for (const observation of observations) {
const key =
`${observation.family}::${observation.state}`;

const group =
groups.get(key) ?? [];

group.push(
observation,
);

groups.set(
key,
group,
);
}

const statistics:
HistoricalPriceVixResearchStatistics[] = [];

for (const group of groups.values()) {
if (!group.length) {
continue;
}

const first =
group[0];

const last =
group[group.length - 1];

statistics.push({
family:
first.family,

state:
first.state,

observations:
group.length,

firstDate:
first.date,

lastDate:
last.date,

horizonStats: [
buildHorizonStatistics(
group,
5,
),

buildHorizonStatistics(
group,
20,
),

buildHorizonStatistics(
group,
60,
),
],
});
}

statistics.sort(
(a, b) =>
a.family.localeCompare(
b.family,
) ||
a.state.localeCompare(
b.state,
),
);

/* ================================================
DIAGNOSTICS
================================================ */

const chronological =
observations.every(
(observation, index) =>
index === 0 ||
observation.date >=
observations[index - 1].date,
);

return {
observations,
statistics,
baselineStatistics: [5, 20, 60].map(horizon => buildHorizonStatistics(baselineDays, horizon as 5 | 20 | 60)),

diagnostics: {
inputFeatureDays:
features.days.length,

inputOutcomeDays:
outcomes.length,

matchedFeatureDays,
unmatchedFeatureDays,

totalObservations:
observations.length,

totalGroups:
statistics.length,

transitionObservations,

duplicateOutcomeDates,
duplicateFeatureDates,

chronological,

usesOnlyHistoricalFeatures:
true,

includesOverlappingStateObservations:
true,

transitionEventsAreSeparate:
true,
},
};
}

