"use client";

export default function MasterPanel({
master,
decision,
signal,
nasdaq
}: any) {

if (!master) return null;

/* =====================================================
MASTER SCORE COLOR
===================================================== */

function getMasterScoreColor() {

switch (master.mode) {

case "LONG":
return "#52c41a";

case "RISK":
return "#fa8c16";

case "CRASH":
return "#ff4d4f";

default:
return "#999";
}
}

/* =====================================================
EXPOSURE COLOR
===================================================== */

function exposureColor(exp: number) {

if (exp <= -70) return "#ff4d4f";
if (exp <= -40) return "#fa8c16";
if (exp <= -10) return "#fadb14";
if (exp >= 50) return "#52c41a";

return "#999";
}

/* =====================================================
BAR COLOR
===================================================== */

function componentBarColor(value: number) {

if (value >= 75) return "#52c41a";
if (value >= 55) return "#faad14";
if (value >= 35) return "#fa8c16";

return "#ff4d4f";
}

function bar(value: number) {

return {
width: `${value || 0}%`,
height: "6px",
background: componentBarColor(value || 0)
};
}

/* =====================================================
SIGNAL COLORS
===================================================== */

function getSignalColorBox(type: string) {

if (!type) return "#555";

if (
type.includes("PUT") ||
type.includes("SHORT")
) {
return "#ff4d4f";
}

if (
type.includes("LONG")
) {
return "#52c41a";
}

if (
type.includes("BUILD")
) {
return "#faad14";
}

return "#aaa";
}

/* =====================================================
SIGNAL TEXT
===================================================== */

function getSignalText() {

if (!signal) return "NO SIGNAL";

if (signal.type === "STRONG_PUT") {
return "ADD PUTS AGGRESSIVELY";
}

if (signal.type === "PUT_BUILD") {
return "BUILD PUT POSITION";
}

if (signal.type === "LONG_RUSSELL") {
return "ROTATE INTO RUSSELL";
}

if (signal.type === "REDUCE") {
return "REDUCE EXPOSURE";
}

return "NO EDGE";
}

/* =====================================================
NASDAQ
===================================================== */

function getNasdaqColor() {

if (!nasdaq?.active) return "#666";

if (nasdaq.mode === "MOMENTUM_LONG") {
return "#40a9ff";
}

if (nasdaq.mode === "TACTICAL_LONG") {
return "#1890ff";
}

if (nasdaq.mode === "PULLBACK_LONG") {
return "#69c0ff";
}

return "#666";
}

function getNasdaqText() {

if (!nasdaq?.active) {
return "NASDAQ OFF";
}

if (nasdaq.mode === "MOMENTUM_LONG") {
return "Momentum Long";
}

if (nasdaq.mode === "TACTICAL_LONG") {
return "Tactical Long";
}

if (nasdaq.mode === "PULLBACK_LONG") {
return "Pullback Long";
}

return "Active";
}

/* =====================================================
GLOBAL DECISION
===================================================== */

const globalDecision =
decision?.finalAction ?? "WAIT";

const globalDirection =
decision?.direction ?? "NEUTRAL";

function decisionColor(action: string) {

if (
action.includes("PUT") ||
action.includes("SHORT")
) {
return "#ff4d4f";
}

if (
action.includes("RUSSELL") ||
action.includes("LONG")
) {
return "#52c41a";
}

if (
action.includes("WAIT")
) {
return "#faad14";
}

return "#999";
}

/* =====================================================
EXECUTION
===================================================== */

function getExecution() {

if (!decision) return "NO DATA";

if (globalDecision.includes("MAX")) {
return "FULL POSITION";
}

if (globalDecision.includes("AGGRESSIVE")) {
return "ADD FAST";
}

if (globalDecision.includes("BUILD")) {
return "SCALE IN";
}

if (globalDecision.includes("ENTER")) {
return "INITIATE";
}

if (globalDecision.includes("WAIT")) {
return "HOLD / WAIT";
}

return "MANAGE";
}

/* =====================================================
MASTER SUMMARY
===================================================== */

function getMasterSummary() {

if (!decision) {

return {
text: "No decision data",
color: "#999"
};
}

if (
globalDecision.includes("PUT") ||
globalDecision.includes("SHORT")
) {

return {
text: "Defensive edge active → downside asymmetry improving",
color: "#ff4d4f"
};
}

if (
globalDecision.includes("RUSSELL") ||
globalDecision.includes("LONG")
) {

return {
text: "Risk-on rotation improving",
color: "#52c41a"
};
}

if (
globalDecision.includes("WAIT")
) {

return {
text: "No clean asymmetric edge",
color: "#faad14"
};
}

return {
text: "Mixed structure → manage risk",
color: "#999"
};
}

const summary = getMasterSummary();

/* =====================================================
SAFE COMPONENTS
===================================================== */

const crash =
master.components?.crash ?? 0;

const rotation =
master.components?.rotation ?? 0;

const timing =
master.components?.timing ?? 0;

/* =====================================================
MODE COLORS
===================================================== */

function getModeColor(mode: string) {

if (mode === "LONG") {
return "#52c41a";
}

if (mode === "RISK") {
return "#fa8c16";
}

if (mode === "CRASH") {
return "#ff4d4f";
}

return "#666";
}

/* =====================================================
SCORE LABEL
===================================================== */

function getScoreLabel(score: number) {

if (score <= 20) {
return "CHAOTIC";
}

if (score <= 40) {
return "DEFENSIVE";
}

if (score <= 60) {
return "TRANSITION";
}

if (score <= 80) {
return "STRUCTURED OPPORTUNITY";
}

return "ASYMMETRIC SETUP";
}

/* =====================================================
RENDER
===================================================== */

return (

<div
style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "16px"
}}
>

<h3
style={{
color: "#aaa",
marginBottom: "12px"
}}
>
MASTER CONTROL
</h3>

{/* =====================================================
MODE
===================================================== */}

<div
style={{
marginBottom: "12px",
padding: "8px",
border: `1px solid ${getModeColor(master.mode)}`,
color: getModeColor(master.mode),
textAlign: "center",
fontWeight: "bold"
}}
>
MODE: {master.mode}
</div>

{/* =====================================================
SIGNAL
===================================================== */}

<div
style={{
marginBottom: "16px",
padding: "14px",
border: `2px solid ${getSignalColorBox(signal?.type)}`,
background: "#1a1a1a",
color: getSignalColorBox(signal?.type),
fontWeight: "bold",
fontSize: "15px",
textAlign: "center",
boxShadow: `0 0 8px ${getSignalColorBox(signal?.type)}55`
}}
>
{getSignalText()}
</div>

{/* =====================================================
NASDAQ
===================================================== */}

<div
style={{
marginBottom: "14px",
padding: "10px",
border: `1px solid ${getNasdaqColor()}`,
background: "#141414",
color: getNasdaqColor(),
fontSize: "12px",
textAlign: "center"
}}
>
{getNasdaqText()}

<br />

<span style={{ opacity: 0.8 }}>
{nasdaq?.execution ?? ""}
</span>
</div>

{/* =====================================================
SUMMARY
===================================================== */}

<div
style={{
marginBottom: "14px",
padding: "8px",
border: `1px solid ${summary.color}`,
color: summary.color,
textAlign: "center"
}}
>
{summary.text}
</div>

{/* =====================================================
DECISION
===================================================== */}

<div style={{ marginBottom: "10px" }}>

<div>Decision</div>

<div
style={{
color: decisionColor(globalDecision),
fontWeight: "bold",
fontSize: "16px"
}}
>
{globalDecision}
</div>

<div
style={{
fontSize: "12px",
color: "#888"
}}
>
{globalDirection}
</div>

</div>

{/* =====================================================
EXECUTION
===================================================== */}

<div style={{ marginBottom: "12px" }}>

<div>Execution</div>

<div
style={{
color: "#bbb",
fontWeight: "bold"
}}
>
{getExecution()}
</div>

</div>

{/* =====================================================
MASTER SCORE
===================================================== */}

<div style={{ marginBottom: "12px" }}>

<div>Master Score</div>

<div
style={{
color: getMasterScoreColor(),
fontSize: "24px",
fontWeight: "bold"
}}
>
{master.score}/100
</div>

<div
style={{
fontSize: "12px",
color: "#888",
marginTop: "4px"
}}
>
{getScoreLabel(master.score)}
</div>

</div>

{/* =====================================================
REGIME
===================================================== */}

<div style={{ marginBottom: "10px" }}>

<div>Regime</div>

<div
style={{
color:
master.regime === "CRASH"
? "#ff4d4f"
: master.regime === "RISK"
? "#fa8c16"
: master.regime === "TRANSITION"
? "#fadb14"
: "#52c41a"
}}
>
{master.regime}
</div>

</div>

{/* =====================================================
NET EXPOSURE
===================================================== */}

<div style={{ marginBottom: "12px" }}>

<div>Net Exposure</div>

<div
style={{
color: exposureColor(master.netExposure),
fontSize: "18px",
fontWeight: "bold"
}}
>
{master.netExposure}%
</div>

</div>

{/* =====================================================
COMPONENTS
===================================================== */}

<div>

<div>Crash</div>
<div>{crash}/100</div>
<div style={bar(crash)} />

<div style={{ marginTop: "8px" }}>
Rotation
</div>

<div>{rotation}/100</div>
<div style={bar(rotation)} />

<div style={{ marginTop: "8px" }}>
Timing
</div>

<div>{timing}/100</div>
<div style={bar(timing)} />

</div>

</div>
);
}
