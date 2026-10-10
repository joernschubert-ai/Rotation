import type {
HistoricalRegimeFeatures,
} from "./historicalRegimeFeatures";

import type {
HistoricalDivergenceControlDataset,
HistoricalControlObservation,
} from "./historicalRegimeDivergenceControls";

/* =====================================================
HISTORICAL DIVERGENCE MATCHED CONTROLS

Retrospective nearest-neighbor matching.

Match variables (entry-date only):
- Nasdaq trailing 20D return
- VIX level
- Nasdaq distance to MA200
- Calendar proximity

No forward outcomes used for matching.
No synthetic data.
No trading signals.
===================================================== */

export type HistoricalMatchedPair = {
eventDate: string;
controlDate: string;

eventMarketIndex: number;
controlMarketIndex: number;

calendarDistanceTradingDays: number;

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

export type HistoricalMatchedStatistics = {
count: number;
mean: number | null;
median: number | null;
negativeShare: number | null;
};

export type HistoricalMatchedComparison = {
horizon: 20 | 60;

pairsAvailable: number;

event: HistoricalMatchedStatistics;
control: HistoricalMatchedStatistics;
pairedDifference: HistoricalMatchedStatistics;
};

export type HistoricalDivergenceMatchedDataset = {
pairs: HistoricalMatchedPair[];

comparisons: HistoricalMatchedComparison[];

diagnostics: {
inputEvents: number;
inputControls: number;

eligibleEvents: number;
eligibleControls: number;

matchedEvents: number;
unmatchedEvents: number;

uniqueControlDates: boolean;
uniqueEventDates: boolean;

chronological: boolean;

maxCalendarDistance: number;

averageMatchDistance: number | null;
maximumMatchDistance: number | null;

matchingUsesForwardOutcomes: false;
};
};

type MatchCandidate = {
observation: HistoricalControlObservation;
features: HistoricalRegimeFeatures;
};

const MAX_CALENDAR_DISTANCE = 126;

const RETURN_SCALE = 5;
const VIX_SCALE = 10;
const MA200_SCALE = 10;

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

return sorted.length % 2 === 1
? sorted[middle]
: (
sorted[middle - 1] +
sorted[middle]
) / 2;
}

function statistics(
values: number[],
): HistoricalMatchedStatistics {
return {
count: values.length,
mean: mean(values),
median: median(values),

negativeShare:
values.length > 0
? values.filter(
(value) => value < 0,
).length / values.length
: null,
};
}

function matchEligible(
features: HistoricalRegimeFeatures,
): boolean {
return (
valid(features.nasdaqReturn20D) &&
valid(features.vix) &&
valid(features.nasdaqDistanceMA200)
);
}

function matchDistance(
event: MatchCandidate,
control: MatchCandidate,
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

function pairDifference(
eventValue: number | null,
controlValue: number | null,
): number | null {
if (
!valid(eventValue) ||
!valid(controlValue)
) {
return null;
}

return eventValue - controlValue;
}

function buildComparison(
pairs: HistoricalMatchedPair[],
horizon: 20 | 60,
): HistoricalMatchedComparison {
const eligible = pairs.filter(
(pair) =>
horizon === 20
? valid(pair.difference20D)
: valid(pair.difference60D),
);

const eventValues = eligible.map(
(pair) =>
horizon === 20
? pair.eventForward20D as number
: pair.eventForward60D as number,
);

const controlValues = eligible.map(
(pair) =>
horizon === 20
? pair.controlForward20D as number
: pair.controlForward60D as number,
);

const differences = eligible.map(
(pair) =>
horizon === 20
? pair.difference20D as number
: pair.difference60D as number,
);

return {
horizon,
pairsAvailable: eligible.length,

event: statistics(eventValues),
control: statistics(controlValues),

pairedDifference:
statistics(differences),
};
}

/* =====================================================
MATCHING

One-to-one greedy nearest-neighbor matching.

- Events processed chronologically.
- A control can be used once.
- Candidates restricted to ±126 trading days.
- Candidate must have the same Nasdaq 20D
trend bucket as the event.
- Matching minimizes standardized distance
across return, VIX and MA200 distance.
- Outcomes are never used to select matches.

No replacement.
===================================================== */

export function buildHistoricalRegimeDivergenceMatchedControls(
controls: HistoricalDivergenceControlDataset,
marketFeatures: HistoricalRegimeFeatures[],
): HistoricalDivergenceMatchedDataset {
const featureMap = new Map(
marketFeatures.map(
(features) => [
features.date,
features,
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

function candidates(
observations: HistoricalControlObservation[],
): MatchCandidate[] {
return observations.flatMap(
(observation) => {
const features = featureMap.get(
observation.date,
);

if (
!features ||
!matchEligible(features)
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

const eligibleEvents =
candidates(events).sort(
(a, b) =>
a.observation.marketIndex -
b.observation.marketIndex,
);

const eligibleControls =
candidates(controlObservations);

const usedControlDates = new Set<string>();

const pairs: HistoricalMatchedPair[] = [];

for (const event of eligibleEvents) {
let best: MatchCandidate | null = null;

let bestDistance =
Number.POSITIVE_INFINITY;

let bestCalendarDistance =
Number.POSITIVE_INFINITY;

for (const control of eligibleControls) {
if (
usedControlDates.has(
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
MAX_CALENDAR_DISTANCE
) {
continue;
}

const distance = matchDistance(
event,
control,
);

if (
distance < bestDistance ||
(
distance === bestDistance &&
calendarDistance <
bestCalendarDistance
)
) {
best = control;

bestDistance = distance;

bestCalendarDistance =
calendarDistance;
}
}

if (!best) {
continue;
}

usedControlDates.add(
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

const distances = pairs.map(
(pair) => pair.matchDistance,
);

return {
pairs,

comparisons: [
buildComparison(pairs, 20),
buildComparison(pairs, 60),
],

diagnostics: {
inputEvents:
events.length,

inputControls:
controlObservations.length,

eligibleEvents:
eligibleEvents.length,

eligibleControls:
eligibleControls.length,

matchedEvents:
pairs.length,

unmatchedEvents:
events.length - pairs.length,

uniqueControlDates:
new Set(
pairs.map(
(pair) => pair.controlDate,
),
).size === pairs.length,

uniqueEventDates:
new Set(
pairs.map(
(pair) => pair.eventDate,
),
).size === pairs.length,

chronological:
pairs.every(
(pair, index) =>
index === 0 ||
pair.eventDate >=
pairs[index - 1].eventDate,
),

maxCalendarDistance:
MAX_CALENDAR_DISTANCE,

averageMatchDistance:
mean(distances),

maximumMatchDistance:
distances.length
? Math.max(...distances)
: null,

matchingUsesForwardOutcomes:
false,
},
};
}

