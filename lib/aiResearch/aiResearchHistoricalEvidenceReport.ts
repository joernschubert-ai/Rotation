import type {
AIResearchReport,
AIResearchStructuralBias,
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
interpretAIHistoricalEvidence(evidence);

if (
interpretation.status === "NOT_AVAILABLE" ||
interpretation.status === "ERROR" ||
interpretation.evaluatedStates === 0
) {
return {
...report,

summary:
`${report.summary} ` +
"Historical Price/VIX comparison: not available.",
};
}

const structuralBias:
AIResearchStructuralBias =
report.evidenceAssessment?.structuralBias ??
"NEUTRAL";

const supportingEvidence = [
...report.thesis.supportingEvidence,
];

const counterEvidence = [
...report.thesis.counterEvidence,
];

/*
* The interpreter uses:
*
* supportingObservations = positive Nasdaq returns
* counterObservations = negative Nasdaq returns
*
* These must be reclassified relative to the
* current structural research bias.
*/

if (structuralBias === "BEARISH") {

for (
const finding of
interpretation.supportingObservations
) {
counterEvidence.push(
historicalFinding(finding)
);
}

for (
const finding of
interpretation.counterObservations
) {
supportingEvidence.push(
historicalFinding(finding)
);
}

} else if (structuralBias === "BULLISH") {

for (
const finding of
interpretation.supportingObservations
) {
supportingEvidence.push(
historicalFinding(finding)
);
}

for (
const finding of
interpretation.counterObservations
) {
counterEvidence.push(
historicalFinding(finding)
);
}

} else {

/*
* For NEUTRAL/MIXED bias, historical direction
* cannot be classified as supporting a thesis.
*/

for (
const finding of [
...interpretation.supportingObservations,
...interpretation.counterObservations,
]
) {
counterEvidence.push(
historicalFinding(
`Descriptive context without a clear ` +
`directional structural thesis. ${finding}`
)
);
}

}

/*
* Historical associations are not independent
* confirmations. State families can overlap.
*
* The report must explicitly retain this warning.
*/

const limitations = uniqueStrings(
interpretation.limitations
);

const historicalRisks = [
...report.risks,
{
risk:
"Historical evidence uncertainty",

explanation:
[
`Price/VIX comparison as of ` +
`${interpretation.asOfDate ?? "unknown"}.`,
"Historical Nasdaq outcomes are descriptive.",
"Overlapping observations and correlated " +
"state families are not independent confirmations.",
"No validated predictive edge or " +
"Optionsschein performance is established.",
...limitations.slice(0, 3),
].join(" "),

evidenceType:
"HISTORY" as const,
},
];

return {
...report,

thesis: {
...report.thesis,

supportingEvidence:
uniqueStrings(supportingEvidence),

counterEvidence:
uniqueStrings(counterEvidence),
},

risks:
historicalRisks,

summary:
[
report.summary,
interpretation.summary,
`Historical evidence as of ` +
`${interpretation.asOfDate ?? "unknown"}.`,
"Historical comparisons are descriptive " +
"and do not change research execution states.",
].join(" "),
};
}

