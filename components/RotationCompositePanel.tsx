// /components/panels/RotationCompositePanel.tsx

"use client";

import RotationInternalsPanel from "./RotationInternalsPanel";
import RotationDecayPanel from "./RotationDecayPanel";

export default function RotationCompositePanel({
rotation,
rotationConfirm,
rotationDecay,

fragility,
liquidity,
squeeze,
participation,

executionState,
regimeSync,
superSignal,
}: any) {

if (!rotation) return null;

/* =====================================================
HELPERS
===================================================== */

function metricColor(value: number) {

if (value >= 80) return "#52c41a";
if (value >= 65) return "#95de64";
if (value >= 50) return "#faad14";
if (value >= 35) return "#ff7875";

return "#ff4d4f";
}

function inverseColor(value: number) {
return metricColor(100 - value);
}

function stateColor() {

const state =
rotationConfirm?.state ??
"EARLY";

if (
state ===
"INSTITUTIONAL_CONFIRMATION"
) {
return "#52c41a";
}

if (
state ===
"CONFIRMED"
) {
return "#95de64";
}

if (
state ===
"CONFIRMING"
) {
return "#a0d911";
}

if (
state ===
"MEGA_CAP_ONLY"
) {
return "#ff7875";
}

if (
state ===
"INTERNAL_BREAKDOWN"
) {
return "#ff4d4f";
}

if (
state ===
"ROTATION_FAILURE"
) {
return "#ff4d4f";
}

return "#faad14";
}

function renderMetric(
label: string,
value: number,
inverse = false
) {

const color =
inverse
? inverseColor(value)
: metricColor(value);

return (
<div
style={{
marginBottom: "14px"
}}
>
<div
style={{
display: "flex",
justifyContent:
"space-between",
marginBottom: "4px",
fontSize: "11px",
color: "#666"
}}
>
<span>{label}</span>

<span
style={{
color,
fontWeight: "bold"
}}
>
{value}
</span>
</div>

<div
style={{
height: "6px",
background: "#222"
}}
>
<div
style={{
width: `${value}%`,
height: "100%",
background: color
}}
/>
</div>
</div>
);
}

/* =====================================================
DATA
===================================================== */

const confirmState =
rotationConfirm?.state ??
"EARLY";

const confidence =
Number(
rotationConfirm?.confidence ??
0
);

const quality =
Number(
rotationConfirm?.quality ??
50
);

const sustainability =
Number(
rotationConfirm?.sustainability ??
50
);

const participationQuality =
Number(
rotationConfirm?.participation ??
50
);

const liquiditySupport =
Number(
rotationConfirm?.liquiditySupport ??
50
);

const falseBreakRisk =
Number(
rotationConfirm?.falseBreakRisk ??
50
);

const momentumQuality =
Number(
rotationConfirm?.momentumQuality ??
50
);

const decayScore =
Number(
rotationDecay?.score ??
0
);

const institutionalAlignment =
regimeSync?.aligned ??
false;

const tacticalBias =
executionState?.tacticalBias ??
"NEUTRAL";

const executionMode =
executionState?.executionMode ??
"WAIT";

const superSignalStrength =
Number(
superSignal?.strength ??
0
);

/* =====================================================
HEADER
===================================================== */

function headerLabel() {

if (
confirmState ===
"INSTITUTIONAL_CONFIRMATION"
) {
return "INSTITUTIONAL ROTATION";
}

if (
confirmState ===
"CONFIRMED"
) {
return "CONFIRMED ROTATION";
}

if (
confirmState ===
"CONFIRMING"
) {
return "ROTATION BUILDING";
}

if (
confirmState ===
"MEGA_CAP_ONLY"
) {
return "NARROW ROTATION";
}

if (
confirmState ===
"INTERNAL_BREAKDOWN"
) {
return "INTERNAL BREAKDOWN";
}

if (
confirmState ===
"ROTATION_FAILURE"
) {
return "ROTATION FAILURE";
}

return "EARLY ROTATION";
}

/* =====================================================
RENDER
===================================================== */

return (
<div
style={{
display: "grid",
gap: "18px"
}}
>

{/* =====================================================
MASTER HEADER
===================================================== */}

<div
style={{
background: "#0d0d0d",
border: `1px solid ${stateColor()}`,
padding: "18px"
}}
>

<div
style={{
display: "flex",
justifyContent:
"space-between",
alignItems: "center",
marginBottom: "18px"
}}
>

<div>

<div
style={{
color: "#666",
fontSize: "11px",
marginBottom: "6px"
}}
>
ROTATION COMPOSITE
</div>

<div
style={{
color: stateColor(),
fontSize: "24px",
fontWeight: "bold"
}}
>
{headerLabel()}
</div>

</div>

<div
style={{
textAlign: "right"
}}
>

<div
style={{
color: "#666",
fontSize: "11px"
}}
>
CONFIDENCE
</div>

<div
style={{
color: metricColor(
confidence
),
fontSize: "28px",
fontWeight: "bold"
}}
>
{confidence}
</div>

</div>

</div>

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(4, 1fr)",
gap: "12px"
}}
>

<div
style={{
background: "#111",
border: "1px solid #222",
padding: "12px"
}}
>


<div
style={{
color: "#666",
fontSize: "11px",
marginBottom: "6px"
}}
>
EXECUTION
</div>

<div
style={{
color: "#fff",
fontWeight: "bold"
}}
>
{executionMode}
</div>

</div>

<div
style={{
background: "#111",
border: "1px solid #222",
padding: "12px"
}}
>

<div
style={{
color: "#666",
fontSize: "11px",
marginBottom: "6px"
}}
>
TACTICAL BIAS
</div>

<div
style={{
color:
tacticalBias ===
"BULLISH"
? "#52c41a"
: tacticalBias ===
"BEARISH"
? "#ff4d4f"
: "#faad14",
fontWeight: "bold"
}}
>
{tacticalBias}
</div>

</div>

<div
style={{
background: "#111",
border: "1px solid #222",
padding: "12px"
}}
>

<div
style={{
color: "#666",
fontSize: "11px",
marginBottom: "6px"
}}
>
REGIME SYNC
</div>

<div
style={{
color:
institutionalAlignment
? "#52c41a"
: "#ff7875",
fontWeight: "bold"
}}
>
{institutionalAlignment
? "ALIGNED"
: "NOT ALIGNED"}
</div>

</div>

<div
style={{
background: "#111",
border: "1px solid #222",
padding: "12px"
}}
>

<div
style={{
color: "#666",
fontSize: "11px",
marginBottom: "6px"
}}
>
SUPER SIGNAL
</div>

<div
style={{
color:
superSignalStrength >=
70
? "#52c41a"
: superSignalStrength >=
45
? "#faad14"
: "#ff4d4f",
fontWeight: "bold"
}}
>
{superSignalStrength}
</div>

</div>

</div>

</div>

{/* =====================================================
SCORE MATRIX
===================================================== */}

<div
style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "18px"
}}
>

<h3
style={{
color: "#888",
marginBottom: "18px"
}}
>
ROTATION QUALITY MATRIX
</h3>

{renderMetric(
"QUALITY",
quality
)}

{renderMetric(
"SUSTAINABILITY",
sustainability
)}

{renderMetric(
"PARTICIPATION",
participationQuality
)}

{renderMetric(
"LIQUIDITY SUPPORT",
liquiditySupport
)}

{renderMetric(
"MOMENTUM QUALITY",
momentumQuality
)}

{renderMetric(
"DECAY RISK",
decayScore,
true
)}

{renderMetric(
"FALSE BREAK RISK",
falseBreakRisk,
true
)}

</div>

{/* =====================================================
INTERNAL PANELS
===================================================== */}

<div
style={{
display: "grid",
gridTemplateColumns:
"1fr 1fr",
gap: "18px"
}}
>

<RotationInternalsPanel
rotation={rotation}
rotationConfirm={
rotationConfirm
}
/>

<RotationDecayPanel
rotationDecay={
rotationDecay
}
rotationConfirm={
rotationConfirm
}
fragility={fragility}
liquidity={liquidity}
squeeze={squeeze}
participation={
participation
}
/>

</div>

</div>
);
}
