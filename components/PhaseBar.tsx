"use client";

export default function PhaseBar({ phase, regime }: any) {

/* ================= PHASES ================= */

const phases = [
{
key: "PHASE_1_EXPANSION",
label: "Phase 1 – Expansion",
description: "Broad Participation"
},
{
key: "PHASE_2_WARNING",
label: "Phase 2 – Warning",
description: "Internal Divergences"
},
{
key: "PHASE_3_DISTRIBUTION",
label: "Phase 3 – Distribution",
description: "Institutional Selling"
},
{
key: "PHASE_4_RISK",
label: "Phase 4 – Risk",
description: "Structural Deterioration"
},
{
key: "PHASE_5_BREAKDOWN",
label: "Phase 5 – Breakdown",
description: "200 DMA Failure"
},
{
key: "PHASE_6_ACCELERATION",
label: "Phase 6 – Acceleration",
description: "Forced Liquidation"
},
{
key: "PHASE_7_CAPITULATION",
label: "Phase 7 – Capitulation",
description: "Panic Exhaustion"
}
];

const activeIndex =
phases.findIndex(
p => p.key === phase
);

/* ================= PHASE COLORS ================= */

function getPhaseColor(index: number) {

if (index === 0) return "#52c41a";

if (index === 1) return "#faad14";

if (index === 2) return "#fa8c16";

if (index === 3) return "#fa541c";

if (index === 4) return "#ff4d4f";

if (index === 5) return "#722ed1";

if (index === 6) return "#391085";

return "#999";
}

/* ================= REGIME COLOR ================= */

function getRegimeColor(label: string) {

if (!label) return "#999";

const l =
label.toLowerCase();

if (
l.includes("expansion") ||
l.includes("risk_on")
) {
return "#52c41a";
}

if (
l.includes("warning")
) {
return "#faad14";
}

if (
l.includes("distribution")
) {
return "#fa8c16";
}

if (
l.includes("risk")
) {
return "#fa541c";
}

if (
l.includes("breakdown")
) {
return "#ff4d4f";
}

if (
l.includes("acceleration")
) {
return "#722ed1";
}

if (
l.includes("capitulation")
) {
return "#391085";
}

return "#999";
}

/* ================= REGIME MODE ================= */

function getRegimeMode() {

if (
phase === "PHASE_1_EXPANSION" ||
phase === "PHASE_2_WARNING"
) {
return {
label: "LONG REGIME",
color: "#52c41a"
};
}

if (
phase === "PHASE_3_DISTRIBUTION"
) {
return {
label: "TRANSITION",
color: "#fa8c16"
};
}

if (
phase === "PHASE_4_RISK"
) {
return {
label: "DEFENSIVE",
color: "#fa541c"
};
}

return {
label: "CRASH REGIME",
color: "#ff4d4f"
};
}

/* ================= SAFE ================= */

const currentPhase =
phases[activeIndex] ??
phases[0];

const regimeLabel =
regime?.label ?? "UNKNOWN";

const regimeScore =
Number(regime?.score ?? 0);

const regimeMode =
getRegimeMode();

/* ================= RENDER ================= */

return (

<div
style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "16px"
}}
>

<h3
style={{
color: "#888",
marginBottom: "12px"
}}
>
MARKET REGIME
</h3>

{/* ================= CURRENT PHASE ================= */}

<div
style={{
marginBottom: "12px"
}}
>

<div
style={{
color: "#888",
fontSize: "12px"
}}
>
CURRENT PHASE
</div>

<div
style={{
color:
getPhaseColor(
activeIndex
),
fontWeight: "bold",
fontSize: "15px"
}}
>
● {currentPhase.label}
</div>

<div
style={{
color: "#777",
fontSize: "11px",
marginTop: "2px"
}}
>
{currentPhase.description}
</div>

</div>

{/* ================= PHASE BAR ================= */}

<div
style={{
display: "flex",
gap: "6px",
marginBottom: "10px"
}}
>

{phases.map((p, i) => {

const isActive =
i === activeIndex;

return (

<div
key={p.key}
style={{
flex: 1,
height: "10px",
background:
isActive
? getPhaseColor(i)
: "#222",
borderRadius: "4px",
transition:
"all 0.3s ease"
}}
/>

);
})}

</div>

{/* ================= NUMBERS ================= */}

<div
style={{
display: "flex",
justifyContent: "space-between",
fontSize: "11px",
color: "#666",
marginBottom: "16px"
}}
>
{phases.map((_, i) => (
<span key={i}>
{i + 1}
</span>
))}
</div>

{/* ================= REGIME STATE ================= */}

<div
style={{
marginBottom: "14px",
padding: "12px",
border:
`1px solid ${regimeMode.color}`,
background: "#111"
}}
>

<div
style={{
color: "#666",
fontSize: "11px"
}}
>
EXECUTION REGIME
</div>

<div
style={{
color: regimeMode.color,
fontWeight: "bold",
fontSize: "18px"
}}
>
{regimeMode.label}
</div>

</div>

{/* ================= REGIME ================= */}

<div>

<div
style={{
color: "#888",
fontSize: "12px"
}}
>
MARKET REGIME
</div>

<div
style={{
color:
getRegimeColor(
regimeLabel
),
fontWeight: "bold",
fontSize: "16px"
}}
>
{regimeLabel}
</div>

<div
style={{
color: "#888",
fontSize: "12px"
}}
>
Score {regimeScore}
</div>

</div>

</div>
);
}
