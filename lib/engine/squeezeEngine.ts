// /lib/engine/squeezeEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

/* =====================================================
SQUEEZE ENGINE

SEMANTICS

risk:
0 = low squeeze / positioning risk
100 = extreme squeeze / positioning risk

IMPORTANT:

This engine measures POSITIONING INSTABILITY.

It is NOT automatically bullish or bearish.

A high score can describe:

- short squeeze risk
- volatility squeeze
- liquidity squeeze
- passive-flow squeeze
- reflexive melt-up risk

Therefore:

HIGH RISK ≠ automatically PUT signal.

The Master Score / Trade Engine decides directional
interpretation.
===================================================== */


/* =====================================================
INPUT
===================================================== */

export interface SqueezeEngineInput {

gammaExposure?: number;

vix?: number;

moveIndex?: number;

breadth50?: number;

breadth200?: number;

putCallRatio?: number;

shortInterest?: number;


/* =====================================================
EXISTING
===================================================== */

vixTermRatio?: number;

creditRatio?: number;

marketLiquidityScore?: number;


/* =====================================================
STRUCTURAL INPUTS
===================================================== */

dealerCompression?: number;

passiveFlowRisk?: number;

volSuppression?: number;

structuralGammaFloor?: number;

passiveGammaCompression?: number;

rsSmall?: number;

rsEqual?: number;

rsGrowth?: number;

participationScore?: number;

}


/* =====================================================
OUTPUT
===================================================== */

export interface SqueezeEngineOutput {

risk: number;

state:
| "LOW"
| "MODERATE"
| "HIGH"
| "EXTREME";

squeezeType:
| "NONE"
| "SHORT_SQUEEZE"
| "VOL_SQUEEZE"
| "LIQUIDITY_SQUEEZE"
| "PASSIVE_FLOW_SQUEEZE";

instability: number;


/* =====================================================
STRUCTURAL DIAGNOSTICS
===================================================== */

effectiveGamma: number;

structuralGammaFloor: number;

passiveGammaCompression: number;

dealerCompression: number;

passiveFlowRisk: number;

volSuppression: number;

narrowLeadership: boolean;

weakBreadth: boolean;

weakParticipation: boolean;

summary: string;


/* =====================================================
METRICS
===================================================== */

metrics: {

gamma: number;

effectiveGamma: number;

structuralGammaFloor: number;

vix: number;

move: number;

breadth50: number;

breadth200: number;

putCall: number;

shortInterest: number;

vixTerm: number;

credit: number;

liquidity: number;

dealerCompression: number;

passiveFlowRisk: number;

volSuppression: number;

passiveGammaCompression: number;

rsSmall: number;

rsEqual: number;

rsGrowth: number;

participationScore: number;

narrowLeadership: boolean;

severeNarrowLeadership: boolean;

megaCapOnlyTape: boolean;

weakBreadth: boolean;

breadthFailure: boolean;

weakParticipation: boolean;

};

}


/* =====================================================
HELPERS
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


function numberOr(
value: unknown,
fallback: number
) {

const numeric =
Number(value);

return Number.isFinite(numeric)
? numeric
: fallback;

}


/* =====================================================
ENGINE
===================================================== */

export function squeezeEngine(
input: SqueezeEngineInput
): SqueezeEngineOutput {


/* =====================================================
INPUT
===================================================== */

const rawGamma =
numberOr(
input.gammaExposure,
0
);


const vix =
numberOr(
input.vix,
20
);


const move =
numberOr(
input.moveIndex,
80
);


const breadth50 =
clamp(
numberOr(
input.breadth50,
50
)
);


const breadth200 =
clamp(
numberOr(
input.breadth200,
50
)
);


const putCall =
numberOr(
input.putCallRatio,
1
);


const shortInterest =
clamp(
numberOr(
input.shortInterest,
50
)
);


const vixTerm =
numberOr(
input.vixTermRatio,
1
);


const credit =
numberOr(
input.creditRatio,
1
);


const liquidity =
clamp(
numberOr(
input.marketLiquidityScore,
50
)
);


const rsSmall =
numberOr(
input.rsSmall,
1
);


const rsEqual =
numberOr(
input.rsEqual,
1
);


const rsGrowth =
numberOr(
input.rsGrowth,
1
);


const participationScore =
clamp(
numberOr(
input.participationScore,
50
)
);


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

});


const {

narrowLeadership,

severeNarrowLeadership,

megaCapOnlyTape,

equalWeightWeakness,

smallCapWeakness,

breadthFailure

} = structureFlags;


/* =====================================================
STRUCTURAL CONDITIONS
===================================================== */

const contango =
vixTerm >= 0.98;


const calmVolatility =
vix < 18;


const veryCalmVolatility =
vix < 17;


const weakBreadth =
breadth50 < 58;


const severeWeakBreadth =
breadth50 < 45;


const weakParticipation =
participationScore < 50;


const severeWeakParticipation =
participationScore < 42;


/* =====================================================
STRUCTURAL GAMMA FLOOR

IMPORTANT:

A positive structural gamma environment can suppress
realized volatility.

That does NOT automatically mean healthy conditions.

It can create:

- dealer compression
- passive-flow dependence
- reflexive melt-up structures
===================================================== */

let structuralGammaFloor =
numberOr(
input.structuralGammaFloor,
0
);


/*
* Only derive a floor when no external engine
* already supplied one.
*/

if (
structuralGammaFloor <= 0
) {

if (
vix < 20 &&
contango
) {

structuralGammaFloor =
35;

}


if (
vix < 18 &&
contango &&
narrowLeadership
) {

structuralGammaFloor =
Math.max(
structuralGammaFloor,
45
);

}


if (
megaCapOnlyTape &&
weakBreadth
) {

structuralGammaFloor =
Math.max(
structuralGammaFloor,
55
);

}


if (
weakBreadth &&
weakParticipation &&
vix < 20 &&
contango
) {

structuralGammaFloor =
Math.max(
structuralGammaFloor,
60
);

}

}


structuralGammaFloor =
clamp(
structuralGammaFloor
);


const effectiveGamma =
Math.max(
rawGamma,
structuralGammaFloor
);


/* =====================================================
PASSIVE GAMMA COMPRESSION
===================================================== */

let passiveGammaCompression =
numberOr(
input.passiveGammaCompression,
0
);


/*
* Auto-derived only when no external value exists.
*/

if (
passiveGammaCompression <= 0
) {

if (contango) {

passiveGammaCompression += 15;

}


if (vix < 20) {

passiveGammaCompression += 15;

}


if (calmVolatility) {

passiveGammaCompression += 10;

}


if (narrowLeadership) {

passiveGammaCompression += 18;

}


if (weakBreadth) {

passiveGammaCompression += 18;

}


if (weakParticipation) {

passiveGammaCompression += 12;

}


if (megaCapOnlyTape) {

passiveGammaCompression += 12;

}


if (
severeWeakBreadth &&
severeWeakParticipation
) {

passiveGammaCompression += 10;

}

}


passiveGammaCompression =
clamp(
Math.round(
passiveGammaCompression
)
);


/* =====================================================
DEALER COMPRESSION
===================================================== */

let dealerCompression =
numberOr(
input.dealerCompression,
0
);


if (
dealerCompression <= 0
) {

if (
effectiveGamma >= 20
) {

dealerCompression += 18;

}


if (
effectiveGamma >= 35
) {

dealerCompression += 15;

}


if (
effectiveGamma >= 50
) {

dealerCompression += 8;

}


if (
vix < 18
) {

dealerCompression += 15;

}


if (
weakBreadth
) {

dealerCompression += 15;

}


if (
severeWeakBreadth
) {

dealerCompression += 8;

}


dealerCompression +=
Math.round(
passiveGammaCompression * 0.18
);


if (
effectiveGamma >= 30 &&
calmVolatility &&
weakBreadth
) {

dealerCompression += 12;

}

}


dealerCompression =
clamp(
Math.round(
dealerCompression
)
);


/* =====================================================
PASSIVE FLOW RISK
===================================================== */

let passiveFlowRisk =
numberOr(
input.passiveFlowRisk,
0
);


if (
passiveFlowRisk <= 0
) {

if (
effectiveGamma > 10
) {

passiveFlowRisk += 12;

}


if (
vix < 17
) {

passiveFlowRisk += 15;

}


if (
weakBreadth
) {

passiveFlowRisk += 20;

}


if (
liquidity > 65
) {

passiveFlowRisk += 8;

}


if (
narrowLeadership
) {

passiveFlowRisk += 10;

}


passiveFlowRisk +=
Math.round(
passiveGammaCompression * 0.18
);


if (
breadth50 < 55 &&
veryCalmVolatility
) {

passiveFlowRisk += 12;

}

}


passiveFlowRisk =
clamp(
Math.round(
passiveFlowRisk
)
);


/* =====================================================
VOL SUPPRESSION
===================================================== */

let volSuppression =
numberOr(
input.volSuppression,
0
);


if (
volSuppression <= 0
) {

if (
vix < 17
) {

volSuppression += 20;

}


if (
vixTerm >= 0.95 &&
vixTerm <= 1.08
) {

volSuppression += 15;

}


if (
effectiveGamma >= 20
) {

volSuppression += 12;

}


if (
weakBreadth
) {

volSuppression += 12;

}


if (
move > 85
) {

volSuppression += 8;

}


if (
passiveGammaCompression >= 60
) {

volSuppression += 10;

}


if (
narrowLeadership
) {

volSuppression += 8;

}

}


volSuppression =
clamp(
Math.round(
volSuppression
)
);


/* =====================================================
BASE RISK
===================================================== */

let risk = 15;


/* =====================================================
PASSIVE COMPRESSION LAYER
===================================================== */

risk +=
Math.round(
passiveGammaCompression * 0.14
);


risk +=
Math.round(
dealerCompression * 0.14
);


risk +=
Math.round(
passiveFlowRisk * 0.13
);


risk +=
Math.round(
volSuppression * 0.14
);


/*
* Combined passive regime.
*/

if (
calmVolatility &&
weakBreadth &&
effectiveGamma >= 25
) {

risk += 8;

}


if (
veryCalmVolatility &&
breadth50 < 55 &&
effectiveGamma >= 30
) {

risk += 6;

}


/* =====================================================
NEGATIVE GAMMA

Negative gamma is fundamentally different from
positive passive compression.

It increases immediate instability.
===================================================== */

if (
rawGamma < 0
) {

risk += 20;

}


if (
rawGamma < -5
) {

risk += 8;

}


if (
rawGamma < -15
) {

risk += 8;

}


/* =====================================================
STRUCTURAL COMPRESSION

Positive gamma is only a risk here when combined
with suppressed volatility and weak internals.
===================================================== */

if (
effectiveGamma >= 35 &&
calmVolatility &&
weakBreadth
) {

risk += 7;

}


if (
passiveGammaCompression >= 65
) {

risk += 8;

}


/* =====================================================
VOLATILITY
===================================================== */

if (
vix > 22
) {

risk += 8;

}


if (
vix > 30
) {

risk += 10;

}


if (
vix > 40
) {

risk += 8;

}


/* =====================================================
RATE / BOND VOLATILITY
===================================================== */

if (
move > 100
) {

risk += 8;

}


if (
move > 120
) {

risk += 8;

}


/* =====================================================
BREADTH
===================================================== */

if (
breadth50 < 50
) {

risk += 5;

}


if (
breadth50 < 40
) {

risk += 8;

}


if (
breadth200 < 40
) {

risk += 6;

}


if (
breadthFailure
) {

risk += 8;

}


/* =====================================================
PARTICIPATION
===================================================== */

if (
weakParticipation
) {

risk += 5;

}


if (
severeWeakParticipation
) {

risk += 7;

}


/* =====================================================
POSITIONING
===================================================== */

if (
putCall > 1.10
) {

risk += 6;

}


if (
putCall > 1.25
) {

risk += 6;

}


if (
shortInterest > 70
) {

risk += 8;

}


if (
shortInterest > 85
) {

risk += 8;

}


/* =====================================================
LIQUIDITY / CREDIT
===================================================== */

/*
* Existing project semantics retained:
*
* Lower credit ratio = deterioration / stress.
*/

if (
credit < 0.98
) {

risk += 4;

}


if (
credit < 0.95
) {

risk += 8;

}


if (
liquidity < 40
) {

risk += 7;

}


if (
liquidity < 30
) {

risk += 8;

}


/* =====================================================
REFLEXIVE MELT-UP RISK
===================================================== */

if (
dealerCompression >= 60 &&
passiveFlowRisk >= 55 &&
volSuppression >= 55
) {

risk += 10;

}


/*
* Most important structural passive regime.
*/

if (
passiveGammaCompression >= 70 &&
weakBreadth &&
weakParticipation
) {

risk += 12;

}


/*
* Mega-cap concentration can make a market appear
* stable while positioning becomes increasingly reflexive.
*/

if (
megaCapOnlyTape &&
calmVolatility &&
weakParticipation
) {

risk += 8;

}


/* =====================================================
FINAL RISK
===================================================== */

risk =
clamp(
Math.round(
risk
)
);


/* =====================================================
STATE
===================================================== */

let state:
| "LOW"
| "MODERATE"
| "HIGH"
| "EXTREME";


if (
risk >= 80
) {

state =
"EXTREME";

}

else if (
risk >= 60
) {

state =
"HIGH";

}

else if (
risk >= 35
) {

state =
"MODERATE";

}

else {

state =
"LOW";

}


/* =====================================================
SQUEEZE TYPE

Priority:

1. Passive Flow Squeeze
2. Short Squeeze
3. Liquidity Squeeze
4. Volatility Squeeze
===================================================== */

let squeezeType:
| "NONE"
| "SHORT_SQUEEZE"
| "VOL_SQUEEZE"
| "LIQUIDITY_SQUEEZE"
| "PASSIVE_FLOW_SQUEEZE";


if (
dealerCompression >= 60 &&
passiveFlowRisk >= 60 &&
passiveGammaCompression >= 55
) {

squeezeType =
"PASSIVE_FLOW_SQUEEZE";

}


else if (
shortInterest > 70 &&
rawGamma < 0
) {

squeezeType =
"SHORT_SQUEEZE";

}


else if (
breadth50 < 40 &&
rawGamma < 0
) {

squeezeType =
"LIQUIDITY_SQUEEZE";

}


else if (
vix > 28 &&
move > 100
) {

squeezeType =
"VOL_SQUEEZE";

}


else {

squeezeType =
"NONE";

}


/* =====================================================
INSTABILITY
===================================================== */

let instability =
risk;


/*
* Immediate forced-move environment.
*/

if (
rawGamma < 0
) {

instability += 8;

}


if (
vix > 30 &&
move > 110
) {

instability += 8;

}


/*
* Passive compression instability.
*/

if (
dealerCompression >= 60
) {

instability += 8;

}


if (
passiveGammaCompression >= 65
) {

instability += 8;

}


if (
passiveFlowRisk >= 65 &&
weakBreadth
) {

instability += 8;

}


instability =
clamp(
Math.round(
instability
)
);


/* =====================================================
SUMMARY
===================================================== */

let summary =
"Low positioning and squeeze instability";


if (
squeezeType ===
"PASSIVE_FLOW_SQUEEZE"
) {

summary =
"Reflexive passive-flow squeeze structure detected";

}


else if (
squeezeType ===
"SHORT_SQUEEZE"
) {

summary =
"Short positioning and negative gamma squeeze risk elevated";

}


else if (
squeezeType ===
"LIQUIDITY_SQUEEZE"
) {

summary =
"Liquidity squeeze risk elevated under weak market breadth";

}


else if (
squeezeType ===
"VOL_SQUEEZE"
) {

summary =
"Volatility squeeze and forced positioning environment";

}


else if (
state ===
"MODERATE"
) {

summary =
"Elevated squeeze dynamics beneath market stability";

}


else if (
state ===
"HIGH"
) {

summary =
"High positioning and squeeze risk environment";

}


else if (
state ===
"EXTREME"
) {

summary =
"Extreme forced positioning and squeeze instability";

}


if (
megaCapOnlyTape &&
squeezeType !==
"PASSIVE_FLOW_SQUEEZE"
) {

summary +=
" | Narrow leadership distortion";

}


if (
passiveGammaCompression >= 65
) {

summary +=
" | Passive gamma compression elevated";

}


/* =====================================================
RETURN
===================================================== */

return {

risk,

state,

squeezeType,

instability,


/* ===================================================
STRUCTURAL DIAGNOSTICS
=================================================== */

effectiveGamma,

structuralGammaFloor,

passiveGammaCompression,

dealerCompression,

passiveFlowRisk,

volSuppression,

narrowLeadership,

weakBreadth,

weakParticipation,

summary,


/* ===================================================
METRICS
=================================================== */

metrics: {

gamma:
rawGamma,

effectiveGamma,

structuralGammaFloor,

vix,

move,

breadth50,

breadth200,

putCall,

shortInterest,

vixTerm,

credit,

liquidity,

dealerCompression,

passiveFlowRisk,

volSuppression,

passiveGammaCompression,

rsSmall,

rsEqual,

rsGrowth,

participationScore,

narrowLeadership,

severeNarrowLeadership,

megaCapOnlyTape,

weakBreadth,

breadthFailure,

weakParticipation

}

};

}
