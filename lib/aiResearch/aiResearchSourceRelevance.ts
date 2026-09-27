// lib/aiResearch/aiResearchSourceRelevance.ts

import type {
AIResearchSource,
AIResearchTask,
} from "./aiResearchTypes";


/* =====================================================
TYPES
===================================================== */

interface ScoredResearchSource {
source: AIResearchSource;
score: number;
}


/* =====================================================
NORMALIZATION
===================================================== */

function clamp(
value: number,
min = 0,
max = 100
): number {
return Math.max(
min,
Math.min(max, value)
);
}


function normalizeText(
value: string | undefined
): string {
return (value ?? "")
.toLowerCase()
.replace(/\s+/g, " ")
.trim();
}


function sourceText(
source: AIResearchSource
): string {
return normalizeText(
[
source.title,
source.summary,
source.publisher,
]
.filter(Boolean)
.join(" ")
);
}


/* =====================================================
SOURCE QUALITY
===================================================== */

/*
* Source quality answers:
*
* "How trustworthy / authoritative is this publisher?"
*
* It does NOT answer:
*
* "How important is this document for the
* current market regime?"
*
* That distinction is intentional.
*/

function sourceQuality(
source: AIResearchSource
): number {

const publisher =
normalizeText(source.publisher);

const url =
normalizeText(source.url);

const text =
sourceText(source);


/* ---------------------------------------------------
PRIMARY OFFICIAL SOURCES
--------------------------------------------------- */

if (
publisher.includes("federal reserve") ||
url.includes("federalreserve.gov")
) {
return 100;
}

if (
publisher.includes("ecb") ||
url.includes("ecb.europa.eu")
) {
return 100;
}

if (
publisher.includes("nasdaq") ||
url.includes("nasdaq.com")
) {
return 100;
}


/* ---------------------------------------------------
HIGH QUALITY FINANCIAL SOURCES
--------------------------------------------------- */

const highQualityPublishers = [
"reuters",
"bloomberg",
"financial times",
"ft.com",
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
"factset",
];

if (
highQualityPublishers.some(
(name) =>
publisher.includes(name) ||
url.includes(name.replace(/\s+/g, ""))
)
) {
return 94;
}


/* ---------------------------------------------------
ESTABLISHED SECONDARY SOURCES
--------------------------------------------------- */

const establishedSecondary = [
"tradingview",
"benzinga",
"t iprankings",
"tipranks",
"motley fool",
"seeking alpha",
"investors business daily",
"investing",
"fortune",
"yahoo finance",
"marketbeat",
];

if (
establishedSecondary.some(
(name) =>
publisher.includes(name) ||
url.includes(name.replace(/\s+/g, ""))
)
) {
return 82;
}


/* ---------------------------------------------------
GOOGLE NEWS AGGREGATOR
--------------------------------------------------- */

if (
url.includes("news.google.com") ||
publisher.includes("google news")
) {
return 60;
}


/* ---------------------------------------------------
DEFAULT
--------------------------------------------------- */

/*
* Unknown source:
*
* trustworthy enough to inspect,
* but not allowed to dominate the ranking.
*/

if (text.length > 0) {
return 50;
}

return 35;
}


/* =====================================================
TOPIC RELEVANCE
===================================================== */

/*
* Topic relevance answers:
*
* "Does this source discuss something connected
* to the requested research task?"
*/

function keywordScore(
text: string,
keywords: string[]
): number {

if (!text) {
return 0;
}

let matches = 0;

for (const keyword of keywords) {
if (text.includes(keyword)) {
matches += 1;
}
}

if (matches === 0) {
return 0;
}

/*
* First matches are highly informative.
* Additional matches have diminishing value.
*/

return clamp(
30 +
Math.min(matches, 5) * 12
);
}


function topicRelevance(
source: AIResearchSource,
task: AIResearchTask
): number {

const text =
sourceText(source);

let keywords: string[] = [];


switch (task) {

case "DAILY_MARKET_REVIEW":

keywords = [
"market",
"stock market",
"equity",
"stocks",
"nasdaq",
"russell",
"s&p 500",
"sp500",
"dow",
"volatility",
"vix",
"rates",
"yield",
"fed",
"federal reserve",
"ecb",
"liquidity",
"breadth",
"rotation",
];

break;


case "REGIME_REVIEW":

keywords = [
"regime",
"risk",
"risk-off",
"risk on",
"market breadth",
"participation",
"liquidity",
"volatility",
"vix",
"yield",
"rates",
"fed",
"federal reserve",
"recession",
"growth",
"inflation",
"equity market",
"nasdaq",
"russell",
];

break;


case "ROTATION_REVIEW":

keywords = [
"nasdaq",
"nasdaq 100",
"qqq",
"russell",
"russell 2000",
"rut",
"iwm",
"small cap",
"small-cap",
"large cap",
"technology",
"tech stocks",
"rotation",
"breadth",
"leadership",
"relative strength",
];

break;


case "CRASH_RISK_REVIEW":

keywords = [
"crash",
"selloff",
"sell-off",
"market decline",
"market drop",
"volatility",
"vix",
"options",
"liquidity",
"credit",
"yield",
"treasury",
"financial conditions",
"breadth",
"recession",
"systemic risk",
"risk-off",
];

break;


case "TRADE_SETUP_REVIEW":

keywords = [
"nasdaq",
"nasdaq 100",
"qqq",
"russell",
"russell 2000",
"rut",
"iwm",
"technology",
"small cap",
"volatility",
"vix",
"momentum",
"rotation",
"breadth",
"market structure",
];

break;


case "ANOMALY_REVIEW":

keywords = [
"unusual",
"divergence",
"anomaly",
"breadth",
"volatility",
"vix",
"rotation",
"liquidity",
"market structure",
"relative strength",
"nasdaq",
"russell",
];

break;


case "FORWARD_TEST_REVIEW":

keywords = [
"market",
"nasdaq",
"russell",
"s&p 500",
"volatility",
"breadth",
"rotation",
"liquidity",
"rates",
"yield",
"fed",
"economic growth",
];

break;

}


return keywordScore(
text,
keywords
);
}


/* =====================================================
MARKET IMPACT RELEVANCE
===================================================== */

/*
* IMPORTANT:
*
* This is deliberately separate from source quality.
*
* Example:
*
* Nasdaq conference announcement
* -> Source Quality = 100
* -> Market Impact = potentially low
*
* FOMC rate decision
* -> Source Quality = 100
* -> Market Impact = very high
*
* ECB technical settlement publication
* -> Source Quality = 100
* -> Market Impact = low unless the document
* contains a material policy/liquidity change.
*/

function marketImpactRelevance(
source: AIResearchSource,
task: AIResearchTask
): number {

const text =
sourceText(source);

let score = 50;


/* ===================================================
VERY HIGH MARKET IMPACT
=================================================== */

const veryHighImpactKeywords = [
"fomc",
"federal funds rate",
"interest rate decision",
"rate decision",
"rate hike",
"rate cut",
"interest rate",
"monetary policy",
"fed statement",
"economic projections",
"dot plot",
"inflation",
"cpi",
"ppi",
"nonfarm payroll",
"non-farm payroll",
"employment report",
"unemployment",
"jobs report",
"gdp",
"gross domestic product",
"recession",
"treasury yield",
"10-year yield",
"financial conditions",
"credit conditions",
];

const veryHighMatches =
veryHighImpactKeywords.filter(
(keyword) =>
text.includes(keyword)
).length;

if (veryHighMatches > 0) {
score += Math.min(
40,
veryHighMatches * 12
);
}


/* ===================================================
NASDAQ / LARGE CAP IMPACT
=================================================== */

const nasdaqMarketKeywords = [
"nasdaq",
"nasdaq 100",
"ndx",
"qqq",
"technology stocks",
"tech stocks",
"mega cap",
"large cap",
"apple",
"microsoft",
"amazon",
"alphabet",
"meta",
"nvidia",
];

const nasdaqMatches =
nasdaqMarketKeywords.filter(
(keyword) =>
text.includes(keyword)
).length;

if (nasdaqMatches > 0) {
score += Math.min(
20,
nasdaqMatches * 5
);
}


/* ===================================================
RUSSELL / SMALL CAP IMPACT
=================================================== */

const russellKeywords = [
"russell 2000",
"russell",
"rut",
"iwm",
"small cap",
"small-cap",
"small caps",
"small-cap stocks",
"small business stocks",
];

const russellMatches =
russellKeywords.filter(
(keyword) =>
text.includes(keyword)
).length;

if (russellMatches > 0) {
score += Math.min(
20,
russellMatches * 6
);
}


/* ===================================================
SEMICONDUCTOR / AI IMPACT
=================================================== */

const semiconductorKeywords = [
"semiconductor",
"semiconductors",
"chip stocks",
"chips",
"nvidia",
"amd",
"broadcom",
"ai stocks",
"artificial intelligence",
"generative ai",
"ai boom",
];

const semiconductorMatches =
semiconductorKeywords.filter(
(keyword) =>
text.includes(keyword)
).length;

if (semiconductorMatches > 0) {
score += Math.min(
20,
semiconductorMatches * 5
);
}


/* ===================================================
VOLATILITY / MARKET STRUCTURE
=================================================== */

const volatilityKeywords = [
"vix",
"volatility",
"implied volatility",
"options market",
"options market volatility",
"market breadth",
"breadth",
"advance decline",
"market internals",
"rotation",
"relative strength",
"liquidity stress",
"liquidity tightening",
];

const volatilityMatches =
volatilityKeywords.filter(
(keyword) =>
text.includes(keyword)
).length;

if (volatilityMatches > 0) {
score += Math.min(
25,
volatilityMatches * 6
);
}


/* ===================================================
GEOPOLITICAL MARKET IMPACT
=================================================== */

const geopoliticalKeywords = [
"tariff",
"trade war",
"sanctions",
"oil price",
"crude oil",
"energy shock",
"middle east",
"ukraine",
"russia",
"china",
"taiwan",
"geopolitical risk",
];

const geopoliticalMatches =
geopoliticalKeywords.filter(
(keyword) =>
text.includes(keyword)
).length;

if (geopoliticalMatches > 0) {
score += Math.min(
20,
geopoliticalMatches * 5
);
}


/* ===================================================
LOW-IMPACT DOCUMENT TYPES
=================================================== */

const lowImpactKeywords = [
"conference presentation",
"conference presentations",
"investor conference",
"conference remarks",
"fireside chat",
"executive conference",
"conference participation",
"delisting",
"delist",
"listing compliance",
"compliance notice",
"administrative notice",
"technical publication",
"technical documentation",
"settlement publication",
"settlement calendar",
"settlement date",
"reference rates",
"fx reference rates",
"operational procedures",
"operational framework",
"liquidity management publication",
"liquidity management",
"public comment",
"enforcement",
"regulatory notice",
];

const lowImpactMatches =
lowImpactKeywords.filter(
(keyword) =>
text.includes(keyword)
).length;

if (lowImpactMatches > 0) {
score -= Math.min(
35,
lowImpactMatches * 12
);
}


/* ===================================================
STRONG DOCUMENT-SPECIFIC DEMOTION
=================================================== */

/*
* Official source alone must never rescue a document
* whose actual content has little market relevance.
*/

const isNasdaq =
normalizeText(source.publisher)
.includes("nasdaq") ||
normalizeText(source.url)
.includes("nasdaq.com");

const isECB =
normalizeText(source.publisher)
.includes("ecb") ||
normalizeText(source.url)
.includes("ecb.europa.eu");

const hasHighImpactContent =
veryHighMatches > 0 ||
volatilityMatches > 0 ||
nasdaqMatches > 0 ||
russellMatches > 0 ||
semiconductorMatches > 0 ||
geopoliticalMatches > 0;


if (
isNasdaq &&
lowImpactMatches > 0 &&
!hasHighImpactContent
) {
score -= 25;
}


if (
isECB &&
lowImpactMatches > 0 &&
!hasHighImpactContent
) {
score -= 25;
}


/* ===================================================
TASK-SPECIFIC MARKET IMPACT
=================================================== */

if (
task === "ROTATION_REVIEW"
) {

if (
nasdaqMatches > 0 &&
russellMatches > 0
) {
score += 15;
}

if (
text.includes("rotation") ||
text.includes("relative strength")
) {
score += 12;
}
}


if (
task === "CRASH_RISK_REVIEW"
) {

if (
text.includes("vix") ||
text.includes("volatility") ||
text.includes("liquidity stress") ||
text.includes("financial conditions")
) {
score += 15;
}
}


if (
task === "REGIME_REVIEW"
) {

if (
text.includes("monetary policy") ||
text.includes("interest rate") ||
text.includes("inflation") ||
text.includes("financial conditions")
) {
score += 15;
}
}


return clamp(
score
);
}


/* =====================================================
RECENCY
===================================================== */

function recencyScore(
source: AIResearchSource
): number {

if (!source.publishedAt) {
return 35;
}

const timestamp =
new Date(
source.publishedAt
).getTime();

if (
!Number.isFinite(timestamp)
) {
return 35;
}

const ageHours =
(
Date.now() -
timestamp
) /
(
1000 *
60 *
60
);


if (ageHours <= 24) {
return 100;
}

if (ageHours <= 48) {
return 94;
}

if (ageHours <= 72) {
return 88;
}

if (ageHours <= 120) {
return 80;
}

if (ageHours <= 168) {
return 72;
}

if (ageHours <= 336) {
return 55;
}

return 35;
}


/* =====================================================
NOISE PENALTY
===================================================== */

function noisePenalty(
source: AIResearchSource
): number {

const text =
sourceText(source);

const noiseKeywords = [
"t2",
"t+2",
"t2s",
"settlement",
"settlement date",
"options chain",
"strike price",
"expiration date",
"open interest",
"option chain",
"delisting",
"delisted",
"listing compliance",
"enforcement",
"public comment",
"administrative notice",
"technical documentation",
"reference rates",
"conference presentation",
"conference event",
"stock to buy",
"stocks to buy",
"undervalued stock",
"top stocks",
"best stocks",
"price target",
"buy now",
"promotional",
];

let penalty = 0;

for (const keyword of noiseKeywords) {

if (
text.includes(keyword)
) {

penalty += 7;

}

}

return clamp(
penalty,
0,
40
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

const url =
normalizeText(
source.url
);


if (
publisher.includes("reuters") ||
publisher.includes("bloomberg") ||
publisher.includes("financial times") ||
publisher.includes("wall street journal") ||
publisher.includes("cnbc")
) {
return 4;
}


if (
publisher.includes("federal reserve") ||
url.includes("federalreserve.gov") ||
publisher.includes("ecb") ||
url.includes("ecb.europa.eu")
) {
return 4;
}


if (
publisher.includes("nasdaq") ||
url.includes("nasdaq.com")
) {
return 2;
}


if (
url.includes("news.google.com") ||
publisher.includes("google news")
) {
return -3;
}


return 0;
}


/* =====================================================
FINAL RELEVANCE
===================================================== */

/*
* Final pipeline:
*
* Source Quality
* ↓
* Topic Relevance
* ↓
* Market Impact Relevance
* ↓
* Recency
* ↓
* Noise
* ↓
* Final Relevance
*
* Source quality is therefore no longer capable of
* dominating the ranking by itself.
*/

function calculateRelevance(
source: AIResearchSource,
task: AIResearchTask
): number {

const quality =
sourceQuality(source);

const topic =
topicRelevance(
source,
task
);

const impact =
marketImpactRelevance(
source,
task
);

const recency =
recencyScore(source);

const noise =
noisePenalty(source);

const publisher =
publisherAdjustment(source);


/*
* Existing core weighting:
*
* 35% quality
* 40% topic
* 25% recency
*
* Market impact is inserted as a modifier to
* topic relevance rather than replacing the
* established architecture.
*/

const adjustedTopic =
clamp(
topic * 0.65 +
impact * 0.35
);


let score =
quality * 0.35 +
adjustedTopic * 0.40 +
recency * 0.25;


score +=
publisher;


score -=
noise * 0.75;


/*
* Weak / aggregator sources must not dominate.
*/

if (
quality < 60
) {

score =
Math.min(
score,
74
);

}


/*
* Google News sources receive an additional cap
* unless the actual article has strong market impact.
*/

const isGoogleNews =
normalizeText(source.url)
.includes("news.google.com");

if (
isGoogleNews
) {

if (
impact < 75
) {

score =
Math.min(
score,
72
);

} else {

score =
Math.min(
score,
82
);

}

}


/*
* Official-source documents with weak market
* impact must not automatically occupy the top
* of the ranking.
*/

const isOfficial =
quality >= 100;

if (
isOfficial &&
impact < 45
) {

score =
Math.min(
score,
68
);

}


/*
* Very high market-impact documents can still
* rank strongly even when the publisher is
* an aggregator.
*/

if (
impact >= 90 &&
topic >= 60
) {

score += 5;

}


return Math.round(
clamp(
score
)
);
}


/* =====================================================
PUBLIC API
===================================================== */

export function scoreResearchSource(
source: AIResearchSource,
task: AIResearchTask
): number {

return calculateRelevance(
source,
task
);
}


/* =====================================================
SORT
===================================================== */

export function rankResearchSources(
sources: AIResearchSource[],
task: AIResearchTask
): AIResearchSource[] {

const scored: ScoredResearchSource[] =
sources.map(
(source) => ({
source,
score:
calculateRelevance(
source,
task
),
})
);


scored.sort(
(a, b) => {

if (
b.score !== a.score
) {

return (
b.score -
a.score
);

}


const dateA =
a.source.publishedAt
? new Date(
a.source.publishedAt
).getTime()
: 0;

const dateB =
b.source.publishedAt
? new Date(
b.source.publishedAt
).getTime()
: 0;


return (
dateB -
dateA
);

}
);


return scored.map(
(item) => {

return {
...item.source,
relevance:
item.score,
};

}
);
}


/* =====================================================
TOP SOURCES
===================================================== */

export function selectTopResearchSources(
sources: AIResearchSource[],
task: AIResearchTask,
limit = 12
): AIResearchSource[] {

const ranked =
rankResearchSources(
sources,
task
);


return ranked.slice(
0,
Math.max(
0,
limit
)
);
}
