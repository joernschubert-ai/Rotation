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
* Tatsächliche Beschaffung externer Quellen.
*
* Aktuell bewusst:
*
* - öffentliche RSS-Feeds
* - keine API-Keys
* - keine KI
* - keine Bewertung
* - keine Tradingentscheidung
*
* Die Funktion liefert ausschließlich externe Fakten
* in der bereits definierten AIResearchSource-Struktur.
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

sourceCount: number;

warnings: string[];
};
}


/* =====================================================
* FEED DEFINITIONS
* =====================================================
*
* Die URLs sind ausschließlich öffentliche Quellen.
*
* Fed:
* offizielles RSS-Angebot der Federal Reserve.
*
* ECB:
* offizielles RSS-Angebot der Europäischen Zentralbank.
*
* =====================================================
*/

const EXTERNAL_FEEDS: ExternalFeedDefinition[] = [

{
name: "Federal Reserve Board",
url:
"https://www.federalreserve.gov/feeds/press_all.xml",
publisher:
"Federal Reserve Board",
category:
"FED_ECB",
},

{
name: "ECB Market Information Dissemination",
url:
"https://mid.ecb.europa.eu/rss/mid.xml",
publisher:
"European Central Bank",
category:
"FED_ECB",
},

];


/* =====================================================
* SAFE HELPERS
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
/<!\[CDATA\[([\s\S]*?)\]\]>/g,
"$1"
)

.replace(
/<[^>]+>/g,
" "
)

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
/\s+/g,
" "
)

.trim();

}


function extractTag(
item: string,
tag: string
): string | undefined {

const escapedTag =
tag.replace(
/[.*+?^${}()|[\]\\]/g,
"\\$&"
);

const expression =
new RegExp(
`<${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTag}>`,
"i"
);

const match =
item.match(expression);

if (
!match?.[1]
) {

return undefined;

}

const value =
cleanText(match[1]);

return value.length > 0
? value
: undefined;

}


function extractLink(
item: string
): string | undefined {

/*
* RSS:
*
* <link>https://...</link>
*
* Atom:
*
* <link href="https://..." />
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


const atomMatch =
item.match(
/<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i
);

if (
atomMatch?.[1]
) {

return atomMatch[1].trim();

}

return undefined;

}


function parseFeedItems(
xml: string,
feed: ExternalFeedDefinition,
maxItems: number
): ExternalResearchSourceInput[] {

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


if (
!title ||
!link
) {

continue;

}


/*
* Nur absolute HTTP(S)-URLs akzeptieren.
*/

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
publishedAt:
new Date(
publishedAt
).toISOString(),
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

/*
* Ungültige URLs werden still verworfen.
*/

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
method: "GET",

headers: {
Accept:
"application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",

"User-Agent":
"rotation-app-ai-research/1.0",
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


return {

sources:
parseFeedItems(
xml,
feed,
maxItems
),

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
* TASK FILTER
* ===================================================== */

function selectFeedsForTask(
task: AIResearchTask
): ExternalFeedDefinition[] {

/*
* Aktuell sind Fed und ECB für alle Research-Aufgaben
* zugelassen.
*
* Die spätere Erweiterung um Nasdaq/Russell/VIX-News
* kann hier ergänzt werden.
*/

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
* MAIN FUNCTION
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


let successfulFeeds = 0;

let failedFeeds = 0;


const rawSources:
ExternalResearchSourceInput[] = [];


/*
* Feeds parallel abrufen.
*/

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

rawSources.push(
...result.sources
);

}


/*
* Gemeinsame Normalisierung aus
* aiResearchSources.ts verwenden.
*/

const normalized =
buildResearchSources({
task: input.task,
sources:
rawSources,
});


return {

sources:
normalized,

diagnostics: {

feedCount:
feeds.length,

successfulFeeds,

failedFeeds,

sourceCount:
normalized.length,

warnings,

},

};

}
