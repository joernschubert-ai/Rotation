// /components/panels/MarketDrivers.tsx

"use client";

export default function MarketDrivers({
drivers,
earlyWarning,
regimeSync,
executionState,
dangerZone
}: any) {

if (!drivers) return null;

const s = drivers.states;
const r = drivers.raw;

/* ================= VALUE COLORS ================= */

function getColor(type: string, value: number) {

switch (type) {

case "vix":
return value < 18
? "#52c41a"
: value < 25
? "#faad14"
: "#ff4d4f";

case "term":
return value > 1.05
? "#52c41a"
: value > 0.95
? "#faad14"
: "#ff4d4f";

case "volOfVol":
return value < 1.1
? "#52c41a"
: value < 1.3
? "#faad14"
: "#ff4d4f";

case "liquidity":
return value > 70
? "#52c41a"
: value > 40
? "#faad14"
: "#ff4d4f";

case "gamma":
return value > 0
? "#52c41a"
: value < 0
? "#ff4d4f"
: "#faad14";

case "skew":
return value < 105
? "#52c41a"
: value < 120
? "#faad14"
: "#ff4d4f";

case "credit":
return value > 0.9
? "#52c41a"
: value > 0.8
? "#faad14"
: "#ff4d4f";

case "correlation":
return value < 1
? "#52c41a"
: value < 2
? "#faad14"
: "#ff4d4f";

case "breadth":
return value > 70
? "#52c41a"
: value > 40
? "#faad14"
: "#ff4d4f";

case "move":
return value < 75
? "#52c41a"
: value < 90
? "#faad14"
: "#ff4d4f";

default:
return "#999";
}
}

/* ================= BLOCK ================= */

function renderBlock(
title: string,
value: string,
color: string
) {
return (
<div style={{
border: "1px solid #222",
padding: "12px",
background: "#111"
}}>

<div style={{
fontSize: "11px",
color: "#666",
marginBottom: "6px"
}}>
{title}
</div>

<div style={{
fontWeight: "bold",
color,
fontSize: "16px"
}}>
{value}
</div>

</div>
);
}

/* ================= CLEAN ================= */

const breadth = Math.round(r.breadth);

/* ================= 🔥 NEW STATES ================= */

const syncScore =
regimeSync?.score ??
regimeSync?.regimeSyncScore ??
50;

const syncState =
regimeSync?.state ??
regimeSync?.regimeSyncState ??
"TRANSITION";

const marketMode =
executionState?.marketMode ??
"TRANSITION";

const tacticalBias =
executionState?.tacticalBias ??
"NEUTRAL";

const riskState =
executionState?.riskState ??
"FRAGILE";

const dangerState =
dangerZone?.state ??
"NORMAL";

/* ================= SUMMARY ================= */

function getSummary() {

if (
dangerState === "CRITICAL" ||
riskState === "CRISIS"
) {
return {
text: "Critical instability detected",
color: "#ff4d4f"
};
}

if (
marketMode === "RISK_ON" &&
syncState === "ALIGNED"
) {
return {
text: "High regime alignment risk-on",
color: "#52c41a"
};
}

if (
marketMode === "RISK_OFF"
) {
return {
text: "Defensive regime active",
color: "#faad14"
};
}

return {
text: "Mixed transition environment",
color: "#999"
};
}

const summary = getSummary();

/* ================= RENDER ================= */

return (
<div style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "16px"
}}>

<h3 style={{
marginBottom: "14px",
color: "#aaa",
fontSize: "14px"
}}>
MARKET DRIVERS
</h3>

{/* SUMMARY */}

<div style={{
marginBottom: "16px",
padding: "12px",
border: `1px solid ${summary.color}`,
color: summary.color,
fontWeight: "bold",
textAlign: "center",
fontSize: "13px"
}}>
{summary.text}
</div>

{/* 🔥 EXECUTION OVERLAY */}

<div style={{
display: "grid",
gridTemplateColumns: "repeat(4, 1fr)",
gap: "10px",
marginBottom: "16px"
}}>

{renderBlock(
"MODE",
marketMode,
marketMode === "RISK_ON"
? "#52c41a"
: marketMode === "RISK_OFF"
? "#ff4d4f"
: "#faad14"
)}

{renderBlock(
"BIAS",
tacticalBias,
tacticalBias.includes("LONG")
? "#52c41a"
: tacticalBias.includes("SHORT")
? "#ff4d4f"
: "#faad14"
)}

{renderBlock(
"RISK",
riskState,
riskState === "STABLE"
? "#52c41a"
: riskState === "FRAGILE"
? "#faad14"
: "#ff4d4f"
)}

{renderBlock(
"SYNC",
`${syncScore}`,
syncState === "ALIGNED"
? "#52c41a"
: syncState === "DIVERGING"
? "#ff4d4f"
: "#faad14"
)}

</div>

{/* GRID */}

<div style={{
display: "grid",
gridTemplateColumns: "repeat(3, 1fr)",
gap: "12px"
}}>

{renderBlock(
"VIX",
r.vix.toFixed(1),
getColor("vix", r.vix)
)}

{renderBlock(
"TERM",
s.term,
getColor("term", r.vixTerm)
)}

{renderBlock(
"VOL OF VOL",
r.volOfVol.toFixed(2),
getColor("volOfVol", r.volOfVol)
)}

{renderBlock(
"LIQUIDITY",
`${r.liquidity}`,
getColor("liquidity", r.liquidity)
)}

{renderBlock(
"GAMMA",
`${r.gamma}`,
getColor("gamma", r.gamma)
)}

{renderBlock(
"SKEW",
`${r.skew}`,
getColor("skew", r.skew)
)}

{renderBlock(
"CREDIT",
s.credit,
getColor("credit", r.credit)
)}

{renderBlock(
"CORRELATION",
`${r.correlation}`,
getColor("correlation", r.correlation)
)}

{renderBlock(
"BREADTH",
`${breadth}%`,
getColor("breadth", breadth)
)}

{renderBlock(
"FRAGILITY",
`${drivers.fragility}`,
drivers.fragility >= 5
? "#ff4d4f"
: drivers.fragility >= 3
? "#faad14"
: "#52c41a"
)}

{renderBlock(
"MOVE",
`${r.move}`,
getColor("move", r.move)
)}

{renderBlock(
"STATE",
drivers.globalState,
drivers.globalState === "RISK_ON"
? "#52c41a"
: drivers.globalState === "RISK_OFF"
? "#ff4d4f"
: "#faad14"
)}

</div>

</div>
);
}
