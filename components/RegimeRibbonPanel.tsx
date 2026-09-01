"use client";

type Props = {
executionState?: any;
regimeSync?: any;
dangerZone?: any;
phase?: string;
};

/* ======================================================
HELPERS
====================================================== */

function normalizeValue(
value: any,
fallback = "N/A"
): string {
if (
value === undefined ||
value === null ||
value === ""
) {
return fallback;
}

return String(value);
}

/* ======================================================
PHASE COLORS
Aktuelle 7-Phase Architecture
====================================================== */

function getPhaseColor(phase?: string) {
switch (phase) {
case "PHASE_1":
case "PHASE_1_EXPANSION":
return "#52c41a";

case "PHASE_2":
case "PHASE_2_WARNING":
return "#95de64";

case "PHASE_3":
case "PHASE_3_DISTRIBUTION":
return "#fadb14";

case "PHASE_4":
case "PHASE_4_RISK":
return "#fa8c16";

case "PHASE_5":
case "PHASE_5_BREAKDOWN":
return "#ff7875";

case "PHASE_6":
case "PHASE_6_ACCELERATION":
return "#ff4d4f";

case "PHASE_7":
case "PHASE_7_CAPITULATION":
return "#a8071a";

default:
return "#666";
}
}

/* ======================================================
PHASE DISPLAY
====================================================== */

function getPhaseLabel(phase?: string) {
switch (phase) {
case "PHASE_1_EXPANSION":
return "PHASE 1 · EXPANSION";

case "PHASE_2_WARNING":
return "PHASE 2 · WARNING";

case "PHASE_3_DISTRIBUTION":
return "PHASE 3 · DISTRIBUTION";

case "PHASE_4_RISK":
return "PHASE 4 · RISK";

case "PHASE_5_BREAKDOWN":
return "PHASE 5 · BREAKDOWN";

case "PHASE_6_ACCELERATION":
return "PHASE 6 · ACCELERATION";

case "PHASE_7_CAPITULATION":
return "PHASE 7 · CAPITULATION";

default:
return normalizeValue(
phase,
"UNKNOWN PHASE"
);
}
}

/* ======================================================
MARKET MODE
====================================================== */

function getModeColor(mode?: string) {
switch (mode) {
case "RISK_ON":
return "#52c41a";

case "RISK_OFF":
case "RISK":
return "#ff4d4f";

case "TRANSITION":
return "#faad14";

case "NEUTRAL":
return "#aaa";

default:
return "#888";
}
}

/* ======================================================
RISK STATE
====================================================== */

function getRiskColor(risk?: string) {
switch (risk) {
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

function getDangerColor(level?: string) {
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

function getSyncColor(
state?: string,
aligned?: boolean
) {
if (aligned === true) {
return "#52c41a";
}

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
TACTICAL BIAS
====================================================== */

function getBiasColor(bias?: string) {
switch (bias) {
case "BULLISH":
case "LONG":
return "#52c41a";

case "BEARISH":
case "SHORT":
return "#ff4d4f";

case "DEFENSIVE":
return "#fa8c16";

default:
return "#aaa";
}
}

/* ======================================================
URGENCY
====================================================== */

function getUrgencyColor(urgency?: string) {
switch (urgency) {
case "EXTREME":
return "#ff4d4f";

case "HIGH":
return "#ff7875";

case "MEDIUM":
return "#faad14";

case "LOW":
return "#52c41a";

default:
return "#888";
}
}

/* ======================================================
EXECUTION MODE
====================================================== */

function getExecutionColor(
executionMode?: string
) {
switch (executionMode) {
case "ATTACK":
case "AGGRESSIVE_ENTRY":
return "#ff4d4f";

case "BUILD":
case "DEFENSIVE_BUILD":
return "#fa8c16";

case "ADD_ON_PULLBACKS":
return "#40a9ff";

case "HOLD":
return "#52c41a";

case "WAIT":
case "NO_TRADE":
return "#888";

default:
return "#40a9ff";
}
}

/* ======================================================
COMPONENT
====================================================== */

export default function RegimeRibbonPanel({
executionState,
regimeSync,
dangerZone,
phase
}: Props) {

/*
=======================================================
SAFE DATA EXTRACTION
=======================================================
*/

const currentPhase =
phase ??
executionState?.phase ??
executionState?.marketPhase ??
"UNKNOWN";

const marketMode =
executionState?.marketMode ??
executionState?.mode ??
"NEUTRAL";

const tacticalBias =
executionState?.tacticalBias ??
executionState?.bias ??
"NEUTRAL";

const executionMode =
executionState?.executionMode ??
executionState?.action ??
"WAIT";

const riskState =
executionState?.riskState ??
executionState?.risk ??
"STABLE";

const urgency =
executionState?.urgency ??
"LOW";

const confidence =
Number(
executionState?.confidence ??
regimeSync?.confidence ??
0
);

const regimeAligned =
executionState?.regimeAlignment ??
regimeSync?.aligned ??
false;

const regimeState =
regimeSync?.state ??
(
regimeAligned
? "ALIGNED"
: "UNSTABLE"
);

const dangerLevel =
dangerZone?.level ??
"LOW";


/*
=======================================================
COLORS
=======================================================
*/

const phaseColor =
getPhaseColor(currentPhase);

const modeColor =
getModeColor(marketMode);

const riskColor =
getRiskColor(riskState);

const syncColor =
getSyncColor(
regimeState,
regimeAligned
);

const dangerColor =
getDangerColor(dangerLevel);

const executionColor =
getExecutionColor(executionMode);

const biasColor =
getBiasColor(tacticalBias);

const urgencyColor =
getUrgencyColor(urgency);


/*
=======================================================
SUMMARY
=======================================================
*/

const summary =
`${marketMode} | ${tacticalBias} | ${executionMode}`;


/*
=======================================================
BLOCK
=======================================================
*/

function block(
label: string,
value: string,
color: string
) {
return (
<div className="regime-ribbon-block">

<div className="regime-ribbon-label">
{label}
</div>

<div
className="regime-ribbon-value"
style={{
color
}}
>
{value}
</div>

</div>
);
}


/*
=======================================================
RENDER
=======================================================
*/

return (
<>
<style jsx>{`

.regime-ribbon {
background: #0d0d0d;
border-radius: 8px;
padding: 16px;
margin-bottom: 16px;
}

.regime-ribbon-header {
margin-bottom: 14px;
display: flex;
justify-content: space-between;
align-items: center;
gap: 12px;
}

.regime-ribbon-title {
color: #999;
font-size: 13px;
font-weight: bold;
letter-spacing: 0.5px;
}

.regime-ribbon-confidence {
font-size: 12px;
font-weight: bold;
white-space: nowrap;
}

.regime-ribbon-summary {
margin-bottom: 16px;
padding: 12px;
font-weight: bold;
text-align: center;
font-size: 14px;
border-radius: 6px;
word-break: break-word;
}

.regime-ribbon-grid {
display: grid;
grid-template-columns:
repeat(6, minmax(0, 1fr));
gap: 10px;
}

.regime-ribbon-block {
padding: 10px;
border: 1px solid #333;
background: #111;
text-align: center;
min-height: 72px;
border-radius: 6px;

display: flex;
flex-direction: column;
justify-content: center;

min-width: 0;
}

.regime-ribbon-label {
font-size: 10px;
color: #666;
margin-bottom: 6px;
letter-spacing: 0.5px;
}

.regime-ribbon-value {
font-weight: bold;
font-size: 13px;
line-height: 1.25;

overflow-wrap: anywhere;
word-break: break-word;
}

.regime-ribbon-footer {
margin-top: 14px;
padding-top: 12px;
border-top: 1px solid #222;

display: flex;
justify-content: space-between;
align-items: center;
gap: 12px;

font-size: 11px;
color: #666;
}

.regime-ribbon-footer-item {
white-space: nowrap;
}

@media (max-width: 1100px) {

.regime-ribbon-grid {
grid-template-columns:
repeat(3, minmax(0, 1fr));
}

}

@media (max-width: 700px) {

.regime-ribbon {
padding: 12px;
}

.regime-ribbon-header {
align-items: flex-start;
flex-direction: column;
}

.regime-ribbon-grid {
grid-template-columns:
repeat(2, minmax(0, 1fr));
gap: 8px;
}

.regime-ribbon-block {
min-height: 68px;
padding: 9px;
}

.regime-ribbon-value {
font-size: 12px;
}

.regime-ribbon-summary {
font-size: 12px;
padding: 10px;
}

.regime-ribbon-footer {
flex-wrap: wrap;
justify-content: flex-start;
}

}

@media (max-width: 420px) {

.regime-ribbon-grid {
grid-template-columns: 1fr;
}

.regime-ribbon-footer {
flex-direction: column;
align-items: flex-start;
gap: 6px;
}

}

`}</style>


<div
className="regime-ribbon"
style={{
border:
`1px solid ${phaseColor}`
}}
>

{/* =================================================
HEADER
================================================= */}

<div className="regime-ribbon-header">

<div className="regime-ribbon-title">
REGIME COMMAND CENTER
</div>

<div
className="regime-ribbon-confidence"
style={{
color: phaseColor
}}
>
Confidence: {confidence}%
</div>

</div>


{/* =================================================
SUMMARY
================================================= */}

<div
className="regime-ribbon-summary"
style={{
border:
`1px solid ${phaseColor}`,

color: phaseColor,

background:
"rgba(255,255,255,0.02)"
}}
>
{summary}
</div>


{/* =================================================
COMMAND GRID
================================================= */}

<div className="regime-ribbon-grid">

{block(
"PHASE",
getPhaseLabel(currentPhase),
phaseColor
)}

{block(
"MODE",
normalizeValue(marketMode),
modeColor
)}

{block(
"RISK",
normalizeValue(riskState),
riskColor
)}

{block(
"REGIME SYNC",
normalizeValue(regimeState),
syncColor
)}

{block(
"DANGER",
normalizeValue(dangerLevel),
dangerColor
)}

{block(
"EXECUTION",
normalizeValue(executionMode),
executionColor
)}

</div>


{/* =================================================
FOOTER
================================================= */}

<div className="regime-ribbon-footer">

<div className="regime-ribbon-footer-item">

Bias:{" "}

<span
style={{
color: biasColor,
fontWeight: "bold"
}}
>
{normalizeValue(tacticalBias)}
</span>

</div>


<div className="regime-ribbon-footer-item">

Urgency:{" "}

<span
style={{
color: urgencyColor,
fontWeight: "bold"
}}
>
{normalizeValue(urgency)}
</span>

</div>


<div className="regime-ribbon-footer-item">

Alignment:{" "}

<span
style={{
color:
regimeAligned
? "#52c41a"
: "#ff4d4f",

fontWeight: "bold"
}}
>
{regimeAligned
? "CONFIRMED"
: "UNSTABLE"}
</span>

</div>

</div>

</div>
</>
);
}
