import type {
HistoricalRegimeFeatures,
} from "./historicalRegimeFeatures";

import type {
HistoricalControlObservation,
HistoricalDivergenceControlDataset,
} from "./historicalRegimeDivergenceControls";

/* =====================================================
HISTORICAL DIVERGENCE MATCH ROBUSTNESS

Purpose:
- Rebuild matched controls under temporal exclusions
- Compare exclusion windows of 0, 20, 60 sessions
- Keep event and control populations unchanged
- Use only information observable at entry date
- Never select matches using forward returns
- Quantify matching quality and coverage

Research only.
No trading signals.
No synthetic data.
No threshold optimization using outcomes.
===================================================== */

export type HistoricalMatchExclusion =
| 0
| 20
| 60;

export type HistoricalRobustnessPair = {
eventDate: string;
controlDate: string;

eventMarketIndex: number;
controlMarketIndex: number;

calendarDistanceTradingDays: number;

eventTrendBucket: string;
controlTrendBucket: string;

eventNasdaqReturn20D: number;
controlNasdaqReturn20D: number;

eventVix: number;
controlVix: number;

eventDistanceMA200: number;
controlDistanceMA200: number;

matchDistance: number;

eventForward20D: number | null;
controlForward20D: number | null;

eventForward60D: number | null;
controlForward60D: number | null;

difference20D: number | null;
difference60D: number | null;
};

export type HistoricalRobustnessHorizonStats = {
horizon: 20 | 60;

availablePairs: number;

averageEventReturn: number | null;
averageControlReturn: number | null;

averagePairedDifference: number | null;
medianPairedDifference: number | null;

negativeDifferenceRate: number | null;
};

export type HistoricalRobustnessScenario = {
exclusionTradingDays: HistoricalMatchExclusion;

pairs: HistoricalRobustnessPair[];

horizonStats: HistoricalRobustnessHorizonStats[];

diagnostics: {
inputEvents: number;
eligibleEvents: number;

inputControls: number;
eligibleControls: number;

matchedEvents: number;
unmatchedEvents: number;

matchRate: number | null;

uniqueEventDates: boolean;
uniqueControlDates: boolean;

chronological: boolean;

averageCalendarDistance: number | null;
medianCalendarDistance: number | null;

averageMatchDistance: number | null;
maximumMatchDistance: number | null;

averageAbsoluteReturnDifference: number | null;
averageAbsoluteVixDifference: number | null;
averageAbsoluteMA200Difference: number | null;

controlsBeforeEvents: number;
controlsAfterEvents: number;

matchingUsesForwardOutcomes: false;
};
};

export type HistoricalDivergenceMatchRobustnessDataset = {
scenarios: HistoricalRobustnessScenario[];

diagnostics: {
scenarioCount: number;

exclusionWindows: HistoricalMatchExclusion[];

maxCalendarDistance: number;

sameInputEventsAcrossScenarios: boolean;
sameInputControlsAcrossScenarios: boolean;

matchingUsesForwardOutcomes: false;
};
};

type Candidate = {
observation: HistoricalControlObservation;
features: HistoricalRegimeFeatures;
};

/* =====================================================
PREDECLARED MATCHING CONFIGURATION

The scales reproduce the existing matched-control
engine. They are not fitted to forward outcomes.
===================================================== */

const MAX_CALENDAR_DISTANCE = 126;

const RETURN_SCALE = 5;
const VIX_SCALE = 10;
const MA200_SCALE = 10;

const EXCLUSION_WINDOWS:
HistoricalMatchExclusion[] = [
0,
20,
60,
];

/* =====================================================
HELPERS
===================================================== */

function valid(
value: number | null | undefined,
): value is number {
return (
typeof value === "number" &&
Number.isFinite(value)
);
}

function mean(
values: number[],
): number | null {
if (!values.length) {
return null;
}

return (
values.reduce(
(sum, value) => sum + value,
0,
) / values.length
);
}

function median(
values: number[],
): number | null {
if (!values.length) {
return null;
}

const sorted = [...values].sort(
(a, b) => a - b,
);

const middle = Math.floor(
sorted.length / 2,
);

if (sorted.length % 2 === 1) {
return sorted[middle];
}

return (
sorted[middle - 1] +
sorted[middle]
) / 2;
}

function negativeRate(
values: number[],
): number | null {
if (!values.length) {
return null;
}

return (
values.filter(
(value) => value < 0,
).length / values.length
) * 100;
}

function pairDifference(
eventReturn: number | null,
controlReturn: number | null,
): number | null {
if (
!valid(eventReturn) ||
!valid(controlReturn)
) {
return null;
}

return eventReturn - controlReturn;
}

function eligible(
features: HistoricalRegimeFeatures,
): boolean {
return (
valid(features.nasdaqReturn20D) &&
valid(features.vix) &&
valid(features.nasdaqDistanceMA200)
);
}

function distance(
event: Candidate,
control: Candidate,
): number {
const eventReturn =
event.features.nasdaqReturn20D as number;

const controlReturn =
control.features.nasdaqReturn20D as number;

const eventMA200 =
event.features.nasdaqDistanceMA200 as number;

const controlMA200 =
control.features.nasdaqDistanceMA200 as number;

const returnDifference =
(eventReturn - controlReturn) /
RETURN_SCALE;

const vixDifference =
(event.features.vix -
control.features.vix) /
VIX_SCALE;

const ma200Difference =
(eventMA200 - controlMA200) /
MA200_SCALE;

return Math.sqrt(
returnDifference ** 2 +
vixDifference ** 2 +
ma200Difference ** 2
);
}

function horizonStats(
pairs: HistoricalRobustnessPair[],
horizon: 20 | 60,
): HistoricalRobustnessHorizonStats {
const complete = pairs.filter(
(pair) =>
horizon === 20
? valid(pair.difference20D)
: valid(pair.difference60D),
);

const eventReturns = complete.map(
(pair) =>
horizon === 20
? pair.eventForward20D as number
: pair.eventForward60D as number,
);

const controlReturns = complete.map(
(pair) =>
horizon === 20
? pair.controlForward20D as number
: pair.controlForward60D as number,
);

const differences = complete.map(
(pair) =>
horizon === 20
? pair.difference20D as number
: pair.difference60D as number,
);

return {
horizon,

availablePairs: complete.length,

averageEventReturn:
mean(eventReturns),

averageControlReturn:
mean(controlReturns),

averagePairedDifference:
mean(differences),

medianPairedDifference:
median(differences),

negativeDifferenceRate:
negativeRate(differences),
};
}

/* =====================================================
BUILD ELIGIBLE CANDIDATES
===================================================== */

function buildCandidates(
observations: HistoricalControlObservation[],
featureMap: Map<string, HistoricalRegimeFeatures>,
): Candidate[] {
return observations.flatMap(
(observation) => {
const features = featureMap.get(
observation.date,
);

if (
!features ||
!eligible(features)
) {
return [];
}

return [{
observation,
features,
}];
},
);
}

/* =====================================================
BUILD ONE SCENARIO

One-to-one greedy nearest-neighbor matching.

- Events processed chronologically
- Controls used once
- Same Nasdaq return bucket
- Calendar distance <= 126 sessions
- Calendar distance > exclusion threshold
- Distance based on return, VIX, MA200
- No future returns used for selection
===================================================== */

function buildScenario(
exclusionTradingDays: HistoricalMatchExclusion,
events: HistoricalControlObservation[],
controls: HistoricalControlObservation[],
featureMap: Map<string, HistoricalRegimeFeatures>,
): HistoricalRobustnessScenario {
const eligibleEvents = buildCandidates(
events,
featureMap,
).sort(
(a, b) =>
a.observation.marketIndex -
b.observation.marketIndex,
);

const eligibleControls = buildCandidates(
controls,
featureMap,
);

const usedControls = new Set<string>();

const pairs: HistoricalRobustnessPair[] = [];

for (const event of eligibleEvents) {
let best: Candidate | null = null;

let bestDistance =
Number.POSITIVE_INFINITY;

let bestCalendarDistance =
Number.POSITIVE_INFINITY;

for (const control of eligibleControls) {
if (
usedControls.has(
control.observation.date,
)
) {
continue;
}

if (
event.observation.trendBucket !==
control.observation.trendBucket
) {
continue;
}

const calendarDistance =
Math.abs(
event.observation.marketIndex -
control.observation.marketIndex,
);

if (
calendarDistance >
MAX_CALENDAR_DISTANCE ||
calendarDistance <=
exclusionTradingDays
) {
continue;
}

const currentDistance = distance(
event,
control,
);

if (
currentDistance < bestDistance ||
(
currentDistance === bestDistance &&
calendarDistance <
bestCalendarDistance
)
) {
best = control;

bestDistance = currentDistance;

bestCalendarDistance =
calendarDistance;
}
}

if (!best) {
continue;
}

usedControls.add(
best.observation.date,
);

const eventObservation =
event.observation;

const controlObservation =
best.observation;

pairs.push({
eventDate:
eventObservation.date,

controlDate:
controlObservation.date,

eventMarketIndex:
eventObservation.marketIndex,

controlMarketIndex:
controlObservation.marketIndex,

calendarDistanceTradingDays:
bestCalendarDistance,

eventTrendBucket:
eventObservation.trendBucket,

controlTrendBucket:
controlObservation.trendBucket,

eventNasdaqReturn20D:
event.features.nasdaqReturn20D as number,

controlNasdaqReturn20D:
best.features.nasdaqReturn20D as number,

eventVix:
event.features.vix,

controlVix:
best.features.vix,

eventDistanceMA200:
event.features.nasdaqDistanceMA200 as number,

controlDistanceMA200:
best.features.nasdaqDistanceMA200 as number,

matchDistance:
bestDistance,

eventForward20D:
eventObservation.forward20D,

controlForward20D:
controlObservation.forward20D,

eventForward60D:
eventObservation.forward60D,

controlForward60D:
controlObservation.forward60D,

difference20D:
pairDifference(
eventObservation.forward20D,
controlObservation.forward20D,
),

difference60D:
pairDifference(
eventObservation.forward60D,
controlObservation.forward60D,
),
});
}

const calendarDistances = pairs.map(
(pair) =>
pair.calendarDistanceTradingDays,
);

const matchDistances = pairs.map(
(pair) =>
pair.matchDistance,
);

const returnDifferences = pairs.map(
(pair) =>
Math.abs(
pair.eventNasdaqReturn20D -
pair.controlNasdaqReturn20D,
),
);

const vixDifferences = pairs.map(
(pair) =>
Math.abs(
pair.eventVix -
pair.controlVix,
),
);

const ma200Differences = pairs.map(
(pair) =>
Math.abs(
pair.eventDistanceMA200 -
pair.controlDistanceMA200,
),
);

return {
exclusionTradingDays,

pairs,

horizonStats: [
horizonStats(pairs, 20),
horizonStats(pairs, 60),
],

diagnostics: {
inputEvents:
events.length,

eligibleEvents:
eligibleEvents.length,

inputControls:
controls.length,

eligibleControls:
eligibleControls.length,

matchedEvents:
pairs.length,

unmatchedEvents:
events.length - pairs.length,

matchRate:
events.length > 0
? (
pairs.length /
events.length
) * 100
: null,

uniqueEventDates:
new Set(
pairs.map(
(pair) => pair.eventDate,
),
).size === pairs.length,

uniqueControlDates:
new Set(
pairs.map(
(pair) => pair.controlDate,
),
).size === pairs.length,

chronological:
pairs.every(
(pair, index) =>
index === 0 ||
pair.eventDate >=
pairs[index - 1].eventDate,
),

averageCalendarDistance:
mean(calendarDistances),

medianCalendarDistance:
median(calendarDistances),

averageMatchDistance:
mean(matchDistances),

maximumMatchDistance:
matchDistances.length > 0
? Math.max(...matchDistances)
: null,

averageAbsoluteReturnDifference:
mean(returnDifferences),

averageAbsoluteVixDifference:
mean(vixDifferences),

averageAbsoluteMA200Difference:
mean(ma200Differences),

controlsBeforeEvents:
pairs.filter(
(pair) =>
pair.controlMarketIndex <
pair.eventMarketIndex,
).length,

controlsAfterEvents:
pairs.filter(
(pair) =>
pair.controlMarketIndex >
pair.eventMarketIndex,
).length,

matchingUsesForwardOutcomes:
false,
},
};
}

/* =====================================================
BUILD ALL ROBUSTNESS SCENARIOS
===================================================== */

export function buildHistoricalRegimeDivergenceMatchRobustness(
controls: HistoricalDivergenceControlDataset,
marketFeatures: HistoricalRegimeFeatures[],
): HistoricalDivergenceMatchRobustnessDataset {
const featureMap = new Map(
marketFeatures.map(
(feature) => [
feature.date,
feature,
],
),
);

const events =
controls.observations.filter(
(observation) =>
observation.group ===
"DIVERGENCE_START",
);

const controlObservations =
controls.observations.filter(
(observation) =>
observation.group ===
"NASDAQ_UP_NO_DIVERGENCE",
);

const scenarios = EXCLUSION_WINDOWS.map(
(exclusion) =>
buildScenario(
exclusion,
events,
controlObservations,
featureMap,
),
);

return {
scenarios,

diagnostics: {
scenarioCount:
scenarios.length,

exclusionWindows:
[...EXCLUSION_WINDOWS],

maxCalendarDistance:
MAX_CALENDAR_DISTANCE,

sameInputEventsAcrossScenarios:
scenarios.every(
(scenario) =>
scenario.diagnostics.inputEvents ===
events.length,
),

sameInputControlsAcrossScenarios:
scenarios.every(
(scenario) =>
scenario.diagnostics.inputControls ===
controlObservations.length,
),

matchingUsesForwardOutcomes:
false,
},
};
}

