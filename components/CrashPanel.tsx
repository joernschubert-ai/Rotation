// /components/CrashPanel.tsx

"use client";

/* =====================================================
TYPES
===================================================== */

type Props = {
crash: any;
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

if (!Number.isFinite(n)) {
return fallback;
}

return decimals > 0
? n.toFixed(decimals)
: String(Math.round(n));
}

function clamp(
value: number,
min = 0,
max = 100
): number {
return Math.max(
min,
Math.min(max, value)
);
}

/* =====================================================
COLORS
===================================================== */

function sensitiveCrashColor(
value: number
) {
/*
CRASH SCALE

0–20 = LOW
21–35 = CAUTION
36–64 = ELEVATED
65+ = HIGH
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

function structuralColor(
value: number
) {
if (value >= 75) {
return "#ff4d4f";
}

if (value >= 45) {
return "#fa8c16";
}

if (value >= 25) {
return "#faad14";
}

return "#52c41a";
}

function stateColor(
state: string
) {
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
return "#fa8c16";
}

return "#52c41a";
}

function eventColor(
eventType: string
) {
switch (eventType) {
case "PANIC_CAPITULATION":
return "#ff4d4f";

case "LIQUIDATION_EVENT":
return "#ff7875";

case "VOL_CRASH":
return "#fa541c";

case "CREDIT_EVENT":
return "#722ed1";

case "ORDERLY_RESET":
return "#faad14";

default:
return "#777";
}
}

/* =====================================================
BAR
===================================================== */

function ProgressBar({
value,
color
}: {
value: number;
color?: string;
}) {
const pct =
clamp(value);

return (
<div
style={{
width: "100%",
height: "6px",
background: "#202020",
overflow: "hidden",
borderRadius: "4px"
}}
>
<div
style={{
width: `${pct}%`,
height: "100%",
background:
color ??
sensitiveCrashColor(pct),

borderRadius: "4px",
transition:
"width 0.25s ease"
}}
/>
</div>
);
}

/* =====================================================
GAUGE
===================================================== */

function Gauge({
value
}: {
value: number;
}) {
const safeValue =
clamp(value);

/*
0–100 mapped to:

-90deg → +90deg

*/

const rotation =
-90 +
(safeValue / 100) * 180;

return (
<div
style={{
position: "relative",
width: "min(180px, 100%)",
height: "90px",
margin:
"0 auto 12px auto",
overflow: "hidden"
}}
>
{/* ARC */}

<div
style={{
position: "absolute",

width: "180px",
height: "180px",

left: "50%",
top: "0",

transform:
"translateX(-50%)",

borderRadius: "50%",

background:
"conic-gradient(from 270deg, #52c41a 0deg, #faad14 60deg, #fa8c16 120deg, #ff4d4f 180deg, transparent 180deg)"
}}
/>

{/* INNER CUTOUT */}

<div
style={{
position: "absolute",

width: "150px",
height: "150px",

left: "50%",
top: "15px",

transform:
"translateX(-50%)",

borderRadius: "50%",

background: "#0d0d0d"
}}
/>

{/* NEEDLE */}

<div
style={{
position: "absolute",

bottom: "0",
left: "50%",

width: "2px",
height: "72px",

background: "#f5f5f5",

transform:
`rotate(${rotation}deg)`,

transformOrigin:
"bottom center",

transition:
"transform 0.3s ease"
}}
/>

{/* CENTER */}

<div
style={{
position: "absolute",

bottom: "-3px",
left: "50%",

transform:
"translateX(-50%)",

width: "10px",
height: "10px",

borderRadius: "50%",

background: "#fff"
}}
/>
</div>
);
}

/* =====================================================
RISK CARD
===================================================== */

function RiskCard({
title,
state,
score,
description,
color
}: {
title: string;
state: string;
score: number;
description: string;
color?: string;
}) {
const resolvedColor =
color ??
stateColor(state);

return (
<div
style={{
border:
`1px solid ${resolvedColor}33`,

background: "#121212",

padding:
"clamp(10px, 2vw, 12px)",

minWidth: 0
}}
>
<div
style={{
color: "#666",
fontSize: "8px",
marginBottom: "6px"
}}
>
{title}
</div>

<div
style={{
display: "flex",

justifyContent:
"space-between",

alignItems: "center",

gap: "8px",

flexWrap: "wrap"
}}
>
<div
style={{
color:
resolvedColor,

fontSize: "14px",
fontWeight: "bold"
}}
>
{state}
</div>

<div
style={{
color:
resolvedColor,

fontSize: "20px",
fontWeight: "bold"
}}
>
{score}
</div>
</div>

<div
style={{
marginTop: "9px"
}}
>
<ProgressBar
value={score}
color={resolvedColor}
/>
</div>

<div
style={{
color: "#666",

fontSize: "8px",

lineHeight: 1.45,

marginTop: "8px"
}}
>
{description}
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
suffix = "",
color
}: {
label: string;
value: any;
suffix?: string;
color?: string;
}) {
const missing =
value === null ||
value === undefined ||
!Number.isFinite(
Number(value)
);

const numeric =
num(value);

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
color:
missing
? "#555"
: color ??
sensitiveCrashColor(
numeric
),

fontSize: "16px",

fontWeight: "bold",

marginTop: "4px"
}}
>
{displayNumber(value)}
{!missing && suffix}
</div>
</div>
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
color: "#888",

fontSize: "9px",

fontWeight: "bold",

marginBottom: "8px",

letterSpacing: "0.04em"
}}
>
{children}
</div>
);
}

/* =====================================================
COLLAPSIBLE
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
borderTop:
"1px solid #1c1c1c",

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

justifyContent:
"space-between",

alignItems: "center",

gap: "10px"
}}
>
<div>
<div
style={{
color: "#888",

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
fontSize: "8px"
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
MAIN COMPONENT
===================================================== */

export default function CrashPanel({
crash
}: Props) {
if (!crash) {
return null;
}

/* ===================================================
DATA
=================================================== */

const score =
num(crash?.score);

const probability =
num(crash?.probability);

const momentum =
num(crash?.momentum);

const eventType =
crash?.eventType ??
"ORDERLY_RESET";

const label =
crash?.label ??
"LOW";

const summary =
crash?.summary ??
"No crash summary available";


/* ===================================================
STRUCTURE
=================================================== */

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


/* ===================================================
COMPONENTS
=================================================== */

const components =
crash?.components ?? {};

const structuralComponent =
components?.structural ?? {};

const triggerComponent =
components?.trigger ?? {};

const panicComponent =
components?.panic ?? {};

const highLow =
components?.highLow ?? {
value: 0,
max: 25,
strength: 0
};


/* ===================================================
MARKET INTERPRETATION
=================================================== */

const structuralScore =
num(structural?.score);

const triggerScore =
num(trigger?.score);

const panicScore =
num(panic?.score);


let marketState =
"STABLE";

let marketStateColor =
"#52c41a";

let marketStateText =
"No significant structural or acute crash stress.";


/*
IMPORTANT:

STRUCTURAL RISK
≠
ACUTE CRASH

*/

if (
structuralScore >= 75 &&
triggerScore < 40 &&
panicScore < 40
) {
marketState =
"STRUCTURAL DANGER";

marketStateColor =
"#fa8c16";

marketStateText =
"Market structure is severely damaged, but an acute crash trigger is not yet confirmed.";
}

else if (
structuralScore >= 45 &&
triggerScore < 40
) {
marketState =
"FRAGILE MARKET";

marketStateColor =
"#faad14";

marketStateText =
"Structural weakness is elevated. Monitor liquidity and trigger acceleration.";
}

else if (
triggerScore >= 40 &&
panicScore < 40
) {
marketState =
"CRASH RISK BUILDING";

marketStateColor =
"#fa8c16";

marketStateText =
"Acute trigger conditions are developing. Downside acceleration risk is increasing.";
}

else if (
panicScore >= 40
) {
marketState =
"ACTIVE STRESS";

marketStateColor =
"#ff4d4f";

marketStateText =
"Market stress is active. Volatility and panic conditions require defensive risk management.";
}

else if (
score >= 21
) {
marketState =
"EARLY WARNING";

marketStateColor =
"#faad14";

marketStateText =
"Early risk conditions are present, but no confirmed crash regime.";
}


/* ===================================================
RENDER
=================================================== */

return (
<div
style={{
background: "#0d0d0d",

border: "1px solid #222",

padding:
"clamp(10px, 2vw, 16px)",

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

justifyContent:
"space-between",

alignItems: "center",

gap: "10px",

flexWrap: "wrap",

marginBottom: "14px"
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
CRASH ENGINE
</div>

<div
style={{
color: "#555",

fontSize: "8px",

marginTop: "3px"
}}
>
STRUCTURAL + TRIGGER + PANIC MODEL
</div>
</div>

<div
style={{
border:
`1px solid ${marketStateColor}`,

color:
marketStateColor,

padding: "4px 7px",

fontSize: "8px",

fontWeight: "bold"
}}
>
{marketState}
</div>
</div>


{/* ===============================================
HERO
=============================================== */}

<div
style={{
border: "1px solid #252525",

background: "#111",

padding:
"clamp(12px, 2vw, 16px)",

marginBottom: "14px"
}}
>

<Gauge
value={score}
/>

<div
style={{
textAlign: "center"
}}
>
<div
style={{
color:
sensitiveCrashColor(
score
),

fontSize:
"clamp(28px, 6vw, 36px)",

fontWeight: "bold"
}}
>
{score}
</div>

<div
style={{
color: "#555",

fontSize: "8px",

marginTop: "2px"
}}
>
CRASH SCORE / 100
</div>
</div>


{/* HERO METRICS */}

<div
style={{
display: "grid",

gridTemplateColumns:
"repeat(auto-fit, minmax(110px, 1fr))",

gap: "8px",

marginTop: "14px"
}}
>

<MetricCard
label="CRASH PROBABILITY"
value={probability}
suffix="%"
color={
sensitiveCrashColor(
probability
)
}
/>

<MetricCard
label="MOMENTUM"
value={momentum}
color={
momentum >= 15
? "#fa8c16"
: "#777"
}
/>

<MetricCard
label="STRUCTURAL LABEL"
value={
label === "HIGH"
? 100
: label === "ELEVATED"
? 60
: 20
}
color={
stateColor(label)
}
/>

</div>

</div>


{/* ===============================================
MARKET STATE
=============================================== */}

<div
style={{
border:
`1px solid ${marketStateColor}33`,

background: "#111",

padding: "11px",

marginBottom: "14px"
}}
>
<div
style={{
color: "#555",
fontSize: "7px"
}}
>
CURRENT MARKET INTERPRETATION
</div>

<div
style={{
color:
marketStateColor,

fontSize: "14px",

fontWeight: "bold",

marginTop: "5px"
}}
>
{marketState}
</div>

<div
style={{
color: "#888",

fontSize: "9px",

lineHeight: 1.5,

marginTop: "6px"
}}
>
{marketStateText}
</div>
</div>


{/* ===============================================
THREE LAYER MODEL
=============================================== */}

<SectionTitle>
THREE-LAYER RISK MODEL
</SectionTitle>

<div
style={{
display: "grid",

gridTemplateColumns:
"repeat(auto-fit, minmax(210px, 1fr))",

gap: "9px",

marginBottom: "14px"
}}
>

<RiskCard
title="STRUCTURAL FRAGILITY"
state={
structural?.state ??
"LOW"
}
score={
structuralScore
}
color={
structuralColor(
structuralScore
)
}
description={
"Longer-term market vulnerability, breadth deterioration, participation weakness and structural instability."
}
/>

<RiskCard
title="CRASH TRIGGER"
state={
trigger?.state ??
"LOW"
}
score={
triggerScore
}
description={
"Acute catalyst layer: liquidity vacuum, volatility, credit stress, gamma and trigger acceleration."
}
/>

<RiskCard
title="PANIC STATE"
state={
panic?.state ??
"CALM"
}
score={
panicScore
}
description={
"Active market stress and capitulation conditions. High values indicate an already accelerating event."
}
/>

</div>


{/* ===============================================
EVENT TYPE
=============================================== */}

<SectionTitle>
EVENT PROFILE
</SectionTitle>

<div
style={{
display: "grid",

gridTemplateColumns:
"repeat(auto-fit, minmax(160px, 1fr))",

gap: "8px",

marginBottom: "14px"
}}
>

<div
style={{
border: "1px solid #222",

background: "#101010",

padding: "10px",

minWidth: 0
}}
>
<div
style={{
color: "#555",
fontSize: "7px"
}}
>
EVENT TYPE
</div>

<div
style={{
color:
eventColor(
eventType
),

fontSize: "12px",

fontWeight: "bold",

marginTop: "5px",

overflowWrap:
"anywhere"
}}
>
{eventType}
</div>
</div>


<div
style={{
border: "1px solid #222",

background: "#101010",

padding: "10px"
}}
>
<div
style={{
color: "#555",
fontSize: "7px"
}}
>
ENGINE STATUS
</div>

<div
style={{
color:
sensitiveCrashColor(
score
),

fontSize: "12px",

fontWeight: "bold",

marginTop: "5px"
}}
>
{score >= 65
? "HIGH RISK"
: score >= 36
? "ELEVATED"
: score >= 21
? "EARLY RISK"
: "LOW ACUTE RISK"}
</div>
</div>

</div>


{/* ===============================================
HIGH / LOW STRUCTURE
=============================================== */}

<SectionTitle>
HIGH / LOW STRUCTURE
</SectionTitle>

<div
style={{
border: "1px solid #222",

background: "#101010",

padding: "11px",

marginBottom: "14px"
}}
>

<div
style={{
display: "flex",

justifyContent:
"space-between",

alignItems: "center",

gap: "10px",

flexWrap: "wrap"
}}
>

<div>

<div
style={{
color: "#555",
fontSize: "8px"
}}
>
HIGH / LOW DAMAGE SCORE
</div>

<div
style={{
color:
sensitiveCrashColor(
(
Math.abs(
num(highLow?.value)
) /
Math.max(
1,
num(
highLow?.max,
25
)
)
) * 100
),

fontSize: "22px",

fontWeight: "bold",

marginTop: "4px"
}}
>
{displayNumber(
highLow?.value
)}
/
{displayNumber(
highLow?.max,
0,
"25"
)}
</div>

</div>


<div
style={{
textAlign: "right"
}}
>

<div
style={{
color: "#555",
fontSize: "7px"
}}
>
HIGH–LOW DELTA
</div>

<div
style={{
color:
num(
highLow?.strength
) < 0
? "#fa8c16"
: "#52c41a",

fontSize: "16px",

fontWeight: "bold",

marginTop: "4px"
}}
>
{displayNumber(
highLow?.strength
)}
</div>

</div>

</div>


<div
style={{
marginTop: "10px"
}}
>
<ProgressBar
value={
(
Math.abs(
num(
highLow?.value
)
) /
Math.max(
1,
num(
highLow?.max,
25
)
)
) * 100
}
/>
</div>

</div>


{/* ===============================================
DETAILS
=============================================== */}

<CollapsibleSection
title="ENGINE COMPONENTS"
subtitle="Underlying weighted crash model"
>

<div
style={{
display: "grid",

gridTemplateColumns:
"repeat(auto-fit, minmax(110px, 1fr))",

gap: "7px"
}}
>

<MetricCard
label="STRUCTURAL"
value={
structuralComponent?.value
}
color={
structuralColor(
num(
structuralComponent?.value
)
)
}
/>

<MetricCard
label="TRIGGER"
value={
triggerComponent?.value
}
/>

<MetricCard
label="PANIC"
value={
panicComponent?.value
}
/>

</div>

</CollapsibleSection>


<CollapsibleSection
title="MODEL LOGIC"
subtitle="How the crash engine should be interpreted"
>

<div
style={{
color: "#777",

fontSize: "9px",

lineHeight: 1.6
}}
>

<div>
<strong
style={{
color: "#aaa"
}}
>
STRUCTURAL FRAGILITY:
</strong>
{" "}
Measures how vulnerable the market is before an actual crash begins.
</div>

<div
style={{
marginTop: "6px"
}}
>
<strong
style={{
color: "#aaa"
}}
>
CRASH TRIGGER:
</strong>
{" "}
Measures whether an acute catalyst is currently capable of turning structural weakness into a rapid selloff.
</div>

<div
style={{
marginTop: "6px"
}}
>
<strong
style={{
color: "#aaa"
}}
>
PANIC:
</strong>
{" "}
Measures whether the event is already active and volatility-driven liquidation is underway.
</div>

<div
style={{
marginTop: "8px",

color: "#faad14"
}}
>
High structural fragility alone does not automatically mean an imminent crash.
</div>

</div>

</CollapsibleSection>


{/* ===============================================
SUMMARY
=============================================== */}

<div
style={{
marginTop: "12px",

padding: "11px",

background: "#111",

border: "1px solid #222"
}}
>

<div
style={{
color: "#555",

fontSize: "7px",

marginBottom: "5px"
}}
>
ENGINE SUMMARY
</div>

<div
style={{
color: "#999",

fontSize: "9px",

lineHeight: 1.55,

overflowWrap:
"anywhere"
}}
>
{summary}
</div>

</div>


{/* ===============================================
FOOTER
=============================================== */}

<div
style={{
marginTop: "12px",

paddingTop: "9px",

borderTop:
"1px solid #1c1c1c",

display: "flex",

justifyContent:
"space-between",

gap: "8px",

flexWrap: "wrap",

color: "#555",

fontSize: "7px"
}}
>

<span>
CRASH ENGINE
</span>

<span>
SCORE {score}
</span>

<span>
PROB {probability}%
</span>

<span
style={{
color:
eventColor(
eventType
)
}}
>
{eventType}
</span>

</div>

</div>
);
}
