/* =====================================================
HISTORICAL REGIME PROVIDER

Purpose:
- Load long-term historical daily market data
- Keep historical regime data separate from marketHistory
- Preserve dates for later cross-market alignment
- No Rotation-App engine reconstruction
- No synthetic historical Master Scores
===================================================== */

export type HistoricalPricePoint = {
date: string;
close: number;
};

export type HistoricalMarketSeries = {
symbol: string;
points: HistoricalPricePoint[];
count: number;
firstDate: string | null;
lastDate: string | null;
};

export type HistoricalRegimeMarketData = {
nasdaq: HistoricalMarketSeries;
sp500: HistoricalMarketSeries;
russell: HistoricalMarketSeries;
vix: HistoricalMarketSeries;
};

const HISTORICAL_RANGE = "15y";


/* =====================================================
SYMBOLS
===================================================== */

const HISTORICAL_SYMBOLS = {
nasdaq: "^NDX",
sp500: "^GSPC",
russell: "^RUT",
vix: "^VIX",
} as const;


/* =====================================================
FETCH HISTORICAL SERIES
===================================================== */

async function fetchHistoricalSeries(
symbol: string,
range: string = HISTORICAL_RANGE
): Promise<HistoricalMarketSeries> {

try {

const url =
`https://query1.finance.yahoo.com/v8/finance/chart/` +
`${encodeURIComponent(symbol)}` +
`?interval=1d&range=${range}`;

const res = await fetch(
url,
{
headers: {
"User-Agent": "Mozilla/5.0",
"Accept": "application/json",
},
cache: "no-store",
}
);

if (!res.ok) {

console.error(
"Historical Regime fetch failed:",
symbol,
res.status
);

return emptySeries(symbol);
}

const data = await res.json();

const result =
data?.chart?.result?.[0];

if (!result) {

console.error(
"Historical Regime API returned no result:",
symbol
);

return emptySeries(symbol);
}

const timestamps: number[] =
result.timestamp ?? [];

const closes: Array<number | null> =
result.indicators?.quote?.[0]?.close ?? [];

const points: HistoricalPricePoint[] = [];

const length =
Math.min(
timestamps.length,
closes.length
);

for (
let i = 0;
i < length;
i++
) {

const timestamp =
timestamps[i];

const close =
closes[i];

if (
!Number.isFinite(timestamp) ||
close === null ||
!Number.isFinite(close)
) {
continue;
}

/*
* Yahoo timestamps are Unix timestamps.
*
* Store YYYY-MM-DD so all future historical
* datasets can be aligned by trading date.
*/

const date =
new Date(
timestamp * 1000
)
.toISOString()
.slice(0, 10);

points.push({
date,
close: Number(close),
});

}


/* =================================================
SORT + DEDUPLICATE

Defensive protection against duplicate dates.
================================================= */

const byDate =
new Map<string, HistoricalPricePoint>();

for (
const point of points
) {

byDate.set(
point.date,
point
);

}

const cleaned =
Array.from(
byDate.values()
)
.sort(
(a, b) =>
a.date.localeCompare(
b.date
)
);


return {

symbol,

points: cleaned,

count:
cleaned.length,

firstDate:
cleaned[0]?.date ??
null,

lastDate:
cleaned[
cleaned.length - 1
]?.date ??
null,

};

}

catch (error) {

console.error(
"Historical Regime fetch error:",
symbol,
error
);

return emptySeries(symbol);

}

}


/* =====================================================
EMPTY SERIES
===================================================== */

function emptySeries(
symbol: string
): HistoricalMarketSeries {

return {

symbol,

points: [],

count: 0,

firstDate: null,

lastDate: null,

};

}


/* =====================================================
LOAD HISTORICAL REGIME MARKET DATA
===================================================== */

export async function loadHistoricalRegimeMarketData():
Promise<HistoricalRegimeMarketData> {

const [
nasdaq,
sp500,
russell,
vix,
] =
await Promise.all([

fetchHistoricalSeries(
HISTORICAL_SYMBOLS.nasdaq
),

fetchHistoricalSeries(
HISTORICAL_SYMBOLS.sp500
),

fetchHistoricalSeries(
HISTORICAL_SYMBOLS.russell
),

fetchHistoricalSeries(
HISTORICAL_SYMBOLS.vix
),

]);


return {

nasdaq,
sp500,
russell,
vix,

};

}
