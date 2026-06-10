"use client";

export default function SystemDotsPanel({
drivers,
structure,
dangerZone,
regimeSync,
}: any) {

if (!drivers) return null;

/* ================= HELPERS ================= */

function getColor(state: string) {
if (state === "positive") return "#52c41a";
if (state === "negative") return "#ff4d4f";
return "#faad14";
}

function getSize(weight: number) {
if (weight >= 3) return 16;
if (weight === 2) return 13;
return 10;
}

function getPulse(level?: string) {
if (level === "EXTREME") return "0 0 12px #ff4d4f";
if (level === "HIGH") return "0 0 8px #fa8c16";
return "none";
}

function dot(
state: string,
weight: number,
escalation?: boolean,
level?: string
) {
const size = getSize(weight);

return (
<div
style={{
width: `${size}px`,
height: `${size}px`,
borderRadius: "50%",
background: getColor(state),
margin: "0 auto 6px auto",
boxShadow: escalation ? getPulse(level) : "none",
border: escalation ? "1px solid rgba(255,255,255,0.4)" : "none",
}}
/>
);
}

/* ================= RAW ================= */

const r = drivers.raw;

/* ================= CORE STATES ================= */

const liquidityState =
r.liquidity > 70
? "positive"
: r.liquidity > 40
? "neutral"
: "negative";

const creditState =
r.credit > 0.9
? "positive"
: r.credit > 0.8
? "neutral"
: "negative";

const termState =
r.vixTerm > 1.05
? "positive"
: r.vixTerm > 0.95
? "neutral"
: "negative";

/* ================= SECONDARY ================= */

const gammaState =
r.gamma > 0
? "positive"
: r.gamma < 0
? "negative"
: "neutral";

const corrState =
r.correlation < 1
? "positive"
: r.correlation < 2
? "neutral"
: "negative";

const moveState =
r.move < 75
? "positive"
: r.move < 90
? "neutral"
: "negative";

/* ================= CONTEXT ================= */

const vixState =
r.vix < 18
? "positive"
: r.vix < 25
? "neutral"
: "negative";

const breadth = structure?.breadth?.b50?.value ?? 50;

const breadthState =
breadth > 70
? "positive"
: breadth > 40
? "neutral"
: "negative";

const momentumScore =
(structure?.breadth?.b20?.value ?? 50) +
(structure?.breadth?.b50?.value ?? 50);

const momentumState =
momentumScore > 120
? "positive"
: momentumScore > 80
? "neutral"
: "negative";

/* ================= NEW ================= */

const regimeState =
regimeSync?.state === "ALIGNED"
? "positive"
: regimeSync?.state === "DIVERGING"
? "negative"
: "neutral";

const dangerState =
dangerZone?.level === "LOW"
? "positive"
: dangerZone?.level === "ELEVATED"
? "neutral"
: "negative";

const escalation = Boolean(dangerZone?.escalation);

/* ================= DATA ================= */

const items = [
{ label: "LIQ", state: liquidityState, weight: 3 },
{ label: "CRD", state: creditState, weight: 3 },
{ label: "TERM", state: termState, weight: 3 },

{ label: "GAM", state: gammaState, weight: 2 },
{ label: "CORR", state: corrState, weight: 2 },
{ label: "MOVE", state: moveState, weight: 2 },

{ label: "SYNC", state: regimeState, weight: 2 },
{
label: "DANGER",
state: dangerState,
weight: 3,
escalation,
level: dangerZone?.level,
},

{ label: "VIX", state: vixState, weight: 1 },
{ label: "BRD", state: breadthState, weight: 1 },
{ label: "MOM", state: momentumState, weight: 1 },
];

/* ================= RENDER ================= */

return (
<div
style={{
background: "#0d0d0d",
border: "1px solid #333",
padding: "12px",
}}
>
<div
style={{
fontSize: "12px",
color: "#888",
marginBottom: "10px",
}}
>
SYSTEM STATE
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(6, 1fr)",
gap: "8px",
}}
>
{items.map((item) => (
<div
key={item.label}
style={{
width: "100%",
textAlign: "center",
}}
>
{dot(
item.state,
item.weight,
item.escalation,
item.level
)}

<div
style={{
fontSize: "10px",
color: "#888",
}}
>
{item.label}
</div>
</div>
))}
</div>

{!!dangerZone && (
<div
style={{
marginTop: "12px",
paddingTop: "10px",
borderTop: "1px solid #222",
display: "flex",
justifyContent: "space-between",
fontSize: "11px",
}}
>
<span style={{ color: "#777" }}>
Danger: {dangerZone.level}
</span>

<span
style={{
color:
dangerZone.level === "EXTREME"
? "#ff4d4f"
: dangerZone.level === "HIGH"
? "#fa8c16"
: "#888",
fontWeight: "bold",
}}
>
{dangerZone.score}/100
</span>
</div>
)}
</div>
);
}
