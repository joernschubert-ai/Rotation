// /lib/engine/rotationDecisionEngine.ts

export function rotationDecisionEngine(input: any) {

const {
phase,
crash,
putTiming,
russell,
confidence,
earlyWarning,
master,
positioning,
edgeState,

/* 🔥 NEW */
rotation,
rotationConfirm,
executionState,
superSignal
} = input

/* =====================================================
SCORES
===================================================== */

const putScore =
putTiming?.score?.value ?? 0

const russellScore =
russell?.confidence ?? 0

const putNorm =
(putScore / 12) * 100

const russellNorm =
russellScore

const edge =
putNorm - russellNorm

/* =====================================================
EDGE STATE
===================================================== */

const edgeLevel =
edgeState?.strength ?? 0

const edgeLabel =
edgeState?.state ?? "NEUTRAL"

/* =====================================================
ROTATION V3
===================================================== */

const rotationSignal =
rotation?.signal ?? "NEUTRAL"

const rotationState =
rotation?.state ?? "UNKNOWN"

const rotationConfidence =
rotation?.confidence ?? 50

/* =====================================================
ROTATION CONFIRM
===================================================== */

const confirmState =
rotationConfirm?.state ?? "EARLY"

const confirmQuality =
rotationConfirm?.quality ?? 50

/* =====================================================
EXECUTION
===================================================== */

const executionMode =
executionState?.executionMode ??
"WAIT"

const riskState =
executionState?.riskState ??
"STABLE"

/* =====================================================
SUPER SIGNAL
===================================================== */

const institutional =
superSignal?.quality ===
"INSTITUTIONAL"

/* =====================================================
DEFAULT
===================================================== */

let finalAction = "WAIT"
let direction = "NEUTRAL"
let reason = "No clear edge"

/* =====================================================
HARD OVERRIDES
===================================================== */

if (
crash.probability > 80
) {
return {
finalAction:
"MAX PUT EXPOSURE",

direction:
"NET SHORT",

reason:
"Crash dominant"
}
}

if (
master?.score > 80
) {
return {
finalAction:
"FULL DEFENSIVE",

direction:
"NET SHORT",

reason:
"Master risk extreme"
}
}

/* =====================================================
PHASE DOMINANCE
===================================================== */

if (
phase === "PHASE_5_BREAKDOWN" ||
phase === "PHASE_6_ACCELERATION"
) {
return {
finalAction:
"AGGRESSIVE PUTS",

direction:
"NET SHORT",

reason:
"Breakdown regime"
}
}

/* =====================================================
INSTITUTIONAL LONG
===================================================== */

if (
institutional &&
rotationSignal === "RISK_ON" &&
confirmState ===
"INSTITUTIONAL_CONFIRMATION" &&
executionMode ===
"ADD_ON_PULLBACKS" &&
riskState === "STABLE"
) {
return {
finalAction:
"INSTITUTIONAL LONG",

direction:
"NET LONG",

reason:
"Institutional alignment"
}
}

/* =====================================================
EDGE PRIORITY
===================================================== */

if (edgeLabel === "ATTACK") {
return {
finalAction:
"FULL RISK-ON",

direction:
"NET LONG",

reason:
"Edge ATTACK state"
}
}

if (edgeLabel === "EXPAND") {
return {
finalAction:
"ADD RUSSELL AGGRESSIVE",

direction:
"NET LONG",

reason:
"Edge EXPAND state"
}
}

if (edgeLabel === "CONFIRM") {
finalAction = "ADD RUSSELL"
direction = "NET LONG"
reason = "Edge CONFIRM"
}

if (edgeLabel === "BUILD") {
finalAction = "BUILD RUSSELL"
direction = "NET LONG"
reason = "Edge BUILD"
}

/* =====================================================
ROTATION OVERRIDE
===================================================== */

const rotationOverrideActive =
master?.mode === "ROTATION" &&
(
russell?.decision === "BUILD" ||
russell?.decision === "ADD" ||
russell?.decision === "AGGRESSIVE"
) &&
crash?.probability < 40 &&
(
phase === "PHASE_1_EXPANSION" ||
phase === "PHASE_2_WARNING" ||
phase === "PHASE_3_DISTRIBUTION"
)

if (
rotationOverrideActive &&
edgeLevel >= 1 &&
edge > -10 &&
rotationConfidence >= 65
) {
return {
finalAction:
"BUILD RUSSELL",

direction:
"NET LONG",

reason:
"Rotation + Edge alignment"
}
}

/* =====================================================
CONFIDENCE FILTER
===================================================== */

if (
confidence?.state !== "CONFIRMED"
) {
return {
finalAction: "WAIT",
direction: "LOW EXPOSURE",
reason: "Low confidence"
}
}

/* =====================================================
EARLY WARNING
===================================================== */

if (
earlyWarning?.active
) {

if (
edgeLevel <= 1 &&
edge > -10 &&
edge < 15
) {
return {
finalAction:
"DEFENSIVE BIAS",

direction:
"LIGHT SHORT",

reason:
"Weak edge + Early warning"
}
}

}

/* =====================================================
POSITIONING
===================================================== */

if (
positioning?.crowding ===
"EXTREME_LONG"
) {
finalAction = "FADE LONGS"
direction = "SHORT BIAS"
reason = "Crowded longs"
}

if (
positioning?.crowding ===
"EXTREME_SHORT"
) {
finalAction = "FADE SHORTS"
direction = "LONG BIAS"
reason = "Crowded shorts"
}

/* =====================================================
CORE DECISION
===================================================== */

if (edge > 20) {

finalAction = "ADD PUTS"
direction = "NET SHORT"
reason = "Put edge dominant"

}

else if (edge < -20) {

finalAction =
"ENTER RUSSELL CALLS"

direction = "NET LONG"

reason =
"Russell edge dominant"

}

else {

finalAction =
"WAIT / REDUCE"

direction =
"LOW EXPOSURE"

reason =
"No strong edge"

}

/* =====================================================
PHASE OVERLAY
===================================================== */

if (
phase === "PHASE_2_WARNING" &&
edge < 10 &&
edge > -10
) {
finalAction = "WAIT"
direction = "NEUTRAL"
reason = "Early phase no edge"
}

if (
phase === "PHASE_3_DISTRIBUTION" &&
edge > 0
) {
finalAction = "BUILD PUTS"
direction = "NET SHORT"
reason = "Distribution phase"
}

/* =====================================================
NASDAQ OVERLAY
===================================================== */

if (
input.nasdaq?.active &&
direction === "NEUTRAL"
) {
return {
finalAction:
"NASDAQ OPPORTUNITY",

direction:
"LIGHT LONG",

reason:
"Opportunistic Nasdaq setup"
}
}

/* =====================================================
RETURN
===================================================== */

return {
finalAction,
direction,

edge,

edgeState:
edgeLabel,

putScore:
putNorm,

russellScore:
russellNorm,

reason
}

}
