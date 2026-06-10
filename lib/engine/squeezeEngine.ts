// /lib/engine/squeezeEngine.ts

export interface SqueezeEngineInput {
gammaExposure?: number

vix?: number
moveIndex?: number

breadth50?: number

putCallRatio?: number

shortInterest?: number

// EXISTING
vixTermRatio?: number
creditRatio?: number
marketLiquidityScore?: number

// NEW
dealerCompression?: number
passiveFlowRisk?: number
volSuppression?: number

/*
NEW STRUCTURAL INPUTS
*/

structuralGammaFloor?: number
passiveGammaCompression?: number

rsSmall?: number
rsEqual?: number
rsGrowth?: number

participationScore?: number
}

export interface SqueezeEngineOutput {
risk: number

state:
| "LOW"
| "MODERATE"
| "HIGH"
| "EXTREME"

squeezeType:
| "NONE"
| "SHORT_SQUEEZE"
| "VOL_SQUEEZE"
| "LIQUIDITY_SQUEEZE"
| "PASSIVE_FLOW_SQUEEZE"

instability: number

/*
NEW
*/

effectiveGamma: number
passiveGammaCompression: number

summary: string

metrics: {
gamma: number
effectiveGamma: number

vix: number
move: number
breadth50: number
putCall: number
shortInterest: number

vixTerm: number
credit: number
liquidity: number

dealerCompression: number
passiveFlowRisk: number
volSuppression: number

passiveGammaCompression: number
}
}

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(
min,
Math.min(max, value)
)
}

export function squeezeEngine(
input: SqueezeEngineInput
): SqueezeEngineOutput {

/* =====================================================
INPUT
===================================================== */

const rawGamma =
Number(input.gammaExposure ?? 0)

const vix =
Number(input.vix ?? 20)

const move =
Number(input.moveIndex ?? 80)

const breadth50 =
Number(input.breadth50 ?? 50)

const putCall =
Number(input.putCallRatio ?? 1)

const shortInterest =
Number(input.shortInterest ?? 50)

const vixTerm =
Number(input.vixTermRatio ?? 1)

const credit =
Number(input.creditRatio ?? 1)

const liquidity =
Number(input.marketLiquidityScore ?? 50)

const rsSmall =
Number(input.rsSmall ?? 1)

const rsEqual =
Number(input.rsEqual ?? 1)

const rsGrowth =
Number(input.rsGrowth ?? 1)

const participationScore =
Number(input.participationScore ?? 50)

/* =====================================================
STRUCTURAL FLAGS
===================================================== */

const contango =
vixTerm >= 0.98

const narrowLeadership = (

rsGrowth > 1.03 &&

rsSmall < 0.99 &&

rsEqual < 0.99

)

const megaCapLeadership = (

rsGrowth > 1.05 &&

rsSmall < 0.97 &&

rsEqual < 0.97

)

const weakBreadth =
breadth50 < 58

const weakParticipation =
participationScore < 50

/* =====================================================
STRUCTURAL GAMMA FLOOR
===================================================== */

let structuralGammaFloor =
Number(
input.structuralGammaFloor ?? 0
)

if (structuralGammaFloor === 0) {

if (
vix < 20 &&
contango
) {
structuralGammaFloor = 35
}

if (
vix < 20 &&
contango &&
narrowLeadership
) {
structuralGammaFloor = 45
}

if (
megaCapLeadership &&
weakBreadth
) {
structuralGammaFloor = 55
}

if (

weakBreadth &&

weakParticipation &&

vix < 20 &&

contango

) {
structuralGammaFloor = 60
}
}

const effectiveGamma =
Math.max(
rawGamma,
structuralGammaFloor
)

/* =====================================================
PASSIVE GAMMA COMPRESSION
===================================================== */

let passiveGammaCompression =
Number(
input.passiveGammaCompression ?? 0
)

if (
passiveGammaCompression === 0
) {

if (contango) {
passiveGammaCompression += 20
}

if (vix < 20) {
passiveGammaCompression += 20
}

if (narrowLeadership) {
passiveGammaCompression += 20
}

if (weakBreadth) {
passiveGammaCompression += 20
}

if (weakParticipation) {
passiveGammaCompression += 10
}

if (megaCapLeadership) {
passiveGammaCompression += 10
}
}

passiveGammaCompression =
clamp(
Math.round(
passiveGammaCompression
)
)

/* =====================================================
NEW STRUCTURAL FACTORS
===================================================== */

let dealerCompression =
Number(
input.dealerCompression ?? 0
)

let passiveFlowRisk =
Number(
input.passiveFlowRisk ?? 0
)

let volSuppression =
Number(
input.volSuppression ?? 0
)

/* =====================================================
AUTO-DERIVED COMPONENTS
===================================================== */

if (dealerCompression === 0) {

if (effectiveGamma >= 15) {
dealerCompression += 25
}

if (effectiveGamma >= 25) {
dealerCompression += 20
}

if (effectiveGamma >= 45) {
dealerCompression += 10
}

if (vix < 18) {
dealerCompression += 20
}

if (breadth50 < 60) {
dealerCompression += 20
}

if (breadth50 < 50) {
dealerCompression += 10
}

dealerCompression +=
Math.round(
passiveGammaCompression * 0.20
)

if (
effectiveGamma >= 25 &&
vix < 18 &&
breadth50 < 60
) {
dealerCompression += 15
}
}

if (passiveFlowRisk === 0) {

if (effectiveGamma > 10) {
passiveFlowRisk += 15
}

if (vix < 17) {
passiveFlowRisk += 20
}

if (breadth50 < 58) {
passiveFlowRisk += 25
}

if (liquidity > 65) {
passiveFlowRisk += 10
}

passiveFlowRisk +=
Math.round(
passiveGammaCompression * 0.20
)

if (
breadth50 < 55 &&
vix < 17
) {
passiveFlowRisk += 15
}
}

if (volSuppression === 0) {

if (vix < 17) {
volSuppression += 25
}

if (
vixTerm >= 0.95 &&
vixTerm <= 1.08
) {
volSuppression += 20
}

if (effectiveGamma >= 15) {
volSuppression += 15
}

if (breadth50 < 60) {
volSuppression += 15
}

if (move > 85) {
volSuppression += 10
}

if (
passiveGammaCompression >= 60
) {
volSuppression += 10
}
}

dealerCompression =
clamp(
Math.round(
dealerCompression
)
)

passiveFlowRisk =
clamp(
Math.round(
passiveFlowRisk
)
)

volSuppression =
clamp(
Math.round(
volSuppression
)
)

/* =====================================================
BASELINE LATENT RISK
===================================================== */

let risk = 18

/* =====================================================
PASSIVE COMPRESSION LAYER
===================================================== */

if (

vix < 18 &&

breadth50 < 60 &&

effectiveGamma >= 25

) {
risk += 10
}

if (

vix < 17 &&

breadth50 < 55 &&

effectiveGamma >= 30

) {
risk += 8
}

/*
Structural passive compression
*/

risk +=
Math.round(
passiveGammaCompression * 0.18
)

/* =====================================================
DEALER COMPRESSION
===================================================== */

risk +=
Math.round(
dealerCompression * 0.18
)

/* =====================================================
PASSIVE FLOW RISK
===================================================== */

risk +=
Math.round(
passiveFlowRisk * 0.16
)

/* =====================================================
VOL SUPPRESSION
===================================================== */

risk +=
Math.round(
volSuppression * 0.18
)

/* =====================================================
GAMMA STRUCTURE
===================================================== */

if (effectiveGamma < 0) {
risk += 22
}

if (effectiveGamma < -5) {
risk += 10
}

/*
Structural compression instability
*/

if (
effectiveGamma >= 35 &&
vix < 18
) {
risk += 8
}

if (
passiveGammaCompression >= 60
) {
risk += 10
}

/* =====================================================
VOLATILITY
===================================================== */

if (vix > 22) {
risk += 10
}

if (vix > 30) {
risk += 12
}

/* =====================================================
RATE / BOND VOL
===================================================== */

if (move > 100) {
risk += 10
}

if (move > 120) {
risk += 10
}

/* =====================================================
BREADTH
===================================================== */

if (breadth50 < 50) {
risk += 6
}

if (breadth50 < 40) {
risk += 10
}

/* =====================================================
POSITIONING
===================================================== */

if (putCall > 1.1) {
risk += 8
}

if (putCall > 1.25) {
risk += 8
}

if (shortInterest > 70) {
risk += 10
}

if (shortInterest > 85) {
risk += 10
}

/* =====================================================
LIQUIDITY / CREDIT
===================================================== */

if (credit < 0.98) {
risk += 5
}

if (credit < 0.95) {
risk += 10
}

if (liquidity < 40) {
risk += 8
}

if (liquidity < 30) {
risk += 10
}

/* =====================================================
REFLEXIVE MELT-UP RISK
===================================================== */

if (

dealerCompression >= 60 &&

passiveFlowRisk >= 55 &&

volSuppression >= 55

) {
risk += 10
}

/*
Most important new regime
*/

if (

passiveGammaCompression >= 70 &&

weakBreadth &&

weakParticipation

) {
risk += 12
}

/* =====================================================
FINAL SCORE
===================================================== */

risk =
clamp(
Math.round(risk)
)

/* =====================================================
STATE
===================================================== */

let state:
| "LOW"
| "MODERATE"
| "HIGH"
| "EXTREME"

if (risk >= 80) {
state = "EXTREME"
}

else if (risk >= 60) {
state = "HIGH"
}

else if (risk >= 35) {
state = "MODERATE"
}

else {
state = "LOW"
}

/* =====================================================
TYPE
===================================================== */

let squeezeType:
| "NONE"
| "SHORT_SQUEEZE"
| "VOL_SQUEEZE"
| "LIQUIDITY_SQUEEZE"
| "PASSIVE_FLOW_SQUEEZE"

if (

dealerCompression >= 65 &&

passiveFlowRisk >= 60

) {
squeezeType =
"PASSIVE_FLOW_SQUEEZE"
}

else if (
shortInterest > 70 &&
effectiveGamma < 0
) {
squeezeType =
"SHORT_SQUEEZE"
}

else if (
vix > 28 &&
move > 100
) {
squeezeType =
"VOL_SQUEEZE"
}

else if (
breadth50 < 40 &&
effectiveGamma < 0
) {
squeezeType =
"LIQUIDITY_SQUEEZE"
}

else {
squeezeType = "NONE"
}

/* =====================================================
INSTABILITY
===================================================== */

let instability = risk

if (effectiveGamma < 0) {
instability += 8
}

if (
vix > 30 &&
move > 110
) {
instability += 8
}

if (
dealerCompression >= 60
) {
instability += 10
}

if (
passiveGammaCompression >= 65
) {
instability += 10
}

instability =
clamp(
Math.round(
instability
)
)

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Latently compressed positioning environment"

if (
squeezeType ===
"PASSIVE_FLOW_SQUEEZE"
) {
summary =
"Reflexive passive-flow melt-up structure detected"
}

else if (
state === "MODERATE"
) {
summary =
"Elevated squeeze dynamics beneath surface"
}

else if (
state === "HIGH"
) {
summary =
"High squeeze risk environment"
}

else if (
state === "EXTREME"
) {
summary =
"Extreme forced positioning risk"
}

/* =====================================================
RETURN
===================================================== */

return {

risk,

state,

squeezeType,

instability,

effectiveGamma,
passiveGammaCompression,

summary,

metrics: {
gamma: rawGamma,
effectiveGamma,

vix,
move,
breadth50,
putCall,
shortInterest,

vixTerm,
credit,
liquidity,

dealerCompression,
passiveFlowRisk,
volSuppression,

passiveGammaCompression
}
}
}
