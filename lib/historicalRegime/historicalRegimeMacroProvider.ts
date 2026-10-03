/**
* Historical Regime — Macro Data Provider
*
* Purpose:
* - Load long-history macroeconomic series from FRED.
* - Preserve source/vintage metadata.
* - Keep data collection separate from alignment, features and scoring.
*
* Important:
* - No regime classification.
* - No scoring.
* - No persistence.
* - No synthetic values.
* - No historical Rotation-App reconstruction.
*
* The provider deliberately exposes vintage dates so that the following
* alignment layer can enforce an as-of information set and avoid
* look-ahead bias.
*/

const FRED_API_BASE =
"https://api.stlouisfed.org/fred";

const HISTORICAL_MACRO_START = "2011-01-01";

type FredObservationResponse = {
observations?: Array<{
realtime_start?: string;
realtime_end?: string;
date?: string;
value?: string;
}>;
};

type FredVintageDatesResponse = {
vintage_dates?: string[];
};

export type HistoricalMacroObservation = {
date: string;
value: number;
realtimeStart: string | null;
realtimeEnd: string | null;
};

export type HistoricalMacroSeries = {
key: HistoricalMacroSeriesKey;
seriesId: string;
label: string;
frequency: string | null;
units: string | null;
seasonalAdjustment: string | null;
observations: HistoricalMacroObservation[];
vintageDates: string[];
firstDate: string | null;
lastDate: string | null;
count: number;
};

export type HistoricalMacroSeriesKey =
| "cpi"
| "coreCpi"
| "nfci"
| "real10Y";

export type HistoricalRegimeMacroData = {
cpi: HistoricalMacroSeries;
coreCpi: HistoricalMacroSeries;
nfci: HistoricalMacroSeries;
real10Y: HistoricalMacroSeries;
};

type SeriesConfig = {
key: HistoricalMacroSeriesKey;
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
label: "Chicago Fed National Financial Conditions Index",
},
{
key: "real10Y",
seriesId: "DFII10",
label: "10-Year Treasury Inflation-Indexed Security",
},
];

function getFredApiKey(): string {
const apiKey = process.env.FRED_API_KEY;

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
const url = new URL(`${FRED_API_BASE}/${path}`);

url.searchParams.set(
"api_key",
getFredApiKey()
);

url.searchParams.set(
"file_type",
"json"
);

for (const [key, value] of Object.entries(params)) {
url.searchParams.set(key, value);
}

return url.toString();
}

async function fetchFredJson<T>(
path: string,
params: Record<string, string>
): Promise<T> {
const response = await fetch(
buildFredUrl(path, params),
{
headers: {
Accept: "application/json",
},
cache: "no-store",
}
);

if (!response.ok) {
throw new Error(
`FRED request failed: ${response.status} ${response.statusText}`
);
}

return response.json() as Promise<T>;
}

async function fetchSeriesObservations(
seriesId: string
): Promise<HistoricalMacroObservation[]> {
const data =
await fetchFredJson<FredObservationResponse>(
"series/observations",
{
series_id: seriesId,
observation_start:
HISTORICAL_MACRO_START,
observation_end: "9999-12-31",
realtime_start:
HISTORICAL_MACRO_START,
realtime_end:
"9999-12-31",
order_by: "observation_date",
sort_order: "asc",
limit: "100000",
}
);

const observations =
data.observations ?? [];

return observations
.map((observation) => {
const date = observation.date ?? "";
const value = Number(
observation.value
);

return {
date,
value,
realtimeStart:
observation.realtime_start ?? null,
realtimeEnd:
observation.realtime_end ?? null,
};
})
.filter(
(observation) =>
/^\d{4}-\d{2}-\d{2}$/.test(
observation.date
) &&
Number.isFinite(observation.value)
)
.sort((a, b) =>
a.date.localeCompare(b.date)
);
}

async function fetchVintageDates(
seriesId: string
): Promise<string[]> {
const data =
await fetchFredJson<FredVintageDatesResponse>(
"series/vintagedates",
{
series_id: seriesId,
realtime_start:
HISTORICAL_MACRO_START,
realtime_end:
"9999-12-31",
order_by: "vintage_date",
sort_order: "asc",
limit: "10000",
}
);

return Array.from(
new Set(
(data.vintage_dates ?? []).filter(
(date) =>
/^\d{4}-\d{2}-\d{2}$/.test(date)
)
)
).sort((a, b) =>
a.localeCompare(b)
);
}

async function fetchSeriesMetadata(
seriesId: string
): Promise<{
frequency: string | null;
units: string | null;
seasonalAdjustment: string | null;
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
series_id: seriesId,
realtime_start:
HISTORICAL_MACRO_START,
realtime_end:
"9999-12-31",
}
);

const series =
data.seriess?.[0];

return {
frequency:
series?.frequency ?? null,
units:
series?.units ?? null,
seasonalAdjustment:
series?.seasonal_adjustment ?? null,
};
}

async function loadHistoricalMacroSeries(
config: SeriesConfig
): Promise<HistoricalMacroSeries> {
const [
observations,
vintageDates,
metadata,
] = await Promise.all([
fetchSeriesObservations(
config.seriesId
),
fetchVintageDates(
config.seriesId
),
fetchSeriesMetadata(
config.seriesId
),
]);

return {
key: config.key,
seriesId: config.seriesId,
label: config.label,
frequency: metadata.frequency,
units: metadata.units,
seasonalAdjustment:
metadata.seasonalAdjustment,
observations,
vintageDates,
firstDate:
observations[0]?.date ?? null,
lastDate:
observations.at(-1)?.date ?? null,
count: observations.length,
};
}

export async function loadHistoricalRegimeMacroData(): Promise<HistoricalRegimeMacroData> {
const series =
await Promise.all(
SERIES.map(
loadHistoricalMacroSeries
)
);

const byKey =
Object.fromEntries(
series.map((item) => [
item.key,
item,
])
) as Record<
HistoricalMacroSeriesKey,
HistoricalMacroSeries
>;

return {
cpi: byKey.cpi,
coreCpi: byKey.coreCpi,
nfci: byKey.nfci,
real10Y: byKey.real10Y,
};
}
