// /lib/engine/marketDrivers.ts

/* =====================================================
MARKET DRIVERS ENGINE
=====================================================

SEMANTICS

This engine evaluates the external and structural
market-driver environment.

POSITIVE:
- healthy volatility structure
- sufficient liquidity
- constructive gamma
- broad participation

RISK:
- volatility stress
- negative gamma
- narrow leadership
- weak participation
- dealer compression
- passive flow concentration

IMPORTANT:

marketDrivers.score is a DRIVER QUALITY SCORE.

HIGHER = MORE CONSTRUCTIVE
LOWER = MORE DEFENSIVE

Fragility and compression metrics are separate
RISK metrics.

===================================================== */

function clamp(
value: number,
min = 0,
max = 100
) {

if (!Number.isFinite(value)) {
return min;
}

return Math.max(
min,
Math.min(max, value)
);

}

function round(
value: number,
decimals = 1
) {

const factor =
Math.pow(10, decimals);

return (
Math.round(value * factor) /
factor
);

}

export function marketDriversEngine(
data: any
) {

/* =====================================================
RAW INPUT
===================================================== */

const vix =
Number(
data.marketData?.["^VIX"]?.current ??
0
);

const vixTerm =
Number(
data.vixTermRatio ?? 1
);

const volOfVol =
Number(
data.volOfVolRatio ?? 1
);

const skew =
Number(
data.optionsSkewRatio ?? 100
);

const rawGamma =
Number(
data.gammaExposure ?? 0
);

const liquidity =
clamp(
Number(
data.marketLiquidityScore ?? 50
)
);

const credit =
Number(
data.creditRatio ?? 1
);

const correlation =
Number(
data.correlationScore ?? 0
);

const breadth =
clamp(
Number(
data.breadth50 ?? 0
) * 100
);

/*
* MOVE is rounded to one decimal place.
*/

const move =
round(
Number(
data.moveIndex ?? 0
),
1
);

const rsSmall =
Number(
data.rsSmall ?? 1
);

const rsEqual =
Number(
data.rsEqual ?? 1
);

const rsGrowth =
Number(
data.rsGrowth ?? 1
);

const participationScore =
clamp(
Number(
data.participationScore ?? 50
)
);


/* =====================================================
STRUCTURAL FLAGS
===================================================== */

const calmContango =

vix < 20 &&

vixTerm >= 0.95 &&

vixTerm <= 1.08;


const weakInternals =
breadth < 60;

const veryWeakInternals =
breadth < 52;


/* =====================================================
LEADERSHIP
===================================================== */

const narrowLeadership =

rsGrowth > 1.03 &&

rsSmall < 0.995 &&

rsEqual < 0.995;


const megaCapLeadership =

rsGrowth > 1.05 &&

rsSmall < 0.98 &&

rsEqual < 0.98;


/* =====================================================
PARTICIPATION
===================================================== */

const weakParticipation =
participationScore < 50;

const severeWeakParticipation =
participationScore < 42;


/* =====================================================
EQUAL WEIGHT
===================================================== */

const equalWeightWeakness =
rsEqual < 0.99;

const severeEqualWeightWeakness =
rsEqual < 0.97;


/* =====================================================
SMALL CAPS
===================================================== */

const smallCapWeakness =
rsSmall < 0.99;

const severeSmallCapWeakness =
rsSmall < 0.97;


/* =====================================================
STRUCTURAL GAMMA FLOOR
=====================================================

Calm markets with strong dealer positioning can
suppress volatility.

This is NOT automatically bullish.

Therefore effectiveGamma is used only for
compression diagnostics.

===================================================== */

let effectiveGamma =
rawGamma;


if (
calmContango
) {

effectiveGamma =
Math.max(
effectiveGamma,
35
);

}


if (
calmContango &&
weakInternals
) {

effectiveGamma =
Math.max(
effectiveGamma,
45
);

}


if (
calmContango &&
megaCapLeadership
) {

effectiveGamma =
Math.max(
effectiveGamma,
55
);

}


/* =====================================================
TERM STRUCTURE
===================================================== */

let termState:
| "CONTANGO"
| "FLAT"
| "BACKWARDATION" =
"CONTANGO";


if (
vix > 22 &&
(
vixTerm < 0.90 ||
vixTerm > 1.10
)
) {

termState =
"BACKWARDATION";

}

else if (
vixTerm >= 0.95 &&
vixTerm <= 1.05
) {

termState =
"FLAT";

}


/* =====================================================
VOLATILITY STATES
===================================================== */

const volState =

vix < 18
? "LOW"

: vix < 25
? "NORMAL"

: "HIGH";


const volOfVolState =

volOfVol > 1.30
? "STRESS"

: volOfVol > 1.10
? "ELEVATED"

: "NORMAL";


const skewState =

skew > 120
? "CRASH_HEDGE"

: skew > 105
? "ELEVATED"

: "NORMAL";


const gammaState =

effectiveGamma < 0
? "NEGATIVE"

: effectiveGamma > 0
? "POSITIVE"

: "NEUTRAL";


/* =====================================================
MOVE
===================================================== */

let moveState:
| "NORMAL"
| "ELEVATED"
| "EXTREME" =
"NORMAL";


if (
move > 90
) {

moveState =
"EXTREME";

}

else if (
move > 75
) {

moveState =
"ELEVATED";

}


/* =====================================================
DEALER COMPRESSION RISK
=====================================================

HIGH = MORE COMPRESSION RISK

===================================================== */

let dealerCompression = 0;


if (
effectiveGamma >= 15
) {

dealerCompression += 20;

}


if (
effectiveGamma >= 25
) {

dealerCompression += 15;

}


if (
vix < 18
) {

dealerCompression += 15;

}


if (
breadth < 60
) {

dealerCompression += 15;

}


if (
effectiveGamma >= 25 &&
vix < 18 &&
breadth < 60
) {

dealerCompression += 15;

}


if (
megaCapLeadership
) {

dealerCompression += 10;

}


if (
narrowLeadership
) {

dealerCompression += 5;

}


dealerCompression =
clamp(
Math.round(
dealerCompression
)
);


/* =====================================================
PASSIVE FLOW RISK
=====================================================

HIGH = MORE PASSIVE FLOW CONCENTRATION RISK

===================================================== */

let passiveFlowRisk = 0;


if (
vix < 17
) {

passiveFlowRisk += 20;

}


if (
breadth < 58
) {

passiveFlowRisk += 20;

}


if (
liquidity > 65
) {

passiveFlowRisk += 10;

}


if (
effectiveGamma >= 20
) {

passiveFlowRisk += 15;

}


if (
narrowLeadership
) {

passiveFlowRisk += 15;

}


if (
megaCapLeadership
) {

passiveFlowRisk += 15;

}


if (
calmContango &&
weakInternals
) {

passiveFlowRisk += 10;

}


if (
weakParticipation
) {

passiveFlowRisk += 10;

}


passiveFlowRisk =
clamp(
Math.round(
passiveFlowRisk
)
);


/* =====================================================
VOLATILITY SUPPRESSION RISK
=====================================================

HIGH = VOLATILITY MAY BE ARTIFICIALLY SUPPRESSED

===================================================== */

let volSuppression = 0;


if (
vix < 17
) {

volSuppression += 25;

}


if (
vixTerm >= 0.95 &&
vixTerm <= 1.08
) {

volSuppression += 20;

}


if (
effectiveGamma >= 15
) {

volSuppression += 15;

}


if (
breadth < 60
) {

volSuppression += 15;

}


if (
megaCapLeadership
) {

volSuppression += 10;

}


if (
weakParticipation
) {

volSuppression += 10;

}


volSuppression =
clamp(
Math.round(
volSuppression
)
);


/* =====================================================
STRUCTURAL FRAGILITY
=====================================================

HIGH = FRAGILE

===================================================== */

let fragility = 0;


/* ================= VOLATILITY ================= */

if (
volOfVol > 1.20
) {

fragility += 8;

}


if (
skew > 110
) {

fragility += 8;

}


if (
correlation > 2
) {

fragility += 8;

}


/* ================= COMPRESSION ================= */

if (
dealerCompression >= 60
) {

fragility += 15;

}


if (
volSuppression >= 60
) {

fragility += 15;

}


if (
passiveFlowRisk >= 60
) {

fragility += 15;

}


/* ================= INTERNALS ================= */

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
clamp(
Math.round(
fragility
)
);


/* =====================================================
GLOBAL MARKET STATE
===================================================== */

let globalState:
| "RISK_ON"
| "FRAGILE_RISK_ON"
| "COMPRESSED_MELTUP"
| "INTERNAL_DISTRIBUTION"
| "RISK_OFF"
| "NEUTRAL" =
"NEUTRAL";


/* ================= HARD RISK CONDITIONS ================= */

if (
vix > 25 ||
termState === "BACKWARDATION" ||
gammaState === "NEGATIVE"
) {

globalState =
"RISK_OFF";

}


/* ================= INTERNAL DISTRIBUTION ================= */

else if (
megaCapLeadership &&
severeWeakParticipation &&
veryWeakInternals
) {

globalState =
"INTERNAL_DISTRIBUTION";

}


/* ================= COMPRESSED MELTUP ================= */

else if (
dealerCompression >= 60 &&
passiveFlowRisk >= 55
) {

globalState =
"COMPRESSED_MELTUP";

}


/* ================= RISK ON ================= */

else if (
vix < 18 &&
termState === "CONTANGO" &&
gammaState === "POSITIVE" &&
liquidity > 70
) {

globalState =
"RISK_ON";

}


/* =====================================================
STRUCTURAL RISK-ON OVERRIDE
===================================================== */

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
DRIVER QUALITY SCORE
=====================================================

HIGHER = MORE CONSTRUCTIVE

===================================================== */

let score = 50;


/* ================= VOLATILITY ================= */

if (
vix < 18
) {

score += 8;

}

else if (
vix > 25
) {

score -= 15;

}


/* ================= TERM ================= */

if (
termState === "CONTANGO"
) {

score += 5;

}

else if (
termState === "BACKWARDATION"
) {

score -= 12;

}


/* ================= LIQUIDITY ================= */

if (
liquidity > 70
) {

score += 8;

}

else if (
liquidity < 40
) {

score -= 10;

}


/* ================= GAMMA ================= */

if (
gammaState === "POSITIVE"
) {

score += 5;

}

else if (
gammaState === "NEGATIVE"
) {

score -= 15;

}


/* ================= INTERNALS ================= */

if (
narrowLeadership &&
weakParticipation
) {

score -= 10;

}


if (
equalWeightWeakness
) {

score -= 5;

}


if (
smallCapWeakness
) {

score -= 5;

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
severeWeakParticipation
) {

score -= 8;

}


if (
megaCapLeadership
) {

score -= 5;

}


/* ================= COMPRESSION ================= */

if (
passiveFlowRisk >= 60
) {

score -= 5;

}


if (
dealerCompression >= 60
) {

score -= 5;

}


if (
globalState === "RISK_OFF"
) {

score -= 10;

}


if (
globalState ===
"INTERNAL_DISTRIBUTION"
) {

score -= 12;

}


score =
clamp(
Math.round(score)
);


/* =====================================================
RETURN
===================================================== */

return {

/*
* Driver quality score.
*
* HIGH = CONSTRUCTIVE
* LOW = DEFENSIVE
*/

score,


/* ================= STATES ================= */

states: {

vol:
volState,

term:
termState,

volOfVol:
volOfVolState,

skew:
skewState,

gamma:
gammaState,

liquidity:

liquidity > 70
? "ABUNDANT"

: liquidity < 40
? "STRESSED"

: "NORMAL",

credit:

credit > 0.90
? "RISK_ON"

: credit < 0.80
? "STRESSED"

: "NEUTRAL",

move:
moveState,

},


/* ================= RISK METRICS ================= */

fragility,

globalState,

dealerCompression,

passiveFlowRisk,

volSuppression,


/* ================= RAW ================= */

raw: {

vix:
round(vix, 1),

vixTerm:
round(vixTerm, 3),

volOfVol:
round(volOfVol, 3),

skew:
round(skew, 1),

/*
* Keep both gamma values explicitly.
*/

rawGamma:
round(rawGamma, 1),

effectiveGamma:
round(effectiveGamma, 1),

liquidity:
round(liquidity, 1),

credit:
round(credit, 3),

correlation:
round(correlation, 2),

breadth:
round(breadth, 1),

/*
* MOVE explicitly rounded to one decimal.
*/

move:
round(move, 1),

participationScore:
round(participationScore, 1),


/* ================= STRUCTURAL FLAGS ================= */

narrowLeadership,

megaCapLeadership,

weakParticipation,

severeWeakParticipation,

equalWeightWeakness,

severeEqualWeightWeakness,

smallCapWeakness,

severeSmallCapWeakness,

weakInternals,

veryWeakInternals,

},

};

}
