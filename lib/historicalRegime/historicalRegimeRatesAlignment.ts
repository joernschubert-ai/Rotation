import type {
HistoricalAlignedDataset,
HistoricalAlignedDay,
} from "./historicalRegimeAlignment";

import type {
HistoricalRegimeRatesData,
HistoricalRateSeries,
} from "./historicalRegimeRatesProvider";


/* =====================================================
HISTORICAL REGIME — RATES ALIGNMENT

Purpose:
- Align FRED rates to validated market trading days
- Use only the latest known rate observation <= market date
- Never use a future observation
- Preserve the existing market-day dataset
- No regime classification
- No scoring
- No persistence
- No synthetic history
===================================================== */


/* =====================================================
TYPES
===================================================== */

export type HistoricalAlignedRates = {

fedFunds: number;

treasury2Y: number;

treasury10Y: number;

treasury10Y2YSpread: number;

};


export type HistoricalRatesAlignedDay =
HistoricalAlignedDay & {

rates: HistoricalAlignedRates;

rateSourceDates: {

fedFunds: string;

treasury2Y: string;

treasury10Y: string;

};

};


export type HistoricalRatesAlignedDataset = {

days: HistoricalRatesAlignedDay[];

count: number;

firstDate: string | null;

lastDate: string | null;

sourceCounts: {

marketDays: number;

fedFunds: number;

treasury2Y: number;

treasury10Y: number;

};

diagnostics: {

skippedBeforeRatesAvailable: number;

exactFedFundsMatches: number;

exactTreasury2YMatches: number;

exactTreasury10YMatches: number;

carriedFedFundsMatches: number;

carriedTreasury2YMatches: number;

carriedTreasury10YMatches: number;

};

};


/* =====================================================
AS-OF CURSOR
===================================================== */

type AsOfValue = {

value: number;

sourceDate: string;

};


class HistoricalRateCursor {

private index = -1;

constructor(
private readonly series: HistoricalRateSeries
) {}


getAsOf(
targetDate: string
): AsOfValue | null {

const points =
this.series.points;


/*
* Move forward only while the next observation
* is known on or before targetDate.
*
* Because market dates are processed chronologically,
* this is deterministic and prevents future leakage.
*/

while (
this.index + 1 < points.length &&
points[this.index + 1].date <= targetDate
) {

this.index += 1;

}


if (this.index < 0) {
return null;
}


const point =
points[this.index];


if (
!point ||
!Number.isFinite(point.value) ||
point.date > targetDate
) {
return null;
}


return {

value:
point.value,

sourceDate:
point.date,

};

}

}


/* =====================================================
ALIGN RATES TO MARKET DAYS
===================================================== */

export function alignHistoricalRegimeRates(
marketData: HistoricalAlignedDataset,
ratesData: HistoricalRegimeRatesData
): HistoricalRatesAlignedDataset {

const fedFundsCursor =
new HistoricalRateCursor(
ratesData.fedFunds
);


const treasury2YCursor =
new HistoricalRateCursor(
ratesData.treasury2Y
);


const treasury10YCursor =
new HistoricalRateCursor(
ratesData.treasury10Y
);


const days:
HistoricalRatesAlignedDay[] =
[];


let skippedBeforeRatesAvailable =
0;


let exactFedFundsMatches =
0;

let exactTreasury2YMatches =
0;

let exactTreasury10YMatches =
0;


let carriedFedFundsMatches =
0;

let carriedTreasury2YMatches =
0;

let carriedTreasury10YMatches =
0;


/*
* Defensive chronological sort.
*
* We do not mutate the validated source dataset.
*/

const marketDays =
[...marketData.days]
.sort(
(a, b) =>
a.date.localeCompare(
b.date
)
);


for (const marketDay of marketDays) {

const fedFunds =
fedFundsCursor.getAsOf(
marketDay.date
);


const treasury2Y =
treasury2YCursor.getAsOf(
marketDay.date
);


const treasury10Y =
treasury10YCursor.getAsOf(
marketDay.date
);


/*
* Do not manufacture missing historical rates.
*
* A market day is accepted only when all required
* rate families have an observation known as-of T.
*/

if (
fedFunds === null ||
treasury2Y === null ||
treasury10Y === null
) {

skippedBeforeRatesAvailable += 1;

continue;

}


if (
fedFunds.sourceDate ===
marketDay.date
) {
exactFedFundsMatches += 1;
} else {
carriedFedFundsMatches += 1;
}


if (
treasury2Y.sourceDate ===
marketDay.date
) {
exactTreasury2YMatches += 1;
} else {
carriedTreasury2YMatches += 1;
}


if (
treasury10Y.sourceDate ===
marketDay.date
) {
exactTreasury10YMatches += 1;
} else {
carriedTreasury10YMatches += 1;
}


days.push({

...marketDay,

rates: {

fedFunds:
fedFunds.value,

treasury2Y:
treasury2Y.value,

treasury10Y:
treasury10Y.value,

treasury10Y2YSpread:
treasury10Y.value -
treasury2Y.value,

},

rateSourceDates: {

fedFunds:
fedFunds.sourceDate,

treasury2Y:
treasury2Y.sourceDate,

treasury10Y:
treasury10Y.sourceDate,

},

});

}


return {

days,

count:
days.length,

firstDate:
days[0]?.date ??
null,

lastDate:
days[
days.length - 1
]?.date ??
null,

sourceCounts: {

marketDays:
marketData.count,

fedFunds:
ratesData.fedFunds.count,

treasury2Y:
ratesData.treasury2Y.count,

treasury10Y:
ratesData.treasury10Y.count,

},

diagnostics: {

skippedBeforeRatesAvailable,

exactFedFundsMatches,

exactTreasury2YMatches,

exactTreasury10YMatches,

carriedFedFundsMatches,

carriedTreasury2YMatches,

carriedTreasury10YMatches,

},

};

}
