// /components/panels/ParticipationPanel.tsx

"use client";


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


function trendLabel(
value: number
) {

if (value >= 5) {
return "IMPROVING";
}

if (value >= 1) {
return "STABLE+";
}

if (value <= -5) {
return "DETERIORATING";
}

if (value <= -1) {
return "STABLE-";
}

return "STABLE";

}


function trendColor(
value: number
) {

if (value >= 5) {
return "text-green-400";
}

if (value >= 1) {
return "text-green-300";
}

if (value <= -5) {
return "text-red-400";
}

if (value <= -1) {
return "text-orange-300";
}

return "text-zinc-300";

}


/* =====================================================
COMPONENT
===================================================== */

export default function ParticipationPanel({
data
}: Props) {


const participation =
data?.participation ?? {};


/* ===================================================
CORE
==================================================== */

const score =
clamp(
Number(
participation?.score ?? 0
)
);


const state =
participation?.state ??
"WEAK";


const quality =
participation?.quality ??
"LOW";


const expansion =
Boolean(
participation?.expansion ?? false
);


/* ===================================================
STRUCTURE
==================================================== */

const institutionalParticipation =
clamp(
Number(
participation?.institutionalParticipation ??
0
)
);


const leadershipBreadth =
clamp(
Number(
participation?.leadershipBreadth ??
0
)
);


const passiveDependence =
clamp(
Number(
participation?.passiveDependence ??
0
)
);


const narrowLeadership =
Boolean(
participation?.narrowLeadership ??
false
);


const severeNarrowLeadership =
Boolean(
participation?.severeNarrowLeadership ??
false
);


const equalWeightWeakness =
Boolean(
participation?.equalWeightWeakness ??
false
);


const smallCapWeakness =
Boolean(
participation?.smallCapWeakness ??
false
);


const breadthFailure =
Boolean(
participation?.breadthFailure ??
false
);


/* ===================================================
TRENDS
==================================================== */

const participationVelocity =
Number(
participation?.participationVelocity ??
0
);


const participationDecayRate =
Number(
participation?.participationDecayRate ??
0
);


const participationSlope =
Number(
participation?.participationSlope ??
0
);


const participationAcceleration =
Number(
participation?.participationAcceleration ??
0
);


const breadth50Trend =
Number(
participation?.breadth50Trend ??
0
);


const breadth200Trend =
Number(
participation?.breadth200Trend ??
0
);


const breadthParticipationDecay =
clamp(
Number(
participation?.breadthParticipationDecay ??
0
)
);


const decayPersistence =
clamp(
Number(
participation?.decayPersistence ??
0
)
);


const megaCapDependenceTrend =
Number(
participation?.megaCapDependenceTrend ??
0
);


/* ===================================================
SUMMARY
==================================================== */

const summary =
participation?.summary ??
"No participation analysis available";


/* ===================================================
COLOR SYSTEM
==================================================== */

const scoreColor =

score >= 70
? "text-green-400"

: score >= 52
? "text-green-300"

: score >= 42
? "text-orange-400"

: "text-red-400";


const borderColor =

score >= 70
? "border-green-500/40"

: score >= 52
? "border-green-500/20"

: score >= 42
? "border-orange-500/50"

: "border-red-500/60";


const bgGlow =

score >= 70
? "bg-green-950/10"

: score >= 52
? "bg-zinc-900"

: score >= 42
? "bg-orange-950/15"

: "bg-red-950/20";


const progressColor =

score >= 70
? "bg-green-500"

: score >= 52
? "bg-green-400"

: score >= 42
? "bg-orange-400"

: "bg-red-500";


/* ===================================================
STATE BADGE
==================================================== */

const stateBadge =

state === "STRONG"
? "border-green-500/40 bg-green-500/10 text-green-300"

: state === "HEALTHY"
? "border-green-500/30 bg-green-500/5 text-green-200"

: state === "FRAGILE"
? "border-orange-500/40 bg-orange-500/10 text-orange-300"

: "border-red-500/50 bg-red-500/10 text-red-300";


/* ===================================================
RISK STATUS
==================================================== */

const structuralRisk =

breadthFailure ||

severeNarrowLeadership ||

(
narrowLeadership &&
equalWeightWeakness &&
smallCapWeakness
);


const elevatedRisk =

structuralRisk ||

passiveDependence >= 65 ||

decayPersistence >= 14 ||

breadthParticipationDecay >= 20;


/* ===================================================
RENDER
==================================================== */

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
mb-4
flex
items-start
justify-between
gap-4
"
>

<div>

<h2
className="
text-base
sm:text-lg
font-semibold
"
>
Participation Engine
</h2>


<p
className="
mt-1
text-[10px]
sm:text-xs
text-zinc-500
"
>
Market participation and internal breadth quality
</p>

</div>


<div
className="
text-right
shrink-0
"
>

<div
className={`
text-2xl
sm:text-3xl
font-bold
${scoreColor}
`}
>
{score}
</div>


<div
className="
mt-0.5
text-[9px]
uppercase
tracking-wider
text-zinc-500
"
>
Participation
</div>

</div>

</div>


{/* =================================================
PROGRESS
================================================= */}

<div className="mb-4">

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
width: `${score}%`
}}
/>

</div>

</div>


{/* =================================================
BADGES
================================================= */}

<div
className="
mb-5
flex
flex-wrap
gap-2
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
text-[10px]
sm:text-xs
font-semibold
${stateBadge}
`}
>
{state}
</div>


<div
className="
inline-flex
items-center
rounded-full
border
border-zinc-700
bg-zinc-950/40
px-3
py-1
text-[10px]
sm:text-xs
font-medium
text-zinc-300
"
>
QUALITY: {quality}
</div>


{expansion && (

<div
className="
inline-flex
items-center
rounded-full
border
border-green-500/40
bg-green-500/10
px-3
py-1
text-[10px]
sm:text-xs
font-semibold
text-green-300
"
>
EXPANSION
</div>

)}

</div>


{/* =================================================
CORE METRICS
================================================= */}

<div
className="
mb-5
grid
grid-cols-1
gap-2
sm:grid-cols-3
"
>

<MetricCard
label="Institutional"
value={institutionalParticipation}
color={
institutionalParticipation >= 65
? "green"

: institutionalParticipation >= 45
? "yellow"

: "red"
}
/>


<MetricCard
label="Leadership Breadth"
value={leadershipBreadth}
color={
leadershipBreadth >= 60
? "green"

: leadershipBreadth >= 42
? "yellow"

: "red"
}
/>


<MetricCard
label="Passive Dependence"
value={passiveDependence}
inverse
color={
passiveDependence >= 70
? "red"

: passiveDependence >= 50
? "yellow"

: "green"
}
/>

</div>


{/* =================================================
STRUCTURAL STATUS
================================================= */}

<SectionTitle>
Structural Controls
</SectionTitle>


<div
className="
space-y-2
text-xs
sm:text-sm
"
>

<StatusRow
label="Breadth Structure"
value={
breadthFailure
? "FAILURE"
: "FUNCTIONAL"
}
status={
breadthFailure
? "danger"
: "good"
}
/>


<StatusRow
label="Leadership"
value={
severeNarrowLeadership
? "SEVERELY NARROW"

: narrowLeadership
? "NARROW"

: "BROAD"
}
status={
severeNarrowLeadership
? "danger"

: narrowLeadership
? "warning"

: "good"
}
/>


<StatusRow
label="Equal Weight"
value={
equalWeightWeakness
? "WEAK"
: "SUPPORTED"
}
status={
equalWeightWeakness
? "warning"
: "good"
}
/>


<StatusRow
label="Small Caps"
value={
smallCapWeakness
? "WEAK"
: "SUPPORTED"
}
status={
smallCapWeakness
? "warning"
: "good"
}
/>

</div>


{/* =================================================
TRENDS
================================================= */}

<div className="mt-5">

<SectionTitle>
Participation Trends
</SectionTitle>


<div
className="
grid
grid-cols-2
gap-x-4
gap-y-3
sm:grid-cols-3
"
>

<TrendMetric
label="Velocity"
value={participationVelocity}
/>


<TrendMetric
label="10D Trend"
value={participationDecayRate}
/>


<TrendMetric
label="Slope"
value={participationSlope}
/>


<TrendMetric
label="Acceleration"
value={participationAcceleration}
/>


<TrendMetric
label="Breadth 50"
value={breadth50Trend}
/>


<TrendMetric
label="Breadth 200"
value={breadth200Trend}
/>

</div>

</div>


{/* =================================================
DECAY CONTROL
================================================= */}

<div
className="
mt-5
rounded-xl
border
border-zinc-800
bg-zinc-950/30
p-3
"
>

<div
className="
mb-3
flex
items-center
justify-between
gap-3
"
>

<span
className="
text-xs
font-medium
text-zinc-400
"
>
Structural Decay
</span>


<span
className={`
text-sm
font-bold

${
decayPersistence >= 14
? "text-red-400"

: decayPersistence >= 8
? "text-orange-400"

: "text-green-400"
}
`}
>
{decayPersistence}/20
</span>

</div>


<div
className="
h-1.5
overflow-hidden
rounded-full
bg-zinc-800
"
>

<div
className={`
h-full
rounded-full

${
decayPersistence >= 14
? "bg-red-500"

: decayPersistence >= 8
? "bg-orange-400"

: "bg-green-500"
}
`}
style={{
width: `${
(decayPersistence / 20) * 100
}%`
}}
/>

</div>


<div
className="
mt-3
flex
items-center
justify-between
text-[10px]
text-zinc-500
"
>

<span>
Breadth Decay
</span>


<span
className={
breadthParticipationDecay >= 20
? "text-red-400"

: breadthParticipationDecay >= 12
? "text-orange-300"

: "text-zinc-300"
}
>
{breadthParticipationDecay}/30
</span>

</div>

</div>


{/* =================================================
RISK WARNING
================================================= */}

{elevatedRisk && (

<div
className={`
mt-5
rounded-xl
border
p-3
text-xs
leading-relaxed

${
structuralRisk
? "border-red-500/40 bg-red-950/20 text-red-200"

: "border-orange-500/40 bg-orange-950/20 text-orange-200"
}
`}
>

<div className="mb-1 font-semibold">

{structuralRisk
? "STRUCTURAL PARTICIPATION WARNING"
: "PARTICIPATION DETERIORATION"}

</div>


{structuralRisk

? (
<>
Internal market participation is materially weaker
than headline index stability suggests.
Leadership concentration and breadth deterioration
increase structural market vulnerability.
</>
)

: (
<>
Participation is deteriorating beneath the surface.
Monitor breadth trends, passive dependence and
leadership concentration for further confirmation.
</>
)

}

</div>

)}


{/* =================================================
SUMMARY
================================================= */}

<div
className="
mt-5
border-t
border-zinc-800
pt-4
"
>

<p
className="
text-xs
leading-relaxed
text-zinc-400
"
>
{summary}
</p>


{megaCapDependenceTrend > 5 && (

<p
className="
mt-2
text-[10px]
text-orange-300
"
>
Mega-cap dependence increasing
</p>

)}

</div>

</div>

);

}


/* =====================================================
SECTION TITLE
===================================================== */

function SectionTitle({
children
}: {
children: React.ReactNode;
}) {

return (

<div
className="
mb-3
text-[10px]
font-semibold
uppercase
tracking-widest
text-zinc-500
"
>
{children}
</div>

);

}


/* =====================================================
STATUS ROW
===================================================== */

function StatusRow({
label,
value,
status
}: {
label: string;
value: string;
status:
| "good"
| "warning"
| "danger";
}) {


const color =

status === "good"
? "text-green-400"

: status === "warning"
? "text-orange-300"

: "text-red-400";


return (

<div
className="
flex
items-center
justify-between
gap-3
"
>

<span className="text-zinc-400">
{label}
</span>


<span
className={`
text-right
font-medium
${color}
`}
>
{value}
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
color,
inverse = false
}: {
label: string;
value: number;
color:
| "green"
| "yellow"
| "red";
inverse?: boolean;
}) {


const valueColor =

color === "green"
? "text-green-400"

: color === "yellow"
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

<div
className="
text-[9px]
uppercase
tracking-wider
text-zinc-500
"
>
{label}
</div>


<div
className={`
mt-1
text-xl
font-bold
${valueColor}
`}
>
{value}
</div>


<div
className="
mt-1
text-[9px]
text-zinc-600
"
>
{inverse
? "Higher = structural risk"
: "Higher = healthier"}
</div>

</div>

);

}


/* =====================================================
TREND METRIC
===================================================== */

function TrendMetric({
label,
value
}: {
label: string;
value: number;
}) {

const color =
trendColor(value);


const labelText =
trendLabel(value);


return (

<div>

<div
className="
text-[9px]
uppercase
tracking-wide
text-zinc-500
"
>
{label}
</div>


<div
className={`
mt-1
text-sm
font-semibold
${color}
`}
>
{value > 0 ? "+" : ""}
{value}
</div>


<div
className={`
mt-0.5
text-[9px]
${color}
`}
>
{labelText}
</div>

</div>

);

}
