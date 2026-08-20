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

/* =====================================================
LEGACY / COMPATIBILITY
===================================================== */

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

/* =====================================================
NEW REGIME PERSISTENCE MODEL
===================================================== */

score: number

bearishPersistence: boolean
bullishPersistence: boolean

trend:
| "IMPROVING"
| "STABLE"
| "DETERIORATING"

regimeAge: number

distributionRisk: number

recoveryQuality: number

falseRecoveryRisk: number

trendStability: number

marketFatigue: number
}


/* =====================================================
HELPERS
===================================================== */

function clamp(
value: number,
min = 0,
max = 100
): number {

return Math.max(
min,
Math.min(max, value)
)

}


function safeNumber(
value: unknown,
fallback = 0
): number {

const n = Number(value)

return Number.isFinite(n)
? n
: fallback

}


/* =====================================================
COUNT HISTORY
===================================================== */

function countBelow(
values: number[],
threshold: number
): number {

return values.filter(
value => safeNumber(value, 50) < threshold
).length

}


function countAbove(
values: number[],
threshold: number
): number {

return values.filter(
value => safeNumber(value, 0) > threshold
).length

}


/* =====================================================
TREND
===================================================== */

function calculateTrend(
history: number[]
):

"IMPROVING"
| "STABLE"
| "DETERIORATING" {

if (history.length < 3) {
return "STABLE"
}

const clean =
history
.map(v => safeNumber(v, 50))
.filter(Number.isFinite)

if (clean.length < 3) {
return "STABLE"
}

const recent =
clean.slice(
Math.max(0, clean.length - 3)
)

const previous =
clean.slice(
Math.max(
0,
clean.length - 6
),
Math.max(
0,
clean.length - 3
)
)

if (
recent.length === 0 ||
previous.length === 0
) {
return "STABLE"
}

const recentAverage =
recent.reduce(
(sum, value) => sum + value,
0
) / recent.length

const previousAverage =
previous.reduce(
(sum, value) => sum + value,
0
) / previous.length

const delta =
recentAverage - previousAverage

if (delta > 3) {
return "IMPROVING"
}

if (delta < -3) {
return "DETERIORATING"
}

return "STABLE"

}


/* =====================================================
REGIME PERSISTENCE ENGINE
===================================================== */

export function regimePersistenceEngine(
input: RegimePersistenceEngineInput
): RegimePersistenceEngineOutput {


/* =====================================================
INPUT
===================================================== */

const breadth50 =
safeNumber(
input.breadth50,
50
)

const breadth200 =
safeNumber(
input.breadth200,
50
)

const participationScore =
safeNumber(
input.participationScore,
50
)

const rotationDecayScore =
safeNumber(
input.rotationDecayScore,
0
)

const dangerScore =
safeNumber(
input.dangerScore,
0
)

const fragilityScore =
safeNumber(
input.fragilityScore,
50
)

const internalDivergenceScore =
safeNumber(
input.internalDivergenceScore,
0
)


/* =====================================================
HISTORY
===================================================== */

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
HISTORY COUNTS
===================================================== */

const breadthWeakDays =
Math.max(

countBelow(
breadth50History,
55
),

countBelow(
breadth200History,
52
)

)


const participationWeakDays =
countBelow(
participationHistory,
45
)


/*
* Rotation decay:
*
* > 40 = persistent rotation stress
* > 60 = strong stress
*/

const rotationStressDays =
countAbove(
rotationDecayHistory,
40
)


/*
* Divergence history is intentionally conservative.
*
* We do NOT pretend rotation decay itself
* is internal divergence.
*
* Therefore this metric is only activated
* when the live divergence score is meaningful.
*/

const divergenceDays =
internalDivergenceScore >= 50
? Math.max(
1,
countAbove(
rotationDecayHistory,
50
)
)
: 0


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
LIVE WEAKNESS COMPONENTS
===================================================== */

const breadthWeakness =
clamp(
(
(55 - breadth50) * 1.3
) +
(
(52 - breadth200) * 0.7
)
)


const participationWeakness =
clamp(
50 - participationScore
)


const rotationStress =
clamp(
rotationDecayScore
)


const divergenceStress =
clamp(
internalDivergenceScore
)


const dangerStress =
clamp(
dangerScore
)


const fragilityStress =
clamp(
fragilityScore
)


/* =====================================================
PERSISTENCE COMPONENT
===================================================== */

const historicalPersistence =
clamp(
(
breadthWeakDays * 2
) +

(
participationWeakDays * 2
) +

(
rotationStressDays * 1.5
) +

(
divergenceDays * 1.5
)
)


/* =====================================================
REGIME AGE
===================================================== */

const regimeAge =
Math.max(
breadthWeakDays,
participationWeakDays,
rotationStressDays,
divergenceDays
)


/* =====================================================
TREND
===================================================== */

const breadthTrend =
calculateTrend(
breadth50History
)

const participationTrend =
calculateTrend(
participationHistory
)

const rotationTrend =
calculateTrend(
rotationDecayHistory
)


const deterioratingSignals =
[
breadthTrend === "DETERIORATING",
participationTrend === "DETERIORATING",
rotationTrend === "DETERIORATING"
].filter(Boolean).length


const improvingSignals =
[
breadthTrend === "IMPROVING",
participationTrend === "IMPROVING",
rotationTrend === "IMPROVING"
].filter(Boolean).length


let trend:
| "IMPROVING"
| "STABLE"
| "DETERIORATING" =
"STABLE"


if (
deterioratingSignals >= 2
) {

trend =
"DETERIORATING"

}

else if (
improvingSignals >= 2
) {

trend =
"IMPROVING"

}


/* =====================================================
TREND STABILITY
===================================================== */

const trendStability =
clamp(

50

+

(
persistentWeaknessDays * 1.5
)

+

(
trend === "DETERIORATING"
? 15
: 0
)

+

(
trend === "IMPROVING"
? -10
: 0
)

)


/* =====================================================
MARKET FATIGUE
===================================================== */

const marketFatigue =
clamp(

(
persistentWeaknessDays * 2
)

+

(
breadthWeakness * 0.5
)

+

(
participationWeakness * 0.4
)

+

(
rotationStress * 0.3
)

)


/* =====================================================
DISTRIBUTION RISK
===================================================== */

let distributionRisk =

(
breadthWeakness * 0.25
)

+

(
participationWeakness * 0.20
)

+

(
rotationStress * 0.15
)

+

(
divergenceStress * 0.15
)

+

(
historicalPersistence * 0.20
)

+

(
fragilityStress * 0.05
)


/*
* Persistent weakness receives an explicit
* structural premium.
*/

if (
persistentBreadthDecay
) {
distributionRisk += 8
}

if (
persistentParticipationFailure
) {
distributionRisk += 8
}

if (
persistentRotationStress
) {
distributionRisk += 6
}

if (
persistentInternalDivergence
) {
distributionRisk += 10
}


distributionRisk =
clamp(
distributionRisk
)


/* =====================================================
RECOVERY QUALITY
===================================================== */

let recoveryQuality = 50


if (
trend === "IMPROVING"
) {

recoveryQuality += 20

}


if (
breadth50 > 65
) {

recoveryQuality += 10

}


if (
breadth200 > 55
) {

recoveryQuality += 10

}


if (
participationScore > 60
) {

recoveryQuality += 10

}


if (
rotationDecayScore < 30
) {

recoveryQuality += 5

}


/*
* Recovery is not considered healthy
* when structural stress remains high.
*/

if (
fragilityScore > 70
) {

recoveryQuality -= 15

}


if (
distributionRisk > 60
) {

recoveryQuality -= 15

}


recoveryQuality =
clamp(
recoveryQuality
)


/* =====================================================
FALSE RECOVERY RISK
===================================================== */

let falseRecoveryRisk = 0


/*
* Strong breadth with weak participation
* is a classic warning combination.
*/

if (
breadth50 > 60 &&
participationScore < 50
) {

falseRecoveryRisk += 20

}


/*
* Good current breadth but persistent
* historical weakness.
*/

if (
breadth50 > 60 &&
persistentWeaknessDays >= 6
) {

falseRecoveryRisk += 20

}


/*
* Rotation remains stressed while the
* index/breadth recovers.
*/

if (
rotationDecayScore > 50 &&
breadth50 > 60
) {

falseRecoveryRisk += 20

}


if (
fragilityScore > 70
) {

falseRecoveryRisk += 15

}


if (
dangerScore > 50
) {

falseRecoveryRisk += 15

}


falseRecoveryRisk =
clamp(
falseRecoveryRisk
)


/* =====================================================
BEARISH / BULLISH PERSISTENCE
===================================================== */

const bearishPersistence =

(
persistentBreadthDecay
||
persistentParticipationFailure
||
persistentRotationStress
)

&&

(
trend !== "IMPROVING"
||
distributionRisk >= 55
)


const bullishPersistence =

breadth50 > 65

&&

breadth200 > 55

&&

participationScore > 55

&&

rotationDecayScore < 40

&&

trend === "IMPROVING"


/* =====================================================
ESCALATION BIAS
===================================================== */

let escalationBias = 0


if (
persistentBreadthDecay
) {

escalationBias += 10

}


if (
persistentParticipationFailure
) {

escalationBias += 10

}


if (
persistentRotationStress
) {

escalationBias += 8

}


if (
persistentInternalDivergence
) {

escalationBias += 12

}


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


escalationBias =
clamp(
escalationBias
)


/* =====================================================
SCORE
===================================================== */

let score =

(
distributionRisk * 0.45
)

+

(
escalationBias * 0.25
)

+

(
marketFatigue * 0.15
)

+

(
falseRecoveryRisk * 0.15
)


/*
* Strong recovery suppresses persistence,
* but never completely overrides structural
* historical weakness.
*/

if (
recoveryQuality > 75 &&
!persistentBreadthDecay &&
!persistentParticipationFailure
) {

score -= 15

}


score =
clamp(
score
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

persistentInternalDivergence

&&

persistentParticipationFailure

&&

persistentBreadthDecay

) {

state =
"STRUCTURAL_DISTRIBUTION"

}

else if (

persistentBreadthDecay

||

persistentParticipationFailure

||

persistentRotationStress

) {

state =
"PERSISTENT_WEAKNESS"

}

else if (

escalationBias >= 18

||

score >= 35

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

},

score:

Math.round(
score
),

bearishPersistence,

bullishPersistence,

trend,

regimeAge,

distributionRisk:
Math.round(
distributionRisk
),

recoveryQuality:
Math.round(
recoveryQuality
),

falseRecoveryRisk:
Math.round(
falseRecoveryRisk
),

trendStability:
Math.round(
trendStability
),

marketFatigue:
Math.round(
marketFatigue
)

}

}
