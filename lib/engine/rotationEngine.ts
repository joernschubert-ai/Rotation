// /lib/engine/rotationEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

export interface RotationEngineInput {
rsSmall?: number
rsGrowth?: number
rsEqual?: number

rotation?: any

concentrationScore?: number
futuresVsCash?: number

marketData?: any

breadthThrust?: any
liquidity?: any
fragility?: any
squeeze?: any
participation?: any

structure?: any

breadthTrend?: number
breadthAcceleration?: number
participationDecay?: number
leadershipDecay?: number
relativeBreadthWeakness?: number
}

export interface RotationEngineOutput {
score: number

signal:
| "RISK_ON"
| "RISK_OFF_ROTATION"
| "WEAKNESS"
| "TRANSITION"
| "NEUTRAL"

regime:
| "EARLY"
| "BUILDING"
| "CONFIRMED"
| "EXTREME"

confidence: number

state:
| "HEALTHY_ROTATION"
| "PASSIVE_ROTATION"
| "NARROW_ROTATION"
| "FRAGILE_ROTATION"
| "SQUEEZE_DRIVEN"
| "BREAKDOWN"

narrowLeadership: boolean
breadthFailure: boolean
equalWeightWeakness: boolean
smallCapWeakness: boolean

leadershipBreadth: number
passiveDependence: number
institutionalParticipation: number

internalStrength: number

participationQuality: number
liquiditySupport: number
fragilityRisk: number
squeezeRisk: number

breadthTrend: number
breadthAcceleration: number
participationDecay: number
leadershipDecay: number
relativeBreadthWeakness: number

summary: string

rsSmall: number
rsGrowth: number
rsEqual: number

metrics: any
}

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(min, Math.min(max, value))
}

export function rotationEngine(
data: RotationEngineInput
): RotationEngineOutput {

const rsSmall = Number(
data.rsSmall ??
data.rotation?.rsSmall ??
1
)

const rsGrowth = Number(
data.rsGrowth ??
data.rotation?.rsGrowth ??
1
)

const rsEqual = Number(
data.rsEqual ??
data.rotation?.rsEqual ??
1
)

const concentrationScore = Number(
data.concentrationScore ??
data.rotation?.concentrationScore ??
0
)

const futuresVsCash = Number(
data.futuresVsCash ?? 0
)

const vix = Number(
data.marketData?.["^VIX"]?.current ??
18
)

const breadth50 = Number(
data.structure?.breadth?.b50?.value ??
50
)

const breadth200 = Number(
data.structure?.breadth?.b200?.value ??
50
)

const breadthThrust = Number(
data.breadthThrust?.score ?? 50
)

const liquidity = Number(
data.liquidity?.score ?? 50
)

const fragility = Number(
data.fragility?.score ?? 50
)

const squeeze = Number(
data.squeeze?.risk ?? 50
)

const participation = Number(
data.participation?.score ?? 50
)

const breadthTrend = Number(
data.breadthTrend ?? 0
)

const breadthAcceleration = Number(
data.breadthAcceleration ?? 0
)

const participationDecay = Number(
data.participationDecay ?? 0
)

const leadershipDecay = Number(
data.leadershipDecay ?? 0
)

const relativeBreadthWeakness = Number(
data.relativeBreadthWeakness ?? 0
)

const dSmall = rsSmall - 1
const dGrowth = rsGrowth - 1
const dEqual = rsEqual - 1

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

participationScore: participation
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

let leadershipBreadth = 60

leadershipBreadth +=
Math.round((breadth50 - 50) * 0.18)

leadershipBreadth +=
Math.round((breadth200 - 50) * 0.12)

if (equalWeightWeakness) {
leadershipBreadth -= 8
}

if (smallCapWeakness) {
leadershipBreadth -= 8
}

if (narrowLeadership) {
leadershipBreadth -= 14
}

if (severeNarrowLeadership) {
leadershipBreadth -= 12
}

if (concentrationScore >= 75) {
leadershipBreadth -= 8
}

leadershipBreadth =
clamp(Math.round(leadershipBreadth))

/* =====================================================
PASSIVE DEPENDENCE
===================================================== */

let passiveDependence = 20

if (liquidity > 65) {
passiveDependence += 12
}

if (narrowLeadership) {
passiveDependence += 18
}

if (breadthFailure) {
passiveDependence += 12
}

if (participation < 45) {
passiveDependence += 12
}

if (concentrationScore >= 80) {
passiveDependence += 12
}

passiveDependence =
clamp(Math.round(passiveDependence))

/* =====================================================
INSTITUTIONAL PARTICIPATION
===================================================== */

let institutionalParticipation = 55

institutionalParticipation +=
Math.round((participation - 50) * 0.28)

institutionalParticipation +=
Math.round((breadthThrust - 50) * 0.18)

institutionalParticipation +=
Math.round((breadth50 - 50) * 0.12)

if (equalWeightWeakness) {
institutionalParticipation -= 8
}

if (smallCapWeakness) {
institutionalParticipation -= 8
}

if (narrowLeadership) {
institutionalParticipation -= 12
}

if (breadthFailure) {
institutionalParticipation -= 10
}

institutionalParticipation =
clamp(Math.round(institutionalParticipation))

/* =====================================================
SCORE
===================================================== */

let score = 58

if (dSmall > 0.05) {
score += 14
}
else if (dSmall > 0.02) {
score += 8
}
else if (dSmall > 0.00) {
score += 4
}

if (dSmall < -0.02) {
score -= 6
}

if (dSmall < -0.05) {
score -= 6
}

if (dEqual > 0.02) {
score += 7
}
else if (dEqual > 0) {
score += 3
}

if (dEqual < -0.02) {
score -= 5
}

if (dEqual < -0.05) {
score -= 5
}

if (narrowLeadership) {
score -= 12
}

if (severeNarrowLeadership) {
score -= 15
}

if (
narrowLeadership &&
rsEqual < 0.97
) {
score -= 15
}

if (concentrationScore >= 65) {
score -= 5
}

if (concentrationScore >= 75) {
score -= 5
}

if (concentrationScore >= 85) {
score -= 5
}

if (breadthThrust > 75) {
score += 10
}
else if (breadthThrust > 60) {
score += 5
}
else if (breadthThrust < 35) {
score -= 8
}

if (breadthFailure) {
score -= 10
}

if (liquidity > 70) {
score += 8
}
else if (liquidity > 60) {
score += 4
}
else if (liquidity < 40) {
score -= 8
}

if (participation < 40) {
score -= 8
}

if (participation < 30) {
score -= 10
}

if (
liquidity > 65 &&
narrowLeadership &&
participation < 50
) {
score -= 14
}

if (
liquidity > 70 &&
breadthFailure
) {
score -= 12
}

if (passiveDependence >= 70) {
score -= 12
}
else if (passiveDependence >= 55) {
score -= 6
}

if (institutionalParticipation >= 70) {
score += 8
}

if (institutionalParticipation < 45) {
score -= 8
}

if (institutionalParticipation < 35) {
score -= 10
}

if (breadthTrend < -5) {
score -= 6
}

if (breadthTrend < -10) {
score -= 8
}

if (breadthAcceleration < -5) {
score -= 6
}

if (breadthAcceleration < -10) {
score -= 10
}

if (participationDecay > 10) {
score -= 8
}

if (participationDecay > 20) {
score -= 10
}

if (leadershipDecay > 10) {
score -= 8
}

if (leadershipDecay > 20) {
score -= 10
}

if (relativeBreadthWeakness > 10) {
score -= 6
}

if (relativeBreadthWeakness > 20) {
score -= 10
}

if (
breadthTrend < -8 &&
participationDecay > 10 &&
narrowLeadership
) {
score -= 14
}

if (
leadershipDecay > 15 &&
relativeBreadthWeakness > 15
) {
score -= 12
}

if (fragility > 80) {
score -= 10
}
else if (fragility > 70) {
score -= 6
}

if (squeeze > 75) {
score -= 5
}

if (vix > 30) {
score -= 8
}
else if (vix > 25) {
score -= 5
}
else if (vix > 20) {
score -= 2
}

score =
Math.max(
0,
Math.min(
100,
Math.round(score)
)
)

/* =====================================================
SIGNAL
===================================================== */

let signal:
| "RISK_ON"
| "RISK_OFF_ROTATION"
| "WEAKNESS"
| "TRANSITION"
| "NEUTRAL"

if (score >= 72) {
signal = "RISK_ON"
}
else if (score >= 58) {
signal = "TRANSITION"
}
else if (score >= 45) {
signal = "WEAKNESS"
}
else {
signal = "RISK_OFF_ROTATION"
}

/* =====================================================
REGIME
===================================================== */

let regime:
| "EARLY"
| "BUILDING"
| "CONFIRMED"
| "EXTREME"

if (score >= 82) {
regime = "EXTREME"
}
else if (score >= 68) {
regime = "CONFIRMED"
}
else if (score >= 55) {
regime = "BUILDING"
}
else {
regime = "EARLY"
}

/* =====================================================
STATE
===================================================== */

let state:
| "HEALTHY_ROTATION"
| "PASSIVE_ROTATION"
| "NARROW_ROTATION"
| "FRAGILE_ROTATION"
| "SQUEEZE_DRIVEN"
| "BREAKDOWN"

if (
fragility > 85 &&
liquidity < 35
) {
state = "BREAKDOWN"
}

else if (
squeeze > 75
) {
state = "SQUEEZE_DRIVEN"
}

else if (
passiveDependence >= 65 &&
narrowLeadership &&
participation < 50
) {
state = "PASSIVE_ROTATION"
}

else if (
narrowLeadership
) {
state = "NARROW_ROTATION"
}

else if (
fragility > 72
) {
state = "FRAGILE_ROTATION"
}

else {
state = "HEALTHY_ROTATION"
}

/* =====================================================
CONFIDENCE
===================================================== */

let confidence = score

if (state === "BREAKDOWN") {
confidence -= 20
}

if (state === "NARROW_ROTATION") {
confidence -= 6
}

if (state === "PASSIVE_ROTATION") {
confidence -= 12
}

confidence =
Math.max(
0,
Math.min(
100,
Math.round(confidence)
)
)

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Balanced rotation environment"

if (state === "HEALTHY_ROTATION") {
summary =
"Broad healthy institutional rotation"
}

if (state === "PASSIVE_ROTATION") {
summary =
"Passive mega-cap liquidity masking weak rotation"
}

if (state === "NARROW_ROTATION") {
summary =
"Leadership narrowing beneath the surface"
}

if (state === "FRAGILE_ROTATION") {
summary =
"Rotation structurally fragile"
}

if (state === "SQUEEZE_DRIVEN") {
summary =
"Short squeeze dynamics active"
}

if (state === "BREAKDOWN") {
summary =
"Rotation breakdown conditions"
}

if (breadthTrend < -8) {
summary += " | Breadth deterioration accelerating"
}

if (participationDecay > 12) {
summary += " | Institutional participation fading"
}

if (leadershipDecay > 12) {
summary += " | Leadership decay active"
}

/* =====================================================
RETURN
===================================================== */

return {
score,

signal,

regime,

confidence,

state,

narrowLeadership,

breadthFailure,

equalWeightWeakness,

smallCapWeakness,

leadershipBreadth,

passiveDependence,

institutionalParticipation,

internalStrength: score,

participationQuality:
participation,

liquiditySupport:
liquidity,

fragilityRisk:
fragility,

squeezeRisk:
squeeze,

breadthTrend,
breadthAcceleration,
participationDecay,
leadershipDecay,
relativeBreadthWeakness,

summary,

rsSmall,
rsGrowth,
rsEqual,

metrics: {
dSmall,
dGrowth,
dEqual,

concentrationScore,
futuresVsCash,

vix,

breadthThrust,
liquidity,
fragility,
squeeze,
participation,

breadth50,
breadth200,

leadershipBreadth,
passiveDependence,
institutionalParticipation,

breadthTrend,
breadthAcceleration,
participationDecay,
leadershipDecay,
relativeBreadthWeakness
}
}
}
