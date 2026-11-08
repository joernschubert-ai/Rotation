// /components/SystemDiagnosticsPanel.tsx

"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function SystemDiagnosticsPanel({ engine }: any) {

if (!engine) return null;

const panel = {
background: "#0e1722",
border: "1px solid #334155",
padding: "16px"
};

/* ================= HELPERS ================= */

function labelStyle(color = "#94a3b8") {
return {
fontSize: "11px",
color,
marginBottom: "2px"
};
}

function valueStyle(color = "#f8fafc") {
return {
fontWeight: "bold",
color,
marginBottom: "6px"
};
}

function metricColor(value: number) {

if (value >= 80) return "#6ee7b7";
if (value >= 65) return "#a7f3d0";
if (value >= 50) return "#fcd34d";
if (value >= 35) return "#fda4af";

return "#fda4af";
}

/* ================= DATA ================= */

const state = engine.state ?? {};
const sizing = engine.sizing ?? {};
const rotation = engine.rotation ?? {};
const crash = engine.crash ?? {};

const rotationConfirm =
engine.rotationConfirm ?? {};

const rotationDecay =
engine.rotationDecay ?? {};

const regimeSync =
engine.regimeSync ?? {};

const liquidity =
engine.liquidity ?? {};

const fragility =
engine.fragility ?? {};

const squeeze =
engine.squeeze ?? {};

const participation =
engine.participation ?? {};

const breadthThrust =
engine.breadthThrust ?? {};

/* ================= COLORS ================= */

function decayColor() {

const score =
rotationDecay?.score ?? 0;

if (score >= 75) return "#fda4af";
if (score >= 55) return "#fda4af";
if (score >= 35) return "#fcd34d";

return "#6ee7b7";
}

function syncColor() {

const state =
regimeSync?.state ?? "TRANSITION";

if (state === "ALIGNED") {
return "#6ee7b7";
}

if (state === "DIVERGING") {
return "#fda4af";
}

return "#fcd34d";
}

function boolColor(v: boolean) {
return v ? "#fda4af" : "#6ee7b7";
}

/* ================= RENDER ================= */

return (
<div style={panel}>

<h3 style={{ color: "#94a3b8", marginBottom: "12px" }}>
SYSTEM DIAGNOSTICS
</h3>

{/* ================= POSITION STATE ================= */}

<div style={{ marginBottom: "16px" }}>

<div style={labelStyle()}>
Position State
</div>

<div style={valueStyle()}>
Size: {state.size?.toFixed?.(0) ?? 0}%
</div>

<div style={valueStyle(
getSignalColor(state.pnl ?? 0, 100)
)}>
PNL: {state.pnl ?? 0}%
</div>

<div style={valueStyle()}>
Realized: {state.realized?.toFixed?.(0) ?? 0}%
</div>

<div style={valueStyle(
state.isRunner
? "#6ee7b7"
: "#94a3b8"
)}>
Runner: {state.isRunner ? "YES" : "NO"}
</div>

</div>

{/* ================= PORTFOLIO ================= */}

<div style={{ marginBottom: "16px" }}>

<div style={labelStyle()}>
Portfolio
</div>

<div style={valueStyle(
getSignalColor(sizing.size ?? 0, 100)
)}>
Exposure: {sizing.size ?? 0}%
</div>

<div style={valueStyle()}>
Direction: {sizing.direction ?? "NEUTRAL"}
</div>

</div>

{/* ================= ROTATION ================= */}

<div style={{ marginBottom: "16px" }}>

<div style={labelStyle()}>
Rotation Insight
</div>

<div style={valueStyle("#6ee7b7")}>
{rotation.signal ?? "No signal"}
</div>

<div style={valueStyle()}>
Score: {rotation.score ?? 0}
</div>

</div>

{/* ================= ROTATION CONFIRM ================= */}

<div style={{ marginBottom: "16px" }}>

<div style={labelStyle()}>
Rotation Confirmation
</div>

<div style={valueStyle(
metricColor(
rotationConfirm?.confidence ?? 0
)
)}>
{rotationConfirm?.state ?? "EARLY"}
</div>

<div style={valueStyle(
metricColor(
rotationConfirm?.confidence ?? 0
)
)}>
Confidence: {rotationConfirm?.confidence ?? 0}
</div>

<div style={valueStyle(
metricColor(
rotationConfirm?.quality ?? 0
)
)}>
Quality: {rotationConfirm?.quality ?? 0}
</div>

<div style={valueStyle(
metricColor(
rotationConfirm?.sustainability ?? 0
)
)}>
Sustainability: {rotationConfirm?.sustainability ?? 0}
</div>

<div style={valueStyle(
metricColor(
rotationConfirm?.participation ?? 0
)
)}>
Participation: {rotationConfirm?.participation ?? 0}
</div>

<div style={valueStyle(
metricColor(
rotationConfirm?.liquiditySupport ?? 0
)
)}>
Liquidity: {rotationConfirm?.liquiditySupport ?? 0}
</div>

<div style={valueStyle(
metricColor(
100 -
(rotationConfirm?.falseBreakRisk ?? 0)
)
)}>
False Break Risk: {rotationConfirm?.falseBreakRisk ?? 0}
</div>

<div style={valueStyle(
boolColor(
rotationConfirm?.squeezeRisk ?? false
)
)}>
Squeeze Risk:
{" "}
{rotationConfirm?.squeezeRisk
? "YES"
: "NO"}
</div>

<div style={valueStyle(
boolColor(
rotationConfirm?.megaCapOnly ?? false
)
)}>
Mega Cap Only:
{" "}
{rotationConfirm?.megaCapOnly
? "YES"
: "NO"}
</div>

<div style={valueStyle(
boolColor(
rotationConfirm?.fragileStructure ?? false
)
)}>
Fragile Structure:
{" "}
{rotationConfirm?.fragileStructure
? "YES"
: "NO"}
</div>

</div>

{/* ================= ROTATION DECAY ================= */}

<div style={{ marginBottom: "16px" }}>

<div style={labelStyle()}>
Rotation Decay
</div>

<div style={valueStyle(decayColor())}>
{rotationDecay?.state ??
"HEALTHY_ROTATION"}
</div>

<div style={valueStyle(decayColor())}>
Decay Score: {rotationDecay?.score ?? 0}
</div>

<div style={valueStyle()}>
Momentum Quality:
{" "}
{rotationDecay?.momentumQuality ?? 0}
</div>

</div>

{/* ================= REGIME SYNC ================= */}

<div style={{ marginBottom: "16px" }}>

<div style={labelStyle()}>
Regime Sync
</div>

<div style={valueStyle(syncColor())}>
{regimeSync?.state ?? "TRANSITION"}
</div>

<div style={valueStyle(syncColor())}>
Score: {regimeSync?.score ?? 0}
</div>

<div style={valueStyle()}>
Strongest:
{" "}
{regimeSync?.strongestLink ?? "N/A"}
</div>

<div style={valueStyle()}>
Weakest:
{" "}
{regimeSync?.weakestLink ?? "N/A"}
</div>

</div>

{/* ================= INTERNAL ENGINES ================= */}

<div style={{ marginBottom: "16px" }}>

<div style={labelStyle()}>
Internal Engines
</div>

<div style={valueStyle(
metricColor(liquidity?.score ?? 0)
)}>
Liquidity: {liquidity?.score ?? 0}
</div>

<div style={valueStyle(
metricColor(
100 - (fragility?.score ?? 0)
)
)}>
Fragility: {fragility?.score ?? 0}
</div>

<div style={valueStyle(
metricColor(
100 - (squeeze?.risk ?? 0)
)
)}>
Squeeze Risk: {squeeze?.risk ?? 0}
</div>

<div style={valueStyle(
metricColor(
participation?.score ?? 0
)
)}>
Participation: {participation?.score ?? 0}
</div>

<div style={valueStyle(
metricColor(
breadthThrust?.score ?? 0
)
)}>
Breadth Thrust: {breadthThrust?.score ?? 0}
</div>

</div>

{/* ================= CRASH ================= */}

<div>

<div style={labelStyle()}>
Crash Insight
</div>

<div style={valueStyle(
getSignalColor(crash.score ?? 0, 100)
)}>
Score: {crash.score ?? 0}
</div>

<div style={valueStyle("#fda4af")}>
Modell-Risikowert: {crash.probability ?? 0}/100 (unkalibriert)
</div>

</div>

</div>
);
}
