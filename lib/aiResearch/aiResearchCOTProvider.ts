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


/*
* Internal helper structure.
*
* We must preserve the concrete CFTC contract identity
* before collapsing observations into one market series.
*
* Otherwise different contracts that happen to contain
* e.g. "S&P" or "NASDAQ" in their name can accidentally
* be stitched together into one synthetic time series.
*/

interface ContractSeriesCandidate {
market:
COTMarket;

contractKey:
string;

cftcCode:
string | null;

contractName:
string;

observations:
COTWeeklyObservation[];

observationCount:
number;

uniqueReportDates:
number;

latestReportDate:
string;

latestOpenInterest:
number | null;

averageOpenInterest:
number | null;
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


function normalizeContractCode(
value:
unknown
): string | null {
if (
typeof value !== "string"
) {
return null;
}

const normalized =
value.trim();

return normalized.length > 0
? normalized
: null;
}


function normalizeContractName(
value:
unknown
): string {
if (
typeof value !== "string"
) {
return "";
}

return value
.trim()
.replace(
/\s+/g,
" "
);
}


/*
* The CFTC contract code is the preferred identity.
*
* Contract name is only a fallback for records where
* the API does not provide a code.
*/

function getContractIdentity(
observation:
COTWeeklyObservation
): string {
const cftcCode =
observation.contract.cftcCode
?.trim();

if (
cftcCode
) {
return `CODE:${cftcCode}`;
}

const contractName =
observation.contract.contractName
.trim()
.toUpperCase();

return `NAME:${contractName}`;
}


function getObservationTimestamp(
observation:
COTWeeklyObservation
): number {
const timestamp =
new Date(
observation.reportDate
).getTime();

return Number.isFinite(
timestamp
)
? timestamp
: 0;
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
* Market detection remains intentionally broad here.
*
* IMPORTANT:
*
* Broad detection is now safe because this step only
* classifies possible candidates.
*
* It no longer decides which concrete CFTC contract
* becomes the historical market series.
*
* Contract selection happens later using stable
* contract identity, history coverage and liquidity.
*/


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
const contractName =
normalizeContractName(
record.contract_market_name
) ||
market;

const cftcCode =
normalizeContractCode(
record.cftc_contract_market_code
);

return {
market,

contractName,

...(cftcCode
? {
cftcCode,
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
normalizeContractName(
record.contract_market_name
);

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

if (
!market
) {
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

if (
position
) {
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
*
* Concrete contract identity is preserved after fetch
* and a stable series is selected per market.
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
CONTRACT-SERIES DEDUPLICATION
===================================================== */

/*
* Deduplicate only inside the SAME concrete CFTC
* contract and report date.
*
* This is fundamentally different from the old logic:
*
* OLD:
* market + reportDate
*
* NEW:
* market + contract identity + reportDate
*
* Therefore two different S&P-related contracts can no
* longer silently overwrite / compete with each other
* before we decide which contract series should represent
* SP500.
*/

function deduplicateContractObservations(
observations:
COTWeeklyObservation[]
): COTWeeklyObservation[] {
const unique =
new Map<
string,
COTWeeklyObservation
>();

for (
const observation
of observations
) {
const contractIdentity =
getContractIdentity(
observation
);

const key =
[
observation.market,
contractIdentity,
observation.reportDate,
].join(
":"
);

const existing =
unique.get(
key
);

if (
!existing
) {
unique.set(
key,
observation
);

continue;
}


/*
* Duplicate records for exactly the same contract/date
* should be rare.
*
* If they occur, prefer the record with the larger
* reported open interest because it is the more useful
* representative record for this research layer.
*/

const existingOpenInterest =
existing.openInterest ??
-1;

const candidateOpenInterest =
observation.openInterest ??
-1;

if (
candidateOpenInterest >
existingOpenInterest
) {
unique.set(
key,
observation
);
}
}

return Array.from(
unique.values()
);
}


/* =====================================================
CONTRACT-SERIES CANDIDATES
===================================================== */

function buildContractSeriesCandidates(
observations:
COTWeeklyObservation[],
market:
COTMarket
): ContractSeriesCandidate[] {
const marketObservations =
observations.filter(
observation =>
observation.market ===
market
);

const grouped =
new Map<
string,
COTWeeklyObservation[]
>();

for (
const observation
of marketObservations
) {
const contractKey =
getContractIdentity(
observation
);

const current =
grouped.get(
contractKey
) ??
[];

current.push(
observation
);

grouped.set(
contractKey,
current
);
}

const candidates:
ContractSeriesCandidate[] = [];

for (
const [
contractKey,
contractObservations,
]
of grouped.entries()
) {
const chronological =
[...contractObservations]
.sort(
(
a,
b
) =>
getObservationTimestamp(
a
) -
getObservationTimestamp(
b
)
);

if (
chronological.length === 0
) {
continue;
}

const latest =
chronological[
chronological.length -
1
];

const reportDates =
new Set(
chronological.map(
observation =>
observation.reportDate
)
);

const openInterests =
chronological
.map(
observation =>
observation.openInterest
)
.filter(
(
value
): value is number =>
typeof value ===
"number" &&
Number.isFinite(
value
)
);

const averageOpenInterest =
openInterests.length > 0
? openInterests.reduce(
(
total,
value
) =>
total +
value,
0
) /
openInterests.length
: null;

candidates.push({
market,

contractKey,

cftcCode:
latest.contract.cftcCode ??
null,

contractName:
latest.contract.contractName,

observations:
chronological,

observationCount:
chronological.length,

uniqueReportDates:
reportDates.size,

latestReportDate:
latest.reportDate,

latestOpenInterest:
latest.openInterest ??
null,

averageOpenInterest,
});
}

return candidates;
}


/* =====================================================
CONTRACT-SERIES SELECTION
===================================================== */

/*
* Select ONE stable concrete CFTC contract per market.
*
* Selection priorities:
*
* 1. Historical coverage
* 2. Latest available report date
* 3. Latest open interest
* 4. Average open interest
*
* Historical coverage deliberately comes first.
*
* AI Research needs a stable 52-week positioning series.
* A newly introduced contract with very high open
* interest must not replace an established contract after
* only a handful of observations, because that would
* destroy 13W / 26W / percentile / z-score continuity.
*/

function compareContractCandidates(
a:
ContractSeriesCandidate,
b:
ContractSeriesCandidate
): number {
if (
a.uniqueReportDates !==
b.uniqueReportDates
) {
return (
b.uniqueReportDates -
a.uniqueReportDates
);
}

const latestDateComparison =
b.latestReportDate.localeCompare(
a.latestReportDate
);

if (
latestDateComparison !== 0
) {
return latestDateComparison;
}

const aLatestOpenInterest =
a.latestOpenInterest ??
-1;

const bLatestOpenInterest =
b.latestOpenInterest ??
-1;

if (
aLatestOpenInterest !==
bLatestOpenInterest
) {
return (
bLatestOpenInterest -
aLatestOpenInterest
);
}

const aAverageOpenInterest =
a.averageOpenInterest ??
-1;

const bAverageOpenInterest =
b.averageOpenInterest ??
-1;

if (
aAverageOpenInterest !==
bAverageOpenInterest
) {
return (
bAverageOpenInterest -
aAverageOpenInterest
);
}

return a.contractKey.localeCompare(
b.contractKey
);
}


function selectStableContractSeries(
observations:
COTWeeklyObservation[],
requestedMarkets:
COTMarket[],
warnings:
string[]
): COTWeeklyObservation[] {
const selected:
COTWeeklyObservation[] = [];

for (
const market
of requestedMarkets
) {
const candidates =
buildContractSeriesCandidates(
observations,
market
)
.sort(
compareContractCandidates
);

if (
candidates.length === 0
) {
warnings.push(
`No CFTC contract series found for ${market}.`
);

continue;
}

const chosen =
candidates[0];


/*
* Diagnostics are intentionally explicit.
*
* This makes future contract-universe changes visible
* instead of silently changing the COT history.
*/

if (
candidates.length > 1
) {
const candidateDescription =
candidates
.map(
candidate => {
const code =
candidate.cftcCode ??
"NO_CODE";

const latestOI =
candidate.latestOpenInterest !== null
? Math.round(
candidate.latestOpenInterest
).toLocaleString(
"en-US"
)
: "n/a";

return (
`${code} | ${candidate.contractName} | ` +
`${candidate.uniqueReportDates} week(s) | ` +
`latest ${candidate.latestReportDate} | ` +
`OI ${latestOI}`
);
}
)
.join(
" || "
);

warnings.push(
[
`${market}: ${candidates.length} matching CFTC contract series found.`,
`Selected ${chosen.cftcCode ?? "NO_CODE"} | ${chosen.contractName}`,
`with ${chosen.uniqueReportDates} weekly observation(s).`,
`Candidates: ${candidateDescription}`,
].join(
" "
)
);
}


/*
* A stable historical COT series should contain enough
* observations to support medium-term research.
*
* We do not reject short histories because COT must
* remain fault tolerant, but we surface the limitation.
*/

if (
chosen.uniqueReportDates <
26
) {
warnings.push(
`${market}: selected CFTC contract series has only ${chosen.uniqueReportDates} weekly observation(s); 26-week positioning changes may be unavailable.`
);
}

selected.push(
...chosen.observations
);
}


/*
* Keep deterministic chronological ordering before
* weekly changes are calculated.
*/

return selected.sort(
(
a,
b
) => {
const dateDifference =
getObservationTimestamp(
a
) -
getObservationTimestamp(
b
);

if (
dateDifference !== 0
) {
return dateDifference;
}

return a.market.localeCompare(
b.market
);
}
);
}


/* =====================================================
WEEKLY CHANGE
===================================================== */

/*
* Weekly changes are now calculated only AFTER one
* concrete stable CFTC contract has been selected for
* every market.
*
* Therefore:
*
* current.net - previous.net
*
* always compares the same market AND the same selected
* contract series.
*/

function applyWeeklyChanges(
observations:
COTWeeklyObservation[]
): COTWeeklyObservation[] {
const sorted =
[...observations]
.sort(
(
a,
b
) =>
getObservationTimestamp(
a
) -
getObservationTimestamp(
b
)
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

const positions = {
...observation.positions,
};

if (
previous
) {
/*
* Defensive contract-continuity guard.
*
* This should never trigger after
* selectStableContractSeries(), but it prevents
* accidental cross-contract comparisons if the
* upstream logic changes in the future.
*/

const currentContractIdentity =
getContractIdentity(
observation
);

const previousContractIdentity =
getContractIdentity(
previous
);

if (
currentContractIdentity ===
previousContractIdentity
) {
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

catch (
error
) {
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
NORMALIZE RAW OBSERVATIONS
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


/* =====================================================
PRESERVE CONCRETE CONTRACT IDENTITIES
===================================================== */

/*
* The old implementation collapsed observations here
* by:
*
* market + reportDate
*
* That allowed different CFTC contracts belonging to
* the same broad index family to become one artificial
* historical series.
*
* We now deduplicate only inside the same concrete
* contract.
*/

const contractObservations =
deduplicateContractObservations(
observations
);


/* =====================================================
SELECT ONE STABLE SERIES PER MARKET
===================================================== */

/*
* Only after all concrete contract candidates have
* been evaluated do we select the stable historical
* representative for NASDAQ / SP500 / RUSSELL / DOW.
*/

const stableSeries =
selectStableContractSeries(
contractObservations,
requestedMarkets,
warnings
);


/*
* Weekly changes must be calculated AFTER stable
* contract selection.
*/

const withChanges =
applyWeeklyChanges(
stableSeries
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
* IMPORTANT:
*
* marketObservations now belong to one stable concrete
* CFTC contract series per market.
*
* Therefore all group histories share the same stable
* underlying contract history.
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
observations.length === 0
) {
warnings.push(
"No candidate COT observations were created from the CFTC response."
);
}


if (
contractObservations.length === 0 &&
observations.length > 0
) {
warnings.push(
"COT observations exist, but no concrete contract observations remained after deduplication."
);
}


if (
withChanges.length === 0
) {
warnings.push(
"No stable COT observations were created from the CFTC response."
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
