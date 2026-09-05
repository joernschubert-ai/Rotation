// /lib/engine/liquidityEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

/* ============================================================
LIQUIDITY ENGINE

SEMANTICS

score:
HIGH = HEALTHY / SUPPORTIVE LIQUIDITY
LOW  = LIQUIDITY STRESS

state:
Describes absolute liquidity conditions.

liquidityState:
Describes the QUALITY and DISTRIBUTION of liquidity.

fragility:
Describes structural vulnerability.

IMPORTANT:

High headline liquidity does NOT automatically mean
healthy market liquidity.

Liquidity can be:

    broad
    passive
    narrow
    fragile
    illusory

============================================================ */

/* ============================================================
INPUT
============================================================ */

export interface LiquidityEngineInput {

history?: any[];
historyMetrics?: any;

marketDrivers?: any;
systemHeat?: any;
driversCore?: any;

marketLiquidityScore?: number;

gammaExposure?: number;
creditRatio?: number;

vixTermRatio?: number;
volOfVolRatio?: number;

marketData?: any;

breadth50?: number;
breadth200?: number;

correlationScore?: number;

participationScore?: number;

rsSmall?: number;
rsEqual?: number;
rsGrowth?: number;

rotationScore?: number;

rotationDecayScore?: number;
rotationDecayState?: string;

fragilityScore?: number;

hiddenDistribution?: boolean;
participationCollapse?: boolean;

}

/* ============================================================
OUTPUT
============================================================ */

export interface LiquidityEngineOutput {

/*

    HIGH = GOOD LIQUIDITY
    LOW  = LIQUIDITY STRESS
    */

score: number;

state:
| "ABUNDANT"
| "SUPPORTIVE"
| "NEUTRAL"
| "TIGHTENING"
| "LIQUIDITY_STRESS";

/*

    Distribution / quality of liquidity.
    */

liquidityState:
| "BROAD"
| "PASSIVE"
| "NARROW"
| "FRAGILE"
| "ILLUSION";

/*

    Distance from neutral liquidity.
    */

liquidityImpulse: number;

support:
| "STRONG"
| "MODERATE"
| "WEAK"
| "NEGATIVE";

fragility:
| "LOW"
| "ELEVATED"
| "HIGH";

summary: string;

marketQuality:
| "HEALTHY"
| "FRAGILE"
| "DETERIORATING"
| "INTERNALLY_WEAK";

institutionalLiquidity: boolean;

metrics: {

liquidity: number;

gamma: number;

effectiveGamma: number;

structuralGammaFloor: number;

credit: number;

vixTerm: number;

volOfVol: number;

breadth50: number;

breadth200: number;

correlation: number;

vix: number;

participation: number;

rotation: number;

decay: number;

fragility: number;

marketQualityScore: number;


/* =========================
TRENDS
========================= */

liquidityTrend: number;

creditTrend: number;

gammaTrend: number;

breadthTrend: number;

liquidityAcceleration: number;


/* =========================
HISTORY
========================= */

averageLiquidity: number;

liquidityPersistence: number;

institutionalPressure: number;


/* =========================
DRIVER DIAGNOSTICS
========================= */

passiveFlowRisk: number;

dealerCompressionRaw: number;

driversLiquidity: number;

systemHeatCredit: number;


/* =========================
STRUCTURAL FLAGS
========================= */

narrowLeadership: boolean;

weakParticipation: boolean;

breadthFailure: boolean;

equalWeightWeakness: boolean;

smallCapWeakness: boolean;

passiveFragility: boolean;

liquidityIllusion: boolean;

dealerCompression: boolean;

};

}

/* ============================================================
HELPERS
============================================================ */

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

/* ============================================================
ENGINE
============================================================ */

export function liquidityEngine(
input: LiquidityEngineInput
): LiquidityEngineOutput {

/* ==========================================================
RAW INPUT
========================================================== */

const liquidity =
clamp(
numberOr(
input.marketLiquidityScore,
50
)
);

const rawGamma =
numberOr(
input.gammaExposure,
0
);

const credit =
numberOr(
input.creditRatio,
1
);

const vixTerm =
numberOr(
input.vixTermRatio,
1
);

const volOfVol =
numberOr(
input.volOfVolRatio,
1
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

const correlation =
numberOr(
input.correlationScore,
0
);

const vix =
numberOr(
input.marketData?.["^VIX"]?.current,
20
);

const participationScore =
clamp(
numberOr(
input.participationScore,
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

const rotationScore =
clamp(
numberOr(
input.rotationScore,
50
)
);

const rotationDecayScore =
clamp(
numberOr(
input.rotationDecayScore,
0
)
);

const fragilityScore =
clamp(
numberOr(
input.fragilityScore,
50
)
);

/* ==========================================================
EXTERNAL FLAGS
========================================================== */

const hiddenDistribution =
Boolean(
input.hiddenDistribution
);

const participationCollapse =
Boolean(
input.participationCollapse
);

/* ==========================================================
HISTORY
========================================================== */

const history =
input.history ?? [];

const historyMetrics =
input.historyMetrics ?? {};

const marketDrivers =
input.marketDrivers ?? {};

const systemHeat =
input.systemHeat ?? {};

const driversCore =
input.driversCore ?? {};

/* ==========================================================
DRIVER DIAGNOSTICS
========================================================== */

const passiveFlowRisk =
clamp(
numberOr(
marketDrivers?.passiveFlowRisk,
0
)
);

const dealerCompressionRaw =
clamp(
numberOr(
marketDrivers?.dealerCompression,
0
)
);

/*

    System Heat credit component is expected around
    the neutral value 1.
    */

const systemHeatCredit =
numberOr(
systemHeat?.components?.credit,
1
);

/*

    Drivers Core may be on a directional scale.
    Do NOT treat it as direct liquidity.
    It is used only as a small environmental modifier.
    */

const driversLiquidity =
numberOr(
driversCore?.score,
0
);

/* ==========================================================
HISTORICAL METRICS
========================================================== */

const liquidityPersistence =
clamp(
numberOr(
historyMetrics?.liquidityPersistence,
50
)
);

const averageLiquidity =
clamp(
numberOr(
historyMetrics?.averageLiquidity,
liquidity
)
);

const institutionalPressure =
clamp(
numberOr(
historyMetrics?.institutionalPressure,
0
)
);

/* ==========================================================
HISTORY SNAPSHOTS
========================================================== */

const h5 =
history.length >= 5
? history[
history.length - 5
]
: null;

const h10 =
history.length >= 10
? history[
history.length - 10
]
: null;

const h20 =
history.length >= 20
? history[
history.length - 20
]
: null;

/* ==========================================================
LIQUIDITY TRENDS
========================================================== */

const liquidity10 =
numberOr(
h10?.marketLiquidityScore,
liquidity
);

const liquidity20 =
numberOr(
h20?.marketLiquidityScore,
liquidity10
);

const credit10 =
numberOr(
h10?.creditRatio,
credit
);

const gamma10 =
numberOr(
h10?.gammaExposure,
rawGamma
);

const breadth10 =
numberOr(
h10?.breadth50,
breadth50
);

const liquidityTrend =
liquidity -
liquidity10;

const creditTrend =
credit -
credit10;

const gammaTrend =
rawGamma -
gamma10;

const breadthTrend =
breadth50 -
breadth10;

/*

    Current 10-period change versus
    previous 10-period change.
    */

const previousLiquidityTrend =
liquidity10 -
liquidity20;

const liquidityAcceleration =
liquidityTrend -
previousLiquidityTrend;

/* ==========================================================
STRUCTURAL CONDITIONS
========================================================== */

/*

    Credit:
    ●
    lower ratio = healthier
    higher ratio = stress
    */

const stableCredit =
credit <= 0.95;

const stressedCredit =
credit >= 1.10;

const severeCreditStress =
credit >= 1.20;

/* ==========================================================
VOL TERM STRUCTURE
========================================================== */

const healthyTermStructure =
vixTerm >= 1.00;

const fragileTermStructure =
vixTerm < 0.95;

const backwardation =
vixTerm < 0.92;

/* ==========================================================
BREADTH
========================================================== */

const supportiveBreadth =
breadth50 >= 60 &&
breadth200 >= 55;

const weakBreadth =
breadth50 < 45 ||
breadth200 < 40;

const breadthFailure =
breadth50 < 45 &&
breadth200 < 45;

/* ==========================================================
LEADERSHIP
========================================================== */

const narrowLeadership =
rsGrowth > 1.03 &&
rsSmall < 0.99 &&
rsEqual < 0.99;

const megaCapOnlyTape =
rsGrowth > 1.05 &&
rsSmall < 0.97 &&
rsEqual < 0.97;

const equalWeightWeakness =
rsEqual < 0.99;

const smallCapWeakness =
rsSmall < 0.99;

/* ==========================================================
PARTICIPATION
========================================================== */

const weakParticipation =
participationScore < 50;

const severeWeakParticipation =
participationScore < 42;

/* ==========================================================
ROTATION
========================================================== */

const severeRotationDecay =
rotationDecayScore >= 60;

/* ==========================================================
STRUCTURAL GAMMA FLOOR

IMPORTANT:

Quiet volatility and positive gamma can create
apparent liquidity support.

Therefore effective gamma is diagnostic and must
never automatically be interpreted as healthy
liquidity.
========================================================== */

let structuralGammaFloor = 0;

if (
vix < 20 &&
vixTerm >= 0.95
) {

structuralGammaFloor =
  35;

}

if (
vix < 18 &&
vixTerm >= 1 &&
narrowLeadership
) {

structuralGammaFloor =
  Math.max(
    structuralGammaFloor,
    45
  );

}

if (
vix < 17 &&
breadth50 < 55 &&
narrowLeadership
) {

structuralGammaFloor =
  Math.max(
    structuralGammaFloor,
    55
  );

}

const effectiveGamma =
Math.max(
rawGamma,
structuralGammaFloor
);

/* ==========================================================
LIQUIDITY QUALITY CONDITIONS
========================================================== */

/*

    Passive fragility:
    ●
    Headline liquidity is high but participation
    is structurally weak.
    */

const passiveFragility =
liquidity >= 65 &&
vix < 18 &&
(
weakParticipation ||
narrowLeadership ||
severeRotationDecay
);

/*

    Liquidity illusion:
    ●
    Very strong headline liquidity is masking
    severe internal deterioration.
    */

const liquidityIllusion =
liquidity >= 70 &&
(
megaCapOnlyTape ||
narrowLeadership
) &&
breadthFailure &&
weakParticipation;

/*

    Dealer compression:
    ●
    Strong dealer positioning + calm volatility +
    weak internals can create unstable compression.
    */

const dealerCompression =
effectiveGamma >= 35 &&
vix < 18 &&
correlation < 3 &&
weakParticipation;

/* ==========================================================
MARKET QUALITY SCORE

HIGH = HEALTHY
LOW  = STRUCTURALLY WEAK
========================================================== */

let marketQualityScore = 60;

/*

    Participation.
    */

marketQualityScore +=
(participationScore - 50) * 0.25;

/*

    Rotation quality.
    */

marketQualityScore +=
(rotationScore - 50) * 0.15;

/*

    Breadth.
    */

marketQualityScore +=
(breadth50 - 50) * 0.15;

/*

    Liquidity environment.
    */

marketQualityScore +=
(liquidity - 50) * 0.10;

/*

    Small environmental contribution.
    */

marketQualityScore +=
clamp(
driversLiquidity,
-10,
10
) * 0.20;

/*

    Structural penalties.
    */

if (narrowLeadership) {

marketQualityScore -= 8;

}

if (megaCapOnlyTape) {

marketQualityScore -= 10;

}

if (equalWeightWeakness) {

marketQualityScore -= 4;

}

if (smallCapWeakness) {

marketQualityScore -= 4;

}

if (participationCollapse) {

marketQualityScore -= 14;

}

if (hiddenDistribution) {

marketQualityScore -= 12;

}

if (liquidityIllusion) {

marketQualityScore -= 15;

}

if (passiveFragility) {

marketQualityScore -= 8;

}

if (dealerCompression) {

marketQualityScore -= 6;

}

/*

    Trend deterioration.
    */

if (liquidityTrend < -8) {

marketQualityScore -= 5;

}

if (breadthTrend < -8) {

marketQualityScore -= 5;

}

if (
gammaTrend < -15 &&
breadthTrend < 0
) {

marketQualityScore -= 4;

}

/*

    Historical deterioration.
    */

if (liquidityPersistence < 40) {

marketQualityScore -= 6;

}

if (averageLiquidity < 60) {

marketQualityScore -= 4;

}

if (institutionalPressure > 55) {

marketQualityScore -= 5;

}

if (passiveFlowRisk > 25) {

marketQualityScore -= 6;

}

marketQualityScore =
clamp(
Math.round(
marketQualityScore
)
);

/* ==========================================================
MARKET QUALITY STATE
========================================================== */

let marketQuality:
| "HEALTHY"
| "FRAGILE"
| "DETERIORATING"
| "INTERNALLY_WEAK";

/*

    Severe structural conditions always dominate.
    */

if (
liquidityIllusion ||
participationCollapse ||
(
breadthFailure &&
weakParticipation &&
narrowLeadership
)
) {

marketQuality =
  "INTERNALLY_WEAK";

}

else if (
marketQualityScore < 45
) {

marketQuality =
  "DETERIORATING";

}

else if (
marketQualityScore >= 70 &&
!weakParticipation &&
!narrowLeadership
) {

marketQuality =
  "HEALTHY";

}

else {

marketQuality =
  "FRAGILE";

}

/* ==========================================================
BASE LIQUIDITY SCORE

IMPORTANT:

This score measures actual liquidity conditions.

Structural quality problems can reduce the score,
but must not repeatedly subtract the same weakness
through multiple overlapping penalties.
========================================================== */

let score = 50;

/*

    Headline liquidity.
    */

score +=
(liquidity - 50) * 0.55;

/*

    Credit.
    */

if (stableCredit) {

score += 10;

}

else if (stressedCredit) {

score -= 10;

}

if (severeCreditStress) {

score -= 8;

}

/*

    Volatility term structure.
    */

if (healthyTermStructure) {

score += 6;

}

if (fragileTermStructure) {

score -= 8;

}

if (backwardation) {

score -= 8;

}

/*

    Gamma.
    Raw negative gamma is directly negative.
    Effective gamma gives only limited support,
    because structural gamma floors can represent
    compression rather than healthy liquidity.
    */

if (rawGamma < -5) {

score -= 10;

}

else if (
rawGamma > 5 &&
!dealerCompression
) {

score += 5;

}

/*

    Breadth deterioration.
    */

if (weakBreadth) {

score -= 5;

}

/*

    Liquidity trend.
    */

if (liquidityTrend < -8) {

score -= 5;

}

if (liquidityTrend < -20) {

score -= 5;

}

/*

    Acceleration.
    */

if (liquidityAcceleration < -8) {

score -= 4;

}

if (liquidityAcceleration < -15) {

score -= 4;

}

/*

    Credit deterioration.
    */

if (creditTrend > 0.08) {

score -= 4;

}

if (creditTrend > 0.15) {

score -= 4;

}

/*

    Combined internal weakness.
    */

if (
narrowLeadership &&
weakParticipation
) {

score -= 10;

}

/*

    Severe structural liquidity conditions.
    ●
    Only the strongest applicable condition
    should dominate.
    */

if (liquidityIllusion) {

score -= 18;

}

else if (passiveFragility) {

score -= 10;

}

else if (dealerCompression) {

score -= 8;

}

/*

    Internal market quality overlay.
    */

if (
marketQuality ===
"INTERNALLY_WEAK"
) {

score -= 10;

}

else if (
marketQuality ===
"DETERIORATING"
) {

score -= 6;

}

/*

    Historical deterioration.
    */

if (
liquidityPersistence < 40
) {

score -= 4;

}

if (
averageLiquidity < 60
) {

score -= 3;

}

if (
institutionalPressure > 55
) {

score -= 4;

}

/*

    Passive flow risk.
    */

if (
passiveFlowRisk > 25
) {

score -= 5;

}

/*

    External dealer compression diagnostic.
    */

if (
dealerCompressionRaw > 40
) {

score -= 4;

}

score =
clamp(
Math.round(score)
);

/* ==========================================================
LIQUIDITY STATE

ABSOLUTE LIQUIDITY CONDITIONS
========================================================== */

let state:
| "ABUNDANT"
| "SUPPORTIVE"
| "NEUTRAL"
| "TIGHTENING"
| "LIQUIDITY_STRESS";

if (score >= 80) {

state =
  "ABUNDANT";

}

else if (score >= 65) {

state =
  "SUPPORTIVE";

}

else if (score >= 48) {

state =
  "NEUTRAL";

}

else if (score >= 30) {

state =
  "TIGHTENING";

}

else {

state =
  "LIQUIDITY_STRESS";

}

/* ==========================================================
LIQUIDITY QUALITY STATE

PRIORITY:

ILLUSION
FRAGILE
NARROW
BROAD
PASSIVE
========================================================== */

let liquidityState:
| "BROAD"
| "PASSIVE"
| "NARROW"
| "FRAGILE"
| "ILLUSION";

if (liquidityIllusion) {

liquidityState =
  "ILLUSION";

}

else if (
breadthFailure ||
(
weakParticipation &&
score < 50
)
) {

liquidityState =
  "FRAGILE";

}

else if (
narrowLeadership ||
(
equalWeightWeakness &&
smallCapWeakness
)
) {

liquidityState =
  "NARROW";

}

else if (
supportiveBreadth &&
participationScore >= 60 &&
score >= 60
) {

liquidityState =
  "BROAD";

}

else {

liquidityState =
  "PASSIVE";

}

/* ==========================================================
SUPPORT
========================================================== */

let support:
| "STRONG"
| "MODERATE"
| "WEAK"
| "NEGATIVE";

if (score >= 75) {

support =
  "STRONG";

}

else if (score >= 58) {

support =
  "MODERATE";

}

else if (score >= 40) {

support =
  "WEAK";

}

else {

support =
  "NEGATIVE";

}

/* ==========================================================
FRAGILITY

IMPORTANT:

Fragility can be HIGH even when headline
liquidity remains elevated.
========================================================== */

let fragility:
| "LOW"
| "ELEVATED"
| "HIGH";

if (
liquidityIllusion ||
passiveFragility ||
dealerCompression ||
marketQuality ===
"INTERNALLY_WEAK"
) {

fragility =
  "HIGH";

}

else if (
score < 48 ||
marketQuality ===
"FRAGILE" ||
narrowLeadership
) {

fragility =
  "ELEVATED";

}

else {

fragility =
  "LOW";

}

/* ==========================================================
INSTITUTIONAL LIQUIDITY

Requires BOTH:

    supportive liquidity conditions
    healthy internal participation
    ========================================================== */

const institutionalLiquidity =

score >= 65 &&

stableCredit &&

healthyTermStructure &&

participationScore >= 55 &&

!weakBreadth &&

!narrowLeadership &&

liquidityPersistence >= 45 &&

!liquidityIllusion &&

!passiveFragility;

/* ==========================================================
SUMMARY
========================================================== */

let summary =
"Balanced liquidity backdrop";

if (
liquidityState ===
"BROAD"
) {

summary =
  "Broad institutional liquidity participation";

}

else if (
liquidityState ===
"PASSIVE"
) {

summary =
  "Passive liquidity support with mixed market internals";

}

else if (
liquidityState ===
"NARROW"
) {

summary =
  "Liquidity concentrated in narrow market leadership";

}

else if (
liquidityState ===
"FRAGILE"
) {

summary =
  "Liquidity backdrop is structurally fragile";

}

else if (
liquidityState ===
"ILLUSION"
) {

summary =
  "Headline liquidity is masking severe internal weakness";

}

if (
dealerCompression &&
liquidityState !==
"ILLUSION"
) {

summary +=
  " | Dealer compression";

}

if (
passiveFlowRisk >= 60
) {

summary +=
  " | Passive flow risk elevated";

}

/* ==========================================================
RETURN
========================================================== */

return {

score,

state,

liquidityState,


/*
 * Positive = above neutral
 * Negative = below neutral
 */

liquidityImpulse:
  score - 50,


support,

fragility,

summary,

marketQuality,

institutionalLiquidity,


metrics: {

  /* =========================
  RAW
  ========================= */

  liquidity,

  gamma:
    rawGamma,

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


  /* =========================
  QUALITY
  ========================= */

  marketQualityScore,


  /* =========================
  TRENDS
  ========================= */

  liquidityTrend,

  creditTrend,

  gammaTrend,

  breadthTrend,

  liquidityAcceleration,


  /* =========================
  HISTORY
  ========================= */

  averageLiquidity,

  liquidityPersistence,

  institutionalPressure,


  /* =========================
  DRIVERS
  ========================= */

  passiveFlowRisk,

  dealerCompressionRaw,

  driversLiquidity,

  systemHeatCredit,


  /* =========================
  FLAGS
  ========================= */

  narrowLeadership,

  weakParticipation,

  breadthFailure,

  equalWeightWeakness,

  smallCapWeakness,

  passiveFragility,

  liquidityIllusion,

  dealerCompression,

},

};

}
