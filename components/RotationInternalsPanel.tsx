"use client";

import { useRef } from "react";

export default function RotationInternalsPanel({
rotation,
rotationConfirm,
}: any) {

if (!rotation) return null;

/* ================= HELPERS ================= */

function toPercent(value: number) {
return ((value - 1) * 100).toFixed(1);
}

function getState(value: number) {
if (value > 1.02) return "positive";
if (value < 0.98) return "negative";
return "neutral";
}

function getColor(state: string) {
if (state === "positive") return "#52c41a";
if (state === "negative") return "#ff4d4f";
return "#faad14";
}

/* ================= SMOOTHING ================= */

const smoothRef = useRef(0);

function smooth(value: number) {
const alpha = 0.2;

smoothRef.current =
alpha * value +
(1 - alpha) * smoothRef.current;

return smoothRef.current;
}

/* ================= VALUES ================= */

const smallVsTech = rotation.rsSmall ?? 1;
const growthVsValue = rotation.rsGrowth ?? 1;
const equalVsMega = rotation.rsEqual ?? 1;

/* ================= STATES ================= */

const s = getState(smallVsTech);
const g = getState(growthVsValue);
const e = getState(equalVsMega);

/* ================= ROTATION STRENGTH ================= */

const strengthRaw =
Math.abs(smallVsTech - 1) +
Math.abs(growthVsValue - 1) +
Math.abs(equalVsMega - 1);

let strengthLabel = "WEAK";
let strengthColor = "#999";

if (strengthRaw > 0.10) {
strengthLabel = "STRONG ROTATION";
strengthColor = "#52c41a";
} else if (strengthRaw > 0.06) {
strengthLabel = "CONFIRMED";
strengthColor = "#a0d911";
} else if (strengthRaw > 0.03) {
strengthLabel = "EARLY";
strengthColor = "#faad14";
}

/* ================= ROTATION QUALITY ================= */

const quality = rotationConfirm?.quality ?? 50;
const sustainability =
rotationConfirm?.sustainability ?? 50;

const participation =
rotationConfirm?.participation ?? 50;

const falseBreakRisk =
rotationConfirm?.falseBreakRisk ?? 50;

function qualityColor(v: number) {
if (v >= 70) return "#52c41a";
if (v >= 50) return "#faad14";
return "#ff4d4f";
}

/* ================= DOMINANCE ================= */

function getDominance() {

if (
smallVsTech > 1.02 &&
equalVsMega > 1.01
) {
return {
label: "RUSSELL DOMINANCE",
color: "#52c41a",
};
}

if (
smallVsTech < 0.98 &&
equalVsMega < 0.99
) {
return {
label: "NASDAQ DOMINANCE",
color: "#ff4d4f",
};
}

return {
label: "BALANCED / TRANSITION",
color: "#faad14",
};
}

const dominance = getDominance();

/* ================= CAPITAL ROTATION ================= */

function getCapitalRotation() {

if (growthVsValue < 0.98) {
return {
label: "DEFENSIVE ROTATION",
color: "#ff4d4f",
};
}

if (growthVsValue > 1.02) {
return {
label: "GROWTH LEADERSHIP",
color: "#52c41a",
};
}

return {
label: "NEUTRAL ALLOCATION",
color: "#faad14",
};
}

const capitalRotation = getCapitalRotation();

/* ================= STATUS ================= */

function getRotationStatus() {

if (s === "positive" && g === "negative") {
return {
label: "EARLY ROTATION",
color: "#a0d911",
};
}

if (s === "positive" && e === "positive") {
return {
label: "RISK ON",
color: "#52c41a",
};
}

if (s === "negative" && e === "negative") {
return {
label: "RISK OFF",
color: "#ff4d4f",
};
}

return {
label: "TRANSITION",
color: "#faad14",
};
}

const status = getRotationStatus();

/* ================= FLOW ================= */

const rawFlow =
((smallVsTech - 1) +
(equalVsMega - 1)) / 2;

const clamped = Math.max(
-0.05,
Math.min(0.05, rawFlow)
);

const flow = smooth(clamped);

const flowPercent =
((flow + 0.05) / 0.1) * 100;

const flowColor =
flow > 0.01
? "#52c41a"
: flow < -0.01
? "#ff4d4f"
: "#faad14";

let flowLabel = "NEUTRAL";

if (flow > 0.01) {
flowLabel = "RUSSELL DOMINANCE";
}

if (flow < -0.01) {
flowLabel = "NASDAQ DOMINANCE";
}

/* ================= ROW ================= */

function renderRow(
label: string,
value: number
) {
const state = getState(value);

return (
<div
style={{
display: "flex",
justifyContent: "space-between",
marginBottom: "10px",
}}
>
<span style={{ color: "#888" }}>
{label}
</span>

<span
style={{
color: getColor(state),
fontWeight: "bold",
}}
>
{toPercent(value)}%
</span>
</div>
);
}

/* ================= QUALITY BAR ================= */

function qualityBar(
label: string,
value: number
) {
return (
<div style={{ marginBottom: "10px" }}>
<div
style={{
display: "flex",
justifyContent: "space-between",
fontSize: "11px",
marginBottom: "4px",
}}
>
<span style={{ color: "#777" }}>
{label}
</span>

<span
style={{
color: qualityColor(value),
fontWeight: "bold",
}}
>
{value}
</span>
</div>

<div
style={{
height: "5px",
background: "#222",
}}
>
<div
style={{
width: `${value}%`,
height: "100%",
background: qualityColor(value),
}}
/>
</div>
</div>
);
}

/* ================= RENDER ================= */

return (
<div
style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "16px",
}}
>
<h3
style={{
color: "#888",
marginBottom: "12px",
}}
>
ROTATION INTERNALS
</h3>

<div
style={{
marginBottom: "12px",
padding: "6px",
border: `1px solid ${strengthColor}`,
color: strengthColor,
fontWeight: "bold",
textAlign: "center",
}}
>
{strengthLabel}
</div>

<div
style={{
marginBottom: "10px",
color: dominance.color,
fontWeight: "bold",
}}
>
{dominance.label}
</div>

<div
style={{
marginBottom: "14px",
color: capitalRotation.color,
fontSize: "12px",
}}
>
{capitalRotation.label}
</div>

<div style={{ marginBottom: "16px" }}>

<div
style={{
display: "flex",
justifyContent: "space-between",
fontSize: "12px",
color: "#666",
}}
>
<span>NASDAQ</span>
<span>RUSSELL</span>
</div>

<div
style={{
position: "relative",
height: "6px",
background: "#222",
marginTop: "4px",
}}
>
<div
style={{
position: "absolute",
left: `${flowPercent}%`,
transform: "translateX(-50%)",
width: "10px",
height: "10px",
background: flowColor,
borderRadius: "50%",
top: "-2px",
}}
/>
</div>

<div
style={{
textAlign: "center",
marginTop: "6px",
fontSize: "12px",
color: flowColor,
fontWeight: "bold",
}}
>
{flowLabel}
</div>
</div>

{renderRow("Small vs Tech", smallVsTech)}
{renderRow("Growth vs Value", growthVsValue)}
{renderRow("Equal vs Mega", equalVsMega)}

<div
style={{
borderTop: "1px solid #222",
margin: "14px 0",
}}
/>

{qualityBar("QUALITY", quality)}
{qualityBar("SUSTAINABILITY", sustainability)}
{qualityBar("PARTICIPATION", participation)}

<div
style={{
marginTop: "10px",
color: qualityColor(100 - falseBreakRisk),
fontSize: "12px",
fontWeight: "bold",
}}
>
FALSE BREAK RISK: {falseBreakRisk}
</div>

<div
style={{
borderTop: "1px solid #222",
margin: "12px 0",
}}
/>

<div
style={{
display: "flex",
justifyContent: "space-between",
}}
>
<span style={{ color: "#888" }}>
Status
</span>

<span
style={{
color: status.color,
fontWeight: "bold",
}}
>
{status.label}
</span>
</div>
</div>
);
}
