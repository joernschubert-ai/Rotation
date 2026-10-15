import type {
HistoricalPriceVixForwardDataset,
HistoricalPriceVixHorizonStatistics,
HistoricalPriceVixResearchFamily,
HistoricalPriceVixResearchStatistics,
} from "@/lib/historicalRegime/historicalRegimePriceVixForward";

import type {
HistoricalPriceVixFeatureDay,
} from "@/lib/historicalRegime/historicalRegimePriceVixFeatures";

import type {
AIHistoricalEvidenceFamily,
AIHistoricalEvidenceHorizon,
AIHistoricalEvidenceObservation,
AIHistoricalEvidenceQuality,
AIResearchHistoricalEvidence,
} from "./aiResearchHistoricalEvidenceTypes";

/* =====================================================
AI RESEARCH - HISTORICAL EVIDENCE PROVIDER
===================================================== */

/*
* Adapts existing historical Price/VIX research
* into the AI Research historical evidence schema.
*
* IMPORTANT:
*
* - Does not fetch market data
* - Does not recalculate historical forward returns
* - Does not create trading signals
* - Does not modify existing market engines
* - Does not assume predictive superiority
*
* The caller supplies previously calculated research.
*/

/* =====================================================
INPUT
===================================================== */

export interface BuildAIHistoricalEvidenceInput {
forwardDataset: HistoricalPriceVixForwardDataset;

currentFeatureDay?: HistoricalPriceVixFeatureDay | null;
}

/* =====================================================
CONSTANTS
===================================================== */

const HORIZONS: AIHistoricalEvidenceHorizon[] = [
5,
20,
60,
];

/* =====================================================
HELPERS
===================================================== */

function finiteOrNull(
value: number | null | undefined
): number | null {
return typeof value === "number" &&
Number.isFinite(value)
? value
: null;
}

function mapFamily(
family: HistoricalPriceVixResearchFamily
): AIHistoricalEvidenceFamily {
return family;
}

function determineQuality(
sampleSize: number
): AIHistoricalEvidenceQuality {
if (sampleSize < 30) {
return "INSUFFICIENT";
}

if (sampleSize < 100) {
return "LOW";
}

if (sampleSize < 300) {
return "MODERATE";
}

return "HIGH";
}

/*
* Sample-size quality is descriptive only.
*
* A large number of overlapping daily observations
* does not establish statistical independence or
* predictive validity.
*/

function buildLimitations(
sampleSize: number,
family: HistoricalPriceVixResearchFamily
): string[] {
const limitations: string[] = [
"Historical outcomes describe underlying-index returns, not Optionsschein performance.",
"Overlapping forward-return windows reduce effective sample independence.",
"No predictive trading edge is established by these descriptive statistics.",
"The unconditional baseline uses each aligned historical date once per horizon. It is not a matched control, risk adjustment or out-of-sample test.",
];

if (sampleSize < 30) {
limitations.push(
"Fewer than 30 valid forward observations."
);
}

if (family === "PRICE_TRANSITION") {
limitations.push(
"Transition events are analyzed separately from daily market states."
);
}

return limitations;
}

/* =====================================================
HORIZON LOOKUP
===================================================== */

function getHorizonStatistics(
statistics: HistoricalPriceVixResearchStatistics,
horizon: AIHistoricalEvidenceHorizon
): HistoricalPriceVixHorizonStatistics | null {
return (
statistics.horizonStats.find(
(item) => item.horizon === horizon
) ?? null
);
}

/* =====================================================
OBSERVATION MAPPING
===================================================== */

function buildObservation(
statistics: HistoricalPriceVixResearchStatistics,
horizon: AIHistoricalEvidenceHorizon,
baseline?: HistoricalPriceVixHorizonStatistics
): AIHistoricalEvidenceObservation {
const horizonStats = getHorizonStatistics(
statistics,
horizon
);

const sampleSize = horizonStats?.available ?? 0;

return {
family: mapFamily(statistics.family),

state: statistics.state,

market: "NASDAQ",

horizonDays: horizon,

sampleSize,

averageForwardReturn: finiteOrNull(
horizonStats?.averageReturn
),

medianForwardReturn: finiteOrNull(
horizonStats?.medianReturn
),

positiveRate: finiteOrNull(
horizonStats?.positiveRate
),

negativeRate: finiteOrNull(
horizonStats?.negativeRate
),

averageMFE: finiteOrNull(
horizonStats?.averageMFE
),

averageMAE: finiteOrNull(
horizonStats?.averageMAE
),

baselineSampleSize: baseline?.available ?? null,

baselineAverageReturn: finiteOrNull(baseline?.averageReturn),

excessReturn: finiteOrNull(horizonStats?.averageReturn) !== null && finiteOrNull(baseline?.averageReturn) !== null
? horizonStats!.averageReturn! - baseline!.averageReturn! : null,

overlappingObservations: true,

nonOverlappingSelection: false,

matchedControl: false,

selectionMethod:
statistics.family === "PRICE_TRANSITION"
? "TRANSITION_EVENT"
: "DAILY_STATE",

firstObservationDate: statistics.firstDate,

lastObservationDate: statistics.lastDate,

dataQuality: determineQuality(sampleSize),

limitations: buildLimitations(
sampleSize,
statistics.family
),
};
}

/* =====================================================
CURRENT STATE EXTRACTION
===================================================== */

function buildCurrentStates(
current: HistoricalPriceVixFeatureDay | null | undefined
): AIResearchHistoricalEvidence["currentStates"] {
if (!current) {
return [];
}

const states: AIResearchHistoricalEvidence["currentStates"] =
[];

const addState = (
family: AIHistoricalEvidenceFamily,
state: string,
comparable: boolean
): void => {
states.push({
family,
market: "NASDAQ",
state,
asOfDate: current.date,
comparable,
limitations: comparable
? []
: [
"Current feature state is not sufficiently defined for historical comparison.",
],
});
};

addState(
"PRICE_TREND",
current.priceTrendState,
current.priceTrendState !== "INSUFFICIENT_DATA"
);

addState(
"VIX_5D",
current.vixTrendState5D,
current.vixTrendState5D !== "INSUFFICIENT_DATA"
);

addState(
"VIX_20D",
current.vixTrendState20D,
current.vixTrendState20D !== "INSUFFICIENT_DATA"
);

addState(
"PRICE_VIX_5D",
current.priceVixDivergence5D,
current.priceVixDivergence5D !== "INSUFFICIENT_DATA"
);

addState(
"PRICE_VIX_20D",
current.priceVixDivergence20D,
current.priceVixDivergence20D !== "INSUFFICIENT_DATA"
);

for (const transition of current.transitions) {
if (transition === "NONE") {
continue;
}

addState(
"PRICE_TRANSITION",
transition,
true
);
}

return states;
}

/* =====================================================
BUILD HISTORICAL EVIDENCE
===================================================== */

export function buildAIHistoricalEvidence(
input: BuildAIHistoricalEvidenceInput
): AIResearchHistoricalEvidence {
const dataset = input.forwardDataset;

const observations: AIHistoricalEvidenceObservation[] =
[];

for (const statistics of dataset.statistics) {
for (const horizon of HORIZONS) {
observations.push(
buildObservation(statistics, horizon, dataset.baselineStatistics?.find(item => item.horizon === horizon))
);
}
}

const currentStates = buildCurrentStates(
input.currentFeatureDay
);

const availableStateKeys = new Set(
observations
.filter((observation) => observation.sampleSize > 0)
.map(
(observation) =>
`${observation.family}:${observation.market}:${observation.state}`
)
);

const matchedCurrentStates = currentStates.filter(
(state) =>
state.comparable &&
availableStateKeys.has(
`${state.family}:${state.market}:${state.state}`
)
).length;

const unmatchedCurrentStates =
currentStates.length - matchedCurrentStates;

const warnings: string[] = [
"Historical Price/VIX results are descriptive, not independently validated trading signals.",
"Daily forward-return observations may overlap substantially.",
"Historical comparison does not include Optionsschein time decay, implied volatility or bid-ask spreads.",
];

if (!input.currentFeatureDay) {
warnings.push(
"No current Price/VIX feature day supplied; historical results cannot yet be matched to the current market state."
);
}

if (unmatchedCurrentStates > 0) {
warnings.push(
`${unmatchedCurrentStates} current Price/VIX states have no valid historical match.`
);
}

const firstDate =
dataset.observations.length > 0
? dataset.observations[0].date
: null;

const lastDate =
dataset.observations.length > 0
? dataset.observations[
dataset.observations.length - 1
].date
: null;

const status: AIResearchHistoricalEvidence["status"] =
observations.length === 0
? "NOT_AVAILABLE"
: !input.currentFeatureDay ||
unmatchedCurrentStates > 0
? "PARTIAL"
: "AVAILABLE";

return {
asOfDate: lastDate,

firstDate,

lastDate,

status,

currentStates,

observations,

diagnostics: {
totalHistoricalDays:
dataset.diagnostics.inputFeatureDays,

totalObservations:
dataset.diagnostics.totalObservations,

totalGroups:
dataset.diagnostics.totalGroups,

matchedCurrentStates,

unmatchedCurrentStates,

forwardOutcomesUseFuturePrices: true,

historicalFeaturesAvoidLookahead:
dataset.diagnostics.usesOnlyHistoricalFeatures,

predictiveEdgeValidated: false,

warnings,
},
};
}

