/**
* Historical Regime – Breadth Provider
*
* Legacy breadth50/breadth200 uses the original, fixed universe (including
* its intentional UAL duplicate), 200-day eligibility and 50/50 smoothing.
*
* Additional research internals are computed causally from daily closes.
* They describe THIS universe, not official exchange breadth. ETF constituents,
* survivorship bias and changing coverage must be considered in research.
*/

const YAHOO_CHART_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const HISTORICAL_RANGE = "15y";
const INTERVAL = "1d";
const MIN_HISTORY_LENGTH = 200;
const FETCH_CONCURRENCY = 8;
const EXTREME_WINDOW = 252;

export const HISTORICAL_BREADTH_UNIVERSE = [
// MEGA CAP
"AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "AVGO", "TSLA", "BRK-B", "JPM",
"LLY", "V", "XOM", "UNH", "MA", "PG", "COST", "JNJ", "HD", "ABBV", "MRK", "KO",
"PEP", "ADBE", "NFLX", "AMD", "CVX", "WMT", "BAC", "TMO", "CRM", "DIS", "LIN",
"MCD", "CSCO", "ACN", "ABT", "DHR", "WFC", "TXN", "INTU", "QCOM", "AMGN",
"IBM", "PM", "CAT", "NOW", "GE", "RTX", "SPGI",
// INDUSTRIALS
"DE", "ETN", "PH", "TT", "EMR", "ROK", "PCAR", "CMI", "OTIS", "FAST", "PWR",
"URI", "JCI", "LHX", "ITW",
// FINANCIALS
"GS", "MS", "BLK", "SCHW", "AXP", "C", "USB", "PNC", "TFC", "BK", "AIG", "MET",
"CB", "TRV", "AFL",
// CONSUMER
"SBUX", "LOW", "TJX", "BKNG", "MAR", "YUM", "CMG", "ORLY", "ROST", "DHI",
// HEALTHCARE
"ISRG", "BSX", "SYK", "VRTX", "REGN", "CI", "HUM", "MDT", "BMY", "GILD",
// SEMIS / TECH BREADTH
"MU", "KLAC", "LRCX", "AMAT", "ADI", "MCHP", "NXPI", "SNPS", "CDNS", "ANET",
"PANW", "CRWD", "DDOG", "MDB", "TEAM",
// ENERGY / MATERIALS
"SLB", "EOG", "MPC", "PSX", "VLO", "NEM", "FCX", "MLM", "NUE", "DD",
// TRANSPORT / CYCLICAL
"UPS", "FDX", "DAL", "UAL", "CSX", "NSC", "JBHT", "ODFL", "LUV", "UAL",
// MID CAP / INTERNALS
"DOCU", "SQ", "SHOP", "ROKU", "UPST", "AFRM", "SNOW", "NET", "COIN", "PLTR",
// EQUAL-WEIGHT STYLE
"RSP", "MDY", "IJH", "IWM", "QQEW",
// UTILITIES
"NEE", "DUK", "SO", "EXC", "AEP", "SRE", "XEL", "PEG", "ED", "D",
// REITS
"PLD", "AMT", "EQIX", "O", "SPG", "CCI", "WELL", "DLR", "VICI", "PSA",
// REGIONAL BANKS
"FITB", "RF", "HBAN", "KEY", "ZION", "CMA", "MTB", "FHN", "PACW", "EWBC",
// HOMEBUILDERS
"LEN", "PHM", "NVR", "TOL", "KBH", "MTH", "BLD", "TREX", "MAS", "WHR",
// RETAIL / CONSUMER INTERNALS
"TGT", "DG", "DLTR", "ULTA", "BBY", "KMX", "AZO", "EBAY", "ETSY", "W",
// SOFTWARE BREADTH
"ZS", "OKTA", "HUBS", "ESTC", "DOCN", "SMAR", "BILL", "TWLO", "U", "PATH",
// CLOUD / INFRA
"FSLY", "AKAM", "DT", "CFLT", "IOT", "GTLB", "AI", "S", "CYBR", "ZI",
// BIOTECH / RISK APPETITE
"MRNA", "DNA", "XBI", "IBB", "ALNY", "EXAS", "TECH", "SRPT", "CRSP", "NTLA",
// SMALL / MID CYCLICALS
"WCC", "GWW", "SITE", "CNM", "SSD", "AIT", "LPX", "UFPI", "BCC", "WIRE",
// TRANSPORT EXPANSION
"CHRW", "EXPD", "MATX", "KEX", "SAIA", "ARCB", "XPO", "RYAAY", "ALK", "AAL",
// ENERGY BREADTH
"OXY", "DVN", "FANG", "HES", "BKR", "HAL", "COP", "CTRA", "MRO", "APA",
// MATERIALS / GLOBAL CYCLE
"APD", "ECL", "IFF", "SHW", "BALL", "PKG", "IP", "CF", "MOS", "ALB",
// NON-AI TECH
"HPQ", "DELL", "STX", "WDAY", "NTAP", "CTSH", "VRSN", "GEN", "PAYX", "TYL",
// SMALL CAP RISK / SPECULATION
"SOFI", "IONQ", "ASTS", "RKLB", "CAVA", "CELH", "DUOL", "APP", "HIMS", "RIOT",
] as const;

export type HistoricalBreadthDay = {
date: string;
// Existing operational fields: never change their calculation.
rawBreadth50: number | null;
rawBreadth200: number | null;
breadth50: number | null;
breadth200: number | null;
validAssets: number;
above50Count: number;
above200Count: number;
// Additional research fields; 20/100 use the SAME 200-day eligibility.
rawBreadth20: number | null;
rawBreadth100: number | null;
above20Count: number;
above100Count: number;
// Advances/declines use unique symbols and a valid previous close.
advanceDeclineEligibleAssets: number;
advances: number;
declines: number;
unchanged: number;
advanceDeclineNet: number | null;
advanceDeclineRatio: number | null;
// Cumulative net starts at 0 before the first eligible observation.
// This is an unadjusted fixed-universe A/D line, not exchange A/D.
adLine: number | null;
// Cumulative sum of daily (advances - declines) / eligible assets.
// Each day contributes within [-1, 1], reducing changing-universe effects.
normalizedADLine: number | null;
// Coverage against today's requested universe and successfully fetched series.
// Both denominators are fixed across dates for transparent comparisons.
breadthCoverageOfUniverse: number;
breadthCoverageOfFetched: number;
advanceDeclineCoverageOfUniverse: number;
advanceDeclineCoverageOfFetched: number;
highLowCoverageOfUniverse: number;
highLowCoverageOfFetched: number;
// Rolling 252-close extremes (including today's close), unique symbols.
// Not official intraday 52-week highs/lows.
highLowEligibleAssets: number;
newClosingHighs252D: number;
newClosingLows252D: number;
highLowNet252D: number | null;
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
rawBreadth20AvailableCount: number;
rawBreadth100AvailableCount: number;
advanceDeclineAvailableCount: number;
highLowAvailableCount: number;
normalizedADLineAvailableCount: number;
minBreadthCoverageOfUniverse: number | null;
maxBreadthCoverageOfUniverse: number | null;
minAdvanceDeclineCoverageOfUniverse: number | null;
maxAdvanceDeclineCoverageOfUniverse: number | null;
minHighLowCoverageOfUniverse: number | null;
maxHighLowCoverageOfUniverse: number | null;
minAdvanceDeclineEligibleAssets: number | null;
maxAdvanceDeclineEligibleAssets: number | null;
minHighLowEligibleAssets: number | null;
maxHighLowEligibleAssets: number | null;
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
indicators?: { quote?: Array<{ close?: Array<number | null> }> };
} | null>;
error?: unknown;
};
};

type BreadthAccumulator = {
validAssets: number;
above20Count: number;
above50Count: number;
above100Count: number;
above200Count: number;
};

type InternalsAccumulator = {
advanceDeclineEligibleAssets: number;
advances: number;
declines: number;
unchanged: number;
highLowEligibleAssets: number;
newClosingHighs252D: number;
newClosingLows252D: number;
};

function isFiniteNumber(value: unknown): value is number {
return typeof value === "number" && Number.isFinite(value);
}

function toISODate(timestampSeconds: number): string {
return new Date(timestampSeconds * 1000).toISOString().slice(0, 10);
}

async function fetchHistoricalPriceSeries(symbol: string): Promise<HistoricalPriceSeries | null> {
const url = `${YAHOO_CHART_BASE_URL}/${encodeURIComponent(symbol)}` +
`?interval=${INTERVAL}&range=${HISTORICAL_RANGE}`;
try {
const response = await fetch(url, {
headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
cache: "no-store",
});
if (!response.ok) {
console.log(`[HistoricalBreadth] Yahoo HTTP ${response.status}: ${symbol}`);
return null;
}
const data = (await response.json()) as YahooChartResponse;
const result = data.chart?.result?.[0];
if (!result) {
console.log(`[HistoricalBreadth] Yahoo empty result: ${symbol}`);
return null;
}
const timestamps = result.timestamp ?? [];
const closes = result.indicators?.quote?.[0]?.close ?? [];
const length = Math.min(timestamps.length, closes.length);
const points: Array<{ date: string; close: number }> = [];
for (let i = 0; i < length; i++) {
const timestamp = timestamps[i];
const close = closes[i];
if (!Number.isFinite(timestamp) || !isFiniteNumber(close)) continue;
points.push({ date: toISODate(timestamp), close });
}
points.sort((a, b) => a.date.localeCompare(b.date));
const deduplicated: Array<{ date: string; close: number }> = [];
for (const point of points) {
const previous = deduplicated[deduplicated.length - 1];
if (previous?.date === point.date) {
deduplicated[deduplicated.length - 1] = point;
} else {
deduplicated.push(point);
}
}
if (deduplicated.length < MIN_HISTORY_LENGTH) {
console.log(`[HistoricalBreadth] insufficient history: ${symbol} (${deduplicated.length})`);
return null;
}
return {
symbol,
dates: deduplicated.map(point => point.date),
closes: deduplicated.map(point => point.close),
};
} catch (error) {
console.log(`[HistoricalBreadth] Yahoo fetch error: ${symbol}`, error);
return null;
}
}

async function mapWithConcurrency<T, R>(
items: readonly T[], worker: (item: T) => Promise<R>, concurrency: number,
): Promise<R[]> {
const results: R[] = new Array(items.length);
let nextIndex = 0;
async function runWorker(): Promise<void> {
while (true) {
const index = nextIndex++;
if (index >= items.length) return;
results[index] = await worker(items[index]);
}
}
const workerCount = Math.min(Math.max(1, concurrency), items.length);
await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
return results;
}

function validatePriceSeries(series: HistoricalPriceSeries): boolean {
if (series.dates.length !== series.closes.length) return false;
for (let i = 0; i < series.dates.length; i++) {
if (!series.dates[i] || !isFiniteNumber(series.closes[i])) return false;
if (i > 0 && series.dates[i - 1] >= series.dates[i]) return false;
}
return true;
}

/**
* Legacy-compatible breadth: the full universe is traversed, including UAL
* twice. New MA20/MA100 share the original >=200-close eligibility gate.
*/
function buildRawBreadthHistory(series: HistoricalPriceSeries[]): Map<string, BreadthAccumulator> {
const seriesBySymbol = new Map<string, HistoricalPriceSeries>();
for (const item of series) {
if (validatePriceSeries(item)) seriesBySymbol.set(item.symbol, item);
}
const accumulators = new Map<string, BreadthAccumulator>();
for (const symbol of HISTORICAL_BREADTH_UNIVERSE) {
const asset = seriesBySymbol.get(symbol);
if (!asset) continue;
const prefixSums: number[] = new Array(asset.closes.length + 1);
prefixSums[0] = 0;
for (let i = 0; i < asset.closes.length; i++) {
prefixSums[i + 1] = prefixSums[i] + asset.closes[i];
}
for (let i = 0; i < asset.closes.length; i++) {
if (i + 1 < MIN_HISTORY_LENGTH) continue;
const date = asset.dates[i];
const current = asset.closes[i];
const ma20 = (prefixSums[i + 1] - prefixSums[i + 1 - 20]) / 20;
const ma50 = (prefixSums[i + 1] - prefixSums[i + 1 - 50]) / 50;
const ma100 = (prefixSums[i + 1] - prefixSums[i + 1 - 100]) / 100;
const ma200 = (prefixSums[i + 1] - prefixSums[i + 1 - 200]) / 200;
let accumulator = accumulators.get(date);
if (!accumulator) {
accumulator = {
validAssets: 0, above20Count: 0, above50Count: 0,
above100Count: 0, above200Count: 0,
};
accumulators.set(date, accumulator);
}
accumulator.validAssets++;
if (current > ma20) accumulator.above20Count++;
if (current > ma50) accumulator.above50Count++;
if (current > ma100) accumulator.above100Count++;
if (current > ma200) accumulator.above200Count++;
}
}
return accumulators;
}

/**
* Research internals use unique symbols (no duplicated UAL weight).
* A/D requires two consecutive observations in that symbol's own series;
* 252-day closing extremes require 252 valid historical closes. A symbol
* entering the sample can affect coverage; no missing values are fabricated.
*/
function buildResearchInternalsHistory(
series: HistoricalPriceSeries[],
): Map<string, InternalsAccumulator> {
const result = new Map<string, InternalsAccumulator>();
for (const asset of series) {
if (!validatePriceSeries(asset)) continue;
// Monotonic deques give rolling min/max in O(n) per symbol.
const maxDeque: number[] = [];
const minDeque: number[] = [];
let maxHead = 0;
let minHead = 0;
for (let i = 0; i < asset.closes.length; i++) {
const date = asset.dates[i];
const close = asset.closes[i];
let day = result.get(date);
if (!day) {
day = {
advanceDeclineEligibleAssets: 0, advances: 0, declines: 0,
unchanged: 0, highLowEligibleAssets: 0,
newClosingHighs252D: 0, newClosingLows252D: 0,
};
result.set(date, day);
}
if (i > 0) {
day.advanceDeclineEligibleAssets++;
const previous = asset.closes[i - 1];
if (close > previous) day.advances++;
else if (close < previous) day.declines++;
else day.unchanged++;
}
while (maxDeque.length > maxHead &&
asset.closes[maxDeque[maxDeque.length - 1]] <= close) maxDeque.pop();
maxDeque.push(i);
while (minDeque.length > minHead &&
asset.closes[minDeque[minDeque.length - 1]] >= close) minDeque.pop();
minDeque.push(i);
const oldest = i - EXTREME_WINDOW + 1;
while (maxHead < maxDeque.length && maxDeque[maxHead] < oldest) maxHead++;
while (minHead < minDeque.length && minDeque[minHead] < oldest) minHead++;
if (i + 1 >= EXTREME_WINDOW) {
day.highLowEligibleAssets++;
if (close >= asset.closes[maxDeque[maxHead]]) day.newClosingHighs252D++;
if (close <= asset.closes[minDeque[minHead]]) day.newClosingLows252D++;
}
// Avoid unbounded stale prefixes on very long price histories.
if (maxHead > 512) { maxDeque.splice(0, maxHead); maxHead = 0; }
if (minHead > 512) { minDeque.splice(0, minHead); minHead = 0; }
}
}
return result;
}

function isChronological(days: HistoricalBreadthDay[]): boolean {
for (let i = 1; i < days.length; i++) {
if (days[i - 1].date >= days[i].date) return false;
}
return true;
}

function minOrNull(values: number[]): number | null {
return values.length ? Math.min(...values) : null;
}
function maxOrNull(values: number[]): number | null {
return values.length ? Math.max(...values) : null;
}

export async function loadHistoricalRegimeBreadthData(): Promise<HistoricalBreadthDataset> {
const universe = HISTORICAL_BREADTH_UNIVERSE;
const uniqueUniverse = Array.from(new Set(universe));
const duplicateAssetCount = universe.length - uniqueUniverse.length;
console.log(`[HistoricalBreadth] loading ${uniqueUniverse.length} unique assets from ${universe.length} universe entries`);
const fetchedResults = await mapWithConcurrency(
uniqueUniverse, fetchHistoricalPriceSeries, FETCH_CONCURRENCY,
);
const successfulSeries = fetchedResults.filter(
(series): series is HistoricalPriceSeries => series !== null,
);
const failedAssets = uniqueUniverse.length - successfulSeries.length;
console.log(`[HistoricalBreadth] fetched ${successfulSeries.length}/${uniqueUniverse.length} unique assets`);

const emptyDiagnostics = {
requestedAssets: universe.length,
uniqueAssets: uniqueUniverse.length,
duplicateAssetCount,
fetchedAssets: successfulSeries.length,
failedAssets,
minValidAssets: null as number | null,
maxValidAssets: null as number | null,
rawBreadth50AvailableCount: 0,
rawBreadth200AvailableCount: 0,
breadth50AvailableCount: 0,
breadth200AvailableCount: 0,
rawBreadth20AvailableCount: 0,
rawBreadth100AvailableCount: 0,
advanceDeclineAvailableCount: 0,
highLowAvailableCount: 0,
normalizedADLineAvailableCount: 0,
minBreadthCoverageOfUniverse: null as number | null,
maxBreadthCoverageOfUniverse: null as number | null,
minAdvanceDeclineCoverageOfUniverse: null as number | null,
maxAdvanceDeclineCoverageOfUniverse: null as number | null,
minHighLowCoverageOfUniverse: null as number | null,
maxHighLowCoverageOfUniverse: null as number | null,
minAdvanceDeclineEligibleAssets: null as number | null,
maxAdvanceDeclineEligibleAssets: null as number | null,
minHighLowEligibleAssets: null as number | null,
maxHighLowEligibleAssets: null as number | null,
chronological: true,
};
if (successfulSeries.length === 0) {
return {
days: [], count: 0, firstDate: null, lastDate: null,
universeSize: universe.length, uniqueUniverseSize: uniqueUniverse.length,
diagnostics: emptyDiagnostics,
};
}

const rawHistory = buildRawBreadthHistory(successfulSeries);
const internalsHistory = buildResearchInternalsHistory(successfulSeries);
const dates = Array.from(rawHistory.keys()).sort();
const days: HistoricalBreadthDay[] = [];
let smoothedBreadth50: number | null = null;
let smoothedBreadth200: number | null = null;
let cumulativeAD = 0;
let cumulativeNormalizedAD = 0;

for (const date of dates) {
const raw = rawHistory.get(date);
if (!raw || raw.validAssets === 0) continue;
const internals = internalsHistory.get(date);
const rawBreadth50 = raw.above50Count / raw.validAssets;
const rawBreadth200 = raw.above200Count / raw.validAssets;
// Preserve existing operational smoothing exactly.
if (smoothedBreadth200 === null) smoothedBreadth200 = rawBreadth200;
else smoothedBreadth200 = smoothedBreadth200 * 0.5 + rawBreadth200 * 0.5;
if (smoothedBreadth50 === null) smoothedBreadth50 = rawBreadth50;
else smoothedBreadth50 = smoothedBreadth50 * 0.5 + rawBreadth50 * 0.5;

const eligibleAD = internals?.advanceDeclineEligibleAssets ?? 0;
const advances = internals?.advances ?? 0;
const declines = internals?.declines ?? 0;
const unchanged = internals?.unchanged ?? 0;
const advanceDeclineNet = eligibleAD > 0 ? advances - declines : null;
if (advanceDeclineNet !== null) cumulativeAD += advanceDeclineNet;
const advanceDeclineRatio = eligibleAD > 0
? (advances - declines) / eligibleAD
: null;
if (advanceDeclineRatio !== null) {
cumulativeNormalizedAD += advanceDeclineRatio;
}
const eligibleHL = internals?.highLowEligibleAssets ?? 0;
const highs = internals?.newClosingHighs252D ?? 0;
const lows = internals?.newClosingLows252D ?? 0;

days.push({
date,
rawBreadth50, rawBreadth200,
breadth50: smoothedBreadth50, breadth200: smoothedBreadth200,
validAssets: raw.validAssets,
above50Count: raw.above50Count, above200Count: raw.above200Count,
rawBreadth20: raw.above20Count / raw.validAssets,
rawBreadth100: raw.above100Count / raw.validAssets,
above20Count: raw.above20Count, above100Count: raw.above100Count,
advanceDeclineEligibleAssets: eligibleAD,
advances, declines, unchanged,
advanceDeclineNet,
advanceDeclineRatio,
adLine: advanceDeclineNet !== null ? cumulativeAD : null,
normalizedADLine: advanceDeclineRatio !== null ? cumulativeNormalizedAD : null,
breadthCoverageOfUniverse: raw.validAssets / universe.length,
breadthCoverageOfFetched: raw.validAssets / (successfulSeries.length + duplicateAssetCount),
advanceDeclineCoverageOfUniverse: eligibleAD / uniqueUniverse.length,
advanceDeclineCoverageOfFetched: eligibleAD / successfulSeries.length,
highLowCoverageOfUniverse: eligibleHL / uniqueUniverse.length,
highLowCoverageOfFetched: eligibleHL / successfulSeries.length,
highLowEligibleAssets: eligibleHL,
newClosingHighs252D: highs,
newClosingLows252D: lows,
highLowNet252D: eligibleHL > 0 ? highs - lows : null,
});
}

const validAssetCounts = days.map(day => day.validAssets);
const adEligibleCounts = days.filter(day => day.advanceDeclineEligibleAssets > 0)
.map(day => day.advanceDeclineEligibleAssets);
const hlEligibleCounts = days.filter(day => day.highLowEligibleAssets > 0)
.map(day => day.highLowEligibleAssets);
return {
days,
count: days.length,
firstDate: days[0]?.date ?? null,
lastDate: days[days.length - 1]?.date ?? null,
universeSize: universe.length,
uniqueUniverseSize: uniqueUniverse.length,
diagnostics: {
...emptyDiagnostics,
minValidAssets: minOrNull(validAssetCounts),
maxValidAssets: maxOrNull(validAssetCounts),
rawBreadth50AvailableCount: days.filter(day => day.rawBreadth50 !== null).length,
rawBreadth200AvailableCount: days.filter(day => day.rawBreadth200 !== null).length,
breadth50AvailableCount: days.filter(day => day.breadth50 !== null).length,
breadth200AvailableCount: days.filter(day => day.breadth200 !== null).length,
rawBreadth20AvailableCount: days.filter(day => day.rawBreadth20 !== null).length,
rawBreadth100AvailableCount: days.filter(day => day.rawBreadth100 !== null).length,
advanceDeclineAvailableCount: adEligibleCounts.length,
highLowAvailableCount: hlEligibleCounts.length,
normalizedADLineAvailableCount: days.filter(day => day.normalizedADLine !== null).length,
minBreadthCoverageOfUniverse: minOrNull(days.map(day => day.breadthCoverageOfUniverse)),
maxBreadthCoverageOfUniverse: maxOrNull(days.map(day => day.breadthCoverageOfUniverse)),
minAdvanceDeclineCoverageOfUniverse: minOrNull(days.map(day => day.advanceDeclineCoverageOfUniverse)),
maxAdvanceDeclineCoverageOfUniverse: maxOrNull(days.map(day => day.advanceDeclineCoverageOfUniverse)),
minHighLowCoverageOfUniverse: minOrNull(days.map(day => day.highLowCoverageOfUniverse)),
maxHighLowCoverageOfUniverse: maxOrNull(days.map(day => day.highLowCoverageOfUniverse)),
minAdvanceDeclineEligibleAssets: minOrNull(adEligibleCounts),
maxAdvanceDeclineEligibleAssets: maxOrNull(adEligibleCounts),
minHighLowEligibleAssets: minOrNull(hlEligibleCounts),
maxHighLowEligibleAssets: maxOrNull(hlEligibleCounts),
chronological: isChronological(days),
},
};
}

