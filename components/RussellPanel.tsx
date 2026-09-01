"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function RussellPanel({
russell,
exit
}: any) {

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

IMPORTANT:

UI follows the ENGINE decision.

The panel does NOT reinterpret the score.
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
note: "Long gate not sufficiently confirmed"
};
}
}

const superSignal =
getSuperSignal();


/* =====================================================
EXECUTION

Again:
Follow ENGINE action.
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
note: "No valid Russell CALL setup",
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
minWidth: 0
}}
>


{/* =================================================
HEADER
================================================= */}

<h3
style={{
color: "#888",
marginBottom: "12px",
marginTop: 0
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
padding: "10px",
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
fontWeight: "bold"
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
PRIMARY STATE
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

<InfoRow
label="State"
value={state}
color={
state === "LONG_SETUP"
? "#52c41a"
: "#999"
}
/>


{/* =================================================
EXECUTION NOTE
================================================= */}

<div
style={{
marginBottom: "14px",
fontSize: "12px",
opacity: 0.7
}}
>
{execution.note}
</div>


{/* =================================================
EXIT
================================================= */}

{exitInfo && (

<div
style={{
marginBottom: "14px",
paddingTop: "10px",
borderTop: "1px solid #222"
}}
>

<div
style={{
color: "#777",
fontSize: "11px",
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
fontSize: "12px",
opacity: 0.7,
marginTop: "3px"
}}
>
{exitInfo.note}
</div>

{exitInfo.sizeReduction > 0 && (

<div
style={{
fontSize: "11px",
color: "#777",
marginTop: "4px"
}}
>
Reduction: {exitInfo.sizeReduction}%
</div>

)}

</div>

)}


{/* =================================================
SCORE
================================================= */}

<div
style={{
marginBottom: "14px"
}}
>

<div
style={{
color: "#777",
fontSize: "12px"
}}
>
Russell Score
</div>

<div
style={{
color:
getSignalColor(
score,
maxScore
),
fontSize: "20px",
fontWeight: "bold",
marginTop: "3px"
}}
>
{score}/{maxScore}
</div>

<div
style={{
height: "6px",
background: "#222",
marginTop: "5px",
width: "100%"
}}
>

<div
style={bar(
score,
maxScore
)}
/>

</div>

</div>


{/* =================================================
CONFIDENCE
================================================= */}

<div
style={{
marginBottom: "14px"
}}
>

<div
style={{
color: "#777",
fontSize: "12px"
}}
>
Confidence
</div>

<div
style={{
color:
getSignalColor(
confidence,
100
),
fontWeight: "bold",
marginTop: "3px"
}}
>
{confidence}%
</div>

</div>


{/* =================================================
COMPONENTS
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
fontSize: "11px",
marginBottom: "10px"
}}
>
ENGINE COMPONENTS
</div>


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

</div>


{/* =================================================
LONG GATE
================================================= */}

<div
style={{
marginTop: "14px",
paddingTop: "12px",
borderTop: "1px solid #222"
}}
>

<div
style={{
color: "#777",
fontSize: "11px",
marginBottom: "10px"
}}
>
RUSSELL LONG GATE
</div>


<InfoRow
label="Gate"
value={
gateOpen
? "OPEN"
: "CLOSED"
}
color={
gateOpen
? "#52c41a"
: "#999"
}
bold
/>


<InfoRow
label="Hard Block"
value={
blocked
? "ACTIVE"
: "CLEAR"
}
color={
blocked
? "#ff4d4f"
: "#52c41a"
}
/>

</div>


{/* =================================================
SETUP CHECKLIST
================================================= */}

<div
style={{
marginTop: "14px",
paddingTop: "12px",
borderTop: "1px solid #222"
}}
>

<div
style={{
color: "#777",
fontSize: "11px",
marginBottom: "10px"
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
? "CONFIRMED"
: "MISSING";


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
minWidth: 0,
wordBreak: "break-word"
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
META
================================================= */}

<div
style={{
marginTop: "14px",
paddingTop: "12px",
borderTop: "1px solid #222"
}}
>

<div
style={{
color: "#777",
fontSize: "11px",
marginBottom: "8px"
}}
>
MARKET CONTEXT
</div>


<InfoRow
label="Rotation State"
value={
meta.rotationConfirmState ??
"UNKNOWN"
}
/>

<InfoRow
label="Rotation Decay"
value={
typeof meta.rotationDecayScore === "number"
? `${meta.rotationDecayScore}`
: "N/A"
}
/>

<InfoRow
label="Market Quality"
value={
typeof meta.marketQualityScore === "number"
? `${meta.marketQualityScore}`
: "N/A"
}
/>

<InfoRow
label="Participation"
value={
typeof meta.participationScore === "number"
? `${meta.participationScore}`
: "N/A"
}
/>

<InfoRow
label="Breadth 50"
value={
typeof meta.breadth50 === "number"
? `${meta.breadth50.toFixed(1)}`
: "N/A"
}
/>

<InfoRow
label="Breadth 200"
value={
typeof meta.breadth200 === "number"
? `${meta.breadth200.toFixed(1)}`
: "N/A"
}
/>

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
flexShrink: 0
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
wordBreak: "break-word"
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
