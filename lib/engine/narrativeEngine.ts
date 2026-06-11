// /lib/engine/narrativeEngine.ts

export interface NarrativeEngineInput {
participation?: any
rotation?: any
rotationConfirm?: any
breadthVelocity?: any
liquidity?: any
fragility?: any
crash?: any
summary?: any

breadthThrust?: any
masterScore?: any

breadth?: any
concentrationScore?: number
phase?: string
}

export interface NarrativeEngineOutput {
narrative: string

tone:
| "BULLISH"
| "CONSTRUCTIVE"
| "NEUTRAL"
| "DEFENSIVE"
| "BEARISH"

structuralBias:
| "RISK_ON"
| "ROTATION"
| "NEUTRAL"
| "DEFENSIVE"
| "RISK_OFF"

confidence:
| "HIGH"
| "MEDIUM"
| "LOW"

drivers: string[]
risks: string[]
}

function safeNumber(
value: any,
fallback = 0
) {
const n = Number(value)

return Number.isFinite(n)
? n
: fallback
}

export function narrativeEngine(
input: NarrativeEngineInput
): NarrativeEngineOutput {

/* =====================================================
INPUTS
===================================================== */

const participation =
input.participation ?? {}

const rotation =
input.rotation ?? {}

const rotationConfirm =
input.rotationConfirm ?? {}

const breadthVelocity =
input.breadthVelocity ?? {}

const liquidity =
input.liquidity ?? {}

const fragility =
input.fragility ?? {}

const crash =
input.crash ?? {}

/* =====================================================
CORE
===================================================== */

const participationScore =
safeNumber(participation?.score, 50)

const leadershipBreadth =
safeNumber(
participation?.leadershipBreadth,
50
)

const passiveDependence =
safeNumber(
participation?.passiveDependence,
50
)

const institutionalParticipation =
safeNumber(
participation?.institutionalParticipation,
50
)

const equalWeightTrend =
safeNumber(
participation?.equalWeightTrend,
0
)

const smallCapTrend =
safeNumber(
participation?.smallCapTrend,
0
)

const growthBreadthTrend =
safeNumber(
participation?.growthBreadthTrend,
0
)

const rotationScore =
safeNumber(rotation?.score, 50)

const rotationConfidence =
safeNumber(
rotationConfirm?.confidence,
50
)

const breadthVelocityScore =
safeNumber(
breadthVelocity?.score,
50
)

const liquidityScore =
safeNumber(
liquidity?.score,
50
)

const fragilityScore =
safeNumber(
fragility?.score,
50
)

const crashProbability =
safeNumber(
crash?.probability,
0
)

/* =====================================================
TONE
===================================================== */

let tone:
| "BULLISH"
| "CONSTRUCTIVE"
| "NEUTRAL"
| "DEFENSIVE"
| "BEARISH"

if (
crashProbability >= 75 ||
fragilityScore >= 80
) {

tone = "BEARISH"
}

else if (
passiveDependence >= 70 ||
breadthVelocityScore >= 65
) {

tone = "DEFENSIVE"
}

else if (
participationScore >= 65 &&
leadershipBreadth >= 65 &&
rotationScore >= 65
) {

tone = "BULLISH"
}

else if (
rotationScore >= 58
) {

tone = "CONSTRUCTIVE"
}

else {

tone = "NEUTRAL"
}

/* =====================================================
STRUCTURAL BIAS
===================================================== */

let structuralBias:
| "RISK_ON"
| "ROTATION"
| "NEUTRAL"
| "DEFENSIVE"
| "RISK_OFF"

if (
tone === "BULLISH"
) {

structuralBias = "RISK_ON"
}

else if (
tone === "CONSTRUCTIVE"
) {

structuralBias = "ROTATION"
}

else if (
tone === "DEFENSIVE"
) {

structuralBias = "DEFENSIVE"
}

else if (
tone === "BEARISH"
) {

structuralBias = "RISK_OFF"
}

else {

structuralBias = "NEUTRAL"
}

/* =====================================================
CONFIDENCE
===================================================== */

let confidence:
| "HIGH"
| "MEDIUM"
| "LOW"

const confidenceScore = (

participationScore * 0.25 +

leadershipBreadth * 0.20 +

institutionalParticipation * 0.15 +

rotationScore * 0.15 +

liquidityScore * 0.10 +

(100 - fragilityScore) * 0.15

)

if (
confidenceScore >= 72
) {

confidence = "HIGH"
}

else if (
confidenceScore >= 55
) {

confidence = "MEDIUM"
}

else {

confidence = "LOW"
}

/* =====================================================
DRIVERS
===================================================== */

const drivers: string[] = []

if (
participationScore >= 65
) {
drivers.push(
"Broad participation supports trend"
)
}

if (
leadershipBreadth >= 65
) {
drivers.push(
"Leadership breadth remains diversified"
)
}

if (
equalWeightTrend > 0
) {
drivers.push(
"Equal-weight structure improving"
)
}

if (
smallCapTrend > 0
) {
drivers.push(
"Small-cap participation confirming"
)
}

if (
rotationScore >= 65 &&
rotationConfidence >= 70
) {
drivers.push(
"Institutional rotation quality strong"
)
}

if (
liquidityScore >= 65
) {
drivers.push(
"Liquidity backdrop remains supportive"
)
}

/* =====================================================
RISKS
===================================================== */

const risks: string[] = []

if (
passiveDependence >= 65
) {
risks.push(
"Passive-flow dependence elevated"
)
}

if (
leadershipBreadth < 45
) {
risks.push(
"Leadership breadth deteriorating"
)
}

if (
equalWeightTrend < 0
) {
risks.push(
"Equal-weight participation weakening"
)
}

if (
smallCapTrend < 0
) {
risks.push(
"Small-cap confirmation absent"
)
}

if (
breadthVelocityScore >= 60
) {
risks.push(
"Breadth deterioration accelerating"
)
}

if (
fragilityScore >= 65
) {
risks.push(
"Structural fragility elevated"
)
}

/* =====================================================
NARRATIVE
===================================================== */

let narrative =
"Market structure remains balanced."

if (
tone === "BULLISH"
) {

narrative =
"Broad participation, healthy leadership breadth and improving equal-weight participation support a constructive institutional expansion regime."
}

else if (
tone === "CONSTRUCTIVE"
) {

narrative =
"Rotation quality continues improving, but broader confirmation from participation breadth and equal-weight structures is still developing."
}

else if (
tone === "NEUTRAL"
) {

narrative =
"Market internals remain mixed with no dominant structural trend currently confirmed."
}

else if (
tone === "DEFENSIVE"
) {

narrative =
"Surface index stability increasingly depends on concentrated leadership while broader participation and equal-weight structures weaken underneath."
}

else if (
tone === "BEARISH"
) {

narrative =
"Participation, breadth and liquidity conditions have deteriorated simultaneously, increasing structural breakdown risk."
}

/* =====================================================
RETURN
===================================================== */

return {
narrative,

tone,

structuralBias,

confidence,

drivers,

risks
}
}
