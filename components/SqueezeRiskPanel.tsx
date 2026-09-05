// /components/panels/SqueezeRiskPanel.tsx

"use client";


/* =====================================================
PROPS
===================================================== */

interface Props {
data: any;
}


/* =====================================================
HELPERS
===================================================== */

function clamp(
value: number,
min = 0,
max = 100
) {

return Math.max(
min,
Math.min(max, value)
);

}


function MetricRow({
label,
value,
tone = "neutral"
}: {
label: string;
value: string | number;
tone?: "neutral" | "good" | "warning" | "danger";
}) {

const toneClass = {

neutral:
"text-zinc-100",

good:
"text-green-300",

warning:
"text-yellow-300",

danger:
"text-red-300"

}[tone];


return (

<div className="flex items-center justify-between gap-3 py-1.5">

<span className="min-w-0 text-zinc-400">
{label}
</span>

<span
className={`shrink-0 text-right font-medium ${toneClass}`}
>
{value}
</span>

</div>

);

}


/* =====================================================
COMPONENT
===================================================== */

export default function SqueezeRiskPanel({
data
}: Props) {


/* =====================================================
DATA
===================================================== */

const squeeze =
data?.squeeze ?? {};


const metrics =
squeeze?.metrics ?? {};


/* =====================================================
CORE
===================================================== */

const score =
clamp(
Number(
squeeze?.risk ?? 0
)
);


const state =
squeeze?.state ??
"LOW";


const squeezeType =
squeeze?.squeezeType ??
"NONE";


const instability =
clamp(
Number(
squeeze?.instability ?? 0
)
);


/* =====================================================
STRUCTURAL DATA
===================================================== */

const rawGamma =
Number(
metrics?.gamma ?? 0
);


const effectiveGamma =
Number(
squeeze?.effectiveGamma ??
metrics?.effectiveGamma ??
0
);


const structuralGammaFloor =
Number(
squeeze?.structuralGammaFloor ??
metrics?.structuralGammaFloor ??
0
);


const passiveGammaCompression =
clamp(
Number(
squeeze?.passiveGammaCompression ??
metrics?.passiveGammaCompression ??
0
)
);


const dealerCompression =
clamp(
Number(
squeeze?.dealerCompression ??
metrics?.dealerCompression ??
0
)
);


const passiveFlowRisk =
clamp(
Number(
squeeze?.passiveFlowRisk ??
metrics?.passiveFlowRisk ??
0
)
);


const volSuppression =
clamp(
Number(
squeeze?.volSuppression ??
metrics?.volSuppression ??
0
)
);


/* =====================================================
MARKET CONDITIONS
===================================================== */

const vix =
Number(
metrics?.vix ?? 0
);


const breadth50 =
Number(
metrics?.breadth50 ?? 50
);


const participation =
Number(
metrics?.participationScore ?? 50
);


const narrowLeadership =
Boolean(
squeeze?.narrowLeadership ??
metrics?.narrowLeadership ??
false
);


const weakBreadth =
Boolean(
squeeze?.weakBreadth ??
metrics?.weakBreadth ??
false
);


const weakParticipation =
Boolean(
squeeze?.weakParticipation ??
metrics?.weakParticipation ??
false
);


/* =====================================================
VISUAL STATE
===================================================== */

const color =

score >= 80
? "text-red-300"

: score >= 60
? "text-red-400"

: score >= 35
? "text-yellow-300"

: "text-green-400";


const borderColor =

score >= 80
? "border-red-500/70"

: score >= 60
? "border-red-500/50"

: score >= 35
? "border-yellow-500/40"

: "border-zinc-800";


const bgGlow =

score >= 80
? "bg-red-950/30"

: score >= 60
? "bg-red-950/20"

: score >= 35
? "bg-yellow-950/15"

: "bg-zinc-900";


const progressColor =

score >= 80
? "bg-red-400"

: score >= 60
? "bg-red-500"

: score >= 35
? "bg-yellow-400"

: "bg-green-500";


/* =====================================================
TYPE BADGE
===================================================== */

const typeTone =

squeezeType === "PASSIVE_FLOW_SQUEEZE"
? "border-purple-500/40 bg-purple-500/10 text-purple-200"

: squeezeType === "SHORT_SQUEEZE"
? "border-orange-500/40 bg-orange-500/10 text-orange-200"

: squeezeType === "LIQUIDITY_SQUEEZE"
? "border-red-500/40 bg-red-500/10 text-red-200"

: squeezeType === "VOL_SQUEEZE"
? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"

: "border-zinc-700 bg-zinc-800 text-zinc-300";


/* =====================================================
INSTABILITY TONE
===================================================== */

const instabilityTone =

instability >= 75
? "danger"

: instability >= 50
? "warning"

: instability >= 30
? "neutral"

: "good";


/* =====================================================
GAMMA STATUS
===================================================== */

const gammaStatus =

rawGamma < 0
? "NEGATIVE"

: structuralGammaFloor > 0
? "STRUCTURAL"

: effectiveGamma > 0
? "POSITIVE"

: "NEUTRAL";


const gammaTone =

rawGamma < 0
? "danger"

: passiveGammaCompression >= 65
? "warning"

: "neutral";


/* =====================================================
SUMMARY
===================================================== */

const summary =
squeeze?.summary ??
"Positioning environment stable";


/* =====================================================
RENDER
===================================================== */

return (

<div
className={`
rounded-2xl
border
p-4
sm:p-5
transition-all
duration-300
${borderColor}
${bgGlow}
`}
>


{/* ===================================================
HEADER
=================================================== */}

<div className="mb-4 flex items-start justify-between gap-4">

<div className="min-w-0">

<h2 className="text-base font-semibold sm:text-lg">

Squeeze Risk

</h2>

<p className="mt-1 text-xs leading-relaxed text-zinc-500">

Positioning & compression risk

</p>

</div>


<div className="shrink-0 text-right">

<div
className={`
text-2xl
font-bold
sm:text-3xl
${color}
`}
>

{score}

</div>

<div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">

Risk Score

</div>

</div>

</div>


{/* ===================================================
PROGRESS BAR
=================================================== */}

<div className="mb-4">

<div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-zinc-500">

<span>
Low
</span>

<span>
Extreme
</span>

</div>


<div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">

<div
className={`
h-full
rounded-full
transition-all
duration-500
${progressColor}
`}
style={{
width: `${score}%`
}}
/>

</div>

</div>


{/* ===================================================
STATE / TYPE
=================================================== */}

<div className="mb-5 flex flex-wrap gap-2">

<div
className={`
inline-flex
items-center
rounded-full
border
px-3
py-1
text-xs
font-semibold

${score >= 80
? "border-red-500/50 bg-red-500/10 text-red-200"

: score >= 60
? "border-red-500/40 bg-red-500/10 text-red-300"

: score >= 35
? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"

: "border-green-500/30 bg-green-500/10 text-green-300"
}
`}
>

{state}

</div>


<div
className={`
inline-flex
items-center
rounded-full
border
px-3
py-1
text-xs
font-semibold
${typeTone}
`}
>

{squeezeType}

</div>

</div>


{/* ===================================================
PRIMARY DIAGNOSTICS
=================================================== */}

<div className="mb-5 rounded-xl border border-zinc-800/80 bg-black/10 p-3">

<div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">

Primary Diagnostics

</div>


<MetricRow
label="Instability"
value={instability}
tone={instabilityTone}
/>


<MetricRow
label="Gamma Regime"
value={gammaStatus}
tone={gammaTone}
/>


<MetricRow
label="Effective Gamma"
value={effectiveGamma.toFixed(1)}
tone={
rawGamma < 0
? "danger"
: "neutral"
}
/>


<MetricRow
label="VIX"
value={vix.toFixed(1)}
tone={
vix > 30
? "danger"
: vix > 22
? "warning"
: "neutral"
}
/>

</div>


{/* ===================================================
COMPRESSION GRID
=================================================== */}

<div className="mb-5">

<div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">

Structural Compression

</div>


<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">


<DiagnosticCard
label="Passive Gamma"
value={passiveGammaCompression}
danger={passiveGammaCompression >= 70}
warning={
passiveGammaCompression >= 45
}
/>


<DiagnosticCard
label="Dealer Compression"
value={dealerCompression}
danger={dealerCompression >= 70}
warning={
dealerCompression >= 45
}
/>


<DiagnosticCard
label="Passive Flow Risk"
value={passiveFlowRisk}
danger={passiveFlowRisk >= 70}
warning={
passiveFlowRisk >= 45
}
/>


<DiagnosticCard
label="Vol Suppression"
value={volSuppression}
danger={volSuppression >= 70}
warning={
volSuppression >= 45
}
/>

</div>

</div>


{/* ===================================================
MARKET INTERNALS
=================================================== */}

<div className="mb-5 rounded-xl border border-zinc-800/80 bg-black/10 p-3">

<div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">

Market Internals

</div>


<MetricRow
label="Breadth 50"
value={`${breadth50.toFixed(1)}%`}
tone={
breadth50 < 45
? "danger"
: breadth50 < 58
? "warning"
: "good"
}
/>


<MetricRow
label="Participation"
value={participation.toFixed(0)}
tone={
participation < 42
? "danger"
: participation < 50
? "warning"
: "good"
}
/>


<MetricRow
label="Leadership"
value={
narrowLeadership
? "NARROW"
: "BROAD"
}
tone={
narrowLeadership
? "warning"
: "good"
}
/>


<MetricRow
label="Weak Breadth"
value={
weakBreadth
? "YES"
: "NO"
}
tone={
weakBreadth
? "warning"
: "good"
}
/>


<MetricRow
label="Weak Participation"
value={
weakParticipation
? "YES"
: "NO"
}
tone={
weakParticipation
? "warning"
: "good"
}
/>

</div>


{/* ===================================================
STRUCTURAL GAMMA FLOOR
=================================================== */}

{structuralGammaFloor > 0 && (

<div className="mb-5 rounded-xl border border-purple-500/20 bg-purple-950/10 p-3">

<div className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/70">

Structural Gamma Floor

</div>


<div className="mt-1 text-lg font-semibold text-purple-200">

{structuralGammaFloor.toFixed(0)}

</div>


<p className="mt-1 text-xs leading-relaxed text-zinc-400">

Structural gamma support may suppress volatility
without indicating healthy market internals.

</p>

</div>

)}


{/* ===================================================
WARNING
=================================================== */}

{score >= 35 && (

<div
className={`
rounded-xl
border
p-3
text-xs
leading-relaxed

${score >= 80
? "border-red-500/50 bg-red-950/30 text-red-100"

: score >= 60
? "border-red-500/35 bg-red-950/20 text-red-200"

: "border-yellow-500/30 bg-yellow-950/15 text-yellow-100"
}
`}
>

<strong className="font-semibold">

{score >= 80
? "Extreme positioning instability."

: score >= 60
? "High squeeze risk."

: "Compression risk elevated."
}

</strong>

<span className="ml-1">

{squeezeType === "PASSIVE_FLOW_SQUEEZE"
? "Market stability may depend increasingly on passive flows and compressed positioning."

: squeezeType === "SHORT_SQUEEZE"
? "Negative gamma and short positioning increase forced-move risk."

: squeezeType === "LIQUIDITY_SQUEEZE"
? "Weak breadth and positioning deterioration increase liquidity instability."

: "Internal compression should be monitored for reflexive market moves."
}

</span>

</div>

)}


{/* ===================================================
SUMMARY
=================================================== */}

<div className="mt-4 border-t border-zinc-800 pt-3">

<div className="text-xs leading-relaxed text-zinc-400">

{summary}

</div>

</div>

</div>

);

}


/* =====================================================
DIAGNOSTIC CARD
===================================================== */

function DiagnosticCard({
label,
value,
danger,
warning
}: {
label: string;
value: number;
danger: boolean;
warning: boolean;
}) {


const valueClass =

danger
? "text-red-300"

: warning
? "text-yellow-300"

: "text-green-300";


const barClass =

danger
? "bg-red-500"

: warning
? "bg-yellow-400"

: "bg-green-500";


return (

<div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">

<div className="mb-2 flex items-center justify-between gap-2">

<span className="text-xs text-zinc-400">

{label}

</span>


<span
className={`
text-sm
font-semibold
${valueClass}
`}
>

{value}

</span>

</div>


<div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">

<div
className={`
h-full
rounded-full
transition-all
duration-500
${barClass}
`}
style={{
width: `${value}%`
}}
/>

</div>

</div>

);

}
