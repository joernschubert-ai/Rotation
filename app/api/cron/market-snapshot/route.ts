import { NextResponse } from "next/server";

import { mapBackendToEngine } from "@/lib/adapters/mapBackendToEngine";
import { validateEngineData } from "@/lib/engine/validateEngineData";

import { marketEngine } from "@/lib/engine/marketEngine";

import { historyEngine } from "@/lib/history/historyEngine";
import { createMarketSnapshot } from "@/lib/history/snapshotEngine";

import {
loadMarketHistory,
saveMarketSnapshot,
} from "@/lib/history/marketHistory";


/* =====================================================
CRON AUTHENTICATION
===================================================== */

function isAuthorized(request: Request): boolean {

const secret =
process.env.CRON_SECRET;

/*
* Without a configured secret we refuse the request.
*
* This prevents the cron endpoint from accidentally
* becoming publicly callable.
*/

if (!secret) {

return false;

}


const authorization =
request.headers.get(
"authorization"
);


return (
authorization ===
`Bearer ${secret}`
);

}


/* =====================================================
GET
===================================================== */

export async function GET(
request: Request
) {

try {

/* =================================================
AUTH
================================================= */

if (
!isAuthorized(request)
) {

return NextResponse.json(
{
ok: false,
error: "Unauthorized"
},
{
status: 401
}
);

}


/* =================================================
MARKET DATA
================================================= */

/*
* We deliberately keep the existing /api/market
* route untouched.
*
* The cron route only consumes its result.
*/

const origin =
new URL(
request.url
).origin;


const marketResponse =
await fetch(
`${origin}/api/market`,
{
method: "GET",
cache: "no-store"
}
);


if (
!marketResponse.ok
) {

throw new Error(
`Market API failed with status ${marketResponse.status}`
);

}


const marketData =
await marketResponse.json();


/* =================================================
MAP
================================================= */

const mapped =
mapBackendToEngine(
marketData
);


if (!mapped) {

throw new Error(
"mapBackendToEngine returned null"
);

}


/* =================================================
VALIDATION
================================================= */

if (
!validateEngineData(
mapped
)
) {

throw new Error(
"Engine data validation failed"
);

}


/* =================================================
HISTORY
================================================= */

const history =
await loadMarketHistory();


/* =================================================
HISTORY METRICS
================================================= */

const historyMetrics =
historyEngine(
history
);


/* =================================================
ENGINE INPUT
================================================= */

const mappedWithHistory = {

...mapped,

historyMetrics

};


/* =================================================
MARKET ENGINE
================================================= */

const engine =
marketEngine(
mappedWithHistory
);


/* =================================================
SNAPSHOT
================================================= */

const snapshot =
createMarketSnapshot({

map:
mappedWithHistory,

engine

});


/* =================================================
SAVE
================================================= */

await saveMarketSnapshot(
snapshot
);


/* =================================================
RESPONSE
================================================= */

return NextResponse.json({

ok: true,

timestamp:
snapshot.timestamp,

phase:
snapshot.phase,

masterScore:
snapshot.master?.score ??
null,

masterSignal:
snapshot.master?.meta?.signal ??
null,

historyLength:
history.length + 1

});

} catch (error) {

console.error(
"Cron Market Snapshot Error:",
error
);


return NextResponse.json(
{

ok: false,

error:
error instanceof Error
? error.message
: "Unknown error"

},
{
status: 500
}
);

}

}
