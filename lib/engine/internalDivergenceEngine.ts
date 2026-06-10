// /lib/engine/internalDivergenceEngine.ts

export interface InternalDivergenceEngineInput {
spxTrend?: number
spxMomentum?: number

breadth20?: number
breadth50?: number
breadth200?: number

breadth20Slope5d?: number
breadth50Slope5d?: number
breadth200Slope10d?: number

adLine?: number
adSlope5d?: number

rsEqual?: number
rsSmall?: number
rsGrowth?: number

participationScore?: number
rotationScore?: number

concentrationScore?: number
liquidityScore?: number

vix?: number
gammaExposure?: number
}

export interface InternalDivergenceEngineOutput {

score: number

state:
| "HEALTHY"
| "EARLY_DIVERGENCE"
| "STRUCTURAL_DIVERGENCE"
| "INSTITUTIONAL_DISTRIBUTION"

active: boolean

severity:
| "LOW"
| "MODERATE"
| "HIGH"
| "EXTREME"

signals: {
spxRising: boolean

breadthFalling: boolean
participationWeak: boolean

equalWeightWeak: boolean
smallCapsWeak: boolean

narrowLeadership: boolean

adDeterioration: boolean
rotationFailure: boolean

liquidityMasking: boolean
}

summary: string

metrics: {
breadth20: number
breadth50: number
breadth200: number

breadth20Slope5d: number
breadth50Slope5d: number
breadth200Slope10d: number

adSlope5d: number

rsEqual: number
rsSmall: number
rsGrowth: number

participationScore: number
rotationScore: number

concentrationScore: number
liquidityScore: number

vix: number
gammaExposure: number
}
}

export function internalDivergenceEngine(
input: InternalDivergenceEngineInput
): InternalDivergenceEngineOutput {

/* =====================================================
INPUT
===================================================== */

const spxTrend =
Number(input.spxTrend ?? 0)

const spxMomentum =
Number(input.spxMomentum ?? 0)

const breadth20 =
Number(input.breadth20 ?? 50)

const breadth50 =
Number(input.breadth50 ?? 50)

const breadth200 =
Number(input.breadth200 ?? 50)

const breadth20Slope5d =
Number(input.breadth20Slope5d ?? 0)

const breadth50Slope5d =
Number(input.breadth50Slope5d ?? 0)

const breadth200Slope10d =
Number(input.breadth200Slope10d ?? 0)

const adLine =
Number(input.adLine ?? 0)

const adSlope5d =
Number(input.adSlope5d ?? 0)

const rsEqual =
Number(input.rsEqual ?? 1)

const rsSmall =
Number(input.rsSmall ?? 1)

const rsGrowth =
Number(input.rsGrowth ?? 1)

const participationScore =
Number(input.participationScore ?? 50)

const rotationScore =
Number(input.rotationScore ?? 50)

const concentrationScore =
Number(input.concentrationScore ?? 50)

const liquidityScore =
Number(input.liquidityScore ?? 50)

const vix =
Number(input.vix ?? 20)

const gammaExposure =
Number(input.gammaExposure ?? 0)

/* =====================================================
PRIMARY CONDITIONS
===================================================== */

const spxRising =

spxTrend > 0 ||
spxMomentum > 0

const breadthFalling =

breadth20Slope5d < 0 &&
breadth50Slope5d < 0

const severeBreadthFalling =

breadth20Slope5d < -4 &&
breadth50Slope5d < -3

const longTermBreadthDamage =

breadth200Slope10d < -1.5

const participationWeak =
participationScore < 45

const severeParticipationWeak =
participationScore < 38

const equalWeightWeak =
rsEqual < 0.99

const severeEqualWeightWeak =
rsEqual < 0.97

const smallCapsWeak =
rsSmall < 0.99

const severeSmallCapsWeak =
rsSmall < 0.97

const narrowLeadership =

rsGrowth > 1.03 &&
rsEqual < 0.99 &&
rsSmall < 0.99

const severeNarrowLeadership =

rsGrowth > 1.06 &&
rsEqual < 0.97 &&
rsSmall < 0.97

const adDeterioration =
adSlope5d < 0

const severeAdDeterioration =
adSlope5d < -150

const rotationFailure =
rotationScore < 35

const severeRotationFailure =
rotationScore < 25

const liquidityMasking =

liquidityScore > 65 &&
participationScore < 42

/* =====================================================
SCORE
===================================================== */

let score = 10

/* =====================================================
CORE DIVERGENCE
===================================================== */

if (
spxRising &&
breadthFalling
) {
score += 18
}

if (
spxRising &&
severeBreadthFalling
) {
score += 12
}

if (
spxRising &&
longTermBreadthDamage
) {
score += 10
}

/* =====================================================
PARTICIPATION
===================================================== */

if (participationWeak) {
score += 10
}

if (severeParticipationWeak) {
score += 10
}

/* =====================================================
LEADERSHIP
===================================================== */

if (equalWeightWeak) {
score += 8
}

if (smallCapsWeak) {
score += 8
}

if (narrowLeadership) {
score += 10
}

if (severeNarrowLeadership) {
score += 8
}

/* =====================================================
A/D DETERIORATION
===================================================== */

if (adDeterioration) {
score += 6
}

if (severeAdDeterioration) {
score += 8
}

/* =====================================================
ROTATION
===================================================== */

if (rotationFailure) {
score += 8
}

if (severeRotationFailure) {
score += 8
}

/* =====================================================
MASKED FRAGILITY
===================================================== */

if (liquidityMasking) {
score += 10
}

/* =====================================================
VOLATILITY CONTEXT
===================================================== */

if (
vix < 20 &&
narrowLeadership
) {
score += 4
}

if (
gammaExposure > 0 &&
narrowLeadership
) {
score += 4
}

/* =====================================================
CLAMP
===================================================== */

score = Math.max(
0,
Math.min(100, Math.round(score))
)

/* =====================================================
STATE
===================================================== */

let state:
| "HEALTHY"
| "EARLY_DIVERGENCE"
| "STRUCTURAL_DIVERGENCE"
| "INSTITUTIONAL_DISTRIBUTION"

if (score >= 75) {

state =
"INSTITUTIONAL_DISTRIBUTION"

}

else if (score >= 52) {

state =
"STRUCTURAL_DIVERGENCE"

}

else if (score >= 30) {

state =
"EARLY_DIVERGENCE"

}

else {

state =
"HEALTHY"
}

/* =====================================================
SEVERITY
===================================================== */

let severity:
| "LOW"
| "MODERATE"
| "HIGH"
| "EXTREME"

if (score >= 80) {
severity = "EXTREME"
}
else if (score >= 60) {
severity = "HIGH"
}
else if (score >= 35) {
severity = "MODERATE"
}
else {
severity = "LOW"
}

/* =====================================================
ACTIVE
===================================================== */

const active =

state !== "HEALTHY"

/* =====================================================
SUMMARY
===================================================== */

let summary =
"No meaningful internal divergence detected"

if (
state === "EARLY_DIVERGENCE"
) {

summary =
"Early internal divergence emerging beneath index strength"
}

if (
state === "STRUCTURAL_DIVERGENCE"
) {

summary =
"Structural market divergence detected beneath index stability"
}

if (
state ===
"INSTITUTIONAL_DISTRIBUTION"
) {

summary =
"Institutional distribution regime active beneath headline indices"
}

/* =====================================================
RETURN
===================================================== */

return {

score,

state,

active,

severity,

signals: {
spxRising,

breadthFalling,
participationWeak,

equalWeightWeak,
smallCapsWeak,

narrowLeadership,

adDeterioration,
rotationFailure,

liquidityMasking
},

summary,

metrics: {
breadth20,
breadth50,
breadth200,

breadth20Slope5d,
breadth50Slope5d,
breadth200Slope10d,

adSlope5d,

rsEqual,
rsSmall,
rsGrowth,

participationScore,
rotationScore,

concentrationScore,
liquidityScore,

vix,
gammaExposure
}
}

}
