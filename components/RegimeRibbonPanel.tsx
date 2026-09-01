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
PHASE COLORS

PHASE-FARBE = STRUKTURELLES MARKTRISIKO

Unterstützt sowohl alte als auch aktuelle
marketPhaseEngine States.
====================================================== */

function getPhaseColor(phaseValue: string) {
const value = String(phaseValue ?? "").toUpperCase();

if (
value === "PHASE_1" ||
value.includes("PHASE_1_EXPANSION")
) {
return "#52c41a";
}

if (
value === "PHASE_2" ||
value.includes("PHASE_2_WARNING")
) {
return "#95de64";
}

if (
value === "PHASE_3" ||
value.includes("PHASE_3_DISTRIBUTION")
) {
return "#fadb14";
}

if (
value === "PHASE_4" ||
value.includes("PHASE_4_RISK")
) {
return "#fa8c16";
}

if (
value === "PHASE_5" ||
value.includes("PHASE_5_BREAKDOWN")
) {
return "#ff4d4f";
}

if (
value === "PHASE_6" ||
value.includes("PHASE_6_ACCELERATION")
) {
return "#a8071a";
}

if (
value === "PHASE_7" ||
value.includes("PHASE_7_CAPITULATION")
) {
return "#7f1d1d";
}

return "#666";
}


/* ======================================================
MARKET MODE
====================================================== */

function getModeColor(mode: string) {
const value = String(mode ?? "").toUpperCase();

switch (value) {
case "RISK_ON":
return "#52c41a";

case "RISK_OFF":
case "RISK":
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
const value = String(risk ?? "").toUpperCase();

switch (value) {
case "STABLE":
return "#52c41a";

case "FRAGILE":
return "#fa8c16";

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
const value = String(level ?? "").toUpperCase();

switch (value) {
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

BREAKDOWN war vorher nicht berücksichtigt
und fiel deshalb auf Grau zurück.
====================================================== */

function getSyncColor(state: string) {
const value = String(state ?? "").toUpperCase();

switch (value) {
case "ALIGNED":
return "#52c41a";

case "TRANSITION":
return "#faad14";

case "FRAGILE":
return "#fa8c16";

case "DIVERGING":
return "#ff7875";

case "BREAKDOWN":
return "#ff4d4f";

case "CRISIS":
return "#a8071a";

default:
return "#666";
}
}


/* ======================================================
TACTICAL BIAS

Unterstützt die aktuelle Engine-Semantik:
- BULLISH / LONG_INDEX = Grün
- BEARISH / SHORT_INDEX = Rot
- NEUTRAL = Grau
====================================================== */

function getBiasColor(bias: string) {
const value = String(bias ?? "").toUpperCase();

switch (value) {
case "BULLISH":
case "LONG":
case "LONG_INDEX":
return "#52c41a";

case "BEARISH":
case "SHORT":
case "SHORT_INDEX":
return "#ff4d4f";

case "NEUTRAL":
case "WAIT":
return "#aaa";

default:
return "#aaa";
}
}


/* ======================================================
URGENCY
====================================================== */

function getUrgencyColor(urgency: string) {
const value = String(urgency ?? "").toUpperCase();

switch (value) {
case "EXTREME":
return "#ff4d4f";

case "HIGH":
return "#ff7875";

case "MEDIUM":
return "#faad14";

case "LOW":
return "#52c41a";

default:
return "#aaa";
}
}


/* ======================================================
DATA
====================================================== */

const phaseColor = getPhaseColor(phase);

const modeColor = getModeColor(
executionState?.marketMode
);

const riskColor = getRiskColor(
executionState?.riskState
);

const syncColor = getSyncColor(
regimeSync?.state
);

const dangerColor = getDangerColor(
dangerZone?.level
);

const biasColor = getBiasColor(
executionState?.tacticalBias
);

const urgencyColor = getUrgencyColor(
executionState?.urgency
);

const confidence =
Number(executionState?.confidence ?? 0);

const regimeAlignment =
Boolean(
executionState?.regimeAlignment ??
regimeSync?.aligned
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
borderRadius: "6px",
minWidth: 0
}}
>
<div
style={{
fontSize: "10px",
color: "#666",
marginBottom: "6px",
letterSpacing: "0.5px",
whiteSpace: "nowrap"
}}
>
{label}
</div>

<div
style={{
color,
fontWeight: "bold",
fontSize: "14px",
lineHeight: 1.2,
overflowWrap: "anywhere"
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
`${executionState?.marketMode ?? "UNKNOWN"} | ` +
`${executionState?.tacticalBias ?? "NEUTRAL"} | ` +
`${executionState?.executionMode ?? "WAIT"}`;


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
borderRadius: "8px",
width: "100%",
boxSizing: "border-box"
}}
>

{/* ==================================================
HEADER
================================================== */}

<div
style={{
marginBottom: "14px",
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: "12px",
flexWrap: "wrap"
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
Confidence: {confidence}%
</div>
</div>


{/* ==================================================
SUMMARY
================================================== */}

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
borderRadius: "6px",
overflowWrap: "anywhere"
}}
>
{summary}
</div>


{/* ==================================================
GRID

Automatisch responsive:
Desktop = mehrere Spalten
Mobile = Blöcke umbrechen
================================================== */}

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(auto-fit, minmax(120px, 1fr))",
gap: "10px",
width: "100%"
}}
>

{block(
"PHASE",
phase ?? "UNKNOWN",
phaseColor
)}

{block(
"MODE",
executionState?.marketMode ?? "N/A",
modeColor
)}

{block(
"RISK",
executionState?.riskState ?? "N/A",
riskColor
)}

{block(
"REGIME SYNC",
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
executionState?.executionMode ?? "N/A",
"#40a9ff"
)}

</div>


{/* ==================================================
FOOTER
================================================== */}

<div
style={{
marginTop: "14px",
paddingTop: "14px",
borderTop: "1px solid #2a2a2a",
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: "12px",
flexWrap: "wrap",
fontSize: "11px",
color: "#666"
}}
>

<div>
Bias:{" "}
<span
style={{
color: biasColor,
fontWeight: "bold"
}}
>
{executionState?.tacticalBias ?? "NEUTRAL"}
</span>
</div>


<div>
Urgency:{" "}
<span
style={{
color: urgencyColor,
fontWeight: "bold"
}}
>
{executionState?.urgency ?? "LOW"}
</span>
</div>


<div>
Alignment:{" "}
<span
style={{
color:
regimeAlignment
? "#52c41a"
: "#ff4d4f",
fontWeight: "bold"
}}
>
{regimeAlignment
? "CONFIRMED"
: "UNSTABLE"}
</span>
</div>

</div>

</div>
);
}
