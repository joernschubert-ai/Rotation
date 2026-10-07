import type {
HistoricalRegimeFeatureSet,
HistoricalRegimeFeatureSetDay,
} from "./historicalRegimeFeatureSet";

export type HistoricalConditionalOperator =
| "lt"
| "lte"
| "gt"
| "gte"
| "eq"
| "between";

export type HistoricalConditionalFeaturePath =
| `market.${keyof HistoricalRegimeFeatureSetDay["market"] & string}`
| `macro.${keyof HistoricalRegimeFeatureSetDay["macro"] & string}`;

export type HistoricalConditionalCondition = {
id: string;
label: string;
feature: HistoricalConditionalFeaturePath;
operator: HistoricalConditionalOperator;
value: number;
upperValue?: number;
};

export type HistoricalConditionalCombination = {
id: string;
label: string;
conditions: HistoricalConditionalCondition[];
};

export type HistoricalConditionalStatistics = {
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

export type HistoricalConditionalOutcomeSummary = {
forward5D: HistoricalConditionalStatistics;
forward20D: HistoricalConditionalStatistics;
forward60D: HistoricalConditionalStatistics;
mfe20D: HistoricalConditionalStatistics;
mae20D: HistoricalConditionalStatistics;
mfe60D: HistoricalConditionalStatistics;
mae60D: HistoricalConditionalStatistics;
};

export type HistoricalConditionalResult = {
id: string;
label: string;
conditions: HistoricalConditionalCondition[];

matchedCount: number;
eligibleCount: number;
coverage: number;

firstMatchedDate: string | null;
lastMatchedDate: string | null;

outcome: HistoricalConditionalOutcomeSummary;
};

export type HistoricalRegimeConditionalOutcomes = {
count: number;
inputDays: number;
chronological: boolean;

conditions: HistoricalConditionalResult[];
};

type NumericRecord = Record<string, unknown>;

function getFeatureValue(
day: HistoricalRegimeFeatureSetDay,
path: HistoricalConditionalFeaturePath,
): number | null {
const [group, key] = path.split(".");

const source =
group === "market"
? (day.market as unknown as NumericRecord)
: (day.macro as unknown as NumericRecord);

const value = source[key];

if (typeof value !== "number" || !Number.isFinite(value)) {
return null;
}

return value;
}

function evaluateCondition(
value: number,
condition: HistoricalConditionalCondition,
): boolean {
switch (condition.operator) {
case "lt":
return value < condition.value;

case "lte":
return value <= condition.value;

case "gt":
return value > condition.value;

case "gte":
return value >= condition.value;

case "eq":
return value === condition.value;

case "between": {
if (
condition.upperValue === undefined ||
!Number.isFinite(condition.upperValue)
) {
return false;
}

const lower = Math.min(condition.value, condition.upperValue);
const upper = Math.max(condition.value, condition.upperValue);

return value >= lower && value <= upper;
}

default:
return false;
}
}

function calculatePercentile(
sortedValues: number[],
percentile: number,
): number | null {
if (sortedValues.length === 0) {
return null;
}

if (sortedValues.length === 1) {
return sortedValues[0];
}

const position = (sortedValues.length - 1) * percentile;
const lowerIndex = Math.floor(position);
const upperIndex = Math.ceil(position);

if (lowerIndex === upperIndex) {
return sortedValues[lowerIndex];
}

const weight = position - lowerIndex;

return (
sortedValues[lowerIndex] +
(sortedValues[upperIndex] - sortedValues[lowerIndex]) * weight
);
}

function calculateStatistics(
values: Array<number | null | undefined>,
): HistoricalConditionalStatistics {
const validValues = values.filter(
(value): value is number =>
typeof value === "number" && Number.isFinite(value),
);

const missing = values.length - validValues.length;

if (validValues.length === 0) {
return {
count: 0,
missing,
min: null,
max: null,
mean: null,
median: null,
p10: null,
p25: null,
p75: null,
p90: null,
standardDeviation: null,
positiveCount: 0,
negativeCount: 0,
zeroCount: 0,
positiveShare: null,
negativeShare: null,
};
}

const sorted = [...validValues].sort((a, b) => a - b);

const sum = validValues.reduce((total, value) => total + value, 0);
const mean = sum / validValues.length;

const variance =
validValues.reduce(
(total, value) => total + Math.pow(value - mean, 2),
0,
) / validValues.length;

const positiveCount = validValues.filter((value) => value > 0).length;
const negativeCount = validValues.filter((value) => value < 0).length;
const zeroCount = validValues.length - positiveCount - negativeCount;

return {
count: validValues.length,
missing,

min: sorted[0],
max: sorted[sorted.length - 1],
mean,

median: calculatePercentile(sorted, 0.5),
p10: calculatePercentile(sorted, 0.1),
p25: calculatePercentile(sorted, 0.25),
p75: calculatePercentile(sorted, 0.75),
p90: calculatePercentile(sorted, 0.9),

standardDeviation: Math.sqrt(variance),

positiveCount,
negativeCount,
zeroCount,

positiveShare: positiveCount / validValues.length,
negativeShare: negativeCount / validValues.length,
};
}

function evaluateCombination(
day: HistoricalRegimeFeatureSetDay,
conditions: HistoricalConditionalCondition[],
): boolean {
if (conditions.length === 0) {
return false;
}

return conditions.every((condition) => {
const value = getFeatureValue(day, condition.feature);

if (value === null) {
return false;
}

return evaluateCondition(value, condition);
});
}

function buildOutcomeSummary(
matchedDays: HistoricalRegimeFeatureSetDay[],
): HistoricalConditionalOutcomeSummary {
return {
forward5D: calculateStatistics(
matchedDays.map((day) => day.outcome.forward5D),
),

forward20D: calculateStatistics(
matchedDays.map((day) => day.outcome.forward20D),
),

forward60D: calculateStatistics(
matchedDays.map((day) => day.outcome.forward60D),
),

mfe20D: calculateStatistics(
matchedDays.map((day) => day.outcome.mfe20D),
),

mae20D: calculateStatistics(
matchedDays.map((day) => day.outcome.mae20D),
),

mfe60D: calculateStatistics(
matchedDays.map((day) => day.outcome.mfe60D),
),

mae60D: calculateStatistics(
matchedDays.map((day) => day.outcome.mae60D),
),
};
}

function isChronological(
days: HistoricalRegimeFeatureSetDay[],
): boolean {
for (let index = 1; index < days.length; index += 1) {
if (days[index - 1].date > days[index].date) {
return false;
}
}

return true;
}

function buildConditionalResult(
featureSet: HistoricalRegimeFeatureSet,
combination: HistoricalConditionalCombination,
): HistoricalConditionalResult {
const matchedDays = featureSet.days.filter((day) =>
evaluateCombination(day, combination.conditions),
);

const firstMatchedDate =
matchedDays.length > 0 ? matchedDays[0].date : null;

const lastMatchedDate =
matchedDays.length > 0
? matchedDays[matchedDays.length - 1].date
: null;

return {
id: combination.id,
label: combination.label,
conditions: combination.conditions,

matchedCount: matchedDays.length,
eligibleCount: featureSet.days.length,

coverage:
featureSet.days.length > 0
? matchedDays.length / featureSet.days.length
: 0,

firstMatchedDate,
lastMatchedDate,

outcome: buildOutcomeSummary(matchedDays),
};
}

/**
* Builds neutral historical conditional outcome statistics.
*
* This layer intentionally does NOT:
* - classify market regimes
* - calculate a score
* - create trading signals
* - interpret conditions as bullish or bearish
* - construct historical analogs
* - modify the historical feature set
* - create synthetic observations
*
* It answers one empirical question:
*
* "What happened after historical observations that satisfied
* the supplied condition(s)?"
*
* Conditions are evaluated only against information available
* on the historical observation date. Forward outcomes are read
* from the already-built HistoricalForwardOutcome layer.
*/
export function buildHistoricalRegimeConditionalOutcomes(
featureSet: HistoricalRegimeFeatureSet,
combinations: HistoricalConditionalCombination[],
): HistoricalRegimeConditionalOutcomes {
if (!featureSet || !Array.isArray(featureSet.days)) {
throw new Error(
"buildHistoricalRegimeConditionalOutcomes: invalid feature set",
);
}

if (!Array.isArray(combinations)) {
throw new Error(
"buildHistoricalRegimeConditionalOutcomes: combinations must be an array",
);
}

const results = combinations.map((combination) =>
buildConditionalResult(featureSet, combination),
);

return {
count: results.length,
inputDays: featureSet.days.length,
chronological: isChronological(featureSet.days),

conditions: results,
};
}
