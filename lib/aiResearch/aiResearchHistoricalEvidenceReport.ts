import type {
AIResearchReport,
} from "./aiResearchTypes";

import type {
AIResearchHistoricalEvidence,
} from "./aiResearchHistoricalEvidenceTypes";

import {
interpretAIHistoricalEvidence,
} from "./aiResearchHistoricalEvidenceInterpreter";

/* =====================================================
AI RESEARCH - HISTORICAL EVIDENCE REPORT BRIDGE
===================================================== */

/*
* Enriches an existing AI Research report with
* descriptive historical Price/VIX findings.
*
* The complete structured historical evidence is
* attached to the report for dashboard consumption.
*
* Does not change:
*
* - Master Score
* - Market engines
* - Structural bias
* - Confirmation or contradiction levels
* - Entry maturity
* - Opportunity state
* - Forward-test claims
* - Execution or position sizing
*
* Historical Nasdaq returns are not warrant P&L.
*/

/* =====================================================
HELPERS
===================================================== */

function uniqueStrings(
values: string[]
): string[] {
return [
...new Set(
values.filter(
(value) => value.trim().length > 0
)
),
];
}

function historicalFinding(
text: string
): string {
return `Historical Price/VIX research: ${text}`;
}

/* =====================================================
REPORT ENRICHMENT
===================================================== */

export function enrichAIResearchWithHistoricalEvidence(
report: AIResearchReport,
evidence: AIResearchHistoricalEvidence
): AIResearchReport {

const interpretation =
interpretAIHistoricalEvidence({
  ...evidence,
  currentStates: evidence.currentStates.filter(state => state.comparable),
});

/*
* Always attach the structured evidence.
*
* This includes unavailable/error states so
* that the dashboard can display diagnostics
* rather than silently hiding the research.
*/

const reportWithHistoricalEvidence:
AIResearchReport = {
...report,
historicalEvidence: evidence,
};

/* =================================================
* UNAVAILABLE HISTORICAL EVIDENCE
* ================================================= */

if (
interpretation.status === "NOT_AVAILABLE" ||
interpretation.status === "ERROR" ||
interpretation.evaluatedStates === 0
) {
return {
...reportWithHistoricalEvidence,

summary: [
report.summary,
"Historical Price/VIX comparison: not available.",
].join(" "),
};
}

/* Absolute forward returns remain descriptive context.
 * Positive average returns do not demonstrate outperformance against the
 * normal index return; negative returns alone do not establish a short edge.
 * The existing interpreter groups findings by absolute return sign, so its
 * output must not be relabelled as thesis support or contradiction.
 * Keep every structured observation attached for later baseline evaluation.
 */
const supportingEvidence = [...report.thesis.supportingEvidence];
const counterEvidence = [...report.thesis.counterEvidence];
/* =================================================
* HISTORICAL RESEARCH LIMITATIONS
* ================================================= */

const limitations = uniqueStrings(
interpretation.limitations
);

const historicalRisks = [
...report.risks,
{
risk:
"Historical evidence uncertainty",

explanation: [
"Price/VIX comparison as of " +
(interpretation.asOfDate ?? "unknown") +
".",

"Historical Nasdaq outcomes are descriptive. Absolute return signs are not classified as support or contradiction of the current thesis; baseline-relative evidence is not established.",

"Overlapping observations and correlated " +
"state families are not independent " +
"confirmations.",

"No validated predictive edge or " +
"Optionsschein performance is established.",

...limitations.slice(0, 3),
].join(" "),

evidenceType: "HISTORY" as const,
},
];

/* =================================================
* FINAL ENRICHED REPORT
* ================================================= */

return {
...reportWithHistoricalEvidence,

thesis: {
...report.thesis,

supportingEvidence:
uniqueStrings(supportingEvidence),

counterEvidence:
uniqueStrings(counterEvidence),
},

risks: historicalRisks,

summary: [
report.summary,

interpretation.summary,

"Historical evidence as of " +
(interpretation.asOfDate ?? "unknown") +
".",

"Historical comparisons are descriptive " +
"and do not change research execution states.",
].join(" "),
};
}

