import type {
AIResearchSource,
AIResearchTask,
} from "./aiResearchTypes";

import {
buildResearchSources,
type ExternalResearchSourceInput,
} from "./aiResearchSources";


/*
* =====================================================
* AI RESEARCH EXTERNAL SOURCES
* =====================================================
*
* Beschaffung und Normalisierung externer Quellen.
*
* Aktuell:
*
* - öffentliche RSS/Atom-Feeds
* - keine KI
* - keine Bewertung
* - keine Tradingentscheidung
*
* =====================================================
*/


/* =====================================================
* TYPES
* ===================================================== */

export interface ExternalFeedDefinition {
name: string;
url: string;
publisher: string;

category:
| "MARKET_NEWS"
| "FED_ECB"
| "MACRO"
| "NASDAQ"
| "RUSSELL"
| "VOLATILITY"
| "MARKET_COMMENTARY"
| "OTHER";
}


export interface FetchExternalResearchSourcesInput {
task: AIResearchTask;
maxItemsPerFeed?: number;
timeoutMs?: number;
}


export interface FetchExternalResearchSourcesResult {
sources: AIResearchSource[];

diagnostics: {
feedCount: number;
successfulFeeds: number;
failedFeeds: number;
parsedItems: number;
sourceCount: number;
warnings: string[];
};
}


/* =====================================================
* FEEDS
* ===================================================== */

const EXTERNAL_FEEDS: ExternalFeedDefinition[] = [

{
name:
"Federal Reserve Board",

url:
"https://www.federalreserve.gov/feeds/press_all.xml",

publisher:
"Federal Reserve Board",

category:
"FED_ECB",
},

{
name:
"European Central Bank MID",

url:
"https://mid.ecb.europa.eu/rss/mid.xml",

publisher:
"European Central Bank",

category:
"FED_ECB",
},

];


/* =====================================================
* HELPERS
* ===================================================== */

function clamp(
value: number,
min = 1,
max = 50
): number {

return Math.max(
min,
Math.min(
max,
Math.round(value)
)
);

}


function cleanText(
value: string
): string {

return value

.replace(
/<!\[CDATA\[([\s\S]*?)\]\]>/gi,
"$1"
)

.replace(
/<[^>]+>/g,
" "
)

.replace(
/&amp;/gi,
"&"
)

.replace(
/&lt;/gi,
"<"
)

.replace(
/&gt;/gi,
">"
)

.replace(
/&quot;/gi,
'"'
)

.replace(
/&#39;/gi,
"'"
)

.replace(
/\s+/g,
" "
)

.trim();

}


/* =====================================================
* XML TAG EXTRACTION
* ===================================================== */

function extractTag(
item: string,
tag: string
): string | undefined {

const expression =
new RegExp(
`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
"i"
);


const match =
item.match(
expression
);


if (
!match?.[1]
) {

return undefined;

}


const value =
cleanText(
match[1]
);


return value.length > 0
? value
: undefined;

}


/* =====================================================
* LINK EXTRACTION
* ===================================================== */

function extractLink(
item: string
): string | undefined {

/*
* RSS:
*
* <link>
* https://example.com
* </link>
*/

const rssLink =
extractTag(
item,
"link"
);


if (
rssLink
) {

return rssLink;

}


/*
* Atom:
*
* <link href="https://example.com" />
*/

const atomLink =
item.match(
/<link\b[^>]*?\bhref=["']([^"']+)["'][^>]*\/?>/i
);


if (
atomLink?.[1]
) {

return atomLink[1].trim();

}


return undefined;

}


/* =====================================================
* DATE NORMALIZATION
* ===================================================== */

function normalizePublishedAt(
value?: string
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


/* =====================================================
* FEED ITEM EXTRACTION
* ===================================================== */

function parseFeedItems(
xml: string,
feed: ExternalFeedDefinition,
maxItems: number
): ExternalResearchSourceInput[] {

/*
* RSS 2.0:
*
* <item>...</item>
*
* Atom:
*
* <entry>...</entry>
*/

const items =
xml.match(
/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi
) ?? [];


const result:
ExternalResearchSourceInput[] = [];


for (
const item of items.slice(
0,
maxItems
)
) {

const title =
extractTag(
item,
"title"
);


const link =
extractLink(
item
);


const publishedAt =
normalizePublishedAt(

extractTag(
item,
"pubDate"
) ??

extractTag(
item,
"published"
) ??

extractTag(
item,
"updated"
)

);


const description =
extractTag(
item,
"description"
) ??

extractTag(
item,
"summary"
);


/*
* Titel + Link sind die minimale Voraussetzung
* für eine verwertbare Research-Quelle.
*/

if (
!title ||
!link
) {

continue;

}


try {

const parsedUrl =
new URL(
link,
feed.url
);


if (
parsedUrl.protocol !== "http:" &&
parsedUrl.protocol !== "https:"
) {

continue;

}


result.push({

title,

url:
parsedUrl.toString(),

publisher:
feed.publisher,

...(publishedAt
? {
publishedAt,
}
: {}),

...(description
? {
summary:
description.slice(
0,
2000
),
}
: {}),

category:
feed.category,

relevance:
50,

});

} catch {

continue;

}

}


return result;

}


/* =====================================================
* FETCH ONE FEED
* ===================================================== */

async function fetchExternalFeed(
feed: ExternalFeedDefinition,
maxItems: number,
timeoutMs: number
): Promise<{
sources: ExternalResearchSourceInput[];
error?: string;
}> {

const controller =
new AbortController();


const timeout =
setTimeout(
() => controller.abort(),
timeoutMs
);


try {

const response =
await fetch(
feed.url,
{
method:
"GET",

headers: {

Accept:
"application/rss+xml, application/atom+xml, application/xml, text/xml, text/plain, */*",

"User-Agent":
"Mozilla/5.0 (compatible; rotation-app-ai-research/1.0)",

"Cache-Control":
"no-cache",

},

cache:
"no-store",

signal:
controller.signal,
}
);


if (
!response.ok
) {

return {

sources: [],

error:
`${feed.name}: HTTP ${response.status}`,

};

}


/*
* Entscheidend:
*
* Wir verlassen uns NICHT auf den Content-Type.
*
* Manche Server liefern RSS als:
*
* application/xml
* text/xml
* application/rss+xml
*
* Der Response-Body ist für uns maßgeblich.
*/

const xml =
await response.text();


if (
!xml.trim()
) {

return {

sources: [],

error:
`${feed.name}: empty response`,

};

}


const sources =
parseFeedItems(
xml,
feed,
maxItems
);


if (
sources.length === 0
) {

return {

sources: [],

error:
`${feed.name}: feed fetched successfully but no RSS/Atom items could be parsed`,

};

}


return {

sources,

};

} catch (
error
) {

return {

sources: [],

error:
`${feed.name}: ${
error instanceof Error
? error.message
: "Unknown fetch error"
}`,

};

} finally {

clearTimeout(
timeout
);

}

}


/* =====================================================
* TASK FEED SELECTION
* ===================================================== */

function selectFeedsForTask(
task: AIResearchTask
): ExternalFeedDefinition[] {

switch (
task
) {

case "REGIME_REVIEW":
case "CRASH_RISK_REVIEW":
case "FORWARD_TEST_REVIEW":

return EXTERNAL_FEEDS.filter(
(feed) =>
feed.category === "FED_ECB" ||
feed.category === "MACRO"
);


case "DAILY_MARKET_REVIEW":
case "ROTATION_REVIEW":
case "TRADE_SETUP_REVIEW":
case "ANOMALY_REVIEW":

return EXTERNAL_FEEDS;


default:

return EXTERNAL_FEEDS;

}

}


/* =====================================================
* MAIN
* ===================================================== */

export async function fetchExternalResearchSources(
input: FetchExternalResearchSourcesInput
): Promise<FetchExternalResearchSourcesResult> {

const maxItemsPerFeed =
clamp(
input.maxItemsPerFeed ?? 10
);


const timeoutMs =
Math.max(
2000,
Math.min(
30000,
Math.round(
input.timeoutMs ?? 10000
)
)
);


const feeds =
selectFeedsForTask(
input.task
);


const warnings:
string[] = [];


let successfulFeeds =
0;


let failedFeeds =
0;


let parsedItems =
0;


const rawSources:
ExternalResearchSourceInput[] = [];


const results =
await Promise.all(

feeds.map(
(feed) =>
fetchExternalFeed(
feed,
maxItemsPerFeed,
timeoutMs
)
)

);


for (
const result of results
) {

if (
result.error
) {

failedFeeds++;

warnings.push(
result.error
);

continue;

}


successfulFeeds++;

parsedItems +=
result.sources.length;


rawSources.push(
...result.sources
);

}


const normalized =
buildResearchSources({

task:
input.task,

sources:
rawSources,

});


if (
normalized.length === 0
) {

warnings.push(
"No external research sources were produced."
);

}


return {

sources:
normalized,

diagnostics: {

feedCount:
feeds.length,

successfulFeeds,

failedFeeds,

parsedItems,

sourceCount:
normalized.length,

warnings,

},

};

}
