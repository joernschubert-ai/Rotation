"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function PutTimingPanel({
putTiming,
exit
}: any) {

if (!putTiming) return null;

/* =====================================================
SAFE VALUES
===================================================== */

const score =
typeof putTiming.score === "number"
? putTiming.score
: 0;

const maxScore =
typeof putTiming.maxScore === "number"
? putTiming.maxScore
: 24;

const decision =
putTiming.decision ?? "WAIT";

const timing =
putTiming.timing ?? "WAIT";

const execution =
putTiming.execution ?? "NONE";

const entryWindow =
putTiming.entryWindow ?? "CLOSED";

const triggerQuality =
putTiming.triggerQuality ?? "NONE";

const summary =
putTiming.summary ?? "No structural short edge";


/* =====================================================
INFO BOX
===================================================== */

function getInfo() {

switch (decision) {

case "PANIC_SHORT":
return {
label: "PANIC / EXTENDED",
color: "#ff4d4f",
note: "Avoid chasing new puts – reduce risk"
};


case "STRONG_BUILD":
return {
label: "STRONG PUT BUILD",
color: "#ff4d4f",
note: "Strong structure with price confirmation"
};


case "TACTICAL_BUILD":
return {
label: "TACTICAL PUT BUILD",
color: "#ff7a45",
note: "Structural breakdown with tactical confirmation"
};


case "STRUCTURAL_BUILD":
return {
label: "STRUCTURAL PUT BUILD",
color: "#fa8c16",
note: "Structural short edge – price timing still developing"
};


case "DEFENSIVE_BUILD":
return {
label: "DEFENSIVE PUT BUILD",
color: "#fadb14",
note: "Early structural deterioration"
};


case "WAIT":
default:
return {
label: "WAIT",
color: "#999",
note: "No immediate put entry"
};
}
}

const info = getInfo();


/* =====================================================
EXIT
===================================================== */

function getExit() {

if (!exit) return null;

if (decision === "WAIT") {

return {
label: "NO NEW ENTRY",
color: "#999",
note: "Wait for better timing"
};

}

if (decision === "PANIC_SHORT") {

return {
label: "REDUCE RISK",
color: "#ff4d4f",
note: "Move may already be extended"
};

}

return {
label: "STRUCTURE ACTIVE",
color: "#fa8c16",
note: "Short structure remains valid"
};
}

const exitInfo = getExit();


/* =====================================================
HELPERS
===================================================== */

function bar(value: number, max: number) {

const safeValue =
Number.isFinite(value)
? value
: 0;

const safeMax =
Number.isFinite(max) && max > 0
? max
: 1;

const pct =
Math.max(
0,
Math.min(
100,
(safeValue / safeMax) * 100
)
);

return {
width: `${pct}%`,
height: "6px",
background: getSignalColor(
safeValue,
safeMax
),
transition: "width 0.3s ease"
};
}


/* =====================================================
COMPONENT SAFE ACCESS
===================================================== */

const components =
putTiming.components ?? {};

const layers =
putTiming.layers ?? {};

const phaseComponent =
components.phase ?? {
value: 0,
max: 9
};

const rotationComponent =
components.rotation ?? {
value: 0,
max: 6
};

const structuralComponent =
components.structural ?? {
value: 0,
max: 20
};

const priceComponent =
components.price ?? {
value: 0,
max: 14
};

const panicComponent =
components.panic ?? {
value: 0,
max: 10
};

const contradictionComponent =
components.contradiction ?? {
value: 0,
max: 8
};


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

<h3
style={{
color: "#888",
marginBottom: "12px"
}}
>
PUT TIMING
</h3>


{/* =================================================
INFO BOX
================================================= */}

<div
style={{
marginBottom: "14px",
padding: "10px",
border: `1px solid ${info.color}`,
background: "#111"
}}
>

<div
style={{
color: info.color,
fontWeight: "bold"
}}
>
{info.label}
</div>

<div
style={{
fontSize: "12px",
opacity: 0.7
}}
>
{info.note}
</div>

</div>


{/* =================================================
DECISION
================================================= */}

<div style={{ marginBottom: "12px" }}>

<div style={{ color: "#777" }}>
Decision
</div>

<div
style={{
color: info.color,
fontWeight: "bold"
}}
>
{decision}
</div>

</div>


{/* =================================================
EXECUTION
================================================= */}

<div style={{ marginBottom: "12px" }}>

<div style={{ color: "#777" }}>
Execution
</div>

<div
style={{
fontWeight: "bold",
color:
execution === "FULL SIZE"
? "#ff4d4f"
: execution === "PARTIAL SIZE"
? "#fa8c16"
: execution === "SMALL STARTER"
? "#fadb14"
: execution === "REDUCE RISK"
? "#ff4d4f"
: "#999"
}}
>
{execution}
</div>

</div>


{/* =================================================
TIMING
================================================= */}

<div style={{ marginBottom: "12px" }}>

<div style={{ color: "#777" }}>
Timing
</div>

<div>
{timing}
</div>

</div>


{/* =================================================
ENTRY WINDOW
================================================= */}

<div style={{ marginBottom: "12px" }}>

<div style={{ color: "#777" }}>
Entry Window
</div>

<div
style={{
color:
entryWindow === "OPEN"
? "#fa8c16"
: entryWindow === "EXTENDED"
? "#ff4d4f"
: "#999",
fontWeight: "bold"
}}
>
{entryWindow}
</div>

</div>


{/* =================================================
TRIGGER QUALITY
================================================= */}

<div style={{ marginBottom: "12px" }}>

<div style={{ color: "#777" }}>
Trigger Quality
</div>

<div>
{triggerQuality}
</div>

</div>


{/* =================================================
EXIT
================================================= */}

{exitInfo && (

<div style={{ marginBottom: "12px" }}>

<div style={{ color: "#777" }}>
Position State
</div>

<div
style={{
color: exitInfo.color,
fontWeight: "bold"
}}
>
{exitInfo.label}
</div>

<div
style={{
fontSize: "12px",
opacity: 0.7
}}
>
{exitInfo.note}
</div>

</div>

)}


{/* =================================================
TOTAL SCORE
================================================= */}

<div style={{ marginBottom: "14px" }}>

<div style={{ color: "#777" }}>
Put Timing Score
</div>

<div
style={{
fontWeight: "bold",
fontSize: "18px"
}}
>
{score}/{maxScore}
</div>

<div
style={{
background: "#222",
height: "6px",
marginTop: "5px"
}}
>
<div
style={bar(
score,
maxScore
)}
/>
</div>

</div>


{/* =================================================
STRUCTURAL LAYERS
================================================= */}

<div
style={{
borderTop: "1px solid #222",
paddingTop: "12px"
}}
>

<div
style={{
color: "#777",
marginBottom: "10px"
}}
>
STRUCTURAL LAYERS
</div>


{/* STRUCTURE */}

<LayerRow
label="Structure"
value={structuralComponent.value}
max={structuralComponent.max}
bar={bar}
/>


{/* PHASE */}

<LayerRow
label="Phase"
value={phaseComponent.value}
max={phaseComponent.max}
bar={bar}
/>


{/* ROTATION */}

<LayerRow
label="Rotation"
value={rotationComponent.value}
max={rotationComponent.max}
bar={bar}
/>


{/* PRICE */}

<LayerRow
label="Price Execution"
value={priceComponent.value}
max={priceComponent.max}
bar={bar}
/>


{/* PANIC */}

<LayerRow
label="Panic"
value={panicComponent.value}
max={panicComponent.max}
bar={bar}
/>


{/* CONTRADICTION */}

<LayerRow
label="Contradiction"
value={contradictionComponent.value}
max={contradictionComponent.max}
bar={bar}
/>

</div>


{/* =================================================
SUMMARY
================================================= */}

<div
style={{
marginTop: "14px",
paddingTop: "10px",
borderTop: "1px solid #222"
}}
>

<div
style={{
color: "#777",
fontSize: "11px",
marginBottom: "4px"
}}
>
ENGINE SUMMARY
</div>

<div
style={{
fontSize: "12px",
opacity: 0.8
}}
>
{summary}
</div>

</div>

</div>

);

}


/* =====================================================
LAYER ROW
===================================================== */

function LayerRow({
label,
value,
max,
bar
}: any) {

const safeValue =
typeof value === "number"
? value
: 0;

const safeMax =
typeof max === "number"
? max
: 1;

return (

<div style={{ marginBottom: "10px" }}>

<div
style={{
display: "flex",
justifyContent: "space-between",
fontSize: "12px"
}}
>

<span>{label}</span>

<span>
{safeValue}/{safeMax}
</span>

</div>

<div
style={{
background: "#222",
height: "6px",
marginTop: "4px"
}}
>

<div
style={bar(
safeValue,
safeMax
)}
/>

</div>

</div>

);

}
