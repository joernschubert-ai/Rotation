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


const metrics =
fragility?.metrics ?? {};


/* =====================================================
CORE
===================================================== */

const score =
Number(
fragility?.score ?? 0
);


const state =
fragility?.state ??
"RESILIENT";


const escalation =
Boolean(
fragility?.escalation ?? false
);


const breakdownRisk =
Number(
fragility?.breakdownRisk ?? 0
);


const liquidityFragility =
Number(
fragility?.liquidityFragility ?? 0
);


const liquidityIllusion =
Boolean(
fragility?.liquidityIllusion ?? false
);


const passiveFragility =
Boolean(
fragility?.passiveFragility ?? false
);


const dealerCompression =
Boolean(
fragility?.dealerCompression ?? false
);


const structuralGammaFloor =
Number(
fragility?.structuralGammaFloor ?? 0
);


const effectiveGamma =
Number(
fragility?.effectiveGamma ?? 0
);


const summary =
fragility?.summary ??
"No fragility data available";


/* =====================================================
STRUCTURAL METRICS
===================================================== */

const narrowLeadership =
Boolean(
metrics?.narrowLeadership ?? false
);


const megaCapOnlyTape =
Boolean(
metrics?.megaCapOnlyTape ?? false
);


const weakParticipation =
Number(
metrics?.participationScore ?? 50
) < 48;


const weakBreadth =
Number(
metrics?.breadth50 ?? 50
) < 45;


const failedRotation =
Number(
metrics?.rotationScore ?? 50
) < 35 ||

Number(
metrics?.rotationDecayScore ?? 0
) >= 65;


const persistentErosion =
Boolean(
metrics?.persistentErosion ?? false
);


const acceleratingWeakness =
Boolean(
metrics?.acceleratingWeakness ?? false
);


/* =====================================================
COLORS
===================================================== */

const color =
score >= 82
? "text-red-300"
: score >= 62
? "text-red-400"
: score >= 45
? "text-orange-400"
: score >= 30
? "text-yellow-300"
: "text-green-400";


const borderColor =
score >= 82
? "border-red-500/70"
: score >= 62
? "border-red-500/50"
: score >= 45
? "border-orange-500/50"
: score >= 30
? "border-yellow-500/40"
: "border-zinc-800";


const bgGlow =
score >= 82
? "bg-red-950/40"
: score >= 62
? "bg-red-950/20"
: score >= 45
? "bg-orange-950/20"
: score >= 30
? "bg-yellow-900/10"
: "bg-zinc-900";


const progressColor =
score >= 82
? "bg-red-600"
: score >= 62
? "bg-red-500"
: score >= 45
? "bg-orange-400"
: score >= 30
? "bg-yellow-400"
: "bg-green-500";


/* =====================================================
STATE STYLE
===================================================== */

function getStateStyle() {

switch (state) {

case "BREAKDOWN_RISK":

return {
text: "text-red-200",
border: "border-red-500/60",
bg: "bg-red-500/10"
};


case "STRUCTURALLY_UNSTABLE":

return {
text: "text-red-300",
border: "border-red-500/40",
bg: "bg-red-500/10"
};


case "FRAGILE":

return {
text: "text-orange-300",
border: "border-orange-500/40",
bg: "bg-orange-500/10"
};


case "STRETCHED":

return {
text: "text-yellow-200",
border: "border-yellow-500/40",
bg: "bg-yellow-500/10"
};


default:

return {
text: "text-green-300",
border: "border-green-500/30",
bg: "bg-green-500/10"
};

}

}


const stateStyle =
getStateStyle();



/* =====================================================
RISK COLOR
===================================================== */

function getRiskColor(
value: number
) {

if (value >= 70) {
return "text-red-400";
}

if (value >= 45) {
return "text-orange-400";
}

if (value >= 25) {
return "text-yellow-300";
}

return "text-green-400";

}



/* =====================================================
FLAG COMPONENT
===================================================== */

function Flag({
label,
active,
danger = "orange"
}: {
label: string;
active: boolean;
danger?: "red" | "orange" | "yellow";
}) {


let activeStyle =
"border-orange-500/40 bg-orange-500/10 text-orange-300";


if (danger === "red") {
activeStyle =
"border-red-500/50 bg-red-500/10 text-red-300";
}


if (danger === "yellow") {
activeStyle =
"border-yellow-500/40 bg-yellow-500/10 text-yellow-200";
}


return (

<div
className={`
rounded-lg
border
px-3
py-2
text-xs
font-medium
flex
items-center
justify-between
gap-3
${
active
? activeStyle
: "border-zinc-800 bg-zinc-950 text-zinc-500"
}
`}
>

<span>
{label}
</span>

<span>
{active
? "ACTIVE"
: "NORMAL"}
</span>

</div>

);

}



/* =====================================================
METRIC CARD
===================================================== */

function MetricCard({
label,
value,
valueColor
}: {
label: string;
value: string | number;
valueColor?: string;
}) {

return (

<div
className="
rounded-xl
border
border-zinc-800
bg-zinc-950/70
p-3
min-w-0
"
>

<div
className="
text-[10px]
sm:text-[11px]
uppercase
tracking-wide
text-zinc-500
mb-1
truncate
"
>

{label}

</div>


<div
className={`
text-base
sm:text-lg
font-bold
truncate
${valueColor ?? "text-zinc-100"}
`}
>

{value}

</div>

</div>

);

}



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


{/* =================================================
HEADER
================================================= */}

<div
className="
flex
items-start
justify-between
gap-4
mb-4
"
>

<div className="min-w-0">

<h2
className="
text-base
sm:text-lg
font-semibold
text-zinc-100
"
>

Fragility Engine

</h2>


<div
className="
text-xs
text-zinc-500
mt-1
"
>

Structural market resilience

</div>

</div>


<div
className={`
text-2xl
sm:text-3xl
font-bold
shrink-0
${color}
`}
>

{score}

</div>

</div>



{/* =================================================
PROGRESS BAR
================================================= */}

<div className="mb-4">

<div
className="
flex
justify-between
text-[10px]
uppercase
tracking-wide
text-zinc-500
mb-2
"
>

<span>
Structural Fragility
</span>

<span>
{Math.min(
Math.max(score, 0),
100
)}%
</span>

</div>


<div
className="
w-full
h-2.5
rounded-full
bg-zinc-800
overflow-hidden
"
>

<div
className={`
h-full
rounded-full
transition-all
duration-500
${progressColor}
`}
style={{
width: `${
Math.min(
Math.max(score, 0),
100
)
}%`
}}
/>

</div>

</div>



{/* =================================================
STATE
================================================= */}

<div className="mb-5">

<div
className={`
inline-flex
items-center
rounded-full
border
px-3
py-1.5
text-xs
font-semibold
${stateStyle.text}
${stateStyle.border}
${stateStyle.bg}
`}
>

{state}

</div>

</div>



{/* =================================================
PRIMARY RISK METRICS
================================================= */}

<div
className="
grid
grid-cols-2
lg:grid-cols-3
gap-2
sm:gap-3
mb-5
"
>

<MetricCard
label="Breakdown Risk"
value={breakdownRisk}
valueColor={
getRiskColor(
breakdownRisk
)
}
/>


<MetricCard
label="Liquidity Fragility"
value={liquidityFragility}
valueColor={
getRiskColor(
liquidityFragility
)
}
/>


<MetricCard
label="Effective Gamma"
value={
effectiveGamma.toFixed(1)
}
valueColor={
effectiveGamma >= 35
? "text-yellow-300"
: effectiveGamma < 0
? "text-red-400"
: "text-zinc-100"
}
/>

</div>



{/* =================================================
STRUCTURAL FLAGS
================================================= */}

<div className="mb-5">

<div
className="
text-[10px]
sm:text-xs
uppercase
tracking-wider
text-zinc-500
mb-2
"
>

Structural Flags

</div>


<div
className="
grid
grid-cols-1
sm:grid-cols-2
gap-2
"
>

<Flag
label="Narrow Leadership"
active={narrowLeadership}
danger="orange"
/>


<Flag
label="Mega-Cap Concentration"
active={megaCapOnlyTape}
danger="red"
/>


<Flag
label="Weak Participation"
active={weakParticipation}
danger="orange"
/>


<Flag
label="Breadth Failure"
active={weakBreadth}
danger="red"
/>


<Flag
label="Failed Rotation"
active={failedRotation}
danger="red"
/>


<Flag
label="Persistent Erosion"
active={persistentErosion}
danger="red"
/>


<Flag
label="Accelerating Weakness"
active={acceleratingWeakness}
danger="orange"
/>


<Flag
label="Liquidity Illusion"
active={liquidityIllusion}
danger="red"
/>


<Flag
label="Passive Fragility"
active={passiveFragility}
danger="orange"
/>


<Flag
label="Dealer Compression"
active={dealerCompression}
danger="yellow"
/>

</div>

</div>



{/* =================================================
SUMMARY
================================================= */}

<div
className="
rounded-xl
border
border-zinc-800
bg-zinc-950/70
p-3
sm:p-4
text-xs
sm:text-sm
leading-relaxed
text-zinc-300
"
>

{summary}

</div>



{/* =================================================
ESCALATION WARNING
================================================= */}

{escalation && (

<div
className="
mt-4
rounded-xl
border
border-red-500/50
bg-red-950/30
p-3
sm:p-4
"
>

<div
className="
text-xs
font-bold
uppercase
tracking-wide
text-red-300
mb-1
"
>

Escalation Active

</div>


<div
className="
text-xs
sm:text-sm
leading-relaxed
text-red-100
"
>

Multiple structural conditions are confirming
elevated breakdown risk. Market stability should
not be interpreted solely from index performance.

</div>

</div>

)}



{/* =================================================
DIAGNOSTIC FOOTER
================================================= */}

<div
className="
mt-4
pt-3
border-t
border-zinc-800
grid
grid-cols-2
sm:grid-cols-4
gap-2
text-[10px]
sm:text-xs
"
>

<Diagnostic
label="VIX"
value={
Number(
metrics?.vix ?? 0
).toFixed(1)
}
/>


<Diagnostic
label="Breadth 50"
value={`${
Number(
metrics?.breadth50 ?? 0
).toFixed(0)
}%`}
/>


<Diagnostic
label="Participation"
value={
Number(
metrics?.participationScore ?? 0
).toFixed(0)
}
/>


<Diagnostic
label="Gamma Floor"
value={
structuralGammaFloor.toFixed(0)
}
/>

</div>


</div>

);

}



/* =====================================================
DIAGNOSTIC
===================================================== */

function Diagnostic({
label,
value
}: {
label: string;
value: string | number;
}) {

return (

<div
className="
flex
flex-col
gap-1
min-w-0
"
>

<span
className="
uppercase
tracking-wide
text-zinc-600
truncate
"
>

{label}

</span>


<span
className="
font-semibold
text-zinc-300
truncate
"
>

{value}

</span>

</div>

);

}
