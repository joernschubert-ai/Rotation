// lib/aiResearch/aiResearchCOTProvider.ts

import type {
AIResearchCOTData,
COTContract,
COTGroupDivergence,
COTMarket,
COTMarketPositioningSummary,
COTPosition,
COTPositioningBias,
COTTraderGroup,
COTWeeklyObservation,
} from "./aiResearchCOTTypes";


/* =====================================================
CONFIGURATION
===================================================== */

const CFTC_API_URL =
"https://publicreporting.cftc.gov/resource/jun7-fc8v.json";

const REQUEST_TIMEOUT_MS =
15000;

const DEFAULT_LOOKBACK_WEEKS =
52;


/* =====================================================
TYPES
===================================================== */

interface CFTCRecord {
report_date_as_yyyy_mm_dd?: string;
contract_market_name?: string;
cftc_contract_market_code?: string;

open_interest_all?: string;

dealer_intermediary_long_all?: string;
dealer_intermediary_short_all?: string;
dealer_intermediary_spreads_all?: string;

asset_mgr_lev_long_all?: string;
asset_mgr_lev_short_all?: string;
asset_mgr_lev_spread_all?: string;

lev_money_long_all?: string;
lev_money_short_all?: string;
lev_money_spread_all?: string;

other_rept_long_all?: string;
other_rept_short_all?: string;
other_rept_spread_all?: string;

nonrept_long_all?: string;
nonrept_short_all?: string;
nonrept_spread_all?: string;
}


export interface FetchCOTInput {

markets?: COTMarket[];

lookbackWeeks?:
number;

}


export interface FetchCOTResult {

data:
AIResearchCOTData;

diagnostics: {

source:
string;

recordsFetched:
number;

observationsCreated:
number;

warnings:
string[];

};

}


/* =====================================================
MARKET DEFINITIONS
===================================================== */

interface MarketDefinition {

market:
COTMarket;

keywords:
string[];

}


const MARKET_DEFINITIONS:
MarketDefinition[] = [

{
market: "NASDAQ",

keywords: [
"NASDAQ-100",
"NASDAQ 100",
"E-MINI NASDAQ",
"NASDAQ",
],
},

{
market: "SP500",

keywords: [
"S&P 500",
"E-MINI S&P",
"S&P",
],
},

{
market: "RUSSELL_2000",

keywords: [
"RUSSELL 2000",
"E-MINI RUSSELL",
"RUSSELL",
],
},

{
market: "DOW",

keywords: [
"DOW JONES",
"E-MINI DOW",
"DOW",
],
},

];


/* =====================================================
HELPERS
===================================================== */

function toNumber(
value:
unknown
): number | null {

if (
value === null ||
value === undefined ||
value === ""
) {

return null;

}

const parsed =
Number(value);

return Number.isFinite(parsed)
? parsed
: null;

}


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


function isObject(
value: unknown
): value is Record<string, unknown> {

return (
typeof value === "object" &&
value !== null &&
!Array.isArray(value)
);

}


function normalizeDate(
value:
unknown
): string | null {

if (
typeof value !== "string" ||
value.length === 0
) {

return null;

}

const date =
new Date(value);

if (
Number.isNaN(
date.getTime()
)
) {

return null;

}

return date
.toISOString()
.slice(0, 10);

}


/* =====================================================
MARKET DETECTION
===================================================== */

function detectMarket(
contractName:
string
): COTMarket | null {

const normalized =
contractName
.toUpperCase()
.trim();

/*
* Russell before generic names.
*/

if (
normalized.includes("RUSSELL")
) {

return "RUSSELL_2000";

}


/*
* Nasdaq before generic index names.
*/

if (
normalized.includes("NASDAQ")
) {

return "NASDAQ";

}


/*
* S&P.
*/

if (
normalized.includes("S&P")
) {

return "SP500";

}


/*
* Dow.
*/

if (
normalized.includes("DOW")
) {

return "DOW";

}


return null;

}


/* =====================================================
TRADER GROUP MAPPING
===================================================== */

interface COTRecordFieldSet {

long:
keyof CFTCRecord;

short:
keyof CFTCRecord;

spread:
keyof CFTCRecord;

}


const GROUP_FIELDS:
Record<
COTTraderGroup,
COTRecordFieldSet
> = {

DEALER: {

long:
"dealer_intermediary_long_all",

short:
"dealer_intermediary_short_all",

spread:
"dealer_intermediary_spreads_all",

},

ASSET_MANAGER: {

long:
"asset_mgr_lev_long_all",

short:
"asset_mgr_lev_short_all",

spread:
"asset_mgr_lev_spread_all",

},

LEVERAGED_MONEY: {

long:
"lev_money_long_all",

short:
"lev_money_short_all",

spread:
"lev_money_spread_all",

},

OTHER_REPORTABLES: {

long:
"other_rept_long_all",

short:
"other_rept_short_all",

spread:
"other_rept_spread_all",

},

NON_REPORTABLES: {

long:
"nonrept_long_all",

short:
"nonrept_short_all",

spread:
"nonrept_spread_all",

},

};


/* =====================================================
POSITION CREATION
===================================================== */

function buildPosition(
record:
CFTCRecord,
traderGroup:
COTTraderGroup
): COTPosition | null {

const fields =
GROUP_FIELDS[
traderGroup
];

const long =
toNumber(
record[
fields.long
]
);

const short =
toNumber(
record[
fields.short
]
);

const spread =
toNumber(
record[
fields.spread
]
);


if (
long === null &&
short === null
) {

return null;

}


const safeLong =
long ?? 0;

const safeShort =
short ?? 0;


return {

traderGroup,

long:
safeLong,

short:
safeShort,

...(spread !== null
? { spread }
: {}),

net:
safeLong -
safeShort,

changeLong:
null,

changeShort:
null,

changeNet:
null,

};

}


/* =====================================================
CONTRACT
===================================================== */

function buildContract(
record:
CFTCRecord,
market:
COTMarket
): COTContract {

return {

market,

contractName:
record.contract_market_name ??
market,

...(record.cftc_contract_market_code
? {
cftcCode:
record.cftc_contract_market_code,
}
: {}),

exchange:
"CFTC",

};

}


/* =====================================================
WEEKLY OBSERVATION
===================================================== */

function buildObservation(
record:
CFTCRecord
): COTWeeklyObservation | null {

const reportDate =
normalizeDate(
record.report_date_as_yyyy_mm_dd
);

const contractName =
record.contract_market_name ??
"";

if (
!reportDate ||
!contractName
) {

return null;

}


const market =
detectMarket(
contractName
);

if (!market) {

return null;

}


const groups:
Partial<
Record<
COTTraderGroup,
COTPosition
>
> = {};


const traderGroups:
COTTraderGroup[] = [

"DEALER",
"ASSET_MANAGER",
"LEVERAGED_MONEY",
"OTHER_REPORTABLES",
"NON_REPORTABLES",

];


for (
const group
of traderGroups
) {

const position =
buildPosition(
record,
group
);

if (position) {

groups[group] =
position;

}

}


const openInterest =
toNumber(
record.open_interest_all
);


return {

reportDate,

market,

contract:
buildContract(
record,
market
),

positions:
groups,

...(openInterest !== null
? {
openInterest,
}
: {}),

};

}


/* =====================================================
FETCH
===================================================== */

async function fetchCFTCRecords(
lookbackWeeks:
number
): Promise<CFTCRecord[]> {

const now =
new Date();

const start =
new Date(
now.getTime() -
lookbackWeeks *
7 *
24 *
60 *
60 *
1000
);


const startDate =
start
.toISOString()
.slice(0, 10);


const url =
new URL(
CFTC_API_URL
);


/*
* The CFTC Socrata endpoint supports:
*
* $limit
* $order
* $where
*
* We keep the query deliberately broad and
* perform market filtering locally.
*/

url.searchParams.set(
"$limit",
"5000"
);

url.searchParams.set(
"$order",
"report_date_as_yyyy_mm_dd DESC"
);

url.searchParams.set(
"$where",
`report_date_as_yyyy_mm_dd >= '${startDate}'`
);


const controller =
new AbortController();

const timeout =
setTimeout(
() =>
controller.abort(),
REQUEST_TIMEOUT_MS
);


try {

const response =
await fetch(
url.toString(),
{
method: "GET",

headers: {
Accept:
"application/json",

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

throw new Error(
`CFTC request failed: ${response.status} ${response.statusText}`
);

}


const json =
await response.json();


if (
!Array.isArray(json)
) {

throw new Error(
"CFTC response is not an array"
);

}


return json
.filter(
(
item
): item is CFTCRecord =>
isObject(item)
);

}

finally {

clearTimeout(
timeout
);

}

}


/* =====================================================
WEEKLY CHANGE
===================================================== */

function applyWeeklyChanges(
observations:
COTWeeklyObservation[]
): COTWeeklyObservation[] {

const sorted =
[...observations]
.sort(
(a, b) =>
new Date(
a.reportDate
).getTime() -
new Date(
b.reportDate
).getTime()
);


const previousByMarket =
new Map<
COTMarket,
COTWeeklyObservation
>();


return sorted.map(
observation => {

const previous =
previousByMarket.get(
observation.market
);


const positions =
{
...observation.positions,
};


if (previous) {

const groups =
Object.keys(
positions
) as COTTraderGroup[];


for (
const group
of groups
) {

const current =
positions[group];

const previousPosition =
previous.positions[group];


if (
!current
) {

continue;

}


positions[group] = {

...current,

changeLong:
current.long -
(previousPosition?.long ?? 0),

changeShort:
current.short -
(previousPosition?.short ?? 0),

changeNet:
current.net -
(previousPosition?.net ?? 0),

};

}

}


previousByMarket.set(
observation.market,
observation
);


return {

...observation,

positions,

};

}
);

}


/* =====================================================
POSITIONING BIAS
===================================================== */

function determineBias(
netPosition:
number | null,
percentile:
number | null
): COTPositioningBias {

if (
netPosition === null
) {

return "UNKNOWN";

}


/*
* No historical percentile yet.
*
* Until the historical layer is added,
* classify only the sign.
*/

if (
percentile !== null &&
percentile >= 90
) {

return "EXTREME_LONG";

}


if (
percentile !== null &&
percentile <= 10
) {

return "EXTREME_SHORT";

}


if (
netPosition > 0
) {

return "NET_LONG";

}


if (
netPosition < 0
) {

return "NET_SHORT";

}


return "BALANCED";

}


/* =====================================================
SUMMARY
===================================================== */

function buildSummaries(
observations:
COTWeeklyObservation[]
): COTMarketPositioningSummary[] {

const latestByMarket =
new Map<
COTMarket,
COTWeeklyObservation
>();


for (
const observation
of observations
) {

const existing =
latestByMarket.get(
observation.market
);


if (
!existing ||
new Date(
observation.reportDate
).getTime() >
new Date(
existing.reportDate
).getTime()
) {

latestByMarket.set(
observation.market,
observation
);

}

}


const summaries:
COTMarketPositioningSummary[] = [];


for (
const [
market,
observation
]
of latestByMarket
) {

const groups =
Object.entries(
observation.positions
) as [
COTTraderGroup,
COTPosition
][];


for (
const [
group,
position
]
of groups
) {

const bias =
determineBias(
position.net,
null
);


summaries.push({

market,

reportDate:
observation.reportDate,

group,

bias,

netPosition:
position.net,

weeklyChange:
position.changeNet ??
null,

percentile:
null,

summary:
`${group}: net ${position.net.toLocaleString(
"en-US"
)} contracts`,

});

}

}


return summaries;

}


/* =====================================================
GROUP DIVERGENCES
===================================================== */

function buildDivergences(
observations:
COTWeeklyObservation[]
): COTGroupDivergence[] {

const latestByMarket =
new Map<
COTMarket,
COTWeeklyObservation
>();


for (
const observation
of observations
) {

const existing =
latestByMarket.get(
observation.market
);


if (
!existing ||
new Date(
observation.reportDate
).getTime() >
new Date(
existing.reportDate
).getTime()
) {

latestByMarket.set(
observation.market,
observation
);

}

}


const divergences:
COTGroupDivergence[] = [];


for (
const [
market,
observation
]
of latestByMarket
) {

const leveraged =
observation.positions
.LEVERAGED_MONEY;

const assetManager =
observation.positions
.ASSET_MANAGER;


if (
!leveraged ||
!assetManager
) {

continue;

}


const leveragedChange =
leveraged.changeNet;

const assetManagerChange =
assetManager.changeNet;


if (
leveragedChange === null ||
leveragedChange === undefined ||
assetManagerChange === null ||
assetManagerChange === undefined
) {

continue;

}


/*
* Divergence exists when the weekly changes
* point in opposite directions.
*/

if (
leveragedChange === 0 ||
assetManagerChange === 0 ||
Math.sign(
leveragedChange
) === Math.sign(
assetManagerChange
)
) {

continue;

}


divergences.push({

market,

groupA:
"LEVERAGED_MONEY",

groupB:
"ASSET_MANAGER",

observation:
"Leveraged Money und Asset Manager haben ihre Netto-Positionen in entgegengesetzte Richtungen verändert.",

significance:
"Unterschiedliche institutionelle Positionierungsrichtung.",

netChangeA:
leveragedChange,

netChangeB:
assetManagerChange,

confidence:
clamp(
50 +
Math.min(
25,
Math.abs(
leveragedChange
) / 10000
) +
Math.min(
25,
Math.abs(
assetManagerChange
) / 10000
)
),

});

}


return divergences;

}


/* =====================================================
MAIN PROVIDER
===================================================== */

export async function fetchCOTData(
input:
FetchCOTInput = {}
): Promise<FetchCOTResult> {

const warnings:
string[] = [];


const lookbackWeeks =
Math.max(
1,
Math.min(
260,
Math.round(
input.lookbackWeeks ??
DEFAULT_LOOKBACK_WEEKS
)
)
);


const requestedMarkets =
input.markets ??
[
"NASDAQ",
"SP500",
"RUSSELL_2000",
"DOW",
];


const records =
await fetchCFTCRecords(
lookbackWeeks
);


const observations =
records
.map(
buildObservation
)
.filter(
(
observation
): observation is COTWeeklyObservation =>
observation !== null
)
.filter(
observation =>
requestedMarkets.includes(
observation.market
)
);


/*
* One observation per market/report-date.
*
* The CFTC feed can contain multiple records
* for the same market. We keep the first matching
* contract for the current implementation.
*/

const unique =
new Map<
string,
COTWeeklyObservation
>();


for (
const observation
of observations
) {

const key =
`${observation.market}:${observation.reportDate}`;


if (
!unique.has(key)
) {

unique.set(
key,
observation
);

}

}


const normalized =
Array.from(
unique.values()
);


const withChanges =
applyWeeklyChanges(
normalized
);


const summaries =
buildSummaries(
withChanges
);


const divergences =
buildDivergences(
withChanges
);


const latestReportDate =
withChanges.length > 0
? withChanges.reduce(
(
latest,
observation
) =>
observation.reportDate >
latest
? observation.reportDate
: latest,
withChanges[0]
.reportDate
)
: null;


const marketsCovered =
Array.from(
new Set(
withChanges.map(
observation =>
observation.market
)
)
);


const data:
AIResearchCOTData = {

generatedAt:
new Date().toISOString(),

latestReportDate,

observations:
withChanges,

summaries,

divergences,

history:
marketsCovered.map(
market => ({

market,

group:
"LEVERAGED_MONEY",

observations:
withChanges.filter(
observation =>
observation.market ===
market
),

})
),

diagnostics: {

source:
CFTC_API_URL,

observationCount:
withChanges.length,

marketsCovered,

warnings,

},

};


return {

data,

diagnostics: {

source:
CFTC_API_URL,

recordsFetched:
records.length,

observationsCreated:
withChanges.length,

warnings,

},

};

}
