// /lib/aiResearch/aiResearchExternalEvidence.ts

import type {
AIResearchEvidenceBlock,
AIResearchEvidenceState,
AIResearchEvidenceStrength,
AIResearchSource,
AIResearchStructuralBias,
} from "./aiResearchTypes";


/* =====================================================
TYPES
===================================================== */

/*
* External research is supplementary evidence.
*
* This module does NOT:
*
* - change Rotation-App engine values
* - change Master Score
* - create execution signals
* - change position sizing
* - convert source relevance into market direction
*
* It only interprets already selected external
* research sources relative to the current structural
* research thesis.
*/

type ExternalDirectionalState =
| "BULLISH"
| "BEARISH"
| "NEUTRAL"
| "UNRESOLVED";


type ExternalTopic =
| "FED_MONETARY_POLICY"
| "INFLATION"
| "LABOR"
| "TREASURY_YIELDS"
| "FINANCIAL_CONDITIONS"
| "VOLATILITY"
| "MARKET_BREADTH"
| "EQUITY_LEADERSHIP"
| "GEOPOLITICAL_RISK"
| "MACRO"
| "OTHER";


interface ExternalSourceInterpretation {

source: AIResearchSource;

topic: ExternalTopic;

direction: ExternalDirectionalState;

confidence: number;

relevance: number;

reason: string;

usable: boolean;

}


/* =====================================================
GENERIC HELPERS
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


function normalizeText(
value: string | undefined
): string {

if (!value) {

return "";

}


return value
.toLowerCase()
.replace(
/&nbsp;|&#160;/g,
" "
)
.replace(
/&amp;/g,
"&"
)
.replace(
/<[^>]*>/g,
" "
)
.replace(
/[^a-z0-9%+\-.\s]/g,
" "
)
.replace(
/\s+/g,
" "
)
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


function sourceContentText(
source: AIResearchSource
): string {

return normalizeText(
[
source.title,
source.summary,
]
.filter(Boolean)
.join(" ")
);

}


function containsAny(
text: string,
terms: string[]
): boolean {

return terms.some(
(term) =>
text.includes(
term
)
);

}


function countMatches(
text: string,
terms: string[]
): number {

return terms.reduce(
(
total,
term
) =>
text.includes(term)
? total + 1
: total,
0
);

}


function relevanceValue(
source: AIResearchSource
): number {

const value =
Number(
source.relevance
);


if (
!Number.isFinite(value)
) {

return 50;

}


return clamp(
value
);

}


function hasMeaningfulSummary(
source: AIResearchSource
): boolean {

return normalizeText(
source.summary
).length >= 40;

}


function uniqueStrings(
values: string[]
): string[] {

return [
...new Set(
values.filter(
(value) =>
value.trim().length > 0
)
),
];

}


/* =====================================================
SOURCE CLASSIFICATION
===================================================== */

function detectTopic(
source: AIResearchSource
): ExternalTopic {

const text =
sourceText(
source
);


if (
containsAny(
text,
[
"fomc",
"federal reserve",
"fed ",
"fed.",
"monetary policy",
"interest rate",
"interest rates",
"rate cut",
"rate cuts",
"rate hike",
"rate hikes",
"policy rate",
"federal funds",
"economic projections",
"dot plot",
"powell",
]
)
) {

return "FED_MONETARY_POLICY";

}


if (
containsAny(
text,
[
"inflation",
"consumer price index",
"cpi",
"personal consumption expenditures",
"pce",
"core pce",
"core inflation",
"price pressures",
"price pressure",
]
)
) {

return "INFLATION";

}


if (
containsAny(
text,
[
"jobs report",
"employment report",
"nonfarm payroll",
"nonfarm payrolls",
"payrolls",
"unemployment",
"jobless claims",
"labor market",
"labour market",
"employment",
"wage growth",
"wages",
]
)
) {

return "LABOR";

}


if (
containsAny(
text,
[
"treasury yield",
"treasury yields",
"10 year yield",
"10-year yield",
"2 year yield",
"2-year yield",
"bond yield",
"bond yields",
"yield curve",
"treasuries",
]
)
) {

return "TREASURY_YIELDS";

}


if (
containsAny(
text,
[
"financial conditions",
"credit spread",
"credit spreads",
"funding stress",
"funding conditions",
"liquidity conditions",
"liquidity stress",
"tightening financial conditions",
"easing financial conditions",
]
)
) {

return "FINANCIAL_CONDITIONS";

}


if (
containsAny(
text,
[
"vix",
"volatility index",
"market volatility",
"implied volatility",
"volatility spike",
"volatility surge",
"volatility falls",
"volatility declines",
]
)
) {

return "VOLATILITY";

}


if (
containsAny(
text,
[
"market breadth",
"breadth",
"advance decline",
"advance-decline",
"advancers",
"decliners",
"new highs",
"new lows",
"participation",
"equal weight",
"equal-weight",
]
)
) {

return "MARKET_BREADTH";

}


if (
containsAny(
text,
[
"nasdaq",
"russell 2000",
"small cap",
"small-cap",
"small caps",
"small-caps",
"semiconductor",
"semiconductors",
"chip stocks",
"technology stocks",
"tech stocks",
"mega cap",
"mega-cap",
"market leadership",
"equity leadership",
]
)
) {

return "EQUITY_LEADERSHIP";

}


if (
containsAny(
text,
[
"war",
"ceasefire",
"geopolitical",
"geopolitical risk",
"iran",
"israel",
"ukraine",
"russia",
"china tensions",
"trade war",
"tariff",
"tariffs",
"sanctions",
"military conflict",
]
)
) {

return "GEOPOLITICAL_RISK";

}


if (
containsAny(
text,
[
"gdp",
"economic growth",
"recession",
"soft landing",
"hard landing",
"economic slowdown",
"economic activity",
"consumer spending",
"manufacturing",
"services activity",
"ism",
"pmi",
]
)
) {

return "MACRO";

}


return "OTHER";

}


/* =====================================================
DIRECTIONAL LANGUAGE
===================================================== */

/*
* These phrases are intentionally conservative.
*
* We do not attempt full natural-language sentiment
* analysis here.
*
* The purpose is to recognize only relatively clear
* market-relevant directional information.
*/

const BULLISH_TERMS = [

"rate cut",
"rate cuts",
"cuts rates",
"cut rates",
"dovish",
"easing policy",
"policy easing",
"monetary easing",

"inflation cools",
"inflation cooled",
"inflation falls",
"inflation fell",
"inflation declines",
"inflation declined",
"inflation eases",
"inflation eased",
"inflation slows",
"inflation slowed",
"disinflation",

"yields fall",
"yields fell",
"yields decline",
"yields declined",
"yield falls",
"yield fell",
"yield declines",
"yield declined",

"financial conditions ease",
"financial conditions eased",
"financial conditions loosen",
"financial conditions loosened",

"volatility falls",
"volatility fell",
"volatility declines",
"volatility declined",
"vix falls",
"vix fell",
"vix declines",
"vix declined",

"breadth improves",
"breadth improved",
"breadth broadens",
"breadth broadened",
"participation improves",
"participation improved",
"broader participation",

"stocks rise",
"stocks rose",
"stocks rally",
"stocks rallied",
"equities rise",
"equities rose",
"market rises",
"market rose",
"market rally",
"markets rally",

"ceasefire",
"de-escalation",
"deescalation",

];


const BEARISH_TERMS = [

"rate hike",
"rate hikes",
"raises rates",
"raised rates",
"higher for longer",
"hawkish",
"tightening policy",
"policy tightening",
"monetary tightening",

"inflation rises",
"inflation rose",
"inflation accelerates",
"inflation accelerated",
"inflation heats up",
"inflation heated up",
"inflation hotter",
"persistent inflation",
"sticky inflation",
"price pressures rise",
"price pressures increased",

"yields rise",
"yields rose",
"yields climb",
"yields climbed",
"yields surge",
"yields surged",
"yield rises",
"yield rose",
"yield climbs",
"yield climbed",

"financial conditions tighten",
"financial conditions tightened",
"credit spreads widen",
"credit spreads widened",
"funding stress",

"volatility rises",
"volatility rose",
"volatility spikes",
"volatility spiked",
"volatility surge",
"volatility surged",
"vix rises",
"vix rose",
"vix spikes",
"vix spiked",
"vix surge",
"vix surged",

"breadth deteriorates",
"breadth deteriorated",
"breadth weakens",
"breadth weakened",
"narrow breadth",
"participation weakens",
"participation weakened",
"fewer stocks",
"new lows rise",

"stocks fall",
"stocks fell",
"stocks drop",
"stocks dropped",
"stocks sell off",
"stock selloff",
"stock sell-off",
"equities fall",
"equities fell",
"market falls",
"market fell",
"market selloff",
"market sell-off",

"recession risk",
"growth slowdown",
"economic slowdown",

"escalation",
"military escalation",
"geopolitical tensions rise",

];


/* =====================================================
TOPIC-SPECIFIC DIRECTION
===================================================== */

function determineTopicDirection(
source: AIResearchSource,
topic: ExternalTopic
): ExternalDirectionalState {

const text =
sourceContentText(
source
);


if (!text) {

return "UNRESOLVED";

}


const bullishMatches =
countMatches(
text,
BULLISH_TERMS
);


const bearishMatches =
countMatches(
text,
BEARISH_TERMS
);


/*
* Topic-specific overrides are useful where generic
* market language could otherwise be misleading.
*/


if (
topic === "LABOR"
) {

const clearlyWeakLabor =
containsAny(
text,
[
"jobs miss",
"payrolls miss",
"weaker jobs",
"weak jobs",
"unemployment rises",
"unemployment rose",
"jobless claims rise",
"jobless claims rose",
"labor market weakens",
"labor market weakened",
]
);


const clearlyStrongLabor =
containsAny(
text,
[
"jobs beat",
"payrolls beat",
"strong jobs",
"stronger jobs",
"unemployment falls",
"unemployment fell",
"jobless claims fall",
"jobless claims fell",
"labor market remains strong",
]
);


/*
* Labor data have two competing transmission
* channels:
*
* weak labor:
* growth-negative but potentially rate-positive
*
* strong labor:
* growth-positive but potentially rate-negative
*
* Without explicit policy / market context we do
* not force a bullish or bearish interpretation.
*/

if (
clearlyWeakLabor ||
clearlyStrongLabor
) {

return "NEUTRAL";

}

}


if (
topic === "GEOPOLITICAL_RISK"
) {

const deEscalation =
containsAny(
text,
[
"ceasefire",
"de-escalation",
"deescalation",
"peace agreement",
"peace deal",
]
);


const escalation =
containsAny(
text,
[
"military escalation",
"conflict escalates",
"war escalates",
"geopolitical tensions rise",
"attack expands",
"sanctions escalate",
]
);


if (
deEscalation &&
!escalation
) {

return "BULLISH";

}


if (
escalation &&
!deEscalation
) {

return "BEARISH";

}

}


if (
bullishMatches > 0 &&
bearishMatches === 0
) {

return "BULLISH";

}


if (
bearishMatches > 0 &&
bullishMatches === 0
) {

return "BEARISH";

}


if (
bullishMatches > bearishMatches &&
bullishMatches >= 2
) {

return "BULLISH";

}


if (
bearishMatches > bullishMatches &&
bearishMatches >= 2
) {

return "BEARISH";

}


if (
bullishMatches > 0 ||
bearishMatches > 0
) {

return "NEUTRAL";

}


return "UNRESOLVED";

}


/* =====================================================
SOURCE CONFIDENCE
===================================================== */

function sourceInterpretationConfidence(
source: AIResearchSource,
topic: ExternalTopic,
direction: ExternalDirectionalState
): number {

const relevance =
relevanceValue(
source
);


const summaryAvailable =
hasMeaningfulSummary(
source
);


let confidence =
20;


/*
* Relevance contributes to confidence that the
* document matters to the research question.
*
* It does NOT determine market direction.
*/

confidence +=
relevance * 0.35;


if (
topic !== "OTHER"
) {

confidence +=
10;

}


if (
summaryAvailable
) {

confidence +=
10;

}


if (
direction === "BULLISH" ||
direction === "BEARISH"
) {

confidence +=
10;

}


if (
direction === "UNRESOLVED"
) {

confidence -=
15;

}


/*
* Headline-only interpretation receives a hard cap.
*
* This is particularly important for Google News
* items where we intentionally do not treat RSS
* aggregation markup as a reliable article summary.
*/

if (
!summaryAvailable
) {

confidence =
Math.min(
confidence,
55
);

}


return Math.round(
clamp(
confidence
)
);

}


/* =====================================================
SOURCE INTERPRETATION
===================================================== */

function buildSourceInterpretation(
source: AIResearchSource
): ExternalSourceInterpretation {

const topic =
detectTopic(
source
);


const direction =
determineTopicDirection(
source,
topic
);


const relevance =
relevanceValue(
source
);


const confidence =
sourceInterpretationConfidence(
source,
topic,
direction
);


const usable =
relevance >= 50 &&
topic !== "OTHER";


let reason =
"The source is relevant but does not contain sufficiently clear directional information.";


if (
direction === "BULLISH"
) {

reason =
"The source contains relatively clear market-supportive directional information.";

}

else if (
direction === "BEARISH"
) {

reason =
"The source contains relatively clear market-defensive directional information.";

}

else if (
direction === "NEUTRAL"
) {

reason =
"The source contains market-relevant information with competing or ambiguous transmission channels.";

}


return {

source,

topic,

direction,

confidence,

relevance,

reason,

usable,

};

}


/* =====================================================
STRUCTURAL THESIS CLASSIFICATION
===================================================== */

function classifyDirectionAgainstStructuralBias(
direction: ExternalDirectionalState,
structuralBias: AIResearchStructuralBias
): AIResearchEvidenceState {

if (
direction === "UNRESOLVED" ||
direction === "NEUTRAL"
) {

return "UNRESOLVED";

}


if (
structuralBias === "BEARISH"
) {

return direction === "BEARISH"
? "SUPPORTS"
: "CONTRADICTS";

}


if (
structuralBias === "BULLISH"
) {

return direction === "BULLISH"
? "SUPPORTS"
: "CONTRADICTS";

}


return "UNRESOLVED";

}


/* =====================================================
EVIDENCE TEXT
===================================================== */

function topicLabel(
topic: ExternalTopic
): string {

switch (topic) {

case "FED_MONETARY_POLICY":
return "Fed / monetary policy";

case "INFLATION":
return "Inflation";

case "LABOR":
return "Labor market";

case "TREASURY_YIELDS":
return "Treasury yields";

case "FINANCIAL_CONDITIONS":
return "Financial conditions";

case "VOLATILITY":
return "Volatility";

case "MARKET_BREADTH":
return "Market breadth";

case "EQUITY_LEADERSHIP":
return "Equity leadership";

case "GEOPOLITICAL_RISK":
return "Geopolitical risk";

case "MACRO":
return "Macro";

case "OTHER":
default:
return "Other";

}

}


function buildEvidenceText(
interpretation: ExternalSourceInterpretation
): string {

const publisher =
interpretation.source.publisher
? ` — ${interpretation.source.publisher}`
: "";


return [
`${topicLabel(
interpretation.topic
)}:`,
`"${interpretation.source.title}"${publisher}.`,
`Direction ${interpretation.direction}.`,
`Interpretation confidence ${interpretation.confidence}.`,
`Source relevance ${Math.round(
interpretation.relevance
)}.`,
].join(" ");

}


/* =====================================================
AGGREGATION HELPERS
===================================================== */

function weightedDirectionalScore(
interpretation: ExternalSourceInterpretation
): number {

if (
interpretation.direction !== "BULLISH" &&
interpretation.direction !== "BEARISH"
) {

return 0;

}


const direction =
interpretation.direction === "BULLISH"
? 1
: -1;


const relevanceWeight =
clamp(
interpretation.relevance
) / 100;


const confidenceWeight =
clamp(
interpretation.confidence
) / 100;


return (
direction *
relevanceWeight *
confidenceWeight
);

}


function evidenceStrength(
directionalCount: number,
agreementShare: number
): AIResearchEvidenceStrength {

if (
directionalCount >= 5 &&
agreementShare >= 0.8
) {

return "HIGH";

}


if (
directionalCount >= 3 &&
agreementShare >= 0.67
) {

return "MODERATE";

}


return "LOW";

}


/* =====================================================
PUBLIC EXTERNAL EVIDENCE BUILDER
===================================================== */

export function buildExternalEvidence(
sources: AIResearchSource[],
structuralBias: AIResearchStructuralBias
): AIResearchEvidenceBlock {

if (
sources.length === 0
) {

return {

category:
"EXTERNAL",

state:
"NOT_AVAILABLE",

strength:
"LOW",

confidence:
0,

summary:
"No external research sources are available.",

evidence:
[],

};

}


const interpretations =
sources.map(
(source) =>
buildSourceInterpretation(
source
)
);


const usable =
interpretations.filter(
(item) =>
item.usable
);


const directional =
usable.filter(
(item) =>
item.direction === "BULLISH" ||
item.direction === "BEARISH"
);


const bullish =
directional.filter(
(item) =>
item.direction === "BULLISH"
);


const bearish =
directional.filter(
(item) =>
item.direction === "BEARISH"
);


const unresolved =
usable.filter(
(item) =>
item.direction === "UNRESOLVED" ||
item.direction === "NEUTRAL"
);


const totalDirectionalScore =
directional.reduce(
(
total,
item
) =>
total +
weightedDirectionalScore(
item
),
0
);


const absoluteDirectionalWeight =
directional.reduce(
(
total,
item
) =>
total +
Math.abs(
weightedDirectionalScore(
item
)
),
0
);


const normalizedDirection =
absoluteDirectionalWeight > 0
? totalDirectionalScore /
absoluteDirectionalWeight
: 0;


let aggregateDirection:
ExternalDirectionalState =
"UNRESOLVED";


if (
directional.length > 0
) {

if (
normalizedDirection >= 0.35
) {

aggregateDirection =
"BULLISH";

}

else if (
normalizedDirection <= -0.35
) {

aggregateDirection =
"BEARISH";

}

else {

aggregateDirection =
"NEUTRAL";

}

}


const state =
classifyDirectionAgainstStructuralBias(
aggregateDirection,
structuralBias
);


const dominantCount =
Math.max(
bullish.length,
bearish.length
);


const agreementShare =
directional.length > 0
? dominantCount /
directional.length
: 0;


/*
* External research is deliberately capped at HIGH.
*
* It is supplementary evidence and must not dominate
* structure, trusted Rotation-App history, price,
* rotation or liquidity.
*/

const strength =
evidenceStrength(
directional.length,
agreementShare
);


const averageDirectionalConfidence =
directional.length > 0
? directional.reduce(
(
total,
item
) =>
total +
item.confidence,
0
) /
directional.length
: 0;


const sourceCoverage =
sources.length > 0
? usable.length /
sources.length
: 0;


const directionalCoverage =
usable.length > 0
? directional.length /
usable.length
: 0;


/*
* Confidence is intentionally conservative.
*
* A large number of headlines must not create false
* certainty. Confidence therefore depends on:
*
* - interpretation confidence
* - usable source coverage
* - directional coverage
* - agreement between directional sources
*/

const confidence =
directional.length > 0
? clamp(
averageDirectionalConfidence *
0.55 +
sourceCoverage *
15 +
directionalCoverage *
15 +
agreementShare *
15
)
: clamp(
15 +
sourceCoverage *
25
);


const evidence:
string[] = [];


evidence.push(
`${sources.length} ranked external research source(s) were supplied; ${usable.length} were classified as market-relevant and ${directional.length} contained sufficiently clear directional information.`
);


evidence.push(
`Directional external evidence: ${bullish.length} bullish, ${bearish.length} bearish, ${unresolved.length} neutral/unresolved.`
);


/*
* Keep the most relevant / highest-confidence
* interpretations visible and auditable.
*
* We deliberately do not dump every source into the
* evidence block because the report already retains
* the complete ranked source list separately.
*/

const visibleInterpretations =
[...usable]
.sort(
(a, b) => {

const directionPriorityA =
a.direction === "BULLISH" ||
a.direction === "BEARISH"
? 1
: 0;

const directionPriorityB =
b.direction === "BULLISH" ||
b.direction === "BEARISH"
? 1
: 0;


if (
directionPriorityA !==
directionPriorityB
) {

return (
directionPriorityB -
directionPriorityA
);

}


if (
b.confidence !==
a.confidence
) {

return (
b.confidence -
a.confidence
);

}


return (
b.relevance -
a.relevance
);

}
)
.slice(
0,
6
);


for (
const interpretation of visibleInterpretations
) {

evidence.push(
buildEvidenceText(
interpretation
)
);

}


let summary =
"External research is available but does not yet provide sufficiently clear directional confirmation.";


if (
aggregateDirection === "BULLISH"
) {

if (
state === "SUPPORTS"
) {

summary =
"External research is directionally bullish and supports the current structural thesis.";

}

else if (
state === "CONTRADICTS"
) {

summary =
"External research is directionally bullish and contradicts the current structural thesis.";

}

else {

summary =
"External research is directionally bullish, but the current structural thesis is not directional enough for clean confirmation classification.";

}

}

else if (
aggregateDirection === "BEARISH"
) {

if (
state === "SUPPORTS"
) {

summary =
"External research is directionally bearish and supports the current structural thesis.";

}

else if (
state === "CONTRADICTS"
) {

summary =
"External research is directionally bearish and contradicts the current structural thesis.";

}

else {

summary =
"External research is directionally bearish, but the current structural thesis is not directional enough for clean confirmation classification.";

}

}

else if (
aggregateDirection === "NEUTRAL"
) {

summary =
"External research contains conflicting bullish and bearish information and therefore remains directionally neutral.";

}


return {

category:
"EXTERNAL",

state,

strength,

confidence:
Math.round(
confidence
),

summary,

evidence:
uniqueStrings(
evidence
),

};

}
