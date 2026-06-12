"use client";

type Props = {
executionState: any;
regimeSync: any;
dangerZone: any;
phase: string;
};

export default function RegimeRibbonPanel({
executionState,
regimeSync,
dangerZone,
phase
}: Props) {
if (!executionState) return null;

/* ======================================================
REGIME COLORS
WICHTIG:
REGIME-FARBE = STRUKTURRISIKO
NICHT tacticalBias
====================================================== */

function getPhaseColor(phase: string) {
switch (phase) {
case "PHASE_1":
return "#52c41a"; // Grün

case "PHASE_2":
return "#95de64"; // Hellgrün

case "PHASE_3":
return "#fadb14"; // Gelb

case "PHASE_4":
case "PHASE_4_RISK":
return "#fa8c16"; // Orange

case "PHASE_5":
return "#ff4d4f"; // Rot

case "PHASE_6":
return "#a8071a"; // Dunkelrot

default:
return "#666";
}
}

/* ======================================================
MARKET MODE
====================================================== */

function getModeColor(mode: string) {
switch (mode) {
case "RISK_ON":
return "#52c41a";

case "RISK_OFF":
return "#ff4d4f";

case "TRANSITION":
return "#faad14";

default:
return "#888";
}
}

/* ======================================================
RISK STATE
====================================================== */

function getRiskColor(risk: string) {
switch (risk) {
case "STABLE":
return "#52c41a";

case "FRAGILE":
return "#fa8c16"; // WICHTIG → NICHT GRAU

case "BREAKDOWN":
return "#ff7875";

case "CRISIS":
return "#ff4d4f";

default:
return "#666";
}
}

/* ======================================================
DANGER ZONE
====================================================== */

function getDangerColor(level: string) {
switch (level) {
case "LOW":
return "#52c41a";

case "ELEVATED":
return "#faad14";

case "HIGH":
return "#ff7875";

case "EXTREME":
return "#ff4d4f";

default:
return "#666";
}
}

/* ======================================================
REGIME SYNCHRONISATION
====================================================== */

function getSyncColor(state: string) {
switch (state) {
case "ALIGNED":
return "#52c41a";

case "TRANSITION":
return "#faad14";

case "FRAGILE":
return "#fa8c16";

case "DIVERGING":
return "#ff4d4f";

default:
return "#666";
}
}

/* ======================================================
DATA
====================================================== */

const phaseColor = getPhaseColor(phase);

const modeColor = getModeColor(
executionState.marketMode
);

const riskColor = getRiskColor(
executionState.riskState
);

const syncColor = getSyncColor(
regimeSync?.state
);

const dangerColor = getDangerColor(
dangerZone?.level
);

/* ======================================================
BLOCK
====================================================== */

function block(
label: string,
value: string,
color: string
) {
return (
<div
style={{
padding: "10px",
border: `1px solid ${color}`,
background: "#111",
textAlign: "center",
minHeight: "72px",
borderRadius: "6px"
}}
>
<div
style={{
fontSize: "10px",
color: "#666",
marginBottom: "6px",
letterSpacing: "0.5px"
}}
>
{label}
</div>

<div
style={{
color,
fontWeight: "bold",
fontSize: "14px",
lineHeight: 1.2
}}
>
{value}
</div>
</div>
);
}

/* ======================================================
SUMMARY
====================================================== */

const summary =
`${executionState.marketMode} | ` +
`${executionState.tacticalBias} | ` +
`${executionState.executionMode}`;

/* ======================================================
RENDER
====================================================== */

return (
<div
style={{
background: "#0d0d0d",
border: `1px solid ${phaseColor}`,
padding: "16px",
marginBottom: "16px",
borderRadius: "8px"
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
color: "#999",
fontSize: "13px",
fontWeight: "bold",
letterSpacing: "0.5px"
}}
>
REGIME COMMAND CENTER
</div>

<div
style={{
color: phaseColor,
fontSize: "12px",
fontWeight: "bold"
}}
>
Confidence: {executionState.confidence}%
</div>
</div>

{/* SUMMARY */}

<div
style={{
marginBottom: "16px",
padding: "12px",
border: `1px solid ${phaseColor}`,
color: phaseColor,
background: "rgba(255,255,255,0.02)",
fontWeight: "bold",
textAlign: "center",
fontSize: "14px",
borderRadius: "6px"
}}
>
{summary}
</div>

{/* GRID */}
<div className="mb-6">
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(6, 1fr)",
gap: "10px"
}}
>
{block(
"PHASE",
phase ?? "UNKNOWN",
phaseColor
)}

{block(
"MODE",
executionState.marketMode,
modeColor
)}

{block(
"RISK",
executionState.riskState,
riskColor
)}

{block(
"REGIME",
regimeSync?.state ?? "N/A",
syncColor
)}

{block(
"DANGER",
dangerZone?.level ?? "N/A",
dangerColor
)}

{block(
"EXECUTION",
executionState.executionMode,
"#40a9ff"
)}
</div>
</div>

{/* FOOTER */}

<div
style={{
marginTop: "14px",
display: "flex",
justifyContent: "space-between",
fontSize: "11px",
color: "#666"
}}
>
<div>
Bias:{" "}
<span
style={{
color:
executionState.tacticalBias === "BULLISH"
? "#52c41a"
: executionState.tacticalBias === "BEARISH"
? "#ff4d4f"
: "#aaa"
}}
>
{executionState.tacticalBias}
</span>
</div>

<div>
Urgency:{" "}
<span
style={{
color:
executionState.urgency === "EXTREME"
? "#ff4d4f"
: executionState.urgency === "HIGH"
? "#ff7875"
: executionState.urgency === "MEDIUM"
? "#faad14"
: "#52c41a"
}}
>
{executionState.urgency}
</span>
</div>

<div>
Alignment:{" "}
<span
style={{
color:
executionState.regimeAlignment
? "#52c41a"
: "#ff4d4f"
}}
>
{executionState.regimeAlignment
? "CONFIRMED"
: "UNSTABLE"}
</span>
</div>
</div>
</div>
);
}
