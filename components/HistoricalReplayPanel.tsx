// /components/HistoricalReplayPanel.tsx

"use client";


interface Props {
replay: any;
}


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
Historical validation of institutional market
classification across expansion, transition,
breakdown and crash regimes.
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
label="Transition Accuracy"
value={`${replay.transitionAccuracy ?? 0}%`}
color={scoreColor(
Number(
replay.transitionAccuracy ?? 0
)
)}
/>


<MetricCard
label="Crash Accuracy"
value={`${replay.crashAccuracy ?? 0}%`}
color={scoreColor(
Number(
replay.crashAccuracy ?? 0
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
label="Expansion Persistence"
value={`${replay.expansionPersistence ?? 0}%`}
color={scoreColor(
Number(
replay.expansionPersistence ?? 0
)
)}
/>


<MetricCard
label="False Defensive"
value={String(
replay.falseDefensiveStates ?? 0
)}
color={warningColor(
Number(
replay.falseDefensiveStates ?? 0
)
)}
/>


<MetricCard
label="Missed Crashes"
value={String(
replay.missedCrashes ?? 0
)}
color={warningColor(
Number(
replay.missedCrashes ?? 0
)
)}
/>


<MetricCard
label="Late Exits"
value={String(
replay.lateExits ?? 0
)}
color={warningColor(
Number(
replay.lateExits ?? 0
)
)}
/>

</div>


{/* =================================================
STRUCTURAL WARNINGS
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
Structural Warning Detection
</div>


<div
className="
grid
grid-cols-1
gap-3
sm:grid-cols-3
"
>

<WarningCard
label="False Stability"
value={
replay.falseStabilityWarnings ?? 0
}
/>


<WarningCard
label="Liquidity Illusion"
value={
replay.liquidityIllusionWarnings ?? 0
}
/>


<WarningCard
label="Passive Flow Regimes"
value={
replay.passiveFlowWarnings ?? 0
}
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
{tests.length} snapshots
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
min-w-[850px]
w-full
text-sm
"
>

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
Year
</th>

<th className="px-4 py-3">
Regime
</th>

<th className="px-4 py-3">
Classification
</th>

<th className="px-4 py-3">
Result
</th>

<th className="px-4 py-3">
Edge
</th>

<th className="px-4 py-3">
Notes
</th>

</tr>

</thead>


<tbody>

{tests.length === 0 && (

<tr>

<td
colSpan={6}
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

<td
className="
px-4
py-3
font-medium
text-white
"
>
{test.year}
</td>


<td
className="
px-4
py-3
text-zinc-300
"
>
{test.regime}
</td>


<td
className="
px-4
py-3
text-zinc-300
"
>
{test.classification}
</td>


<td
className="
px-4
py-3
"
>

<span
className={
test.result === "PASS"

? "font-semibold text-emerald-400"

: "font-semibold text-red-400"
}
>
{test.result}
</span>

</td>


<td
className="
px-4
py-3
font-medium
text-zinc-200
"
>
{test.edgePersistence}%
</td>


<td
className="
max-w-[320px]
px-4
py-3
text-zinc-500
"
>
{test.notes || "—"}
</td>

</tr>

)
)}

</tbody>

</table>

</div>

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
WARNING CARD
===================================================== */

function WarningCard({
label,
value,
}: {
label: string;
value: number;
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
text-zinc-500
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

</div>

);

}
