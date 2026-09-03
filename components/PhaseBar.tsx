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
"PHASE_1_EXPANSION";


const regimeState =
phaseData?.regimeState ??
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
description: "Internal Divergences"
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


const activeIndex =
Math.max(
0,
phases.findIndex(
p =>
p.key === currentPhaseKey
)
);


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

function getRegimeColor(
state?: string
) {

const s =
String(
state ?? ""
).toUpperCase();


if (
s.includes("RISK_ON") ||
s.includes("EXPANSION")
) {
return "#52c41a";
}


if (
s.includes("LATE")
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
color: "#52c41a"
};

}


if (
currentPhaseKey ===
"PHASE_2_WARNING"
) {

return {
label: "LONG / SELECTIVE",
color: "#faad14"
};

}


if (
currentPhaseKey ===
"PHASE_3_DISTRIBUTION"
) {

return {
label: "TRANSITION",
color: "#fa8c16"
};

}


if (
currentPhaseKey ===
"PHASE_4_RISK"
) {

return {
label: "DEFENSIVE",
color: "#fa541c"
};

}


if (
currentPhaseKey ===
"PHASE_5_BREAKDOWN"
) {

return {
label: "RISK OFF",
color: "#ff4d4f"
};

}


if (
currentPhaseKey ===
"PHASE_6_ACCELERATION"
) {

return {
label: "CRISIS MANAGEMENT",
color: "#722ed1"
};

}


return {
label: "CAPITULATION MANAGEMENT",
color: "#391085"
};

}


const executionMode =
getExecutionMode();


const currentPhase =
phases.find(
p =>
p.key === currentPhaseKey
) ??
phases[0];


const phaseColor =
getPhaseColor(
activeIndex
);


const regimeColor =
getRegimeColor(
regimeState
);


/* =====================================================
CONFIDENCE COLOR
===================================================== */

function getConfidenceColor(
value: number
) {

if (value >= 85)
return "#52c41a";

if (value >= 70)
return "#13c2c2";

if (value >= 55)
return "#faad14";

return "#777";

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

Institutional Market Phase Model

</div>

</div>


<div
style={{

color: executionMode.color,

border:
`1px solid ${executionMode.color}`,

padding: "4px 8px",

fontSize: "10px",

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

CURRENT PHASE

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

</div>


{/* =================================================
PHASE BAR
================================================= */}

<div
style={{

marginBottom: "6px",

overflowX: "auto",

paddingBottom: "4px"

}}
>

<div
style={{

display: "flex",

gap: "6px",

minWidth: "420px"

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

height: "10px",

background:

isActive
? getPhaseColor(i)

: isPast
? "#333"

: "#1c1c1c",

borderRadius: "4px",

transition:
"all 0.3s ease"

}}
/>

);

}
)}

</div>

</div>


{/* PHASE NUMBERS */}

<div
style={{

display: "flex",

justifyContent: "space-between",

minWidth: "420px",

fontSize: "10px",

color: "#666",

marginBottom: "16px"

}}
>

{phases.map(
(_, i) => (

<span
key={i}
style={{

color:
i === activeIndex
? phaseColor
: "#666"

}}
>

{i + 1}

</span>

)
)}

</div>


{/* =================================================
REGIME STATE
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

padding: "10px"

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

marginTop: "4px",

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

padding: "10px"

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

marginTop: "4px",

color: "#ccc",

fontWeight: "bold",

fontSize: "13px",

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

marginTop: "4px",

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

</div>

</div>


{/* =================================================
INTERPRETATION
================================================= */}

<div
style={{

padding: "10px",

border: "1px solid #222",

fontSize: "11px",

lineHeight: "1.5",

color: "#999"

}}
>

Current market classification:

{" "}

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

{subPhase}

</div>


</div>

);

}
