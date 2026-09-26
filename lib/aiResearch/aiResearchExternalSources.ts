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
* IMPORTANT:
*
* This layer is intentionally limited to EXTERNAL RESEARCH.
*
* It does NOT:
*
* - change Master Score
* - change Phase
* - change Mode
* - change Regime
* - generate trading signals
* - modify engine output
*
* It only collects external information that the
* deterministic AI Research Engine can later interpret.
*
* COT is deliberately NOT included here.
*
* COT is structured positioning data and will be handled
* separately so that:
*
* NEWS ≠ POSITIONING
*
* remains explicit in the architecture.
*/


/*
* Official Federal Reserve feed.
*
* This remains important for:
*
* - FOMC
* - monetary policy
* - rates
* - Powell
* - macro policy
*/

const FEEDS: FeedDefinition[] = [
{
name: "Federal Reserve",
url: "https://www.federalreserve.gov/feeds/press_all.xml",
defaultPublisher: "Federal Reserve Board",
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

/*
* ECB.
*
* Useful mainly for:
*
* - European monetary policy
* - liquidity
* - FX
* - cross-market macro context
*/

{
name: "European Central Bank",
url: "https://mid.ecb.europa.eu/rss/mid.xml",
defaultPublisher: "European Central Bank",
tasks: [
"DAILY_MARKET_REVIEW",
"REGIME_REVIEW",
"CRASH_RISK_REVIEW",
"FORWARD_TEST_REVIEW",
"ANOMALY_REVIEW",
],
},

/*
* Nasdaq corporate/news RSS.
*
* This is not treated as an index-price feed.
*
* It is useful for:
*
* - Nasdaq ecosystem developments
* - technology
* - market infrastructure
* - exchange developments
*
* The relevance layer determines whether an individual
* item is actually useful for the current research task.
*/

{
name: "Nasdaq",
url: "https://ir.nasdaq.com/rss/news-releases.xml",
defaultPublisher: "Nasdaq",
tasks: [
"DAILY_MARKET_REVIEW",
"ROTATION_REVIEW",
"TRADE_SETUP_REVIEW",
"ANOMALY_REVIEW",
],
},

/*
* Targeted Google News RSS feeds.
*
* These are intentionally query-specific.
*
* They give the Research Agent access to current
* market-news headlines around:
*
* - Nasdaq / Big Tech
* - Russell 2000 / Small Caps
* - semiconductors / AI
* - VIX / volatility
*
* The final relevance ranking still decides which
* individual articles survive.
*
* We do NOT treat Google News as the original publisher.
* The article title/link remains the source reference.
*/

{
name: "Nasdaq Market News",
url:
"https://news.google.com/rss/search?q=NASDAQ+Nasdaq+100+QQQ+technology+stocks+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",
defaultPublisher: "Google News",
tasks: [
"DAILY_MARKET_REVIEW",
"ROTATION_REVIEW",
"TRADE_SETUP_REVIEW",
"ANOMALY_REVIEW",
"FORWARD_TEST_REVIEW",
],
},

{
name: "Russell 2000 Market News",
url:
"https://news.google.com/rss/search?q=Russell+2000+RUT+IWM+small+cap+stocks+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",
defaultPublisher: "Google News",
tasks: [
"DAILY_MARKET_REVIEW",
"ROTATION_REVIEW",
"TRADE_SETUP_REVIEW",
"ANOMALY_REVIEW",
"FORWARD_TEST_REVIEW",
],
},

{
name: "Semiconductor and AI Market News",
url:
"https://news.google.com/rss/search?q=semiconductors+AI+Nvidia+chip+stocks+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",
defaultPublisher: "Google News",
tasks: [
"DAILY_MARKET_REVIEW",
"ROTATION_REVIEW",
"CRASH_RISK_REVIEW",
"ANOMALY_REVIEW",
"TRADE_SETUP_REVIEW",
"FORWARD_TEST_REVIEW",
],
},

{
name: "VIX and Volatility Market News",
url:
"https://news.google.com/rss/search?q=VIX+volatility+options+market+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",
defaultPublisher: "Google News",
tasks: [
"DAILY_MARKET_REVIEW",
"CRASH_RISK_REVIEW",
"ANOMALY_REVIEW",
"TRADE_SETUP_REVIEW",
"FORWARD_TEST_REVIEW",
],
},
];

/* =====================================================
HELPERS
===================================================== */

function normalizeText(value: unknown): string {
if (typeof value !== "string") return "";

return value
.replace(/<!\[CDATA\[|\]\]>/g, "")
.replace(/<[^>]*>/g, " ")
.replace(/\s+/g, " ")
.trim();
}

function decodeXml(value: string): string {
return value
.replace(/&amp;/g, "&")
.replace(/&lt;/g, "<")
.replace(/&gt;/g, ">")
.replace(/&quot;/g, '"')
.replace(/&#39;/g, "'")
.replace(/&#x27;/gi, "'")
.replace(/&#x2F;/gi, "/");
}

function extractTag(
block: string,
tag: string
): string {
const expression = new RegExp(
`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`,
"i"
);

const match = block.match(expression);

if (!match?.[1]) {
return "";
}

return decodeXml(
normalizeText(match[1])
);
}

function extractLink(
block: string
): string {
/*
* RSS:
*
* <link>https://...</link>
*
* Atom:
*
* <link href="https://..." />
*/

const rssLink = extractTag(
block,
"link"
);

if (rssLink) {
return rssLink;
}

const atomLink = block.match(
/<link[^>]+href=["']([^"']+)["']/i
);

return atomLink?.[1]
? decodeXml(atomLink[1])
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
(match) => match[0]
);

if (rssItems.length > 0) {
return rssItems;
}

const atomEntries = [
...xml.matchAll(
/<entry\b[\s\S]*?<\/entry>/gi
),
].map(
(match) => match[0]
);

return atomEntries;
}

function parsePublishedAt(
value: string
): string | undefined {
if (!value) {
return undefined;
}

const timestamp =
Date.parse(value);

if (!Number.isFinite(timestamp)) {
return undefined;
}

return new Date(timestamp).toISOString();
}

function taskUsesFeed(
feed: FeedDefinition,
task: AIResearchTask
): boolean {
return feed.tasks.includes(task);
}

/* =====================================================
SOURCE PARSER
===================================================== */

function parseFeed(
feed: FeedDefinition,
xml: string
): AIResearchSource[] {
const items = extractItems(xml);

const sources: AIResearchSource[] = [];

for (const item of items) {
const title =
extractTag(item, "title");

const link =
extractLink(item);

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
!title ||
!link
) {
continue;
}

sources.push({
title,

url: link,

publisher:
feed.defaultPublisher,

...(publishedAt
? { publishedAt }
: {}),

summary:
description ||
summary ||
undefined,

/*
* Relevance is intentionally NOT
* calculated here.
*
* That belongs to:
*
* aiResearchSourceRelevance.ts
*/

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
method: "GET",

cache: "no-store",

headers: {
Accept:
"application/rss+xml, application/atom+xml, application/xml, text/xml, */*",

"User-Agent":
"Rotation-App-AI-Research-Agent/1.0",
},
}
);

if (!response.ok) {
return {
sources: [],
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
sources: [],
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
sources: [],

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
DEDUPLICATION
===================================================== */

function deduplicateSources(
sources: AIResearchSource[]
): AIResearchSource[] {
const seen =
new Set<string>();

const result:
AIResearchSource[] = [];

for (const source of sources) {
const key =
source.url
.trim()
.toLowerCase();

if (!key) {
continue;
}

if (seen.has(key)) {
continue;
}

seen.add(key);

result.push(source);
}

return result;
}

/* =====================================================
SORT
===================================================== */

function sortByPublishedAt(
sources: AIResearchSource[]
): AIResearchSource[] {
return [...sources].sort(
(a, b) => {
const timestampA =
a.publishedAt
? Date.parse(a.publishedAt)
: 0;

const timestampB =
b.publishedAt
? Date.parse(b.publishedAt)
: 0;

return (
timestampB -
timestampA
);
}
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

const warnings: string[] = [];

let successfulFeeds = 0;

let failedFeeds = 0;

let parsedItems = 0;

const feedResults =
await Promise.all(
applicableFeeds.map(
(feed) =>
fetchFeed(feed)
.then((result) => ({
feed,
result,
}))
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
