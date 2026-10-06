import type {
HistoricalRegimeFeatureSet,
HistoricalRegimeFeatureSetDay,
} from "./historicalRegimeFeatureSet";

export type HistoricalDistributionStatistics = {
count: number;
missing: number;

min: number | null;
max: number | null;
mean: number | null;
median: number | null;

p10: number | null;
p25: number | null;
p75: number | null;
p90: number | null;

standardDeviation: number | null;

positiveCount: number;
negativeCount: number;
zeroCount: number;

positiveShare: number | null;
negativeShare: number | null;
};

export type HistoricalFeatureDistribution = {
feature: string;
statistics: HistoricalDistributionStatistics;
};

export type HistoricalOutcomeDistribution = {
outcome: string;
statistics: HistoricalDistributionStatistics;
};

export type HistoricalRegimeDistributions = {
featureDistributions: HistoricalFeatureDistribution[];
outcomeDistributions: HistoricalOutcomeDistribution[];

count: number;
firstDate: string | null;
lastDate: string | null;

diagnostics: {
inputDays: number;
featureCount: number;
outcomeCount: number;
chronological: boolean;
};
};

type NumericValue = number | null | undefined;

type NumericFeatureDefinition = {
name: string;
getValue: (day: HistoricalRegimeFeatureSetDay) => NumericValue;
};

function isFiniteNumber(
value: NumericValue,
): value is number {
return (
typeof value === "number" &&
Number.isFinite(value)
);
}

function isChronological(
days: HistoricalRegimeFeatureSetDay[],
): boolean {
for (let index = 1; index < days.length; index += 1) {
if (
days[index].date <=
days[index - 1].date
) {
return false;
}
}

return true;
}

function calculateQuantile(
sortedValues: number[],
quantile: number,
): number | null {
if (sortedValues.length === 0) {
return null;
}

if (
quantile < 0 ||
quantile > 1
) {
return null;
}

if (sortedValues.length === 1) {
return sortedValues[0];
}

const position =
(sortedValues.length - 1) *
quantile;

const lowerIndex =
Math.floor(position);

const upperIndex =
Math.ceil(position);

if (
lowerIndex === upperIndex
) {
return sortedValues[lowerIndex];
}

const weight =
position - lowerIndex;

return (
sortedValues[lowerIndex] +
(
sortedValues[upperIndex] -
sortedValues[lowerIndex]
) *
weight
);
}

function calculateMean(
values: number[],
): number | null {
if (values.length === 0) {
return null;
}

const sum = values.reduce(
(total, value) =>
total + value,
0,
);

return sum / values.length;
}

function calculateStandardDeviation(
values: number[],
mean: number | null,
): number | null {
if (
values.length === 0 ||
mean === null
) {
return null;
}

const squaredDifferences =
values.reduce(
(total, value) =>
total +
(value - mean) *
(value - mean),
0,
);

return Math.sqrt(
squaredDifferences /
values.length,
);
}

function buildStatistics(
values: NumericValue[],
totalCount: number,
): HistoricalDistributionStatistics {
const finiteValues = values.filter(
isFiniteNumber,
);

const sortedValues = [
...finiteValues,
].sort(
(a, b) => a - b,
);

const count =
sortedValues.length;

const missing =
totalCount - count;

const mean =
calculateMean(
sortedValues,
);

const positiveCount =
sortedValues.filter(
(value) => value > 0,
).length;

const negativeCount =
sortedValues.filter(
(value) => value < 0,
).length;

const zeroCount =
sortedValues.filter(
(value) => value === 0,
).length;

return {
count,
missing,

min:
count > 0
? sortedValues[0]
: null,

max:
count > 0
? sortedValues[count - 1]
: null,

mean,

median:
calculateQuantile(
sortedValues,
0.5,
),

p10:
calculateQuantile(
sortedValues,
0.1,
),

p25:
calculateQuantile(
sortedValues,
0.25,
),

p75:
calculateQuantile(
sortedValues,
0.75,
),

p90:
calculateQuantile(
sortedValues,
0.9,
),

standardDeviation:
calculateStandardDeviation(
sortedValues,
mean,
),

positiveCount,
negativeCount,
zeroCount,

positiveShare:
count > 0
? positiveCount / count
: null,

negativeShare:
count > 0
? negativeCount / count
: null,
};
}

const FEATURE_DEFINITIONS:
NumericFeatureDefinition[] = [
{
name: "market.nasdaq",
getValue: (day) =>
day.market.nasdaq,
},
{
name: "market.sp500",
getValue: (day) =>
day.market.sp500,
},
{
name: "market.russell",
getValue: (day) =>
day.market.russell,
},
{
name: "market.vix",
getValue: (day) =>
day.market.vix,
},

{
name: "market.nasdaqReturn5D",
getValue: (day) =>
day.market.nasdaqReturn5D,
},
{
name: "market.nasdaqReturn20D",
getValue: (day) =>
day.market.nasdaqReturn20D,
},
{
name: "market.nasdaqReturn60D",
getValue: (day) =>
day.market.nasdaqReturn60D,
},

{
name: "market.sp500Return20D",
getValue: (day) =>
day.market.sp500Return20D,
},
{
name: "market.russellReturn20D",
getValue: (day) =>
day.market.russellReturn20D,
},
{
name: "market.russellVsNasdaq20D",
getValue: (day) =>
day.market.russellVsNasdaq20D,
},

{
name: "market.nasdaqDistanceMA20",
getValue: (day) =>
day.market.nasdaqDistanceMA20,
},
{
name: "market.nasdaqDistanceMA50",
getValue: (day) =>
day.market.nasdaqDistanceMA50,
},
{
name: "market.nasdaqDistanceMA200",
getValue: (day) =>
day.market.nasdaqDistanceMA200,
},

{
name: "market.nasdaqDrawdown20D",
getValue: (day) =>
day.market.nasdaqDrawdown20D,
},
{
name: "market.nasdaqDrawdown60D",
getValue: (day) =>
day.market.nasdaqDrawdown60D,
},

{
name: "market.vixChange5D",
getValue: (day) =>
day.market.vixChange5D,
},
{
name: "market.vixChange20D",
getValue: (day) =>
day.market.vixChange20D,
},
{
name: "market.vixDistanceMA20",
getValue: (day) =>
day.market.vixDistanceMA20,
},

{
name: "macro.cpiYoY",
getValue: (day) =>
day.macro.cpiYoY,
},
{
name: "macro.coreCpiYoY",
getValue: (day) =>
day.macro.coreCpiYoY,
},

{
name: "macro.cpiChange3M",
getValue: (day) =>
day.macro.cpiChange3M,
},
{
name: "macro.cpiChange6M",
getValue: (day) =>
day.macro.cpiChange6M,
},
{
name: "macro.coreCpiChange3M",
getValue: (day) =>
day.macro.coreCpiChange3M,
},
{
name: "macro.coreCpiChange6M",
getValue: (day) =>
day.macro.coreCpiChange6M,
},

{
name: "macro.nfciChange4W",
getValue: (day) =>
day.macro.nfciChange4W,
},
{
name: "macro.nfciChange12W",
getValue: (day) =>
day.macro.nfciChange12W,
},

{
name: "macro.real10Y",
getValue: (day) =>
day.macro.real10Y,
},
{
name: "macro.real10YChange20D",
getValue: (day) =>
day.macro.real10YChange20D,
},
{
name: "macro.real10YChange60D",
getValue: (day) =>
day.macro.real10YChange60D,
},

{
name: "macro.fedFunds",
getValue: (day) =>
day.macro.fedFunds,
},
{
name: "macro.treasury2Y",
getValue: (day) =>
day.macro.treasury2Y,
},
{
name: "macro.treasury10Y",
getValue: (day) =>
day.macro.treasury10Y,
},
{
name: "macro.treasury10Y2YSpread",
getValue: (day) =>
day.macro.treasury10Y2YSpread,
},

{
name: "macro.fedFundsChange20D",
getValue: (day) =>
day.macro.fedFundsChange20D,
},
{
name: "macro.treasury2YChange20D",
getValue: (day) =>
day.macro.treasury2YChange20D,
},
{
name: "macro.treasury10YChange20D",
getValue: (day) =>
day.macro.treasury10YChange20D,
},
{
name:
"macro.treasury10Y2YSpreadChange20D",
getValue: (day) =>
day.macro
.treasury10Y2YSpreadChange20D,
},
];

const OUTCOME_DEFINITIONS:
NumericFeatureDefinition[] = [
{
name: "outcome.forward5D",
getValue: (day) =>
day.outcome.forward5D,
},
{
name: "outcome.forward20D",
getValue: (day) =>
day.outcome.forward20D,
},
{
name: "outcome.forward60D",
getValue: (day) =>
day.outcome.forward60D,
},

{
name: "outcome.mfe20D",
getValue: (day) =>
day.outcome.mfe20D,
},
{
name: "outcome.mae20D",
getValue: (day) =>
day.outcome.mae20D,
},

{
name: "outcome.mfe60D",
getValue: (day) =>
day.outcome.mfe60D,
},
{
name: "outcome.mae60D",
getValue: (day) =>
day.outcome.mae60D,
},
];

function buildDistribution(
definition: NumericFeatureDefinition,
days: HistoricalRegimeFeatureSetDay[],
): HistoricalFeatureDistribution {
const values = days.map(
(day) =>
definition.getValue(day),
);

return {
feature: definition.name,
statistics:
buildStatistics(
values,
days.length,
),
};
}

export function buildHistoricalRegimeDistributions(
featureSet: HistoricalRegimeFeatureSet,
): HistoricalRegimeDistributions {
const days = [
...featureSet.days,
].sort((a, b) =>
a.date.localeCompare(b.date),
);

const featureDistributions =
FEATURE_DEFINITIONS.map(
(definition) =>
buildDistribution(
definition,
days,
),
);

const outcomeDistributions =
OUTCOME_DEFINITIONS.map(
(definition) =>
({
outcome:
definition.name,
statistics:
buildStatistics(
days.map((day) =>
definition.getValue(day),
),
days.length,
),
}),
);

return {
featureDistributions,
outcomeDistributions,

count: days.length,

firstDate:
days[0]?.date ?? null,

lastDate:
days[days.length - 1]?.date ?? null,

diagnostics: {
inputDays:
featureSet.days.length,

featureCount:
featureDistributions.length,

outcomeCount:
outcomeDistributions.length,

chronological:
isChronological(days),
},
};
}
