// /components/panels/LiquidityPanel.tsx

"use client";

/* ============================================================
LIQUIDITY PANEL
============================================================

AUFGABE

Das Liquidity Panel visualisiert die Ergebnisse der
Liquidity Engine.

SEMANTIK

LIQUIDITY SCORE:

HIGH = GOOD
LOW = STRESSED

LIQUIDITY STATE:

BROAD
PASSIVE
NARROW
FRAGILE
ILLUSION

WICHTIG:

Hohe nominelle Liquidität bedeutet nicht automatisch
gesunde Marktstruktur.

Das Panel unterscheidet deshalb zwischen:

- tatsächlicher Liquidität
- Marktqualität
- passiver Fragilität
- Narrow Leadership
- Liquidity Illusion
- Dealer Compression

============================================================ */

interface Props {
data: any;
}

export default function LiquidityPanel({
data,
}: Props) {

/* ==========================================================
INPUT
========================================================== */

const liquidity =
data?.liquidity ?? {};

const metrics =
liquidity?.metrics ?? {};

/* ==========================================================
HELPERS
========================================================== */

function clamp(
value: number,
min = 0,
max = 100
) {

if (!Number.isFinite(value)) {
return min;
}

return Math.max(
min,
Math.min(max, value)
);

}

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

function formatNumber(
value: unknown,
decimals = 1
) {

const numeric =
Number(value);

if (!Number.isFinite(numeric)) {
return "–";
}

return Number.isInteger(numeric)
? numeric.toString()
: numeric.toFixed(decimals);

}

function directionValue(
value: number
) {

if (value > 0) {
return `+${formatNumber(value)}`;
}

return formatNumber(value);

}

/* ==========================================================
SCORE COLORS

HIGH = GOOD
LOW = BAD
========================================================== */

function scoreColor(
value: number
) {

if (value >= 80) {
return "#52c41a";
}

if (value >= 65) {
return "#95de64";
}

if (value >= 48) {
return "#faad14";
}

if (value >= 30) {
return "#ff7875";
}

return "#ff4d4f";

}

/* ==========================================================
RISK COLORS

HIGH = BAD
LOW = GOOD
========================================================== */

function riskColor(
active: boolean
) {

return active
? "#ff4d4f"
: "#52c41a";

}

/* ==========================================================
STATE COLOR
========================================================== */

function stateColor(
value: string
) {

switch (value) {

case "ABUNDANT":
case "BROAD":
case "HEALTHY":
case "STRONG":
case "LOW":

return "#52c41a";

case "SUPPORTIVE":
case "MODERATE":

return "#95de64";

case "NEUTRAL":
case "PASSIVE":
case "FRAGILE":
case "ELEVATED":

return "#faad14";

case "TIGHTENING":
case "NARROW":
case "DETERIORATING":
case "WEAK":

return "#ff7875";

case "LIQUIDITY_STRESS":
case "ILLUSION":
case "INTERNALLY_WEAK":
case "NEGATIVE":
case "HIGH":

return "#ff4d4f";

default:

return "#999";

}

}

/* ==========================================================
CORE VALUES
========================================================== */

const score =
clamp(
safeNumber(
liquidity?.score,
50
)
);

const state =
liquidity?.state ??
"NEUTRAL";

const liquidityState =
liquidity?.liquidityState ??
"PASSIVE";

const support =
liquidity?.support ??
"MODERATE";

const fragility =
liquidity?.fragility ??
"ELEVATED";

const summary =
liquidity?.summary ??
"Liquidity data unavailable";

const marketQuality =
liquidity?.marketQuality ??
"FRAGILE";

const institutionalLiquidity =
Boolean(
liquidity?.institutionalLiquidity
);

const liquidityImpulse =
safeNumber(
liquidity?.liquidityImpulse,
0
);

/* ==========================================================
METRICS
========================================================== */

const liquidityValue =
safeNumber(
metrics?.liquidity,
50
);

const rawGamma =
safeNumber(
metrics?.gamma,
0
);

const effectiveGamma =
safeNumber(
metrics?.effectiveGamma,
rawGamma
);

const structuralGammaFloor =
safeNumber(
metrics?.structuralGammaFloor,
0
);

const credit =
safeNumber(
metrics?.credit,
1
);

const vixTerm =
safeNumber(
metrics?.vixTerm,
1
);

const volOfVol =
safeNumber(
metrics?.volOfVol,
1
);

const breadth50 =
safeNumber(
metrics?.breadth50,
50
);

const breadth200 =
safeNumber(
metrics?.breadth200,
50
);

const participation =
safeNumber(
metrics?.participation,
50
);

const marketQualityScore =
clamp(
safeNumber(
metrics?.marketQualityScore,
50
)
);

/* ==========================================================
TRENDS
========================================================== */

const liquidityTrend =
safeNumber(
metrics?.liquidityTrend,
0
);

const creditTrend =
safeNumber(
metrics?.creditTrend,
0
);

const gammaTrend =
safeNumber(
metrics?.gammaTrend,
0
);

const breadthTrend =
safeNumber(
metrics?.breadthTrend,
0
);

const liquidityAcceleration =
safeNumber(
metrics?.liquidityAcceleration,
0
);

/* ==========================================================
HISTORY
========================================================== */

const averageLiquidity =
safeNumber(
metrics?.averageLiquidity,
liquidityValue
);

const liquidityPersistence =
safeNumber(
metrics?.liquidityPersistence,
50
);

const institutionalPressure =
safeNumber(
metrics?.institutionalPressure,
0
);

/* ==========================================================
STRUCTURAL FLAGS
========================================================== */

const narrowLeadership =
Boolean(
metrics?.narrowLeadership
);

const weakParticipation =
Boolean(
metrics?.weakParticipation
);

const breadthFailure =
Boolean(
metrics?.breadthFailure
);

const equalWeightWeakness =
Boolean(
metrics?.equalWeightWeakness
);

const smallCapWeakness =
Boolean(
metrics?.smallCapWeakness
);

const passiveFragility =
Boolean(
metrics?.passiveFragility
);

const liquidityIllusion =
Boolean(
metrics?.liquidityIllusion
);

const dealerCompression =
Boolean(
metrics?.dealerCompression
);

/* ==========================================================
RISK FLAGS
========================================================== */

const structuralRiskActive =

liquidityIllusion ||
passiveFragility ||
dealerCompression ||
breadthFailure ||
(
narrowLeadership &&
weakParticipation
);

/* ==========================================================
DIRECTION COLOR
========================================================== */

function trendColor(
value: number,
positiveIsGood = true
) {

if (value === 0) {
return "#faad14";
}

if (positiveIsGood) {

return value > 0
? "#52c41a"
: "#ff4d4f";

}

return value > 0
? "#ff4d4f"
: "#52c41a";

}

/* ==========================================================
PRIMARY STATE
========================================================== */

function liquidityHeadline() {

if (
liquidityState === "ILLUSION"
) {

return {
label:
"LIQUIDITY ILLUSION",

description:
"Headline liquidity is masking severe internal weakness",

color:
"#ff4d4f",
};

}

if (
state === "LIQUIDITY_STRESS"
) {

return {
label:
"LIQUIDITY STRESS",

description:
"Market liquidity conditions are materially deteriorating",

color:
"#ff4d4f",
};

}

if (
liquidityState === "FRAGILE" ||
state === "TIGHTENING"
) {

return {
label:
"LIQUIDITY FRAGILE",

description:
"Liquidity support exists but market internals are weakening",

color:
"#ff7875",
};

}

if (
liquidityState === "NARROW"
) {

return {
label:
"NARROW LIQUIDITY",

description:
"Liquidity participation is concentrated in limited market leadership",

color:
"#ff7875",
};

}

if (
state === "ABUNDANT" &&
liquidityState === "BROAD"
) {

return {
label:
"BROAD LIQUIDITY",

description:
"Broad participation supports institutional market liquidity",

color:
"#52c41a",
};

}

if (
state === "SUPPORTIVE"
) {

return {
label:
"LIQUIDITY SUPPORTIVE",

description:
"Liquidity conditions remain supportive for market structure",

color:
"#95de64",
};

}

return {
label:
"LIQUIDITY NEUTRAL",

description:
"Liquidity conditions are balanced but require monitoring",

color:
"#faad14",
};

}

const headline =
liquidityHeadline();

/* ==========================================================
METRIC CARD
========================================================== */

function MetricCard({
label,
value,
color,
subLabel,
}: {
label: string;
value: string;
color: string;
subLabel?: string;
}) {

return (

<div
style={{
background:
"#111",

border:
"1px solid #222",

padding:
"12px",

minWidth:
0,
}}
>

<div
style={{
color:
"#666",

fontSize:
"10px",

marginBottom:
"6px",

letterSpacing:
"0.8px",

overflow:
"hidden",

textOverflow:
"ellipsis",

whiteSpace:
"nowrap",
}}
>
{label}
</div>

<div
style={{
color,

fontSize:
"16px",

fontWeight:
700,

overflowWrap:
"anywhere",
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
FLAG ROW
========================================================== */

function FlagRow({
label,
active,
description,
}: {
label: string;
active: boolean;
description: string;
}) {

const color =
riskColor(active);

return (

<div
style={{
display:
"flex",

justifyContent:
"space-between",

alignItems:
"center",

gap:
"12px",

padding:
"10px 0",

borderBottom:
"1px solid #1f1f1f",
}}
>

<div
style={{
minWidth:
0,
}}
>

<div
style={{
color:
"#aaa",

fontSize:
"12px",

fontWeight:
600,
}}
>
{label}
</div>

<div
style={{
color:
"#555",

fontSize:
"10px",

marginTop:
"3px",
}}
>
{description}
</div>

</div>

<div
style={{
color,

fontSize:
"10px",

fontWeight:
800,

whiteSpace:
"nowrap",
}}
>
{active
? "ACTIVE"
: "CLEAR"}
</div>

</div>

);

}

/* ==========================================================
TREND ROW
========================================================== */

function TrendRow({
label,
value,
positiveIsGood = true,
}: {
label: string;
value: number;
positiveIsGood?: boolean;
}) {

return (

<div
style={{
display:
"flex",

justifyContent:
"space-between",

alignItems:
"center",

padding:
"8px 0",

borderBottom:
"1px solid #1f1f1f",
}}
>

<span
style={{
color:
"#888",

fontSize:
"12px",
}}
>
{label}
</span>

<span
style={{
color:
trendColor(
value,
positiveIsGood
),

fontWeight:
700,

fontSize:
"12px",
}}
>
{directionValue(value)}
</span>

</div>

);

}

/* ==========================================================
RENDER
========================================================== */

return (

<div
className="
rounded-2xl
border
bg-zinc-950
p-4
sm:p-5
"
style={{
borderColor:
headline.color,
}}
>

{/* ======================================================
HEADER
====================================================== */}

<div
className="
mb-5
flex
flex-col
gap-4
sm:flex-row
sm:items-start
sm:justify-between
"
>

<div>

<h2
className="
text-lg
font-semibold
text-zinc-100
"
>
LIQUIDITY ENGINE
</h2>

<div
className="
mt-1
text-[10px]
uppercase
tracking-[0.18em]
text-zinc-500
"
>
Institutional Liquidity & Market Support
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
scoreColor(score),

fontSize:
"36px",

fontWeight:
800,

lineHeight:
1,
}}
>
{Math.round(score)}
</div>

<div
className="
mt-1
text-[10px]
text-zinc-500
"
>
LIQUIDITY SCORE
</div>

</div>

</div>

{/* ======================================================
SCORE BAR
====================================================== */}

<div
style={{
height:
"7px",

background:
"#222",

borderRadius:
"5px",

overflow:
"hidden",

marginBottom:
"18px",
}}
>

<div
style={{
width:
`${score}%`,

height:
"100%",

background:
scoreColor(score),

transition:
"all 0.35s ease",
}}
/>

</div>

{/* ======================================================
PRIMARY STATE
====================================================== */}

<div
style={{
padding:
"14px",

marginBottom:
"18px",

border:
`1px solid ${headline.color}`,

background:
`${headline.color}10`,
}}
>

<div
style={{
color:
"#666",

fontSize:
"10px",

marginBottom:
"5px",

letterSpacing:
"1px",
}}
>
LIQUIDITY REGIME
</div>

<div
style={{
color:
headline.color,

fontSize:
"20px",

fontWeight:
800,

marginBottom:
"6px",
}}
>
{headline.label}
</div>

<div
style={{
color:
"#aaa",

fontSize:
"12px",

lineHeight:
1.5,
}}
>
{headline.description}
</div>

</div>

{/* ======================================================
CORE STATES
====================================================== */}

<div
className="
mb-5
grid
grid-cols-1
gap-3
sm:grid-cols-2
xl:grid-cols-4
"
>

<MetricCard
label="LIQUIDITY STATE"
value={state}
color={stateColor(state)}
subLabel="Score classification"
/>

<MetricCard
label="MARKET PARTICIPATION"
value={liquidityState}
color={stateColor(liquidityState)}
subLabel="Breadth of liquidity support"
/>

<MetricCard
label="SUPPORT"
value={support}
color={stateColor(support)}
subLabel="Market liquidity support"
/>

<MetricCard
label="FRAGILITY"
value={fragility}
color={stateColor(fragility)}
subLabel="Structural liquidity fragility"
/>

</div>

{/* ======================================================
QUALITY
====================================================== */}

<div
className="
mb-5
border-t
border-zinc-800
pt-4
"
>

<div
className="
mb-3
text-[10px]
uppercase
tracking-[0.15em]
text-zinc-500
"
>
Market Quality
</div>

<div
className="
grid
grid-cols-1
gap-3
sm:grid-cols-2
xl:grid-cols-3
"
>

<MetricCard
label="MARKET QUALITY"
value={marketQuality}
color={stateColor(marketQuality)}
subLabel={`${Math.round(marketQualityScore)}/100`}
/>

<MetricCard
label="INSTITUTIONAL LIQUIDITY"
value={
institutionalLiquidity
? "CONFIRMED"
: "NOT CONFIRMED"
}
color={
institutionalLiquidity
? "#52c41a"
: "#faad14"
}
subLabel="Multi-factor institutional confirmation"
/>

<MetricCard
label="LIQUIDITY IMPULSE"
value={directionValue(liquidityImpulse)}
color={trendColor(liquidityImpulse)}
subLabel="Distance from neutral liquidity"
/>

</div>

</div>

{/* ======================================================
CURRENT DRIVERS
====================================================== */}

<div
className="
mb-5
border-t
border-zinc-800
pt-4
"
>

<div
className="
mb-3
text-[10px]
uppercase
tracking-[0.15em]
text-zinc-500
"
>
Current Liquidity Drivers
</div>

<div
className="
grid
grid-cols-1
gap-3
sm:grid-cols-2
xl:grid-cols-3
"
>

<MetricCard
label="RAW LIQUIDITY"
value={formatNumber(liquidityValue)}
color={scoreColor(liquidityValue)}
/>

<MetricCard
label="CREDIT"
value={formatNumber(credit, 2)}
color={
credit >= 1.10
? "#ff4d4f"
: credit >= 1.00
? "#faad14"
: "#52c41a"
}
/>

<MetricCard
label="VIX TERM"
value={formatNumber(vixTerm, 2)}
color={
vixTerm < 0.92
? "#ff4d4f"
: vixTerm < 0.95
? "#ff7875"
: vixTerm > 1
? "#52c41a"
: "#faad14"
}
/>

<MetricCard
label="RAW GAMMA"
value={formatNumber(rawGamma)}
color={
rawGamma > 0
? "#52c41a"
: rawGamma < 0
? "#ff4d4f"
: "#faad14"
}
/>

<MetricCard
label="EFFECTIVE GAMMA"
value={formatNumber(effectiveGamma)}
color={
effectiveGamma > 0
? "#52c41a"
: "#ff4d4f"
}
subLabel={
structuralGammaFloor > 0
? `Floor ${formatNumber(
structuralGammaFloor
)}`
: "No structural floor"
}
/>

<MetricCard
label="VOL OF VOL"
value={formatNumber(volOfVol, 2)}
color={
volOfVol > 1.3
? "#ff4d4f"
: volOfVol > 1.1
? "#faad14"
: "#52c41a"
}
/>

<MetricCard
label="BREADTH 50"
value={`${formatNumber(breadth50)}%`}
color={scoreColor(breadth50)}
/>

<MetricCard
label="BREADTH 200"
value={`${formatNumber(breadth200)}%`}
color={scoreColor(breadth200)}
/>

<MetricCard
label="PARTICIPATION"
value={formatNumber(participation)}
color={scoreColor(participation)}
/>

</div>

</div>

{/* ======================================================
STRUCTURAL WARNINGS
====================================================== */}

<div
className="
mb-5
border-t
border-zinc-800
pt-4
"
>

<div
className="
mb-2
flex
items-center
justify-between
"
>

<div
className="
text-[10px]
uppercase
tracking-[0.15em]
text-zinc-500
"
>
Structural Risk Controls
</div>

<div
style={{
color:
structuralRiskActive
? "#ff4d4f"
: "#52c41a",

fontSize:
"10px",

fontWeight:
800,
}}
>
{structuralRiskActive
? "WARNING ACTIVE"
: "STRUCTURE CLEAR"}
</div>

</div>

<FlagRow
label="Liquidity Illusion"
active={liquidityIllusion}
description="Headline liquidity masks internal market weakness"
/>

<FlagRow
label="Passive Fragility"
active={passiveFragility}
description="Calm liquidity environment with weak market internals"
/>

<FlagRow
label="Dealer Compression"
active={dealerCompression}
description="Dealer positioning may suppress volatility artificially"
/>

<FlagRow
label="Narrow Leadership"
active={narrowLeadership}
description="Liquidity concentrated in limited market leadership"
/>

<FlagRow
label="Weak Participation"
active={weakParticipation}
description="Insufficient broad market participation"
/>

<FlagRow
label="Breadth Failure"
active={breadthFailure}
description="Intermediate and structural breadth are weak"
/>

<FlagRow
label="Equal Weight Weakness"
active={equalWeightWeakness}
description="Equal-weight market participation is deteriorating"
/>

<FlagRow
label="Small Cap Weakness"
active={smallCapWeakness}
description="Small-cap participation is weak"
/>

</div>

{/* ======================================================
TRENDS
====================================================== */}

<div
className="
mb-5
border-t
border-zinc-800
pt-4
"
>

<div
className="
mb-3
text-[10px]
uppercase
tracking-[0.15em]
text-zinc-500
"
>
Liquidity Trend Analysis
</div>

<TrendRow
label="Liquidity Trend"
value={liquidityTrend}
/>

<TrendRow
label="Liquidity Acceleration"
value={liquidityAcceleration}
/>

<TrendRow
label="Breadth Trend"
value={breadthTrend}
/>

<TrendRow
label="Gamma Trend"
value={gammaTrend}
/>

<TrendRow
label="Credit Trend"
value={creditTrend}
positiveIsGood={false}
/>

</div>

{/* ======================================================
HISTORY
====================================================== */}

<div
className="
mb-5
border-t
border-zinc-800
pt-4
"
>

<div
className="
mb-3
text-[10px]
uppercase
tracking-[0.15em]
text-zinc-500
"
>
Historical Context
</div>

<div
className="
grid
grid-cols-1
gap-3
sm:grid-cols-3
"
>

<MetricCard
label="AVG LIQUIDITY"
value={formatNumber(averageLiquidity)}
color={scoreColor(averageLiquidity)}
/>

<MetricCard
label="LIQUIDITY PERSISTENCE"
value={formatNumber(liquidityPersistence)}
color={scoreColor(liquidityPersistence)}
/>

<MetricCard
label="INSTITUTIONAL PRESSURE"
value={formatNumber(institutionalPressure)}
color={
institutionalPressure > 70
? "#ff4d4f"
: institutionalPressure > 50
? "#faad14"
: "#52c41a"
}
/>

</div>

</div>

{/* ======================================================
SUMMARY
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
"6px",

letterSpacing:
"1px",
}}
>
ENGINE SUMMARY
</div>

<div
style={{
color:
headline.color,

fontSize:
"13px",

fontWeight:
700,

lineHeight:
1.5,
}}
>
{summary}
</div>

</div>

{/* ======================================================
FOOTER
====================================================== */}

<div
className="
mt-5
text-[10px]
leading-relaxed
text-zinc-600
"
>
The Liquidity Engine distinguishes nominal liquidity
from broad institutional market participation.
High liquidity combined with narrow leadership,
weak breadth or passive dealer compression can represent
structural fragility rather than genuine market strength.
</div>

</div>

);

}
