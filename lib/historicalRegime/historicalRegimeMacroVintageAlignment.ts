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
*
* Performance:
* - The original implementation scanned the complete observation
* array for every market day.
* - This implementation preprocesses the observations once and then
* walks both market dates and vintage intervals chronologically.
* - The as-of semantics remain unchanged.
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

type PreparedMacroObservation =
HistoricalMacroVintageObservation & {
index: number;
};

/**
* A small max-heap ordered by:
*
* 1. latest observation.date
* 2. latest realtimeStart
*
* The heap contains all vintages whose realtimeStart has already
* occurred. Expired observations are removed lazily.
*
* This allows us to select the same "latest available observation"
* as the original implementation without scanning the complete
* observation array for every market date.
*/
class MacroObservationHeap {
private readonly heap: PreparedMacroObservation[] = [];

private isHigherPriority(
left: PreparedMacroObservation,
right: PreparedMacroObservation
): boolean {
if (left.date !== right.date) {
return left.date > right.date;
}

if (left.realtimeStart !== right.realtimeStart) {
return (
left.realtimeStart >
right.realtimeStart
);
}

return left.index > right.index;
}

private swap(
leftIndex: number,
rightIndex: number
): void {
const temporary =
this.heap[leftIndex];

this.heap[leftIndex] =
this.heap[rightIndex];

this.heap[rightIndex] =
temporary;
}

push(
observation: PreparedMacroObservation
): void {
this.heap.push(
observation
);

let index =
this.heap.length - 1;

while (index > 0) {
const parentIndex =
Math.floor(
(index - 1) / 2
);

if (
!this.isHigherPriority(
this.heap[index],
this.heap[parentIndex]
)
) {
break;
}

this.swap(
index,
parentIndex
);

index =
parentIndex;
}
}

peek(): PreparedMacroObservation | null {
return (
this.heap[0] ??
null
);
}

pop(): PreparedMacroObservation | null {
if (
this.heap.length === 0
) {
return null;
}

if (
this.heap.length === 1
) {
return (
this.heap.pop() ??
null
);
}

const result =
this.heap[0];

const last =
this.heap.pop();

if (
last === undefined
) {
return result;
}

this.heap[0] =
last;

let index = 0;

while (true) {
const leftIndex =
index * 2 + 1;

const rightIndex =
index * 2 + 2;

let highestIndex =
index;

if (
leftIndex <
this.heap.length &&
this.isHigherPriority(
this.heap[leftIndex],
this.heap[highestIndex]
)
) {
highestIndex =
leftIndex;
}

if (
rightIndex <
this.heap.length &&
this.isHigherPriority(
this.heap[rightIndex],
this.heap[highestIndex]
)
) {
highestIndex =
rightIndex;
}

if (
highestIndex ===
index
) {
break;
}

this.swap(
index,
highestIndex
);

index =
highestIndex;
}

return result;
}
}

function isValidDateString(
value: string
): boolean {
return /^\d{4}-\d{2}-\d{2}$/.test(
value
);
}

/**
* Prepare only structurally valid observations once.
*
* The original provider already returns sorted observations,
* but the alignment layer must not rely on that implementation
* detail. Sorting here makes the chronological processing explicit.
*/
function prepareObservations(
series: HistoricalMacroVintageSeries
): PreparedMacroObservation[] {
const observations: PreparedMacroObservation[] =
[];

for (
let index = 0;
index <
series.observations.length;
index++
) {
const observation =
series.observations[index];

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

observations.push({
...observation,
index,
});
}

observations.sort(
(
left,
right
) => {
if (
left.realtimeStart !==
right.realtimeStart
) {
return left.realtimeStart.localeCompare(
right.realtimeStart
);
}

if (
left.realtimeEnd !==
right.realtimeEnd
) {
return left.realtimeEnd.localeCompare(
right.realtimeEnd
);
}

if (
left.date !==
right.date
) {
return left.date.localeCompare(
right.date
);
}

return (
left.index -
right.index
);
}
);

return observations;
}

/**
* Select the macro observation that was actually valid
* on the requested market date.
*
* This helper is retained as a simple semantic reference
* for the as-of rule. The production alignment path below
* uses the prepared chronological selector instead of calling
* this function for every market date.
*/
function selectObservationAsOf(
series: HistoricalMacroVintageSeries,
marketDate: string
): SelectedMacroObservation | null {
let selected:
HistoricalMacroVintageObservation | null =
null;

for (
const observation of
series.observations
) {
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

if (
observation.date >
marketDate
) {
continue;
}

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

if (
observation.date >
selected.date
) {
selected =
observation;
continue;
}

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

class HistoricalMacroAsOfSelector {
private readonly observations: PreparedMacroObservation[];

private readonly heap =
new MacroObservationHeap();

private nextObservationIndex = 0;

constructor(
series: HistoricalMacroVintageSeries
) {
this.observations =
prepareObservations(
series
);
}

/**
* Add all vintages whose release date has arrived.
*/
private addAvailableObservations(
marketDate: string
): void {
while (
this.nextObservationIndex <
this.observations.length
) {
const observation =
this.observations[
this.nextObservationIndex
];

if (
observation.realtimeStart >
marketDate
) {
break;
}

this.heap.push(
observation
);

this.nextObservationIndex++;
}
}

/**
* Remove expired observations from the top of the heap.
*
* Expired entries that are not currently on top are removed
* lazily when they become the highest-priority candidate.
*/
private removeExpiredTop(
marketDate: string
): void {
while (true) {
const candidate =
this.heap.peek();

if (
candidate === null
) {
return;
}

if (
candidate.realtimeEnd >=
marketDate
) {
return;
}

this.heap.pop();
}
}

/**
* Advance the selector to a new market date.
*
* The caller must provide market dates in chronological order.
*/
select(
marketDate: string
): SelectedMacroObservation | null {
this.addAvailableObservations(
marketDate
);

this.removeExpiredTop(
marketDate
);

let candidate =
this.heap.peek();

/**
* The heap is ordered by observation.date.
*
* A theoretically expired observation can be hidden below
* the current top. It does not affect correctness unless it
* later becomes the top, where it is removed by
* removeExpiredTop().
*
* The top candidate itself must additionally satisfy the
* observation.date <= marketDate condition.
*/
while (
candidate !== null &&
candidate.date >
marketDate
) {
/**
* Future observation dates must never be used.
*
* They can exist in the heap because realtimeStart may
* precede the observation date in unusual FRED vintage
* structures. Such a record cannot be selected.
*
* We temporarily remove it and retain it so that it can
* participate again on later market dates.
*/
const futureCandidate =
this.heap.pop();

if (
futureCandidate ===
null
) {
break;
}

/**
* Because the heap is only needed for chronological market
* dates, a future-dated observation should normally become
* eligible on a later market date. We therefore reinsert it
* immediately after looking for another valid candidate.
*/
let found:
PreparedMacroObservation | null =
null;

this.removeExpiredTop(
marketDate
);

const next =
this.heap.peek();

if (
next !== null &&
next.date <=
marketDate &&
next.realtimeEnd >=
marketDate
) {
found =
next;
}

this.heap.push(
futureCandidate
);

if (
found === null
) {
return null;
}

candidate =
found;
}

if (
candidate === null
) {
return null;
}

if (
candidate.date >
marketDate
) {
return null;
}

if (
candidate.realtimeStart >
marketDate
) {
return null;
}

if (
candidate.realtimeEnd <
marketDate
) {
this.removeExpiredTop(
marketDate
);

return null;
}

return {
value:
candidate.value,

sourceDate:
candidate.date,

realtimeStart:
candidate.realtimeStart,

realtimeEnd:
candidate.realtimeEnd,
};
}
}

function buildMacroAsOfDays(
marketDays: HistoricalAlignedDay[],
data: HistoricalRegimeMacroVintageData
): HistoricalMacroAsOfDay[] {
const cpiSelector =
new HistoricalMacroAsOfSelector(
data.cpi
);

const coreCpiSelector =
new HistoricalMacroAsOfSelector(
data.coreCpi
);

const nfciSelector =
new HistoricalMacroAsOfSelector(
data.nfci
);

const real10YSelector =
new HistoricalMacroAsOfSelector(
data.real10Y
);

return marketDays.map(
(
marketDay
) => {
const marketDate =
marketDay.date;

const cpi =
cpiSelector.select(
marketDate
);

const coreCpi =
coreCpiSelector.select(
marketDate
);

const nfci =
nfciSelector.select(
marketDate
);

const real10Y =
real10YSelector.select(
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
);
}

function calculateDiagnostics(
days: HistoricalMacroAsOfDay[]
): HistoricalMacroVintageAlignment["diagnostics"] {
const cpiMissingDates: string[] =
[];

const coreCpiMissingDates: string[] =
[];

const nfciMissingDates: string[] =
[];

const real10YMissingDates: string[] =
[];

let cpiAvailableCount = 0;
let coreCpiAvailableCount = 0;
let nfciAvailableCount = 0;
let real10YAvailableCount = 0;

let allSeriesAvailableCount = 0;

for (
const day of days
) {
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
* This diagnostic validates every selected source relationship
* against the market date.
*/
let futureReleaseLeakageCount =
0;

for (
const day of days
) {
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

for (
const pair of sourcePairs
) {
if (
pair.sourceDate !==
null &&
pair.sourceDate >
day.date
) {
futureReleaseLeakageCount++;
continue;
}

if (
pair.realtimeStart !==
null &&
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
buildMacroAsOfDays(
marketHistory.days,
macroData
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
