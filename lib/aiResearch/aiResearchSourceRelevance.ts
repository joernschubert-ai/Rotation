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
.replace(/<[^>]*>/g, " ")
.replace(/&nbsp;/g, " ")
.replace(/&amp;/g, "&")
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


function normalizedTitle(
source: AIResearchSource
): string {
return normalizeText(
source.title
)
.replace(/[®™©]/g, "")
.replace(/[^\p{L}\p{N}\s-]/gu, " ")
.replace(/\s+/g, " ")
.trim();
}


/* =====================================================
SOURCE CLASSIFICATION
===================================================== */

function isFederalReserveSource(
source: AIResearchSource
): boolean {

const publisher =
normalizeText(
source.publisher
);

const url =
normalizeText(
source.url
);

return (
publisher.includes("federal reserve") ||
url.includes("federalreserve.gov")
);
}


function isECBSource(
source: AIResearchSource
): boolean {

const publisher =
normalizeText(
source.publisher
);

const url =
normalizeText(
source.url
);

return (
publisher.includes("ecb") ||
publisher.includes(
"european central bank"
) ||
url.includes("ecb.europa.eu")
);
}


function isNasdaqSource(
source: AIResearchSource
): boolean {

const publisher =
normalizeText(
source.publisher
);

const url =
normalizeText(
source.url
);

return (
publisher.includes("nasdaq") ||
url.includes("nasdaq.com")
);
}


function isGoogleNewsSource(
source: AIResearchSource
): boolean {

const publisher =
normalizeText(
source.publisher
);

const url =
normalizeText(
source.url
);

return (
publisher.includes(
"google news"
) ||
url.includes(
"news.google.com"
)
);
}


/* =====================================================
SOURCE QUALITY
===================================================== */

/*
* IMPORTANT:
*
* Source quality measures credibility / authority.
*
* It does NOT measure market relevance.
*
* An official Fed or ECB administrative publication
* may therefore receive quality 100 while still
* receiving a low final relevance score.
*/

function sourceQuality(
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

const text =
sourceText(
source
);


/* ---------------------------------------------------
PRIMARY OFFICIAL SOURCES
--------------------------------------------------- */

if (
isFederalReserveSource(source) ||
isECBSource(source)
) {
return 100;
}


if (
isNasdaqSource(source)
) {
return 98;
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
"s&p global",
"factset",
];


if (
highQualityPublishers.some(
(name) =>
publisher.includes(name) ||
url.includes(
name.replace(
/\s+/g,
""
)
)
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
"tipranks",
"motley fool",
"seeking alpha",
"investors business daily",
"investing.com",
"fortune",
"yahoo finance",
"marketbeat",
];


if (
establishedSecondary.some(
(name) =>
publisher.includes(name) ||
url.includes(
name.replace(
/\s+/g,
""
)
)
)
) {
return 82;
}


/* ---------------------------------------------------
GOOGLE NEWS AGGREGATOR
--------------------------------------------------- */

if (
isGoogleNewsSource(
source
)
) {
return 60;
}


/* ---------------------------------------------------
DEFAULT
--------------------------------------------------- */

if (
text.length > 0
) {
return 50;
}


return 35;
}


/* =====================================================
KEYWORD HELPERS
===================================================== */

function countKeywordMatches(
text: string,
keywords: string[]
): number {

if (!text) {
return 0;
}


return keywords.filter(
(keyword) =>
text.includes(keyword)
).length;
}


function keywordScore(
text: string,
keywords: string[]
): number {

const matches =
countKeywordMatches(
text,
keywords
);


if (
matches === 0
) {
return 0;
}


return clamp(
30 +
Math.min(
matches,
5
) * 12
);
}


/* =====================================================
TOPIC RELEVANCE
===================================================== */

function topicRelevance(
source: AIResearchSource,
task: AIResearchTask
): number {

const text =
sourceText(
source
);


let keywords:
string[] = [];


switch (task) {

case "DAILY_MARKET_REVIEW":

keywords = [
"stock market",
"equity market",
"equities",
"stocks",
"nasdaq",
"nasdaq 100",
"russell 2000",
"small cap",
"small-cap",
"s&p 500",
"sp500",
"dow",
"volatility",
"vix",
"treasury yield",
"bond yield",
"interest rate",
"rate cut",
"rate hike",
"fomc",
"monetary policy",
"inflation",
"cpi",
"ppi",
"employment",
"payroll",
"unemployment",
"financial conditions",
"liquidity",
"market breadth",
"rotation",
"credit spreads",
];

break;


case "REGIME_REVIEW":

keywords = [
"market regime",
"risk-off",
"risk on",
"market breadth",
"participation",
"liquidity",
"volatility",
"vix",
"treasury yield",
"interest rate",
"fomc",
"monetary policy",
"recession",
"growth",
"inflation",
"financial conditions",
"credit spreads",
"equity market",
"nasdaq",
"russell 2000",
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
"technology stocks",
"tech stocks",
"rotation",
"market breadth",
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
"liquidity stress",
"credit stress",
"treasury yield",
"financial conditions",
"credit spreads",
"market breadth",
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
"technology stocks",
"small cap",
"volatility",
"vix",
"momentum",
"rotation",
"market breadth",
"market structure",
];

break;


case "ANOMALY_REVIEW":

keywords = [
"unusual",
"divergence",
"anomaly",
"market breadth",
"volatility",
"vix",
"rotation",
"liquidity",
"market structure",
"relative strength",
"nasdaq",
"russell 2000",
];

break;


case "FORWARD_TEST_REVIEW":

keywords = [
"stock market",
"equity market",
"nasdaq",
"russell 2000",
"s&p 500",
"volatility",
"market breadth",
"rotation",
"liquidity",
"interest rate",
"treasury yield",
"fomc",
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

function marketImpactRelevance(
source: AIResearchSource,
task: AIResearchTask
): number {

const text =
sourceText(
source
);


/*
* Start below neutral.
*
* A source must earn market-impact relevance.
* Merely being recent or official is not enough.
*/

let score = 30;


/* ---------------------------------------------------
VERY HIGH MACRO / POLICY IMPACT
--------------------------------------------------- */

const veryHighImpactKeywords = [
"fomc",
"federal open market committee",
"federal funds rate",
"interest rate decision",
"rate decision",
"rate hike",
"rate cut",
"monetary policy",
"fed statement",
"economic projections",
"summary of economic projections",
"dot plot",
"inflation",
"consumer price index",
"cpi",
"producer price index",
"ppi",
"nonfarm payroll",
"non-farm payroll",
"employment report",
"unemployment rate",
"jobs report",
"gross domestic product",
"gdp",
"recession",
"treasury yield",
"10-year yield",
"2-year yield",
"financial conditions",
"credit conditions",
];


const veryHighMatches =
countKeywordMatches(
text,
veryHighImpactKeywords
);


if (
veryHighMatches > 0
) {

score += Math.min(
50,
veryHighMatches * 14
);
}


/* ---------------------------------------------------
NASDAQ / LARGE CAP IMPACT
--------------------------------------------------- */

const nasdaqMarketKeywords = [
"nasdaq 100",
"nasdaq-100",
"nasdaq composite",
"ndx",
"qqq",
"technology stocks",
"tech stocks",
"mega cap",
"mega-cap",
"large cap growth",
"apple",
"microsoft",
"amazon",
"alphabet",
"meta platforms",
"nvidia",
];


const nasdaqMatches =
countKeywordMatches(
text,
nasdaqMarketKeywords
);


if (
nasdaqMatches > 0
) {

score += Math.min(
24,
nasdaqMatches * 6
);
}


/* ---------------------------------------------------
RUSSELL / SMALL CAP IMPACT
--------------------------------------------------- */

const russellKeywords = [
"russell 2000",
"rut",
"iwm",
"small cap",
"small-cap",
"small caps",
"small-cap stocks",
];


const russellMatches =
countKeywordMatches(
text,
russellKeywords
);


if (
russellMatches > 0
) {

score += Math.min(
24,
russellMatches * 7
);
}


/* ---------------------------------------------------
SEMICONDUCTOR / AI MARKET IMPACT
--------------------------------------------------- */

const semiconductorKeywords = [
"semiconductor",
"semiconductors",
"chip stocks",
"nvidia",
"amd",
"broadcom",
"ai stocks",
"artificial intelligence stocks",
"ai spending",
"ai capex",
];


const semiconductorMatches =
countKeywordMatches(
text,
semiconductorKeywords
);


if (
semiconductorMatches > 0
) {

score += Math.min(
20,
semiconductorMatches * 5
);
}


/* ---------------------------------------------------
VOLATILITY / MARKET STRUCTURE
--------------------------------------------------- */

const volatilityKeywords = [
"vix",
"volatility",
"implied volatility",
"options market",
"market breadth",
"advance decline",
"advance-decline",
"market internals",
"rotation",
"relative strength",
"liquidity stress",
"liquidity tightening",
];


const volatilityMatches =
countKeywordMatches(
text,
volatilityKeywords
);


if (
volatilityMatches > 0
) {

score += Math.min(
30,
volatilityMatches * 7
);
}


/* ---------------------------------------------------
TREASURY / FINANCIAL CONDITIONS
--------------------------------------------------- */

const financialConditionKeywords = [
"treasury yield",
"treasury yields",
"bond yield",
"bond yields",
"10-year treasury",
"2-year treasury",
"financial conditions",
"credit spread",
"credit spreads",
"real yield",
"real yields",
"term premium",
];


const financialConditionMatches =
countKeywordMatches(
text,
financialConditionKeywords
);


if (
financialConditionMatches > 0
) {

score += Math.min(
30,
financialConditionMatches * 8
);
}


/* ---------------------------------------------------
GEOPOLITICAL MARKET IMPACT
--------------------------------------------------- */

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
countKeywordMatches(
text,
geopoliticalKeywords
);


if (
geopoliticalMatches > 0
) {

score += Math.min(
20,
geopoliticalMatches * 5
);
}


/* ---------------------------------------------------
LOW IMPACT / ADMINISTRATIVE CONTENT
--------------------------------------------------- */

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

"technical publication",
"technical documentation",
"technical note",

"settlement publication",
"settlement calendar",
"settlement date",

"reference rates",
"fx reference rates",

"operational procedures",
"operational framework",

"liquidity management publication",

"public comment",
"enforcement action",
"regulatory notice",

"eligible marketable assets",
"list of eligible marketable assets",
"list of monetary financial institutions",
"mfi list",

"ecms is closed",
"pontes pilot is closed",
];


const lowImpactMatches =
countKeywordMatches(
text,
lowImpactKeywords
);


if (
lowImpactMatches > 0
) {

score -= Math.min(
50,
lowImpactMatches * 16
);
}


/* ===================================================
FED ADMINISTRATIVE / SUPERVISORY CONTENT
=================================================== */

const fedAdministrativeKeywords = [
"approval of application",
"announces approval",
"bank holding company",
"bank holding companies",
"acquisition of control",
"acquisition of shares",
"formation of a bank holding company",
"application by",
"state member bank",
"national bank",
"trust company",
];


const fedAdministrativeMatches =
countKeywordMatches(
text,
fedAdministrativeKeywords
);


if (
isFederalReserveSource(source) &&
fedAdministrativeMatches > 0 &&
veryHighMatches === 0
) {

score -= 35;
}


/* ---------------------------------------------------
FED SUPERVISORY / BANK REGULATION
--------------------------------------------------- */

const fedSupervisoryKeywords = [
"enforcement action",
"cease and desist",
"written agreement",
"consent order",
"supervisory action",
"bank enforcement",
"stress test",
"stress tests",
"stress test-related",
"capital requirements",
"resolution plan",
"resolution plans",
"resolution plan feedback",
"banking organizations",
"bank regulation",
"supervision and regulation",
];


const fedSupervisoryMatches =
countKeywordMatches(
text,
fedSupervisoryKeywords
);


if (
isFederalReserveSource(source) &&
fedSupervisoryMatches > 0 &&
veryHighMatches === 0
) {

score -= Math.min(
35,
15 +
fedSupervisoryMatches * 5
);
}


/* ---------------------------------------------------
ECB OPERATIONAL / TECHNICAL
--------------------------------------------------- */

const ecbOperationalKeywords = [
"liquidity management publication",
"list of eligible marketable assets",
"eligible marketable assets",
"list of monetary financial institutions",
"mfi list",
"ecms is closed",
"pontes pilot is closed",
"reference rates",
"fx reference rates",
"settlement publication",
"settlement calendar",
"operational procedures",
"operational framework",
"technical publication",
"technical documentation",
];


const ecbOperationalMatches =
countKeywordMatches(
text,
ecbOperationalKeywords
);


if (
isECBSource(source) &&
ecbOperationalMatches > 0 &&
veryHighMatches === 0 &&
financialConditionMatches === 0
) {

score -= Math.min(
45,
20 +
ecbOperationalMatches * 10
);
}


/* ---------------------------------------------------
NASDAQ CORPORATE / COMMERCIAL CONTENT
--------------------------------------------------- */

const nasdaqCorporateKeywords = [
"conference",
"conference presentation",
"investor conference",
"partnership",
"partners with",
"adopts nasdaq",
"adopts nasdaq calypso",
"nasdaq calypso",
"calypso",
"launches agentic capabilities",
"platform",
"trade lifecycle",
"clearing platform",
"market surveillance agreement",
"technology platform",
"software platform",
"listing compliance",
"delisting",
];


const nasdaqCorporateMatches =
countKeywordMatches(
text,
nasdaqCorporateKeywords
);


if (
isNasdaqSource(source) &&
nasdaqCorporateMatches > 0 &&
veryHighMatches === 0 &&
volatilityMatches === 0
) {

score -= Math.min(
40,
18 +
nasdaqCorporateMatches * 6
);
}


/* ---------------------------------------------------
INDEX CONSTITUENT CHANGES
--------------------------------------------------- */

const indexConstituentKeywords = [
"to join the nasdaq-100",
"to join the nasdaq 100",
"become a component",
"becomes a component",
"will become a component",
"replacing",
"index inclusion",
"index deletion",
"index reconstitution",
"index rebalance",
];


const indexConstituentMatches =
countKeywordMatches(
text,
indexConstituentKeywords
);


if (
indexConstituentMatches > 0 &&
veryHighMatches === 0
) {

/*
* Index changes can affect individual names and
* passive flows, but they normally do not define
* the broad macro / regime picture.
*/

score -= Math.min(
25,
10 +
indexConstituentMatches * 5
);
}


/* ===================================================
STRONG MARKET CATALYST OVERRIDE
=================================================== */

const hasStrongMarketCatalyst =
veryHighMatches > 0 ||
volatilityMatches >= 2 ||
financialConditionMatches >= 2 ||
geopoliticalMatches >= 2;


if (
hasStrongMarketCatalyst
) {

score += 10;
}


/* ===================================================
TASK-SPECIFIC IMPACT
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
text.includes(
"relative strength"
)
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
text.includes(
"liquidity stress"
) ||
text.includes(
"financial conditions"
) ||
text.includes(
"credit spreads"
)
) {

score += 15;
}
}


if (
task === "REGIME_REVIEW"
) {

if (
text.includes(
"monetary policy"
) ||
text.includes(
"interest rate"
) ||
text.includes("inflation") ||
text.includes(
"financial conditions"
)
) {

score += 15;
}
}


return clamp(
score
);
}


/* =====================================================
DOCUMENT-TYPE RELEVANCE
===================================================== */

/*
* This score answers a different question from
* sourceQuality():
*
* "What kind of document is this for the purpose of
* market-regime research?"
*
* 100 = direct macro / policy / market catalyst
* 70+ = meaningful market research material
* 40-60 = contextual
* <=30 = administrative / corporate / technical
*/

function documentTypeRelevance(
source: AIResearchSource
): number {

const text =
sourceText(
source
);


/* ---------------------------------------------------
DIRECT MACRO / POLICY DOCUMENTS
--------------------------------------------------- */

const directMacroKeywords = [
"fomc statement",
"federal open market committee",
"economic projections",
"summary of economic projections",
"federal funds rate",
"interest rate decision",
"monetary policy",
"minutes of the federal open market committee",
"consumer price index",
"producer price index",
"employment report",
"nonfarm payroll",
"gross domestic product",
"gdp",
];


if (
directMacroKeywords.some(
(keyword) =>
text.includes(keyword)
)
) {

return 100;
}


/* ---------------------------------------------------
DIRECT MARKET / FINANCIAL-CONDITION DOCUMENTS
--------------------------------------------------- */

const directMarketKeywords = [
"nasdaq 100",
"nasdaq-100",
"nasdaq composite",
"russell 2000",
"small cap stocks",
"technology stocks",
"semiconductor stocks",
"vix",
"implied volatility",
"market breadth",
"market internals",
"market rotation",
"relative strength",
"treasury yields",
"financial conditions",
"credit spreads",
"real yields",
"term premium",
];


const directMarketMatches =
countKeywordMatches(
text,
directMarketKeywords
);


if (
directMarketMatches >= 2
) {

return 92;
}


if (
directMarketMatches === 1
) {

return 78;
}


/* ---------------------------------------------------
FED SUPERVISORY / BANK REGULATORY DOCUMENTS
--------------------------------------------------- */

const fedSupervisoryKeywords = [
"stress test",
"stress tests",
"stress test-related",
"capital requirements",
"resolution plan",
"resolution plans",
"resolution plan feedback",
"banking organizations",
"supervisory action",
"enforcement action",
"bank regulation",
"supervision and regulation",
];


if (
isFederalReserveSource(source) &&
fedSupervisoryKeywords.some(
(keyword) =>
text.includes(keyword)
)
) {

/*
* Potentially useful systemic context,
* but not equivalent to monetary policy.
*/

return 32;
}


/* ---------------------------------------------------
FED ADMINISTRATIVE
--------------------------------------------------- */

const fedAdministrativeKeywords = [
"approval of application",
"announces approval",
"bank holding company",
"acquisition of control",
"acquisition of shares",
"application by",
"state member bank",
"trust company",
];


if (
fedAdministrativeKeywords.some(
(keyword) =>
text.includes(keyword)
)
) {

return 12;
}


/* ---------------------------------------------------
ECB TECHNICAL / OPERATIONAL
--------------------------------------------------- */

const ecbTechnicalKeywords = [
"liquidity management publication",
"list of eligible marketable assets",
"eligible marketable assets",
"list of monetary financial institutions",
"mfi list",
"ecms is closed",
"pontes pilot is closed",
"reference rates",
"fx reference rates",
"settlement publication",
"settlement calendar",
"technical publication",
"technical documentation",
"operational procedures",
"operational framework",
];


if (
ecbTechnicalKeywords.some(
(keyword) =>
text.includes(keyword)
)
) {

return 8;
}


/* ---------------------------------------------------
NASDAQ COMMERCIAL / INFRASTRUCTURE
--------------------------------------------------- */

const nasdaqCorporateKeywords = [
"nasdaq calypso",
"calypso",
"launches agentic capabilities",
"adopts nasdaq",
"clearing platform",
"trade lifecycle",
"technology platform",
"software platform",
"conference presentation",
"investor conference",
"market surveillance agreement",
];


if (
isNasdaqSource(source) &&
nasdaqCorporateKeywords.some(
(keyword) =>
text.includes(keyword)
)
) {

return 20;
}


/* ---------------------------------------------------
INDEX CONSTITUENT / REBALANCE NEWS
--------------------------------------------------- */

const indexChangeKeywords = [
"to join the nasdaq-100",
"to join the nasdaq 100",
"become a component",
"becomes a component",
"will become a component",
"index inclusion",
"index deletion",
"index reconstitution",
"index rebalance",
];


if (
indexChangeKeywords.some(
(keyword) =>
text.includes(keyword)
)
) {

return 38;
}


/* ---------------------------------------------------
GENERIC CORPORATE / PROMOTIONAL CONTENT
--------------------------------------------------- */

const corporateKeywords = [
"conference presentation",
"investor conference",
"fireside chat",
"partnership",
"partners with",
"tokenized equities",
"market surveillance agreement",
"listing compliance",
"delisting",
];


if (
corporateKeywords.some(
(keyword) =>
text.includes(keyword)
)
) {

return 25;
}


return 50;
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

return 35;
}


const timestamp =
new Date(
source.publishedAt
).getTime();


if (
!Number.isFinite(
timestamp
)
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


if (
ageHours <= 24
) {
return 100;
}


if (
ageHours <= 48
) {
return 94;
}


if (
ageHours <= 72
) {
return 88;
}


if (
ageHours <= 120
) {
return 80;
}


if (
ageHours <= 168
) {
return 72;
}


if (
ageHours <= 336
) {
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
sourceText(
source
);


const noiseKeywords = [
"t2",
"t+2",
"t2s",
"settlement date",
"settlement calendar",
"options chain",
"strike price",
"expiration date",
"option chain",
"delisting",
"delisted",
"listing compliance",
"administrative notice",
"technical documentation",
"technical publication",
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
"liquidity management publication",
];


let penalty = 0;


for (
const keyword of noiseKeywords
) {

if (
text.includes(keyword)
) {

penalty += 7;
}
}


return clamp(
penalty,
0,
45
);
}


/* =====================================================
PUBLISHER ADJUSTMENT
===================================================== */

/*
* Publisher adjustment is deliberately small.
*
* Authority is already represented by sourceQuality().
* We do not want official status to rescue irrelevant
* content.
*/

function publisherAdjustment(
source: AIResearchSource
): number {

const publisher =
normalizeText(
source.publisher
);


if (
publisher.includes("reuters") ||
publisher.includes("bloomberg") ||
publisher.includes(
"financial times"
) ||
publisher.includes(
"wall street journal"
) ||
publisher.includes("cnbc")
) {

return 3;
}


if (
isFederalReserveSource(source) ||
isECBSource(source)
) {

return 2;
}


if (
isNasdaqSource(source)
) {

return 1;
}


if (
isGoogleNewsSource(source)
) {

return -3;
}


return 0;
}


/* =====================================================
FINAL RELEVANCE
===================================================== */

function calculateRelevance(
source: AIResearchSource,
task: AIResearchTask
): number {

const quality =
sourceQuality(
source
);


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


const documentType =
documentTypeRelevance(
source
);


const recency =
recencyScore(
source
);


const noise =
noisePenalty(
source
);


const publisher =
publisherAdjustment(
source
);


/*
* CONTENT RELEVANCE
*
* Market impact is deliberately the strongest
* content component.
*
* A document should not rank highly merely because
* its publisher is authoritative.
*/

const contentRelevance =
clamp(
topic * 0.35 +
impact * 0.40 +
documentType * 0.25
);


/*
* FINAL ARCHITECTURE
*
* 25% source authority
* 55% actual market relevance
* 20% recency
*
* This is intentionally different from the previous
* 35 / 40 / 25 model because that model allowed
* official but irrelevant documents to rank too high.
*/

let score =
quality * 0.25 +
contentRelevance * 0.55 +
recency * 0.20;


score +=
publisher;


score -=
noise * 0.75;


/* ---------------------------------------------------
WEAK SOURCES
--------------------------------------------------- */

if (
quality < 60
) {

score =
Math.min(
score,
72
);
}


/* ---------------------------------------------------
GOOGLE NEWS
--------------------------------------------------- */

if (
isGoogleNewsSource(source)
) {

if (
impact < 75 ||
documentType < 70
) {

score =
Math.min(
score,
70
);

} else {

score =
Math.min(
score,
80
);
}
}


/* ---------------------------------------------------
OFFICIAL BUT TECHNICAL / ADMINISTRATIVE
--------------------------------------------------- */

const isOfficial =
isFederalReserveSource(source) ||
isECBSource(source) ||
isNasdaqSource(source);


if (
isOfficial &&
documentType <= 10
) {

score =
Math.min(
score,
42
);
}


if (
isOfficial &&
documentType > 10 &&
documentType <= 20
) {

score =
Math.min(
score,
50
);
}


if (
isOfficial &&
documentType > 20 &&
documentType <= 30
) {

score =
Math.min(
score,
58
);
}


if (
isOfficial &&
documentType > 30 &&
documentType <= 40 &&
impact < 70
) {

score =
Math.min(
score,
64
);
}


/* ---------------------------------------------------
LOW MARKET IMPACT HARD CAP
--------------------------------------------------- */

if (
impact <= 20
) {

score =
Math.min(
score,
45
);
}


if (
impact > 20 &&
impact <= 35 &&
documentType < 50
) {

score =
Math.min(
score,
58
);
}


/* ---------------------------------------------------
GENUINE HIGH-IMPACT MATERIAL
--------------------------------------------------- */

if (
impact >= 90 &&
topic >= 60 &&
documentType >= 78
) {

score += 6;
}


return Math.round(
clamp(
score
)
);
}


/* =====================================================
DEDUPLICATION
===================================================== */

/*
* External feeds can contain several publications that
* are effectively the same research item.
*
* We deduplicate BEFORE ranking so repeated operational
* publications cannot occupy several Top-N slots.
*
* Exact URL duplicates are removed first.
*
* Then same-publisher / same-normalized-title duplicates
* are collapsed, keeping the newest observation.
*/

function deduplicateResearchSources(
sources: AIResearchSource[]
): AIResearchSource[] {

const byUrl =
new Map<
string,
AIResearchSource
>();


const withoutUrlDuplicates:
AIResearchSource[] = [];


for (
const source of sources
) {

const url =
normalizeText(
source.url
);


if (
!url
) {

withoutUrlDuplicates.push(
source
);

continue;
}


const existing =
byUrl.get(
url
);


if (
!existing
) {

byUrl.set(
url,
source
);

continue;
}


const existingDate =
existing.publishedAt
? new Date(
existing.publishedAt
).getTime()
: 0;


const candidateDate =
source.publishedAt
? new Date(
source.publishedAt
).getTime()
: 0;


if (
candidateDate >
existingDate
) {

byUrl.set(
url,
source
);
}
}


withoutUrlDuplicates.push(
...byUrl.values()
);


const bySemanticKey =
new Map<
string,
AIResearchSource
>();


const noSemanticKey:
AIResearchSource[] = [];


for (
const source of withoutUrlDuplicates
) {

const title =
normalizedTitle(
source
);


const publisher =
normalizeText(
source.publisher
);


if (
!title
) {

noSemanticKey.push(
source
);

continue;
}


const semanticKey =
`${publisher}::${title}`;


const existing =
bySemanticKey.get(
semanticKey
);


if (
!existing
) {

bySemanticKey.set(
semanticKey,
source
);

continue;
}


const existingDate =
existing.publishedAt
? new Date(
existing.publishedAt
).getTime()
: 0;


const candidateDate =
source.publishedAt
? new Date(
source.publishedAt
).getTime()
: 0;


if (
candidateDate >
existingDate
) {

bySemanticKey.set(
semanticKey,
source
);
}
}


return [
...noSemanticKey,
...bySemanticKey.values(),
];
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

const deduplicated =
deduplicateResearchSources(
sources
);


const scored:
ScoredResearchSource[] =
deduplicated.map(
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
(item) => ({
...item.source,

relevance:
item.score,
})
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