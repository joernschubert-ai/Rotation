"use client";

export default function DotStrip({ heat }: any) {
if (!heat?.components) return null;

function getColor(v: number) {
if (v >= 1) return "#6ee7b7";
if (v >= 0.2) return "#a0d911";
if (v > -0.2) return "#94a3b8";
if (v > -1) return "#fcd34d";
return "#fda4af";
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
color: "#94a3b8"
}}>
{label}
</div>
</div>
);
}

const c = heat.components;

return (
<div style={{
background: "#0e1722",
border: "1px solid #475569",
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
