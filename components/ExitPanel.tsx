"use client";

export default function ExitPanel({ exit, phase, crash }: any) {

if (!exit) return null;

/* ================= HELPERS ================= */

function getColor(action: string) {
if (!action) return "#999";

const a = action.toLowerCase();

if (a.includes("exit")) return "#ff4d4f";
if (a.includes("reduce") || a.includes("trim")) return "#faad14";
if (a.includes("hold")) return "#52c41a";

return "#999";
}

function renderBlock(title: string, data: any) {
if (!data) return null;

return (
<div style={{
border: "1px solid #222",
padding: "10px",
background: "#111"
}}>
<div style={{ fontSize: "11px", color: "#666" }}>
{title}
</div>

<div style={{
color: getColor(data.action),
fontWeight: "bold",
marginTop: "4px"
}}>
{data.action}
</div>

<div style={{
fontSize: "12px",
color: "#faad14"
}}>
{data.sizeReduction ?? 0}%
</div>

</div>
);
}

/* ================= CONTEXT ================= */

let context = "NEUTRAL";

if (crash?.probability > 80) context = "CRASH ENVIRONMENT";
else if (phase === "PHASE_5_BREAKDOWN" || phase === "PHASE_6_ACCELERATION") context = "DOWNTREND";
else if (phase === "PHASE_3_DISTRIBUTION") context = "TOP FORMATION";

/* ================= NET ================= */

const net = exit.net ?? exit;

/* ================= RENDER ================= */

return (
<div style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "16px"
}}>

<h3 style={{ color: "#888", marginBottom: "12px" }}>
EXIT STRATEGY
</h3>

{/* 🔥 PRIMARY ACTION */}
<div style={{
marginBottom: "14px",
padding: "12px",
border: `1px solid ${getColor(net.action)}`
}}>
<div style={{ fontSize: "12px", color: "#666" }}>
PORTFOLIO ACTION
</div>

<div style={{
color: getColor(net.action),
fontWeight: "bold",
fontSize: "18px"
}}>
{net.action}
</div>

<div style={{ color: "#faad14", fontSize: "12px" }}>
Reduction: {net.sizeReduction ?? 0}%
</div>
</div>

{/* 🔥 SPLIT VIEW */}
{exit.short && exit.long && (
<div style={{
display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: "10px",
marginBottom: "14px"
}}>
{renderBlock("SHORT (NASDAQ)", exit.short)}
{renderBlock("LONG (RUSSELL)", exit.long)}
</div>
)}

{/* CONTEXT */}
<div style={{
fontSize: "12px",
color: "#888",
marginBottom: "10px"
}}>
{context}
</div>

{/* INTERPRETATION */}
<div style={{
padding: "8px",
border: "1px solid #222",
fontSize: "12px",
color: "#aaa"
}}>
{net.sizeReduction >= 70
? "Aggressive de-risking → regime shift"
: net.sizeReduction >= 40
? "Significant reduction → volatility rising"
: net.sizeReduction > 0
? "Active management → trimming exposure"
: "No reduction → trend intact"}
</div>

</div>
);
}
