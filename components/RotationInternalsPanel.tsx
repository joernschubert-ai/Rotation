"use client";

import { useMemo } from "react";

/* ============================================================
ROTATION INTERNALS PANEL
============================================================

AUFGABE DES PANELS

Dieses Panel zeigt die aktuelle interne Marktrotation.

WICHTIG:

Rotation = Wohin bewegt sich Kapital?
RotationConfirm = Wie gut ist diese Rotation bestätigt?
RotationDecay = Wie stark altert / verschlechtert sie sich?
Structure Flags = Gibt es Narrow Leadership / interne Schäden?

Das Panel trifft KEINE eigene Trade-Entscheidung.

============================================================ */

export default function RotationInternalsPanel({
rotation,
rotationConfirm,
rotationDecay,
structureFlags,
}: any) {
if (!rotation) return null;

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
const numeric = Number(value);

return Number.isFinite(numeric)
? numeric
: fallback;
}

function toPercent(value: number) {
return ((value - 1) * 100).toFixed(1);
}

function rsState(value: number) {
if (value > 1.02) return "positive";
if (value < 0.98) return "negative";

return "neutral";
}

function rsColor(state: string) {
if (state === "positive") {
return "#52c41a";
}

if (state === "negative") {
return "#ff4d4f";
}

return "#faad14";
}

function qualityColor(value: number) {
if (value >= 70) {
return "#52c41a";
}

if (value >= 50) {
return "#faad14";
}

if (value >= 35) {
return "#ff7875";
}

return "#ff4d4f";
}

/*
Hoher Decay = schlecht.

Deshalb eigene Farbkonvention.
*/

function decayColor(value: number) {
if (value >= 75) {
return "#ff4d4f";
}

if (value >= 60) {
return "#ff7875";
}

if (value >= 40) {
return "#faad14";
}

return "#52c41a";
}

function decayBackground(value: number) {
if (value >= 75) {
return "rgba(255,77,79,0.10)";
}

if (value >= 60) {
return "rgba(255,120,117,0.08)";
}

if (value >= 40) {
return "rgba(250,173,20,0.08)";
}

return "rgba(82,196,26,0.06)";
}

/* ==========================================================
ROTATION VALUES
========================================================== */

const smallVsTech =
safeNumber(
rotation?.rsSmall,
1
);

const growthVsValue =
safeNumber(
rotation?.rsGrowth,
1
);

const equalVsMega =
safeNumber(
rotation?.rsEqual,
1
);

const rotationScore =
clamp(
safeNumber(
rotation?.score,
50
)
);

/* ==========================================================
RELATIVE STRENGTH STATES
========================================================== */

const smallState =
rsState(smallVsTech);

const growthState =
rsState(growthVsValue);

const equalState =
rsState(equalVsMega);

/* ==========================================================
ROTATION CONFIRM
========================================================== */

const quality =
clamp(
safeNumber(
rotationConfirm?.quality,
50
)
);

const sustainability =
clamp(
safeNumber(
rotationConfirm?.sustainability,
50
)
);

const confirmParticipation =
clamp(
safeNumber(
rotationConfirm?.participation,
50
)
);

const falseBreakRisk =
clamp(
safeNumber(
rotationConfirm?.falseBreakRisk,
50
)
);

const confirmState =
rotationConfirm?.state ??
rotationConfirm?.signal ??
"NEUTRAL";

/* ==========================================================
ROTATION DECAY
========================================================== */

const decayScore =
clamp(
safeNumber(
rotationDecay?.score,
0
)
);

const decayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";

const momentumQuality =
clamp(
safeNumber(
rotationDecay?.momentumQuality,
100 - decayScore
)
);

const decayParticipation =
clamp(
safeNumber(
rotationDecay?.participationScore,
confirmParticipation
)
);

const narrowLeadershipRisk =
Boolean(
rotationDecay?.narrowLeadershipRisk ??
structureFlags?.narrowLeadership
);

const narrowLeadershipScore =
clamp(
safeNumber(
rotationDecay?.narrowLeadershipScore,
0
)
);

const breadthExhaustion =
Boolean(
rotationDecay?.breadthExhaustion
);

const institutionalDistribution =
Boolean(
rotationDecay?.institutionalDistribution
);

const rotationRecovery =
Boolean(
rotationDecay?.rotationRecovery
);

const recoveryScore =
clamp(
safeNumber(
rotationDecay?.recoveryScore,
0
)
);

const distributionRisk =
clamp(
safeNumber(
rotationDecay?.distributionRisk,
0
)
);

/* ==========================================================
STRUCTURE FLAGS
========================================================== */

const severeNarrowLeadership =
Boolean(
structureFlags?.severeNarrowLeadership
);

const megaCapDominance =
Boolean(
structureFlags?.megaCapDominance
);

const severeMegaCapDominance =
Boolean(
structureFlags?.severeMegaCapDominance
);

const equalWeightWeakness =
Boolean(
structureFlags?.equalWeightWeakness
);

const smallCapWeakness =
Boolean(
structureFlags?.smallCapWeakness
);

const weakParticipation =
Boolean(
structureFlags?.weakParticipation
);

const breadthFailure =
Boolean(
structureFlags?.breadthFailure
);

const hiddenDistribution =
Boolean(
structureFlags?.hiddenDistribution
);

const structureState =
structureFlags?.structureState ??
"BALANCED";

/* ==========================================================
DOMINANCE
========================================================== */

const dominance =
useMemo(() => {
/*
Echte Russell-Breite.

Small Caps + Equal Weight müssen
gleichzeitig gegen Mega Caps gewinnen.
*/

if (
smallVsTech > 1.02 &&
equalVsMega > 1.01
) {
return {
label: "BROAD MARKET LEADERSHIP",
subLabel:
"Russell / Equal Weight participation improving",
color: "#52c41a",
};
}

/*
NASDAQ / Mega Cap Dominance.

Wichtig:

Das ist NICHT automatisch positiv.

Es kann echte Growth Leadership sein
oder Narrow Leadership.
*/

if (
smallVsTech < 0.98 &&
equalVsMega < 0.99
) {
return {
label:
narrowLeadershipRisk
? "NARROW MEGA-CAP LEADERSHIP"
: "NASDAQ / MEGA-CAP LEADERSHIP",

subLabel:
narrowLeadershipRisk
? "Index leadership is narrowing"
: "Technology leadership dominates",

color:
narrowLeadershipRisk
? "#ff7875"
: "#ff4d4f",
};
}

return {
label: "ROTATIONAL TRANSITION",
subLabel:
"No dominant broad capital rotation",
color: "#faad14",
};
}, [
smallVsTech,
equalVsMega,
narrowLeadershipRisk,
]);

/* ==========================================================
CAPITAL CHARACTER
========================================================== */

const capitalCharacter =
useMemo(() => {
if (
growthVsValue > 1.02
) {
return {
label:
"GROWTH LEADERSHIP",
color: "#52c41a",
};
}

if (
growthVsValue < 0.98
) {
return {
label:
"DEFENSIVE / VALUE ROTATION",
color: "#ff4d4f",
};
}

return {
label:
"NEUTRAL STYLE ROTATION",
color: "#faad14",
};
}, [
growthVsValue,
]);

/* ==========================================================
FLOW
========================================================== */

/*
Kein React-Smoothing mehr.

Das alte smoothRef war problematisch,
weil das Panel dadurch eine eigene
zeitliche Interpretation erzeugt hat.

Das Panel soll aktuelle Engine-Daten
darstellen.

*/

const rawFlow =
(
(smallVsTech - 1) +
(equalVsMega - 1)
) / 2;

const clampedFlow =
Math.max(
-0.05,
Math.min(
0.05,
rawFlow
)
);

const flowPercent =
(
(clampedFlow + 0.05) /
0.10
) * 100;

let flowLabel =
"BALANCED";

let flowColor =
"#faad14";

if (
clampedFlow > 0.01
) {
flowLabel =
"BROAD MARKET FLOW";

flowColor =
"#52c41a";
}

if (
clampedFlow < -0.01
) {
flowLabel =
narrowLeadershipRisk
? "FLOW INTO NARROW LEADERSHIP"
: "FLOW INTO NASDAQ";

flowColor =
narrowLeadershipRisk
? "#ff7875"
: "#ff4d4f";
}

/* ==========================================================
ROTATION STATUS

PRIORITÄT:

1. Exhausted
2. Distribution
3. Narrow Leadership
4. Fragile
5. Recovery
6. Healthy
========================================================== */

const rotationStatus =
useMemo(() => {
if (
decayState ===
"EXHAUSTED_ROTATION"
) {
return {
label:
"ROTATION EXHAUSTED",

description:
"Internal deterioration is broadly confirmed",

color:
"#ff4d4f",
};
}

if (
decayState ===
"DISTRIBUTION_ROTATION" ||
institutionalDistribution
) {
return {
label:
"DISTRIBUTION",

description:
"Institutional distribution pressure dominates",

color:
"#ff7875",
};
}

if (
decayState ===
"NARROW_ROTATION" ||
narrowLeadershipRisk
) {
return {
label:
"NARROW LEADERSHIP",

description:
"Index performance depends on increasingly few leaders",

color:
"#faad14",
};
}

if (
decayState ===
"FRAGILE_ROTATION"
) {
return {
label:
"FRAGILE ROTATION",

description:
"Rotation requires further confirmation",

color:
"#faad14",
};
}

if (
rotationRecovery
) {
return {
label:
"RECOVERY ATTEMPT",

description:
"Internal structure is attempting to improve",

color:
"#95de64",
};
}

if (
decayState ===
"MATURE_ROTATION"
) {
return {
label:
"MATURE ROTATION",

description:
"Rotation remains intact but is losing momentum",

color:
"#faad14",
};
}

return {
label:
"HEALTHY ROTATION",

description:
"Broad participation supports market leadership",

color:
"#52c41a",
};
}, [
decayState,
institutionalDistribution,
narrowLeadershipRisk,
rotationRecovery,
]);

/* ==========================================================
INTERNAL WARNING LEVEL
========================================================== */

const warningLevel =
useMemo(() => {
let warnings = 0;

if (
narrowLeadershipRisk
) {
warnings++;
}

if (
megaCapDominance
) {
warnings++;
}

if (
equalWeightWeakness
) {
warnings++;
}

if (
smallCapWeakness
) {
warnings++;
}

if (
weakParticipation
) {
warnings++;
}

if (
breadthFailure
) {
warnings++;
}

if (
hiddenDistribution
) {
warnings += 2;
}

if (
institutionalDistribution
) {
warnings += 2;
}

if (
breadthExhaustion
) {
warnings++;
}

if (
severeNarrowLeadership
) {
warnings++;
}

if (
severeMegaCapDominance
) {
warnings++;
}

if (
warnings >= 6
) {
return {
label:
"CRITICAL INTERNAL DETERIORATION",

color:
"#ff4d4f",
};
}

if (
warnings >= 3
) {
return {
label:
"MULTIPLE INTERNAL WARNINGS",

color:
"#ff7875",
};
}

if (
warnings >= 1
) {
return {
label:
"EARLY INTERNAL WARNING",

color:
"#faad14",
};
}

return {
label:
"INTERNAL STRUCTURE STABLE",

color:
"#52c41a",
};
}, [
narrowLeadershipRisk,
megaCapDominance,
equalWeightWeakness,
smallCapWeakness,
weakParticipation,
breadthFailure,
hiddenDistribution,
institutionalDistribution,
breadthExhaustion,
severeNarrowLeadership,
severeMegaCapDominance,
]);

/* ==========================================================
COMPONENT BAR
========================================================== */

function qualityBar(
label: string,
value: number
) {
const safeValue =
clamp(value);

return (
<div
style={{
marginBottom: "14px",
}}
>
<div
style={{
display: "flex",
justifyContent:
"space-between",

fontSize: "11px",

marginBottom: "5px",
}}
>
<span
style={{
color: "#777",
}}
>
{label}
</span>

<span
style={{
color:
qualityColor(
safeValue
),

fontWeight:
"bold",
}}
>
{Math.round(safeValue)}
</span>
</div>

<div
style={{
height: "6px",

background:
"#222",

borderRadius:
"5px",

overflow:
"hidden",
}}
>
<div
style={{
width:
`${safeValue}%`,

height:
"100%",

background:
qualityColor(
safeValue
),

transition:
"all 0.35s ease",
}}
/>
</div>
</div>
);
}

function decayBar(
label: string,
value: number
) {
const safeValue =
clamp(value);

return (
<div
style={{
marginBottom: "14px",
}}
>
<div
style={{
display: "flex",
justifyContent:
"space-between",

fontSize: "11px",

marginBottom: "5px",
}}
>
<span
style={{
color: "#777",
}}
>
{label}
</span>

<span
style={{
color:
decayColor(
safeValue
),

fontWeight:
"bold",
}}
>
{Math.round(safeValue)}
</span>
</div>

<div
style={{
height: "6px",

background:
"#222",

borderRadius:
"5px",

overflow:
"hidden",
}}
>
<div
style={{
width:
`${safeValue}%`,

height:
"100%",

background:
decayColor(
safeValue
),

transition:
"all 0.35s ease",
}}
/>
</div>
</div>
);
}

/* ==========================================================
RELATIVE STRENGTH ROW
========================================================== */

function renderRow(
label: string,
value: number,
state: string
) {
return (
<div
style={{
display: "flex",

justifyContent:
"space-between",

alignItems:
"center",

marginBottom:
"11px",
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
rsColor(state),

fontWeight:
"bold",
}}
>
{toPercent(value)}%
</span>
</div>
);
}

/* ==========================================================
FLAG
========================================================== */

function Flag({
label,
active,
critical = false,
}: {
label: string;
active: boolean;
critical?: boolean;
}) {
if (!active) {
return null;
}

return (
<div
style={{
padding:
"7px 9px",

border:
critical
? "1px solid rgba(255,77,79,0.35)"
: "1px solid rgba(250,173,20,0.30)",

background:
critical
? "rgba(255,77,79,0.08)"
: "rgba(250,173,20,0.06)",

color:
critical
? "#ff7875"
: "#faad14",

fontSize:
"11px",

fontWeight:
"bold",

marginBottom:
"6px",
}}
>
{label}
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
`2px solid ${rotationStatus.color}`,

padding:
"18px",

transition:
"all 0.35s ease",
}}
>

{/* ======================================================
HEADER
====================================================== */}

<div
style={{
display:
"flex",

justifyContent:
"space-between",

alignItems:
"flex-start",

marginBottom:
"18px",
}}
>
<div>

<h3
style={{
color:
"#ddd",

margin:
"0 0 5px 0",

fontSize:
"18px",

fontWeight:
700,

letterSpacing:
"0.5px",
}}
>
ROTATION INTERNALS
</h3>

<div
style={{
fontSize:
"11px",

color:
"#666",

textTransform:
"uppercase",

letterSpacing:
"1px",
}}
>
Capital Rotation & Market Participation
</div>

</div>

<div
style={{
textAlign:
"right",
}}
>
<div
style={{
fontSize:
"30px",

fontWeight:
800,

lineHeight:
1,

color:
decayColor(
decayScore
),
}}
>
{decayScore}
</div>

<div
style={{
fontSize:
"10px",

color:
"#777",

marginTop:
"5px",
}}
>
ROTATION DECAY
</div>
</div>

</div>

{/* ======================================================
PRIMARY STATUS
====================================================== */}

<div
style={{
padding:
"14px",

marginBottom:
"18px",

background:
decayBackground(
decayScore
),

border:
`1px solid ${rotationStatus.color}`,
}}
>
<div
style={{
color:
"#777",

fontSize:
"10px",

marginBottom:
"5px",

textTransform:
"uppercase",

letterSpacing:
"1px",
}}
>
INTERNAL ROTATION STATE
</div>

<div
style={{
color:
rotationStatus.color,

fontSize:
"21px",

fontWeight:
800,

marginBottom:
"6px",
}}
>
{rotationStatus.label}
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
{rotationStatus.description}
</div>

</div>

{/* ======================================================
DOMINANCE
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
dominance.color,

fontWeight:
800,

fontSize:
"15px",

marginBottom:
"5px",
}}
>
{dominance.label}
</div>

<div
style={{
color:
"#777",

fontSize:
"11px",
}}
>
{dominance.subLabel}
</div>

</div>

{/* ======================================================
CAPITAL CHARACTER
====================================================== */}

<div
style={{
marginBottom:
"18px",

color:
capitalCharacter.color,

fontSize:
"12px",

fontWeight:
"bold",
}}
>
{capitalCharacter.label}
</div>

{/* ======================================================
CAPITAL FLOW
====================================================== */}

<div
style={{
marginBottom:
"20px",
}}
>
<div
style={{
display:
"flex",

justifyContent:
"space-between",

fontSize:
"11px",

color:
"#666",
}}
>
<span>
NASDAQ / MEGA CAP
</span>

<span>
BROAD MARKET
</span>
</div>

<div
style={{
position:
"relative",

height:
"7px",

background:
"#222",

marginTop:
"6px",

borderRadius:
"6px",
}}
>
<div
style={{
position:
"absolute",

left:
"50%",

top:
0,

height:
"100%",

width:
"1px",

background:
"#555",
}}
/>

<div
style={{
position:
"absolute",

left:
`${flowPercent}%`,

transform:
"translateX(-50%)",

width:
"12px",

height:
"12px",

background:
flowColor,

borderRadius:
"50%",

top:
"-3px",

transition:
"all 0.35s ease",
}}
/>

</div>

<div
style={{
textAlign:
"center",

marginTop:
"8px",

fontSize:
"11px",

color:
flowColor,

fontWeight:
"bold",
}}
>
{flowLabel}
</div>

</div>

{/* ======================================================
RELATIVE STRENGTH
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
"12px",

textTransform:
"uppercase",

letterSpacing:
"1px",
}}
>
Relative Leadership
</div>

{renderRow(
"Small vs Tech",
smallVsTech,
smallState
)}

{renderRow(
"Growth vs Value",
growthVsValue,
growthState
)}

{renderRow(
"Equal vs Mega",
equalVsMega,
equalState
)}

</div>

{/* ======================================================
ROTATION QUALITY
====================================================== */}

<div
style={{
borderTop:
"1px solid #222",

paddingTop:
"16px",

marginBottom:
"10px",
}}
>

<div
style={{
color:
"#666",

fontSize:
"10px",

marginBottom:
"14px",

textTransform:
"uppercase",

letterSpacing:
"1px",
}}
>
Rotation Confirmation
</div>

{qualityBar(
"QUALITY",
quality
)}

{qualityBar(
"SUSTAINABILITY",
sustainability
)}

{qualityBar(
"PARTICIPATION",
confirmParticipation
)}

</div>

{/* ======================================================
ROTATION DECAY
====================================================== */}

<div
style={{
borderTop:
"1px solid #222",

paddingTop:
"16px",

marginTop:
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
"14px",

textTransform:
"uppercase",

letterSpacing:
"1px",
}}
>
Structural Rotation Health
</div>

{qualityBar(
"MOMENTUM QUALITY",
momentumQuality
)}

{qualityBar(
"ENGINE PARTICIPATION",
decayParticipation
)}

{decayBar(
"ROTATION DECAY",
decayScore
)}

{decayBar(
"NARROW LEADERSHIP RISK",
narrowLeadershipScore
)}

{decayBar(
"DISTRIBUTION RISK",
distributionRisk
)}

</div>

{/* ======================================================
FALSE BREAK
====================================================== */}

<div
style={{
marginTop:
"18px",

paddingTop:
"16px",

borderTop:
"1px solid #222",
}}
>

<div
style={{
display:
"flex",

justifyContent:
"space-between",

marginBottom:
"6px",
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
False Break Risk
</span>

<span
style={{
color:
decayColor(
falseBreakRisk
),

fontWeight:
"bold",
}}
>
{falseBreakRisk}
</span>

</div>

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
}}
>
<div
style={{
width:
`${falseBreakRisk}%`,

height:
"100%",

background:
decayColor(
falseBreakRisk
),

transition:
"all 0.35s ease",
}}
/>
</div>

</div>

{/* ======================================================
INTERNAL FLAGS
====================================================== */}

<div
style={{
marginTop:
"22px",

paddingTop:
"16px",

borderTop:
"1px solid #222",
}}
>

<div
style={{
color:
"#666",

fontSize:
"10px",

marginBottom:
"12px",

textTransform:
"uppercase",

letterSpacing:
"1px",
}}
>
Internal Structure Flags
</div>

<Flag
label="NARROW LEADERSHIP"
active={
narrowLeadershipRisk
}
/>

<Flag
label="SEVERE NARROW LEADERSHIP"
active={
severeNarrowLeadership
}
critical
/>

<Flag
label="MEGA-CAP DOMINANCE"
active={
megaCapDominance
}
/>

<Flag
label="SEVERE MEGA-CAP DOMINANCE"
active={
severeMegaCapDominance
}
critical
/>

<Flag
label="EQUAL WEIGHT WEAKNESS"
active={
equalWeightWeakness
}
/>

<Flag
label="SMALL CAP WEAKNESS"
active={
smallCapWeakness
}
/>

<Flag
label="WEAK PARTICIPATION"
active={
weakParticipation
}
/>

<Flag
label="BREADTH FAILURE"
active={
breadthFailure
}
critical
/>

<Flag
label="HIDDEN DISTRIBUTION"
active={
hiddenDistribution
}
critical
/>

<Flag
label="INSTITUTIONAL DISTRIBUTION"
active={
institutionalDistribution
}
critical
/>

<Flag
label="BREADTH EXHAUSTION"
active={
breadthExhaustion
}
critical
/>

<Flag
label="ROTATION RECOVERY ATTEMPT"
active={
rotationRecovery
}
/>

{!narrowLeadershipRisk &&
!megaCapDominance &&
!equalWeightWeakness &&
!smallCapWeakness &&
!weakParticipation &&
!breadthFailure &&
!hiddenDistribution &&
!institutionalDistribution &&
!breadthExhaustion && (

<div
style={{
padding:
"10px",

border:
"1px solid rgba(82,196,26,0.25)",

background:
"rgba(82,196,26,0.05)",

color:
"#52c41a",

fontSize:
"11px",

fontWeight:
"bold",
}}
>
NO MAJOR INTERNAL STRUCTURAL FAILURE
</div>

)}

</div>

{/* ======================================================
FINAL STRUCTURE STATE
====================================================== */}

<div
style={{
marginTop:
"20px",

padding:
"12px",

background:
decayBackground(
decayScore
),

border:
`1px solid ${warningLevel.color}`,
}}
>

<div
style={{
display:
"flex",

justifyContent:
"space-between",

alignItems:
"center",

marginBottom:
"6px",
}}
>
<span
style={{
color:
"#777",

fontSize:
"10px",
}}
>
MARKET STRUCTURE
</span>

<span
style={{
color:
warningLevel.color,

fontWeight:
"bold",

fontSize:
"11px",
}}
>
{structureState}
</span>
</div>

<div
style={{
color:
warningLevel.color,

fontWeight:
800,

fontSize:
"12px",
}}
>
{warningLevel.label}
</div>

{rotationRecovery && (
<div
style={{
marginTop:
"7px",

color:
"#95de64",

fontSize:
"11px",
}}
>
Recovery Score:{" "}
{Math.round(
recoveryScore
)}
</div>
)}

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
Rotation direction and rotation quality are displayed
separately. Structural deterioration is sourced from the
Rotation Decay Engine and does not independently create
a trade signal.

</div>

</div>
);
}
