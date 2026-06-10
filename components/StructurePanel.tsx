// /components/panels/StructurePanel.tsx

"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function StructurePanel({
structure,
regimeSync,
executionState
}: any) {

if (!structure) return null;

/* ================= HELPERS ================= */

function safe(n: any) {
return typeof n === "number" && !isNaN(n) ? n : null;
}

function fmt(value: any, decimals = 1) {
const v = safe(value);

if (v === null) return "–";

return Number.isInteger(v)
? v.toString()
: v.toFixed(decimals);
}

function bar(value: number) {
return {
width: `${value || 0}%`,
height: "6px",
background: getSignalColor(value || 0, 100)
};
}

function barMax(value: number, max: number) {
const pct = max > 0
? (value / max) * 100
: 0;

return {
width: `${pct}%`,
height: "6px",
background: getSignalColor(value, max)
};
}

function delta(d: number) {
if (d === undefined || d === null) return "";
if (d === 0) return "(0)";
return d > 0 ? `(+${d})` : `(${d})`;
}

/* ================= SAFE ACCESS ================= */

const breadth = structure?.breadth || {};
const ad = structure?.advanceDecline || {};
const hl = structure?.highsLows || {};
const dist = structure?.distribution || {};
const health = structure?.health || {};

/* ================= BREADTH ================= */

const b20 = safe(breadth?.b20?.value);
const b50 = safe(breadth?.b50?.value);
const b200 = safe(breadth?.b200?.value);

/* ================= A/D ================= */

const advances = safe(ad?.advances);
const declines = safe(ad?.declines);

const net = safe(
ad?.value ??
(
advances !== null &&
declines !== null
? advances - declines
: null
)
);

const deltaValue = safe(ad?.delta);

/* ================= HIGH / LOW ================= */

const highs = safe(hl?.highs);
const lows = safe(hl?.lows);

const hasHLData =
highs !== null &&
lows !== null &&
(highs !== 0 || lows !== 0);

const netHL = hasHLData
? highs! - lows!
: null;

const totalHL = hasHLData
? highs! + lows!
: null;

const hlStrength =
totalHL && totalHL > 0
? (highs! - lows!) / totalHL
: null;

/* ================= COLORS ================= */

function strengthColor(v: number | null) {

if (v === null) return "#666";

if (v > 0.3) return "#52c41a";
if (v > 0.1) return "#95de64";
if (v > -0.1) return "#fadb14";
if (v > -0.3) return "#ff7875";

return "#ff4d4f";
}

/* ================= DISTRIBUTION ================= */

const distValue =
safe(dist.value ?? dist.score) ?? 0;

const distMax = dist.max ?? 7;

/* ================= HEALTH ================= */

const healthValue =
safe(health.value ?? structure?.healthScore) ?? 0;

const healthMax = health.max ?? 100;

/* ================= 🔥 REGIME SYNC ================= */

const syncScore =
regimeSync?.score ??
regimeSync?.regimeSyncScore ??
50;

const syncState =
regimeSync?.state ??
regimeSync?.regimeSyncState ??
"TRANSITION";

function syncColor() {

if (syncState === "ALIGNED") return "#52c41a";
if (syncState === "DIVERGING") return "#ff4d4f";

return "#faad14";
}

/* ================= 🔥 EXECUTION OVERLAY ================= */

const executionMode =
executionState?.executionMode ?? "WAIT";

const marketMode =
executionState?.marketMode ?? "TRANSITION";

/* ================= RENDER ================= */

return (
<div style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "16px"
}}>

<h3 style={{
color: "#888",
marginBottom: "12px"
}}>
STRUCTURE
</h3>

{/* ================= 🔥 REGIME SYNC ================= */}

<div style={{
marginBottom: "16px",
padding: "10px",
border: `1px solid ${syncColor()}`,
background: "#111"
}}>

<div style={{
fontSize: "11px",
color: "#666",
marginBottom: "6px"
}}>
REGIME SYNCHRONIZATION
</div>

<div style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center"
}}>

<div style={{
color: syncColor(),
fontWeight: "bold"
}}>
{syncState}
</div>

<div style={{
color: syncColor(),
fontWeight: "bold"
}}>
{syncScore}/100
</div>

</div>

<div style={{
height: "6px",
background: "#222",
marginTop: "8px"
}}>
<div style={{
width: `${syncScore}%`,
height: "6px",
background: syncColor()
}} />
</div>

</div>

{/* ================= 🔥 EXECUTION STATE ================= */}

<div style={{
marginBottom: "18px",
display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: "10px"
}}>

<div style={{
border: "1px solid #222",
padding: "10px",
background: "#111"
}}>
<div style={{
fontSize: "11px",
color: "#666",
marginBottom: "6px"
}}>
MARKET MODE
</div>

<div style={{
color:
marketMode === "RISK_ON"
? "#52c41a"
: marketMode === "RISK_OFF"
? "#ff4d4f"
: "#faad14",
fontWeight: "bold"
}}>
{marketMode}
</div>
</div>

<div style={{
border: "1px solid #222",
padding: "10px",
background: "#111"
}}>
<div style={{
fontSize: "11px",
color: "#666",
marginBottom: "6px"
}}>
EXECUTION
</div>

<div style={{
color: "#aaa",
fontWeight: "bold",
fontSize: "12px"
}}>
{executionMode}
</div>
</div>

</div>

{/* ================= BREADTH ================= */}

<div style={{ marginBottom: "12px" }}>

<div>Breadth</div>

<div>
20: {fmt(b20)}% {delta(breadth?.b20?.delta)}
</div>

<div style={bar(b20 ?? 0)} />

<div>
50: {fmt(b50)}% {delta(breadth?.b50?.delta)}
</div>

<div style={bar(b50 ?? 0)} />

<div>
200: {fmt(b200)}% {delta(breadth?.b200?.delta)}
</div>

<div style={bar(b200 ?? 0)} />

</div>

{/* ================= A/D ================= */}

<div style={{ marginBottom: "12px" }}>

<div>Advance / Decline</div>

<div>Adv: {fmt(advances)}</div>
<div>Dec: {fmt(declines)}</div>

<div style={{
color: getSignalColor(net ?? 0, 50),
fontWeight: "bold"
}}>
Net: {fmt(net)} {delta(deltaValue)}
</div>

</div>

{/* ================= HIGHS / LOWS ================= */}

<div style={{ marginTop: "10px" }}>

<div>Highs / Lows</div>

<div>
H: {fmt(highs)} {delta(hl?.deltaHighs)}
</div>

<div>
L: {fmt(lows)} {delta(hl?.deltaLows)}
</div>

<div style={{
color: getSignalColor(netHL ?? 0, 20),
fontWeight: "bold"
}}>
Net: {netHL !== null ? fmt(netHL) : "–"}
</div>

<div style={{
color: strengthColor(hlStrength),
fontWeight: "bold"
}}>
Strength: {hlStrength !== null
? hlStrength.toFixed(2)
: "–"}
</div>

</div>

{/* ================= DISTRIBUTION ================= */}

<div style={{ marginTop: "12px" }}>

<div>Distribution</div>

<div style={{
color: getSignalColor(distValue, distMax)
}}>
{distValue}/{distMax}
</div>

<div style={barMax(distValue, distMax)} />

</div>

{/* ================= HEALTH ================= */}

<div style={{ marginTop: "10px" }}>

<div>Health</div>

<div style={{
color: getSignalColor(
healthValue,
healthMax
)
}}>
{healthValue}/{healthMax}
</div>

</div>

</div>
);
}
