// /lib/engine/putTimingEngine.ts

export type PutTimingDecision =
| "NO_TRADE"
| "DEFENSIVE_BUILD"
| "STRUCTURAL_BUILD"
| "TRANSITIONAL_SHORT"
| "PANIC_SHORT";

export type PutTiming =
| "WAIT"
| "EARLY"
| "BUILD"
| "STRONG"
| "MAX";

type LayerState =
| "BULLISH"
| "NEUTRAL"
| "BEARISH"
| "STRONG_BEARISH";

const TIMING_RANK: Record<PutTiming, number> = {
WAIT: 0,
EARLY: 1,
BUILD: 2,
STRONG: 3,
MAX: 4
};

export function putTimingEngine(engine: any) {
/* =====================================================
INPUT
===================================================== */

const {
phase,
rotation,
crash,
earlyWarning,
rotationDecay,
participation,
liquidity,
dangerZone,
marketDrivers,
regimeSync,
breadthThrust,
marketQuality,
breadthVelocity,
priceMomentum,
historyMetrics = {}
} = engine;


/* =====================================================
NORMALIZATION
===================================================== */

const rsSmall =
Number(rotation?.rsSmall ?? 1);

const rsEqual =
Number(rotation?.rsEqual ?? 1);

const rsGrowth =
Number(rotation?.rsGrowth ?? 1);

const decayScore =
Number(rotationDecay?.score ?? 0);

const decayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";

const participationScore =
Number(participation?.score ?? 50);

const liquidityScore =
Number(liquidity?.score ?? 50);

const crashProbability =
Number(crash?.probability ?? 0);

const dangerScore =
Number(dangerZone?.score ?? 0);

const breadthThrustScore =
Number(
breadthThrust?.score ??
breadthThrust?.strength ??
50
);

const breadthVelocityScore =
Number(
breadthVelocity?.score ?? 50
);

const breadthVelocityDelta =
Number(
breadthVelocity?.delta ?? 0
);

const marketQualityScore =
Number(
marketQuality?.score ?? 50
);

const syntheticStrength =
Boolean(
marketQuality?.syntheticStrength
);

const unhealthyLiquidity =
Boolean(
marketQuality?.unhealthyLiquidity
);

const liquidityTrap =
Boolean(
marketQuality?.liquidityTrap
);

const regimeAligned =
Boolean(
regimeSync?.aligned
);

const vix =
Number(
marketDrivers?.raw?.vix ?? 20
);

const gamma =
Number(
marketDrivers?.raw?.gamma ?? 0
);

const vixTerm =
Number(
marketDrivers?.raw?.vixTerm ?? 1
);

const credit =
Number(
marketDrivers?.raw?.credit ?? 1
);


/* =====================================================
PRICE
===================================================== */

const priceScore =
Number(
priceMomentum?.score ?? 50
);

const momentum5D =
Number(
priceMomentum?.momentum5D ?? 0
);

const momentum20D =
Number(
priceMomentum?.momentum20D ?? 0
);

const acceleration =
Number(
priceMomentum?.acceleration ?? 0
);

const priceState =
priceMomentum?.state ??
"NEUTRAL";

const structureAlignment =
priceMomentum?.structureAlignment ??
"UNKNOWN";

const earlyBearish =
Boolean(
priceMomentum?.earlyBearish
);

const bearishImpulse =
Boolean(
priceMomentum?.bearishImpulse
);

const bullishImpulse =
Boolean(
priceMomentum?.bullishImpulse
);

const cooling =
Boolean(
priceMomentum?.cooling
);

const accelerating =
Boolean(
priceMomentum?.accelerating
);

const decelerating =
Boolean(
priceMomentum?.decelerating
);

const priceLeadingStructure =
Boolean(
priceMomentum?.priceLeadingStructure
);

const structureLeadingPrice =
Boolean(
priceMomentum?.structureLeadingPrice
);


/* =====================================================
HISTORY

IMPORTANT:
History is sourced exclusively from
engine.historyMetrics.
===================================================== */

const breadthTrend =
Number(
historyMetrics?.breadthTrend ?? 0
);

const breadthAcceleration =
Number(
historyMetrics?.breadthAcceleration ?? 0
);

const participationDecay =
Number(
historyMetrics?.participationDecay ?? 0
);

const leadershipDecay =
Number(
historyMetrics?.leadershipDecay ?? 0
);

const crashTrend =
Number(
historyMetrics?.crashTrend ?? 0
);

const phasePersistence =
Number(
historyMetrics?.phasePersistence ?? 0
);

const regimePersistence =
Number(
historyMetrics?.regimePersistence ?? 0
);

const relativeBreadthWeakness =
Number(
historyMetrics?.relativeBreadthWeakness ?? 0
);


/* =====================================================
HISTORY FLAGS
===================================================== */

const breadthDeteriorating =
breadthTrend <= -2;

const breadthDecayAccelerating =
breadthAcceleration <= -1;

const participationEroding =
participationDecay > 10;

const severeParticipationErosion =
participationDecay > 20;

const leadershipConcentration =
leadershipDecay <= -2;

const crashRiskRising =
crashTrend >= 3;

const severeCrashRiskRise =
crashTrend >= 6;

const prolongedDistribution =
phasePersistence >= 60;

const prolongedBearRegime =
regimePersistence >= 60;

const severeBearRegime =
regimePersistence >= 85;

const broadParticipationFailure =
relativeBreadthWeakness > 10;

const severeParticipationFailure =
relativeBreadthWeakness > 20;


/* =====================================================
STRUCTURAL FLAGS
===================================================== */

const narrowLeadership =
rsGrowth > 1.03 &&
rsSmall < 0.995 &&
rsEqual < 0.995;

const syntheticLiquidity =
syntheticStrength ||
unhealthyLiquidity ||
liquidityTrap;

const structuralBreakdown =
decayScore >= 85 &&
participationScore < 40 &&
breadthThrustScore < 35;

const internalDeterioration =
decayScore >= 75 &&
participationScore < 45 &&
breadthVelocityScore < 40;


/* =====================================================
PANIC
===================================================== */

const panicConfirmed =
crashProbability >= 45 &&
vix > 24 &&
dangerScore >= 40;

const volatilityExpansion =
vix > 24 ||
vixTerm < 0.90;


/* =====================================================
PHASE CLASSIFICATION
===================================================== */

const phaseWeight = (() => {
switch (phase) {
case "PHASE_1_EXPANSION":
return 0;

case "PHASE_2_WARNING":
return 2;

case "PHASE_3_DISTRIBUTION":
return 4;

case "PHASE_4_RISK":
return 6;

case "PHASE_5_BREAKDOWN":
return 8;

case "PHASE_6_ACCELERATION":
return 9;

case "PHASE_7_CAPITULATION":
return 7;

default:
return 0;
}
})();


/* =====================================================
ROTATION CLASSIFICATION
===================================================== */

const rotationWeight = (() => {
let score = 0;

if (rsSmall < 0.99)
score += 1;

if (rsSmall < 0.97)
score += 1;

if (rsEqual < 0.99)
score += 1;

if (
decayState === "EARLY_DECAY"
)
score += 1;

if (
decayState === "DISTRIBUTION_ROTATION"
)
score += 2;

if (
decayState === "INTERNAL_BREAKDOWN"
)
score += 3;

if (
decayState === "ROTATION_FAILURE"
)
score += 4;

if (
decayState === "EXHAUSTED_ROTATION"
)
score += 4;

return Math.min(score, 6);
})();


/* =====================================================
STRUCTURE LAYER
===================================================== */

let structuralScore = 0;

/*
* Rotation deterioration
*/

structuralScore +=
rotationWeight;

/*
* Participation
*/

if (participationScore < 45)
structuralScore += 1;

if (participationScore < 38)
structuralScore += 2;

/*
* Breadth
*/

if (breadthDeteriorating)
structuralScore += 1;

if (breadthDecayAccelerating)
structuralScore += 1;

if (breadthThrustScore < 40)
structuralScore += 1;

if (breadthThrustScore < 35)
structuralScore += 1;

if (broadParticipationFailure)
structuralScore += 1;

if (severeParticipationFailure)
structuralScore += 2;

/*
* Participation history
*/

if (participationEroding)
structuralScore += 1;

if (severeParticipationErosion)
structuralScore += 2;

/*
* History / persistence
*/

if (prolongedDistribution)
structuralScore += 1;

if (prolongedBearRegime)
structuralScore += 1;

if (severeBearRegime)
structuralScore += 2;

/*
* Liquidity / quality
*/

if (marketQualityScore < 45)
structuralScore += 1;

if (syntheticLiquidity)
structuralScore += 1;

/*
* Leadership
*/

if (narrowLeadership)
structuralScore += 1;

/*
* Crash trend
*/

if (crashRiskRising)
structuralScore += 1;

if (severeCrashRiskRise)
structuralScore += 2;

structuralScore =
Math.min(
20,
structuralScore
);


/* =====================================================
STRUCTURAL STATE
===================================================== */

const structuralState: LayerState =
structuralBreakdown
? "STRONG_BEARISH"
: structuralScore >= 7
? "BEARISH"
: structuralScore >= 4
? "NEUTRAL"
: "BULLISH";


/* =====================================================
PRICE LAYER
===================================================== */

/*
* PRICE IS A TIMING FILTER.
*
* It does NOT determine structural direction.
*/

let priceTimingScore = 0;

if (priceScore <= 40)
priceTimingScore += 2;

if (priceScore <= 35)
priceTimingScore += 2;

if (momentum5D < 0)
priceTimingScore += 2;

if (momentum20D < 0)
priceTimingScore += 1;

if (acceleration < -0.5)
priceTimingScore += 2;

if (bearishImpulse)
priceTimingScore += 3;

if (earlyBearish)
priceTimingScore += 2;

if (priceLeadingStructure)
priceTimingScore += 2;

if (
structureAlignment ===
"CONFIRMED_BEARISH"
)
priceTimingScore += 2;

/*
* Bullish counter move.
*/

if (bullishImpulse)
priceTimingScore -= 4;

if (
structureAlignment ===
"CONFIRMED_BULLISH"
)
priceTimingScore -= 4;

if (
priceScore >= 65 &&
momentum5D > 0
)
priceTimingScore -= 2;

/*
* Cooling after bullish move:
* mildly positive for PUT timing.
*/

if (
cooling &&
priceState === "UP"
)
priceTimingScore += 1;

priceTimingScore =
Math.max(
-8,
Math.min(
12,
priceTimingScore
)
);


/* =====================================================
PRICE STATE
===================================================== */

const priceStateForPut: LayerState =
priceTimingScore >= 8
? "STRONG_BEARISH"
: priceTimingScore >= 4
? "BEARISH"
: priceTimingScore <= -3
? "BULLISH"
: "NEUTRAL";


/* =====================================================
CONTRADICTION
===================================================== */

let contradiction = 0;

/*
* Strong bullish price action against
* weak structure is a real contradiction.
*/

if (
bullishImpulse &&
structuralScore < 10
)
contradiction += 3;

if (
priceScore >= 65 &&
momentum5D > 0 &&
structuralScore < 8
)
contradiction += 2;

/*
* Low volatility alone is NOT a blocker.
*/

if (
vix < 20 &&
structuralScore < 8
)
contradiction += 1;

/*
* Healthy liquidity only matters when
* structure itself is not deteriorating.
*/

if (
liquidityScore > 70 &&
participationScore > 60 &&
decayScore < 60
)
contradiction += 2;

contradiction =
Math.min(
8,
contradiction
);


/* =====================================================
TIMING SCORE
===================================================== */

/*
* Structural score is dominant.
*
* Price can improve timing,
* but cannot manufacture structure.
*/

let timingScore =
structuralScore +
phaseWeight +
priceTimingScore;

/*
* History acts as confirmation,
* not as an independent trigger.
*/

if (participationEroding)
timingScore += 2;

if (breadthDeteriorating)
timingScore += 1;

if (crashRiskRising)
timingScore += 1;

if (prolongedDistribution)
timingScore += 1;

if (prolongedBearRegime)
timingScore += 1;

/*
* Early warning can open the door
* before outright breakdown.
*/

if (earlyWarning?.active)
timingScore += 1;

/*
* Contradiction only affects timing.
*/

timingScore -=
contradiction;

timingScore =
Math.max(
0,
Math.min(
50,
Math.round(timingScore)
)
);


/* =====================================================
TIMING STATE
===================================================== */

let timing: PutTiming = "WAIT";

if (timingScore >= 38)
timing = "MAX";

else if (timingScore >= 30)
timing = "STRONG";

else if (timingScore >= 20)
timing = "BUILD";

else if (timingScore >= 12)
timing = "EARLY";


/* =====================================================
CRITICAL PRICE OVERRIDE
===================================================== */

/*
* Structural deterioration + rising NASDAQ
* means:
*
* "WATCH / WAIT"
*
* not:
*
* "CHASE PUT".
*/

const strongBullishCounterMove =
bullishImpulse &&
priceScore >= 60 &&
!strongBearishPrice();

if (
strongBullishCounterMove &&
!panicConfirmed
) {
if (TIMING_RANK[timing] >= TIMING_RANK.MAX)
timing = "BUILD";

else if (
TIMING_RANK[timing] >= TIMING_RANK.STRONG
)
timing = "BUILD";

else if (
TIMING_RANK[timing] >= TIMING_RANK.BUILD
)
timing = "EARLY";
}


/* =====================================================
PANIC STATE
===================================================== */

const panicStrength =
(
(vix > 24 ? 2 : 0) +
(vix > 30 ? 2 : 0) +
(crashProbability >= 45 ? 2 : 0) +
(dangerScore >= 40 ? 2 : 0) +
(gamma < 0 ? 1 : 0) +
(vixTerm < 0.90 ? 1 : 0) +
(credit > 1.05 ? 1 : 0)
);

const panicEligible =
panicConfirmed &&
panicStrength >= 6;


/* =====================================================
DECISION
===================================================== */

let decision: PutTimingDecision =
"NO_TRADE";


/*
* PHASE 1
*/

if (
phase ===
"PHASE_1_EXPANSION"
) {

decision =
timing === "EARLY" &&
earlyBearish &&
structuralScore >= 5
? "DEFENSIVE_BUILD"
: "NO_TRADE";
}


/*
* PHASE 2
*/

else if (
phase ===
"PHASE_2_WARNING"
) {

if (
timing === "BUILD" &&
structuralScore >= 8
)
decision =
"STRUCTURAL_BUILD";

else if (
timing === "EARLY" &&
earlyBearish
)
decision =
"DEFENSIVE_BUILD";

else
decision =
"NO_TRADE";
}


/*
* PHASE 3
*/

else if (
phase ===
"PHASE_3_DISTRIBUTION"
) {

/*
* Distribution is the preparation phase.
*
* It should NOT automatically produce
* a short.
*/

if (
structuralBreakdown
) {

decision =
panicEligible
? "PANIC_SHORT"
: "STRUCTURAL_BUILD";

}

else if (
structuralScore >= 10 &&
TIMING_RANK[timing] >=
TIMING_RANK.BUILD
) {

decision =
TIMING_RANK[timing] >=
TIMING_RANK.STRONG
? "TRANSITIONAL_SHORT"
: "STRUCTURAL_BUILD";

}

else if (
structuralScore >= 6 &&
timing === "BUILD"
) {

decision =
"STRUCTURAL_BUILD";

}

else if (
structuralScore >= 4 &&
timing === "EARLY"
) {

decision =
"DEFENSIVE_BUILD";

}

else {

decision =
"NO_TRADE";
}
}


/*
* PHASE 4
*/

else if (
phase ===
"PHASE_4_RISK"
) {

if (panicEligible) {

decision =
timing === "MAX"
? "PANIC_SHORT"
: "TRANSITIONAL_SHORT";

}

else if (
structuralScore >= 12 &&
priceStateForPut !== "BULLISH" &&
TIMING_RANK[timing] >
TIMING_RANK.WAIT
) {

decision =
TIMING_RANK[timing] >=
TIMING_RANK.STRONG
? "TRANSITIONAL_SHORT"
: "STRUCTURAL_BUILD";

}

else if (
structuralScore >= 7 &&
TIMING_RANK[timing] >
TIMING_RANK.WAIT
) {

decision =
"DEFENSIVE_BUILD";

}

else {

decision =
"NO_TRADE";
}
}


/*
* PHASE 5
*/

else if (
phase ===
"PHASE_5_BREAKDOWN"
) {

if (panicEligible) {

decision =
"PANIC_SHORT";

}

else if (
structuralScore >= 12 &&
TIMING_RANK[timing] >=
TIMING_RANK.BUILD
) {

decision =
TIMING_RANK[timing] >=
TIMING_RANK.STRONG
? "TRANSITIONAL_SHORT"
: "STRUCTURAL_BUILD";

}

else {

decision =
"DEFENSIVE_BUILD";
}
}


/*
* PHASE 6 / 7
*/

else if (
phase ===
"PHASE_6_ACCELERATION" ||
phase ===
"PHASE_7_CAPITULATION"
) {

if (panicEligible)
decision =
"PANIC_SHORT";

else
decision =
"TRANSITIONAL_SHORT";
}


/* =====================================================
HARD PRICE SAFETY
===================================================== */

/*
* Never call a normal rising-price environment
* an aggressive short.
*/

if (
bullishImpulse &&
priceScore >= 70 &&
!panicEligible
) {

if (
decision ===
"PANIC_SHORT"
)
decision =
"TRANSITIONAL_SHORT";

if (
decision ===
"TRANSITIONAL_SHORT"
)
decision =
"STRUCTURAL_BUILD";
}


/* =====================================================
EXECUTION
===================================================== */

let execution =
"NONE";

switch (decision) {

case "DEFENSIVE_BUILD":
execution =
"SMALL STARTER";
break;

case "STRUCTURAL_BUILD":
execution =
"PARTIAL SIZE";
break;

case "TRANSITIONAL_SHORT":
execution =
"PARTIAL SIZE";
break;

case "PANIC_SHORT":

execution =
timing === "MAX"
? "FULL SIZE"
: "PARTIAL SIZE";

break;

default:
execution =
"NONE";
}


/* =====================================================
SCORE NORMALIZATION
===================================================== */

/*
* Keep the public score on the existing
* 0–24 scale so downstream engines remain
* compatible.
*/

const normalizedScore =
Math.round(
Math.min(
50,
timingScore
) *
24 /
50
);


/* =====================================================
HELPERS
===================================================== */

function strongBearishPrice() {
return (
priceScore <= 35 &&
(
bearishImpulse ||
acceleration <= -0.5
)
);
}


/* =====================================================
RETURN
===================================================== */

return {

decision,

timing,

execution,

score: {
value: normalizedScore,
max: 24
},

layers: {

structure: {
score: structuralScore,
max: 20,
state: structuralState
},

phase: {
score: phaseWeight,
max: 9
},

rotation: {
score: rotationWeight,
max: 6,
state: decayState
},

price: {
score: priceTimingScore,
max: 12,
state: priceStateForPut
},

panic: {
score: panicStrength,
max: 10,
confirmed: panicConfirmed
},

contradiction: {
score: contradiction,
max: 8
}
},

price: {

score: priceScore,

momentum5D,

momentum20D,

acceleration,

state: priceState,

structureAlignment,

earlyBearish,

bearishImpulse,

bullishImpulse,

cooling,

accelerating,

decelerating,

priceLeadingStructure,

structureLeadingPrice,

bearishConfirmation:
priceScore <= 40 &&
(
momentum5D < 0 ||
momentum20D < 0
),

strongBearish:
strongBearishPrice(),

bullishCounterMove:
strongBullishCounterMove
},

meta: {

panicConfirmed,

panicEligible,

structuralBreakdown,

internalDeterioration,

syntheticLiquidity,

liquidityStillSupportive:
liquidityScore > 55,

lowVolatility:
vix < 20,

volatilityExpansion,

regimeAligned,

institutionalState:

decision ===
"PANIC_SHORT"

? "PANIC_SHORT"

: decision ===
"TRANSITIONAL_SHORT"

? "TRANSITIONAL_SHORT"

: decision ===
"STRUCTURAL_BUILD"

? "STRUCTURAL_SHORT"

: decision ===
"DEFENSIVE_BUILD"

? "DEFENSIVE_SHORT"

: "NEUTRAL"
},

historyState: {

breadthTrend,

breadthAcceleration,

participationDecay,

leadershipDecay,

crashTrend,

phasePersistence,

regimePersistence,

relativeBreadthWeakness,

prolongedDistribution,

prolongedBearRegime,

severeBearRegime,

breadthDeteriorating,

breadthDecayAccelerating,

participationEroding,

severeParticipationErosion,

leadershipConcentration,

crashRiskRising,

severeCrashRiskRise,

broadParticipationFailure,

severeParticipationFailure
},

components: {

phase: {
value: phaseWeight,
max: 9
},

rotation: {
value: rotationWeight,
max: 6
},

structural: {
value: structuralScore,
max: 20
},

price: {
value: priceTimingScore,
max: 12
},

panic: {
value: panicStrength,
max: 10
},

contradiction: {
value: contradiction,
max: 8
}
}
};
}
