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
return "#52c41a";

case "BEARISH":
return "#ff4d4f";

default:
return "#888";

}

}


function getStateColor(
state?: string
) {

switch (state) {

case "RISK_ON":
return "#52c41a";

case "RISK_OFF":
return "#ff4d4f";

case "UNSTABLE":
return "#fa8c16";

default:
return "#888";

}

}


function getCrowdingColor(
crowding?: string
) {

switch (crowding) {

case "CROWDED LONG":
return "#ff4d4f";

case "CROWDED SHORT":
return "#52c41a";

case "SQUEEZE ZONE":
return "#fa8c16";

default:
return "#888";

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
"#ff4d4f"

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
"#fa8c16"

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
"#52c41a"

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
"#ff4d4f"

};

}


return {

label:
"NEUTRAL",

text:
"No meaningful positioning divergence detected",

color:
"#888"

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
"#0d0d0d",

border:
"1px solid #222",

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
"#bbb",

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
"#666"

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
"#101010"

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
"#888",

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
"#101010",

border:
"1px solid #222",

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
"#666"

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
"#101010",

border:
"1px solid #222",

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
"#666"

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
"#101010",

border:
"1px solid #222",

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
"#666"

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
"#666",

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
"#222",

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
"1px solid #222",

paddingTop:
"14px"

}}
>

<div
style={{

fontSize:
"10px",

color:
"#666",

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
? "#52c41a"
: putCall < 0.7
? "#ff4d4f"
: "#bbb"
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
? "#52c41a"
: gamma < 0
? "#ff4d4f"
: "#888"
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
? "#52c41a"
: skew < 0.9
? "#ff4d4f"
: "#bbb"
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
? "#ff4d4f"
: vix < 20
? "#52c41a"
: "#faad14"
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
"#101010",

border:
"1px solid #222",

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
"#666"

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
