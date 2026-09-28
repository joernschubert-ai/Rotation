// app/api/ai-research/cot/route.ts

import { NextResponse } from "next/server";

import {
fetchCOTData,
} from "@/lib/aiResearch/aiResearchCOTProvider";

import {
calculateCOTMetrics,
buildCOTSummary,
} from "@/lib/aiResearch/aiResearchCOTMetrics";


/* =====================================================
AUTH
===================================================== */

function isAuthorized(
request: Request
): boolean {

const secret =
process.env.CRON_SECRET;

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

if (
!isAuthorized(
request
)
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


const result =
await fetchCOTData({

markets: [

"NASDAQ",

"SP500",

"RUSSELL_2000",

"DOW",

],

/*
* 52 weeks are enough for the first
* historical positioning test.
*/

lookbackWeeks:
52,

});


const metrics =
calculateCOTMetrics(
result.data.observations,
[
"NASDAQ",
"SP500",
"RUSSELL_2000",
"DOW",
],
52
);


const summaries =
metrics.flatMap(
metric =>
buildCOTSummary(
metric
)
);


return NextResponse.json({

ok: true,

generatedAt:
result.data.generatedAt,

latestReportDate:
result.data.latestReportDate,

diagnostics: {

provider:
result.diagnostics,

data:
result.data.diagnostics,

},

markets:
metrics.map(
metric => ({

market:
metric.market,

reportDate:
metric.reportDate,

dealer:
metric.dealer,

assetManager:
metric.assetManager,

leveragedMoney:
metric.leveragedMoney,

otherReportables:
metric.otherReportables,

nonReportables:
metric.nonReportables,

divergences:
metric.divergences,

})
),

summaries,

});

}

catch (
error
) {

console.error(
"COT Research API Error:",
error
);


return NextResponse.json(
{
ok: false,

error:
error instanceof Error
? error.message
: "Unknown COT error",
},
{
status: 500,
}
);

}

}
