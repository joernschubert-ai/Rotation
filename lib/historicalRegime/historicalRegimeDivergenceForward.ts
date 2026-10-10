import type {
HistoricalForwardOutcome,
} from "./historicalRegimeOutcomes";

import type {
HistoricalDivergenceEpisodeDataset,
} from "./historicalRegimeDivergenceEpisodes";

import type {
HistoricalDivergenceFeatureDay,
} from "./historicalRegimeDivergenceFeatures";

/* =====================================================
HISTORICAL DIVERGENCE FORWARD RESEARCH

Purpose:
- Evaluate forward Nasdaq outcomes at episode START
- Use existing historical forward-return calculations
- Avoid counting every episode day as a new entry
- Classify entry conditions using start-day data only
- Keep incomplete forward horizons separate
- No scoring
- No optionsschein pricing
- No trading signals

Important:
Episode start is known at day T.
Episode final duration is NOT used as a predictor.
===================================================== */

export type HistoricalDivergenceForwardGroup =
| "ALL_DIVERGENCES"
| "AD_WEAKNESS"
| "CONFIRMED_FRAGILITY";

export type HistoricalDivergenceForwardObservation = {
episodeId: string;
date: string;

groups: HistoricalDivergenceForwardGroup[];

entry: {
nasdaqClose: number;

nasdaqReturn20D: number | null;
breadth50Change20D: number | null;
rawBreadth50: number | null;

nasdaqVsEqualWeight20D: number | null;
russellVsNasdaq20D: number | null;
normalizedADChange20D: number | null;

breadthCoverageOfUniverse: number | null;
};

outcomes: {
forward5D: number | null;
forward20D: number | null;
forward60D: number | null;

mfe20D: number | null;
mae20D: number | null;

mfe60D: number | null;
mae60D: number | null;
};
};

export type HistoricalDivergenceForwardStats = {
group: HistoricalDivergenceForwardGroup;

observations: number;

available5D: number;
available20D: number;
available60D: number;

average5D: number | null;
median5D: number | null;

average20D: number | null;
median20D: number | null;

average60D: number | null;
median60D: number | null;

positive20D: number;
negative20D: number;

positive60D: number;
negative60D: number;

negativeRate20D: number | null;
negativeRate60D: number | null;

averageMFE20D: number | null;
averageMAE20D: number | null;

averageMFE60D: number | null;
averageMAE60D: number | null;
};

export type HistoricalDivergenceForwardDataset = {
observations: HistoricalDivergenceForwardObservation[];

stats: HistoricalDivergenceForwardStats[];

diagnostics: {
totalEpisodes: number;
matchedEpisodeStarts: number;
unmatchedEpisodeStarts: number;

observationsWith20D: number;
observationsWith60D: number;

uniqueStartDates: boolean;
chronological: boolean;

groupCounts: {
allDivergences: number;
adWeakness: number;
confirmedFragility: number;
};
};
};

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

function values(
observations: HistoricalDivergenceForwardObservation[],
selector: (
observation: HistoricalDivergenceForwardObservation,
) => number | null,
): number[] {
return observations
.map(selector)
.filter(valid);
}

function average(numbers: number[]): number | null {
if (!numbers.length) {
return null;
}

return (
numbers.reduce(
(sum, value) => sum + value,
0,
) / numbers.length
);
}

function median(numbers: number[]): number | null {
if (!numbers.length) {
return null;
}

const sorted = [...numbers].sort(
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
numbers: number[],
): number | null {
if (!numbers.length) {
return null;
}

return (
numbers.filter(
(value) => value < 0,
).length / numbers.length
) * 100;
}

/* =====================================================
ENTRY CLASSIFICATION

All classifications use ONLY features available
on the first day of each episode.

No final episode duration or future outcome
is used in classification.
===================================================== */

function classifyGroups(
day: HistoricalDivergenceFeatureDay,
): HistoricalDivergenceForwardGroup[] {
const groups: HistoricalDivergenceForwardGroup[] = [
"ALL_DIVERGENCES",
];

const adWeak =
valid(day.normalizedADChange20D) &&
day.normalizedADChange20D < 0;

if (adWeak) {
groups.push("AD_WEAKNESS");
}

const leadershipConcentrated =
valid(day.nasdaqVsEqualWeight20D) &&
day.nasdaqVsEqualWeight20D > 0;

const russellWeak =
valid(day.russellVsNasdaq20D) &&
day.russellVsNasdaq20D < 0;

if (
adWeak &&
leadershipConcentrated &&
russellWeak
) {
groups.push("CONFIRMED_FRAGILITY");
}

return groups;
}

/* =====================================================
GROUP STATISTICS
===================================================== */

function buildGroupStats(
group: HistoricalDivergenceForwardGroup,
observations: HistoricalDivergenceForwardObservation[],
): HistoricalDivergenceForwardStats {
const matching = observations.filter(
(observation) =>
observation.groups.includes(group),
);

const forward5D = values(
matching,
(observation) =>
observation.outcomes.forward5D,
);

const forward20D = values(
matching,
(observation) =>
observation.outcomes.forward20D,
);

const forward60D = values(
matching,
(observation) =>
observation.outcomes.forward60D,
);

return {
group,

observations: matching.length,

available5D: forward5D.length,
available20D: forward20D.length,
available60D: forward60D.length,

average5D: average(forward5D),
median5D: median(forward5D),

average20D: average(forward20D),
median20D: median(forward20D),

average60D: average(forward60D),
median60D: median(forward60D),

positive20D:
forward20D.filter(
(value) => value > 0,
).length,

negative20D:
forward20D.filter(
(value) => value < 0,
).length,

positive60D:
forward60D.filter(
(value) => value > 0,
).length,

negative60D:
forward60D.filter(
(value) => value < 0,
).length,

negativeRate20D:
negativeRate(forward20D),

negativeRate60D:
negativeRate(forward60D),

averageMFE20D:
average(
values(
matching,
(observation) =>
observation.outcomes.mfe20D,
),
),

averageMAE20D:
average(
values(
matching,
(observation) =>
observation.outcomes.mae20D,
),
),

averageMFE60D:
average(
values(
matching,
(observation) =>
observation.outcomes.mfe60D,
),
),

averageMAE60D:
average(
values(
matching,
(observation) =>
observation.outcomes.mae60D,
),
),
};
}

/* =====================================================
BUILD FORWARD DATASET
===================================================== */

export function buildHistoricalRegimeDivergenceForward(
episodes: HistoricalDivergenceEpisodeDataset,
divergenceDays: HistoricalDivergenceFeatureDay[],
outcomes: HistoricalForwardOutcome[],
): HistoricalDivergenceForwardDataset {
const divergenceMap = new Map(
divergenceDays.map(
(day) => [day.date, day],
),
);

const outcomeMap = new Map(
outcomes.map(
(outcome) => [outcome.date, outcome],
),
);

const observations: HistoricalDivergenceForwardObservation[] = [];

let unmatchedEpisodeStarts = 0;

for (const episode of episodes.episodes) {
const day = divergenceMap.get(
episode.startDate,
);

const outcome = outcomeMap.get(
episode.startDate,
);

if (!day || !outcome) {
unmatchedEpisodeStarts++;
continue;
}

observations.push({
episodeId: episode.id,
date: episode.startDate,

groups: classifyGroups(day),

entry: {
nasdaqClose:
outcome.nasdaqClose,

nasdaqReturn20D:
day.nasdaqReturn20D,

breadth50Change20D:
day.breadth50Change20D,

rawBreadth50:
day.rawBreadth50,

nasdaqVsEqualWeight20D:
day.nasdaqVsEqualWeight20D,

russellVsNasdaq20D:
day.russellVsNasdaq20D,

normalizedADChange20D:
day.normalizedADChange20D,

breadthCoverageOfUniverse:
day.breadthCoverageOfUniverse,
},

outcomes: {
forward5D:
outcome.forward5D,

forward20D:
outcome.forward20D,

forward60D:
outcome.forward60D,

mfe20D:
outcome.mfe20D,

mae20D:
outcome.mae20D,

mfe60D:
outcome.mfe60D,

mae60D:
outcome.mae60D,
},
});
}

observations.sort(
(a, b) =>
a.date.localeCompare(b.date),
);

const groups: HistoricalDivergenceForwardGroup[] = [
"ALL_DIVERGENCES",
"AD_WEAKNESS",
"CONFIRMED_FRAGILITY",
];

const stats = groups.map(
(group) =>
buildGroupStats(
group,
observations,
),
);

return {
observations,
stats,

diagnostics: {
totalEpisodes:
episodes.count,

matchedEpisodeStarts:
observations.length,

unmatchedEpisodeStarts,

observationsWith20D:
observations.filter(
(observation) =>
valid(
observation.outcomes.forward20D,
),
).length,

observationsWith60D:
observations.filter(
(observation) =>
valid(
observation.outcomes.forward60D,
),
).length,

uniqueStartDates:
new Set(
observations.map(
(observation) =>
observation.date,
),
).size === observations.length,

chronological:
observations.every(
(observation, index) =>
index === 0 ||
observation.date >
observations[index - 1].date,
),

groupCounts: {
allDivergences:
observations.length,

adWeakness:
observations.filter(
(observation) =>
observation.groups.includes(
"AD_WEAKNESS",
),
).length,

confirmedFragility:
observations.filter(
(observation) =>
observation.groups.includes(
"CONFIRMED_FRAGILITY",
),
).length,
},
},
};
}

