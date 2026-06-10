// /lib/engine/shared/marketStructureFlags.ts

export function getMarketStructureFlags(data: any) {

/* =====================================================
INPUTS
===================================================== */

const rsGrowth = Number(
data.rsGrowth ??
data.rotation?.rsGrowth ??
1
);

const rsSmall = Number(
data.rsSmall ??
data.rotation?.rsSmall ??
1
);

const rsEqual = Number(
data.rsEqual ??
data.rotation?.rsEqual ??
1
);

const participationScore = Number(
data.participationScore ??
data.participation?.score ??
50
);

const breadth20 = Number(
data.breadth20 ??
data.structure?.breadth?.b20?.value ??
50
);

const breadth50 = Number(
data.breadth50 ??
data.structure?.breadth?.b50?.value ??
50
);

const breadth200 = Number(
data.breadth200 ??
data.structure?.breadth?.b200?.value ??
50
);

const ad = Number(
data.ad ??
data.structure?.advanceDecline?.value ??
0
);

const highs = Number(
data.highs ??
data.structure?.highsLows?.highs ??
0
);

const lows = Number(
data.lows ??
data.structure?.highsLows?.lows ??
0
);

const distributionScore = Number(
data.distributionScore ??
data.structure?.distribution?.value ??
0
);

const rotationScore = Number(
data.rotationScore ??
data.rotation?.score ??
50
);

/* =====================================================
RELATIVE STRENGTH DELTAS
===================================================== */

const dGrowth = rsGrowth - 1;
const dSmall = 1 - rsSmall;
const dEqual = 1 - rsEqual;

/* =====================================================
LEADERSHIP FLAGS
===================================================== */

const narrowLeadership = (

rsGrowth > 1.02 &&

rsSmall < 0.98 &&

rsEqual < 0.985

);

const severeNarrowLeadership = (

rsGrowth > 1.04 &&

rsSmall < 0.95 &&

rsEqual < 0.97

);

/* =====================================================
MEGA CAP DOMINANCE
===================================================== */

const megaCapDominance = (

dGrowth > 0.03 &&

dSmall > 0.025 &&

dEqual > 0.015

);

const severeMegaCapDominance = (

dGrowth > 0.05 &&

dSmall > 0.04 &&

dEqual > 0.03

);

/* =====================================================
EQUAL WEIGHT WEAKNESS
===================================================== */

const equalWeightWeakness =
rsEqual < 0.985;

const severeEqualWeightWeakness =
rsEqual < 0.97;

/* =====================================================
SMALL CAP WEAKNESS
===================================================== */

const smallCapWeakness =
rsSmall < 0.98;

const severeSmallCapWeakness =
rsSmall < 0.95;

/* =====================================================
PARTICIPATION FLAGS
===================================================== */

const weakParticipation =
participationScore < 50;

const collapsingParticipation =
participationScore < 35;

/* =====================================================
BREADTH FAILURE
===================================================== */

const breadthFailure = (

breadth50 < 55 ||

breadth200 < 50 ||

(
breadth50 < 58 &&
participationScore < 45
)

);

const severeBreadthFailure = (

breadth50 < 45 &&

breadth200 < 40

);

/* =====================================================
INTERNAL DETERIORATION
===================================================== */

const internalDeterioration = (

ad < -25 ||

(
breadth50 < 55 &&
participationScore < 45
)

);

const severeInternalDeterioration = (

ad < -80 &&

participationScore < 35

);

/* =====================================================
HIGH / LOW STRUCTURE
===================================================== */

const highLowDelta =
highs - lows;

const highLowFailure =
highLowDelta < 0;

const severeHighLowFailure =
highLowDelta < -20;

/* =====================================================
HIDDEN DISTRIBUTION
===================================================== */

const hiddenDistribution = (

narrowLeadership &&

(
equalWeightWeakness ||
smallCapWeakness
) &&

breadth50 > 55 &&

distributionScore >= 2

);

/* =====================================================
ROTATIONAL EXHAUSTION
===================================================== */

const rotationalExhaustion = (

rotationScore < 35 &&

narrowLeadership

);

const severeRotationalExhaustion = (

rotationScore < 25 &&

severeNarrowLeadership

);

/* =====================================================
HEALTHY STATES
===================================================== */

const healthyBreadth = (

breadth50 > 60 &&

breadth200 > 55

);

const strongBreadth = (

breadth50 > 70 &&

breadth200 > 65

);

const healthyParticipation =
participationScore > 60;

/* =====================================================
SUMMARY STATE
===================================================== */

let structureState = "BALANCED";

if (
narrowLeadership ||
weakParticipation ||
breadthFailure
) {
structureState = "FRAGILE";
}

if (
severeNarrowLeadership ||
collapsingParticipation ||
severeBreadthFailure
) {
structureState = "BREAKDOWN";
}

/* =====================================================
RETURN
===================================================== */

return {

/* ---------- LEADERSHIP ---------- */

narrowLeadership,
severeNarrowLeadership,

megaCapDominance,
severeMegaCapDominance,

/* ---------- RELATIVE STRUCTURE ---------- */

equalWeightWeakness,
severeEqualWeightWeakness,

smallCapWeakness,
severeSmallCapWeakness,

/* ---------- PARTICIPATION ---------- */

weakParticipation,
collapsingParticipation,

healthyParticipation,

/* ---------- BREADTH ---------- */

breadthFailure,
severeBreadthFailure,

healthyBreadth,
strongBreadth,

/* ---------- INTERNALS ---------- */

internalDeterioration,
severeInternalDeterioration,

/* ---------- DISTRIBUTION ---------- */

hiddenDistribution,

/* ---------- HIGH LOW ---------- */

highLowFailure,
severeHighLowFailure,
highLowDelta,

/* ---------- ROTATION ---------- */

rotationalExhaustion,
severeRotationalExhaustion,

/* ---------- META ---------- */

structureState,

/* ---------- RAW ---------- */

metrics: {

rsGrowth,
rsSmall,
rsEqual,

breadth20,
breadth50,
breadth200,

participationScore,

ad,
highs,
lows,

distributionScore,
rotationScore

}
};

}
