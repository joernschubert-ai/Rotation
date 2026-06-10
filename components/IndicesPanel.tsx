"use client";

export default function IndicesPanel({ indices, futures }: any) {

if (!indices) return null;

function getColor(value: number) {
if (value > 0.5) return "#52c41a";
if (value > 0) return "#a0d911";
if (value === 0) return "#999";
if (value > -0.5) return "#faad14";
return "#ff4d4f";
}

function safeNumber(n: any) {
return typeof n === "number" && !isNaN(n) ? n : 0;
}

function renderRow(label: string, item: any) {
const value = safeNumber(item?.value);
const change = safeNumber(item?.change);

return (
<div
style={{
display: "flex",
justifyContent: "space-between",
marginBottom: "12px",
}}
>
<span style={{ color: "#888", fontSize: "13px" }}>{label}</span>

<div style={{ textAlign: "right" }}>
<div style={{ fontSize: "18px", fontWeight: "bold" }}>
{Math.round(value)}
</div>

<div
style={{
color: getColor(change),
fontWeight: "bold",
fontSize: "13px",
}}
>
{change > 0 ? "+" : ""}
{change.toFixed(2)}%
</div>
</div>
</div>
);
}

/* 🔥 SAFETY FALLBACK */
const safeFutures = futures ?? {};
const safeIndices = indices ?? {};

/* ================= RENDER ================= */

return (
<div
style={{
background: "#0d0d0d",
border: "1px solid #333",
padding: "16px",
}}
>

<h3 style={{ color: "#aaa", marginBottom: "14px", fontSize: "14px" }}>
INDEX MARKETS
</h3>

<div
style={{
display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: "24px",
}}
>

{/* ===== INDICES ===== */}
<div>
<div style={{ color: "#666", fontSize: "13px", marginBottom: "12px" }}>
INDICES
</div>

{renderRow("Dow Jones", safeIndices.dow)}
{renderRow("NASDAQ", safeIndices.ndx)}
{renderRow("S&P 500", safeIndices.spx)}
{renderRow("Russell 2000", safeIndices.rut)}
</div>

{/* ===== FUTURES ===== */}
<div>
<div style={{ color: "#666", fontSize: "13px", marginBottom: "12px" }}>
FUTURES
</div>

{renderRow("Dow Futures", safeFutures.ym)}
{renderRow("NASDAQ Futures", safeFutures.nq)}
{renderRow("S&P Futures", safeFutures.es)}
{renderRow("Russell Futures", safeFutures.rty)}
</div>

</div>

</div>
);
}
