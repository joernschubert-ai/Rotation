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

/* =====================================================
HISTORICAL REGIME DIVERGENCE TEST

Purpose:
- Validate leadership/breadth date alignment
- Validate historical divergence arithmetic
- Check 20D/60D warmup behavior
- Inspect historical market examples
- Count descriptive divergence states
- No forward outcomes
- No scoring
- No trading signals
===================================================== */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
HELPERS
===================================================== */

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

function approximatelyEqual(
actual: number | null,
expected: number | null,
tolerance = 1e-10,
): boolean {
if (actual === null || expected === null) {
return actual === expected;
}

return (
Number.isFinite(actual) &&
Number.isFinite(expected) &&
Math.abs(actual - expected) <= tolerance
);
}

function subtract(
current: number | null | undefined,
previous: number | null | undefined,
): number | null {
if (
typeof current !== "number" ||
!Number.isFinite(current) ||
typeof previous !== "number" ||
!Number.isFinite(previous)
) {
return null;
}

return current - previous;
}

function classify(
nasdaqReturn: number | null,
breadthChange: number | null,
): string {
if (
nasdaqReturn === null ||
breadthChange === null
) {
return "INSUFFICIENT_DATA";
}

if (nasdaqReturn > 0 && breadthChange < 0) {
return "NASDAQ_UP_BREADTH_DOWN";
}

if (nasdaqReturn > 0 && breadthChange > 0) {
return "NASDAQ_UP_BREADTH_UP";
}

if (nasdaqReturn < 0 && breadthChange < 0) {
return "NASDAQ_DOWN_BREADTH_DOWN";
}

if (nasdaqReturn < 0 && breadthChange > 0) {
return "NASDAQ_DOWN_BREADTH_UP";
}

return "MIXED_OR_FLAT";
}

/* =====================================================
GET
===================================================== */

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

const breadthMap = new Map(
breadthData.days.map(
(day) => [day.date, day],
),
);

const leadershipDates =
leadershipFeatures.map(
(day) => day.date,
);

const expectedChanges = divergence.days.map(
(day, index) => {
const current = breadthMap.get(day.date);

const previous20 =
index >= 20
? breadthMap.get(
leadershipDates[index - 20],
)
: undefined;

const previous60 =
index >= 60
? breadthMap.get(
leadershipDates[index - 60],
)
: undefined;

return {
date: day.date,

breadth50Change20D: subtract(
current?.rawBreadth50,
previous20?.rawBreadth50,
),

breadth50Change60D: subtract(
current?.rawBreadth50,
previous60?.rawBreadth50,
),

breadth200Change20D: subtract(
current?.rawBreadth200,
previous20?.rawBreadth200,
),

breadth200Change60D: subtract(
current?.rawBreadth200,
previous60?.rawBreadth200,
),

normalizedADChange20D: subtract(
current?.normalizedADLine,
previous20?.normalizedADLine,
),

normalizedADChange60D: subtract(
current?.normalizedADLine,
previous60?.normalizedADLine,
),
};
},
);

const arithmeticValid =
divergence.days.every(
(day, index) => {
const expected = expectedChanges[index];

return (
approximatelyEqual(
day.breadth50Change20D,
expected.breadth50Change20D,
) &&
approximatelyEqual(
day.breadth50Change60D,
expected.breadth50Change60D,
) &&
approximatelyEqual(
day.breadth200Change20D,
expected.breadth200Change20D,
) &&
approximatelyEqual(
day.breadth200Change60D,
expected.breadth200Change60D,
) &&
approximatelyEqual(
day.normalizedADChange20D,
expected.normalizedADChange20D,
) &&
approximatelyEqual(
day.normalizedADChange60D,
expected.normalizedADChange60D,
)
);
},
);

const statesValid =
divergence.days.every(
(day) =>
day.state20D === classify(
day.nasdaqReturn20D,
day.breadth50Change20D,
) &&
day.state60D === classify(
day.nasdaqReturn60D,
day.breadth50Change60D,
),
);

const expectedMissingBreadth =
leadershipDates.filter(
(date) => !breadthMap.has(date),
).length;

const qualityChecks = {
marketAvailable:
market.count > 0,

leadershipAvailable:
leadershipAligned.count > 0,

breadthAvailable:
breadthData.count > 0,

leadershipDatesMatch:
divergence.days.length ===
leadershipFeatures.length &&
divergence.days.every(
(day, index) =>
day.date ===
leadershipFeatures[index]?.date,
),

missingBreadthCountValid:
divergence.diagnostics.missingBreadthDays ===
expectedMissingBreadth,

arithmeticValid,

statesValid,

chronological:
divergence.diagnostics.chronological,

uniqueDates:
divergence.diagnostics.uniqueDates,

warmup20Valid:
divergence.days
.slice(0, 20)
.every(
(day) =>
day.breadth50Change20D === null &&
day.state20D ===
"INSUFFICIENT_DATA",
),

warmup60Valid:
divergence.days
.slice(0, 60)
.every(
(day) =>
day.breadth50Change60D === null &&
day.state60D ===
"INSUFFICIENT_DATA",
),
};

const sampleDates = [
"2015-10-01",
"2018-10-01",
"2020-03-23",
"2022-10-14",
"2024-10-01",
"2026-10-01",
"2026-10-09",
];

const divergenceMap = new Map(
divergence.days.map(
(day) => [day.date, day],
),
);

const samples = sampleDates.map(
(date) => {
const day = divergenceMap.get(date);

if (!day) {
return {
date,
available: false,
};
}

return {
date,
available: true,

nasdaqReturn20D:
round(day.nasdaqReturn20D),

nasdaqReturn60D:
round(day.nasdaqReturn60D),

nasdaqVsEqualWeight20D:
round(day.nasdaqVsEqualWeight20D),

nasdaqVsEqualWeight60D:
round(day.nasdaqVsEqualWeight60D),

russellVsNasdaq20D:
round(day.russellVsNasdaq20D),

russellVsNasdaq60D:
round(day.russellVsNasdaq60D),

rawBreadth50:
round(day.rawBreadth50),

rawBreadth200:
round(day.rawBreadth200),

breadth50Change20D:
round(day.breadth50Change20D),

breadth50Change60D:
round(day.breadth50Change60D),

breadth200Change20D:
round(day.breadth200Change20D),

normalizedADChange20D:
round(day.normalizedADChange20D),

normalizedADChange60D:
round(day.normalizedADChange60D),

breadthCoverageOfUniverse:
round(day.breadthCoverageOfUniverse),

state20D: day.state20D,
state60D: day.state60D,

nasdaqOutperformsQQEW20D:
day.nasdaqOutperformsQQEW20D,

breadth50Falling20D:
day.breadth50Falling20D,

normalizedADFalling20D:
day.normalizedADFalling20D,
};
},
);

const stateCounts20D = {
nasdaqUpBreadthDown:
divergence.days.filter(
(day) =>
day.state20D ===
"NASDAQ_UP_BREADTH_DOWN",
).length,

nasdaqUpBreadthUp:
divergence.days.filter(
(day) =>
day.state20D ===
"NASDAQ_UP_BREADTH_UP",
).length,

nasdaqDownBreadthDown:
divergence.days.filter(
(day) =>
day.state20D ===
"NASDAQ_DOWN_BREADTH_DOWN",
).length,

nasdaqDownBreadthUp:
divergence.days.filter(
(day) =>
day.state20D ===
"NASDAQ_DOWN_BREADTH_UP",
).length,

mixedOrFlat:
divergence.days.filter(
(day) =>
day.state20D ===
"MIXED_OR_FLAT",
).length,

insufficientData:
divergence.days.filter(
(day) =>
day.state20D ===
"INSUFFICIENT_DATA",
).length,
};

const status =
Object.values(qualityChecks).every(Boolean)
? "PASS"
: "REVIEW";

return NextResponse.json({
status,

purpose:
"Historical Nasdaq leadership versus breadth divergence validation",

period: {
marketDays: market.count,
leadershipDays: leadershipAligned.count,
breadthDays: breadthData.count,
divergenceDays: divergence.count,

firstDate: divergence.firstDate,
lastDate: divergence.lastDate,
},

breadthDiagnostics:
breadthData.diagnostics,

divergenceDiagnostics:
divergence.diagnostics,

stateCounts20D,

qualityChecks,

samples,

methodology: {
breadthChange:
"Current raw breadth minus raw breadth exactly 20/60 leadership trading sessions earlier; expressed as fractions.",

normalizedADChange:
"Difference of normalized cumulative A/D line; not a percentage return.",

states:
"Descriptive Nasdaq-return versus breadth50-change quadrants; not predictive signals.",

limitations:
"Mixed fixed research universe, survivorship bias, ETF overlap, changing coverage, raw ETF prices.",
},
});
} catch (error) {
console.error(
"[HistoricalDivergenceTest] Error:",
error,
);

return NextResponse.json(
{
status: "ERROR",
error:
error instanceof Error
? error.message
: "Unknown historical divergence test error",
},
{ status: 500 },
);
}
}

