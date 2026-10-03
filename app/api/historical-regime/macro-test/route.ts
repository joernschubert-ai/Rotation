import { NextResponse } from "next/server";

import {
loadHistoricalRegimeMacroVintageData,
} from "@/lib/historicalRegime/historicalRegimeMacroVintageProvider";

export const dynamic = "force-dynamic";

export async function GET() {
try {
const data =
await loadHistoricalRegimeMacroVintageData();

const series = [
data.cpi,
data.coreCpi,
data.nfci,
data.real10Y,
];

const checks = {
allSeriesPresent: series.every(Boolean),

allSeriesHaveData: series.every(
(item) => item.count > 0
),

allSeriesHaveValidValues: series.every(
(item) =>
item.observations.length ===
item.observations.filter(
(observation) =>
Number.isFinite(
observation.value
)
).length
),

allSeriesHaveDates: series.every(
(item) =>
item.observations.length ===
item.observations.filter(
(observation) =>
/^\d{4}-\d{2}-\d{2}$/.test(
observation.date
)
).length
),

allSeriesHaveRealtimeStartDates:
series.every(
(item) =>
item.observations.length ===
item.observations.filter(
(observation) =>
/^\d{4}-\d{2}-\d{2}$/.test(
observation.realtimeStart
)
).length
),

allSeriesHaveRealtimeEndDates:
series.every(
(item) =>
item.observations.length ===
item.observations.filter(
(observation) =>
/^\d{4}-\d{2}-\d{2}$/.test(
observation.realtimeEnd
)
).length
),

observationsChronological: series.every(
(item) =>
item.observations.every(
(observation, index) => {
if (index === 0) {
return true;
}

return (
observation.date >=
item.observations[
index - 1
].date
);
}
)
),

realtimeIntervalsValid: series.every(
(item) =>
item.observations.every(
(observation) =>
observation.realtimeStart <=
observation.realtimeEnd
)
),

historicalRealtimeVariation:
series.every((item) => {
const realtimeStarts =
new Set(
item.observations.map(
(observation) =>
observation.realtimeStart
)
);

return realtimeStarts.size > 1;
}),

noObservationUsesOnlyCurrentVintage:
series.every((item) =>
item.observations.some(
(observation) =>
observation.realtimeStart !==
"2026-10-03"
)
),

windowCountCorrect: series.every(
(item) =>
item.windowCount === 4
),
};

const allChecksPassed =
Object.values(checks).every(Boolean);

return NextResponse.json({
ok: allChecksPassed,

source: {
provider: "FRED",
mode:
"revision-aware output_type=1",
startDate: "2011-01-01",
realtimeWindows: 4,
},

series: {
cpi: {
seriesId:
data.cpi.seriesId,
label:
data.cpi.label,
frequency:
data.cpi.frequency,
units:
data.cpi.units,
seasonalAdjustment:
data.cpi.seasonalAdjustment,

count:
data.cpi.count,

firstDate:
data.cpi.firstDate,
lastDate:
data.cpi.lastDate,

windowCount:
data.cpi.windowCount,

realtimeStart:
data.cpi.realtimeStart,
realtimeEnd:
data.cpi.realtimeEnd,

uniqueRealtimeStarts:
Array.from(
new Set(
data.cpi.observations.map(
(observation) =>
observation.realtimeStart
)
)
).slice(0, 20),

uniqueRealtimeStartCount:
new Set(
data.cpi.observations.map(
(observation) =>
observation.realtimeStart
)
).size,

firstObservations:
data.cpi.observations.slice(
0,
5
),

lastObservations:
data.cpi.observations.slice(
-5
),
},

coreCpi: {
seriesId:
data.coreCpi.seriesId,
label:
data.coreCpi.label,
frequency:
data.coreCpi.frequency,
units:
data.coreCpi.units,
seasonalAdjustment:
data.coreCpi.seasonalAdjustment,

count:
data.coreCpi.count,

firstDate:
data.coreCpi.firstDate,
lastDate:
data.coreCpi.lastDate,

windowCount:
data.coreCpi.windowCount,

realtimeStart:
data.coreCpi.realtimeStart,
realtimeEnd:
data.coreCpi.realtimeEnd,

uniqueRealtimeStarts:
Array.from(
new Set(
data.coreCpi.observations.map(
(observation) =>
observation.realtimeStart
)
)
).slice(0, 20),

uniqueRealtimeStartCount:
new Set(
data.coreCpi.observations.map(
(observation) =>
observation.realtimeStart
)
).size,

firstObservations:
data.coreCpi.observations.slice(
0,
5
),

lastObservations:
data.coreCpi.observations.slice(
-5
),
},

nfci: {
seriesId:
data.nfci.seriesId,
label:
data.nfci.label,
frequency:
data.nfci.frequency,
units:
data.nfci.units,
seasonalAdjustment:
data.nfci.seasonalAdjustment,

count:
data.nfci.count,

firstDate:
data.nfci.firstDate,
lastDate:
data.nfci.lastDate,

windowCount:
data.nfci.windowCount,

realtimeStart:
data.nfci.realtimeStart,
realtimeEnd:
data.nfci.realtimeEnd,

uniqueRealtimeStarts:
Array.from(
new Set(
data.nfci.observations.map(
(observation) =>
observation.realtimeStart
)
)
).slice(0, 20),

uniqueRealtimeStartCount:
new Set(
data.nfci.observations.map(
(observation) =>
observation.realtimeStart
)
).size,

firstObservations:
data.nfci.observations.slice(
0,
5
),

lastObservations:
data.nfci.observations.slice(
-5
),
},

real10Y: {
seriesId:
data.real10Y.seriesId,
label:
data.real10Y.label,
frequency:
data.real10Y.frequency,
units:
data.real10Y.units,
seasonalAdjustment:
data.real10Y.seasonalAdjustment,

count:
data.real10Y.count,

firstDate:
data.real10Y.firstDate,
lastDate:
data.real10Y.lastDate,

windowCount:
data.real10Y.windowCount,

realtimeStart:
data.real10Y.realtimeStart,
realtimeEnd:
data.real10Y.realtimeEnd,

uniqueRealtimeStarts:
Array.from(
new Set(
data.real10Y.observations.map(
(observation) =>
observation.realtimeStart
)
)
).slice(0, 20),

uniqueRealtimeStartCount:
new Set(
data.real10Y.observations.map(
(observation) =>
observation.realtimeStart
)
).size,

firstObservations:
data.real10Y.observations.slice(
0,
5
),

lastObservations:
data.real10Y.observations.slice(
-5
),
},
},

checks,
});
} catch (error) {
console.error(
"Historical macro vintage test failed:",
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
{ status: 500 }
);
}
}
