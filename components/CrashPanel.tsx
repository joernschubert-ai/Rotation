// /components/CrashPanel.tsx

"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function CrashPanel({ crash }: any) {

if (!crash) return null;

/* =====================================================
HELPERS
===================================================== */

function sensitiveCrashColor(
value: number
) {

/*
PHASE 9 FIX

21–35:
yellow/orange
NOT green
*/

if (value >= 65) {
return "#ff4d4f";
}

if (value >= 36) {
return "#fa8c16";
}

if (value >= 21) {
return "#faad14";
}

return "#52c41a";
}

function bar(value: number, max: number) {

const pct =
max > 0
? (value / max) * 100
: 0;

return {
width: `${pct}%`,
height: "6px",
background:
sensitiveCrashColor(
(value / max) * 100
),
borderRadius: "3px"
};
}

function stateColor(state: string) {

if (
state === "HIGH" ||
state === "PANIC"
) {
return "#ff4d4f";
}

if (
state === "ELEVATED" ||
state === "MEDIUM" ||
state === "STRESSED"
) {
return "#faad14";
}

return "#52c41a";
}

/* =====================================================
SAFE ACCESS
===================================================== */

const structural =
crash?.structuralFragility ?? {
score: 0,
state: "LOW"
};

const trigger =
crash?.crashTrigger ?? {
score: 0,
state: "LOW"
};

const panic =
crash?.panicState ?? {
score: 0,
state: "CALM"
};

const components =
crash?.components ?? {};

const highLow =
components?.highLow ?? {
value: 0,
max: 25,
strength: 0
};

/* =====================================================
GAUGE
===================================================== */

function Gauge({ value }: { value: number }) {

const rotation =
(value / 100) * 180;

return (

<div style={{
position: "relative",
width: "140px",
height: "70px",
margin: "0 auto 12px auto"
}}>

<div style={{
width: "100%",
height: "100%",
borderTopLeftRadius: "140px",
borderTopRightRadius: "140px",
background:
"linear-gradient(to right, #52c41a, #fadb14, #fa8c16, #ff4d4f)"
}} />

<div style={{
position: "absolute",
bottom: 0,
left: "50%",
width: "2px",
height: "70px",
background: "#fff",
transform: `rotate(${rotation}deg)`,
transformOrigin: "bottom center"
}} />

<div style={{
position: "absolute",
bottom: -2,
left: "50%",
transform: "translateX(-50%)",
width: "6px",
height: "6px",
background: "#fff",
borderRadius: "50%"
}} />

</div>
);
}

/* =====================================================
RENDER
===================================================== */

return (

<div style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "16px"
}}>

<h3 style={{
color: "#888",
marginBottom: "12px"
}}>
CRASH ENGINE
</h3>

<Gauge value={crash.score} />

<div style={{
marginBottom: "12px",
textAlign: "center"
}}>
<div style={{
color:
sensitiveCrashColor(
crash.score
),
fontSize: "20px",
fontWeight: "bold"
}}>
{crash.score}/100
</div>
</div>

{/* =====================================================
PROBABILITY
===================================================== */}

<div style={{ marginBottom: "16px" }}>

<div style={{
fontSize: "12px",
color: "#666"
}}>
Crash Probability
</div>

<div style={{
fontSize: "18px",
fontWeight: "bold",
color:
sensitiveCrashColor(
crash.probability
)
}}>
{crash.probability}%
</div>

</div>

{/* =====================================================
STRUCTURAL FRAGILITY
===================================================== */}

<div style={{
marginBottom: "16px",
padding: "12px",
border: `1px solid ${stateColor(structural.state)}`,
background: "#141414"
}}>

<div style={{
fontSize: "12px",
color: "#666"
}}>
STRUCTURAL FRAGILITY
</div>

<div style={{
fontSize: "18px",
fontWeight: "bold",
color: stateColor(structural.state)
}}>
{structural.state}
</div>

<div style={{
marginTop: "4px",
color: "#bbb"
}}>
{structural.score}/100
</div>

<div style={{
marginTop: "8px"
}}>
<div style={bar(structural.score, 100)} />
</div>

</div>

{/* =====================================================
CRASH TRIGGER
===================================================== */}

<div style={{
marginBottom: "16px",
padding: "12px",
border: `1px solid ${stateColor(trigger.state)}`,
background: "#141414"
}}>

<div style={{
fontSize: "12px",
color: "#666"
}}>
CRASH TRIGGER
</div>

<div style={{
fontSize: "18px",
fontWeight: "bold",
color: stateColor(trigger.state)
}}>
{trigger.state}
</div>

<div style={{
marginTop: "4px",
color: "#bbb"
}}>
{trigger.score}/100
</div>

<div style={{
marginTop: "8px"
}}>
<div style={bar(trigger.score, 100)} />
</div>

</div>

{/* =====================================================
PANIC STATE
===================================================== */}

<div style={{
marginBottom: "16px",
padding: "12px",
border: `1px solid ${stateColor(panic.state)}`,
background: "#141414"
}}>

<div style={{
fontSize: "12px",
color: "#666"
}}>
PANIC STATE
</div>

<div style={{
fontSize: "18px",
fontWeight: "bold",
color: stateColor(panic.state)
}}>
{panic.state}
</div>

<div style={{
marginTop: "4px",
color: "#bbb"
}}>
{panic.score}/100
</div>

<div style={{
marginTop: "8px"
}}>
<div style={bar(panic.score, 100)} />
</div>

</div>

{/* =====================================================
HIGH LOW
===================================================== */}

<div style={{
marginTop: "18px",
paddingTop: "12px",
borderTop: "1px solid #222"
}}>

<div style={{
fontSize: "12px",
color: "#666"
}}>
High / Low Structure
</div>

<div style={{
marginTop: "4px",
color:
sensitiveCrashColor(
(Math.abs(highLow.value) / highLow.max) * 100
)
}}>
{highLow.value}/{highLow.max}
</div>

<div style={{
fontSize: "11px",
color: "#777",
marginTop: "2px"
}}>
Delta: {highLow.strength}
</div>

<div style={{
marginTop: "6px"
}}>
<div style={bar(
Math.abs(highLow.value),
highLow.max
)} />
</div>

</div>

{/* =====================================================
SUMMARY
===================================================== */}

<div style={{
marginTop: "18px",
padding: "10px",
background: "#141414",
border: "1px solid #222",
color: "#999",
fontSize: "12px",
lineHeight: 1.5
}}>
{crash.summary}
</div>

</div>
);
}
