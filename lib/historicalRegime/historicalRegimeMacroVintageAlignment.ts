/**
* Historical Regime — Macro Vintage Alignment
*
* Purpose:
* - Align revision-aware FRED macro data to historical market dates.
* - Use only information that was actually available on each market date.
* - Prevent look-ahead from later macro releases or revisions.
*
* Important:
* - No regime classification.
* - No scoring.
* - No persistence.
* - No synthetic values.
* - No historical Rotation-App reconstruction.
*
* As-of rule:
*
* A macro observation may be used for a market date when:
*
* observation.date <= marketDate
* AND
* observation.realtimeStart <= marketDate
* AND
* marketDate <= observation.realtimeEnd
*
* For each macro series and market date, the latest available
* observation date is selected.
*/

import type {
HistoricalAlignedDay,
HistoricalAlignedDataset,
} from "@/lib/historicalRegime/historicalRegimeAlignment";

import type {
HistoricalMacroVintageObservation,
HistoricalMacroVintageSeries,
HistoricalRegimeMacroVintageData,
} from "@/lib/historicalRegime/historicalRegimeMacroVintageProvider";

export type HistoricalMacroAsOfDay = {
date: string;

cpi: number | null;
coreCpi: number | null;
nfci: number | null;
real10Y: number | null;

cpiSourceDate: string | null;
coreCpiSourceDate: string | null;
nfciSourceDate: string | null;
real10YSourceDate: string | null;

cpiRealtimeStart: string | null;
coreCpiRealtimeStart: string | null;
nfciRealtimeStart: string | null;
real10YRealtimeStart: string | null;
};

export type HistoricalMacroVintageAlignment = {
days: HistoricalMacroAsOfDay[];

count: number;
firstDate: string | null;
lastDate: string | null;

diagnostics: {
marketDayCount: number;

cpiAvailableCount: number;
coreCpiAvailableCount: number;
nfciAvailableCount: number;
real10YAvailableCount: number;

allSeriesAvailableCount: number;

cpiMissingDates: string[];
coreCpiMissingDates: string[];
nfciMissingDates: string[];
real10YMissingDates: string[];

futureReleaseLeakageCount: number;
};
};

type SelectedMacroObservation = {
value: number;
sourceDate: string;
realtimeStart: string;
realtimeEnd: string;
};

function isValidDateString(
value: string
): boolean {
return /^\d{4}-\d{2}-\d{2}$/.test(
value
);
}

/**
* Select the macro observation that was actually valid
* on the requested market date.
*
* The source observations may contain multiple vintages
* for the same observation date.
*
* We first restrict to observations whose real-time validity
* interval contains the market date and whose observation date
* is not in the future.
*
* From those candidates we select the latest observation date.
*
* If multiple records exist for the same observation date,
* the latest realtimeStart is preferred.
*/
function selectObservationAsOf(
series: HistoricalMacroVintageSeries,
marketDate: string
): SelectedMacroObservation | null {
let selected:
HistoricalMacroVintageObservation | null =
null;

for (const observation of series.observations) {
if (
!isValidDateString(
observation.date
) ||
!isValidDateString(
observation.realtimeStart
) ||
!isValidDateString(
observation.realtimeEnd
)
) {
continue;
}

/**
* The actual macro observation must already exist.
*
* Example:
*
* CPI observation date = 2026-08-01
* market date = 2026-08-20
*
* This alone is not sufficient. We additionally require
* the observation's realtimeStart to be on/before 2026-08-20.
*/
if (
observation.date >
marketDate
) {
continue;
}

/**
* The particular vintage must already be valid
* on the market date.
*/
if (
observation.realtimeStart >
marketDate
) {
continue;
}

if (
observation.realtimeEnd <
marketDate
) {
continue;
}

if (
selected === null
) {
selected =
observation;
continue;
}

/**
* Prefer the most recent available observation date.
*/
if (
observation.date >
selected.date
) {
selected =
observation;
continue;
}

/**
* If the observation date is identical, prefer
* the latest vintage that was already valid.
*/
if (
observation.date ===
selected.date &&
observation.realtimeStart >
selected.realtimeStart
) {
selected =
observation;
}
}

if (
selected === null
) {
return null;
}

return {
value:
selected.value,

sourceDate:
selected.date,

realtimeStart:
selected.realtimeStart,

realtimeEnd:
selected.realtimeEnd,
};
}

function buildMacroAsOfDay(
marketDate: string,
data: HistoricalRegimeMacroVintageData
): HistoricalMacroAsOfDay {
const cpi =
selectObservationAsOf(
data.cpi,
marketDate
);

const coreCpi =
selectObservationAsOf(
data.coreCpi,
marketDate
);

const nfci =
selectObservationAsOf(
data.nfci,
marketDate
);

const real10Y =
selectObservationAsOf(
data.real10Y,
marketDate
);

return {
date:
marketDate,

cpi:
cpi?.value ??
null,

coreCpi:
coreCpi?.value ??
null,

nfci:
nfci?.value ??
null,

real10Y:
real10Y?.value ??
null,

cpiSourceDate:
cpi?.sourceDate ??
null,

coreCpiSourceDate:
coreCpi?.sourceDate ??
null,

nfciSourceDate:
nfci?.sourceDate ??
null,

real10YSourceDate:
real10Y?.sourceDate ??
null,

cpiRealtimeStart:
cpi?.realtimeStart ??
null,

coreCpiRealtimeStart:
coreCpi?.realtimeStart ??
null,

nfciRealtimeStart:
nfci?.realtimeStart ??
null,

real10YRealtimeStart:
real10Y?.realtimeStart ??
null,
};
}

function calculateDiagnostics(
days: HistoricalMacroAsOfDay[]
): HistoricalMacroVintageAlignment["diagnostics"] {
const cpiMissingDates: string[] = [];
const coreCpiMissingDates: string[] = [];
const nfciMissingDates: string[] = [];
const real10YMissingDates: string[] = [];

let cpiAvailableCount = 0;
let coreCpiAvailableCount = 0;
let nfciAvailableCount = 0;
let real10YAvailableCount = 0;

let allSeriesAvailableCount = 0;

for (const day of days) {
if (
day.cpi !== null
) {
cpiAvailableCount++;
} else {
cpiMissingDates.push(
day.date
);
}

if (
day.coreCpi !== null
) {
coreCpiAvailableCount++;
} else {
coreCpiMissingDates.push(
day.date
);
}

if (
day.nfci !== null
) {
nfciAvailableCount++;
} else {
nfciMissingDates.push(
day.date
);
}

if (
day.real10Y !== null
) {
real10YAvailableCount++;
} else {
real10YMissingDates.push(
day.date
);
}

if (
day.cpi !== null &&
day.coreCpi !== null &&
day.nfci !== null &&
day.real10Y !== null
) {
allSeriesAvailableCount++;
}
}

/**
* The alignment function itself enforces the as-of rule.
*
* This diagnostic is therefore calculated by validating every
* selected source relationship against the market date.
*/
let futureReleaseLeakageCount = 0;

for (const day of days) {
const sourcePairs = [
{
sourceDate:
day.cpiSourceDate,

realtimeStart:
day.cpiRealtimeStart,
},

{
sourceDate:
day.coreCpiSourceDate,

realtimeStart:
day.coreCpiRealtimeStart,
},

{
sourceDate:
day.nfciSourceDate,

realtimeStart:
day.nfciRealtimeStart,
},

{
sourceDate:
day.real10YSourceDate,

realtimeStart:
day.real10YRealtimeStart,
},
];

for (const pair of sourcePairs) {
if (
pair.sourceDate !== null &&
pair.sourceDate >
day.date
) {
futureReleaseLeakageCount++;
continue;
}

if (
pair.realtimeStart !== null &&
pair.realtimeStart >
day.date
) {
futureReleaseLeakageCount++;
}
}
}

return {
marketDayCount:
days.length,

cpiAvailableCount,

coreCpiAvailableCount,

nfciAvailableCount,

real10YAvailableCount,

allSeriesAvailableCount,

cpiMissingDates,

coreCpiMissingDates,

nfciMissingDates,

real10YMissingDates,

futureReleaseLeakageCount,
};
}

/**
* Align revision-aware FRED macro data to the supplied
* historical market trading days.
*/
export function alignHistoricalMacroVintage(
marketHistory: HistoricalAlignedDataset,
macroData: HistoricalRegimeMacroVintageData
): HistoricalMacroVintageAlignment {
const days =
marketHistory.days.map(
(marketDay: HistoricalAlignedDay) =>
buildMacroAsOfDay(
marketDay.date,
macroData
)
);

const diagnostics =
calculateDiagnostics(
days
);

return {
days,

count:
days.length,

firstDate:
days[0]?.date ??
null,

lastDate:
days.at(-1)?.date ??
null,

diagnostics,
};
}
