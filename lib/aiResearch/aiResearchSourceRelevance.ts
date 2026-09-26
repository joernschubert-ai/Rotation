import type {
AIResearchSource,
AIResearchTask,
} from "./aiResearchTypes";


/*
* =====================================================
* AI RESEARCH SOURCE RELEVANCE
* =====================================================
*
* Deterministische Relevanzbewertung externer Quellen.
*
* WICHTIG:
*
* relevance != bullish / bearish
*
* Die Funktion bewertet ausschließlich:
*
* "Wie relevant ist diese Quelle für die
* jeweilige Research-Aufgabe?"
*
* Sie bewertet NICHT:
*
* - Markt-Richtung
* - Crash-Wahrscheinlichkeit
* - Call / Put
* - Trading-Chance
*
* Dadurch bleibt die spätere KI-Interpretation
* strikt von der Quellenpriorisierung getrennt.
*
* =====================================================
*/


/* =====================================================
* TYPES
* ===================================================== */

export interface ScoreResearchSourceInput {

source:
AIResearchSource;

task:
AIResearchTask;

}


export interface RankResearchSourcesResult {

sources:
AIResearchSource[];

diagnostics: {

inputCount:
number;

outputCount:
number;

};

}


/* =====================================================
* CONSTANTS
* ===================================================== */

const MIN_RELEVANCE =
0;

const MAX_RELEVANCE =
100;


/* =====================================================
* HELPERS
* ===================================================== */

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


function normalizeText(
value: unknown
): string {

if (
typeof value !== "string"
) {

return "";

}


return value
.toLowerCase()
.normalize("NFKD")
.replace(
/[\u0300-\u036f]/g,
""
);

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


/* =====================================================
* KEYWORD GROUPS
* ===================================================== */

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

"semiconductor",

"semiconductors",

"chip stocks",

"artificial intelligence",

"ai stocks",

];


const RUSSELL_KEYWORDS = [

"russell",

"russell 2000",

"russell 1000",

"rut",

"iwm",

"small cap",

"small-cap",

"small caps",

];


const VOLATILITY_KEYWORDS = [

"vix",

"volatility",

"implied volatility",

"volatilitaet",

"volatilitat",

"fear index",

"options volatility",

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

];


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

"bank holding company",

];


/* =====================================================
* TASK BASELINE
* ===================================================== */

function taskBaseline(
task: AIResearchTask
): number {

switch (
task
) {

case "DAILY_MARKET_REVIEW":
return 40;

case "REGIME_REVIEW":
return 35;

case "ROTATION_REVIEW":
return 35;

case "CRASH_RISK_REVIEW":
return 35;

case "TRADE_SETUP_REVIEW":
return 30;

case "ANOMALY_REVIEW":
return 30;

case "FORWARD_TEST_REVIEW":
return 30;

default:
return 30;

}

}


/* =====================================================
* KEYWORD SCORE
* ===================================================== */

function containsAny(
text: string,
keywords: string[]
): boolean {

return keywords.some(
(keyword) =>
text.includes(
keyword
)
);

}


/* =====================================================
* TASK-SPECIFIC BOOST
* ===================================================== */

function taskSpecificBoost(
text: string,
task: AIResearchTask
): number {

let boost =
0;


switch (
task
) {

case "DAILY_MARKET_REVIEW":

if (
containsAny(
text,
NASDAQ_KEYWORDS
)
) {

boost += 20;

}

if (
containsAny(
text,
RUSSELL_KEYWORDS
)
) {

boost += 20;

}

if (
containsAny(
text,
MARKET_STRUCTURE_KEYWORDS
)
) {

boost += 15;

}

break;


case "REGIME_REVIEW":

if (
containsAny(
text,
VERY_HIGH_IMPACT_KEYWORDS
)
) {

boost += 25;

}

if (
containsAny(
text,
MACRO_KEYWORDS
)
) {

boost += 20;

}

if (
containsAny(
text,
VOLATILITY_KEYWORDS
)
) {

boost += 15;

}

break;


case "ROTATION_REVIEW":

if (
containsAny(
text,
NASDAQ_KEYWORDS
)
) {

boost += 25;

}

if (
containsAny(
text,
RUSSELL_KEYWORDS
)
) {

boost += 25;

}

if (
containsAny(
text,
MARKET_STRUCTURE_KEYWORDS
)
) {

boost += 20;

}

break;


case "CRASH_RISK_REVIEW":

if (
containsAny(
text,
VERY_HIGH_IMPACT_KEYWORDS
)
) {

boost += 15;

}

if (
containsAny(
text,
MACRO_KEYWORDS
)
) {

boost += 20;

}

if (
containsAny(
text,
VOLATILITY_KEYWORDS
)
) {

boost += 30;

}

if (
containsAny(
text,
MARKET_STRUCTURE_KEYWORDS
)
) {

boost += 15;

}

break;


case "TRADE_SETUP_REVIEW":

if (
containsAny(
text,
NASDAQ_KEYWORDS
)
) {

boost += 25;

}

if (
containsAny(
text,
RUSSELL_KEYWORDS
)
) {

boost += 25;

}

if (
containsAny(
text,
VOLATILITY_KEYWORDS
)
) {

boost += 15;

}

break;


case "ANOMALY_REVIEW":

if (
containsAny(
text,
MARKET_STRUCTURE_KEYWORDS
)
) {

boost += 25;

}

if (
containsAny(
text,
VOLATILITY_KEYWORDS
)
) {

boost += 20;

}

if (
containsAny(
text,
NASDAQ_KEYWORDS
)
) {

boost += 15;

}

if (
containsAny(
text,
RUSSELL_KEYWORDS
)
) {

boost += 15;

}

break;


case "FORWARD_TEST_REVIEW":

if (
containsAny(
text,
NASDAQ_KEYWORDS
)
) {

boost += 15;

}

if (
containsAny(
text,
RUSSELL_KEYWORDS
)
) {

boost += 15;

}

if (
containsAny(
text,
MACRO_KEYWORDS
)
) {

boost += 20;

}

break;

}


return boost;

}


/* =====================================================
* RECENCY
* ===================================================== */

function recencyAdjustment(
source: AIResearchSource
): number {

if (
!source.publishedAt
) {

return -5;

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

return -5;

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


/*
* Neue Quellen werden leicht bevorzugt.
*
* Die Aktualität darf aber niemals die
* thematische Relevanz vollständig überstimmen.
*/

if (
ageHours <= 6
) {

return 10;

}


if (
ageHours <= 24
) {

return 7;

}


if (
ageHours <= 72
) {

return 4;

}


if (
ageHours <= 168
) {

return 1;

}


return -5;

}


/* =====================================================
* LOW DIRECT RELEVANCE
* ===================================================== */

function lowDirectRelevanceAdjustment(
text: string
): number {

if (
containsAny(
text,
LOW_DIRECT_RELEVANCE_KEYWORDS
)
) {

return -20;

}


return 0;

}


/* =====================================================
* SOURCE SCORING
* ===================================================== */

/**
* Berechnet ausschließlich die thematische Relevanz
* einer Quelle für die aktuelle Research-Aufgabe.
*/
export function scoreResearchSourceRelevance(
input: ScoreResearchSourceInput
): number {

const {
source,
task,
} = input;


const text =
sourceText(
source
);


let score =
taskBaseline(
task
);


/*
* Offizielle Fed-/ECB-Quellen erhalten einen
* moderaten Vertrauens-/Primärquellenbonus.
*
* Dies ist kein Bull/Bear-Signal.
*/

const publisher =
normalizeText(
source.publisher
);


if (
publisher.includes(
"federal reserve"
) ||
publisher.includes(
"european central bank"
)
) {

score += 10;

}


/*
* Sehr wichtige geldpolitische Ereignisse.
*/

if (
containsAny(
text,
VERY_HIGH_IMPACT_KEYWORDS
)
) {

score += 25;

}


/*
* Makroökonomische Daten.
*/

if (
containsAny(
text,
MACRO_KEYWORDS
)
) {

score += 15;

}


/*
* Nasdaq.
*/

if (
containsAny(
text,
NASDAQ_KEYWORDS
)
) {

score += 15;

}


/*
* Russell / Small Caps.
*/

if (
containsAny(
text,
RUSSELL_KEYWORDS
)
) {

score += 15;

}


/*
* Volatilität.
*/

if (
containsAny(
text,
VOLATILITY_KEYWORDS
)
) {

score += 15;

}


/*
* Marktstruktur.
*/

if (
containsAny(
text,
MARKET_STRUCTURE_KEYWORDS
)
) {

score += 10;

}


/*
* Aufgaben-spezifische Relevanz.
*/

score +=
taskSpecificBoost(
text,
task
);


/*
* Aktualität.
*/

score +=
recencyAdjustment(
source
);


/*
* Quellen mit rein operativem / regulatorischem
* Charakter werden für den Markt-Research
* heruntergestuft.
*/

score +=
lowDirectRelevanceAdjustment(
text
);


return clamp(
score
);

}


/* =====================================================
* RANK SOURCES
* ===================================================== */

export function rankResearchSources(
sources: AIResearchSource[],
task: AIResearchTask
): RankResearchSourcesResult {

const ranked =
sources.map(
(source) => ({

...source,

relevance:
scoreResearchSourceRelevance({

source,

task,

}),

})
);


ranked.sort(
(a, b) => {

const relevanceDifference =
(b.relevance ?? 0) -
(a.relevance ?? 0);


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

sources:
ranked,

diagnostics: {

inputCount:
sources.length,

outputCount:
ranked.length,

},

};

}


/* =====================================================
* LIMIT SOURCES
* ===================================================== */

/**
* Begrenzt die Zahl der Quellen, die später an ein
* LLM übergeben werden.
*
* Dadurch bleibt der Research-Kontext kontrollierbar.
*/
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
