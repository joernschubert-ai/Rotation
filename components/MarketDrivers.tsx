// /components/MarketDrivers.tsx

"use client";

/* ============================================================
MARKET DRIVERS PANEL
============================================================

AUFGABE

Das Market Drivers Panel zeigt die externen und
strukturellen Marktkräfte.

ES ZEIGT:

- Volatility environment
- VIX term structure
- Volatility of volatility
- Gamma environment
- Liquidity
- Credit
- Correlation
- Breadth
- MOVE
- Structural fragility
- Dealer compression
- Passive flow risk
- Volatility suppression

SEMANTICS

DRIVER SCORE:
HIGH = CONSTRUCTIVE
LOW = DEFENSIVE

FRAGILITY:
HIGH = RISK

COMPRESSION:
HIGH = STRUCTURAL RISK

PASSIVE FLOW:
HIGH = CONCENTRATION RISK

VOL SUPPRESSION:
HIGH = SUPPRESSED VOLATILITY RISK

============================================================ */

export default function MarketDrivers({
drivers,
earlyWarning,
regimeSync,
executionState,
dangerZone,
}: any) {

if (!drivers) {
return null;
}

/* ==========================================================
SAFE DATA
========================================================== */

const states =
drivers?.states ?? {};

const raw =
drivers?.raw ?? {};


/* ==========================================================
HELPERS
========================================================== */

function safeNumber(
value: unknown,
fallback = 0
) {

const numeric =
Number(value);

return Number.isFinite(numeric)
? numeric
: fallback;

}

function clamp(
value: number,
min = 0,
max = 100
) {

return Math.max(
min,
Math.min(max, value)
);

}

function round(
value: number,
decimals = 1
) {

const factor =
Math.pow(10, decimals);

return (
Math.round(value * factor) /
factor
);

}


/* ==========================================================
COLORS
========================================================== */

function positiveColor(
value: number
) {

const safeValue =
clamp(value);

if (safeValue >= 75) {
return "#52c41a";
}

if (safeValue >= 60) {
return "#95de64";
}

if (safeValue >= 45) {
return "#faad14";
}

if (safeValue >= 30) {
return "#ff7875";
}

return "#ff4d4f";

}


function riskColor(
value: number
) {

const safeValue =
clamp(value);

if (safeValue >= 75) {
return "#ff4d4f";
}

if (safeValue >= 55) {
return "#ff7875";
}

if (safeValue >= 35) {
return "#faad14";
}

if (safeValue >= 20) {
return "#95de64";
}

return "#52c41a";

}


function getColor(
type: string,
value: number
) {

switch (type) {

case "vix":

return value < 18
? "#52c41a"
: value < 25
? "#faad14"
: "#ff4d4f";


case "term":

return value > 1.05
? "#52c41a"
: value >= 0.95
? "#faad14"
: "#ff4d4f";


case "volOfVol":

return value < 1.10
? "#52c41a"
: value < 1.30
? "#faad14"
: "#ff4d4f";


case "liquidity":

return value > 70
? "#52c41a"
: value > 40
? "#faad14"
: "#ff4d4f";


case "gamma":

return value > 0
? "#52c41a"
: value < 0
? "#ff4d4f"
: "#faad14";


case "skew":

return value < 105
? "#52c41a"
: value < 120
? "#faad14"
: "#ff4d4f";


case "credit":

return value > 0.90
? "#52c41a"
: value > 0.80
? "#faad14"
: "#ff4d4f";


case "correlation":

return value < 1
? "#52c41a"
: value < 2
? "#faad14"
: "#ff4d4f";


case "breadth":

return value > 70
? "#52c41a"
: value > 50
? "#95de64"
: value > 40
? "#faad14"
: "#ff4d4f";


case "move":

return value < 75
? "#52c41a"
: value < 90
? "#faad14"
: "#ff4d4f";


default:

return "#999";

}

}


/* ==========================================================
EXECUTION COLORS
========================================================== */

function marketModeColor(
value: string
) {

if (
value === "RISK_ON"
) {
return "#52c41a";
}

if (
value === "RISK_OFF"
) {
return "#ff4d4f";
}

return "#faad14";

}


function tacticalBiasColor(
value: string
) {

if (
value.includes("LONG") ||
value === "BULLISH"
) {
return "#52c41a";
}

if (
value.includes("SHORT") ||
value === "BEARISH"
) {
return "#ff4d4f";
}

return "#faad14";

}


function riskStateColor(
value: string
) {

if (
value === "STABLE"
) {
return "#52c41a";
}

if (
value === "NORMAL"
) {
return "#95de64";
}

if (
value === "FRAGILE"
) {
return "#faad14";
}

return "#ff4d4f";

}


function syncColor(
state: string
) {

if (
state === "ALIGNED"
) {
return "#52c41a";
}

if (
state === "DIVERGING"
) {
return "#ff4d4f";
}

return "#faad14";

}


/* ==========================================================
DATA
========================================================== */

const driverScore =
safeNumber(
drivers?.score,
50
);

const fragility =
safeNumber(
drivers?.fragility
);

const dealerCompression =
safeNumber(
drivers?.dealerCompression
);

const passiveFlowRisk =
safeNumber(
drivers?.passiveFlowRisk
);

const volSuppression =
safeNumber(
drivers?.volSuppression
);


/* ================= RAW ================= */

const vix =
safeNumber(raw?.vix);

const vixTerm =
safeNumber(
raw?.vixTerm,
1
);

const volOfVol =
safeNumber(
raw?.volOfVol,
1
);

const liquidity =
safeNumber(
raw?.liquidity,
50
);

const rawGamma =
safeNumber(
raw?.rawGamma
);

const effectiveGamma =
safeNumber(
raw?.effectiveGamma ??
raw?.rawGamma
);

const skew =
safeNumber(
raw?.skew
);

const credit =
safeNumber(
raw?.credit,
1
);

const correlation =
safeNumber(
raw?.correlation
);

const breadth =
safeNumber(
raw?.breadth
);

/*
* MOVE always shown with one decimal.
*/

const move =
round(
safeNumber(
raw?.move
),
1
);


/* ==========================================================
EXECUTION CONTEXT
========================================================== */

const syncScore =
safeNumber(
regimeSync?.score ??
regimeSync?.regimeSyncScore,
50
);

const syncState =
regimeSync?.state ??
regimeSync?.regimeSyncState ??
"TRANSITION";


const marketMode =
executionState?.marketMode ??
"TRANSITION";

const tacticalBias =
executionState?.tacticalBias ??
"NEUTRAL";

const riskState =
executionState?.riskState ??
"FRAGILE";


const dangerState =
dangerZone?.state ??
"NORMAL";


const earlyWarningActive =
Boolean(
earlyWarning?.active ??
earlyWarning
);


/* ==========================================================
GLOBAL STATE
========================================================== */

const globalState =
drivers?.globalState ??
"NEUTRAL";


function globalStateColor() {

if (
globalState === "RISK_ON"
) {
return "#52c41a";
}

if (
globalState === "FRAGILE_RISK_ON"
) {
return "#faad14";
}

if (
globalState === "COMPRESSED_MELTUP"
) {
return "#ff7875";
}

if (
globalState === "INTERNAL_DISTRIBUTION"
) {
return "#ff4d4f";
}

if (
globalState === "RISK_OFF"
) {
return "#ff4d4f";
}

return "#faad14";

}


/* ==========================================================
SUMMARY
========================================================== */

function getSummary() {

if (
dangerState === "CRITICAL" ||
riskState === "CRISIS"
) {

return {
text:
"Critical market instability detected",

color:
"#ff4d4f",
};

}


if (
globalState ===
"INTERNAL_DISTRIBUTION"
) {

return {
text:
"Internal distribution despite index-level stability",

color:
"#ff4d4f",
};

}


if (
globalState ===
"COMPRESSED_MELTUP"
) {

return {
text:
"Compressed market: low volatility with elevated structural risk",

color:
"#ff7875",
};

}


if (
globalState ===
"FRAGILE_RISK_ON"
) {

return {
text:
"Risk-on price environment with weakening internal participation",

color:
"#faad14",
};

}


if (
globalState ===
"RISK_OFF"
) {

return {
text:
"Defensive market driver environment",

color:
"#ff4d4f",
};

}


if (
marketMode === "RISK_ON" &&
syncState === "ALIGNED"
) {

return {
text:
"Broad institutional regime alignment",

color:
"#52c41a",
};

}


if (
earlyWarningActive
) {

return {
text:
"Early structural warning signals detected",

color:
"#faad14",
};

}


return {
text:
"Mixed market driver environment",

color:
"#999",
};

}


const summary =
getSummary();


/* ==========================================================
RENDER BLOCK
========================================================== */

function renderBlock(
title: string,
value: string,
color: string,
subLabel?: string
) {

return (

<div
style={{
border:
"1px solid #222",

padding:
"12px",

background:
"#111",

minWidth:
0,
}}
>

<div
style={{
fontSize:
"10px",

color:
"#666",

marginBottom:
"6px",

letterSpacing:
"0.8px",

whiteSpace:
"nowrap",

overflow:
"hidden",

textOverflow:
"ellipsis",
}}
>
{title}
</div>

<div
style={{
fontWeight:
"bold",

color,

fontSize:
"15px",

wordBreak:
"break-word",
}}
>
{value}
</div>

{subLabel && (

<div
style={{
marginTop:
"5px",

color:
"#555",

fontSize:
"10px",

lineHeight:
1.4,
}}
>
{subLabel}
</div>

)}

</div>

);

}


/* ==========================================================
RENDER
========================================================== */

return (

<div
style={{
background:
"#0d0d0d",

border:
`1px solid ${summary.color}`,

padding:
"16px",
}}
>

{/* ======================================================
HEADER
====================================================== */}

<div
className="
mb-4
flex
flex-col
gap-3
sm:flex-row
sm:items-start
sm:justify-between
"
>

<div>

<h3
style={{
margin:
"0 0 5px 0",

color:
"#ddd",

fontSize:
"16px",

fontWeight:
700,
}}
>
MARKET DRIVERS
</h3>

<div
style={{
color:
"#666",

fontSize:
"10px",

textTransform:
"uppercase",

letterSpacing:
"1px",
}}
>
Volatility, liquidity & structural market forces
</div>

</div>


<div
className="
text-left
sm:text-right
"
>

<div
style={{
color:
positiveColor(
driverScore
),

fontSize:
"28px",

fontWeight:
800,

lineHeight:
1,
}}
>
{Math.round(
driverScore
)}
</div>

<div
style={{
color:
"#666",

fontSize:
"10px",

marginTop:
"5px",
}}
>
DRIVER QUALITY
</div>

</div>

</div>


{/* ======================================================
SUMMARY
====================================================== */}

<div
style={{
marginBottom:
"16px",

padding:
"12px",

border:
`1px solid ${summary.color}`,

color:
summary.color,

background:
`${summary.color}10`,

fontWeight:
"bold",

textAlign:
"center",

fontSize:
"12px",

lineHeight:
1.5,
}}
>
{summary.text}
</div>


{/* ======================================================
EXECUTION CONTEXT
====================================================== */}

<div
style={{
marginBottom:
"16px",
}}
>

<div
style={{
color:
"#666",

fontSize:
"10px",

marginBottom:
"10px",

textTransform:
"uppercase",

letterSpacing:
"1px",
}}
>
Institutional Context
</div>

<div
className="
grid
grid-cols-2
gap-2
lg:grid-cols-4
"
>

{renderBlock(
"MODE",
marketMode,
marketModeColor(
marketMode
)
)}

{renderBlock(
"BIAS",
tacticalBias,
tacticalBiasColor(
tacticalBias
)
)}

{renderBlock(
"RISK STATE",
riskState,
riskStateColor(
riskState
)
)}

{renderBlock(
"REGIME SYNC",
`${Math.round(
syncScore
)}/100`,
syncColor(
syncState
),
syncState
)}

</div>

</div>


{/* ======================================================
PRIMARY DRIVERS
====================================================== */}

<div
style={{
borderTop:
"1px solid #222",

paddingTop:
"16px",

marginBottom:
"16px",
}}
>

<div
style={{
color:
"#666",

fontSize:
"10px",

marginBottom:
"10px",

textTransform:
"uppercase",

letterSpacing:
"1px",
}}
>
Primary Market Drivers
</div>

<div
className="
grid
grid-cols-1
gap-2
sm:grid-cols-2
xl:grid-cols-3
"
>

{renderBlock(
"VIX",
vix.toFixed(1),
getColor(
"vix",
vix
),
states?.vol
)}

{renderBlock(
"TERM STRUCTURE",
states?.term ??
"–",
getColor(
"term",
vixTerm
),
`Ratio ${vixTerm.toFixed(3)}`
)}

{renderBlock(
"VOL OF VOL",
volOfVol.toFixed(3),
getColor(
"volOfVol",
volOfVol
),
states?.volOfVol
)}

{renderBlock(
"LIQUIDITY",
liquidity.toFixed(1),
getColor(
"liquidity",
liquidity
),
states?.liquidity
)}

{renderBlock(
"EFFECTIVE GAMMA",
effectiveGamma.toFixed(1),
getColor(
"gamma",
effectiveGamma
),
`Raw ${rawGamma.toFixed(1)}`
)}

{renderBlock(
"SKEW",
skew.toFixed(1),
getColor(
"skew",
skew
),
states?.skew
)}

{renderBlock(
"CREDIT",
states?.credit ??
"–",
getColor(
"credit",
credit
),
credit.toFixed(3)
)}

{renderBlock(
"CORRELATION",
correlation.toFixed(2),
getColor(
"correlation",
correlation
)
)}

{renderBlock(
"BREADTH",
`${breadth.toFixed(1)}%`,
getColor(
"breadth",
breadth
)
)}

{renderBlock(
"MOVE",
move.toFixed(1),
getColor(
"move",
move
),
states?.move
)}

{renderBlock(
"GLOBAL STATE",
globalState,
globalStateColor()
)}

{renderBlock(
"STRUCTURAL FRAGILITY",
`${Math.round(
fragility
)}/100`,
riskColor(
fragility
)
)}

</div>

</div>


{/* ======================================================
STRUCTURAL RISK DIAGNOSTICS
====================================================== */}

<div
style={{
borderTop:
"1px solid #222",

paddingTop:
"16px",
}}
>

<div
style={{
color:
"#666",

fontSize:
"10px",

marginBottom:
"10px",

textTransform:
"uppercase",

letterSpacing:
"1px",
}}
>
Structural Risk Diagnostics
</div>

<div
className="
grid
grid-cols-1
gap-2
sm:grid-cols-3
"
>

{renderBlock(
"DEALER COMPRESSION",
`${Math.round(
dealerCompression
)}/100`,
riskColor(
dealerCompression
),
"High = compressed market structure"
)}

{renderBlock(
"PASSIVE FLOW RISK",
`${Math.round(
passiveFlowRisk
)}/100`,
riskColor(
passiveFlowRisk
),
"High = concentration risk"
)}

{renderBlock(
"VOL SUPPRESSION",
`${Math.round(
volSuppression
)}/100`,
riskColor(
volSuppression
),
"High = suppressed volatility risk"
)}

</div>

</div>


{/* ======================================================
FOOTER
====================================================== */}

<div
style={{
marginTop:
"16px",

color:
"#555",

fontSize:
"10px",

lineHeight:
1.5,
}}
>
Driver Quality measures the constructive quality of the
market-driver environment. Structural fragility,
compression and passive-flow metrics are independent
risk diagnostics.

</div>

</div>

);

}
