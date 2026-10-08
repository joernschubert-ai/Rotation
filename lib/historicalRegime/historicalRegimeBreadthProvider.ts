/**
* Historical Regime – Breadth Provider
*
* Rekonstruiert die Breadth-50-/Breadth-200-Logik aus der
* bestehenden Legacy-Market-Route für die Historical-Regime-Schicht.
*
* LEGACY-DEFINITION
* -----------------
* Universe:
* breadthUniverse
*
* Raw Breadth 50:
* Anteil der gültigen Assets mit
* current > MA50
*
* Raw Breadth 200:
* Anteil der gültigen Assets mit
* current > MA200
*
* Gültigkeit:
* Ein Asset wird wie in der Legacy-Route nur berücksichtigt,
* wenn mindestens 200 historische Schlusskurse bis zum jeweiligen
* historischen Handelstag vorhanden sind.
*
* Smoothing:
* Erster Wert:
* smoothed = raw
*
* Danach:
* smoothed =
* previousSmoothed * 0.5 +
* raw * 0.5
*
* Die Historical-Regime-Schicht verwendet damit dieselbe operative
* Breadth-Definition, ohne die Legacy-Market-Route zu verändern.
*
* WICHTIG
* -------
* - Keine Market-Engine
* - Kein Master Score
* - Keine Fragility
* - Keine Regime-Klassifikation
* - Keine künstlichen historischen Werte
* - Keine Nutzung der operativen marketHistory
* - Keine Future-Daten bei MA-Berechnung
*
* METHODISCHE EINSCHRÄNKUNG
* -------------------------
* Das Universe ist das heutige Legacy-Universe.
*
* Dadurch bestehen historische Survivorship-/Ticker-Bias-Effekte.
* Diese Datei korrigiert das bewusst NICHT.
*
* Ziel dieses Providers ist zunächst die methodisch konsistente
* Rekonstruktion der bestehenden operativen Breadth-Definition.
*/

const YAHOO_CHART_BASE_URL =
"https://query1.finance.yahoo.com/v8/finance/chart";

const HISTORICAL_RANGE = "15y";
const INTERVAL = "1d";

const MIN_HISTORY_LENGTH = 200;

/**
* Begrenzte Parallelität, damit nicht mehrere hundert
* Yahoo-Anfragen gleichzeitig gestartet werden.
*/
const FETCH_CONCURRENCY = 8;

/**
* Exakt aus der Legacy-Market-Route übernommen.
*
* WICHTIG:
* "UAL" ist im ursprünglichen Universe zweimal enthalten.
*
* Das Duplikat bleibt absichtlich erhalten.
* Es wird also NICHT über das Universe dedupliziert,
* weil wir die historische Definition zunächst exakt
* reproduzieren wollen.
*/
export const HISTORICAL_BREADTH_UNIVERSE = [
/* ================= MEGA CAP ================= */

"AAPL",
"MSFT",
"NVDA",
"AMZN",
"META",
"GOOGL",
"AVGO",
"TSLA",
"BRK-B",
"JPM",
"LLY",
"V",
"XOM",
"UNH",
"MA",
"PG",
"COST",
"JNJ",
"HD",
"ABBV",
"MRK",
"KO",
"PEP",
"ADBE",
"NFLX",
"AMD",
"CVX",
"WMT",
"BAC",
"TMO",
"CRM",
"DIS",
"LIN",
"MCD",
"CSCO",
"ACN",
"ABT",
"DHR",
"WFC",
"TXN",
"INTU",
"QCOM",
"AMGN",
"IBM",
"PM",
"CAT",
"NOW",
"GE",
"RTX",
"SPGI",

/* ================= INDUSTRIALS ================= */

"DE",
"ETN",
"PH",
"TT",
"EMR",
"ROK",
"PCAR",
"CMI",
"OTIS",
"FAST",
"PWR",
"URI",
"JCI",
"LHX",
"ITW",

/* ================= FINANCIALS ================= */

"GS",
"MS",
"BLK",
"SCHW",
"AXP",
"C",
"USB",
"PNC",
"TFC",
"BK",
"AIG",
"MET",
"CB",
"TRV",
"AFL",

/* ================= CONSUMER ================= */

"SBUX",
"LOW",
"TJX",
"BKNG",
"MAR",
"YUM",
"CMG",
"ORLY",
"ROST",
"DHI",

/* ================= HEALTHCARE ================= */

"ISRG",
"BSX",
"SYK",
"VRTX",
"REGN",
"CI",
"HUM",
"MDT",
"BMY",
"GILD",

/* ================= SEMIS / TECH BREADTH ================= */

"MU",
"KLAC",
"LRCX",
"AMAT",
"ADI",
"MCHP",
"NXPI",
"SNPS",
"CDNS",
"ANET",
"PANW",
"CRWD",
"DDOG",
"MDB",
"TEAM",

/* ================= ENERGY / MATERIALS ================= */

"SLB",
"EOG",
"MPC",
"PSX",
"VLO",
"NEM",
"FCX",
"MLM",
"NUE",
"DD",

/* ================= TRANSPORT / CYCLICAL ================= */

"UPS",
"FDX",
"DAL",
"UAL",
"CSX",
"NSC",
"JBHT",
"ODFL",
"LUV",
"UAL",

/* ================= MID CAP / INTERNALS ================= */

"DOCU",
"SQ",
"SHOP",
"ROKU",
"UPST",
"AFRM",
"SNOW",
"NET",
"COIN",
"PLTR",

/* ================= EQUAL-WEIGHT STYLE ================= */

"RSP",
"MDY",
"IJH",
"IWM",
"QQEW",

/* ================= UTILITIES ================= */

"NEE",
"DUK",
"SO",
"EXC",
"AEP",
"SRE",
"XEL",
"PEG",
"ED",
"D",

/* ================= REITS ================= */

"PLD",
"AMT",
"EQIX",
"O",
"SPG",
"CCI",
"WELL",
"DLR",
"VICI",
"PSA",

/* ================= REGIONAL BANKS ================= */

"FITB",
"RF",
"HBAN",
"KEY",
"ZION",
"CMA",
"MTB",
"FHN",
"PACW",
"EWBC",

/* ================= HOMEBUILDERS ================= */

"LEN",
"PHM",
"NVR",
"TOL",
"KBH",
"MTH",
"BLD",
"TREX",
"MAS",
"WHR",

/* ================= RETAIL / CONSUMER INTERNALS ================= */

"TGT",
"DG",
"DLTR",
"ULTA",
"BBY",
"KMX",
"AZO",
"EBAY",
"ETSY",
"W",

/* ================= SOFTWARE BREADTH ================= */

"ZS",
"OKTA",
"HUBS",
"ESTC",
"DOCN",
"SMAR",
"BILL",
"TWLO",
"U",
"PATH",

/* ================= CLOUD / INFRA ================= */

"FSLY",
"AKAM",
"DT",
"CFLT",
"IOT",
"GTLB",
"AI",
"S",
"CYBR",
"ZI",

/* ================= BIOTECH / RISK APPETITE ================= */

"MRNA",
"DNA",
"XBI",
"IBB",
"ALNY",
"EXAS",
"TECH",
"SRPT",
"CRSP",
"NTLA",

/* ================= SMALL / MID CYCLICALS ================= */

"WCC",
"GWW",
"SITE",
"CNM",
"SSD",
"AIT",
"LPX",
"UFPI",
"BCC",
"WIRE",

/* ================= TRANSPORT EXPANSION ================= */

"CHRW",
"EXPD",
"MATX",
"KEX",
"SAIA",
"ARCB",
"XPO",
"RYAAY",
"ALK",
"AAL",

/* ================= ENERGY BREADTH ================= */

"OXY",
"DVN",
"FANG",
"HES",
"BKR",
"HAL",
"COP",
"CTRA",
"MRO",
"APA",

/* ================= MATERIALS / GLOBAL CYCLE ================= */

"APD",
"ECL",
"IFF",
"SHW",
"BALL",
"PKG",
"IP",
"CF",
"MOS",
"ALB",

/* ================= NON-AI TECH ================= */

"HPQ",
"DELL",
"STX",
"WDAY",
"NTAP",
"CTSH",
"VRSN",
"GEN",
"PAYX",
"TYL",

/* ================= SMALL CAP RISK / SPECULATION ================= */

"SOFI",
"IONQ",
"ASTS",
"RKLB",
"CAVA",
"CELH",
"DUOL",
"APP",
"HIMS",
"RIOT",
] as const;

export type HistoricalBreadthDay = {
date: string;

/**
* Ungeglättete Werte direkt aus der MA-Berechnung.
*/
rawBreadth50: number | null;
rawBreadth200: number | null;

/**
* Geglättete operative Werte.
*/
breadth50: number | null;
breadth200: number | null;

/**
* Transparenz / Qualitätskontrolle.
*/
validAssets: number;
above50Count: number;
above200Count: number;
};

export type HistoricalBreadthDataset = {
days: HistoricalBreadthDay[];

count: number;

firstDate: string | null;
lastDate: string | null;

universeSize: number;
uniqueUniverseSize: number;

diagnostics: {
requestedAssets: number;
uniqueAssets: number;
duplicateAssetCount: number;

fetchedAssets: number;
failedAssets: number;

minValidAssets: number | null;
maxValidAssets: number | null;

rawBreadth50AvailableCount: number;
rawBreadth200AvailableCount: number;

breadth50AvailableCount: number;
breadth200AvailableCount: number;

chronological: boolean;
};
};

type HistoricalPriceSeries = {
symbol: string;
dates: string[];
closes: number[];
};

type YahooChartResponse = {
chart?: {
result?: Array<{
timestamp?: number[];

indicators?: {
quote?: Array<{
close?: Array<number | null>;
}>;
};
} | null>;

error?: unknown;
};
};

type BreadthAccumulator = {
validAssets: number;
above50Count: number;
above200Count: number;
};

function isFiniteNumber(
value: unknown,
): value is number {
return (
typeof value === "number" &&
Number.isFinite(value)
);
}

function toISODate(
timestampSeconds: number,
): string {
return new Date(
timestampSeconds * 1000,
)
.toISOString()
.slice(0, 10);
}

/**
* Historische Tageskurse eines einzelnen Assets.
*
* Die operative Route nutzt ebenfalls die Yahoo Chart API.
* Hier wird lediglich die Range von 2y auf 15y erweitert,
* weil wir die Historical-Regime-Schicht benötigen.
*/
async function fetchHistoricalPriceSeries(
symbol: string,
): Promise<HistoricalPriceSeries | null> {
const url =
`${YAHOO_CHART_BASE_URL}/${encodeURIComponent(
symbol,
)}` +
`?interval=${INTERVAL}&range=${HISTORICAL_RANGE}`;

try {
const response = await fetch(
url,
{
headers: {
"User-Agent": "Mozilla/5.0",
Accept: "application/json",
},
cache: "no-store",
},
);

if (!response.ok) {
console.log(
`[HistoricalBreadth] Yahoo HTTP ${response.status}: ${symbol}`,
);

return null;
}

const data =
(await response.json()) as YahooChartResponse;

const result =
data.chart?.result?.[0];

if (!result) {
console.log(
`[HistoricalBreadth] Yahoo empty result: ${symbol}`,
);

return null;
}

const timestamps =
result.timestamp ?? [];

const closes =
result.indicators
?.quote?.[0]?.close ?? [];

const length = Math.min(
timestamps.length,
closes.length,
);

const points: Array<{
date: string;
close: number;
}> = [];

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
!isFiniteNumber(close)
) {
continue;
}

points.push({
date: toISODate(timestamp),
close,
});
}

points.sort(
(a, b) =>
a.date.localeCompare(
b.date,
),
);

/**
* Sicherheit gegen doppelte Tageswerte.
*/
const deduplicated: Array<{
date: string;
close: number;
}> = [];

for (const point of points) {
const previous =
deduplicated[
deduplicated.length - 1
];

if (
previous?.date ===
point.date
) {
deduplicated[
deduplicated.length - 1
] = point;
} else {
deduplicated.push(
point,
);
}
}

if (
deduplicated.length <
MIN_HISTORY_LENGTH
) {
console.log(
`[HistoricalBreadth] insufficient history: ` +
`${symbol} (${deduplicated.length})`,
);

return null;
}

return {
symbol,

dates: deduplicated.map(
(point) => point.date,
),

closes: deduplicated.map(
(point) => point.close,
),
};
} catch (error) {
console.log(
`[HistoricalBreadth] Yahoo fetch error: ${symbol}`,
error,
);

return null;
}
}

/**
* Begrenzte parallele Verarbeitung.
*/
async function mapWithConcurrency<T, R>(
items: readonly T[],
worker: (
item: T,
) => Promise<R>,
concurrency: number,
): Promise<R[]> {
const results: R[] =
new Array(items.length);

let nextIndex = 0;

async function runWorker(): Promise<void> {
while (true) {
const index =
nextIndex++;

if (
index >=
items.length
) {
return;
}

results[index] =
await worker(
items[index],
);
}
}

const workerCount =
Math.min(
Math.max(
1,
concurrency,
),
items.length,
);

await Promise.all(
Array.from(
{
length:
workerCount,
},
() =>
runWorker(),
),
);

return results;
}

/**
* Prüft, ob eine historische Serie chronologisch
* und ohne ungültige Werte vorliegt.
*/
function validatePriceSeries(
series: HistoricalPriceSeries,
): boolean {
if (
series.dates.length !==
series.closes.length
) {
return false;
}

for (
let i = 0;
i < series.dates.length;
i++
) {
if (
!series.dates[i] ||
!isFiniteNumber(
series.closes[i],
)
) {
return false;
}

if (
i > 0 &&
series.dates[i - 1] >=
series.dates[i]
) {
return false;
}
}

return true;
}

/**
* Baut die Raw-Breadth-Zeitreihe.
*
* Für jedes Asset werden die MA50- und MA200-Werte
* chronologisch berechnet.
*
* Es wird ausschließlich die Historie bis zum jeweiligen
* historischen Tag verwendet.
*
* Dadurch entsteht kein Future Leak.
*/
function buildRawBreadthHistory(
series: HistoricalPriceSeries[],
): Map<string, BreadthAccumulator> {
const seriesBySymbol =
new Map<
string,
HistoricalPriceSeries
>();

for (const item of series) {
if (
!validatePriceSeries(item)
) {
continue;
}

seriesBySymbol.set(
item.symbol,
item,
);
}

const accumulators =
new Map<
string,
BreadthAccumulator
>();

/**
* Wir gehen über das vollständige Legacy-Universe.
*
* Deshalb wird UAL zweimal verarbeitet,
* genau wie im ursprünglichen Universe.
*/
for (
const symbol of HISTORICAL_BREADTH_UNIVERSE
) {
const asset =
seriesBySymbol.get(
symbol,
);

if (!asset) {
continue;
}

/**
* Prefix-Summe ermöglicht MA-Berechnung
* ohne für jeden Tag erneut 50 bzw. 200
* Werte summieren zu müssen.
*/
const prefixSums: number[] =
new Array(
asset.closes.length + 1,
);

prefixSums[0] = 0;

for (
let i = 0;
i < asset.closes.length;
i++
) {
prefixSums[i + 1] =
prefixSums[i] +
asset.closes[i];
}

for (
let i = 0;
i < asset.closes.length;
i++
) {
const date =
asset.dates[i];

const current =
asset.closes[i];

/**
* Exakte historische Interpretation
* der Legacy-Bedingung:
*
* if(closes.length < 200) return;
*
* Für einen historischen Tag muss das Asset
* also mindestens 200 Datenpunkte bis zu diesem
* Tag besitzen.
*/
if (
i + 1 <
MIN_HISTORY_LENGTH
) {
continue;
}

const ma50Start =
i + 1 - 50;

const ma200Start =
i + 1 - 200;

const ma50 =
(prefixSums[i + 1] -
prefixSums[
ma50Start
]) /
50;

const ma200 =
(prefixSums[i + 1] -
prefixSums[
ma200Start
]) /
200;

let accumulator =
accumulators.get(
date,
);

if (!accumulator) {
accumulator = {
validAssets: 0,
above50Count: 0,
above200Count: 0,
};

accumulators.set(
date,
accumulator,
);
}

accumulator.validAssets++;

if (
current > ma50
) {
accumulator.above50Count++;
}

if (
current > ma200
) {
accumulator.above200Count++;
}
}
}

return accumulators;
}

function isChronological(
days: HistoricalBreadthDay[],
): boolean {
for (
let i = 1;
i < days.length;
i++
) {
if (
days[i - 1].date >=
days[i].date
) {
return false;
}
}

return true;
}

/**
* Hauptfunktion des Historical-Regime-Breadth-Providers.
*
* Lädt das definierte Breadth-Universe,
* berechnet Raw Breadth50/200 und rekonstruiert
* anschließend die operative 50/50-Glättung.
*/
export async function loadHistoricalRegimeBreadthData(): Promise<HistoricalBreadthDataset> {
const universe =
HISTORICAL_BREADTH_UNIVERSE;

/**
* Nur beim HTTP-Fetch deduplizieren.
*
* Die Berechnung selbst arbeitet weiterhin
* mit dem vollständigen Legacy-Universe.
*/
const uniqueUniverse =
Array.from(
new Set(universe),
);

const duplicateAssetCount =
universe.length -
uniqueUniverse.length;

console.log(
`[HistoricalBreadth] loading ` +
`${uniqueUniverse.length} unique assets ` +
`from ${universe.length} universe entries`,
);

const fetchedResults =
await mapWithConcurrency(
uniqueUniverse,
fetchHistoricalPriceSeries,
FETCH_CONCURRENCY,
);

const successfulSeries =
fetchedResults.filter(
(
series,
): series is HistoricalPriceSeries =>
series !== null,
);

const failedAssets =
uniqueUniverse.length -
successfulSeries.length;

console.log(
`[HistoricalBreadth] fetched ` +
`${successfulSeries.length}/` +
`${uniqueUniverse.length} unique assets`,
);

/**
* Keine synthetische Fallback-Berechnung.
*/
if (
successfulSeries.length === 0
) {
return {
days: [],
count: 0,

firstDate: null,
lastDate: null,

universeSize:
universe.length,

uniqueUniverseSize:
uniqueUniverse.length,

diagnostics: {
requestedAssets:
universe.length,

uniqueAssets:
uniqueUniverse.length,

duplicateAssetCount,

fetchedAssets: 0,
failedAssets,

minValidAssets: null,
maxValidAssets: null,

rawBreadth50AvailableCount: 0,
rawBreadth200AvailableCount: 0,

breadth50AvailableCount: 0,
breadth200AvailableCount: 0,

chronological: true,
},
};
}

/**
* Raw Breadth wird zunächst komplett
* chronologisch rekonstruiert.
*/
const rawHistory =
buildRawBreadthHistory(
successfulSeries,
);

const dates =
Array.from(
rawHistory.keys(),
).sort();

const days: HistoricalBreadthDay[] =
[];

/**
* Zustand der operativen 50/50-Glättung.
*/
let smoothedBreadth50:
| number
| null = null;

let smoothedBreadth200:
| number
| null = null;

for (const date of dates) {
const raw =
rawHistory.get(date);

if (
!raw ||
raw.validAssets === 0
) {
continue;
}

const rawBreadth50 =
raw.above50Count /
raw.validAssets;

const rawBreadth200 =
raw.above200Count /
raw.validAssets;

/* ================= BREADTH 200 SMOOTHING ================= */

/**
* Exakte Logik der Legacy-Route:
*
* if(smoothedBreadth200 === 0)
* smoothedBreadth200 = rawBreadth200;
* else
* smoothedBreadth200 =
* smoothedBreadth200 * 0.5 +
* rawBreadth200 * 0.5;
*
* null wird hier nur als sauberer
* "noch nicht initialisiert"-Zustand verwendet.
*/
if (
smoothedBreadth200 === null
) {
smoothedBreadth200 =
rawBreadth200;
} else {
smoothedBreadth200 =
smoothedBreadth200 * 0.5 +
rawBreadth200 * 0.5;
}

/* ================= BREADTH 50 SMOOTHING ================= */

if (
smoothedBreadth50 === null
) {
smoothedBreadth50 =
rawBreadth50;
} else {
smoothedBreadth50 =
smoothedBreadth50 * 0.5 +
rawBreadth50 * 0.5;
}

days.push({
date,

rawBreadth50,
rawBreadth200,

breadth50:
smoothedBreadth50,

breadth200:
smoothedBreadth200,

validAssets:
raw.validAssets,

above50Count:
raw.above50Count,

above200Count:
raw.above200Count,
});
}

const validAssetCounts =
days.map(
(day) =>
day.validAssets,
);

const rawBreadth50AvailableCount =
days.filter(
(day) =>
day.rawBreadth50 !==
null,
).length;

const rawBreadth200AvailableCount =
days.filter(
(day) =>
day.rawBreadth200 !==
null,
).length;

const breadth50AvailableCount =
days.filter(
(day) =>
day.breadth50 !==
null,
).length;

const breadth200AvailableCount =
days.filter(
(day) =>
day.breadth200 !==
null,
).length;

return {
days,

count:
days.length,

firstDate:
days[0]?.date ?? null,

lastDate:
days[
days.length - 1
]?.date ?? null,

universeSize:
universe.length,

uniqueUniverseSize:
uniqueUniverse.length,

diagnostics: {
requestedAssets:
universe.length,

uniqueAssets:
uniqueUniverse.length,

duplicateAssetCount,

fetchedAssets:
successfulSeries.length,

failedAssets,

minValidAssets:
validAssetCounts.length >
0
? Math.min(
...validAssetCounts,
)
: null,

maxValidAssets:
validAssetCounts.length >
0
? Math.max(
...validAssetCounts,
)
: null,

rawBreadth50AvailableCount,

rawBreadth200AvailableCount,

breadth50AvailableCount,

breadth200AvailableCount,

chronological:
isChronological(
days,
),
},
};
}
