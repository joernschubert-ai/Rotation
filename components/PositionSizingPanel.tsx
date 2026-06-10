// /components/PositionSizingPanel.tsx

"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

export default function PositionSizingPanel({
sizing,
decision,
nasdaq,
master,
russell
}: any) {

if (!sizing) return null;

/* ======================================================
SAFE ACCESS
====================================================== */

const components = sizing?.components ?? {};
const edge = sizing?.edge ?? {};
const sizingModel = sizing?.sizingModel ?? {};
const meta = sizing?.meta ?? {};

/* ======================================================
HELPERS
====================================================== */

function modeColor(mode: string) {

switch (mode) {

case "AGGRESSIVE":
return "#ff4d4f";

case "ACTIVE":
return "#fa8c16";

case "PROBING":
return "#fadb14";

case "DEFENSIVE":
return "#52c41a";

default:
return "#666";
}
}

function directionColor(direction: string) {

switch (direction) {

case "LONG":
return "#52c41a";

case "SHORT":
return "#ff4d4f";

default:
return "#999";
}
}

function edgeColor(score: number) {

if (score >= 80) {
return "#ff4d4f";
}

if (score >= 60) {
return "#fa8c16";
}

if (score >= 40) {
return "#fadb14";
}

if (score >= 20) {
return "#73d13d";
}

return "#666";
}

function edgeLabel(score: number) {

if (score >= 80) {
return "EXTREME ASYMMETRY";
}

if (score >= 60) {
return "STRONG EDGE";
}

if (score >= 40) {
return "TRADEABLE";
}

if (score >= 20) {
return "EARLY EDGE";
}

return "NO EDGE";
}

function alignmentColor() {

const decisionDirection =
decision?.direction ?? "NEUTRAL";

const sizingDirection =
sizing?.direction ?? "NEUTRAL";

if (
decisionDirection !== "NEUTRAL" &&
sizingDirection !== "NEUTRAL" &&
decisionDirection !== sizingDirection
) {
return "#ff4d4f";
}

return "#52c41a";
}

function alignmentText() {

const decisionDirection =
decision?.direction ?? "NEUTRAL";

const sizingDirection =
sizing?.direction ?? "NEUTRAL";

if (
decisionDirection !== "NEUTRAL" &&
sizingDirection !== "NEUTRAL" &&
decisionDirection !== sizingDirection
) {
return "MISALIGNED";
}

return "ALIGNED";
}

/* ======================================================
VALUES
====================================================== */

const edgeScore =
Number(edge?.score ?? 0);

const finalSize =
Number(sizing?.size ?? 0);

const maxSize =
Number(sizingModel?.maxSize ?? 0);

const adjustedSize =
Number(sizingModel?.adjustedSize ?? 0);

/* ======================================================
RENDER
====================================================== */

return (

<div
style={{
background: "#0d0d0d",
border: "1px solid #222",
padding: "16px"
}}
>

{/* ======================================================
HEADER
====================================================== */}

<div
style={{
marginBottom: "14px",
display: "flex",
justifyContent: "space-between",
alignItems: "center"
}}
>

<div
style={{
color: "#999",
fontWeight: "bold",
fontSize: "14px"
}}
>
POSITION SIZING V2
</div>

<div
style={{
color: alignmentColor(),
fontSize: "12px",
fontWeight: "bold"
}}
>
{alignmentText()}
</div>

</div>

{/* ======================================================
EDGE BLOCK
====================================================== */}

<div
style={{
marginBottom: "16px",
padding: "14px",
border: `1px solid ${edgeColor(edgeScore)}`,
background: "#111"
}}
>

<div
style={{
color: "#777",
fontSize: "11px",
marginBottom: "6px"
}}
>
CENTRAL EDGE SYSTEM
</div>

<div
style={{
color: edgeColor(edgeScore),
fontSize: "26px",
fontWeight: "bold"
}}
>
{edgeScore}/100
</div>

<div
style={{
color: edgeColor(edgeScore),
fontSize: "13px",
marginTop: "4px"
}}
>
{edgeLabel(edgeScore)}
</div>

</div>

{/* ======================================================
GRID
====================================================== */}

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(2, 1fr)",
gap: "12px",
marginBottom: "16px"
}}
>

{/* SIZE */}

<div
style={{
border: "1px solid #222",
padding: "12px",
background: "#111"
}}
>

<div
style={{
color: "#777",
fontSize: "11px",
marginBottom: "6px"
}}
>
FINAL SIZE
</div>

<div
style={{
color: getSignalColor(finalSize, 100),
fontWeight: "bold",
fontSize: "24px"
}}
>
{finalSize}%
</div>

</div>

{/* MODE */}

<div
style={{
border: "1px solid #222",
padding: "12px",
background: "#111"
}}
>

<div
style={{
color: "#777",
fontSize: "11px",
marginBottom: "6px"
}}
>
EXECUTION MODE
</div>

<div
style={{
color: modeColor(sizing?.mode),
fontWeight: "bold",
fontSize: "18px"
}}
>
{sizing?.mode}
</div>

</div>

{/* DIRECTION */}

<div
style={{
border: "1px solid #222",
padding: "12px",
background: "#111"
}}
>

<div
style={{
color: "#777",
fontSize: "11px",
marginBottom: "6px"
}}
>
DIRECTION
</div>

<div
style={{
color: directionColor(sizing?.direction),
fontWeight: "bold",
fontSize: "18px"
}}
>
{sizing?.direction}
</div>

</div>

{/* MAX SIZE */}

<div
style={{
border: "1px solid #222",
padding: "12px",
background: "#111"
}}
>

<div
style={{
color: "#777",
fontSize: "11px",
marginBottom: "6px"
}}
>
EDGE MAX SIZE
</div>

<div
style={{
color: "#40a9ff",
fontWeight: "bold",
fontSize: "18px"
}}
>
{maxSize}%
</div>

</div>

</div>

{/* ======================================================
SIZING LOGIC
====================================================== */}

<div
style={{
border: "1px solid #222",
background: "#111",
padding: "14px",
marginBottom: "14px"
}}
>

<div
style={{
color: "#999",
fontWeight: "bold",
marginBottom: "10px"
}}
>
SIZING BREAKDOWN
</div>

<div
style={{
display: "flex",
justifyContent: "space-between",
marginBottom: "6px",
color: "#aaa"
}}
>
<span>Edge-Based Max Size</span>
<span>{maxSize}%</span>
</div>

<div
style={{
display: "flex",
justifyContent: "space-between",
marginBottom: "6px",
color: "#aaa"
}}
>
<span>Risk Adjusted</span>
<span>{adjustedSize}%</span>
</div>

<div
style={{
display: "flex",
justifyContent: "space-between",
color: "#aaa"
}}
>
<span>Trade Strength</span>
<span>{meta?.tradeStrength ?? 0}</span>
</div>

</div>

{/* ======================================================
META
====================================================== */}

<div
style={{
fontSize: "11px",
color: "#666",
display: "flex",
justifyContent: "space-between"
}}
>

<div>
Risk:{" "}
<span style={{ color: "#aaa" }}>
{meta?.riskState ?? "N/A"}
</span>
</div>

<div>
Danger:{" "}
<span style={{ color: "#aaa" }}>
{meta?.dangerLevel ?? "N/A"}
</span>
</div>

<div>
Master:{" "}
<span style={{ color: "#aaa" }}>
{meta?.masterMode ?? "N/A"}
</span>
</div>

</div>

</div>
);
}
