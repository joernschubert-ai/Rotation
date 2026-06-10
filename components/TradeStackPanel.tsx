// /components/TradeStackPanel.tsx

"use client";

export default function TradeStackPanel({
tradeStack,
sizing,
rotationConfirm
}: any) {

if (!tradeStack) return null;

/* ======================================================
SAFE ACCESS
====================================================== */

const stack = tradeStack ?? {};

const edge =
stack?.edge ?? {};

const edgeScore =
Number(edge?.score ?? 0);

const edgeTier =
edge?.tier ?? "NO_EDGE";

const meta =
stack?.meta ?? {};

const size =
Number(sizing?.size ?? 0);

const sizingMode =
sizing?.mode ?? "DEFENSIVE";

/* ======================================================
COLORS
====================================================== */

function getTypeColor(type: string) {

switch (type) {

case "SHORT":
return "#ff4d4f";

case "LONG":
return "#52c41a";

default:
return "#666";
}
}

function getEdgeColor(score: number) {

if (score >= 80) return "#ff4d4f";
if (score >= 60) return "#fa8c16";
if (score >= 40) return "#fadb14";
if (score >= 20) return "#73d13d";

return "#666";
}

function getEdgeLabel(score: number) {

if (score >= 80) return "EXTREME ASYMMETRY";
if (score >= 60) return "STRONG EDGE";
if (score >= 40) return "TRADEABLE";
if (score >= 20) return "EARLY EDGE";

return "NO EDGE";
}

function getModeColor(mode: string) {

switch (mode) {

case "AGGRESSIVE":
return "#ff4d4f";

case "ACTIVE":
return "#fa8c16";

case "PROBING":
return "#fadb14";

case "DEFENSIVE":
return "#52c41a";

default:
return "#666";
}
}

function getRotationColor(state: string) {

switch (state) {

case "INSTITUTIONAL_CONFIRMATION":
return "#52c41a";

case "CONFIRMED":
return "#73d13d";

case "CONFIRMING":
return "#faad14";

case "EARLY":
return "#999";

default:
return "#666";
}
}

/* ======================================================
FLOW BAR
====================================================== */

function renderFlowBar() {

const totalBars = 5;

const strength =
Number(stack?.strength ?? 0);

const activeBars =
Math.max(
0,
Math.min(
5,
Math.round(strength / 20)
)
);

const bars = [];

for (let i = 0; i < totalBars; i++) {

let active = false;

if (stack.type === "SHORT") {
active = i < activeBars;
}

if (stack.type === "LONG") {
active =
i >= totalBars - activeBars;
}

bars.push(

<div
key={i}
style={{
flex: 1,
height: "10px",
background:
active
? getTypeColor(stack.type)
: "#222",
marginRight:
i < totalBars - 1
? "4px"
: "0",
borderRadius: "2px"
}}
/>

);
}

return (

<div
style={{
display: "flex",
marginTop: "10px"
}}
>
{bars}
</div>

);
}

/* ======================================================
EXECUTION TEXT
====================================================== */

function getExecutionExplanation() {

if (edgeScore < 20) {
return {
text:
"No statistical edge → no meaningful exposure",
color: "#666"
};
}

if (edgeScore < 40) {
return {
text:
"Early edge detected → probing size only",
color: "#73d13d"
};
}

if (edgeScore < 60) {
return {
text:
"Tradeable setup → controlled exposure",
color: "#fadb14"
};
}

if (edgeScore < 80) {
return {
text:
"Strong asymmetric setup → active positioning",
color: "#fa8c16"
};
}

return {
text:
"Extreme asymmetry → aggressive execution allowed",
color: "#ff4d4f"
};
}

const executionExplanation =
getExecutionExplanation();

/* ======================================================
RENDER
====================================================== */

return (

<div
style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "16px"
}}
>

{/* HEADER */}

<div
style={{
marginBottom: "14px",
display: "flex",
justifyContent: "space-between",
alignItems: "center"
}}
>

<div
style={{
color: "#888",
fontWeight: "bold",
fontSize: "14px"
}}
>
TRADE STACK
</div>

<div
style={{
color: getModeColor(sizingMode),
fontSize: "12px",
fontWeight: "bold"
}}
>
{sizingMode}
</div>

</div>

{/* PRIMARY FLOW */}

<div
style={{
marginBottom: "16px",
padding: "14px",
border: `1px solid ${getTypeColor(stack.type)}`,
background: "#111"
}}
>

<div
style={{
color: "#666",
fontSize: "11px",
marginBottom: "6px"
}}
>
PRIMARY FLOW
</div>

<div
style={{
color: getTypeColor(stack.type),
fontWeight: "bold",
fontSize: "18px"
}}
>
{stack.state}
</div>

<div
style={{
color: "#888",
fontSize: "12px"
}}
>
{stack.driver}
</div>

{renderFlowBar()}

<div
style={{
marginTop: "8px",
color: "#666",
fontSize: "11px"
}}
>
Trade Strength: {stack.strength ?? 0}/100
</div>

</div>

{/* EDGE */}

<div
style={{
marginBottom: "16px",
padding: "14px",
border: `1px solid ${getEdgeColor(edgeScore)}`,
background: "#111"
}}
>

<div
style={{
color: "#666",
fontSize: "11px"
}}
>
CENTRAL EDGE SYSTEM
</div>

<div
style={{
color: getEdgeColor(edgeScore),
fontWeight: "bold",
fontSize: "24px"
}}
>
{edgeScore}/100
</div>

<div
style={{
color: getEdgeColor(edgeScore),
fontSize: "13px"
}}
>
{getEdgeLabel(edgeScore)}
</div>

<div
style={{
color: "#888",
fontSize: "11px",
marginTop: "4px"
}}
>
{edgeTier}
</div>

<div
style={{
marginTop: "10px",
color: executionExplanation.color,
fontSize: "12px"
}}
>
{executionExplanation.text}
</div>

</div>

{/* ROTATION */}

{rotationConfirm && (

<div
style={{
marginBottom: "16px",
padding: "12px",
border: `1px solid ${getRotationColor(rotationConfirm.state)}`,
background: "#111"
}}
>

<div
style={{
color: "#666",
fontSize: "11px"
}}
>
ROTATION CONFIRMATION
</div>

<div
style={{
color: getRotationColor(rotationConfirm.state),
fontWeight: "bold",
fontSize: "16px"
}}
>
{rotationConfirm.state}
</div>

<div
style={{
marginTop: "6px",
fontSize: "12px",
color: "#888"
}}
>
Confidence: {rotationConfirm.confidence ?? 0}%
</div>

</div>

)}

{/* NEW INSTITUTIONAL OVERLAY */}

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(2, 1fr)",
gap: "12px",
marginBottom: "16px"
}}
>

<div style={{ background: "#111", padding: "12px", border: "1px solid #222" }}>
<div style={{ color: "#666", fontSize: "11px" }}>ROTATION CONF.</div>
<div style={{ color: "#40a9ff", fontWeight: "bold" }}>
{meta.rotationConfidence ?? 0}%
</div>
</div>

<div style={{ background: "#111", padding: "12px", border: "1px solid #222" }}>
<div style={{ color: "#666", fontSize: "11px" }}>ROTATION DECAY</div>
<div style={{ color: "#ff7875", fontWeight: "bold" }}>
{meta.decayScore ?? 0}
</div>
</div>

<div style={{ background: "#111", padding: "12px", border: "1px solid #222" }}>
<div style={{ color: "#666", fontSize: "11px" }}>REGIME ALIGNMENT</div>
<div style={{
color: meta.regimeAligned ? "#52c41a" : "#ff4d4f",
fontWeight: "bold"
}}>
{meta.regimeAligned ? "YES" : "NO"}
</div>
</div>

<div style={{ background: "#111", padding: "12px", border: "1px solid #222" }}>
<div style={{ color: "#666", fontSize: "11px" }}>INSTITUTIONAL</div>
<div style={{
color: meta.institutionalAligned ? "#52c41a" : "#ff4d4f",
fontWeight: "bold"
}}>
{meta.institutionalAligned ? "ALIGNED" : "MISALIGNED"}
</div>
</div>

</div>

{/* POSITIONING */}

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(2, 1fr)",
gap: "12px"
}}
>

<div
style={{
border: "1px solid #222",
background: "#111",
padding: "12px"
}}
>

<div
style={{
color: "#666",
fontSize: "11px"
}}
>
POSITION SIZE
</div>

<div
style={{
color: "#40a9ff",
fontWeight: "bold",
fontSize: "22px"
}}
>
{size}%
</div>

</div>

<div
style={{
border: "1px solid #222",
background: "#111",
padding: "12px"
}}
>

<div
style={{
color: "#666",
fontSize: "11px"
}}
>
DIRECTION
</div>

<div
style={{
color: getTypeColor(stack.type),
fontWeight: "bold",
fontSize: "18px"
}}
>
{stack.type}
</div>

</div>

</div>

</div>
);
}
