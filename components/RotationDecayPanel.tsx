// /components/RotationDecayPanel.tsx

"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function RotationDecayPanel({
rotationDecay,
rotationConfirm,
fragility,
liquidity,
squeeze,
participation
}: any) {

if (!rotationDecay) return null;

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

/* =====================================================
PROMINENT DECAY COLOR SYSTEM
Institutional emphasis
===================================================== */

function decaySeverityColor(value: number) {

if (value >= 75) {
return "#ff4d4f";
}

if (value >= 55) {
return "#ff7875";
}

if (value >= 35) {
return "#faad14";
}

return "#52c41a";
}

function decayBackground(value: number) {

if (value >= 75) {
return "rgba(255,77,79,0.12)";
}

if (value >= 55) {
return "rgba(255,120,117,0.10)";
}

if (value >= 35) {
return "rgba(250,173,20,0.10)";
}

return "rgba(82,196,26,0.08)";
}

function bar(value: number, inverse = false) {

const pct =
Math.max(0, Math.min(100, value));

return {
width: `${pct}%`,
height: "8px",
background:
inverse
? inverseColor(value)
: metricColor(value),
borderRadius: "6px",
transition: "all 0.3s ease"
};
}

/* =====================================================
DATA
===================================================== */

const decayScore =
Number(rotationDecay?.score ?? 0);

const decayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";

const momentumQuality =
Number(
rotationDecay?.momentumQuality ?? 50
);

const exhaustion =
Number(
rotationDecay?.breadthExhaustion ?? 0
);

const leadershipNarrowing =
Number(
rotationDecay?.leadershipNarrowing ?? 0
);

const liquidityStress =
Number(
liquidity?.stress ?? 0
);

const fragilityScore =
Number(
fragility?.score ?? 0
);

const squeezeRisk =
Number(
squeeze?.risk ?? 0
);

const participationScore =
Number(
participation?.score ?? 50
);

const falseBreakRisk =
Number(
rotationConfirm?.falseBreakRisk ?? 0
);

/* =====================================================
STATE COLOR
===================================================== */

function stateColor() {

if (
decayState ===
"ROTATION_FAILURE"
) {
return "#ff4d4f";
}

if (
decayState ===
"INTERNAL_BREAKDOWN"
) {
return "#ff7875";
}

if (
decayState ===
"EARLY_DECAY"
) {
return "#faad14";
}

return "#52c41a";
}

/* =====================================================
PROMINENT CONTAINER
===================================================== */

const containerBorder =
decaySeverityColor(decayScore);

const containerGlow =
decayBackground(decayScore);

/* =====================================================
RENDER
===================================================== */

return (

<div style={{
background: "#0d0d0d",
border: `2px solid ${containerBorder}`,
padding: "18px",
boxShadow:
decayScore >= 55
? `0 0 18px ${containerGlow}`
: "none",
transition: "all 0.35s ease"
}}>

{/* =====================================================
HEADER
===================================================== */}

<div style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
marginBottom: "18px"
}}>

<div>

<h3 style={{
color: "#ddd",
marginBottom: "4px",
fontSize: "18px",
fontWeight: 700,
letterSpacing: "0.5px"
}}>
ROTATION DECAY
</h3>

<div style={{
fontSize: "11px",
color: "#666",
textTransform: "uppercase",
letterSpacing: "1px"
}}>
Institutional Internal Stress Engine
</div>

</div>

<div style={{
textAlign: "right"
}}>

<div style={{
fontSize: "34px",
fontWeight: 800,
lineHeight: 1,
color:
decaySeverityColor(decayScore)
}}>
{decayScore}
</div>

<div style={{
fontSize: "11px",
color: "#777",
marginTop: "4px"
}}>
DECAY SCORE
</div>

</div>

</div>

{/* =====================================================
MAIN ALERT ZONE
===================================================== */}

<div style={{
padding: "14px",
background: containerGlow,
border: `1px solid ${containerBorder}`,
marginBottom: "22px"
}}>

<div style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center"
}}>

<div>

<div style={{
fontSize: "11px",
color: "#777",
marginBottom: "4px"
}}>
CURRENT STATE
</div>

<div style={{
fontSize: "22px",
fontWeight: 800,
color: stateColor()
}}>
{decayState}
</div>

</div>

<div style={{
textAlign: "right"
}}>

<div style={{
fontSize: "11px",
color: "#777"
}}>
INTERNAL ROTATION
</div>

<div style={{
fontSize: "14px",
fontWeight: 700,
color:
decaySeverityColor(decayScore)
}}>
{decayScore >= 55
? "STRUCTURALLY WEAKENING"
: decayScore >= 35
? "EARLY EROSION"
: "HEALTHY"
}
</div>

</div>

</div>

<div style={{
height: "10px",
background: "#1c1c1c",
marginTop: "14px",
borderRadius: "8px",
overflow: "hidden"
}}>

<div style={{
width: `${decayScore}%`,
height: "100%",
background:
decaySeverityColor(decayScore),
transition: "all 0.4s ease"
}} />

</div>

</div>

{/* =====================================================
PRIMARY METRICS
===================================================== */}

<div style={{
display: "grid",
gridTemplateColumns: "1fr",
gap: "18px",
marginBottom: "24px"
}}>

{/* MOMENTUM */}

<div>

<div style={{
display: "flex",
justifyContent: "space-between",
marginBottom: "6px"
}}>

<div>
Momentum Quality
</div>

<div style={{
color: metricColor(momentumQuality),
fontWeight: "bold"
}}>
{momentumQuality}/100
</div>

</div>

<div style={{
height: "8px",
background: "#222",
borderRadius: "6px",
overflow: "hidden"
}}>
<div style={bar(momentumQuality)} />
</div>

</div>

{/* EXHAUSTION */}

<div>

<div style={{
display: "flex",
justifyContent: "space-between",
marginBottom: "6px"
}}>

<div>
Breadth Exhaustion
</div>

<div style={{
color: inverseColor(exhaustion),
fontWeight: "bold"
}}>
{exhaustion}/100
</div>

</div>

<div style={{
height: "8px",
background: "#222",
borderRadius: "6px",
overflow: "hidden"
}}>
<div style={bar(exhaustion, true)} />
</div>

</div>

{/* LEADERSHIP */}

<div>

<div style={{
display: "flex",
justifyContent: "space-between",
marginBottom: "6px"
}}>

<div>
Narrow Leadership Risk
</div>

<div style={{
color: inverseColor(
leadershipNarrowing
),
fontWeight: "bold"
}}>
{leadershipNarrowing}/100
</div>

</div>

<div style={{
height: "8px",
background: "#222",
borderRadius: "6px",
overflow: "hidden"
}}>
<div style={
bar(
leadershipNarrowing,
true
)
} />
</div>

</div>

</div>

{/* =====================================================
OVERLAYS
===================================================== */}

<div style={{
marginTop: "8px"
}}>

<div style={{
color: "#666",
fontSize: "11px",
marginBottom: "12px",
textTransform: "uppercase",
letterSpacing: "1px"
}}>
Internal Stress Overlays
</div>

<div style={{
display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: "10px"
}}>

<OverlayCard
title="FRAGILITY"
value={fragilityScore}
color={inverseColor(fragilityScore)}
critical={fragilityScore >= 55}
/>

<OverlayCard
title="LIQUIDITY STRESS"
value={liquidityStress}
color={inverseColor(liquidityStress)}
critical={liquidityStress >= 50}
/>

<OverlayCard
title="SQUEEZE RISK"
value={squeezeRisk}
color={inverseColor(squeezeRisk)}
critical={squeezeRisk >= 55}
/>

<OverlayCard
title="PARTICIPATION"
value={participationScore}
color={metricColor(participationScore)}
critical={participationScore < 45}
/>

</div>

</div>

{/* =====================================================
FALSE BREAK
===================================================== */}

<div style={{
marginTop: "24px",
paddingTop: "18px",
borderTop: "1px solid #222"
}}>

<div style={{
display: "flex",
justifyContent: "space-between",
marginBottom: "6px"
}}>

<div>
False Break Probability
</div>

<div style={{
color: inverseColor(
falseBreakRisk
),
fontWeight: "bold"
}}>
{falseBreakRisk}/100
</div>

</div>

<div style={{
height: "8px",
background: "#222",
borderRadius: "6px",
overflow: "hidden"
}}>
<div style={
bar(
falseBreakRisk,
true
)
} />
</div>

</div>

{/* =====================================================
INSTITUTIONAL FOOTER
===================================================== */}

{decayScore >= 35 && (

<div style={{
marginTop: "22px",
padding: "12px",
background: decayBackground(decayScore),
border: `1px solid ${containerBorder}`,
fontSize: "12px",
lineHeight: 1.6,
color: "#cfcfcf"
}}>

<strong style={{
color: decaySeverityColor(decayScore)
}}>
Institutional Warning:
</strong>

{" "}

Rotation decay indicates internal participation erosion beneath headline index stability. This is now treated as a primary structural signal.

</div>

)}

</div>
);
}

/* =====================================================
OVERLAY CARD
===================================================== */

function OverlayCard({
title,
value,
color,
critical
}: any) {

return (

<div style={{
border:
critical
? "1px solid rgba(255,120,117,0.35)"
: "1px solid #222",
padding: "12px",
background:
critical
? "rgba(255,120,117,0.05)"
: "#111",
transition: "all 0.3s ease"
}}>

<div style={{
fontSize: "11px",
color: "#666",
marginBottom: "4px"
}}>
{title}
</div>

<div style={{
color,
fontWeight: "bold",
fontSize: "18px"
}}>
{value}
</div>

</div>
);
}
