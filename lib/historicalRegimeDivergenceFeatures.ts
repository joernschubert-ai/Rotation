import type {
HistoricalLeadershipFeatureDay,
} from "./historicalRegimeLeadershipFeatures";

import type {
HistoricalBreadthDay,
} from "./historicalRegimeBreadthProvider";

/* =====================================================
HISTORICAL REGIME DIVERGENCE FEATURES

Purpose:
- Combine historical leadership and breadth
- Join strictly by exact trading date
- Calculate backward-looking divergence features
- Preserve missing observations
- No synthetic values
- No forward filling
- No market phase reconstruction
- No scores
- No trading signals
- No forward outcomes

Important:
Breadth describes the fixed research universe,
not official Nasdaq or exchange breadth.
===================================================== */

/* =====================================================
TYPES
===================================================== */

export type HistoricalDivergenceState =
| "NASDAQ_UP_BREADTH_DOWN"
| "NASDAQ_UP_BREADTH_UP"
| "NASDAQ_DOWN_BREADTH_DOWN"
| "NASDAQ_DOWN_BREADTH_UP"
| "MIXED_OR_FLAT"
| "INSUFFICIENT_DATA";

export type HistoricalDivergenceFeatureDay = {
date: string;

nasdaqReturn20D: number | null;
nasdaqReturn60D: number | null;

qqewReturn20D: number | null;
qqewReturn60D: number | null;

nasdaqVsEqualWeight20D: number | null;
nasdaqVsEqualWeight60D: number | null;

russellVsNasdaq20D: number | null;
russellVsNasdaq60D: number | null;

semiconductorsVsNasdaq20D: number | null;
semiconductorsVsNasdaq60D: number | null;

rawBreadth20: number | null;
rawBreadth50: number | null;
rawBreadth200: number | null;

breadth50Change20D: number | null;
breadth50Change60D: number | null;

breadth200Change20D: number | null;
breadth200Change60D: number | null;

normalizedADLine: number | null;
normalizedADChange20D: number | null;
normalizedADChange60D: number | null;

advanceDeclineRatio: number | null;
highLowNet252D: number | null;

breadthCoverageOfUniverse: number | null;

state20D: HistoricalDivergenceState;
state60D: HistoricalDivergenceState;

nasdaqOutperformsQQEW20D: boolean | null;
nasdaqOutperformsQQEW60D: boolean | null;

breadth50Falling20D: boolean | null;
breadth50Falling60D: boolean | null;

normalizedADFalling20D: boolean | null;
normalizedADFalling60D: boolean | null;
};

export type HistoricalDivergenceDataset = {
days: HistoricalDivergenceFeatureDay[];

count: number;
firstDate: string | null;
lastDate: string | null;

diagnostics: {
leadershipDays: number;
breadthDays: number;
joinedDays: number;
missingBreadthDays: number;

valid20DStates: number;
valid60DStates: number;

nasdaqUpBreadthDown20D: number;
nasdaqUpBreadthDown60D: number;

chronological: boolean;
uniqueDates: boolean;
};
};

/* =====================================================
HELPERS
===================================================== */

function isFiniteNumber(
value: number | null | undefined,
): value is number {
return (
typeof value === "number" &&
Number.isFinite(value)
);
}

function difference(
current: number | null | undefined,
previous: number | null | undefined,
): number | null {
if (
!isFiniteNumber(current) ||
!isFiniteNumber(previous)
) {
return null;
}

return current - previous;
}

function positiveOrNull(
value: number | null,
): boolean | null {
return value === null ? null : value > 0;
}

function negativeOrNull(
value: number | null,
): boolean | null {
return value === null ? null : value < 0;
}

function classifyState(
nasdaqReturn: number | null,
breadthChange: number | null,
): HistoricalDivergenceState {
if (
nasdaqReturn === null ||
breadthChange === null
) {
return "INSUFFICIENT_DATA";
}

if (
nasdaqReturn > 0 &&
breadthChange < 0
) {
return "NASDAQ_UP_BREADTH_DOWN";
}

if (
nasdaqReturn > 0 &&
breadthChange > 0
) {
return "NASDAQ_UP_BREADTH_UP";
}

if (
nasdaqReturn < 0 &&
breadthChange < 0
) {
return "NASDAQ_DOWN_BREADTH_DOWN";
}

if (
nasdaqReturn < 0 &&
breadthChange > 0
) {
return "NASDAQ_DOWN_BREADTH_UP";
}

return "MIXED_OR_FLAT";
}

function isChronological(
days: HistoricalDivergenceFeatureDay[],
): boolean {
for (let index = 1; index < days.length; index++) {
if (
days[index].date <=
days[index - 1].date
) {
return false;
}
}

return true;
}

/* =====================================================
BUILD DIVERGENCE FEATURES
===================================================== */

export function buildHistoricalRegimeDivergenceFeatures(
leadershipDays: HistoricalLeadershipFeatureDay[],
breadthDays: HistoricalBreadthDay[],
): HistoricalDivergenceDataset {
const breadthMap = new Map(
breadthDays.map(
(day) => [day.date, day],
),
);

const leadershipMap = new Map(
leadershipDays.map(
(day) => [day.date, day],
),
);

const dates = Array.from(
leadershipMap.keys(),
).sort(
(a, b) => a.localeCompare(b),
);

const days: HistoricalDivergenceFeatureDay[] = [];

let missingBreadthDays = 0;

/*
* Leadership defines the research calendar.
*
* Backward-looking breadth comparisons use
* the breadth observation on the exact
* leadership trading date 20/60 sessions ago.
*
* Missing dates are never filled or replaced
* by the nearest available breadth observation.
*/

for (
let index = 0;
index < dates.length;
index++
) {
const date = dates[index];

const leadership =
leadershipMap.get(date);

if (!leadership) {
continue;
}

const breadth =
breadthMap.get(date);

if (!breadth) {
missingBreadthDays++;
}

const previous20Date =
index >= 20
? dates[index - 20]
: null;

const previous60Date =
index >= 60
? dates[index - 60]
: null;

const previous20 =
previous20Date
? breadthMap.get(previous20Date)
: undefined;

const previous60 =
previous60Date
? breadthMap.get(previous60Date)
: undefined;

const breadth50Change20D = difference(
breadth?.rawBreadth50,
previous20?.rawBreadth50,
);

const breadth50Change60D = difference(
breadth?.rawBreadth50,
previous60?.rawBreadth50,
);

const breadth200Change20D = difference(
breadth?.rawBreadth200,
previous20?.rawBreadth200,
);

const breadth200Change60D = difference(
breadth?.rawBreadth200,
previous60?.rawBreadth200,
);

const normalizedADChange20D = difference(
breadth?.normalizedADLine,
previous20?.normalizedADLine,
);

const normalizedADChange60D = difference(
breadth?.normalizedADLine,
previous60?.normalizedADLine,
);

const state20D = classifyState(
leadership.nasdaqReturn20D,
breadth50Change20D,
);

const state60D = classifyState(
leadership.nasdaqReturn60D,
breadth50Change60D,
);

days.push({
date,

nasdaqReturn20D:
leadership.nasdaqReturn20D,

nasdaqReturn60D:
leadership.nasdaqReturn60D,

qqewReturn20D:
leadership.qqewReturn20D,

qqewReturn60D:
leadership.qqewReturn60D,

nasdaqVsEqualWeight20D:
leadership.nasdaqVsEqualWeight20D,

nasdaqVsEqualWeight60D:
leadership.nasdaqVsEqualWeight60D,

russellVsNasdaq20D:
leadership.russellVsNasdaq20D,

russellVsNasdaq60D:
leadership.russellVsNasdaq60D,

semiconductorsVsNasdaq20D:
leadership.semiconductorsVsNasdaq20D,

semiconductorsVsNasdaq60D:
leadership.semiconductorsVsNasdaq60D,

rawBreadth20:
breadth?.rawBreadth20 ?? null,

rawBreadth50:
breadth?.rawBreadth50 ?? null,

rawBreadth200:
breadth?.rawBreadth200 ?? null,

breadth50Change20D,
breadth50Change60D,

breadth200Change20D,
breadth200Change60D,

normalizedADLine:
breadth?.normalizedADLine ?? null,

normalizedADChange20D,
normalizedADChange60D,

advanceDeclineRatio:
breadth?.advanceDeclineRatio ?? null,

highLowNet252D:
breadth?.highLowNet252D ?? null,

breadthCoverageOfUniverse:
breadth?.breadthCoverageOfUniverse ?? null,

state20D,
state60D,

nasdaqOutperformsQQEW20D:
positiveOrNull(
leadership.nasdaqVsEqualWeight20D,
),

nasdaqOutperformsQQEW60D:
positiveOrNull(
leadership.nasdaqVsEqualWeight60D,
),

breadth50Falling20D:
negativeOrNull(
breadth50Change20D,
),

breadth50Falling60D:
negativeOrNull(
breadth50Change60D,
),

normalizedADFalling20D:
negativeOrNull(
normalizedADChange20D,
),

normalizedADFalling60D:
negativeOrNull(
normalizedADChange60D,
),
});
}

const valid20DStates = days.filter(
(day) =>
day.state20D !== "INSUFFICIENT_DATA",
).length;

const valid60DStates = days.filter(
(day) =>
day.state60D !== "INSUFFICIENT_DATA",
).length;

return {
days,

count: days.length,

firstDate:
days[0]?.date ?? null,

lastDate:
days[days.length - 1]?.date ?? null,

diagnostics: {
leadershipDays:
leadershipDays.length,

breadthDays:
breadthDays.length,

joinedDays:
days.length,

missingBreadthDays,

valid20DStates,
valid60DStates,

nasdaqUpBreadthDown20D:
days.filter(
(day) =>
day.state20D ===
"NASDAQ_UP_BREADTH_DOWN",
).length,

nasdaqUpBreadthDown60D:
days.filter(
(day) =>
day.state60D ===
"NASDAQ_UP_BREADTH_DOWN",
).length,

chronological:
isChronological(days),

uniqueDates:
new Set(
days.map((day) => day.date),
).size === days.length,
},
};
}

