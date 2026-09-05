// /components/panels/BreadthThrustPanel.tsx

"use client";


interface Props {
data: any;
}


/* =====================================================
COMPONENT
===================================================== */

export default function BreadthThrustPanel({
data
}: Props) {


/* ===================================================
DATA
=================================================== */

const thrust =
data?.breadthThrust ??
{};


const metrics =
thrust?.metrics ??
{};


const score =
Number(
thrust?.score ??
0
);


const state =
thrust?.state ??
"FRAGILE";


const thrustState =
thrust?.thrust ??
"WEAK";


const participation =
Number(
thrust?.participation ??
50
);


const sustainability =
Number(
thrust?.sustainability ??
50
);


const leadershipBreadth =
Number(
thrust?.leadershipBreadth ??
50
);


const passiveDependence =
Number(
thrust?.passiveDependence ??
0
);


const institutionalParticipation =
Number(
thrust?.institutionalParticipation ??
50
);


const summary =
thrust?.summary ??
"Breadth data unavailable";


/* ===================================================
STRUCTURAL FLAGS
=================================================== */

const narrowLeadership =
Boolean(
metrics?.narrowLeadership ??
false
);


const severeNarrowLeadership =
Boolean(
metrics?.severeNarrowLeadership ??
false
);


const breadthFailure =
Boolean(
metrics?.breadthFailure ??
false
);


const bearishDivergence =
Boolean(
metrics?.bearishDivergence ??
false
);


const volumeConfirmation =
Boolean(
metrics?.volumeConfirmation ??
false
);


/* ===================================================
SCORE COLORS
=================================================== */

const color =
score >= 72
? "text-green-400"
: score >= 55
? "text-emerald-300"
: score >= 35
? "text-yellow-300"
: "text-red-400";


const borderColor =
score >= 72
? "border-green-500/40"
: score >= 55
? "border-emerald-500/30"
: score >= 35
? "border-yellow-500/40"
: "border-red-500/50";


const bgGlow =
score >= 72
? "bg-green-950/10"
: score >= 55
? "bg-emerald-950/10"
: score >= 35
? "bg-yellow-950/10"
: "bg-red-950/20";


const progressColor =
score >= 72
? "bg-green-500"
: score >= 55
? "bg-emerald-400"
: score >= 35
? "bg-yellow-400"
: "bg-red-500";


/* ===================================================
THRUST COLOR
=================================================== */

const thrustColor =
thrustState === "STRONG"
? "text-green-400"
: thrustState === "MODERATE"
? "text-emerald-300"
: thrustState === "WEAK"
? "text-yellow-300"
: "text-red-400";


/* ===================================================
STATE COLOR
=================================================== */

const stateClass =
state === "EXPANSION"
? "border-green-500/40 bg-green-500/10 text-green-300"
: state === "ROTATION"
? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
: state === "FRAGILE"
? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
: "border-red-500/50 bg-red-500/10 text-red-300";


/* ===================================================
RENDER
=================================================== */

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

<div>

<h2 className="text-lg font-semibold">

Breadth Thrust

</h2>

<div className="mt-1 text-xs text-zinc-500">

Institutional breadth confirmation

</div>

</div>


<div className="text-right">

<div
className={`
text-2xl
sm:text-3xl
font-bold
${color}
`}
>

{score}

</div>

<div className="text-[10px] uppercase tracking-wider text-zinc-500">

SCORE

</div>

</div>

</div>


{/* =================================================
PROGRESS
================================================= */}

<div className="mb-5">

<div
className="
h-2
w-full
overflow-hidden
rounded-full
bg-zinc-800
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
width: `${Math.min(
Math.max(score, 0),
100
)}%`
}}
/>

</div>

</div>


{/* =================================================
STATE
================================================= */}

<div
className="
flex
flex-wrap
items-center
gap-2
mb-5
"
>

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
${stateClass}
`}
>

{state}

</div>


<div
className={`
inline-flex
items-center
rounded-full
px-3
py-1
text-xs
font-semibold
bg-zinc-950/50
border
border-zinc-800
${thrustColor}
`}
>

THRUST: {thrustState}

</div>

</div>


{/* =================================================
PRIMARY METRICS
================================================= */}

<div
className="
grid
grid-cols-2
gap-3
mb-5
"
>

<MetricCard
label="Participation"
value={participation}
good={participation >= 60}
warning={
participation >= 45 &&
participation < 60
}
/>


<MetricCard
label="Sustainability"
value={sustainability}
good={sustainability >= 60}
warning={
sustainability >= 45 &&
sustainability < 60
}
/>


<MetricCard
label="Institutional"
value={institutionalParticipation}
good={institutionalParticipation >= 60}
warning={
institutionalParticipation >= 45 &&
institutionalParticipation < 60
}
/>


<MetricCard
label="Leadership Breadth"
value={leadershipBreadth}
good={leadershipBreadth >= 60}
warning={
leadershipBreadth >= 45 &&
leadershipBreadth < 60
}
/>

</div>


{/* =================================================
STRUCTURAL DETAILS
================================================= */}

<div
className="
space-y-2
text-sm
border-t
border-zinc-800/80
pt-4
"
>

<Row
label="Passive Dependence"
value={`${passiveDependence}`}
alert={passiveDependence >= 65}
warning={
passiveDependence >= 45 &&
passiveDependence < 65
}
/>


<Row
label="Volume Confirmation"
value={
volumeConfirmation
? "CONFIRMED"
: "WEAK"
}
positive={volumeConfirmation}
warning={!volumeConfirmation}
/>


<Row
label="Leadership"
value={
severeNarrowLeadership
? "SEVERELY NARROW"
: narrowLeadership
? "NARROW"
: "BROAD"
}
alert={severeNarrowLeadership}
warning={
narrowLeadership &&
!severeNarrowLeadership
}
positive={!narrowLeadership}
/>


<Row
label="Breadth Structure"
value={
breadthFailure
? "FAILURE"
: "FUNCTIONAL"
}
alert={breadthFailure}
positive={!breadthFailure}
/>


<Row
label="Divergence"
value={
bearishDivergence
? "BEARISH"
: "NONE"
}
alert={bearishDivergence}
positive={!bearishDivergence}
/>

</div>


{/* =================================================
WARNING
================================================= */}

{(score < 55 ||
passiveDependence >= 65 ||
narrowLeadership ||
breadthFailure ||
bearishDivergence) && (

<div
className={`
mt-5
rounded-xl
border
p-3
text-xs
leading-relaxed
${
score < 35 ||
breadthFailure
? "border-red-500/40 bg-red-950/20 text-red-200"
: "border-yellow-500/30 bg-yellow-950/10 text-yellow-100"
}
`}
>

{summary}

</div>

)}


{/* =================================================
POSITIVE SUMMARY
================================================= */}

{score >= 72 &&
!narrowLeadership &&
passiveDependence < 40 && (

<div
className="
mt-5
rounded-xl
border
border-green-500/30
bg-green-950/20
p-3
text-xs
leading-relaxed
text-green-200
"
>

{summary}

</div>

)}

</div>

);

}


/* =====================================================
METRIC CARD
===================================================== */

function MetricCard({
label,
value,
good,
warning
}: {
label: string;
value: number;
good?: boolean;
warning?: boolean;
}) {

const valueClass =
good
? "text-green-400"
: warning
? "text-yellow-300"
: "text-red-400";


return (

<div
className="
rounded-xl
border
border-zinc-800
bg-zinc-950/40
p-3
"
>

<div className="text-[11px] text-zinc-500">

{label}

</div>


<div
className={`
mt-1
text-lg
font-semibold
${valueClass}
`}
>

{value}

</div>

</div>

);

}


/* =====================================================
ROW
===================================================== */

function Row({
label,
value,
alert = false,
warning = false,
positive = false
}: {
label: string;
value: string;
alert?: boolean;
warning?: boolean;
positive?: boolean;
}) {

const valueClass =
alert
? "text-red-300"
: warning
? "text-yellow-300"
: positive
? "text-green-400"
: "text-zinc-100";


return (

<div
className="
flex
items-center
justify-between
gap-4
"
>

<span className="text-zinc-400">

{label}

</span>


<span
className={`
text-right
text-xs
sm:text-sm
font-medium
${valueClass}
`}
>

{value}

</span>

</div>

);

}
