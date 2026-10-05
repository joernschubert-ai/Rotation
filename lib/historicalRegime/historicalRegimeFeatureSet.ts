import type {
HistoricalRegimeFeatures,
} from "./historicalRegimeFeatures";

import type {
HistoricalMacroFeatureDay,
} from "./historicalRegimeMacroFeatures";

import type {
HistoricalForwardOutcome,
} from "./historicalRegimeOutcomes";


/* =====================================================
HISTORICAL REGIME FEATURE SET

Purpose:
- Combine already validated historical feature layers
- Join strictly by exact market date
- Preserve existing feature calculations
- Preserve historical forward outcomes
- No new scoring
- No regime classification
- No similarity scoring
- No synthetic values
- No forward filling
- No date interpolation

Architecture:

Historical Market Features
+
Historical Macro Features
+
Historical Forward Outcomes
↓
Historical Regime Feature Set

This file is an integration layer only.
===================================================== */


/* =====================================================
TYPES
===================================================== */

export type HistoricalRegimeFeatureSetDay = {

date: string;

/* ================= MARKET FEATURES ================= */

market: HistoricalRegimeFeatures;

/* ================= MACRO FEATURES ================= */

macro: HistoricalMacroFeatureDay;

/* ================= FORWARD OUTCOMES ================= */

outcome: HistoricalForwardOutcome;
};


export type HistoricalRegimeFeatureSet = {

days: HistoricalRegimeFeatureSetDay[];

count: number;

firstDate: string | null;

lastDate: string | null;

diagnostics: {

marketFeatureCount: number;

macroFeatureCount: number;

outcomeCount: number;

joinedCount: number;

missingMarketCount: number;

missingMacroCount: number;

missingOutcomeCount: number;

duplicateMarketDates: number;

duplicateMacroDates: number;

duplicateOutcomeDates: number;

chronological: boolean;

firstDate: string | null;

lastDate: string | null;
};
};


/* =====================================================
HELPERS
===================================================== */

function isValidDate(
value: string | null | undefined,
): boolean {

if (!value) {
return false;
}

return /^\d{4}-\d{2}-\d{2}$/.test(value);
}


function isChronological(
dates: string[],
): boolean {

for (
let index = 1;
index < dates.length;
index += 1
) {

if (
dates[index] <=
dates[index - 1]
) {
return false;
}
}

return true;
}


function countDuplicateDates(
dates: string[],
): number {

const counts =
new Map<string, number>();

for (const date of dates) {

counts.set(
date,
(counts.get(date) ?? 0) + 1,
);
}

let duplicateCount = 0;

for (const count of counts.values()) {

if (count > 1) {
duplicateCount += count - 1;
}
}

return duplicateCount;
}


/* =====================================================
DATE MAP BUILDERS
===================================================== */

function createMarketFeatureMap(
features: HistoricalRegimeFeatures[],
): Map<string, HistoricalRegimeFeatures> {

const map =
new Map<string, HistoricalRegimeFeatures>();

for (const feature of features) {

if (
!isValidDate(feature.date)
) {
continue;
}

/*
First valid observation for a date wins.

The historical feature layer should already be
chronological and unique. We deliberately do not
invent or merge duplicate observations here.
*/

if (!map.has(feature.date)) {

map.set(
feature.date,
feature,
);
}
}

return map;
}


function createMacroFeatureMap(
features: HistoricalMacroFeatureDay[],
): Map<string, HistoricalMacroFeatureDay> {

const map =
new Map<string, HistoricalMacroFeatureDay>();

for (const feature of features) {

if (
!isValidDate(feature.date)
) {
continue;
}

if (!map.has(feature.date)) {

map.set(
feature.date,
feature,
);
}
}

return map;
}


function createOutcomeMap(
outcomes: HistoricalForwardOutcome[],
): Map<string, HistoricalForwardOutcome> {

const map =
new Map<string, HistoricalForwardOutcome>();

for (const outcome of outcomes) {

if (
!isValidDate(outcome.date)
) {
continue;
}

if (!map.has(outcome.date)) {

map.set(
outcome.date,
outcome,
);
}
}

return map;
}


/* =====================================================
BUILD FEATURE SET
===================================================== */

export function buildHistoricalRegimeFeatureSet(
marketFeatures: HistoricalRegimeFeatures[],
macroFeatures: HistoricalMacroFeatureDay[],
outcomes: HistoricalForwardOutcome[],
): HistoricalRegimeFeatureSet {

const marketDates =
marketFeatures
.filter(
(feature) =>
isValidDate(feature.date),
)
.map(
(feature) =>
feature.date,
);


const macroDates =
macroFeatures
.filter(
(feature) =>
isValidDate(feature.date),
)
.map(
(feature) =>
feature.date,
);


const outcomeDates =
outcomes
.filter(
(outcome) =>
isValidDate(outcome.date),
)
.map(
(outcome) =>
outcome.date,
);


const marketMap =
createMarketFeatureMap(
marketFeatures,
);


const macroMap =
createMacroFeatureMap(
macroFeatures,
);


const outcomeMap =
createOutcomeMap(
outcomes,
);


/*
The market feature layer defines the primary
historical market calendar.

We only join exact dates that are present in
all three layers.

No forward-fill.
No backward-fill.
No nearest-date matching.
No interpolation.
*/

const candidateDates =
Array.from(
marketMap.keys(),
).sort(
(a, b) =>
a.localeCompare(b),
);


let missingMarketCount = 0;
let missingMacroCount = 0;
let missingOutcomeCount = 0;


const days: HistoricalRegimeFeatureSetDay[] =
[];


for (const date of candidateDates) {

const market =
marketMap.get(date);

const macro =
macroMap.get(date);

const outcome =
outcomeMap.get(date);


if (!market) {

missingMarketCount += 1;

continue;
}


if (!macro) {

missingMacroCount += 1;

continue;
}


if (!outcome) {

missingOutcomeCount += 1;

continue;
}


days.push({

date,

market,

macro,

outcome,

});
}


const joinedDates =
days.map(
(day) =>
day.date,
);


return {

days,

count:
days.length,

firstDate:
days[0]?.date ?? null,

lastDate:
days[days.length - 1]?.date ?? null,

diagnostics: {

marketFeatureCount:
marketFeatures.length,

macroFeatureCount:
macroFeatures.length,

outcomeCount:
outcomes.length,

joinedCount:
days.length,

missingMarketCount,

missingMacroCount,

missingOutcomeCount,

duplicateMarketDates:
countDuplicateDates(
marketDates,
),

duplicateMacroDates:
countDuplicateDates(
macroDates,
),

duplicateOutcomeDates:
countDuplicateDates(
outcomeDates,
),

chronological:
isChronological(
joinedDates,
),

firstDate:
days[0]?.date ?? null,

lastDate:
days[days.length - 1]?.date ?? null,

},
};
}
