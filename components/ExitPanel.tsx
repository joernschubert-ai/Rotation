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
return "#777";

const a =
action.toUpperCase();


if (
a.includes("SYSTEM EXIT") ||
a.includes("EXIT LONG") ||
a.includes("EXIT MAJORITY")
) {
return "#ff4d4f";
}


if (
a.includes("REDUCE HARD")
) {
return "#ff4d4f";
}


if (
a.includes("REDUCE")
) {
return "#fa8c16";
}


if (
a.includes("TRIM")
) {
return "#faad14";
}


if (
a.includes("HOLD")
) {
return "#52c41a";
}


if (
a.includes("MANAGE")
) {
return "#40a9ff";
}


return "#999";

}


function getBiasColor(bias?: string) {

const b =
String(bias ?? "").toUpperCase();


if (
b.includes("SYSTEM")
) {
return "#ff4d4f";
}


if (
b.includes("LONG_EXIT")
) {
return "#ff4d4f";
}


if (
b.includes("SHORT_EXIT")
) {
return "#13c2c2";
}


if (
b.includes("MULTI")
) {
return "#fa8c16";
}


if (
b.includes("CAUTION")
) {
return "#faad14";
}


return "#999";

}


/* =====================================================
PRIORITY COLOR
===================================================== */

function getPriorityColor(priority?: string) {

switch(priority) {

case "CRITICAL":
return "#ff4d4f";

case "HIGH":
return "#fa8c16";

case "MEDIUM":
return "#faad14";

case "NORMAL":
return "#52c41a";

default:
return "#777";

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

background:"#101010",

border:"1px solid #222",

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

color:"#777",

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

color:"#777"

}}
>

<span>
Reduction
</span>

<span
style={{

color:
reduction >= 70
? "#ff4d4f"
: reduction >= 30
? "#faad14"
: reduction > 0
? "#fa8c16"
: "#52c41a",

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

background:"#222",

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

color:"#888"

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
"#ff4d4f",

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
"#ff4d4f",

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
"#ff4d4f",

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
"#fa8c16",

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
"#faad14",

text:
"Late-cycle structural deterioration"

};

}


return {

label:
"NEUTRAL",

color:
"#777",

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

background:"#0d0d0d",

border:"1px solid #222",

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

color:"#bbb",

fontSize:"15px"

}}
>

EXIT STRATEGY

</h3>


<div
style={{

fontSize:"11px",

color:"#666",

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

background:"#101010"

}}
>

<div
style={{

fontSize:"10px",

color:"#666",

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
? "#ff4d4f"
: portfolioReduction >= 30
? "#faad14"
: "#52c41a"

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

color:"#777"

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

color:"#888",

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

background:"#101010",

border:"1px solid #222",

padding:"9px"

}}
>

<div
style={{

fontSize:"10px",

color:"#666"

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
? "#ff4d4f"
: "#ddd"

}}
>

{summary.shortReduction ?? 0}%

</div>

</div>


<div
style={{

background:"#101010",

border:"1px solid #222",

padding:"9px"

}}
>

<div
style={{

fontSize:"10px",

color:"#666"

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
? "#ff4d4f"
: "#ddd"

}}
>

{summary.longReduction ?? 0}%

</div>

</div>


<div
style={{

background:"#101010",

border:"1px solid #222",

padding:"9px"

}}
>

<div
style={{

fontSize:"10px",

color:"#666"

}}
>

ACTIVE EXITS

</div>

<div
style={{

marginTop:"4px",

fontSize:"14px",

fontWeight:"bold",

color:"#ddd"

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

border:"1px solid #222",

fontSize:"11px",

lineHeight:"1.5",

color:"#999"

}}
>

{getInterpretation()}

</div>


</div>

);

}
