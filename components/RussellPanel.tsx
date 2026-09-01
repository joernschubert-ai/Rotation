"use client";

import { useState } from "react";
import { getSignalColor } from "@/lib/engine/colorEngine";

export default function RussellPanel({
russell,
exit
}: any) {

const [openSection, setOpenSection] =
useState<string | null>(null);

if (!russell) return null;


/* =====================================================
SAFE VALUES
===================================================== */

const action =
russell.action ??
russell.decision ??
"NO_TRADE";

const decision =
russell.decision ??
action;

const score =
typeof russell.score?.value === "number"
? russell.score.value
: 0;

const maxScore =
typeof russell.score?.max === "number"
? russell.score.max
: 10;

const confidence =
typeof russell.confidence === "number"
? russell.confidence
: 0;

const state =
russell.state ??
"BLOCKED";

const setup =
russell.setup ?? {};

const marketState =
russell.marketState ?? {};

const meta =
russell.meta ?? {};

const components =
russell.components ?? {};

const history =
russell.history ?? {};


/* =====================================================
COMPONENT SAFE ACCESS
===================================================== */

const structureComponent =
components.structure ?? {
value: 0,
max: 5
};

const regimeComponent =
components.regime ?? {
value: 0,
max: 3
};

const riskComponent =
components.risk ?? {
value: 0,
max: 7
};


/* =====================================================
SUPER SIGNAL
===================================================== */

function getSuperSignal() {

switch (action) {

case "AGGRESSIVE":
return {
text: "STRONG RUSSELL LONG",
color: "#52c41a",
border: "#52c41a",
note: "High conviction rotation setup"
};


case "ADD":
return {
text: "ADD RUSSELL LONG",
color: "#95de64",
border: "#389e0d",
note: "Confirmed rotation – increase exposure"
};


case "BUILD":
return {
text: "BUILD RUSSELL LONG",
color: "#faad14",
border: "#d48806",
note: "Constructive long structure"
};


case "EARLY":
return {
text: "EARLY RUSSELL SETUP",
color: "#fa8c16",
border: "#d46b08",
note: "Early setup – confirmation still required"
};


case "NO_TRADE":
default:
return {
text: "NO RUSSELL EDGE",
color: "#999",
border: "#333",
note: "Russell CALL conditions are not sufficiently confirmed"
};
}
}

const superSignal =
getSuperSignal();


/* =====================================================
EXECUTION
===================================================== */

function getRussellExecution() {

switch (action) {

case "AGGRESSIVE":
return {
action: "FULL SIZE",
mode: "HIGH CONVICTION",
note: "Strong confirmed Russell rotation"
};


case "ADD":
return {
action: "ADD POSITION",
mode: "SCALE IN",
note: "Increase existing Russell exposure"
};


case "BUILD":
return {
action: "BUILD POSITION",
mode: "PARTIAL SIZE",
note: "Constructive setup – scale in carefully"
};


case "EARLY":
return {
action: "SMALL STARTER",
mode: "PROBE",
note: "Early rotation – confirmation required"
};


case "NO_TRADE":
default:
return {
action: "WAIT",
mode: "NONE",
note: "No valid Russell CALL setup"
};
}
}

const execution =
getRussellExecution();


/* =====================================================
EXIT
===================================================== */

function getLongExit() {

if (!exit) return null;

const sizeReduction =
typeof exit.sizeReduction === "number"
? exit.sizeReduction
: typeof exit.reduction === "number"
? exit.reduction
: 0;


if (sizeReduction >= 80) {

return {
label: "EXIT LONG",
color: "#ff4d4f",
note: "Risk-off / structural breakdown",
sizeReduction
};
}


if (sizeReduction >= 50) {

return {
label: "REDUCE LONG",
color: "#fa8c16",
note: "Structure weakening",
sizeReduction
};
}


if (sizeReduction >= 30) {

return {
label: "TRIM POSITION",
color: "#fadb14",
note: "Momentum or structure deteriorating",
sizeReduction
};
}


if (action === "NO_TRADE") {

return {
label: "NO NEW ENTRY",
color: "#999",
note: "Existing position management only",
sizeReduction
};
}


return {
label: "HOLD LONG",
color: "#52c41a",
note: "Long structure remains valid",
sizeReduction
};
}

const exitInfo =
getLongExit();


/* =====================================================
HELPERS
===================================================== */

function bar(
value: number,
max: number
) {

const safeValue =
Number.isFinite(value)
? value
: 0;

const safeMax =
Number.isFinite(max) &&
max > 0
? max
: 1;

const pct =
Math.max(
0,
Math.min(
100,
(safeValue / safeMax) * 100
)
);

return {
width: `${pct}%`,
height: "6px",
background:
getSignalColor(
safeValue,
safeMax
),
transition:
"width 0.3s ease"
};
}


function formatNumber(
value: any,
digits = 0
) {

if (typeof value !== "number") {
return "N/A";
}

return value.toFixed(digits);
}


/* =====================================================
SETUP STATUS
===================================================== */

const setupItems = [

{
label: "Relative Strength",
active:
setup.relativeStrength === true
},

{
label: "Absolute Strength",
active:
setup.absoluteStrength === true
},

{
label: "Healthy Breadth",
active:
setup.healthyBreadth === true
},

{
label: "Rotation Confirmed",
active:
setup.rotationConfirmed === true
},

{
label: "Rotation Exhausted",
active:
setup.rotationExhausted === true,
negative: true
}

];


/* =====================================================
MARKET BLOCK STATUS
===================================================== */

const blocked =
marketState.russellLongBlocked === true;

const gateOpen =
marketState.russellLongGate === true;

const distributionConfirmationRequired =
marketState.distributionConfirmationRequired === true;


/* =====================================================
ACCORDION
===================================================== */

function toggleSection(
section: string
) {

setOpenSection(
openSection === section
? null
: section
);
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
boxSizing: "border-box",
minWidth: 0,
overflow: "hidden"
}}
>


{/* =================================================
HEADER
================================================= */}

<h3
style={{
color: "#888",
marginBottom: "12px",
marginTop: 0,
fontSize: "16px"
}}
>
RUSSELL (CALLS)
</h3>


{/* =================================================
SUPER SIGNAL
================================================= */}

<div
style={{
marginBottom: "14px",
padding: "11px",
border:
`1px solid ${superSignal.border}`,
background: "#111",
textAlign: "center",
wordBreak: "break-word"
}}
>

<div
style={{
color: superSignal.color,
fontWeight: "bold",
fontSize: "15px"
}}
>
{superSignal.text}
</div>

<div
style={{
fontSize: "12px",
opacity: 0.7,
marginTop: "4px"
}}
>
{superSignal.note}
</div>

</div>


{/* =================================================
PRIMARY DECISION
================================================= */}

<InfoRow
label="Decision"
value={decision}
color={superSignal.color}
bold
/>

<InfoRow
label="Execution"
value={execution.action}
color={superSignal.color}
bold
/>

<InfoRow
label="Mode"
value={execution.mode}
/>


{/* =================================================
SCORE + CONFIDENCE
================================================= */}

<div
style={{
display: "grid",
gridTemplateColumns:
"1fr 1fr",
gap: "12px",
marginTop: "14px",
marginBottom: "14px"
}}
>

<MetricBox
label="RUSSELL SCORE"
value={`${score}/${maxScore}`}
color={
getSignalColor(
score,
maxScore
)
}
/>


<MetricBox
label="CONFIDENCE"
value={`${confidence}%`}
color={
getSignalColor(
confidence,
100
)
}
/>

</div>


{/* =================================================
LONG GATE
================================================= */}

<div
style={{
padding: "10px",
background: "#111",
border: "1px solid #222",
marginBottom: "14px"
}}
>

<div
style={{
color: "#777",
fontSize: "10px",
marginBottom: "6px"
}}
>
RUSSELL LONG GATE
</div>

<div
style={{
display: "flex",
justifyContent: "space-between",
gap: "10px"
}}
>

<span
style={{
color: "#aaa",
fontSize: "12px"
}}
>
Entry Status
</span>

<span
style={{
color:
gateOpen
? "#52c41a"
: blocked
? "#ff4d4f"
: "#999",
fontWeight: "bold",
fontSize: "12px"
}}
>
{gateOpen
? "OPEN"
: blocked
? "BLOCKED"
: "CLOSED"}
</span>

</div>

</div>


{/* =================================================
EXIT
================================================= */}

{exitInfo && (

<div
style={{
marginBottom: "14px",
padding: "10px",
border:
`1px solid ${exitInfo.color}`,
background: "#111"
}}
>

<div
style={{
color: "#777",
fontSize: "10px",
marginBottom: "5px"
}}
>
POSITION STATE
</div>

<div
style={{
color: exitInfo.color,
fontWeight: "bold"
}}
>
{exitInfo.label}
</div>

<div
style={{
fontSize: "11px",
opacity: 0.7,
marginTop: "3px"
}}
>
{exitInfo.note}
</div>

</div>

)}


{/* =================================================
SETUP CHECK – ALWAYS VISIBLE
================================================= */}

<div
style={{
borderTop: "1px solid #222",
paddingTop: "12px"
}}
>

<div
style={{
color: "#777",
fontSize: "10px",
marginBottom: "9px"
}}
>
SETUP CHECK
</div>


{setupItems.map((item) => {

const color =
item.negative
? item.active
? "#ff4d4f"
: "#52c41a"
: item.active
? "#52c41a"
: "#999";

const status =
item.negative
? item.active
? "WARNING"
: "CLEAR"
: item.active
? "YES"
: "NO";


return (

<div
key={item.label}
style={{
display: "flex",
justifyContent: "space-between",
gap: "12px",
marginBottom: "7px",
fontSize: "12px"
}}
>

<span
style={{
color: "#bbb"
}}
>
{item.label}
</span>

<span
style={{
color,
fontWeight: "bold",
flexShrink: 0
}}
>
{status}
</span>

</div>

);

})}

</div>


{/* =================================================
EXECUTION NOTE
================================================= */}

<div
style={{
marginTop: "12px",
fontSize: "11px",
color: "#777"
}}
>
{execution.note}
</div>


{/* =================================================
DETAILS ACCORDION
================================================= */}

<div
style={{
marginTop: "16px",
borderTop: "1px solid #222"
}}
>


{/* ENGINE COMPONENTS */}

<AccordionSection
title="ENGINE COMPONENTS"
open={
openSection === "components"
}
onClick={() =>
toggleSection("components")
}
>

<ComponentRow
label="Structure"
value={structureComponent.value}
max={structureComponent.max}
bar={bar}
/>

<ComponentRow
label="Regime"
value={regimeComponent.value}
max={regimeComponent.max}
bar={bar}
/>

<ComponentRow
label="Risk"
value={riskComponent.value}
max={riskComponent.max}
bar={bar}
/>

</AccordionSection>


{/* ROTATION QUALITY */}

<AccordionSection
title="ROTATION QUALITY"
open={
openSection === "rotation"
}
onClick={() =>
toggleSection("rotation")
}
>

<InfoRow
label="Rotation State"
value={
meta.rotationConfirmState ??
"UNKNOWN"
}
/>

<InfoRow
label="Confidence"
value={`${formatNumber(meta.rotationConfidence)}%`}
/>

<InfoRow
label="Rotation Quality"
value={`${formatNumber(meta.rotationQuality)}%`}
/>

<InfoRow
label="False Break Risk"
value={`${formatNumber(meta.falseBreakRisk)}%`}
color={
meta.falseBreakRisk >= 60
? "#ff4d4f"
: "#ddd"
}
/>

<InfoRow
label="Rotation Decay"
value={formatNumber(meta.rotationDecayScore)}
color={
meta.rotationDecayScore >= 75
? "#ff4d4f"
: "#ddd"
}
/>

<InfoRow
label="Decay State"
value={
meta.rotationDecayState ??
"UNKNOWN"
}
/>

</AccordionSection>


{/* MARKET CONTEXT */}

<AccordionSection
title="MARKET CONTEXT"
open={
openSection === "market"
}
onClick={() =>
toggleSection("market")
}
>

<InfoRow
label="Market Quality"
value={formatNumber(meta.marketQualityScore)}
/>

<InfoRow
label="Participation"
value={formatNumber(meta.participationScore)}
/>

<InfoRow
label="Phase Confirmation"
value={formatNumber(meta.phaseConfirmationScore)}
/>

<InfoRow
label="Phase State"
value={
meta.phaseConfirmationState ??
"UNKNOWN"
}
/>

<InfoRow
label="Price Momentum"
value={formatNumber(meta.priceMomentumScore)}
/>

<InfoRow
label="Momentum State"
value={
meta.priceMomentumState ??
"UNKNOWN"
}
/>

<InfoRow
label="Breadth 50"
value={formatNumber(meta.breadth50, 1)}
/>

<InfoRow
label="Breadth 200"
value={formatNumber(meta.breadth200, 1)}
/>

<InfoRow
label="VIX"
value={formatNumber(meta.vix, 1)}
/>

</AccordionSection>


{/* MARKET CONDITIONS */}

<AccordionSection
title="RISK CONDITIONS"
open={
openSection === "risk"
}
onClick={() =>
toggleSection("risk")
}
>

<StatusRow
label="Hard Block"
active={blocked}
negative
/>

<StatusRow
label="Absolute Risk Off"
active={
marketState.absoluteRiskOff === true
}
negative
/>

<StatusRow
label="Broad Market Weakness"
active={
marketState.broadMarketWeakness === true
}
negative
/>

<StatusRow
label="Severe Breakdown"
active={
marketState.severeMarketBreakdown === true
}
negative
/>

<StatusRow
label="Rotation False Break"
active={
marketState.rotationFalseBreak === true
}
negative
/>

<StatusRow
label="Distribution"
active={
marketState.rotationDistribution === true
}
negative
/>

<StatusRow
label="Distribution Confirmation Required"
active={
distributionConfirmationRequired
}
negative
/>

</AccordionSection>


{/* HISTORY */}

<AccordionSection
title="MARKET HISTORY"
open={
openSection === "history"
}
onClick={() =>
toggleSection("history")
}
>

<InfoRow
label="Russell 5D"
value={
typeof history.russell5dReturn === "number"
? `${history.russell5dReturn.toFixed(2)}%`
: "N/A"
}
/>

<InfoRow
label="NASDAQ 5D"
value={
typeof history.nasdaq5dReturn === "number"
? `${history.nasdaq5dReturn.toFixed(2)}%`
: "N/A"
}
/>

<InfoRow
label="S&P 500 5D"
value={
typeof history.sp5005dReturn === "number"
? `${history.sp5005dReturn.toFixed(2)}%`
: "N/A"
}
/>

<InfoRow
label="Breadth Trend"
value={formatNumber(
history.breadthTrend,
1
)}
/>

<InfoRow
label="Breadth Acceleration"
value={formatNumber(
history.breadthAcceleration,
1
)}
/>

<InfoRow
label="Participation Decay"
value={formatNumber(
history.participationDecay,
1
)}
/>

<InfoRow
label="Crash Trend"
value={formatNumber(
history.crashTrend,
1
)}
/>

</AccordionSection>

</div>

</div>

);

}


/* =====================================================
ACCORDION SECTION
===================================================== */

function AccordionSection({
title,
open,
onClick,
children
}: any) {

return (

<div
style={{
borderBottom: "1px solid #222"
}}
>

<button
onClick={onClick}
style={{
width: "100%",
background: "transparent",
border: "none",
color: "#888",
padding: "13px 0",
cursor: "pointer",
display: "flex",
justifyContent: "space-between",
alignItems: "center",
fontSize: "11px",
fontWeight: "bold",
textAlign: "left"
}}
>

<span>
{title}
</span>

<span
style={{
color: "#666",
fontSize: "14px"
}}
>
{open
? "−"
: "+"}
</span>

</button>


{open && (

<div
style={{
paddingBottom: "12px"
}}
>
{children}
</div>

)}

</div>

);

}


/* =====================================================
METRIC BOX
===================================================== */

function MetricBox({
label,
value,
color
}: any) {

return (

<div
style={{
background: "#111",
border: "1px solid #222",
padding: "9px"
}}
>

<div
style={{
color: "#666",
fontSize: "9px",
marginBottom: "4px"
}}
>
{label}
</div>

<div
style={{
color,
fontWeight: "bold",
fontSize: "18px"
}}
>
{value}
</div>

</div>

);

}


/* =====================================================
INFO ROW
===================================================== */

function InfoRow({
label,
value,
color = "#ddd",
bold = false
}: any) {

return (

<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "flex-start",
gap: "12px",
marginBottom: "8px",
fontSize: "12px"
}}
>

<span
style={{
color: "#777",
minWidth: 0
}}
>
{label}
</span>

<span
style={{
color,
fontWeight:
bold
? "bold"
: "normal",
textAlign: "right",
wordBreak: "break-word",
minWidth: 0
}}
>
{value}
</span>

</div>

);

}


/* =====================================================
STATUS ROW
===================================================== */

function StatusRow({
label,
active,
negative = false
}: any) {

const color =
negative
? active
? "#ff4d4f"
: "#52c41a"
: active
? "#52c41a"
: "#999";

const value =
negative
? active
? "ACTIVE"
: "CLEAR"
: active
? "CONFIRMED"
: "NO";


return (

<div
style={{
display: "flex",
justifyContent: "space-between",
gap: "12px",
marginBottom: "7px",
fontSize: "12px"
}}
>

<span
style={{
color: "#ccc",
minWidth: 0,
wordBreak: "break-word"
}}
>
{label}
</span>

<span
style={{
color,
fontWeight: "bold",
flexShrink: 0
}}
>
{value}
</span>

</div>

);

}


/* =====================================================
COMPONENT ROW
===================================================== */

function ComponentRow({
label,
value,
max,
bar
}: any) {

const safeValue =
typeof value === "number"
? value
: 0;

const safeMax =
typeof max === "number" &&
max > 0
? max
: 1;


return (

<div
style={{
marginBottom: "12px"
}}
>

<div
style={{
display: "flex",
justifyContent: "space-between",
gap: "10px",
fontSize: "12px"
}}
>

<span>
{label}
</span>

<span>
{safeValue}/{safeMax}
</span>

</div>


<div
style={{
height: "6px",
background: "#222",
marginTop: "4px",
width: "100%"
}}
>

<div
style={bar(
safeValue,
safeMax
)}
/>

</div>

</div>

);

}
