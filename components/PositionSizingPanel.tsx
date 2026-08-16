// /components/PositionSizingPanel.tsx

"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function PositionSizingPanel({
sizing,
tradeStack,
decision
}: any) {

if (!sizing) return null;

/* =====================================================
SAFE OBJECTS
===================================================== */

const components = sizing?.components ?? {};
const meta = sizing?.meta ?? {};
const sizingModel = sizing?.sizingModel ?? {};

const candidates =
Array.isArray(sizing?.candidates)
? sizing.candidates
: Array.isArray(sizing?.positions)
? sizing.positions
: [];

/* =====================================================
HELPERS
===================================================== */

function num(
value: any,
fallback = 0
): number {
const n = Number(value);
return Number.isFinite(n) ? n : fallback;
}

/*
* IMPORTANT:
*
* PositionSizingV2 writes its validated engine values
* into components.
*
* Therefore:
*
* components -> meta -> top-level -> fallback
*
* We NEVER silently use 50 for a missing engine value.
*/

function readMetric(
componentKeys: string[],
metaKeys: string[] = [],
topLevelKeys: string[] = [],
fallback = 0
) {

for (const key of componentKeys) {
if (
components[key] !== undefined &&
components[key] !== null
) {
return num(components[key], fallback);
}
}

for (const key of metaKeys) {
if (
meta[key] !== undefined &&
meta[key] !== null
) {
return num(meta[key], fallback);
}
}

for (const key of topLevelKeys) {
if (
sizing[key] !== undefined &&
sizing[key] !== null
) {
return num(sizing[key], fallback);
}
}

return fallback;
}

/* =====================================================
CORE SIZING VALUES
===================================================== */

const finalSize =
num(sizing?.size);

const rawSize =
num(
sizingModel?.rawSize,
num(components?.rawSize)
);

const adjustedSize =
num(
sizingModel?.adjustedSize,
num(components?.adjustedSize)
);

const maxSize =
num(sizingModel?.maxSize);

const edge =
num(
components?.edge,
num(meta?.edgeScore)
);

const opportunity =
num(components?.opportunity);

/* =====================================================
ENGINE INPUTS
===================================================== */

const masterScore =
readMetric(
["masterScore"],
["masterScore"],
["masterScore"]
);

const rotationScore =
readMetric(
["rotationScore"],
[],
["rotationScore"]
);

const crashProb =
readMetric(
["crashProb"],
["crashProbability"],
["crashProb", "crashProbability"]
);

const liquidityScore =
readMetric(
["liquidityScore", "liquidity"],
["liquidityScore"],
["liquidityScore"]
);

const participationScore =
readMetric(
["participationScore", "participation"],
["participationScore"],
["participationScore"]
);

const fragilityScore =
readMetric(
["fragilityScore", "fragility"],
["fragilityScore"],
["fragilityScore"]
);

const squeezeRisk =
readMetric(
["squeezeRisk", "squeeze"],
["squeezeRisk"],
["squeezeRisk"]
);

const rotationDecayScore =
readMetric(
["rotationDecayScore", "rotationDecay"],
["rotationDecayScore"],
["rotationDecayScore"]
);

const breadthVelocityScore =
readMetric(
["breadthVelocityScore", "breadthVelocity"],
["breadthVelocityScore"],
["breadthVelocityScore"]
);

const marketQualityScore =
readMetric(
["marketQualityScore", "marketQuality"],
["marketQualityScore"],
["marketQualityScore"]
);

const persistenceScore =
readMetric(
["persistenceScore", "regimePersistence"],
["persistenceScore"],
["persistenceScore"]
);

const thrustStrength =
readMetric(
["thrustStrength", "breadthThrust"],
["thrustStrength"],
["thrustStrength"]
);

/* =====================================================
META / STATE
===================================================== */

const sizingDirection =
sizing?.direction ?? "NEUTRAL";

const sizingMode =
sizing?.mode ?? "DEFENSIVE";

const riskState =
meta?.riskState ??
sizing?.riskState ??
"N/A";

const dangerLevel =
meta?.dangerLevel ??
sizing?.dangerLevel ??
"N/A";

const masterMode =
meta?.masterMode ??
"N/A";

const tradeStrength =
num(
meta?.tradeStrength,
num(
tradeStack?.tradeStrength,
num(tradeStack?.strength)
)
);

const primary =
sizing?.primary ??
sizing?.primaryFlow ??
null;

const primaryInstrument =
primary?.instrument ??
sizing?.primaryInstrument ??
candidates.find(
(candidate: any) =>
candidate?.role === "PRIMARY"
)?.instrument ??
null;

/* =====================================================
ALIGNMENT
===================================================== */

const decisionDirection =
decision?.direction ?? "NEUTRAL";

const aligned =
decisionDirection === "NEUTRAL" ||
sizingDirection === "NEUTRAL" ||
decisionDirection === sizingDirection;

/* =====================================================
COLORS
===================================================== */

function directionColor(
direction: string
) {

if (direction === "SHORT")
return "#ff4d4f";

if (direction === "LONG")
return "#52c41a";

return "#777";
}

function modeColor(
mode: string
) {

switch (mode) {

case "AGGRESSIVE":
return "#ff4d4f";

case "ACTIVE":
return "#fa8c16";

case "PROBING":
return "#fadb14";

case "DEFENSIVE":
return "#52c41a";

case "CAPITAL_PRESERVATION":
return "#ff7875";

default:
return "#777";
}
}

function metricColor(
value: number,
inverse = false
) {

const v =
Math.max(0, Math.min(100, value));

if (inverse) {

if (v >= 75)
return "#ff4d4f";

if (v >= 55)
return "#fa8c16";

if (v >= 40)
return "#fadb14";

return "#52c41a";
}

if (v >= 70)
return "#52c41a";

if (v >= 50)
return "#fadb14";

if (v >= 30)
return "#fa8c16";

return "#ff4d4f";
}

function instrumentLabel(
instrument: string
) {

switch (instrument) {

case "NASDAQ_PUT":
return "NASDAQ PUT";

case "NASDAQ_CALL":
return "NASDAQ CALL";

case "RUSSELL_CALL":
return "RUSSELL CALL";

default:
return instrument;
}
}

/* =====================================================
METRIC ROW
===================================================== */

function Metric({
label,
value,
inverse = false
}: {
label: string;
value: number;
inverse?: boolean;
}) {

return (
<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "9px"
}}
>

<div
style={{
color: "#666",
fontSize: "9px",
marginBottom: "4px"
}}
>
{label}
</div>

<div
style={{
color: metricColor(value, inverse),
fontSize: "18px",
fontWeight: "bold"
}}
>
{value}
</div>

</div>
);
}

/* =====================================================
CANDIDATES
===================================================== */

const normalizedCandidates = [
...candidates,
sizing?.nasdaqPut,
sizing?.nasdaqCall,
sizing?.russellCall
]
.filter(Boolean)
.reduce(
(list: any[], candidate: any) => {

if (
!list.some(
item =>
item?.instrument ===
candidate?.instrument
)
) {
list.push(candidate);
}

return list;

},
[]
);

/*
* If the new sizing engine does not yet return
* candidate objects, do NOT invent allocations.
*
* We display the primary sizing only.
*/

/* =====================================================
RENDER
===================================================== */

return (

<div
style={{
background: "#0b0b0b",
border: "1px solid #222",
padding: "14px"
}}
>

{/* =================================================
HEADER
================================================= */}

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
marginBottom: "12px"
}}
>

<div
style={{
color: "#aaa",
fontWeight: "bold",
fontSize: "13px"
}}
>
POSITION SIZING
</div>

<div
style={{
color:
aligned
? "#52c41a"
: "#ff4d4f",
fontSize: "10px",
fontWeight: "bold"
}}
>
{aligned
? "ALIGNED"
: "MISALIGNED"}
</div>

</div>


{/* =================================================
PRIMARY ALLOCATION
================================================= */}

<div
style={{
border: "1px solid #333",
background: "#111",
padding: "12px",
marginBottom: "12px"
}}
>

<div
style={{
color: "#666",
fontSize: "9px",
marginBottom: "6px"
}}
>
FINAL ALLOCATION
</div>

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center"
}}
>

<div>

<div
style={{
color:
primaryInstrument
? "#ddd"
: "#666",
fontWeight: "bold",
fontSize: "16px"
}}
>
{primaryInstrument
? instrumentLabel(
primaryInstrument
)
: "NO PRIMARY TRADE"}
</div>

<div
style={{
color:
directionColor(
sizingDirection
),
fontSize: "11px",
marginTop: "3px"
}}
>
{sizingDirection}
</div>

</div>

<div
style={{
textAlign: "right"
}}
>

<div
style={{
color:
getSignalColor(
finalSize,
100
),
fontSize: "28px",
fontWeight: "bold"
}}
>
{finalSize}%
</div>

<div
style={{
color:
modeColor(
sizingMode
),
fontSize: "10px"
}}
>
{sizingMode}
</div>

</div>

</div>

</div>


{/* =================================================
SIZING PIPELINE
================================================= */}

<div
style={{
border: "1px solid #222",
background: "#111",
padding: "11px",
marginBottom: "12px"
}}
>

<div
style={{
color: "#999",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "8px"
}}
>
SIZING PIPELINE
</div>

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(3, 1fr)",
gap: "8px"
}}
>

<div>
<div
style={{
color: "#666",
fontSize: "8px"
}}
>
RAW SIZE
</div>

<div
style={{
color: "#aaa",
fontWeight: "bold"
}}
>
{rawSize}%
</div>
</div>

<div>
<div
style={{
color: "#666",
fontSize: "8px"
}}
>
RISK ADJUSTED
</div>

<div
style={{
color: "#aaa",
fontWeight: "bold"
}}
>
{adjustedSize}%
</div>
</div>

<div>
<div
style={{
color: "#ddd",
fontSize: "8px"
}}
>
FINAL
</div>

<div
style={{
color:
getSignalColor(
finalSize,
100
),
fontWeight: "bold"
}}
>
{finalSize}%
</div>
</div>

</div>

</div>


{/* =================================================
ENGINE INPUTS
================================================= */}

<div
style={{
color: "#999",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "7px"
}}
>
ENGINE INPUTS
</div>

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(4, 1fr)",
gap: "7px",
marginBottom: "12px"
}}
>

<Metric
label="MASTER"
value={masterScore}
/>

<Metric
label="ROTATION"
value={rotationScore}
/>

<Metric
label="CRASH PROB"
value={crashProb}
inverse
/>

<Metric
label="LIQUIDITY"
value={liquidityScore}
/>

<Metric
label="PARTICIPATION"
value={participationScore}
/>

<Metric
label="FRAGILITY"
value={fragilityScore}
inverse
/>

<Metric
label="ROT. DECAY"
value={rotationDecayScore}
inverse
/>

<Metric
label="BREADTH VELOCITY"
value={breadthVelocityScore}
/>

<Metric
label="MARKET QUALITY"
value={marketQualityScore}
/>

<Metric
label="PERSISTENCE"
value={persistenceScore}
inverse
/>

<Metric
label="THRUST"
value={thrustStrength}
/>

<Metric
label="SQUEEZE RISK"
value={squeezeRisk}
inverse
/>

</div>


{/* =================================================
VALIDATION
================================================= */}

<div
style={{
color: "#999",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "7px"
}}
>
VALIDATION
</div>

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(2, 1fr)",
gap: "7px",
marginBottom: "12px"
}}
>

<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "8px"
}}
>

<div
style={{
color: "#666",
fontSize: "8px"
}}
>
HEALTHY LIQUIDITY
</div>

<div
style={{
color:
meta?.healthyLiquidity
? "#52c41a"
: "#777",
fontWeight: "bold",
fontSize: "10px",
marginTop: "3px"
}}
>
{meta?.healthyLiquidity
? "YES"
: "NO"}
</div>

</div>

<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "8px"
}}
>

<div
style={{
color: "#666",
fontSize: "8px"
}}
>
VALIDATED THRUST
</div>

<div
style={{
color:
meta?.validatedThrust
? "#52c41a"
: "#777",
fontWeight: "bold",
fontSize: "10px",
marginTop: "3px"
}}
>
{meta?.validatedThrust
? "YES"
: "NO"}
</div>

</div>

<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "8px"
}}
>

<div
style={{
color: "#666",
fontSize: "8px"
}}
>
POOR MARKET QUALITY
</div>

<div
style={{
color:
meta?.poorMarketQuality
? "#ff4d4f"
: "#52c41a",
fontWeight: "bold",
fontSize: "10px",
marginTop: "3px"
}}
>
{meta?.poorMarketQuality
? "YES"
: "NO"}
</div>

</div>

<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "8px"
}}
>

<div
style={{
color: "#666",
fontSize: "8px"
}}
>
STRUCTURAL FRAGILITY
</div>

<div
style={{
color:
meta?.structurallyFragile
? "#ff4d4f"
: "#52c41a",
fontWeight: "bold",
fontSize: "10px",
marginTop: "3px"
}}
>
{meta?.structurallyFragile
? "YES"
: "NO"}
</div>

</div>

</div>


{/* =================================================
CONTEXT
================================================= */}

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(4, 1fr)",
gap: "7px",
fontSize: "9px"
}}
>

<div
style={{
border: "1px solid #222",
padding: "7px",
background: "#101010"
}}
>
<div style={{ color: "#666" }}>
RISK
</div>
<div style={{ color: "#aaa" }}>
{riskState}
</div>
</div>

<div
style={{
border: "1px solid #222",
padding: "7px",
background: "#101010"
}}
>
<div style={{ color: "#666" }}>
DANGER
</div>
<div style={{ color: "#aaa" }}>
{dangerLevel}
</div>
</div>

<div
style={{
border: "1px solid #222",
padding: "7px",
background: "#101010"
}}
>
<div style={{ color: "#666" }}>
MASTER MODE
</div>
<div style={{ color: "#aaa" }}>
{masterMode}
</div>
</div>

<div
style={{
border: "1px solid #222",
padding: "7px",
background: "#101010"
}}
>
<div style={{ color: "#666" }}>
TRADE STRENGTH
</div>
<div style={{ color: "#aaa" }}>
{tradeStrength}
</div>
</div>

</div>


{/* =================================================
DEBUG / DATA INTEGRITY
================================================= */}

<div
style={{
marginTop: "10px",
paddingTop: "8px",
borderTop: "1px solid #1c1c1c",
color: "#555",
fontSize: "8px",
display: "flex",
justifyContent: "space-between"
}}
>

<span>
SIZING V2
</span>

<span>
components:{Object.keys(components).length}
</span>

<span>
candidates:{normalizedCandidates.length}
</span>

</div>

</div>
);
}
