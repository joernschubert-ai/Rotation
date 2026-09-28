// lib/aiResearch/aiResearchCOTMetrics.ts

import type {
COTGroupDivergence,
COTMarket,
COTMarketPositioningSummary,
COTPosition,
COTTraderGroup,
COTWeeklyObservation,
} from "./aiResearchCOTTypes";


/* =====================================================
TYPES
===================================================== */

export interface COTPositioningMetric {

market:
COTMarket;

group:
COTTraderGroup;

reportDate:
string;

netPosition:
number;

weeklyChange:
number;

percentile:
number | null;

zScore:
number | null;

historicalMin:
number | null;

historicalMax:
number | null;

isExtreme:
boolean;

}


export interface COTMarketMetrics {

market:
COTMarket;

reportDate:
string;

dealer:
COTPositioningMetric | null;

assetManager:
COTPositioningMetric | null;

leveragedMoney:
COTPositioningMetric | null;

otherReportables:
COTPositioningMetric | null;

nonReportables:
COTPositioningMetric | null;

divergences:
COTGroupDivergence[];

}


/* =====================================================
CONSTANTS
===================================================== */

const DEFAULT_LOOKBACK =
52;

const EXTREME_LOW_PERCENTILE =
10;

const EXTREME_HIGH_PERCENTILE =
90;


/* =====================================================
HELPERS
===================================================== */

function finite(
value:
unknown
): number | null {

const number =
Number(value);

return Number.isFinite(number)
? number
: null;

}


function mean(
values:
number[]
): number | null {

if (
values.length === 0
) {

return null;

}

return (
values.reduce(
(sum, value) =>
sum + value,
0
) /
values.length
);

}


function standardDeviation(
values:
number[]
): number | null {

if (
values.length < 2
) {

return null;

}

const average =
mean(values);

if (
average === null
) {

return null;

}

const variance =
values.reduce(
(
sum,
value
) =>
sum +
Math.pow(
value - average,
2
),
0
) /
values.length;

return Math.sqrt(
variance
);

}


/* =====================================================
PERCENTILE
===================================================== */

/*
* Percentile is calculated against the historical
* distribution of the same market and trader group.
*
* Example:
*
* 95
* =
* current positioning is higher than roughly
* 95% of historical observations.
*/

function calculatePercentile(
current:
number,
history:
number[]
): number | null {

if (
history.length < 5
) {

return null;

}

const sorted =
[...history]
.sort(
(a, b) =>
a - b
);


let below =
0;

let equal =
0;


for (
const value
of sorted
) {

if (
value < current
) {

below++;

}

else if (
value === current
) {

equal++;

}

}


/*
* Mid-rank percentile.
*
* This avoids artificially pushing repeated
* values completely to the top or bottom.
*/

const rank =
below +
equal / 2;


return (
rank /
sorted.length
) * 100;

}


/* =====================================================
Z SCORE
===================================================== */

function calculateZScore(
current:
number,
history:
number[]
): number | null {

if (
history.length < 5
) {

return null;

}

const average =
mean(history);

const deviation =
standardDeviation(
history
);


if (
average === null ||
deviation === null ||
deviation === 0
) {

return null;

}


return (
current -
average
) /
deviation;

}


/* =====================================================
POSITION METRIC
===================================================== */

function buildPositionMetric(
market:
COTMarket,
group:
COTTraderGroup,
observation:
COTWeeklyObservation,
history:
COTWeeklyObservation[],
lookback:
number
): COTPositioningMetric | null {

const position =
observation.positions[group];


if (
!position
) {

return null;

}


const historicalPositions =
history
.filter(
item =>
item.market === market &&
item.reportDate <=
observation.reportDate
)
.slice(
-lookback
);


const historicalNet =
historicalPositions
.map(
item =>
finite(
item.positions[group]
?.net
)
)
.filter(
(
value
): value is number =>
value !== null
);


const currentNet =
finite(
position.net
);


if (
currentNet === null
) {

return null;

}


const weeklyChange =
finite(
position.changeNet
) ?? 0;


const percentile =
calculatePercentile(
currentNet,
historicalNet
);


const zScore =
calculateZScore(
currentNet,
historicalNet
);


const historicalMin =
historicalNet.length > 0
? Math.min(
...historicalNet
)
: null;


const historicalMax =
historicalNet.length > 0
? Math.max(
...historicalNet
)
: null;


const isExtreme =
percentile !== null &&
(
percentile <=
EXTREME_LOW_PERCENTILE ||
percentile >=
EXTREME_HIGH_PERCENTILE
);


return {

market,

group,

reportDate:
observation.reportDate,

netPosition:
currentNet,

weeklyChange,

percentile,

zScore,

historicalMin,

historicalMax,

isExtreme,

};

}


/* =====================================================
LATEST OBSERVATION
===================================================== */

function getLatestObservation(
observations:
COTWeeklyObservation[],
market:
COTMarket
): COTWeeklyObservation | null {

const marketObservations =
observations
.filter(
observation =>
observation.market ===
market
)
.sort(
(a, b) =>
new Date(
b.reportDate
).getTime() -
new Date(
a.reportDate
).getTime()
);


return (
marketObservations[0] ??
null
);

}


/* =====================================================
DIVERGENCES
===================================================== */

function findDivergences(
observations:
COTWeeklyObservation[],
market:
COTMarket
): COTGroupDivergence[] {

const latest =
getLatestObservation(
observations,
market
);


if (
!latest
) {

return [];

}


const leveraged =
latest.positions
.LEVERAGED_MONEY;

const assetManager =
latest.positions
.ASSET_MANAGER;


if (
!leveraged ||
!assetManager
) {

return [];

}


const leveragedChange =
finite(
leveraged.changeNet
);

const assetManagerChange =
finite(
assetManager.changeNet
);


if (
leveragedChange === null ||
assetManagerChange === null
) {

return [];

}


/*
* No divergence if both groups moved
* in the same direction.
*/

if (
leveragedChange === 0 ||
assetManagerChange === 0 ||
Math.sign(
leveragedChange
) ===
Math.sign(
assetManagerChange
)
) {

return [];

}


/*
* Confidence reflects the magnitude of the
* opposing changes, but remains bounded.
*/

const magnitude =
Math.min(
50,
(
Math.abs(
leveragedChange
) +
Math.abs(
assetManagerChange
)
) /
10000
);


const confidence =
Math.max(
50,
Math.min(
100,
50 + magnitude
)
);


return [

{

market,

groupA:
"LEVERAGED_MONEY",

groupB:
"ASSET_MANAGER",

observation:
"Leveraged Money und Asset Manager haben ihre Netto-Positionen in entgegengesetzte Richtungen verändert.",

significance:
"Die aktuelle institutionelle Positionierung entwickelt sich zwischen beiden Gruppen auseinander.",

netChangeA:
leveragedChange,

netChangeB:
assetManagerChange,

confidence,

},

];

}


/* =====================================================
MARKET METRICS
===================================================== */

export function calculateCOTMarketMetrics(
observations:
COTWeeklyObservation[],
market:
COTMarket,
lookback =
DEFAULT_LOOKBACK
): COTMarketMetrics | null {

const latest =
getLatestObservation(
observations,
market
);


if (
!latest
) {

return null;

}


const safeLookback =
Math.max(
5,
Math.min(
260,
Math.round(
lookback
)
)
);


return {

market,

reportDate:
latest.reportDate,

dealer:
buildPositionMetric(
market,
"DEALER",
latest,
observations,
safeLookback
),

assetManager:
buildPositionMetric(
market,
"ASSET_MANAGER",
latest,
observations,
safeLookback
),

leveragedMoney:
buildPositionMetric(
market,
"LEVERAGED_MONEY",
latest,
observations,
safeLookback
),

otherReportables:
buildPositionMetric(
market,
"OTHER_REPORTABLES",
latest,
observations,
safeLookback
),

nonReportables:
buildPositionMetric(
market,
"NON_REPORTABLES",
latest,
observations,
safeLookback
),

divergences:
findDivergences(
observations,
market
),

};

}


/* =====================================================
ALL MARKETS
===================================================== */

export function calculateCOTMetrics(
observations:
COTWeeklyObservation[],
markets:
COTMarket[] = [
"NASDAQ",
"SP500",
"RUSSELL_2000",
"DOW",
],
lookback =
DEFAULT_LOOKBACK
): COTMarketMetrics[] {

if (
!Array.isArray(
observations
) ||
observations.length === 0
) {

return [];

}


return markets
.map(
market =>
calculateCOTMarketMetrics(
observations,
market,
lookback
)
)
.filter(
(
metric
): metric is COTMarketMetrics =>
metric !== null
);

}


/* =====================================================
SUMMARY
===================================================== */

export function buildCOTSummary(
metric:
COTMarketMetrics
): COTMarketPositioningSummary[] {

const entries: Array<{
group:
COTTraderGroup;

metric:
COTPositioningMetric | null;
}> = [

{
group:
"DEALER",

metric:
metric.dealer,
},

{
group:
"ASSET_MANAGER",

metric:
metric.assetManager,
},

{
group:
"LEVERAGED_MONEY",

metric:
metric.leveragedMoney,
},

{
group:
"OTHER_REPORTABLES",

metric:
metric.otherReportables,
},

{
group:
"NON_REPORTABLES",

metric:
metric.nonReportables,
},

];


return entries
.filter(
entry =>
entry.metric !== null
)
.map(
entry => {

const data =
entry.metric!;


let bias:
COTMarketPositioningSummary["bias"] =
"BALANCED";


if (
data.percentile !== null &&
data.percentile >=
EXTREME_HIGH_PERCENTILE
) {

bias =
"EXTREME_LONG";

}

else if (
data.percentile !== null &&
data.percentile <=
EXTREME_LOW_PERCENTILE
) {

bias =
"EXTREME_SHORT";

}

else if (
data.netPosition > 0
) {

bias =
"NET_LONG";

}

else if (
data.netPosition < 0
) {

bias =
"NET_SHORT";

}


return {

market:
metric.market,

reportDate:
metric.reportDate,

group:
entry.group,

bias,

netPosition:
data.netPosition,

weeklyChange:
data.weeklyChange,

percentile:
data.percentile,

summary:
`${entry.group}: net ${data.netPosition.toLocaleString(
"en-US"
)} contracts`,

};

}
);

}
