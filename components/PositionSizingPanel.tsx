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
SAFE INPUTS
===================================================== */

const meta = sizing?.meta ?? {};
const components = sizing?.components ?? {};
const sizingModel = sizing?.sizingModel ?? {};

const candidates =
sizing?.candidates ??
sizing?.positions ??
[];

const primary =
sizing?.primary ??
sizing?.primaryFlow ??
null;

const sizingDirection =
sizing?.direction ?? "NEUTRAL";

const sizingMode =
sizing?.mode ?? "DEFENSIVE";

const finalSize =
Number(sizing?.size ?? 0);

const rawSize =
Number(
sizingModel?.rawSize ??
components?.rawSize ??
0
);

const adjustedSize =
Number(
sizingModel?.adjustedSize ??
0
);

/* =====================================================
HELPERS
===================================================== */

function directionColor(direction: string) {

if (direction === "SHORT")
return "#ff4d4f";

if (direction === "LONG")
return "#52c41a";

return "#777";
}

function stateColor(state: string) {

if (
state === "SHORT_ATTACK" ||
state === "SHORT_BUILDING"
) {
return "#ff4d4f";
}

if (
state === "LONG_ATTACK" ||
state === "LONG_BUILDING"
) {
return "#52c41a";
}

if (
state === "EARLY_DEFENSIVE_SHORT" ||
state === "EARLY_LONG"
) {
return "#fadb14";
}

return "#666";
}

function modeColor(mode: string) {

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

function instrumentLabel(instrument: string) {

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
CANDIDATE NORMALIZATION
===================================================== */

const normalizedCandidates = [

...(Array.isArray(candidates)
? candidates
: []),

sizing?.nasdaqPut,
sizing?.nasdaqCall,
sizing?.russellCall

]
.filter(Boolean)
.reduce(
(list: any[], candidate: any) => {

const exists =
list.some(
item =>
item.instrument === candidate.instrument
);

if (!exists)
list.push(candidate);

return list;

},
[]
);

/* =====================================================
FALLBACK
===================================================== */

if (
normalizedCandidates.length === 0 &&
sizing?.direction
) {

normalizedCandidates.push({

instrument:
primary?.instrument ??
"PRIMARY",

direction:
sizingDirection,

state:
primary?.state ??
"NEUTRAL",

strength:
Number(
primary?.strength ??
meta?.tradeStrength ??
0
),

size:
finalSize,

recommendedSize:
finalSize,

role:
"PRIMARY"

});

}

/* =====================================================
SORT
===================================================== */

normalizedCandidates.sort(
(a, b) => {

const aSize =
Number(
a?.recommendedSize ??
a?.size ??
0
);

const bSize =
Number(
b?.recommendedSize ??
b?.size ??
0
);

return bSize - aSize;
}
);

/* =====================================================
PRIMARY INSTRUMENT
===================================================== */

const primaryInstrument =
primary?.instrument ??
sizing?.primaryInstrument ??
normalizedCandidates.find(
candidate =>
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
RENDER
===================================================== */

return (

<div
style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "16px"
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
color: "#999",
fontWeight: "bold",
fontSize: "14px"
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
fontSize: "11px",
fontWeight: "bold"
}}
>
{aligned
? "ALIGNED"
: "MISALIGNED"}
</div>

</div>

{/* =================================================
PRIMARY SUMMARY
================================================= */}

<div
style={{
border: "1px solid #333",
background: "#111",
padding: "14px",
marginBottom: "14px"
}}
>

<div
style={{
color: "#666",
fontSize: "10px",
marginBottom: "5px"
}}
>
PRIMARY FLOW
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
fontSize: "18px"
}}
>
{primaryInstrument
? instrumentLabel(primaryInstrument)
: "NO PRIMARY TRADE"}
</div>

<div
style={{
color: directionColor(
sizingDirection
),
fontSize: "12px",
marginTop: "4px"
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
fontSize: "11px"
}}
>
{sizingMode}
</div>

</div>

</div>

</div>

{/* =================================================
THREE-WAY TRADE MAP
================================================= */}

<div
style={{
color: "#999",
fontSize: "11px",
fontWeight: "bold",
marginBottom: "8px"
}}
>
TRADE ALLOCATION
</div>

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(3, 1fr)",
gap: "8px",
marginBottom: "16px"
}}
>

{normalizedCandidates.map(
(candidate: any) => {

const size =
Number(
candidate?.recommendedSize ??
candidate?.size ??
0
);

const strength =
Number(
candidate?.strength ??
0
);

const instrument =
candidate?.instrument ??
"UNKNOWN";

const state =
candidate?.state ??
"NEUTRAL";

const isPrimary =
instrument ===
primaryInstrument;

return (

<div
key={instrument}
style={{
border:
isPrimary
? `1px solid ${stateColor(state)}`
: "1px solid #222",

background:
isPrimary
? "#151515"
: "#111",

padding: "10px"
}}
>

<div
style={{
color: "#777",
fontSize: "9px",
marginBottom: "7px"
}}
>
{instrumentLabel(
instrument
)}
</div>

<div
style={{
color:
directionColor(
candidate?.direction
),
fontSize: "11px",
fontWeight: "bold"
}}
>
{candidate?.direction ??
"NEUTRAL"}
</div>

<div
style={{
color:
stateColor(state),
fontSize: "11px",
marginTop: "3px"
}}
>
{state}
</div>

<div
style={{
color:
size > 0
? "#ddd"
: "#555",
fontSize: "22px",
fontWeight: "bold",
marginTop: "8px"
}}
>
{size}%
</div>

<div
style={{
color: "#666",
fontSize: "9px",
marginTop: "3px"
}}
>
strength {strength}
</div>

{isPrimary && (

<div
style={{
color: "#40a9ff",
fontSize: "9px",
marginTop: "6px",
fontWeight: "bold"
}}
>
PRIMARY
</div>

)}

</div>

);

}
)}

</div>

{/* =================================================
SIZING PIPELINE
================================================= */}

<div
style={{
border: "1px solid #222",
background: "#111",
padding: "12px",
marginBottom: "14px"
}}
>

<div
style={{
color: "#999",
fontSize: "11px",
fontWeight: "bold",
marginBottom: "9px"
}}
>
SIZING PIPELINE
</div>

<div
style={{
display: "flex",
justifyContent: "space-between",
color: "#aaa",
marginBottom: "5px"
}}
>
<span>Raw Size</span>
<span>{rawSize}%</span>
</div>

<div
style={{
display: "flex",
justifyContent: "space-between",
color: "#aaa",
marginBottom: "5px"
}}
>
<span>Risk Adjusted</span>
<span>{adjustedSize}%</span>
</div>

<div
style={{
display: "flex",
justifyContent: "space-between",
color: "#ddd",
fontWeight: "bold"
}}
>
<span>Final Size</span>
<span>{finalSize}%</span>
</div>

</div>

{/* =================================================
SYSTEM CONTEXT
================================================= */}

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(4, 1fr)",
gap: "8px",
fontSize: "10px"
}}
>

<div
style={{
border: "1px solid #222",
padding: "8px",
background: "#111"
}}
>
<div style={{ color: "#666" }}>
EDGE
</div>
<div style={{ color: "#aaa" }}>
{Number(
meta?.edgeScore ??
components?.edge ??
0
)}
</div>
</div>

<div
style={{
border: "1px solid #222",
padding: "8px",
background: "#111"
}}
>
<div style={{ color: "#666" }}>
RISK
</div>
<div style={{ color: "#aaa" }}>
{meta?.riskState ?? "N/A"}
</div>
</div>

<div
style={{
border: "1px solid #222",
padding: "8px",
background: "#111"
}}
>
<div style={{ color: "#666" }}>
DANGER
</div>
<div style={{ color: "#aaa" }}>
{meta?.dangerLevel ?? "N/A"}
</div>
</div>

<div
style={{
border: "1px solid #222",
padding: "8px",
background: "#111"
}}
>
<div style={{ color: "#666" }}>
MASTER
</div>
<div style={{ color: "#aaa" }}>
{meta?.masterMode ?? "N/A"}
</div>
</div>

</div>

</div>

);
}
