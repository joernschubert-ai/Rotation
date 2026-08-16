"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function PositionSizingPanel({
sizing,
tradeStack,
decision
}: any) {

if (!sizing) return null;

/* =====================================================
HELPERS
===================================================== */

function num(
value: any,
fallback = 0
): number {
const n = Number(value);
return Number.isFinite(n) ? n : fallback;
}

function nullable(
value: any
): number | null {
const n = Number(value);
return Number.isFinite(n) ? n : null;
}

function display(
value: any,
suffix = ""
) {
const n = nullable(value);

return n === null
? "—"
: `${n}${suffix}`;
}

function directionColor(
direction: string
) {

if (direction === "SHORT")
return "#ff4d4f";

if (direction === "LONG")
return "#52c41a";

return "#777";
}

function modeColor(
mode: string
) {

switch (mode) {

case "AGGRESSIVE":
return "#ff4d4f";

case "MODERATE":
return "#fa8c16";

case "DEFENSIVE":
return "#fadb14";

case "CAPITAL_PRESERVATION":
return "#ff7875";

case "STARTER":
return "#52c41a";

case "NO_TRADE":
return "#666";

default:
return "#aaa";
}
}

function metricColor(
value: any,
inverse = false
) {

const n = nullable(value);

if (n === null)
return "#555";

const v =
Math.max(
0,
Math.min(100, n)
);

if (inverse) {

if (v >= 80)
return "#ff4d4f";

if (v >= 60)
return "#fa8c16";

if (v >= 40)
return "#fadb14";

return "#52c41a";
}

if (v >= 70)
return "#52c41a";

if (v >= 50)
return "#fadb14";

if (v >= 30)
return "#fa8c16";

return "#ff4d4f";
}

function instrumentLabel(
instrument: string
) {

switch (instrument) {

case "NASDAQ_PUT":
return "NASDAQ PUT";

case "NASDAQ_CALL":
return "NASDAQ CALL";

case "RUSSELL_CALL":
return "RUSSELL CALL";

default:
return instrument;
}
}

function stateLabel(
state: string
) {

if (!state)
return "—";

return state
.replaceAll("_", " ");
}


/* =====================================================
V3 ENGINE OBJECTS
===================================================== */

const portfolio =
sizing?.portfolio ?? {};

const risk =
sizing?.risk ?? {};

const components =
sizing?.components ?? {};

const pipeline =
sizing?.pipeline ?? {};

const flowPipeline =
sizing?.flowPipeline ?? {};

const meta =
sizing?.meta ?? {};


/* =====================================================
THREE INDEPENDENT FLOWS

IMPORTANT:

These come directly from positionSizingV2.

No PRIMARY selection.
No candidate fallback.
No recalculation.
===================================================== */

const nasdaqPut =
sizing?.nasdaqPut ?? {};

const nasdaqCall =
sizing?.nasdaqCall ?? {};

const russellCall =
sizing?.russellCall ?? {};


const flows = [
nasdaqPut,
nasdaqCall,
russellCall
];


/* =====================================================
GLOBAL VALUES
===================================================== */

const totalSize =
num(
sizing?.size,
num(portfolio?.totalSize)
);

const direction =
sizing?.direction ??
portfolio?.direction ??
"NEUTRAL";

const mode =
sizing?.mode ??
"NO_TRADE";


const portfolioRaw =
num(
portfolio?.rawSize
);

const portfolioCap =
num(
portfolio?.cap
);

const portfolioScale =
num(
portfolio?.scale,
1
);

const activeFlowCount =
num(
portfolio?.activeFlows
);


/* =====================================================
DECISION ALIGNMENT

Only informational.

Position sizing itself remains authoritative.
===================================================== */

const decisionDirection =
decision?.direction ??
"NEUTRAL";

const aligned =
decisionDirection === "NEUTRAL" ||
direction === "NEUTRAL" ||
decisionDirection === direction;


/* =====================================================
METRIC COMPONENT
===================================================== */

function Metric({
label,
value,
inverse = false
}: {
label: string;
value: any;
inverse?: boolean;
}) {

const n =
nullable(value);

return (
<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "9px"
}}
>

<div
style={{
color: "#666",
fontSize: "8px",
marginBottom: "4px"
}}
>
{label}
</div>

<div
style={{
color:
metricColor(
n,
inverse
),
fontSize: "17px",
fontWeight: "bold"
}}
>
{display(n)}
</div>

</div>
);
}


/* =====================================================
FLOW CARD
===================================================== */

function FlowCard({
flow
}: {
flow: any;
}) {

const instrument =
flow?.instrument ??
"UNKNOWN";

const flowDirection =
flow?.direction ??
"NONE";

const eligible =
flow?.eligible === true;

const size =
num(flow?.size);

const strength =
flow?.strength;

const confidence =
flow?.confidence;

const rawSize =
flow?.rawSize;

const prePortfolioSize =
flow?.prePortfolioSize;

const riskMultiplier =
flow?.riskMultiplier;

const flowMode =
flow?.mode ??
"NO_TRADE";

const state =
flow?.state ??
"NEUTRAL";

const reason =
flow?.reason ??
"—";


return (

<div
style={{
border:
eligible && size > 0
? "1px solid #333"
: "1px solid #1d1d1d",

background:
eligible && size > 0
? "#111"
: "#0d0d0d",

padding: "12px"
}}
>

{/* ---------------------------------------------
HEADER
--------------------------------------------- */}

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
marginBottom: "9px"
}}
>

<div>

<div
style={{
color: "#ddd",
fontSize: "12px",
fontWeight: "bold"
}}
>
{instrumentLabel(
instrument
)}
</div>

<div
style={{
color:
directionColor(
flowDirection
),
fontSize: "9px",
fontWeight: "bold",
marginTop: "3px"
}}
>
{flowDirection}
</div>

</div>


<div
style={{
textAlign: "right"
}}
>

<div
style={{
color:
size > 0
? getSignalColor(
size,
100
)
: "#555",

fontSize: "25px",
fontWeight: "bold"
}}
>
{size}%
</div>

<div
style={{
color:
modeColor(
flowMode
),
fontSize: "8px",
fontWeight: "bold"
}}
>
{flowMode}
</div>

</div>

</div>


{/* ---------------------------------------------
STATUS
--------------------------------------------- */}

<div
style={{
borderTop: "1px solid #222",
paddingTop: "7px",
marginBottom: "8px"
}}
>

<div
style={{
color: "#666",
fontSize: "8px"
}}
>
STATE
</div>

<div
style={{
color:
eligible
? "#aaa"
: "#555",

fontSize: "9px",
fontWeight: "bold",
marginTop: "2px"
}}
>
{stateLabel(state)}
</div>

</div>


{/* ---------------------------------------------
FLOW METRICS
--------------------------------------------- */}

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(3, 1fr)",
gap: "6px"
}}
>

<Metric
label="STRENGTH"
value={strength}
/>

<Metric
label="CONFIDENCE"
value={confidence}
/>

<Metric
label="RISK"
value={
riskMultiplier !== undefined
? Math.round(
num(
riskMultiplier
) * 100
)
: null
}
/>

<Metric
label="RAW"
value={rawSize}
/>

<Metric
label="PRE-CAP"
value={prePortfolioSize}
/>

<Metric
label="FINAL"
value={size}
/>

</div>


{/* ---------------------------------------------
REASON
--------------------------------------------- */}

<div
style={{
marginTop: "8px",
paddingTop: "7px",
borderTop: "1px solid #1d1d1d"
}}
>

<div
style={{
color: "#555",
fontSize: "8px"
}}
>
ENGINE
</div>

<div
style={{
color:
eligible
? "#777"
: "#555",

fontSize: "8px",
lineHeight: "1.4",
marginTop: "2px"
}}
>
{reason}
</div>

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
background: "#0b0b0b",
border: "1px solid #222",
padding: "14px"
}}
>

{/* =================================================
HEADER
================================================= */}

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
marginBottom: "12px"
}}
>

<div
style={{
color: "#aaa",
fontWeight: "bold",
fontSize: "13px"
}}
>
POSITIONIERUNG
</div>


<div
style={{
color:
aligned
? "#52c41a"
: "#ff4d4f",

fontSize: "9px",
fontWeight: "bold"
}}
>
{aligned
? "ALIGNED"
: "MISALIGNED"}
</div>

</div>


{/* =================================================
GLOBAL POSITION
================================================= */}

<div
style={{
border: "1px solid #333",
background: "#111",
padding: "12px",
marginBottom: "12px"
}}
>

<div
style={{
color: "#666",
fontSize: "8px",
marginBottom: "7px"
}}
>
PORTFOLIO POSITION
</div>


<div
style={{
display: "grid",
gridTemplateColumns:
"2fr 1fr 1fr",
gap: "10px",
alignItems: "center"
}}
>

<div>

<div
style={{
color:
directionColor(
direction
),
fontSize: "16px",
fontWeight: "bold"
}}
>
{direction}
</div>

<div
style={{
color: "#666",
fontSize: "8px",
marginTop: "3px"
}}
>
{activeFlowCount} ACTIVE FLOW
{activeFlowCount === 1
? ""
: "S"}
</div>

</div>


<div
style={{
textAlign: "center"
}}
>

<div
style={{
color:
getSignalColor(
totalSize,
100
),
fontSize: "25px",
fontWeight: "bold"
}}
>
{totalSize}%
</div>

<div
style={{
color: "#666",
fontSize: "8px"
}}
>
FINAL
</div>

</div>


<div
style={{
textAlign: "right"
}}
>

<div
style={{
color:
modeColor(
mode
),
fontSize: "10px",
fontWeight: "bold"
}}
>
{mode}
</div>

<div
style={{
color: "#555",
fontSize: "8px",
marginTop: "3px"
}}
>
SIZING V3
</div>

</div>

</div>

</div>


{/* =================================================
THREE FLOWS
================================================= */}

<div
style={{
color: "#999",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "7px"
}}
>
INDEPENDENT FLOWS
</div>


<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(3, 1fr)",
gap: "8px",
marginBottom: "12px"
}}
>

{flows.map(
(
flow: any,
index: number
) => (

<FlowCard
key={
flow?.instrument ??
index
}
flow={flow}
/>

)
)}

</div>


{/* =================================================
PORTFOLIO LAYER
================================================= */}

<div
style={{
color: "#999",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "7px"
}}
>
PORTFOLIO LAYER
</div>


<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(4, 1fr)",
gap: "7px",
marginBottom: "12px"
}}
>

<Metric
label="RAW TOTAL"
value={portfolioRaw}
/>

<Metric
label="CAP"
value={portfolioCap}
/>

<Metric
label="SCALE"
value={
Math.round(
portfolioScale * 100
)
}
/>

<Metric
label="FINAL"
value={totalSize}
/>

</div>


{/* =================================================
RISK
================================================= */}

<div
style={{
color: "#999",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "7px"
}}
>
GLOBAL RISK
</div>


<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(4, 1fr)",
gap: "7px",
marginBottom: "12px"
}}
>

<Metric
label="GLOBAL RISK"
value={
num(
risk?.globalMultiplier
) * 100
}
/>

<Metric
label="CRASH PROB"
value={
risk?.crashProbability
}
inverse
/>

<Metric
label="DANGER"
value={
risk?.dangerScore
}
inverse
/>

<Metric
label="HEAT"
value={
Math.abs(
num(
risk?.heat
)
) * 50
}
inverse
/>

<Metric
label="LIQUIDITY"
value={
risk?.liquidityScore
}
/>

<Metric
label="FRAGILITY"
value={
risk?.fragilityScore
}
inverse
/>

<Metric
label="PARTICIPATION"
value={
risk?.participationScore
}
/>

<Metric
label="QUALITY"
value={
risk?.marketQualityScore
}
/>

<Metric
label="ROT. DECAY"
value={
risk?.rotationDecayScore
}
inverse
/>

<Metric
label="ROT. CONFIRM"
value={
risk?.rotationConfidence
}
/>

<Metric
label="REGIME SYNC"
value={
risk?.regimeSyncScore
}
/>

<Metric
label="SQUEEZE"
value={
risk?.squeezeRisk
}
inverse
/>

</div>


{/* =================================================
PIPELINE INPUTS
================================================= */}

<div
style={{
color: "#999",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "7px"
}}
>
PIPELINE INPUTS
</div>


<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(4, 1fr)",
gap: "7px",
marginBottom: "12px"
}}
>

<Metric
label="MASTER"
value={
pipeline?.master?.score
}
/>

<Metric
label="CRASH"
value={
pipeline?.crash?.score
}
inverse
/>

<Metric
label="EDGE"
value={
pipeline?.edge?.score
}
/>

<Metric
label="LIQUIDITY"
value={
pipeline?.liquidity?.score
}
/>

<Metric
label="PARTICIPATION"
value={
pipeline?.participation?.score
}
/>

<Metric
label="FRAGILITY"
value={
pipeline?.fragility?.score
}
inverse
/>

<Metric
label="ROT. DECAY"
value={
pipeline?.rotationDecay?.score
}
inverse
/>

<Metric
label="ROT. CONFIRM"
value={
pipeline?.rotationConfirm?.confidence
}
/>

<Metric
label="QUALITY"
value={
pipeline?.marketQuality?.score
}
/>

<Metric
label="BREADTH THRUST"
value={
pipeline?.breadthThrust?.score
}
/>

<Metric
label="DANGER"
value={
pipeline?.danger?.score
}
inverse
/>

<Metric
label="SQUEEZE"
value={
pipeline?.squeeze?.risk
}
inverse
/>

</div>


{/* =================================================
STRUCTURE / HISTORY
================================================= */}

<div
style={{
color: "#999",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "7px"
}}
>
STRUCTURE / HISTORY
</div>


<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(4, 1fr)",
gap: "7px",
marginBottom: "12px"
}}
>

<Metric
label="BREADTH 50"
value={
pipeline?.structure?.breadth50
}
/>

<Metric
label="BREADTH 200"
value={
pipeline?.structure?.breadth200
}
/>

<Metric
label="BREADTH TREND"
value={
pipeline?.history?.breadthTrend
}
/>

<Metric
label="BREADTH ACCEL."
value={
pipeline?.history?.breadthAcceleration
}
/>

<Metric
label="PART. DECAY"
value={
pipeline?.history?.participationDecay
}
/>

<Metric
label="LEADERSHIP DECAY"
value={
pipeline?.history?.leadershipDecay
}
/>

<Metric
label="REL. BREADTH"
value={
pipeline?.history?.relativeBreadthWeakness
}
inverse
/>

<Metric
label="PHASE PERSIST."
value={
pipeline?.history?.phasePersistence
}
/>

<Metric
label="REGIME PERSIST."
value={
pipeline?.history?.regimePersistence
}
inverse
/>

</div>


{/* =================================================
REGIME
================================================= */}

<div
style={{
color: "#999",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "7px"
}}
>
REGIME
</div>


<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(4, 1fr)",
gap: "7px",
marginBottom: "12px"
}}
>

<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "8px"
}}
>
<div
style={{
color: "#666",
fontSize: "8px"
}}
>
PHASE
</div>

<div
style={{
color: "#aaa",
fontSize: "9px",
fontWeight: "bold",
marginTop: "3px"
}}
>
{meta?.phase ?? "—"}
</div>
</div>


<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "8px"
}}
>
<div
style={{
color: "#666",
fontSize: "8px"
}}
>
EXECUTION
</div>

<div
style={{
color: "#aaa",
fontSize: "9px",
fontWeight: "bold",
marginTop: "3px"
}}
>
{meta?.executionMode ?? "—"}
</div>
</div>


<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "8px"
}}
>
<div
style={{
color: "#666",
fontSize: "8px"
}}
>
RISK STATE
</div>

<div
style={{
color:
meta?.riskState === "CRISIS"
? "#ff4d4f"
: "#aaa",
fontSize: "9px",
fontWeight: "bold",
marginTop: "3px"
}}
>
{meta?.riskState ?? "—"}
</div>
</div>


<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "8px"
}}
>
<div
style={{
color: "#666",
fontSize: "8px"
}}
>
TACTICAL BIAS
</div>

<div
style={{
color:
directionColor(
meta?.tacticalBias === "BEARISH"
? "SHORT"
: meta?.tacticalBias === "BULLISH"
? "LONG"
: "NONE"
),
fontSize: "9px",
fontWeight: "bold",
marginTop: "3px"
}}
>
{meta?.tacticalBias ?? "—"}
</div>
</div>

</div>


{/* =================================================
FLOW PIPELINE DEBUG
================================================= */}

<details
style={{
marginTop: "5px",
borderTop: "1px solid #1c1c1c",
paddingTop: "8px"
}}
>

<summary
style={{
cursor: "pointer",
color: "#555",
fontSize: "8px"
}}
>
FLOW PIPELINE / DEBUG
</summary>


<div
style={{
marginTop: "8px",
display: "grid",
gridTemplateColumns:
"repeat(3, 1fr)",
gap: "7px"
}}
>

{[
flowPipeline?.nasdaqPut,
flowPipeline?.nasdaqCall,
flowPipeline?.russellCall
].map(
(
flow: any,
index: number
) => (

<div
key={index}
style={{
border: "1px solid #1c1c1c",
background: "#0d0d0d",
padding: "8px"
}}
>

<div
style={{
color: "#777",
fontSize: "8px",
fontWeight: "bold",
marginBottom: "5px"
}}
>
{instrumentLabel(
flow?.instrument ??
flows[index]?.instrument ??
"UNKNOWN"
)}
</div>

<div
style={{
color: "#555",
fontSize: "8px",
lineHeight: "1.6"
}}
>
strength: {display(flow?.strength)}
<br />
confidence: {display(flow?.confidence)}
<br />
raw: {display(flow?.rawSize)}%
<br />
pre-cap: {display(flow?.prePortfolioSize)}%
<br />
final: {display(flow?.finalSize)}%
<br />
risk: {display(
flow?.riskMultiplier
)}
<br />
eligible: {flow?.eligible ? "YES" : "NO"}
</div>

</div>

)
)}

</div>

</details>


{/* =================================================
FOOTER
================================================= */}

<div
style={{
marginTop: "9px",
paddingTop: "8px",
borderTop: "1px solid #1c1c1c",
color: "#444",
fontSize: "8px",
display: "flex",
justifyContent: "space-between"
}}
>

<span>
POSITION SIZING V3
</span>

<span>
flows: {flows.length}
</span>

<span>
active: {activeFlowCount}
</span>

</div>

</div>
);
}
