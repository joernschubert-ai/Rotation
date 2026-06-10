// /lib/engine/regimePersistenceEngine.ts

export interface RegimePersistenceEngineInput {

breadth50?: number
breadth200?: number

participationScore?: number
rotationDecayScore?: number

dangerScore?: number
fragilityScore?: number

internalDivergenceScore?: number

breadth50History?: number[]
breadth200History?: number[]

participationHistory?: number[]
rotationDecayHistory?: number[]

phase?: string
}

export interface RegimePersistenceEngineOutput {

persistentWeaknessDays: number

persistentBreadthDecay: boolean
persistentParticipationFailure: boolean

persistentRotationStress: boolean
persistentInternalDivergence: boolean

escalationBias: number

state:
| "STABLE"
| "TRANSITION"
| "PERSISTENT_WEAKNESS"
| "STRUCTURAL_DISTRIBUTION"

summary: string

metrics: {
breadthWeakDays: number
participationWeakDays: number
rotationStressDays: number
divergenceDays: number
}
}

export function regimePersistenceEngine(
input: RegimePersistenceEngineInput
): RegimePersistenceEngineOutput {

/* =====================================================
INPUT
===================================================== */

const breadth50 =
Number(input.breadth50 ?? 50)

const breadth200 =
Number(input.breadth200 ?? 50)

const participationScore =
Number(input.participationScore ?? 50)

const rotationDecayScore =
Number(input.rotationDecayScore ?? 0)

const dangerScore =
Number(input.dangerScore ?? 0)

const fragilityScore =
Number(input.fragilityScore ?? 50)

const internalDivergenceScore =
Number(input.internalDivergenceScore ?? 0)

const breadth50History =
Array.isArray(input.breadth50History)
? input.breadth50History
: []

const breadth200History =
Array.isArray(input.breadth200History)
? input.breadth200History
: []

const participationHistory =
Array.isArray(input.participationHistory)
? input.participationHistory
: []

const rotationDecayHistory =
Array.isArray(input.rotationDecayHistory)
? input.rotationDecayHistory
: []

const phase =
input.phase ??
"PHASE_1_EXPANSION"

/* =====================================================
HELPERS
===================================================== */

const countWeakDays = (
arr: number[],
threshold: number,
mode: "below" | "above"
) => {

return arr.filter(v =>

mode === "below"
? v < threshold
: v > threshold

).length
}

/* =====================================================
PERSISTENCE COUNTS
===================================================== */

const breadthWeakDays =

Math.max(

countWeakDays(
breadth50History,
55,
"below"
),

countWeakDays(
breadth200History,
52,
"below"
)

)

const participationWeakDays =

countWeakDays(
participationHistory,
45,
"below"
)

const rotationStressDays =

countWeakDays(
rotationDecayHistory,
40,
"above"
)

const divergenceDays =

countWeakDays(
rotationDecayHistory,
50,
"above"
)

/* =====================================================
PERSISTENCE FLAGS
===================================================== */

const persistentBreadthDecay =

breadthWeakDays >= 8

const persistentParticipationFailure =

participationWeakDays >= 6

const persistentRotationStress =

rotationStressDays >= 6

const persistentInternalDivergence =

divergenceDays >= 5 &&
internalDivergenceScore >= 50

/* =====================================================
PERSISTENT WEAKNESS DAYS
===================================================== */

const persistentWeaknessDays =
Math.max(
breadthWeakDays,
participationWeakDays,
rotationStressDays
)

/* =====================================================
ESCALATION BIAS
===================================================== */

let escalationBias = 0

if (persistentBreadthDecay) {
escalationBias += 10
}

if (persistentParticipationFailure) {
escalationBias += 10
}

if (persistentRotationStress) {
escalationBias += 8
}

if (persistentInternalDivergence) {
escalationBias += 12
}

/* =====================================================
LIVE CONTEXT ESCALATION
===================================================== */

if (
breadth50 < 50 &&
breadth200 < 52
) {
escalationBias += 6
}

if (
participationScore < 40
) {
escalationBias += 8
}

if (
rotationDecayScore > 50
) {
escalationBias += 8
}

if (
dangerScore > 55
) {
escalationBias += 6
}

if (
fragilityScore > 70
) {
escalationBias += 6
}

/* =====================================================
PHASE CONTEXT
===================================================== */

if (
phase === "PHASE_3_DISTRIBUTION"
) {
escalationBias += 6
}

if (
phase === "PHASE_4_RISK"
) {
escalationBias += 10
}

/* =====================================================
CLAMP
===================================================== */

escalationBias = Math.max(
0,
Math.min(100, escalationBias)
)

/* =====================================================
STATE
===================================================== */

let state:
| "STABLE"
| "TRANSITION"
| "PERSISTENT_WEAKNESS"
| "STRUCTURAL_DISTRIBUTION"

if (

persistentInternalDivergence &&
persistentParticipationFailure &&
persistentBreadthDecay

) {

state =
"STRUCTURAL_DISTRIBUTION"

}

else if (

persistentBreadthDecay ||
persistentParticipationFailure ||
persistentRotationStress

) {

state =
"PERSISTENT_WEAKNESS"

}

else if (
escalationBias >= 18
) {

state =
"TRANSITION"

}

else {

state =
"STABLE"
}

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Market regime stable without persistent deterioration"

if (
state === "TRANSITION"
) {

summary =
"Early persistent weakness emerging beneath the surface"
}

if (
state === "PERSISTENT_WEAKNESS"
) {

summary =
"Persistent institutional deterioration developing"
}

if (
state === "STRUCTURAL_DISTRIBUTION"
) {

summary =
"Persistent institutional distribution regime detected"
}

/* =====================================================
RETURN
===================================================== */

return {

persistentWeaknessDays,

persistentBreadthDecay,
persistentParticipationFailure,

persistentRotationStress,
persistentInternalDivergence,

escalationBias,

state,

summary,

metrics: {
breadthWeakDays,
participationWeakDays,
rotationStressDays,
divergenceDays
}
}

}
