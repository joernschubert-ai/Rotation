import { NextResponse } from "next/server";

import {
loadHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeProvider";


/* =====================================================
HISTORICAL REGIME DATA TEST

Purpose:
- Test long-term historical market-data provider
- Verify actual coverage returned by Yahoo
- Verify date alignment potential
- No engine integration
- No scoring
- No persistence
===================================================== */

export const dynamic = "force-dynamic";


export async function GET() {

try {

const data =
await loadHistoricalRegimeMarketData();


/* =================================================
SUMMARY
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
BASIC DATA QUALITY
================================================= */

const series =
[
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
DATE INTERSECTION

Determine how many trading dates are available
simultaneously in all four datasets.

This is important because the future Historical
Regime Engine must compare features from the same
trading day.
================================================= */

const nasdaqDates =
new Set(
data.nasdaq.points.map(
point => point.date
)
);


const sp500Dates =
new Set(
data.sp500.points.map(
point => point.date
)
);


const russellDates =
new Set(
data.russell.points.map(
point => point.date
)
);


const vixDates =
new Set(
data.vix.points.map(
point => point.date
)
);


const commonDates =
Array.from(
nasdaqDates
)
.filter(
date =>
sp500Dates.has(date) &&
russellDates.has(date) &&
vixDates.has(date)
)
.sort();


/* =================================================
SAMPLE

Return only a tiny sample.
Never send the entire 15-year dataset through
this diagnostic endpoint.
================================================= */

const firstCommonDate =
commonDates[0] ??
null;


const lastCommonDate =
commonDates[
commonDates.length - 1
] ??
null;


return NextResponse.json({

ok:
allHaveData &&
allHaveDates,

quality: {

allHaveData,

allHaveDates,

allHaveLongHistory,

commonTradingDays:
commonDates.length,

firstCommonDate,

lastCommonDate,

},

summary,

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
