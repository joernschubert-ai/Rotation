import { NextResponse } from "next/server";

import {
loadHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeProvider";

import {
alignHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeAlignment";

import {
loadHistoricalRegimeMacroVintageData,
} from "@/lib/historicalRegime/historicalRegimeMacroVintageProvider";

import {
alignHistoricalMacroVintage,
} from "@/lib/historicalRegime/historicalRegimeMacroVintageAlignment";

export const dynamic = "force-dynamic";

export async function GET() {
try {
/*
* ============================================================
* LOAD + ALIGN MARKET HISTORY
* ============================================================
*/

const marketData =
await loadHistoricalRegimeMarketData();

const marketAligned =
alignHistoricalRegimeMarketData(
marketData
);

/*
* ============================================================
* LOAD + ALIGN MACRO VINTAGE HISTORY
* ============================================================
*/

const macroData =
await loadHistoricalRegimeMacroVintageData();

const macroAligned =
alignHistoricalMacroVintage(
marketAligned,
macroData
);

const days =
macroAligned.days;

/*
* ============================================================
* BASIC DATA CHECKS
* ============================================================
*/

const allMarketDaysHaveDates =
marketAligned.days.every(
(day) =>
/^\d{4}-\d{2}-\d{2}$/.test(
day.date
)
);

const allMacroDaysHaveDates =
days.every(
(day) =>
/^\d{4}-\d{2}-\d{2}$/.test(
day.date
)
);

const macroDatesMatchMarketDates =
days.length ===
marketAligned.days.length &&
days.every(
(day, index) =>
day.date ===
marketAligned.days[index]
?.date
);

/*
* ============================================================
* AVAILABILITY CHECKS
* ============================================================
*/

const allSeriesAvailable =
days.every(
(day) =>
day.cpi !== null &&
day.coreCpi !== null &&
day.nfci !== null &&
day.real10Y !== null
);

/*
* ============================================================
* AS-OF / LOOK-AHEAD CHECK
*
* Neither the observation date nor the realtime_start
* may be later than the market date.
* ============================================================
*/

let sourceDateLookAheadCount = 0;
let realtimeStartLookAheadCount = 0;

for (const day of days) {
const sourceDates = [
day.cpiSourceDate,
day.coreCpiSourceDate,
day.nfciSourceDate,
day.real10YSourceDate,
];

const realtimeStarts = [
day.cpiRealtimeStart,
day.coreCpiRealtimeStart,
day.nfciRealtimeStart,
day.real10YRealtimeStart,
];

for (const sourceDate of sourceDates) {
if (
sourceDate !== null &&
sourceDate > day.date
) {
sourceDateLookAheadCount++;
}
}

for (
const realtimeStart
of realtimeStarts
) {
if (
realtimeStart !== null &&
realtimeStart > day.date
) {
realtimeStartLookAheadCount++;
}
}
}

const futureReleaseLeakageCount =
sourceDateLookAheadCount +
realtimeStartLookAheadCount;

/*
* ============================================================
* SOURCE INTERVAL CHECK
*
* The alignment function selects an observation whose
* realtime validity interval contains the market date.
*
* The test endpoint verifies the start side directly.
*
* realtime_end is not exposed by the aligned result, so the
* provider-level interval validation remains covered by the
* macro-vintage test endpoint.
* ============================================================
*/

const asOfDatesValid =
futureReleaseLeakageCount === 0;

/*
* ============================================================
* COVERAGE CHECKS
* ============================================================
*/

const marketDayCount =
marketAligned.count;

const macroDayCount =
macroAligned.count;

const coverageMatches =
marketDayCount ===
macroDayCount;

const fullyCoveredCount =
macroAligned.diagnostics
.allSeriesAvailableCount;

const missingMacroCount =
marketDayCount -
fullyCoveredCount;

/*
* ============================================================
* REPRESENTATIVE EARLY / MIDDLE / LATE SAMPLES
* ============================================================
*/

const sampleIndexes =
[
0,
Math.floor(
days.length / 2
),
Math.max(
0,
days.length - 1
),
];

const sampleDays =
Array.from(
new Set(sampleIndexes)
).map(
(index) => ({
index,
...days[index],
})
);

/*
* ============================================================
* RESULT
* ============================================================
*/

const checks = {
marketHistoryLoaded:
marketAligned.count > 0,

allMarketDaysHaveDates,

macroHistoryLoaded:
macroData.cpi.count > 0 &&
macroData.coreCpi.count > 0 &&
macroData.nfci.count > 0 &&
macroData.real10Y.count > 0,

allMacroDaysHaveDates,

macroDatesMatchMarketDates,

coverageMatches,

allSeriesAvailable,

asOfDatesValid,

noFutureReleaseLeakage:
futureReleaseLeakageCount === 0,

fullyCoveredCount:
fullyCoveredCount > 0,
};

const ok =
Object.values(checks).every(
Boolean
);

return NextResponse.json({
ok,

source: {
marketProvider:
"Yahoo Finance",

macroProvider:
"FRED",

macroMode:
"revision-aware output_type=1",

historicalStart:
"2011-01-01",
},

market: {
count:
marketAligned.count,

firstDate:
marketAligned.firstDate,

lastDate:
marketAligned.lastDate,

sourceCounts:
marketAligned.sourceCounts,
},

macro: {
count:
macroAligned.count,

firstDate:
macroAligned.firstDate,

lastDate:
macroAligned.lastDate,

fullyCoveredCount,

missingMacroCount,

availability: {
cpi:
macroAligned.diagnostics
.cpiAvailableCount,

coreCpi:
macroAligned.diagnostics
.coreCpiAvailableCount,

nfci:
macroAligned.diagnostics
.nfciAvailableCount,

real10Y:
macroAligned.diagnostics
.real10YAvailableCount,
},

missingDates: {
cpi:
macroAligned.diagnostics
.cpiMissingDates.slice(
0,
20
),

coreCpi:
macroAligned.diagnostics
.coreCpiMissingDates.slice(
0,
20
),

nfci:
macroAligned.diagnostics
.nfciMissingDates.slice(
0,
20
),

real10Y:
macroAligned.diagnostics
.real10YMissingDates.slice(
0,
20
),
},
},

lookAhead: {
sourceDateLookAheadCount,

realtimeStartLookAheadCount,

futureReleaseLeakageCount,

providerReportedLeakageCount:
macroAligned.diagnostics
.futureReleaseLeakageCount,
},

samples: sampleDays,

checks,
});
} catch (error) {
console.error(
"Historical macro alignment test failed:",
error
);

return NextResponse.json(
{
ok: false,

error:
error instanceof Error
? error.message
: "Unknown error",
},
{
status: 500,
}
);
}
}
