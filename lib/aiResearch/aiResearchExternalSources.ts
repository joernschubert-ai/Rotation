import type {
AIResearchSource,
AIResearchTask,
} from "./aiResearchTypes";


/* =====================================================
TYPES
===================================================== */

interface FeedDefinition {
name: string;
url: string;
tasks: AIResearchTask[];
defaultPublisher: string;
feedType?: "OFFICIAL" | "GOOGLE_NEWS";
}


export interface ExternalResearchDiagnostics {
feedCount: number;
successfulFeeds: number;
failedFeeds: number;
parsedItems: number;
sourceCount: number;
warnings: string[];
}


export interface ExternalResearchResult {
sources: AIResearchSource[];
diagnostics: ExternalResearchDiagnostics;
}


/* =====================================================
FEED DEFINITIONS
===================================================== */

/*
* External research only.
*
* This layer does NOT:
*
* - change Master Score
* - change Phase
* - change Mode
* - change Regime
* - generate trading signals
* - modify engine output
*
* COT remains a separate positioning layer.
*
* NEWS != POSITIONING
*/

const FEEDS: FeedDefinition[] = [

/* ---------------------------------------------------
FEDERAL RESERVE
--------------------------------------------------- */

{
name: "Federal Reserve",

url:
"https://www.federalreserve.gov/feeds/press_all.xml",

defaultPublisher:
"Federal Reserve Board",

feedType:
"OFFICIAL",

tasks: [
"DAILY_MARKET_REVIEW",
"REGIME_REVIEW",
"CRASH_RISK_REVIEW",
"FORWARD_TEST_REVIEW",
"ANOMALY_REVIEW",
"TRADE_SETUP_REVIEW",
"ROTATION_REVIEW",
],
},


/* ---------------------------------------------------
ECB
--------------------------------------------------- */

{
name:
"European Central Bank",

url:
"https://mid.ecb.europa.eu/rss/mid.xml",

defaultPublisher:
"European Central Bank",

feedType:
"OFFICIAL",

tasks: [
"DAILY_MARKET_REVIEW",
"REGIME_REVIEW",
"CRASH_RISK_REVIEW",
"FORWARD_TEST_REVIEW",
"ANOMALY_REVIEW",
],
},


/* ---------------------------------------------------
NASDAQ CORPORATE / EXCHANGE
--------------------------------------------------- */

{
name:
"Nasdaq",

url:
"https://ir.nasdaq.com/rss/news-releases.xml",

defaultPublisher:
"Nasdaq",

feedType:
"OFFICIAL",

tasks: [
"DAILY_MARKET_REVIEW",
"ROTATION_REVIEW",
"TRADE_SETUP_REVIEW",
"ANOMALY_REVIEW",
],
},


/* ===================================================
GOOGLE NEWS — TARGETED MARKET RESEARCH
=================================================== */

/*
* These feeds are deliberately narrower than before.
*
* The goal is not generic financial-news coverage.
* The goal is independent evidence for the dimensions
* used by the Rotation App:
*
* - NASDAQ leadership
* - Russell / small caps
* - breadth / participation
* - Treasury yields / financial conditions
* - Fed / inflation / labour
* - volatility
* - semiconductor / AI leadership
* - macro / geopolitical market shocks
*/


/* ---------------------------------------------------
NASDAQ / LARGE-CAP LEADERSHIP
--------------------------------------------------- */

{
name:
"Nasdaq Market Structure News",

url:
"https://news.google.com/rss/search?q=%28NASDAQ+OR+%22Nasdaq+100%22+OR+QQQ%29+%28market+OR+stocks+OR+earnings+OR+valuation+OR+leadership%29+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",

defaultPublisher:
"Google News",

feedType:
"GOOGLE_NEWS",

tasks: [
"DAILY_MARKET_REVIEW",
"ROTATION_REVIEW",
"TRADE_SETUP_REVIEW",
"ANOMALY_REVIEW",
"FORWARD_TEST_REVIEW",
],
},


/* ---------------------------------------------------
RUSSELL / SMALL CAPS
--------------------------------------------------- */

{
name:
"Russell Small Cap News",

url:
"https://news.google.com/rss/search?q=%28%22Russell+2000%22+OR+IWM+OR+%22small+cap+stocks%22%29+%28rates+OR+growth+OR+earnings+OR+rotation+OR+market%29+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",

defaultPublisher:
"Google News",

feedType:
"GOOGLE_NEWS",

tasks: [
"DAILY_MARKET_REVIEW",
"ROTATION_REVIEW",
"TRADE_SETUP_REVIEW",
"ANOMALY_REVIEW",
"FORWARD_TEST_REVIEW",
],
},


/* ---------------------------------------------------
MARKET BREADTH / PARTICIPATION
--------------------------------------------------- */

{
name:
"Market Breadth News",

url:
"https://news.google.com/rss/search?q=%28%22market+breadth%22+OR+%22advance+decline%22+OR+%22market+internals%22+OR+%22stock+market+concentration%22%29+when%3A14d&hl=en-US&gl=US&ceid=US%3Aen",

defaultPublisher:
"Google News",

feedType:
"GOOGLE_NEWS",

tasks: [
"DAILY_MARKET_REVIEW",
"REGIME_REVIEW",
"ROTATION_REVIEW",
"CRASH_RISK_REVIEW",
"ANOMALY_REVIEW",
"FORWARD_TEST_REVIEW",
],
},


/* ---------------------------------------------------
TREASURY YIELDS / FINANCIAL CONDITIONS
--------------------------------------------------- */

{
name:
"Treasury Financial Conditions News",

url:
"https://news.google.com/rss/search?q=%28%22Treasury+yields%22+OR+%2210-year+yield%22+OR+%22real+yields%22+OR+%22financial+conditions%22+OR+%22credit+spreads%22%29+%28stocks+OR+market+OR+Fed%29+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",

defaultPublisher:
"Google News",

feedType:
"GOOGLE_NEWS",

tasks: [
"DAILY_MARKET_REVIEW",
"REGIME_REVIEW",
"CRASH_RISK_REVIEW",
"ANOMALY_REVIEW",
"TRADE_SETUP_REVIEW",
"FORWARD_TEST_REVIEW",
],
},


/* ---------------------------------------------------
FED / INFLATION / LABOUR
--------------------------------------------------- */

{
name:
"US Macro Policy News",

url:
"https://news.google.com/rss/search?q=%28Fed+OR+FOMC+OR+inflation+OR+CPI+OR+PCE+OR+payrolls+OR+unemployment%29+%28stocks+OR+market+OR+yields%29+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",

defaultPublisher:
"Google News",

feedType:
"GOOGLE_NEWS",

tasks: [
"DAILY_MARKET_REVIEW",
"REGIME_REVIEW",
"CRASH_RISK_REVIEW",
"ANOMALY_REVIEW",
"FORWARD_TEST_REVIEW",
],
},


/* ---------------------------------------------------
VOLATILITY
--------------------------------------------------- */

{
name:
"Volatility Market News",

url:
"https://news.google.com/rss/search?q=%28VIX+OR+%22implied+volatility%22+OR+%22options+market%22%29+%28stocks+OR+market+OR+S%26P+OR+Nasdaq%29+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",

defaultPublisher:
"Google News",

feedType:
"GOOGLE_NEWS",

tasks: [
"DAILY_MARKET_REVIEW",
"CRASH_RISK_REVIEW",
"ANOMALY_REVIEW",
"TRADE_SETUP_REVIEW",
"FORWARD_TEST_REVIEW",
],
},


/* ---------------------------------------------------
SEMICONDUCTORS / AI LEADERSHIP
--------------------------------------------------- */

{
name:
"Semiconductor Leadership News",

url:
"https://news.google.com/rss/search?q=%28semiconductors+OR+Nvidia+OR+AMD+OR+Broadcom%29+%28stocks+OR+earnings+OR+demand+OR+AI+OR+capex%29+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",

defaultPublisher:
"Google News",

feedType:
"GOOGLE_NEWS",

tasks: [
"DAILY_MARKET_REVIEW",
"ROTATION_REVIEW",
"ANOMALY_REVIEW",
"TRADE_SETUP_REVIEW",
"FORWARD_TEST_REVIEW",
],
},


/* ---------------------------------------------------
GEOPOLITICAL / MACRO SHOCKS
--------------------------------------------------- */

{
name:
"Macro Shock Market News",

url:
"https://news.google.com/rss/search?q=%28tariffs+OR+sanctions+OR+Iran+OR+China+OR+Taiwan+OR+%22oil+prices%22%29+%28stocks+OR+market+OR+inflation+OR+yields%29+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",

defaultPublisher:
"Google News",

feedType:
"GOOGLE_NEWS",

tasks: [
"DAILY_MARKET_REVIEW",
"REGIME_REVIEW",
"CRASH_RISK_REVIEW",
"ANOMALY_REVIEW",
"FORWARD_TEST_REVIEW",
],
},
];


/* =====================================================
HELPERS
===================================================== */

function normalizeText(
value: unknown
): string {

if (
typeof value !== "string"
) {
return "";
}


return value
.replace(
/<!\[CDATA\[|\]\]>/g,
""
)
.replace(
/<[^>]*>/g,
" "
)
.replace(
/\s+/g,
" "
)
.trim();
}


function decodeXml(
value: string
): string {

return value
.replace(
/&amp;/g,
"&"
)
.replace(
/&lt;/g,
"<"
)
.replace(
/&gt;/g,
">"
)
.replace(
/&quot;/g,
'"'
)
.replace(
/&#39;/g,
"'"
)
.replace(
/&#x27;/gi,
"'"
)
.replace(
/&#x2F;/gi,
"/"
);
}


function extractTag(
block: string,
tag: string
): string {

const expression =
new RegExp(
`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`,
"i"
);


const match =
block.match(
expression
);


if (
!match?.[1]
) {
return "";
}


return decodeXml(
normalizeText(
match[1]
)
);
}


function extractLink(
block: string
): string {

const rssLink =
extractTag(
block,
"link"
);


if (
rssLink
) {
return rssLink;
}


const atomLink =
block.match(
/<link[^>]+href=["']([^"']+)["']/i
);


return atomLink?.[1]
? decodeXml(
atomLink[1]
)
: "";
}


function extractItems(
xml: string
): string[] {

const rssItems = [
...xml.matchAll(
/<item\b[\s\S]*?<\/item>/gi
),
].map(
(match) =>
match[0]
);


if (
rssItems.length > 0
) {
return rssItems;
}


return [
...xml.matchAll(
/<entry\b[\s\S]*?<\/entry>/gi
),
].map(
(match) =>
match[0]
);
}


function parsePublishedAt(
value: string
): string | undefined {

if (
!value
) {
return undefined;
}


const timestamp =
Date.parse(
value
);


if (
!Number.isFinite(
timestamp
)
) {
return undefined;
}


return new Date(
timestamp
).toISOString();
}


function taskUsesFeed(
feed: FeedDefinition,
task: AIResearchTask
): boolean {

return feed.tasks.includes(
task
);
}


/* =====================================================
GOOGLE NEWS HELPERS
===================================================== */

/*
* Google News RSS provides the actual publisher in:
*
* <source url="...">Publisher Name</source>
*
* The old implementation ignored this field and marked
* every article as "Google News".
*/

function extractGoogleNewsPublisher(
item: string
): string {

return extractTag(
item,
"source"
);
}


/*
* Google News titles normally end with:
*
* "Headline - Publisher"
*
* Once the publisher is available separately we remove
* that suffix so title similarity and deduplication work
* on the actual headline.
*/

function cleanGoogleNewsTitle(
title: string,
publisher: string
): string {

if (
!title ||
!publisher
) {
return title;
}


const suffix =
` - ${publisher}`;


if (
title
.toLowerCase()
.endsWith(
suffix.toLowerCase()
)
) {

return title
.slice(
0,
title.length -
suffix.length
)
.trim();
}


return title;
}


/*
* Google News descriptions are aggregation markup,
* not reliable article summaries.
*
* Feeding that HTML-derived text into the relevance
* engine can duplicate headline keywords and inflate
* relevance.
*
* Therefore Google News items intentionally carry no
* summary here.
*/

function shouldUseFeedSummary(
feed: FeedDefinition
): boolean {

return (
feed.feedType !==
"GOOGLE_NEWS"
);
}


/* =====================================================
SOURCE PARSER
===================================================== */

function parseFeed(
feed: FeedDefinition,
xml: string
): AIResearchSource[] {

const items =
extractItems(
xml
);


const sources:
AIResearchSource[] = [];


for (
const item of items
) {

const rawTitle =
extractTag(
item,
"title"
);


const link =
extractLink(
item
);


const description =
extractTag(
item,
"description"
);


const summary =
extractTag(
item,
"summary"
);


const pubDate =
extractTag(
item,
"pubDate"
);


const published =
extractTag(
item,
"published"
);


const updated =
extractTag(
item,
"updated"
);


const publishedAt =
parsePublishedAt(
pubDate ||
published ||
updated
);


if (
!rawTitle ||
!link
) {
continue;
}


const originalPublisher =
feed.feedType ===
"GOOGLE_NEWS"

? extractGoogleNewsPublisher(
item
)

: "";


const publisher =
originalPublisher ||
feed.defaultPublisher;


const title =
feed.feedType ===
"GOOGLE_NEWS"

? cleanGoogleNewsTitle(
rawTitle,
publisher
)

: rawTitle;


const feedSummary =
shouldUseFeedSummary(
feed
)

? (
description ||
summary ||
undefined
)

: undefined;


sources.push({

title,

url:
link,

publisher,

...(publishedAt
? {
publishedAt,
}
: {}),

...(feedSummary
? {
summary:
feedSummary,
}
: {}),

});
}


return sources;
}


/* =====================================================
FETCH
===================================================== */

async function fetchFeed(
feed: FeedDefinition
): Promise<{
sources: AIResearchSource[];
warning?: string;
}> {

try {

const response =
await fetch(
feed.url,
{
method:
"GET",

cache:
"no-store",

headers: {

Accept:
"application/rss+xml, application/atom+xml, application/xml, text/xml, */*",

"User-Agent":
"Rotation-App-AI-Research-Agent/1.0",
},
}
);


if (
!response.ok
) {

return {

sources:
[],

warning:
`${feed.name}: HTTP ${response.status}`,
};
}


const xml =
await response.text();


if (
!xml ||
xml.length < 20
) {

return {

sources:
[],

warning:
`${feed.name}: empty feed response`,
};
}


const sources =
parseFeed(
feed,
xml
);


return {
sources,
};


} catch (error) {

return {

sources:
[],

warning:
`${feed.name}: ${
error instanceof Error
? error.message
: "unknown fetch error"
}`,
};
}
}


/* =====================================================
DEDUPLICATION HELPERS
===================================================== */

function normalizeDedupText(
value: string | undefined
): string {

return (
value ?? ""
)
.toLowerCase()
.replace(
/\bupdated\b/g,
" "
)
.replace(
/\blive updates?\b/g,
" "
)
.replace(
/[^\p{L}\p{N}\s]/gu,
" "
)
.replace(
/\s+/g,
" "
)
.trim();
}


function sourceTimestamp(
source: AIResearchSource
): number {

if (
!source.publishedAt
) {
return 0;
}


const timestamp =
Date.parse(
source.publishedAt
);


return Number.isFinite(
timestamp
)
? timestamp
: 0;
}


/* =====================================================
DEDUPLICATION
===================================================== */

/*
* Stage 1:
* exact URL duplicates.
*
* Stage 2:
* exact normalized headline + publisher duplicates.
*
* This intentionally does NOT perform fuzzy semantic
* deduplication yet. Two different articles covering
* the same event may contain genuinely independent
* information and should remain available to the later
* research layer.
*/

function deduplicateSources(
sources: AIResearchSource[]
): AIResearchSource[] {

const byUrl =
new Map<
string,
AIResearchSource
>();


const withoutUrl:
AIResearchSource[] = [];


for (
const source of sources
) {

const key =
source.url
.trim()
.toLowerCase();


if (
!key
) {

withoutUrl.push(
source
);

continue;
}


const existing =
byUrl.get(
key
);


if (
!existing ||
sourceTimestamp(source) >
sourceTimestamp(existing)
) {

byUrl.set(
key,
source
);
}
}


const urlDeduplicated = [
...withoutUrl,
...byUrl.values(),
];


const byHeadline =
new Map<
string,
AIResearchSource
>();


const withoutHeadline:
AIResearchSource[] = [];


for (
const source of urlDeduplicated
) {

const titleKey =
normalizeDedupText(
source.title
);


const publisherKey =
normalizeDedupText(
source.publisher
);


if (
!titleKey
) {

withoutHeadline.push(
source
);

continue;
}


const key =
`${publisherKey}::${titleKey}`;


const existing =
byHeadline.get(
key
);


if (
!existing ||
sourceTimestamp(source) >
sourceTimestamp(existing)
) {

byHeadline.set(
key,
source
);
}
}


return [
...withoutHeadline,
...byHeadline.values(),
];
}


/* =====================================================
SORT
===================================================== */

function sortByPublishedAt(
sources: AIResearchSource[]
): AIResearchSource[] {

return [
...sources,
].sort(
(a, b) =>
sourceTimestamp(b) -
sourceTimestamp(a)
);
}


/* =====================================================
MAIN
===================================================== */

export async function fetchExternalResearchSources(
input: {
task: AIResearchTask;
}
): Promise<ExternalResearchResult> {

const applicableFeeds =
FEEDS.filter(
(feed) =>
taskUsesFeed(
feed,
input.task
)
);


const warnings:
string[] = [];


let successfulFeeds =
0;


let failedFeeds =
0;


let parsedItems =
0;


const feedResults =
await Promise.all(
applicableFeeds.map(
(feed) =>
fetchFeed(
feed
).then(
(result) => ({
feed,
result,
})
)
)
);


const allSources:
AIResearchSource[] = [];


for (
const {
feed,
result,
} of feedResults
) {

if (
result.warning
) {

failedFeeds += 1;

warnings.push(
result.warning
);

continue;
}


successfulFeeds += 1;


parsedItems +=
result.sources.length;


allSources.push(
...result.sources
);
}


const sources =
sortByPublishedAt(
deduplicateSources(
allSources
)
);


return {

sources,

diagnostics: {

feedCount:
applicableFeeds.length,

successfulFeeds,

failedFeeds,

parsedItems,

sourceCount:
sources.length,

warnings,
},
};
}
