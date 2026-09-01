"use client";

import { useState } from "react";
import { getSignalColor } from "@/lib/engine/colorEngine";

export default function NasdaqPanel({
nasdaq,
exit
}: any) {

if (!nasdaq) return null;


/* =====================================================
UI STATE
===================================================== */

const [showDetails, setShowDetails] =
useState(false);

const [showHistory, setShowHistory] =
useState(false);


/* =====================================================
SAFE VALUES
===================================================== */

const decision =
nasdaq.decision ??
"NONE";

const mode =
nasdaq.mode ??
"OFF";

const strength =
typeof nasdaq.strength === "number"
? nasdaq.strength
: 0;

const execution =
nasdaq.execution ??
"NONE";

const note =
nasdaq.note ??
"No Nasdaq long opportunity";

const active =
nasdaq.active === true;

const driver =
nasdaq.driver ??
"NONE";

const sizeMultiplier =
typeof nasdaq.sizeMultiplier === "number"
? nasdaq.sizeMultiplier
: 0;

const meta =
nasdaq.meta ?? {};

const history =
nasdaq.history ?? {};


/* =====================================================
SUPER SIGNAL

UI follows ENGINE decision.
===================================================== */

function getSuperSignal() {

switch (decision) {

case "AGGRESSIVE":
return {
text: "STRONG NASDAQ LONG",
color: "#52c41a",
border: "#52c41a",
note: "High conviction Nasdaq momentum environment"
};


case "ADD":
return {
text: "ADD NASDAQ LONG",
color: "#95de64",
border: "#389e0d",
note: "Constructive Nasdaq environment – scale in"
};


case "BUILD":
return {
text: "BUILD NASDAQ LONG",
color: "#faad14",
border: "#d48806",
note: "Long setup developing – partial position only"
};


case "EARLY":
return {
text: "EARLY NASDAQ SETUP",
color: "#fa8c16",
border: "#d46b08",
note: "Early recovery environment – confirmation required"
};


case "NONE":
default:
return {
text: "NO NASDAQ LONG EDGE",
color: "#999",
border: "#333",
note: "Nasdaq CALL conditions are currently not executable"
};
}
}

const superSignal =
getSuperSignal();


/* =====================================================
EXECUTION DISPLAY
===================================================== */

function getExecutionInfo() {

switch (decision) {

case "AGGRESSIVE":
return {
action: "FAST ENTRY",
mode: "HIGH CONVICTION",
note: "Strong momentum environment"
};


case "ADD":
return {
action: "SCALE IN",
mode: "TACTICAL LONG",
note: "Increase Nasdaq exposure carefully"
};


case "BUILD":
return {
action: "SMALL PROBE",
mode: "PULLBACK LONG",
note: "Build position gradually"
};


case "EARLY":
return {
action: "WATCH",
mode: "EARLY LONG",
note: "Wait for confirmation before meaningful exposure"
};


case "NONE":
default:
return {
action: "WAIT",
mode: "OFF",
note: "No executable Nasdaq CALL setup"
};
}
}

const executionInfo =
getExecutionInfo();


/* =====================================================
EXIT / POSITION STATE
===================================================== */

function getLongExit() {

const longExit =
exit?.long ??
exit;

if (!longExit) {

if (!active) {
return {
label: "NO NEW ENTRY",
color: "#999",
note: "Nasdaq long engine is currently inactive",
sizeReduction: 0
};
}

return {
label: "LONG STRUCTURE ACTIVE",
color: "#52c41a",
note: "No explicit exit signal available",
sizeReduction: 0
};
}


const sizeReduction =
typeof longExit.sizeReduction === "number"
? longExit.sizeReduction
: typeof longExit.reduction === "number"
? longExit.reduction
: 0;


if (sizeReduction >= 80) {

return {
label: "EXIT LONG",
color: "#ff4d4f",
note: "Strong structural deterioration",
sizeReduction
};
}


if (sizeReduction >= 50) {

return {
label: "REDUCE LONG",
color: "#fa8c16",
note: "Long environment weakening",
sizeReduction
};
}


if (sizeReduction >= 30) {

return {
label: "TRIM POSITION",
color: "#fadb14",
note: "Momentum deteriorating",
sizeReduction
};
}


if (!active) {

return {
label: "NO NEW ENTRY",
color: "#999",
note: "Existing position management only",
sizeReduction
};
}


return {
label: "HOLD LONG",
color: "#52c41a",
note: "Nasdaq long structure remains valid",
sizeReduction
};
}

const exitInfo =
getLongExit();


/* =====================================================
HELPERS
===================================================== */

function formatNumber(
value: any,
digits = 0
) {

if (typeof value !== "number") {
return "N/A";
}

return value.toFixed(digits);
}


function bar(
value: number,
max: number
) {

const safeValue =
Number.isFinite(value)
? value
: 0;

const safeMax =
Number.isFinite(max) &&
max > 0
? max
: 1;

const pct =
Math.max(
0,
Math.min(
100,
(safeValue / safeMax) * 100
)
);

return {
width: `${pct}%`,
height: "6px",
background:
getSignalColor(
safeValue,
safeMax
),
transition:
"width 0.3s ease"
};
}


/* =====================================================
SAFETY STATUS
===================================================== */

const riskRegime =
meta.phase === "PHASE_3_DISTRIBUTION" ||
meta.phase === "PHASE_4_RISK" ||
meta.phase === "PHASE_5_BREAKDOWN" ||
meta.phase === "PHASE_6_ACCELERATION" ||
meta.phase === "PHASE_7_CAPITULATION";

const crashBlocked =
typeof meta.crashProbability === "number" &&
meta.crashProbability >= 55;

const putBlocked =
typeof meta.putScore === "number" &&
meta.putScore >= 8;


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
boxSizing: "border-box",
minWidth: 0,
overflow: "hidden"
}}
>


{/* =================================================
HEADER
================================================= */}

<h3
style={{
color: "#888",
marginBottom: "12px",
marginTop: 0,
fontSize: "16px"
}}
>
NASDAQ (CALLS)
</h3>


{/* =================================================
SUPER SIGNAL
================================================= */}

<div
style={{
marginBottom: "14px",
padding: "10px",
border:
`1px solid ${superSignal.border}`,
background: "#111",
textAlign: "center",
wordBreak: "break-word"
}}
>

<div
style={{
color: superSignal.color,
fontWeight: "bold"
}}
>
{superSignal.text}
</div>

<div
style={{
fontSize: "12px",
opacity: 0.7,
marginTop: "4px"
}}
>
{superSignal.note}
</div>

</div>


{/* =================================================
PRIMARY STATE
================================================= */}

<InfoRow
label="Decision"
value={decision}
color={superSignal.color}
bold
/>

<InfoRow
label="Execution"
value={executionInfo.action}
color={superSignal.color}
bold
/>

<InfoRow
label="Mode"
value={mode}
/>

<InfoRow
label="Active"
value={
active
? "YES"
: "NO"
}
color={
active
? "#52c41a"
: "#999"
}
/>


{/* =================================================
EXECUTION NOTE
================================================= */}

<div
style={{
marginBottom: "14px",
fontSize: "12px",
opacity: 0.7
}}
>
{note}
</div>


{/* =================================================
POSITION STATE
================================================= */}

<div
style={{
marginBottom: "14px",
paddingTop: "10px",
borderTop: "1px solid #222"
}}
>

<div
style={{
color: "#777",
fontSize: "11px",
marginBottom: "5px"
}}
>
POSITION STATE
</div>

<div
style={{
color: exitInfo.color,
fontWeight: "bold"
}}
>
{exitInfo.label}
</div>

<div
style={{
fontSize: "12px",
opacity: 0.7,
marginTop: "3px"
}}
>
{exitInfo.note}
</div>

{exitInfo.sizeReduction > 0 && (

<div
style={{
fontSize: "11px",
color: "#777",
marginTop: "4px"
}}
>
Reduction: {exitInfo.sizeReduction}%
</div>

)}

</div>


{/* =================================================
STRENGTH
================================================= */}

<div
style={{
marginBottom: "14px"
}}
>

<div
style={{
color: "#777",
fontSize: "12px"
}}
>
Nasdaq Long Strength
</div>

<div
style={{
color:
getSignalColor(
strength,
100
),
fontSize: "20px",
fontWeight: "bold",
marginTop: "3px"
}}
>
{strength}/100
</div>

<div
style={{
height: "6px",
background: "#222",
marginTop: "5px",
width: "100%"
}}
>

<div
style={bar(
strength,
100
)}
/>

</div>

</div>


{/* =================================================
SIZE
================================================= */}

<InfoRow
label="Suggested Size"
value={`${Math.round(sizeMultiplier * 100)}%`}
color={
sizeMultiplier >= 0.5
? "#52c41a"
: sizeMultiplier > 0
? "#faad14"
: "#999"
}
bold
/>


{/* =================================================
DRIVER
================================================= */}

<InfoRow
label="Primary Driver"
value={driver}
color={
driver === "NASDAQ_MOMENTUM"
? "#52c41a"
: driver === "NASDAQ_RELATIVE_STRENGTH"
? "#95de64"
: driver === "BALANCED_ROTATION"
? "#faad14"
: "#999"
}
/>


{/* =================================================
DETAILS TOGGLE
================================================= */}

<div
style={{
marginTop: "14px",
paddingTop: "12px",
borderTop: "1px solid #222"
}}
>

<button
onClick={() =>
setShowDetails(
!showDetails
)
}
style={{
width: "100%",
background: "#111",
border: "1px solid #333",
color: "#aaa",
padding: "9px",
cursor: "pointer",
fontSize: "12px",
textAlign: "left"
}}
>
{showDetails
? "▼ ENGINE DETAILS"
: "▶ ENGINE DETAILS"}
</button>


{showDetails && (

<div
style={{
marginTop: "12px"
}}
>


{/* =============================================
MARKET CONTEXT
============================================= */}

<SectionTitle
title="MARKET CONTEXT"
/>

<InfoRow
label="Phase"
value={
meta.phase ??
"UNKNOWN"
}
color={
riskRegime
? "#ff4d4f"
: "#52c41a"
}
/>

<InfoRow
label="Phase Confidence"
value={`${formatNumber(meta.phaseConfidence)}%`}
/>

<InfoRow
label="Crash Probability"
value={`${formatNumber(meta.crashProbability)}%`}
color={
meta.crashProbability >= 55
? "#ff4d4f"
: meta.crashProbability >= 35
? "#faad14"
: "#52c41a"
}
/>

<InfoRow
label="Crash Score"
value={formatNumber(meta.crashScore)}
color={
meta.crashScore >= 60
? "#ff4d4f"
: meta.crashScore >= 40
? "#faad14"
: "#52c41a"
}
/>


{/* =============================================
ROTATION
============================================= */}

<SectionTitle
title="ROTATION & MOMENTUM"
/>

<InfoRow
label="Rotation Score"
value={formatNumber(meta.rotationScore)}
color={
meta.rotationScore >= 70
? "#52c41a"
: meta.rotationScore >= 55
? "#95de64"
: meta.rotationScore >= 40
? "#faad14"
: "#ff4d4f"
}
/>

<InfoRow
label="Early Warning Score"
value={formatNumber(meta.earlyScore)}
color={
meta.earlyScore >= 10
? "#ff4d4f"
: "#52c41a"
}
/>

<InfoRow
label="Put Pressure"
value={formatNumber(meta.putScore)}
color={
meta.putScore >= 8
? "#ff4d4f"
: meta.putScore >= 5
? "#faad14"
: "#52c41a"
}
/>


{/* =============================================
MARKET QUALITY
============================================= */}

<SectionTitle
title="MARKET QUALITY"
/>

<InfoRow
label="Market Quality"
value={formatNumber(meta.qualityScore)}
color={
meta.qualityScore >= 60
? "#52c41a"
: meta.qualityScore >= 40
? "#faad14"
: "#ff4d4f"
}
/>

<InfoRow
label="Participation"
value={formatNumber(meta.participationScore)}
color={
meta.participationScore >= 70
? "#52c41a"
: meta.participationScore >= 50
? "#faad14"
: "#ff4d4f"
}
/>

<InfoRow
label="Breadth Thrust"
value={formatNumber(meta.breadthThrustScore)}
color={
meta.breadthThrustScore >= 70
? "#52c41a"
: meta.breadthThrustScore >= 50
? "#faad14"
: "#ff4d4f"
}
/>

<InfoRow
label="Liquidity"
value={formatNumber(meta.liquidityScore)}
color={
meta.liquidityScore >= 70
? "#52c41a"
: meta.liquidityScore >= 40
? "#faad14"
: "#ff4d4f"
}
/>

<InfoRow
label="Regime Sync"
value={formatNumber(meta.regimeSyncScore)}
color={
meta.regimeSyncScore >= 70
? "#52c41a"
: meta.regimeSyncScore >= 40
? "#faad14"
: "#ff4d4f"
}
/>

<InfoRow
label="Execution Quality"
value={formatNumber(meta.executionScore)}
color={
meta.executionScore >= 70
? "#52c41a"
: meta.executionScore >= 40
? "#faad14"
: "#ff4d4f"
}
/>


{/* =============================================
SAFETY
============================================= */}

<SectionTitle
title="SAFETY BLOCKS"
/>

<StatusRow
label="Risk Regime"
active={riskRegime}
negative
/>

<StatusRow
label="Crash Block"
active={crashBlocked}
negative
/>

<StatusRow
label="Put Pressure Block"
active={putBlocked}
negative
/>

</div>

)}

</div>


{/* =================================================
HISTORY TOGGLE
================================================= */}

<div
style={{
marginTop: "10px"
}}
>

<button
onClick={() =>
setShowHistory(
!showHistory
)
}
style={{
width: "100%",
background: "#111",
border: "1px solid #333",
color: "#aaa",
padding: "9px",
cursor: "pointer",
fontSize: "12px",
textAlign: "left"
}}
>
{showHistory
? "▼ STRUCTURAL HISTORY"
: "▶ STRUCTURAL HISTORY"}
</button>


{showHistory && (

<div
style={{
marginTop: "12px"
}}
>

<SectionTitle
title="MARKET DETERIORATION"
/>

<InfoRow
label="Breadth Trend"
value={formatNumber(
history.breadthTrend,
1
)}
/>

<InfoRow
label="Breadth Acceleration"
value={formatNumber(
history.breadthAcceleration,
1
)}
/>

<InfoRow
label="Participation Decay"
value={formatNumber(
history.participationDecay,
1
)}
/>

<InfoRow
label="Leadership Decay"
value={formatNumber(
history.leadershipDecay,
1
)}
/>

<InfoRow
label="Relative Breadth Weakness"
value={formatNumber(
history.relativeBreadthWeakness,
1
)}
/>


<SectionTitle
title="REGIME PERSISTENCE"
/>

<InfoRow
label="Phase Persistence"
value={formatNumber(
history.phasePersistence
)}
/>

<InfoRow
label="Regime Persistence"
value={formatNumber(
history.regimePersistence
)}
/>


<SectionTitle
title="STRUCTURAL FLAGS"
/>

<StatusRow
label="Deteriorating Breadth"
active={
history.deterioratingBreadth === true
}
negative
/>

<StatusRow
label="Accelerating Breadth Decay"
active={
history.acceleratingBreadthDecay === true
}
negative
/>

<StatusRow
label="Participation Erosion"
active={
history.participationErosion === true
}
negative
/>

<StatusRow
label="Severe Participation Erosion"
active={
history.severeParticipationErosion === true
}
negative
/>

<StatusRow
label="Leadership Concentration"
active={
history.leadershipConcentration === true
}
negative
/>

<StatusRow
label="Broad Participation Failure"
active={
history.broadParticipationFailure === true
}
negative
/>

<StatusRow
label="Severe Participation Failure"
active={
history.severeParticipationFailure === true
}
negative
/>

</div>

)}

</div>

</div>

);

}


/* =====================================================
INFO ROW
===================================================== */

function InfoRow({
label,
value,
color = "#ddd",
bold = false
}: any) {

return (

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "flex-start",
gap: "12px",
marginBottom: "8px",
fontSize: "12px"
}}
>

<span
style={{
color: "#777",
minWidth: 0
}}
>
{label}
</span>

<span
style={{
color,
fontWeight:
bold
? "bold"
: "normal",
textAlign: "right",
wordBreak: "break-word",
minWidth: 0
}}
>
{value}
</span>

</div>

);

}


/* =====================================================
STATUS ROW
===================================================== */

function StatusRow({
label,
active,
negative = false
}: any) {

const color =
negative
? active
? "#ff4d4f"
: "#52c41a"
: active
? "#52c41a"
: "#999";

const value =
negative
? active
? "ACTIVE"
: "CLEAR"
: active
? "CONFIRMED"
: "NO";


return (

<div
style={{
display: "flex",
justifyContent: "space-between",
gap: "12px",
marginBottom: "7px",
fontSize: "12px"
}}
>

<span
style={{
color: "#ccc",
minWidth: 0,
wordBreak: "break-word"
}}
>
{label}
</span>

<span
style={{
color,
fontWeight: "bold",
flexShrink: 0
}}
>
{value}
</span>

</div>

);

}


/* =====================================================
SECTION TITLE
===================================================== */

function SectionTitle({
title
}: any) {

return (

<div
style={{
color: "#666",
fontSize: "10px",
marginTop: "12px",
marginBottom: "8px",
paddingTop: "8px",
borderTop: "1px solid #222"
}}
>
{title}
</div>

);

}
