// /lib/engine/breadthVelocityEngine.ts

export interface BreadthVelocityInput {
structure?: any

spx?: number
spx5dAgo?: number

breadth20?: number
breadth20_5dAgo?: number

breadth50?: number
breadth50_5dAgo?: number
breadth50_10dAgo?: number

breadth200?: number
breadth200_10dAgo?: number
breadth200_20dAgo?: number

advanceDecline?: number
advanceDecline_5dAgo?: number
}

export interface BreadthVelocityOutput {
score: number

state:
| "EXPANDING"
| "STABLE"
| "DIVERGING"
| "DISTRIBUTION"
| "INTERNAL_BREAKDOWN"

institutionalDivergence: boolean

velocity20: number
velocity50: number

breadth50Trend: number
breadth50Slope: number

breadth200Trend: number
breadth200Slope: number

breadthParticipationDecay: number

breadth50Trend_10d: number
breadth200Trend_20d: number

decayPersistence: number

slopes: {
b20Slope5d: number
b50Slope5d: number
b50Slope10d: number
b200Slope10d: number
b200Slope20d: number
adSlope5d: number
spxSlope5d: number
}

signals: {
shortTermWeakness: boolean
mediumTermWeakness: boolean
longTermWeakness: boolean

adDeterioration: boolean

spxBreadthDivergence: boolean
severeDivergence: boolean

rollingDistribution: boolean
internalBreakdown: boolean
}

summary: string
}

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(min, Math.min(max, value))
}

export function breadthVelocityEngine(
input: BreadthVelocityInput
): BreadthVelocityOutput {

/* =====================================================
INPUTS
===================================================== */

const structure =
input.structure ?? {}

const breadth20 =
Number(
input.breadth20 ??
structure?.breadth?.b20?.value ??
0
)

const breadth20_5dAgo =
Number(
input.breadth20_5dAgo ??
structure?.breadth?.b20?.history?.["5d"] ??
breadth20
)

const breadth50 =
Number(
input.breadth50 ??
structure?.breadth?.b50?.value ??
0
)

const breadth50_5dAgo =
Number(
input.breadth50_5dAgo ??
structure?.breadth?.b50?.history?.["5d"] ??
breadth50
)

const breadth50_10dAgo =
Number(
input.breadth50_10dAgo ??
structure?.breadth?.b50?.history?.["10d"] ??
breadth50_5dAgo
)

const breadth200 =
Number(
input.breadth200 ??
structure?.breadth?.b200?.value ??
0
)

const breadth200_10dAgo =
Number(
input.breadth200_10dAgo ??
structure?.breadth?.b200?.history?.["10d"] ??
breadth200
)

const breadth200_20dAgo =
Number(
input.breadth200_20dAgo ??
structure?.breadth?.b200?.history?.["20d"] ??
breadth200_10dAgo
)

const ad =
Number(
input.advanceDecline ??
structure?.advanceDecline?.value ??
0
)

const ad_5dAgo =
Number(
input.advanceDecline_5dAgo ??
structure?.advanceDecline?.history?.["5d"] ??
ad
)

const spx =
Number(
input.spx ??
structure?.spx?.value ??
0
)

const spx5dAgo =
Number(
input.spx5dAgo ??
structure?.spx?.history?.["5d"] ??
spx
)

/* =====================================================
SLOPES
===================================================== */

const b20Slope5d =
Number(
(
breadth20 - breadth20_5dAgo
).toFixed(2)
)

const b50Slope5d =
Number(
(
breadth50 - breadth50_5dAgo
).toFixed(2)
)

const b50Slope10d =
Number(
(
breadth50 - breadth50_10dAgo
).toFixed(2)
)

const b200Slope10d =
Number(
(
breadth200 - breadth200_10dAgo
).toFixed(2)
)

const b200Slope20d =
Number(
(
breadth200 - breadth200_20dAgo
).toFixed(2)
)

const adSlope5d =
Number(
(
ad - ad_5dAgo
).toFixed(2)
)

const spxSlope5d =
Number(
(
spx - spx5dAgo
).toFixed(2)
)

/* =====================================================
RELATIVE BREADTH SYSTEM
===================================================== */

const breadth50Trend =
Math.round(
(
b50Slope5d * 0.6 +
b50Slope10d * 0.4
)
)

const breadth50Slope =
Math.round(b50Slope5d)

const breadth200Trend =
Math.round(
(
b200Slope10d * 0.55 +
b200Slope20d * 0.45
)
)

const breadth200Slope =
Math.round(b200Slope10d)

let breadthParticipationDecay = 0

if (b20Slope5d < 0) {
breadthParticipationDecay += 3
}

if (b50Slope5d < 0) {
breadthParticipationDecay += 5
}

if (b50Slope10d < 0) {
breadthParticipationDecay += 6
}

if (b200Slope10d < 0) {
breadthParticipationDecay += 4
}

if (b200Slope20d < 0) {
breadthParticipationDecay += 4
}

if (adSlope5d < 0) {
breadthParticipationDecay += 3
}

breadthParticipationDecay =
Math.min(30, breadthParticipationDecay)

/* =====================================================
VELOCITY
===================================================== */

const velocity20 =
Math.round(b20Slope5d)

const velocity50 =
Math.round(b50Slope5d)

/* =====================================================
PERSISTENCE
===================================================== */

let decayPersistence = 0

if (b20Slope5d < 0) {
decayPersistence += 3
}

if (b50Slope5d < 0) {
decayPersistence += 4
}

if (b50Slope10d < 0) {
decayPersistence += 4
}

if (b200Slope20d < 0) {
decayPersistence += 3
}

if (adSlope5d < 0) {
decayPersistence += 2
}

decayPersistence =
Math.min(20, decayPersistence)

/* =====================================================
FLAGS
===================================================== */

const shortTermWeakness =
b20Slope5d < -3

const mediumTermWeakness =
b50Slope5d < -2

const longTermWeakness =
b200Slope10d < -2

const adDeterioration =
adSlope5d < 0

/* =====================================================
INSTITUTIONAL DIVERGENCE
===================================================== */

const spxBreadthDivergence = (
spxSlope5d > 0 &&
b50Slope5d < 0
)

const severeDivergence = (
spxSlope5d > 1 &&
b50Slope5d < -3 &&
adSlope5d < 0
)

const rollingDistribution = (
spxBreadthDivergence &&
mediumTermWeakness &&
adDeterioration
)

const internalBreakdown = (
b20Slope5d < -5 &&
b50Slope5d < -4 &&
b200Slope10d < -2 &&
adSlope5d < 0
)

const institutionalDivergence = (
spxBreadthDivergence ||
rollingDistribution ||
severeDivergence
)

/* =====================================================
SCORE
===================================================== */

let score = 15

if (shortTermWeakness) {
score += 10
}

if (b20Slope5d < -6) {
score += 8
}

if (mediumTermWeakness) {
score += 14
}

if (b50Slope5d < -5) {
score += 10
}

if (longTermWeakness) {
score += 14
}

if (b200Slope10d < -5) {
score += 10
}

if (adDeterioration) {
score += 10
}

if (adSlope5d < -150) {
score += 8
}

if (spxBreadthDivergence) {
score += 12
}

if (severeDivergence) {
score += 12
}

if (rollingDistribution) {
score += 10
}

if (internalBreakdown) {
score += 15
}

score += Math.round(
breadthParticipationDecay * 0.7
)

score += Math.round(
decayPersistence * 0.9
)

/* =====================================================
CLAMP
===================================================== */

score = clamp(
Math.round(score)
)

/* =====================================================
STATE
===================================================== */

let state:
| "EXPANDING"
| "STABLE"
| "DIVERGING"
| "DISTRIBUTION"
| "INTERNAL_BREAKDOWN"

if (score >= 75) {

state =
"INTERNAL_BREAKDOWN"

}

else if (score >= 55) {

state =
"DISTRIBUTION"

}

else if (score >= 35) {

state =
"DIVERGING"

}

else if (score >= 20) {

state =
"STABLE"

}

else {

state =
"EXPANDING"

}

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Healthy breadth expansion"

if (state === "STABLE") {
summary =
"Breadth stable with minor internal rotation"
}

if (state === "DIVERGING") {
summary =
"SPX advancing while breadth deteriorates"
}

if (state === "DISTRIBUTION") {
summary =
"Institutional distribution beneath index stability"
}

if (state === "INTERNAL_BREAKDOWN") {
summary =
"Broad internal breakdown accelerating"
}

/* =====================================================
RETURN
===================================================== */

return {

score,

state,

institutionalDivergence,

velocity20,
velocity50,

breadth50Trend,
breadth50Slope,

breadth200Trend,
breadth200Slope,

breadthParticipationDecay,

breadth50Trend_10d:
b50Slope10d,

breadth200Trend_20d:
b200Slope20d,

decayPersistence,

slopes: {
b20Slope5d,
b50Slope5d,
b50Slope10d,
b200Slope10d,
b200Slope20d,
adSlope5d,
spxSlope5d
},

signals: {
shortTermWeakness,
mediumTermWeakness,
longTermWeakness,

adDeterioration,

spxBreadthDivergence,
severeDivergence,

rollingDistribution,
internalBreakdown
},

summary
}
}
