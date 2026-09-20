import { NextResponse } from "next/server";

import {
loadMarketHistory,
} from "@/lib/history/marketHistory";

import {
buildForwardHistory,
type PersistedMarketSnapshot,
} from "@/lib/forwardTest/historyToForwardSnapshots";

import {
runForwardTest,
type ForwardTestInput,
} from "@/lib/forwardTest/forwardTestRunner";


/* =====================================================
FORWARD TEST START
===================================================== */

/*
* The real forward test starts with the first complete
* engine + market-price snapshot available to us.
*
* 2026-09-19 is the first confirmed complete snapshot.
*
* IMPORTANT:
*
* This is a MINIMUM START DATE, not a permanent
* dependency on the existence of this exact snapshot.
*
* If Redis later removes older snapshots because of the
* configured history limit, the forward test continues
* automatically with the oldest remaining daily snapshot
* after this date.
*/

const FORWARD_TEST_START_DATE =
"2026-09-19";


/* =====================================================
HELPER
===================================================== */

/*
* Compare snapshots by their calendar date.
*
* The persisted timestamps are ISO timestamps.
* We deliberately use the first 10 characters here:
*
* YYYY-MM-DD
*
* This keeps the start-date rule independent of the
* exact time of the daily snapshot.
*/

function isOnOrAfterForwardTestStart(
timestamp: string
): boolean {

const dateKey =
timestamp.slice(0, 10);

return (
dateKey >=
FORWARD_TEST_START_DATE
);

}


/* =====================================================
API
===================================================== */

export async function GET() {

try {

/* =================================================
LOAD HISTORY
================================================= */

const history =
await loadMarketHistory();


if (
!Array.isArray(history) ||
history.length === 0
) {

return NextResponse.json({
ok: false,
error:
"No market history available",

historySnapshots: 0,

dailySnapshots: 0,

forwardTestStartDate:
FORWARD_TEST_START_DATE
});

}


/* =================================================
BUILD DAILY FORWARD HISTORY
================================================= */

/*
* buildForwardHistory() already:
*
* 1. validates timestamps
* 2. sorts chronologically
* 3. keeps the last snapshot of each day
* 4. maps engine + market data
*
* Therefore the forward test receives one
* observation per calendar day.
*/

const forwardHistory =
buildForwardHistory(
history as PersistedMarketSnapshot[]
);


/* =================================================
APPLY FORWARD-TEST START DATE
================================================= */

const filteredEngineSnapshots =
forwardHistory.engineSnapshots
.filter((snapshot) =>
isOnOrAfterForwardTestStart(
snapshot.timestamp
)
);


const filteredMarketSnapshots =
forwardHistory.marketSnapshots
.filter((snapshot) =>
isOnOrAfterForwardTestStart(
snapshot.timestamp
)
);


/* =================================================
ALIGN ENGINE + MARKET SNAPSHOTS
================================================= */

/*
* Both arrays originate from the same daily
* snapshot selection and therefore normally have
* identical timestamps.
*
* We still align them explicitly by timestamp
* instead of relying blindly on array positions.
*/

const marketByTimestamp =
new Map(
filteredMarketSnapshots.map(
(snapshot) => [
snapshot.timestamp,
snapshot
]
)
);


const input: ForwardTestInput[] = [];


for (
const engine
of filteredEngineSnapshots
) {

const market =
marketByTimestamp.get(
engine.timestamp
);


if (
!market
) {

continue;

}


input.push({
engine,
market
});

}


/* =================================================
RUN FORWARD TEST
================================================= */

const result =
runForwardTest(
input
);


/* =================================================
RESPONSE
================================================= */

return NextResponse.json({

ok: true,

/*
* Complete Redis history before filtering.
*/

historySnapshots:
history.length,

/*
* Daily snapshots available after
* the 19.09.2026 start anchor.
*/

dailySnapshots:
input.length,

/*
* Explicitly expose the configured
* forward-test start date.
*/

forwardTestStartDate:
FORWARD_TEST_START_DATE,

/*
* Useful diagnostic information.
*/

actualDataStartDate:
input.length > 0
? input[0].engine.timestamp
: null,

actualDataEndDate:
input.length > 0
? input[input.length - 1].engine.timestamp
: null,

result

});

} catch (error) {

console.error(
"Forward Test API error:",
error
);


return NextResponse.json(
{
ok: false,

error:
error instanceof Error
? error.message
: "Unknown error",

forwardTestStartDate:
FORWARD_TEST_START_DATE
},
{
status: 500
}
);

}

}
