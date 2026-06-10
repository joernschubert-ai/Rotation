// /lib/engine/marketDrivers.ts

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(min, Math.min(max, value))
}

export function marketDriversEngine(data: any) {

/* ================= RAW ================= */

const vix =
Number(
data.marketData?.["^VIX"]?.current ?? 0
)

const vixTerm =
Number(data.vixTermRatio ?? 1)

const volOfVol =
Number(data.volOfVolRatio ?? 1)

const skew =
Number(data.optionsSkewRatio ?? 100)

const rawGamma =
Number(data.gammaExposure ?? 0)

const liquidity =
Number(data.marketLiquidityScore ?? 50)

const credit =
Number(data.creditRatio ?? 1)

const correlation =
Number(data.correlationScore ?? 0)

const breadth =
Number(data.breadth50 ?? 0) * 100

const move =
Number(data.moveIndex ?? 0)

const rsSmall =
Number(data.rsSmall ?? 1)

const rsEqual =
Number(data.rsEqual ?? 1)

const rsGrowth =
Number(data.rsGrowth ?? 1)

const participationScore =
Number(data.participationScore ?? 50)

/* =====================================================
STRUCTURAL FLAGS
===================================================== */

const calmContango =
vix < 20 &&
vixTerm >= 0.95 &&
vixTerm <= 1.08

const weakInternals =
breadth < 60

const veryWeakInternals =
breadth < 52

const narrowLeadership =
rsGrowth > 1.03 &&
rsSmall < 0.995 &&
rsEqual < 0.995

const megaCapLeadership =
rsGrowth > 1.05 &&
rsSmall < 0.98 &&
rsEqual < 0.98

const weakParticipation =
participationScore < 50

const severeWeakParticipation =
participationScore < 42

const equalWeightWeakness =
rsEqual < 0.99

const severeEqualWeightWeakness =
rsEqual < 0.97

const smallCapWeakness =
rsSmall < 0.99

const severeSmallCapWeakness =
rsSmall < 0.97

/* =====================================================
STRUCTURAL GAMMA FLOOR
===================================================== */

let effectiveGamma = rawGamma

if (
calmContango
) {
effectiveGamma =
Math.max(
effectiveGamma,
35
)
}

if (
calmContango &&
weakInternals
) {
effectiveGamma =
Math.max(
effectiveGamma,
45
)
}

if (
calmContango &&
megaCapLeadership
) {
effectiveGamma =
Math.max(
effectiveGamma,
55
)
}

/* ================= TERM STRUCTURE ================= */

let termState = "CONTANGO"

if (
vix > 22 &&
(vixTerm < 0.9 || vixTerm > 1.1)
) {
termState = "BACKWARDATION"
}

else if (
vixTerm > 0.95 &&
vixTerm < 1.05
) {
termState = "FLAT"
}

/* ================= STATES ================= */

const volState =
vix < 18 ? "LOW" :
vix < 25 ? "NORMAL" :
"HIGH"

const volOfVolState =
volOfVol > 1.3 ? "STRESS" :
volOfVol > 1.1 ? "ELEVATED" :
"NORMAL"

const skewState =
skew > 120 ? "CRASH_HEDGE" :
skew > 105 ? "ELEVATED" :
"NORMAL"

const gammaState =
effectiveGamma < 0 ? "NEGATIVE" :
effectiveGamma > 0 ? "POSITIVE" :
"NEUTRAL"

/* ================= MOVE ================= */

let moveState = "NORMAL"

if (move > 90) {
moveState = "EXTREME"
}

else if (move > 75) {
moveState = "ELEVATED"
}

/* =====================================================
DEALER COMPRESSION
===================================================== */

let dealerCompression = 0

if (effectiveGamma >= 15) {
dealerCompression += 25
}

if (effectiveGamma >= 25) {
dealerCompression += 20
}

if (vix < 18) {
dealerCompression += 20
}

if (breadth < 60) {
dealerCompression += 20
}

if (
effectiveGamma >= 25 &&
vix < 18 &&
breadth < 60
) {
dealerCompression += 15
}

if (
megaCapLeadership
) {
dealerCompression += 10
}

dealerCompression =
clamp(
Math.round(dealerCompression)
)

/* =====================================================
PASSIVE FLOW RISK
===================================================== */

let passiveFlowRisk = 0

if (vix < 17) {
passiveFlowRisk += 25
}

if (breadth < 58) {
passiveFlowRisk += 25
}

if (liquidity > 65) {
passiveFlowRisk += 15
}

if (effectiveGamma >= 20) {
passiveFlowRisk += 15
}

if (narrowLeadership) {
passiveFlowRisk += 12
}

if (megaCapLeadership) {
passiveFlowRisk += 15
}

if (
calmContango &&
weakInternals
) {
passiveFlowRisk += 10
}

passiveFlowRisk =
clamp(
Math.round(passiveFlowRisk)
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

if (breadth < 60) {
volSuppression += 15
}

if (megaCapLeadership) {
volSuppression += 10
}

volSuppression =
clamp(
Math.round(volSuppression)
)

/* =====================================================
GLOBAL STATE
===================================================== */

let globalState = "NEUTRAL"

if (
vix < 18 &&
termState === "CONTANGO" &&
gammaState === "POSITIVE" &&
liquidity > 70
) {
globalState = "RISK_ON"
}

if (
vix > 25 ||
termState === "BACKWARDATION" ||
gammaState === "NEGATIVE"
) {
globalState = "RISK_OFF"
}

/*
IMPORTANT:
calm tape can be dangerous
*/

if (
dealerCompression >= 60 &&
passiveFlowRisk >= 55
) {
globalState =
"COMPRESSED_MELTUP"
}

/* =====================================================
FRAGILITY
===================================================== */

let fragility = 0

if (volOfVol > 1.2) {
fragility += 1
}

if (skew > 110) {
fragility += 1
}

if (correlation > 2) {
fragility += 1
}

if (dealerCompression >= 60) {
fragility += 2
}

if (volSuppression >= 60) {
fragility += 2
}

if (
passiveFlowRisk >= 60
) {
fragility += 2
}

/* =====================================================
NEW STRUCTURAL FRAGILITY
===================================================== */

/*
CRITICAL FIX:
MarketDrivers must reflect:
- narrow leadership
- weak participation
- weak equal weight
- weak small caps
Otherwise:
globalState becomes falsely bullish.
*/

if (
narrowLeadership &&
weakParticipation
) {
fragility += 15;
}

if (
equalWeightWeakness
) {
fragility += 6;
}

if (
smallCapWeakness
) {
fragility += 6;
}

if (
veryWeakInternals
) {
fragility += 8;
}

if (
megaCapLeadership &&
severeWeakParticipation
) {
fragility += 10;
}

if (
severeEqualWeightWeakness &&
severeSmallCapWeakness
) {
fragility += 10;
}

fragility =
clamp(fragility)

/* =====================================================
SCORE
===================================================== */

let score = 0

/* ================= POSITIVE ================= */

if (
globalState === "RISK_ON"
) {
score += 15
}

if (
globalState === "COMPRESSED_MELTUP"
) {
score += 8
}

if (
liquidity > 70
) {
score += 6
}

if (
gammaState === "POSITIVE"
) {
score += 6
}

if (
vix < 18
) {
score += 5
}

/* ================= NEGATIVE ================= */

if (
narrowLeadership &&
weakParticipation
) {
score -= 10;
}

if (
equalWeightWeakness
) {
score -= 4;
}

if (
smallCapWeakness
) {
score -= 4;
}

if (
weakInternals
) {
score -= 6;
}

if (
veryWeakInternals
) {
score -= 8;
}

if (
passiveFlowRisk >= 60
) {
score -= 6;
}

if (
dealerCompression >= 60
) {
score -= 5;
}

if (
megaCapLeadership
) {
score -= 5;
}

if (
severeWeakParticipation
) {
score -= 8;
}

if (
globalState === "RISK_OFF"
) {
score -= 20;
}

/* =====================================================
STRUCTURAL GLOBAL STATE OVERRIDE
===================================================== */

/*
Institutional override:
Do NOT allow pure RISK_ON
when internals are weak.
*/

if (

globalState === "RISK_ON" &&

(
narrowLeadership ||
weakParticipation ||
equalWeightWeakness ||
smallCapWeakness
)

) {

globalState =
"FRAGILE_RISK_ON";
}

/* =====================================================
SEVERE INTERNAL DETERIORATION
===================================================== */

if (

megaCapLeadership &&

severeWeakParticipation &&

veryWeakInternals

) {

globalState =
"INTERNAL_DISTRIBUTION";
}

/* =====================================================
FINAL SCORE
===================================================== */

score =
clamp(
Math.round(score),
-100,
100
)

/* =====================================================
RETURN
===================================================== */

return {

score,

states: {

vol: volState,

term: termState,

volOfVol: volOfVolState,

skew: skewState,

gamma: gammaState,

liquidity:
liquidity > 70
? "ABUNDANT"
: "NORMAL",

credit:
credit > 0.9
? "RISK_ON"
: "NEUTRAL",

move: moveState
},

fragility,

globalState,

dealerCompression,

passiveFlowRisk,

volSuppression,

raw: {
vix,
vixTerm,
volOfVol,
skew,

rawGamma,
effectiveGamma,

liquidity,
credit,
correlation,
breadth,
move,

participationScore,

narrowLeadership,
megaCapLeadership,

weakParticipation,
severeWeakParticipation,

equalWeightWeakness,
smallCapWeakness
}
}
}
