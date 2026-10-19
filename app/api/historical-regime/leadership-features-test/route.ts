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

/* =====================================================
HISTORICAL LEADERSHIP FEATURES TEST

Purpose:
- Validate actual calculated leadership features
- Check 20D and 60D warmup periods
- Check relative-return arithmetic
- Show historical sample observations
- Preserve existing research layers
- No scoring
- No trading signals
===================================================== */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
HELPERS
===================================================== */

function round(
value: number | null,
decimals = 4,
): number | null {
if (
value === null ||
!Number.isFinite(value)
) {
return null;
}

return Number(value.toFixed(decimals));
}

function approximatelyEqual(
actual: number | null,
expected: number | null,
): boolean {
if (actual === null || expected === null) {
return actual === expected;
}

return Math.abs(actual - expected) < 1e-9;
}

function relativeReturnValid(
first: number | null,
second: number | null,
relative: number | null,
): boolean {
const expected =
first !== null && second !== null
? first - second
: null;

return approximatelyEqual(relative, expected);
}

/* =====================================================
GET
===================================================== */

export async function GET() {
try {
const [marketData, leadershipData] =
await Promise.all([
loadHistoricalRegimeMarketData(),
loadHistoricalRegimeLeadershipData(),
]);

const market =
alignHistoricalRegimeMarketData(
marketData,
);

const aligned =
alignHistoricalRegimeLeadershipData(
market,
leadershipData,
);

const features =
buildHistoricalRegimeLeadershipFeatures(
aligned.days,
);

const sampleDates = [
"2015-10-01",
"2018-10-01",
"2020-03-23",
"2022-10-14",
"2024-10-01",
"2026-10-01",
"2026-10-09",
];

const byDate = new Map(
features.map(
(day) => [day.date, day],
),
);

const samples = sampleDates.map((date) => {
const day = byDate.get(date);

if (!day) {
return {
date,
available: false,
};
}

return {
date,
available: true,

nasdaqReturn20D: round(
day.nasdaqReturn20D,
),

nasdaqReturn60D: round(
day.nasdaqReturn60D,
),

qqewReturn20D: round(
day.qqewReturn20D,
),

qqewReturn60D: round(
day.qqewReturn60D,
),

nasdaqVsEqualWeight20D: round(
day.nasdaqVsEqualWeight20D,
),

nasdaqVsEqualWeight60D: round(
day.nasdaqVsEqualWeight60D,
),

sp500VsEqualWeight20D: round(
day.sp500VsEqualWeight20D,
),

sp500VsEqualWeight60D: round(
day.sp500VsEqualWeight60D,
),

semiconductorsVsNasdaq20D: round(
day.semiconductorsVsNasdaq20D,
),

semiconductorsVsNasdaq60D: round(
day.semiconductorsVsNasdaq60D,
),

russellVsNasdaq20D: round(
day.russellVsNasdaq20D,
),

russellVsNasdaq60D: round(
day.russellVsNasdaq60D,
),
};
});

const warmup20Valid =
features.every(
(day, index) =>
index >= 20 ||
(
day.nasdaqReturn20D === null &&
day.qqewReturn20D === null &&
day.nasdaqVsEqualWeight20D === null
),
);

const warmup60Valid =
features.every(
(day, index) =>
index >= 60 ||
(
day.nasdaqReturn60D === null &&
day.qqewReturn60D === null &&
day.nasdaqVsEqualWeight60D === null
),
);

const relativeArithmeticValid =
features.every((day) =>
relativeReturnValid(
day.nasdaqReturn20D,
day.qqewReturn20D,
day.nasdaqVsEqualWeight20D,
) &&
relativeReturnValid(
day.nasdaqReturn60D,
day.qqewReturn60D,
day.nasdaqVsEqualWeight60D,
) &&
relativeReturnValid(
day.sp500Return20D,
day.rspReturn20D,
day.sp500VsEqualWeight20D,
) &&
relativeReturnValid(
day.sp500Return60D,
day.rspReturn60D,
day.sp500VsEqualWeight60D,
) &&
relativeReturnValid(
day.semiconductorReturn20D,
day.nasdaqReturn20D,
day.semiconductorsVsNasdaq20D,
) &&
relativeReturnValid(
day.semiconductorReturn60D,
day.nasdaqReturn60D,
day.semiconductorsVsNasdaq60D,
) &&
relativeReturnValid(
day.russellReturn20D,
day.nasdaqReturn20D,
day.russellVsNasdaq20D,
) &&
relativeReturnValid(
day.russellReturn60D,
day.nasdaqReturn60D,
day.russellVsNasdaq60D,
),
);

const datesMatch =
features.length === aligned.days.length &&
features.every(
(day, index) =>
day.date === aligned.days[index].date,
);

const valid20DCount =
features.filter(
(day) =>
day.nasdaqVsEqualWeight20D !== null,
).length;

const valid60DCount =
features.filter(
(day) =>
day.nasdaqVsEqualWeight60D !== null,
).length;

const qualityChecks = {
allSourcesAvailable:
aligned.diagnostics.sourceFailures.length === 0,

completeAlignment:
aligned.count === market.count,

datesMatch,

warmup20Valid,
warmup60Valid,

relativeArithmeticValid,

valid20DCountExpected:
valid20DCount === Math.max(
0,
features.length - 20,
),

valid60DCountExpected:
valid60DCount === Math.max(
0,
features.length - 60,
),
};

const allChecksPassed =
Object.values(qualityChecks).every(Boolean);

return NextResponse.json({
status: allChecksPassed ? "PASS" : "REVIEW",

purpose:
"Historical leadership relative-return feature validation",

period: {
firstDate: aligned.firstDate,
lastDate: aligned.lastDate,
alignedDays: aligned.count,
featureDays: features.length,
},

availability: {
valid20DCount,
valid60DCount,
firstValid20DDate:
features[20]?.date ?? null,
firstValid60DDate:
features[60]?.date ?? null,
},

qualityChecks,

samples,
});
} catch (error) {
console.error(
"[HistoricalLeadershipFeaturesTest] Error:",
error,
);

return NextResponse.json(
{
status: "ERROR",
error:
error instanceof Error
? error.message
: "Unknown leadership features test error",
},
{ status: 500 },
);
}
}

