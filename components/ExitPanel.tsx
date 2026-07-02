"use client";

export default function ExitPanel({ exit, phase, crash }: any) {

if (!exit) return null;

/* ================= HELPERS ================= */

function getColor(action: string) {

if (!action)
return "#888";

const a =
action.toLowerCase();

if (
a.includes("force") ||
a.includes("exit")
)
return "#ff4d4f";

if (
a.includes("reduce") ||
a.includes("trim") ||
a.includes("lock") ||
a.includes("take")
)
return "#faad14";

if (
a.includes("hold")
)
return "#52c41a";

if (
a.includes("manage")
)
return "#40a9ff";

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

<div
style={{
fontSize: "12px",
color: "#faad14"
}}
>
Reduction: {Math.round(data.sizeReduction ?? 0)}%
</div>

{data.reason && (
<div
style={{
marginTop: "5px",
fontSize: "11px",
color: "#777"
}}
>
{data.reason}
</div>
)}

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

const bias =
exit.bias ??
"NEUTRAL";

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

<div
style={{
fontSize: "11px",
color: "#888",
marginTop: "4px"
}}
>
Bias: {bias}
</div>

<div style={{ color: "#faad14", fontSize: "12px" }}>
Reduction:

{Math.round(net.sizeReduction ?? 0)}%

</div>

{net.reason && (

<div
style={{
marginTop: "6px",
fontSize: "11px",
color: "#888"
}}
>

{net.reason}

</div>

)}

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
{bias === "SYSTEM_EXIT"

? "Systemic exit triggered."

: bias === "SYSTEM_REDUCE"

? "Broad defensive reduction."

: bias === "SHORT_EXIT"

? "Short exposure dominates."

: bias === "LONG_EXIT"

? "Long exposure dominates."

: net.sizeReduction >= 70

? "Aggressive portfolio reduction."

: net.sizeReduction >= 40

? "Risk is increasing."

: net.sizeReduction > 0

? "Partial exposure reduction."

: "Current regime remains intact."
}

</div>

</div>
);
}
