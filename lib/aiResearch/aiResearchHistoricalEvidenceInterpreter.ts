import type {
AIHistoricalEvidenceHorizon,
AIHistoricalEvidenceObservation,
AIResearchHistoricalEvidence,
} from "./aiResearchHistoricalEvidenceTypes";

/* =====================================================
AI RESEARCH - HISTORICAL EVIDENCE INTERPRETER
===================================================== */

/*
* Converts historical research evidence into
* auditable descriptive interpretations.
*
* IMPORTANT:
*
* - No trading signals
* - No Master Score modification
* - No execution-state modification
* - No position sizing
* - No implied predictive edge
*
* Historical forward returns refer to the
* NASDAQ underlying index, not Optionsscheine.
*/

/* =====================================================
TYPES
===================================================== */

export type AIHistoricalInterpretationDirection =
| "POSITIVE"
| "NEGATIVE"
| "MIXED"
| "INSUFFICIENT_DATA";

export interface AIHistoricalHorizonInterpretation {

horizonDays:
AIHistoricalEvidenceHorizon;

direction:
AIHistoricalInterpretationDirection;

averageForwardReturn:
number | null;

medianForwardReturn:
number | null;

positiveRate:
number | null;

negativeRate:
number | null;

sampleSize:
number;

/*
* True when the descriptive mean and median
* point in opposite directions.
*/

meanMedianDisagreement:
boolean;

/*
* This is a description of historical data,
* not a forecast confidence score.
*/

summary:
string;

limitations:
string[];

}

export interface AIHistoricalStateInterpretation {

family:
string;

state:
string;

market:
string;

asOfDate:
string;

horizons:
AIHistoricalHorizonInterpretation[];

summary:
string;

}

export interface AIHistoricalEvidenceInterpretation {

status:
AIResearchHistoricalEvidence["status"];

asOfDate:
string | null;

firstDate:
string | null;

lastDate:
string | null;

matchedStates:
number;

evaluatedStates:
number;

states:
AIHistoricalStateInterpretation[];

/*
* Historical descriptive findings only.
*/

supportingObservations:
string[];

counterObservations:
string[];

limitations:
string[];

summary:
string;

/*
* Explicitly false until a separate,
* valid predictive study establishes an edge.
*/

predictiveEdgeValidated:
false;

}

/* =====================================================
HELPERS
===================================================== */

function finite(
value: number | null | undefined
): value is number {

return (
typeof value === "number" &&
Number.isFinite(value)
);

}

function formatPercent(
value: number | null,
decimals = 2
): string {

if (!finite(value)) {
return "n/a";
}

const sign =
value > 0 ? "+" : "";

return `${sign}${value.toFixed(decimals)}%`;

}

function getDirection(
mean: number | null,
median: number | null
): AIHistoricalInterpretationDirection {

if (
!finite(mean) ||
!finite(median)
) {
return "INSUFFICIENT_DATA";
}

if (
mean > 0 &&
median > 0
) {
return "POSITIVE";
}

if (
mean < 0 &&
median < 0
) {
return "NEGATIVE";
}

return "MIXED";

}

/* =====================================================
HORIZON INTERPRETATION
===================================================== */

function interpretHorizon(
observation: AIHistoricalEvidenceObservation
): AIHistoricalHorizonInterpretation {

const mean =
observation.averageForwardReturn;

const median =
observation.medianForwardReturn;

const validSample =
observation.sampleSize > 0 &&
finite(mean) &&
finite(median);

const direction =
validSample
? getDirection(mean, median)
: "INSUFFICIENT_DATA";

const meanMedianDisagreement =
validSample &&
(
(mean > 0 && median < 0) ||
(mean < 0 && median > 0)
);

const summary =
direction === "INSUFFICIENT_DATA"
? `T+${observation.horizonDays}: Keine ausreichend vollständigen historischen Renditedaten.`
: (
`T+${observation.horizonDays}: ` +
`Mittelwert ${formatPercent(mean)}, ` +
`Median ${formatPercent(median)}, ` +
`positive Beobachtungen ${formatPercent(
observation.positiveRate
)}, ` +
`n=${observation.sampleSize}.`
);

return {

horizonDays:
observation.horizonDays,

direction,

averageForwardReturn:
mean,

medianForwardReturn:
median,

positiveRate:
observation.positiveRate,

negativeRate:
observation.negativeRate,

sampleSize:
observation.sampleSize,

meanMedianDisagreement,

summary,

limitations: [
...observation.limitations,
],

};

}

/* =====================================================
STATE INTERPRETATION
===================================================== */

function interpretState(
state: AIResearchHistoricalEvidence["currentStates"][number],
observations: AIHistoricalEvidenceObservation[]
): AIHistoricalStateInterpretation {

const horizons =
observations
.map(interpretHorizon)
.sort(
(a, b) =>
a.horizonDays - b.horizonDays
);

const validHorizonCount =
horizons.filter(
(horizon) =>
horizon.direction !==
"INSUFFICIENT_DATA"
).length;

const summary =
`${state.family} / ${state.state}: ` +
`${validHorizonCount} historische Horizonte auswertbar.`;

return {

family:
state.family,

state:
state.state,

market:
state.market,

asOfDate:
state.asOfDate,

horizons,

summary,

};

}

/* =====================================================
MAIN INTERPRETER
===================================================== */

export function interpretAIHistoricalEvidence(
evidence: AIResearchHistoricalEvidence
): AIHistoricalEvidenceInterpretation {

const states:
AIHistoricalStateInterpretation[] = [];

const supportingObservations:
string[] = [];

const counterObservations:
string[] = [];

const limitations =
[...evidence.diagnostics.warnings];

if (
evidence.status === "NOT_AVAILABLE" ||
evidence.status === "ERROR"
) {

return {

status:
evidence.status,

asOfDate:
evidence.asOfDate,

firstDate:
evidence.firstDate,

lastDate:
evidence.lastDate,

matchedStates:
0,

evaluatedStates:
0,

states: [],

supportingObservations: [],

counterObservations: [],

limitations,

summary:
"Historische Evidenz ist derzeit nicht verfügbar.",

predictiveEdgeValidated:
false,

};

}

/* =================================================
* MATCH CURRENT STATES
* ================================================= */

for (const currentState of evidence.currentStates) {

if (!currentState.comparable) {
continue;
}

const matchingObservations =
evidence.observations.filter(
(observation) =>
observation.family ===
currentState.family &&
observation.market ===
currentState.market &&
observation.state ===
currentState.state
);

if (
matchingObservations.length === 0
) {
continue;
}

const interpreted =
interpretState(
currentState,
matchingObservations
);

states.push(interpreted);

/* ===============================================
* DESCRIPTIVE FINDINGS
* =============================================== */

for (const horizon of interpreted.horizons) {

if (
horizon.direction ===
"INSUFFICIENT_DATA"
) {
continue;
}

const finding =
`${interpreted.family} / ` +
`${interpreted.state}, ` +
`T+${horizon.horizonDays}: ` +
`historischer Mittelwert ` +
`${formatPercent(
horizon.averageForwardReturn
)}, ` +
`Median ${formatPercent(
horizon.medianForwardReturn
)}, ` +
`n=${horizon.sampleSize}.`;

/*
* Supporting means historically positive
* NASDAQ underlying returns.
*
* Counter means historically negative
* NASDAQ underlying returns.
*
* These labels do NOT refer to support or
* contradiction of the current market thesis.
*/

if (
horizon.direction === "POSITIVE"
) {

supportingObservations.push(
finding
);

} else if (
horizon.direction === "NEGATIVE"
) {

counterObservations.push(
finding
);

} else {

limitations.push(
`Uneinheitliche historische Renditen: ${finding}`
);

}

}

}

/* =================================================
* METHODOLOGICAL LIMITATIONS
* ================================================= */

limitations.push(
"Die Ergebnisse beschreiben historische NASDAQ-Indexrenditen, keine Optionsschein-Renditen."
);

limitations.push(
"Überlappende Beobachtungsfenster reduzieren die effektive statistische Unabhängigkeit."
);

limitations.push(
"Ohne passende Kontrollgruppen und Out-of-Sample-Validierung ist kein eigenständiger Prognosevorteil nachgewiesen."
);

limitations.push(
"Die Zustandsfamilien können dieselben Handelstage mehrfach erfassen und dürfen nicht als unabhängige Bestätigungen gezählt werden."
);

/* =================================================
* SUMMARY
* ================================================= */

const summary =
states.length === 0
? "Keine vergleichbaren historischen Price-/VIX-Zustände für den aktuellen Markttag gefunden."
: (
`${states.length} aktuelle Price-/VIX-Zustände ` +
`mit historischen Vergleichsgruppen ausgewertet. ` +
`${supportingObservations.length} Horizonte mit ` +
`positivem Mittelwert und Median, ` +
`${counterObservations.length} Horizonte mit ` +
`negativem Mittelwert und Median. ` +
`Die Ergebnisse sind deskriptiv und keine Handelssignale.`
);

return {

status:
evidence.status,

asOfDate:
evidence.asOfDate,

firstDate:
evidence.firstDate,

lastDate:
evidence.lastDate,

matchedStates:
evidence.diagnostics.matchedCurrentStates,

evaluatedStates:
states.length,

states,

supportingObservations,

counterObservations,

limitations,

summary,

predictiveEdgeValidated:
false,

};

}

