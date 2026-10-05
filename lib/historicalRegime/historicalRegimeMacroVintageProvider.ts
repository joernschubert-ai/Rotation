/**
* Historical Regime — Macro Vintage Data Provider
*
* Purpose:
* - Load revision-aware historical macroeconomic data from FRED.
* - Preserve the real-time validity period of each observation.
* - Avoid using today's revised value as if it had been known historically.
*
* Important:
* - No regime classification.
* - No scoring.
* - No persistence.
* - No synthetic values.
* - No historical Rotation-App reconstruction.
*
* The provider uses FRED output_type=1 in bounded real-time windows.
* This returns observations together with their realtime_start /
* realtime_end validity periods.
*
* FRED limits the number of observations returned by one request.
* Therefore every real-time window is paginated with offset so that
* large revision-aware series such as NFCI are never truncated.
*/

const FRED_API_BASE =
"https://api.stlouisfed.org/fred";

const HISTORICAL_MACRO_START =
"2011-01-01";

const HISTORICAL_MACRO_END =
"9999-12-31";

/**
* FRED only allows realtime_end values up to today's date
* unless the special real-time maximum date 9999-12-31 is used.
*
* The final window therefore gets capped dynamically at today.
*/
function getFredToday(): string {
return new Date()
.toISOString()
.slice(0, 10);
}

/**
* Five-year real-time windows keep the amount of revision data
* manageable while preserving the complete historical observation
* range needed for as-of reconstruction.
*/
const REALTIME_WINDOWS = [
{
start: "2011-01-01",
end: "2015-12-31",
},
{
start: "2016-01-01",
end: "2020-12-31",
},
{
start: "2021-01-01",
end: "2025-12-31",
},
{
start: "2026-01-01",
end: "2026-12-31",
},
] as const;

/**
* FRED permits up to 100,000 observations per response.
*
* We deliberately use the documented maximum and paginate with
* offset whenever a window contains more observations.
*/
const FRED_PAGE_SIZE = 100000;

type FredObservationResponse = {
count?: number;

observations?: Array<{
realtime_start?: string;
realtime_end?: string;
date?: string;
value?: string;
}>;
};

export type HistoricalMacroVintageObservation = {
date: string;
value: number;
realtimeStart: string;
realtimeEnd: string;
};

export type HistoricalMacroVintageSeries = {
key: HistoricalMacroVintageSeriesKey;
seriesId: string;
label: string;
frequency: string | null;
units: string | null;
seasonalAdjustment: string | null;

observations: HistoricalMacroVintageObservation[];

firstDate: string | null;
lastDate: string | null;

count: number;

realtimeStart: string | null;
realtimeEnd: string | null;

windowCount: number;
};

export type HistoricalMacroVintageSeriesKey =
| "cpi"
| "coreCpi"
| "nfci"
| "real10Y";

export type HistoricalRegimeMacroVintageData = {
cpi: HistoricalMacroVintageSeries;
coreCpi: HistoricalMacroVintageSeries;
nfci: HistoricalMacroVintageSeries;
real10Y: HistoricalMacroVintageSeries;
};

type SeriesConfig = {
key: HistoricalMacroVintageSeriesKey;
seriesId: string;
label: string;
};

const SERIES: SeriesConfig[] = [
{
key: "cpi",
seriesId: "CPIAUCSL",
label: "Headline CPI",
},
{
key: "coreCpi",
seriesId: "CPILFESL",
label: "Core CPI",
},
{
key: "nfci",
seriesId: "NFCI",
label:
"Chicago Fed National Financial Conditions Index",
},
{
key: "real10Y",
seriesId: "DFII10",
label:
"10-Year Treasury Inflation-Indexed Security",
},
];

function getFredApiKey(): string {
const apiKey =
process.env.FRED_API_KEY;

if (!apiKey) {
throw new Error(
"FRED_API_KEY is not configured."
);
}

return apiKey;
}

function buildFredUrl(
path: string,
params: Record<string, string>
): string {
const url = new URL(
`${FRED_API_BASE}/${path}`
);

url.searchParams.set(
"api_key",
getFredApiKey()
);

url.searchParams.set(
"file_type",
"json"
);

for (
const [key, value] of Object.entries(
params
)
) {
url.searchParams.set(
key,
value
);
}

return url.toString();
}

async function fetchFredJson<T>(
path: string,
params: Record<string, string>
): Promise<T> {
const url =
buildFredUrl(
path,
params
);

const response =
await fetch(
url,
{
headers: {
Accept:
"application/json",
},
cache:
"no-store",
}
);

if (!response.ok) {
let errorDetails =
"No FRED error details available.";

try {
const errorBody =
await response.json();

if (
errorBody &&
typeof errorBody ===
"object"
) {
const body =
errorBody as {
error_code?: number;
error_message?: string;
};

errorDetails =
body.error_message ??
JSON.stringify(
errorBody
);
}
} catch {
try {
errorDetails =
await response.text();
} catch {
// Keep fallback error message.
}
}

throw new Error(
`FRED request failed for ${path}: ` +
`${response.status} ${response.statusText}. ` +
`${errorDetails}`
);
}

return response.json() as Promise<T>;
}

function isValidDateString(
value: string
): boolean {
return /^\d{4}-\d{2}-\d{2}$/.test(
value
);
}

function parseFredObservations(
observations:
Array<{
realtime_start?: string;
realtime_end?: string;
date?: string;
value?: string;
}> = []
): HistoricalMacroVintageObservation[] {
return observations
.map(
(
observation
) => {
const date =
observation.date ??
"";

const value =
Number(
observation.value
);

const sourceRealtimeStart =
observation.realtime_start ??
"";

const sourceRealtimeEnd =
observation.realtime_end ??
"";

return {
date,
value,
realtimeStart:
sourceRealtimeStart,
realtimeEnd:
sourceRealtimeEnd,
};
}
)
.filter(
(
observation
) =>
isValidDateString(
observation.date
) &&
Number.isFinite(
observation.value
) &&
isValidDateString(
observation.realtimeStart
) &&
isValidDateString(
observation.realtimeEnd
)
);
}

/**
* Fetch one complete real-time window.
*
* Important:
* FRED may return more than 100,000 observations for a single
* real-time window, especially for NFCI because the requested
* observation history starts in 2011 while many historical
* real-time periods are represented.
*
* Pagination is therefore mandatory. Without it the API response
* is silently truncated at the page limit and later observation
* dates can disappear from the dataset.
*/
async function fetchVintageObservationsForWindow(
seriesId: string,
realtimeStart: string,
realtimeEnd: string
): Promise<HistoricalMacroVintageObservation[]> {
/**
* FRED rejects realtime_end dates that are later than today.
*
* This matters for the final configured window:
* 2026-01-01 → 2026-12-31
*/
const today =
getFredToday();

const effectiveRealtimeEnd =
realtimeEnd < today
? realtimeEnd
: today;

/**
* Protect against a theoretically invalid window if this code
* is ever executed before the configured start date.
*/
if (
effectiveRealtimeEnd <
realtimeStart
) {
return [];
}

const allObservations:
HistoricalMacroVintageObservation[] =
[];

let offset = 0;

while (true) {
const data =
await fetchFredJson<FredObservationResponse>(
"series/observations",
{
series_id:
seriesId,

observation_start:
HISTORICAL_MACRO_START,

observation_end:
HISTORICAL_MACRO_END,

realtime_start:
realtimeStart,

realtime_end:
effectiveRealtimeEnd,

output_type:
"1",

order_by:
"observation_date",

sort_order:
"asc",

limit:
String(
FRED_PAGE_SIZE
),

offset:
String(
offset
),
}
);

const page =
parseFredObservations(
data.observations
);

allObservations.push(
...page
);

/**
* Stop when the returned page is smaller than the requested
* page size. This is the normal final-page condition.
*
* We also stop on an empty page as an additional safeguard.
*/
if (
page.length === 0 ||
page.length <
FRED_PAGE_SIZE
) {
break;
}

offset +=
FRED_PAGE_SIZE;
}

return allObservations;
}

function observationKey(
observation: HistoricalMacroVintageObservation
): string {
return [
observation.date,
observation.realtimeStart,
observation.realtimeEnd,
observation.value,
].join("|");
}

function deduplicateObservations(
observations:
HistoricalMacroVintageObservation[]
): HistoricalMacroVintageObservation[] {
const seen =
new Set<string>();

const result:
HistoricalMacroVintageObservation[] =
[];

for (
const observation of
observations
) {
const key =
observationKey(
observation
);

if (
seen.has(key)
) {
continue;
}

seen.add(key);

result.push(
observation
);
}

return result.sort(
(
a,
b
) => {
const dateComparison =
a.date.localeCompare(
b.date
);

if (
dateComparison !==
0
) {
return dateComparison;
}

const realtimeStartComparison =
a.realtimeStart.localeCompare(
b.realtimeStart
);

if (
realtimeStartComparison !==
0
) {
return realtimeStartComparison;
}

return a.realtimeEnd.localeCompare(
b.realtimeEnd
);
}
);
}

async function fetchSeriesMetadata(
seriesId: string
): Promise<{
frequency: string | null;
units: string | null;
seasonalAdjustment:
| string
| null;
}> {
type FredSeriesResponse = {
seriess?: Array<{
frequency?: string;
units?: string;
seasonal_adjustment?: string;
}>;
};

const data =
await fetchFredJson<FredSeriesResponse>(
"series",
{
series_id:
seriesId,
}
);

const series =
data.seriess?.[0];

return {
frequency:
series?.frequency ??
null,

units:
series?.units ??
null,

seasonalAdjustment:
series?.seasonal_adjustment ??
null,
};
}

async function loadHistoricalMacroVintageSeries(
config: SeriesConfig
): Promise<HistoricalMacroVintageSeries> {
const observationsByWindow =
await Promise.all(
REALTIME_WINDOWS.map(
(
window
) =>
fetchVintageObservationsForWindow(
config.seriesId,
window.start,
window.end
)
)
);

const observations =
deduplicateObservations(
observationsByWindow.flat()
);

const metadata =
await fetchSeriesMetadata(
config.seriesId
);

return {
key:
config.key,

seriesId:
config.seriesId,

label:
config.label,

frequency:
metadata.frequency,

units:
metadata.units,

seasonalAdjustment:
metadata.seasonalAdjustment,

observations,

firstDate:
observations[0]
?.date ??
null,

lastDate:
observations.at(-1)
?.date ??
null,

count:
observations.length,

realtimeStart:
observations[0]
?.realtimeStart ??
null,

realtimeEnd:
observations.at(-1)
?.realtimeEnd ??
null,

windowCount:
REALTIME_WINDOWS.length,
};
}

export async function loadHistoricalRegimeMacroVintageData():
Promise<HistoricalRegimeMacroVintageData> {
const series =
await Promise.all(
SERIES.map(
loadHistoricalMacroVintageSeries
)
);

const byKey =
Object.fromEntries(
series.map(
(
item
) => [
item.key,
item,
]
)
) as Record<
HistoricalMacroVintageSeriesKey,
HistoricalMacroVintageSeries
>;

return {
cpi:
byKey.cpi,

coreCpi:
byKey.coreCpi,

nfci:
byKey.nfci,

real10Y:
byKey.real10Y,
};
}
