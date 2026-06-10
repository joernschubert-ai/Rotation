"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function RussellPanel({ russell, exit }: any) {

if (!russell) return null;

/* ================= SAFE ================= */

const score = russell.score?.value ?? 0;
const max = russell.score?.max ?? 10;
const confidence = russell.confidence ?? 0;

const components = russell.components;

/* ================= 🔥 SUPER SIGNAL ================= */

function getSuperSignal() {
switch (russell.action) {
case "AGGRESSIVE":
return {
text: "🚀 STRONG RUSSELL LONG",
color: "#52c41a",
border: "#52c41a"
};

case "ADD":
return {
text: "🟢 ADD RUSSELL",
color: "#95de64",
border: "#389e0d"
};

case "BUILD":
return {
text: "🟡 BUILD POSITION",
color: "#faad14",
border: "#d48806"
};

case "EARLY":
return {
text: "⚠️ EARLY SIGNAL",
color: "#fa8c16",
border: "#d46b08"
};

default:
return {
text: "NO EDGE",
color: "#888",
border: "#333"
};
}
}

const superSignal = getSuperSignal();

/* ================= HELPERS ================= */

function bar(value: number, max: number) {
return {
width: `${(value / max) * 100}%`,
height: "6px",
background: getSignalColor(value, max)
};
}

/* ================= DECISION ================= */

function getRussellDecision() {
if (score >= 8 && confidence >= 70) return "MAX LONG EXPOSURE";
if (score >= 6 && confidence >= 50) return "BUILD LONG POSITION";
if (score >= 4) return "EARLY LONG";
if (russell.action === "WATCH") return "WAIT";
return "NO TRADE";
}

/* ================= EXECUTION ================= */

function getRussellExecution() {
if (score >= 8 && confidence >= 70) {
return { action: "ENTER AGGRESSIVE", mode: "BREAKOUT", note: "Strong rotation" };
}
if (score >= 6 && confidence >= 50) {
return { action: "BUILD POSITION", mode: "SCALE IN", note: "Constructive" };
}
if (score >= 4) {
return { action: "START SMALL", mode: "PROBE", note: "Early signal" };
}
return { action: "WAIT", mode: "NONE", note: "No edge" };
}

/* ================= EXIT ================= */

function getLongExit() {

if (!exit) return null;

if (exit.sizeReduction >= 80) {
return { label: "EXIT LONG", color: "#ff4d4f", note: "Risk-off / breakdown" };
}

if (exit.sizeReduction >= 50) {
return { label: "REDUCE LONG", color: "#fa8c16", note: "Weak structure" };
}

if (exit.sizeReduction >= 30) {
return { label: "TRIM", color: "#fadb14", note: "Momentum fading" };
}

return { label: "HOLD LONG", color: "#52c41a", note: "Trend intact" };
}

const decision = getRussellDecision();
const execution = getRussellExecution();
const exitInfo = getLongExit();

/* ================= RENDER ================= */

return (
<div style={{ background: "#0d0d0d", border: "1px solid #222", padding: "16px" }}>

<h3 style={{ color: "#888", marginBottom: "12px" }}>
RUSSELL (CALLS)
</h3>

{/* 🔥 SUPER SIGNAL (NEU) */}
<div style={{
marginBottom: "14px",
padding: "10px",
border: `1px solid ${superSignal.border}`,
color: superSignal.color,
fontWeight: "bold",
textAlign: "center"
}}>
{superSignal.text}
</div>

{/* DECISION */}
<div style={{ marginBottom: "10px" }}>
<div>Decision</div>
<div style={{ color: "#52c41a", fontWeight: "bold" }}>
{decision}
</div>
</div>

{/* EXECUTION */}
<div style={{ marginBottom: "14px" }}>
<div>Execution</div>
<div style={{ color: "#95de64", fontWeight: "bold" }}>
{execution.action}
</div>
<div style={{ fontSize: "12px", opacity: 0.7 }}>
{execution.mode} – {execution.note}
</div>
</div>

{/* EXIT */}
{exitInfo && (
<div style={{ marginBottom: "14px" }}>
<div>Exit</div>
<div style={{ color: exitInfo.color, fontWeight: "bold" }}>
{exitInfo.label}
</div>
<div style={{ fontSize: "12px", opacity: 0.7 }}>
{exitInfo.note} ({exit.sizeReduction}%)
</div>
</div>
)}

{/* SCORE */}
<div style={{ marginBottom: "10px" }}>
<div>Score</div>
<div style={{
color: getSignalColor(score, max),
fontSize: "18px",
fontWeight: "bold"
}}>
{score}/{max}
</div>
<div style={{ height: "6px", background: "#222", marginTop: "4px" }}>
<div style={bar(score, max)} />
</div>
</div>

{/* CONFIDENCE */}
<div style={{ marginBottom: "10px" }}>
<div>Confidence</div>
<div style={{ color: getSignalColor(confidence, 100) }}>
{confidence}%
</div>
</div>

{/* COMPONENTS */}
<div>

<div>Structure</div>
<div>{components.structure.value}/{components.structure.max}</div>
<div style={bar(components.structure.value, components.structure.max)} />

<div style={{ marginTop: "8px" }}>Regime</div>
<div>{components.regime.value}/{components.regime.max}</div>
<div style={bar(components.regime.value, components.regime.max)} />

<div style={{ marginTop: "8px" }}>Risk</div>
<div>{components.risk.value}/{components.risk.max}</div>
<div style={bar(components.risk.value, components.risk.max)} />

</div>

</div>
);
}
