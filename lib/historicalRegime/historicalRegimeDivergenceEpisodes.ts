/* =====================================================
HISTORICAL REGIME DIVERGENCE EPISODES

Purpose:
- Identify contiguous historical divergence episodes
- Use existing descriptive divergence states
- Preserve exact leadership trading calendar
- Measure duration and observed characteristics
- Distinguish completed and ongoing episodes
- No synthetic data
- No forward filling
- No scoring
- No trading signals
- No forward outcomes

Research rule:
An episode starts when state20D becomes
NASDAQ_UP_BREADTH_DOWN.

It ends on the final consecutive day carrying
that state.

No gap tolerance is applied.

Important:
Completed episode duration is retrospective
information and must not be used as an entry-day
feature in later forward tests.
===================================================== */

import type {
HistoricalDivergenceFeatureDay,
HistoricalDivergenceDataset,
} from "./historicalRegimeDivergenceFeatures";

/* =====================================================
CONFIGURATION
===================================================== */

const TARGET_STATE =
"NASDAQ_UP_BREADTH_DOWN" as const;

/* =====================================================
TYPES
===================================================== */

export type HistoricalDivergenceEpisode = {
id: string;

startDate: string;
endDate: string;

startIndex: number;
endIndex: number;

durationTradingDays: number;

ongoingAtDatasetEnd: boolean;

start: {
nasdaqReturn20D: number | null;
breadth50Change20D: number | null;
breadth50: number | null;
breadth200: number | null;
nasdaqVsEqualWeight20D: number | null;
russellVsNasdaq20D: number | null;
semiconductorsVsNasdaq20D: number | null;
normalizedADChange20D: number | null;
};

end: {
nasdaqReturn20D: number | null;
breadth50Change20D: number | null;
breadth50: number | null;
breadth200: number | null;
nasdaqVsEqualWeight20D: number | null;
russellVsNasdaq20D: number | null;
semiconductorsVsNasdaq20D: number | null;
normalizedADChange20D: number | null;
};

observations: {
validLeadershipDays: number;
validBreadthDays: number;

qqewOutperformanceDays: number;
qqewUnderperformanceDays: number;

normalizedADFallingDays: number;
normalizedADRisingDays: number;

russellUnderperformanceDays: number;
semiconductorUnderperformanceDays: number;
};

metrics: {
averageNasdaqReturn20D: number | null;
averageBreadth50Change20D: number | null;

averageNasdaqVsEqualWeight20D: number | null;
maxNasdaqVsEqualWeight20D: number | null;
minNasdaqVsEqualWeight20D: number | null;

averageRussellVsNasdaq20D: number | null;
averageSemiconductorsVsNasdaq20D: number | null;

averageNormalizedADChange20D: number | null;

averageBreadthCoverageOfUniverse: number | null;
minBreadthCoverageOfUniverse: number | null;
};
};

export type HistoricalDivergenceEpisodeDataset = {
episodes: HistoricalDivergenceEpisode[];

count: number;

firstEpisodeDate: string | null;
lastEpisodeDate: string | null;

diagnostics: {
sourceDays: number;

targetStateDays: number;
episodeDays: number;

completedEpisodes: number;
ongoingEpisodes: number;

shortestEpisodeTradingDays: number | null;
longestEpisodeTradingDays: number | null;
averageEpisodeTradingDays: number | null;
medianEpisodeTradingDays: number | null;

episodesAtLeast5Days: number;
episodesAtLeast10Days: number;
episodesAtLeast20Days: number;
episodesAtLeast40Days: number;

chronological: boolean;
nonOverlapping: boolean;
durationArithmeticValid: boolean;
targetDayAccountingValid: boolean;
};
};

/* =====================================================
NUMERIC HELPERS
===================================================== */

function isFiniteNumber(
value: number | null | undefined,
): value is number {
return (
typeof value === "number" &&
Number.isFinite(value)
);
}

function validNumbers(
values: Array<number | null | undefined>,
): number[] {
return values.filter(isFiniteNumber);
}

function average(
values: Array<number | null | undefined>,
): number | null {
const valid = validNumbers(values);

if (valid.length === 0) {
return null;
}

const sum = valid.reduce(
(total, value) => total + value,
0,
);

return sum / valid.length;
}

function minimum(
values: Array<number | null | undefined>,
): number | null {
const valid = validNumbers(values);

return valid.length > 0
? Math.min(...valid)
: null;
}

function maximum(
values: Array<number | null | undefined>,
): number | null {
const valid = validNumbers(values);

return valid.length > 0
? Math.max(...valid)
: null;
}

function median(
values: number[],
): number | null {
if (values.length === 0) {
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

function countWhere(
days: HistoricalDivergenceFeatureDay[],
selector: (
day: HistoricalDivergenceFeatureDay,
) => number | null,
predicate: (value: number) => boolean,
): number {
return days.filter((day) => {
const value = selector(day);

return (
isFiniteNumber(value) &&
predicate(value)
);
}).length;
}

/* =====================================================
EPISODE SNAPSHOT

These values describe the selected observation.
They are not reconstructed from future prices.
===================================================== */

function snapshot(
day: HistoricalDivergenceFeatureDay,
): HistoricalDivergenceEpisode["start"] {
return {
nasdaqReturn20D:
day.nasdaqReturn20D,

breadth50Change20D:
day.breadth50Change20D,

breadth50:
day.rawBreadth50,

breadth200:
day.rawBreadth200,

nasdaqVsEqualWeight20D:
day.nasdaqVsEqualWeight20D,

russellVsNasdaq20D:
day.russellVsNasdaq20D,

semiconductorsVsNasdaq20D:
day.semiconductorsVsNasdaq20D,

normalizedADChange20D:
day.normalizedADChange20D,
};
}

/* =====================================================
BUILD SINGLE EPISODE
===================================================== */

function buildEpisode(
days: HistoricalDivergenceFeatureDay[],
startIndex: number,
endIndex: number,
datasetLastIndex: number,
sequence: number,
): HistoricalDivergenceEpisode {
const episodeDays = days.slice(
startIndex,
endIndex + 1,
);

const first = days[startIndex];
const last = days[endIndex];

const durationTradingDays =
endIndex - startIndex + 1;

return {
id: `DIVERGENCE_${String(sequence).padStart(4, "0")}_${first.date}`,

startDate: first.date,
endDate: last.date,

startIndex,
endIndex,

durationTradingDays,

ongoingAtDatasetEnd:
endIndex === datasetLastIndex,

start: snapshot(first),
end: snapshot(last),

observations: {
validLeadershipDays:
episodeDays.filter(
(day) =>
isFiniteNumber(
day.nasdaqVsEqualWeight20D,
),
).length,

validBreadthDays:
episodeDays.filter(
(day) =>
isFiniteNumber(
day.rawBreadth50,
),
).length,

qqewOutperformanceDays:
countWhere(
episodeDays,
(day) =>
day.nasdaqVsEqualWeight20D,
(value) => value > 0,
),

qqewUnderperformanceDays:
countWhere(
episodeDays,
(day) =>
day.nasdaqVsEqualWeight20D,
(value) => value < 0,
),

normalizedADFallingDays:
countWhere(
episodeDays,
(day) =>
day.normalizedADChange20D,
(value) => value < 0,
),

normalizedADRisingDays:
countWhere(
episodeDays,
(day) =>
day.normalizedADChange20D,
(value) => value > 0,
),

russellUnderperformanceDays:
countWhere(
episodeDays,
(day) =>
day.russellVsNasdaq20D,
(value) => value < 0,
),

semiconductorUnderperformanceDays:
countWhere(
episodeDays,
(day) =>
day.semiconductorsVsNasdaq20D,
(value) => value < 0,
),
},

metrics: {
averageNasdaqReturn20D:
average(
episodeDays.map(
(day) => day.nasdaqReturn20D,
),
),

averageBreadth50Change20D:
average(
episodeDays.map(
(day) => day.breadth50Change20D,
),
),

averageNasdaqVsEqualWeight20D:
average(
episodeDays.map(
(day) =>
day.nasdaqVsEqualWeight20D,
),
),

maxNasdaqVsEqualWeight20D:
maximum(
episodeDays.map(
(day) =>
day.nasdaqVsEqualWeight20D,
),
),

minNasdaqVsEqualWeight20D:
minimum(
episodeDays.map(
(day) =>
day.nasdaqVsEqualWeight20D,
),
),

averageRussellVsNasdaq20D:
average(
episodeDays.map(
(day) =>
day.russellVsNasdaq20D,
),
),

averageSemiconductorsVsNasdaq20D:
average(
episodeDays.map(
(day) =>
day.semiconductorsVsNasdaq20D,
),
),

averageNormalizedADChange20D:
average(
episodeDays.map(
(day) =>
day.normalizedADChange20D,
),
),

averageBreadthCoverageOfUniverse:
average(
episodeDays.map(
(day) =>
day.breadthCoverageOfUniverse,
),
),

minBreadthCoverageOfUniverse:
minimum(
episodeDays.map(
(day) =>
day.breadthCoverageOfUniverse,
),
),
},
};
}

/* =====================================================
BUILD EPISODE DATASET
===================================================== */

export function buildHistoricalRegimeDivergenceEpisodes(
divergence: HistoricalDivergenceDataset,
): HistoricalDivergenceEpisodeDataset {
const days = divergence.days;

const episodes: HistoricalDivergenceEpisode[] = [];

let activeStartIndex: number | null = null;

for (
let index = 0;
index < days.length;
index++
) {
const isTarget =
days[index].state20D === TARGET_STATE;

if (isTarget) {
if (activeStartIndex === null) {
activeStartIndex = index;
}

continue;
}

if (activeStartIndex !== null) {
episodes.push(
buildEpisode(
days,
activeStartIndex,
index - 1,
days.length - 1,
episodes.length + 1,
),
);

activeStartIndex = null;
}
}

/*
* An active episode at the end of the dataset
* is right-censored: its eventual duration
* is not yet known.
*/

if (activeStartIndex !== null) {
episodes.push(
buildEpisode(
days,
activeStartIndex,
days.length - 1,
days.length - 1,
episodes.length + 1,
),
);
}

const durations = episodes.map(
(episode) =>
episode.durationTradingDays,
);

const targetStateDays = days.filter(
(day) =>
day.state20D === TARGET_STATE,
).length;

const episodeDays = durations.reduce(
(total, duration) =>
total + duration,
0,
);

const nonOverlapping =
episodes.every(
(episode, index) =>
index === 0 ||
episode.startIndex >
episodes[index - 1].endIndex,
);

const durationArithmeticValid =
episodes.every(
(episode) =>
episode.durationTradingDays ===
episode.endIndex -
episode.startIndex +
1 &&
episode.startDate ===
days[episode.startIndex]?.date &&
episode.endDate ===
days[episode.endIndex]?.date,
);

const chronological =
episodes.every(
(episode, index) =>
index === 0 ||
episode.startDate >
episodes[index - 1].startDate,
);

return {
episodes,

count: episodes.length,

firstEpisodeDate:
episodes[0]?.startDate ?? null,

lastEpisodeDate:
episodes[episodes.length - 1]
?.endDate ?? null,

diagnostics: {
sourceDays: days.length,

targetStateDays,
episodeDays,

completedEpisodes:
episodes.filter(
(episode) =>
!episode.ongoingAtDatasetEnd,
).length,

ongoingEpisodes:
episodes.filter(
(episode) =>
episode.ongoingAtDatasetEnd,
).length,

shortestEpisodeTradingDays:
minimum(durations),

longestEpisodeTradingDays:
maximum(durations),

averageEpisodeTradingDays:
average(durations),

medianEpisodeTradingDays:
median(durations),

episodesAtLeast5Days:
durations.filter(
(duration) => duration >= 5,
).length,

episodesAtLeast10Days:
durations.filter(
(duration) => duration >= 10,
).length,

episodesAtLeast20Days:
durations.filter(
(duration) => duration >= 20,
).length,

episodesAtLeast40Days:
durations.filter(
(duration) => duration >= 40,
).length,

chronological,
nonOverlapping,
durationArithmeticValid,

targetDayAccountingValid:
targetStateDays === episodeDays,
},
};
}

