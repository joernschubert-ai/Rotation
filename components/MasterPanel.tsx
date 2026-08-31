"use client";

import type { CSSProperties } from "react";

export default function MasterPanel({
master,
decision,
signal,
nasdaq
}: any) {

if (!master) return null;

/* =====================================================
MASTER SCORE SEMANTICS

0 = CALL / CONSTRUCTIVE
50 = NEUTRAL / TRANSITION
100 = PUT / DEFENSIVE

IMPORTANT:
The engine already returns RISK-oriented values.
The panel MUST NOT invert them again.
===================================================== */

const score = Number(master.score ?? 0);

const signalFromMaster =
master.signal ??
signal?.type ??
"NO SIGNAL";

const masterColor =
master.color ??
(
score >= 65
? "RED"
: score >= 36
? "YELLOW"
: "GREEN"
);

/* =====================================================
COLOR SYSTEM
===================================================== */

const COLORS = {
green: "#52c41a",
greenSoft: "#95de64",

yellow: "#fadb14",
yellowSoft: "#ffe58f",

orange: "#fa8c16",
orangeSoft: "#ffc069",

red: "#ff4d4f",
redSoft: "#ff7875",

blue: "#40a9ff",

text: "#ddd",
textMuted: "#888",
textDim: "#666",

background: "#0d0d0d",
backgroundCard: "#141414",
backgroundStrong: "#111",
border: "#242424",
borderSoft: "#1d1d1d"
};

/* =====================================================
MASTER SCORE COLOR
===================================================== */

function getScoreColor(value: number) {

if (value >= 65) {
return COLORS.red;
}

if (value >= 36) {
return COLORS.yellow;
}

return COLORS.green;
}

/* =====================================================
MASTER SCORE LABEL
===================================================== */

function getScoreLabel(value: number) {

if (value <= 35) {
return "CALL / CONSTRUCTIVE";
}

if (value <= 64) {
return "NEUTRAL / TRANSITION";
}

return "PUT / DEFENSIVE";
}

/* =====================================================
MASTER SCORE DESCRIPTION
===================================================== */

function getScoreDescription(value: number) {

if (value <= 35) {
return "Constructive market structure";
}

if (value <= 64) {
return "No clear directional edge";
}

return "Defensive market structure";
}

/* =====================================================
MODE COLOR
===================================================== */

function getModeColor(mode: string) {

if (mode === "LONG") {
return COLORS.green;
}

if (mode === "RISK") {
return COLORS.orange;
}

if (mode === "CRASH") {
return COLORS.red;
}

return COLORS.textMuted;
}

/* =====================================================
REGIME COLOR
===================================================== */

function getRegimeColor(regime: string) {

if (regime === "CRASH") {
return COLORS.red;
}

if (regime === "RISK") {
return COLORS.orange;
}

if (regime === "TRANSITION") {
return COLORS.yellow;
}

if (regime === "LONG") {
return COLORS.green;
}

return COLORS.textMuted;
}

/* =====================================================
EXPOSURE COLOR
===================================================== */

function getExposureColor(exp: number) {

if (exp <= -70) {
return COLORS.red;
}

if (exp <= -40) {
return COLORS.orange;
}

if (exp <= -10) {
return COLORS.yellow;
}

if (exp > 0) {
return COLORS.green;
}

return COLORS.textMuted;
}

/* =====================================================
RISK COMPONENT COLOR

ALL MASTER COMPONENTS:

LOW = CONSTRUCTIVE
HIGH = RISK
===================================================== */

function getRiskColor(value: number) {

if (value >= 75) {
return COLORS.red;
}

if (value >= 65) {
return COLORS.orange;
}

if (value >= 35) {
return COLORS.yellow;
}

return COLORS.green;
}

/* =====================================================
COMPONENT BAR
===================================================== */

function bar(value: number) {

const safeValue = Math.max(
0,
Math.min(
100,
Number(value) || 0
)
);

return {
width: `${safeValue}%`,
height: "6px",
background: getRiskColor(safeValue),
borderRadius: "3px",
transition: "width 0.25s ease"
};
}

/* =====================================================
SIGNAL COLOR
===================================================== */

function getSignalColor(type: string) {

if (!type) {
return COLORS.textMuted;
}

const normalized =
String(type).toUpperCase();

if (
normalized.includes("PUT") ||
normalized.includes("SHORT") ||
normalized.includes("RISK")
) {
return COLORS.red;
}

if (
normalized.includes("CALL") ||
normalized.includes("LONG") ||
normalized.includes("RUSSELL")
) {
return COLORS.green;
}

if (
normalized.includes("BUILD") ||
normalized.includes("WAIT") ||
normalized.includes("SETUP")
) {
return COLORS.yellow;
}

return COLORS.textMuted;
}

/* =====================================================
SIGNAL TEXT
===================================================== */

function getSignalText() {

const type =
String(signalFromMaster)
.toUpperCase();

if (
type === "STRONG_PUT"
) {
return "ADD PUTS AGGRESSIVELY";
}

if (
type === "PUT_BUILD"
) {
return "BUILD PUT POSITION";
}

if (
type === "LONG_RUSSELL"
) {
return "ROTATE INTO RUSSELL";
}

if (
type === "REDUCE"
) {
return "REDUCE EXPOSURE";
}

if (
type === "SHORT_SETUP"
) {
return "SHORT SETUP";
}

if (
type === "NO_SIGNAL"
) {
return "NO SIGNAL";
}

return type
.replaceAll("_", " ");
}

/* =====================================================
DECISION
===================================================== */

const globalDecision =
decision?.finalAction ??
"WAIT";

const globalDirection =
decision?.direction ??
"NEUTRAL";

function getDecisionColor(
action: string
) {

const normalized =
String(action)
.toUpperCase();

if (
normalized.includes("PUT") ||
normalized.includes("SHORT")
) {
return COLORS.red;
}

if (
normalized.includes("RUSSELL") ||
normalized.includes("LONG")
) {
return COLORS.green;
}

if (
normalized.includes("WAIT")
) {
return COLORS.yellow;
}

return COLORS.textMuted;
}

/* =====================================================
EXECUTION
===================================================== */

function getExecution() {

if (!decision) {
return "NO DATA";
}

const action =
String(globalDecision)
.toUpperCase();

if (
action.includes("MAX")
) {
return "FULL POSITION";
}

if (
action.includes("AGGRESSIVE")
) {
return "ADD FAST";
}

if (
action.includes("BUILD")
) {
return "SCALE IN";
}

if (
action.includes("ENTER")
) {
return "INITIATE";
}

if (
action.includes("WAIT")
) {
return "HOLD / WAIT";
}

return "MANAGE";
}

/* =====================================================
MASTER SUMMARY

Engine summary is the primary source.
===================================================== */

const masterSummary =
master.summary ??
"No summary available";

function getSummaryColor() {

if (master.signal === "PUT") {
return COLORS.red;
}

if (master.signal === "CALL") {
return COLORS.green;
}

if (master.mode === "RISK") {
return COLORS.orange;
}

return COLORS.yellow;
}

/* =====================================================
NASDAQ
===================================================== */

function getNasdaqColor() {

if (!nasdaq?.active) {
return COLORS.textDim;
}

if (
nasdaq.mode === "MOMENTUM_LONG"
) {
return COLORS.blue;
}

if (
nasdaq.mode === "TACTICAL_LONG"
) {
return COLORS.blue;
}

if (
nasdaq.mode === "PULLBACK_LONG"
) {
return COLORS.blue;
}

return COLORS.textMuted;
}

function getNasdaqText() {

if (!nasdaq?.active) {
return "NASDAQ OFF";
}

if (
nasdaq.mode === "MOMENTUM_LONG"
) {
return "MOMENTUM LONG";
}

if (
nasdaq.mode === "TACTICAL_LONG"
) {
return "TACTICAL LONG";
}

if (
nasdaq.mode === "PULLBACK_LONG"
) {
return "PULLBACK LONG";
}

return String(
nasdaq.mode ??
"ACTIVE"
).replaceAll("_", " ");
}

/* =====================================================
COMPONENTS
===================================================== */

const components =
master.components ?? {};

const crash =
Number(
components.crash ?? 0
);

const rotation =
Number(
components.rotation ?? 0
);

const priceMomentum =
Number(
components.priceMomentum ?? 0
);

const timing =
Number(
components.timing ?? 0
);

const russell =
Number(
components.russell ?? 0
);

const participation =
Number(
components.participation ?? 0
);

const breadthThrust =
Number(
components.breadthThrust ?? 0
);

const breadthVelocity =
Number(
components.breadthVelocity ?? 0
);

const rotationDecay =
Number(
components.rotationDecay ?? 0
);

const liquidity =
Number(
components.liquidity ?? 0
);

const marketQuality =
Number(
components.marketQuality ?? 0
);

const fragility =
Number(
components.fragility ?? 0
);

const regimeSync =
Number(
components.regimeSync ?? 0
);

const dangerZone =
Number(
components.dangerZone ?? 0
);

const regimePersistence =
Number(
components.regimePersistence ?? 0
);

const distributionRisk =
Number(
components.distributionRisk ?? 0
);

const falseRecoveryRisk =
Number(
components.falseRecoveryRisk ?? 0
);

const marketFatigue =
Number(
components.marketFatigue ?? 0
);

/* =====================================================
META
===================================================== */

const meta =
master.meta ?? {};

/* =====================================================
STRUCTURAL FLAGS
===================================================== */

const weakInternals =
Boolean(
meta.weakInternals
);

const narrowLeadership =
Boolean(
meta.narrowLeadership
);

const defensiveEvidenceCount =
Number(
meta.defensiveEvidenceCount ?? 0
);

const defensiveStructuralConfirmation =
Boolean(
meta.defensiveStructuralConfirmation
);

const strongDefensiveStructure =
Boolean(
meta.strongDefensiveStructure
);

/* =====================================================
PHASE
===================================================== */

const phase =
meta.phase ??
"UNKNOWN";

const phaseConfidence =
Number(
meta.phaseConfidence ?? 0
);

const phaseConfirmed =
Boolean(
meta.phaseConfirmed
);

/* =====================================================
QUALITY / RISK
===================================================== */

const currentQuality =
Number(
meta.currentQuality ?? 0
);

const structuralQuality =
Number(
meta.structuralQuality ?? 0
);

const historicalQuality =
Number(
meta.historicalQuality ?? 0
);

const crashRisk =
Number(
meta.crashRisk ?? crash
);

const timingRisk =
Number(
meta.timingRisk ?? timing
);

const russellRisk =
Number(
meta.russellRisk ?? russell
);

/* =====================================================
RESPONSIVE STYLES
===================================================== */

const panelStyle: CSSProperties = {
background: COLORS.background,
border: `1px solid ${COLORS.border}`,
padding: "clamp(12px, 2vw, 18px)",
color: COLORS.text,
width: "100%",
minWidth: 0,
boxSizing: "border-box",
overflow: "hidden",
borderRadius: "4px"
};

const headerStyle: CSSProperties = {
display: "flex",
flexWrap: "wrap",
alignItems: "center",
justifyContent: "space-between",
gap: "8px",
marginBottom: "14px"
};

const gridStyle: CSSProperties = {
display: "grid",
gridTemplateColumns:
"repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
gap: "10px",
width: "100%"
};

const cardStyle: CSSProperties = {
background: COLORS.backgroundCard,
border: `1px solid ${COLORS.border}`,
padding: "10px",
minWidth: 0,
boxSizing: "border-box",
borderRadius: "3px"
};

const labelStyle: CSSProperties = {
color: COLORS.textMuted,
fontSize: "10px",
textTransform: "uppercase",
letterSpacing: "0.05em",
marginBottom: "5px",
lineHeight: 1.2
};

const valueStyle: CSSProperties = {
fontSize: "15px",
fontWeight: "bold",
lineHeight: 1.25,
overflowWrap: "anywhere"
};

const progressBackgroundStyle: CSSProperties = {
background: "#222",
marginTop: "6px",
borderRadius: "3px",
overflow: "hidden"
};

/* =====================================================
RENDER
===================================================== */

return (

<div style={panelStyle}>

{/* =================================================
HEADER
================================================= */}

<div style={headerStyle}>

<h3
style={{
color: "#aaa",
margin: 0,
fontSize: "14px",
letterSpacing: "0.06em"
}}
>
MASTER CONTROL
</h3>

<div
style={{
color: getModeColor(master.mode),
border:
`1px solid ${getModeColor(master.mode)}`,
padding: "4px 8px",
fontSize: "10px",
fontWeight: "bold",
whiteSpace: "nowrap"
}}
>
MODE: {master.mode ?? "UNKNOWN"}
</div>

</div>

{/* =================================================
MASTER SCORE HERO
================================================= */}

<div
style={{
border:
`2px solid ${getScoreColor(score)}`,
background: COLORS.backgroundStrong,
padding: "14px",
marginBottom: "12px",
boxSizing: "border-box",
borderRadius: "3px"
}}
>

<div
style={{
display: "flex",
flexWrap: "wrap",
justifyContent: "space-between",
alignItems: "flex-end",
gap: "12px"
}}
>

<div>

<div style={labelStyle}>
MASTER SCORE · RISK
</div>

<div
style={{
color: getScoreColor(score),
fontSize:
"clamp(32px, 9vw, 46px)",
fontWeight: "bold",
lineHeight: 1
}}
>
{score}/100
</div>

</div>

<div
style={{
color: getScoreColor(score),
fontSize:
"clamp(13px, 3.5vw, 17px)",
fontWeight: "bold",
textAlign: "right",
overflowWrap: "anywhere"
}}
>
{getScoreLabel(score)}
</div>

</div>

<div
style={{
marginTop: "8px",
color: COLORS.textMuted,
fontSize: "11px",
lineHeight: 1.4
}}
>
{getScoreDescription(score)}
</div>

{/* SCORE SCALE */}

<div
style={{
marginTop: "12px",
position: "relative",
height: "7px",
background:
"linear-gradient(to right, #52c41a 0%, #52c41a 35%, #fadb14 35%, #fadb14 65%, #ff4d4f 65%, #ff4d4f 100%)",
borderRadius: "4px"
}}
>

<div
style={{
position: "absolute",
top: "-4px",
left:
`calc(${Math.max(
0,
Math.min(100, score)
)}% - 2px)`,
width: "4px",
height: "15px",
background: "#fff",
borderRadius: "2px",
boxShadow:
"0 0 4px rgba(255,255,255,0.8)"
}}
/>

</div>

<div
style={{
display: "flex",
justifyContent: "space-between",
color: COLORS.textDim,
fontSize: "9px",
marginTop: "5px"
}}
>
<span>CALL 0</span>
<span>NEUTRAL 50</span>
<span>PUT 100</span>
</div>

</div>

{/* =================================================
SIGNAL
================================================= */}

<div
style={{
marginBottom: "12px",
padding: "12px",
border:
`2px solid ${getSignalColor(signalFromMaster)}`,
background: "#181818",
color:
getSignalColor(signalFromMaster),
fontWeight: "bold",
fontSize:
"clamp(13px, 3.5vw, 15px)",
textAlign: "center",
overflowWrap: "anywhere",
boxShadow:
`0 0 8px ${getSignalColor(signalFromMaster)}33`,
borderRadius: "3px"
}}
>
{getSignalText()}
</div>

{/* =================================================
STATUS
================================================= */}

<div style={gridStyle}>

{/* MODE */}

<div style={cardStyle}>

<div style={labelStyle}>
Mode
</div>

<div
style={{
...valueStyle,
color:
getModeColor(master.mode)
}}
>
{master.mode ?? "—"}
</div>

</div>

{/* REGIME */}

<div style={cardStyle}>

<div style={labelStyle}>
Regime
</div>

<div
style={{
...valueStyle,
color:
getRegimeColor(
master.regime
)
}}
>
{master.regime ?? "—"}
</div>

</div>

{/* EXPOSURE */}

<div style={cardStyle}>

<div style={labelStyle}>
Net Exposure
</div>

<div
style={{
...valueStyle,
color:
getExposureColor(
Number(
master.netExposure ?? 0
)
),
fontSize: "18px"
}}
>
{Number(
master.netExposure ?? 0
)}%
</div>

</div>

{/* SIGNAL STRENGTH */}

<div style={cardStyle}>

<div style={labelStyle}>
Signal Strength
</div>

<div
style={{
...valueStyle,
color:
getScoreColor(score)
}}
>
{Number(
master.signalStrength ?? 0
)}%
</div>

</div>

</div>

{/* =================================================
MASTER SUMMARY
================================================= */}

<div
style={{
marginTop: "12px",
padding: "10px",
border:
`1px solid ${getSummaryColor()}`,
color:
getSummaryColor(),
background: "#111",
fontSize: "12px",
lineHeight: 1.45,
overflowWrap: "anywhere",
borderRadius: "3px"
}}
>
{masterSummary}
</div>

{/* =================================================
DECISION / EXECUTION
================================================= */}

<div
style={{
...gridStyle,
marginTop: "12px"
}}
>

<div style={cardStyle}>

<div style={labelStyle}>
Decision
</div>

<div
style={{
...valueStyle,
color:
getDecisionColor(
globalDecision
)
}}
>
{globalDecision}
</div>

<div
style={{
color: COLORS.textDim,
fontSize: "11px",
marginTop: "4px"
}}
>
{globalDirection}
</div>

</div>

<div style={cardStyle}>

<div style={labelStyle}>
Execution
</div>

<div
style={{
...valueStyle,
color: COLORS.text
}}
>
{getExecution()}
</div>

</div>

</div>

{/* =================================================
NASDAQ
================================================= */}

<div
style={{
marginTop: "12px",
padding: "10px",
border:
`1px solid ${getNasdaqColor()}`,
background: COLORS.backgroundCard,
color: getNasdaqColor(),
fontSize: "12px",
textAlign: "center",
overflowWrap: "anywhere",
borderRadius: "3px"
}}
>

<strong>
{getNasdaqText()}
</strong>

{nasdaq?.execution && (
<>
<br />

<span
style={{
opacity: 0.75,
fontSize: "11px"
}}
>
{nasdaq.execution}
</span>
</>
)}

</div>

{/* =================================================
RISK COMPONENTS

HIGH = RISK / PUT
LOW = CONSTRUCTIVE / CALL
================================================= */}

<div
style={{
marginTop: "14px",
borderTop:
`1px solid ${COLORS.border}`,
paddingTop: "12px"
}}
>

<div
style={{
...labelStyle,
marginBottom: "9px"
}}
>
Risk Components
</div>

<div style={gridStyle}>

{/* ROTATION */}

<div style={cardStyle}>

<div style={labelStyle}>
Rotation
</div>

<div style={valueStyle}>
{rotation}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(rotation)} />
</div>

</div>

{/* CRASH */}

<div style={cardStyle}>

<div style={labelStyle}>
Crash
</div>

<div style={valueStyle}>
{crash}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(crash)} />
</div>

</div>

{/* PRICE MOMENTUM */}

<div style={cardStyle}>

<div style={labelStyle}>
Price Momentum
</div>

<div style={valueStyle}>
{priceMomentum}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(priceMomentum)} />
</div>

</div>

{/* TIMING */}

<div style={cardStyle}>

<div style={labelStyle}>
Timing
</div>

<div style={valueStyle}>
{timing}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(timing)} />
</div>

</div>

{/* RUSSELL */}

<div style={cardStyle}>

<div style={labelStyle}>
Russell
</div>

<div style={valueStyle}>
{russell}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(russell)} />
</div>

</div>

{/* PARTICIPATION */}

<div style={cardStyle}>

<div style={labelStyle}>
Participation
</div>

<div style={valueStyle}>
{participation}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(participation)} />
</div>

</div>

{/* BREADTH THRUST */}

<div style={cardStyle}>

<div style={labelStyle}>
Breadth Thrust
</div>

<div style={valueStyle}>
{breadthThrust}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(breadthThrust)} />
</div>

</div>

{/* BREADTH VELOCITY */}

<div style={cardStyle}>

<div style={labelStyle}>
Breadth Velocity
</div>

<div style={valueStyle}>
{breadthVelocity}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(breadthVelocity)} />
</div>

</div>

{/* ROTATION DECAY */}

<div style={cardStyle}>

<div style={labelStyle}>
Rotation Decay
</div>

<div style={valueStyle}>
{rotationDecay}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(rotationDecay)} />
</div>

</div>

{/* LIQUIDITY */}

<div style={cardStyle}>

<div style={labelStyle}>
Liquidity
</div>

<div style={valueStyle}>
{liquidity}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(liquidity)} />
</div>

</div>

{/* MARKET QUALITY */}

<div style={cardStyle}>

<div style={labelStyle}>
Market Quality
</div>

<div style={valueStyle}>
{marketQuality}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(marketQuality)} />
</div>

</div>

{/* FRAGILITY */}

<div style={cardStyle}>

<div style={labelStyle}>
Fragility
</div>

<div style={valueStyle}>
{fragility}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(fragility)} />
</div>

</div>

{/* REGIME SYNC */}

<div style={cardStyle}>

<div style={labelStyle}>
Regime Sync
</div>

<div style={valueStyle}>
{regimeSync}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(regimeSync)} />
</div>

</div>

{/* DANGER ZONE */}

<div style={cardStyle}>

<div style={labelStyle}>
Danger Zone
</div>

<div style={valueStyle}>
{dangerZone}/100
</div>

<div style={progressBackgroundStyle}>
<div style={bar(dangerZone)} />
</div>

</div>

</div>

</div>

{/* =================================================
PERSISTENCE
================================================= */}

<div
style={{
marginTop: "14px",
borderTop:
`1px solid ${COLORS.border}`,
paddingTop: "12px"
}}
>

<div
style={{
...labelStyle,
marginBottom: "9px"
}}
>
Regime Persistence
</div>

<div style={gridStyle}>

<div style={cardStyle}>

<div style={labelStyle}>
Persistence
</div>

<div style={valueStyle}>
{regimePersistence}/100
</div>

<div style={progressBackgroundStyle}>
<div
style={
bar(regimePersistence)
}
/>
</div>

</div>

<div style={cardStyle}>

<div style={labelStyle}>
Distribution Risk
</div>

<div style={valueStyle}>
{distributionRisk}/100
</div>

<div style={progressBackgroundStyle}>
<div
style={
bar(distributionRisk)
}
/>
</div>

</div>

<div style={cardStyle}>

<div style={labelStyle}>
False Recovery Risk
</div>

<div style={valueStyle}>
{falseRecoveryRisk}/100
</div>

<div style={progressBackgroundStyle}>
<div
style={
bar(falseRecoveryRisk)
}
/>
</div>

</div>

<div style={cardStyle}>

<div style={labelStyle}>
Market Fatigue
</div>

<div style={valueStyle}>
{marketFatigue}/100
</div>

<div style={progressBackgroundStyle}>
<div
style={
bar(marketFatigue)
}
/>
</div>

</div>

</div>

</div>

{/* =================================================
STRUCTURAL DIAGNOSTICS
================================================= */}

<div
style={{
marginTop: "14px",
borderTop:
`1px solid ${COLORS.border}`,
paddingTop: "12px"
}}
>

<div
style={{
...labelStyle,
marginBottom: "9px"
}}
>
Structural Diagnostics
</div>

<div style={gridStyle}>

{/* CURRENT QUALITY */}

<div style={cardStyle}>

<div style={labelStyle}>
Current Quality
</div>

<div
style={{
...valueStyle,
color:
getRiskColor(
currentQuality
)
}}
>
{currentQuality}/100
</div>

</div>

{/* STRUCTURAL QUALITY */}

<div style={cardStyle}>

<div style={labelStyle}>
Structural Quality
</div>

<div
style={{
...valueStyle,
color:
getRiskColor(
structuralQuality
)
}}
>
{structuralQuality}/100
</div>

</div>

{/* HISTORICAL QUALITY */}

<div style={cardStyle}>

<div style={labelStyle}>
Historical Quality
</div>

<div
style={{
...valueStyle,
color:
getRiskColor(
historicalQuality
)
}}
>
{historicalQuality}/100
</div>

</div>

{/* CRASH RISK */}

<div style={cardStyle}>

<div style={labelStyle}>
Crash Risk
</div>

<div
style={{
...valueStyle,
color:
getRiskColor(
crashRisk
)
}}
>
{crashRisk}/100
</div>

</div>

{/* TIMING RISK */}

<div style={cardStyle}>

<div style={labelStyle}>
Timing Risk
</div>

<div
style={{
...valueStyle,
color:
getRiskColor(
timingRisk
)
}}
>
{timingRisk}/100
</div>

</div>

{/* RUSSELL RISK */}

<div style={cardStyle}>

<div style={labelStyle}>
Russell Risk
</div>

<div
style={{
...valueStyle,
color:
getRiskColor(
russellRisk
)
}}
>
{russellRisk}/100
</div>

</div>

{/* DEFENSIVE EVIDENCE */}

<div style={cardStyle}>

<div style={labelStyle}>
Defensive Evidence
</div>

<div
style={{
...valueStyle,
color:
defensiveEvidenceCount >= 3
? COLORS.red
: defensiveEvidenceCount >= 2
? COLORS.orange
: COLORS.textMuted
}}
>
{defensiveEvidenceCount}
</div>

</div>

{/* PHASE CONFIDENCE */}

<div style={cardStyle}>

<div style={labelStyle}>
Phase Confidence
</div>

<div
style={{
...valueStyle,
color:
phaseConfidence >= 70
? COLORS.green
: phaseConfidence >= 40
? COLORS.yellow
: COLORS.red
}}
>
{phaseConfidence}%
</div>

</div>

</div>

</div>

{/* =================================================
PHASE / STRUCTURE STATE
================================================= */}

<div
style={{
marginTop: "14px",
borderTop:
`1px solid ${COLORS.border}`,
paddingTop: "12px"
}}
>

<div
style={{
...labelStyle,
marginBottom: "9px"
}}
>
Structural State
</div>

<div style={gridStyle}>

{/* PHASE */}

<div style={cardStyle}>

<div style={labelStyle}>
Phase
</div>

<div
style={{
...valueStyle,
color:
phaseConfirmed
? COLORS.orange
: COLORS.text
}}
>
{String(phase)
.replaceAll("_", " ")}
</div>

</div>

{/* PHASE CONFIRMED */}

<div style={cardStyle}>

<div style={labelStyle}>
Phase Confirmation
</div>

<div
style={{
...valueStyle,
color:
phaseConfirmed
? COLORS.green
: COLORS.textMuted
}}
>
{phaseConfirmed
? "CONFIRMED"
: "UNCONFIRMED"}
</div>

</div>

{/* WEAK INTERNALS */}

<div style={cardStyle}>

<div style={labelStyle}>
Weak Internals
</div>

<div
style={{
...valueStyle,
color:
weakInternals
? COLORS.red
: COLORS.green
}}
>
{weakInternals
? "ACTIVE"
: "CLEAR"}
</div>

</div>

{/* NARROW LEADERSHIP */}

<div style={cardStyle}>

<div style={labelStyle}>
Narrow Leadership
</div>

<div
style={{
...valueStyle,
color:
narrowLeadership
? COLORS.orange
: COLORS.green
}}
>
{narrowLeadership
? "ACTIVE"
: "NORMAL"}
</div>

</div>

{/* DEFENSIVE STRUCTURE */}

<div style={cardStyle}>

<div style={labelStyle}>
Defensive Structure
</div>

<div
style={{
...valueStyle,
color:
strongDefensiveStructure
? COLORS.red
: defensiveStructuralConfirmation
? COLORS.orange
: COLORS.textMuted
}}
>
{strongDefensiveStructure
? "STRONG"
: defensiveStructuralConfirmation
? "CONFIRMED"
: "NOT CONFIRMED"}
</div>

</div>

</div>

</div>

{/* =================================================
ENGINE SEMANTICS
================================================= */}

<div
style={{
marginTop: "14px",
paddingTop: "10px",
borderTop:
`1px solid ${COLORS.borderSoft}`,
color: COLORS.textDim,
fontSize: "9px",
lineHeight: 1.5,
textAlign: "center"
}}
>
MASTER SCORE SEMANTICS: LOW = CALL / CONSTRUCTIVE · HIGH = PUT / RISK
</div>

</div>
);
}
