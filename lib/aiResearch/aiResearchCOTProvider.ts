// lib/aiResearch/aiResearchCOTProvider.ts

import type {
AIResearchCOTData,
COTContract,
COTMarket,
COTPosition,
COTTraderGroup,
COTWeeklyObservation,
} from "./aiResearchCOTTypes";

import {
calculateCOTMetrics,
buildCOTSummary,
} from "./aiResearchCOTMetrics";


/* =====================================================
CONFIGURATION
===================================================== */

const CFTC_API_URL =
"https://publicreporting.cftc.gov/resource/gpe5-46if.json";

const REQUEST_TIMEOUT_MS =
15000;

const DEFAULT_LOOKBACK_WEEKS =
52;


/* =====================================================
COT TRADER GROUPS
===================================================== */

/*
* Keep the complete TFF participant structure available
* throughout the historical research layer.
*
* Historical COT analysis must not be restricted to
* Leveraged Money because positioning becomes especially
* useful when participant groups diverge.
*/

const COT_TRADER_GROUPS:
COTTraderGroup[] = [

"DEALER",

"ASSET_MANAGER",

"LEVERAGED_MONEY",

"OTHER_REPORTABLES",

"NON_REPORTABLES",

];


/* =====================================================
TYPES
===================================================== */

/*
* IMPORTANT:
*
* These field names must match the actual Socrata API
* field identifiers of the CFTC:
*
* TFF - Futures Only
* Dataset: gpe5-46if
*
* Do NOT use the human-readable CFTC column labels here.
*/

interface CFTCRecord {

report_date_as_yyyy_mm_dd?: string;

contract_market_name?: string;

cftc_contract_market_code?: string;

open_interest_all?: string;


/*
* Dealer / Intermediary
*/

dealer_positions_long_all?: string;

dealer_positions_short_all?: string;

dealer_positions_spread_all?: string;


/*
* Asset Manager / Institutional
*/

asset_mgr_positions_long?: string;

asset_mgr_positions_short?: string;

asset_mgr_positions_spread?: string;


/*
* Leveraged Money
*/

lev_money_positions_long?: string;

lev_money_positions_short?: string;

lev_money_positions_spread?: string;


/*
* Other Reportables
*/

other_rept_positions_long?: string;

other_rept_positions_short?: string;

other_rept_positions_spread?: string;


/*
* Non-Reportables
*
* The TFF dataset exposes long and short positions
* for this group but no equivalent spread field.
*/

nonrept_positions_long_all?: string;

nonrept_positions_short_all?: string;

}


export interface FetchCOTInput {

markets?: COTMarket[];

lookbackWeeks?: number;

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
Number(
value
);


return Number.isFinite(
parsed
)
? parsed
: null;

}


function isObject(
value:
unknown
): value is Record<string, unknown> {

return (
typeof value === "object" &&
value !== null &&
!Array.isArray(
value
)
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
new Date(
value
);


if (
Number.isNaN(
date.getTime()
)
) {

return null;

}


return date
.toISOString()
.slice(
0,
10
);

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
* Russell before generic index names.
*/

if (
normalized.includes(
"RUSSELL"
)
) {

return "RUSSELL_2000";

}


/*
* Nasdaq.
*/

if (
normalized.includes(
"NASDAQ"
)
) {

return "NASDAQ";

}


/*
* S&P.
*/

if (
normalized.includes(
"S&P"
)
) {

return "SP500";

}


/*
* Dow.
*/

if (
normalized.includes(
"DOW"
)
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

/*
* Spread is optional because the CFTC TFF dataset
* does not expose a Non-Reportables spread field.
*/

spread?:
keyof CFTCRecord;

}


const GROUP_FIELDS:
Record<
COTTraderGroup,
COTRecordFieldSet
> = {

DEALER: {

long:
"dealer_positions_long_all",

short:
"dealer_positions_short_all",

spread:
"dealer_positions_spread_all",

},

ASSET_MANAGER: {

long:
"asset_mgr_positions_long",

short:
"asset_mgr_positions_short",

spread:
"asset_mgr_positions_spread",

},

LEVERAGED_MONEY: {

long:
"lev_money_positions_long",

short:
"lev_money_positions_short",

spread:
"lev_money_positions_spread",

},

OTHER_REPORTABLES: {

long:
"other_rept_positions_long",

short:
"other_rept_positions_short",

spread:
"other_rept_positions_spread",

},

NON_REPORTABLES: {

long:
"nonrept_positions_long_all",

short:
"nonrept_positions_short_all",

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
fields.spread
? toNumber(
record[
fields.spread
]
)
: null;


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
? {
spread,
}
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


for (
const group
of COT_TRADER_GROUPS
) {

const position =
buildPosition(
record,
group
);


if (position) {

groups[
group
] =
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
.slice(
0,
10
);


const url =
new URL(
CFTC_API_URL
);


/*
* CFTC Socrata query.
*
* Market filtering is deliberately performed locally
* so the provider remains independent of exact CFTC
* contract naming conventions.
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

method:
"GET",

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
!Array.isArray(
json
)
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
isObject(
item
)
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
positions[
group
];


const previousPosition =
previous.positions[
group
];


if (
!current
) {

continue;

}


positions[
group
] = {

...current,

changeLong:
previousPosition
? current.long -
previousPosition.long
: null,

changeShort:
previousPosition
? current.short -
previousPosition.short
: null,

changeNet:
previousPosition
? current.net -
previousPosition.net
: null,

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
EMPTY DATA FALLBACK
===================================================== */

function buildEmptyCOTData(
warnings:
string[]
): AIResearchCOTData {

return {

generatedAt:
new Date().toISOString(),

latestReportDate:
null,

observations:
[],

summaries:
[],

divergences:
[],

history:
[],

diagnostics: {

source:
CFTC_API_URL,

observationCount:
0,

marketsCovered:
[],

warnings,

},

};

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
5,
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


let records:
CFTCRecord[] = [];


/*
* COT is supplementary research evidence.
*
* A temporary CFTC failure must not stop the
* complete AI Research pipeline.
*/

try {

records =
await fetchCFTCRecords(
lookbackWeeks
);

}

catch (error) {

const message =
error instanceof Error
? error.message
: "Unknown CFTC error";


warnings.push(
message
);


return {

data:
buildEmptyCOTData(
warnings
),

diagnostics: {

source:
CFTC_API_URL,

recordsFetched:
0,

observationsCreated:
0,

warnings,

},

};

}


/* =====================================================
NORMALIZE OBSERVATIONS
===================================================== */

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
* One observation per market / report date.
*
* Multiple matching contracts can exist in the CFTC
* dataset. For the current research layer we retain
* one representative contract per market/week.
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
!unique.has(
key
)
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


/*
* Weekly changes must be calculated before the
* historical metrics layer is executed.
*/

const withChanges =
applyWeeklyChanges(
normalized
);


/* =====================================================
HISTORICAL COT METRICS
===================================================== */

const metrics =
calculateCOTMetrics(
withChanges,
requestedMarkets,
lookbackWeeks
);


/*
* Convert historical metrics into the standard
* COT summary format consumed by AI Research.
*/

const summaries =
metrics.flatMap(
metric =>
buildCOTSummary(
metric
)
);


/*
* Divergences are calculated by the historical
* metrics layer.
*/

const divergences =
metrics.flatMap(
metric =>
metric.divergences
);


/* =====================================================
LATEST REPORT DATE
===================================================== */

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


/* =====================================================
MARKETS COVERED
===================================================== */

const marketsCovered =
Array.from(
new Set(
withChanges.map(
observation =>
observation.market
)
)
);


/* =====================================================
HISTORICAL SERIES
===================================================== */

/*
* Build one historical series for every available
* market / trader-group combination.
*
* Example:
*
* NASDAQ / DEALER
* NASDAQ / ASSET_MANAGER
* NASDAQ / LEVERAGED_MONEY
* ...
* RUSSELL_2000 / ASSET_MANAGER
* RUSSELL_2000 / LEVERAGED_MONEY
*
* The observations themselves still contain the full
* position map. The group property identifies which
* participant group the historical series represents.
*
* No synthetic observations are created here.
*/

const history =
marketsCovered.flatMap(
market => {

const marketObservations =
withChanges.filter(
observation =>
observation.market ===
market
);


return COT_TRADER_GROUPS
.filter(
group =>
marketObservations.some(
observation =>
observation.positions[
group
] !== undefined
)
)
.map(
group => ({

market,

group,

observations:
marketObservations,

})
);

}
);


/* =====================================================
DIAGNOSTICS
===================================================== */

if (
withChanges.length === 0
) {

warnings.push(
"No COT observations were created from the CFTC response."
);

}


if (
metrics.length === 0 &&
withChanges.length > 0
) {

warnings.push(
"COT observations exist, but no market metrics were created."
);

}


if (
summaries.length === 0 &&
metrics.length > 0
) {

warnings.push(
"COT market metrics exist, but no positioning summaries were created."
);

}


if (
withChanges.length > 0 &&
history.length === 0
) {

warnings.push(
"COT observations exist, but no historical market/group series were created."
);

}


/* =====================================================
FINAL DATA
===================================================== */

const data:
AIResearchCOTData = {

generatedAt:
new Date().toISOString(),

latestReportDate,

observations:
withChanges,

summaries,

divergences,

history,

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
