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

function isFiniteNumber(
value: unknown,
): value is number {
return typeof value === "number" &&
Number.isFinite(value);
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
? round(100 * available / rows.length, 2)
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
isFiniteNumber(row[key])
? row[key]
: null,
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

return row
? normalizeFeatureRow(row)
: null;
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

return Math.abs(
treasury10Y - treasury2Y - spread,
) < 0.000001;
});

checks.provenanceNotAfterMarketDate =
rows.every((row) => {
const marketDate = String(row.date);

const keys = [
"cpiSourceDate",
"coreCpiSourceDate",
"nfciSourceDate",
"real10YSourceDate",
"cpiRealtimeStart",
"coreCpiRealtimeStart",
"nfciRealtimeStart",
"real10YRealtimeStart",
];

return keys.every((key) => {
const value = row[key];

return value == null ||
String(value) <= marketDate;
});
});

checks.all =
Object.values(checks).every(Boolean);

return checks;
}

/* =====================================================
FEATURE TYPES
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

/* =====================================================
PERCENTILES
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

const lower = Math.floor(position);
const upper = Math.ceil(position);

if (lower === upper) {
return sorted[lower];
}

const weight = position - lower;

return sorted[lower] +
(sorted[upper] - sorted[lower]) * weight;
}

function extractFeatureValues(
days: FeatureDay[],
selector: FeatureSelector,
): number[] {
return days
.map(selector)
.filter(isFiniteNumber);
}

function calculateThresholds(
days: FeatureDay[],
): {
thresholds: Thresholds;
thresholdSampleCounts: ThresholdSampleCounts;
} {
const nasdaq = extractFeatureValues(
days,
FEATURE_SELECTORS.nasdaqDistanceMA200,
);

const russell = extractFeatureValues(
days,
FEATURE_SELECTORS.russellVsNasdaq20D,
);

const real10Y = extractFeatureValues(
days,
FEATURE_SELECTORS.real10YChange60D,
);

const breadth50 = extractFeatureValues(
days,
FEATURE_SELECTORS.breadth50,
);

const breadth200 = extractFeatureValues(
days,
FEATURE_SELECTORS.breadth200,
);

return {
thresholds: {
nasdaqDistanceMA200P90:
calculatePercentile(nasdaq, 0.9),

russellVsNasdaq20DP10:
calculatePercentile(russell, 0.1),

real10YChange60DP75:
calculatePercentile(real10Y, 0.75),

breadth50P10:
calculatePercentile(breadth50, 0.1),

breadth50P25:
calculatePercentile(breadth50, 0.25),

breadth200P10:
calculatePercentile(breadth200, 0.1),

breadth200P25:
calculatePercentile(breadth200, 0.25),
},

thresholdSampleCounts: {
nasdaqDistanceMA200: nasdaq.length,
russellVsNasdaq20D: russell.length,
real10YChange60D: real10Y.length,
breadth50: breadth50.length,
breadth200: breadth200.length,
},
};
}

/* =====================================================
CONDITIONAL COMBINATIONS
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

const breadth50P10 =
thresholds.breadth50P10 === null
? null
: createCondition(
"breadth50-p10",
"Breadth50 <= historical P10",
"breadth.breadth50",
"lte",
thresholds.breadth50P10,
);

const breadth50P25 =
thresholds.breadth50P25 === null
? null
: createCondition(
"breadth50-p25",
"Breadth50 <= historical P25",
"breadth.breadth50",
"lte",
thresholds.breadth50P25,
);

const breadth200P10 =
thresholds.breadth200P10 === null
? null
: createCondition(
"breadth200-p10",
"Breadth200 <= historical P10",
"breadth.breadth200",
"lte",
thresholds.breadth200P10,
);

const breadth200P25 =
thresholds.breadth200P25 === null
? null
: createCondition(
"breadth200-p25",
"Breadth200 <= historical P25",
"breadth.breadth200",
"lte",
thresholds.breadth200P25,
);

function add(
id: string,
label: string,
conditions: Array<
HistoricalConditionalCondition | null
>,
) {
if (conditions.some(
(condition) => condition === null,
)) {
return;
}

combinations.push({
id,
label,
conditions:
conditions as HistoricalConditionalCondition[],
});
}

add(
"nasdaq-above-ma200-p90",
"Nasdaq distance MA200 >= P90",
[nasdaqExtended],
);

add(
"russell-vs-nasdaq-p10",
"Russell vs Nasdaq 20D <= P10",
[russellWeak],
);

add(
"real10y-rising-p75",
"Real10Y 60D change >= P75",
[real10YRising],
);

add(
"vix-rising-20d",
"VIX 20D change > 0",
[vixRising],
);

add(
"breadth50-weak-p10",
"Breadth50 <= P10",
[breadth50P10],
);

add(
"breadth50-weak-p25",
"Breadth50 <= P25",
[breadth50P25],
);

add(
"breadth200-weak-p10",
"Breadth200 <= P10",
[breadth200P10],
);

add(
"breadth200-weak-p25",
"Breadth200 <= P25",
[breadth200P25],
);

add(
"nasdaq-extended-breadth50-weak",
"Nasdaq extended + Breadth50 weak (P25)",
[nasdaqExtended, breadth50P25],
);

add(
"nasdaq-extended-breadth200-weak",
"Nasdaq extended + Breadth200 weak (P25)",
[nasdaqExtended, breadth200P25],
);

add(
"russell-weak-breadth50-weak",
"Russell relative weakness + Breadth50 weak (P25)",
[russellWeak, breadth50P25],
);

add(
"breadth50-weak-vix-rising",
"Breadth50 weak (P25) + VIX rising",
[breadth50P25, vixRising],
);

add(
"breadth200-weak-vix-rising",
"Breadth200 weak (P25) + VIX rising",
[breadth200P25, vixRising],
);

add(
"breadth50-weak-real10y-rising",
"Breadth50 weak (P25) + Real10Y rising",
[breadth50P25, real10YRising],
);

add(
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
featureSet: FeatureSet,
) {
const calculated = calculateThresholds(
featureSet.days,
);

return {
...calculated,
combinations:
buildCombinationsFromThresholds(
calculated.thresholds,
),
};
}

/* =====================================================
WALK-FORWARD TYPES
===================================================== */

const WALK_FORWARD_MIN_TRAINING_DAYS = 756;

type OutcomeKey =
| "forward20D"
| "forward60D"
| "mfe20D"
| "mae20D"
| "mfe60D"
| "mae60D";

type ReturnStats = {
count: number;
mean: number | null;
median: number | null;
positiveShare: number | null;
negativeShare: number | null;
minimum: number | null;
maximum: number | null;
};

type Observation = {
index: number;
date: string;
forward20D: number | null;
forward60D: number | null;
mfe20D: number | null;
mae20D: number | null;
mfe60D: number | null;
mae60D: number | null;
};

type PeriodDefinition = {
id: string;
label: string;
start: string;
end: string;
};

const PERIODS: PeriodDefinition[] = [
{
id: "2014-2019",
label: "2014–2019",
start: "2014-01-01",
end: "2019-12-31",
},
{
id: "2020-2022",
label: "2020–2022",
start: "2020-01-01",
end: "2022-12-31",
},
{
id: "2023-2026",
label: "2023–2026",
start: "2023-01-01",
end: "2026-12-31",
},
];

const COMBINATION_DEFINITIONS = [
["nasdaq-above-ma200-p90",
"Nasdaq distance MA200 >= P90"],
["russell-vs-nasdaq-p10",
"Russell vs Nasdaq 20D <= P10"],
["real10y-rising-p75",
"Real10Y 60D change >= P75"],
["vix-rising-20d",
"VIX 20D change > 0"],
["breadth50-weak-p10",
"Breadth50 <= P10"],
["breadth50-weak-p25",
"Breadth50 <= P25"],
["breadth200-weak-p10",
"Breadth200 <= P10"],
["breadth200-weak-p25",
"Breadth200 <= P25"],
["nasdaq-extended-breadth50-weak",
"Nasdaq extended + Breadth50 weak (P25)"],
["nasdaq-extended-breadth200-weak",
"Nasdaq extended + Breadth200 weak (P25)"],
["russell-weak-breadth50-weak",
"Russell relative weakness + Breadth50 weak (P25)"],
["breadth50-weak-vix-rising",
"Breadth50 weak (P25) + VIX rising"],
["breadth200-weak-vix-rising",
"Breadth200 weak (P25) + VIX rising"],
["breadth50-weak-real10y-rising",
"Breadth50 weak (P25) + Real10Y rising"],
["combined-structural-stress",
"Nasdaq extended + Russell weak + Real10Y rising + VIX rising"],
] as const;

type CombinationId =
typeof COMBINATION_DEFINITIONS[number][0];

type Episode = {
startIndex: number;
endIndex: number;
startDate: string;
endDate: string;
signalDays: number;
};

/* =====================================================
WALK-FORWARD CONDITION EVALUATION
===================================================== */

function getConditionValue(
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

function evaluateCondition(
day: FeatureDay,
condition: HistoricalConditionalCondition,
): boolean {
const value = getConditionValue(
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

function evaluateCombination(
day: FeatureDay,
combination: HistoricalConditionalCombination,
): boolean {
return combination.conditions.length > 0 &&
combination.conditions.every(
(condition) =>
evaluateCondition(day, condition),
);
}

/* =====================================================
STATISTICS
===================================================== */

function calculateStats(
observations: Observation[],
key: OutcomeKey,
): ReturnStats {
const values = observations
.map((observation) => observation[key])
.filter(isFiniteNumber)
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

const positive = values.filter(
(value) => value > 0,
).length;

const negative = values.filter(
(value) => value < 0,
).length;

const sum = values.reduce(
(total, value) => total + value,
0,
);

return {
count: values.length,
mean: round(sum / values.length),
median: round(
calculatePercentile(values, 0.5),
),
positiveShare: round(
positive / values.length * 100,
2,
),
negativeShare: round(
negative / values.length * 100,
2,
),
minimum: round(values[0]),
maximum: round(values[values.length - 1]),
};
}

function createObservation(
day: FeatureDay,
index: number,
): Observation {
return {
index,
date: day.date,
forward20D: day.outcome.forward20D,
forward60D: day.outcome.forward60D,
mfe20D: day.outcome.mfe20D,
mae20D: day.outcome.mae20D,
mfe60D: day.outcome.mfe60D,
mae60D: day.outcome.mae60D,
};
}

function summarizeOutcomes(
observations: Observation[],
) {
return {
forward20D:
calculateStats(observations, "forward20D"),
forward60D:
calculateStats(observations, "forward60D"),
mfe20D:
calculateStats(observations, "mfe20D"),
mae20D:
calculateStats(observations, "mae20D"),
mfe60D:
calculateStats(observations, "mfe60D"),
mae60D:
calculateStats(observations, "mae60D"),
};
}

function countNonOverlappingEpisodes(
indices: number[],
horizon: number,
): number {
let count = 0;
let lastIndex = Number.NEGATIVE_INFINITY;

for (const index of indices) {
if (index - lastIndex >= horizon) {
count++;
lastIndex = index;
}
}

return count;
}

/* =====================================================
NEW: CONTIGUOUS SIGNAL EPISODES

An episode consists of consecutive signal days.
The first signal day is the episode entry.

A period boundary does not reset an episode.
This prevents artificial new entries on Jan 1.
===================================================== */

function buildEpisodes(
observations: Observation[],
): Episode[] {
const episodes: Episode[] = [];

for (const observation of observations) {
const previous =
episodes[episodes.length - 1];

if (
previous &&
observation.index ===
previous.endIndex + 1
) {
previous.endIndex = observation.index;
previous.endDate = observation.date;
previous.signalDays++;
} else {
episodes.push({
startIndex: observation.index,
endIndex: observation.index,
startDate: observation.date,
endDate: observation.date,
signalDays: 1,
});
}
}

return episodes;
}

function firstEpisodeObservations(
episodes: Episode[],
days: FeatureDay[],
): Observation[] {
return episodes.map(
(episode) =>
createObservation(
days[episode.startIndex],
episode.startIndex,
),
);
}

/* =====================================================
NEW: BENCHMARK AND PERIOD VALIDATION
===================================================== */

function inPeriod(
date: string,
period: PeriodDefinition,
): boolean {
return date >= period.start &&
date <= period.end;
}

function filterPeriod(
observations: Observation[],
period: PeriodDefinition,
): Observation[] {
return observations.filter(
(observation) =>
inPeriod(observation.date, period),
);
}

function compareHorizon(
signal: ReturnStats,
benchmark: ReturnStats,
) {
return {
signalCount: signal.count,
benchmarkCount: benchmark.count,

signalMean: signal.mean,
benchmarkMean: benchmark.mean,

meanDifferencePercentagePoints:
signal.mean !== null &&
benchmark.mean !== null
? round(signal.mean - benchmark.mean)
: null,

signalMedian: signal.median,
benchmarkMedian: benchmark.median,

medianDifferencePercentagePoints:
signal.median !== null &&
benchmark.median !== null
? round(
signal.median -
benchmark.median,
)
: null,

signalNegativeShare:
signal.negativeShare,

benchmarkNegativeShare:
benchmark.negativeShare,

negativeShareDifferencePoints:
signal.negativeShare !== null &&
benchmark.negativeShare !== null
? round(
signal.negativeShare -
benchmark.negativeShare,
2,
)
: null,
};
}

function buildComparison(
signals: Observation[],
benchmark: Observation[],
) {
const signal20 = calculateStats(
signals,
"forward20D",
);

const signal60 = calculateStats(
signals,
"forward60D",
);

const benchmark20 = calculateStats(
benchmark,
"forward20D",
);

const benchmark60 = calculateStats(
benchmark,
"forward60D",
);

return {
forward20D:
compareHorizon(signal20, benchmark20),

forward60D:
compareHorizon(signal60, benchmark60),
};
}

function buildPeriodValidation(
signals: Observation[],
episodeStarts: Observation[],
benchmark: Observation[],
) {
return PERIODS.map((period) => {
const periodSignals =
filterPeriod(signals, period);

const periodEpisodes =
filterPeriod(episodeStarts, period);

const periodBenchmark =
filterPeriod(benchmark, period);

return {
id: period.id,
label: period.label,
start: period.start,
end: period.end,

signalDays: periodSignals.length,

episodeStarts:
periodEpisodes.length,

signalOutcomes:
summarizeOutcomes(periodSignals),

episodeStartOutcomes:
summarizeOutcomes(periodEpisodes),

signalVsBenchmark:
buildComparison(
periodSignals,
periodBenchmark,
),

episodeStartVsBenchmark:
buildComparison(
periodEpisodes,
periodBenchmark,
),
};
});
}

/* =====================================================
NEW: VALIDATION SUMMARY
===================================================== */

function buildValidation(
days: FeatureDay[],
matched: Map<
CombinationId,
Observation[]
>,
benchmark: Observation[],
) {
const benchmarkOutcomes =
summarizeOutcomes(benchmark);

const results =
COMBINATION_DEFINITIONS.map(
([id, label]) => {
const signals = matched.get(id) ?? [];

const episodes =
buildEpisodes(signals);

const episodeStarts =
firstEpisodeObservations(
episodes,
days,
);

const completed20D =
signals.filter(
(observation) =>
isFiniteNumber(
observation.forward20D,
),
);

const completed60D =
signals.filter(
(observation) =>
isFiniteNumber(
observation.forward60D,
),
);

const completedEpisode20D =
episodeStarts.filter(
(observation) =>
isFiniteNumber(
observation.forward20D,
),
);

const completedEpisode60D =
episodeStarts.filter(
(observation) =>
isFiniteNumber(
observation.forward60D,
),
);

return {
id,
label,

diagnostics: {
matchedDays: signals.length,

completed20D:
completed20D.length,

completed60D:
completed60D.length,

pending20D:
signals.length -
completed20D.length,

pending60D:
signals.length -
completed60D.length,

contiguousEpisodes:
episodes.length,

completedEpisodeStarts20D:
completedEpisode20D.length,

completedEpisodeStarts60D:
completedEpisode60D.length,

pendingEpisodeStarts20D:
episodes.length -
completedEpisode20D.length,

pendingEpisodeStarts60D:
episodes.length -
completedEpisode60D.length,

firstEpisodeDate:
episodes[0]?.startDate ?? null,

lastEpisodeDate:
episodes[
episodes.length - 1
]?.startDate ?? null,

longestEpisodeDays:
episodes.length > 0
? Math.max(
...episodes.map(
(episode) =>
episode.signalDays,
),
)
: 0,
},

signalOutcomes:
summarizeOutcomes(signals),

episodeStartOutcomes:
summarizeOutcomes(
episodeStarts,
),

signalVsBenchmark:
buildComparison(
signals,
benchmark,
),

episodeStartVsBenchmark:
buildComparison(
episodeStarts,
benchmark,
),

periods:
buildPeriodValidation(
signals,
episodeStarts,
benchmark,
),
};
},
);

const checks = {
resultCountMatchesDefinitions:
results.length ===
COMBINATION_DEFINITIONS.length,

episodeCountsValid:
results.every(
(result) =>
result.diagnostics
.contiguousEpisodes <=
result.diagnostics.matchedDays,
),

completedOutcomesValid:
results.every(
(result) =>
result.diagnostics.completed20D <=
result.diagnostics.matchedDays &&
result.diagnostics.completed60D <=
result.diagnostics.matchedDays,
),

episodeOutcomeCountsValid:
results.every(
(result) =>
result.diagnostics
.completedEpisodeStarts20D <=
result.diagnostics.contiguousEpisodes &&
result.diagnostics
.completedEpisodeStarts60D <=
result.diagnostics.contiguousEpisodes,
),

periodSignalCountsConsistent:
results.every(
(result) =>
result.periods.reduce(
(sum, period) =>
sum + period.signalDays,
0,
) === result.diagnostics.matchedDays,
),

periodEpisodeCountsConsistent:
results.every(
(result) =>
result.periods.reduce(
(sum, period) =>
sum + period.episodeStarts,
0,
) ===
result.diagnostics.contiguousEpisodes,
),
};

return {
methodology: {
episodeDefinition:
"Consecutive signal trading days form one episode",

episodeEntry:
"First signal day of each contiguous episode",

episodeExit:
"First subsequent trading day without the condition",

episodeReturn:
"Forward Nasdaq return measured from episode entry, not exit",

benchmark:
"All walk-forward evaluation days with completed outcomes",

benchmarkMatching:
"Same calendar evaluation period, not matched on market regime",

comparison:
"Signal and episode-start returns versus unconditional Nasdaq baseline",

periods:
"Calendar cohorts 2014-2019, 2020-2022, 2023-2026",

incompleteOutcomes:
"Excluded from return statistics, retained in signal diagnostics",

independence:
"Contiguous episodes reduce repeated signals but do not establish statistical independence",

predictiveUse:
"Exploratory; signal definitions not independently selected or calibrated",
},

benchmark: {
evaluatedDays: benchmark.length,
outcomes: benchmarkOutcomes,

periods: PERIODS.map((period) => {
const observations =
filterPeriod(
benchmark,
period,
);

return {
id: period.id,
label: period.label,
days: observations.length,
outcomes:
summarizeOutcomes(observations),
};
}),
},

results,

checks: {
...checks,
all:
Object.values(checks).every(Boolean),
},
};
}

/* =====================================================
WALK-FORWARD ENGINE

Expanding threshold window through T-1.
Forward outcomes are never training inputs.
===================================================== */

function buildWalkForwardConditionalOutcomes(
featureSet: FeatureSet,
minimumTrainingDays =
WALK_FORWARD_MIN_TRAINING_DAYS,
) {
const days = featureSet.days;

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

const matched = new Map<
CombinationId,
Observation[]
>();

for (const [id] of COMBINATION_DEFINITIONS) {
matched.set(id, []);
}

const benchmark: Observation[] = [];

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

for (
let index = minimumTrainingDays;
index < days.length;
index++
) {
const currentDay = days[index];

/*
* Only observations strictly before T
* enter the percentile calculation.
*/

const trainingDays = days.slice(
0,
index,
);

const {
thresholds,
thresholdSampleCounts,
} = calculateThresholds(
trainingDays,
);

latestThresholds = thresholds;

latestThresholdSampleCounts =
thresholdSampleCounts;

evaluatedDays++;

firstEvaluationDate ??=
currentDay.date;

lastEvaluationDate =
currentDay.date;

const complete =
Object.values(thresholds).every(
isFiniteNumber,
);

if (complete) {
daysWithCompleteThresholds++;

firstCompleteThresholdDate ??=
currentDay.date;

lastCompleteThresholdDate =
currentDay.date;
} else {
daysWithIncompleteThresholds++;
}

const observation =
createObservation(
currentDay,
index,
);

benchmark.push(observation);

const combinations =
buildCombinationsFromThresholds(
thresholds,
);

for (const combination of combinations) {
if (
evaluateCombination(
currentDay,
combination,
)
) {
matched.get(
combination.id as CombinationId,
)?.push(observation);
}
}
}

const results =
COMBINATION_DEFINITIONS.map(
([id, label]) => {
const observations =
matched.get(id) ?? [];

const indices = observations.map(
(observation) =>
observation.index,
);

return {
id,
label,

matchedDays:
observations.length,

firstMatchDate:
observations[0]?.date ?? null,

lastMatchDate:
observations[
observations.length - 1
]?.date ?? null,

...summarizeOutcomes(observations),

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

const validation = buildValidation(
days,
matched,
benchmark,
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

validationPassed:
validation.checks.all,
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
"Forward returns used only for evaluation",

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
all:
Object.values(checks).every(Boolean),
},

results,

validation,
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

/* 1. MARKET ALIGNMENT */

const marketAlignment =
alignHistoricalRegimeMarketData(
marketData,
);

/* 2. RATES ALIGNMENT */

const ratesAlignment =
alignHistoricalRegimeRates(
marketAlignment,
ratesData,
);

/* 3. MACRO VINTAGE ALIGNMENT */

const macroAlignment =
alignHistoricalMacroVintage(
marketAlignment,
macroVintageData,
);

/* 4. MACRO FEATURES */

const macroFeatureDataset =
buildHistoricalMacroFeatures(
macroAlignment,
ratesAlignment.days,
);

/* 5. MARKET FEATURES */

const marketFeatureDataset =
buildHistoricalRegimeFeatures(
ratesAlignment.days,
);

/* 6. FORWARD OUTCOMES */

const outcomeDataset =
buildHistoricalRegimeOutcomes(
marketAlignment.days,
);

/* 7. FEATURE SET */

const historicalFeatureSet =
buildHistoricalRegimeFeatureSet(
marketFeatureDataset,
macroFeatureDataset.days,
outcomeDataset,
breadthData.days,
);

/* 8. DISTRIBUTIONS */

const historicalDistributions =
buildHistoricalRegimeDistributions(
historicalFeatureSet,
);

/* 9. RETROSPECTIVE OUTCOMES */

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

/* 10. WALK-FORWARD + VALIDATION */

const historicalWalkForward =
buildWalkForwardConditionalOutcomes(
historicalFeatureSet,
);

/* EXISTING MACRO FEATURE OUTPUT */

const rows =
macroFeatureDataset.days as Array<
Record<string, unknown>
>;

const featureKeys = [
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

const featureAvailability =
Object.fromEntries(
featureKeys.map(
(key) => [
key,
summarizeAvailability(
rows,
key,
),
],
),
);

/* SAMPLE DATES */

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

const samples = [
...new Set(sampleDates),
].map((date) => ({
date,
feature: findSample(rows, date),
}));

/* EXISTING CHECKS */

const checks = calculateChecks(
rows,
macroAlignment,
);

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