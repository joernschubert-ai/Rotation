// /components/SuperSignalPanel.tsx

"use client";

/* =====================================================
SUPER SIGNAL PANEL

Compatible with:

/lib/engine/superSignalEngine.ts

Engine Output:

{
active,
trigger,
type,
strength,
quality,
priority,
institutionalScore,
confirmation,
state,
summary
}

===================================================== */

export default function SuperSignalPanel({
superSignal
}: any) {

if (!superSignal) return null;

/* =====================================================
SAFE ROOT ACCESS
===================================================== */

const {
active = false,

trigger = false,

type = "NONE",

strength = 0,

quality = "LOW",

priority = "LOW",

institutionalScore = 0,

state = "INVALID",

summary = ""
} = superSignal;


/* =====================================================
SAFE CONFIRMATION ACCESS
===================================================== */

const confirmation =
superSignal?.confirmation ?? {};


const {

regimeAligned = false,

phaseConfirmed = false,

phaseConfidence = 0,

rotationConfirmed = false,

rotationConfirming = false,

rotationDirection = "NEUTRAL",

breadthConfirmed = false,

liquiditySupported = false,

participationHealthy = false,

lowFragility = false,

squeezeRisk = false,

megaCapRisk = false,

falseBreakRisk = false,

breadthThrustActive = false,

rotationHealthy = false,

decayWarning = false

} = confirmation;


/* =====================================================
HELPERS
===================================================== */

function getScoreColor(value: number) {

if (value >= 86) {
return "#52c41a";
}

if (value >= 72) {
return "#95de64";
}

if (value >= 52) {
return "#faad14";
}

return "#ff4d4f";
}


function getQualityColor(value: string) {

switch (value) {

case "INSTITUTIONAL":
return "#52c41a";

case "CONFIRMED":
return "#95de64";

case "TACTICAL":
return "#faad14";

case "LOW":
return "#ff4d4f";

default:
return "#999";
}
}


function getStateColor(value: string) {

switch (value) {

case "HIGH_CONVICTION":
return "#52c41a";

case "CONFIRMED":
return "#95de64";

case "BUILDING":
return "#faad14";

case "EARLY":
return "#fa8c16";

case "INVALID":
return "#666";

default:
return "#999";
}
}


function getPriorityColor(value: string) {

switch (value) {

case "HIGH":
return "#ff4d4f";

case "MEDIUM":
return "#faad14";

case "LOW":
return "#666";

default:
return "#999";
}
}


function getDirectionColor(value: string) {

switch (value) {

case "BULLISH":
return "#52c41a";

case "BEARISH":
return "#ff4d4f";

case "NEUTRAL":
return "#999";

default:
return "#999";
}
}


function getBooleanColor(
value: boolean,
positive = "#52c41a"
) {

return value
? positive
: "#555";
}


function booleanLabel(
value: boolean,
yes = "YES",
no = "NO"
) {

return value
? yes
: no;
}


/* =====================================================
SIGNAL DIRECTION
===================================================== */

const isLong =
[
"LONG_ATTACK",
"ROTATION_BUILD",
"ROTATION_FLOW"
].includes(type);


const isShort =
[
"PUT_ATTACK",
"PUT_BUILD",
"SHORT_FLOW"
].includes(type);


const direction =
isLong
? "LONG"
: isShort
? "SHORT / PUT"
: "NEUTRAL";


const directionColor =
isLong
? "#52c41a"
: isShort
? "#ff4d4f"
: "#999";


/* =====================================================
ROTATION LABEL
===================================================== */

const rotationLabel =
rotationConfirmed
? "CONFIRMED"
: rotationConfirming
? "BUILDING"
: "UNCONFIRMED";


const rotationColor =
rotationConfirmed
? "#52c41a"
: rotationConfirming
? "#faad14"
: "#666";


/* =====================================================
SCORE BAR
===================================================== */

function ScoreBar({
value,
color
}: {
value: number;
color?: string;
}) {

const safeValue =
Math.max(
0,
Math.min(
100,
Number(value) || 0
)
);


return (

<div
style={{
width: "100%",
height: "6px",
background: "#222",
borderRadius: "4px",
overflow: "hidden"
}}
>

<div
style={{
width: `${safeValue}%`,
height: "100%",
background:
color ??
getScoreColor(safeValue),
borderRadius: "4px",
transition: "width 0.3s ease"
}}
/>

</div>

);
}


/* =====================================================
STATUS CARD
===================================================== */

function StatusCard({
title,
value,
color,
subValue
}: {
title: string;
value: any;
color?: string;
subValue?: string | number;
}) {

return (

<div
style={{
background: "#111",
border: "1px solid #222",
padding: "12px",
minWidth: 0
}}
>

<div
style={{
fontSize: "10px",
color: "#666",
marginBottom: "6px",
textTransform: "uppercase",
letterSpacing: "0.5px"
}}
>
{title}
</div>


<div
style={{
fontWeight: "bold",
color: color ?? "#ddd",
fontSize: "14px",
wordBreak: "break-word"
}}
>
{value}
</div>


{subValue !== undefined && (

<div
style={{
marginTop: "5px",
fontSize: "11px",
color: "#777"
}}
>
{subValue}
</div>

)}

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
style={{
fontSize: "11px",
color: "#666",
marginBottom: "8px",
textTransform: "uppercase",
letterSpacing: "0.8px"
}}
>
{children}
</div>

);
}


/* =====================================================
HEADER COLOR
===================================================== */

const headerColor =
!active
? "#666"
: getScoreColor(institutionalScore);


/* =====================================================
RENDER
===================================================== */

return (

<div
style={{
background: "#0d0d0d",
border: `1px solid ${headerColor}`,
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
alignItems: "center",
gap: "12px",
flexWrap: "wrap",
marginBottom: "16px"
}}
>

<div>

<h3
style={{
margin: 0,
fontSize: "15px",
color: headerColor,
letterSpacing: "0.5px"
}}
>
SUPER SIGNAL
</h3>


<div
style={{
marginTop: "4px",
fontSize: "11px",
color: "#666"
}}
>
Institutional Signal Confirmation Engine
</div>

</div>


<div
style={{
display: "flex",
alignItems: "center",
gap: "8px",
flexWrap: "wrap"
}}
>

<span
style={{
fontSize: "11px",
fontWeight: "bold",
padding: "5px 8px",
border: `1px solid ${getQualityColor(quality)}`,
color: getQualityColor(quality)
}}
>
{quality}
</span>


<span
style={{
fontSize: "11px",
fontWeight: "bold",
padding: "5px 8px",
border: `1px solid ${getStateColor(state)}`,
color: getStateColor(state)
}}
>
{state}
</span>

</div>

</div>


{/* =====================================================
MAIN SIGNAL
===================================================== */}

<div
style={{
padding: "16px",
background: "#111",
border: `1px solid ${headerColor}`,
marginBottom: "18px"
}}
>

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "flex-start",
gap: "12px",
flexWrap: "wrap"
}}
>

<div>

<div
style={{
fontSize: "10px",
color: "#666",
textTransform: "uppercase",
marginBottom: "6px"
}}
>
Active Signal
</div>


<div
style={{
fontSize: "22px",
fontWeight: "bold",
color: headerColor,
wordBreak: "break-word"
}}
>
{type}
</div>


<div
style={{
marginTop: "6px",
fontSize: "12px",
fontWeight: "bold",
color: directionColor
}}
>
{direction}
</div>

</div>


<div
style={{
textAlign: "right"
}}
>

<div
style={{
fontSize: "10px",
color: "#666",
textTransform: "uppercase"
}}
>
Institutional Score
</div>


<div
style={{
fontSize: "26px",
fontWeight: "bold",
color:
getScoreColor(
institutionalScore
)
}}
>
{institutionalScore}
<span
style={{
fontSize: "13px",
color: "#666"
}}
>
/100
</span>
</div>

</div>

</div>


<div
style={{
marginTop: "12px"
}}
>
<ScoreBar
value={institutionalScore}
/>
</div>


{/* =====================================================
ACTIVE / TRIGGER
===================================================== */}

<div
style={{
display: "flex",
gap: "10px",
flexWrap: "wrap",
marginTop: "14px"
}}
>

<div
style={{
padding: "7px 10px",
border:
`1px solid ${
active
? "#52c41a"
: "#444"
}`,
color:
active
? "#52c41a"
: "#777",
fontSize: "11px",
fontWeight: "bold"
}}
>
ACTIVE:
{" "}
{active
? "YES"
: "NO"}
</div>


<div
style={{
padding: "7px 10px",
border:
`1px solid ${
trigger
? "#52c41a"
: "#444"
}`,
color:
trigger
? "#52c41a"
: "#777",
fontSize: "11px",
fontWeight: "bold"
}}
>
TRIGGER:
{" "}
{trigger
? "YES"
: "NO"}
</div>


<div
style={{
padding: "7px 10px",
border:
`1px solid ${getPriorityColor(priority)}`,
color:
getPriorityColor(priority),
fontSize: "11px",
fontWeight: "bold"
}}
>
PRIORITY:
{" "}
{priority}
</div>

</div>

</div>


{/* =====================================================
CORE STATE
===================================================== */}

<div
style={{
marginBottom: "18px"
}}
>

<SectionTitle>
Core Confirmation
</SectionTitle>


<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(auto-fit, minmax(140px, 1fr))",
gap: "10px"
}}
>

<StatusCard
title="Regime"
value={
regimeAligned
? "ALIGNED"
: "MISALIGNED"
}
color={
regimeAligned
? "#52c41a"
: "#ff4d4f"
}
/>


<StatusCard
title="Phase"
value={
phaseConfirmed
? "CONFIRMED"
: "BUILDING"
}
color={
phaseConfirmed
? "#52c41a"
: "#faad14"
}
subValue={`${phaseConfidence}% confidence`}
/>


<StatusCard
title="Rotation"
value={rotationLabel}
color={rotationColor}
subValue={rotationDirection}
/>


<StatusCard
title="Direction"
value={rotationDirection}
color={
getDirectionColor(
rotationDirection
)
}
/>

</div>

</div>


{/* =====================================================
MARKET CONFIRMATION
===================================================== */}

<div
style={{
marginBottom: "18px"
}}
>

<SectionTitle>
Market Confirmation
</SectionTitle>


<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(auto-fit, minmax(140px, 1fr))",
gap: "10px"
}}
>

<StatusCard
title="Breadth"
value={
breadthConfirmed
? "CONFIRMED"
: "WEAK"
}
color={
getBooleanColor(
breadthConfirmed
)
}
/>


<StatusCard
title="Participation"
value={
participationHealthy
? "SUPPORTING"
: "WEAK"
}
color={
getBooleanColor(
participationHealthy
)
}
/>


<StatusCard
title="Liquidity"
value={
liquiditySupported
? "SUPPORTING"
: "NOT CONFIRMED"
}
color={
getBooleanColor(
liquiditySupported
)
}
/>


<StatusCard
title="Fragility"
value={
lowFragility
? "LOW"
: "ELEVATED"
}
color={
lowFragility
? "#52c41a"
: "#fa8c16"
}
/>

</div>

</div>


{/* =====================================================
ROTATION QUALITY
===================================================== */}

<div
style={{
marginBottom: "18px"
}}
>

<SectionTitle>
Rotation Quality
</SectionTitle>


<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(auto-fit, minmax(140px, 1fr))",
gap: "10px"
}}
>

<StatusCard
title="Rotation Health"
value={
rotationHealthy
? "HEALTHY"
: "DETERIORATING"
}
color={
rotationHealthy
? "#52c41a"
: "#fa8c16"
}
/>


<StatusCard
title="Rotation Decay"
value={
decayWarning
? "WARNING"
: "NORMAL"
}
color={
decayWarning
? "#fa8c16"
: "#52c41a"
}
/>


<StatusCard
title="Breadth Thrust"
value={
breadthThrustActive
? "ACTIVE"
: "NONE"
}
color={
breadthThrustActive
? "#52c41a"
: "#666"
}
/>


<StatusCard
title="Mega Cap Risk"
value={
megaCapRisk
? "WARNING"
: "LOW"
}
color={
megaCapRisk
? "#fa8c16"
: "#52c41a"
}
/>

</div>

</div>


{/* =====================================================
RISK FLAGS
===================================================== */}

<div
style={{
marginBottom: "18px"
}}
>

<SectionTitle>
Risk Flags
</SectionTitle>


<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(auto-fit, minmax(140px, 1fr))",
gap: "10px"
}}
>

<StatusCard
title="False Break"
value={
falseBreakRisk
? "DETECTED"
: "LOW"
}
color={
falseBreakRisk
? "#fa8c16"
: "#52c41a"
}
/>


<StatusCard
title="Squeeze Risk"
value={
squeezeRisk
? "ELEVATED"
: "LOW"
}
color={
squeezeRisk
? "#fa8c16"
: "#52c41a"
}
/>


<StatusCard
title="Signal State"
value={state}
color={
getStateColor(state)
}
/>


<StatusCard
title="Quality"
value={quality}
color={
getQualityColor(quality)
}
/>

</div>

</div>


{/* =====================================================
SUMMARY
===================================================== */}

<div
style={{
marginTop: "18px",
padding: "12px",
background: "#141414",
border: "1px solid #222"
}}
>

<SectionTitle>
Engine Summary
</SectionTitle>


<div
style={{
fontSize: "12px",
color: "#aaa",
lineHeight: 1.6,
wordBreak: "break-word"
}}
>
{summary}
</div>

</div>


</div>

);

}
