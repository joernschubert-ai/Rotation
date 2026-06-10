// /components/panels/SuperSignalPanel.tsx

"use client";

export default function SuperSignalPanel({
superSignal
}: any) {

if (!superSignal) return null;

/* =====================================================
SAFE
===================================================== */

const {
active,
type,
strength,
priority,
message,

quality,
conviction,

institutionalScore,

regimeAligned,
rotationConfirmed,

falseBreakRisk,
squeezeRisk,
fragility,

executionBias,

components
} = superSignal;

/* =====================================================
COLORS
===================================================== */

function getStrengthColor(v: number) {

if (v >= 85) return "#52c41a";
if (v >= 70) return "#95de64";
if (v >= 55) return "#fadb14";
if (v >= 40) return "#fa8c16";

return "#ff4d4f";
}

function getRiskColor(v: string) {

switch (v) {

case "LOW":
return "#52c41a";

case "MODERATE":
return "#fadb14";

case "HIGH":
return "#fa8c16";

case "EXTREME":
return "#ff4d4f";

default:
return "#999";
}
}

function getQualityColor(v: string) {

switch (v) {

case "INSTITUTIONAL":
return "#52c41a";

case "CONFIRMED":
return "#95de64";

case "TACTICAL":
return "#faad14";

case "EARLY":
return "#fa8c16";

case "LOW":
return "#ff4d4f";

default:
return "#999";
}
}

/* =====================================================
BLOCK
===================================================== */

function block(
title: string,
value: any,
color = "#999"
) {

return (
<div
style={{
background: "#111",
border: "1px solid #222",
padding: "12px"
}}
>

<div
style={{
fontSize: "11px",
color: "#666",
marginBottom: "6px"
}}
>
{title}
</div>

<div
style={{
fontWeight: "bold",
color,
fontSize: "15px"
}}
>
{value}
</div>

</div>
);
}

/* =====================================================
HEADER COLOR
===================================================== */

const headerColor =
active
? getStrengthColor(strength)
: "#666";

/* =====================================================
RENDER
===================================================== */

return (

<div
style={{
background: "#0d0d0d",
border: `1px solid ${headerColor}`,
padding: "16px"
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
marginBottom: "14px"
}}
>

<h3
style={{
margin: 0,
fontSize: "15px",
color: headerColor
}}
>
SUPER SIGNAL
</h3>

<div
style={{
fontSize: "12px",
fontWeight: "bold",
color: getQualityColor(quality)
}}
>
{quality}
</div>

</div>

{/* =====================================================
MAIN SIGNAL
===================================================== */}

<div
style={{
padding: "14px",
background: "#111",
border: `1px solid ${headerColor}`,
marginBottom: "16px"
}}
>

<div
style={{
fontSize: "22px",
fontWeight: "bold",
color: headerColor,
marginBottom: "6px"
}}
>
{type}
</div>

<div
style={{
fontSize: "13px",
color: "#ccc",
marginBottom: "10px"
}}
>
{message}
</div>

<div
style={{
display: "flex",
gap: "18px",
flexWrap: "wrap",
fontSize: "12px"
}}
>

<div>
Strength:
{" "}
<span style={{
color: getStrengthColor(strength),
fontWeight: "bold"
}}>
{strength}
</span>
</div>

<div>
Priority:
{" "}
<span style={{
color: priority === "HIGH"
? "#ff4d4f"
: priority === "MEDIUM"
? "#faad14"
: "#999",
fontWeight: "bold"
}}>
{priority}
</span>
</div>

<div>
Institutional:
{" "}
<span style={{
color: getStrengthColor(institutionalScore),
fontWeight: "bold"
}}>
{institutionalScore}
</span>
</div>

</div>

</div>

{/* =====================================================
GRID
===================================================== */}

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(3, 1fr)",
gap: "12px"
}}
>

{block(
"CONVICTION",
conviction,
getStrengthColor(conviction)
)}

{block(
"EXECUTION",
executionBias,
"#40a9ff"
)}

{block(
"REGIME",
regimeAligned
? "ALIGNED"
: "MISALIGNED",

regimeAligned
? "#52c41a"
: "#ff4d4f"
)}

{block(
"ROTATION",
rotationConfirmed
? "CONFIRMED"
: "UNCONFIRMED",

rotationConfirmed
? "#52c41a"
: "#faad14"
)}

{block(
"FALSE BREAK",
falseBreakRisk,
getRiskColor(falseBreakRisk)
)}

{block(
"SQUEEZE RISK",
squeezeRisk,
getRiskColor(squeezeRisk)
)}

{block(
"FRAGILITY",
fragility,
getRiskColor(fragility)
)}

{block(
"ACTIVE",
active
? "YES"
: "NO",

active
? "#52c41a"
: "#999"
)}

{block(
"QUALITY",
quality,
getQualityColor(quality)
)}

</div>

{/* =====================================================
COMPONENTS
===================================================== */}

{components && (

<div style={{ marginTop: "18px" }}>

<div
style={{
fontSize: "12px",
color: "#666",
marginBottom: "8px"
}}
>
COMPONENTS
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(4, 1fr)",
gap: "10px"
}}
>

{Object.entries(components).map(
([key, value]: any) => (

<div
key={key}
style={{
background: "#111",
padding: "8px",
border: "1px solid #222"
}}
>

<div
style={{
fontSize: "10px",
color: "#666",
marginBottom: "4px",
textTransform: "uppercase"
}}
>
{key}
</div>

<div
style={{
fontWeight: "bold",
color: getStrengthColor(Number(value))
}}
>
{value}
</div>

</div>

)
)}

</div>

</div>

)}

</div>

);

}
