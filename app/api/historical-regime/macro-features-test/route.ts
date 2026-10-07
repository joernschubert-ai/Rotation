// app/api/historical-regime/macro-features-test/route.ts

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
} from
"@/lib/historicalRegime/historicalRegimeConditionalOutcomes";


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
const available = rows.filter((row) =>
isFiniteNumber(row[key]),
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
(row, index) => {
if (index === 0) {
return true;
}

return (
String(rows[index - 1].date) <
String(row.date)
);
},
);

checks.rawCpiCoverage =
summarizeAvailability(
rows,
"cpi",
).available > 0;

checks.rawCoreCpiCoverage =
summarizeAvailability(
rows,
"coreCpi",
).available > 0;

checks.rawNfciCoverage =
summarizeAvailability(
rows,
"nfci",
).available > 0;

checks.rawReal10YCoverage =
summarizeAvailability(
rows,
"real10Y",
).available > 0;

checks.rateCoverage =
summarizeAvailability(
rows,
"fedFunds",
).available > 0 &&
summarizeAvailability(
rows,
"treasury2Y",
).available > 0 &&
summarizeAvailability(
rows,
"treasury10Y",
).available > 0;

checks.spreadConsistency =
rows.every((row) => {
const treasury10Y =
row.treasury10Y;

const treasury2Y =
row.treasury2Y;

const spread =
row.treasury10Y2YSpread;

if (
!isFiniteNumber(treasury10Y) ||
!isFiniteNumber(treasury2Y) ||
!isFiniteNumber(spread)
) {
return true;
}

return (
Math.abs(
treasury10Y -
treasury2Y -
spread,
) < 0.000001
);
});

checks.provenanceNotAfterMarketDate =
rows.every((row) => {
const marketDate =
String(row.date);

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

return provenanceKeys.every(
(key) => {
const value = row[key];

if (value == null) {
return true;
}

return (
String(value) <=
marketDate
);
},
);
});

checks.all =
Object.values(checks).every(
Boolean,
);

return checks;
}


/*
* =========================================================
* HISTORICAL CONDITIONAL THRESHOLDS
*
* Thresholds are derived directly from the historical
* feature set. They are descriptive test conditions only.
*
* No regime classification.
* No score.
* No trading signal.
* =========================================================
*/

function calculatePercentile(
values: number[],
percentile: number,
): number | null {
if (values.length === 0) {
return null;
}

const sorted = [...values].sort(
(a, b) => a - b,
);

if (sorted.length === 1) {
return sorted[0];
}

const position =
(sorted.length - 1) * percentile;

const lowerIndex =
Math.floor(position);

const upperIndex =
Math.ceil(position);

if (
lowerIndex === upperIndex
) {
return sorted[lowerIndex];
}

const weight =
position - lowerIndex;

return (
sorted[lowerIndex] +
(
sorted[upperIndex] -
sorted[lowerIndex]
) *
weight
);
}


function extractMarketFeatureValues(
historicalFeatureSet:
ReturnType<
typeof buildHistoricalRegimeFeatureSet
>,
selector:
(
day: ReturnType<
typeof buildHistoricalRegimeFeatureSet
>["days"][number]
) => number | null,
) {
return historicalFeatureSet.days
.map(selector)
.filter(
(value): value is number =>
isFiniteNumber(value),
);
}


function buildConditionalCombinations(
historicalFeatureSet:
ReturnType<
typeof buildHistoricalRegimeFeatureSet
>,
): {
combinations: HistoricalConditionalCombination[];
thresholds: {
nasdaqDistanceMA200P90: number | null;
russellVsNasdaq20DP10: number | null;
real10YChange60DP75: number | null;
};
} {
const nasdaqDistanceMA200Values =
extractMarketFeatureValues(
historicalFeatureSet,
(day) =>
day.market.nasdaqDistanceMA200,
);

const russellVsNasdaq20DValues =
extractMarketFeatureValues(
historicalFeatureSet,
(day) =>
day.market.russellVsNasdaq20D,
);

const real10YChange60DValues =
extractMarketFeatureValues(
historicalFeatureSet,
(day) =>
day.macro.real10YChange60D,
);

const nasdaqDistanceMA200P90 =
calculatePercentile(
nasdaqDistanceMA200Values,
0.9,
);

const russellVsNasdaq20DP10 =
calculatePercentile(
russellVsNasdaq20DValues,
0.1,
);

const real10YChange60DP75 =
calculatePercentile(
real10YChange60DValues,
0.75,
);

const combinations:
HistoricalConditionalCombination[] =
[];

if (
nasdaqDistanceMA200P90 !== null
) {
combinations.push({
id:
"nasdaq-above-ma200-p90",

label:
"Nasdaq distance MA200 >= P90",

conditions: [
{
id:
"nasdaq-distance-ma200-p90",

label:
"Nasdaq distance to MA200 >= P90",

feature:
"market.nasdaqDistanceMA200",

operator:
"gte",

value:
nasdaqDistanceMA200P90,
},
],
});
}

if (
russellVsNasdaq20DP10 !== null
) {
combinations.push({
id:
"russell-vs-nasdaq-p10",

label:
"Russell vs Nasdaq 20D <= P10",

conditions: [
{
id:
"russell-vs-nasdaq-p10",

label:
"Russell vs Nasdaq 20D <= P10",

feature:
"market.russellVsNasdaq20D",

operator:
"lte",

value:
russellVsNasdaq20DP10,
},
],
});
}

if (
real10YChange60DP75 !== null
) {
combinations.push({
id:
"real10y-rising-p75",

label:
"Real10Y 60D change >= P75",

conditions: [
{
id:
"real10y-change-60d-p75",

label:
"Real10Y 60D change >= P75",

feature:
"macro.real10YChange60D",

operator:
"gte",

value:
real10YChange60DP75,
},
],
});
}

combinations.push({
id:
"vix-rising-20d",

label:
"VIX 20D change > 0",

conditions: [
{
id:
"vix-change-20d-positive",

label:
"VIX 20D change > 0",

feature:
"market.vixChange20D",

operator:
"gt",

value:
0,
},
],
});

if (
nasdaqDistanceMA200P90 !== null &&
russellVsNasdaq20DP10 !== null &&
real10YChange60DP75 !== null
) {
combinations.push({
id:
"combined-structural-stress",

label:
"Nasdaq extended + Russell weak + Real10Y rising + VIX rising",

conditions: [
{
id:
"nasdaq-distance-ma200-p90",

label:
"Nasdaq distance to MA200 >= P90",

feature:
"market.nasdaqDistanceMA200",

operator:
"gte",

value:
nasdaqDistanceMA200P90,
},

{
id:
"russell-vs-nasdaq-p10",

label:
"Russell vs Nasdaq 20D <= P10",

feature:
"market.russellVsNasdaq20D",

operator:
"lte",

value:
russellVsNasdaq20DP10,
},

{
id:
"real10y-change-60d-p75",

label:
"Real10Y 60D change >= P75",

feature:
"macro.real10YChange60D",

operator:
"gte",

value:
real10YChange60DP75,
},

{
id:
"vix-change-20d-positive",

label:
"VIX 20D change > 0",

feature:
"market.vixChange20D",

operator:
"gt",

value:
0,
},
],
});
}

return {
combinations,

thresholds: {
nasdaqDistanceMA200P90,
russellVsNasdaq20DP10,
real10YChange60DP75,
},
};
}


export async function GET() {
try {
const [
marketData,
ratesData,
macroVintageData,
] = await Promise.all([
loadHistoricalRegimeMarketData(),
loadHistoricalRegimeRatesData(),
loadHistoricalRegimeMacroVintageData(),
]);


/*
* =====================================================
* 1. MARKET ALIGNMENT
* =====================================================
*/

const marketAlignment =
alignHistoricalRegimeMarketData(
marketData,
);


/*
* =====================================================
* 2. RATES ALIGNMENT
* =====================================================
*/

const ratesAlignment =
alignHistoricalRegimeRates(
marketAlignment,
ratesData,
);


/*
* =====================================================
* 3. MACRO VINTAGE ALIGNMENT
* =====================================================
*/

const macroAlignment =
alignHistoricalMacroVintage(
marketAlignment,
macroVintageData,
);


/*
* =====================================================
* 4. MACRO FEATURES
* =====================================================
*/

const macroFeatureDataset =
buildHistoricalMacroFeatures(
macroAlignment,
ratesAlignment.days,
);


/*
* =====================================================
* 5. MARKET FEATURES
*
* buildHistoricalRegimeFeatures() returns
* HistoricalRegimeFeatures[] directly.
* =====================================================
*/

const marketFeatureDataset =
buildHistoricalRegimeFeatures(
ratesAlignment.days,
);


/*
* =====================================================
* 6. HISTORICAL FORWARD OUTCOMES
* =====================================================
*/

const outcomeDataset =
buildHistoricalRegimeOutcomes(
marketAlignment.days,
);


/*
* =====================================================
* 7. HISTORICAL REGIME FEATURE SET
*
* Exact-date integration only.
*
* No scoring.
* No regime classification.
* No analog logic.
* No interpolation.
* No forward filling.
* =====================================================
*/

const historicalFeatureSet =
buildHistoricalRegimeFeatureSet(
marketFeatureDataset,
macroFeatureDataset.days,
outcomeDataset,
);


/*
* =====================================================
* 8. HISTORICAL DISTRIBUTIONS
*
* Neutral descriptive statistics only.
*
* No scoring.
* No regime classification.
* No analog logic.
* No synthetic history.
* =====================================================
*/

const historicalDistributions =
buildHistoricalRegimeDistributions(
historicalFeatureSet,
);


/*
* =====================================================
* 9. HISTORICAL CONDITIONAL OUTCOMES
*
* Empirical condition -> historical outcome only.
*
* No score.
* No regime classification.
* No trading signal.
* =====================================================
*/

const {
combinations:
historicalConditionalCombinations,

thresholds:
historicalConditionalThresholds,
} =
buildConditionalCombinations(
historicalFeatureSet,
);

const historicalConditionalOutcomes =
buildHistoricalRegimeConditionalOutcomes(
historicalFeatureSet,
historicalConditionalCombinations,
);


/*
* =====================================================
* EXISTING MACRO FEATURE OUTPUT
* =====================================================
*/

const rows =
macroFeatureDataset.days as Array<
Record<string, unknown>
>;


const featureAvailability = {
cpi: summarizeAvailability(
rows,
"cpi",
),

coreCpi:
summarizeAvailability(
rows,
"coreCpi",
),

nfci:
summarizeAvailability(
rows,
"nfci",
),

real10Y:
summarizeAvailability(
rows,
"real10Y",
),

cpiYoY:
summarizeAvailability(
rows,
"cpiYoY",
),

coreCpiYoY:
summarizeAvailability(
rows,
"coreCpiYoY",
),

cpiChange3M:
summarizeAvailability(
rows,
"cpiChange3M",
),

cpiChange6M:
summarizeAvailability(
rows,
"cpiChange6M",
),

coreCpiChange3M:
summarizeAvailability(
rows,
"coreCpiChange3M",
),

coreCpiChange6M:
summarizeAvailability(
rows,
"coreCpiChange6M",
),

nfciChange4W:
summarizeAvailability(
rows,
"nfciChange4W",
),

nfciChange12W:
summarizeAvailability(
rows,
"nfciChange12W",
),

real10YChange20D:
summarizeAvailability(
rows,
"real10YChange20D",
),

real10YChange60D:
summarizeAvailability(
rows,
"real10YChange60D",
),

fedFunds:
summarizeAvailability(
rows,
"fedFunds",
),

treasury2Y:
summarizeAvailability(
rows,
"treasury2Y",
),

treasury10Y:
summarizeAvailability(
rows,
"treasury10Y",
),

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
* =====================================================
* SAMPLE DATES
* =====================================================
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
uniqueSampleDates.map(
(date) => ({
date,
feature: findSample(
rows,
date,
),
}),
);


/*
* =====================================================
* EXISTING MACRO CHECKS
* =====================================================
*/

const checks =
calculateChecks(
rows,
macroAlignment,
);


/*
* =====================================================
* HISTORICAL FEATURE SET CHECKS
* =====================================================
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

joinedFeatureSetNotEmpty:
historicalFeatureSet.count > 0,

chronological:
historicalFeatureSet
.diagnostics
.chronological,

noDuplicateMarketDates:
historicalFeatureSet
.diagnostics
.duplicateMarketDates === 0,

noDuplicateMacroDates:
historicalFeatureSet
.diagnostics
.duplicateMacroDates === 0,

noDuplicateOutcomeDates:
historicalFeatureSet
.diagnostics
.duplicateOutcomeDates === 0,
};

const allChecks =
checks.all &&
Object.values(
historicalFeatureSetChecks,
).every(Boolean);


/*
* =====================================================
* RESPONSE
* =====================================================
*/

const response = {
ok: allChecks,

source: {
marketProvider:
"Yahoo Finance",

ratesProvider:
"FRED",

macroProvider:
"FRED",

macroMode:
"revision-aware output_type=1",
},

historicalStart:
marketAlignment.firstDate,

historicalEnd:
marketAlignment.lastDate,

market: {
count:
marketAlignment.count,

firstDate:
marketAlignment.firstDate,

lastDate:
marketAlignment.lastDate,
},

macroAlignment: {
count:
macroAlignment.count,

firstDate:
macroAlignment.firstDate,

lastDate:
macroAlignment.lastDate,

fullyCoveredCount:
macroAlignment
.diagnostics
.allSeriesAvailableCount,

futureReleaseLeakage:
macroAlignment
.diagnostics
.futureReleaseLeakageCount,
},

ratesAlignment: {
count:
ratesAlignment.days.length,

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

features: {
count:
rows.length,

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
count:
marketFeatureDataset.length,

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
count:
outcomeDataset.length,

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
count:
historicalFeatureSet.count,

firstDate:
historicalFeatureSet.firstDate,

lastDate:
historicalFeatureSet.lastDate,

diagnostics:
historicalFeatureSet
.diagnostics,

checks:
historicalFeatureSetChecks,
},

/*
* ===================================================
* HISTORICAL DISTRIBUTIONS
*
* Descriptive statistics only.
* ===================================================
*/

historicalDistributions,

/*
* ===================================================
* HISTORICAL CONDITIONAL OUTCOMES
*
* Thresholds are exposed separately so the test
* output remains transparent and auditable.
* ===================================================
*/

historicalConditionalOutcomes: {
thresholds:
historicalConditionalThresholds,

results:
historicalConditionalOutcomes,
},

checks: {
macro:
checks,

all:
allChecks,
},

samples,
};

return NextResponse.json(
response,
);
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
{
status: 500,
},
);
}
}
