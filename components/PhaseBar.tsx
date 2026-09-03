"use client";

export default function PhaseBar({
phase,
regime,
marketPhase
}: any) {

/* =====================================================
PHASE SOURCE
===================================================== */

const phaseData =
marketPhase ?? {};


/* =====================================================
SAFE VALUES
===================================================== */

const currentPhaseKey =
phase ??
phaseData?.phase ??
regime?.phase ??
"PHASE_1_EXPANSION";


const regimeState =
phaseData?.regimeState ??
regime?.regimeState ??
regime?.label ??
"UNKNOWN";


const subPhase =
phaseData?.subPhase ??
regime?.subPhase ??
"UNKNOWN";


const confidence =
Number(
phaseData?.confidence ??
regime?.confidence ??
regime?.score ??
0
);


/* =====================================================
PHASES
===================================================== */

const phases = [

{
key: "PHASE_1_EXPANSION",
label: "Phase 1 – Expansion",
description: "Broad Participation"
},

{
key: "PHASE_2_WARNING",
label: "Phase 2 – Warning",
description: "Early Internal Deterioration"
},

{
key: "PHASE_3_DISTRIBUTION",
label: "Phase 3 – Distribution",
description: "Institutional Distribution"
},

{
key: "PHASE_4_RISK",
label: "Phase 4 – Risk",
description: "Structural Deterioration"
},

{
key: "PHASE_5_BREAKDOWN",
label: "Phase 5 – Breakdown",
description: "Structural Breakdown"
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


/* =====================================================
ACTIVE PHASE
===================================================== */

const foundIndex =
phases.findIndex(
p => p.key === currentPhaseKey
);


const activeIndex =
foundIndex >= 0
? foundIndex
: 0;


const currentPhase =
phases[activeIndex];


/* =====================================================
PHASE COLORS
===================================================== */

function getPhaseColor(index: number) {

if (index === 0)
return "#52c41a";

if (index === 1)
return "#faad14";

if (index === 2)
return "#fa8c16";

if (index === 3)
return "#fa541c";

if (index === 4)
return "#ff4d4f";

if (index === 5)
return "#722ed1";

if (index === 6)
return "#391085";

return "#999";

}


/* =====================================================
REGIME COLORS
===================================================== */

function getRegimeColor(state?: string) {

const s =
String(state ?? "").toUpperCase();


if (
s.includes("RISK_ON") ||
s.includes("EXPANSION") ||
s.includes("ROTATIONAL_EXPANSION")
) {
return "#52c41a";
}


if (
s.includes("LATE_EXPANSION")
) {
return "#faad14";
}


if (
s.includes("TRANSITION")
) {
return "#fa8c16";
}


if (
s.includes("FRAGILE")
) {
return "#fa541c";
}


if (
s.includes("RISK_OFF") ||
s.includes("BREAKDOWN")
) {
return "#ff4d4f";
}


if (
s.includes("CRISIS")
) {
return "#722ed1";
}


if (
s.includes("CAPITULATION")
) {
return "#391085";
}


return "#999";

}


/* =====================================================
EXECUTION MODE
===================================================== */

function getExecutionMode() {

if (
currentPhaseKey ===
"PHASE_1_EXPANSION"
) {

return {
label: "LONG REGIME",
color: "#52c41a",
description:
"Trend participation and long exposure preferred"
};

}


if (
currentPhaseKey ===
"PHASE_2_WARNING"
) {

return {
label: "LONG / SELECTIVE",
color: "#faad14",
description:
"Maintain longs selectively while monitoring deterioration"
};

}


if (
currentPhaseKey ===
"PHASE_3_DISTRIBUTION"
) {

return {
label: "TRANSITION",
color: "#fa8c16",
description:
"Reduce aggressive exposure and prepare for regime transition"
};

}


if (
currentPhaseKey ===
"PHASE_4_RISK"
) {

return {
label: "DEFENSIVE",
color: "#fa541c",
description:
"Capital preservation and defensive positioning"
};

}


if (
currentPhaseKey ===
"PHASE_5_BREAKDOWN"
) {

return {
label: "RISK OFF",
color: "#ff4d4f",
description:
"Structural breakdown confirmed"
};

}


if (
currentPhaseKey ===
"PHASE_6_ACCELERATION"
) {

return {
label: "CRISIS MANAGEMENT",
color: "#722ed1",
description:
"Downside acceleration and extreme risk management"
};

}


return {

label: "CAPITULATION MANAGEMENT",

color: "#391085",

description:
"Panic exhaustion and reversal risk management"

};

}


const executionMode =
getExecutionMode();


const phaseColor =
getPhaseColor(activeIndex);


const regimeColor =
getRegimeColor(regimeState);


/* =====================================================
CONFIDENCE COLOR
===================================================== */

function getConfidenceColor(value: number) {

if (value >= 85)
return "#52c41a";

if (value >= 70)
return "#13c2c2";

if (value >= 55)
return "#faad14";

return "#777";

}


/* =====================================================
CONFIDENCE LABEL
===================================================== */

function getConfidenceLabel(value: number) {

if (value >= 85)
return "HIGH";

if (value >= 70)
return "CONFIRMED";

if (value >= 55)
return "MODERATE";

return "LOW";

}


/* =====================================================
PHASE STATUS
===================================================== */

function getPhaseStatus(index: number) {

if (index === activeIndex)
return "ACTIVE";

if (index < activeIndex)
return "PASSED";

return "PENDING";

}


/* =====================================================
RENDER
===================================================== */

return (

<div
style={{

background: "#0d0d0d",

border: "1px solid #222",

padding: "16px",

width: "100%",

boxSizing: "border-box"

}}
>


{/* =================================================
HEADER
================================================= */}

<div
style={{

display: "flex",

justifyContent: "space-between",

alignItems: "flex-start",

gap: "12px",

marginBottom: "16px",

flexWrap: "wrap"

}}
>

<div>

<h3
style={{

margin: 0,

color: "#bbb",

fontSize: "15px"

}}
>

MARKET REGIME

</h3>


<div
style={{

fontSize: "11px",

color: "#666",

marginTop: "3px"

}}
>

Institutional 7-Phase Market Model

</div>

</div>


<div
style={{

color: executionMode.color,

border:
`1px solid ${executionMode.color}`,

padding: "5px 9px",

fontSize: "10px",

fontWeight: "bold",

whiteSpace: "nowrap"

}}
>

{executionMode.label}

</div>

</div>


{/* =================================================
CURRENT PHASE
================================================= */}

<div
style={{

background: "#101010",

border:
`1px solid ${phaseColor}`,

borderLeft:
`4px solid ${phaseColor}`,

padding: "12px",

marginBottom: "14px"

}}
>

<div
style={{

fontSize: "10px",

color: "#666",

marginBottom: "4px"

}}
>

CURRENT MARKET PHASE

</div>


<div
style={{

color: phaseColor,

fontWeight: "bold",

fontSize: "17px"

}}
>

● {currentPhase.label}

</div>


<div
style={{

fontSize: "11px",

color: "#777",

marginTop: "4px"

}}
>

{currentPhase.description}

</div>


<div
style={{

fontSize: "11px",

color: "#888",

marginTop: "8px",

lineHeight: "1.4"

}}
>

{executionMode.description}

</div>

</div>


{/* =================================================
PHASE PROGRESSION
================================================= */}

<div
style={{

marginBottom: "16px",

overflowX: "auto",

paddingBottom: "4px"

}}
>

<div
style={{

minWidth: "420px"

}}
>


{/* PHASE BAR */}

<div
style={{

display: "flex",

gap: "6px",

marginBottom: "6px"

}}
>

{phases.map(
(p, i) => {

const isActive =
i === activeIndex;


const isPast =
i < activeIndex;


return (

<div
key={p.key}
style={{

flex: 1,

height:
isActive
? "12px"
: "8px",

marginTop:
isActive
? "0"
: "2px",

background:

isActive
? getPhaseColor(i)

: isPast
? "#333"

: "#1c1c1c",

borderRadius: "4px",

transition:
"all 0.3s ease",

boxShadow:

isActive
? `0 0 8px ${getPhaseColor(i)}55`
: "none"

}}
/>

);

}
)}

</div>


{/* PHASE NUMBERS */}

<div
style={{

display: "flex",

justifyContent: "space-between",

fontSize: "10px",

color: "#666"

}}
>

{phases.map(
(_, i) => (

<span
key={i}
style={{

flex: 1,

textAlign: "center",

color:

i === activeIndex
? phaseColor
: "#666",

fontWeight:

i === activeIndex
? "bold"
: "normal"

}}
>

{i + 1}

</span>

)
)}

</div>


{/* PHASE LABELS */}

<div
style={{

display: "flex",

marginTop: "5px",

fontSize: "9px",

color: "#555"

}}
>

{phases.map(
(p, i) => (

<div
key={p.key}
style={{

flex: 1,

textAlign: "center",

color:

i === activeIndex
? phaseColor
: "#555",

overflow: "hidden",

whiteSpace: "nowrap",

textOverflow: "ellipsis"

}}
>

{getPhaseStatus(i)}

</div>

)
)}

</div>

</div>

</div>


{/* =================================================
REGIME DATA
================================================= */}

<div
style={{

display: "grid",

gridTemplateColumns:
"repeat(auto-fit, minmax(180px, 1fr))",

gap: "10px",

marginBottom: "14px"

}}
>


{/* REGIME */}

<div
style={{

background: "#101010",

border: "1px solid #222",

padding: "10px",

minWidth: 0

}}
>

<div
style={{

fontSize: "10px",

color: "#666"

}}
>

REGIME STATE

</div>


<div
style={{

marginTop: "5px",

color: regimeColor,

fontWeight: "bold",

fontSize: "15px",

wordBreak: "break-word"

}}
>

{regimeState}

</div>

</div>


{/* SUBPHASE */}

<div
style={{

background: "#101010",

border: "1px solid #222",

padding: "10px",

minWidth: 0

}}
>

<div
style={{

fontSize: "10px",

color: "#666"

}}
>

SUB PHASE

</div>


<div
style={{

marginTop: "5px",

color: "#ccc",

fontWeight: "bold",

fontSize: "13px",

lineHeight: "1.35",

wordBreak: "break-word"

}}
>

{subPhase}

</div>

</div>


{/* CONFIDENCE */}

<div
style={{

background: "#101010",

border: "1px solid #222",

padding: "10px"

}}
>

<div
style={{

fontSize: "10px",

color: "#666"

}}
>

PHASE CONFIDENCE

</div>


<div
style={{

marginTop: "5px",

fontSize: "16px",

fontWeight: "bold",

color:
getConfidenceColor(
confidence
)

}}
>

{Math.round(confidence)}%

</div>


<div
style={{

marginTop: "2px",

fontSize: "10px",

color:
getConfidenceColor(
confidence
)

}}
>

{getConfidenceLabel(confidence)}

</div>

</div>

</div>


{/* =================================================
INTERPRETATION
================================================= */}

<div
style={{

padding: "11px",

border: "1px solid #222",

borderLeft:
`3px solid ${phaseColor}`,

fontSize: "11px",

lineHeight: "1.55",

color: "#999",

background: "#101010"

}}
>

<span style={{ color: "#666" }}>
MARKET CLASSIFICATION
</span>

<br />

<span
style={{

color: phaseColor,

fontWeight: "bold"

}}
>

{currentPhase.label}

</span>

{" · "}

<span
style={{

color: regimeColor,

fontWeight: "bold"

}}
>

{regimeState}

</span>

{" · "}

<span
style={{

color: "#ccc",

fontWeight: "bold"

}}
>

{subPhase}

</span>

</div>

</div>

);

}
