// /components/HistoricalReplayPanel.tsx

"use client";


/* =====================================================
PROPS
===================================================== */

interface Props {
replay: any;
}


/* =====================================================
COMPONENT
===================================================== */

export default function HistoricalReplayPanel({
replay,
}: Props) {


/* =====================================================
SAFETY
===================================================== */

if (!replay) {

return null;

}


const tests =
Array.isArray(replay?.tests)
? replay.tests
: [];


/* =====================================================
HELPERS
===================================================== */

function scoreColor(
value: number
) {

if (value >= 80) {

return "text-emerald-400";

}

if (value >= 60) {

return "text-yellow-400";

}

return "text-red-400";

}


function warningColor(
value: number
) {

if (value === 0) {

return "text-emerald-400";

}

if (value <= 2) {

return "text-yellow-400";

}

return "text-red-400";

}


function resultColor(
result: string
) {

if (result === "PASS") {

return "text-emerald-400";

}

if (result === "PARTIAL") {

return "text-yellow-400";

}

return "text-red-400";

}


function resultBackground(
result: string
) {

if (result === "PASS") {

return "bg-emerald-500/10 border-emerald-500/20";

}

if (result === "PARTIAL") {

return "bg-yellow-500/10 border-yellow-500/20";

}

return "bg-red-500/10 border-red-500/20";

}


function booleanIndicator(
value: boolean
) {

return value
? "✓"
: "✕";

}


function booleanColor(
value: boolean
) {

return value
? "text-emerald-400"
: "text-red-400";

}


/* =====================================================
RENDER
===================================================== */

return (

<div
className="
rounded-2xl
border
border-zinc-800
bg-zinc-900
p-4
sm:p-5
"
>


{/* =================================================
HEADER
================================================= */}

<div className="mb-6">

<h2
className="
text-xl
font-bold
text-white
sm:text-2xl
"
>

Historical Replay Framework

</h2>


<p
className="
mt-1
text-sm
text-zinc-400
"
>

Historical validation of market phase,
trading mode, directional signal and
risk classification across institutional
market regimes.

</p>

</div>


{/* =================================================
PRIMARY METRICS
================================================= */}

<div
className="
grid
grid-cols-2
gap-3
sm:grid-cols-4
"
>

<MetricCard
label="Robustness"
value={`${replay.robustnessScore ?? 0}%`}
color={scoreColor(
Number(
replay.robustnessScore ?? 0
)
)}
/>


<MetricCard
label="Phase Accuracy"
value={`${replay.phaseAccuracy ?? 0}%`}
color={scoreColor(
Number(
replay.phaseAccuracy ?? 0
)
)}
/>


<MetricCard
label="Mode Accuracy"
value={`${replay.modeAccuracy ?? 0}%`}
color={scoreColor(
Number(
replay.modeAccuracy ?? 0
)
)}
/>


<MetricCard
label="Signal Accuracy"
value={`${replay.signalAccuracy ?? 0}%`}
color={scoreColor(
Number(
replay.signalAccuracy ?? 0
)
)}
/>

</div>


{/* =================================================
SECONDARY METRICS
================================================= */}

<div
className="
mt-4
grid
grid-cols-2
gap-3
lg:grid-cols-4
"
>

<MetricCard
label="Risk Accuracy"
value={`${replay.riskAccuracy ?? 0}%`}
color={scoreColor(
Number(
replay.riskAccuracy ?? 0
)
)}
/>


<MetricCard
label="PASS"
value={String(
replay.passCount ?? 0
)}
color="text-emerald-400"
/>


<MetricCard
label="PARTIAL"
value={String(
replay.partialCount ?? 0
)}
color="text-yellow-400"
/>


<MetricCard
label="FAIL"
value={String(
replay.failCount ?? 0
)}
color="text-red-400"
/>

</div>


{/* =================================================
CRITICAL RISK DETECTION
================================================= */}

<div className="mt-6">


<div
className="
mb-3
text-xs
font-semibold
uppercase
tracking-wider
text-zinc-500
"
>

Critical Risk Detection

</div>


<div
className="
grid
grid-cols-1
gap-3
sm:grid-cols-2
xl:grid-cols-4
"
>

<WarningCard
label="False Defensive"
value={
Number(
replay.falseDefensiveStates ?? 0
)
}
description="
Expected LONG but system became
unnecessarily defensive.
"
/>


<WarningCard
label="Missed Crashes"
value={
Number(
replay.missedCrashes ?? 0
)
}
description="
Expected CRASH but defensive
classification was missed.
"
/>


<WarningCard
label="Late Exits"
value={
Number(
replay.lateExits ?? 0
)
}
description="
Expected RISK while the system
remained bullish.
"
/>


<WarningCard
label="Critical Failures"
value={
Number(
replay.criticalFailures ?? 0
)
}
description="
Risk or crash regime incorrectly
produced a CALL signal.
"
/>

</div>

</div>


{/* =================================================
SCENARIO OVERVIEW
================================================= */}

<div className="mt-6">


<div
className="
mb-3
text-xs
font-semibold
uppercase
tracking-wider
text-zinc-500
"
>

Scenario Overview

</div>


<div
className="
grid
grid-cols-2
gap-3
sm:grid-cols-4
"
>

<SmallMetricCard
label="Total Scenarios"
value={String(
replay.totalScenarios ??
tests.length
)}
/>


<SmallMetricCard
label="Passed"
value={String(
replay.passCount ?? 0
)}
color="text-emerald-400"
/>


<SmallMetricCard
label="Partial"
value={String(
replay.partialCount ?? 0
)}
color="text-yellow-400"
/>


<SmallMetricCard
label="Failed"
value={String(
replay.failCount ?? 0
)}
color="text-red-400"
/>

</div>

</div>


{/* =================================================
TABLE
================================================= */}

<div className="mt-6">


<div
className="
mb-3
flex
items-center
justify-between
"
>

<div
className="
text-xs
font-semibold
uppercase
tracking-wider
text-zinc-500
"
>

Replay Tests

</div>


<div
className="
text-xs
text-zinc-600
"
>

{tests.length} scenarios

</div>

</div>


<div
className="
overflow-x-auto
rounded-xl
border
border-zinc-800
"
>

<table
className="
min-w-[1450px]
w-full
text-sm
"
>


{/* =============================================
TABLE HEADER
============================================== */}

<thead>

<tr
className="
border-b
border-zinc-800
bg-zinc-950
text-left
text-xs
uppercase
tracking-wider
text-zinc-500
"
>

<th className="px-4 py-3">

Date

</th>


<th className="px-4 py-3">

Scenario

</th>


<th className="px-4 py-3">

Expected Phase

</th>


<th className="px-4 py-3">

Actual Phase

</th>


<th className="px-4 py-3">

Expected Mode

</th>


<th className="px-4 py-3">

Actual Mode

</th>


<th className="px-4 py-3">

Expected Signal

</th>


<th className="px-4 py-3">

Actual Signal

</th>


<th className="px-4 py-3">

Risk

</th>


<th className="px-4 py-3">

Matches

</th>


<th className="px-4 py-3">

Result

</th>

</tr>

</thead>


{/* =============================================
TABLE BODY
============================================== */}

<tbody>


{/* =============================================
EMPTY
============================================== */}

{tests.length === 0 && (

<tr>

<td
colSpan={11}
className="
px-4
py-8
text-center
text-zinc-500
"
>

No historical replay data available.

</td>

</tr>

)}


{/* =============================================
TESTS
============================================== */}

{tests.map(
(test: any) => (

<tr
key={test.id}
className="
border-b
border-zinc-900
transition
hover:bg-zinc-800/40
last:border-b-0
"
>


{/* DATE */}

<td
className="
whitespace-nowrap
px-4
py-3
text-zinc-300
"
>

<div
className="
font-medium
text-white
"
>

{test.year}

</div>


<div
className="
text-xs
text-zinc-600
"
>

{test.date ?? "—"}

</div>

</td>


{/* SCENARIO */}

<td
className="
max-w-[240px]
px-4
py-3
"
>

<div
className="
font-medium
text-zinc-200
"
>

{test.title ?? test.id}

</div>


<div
className="
mt-1
max-w-[240px]
truncate
text-xs
text-zinc-600
"
>

{test.description ?? "—"}

</div>

</td>


{/* EXPECTED PHASE */}

<td
className="
px-4
py-3
text-zinc-400
"
>

{test.expectedPhase ?? "—"}

</td>


{/* ACTUAL PHASE */}

<td
className="
px-4
py-3
text-zinc-200
"
>

{test.actualPhase ?? "—"}

</td>


{/* EXPECTED MODE */}

<td
className="
px-4
py-3
text-zinc-400
"
>

{test.expectedMode ?? "—"}

</td>


{/* ACTUAL MODE */}

<td
className="
px-4
py-3
text-zinc-200
"
>

{test.actualMode ?? "—"}

</td>


{/* EXPECTED SIGNAL */}

<td
className="
px-4
py-3
text-zinc-400
"
>

{test.expectedSignal ?? "—"}

</td>


{/* ACTUAL SIGNAL */}

<td
className="
px-4
py-3
font-medium
text-zinc-200
"
>

{test.actualSignal ?? "—"}

</td>


{/* RISK */}

<td
className="
px-4
py-3
"
>

<span
className={
Number(
test.riskScore ?? 50
) >= 65
? "font-semibold text-red-400"
: Number(
test.riskScore ?? 50
) <= 35
? "font-semibold text-emerald-400"
: "font-semibold text-yellow-400"
}
>

{test.riskScore ?? "—"}

</span>

</td>


{/* MATCHES */}

<td
className="
px-4
py-3
"
>

<div
className="
flex
gap-2
text-sm
"
>

<span
className={
booleanColor(
Boolean(
test.phaseMatch
)
)
}
title="Phase Match"
>

P

</span>


<span
className={
booleanColor(
Boolean(
test.modeMatch
)
)
}
title="Mode Match"
>

M

</span>


<span
className={
booleanColor(
Boolean(
test.signalMatch
)
)
}
title="Signal Match"
>

S

</span>


<span
className={
booleanColor(
Boolean(
test.riskMatch
)
)
}
title="Risk Match"
>

R

</span>

</div>

</td>


{/* RESULT */}

<td
className="
px-4
py-3
"
>

<span
className={`
inline-flex
rounded-lg
border
px-2
py-1
text-xs
font-bold
${resultColor(
test.result
)}
${resultBackground(
test.result
)}
`}
>

{test.result ?? "UNKNOWN"}

</span>

</td>

</tr>

)
)}

</tbody>

</table>

</div>


{/* =================================================
MATCH LEGEND
================================================= */}

{tests.length > 0 && (

<div
className="
mt-3
flex
flex-wrap
gap-4
text-[10px]
uppercase
tracking-wider
text-zinc-600
"
>

<span>

P = Phase Match

</span>


<span>

M = Mode Match

</span>


<span>

S = Signal Match

</span>


<span>

R = Risk Match

</span>

</div>

)}

</div>

</div>

);

}


/* =====================================================
METRIC CARD
===================================================== */

function MetricCard({
label,
value,
color,
}: {
label: string;
value: string;
color: string;
}) {

return (

<div
className="
rounded-xl
border
border-zinc-800
bg-zinc-950
p-3
sm:p-4
"
>

<div
className="
mb-1
text-[10px]
uppercase
tracking-wider
text-zinc-500
sm:text-xs
"
>

{label}

</div>


<div
className={`
text-2xl
font-bold
sm:text-3xl
${color}
`}
>

{value}

</div>

</div>

);

}


/* =====================================================
SMALL METRIC CARD
===================================================== */

function SmallMetricCard({
label,
value,
color = "text-white",
}: {
label: string;
value: string;
color?: string;
}) {

return (

<div
className="
rounded-xl
border
border-zinc-800
bg-zinc-950
p-3
"
>

<div
className="
text-[10px]
uppercase
tracking-wider
text-zinc-600
"
>

{label}

</div>


<div
className={`
mt-1
text-xl
font-bold
${color}
`}
>

{value}

</div>

</div>

);

}


/* =====================================================
WARNING CARD
===================================================== */

function WarningCard({
label,
value,
description,
}: {
label: string;
value: number;
description?: string;
}) {


const color =
value === 0
? "text-emerald-400"
: value <= 2
? "text-yellow-400"
: "text-red-400";


return (

<div
className="
rounded-xl
border
border-zinc-800
bg-zinc-950
p-4
"
>

<div
className="
text-xs
font-medium
text-zinc-400
"
>

{label}

</div>


<div
className={`
mt-1
text-2xl
font-bold
${color}
`}
>

{value}

</div>


{description && (

<div
className="
mt-2
text-[10px]
leading-relaxed
text-zinc-600
"
>

{description}

</div>

)}

</div>

);

}
