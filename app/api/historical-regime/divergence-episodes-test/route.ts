import { NextResponse } from "next/server";

import {
loadHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeProvider";

import {
alignHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeAlignment";

import {
loadHistoricalRegimeLeadershipData,
} from "@/lib/historicalRegime/historicalRegimeLeadershipProvider";

import {
alignHistoricalRegimeLeadershipData,
} from "@/lib/historicalRegime/historicalRegimeLeadershipAlignment";

import {
buildHistoricalRegimeLeadershipFeatures,
} from "@/lib/historicalRegime/historicalRegimeLeadershipFeatures";

import {
loadHistoricalRegimeBreadthData,
} from "@/lib/historicalRegime/historicalRegimeBreadthProvider";

import {
buildHistoricalRegimeDivergenceFeatures,
} from "@/lib/historicalRegime/historicalRegimeDivergenceFeatures";

import {
buildHistoricalRegimeDivergenceEpisodes,
} from "@/lib/historicalRegime/historicalRegimeDivergenceEpisodes";

import type {
HistoricalDivergenceEpisode,
} from "@/lib/historicalRegime/historicalRegimeDivergenceEpisodes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
HISTORICAL DIVERGENCE EPISODES TEST

Validates:
- Episode construction
- Exact accounting of divergence days
- Non-overlapping episodes
- Episode duration arithmetic
- Episode boundaries
- Ongoing/right-censored episode
- Historical duration distribution
- Historical episode examples

No forward outcomes.
No trading signals.
No predictive performance claims.
===================================================== */

const TARGET_STATE = "NASDAQ_UP_BREADTH_DOWN";

function round(
value: number | null | undefined,
decimals = 4,
): number | null {
if (
typeof value !== "number" ||
!Number.isFinite(value)
) {
return null;
}

return Number(value.toFixed(decimals));
}

function summarizeEpisode(
episode: HistoricalDivergenceEpisode,
) {
return {
id: episode.id,

startDate: episode.startDate,
endDate: episode.endDate,

durationTradingDays:
episode.durationTradingDays,

ongoingAtDatasetEnd:
episode.ongoingAtDatasetEnd,

start: {
nasdaqReturn20D:
round(episode.start.nasdaqReturn20D),

breadth50Change20D:
round(episode.start.breadth50Change20D),

breadth50:
round(episode.start.breadth50),

nasdaqVsEqualWeight20D:
round(
episode.start.nasdaqVsEqualWeight20D,
),

russellVsNasdaq20D:
round(episode.start.russellVsNasdaq20D),

normalizedADChange20D:
round(
episode.start.normalizedADChange20D,
),
},

end: {
nasdaqReturn20D:
round(episode.end.nasdaqReturn20D),

breadth50Change20D:
round(episode.end.breadth50Change20D),

breadth50:
round(episode.end.breadth50),

nasdaqVsEqualWeight20D:
round(
episode.end.nasdaqVsEqualWeight20D,
),

russellVsNasdaq20D:
round(episode.end.russellVsNasdaq20D),

normalizedADChange20D:
round(
episode.end.normalizedADChange20D,
),
},

observations: episode.observations,

metrics: {
averageNasdaqReturn20D:
round(
episode.metrics.averageNasdaqReturn20D,
),

averageBreadth50Change20D:
round(
episode.metrics.averageBreadth50Change20D,
),

averageNasdaqVsEqualWeight20D:
round(
episode.metrics.averageNasdaqVsEqualWeight20D,
),

maxNasdaqVsEqualWeight20D:
round(
episode.metrics.maxNasdaqVsEqualWeight20D,
),

averageRussellVsNasdaq20D:
round(
episode.metrics.averageRussellVsNasdaq20D,
),

averageNormalizedADChange20D:
round(
episode.metrics.averageNormalizedADChange20D,
),

averageBreadthCoverageOfUniverse:
round(
episode.metrics
.averageBreadthCoverageOfUniverse,
),
},
};
}

export async function GET() {
try {
const [
marketData,
leadershipData,
breadthData,
] = await Promise.all([
loadHistoricalRegimeMarketData(),
loadHistoricalRegimeLeadershipData(),
loadHistoricalRegimeBreadthData(),
]);

const market =
alignHistoricalRegimeMarketData(
marketData,
);

const leadershipAligned =
alignHistoricalRegimeLeadershipData(
market,
leadershipData,
);

const leadershipFeatures =
buildHistoricalRegimeLeadershipFeatures(
leadershipAligned.days,
);

const divergence =
buildHistoricalRegimeDivergenceFeatures(
leadershipFeatures,
breadthData.days,
);

const episodeDataset =
buildHistoricalRegimeDivergenceEpisodes(
divergence,
);

const episodes = episodeDataset.episodes;
const days = divergence.days;

/* ================================================
INDEPENDENT VALIDATION
================================================ */

const targetIndices = days
.map((day, index) =>
day.state20D === TARGET_STATE
? index
: -1,
)
.filter((index) => index >= 0);

const assignedIndices = episodes.flatMap(
(episode) =>
Array.from(
{
length:
episode.durationTradingDays,
},
(_, offset) =>
episode.startIndex + offset,
),
);

const uniqueAssignedIndices =
new Set(assignedIndices);

const exactTargetCoverage =
assignedIndices.length ===
targetIndices.length &&
uniqueAssignedIndices.size ===
targetIndices.length &&
targetIndices.every(
(index) =>
uniqueAssignedIndices.has(index),
);

const allEpisodeDaysAreTarget =
assignedIndices.every(
(index) =>
days[index]?.state20D ===
TARGET_STATE,
);

const boundaryChecks = episodes.every(
(episode) => {
const before =
episode.startIndex > 0
? days[episode.startIndex - 1]
: null;

const after =
episode.endIndex < days.length - 1
? days[episode.endIndex + 1]
: null;

return (
(
before === null ||
before.state20D !== TARGET_STATE
) &&
(
after === null ||
after.state20D !== TARGET_STATE
)
);
},
);

const ongoingEpisodes = episodes.filter(
(episode) =>
episode.ongoingAtDatasetEnd,
);

const ongoingValid =
ongoingEpisodes.length <= 1 &&
ongoingEpisodes.every(
(episode) =>
episode.endIndex ===
days.length - 1,
) &&
(
days.length === 0 ||
(
days[days.length - 1].state20D ===
TARGET_STATE
) ===
(ongoingEpisodes.length === 1)
);

const durations = episodes.map(
(episode) =>
episode.durationTradingDays,
);

const durationBuckets = {
oneDay:
durations.filter(
(duration) => duration === 1,
).length,

twoToFourDays:
durations.filter(
(duration) =>
duration >= 2 &&
duration <= 4,
).length,

fiveToNineDays:
durations.filter(
(duration) =>
duration >= 5 &&
duration <= 9,
).length,

tenToNineteenDays:
durations.filter(
(duration) =>
duration >= 10 &&
duration <= 19,
).length,

twentyToThirtyNineDays:
durations.filter(
(duration) =>
duration >= 20 &&
duration <= 39,
).length,

fortyPlusDays:
durations.filter(
(duration) =>
duration >= 40,
).length,
};

const durationBucketsValid =
Object.values(
durationBuckets,
).reduce(
(sum, count) => sum + count,
0,
) === episodes.length;

const longestEpisodes = [...episodes]
.sort(
(a, b) =>
b.durationTradingDays -
a.durationTradingDays ||
a.startDate.localeCompare(
b.startDate,
),
)
.slice(0, 10)
.map(summarizeEpisode);

const recentEpisodes = episodes
.slice(-10)
.reverse()
.map(summarizeEpisode);

const historicalYears = [
2015,
2018,
2020,
2022,
2024,
2025,
2026,
];

const yearlyEpisodes =
historicalYears.map((year) => {
const matching = episodes.filter(
(episode) =>
episode.startDate.startsWith(
String(year),
),
);

return {
year,

episodeStarts:
matching.length,

completed:
matching.filter(
(episode) =>
!episode.ongoingAtDatasetEnd,
).length,

ongoing:
matching.filter(
(episode) =>
episode.ongoingAtDatasetEnd,
).length,

totalEpisodeDays:
matching.reduce(
(sum, episode) =>
sum +
episode.durationTradingDays,
0,
),
};
});

const qualityChecks = {
sourceAvailable:
days.length > 0,

episodesFound:
episodes.length > 0,

exactTargetCoverage,

allEpisodeDaysAreTarget,

boundaryChecks,

ongoingValid,

durationBucketsValid,

chronological:
episodeDataset.diagnostics.chronological,

nonOverlapping:
episodeDataset.diagnostics.nonOverlapping,

durationArithmeticValid:
episodeDataset.diagnostics
.durationArithmeticValid,

targetDayAccountingValid:
episodeDataset.diagnostics
.targetDayAccountingValid,

diagnosticCountsMatch:
episodeDataset.diagnostics
.targetStateDays ===
targetIndices.length &&
episodeDataset.diagnostics
.episodeDays ===
assignedIndices.length &&
episodeDataset.diagnostics
.completedEpisodes +
episodeDataset.diagnostics
.ongoingEpisodes ===
episodes.length,
};

const status =
Object.values(qualityChecks).every(Boolean)
? "PASS"
: "REVIEW";

return NextResponse.json({
status,

purpose:
"Historical Nasdaq-up / breadth-down episode validation",

period: {
firstDate:
divergence.firstDate,

lastDate:
divergence.lastDate,

divergenceDays:
divergence.count,

targetStateDays:
targetIndices.length,
},

episodeDiagnostics:
episodeDataset.diagnostics,

durationBuckets,

qualityChecks,

ongoingEpisode:
ongoingEpisodes.length > 0
? summarizeEpisode(
ongoingEpisodes[0],
)
: null,

longestEpisodes,

recentEpisodes,

yearlyEpisodes,

methodology: {
targetState: TARGET_STATE,

episodeStart:
"First trading day entering the target state.",

episodeEnd:
"Last consecutive trading day in the target state.",

interruptionTolerance:
"Zero trading days.",

ongoing:
"Episode active on the final available observation; right-censored.",

duration:
"Number of consecutive leadership trading sessions in the target state.",

forwardLooking:
"No forward outcomes or future-derived entry features.",

limitations:
"Episodes describe rolling 20-day states, not necessarily complete institutional distribution regimes.",
},
});
} catch (error) {
console.error(
"[HistoricalDivergenceEpisodesTest]",
error,
);

return NextResponse.json(
{
status: "ERROR",

error:
error instanceof Error
? error.message
: "Unknown episode validation error",
},
{ status: 500 },
);
}
}

