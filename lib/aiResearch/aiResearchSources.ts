import type {
AIResearchSource,
AIResearchTask,
} from "./aiResearchTypes";

/*
* =====================================================
* AI RESEARCH SOURCES
* =====================================================
*
* Diese Datei ist ausschließlich für die Strukturierung
* externer Recherchequellen zuständig.
*
* WICHTIG:
*
* - Keine KI
* - Keine Bewertung
* - Keine Tradingentscheidung
* - Keine Änderung bestehender Engine-Werte
* - Keine automatische Interpretation
*
* Die spätere AI-Schicht bekommt hier ausschließlich
* strukturierte externe Fakten.
*
* Architektur:
*
* External source
* ↓
* normalizeResearchSource()
* ↓
* AIResearchSource
* ↓
* später:
* AI Research Engine / LLM
*
* =====================================================
*/


/* =====================================================
TYPES
===================================================== */

export type AIResearchSourceCategory =
| "MARKET_NEWS"
| "FED_ECB"
| "MACRO"
| "NASDAQ"
| "RUSSELL"
| "VOLATILITY"
| "MARKET_COMMENTARY"
| "OTHER";


export interface ExternalResearchSourceInput {
title: string;

url: string;

publisher?: string;

publishedAt?: string;

summary?: string;

category?: AIResearchSourceCategory;

relevance?: number;
}


/* =====================================================
SAFE HELPERS
===================================================== */

function clamp(
value: number,
min = 0,
max = 100
): number {

return Math.max(
min,
Math.min(
max,
value
)
);

}


function cleanString(
value: unknown
): string | undefined {

if (
typeof value !== "string"
) {

return undefined;

}

const cleaned =
value.trim();

return cleaned.length > 0
? cleaned
: undefined;

}


function isValidUrl(
value: string
): boolean {

try {

const url =
new URL(value);

return (
url.protocol === "http:" ||
url.protocol === "https:"
);

} catch {

return false;

}

}


/* =====================================================
CATEGORY DETECTION
===================================================== */

/*
* Automatische Kategorieerkennung bleibt bewusst
* konservativ.
*
* Sie bewertet nicht die Nachricht.
*
* Sie ordnet lediglich eine Quelle thematisch ein.
*/

export function detectResearchSourceCategory(
input: ExternalResearchSourceInput
): AIResearchSourceCategory {

const text = [

input.title,

input.publisher,

input.summary,

]
.filter(Boolean)
.join(" ")
.toLowerCase();


if (
text.includes("fed") ||
text.includes("federal reserve") ||
text.includes("ecb") ||
text.includes("european central bank")
) {

return "FED_ECB";

}


if (
text.includes("inflation") ||
text.includes("cpi") ||
text.includes("ppi") ||
text.includes("jobs") ||
text.includes("employment") ||
text.includes("payroll") ||
text.includes("gdp") ||
text.includes("pce") ||
text.includes("macro")
) {

return "MACRO";

}


if (
text.includes("nasdaq") ||
text.includes("nasdaq 100") ||
text.includes("ndx") ||
text.includes("qqq")
) {

return "NASDAQ";

}


if (
text.includes("russell") ||
text.includes("russell 2000") ||
text.includes("rut") ||
text.includes("iwm")
) {

return "RUSSELL";

}


if (
text.includes("vix") ||
text.includes("volatility") ||
text.includes("volatilität")
) {

return "VOLATILITY";

}


if (
text.includes("market outlook") ||
text.includes("market commentary") ||
text.includes("börsen") ||
text.includes("aktienmarkt") ||
text.includes("stock market")
) {

return "MARKET_COMMENTARY";

}


return (
input.category ??
"MARKET_NEWS"
);

}


/* =====================================================
NORMALIZATION
===================================================== */

/*
* Wandelt externe Quellen in das bereits definierte
* AIResearchSource-Format um.
*
* Dadurch bleibt die AI-Schicht unabhängig davon,
* aus welcher Quelle die Daten ursprünglich stammen.
*/

export function normalizeResearchSource(
input: ExternalResearchSourceInput
): AIResearchSource | null {

const title =
cleanString(input.title);

const url =
cleanString(input.url);


if (
!title ||
!url ||
!isValidUrl(url)
) {

return null;

}


const publisher =
cleanString(input.publisher);

const publishedAt =
cleanString(input.publishedAt);

const summary =
cleanString(input.summary);


const relevance =
typeof input.relevance === "number" &&
Number.isFinite(input.relevance)
? Math.round(
clamp(input.relevance)
)
: undefined;


return {

title,

url,

...(publisher
? { publisher }
: {}),

...(publishedAt
? { publishedAt }
: {}),

...(summary
? { summary }
: {}),

...(relevance !== undefined
? { relevance }
: {}),

};

}


/* =====================================================
DEDUPLICATION
===================================================== */

/*
* Mehrfach auftauchende Quellen werden anhand ihrer
* URL entfernt.
*
* Die erste Quelle bleibt erhalten.
*/

export function deduplicateResearchSources(
sources: AIResearchSource[]
): AIResearchSource[] {

const seen =
new Set<string>();

const result:
AIResearchSource[] = [];


for (
const source of sources
) {

if (
!source ||
typeof source.url !== "string"
) {

continue;

}


const normalizedUrl =
source.url
.trim()
.toLowerCase();


if (
seen.has(normalizedUrl)
) {

continue;

}


seen.add(
normalizedUrl
);

result.push(
source
);

}


return result;

}


/* =====================================================
SORTING
===================================================== */

/*
* Quellen werden standardmäßig nach Aktualität
* sortiert.
*
* Quellen ohne Datum bleiben erhalten und landen
* am Ende.
*/

export function sortResearchSources(
sources: AIResearchSource[]
): AIResearchSource[] {

return [
...sources,

].sort(
(a, b) => {

const timeA =
a.publishedAt
? new Date(
a.publishedAt
).getTime()
: Number.NEGATIVE_INFINITY;


const timeB =
b.publishedAt
? new Date(
b.publishedAt
).getTime()
: Number.NEGATIVE_INFINITY;


return (
timeB -
timeA
);

}
);

}


/* =====================================================
TASK FILTER
===================================================== */

/*
* Die Research-Aufgabe kann später bestimmen,
* welche Quellen besonders relevant sind.
*
* Hier erfolgt noch KEINE inhaltliche Bewertung.
*/

export function filterResearchSourcesForTask(
sources: AIResearchSource[],
task: AIResearchTask
): AIResearchSource[] {

if (
sources.length === 0
) {

return [];

}


const categoryMap:
Partial<
Record<
AIResearchTask,
AIResearchSourceCategory[]
>
> = {

DAILY_MARKET_REVIEW: [
"MARKET_NEWS",
"NASDAQ",
"RUSSELL",
"VOLATILITY",
"MARKET_COMMENTARY",
"MACRO",
"FED_ECB",
],

REGIME_REVIEW: [
"MARKET_NEWS",
"MACRO",
"FED_ECB",
"VOLATILITY",
"MARKET_COMMENTARY",
],

ROTATION_REVIEW: [
"NASDAQ",
"RUSSELL",
"MARKET_NEWS",
"MARKET_COMMENTARY",
],

CRASH_RISK_REVIEW: [
"VOLATILITY",
"MACRO",
"FED_ECB",
"MARKET_NEWS",
"MARKET_COMMENTARY",
],

TRADE_SETUP_REVIEW: [
"NASDAQ",
"RUSSELL",
"VOLATILITY",
"MARKET_NEWS",
"MARKET_COMMENTARY",
],

ANOMALY_REVIEW: [
"MARKET_NEWS",
"NASDAQ",
"RUSSELL",
"VOLATILITY",
"MACRO",
"FED_ECB",
],

FORWARD_TEST_REVIEW: [
"MARKET_NEWS",
"NASDAQ",
"RUSSELL",
"MACRO",
"FED_ECB",
"VOLATILITY",
],

};


const allowedCategories =
categoryMap[task];


if (
!allowedCategories
) {

return [
...sources,
];

}


return sources.filter(
(source) => {

/*
* Quellen ohne Kategorie werden nicht
* automatisch ausgeschlossen.
*
* Sie bleiben für die spätere KI sichtbar.
*/

return true;

}
);

}


/* =====================================================
SOURCE PIPELINE
===================================================== */

/*
* Zentrale Funktion für den späteren Research-Runner.
*
* Pipeline:
*
* 1. Normalize
* 2. Remove invalid sources
* 3. Deduplicate
* 4. Sort by publication date
* 5. Task-specific selection
*
* Noch KEINE externe API-Abfrage.
*/

export interface BuildResearchSourcesInput {

task: AIResearchTask;

sources?: ExternalResearchSourceInput[];

}


export function buildResearchSources(
input: BuildResearchSourcesInput
): AIResearchSource[] {

const sources =
Array.isArray(input.sources)
? input.sources
: [];


const normalized =
sources

.map(
normalizeResearchSource
)

.filter(
(
source
): source is AIResearchSource =>
source !== null
);


const deduplicated =
deduplicateResearchSources(
normalized
);


const sorted =
sortResearchSources(
deduplicated
);


return filterResearchSourcesForTask(
sorted,
input.task
);

}
