"use client";

export default function SystemHeatPanel({
heat
}: any) {

if (!heat) return null;


/* =====================================================
SAFE VALUES
===================================================== */

const value =
Number(
heat.value ?? 0
);


const label =
heat.label ??
"TRANSITION";


const state =
heat.state ??
"NEUTRAL";


const components =
heat.components ?? {};


const quality =
heat.quality ?? {};


const control =
heat.control ?? {};


const inputs =
heat.inputs ?? {};


/* =====================================================
COLORS
===================================================== */

function getHeatColor(
value: number
) {

if (value >= 1.20)
return "#52c41a";

if (value >= 0.40)
return "#a0d911";

if (value > -0.40)
return "#888";

if (value > -1.20)
return "#faad14";

return "#ff4d4f";

}


function getStateColor(
state?: string
) {

const s =
String(
state ?? ""
).toUpperCase();


if (
s.includes("STRONG_BULLISH")
) {
return "#52c41a";
}


if (
s.includes("BULLISH")
) {
return "#a0d911";
}


if (
s.includes("DEFENSIVE")
) {
return "#faad14";
}


if (
s.includes("BEARISH")
) {
return "#ff4d4f";
}


return "#888";

}


const heatColor =
getHeatColor(
value
);


const stateColor =
getStateColor(
state
);


/* =====================================================
SCALE POSITION
===================================================== */

const position =
Math.min(
100,
Math.max(
0,
((value + 2) / 4) * 100
)
);


/* =====================================================
COMPONENT HELPERS
===================================================== */

function getComponentColor(
value: number
) {

if (value >= 0.8)
return "#52c41a";

if (value >= 0.2)
return "#a0d911";

if (value <= -0.8)
return "#ff4d4f";

if (value <= -0.2)
return "#faad14";

return "#777";

}


function formatComponent(
value: any
) {

return Number(
value ?? 0
).toFixed(2);

}


/* =====================================================
DRIVER LIST
===================================================== */

const driverItems = [

{
label: "Participation",
value: components.participation
},

{
label: "Rotation",
value: components.rotation
},

{
label: "Breadth",
value: components.breadth
},

{
label: "Liquidity",
value: components.liquidity
},

{
label: "Momentum",
value: components.momentum
},

{
label: "Fragility",
value: components.fragility
},

{
label: "Crash Risk",
value: components.crashRisk
},

{
label: "Rotation Decay",
value: components.rotationDecay
}

];


/* =====================================================
INTERPRETATION
===================================================== */

function getInterpretation() {

if (
quality.riskOff
) {

return (
"Systemic market conditions are risk-off. " +
"Participation, structural quality or risk conditions are deteriorated. " +
"New long exposure should remain highly selective."
);

}


if (
quality.structuralWarning
) {

return (
"Market structure is under pressure. " +
"The environment does not necessarily imply an immediate crash, " +
"but institutional quality is insufficient for aggressive risk exposure."
);

}


if (
quality.strongRiskOn
) {

return (
"Broad institutional participation supports a strong risk-on environment. " +
"Trend continuation and selective long exposure are structurally supported."
);

}


if (
quality.bullishStructure
) {

return (
"The market environment is constructive. " +
"Participation and rotation are sufficiently supportive, " +
"but the regime is not yet in an extreme risk-on condition."
);

}


return (
"The market is in a transition environment. " +
"System Heat does not currently confirm either strong risk-on " +
"or strong risk-off conditions."
);

}


/* =====================================================
COMPONENT CARD
===================================================== */

function ComponentCard({
label,
value
}: any) {

const numeric =
Number(
value ?? 0
);


const color =
getComponentColor(
numeric
);


return (

<div
style={{

background:"#101010",

border:"1px solid #222",

padding:"8px",

minWidth:0

}}
>

<div
style={{

fontSize:"10px",

color:"#666",

whiteSpace:"nowrap",

overflow:"hidden",

textOverflow:"ellipsis"

}}
>

{label}

</div>


<div
style={{

marginTop:"4px",

fontSize:"13px",

fontWeight:"bold",

color

}}
>

{formatComponent(
numeric
)}

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

flexWrap:"wrap",

marginBottom:"16px"

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

SYSTEM HEAT

</h3>


<div
style={{

fontSize:"11px",

color:"#666",

marginTop:"3px"

}}
>

Institutional Market Environment

</div>

</div>


<div
style={{

color:stateColor,

border:
`1px solid ${stateColor}`,

padding:"4px 8px",

fontSize:"10px",

whiteSpace:"nowrap"

}}
>

{label}

</div>

</div>


{/* =================================================
MAIN VALUE
================================================= */}

<div
style={{

background:"#101010",

border:
`1px solid ${heatColor}`,

borderLeft:
`4px solid ${heatColor}`,

padding:"14px",

marginBottom:"14px"

}}
>

<div
style={{

display:"flex",

justifyContent:"space-between",

alignItems:"center",

gap:"10px",

flexWrap:"wrap"

}}
>

<div>

<div
style={{

fontSize:"10px",

color:"#666"

}}
>

MARKET ENVIRONMENT

</div>


<div
style={{

marginTop:"3px",

fontSize:"18px",

fontWeight:"bold",

color:heatColor

}}
>

{value.toFixed(2)}

</div>

</div>


<div
style={{

color:stateColor,

fontSize:"12px",

fontWeight:"bold"

}}
>

{state}

</div>

</div>


{/* SCALE */}

<div
style={{

position:"relative",

height:"8px",

background:"#222",

marginTop:"14px",

borderRadius:"4px"

}}
>

{/* NEUTRAL MARK */}

<div
style={{

position:"absolute",

left:"50%",

top:"-3px",

height:"14px",

width:"1px",

background:"#666"

}}
/>


{/* POSITION */}

<div
style={{

position:"absolute",

left:`calc(${position}% - 5px)`,

top:"-2px",

width:"12px",

height:"12px",

borderRadius:"50%",

background:heatColor,

boxShadow:
`0 0 8px ${heatColor}`

}}
/>

</div>


{/* SCALE LABELS */}

<div
style={{

display:"flex",

justifyContent:"space-between",

fontSize:"9px",

color:"#666",

marginTop:"6px"

}}
>

<span>
-2 Risk Off
</span>

<span>
Neutral
</span>

<span>
+2 Risk On
</span>

</div>

</div>


{/* =================================================
MAIN DRIVERS
================================================= */}

<div
style={{

fontSize:"10px",

color:"#666",

marginBottom:"7px"

}}
>

STRUCTURAL DRIVERS

</div>


<div
style={{

display:"grid",

gridTemplateColumns:
"repeat(auto-fit, minmax(120px, 1fr))",

gap:"8px",

marginBottom:"14px"

}}
>

{driverItems.map(
item => (

<ComponentCard
key={item.label}
label={item.label}
value={item.value}
/>

)
)}

</div>


{/* =================================================
CONTROL FLAGS
================================================= */}

<div
style={{

display:"flex",

flexWrap:"wrap",

gap:"6px",

marginBottom:"14px"

}}
>

{control.crashOverride && (

<div
style={{

border:"1px solid #ff4d4f",

color:"#ff4d4f",

padding:"3px 6px",

fontSize:"9px"

}}
>

CRASH OVERRIDE

</div>

)}


{control.termStress && (

<div
style={{

border:"1px solid #faad14",

color:"#faad14",

padding:"3px 6px",

fontSize:"9px"

}}
>

TERM STRESS

</div>

)}


{control.negativeGamma && (

<div
style={{

border:"1px solid #fa8c16",

color:"#fa8c16",

padding:"3px 6px",

fontSize:"9px"

}}
>

NEGATIVE GAMMA

</div>

)}


{control.doubleStress && (

<div
style={{

border:"1px solid #ff4d4f",

color:"#ff4d4f",

padding:"3px 6px",

fontSize:"9px"

}}
>

DOUBLE STRESS

</div>

)}


{control.liquidityTrap && (

<div
style={{

border:"1px solid #faad14",

color:"#faad14",

padding:"3px 6px",

fontSize:"9px"

}}
>

LIQUIDITY TRAP

</div>

)}

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
