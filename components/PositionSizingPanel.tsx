// /components/PositionSizingPanel.tsx

"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function PositionSizingPanel({
sizing,
tradeStack,
decision,
master,
russell,
nasdaq
}: any) {

if (!sizing) return null;

/* =====================================================
SAFE INPUTS
===================================================== */

const components = sizing?.components ?? {};
const sizingModel = sizing?.sizingModel ?? {};
const meta = sizing?.meta ?? {};

const size = Number(sizing?.size ?? 0);
const mode = sizing?.mode ?? "DEFENSIVE";
const direction = sizing?.direction ?? "NEUTRAL";

const base = Number(components?.base ?? 0);
const edge = Number(components?.edge ?? 0);
const opportunity = Number(components?.opportunity ?? 0);

const rawSize = Number(
sizingModel?.rawSize ?? 0
);

const adjustedSize = Number(
sizingModel?.adjustedSize ?? 0
);

const maxSize = Number(
sizingModel?.maxSize ?? 0
);

const tradeStrength = Number(
meta?.tradeStrength ?? 0
);

const masterScore = Number(
master?.score ?? 0
);

const rotationScore = Number(
components?.rotationScore ?? 0
);

const crashProb = Number(
components?.crashProb ?? 0
);

const liquidityScore = Number(
components?.liquidityScore ?? 50
);

const fragilityScore = Number(
components?.fragilityScore ?? 50
);

const participationScore = Number(
components?.participationScore ?? 50
);

const marketQualityScore = Number(
components?.marketQualityScore ?? 50
);

const rotationDecayScore = Number(
components?.rotationDecayScore ?? 0
);

const persistenceScore = Number(
components?.persistenceScore ?? 50
);

const regimeSyncScore = Number(
components?.regimeSyncScore ?? 50
);

/* =====================================================
CONTEXT
===================================================== */

const riskState =
meta?.riskState ?? "N/A";

const dangerLevel =
meta?.dangerLevel ?? "N/A";

const masterMode =
meta?.masterMode ?? "N/A";

const healthyLiquidity =
meta?.healthyLiquidity === true;

const validatedThrust =
meta?.validatedThrust === true;

const poorMarketQuality =
meta?.poorMarketQuality === true;

const persistentWeakness =
meta?.persistentWeakness === true;

const narrowLeadership =
meta?.narrowLeadership === true;

const syntheticLiquidityRegime =
meta?.syntheticLiquidityRegime === true;

const internalDeterioration =
meta?.internalDeterioration === true;

const severeInternalBreakdown =
meta?.severeInternalBreakdown === true;

const fragileExpansion =
meta?.fragileExpansion === true;

/* =====================================================
COLORS
===================================================== */

function directionColor(value: string) {

if (value === "SHORT")
return "#ff4d4f";

if (value === "LONG")
return "#52c41a";

return "#777";
}

function modeColor(value: string) {

switch (value) {

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

function edgeColor(value: number) {

if (value >= 3)
return "#52c41a";

if (value >= 1)
return "#fadb14";

if (value > -2)
return "#fa8c16";

return "#ff4d4f";
}

function scoreColor(
value: number,
inverse = false
) {

if (inverse) {

if (value >= 75)
return "#ff4d4f";

if (value >= 55)
return "#fa8c16";

return "#52c41a";
}

return getSignalColor(value, 100);
}

/* =====================================================
ALIGNMENT
===================================================== */

const decisionDirection =
decision?.direction ?? "NEUTRAL";

const aligned =
decisionDirection === "NEUTRAL" ||
direction === "NEUTRAL" ||
decisionDirection === direction;

/* =====================================================
WHY SIZE IS LOW
===================================================== */

const blockers: string[] = [];

if (edge <= -4)
blockers.push("Strong negative edge");

else if (edge < 0)
blockers.push("Negative edge");

if (crashProb >= 40)
blockers.push("Elevated crash probability");

if (fragilityScore >= 70)
blockers.push("High structural fragility");

if (liquidityScore < 40)
blockers.push("Weak liquidity");

if (participationScore < 40)
blockers.push("Weak participation");

if (marketQualityScore < 45)
blockers.push("Poor market quality");

if (rotationDecayScore >= 70)
blockers.push("Rotation decay");

if (persistentWeakness)
blockers.push("Persistent weakness");

if (narrowLeadership)
blockers.push("Narrow leadership");

if (syntheticLiquidityRegime)
blockers.push("Synthetic liquidity");

if (internalDeterioration)
blockers.push("Internal deterioration");

if (severeInternalBreakdown)
blockers.push("Severe internal breakdown");

if (fragileExpansion)
blockers.push("Fragile expansion");

/* =====================================================
SIZING INTERPRETATION
===================================================== */

let sizeLabel = "NO SIZE";

if (size >= 70)
sizeLabel = "AGGRESSIVE";

else if (size >= 50)
sizeLabel = "ACTIVE";

else if (size >= 30)
sizeLabel = "PROBING";

else if (size > 0)
sizeLabel = "DEFENSIVE";

/* =====================================================
SMALL METRIC
===================================================== */

function Metric({
label,
value,
color
}: {
label: string;
value: string | number;
color?: string;
}) {

return (

<div
style={{
border: "1px solid #222",
background: "#111",
padding: "9px"
}}
>

<div
style={{
color: "#666",
fontSize: "9px",
marginBottom: "5px"
}}
>
{label}
</div>

<div
style={{
color: color ?? "#aaa",
fontWeight: "bold",
fontSize: "14px"
}}
>
{value}
</div>

</div>
);
}

/* =====================================================
RENDER
===================================================== */

return (

<div
style={{
background: "#0d0d0d",
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
marginBottom: "14px"
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
PRIMARY SIZE
================================================= */}

<div
style={{
border:
size > 0
? `1px solid ${modeColor(mode)}`
: "1px solid #333",
background: "#111",
padding: "14px",
marginBottom: "12px"
}}
>

<div
style={{
color: "#666",
fontSize: "9px",
marginBottom: "5px"
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
directionColor(direction),
fontSize: "16px",
fontWeight: "bold"
}}
>
{direction}
</div>

<div
style={{
color: modeColor(mode),
fontSize: "10px",
marginTop: "4px",
fontWeight: "bold"
}}
>
{sizeLabel}
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
getSignalColor(size, 100),
fontSize: "30px",
fontWeight: "bold"
}}
>
{size}%
</div>

<div
style={{
color: "#555",
fontSize: "9px"
}}
>
MAX {maxSize}%
</div>

</div>

</div>

</div>

{/* =================================================
EDGE
================================================= */}

<div
style={{
border:
`1px solid ${edgeColor(edge)}`,
background: "#111",
padding: "12px",
marginBottom: "12px"
}}
>

<div
style={{
color: "#666",
fontSize: "9px",
marginBottom: "5px"
}}
>
CENTRAL EDGE
</div>

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "baseline"
}}
>

<div
style={{
color: edgeColor(edge),
fontSize: "24px",
fontWeight: "bold"
}}
>
{edge > 0 ? "+" : ""}
{edge.toFixed(1)}
</div>

<div
style={{
color: "#777",
fontSize: "10px"
}}
>
Base {base} / Opportunity +{opportunity}
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
padding: "12px",
marginBottom: "12px"
}}
>

<div
style={{
color: "#999",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "10px"
}}
>
SIZING PIPELINE
</div>

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(3, 1fr)",
gap: "7px"
}}
>

<Metric
label="RAW SIZE"
value={`${rawSize}%`}
/>

<Metric
label="RISK ADJUSTED"
value={`${adjustedSize}%`}
/>

<Metric
label="FINAL SIZE"
value={`${size}%`}
color={getSignalColor(size, 100)}
/>

</div>

</div>

{/* =================================================
ENGINE COMPONENTS
================================================= */}

<div
style={{
color: "#999",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "8px"
}}
>
ENGINE INPUTS
</div>

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(4, 1fr)",
gap: "6px",
marginBottom: "12px"
}}
>

<Metric
label="MASTER"
value={masterScore}
color={scoreColor(masterScore)}
/>

<Metric
label="ROTATION"
value={rotationScore}
color={scoreColor(rotationScore)}
/>

<Metric
label="LIQUIDITY"
value={liquidityScore}
color={scoreColor(liquidityScore)}
/>

<Metric
label="QUALITY"
value={marketQualityScore}
color={scoreColor(marketQualityScore)}
/>

<Metric
label="PARTICIPATION"
value={participationScore}
color={scoreColor(participationScore)}
/>

<Metric
label="FRAGILITY"
value={fragilityScore}
color={scoreColor(fragilityScore, true)}
/>

<Metric
label="ROT. DECAY"
value={rotationDecayScore}
color={scoreColor(rotationDecayScore, true)}
/>

<Metric
label="PERSISTENCE"
value={persistenceScore}
color={scoreColor(persistenceScore, true)}
/>

</div>

{/* =================================================
VALIDATION FLAGS
================================================= */}

<div
style={{
border: "1px solid #222",
background: "#111",
padding: "10px",
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
VALIDATION
</div>

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(2, 1fr)",
gap: "5px",
fontSize: "9px"
}}
>

<Flag
label="HEALTHY LIQUIDITY"
active={healthyLiquidity}
/>

<Flag
label="VALIDATED THRUST"
active={validatedThrust}
/>

<Flag
label="POOR MARKET QUALITY"
active={poorMarketQuality}
negative
/>

<Flag
label="PERSISTENT WEAKNESS"
active={persistentWeakness}
negative
/>

<Flag
label="NARROW LEADERSHIP"
active={narrowLeadership}
negative
/>

<Flag
label="SYNTHETIC LIQUIDITY"
active={syntheticLiquidityRegime}
negative
/>

<Flag
label="INTERNAL DETERIORATION"
active={internalDeterioration}
negative
/>

<Flag
label="SEVERE BREAKDOWN"
active={severeInternalBreakdown}
negative
/>

</div>

</div>

{/* =================================================
WHY SIZE
================================================= */}

<div
style={{
border:
blockers.length > 0
? "1px solid #5a2525"
: "1px solid #244d2c",
background: "#111",
padding: "10px",
marginBottom: "10px"
}}
>

<div
style={{
color: "#999",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "7px"
}}
>
SIZING DIAGNOSTIC
</div>

{blockers.length === 0 ? (

<div
style={{
color: "#52c41a",
fontSize: "10px"
}}
>
No major structural sizing blocker.
</div>

) : (

<div
style={{
display: "flex",
flexWrap: "wrap",
gap: "5px"
}}
>

{blockers.slice(0, 6).map(
(blocker) => (

<span
key={blocker}
style={{
border:
"1px solid #542525",
background:
"#1a1010",
color: "#ff7875",
padding:
"4px 6px",
fontSize: "9px"
}}
>
{blocker}
</span>

)
)}

</div>

)}

</div>

{/* =================================================
FOOTER CONTEXT
================================================= */}

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(4, 1fr)",
gap: "6px",
color: "#666",
fontSize: "9px"
}}
>

<Metric
label="TRADE STRENGTH"
value={tradeStrength}
/>

<Metric
label="REGIME SYNC"
value={regimeSyncScore}
/>

<Metric
label="CRASH PROB."
value={`${crashProb}%`}
/>

<Metric
label="RISK"
value={riskState}
/>

</div>

</div>
);
}


/* =====================================================
FLAG
===================================================== */

function Flag({
label,
active,
negative = false
}: {
label: string;
active: boolean;
negative?: boolean;
}) {

let color = "#444";

if (active) {
color = negative
? "#ff4d4f"
: "#52c41a";
}

return (

<div
style={{
border:
`1px solid ${color}`,
padding: "5px 6px",
color:
active
? color
: "#555",
background:
active
? negative
? "#180f0f"
: "#0f1810"
: "#111"
}}
>
{active ? "●" : "○"} {label}
</div>

);
}
