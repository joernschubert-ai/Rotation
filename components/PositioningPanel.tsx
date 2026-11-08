"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function PositioningPanel({
positioning,
edgeState
}: any) {

if (!positioning) return null;


/* =====================================================
COLORS
===================================================== */

function getBiasColor(
bias?: string
) {

switch (bias) {

case "BULLISH":
return "#6ee7b7";

case "BEARISH":
return "#fda4af";

default:
return "#94a3b8";

}

}


function getStateColor(
state?: string
) {

switch (state) {

case "RISK_ON":
return "#6ee7b7";

case "RISK_OFF":
return "#fda4af";

case "UNSTABLE":
return "#fdba74";

default:
return "#94a3b8";

}

}


function getCrowdingColor(
crowding?: string
) {

switch (crowding) {

case "CROWDED LONG":
return "#fda4af";

case "CROWDED SHORT":
return "#6ee7b7";

case "SQUEEZE ZONE":
return "#fdba74";

default:
return "#94a3b8";

}

}


/* =====================================================
DIVERGENCE
===================================================== */

function getDivergence() {

const bias =
positioning?.bias ??
"NEUTRAL";

const edge =
edgeState?.state ??
"NEUTRAL";


/*
Highest risk first.

Otherwise DEFENSIVE + BULLISH would
incorrectly become CROWD OVERPOSITIONED.
*/

if (
edge === "DEFENSIVE" &&
bias === "BULLISH"
) {

return {

label:
"RISK DIVERGENCE",

text:
"Crowd positioning remains bullish while the system turns defensive",

color:
"#fda4af"

};

}


/*
System building long
while positioning remains weak
*/

if (
(
edge === "BUILD" ||
edge === "CONFIRM" ||
edge === "EXPAND" ||
edge === "ATTACK"
) &&

(
bias === "BEARISH" ||
bias === "NEUTRAL"
)
) {

return {

label:
"SMART MONEY EARLY",

text:
"System structure improves before crowd positioning confirms",

color:
"#13c2c2"

};

}


/*
Bullish positioning but no structural edge
*/

if (
edge === "NEUTRAL" &&
bias === "BULLISH"
) {

return {

label:
"CROWD OVERPOSITIONED",

text:
"Positioning is bullish but structural confirmation is missing",

color:
"#fdba74"

};

}


/*
Alignment
*/

if (
(
edge === "EXPAND" ||
edge === "ATTACK"
) &&

bias === "BULLISH"
) {

return {

label:
"ALIGNED",

text:
"Structural edge and market positioning are aligned",

color:
"#6ee7b7"

};

}


/*
Defensive alignment
*/

if (
edge === "DEFENSIVE" &&
bias === "BEARISH"
) {

return {

label:
"DEFENSIVE ALIGNMENT",

text:
"System and positioning both support a defensive market stance",

color:
"#fda4af"

};

}


return {

label:
"NEUTRAL",

text:
"No meaningful positioning divergence detected",

color:
"#94a3b8"

};

}


const divergence =
getDivergence();


/* =====================================================
DATA
===================================================== */

const score =
Number(
positioning?.score ?? 50
);


const putCall =
Number(
positioning?.components?.putCall ?? 0
);


const gamma =
Number(
positioning?.components?.gamma ?? 0
);


const skew =
Number(
positioning?.components?.skew ?? 0
);


const vix =
Number(
positioning?.components?.vix ?? 0
);


/* =====================================================
SCORE BAR
===================================================== */

const scoreColor =
getSignalColor(
score,
100
);


/* =====================================================
RENDER
===================================================== */

return (

<div
style={{

background:
"#0e1722",

border:
"1px solid #334155",

padding:
"16px",

width:
"100%",

minWidth:
0,

boxSizing:
"border-box"

}}
>


{/* =================================================
HEADER
================================================= */}

<div
style={{

display:
"flex",

justifyContent:
"space-between",

alignItems:
"flex-start",

gap:
"12px",

marginBottom:
"14px",

flexWrap:
"wrap"

}}
>

<div>

<h3
style={{

margin:
0,

color:
"#cbd5e1",

fontSize:
"14px",

letterSpacing:
"0.5px"

}}
>

MARKET POSITIONING

</h3>


<div
style={{

marginTop:
"3px",

fontSize:
"10px",

color:
"#64748b"

}}
>

Crowd · Dealer Gamma · Hedging

</div>

</div>


<div
style={{

color:
scoreColor,

fontWeight:
"bold",

fontSize:
"18px",

whiteSpace:
"nowrap"

}}
>

{score}/100

</div>

</div>


{/* =================================================
DIVERGENCE
================================================= */}

<div
style={{

marginBottom:
"16px",

padding:
"10px",

border:
`1px solid ${divergence.color}`,

background:
"#121d2a"

}}
>

<div
style={{

color:
divergence.color,

fontWeight:
"bold",

fontSize:
"11px",

letterSpacing:
"0.4px"

}}
>

{divergence.label}

</div>


<div
style={{

marginTop:
"4px",

fontSize:
"11px",

color:
"#94a3b8",

lineHeight:
"1.4"

}}
>

{divergence.text}

</div>

</div>


{/* =================================================
PRIMARY STATE
================================================= */}

<div
style={{

display:
"grid",

gridTemplateColumns:
"repeat(3, minmax(0, 1fr))",

gap:
"8px",

marginBottom:
"16px"

}}
>


{/* BIAS */}

<div
style={{

background:
"#121d2a",

border:
"1px solid #334155",

padding:
"9px",

minWidth:
0

}}
>

<div
style={{

fontSize:
"9px",

color:
"#64748b"

}}
>

BIAS

</div>


<div
style={{

marginTop:
"4px",

color:
getBiasColor(
positioning?.bias
),

fontWeight:
"bold",

fontSize:
"11px",

wordBreak:
"break-word"

}}
>

{positioning?.bias}

</div>

</div>


{/* CROWDING */}

<div
style={{

background:
"#121d2a",

border:
"1px solid #334155",

padding:
"9px",

minWidth:
0

}}
>

<div
style={{

fontSize:
"9px",

color:
"#64748b"

}}
>

CROWDING

</div>


<div
style={{

marginTop:
"4px",

color:
getCrowdingColor(
positioning?.crowding
),

fontWeight:
"bold",

fontSize:
"11px",

wordBreak:
"break-word"

}}
>

{positioning?.crowding}

</div>

</div>


{/* STATE */}

<div
style={{

background:
"#121d2a",

border:
"1px solid #334155",

padding:
"9px",

minWidth:
0

}}
>

<div
style={{

fontSize:
"9px",

color:
"#64748b"

}}
>

MARKET STATE

</div>


<div
style={{

marginTop:
"4px",

color:
getStateColor(
positioning?.state
),

fontWeight:
"bold",

fontSize:
"11px",

wordBreak:
"break-word"

}}
>

{positioning?.state}

</div>

</div>

</div>


{/* =================================================
SCORE
================================================= */}

<div
style={{

marginBottom:
"16px"

}}
>

<div
style={{

display:
"flex",

justifyContent:
"space-between",

fontSize:
"10px",

color:
"#64748b",

marginBottom:
"5px"

}}
>

<span>
POSITIONING SCORE
</span>

<span>
{score}/100
</span>

</div>


<div
style={{

height:
"6px",

background:
"#334155",

overflow:
"hidden"

}}
>

<div
style={{

width:
`${Math.max(
0,
Math.min(
100,
score
)
)}%`,

height:
"100%",

background:
scoreColor,

transition:
"width 0.3s"

}}
/>

</div>

</div>


{/* =================================================
COMPONENTS
================================================= */}

<div
style={{

borderTop:
"1px solid #334155",

paddingTop:
"14px"

}}
>

<div
style={{

fontSize:
"10px",

color:
"#64748b",

marginBottom:
"10px",

letterSpacing:
"0.4px"

}}
>

POSITIONING COMPONENTS

</div>


<div
style={{

display:
"grid",

gridTemplateColumns:
"repeat(2, minmax(0, 1fr))",

gap:
"8px"

}}
>


{/* PUT CALL */}

<MetricCard
label="PUT / CALL"
value={
putCall > 0
? putCall.toFixed(2)
: "--"
}
color={
putCall > 1.3
? "#6ee7b7"
: putCall < 0.7
? "#fda4af"
: "#cbd5e1"
}
/>


{/* GAMMA */}

<MetricCard
label="DEALER GAMMA"
value={
gamma.toFixed(2)
}
color={
gamma > 0
? "#6ee7b7"
: gamma < 0
? "#fda4af"
: "#94a3b8"
}
/>


{/* SKEW */}

<MetricCard
label="SKEW"
value={
skew > 0
? skew.toFixed(2)
: "--"
}
color={
skew > 1.1
? "#6ee7b7"
: skew < 0.9
? "#fda4af"
: "#cbd5e1"
}
/>


{/* VIX */}

<MetricCard
label="VIX"
value={
vix > 0
? vix.toFixed(1)
: "--"
}
color={
vix > 25
? "#fda4af"
: vix < 20
? "#6ee7b7"
: "#fcd34d"
}
/>

</div>

</div>

</div>

);

}


/* =====================================================
METRIC CARD
===================================================== */

function MetricCard({
label,
value,
color
}: {
label: string;
value: string;
color: string;
}) {

return (

<div
style={{

background:
"#121d2a",

border:
"1px solid #334155",

padding:
"10px",

minWidth:
0

}}
>

<div
style={{

fontSize:
"9px",

color:
"#64748b"

}}
>

{label}

</div>


<div
style={{

marginTop:
"5px",

fontSize:
"14px",

fontWeight:
"bold",

color,

overflow:
"hidden",

textOverflow:
"ellipsis"

}}
>

{value}

</div>

</div>

);

}
