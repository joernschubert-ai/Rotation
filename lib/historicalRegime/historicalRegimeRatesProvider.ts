/* =====================================================
HISTORICAL REGIME — RATES PROVIDER

Purpose:
- Load historical US rates data from FRED
- Keep raw historical observations with exact dates
- No forward filling
- No alignment to market trading days
- No regime classification
- No scoring
- No persistence
- No synthetic data

Alignment / as-of logic belongs to a later layer.
===================================================== */


const FRED_BASE_URL =
"https://api.stlouisfed.org/fred/series/observations";


const HISTORICAL_OBSERVATION_START =
"2011-10-01";


/* =====================================================
FRED SERIES
===================================================== */

export const HISTORICAL_RATE_SERIES = {

fedFunds: {
seriesId: "DFF",
label: "Effective Federal Funds Rate",
},

treasury2Y: {
seriesId: "DGS2",
label: "2-Year Treasury Yield",
},

treasury10Y: {
seriesId: "DGS10",
label: "10-Year Treasury Yield",
},

} as const;


/* =====================================================
TYPES
===================================================== */

export type HistoricalRatePoint = {

date: string;

value: number;

};


export type HistoricalRateSeries = {

seriesId: string;

label: string;

points: HistoricalRatePoint[];

count: number;

firstDate: string | null;

lastDate: string | null;

};


export type HistoricalRegimeRatesData = {

fedFunds: HistoricalRateSeries;

treasury2Y: HistoricalRateSeries;

treasury10Y: HistoricalRateSeries;

};


type FredObservation = {

date?: string;

value?: string;

};


type FredResponse = {

observations?: FredObservation[];

};


/* =====================================================
HELPERS
===================================================== */

function isValidDateString(
value: unknown
): value is string {

return (
typeof value === "string" &&
/^\d{4}-\d{2}-\d{2}$/.test(value)
);

}


function parseFredValue(
value: unknown
): number | null {

if (
typeof value !== "string" ||
value.trim() === "" ||
value === "."
) {
return null;
}


const parsed =
Number(value);


return Number.isFinite(parsed)
? parsed
: null;

}


function normalizeObservations(
observations: FredObservation[]
): HistoricalRatePoint[] {

const byDate =
new Map<string, HistoricalRatePoint>();


for (const observation of observations) {

if (
!isValidDateString(
observation.date
)
) {
continue;
}


const value =
parseFredValue(
observation.value
);


if (value === null) {
continue;
}


byDate.set(
observation.date,
{
date:
observation.date,

value,
}
);

}


return Array
.from(byDate.values())
.sort(
(a, b) =>
a.date.localeCompare(
b.date
)
);

}


/* =====================================================
FETCH ONE FRED SERIES
===================================================== */

async function fetchFredRateSeries(
seriesId: string,
label: string,
apiKey: string
): Promise<HistoricalRateSeries> {

const params =
new URLSearchParams({

series_id:
seriesId,

api_key:
apiKey,

file_type:
"json",

observation_start:
HISTORICAL_OBSERVATION_START,

sort_order:
"asc",

});


const url =
`${FRED_BASE_URL}?${params.toString()}`;


const response =
await fetch(
url,
{
cache: "no-store",
}
);


if (!response.ok) {

const errorText =
await response.text();


throw new Error(
`Historical FRED series ${seriesId} failed: ` +
`${response.status} ${errorText.slice(0, 250)}`
);

}


const data =
await response.json() as FredResponse;


const rawObservations =
Array.isArray(
data?.observations
)
? data.observations
: [];


const points =
normalizeObservations(
rawObservations
);


if (points.length === 0) {

throw new Error(
`Historical FRED series ${seriesId} returned no valid observations`
);

}


return {

seriesId,

label,

points,

count:
points.length,

firstDate:
points[0]?.date ??
null,

lastDate:
points[
points.length - 1
]?.date ??
null,

};

}


/* =====================================================
LOAD HISTORICAL RATES DATA
===================================================== */

export async function loadHistoricalRegimeRatesData():
Promise<HistoricalRegimeRatesData> {

const apiKey =
process.env.FRED_API_KEY;


if (!apiKey) {

throw new Error(
"FRED_API_KEY is missing"
);

}


const [
fedFunds,
treasury2Y,
treasury10Y,
] =
await Promise.all([

fetchFredRateSeries(
HISTORICAL_RATE_SERIES.fedFunds.seriesId,
HISTORICAL_RATE_SERIES.fedFunds.label,
apiKey
),

fetchFredRateSeries(
HISTORICAL_RATE_SERIES.treasury2Y.seriesId,
HISTORICAL_RATE_SERIES.treasury2Y.label,
apiKey
),

fetchFredRateSeries(
HISTORICAL_RATE_SERIES.treasury10Y.seriesId,
HISTORICAL_RATE_SERIES.treasury10Y.label,
apiKey
),

]);


return {

fedFunds,

treasury2Y,

treasury10Y,

};

}
