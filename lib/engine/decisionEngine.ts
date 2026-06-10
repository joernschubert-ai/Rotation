// /lib/engine/decisionEngine.ts

export function decisionEngine(engine: any) {

/* ======================================================
INPUT
====================================================== */

const putTiming =
engine.putTiming ?? {}

const russell =
engine.russell ?? {}

const crash =
engine.crash ?? {}

const edgeState =
engine.edgeState ?? {}

const rotationDecay =
engine.rotationDecay ?? {}

const rotationConfirm =
engine.rotationConfirm ?? {}

const master =
engine.master ?? {}

const executionState =
engine.executionState ?? {}

const phaseData =
engine.phaseData ?? {}

/* ======================================================
SCORES
====================================================== */

const putScore =
Number(putTiming?.score?.value ?? 0)

const russellScore =
Number(russell?.score?.value ?? 0)

const crashProb =
Number(crash?.probability ?? 0)

const rotationDecayScore =
Number(rotationDecay?.score ?? 0)

const falseBreakRisk =
Number(rotationConfirm?.falseBreakRisk ?? 0)

const edgeScore =
Number(edgeState?.score ?? 0)

/* ======================================================
MASTER STATE
====================================================== */

const masterMode =
master?.mode ?? “NEUTRAL”

const phase =
phaseData?.phase ??
“PHASE_1_EXPANSION”

const marketMode =
executionState?.marketMode ??
“NEUTRAL”

const riskState =
executionState?.riskState ??
“NORMAL”

/* ======================================================
EDGE STATE
====================================================== */

let edgeStateLabel = “NO_EDGE”

if (edgeScore >= 80) {
edgeStateLabel = “EXTREME”
}

else if (edgeScore >= 60) {
edgeStateLabel = “STRONG”
}

else if (edgeScore >= 40) {
edgeStateLabel = “TRADEABLE”
}

else if (edgeScore >= 20) {
edgeStateLabel = “EARLY”
}

/* ======================================================
BASE
====================================================== */

let finalAction = “WAIT”
let direction = “NEUTRAL”
/* ======================================================

HIERARCHY

    STRUCTURAL REGIME
    RISK STATE
    EXECUTION STATE
    TRADE SETUP
    SIGNAL

====================================================== */

/* ======================================================
CRASH PRIORITY
====================================================== */

if (

masterMode === “CRASH” ||

phase === “PHASE_5_BREAKDOWN” ||

phase === “PHASE_6_ACCELERATION” ||

phase === “PHASE_7_CAPITULATION”

) {

finalAction = “DEFENSIVE SHORT”
direction = “SHORT”
}

/* ======================================================
RISK PRIORITY
====================================================== */

else if (

masterMode === “RISK” ||

marketMode === “RISK_OFF” ||

riskState === “BREAKDOWN”

) {

finalAction = “REDUCE RISK”
direction = “DEFENSIVE”
}

/* ======================================================
NEUTRAL DISTRIBUTION
====================================================== */

else if (

masterMode === “NEUTRAL” ||

phase === “PHASE_3_DISTRIBUTION”

) {

finalAction = “WAIT”
direction = “NEUTRAL”
}

/* ======================================================
LONG ONLY IF STRUCTURE ALLOWS
====================================================== */

else {

if (

russellScore > putScore &&
russellScore >= 5 &&
edgeScore >= 40

) {

finalAction = “BUILD RUSSELL”
direction = “LONG”
}

else if (

putScore > russellScore &&
putScore >= 5 &&
edgeScore >= 40

) {

finalAction = “BUILD PUTS”
direction = “SHORT”
}
}

/* ======================================================
STRUCTURAL SHORT OVERLAY
====================================================== */

if (

rotationDecayScore >= 70 &&

falseBreakRisk >= 80 &&

direction !== “SHORT”

) {

finalAction = “DEFENSIVE SHORT”
direction = “SHORT”
}

/* ======================================================
CONVICTION
====================================================== */

let conviction = edgeScore

if (
crashProb >= 80 &&
direction === “SHORT”
) {
conviction += 10
}

if (
crashProb >= 85 &&
direction === “LONG”
) {
conviction -= 20
}

conviction = Math.max(
0,
Math.min(100, Math.round(conviction))
)

/* ======================================================
EXECUTION MODE
====================================================== */

let execution = {
mode: “WAIT”,
note: “No edge”
}

if (
direction === “NEUTRAL” ||
direction === “DEFENSIVE”
) {

execution = {
mode: “WAIT”,
note: “Structural regime conflict”
}
}

else if (edgeScore >= 80) {

execution = {
mode: “AGGRESSIVE”,
note: “Extreme asymmetric setup”
}
}

else if (edgeScore >= 60) {

execution = {
mode: “BUILD”,
note: “Strong setup”
}
}

else if (edgeScore >= 40) {

execution = {
mode: “SCALE”,
note: “Tradable setup”
}
}

else if (edgeScore >= 20) {

execution = {
mode: “PROBE”,
note: “Early setup”
}
}

/* ======================================================
FINAL SAFETY FILTER
====================================================== */

if (

edgeScore < 20 ||

masterMode === “NEUTRAL” ||

marketMode === “RISK_OFF”

) {

finalAction = “WAIT”
direction = “NEUTRAL”
}

/* ======================================================
RETURN
====================================================== */

return {

finalAction,
direction,

conviction,

edge: {
score: edgeScore,
state: edgeStateLabel
},

execution,

drivers: {

put: putScore,

russell: russellScore,

crashProb,

rotationDecayScore,

falseBreakRisk,

masterMode,

marketMode,

riskState
}
}
}
