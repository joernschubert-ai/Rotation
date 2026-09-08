// /components/HistoricalReplayPanel.tsx

"use client";

/* =====================================================
PROPS
===================================================== */

interface Props {
replay: any;
}

/* =====================================================
HELPERS
===================================================== */

function scoreColor(value: number) {
if (value >= 80) {
return "text-emerald-400";
}

if (value >= 60) {
return "text-yellow-400";
}

return "text-red-400";
}

function resultColor(result: string) {
if (result === "PASS") {
return "text-emerald-400";
}

if (result === "PARTIAL") {
return "text-yellow-400";
}

return "text-red-400";
}

function resultBackground(result: string) {
if (result === "PASS") {
return "border-emerald-500/20 bg-emerald-500/10";
}

if (result === "PARTIAL") {
return "border-yellow-500/20 bg-yellow-500/10";
}

return "border-red-500/20 bg-red-500/10";
}

function booleanColor(value: boolean) {
return value
? "text-emerald-400"
: "text-red-400";
}

function warningColor(value: number) {
if (value === 0) {
return "text-emerald-400";
}

if (value <= 2) {
return "text-yellow-400";
}

return "text-red-400";
}

function riskColor(value: number) {
if (value >= 65) {
return "text-red-400";
}

if (value <= 35) {
return "text-emerald-400";
}

return "text-yellow-400";
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

const tests = Array.isArray(replay?.tests)
? replay.tests
: [];

/* =====================================================
RENDER
===================================================== */

return (

<div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">

{/* =====================================================
HEADER
===================================================== */}

<div className="mb-6">

<h2 className="text-xl font-bold text-white sm:text-2xl">
Historical Replay Framework
</h2>

<p className="mt-1 text-sm leading-relaxed text-zinc-400">
Historical validation of market phase, trading mode,
directional signal and risk classification across
institutional market regimes.
</p>

</div>


{/* =====================================================
PRIMARY METRICS
===================================================== */}

<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

<MetricCard
label="Robustness"
value={`${replay.robustnessScore ?? 0}%`}
color={scoreColor(
Number(replay.robustnessScore ?? 0)
)}
/>

<MetricCard
label="Phase Accuracy"
value={`${replay.phaseAccuracy ?? 0}%`}
color={scoreColor(
Number(replay.phaseAccuracy ?? 0)
)}
/>

<MetricCard
label="Mode Accuracy"
value={`${replay.modeAccuracy ?? 0}%`}
color={scoreColor(
Number(replay.modeAccuracy ?? 0)
)}
/>

<MetricCard
label="Signal Accuracy"
value={`${replay.signalAccuracy ?? 0}%`}
color={scoreColor(
Number(replay.signalAccuracy ?? 0)
)}
/>

</div>


{/* =====================================================
SECONDARY METRICS
===================================================== */}

<div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">

<MetricCard
label="Risk Accuracy"
value={`${replay.riskAccuracy ?? 0}%`}
color={scoreColor(
Number(replay.riskAccuracy ?? 0)
)}
/>

<MetricCard
label="PASS"
value={String(replay.passCount ?? 0)}
color="text-emerald-400"
/>

<MetricCard
label="PARTIAL"
value={String(replay.partialCount ?? 0)}
color="text-yellow-400"
/>

<MetricCard
label="FAIL"
value={String(replay.failCount ?? 0)}
color="text-red-400"
/>

</div>


{/* =====================================================
CRITICAL RISK DETECTION
===================================================== */}

<div className="mt-6">

<div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
Critical Risk Detection
</div>

<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

<WarningCard
label="False Defensive"
value={Number(
replay.falseDefensiveStates ?? 0
)}
description="Expected LONG but system became unnecessarily defensive."
/>

<WarningCard
label="Missed Crashes"
value={Number(
replay.missedCrashes ?? 0
)}
description="Expected CRASH but defensive classification was missed."
/>

<WarningCard
label="Late Exits"
value={Number(
replay.lateExits ?? 0
)}
description="Expected RISK while the system remained bullish."
/>

<WarningCard
label="Critical Failures"
value={Number(
replay.criticalFailures ?? 0
)}
description="Risk or crash regime incorrectly produced a CALL signal."
/>

</div>

</div>


{/* =====================================================
SCENARIO OVERVIEW
===================================================== */}

<div className="mt-6">

<div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
Scenario Overview
</div>

<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

<SmallMetricCard
label="Total Scenarios"
value={String(
replay.totalScenarios ?? tests.length
)}
/>

<SmallMetricCard
label="Passed"
value={String(replay.passCount ?? 0)}
color="text-emerald-400"
/>

<SmallMetricCard
label="Partial"
value={String(replay.partialCount ?? 0)}
color="text-yellow-400"
/>

<SmallMetricCard
label="Failed"
value={String(replay.failCount ?? 0)}
color="text-red-400"
/>

</div>

</div>


{/* =====================================================
REPLAY TESTS
===================================================== */}

<div className="mt-6">

{/* =====================================================
HEADER
===================================================== */}

<div className="mb-3 flex items-center justify-between gap-3">

<div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
Replay Tests
</div>

<div className="whitespace-nowrap text-xs text-zinc-600">
{tests.length} scenarios
</div>

</div>


{/* =====================================================
EMPTY
===================================================== */}

{tests.length === 0 && (

<div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-8 text-center text-sm text-zinc-500">
No historical replay data available.
</div>

)}


{/* =====================================================
MOBILE CARDS
===================================================== */}

{tests.length > 0 && (

<div className="space-y-3 xl:hidden">

{tests.map((test: any) => (

<ScenarioCard
key={test.id}
test={test}
/>

))}

</div>

)}


{/* =====================================================
DESKTOP TABLE
===================================================== */}

{tests.length > 0 && (

<div className="hidden xl:block">

<div className="overflow-x-auto rounded-xl border border-zinc-800">

<table className="w-full min-w-[1200px] text-sm">

{/* =============================================
TABLE HEADER
============================================== */}

<thead>

<tr className="border-b border-zinc-800 bg-zinc-950 text-left text-xs uppercase tracking-wider text-zinc-500">

<th className="px-4 py-3">
Date
</th>

<th className="px-4 py-3">
Scenario
</th>

<th className="px-4 py-3">
Expected
</th>

<th className="px-4 py-3">
Actual
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

{tests.map((test: any) => (

<tr
key={test.id}
className="border-b border-zinc-900 transition last:border-b-0 hover:bg-zinc-800/40"
>

{/* DATE */}

<td className="whitespace-nowrap px-4 py-4">

<div className="font-medium text-white">
{test.year ?? "—"}
</div>

<div className="mt-1 text-xs text-zinc-600">
{test.date ?? "—"}
</div>

</td>


{/* SCENARIO */}

<td className="max-w-[260px] px-4 py-4">

<div className="font-medium text-zinc-200">
{test.title ?? test.id}
</div>

<div className="mt-1 text-xs leading-relaxed text-zinc-600">
{test.description ?? "—"}
</div>

</td>


{/* EXPECTED */}

<td className="px-4 py-4">

<ReplayStateBlock
phase={test.expectedPhase}
mode={test.expectedMode}
signal={test.expectedSignal}
muted
/>

</td>


{/* ACTUAL */}

<td className="px-4 py-4">

<ReplayStateBlock
phase={test.actualPhase}
mode={test.actualMode}
signal={test.actualSignal}
/>

</td>


{/* RISK */}

<td className="px-4 py-4">

<div
className={`font-bold ${riskColor(
Number(test.riskScore ?? 50)
)}`}
>
{test.riskScore ?? "—"}
</div>

</td>


{/* MATCHES */}

<td className="px-4 py-4">

<MatchIndicators
test={test}
/>

</td>


{/* RESULT */}

<td className="px-4 py-4">

<ResultBadge
result={test.result}
/>

</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

)}


{/* =====================================================
LEGEND
===================================================== */}

{tests.length > 0 && (

<div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] uppercase tracking-wider text-zinc-600">

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
SCENARIO CARD
MOBILE
===================================================== */

function ScenarioCard({
test,
}: {
test: any;
}) {

const risk =
Number(test?.riskScore ?? 50);


return (

<div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">

{/* =====================================================
HEADER
===================================================== */}

<div className="flex items-start justify-between gap-3">

<div className="min-w-0">

<div className="text-xs text-zinc-600">
{test.year ?? "—"}
{test.date
? ` · ${test.date}`
: ""}
</div>

<div className="mt-1 break-words font-semibold text-white">
{test.title ?? test.id}
</div>

</div>

<ResultBadge
result={test.result}
/>

</div>


{/* =====================================================
DESCRIPTION
===================================================== */}

{test.description && (

<div className="mt-3 text-xs leading-relaxed text-zinc-500">
{test.description}
</div>

)}


{/* =====================================================
EXPECTED / ACTUAL
===================================================== */}

<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

{/* EXPECTED */}

<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">

<div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-600">
Expected
</div>

<ReplayStateBlock
phase={test.expectedPhase}
mode={test.expectedMode}
signal={test.expectedSignal}
muted
/>

</div>


{/* ACTUAL */}

<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">

<div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-600">
Actual
</div>

<ReplayStateBlock
phase={test.actualPhase}
mode={test.actualMode}
signal={test.actualSignal}
/>

</div>

</div>


{/* =====================================================
FOOTER
===================================================== */}

<div className="mt-4 flex flex-col gap-3 border-t border-zinc-800 pt-3 sm:flex-row sm:items-center sm:justify-between">

{/* RISK */}

<div>

<div className="text-[10px] uppercase tracking-wider text-zinc-600">
Risk Score
</div>

<div
className={`mt-1 text-xl font-bold ${riskColor(
risk
)}`}
>
{test.riskScore ?? "—"}
</div>

</div>


{/* MATCHES */}

<div>

<div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-600">
Matches
</div>

<MatchIndicators
test={test}
/>

</div>

</div>

</div>

);

}


/* =====================================================
REPLAY STATE BLOCK
===================================================== */

function ReplayStateBlock({
phase,
mode,
signal,
muted = false,
}: {
phase?: string;
mode?: string;
signal?: string;
muted?: boolean;
}) {

const textColor =
muted
? "text-zinc-500"
: "text-zinc-200";


return (

<div className={`space-y-1 text-xs ${textColor}`}>

<div className="break-words">

<span className="mr-1 text-zinc-600">
Phase:
</span>

{phase ?? "—"}

</div>


<div className="break-words">

<span className="mr-1 text-zinc-600">
Mode:
</span>

{mode ?? "—"}

</div>


<div className="break-words">

<span className="mr-1 text-zinc-600">
Signal:
</span>

{signal ?? "—"}

</div>

</div>

);

}


/* =====================================================
MATCH INDICATORS
===================================================== */

function MatchIndicators({
test,
}: {
test: any;
}) {

return (

<div className="flex items-center gap-3 text-sm">

<MatchItem
label="P"
active={Boolean(test.phaseMatch)}
title="Phase Match"
/>

<MatchItem
label="M"
active={Boolean(test.modeMatch)}
title="Mode Match"
/>

<MatchItem
label="S"
active={Boolean(test.signalMatch)}
title="Signal Match"
/>

<MatchItem
label="R"
active={Boolean(test.riskMatch)}
title="Risk Match"
/>

</div>

);

}


/* =====================================================
MATCH ITEM
===================================================== */

function MatchItem({
label,
active,
title,
}: {
label: string;
active: boolean;
title: string;
}) {

return (

<span
title={title}
className={`font-bold ${booleanColor(active)}`}
>
{label}
</span>

);

}


/* =====================================================
RESULT BADGE
===================================================== */

function ResultBadge({
result,
}: {
result?: string;
}) {

const safeResult =
result ?? "UNKNOWN";


return (

<span
className={`inline-flex shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold ${resultColor(
safeResult
)} ${resultBackground(
safeResult
)}`}
>
{safeResult}
</span>

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

<div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">

<div className="mb-1 truncate text-[10px] uppercase tracking-wider text-zinc-500 sm:text-xs">
{label}
</div>

<div className={`text-2xl font-bold sm:text-3xl ${color}`}>
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

<div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 p-3">

<div className="truncate text-[10px] uppercase tracking-wider text-zinc-600">
{label}
</div>

<div className={`mt-1 text-xl font-bold ${color}`}>
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
warningColor(value);


return (

<div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 p-4">

<div className="text-xs font-medium text-zinc-400">
{label}
</div>

<div className={`mt-1 text-2xl font-bold ${color}`}>
{value}
</div>

{description && (

<div className="mt-2 text-[10px] leading-relaxed text-zinc-600">
{description}
</div>

)}

</div>

);

}
