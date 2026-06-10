"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function PositioningPanel({ positioning, edgeState }: any) {

if (!positioning) return null;

/* ================= COLORS ================= */

function getColor(state?: string) {
if (!state || typeof state !== "string") return "#faad14";

if (state.includes("BULL")) return "#52c41a";
if (state.includes("BEAR")) return "#ff4d4f";

return "#faad14";
}

/* ================= 🆕 DIVERGENCE ================= */

function getDivergence() {

const bias = positioning?.bias ?? "NEUTRAL";
const edge = edgeState?.state ?? "NEUTRAL";

/* LONG SYSTEM vs WEAK MARKET */
if (
(edge === "BUILD" || edge === "CONFIRM" || edge === "EXPAND" || edge === "ATTACK") &&
(bias === "BEARISH" || bias === "NEUTRAL")
) {
return {
label: "SMART MONEY EARLY",
text: "System building long while crowd not positioned",
color: "#13c2c2"
};
}

/* STRONG MARKET vs WEAK EDGE */
if (
(edge === "NEUTRAL" || edge === "DEFENSIVE") &&
bias === "BULLISH"
) {
return {
label: "CROWD OVERPOSITIONED",
text: "Market bullish but no structural edge",
color: "#fa8c16"
};
}

/* RISK */
if (
edge === "DEFENSIVE" &&
bias === "BULLISH"
) {
return {
label: "RISK DIVERGENCE",
text: "Crowd long while system turns defensive",
color: "#ff4d4f"
};
}

/* CONFIRMED */
if (
(edge === "EXPAND" || edge === "ATTACK") &&
bias === "BULLISH"
) {
return {
label: "ALIGNED",
text: "Trend + positioning aligned",
color: "#52c41a"
};
}

return {
label: "NEUTRAL",
text: "No clear divergence",
color: "#999"
};
}

const divergence = getDivergence();

/* ================= RENDER ================= */

return (
<div style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "16px"
}}>

<h3 style={{ color: "#888", marginBottom: "12px" }}>
MARKET POSITIONING
</h3>

{/* 🆕 DIVERGENCE BLOCK */}
<div style={{
marginBottom: "14px",
padding: "10px",
border: `1px solid ${divergence.color}`,
color: divergence.color,
textAlign: "center"
}}>
<div style={{ fontWeight: "bold" }}>
{divergence.label}
</div>
<div style={{ fontSize: "12px", opacity: 0.8 }}>
{divergence.text}
</div>
</div>

<div style={{ marginBottom: "10px" }}>
<div>Bias</div>
<div style={{
color: getColor(positioning.bias),
fontWeight: "bold"
}}>
{positioning.bias}
</div>
</div>

<div style={{ marginBottom: "10px" }}>
<div>Crowding</div>
<div style={{
color: "#bbb",
fontWeight: "bold"
}}>
{positioning.crowding}
</div>
</div>

<div style={{ marginBottom: "10px" }}>
<div>State</div>
<div style={{
color: getColor(positioning.state)
}}>
{positioning.state}
</div>
</div>

<div style={{ marginBottom: "10px" }}>
<div>Score</div>
<div style={{
color: getSignalColor(positioning.score, 100),
fontWeight: "bold"
}}>
{positioning.score}/100
</div>
</div>

</div>
);
}
