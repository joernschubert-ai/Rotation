// lib/aiResearch/aiResearchCOTTypes.ts

/* =====================================================
BASIC TYPES
===================================================== */

export type NullableNumber =
| number
| null
| undefined;


/* =====================================================
COT REPORTABLE GROUPS
===================================================== */

/*
* CFTC COT financial-futures reports distinguish
* several major reportable trader categories.
*
* These categories are intentionally kept separate
* from the news/source model.
*/

export type COTTraderGroup =
| "DEALER"
| "ASSET_MANAGER"
| "LEVERAGED_MONEY"
| "OTHER_REPORTABLES"
| "NON_REPORTABLES";


/* =====================================================
MARKET / CONTRACT
===================================================== */

/*
* We start with the markets relevant to the
* Rotation-App.
*
* Nasdaq is represented by the corresponding
* financial-futures contract supplied by the CFTC.
*/

export type COTMarket =
| "NASDAQ"
| "SP500"
| "RUSSELL_2000"
| "DOW"
| "OTHER";


export interface COTContract {

market:
COTMarket;

contractName:
string;

cftcCode?:
string;

exchange?:
string;

currency?:
string;

}


/* =====================================================
RAW POSITION DATA
===================================================== */

/*
* Position numbers represent contracts.
*
* We deliberately store the original long/short
* values instead of only calculating net position.
*
* This allows the research layer to later analyze
* gross exposure, net exposure and changes.
*/

export interface COTPosition {

traderGroup:
COTTraderGroup;

long:
number;

short:
number;

spread?:
number;

net:
number;

changeLong?:
NullableNumber;

changeShort?:
NullableNumber;

changeNet?:
NullableNumber;

}


/* =====================================================
POSITIONING EXTREMES
===================================================== */

/*
* Percentiles allow the AI Research Agent to identify
* unusual positioning without assigning a permanent
* bullish/bearish meaning to the raw number.
*
* Example:
*
* percentile = 95
*
* means the current net positioning is near the
* upper end of its historical distribution.
*/

export interface COTPositioningExtreme {

lookbackWeeks:
number;

percentile:
NullableNumber;

zScore?:
NullableNumber;

isExtreme?:
boolean;

}


/* =====================================================
WEEKLY COT OBSERVATION
===================================================== */

export interface COTWeeklyObservation {

reportDate:
string;

market:
COTMarket;

contract:
COTContract;

positions:
Partial<
Record<
COTTraderGroup,
COTPosition
>
>;

openInterest?:
NullableNumber;

totalLong?:
NullableNumber;

totalShort?:
NullableNumber;

positioningChange?:
NullableNumber;

extremes?:
Partial<
Record<
COTTraderGroup,
COTPositioningExtreme
>
>;

}


/* =====================================================
GROUP DIVERGENCE
===================================================== */

/*
* COT becomes especially useful when different
* participant groups move in opposite directions.
*
* This is descriptive data.
*
* It does NOT directly create a CALL or PUT signal.
*/

export interface COTGroupDivergence {

market:
COTMarket;

groupA:
COTTraderGroup;

groupB:
COTTraderGroup;

observation:
string;

netChangeA:
NullableNumber;

netChangeB:
NullableNumber;

significance:
string;

confidence:
number;

}


/* =====================================================
MARKET POSITIONING SUMMARY
===================================================== */

/*
* This summary is generated from structured COT data.
*
* "bias" remains descriptive rather than an
* execution signal.
*
* The summary deliberately transports several
* positioning horizons:
*
* weeklyChange
* =
* latest one-week net-position change.
*
* change4W
* =
* short-term positioning tendency.
*
* change13W
* =
* medium-term positioning tendency.
*
* change26W
* =
* half-year positioning tendency.
*
* percentile / zScore
* =
* current positioning relative to the historical
* distribution, normally using the provider's
* 52-week research window.
*
* normalized changes allow cross-market comparisons
* without treating identical contract changes as
* economically identical across different markets.
*/

export type COTPositioningBias =
| "NET_LONG"
| "NET_SHORT"
| "BALANCED"
| "EXTREME_LONG"
| "EXTREME_SHORT"
| "UNKNOWN";


export interface COTMarketPositioningSummary {

market:
COTMarket;

reportDate:
string;

group:
COTTraderGroup;

bias:
COTPositioningBias;


/*
* Current positioning level.
*/

netPosition:
NullableNumber;


/*
* Multi-horizon positioning changes.
*/

weeklyChange:
NullableNumber;

change4W:
NullableNumber;

change13W:
NullableNumber;

change26W:
NullableNumber;


/*
* Changes normalized against the historical
* net-position range of the same market/group.
*/

normalizedChange4W:
NullableNumber;

normalizedChange13W:
NullableNumber;

normalizedChange26W:
NullableNumber;


/*
* Historical distribution context.
*/

percentile:
NullableNumber;

zScore:
NullableNumber;

isExtreme:
boolean;


/*
* Human-readable descriptive summary.
*/

summary:
string;

}


/* =====================================================
COT HISTORY
===================================================== */

/*
* One series represents one market / trader-group
* combination.
*
* Example:
*
* NASDAQ / ASSET_MANAGER
* NASDAQ / LEVERAGED_MONEY
* RUSSELL_2000 / ASSET_MANAGER
*
* The provider normally supplies up to:
*
* 4 markets × 5 trader groups = 20 series.
*/

export interface COTHistoricalSeries {

market:
COTMarket;

group:
COTTraderGroup;

observations:
COTWeeklyObservation[];

}


/* =====================================================
COT RESEARCH DATA
===================================================== */

/*
* This is the object eventually passed into the
* AI Research Context.
*
* It remains completely separate from
* AIResearchSource[].
*
* Important:
*
* observations
* =
* raw normalized weekly COT observations.
*
* summaries
* =
* latest market/group positioning metrics including
* multi-horizon changes and historical context.
*
* divergences
* =
* detected disagreement between trader groups.
*
* history
* =
* historical market/group series used for trend and
* persistence research.
*/

export interface AIResearchCOTData {

generatedAt:
string;

latestReportDate:
string | null;

observations:
COTWeeklyObservation[];

summaries:
COTMarketPositioningSummary[];

divergences:
COTGroupDivergence[];

history:
COTHistoricalSeries[];

diagnostics?: {

source:
string;

observationCount:
number;

marketsCovered:
COTMarket[];

warnings:
string[];

};

}
