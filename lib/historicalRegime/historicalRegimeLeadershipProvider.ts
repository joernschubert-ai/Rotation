/* =====================================================
HISTORICAL REGIME LEADERSHIP PROVIDER

Purpose:
- Load historical leadership proxy data
- QQEW: Nasdaq-100 Equal Weight ETF
- RSP: S&P 500 Equal Weight ETF
- SMH: Semiconductor ETF
- Preserve actual trading dates
- Do not alter existing historical market data
- No synthetic values
- No forward filling
- No scoring
- No regime classification

Important:
ETF price series are research proxies, not
official equal-weight index histories or
historical constituent-weight measurements.
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

/* =====================================================
FETCH HISTORICAL SERIES
===================================================== */

async function fetchLeadershipSeries(
symbol: string,
): Promise<HistoricalMarketSeries> {
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

return emptySeries(symbol);
}

const data = await response.json();

const result = data?.chart?.result?.[0];

if (!result) {
console.error(
"[HistoricalLeadership] Empty Yahoo result:",
symbol,
);

return emptySeries(symbol);
}

const timestamps: number[] =
result.timestamp ?? [];

const closes: Array<number | null> =
result.indicators?.quote?.[0]?.close ?? [];

const byDate =
new Map<string, HistoricalPricePoint>();

const length = Math.min(
timestamps.length,
closes.length,
);

for (let index = 0; index < length; index++) {
const timestamp = timestamps[index];
const close = closes[index];

if (
!Number.isFinite(timestamp) ||
typeof close !== "number" ||
!Number.isFinite(close) ||
close <= 0
) {
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
symbol,
points,
count: points.length,
firstDate: points[0]?.date ?? null,
lastDate: points[points.length - 1]?.date ?? null,
};
} catch (error) {
console.error(
"[HistoricalLeadership] Fetch error:",
symbol,
error,
);

return emptySeries(symbol);
}
}

/* =====================================================
LOAD LEADERSHIP DATA
===================================================== */

export async function loadHistoricalRegimeLeadershipData():
Promise<HistoricalLeadershipData> {
const [
nasdaqEqualWeight,
sp500EqualWeight,
semiconductors,
] = await Promise.all([
fetchLeadershipSeries(
LEADERSHIP_SYMBOLS.nasdaqEqualWeight,
),
fetchLeadershipSeries(
LEADERSHIP_SYMBOLS.sp500EqualWeight,
),
fetchLeadershipSeries(
LEADERSHIP_SYMBOLS.semiconductors,
),
]);

const series = [
nasdaqEqualWeight,
sp500EqualWeight,
semiconductors,
];

const failedSeries = series
.filter((item) => item.count === 0)
.map((item) => item.symbol);

return {
nasdaqEqualWeight,
sp500EqualWeight,
semiconductors,

diagnostics: {
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
},
};
}

