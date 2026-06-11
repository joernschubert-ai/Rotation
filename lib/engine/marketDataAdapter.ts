// /lib/engine/marketDataAdapter.ts

export function marketDataAdapter(
raw: any
) {

return {

/* =====================================================
META
===================================================== */

date:
raw.date ?? "",

phase:
raw.phase ??
"PHASE_1_EXPANSION",

/* =====================================================
VOLATILITY
===================================================== */

marketData: {
"^VIX": {
current:
Number(raw.vix ?? 18)
}
},

vixTermRatio:
Number(raw.vixTerm ?? 1),

volOfVolRatio:
Number(raw.volOfVol ?? 1),

gammaExposure:
Number(raw.gamma ?? 0),

moveIndex:
Number(raw.move ?? 80),

/* =====================================================
CREDIT / LIQUIDITY
===================================================== */

marketLiquidityScore:
Number(raw.liquidity ?? 50),

creditRatio:
Number(raw.credit ?? 1),

correlationScore:
Number(raw.correlation ?? 1),

/* =====================================================
BREADTH
===================================================== */

breadth20:
Number(raw.breadth20 ?? 50),

breadth50:
Number(raw.breadth50 ?? 50),

breadth200:
Number(raw.breadth200 ?? 50),

ad:
Number(raw.ad ?? 0),

highs:
Number(raw.highs ?? 0),

lows:
Number(raw.lows ?? 0),

volumeRatio:
Number(raw.volumeRatio ?? 1),

structureHealth:
Number(raw.structureHealth ?? 50),

/* =====================================================
ROTATION
===================================================== */

rsGrowth:
Number(raw.rsGrowth ?? 1),

rsEqual:
Number(raw.rsEqual ?? 1),

rsSmall:
Number(raw.rsSmall ?? 1),

rotationScore:
Number(raw.rotationScore ?? 50),

concentrationScore:
Number(
raw.concentrationScore ?? 50
),

/* =====================================================
FRAGILITY
===================================================== */

fragilityScore:
Number(raw.fragilityScore ?? 50),

/* =====================================================
DECAY
===================================================== */

rotationDecayScore:
Number(
raw.rotationDecayScore ?? 0
),

rotationDecayState:
raw.rotationDecayState ??
"HEALTHY_ROTATION",

momentumQuality:
Number(
raw.momentumQuality ?? 70
),

/* =====================================================
REGIME
===================================================== */

regimeAligned:
Boolean(
raw.regimeAligned ?? false
),

regimeSyncScore:
Number(
raw.regimeSyncScore ?? 50
),

/* =====================================================
CRASH
===================================================== */

crash: {

score:
Number(raw.crashScore ?? 0),

probability:
Number(
raw.crashProbability ?? 0
)
},

/* =====================================================
FUTURE RETURNS
===================================================== */

futureReturns: {
d5:
Number(
raw.futureReturns?.d5 ?? 0
),

d10:
Number(
raw.futureReturns?.d10 ?? 0
),

d20:
Number(
raw.futureReturns?.d20 ?? 0
),

d60:
Number(
raw.futureReturns?.d60 ?? 0
)
}
}
}
