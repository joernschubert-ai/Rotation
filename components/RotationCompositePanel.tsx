// /components/panels/RotationCompositePanel.tsx

"use client";

import RotationDecayPanel from "./RotationDecayPanel";

/* =====================================================
ROTATION COMPOSITE PANEL
=====================================================

AUFGABE

Der Rotation Composite fasst die übergeordnete
Rotation zusammen.

Er beantwortet:

- Ist eine Rotation vorhanden?
- Wie stark ist sie bestätigt?
- Wie nachhaltig ist sie?
- Unterstützen Participation und Liquidity die Rotation?
- Wie hoch ist das False-Break-Risiko?
- Wie entwickelt sich die Rotation strukturell?

WICHTIG:

Dieses Panel enthält KEIN eigenes RotationInternalsPanel.

ROTATION INTERNALS wird separat in der Page gerendert.

Dadurch gilt:

RotationCompositePanel
= Gesamtbild / Bestätigung / Kontext

RotationInternalsPanel
= interne Marktstruktur / Leadership / Distribution

RotationDecayPanel
= Alterung / Verschlechterung / Exhaustion

===================================================== */

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

function clamp(
value: number,
min = 0,
max = 100
) {
if (!Number.isFinite(value)) {
return min;
}

return Math.max(
min,
Math.min(max, value)
);
}

function metricColor(value: number) {

const safeValue =
clamp(value);

if (safeValue >= 80) {
return "#52c41a";
}

if (safeValue >= 65) {
return "#95de64";
}

if (safeValue >= 50) {
return "#faad14";
}

if (safeValue >= 35) {
return "#ff7875";
}

return "#ff4d4f";
}

/*
* Für Risikowerte:
*
* hoher Wert = schlecht
* niedriger Wert = gut
*/

function inverseColor(value: number) {
return metricColor(
100 - clamp(value)
);
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

/* =====================================================
METRIC
===================================================== */

function renderMetric(
label: string,
value: number,
inverse = false
) {

const safeValue =
clamp(
Number(value) || 0
);

const color =
inverse
? inverseColor(safeValue)
: metricColor(safeValue);

return (
<div
style={{
marginBottom: "14px",
}}
>
<div
style={{
display: "flex",
justifyContent:
"space-between",

marginBottom: "5px",

fontSize: "11px",

color: "#666",
}}
>
<span>
{label}
</span>

<span
style={{
color,
fontWeight: "bold",
}}
>
{Math.round(safeValue)}
</span>
</div>

<div
style={{
height: "6px",

background: "#222",

borderRadius: "4px",

overflow: "hidden",
}}
>
<div
style={{
width:
`${safeValue}%`,

height: "100%",

background: color,

transition:
"all 0.35s ease",
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
clamp(
Number(
rotationConfirm?.confidence ??
0
)
);

const quality =
clamp(
Number(
rotationConfirm?.quality ??
50
)
);

const sustainability =
clamp(
Number(
rotationConfirm?.sustainability ??
50
)
);

const participationQuality =
clamp(
Number(
rotationConfirm?.participation ??
50
)
);

const liquiditySupport =
clamp(
Number(
rotationConfirm?.liquiditySupport ??
50
)
);

const falseBreakRisk =
clamp(
Number(
rotationConfirm?.falseBreakRisk ??
50
)
);

const momentumQuality =
clamp(
Number(
rotationConfirm?.momentumQuality ??
50
)
);

const decayScore =
clamp(
Number(
rotationDecay?.score ??
0
)
);

const institutionalAlignment =
Boolean(
regimeSync?.aligned ??
false
);

const tacticalBias =
executionState?.tacticalBias ??
"NEUTRAL";

const executionMode =
executionState?.executionMode ??
"WAIT";

const superSignalStrength =
clamp(
Number(
superSignal?.strength ??
0
)
);

/* =====================================================
HEADER LABEL
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
TACTICAL BIAS COLOR
===================================================== */

function tacticalBiasColor() {

if (
tacticalBias === "BULLISH"
) {
return "#52c41a";
}

if (
tacticalBias === "BEARISH"
) {
return "#ff4d4f";
}

return "#faad14";
}

/* =====================================================
SUPER SIGNAL COLOR
===================================================== */

function superSignalColor() {

if (
superSignalStrength >= 70
) {
return "#52c41a";
}

if (
superSignalStrength >= 45
) {
return "#faad14";
}

return "#ff4d4f";
}

/* =====================================================
RENDER
===================================================== */

return (

<div
className="grid gap-4 md:gap-[18px]"
>

{/* =================================================
MASTER HEADER
================================================= */}

<div
style={{
background: "#0d0d0d",

border:
`1px solid ${stateColor()}`,

padding: "18px",
}}
>

{/* HEADER */}

<div
className="
mb-[18px]
flex
flex-col
gap-4
sm:flex-row
sm:items-center
sm:justify-between
"
>

<div>

<div
style={{
color: "#666",

fontSize: "11px",

marginBottom: "6px",

letterSpacing: "1px",
}}
>
ROTATION COMPOSITE
</div>

<div
style={{
color:
stateColor(),

fontSize: "24px",

fontWeight: "bold",
}}
>
{headerLabel()}
</div>

</div>

<div
className="
text-left
sm:text-right
"
>

<div
style={{
color: "#666",

fontSize: "11px",

letterSpacing: "1px",
}}
>
CONFIDENCE
</div>

<div
style={{
color:
metricColor(
confidence
),

fontSize: "28px",

fontWeight: "bold",
}}
>
{Math.round(confidence)}
</div>

</div>

</div>

{/* CONTEXT CARDS */}

<div
className="
grid
grid-cols-1
gap-3
sm:grid-cols-2
xl:grid-cols-4
"
>

{/* EXECUTION */}

<div
style={{
background: "#111",

border:
"1px solid #222",

padding: "12px",
}}
>

<div
style={{
color: "#666",

fontSize: "11px",

marginBottom: "6px",
}}
>
EXECUTION
</div>

<div
style={{
color: "#fff",

fontWeight: "bold",
}}
>
{executionMode}
</div>

</div>

{/* TACTICAL BIAS */}

<div
style={{
background: "#111",

border:
"1px solid #222",

padding: "12px",
}}
>

<div
style={{
color: "#666",

fontSize: "11px",

marginBottom: "6px",
}}
>
TACTICAL BIAS
</div>

<div
style={{
color:
tacticalBiasColor(),

fontWeight: "bold",
}}
>
{tacticalBias}
</div>

</div>

{/* REGIME SYNC */}

<div
style={{
background: "#111",

border:
"1px solid #222",

padding: "12px",
}}
>

<div
style={{
color: "#666",

fontSize: "11px",

marginBottom: "6px",
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

fontWeight: "bold",
}}
>
{institutionalAlignment
? "ALIGNED"
: "NOT ALIGNED"}
</div>

</div>

{/* SUPER SIGNAL */}

<div
style={{
background: "#111",

border:
"1px solid #222",

padding: "12px",
}}
>

<div
style={{
color: "#666",

fontSize: "11px",

marginBottom: "6px",
}}
>
SUPER SIGNAL
</div>

<div
style={{
color:
superSignalColor(),

fontWeight: "bold",
}}
>
{Math.round(
superSignalStrength
)}
</div>

</div>

</div>

</div>

{/* =================================================
ROTATION QUALITY MATRIX
================================================= */}

<div
style={{
background: "#0d0d0d",

border:
"1px solid #222",

padding: "18px",
}}
>

<h3
style={{
color: "#888",

marginBottom: "18px",

fontSize: "14px",

letterSpacing: "1px",
}}
>
ROTATION QUALITY MATRIX
</h3>

<div
className="
grid
grid-cols-1
gap-x-6
lg:grid-cols-2
"
>

<div>

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

</div>

<div>

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

</div>

</div>

{/* =================================================
ROTATION DECAY CONTEXT

WICHTIG:

RotationInternalsPanel wurde bewusst entfernt.

Das separate RotationInternalsPanel in der Page
ist jetzt die einzige Quelle für:

- Relative Leadership
- Narrow Leadership
- Broad Market Participation
- Internal Distribution
- Structure Flags

================================================= */}

<div>

<div
className="
mb-3
border-b
border-[#222]
pb-2
"
>

<div
className="
text-[10px]
uppercase
tracking-[0.12em]
text-[#666]
"
>
Structural Rotation Deterioration
</div>

</div>

<RotationDecayPanel
rotationDecay={
rotationDecay
}

rotationConfirm={
rotationConfirm
}

fragility={
fragility
}

liquidity={
liquidity
}

squeeze={
squeeze
}

participation={
participation
}
/>

</div>

</div>

);

}
