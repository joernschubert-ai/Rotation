"use client";

import {
useCallback,
useEffect,
useState,
} from "react";


/* =====================================================
TYPES
===================================================== */

interface ResearchRegime {

bias?: string;

confidence?: number;

summary?: string;

}


interface ResearchThesis {

statement?: string;

supportingEvidence?: string[];

counterEvidence?: string[];

invalidationConditions?: string[];

}


interface ResearchDivergence {

type?: string;

observation?: string;

significance?: string;

confidence?: number;

}


interface ResearchRisk {

risk?: string;

explanation?: string;

evidenceType?: string;

}


interface ForwardTestClaim {

claim?: string;

expectedDirection?: string;

horizonDays?: number;

confirmationCondition?: string;

invalidationCondition?: string;

confidence?: number;

}


interface ResearchSource {

title?: string;

publisher?: string;

source?: string;

url?: string;

publishedAt?: string;

relevance?: number;

category?: string;

}


interface ResearchReport {

generatedAt?: string;

task?: string;

regime?: ResearchRegime;

thesis?: ResearchThesis;

divergences?: ResearchDivergence[];

risks?: ResearchRisk[];

forwardTestClaims?: ForwardTestClaim[];

sources?: ResearchSource[];

summary?: string;

}


interface ResearchDiagnostics {

snapshotTimestamp?: string;

historyCount?: number;

sourceCount?: number;

warnings?: string[];

}


interface ResearchResponse {

ok?: boolean;

status?: string;

report?: ResearchReport | null;

diagnostics?: ResearchDiagnostics;

error?: string;

}


/* =====================================================
HELPERS
===================================================== */

function text(
value: unknown,
fallback = "—"
): string {

if (
typeof value === "string" &&
value.trim()
) {

return value;

}

return fallback;

}


function number(
value: unknown
): string {

const parsed =
Number(value);

return Number.isFinite(parsed)
? Math.round(parsed).toString()
: "—";

}


function formatDate(
value?: string
): string {

if (!value) {

return "—";

}

const date =
new Date(value);

if (
Number.isNaN(
date.getTime()
)
) {

return value;

}

return date.toLocaleString(
"de-DE",
{

day:
"2-digit",

month:
"2-digit",

year:
"numeric",

hour:
"2-digit",

minute:
"2-digit",

}
);

}


/* =====================================================
SMALL UI COMPONENTS
===================================================== */

function Label({
children
}: {
children: React.ReactNode;
}) {

return (

<div className="text-[9px] uppercase tracking-[0.14em] text-[#555]">

{children}

</div>

);

}


function Value({
children
}: {
children: React.ReactNode;
}) {

return (

<div className="mt-1 text-sm font-semibold text-[#ddd]">

{children}

</div>

);

}


function Card({
title,
children
}: {
title: string;
children: React.ReactNode;
}) {

return (

<div className="border border-[#222] bg-[#111] p-4">

<h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#777]">

{title}

</h3>

{children}

</div>

);

}


/* =====================================================
EVIDENCE LIST
===================================================== */

function EvidenceList({
items,
emptyText = "No evidence"
}: {
items?: string[];
emptyText?: string;
}) {

if (
!items ||
items.length === 0
) {

return (

<div className="text-xs text-[#555]">

{emptyText}

</div>

);

}

return (

<div className="space-y-2">

{items.map(
(
item,
index
) => (

<div
key={`${index}-${item}`}
className="border-l border-[#333] pl-3 text-xs leading-relaxed text-[#aaa]"
>

{item}

</div>

)
)}

</div>

);

}


/* =====================================================
MAIN PANEL
===================================================== */

export default function AIResearchPanel() {

const [
data,
setData
] =
useState<ResearchResponse | null>(
null
);


const [
loading,
setLoading
] =
useState(true);


const [
error,
setError
] =
useState<string | null>(
null
);


/* =====================================================
LOAD RESEARCH
===================================================== */

const loadResearch =
useCallback(
async () => {

try {

setLoading(true);

setError(null);


const response =
await fetch(
"/api/ai-research/dashboard?task=DAILY_MARKET_REVIEW",
{

method:
"GET",

cache:
"no-store",

}
);


const json =
await response.json();


if (
!response.ok
) {

throw new Error(
json?.error ??
`AI Research API returned ${response.status}`
);

}


setData(
json
);

}

catch (err) {

console.error(
"AI RESEARCH LOAD ERROR:",
err
);


setError(
err instanceof Error
? err.message
: "AI Research could not be loaded."
);

}

finally {

setLoading(false);

}

},
[]
);


useEffect(
() => {

loadResearch();

},
[
loadResearch
]
);


/* =====================================================
LOADING
===================================================== */

if (
loading &&
!data
) {

return (

<div className="border border-[#222] bg-[#111] p-4">

<div className="text-xs uppercase tracking-[0.12em] text-[#666]">

Loading AI Research...

</div>

</div>

);

}


/* =====================================================
ERROR
===================================================== */

if (
error &&
!data
) {

return (

<div className="border border-[#3a2020] bg-[#140d0d] p-4">

<div className="text-xs font-bold uppercase tracking-[0.12em] text-[#aa6666]">

AI Research unavailable

</div>

<div className="mt-2 text-xs text-[#777]">

{error}

</div>

<button
onClick={loadResearch}
className="mt-4 border border-[#444] bg-[#222] px-3 py-2 text-xs transition hover:bg-[#333]"
>

Retry

</button>

</div>

);

}


/* =====================================================
REPORT
===================================================== */

const report =
data?.report;


if (!report) {

return (

<div className="border border-[#222] bg-[#111] p-4">

<div className="text-xs text-[#666]">

No AI Research report available.

</div>

</div>

);

}


const regime =
report.regime ?? {};


const thesis =
report.thesis ?? {};


const divergences =
report.divergences ?? [];


const risks =
report.risks ?? [];


const claims =
report.forwardTestClaims ?? [];


const sources =
report.sources ?? [];


/* =====================================================
RENDER
===================================================== */

return (

<div className="space-y-4">


{/* ===================================================
RESEARCH STATE
=================================================== */}

<div className="border border-[#222] bg-[#111] p-4">

<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

<div>

<div className="text-[10px] uppercase tracking-[0.14em] text-[#555]">

AI RESEARCH STATE

</div>

<div className="mt-2 text-xl font-bold tracking-wide text-white">

{text(
regime.bias
)}

</div>

<div className="mt-2 max-w-4xl text-xs leading-relaxed text-[#888]">

{text(
report.summary
)}

</div>

</div>


<div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">

<div>

<Label>
Confidence
</Label>

<Value>
{number(
regime.confidence
)}%
</Value>

</div>


<div>

<Label>
History
</Label>

<Value>
{number(
data?.diagnostics?.historyCount
)}
</Value>

</div>


<div>

<Label>
Sources
</Label>

<Value>
{number(
data?.diagnostics?.sourceCount
)}
</Value>

</div>


<div>

<Label>
Generated
</Label>

<Value>
<span className="text-xs">

{formatDate(
report.generatedAt
)}

</span>
</Value>

</div>

</div>

</div>

</div>


{/* ===================================================
THESIS
=================================================== */}

<Card
title="Research Thesis"
>

<div className="text-sm leading-relaxed text-[#ddd]">

{text(
thesis.statement
)}

</div>


<div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">


<div>

<Label>
Supporting Evidence
</Label>

<div className="mt-3">

<EvidenceList
items={
thesis.supportingEvidence
}
/>

</div>

</div>


<div>

<Label>
Counter Evidence
</Label>

<div className="mt-3">

<EvidenceList
items={
thesis.counterEvidence
}
emptyText="No counter evidence"
/>

</div>

</div>


<div>

<Label>
Invalidation
</Label>

<div className="mt-3">

<EvidenceList
items={
thesis.invalidationConditions
}
emptyText="No invalidation conditions"
/>

</div>

</div>

</div>

</Card>


{/* ===================================================
DIVERGENCES + RISKS
=================================================== */}

<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">


<Card
title={`Divergences (${divergences.length})`}
>

{divergences.length === 0 ? (

<div className="text-xs text-[#555]">

No structural divergences detected.

</div>

) : (

<div className="space-y-4">

{divergences.map(
(
divergence,
index
) => (

<div
key={`${divergence.type}-${index}`}
className="border-b border-[#222] pb-4 last:border-b-0 last:pb-0"
>

<div className="flex items-center justify-between gap-4">

<div className="text-xs font-bold text-[#ccc]">

{text(
divergence.type
)}

</div>

<div className="text-[10px] text-[#666]">

CONF {number(
divergence.confidence
)}%

</div>

</div>


<div className="mt-2 text-xs leading-relaxed text-[#aaa]">

{text(
divergence.observation
)}

</div>


<div className="mt-2 text-[11px] leading-relaxed text-[#666]">

{text(
divergence.significance
)}

</div>

</div>

)
)}

</div>

)}

</Card>


<Card
title={`Research Risks (${risks.length})`}
>

{risks.length === 0 ? (

<div className="text-xs text-[#555]">

No predefined research risks detected.

</div>

) : (

<div className="space-y-4">

{risks.map(
(
risk,
index
) => (

<div
key={`${risk.risk}-${index}`}
className="border-b border-[#222] pb-4 last:border-b-0 last:pb-0"
>

<div className="flex items-center justify-between gap-4">

<div className="text-xs font-bold text-[#ccc]">

{text(
risk.risk
)}

</div>

<div className="text-[9px] uppercase tracking-[0.12em] text-[#555]">

{text(
risk.evidenceType
)}

</div>

</div>


<div className="mt-2 text-xs leading-relaxed text-[#888]">

{text(
risk.explanation
)}

</div>

</div>

)
)}

</div>

)}

</Card>

</div>


{/* ===================================================
FORWARD TEST CLAIMS
=================================================== */}

<Card
title={`Forward-Testable Claims (${claims.length})`}
>

{claims.length === 0 ? (

<div className="text-xs text-[#555]">

No active forward-testable research claim.

</div>

) : (

<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

{claims.map(
(
claim,
index
) => (

<div
key={`${claim.claim}-${index}`}
className="border border-[#222] bg-[#0d0d0d] p-4"
>

<div className="flex flex-wrap items-center gap-3">

<div className="text-sm font-bold text-[#ddd]">

{text(
claim.expectedDirection
)}

</div>

<div className="text-[10px] uppercase tracking-[0.12em] text-[#666]">

{text(
claim.horizonDays
)} DAYS

</div>

<div className="text-[10px] uppercase tracking-[0.12em] text-[#666]">

CONF {number(
claim.confidence
)}%

</div>

</div>


<div className="mt-3 text-xs leading-relaxed text-[#aaa]">

{text(
claim.claim
)}

</div>


<div className="mt-4">

<Label>
Confirmation
</Label>

<div className="mt-1 text-[11px] leading-relaxed text-[#777]">

{text(
claim.confirmationCondition
)}

</div>

</div>


<div className="mt-3">

<Label>
Invalidation
</Label>

<div className="mt-1 text-[11px] leading-relaxed text-[#777]">

{text(
claim.invalidationCondition
)}

</div>

</div>

</div>

)
)}

</div>

)}

</Card>


{/* ===================================================
EXTERNAL RESEARCH
=================================================== */}

<Card
title={`External Research (${sources.length})`}
>

{sources.length === 0 ? (

<div className="text-xs text-[#555]">

No external research sources available.

</div>

) : (

<div className="space-y-3">

{sources
.slice(
0,
10
)
.map(
(
source,
index
) => (

<div
key={`${source.url}-${index}`}
className="border-b border-[#222] pb-3 last:border-b-0 last:pb-0"
>

<div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">

<div className="min-w-0">

{source.url ? (

<a
href={
source.url
}
target="_blank"
rel="noopener noreferrer"
className="text-xs font-semibold leading-relaxed text-[#bbb] transition hover:text-white"
>

{text(
source.title
)}

</a>

) : (

<div className="text-xs font-semibold leading-relaxed text-[#bbb]">

{text(
source.title
)}

</div>

)}


<div className="mt-1 text-[10px] text-[#555]">

{text(
source.publisher,
text(
source.source
)
)}

{" · "}

{formatDate(
source.publishedAt
)}

</div>

</div>


{source.relevance !== undefined && (

<div className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-[#666]">

REL {number(
source.relevance
)}

</div>

)}

</div>

</div>

)
)}

</div>

)}

</Card>


{/* ===================================================
DIAGNOSTICS
=================================================== */}

{(
data?.diagnostics?.warnings?.length ??
0
) > 0 && (

<Card
title="Research Diagnostics"
>

<EvidenceList
items={
data?.diagnostics?.warnings
}
/>

</Card>

)}


{/* ===================================================
REFRESH
=================================================== */}

<div className="flex justify-end">

<button
onClick={loadResearch}
disabled={loading}
className="border border-[#333] bg-[#181818] px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[#777] transition hover:bg-[#222] hover:text-[#aaa] disabled:opacity-50"
>

{loading
? "Refreshing..."
: "Refresh Research"}

</button>

</div>


</div>

);

}
