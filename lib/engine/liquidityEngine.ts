// /lib/engine/liquidityEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

export interface LiquidityEngineInput {

history?: any[]

marketLiquidityScore?: number

gammaExposure?: number
creditRatio?: number
vixTermRatio?: number
volOfVolRatio?: number

marketData?: any

breadth50?: number
breadth200?: number

correlationScore?: number

participationScore?: number

rsSmall?: number
rsEqual?: number
rsGrowth?: number

rotationScore?: number

rotationDecayScore?: number
rotationDecayState?: string

fragilityScore?: number

hiddenDistribution?: boolean
participationCollapse?: boolean
}

export interface LiquidityEngineOutput {
score: number

state:
| "ABUNDANT"
| "SUPPORTIVE"
| "NEUTRAL"
| "TIGHTENING"
| "LIQUIDITY_STRESS"

liquidityState:
| "BROAD"
| "PASSIVE"
| "NARROW"
| "FRAGILE"
| "ILLUSION"

liquidityImpulse: number

support:
| "STRONG"
| "MODERATE"
| "WEAK"
| "NEGATIVE"

fragility:
| "LOW"
| "ELEVATED"
| "HIGH"

summary: string

marketQuality:
| "HEALTHY"
| "FRAGILE"
| "DETERIORATING"
| "INTERNALLY_WEAK"

institutionalLiquidity:
boolean

metrics: {
liquidity: number

gamma: number
effectiveGamma: number
structuralGammaFloor: number

credit: number
vixTerm: number
volOfVol: number
breadth50: number
breadth200: number
correlation: number
vix: number

participation: number
rotation: number
decay: number
fragility: number

marketQualityScore: number

liquidityTrend: number
creditTrend: number
gammaTrend: number
breadthTrend: number

narrowLeadership: boolean
weakParticipation: boolean
breadthFailure: boolean
equalWeightWeakness: boolean
smallCapWeakness: boolean

passiveFragility: boolean
liquidityIllusion: boolean
dealerCompression: boolean
}
}

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(min, Math.min(max, value))
}

export function liquidityEngine(
input: LiquidityEngineInput
): LiquidityEngineOutput {

const liquidity =
Number(input.marketLiquidityScore ?? 50)

const rawGamma =
Number(input.gammaExposure ?? 0)

const credit =
Number(input.creditRatio ?? 1)

const vixTerm =
Number(input.vixTermRatio ?? 1)

const volOfVol =
Number(input.volOfVolRatio ?? 1)

const breadth50 =
Number(input.breadth50 ?? 50)

const breadth200 =
Number(input.breadth200 ?? 50)

const correlation =
Number(input.correlationScore ?? 0)

const vix =
Number(
input.marketData?.["^VIX"]?.current ?? 20
)

const participationScore =
Number(input.participationScore ?? 50)

const rsSmall =
Number(input.rsSmall ?? 1)

const rsEqual =
Number(input.rsEqual ?? 1)

const rsGrowth =
Number(input.rsGrowth ?? 1)

const rotationScore =
Number(input.rotationScore ?? 50)

const rotationDecayScore =
Number(input.rotationDecayScore ?? 0)

const fragilityScore =
Number(input.fragilityScore ?? 50)

const hiddenDistribution =
input.hiddenDistribution ?? false

const participationCollapse =
input.participationCollapse ?? false

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
LIQUIDITY TRENDS
===================================================== */

const liquidityTrend =
liquidity -
Number(
h10?.marketLiquidityScore ??
liquidity
)

const creditTrend =
credit -
Number(
h10?.creditRatio ??
credit
)

const gammaTrend =
rawGamma -
Number(
h10?.gammaExposure ??
rawGamma
)

const breadthTrend =
breadth50 -
Number(
h10?.breadth50 ??
breadth50
)


/* =====================================================
STRUCTURAL FLAGS
===================================================== */

const stableCredit =
credit <= 0.95

const stressedCredit =
credit >= 1.10

const severeCreditStress =
credit >= 1.20

const healthyTermStructure =
vixTerm > 1.00

const fragileTermStructure =
vixTerm < 0.95

const backwardation =
vixTerm < 0.92

const supportiveBreadth =
breadth50 > 60 &&
breadth200 > 55

const weakBreadth =
breadth50 < 45 ||
breadth200 < 40

const narrowLeadership = (
rsGrowth > 1.03 &&
rsSmall < 0.99 &&
rsEqual < 0.99
)

const megaCapOnlyTape = (
rsGrowth > 1.05 &&
rsSmall < 0.97 &&
rsEqual < 0.97
)

const weakParticipation =
participationScore < 50

const breadthFailure = (
breadth50 < 45 &&
breadth200 < 45
)

const equalWeightWeakness =
rsEqual < 0.99

const smallCapWeakness =
rsSmall < 0.99

const severeRotationDecay =
rotationDecayScore >= 60

/* =====================================================
STRUCTURAL GAMMA FLOOR
===================================================== */

let structuralGammaFloor = 0

if (
vix < 20 &&
vixTerm >= 0.95
) {
structuralGammaFloor = 35
}

if (
vix < 18 &&
vixTerm >= 1 &&
narrowLeadership
) {
structuralGammaFloor = 45
}

if (
vix < 17 &&
breadth50 < 55 &&
narrowLeadership
) {
structuralGammaFloor = 55
}

const effectiveGamma =
Math.max(rawGamma, structuralGammaFloor)

/* =====================================================
NEW CONDITIONS
===================================================== */

const passiveFragility = (
liquidity >= 65 &&
vix < 18 &&
(
weakParticipation ||
narrowLeadership ||
severeRotationDecay
)
)

const liquidityIllusion = (
liquidity >= 70 &&
narrowLeadership &&
breadthFailure &&
weakParticipation
)

const dealerCompression = (
effectiveGamma > 35 &&
vix < 18 &&
correlation < 3 &&
weakParticipation
)

/* =====================================================
MARKET QUALITY SCORE
===================================================== */

let marketQualityScore = 60

marketQualityScore +=
Math.round(
(participationScore - 50) * 0.24
)

marketQualityScore +=
Math.round(
(rotationScore - 50) * 0.18
)

if (narrowLeadership) {
marketQualityScore -= 10
}

if (megaCapOnlyTape) {
marketQualityScore -= 12
}

if (participationCollapse) {
marketQualityScore -= 16
}

if (hiddenDistribution) {
marketQualityScore -= 14
}

if (liquidityIllusion) {
marketQualityScore -= 18
}

if (passiveFragility) {
marketQualityScore -= 10
}

if (dealerCompression) {
marketQualityScore -= 8
}

/* =====================================================
TREND DETERIORATION
===================================================== */

if (liquidityTrend < -8) {
marketQualityScore -= 6
}

if (breadthTrend < -8) {
marketQualityScore -= 6
}

if (
gammaTrend < -15 &&
breadthTrend < 0
) {
marketQualityScore -= 4
}

marketQualityScore = clamp(
Math.round(marketQualityScore)
)

/* =====================================================
MARKET QUALITY STATE
===================================================== */

let marketQuality:
| "HEALTHY"
| "FRAGILE"
| "DETERIORATING"
| "INTERNALLY_WEAK"

if (
marketQualityScore >= 70 &&
!weakParticipation
) {
marketQuality = "HEALTHY"
}

else if (
liquidityIllusion ||
participationCollapse
) {
marketQuality = "INTERNALLY_WEAK"
}

else if (
marketQualityScore < 45
) {
marketQuality = "DETERIORATING"
}

else {
marketQuality = "FRAGILE"
}

/* =====================================================
SCORE
===================================================== */

let score = 55

score +=
Math.round(
(liquidity - 50) * 0.45
)

/*
Effective gamma replaces raw gamma
*/

if (effectiveGamma > 5) {
score += 10
}

if (effectiveGamma > 25) {
score += 5
}

if (rawGamma < -5) {
score -= 10
}

if (stableCredit) {
score += 12
}

if (stressedCredit) {
score -= 10
}

if (severeCreditStress) {
score -= 18
}

if (healthyTermStructure) {
score += 8
}

if (fragileTermStructure) {
score -= 10
}

if (backwardation) {
score -= 16
}

if (weakBreadth) {
score -= 4
}

/* =====================================================
NEW PENALTIES
===================================================== */

if (
narrowLeadership &&
weakParticipation
) {
score -= 20
}

if (liquidityIllusion) {
score -= 18
}

if (passiveFragility) {
score -= 12
}

if (dealerCompression) {
score -= 10
}

if (
equalWeightWeakness &&
smallCapWeakness
) {
score -= 8
}

/*
Structural gamma floor:
quiet compression != healthy liquidity
*/

if (
structuralGammaFloor >= 35 &&
weakParticipation
) {
score -= 8
}

if (
structuralGammaFloor >= 45 &&
narrowLeadership
) {
score -= 10
}

if (
marketQuality === "DETERIORATING"
) {
score -= 16
}

if (
marketQuality === "INTERNALLY_WEAK"
) {
score -= 22
}

/* =====================================================
HISTORICAL LIQUIDITY DECAY
===================================================== */

if (liquidityTrend < -10) {
score -= 8
}

if (liquidityTrend < -20) {
score -= 8
}

if (
breadthTrend < -10 &&
liquidityTrend < 0
) {
score -= 6
}

if (
gammaTrend < -20 &&
breadthTrend < 0
) {
score -= 5
}

score = clamp(
Math.round(score)
)

/* =====================================================
STATE
===================================================== */

let state:
| "ABUNDANT"
| "SUPPORTIVE"
| "NEUTRAL"
| "TIGHTENING"
| "LIQUIDITY_STRESS"

if (score >= 80) {
state = "ABUNDANT"
}

else if (score >= 65) {
state = "SUPPORTIVE"
}

else if (score >= 48) {
state = "NEUTRAL"
}

else if (score >= 30) {
state = "TIGHTENING"
}

else {
state = "LIQUIDITY_STRESS"
}

/* =====================================================
LIQUIDITY STATE
===================================================== */

let liquidityState:
| "BROAD"
| "PASSIVE"
| "NARROW"
| "FRAGILE"
| "ILLUSION"

if (
supportiveBreadth &&
participationScore >= 60
) {
liquidityState = "BROAD"
}

else if (liquidityIllusion) {
liquidityState = "ILLUSION"
}

else if (
narrowLeadership ||
equalWeightWeakness
) {
liquidityState = "NARROW"
}

else if (
weakParticipation ||
breadthFailure
) {
liquidityState = "FRAGILE"
}

else {
liquidityState = "PASSIVE"
}

/* =====================================================
SUPPORT
===================================================== */

let support:
| "STRONG"
| "MODERATE"
| "WEAK"
| "NEGATIVE"

if (score >= 75) {
support = "STRONG"
}

else if (score >= 58) {
support = "MODERATE"
}

else if (score >= 40) {
support = "WEAK"
}

else {
support = "NEGATIVE"
}

/* =====================================================
FRAGILITY
===================================================== */

let fragility:
| "LOW"
| "ELEVATED"
| "HIGH"

if (
liquidityIllusion ||
passiveFragility ||
dealerCompression
) {
fragility = "HIGH"
}

else if (
score < 48 ||
marketQuality === "FRAGILE"
) {
fragility = "ELEVATED"
}

else {
fragility = "LOW"
}

/* =====================================================
INSTITUTIONAL LIQUIDITY
===================================================== */

const institutionalLiquidity = (
stableCredit &&
healthyTermStructure &&
!liquidityIllusion &&
!passiveFragility
)

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Balanced liquidity backdrop"

if (
liquidityState === "BROAD"
) {
summary =
"Broad institutional liquidity participation"
}

if (
liquidityState === "PASSIVE"
) {
summary =
"Passive liquidity support with moderate internals"
}

if (
liquidityState === "NARROW"
) {
summary =
"Liquidity concentrated in narrow leadership"
}

if (
liquidityState === "FRAGILE"
) {
summary =
"Liquidity backdrop structurally fragile"
}

if (
liquidityState === "ILLUSION"
) {
summary =
"Mega-cap liquidity masking severe internal weakness"
}

if (dealerCompression) {
summary += " | Dealer compression"
}

/* =====================================================
RETURN
===================================================== */

return {
score,

state,

liquidityState,

liquidityImpulse:
score - 50,

support,

fragility,

summary,

marketQuality,

institutionalLiquidity,

metrics: {
liquidity,

gamma: rawGamma,
effectiveGamma,
structuralGammaFloor,

credit,
vixTerm,
volOfVol,
breadth50,
breadth200,
correlation,
vix,

participation:
participationScore,

rotation:
rotationScore,

decay:
rotationDecayScore,

fragility:
fragilityScore,

marketQualityScore,

liquidityTrend,
creditTrend,
gammaTrend,
breadthTrend,

narrowLeadership,
weakParticipation,
breadthFailure,
equalWeightWeakness,
smallCapWeakness,

passiveFragility,
liquidityIllusion,
dealerCompression
}
}
}
