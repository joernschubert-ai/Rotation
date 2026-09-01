// /components/PositionSizingPanel.tsx

"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

type Props = {
sizing: any;
tradeStack?: any;
decision?: any;
};


/* =====================================================
HELPERS
===================================================== */

function num(
value: any,
fallback = 0
): number {

const n = Number(value);

return Number.isFinite(n)
? n
: fallback;
}


function displayNumber(
value: any,
decimals = 0,
fallback = "—"
): string {

if (
value === null ||
value === undefined
) {
return fallback;
}

const n = Number(value);

if (!Number.isFinite(n))
return fallback;

return decimals > 0
? n.toFixed(decimals)
: String(Math.round(n));
}


/* =====================================================
COLORS
===================================================== */

function directionColor(
value: string
) {

if (value === "SHORT")
return "#ff4d4f";

if (value === "LONG")
return "#52c41a";

if (value === "MIXED")
return "#fa8c16";

return "#777";
}


function modeColor(
value: string
) {

switch (value) {

case "AGGRESSIVE":
return "#ff4d4f";

case "MODERATE":
return "#fa8c16";

case "DEFENSIVE":
return "#fadb14";

case "STARTER":
return "#69b1ff";

case "CAPITAL_PRESERVATION":
return "#ff7875";

case "NO_TRADE":
return "#777";

default:
return "#aaa";
}
}


function riskColor(
value: number
) {

if (value >= 80)
return "#ff4d4f";

if (value >= 60)
return "#fa8c16";

if (value >= 40)
return "#fadb14";

return "#52c41a";
}


function qualityColor(
value: number
) {

if (value >= 70)
return "#52c41a";

if (value >= 50)
return "#fadb14";

if (value >= 30)
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


/* =====================================================
MAIN COMPONENT
===================================================== */

export default function PositionSizingPanel({
sizing,
tradeStack,
decision
}: Props) {

if (!sizing)
return null;


/* ===================================================
DATA
=================================================== */

const components =
sizing?.components ?? {};

const meta =
sizing?.meta ?? {};

const portfolio =
sizing?.portfolio ?? {};

const risk =
sizing?.risk ?? {};

const pipeline =
sizing?.pipeline ?? {};

const flowPipeline =
sizing?.flowPipeline ?? {};


const totalSize =
num(sizing?.size);

const direction =
sizing?.direction ??
"NEUTRAL";

const mode =
sizing?.mode ??
"NO_TRADE";


const activeFlows =
Array.isArray(sizing?.activeFlows)
? sizing.activeFlows
: [];


const activeInstruments =
Array.isArray(
sizing?.activeInstruments
)
? sizing.activeInstruments
: [];


const primary =
sizing?.primary ?? null;


/* ===================================================
STATES
=================================================== */

const phase =
meta?.phase ??
pipeline?.phase ??
"UNKNOWN";


const executionMode =
meta?.executionMode ??
"UNKNOWN";


const riskState =
meta?.riskState ??
"UNKNOWN";


const tacticalBias =
meta?.tacticalBias ??
"UNKNOWN";


const directionalConflict =
meta?.directionalConflict === true;


const portfolioDirectionalConflict =
meta?.portfolioDirectionalConflict === true ||
portfolio?.directionalConflict === true;


/* ===================================================
ALIGNMENT
=================================================== */

const decisionDirection =
decision?.direction ??
"NEUTRAL";


const aligned =
decisionDirection === "NEUTRAL" ||
direction === "NEUTRAL" ||
direction === "MIXED" ||
decisionDirection === direction;


/* ===================================================
RENDER
=================================================== */

return (

<div
style={{
background: "#090909",
border: "1px solid #222",
padding: "clamp(10px, 2vw, 16px)",
color: "#ddd",
width: "100%",
minWidth: 0
}}
>

{/* ===============================================
HEADER
=============================================== */}

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: "10px",
marginBottom: "14px",
flexWrap: "wrap"
}}
>

<div>

<div
style={{
color: "#aaa",
fontSize: "14px",
fontWeight: "bold"
}}
>
POSITIONIERUNG
</div>

<div
style={{
color: "#555",
fontSize: "8px",
marginTop: "3px"
}}
>
POSITION SIZING V3
</div>

</div>


<StatusBadge
color={
aligned
? "#52c41a"
: "#ff4d4f"
}
>
{aligned
? "ALIGNED"
: "MISALIGNED"}
</StatusBadge>

</div>


{/* ===============================================
PORTFOLIO HERO
=============================================== */}

<div
style={{
border: "1px solid #333",
background: "#111",
padding: "14px",
marginBottom: "14px"
}}
>

<div
style={{
color: "#666",
fontSize: "8px",
marginBottom: "8px"
}}
>
PORTFOLIO POSITION
</div>


<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: "15px"
}}
>

<div>

<div
style={{
color:
directionColor(direction),
fontSize: "20px",
fontWeight: "bold"
}}
>
{direction}
</div>


<div
style={{
color: "#666",
fontSize: "9px",
marginTop: "4px"
}}
>
{activeFlows.length} ACTIVE FLOWS
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
totalSize > 0
? getSignalColor(
totalSize,
100
)
: "#555",

fontSize: "32px",
fontWeight: "bold"
}}
>
{totalSize}%
</div>


<div
style={{
color:
modeColor(mode),

fontSize: "10px",
fontWeight: "bold"
}}
>
{mode}
</div>

</div>

</div>


{primary && (

<div
style={{
marginTop: "12px",
paddingTop: "9px",
borderTop: "1px solid #222",
display: "flex",
justifyContent: "space-between",
gap: "10px",
flexWrap: "wrap"
}}
>

<SmallInfo
label="PRIMARY"
value={
instrumentLabel(
primary?.instrument
)
}
/>

<SmallInfo
label="PRIMARY SIZE"
value={`${num(primary?.size)}%`}
/>

<SmallInfo
label="ACTIVE"
value={String(activeFlows.length)}
/>

</div>

)}

</div>


{/* ===============================================
INDEPENDENT FLOWS
=============================================== */}

<SectionTitle>
INDEPENDENT FLOWS
</SectionTitle>


<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(auto-fit, minmax(220px, 1fr))",

gap: "9px",
marginBottom: "14px"
}}
>

<FlowCard
title="NASDAQ PUT"
flow={
flowPipeline?.nasdaqPut ??
sizing?.nasdaqPut
}
/>


<FlowCard
title="NASDAQ CALL"
flow={
flowPipeline?.nasdaqCall ??
sizing?.nasdaqCall
}
/>


<FlowCard
title="RUSSELL CALL"
flow={
flowPipeline?.russellCall ??
sizing?.russellCall
}
/>

</div>


{/* ===============================================
PORTFOLIO LAYER
=============================================== */}

<SectionTitle>
PORTFOLIO LAYER
</SectionTitle>


<MetricGrid
minWidth={110}
>

<Metric
label="RAW TOTAL"
value={portfolio?.rawSize}
/>

<Metric
label="CAP"
value={portfolio?.cap}
/>

<Metric
label="SCALE"
value={
num(portfolio?.scale, 1) * 100
}
suffix="%"
/>

<Metric
label="FINAL"
value={portfolio?.totalSize}
suffix="%"
/>

</MetricGrid>


{/* ===============================================
REGIME / EXECUTION
=============================================== */}

<SectionTitle>
REGIME / EXECUTION
</SectionTitle>


<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(auto-fit, minmax(150px, 1fr))",

gap: "7px",
marginBottom: "14px"
}}
>

<StateCard
label="REGIME"
value={phase}
/>

<StateCard
label="EXECUTION"
value={executionMode}
/>

<StateCard
label="RISK STATE"
value={riskState}
/>

<StateCard
label="TACTICAL BIAS"
value={tacticalBias}
/>

</div>


{/* ===============================================
GLOBAL RISK SUMMARY
=============================================== */}

<SectionTitle>
GLOBAL RISK SUMMARY
</SectionTitle>


<MetricGrid
minWidth={105}
>

<Metric
label="GLOBAL RISK"
value={
num(
risk?.globalMultiplier
) * 100
}
suffix="%"
/>

<Metric
label="CRASH PROB"
value={risk?.crashProbability}
inverse
/>

<Metric
label="DANGER"
value={risk?.dangerScore}
inverse
/>

<Metric
label="LIQUIDITY"
value={risk?.liquidityScore}
inverse
/>

<Metric
label="FRAGILITY"
value={risk?.fragilityScore}
inverse
/>

<Metric
label="QUALITY"
value={risk?.marketQualityScore}
/>

</MetricGrid>


{/* ===============================================
COLLAPSIBLE DETAILS
=============================================== */}

<CollapsibleSection
title="RISK DETAILS"
subtitle="Additional risk drivers"
>

<MetricGrid
minWidth={105}
>

<Metric
label="PARTICIPATION"
value={risk?.participationScore}
/>

<Metric
label="ROT. DECAY"
value={risk?.rotationDecayScore}
inverse
/>

<Metric
label="ROT. CONFIRM"
value={risk?.rotationConfidence}
/>

<Metric
label="REGIME SYNC"
value={risk?.regimeSyncScore}
/>

<Metric
label="SQUEEZE"
value={risk?.squeezeRisk}
inverse
/>

<Metric
label="SYSTEM HEAT"
value={
num(risk?.heat) * 100
}
decimals={1}
inverse
/>

</MetricGrid>

</CollapsibleSection>


<CollapsibleSection
title="PIPELINE INPUTS"
subtitle="Actual engine values entering position sizing"
>

<MetricGrid
minWidth={105}
>

<Metric
label="MASTER"
value={components?.masterScore}
/>

<Metric
label="CRASH"
value={components?.crashScore}
inverse
/>

<Metric
label="EDGE"
value={components?.edgeScore}
/>

<Metric
label="LIQUIDITY"
value={components?.liquidityScore}
inverse
/>

<Metric
label="PARTICIPATION"
value={components?.participationScore}
/>

<Metric
label="FRAGILITY"
value={components?.fragilityScore}
inverse
/>

<Metric
label="ROT. DECAY"
value={components?.rotationDecayScore}
inverse
/>

<Metric
label="ROT. CONFIRM"
value={components?.rotationConfidence}
/>

<Metric
label="QUALITY"
value={components?.marketQualityScore}
/>

<Metric
label="BREADTH THRUST"
value={components?.breadthThrustScore}
/>

<Metric
label="DANGER"
value={components?.dangerScore}
inverse
/>

<Metric
label="SQUEEZE"
value={components?.squeezeRisk}
inverse
/>

</MetricGrid>

</CollapsibleSection>


<CollapsibleSection
title="STRUCTURE / HISTORY"
subtitle="Breadth, persistence and market deterioration"
>

<MetricGrid
minWidth={110}
>

<Metric
label="BREADTH 50"
value={components?.breadth50}
/>

<Metric
label="BREADTH 200"
value={components?.breadth200}
/>

<Metric
label="BREADTH TREND"
value={components?.breadthTrend}
decimals={1}
/>

<Metric
label="BREADTH ACCEL."
value={components?.breadthAcceleration}
decimals={1}
/>

<Metric
label="PART. DECAY"
value={components?.participationDecay}
/>

<Metric
label="LEADERSHIP DECAY"
value={components?.leadershipDecay}
/>

<Metric
label="REL. BREADTH"
value={
components?.relativeBreadthWeakness
}
decimals={1}
/>

<Metric
label="PHASE PERSIST."
value={components?.phasePersistence}
/>

<Metric
label="REGIME PERSIST."
value={components?.regimePersistence}
/>

</MetricGrid>

</CollapsibleSection>


<CollapsibleSection
title="FLOW PIPELINE"
subtitle="Sizing calculation per independent instrument"
>

<div
style={{
display: "grid",
gridTemplateColumns:
"repeat(auto-fit, minmax(210px, 1fr))",

gap: "8px"
}}
>

<FlowPipelineCard
title="NASDAQ PUT"
flow={
flowPipeline?.nasdaqPut
}
/>

<FlowPipelineCard
title="NASDAQ CALL"
flow={
flowPipeline?.nasdaqCall
}
/>

<FlowPipelineCard
title="RUSSELL CALL"
flow={
flowPipeline?.russellCall
}
/>

</div>

</CollapsibleSection>


{/* ===============================================
DATA INTEGRITY FOOTER
=============================================== */}

<div
style={{
marginTop: "12px",
paddingTop: "9px",
borderTop: "1px solid #1c1c1c",

color: "#555",
fontSize: "8px",

display: "flex",
justifyContent: "space-between",

gap: "8px",
flexWrap: "wrap"
}}
>

<span>
POSITION SIZING V3
</span>

<span>
ACTIVE {activeFlows.length}
</span>

<span>
INSTRUMENTS {activeInstruments.length}
</span>

<span
style={{
color:
directionalConflict ||
portfolioDirectionalConflict
? "#ff4d4f"
: "#555"
}}
>
CONFLICT{" "}
{directionalConflict ||
portfolioDirectionalConflict
? "YES"
: "NO"}
</span>

</div>

</div>
);
}


/* =====================================================
FLOW CARD
===================================================== */

function FlowCard({
title,
flow
}: {
title: string;
flow: any;
}) {

if (!flow) {

return (

<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "11px"
}}
>

<div
style={{
color: "#777",
fontSize: "11px",
fontWeight: "bold"
}}
>
{title}
</div>

<div
style={{
color: "#555",
fontSize: "9px",
marginTop: "8px"
}}
>
NO DATA
</div>

</div>
);
}


const strength =
num(flow?.strength);

const confidence =
num(flow?.confidence);

const finalSize =
num(
flow?.finalSize ??
flow?.size
);

const rawSize =
num(flow?.rawSize);

const preCap =
num(flow?.prePortfolioSize);

const flowRisk =
num(flow?.riskMultiplier);

const flowDirection =
flow?.direction ??
"NONE";

const flowMode =
flow?.mode ??
"NO_TRADE";

const flowState =
flow?.state ??
"NEUTRAL";

const eligible =
flow?.eligible === true;

const reason =
flow?.reason ??
"No engine reason";


return (

<div
style={{
border:
`1px solid ${
eligible
? "#252525"
: "#1c1c1c"
}`,

background: "#101010",

padding: "12px",

minWidth: 0
}}
>

{/* HEADER */}

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: "8px",
marginBottom: "10px"
}}
>

<div
style={{
color: "#ddd",
fontSize: "11px",
fontWeight: "bold"
}}
>
{title}
</div>


<div
style={{
color:
directionColor(
flowDirection
),

fontSize: "9px",
fontWeight: "bold"
}}
>
{flowDirection}
</div>

</div>


{/* HERO */}

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: "8px"
}}
>

<div>

<div
style={{
color: "#666",
fontSize: "8px"
}}
>
FINAL SIZE
</div>


<div
style={{
color:
finalSize > 0
? getSignalColor(
finalSize,
100
)
: "#555",

fontSize: "28px",
fontWeight: "bold"
}}
>
{finalSize}%
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
modeColor(flowMode),

fontSize: "9px",
fontWeight: "bold"
}}
>
{flowMode}
</div>


<div
style={{
color:
eligible
? "#52c41a"
: "#777",

fontSize: "8px",
marginTop: "4px"
}}
>
{eligible
? "ELIGIBLE"
: "NO TRADE"}
</div>

</div>

</div>


{/* STATE */}

<div
style={{
borderTop: "1px solid #222",
paddingTop: "8px",
marginTop: "9px"
}}
>

<div
style={{
color: "#555",
fontSize: "7px"
}}
>
STATE
</div>


<div
style={{
color: "#aaa",
fontSize: "9px",
fontWeight: "bold",
marginTop: "3px",

overflowWrap: "anywhere"
}}
>
{flowState}
</div>

</div>


{/* CORE METRICS */}

<div
style={{
display: "grid",

gridTemplateColumns:
"repeat(3, minmax(0, 1fr))",

gap: "5px",

marginTop: "9px"
}}
>

<MiniMetric
label="STRENGTH"
value={strength}
/>

<MiniMetric
label="CONF"
value={confidence}
/>

<MiniMetric
label="RISK"
value={flowRisk}
decimals={2}
/>

</div>


{/* DETAILS */}

<details
style={{
marginTop: "9px"
}}
>

<summary
style={{
color: "#666",
fontSize: "8px",
cursor: "pointer"
}}
>
SIZING DETAILS
</summary>


<div
style={{
display: "grid",

gridTemplateColumns:
"repeat(3, minmax(0, 1fr))",

gap: "5px",

marginTop: "8px"
}}
>

<MiniMetric
label="RAW"
value={rawSize}
/>

<MiniMetric
label="PRE-CAP"
value={preCap}
/>

<MiniMetric
label="FINAL"
value={finalSize}
/>

</div>


<div
style={{
marginTop: "8px",
paddingTop: "7px",
borderTop: "1px solid #222"
}}
>

<div
style={{
color: "#555",
fontSize: "7px",
marginBottom: "3px"
}}
>
ENGINE
</div>


<div
style={{
color:
eligible
? "#999"
: "#777",

fontSize: "8px",
lineHeight: "1.4",

overflowWrap: "anywhere"
}}
>
{reason}
</div>

</div>

</details>

</div>
);
}


/* =====================================================
COLLAPSIBLE SECTION
===================================================== */

function CollapsibleSection({
title,
subtitle,
children
}: {
title: string;
subtitle?: string;
children: React.ReactNode;
}) {

return (

<details
style={{
borderTop: "1px solid #1c1c1c",
paddingTop: "10px",
marginTop: "10px"
}}
>

<summary
style={{
cursor: "pointer",
listStyle: "none"
}}
>

<div
style={{
display: "flex",
justifyContent: "space-between",
gap: "10px",
alignItems: "center"
}}
>

<div>

<div
style={{
color: "#999",
fontSize: "9px",
fontWeight: "bold"
}}
>
{title}
</div>


{subtitle && (

<div
style={{
color: "#555",
fontSize: "7px",
marginTop: "2px"
}}
>
{subtitle}
</div>

)}

</div>


<div
style={{
color: "#555",
fontSize: "9px"
}}
>
DETAILS
</div>

</div>

</summary>


<div
style={{
marginTop: "10px"
}}
>
{children}
</div>

</details>
);
}


/* =====================================================
SECTION TITLE
===================================================== */

function SectionTitle({
children
}: {
children: React.ReactNode;
}) {

return (

<div
style={{
color: "#999",
fontSize: "9px",
fontWeight: "bold",
marginBottom: "7px"
}}
>
{children}
</div>
);
}


/* =====================================================
METRIC GRID
===================================================== */

function MetricGrid({
children,
minWidth = 100
}: {
children: React.ReactNode;
minWidth?: number;
}) {

return (

<div
style={{
display: "grid",

gridTemplateColumns:
`repeat(auto-fit, minmax(${minWidth}px, 1fr))`,

gap: "7px",

marginBottom: "14px"
}}
>
{children}
</div>
);
}


/* =====================================================
METRIC
===================================================== */

function Metric({
label,
value,
inverse = false,
decimals = 0,
suffix = ""
}: {
label: string;
value: any;
inverse?: boolean;
decimals?: number;
suffix?: string;
}) {

const numeric =
num(value);

const missing =
value === null ||
value === undefined ||
!Number.isFinite(Number(value));


return (

<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "8px",
minWidth: 0
}}
>

<div
style={{
color: "#666",
fontSize: "7px",
marginBottom: "4px",

whiteSpace: "nowrap",
overflow: "hidden",
textOverflow: "ellipsis"
}}
>
{label}
</div>


<div
style={{
color:
missing

? "#555"

: inverse
? riskColor(numeric)
: qualityColor(numeric),

fontSize: "16px",
fontWeight: "bold"
}}
>
{displayNumber(
value,
decimals
)}
{!missing && suffix}
</div>

</div>
);
}


/* =====================================================
MINI METRIC
===================================================== */

function MiniMetric({
label,
value,
decimals = 0
}: {
label: string;
value: number;
decimals?: number;
}) {

return (

<div
style={{
background: "#0b0b0b",
padding: "5px",
minWidth: 0
}}
>

<div
style={{
color: "#555",
fontSize: "7px",

whiteSpace: "nowrap",
overflow: "hidden",
textOverflow: "ellipsis"
}}
>
{label}
</div>


<div
style={{
color: "#aaa",
fontSize: "10px",
fontWeight: "bold",
marginTop: "2px"
}}
>
{decimals > 0
? value.toFixed(decimals)
: Math.round(value)}
</div>

</div>
);
}


/* =====================================================
STATE CARD
===================================================== */

function StateCard({
label,
value
}: {
label: string;
value: string;
}) {

return (

<div
style={{
border: "1px solid #222",
background: "#101010",
padding: "9px",
minWidth: 0
}}
>

<div
style={{
color: "#555",
fontSize: "7px"
}}
>
{label}
</div>


<div
style={{
color: "#aaa",
fontSize: "9px",
fontWeight: "bold",
marginTop: "4px",
lineHeight: "1.35",

overflowWrap: "anywhere"
}}
>
{value}
</div>

</div>
);
}


/* =====================================================
FLOW PIPELINE CARD
===================================================== */

function FlowPipelineCard({
title,
flow
}: {
title: string;
flow: any;
}) {

if (!flow)
return null;


const strength =
num(flow?.strength);

const confidence =
num(flow?.confidence);

const finalSize =
num(flow?.finalSize);

const rawSize =
num(flow?.rawSize);

const preCap =
num(flow?.prePortfolioSize);

const eligible =
flow?.eligible === true;


return (

<div
style={{
border: "1px solid #222",
background: "#0f0f0f",
padding: "10px"
}}
>

<div
style={{
color: "#999",
fontSize: "9px",
fontWeight: "bold",
marginBottom: "8px"
}}
>
{title}
</div>


<div
style={{
display: "grid",

gridTemplateColumns:
"repeat(3, minmax(0, 1fr))",

gap: "5px"
}}
>

<MiniMetric
label="STRENGTH"
value={strength}
/>

<MiniMetric
label="CONF"
value={confidence}
/>

<MiniMetric
label="FINAL"
value={finalSize}
/>

</div>


<details
style={{
marginTop: "8px"
}}
>

<summary
style={{
color: "#555",
fontSize: "7px",
cursor: "pointer"
}}
>
DETAILS
</summary>


<div
style={{
display: "grid",

gridTemplateColumns:
"repeat(2, minmax(0, 1fr))",

gap: "5px",

marginTop: "7px"
}}
>

<MiniMetric
label="RAW"
value={rawSize}
/>

<MiniMetric
label="PRE-CAP"
value={preCap}
/>

</div>

</details>


<div
style={{
marginTop: "8px",

color:
eligible
? "#52c41a"
: "#777",

fontSize: "8px",
fontWeight: "bold"
}}
>
{eligible
? "ELIGIBLE"
: "NO TRADE"}
</div>

</div>
);
}


/* =====================================================
STATUS BADGE
===================================================== */

function StatusBadge({
color,
children
}: {
color: string;
children: React.ReactNode;
}) {

return (

<div
style={{
border:
`1px solid ${color}`,

color,

padding:
"4px 7px",

fontSize: "8px",
fontWeight: "bold"
}}
>
{children}
</div>
);
}


/* =====================================================
SMALL INFO
===================================================== */

function SmallInfo({
label,
value
}: {
label: string;
value: string;
}) {

return (

<div>

<div
style={{
color: "#555",
fontSize: "7px"
}}
>
{label}
</div>


<div
style={{
color: "#999",
fontSize: "8px",
fontWeight: "bold",
marginTop: "2px"
}}
>
{value}
</div>

</div>
);
}
