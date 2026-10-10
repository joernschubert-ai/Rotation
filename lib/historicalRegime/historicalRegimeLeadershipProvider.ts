/* =====================================================
HISTORICAL REGIME LEADERSHIP PROVIDER

Purpose:
- Load historical leadership proxy data
- QQEW: Nasdaq-100 Equal Weight ETF
- RSP: S&P 500 Equal Weight ETF
- SMH: Semiconductor ETF
- Preserve actual trading dates
- Preserve existing raw-close behavior
- Provide adjusted-close data separately
- No synthetic values
- No forward filling
- No scoring
- No regime classification

Important:
ETF price series are research proxies, not
official equal-weight index histories or
historical constituent-weight measurements.

Adjusted ETF returns must not be treated as
directly equivalent to price-index returns.
===================================================== */

import type {
HistoricalMarketSeries,
HistoricalPricePoint,
} from "./historicalRegimeProvider";

/* =====================================================
CONFIGURATION
===================================================== */

const HISTORICAL_RANGE = "15y";

const LEADERSHIP_SYMBOLS = {
nasdaqEqualWeight: "QQEW",
sp500EqualWeight: "RSP",
semiconductors: "SMH",
} as const;

type LeadershipPriceMode =
| "RAW_CLOSE"
| "ADJUSTED_CLOSE";

/* =====================================================
TYPES
===================================================== */

export type HistoricalLeadershipData = {
nasdaqEqualWeight: HistoricalMarketSeries;
sp500EqualWeight: HistoricalMarketSeries;
semiconductors: HistoricalMarketSeries;

diagnostics: {
requestedSeries: number;
successfulSeries: number;
failedSeries: string[];
firstAvailableDate: string | null;
lastAvailableDate: string | null;
chronological: boolean;
};
};

export type HistoricalLeadershipAdjustedData =
HistoricalLeadershipData & {
priceMode: "ADJUSTED_CLOSE";

diagnostics: HistoricalLeadershipData["diagnostics"] & {
priceMode: "ADJUSTED_CLOSE";
adjustedCloseMissingDays: {
nasdaqEqualWeight: number;
sp500EqualWeight: number;
semiconductors: number;
};
};
};

type FetchedLeadershipSeries = {
series: HistoricalMarketSeries;
missingAdjustedCloseDays: number;
};

/* =====================================================
HELPERS
===================================================== */

function emptySeries(
symbol: string,
): HistoricalMarketSeries {
return {
symbol,
points: [],
count: 0,
firstDate: null,
lastDate: null,
};
}

function isChronological(
points: HistoricalPricePoint[],
): boolean {
for (let index = 1; index < points.length; index++) {
if (points[index].date <= points[index - 1].date) {
return false;
}
}

return true;
}

function earliestDate(
dates: Array<string | null>,
): string | null {
const valid = dates.filter(
(date): date is string => date !== null,
);

return valid.length > 0
? valid.sort()[0]
: null;
}

function latestDate(
dates: Array<string | null>,
): string | null {
const valid = dates.filter(
(date): date is string => date !== null,
);

return valid.length > 0
? valid.sort()[valid.length - 1]
: null;
}

function isValidPrice(
value: unknown,
): value is number {
return (
typeof value === "number" &&
Number.isFinite(value) &&
value > 0
);
}

/* =====================================================
FETCH HISTORICAL SERIES

RAW_CLOSE:
- Uses Yahoo quote.close
- Preserves existing provider behavior

ADJUSTED_CLOSE:
- Uses Yahoo adjclose
- Never substitutes raw close for missing values
- Missing adjusted values remain missing
===================================================== */

async function fetchLeadershipSeries(
symbol: string,
priceMode: LeadershipPriceMode = "RAW_CLOSE",
): Promise<FetchedLeadershipSeries> {
try {
const url =
"https://query1.finance.yahoo.com/v8/finance/chart/" +
encodeURIComponent(symbol) +
`?interval=1d&range=${HISTORICAL_RANGE}`;

const response = await fetch(url, {
headers: {
"User-Agent": "Mozilla/5.0",
Accept: "application/json",
},
cache: "no-store",
});

if (!response.ok) {
console.error(
"[HistoricalLeadership] Fetch failed:",
symbol,
response.status,
);

return {
series: emptySeries(symbol),
missingAdjustedCloseDays: 0,
};
}

const data = await response.json();

const result = data?.chart?.result?.[0];

if (!result) {
console.error(
"[HistoricalLeadership] Empty Yahoo result:",
symbol,
);

return {
series: emptySeries(symbol),
missingAdjustedCloseDays: 0,
};
}

const timestamps: number[] =
result.timestamp ?? [];

const rawCloses: Array<number | null> =
result.indicators?.quote?.[0]?.close ?? [];

const adjustedCloses: Array<number | null> =
result.indicators?.adjclose?.[0]?.adjclose ?? [];

const byDate =
new Map<string, HistoricalPricePoint>();

let missingAdjustedCloseDays = 0;

/*
* Keep the existing raw-close iteration length.
*
* Adjusted-close values are matched to the
* same Yahoo timestamp index.
*/

const length = Math.min(
timestamps.length,
rawCloses.length,
);

for (let index = 0; index < length; index++) {
const timestamp = timestamps[index];
const rawClose = rawCloses[index];

if (
!Number.isFinite(timestamp) ||
!isValidPrice(rawClose)
) {
continue;
}

const adjustedClose =
adjustedCloses[index];

if (
priceMode === "ADJUSTED_CLOSE" &&
!isValidPrice(adjustedClose)
) {
missingAdjustedCloseDays++;
continue;
}

const close =
priceMode === "ADJUSTED_CLOSE"
? adjustedClose
: rawClose;

if (!isValidPrice(close)) {
continue;
}

const date = new Date(
timestamp * 1000,
)
.toISOString()
.slice(0, 10);

byDate.set(date, {
date,
close,
});
}

const points = Array.from(
byDate.values(),
).sort(
(a, b) => a.date.localeCompare(b.date),
);

return {
series: {
symbol,
points,
count: points.length,
firstDate: points[0]?.date ?? null,
lastDate: points[points.length - 1]?.date ?? null,
},

missingAdjustedCloseDays,
};
} catch (error) {
console.error(
"[HistoricalLeadership] Fetch error:",
symbol,
error,
);

return {
series: emptySeries(symbol),
missingAdjustedCloseDays: 0,
};
}
}

/* =====================================================
BUILD SHARED DIAGNOSTICS
===================================================== */

function buildDiagnostics(
series: HistoricalMarketSeries[],
): HistoricalLeadershipData["diagnostics"] {
const failedSeries = series
.filter((item) => item.count === 0)
.map((item) => item.symbol);

return {
requestedSeries: series.length,

successfulSeries:
series.length - failedSeries.length,

failedSeries,

firstAvailableDate: earliestDate(
series.map((item) => item.firstDate),
),

lastAvailableDate: latestDate(
series.map((item) => item.lastDate),
),

chronological: series.every(
(item) => isChronological(item.points),
),
};
}

/* =====================================================
LOAD EXISTING RAW-CLOSE LEADERSHIP DATA

Compatibility:
- Same function name
- Same return type
- Same three market series
- Same diagnostics structure
===================================================== */

export async function loadHistoricalRegimeLeadershipData():
Promise<HistoricalLeadershipData> {
const [
nasdaqEqualWeightResult,
sp500EqualWeightResult,
semiconductorsResult,
] = await Promise.all([
fetchLeadershipSeries(
LEADERSHIP_SYMBOLS.nasdaqEqualWeight,
"RAW_CLOSE",
),
fetchLeadershipSeries(
LEADERSHIP_SYMBOLS.sp500EqualWeight,
"RAW_CLOSE",
),
fetchLeadershipSeries(
LEADERSHIP_SYMBOLS.semiconductors,
"RAW_CLOSE",
),
]);

const nasdaqEqualWeight =
nasdaqEqualWeightResult.series;

const sp500EqualWeight =
sp500EqualWeightResult.series;

const semiconductors =
semiconductorsResult.series;

return {
nasdaqEqualWeight,
sp500EqualWeight,
semiconductors,

diagnostics: buildDiagnostics([
nasdaqEqualWeight,
sp500EqualWeight,
semiconductors,
]),
};
}

/* =====================================================
LOAD ADJUSTED-CLOSE LEADERSHIP DATA

Research-only:
- Separate from existing raw-close data
- Uses only real Yahoo adjusted-close values
- No fallback to raw close
- Missing adjusted values are counted
===================================================== */

export async function loadHistoricalRegimeLeadershipAdjustedData():
Promise<HistoricalLeadershipAdjustedData> {
const [
nasdaqEqualWeightResult,
sp500EqualWeightResult,
semiconductorsResult,
] = await Promise.all([
fetchLeadershipSeries(
LEADERSHIP_SYMBOLS.nasdaqEqualWeight,
"ADJUSTED_CLOSE",
),
fetchLeadershipSeries(
LEADERSHIP_SYMBOLS.sp500EqualWeight,
"ADJUSTED_CLOSE",
),
fetchLeadershipSeries(
LEADERSHIP_SYMBOLS.semiconductors,
"ADJUSTED_CLOSE",
),
]);

const nasdaqEqualWeight =
nasdaqEqualWeightResult.series;

const sp500EqualWeight =
sp500EqualWeightResult.series;

const semiconductors =
semiconductorsResult.series;

const diagnostics = buildDiagnostics([
nasdaqEqualWeight,
sp500EqualWeight,
semiconductors,
]);

return {
priceMode: "ADJUSTED_CLOSE",

nasdaqEqualWeight,
sp500EqualWeight,
semiconductors,

diagnostics: {
...diagnostics,

priceMode: "ADJUSTED_CLOSE",

adjustedCloseMissingDays: {
nasdaqEqualWeight:
nasdaqEqualWeightResult.missingAdjustedCloseDays,

sp500EqualWeight:
sp500EqualWeightResult.missingAdjustedCloseDays,

semiconductors:
semiconductorsResult.missingAdjustedCloseDays,
},
},
};
}

