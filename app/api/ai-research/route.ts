// /app/api/ai-research/route.ts

import { NextResponse } from "next/server";

import {
runAIResearchFromHistory,
} from "@/lib/aiResearch/aiResearchRunner";

import type {
AIResearchTask,
} from "@/lib/aiResearch/aiResearchTypes";


/* =====================================================
AUTHENTICATION
===================================================== */

function isAuthorized(
request: Request
): boolean {

const secret =
process.env.CRON_SECRET;

/*
* We deliberately reuse CRON_SECRET here.
*
* No additional secret is required at this stage.
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
TASK VALIDATION
===================================================== */

const VALID_TASKS:
AIResearchTask[] = [

"DAILY_MARKET_REVIEW",

"REGIME_REVIEW",

"ROTATION_REVIEW",

"CRASH_RISK_REVIEW",

"TRADE_SETUP_REVIEW",

"ANOMALY_REVIEW",

"FORWARD_TEST_REVIEW",

];


function isValidTask(
value: unknown
): value is AIResearchTask {

return (
typeof value === "string" &&
VALID_TASKS.includes(
value as AIResearchTask
)
);

}


/* =====================================================
GET
===================================================== */

/*
* GET is intentionally supported first because it gives
* us a very simple way to test the complete research
* pipeline without introducing a request body yet.
*
* The endpoint remains protected by Bearer authentication.
*/

export async function GET(
request: Request
) {

try {

if (
!isAuthorized(request)
) {

return NextResponse.json(
{
ok: false,
error: "Unauthorized",
},
{
status: 401,
}
);

}


const url =
new URL(
request.url
);


const taskParameter =
url.searchParams.get(
"task"
);


const task:
AIResearchTask =
isValidTask(
taskParameter
)
? taskParameter
: "DAILY_MARKET_REVIEW";


const question =
url.searchParams.get(
"question"
) ?? undefined;


const result =
await runAIResearchFromHistory({

task,

question,

});


return NextResponse.json({

ok:
result.status ===
"SUCCESS",

...result,

});

}

catch (error) {

console.error(
"AI Research API GET Error:",
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
