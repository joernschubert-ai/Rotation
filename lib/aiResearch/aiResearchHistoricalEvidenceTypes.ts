/* =====================================================
AI RESEARCH - HISTORICAL EVIDENCE TYPES
===================================================== */

/*
* Historical evidence is a separate research input.
*
* It must not be confused with:
*
* - current Rotation-App market snapshots
* - trusted recent AI Research snapshot history
* - COT positioning
* - external news and research
* - execution signals
*
* Historical forward outcomes describe what happened
* after comparable historical market conditions.
*
* They do not independently establish a trading edge
* or constitute a trade recommendation.
*/

/* =====================================================
RESEARCH DIMENSIONS
===================================================== */

export type AIHistoricalEvidenceFamily =
| "PRICE_TREND"
| "PRICE_TRANSITION"
| "VIX_5D"
| "VIX_20D"
| "PRICE_VIX_5D"
| "PRICE_VIX_20D"
| "BREADTH"
| "DIVERGENCE"
| "ROTATION"
| "LEADERSHIP"
| "MACRO"
| "COMBINED";

export type AIHistoricalEvidenceMarket =
| "NASDAQ"
| "RUSSELL_2000"
| "SP500"
| "CROSS_MARKET";

export type AIHistoricalEvidenceHorizon =
| 5
| 20
| 60;

export type AIHistoricalEvidenceQuality =
| "HIGH"
| "MODERATE"
| "LOW"
| "INSUFFICIENT";

export type AIHistoricalEvidenceStatus =
| "AVAILABLE"
| "PARTIAL"
| "NOT_AVAILABLE"
| "ERROR";

/* =====================================================
HISTORICAL OBSERVATION SUMMARY
===================================================== */

export interface AIHistoricalEvidenceObservation {
/*
* Research family and observed historical state.
*
* State values retain their original engine labels.
*/
family: AIHistoricalEvidenceFamily;

state: string;

market: AIHistoricalEvidenceMarket;

/*
* Forward-return horizon in trading days.
*/
horizonDays: AIHistoricalEvidenceHorizon;

/*
* Historical observations belonging to the state.
*
* sampleSize is the number with a valid forward
* outcome for the specified horizon.
*/
sampleSize: number;

/*
* Historical forward returns in percentage points.
*
* For example:
* +3.5 means a +3.5% underlying-index return.
*
* Returns are NOT warrant returns.
*/
averageForwardReturn: number | null;

medianForwardReturn: number | null;

positiveRate: number | null;

negativeRate: number | null;

/*
* Historical maximum favorable/adverse excursions,
* expressed as percentages of the underlying index.
*
* May be null if not calculated for the horizon.
*/
averageMFE: number | null;

averageMAE: number | null;

/*
* Optional comparable reference population.
*
* A baseline must be explicitly calculated from
* historical data, never invented or assumed.
*/
baselineSampleSize: number | null;

baselineAverageReturn: number | null;

/*
* Difference versus the baseline in percentage
* points. Null when no valid baseline exists.
*/
excessReturn: number | null;

/*
* True when the underlying observations have
* overlapping forward-return windows.
*/
overlappingObservations: boolean;

/*
* True only if observations were selected using
* a documented non-overlapping method.
*/
nonOverlappingSelection: boolean;

/*
* True only when a documented matched-control
* comparison was performed.
*/
matchedControl: boolean;

/*
* Describes how the historical state was selected.
*
* For example:
* DAILY_STATE
* TRANSITION_EVENT
* EPISODE_START
*/
selectionMethod: string;

/*
* Dates of the historical sample, YYYY-MM-DD.
*/
firstObservationDate: string | null;

lastObservationDate: string | null;

/*
* Research data quality, not trading confidence.
*/
dataQuality: AIHistoricalEvidenceQuality;

/*
* Explicit caveats and limitations.
*/
limitations: string[];
}

/* =====================================================
CURRENT-STATE MATCH
===================================================== */

export interface AIHistoricalEvidenceCurrentState {
/*
* Current observed market state.
*
* The state must be derived from current market
* data using compatible feature definitions.
*/
family: AIHistoricalEvidenceFamily;

market: AIHistoricalEvidenceMarket;

state: string;

asOfDate: string;

/*
* Whether the current state can be compared with
* the corresponding historical observations.
*/
comparable: boolean;

/*
* Reasons for incompatibility or uncertainty.
*/
limitations: string[];
}

/* =====================================================
HISTORICAL EVIDENCE DATASET
===================================================== */

export interface AIResearchHistoricalEvidence {
/*
* Latest date represented by the research data.
*/
asOfDate: string | null;

/*
* Historical sample coverage.
*/
firstDate: string | null;

lastDate: string | null;

/*
* Availability of historical research results.
*/
status: AIHistoricalEvidenceStatus;

/*
* Current states eligible for historical comparison.
*/
currentStates: AIHistoricalEvidenceCurrentState[];

/*
* Auditable historical outcome statistics.
*/
observations: AIHistoricalEvidenceObservation[];

/*
* Data-quality and coverage diagnostics.
*/
diagnostics: {
totalHistoricalDays: number;

totalObservations: number;

totalGroups: number;

matchedCurrentStates: number;

unmatchedCurrentStates: number;

/*
* Whether all forward outcomes were calculated
* strictly from subsequent market observations.
*/
forwardOutcomesUseFuturePrices: boolean;

/*
* Whether historical state classification uses
* only information available on its own date.
*/
historicalFeaturesAvoidLookahead: boolean;

/*
* Important distinction:
*
* The presence of historical observations
* does not establish predictive superiority.
*/
predictiveEdgeValidated: boolean;

warnings: string[];
};
}

