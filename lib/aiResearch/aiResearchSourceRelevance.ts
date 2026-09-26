import type {
AIResearchSource,
AIResearchTask,
} from "./aiResearchTypes";

export interface RankResearchSourcesResult {
sources: AIResearchSource[];
diagnostics: {
inputCount: number;
outputCount: number;
};
}

const MIN_RELEVANCE = 0;
const MAX_RELEVANCE = 100;

/* =====================================================
TEXT NORMALIZATION
===================================================== */

function normalizeText(value: unknown): string {
if (typeof value !== "string") {
return "";
}

return value
.toLowerCase()
.normalize("NFKD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/\s+/g, " ")
.trim();
}

function sourceText(
source: AIResearchSource
): string {
return normalizeText(
[
source.title,
source.publisher,
source.summary,
]
.filter(Boolean)
.join(" ")
);
}

function containsAny(
text: string,
keywords: string[]
): boolean {
return keywords.some(
(keyword) =>
text.includes(
normalizeText(keyword)
)
);
}

function countMatches(
text: string,
keywords: string[]
): number {
return keywords.filter(
(keyword) =>
text.includes(
normalizeText(keyword)
)
).length;
}

function clamp(
value: number,
min = MIN_RELEVANCE,
max = MAX_RELEVANCE
): number {
return Math.max(
min,
Math.min(
max,
Math.round(value)
)
);
}

/* =====================================================
KEYWORD GROUPS
===================================================== */

const VERY_HIGH_IMPACT_KEYWORDS = [
"fomc",
"federal open market committee",
"fed funds",
"federal funds rate",
"interest rate decision",
"rate decision",
"monetary policy",
"powell",
"press conference",
"economic projections",
"dot plot",
];

const MACRO_KEYWORDS = [
"inflation",
"cpi",
"core cpi",
"pce",
"core pce",
"ppi",
"payroll",
"nonfarm payroll",
"employment",
"unemployment",
"jobless claims",
"gdp",
"retail sales",
"consumer confidence",
"ism",
"manufacturing",
"services",
];

const NASDAQ_KEYWORDS = [
"nasdaq",
"nasdaq 100",
"ndx",
"qqq",
"mega cap",
"megacap",
"technology stocks",
"tech stocks",
];

const RUSSELL_KEYWORDS = [
"russell",
"russell 2000",
"rut",
"iwm",
"small cap",
"small-cap",
"small caps",
];

const SEMICONDUCTOR_KEYWORDS = [
"semiconductor",
"semiconductors",
"chip stocks",
"chipmaker",
"chipmakers",
"nvidia",
"amd",
"intel",
"micron",
"sox",
"philadelphia semiconductor",
];

const AI_KEYWORDS = [
"artificial intelligence",
"ai stocks",
"ai spending",
"ai demand",
"ai infrastructure",
"generative ai",
];

const VOLATILITY_KEYWORDS = [
"vix",
"volatility",
"implied volatility",
"fear index",
"options volatility",
"volatility index",
];

const MARKET_STRUCTURE_KEYWORDS = [
"breadth",
"market breadth",
"participation",
"advance decline",
"advancers",
"decliners",
"leadership",
"rotation",
"market structure",
"risk appetite",
"risk-on",
"risk off",
"risk-off",
];

const LIQUIDITY_KEYWORDS = [
"liquidity",
"financial conditions",
"credit conditions",
"funding conditions",
"bond market",
"treasury yields",
"treasury yield",
"yield curve",
];

const GEOPOLITICAL_KEYWORDS = [
"geopolitical",
"geopolitics",
"iran",
"israel",
"middle east",
"china",
"taiwan",
"russia",
"ukraine",
"trade war",
"tariff",
];

/* =====================================================
LOW DIRECT RELEVANCE / NOISE
===================================================== */

const LOW_DIRECT_RELEVANCE_KEYWORDS = [
"t2",
"t2s",
"settlement",
"operating normally",
"is closed",
"pilot is closed",
"eligible marketable assets",
"list of monetary financial institutions",
"enforcement action",
"approval of application",
"public comment",
"application to establish",
];

const PROMOTIONAL_KEYWORDS = [
"undervalued stock",
"undervalued stocks",
"stock to buy",
"stocks to buy",
"best stocks",
"top stocks",
"stock picks",
"buy now",
"must buy",
"hidden gem",
"soaring stock",
"super semiconductor etf",
];

const OPTIONS_NOISE_KEYWORDS = [
"options chain",
"option chain",
"strike price",
"call option",
"put option",
"expiration",
"open interest",
"moomoo",
];

/* =====================================================
SOURCE QUALITY
===================================================== */

/*
* Source quality is deliberately independent from
* topical relevance.
*
* A perfectly relevant article from a weak source should
* not automatically outrank a slightly less targeted
* article from a highly reliable source.
*/

function sourceQuality(
source: AIResearchSource
): number {
const publisher =
normalizeText(
source.publisher
);

const title =
normalizeText(
source.title
);

/*
* Official primary sources.
*/

if (
publisher.includes(
"federal reserve"
) ||
publisher.includes(
"federal reserve board"
) ||
publisher.includes(
"european central bank"
) ||
publisher === "nasdaq"
) {
return 100;
}

/*
* High-quality financial / market
* research publishers.
*/

const highQualityPublishers = [
"reuters",
"bloomberg",
"financial times",
"wall street journal",
"wsj",
"associated press",
"ap news",
"cnbc",
"marketwatch",
"morningstar",
"barron's",
"barrons",
"investing.com",
"s&p global",
"sp global",
"factset",
];

if (
highQualityPublishers.some(
(name) =>
publisher.includes(name)
)
) {
return 88;
}

/*
* Established but secondary financial
* publishers.
*/

const establishedFinancialPublishers = [
"tradingview",
"benzinga",
"tipranks",
"motley fool",
"seeking alpha",
"investor's business daily",
"investors business daily",
"fortune",
"yahoo finance",
"marketbeat",
"nasdaq",
];

if (
establishedFinancialPublishers.some(
(name) =>
publisher.includes(name)
)
) {
return 72;
}

/*
* Google News is an aggregator, not
* the original publisher.
*
* Therefore its quality is deliberately
* capped below established publishers.
*/

if (
publisher.includes(
"google news"
)
) {
/*
* Try to recover some quality information
* from the title/summary.
*
* This does NOT make Google News itself
* a primary source.
*/

if (
containsAny(
title,
VERY_HIGH_IMPACT_KEYWORDS
)
) {
return 68;
}

if (
containsAny(
title,
[
...NASDAQ_KEYWORDS,
...RUSSELL_KEYWORDS,
...SEMICONDUCTOR_KEYWORDS,
...VOLATILITY_KEYWORDS,
]
)
) {
return 62;
}

return 55;
}

/*
* Unknown / other publishers.
*/

return 45;
}

/* =====================================================
TASK BASELINE
===================================================== */

function taskBaseline(
task: AIResearchTask
): number {
switch (task) {
case "DAILY_MARKET_REVIEW":
return 35;

case "REGIME_REVIEW":
return 32;

case "ROTATION_REVIEW":
return 32;

case "CRASH_RISK_REVIEW":
return 32;

case "TRADE_SETUP_REVIEW":
return 28;

case "ANOMALY_REVIEW":
return 28;

case "FORWARD_TEST_REVIEW":
return 28;

default:
return 30;
}
}

/* =====================================================
TOPIC RELEVANCE
===================================================== */

/*
* Topic relevance is capped.
*
* This is important:
*
* Ten matching keywords must NOT be able to turn
* a low-quality article into a perfect 100-point source.
*/

function topicRelevance(
text: string,
task: AIResearchTask
): number {
let score = 0;

let groupsMatched = 0;

if (
containsAny(
text,
VERY_HIGH_IMPACT_KEYWORDS
)
) {
score += 20;
groupsMatched += 1;
}

if (
containsAny(
text,
MACRO_KEYWORDS
)
) {
score += 15;
groupsMatched += 1;
}

if (
containsAny(
text,
NASDAQ_KEYWORDS
)
) {
score += 15;
groupsMatched += 1;
}

if (
containsAny(
text,
RUSSELL_KEYWORDS
)
) {
score += 15;
groupsMatched += 1;
}

if (
containsAny(
text,
SEMICONDUCTOR_KEYWORDS
)
) {
score += 15;
groupsMatched += 1;
}

if (
containsAny(
text,
AI_KEYWORDS
)
) {
score += 12;
groupsMatched += 1;
}

if (
containsAny(
text,
VOLATILITY_KEYWORDS
)
) {
score += 15;
groupsMatched += 1;
}

if (
containsAny(
text,
MARKET_STRUCTURE_KEYWORDS
)
) {
score += 12;
groupsMatched += 1;
}

if (
containsAny(
text,
LIQUIDITY_KEYWORDS
)
) {
score += 10;
groupsMatched += 1;
}

if (
containsAny(
text,
GEOPOLITICAL_KEYWORDS
)
) {
score += 8;
groupsMatched += 1;
}

/*
* Task-specific emphasis.
*/

switch (task) {
case "DAILY_MARKET_REVIEW":

if (
containsAny(
text,
NASDAQ_KEYWORDS
)
) {
score += 8;
}

if (
containsAny(
text,
RUSSELL_KEYWORDS
)
) {
score += 8;
}

if (
containsAny(
text,
MARKET_STRUCTURE_KEYWORDS
)
) {
score += 8;
}

break;

case "REGIME_REVIEW":

if (
containsAny(
text,
VERY_HIGH_IMPACT_KEYWORDS
)
) {
score += 12;
}

if (
containsAny(
text,
MACRO_KEYWORDS
)
) {
score += 10;
}

if (
containsAny(
text,
LIQUIDITY_KEYWORDS
)
) {
score += 8;
}

break;

case "ROTATION_REVIEW":

if (
containsAny(
text,
NASDAQ_KEYWORDS
)
) {
score += 12;
}

if (
containsAny(
text,
RUSSELL_KEYWORDS
)
) {
score += 12;
}

if (
containsAny(
text,
MARKET_STRUCTURE_KEYWORDS
)
) {
score += 10;
}

break;

case "CRASH_RISK_REVIEW":

if (
containsAny(
text,
VOLATILITY_KEYWORDS
)
) {
score += 12;
}

if (
containsAny(
text,
MACRO_KEYWORDS
)
) {
score += 10;
}

if (
containsAny(
text,
LIQUIDITY_KEYWORDS
)
) {
score += 8;
}

break;

case "TRADE_SETUP_REVIEW":

if (
containsAny(
text,
NASDAQ_KEYWORDS
)
) {
score += 10;
}

if (
containsAny(
text,
RUSSELL_KEYWORDS
)
) {
score += 10;
}

if (
containsAny(
text,
VOLATILITY_KEYWORDS
)
) {
score += 8;
}

break;

case "ANOMALY_REVIEW":

if (
containsAny(
text,
MARKET_STRUCTURE_KEYWORDS
)
) {
score += 10;
}

if (
containsAny(
text,
VOLATILITY_KEYWORDS
)
) {
score += 8;
}

break;

case "FORWARD_TEST_REVIEW":

if (
containsAny(
text,
MACRO_KEYWORDS
)
) {
score += 10;
}

if (
containsAny(
text,
NASDAQ_KEYWORDS
)
) {
score += 8;
}

if (
containsAny(
text,
RUSSELL_KEYWORDS
)
) {
score += 8;
}

break;
}

/*
* Prevent keyword density from dominating.
*/

const keywordDensityBonus =
Math.min(
groupsMatched * 2,
12
);

score +=
keywordDensityBonus;

return Math.min(
score,
65
);
}

/* =====================================================
RECENCY
===================================================== */

function recencyScore(
source: AIResearchSource
): number {
if (
!source.publishedAt
) {
return 20;
}

const timestamp =
Date.parse(
source.publishedAt
);

if (
!Number.isFinite(
timestamp
)
) {
return 20;
}

const ageHours =
Math.max(
0,
(
Date.now() -
timestamp
) /
(1000 * 60 * 60)
);

if (
ageHours <= 6
) {
return 100;
}

if (
ageHours <= 24
) {
return 92;
}

if (
ageHours <= 72
) {
return 80;
}

if (
ageHours <= 168
) {
return 65;
}

if (
ageHours <= 336
) {
return 50;
}

return 30;
}

/* =====================================================
NOISE PENALTY
===================================================== */

function noisePenalty(
text: string
): number {
let penalty = 0;

if (
containsAny(
text,
LOW_DIRECT_RELEVANCE_KEYWORDS
)
) {
penalty += 18;
}

if (
containsAny(
text,
OPTIONS_NOISE_KEYWORDS
)
) {
penalty += 20;
}

if (
containsAny(
text,
PROMOTIONAL_KEYWORDS
)
) {
penalty += 12;
}

return Math.min(
penalty,
35
);
}

/* =====================================================
PUBLISHER ADJUSTMENT
===================================================== */

function publisherAdjustment(
source: AIResearchSource
): number {
const publisher =
normalizeText(
source.publisher
);

/*
* Primary sources receive a small bonus.
*
* This is intentionally NOT huge because
* source quality is already part of the score.
*/

if (
publisher.includes(
"federal reserve"
) ||
publisher.includes(
"european central bank"
) ||
publisher === "nasdaq"
) {
return 8;
}

if (
publisher.includes(
"reuters"
) ||
publisher.includes(
"bloomberg"
) ||
publisher.includes(
"financial times"
) ||
publisher.includes(
"wall street journal"
) ||
publisher.includes(
"cnbc"
) ||
publisher.includes(
"associated press"
) ||
publisher.includes(
"morningstar"
)
) {
return 5;
}

if (
publisher.includes(
"google news"
)
) {
return 0;
}

return 2;
}

/* =====================================================
FINAL RELEVANCE SCORE
===================================================== */

/*
* The final score intentionally combines:
*
* 35% source quality
* 40% topic/task relevance
* 25% recency
*
* Noise is then deducted.
*
* This makes it difficult for a weak article with many
* matching keywords to outrank a strong market source.
*/

export function scoreResearchSourceRelevance(
source: AIResearchSource,
task: AIResearchTask
): number {
const text =
sourceText(source);

const quality =
sourceQuality(source);

const topic =
topicRelevance(
text,
task
);

const recency =
recencyScore(
source
);

const penalty =
noisePenalty(
text
);

const publisherBonus =
publisherAdjustment(
source
);

const baseline =
taskBaseline(
task
);

/*
* Topic relevance is normalized around
* the task baseline rather than added
* directly as an unrestricted value.
*/

const normalizedTopic =
clamp(
baseline +
topic
);

let score =
quality * 0.35 +
normalizedTopic * 0.40 +
recency * 0.25 +
publisherBonus -
penalty;

/*
* Very low-quality sources should never
* receive an extreme score merely because
* of keyword overlap.
*/

if (
quality <= 45
) {
score =
Math.min(
score,
65
);
}

/*
* Google News aggregator entries are capped.
*
* The actual publisher remains visible in
* the article title/summary, but Google News
* itself is not considered a primary source.
*/

if (
normalizeText(
source.publisher
).includes(
"google news"
)
) {
score =
Math.min(
score,
88
);
}

return clamp(
score
);
}

/* =====================================================
RANK
===================================================== */

export function rankResearchSources(
sources: AIResearchSource[],
task: AIResearchTask
): RankResearchSourcesResult {
const ranked =
sources.map(
(source) => ({
...source,
relevance:
scoreResearchSourceRelevance(
source,
task
),
})
);

ranked.sort(
(a, b) => {
const relevanceDifference =
(
b.relevance ?? 0
) -
(
a.relevance ?? 0
);

if (
relevanceDifference !== 0
) {
return relevanceDifference;
}

const dateA =
a.publishedAt
? Date.parse(
a.publishedAt
)
: 0;

const dateB =
b.publishedAt
? Date.parse(
b.publishedAt
)
: 0;

return (
dateB -
dateA
);
}
);

return {
sources: ranked,

diagnostics: {
inputCount:
sources.length,

outputCount:
ranked.length,
},
};
}

/* =====================================================
TOP SOURCES
===================================================== */

export function selectTopResearchSources(
sources: AIResearchSource[],
task: AIResearchTask,
limit = 12
): AIResearchSource[] {
const safeLimit =
Math.max(
1,
Math.min(
50,
Math.round(
limit
)
)
);

const ranked =
rankResearchSources(
sources,
task
);

return ranked.sources.slice(
0,
safeLimit
);
}
