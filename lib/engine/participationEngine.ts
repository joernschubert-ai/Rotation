// /lib/engine/participationEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

export interface ParticipationEngineInput {

history?: any[]

breadth20?: number
breadth50?: number
breadth200?: number

structure?: any

highs?: number
lows?: number

rsEqual?: number
rsSmall?: number
rsGrowth?: number

rotation?: any

divergenceState?: string
concentrationScore?: number
rotationScore?: number

previousParticipationScore?: number
previousParticipation10d?: number
previousParticipation20d?: number

previousLeadershipBreadth?: number
previousPassiveDependence?: number

previousRsEqual?: number
previousRsSmall?: number
previousGrowthBreadth?: number

previousBreadth50?: number
previousBreadth50_10d?: number

previousBreadth200?: number
previousBreadth200_20d?: number
}

export interface ParticipationEngineOutput {
score: number

state:
| "STRONG"
| "HEALTHY"
| "FRAGILE"
| "WEAK"

quality:
| "HIGH"
| "MEDIUM"
| "LOW"

expansion: boolean

participationVelocity: number
participationDecayRate: number

participationSlope: number
participationAcceleration: number

breadth50Trend: number
breadth50Slope: number

breadth200Trend: number
breadth200Slope: number

breadthParticipationDecay: number

leadershipBreadthTrend: number
megaCapDependenceTrend: number

equalWeightTrend: number
smallCapTrend: number
growthBreadthTrend: number

decayPersistence: number

narrowLeadership: boolean
severeNarrowLeadership: boolean

equalWeightWeakness: boolean
smallCapWeakness: boolean
breadthFailure: boolean

institutionalParticipation: number
passiveDependence: number
leadershipBreadth: number

summary: string

metrics: any
}

function normalizePercent(
value: number
): number {

if (!Number.isFinite(value)) {
return 50
}

return value <= 1
? value * 100
: value
}

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(min, Math.min(max, value))
}

export function participationEngine(
input: ParticipationEngineInput
): ParticipationEngineOutput {

/* =====================================================
INPUT
===================================================== */

const breadth20 =
normalizePercent(
Number(
input.breadth20 ??
input.structure?.breadth?.b20?.value ??
50
)
)

const breadth50 =
normalizePercent(
Number(
input.breadth50 ??
input.structure?.breadth?.b50?.value ??
50
)
)

const breadth200 =
normalizePercent(
Number(
input.breadth200 ??
input.structure?.breadth?.b200?.value ??
50
)
)

const highs =
Number(
input.highs ??
input.structure?.highsLows?.highs ??
0
)

const lows =
Number(
input.lows ??
input.structure?.highsLows?.lows ??
0
)

const rsEqual =
Number(
input.rsEqual ??
input.rotation?.rsEqual ??
1
)

const rsSmall =
Number(
input.rsSmall ??
input.rotation?.rsSmall ??
1
)

const rsGrowth =
Number(
input.rsGrowth ??
input.rotation?.rsGrowth ??
1
)

const divergenceState =
input.divergenceState ??
"NONE"

const concentrationScore =
Number(
input.concentrationScore ??
input.rotation?.concentrationScore ??
50
)

const rotationScore =
Number(
input.rotationScore ??
input.rotation?.score ??
50
)

/* =====================================================
HISTORY
===================================================== */

const history =
input.history ?? []

const h5 =
history.length >= 5
? history[history.length - 5]
: null

const h10 =
history.length >= 10
? history[history.length - 10]
: null

const h20 =
history.length >= 20
? history[history.length - 20]
: null

/* =====================================================
RELATIVE BREADTH SYSTEM
===================================================== */

const previousBreadth50 =
Number(
input.previousBreadth50 ??
h5?.breadth50 ??
breadth50
)

const previousBreadth50_10d =
Number(
input.previousBreadth50_10d ??
h10?.breadth50 ??
previousBreadth50
)

const previousBreadth200 =
Number(
input.previousBreadth200 ??
h10?.breadth200 ??
breadth200
)

const previousBreadth200_20d =
Number(
input.previousBreadth200_20d ??
h20?.breadth200 ??
previousBreadth200
)

const breadth50Slope =
Math.round(
breadth50 - previousBreadth50
)

const breadth50Trend =
Math.round(
(
(breadth50 - previousBreadth50) * 0.6 +
(breadth50 - previousBreadth50_10d) * 0.4
)
)

const breadth200Slope =
Math.round(
breadth200 - previousBreadth200
)

const breadth200Trend =
Math.round(
(
(breadth200 - previousBreadth200) * 0.55 +
(breadth200 - previousBreadth200_20d) * 0.45
)
)

/* =====================================================
CENTRAL MARKET STRUCTURE FLAGS
===================================================== */

const structureFlags =
getMarketStructureFlags({
rsGrowth,
rsSmall,
rsEqual,

breadth50,
breadth200,

highs,
lows
});

const {
equalWeightWeakness,
smallCapWeakness,

narrowLeadership,
severeNarrowLeadership,

breadthFailure
} = structureFlags;

/* =====================================================
LEADERSHIP BREADTH
===================================================== */

let leadershipBreadth = 58

leadershipBreadth +=
Math.round((breadth50 - 50) * 0.22)

leadershipBreadth +=
Math.round((breadth200 - 50) * 0.18)

if (equalWeightWeakness) {
leadershipBreadth -= 12
}

if (smallCapWeakness) {
leadershipBreadth -= 12
}

if (narrowLeadership) {
leadershipBreadth -= 14
}

leadershipBreadth = clamp(leadershipBreadth)

/* =====================================================
PASSIVE DEPENDENCE
===================================================== */

let passiveDependence = 18

if (narrowLeadership) {
passiveDependence += 18
}

if (breadth50 < 50) {
passiveDependence += 12
}

if (breadth200 < 45) {
passiveDependence += 10
}

if (concentrationScore >= 70) {
passiveDependence += 14
}

if (equalWeightWeakness) {
passiveDependence += 8
}

passiveDependence = clamp(passiveDependence)

/* =====================================================
INSTITUTIONAL PARTICIPATION
===================================================== */

let institutionalParticipation = 55

institutionalParticipation +=
Math.round((breadth20 - 50) * 0.10)

institutionalParticipation +=
Math.round((breadth50 - 50) * 0.22)

institutionalParticipation +=
Math.round((breadth200 - 50) * 0.18)

if (highs > lows) {
institutionalParticipation += 6
}

if (narrowLeadership) {
institutionalParticipation -= 14
}

if (passiveDependence >= 65) {
institutionalParticipation -= 12
}

institutionalParticipation =
clamp(institutionalParticipation)

/* =====================================================
BASE SCORE
===================================================== */

let score = 60

score +=
Math.round(
(breadth20 - 50) * 0.08
)

score +=
Math.round(
(breadth50 - 50) * 0.18
)

score +=
Math.round(
(breadth200 - 50) * 0.16
)

/* =====================================================
RELATIVE BREADTH PENALTIES
===================================================== */

if (breadth50Trend < -4) {
score -= 6
}

if (breadth200Trend < -3) {
score -= 6
}

/* =====================================================
INTERNALS
===================================================== */

if (highs > lows) {
score += 6
}

else if (lows > highs) {

const hlDelta =
Math.min(
8,
Math.abs(lows - highs)
)

score -=
Math.round(hlDelta * 0.5)
}

/* =====================================================
LEADERSHIP QUALITY
===================================================== */

if (equalWeightWeakness) {
score -= 6
}

if (smallCapWeakness) {
score -= 6
}

if (narrowLeadership) {
score -= 10
}

if (severeNarrowLeadership) {
score -= 10
}

/* =====================================================
PASSIVE MARKET PENALTY
===================================================== */

if (
narrowLeadership &&
rsEqual < 0.97
) {
score -= 15
}

if (
passiveDependence >= 70
) {
score -= 10
}

/* =====================================================
ROTATION
===================================================== */

score +=
Math.round(
(rotationScore - 50) * 0.10
)

/* =====================================================
BREADTH FAILURE
===================================================== */

if (breadthFailure) {
score -= 12
}

/* =====================================================
DIVERGENCE
===================================================== */

if (
divergenceState ===
"BEARISH_DIVERGENCE"
) {
score -= 6
}

/* =====================================================
STRUCTURAL BONUS
===================================================== */

if (
breadth50 > 72 &&
breadth200 > 62 &&
!narrowLeadership
) {
score += 8
}

/* =====================================================
VELOCITY / DECAY
===================================================== */

const previousParticipationScore =
Number(
input.previousParticipationScore ??
h5?.participationScore ??
score
)

const previousParticipation10d =
Number(
input.previousParticipation10d ??
h10?.participationScore ??
previousParticipationScore
)

const previousParticipation20d =
Number(
input.previousParticipation20d ??
h20?.participationScore ??
previousParticipation10d
)

const participationVelocity =
Math.round(
score - previousParticipationScore
)

const participationDecayRate =
Math.round(
score - previousParticipation10d
)

const participationSlope =
Math.round(
(
score -
previousParticipation20d
) / 2
)

const participationAcceleration =
Math.round(
participationVelocity -
participationDecayRate
)

if (
participationDecayRate <= -15
) {
score -= 8
}

/* =====================================================
RELATIVE TRENDS
===================================================== */

const previousLeadershipBreadth =
Number(
input.previousLeadershipBreadth ??
leadershipBreadth
)

const previousPassiveDependence =
Number(
input.previousPassiveDependence ??
passiveDependence
)

const leadershipBreadthTrend =
Math.round(
leadershipBreadth -
previousLeadershipBreadth
)

const megaCapDependenceTrend =
Math.round(
passiveDependence -
previousPassiveDependence
)

const previousRsEqual =
Number(
input.previousRsEqual ??
rsEqual
)

const previousRsSmall =
Number(
input.previousRsSmall ??
rsSmall
)

const previousGrowthBreadth =
Number(
input.previousGrowthBreadth ??
rsGrowth
)

const equalWeightTrend =
Number(
(
(rsEqual - previousRsEqual) * 100
).toFixed(2)
)

const smallCapTrend =
Number(
(
(rsSmall - previousRsSmall) * 100
).toFixed(2)
)

const growthBreadthTrend =
Number(
(
(rsGrowth - previousGrowthBreadth) * 100
).toFixed(2)
)

/* =====================================================
BREADTH PARTICIPATION DECAY
===================================================== */

let breadthParticipationDecay = 0

if (breadth50Slope < 0) {
breadthParticipationDecay += 4
}

if (breadth50Trend < 0) {
breadthParticipationDecay += 5
}

if (breadth200Slope < 0) {
breadthParticipationDecay += 3
}

if (breadth200Trend < 0) {
breadthParticipationDecay += 4
}

if (participationVelocity < 0) {
breadthParticipationDecay += 4
}

if (participationDecayRate < 0) {
breadthParticipationDecay += 5
}

breadthParticipationDecay =
Math.min(30, breadthParticipationDecay)

/* =====================================================
DECAY PERSISTENCE
===================================================== */

let decayPersistence = 0

if (participationVelocity < 0) {
decayPersistence += 3
}

if (participationDecayRate < 0) {
decayPersistence += 4
}

if (participationSlope < 0) {
decayPersistence += 5
}

if (leadershipBreadthTrend < 0) {
decayPersistence += 3
}

if (equalWeightTrend < 0) {
decayPersistence += 2
}

if (smallCapTrend < 0) {
decayPersistence += 2
}

if (breadth50Trend < 0) {
decayPersistence += 3
}

if (breadth200Trend < 0) {
decayPersistence += 3
}

decayPersistence =
Math.min(20, decayPersistence)

/* =====================================================
FINAL SCORE
===================================================== */

score = clamp(
Math.round(score)
)

/* =====================================================
STATE
===================================================== */

let state:
| "STRONG"
| "HEALTHY"
| "FRAGILE"
| "WEAK"

if (score >= 70) {
state = "STRONG"
}

else if (score > 50) {
state = "HEALTHY"
}

else if (score > 45) {
state = "FRAGILE"
}

else {
state = "WEAK"
}

/* =====================================================
QUALITY
===================================================== */

let quality:
| "HIGH"
| "MEDIUM"
| "LOW"

if (score >= 72) {
quality = "HIGH"
}

else if (score >= 48) {
quality = "MEDIUM"
}

else {
quality = "LOW"
}

/* =====================================================
EXPANSION
===================================================== */

const expansion =

breadth20 > 72 &&
breadth50 > 68 &&
breadth200 > 60 &&

highs > lows &&

rsEqual >= 1 &&
rsSmall >= 1 &&

!narrowLeadership

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Average market participation"

if (state === "STRONG") {
summary =
"Broad institutional participation"
}

if (state === "HEALTHY") {
summary =
"Healthy institutional participation"
}

if (state === "FRAGILE") {

if (
passiveDependence >= 60
) {
summary =
"Participation fragile – passive liquidity masking weakening internals"
}

else if (
narrowLeadership
) {
summary =
"Participation fragile – concentrated in mega caps"
}

else {
summary =
"Participation becoming fragile"
}
}

if (state === "WEAK") {
summary =
"Participation breakdown active"
}

/* =====================================================
RETURN
===================================================== */

return {
score,

state,

quality,

expansion,

participationVelocity,

participationDecayRate,

participationSlope,

participationAcceleration,

breadth50Trend,
breadth50Slope,

breadth200Trend,
breadth200Slope,

breadthParticipationDecay,

leadershipBreadthTrend,

megaCapDependenceTrend,

equalWeightTrend,

smallCapTrend,

growthBreadthTrend,

decayPersistence,

narrowLeadership,

severeNarrowLeadership,

equalWeightWeakness,

smallCapWeakness,

breadthFailure,

institutionalParticipation,

passiveDependence,

leadershipBreadth,

summary,

metrics: {
breadth20,
breadth50,
breadth200,

breadth50Trend,
breadth50Slope,

breadth200Trend,
breadth200Slope,

breadthParticipationDecay,

highs,
lows,

rsEqual,
rsSmall,
rsGrowth,

concentrationScore,
rotationScore,

institutionalParticipation,
passiveDependence,
leadershipBreadth
}
}
}
