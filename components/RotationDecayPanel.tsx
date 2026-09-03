// /components/RotationDecayPanel.tsx

"use client";

import React from "react";

/* ============================================================
ROTATION DECAY PANEL
============================================================

Visualisiert ausschließlich:

rotationDecayEngine.ts

Konvention:

Hoher Decay Score
=
schlechter werdende interne Marktstruktur.

0
=
gesunde Rotation

100
=
strukturell erschöpfte Rotation

WICHTIG:

Dieses Panel trifft KEINE Trade-Entscheidung.

Es visualisiert ausschließlich:

- Qualität der Marktrotation
- Participation Decay
- Breadth Decay
- Leadership Decay
- Divergence Pressure
- Persistence
- Structural Pressure
- Liquidity Dependence
- Fragility Pressure
- Distribution
- Recovery

============================================================ */

interface RotationDecayPanelProps {
rotationDecay?: any;

fragility?: any;
liquidity?: any;
squeeze?: any;
participation?: any;

rotationConfirm?: any;
}

/* ============================================================
HELPERS
============================================================ */

function clamp(value: number, min = 0, max = 100) {
if (!Number.isFinite(value)) {
return min;
}

return Math.max(
min,
Math.min(max, value)
);
}

function num(value: any, fallback = 0): number {

if (
typeof value === "number" &&
Number.isFinite(value)
) {
return value;
}

if (
value !== null &&
typeof value === "object"
) {

const candidates = [
value.score,
value.value,
value.risk,
value.current,
value.stress
];

for (const candidate of candidates) {

const numeric = Number(candidate);

if (Number.isFinite(numeric)) {
return numeric;
}
}
}

return fallback;
}

/* ============================================================
DECAY COLOR
============================================================ */

function decayColor(value: number) {

if (value >= 80) {
return "#ff4d4f";
}

if (value >= 65) {
return "#ff7875";
}

if (value >= 50) {
return "#faad14";
}

if (value >= 35) {
return "#ffd666";
}

return "#52c41a";
}

function decayBackground(value: number) {

if (value >= 80) {
return "rgba(255,77,79,0.14)";
}

if (value >= 65) {
return "rgba(255,120,117,0.11)";
}

if (value >= 50) {
return "rgba(250,173,20,0.10)";
}

if (value >= 35) {
return "rgba(255,214,102,0.08)";
}

return "rgba(82,196,26,0.08)";
}

/* ============================================================
QUALITY COLOR

Hoher Wert = gut

============================================================ */

function qualityColor(value: number) {

if (value >= 75) {
return "#52c41a";
}

if (value >= 60) {
return "#95de64";
}

if (value >= 45) {
return "#faad14";
}

if (value >= 30) {
return "#ff7875";
}

return "#ff4d4f";
}

/* ============================================================
BOOLEAN BADGE
============================================================ */

function booleanColor(value: boolean) {

return value
? "#ff4d4f"
: "#52c41a";
}

function booleanLabel(
value: boolean,
trueLabel = "YES",
falseLabel = "NO"
) {

return value
? trueLabel
: falseLabel;
}

/* ============================================================
STATE CONFIG
============================================================ */

function getStateConfig(state: string) {

switch (state) {

case "EXHAUSTED_ROTATION":

return {
label: "EXHAUSTED ROTATION",
color: "#ff4d4f",
description:
"Internal deterioration broadly confirmed"
};

case "DISTRIBUTION_ROTATION":

return {
label: "DISTRIBUTION ROTATION",
color: "#ff7875",
description:
"Distribution characteristics dominate"
};

case "NARROW_ROTATION":

return {
label: "NARROW ROTATION",
color: "#faad14",
description:
"Market increasingly dependent on narrow leadership"
};

case "FRAGILE_ROTATION":

return {
label: "FRAGILE ROTATION",
color: "#ffd666",
description:
"Breadth and participation require confirmation"
};

case "MATURE_ROTATION":

return {
label: "MATURE ROTATION",
color: "#95de64",
description:
"Rotation maturing; internals beginning to soften"
};

case "HEALTHY_ROTATION":

default:

return {
label: "HEALTHY ROTATION",
color: "#52c41a",
description:
"Healthy rotational market structure"
};
}
}

/* ============================================================
COMPONENT BAR
============================================================ */

function DecayBar({
label,
value,
description
}: {
label: string;
value: number;
description?: string;
}) {

const safeValue =
clamp(
Number(value)
);

const color =
decayColor(safeValue);

return (

<div
style={{
marginBottom: "16px"
}}
>

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
marginBottom: "5px"
}}
>

<div>

<div
style={{
color: "#cfcfcf",
fontSize: "13px"
}}
>
{label}
</div>

{description && (

<div
style={{
color: "#666",
fontSize: "10px",
marginTop: "2px"
}}
>
{description}
</div>

)}

</div>

<div
style={{
color,
fontWeight: 800,
fontSize: "14px"
}}
>
{Math.round(safeValue)}
</div>

</div>

<div
style={{
height: "7px",
background: "#222",
borderRadius: "6px",
overflow: "hidden"
}}
>

<div
style={{
width: `${safeValue}%`,
height: "100%",
background: color,
borderRadius: "6px",
transition: "width 0.35s ease"
}}
/>

</div>

</div>
);
}

/* ============================================================
QUALITY BAR
============================================================ */

function QualityBar({
label,
value,
description
}: {
label: string;
value: number;
description?: string;
}) {

const safeValue =
clamp(
Number(value)
);

const color =
qualityColor(safeValue);

return (

<div
style={{
marginBottom: "16px"
}}
>

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
marginBottom: "5px"
}}
>

<div>

<div
style={{
color: "#cfcfcf",
fontSize: "13px"
}}
>
{label}
</div>

{description && (

<div
style={{
color: "#666",
fontSize: "10px",
marginTop: "2px"
}}
>
{description}
</div>

)}

</div>

<div
style={{
color,
fontWeight: 800,
fontSize: "14px"
}}
>
{Math.round(safeValue)}
</div>

</div>

<div
style={{
height: "7px",
background: "#222",
borderRadius: "6px",
overflow: "hidden"
}}
>

<div
style={{
width: `${safeValue}%`,
height: "100%",
background: color,
borderRadius: "6px",
transition: "width 0.35s ease"
}}
/>

</div>

</div>
);
}

/* ============================================================
FLAG CARD
============================================================ */

function FlagCard({
label,
active,
trueText,
falseText
}: {
label: string;
active: boolean;
trueText?: string;
falseText?: string;
}) {

const color =
booleanColor(active);

return (

<div
style={{
border: `1px solid ${
active
? "rgba(255,77,79,0.45)"
: "rgba(82,196,26,0.25)"
}`,

background:
active
? "rgba(255,77,79,0.06)"
: "rgba(82,196,26,0.035)",

padding: "12px"
}}
>

<div
style={{
fontSize: "10px",
color: "#777",
marginBottom: "6px",
letterSpacing: "0.5px"
}}
>
{label}
</div>

<div
style={{
fontSize: "13px",
fontWeight: 800,
color
}}
>
{active
? trueText ?? "ACTIVE"
: falseText ?? "CLEAR"}
</div>

</div>
);
}

/* ============================================================
PANEL
============================================================ */

export default function RotationDecayPanel({
rotationDecay,
fragility = {},
liquidity = {},
squeeze = {},
participation = {},
rotationConfirm = {}
}: RotationDecayPanelProps) {

if (!rotationDecay) {
return null;
}

/* ==========================================================
PRIMARY DATA
========================================================== */

const decayScore =
clamp(
num(
rotationDecay.score,
0
)
);

const decayState =
rotationDecay.state ??
"HEALTHY_ROTATION";

const stateConfig =
getStateConfig(
decayState
);

const momentumQuality =
clamp(
num(
rotationDecay.momentumQuality,
100 - decayScore
)
);

/* ==========================================================
ENGINE SCORES
========================================================== */

const participationScore =
clamp(
num(
rotationDecay.participationScore,
num(participation, 50)
)
);

const breadthVelocityScore =
clamp(
num(
rotationDecay.breadthVelocityScore,
50
)
);

const divergenceScore =
clamp(
num(
rotationDecay.divergenceScore,
0
)
);

const breadthExhaustionScore =
clamp(
num(
rotationDecay.breadthExhaustionScore,
0
)
);

const narrowLeadershipScore =
clamp(
num(
rotationDecay.narrowLeadershipScore,
0
)
);

const distributionRisk =
clamp(
num(
rotationDecay.distributionRisk,
0
)
);

const recoveryScore =
clamp(
num(
rotationDecay.recoveryScore,
0
)
);

/* ==========================================================
FLAGS
========================================================== */

const breadthExhaustion =
Boolean(
rotationDecay.breadthExhaustion
);

const narrowLeadershipRisk =
Boolean(
rotationDecay.narrowLeadershipRisk
);

const institutionalDistribution =
Boolean(
rotationDecay.institutionalDistribution
);

const rotationRecovery =
Boolean(
rotationDecay.rotationRecovery
);

/* ==========================================================
COMPONENTS
========================================================== */

const components =
rotationDecay.components ?? {};

const participationDecay =
clamp(
num(
components.participationDecay,
100 - participationScore
)
);

const breadthDecay =
clamp(
num(
components.breadthDecay,
breadthVelocityScore
)
);

const leadershipDecay =
clamp(
num(
components.leadershipDecay,
narrowLeadershipScore
)
);

const divergencePressure =
clamp(
num(
components.divergencePressure,
divergenceScore
)
);

const persistencePressure =
clamp(
num(
components.persistencePressure,
0
)
);

const structuralPressure =
clamp(
num(
components.structuralPressure,
0
)
);

const liquidityDependence =
clamp(
num(
components.liquidityDependence,
0
)
);

const fragilityPressure =
clamp(
num(
components.fragilityPressure,
0
)
);

/* ==========================================================
HISTORY
========================================================== */

const history =
rotationDecay.history ?? {};

const phasePersistence =
num(
history.phasePersistence,
0
);

const daysInPhase =
num(
history.daysInPhase,
0
);

const participationDecayHistory =
num(
history.participationDecay,
0
);

const breadthTrend =
num(
history.breadthTrend,
0
);

const breadthAcceleration =
num(
history.breadthAcceleration,
0
);

const institutionalPressure =
clamp(
num(
history.institutionalPressure,
0
)
);

const averageBreadth =
clamp(
num(
history.averageBreadth,
50
)
);

const averageParticipation =
clamp(
num(
history.averageParticipation,
50
)
);

const averageRotation =
clamp(
num(
history.averageRotation,
50
)
);

/* ==========================================================
EXTERNAL OVERLAYS
========================================================== */

const fragilityScore =
clamp(
num(
fragility,
0
)
);

const liquidityScore =
clamp(
num(
liquidity,
50
)
);

const squeezeRisk =
clamp(
num(
squeeze,
0
)
);

const falseBreakRisk =
clamp(
num(
rotationConfirm?.falseBreakRisk,
0
)
);

/* ==========================================================
SUMMARY TEXT
========================================================== */

const summary =
rotationDecay.summary ??
stateConfig.description;

/* ==========================================================
RENDER
========================================================== */

return (

<div
style={{
background: "#0d0d0d",

border:
`2px solid ${decayColor(decayScore)}`,

padding: "18px",

boxShadow:
decayScore >= 50
? `0 0 20px ${decayBackground(decayScore)}`
: "none",

transition: "all 0.35s ease"
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
marginBottom: "18px"
}}
>

<div>

<h3
style={{
color: "#ddd",
margin: 0,
fontSize: "18px",
fontWeight: 800,
letterSpacing: "0.5px"
}}
>
ROTATION DECAY
</h3>

<div
style={{
fontSize: "10px",
color: "#666",
marginTop: "5px",
letterSpacing: "1px",
textTransform: "uppercase"
}}
>
Internal Market Structure
</div>

</div>

<div
style={{
textAlign: "right"
}}
>

<div
style={{
color:
decayColor(decayScore),

fontSize: "38px",

lineHeight: 1,

fontWeight: 900
}}
>
{decayScore}
</div>

<div
style={{
fontSize: "10px",
color: "#666",
marginTop: "5px"
}}
>
DECAY SCORE
</div>

</div>

</div>

{/* =====================================================
STATE ZONE
===================================================== */}

<div
style={{
padding: "15px",

border:
`1px solid ${stateConfig.color}`,

background:
decayBackground(decayScore),

marginBottom: "22px"
}}
>

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center"
}}
>

<div>

<div
style={{
color: "#777",
fontSize: "10px",
marginBottom: "5px"
}}
>
CURRENT ROTATION STATE
</div>

<div
style={{
color:
stateConfig.color,

fontWeight: 900,

fontSize: "20px"
}}
>
{stateConfig.label}
</div>

</div>

<div
style={{
textAlign: "right"
}}
>

<div
style={{
color: "#777",
fontSize: "10px"
}}
>
MOMENTUM QUALITY
</div>

<div
style={{
color:
qualityColor(momentumQuality),

fontWeight: 800,

fontSize: "18px",

marginTop: "4px"
}}
>
{Math.round(momentumQuality)}
</div>

</div>

</div>

<div
style={{
height: "9px",
background: "#1d1d1d",
marginTop: "15px",
borderRadius: "8px",
overflow: "hidden"
}}
>

<div
style={{
width: `${decayScore}%`,
height: "100%",
background:
decayColor(decayScore),

transition:
"width 0.4s ease"
}}
/>

</div>

</div>

{/* =====================================================
CORE QUALITY
===================================================== */}

<div
style={{
marginBottom: "24px"
}}
>

<div
style={{
color: "#666",
fontSize: "10px",
marginBottom: "14px",
letterSpacing: "1px",
textTransform: "uppercase"
}}
>
Rotation Quality
</div>

<QualityBar
label="Momentum Quality"
value={momentumQuality}
description="Inverse of structural rotation decay"
/>

<QualityBar
label="Participation"
value={participationScore}
description="Breadth of market participation"
/>

<QualityBar
label="Recovery Score"
value={recoveryScore}
description="Potential internal recovery"
/>

</div>

{/* =====================================================
STRUCTURAL DECAY COMPONENTS
===================================================== */}

<div
style={{
borderTop: "1px solid #222",
paddingTop: "20px",
marginBottom: "24px"
}}
>

<div
style={{
color: "#666",
fontSize: "10px",
marginBottom: "16px",
letterSpacing: "1px",
textTransform: "uppercase"
}}
>
Decay Drivers
</div>

<DecayBar
label="Participation Decay"
value={participationDecay}
description="Loss of broad market participation"
/>

<DecayBar
label="Breadth Decay"
value={breadthDecay}
description="Deterioration of breadth momentum"
/>

<DecayBar
label="Leadership Decay"
value={leadershipDecay}
description="Increasing concentration of leadership"
/>

<DecayBar
label="Divergence Pressure"
value={divergencePressure}
description="Internal market divergence"
/>

<DecayBar
label="Persistence Pressure"
value={persistencePressure}
description="Duration and persistence of deterioration"
/>

<DecayBar
label="Structural Pressure"
value={structuralPressure}
description="Breadth and long-term structural weakness"
/>

<DecayBar
label="Liquidity Dependence"
value={liquidityDependence}
description="Index stability dependent on liquidity"
/>

<DecayBar
label="Fragility Pressure"
value={fragilityPressure}
description="Structural fragility amplifier"
/>

</div>

{/* =====================================================
CRITICAL STRUCTURE
===================================================== */}

<div
style={{
borderTop: "1px solid #222",
paddingTop: "20px",
marginBottom: "24px"
}}
>

<div
style={{
color: "#666",
fontSize: "10px",
marginBottom: "14px",
letterSpacing: "1px",
textTransform: "uppercase"
}}
>
Critical Structure
</div>

<DecayBar
label="Breadth Exhaustion Score"
value={breadthExhaustionScore}
description="Breadth deterioration beneath the index surface"
/>

<DecayBar
label="Narrow Leadership Risk"
value={narrowLeadershipScore}
description="Dependence on concentrated market leadership"
/>

<DecayBar
label="Distribution Risk"
value={distributionRisk}
description="Probability of structural distribution characteristics"
/>

</div>

{/* =====================================================
STRUCTURE FLAGS
===================================================== */}

<div
style={{
borderTop: "1px solid #222",
paddingTop: "20px",
marginBottom: "24px"
}}
>

<div
style={{
color: "#666",
fontSize: "10px",
marginBottom: "14px",
letterSpacing: "1px",
textTransform: "uppercase"
}}
>
Structure Confirmation
</div>

<div
style={{
display: "grid",
gridTemplateColumns:
"1fr 1fr",

gap: "10px"
}}
>

<FlagCard
label="BREADTH EXHAUSTION"
active={breadthExhaustion}
trueText="ACTIVE"
falseText="CLEAR"
/>

<FlagCard
label="NARROW LEADERSHIP"
active={narrowLeadershipRisk}
trueText="ACTIVE"
falseText="BROAD"
/>

<FlagCard
label="INSTITUTIONAL DISTRIBUTION"
active={institutionalDistribution}
trueText="CONFIRMED"
falseText="NOT CONFIRMED"
/>

<FlagCard
label="ROTATION RECOVERY"
active={rotationRecovery}
trueText="RECOVERY"
falseText="NO RECOVERY"
/>

</div>

</div>

{/* =====================================================
HISTORICAL CONTEXT
===================================================== */}

<div
style={{
borderTop: "1px solid #222",
paddingTop: "20px",
marginBottom: "24px"
}}
>

<div
style={{
color: "#666",
fontSize: "10px",
marginBottom: "14px",
letterSpacing: "1px",
textTransform: "uppercase"
}}
>
Historical Context
</div>

<HistoryRow
label="Phase Persistence"
value={phasePersistence}
/>

<HistoryRow
label="Days In Phase"
value={daysInPhase}
/>

<HistoryRow
label="Participation Decay"
value={participationDecayHistory}
/>

<HistoryRow
label="Breadth Trend"
value={breadthTrend}
signed
/>

<HistoryRow
label="Breadth Acceleration"
value={breadthAcceleration}
signed
/>

<HistoryRow
label="Institutional Pressure"
value={institutionalPressure}
/>

</div>

{/* =====================================================
LONG TERM STRUCTURE
===================================================== */}

<div
style={{
borderTop: "1px solid #222",
paddingTop: "20px",
marginBottom: "24px"
}}
>

<div
style={{
color: "#666",
fontSize: "10px",
marginBottom: "14px",
letterSpacing: "1px",
textTransform: "uppercase"
}}
>
Long-Term Averages
</div>

<QualityBar
label="Average Breadth"
value={averageBreadth}
/>

<QualityBar
label="Average Participation"
value={averageParticipation}
/>

<QualityBar
label="Average Rotation"
value={averageRotation}
/>

</div>

{/* =====================================================
EXTERNAL CONTEXT
===================================================== */}

<div
style={{
borderTop: "1px solid #222",
paddingTop: "20px",
marginBottom: "24px"
}}
>

<div
style={{
color: "#666",
fontSize: "10px",
marginBottom: "14px",
letterSpacing: "1px",
textTransform: "uppercase"
}}
>
External Context
</div>

<div
style={{
display: "grid",
gridTemplateColumns:
"1fr 1fr",

gap: "10px"
}}
>

<ContextCard
label="FRAGILITY"
value={fragilityScore}
badHigh
/>

<ContextCard
label="LIQUIDITY"
value={liquidityScore}
/>

<ContextCard
label="SQUEEZE RISK"
value={squeezeRisk}
badHigh
/>

<ContextCard
label="FALSE BREAK"
value={falseBreakRisk}
badHigh
/>

</div>

</div>

{/* =====================================================
SUMMARY
===================================================== */}

<div
style={{
borderTop:
`1px solid ${decayColor(decayScore)}`,

paddingTop: "16px"
}}
>

<div
style={{
color: "#777",
fontSize: "10px",
marginBottom: "8px",
letterSpacing: "1px",
textTransform: "uppercase"
}}
>
Engine Assessment
</div>

<div
style={{
color: "#d0d0d0",
fontSize: "12px",
lineHeight: 1.6
}}
>
{summary}
</div>

</div>

</div>
);
}

/* ============================================================
HISTORY ROW
============================================================ */

function HistoryRow({
label,
value,
signed = false
}: {
label: string;
value: number;
signed?: boolean;
}) {

const numeric =
Number(value ?? 0);

let color = "#aaa";

if (signed) {

color =
numeric < 0
? "#ff7875"
: numeric > 0
? "#52c41a"
: "#888";

} else {

color =
numeric >= 65
? "#ff7875"
: numeric >= 40
? "#faad14"
: "#aaa";
}

return (

<div
style={{
display: "flex",
justifyContent: "space-between",
marginBottom: "9px"
}}
>

<span
style={{
color: "#888",
fontSize: "12px"
}}
>
{label}
</span>

<span
style={{
color,
fontSize: "12px",
fontWeight: 700
}}
>
{signed && numeric > 0
? "+"
: ""}

{numeric.toFixed(1)}
</span>

</div>
);
}

/* ============================================================
CONTEXT CARD
============================================================ */

function ContextCard({
label,
value,
badHigh = false
}: {
label: string;
value: number;
badHigh?: boolean;
}) {

const safeValue =
clamp(
Number(value ?? 0)
);

const color =
badHigh
? decayColor(safeValue)
: qualityColor(safeValue);

return (

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
fontSize: "10px",
marginBottom: "5px"
}}
>
{label}
</div>

<div
style={{
color,
fontSize: "20px",
fontWeight: 800
}}
>
{Math.round(safeValue)}
</div>

</div>
);
}
