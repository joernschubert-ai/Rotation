// /lib/engine/rotationConfirmEngine.ts

export function rotationConfirmEngine({
rotation,
structure,
crash,
earlyWarning,
drivers,
positioning,
volatility,
executionState,
regimeSync,

liquidity,
fragility,
squeeze,
participation,
breadthThrust,

rotationDecay,
historyMetrics
}: any) {

/* =====================================================
INPUT
===================================================== */

const rsSmall =
Number(rotation?.rsSmall ?? 1);

const rsGrowth =
Number(rotation?.rsGrowth ?? 1);

const rsEqual =
Number(rotation?.rsEqual ?? 1);

const rotationScore =
Number(rotation?.score ?? 0);

const breadth20 =
Number(
structure?.breadth?.b20?.value ??
structure?.breadth?.b20 ??
0
);

const breadth50 =
Number(
structure?.breadth?.b50?.value ??
structure?.breadth?.b50 ??
0
);

const breadth200 =
Number(
structure?.breadth?.b200?.value ??
structure?.breadth?.b200 ??
0
);

const ad =
Number(
structure?.advanceDecline?.value ??
structure?.advanceDecline ??
0
);

const highs =
Number(
structure?.highsLows?.highs ?? 0
);

const lows =
Number(
structure?.highsLows?.lows ?? 0
);

const crashScore =
Number(crash?.score ?? 0);

const crashProbability =
Number(crash?.probability ?? 0);

const early =
Boolean(
earlyWarning?.active
);

const earlyScore =
Number(
earlyWarning?.score?.value ??
earlyWarning?.score ??
0
);

const gamma =
Number(
drivers?.raw?.gamma ??
drivers?.gamma ??
0
);

const correlation =
Number(
drivers?.raw?.correlation ??
drivers?.correlation ??
1
);

const vix =
Number(
drivers?.raw?.vix ??
drivers?.vix ??
volatility?.vix ??
20
);

const move =
Number(
drivers?.raw?.move ??
drivers?.move ??
80
);

const liquidityScore =
Number(
liquidity?.score ??
50
);

const fragilityScore =
Number(
fragility?.score ??
50
);

const participationScore =
Number(
participation?.score ??
50
);

const thrustScore =
Number(
breadthThrust?.score ??
50
);


/* =====================================================
ROTATION DECAY
===================================================== */

const rotationDecayScore =
Number(
rotationDecay?.score ?? 0
);

const rotationDecayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";


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

const participationDecayHistory =
Number(
historyMetrics?.participationDecay ?? 0
);

const leadershipDecayHistory =
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

const relativeBreadthWeakness =
Number(
historyMetrics?.relativeBreadthWeakness ?? 0
);

const institutionalPressure =
Number(
historyMetrics?.institutionalPressure ?? 0
);

const daysInPhase =
Number(
historyMetrics?.daysInPhase ?? 0
);

const breadthWeakDays =
Number(
historyMetrics?.breadthWeakDays ?? 0
);

const participationWeakDays =
Number(
historyMetrics?.participationWeakDays ?? 0
);

const rotationWeakDays =
Number(
historyMetrics?.rotationWeakDays ?? 0
);

const liquidityWeakDays =
Number(
historyMetrics?.liquidityWeakDays ?? 0
);

const fragilityHighDays =
Number(
historyMetrics?.fragilityHighDays ?? 0
);

const distributionDays =
Number(
historyMetrics?.distributionDays ?? 0
);

const prolongedBearRegime =
Boolean(
historyMetrics?.prolongedBearRegime
);

const persistentDistribution =
Boolean(
historyMetrics?.persistentDistribution
);

const acceleratingWeakness =
Boolean(
historyMetrics?.acceleratingWeakness
);


/* =====================================================
HISTORY-DERIVED STRUCTURAL FLAGS
===================================================== */

/*
* These flags are deliberately independent from the
* current one-day snapshot.
*
* A rotation confirmation engine must not suddenly call
* a long-running bearish structure "healthy" merely
* because today's breadth is temporarily stable.
*/

const persistentBreadthWeakness =
breadthWeakDays >= 20;

const persistentParticipationWeakness =
participationWeakDays >= 20;

const persistentRotationWeakness =
rotationWeakDays >= 30;

const persistentLiquidityWeakness =
liquidityWeakDays >= 30;

const persistentFragility =
fragilityHighDays >= 30;

const persistentDistributionHistory =
distributionDays >= 20 ||
persistentDistribution;


/* =====================================================
FLAGS
===================================================== */

/*
* Breadth is intentionally separated into:
*
* strong
* healthy
* neutral
* weak
*
* This prevents a B50 value around 55 from being
* interpreted as a healthy confirmation when the
* broader structure is deteriorating.
*/

const strongBreadth =
breadth50 > 70 &&
breadth200 > 60;

const healthyBreadth =
breadth50 > 58 &&
breadth200 > 52;

const weakBreadth =
breadth50 < 50 ||
breadth200 < 50;

const severelyWeakBreadth =
breadth50 < 42 ||
breadth200 < 45;


/*
* Internal breadth confirmation.
*/

const healthyInternals =
ad > 0 &&
highs > lows;

const weakInternals =
ad < 0 ||
lows > highs;

const neutralInternals =
ad === 0 &&
highs === lows;


const calmVolatility =
vix < 20;


/*
* Narrow leadership:
*
* Growth leads while Small Caps and Equal Weight
* remain below the market-wide benchmark.
*/

const narrowLeadership =
rsGrowth > 1.03 &&
rsSmall < 1 &&
rsEqual < 1;

const severeNarrowLeadership =
rsGrowth > 1.05 &&
rsSmall < 0.95 &&
rsEqual < 0.95;

const megaCapDistortion =
rsGrowth > 1.05 &&
rsSmall < 0.97 &&
rsEqual < 0.97;


/*
* Structural confirmation failure.
*/

const internalBreakdown =
weakBreadth &&
weakInternals;

const structuralDeterioration =
weakBreadth ||
weakInternals ||
narrowLeadership ||
rotationDecayScore >= 50 ||
participationScore < 45 ||
liquidityScore < 40 ||
fragilityScore > 75;


/* =====================================================
QUALITY
===================================================== */

/*
* Quality answers:
*
* "How healthy is the rotation right now?"
*
* It is NOT the same thing as rotation direction.
*/

let quality = 55;


if (healthyBreadth) {
quality += 10;
}

if (strongBreadth) {
quality += 10;
}

if (healthyInternals) {
quality += 8;
}

if (participationScore > 55) {
quality += 6;
}

if (thrustScore > 60) {
quality += 5;
}

if (liquidityScore > 65) {
quality += 5;
}

if (gamma > 0) {
quality += 4;
}

if (calmVolatility) {
quality += 4;
}


/* -----------------------------------------------------
NEGATIVE CURRENT STRUCTURE
----------------------------------------------------- */

if (weakBreadth) {
quality -= 8;
}

if (severelyWeakBreadth) {
quality -= 8;
}

if (weakInternals) {
quality -= 8;
}

if (narrowLeadership) {
quality -= 4;
}

if (severeNarrowLeadership) {
quality -= 8;
}

if (megaCapDistortion) {
quality -= 8;
}

if (participationScore < 45) {
quality -= 8;
}

if (liquidityScore < 40) {
quality -= 6;
}

if (fragilityScore > 75) {
quality -= 8;
}

if (crashProbability > 55) {
quality -= 10;
}

if (early) {
quality -= 4;
}


/* -----------------------------------------------------
HISTORICAL QUALITY
----------------------------------------------------- */

if (phasePersistence >= 20) {
quality -= 2;
}

if (phasePersistence >= 40) {
quality -= 3;
}

if (persistentDistributionHistory) {
quality -= 6;
}

if (persistentBreadthWeakness) {
quality -= 5;
}

if (persistentParticipationWeakness) {
quality -= 5;
}

if (persistentRotationWeakness) {
quality -= 5;
}

if (persistentLiquidityWeakness) {
quality -= 4;
}

if (persistentFragility) {
quality -= 5;
}

if (prolongedBearRegime) {
quality -= 5;
}

if (institutionalPressure > 60) {
quality -= 4;
}

if (participationDecayHistory > 20) {
quality -= 4;
}

if (breadthTrend < -1) {
quality -= 3;
}

if (breadthAcceleration < -1) {
quality -= 3;
}

if (relativeBreadthWeakness > 10) {
quality -= 3;
}

if (acceleratingWeakness) {
quality -= 5;
}

if (rotationDecayScore > 60) {
quality -= 10;
}

else if (rotationDecayScore > 40) {
quality -= 5;
}

quality =
Math.max(
0,
Math.min(
100,
Math.round(quality)
)
);


/* =====================================================
SUSTAINABILITY
===================================================== */

/*
* Sustainability asks whether the current rotational
* structure can plausibly continue.
*/

let sustainability = 55;

if (healthyBreadth) {
sustainability += 10;
}

if (strongBreadth) {
sustainability += 8;
}

if (healthyInternals) {
sustainability += 8;
}

if (participationScore > 55) {
sustainability += 6;
}

if (gamma > 0) {
sustainability += 5;
}

if (liquidityScore > 65) {
sustainability += 5;
}

if (calmVolatility) {
sustainability += 4;
}


/* -----------------------------------------------------
NEGATIVE
----------------------------------------------------- */

if (weakBreadth) {
sustainability -= 8;
}

if (severelyWeakBreadth) {
sustainability -= 8;
}

if (weakInternals) {
sustainability -= 8;
}

if (narrowLeadership) {
sustainability -= 4;
}

if (severeNarrowLeadership) {
sustainability -= 8;
}

if (megaCapDistortion) {
sustainability -= 8;
}

if (participationScore < 45) {
sustainability -= 8;
}

if (liquidityScore < 40) {
sustainability -= 6;
}

if (rotationDecayScore > 60) {
sustainability -= 12;
}

if (persistentDistributionHistory) {
sustainability -= 6;
}

if (persistentBreadthWeakness) {
sustainability -= 5;
}

if (persistentParticipationWeakness) {
sustainability -= 5;
}

if (persistentRotationWeakness) {
sustainability -= 5;
}

if (persistentFragility) {
sustainability -= 5;
}

if (prolongedBearRegime) {
sustainability -= 5;
}

if (participationDecayHistory > 20) {
sustainability -= 4;
}

if (breadthTrend < -1) {
sustainability -= 3;
}

if (breadthAcceleration < -1) {
sustainability -= 3;
}

if (acceleratingWeakness) {
sustainability -= 6;
}

if (institutionalPressure >= 80) {
sustainability -= 5;
}

sustainability =
Math.max(
0,
Math.min(
100,
Math.round(sustainability)
)
);


/* =====================================================
FALSE BREAK RISK
===================================================== */

/*
* FalseBreakRisk is asymmetric:
*
* A bearish structural break is more trustworthy when
* participation, breadth, liquidity and history all
* confirm it.
*
* Conversely, a positive price move without internal
* confirmation receives a high false-break risk.
*/

let falseBreakRisk = 25;

if (narrowLeadership) {
falseBreakRisk += 5;
}

if (severeNarrowLeadership) {
falseBreakRisk += 8;
}

if (megaCapDistortion) {
falseBreakRisk += 6;
}

if (weakBreadth) {
falseBreakRisk += 6;
}

if (weakInternals) {
falseBreakRisk += 6;
}

if (rotationDecayScore > 60) {
falseBreakRisk += 10;
}

else if (rotationDecayScore > 40) {
falseBreakRisk += 5;
}

if (crashProbability > 55) {
falseBreakRisk += 10;
}

if (gamma < 0) {
falseBreakRisk += 8;
}

if (persistentDistributionHistory) {
falseBreakRisk += 8;
}

if (persistentBreadthWeakness) {
falseBreakRisk += 5;
}

if (persistentParticipationWeakness) {
falseBreakRisk += 5;
}

if (persistentRotationWeakness) {
falseBreakRisk += 5;
}

if (prolongedBearRegime) {
falseBreakRisk += 6;
}

if (crashTrend > 5) {
falseBreakRisk += 4;
}

if (breadthAcceleration < -1) {
falseBreakRisk += 5;
}

if (acceleratingWeakness) {
falseBreakRisk += 6;
}

if (institutionalPressure >= 80) {
falseBreakRisk += 5;
}


/*
* If the internals are actually improving, false-break
* risk should fall.
*/

if (
healthyBreadth &&
healthyInternals &&
participationScore >= 55 &&
rotationScore >= 50
) {
falseBreakRisk -= 10;
}

falseBreakRisk =
Math.max(
0,
Math.min(
100,
Math.round(falseBreakRisk)
)
);


/* =====================================================
RECOVERY QUALITY
===================================================== */

/*
* Recovery must be broad.
*
* A Nasdaq rebound led only by Growth while Small Caps,
* Equal Weight and participation remain weak is NOT
* treated as a confirmed rotation recovery.
*/

const recoveryBreadthScore =
breadth50 * 0.35 +
breadth200 * 0.20;

const recoveryInternalScore =
participationScore * 0.25 +
thrustScore * 0.10;

const recoveryRotationScore =
rotationScore * 0.10;

const recoveryScore =
Math.max(
0,
Math.min(
100,
Math.round(
recoveryBreadthScore +
recoveryInternalScore +
recoveryRotationScore
)
)
);

const rotationRecovery =
recoveryScore >= 62 &&
breadth50 >= 58 &&
breadth200 >= 52 &&
participationScore >= 55 &&
rotationScore >= 52 &&
!narrowLeadership &&
!hiddenDistributionFallback(
rotationDecay,
historyMetrics
);


/* =====================================================
STATE
===================================================== */

let state =
"EARLY";

let confidence =
45;


/*
* -----------------------------------------------------
* HARD INTERNAL BREAKDOWN
* -----------------------------------------------------
*
* Distribution takes precedence over a superficial
* "confirming" signal.
*/

if (
(
rotationDecayScore >= 65 &&
participationScore < 50
) ||
(
persistentDistributionHistory &&
participationScore < 55 &&
rotationScore < 50
) ||
(
prolongedBearRegime &&
institutionalPressure >= 80 &&
participationScore < 50
) ||
(
severeNarrowLeadership &&
weakBreadth &&
weakInternals
)
) {

state =
"INTERNAL_BREAKDOWN";

confidence =
25;
}

/*
* -----------------------------------------------------
* CONFIRMED
* -----------------------------------------------------
*
* Confirmation requires broad participation.
*/

else if (
strongBreadth &&
healthyInternals &&
participationScore >= 60 &&
rotationScore >= 60 &&
quality >= 72 &&
sustainability >= 68 &&
falseBreakRisk < 40 &&
!narrowLeadership &&
rotationDecayScore < 40
) {

state =
"CONFIRMED";

confidence =
82;
}

/*
* -----------------------------------------------------
* CONFIRMING
* -----------------------------------------------------
*/

else if (
healthyBreadth &&
healthyInternals &&
participationScore >= 52 &&
quality >= 55 &&
falseBreakRisk < 60 &&
rotationDecayScore < 55 &&
!severeNarrowLeadership
) {

state =
"CONFIRMING";

confidence =
65;
}

/*
* -----------------------------------------------------
* EARLY
* -----------------------------------------------------
*
* Weak structure or incomplete confirmation remains
* EARLY rather than being promoted artificially.
*/

else {

state =
"EARLY";

confidence =
45;
}


/*
* Recovery can override a stale breakdown only if the
* recovery itself is broad and credible.
*/

if (
rotationRecovery &&
quality >= 60 &&
sustainability >= 60 &&
falseBreakRisk < 50
) {

state =
"CONFIRMING";

confidence =
Math.max(
confidence,
68
);
}


/*
* But a recovery attempt cannot override a strong
* historical distribution structure.
*/

if (
persistentDistributionHistory &&
institutionalPressure >= 80 &&
participationScore < 55
) {

state =
"INTERNAL_BREAKDOWN";

confidence =
25;
}


/* =====================================================
SUMMARY
===================================================== */

let summary =
"Selective rotation with stable internals";


if (
state === "EARLY"
) {

summary =
"Rotation not yet confirmed; internal participation remains incomplete";
}


if (
state === "CONFIRMING"
) {

summary =
"Rotation improving with partial internal confirmation";
}


if (
state === "CONFIRMED"
) {

summary =
"Broad institutional rotation confirmed";
}


if (
state === "INTERNAL_BREAKDOWN"
) {

summary =
"Internal participation deterioration accelerating";
}


if (
narrowLeadership
) {

summary +=
" | Narrow leadership";
}


if (
megaCapDistortion
) {

summary +=
" | Mega-cap distortion";
}


if (
persistentDistributionHistory
) {

summary +=
" | Persistent distribution";
}


if (
prolongedBearRegime
) {

summary +=
" | Prolonged bearish regime";
}


if (
persistentBreadthWeakness
) {

summary +=
" | Persistent breadth weakness";
}


if (
persistentParticipationWeakness
) {

summary +=
" | Persistent participation weakness";
}


if (
acceleratingWeakness
) {

summary +=
" | Accelerating weakness";
}


if (
rotationRecovery
) {

summary +=
" | Broad recovery attempt";
}


/* =====================================================
RETURN
===================================================== */

return {

state,
confidence,

quality,
sustainability,

participation:
participationScore,

liquiditySupport:
liquidityScore,

falseBreakRisk,

rotationDecayScore,
rotationDecayState,

summary,

metrics: {

rsSmall,
rsGrowth,
rsEqual,

rotationScore,

breadth20,
breadth50,
breadth200,

ad,
highs,
lows,

vix,
move,

gamma,
correlation,

crashScore,
crashProbability,
earlyScore,

participation:
participationScore,

thrust:
thrustScore,

rotationDecay:
rotationDecayScore,

breadthTrend,

breadthAcceleration,

participationDecay:
participationDecayHistory,

leadershipDecay:
leadershipDecayHistory,

crashTrend,

phasePersistence,

relativeBreadthWeakness,

institutionalPressure,

daysInPhase,

breadthWeakDays,
participationWeakDays,
rotationWeakDays,
liquidityWeakDays,
fragilityHighDays,
distributionDays,

persistentBreadthWeakness,
persistentParticipationWeakness,
persistentRotationWeakness,
persistentLiquidityWeakness,
persistentFragility,
persistentDistributionHistory,

prolongedBearRegime,
acceleratingWeakness,

recoveryScore,

healthyBreadth,
strongBreadth,
weakBreadth,
severelyWeakBreadth,

healthyInternals,
weakInternals,

narrowLeadership,
severeNarrowLeadership,
megaCapDistortion,

internalBreakdown,
structuralDeterioration
}
};
}


/* ============================================================
HELPERS
============================================================ */

/*
* Defensive helper:
*
* Internal divergence / rotation decay may expose
* hiddenDistribution directly, while history may expose
* persistentDistribution.
*
* The confirmation engine should not depend on exactly
* one pipeline shape.
*/

function hiddenDistributionFallback(
rotationDecay: any,
historyMetrics: any
): boolean {

return Boolean(
rotationDecay?.hiddenDistribution ||
rotationDecay?.institutionalDistribution ||
historyMetrics?.hiddenDistribution ||
historyMetrics?.persistentDistribution
);
}
