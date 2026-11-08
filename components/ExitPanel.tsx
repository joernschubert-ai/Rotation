"use client";

export default function ExitPanel({
exit,
phase,
crash
}: any) {

if (!exit) return null;


/* =====================================================
COLORS
===================================================== */

function getActionColor(action?: string) {

if (!action)
return "#94a3b8";

const a =
action.toUpperCase();


if (
a.includes("SYSTEM EXIT") ||
a.includes("EXIT LONG") ||
a.includes("EXIT MAJORITY")
) {
return "#fda4af";
}


if (
a.includes("REDUCE HARD")
) {
return "#fda4af";
}


if (
a.includes("REDUCE")
) {
return "#fdba74";
}


if (
a.includes("TRIM")
) {
return "#fcd34d";
}


if (
a.includes("HOLD")
) {
return "#6ee7b7";
}


if (
a.includes("MANAGE")
) {
return "#7dd3fc";
}


return "#94a3b8";

}


function getBiasColor(bias?: string) {

const b =
String(bias ?? "").toUpperCase();


if (
b.includes("SYSTEM")
) {
return "#fda4af";
}


if (
b.includes("LONG_EXIT")
) {
return "#fda4af";
}


if (
b.includes("SHORT_EXIT")
) {
return "#13c2c2";
}


if (
b.includes("MULTI")
) {
return "#fdba74";
}


if (
b.includes("CAUTION")
) {
return "#fcd34d";
}


return "#94a3b8";

}


/* =====================================================
PRIORITY COLOR
===================================================== */

function getPriorityColor(priority?: string) {

switch(priority) {

case "CRITICAL":
return "#fda4af";

case "HIGH":
return "#fdba74";

case "MEDIUM":
return "#fcd34d";

case "NORMAL":
return "#6ee7b7";

default:
return "#94a3b8";

}

}


/* =====================================================
INSTRUMENT BLOCK
===================================================== */

function InstrumentBlock({

title,
data

}: any) {

if (!data)
return null;


const actionColor =
getActionColor(
data.action
);


const reduction =
Math.round(
data.sizeReduction ?? 0
);


return (

<div
style={{

background:"#121d2a",

border:"1px solid #334155",

borderLeft:
`4px solid ${actionColor}`,

padding:"12px",

minWidth:0

}}
>

{/* TITLE */}

<div
style={{

display:"flex",

justifyContent:"space-between",

alignItems:"center",

gap:"8px",

marginBottom:"8px"

}}
>

<div
style={{

fontSize:"11px",

color:"#94a3b8",

letterSpacing:"0.5px"

}}
>

{title}

</div>


<div
style={{

fontSize:"10px",

color:
getPriorityColor(
data.priority
)

}}
>

{data.priority ?? "NORMAL"}

</div>

</div>


{/* ACTION */}

<div
style={{

fontSize:"14px",

fontWeight:"bold",

color:actionColor,

marginBottom:"8px",

wordBreak:"break-word"

}}
>

{data.action}

</div>


{/* REDUCTION */}

<div
style={{

display:"flex",

justifyContent:"space-between",

fontSize:"11px",

color:"#94a3b8"

}}
>

<span>
Reduction
</span>

<span
style={{

color:
reduction >= 70
? "#fda4af"
: reduction >= 30
? "#fcd34d"
: reduction > 0
? "#fdba74"
: "#6ee7b7",

fontWeight:"bold"

}}
>

{reduction}%

</span>

</div>


{/* BAR */}

<div
style={{

height:"5px",

background:"#334155",

marginTop:"5px",

overflow:"hidden"

}}
>

<div
style={{

height:"100%",

width:
`${Math.min(
100,
Math.max(
0,
reduction
)
)}%`,

background:
actionColor,

transition:"width 0.3s ease"

}}

/>

</div>


{/* REASON */}

<div
style={{

marginTop:"10px",

fontSize:"11px",

lineHeight:"1.45",

color:"#94a3b8"

}}
>

{data.reason ??
"No exit explanation available"}

</div>

</div>

);

}


/* =====================================================
CONTEXT
===================================================== */

function getContext() {

if (
exit.systemic
) {

return {

label:
"SYSTEMIC EXIT",

color:
"#fda4af",

text:
"Extreme systemic market conditions"

};

}


if (
crash?.probability >= 80
) {

return {

label:
"CRASH ENVIRONMENT",

color:
"#fda4af",

text:
"Crash probability elevated"

};

}


if (
phase ===
"PHASE_6_ACCELERATION"
) {

return {

label:
"ACCELERATION",

color:
"#cf1322",

text:
"Downside acceleration regime"

};

}


if (
phase ===
"PHASE_5_BREAKDOWN"
) {

return {

label:
"BREAKDOWN",

color:
"#fda4af",

text:
"Structural market breakdown"

};

}


if (
phase ===
"PHASE_4_RISK"
) {

return {

label:
"RISK REGIME",

color:
"#fdba74",

text:
"Defensive risk management"

};

}


if (
phase ===
"PHASE_3_DISTRIBUTION"
) {

return {

label:
"DISTRIBUTION",

color:
"#fcd34d",

text:
"Late-cycle structural deterioration"

};

}


return {

label:
"NEUTRAL",

color:
"#94a3b8",

text:
"No extreme exit environment"

};

}


const context =
getContext();


/* =====================================================
NET
===================================================== */

const net =
exit.net ?? {
action:"HOLD",
sizeReduction:0
};


const bias =
exit.bias ??
"STABLE";


const portfolioReduction =
Math.round(
net.sizeReduction ?? 0
);


const summary =
exit.summary ?? {};


/* =====================================================
INTERPRETATION
===================================================== */

function getInterpretation(): string {

if (exit.systemic) {

return "Systemic exit regime. Long exposure should be aggressively removed. Short exposure is also managed because reversal risk can increase during capitulation.";

}

if (bias === "LONG_EXIT_RISK") {

return "Long structures are deteriorating. Defensive reduction is prioritized while the short thesis remains structurally intact.";

}

if (bias === "SHORT_EXIT_RISK") {

return "Short exposure is facing exit risk. This does not automatically mean portfolio risk-off; it can indicate a market recovery against the short thesis.";

}

if (bias === "MULTI_DIRECTIONAL_RISK") {

return "Both long and short structures show elevated exit risk. Reduce complexity and manage exposure carefully.";

}

if (portfolioReduction >= 70) {

return "Aggressive reduction of portfolio exposure is recommended.";

}

if (portfolioReduction >= 30) {

return "Active exposure reduction is recommended.";

}

if (portfolioReduction > 0) {

return "Partial risk management is active.";

}

return "Current portfolio structures do not show a confirmed major exit trigger.";

}



/* =====================================================
RENDER
===================================================== */

return (

<div
style={{

background:"#0e1722",

border:"1px solid #334155",

padding:"16px",

width:"100%",

boxSizing:"border-box"

}}
>


{/* =================================================
HEADER
================================================= */}

<div
style={{

display:"flex",

justifyContent:"space-between",

alignItems:"flex-start",

gap:"12px",

marginBottom:"16px",

flexWrap:"wrap"

}}
>

<div>

<h3
style={{

margin:0,

color:"#cbd5e1",

fontSize:"15px"

}}
>

EXIT STRATEGY

</h3>


<div
style={{

fontSize:"11px",

color:"#64748b",

marginTop:"3px"

}}
>

Instrument-Level Risk Management

</div>

</div>


<div
style={{

fontSize:"10px",

color:context.color,

border:
`1px solid ${context.color}`,

padding:"4px 8px",

whiteSpace:"nowrap"

}}
>

{context.label}

</div>

</div>


{/* =================================================
PORTFOLIO ACTION
================================================= */}

<div
style={{

marginBottom:"16px",

padding:"14px",

border:
`1px solid ${getActionColor(net.action)}`,

background:"#121d2a"

}}
>

<div
style={{

fontSize:"10px",

color:"#64748b",

marginBottom:"5px"

}}
>

PORTFOLIO ACTION

</div>


<div
style={{

display:"flex",

justifyContent:"space-between",

alignItems:"center",

gap:"10px",

flexWrap:"wrap"

}}
>

<div
style={{

fontSize:"18px",

fontWeight:"bold",

color:
getActionColor(
net.action
)

}}
>

{net.action}

</div>


<div
style={{

fontSize:"12px",

color:
portfolioReduction >= 70
? "#fda4af"
: portfolioReduction >= 30
? "#fcd34d"
: "#6ee7b7"

}}
>

Reduction:
{" "}
<b>

{portfolioReduction}%

</b>

</div>

</div>


{/* BIAS */}

<div
style={{

marginTop:"8px",

fontSize:"11px",

color:"#94a3b8"

}}
>

Bias:
{" "}

<span
style={{

color:
getBiasColor(
bias
),

fontWeight:"bold"

}}
>

{bias}

</span>

</div>


{/* REASON */}

{net.reason && (

<div
style={{

marginTop:"8px",

fontSize:"11px",

lineHeight:"1.45",

color:"#94a3b8",

wordBreak:"break-word"

}}
>

{net.reason}

</div>

)}

</div>


{/* =================================================
INSTRUMENTS
================================================= */}

<div
style={{

display:"grid",

gridTemplateColumns:
"repeat(auto-fit, minmax(220px, 1fr))",

gap:"10px",

marginBottom:"16px"

}}
>

<InstrumentBlock
title="NASDAQ PUT"
data={exit.nasdaqPut}
/>


<InstrumentBlock
title="NASDAQ CALL"
data={exit.nasdaqCall}
/>


<InstrumentBlock
title="RUSSELL CALL"
data={exit.russellCall}
/>

</div>


{/* =================================================
SUMMARY
================================================= */}

<div
style={{

display:"grid",

gridTemplateColumns:
"repeat(auto-fit, minmax(120px, 1fr))",

gap:"8px",

marginBottom:"14px"

}}
>

<div
style={{

background:"#121d2a",

border:"1px solid #334155",

padding:"9px"

}}
>

<div
style={{

fontSize:"10px",

color:"#64748b"

}}
>

SHORT EXIT RISK

</div>

<div
style={{

marginTop:"4px",

fontSize:"14px",

fontWeight:"bold",

color:
(summary.shortReduction ?? 0) >= 50
? "#fda4af"
: "#e2e8f0"

}}
>

{summary.shortReduction ?? 0}%

</div>

</div>


<div
style={{

background:"#121d2a",

border:"1px solid #334155",

padding:"9px"

}}
>

<div
style={{

fontSize:"10px",

color:"#64748b"

}}
>

LONG EXIT RISK

</div>

<div
style={{

marginTop:"4px",

fontSize:"14px",

fontWeight:"bold",

color:
(summary.longReduction ?? 0) >= 50
? "#fda4af"
: "#e2e8f0"

}}
>

{summary.longReduction ?? 0}%

</div>

</div>


<div
style={{

background:"#121d2a",

border:"1px solid #334155",

padding:"9px"

}}
>

<div
style={{

fontSize:"10px",

color:"#64748b"

}}
>

ACTIVE EXITS

</div>

<div
style={{

marginTop:"4px",

fontSize:"14px",

fontWeight:"bold",

color:"#e2e8f0"

}}
>

{summary.activeExitCount ?? 0}

</div>

</div>

</div>


{/* =================================================
INTERPRETATION
================================================= */}

<div
style={{

padding:"10px",

border:"1px solid #334155",

fontSize:"11px",

lineHeight:"1.5",

color:"#94a3b8"

}}
>

{getInterpretation()}

</div>


</div>

);

}
