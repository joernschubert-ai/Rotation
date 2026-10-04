import type {
HistoricalMacroAsOfDay,
HistoricalMacroVintageAlignment,
} from "@/lib/historicalRegime/historicalRegimeMacroVintageAlignment";

import type {
HistoricalRatesAlignedDay,
} from "@/lib/historicalRegime/historicalRegimeRatesAlignment";

export type HistoricalMacroFeatureDay = {
date: string;

// Raw macro levels
cpi: number | null;
coreCpi: number | null;
nfci: number | null;
real10Y: number | null;

// CPI inflation rates
cpiYoY: number | null;
coreCpiYoY: number | null;

// Macro changes
cpiChange3M: number | null;
cpiChange6M: number | null;
coreCpiChange3M: number | null;
coreCpiChange6M: number | null;

nfciChange4W: number | null;
nfciChange12W: number | null;

real10YChange20D: number | null;
real10YChange60D: number | null;

// Historical rates layer
fedFunds: number | null;
treasury2Y: number | null;
treasury10Y: number | null;
treasury10Y2YSpread: number | null;

fedFundsChange20D: number | null;
treasury2YChange20D: number | null;
treasury10YChange20D: number | null;
treasury10Y2YSpreadChange20D: number | null;

// Provenance
cpiSourceDate: string | null;
coreCpiSourceDate: string | null;
nfciSourceDate: string | null;
real10YSourceDate: string | null;

cpiRealtimeStart: string | null;
coreCpiRealtimeStart: string | null;
nfciRealtimeStart: string | null;
real10YRealtimeStart: string | null;
};

export type HistoricalMacroFeatureDataset = {
days: HistoricalMacroFeatureDay[];
count: number;
firstDate: string | null;
lastDate: string | null;
diagnostics: {
inputMarketDays: number;
outputDays: number;

cpiYoYAvailableCount: number;
coreCpiYoYAvailableCount: number;

cpiChange3MAvailableCount: number;
cpiChange6MAvailableCount: number;
coreCpiChange3MAvailableCount: number;
coreCpiChange6MAvailableCount: number;

nfciChange4WAvailableCount: number;
nfciChange12WAvailableCount: number;

real10YChange20DAvailableCount: number;
real10YChange60DAvailableCount: number;

ratesAvailableCount: number;

dateMismatchCount: number;
};
};

type HistoricalMacroHistoryPoint = {
date: string;
value: number;
};

type HistoricalRateKey =
| "fedFunds"
| "treasury2Y"
| "treasury10Y"
| "treasury10Y2YSpread";

function isValidDate(value: string | null | undefined): boolean {
if (!value) {
return false;
}

return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isFiniteNumber(
value: number | null | undefined,
): value is number {
return typeof value === "number" && Number.isFinite(value);
}

function calculatePercentChange(
current: number | null,
previous: number | null,
): number | null {
if (!isFiniteNumber(current) || !isFiniteNumber(previous)) {
return null;
}

if (previous === 0) {
return null;
}

return ((current / previous) - 1) * 100;
}

function calculateAbsoluteChange(
current: number | null,
previous: number | null,
): number | null {
if (!isFiniteNumber(current) || !isFiniteNumber(previous)) {
return null;
}

return current - previous;
}

function createHistoryMap(
points: HistoricalMacroHistoryPoint[],
): Map<string, number> {
const map = new Map<string, number>();

for (const point of points) {
if (!isValidDate(point.date) || !isFiniteNumber(point.value)) {
continue;
}

map.set(point.date, point.value);
}

return map;
}

function findPreviousObservationDate(
dates: string[],
currentIndex: number,
monthsBack: number,
): string | null {
if (currentIndex < 0 || currentIndex >= dates.length) {
return null;
}

const currentDate = new Date(
`${dates[currentIndex]}T00:00:00.000Z`,
);

const target = new Date(currentDate);
target.setUTCMonth(target.getUTCMonth() - monthsBack);

let bestDate: string | null = null;
let bestDistance = Number.POSITIVE_INFINITY;

for (let i = 0; i < currentIndex; i += 1) {
const candidate = new Date(
`${dates[i]}T00:00:00.000Z`,
);

if (candidate.getTime() > target.getTime()) {
continue;
}

const distance =
target.getTime() - candidate.getTime();

if (distance < bestDistance) {
bestDistance = distance;
bestDate = dates[i];
}
}

return bestDate;
}

function findPreviousTradingDate(
dates: string[],
currentIndex: number,
daysBack: number,
): string | null {
const targetIndex = currentIndex - daysBack;

if (targetIndex < 0 || targetIndex >= dates.length) {
return null;
}

return dates[targetIndex];
}

function calculateYoYFromMonthlySeries(
currentDate: string,
currentValue: number | null,
history: HistoricalMacroHistoryPoint[],
historyMap: Map<string, number>,
): number | null {
if (!isFiniteNumber(currentValue)) {
return null;
}

const currentIndex = history.findIndex(
(point) => point.date === currentDate,
);

if (currentIndex < 0) {
return null;
}

const previousDate =
findPreviousObservationDate(
history.map((point) => point.date),
currentIndex,
12,
);

if (!previousDate) {
return null;
}

const previousValue =
historyMap.get(previousDate) ?? null;

return calculatePercentChange(
currentValue,
previousValue,
);
}

function calculateMonthlyChange(
currentDate: string,
currentValue: number | null,
history: HistoricalMacroHistoryPoint[],
historyMap: Map<string, number>,
monthsBack: number,
): number | null {
if (!isFiniteNumber(currentValue)) {
return null;
}

const dates = history.map(
(point) => point.date,
);

const currentIndex = history.findIndex(
(point) => point.date === currentDate,
);

if (currentIndex < 0) {
return null;
}

const previousDate =
findPreviousObservationDate(
dates,
currentIndex,
monthsBack,
);

if (!previousDate) {
return null;
}

const previousValue =
historyMap.get(previousDate) ?? null;

return calculatePercentChange(
currentValue,
previousValue,
);
}

function calculateWeeklyChange(
currentDate: string,
currentValue: number | null,
history: HistoricalMacroHistoryPoint[],
historyMap: Map<string, number>,
weeksBack: number,
): number | null {
if (!isFiniteNumber(currentValue)) {
return null;
}

const dates = history.map(
(point) => point.date,
);

const currentIndex = history.findIndex(
(point) => point.date === currentDate,
);

if (currentIndex < 0) {
return null;
}

const targetDate = new Date(
`${currentDate}T00:00:00.000Z`,
);

targetDate.setUTCDate(
targetDate.getUTCDate() -
weeksBack * 7,
);

let previousDate: string | null = null;

for (
let i = currentIndex - 1;
i >= 0;
i -= 1
) {
const candidate = new Date(
`${dates[i]}T00:00:00.000Z`,
);

if (
candidate.getTime() <=
targetDate.getTime()
) {
previousDate = dates[i];
break;
}
}

if (!previousDate) {
return null;
}

const previousValue =
historyMap.get(previousDate) ?? null;

return calculateAbsoluteChange(
currentValue,
previousValue,
);
}

function getMacroHistory(
alignment: HistoricalMacroVintageAlignment,
key: keyof Pick<
HistoricalMacroAsOfDay,
"cpi" | "coreCpi" | "nfci" | "real10Y"
>,
): HistoricalMacroHistoryPoint[] {
return alignment.days
.filter(
(day) =>
isValidDate(day.date) &&
isFiniteNumber(day[key]),
)
.map((day) => ({
date: day.date,
value: day[key] as number,
}))
.sort((a, b) =>
a.date.localeCompare(b.date),
);
}

function createRatesMap(
rates: HistoricalRatesAlignedDay[],
): Map<string, HistoricalRatesAlignedDay> {
const map =
new Map<string, HistoricalRatesAlignedDay>();

for (const day of rates) {
if (!isValidDate(day.date)) {
continue;
}

map.set(day.date, day);
}

return map;
}

function getRateValue(
day: HistoricalRatesAlignedDay | null,
key: HistoricalRateKey,
): number | null {
if (!day) {
return null;
}

const value = day.rates?.[key];

return isFiniteNumber(value)
? value
: null;
}

function calculateTradingDayChange(
currentDate: string,
currentValue: number | null,
ratesDates: string[],
ratesMap: Map<string, HistoricalRatesAlignedDay>,
key: HistoricalRateKey,
daysBack: number,
): number | null {
if (!isFiniteNumber(currentValue)) {
return null;
}

const currentIndex =
ratesDates.indexOf(currentDate);

if (currentIndex < 0) {
return null;
}

const previousDate =
findPreviousTradingDate(
ratesDates,
currentIndex,
daysBack,
);

if (!previousDate) {
return null;
}

const previousDay =
ratesMap.get(previousDate) ?? null;

const previousValue =
getRateValue(previousDay, key);

return calculateAbsoluteChange(
currentValue,
previousValue,
);
}

export function buildHistoricalMacroFeatures(
macroAlignment: HistoricalMacroVintageAlignment,
rates: HistoricalRatesAlignedDay[],
): HistoricalMacroFeatureDataset {
const macroDays =
macroAlignment.days
.filter((day) =>
isValidDate(day.date),
)
.sort((a, b) =>
a.date.localeCompare(b.date),
);

const ratesSorted =
rates
.filter((day) =>
isValidDate(day.date),
)
.sort((a, b) =>
a.date.localeCompare(b.date),
);

const cpiHistory =
getMacroHistory(
macroAlignment,
"cpi",
);

const coreCpiHistory =
getMacroHistory(
macroAlignment,
"coreCpi",
);

const nfciHistory =
getMacroHistory(
macroAlignment,
"nfci",
);

const real10YHistory =
getMacroHistory(
macroAlignment,
"real10Y",
);

const cpiMap =
createHistoryMap(cpiHistory);

const coreCpiMap =
createHistoryMap(coreCpiHistory);

const nfciMap =
createHistoryMap(nfciHistory);

const real10YMap =
createHistoryMap(real10YHistory);

const ratesMap =
createRatesMap(rates);

const ratesDates =
ratesSorted.map(
(day) => day.date,
);

let dateMismatchCount = 0;

const days: HistoricalMacroFeatureDay[] =
macroDays.map((day) => {
const ratesDay =
ratesMap.get(day.date) ?? null;

if (!ratesDay) {
dateMismatchCount += 1;
}

const cpiYoY =
calculateYoYFromMonthlySeries(
day.date,
day.cpi,
cpiHistory,
cpiMap,
);

const coreCpiYoY =
calculateYoYFromMonthlySeries(
day.date,
day.coreCpi,
coreCpiHistory,
coreCpiMap,
);

const cpiChange3M =
calculateMonthlyChange(
day.date,
day.cpi,
cpiHistory,
cpiMap,
3,
);

const cpiChange6M =
calculateMonthlyChange(
day.date,
day.cpi,
cpiHistory,
cpiMap,
6,
);

const coreCpiChange3M =
calculateMonthlyChange(
day.date,
day.coreCpi,
coreCpiHistory,
coreCpiMap,
3,
);

const coreCpiChange6M =
calculateMonthlyChange(
day.date,
day.coreCpi,
coreCpiHistory,
coreCpiMap,
6,
);

const nfciChange4W =
calculateWeeklyChange(
day.date,
day.nfci,
nfciHistory,
nfciMap,
4,
);

const nfciChange12W =
calculateWeeklyChange(
day.date,
day.nfci,
nfciHistory,
nfciMap,
12,
);

const real10Y =
day.real10Y;

const real10YChange20D =
calculateTradingDayChange(
day.date,
real10Y,
ratesDates,
ratesMap,
"treasury10Y",
20,
);

const real10YChange60D =
calculateTradingDayChange(
day.date,
real10Y,
ratesDates,
ratesMap,
"treasury10Y",
60,
);

const fedFunds =
getRateValue(
ratesDay,
"fedFunds",
);

const treasury2Y =
getRateValue(
ratesDay,
"treasury2Y",
);

const treasury10Y =
getRateValue(
ratesDay,
"treasury10Y",
);

const treasury10Y2YSpread =
getRateValue(
ratesDay,
"treasury10Y2YSpread",
);

const fedFundsChange20D =
calculateTradingDayChange(
day.date,
fedFunds,
ratesDates,
ratesMap,
"fedFunds",
20,
);

const treasury2YChange20D =
calculateTradingDayChange(
day.date,
treasury2Y,
ratesDates,
ratesMap,
"treasury2Y",
20,
);

const treasury10YChange20D =
calculateTradingDayChange(
day.date,
treasury10Y,
ratesDates,
ratesMap,
"treasury10Y",
20,
);

const treasury10Y2YSpreadChange20D =
calculateTradingDayChange(
day.date,
treasury10Y2YSpread,
ratesDates,
ratesMap,
"treasury10Y2YSpread",
20,
);

return {
date: day.date,

cpi: day.cpi,
coreCpi: day.coreCpi,
nfci: day.nfci,
real10Y: day.real10Y,

cpiYoY,
coreCpiYoY,

cpiChange3M,
cpiChange6M,
coreCpiChange3M,
coreCpiChange6M,

nfciChange4W,
nfciChange12W,

real10YChange20D,
real10YChange60D,

fedFunds,
treasury2Y,
treasury10Y,
treasury10Y2YSpread,

fedFundsChange20D,
treasury2YChange20D,
treasury10YChange20D,
treasury10Y2YSpreadChange20D,

cpiSourceDate:
day.cpiSourceDate,

coreCpiSourceDate:
day.coreCpiSourceDate,

nfciSourceDate:
day.nfciSourceDate,

real10YSourceDate:
day.real10YSourceDate,

cpiRealtimeStart:
day.cpiRealtimeStart,

coreCpiRealtimeStart:
day.coreCpiRealtimeStart,

nfciRealtimeStart:
day.nfciRealtimeStart,

real10YRealtimeStart:
day.real10YRealtimeStart,
};
});

const countAvailable = (
key: keyof HistoricalMacroFeatureDay,
): number =>
days.filter((day) =>
isFiniteNumber(
day[key] as number | null,
),
).length;

return {
days,
count: days.length,
firstDate:
days[0]?.date ?? null,
lastDate:
days[days.length - 1]?.date ?? null,

diagnostics: {
inputMarketDays:
macroAlignment
.diagnostics
.marketDayCount,

outputDays: days.length,

cpiYoYAvailableCount:
countAvailable("cpiYoY"),

coreCpiYoYAvailableCount:
countAvailable(
"coreCpiYoY",
),

cpiChange3MAvailableCount:
countAvailable(
"cpiChange3M",
),

cpiChange6MAvailableCount:
countAvailable(
"cpiChange6M",
),

coreCpiChange3MAvailableCount:
countAvailable(
"coreCpiChange3M",
),

coreCpiChange6MAvailableCount:
countAvailable(
"coreCpiChange6M",
),

nfciChange4WAvailableCount:
countAvailable(
"nfciChange4W",
),

nfciChange12WAvailableCount:
countAvailable(
"nfciChange12W",
),

real10YChange20DAvailableCount:
countAvailable(
"real10YChange20D",
),

real10YChange60DAvailableCount:
countAvailable(
"real10YChange60D",
),

ratesAvailableCount:
days.filter(
(day) =>
isFiniteNumber(
day.fedFunds,
),
).length,

dateMismatchCount,
},
};
}
