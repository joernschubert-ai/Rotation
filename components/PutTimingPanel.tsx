"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function PutTimingPanel({ putTiming, exit }: any) {

if (!putTiming) return null;

/* ================= INFO BOX ================= */

function getInfo() {

switch (putTiming.decision) {

case "NO_TRADE":
return {
label: "NO SHORT SETUP",
color: "#999", // 🔥 FIX: grau statt grün
note: "Market still in expansion / no breakdown"
};

case "EARLY":
return {
label: "EARLY WARNING",
color: "#fadb14",
note: "Weakness building – no confirmation"
};

case "BUILD":
return {
label: "BUILD SHORT",
color: "#fa8c16",
note: "Structure weakening"
};

case "ADD":
return {
label: "ADD SHORT",
color: "#ff7a45",
note: "Momentum confirmed"
};

case "AGGRESSIVE":
return {
label: "MAX SHORT",
color: "#ff4d4f",
note: "Breakdown / panic phase"
};

default:
return {
label: "WAIT",
color: "#999",
note: "No signal"
};
}
}

const info = getInfo();

/* ================= EXECUTION ================= */

function getExecution() {

switch (putTiming.decision) {

case "NO_TRADE":
return { action: "WAIT", note: "No edge" };

case "EARLY":
return { action: "PROBE", note: "Observation only" };

case "BUILD":
return { action: "BUILD", note: "Scale in" };

case "ADD":
return { action: "ADD", note: "Increase exposure" };

case "AGGRESSIVE":
return { action: "FULL SIZE", note: "High conviction" };

default:
return { action: "WAIT", note: "" };
}
}

const execution = getExecution();

/* ================= EXIT ================= */

function getExit() {

if (!exit) return null;

if (putTiming.decision === "NO_TRADE") {
return {
label: "NO POSITION",
color: "#999", // 🔥 FIX: auch neutral, nicht grün
note: "No short active"
};
}

return {
label: "HOLD SHORT",
color: "#52c41a",
note: "Trend intact"
};
}

const exitInfo = getExit();

/* ================= HELPERS ================= */

function bar(value: number, max: number) {
const pct = (value / max) * 100;

return {
width: `${pct}%`,
height: "6px",
background: getSignalColor(value, max)
};
}

/* ================= RENDER ================= */

return (
<div style={{ background: "#0d0d0d", border: "1px solid #222", padding: "16px" }}>

<h3 style={{ color: "#888", marginBottom: "12px" }}>
PUT TIMING
</h3>

{/* 🔥 INFO BOX */}
<div style={{
marginBottom: "14px",
padding: "10px",
border: `1px solid ${info.color}`,
background: "#111"
}}>
<div style={{ color: info.color, fontWeight: "bold" }}>
{info.label}
</div>
<div style={{ fontSize: "12px", opacity: 0.7 }}>
{info.note}
</div>
</div>

{/* 🔥 DECISION */}
<div style={{ marginBottom: "12px" }}>
<div>Decision</div>
<div style={{ color: info.color, fontWeight: "bold" }}>
{putTiming.decision}
</div>
</div>

{/* EXECUTION */}
<div style={{ marginBottom: "12px" }}>
<div>Execution</div>
<div style={{ fontWeight: "bold" }}>
{execution.action}
</div>
<div style={{ fontSize: "12px", opacity: 0.7 }}>
{execution.note}
</div>
</div>

{/* EXIT */}
{exitInfo && (
<div style={{ marginBottom: "12px" }}>
<div>Exit</div>
<div style={{ color: exitInfo.color }}>
{exitInfo.label}
</div>
<div style={{ fontSize: "12px", opacity: 0.7 }}>
{exitInfo.note}
</div>
</div>
)}

{/* SCORE */}
<div style={{ marginBottom: "12px" }}>
Score: {putTiming.score.value}/{putTiming.score.max}
</div>

{/* 🔥 COMPONENTS */}
<div>

<div>Timing</div>
<div>{putTiming.timing}</div>

<div style={{ marginTop: "8px" }}>Phase</div>
<div>{putTiming.components.phase.value}/{putTiming.components.phase.max}</div>
<div style={bar(putTiming.components.phase.value, putTiming.components.phase.max)} />

<div style={{ marginTop: "8px" }}>Rotation</div>
<div>{putTiming.components.rotation.value}/{putTiming.components.rotation.max}</div>
<div style={bar(putTiming.components.rotation.value, putTiming.components.rotation.max)} />

<div style={{ marginTop: "8px" }}>Crash</div>
<div>{putTiming.components.crash.value}/{putTiming.components.crash.max}</div>
<div style={bar(putTiming.components.crash.value, putTiming.components.crash.max)} />

</div>

</div>
);
}
