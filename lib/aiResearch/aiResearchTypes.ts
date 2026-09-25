// /lib/aiResearch/aiResearchTypes.ts

/* =====================================================
AI RESEARCH TYPES
===================================================== */

/*
* The AI Research Agent is an ANALYSIS layer.
*
* It does NOT:
*
* - modify market engines
* - modify Master Score
* - create trading signals
* - execute trades
* - change position sizing
*
* It receives an already calculated market snapshot
* and produces an independent research interpretation.
*
* The snapshot remains the source of truth for the
* quantitative state of the Rotation-App.
*/


/* =====================================================
GENERIC NUMERIC TYPES
===================================================== */

export type NullableNumber =
| number
| null
| undefined;


/* =====================================================
RESEARCH INPUT
===================================================== */

/*
* The complete persisted market snapshot.
*
* We deliberately keep this open initially.
*
* createMarketSnapshot() already contains a large,
* evolving diagnostic structure. The AI layer should
* not duplicate that structure and thereby create a
* second incompatible schema.
*
* The first research version therefore accepts the
* persisted snapshot as an immutable data object.
*/

export type AIResearchSnapshot =
Record<string, unknown>;


/*
* Historical snapshots.
*
* History is supplied separately from the current
* snapshot because the agent needs to distinguish:
*
* CURRENT STATE
*
* from
*
* REGIME DEVELOPMENT.
*/

export type AIResearchHistory =
AIResearchSnapshot[];


/* =====================================================
RESEARCH CONTEXT
===================================================== */

/*
* Context describing why the research was requested.
*
* This allows the same agent to later support different
* research tasks without changing the market engine.
*/

export type AIResearchTask =
| "DAILY_MARKET_REVIEW"
| "REGIME_REVIEW"
| "ROTATION_REVIEW"
| "CRASH_RISK_REVIEW"
| "TRADE_SETUP_REVIEW"
| "ANOMALY_REVIEW"
| "FORWARD_TEST_REVIEW";


export interface AIResearchContext {

/*
* Type of analysis requested.
*/

task: AIResearchTask;

/*
* ISO timestamp when the research request was created.
*/

requestedAt: string;

/*
* Optional human question or research instruction.
*/

question?: string;

}


/* =====================================================
EXTERNAL RESEARCH
===================================================== */

/*
* External information is deliberately separated from
* the quantitative Rotation-App snapshot.
*
* The first version does not fetch anything yet.
*
* Later this section can contain:
*
* - market news
* - central-bank information
* - macroeconomic releases
* - semiconductor / AI news
* - Nasdaq-specific news
* - Russell / small-cap news
* - volatility information
* - relevant analyst / market commentary
*
* Each source must remain attributable.
*/

export interface AIResearchSource {

/*
* Human-readable source title.
*/

title: string;

/*
* Source URL.
*/

url: string;

/*
* Publisher or originating organization.
*/

publisher?: string;

/*
* Publication timestamp if available.
*/

publishedAt?: string;

/*
* Short extracted text or summary.
*
* This is NOT intended to store entire articles.
*/

summary?: string;

/*
* Source relevance from 0..100.
*
* This is an internal research relevance measure,
* not a quality rating of the publisher.
*/

relevance?: number;

}


/* =====================================================
AI RESEARCH INPUT
===================================================== */

export interface AIResearchInput {

/*
* Current immutable Rotation-App snapshot.
*/

snapshot: AIResearchSnapshot;

/*
* Historical snapshots available to the agent.
*/

history: AIResearchHistory;

/*
* Description of the research task.
*/

context: AIResearchContext;

/*
* External sources are optional.
*
* The first implementation will normally receive
* an empty array.
*/

sources?: AIResearchSource[];

}


/* =====================================================
REGIME INTERPRETATION
===================================================== */

export type AIRegimeBias =
| "CONSTRUCTIVE"
| "NEUTRAL"
| "DEFENSIVE"
| "CRISIS";


export interface AIRegimeAssessment {

/*
* Independent textual interpretation of the current
* market regime.
*/

bias:
AIRegimeBias;

/*
* Confidence in the interpretation.
*
* This is NOT the Master Score confidence.
*/

confidence:
number;

/*
* Short explanation.
*/

summary:
string;

}


/* =====================================================
DIVERGENCE
===================================================== */

/*
* A core purpose of the Research Agent is to detect
* contradictions between:
*
* PRICE
* INTERNALS
* ROTATION
* LIQUIDITY
* FRAGILITY
* REGIME
*
* These observations are especially important for the
* Rotation-App because a strong index can coexist with
* deteriorating internals.
*/

export type AIDivergenceType =
| "PRICE_VS_INTERNALS"
| "NASDAQ_VS_RUSSELL"
| "PRICE_VS_BREADTH"
| "PRICE_VS_PARTICIPATION"
| "PRICE_VS_LIQUIDITY"
| "PRICE_VS_FRAGILITY"
| "ROTATION_VS_PRICE"
| "REGIME_VS_PRICE"
| "OTHER";


export interface AIDivergence {

type:
AIDivergenceType;

/*
* Human-readable observation.
*/

observation:
string;

/*
* Why this divergence matters.
*/

significance:
string;

/*
* Confidence that the divergence is actually present.
*/

confidence:
number;

}


/* =====================================================
RESEARCH THESIS
===================================================== */

export interface AIResearchThesis {

/*
* Main interpretation.
*/

statement:
string;

/*
* Evidence supporting the thesis.
*/

supportingEvidence:
string[];

/*
* Evidence that contradicts the thesis.
*/

counterEvidence:
string[];

/*
* What would invalidate the thesis.
*/

invalidationConditions:
string[];

}


/* =====================================================
RISK ASSESSMENT
===================================================== */

export interface AIResearchRisk {

/*
* Identified risk.
*/

risk:
string;

/*
* Why the risk matters.
*/

explanation:
string;

/*
* Whether the risk is directly supported by
* quantitative snapshot data, external information,
* or both.
*/

evidenceType:
| "SNAPSHOT"
| "HISTORY"
| "EXTERNAL"
| "COMBINED";

}


/* =====================================================
FORWARD-TESTABLE CLAIM
===================================================== */

/*
* This is an important architectural component.
*
* We eventually want to determine whether the AI Agent
* produces useful analysis or merely plausible prose.
*
* Therefore important forward-looking statements should
* be represented explicitly and later evaluated against
* future market observations.
*/

export type AIForecastDirection =
| "UP"
| "DOWN"
| "FLAT"
| "UNKNOWN";


export interface AIForwardTestClaim {

/*
* What the agent believes may happen.
*/

claim:
string;

/*
* Directional expectation.
*/

expectedDirection:
AIForecastDirection;

/*
* Optional horizon in trading days.
*/

horizonDays?:
number;

/*
* What observable condition would confirm the claim.
*/

confirmationCondition?:
string;

/*
* What would invalidate the claim.
*/

invalidationCondition?:
string;

/*
* Confidence in the claim.
*
* This is the AI's own confidence and must remain
* separate from Master Score / engine confidence.
*/

confidence:
number;

}


/* =====================================================
RESEARCH REPORT
===================================================== */

export interface AIResearchReport {

/*
* Metadata
*/

generatedAt:
string;

task:
AIResearchTask;

/*
* Current regime interpretation.
*/

regime:
AIRegimeAssessment;

/*
* Main research thesis.
*/

thesis:
AIResearchThesis;

/*
* Detected contradictions / divergences.
*/

divergences:
AIDivergence[];

/*
* Important risks.
*/

risks:
AIResearchRisk[];

/*
* Explicit forward-testable claims.
*/

forwardTestClaims:
AIForwardTestClaim[];

/*
* External sources used by the agent.
*/

sources:
AIResearchSource[];

/*
* Final textual summary.
*
* This is deliberately textual and does NOT represent
* a trading instruction.
*/

summary:
string;

}


/* =====================================================
AGENT OUTPUT STATUS
===================================================== */

export type AIResearchStatus =
| "SUCCESS"
| "INSUFFICIENT_DATA"
| "RESEARCH_ERROR";


export interface AIResearchResult {

status:
AIResearchStatus;

report:
AIResearchReport | null;

/*
* Technical diagnostics.
*
* These are useful during development but should not
* be exposed as trading signals.
*/

diagnostics?: {

snapshotTimestamp?:
string;

historyCount?:
number;

sourceCount?:
number;

warnings?:
string[];

};

}
