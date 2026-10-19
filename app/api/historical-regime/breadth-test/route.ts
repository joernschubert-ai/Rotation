import { NextResponse } from "next/server";

import {
loadHistoricalRegimeBreadthData,
} from "../../../../lib/historicalRegime/historicalRegimeBreadthProvider";

/**
* Historical Regime – Breadth Diagnostics
*
* Read-only test endpoint.
*
* - No market engine
* - No master score
* - No regime classification
* - No changes to historical data
* - No synthetic fallback values
*
* Loads the historical breadth provider and reports
* data coverage, sample observations and integrity checks.
*/

export const dynamic = "force-dynamic";

export async function GET() {
try {
const dataset =
await loadHistoricalRegimeBreadthData();

const days = dataset.days;

const sampleDates = [
"2012-10-01",
"2015-10-01",
"2018-10-01",
"2020-03-23",
"2022-10-14",
"2024-10-01",
"2026-10-01",
];

const samples = sampleDates.map((targetDate) => {
const day = days.find(
(item) => item.date >= targetDate,
);

return {
targetDate,
actualDate: day?.date ?? null,
observation: day ?? null,
};
});

const qualityChecks = {
hasHistoricalData: days.length > 0,

chronological:
dataset.diagnostics.chronological,

allBreadthValuesWithinRange: days.every(
(day) =>
day.rawBreadth20 === null ||
(day.rawBreadth20 >= 0 &&
day.rawBreadth20 <= 1),
) && days.every(
(day) =>
day.rawBreadth50 === null ||
(day.rawBreadth50 >= 0 &&
day.rawBreadth50 <= 1),
) && days.every(
(day) =>
day.rawBreadth100 === null ||
(day.rawBreadth100 >= 0 &&
day.rawBreadth100 <= 1),
) && days.every(
(day) =>
day.rawBreadth200 === null ||
(day.rawBreadth200 >= 0 &&
day.rawBreadth200 <= 1),
),

validAdvanceDeclineCounts: days.every(
(day) =>
day.advances +
day.declines +
day.unchanged ===
day.advanceDeclineEligibleAssets,
),

validHighLowCounts: days.every(
(day) =>
day.newClosingHighs252D <=
day.highLowEligibleAssets &&
day.newClosingLows252D <=
day.highLowEligibleAssets,
),

validLegacyCounts: days.every(
(day) =>
day.above50Count <= day.validAssets &&
day.above200Count <= day.validAssets,
),
};

return NextResponse.json({
status:
Object.values(qualityChecks).every(Boolean)
? "PASS"
: "WARNING",

provider: "historicalRegimeBreadthProvider",

period: {
firstDate: dataset.firstDate,
lastDate: dataset.lastDate,
tradingDays: dataset.count,
},

universe: {
totalEntries: dataset.universeSize,
uniqueSymbols: dataset.uniqueUniverseSize,
},

diagnostics: dataset.diagnostics,

qualityChecks,

samples,
});
} catch (error) {
console.error(
"[HistoricalBreadthTest] Error:",
error,
);

return NextResponse.json(
{
status: "ERROR",
message:
error instanceof Error
? error.message
: "Unknown historical breadth error",
},
{ status: 500 },
);
}
}

