"use client";

import { useState } from "react";

export default function SignalPanel({ signal }: any) {

const [showDetails, setShowDetails] =
useState(false);

if (!signal) return null;

/* =====================================================
HELPERS
===================================================== */

function getSignalColor(type: string) {

switch (type) {

case "SHORT_SETUP":
return "#ff4d4f";

case "LONG_SETUP":
return "#52c41a";

case "ROTATION_SIGNAL":
return "#1677ff";

case "RISK_WARNING":
return "#faad14";

case "NONE":
return "#666";

default:
return "#888";

}

}


function getPriorityColor(priority: string) {

switch (priority) {

case "HIGH":
return "#ff4d4f";

case "MEDIUM":
return "#faad14";

case "LOW":
return "#666";

default:
return "#666";

}

}


function getQualityColor(quality: string) {

switch (quality) {

case "INSTITUTIONAL":
return "#9254de";

case "CONFIRMED":
return "#52c41a";

case "STRUCTURAL":
return "#1677ff";

case "EARLY":
return "#faad14";

case "LOW":
return "#666";

default:
return "#888";

}

}


function getPhaseColor(phase: string) {

switch (phase) {

case "PHASE_1_EXPANSION":
return "#52c41a";

case "PHASE_2_WARNING":
return "#95de64";

case "PHASE_3_DISTRIBUTION":
return "#faad14";

case "PHASE_4_RISK":
return "#fa8c16";

case "PHASE_5_BREAKDOWN":
return "#ff4d4f";

case "PHASE_6_ACCELERATION":
return "#cf1322";

case "PHASE_7_CAPITULATION":
return "#820014";

default:
return "#666";

}

}


function getStrengthColor(value: number) {

if (value >= 80)
return "#52c41a";

if (value >= 70)
return "#95de64";

if (value >= 50)
return "#faad14";

if (value >= 30)
return "#fa8c16";

return "#666";

}


function formatTimestamp(timestamp: number) {

if (!timestamp)
return "--";

return new Date(timestamp)
.toLocaleTimeString(
[],
{
hour: "2-digit",
minute: "2-digit"
}
);

}


/* =====================================================
DATA
===================================================== */

const type =
signal.type ?? "NONE";

const strength =
Math.round(
signal.strength ?? 0
);

const priority =
signal.priority ?? "LOW";

const quality =
signal.quality ?? "LOW";

const context =
signal.context ?? {};

const phase =
context.phase ?? "-";

const color =
getSignalColor(type);

const strengthColor =
getStrengthColor(strength);


/* =====================================================
CONTEXT
===================================================== */

const tradeStack =
context.tradeStack ?? {};

const putTiming =
context.putTiming ?? {};

const earlyWarning =
context.earlyWarning ?? {};

const rotation =
context.rotation ?? {};

const priceMomentum =
context.priceMomentum ?? {};

const market =
context.market ?? {};

const regime =
context.regime ?? {};


/* =====================================================
RENDER
===================================================== */

return (

<div
style={{
background: "#0d0d0d",
border: "1px solid #222",
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
justifyContent: "space-between",
alignItems: "flex-start",
gap: "12px",
marginBottom: "16px"
}}
>

<div>

<h3
style={{
margin: 0,
color: "#bbb",
fontSize: "14px",
letterSpacing: "0.5px"
}}
>
AUTO SIGNAL
</h3>

<div
style={{
fontSize: "10px",
color: "#666",
marginTop: "3px"
}}
>
Market Setup Classification
</div>

</div>


<div
style={{
fontSize: "10px",
color: "#666"
}}
>
{formatTimestamp(signal.timestamp)}
</div>

</div>


{/* =====================================================
MAIN SIGNAL
===================================================== */}

<div
style={{
borderLeft:
`4px solid ${color}`,

background: "#101010",

padding: "12px",

marginBottom: "14px"
}}
>

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: "10px"
}}
>

<div
style={{
color,
fontWeight: "bold",
fontSize: "16px"
}}
>
{type}
</div>


<div
style={{
padding: "3px 7px",

border:
`1px solid ${getPriorityColor(priority)}`,

color:
getPriorityColor(priority),

fontSize: "10px",

fontWeight: "bold"
}}
>
{priority}
</div>

</div>


{/* MESSAGE */}

<div
style={{
marginTop: "8px",

fontSize: "12px",

color: "#bbb",

lineHeight: "1.5"
}}
>
{signal.message}
</div>


{/* QUALITY */}

<div
style={{
marginTop: "10px",

display: "inline-block",

padding: "3px 7px",

border:
`1px solid ${getQualityColor(quality)}`,

color:
getQualityColor(quality),

fontSize: "10px"
}}
>
QUALITY: {quality}
</div>

</div>


{/* =====================================================
SIGNAL STRENGTH
===================================================== */}

<div
style={{
marginBottom: "16px"
}}
>

<div
style={{
display: "flex",

justifyContent: "space-between",

fontSize: "11px",

marginBottom: "5px"
}}
>

<div
style={{
color: "#777"
}}
>
SIGNAL STRENGTH
</div>


<div
style={{
color: strengthColor,

fontWeight: "bold"
}}
>
{strength}/100
</div>

</div>


<div
style={{
height: "6px",

background: "#222",

overflow: "hidden"
}}
>

<div
style={{
width:
`${Math.min(
100,
Math.max(
0,
strength
)
)}%`,

height: "100%",

background: strengthColor,

transition: "0.3s"
}}
/>

</div>

</div>


{/* =====================================================
PRIMARY CONTEXT
===================================================== */}

<div
style={{
display: "grid",

gridTemplateColumns:
"repeat(auto-fit,minmax(110px,1fr))",

gap: "8px",

marginBottom: "14px"
}}
>

{/* PHASE */}

<MetricCard
label="PHASE"
value={phase}
color={getPhaseColor(phase)}
/>


{/* TRADE STACK */}

<MetricCard
label="TRADE STACK"
value={
tradeStack.type ??
"NONE"
}
sub={
tradeStack.strength !== undefined
? `${tradeStack.strength}`
: undefined
}
/>


{/* PUT TIMING */}

<MetricCard
label="PUT TIMING"
value={
putTiming.decision ??
"NO TRADE"
}
sub={
putTiming.timing
}
/>


{/* EARLY WARNING */}

<MetricCard
label="EARLY WARNING"
value={
earlyWarning.active
? "ACTIVE"
: "OFF"
}
color={
earlyWarning.active
? "#faad14"
: "#666"
}
/>

</div>


{/* =====================================================
TOGGLE
===================================================== */}

<button
onClick={() =>
setShowDetails(
!showDetails
)
}
style={{
width: "100%",

background: "#151515",

border: "1px solid #222",

padding: "8px",

color: "#777",

fontSize: "11px",

cursor: "pointer"
}}
>

{showDetails
? "HIDE SIGNAL ANALYSIS"
: "SHOW SIGNAL ANALYSIS"
}

</button>


{/* =====================================================
DETAILS
===================================================== */}

{showDetails && (

<div
style={{
marginTop: "14px"
}}
>


{/* =====================================================
ROTATION
===================================================== */}

<Section
title="ROTATION"
>

<MetricGrid>

<Metric
label="State"
value={rotation.state}
/>

<Metric
label="Confidence"
value={rotation.confidence}
/>

<Metric
label="Quality"
value={rotation.quality}
/>

<Metric
label="Sustainability"
value={rotation.sustainability}
/>

<Metric
label="Decay"
value={rotation.decayScore}
/>

<Metric
label="Decay State"
value={rotation.decayState}
/>

</MetricGrid>

</Section>


{/* =====================================================
PRICE MOMENTUM
===================================================== */}

<Section
title="PRICE MOMENTUM"
>

<MetricGrid>

<Metric
label="Score"
value={priceMomentum.score}
/>

<Metric
label="State"
value={priceMomentum.state}
/>

<Metric
label="Direction"
value={priceMomentum.direction}
/>

<Metric
label="Acceleration"
value={priceMomentum.acceleration}
/>

</MetricGrid>

</Section>


{/* =====================================================
MARKET STRUCTURE
===================================================== */}

<Section
title="MARKET STRUCTURE"
>

<MetricGrid>

<Metric
label="Liquidity"
value={market.liquidity}
/>

<Metric
label="Participation"
value={market.participation}
/>

<Metric
label="Fragility"
value={market.fragility}
/>

<Metric
label="Breadth"
value={market.breadth}
/>

<Metric
label="Squeeze"
value={market.squeeze}
/>

</MetricGrid>

</Section>


{/* =====================================================
REGIME
===================================================== */}

<Section
title="REGIME"
>

<MetricGrid>

<Metric
label="Sync"
value={
regime.syncAligned
? "ALIGNED"
: "NOT ALIGNED"
}
/>

<Metric
label="Sync Score"
value={regime.syncScore}
/>

<Metric
label="Danger"
value={regime.dangerLevel}
/>

<Metric
label="Risk State"
value={regime.riskState}
/>

<Metric
label="Execution"
value={regime.executionMode}
/>

</MetricGrid>

</Section>

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
sub,
color
}: any) {

return (

<div
style={{
background: "#101010",

border: "1px solid #222",

padding: "9px"
}}
>

<div
style={{
fontSize: "9px",

color: "#666",

marginBottom: "4px"
}}
>
{label}
</div>


<div
style={{
fontSize: "11px",

color:
color ?? "#ddd",

fontWeight: "bold",

wordBreak: "break-word"
}}
>
{value ?? "-"}
</div>


{sub && (

<div
style={{
marginTop: "3px",

fontSize: "9px",

color: "#666"
}}
>
{sub}
</div>

)}

</div>

);

}


/* =====================================================
SECTION
===================================================== */

function Section({
title,
children
}: any) {

return (

<div
style={{
marginTop: "16px",

paddingTop: "12px",

borderTop:
"1px solid #222"
}}
>

<div
style={{
fontSize: "10px",

color: "#666",

letterSpacing: "0.5px",

marginBottom: "10px"
}}
>
{title}
</div>

{children}

</div>

);

}


/* =====================================================
METRIC GRID
===================================================== */

function MetricGrid({
children
}: any) {

return (

<div
style={{
display: "grid",

gridTemplateColumns:
"repeat(auto-fit,minmax(120px,1fr))",

gap: "8px"
}}
>

{children}

</div>

);

}


/* =====================================================
METRIC
===================================================== */

function Metric({
label,
value
}: any) {

return (

<div
style={{
background: "#101010",

border: "1px solid #1d1d1d",

padding: "8px"
}}
>

<div
style={{
fontSize: "9px",

color: "#666"
}}
>
{label}
</div>


<div
style={{
marginTop: "3px",

fontSize: "11px",

color: "#ccc",

wordBreak: "break-word"
}}
>
{value ?? "-"}
</div>

</div>

);

}
