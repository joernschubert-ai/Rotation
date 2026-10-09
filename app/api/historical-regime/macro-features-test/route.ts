import { NextResponse } from "next/server";

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

function isFiniteNumber(value: unknown): value is number {
return typeof value === "number" && Number.isFinite(value);
}

function round(value: number | null, digits = 4): number | null {
return isFiniteNumber(value) ? Number(value.toFixed(digits)) : null;
}

function summarizeAvailability(
rows: Array<Record<string, unknown>>,
key: string,
) {
const available = rows.filter((row) => isFiniteNumber(row[key])).length;

return {
available,
missing: rows.length - available,
coverage:
rows.length > 0
? Number(((available / rows.length) * 100).toFixed(2))
: 0,
};
}

function normalizeFeatureRow(row: Record<string, unknown>) {
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
result[key] = round(isFiniteNumber(row[key]) ? row[key] : null);
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

function findSample(rows: Array<Record<string, unknown>>, date: string) {
const row = rows.find((item) => item.date === date);
return row ? normalizeFeatureRow(row) : null;
}

function calculateChecks(
rows: Array<Record<string, unknown>>,
alignment: ReturnType<typeof alignHistoricalMacroVintage>,
) {
const checks: Record<string, boolean> = {};

checks.featureCountMatchesAlignment = rows.length === alignment.count;
checks.firstDateMatches = rows[0]?.date === alignment.firstDate;
checks.lastDateMatches = rows[rows.length - 1]?.date === alignment.lastDate;

checks.chronological = rows.every((row, index) => {
if (index === 0) return true;
return String(rows[index - 1].date) < String(row.date);
});

checks.rawCpiCoverage = summarizeAvailability(rows, "cpi").available > 0;
checks.rawCoreCpiCoverage =
summarizeAvailability(rows, "coreCpi").available > 0;
checks.rawNfciCoverage = summarizeAvailability(rows, "nfci").available > 0;
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

return Math.abs(treasury10Y - treasury2Y - spread) < 0.000001;
});

checks.provenanceNotAfterMarketDate = rows.every((row) => {
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
if (value == null) return true;
return String(value) <= marketDate;
});
});

checks.all = Object.values(checks).every(Boolean);

return checks;
}

/*
* HISTORICAL CONDITIONAL THRESHOLDS
*
* Thresholds are descriptive percentiles calculated from
* the available historical feature set.
*
* This is retrospective research, not a live signal engine.
* Full-sample percentiles must not be treated as thresholds
* that were known at each historical observation date.
*/

function calculatePercentile(
values: number[],
percentile: number,
): number | null {
if (values.length === 0) return null;

const sorted = [...values].sort((a, b) => a - b);

if (sorted.length === 1) return sorted[0];

const position = (sorted.length - 1) * percentile;
const lowerIndex = Math.floor(position);
const upperIndex = Math.ceil(position);

if (lowerIndex === upperIndex) return sorted[lowerIndex];

const weight = position - lowerIndex;

return (
sorted[lowerIndex] +
(sorted[upperIndex] - sorted[lowerIndex]) * weight
);
}

function extractFeatureValues(
historicalFeatureSet: ReturnType<typeof buildHistoricalRegimeFeatureSet>,
selector: (
day: ReturnType<typeof buildHistoricalRegimeFeatureSet>["days"][number],
) => number | null,
) {
return historicalFeatureSet.days
.map(selector)
.filter((value): value is number => isFiniteNumber(value));
}

function createCondition(
id: string,
label: string,
feature: HistoricalConditionalCondition["feature"],
operator: HistoricalConditionalCondition["operator"],
value: number,
): HistoricalConditionalCondition {
return { id, label, feature, operator, value };
}

function buildConditionalCombinations(
historicalFeatureSet: ReturnType<typeof buildHistoricalRegimeFeatureSet>,
): {
combinations: HistoricalConditionalCombination[];
thresholds: Record<string, number | null>;
thresholdSampleCounts: Record<string, number>;
} {
const days = historicalFeatureSet.days;

const nasdaqDistanceValues = extractFeatureValues(
historicalFeatureSet,
(day) => day.market.nasdaqDistanceMA200,
);

const russellVsNasdaqValues = extractFeatureValues(
historicalFeatureSet,
(day) => day.market.russellVsNasdaq20D,
);

const real10YChangeValues = extractFeatureValues(
historicalFeatureSet,
(day) => day.macro.real10YChange60D,
);

const breadth50Values = extractFeatureValues(
historicalFeatureSet,
(day) => day.breadth?.breadth50 ?? null,
);

const breadth200Values = extractFeatureValues(
historicalFeatureSet,
(day) => day.breadth?.breadth200 ?? null,
);

const nasdaqDistanceMA200P90 = calculatePercentile(
nasdaqDistanceValues,
0.9,
);

const russellVsNasdaq20DP10 = calculatePercentile(
russellVsNasdaqValues,
0.1,
);

const real10YChange60DP75 = calculatePercentile(
real10YChangeValues,
0.75,
);

const breadth50P10 = calculatePercentile(breadth50Values, 0.1);
const breadth50P25 = calculatePercentile(breadth50Values, 0.25);
const breadth200P10 = calculatePercentile(breadth200Values, 0.1);
const breadth200P25 = calculatePercentile(breadth200Values, 0.25);

const thresholds: Record<string, number | null> = {
nasdaqDistanceMA200P90,
russellVsNasdaq20DP10,
real10YChange60DP75,
breadth50P10,
breadth50P25,
breadth200P10,
breadth200P25,
};

const thresholdSampleCounts: Record<string, number> = {
nasdaqDistanceMA200: nasdaqDistanceValues.length,
russellVsNasdaq20D: russellVsNasdaqValues.length,
real10YChange60D: real10YChangeValues.length,
breadth50: breadth50Values.length,
breadth200: breadth200Values.length,
};

const combinations: HistoricalConditionalCombination[] = [];

const nasdaqExtended =
nasdaqDistanceMA200P90 === null
? null
: createCondition(
"nasdaq-distance-ma200-p90",
"Nasdaq distance to MA200 >= P90",
"market.nasdaqDistanceMA200",
"gte",
nasdaqDistanceMA200P90,
);

const russellWeak =
russellVsNasdaq20DP10 === null
? null
: createCondition(
"russell-vs-nasdaq-p10",
"Russell vs Nasdaq 20D <= P10",
"market.russellVsNasdaq20D",
"lte",
russellVsNasdaq20DP10,
);

const real10YRising =
real10YChange60DP75 === null
? null
: createCondition(
"real10y-change-60d-p75",
"Real10Y 60D change >= P75",
"macro.real10YChange60D",
"gte",
real10YChange60DP75,
);

const vixRising = createCondition(
"vix-change-20d-positive",
"VIX 20D change > 0",
"market.vixChange20D",
"gt",
0,
);

const breadth50WeakP10 =
breadth50P10 === null
? null
: createCondition(
"breadth50-p10",
"Breadth50 <= historical P10",
"breadth.breadth50",
"lte",
breadth50P10,
);

const breadth50WeakP25 =
breadth50P25 === null
? null
: createCondition(
"breadth50-p25",
"Breadth50 <= historical P25",
"breadth.breadth50",
"lte",
breadth50P25,
);

const breadth200WeakP10 =
breadth200P10 === null
? null
: createCondition(
"breadth200-p10",
"Breadth200 <= historical P10",
"breadth.breadth200",
"lte",
breadth200P10,
);

const breadth200WeakP25 =
breadth200P25 === null
? null
: createCondition(
"breadth200-p25",
"Breadth200 <= historical P25",
"breadth.breadth200",
"lte",
breadth200P25,
);

function addCombination(
id: string,
label: string,
conditions: Array<HistoricalConditionalCondition | null>,
) {
if (conditions.some((condition) => condition === null)) return;

combinations.push({
id,
label,
conditions: conditions as HistoricalConditionalCondition[],
});
}

addCombination("nasdaq-above-ma200-p90", "Nasdaq distance MA200 >= P90", [
nasdaqExtended,
]);

addCombination("russell-vs-nasdaq-p10", "Russell vs Nasdaq 20D <= P10", [
russellWeak,
]);

addCombination("real10y-rising-p75", "Real10Y 60D change >= P75", [
real10YRising,
]);

addCombination("vix-rising-20d", "VIX 20D change > 0", [vixRising]);

addCombination("breadth50-weak-p10", "Breadth50 <= P10", [
breadth50WeakP10,
]);

addCombination("breadth50-weak-p25", "Breadth50 <= P25", [
breadth50WeakP25,
]);

addCombination("breadth200-weak-p10", "Breadth200 <= P10", [
breadth200WeakP10,
]);

addCombination("breadth200-weak-p25", "Breadth200 <= P25", [
breadth200WeakP25,
]);

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
[nasdaqExtended, russellWeak, real10YRising, vixRising],
);

return {
combinations,
thresholds,
thresholdSampleCounts,
};
}

export async function GET() {
try {
const [marketData, ratesData, macroVintageData, breadthData] =
await Promise.all([
loadHistoricalRegimeMarketData(),
loadHistoricalRegimeRatesData(),
loadHistoricalRegimeMacroVintageData(),
loadHistoricalRegimeBreadthData(),
]);

/*
* 1. MARKET ALIGNMENT
*/
const marketAlignment = alignHistoricalRegimeMarketData(marketData);

/*
* 2. RATES ALIGNMENT
*/
const ratesAlignment = alignHistoricalRegimeRates(
marketAlignment,
ratesData,
);

/*
* 3. MACRO VINTAGE ALIGNMENT
*/
const macroAlignment = alignHistoricalMacroVintage(
marketAlignment,
macroVintageData,
);

/*
* 4. MACRO FEATURES
*/
const macroFeatureDataset = buildHistoricalMacroFeatures(
macroAlignment,
ratesAlignment.days,
);

/*
* 5. MARKET FEATURES
*/
const marketFeatureDataset = buildHistoricalRegimeFeatures(
ratesAlignment.days,
);

/*
* 6. FORWARD OUTCOMES
*/
const outcomeDataset = buildHistoricalRegimeOutcomes(
marketAlignment.days,
);

/*
* 7. JOIN MARKET + MACRO + BREADTH + OUTCOMES
*
* Exact-date joins only. Missing breadth remains null.
*/
const historicalFeatureSet = buildHistoricalRegimeFeatureSet(
marketFeatureDataset,
macroFeatureDataset.days,
outcomeDataset,
breadthData.days,
);

/*
* 8. HISTORICAL DISTRIBUTIONS
*/
const historicalDistributions =
buildHistoricalRegimeDistributions(historicalFeatureSet);

/*
* 9. HISTORICAL CONDITIONAL OUTCOMES
*/
const {
combinations: historicalConditionalCombinations,
thresholds: historicalConditionalThresholds,
thresholdSampleCounts: historicalThresholdSampleCounts,
} = buildConditionalCombinations(historicalFeatureSet);

const historicalConditionalOutcomes =
buildHistoricalRegimeConditionalOutcomes(
historicalFeatureSet,
historicalConditionalCombinations,
);

/*
* EXISTING MACRO FEATURE OUTPUT
*/
const rows = macroFeatureDataset.days as Array<
Record<string, unknown>
>;

const featureAvailability = {
cpi: summarizeAvailability(rows, "cpi"),
coreCpi: summarizeAvailability(rows, "coreCpi"),
nfci: summarizeAvailability(rows, "nfci"),
real10Y: summarizeAvailability(rows, "real10Y"),
cpiYoY: summarizeAvailability(rows, "cpiYoY"),
coreCpiYoY: summarizeAvailability(rows, "coreCpiYoY"),
cpiChange3M: summarizeAvailability(rows, "cpiChange3M"),
cpiChange6M: summarizeAvailability(rows, "cpiChange6M"),
coreCpiChange3M: summarizeAvailability(rows, "coreCpiChange3M"),
coreCpiChange6M: summarizeAvailability(rows, "coreCpiChange6M"),
nfciChange4W: summarizeAvailability(rows, "nfciChange4W"),
nfciChange12W: summarizeAvailability(rows, "nfciChange12W"),
real10YChange20D: summarizeAvailability(rows, "real10YChange20D"),
real10YChange60D: summarizeAvailability(rows, "real10YChange60D"),
fedFunds: summarizeAvailability(rows, "fedFunds"),
treasury2Y: summarizeAvailability(rows, "treasury2Y"),
treasury10Y: summarizeAvailability(rows, "treasury10Y"),
treasury10Y2YSpread: summarizeAvailability(
rows,
"treasury10Y2YSpread",
),
fedFundsChange20D: summarizeAvailability(rows, "fedFundsChange20D"),
treasury2YChange20D: summarizeAvailability(
rows,
"treasury2YChange20D",
),
treasury10YChange20D: summarizeAvailability(
rows,
"treasury10YChange20D",
),
treasury10Y2YSpreadChange20D: summarizeAvailability(
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
].filter((date): date is string => typeof date === "string");

const uniqueSampleDates = [...new Set(sampleDates)];

const samples = uniqueSampleDates.map((date) => ({
date,
feature: findSample(rows, date),
}));

/*
* EXISTING MACRO CHECKS
*/
const checks = calculateChecks(rows, macroAlignment);

/*
* HISTORICAL FEATURE SET CHECKS
*/
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
checks.all && Object.values(historicalFeatureSetChecks).every(Boolean);

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
fullyCoveredCount: macroAlignment.diagnostics.allSeriesAvailableCount,
futureReleaseLeakage:
macroAlignment.diagnostics.futureReleaseLeakageCount,
},

ratesAlignment: {
count: ratesAlignment.days.length,
firstDate:
ratesAlignment.days.length > 0
? ratesAlignment.days[0].date
: null,
lastDate:
ratesAlignment.days.length > 0
? ratesAlignment.days[ratesAlignment.days.length - 1].date
: null,
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
firstDate: rows.length > 0 ? rows[0].date : null,
lastDate: rows.length > 0 ? rows[rows.length - 1].date : null,
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
? marketFeatureDataset[marketFeatureDataset.length - 1].date
: null,
},

outcomes: {
count: outcomeDataset.length,
firstDate:
outcomeDataset.length > 0 ? outcomeDataset[0].date : null,
lastDate:
outcomeDataset.length > 0
? outcomeDataset[outcomeDataset.length - 1].date
: null,
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
predictiveUse:
"Not validated; use walk-forward thresholds before predictive claims",
breadthScale: "Ratios from 0 to 1",
missingBreadthPolicy: "Missing breadth does not satisfy a condition",
},

thresholds: historicalConditionalThresholds,
thresholdSampleCounts: historicalThresholdSampleCounts,
results: historicalConditionalOutcomes,
},

checks: {
macro: checks,
all: allChecks,
},

samples,
};

return NextResponse.json(response);
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

