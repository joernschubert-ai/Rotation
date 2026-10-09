import { NextResponse } from "next/server";

import { loadHistoricalRegimeMarketData } from
"@/lib/historicalRegime/historicalRegimeProvider";
import { alignHistoricalRegimeMarketData } from
"@/lib/historicalRegime/historicalRegimeAlignment";
import { loadHistoricalRegimeRatesData } from
"@/lib/historicalRegime/historicalRegimeRatesProvider";
import { alignHistoricalRegimeRates } from
"@/lib/historicalRegime/historicalRegimeRatesAlignment";
import { loadHistoricalRegimeMacroVintageData } from
"@/lib/historicalRegime/historicalRegimeMacroVintageProvider";
import { alignHistoricalMacroVintage } from
"@/lib/historicalRegime/historicalRegimeMacroVintageAlignment";
import { loadHistoricalRegimeBreadthData } from
"@/lib/historicalRegime/historicalRegimeBreadthProvider";
import { buildHistoricalMacroFeatures } from
"@/lib/historicalRegime/historicalRegimeMacroFeatures";
import { buildHistoricalRegimeFeatures } from
"@/lib/historicalRegime/historicalRegimeFeatures";
import { buildHistoricalRegimeOutcomes } from
"@/lib/historicalRegime/historicalRegimeOutcomes";
import { buildHistoricalRegimeFeatureSet } from
"@/lib/historicalRegime/historicalRegimeFeatureSet";
import { buildHistoricalRegimeDistributions } from
"@/lib/historicalRegime/historicalRegimeDistributions";

import {
buildHistoricalRegimeConditionalOutcomes,
type HistoricalConditionalCombination,
type HistoricalConditionalCondition,
} from "@/lib/historicalRegime/historicalRegimeConditionalOutcomes";

/* =====================================================
GENERAL HELPERS
===================================================== */

function isFiniteNumber(value: unknown): value is number {
return typeof value === "number" && Number.isFinite(value);
}

function round(
value: number | null,
digits = 4,
): number | null {
return isFiniteNumber(value)
? Number(value.toFixed(digits))
: null;
}

function summarizeAvailability(
rows: Array<Record<string, unknown>>,
key: string,
) {
const available = rows.filter(
(row) => isFiniteNumber(row[key]),
).length;

return {
available,
missing: rows.length - available,
coverage:
rows.length > 0
? Number(
((available / rows.length) * 100).toFixed(2),
)
: 0,
};
}

function normalizeFeatureRow(
row: Record<string, unknown>,
) {
const result: Record<string, unknown> = {
date: row.date,
};

const numericKeys = [
"cpi",
"coreCpi",
"nfci",
"real10Y",
"cpiYoY",
"coreCpiYoY",
"cpiChange3M",
"cpiChange6M",
"coreCpiChange3M",
"coreCpiChange6M",
"nfciChange4W",
"nfciChange12W",
"real10YChange20D",
"real10YChange60D",
"fedFunds",
"treasury2Y",
"treasury10Y",
"treasury10Y2YSpread",
"fedFundsChange20D",
"treasury2YChange20D",
"treasury10YChange20D",
"treasury10Y2YSpreadChange20D",
];

for (const key of numericKeys) {
result[key] = round(
isFiniteNumber(row[key]) ? row[key] : null,
);
}

const provenanceKeys = [
"cpiSourceDate",
"coreCpiSourceDate",
"nfciSourceDate",
"real10YSourceDate",
"cpiRealtimeStart",
"coreCpiRealtimeStart",
"nfciRealtimeStart",
"real10YRealtimeStart",
];

for (const key of provenanceKeys) {
result[key] = row[key] ?? null;
}

return result;
}

function findSample(
rows: Array<Record<string, unknown>>,
date: string,
) {
const row = rows.find(
(item) => item.date === date,
);

return row ? normalizeFeatureRow(row) : null;
}

function calculateChecks(
rows: Array<Record<string, unknown>>,
alignment: ReturnType<
typeof alignHistoricalMacroVintage
>,
) {
const checks: Record<string, boolean> = {};

checks.featureCountMatchesAlignment =
rows.length === alignment.count;

checks.firstDateMatches =
rows[0]?.date === alignment.firstDate;

checks.lastDateMatches =
rows[rows.length - 1]?.date ===
alignment.lastDate;

checks.chronological = rows.every(
(row, index) =>
index === 0 ||
String(rows[index - 1].date) <
String(row.date),
);

checks.rawCpiCoverage =
summarizeAvailability(rows, "cpi").available > 0;

checks.rawCoreCpiCoverage =
summarizeAvailability(rows, "coreCpi").available > 0;

checks.rawNfciCoverage =
summarizeAvailability(rows, "nfci").available > 0;

checks.rawReal10YCoverage =
summarizeAvailability(rows, "real10Y").available > 0;

checks.rateCoverage =
summarizeAvailability(rows, "fedFunds").available > 0 &&
summarizeAvailability(rows, "treasury2Y").available > 0 &&
summarizeAvailability(rows, "treasury10Y").available > 0;

checks.spreadConsistency = rows.every((row) => {
const treasury10Y = row.treasury10Y;
const treasury2Y = row.treasury2Y;
const spread = row.treasury10Y2YSpread;

if (
!isFiniteNumber(treasury10Y) ||
!isFiniteNumber(treasury2Y) ||
!isFiniteNumber(spread)
) {
return true;
}

return (
Math.abs(treasury10Y - treasury2Y - spread) <
0.000001
);
});

checks.provenanceNotAfterMarketDate =
rows.every((row) => {
const marketDate = String(row.date);

const provenanceKeys = [
"cpiSourceDate",
"coreCpiSourceDate",
"nfciSourceDate",
"real10YSourceDate",
"cpiRealtimeStart",
"coreCpiRealtimeStart",
"nfciRealtimeStart",
"real10YRealtimeStart",
];

return provenanceKeys.every((key) => {
const value = row[key];

return (
value == null ||
String(value) <= marketDate
);
});
});

checks.all = Object.values(checks).every(Boolean);

return checks;
}

/* =====================================================
HISTORICAL FEATURE TYPES
===================================================== */

type FeatureSet = ReturnType<
typeof buildHistoricalRegimeFeatureSet
>;

type FeatureDay = FeatureSet["days"][number];

type ThresholdKey =
| "nasdaqDistanceMA200P90"
| "russellVsNasdaq20DP10"
| "real10YChange60DP75"
| "breadth50P10"
| "breadth50P25"
| "breadth200P10"
| "breadth200P25";

type Thresholds = Record<
ThresholdKey,
number | null
>;

type ThresholdSampleCounts = {
nasdaqDistanceMA200: number;
russellVsNasdaq20D: number;
real10YChange60D: number;
breadth50: number;
breadth200: number;
};

type FeatureSelector = (
day: FeatureDay,
) => number | null;

const FEATURE_SELECTORS = {
nasdaqDistanceMA200: (
day: FeatureDay,
) => day.market.nasdaqDistanceMA200,

russellVsNasdaq20D: (
day: FeatureDay,
) => day.market.russellVsNasdaq20D,

real10YChange60D: (
day: FeatureDay,
) => day.macro.real10YChange60D,

breadth50: (
day: FeatureDay,
) => day.breadth?.breadth50 ?? null,

breadth200: (
day: FeatureDay,
) => day.breadth?.breadth200 ?? null,
} satisfies Record<string, FeatureSelector>;

type FeatureKey = keyof typeof FEATURE_SELECTORS;

/* =====================================================
PERCENTILES

Same interpolation method for retrospective
and walk-forward evaluation.
===================================================== */

function calculatePercentile(
values: number[],
percentile: number,
): number | null {
if (values.length === 0) return null;

const sorted = [...values].sort(
(a, b) => a - b,
);

if (sorted.length === 1) {
return sorted[0];
}

const position =
(sorted.length - 1) * percentile;

const lowerIndex = Math.floor(position);
const upperIndex = Math.ceil(position);

if (lowerIndex === upperIndex) {
return sorted[lowerIndex];
}

const weight = position - lowerIndex;

return (
sorted[lowerIndex] +
(sorted[upperIndex] - sorted[lowerIndex]) *
weight
);
}

function extractFeatureValues(
days: FeatureDay[],
selector: FeatureSelector,
): number[] {
return days
.map(selector)
.filter(
(value): value is number =>
isFiniteNumber(value),
);
}

function calculateThresholds(
days: FeatureDay[],
): {
thresholds: Thresholds;
thresholdSampleCounts: ThresholdSampleCounts;
} {
const values = {
nasdaqDistanceMA200: extractFeatureValues(
days,
FEATURE_SELECTORS.nasdaqDistanceMA200,
),
russellVsNasdaq20D: extractFeatureValues(
days,
FEATURE_SELECTORS.russellVsNasdaq20D,
),
real10YChange60D: extractFeatureValues(
days,
FEATURE_SELECTORS.real10YChange60D,
),
breadth50: extractFeatureValues(
days,
FEATURE_SELECTORS.breadth50,
),
breadth200: extractFeatureValues(
days,
FEATURE_SELECTORS.breadth200,
),
};

const thresholds: Thresholds = {
nasdaqDistanceMA200P90:
calculatePercentile(
values.nasdaqDistanceMA200,
0.9,
),

russellVsNasdaq20DP10:
calculatePercentile(
values.russellVsNasdaq20D,
0.1,
),

real10YChange60DP75:
calculatePercentile(
values.real10YChange60D,
0.75,
),

breadth50P10:
calculatePercentile(values.breadth50, 0.1),

breadth50P25:
calculatePercentile(values.breadth50, 0.25),

breadth200P10:
calculatePercentile(values.breadth200, 0.1),

breadth200P25:
calculatePercentile(values.breadth200, 0.25),
};

const thresholdSampleCounts: ThresholdSampleCounts = {
nasdaqDistanceMA200:
values.nasdaqDistanceMA200.length,

russellVsNasdaq20D:
values.russellVsNasdaq20D.length,

real10YChange60D:
values.real10YChange60D.length,

breadth50:
values.breadth50.length,

breadth200:
values.breadth200.length,
};

return {
thresholds,
thresholdSampleCounts,
};
}

/* =====================================================
CONDITIONAL COMBINATIONS

The same 15 definitions are used for both
retrospective and walk-forward evaluations.
===================================================== */

function createCondition(
id: string,
label: string,
feature: HistoricalConditionalCondition["feature"],
operator: HistoricalConditionalCondition["operator"],
value: number,
): HistoricalConditionalCondition {
return {
id,
label,
feature,
operator,
value,
};
}

function buildCombinationsFromThresholds(
thresholds: Thresholds,
): HistoricalConditionalCombination[] {
const combinations:
HistoricalConditionalCombination[] = [];

const nasdaqExtended =
thresholds.nasdaqDistanceMA200P90 === null
? null
: createCondition(
"nasdaq-distance-ma200-p90",
"Nasdaq distance to MA200 >= P90",
"market.nasdaqDistanceMA200",
"gte",
thresholds.nasdaqDistanceMA200P90,
);

const russellWeak =
thresholds.russellVsNasdaq20DP10 === null
? null
: createCondition(
"russell-vs-nasdaq-p10",
"Russell vs Nasdaq 20D <= P10",
"market.russellVsNasdaq20D",
"lte",
thresholds.russellVsNasdaq20DP10,
);

const real10YRising =
thresholds.real10YChange60DP75 === null
? null
: createCondition(
"real10y-change-60d-p75",
"Real10Y 60D change >= P75",
"macro.real10YChange60D",
"gte",
thresholds.real10YChange60DP75,
);

const vixRising = createCondition(
"vix-change-20d-positive",
"VIX 20D change > 0",
"market.vixChange20D",
"gt",
0,
);

const breadth50WeakP10 =
thresholds.breadth50P10 === null
? null
: createCondition(
"breadth50-p10",
"Breadth50 <= historical P10",
"breadth.breadth50",
"lte",
thresholds.breadth50P10,
);

const breadth50WeakP25 =
thresholds.breadth50P25 === null
? null
: createCondition(
"breadth50-p25",
"Breadth50 <= historical P25",
"breadth.breadth50",
"lte",
thresholds.breadth50P25,
);

const breadth200WeakP10 =
thresholds.breadth200P10 === null
? null
: createCondition(
"breadth200-p10",
"Breadth200 <= historical P10",
"breadth.breadth200",
"lte",
thresholds.breadth200P10,
);

const breadth200WeakP25 =
thresholds.breadth200P25 === null
? null
: createCondition(
"breadth200-p25",
"Breadth200 <= historical P25",
"breadth.breadth200",
"lte",
thresholds.breadth200P25,
);

function addCombination(
id: string,
label: string,
conditions: Array<
HistoricalConditionalCondition | null
>,
) {
if (
conditions.some(
(condition) => condition === null,
)
) {
return;
}

combinations.push({
id,
label,
conditions:
conditions as HistoricalConditionalCondition[],
});
}

addCombination(
"nasdaq-above-ma200-p90",
"Nasdaq distance MA200 >= P90",
[nasdaqExtended],
);

addCombination(
"russell-vs-nasdaq-p10",
"Russell vs Nasdaq 20D <= P10",
[russellWeak],
);

addCombination(
"real10y-rising-p75",
"Real10Y 60D change >= P75",
[real10YRising],
);

addCombination(
"vix-rising-20d",
"VIX 20D change > 0",
[vixRising],
);

addCombination(
"breadth50-weak-p10",
"Breadth50 <= P10",
[breadth50WeakP10],
);

addCombination(
"breadth50-weak-p25",
"Breadth50 <= P25",
[breadth50WeakP25],
);

addCombination(
"breadth200-weak-p10",
"Breadth200 <= P10",
[breadth200WeakP10],
);

addCombination(
"breadth200-weak-p25",
"Breadth200 <= P25",
[breadth200WeakP25],
);

addCombination(
"nasdaq-extended-breadth50-weak",
"Nasdaq extended + Breadth50 weak (P25)",
[nasdaqExtended, breadth50WeakP25],
);

addCombination(
"nasdaq-extended-breadth200-weak",
"Nasdaq extended + Breadth200 weak (P25)",
[nasdaqExtended, breadth200WeakP25],
);

addCombination(
"russell-weak-breadth50-weak",
"Russell relative weakness + Breadth50 weak (P25)",
[russellWeak, breadth50WeakP25],
);

addCombination(
"breadth50-weak-vix-rising",
"Breadth50 weak (P25) + VIX rising",
[breadth50WeakP25, vixRising],
);

addCombination(
"breadth200-weak-vix-rising",
"Breadth200 weak (P25) + VIX rising",
[breadth200WeakP25, vixRising],
);

addCombination(
"breadth50-weak-real10y-rising",
"Breadth50 weak (P25) + Real10Y rising",
[breadth50WeakP25, real10YRising],
);

addCombination(
"combined-structural-stress",
"Nasdaq extended + Russell weak + Real10Y rising + VIX rising",
[
nasdaqExtended,
russellWeak,
real10YRising,
vixRising,
],
);

return combinations;
}

function buildConditionalCombinations(
historicalFeatureSet: FeatureSet,
) {
const {
thresholds,
thresholdSampleCounts,
} = calculateThresholds(
historicalFeatureSet.days,
);

return {
combinations:
buildCombinationsFromThresholds(thresholds),
thresholds,
thresholdSampleCounts,
};
}

/* =====================================================
WALK-FORWARD EVALUATION

- Expanding historical window
- Minimum 756 previous trading observations
- Thresholds calculated through T-1
- Current day T is never in threshold training
- Future returns used only for evaluation
===================================================== */

const WALK_FORWARD_MIN_TRAINING_DAYS = 756;

type WalkForwardReturnStats = {
count: number;
mean: number | null;
median: number | null;
positiveShare: number | null;
negativeShare: number | null;
minimum: number | null;
maximum: number | null;
};

type WalkForwardObservation = {
date: string;
forward20D: number | null;
forward60D: number | null;
mfe20D: number | null;
mae20D: number | null;
mfe60D: number | null;
mae60D: number | null;
};

type WalkForwardCombinationResult = {
id: string;
label: string;
matchedDays: number;
firstMatchDate: string | null;
lastMatchDate: string | null;
forward20D: WalkForwardReturnStats;
forward60D: WalkForwardReturnStats;
mfe20D: WalkForwardReturnStats;
mae20D: WalkForwardReturnStats;
mfe60D: WalkForwardReturnStats;
mae60D: WalkForwardReturnStats;
independentEpisodes20D: number;
independentEpisodes60D: number;
};

const COMBINATION_DEFINITIONS = [
{
id: "nasdaq-above-ma200-p90",
label: "Nasdaq distance MA200 >= P90",
},
{
id: "russell-vs-nasdaq-p10",
label: "Russell vs Nasdaq 20D <= P10",
},
{
id: "real10y-rising-p75",
label: "Real10Y 60D change >= P75",
},
{
id: "vix-rising-20d",
label: "VIX 20D change > 0",
},
{
id: "breadth50-weak-p10",
label: "Breadth50 <= P10",
},
{
id: "breadth50-weak-p25",
label: "Breadth50 <= P25",
},
{
id: "breadth200-weak-p10",
label: "Breadth200 <= P10",
},
{
id: "breadth200-weak-p25",
label: "Breadth200 <= P25",
},
{
id: "nasdaq-extended-breadth50-weak",
label: "Nasdaq extended + Breadth50 weak (P25)",
},
{
id: "nasdaq-extended-breadth200-weak",
label: "Nasdaq extended + Breadth200 weak (P25)",
},
{
id: "russell-weak-breadth50-weak",
label: "Russell relative weakness + Breadth50 weak (P25)",
},
{
id: "breadth50-weak-vix-rising",
label: "Breadth50 weak (P25) + VIX rising",
},
{
id: "breadth200-weak-vix-rising",
label: "Breadth200 weak (P25) + VIX rising",
},
{
id: "breadth50-weak-real10y-rising",
label: "Breadth50 weak (P25) + Real10Y rising",
},
{
id: "combined-structural-stress",
label: "Nasdaq extended + Russell weak + Real10Y rising + VIX rising",
},
] as const;

function getConditionFeatureValue(
day: FeatureDay,
feature: HistoricalConditionalCondition["feature"],
): number | null {
switch (feature) {
case "market.nasdaqDistanceMA200":
return day.market.nasdaqDistanceMA200;

case "market.russellVsNasdaq20D":
return day.market.russellVsNasdaq20D;

case "macro.real10YChange60D":
return day.macro.real10YChange60D;

case "market.vixChange20D":
return day.market.vixChange20D;

case "breadth.breadth50":
return day.breadth?.breadth50 ?? null;

case "breadth.breadth200":
return day.breadth?.breadth200 ?? null;

default:
return null;
}
}

function evaluateWalkForwardCondition(
day: FeatureDay,
condition: HistoricalConditionalCondition,
): boolean {
const value = getConditionFeatureValue(
day,
condition.feature,
);

if (!isFiniteNumber(value)) {
return false;
}

switch (condition.operator) {
case "gt":
return value > condition.value;

case "gte":
return value >= condition.value;

case "lt":
return value < condition.value;

case "lte":
return value <= condition.value;

case "eq":
return value === condition.value;

default:
return false;
}
}

function evaluateWalkForwardCombination(
day: FeatureDay,
combination: HistoricalConditionalCombination,
): boolean {
return (
combination.conditions.length > 0 &&
combination.conditions.every(
(condition) =>
evaluateWalkForwardCondition(
day,
condition,
),
)
);
}

function calculateReturnStats(
observations: WalkForwardObservation[],
key:
| "forward20D"
| "forward60D"
| "mfe20D"
| "mae20D"
| "mfe60D"
| "mae60D",
): WalkForwardReturnStats {
const values = observations
.map((observation) => observation[key])
.filter(
(value): value is number =>
isFiniteNumber(value),
)
.sort((a, b) => a - b);

if (values.length === 0) {
return {
count: 0,
mean: null,
median: null,
positiveShare: null,
negativeShare: null,
minimum: null,
maximum: null,
};
}

const sum = values.reduce(
(total, value) => total + value,
0,
);

const positiveCount = values.filter(
(value) => value > 0,
).length;

const negativeCount = values.filter(
(value) => value < 0,
).length;

return {
count: values.length,
mean: round(sum / values.length),
median: round(
calculatePercentile(values, 0.5),
),
positiveShare: round(
(positiveCount / values.length) * 100,
2,
),
negativeShare: round(
(negativeCount / values.length) * 100,
2,
),
minimum: round(values[0]),
maximum: round(values[values.length - 1]),
};
}

/*
* Episode proxy:
*
* A new episode begins only when the previous
* counted signal is at least "horizon" trading
* sessions in the past.
*
* This is a non-overlap approximation, not
* statistical independence.
*/

function countNonOverlappingEpisodes(
indices: number[],
horizon: number,
): number {
let count = 0;
let lastSelectedIndex =
Number.NEGATIVE_INFINITY;

for (const index of indices) {
if (
index - lastSelectedIndex >= horizon
) {
count += 1;
lastSelectedIndex = index;
}
}

return count;
}

function buildWalkForwardConditionalOutcomes(
featureSet: FeatureSet,
minimumTrainingDays =
WALK_FORWARD_MIN_TRAINING_DAYS,
) {
const days = featureSet.days;

const matchedObservations = new Map<
string,
WalkForwardObservation[]
>();

const matchedIndices = new Map<
string,
number[]
>();

for (const definition of COMBINATION_DEFINITIONS) {
matchedObservations.set(
definition.id,
[],
);

matchedIndices.set(
definition.id,
[],
);
}

const chronological = days.every(
(day, index) =>
index === 0 ||
days[index - 1].date < day.date,
);

if (!chronological) {
throw new Error(
"Walk-forward requires chronological feature days.",
);
}

let evaluatedDays = 0;
let daysWithCompleteThresholds = 0;
let daysWithIncompleteThresholds = 0;

let firstEvaluationDate: string | null = null;
let lastEvaluationDate: string | null = null;

let firstCompleteThresholdDate:
string | null = null;

let lastCompleteThresholdDate:
string | null = null;

let latestThresholds: Thresholds | null = null;
let latestThresholdSampleCounts:
ThresholdSampleCounts | null = null;

/*
* The expanding training sample ends at
* index - 1. Current day is excluded.
*/

for (
let index = minimumTrainingDays;
index < days.length;
index++
) {
const currentDay = days[index];

const trainingDays = days.slice(
0,
index,
);

const {
thresholds,
thresholdSampleCounts,
} = calculateThresholds(trainingDays);

latestThresholds = thresholds;
latestThresholdSampleCounts =
thresholdSampleCounts;

evaluatedDays++;

if (firstEvaluationDate === null) {
firstEvaluationDate = currentDay.date;
}

lastEvaluationDate = currentDay.date;

const allThresholdsAvailable =
Object.values(thresholds).every(
isFiniteNumber,
);

if (allThresholdsAvailable) {
daysWithCompleteThresholds++;

if (
firstCompleteThresholdDate === null
) {
firstCompleteThresholdDate =
currentDay.date;
}

lastCompleteThresholdDate =
currentDay.date;
} else {
daysWithIncompleteThresholds++;
}

const combinations =
buildCombinationsFromThresholds(
thresholds,
);

for (const combination of combinations) {
if (
!evaluateWalkForwardCombination(
currentDay,
combination,
)
) {
continue;
}

matchedIndices
.get(combination.id)
?.push(index);

matchedObservations
.get(combination.id)
?.push({
date: currentDay.date,

forward20D:
currentDay.outcome.forward20D,

forward60D:
currentDay.outcome.forward60D,

mfe20D:
currentDay.outcome.mfe20D,

mae20D:
currentDay.outcome.mae20D,

mfe60D:
currentDay.outcome.mfe60D,

mae60D:
currentDay.outcome.mae60D,
});
}
}

const results: WalkForwardCombinationResult[] =
COMBINATION_DEFINITIONS.map(
(definition) => {
const observations =
matchedObservations.get(
definition.id,
) ?? [];

const indices =
matchedIndices.get(
definition.id,
) ?? [];

return {
id: definition.id,
label: definition.label,

matchedDays:
observations.length,

firstMatchDate:
observations[0]?.date ?? null,

lastMatchDate:
observations[
observations.length - 1
]?.date ?? null,

forward20D:
calculateReturnStats(
observations,
"forward20D",
),

forward60D:
calculateReturnStats(
observations,
"forward60D",
),

mfe20D:
calculateReturnStats(
observations,
"mfe20D",
),

mae20D:
calculateReturnStats(
observations,
"mae20D",
),

mfe60D:
calculateReturnStats(
observations,
"mfe60D",
),

mae60D:
calculateReturnStats(
observations,
"mae60D",
),

independentEpisodes20D:
countNonOverlappingEpisodes(
indices.filter(
(index) =>
isFiniteNumber(
days[index].outcome.forward20D,
),
),
20,
),

independentEpisodes60D:
countNonOverlappingEpisodes(
indices.filter(
(index) =>
isFiniteNumber(
days[index].outcome.forward60D,
),
),
60,
),
};
},
);

const checks = {
chronological,

trainingWindowAvailable:
days.length > minimumTrainingDays,

evaluatedDaysConsistent:
evaluatedDays ===
Math.max(
0,
days.length - minimumTrainingDays,
),

thresholdDayCountsConsistent:
daysWithCompleteThresholds +
daysWithIncompleteThresholds ===
evaluatedDays,

noEvaluationBeforeWarmup:
firstEvaluationDate === null ||
firstEvaluationDate ===
days[minimumTrainingDays]?.date,

resultCountMatchesDefinitions:
results.length ===
COMBINATION_DEFINITIONS.length,

noMatchesExceedEvaluatedDays:
results.every(
(result) =>
result.matchedDays <= evaluatedDays,
),
};

return {
methodology: {
thresholdMethod:
"Expanding walk-forward percentiles",

minimumTrainingDays,

thresholdInformationCutoff:
"Previous trading day T-1",

currentDayIncludedInTraining:
false,

outcomeUsage:
"Forward returns are used only after signal evaluation",

intendedUse:
"Historical out-of-sample threshold evaluation",

predictiveUse:
"Exploratory; not independently validated or calibrated",

breadthScale:
"Ratios from 0 to 1",

missingBreadthPolicy:
"Missing breadth never satisfies a breadth condition",

episodeMethod:
"Greedy non-overlapping signal windows; independence not established",

percentiles:
"P10/P25/P75/P90 calculated from prior observations only",
},

diagnostics: {
inputDays: days.length,

evaluatedDays,

skippedWarmupDays:
Math.min(
days.length,
minimumTrainingDays,
),

firstEvaluationDate,
lastEvaluationDate,

daysWithCompleteThresholds,
daysWithIncompleteThresholds,

firstCompleteThresholdDate,
lastCompleteThresholdDate,

latestThresholds,
latestThresholdSampleCounts,
},

checks: {
...checks,
all: Object.values(checks).every(Boolean),
},

results,
};
}

/* =====================================================
API ROUTE
===================================================== */

export async function GET() {
try {
const [
marketData,
ratesData,
macroVintageData,
breadthData,
] = await Promise.all([
loadHistoricalRegimeMarketData(),
loadHistoricalRegimeRatesData(),
loadHistoricalRegimeMacroVintageData(),
loadHistoricalRegimeBreadthData(),
]);

/*
* 1. MARKET ALIGNMENT
*/

const marketAlignment =
alignHistoricalRegimeMarketData(
marketData,
);

/*
* 2. RATES ALIGNMENT
*/

const ratesAlignment =
alignHistoricalRegimeRates(
marketAlignment,
ratesData,
);

/*
* 3. MACRO VINTAGE ALIGNMENT
*/

const macroAlignment =
alignHistoricalMacroVintage(
marketAlignment,
macroVintageData,
);

/*
* 4. MACRO FEATURES
*/

const macroFeatureDataset =
buildHistoricalMacroFeatures(
macroAlignment,
ratesAlignment.days,
);

/*
* 5. MARKET FEATURES
*/

const marketFeatureDataset =
buildHistoricalRegimeFeatures(
ratesAlignment.days,
);

/*
* 6. FORWARD OUTCOMES
*/

const outcomeDataset =
buildHistoricalRegimeOutcomes(
marketAlignment.days,
);

/*
* 7. JOIN
*/

const historicalFeatureSet =
buildHistoricalRegimeFeatureSet(
marketFeatureDataset,
macroFeatureDataset.days,
outcomeDataset,
breadthData.days,
);

/*
* 8. HISTORICAL DISTRIBUTIONS
*/

const historicalDistributions =
buildHistoricalRegimeDistributions(
historicalFeatureSet,
);

/*
* 9. RETROSPECTIVE CONDITIONAL OUTCOMES
*
* Existing methodology retained.
*/

const {
combinations:
historicalConditionalCombinations,

thresholds:
historicalConditionalThresholds,

thresholdSampleCounts:
historicalThresholdSampleCounts,
} = buildConditionalCombinations(
historicalFeatureSet,
);

const historicalConditionalOutcomes =
buildHistoricalRegimeConditionalOutcomes(
historicalFeatureSet,
historicalConditionalCombinations,
);

/*
* 10. WALK-FORWARD CONDITIONAL OUTCOMES
*/

const historicalWalkForward =
buildWalkForwardConditionalOutcomes(
historicalFeatureSet,
);

/*
* EXISTING MACRO FEATURE OUTPUT
*/

const rows =
macroFeatureDataset.days as Array<
Record<string, unknown>
>;

const featureAvailability = {
cpi:
summarizeAvailability(rows, "cpi"),

coreCpi:
summarizeAvailability(rows, "coreCpi"),

nfci:
summarizeAvailability(rows, "nfci"),

real10Y:
summarizeAvailability(rows, "real10Y"),

cpiYoY:
summarizeAvailability(rows, "cpiYoY"),

coreCpiYoY:
summarizeAvailability(rows, "coreCpiYoY"),

cpiChange3M:
summarizeAvailability(rows, "cpiChange3M"),

cpiChange6M:
summarizeAvailability(rows, "cpiChange6M"),

coreCpiChange3M:
summarizeAvailability(rows, "coreCpiChange3M"),

coreCpiChange6M:
summarizeAvailability(rows, "coreCpiChange6M"),

nfciChange4W:
summarizeAvailability(rows, "nfciChange4W"),

nfciChange12W:
summarizeAvailability(rows, "nfciChange12W"),

real10YChange20D:
summarizeAvailability(rows, "real10YChange20D"),

real10YChange60D:
summarizeAvailability(rows, "real10YChange60D"),

fedFunds:
summarizeAvailability(rows, "fedFunds"),

treasury2Y:
summarizeAvailability(rows, "treasury2Y"),

treasury10Y:
summarizeAvailability(rows, "treasury10Y"),

treasury10Y2YSpread:
summarizeAvailability(
rows,
"treasury10Y2YSpread",
),

fedFundsChange20D:
summarizeAvailability(
rows,
"fedFundsChange20D",
),

treasury2YChange20D:
summarizeAvailability(
rows,
"treasury2YChange20D",
),

treasury10YChange20D:
summarizeAvailability(
rows,
"treasury10YChange20D",
),

treasury10Y2YSpreadChange20D:
summarizeAvailability(
rows,
"treasury10Y2YSpreadChange20D",
),
};

/*
* SAMPLE DATES
*/

const sampleDates = [
marketAlignment.firstDate,
"2011-10-03",
"2019-04-03",
"2020-03-23",
"2022-06-15",
"2024-04-01",
"2026-10-02",
marketAlignment.lastDate,
].filter(
(date): date is string =>
typeof date === "string",
);

const uniqueSampleDates = [
...new Set(sampleDates),
];

const samples =
uniqueSampleDates.map((date) => ({
date,
feature: findSample(rows, date),
}));

/*
* EXISTING MACRO CHECKS
*/

const checks =
calculateChecks(
rows,
macroAlignment,
);

/*
* HISTORICAL FEATURE SET CHECKS
*/

const historicalFeatureSetChecks = {
marketFeatureCountMatchesAlignment:
marketFeatureDataset.length ===
marketAlignment.count,

macroFeatureCountMatchesAlignment:
macroFeatureDataset.days.length ===
macroAlignment.count,

outcomeCountMatchesMarketAlignment:
outcomeDataset.length ===
marketAlignment.count,

breadthProviderNotEmpty:
breadthData.count > 0,

breadthChronological:
breadthData.diagnostics.chronological,

breadthCoverageAvailable:
breadthData.diagnostics
.breadth50AvailableCount > 0 &&
breadthData.diagnostics
.breadth200AvailableCount > 0,

joinedFeatureSetNotEmpty:
historicalFeatureSet.count > 0,

chronological:
historicalFeatureSet.diagnostics
.chronological,

noDuplicateMarketDates:
historicalFeatureSet.diagnostics
.duplicateMarketDates === 0,

noDuplicateMacroDates:
historicalFeatureSet.diagnostics
.duplicateMacroDates === 0,

noDuplicateBreadthDates:
historicalFeatureSet.diagnostics
.duplicateBreadthDates === 0,

noDuplicateOutcomeDates:
historicalFeatureSet.diagnostics
.duplicateOutcomeDates === 0,
};

const allChecks =
checks.all &&
Object.values(
historicalFeatureSetChecks,
).every(Boolean) &&
historicalWalkForward.checks.all;

/*
* RESPONSE
*/

const response = {
ok: allChecks,

source: {
marketProvider: "Yahoo Finance",
ratesProvider: "FRED",
macroProvider: "FRED",
breadthProvider: "Yahoo Finance",
macroMode:
"revision-aware output_type=1",
},

historicalStart:
marketAlignment.firstDate,

historicalEnd:
marketAlignment.lastDate,

market: {
count: marketAlignment.count,
firstDate: marketAlignment.firstDate,
lastDate: marketAlignment.lastDate,
},

macroAlignment: {
count: macroAlignment.count,
firstDate: macroAlignment.firstDate,
lastDate: macroAlignment.lastDate,
fullyCoveredCount:
macroAlignment.diagnostics
.allSeriesAvailableCount,
futureReleaseLeakage:
macroAlignment.diagnostics
.futureReleaseLeakageCount,
},

ratesAlignment: {
count: ratesAlignment.days.length,

firstDate:
ratesAlignment.days.length > 0
? ratesAlignment.days[0].date
: null,

lastDate:
ratesAlignment.days.length > 0
? ratesAlignment.days[
ratesAlignment.days.length - 1
].date
: null,
},

breadth: {
count: breadthData.count,
firstDate: breadthData.firstDate,
lastDate: breadthData.lastDate,
universeSize: breadthData.universeSize,
uniqueUniverseSize:
breadthData.uniqueUniverseSize,
diagnostics: breadthData.diagnostics,
},

features: {
count: rows.length,

firstDate:
rows.length > 0
? rows[0].date
: null,

lastDate:
rows.length > 0
? rows[rows.length - 1].date
: null,
},

featureAvailability,

marketFeatures: {
count: marketFeatureDataset.length,

firstDate:
marketFeatureDataset.length > 0
? marketFeatureDataset[0].date
: null,

lastDate:
marketFeatureDataset.length > 0
? marketFeatureDataset[
marketFeatureDataset.length - 1
].date
: null,
},

outcomes: {
count: outcomeDataset.length,

firstDate:
outcomeDataset.length > 0
? outcomeDataset[0].date
: null,

lastDate:
outcomeDataset.length > 0
? outcomeDataset[
outcomeDataset.length - 1
].date
: null,
},

historicalFeatureSet: {
count: historicalFeatureSet.count,
firstDate:
historicalFeatureSet.firstDate,
lastDate:
historicalFeatureSet.lastDate,
diagnostics:
historicalFeatureSet.diagnostics,
checks:
historicalFeatureSetChecks,
},

historicalDistributions,

historicalConditionalOutcomes: {
methodology: {
thresholdMethod:
"Full-sample descriptive percentiles",

intendedUse:
"Retrospective exploratory analysis",

predictiveUse:
"Not validated; use walk-forward thresholds before predictive claims",

breadthScale:
"Ratios from 0 to 1",

missingBreadthPolicy:
"Missing breadth does not satisfy a condition",
},

thresholds:
historicalConditionalThresholds,

thresholdSampleCounts:
historicalThresholdSampleCounts,

results:
historicalConditionalOutcomes,
},

historicalWalkForward,

checks: {
macro: checks,
all: allChecks,
},

samples,
};

return NextResponse.json(response);
} catch (error) {
console.error(
"Historical macro features test failed:",
error,
);

return NextResponse.json(
{
ok: false,
error:
error instanceof Error
? error.message
: String(error),
},
{ status: 500 },
);
}
}

