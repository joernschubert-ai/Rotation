import { NextResponse } from "next/server";

import {
loadHistoricalRegimeMacroData,
} from "@/lib/historicalRegime/historicalRegimeMacroProvider";

export const dynamic = "force-dynamic";

export async function GET() {
try {
const data =
await loadHistoricalRegimeMacroData();

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

allSeriesHaveVintageDates: series.every(
(item) =>
item.vintageDates.length > 0
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

vintageDatesChronological: series.every(
(item) =>
item.vintageDates.every(
(date, index) => {
if (index === 0) {
return true;
}

return (
date >=
item.vintageDates[
index - 1
]
);
}
)
),
};

const allChecksPassed =
Object.values(checks).every(Boolean);

return NextResponse.json({
ok: allChecksPassed,

source: {
provider: "FRED",
startDate: "2011-01-01",
},

series: {
cpi: {
seriesId: data.cpi.seriesId,
label: data.cpi.label,
frequency: data.cpi.frequency,
units: data.cpi.units,
seasonalAdjustment:
data.cpi.seasonalAdjustment,
count: data.cpi.count,
firstDate: data.cpi.firstDate,
lastDate: data.cpi.lastDate,
vintageDateCount:
data.cpi.vintageDates.length,
firstVintageDate:
data.cpi.vintageDates[0] ?? null,
lastVintageDate:
data.cpi.vintageDates.at(-1) ?? null,
firstObservations:
data.cpi.observations.slice(0, 3),
lastObservations:
data.cpi.observations.slice(-3),
},

coreCpi: {
seriesId: data.coreCpi.seriesId,
label: data.coreCpi.label,
frequency: data.coreCpi.frequency,
units: data.coreCpi.units,
seasonalAdjustment:
data.coreCpi.seasonalAdjustment,
count: data.coreCpi.count,
firstDate: data.coreCpi.firstDate,
lastDate: data.coreCpi.lastDate,
vintageDateCount:
data.coreCpi.vintageDates.length,
firstVintageDate:
data.coreCpi.vintageDates[0] ?? null,
lastVintageDate:
data.coreCpi.vintageDates.at(-1) ?? null,
firstObservations:
data.coreCpi.observations.slice(0, 3),
lastObservations:
data.coreCpi.observations.slice(-3),
},

nfci: {
seriesId: data.nfci.seriesId,
label: data.nfci.label,
frequency: data.nfci.frequency,
units: data.nfci.units,
seasonalAdjustment:
data.nfci.seasonalAdjustment,
count: data.nfci.count,
firstDate: data.nfci.firstDate,
lastDate: data.nfci.lastDate,
vintageDateCount:
data.nfci.vintageDates.length,
firstVintageDate:
data.nfci.vintageDates[0] ?? null,
lastVintageDate:
data.nfci.vintageDates.at(-1) ?? null,
firstObservations:
data.nfci.observations.slice(0, 3),
lastObservations:
data.nfci.observations.slice(-3),
},

real10Y: {
seriesId: data.real10Y.seriesId,
label: data.real10Y.label,
frequency: data.real10Y.frequency,
units: data.real10Y.units,
seasonalAdjustment:
data.real10Y.seasonalAdjustment,
count: data.real10Y.count,
firstDate: data.real10Y.firstDate,
lastDate: data.real10Y.lastDate,
vintageDateCount:
data.real10Y.vintageDates.length,
firstVintageDate:
data.real10Y.vintageDates[0] ?? null,
lastVintageDate:
data.real10Y.vintageDates.at(-1) ?? null,
firstObservations:
data.real10Y.observations.slice(0, 3),
lastObservations:
data.real10Y.observations.slice(-3),
},
},

checks,
});
} catch (error) {
console.error(
"Historical macro test failed:",
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
