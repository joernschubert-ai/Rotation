"use client";

export default function SystemHeatPanel({ heat }: any) {
if (!heat) return null;

function getColor(value: number) {
if (value >= 1.2) return "#52c41a";
if (value >= 0.4) return "#a0d911";
if (value > -0.4) return "#999";
if (value > -1.2) return "#faad14";
return "#ff4d4f";
}

function getWidth(value: number) {
return `${((value + 2) / 4) * 100}%`;
}

return (
<div style={{
background: "#0d0d0d",
border: "1px solid #333",
padding: "16px"
}}>
<h3 style={{ color: "#888", marginBottom: "12px" }}>
SYSTEM HEAT
</h3>

<div style={{
height: "10px",
background: "#222",
borderRadius: "6px",
overflow: "hidden",
marginBottom: "12px"
}}>
<div style={{
width: getWidth(heat.value),
height: "100%",
background: getColor(heat.value)
}} />
</div>

<div style={{ textAlign: "center" }}>
<div style={{ fontSize: "14px", fontWeight: "bold" }}>
{heat.value}
</div>
<div style={{ fontSize: "11px", color: "#888" }}>
{heat.label}
</div>
</div>
</div>
);
}
