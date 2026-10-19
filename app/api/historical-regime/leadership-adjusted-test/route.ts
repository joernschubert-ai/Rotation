import { NextResponse } from "next/server";

import {
loadHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeProvider";

import {
alignHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeAlignment";

import {
loadHistoricalRegimeLeadershipData,
loadHistoricalRegimeLeadershipAdjustedData,
} from "@/lib/historicalRegime/historicalRegimeLeadershipProvider";

import {
alignHistoricalRegimeLeadershipData,
} from "@/lib/historicalRegime/historicalRegimeLeadershipAlignment";

import type {
HistoricalMarketSeries,
} from "@/lib/historicalRegime/historicalRegimeProvider";

/* =====================================================
HISTORICAL LEADERSHIP ADJUSTED TEST

Purpose:
- Compare raw close and adjusted close
- Verify real Yahoo adjusted-close availability
- Check exact-date coverage
- Measure historical adjustment differences
- Preserve existing research calculations
- No synthetic values
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
decimals = 6,
): number | null {
if (
value === null ||
!Number.isFinite(value)
) {
return null;
}

return Number(value.toFixed(decimals));
}

function compareSeries(
raw: HistoricalMarketSeries,
adjusted: HistoricalMarketSeries,
) {
const rawMap = new Map(
raw.points.map(
(point) => [point.date, point.close],
),
);

const adjustedMap = new Map(
adjusted.points.map(
(point) => [point.date, point.close],
),
);

let matchedDays = 0;
let missingAdjustedDays = 0;
let differentPriceDays = 0;

let maxAbsoluteAdjustmentPercent = 0;

const sampleDates = [
"2015-10-01",
"2018-10-01",
"2020-03-23",
"2022-10-14",
"2024-10-01",
"2026-10-01",
"2026-10-09",
];

for (const [date, rawClose] of rawMap) {
const adjustedClose = adjustedMap.get(date);

if (adjustedClose === undefined) {
missingAdjustedDays++;
continue;
}

matchedDays++;

const differencePercent =
(adjustedClose / rawClose - 1) * 100;

if (Math.abs(differencePercent) > 1e-8) {
differentPriceDays++;
}

maxAbsoluteAdjustmentPercent = Math.max(
maxAbsoluteAdjustmentPercent,
Math.abs(differencePercent),
);
}

const samples = sampleDates.map((date) => {
const rawClose = rawMap.get(date) ?? null;
const adjustedClose =
adjustedMap.get(date) ?? null;

const adjustmentPercent =
rawClose !== null &&
adjustedClose !== null &&
rawClose > 0
? (adjustedClose / rawClose - 1) * 100
: null;

return {
date,
available:
rawClose !== null &&
adjustedClose !== null,

rawClose: round(rawClose, 4),
adjustedClose: round(adjustedClose, 4),

adjustmentPercent:
round(adjustmentPercent),
};
});

return {
symbol: raw.symbol,

rawDays: raw.count,
adjustedDays: adjusted.count,

matchedDays,
missingAdjustedDays,
differentPriceDays,

maxAbsoluteAdjustmentPercent:
round(maxAbsoluteAdjustmentPercent),

firstRawDate: raw.firstDate,
lastRawDate: raw.lastDate,

firstAdjustedDate: adjusted.firstDate,
lastAdjustedDate: adjusted.lastDate,

samples,
};
}

/* =====================================================
GET
===================================================== */

export async function GET() {
try {
const [
marketData,
rawData,
adjustedData,
] = await Promise.all([
loadHistoricalRegimeMarketData(),
loadHistoricalRegimeLeadershipData(),
loadHistoricalRegimeLeadershipAdjustedData(),
]);

const market =
alignHistoricalRegimeMarketData(
marketData,
);

const rawAligned =
alignHistoricalRegimeLeadershipData(
market,
rawData,
);

const adjustedAligned =
alignHistoricalRegimeLeadershipData(
market,
adjustedData,
);

const qqew = compareSeries(
rawData.nasdaqEqualWeight,
adjustedData.nasdaqEqualWeight,
);

const rsp = compareSeries(
rawData.sp500EqualWeight,
adjustedData.sp500EqualWeight,
);

const smh = compareSeries(
rawData.semiconductors,
adjustedData.semiconductors,
);

const qualityChecks = {
rawSourcesAvailable:
rawData.diagnostics.failedSeries.length === 0,

adjustedSourcesAvailable:
adjustedData.diagnostics.failedSeries.length === 0,

rawAlignmentComplete:
rawAligned.count === market.count,

adjustedAlignmentComplete:
adjustedAligned.count === market.count,

qqewAdjustedComplete:
qqew.missingAdjustedDays === 0 &&
qqew.adjustedDays === qqew.rawDays,

rspAdjustedComplete:
rsp.missingAdjustedDays === 0 &&
rsp.adjustedDays === rsp.rawDays,

smhAdjustedComplete:
smh.missingAdjustedDays === 0 &&
smh.adjustedDays === smh.rawDays,

adjustedChronological:
adjustedData.diagnostics.chronological,

alignedDatesIdentical:
rawAligned.count === adjustedAligned.count &&
rawAligned.days.every(
(day, index) =>
day.date === adjustedAligned.days[index]?.date,
),
};

const allChecksPassed =
Object.values(qualityChecks).every(Boolean);

return NextResponse.json({
status: allChecksPassed ? "PASS" : "REVIEW",

purpose:
"Historical leadership raw-close versus adjusted-close validation",

period: {
marketFirstDate: market.firstDate,
marketLastDate: market.lastDate,
marketDays: market.count,

rawAlignedDays: rawAligned.count,
adjustedAlignedDays: adjustedAligned.count,

rawCoverage:
market.count > 0
? round(rawAligned.count / market.count)
: null,

adjustedCoverage:
market.count > 0
? round(adjustedAligned.count / market.count)
: null,
},

adjustedProviderDiagnostics:
adjustedData.diagnostics,

comparisons: {
qqew,
rsp,
smh,
},

qualityChecks,

methodology: {
rawClose:
"Yahoo quote.close",

adjustedClose:
"Yahoo indicators.adjclose",

note:
"Adjusted ETF prices and unadjusted price indices have different return conventions. This test validates availability and adjustment differences, not forecasting performance.",
},
});
} catch (error) {
console.error(
"[HistoricalLeadershipAdjustedTest] Error:",
error,
);

return NextResponse.json(
{
status: "ERROR",
error:
error instanceof Error
? error.message
: "Unknown adjusted leadership test error",
},
{ status: 500 },
);
}
}

