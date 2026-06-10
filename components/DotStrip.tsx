"use client";

export default function DotStrip({ heat }: any) {
if (!heat?.components) return null;

function getColor(v: number) {
if (v >= 1) return "#52c41a";
if (v >= 0.2) return "#a0d911";
if (v > -0.2) return "#999";
if (v > -1) return "#faad14";
return "#ff4d4f";
}

function render(label: string, value: number) {
return (
<div style={{
display: "flex",
flexDirection: "column",
alignItems: "center"
}}>
<div style={{
width: "10px",
height: "10px",
borderRadius: "50%",
background: getColor(value),
marginBottom: "6px"
}} />
<div style={{
fontSize: "11px",
color: "#888"
}}>
{label}
</div>
</div>
);
}

const c = heat.components;

return (
<div style={{
background: "#0d0d0d",
border: "1px solid #333",
padding: "12px"
}}>
<div style={{
display: "grid",
gridTemplateColumns: "repeat(5, 1fr)",
gap: "10px"
}}>
{render("MOM", c.momentum)}
{render("BRD", c.breadth)}
{render("LIQ", c.liquidity)}
{render("RSK", c.risk)}
{render("CRSH", c.crash)}
</div>
</div>
);
}
