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

import {
buildHistoricalRegimeOutcomes,
} from "@/lib/historicalRegime/historicalRegimeOutcomes";

import {
buildHistoricalRegimeDivergenceForward,
} from "@/lib/historicalRegime/historicalRegimeDivergenceForward";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
HISTORICAL DIVERGENCE FORWARD TEST

Purpose:
- Validate episode-start forward observations
- Compare predefined entry-condition groups
- Check exact historical date matching
- Validate future-horizon completeness
- Verify forward returns independently
- Inspect recent historical examples

No scoring.
No trading signals.
No optionsschein pricing.
No claims of predictive significance.
===================================================== */

function valid(
value: number | null | undefined,
): value is number {
return (
typeof value === "number" &&
Number.isFinite(value)
);
}

function round(
value: number | null | undefined,
decimals = 4,
): number | null {
if (!valid(value)) {
return null;
}

return Number(value.toFixed(decimals));
}

function approximatelyEqual(
actual: number | null,
expected: number | null,
tolerance = 1e-9,
): boolean {
if (actual === null || expected === null) {
return actual === expected;
}

return (
valid(actual) &&
valid(expected) &&
Math.abs(actual - expected) <= tolerance
);
}

function calculateForwardReturn(
prices: number[],
index: number,
horizon: number,
): number | null {
const futureIndex = index + horizon;

if (
index < 0 ||
futureIndex >= prices.length
) {
return null;
}

const current = prices[index];
const future = prices[futureIndex];

if (
!valid(current) ||
!valid(future) ||
current === 0
) {
return null;
}

return (future / current - 1) * 100;
}

function calculateExcursion(
prices: number[],
index: number,
horizon: number,
): {
mfe: number | null;
mae: number | null;
} {
const endIndex = index + horizon;

if (
index < 0 ||
endIndex >= prices.length
) {
return {
mfe: null,
mae: null,
};
}

const current = prices[index];

if (!valid(current) || current === 0) {
return {
mfe: null,
mae: null,
};
}

const futurePrices = prices.slice(
index + 1,
endIndex + 1,
);

if (
futurePrices.length !== horizon ||
futurePrices.some(
(price) => !valid(price),
)
) {
return {
mfe: null,
mae: null,
};
}

const highest = Math.max(
...futurePrices,
);

const lowest = Math.min(
...futurePrices,
);

return {
mfe:
(highest / current - 1) * 100,

mae:
(lowest / current - 1) * 100,
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

const episodes =
buildHistoricalRegimeDivergenceEpisodes(
divergence,
);

const outcomes =
buildHistoricalRegimeOutcomes(
market.days,
);

const forward =
buildHistoricalRegimeDivergenceForward(
episodes,
divergence.days,
outcomes,
);

/* ================================================
INDEPENDENT DATE / RETURN VALIDATION
================================================ */

const marketIndex = new Map(
market.days.map(
(day, index) => [day.date, index],
),
);

const marketPrices = market.days.map(
(day) => day.nasdaq,
);

const episodeStartDates = new Set(
episodes.episodes.map(
(episode) => episode.startDate,
),
);

const episodeStartMatching =
forward.observations.every(
(observation) =>
episodeStartDates.has(
observation.date,
),
);

const forwardArithmeticValid =
forward.observations.every(
(observation) => {
const index = marketIndex.get(
observation.date,
);

if (index === undefined) {
return false;
}

const expected5D =
calculateForwardReturn(
marketPrices,
index,
5,
);

const expected20D =
calculateForwardReturn(
marketPrices,
index,
20,
);

const expected60D =
calculateForwardReturn(
marketPrices,
index,
60,
);

const expected20Excursion =
calculateExcursion(
marketPrices,
index,
20,
);

const expected60Excursion =
calculateExcursion(
marketPrices,
index,
60,
);

return (
approximatelyEqual(
observation.outcomes.forward5D,
expected5D,
) &&
approximatelyEqual(
observation.outcomes.forward20D,
expected20D,
) &&
approximatelyEqual(
observation.outcomes.forward60D,
expected60D,
) &&
approximatelyEqual(
observation.outcomes.mfe20D,
expected20Excursion.mfe,
) &&
approximatelyEqual(
observation.outcomes.mae20D,
expected20Excursion.mae,
) &&
approximatelyEqual(
observation.outcomes.mfe60D,
expected60Excursion.mfe,
) &&
approximatelyEqual(
observation.outcomes.mae60D,
expected60Excursion.mae,
)
);
},
);

/* ================================================
ENTRY GROUP VALIDATION
================================================ */

const groupClassificationValid =
forward.observations.every(
(observation) => {
const groups =
observation.groups;

const adWeak =
valid(
observation.entry
.normalizedADChange20D,
) &&
observation.entry
.normalizedADChange20D < 0;

const leadershipStrong =
valid(
observation.entry
.nasdaqVsEqualWeight20D,
) &&
observation.entry
.nasdaqVsEqualWeight20D > 0;

const russellWeak =
valid(
observation.entry
.russellVsNasdaq20D,
) &&
observation.entry
.russellVsNasdaq20D < 0;

const expectedConfirmed =
adWeak &&
leadershipStrong &&
russellWeak;

return (
groups.includes(
"ALL_DIVERGENCES",
) &&
groups.includes(
"AD_WEAKNESS",
) === adWeak &&
groups.includes(
"CONFIRMED_FRAGILITY",
) === expectedConfirmed
);
},
);

/* ================================================
HORIZON COMPLETENESS
================================================ */

const horizonCompletenessValid =
forward.observations.every(
(observation) => {
const index = marketIndex.get(
observation.date,
);

if (index === undefined) {
return false;
}

return (
valid(
observation.outcomes.forward5D,
) ===
(index + 5 <
market.days.length) &&
valid(
observation.outcomes.forward20D,
) ===
(index + 20 <
market.days.length) &&
valid(
observation.outcomes.forward60D,
) ===
(index + 60 <
market.days.length)
);
},
);

/* ================================================
QUALITY CHECKS
================================================ */

const qualityChecks = {
marketAvailable:
market.count > 0,

leadershipAvailable:
leadershipAligned.count > 0,

breadthAvailable:
breadthData.count > 0,

episodesAvailable:
episodes.count > 0,

allEpisodesMatched:
forward.diagnostics
.unmatchedEpisodeStarts === 0 &&
forward.diagnostics
.matchedEpisodeStarts ===
episodes.count,

episodeStartMatching,

forwardArithmeticValid,

groupClassificationValid,

horizonCompletenessValid,

uniqueStartDates:
forward.diagnostics
.uniqueStartDates,

chronological:
forward.diagnostics
.chronological,

groupAccountingValid:
forward.diagnostics
.groupCounts
.allDivergences ===
forward.observations.length &&
forward.diagnostics
.groupCounts
.confirmedFragility <=
forward.diagnostics
.groupCounts.adWeakness &&
forward.diagnostics
.groupCounts
.adWeakness <=
forward.observations.length,
};

/* ================================================
EXAMPLES
================================================ */

const recentObservations =
forward.observations
.slice(-12)
.reverse()
.map((observation) => ({
date: observation.date,

episodeId:
observation.episodeId,

groups:
observation.groups,

entry: {
nasdaqReturn20D:
round(
observation.entry
.nasdaqReturn20D,
),

breadth50Change20D:
round(
observation.entry
.breadth50Change20D,
),

nasdaqVsEqualWeight20D:
round(
observation.entry
.nasdaqVsEqualWeight20D,
),

russellVsNasdaq20D:
round(
observation.entry
.russellVsNasdaq20D,
),

normalizedADChange20D:
round(
observation.entry
.normalizedADChange20D,
),
},

outcomes: {
forward5D:
round(
observation.outcomes
.forward5D,
),

forward20D:
round(
observation.outcomes
.forward20D,
),

forward60D:
round(
observation.outcomes
.forward60D,
),

mfe20D:
round(
observation.outcomes
.mfe20D,
),

mae20D:
round(
observation.outcomes
.mae20D,
),
},
}));

const status =
Object.values(
qualityChecks,
).every(Boolean)
? "PASS"
: "REVIEW";

return NextResponse.json({
status,

purpose:
"Historical divergence episode-start forward outcome validation",

period: {
firstDate:
divergence.firstDate,

lastDate:
divergence.lastDate,

marketDays:
market.count,

divergenceDays:
divergence.count,

episodes:
episodes.count,
},

diagnostics:
forward.diagnostics,

qualityChecks,

stats:
forward.stats.map(
(stat) => ({
...stat,

average5D:
round(stat.average5D),

median5D:
round(stat.median5D),

average20D:
round(stat.average20D),

median20D:
round(stat.median20D),

average60D:
round(stat.average60D),

median60D:
round(stat.median60D),

negativeRate20D:
round(
stat.negativeRate20D,
2,
),

negativeRate60D:
round(
stat.negativeRate60D,
2,
),

averageMFE20D:
round(stat.averageMFE20D),

averageMAE20D:
round(stat.averageMAE20D),

averageMFE60D:
round(stat.averageMFE60D),

averageMAE60D:
round(stat.averageMAE60D),
}),
),

recentObservations,

methodology: {
entry:
"First day of each contiguous Nasdaq-up / breadth-down episode.",

grouping:
"Entry-date A/D weakness, Nasdaq versus QQEW, Russell versus Nasdaq.",

horizons:
"Forward 5, 20 and 60 aligned market trading sessions.",

excursions:
"Future closing-price high/low relative to entry close.",

limitations:
"Overlapping future windows, nested groups, no matched controls, no optionsschein pricing.",
},
});
} catch (error) {
console.error(
"[HistoricalDivergenceForwardTest]",
error,
);

return NextResponse.json(
{
status: "ERROR",

error:
error instanceof Error
? error.message
: "Unknown divergence forward test error",
},
{ status: 500 },
);
}
}

