"use client";

export default function SignalPanel({ signal }: any) {

if (!signal) return null;

function getColor(type: string) {
if (type === "PUT_ADD") return "#ff4d4f";
if (type === "PUT_BUILD") return "#faad14";
if (type === "REDUCE") return "#fa8c16";
if (type === "RISK_OFF") return "#999";
return "#52c41a";
}

const color = getColor(signal.type);

return (
<div style={{
background: "#0d0d0d",
border: `1px solid ${color}`,
padding: "16px"
}}>

<h3 style={{ color: "#888", marginBottom: "12px" }}>
AUTO SIGNAL
</h3>

<div style={{
color,
fontWeight: "bold",
fontSize: "16px",
marginBottom: "8px"
}}>
{signal.type}
</div>

<div style={{
color: "#ccc",
fontSize: "13px",
marginBottom: "10px"
}}>
{signal.message}
</div>

<div style={{
fontSize: "12px",
color: "#888"
}}>
Strength: {signal.strength}/100
</div>

<div style={{
fontSize: "12px",
color:
signal.priority === "HIGH" ? "#ff4d4f" :
signal.priority === "MEDIUM" ? "#faad14" :
"#999"
}}>
Priority: {signal.priority}
</div>

</div>
);
}
