import type {
HistoricalRegimeMarketData,
HistoricalMarketSeries,
} from "./historicalRegimeProvider";


/* =====================================================
HISTORICAL REGIME ALIGNMENT

Purpose:
- Align historical market series by trading date
- Only retain dates available in ALL required markets
- Produce one deterministic daily observation
- No scoring
- No regime classification
- No synthetic Rotation-App history
===================================================== */


export type HistoricalAlignedDay = {
date: string;

nasdaq: number;
sp500: number;
russell: number;
vix: number;
};


export type HistoricalAlignedDataset = {
days: HistoricalAlignedDay[];

count: number;

firstDate: string | null;
lastDate: string | null;

sourceCounts: {
nasdaq: number;
sp500: number;
russell: number;
vix: number;
};
};


/* =====================================================
SERIES → DATE MAP
===================================================== */

function createDateMap(
series: HistoricalMarketSeries
): Map<string, number> {

const map =
new Map<string, number>();

for (const point of series.points) {

if (
!point.date ||
!Number.isFinite(point.close)
) {
continue;
}

map.set(
point.date,
point.close
);
}

return map;
}


/* =====================================================
ALIGN DATA
===================================================== */

export function alignHistoricalRegimeMarketData(
data: HistoricalRegimeMarketData
): HistoricalAlignedDataset {

const nasdaqMap =
createDateMap(
data.nasdaq
);

const sp500Map =
createDateMap(
data.sp500
);

const russellMap =
createDateMap(
data.russell
);

const vixMap =
createDateMap(
data.vix
);


/* =================================================
USE NASDAQ AS ITERATION BASE

A day is accepted only when every required market
contains a valid close for exactly the same date.
================================================= */

const days: HistoricalAlignedDay[] =
[];


for (
const [date, nasdaq]
of nasdaqMap.entries()
) {

const sp500 =
sp500Map.get(date);

const russell =
russellMap.get(date);

const vix =
vixMap.get(date);


if (
sp500 === undefined ||
russell === undefined ||
vix === undefined
) {
continue;
}


if (
!Number.isFinite(nasdaq) ||
!Number.isFinite(sp500) ||
!Number.isFinite(russell) ||
!Number.isFinite(vix)
) {
continue;
}


days.push({
date,
nasdaq,
sp500,
russell,
vix,
});

}


/* =================================================
DETERMINISTIC CHRONOLOGICAL ORDER
================================================= */

days.sort(
(a, b) =>
a.date.localeCompare(
b.date
)
);


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

nasdaq:
data.nasdaq.count,

sp500:
data.sp500.count,

russell:
data.russell.count,

vix:
data.vix.count,

},

};
}
