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
return "#6ee7b7";
}

if (value >= 72) {
return "#a7f3d0";
}

if (value >= 52) {
return "#fcd34d";
}

return "#fda4af";
}


function getQualityColor(value: string) {

switch (value) {

case "INSTITUTIONAL":
return "#6ee7b7";

case "CONFIRMED":
return "#a7f3d0";

case "TACTICAL":
return "#fcd34d";

case "LOW":
return "#fda4af";

default:
return "#94a3b8";
}
}


function getStateColor(value: string) {

switch (value) {

case "HIGH_CONVICTION":
return "#6ee7b7";

case "CONFIRMED":
return "#a7f3d0";

case "BUILDING":
return "#fcd34d";

case "EARLY":
return "#fdba74";

case "INVALID":
return "#64748b";

default:
return "#94a3b8";
}
}


function getPriorityColor(value: string) {

switch (value) {

case "HIGH":
return "#fda4af";

case "MEDIUM":
return "#fcd34d";

case "LOW":
return "#64748b";

default:
return "#94a3b8";
}
}


function getDirectionColor(value: string) {

switch (value) {

case "BULLISH":
return "#6ee7b7";

case "BEARISH":
return "#fda4af";

case "NEUTRAL":
return "#94a3b8";

default:
return "#94a3b8";
}
}


function getBooleanColor(
value: boolean,
positive = "#6ee7b7"
) {

return value
? positive
: "#64748b";
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
? "#6ee7b7"
: isShort
? "#fda4af"
: "#94a3b8";


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
? "#6ee7b7"
: rotationConfirming
? "#fcd34d"
: "#64748b";


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
background: "#334155",
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
background: "#121d2a",
border: "1px solid #334155",
padding: "12px",
minWidth: 0
}}
>

<div
style={{
fontSize: "10px",
color: "#64748b",
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
color: color ?? "#e2e8f0",
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
color: "#94a3b8"
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
color: "#64748b",
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
? "#64748b"
: getScoreColor(institutionalScore);


/* =====================================================
RENDER
===================================================== */

return (

<div
style={{
background: "#0e1722",
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
color: "#64748b"
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
background: "#121d2a",
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
color: "#64748b",
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
color: "#64748b",
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
color: "#64748b"
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
? "#6ee7b7"
: "#475569"
}`,
color:
active
? "#6ee7b7"
: "#94a3b8",
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
? "#6ee7b7"
: "#475569"
}`,
color:
trigger
? "#6ee7b7"
: "#94a3b8",
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
? "#6ee7b7"
: "#fda4af"
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
? "#6ee7b7"
: "#fcd34d"
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
? "#6ee7b7"
: "#fdba74"
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
? "#6ee7b7"
: "#fdba74"
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
? "#fdba74"
: "#6ee7b7"
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
? "#6ee7b7"
: "#64748b"
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
? "#fdba74"
: "#6ee7b7"
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
? "#fdba74"
: "#6ee7b7"
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
? "#fdba74"
: "#6ee7b7"
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
background: "#121d2a",
border: "1px solid #334155"
}}
>

<SectionTitle>
Engine Summary
</SectionTitle>


<div
style={{
fontSize: "12px",
color: "#cbd5e1",
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
