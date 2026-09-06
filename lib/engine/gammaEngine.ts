// /lib/engine/gammaEngine.ts

export interface GammaEngineInput {
gammaExposure?: number;
vix?: number;
breadth50?: number;
liquidityScore?: number;
vixTermRatio?: number;

/* =====================================================
STRUCTURAL INPUTS
===================================================== */

rsSmall?: number;
rsEqual?: number;
rsGrowth?: number;
participationScore?: number;
}


export interface GammaEngineOutput {
/*
* STABILITY SCORE
*
* HIGH = stable
* LOW = unstable
*/

score: number;

state:
| "NEGATIVE_GAMMA"
| "NEUTRAL_GAMMA"
| "POSITIVE_GAMMA"
| "DEALER_COMPRESSION";

dealerCompression: number;
passiveFlowRisk: number;
volSuppression: number;

/*
* Structural diagnostics.
*/

structuralGammaFloor: number;

/*
* IMPORTANT:
*
* effectiveGamma represents the actual gamma
* environment and is NOT overwritten by the
* structural gamma floor.
*/

effectiveGamma: number;

passiveGammaCompression: number;

/*
* HIGH = unstable
*/

instability: number;

summary: string;
}


/* =====================================================
HELPERS
===================================================== */

function clamp(
value: number,
min = 0,
max = 100
) {

return Math.max(
min,
Math.min(max, value)
);

}


/* =====================================================
ENGINE
===================================================== */

export function gammaEngine(
input: GammaEngineInput
): GammaEngineOutput {


/* =====================================================
INPUT
===================================================== */

const rawGamma =
Number(
input.gammaExposure ?? 0
);

const vix =
Number(
input.vix ?? 20
);

const breadth50 =
Number(
input.breadth50 ?? 50
);

const liquidity =
Number(
input.liquidityScore ?? 50
);

const vixTerm =
Number(
input.vixTermRatio ?? 1
);

const rsSmall =
Number(
input.rsSmall ?? 1
);

const rsEqual =
Number(
input.rsEqual ?? 1
);

const rsGrowth =
Number(
input.rsGrowth ?? 1
);

const participationScore =
Number(
input.participationScore ?? 50
);


/* =====================================================
STRUCTURAL FLAGS
===================================================== */

const contango =
vixTerm >= 0.98;

const softVol =
vix < 20;

const veryLowVol =
vix < 17;


/*
* Narrow leadership:
*
* Growth leadership while Equal Weight and
* Small Caps fail to participate.
*/

const narrowLeadership = (

rsGrowth > 1.03 &&

rsSmall < 0.99 &&

rsEqual < 0.99

);


/*
* Severe Mega-Cap dominance.
*/

const megaCapLeadership = (

rsGrowth > 1.05 &&

rsSmall < 0.97 &&

rsEqual < 0.97

);


const weakBreadth =
breadth50 < 58;


const severeBreadthWeakness =
breadth50 < 50;


const weakParticipation =
participationScore < 50;


const severeParticipationWeakness =
participationScore < 42;


/* =====================================================
STRUCTURAL GAMMA FLOOR
===================================================== */

/*
* IMPORTANT:
*
* This is NOT actual gamma.
*
* It represents the minimum structural compression
* implied by market conditions.
*
* Raw gamma therefore remains untouched.
*/

let structuralGammaFloor = 0;


/*
* Quiet volatility + contango.
*/

if (
softVol &&
contango
) {

structuralGammaFloor = 35;

}


/*
* Quiet market with narrow leadership.
*/

if (
softVol &&
contango &&
narrowLeadership
) {

structuralGammaFloor = 45;

}


/*
* Mega-cap dominance with weak breadth.
*/

if (
megaCapLeadership &&
weakBreadth
) {

structuralGammaFloor = 55;

}


/*
* Most dangerous quiet-market configuration.
*/

if (

softVol &&

contango &&

weakBreadth &&

weakParticipation

) {

structuralGammaFloor = 60;

}


/*
* Extreme structural compression.
*/

if (

veryLowVol &&

contango &&

severeBreadthWeakness &&

severeParticipationWeakness &&

megaCapLeadership

) {

structuralGammaFloor = 75;

}


structuralGammaFloor =
clamp(
Math.round(
structuralGammaFloor
)
);


/*
* IMPORTANT:
*
* Never overwrite actual gamma.
*/

const effectiveGamma =
rawGamma;


/* =====================================================
PASSIVE GAMMA COMPRESSION
===================================================== */

let passiveGammaCompression = 0;


if (
contango
) {

passiveGammaCompression += 20;

}


if (
softVol
) {

passiveGammaCompression += 20;

}


if (
narrowLeadership
) {

passiveGammaCompression += 20;

}


if (
weakBreadth
) {

passiveGammaCompression += 20;

}


if (
weakParticipation
) {

passiveGammaCompression += 10;

}


if (
megaCapLeadership
) {

passiveGammaCompression += 10;

}


/*
* Structural gamma floor contributes
* additional compression information.
*/

passiveGammaCompression +=
Math.round(
structuralGammaFloor * 0.20
);


passiveGammaCompression =
clamp(
Math.round(
passiveGammaCompression
)
);


/* =====================================================
DEALER COMPRESSION
===================================================== */

let dealerCompression = 0;


/*
* Actual positive gamma can suppress realized
* volatility through dealer hedging.
*/

if (
effectiveGamma >= 10
) {

dealerCompression += 15;

}


if (
effectiveGamma >= 25
) {

dealerCompression += 20;

}


if (
effectiveGamma >= 45
) {

dealerCompression += 15;

}


/*
* Quiet volatility environment.
*/

if (
vix < 18
) {

dealerCompression += 20;

}


/*
* Weak internals increase fragility beneath
* compressed price behavior.
*/

if (
breadth50 < 60
) {

dealerCompression += 15;

}


if (
breadth50 < 50
) {

dealerCompression += 10;

}


/*
* Structural passive compression.
*/

dealerCompression +=
Math.round(
passiveGammaCompression * 0.20
);


/*
* Dangerous combination.
*/

if (

effectiveGamma >= 25 &&

vix < 18 &&

weakBreadth

) {

dealerCompression += 15;

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

let passiveFlowRisk = 0;


if (
vix < 17
) {

passiveFlowRisk += 25;

}


if (
weakBreadth
) {

passiveFlowRisk += 25;

}


/*
* High liquidity can support passive index flows.
*/

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

passiveFlowRisk += 10;

}


/*
* Structural overlay.
*/

passiveFlowRisk +=
Math.round(
passiveGammaCompression * 0.20
);


/*
* Quiet tape + deteriorating internals.
*/

if (

breadth50 < 55 &&

vix < 17

) {

passiveFlowRisk += 15;

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

let volSuppression = 0;


if (
vix < 17
) {

volSuppression += 30;

}


/*
* Flat / stable term structure can indicate
* suppressed volatility conditions.
*/

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
weakBreadth
) {

volSuppression += 15;

}


/*
* Structural compression.
*/

if (
passiveGammaCompression >= 60
) {

volSuppression += 15;

}


if (
structuralGammaFloor >= 55
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
STABILITY SCORE
===================================================== */

/*
* SEMANTICS:
*
* 100 = very stable
* 50 = neutral
* 0 = highly unstable
*
* Raw gamma provides the initial stability signal.
*
* Compression layers then reduce the score because
* apparent stability can hide latent instability.
*/

let score = 50;


/* =====================================================
RAW GAMMA STABILITY
===================================================== */

if (
effectiveGamma < -10
) {

score -= 25;

}

else if (
effectiveGamma < 0
) {

score -= 15;

}

else if (
effectiveGamma > 25
) {

score += 12;

}

else if (
effectiveGamma > 10
) {

score += 8;

}


/*
* Moderate positive gamma is stabilizing,
* but excessive gamma compression is handled
* separately below.
*/


/* =====================================================
STRUCTURAL COMPRESSION PENALTIES
===================================================== */

score -=
Math.round(
structuralGammaFloor * 0.08
);


score -=
Math.round(
passiveGammaCompression * 0.12
);


score -=
Math.round(
dealerCompression * 0.14
);


score -=
Math.round(
passiveFlowRisk * 0.10
);


score -=
Math.round(
volSuppression * 0.10
);


/* =====================================================
INTERNAL MARKET PENALTIES
===================================================== */

if (
severeBreadthWeakness
) {

score -= 6;

}

else if (
weakBreadth
) {

score -= 3;

}


if (
weakParticipation
) {

score -= 4;

}


if (
narrowLeadership
) {

score -= 4;

}


if (
megaCapLeadership
) {

score -= 5;

}


/*
* Extremely dangerous structural configuration.
*/

if (

passiveGammaCompression >= 70 &&

weakBreadth &&

weakParticipation

) {

score -= 8;

}


/*
* Negative gamma combined with structural weakness.
*/

if (

effectiveGamma < 0 &&

weakBreadth

) {

score -= 8;

}


score =
clamp(
Math.round(
score
)
);


/* =====================================================
STATE
===================================================== */

/*
* Negative gamma receives priority because
* it directly changes market reflexivity.
*/

let state:
| "NEGATIVE_GAMMA"
| "NEUTRAL_GAMMA"
| "POSITIVE_GAMMA"
| "DEALER_COMPRESSION";


if (
effectiveGamma < 0
) {

state =
"NEGATIVE_GAMMA";

}

else if (
dealerCompression >= 65
) {

state =
"DEALER_COMPRESSION";

}

else if (
effectiveGamma > 10
) {

state =
"POSITIVE_GAMMA";

}

else {

state =
"NEUTRAL_GAMMA";

}


/* =====================================================
INSTABILITY SCORE
===================================================== */

/*
* SEMANTICS:
*
* HIGH = unstable
* LOW = stable
*/

let instability = 0;


instability +=
Math.round(
dealerCompression * 0.28
);


instability +=
Math.round(
passiveFlowRisk * 0.20
);


instability +=
Math.round(
volSuppression * 0.16
);


instability +=
Math.round(
passiveGammaCompression * 0.18
);


instability +=
Math.round(
structuralGammaFloor * 0.18
);


/*
* Negative gamma increases reflexivity.
*/

if (
effectiveGamma < 0
) {

instability += 15;

}


if (
effectiveGamma < -10
) {

instability += 10;

}


/*
* Severe internal weakness.
*/

if (

weakBreadth &&

weakParticipation

) {

instability += 8;

}


if (
megaCapLeadership
) {

instability += 5;

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
"Balanced gamma positioning environment";


if (
state === "NEGATIVE_GAMMA"
) {

summary =
"Negative gamma regime increasing market reflexivity";

}


else if (
state === "DEALER_COMPRESSION"
) {

summary =
"Dealer compression and suppressed volatility regime";

}


else if (

passiveGammaCompression >= 60

) {

summary =
"Passive-flow compression masking latent fragility";

}


else if (

state === "POSITIVE_GAMMA" &&

instability < 40

) {

summary =
"Positive gamma environment supporting market stability";

}


/*
* Additional structural warnings.
*/

if (
narrowLeadership
) {

summary +=
" | Narrow leadership";

}


if (
weakBreadth
) {

summary +=
" | Breadth weakening";

}


if (
passiveGammaCompression >= 70
) {

summary +=
" | Structural compression elevated";

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

summary,

};

}
