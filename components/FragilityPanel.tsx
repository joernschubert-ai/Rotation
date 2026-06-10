// /components/panels/FragilityPanel.tsx

"use client";

interface Props {
data: any;
}

export default function FragilityPanel({
data
}: Props) {

const fragility =
data?.fragility ?? {};

const score =
Number(fragility?.score ?? 0);

const state =
fragility?.state ?? "NORMAL";

const concentration =
fragility?.concentrationRisk ?? false;

const correlation =
fragility?.correlationRisk ?? false;

const breadthFailure =
fragility?.breadthFailure ?? false;

/* =====================================================
ENHANCED VISUAL SENSITIVITY
44+ => clearly visible
===================================================== */

const color =
score >= 60
? "text-red-400"
: score >= 44
? "text-orange-400"
: score >= 33
? "text-yellow-300"
: "text-green-400";

const borderColor =
score >= 60
? "border-red-500/60"
: score >= 44
? "border-orange-500/50"
: score >= 30
? "border-yellow-500/40"
: "border-zinc-800";

const bgGlow =
score >= 60
? "bg-red-950/20"
: score >= 44
? "bg-orange-950/20"
: score >= 30
? "bg-yellow-900/10"
: "bg-zinc-900";

const progressColor =
score >= 60
? "bg-red-500"
: score >= 44
? "bg-orange-400"
: score >= 30
? "bg-yellow-400"
: "bg-green-500";

return (

<div
className={`
rounded-2xl
border
p-5
transition-all
duration-300
${borderColor}
${bgGlow}
`}
>

<div className="flex items-center justify-between mb-4">

<h2 className="text-lg font-semibold">
Fragility Engine
</h2>

<div className={`font-bold text-2xl ${color}`}>
{score}
</div>

</div>

{/* =====================================================
PROGRESS BAR
===================================================== */}

<div className="mb-5">

<div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">

<div
className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
style={{
width: `${Math.min(score, 100)}%`
}}
/>

</div>

</div>

{/* =====================================================
STATE BADGE
===================================================== */}

<div className="mb-5">

<div
className={`
inline-flex
items-center
rounded-full
px-3
py-1
text-xs
font-semibold
border

${score >= 60
? "border-red-500/50 bg-red-500/10 text-red-300"
: score >= 44
? "border-orange-500/40 bg-orange-500/10 text-orange-300"
: score >= 30
? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
: "border-green-500/30 bg-green-500/10 text-green-300"
}
`}
>
{state}
</div>

</div>

{/* =====================================================
DETAILS
===================================================== */}

<div className="space-y-2 text-sm">

<Row
label="Concentration"
value={
concentration
? "HIGH"
: "NORMAL"
}
alert={concentration}
/>

<Row
label="Correlation"
value={
correlation
? "ELEVATED"
: "NORMAL"
}
alert={correlation}
/>

<Row
label="Breadth Failure"
value={
breadthFailure
? "YES"
: "NO"
}
alert={breadthFailure}
/>

</div>

{/* =====================================================
WARNING
===================================================== */}

{score >= 44 && (

<div
className={`
mt-5
rounded-xl
border
p-3
text-xs
leading-relaxed

${score >= 60
? "border-red-500/40 bg-red-950/20 text-red-200"
: score >= 58
? "border-orange-500/40 bg-orange-950/20 text-orange-200"
: "border-yellow-500/30 bg-yellow-900/10 text-yellow-100"
}
`}
>

{score >= 60
? "Structural fragility elevated. Market stability deteriorating rapidly."
: score >= 58
? "Fragility rising. Internal market resilience weakening."
: "Early structural fragility emerging beneath index stability."
}

</div>

)}

</div>
);
}

function Row({
label,
value,
alert = false
}: any) {

return (

<div className="flex justify-between items-center">

<span className="text-zinc-400">
{label}
</span>

<span
className={`
font-medium
${alert
? "text-orange-300"
: "text-zinc-100"
}
`}
>
{value}
</span>

</div>
);
}
