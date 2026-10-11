"use client";

type Props = {
executionState: any;
regimeSync: any;
dangerZone: any;
phase: string;
};

/* =====================================================
REGIME RIBBON PANEL

Purpose:
- Compact display of existing engine states
- No score recalculation
- No artificial confidence fallback
- No modification of trading decisions
- Preserve original engine semantics
===================================================== */

/* =====================================================
SAFE HELPERS
===================================================== */

function safeText(
value: unknown,
fallback = "N/A"
): string {
if (
typeof value === "string" &&
value.trim().length > 0
) {
return value;
}

if (
typeof value === "number" &&
Number.isFinite(value)
) {
return String(value);
}

return fallback;
}

function safeConfidence(
value: unknown
): number | null {
if (
value === null ||
value === undefined ||
value === ""
) {
return null;
}

if (
typeof value !== "number" &&
typeof value !== "string"
) {
return null;
}

const parsed = Number(value);

if (
!Number.isFinite(parsed) ||
parsed < 0 ||
parsed > 100
) {
return null;
}

return parsed;
}

function safeBoolean(
value: unknown
): boolean | null {
if (typeof value === "boolean") {
return value;
}

if (value === 1 || value === "1") {
return true;
}

if (value === 0 || value === "0") {
return false;
}

if (typeof value === "string") {
const normalized =
value.trim().toLowerCase();

if (normalized === "true") {
return true;
}

if (normalized === "false") {
return false;
}
}

return null;
}

/* =====================================================
COLORS
===================================================== */

function getPhaseColor(
phaseValue: string
): string {
const value =
safeText(phaseValue, "").toUpperCase();

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

function getModeColor(
mode: string
): string {
switch (mode.toUpperCase()) {
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

function getRiskColor(
risk: string
): string {
switch (risk.toUpperCase()) {
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

function getDangerColor(
level: string
): string {
switch (level.toUpperCase()) {
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

function getSyncColor(
state: string
): string {
switch (state.toUpperCase()) {
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

function getBiasColor(
bias: string
): string {
switch (bias.toUpperCase()) {
case "BULLISH":
case "LONG":
case "LONG_INDEX":
return "#52c41a";

case "BEARISH":
case "SHORT":
case "SHORT_INDEX":
return "#ff4d4f";

default:
return "#aaa";
}
}

function getUrgencyColor(
urgency: string
): string {
switch (urgency.toUpperCase()) {
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

/* =====================================================
SMALL DISPLAY BLOCK
===================================================== */

function RibbonBlock({
label,
value,
color,
}: {
label: string;
value: string;
color: string;
}) {
return (
<div
style={{
padding: "10px",
border: `1px solid ${color}`,
background: "#111",
textAlign: "center",
minHeight: "72px",
borderRadius: "6px",
minWidth: 0,
}}
>
<div
style={{
fontSize: "10px",
color: "#666",
marginBottom: "6px",
letterSpacing: "0.5px",
whiteSpace: "nowrap",
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
overflowWrap: "anywhere",
}}
>
{value}
</div>
</div>
);
}

/* =====================================================
MAIN PANEL
===================================================== */

export default function RegimeRibbonPanel({
executionState,
regimeSync,
dangerZone,
phase,
}: Props) {
if (!executionState) {
return null;
}

const phaseValue =
safeText(phase, "UNKNOWN");

const marketMode =
safeText(
executionState.marketMode,
"UNKNOWN"
);

const riskState =
safeText(executionState.riskState);

const syncState =
safeText(regimeSync?.state);

const dangerLevel =
safeText(dangerZone?.level);

const executionMode =
safeText(
executionState.executionMode,
"WAIT"
);

const tacticalBias =
safeText(
executionState.tacticalBias,
"NEUTRAL"
);

const urgency =
safeText(
executionState.urgency,
"N/A"
);

/*
* Display only the confidence supplied
* by the execution engine.
*
* Do not substitute phase, rotation,
* or AI Research confidence.
*/
const confidence =
safeConfidence(
executionState.confidence
);

const confidenceText =
confidence === null
? "—"
: `${confidence.toLocaleString("de-DE", {
maximumFractionDigits: 1,
})}%`;

/*
* Alignment may originate from either
* executionState or regimeSync.
*
* Explicit false must be preserved.
* Unknown must not become false
* or a fabricated confirmation.
*/
const executionAlignment =
safeBoolean(
executionState.regimeAlignment
);

const syncAlignment =
safeBoolean(
regimeSync?.aligned
);

const regimeAlignment =
executionAlignment ?? syncAlignment;

const alignmentText =
regimeAlignment === true
? "CONFIRMED"
: regimeAlignment === false
? "UNSTABLE"
: "UNKNOWN";

const alignmentColor =
regimeAlignment === true
? "#52c41a"
: regimeAlignment === false
? "#ff4d4f"
: "#888";

const phaseColor =
getPhaseColor(phaseValue);

const summary =
`${marketMode} | ` +
`${tacticalBias} | ` +
`${executionMode}`;

return (
<div
style={{
background: "#0d0d0d",
border: `1px solid ${phaseColor}`,
padding: "16px",
marginBottom: "16px",
borderRadius: "8px",
width: "100%",
boxSizing: "border-box",
}}
>
{/* HEADER */}

<div
style={{
marginBottom: "14px",
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: "12px",
flexWrap: "wrap",
}}
>
<div
style={{
color: "#999",
fontSize: "13px",
fontWeight: "bold",
letterSpacing: "0.5px",
}}
>
REGIME COMMAND CENTER
</div>

<div
style={{
color:
confidence === null
? "#888"
: phaseColor,
fontSize: "12px",
fontWeight: "bold",
}}
>
Execution Confidence:{" "}
{confidenceText}
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
borderRadius: "6px",
overflowWrap: "anywhere",
}}
>
{summary}
</div>

{/* STATE GRID */}

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(auto-fit, minmax(120px, 1fr))",
gap: "10px",
width: "100%",
}}
>
<RibbonBlock
label="PHASE"
value={phaseValue}
color={phaseColor}
/>

<RibbonBlock
label="MODE"
value={marketMode}
color={getModeColor(marketMode)}
/>

<RibbonBlock
label="RISK"
value={riskState}
color={getRiskColor(riskState)}
/>

<RibbonBlock
label="REGIME SYNC"
value={syncState}
color={getSyncColor(syncState)}
/>

<RibbonBlock
label="DANGER"
value={dangerLevel}
color={getDangerColor(dangerLevel)}
/>

<RibbonBlock
label="EXECUTION"
value={executionMode}
color="#40a9ff"
/>
</div>

{/* FOOTER */}

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
color: "#666",
}}
>
<div>
Bias:{" "}
<span
style={{
color: getBiasColor(tacticalBias),
fontWeight: "bold",
}}
>
{tacticalBias}
</span>
</div>

<div>
Urgency:{" "}
<span
style={{
color: getUrgencyColor(urgency),
fontWeight: "bold",
}}
>
{urgency}
</span>
</div>

<div>
Alignment:{" "}
<span
style={{
color: alignmentColor,
fontWeight: "bold",
}}
>
{alignmentText}
</span>
</div>
</div>
</div>
);
}

