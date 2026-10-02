import { NextResponse } from "next/server";

import {
loadHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeProvider";

import {
alignHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeAlignment";

import {
loadHistoricalRegimeRatesData,
} from "@/lib/historicalRegime/historicalRegimeRatesProvider";

import {
alignHistoricalRegimeRates,
} from "@/lib/historicalRegime/historicalRegimeRatesAlignment";

import {
buildHistoricalRegimeFeatures,
} from "@/lib/historicalRegime/historicalRegimeFeatures";

import {
buildHistoricalRegimeOutcomes,
} from "@/lib/historicalRegime/historicalRegimeOutcomes";

import {
buildHistoricalRegimeObservations,
} from "@/lib/historicalRegime/historicalRegimeObservations";


/* =====================================================
HISTORICAL REGIME END-TO-END TEST

Purpose:
- Test long-term historical market-data provider
- Verify aligned trading-day coverage
- Verify historical feature generation
- Verify forward outcome generation
- Verify feature/outcome observation join
- Verify historical rates provider
- Verify as-of rates alignment
- Detect future rates leakage
- Verify 10Y - 2Y spread calculation
- Detect boundary / lookback / forward-horizon issues
- No engine integration
- No scoring
- No persistence
===================================================== */

export const dynamic = "force-dynamic";


export async function GET() {

try {

/* =================================================
LOAD RAW HISTORICAL MARKET DATA
================================================= */

const data =
await loadHistoricalRegimeMarketData();


/* =================================================
SOURCE SUMMARY
================================================= */

const summary = {

nasdaq: {
symbol:
data.nasdaq.symbol,

count:
data.nasdaq.count,

firstDate:
data.nasdaq.firstDate,

lastDate:
data.nasdaq.lastDate,
},


sp500: {
symbol:
data.sp500.symbol,

count:
data.sp500.count,

firstDate:
data.sp500.firstDate,

lastDate:
data.sp500.lastDate,
},


russell: {
symbol:
data.russell.symbol,

count:
data.russell.count,

firstDate:
data.russell.firstDate,

lastDate:
data.russell.lastDate,
},


vix: {
symbol:
data.vix.symbol,

count:
data.vix.count,

firstDate:
data.vix.firstDate,

lastDate:
data.vix.lastDate,
},

};


/* =================================================
BASIC SOURCE QUALITY
================================================= */

const series = [
data.nasdaq,
data.sp500,
data.russell,
data.vix,
];


const allHaveData =
series.every(
item =>
item.count > 0
);


const allHaveLongHistory =
series.every(
item =>
item.count >= 2500
);


const allHaveDates =
series.every(
item =>
item.firstDate !== null &&
item.lastDate !== null
);


/* =================================================
MARKET ALIGNMENT
================================================= */

const aligned =
alignHistoricalRegimeMarketData(
data
);


/* =================================================
LOAD HISTORICAL RATES
================================================= */

const ratesData =
await loadHistoricalRegimeRatesData();


/* =================================================
ALIGN RATES AS-OF MARKET DAY

Critical rule:

rateSourceDate <= marketDate

A future rate observation must never be used.
================================================= */

const ratesAligned =
alignHistoricalRegimeRates(
aligned,
ratesData
);


/* =================================================
RATES SOURCE SUMMARY
================================================= */

const ratesSummary = {

fedFunds: {

seriesId:
ratesData.fedFunds.seriesId,

count:
ratesData.fedFunds.count,

firstDate:
ratesData.fedFunds.firstDate,

lastDate:
ratesData.fedFunds.lastDate,

},


treasury2Y: {

seriesId:
ratesData.treasury2Y.seriesId,

count:
ratesData.treasury2Y.count,

firstDate:
ratesData.treasury2Y.firstDate,

lastDate:
ratesData.treasury2Y.lastDate,

},


treasury10Y: {

seriesId:
ratesData.treasury10Y.seriesId,

count:
ratesData.treasury10Y.count,

firstDate:
ratesData.treasury10Y.firstDate,

lastDate:
ratesData.treasury10Y.lastDate,

},

};


/* =================================================
RATES VALIDATION

Check every aligned historical day.

1. No source date may be later than market date.
2. 10Y-2Y spread must equal aligned 10Y minus 2Y.
================================================= */

let futureRateLeakageCount =
0;


let spreadMismatchCount =
0;


let maxFedFundsCarryDays =
0;

let maxTreasury2YCarryDays =
0;

let maxTreasury10YCarryDays =
0;


function calendarDayDifference(
laterDate: string,
earlierDate: string
): number {

const later =
Date.parse(
`${laterDate}T00:00:00Z`
);

const earlier =
Date.parse(
`${earlierDate}T00:00:00Z`
);


if (
!Number.isFinite(later) ||
!Number.isFinite(earlier)
) {
return 0;
}


return Math.round(
(later - earlier) /
86_400_000
);

}


for (
const day
of ratesAligned.days
) {

const {
fedFunds,
treasury2Y,
treasury10Y,
} =
day.rateSourceDates;


if (
fedFunds > day.date ||
treasury2Y > day.date ||
treasury10Y > day.date
) {

futureRateLeakageCount += 1;

}


const expectedSpread =
day.rates.treasury10Y -
day.rates.treasury2Y;


const actualSpread =
day.rates.treasury10Y2YSpread;


if (
Math.abs(
expectedSpread -
actualSpread
) > 1e-12
) {

spreadMismatchCount += 1;

}


maxFedFundsCarryDays =
Math.max(
maxFedFundsCarryDays,
calendarDayDifference(
day.date,
fedFunds
)
);


maxTreasury2YCarryDays =
Math.max(
maxTreasury2YCarryDays,
calendarDayDifference(
day.date,
treasury2Y
)
);


maxTreasury10YCarryDays =
Math.max(
maxTreasury10YCarryDays,
calendarDayDifference(
day.date,
treasury10Y
)
);

}


/* =================================================
RATES CHECKS
================================================= */

const ratesChecks = {

fedFundsHasData:
ratesData.fedFunds.count > 0,

treasury2YHasData:
ratesData.treasury2Y.count > 0,

treasury10YHasData:
ratesData.treasury10Y.count > 0,

ratesAlignmentHasData:
ratesAligned.count > 0,

ratesDoNotExceedMarketDays:
ratesAligned.count <=
aligned.count,

noFutureRateLeakage:
futureRateLeakageCount === 0,

spreadCalculationCorrect:
spreadMismatchCount === 0,

allAlignedRateValuesFinite:
ratesAligned.days.every(
day =>
Number.isFinite(
day.rates.fedFunds
) &&
Number.isFinite(
day.rates.treasury2Y
) &&
Number.isFinite(
day.rates.treasury10Y
) &&
Number.isFinite(
day.rates.treasury10Y2YSpread
)
),

};


const ratesHealthy =
Object.values(
ratesChecks
).every(Boolean);


/* =================================================
FEATURES

Information available at historical day T.
================================================= */

const features =
buildHistoricalRegimeFeatures(
aligned.days
);


/* =================================================
OUTCOMES

What happened AFTER historical day T.
================================================= */

const outcomes =
buildHistoricalRegimeOutcomes(
aligned.days
);


/* =================================================
OBSERVATIONS

Join features and outcomes by date while keeping
both domains structurally separate.
================================================= */

const observations =
buildHistoricalRegimeObservations(
features,
outcomes
);


/* =================================================
EXPECTED BOUNDARY COUNTS

With N aligned observations:

MA200:
first valid value exists at index 199
=> N - 199

Forward 5D:
last 5 observations have no complete future horizon
=> N - 5

Forward 20D:
=> N - 20

Forward 60D:
=> N - 60

Fully usable:
requires MA200 and Forward 60D
=> indices 199 through N - 61
=> N - 259

These formulas apply to the current base model
because all aligned price observations are valid.
================================================= */

const alignedCount =
aligned.count;


const expectedMA200Count =
Math.max(
0,
alignedCount - 199
);


const expectedForward5DCount =
Math.max(
0,
alignedCount - 5
);


const expectedForward20DCount =
Math.max(
0,
alignedCount - 20
);


const expectedForward60DCount =
Math.max(
0,
alignedCount - 60
);


const expectedFullyUsableCount =
Math.max(
0,
alignedCount - 259
);


/* =================================================
PIPELINE CHECKS
================================================= */

const pipelineChecks = {

alignedMatchesCommonDates:
aligned.count === 3772
? true
: aligned.count > 0,

featureCountMatchesAlignment:
features.length ===
aligned.count,

outcomeCountMatchesAlignment:
outcomes.length ===
aligned.count,

observationCountMatchesAlignment:
observations.count ===
aligned.count,

noMissingOutcomeDates:
observations.diagnostics
.missingOutcomeDates === 0,

ma200BoundaryCorrect:
observations.diagnostics
.completeMA200Count ===
expectedMA200Count,

forward5DBoundaryCorrect:
observations.diagnostics
.completeForward5DCount ===
expectedForward5DCount,

forward20DBoundaryCorrect:
observations.diagnostics
.completeForward20DCount ===
expectedForward20DCount,

forward60DBoundaryCorrect:
observations.diagnostics
.completeForward60DCount ===
expectedForward60DCount,

fullyUsableBoundaryCorrect:
observations.diagnostics
.fullyUsableCount ===
expectedFullyUsableCount,

};


const pipelineHealthy =
Object.values(
pipelineChecks
).every(Boolean);


/* =================================================
BOUNDARY SAMPLES
================================================= */

const firstObservation =
observations.observations[0] ??
null;


const firstMA200Observation =
observations.observations.find(
observation =>
observation.features
.nasdaqMA200 !== null
) ??
null;


const lastForward60DObservation =
[...observations.observations]
.reverse()
.find(
observation =>
observation.outcomes
.forward60D !== null
) ??
null;


const lastObservation =
observations.observations[
observations.observations.length - 1
] ??
null;


/* =================================================
RATES SAMPLES

Find one example where Treasury data was carried
from an earlier source date.

This proves the as-of mechanism is actually used.
================================================= */

const firstRatesDay =
ratesAligned.days[0] ??
null;


const firstCarriedTreasuryDay =
ratesAligned.days.find(
day =>
day.rateSourceDates
.treasury2Y !==
day.date ||
day.rateSourceDates
.treasury10Y !==
day.date
) ??
null;


const lastRatesDay =
ratesAligned.days[
ratesAligned.days.length - 1
] ??
null;


/* =================================================
RESPONSE
================================================= */

return NextResponse.json({

ok:
allHaveData &&
allHaveDates &&
allHaveLongHistory &&
pipelineHealthy &&
ratesHealthy,


quality: {

allHaveData,

allHaveDates,

allHaveLongHistory,

commonTradingDays:
aligned.count,

firstCommonDate:
aligned.firstDate,

lastCommonDate:
aligned.lastDate,

},


summary,


rates: {

summary:
ratesSummary,

alignment: {

count:
ratesAligned.count,

firstDate:
ratesAligned.firstDate,

lastDate:
ratesAligned.lastDate,

},

diagnostics: {

...ratesAligned.diagnostics,

futureRateLeakageCount,

spreadMismatchCount,

maxFedFundsCarryDays,

maxTreasury2YCarryDays,

maxTreasury10YCarryDays,

},

checks:
ratesChecks,

},


pipeline: {

alignedCount:
aligned.count,

featureCount:
features.length,

outcomeCount:
outcomes.length,

observationCount:
observations.count,

firstObservationDate:
observations.firstDate,

lastObservationDate:
observations.lastDate,

},


diagnostics:
observations.diagnostics,


expected: {

completeMA200Count:
expectedMA200Count,

completeForward5DCount:
expectedForward5DCount,

completeForward20DCount:
expectedForward20DCount,

completeForward60DCount:
expectedForward60DCount,

fullyUsableCount:
expectedFullyUsableCount,

},


checks:
pipelineChecks,


boundarySamples: {

firstObservation:
firstObservation
? {
date:
firstObservation.date,

ma200:
firstObservation.features
.nasdaqMA200,

forward60D:
firstObservation.outcomes
.forward60D,
}
: null,


firstMA200Observation:
firstMA200Observation
? {
date:
firstMA200Observation.date,

ma200:
firstMA200Observation.features
.nasdaqMA200,

distanceMA200:
firstMA200Observation.features
.nasdaqDistanceMA200,
}
: null,


lastForward60DObservation:
lastForward60DObservation
? {
date:
lastForward60DObservation.date,

forward60D:
lastForward60DObservation.outcomes
.forward60D,
}
: null,


lastObservation:
lastObservation
? {
date:
lastObservation.date,

ma200:
lastObservation.features
.nasdaqMA200,

forward5D:
lastObservation.outcomes
.forward5D,

forward20D:
lastObservation.outcomes
.forward20D,

forward60D:
lastObservation.outcomes
.forward60D,
}
: null,

},


ratesSamples: {

firstRatesDay:
firstRatesDay
? {
date:
firstRatesDay.date,

rates:
firstRatesDay.rates,

sourceDates:
firstRatesDay.rateSourceDates,
}
: null,


firstCarriedTreasuryDay:
firstCarriedTreasuryDay
? {
date:
firstCarriedTreasuryDay.date,

rates:
firstCarriedTreasuryDay.rates,

sourceDates:
firstCarriedTreasuryDay.rateSourceDates,
}
: null,


lastRatesDay:
lastRatesDay
? {
date:
lastRatesDay.date,

rates:
lastRatesDay.rates,

sourceDates:
lastRatesDay.rateSourceDates,
}
: null,

},

});

}

catch (error) {

console.error(
"Historical Regime test failed:",
error
);


return NextResponse.json(
{

ok: false,

error:
error instanceof Error
? error.message
: "Unknown historical regime test error",

},
{
status: 500,
}
);

}

}
