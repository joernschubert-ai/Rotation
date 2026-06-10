// /lib/engine/gammaEngine.ts

export interface GammaEngineInput {
gammaExposure?: number

vix?: number
breadth50?: number

liquidityScore?: number

vixTermRatio?: number

/* =====================================================
NEW STRUCTURAL INPUTS
===================================================== */

rsSmall?: number
rsEqual?: number
rsGrowth?: number

participationScore?: number
}

export interface GammaEngineOutput {

score: number

state:
| "NEGATIVE_GAMMA"
| "NEUTRAL_GAMMA"
| "POSITIVE_GAMMA"
| "DEALER_COMPRESSION"

dealerCompression: number
passiveFlowRisk: number
volSuppression: number

/*
NEW
*/

structuralGammaFloor: number
effectiveGamma: number

passiveGammaCompression: number

instability: number

summary: string
}

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(min, Math.min(max, value))
}

export function gammaEngine(
input: GammaEngineInput
): GammaEngineOutput {

/* =====================================================
INPUT
===================================================== */

const rawGamma =
Number(input.gammaExposure ?? 0)

const vix =
Number(input.vix ?? 20)

const breadth50 =
Number(input.breadth50 ?? 50)

const liquidity =
Number(input.liquidityScore ?? 50)

const vixTerm =
Number(input.vixTermRatio ?? 1)

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

const softVol =
vix < 20

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

let structuralGammaFloor = 0

/*
Modern passive-flow markets
rarely operate at true gamma neutrality.
*/

if (
softVol &&
contango
) {
structuralGammaFloor = 35
}

/*
Passive index compression regime
*/

if (
softVol &&
contango &&
narrowLeadership
) {
structuralGammaFloor = 45
}

/*
Mega-cap passive dominance
*/

if (
megaCapLeadership &&
weakBreadth
) {
structuralGammaFloor = 55
}

/*
Most dangerous:
quiet tape + weak internals
*/

if (

softVol &&

contango &&

weakBreadth &&

weakParticipation

) {
structuralGammaFloor = 60
}

const effectiveGamma =
Math.max(
rawGamma,
structuralGammaFloor
)

/* =====================================================
PASSIVE GAMMA COMPRESSION
===================================================== */

let passiveGammaCompression = 0

if (contango) {
passiveGammaCompression += 20
}

if (softVol) {
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

passiveGammaCompression =
clamp(
Math.round(
passiveGammaCompression
)
)

/* =====================================================
DEALER COMPRESSION
===================================================== */

let dealerCompression = 0

if (effectiveGamma >= 10) {
dealerCompression += 20
}

if (effectiveGamma >= 25) {
dealerCompression += 25
}

if (effectiveGamma >= 45) {
dealerCompression += 15
}

if (vix < 18) {
dealerCompression += 20
}

if (breadth50 < 60) {
dealerCompression += 20
}

if (
effectiveGamma >= 25 &&
vix < 18 &&
breadth50 < 60
) {
dealerCompression += 15
}

/*
Structural passive compression
*/

dealerCompression +=
Math.round(
passiveGammaCompression * 0.25
)

dealerCompression =
clamp(
Math.round(
dealerCompression
)
)

/* =====================================================
PASSIVE FLOW RISK
===================================================== */

let passiveFlowRisk = 0

if (vix < 17) {
passiveFlowRisk += 25
}

if (breadth50 < 58) {
passiveFlowRisk += 25
}

if (liquidity > 65) {
passiveFlowRisk += 15
}

if (effectiveGamma >= 20) {
passiveFlowRisk += 15
}

/*
Structural overlay
*/

passiveFlowRisk +=
Math.round(
passiveGammaCompression * 0.20
)

passiveFlowRisk =
clamp(
Math.round(
passiveFlowRisk
)
)

/* =====================================================
VOL SUPPRESSION
===================================================== */

let volSuppression = 0

if (vix < 17) {
volSuppression += 30
}

if (
vixTerm >= 0.95 &&
vixTerm <= 1.08
) {
volSuppression += 25
}

if (effectiveGamma >= 15) {
volSuppression += 15
}

if (breadth50 < 60) {
volSuppression += 15
}

/*
Quiet fragility
*/

if (
passiveGammaCompression >= 60
) {
volSuppression += 15
}

volSuppression =
clamp(
Math.round(
volSuppression
)
)

/* =====================================================
SCORE
===================================================== */

let score = 50

if (effectiveGamma < 0) {
score -= 20
}

if (effectiveGamma > 10) {
score += 10
}

if (
effectiveGamma > 35
) {
score += 6
}

/*
Structural compression
lowers true stability.
*/

if (
passiveGammaCompression >= 60
) {
score -= 10
}

if (
dealerCompression >= 60
) {
score -= 12
}

score =
clamp(
Math.round(score)
)

/* =====================================================
STATE
===================================================== */

let state:
| "NEGATIVE_GAMMA"
| "NEUTRAL_GAMMA"
| "POSITIVE_GAMMA"
| "DEALER_COMPRESSION"

if (
dealerCompression >= 60
) {
state = "DEALER_COMPRESSION"
}

else if (
effectiveGamma < 0
) {
state = "NEGATIVE_GAMMA"
}

else if (
effectiveGamma > 10
) {
state = "POSITIVE_GAMMA"
}

else {
state = "NEUTRAL_GAMMA"
}

/* =====================================================
INSTABILITY
===================================================== */

let instability = 0

instability +=
Math.round(
dealerCompression * 0.35
)

instability +=
Math.round(
passiveFlowRisk * 0.25
)

instability +=
Math.round(
volSuppression * 0.20
)

instability +=
Math.round(
passiveGammaCompression * 0.20
)

instability =
clamp(instability)

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Balanced gamma positioning"

if (
passiveGammaCompression >= 60
) {
summary =
"Passive-flow compression masking latent fragility"
}

if (
state === "DEALER_COMPRESSION"
) {
summary =
"Dealer compression and suppressed volatility regime"
}

else if (
state === "NEGATIVE_GAMMA"
) {
summary =
"Negative gamma instability"
}

/* =====================================================
RETURN
===================================================== */

return {

score,

state,

dealerCompression,
passiveFlowRisk,
volSuppression,

structuralGammaFloor,
effectiveGamma,

passiveGammaCompression,

instability,

summary
}
}
