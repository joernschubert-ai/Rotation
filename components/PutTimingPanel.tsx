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
putTiming.summary ??
"No structural short edge";

const price = putTiming.price ?? {};
const priceQuality = price.dataQuality ?? {};
const priceComplete = priceQuality.complete === true;
function priceValue(key: string, availability: string, percent = false) {
  const value = priceQuality.measured?.[key];
  return priceQuality[availability] === true && typeof value === "number" && Number.isFinite(value)
    ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}${percent ? "%" : ""}`
    : "Not available";
}


/* =====================================================
INFO BOX
===================================================== */

function getInfo() {

switch (decision) {

case "PANIC_SHORT":
return {
label: "PANIC / EXTENDED",
color: "#fda4af",
note:
"Move extended – avoid chasing new puts"
};


case "STRONG_BUILD":
return {
label: "STRONG PUT BUILD",
color: "#fda4af",
note:
"Strong structure with price confirmation"
};


case "TACTICAL_BUILD":
return {
label: "TACTICAL PUT BUILD",
color: "#ff7a45",
note:
"Structural breakdown with tactical confirmation"
};


case "STRUCTURAL_BUILD":
return {
label: "STRUCTURAL PUT BUILD",
color: "#fdba74",
note:
"Structural short edge – price timing still developing"
};


case "DEFENSIVE_BUILD":
return {
label: "DEFENSIVE PUT BUILD",
color: "#fcd34d",
note:
"Early structural deterioration"
};


case "WAIT":
default:
return {
label: "WAIT",
color: "#94a3b8",
note:
"No immediate put entry"
};
}
}

const info = getInfo();


/* =====================================================
POSITION STATE

Wichtig:
Exit-Engine und PutTiming sind unterschiedliche Dinge.

Das Panel interpretiert deshalb nicht aggressiv
exit.short, sondern zeigt primär den Timing-State.
===================================================== */

function getPositionState() {

if (decision === "WAIT") {

return {
label: "NO NEW ENTRY",
color: "#94a3b8",
note:
"Wait for better timing"
};

}

if (decision === "PANIC_SHORT") {

return {
label: "REDUCE RISK",
color: "#fda4af",
note:
"Move may already be extended"
};

}

if (exit?.action) {

return {
label: exit.action,
color: "#fdba74",
note:
exit.summary ??
exit.reason ??
"Exit engine active"
};

}

return {
label: "STRUCTURE ACTIVE",
color: "#fdba74",
note:
"Short structure remains valid"
};
}

const positionInfo =
getPositionState();


/* =====================================================
HELPERS
===================================================== */

function bar(
value: number,
max: number
) {

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
background:
getSignalColor(
safeValue,
safeMax
),
transition:
"width 0.3s ease"
};
}


/* =====================================================
COMPONENT SAFE ACCESS
===================================================== */

const components =
putTiming.components ?? {};


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


const decayComponent =
components.decay ?? {
value: 0,
max: 4
};


/* =====================================================
META / STATES
===================================================== */

const institutionalState =
putTiming.meta?.institutionalState ??
"NEUTRAL";

const rotationDecayState =
putTiming.meta?.rotationDecayState ??
"UNKNOWN";

const rotationConfirmState =
putTiming.meta?.rotationConfirmState ??
"UNKNOWN";


/* =====================================================
RENDER
===================================================== */

return (

<div
style={{
background: "#0e1722",
border: "1px solid #334155",
padding: "16px"
}}
>

<h3
style={{
color: "#94a3b8",
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
border:
`1px solid ${info.color}`,
background: "#121d2a"
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

<div
style={{
marginBottom: "12px"
}}
>

<div style={{ color: "#94a3b8" }}>
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

<div
style={{
marginBottom: "12px"
}}
>

<div style={{ color: "#94a3b8" }}>
Execution
</div>

<div
style={{
fontWeight: "bold",

color:
execution === "FULL SIZE"
? "#fda4af"

: execution === "PARTIAL SIZE"
? "#fdba74"

: execution === "SMALL STARTER"
? "#fcd34d"

: execution === "REDUCE RISK"
? "#fda4af"

: "#94a3b8"
}}
>
{execution === "FULL SIZE" ? "STARKES EINSTIEGSSIGNAL" : execution}
</div>
<div style={{color:"#94a3b8",fontSize:"10px",marginTop:"4px"}}>Signalstufe, keine Positionsgröße. Maßgeblich ist der risikobereinigte Modellanteil im Positionspanel. </div>
<details style={{fontSize:"10px",color:"#94a3b8"}}><summary>Originale Signalstufe</summary>{execution}</details>

</div>


{/* =================================================
TIMING
================================================= */}

<div
style={{
marginBottom: "12px"
}}
>

<div style={{ color: "#94a3b8" }}>
Timing
</div>

<div>
{timing}
</div>

</div>


{/* =================================================
ENTRY WINDOW
================================================= */}

<div
style={{
marginBottom: "12px"
}}
>

<div style={{ color: "#94a3b8" }}>
Entry Window
</div>

<div
style={{
color:

entryWindow === "OPEN"
? "#fdba74"

: entryWindow === "EXTENDED"
? "#fda4af"

: "#94a3b8",

fontWeight: "bold"
}}
>
{entryWindow}
</div>

</div>


{/* =================================================
TRIGGER QUALITY
================================================= */}

<div
style={{
marginBottom: "12px"
}}
>

<div style={{ color: "#94a3b8" }}>
Trigger Quality
</div>

<div
style={{
fontSize: "12px"
}}
>
{triggerQuality}
</div>

</div>


{/* =================================================
POSITION STATE
================================================= */}

<div
style={{
marginBottom: "14px"
}}
>

<div style={{ color: "#94a3b8" }}>
Position State
</div>

<div
style={{
color:
positionInfo.color,
fontWeight: "bold"
}}
>
{positionInfo.label}
</div>

<div
style={{
fontSize: "12px",
opacity: 0.7
}}
>
{positionInfo.note}
</div>

</div>


{/* =================================================
TOTAL SCORE
================================================= */}

<div
style={{
marginBottom: "14px"
}}
>

<div style={{ color: "#94a3b8" }}>
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
background: "#334155",
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
borderTop:
"1px solid #334155",
paddingTop:
"12px"
}}
>

<div
style={{
color: "#94a3b8",
marginBottom: "10px"
}}
>
STRUCTURAL LAYERS
</div>


<LayerRow
label="Structure"
value={structuralComponent.value}
max={structuralComponent.max}
bar={bar}
/>


<LayerRow
label="Phase"
value={phaseComponent.value}
max={phaseComponent.max}
bar={bar}
/>


<LayerRow
label="Rotation"
value={rotationComponent.value}
max={rotationComponent.max}
bar={bar}
/>


<LayerRow
label="Rotation Decay"
value={decayComponent.value}
max={decayComponent.max}
bar={bar}
/>

</div>


{/* =================================================
EXECUTION LAYERS
================================================= */}

<div
style={{
borderTop:
"1px solid #334155",
paddingTop:
"12px",
marginTop:
"14px"
}}
>

<div
style={{
color: "#94a3b8",
marginBottom: "10px"
}}
>
EXECUTION QUALITY
</div>


<LayerRow
label="Price Execution"
value={priceComponent.value}
max={priceComponent.max}
bar={bar}
available={priceComplete && putTiming.layers?.price?.available === true}
/>

<div style={{ fontSize: "11px", color: priceComplete ? "#cbd5e1" : "#fcd34d", marginBottom: "12px", lineHeight: 1.6 }}>
  <div>{priceComplete ? "Price timing data complete" : "Price timing data incomplete"}</div>
  <div>5D: {priceValue("momentum5D", "momentum5DAvailable", true)}</div>
  <div>20D: {priceValue("momentum20D", "momentum20DAvailable", true)}</div>
  <div>Acceleration: {priceValue("acceleration", "accelerationAvailable")}</div>
  <div>Price state: {priceComplete ? price.state ?? "UNKNOWN" : "UNKNOWN"}</div>
  <div>Structure alignment: {price.structureAlignment ?? "UNKNOWN"}</div>
  {!priceComplete && <div>Structural bias remains separate from price entry confirmation.</div>}
</div>


<LayerRow
label="Panic"
value={panicComponent.value}
max={panicComponent.max}
bar={bar}
/>


<LayerRow
label="Contradiction"
value={contradictionComponent.value}
max={contradictionComponent.max}
bar={bar}
/>

</div>


{/* =================================================
INSTITUTIONAL STATE
================================================= */}

<div
style={{
borderTop:
"1px solid #334155",
paddingTop:
"12px",
marginTop:
"14px"
}}
>

<div
style={{
color: "#94a3b8",
fontSize: "11px",
marginBottom: "6px"
}}
>
INSTITUTIONAL STATE
</div>

<div
style={{
fontSize: "12px",
marginBottom: "4px"
}}
>
<span style={{ color: "#64748b" }}>
Bias:
</span>{" "}
<b>
{institutionalState}
</b>
</div>

<div
style={{
fontSize: "12px",
marginBottom: "4px"
}}
>
<span style={{ color: "#64748b" }}>
Rotation Decay:
</span>{" "}
{rotationDecayState}
</div>

<div
style={{
fontSize: "12px"
}}
>
<span style={{ color: "#64748b" }}>
Rotation Confirm:
</span>{" "}
{rotationConfirmState}
</div>

</div>


{/* =================================================
SUMMARY
================================================= */}

<div
style={{
marginTop: "14px",
paddingTop: "10px",
borderTop:
"1px solid #334155"
}}
>

<div
style={{
color: "#94a3b8",
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
bar,
available = true
}: any) {

const safeValue =
typeof value === "number" &&
Number.isFinite(value)
? value
: 0;

const safeMax =
typeof max === "number" &&
Number.isFinite(max) &&
max > 0
? max
: 1;


return (

<div
style={{
marginBottom: "10px"
}}
>

<div
style={{
display: "flex",
justifyContent: "space-between",
fontSize: "12px"
}}
>

<span>
{label}
</span>

<span>
{available ? `${safeValue}/${safeMax}` : "Not available"}
</span>

</div>


<div
style={{
background: "#334155",
height: "6px",
marginTop: "4px"
}}
>

<div
style={bar(
available ? safeValue : 0,
safeMax
)}
/>

</div>

</div>

);

}
