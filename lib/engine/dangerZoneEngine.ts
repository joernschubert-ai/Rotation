// /lib/engine/dangerZoneEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(min, Math.min(max, value))
}

export interface DangerZoneInput {

history?: {
phasePersistence?: number

prolongedDistribution?: boolean
prolongedBearRegime?: boolean

institutionalPressure?: number

averageBreadth?: number
averageParticipation?: number
averageRotation?: number
averageLiquidity?: number
averageFragility?: number

breadthTrend?: number
participationDecay?: number
crashTrend?: number

fragilityScore?: number
}

crashProbability: number
crashMomentum: number

breadth50: number
breadth200: number

liquidityVacuumScore: number
correlationScore: number

gammaExposure: number

volOfVolRatio: number

creditRatio: number

vix: number
vixTermRatio?: number

participationScore?: number

rotationDecayScore?: number
rotationDecayState?: string

breadthThrustScore?: number

rsSmall?: number
rsEqual?: number
rsGrowth?: number

earlyWarning?: boolean

marketQuality?: {
score?: number
state?: string

institutionalQuality?: number

liquidityQuality?: number
participationQuality?: number
breadthQuality?: number
rotationQuality?: number

fragileLiquidity?: boolean
liquidityTrap?: boolean

fakeStability?: boolean
passiveStability?: boolean
liquiditySupportedStability?: boolean
institutionalStability?: boolean

narrowLeadership?: boolean
internalWeakness?: boolean
hiddenDistribution?: boolean
}
}

export interface DangerZoneOutput {
score: number

level:
| "LOW"
| "ELEVATED"
| "HIGH"
| "EXTREME"

escalation: boolean

components: {
crash: number
breadth: number
liquidity: number
correlation: number
gamma: number
volatility: number
credit: number

participation: number
concentration: number
decay: number

marketQuality: number
history: number
}

clusters: {
internalWeaknessCluster: number
distributionCluster: number
liquidityFragilityCluster: number
crashExpansionCluster: number
structuralFragilityCluster: number

passiveFragilityCluster: number
liquidityIllusionCluster: number
dealerCompressionCluster: number
historicalWeaknessCluster: number
}

meta: {
narrowLeadership: boolean
megaCapConcentration: boolean

passiveStability: boolean
liquiditySupportedStability: boolean
institutionalStability: boolean

synchronizedBreakdown: boolean
volatilityExpansion: boolean
liquidityFragility: boolean
acceleratingDecay: boolean

liquidityIllusion: boolean
dealerCompression: boolean
passiveFragility: boolean

prolongedDistribution: boolean
prolongedBearRegime: boolean
phasePersistence: number
institutionalPressure: number

effectiveGamma: number
}
}

export function dangerZoneEngine(
input: DangerZoneInput
): DangerZoneOutput {

const {
crashProbability,
crashMomentum,

breadth50,
breadth200,

liquidityVacuumScore,
correlationScore,

gammaExposure,

volOfVolRatio,

creditRatio,

vix,
vixTermRatio = 1,

participationScore = 50,

rotationDecayScore = 0,
rotationDecayState = "HEALTHY_ROTATION",

breadthThrustScore = 50,

rsSmall = 1,
rsEqual = 1,
rsGrowth = 1,

earlyWarning = false,

marketQuality = {}
} = input

/* =====================================================
STRUCTURAL GAMMA FLOOR
===================================================== */

const calmContango =
vix < 20 &&
vixTermRatio >= 0.95 &&
vixTermRatio <= 1.08

let effectiveGamma =
Number(gammaExposure ?? 0)

if (calmContango) {
effectiveGamma =
Math.max(
effectiveGamma,
35
)
}

if (
calmContango &&
breadth50 < 60
) {
effectiveGamma =
Math.max(
effectiveGamma,
45
)
}

if (
calmContango &&
rsGrowth > 1.05 &&
rsSmall < 0.98
) {
effectiveGamma =
Math.max(
effectiveGamma,
55
)
}

const marketQualityScore =
Number(marketQuality?.score ?? 50)

const history = input.history ?? {}

const phasePersistence =
Number(history.phasePersistence ?? 0)

const prolongedDistribution =
history.prolongedDistribution ?? false

const prolongedBearRegime =
history.prolongedBearRegime ?? false

const institutionalPressure =
Number(history.institutionalPressure ?? 0)

const averageBreadth =
Number(history.averageBreadth ?? 70)

const averageParticipation =
Number(history.averageParticipation ?? 70)

const averageRotation =
Number(history.averageRotation ?? 70)

const averageLiquidity =
Number(history.averageLiquidity ?? 70)

const averageFragility =
Number(history.averageFragility ?? 50)

const breadthTrendHistory =
Number(history.breadthTrend ?? 0)

const participationDecayHistory =
Number(history.participationDecay ?? 0)

const crashTrendHistory =
Number(history.crashTrend ?? 0)

const institutionalQuality =
Number(
marketQuality?.institutionalQuality ??
50
)

const liquidityQuality =
Number(
marketQuality?.liquidityQuality ??
50
)

const participationQuality =
Number(
marketQuality?.participationQuality ??
50
)

const breadthQuality =
Number(
marketQuality?.breadthQuality ??
50
)

const rotationQuality =
Number(
marketQuality?.rotationQuality ??
50
)

const fragileLiquidity =
marketQuality?.fragileLiquidity ??
false

const liquidityTrap =
marketQuality?.liquidityTrap ??
false

const fakeStability =
marketQuality?.fakeStability ??
false

const passiveStability =
marketQuality?.passiveStability ??
(
vix < 18 &&
breadth50 > 55 &&
participationScore < 45
)

const liquiditySupportedStability =
marketQuality?.liquiditySupportedStability ??
(
liquidityVacuumScore <= 3 &&
(
participationScore < 45 ||
rotationDecayScore > 65 ||
breadthThrustScore < 40
)
)

const institutionalStability =
marketQuality?.institutionalStability ??
(
marketQualityScore >= 60 &&
institutionalQuality >= 58 &&
participationScore >= 55 &&
rotationDecayScore < 45
)

const mqNarrowLeadership =
marketQuality?.narrowLeadership ??
false

const internalWeakness =
marketQuality?.internalWeakness ??
false

const hiddenDistribution =
marketQuality?.hiddenDistribution ??
false

const narrowLeadership =
(
rsGrowth > 1.03 &&
rsSmall < 1 &&
rsEqual < 1
) || mqNarrowLeadership

const megaCapConcentration =
(
rsGrowth > 1.05 &&
rsSmall < 0.97 &&
rsEqual < 0.97
)

const weakInternals = (
participationScore < 45 ||
breadthThrustScore < 42 ||
marketQualityScore < 45 ||
internalWeakness
)

const severeInternalWeakness = (
participationScore < 38 &&
breadthThrustScore < 35 &&
marketQualityScore < 40
)

const acceleratingDecay = (
rotationDecayScore > 65 ||
rotationDecayState === "INTERNAL_BREAKDOWN" ||
rotationDecayState === "ROTATION_FAILURE"
)

const volatilityExpansion = (
vix > 28 ||
volOfVolRatio > 1.3 ||
correlationScore >= 2
)

const liquidityFragility = (
liquidityVacuumScore >= 7 ||
fragileLiquidity ||
liquidityTrap ||
(
liquiditySupportedStability &&
!institutionalStability
)
)

const fragilityScore =
history.fragilityScore ?? 50
/* =====================================================
NEW CLUSTER CONDITIONS
===================================================== */

const liquidityIllusion = (
liquiditySupportedStability &&
(
weakInternals ||
acceleratingDecay ||
narrowLeadership
)
)

const passiveFragility = (
passiveStability &&
!institutionalStability &&
(
weakInternals ||
hiddenDistribution
)
)

const dealerCompression = (
effectiveGamma > 0 &&
vix < 18 &&
correlationScore < 2 &&
weakInternals
)

/* =====================================================
COMPONENTS
===================================================== */

let crashScore = 0

crashScore +=
crashProbability * 0.45

crashScore +=
crashMomentum * 2.0

if (crashProbability > 40) {
crashScore += 8
}

if (crashProbability > 60) {
crashScore += 10
}

crashScore = clamp(crashScore)

let breadthScore = 0

if (breadth200 < 55) {
breadthScore += 12
}

if (breadth200 < 40) {
breadthScore += 18
}

if (breadth50 < 50) {
breadthScore += 12
}

if (breadth50 < 35) {
breadthScore += 18
}

if (breadthQuality < 45) {
breadthScore += 10
}

if (breadthQuality < 35) {
breadthScore += 12
}

breadthScore = clamp(breadthScore)

let liquidityScore =
liquidityVacuumScore * 8

if (fragileLiquidity) {
liquidityScore += 10
}

if (liquidityTrap) {
liquidityScore += 14
}

if (liquiditySupportedStability) {
liquidityScore += 18
}

if (
liquiditySupportedStability &&
acceleratingDecay
) {
liquidityScore += 12
}

if (liquidityIllusion) {
liquidityScore += 20
}

liquidityScore = clamp(liquidityScore)

const correlationRisk =
clamp(correlationScore * 24)

let gammaRisk = 0

if (effectiveGamma < 0) {
gammaRisk += 25
}

if (effectiveGamma < -5) {
gammaRisk += 18
}

if (effectiveGamma < -10) {
gammaRisk += 18
}

/*
Quiet compression risk
*/

if (
effectiveGamma >= 35 &&
vix < 18
) {
gammaRisk += 10
}

if (
dealerCompression
) {
gammaRisk += 14
}

gammaRisk = clamp(gammaRisk)

let volatilityRisk = 0

if (volOfVolRatio > 1.15) {
volatilityRisk += 15
}

if (volOfVolRatio > 1.3) {
volatilityRisk += 18
}

if (vix > 22) {
volatilityRisk += 10
}

if (vix > 28) {
volatilityRisk += 16
}

if (
passiveStability &&
weakInternals
) {
volatilityRisk += 10
}

volatilityRisk = clamp(volatilityRisk)

let creditRisk = 0

if (creditRatio > 1.05) {
creditRisk += 15
}

if (creditRatio > 1.15) {
creditRisk += 20
}

if (creditRatio > 1.25) {
creditRisk += 25
}

creditRisk = clamp(creditRisk)


let structuralFragilityCluster = 0

if (fragilityScore > 70)
structuralFragilityCluster += 12

if (fragilityScore > 85)
structuralFragilityCluster += 16

if (fragilityScore > 95)
structuralFragilityCluster += 20




let participationRisk = 0

if (participationScore < 55) {
participationRisk += 12
}

if (participationScore < 42) {
participationRisk += 18
}

if (participationScore < 35) {
participationRisk += 22
}

if (participationQuality < 45) {
participationRisk += 10
}

participationRisk =
clamp(participationRisk)

let concentrationRisk = 0

if (narrowLeadership) {
concentrationRisk += 24
}

if (megaCapConcentration) {
concentrationRisk += 20
}

if (hiddenDistribution) {
concentrationRisk += 12
}

concentrationRisk =
clamp(concentrationRisk)

let decayRisk = 0

if (rotationDecayScore > 45) {
decayRisk += 18
}

if (rotationDecayScore > 65) {
decayRisk += 22
}

if (rotationDecayScore > 80) {
decayRisk += 24
}

if (
rotationDecayState ===
"INTERNAL_BREAKDOWN"
) {
decayRisk += 18
}

if (
rotationDecayState ===
"ROTATION_FAILURE"
) {
decayRisk += 24
}

if (breadthThrustScore < 40) {
decayRisk += 12
}

if (earlyWarning) {
decayRisk += 8
}

decayRisk = clamp(decayRisk)

let marketQualityRisk = 0

marketQualityRisk +=
Math.round(
(100 - marketQualityScore) * 0.45
)

marketQualityRisk +=
Math.round(
(100 - institutionalQuality) * 0.25
)

if (internalWeakness) {
marketQualityRisk += 10
}

if (hiddenDistribution) {
marketQualityRisk += 10
}

if (
fakeStability &&
!institutionalStability
) {
marketQualityRisk += 12
}

marketQualityRisk =
clamp(marketQualityRisk)

/* =====================================================
CLUSTERS
===================================================== */

let internalWeaknessCluster = 0

if (weakInternals) {
internalWeaknessCluster += 18
}

if (severeInternalWeakness) {
internalWeaknessCluster += 20
}

if (
participationScore < 40 &&
breadthThrustScore < 35
) {
internalWeaknessCluster += 14
}

if (
narrowLeadership &&
participationScore < 42
) {
internalWeaknessCluster += 12
}

internalWeaknessCluster =
clamp(internalWeaknessCluster)

let distributionCluster = 0

if (hiddenDistribution) {
distributionCluster += 20
}

if (acceleratingDecay) {
distributionCluster += 20
}

if (
narrowLeadership &&
breadth50 > 55
) {
distributionCluster += 10
}

if (
rotationQuality < 40 &&
breadthQuality < 45
) {
distributionCluster += 10
}

distributionCluster =
clamp(distributionCluster)

let liquidityFragilityCluster = 0

if (liquidityFragility) {
liquidityFragilityCluster += 20
}

if (liquidityTrap) {
liquidityFragilityCluster += 16
}

if (
liquiditySupportedStability &&
weakInternals
) {
liquidityFragilityCluster += 18
}

if (
passiveStability &&
!institutionalStability
) {
liquidityFragilityCluster += 10
}

liquidityFragilityCluster =
clamp(liquidityFragilityCluster)

let crashExpansionCluster = 0

if (volatilityExpansion) {
crashExpansionCluster += 18
}

if (effectiveGamma < 0) {
crashExpansionCluster += 14
}

if (correlationScore >= 2) {
crashExpansionCluster += 10
}

if (crashMomentum > 8) {
crashExpansionCluster += 12
}

crashExpansionCluster =
clamp(crashExpansionCluster)

/* =====================================================
NEW CLUSTERS
===================================================== */

let passiveFragilityCluster = 0

if (passiveFragility) {
passiveFragilityCluster += 24
}

if (
passiveStability &&
narrowLeadership
) {
passiveFragilityCluster += 14
}

if (
passiveStability &&
hiddenDistribution
) {
passiveFragilityCluster += 12
}

passiveFragilityCluster =
clamp(passiveFragilityCluster)

let liquidityIllusionCluster = 0

if (liquidityIllusion) {
liquidityIllusionCluster += 26
}

if (
liquiditySupportedStability &&
acceleratingDecay
) {
liquidityIllusionCluster += 16
}

if (
liquiditySupportedStability &&
participationScore < 42
) {
liquidityIllusionCluster += 14
}

liquidityIllusionCluster =
clamp(liquidityIllusionCluster)

let dealerCompressionCluster = 0

if (dealerCompression) {
dealerCompressionCluster += 24
}

if (
effectiveGamma > 5 &&
weakInternals
) {
dealerCompressionCluster += 14
}

if (
vix < 17 &&
breadthThrustScore < 40
) {
dealerCompressionCluster += 12
}

dealerCompressionCluster =
clamp(dealerCompressionCluster)

let historicalWeaknessCluster = 0

if (phasePersistence > 30)
historicalWeaknessCluster += 6

if (phasePersistence > 60)
historicalWeaknessCluster += 10

if (phasePersistence > 90)
historicalWeaknessCluster += 12

if (prolongedDistribution)
historicalWeaknessCluster += 16

if (prolongedBearRegime)
historicalWeaknessCluster += 16

if (institutionalPressure > 45)
historicalWeaknessCluster += 10

if (institutionalPressure > 60)
historicalWeaknessCluster += 8

if (institutionalPressure > 75)
historicalWeaknessCluster += 10

if (averageBreadth < 65)
historicalWeaknessCluster += 10

if (averageParticipation < 72)
historicalWeaknessCluster += 8

if (averageRotation < 75)
historicalWeaknessCluster += 8

if (averageLiquidity < 75)
historicalWeaknessCluster += 8

if (averageFragility > 60)
historicalWeaknessCluster += 12

historicalWeaknessCluster =
clamp(historicalWeaknessCluster)


/* =====================================================
FINAL SCORE
===================================================== */

let danger = Math.round(

(internalWeaknessCluster * 0.20) +

(distributionCluster * 0.18) +

(liquidityFragilityCluster * 0.16) +

(structuralFragilityCluster * 0.12) +

(crashExpansionCluster * 0.16) +

(passiveFragilityCluster * 0.12) +

(liquidityIllusionCluster * 0.10) +

(dealerCompressionCluster * 0.06) +

(historicalWeaknessCluster * 0.18)

)

danger += Math.round(

(marketQualityRisk * 0.08) +

(decayRisk * 0.08) +

(liquidityScore * 0.05)

)

if (institutionalStability) {
danger -= 12
}

if (
passiveStability &&
!institutionalStability
) {
danger += 8
}

const synchronizedBreakdown = (

weakInternals &&

liquidityFragility &&

volatilityExpansion &&

acceleratingDecay

)

if (synchronizedBreakdown) {
danger += 18
}

danger = clamp(danger)

let level:
| "LOW"
| "ELEVATED"
| "HIGH"
| "EXTREME"

if (
danger >= 82 ||
synchronizedBreakdown
) {
level = "EXTREME"
}

else if (
danger >= 60 ||
(
weakInternals &&
acceleratingDecay
)

||

(
historicalWeaknessCluster > 40 &&
danger > 50
)
) {
level = "HIGH"
}

else if (
danger >= 36 ||
weakInternals
) {
level = "ELEVATED"
}

else {
level = "LOW"
}

const escalation = (

synchronizedBreakdown ||

(
effectiveGamma < 0 &&
volatilityExpansion &&
acceleratingDecay
) ||

(
liquiditySupportedStability &&
severeInternalWeakness
) ||

(
liquidityIllusion &&
hiddenDistribution
)

||

(
historicalWeaknessCluster > 55 &&
crashTrendHistory > 3
)

)

return {

score: danger,

level,

escalation,

components: {
crash: Math.round(crashScore),
breadth: Math.round(breadthScore),
liquidity: Math.round(liquidityScore),
correlation: Math.round(correlationRisk),
gamma: Math.round(gammaRisk),
volatility: Math.round(volatilityRisk),
credit: Math.round(creditRisk),

participation:
Math.round(participationRisk),

concentration:
Math.round(concentrationRisk),

decay:
Math.round(decayRisk),

marketQuality:
Math.round(marketQualityRisk),

history:
Math.round(historicalWeaknessCluster)
},

clusters: {
internalWeaknessCluster:
Math.round(internalWeaknessCluster),

distributionCluster:
Math.round(distributionCluster),

liquidityFragilityCluster:
Math.round(liquidityFragilityCluster),

structuralFragilityCluster:
Math.round(structuralFragilityCluster),

crashExpansionCluster:
Math.round(crashExpansionCluster),

passiveFragilityCluster:
Math.round(passiveFragilityCluster),

liquidityIllusionCluster:
Math.round(liquidityIllusionCluster),

dealerCompressionCluster:
Math.round(dealerCompressionCluster),

historicalWeaknessCluster:
Math.round(historicalWeaknessCluster)
},

meta: {
narrowLeadership,
megaCapConcentration,

passiveStability,
liquiditySupportedStability,
institutionalStability,

synchronizedBreakdown,
volatilityExpansion,
liquidityFragility,
acceleratingDecay,

prolongedDistribution,
prolongedBearRegime,
phasePersistence,
institutionalPressure,

liquidityIllusion,
dealerCompression,
passiveFragility,

effectiveGamma
}
}
}
