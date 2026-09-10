// /lib/engine/fragilityEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";


/* =====================================================
TYPES
===================================================== */

export interface FragilityEngineInput {

history?: any[];

historyMetrics?: any;

crash?: any;

breadth50?: number;

breadth200?: number;

gammaExposure?: number;

correlationScore?: number;

vix?: number;

volOfVolRatio?: number;

vixTermRatio?: number;

liquidity?: any;

structure?: any;

participation?: any;

breadthThrust?: any;

rotation?: any;

marketQuality?: any;

}


export interface FragilityEngineOutput {

score: number;

state:
| "RESILIENT"
| "STRETCHED"
| "FRAGILE"
| "STRUCTURALLY_UNSTABLE"
| "BREAKDOWN_RISK";

escalation: boolean;

breakdownRisk: number;

liquidityFragility: number;

liquidityIllusion: boolean;

passiveFragility: boolean;

dealerCompression: boolean;

structuralGammaFloor: number;

effectiveGamma: number;

summary: string;

metrics: {

crashProbability: number;

breadth50: number;

breadth200: number;

gamma: number;

effectiveGamma: number;

structuralGammaFloor: number;

correlation: number;

vix: number;

volOfVol: number;

vixTerm: number;

liquidity: number;

participationScore: number;

breadthThrustScore: number;

rotationScore: number;

rotationDecayScore: number;

marketQualityScore: number;

participationTrend: number;

breadthTrend: number;

liquidityTrend: number;

marketQualityTrend: number;

participationErosion: boolean;

breadthErosion: boolean;

liquidityErosion: boolean;

qualityErosion: boolean;

persistentErosion: boolean;

narrowLeadership: boolean;

severeNarrowLeadership: boolean;

megaCapOnlyTape: boolean;

equalWeightWeakness: boolean;

smallCapWeakness: boolean;

internalSynchronization: boolean;

liquidityDependence: boolean;

liquidityIllusion: boolean;

latentFragility: boolean;

passiveFragility: boolean;

dealerCompression: boolean;

phasePersistence: number;

daysInPhase: number;

institutionalPressure: number;

participationDecay: number;

breadthTrendHistory: number;

breadthAcceleration: number;

crashTrend: number;

relativeBreadthWeakness: number;

averageFragility: number;

persistentDistribution: boolean;

prolongedBearRegime: boolean;

acceleratingWeakness: boolean;

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

return Math.max(
min,
Math.min(max, value)
);

}


function safeNumber(
value: any,
fallback = 0
) {

const number =
Number(value);

return Number.isFinite(number)
? number
: fallback;

}


function getHistoryValue(
snapshot: any,
keys: string[],
fallback: number
) {

if (!snapshot) {
return fallback;
}

for (const key of keys) {

const value =
snapshot?.[key];

if (
value !== undefined &&
value !== null &&
Number.isFinite(Number(value))
) {

return Number(value);

}

}

return fallback;

}


/*
* Convert a constructive score
* into risk space.
*
* 100 constructive -> 0 risk
* 50 constructive -> 50 risk
* 0 constructive -> 100 risk
*/

function riskFromConstructive(
value: number
) {

return 100 -
clamp(value);

}


/*
* Weighted average helper.
*/

function weightedAverage(
values: Array<{
value: number;
weight: number;
}>
) {

let numerator = 0;

let denominator = 0;

for (const item of values) {

const value =
clamp(
safeNumber(item.value, 50)
);

const weight =
Math.max(
0,
safeNumber(item.weight, 0)
);

numerator +=
value * weight;

denominator +=
weight;

}

if (
denominator <= 0
) {

return 50;

}

return numerator / denominator;

}


/* =====================================================
ENGINE
===================================================== */

export function fragilityEngine(
input: FragilityEngineInput
): FragilityEngineOutput {


/* ===================================================
CURRENT DATA
=================================================== */

const crashProbability =
clamp(
safeNumber(
input.crash?.probability,
0
)
);


const breadth50 =
clamp(
safeNumber(
input.breadth50 ??
input.structure?.breadth?.b50?.value,
50
)
);


const breadth200 =
clamp(
safeNumber(
input.breadth200 ??
input.structure?.breadth?.b200?.value,
50
)
);


const rawGamma =
safeNumber(
input.gammaExposure,
0
);


const correlation =
safeNumber(
input.correlationScore,
0
);


const vix =
safeNumber(
input.vix,
20
);


const volOfVol =
safeNumber(
input.volOfVolRatio,
1
);


const vixTerm =
safeNumber(
input.vixTermRatio,
1
);


const liquidity =
clamp(
safeNumber(
input.liquidity?.score ??
input.liquidity?.metrics?.liquidity ??
input.liquidity?.liquidity,
50
)
);


const participationScore =
clamp(
safeNumber(
input.participation?.score,
50
)
);


const breadthThrustScore =
clamp(
safeNumber(
input.breadthThrust?.score,
50
)
);


const rotationScore =
clamp(
safeNumber(
input.rotation?.score,
50
)
);


const rotationDecayScore =
clamp(
safeNumber(
input.rotation?.decayScore ??
input.rotation?.rotationDecayScore,
0
)
);


const rotationDecayState =
input.rotation?.rotationDecayState ??
input.rotation?.state ??
"HEALTHY_ROTATION";


const rsSmall =
safeNumber(
input.rotation?.rsSmall,
1
);


const rsGrowth =
safeNumber(
input.rotation?.rsGrowth,
1
);


const rsEqual =
safeNumber(
input.rotation?.rsEqual,
1
);


const marketQualityScore =
clamp(
safeNumber(
input.marketQuality?.score,
50
)
);


/* ===================================================
SYNCHRONIZATION DATA
=================================================== */

/*
* Missing synchronization data must NOT
* automatically become synchronization failure.
*/

const internalSynchronization =
input.marketQuality?.internalSynchronization;

const hasSynchronizationData =
typeof internalSynchronization === "boolean";


/* ===================================================
HISTORY
=================================================== */

const history =
input.history ?? [];

const historyMetrics =
input.historyMetrics ?? {};


const h10 =
history.length >= 10
? history[history.length - 10]
: null;


const h20 =
history.length >= 20
? history[history.length - 20]
: null;


/*
* h20 is intentionally retained for compatibility
* and future diagnostics.
*/

void h20;


/* ===================================================
CURRENT TRENDS
=================================================== */

const historicalParticipation =
getHistoryValue(
h10,
[
"participationScore",
"participation"
],
participationScore
);


const historicalBreadth =
getHistoryValue(
h10,
[
"breadth50",
"breadth"
],
breadth50
);


const historicalLiquidity =
getHistoryValue(
h10,
[
"liquidityScore",
"marketLiquidityScore",
"liquidity"
],
liquidity
);


const historicalQuality =
getHistoryValue(
h10,
[
"marketQualityScore"
],
marketQualityScore
);


const participationTrend =
participationScore -
historicalParticipation;


const breadthTrend =
breadth50 -
historicalBreadth;


const liquidityTrend =
liquidity -
historicalLiquidity;


const marketQualityTrend =
marketQualityScore -
historicalQuality;


/* ===================================================
HISTORY METRICS
=================================================== */

const phasePersistence =
safeNumber(
historyMetrics.phasePersistence,
0
);


const daysInPhase =
safeNumber(
historyMetrics.daysInPhase,
0
);


const institutionalPressure =
clamp(
safeNumber(
historyMetrics.institutionalPressure,
0
)
);


const participationDecayHistory =
safeNumber(
historyMetrics.participationDecay,
0
);


const breadthTrendHistory =
safeNumber(
historyMetrics.breadthTrend,
0
);


const breadthAcceleration =
safeNumber(
historyMetrics.breadthAcceleration,
0
);


const crashTrend =
safeNumber(
historyMetrics.crashTrend,
0
);


const relativeBreadthWeakness =
safeNumber(
historyMetrics.relativeBreadthWeakness,
0
);


const averageFragility =
clamp(
safeNumber(
historyMetrics.averageFragility,
50
)
);


const prolongedBearRegime =
Boolean(
historyMetrics.prolongedBearRegime
);


const persistentDistribution =
Boolean(
historyMetrics.persistentDistribution
);


const acceleratingWeakness =
Boolean(
historyMetrics.acceleratingWeakness
);


/* ===================================================
MARKET STRUCTURE FLAGS
=================================================== */

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
smallCapWeakness
} = structureFlags;


/* ===================================================
STRUCTURAL GAMMA FLOOR
=================================================== */

/*
* Positive dealer gamma in a calm market can suppress
* volatility without making the market structurally
* healthy.
*
* The floor is therefore diagnostic rather than a
* direct crash signal.
*/

let structuralGammaFloor = 0;


if (
vix < 20 &&
vixTerm >= 0.95
) {

structuralGammaFloor = 35;

}


if (
vix < 18 &&
vixTerm >= 1 &&
narrowLeadership
) {

structuralGammaFloor = 45;

}


if (
vix < 17 &&
narrowLeadership &&
breadth50 < 55
) {

structuralGammaFloor = 55;

}


const effectiveGamma =
Math.max(
rawGamma,
structuralGammaFloor
);


/* ===================================================
STRUCTURAL CONDITIONS
=================================================== */

const weakParticipation =
participationScore < 48 ||
breadth50 < 48;


const severeParticipationFailure =
participationScore < 38 &&
breadth50 < 40;


const weakRotation =
rotationScore < 45 ||
rotationDecayScore >= 45;


const failedRotation =
rotationScore < 35 ||
rotationDecayScore >= 65 ||
rotationDecayState ===
"ROTATION_FAILURE" ||
rotationDecayState ===
"INTERNAL_BREAKDOWN";


const weakBreadthStructure =
breadth50 < 45 ||
breadth200 < 42 ||
breadthThrustScore < 42;


const severeBreadthFailure =
breadth50 < 35 &&
breadth200 < 35 &&
breadthThrustScore < 35;


/* ===================================================
SYNCHRONIZATION
=================================================== */

const synchronizationFailure =
hasSynchronizationData

? internalSynchronization === false

: (
weakParticipation &&
weakRotation &&
weakBreadthStructure
);


/*
* Synchronization is a confirmation layer.
*
* It should not create an enormous independent
* penalty on top of already weak components.
*/


/* ===================================================
LIQUIDITY CONDITIONS
=================================================== */

const liquidityDependence =
liquidity >= 65 &&
(
weakParticipation ||
narrowLeadership ||
marketQualityScore < 45
);


const liquidityIllusion =
liquidity >= 68 &&
(
marketQualityScore < 42 ||
weakParticipation ||
failedRotation ||
megaCapOnlyTape
);


const latentFragility =
vix < 20 &&
liquidity >= 60 &&
(
weakParticipation ||
failedRotation ||
narrowLeadership ||
synchronizationFailure
);


const passiveFragility =
vix < 18 &&
liquidity >= 65 &&
(
weakParticipation ||
narrowLeadership ||
failedRotation
);


const dealerCompression =
effectiveGamma > 35 &&
vix < 18 &&
correlation < 3 &&
(
weakParticipation ||
narrowLeadership
);


/* ===================================================
HISTORICAL EROSION
=================================================== */

const participationErosion =
participationTrend < -8;


const breadthErosion =
breadthTrend < -8;


const liquidityErosion =
liquidityTrend < -10;


const qualityErosion =
marketQualityTrend < -10;


const persistentErosion =
(
participationErosion &&
breadthErosion
) ||
(
breadthErosion &&
qualityErosion
);


/* ===================================================
RISK COMPONENTS
=================================================== */

/*
* The old implementation accumulated many threshold
* penalties.
*
* That created a structural saturation problem:
*
* participation 29
* rotation 0
* breadth thrust 24
*
* were enough to push the score to 100 before
* market quality, liquidity, history and gamma had
* even been considered.
*
* The new model instead creates six major risk blocks.
*
* Each block is normalized into the same 0..100
* RISK scale.
*
* HIGH = fragile
* LOW = resilient
*/


/* ===================================================
PARTICIPATION RISK
=================================================== */

const participationRisk =
riskFromConstructive(
participationScore
);


/*
* Participation is important but should not dominate
* the complete engine.
*/


/* ===================================================
BREADTH RISK
=================================================== */

const breadth50Risk =
riskFromConstructive(
breadth50
);


const breadth200Risk =
riskFromConstructive(
breadth200
);


const breadthThrustRisk =
riskFromConstructive(
breadthThrustScore
);


const breadthRisk =
weightedAverage([
{
value: breadth50Risk,
weight: 0.45
},
{
value: breadth200Risk,
weight: 0.20
},
{
value: breadthThrustRisk,
weight: 0.35
}
]);


/* ===================================================
ROTATION RISK
=================================================== */

const rotationDirectionRisk =
riskFromConstructive(
rotationScore
);


/*
* Rotation decay is already risk-oriented.
*
* We use it as a secondary modifier instead of
* stacking all rotation thresholds independently.
*/

const normalizedRotationDecayRisk =
clamp(
rotationDecayScore
);


const rotationRisk =
weightedAverage([
{
value: rotationDirectionRisk,
weight: 0.70
},
{
value: normalizedRotationDecayRisk,
weight: 0.30
}
]);


/* ===================================================
MARKET QUALITY RISK
=================================================== */

const marketQualityRisk =
riskFromConstructive(
marketQualityScore
);


/* ===================================================
LIQUIDITY RISK
=================================================== */

const liquidityRisk =
riskFromConstructive(
liquidity
);


/* ===================================================
CONCENTRATION RISK
=================================================== */

/*
* Concentration is not directly inferred from one
* ratio. It is a structural overlay.
*/

let concentrationRisk = 0;


if (
narrowLeadership
) {

concentrationRisk += 30;

}


if (
severeNarrowLeadership
) {

concentrationRisk += 20;

}


if (
megaCapOnlyTape
) {

concentrationRisk += 25;

}


if (
equalWeightWeakness
) {

concentrationRisk += 15;

}


if (
smallCapWeakness
) {

concentrationRisk += 10;

}


concentrationRisk =
clamp(
concentrationRisk
);


/* ===================================================
CORE STRUCTURAL RISK
=================================================== */

/*
* Core weights:
*
* Participation 22%
* Breadth 20%
* Rotation 18%
* Market Quality 15%
* Liquidity 8%
* Concentration 10%
* Current crash 7%
*
* Total 100%
*
* This keeps structural internals dominant while
* preventing any single component from saturating
* the complete score.
*/

const coreStructuralRisk =
weightedAverage([
{
value: participationRisk,
weight: 0.22
},

{
value: breadthRisk,
weight: 0.20
},

{
value: rotationRisk,
weight: 0.18
},

{
value: marketQualityRisk,
weight: 0.15
},

{
value: liquidityRisk,
weight: 0.08
},

{
value: concentrationRisk,
weight: 0.10
},

{
value: crashProbability,
weight: 0.07
}
]);


/* ===================================================
STRUCTURAL OVERLAY
=================================================== */

/*
* Overlays confirm structural stress.
*
* They are deliberately capped.
*
* This is the key difference from the previous
* additive threshold model.
*/

let structuralOverlay = 0;


/* -----------------------------------------------
Severe participation
------------------------------------------------ */

if (
severeParticipationFailure
) {

structuralOverlay += 5;

}

else if (
weakParticipation
) {

structuralOverlay += 2;

}


/* -----------------------------------------------
Failed rotation
------------------------------------------------ */

if (
failedRotation
) {

structuralOverlay += 4;

}

else if (
weakRotation
) {

structuralOverlay += 2;

}


/* -----------------------------------------------
Breadth structure
------------------------------------------------ */

if (
severeBreadthFailure
) {

structuralOverlay += 5;

}

else if (
weakBreadthStructure
) {

structuralOverlay += 2;

}


/* -----------------------------------------------
Synchronization
------------------------------------------------ */

if (
synchronizationFailure
) {

structuralOverlay += 3;

}


/* -----------------------------------------------
Persistent erosion
------------------------------------------------ */

if (
persistentErosion
) {

structuralOverlay += 3;

}


/* -----------------------------------------------
Leadership concentration
------------------------------------------------ */

if (
narrowLeadership
) {

structuralOverlay += 2;

}


if (
megaCapOnlyTape
) {

structuralOverlay += 3;

}


/*
* Structural overlay maximum:
*
* 25 points.
*/

structuralOverlay =
clamp(
structuralOverlay,
0,
25
);


/* ===================================================
LIQUIDITY / PASSIVE OVERLAY
=================================================== */

/*
* These conditions describe a potentially dangerous
* situation where liquidity and passive flows keep
* prices stable while internals deteriorate.
*
* They are important, but they must not independently
* force Fragility to 100.
*/

let liquidityOverlay = 0;


if (
liquidityDependence
) {

liquidityOverlay += 3;

}


if (
liquidityIllusion
) {

liquidityOverlay += 4;

}


if (
latentFragility
) {

liquidityOverlay += 2;

}


if (
passiveFragility
) {

liquidityOverlay += 3;

}


if (
dealerCompression
) {

liquidityOverlay += 2;

}


/*
* Maximum liquidity overlay:
*
* 14 points.
*/

liquidityOverlay =
clamp(
liquidityOverlay,
0,
14
);


/* ===================================================
GAMMA OVERLAY
=================================================== */

let gammaOverlay = 0;


/*
* Gamma floor = volatility suppression diagnostic.
*
* It is NOT equivalent to negative gamma.
*/

if (
structuralGammaFloor >= 35 &&
weakParticipation
) {

gammaOverlay += 2;

}


if (
structuralGammaFloor >= 45 &&
narrowLeadership
) {

gammaOverlay += 2;

}


/*
* Actual negative gamma receives more weight.
*/

if (
rawGamma < 0
) {

gammaOverlay += 3;

}


if (
rawGamma < -10
) {

gammaOverlay += 3;

}


gammaOverlay =
clamp(
gammaOverlay,
0,
8
);


/* ===================================================
VOLATILITY / CORRELATION OVERLAY
=================================================== */

let volatilityOverlay = 0;


if (
correlation > 5
) {

volatilityOverlay += 2;

}


if (
correlation > 8
) {

volatilityOverlay += 2;

}


if (
vix > 28
) {

volatilityOverlay += 3;

}


if (
vix > 35
) {

volatilityOverlay += 3;

}


if (
volOfVol > 1.4
) {

volatilityOverlay += 2;

}


/*
* Crash probability is already part of the core
* structural score.
*
* Therefore it is NOT added again here.
*/


volatilityOverlay =
clamp(
volatilityOverlay,
0,
10
);


/* ===================================================
HISTORY OVERLAY
=================================================== */

let historyOverlay = 0;


if (
participationErosion
) {

historyOverlay += 2;

}


if (
breadthErosion
) {

historyOverlay += 2;

}


if (
liquidityErosion
) {

historyOverlay += 1;

}


if (
qualityErosion
) {

historyOverlay += 2;

}


if (
persistentErosion
) {

historyOverlay += 3;

}


if (
phasePersistence >= 30
) {

historyOverlay += 1;

}


if (
phasePersistence >= 50
) {

historyOverlay += 2;

}


if (
daysInPhase >= 40
) {

historyOverlay += 1;

}


if (
daysInPhase >= 60
) {

historyOverlay += 2;

}


if (
persistentDistribution
) {

historyOverlay += 2;

}


if (
prolongedBearRegime
) {

historyOverlay += 2;

}


if (
institutionalPressure > 60
) {

historyOverlay += 2;

}


if (
participationDecayHistory > 20
) {

historyOverlay += 1;

}


if (
breadthTrendHistory < -1
) {

historyOverlay += 1;

}


/*
* Negative acceleration means accelerating
* deterioration in the current history architecture.
*/

if (
breadthAcceleration < -1
) {

historyOverlay += 2;

}


if (
relativeBreadthWeakness > 10
) {

historyOverlay += 2;

}


if (
crashTrend > 5
) {

historyOverlay += 2;

}


if (
acceleratingWeakness
) {

historyOverlay += 2;

}


if (
averageFragility > 65
) {

historyOverlay += 2;

}


/*
* Maximum history overlay:
*
* 25 points.
*/

historyOverlay =
clamp(
historyOverlay,
0,
25
);


/* ===================================================
FINAL FRAGILITY SCORE
=================================================== */

/*
* Core structural risk normally carries the score.
*
* Additional overlays confirm structural stress.
*
* The total is deliberately NOT allowed to jump to
* 100 simply because several related indicators are
* simultaneously weak.
*/

let score =
coreStructuralRisk +
structuralOverlay +
liquidityOverlay +
gammaOverlay +
volatilityOverlay +
historyOverlay;


/*
* Final bounded score.
*/

score =
clamp(
Math.round(score)
);


/* ===================================================
STATE
=================================================== */

let state:
| "RESILIENT"
| "STRETCHED"
| "FRAGILE"
| "STRUCTURALLY_UNSTABLE"
| "BREAKDOWN_RISK";


/*
* BREAKDOWN_RISK should require either:
*
* 1. genuinely extreme score
* OR
* 2. simultaneous severe structural failures.
*
* This prevents a calm but fragile market from being
* mislabeled as an actual breakdown solely because
* breadth is weak.
*/

if (
score >= 86 ||
(
severeParticipationFailure &&
failedRotation &&
severeBreadthFailure
)
) {

state =
"BREAKDOWN_RISK";

}

else if (
score >= 68 ||
liquidityIllusion ||
(
passiveFragility &&
synchronizationFailure
) ||
(
liquidityDependence &&
synchronizationFailure
)
) {

state =
"STRUCTURALLY_UNSTABLE";

}

else if (
score >= 48 ||
(
weakParticipation &&
narrowLeadership
)
) {

state =
"FRAGILE";

}

else if (
score >= 32 ||
weakRotation
) {

state =
"STRETCHED";

}

else {

state =
"RESILIENT";

}


/* ===================================================
ESCALATION
=================================================== */

/*
* Escalation remains intentionally strict.
*
* Fragility alone does not equal crash escalation.
*/

const escalation =
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
);


/* ===================================================
BREAKDOWN RISK
=================================================== */

/*
* breakdownRisk remains a dedicated diagnostic.
*
* It is intentionally separate from the main score.
*/

let breakdownRisk = 0;


if (
severeParticipationFailure
) {

breakdownRisk += 18;

}


if (
severeBreadthFailure
) {

breakdownRisk += 18;

}


if (
failedRotation
) {

breakdownRisk += 15;

}


if (
megaCapOnlyTape
) {

breakdownRisk += 8;

}


if (
liquidityDependence
) {

breakdownRisk += 7;

}


if (
liquidityIllusion
) {

breakdownRisk += 10;

}


if (
passiveFragility
) {

breakdownRisk += 8;

}


if (
dealerCompression
) {

breakdownRisk += 5;

}


if (
synchronizationFailure
) {

breakdownRisk += 8;

}


if (
marketQualityScore < 35
) {

breakdownRisk += 10;

}


if (
persistentErosion
) {

breakdownRisk += 10;

}


if (
participationErosion &&
breadthErosion
) {

breakdownRisk += 6;

}


if (
persistentDistribution
) {

breakdownRisk += 6;

}


if (
prolongedBearRegime
) {

breakdownRisk += 5;

}


if (
institutionalPressure > 60
) {

breakdownRisk += 4;

}


if (
acceleratingWeakness
) {

breakdownRisk += 6;

}


breakdownRisk =
clamp(
Math.round(
breakdownRisk
)
);


/* ===================================================
LIQUIDITY FRAGILITY
=================================================== */

let liquidityFragility =
Math.round(
(100 - liquidity) *
0.45
);


if (
liquidityDependence
) {

liquidityFragility += 12;

}


if (
liquidityIllusion
) {

liquidityFragility += 16;

}


if (
passiveFragility
) {

liquidityFragility += 8;

}


if (
liquidity >= 65 &&
marketQualityScore < 42
) {

liquidityFragility += 6;

}


liquidityFragility =
clamp(
liquidityFragility
);


/* ===================================================
SUMMARY
=================================================== */

let summary =
"Structurally resilient market environment";


if (
state === "STRETCHED"
) {

summary =
"Market structure increasingly stretched beneath the surface";

}


if (
state === "FRAGILE"
) {

summary =
"Fragile institutional structure with weakening resilience";

}


if (
state === "STRUCTURALLY_UNSTABLE"
) {

summary =
"Structurally unstable market dependent on narrowing support";

}


if (
state === "BREAKDOWN_RISK"
) {

summary =
"High structural breakdown risk across institutional internals";

}


if (
liquidityIllusion
) {

summary +=
" | Liquidity illusion";

}


if (
passiveFragility
) {

summary +=
" | Passive fragility";

}


if (
dealerCompression
) {

summary +=
" | Dealer compression";

}


if (
megaCapOnlyTape
) {

summary +=
" | Mega-cap concentration";

}


/* ===================================================
RETURN
=================================================== */

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

gamma:
rawGamma,

effectiveGamma,

structuralGammaFloor,

correlation,

vix,

volOfVol,

vixTerm,

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

severeNarrowLeadership,

megaCapOnlyTape,

equalWeightWeakness,

smallCapWeakness,

/*
* Missing synchronization data is treated as
* neutral/available rather than as failure.
*/

internalSynchronization:
hasSynchronizationData
? Boolean(
internalSynchronization
)
: true,

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

};

}
