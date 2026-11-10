// /components/TradeStackPanel.tsx

"use client";

type Props = {
tradeStack?: any;
sizing?: any;
rotationConfirm?: any;
};

export default function TradeStackPanel({
tradeStack,
sizing,
rotationConfirm,
}: Props) {
if (!tradeStack) return null;

/* ======================================================
SAFE ACCESS
====================================================== */

const stack = tradeStack ?? {};

const stackState = stack?.state ?? "NEUTRAL";

const primary = stack?.primaryFlow ?? {
instrument: "NONE",
direction: "NONE",
state: "NEUTRAL",
strength: 0,
driver: "NONE",
};

const candidates = Array.isArray(stack?.candidates)
? stack.candidates.filter(Boolean)
: [
stack?.nasdaqPut,
stack?.nasdaqCall,
stack?.russellCall,
].filter(Boolean);

const edge = stack?.edge ?? {};

const meta = stack?.meta ?? {};

const history = stack?.history ?? {};

const edgeScore = Number(edge?.score ?? 0);

const edgeTier = edge?.tier ?? "NO_EDGE";

const size = Number(sizing?.size ?? 0);

const sizingMode = sizing?.mode ?? "DEFENSIVE";

const directionalConflict = Boolean(meta?.directionalConflict);

const stackStrength = Number(stack?.strength ?? 0);

const primaryStrength = Number(primary?.strength ?? 0);

const activeRotationConfirm =
rotationConfirm ??
{
state: meta?.rotationState,
confidence: meta?.rotationConfidence,
quality: meta?.rotationQuality,
sustainability: meta?.sustainability,
participation: meta?.participation,
falseBreakRisk: meta?.falseBreakRisk,
};

/* ======================================================
COLORS — DIRECTION
====================================================== */

function getDirectionColor(direction: string) {
switch (direction) {
case "SHORT":
return "#fda4af";

case "LONG":
return "#6ee7b7";

default:
return "#94a3b8";
}
}

/* ======================================================
STACK STATE COLOR
====================================================== */

function getStackStateColor(state: string) {
switch (state) {
case "SHORT_ATTACK":
return "#fda4af";

case "SHORT_BUILDING":
return "#fda4af";

case "EARLY_DEFENSIVE_SHORT":
return "#fdba74";

case "LONG_ATTACK":
return "#6ee7b7";

case "LONG_BUILDING":
return "#73d13d";

case "EARLY_LONG":
return "#a7f3d0";

case "CONFLICT":
return "#fcd34d";

default:
return "#94a3b8";
}
}

/* ======================================================
STRENGTH LABEL
====================================================== */

function getStrengthLabel(strength: number) {
if (strength >= 75) return "HIGH CONVICTION";

if (strength >= 60) return "STRONG";

if (strength >= 40) return "BUILDING";

if (strength >= 20) return "EARLY";

return "NO TRADE";
}

/* ======================================================
CONVICTION COLOR

Direction stays visually dominant.
====================================================== */

function getConvictionColor(
direction: string,
strength: number
) {
if (strength < 20) {
return "#64748b";
}

return getDirectionColor(direction);
}

/* ======================================================
EDGE
====================================================== */

function getEdgeColor(score: number) {
if (score >= 80) return "#fda4af";

if (score >= 60) return "#fdba74";

if (score >= 40) return "#fcd34d";

if (score >= 20) return "#73d13d";

return "#64748b";
}

function getEdgeLabel(score: number) {
if (score >= 80) return "VERY HIGH MODEL SCORE";

if (score >= 60) return "HIGH MODEL SCORE";

if (score >= 40) return "MODERATE MODEL SCORE";

if (score >= 20) return "EARLY MODEL SUPPORT";

return "LOW MODEL SCORE";
}

/* ======================================================
SIZING MODE
====================================================== */

function getModeColor(mode: string) {
switch (mode) {
case "AGGRESSIVE":
return "#fda4af";

case "ACTIVE":
return "#fdba74";

case "PROBING":
return "#fcd34d";

case "DEFENSIVE":
return "#7dd3fc";

case "WAIT":
return "#94a3b8";

default:
return "#94a3b8";
}
}

/* ======================================================
ROTATION CONFIRMATION
====================================================== */

function getRotationColor(state: string) {
switch (state) {
case "INSTITUTIONAL_CONFIRMATION":
return "#6ee7b7";

case "CONFIRMED":
return "#73d13d";

case "CONFIRMING":
return "#fcd34d";

case "EARLY":
return "#94a3b8";

case "INTERNAL_BREAKDOWN":
return "#fda4af";

case "ROTATION_FAILURE":
return "#fda4af";

case "EXHAUSTED_ROTATION":
return "#fda4af";

case "DISTRIBUTION_ROTATION":
return "#fdba74";

default:
return "#64748b";
}
}

/* ======================================================
ROTATION DECAY
====================================================== */

function getDecayColor(score: number, state: string) {
if (
state === "ROTATION_FAILURE" ||
state === "EXHAUSTED_ROTATION"
) {
return "#fda4af";
}

if (
state === "INTERNAL_BREAKDOWN" ||
state === "DISTRIBUTION_ROTATION"
) {
return "#fda4af";
}

if (state === "EARLY_DECAY") {
return "#fcd34d";
}

if (score >= 75) return "#fda4af";

if (score >= 50) return "#fdba74";

if (score >= 30) return "#fcd34d";

return "#6ee7b7";
}

function getDecayLabel(score: number, state: string) {
if (
state === "ROTATION_FAILURE" ||
state === "EXHAUSTED_ROTATION"
) {
return state.replaceAll("_", " ");
}

if (state === "INTERNAL_BREAKDOWN") {
return "INTERNAL BREAKDOWN";
}

if (state === "DISTRIBUTION_ROTATION") {
return "DISTRIBUTION";
}

if (state === "EARLY_DECAY") {
return "EARLY DECAY";
}

if (score >= 75) return "SEVERE DECAY";

if (score >= 50) return "ELEVATED DECAY";

if (score >= 30) return "EARLY DECAY";

return "HEALTHY";
}

/* ======================================================
INSTRUMENT LABEL
====================================================== */

function getInstrumentLabel(instrument: string) {
switch (instrument) {
case "NASDAQ_PUT":
return "NASDAQ PUT";

case "NASDAQ_CALL":
return "NASDAQ CALL";

case "RUSSELL_CALL":
return "RUSSELL CALL";

default:
return "NO ACTIVE TRADE";
}
}

/* ======================================================
FLOW BAR
====================================================== */

function renderFlowBar(
direction: string,
strength: number
) {
const totalBars = 5;

const activeBars = Math.max(
0,
Math.min(
totalBars,
Math.round(strength / 20)
)
);

const color =
direction === "NONE"
? "#fcd34d"
: getDirectionColor(direction);

return (
<div
style={{
display: "flex",
gap: "4px",
marginTop: "12px",
}}
>
{Array.from(
{ length: totalBars },
(_, index) => {
let active = false;

if (direction === "SHORT") {
active = index < activeBars;
} else if (direction === "LONG") {
active =
index >= totalBars - activeBars;
} else {
active = index < activeBars;
}

return (
<div
key={index}
style={{
flex: 1,
height: "8px",
background: active
? color
: "#334155",
borderRadius: "2px",
transition:
"background 0.2s ease",
}}
/>
);
}
)}
</div>
);
}

/* ======================================================
EXECUTION EXPLANATION
====================================================== */

function getExecutionExplanation() {
if (directionalConflict) {
return {
text:
"Directional conflict detected → system prefers WAIT over forced exposure",
color: "#fcd34d",
};
}

if (size <= 0 || primary.instrument === "NONE") {
return { text: "No new entry approved", color: "#94a3b8" };
}

return { text: "Instrument setup approved; allocation comes from position sizing", color: "#94a3b8" };
}

const executionExplanation =
getExecutionExplanation();

/* ======================================================
PRIMARY COLORS
====================================================== */

const primaryColor = directionalConflict
? "#fcd34d"
: getDirectionColor(primary.direction);

const stackColor =
directionalConflict
? "#fcd34d"
: getStackStateColor(stackState);

/* ======================================================
DECAY DATA
====================================================== */

const decayScore =
Number(meta?.decayScore ?? 0);

const decayState =
meta?.decayState ??
"HEALTHY_ROTATION";

const decayColor =
getDecayColor(
decayScore,
decayState
);

/* ======================================================
HISTORY FLAGS
====================================================== */

const historyFlags = [
history?.prolongedBearRegime && {
label: "Prolonged bear regime",
},

history?.severeBearRegime && {
label: "Severe bear regime",
},

history?.broadParticipationFailure && {
label: "Broad participation failure",
},

history?.severeParticipationFailure && {
label: "Severe participation failure",
},

history?.participationErosion && {
label: "Participation erosion",
},

history?.risingCrashRisk && {
label: "Rising crash risk",
},

history?.prolongedDistribution && {
label: "Prolonged distribution",
},
].filter(Boolean) as {
label: string;
}[];

/* ======================================================
RENDER
====================================================== */

return (
<>
<style>{`
.trade-stack-panel {
width: 100%;
box-sizing: border-box;
}

.trade-stack-header {
display: flex;
justify-content: space-between;
align-items: center;
gap: 12px;
}

.trade-stack-primary-row {
display: flex;
justify-content: space-between;
align-items: center;
gap: 16px;
}

.trade-stack-matrix {
display: grid;
grid-template-columns: repeat(3, minmax(0, 1fr));
gap: 8px;
}

.trade-stack-grid-two {
display: grid;
grid-template-columns: repeat(2, minmax(0, 1fr));
gap: 12px;
}

@media (max-width: 700px) {
.trade-stack-header {
align-items: flex-start;
flex-direction: column;
}

.trade-stack-primary-row {
align-items: flex-start;
flex-direction: column;
}

.trade-stack-primary-strength {
text-align: left !important;
}

.trade-stack-matrix {
grid-template-columns: 1fr;
}
}

@media (max-width: 480px) {
.trade-stack-grid-two {
grid-template-columns: 1fr;
}
}
`}</style>

<div
className="trade-stack-panel"
style={{
background: "#0e1722",
border: `1px solid ${
directionalConflict
? "#5a4a20"
: "#334155"
}`,
padding: "16px",
borderRadius: "8px",
boxSizing: "border-box",
}}
>
{/* ==================================================
HEADER
================================================== */}

<div
className="trade-stack-header"
style={{
marginBottom: "14px",
}}
>
<div
style={{
color: "#94a3b8",
fontWeight: "bold",
fontSize: "14px",
letterSpacing: "0.5px",
}}
>
TRADE STACK
</div>

<div
style={{
display: "flex",
gap: "8px",
alignItems: "center",
flexWrap: "wrap",
}}
>
<span
style={{
color: stackColor,
fontSize: "11px",
fontWeight: "bold",
}}
>
        {size <= 0 && primary.instrument !== "NONE" ? "SETUP DEVELOPING · NO TRADE" : stackState.replaceAll("_", " ")}
</span>

<span
style={{
color: getModeColor(sizingMode),
fontSize: "11px",
fontWeight: "bold",
}}
>
SIZE: {sizingMode}
</span>
</div>
</div>

{/* ==================================================
{size <= 0 ? "LEADING CANDIDATE · NOT APPROVED" : "PRIMARY FLOW"}
================================================== */}

<div
style={{
marginBottom: "16px",
padding: "14px",
border: `1px solid ${primaryColor}`,
background: "#121d2a",
borderRadius: "6px",
}}
>
<div
style={{
color: "#64748b",
fontSize: "11px",
marginBottom: "8px",
letterSpacing: "0.5px",
}}
>
PRIMARY FLOW
</div>

<div className="trade-stack-primary-row">
<div
style={{
minWidth: 0,
}}
>
<div
style={{
color: primaryColor,
fontWeight: "bold",
fontSize: "20px",
wordBreak: "break-word",
}}
>
{directionalConflict
? "DIRECTIONAL CONFLICT"
: getInstrumentLabel(
primary.instrument
)}
</div>

<div
style={{
color: "#94a3b8",
fontSize: "12px",
marginTop: "5px",
}}
>
{directionalConflict
? "WAIT / NO FORCED DIRECTION"
: size <= 0 ? "SETUP DEVELOPING · NO ENTRY APPROVED" : primary.state}
</div>
</div>

<div
className="trade-stack-primary-strength"
style={{
textAlign: "right",
}}
>
<div
style={{
color: directionalConflict
? "#fcd34d"
: getConvictionColor(
primary.direction,
primaryStrength
),
fontWeight: "bold",
fontSize: "26px",
}}
>
{directionalConflict
? stackStrength
: primaryStrength}
</div>

<div
style={{
color: "#64748b",
fontSize: "10px",
marginTop: "2px",
}}
>
CANDIDATE SCORE
</div>
</div>
</div>

{renderFlowBar(
directionalConflict
? "NONE"
: primary.direction,
directionalConflict
? stackStrength
: primaryStrength
)}

<div
style={{
display: "flex",
justifyContent: "space-between",
gap: "10px",
flexWrap: "wrap",
marginTop: "9px",
color: "#64748b",
fontSize: "11px",
}}
>
<span>
{directionalConflict
? "NO DIRECTION"
: primary.direction}
</span>

<span
style={{
color: directionalConflict
? "#fcd34d"
: "#94a3b8",
}}
>
{directionalConflict
? "CONFLICT"
: size <= 0 ? "CANDIDATE · NO ENTRY" : getStrengthLabel(
primaryStrength
)}
</span>
</div>

<div
style={{
marginTop: "7px",
color: directionalConflict
? "#fcd34d"
: "#64748b",
fontSize: "10px",
wordBreak: "break-word",
}}
>
DRIVER:{" "}
{directionalConflict
? "DIRECTIONAL_CONFLICT"
: primary.driver}
</div>
</div>

{/* ==================================================
THREE-WAY TRADE MATRIX
================================================== */}

<div
style={{
marginBottom: "16px",
}}
>
<div
style={{
color: "#64748b",
fontSize: "11px",
marginBottom: "8px",
letterSpacing: "0.5px",
}}
>
THREE-WAY TRADE MATRIX
</div>

<div className="trade-stack-matrix">
{candidates.map(
(candidate: any) => {
const strength = Number(
candidate?.strength ?? 0
);

const isPrimary =
!directionalConflict &&
candidate.instrument ===
primary.instrument;

const directionColor =
getDirectionColor(
candidate.direction
);

const convictionColor =
getConvictionColor(
candidate.direction,
strength
);

return (
<div
key={candidate.instrument}
style={{
background: "#121d2a",
border: `1px solid ${
isPrimary
? directionColor
: "#334155"
}`,
padding: "11px",
minWidth: 0,
borderRadius: "5px",
boxSizing: "border-box",
}}
>
<div
style={{
color: "#94a3b8",
fontSize: "10px",
marginBottom: "7px",
}}
>
{getInstrumentLabel(
candidate.instrument
)}
</div>

<div
style={{
color: convictionColor,
fontSize: "22px",
fontWeight: "bold",
}}
>
{strength}
</div>

<div
style={{
color: "#64748b",
fontSize: "9px",
}}
>
/ 100
</div>

<div
style={{
color: convictionColor,
fontSize: "10px",
marginTop: "7px",
fontWeight: "bold",
}}
>
{size <= 0 && isPrimary ? "CANDIDATE · NOT APPROVED" : getStrengthLabel(strength)}
</div>

<div
style={{
color: directionColor,
fontSize: "10px",
marginTop: "5px",
fontWeight: "bold",
}}
>
{candidate.direction}
</div>

<div
style={{
color: "#64748b",
fontSize: "9px",
marginTop: "5px",
lineHeight: 1.35,
wordBreak: "break-word",
}}
>
{size <= 0 && isPrimary ? "SHORT SETUP DEVELOPING" : candidate.state}
</div>

{isPrimary && (
<div
style={{
color: "#7dd3fc",
fontSize: "9px",
marginTop: "8px",
fontWeight: "bold",
}}
>
★ {size <= 0 ? "LEADING CANDIDATE · NO TRADE" : "PRIMARY"}
</div>
)}
</div>
);
}
)}
</div>
</div>

{/* ==================================================
CENTRAL EDGE
================================================== */}

<div
style={{
marginBottom: "16px",
padding: "14px",
border: `1px solid ${getEdgeColor(
edgeScore
)}`,
background: "#121d2a",
borderRadius: "6px",
}}
>
<div
style={{
color: "#64748b",
fontSize: "11px",
}}
>
ROTATION MODEL SCORE
</div>

<div
style={{
display: "flex",
alignItems: "baseline",
gap: "8px",
flexWrap: "wrap",
}}
>
<div
style={{
color: getEdgeColor(edgeScore),
fontWeight: "bold",
fontSize: "24px",
}}
>
{edgeScore}/100
</div>

<div
style={{
color: getEdgeColor(edgeScore),
fontSize: "13px",
fontWeight: "bold",
}}
>
{getEdgeLabel(edgeScore)}
</div>
</div>

<div
style={{
color: "#94a3b8",
fontSize: "10px",
marginTop: "4px",
}}
>
{edgeTier}
</div>

<div
style={{
marginTop: "10px",
color:
executionExplanation.color,
fontSize: "12px",
lineHeight: 1.4,
}}
>
{executionExplanation.text}
</div>
</div>

{/* ==================================================
ROTATION CONFIRMATION
================================================== */}

{activeRotationConfirm?.state && (
<div
style={{
marginBottom: "16px",
padding: "12px",
border: `1px solid ${getRotationColor(
activeRotationConfirm.state
)}`,
background: "#121d2a",
borderRadius: "6px",
}}
>
<div
style={{
color: "#64748b",
fontSize: "11px",
marginBottom: "5px",
}}
>
ROTATION CONFIRMATION
</div>

<div
style={{
color: getRotationColor(
activeRotationConfirm.state
),
fontWeight: "bold",
fontSize: "16px",
wordBreak: "break-word",
}}
>
{activeRotationConfirm.state.replaceAll(
"_",
" "
)}
</div>

<div
style={{
marginTop: "7px",
fontSize: "12px",
color: "#94a3b8",
}}
>
Confidence:{" "}
<span
style={{
color: "#e2e8f0",
fontWeight: "bold",
}}
>
{activeRotationConfirm.confidence ??
0}
%
</span>
</div>
</div>
)}

{/* ==================================================
INSTITUTIONAL / STRUCTURAL OVERLAY
================================================== */}

<div
className="trade-stack-grid-two"
style={{
marginBottom: "16px",
}}
>
{/* ROTATION CONFIDENCE */}

<div
style={{
background: "#121d2a",
padding: "12px",
border: "1px solid #334155",
borderRadius: "5px",
}}
>
<div
style={{
color: "#64748b",
fontSize: "11px",
}}
>
ROTATION CONF.
</div>

<div
style={{
color: "#7dd3fc",
fontWeight: "bold",
marginTop: "4px",
}}
>
{meta.rotationConfidence ?? 0}%
</div>
</div>

{/* ROTATION DECAY */}

<div
style={{
background: "#121d2a",
padding: "12px",
border: `1px solid ${decayColor}`,
borderRadius: "5px",
}}
>
<div
style={{
color: "#64748b",
fontSize: "11px",
}}
>
ROTATION DECAY
</div>

<div
style={{
color: decayColor,
fontWeight: "bold",
marginTop: "4px",
}}
>
{decayScore}
</div>

<div
style={{
color: decayColor,
fontSize: "9px",
marginTop: "4px",
fontWeight: "bold",
}}
>
{getDecayLabel(
decayScore,
decayState
)}
</div>
</div>

{/* REGIME ALIGNMENT */}

<div
style={{
background: "#121d2a",
padding: "12px",
border: "1px solid #334155",
borderRadius: "5px",
}}
>
<div
style={{
color: "#64748b",
fontSize: "11px",
}}
>
REGIME ALIGNMENT
</div>

<div
style={{
color: meta.regimeAligned
? "#6ee7b7"
: "#fda4af",
fontWeight: "bold",
marginTop: "4px",
}}
>
{meta.regimeAligned
? "ALIGNED"
: "MISALIGNED"}
</div>
</div>

{/* INSTITUTIONAL ALIGNMENT */}

<div
style={{
background: "#121d2a",
padding: "12px",
border: "1px solid #334155",
borderRadius: "5px",
}}
>
<div
style={{
color: "#64748b",
fontSize: "11px",
}}
>
INSTITUTIONAL
</div>

<div
style={{
color:
meta.institutionalAligned
? "#6ee7b7"
: "#fda4af",
fontWeight: "bold",
marginTop: "4px",
}}
>
{meta.institutionalAligned
? "ALIGNED"
: "MISALIGNED"}
</div>
</div>
</div>

{/* ==================================================
POSITIONING
================================================== */}

<div className="trade-stack-grid-two">
{/* POSITION SIZE */}

<div
style={{
border: "1px solid #334155",
background: "#121d2a",
padding: "12px",
borderRadius: "5px",
}}
>
<div
style={{
color: "#64748b",
fontSize: "11px",
}}
>
POSITION SIZE
</div>

<div
style={{
color: "#7dd3fc",
fontWeight: "bold",
fontSize: "22px",
marginTop: "4px",
}}
>
{size}%
</div>

<div
style={{
color: getModeColor(
sizingMode
),
fontSize: "10px",
marginTop: "4px",
fontWeight: "bold",
}}
>
{sizingMode}
</div>
</div>

{/* PRIMARY DIRECTION */}

<div
style={{
border: `1px solid ${primaryColor}`,
background: "#121d2a",
padding: "12px",
borderRadius: "5px",
}}
>
<div
style={{
color: directionalConflict
? "#fcd34d"
: primaryColor,
fontWeight: "bold",
fontSize: "18px",
}}
>
{directionalConflict
? "CONFLICT"
: primary.direction}
</div>

<div
style={{
color: "#64748b",
fontSize: "11px",
marginTop: "4px",
}}
>
PRIMARY DIRECTION
</div>
</div>
</div>

{/* ==================================================
HISTORY FLAGS
================================================== */}

{historyFlags.length > 0 && (
<div
style={{
marginTop: "16px",
padding: "11px",
border: "1px solid #3a2222",
background: "#120d0d",
borderRadius: "5px",
}}
>
<div
style={{
color: "#fda4af",
fontSize: "10px",
fontWeight: "bold",
marginBottom: "7px",
letterSpacing: "0.5px",
}}
>
STRUCTURAL HISTORY FLAGS
</div>

<div
style={{
display: "flex",
flexDirection: "column",
gap: "4px",
}}
>
{historyFlags.map(
(flag, index) => (
<div
key={`${flag.label}-${index}`}
style={{
color: "#cbd5e1",
fontSize: "10px",
}}
>
• {flag.label}
</div>
)
)}
</div>
</div>
)}
</div>
</>
);
}
