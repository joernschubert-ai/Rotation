import { NextRequest, NextResponse } from "next/server";

import { loadHistoricalRegimeMarketData } from "@/lib/historicalRegime/historicalRegimeProvider";
import { alignHistoricalRegimeMarketData } from "@/lib/historicalRegime/historicalRegimeAlignment";
import { loadHistoricalRegimeRatesData } from "@/lib/historicalRegime/historicalRegimeRatesProvider";
import { alignHistoricalRegimeRates } from "@/lib/historicalRegime/historicalRegimeRatesAlignment";
import { loadHistoricalRegimeMacroVintageData } from "@/lib/historicalRegime/historicalRegimeMacroVintageProvider";
import { alignHistoricalMacroVintage } from "@/lib/historicalRegime/historicalRegimeMacroVintageAlignment";
import { loadHistoricalRegimeBreadthData } from "@/lib/historicalRegime/historicalRegimeBreadthProvider";
import { buildHistoricalMacroFeatures } from "@/lib/historicalRegime/historicalRegimeMacroFeatures";
import { buildHistoricalRegimeFeatures } from "@/lib/historicalRegime/historicalRegimeFeatures";
import { buildHistoricalRegimeOutcomes } from "@/lib/historicalRegime/historicalRegimeOutcomes";
import { buildHistoricalRegimeFeatureSet } from "@/lib/historicalRegime/historicalRegimeFeatureSet";
import { buildHistoricalRegimeDistributions } from "@/lib/historicalRegime/historicalRegimeDistributions";

import {
buildHistoricalRegimeConditionalOutcomes,
type HistoricalConditionalCombination,
type HistoricalConditionalCondition,
} from "@/lib/historicalRegime/historicalRegimeConditionalOutcomes";

/* =====================================================
HELPERS
===================================================== */

function finite(value: unknown): value is number {
return typeof value === "number" && Number.isFinite(value);
}

function round(value: number | null, digits = 4): number | null {
return finite(value) ? Number(value.toFixed(digits)) : null;
}

function availability(rows: Record<string, unknown>[], key: string) {
const available = rows.filter(row => finite(row[key])).length;
return {
available,
missing: rows.length - available,
coverage: rows.length ? round(100 * available / rows.length, 2) : 0,
};
}

const MACRO_NUMERIC_KEYS = [
"cpi", "coreCpi", "nfci", "real10Y", "cpiYoY",
"coreCpiYoY", "cpiChange3M", "cpiChange6M",
"coreCpiChange3M", "coreCpiChange6M",
"nfciChange4W", "nfciChange12W",
"real10YChange20D", "real10YChange60D",
"fedFunds", "treasury2Y", "treasury10Y",
"treasury10Y2YSpread", "fedFundsChange20D",
"treasury2YChange20D", "treasury10YChange20D",
"treasury10Y2YSpreadChange20D",
];

const PROVENANCE_KEYS = [
"cpiSourceDate", "coreCpiSourceDate",
"nfciSourceDate", "real10YSourceDate",
"cpiRealtimeStart", "coreCpiRealtimeStart",
"nfciRealtimeStart", "real10YRealtimeStart",
];

function findSample(rows: Record<string, unknown>[], date: string) {
const row = rows.find(item => item.date === date);
if (!row) return null;

const result: Record<string, unknown> = { date };

for (const key of MACRO_NUMERIC_KEYS) {
result[key] = round(finite(row[key]) ? row[key] : null);
}

for (const key of PROVENANCE_KEYS) {
result[key] = row[key] ?? null;
}

return result;
}

function calculateMacroChecks(
rows: Record<string, unknown>[],
alignment: ReturnType<typeof alignHistoricalMacroVintage>,
) {
const checks: Record<string, boolean> = {
featureCountMatchesAlignment: rows.length === alignment.count,
firstDateMatches: rows[0]?.date === alignment.firstDate,
lastDateMatches: rows[rows.length - 1]?.date === alignment.lastDate,
chronological: rows.every((row, i) =>
i === 0 || String(rows[i - 1].date) < String(row.date)),
rawCpiCoverage: availability(rows, "cpi").available > 0,
rawCoreCpiCoverage: availability(rows, "coreCpi").available > 0,
rawNfciCoverage: availability(rows, "nfci").available > 0,
rawReal10YCoverage: availability(rows, "real10Y").available > 0,
rateCoverage:
availability(rows, "fedFunds").available > 0 &&
availability(rows, "treasury2Y").available > 0 &&
availability(rows, "treasury10Y").available > 0,
spreadConsistency: rows.every(row => {
const a = row.treasury10Y;
const b = row.treasury2Y;
const c = row.treasury10Y2YSpread;
return !finite(a) || !finite(b) || !finite(c) ||
Math.abs(a - b - c) < 0.000001;
}),
provenanceNotAfterMarketDate: rows.every(row =>
PROVENANCE_KEYS.every(key =>
row[key] == null || String(row[key]) <= String(row.date))),
};

return {
...checks,
all: Object.values(checks).every(Boolean),
};
}

/* =====================================================
FEATURE TYPES AND THRESHOLDS
===================================================== */

type FeatureSet = ReturnType<typeof buildHistoricalRegimeFeatureSet>;
type FeatureDay = FeatureSet["days"][number];

type Thresholds = {
nasdaqDistanceMA200P90: number | null;
russellVsNasdaq20DP10: number | null;
real10YChange60DP75: number | null;
breadth50P10: number | null;
breadth50P25: number | null;
breadth200P10: number | null;
breadth200P25: number | null;
};

type ThresholdSampleCounts = {
nasdaqDistanceMA200: number;
russellVsNasdaq20D: number;
real10YChange60D: number;
breadth50: number;
breadth200: number;
};

function percentile(values: number[], p: number): number | null {
if (!values.length) return null;

const sorted = [...values].sort((a, b) => a - b);
const position = (sorted.length - 1) * p;
const low = Math.floor(position);
const high = Math.ceil(position);

return sorted[low] +
(sorted[high] - sorted[low]) * (position - low);
}

function numericValues(
days: FeatureDay[],
selector: (day: FeatureDay) => number | null,
): number[] {
return days.map(selector).filter(finite);
}

function calculateThresholds(days: FeatureDay[]) {
const nasdaq = numericValues(days, d => d.market.nasdaqDistanceMA200);
const russell = numericValues(days, d => d.market.russellVsNasdaq20D);
const real10Y = numericValues(days, d => d.macro.real10YChange60D);
const breadth50 = numericValues(days, d => d.breadth?.breadth50 ?? null);
const breadth200 = numericValues(days, d => d.breadth?.breadth200 ?? null);

const thresholds: Thresholds = {
nasdaqDistanceMA200P90: percentile(nasdaq, 0.9),
russellVsNasdaq20DP10: percentile(russell, 0.1),
real10YChange60DP75: percentile(real10Y, 0.75),
breadth50P10: percentile(breadth50, 0.1),
breadth50P25: percentile(breadth50, 0.25),
breadth200P10: percentile(breadth200, 0.1),
breadth200P25: percentile(breadth200, 0.25),
};

const thresholdSampleCounts: ThresholdSampleCounts = {
nasdaqDistanceMA200: nasdaq.length,
russellVsNasdaq20D: russell.length,
real10YChange60D: real10Y.length,
breadth50: breadth50.length,
breadth200: breadth200.length,
};

return { thresholds, thresholdSampleCounts };
}

/* =====================================================
FIFTEEN ORIGINAL SIGNAL DEFINITIONS
===================================================== */

const DEFINITIONS = [
["nasdaq-above-ma200-p90", "Nasdaq distance MA200 >= P90"],
["russell-vs-nasdaq-p10", "Russell vs Nasdaq 20D <= P10"],
["real10y-rising-p75", "Real10Y 60D change >= P75"],
["vix-rising-20d", "VIX 20D change > 0"],
["breadth50-weak-p10", "Breadth50 <= P10"],
["breadth50-weak-p25", "Breadth50 <= P25"],
["breadth200-weak-p10", "Breadth200 <= P10"],
["breadth200-weak-p25", "Breadth200 <= P25"],
["nasdaq-extended-breadth50-weak", "Nasdaq extended + Breadth50 weak (P25)"],
["nasdaq-extended-breadth200-weak", "Nasdaq extended + Breadth200 weak (P25)"],
["russell-weak-breadth50-weak", "Russell relative weakness + Breadth50 weak (P25)"],
["breadth50-weak-vix-rising", "Breadth50 weak (P25) + VIX rising"],
["breadth200-weak-vix-rising", "Breadth200 weak (P25) + VIX rising"],
["breadth50-weak-real10y-rising", "Breadth50 weak (P25) + Real10Y rising"],
["combined-structural-stress", "Nasdaq extended + Russell weak + Real10Y rising + VIX rising"],
] as const;

type SignalId = typeof DEFINITIONS[number][0];

function condition(
id: string,
label: string,
feature: HistoricalConditionalCondition["feature"],
operator: HistoricalConditionalCondition["operator"],
value: number,
): HistoricalConditionalCondition {
return { id, label, feature, operator, value };
}

function buildCombinations(thresholds: Thresholds): HistoricalConditionalCombination[] {
const n = finite(thresholds.nasdaqDistanceMA200P90)
? condition("nasdaq-distance-ma200-p90", "Nasdaq distance to MA200 >= P90",
"market.nasdaqDistanceMA200", "gte", thresholds.nasdaqDistanceMA200P90)
: null;

const r = finite(thresholds.russellVsNasdaq20DP10)
? condition("russell-vs-nasdaq-p10", "Russell vs Nasdaq 20D <= P10",
"market.russellVsNasdaq20D", "lte", thresholds.russellVsNasdaq20DP10)
: null;

const y = finite(thresholds.real10YChange60DP75)
? condition("real10y-change-60d-p75", "Real10Y 60D change >= P75",
"macro.real10YChange60D", "gte", thresholds.real10YChange60DP75)
: null;

const v = condition("vix-change-20d-positive", "VIX 20D change > 0",
"market.vixChange20D", "gt", 0);

const b10 = finite(thresholds.breadth50P10)
? condition("breadth50-p10", "Breadth50 <= historical P10",
"breadth.breadth50", "lte", thresholds.breadth50P10)
: null;

const b25 = finite(thresholds.breadth50P25)
? condition("breadth50-p25", "Breadth50 <= historical P25",
"breadth.breadth50", "lte", thresholds.breadth50P25)
: null;

const c10 = finite(thresholds.breadth200P10)
? condition("breadth200-p10", "Breadth200 <= historical P10",
"breadth.breadth200", "lte", thresholds.breadth200P10)
: null;

const c25 = finite(thresholds.breadth200P25)
? condition("breadth200-p25", "Breadth200 <= historical P25",
"breadth.breadth200", "lte", thresholds.breadth200P25)
: null;

const groups: Array<Array<HistoricalConditionalCondition | null>> = [
[n], [r], [y], [v], [b10], [b25], [c10], [c25],
[n, b25], [n, c25], [r, b25], [b25, v],
[c25, v], [b25, y], [n, r, y, v],
];

return DEFINITIONS.flatMap(([id, label], index) => {
const entries = groups[index];
if (entries.some(entry => entry === null)) return [];

return [{
id,
label,
conditions: entries as HistoricalConditionalCondition[],
}];
});
}

function featureValue(
day: FeatureDay,
feature: HistoricalConditionalCondition["feature"],
): number | null {
switch (feature) {
case "market.nasdaqDistanceMA200": return day.market.nasdaqDistanceMA200;
case "market.russellVsNasdaq20D": return day.market.russellVsNasdaq20D;
case "market.vixChange20D": return day.market.vixChange20D;
case "macro.real10YChange60D": return day.macro.real10YChange60D;
case "breadth.breadth50": return day.breadth?.breadth50 ?? null;
case "breadth.breadth200": return day.breadth?.breadth200 ?? null;
default: return null;
}
}

function matches(day: FeatureDay, combination: HistoricalConditionalCombination) {
return combination.conditions.length > 0 &&
combination.conditions.every(c => {
const value = featureValue(day, c.feature);
if (!finite(value)) return false;

switch (c.operator) {
case "gt": return value > c.value;
case "gte": return value >= c.value;
case "lt": return value < c.value;
case "lte": return value <= c.value;
case "eq": return value === c.value;
default: return false;
}
});
}

/* =====================================================
OUTCOMES AND STATISTICS
===================================================== */

type OutcomeKey =
| "forward20D" | "forward60D"
| "mfe20D" | "mae20D"
| "mfe60D" | "mae60D";

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

function observation(day: FeatureDay, index: number): Observation {
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

function stats(rows: Observation[], key: OutcomeKey) {
const values = rows.map(row => row[key]).filter(finite).sort((a, b) => a - b);
const count = values.length;

if (!count) {
return {
count: 0, mean: null, median: null,
positiveShare: null, negativeShare: null,
minimum: null, maximum: null,
};
}

return {
count,
mean: round(values.reduce((a, b) => a + b, 0) / count),
median: round(percentile(values, 0.5)),
positiveShare: round(100 * values.filter(v => v > 0).length / count, 2),
negativeShare: round(100 * values.filter(v => v < 0).length / count, 2),
minimum: round(values[0]),
maximum: round(values[count - 1]),
};
}

function outcomes(rows: Observation[]) {
return {
forward20D: stats(rows, "forward20D"),
forward60D: stats(rows, "forward60D"),
mfe20D: stats(rows, "mfe20D"),
mae20D: stats(rows, "mae20D"),
mfe60D: stats(rows, "mfe60D"),
mae60D: stats(rows, "mae60D"),
};
}

function nonOverlapping(rows: Observation[], key: "forward20D" | "forward60D", horizon: number) {
let count = 0;
let last = -Infinity;

for (const row of rows) {
if (!finite(row[key])) continue;
if (row.index - last < horizon) continue;
count++;
last = row.index;
}

return count;
}

type Episode = {
startIndex: number;
endIndex: number;
startDate: string;
endDate: string;
signalDays: number;
};

function episodes(rows: Observation[]): Episode[] {
const result: Episode[] = [];

for (const row of rows) {
const last = result[result.length - 1];

if (last && row.index === last.endIndex + 1) {
last.endIndex = row.index;
last.endDate = row.date;
last.signalDays++;
} else {
result.push({
startIndex: row.index,
endIndex: row.index,
startDate: row.date,
endDate: row.date,
signalDays: 1,
});
}
}

return result;
}

/* =====================================================
PERIODS AND BENCHMARK
===================================================== */

const PERIODS = [
{ id: "2014-2019", label: "2014–2019", start: "2014-01-01", end: "2019-12-31" },
{ id: "2020-2022", label: "2020–2022", start: "2020-01-01", end: "2022-12-31" },
{ id: "2023-2026", label: "2023–2026", start: "2023-01-01", end: "2026-12-31" },
] as const;

function periodRows(rows: Observation[], start: string, end: string) {
return rows.filter(row => row.date >= start && row.date <= end);
}

function compareHorizon(
signal: ReturnType<typeof stats>,
benchmark: ReturnType<typeof stats>,
) {
return {
signalCount: signal.count,
benchmarkCount: benchmark.count,
signalMean: signal.mean,
benchmarkMean: benchmark.mean,
meanDifferencePercentagePoints:
signal.mean !== null && benchmark.mean !== null
? round(signal.mean - benchmark.mean) : null,
signalMedian: signal.median,
benchmarkMedian: benchmark.median,
medianDifferencePercentagePoints:
signal.median !== null && benchmark.median !== null
? round(signal.median - benchmark.median) : null,
signalNegativeShare: signal.negativeShare,
benchmarkNegativeShare: benchmark.negativeShare,
negativeShareDifferencePoints:
signal.negativeShare !== null && benchmark.negativeShare !== null
? round(signal.negativeShare - benchmark.negativeShare, 2) : null,
};
}

function compare(signal: Observation[], benchmark: Observation[]) {
return {
forward20D: compareHorizon(
stats(signal, "forward20D"),
stats(benchmark, "forward20D"),
),
forward60D: compareHorizon(
stats(signal, "forward60D"),
stats(benchmark, "forward60D"),
),
};
}

/* =====================================================
NEW: COMPACT RESEARCH STATUS

This is a descriptive screening classification,
NOT a calibrated trading signal.

Minimum counts are conservative research gates,
not statistically optimized thresholds.
===================================================== */

type ResearchStatus =
| "INSUFFICIENT_SAMPLE"
| "MIXED_EVIDENCE"
| "FURTHER_VALIDATION_REQUIRED";

function classifyResearchStatus(
episodeCount: number,
completed20D: number,
representedPeriods: number,
meanDifference20D: number | null,
meanDifference60D: number | null,
): ResearchStatus {
if (
episodeCount < 20 ||
completed20D < 20 ||
representedPeriods < 3
) {
return "INSUFFICIENT_SAMPLE";
}

if (
meanDifference20D === null ||
meanDifference60D === null
) {
return "INSUFFICIENT_SAMPLE";
}

if (
Math.sign(meanDifference20D) !==
Math.sign(meanDifference60D)
) {
return "MIXED_EVIDENCE";
}

return "FURTHER_VALIDATION_REQUIRED";
}

/* =====================================================
VALIDATION + SUMMARY
===================================================== */

function buildValidation(
days: FeatureDay[],
matched: Map<SignalId, Observation[]>,
benchmark: Observation[],
) {
const detailedResults = DEFINITIONS.map(([id, label]) => {
const signals = matched.get(id) ?? [];
const groups = episodes(signals);

const starts = groups.map(group =>
observation(days[group.startIndex], group.startIndex));

const periodResults = PERIODS.map(period => {
const s = periodRows(signals, period.start, period.end);
const e = periodRows(starts, period.start, period.end);
const b = periodRows(benchmark, period.start, period.end);

return {
id: period.id,
label: period.label,
start: period.start,
end: period.end,
signalDays: s.length,
episodeStarts: e.length,
signalOutcomes: outcomes(s),
episodeStartOutcomes: outcomes(e),
signalVsBenchmark: compare(s, b),
episodeStartVsBenchmark: compare(e, b),
};
});

return {
id,
label,
diagnostics: {
matchedDays: signals.length,
completed20D: signals.filter(x => finite(x.forward20D)).length,
completed60D: signals.filter(x => finite(x.forward60D)).length,
pending20D: signals.filter(x => !finite(x.forward20D)).length,
pending60D: signals.filter(x => !finite(x.forward60D)).length,
contiguousEpisodes: groups.length,
completedEpisodeStarts20D: starts.filter(x => finite(x.forward20D)).length,
completedEpisodeStarts60D: starts.filter(x => finite(x.forward60D)).length,
pendingEpisodeStarts20D: starts.filter(x => !finite(x.forward20D)).length,
pendingEpisodeStarts60D: starts.filter(x => !finite(x.forward60D)).length,
firstEpisodeDate: groups[0]?.startDate ?? null,
lastEpisodeDate: groups[groups.length - 1]?.startDate ?? null,
longestEpisodeDays: groups.length
? Math.max(...groups.map(x => x.signalDays)) : 0,
},
signalOutcomes: outcomes(signals),
episodeStartOutcomes: outcomes(starts),
signalVsBenchmark: compare(signals, benchmark),
episodeStartVsBenchmark: compare(starts, benchmark),
periods: periodResults,
};
});

const checks = {
resultCountMatchesDefinitions: detailedResults.length === DEFINITIONS.length,
episodeCountsValid: detailedResults.every(r =>
r.diagnostics.contiguousEpisodes <= r.diagnostics.matchedDays),
completedOutcomesValid: detailedResults.every(r =>
r.diagnostics.completed20D <= r.diagnostics.matchedDays &&
r.diagnostics.completed60D <= r.diagnostics.matchedDays),
episodeOutcomeCountsValid: detailedResults.every(r =>
r.diagnostics.completedEpisodeStarts20D <= r.diagnostics.contiguousEpisodes &&
r.diagnostics.completedEpisodeStarts60D <= r.diagnostics.contiguousEpisodes),
periodSignalCountsConsistent: detailedResults.every(r =>
r.periods.reduce((sum, p) => sum + p.signalDays, 0) === r.diagnostics.matchedDays),
periodEpisodeCountsConsistent: detailedResults.every(r =>
r.periods.reduce((sum, p) => sum + p.episodeStarts, 0) === r.diagnostics.contiguousEpisodes),
};

const summaryResults = detailedResults.map(result => {
const d = result.diagnostics;
const c20 = result.episodeStartVsBenchmark.forward20D;
const c60 = result.episodeStartVsBenchmark.forward60D;

const periods = result.periods.map(period => ({
id: period.id,
signalDays: period.signalDays,
episodeStarts: period.episodeStarts,
completed20D: period.episodeStartOutcomes.forward20D.count,
completed60D: period.episodeStartOutcomes.forward60D.count,
mean20D: period.episodeStartOutcomes.forward20D.mean,
median20D: period.episodeStartOutcomes.forward20D.median,
negativeShare20D: period.episodeStartOutcomes.forward20D.negativeShare,
mean60D: period.episodeStartOutcomes.forward60D.mean,
benchmarkMean20D: period.episodeStartVsBenchmark.forward20D.benchmarkMean,
excessMean20D: period.episodeStartVsBenchmark.forward20D.meanDifferencePercentagePoints,
excessMean60D: period.episodeStartVsBenchmark.forward60D.meanDifferencePercentagePoints,
}));

const representedPeriods =
periods.filter(p => p.completed20D > 0).length;

return {
id: result.id,
label: result.label,
researchStatus: classifyResearchStatus(
d.contiguousEpisodes,
d.completedEpisodeStarts20D,
representedPeriods,
c20.meanDifferencePercentagePoints,
c60.meanDifferencePercentagePoints,
),
matchedDays: d.matchedDays,
contiguousEpisodes: d.contiguousEpisodes,
completed20D: d.completedEpisodeStarts20D,
completed60D: d.completedEpisodeStarts60D,
pending20D: d.pendingEpisodeStarts20D,
pending60D: d.pendingEpisodeStarts60D,
firstEpisodeDate: d.firstEpisodeDate,
lastEpisodeDate: d.lastEpisodeDate,
episode20D: {
mean: result.episodeStartOutcomes.forward20D.mean,
median: result.episodeStartOutcomes.forward20D.median,
negativeShare: result.episodeStartOutcomes.forward20D.negativeShare,
mfeMean: result.episodeStartOutcomes.mfe20D.mean,
maeMean: result.episodeStartOutcomes.mae20D.mean,
benchmarkMean: c20.benchmarkMean,
excessMean: c20.meanDifferencePercentagePoints,
excessMedian: c20.medianDifferencePercentagePoints,
negativeShareDifference: c20.negativeShareDifferencePoints,
},
episode60D: {
mean: result.episodeStartOutcomes.forward60D.mean,
median: result.episodeStartOutcomes.forward60D.median,
negativeShare: result.episodeStartOutcomes.forward60D.negativeShare,
mfeMean: result.episodeStartOutcomes.mfe60D.mean,
maeMean: result.episodeStartOutcomes.mae60D.mean,
benchmarkMean: c60.benchmarkMean,
excessMean: c60.meanDifferencePercentagePoints,
},
representedPeriods,
periods,
};
});

const summaryChecks = {
allSignalsPresent: summaryResults.length === DEFINITIONS.length,
noInvalidCounts: summaryResults.every(r =>
r.completed20D <= r.contiguousEpisodes &&
r.completed60D <= r.contiguousEpisodes),
allPeriodsPresent: summaryResults.every(r => r.periods.length === PERIODS.length),
allEpisodesAccountedFor: summaryResults.every(r =>
r.periods.reduce((sum, p) => sum + p.episodeStarts, 0) === r.contiguousEpisodes),
};

return {
methodology: {
episodeDefinition: "Consecutive signal trading days form one episode",
episodeEntry: "First signal day of each contiguous episode",
episodeExit: "First subsequent trading day without the condition",
episodeReturn: "Forward Nasdaq return from episode entry",
benchmark: "All walk-forward evaluation days with completed outcomes",
benchmarkMatching: "Same calendar evaluation period, not matched on market regime",
comparison: "Episode-start returns versus unconditional Nasdaq baseline",
periods: "Calendar cohorts 2014-2019, 2020-2022, 2023-2026",
incompleteOutcomes: "Excluded from statistics, retained in diagnostics",
independence: "Contiguous episodes do not establish statistical independence",
predictiveUse: "Exploratory; not independently validated or calibrated",
},
benchmark: {
evaluatedDays: benchmark.length,
outcomes: outcomes(benchmark),
periods: PERIODS.map(period => {
const rows = periodRows(benchmark, period.start, period.end);
return {
id: period.id,
label: period.label,
days: rows.length,
outcomes: outcomes(rows),
};
}),
},
results: detailedResults,
checks: {
...checks,
all: Object.values(checks).every(Boolean),
},
summary: {
methodology: {
unit: "Nasdaq percentage returns and percentage-point benchmark differences",
signalUnit: "First day of each contiguous signal episode",
researchStatus: "Descriptive research screening only; not a trade recommendation",
minimumResearchGate: "20 completed episode starts across all three calendar cohorts",
multipleTesting: "Fifteen hypotheses explored; selection bias remains possible",
independence: "Episode outcome windows may still overlap",
benchmark: "Unconditional Nasdaq forward returns in the same calendar cohort",
periodBoundary: "Episodes are not reset at calendar boundaries",
horizon: "20 and 60 trading days",
},
totalSignals: summaryResults.length,
benchmark: {
evaluatedDays: benchmark.length,
completed20D: stats(benchmark, "forward20D").count,
completed60D: stats(benchmark, "forward60D").count,
mean20D: stats(benchmark, "forward20D").mean,
mean60D: stats(benchmark, "forward60D").mean,
negativeShare20D: stats(benchmark, "forward20D").negativeShare,
},
results: summaryResults,
checks: {
...summaryChecks,
all: Object.values(summaryChecks).every(Boolean),
},
},
};
}

/* =====================================================
WALK-FORWARD
===================================================== */

const MIN_TRAINING_DAYS = 756;

function buildWalkForward(featureSet: FeatureSet) {
const days = featureSet.days;

const chronological = days.every(
(d, i) => i === 0 || days[i - 1].date < d.date,
);

if (!chronological) {
throw new Error("Walk-forward requires chronological feature days.");
}

const matched = new Map<SignalId, Observation[]>();
for (const [id] of DEFINITIONS) matched.set(id, []);

const benchmark: Observation[] = [];

let complete = 0;
let incomplete = 0;
let firstComplete: string | null = null;
let lastComplete: string | null = null;
let latestThresholds: Thresholds | null = null;
let latestCounts: ThresholdSampleCounts | null = null;

for (let i = MIN_TRAINING_DAYS; i < days.length; i++) {
const current = days[i];
const training = days.slice(0, i);
const calculated = calculateThresholds(training);

latestThresholds = calculated.thresholds;
latestCounts = calculated.thresholdSampleCounts;

if (Object.values(calculated.thresholds).every(finite)) {
complete++;
firstComplete ??= current.date;
lastComplete = current.date;
} else {
incomplete++;
}

const obs = observation(current, i);
benchmark.push(obs);

for (const combination of buildCombinations(calculated.thresholds)) {
if (matches(current, combination)) {
matched.get(combination.id as SignalId)?.push(obs);
}
}
}

const evaluatedDays = benchmark.length;

const results = DEFINITIONS.map(([id, label]) => {
const rows = matched.get(id) ?? [];

return {
id,
label,
matchedDays: rows.length,
firstMatchDate: rows[0]?.date ?? null,
lastMatchDate: rows[rows.length - 1]?.date ?? null,
...outcomes(rows),
independentEpisodes20D: nonOverlapping(rows, "forward20D", 20),
independentEpisodes60D: nonOverlapping(rows, "forward60D", 60),
};
});

const validation = buildValidation(days, matched, benchmark);

const checks = {
chronological,
trainingWindowAvailable: days.length > MIN_TRAINING_DAYS,
evaluatedDaysConsistent: evaluatedDays === Math.max(0, days.length - MIN_TRAINING_DAYS),
thresholdDayCountsConsistent: complete + incomplete === evaluatedDays,
noEvaluationBeforeWarmup:
!evaluatedDays || benchmark[0].date === days[MIN_TRAINING_DAYS].date,
resultCountMatchesDefinitions: results.length === DEFINITIONS.length,
noMatchesExceedEvaluatedDays: results.every(r => r.matchedDays <= evaluatedDays),
validationPassed: validation.checks.all,
summaryPassed: validation.summary.checks.all,
};

return {
methodology: {
thresholdMethod: "Expanding walk-forward percentiles",
minimumTrainingDays: MIN_TRAINING_DAYS,
thresholdInformationCutoff: "Previous trading day T-1",
currentDayIncludedInTraining: false,
outcomeUsage: "Forward returns used only for evaluation",
intendedUse: "Historical out-of-sample threshold evaluation",
predictiveUse: "Exploratory; not independently validated or calibrated",
breadthScale: "Ratios from 0 to 1",
missingBreadthPolicy: "Missing breadth never satisfies a breadth condition",
episodeMethod: "Greedy non-overlapping signal windows; independence not established",
percentiles: "P10/P25/P75/P90 calculated from prior observations only",
},
diagnostics: {
inputDays: days.length,
evaluatedDays,
skippedWarmupDays: Math.min(days.length, MIN_TRAINING_DAYS),
firstEvaluationDate: benchmark[0]?.date ?? null,
lastEvaluationDate: benchmark[benchmark.length - 1]?.date ?? null,
daysWithCompleteThresholds: complete,
daysWithIncompleteThresholds: incomplete,
firstCompleteThresholdDate: firstComplete,
lastCompleteThresholdDate: lastComplete,
latestThresholds,
latestThresholdSampleCounts: latestCounts,
},
checks: {
...checks,
all: Object.values(checks).every(Boolean),
},
results,
validation,
};
}

/* =====================================================
API
===================================================== */

export async function GET(request: NextRequest) {
try {
const summaryOnly =
request.nextUrl.searchParams.get("view") === "summary";

const [marketData, ratesData, macroVintageData, breadthData] =
await Promise.all([
loadHistoricalRegimeMarketData(),
loadHistoricalRegimeRatesData(),
loadHistoricalRegimeMacroVintageData(),
loadHistoricalRegimeBreadthData(),
]);

const marketAlignment =
alignHistoricalRegimeMarketData(marketData);

const ratesAlignment =
alignHistoricalRegimeRates(marketAlignment, ratesData);

const macroAlignment =
alignHistoricalMacroVintage(marketAlignment, macroVintageData);

const macroFeatureDataset =
buildHistoricalMacroFeatures(macroAlignment, ratesAlignment.days);

const marketFeatureDataset =
buildHistoricalRegimeFeatures(ratesAlignment.days);

const outcomeDataset =
buildHistoricalRegimeOutcomes(marketAlignment.days);

const historicalFeatureSet =
buildHistoricalRegimeFeatureSet(
marketFeatureDataset,
macroFeatureDataset.days,
outcomeDataset,
breadthData.days,
);

const historicalWalkForward =
buildWalkForward(historicalFeatureSet);

const rows = macroFeatureDataset.days as Record<string, unknown>[];
const macroChecks = calculateMacroChecks(rows, macroAlignment);

const historicalFeatureSetChecks = {
marketFeatureCountMatchesAlignment:
marketFeatureDataset.length === marketAlignment.count,
macroFeatureCountMatchesAlignment:
macroFeatureDataset.days.length === macroAlignment.count,
outcomeCountMatchesMarketAlignment:
outcomeDataset.length === marketAlignment.count,
breadthProviderNotEmpty: breadthData.count > 0,
breadthChronological: breadthData.diagnostics.chronological,
breadthCoverageAvailable:
breadthData.diagnostics.breadth50AvailableCount > 0 &&
breadthData.diagnostics.breadth200AvailableCount > 0,
joinedFeatureSetNotEmpty: historicalFeatureSet.count > 0,
chronological: historicalFeatureSet.diagnostics.chronological,
noDuplicateMarketDates:
historicalFeatureSet.diagnostics.duplicateMarketDates === 0,
noDuplicateMacroDates:
historicalFeatureSet.diagnostics.duplicateMacroDates === 0,
noDuplicateBreadthDates:
historicalFeatureSet.diagnostics.duplicateBreadthDates === 0,
noDuplicateOutcomeDates:
historicalFeatureSet.diagnostics.duplicateOutcomeDates === 0,
};

const allChecks =
macroChecks.all &&
Object.values(historicalFeatureSetChecks).every(Boolean) &&
historicalWalkForward.checks.all;

/*
* COMPACT OUTPUT
*
* No deeply nested full historical JSON.
* One copy is sufficient for analysis.
*/

if (summaryOnly) {
return NextResponse.json({
ok: allChecks,
report: "HISTORICAL_VALIDATION_SUMMARY",
historicalStart: marketAlignment.firstDate,
historicalEnd: marketAlignment.lastDate,
walkForward: {
diagnostics: historicalWalkForward.diagnostics,
checks: historicalWalkForward.checks,
},
summary: historicalWalkForward.validation.summary,
});
}

/*
* ORIGINAL FULL OUTPUT
*/

const historicalDistributions =
buildHistoricalRegimeDistributions(historicalFeatureSet);

const retrospectiveThresholds =
calculateThresholds(historicalFeatureSet.days);

const historicalConditionalOutcomes =
buildHistoricalRegimeConditionalOutcomes(
historicalFeatureSet,
buildCombinations(retrospectiveThresholds.thresholds),
);

const featureAvailability = Object.fromEntries(
MACRO_NUMERIC_KEYS.map(key => [key, availability(rows, key)]),
);

const sampleDates = [
marketAlignment.firstDate,
"2011-10-03",
"2019-04-03",
"2020-03-23",
"2022-06-15",
"2024-04-01",
"2026-10-02",
marketAlignment.lastDate,
].filter((date): date is string => typeof date === "string");

const samples = [...new Set(sampleDates)].map(date => ({
date,
feature: findSample(rows, date),
}));

return NextResponse.json({
ok: allChecks,

source: {
marketProvider: "Yahoo Finance",
ratesProvider: "FRED",
macroProvider: "FRED",
breadthProvider: "Yahoo Finance",
macroMode: "revision-aware output_type=1",
},

historicalStart: marketAlignment.firstDate,
historicalEnd: marketAlignment.lastDate,

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
macroAlignment.diagnostics.allSeriesAvailableCount,
futureReleaseLeakage:
macroAlignment.diagnostics.futureReleaseLeakageCount,
},

ratesAlignment: {
count: ratesAlignment.days.length,
firstDate: ratesAlignment.days[0]?.date ?? null,
lastDate: ratesAlignment.days[ratesAlignment.days.length - 1]?.date ?? null,
},

breadth: {
count: breadthData.count,
firstDate: breadthData.firstDate,
lastDate: breadthData.lastDate,
universeSize: breadthData.universeSize,
uniqueUniverseSize: breadthData.uniqueUniverseSize,
diagnostics: breadthData.diagnostics,
},

features: {
count: rows.length,
firstDate: rows[0]?.date ?? null,
lastDate: rows[rows.length - 1]?.date ?? null,
},

featureAvailability,

marketFeatures: {
count: marketFeatureDataset.length,
firstDate: marketFeatureDataset[0]?.date ?? null,
lastDate: marketFeatureDataset[marketFeatureDataset.length - 1]?.date ?? null,
},

outcomes: {
count: outcomeDataset.length,
firstDate: outcomeDataset[0]?.date ?? null,
lastDate: outcomeDataset[outcomeDataset.length - 1]?.date ?? null,
},

historicalFeatureSet: {
count: historicalFeatureSet.count,
firstDate: historicalFeatureSet.firstDate,
lastDate: historicalFeatureSet.lastDate,
diagnostics: historicalFeatureSet.diagnostics,
checks: historicalFeatureSetChecks,
},

historicalDistributions,

historicalConditionalOutcomes: {
methodology: {
thresholdMethod: "Full-sample descriptive percentiles",
intendedUse: "Retrospective exploratory analysis",
predictiveUse: "Not validated; use walk-forward thresholds before predictive claims",
breadthScale: "Ratios from 0 to 1",
missingBreadthPolicy: "Missing breadth does not satisfy a condition",
},
thresholds: retrospectiveThresholds.thresholds,
thresholdSampleCounts: retrospectiveThresholds.thresholdSampleCounts,
results: historicalConditionalOutcomes,
},

historicalWalkForward,

checks: {
macro: macroChecks,
all: allChecks,
},

samples,
});
} catch (error) {
console.error("Historical macro features test failed:", error);

return NextResponse.json(
{
ok: false,
error: error instanceof Error ? error.message : String(error),
},
{ status: 500 },
);
}
}

