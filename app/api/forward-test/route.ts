// app/api/forward-test/route.ts

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
GET /api/forward-test
===================================================== */

export async function GET() {

try {

/* =================================================
LOAD PERSISTED HISTORY
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

historySnapshots:
0,

dailySnapshots:
0,

});

}


/* =================================================
HISTORY -> DAILY FORWARD DATA
================================================= */

const forwardHistory =
buildForwardHistory(
history as PersistedMarketSnapshot[]
);


const engineSnapshots =
forwardHistory.engineSnapshots;

const marketSnapshots =
forwardHistory.marketSnapshots;


/* =================================================
PAIR ENGINE + MARKET SNAPSHOTS
================================================= */

const input:
ForwardTestInput[] = [];


const count =
Math.min(
engineSnapshots.length,
marketSnapshots.length
);


for (
let index = 0;
index < count;
index++
) {

const engine =
engineSnapshots[index];

const market =
marketSnapshots[index];


if (
!engine ||
!market
) {

continue;

}


input.push({

engine,

market,

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

historySnapshots:
history.length,

dailySnapshots:
input.length,

result,

});

}

catch (error) {

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

},

{
status: 500,
}

);

}

}
