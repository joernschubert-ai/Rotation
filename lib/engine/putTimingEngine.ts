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
MAX: 4,
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
historyMetrics = {},
} = engine;

/* =====================================================
NORMALIZATION
===================================================== */

const rsSmall = Number(rotation?.rsSmall ?? 1);
const rsEqual = Number(rotation?.rsEqual ?? 1);
const rsGrowth = Number(rotation?.rsGrowth ?? 1);

const decayScore = Number(rotationDecay?.score ?? 0);

const decayState =
rotationDecay?.state ?? "HEALTHY_ROTATION";

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
priceMomentum?.state ?? "NEUTRAL";

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

/*
IMPORTANT:
Structural breakdown is deliberately NOT required
for normal PUT entry.
*/

const structuralBreakdown =
decayScore >= 85 &&
(
participationScore < 45 ||
breadthThrustScore < 40 ||
breadthDeteriorating
);

const internalDeterioration =
decayScore >= 75 &&
(
participationScore < 50 ||
breadthVelocityScore < 45 ||
breadthDeteriorating
);

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
PHASE
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
ROTATION
===================================================== */

const rotationWeight = (() => {
let score = 0;

if (rsSmall < 0.99)
score += 1;

if (rsSmall < 0.97)
score += 1;

if (rsEqual < 0.99)
score += 1;

switch (decayState) {
case "EARLY_DECAY":
score += 1;
break;

case "DISTRIBUTION_ROTATION":
score += 2;
break;

case "INTERNAL_BREAKDOWN":
score += 3;
break;

case "ROTATION_FAILURE":
score += 4;
break;

case "EXHAUSTED_ROTATION":
score += 4;
break;
}

return Math.min(score, 6);
})();

/* =====================================================
STRUCTURE SCORE
===================================================== */

let structuralScore = 0;

/*
Rotation
*/

structuralScore += rotationWeight;

/*
Participation
*/

if (participationScore < 55)
structuralScore += 1;

if (participationScore < 45)
structuralScore += 1;

if (participationScore < 38)
structuralScore += 2;

/*
Breadth
*/

if (breadthDeteriorating)
structuralScore += 1;

if (breadthDecayAccelerating)
structuralScore += 1;

if (breadthThrustScore < 45)
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
Participation history
*/

if (participationEroding)
structuralScore += 1;

if (severeParticipationErosion)
structuralScore += 2;

/*
Persistence
*/

if (prolongedDistribution)
structuralScore += 1;

if (prolongedBearRegime)
structuralScore += 1;

if (severeBearRegime)
structuralScore += 2;

/*
Liquidity / quality
*/

if (marketQualityScore < 50)
structuralScore += 1;

if (marketQualityScore < 40)
structuralScore += 1;

if (syntheticLiquidity)
structuralScore += 1;

/*
Leadership
*/

if (narrowLeadership)
structuralScore += 1;

if (leadershipConcentration)
structuralScore += 1;

/*
Crash trend
*/

if (crashRiskRising)
structuralScore += 1;

if (severeCrashRiskRise)
structuralScore += 2;

structuralScore =
Math.min(20, structuralScore);

/* =====================================================
STRUCTURAL STATE
===================================================== */

const structuralState: LayerState =
structuralScore >= 13
? "STRONG_BEARISH"
: structuralScore >= 7
? "BEARISH"
: structuralScore >= 4
? "NEUTRAL"
: "BULLISH";

/* =====================================================
PRICE TIMING
===================================================== */

/*
IMPORTANT DESIGN CHANGE

Price is no longer a binary confirmation.

The engine recognizes EARLY downside movement
before a classical bearish impulse exists.

This is what prevents the engine from waiting
until a large Nasdaq decline has already happened.
*/

let priceTimingScore = 0;

/*
PRICE SCORE

43 is already below neutral.
Therefore the threshold starts at 50 rather
than waiting for <= 40.
*/

if (priceScore < 50)
priceTimingScore += 1;

if (priceScore < 45)
priceTimingScore += 2;

if (priceScore < 40)
priceTimingScore += 2;

if (priceScore < 35)
priceTimingScore += 2;

/*
SHORT-TERM MOMENTUM

A negative 5D momentum is already useful.
*/

if (momentum5D < -0.25)
priceTimingScore += 1;

if (momentum5D < -0.75)
priceTimingScore += 1;

if (momentum5D < -1.50)
priceTimingScore += 1;

/*
MEDIUM-TERM MOMENTUM
*/

if (momentum20D < -0.50)
priceTimingScore += 1;

if (momentum20D < -1.25)
priceTimingScore += 1;

/*
ACCELERATION

-1.22 is meaningful.
It should not be ignored merely because
bearishImpulse has not fired.
*/

if (acceleration < -0.25)
priceTimingScore += 1;

if (acceleration < -0.75)
priceTimingScore += 2;

if (acceleration < -1.25)
priceTimingScore += 1;

/*
EARLY PRICE SIGNALS
*/

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
BEARISH IMPULSE

Still valuable, but now an accelerator,
NOT the gateway to a PUT.
*/

if (bearishImpulse)
priceTimingScore += 2;

/*
BULLISH IMPULSE

Counterweight only.
*/

if (bullishImpulse)
priceTimingScore -= 3;

if (
structureAlignment ===
"CONFIRMED_BULLISH"
)
priceTimingScore -= 3;

/*
Strong positive price momentum
*/

if (
priceScore >= 65 &&
momentum5D > 0
)
priceTimingScore -= 2;

/*
Cooling after an upward move
*/

if (
cooling &&
priceState === "UP"
)
priceTimingScore += 1;

priceTimingScore =
Math.max(
-6,
Math.min(
14,
priceTimingScore
)
);

/* =====================================================
PRICE STATE
===================================================== */

const priceStateForPut: LayerState =
priceTimingScore >= 9
? "STRONG_BEARISH"
: priceTimingScore >= 4
? "BEARISH"
: priceTimingScore <= -3
? "BULLISH"
: "NEUTRAL";

/* =====================================================
EARLY STRUCTURAL TRIGGER
===================================================== */

/*
This is the key addition.

We explicitly recognize:

- distribution / risk phase
- rotation decay
- liquidity deterioration
- negative Nasdaq momentum
- negative acceleration

BEFORE a formal bearish impulse.

This creates the early PUT window.
*/

const earlyStructuralTrigger =
(
phase === "PHASE_2_WARNING" ||
phase === "PHASE_3_DISTRIBUTION" ||
phase === "PHASE_4_RISK"
) &&
(
decayScore >= 70 ||
structuralScore >= 7 ||
liquidityScore < 35
) &&
(
momentum5D < -0.50 ||
acceleration < -0.50 ||
priceScore < 45
);

/*
Stronger version.
*/

const structuralPutTrigger =
(
phase === "PHASE_3_DISTRIBUTION" ||
phase === "PHASE_4_RISK" ||
phase === "PHASE_5_BREAKDOWN"
) &&
structuralScore >= 7 &&
(
priceTimingScore >= 3 ||
earlyStructuralTrigger
);

/* =====================================================
CONTRADICTION
===================================================== */

let contradiction = 0;

/*
Strong bullish price against structure
*/

if (
bullishImpulse &&
structuralScore < 10
) {
contradiction += 3;
}

if (
priceScore >= 65 &&
momentum5D > 0 &&
structuralScore < 8
) {
contradiction += 2;
}

/*
Healthy market conditions
*/

if (
vix < 20 &&
structuralScore < 5
) {
contradiction += 1;
}

if (
liquidityScore > 70 &&
participationScore > 60 &&
decayScore < 60
) {
contradiction += 2;
}

/*
Do NOT punish a structurally weak market
simply because VIX is still calm.
*/

contradiction =
Math.min(8, contradiction);

/* =====================================================
TIMING SCORE
===================================================== */

/*
Structural deterioration remains dominant.

BUT:

Price now has enough influence to open
an early entry window.
*/

let timingScore =
structuralScore +
phaseWeight +
priceTimingScore;

/*
Historical confirmation
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
Early warning
*/

if (earlyWarning?.active)
timingScore += 1;

/*
Explicit early structural trigger

Small bonus only.
It opens the door but cannot manufacture
a bearish regime by itself.
*/

if (earlyStructuralTrigger)
timingScore += 3;

if (structuralPutTrigger)
timingScore += 2;

/*
Contradiction
*/

timingScore -= contradiction;

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

else if (timingScore >= 10)
timing = "EARLY";

/* =====================================================
EARLY ENTRY FLOOR
===================================================== */

/*
Important:

If the market is already structurally weak and
price has started moving down, we do not want
the score threshold alone to suppress the first
entry.

Therefore an early structural trigger guarantees
at least EARLY timing, unless a strong bullish
contradiction exists.
*/

const strongBullishCounterMove =
bullishImpulse &&
priceScore >= 60 &&
!strongBearishPrice();

if (
earlyStructuralTrigger &&
!panicConfirmed &&
!strongBullishCounterMove &&
TIMING_RANK[timing] < TIMING_RANK.EARLY
) {
timing = "EARLY";
}

/* =====================================================
PRICE SAFETY
===================================================== */

/*
A genuine bullish counter-move can still
slow the entry.

But it no longer destroys the underlying
structural signal.
*/

if (
strongBullishCounterMove &&
!panicConfirmed
) {
if (
TIMING_RANK[timing] >=
TIMING_RANK.MAX
) {
timing = "BUILD";
}

else if (
TIMING_RANK[timing] >=
TIMING_RANK.STRONG
) {
timing = "BUILD";
}

else if (
TIMING_RANK[timing] >=
TIMING_RANK.BUILD
) {
timing = "EARLY";
}
}

/* =====================================================
PANIC
===================================================== */

const panicStrength =
(vix > 24 ? 2 : 0) +
(vix > 30 ? 2 : 0) +
(crashProbability >= 45 ? 2 : 0) +
(dangerScore >= 40 ? 2 : 0) +
(gamma < 0 ? 1 : 0) +
(vixTerm < 0.90 ? 1 : 0) +
(credit > 1.05 ? 1 : 0);

const panicEligible =
panicConfirmed &&
panicStrength >= 6;

/* =====================================================
DECISION
===================================================== */

let decision: PutTimingDecision =
"NO_TRADE";

/* =====================================================
PHASE 1
===================================================== */

if (
phase === "PHASE_1_EXPANSION"
) {
decision =
timing === "EARLY" &&
earlyBearish &&
structuralScore >= 5
? "DEFENSIVE_BUILD"
: "NO_TRADE";
}

/* =====================================================
PHASE 2
===================================================== */

else if (
phase === "PHASE_2_WARNING"
) {
if (
timing === "BUILD" &&
structuralScore >= 7
) {
decision =
"STRUCTURAL_BUILD";
}

else if (
timing === "EARLY" &&
(
earlyBearish ||
earlyStructuralTrigger
)
) {
decision =
"DEFENSIVE_BUILD";
}

else {
decision =
"NO_TRADE";
}
}

/* =====================================================
PHASE 3
===================================================== */

else if (
phase === "PHASE_3_DISTRIBUTION"
) {
/*
* Panic always wins.
*/

if (panicEligible) {
decision =
timing === "MAX"
? "PANIC_SHORT"
: "TRANSITIONAL_SHORT";
}

/*
* Structural breakdown.
*/

else if (
structuralBreakdown &&
(
timing !== "WAIT" ||
structuralPutTrigger
)
) {
decision =
timing === "STRONG" ||
timing === "MAX"
? "TRANSITIONAL_SHORT"
: "STRUCTURAL_BUILD";
}

/*
* EARLY BUILD WINDOW

This is the important new path.

We can enter before a formal breakdown
if structure is already deteriorating and
Nasdaq price momentum confirms downside.
*/

else if (
earlyStructuralTrigger &&
structuralScore >= 5 &&
timing !== "WAIT"
) {
decision =
timing === "EARLY"
? "DEFENSIVE_BUILD"
: timing === "BUILD"
? "STRUCTURAL_BUILD"
: "TRANSITIONAL_SHORT";
}

/*
* Normal structural setup.
*/

else if (
structuralScore >= 8 &&
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

/* =====================================================
PHASE 4
===================================================== */

else if (
phase === "PHASE_4_RISK"
) {
if (panicEligible) {
decision =
timing === "MAX"
? "PANIC_SHORT"
: "TRANSITIONAL_SHORT";
}

/*
* Early structural entry is explicitly allowed.
*/

else if (
earlyStructuralTrigger &&
structuralScore >= 6 &&
timing !== "WAIT" &&
priceStateForPut !== "BULLISH"
) {
decision =
timing === "EARLY"
? "DEFENSIVE_BUILD"
: timing === "BUILD"
? "STRUCTURAL_BUILD"
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

/* =====================================================
PHASE 5
===================================================== */

else if (
phase === "PHASE_5_BREAKDOWN"
) {
if (panicEligible) {
decision =
"PANIC_SHORT";
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

else {
decision =
"DEFENSIVE_BUILD";
}
}

/* =====================================================
PHASE 6 / 7
===================================================== */

else if (
phase === "PHASE_6_ACCELERATION" ||
phase === "PHASE_7_CAPITULATION"
) {
if (panicEligible) {
decision =
"PANIC_SHORT";
}

else {
decision =
"TRANSITIONAL_SHORT";
}
}

/* =====================================================
FINAL PRICE SAFETY
===================================================== */

/*
Never allow a normal strong bullish price
environment to produce an aggressive short.

This is intentionally the LAST safety layer.
*/

if (
bullishImpulse &&
priceScore >= 70 &&
momentum5D > 0 &&
!panicEligible
) {
if (
decision === "PANIC_SHORT"
) {
decision =
"TRANSITIONAL_SHORT";
}

if (
decision === "TRANSITIONAL_SHORT"
) {
decision =
"STRUCTURAL_BUILD";
}
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
ENTRY WINDOW
===================================================== */

const entryWindow =
timing === "MAX"
? "MAXIMUM"
: timing === "STRONG"
? "STRONG"
: timing === "BUILD"
? "OPEN"
: timing === "EARLY"
? "EARLY"
: "CLOSED";

/* =====================================================
TRIGGER QUALITY
===================================================== */

const triggerQuality =
panicEligible
? "PANIC"
: structuralBreakdown
? "STRUCTURAL_BREAKDOWN"
: structuralPutTrigger
? "STRUCTURAL"
: earlyStructuralTrigger
? "EARLY_STRUCTURAL"
: priceTimingScore >= 5
? "PRICE_CONFIRMED"
: "INSUFFICIENT";

/* =====================================================
NORMALIZED SCORE
===================================================== */

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
priceScore <= 40 &&
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
max: 24,
},

entryWindow,

triggerQuality,

layers: {
structure: {
score: structuralScore,
max: 20,
state: structuralState,
},

phase: {
score: phaseWeight,
max: 9,
},

rotation: {
score: rotationWeight,
max: 6,
state: decayState,
},

price: {
score: priceTimingScore,
max: 14,
state: priceStateForPut,
},

panic: {
score: panicStrength,
max: 10,
confirmed: panicConfirmed,
},

contradiction: {
score: contradiction,
max: 8,
},
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
priceScore <= 45 &&
(
momentum5D < 0 ||
momentum20D < 0
),

strongBearish:
strongBearishPrice(),

bullishCounterMove:
strongBullishCounterMove,
},

meta: {
panicConfirmed,
panicEligible,

structuralBreakdown,
internalDeterioration,

earlyStructuralTrigger,
structuralPutTrigger,

syntheticLiquidity,

liquidityStillSupportive:
liquidityScore > 55,

lowVolatility:
vix < 20,

volatilityExpansion,

regimeAligned,

institutionalState:
decision === "PANIC_SHORT"
? "PANIC_SHORT"
: decision === "TRANSITIONAL_SHORT"
? "TRANSITIONAL_SHORT"
: decision === "STRUCTURAL_BUILD"
? "STRUCTURAL_SHORT"
: decision === "DEFENSIVE_BUILD"
? "DEFENSIVE_SHORT"
: "NEUTRAL",
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
severeParticipationFailure,
},

components: {
phase: {
value: phaseWeight,
max: 9,
},

rotation: {
value: rotationWeight,
max: 6,
},

crash: {
value:
crashProbability >= 75
? 6
: crashProbability >= 60
? 4
: crashProbability >= 40
? 2
: 0,
max: 6,
},

earlyWarning: {
value:
earlyWarning?.active
? 1
: 0,
max: 2,
},

decay: {
value:
decayScore >= 80
? 4
: decayScore >= 60
? 3
: decayScore >= 45
? 1
: 0,
max: 4,
},

structural: {
value: structuralScore,
max: 20,
},

price: {
value: priceTimingScore,
max: 14,
},

panic: {
value: panicStrength,
max: 10,
},

contradiction: {
value: contradiction,
max: 8,
},
},
};
}
