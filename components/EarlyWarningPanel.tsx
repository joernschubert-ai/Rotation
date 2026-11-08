"use client";

import { useState } from "react";

export default function EarlyWarningPanel({
earlyWarning
}: any) {

const [showDetails, setShowDetails] =
useState(false);

if (!earlyWarning) return null;


/* =====================================================
DATA
===================================================== */

const score =
Number(
earlyWarning?.score?.value ?? 0
);

const maxScore =
Number(
earlyWarning?.score?.max ?? 14
);

const state =
earlyWarning?.state ??
"CLEAN";

const active =
Boolean(
earlyWarning?.active
);

const color =
earlyWarning?.color ??
"#64748b";

const components =
earlyWarning?.components ?? {};

const meta =
earlyWarning?.meta ?? {};


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
Math.min(
max,
value
)
);

}


function percentage(
value: number,
max: number
) {

if (!max || max <= 0)
return 0;

return clamp(
(value / max) * 100
);

}


function getComponentColor(
value: number,
max: number
) {

const ratio =
percentage(value, max);

if (ratio >= 75)
return "#fda4af";

if (ratio >= 50)
return "#fdba74";

if (ratio >= 25)
return "#fcd34d";

return "#64748b";

}


function formatNumber(
value: any,
fallback = "-"
) {

if (
value === undefined ||
value === null
) {
return fallback;
}

if (
typeof value === "number"
) {
return Math.round(
value * 10
) / 10;
}

return String(value);

}


/* =====================================================
COMPONENT DATA
===================================================== */

const componentList = [

{
key: "divergence",
label: "BREADTH DIVERGENCE",
data: components.divergence
},

{
key: "distribution",
label: "DISTRIBUTION",
data: components.distribution
},

{
key: "concentration",
label: "CONCENTRATION",
data: components.concentration
},

{
key: "liquidity",
label: "LIQUIDITY STRESS",
data: components.liquidity
},

{
key: "participation",
label: "PARTICIPATION",
data: components.participation
},

{
key: "internalDivergence",
label: "INTERNAL DIVERGENCE",
data:
components.internalDivergence
},

{
key: "history",
label: "HISTORY / PERSISTENCE",
data: components.history
}

];


/* =====================================================
SORTED COMPONENTS
===================================================== */

const sortedComponents =
[...componentList]
.filter(
component =>
component.data
)
.sort(
(a, b) => {

const aRatio =
percentage(
Number(
a.data?.value ?? 0
),
Number(
a.data?.max ?? 1
)
);

const bRatio =
percentage(
Number(
b.data?.value ?? 0
),
Number(
b.data?.max ?? 1
)
);

return bRatio - aRatio;

}
);


/* =====================================================
ACTIVE FLAGS
===================================================== */

const structuralFlags = [

{
label:
"Hidden Distribution",

active:
Boolean(
meta.hiddenDistribution
)
},

{
label:
"Participation Collapse",

active:
Boolean(
meta.participationCollapse
)
},

{
label:
"Narrow Leadership",

active:
Boolean(
meta.narrowLeadership
)
}

];


/* =====================================================
RENDER
===================================================== */

return (

<div
style={{
background: "#0e1722",
border: "1px solid #334155",
padding: "16px",
width: "100%",
boxSizing: "border-box"
}}
>


{/* =====================================================
HEADER
===================================================== */}

<div
style={{
display: "flex",
justifyContent:
"space-between",
alignItems:
"flex-start",
gap: "12px",
marginBottom: "16px"
}}
>

<div>

<h3
style={{
margin: 0,
color: "#cbd5e1",
fontSize: "14px",
letterSpacing: "0.5px"
}}
>
EARLY WARNING
</h3>

<div
style={{
fontSize: "10px",
color: "#64748b",
marginTop: "3px"
}}
>
Structural Risk Detection
</div>

</div>


<div
style={{
fontSize: "10px",
color:
active
? color
: "#64748b",

border:
`1px solid ${
active
? color
: "#475569"
}`,

padding: "4px 7px",

fontWeight: "bold",

whiteSpace: "nowrap"
}}
>
{active
? "ACTIVE"
: "CLEAN"}
</div>

</div>


{/* =====================================================
STATE
===================================================== */}

<div
style={{
background: "#121d2a",

border:
`1px solid ${color}`,

padding: "12px",

marginBottom: "16px",

textAlign: "center"
}}
>

<div
style={{
color,

fontWeight: "bold",

fontSize: "15px",

letterSpacing: "0.5px"
}}
>
{state}
</div>

</div>


{/* =====================================================
SCORE
===================================================== */}

<div
style={{
marginBottom: "18px"
}}
>

<div
style={{
display: "flex",

justifyContent:
"space-between",

alignItems:
"flex-end",

marginBottom: "6px"
}}
>

<div>

<div
style={{
fontSize: "10px",
color: "#64748b"
}}
>
EARLY WARNING SCORE
</div>

</div>


<div
style={{
color,

fontSize: "22px",

fontWeight: "bold"
}}
>
{score}
<span
style={{
fontSize: "12px",
color: "#64748b",
marginLeft: "3px"
}}
>
/{maxScore}
</span>
</div>

</div>


{/* SCORE BAR */}

<div
style={{
height: "7px",

background: "#334155",

overflow: "hidden"
}}
>

<div
style={{
height: "100%",

width:
`${percentage(
score,
maxScore
)}%`,

background: color,

transition: "0.3s"
}}
/>

</div>

</div>


{/* =====================================================
COMPONENT BREAKDOWN
===================================================== */}

<div
style={{
borderTop:
"1px solid #334155",

paddingTop: "12px"
}}
>

<div
style={{
fontSize: "10px",

color: "#64748b",

marginBottom: "12px",

letterSpacing: "0.5px"
}}
>
RISK DRIVERS
</div>


<div
style={{
display: "flex",

flexDirection: "column",

gap: "10px"
}}
>

{sortedComponents.map(
component => {

const value =
Number(
component.data?.value ?? 0
);

const max =
Number(
component.data?.max ?? 1
);

const componentColor =
getComponentColor(
value,
max
);

return (

<div
key={component.key}
>

<div
style={{
display: "flex",

justifyContent:
"space-between",

gap: "10px",

marginBottom: "4px"
}}
>

<div
style={{
fontSize: "10px",
color: "#94a3b8"
}}
>
{component.label}
</div>


<div
style={{
fontSize: "10px",

color:
componentColor,

fontWeight: "bold",

whiteSpace:
"nowrap"
}}
>
{value}/{max}
</div>

</div>


<div
style={{
height: "5px",

background: "#334155",

overflow: "hidden"
}}
>

<div
style={{
height: "100%",

width:
`${percentage(
value,
max
)}%`,

background:
componentColor,

transition: "0.3s"
}}
/>

</div>

</div>

);

}
)}

</div>

</div>


{/* =====================================================
STRUCTURAL FLAGS
===================================================== */}

<div
style={{
marginTop: "16px",

display: "flex",

gap: "6px",

flexWrap: "wrap"
}}
>

{structuralFlags.map(
flag => (

<div
key={flag.label}

style={{
padding:
"4px 7px",

border:
`1px solid ${
flag.active
? "#fda4af"
: "#292929"
}`,

color:
flag.active
? "#fda4af"
: "#64748b",

fontSize: "9px",

background:
flag.active
? "#1a1010"
: "#121d2a"
}}
>

{flag.label}

</div>

)
)}

</div>


{/* =====================================================
DETAILS BUTTON
===================================================== */}

<button
onClick={() =>
setShowDetails(
!showDetails
)
}

style={{
width: "100%",

marginTop: "16px",

background: "#121d2a",

border: "1px solid #334155",

padding: "8px",

color: "#94a3b8",

fontSize: "10px",

cursor: "pointer"
}}
>

{showDetails
? "HIDE DIAGNOSTICS"
: "SHOW DIAGNOSTICS"}

</button>


{/* =====================================================
DIAGNOSTICS
===================================================== */}

{showDetails && (

<div
style={{
marginTop: "16px",

borderTop:
"1px solid #334155",

paddingTop: "12px"
}}
>


<div
style={{
fontSize: "10px",

color: "#64748b",

marginBottom: "10px",

letterSpacing: "0.5px"
}}
>
STRUCTURAL DIAGNOSTICS
</div>


<div
style={{
display: "grid",

gridTemplateColumns:
"repeat(auto-fit,minmax(120px,1fr))",

gap: "8px"
}}
>

<DiagnosticMetric
label="Divergence Severity"
value={
formatNumber(
meta.divergenceSeverity
)
}
/>


<DiagnosticMetric
label="Divergence State"
value={
meta.divergenceState ??
"-"
}
/>


<DiagnosticMetric
label="Participation"
value={
formatNumber(
meta.participation
)
}
/>


<DiagnosticMetric
label="Breadth Trend"
value={
formatNumber(
meta.breadthTrend
)
}
/>


<DiagnosticMetric
label="Breadth Acceleration"
value={
formatNumber(
meta.breadthAcceleration
)
}
/>


<DiagnosticMetric
label="Participation Decay"
value={
formatNumber(
meta.participationDecay
)
}
/>


<DiagnosticMetric
label="Leadership Decay"
value={
formatNumber(
meta.leadershipDecay
)
}
/>


<DiagnosticMetric
label="Phase Persistence"
value={
formatNumber(
meta.phasePersistence
)
}
/>

</div>

</div>

)}

</div>

);

}


/* =====================================================
DIAGNOSTIC METRIC
===================================================== */

function DiagnosticMetric({
label,
value
}: any) {

return (

<div
style={{
background: "#121d2a",

border: "1px solid #162232",

padding: "8px"
}}
>

<div
style={{
fontSize: "9px",

color: "#64748b"
}}
>
{label}
</div>


<div
style={{
marginTop: "4px",

fontSize: "11px",

color: "#e2e8f0",

wordBreak:
"break-word"
}}
>
{value}
</div>

</div>

);

}
