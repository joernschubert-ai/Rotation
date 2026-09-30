// /app/api/ai-research/dashboard/route.ts

import { NextResponse } from "next/server";

import {
runAIResearchFromHistory,
} from "@/lib/aiResearch/aiResearchRunner";

import type {
AIResearchTask,
} from "@/lib/aiResearch/aiResearchTypes";


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
* Dashboard-facing AI Research endpoint.
*
* IMPORTANT:
*
* This route intentionally does NOT require CRON_SECRET.
*
* The browser must never receive or send CRON_SECRET.
*
* The protected /api/ai-research route remains unchanged
* and continues to be available for authenticated
* server-side / administrative research calls.
*
* This route directly executes the same server-side
* research runner used by the protected endpoint.
*/

export async function GET(
request: Request
) {

try {

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
"AI Research Dashboard API GET Error:",
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
