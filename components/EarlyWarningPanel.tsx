"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function EarlyWarningPanel({ earlyWarning }: any) {

if (!earlyWarning) return null;

/* ================= HELPERS ================= */

function bar(value: number, max: number) {
return {
width: `${(value / max) * 100}%`,
height: "6px",
background: getSignalColor(value, max)
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
EARLY WARNING
</h3>

{/* 🔥 STATE */}
<div style={{
marginBottom: "12px",
padding: "8px",
border: `1px solid ${earlyWarning.color}`,
color: earlyWarning.color,
fontWeight: "bold",
textAlign: "center"
}}>
{earlyWarning.state}
</div>

{/* SCORE */}
<div style={{ marginBottom: "10px" }}>
<div>Score</div>
<div style={{
color: getSignalColor(
earlyWarning.score.value,
earlyWarning.score.max
),
fontSize: "18px"
}}>
{earlyWarning.score.value}/{earlyWarning.score.max}
</div>
</div>

{/* COMPONENTS */}

<div>

<div>Divergence</div>
<div>
{earlyWarning.components.divergence.value}/
{earlyWarning.components.divergence.max}
</div>
<div style={bar(
earlyWarning.components.divergence.value,
earlyWarning.components.divergence.max
)} />

<div style={{ marginTop: "8px" }}>Distribution</div>
<div>
{earlyWarning.components.distribution.value}/
{earlyWarning.components.distribution.max}
</div>
<div style={bar(
earlyWarning.components.distribution.value,
earlyWarning.components.distribution.max
)} />

<div style={{ marginTop: "8px" }}>Concentration</div>
<div>
{earlyWarning.components.concentration.value}/
{earlyWarning.components.concentration.max}
</div>
<div style={bar(
earlyWarning.components.concentration.value,
earlyWarning.components.concentration.max
)} />

</div>

</div>
);
}
