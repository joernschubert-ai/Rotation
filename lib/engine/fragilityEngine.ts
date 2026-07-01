// /lib/engine/fragilityEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

export interface FragilityEngineInput {

history?: any[]

historyMetrics?: any

crash?: any

breadth50?: number
breadth200?: number

gammaExposure?: number
correlationScore?: number

vix?: number
volOfVolRatio?: number

liquidity?: any

structure?: any

participation?: any
breadthThrust?: any
rotation?: any

marketQuality?: any

/*
=====================================================
NEW
=====================================================
*/

vixTermRatio?: number
}

export interface FragilityEngineOutput {
score: number

state:
| "RESILIENT"
| "STRETCHED"
| "FRAGILE"
| "STRUCTURALLY_UNSTABLE"
| "BREAKDOWN_RISK"

escalation: boolean

breakdownRisk: number

liquidityFragility: number

liquidityIllusion: boolean

passiveFragility: boolean
dealerCompression: boolean

/*
=====================================================
NEW
=====================================================
*/

structuralGammaFloor: number
effectiveGamma: number

summary: string

metrics: {
crashProbability: number

breadth50: number
breadth200: number

gamma: number
effectiveGamma: number
structuralGammaFloor: number

correlation: number

vix: number
volOfVol: number

liquidity: number

participationScore: number
breadthThrustScore: number
rotationScore: number
rotationDecayScore: number

marketQualityScore: number

participationTrend: number
breadthTrend: number
liquidityTrend: number
marketQualityTrend: number

participationErosion: boolean
breadthErosion: boolean
liquidityErosion: boolean
qualityErosion: boolean

persistentErosion: boolean

narrowLeadership: boolean
megaCapOnlyTape: boolean

internalSynchronization: boolean
liquidityDependence: boolean

liquidityIllusion: boolean
latentFragility: boolean

passiveFragility: boolean
dealerCompression: boolean

phasePersistence: number

daysInPhase: number

institutionalPressure: number

participationDecay: number

breadthTrendHistory: number

breadthAcceleration: number

crashTrend: number

relativeBreadthWeakness: number

averageFragility: number

persistentDistribution: boolean

prolongedBearRegime: boolean

acceleratingWeakness: boolean

}
}

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(min, Math.min(max, value))
}

function scoreSafe(
value: any
) {
return Number.isFinite(Number(value))
? Number(value)
: 50
}

export function fragilityEngine(
input: FragilityEngineInput
): FragilityEngineOutput {

const crashProbability =
Number(input.crash?.probability ?? 0)

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

const rawGamma =
Number(input.gammaExposure ?? 0)

const correlation =
Number(input.correlationScore ?? 0)

const vix =
Number(input.vix ?? 20)

const volOfVol =
Number(input.volOfVolRatio ?? 1)

const vixTerm =
Number(input.vixTermRatio ?? 1)

const liquidity =
Number(
input.liquidity?.score ??
input.liquidity?.metrics?.liquidity ??
input.liquidity?.liquidity ??
50
)

const participationScore =
Number(
input.participation?.score ??
50
)

const breadthThrustScore =
Number(
input.breadthThrust?.score ??
50
)

const rotationScore =
Number(
input.rotation?.score ??
50
)

const rotationDecayScore =
Number(
input.rotation?.decayScore ??
input.rotation?.rotationDecayScore ??
0
)

const rotationDecayState =
input.rotation?.rotationDecayState ??
"HEALTHY_ROTATION"

const rsSmall =
Number(input.rotation?.rsSmall ?? 1)

const rsGrowth =
Number(input.rotation?.rsGrowth ?? 1)

const rsEqual =
Number(input.rotation?.rsEqual ?? 1)

const marketQualityScore =
Number(
input.marketQuality?.score ??
50
)

const internalSynchronization =
Boolean(
input.marketQuality?.internalSynchronization ??
false
)

/* =====================================================
HISTORY
===================================================== */

const history =
input.history ?? []

const historyMetrics =
input.historyMetrics ?? {};

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
FRAGILITY TRENDS
===================================================== */

const participationTrend =
participationScore -
Number(
h10?.participationScore ??
participationScore
)

const breadthTrend =
breadth50 -
Number(
h10?.breadth50 ??
breadth50
)

const liquidityTrend =
liquidity -
Number(
h10?.liquidityScore ??
liquidity
)

const marketQualityTrend =
marketQualityScore -
Number(
h10?.marketQualityScore ??
marketQualityScore
)


/* =====================================================
HISTORY METRICS
===================================================== */

const phasePersistence =
Number(historyMetrics?.phasePersistence ?? 0);

const daysInPhase =
Number(historyMetrics?.daysInPhase ?? 0);

const institutionalPressure =
Number(historyMetrics?.institutionalPressure ?? 0);

const participationDecayHistory =
Number(historyMetrics?.participationDecay ?? 0);

const breadthTrendHistory =
Number(historyMetrics?.breadthTrend ?? 0);

const breadthAcceleration =
Number(historyMetrics?.breadthAcceleration ?? 0);

const crashTrend =
Number(historyMetrics?.crashTrend ?? 0);

const relativeBreadthWeakness =
Number(historyMetrics?.relativeBreadthWeakness ?? 0);

const averageFragility =
Number(historyMetrics?.averageFragility ?? 50);

const prolongedBearRegime =
Boolean(historyMetrics?.prolongedBearRegime);

const persistentDistribution =
Boolean(historyMetrics?.persistentDistribution);

const acceleratingWeakness =
Boolean(historyMetrics?.acceleratingWeakness);


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

participationScore
})

const {
narrowLeadership,
severeNarrowLeadership,
megaCapOnlyTape,
equalWeightWeakness,
smallCapWeakness
} = structureFlags

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
narrowLeadership &&
breadth50 < 55
) {
structuralGammaFloor = 55
}

const effectiveGamma =
Math.max(rawGamma, structuralGammaFloor)

/* =====================================================
STRUCTURAL CONDITIONS
===================================================== */

const weakParticipation = (
participationScore < 48 ||
breadth50 < 48
)

const severeParticipationFailure = (
participationScore < 38 &&
breadth50 < 40
)

const weakRotation = (
rotationScore < 45 ||
rotationDecayScore >= 45
)

const failedRotation = (
rotationScore < 35 ||
rotationDecayScore >= 65 ||
rotationDecayState === "ROTATION_FAILURE" ||
rotationDecayState === "INTERNAL_BREAKDOWN"
)

const weakBreadthStructure = (
breadth50 < 45 ||
breadth200 < 42 ||
breadthThrustScore < 42
)

const severeBreadthFailure = (
breadth50 < 35 &&
breadth200 < 35 &&
breadthThrustScore < 35
)

const liquidityDependence = (
liquidity >= 65 &&
(
weakParticipation ||
narrowLeadership ||
marketQualityScore < 45
)
)

const liquidityIllusion = (
liquidity >= 68 &&
(
marketQualityScore < 42 ||
weakParticipation ||
failedRotation ||
megaCapOnlyTape ||
!internalSynchronization
)
)

const synchronizationFailure = (
!internalSynchronization ||
(
weakParticipation &&
weakRotation
)
)

const latentFragility = (
vix < 20 &&
liquidity >= 60 &&
(
weakParticipation ||
failedRotation ||
narrowLeadership ||
synchronizationFailure
)
)

/* =====================================================
HISTORICAL EROSION
===================================================== */

const participationErosion =
participationTrend < -8

const breadthErosion =
breadthTrend < -8

const liquidityErosion =
liquidityTrend < -10

const qualityErosion =
marketQualityTrend < -10

const persistentErosion = (

participationErosion &&
breadthErosion

) || (

breadthErosion &&
qualityErosion

)

/* =====================================================
NEW CONDITIONS
===================================================== */

const passiveFragility = (
vix < 18 &&
liquidity >= 65 &&
(
weakParticipation ||
narrowLeadership ||
failedRotation
)
)

const dealerCompression = (
effectiveGamma > 35 &&
vix < 18 &&
correlation < 3 &&
weakParticipation
)

/* =====================================================
SCORE
===================================================== */

let score = 18

if (participationScore < 58) {
score += 6
}

if (participationScore < 48) {
score += 10
}

if (participationScore < 40) {
score += 14
}

if (participationScore < 32) {
score += 18
}

if (breadth50 < 55) {
score += 5
}

if (breadth50 < 45) {
score += 8
}

if (breadth50 < 35) {
score += 12
}

if (breadth200 < 50) {
score += 5
}

if (breadth200 < 40) {
score += 10
}

if (breadth200 < 32) {
score += 14
}

if (breadthThrustScore < 45) {
score += 6
}

if (breadthThrustScore < 35) {
score += 10
}

if (rotationScore < 48) {
score += 6
}

if (rotationScore < 40) {
score += 10
}

if (rotationScore < 32) {
score += 14
}

if (rotationDecayScore >= 35) {
score += 6
}

if (rotationDecayScore >= 50) {
score += 10
}

if (rotationDecayScore >= 65) {
score += 14
}

/*
=====================================================
NEW RECALIBRATION
=====================================================
*/

if (
rotationDecayScore > 30
) {
score += 6
}

if (failedRotation) {
score += 10
}

if (narrowLeadership) {
score += 10
}

if (megaCapOnlyTape) {
score += 16
}

/*
=====================================================
STRUCTURAL CONCENTRATION OVERLAY
=====================================================
*/

if (
narrowLeadership &&
equalWeightWeakness &&
smallCapWeakness
) {
score += 10
}

if (synchronizationFailure) {
score += 10
}

if (
weakParticipation &&
weakRotation &&
weakBreadthStructure
) {
score += 12
}

if (marketQualityScore < 50) {
score += 6
}

if (marketQualityScore < 42) {
score += 10
}

if (marketQualityScore < 34) {
score += 14
}

if (liquidity < 50) {
score += 6
}

if (liquidity < 40) {
score += 10
}

if (liquidity < 30) {
score += 14
}

if (liquidityDependence) {
score += 16
}

if (liquidityIllusion) {
score += 20
}

if (latentFragility) {
score += 10
}

/* =====================================================
HISTORY OVERLAYS
===================================================== */

if (participationErosion) {
score += 8
}

if (breadthErosion) {
score += 8
}

if (liquidityErosion) {
score += 6
}

if (qualityErosion) {
score += 8
}

if (persistentErosion) {
score += 15
}


/* =====================================================
NEW OVERLAYS
===================================================== */

if (passiveFragility) {
score += 18
}

if (dealerCompression) {
score += 12
}

if (
liquidityIllusion &&
failedRotation
) {
score += 12
}

if (
megaCapOnlyTape &&
breadth50 < 45
) {
score += 12
}

if (
narrowLeadership &&
weakParticipation &&
weakRotation
) {
score += 12
}

if (
liquidity >= 70 &&
marketQualityScore < 42
) {
score += 16
}

if (
liquidity >= 70 &&
megaCapOnlyTape
) {
score += 12
}

if (
liquidity >= 65 &&
!internalSynchronization
) {
score += 10
}

/*
Structural gamma floor risk
*/

if (
structuralGammaFloor >= 35 &&
weakParticipation
) {
score += 10
}

if (
structuralGammaFloor >= 45 &&
narrowLeadership
) {
score += 10
}

if (rawGamma < 0) {
score += 4
}

if (rawGamma < -10) {
score += 6
}

if (correlation > 5) {
score += 5
}

if (correlation > 8) {
score += 6
}

if (vix > 28) {
score += 4
}

if (vix > 35) {
score += 5
}

if (volOfVol > 1.4) {
score += 4
}

score += Math.round(
crashProbability * 0.10
)

/* =====================================================
HISTORY METRIC OVERLAY
===================================================== */

if (phasePersistence >= 30)
score += 3;

if (phasePersistence >= 50)
score += 5;

if (daysInPhase >= 40)
score += 3;

if (daysInPhase >= 60)
score += 5;

if (persistentDistribution)
score += 6;

if (prolongedBearRegime)
score += 6;

if (institutionalPressure > 60)
score += 4;

if (participationDecayHistory > 20)
score += 2;

if (breadthTrendHistory < -1)
score += 1;

if (breadthAcceleration < -1)
score += 3;

if (relativeBreadthWeakness > 10)
score += 3;

if (crashTrend > 5)
score += 4;

if (acceleratingWeakness)
score += 6;

if (averageFragility > 65)
score += 2;


score = clamp(
Math.round(score)
)

/* =====================================================
STATE
===================================================== */

let state:
| "RESILIENT"
| "STRETCHED"
| "FRAGILE"
| "STRUCTURALLY_UNSTABLE"
| "BREAKDOWN_RISK"

if (
score >= 82 ||
(
severeParticipationFailure &&
failedRotation &&
severeBreadthFailure
)
) {
state = "BREAKDOWN_RISK"
}

else if (
score >= 60 ||
liquidityIllusion ||
passiveFragility ||
(
liquidityDependence &&
synchronizationFailure
)
) {
state = "STRUCTURALLY_UNSTABLE"
}

else if (
score >= 44 ||
(
weakParticipation &&
narrowLeadership
)
) {
state = "FRAGILE"
}

else if (
score >= 30 ||
weakRotation ||
synchronizationFailure
) {
state = "STRETCHED"
}

else {
state = "RESILIENT"
}

/* =====================================================
ESCALATION
===================================================== */

const escalation = (

state === "BREAKDOWN_RISK" ||

(
rawGamma < 0 &&
vix > 28 &&
liquidity < 35
) ||

(
failedRotation &&
severeParticipationFailure
) ||

(
liquidityIllusion &&
synchronizationFailure
)

)

/* =====================================================
BREAKDOWN RISK
===================================================== */

let breakdownRisk = 0

if (severeParticipationFailure) {
breakdownRisk += 25
}

if (severeBreadthFailure) {
breakdownRisk += 25
}

if (failedRotation) {
breakdownRisk += 20
}

if (megaCapOnlyTape) {
breakdownRisk += 12
}

if (liquidityDependence) {
breakdownRisk += 15
}

if (liquidityIllusion) {
breakdownRisk += 20
}

if (passiveFragility) {
breakdownRisk += 14
}

if (dealerCompression) {
breakdownRisk += 10
}

if (synchronizationFailure) {
breakdownRisk += 15
}

if (marketQualityScore < 35) {
breakdownRisk += 15
}

if (persistentErosion) {
breakdownRisk += 20
}

if (
participationErosion &&
breadthErosion
) {
breakdownRisk += 10
}

if (persistentDistribution)
breakdownRisk += 8;

if (prolongedBearRegime)
breakdownRisk += 6;

if (institutionalPressure > 60)
breakdownRisk += 5;

if (acceleratingWeakness)
breakdownRisk += 8;

breakdownRisk = clamp(
Math.round(breakdownRisk)
)

/* =====================================================
LIQUIDITY FRAGILITY
===================================================== */

let liquidityFragility =
Math.round(
(100 - liquidity) * 0.45
)

if (liquidityDependence) {
liquidityFragility += 25
}

if (liquidityIllusion) {
liquidityFragility += 35
}

if (passiveFragility) {
liquidityFragility += 14
}

if (
liquidity >= 65 &&
marketQualityScore < 42
) {
liquidityFragility += 15
}

liquidityFragility = clamp(
liquidityFragility
)

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Structurally resilient market environment"

if (state === "STRETCHED") {
summary =
"Market structure increasingly stretched beneath the surface"
}

if (state === "FRAGILE") {
summary =
"Fragile institutional structure with weakening resilience"
}

if (state === "STRUCTURALLY_UNSTABLE") {
summary =
"Structurally unstable market dependent on narrowing support"
}

if (state === "BREAKDOWN_RISK") {
summary =
"High structural breakdown risk across institutional internals"
}

if (liquidityIllusion) {
summary += " | Liquidity illusion regime"
}

if (passiveFragility) {
summary += " | Passive fragility"
}

if (dealerCompression) {
summary += " | Dealer compression"
}

if (megaCapOnlyTape) {
summary += " | Mega-cap stability distortion"
}

/* =====================================================
RETURN
===================================================== */

return {

score,

state,

escalation,

breakdownRisk,

liquidityFragility,

liquidityIllusion,

passiveFragility,

dealerCompression,

structuralGammaFloor,

effectiveGamma,

summary,

metrics: {
crashProbability,

breadth50,
breadth200,

gamma: rawGamma,
effectiveGamma,
structuralGammaFloor,

correlation,

vix,
volOfVol,

liquidity,

participationScore,
breadthThrustScore,
rotationScore,
rotationDecayScore,

marketQualityScore,

participationTrend,
breadthTrend,
liquidityTrend,
marketQualityTrend,

participationErosion,
breadthErosion,
liquidityErosion,
qualityErosion,

persistentErosion,

narrowLeadership,
megaCapOnlyTape,

internalSynchronization,

liquidityDependence,

liquidityIllusion,
latentFragility,

passiveFragility,
dealerCompression,

phasePersistence,

daysInPhase,

institutionalPressure,

participationDecay:
participationDecayHistory,

breadthTrendHistory,

breadthAcceleration,

crashTrend,

relativeBreadthWeakness,

averageFragility,

persistentDistribution,

prolongedBearRegime,

acceleratingWeakness

}
}
}
