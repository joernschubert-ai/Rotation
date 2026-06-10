// /lib/engine/marketQualityEngine.ts

export interface MarketQualityEngineInput {
structure?: any
participation?: any
rotation?: any
breadthThrust?: any
rotationDecay?: any

breadth50?: number
breadth200?: number

participationScore?: number
rotationScore?: number
breadthThrustScore?: number

rsEqual?: number
rsSmall?: number
rsGrowth?: number

concentrationScore?: number

internalDivergence?: any
regimeSync?: any
}

export interface MarketQualityEngineOutput {
score: number

marketIntegrity: number

state:
| "INSTITUTIONAL_EXPANSION"
| "HEALTHY"
| "FRAGILE"
| "INTERNALLY_WEAK"
| "DISTRIBUTION"
| "STRUCTURAL_BREAKDOWN"

quality:
| "HIGH"
| "MEDIUM"
| "LOW"

institutionalParticipation: boolean

internalSynchronization: boolean

leadership:
| "BROAD"
| "NARROW"
| "MEGA_CAP_DISTORTED"

institutionalDistortion: boolean

/*
NEW
*/

leadershipBreadth: number
passiveDependence: number

liquidityCharacter:
| "BROAD"
| "PASSIVE"
| "NARROW"
| "FRAGILE"
| "ILLUSION"

summary: string

metrics: {
breadth50: number
breadth200: number

participationScore: number
rotationScore: number
breadthThrustScore: number

rsEqual: number
rsSmall: number
rsGrowth: number

concentrationScore: number

rotationDecayScore: number

divergenceScore: number
regimeSyncScore: number

participationIntegrity: number
breadthIntegrity: number
rotationIntegrity: number
leadershipIntegrity: number
liquidityIntegrity: number

leadershipBreadth: number
passiveDependence: number
}
}

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(min, Math.min(max, value))
}

export function marketQualityEngine(
input: MarketQualityEngineInput
): MarketQualityEngineOutput {

/* =====================================================
INPUT
===================================================== */

const breadth50 =
Number(
input.breadth50 ??
input.structure?.breadth?.b50?.value ??
50
)

const breadth200 =
Number(
input.breadth200 ??
input.structure?.breadth?.b200?.value ??
50
)

const participationScore =
Number(
input.participationScore ??
input.participation?.score ??
50
)

const rotationScore =
Number(
input.rotationScore ??
input.rotation?.score ??
50
)

const breadthThrustScore =
Number(
input.breadthThrustScore ??
input.breadthThrust?.score ??
50
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

const concentrationScore =
Number(
input.concentrationScore ??
50
)

const rotationDecayScore =
Number(
input.rotationDecay?.score ??
0
)

const divergenceScore =
Number(
input.internalDivergence?.score ??
0
)

const regimeSyncScore =
Number(
input.regimeSync?.score ??
50
)

/* =====================================================
LEADERSHIP
===================================================== */

const narrowLeadership = (

rsGrowth > 1.03 &&

rsEqual < 0.99 &&

rsSmall < 0.99

)

const severeNarrowLeadership = (

rsGrowth > 1.06 &&

rsEqual < 0.97 &&

rsSmall < 0.97

)

const institutionalDistortion = (

severeNarrowLeadership &&

concentrationScore >= 80

)

/* =====================================================
NEW:
LEADERSHIP BREADTH
===================================================== */

let leadershipBreadth = 58

leadershipBreadth +=
Math.round((breadth50 - 50) * 0.22)

leadershipBreadth +=
Math.round((breadth200 - 50) * 0.18)

if (rsEqual < 0.99) {
leadershipBreadth -= 10
}

if (rsSmall < 0.99) {
leadershipBreadth -= 10
}

if (narrowLeadership) {
leadershipBreadth -= 14
}

if (institutionalDistortion) {
leadershipBreadth -= 16
}

leadershipBreadth =
clamp(Math.round(leadershipBreadth))

/* =====================================================
NEW:
PASSIVE DEPENDENCE
===================================================== */

let passiveDependence = 18

if (narrowLeadership) {
passiveDependence += 18
}

if (breadth50 < 50) {
passiveDependence += 12
}

if (participationScore < 48) {
passiveDependence += 14
}

if (concentrationScore >= 75) {
passiveDependence += 14
}

if (rsEqual < 0.97) {
passiveDependence += 10
}

passiveDependence =
clamp(Math.round(passiveDependence))

/* =====================================================
PARTICIPATION
===================================================== */

const strongParticipation = (

participationScore >= 68 &&

breadth50 >= 68 &&

breadth200 >= 60

)

const weakParticipation =
participationScore < 50

/* =====================================================
BASE
===================================================== */

let participationIntegrity = 55

participationIntegrity +=
Math.round((participationScore - 50) * 0.65)

participationIntegrity +=
Math.round((breadth50 - 50) * 0.18)

participationIntegrity +=
Math.round((breadth200 - 50) * 0.14)

if (weakParticipation) {
participationIntegrity -= 12
}

participationIntegrity =
clamp(participationIntegrity)

/* =====================================================
BREADTH
===================================================== */

let breadthIntegrity = 55

breadthIntegrity +=
Math.round((breadth50 - 50) * 0.38)

breadthIntegrity +=
Math.round((breadth200 - 50) * 0.32)

breadthIntegrity +=
Math.round((breadthThrustScore - 50) * 0.18)

if (breadth50 < 45) {
breadthIntegrity -= 10
}

if (breadth200 < 40) {
breadthIntegrity -= 10
}

breadthIntegrity =
clamp(breadthIntegrity)

/* =====================================================
ROTATION
===================================================== */

let rotationIntegrity = 55

rotationIntegrity +=
Math.round((rotationScore - 50) * 0.40)

rotationIntegrity -=
Math.round(rotationDecayScore * 0.28)

if (rotationScore < 40) {
rotationIntegrity -= 10
}

rotationIntegrity =
clamp(rotationIntegrity)

/* =====================================================
LEADERSHIP
===================================================== */

let leadershipIntegrity = 60

leadershipIntegrity +=
Math.round((leadershipBreadth - 50) * 0.35)

if (narrowLeadership) {
leadershipIntegrity -= 18
}

if (institutionalDistortion) {
leadershipIntegrity -= 20
}

/*
NEW:
passive distortion
*/

if (
narrowLeadership &&
rsEqual < 0.97
) {
leadershipIntegrity -= 15
}

leadershipIntegrity =
clamp(leadershipIntegrity)

/* =====================================================
LIQUIDITY
===================================================== */

let liquidityIntegrity = 55

liquidityIntegrity +=
Math.round((regimeSyncScore - 50) * 0.20)

liquidityIntegrity -=
Math.round(divergenceScore * 0.20)

liquidityIntegrity -=
Math.round(passiveDependence * 0.20)

if (passiveDependence >= 70) {
liquidityIntegrity -= 14
}

liquidityIntegrity =
clamp(liquidityIntegrity)

/* =====================================================
MARKET INTEGRITY
===================================================== */

let marketIntegrity = Math.round(

(participationIntegrity * 0.34) +

(breadthIntegrity * 0.24) +

(rotationIntegrity * 0.18) +

(leadershipIntegrity * 0.14) +

(liquidityIntegrity * 0.10)

)

/* =====================================================
OVERLAYS
===================================================== */

if (
narrowLeadership &&
rsEqual < 0.97
) {
marketIntegrity -= 15
}

if (
passiveDependence >= 65
) {
marketIntegrity -= 10
}

if (
strongParticipation &&
leadershipBreadth >= 65
) {
marketIntegrity += 6
}

/*
=====================================================
PHASE 8 FIX
=====================================================
*/

if (
narrowLeadership &&
weakParticipation
) {
marketIntegrity -= 10
}

marketIntegrity =
clamp(Math.round(marketIntegrity))

const score = marketIntegrity

/* =====================================================
SYNC
===================================================== */

const internalSynchronization = (

breadth50 >= 60 &&
breadth200 >= 55 &&
participationScore >= 58 &&
rotationScore >= 55 &&
!narrowLeadership

)

/* =====================================================
LIQUIDITY CHARACTER
===================================================== */

let liquidityCharacter:
| "BROAD"
| "PASSIVE"
| "NARROW"
| "FRAGILE"
| "ILLUSION"

if (
strongParticipation &&
leadershipBreadth > 65 &&
passiveDependence < 40
) {
liquidityCharacter = "BROAD"
}

else if (
passiveDependence >= 75
) {
liquidityCharacter = "ILLUSION"
}

else if (
narrowLeadership
) {
liquidityCharacter = "NARROW"
}

else if (
weakParticipation
) {
liquidityCharacter = "FRAGILE"
}

else {
liquidityCharacter = "PASSIVE"
}

/* =====================================================
STATE
===================================================== */

let state:
| "INSTITUTIONAL_EXPANSION"
| "HEALTHY"
| "FRAGILE"
| "INTERNALLY_WEAK"
| "DISTRIBUTION"
| "STRUCTURAL_BREAKDOWN"

if (
marketIntegrity >= 78 &&
internalSynchronization
) {
state = "INSTITUTIONAL_EXPANSION"
}

else if (
marketIntegrity >= 64
) {
state = "HEALTHY"
}

else if (
marketIntegrity >= 52
) {
state = "FRAGILE"
}

else if (
marketIntegrity >= 40
) {
state = "INTERNALLY_WEAK"
}

else if (
passiveDependence >= 70
) {
state = "DISTRIBUTION"
}

else {
state = "STRUCTURAL_BREAKDOWN"
}

/* =====================================================
QUALITY
===================================================== */

let quality:
| "HIGH"
| "MEDIUM"
| "LOW"

if (marketIntegrity >= 72) {
quality = "HIGH"
}
else if (marketIntegrity >= 48) {
quality = "MEDIUM"
}
else {
quality = "LOW"
}

/* =====================================================
LEADERSHIP
===================================================== */

let leadership:
| "BROAD"
| "NARROW"
| "MEGA_CAP_DISTORTED"

if (institutionalDistortion) {
leadership = "MEGA_CAP_DISTORTED"
}
else if (narrowLeadership) {
leadership = "NARROW"
}
else {
leadership = "BROAD"
}

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Institutional market quality stable"

if (narrowLeadership) {
summary +=
" | Narrow leadership"
}

if (passiveDependence >= 65) {
summary +=
" | Passive dependence elevated"
}

if (liquidityCharacter === "ILLUSION") {
summary +=
" | Liquidity illusion"
}

/* =====================================================
RETURN
===================================================== */

return {
score,

marketIntegrity,

state,

quality,

institutionalParticipation:
strongParticipation,

internalSynchronization,

leadership,

institutionalDistortion,

leadershipBreadth,

passiveDependence,

liquidityCharacter,

summary,

metrics: {
breadth50,
breadth200,

participationScore,
rotationScore,
breadthThrustScore,

rsEqual,
rsSmall,
rsGrowth,

concentrationScore,

rotationDecayScore,

divergenceScore,
regimeSyncScore,

participationIntegrity,
breadthIntegrity,
rotationIntegrity,
leadershipIntegrity,
liquidityIntegrity,

leadershipBreadth,
passiveDependence
}
}
}
