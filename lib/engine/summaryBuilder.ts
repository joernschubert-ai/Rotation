// /lib/engine/summaryBuilder.ts

export interface SummaryBuilderInput {
masterScore?: any
participation?: any
rotation?: any
rotationConfirm?: any
breadthVelocity?: any
liquidity?: any
breadthThrust: any
fragility?: any
crash?: any
executionState?: any
regimeSync?: any
}

export interface SummaryBuilderOutput {
headline: string
summary: string
interpretation: string

conviction:
| "VERY_HIGH"
| "HIGH"
| "MEDIUM"
| "LOW"

structuralState:
| "HEALTHY"
| "ROTATING"
| "FRAGILE"
| "DISTRIBUTING"
| "BREAKDOWN"

keyDrivers: string[]

warnings: string[]

institutionalAlignment: boolean
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

export function summaryBuilder(
input: SummaryBuilderInput
): SummaryBuilderOutput {

/* =====================================================
INPUTS
===================================================== */

const master =
input.masterScore ?? {}

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

const execution =
input.executionState ?? {}

const regimeSync =
input.regimeSync ?? {}

/* =====================================================
SCORES
===================================================== */

const masterScore =
safeNumber(master?.score, 50)

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

const rotationScore =
safeNumber(rotation?.score, 50)

const rotationConfidence =
safeNumber(
rotationConfirm?.confidence,
50
)

const liquidityScore =
safeNumber(liquidity?.score, 50)

const fragilityScore =
safeNumber(fragility?.score, 50)

const crashProbability =
safeNumber(crash?.probability, 0)

const breadthVelocityScore =
safeNumber(
breadthVelocity?.score,
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

const institutionalAlignment =
Boolean(
execution?.regimeAlignment ??
regimeSync?.aligned ??
false
)

/* =====================================================
STRUCTURAL STATE
===================================================== */

let structuralState:
| "HEALTHY"
| "ROTATING"
| "FRAGILE"
| "DISTRIBUTING"
| "BREAKDOWN"

if (
crashProbability >= 75 ||
fragilityScore >= 80
) {

structuralState =
"BREAKDOWN"
}

else if (
passiveDependence >= 70 ||
breadthVelocityScore >= 65
) {

structuralState =
"DISTRIBUTING"
}

else if (
participationScore < 45 ||
leadershipBreadth < 45
) {

structuralState =
"FRAGILE"
}

else if (
rotationScore >= 60 &&
rotationConfidence >= 60
) {

structuralState =
"ROTATING"
}

else {

structuralState =
"HEALTHY"
}

/* =====================================================
CONVICTION
===================================================== */

let conviction:
| "VERY_HIGH"
| "HIGH"
| "MEDIUM"
| "LOW"

const convictionScore = (

masterScore * 0.25 +

participationScore * 0.20 +

leadershipBreadth * 0.20 +

rotationScore * 0.15 +

liquidityScore * 0.10 +

institutionalParticipation * 0.10

)

if (
convictionScore >= 78
) {

conviction = "VERY_HIGH"
}

else if (
convictionScore >= 65
) {

conviction = "HIGH"
}

else if (
convictionScore >= 50
) {

conviction = "MEDIUM"
}

else {

conviction = "LOW"
}

/* =====================================================
DRIVERS
===================================================== */

const keyDrivers: string[] = []

if (
participationScore >= 65
) {
keyDrivers.push(
"Broad market participation improving"
)
}

if (
leadershipBreadth >= 65
) {
keyDrivers.push(
"Leadership breadth remains healthy"
)
}

if (
equalWeightTrend > 0
) {
keyDrivers.push(
"Equal-weight participation improving"
)
}

if (
smallCapTrend > 0
) {
keyDrivers.push(
"Small caps confirming participation"
)
}

if (
rotationScore >= 65 &&
rotationConfidence >= 70
) {
keyDrivers.push(
"Rotation quality institutionally confirmed"
)
}

if (
liquidityScore >= 65
) {
keyDrivers.push(
"Liquidity conditions supportive"
)
}

/* =====================================================
WARNINGS
===================================================== */

const warnings: string[] = []

if (
passiveDependence >= 65
) {
warnings.push(
"Market increasingly dependent on passive mega-cap flows"
)
}

if (
leadershipBreadth < 45
) {
warnings.push(
"Leadership breadth deteriorating"
)
}

if (
equalWeightTrend < 0
) {
warnings.push(
"Equal-weight participation weakening"
)
}

if (
smallCapTrend < 0
) {
warnings.push(
"Small-cap participation deteriorating"
)
}

if (
breadthVelocityScore >= 60
) {
warnings.push(
"Internal breadth deterioration accelerating"
)
}

if (
fragilityScore >= 65
) {
warnings.push(
"Structural fragility elevated"
)
}

if (
crashProbability >= 60
) {
warnings.push(
"Crash probability elevated"
)
}

/* =====================================================
HEADLINE
===================================================== */

let headline =
"Balanced market structure"

if (
structuralState === "HEALTHY"
) {
headline =
"Healthy institutional expansion"
}

if (
structuralState === "ROTATING"
) {
headline =
"Constructive rotation regime"
}

if (
structuralState === "FRAGILE"
) {
headline =
"Participation becoming fragile"
}

if (
structuralState === "DISTRIBUTING"
) {
headline =
"Institutional distribution beneath surface"
}

if (
structuralState === "BREAKDOWN"
) {
headline =
"Structural breakdown risk elevated"
}

/* =====================================================
SUMMARY
===================================================== */

const summary = `Participation score ${participationScore}, leadership breadth ${leadershipBreadth}, rotation quality ${rotationScore}, liquidity ${liquidityScore}, fragility ${fragilityScore}.`

/* =====================================================
INTERPRETATION
===================================================== */

let interpretation =
"Market internals remain balanced."

if (
structuralState === "HEALTHY"
) {

interpretation =
"Participation, breadth and rotation remain broadly aligned. Equal-weight and secondary participation confirm institutional expansion."
}

else if (
structuralState === "ROTATING"
) {

interpretation =
"Rotation quality is improving, but participation breadth still requires broader confirmation from equal-weight and small-cap segments."
}

else if (
structuralState === "FRAGILE"
) {

interpretation =
"Surface stability masks weakening participation underneath. Leadership breadth and equal-weight participation are deteriorating."
}

else if (
structuralState === "DISTRIBUTING"
) {

interpretation =
"The index structure increasingly depends on concentrated leadership while broader participation decays. Institutional distribution risk is rising."
}

else if (
structuralState === "BREAKDOWN"
) {

interpretation =
"Multiple internal structures have deteriorated simultaneously. Participation, breadth and liquidity no longer support index stability."
}

/* =====================================================
RETURN
===================================================== */

return {
headline,
summary,
interpretation,

conviction,

structuralState,

keyDrivers,

warnings,

institutionalAlignment
}
}
