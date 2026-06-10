"use client";

import { useEffect, useState } from "react";

export default function SignalHistoryPanel() {
const [signals, setSignals] = useState<any[]>([]);

/* ================= LOAD ================= */

useEffect(() => {
load();
}, []);

async function load() {
try {
const res = await fetch("/api/signal");
const json = await res.json();
setSignals(json || []);
} catch (e) {
console.error("LOAD SIGNAL HISTORY ERROR", e);
}
}

/* ================= HELPERS ================= */

function getColor(type: string) {
if (!type) return "#666";
if (type.includes("PUT")) return "#ff4d4f";
if (type.includes("LONG")) return "#52c41a";
if (type.includes("BUILD")) return "#faad14";
if (type.includes("REDUCE")) return "#fa8c16";
return "#888";
}

function formatTime(ts: number) {
if (!ts) return "-";
const d = new Date(ts);
return d.toLocaleTimeString();
}

function bar(strength: number) {
return {
width: `${strength}%`,
height: "4px",
background: "#999",
marginTop: "4px"
};
}

/* ================= RENDER ================= */

return (
<div style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "16px"
}}>

<h3 style={{ color: "#888", marginBottom: "12px" }}>
SIGNAL HISTORY
</h3>

{signals.length === 0 && (
<div style={{ color: "#666" }}>No signals yet</div>
)}

{signals.map((s, i) => {

const color = getColor(s.type);

return (
<div
key={i}
style={{
borderBottom: "1px solid #111",
padding: "8px 0"
}}
>

{/* HEADER */}
<div style={{
display: "flex",
justifyContent: "space-between",
fontSize: "12px",
color: "#888"
}}>
<div>{formatTime(s.timestamp)}</div>
<div>{s.phase}</div>
</div>

{/* TYPE */}
<div style={{
color,
fontWeight: "bold",
fontSize: "13px"
}}>
{s.type}
</div>

{/* MESSAGE */}
<div style={{
fontSize: "12px",
color: "#bbb"
}}>
{s.message}
</div>

{/* STRENGTH */}
<div style={{ fontSize: "11px", color: "#666" }}>
Strength: {s.strength}
</div>

<div style={bar(s.strength)} />

</div>
);
})}

</div>
);
}
