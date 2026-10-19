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

/* =====================================================
HISTORICAL LEADERSHIP TEST ROUTE

Purpose:
- Validate actual Yahoo historical data availability
- Validate exact-date leadership alignment
- Report coverage and missing observations
- Show selected historical sample days
- Do not modify existing historical datasets
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

const leadership =
alignHistoricalRegimeLeadershipData(
market,
leadershipData,
);

const diagnostics = leadership.diagnostics;

const sampleDates = [
"2015-10-01",
"2018-10-01",
"2020-03-23",
"2022-10-14",
"2024-10-01",
"2026-10-01",
];

const byDate = new Map(
leadership.days.map(
(day) => [day.date, day],
),
);

const samples = sampleDates.map(
(date) => {
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

nasdaq: round(day.nasdaq, 2),
sp500: round(day.sp500, 2),
russell: round(day.russell, 2),
vix: round(day.vix, 2),

nasdaqEqualWeight: round(
day.nasdaqEqualWeight,
4,
),

sp500EqualWeight: round(
day.sp500EqualWeight,
4,
),

semiconductors: round(
day.semiconductors,
4,
),
};
},
);

const qualityChecks = {
allSourcesAvailable:
diagnostics.sourceFailures.length === 0,

chronological:
diagnostics.chronological,

uniqueDates:
diagnostics.uniqueDates,

nonEmpty:
leadership.count > 0,

coverageAbove95Percent:
diagnostics.coverageOfMarketDays !== null &&
diagnostics.coverageOfMarketDays >= 0.95,

latestDateMatchesMarket:
leadership.lastDate === market.lastDate,
};

const allChecksPassed =
Object.values(qualityChecks).every(Boolean);

return NextResponse.json({
status: allChecksPassed
? "PASS"
: "REVIEW",

purpose:
"Historical leadership data and exact-date alignment validation",

period: {
marketFirstDate: market.firstDate,
marketLastDate: market.lastDate,
marketTradingDays: market.count,

leadershipFirstDate: leadership.firstDate,
leadershipLastDate: leadership.lastDate,
leadershipTradingDays: leadership.count,
},

sources: {
nasdaq: marketData.nasdaq.count,
sp500: marketData.sp500.count,
russell: marketData.russell.count,
vix: marketData.vix.count,

qqew:
leadershipData.nasdaqEqualWeight.count,

rsp:
leadershipData.sp500EqualWeight.count,

smh:
leadershipData.semiconductors.count,
},

providerDiagnostics:
leadershipData.diagnostics,

alignmentDiagnostics: diagnostics,

qualityChecks,

samples,
});
} catch (error) {
console.error(
"[HistoricalLeadershipTest] Error:",
error,
);

return NextResponse.json(
{
status: "ERROR",
error:
error instanceof Error
? error.message
: "Unknown historical leadership test error",
},
{ status: 500 },
);
}
}

