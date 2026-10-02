import { NextResponse } from "next/server";


/* =====================================================
FRED HISTORICAL RATES TEST

Purpose:
- Verify FRED_API_KEY
- Verify historical rates availability
- Test 15-year coverage
- No persistence
- No Historical Regime integration
- No scoring
===================================================== */

export const dynamic = "force-dynamic";


const SERIES = {

fedFunds: "DFF",

treasury2Y: "DGS2",

treasury10Y: "DGS10",

} as const;


const OBSERVATION_START =
"2011-10-01";


type FredObservation = {
date: string;
value: string;
};


type FredSeriesResult = {
seriesId: string;

count: number;

firstDate: string | null;
lastDate: string | null;

firstValue: number | null;
lastValue: number | null;
};


/* =====================================================
FETCH FRED SERIES
===================================================== */

async function fetchFredSeries(
seriesId: string,
apiKey: string
): Promise<FredSeriesResult> {

const params =
new URLSearchParams({

series_id:
seriesId,

api_key:
apiKey,

file_type:
"json",

observation_start:
OBSERVATION_START,

sort_order:
"asc",

});


const url =
`https://api.stlouisfed.org/fred/series/observations?${params.toString()}`;


const response =
await fetch(
url,
{
cache: "no-store",
}
);


if (!response.ok) {

const errorText =
await response.text();


throw new Error(
`FRED ${seriesId} failed: ` +
`${response.status} ${errorText.slice(0, 200)}`
);

}


const data =
await response.json();


const observations:
FredObservation[] =
Array.isArray(
data?.observations
)
? data.observations
: [];


/*
* FRED uses "." for unavailable observations.
*/

const valid =
observations
.map(
observation => ({

date:
observation.date,

value:
Number(
observation.value
),

})
)
.filter(
observation =>
observation.date &&
Number.isFinite(
observation.value
)
);


return {

seriesId,

count:
valid.length,

firstDate:
valid[0]?.date ??
null,

lastDate:
valid[
valid.length - 1
]?.date ??
null,

firstValue:
valid[0]?.value ??
null,

lastValue:
valid[
valid.length - 1
]?.value ??
null,

};

}


/* =====================================================
GET
===================================================== */

export async function GET() {

try {

const apiKey =
process.env.FRED_API_KEY;


if (!apiKey) {

return NextResponse.json(
{

ok: false,

error:
"FRED_API_KEY is missing",

},
{
status: 500,
}
);

}


const [
fedFunds,
treasury2Y,
treasury10Y,
] =
await Promise.all([

fetchFredSeries(
SERIES.fedFunds,
apiKey
),

fetchFredSeries(
SERIES.treasury2Y,
apiKey
),

fetchFredSeries(
SERIES.treasury10Y,
apiKey
),

]);


const allHaveData =
[
fedFunds,
treasury2Y,
treasury10Y,
]
.every(
series =>
series.count > 0
);


return NextResponse.json({

ok:
allHaveData,

keyDetected:
true,

observationStart:
OBSERVATION_START,

series: {

fedFunds,

treasury2Y,

treasury10Y,

},

});

}

catch (error) {

console.error(
"FRED historical rates test failed:",
error
);


return NextResponse.json(
{

ok: false,

error:
error instanceof Error
? error.message
: "Unknown FRED error",

},
{
status: 500,
}
);

}

}
