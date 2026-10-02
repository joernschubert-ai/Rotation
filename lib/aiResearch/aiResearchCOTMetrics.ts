// lib/aiResearch/aiResearchCOTMetrics.ts

import type {
COTGroupDivergence,
COTMarket,
COTMarketPositioningSummary,
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

/*
* Short- and medium-term changes in net positioning.
*
* These values remain descriptive.
* Directional interpretation belongs to AI Research.
*/

weeklyChange:
number;

change4W:
number | null;

change13W:
number | null;

change26W:
number | null;


/*
* Changes normalized against the historical net-position
* range of the same market / trader group.
*
* Example:
*
* normalizedChange13W = 0.25
*
* means the 13-week positioning change equals roughly
* 25% of the observed historical net-position range.
*/

normalizedChange4W:
number | null;

normalizedChange13W:
number | null;

normalizedChange26W:
number | null;


/*
* Historical distribution metrics.
*/

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
HISTORICAL NET POSITION
===================================================== */

/*
* Returns the net position approximately N weekly
* observations before the current observation.
*
* COT data are weekly, therefore an observation offset
* is preferable here to calendar-day arithmetic.
*/

function getHistoricalNetPosition(
history:
COTWeeklyObservation[],
market:
COTMarket,
group:
COTTraderGroup,
reportDate:
string,
weeksBack:
number
): number | null {

const marketHistory =
history
.filter(
item =>
item.market === market &&
item.reportDate <= reportDate &&
finite(
item.positions[group]
?.net
) !== null
)
.sort(
(a, b) =>
new Date(
a.reportDate
).getTime() -
new Date(
b.reportDate
).getTime()
);


if (
marketHistory.length <= weeksBack
) {

return null;

}


const historicalObservation =
marketHistory[
marketHistory.length -
1 -
weeksBack
];


return finite(
historicalObservation
.positions[group]
?.net
);

}


/* =====================================================
NORMALIZED POSITION CHANGE
===================================================== */

function normalizePositionChange(
change:
number | null,
historicalMin:
number | null,
historicalMax:
number | null
): number | null {

if (
change === null ||
historicalMin === null ||
historicalMax === null
) {

return null;

}


const range =
historicalMax -
historicalMin;


if (
range === 0
) {

return null;

}


return (
change /
range
);

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
.sort(
(a, b) =>
new Date(
a.reportDate
).getTime() -
new Date(
b.reportDate
).getTime()
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


/* =====================================================
MULTI-WEEK POSITIONING CHANGES
===================================================== */

const net4W =
getHistoricalNetPosition(
history,
market,
group,
observation.reportDate,
4
);


const net13W =
getHistoricalNetPosition(
history,
market,
group,
observation.reportDate,
13
);


const net26W =
getHistoricalNetPosition(
history,
market,
group,
observation.reportDate,
26
);


const change4W =
net4W !== null
? currentNet -
net4W
: null;


const change13W =
net13W !== null
? currentNet -
net13W
: null;


const change26W =
net26W !== null
? currentNet -
net26W
: null;


/* =====================================================
HISTORICAL DISTRIBUTION
===================================================== */

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


/* =====================================================
NORMALIZED MULTI-WEEK CHANGES
===================================================== */

const normalizedChange4W =
normalizePositionChange(
change4W,
historicalMin,
historicalMax
);


const normalizedChange13W =
normalizePositionChange(
change13W,
historicalMin,
historicalMax
);


const normalizedChange26W =
normalizePositionChange(
change26W,
historicalMin,
historicalMax
);


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

change4W,

change13W,

change26W,

normalizedChange4W,

normalizedChange13W,

normalizedChange26W,

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
*
* This remains a descriptive divergence measure.
* Directional interpretation is performed later
* by AI Research.
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

change4W:
data.change4W,

change13W:
data.change13W,

change26W:
data.change26W,

normalizedChange4W:
data.normalizedChange4W,

normalizedChange13W:
data.normalizedChange13W,

normalizedChange26W:
data.normalizedChange26W,

percentile:
data.percentile,

zScore:
data.zScore,

isExtreme:
data.isExtreme,

summary:
`${entry.group}: net ${data.netPosition.toLocaleString(
"en-US"
)} contracts`,

};


}
);

}
