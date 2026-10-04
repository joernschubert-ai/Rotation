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

const marketAlignment =
alignHistoricalRegimeMarketData(
marketData,
);

const ratesAlignment =
alignHistoricalRegimeRates(
marketAlignment,
ratesData,
);

const macroAlignment =
alignHistoricalMacroVintage(
marketAlignment,
macroVintageData,
);

const featureDataset =
buildHistoricalMacroFeatures(
macroAlignment,
ratesAlignment.days,
);

const rows =
featureDataset.days as Array<
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

const checks =
calculateChecks(
rows,
macroAlignment,
);

const response = {
ok: checks.all,

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

checks,

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
