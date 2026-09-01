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
Boolean(earlyWarning?.active);

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
Number(liquidity?.score ?? 50);

const fragilityScore =
Number(fragility?.score ?? 50);

const participationScore =
Number(participation?.score ?? 50);

const thrustScore =
Number(breadthThrust?.score ?? 50);


/* =====================================================
ROTATION DECAY
===================================================== */

const rotationDecayScore =
Number(rotationDecay?.score ?? 0);

const rotationDecayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";


/* =====================================================
HISTORY RELIABILITY
===================================================== */

const historyReliability = 0.55;


/* =====================================================
RAW HISTORY
===================================================== */

const breadthTrend =
Number(historyMetrics?.breadthTrend ?? 0);

const breadthAcceleration =
Number(historyMetrics?.breadthAcceleration ?? 0);

const participationTrendHistory =
Number(historyMetrics?.participationTrend ?? 0);

const participationDecayHistory =
Number(historyMetrics?.participationDecay ?? 0);

const leadershipDecayHistory =
Number(historyMetrics?.leadershipDecay ?? 0);

const rotationTrend =
Number(historyMetrics?.rotationTrend ?? 0);

const liquidityTrend =
Number(historyMetrics?.liquidityTrend ?? 0);

const fragilityTrend =
Number(historyMetrics?.fragilityTrend ?? 0);

const crashTrend =
Number(historyMetrics?.crashTrend ?? 0);

const phasePersistence =
Number(historyMetrics?.phasePersistence ?? 0);

const relativeBreadthWeakness =
Number(historyMetrics?.relativeBreadthWeakness ?? 0);

const institutionalPressureRaw =
Number(historyMetrics?.institutionalPressure ?? 0);

const daysInPhase =
Number(historyMetrics?.daysInPhase ?? 0);

const breadthWeakDays =
Number(historyMetrics?.breadthWeakDays ?? 0);

const participationWeakDays =
Number(historyMetrics?.participationWeakDays ?? 0);

const rotationWeakDays =
Number(historyMetrics?.rotationWeakDays ?? 0);

const liquidityWeakDays =
Number(historyMetrics?.liquidityWeakDays ?? 0);

const fragilityHighDays =
Number(historyMetrics?.fragilityHighDays ?? 0);

const distributionDays =
Number(historyMetrics?.distributionDays ?? 0);

const prolongedBearRegimeRaw =
Boolean(historyMetrics?.prolongedBearRegime);

const persistentDistributionRaw =
Boolean(historyMetrics?.persistentDistribution);

const acceleratingWeaknessRaw =
Boolean(historyMetrics?.acceleratingWeakness);


/* =====================================================
WEIGHTED HISTORY
===================================================== */

const weightedBreadthWeakDays =
breadthWeakDays * historyReliability;

const weightedParticipationWeakDays =
participationWeakDays * historyReliability;

const weightedRotationWeakDays =
rotationWeakDays * historyReliability;

const weightedLiquidityWeakDays =
liquidityWeakDays * historyReliability;

const weightedFragilityHighDays =
fragilityHighDays * historyReliability;

const weightedDistributionDays =
distributionDays * historyReliability;

const weightedPhasePersistence =
phasePersistence * historyReliability;

const weightedInstitutionalPressure =
institutionalPressureRaw * historyReliability;


/* =====================================================
HISTORY FLAGS
===================================================== */

const persistentBreadthWeakness =
weightedBreadthWeakDays >= 20;

const persistentParticipationWeakness =
weightedParticipationWeakDays >= 20;

const persistentRotationWeakness =
weightedRotationWeakDays >= 30;

const persistentLiquidityWeakness =
weightedLiquidityWeakDays >= 30;

const persistentFragility =
weightedFragilityHighDays >= 30;

const persistentDistributionHistory =
weightedDistributionDays >= 20;


/* =====================================================
BREADTH FLAGS
===================================================== */

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


/* =====================================================
INTERNALS
===================================================== */

const healthyInternals =
ad > 0 &&
highs > lows;

const weakInternals =
ad < 0 ||
lows > highs;

const neutralInternals =
!healthyInternals &&
!weakInternals;


/* =====================================================
VOLATILITY
===================================================== */

const calmVolatility =
vix < 20;

const stressedVolatility =
vix >= 25;


/* =====================================================
LEADERSHIP
===================================================== */

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


/* =====================================================
CURRENT STRUCTURAL FLAGS
===================================================== */

const internalBreakdown =
weakBreadth &&
weakInternals;


const currentStructuralBreakdown =
(
fragilityScore >= 85 &&
liquidityScore < 35 &&
participationScore < 45 &&
rotationScore < 20
) ||
(
severelyWeakBreadth &&
weakInternals &&
participationScore < 45
);


/* =====================================================
CURRENT BEARISH STRUCTURE
===================================================== */

/*
* Das ist der zentrale neue Teil.
*
* Die Engine erkennt jetzt nicht nur,
* ob eine bullische Rotation bestätigt ist,
* sondern auch, ob eine bearishe Marktrotation
* institutionell bestätigt wird.
*/

const bearishBreadth =
breadth50 < 55 ||
breadth200 < 52;

const bearishParticipation =
participationScore < 55;

const bearishLiquidity =
liquidityScore < 50;

const elevatedFragility =
fragilityScore >= 65;

const severeFragility =
fragilityScore >= 80;

const elevatedDecay =
rotationDecayScore >= 45;

const severeDecay =
rotationDecayScore >= 65;


const bearishStructureSignals = [

bearishBreadth,

weakInternals,

bearishParticipation,

bearishLiquidity,

elevatedFragility,

elevatedDecay,

persistentDistributionHistory,

persistentBreadthWeakness,

persistentParticipationWeakness,

persistentLiquidityWeakness,

acceleratingWeaknessRaw

].filter(Boolean).length;


/* =====================================================
STRUCTURAL DETERIORATION
===================================================== */

const structuralDeterioration =
weakBreadth ||
weakInternals ||
narrowLeadership ||
rotationDecayScore >= 50 ||
participationScore < 45 ||
liquidityScore < 40 ||
fragilityScore > 75;


/* =====================================================
BULLISH QUALITY
===================================================== */

let quality = 55;


if (healthyBreadth) quality += 10;

if (strongBreadth) quality += 10;

if (healthyInternals) quality += 8;

if (participationScore > 55) quality += 6;

if (thrustScore > 60) quality += 5;

if (liquidityScore > 65) quality += 5;

if (gamma > 0) quality += 4;

if (calmVolatility) quality += 4;


if (weakBreadth) quality -= 8;

if (severelyWeakBreadth) quality -= 8;

if (weakInternals) quality -= 8;

if (narrowLeadership) quality -= 4;

if (severeNarrowLeadership) quality -= 8;

if (megaCapDistortion) quality -= 8;

if (participationScore < 45) quality -= 8;

if (liquidityScore < 40) quality -= 6;

if (fragilityScore > 75) quality -= 8;

if (crashProbability > 55) quality -= 10;

if (early) quality -= 4;


if (weightedPhasePersistence >= 20)
quality -= 2;

if (weightedPhasePersistence >= 40)
quality -= 3;

if (persistentDistributionHistory)
quality -= Math.round(6 * historyReliability);

if (persistentBreadthWeakness)
quality -= Math.round(5 * historyReliability);

if (persistentParticipationWeakness)
quality -= Math.round(5 * historyReliability);

if (persistentRotationWeakness)
quality -= Math.round(5 * historyReliability);

if (persistentLiquidityWeakness)
quality -= Math.round(4 * historyReliability);

if (persistentFragility)
quality -= Math.round(5 * historyReliability);

if (prolongedBearRegimeRaw)
quality -= Math.round(5 * historyReliability);

if (weightedInstitutionalPressure > 60)
quality -= Math.round(4 * historyReliability);

if (participationDecayHistory > 20)
quality -= Math.round(4 * historyReliability);

if (breadthTrend < -1)
quality -= Math.round(3 * historyReliability);

if (breadthAcceleration < -1)
quality -= Math.round(3 * historyReliability);

if (relativeBreadthWeakness > 10)
quality -= Math.round(3 * historyReliability);

if (acceleratingWeaknessRaw)
quality -= Math.round(5 * historyReliability);


if (rotationDecayScore > 60) {
quality -= 10;
}
else if (rotationDecayScore > 40) {
quality -= 5;
}


quality = clamp(quality, 0, 100);


/* =====================================================
SUSTAINABILITY
===================================================== */

let sustainability = 55;


if (healthyBreadth) sustainability += 10;

if (strongBreadth) sustainability += 8;

if (healthyInternals) sustainability += 8;

if (participationScore > 55) sustainability += 6;

if (gamma > 0) sustainability += 5;

if (liquidityScore > 65) sustainability += 5;

if (calmVolatility) sustainability += 4;


if (weakBreadth) sustainability -= 8;

if (severelyWeakBreadth) sustainability -= 8;

if (weakInternals) sustainability -= 8;

if (narrowLeadership) sustainability -= 4;

if (severeNarrowLeadership) sustainability -= 8;

if (megaCapDistortion) sustainability -= 8;

if (participationScore < 45) sustainability -= 8;

if (liquidityScore < 40) sustainability -= 6;

if (rotationDecayScore > 60) sustainability -= 12;


if (persistentDistributionHistory)
sustainability -= Math.round(6 * historyReliability);

if (persistentBreadthWeakness)
sustainability -= Math.round(5 * historyReliability);

if (persistentParticipationWeakness)
sustainability -= Math.round(5 * historyReliability);

if (persistentRotationWeakness)
sustainability -= Math.round(5 * historyReliability);

if (persistentLiquidityWeakness)
sustainability -= Math.round(4 * historyReliability);

if (persistentFragility)
sustainability -= Math.round(5 * historyReliability);

if (prolongedBearRegimeRaw)
sustainability -= Math.round(5 * historyReliability);

if (participationDecayHistory > 20)
sustainability -= Math.round(4 * historyReliability);

if (breadthTrend < -1)
sustainability -= Math.round(3 * historyReliability);

if (breadthAcceleration < -1)
sustainability -= Math.round(3 * historyReliability);

if (acceleratingWeaknessRaw)
sustainability -= Math.round(6 * historyReliability);


sustainability =
clamp(sustainability, 0, 100);


/* =====================================================
FALSE BREAK RISK
===================================================== */

let falseBreakRisk = 25;


if (narrowLeadership)
falseBreakRisk += 5;

if (severeNarrowLeadership)
falseBreakRisk += 8;

if (megaCapDistortion)
falseBreakRisk += 6;

if (weakBreadth)
falseBreakRisk += 6;

if (weakInternals)
falseBreakRisk += 6;

if (rotationDecayScore > 60)
falseBreakRisk += 10;

else if (rotationDecayScore > 40)
falseBreakRisk += 5;

if (crashProbability > 55)
falseBreakRisk += 10;

if (gamma < 0)
falseBreakRisk += 8;


if (persistentDistributionHistory)
falseBreakRisk += Math.round(
8 * historyReliability
);

if (persistentBreadthWeakness)
falseBreakRisk += Math.round(
5 * historyReliability
);

if (persistentParticipationWeakness)
falseBreakRisk += Math.round(
5 * historyReliability
);

if (persistentRotationWeakness)
falseBreakRisk += Math.round(
5 * historyReliability
);

if (prolongedBearRegimeRaw)
falseBreakRisk += Math.round(
6 * historyReliability
);

if (crashTrend > 5)
falseBreakRisk += Math.round(
4 * historyReliability
);

if (breadthAcceleration < -1)
falseBreakRisk += Math.round(
5 * historyReliability
);

if (acceleratingWeaknessRaw)
falseBreakRisk += Math.round(
6 * historyReliability
);


if (
healthyBreadth &&
healthyInternals &&
participationScore >= 55 &&
rotationScore >= 50
) {
falseBreakRisk -= 10;
}


falseBreakRisk =
clamp(falseBreakRisk, 0, 100);


/* =====================================================
RECOVERY QUALITY
===================================================== */

const recoveryBreadthScore =
breadth50 * 0.35 +
breadth200 * 0.20;

const recoveryInternalScore =
participationScore * 0.25 +
thrustScore * 0.10;

const recoveryRotationScore =
rotationScore * 0.10;


const recoveryScore =
clamp(
recoveryBreadthScore +
recoveryInternalScore +
recoveryRotationScore,
0,
100
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
DIRECTIONAL CONFIRMATION
===================================================== */

/*
* BULLISH CONFIRMATION
*/

const bullishConfirmed =
strongBreadth &&
healthyInternals &&
participationScore >= 60 &&
rotationScore >= 60 &&
quality >= 72 &&
sustainability >= 68 &&
falseBreakRisk < 40 &&
!narrowLeadership &&
rotationDecayScore < 40;


const bullishConfirming =
healthyBreadth &&
healthyInternals &&
participationScore >= 52 &&
quality >= 55 &&
falseBreakRisk < 60 &&
rotationDecayScore < 55 &&
!severeNarrowLeadership;


/*
* BEARISH CONFIRMATION
*
* Wichtig:
*
* Ein bearishes Setup darf bestätigt sein,
* ohne dass wir einen Crash brauchen.
*
* Das passt zu deinem Ansatz:
*
* PHASE 3 / PHASE 4
* Distribution
* Defensive Build
* Put-Aufbau
*/

const bearishConfirmed =
bearishStructureSignals >= 5 &&
(
weakBreadth ||
weakInternals
) &&
(
participationScore < 55 ||
liquidityScore < 50
) &&
(
fragilityScore >= 65 ||
rotationDecayScore >= 50
);


const bearishConfirming =
bearishStructureSignals >= 3 &&
(
weakBreadth ||
weakInternals ||
rotationDecayScore >= 45
);


/*
* HARD BREAKDOWN
*
* Bleibt bewusst strenger als
* BEARISH_CONFIRMED.
*/

const hardBreakdown =
currentStructuralBreakdown ||
(
severelyWeakBreadth &&
weakInternals &&
participationScore < 45 &&
rotationScore < 30
);


/* =====================================================
STATE
===================================================== */

let state:
| "BULLISH_EARLY"
| "BULLISH_CONFIRMING"
| "BULLISH_CONFIRMED"
| "BEARISH_EARLY"
| "BEARISH_CONFIRMING"
| "BEARISH_CONFIRMED"
| "INTERNAL_BREAKDOWN";

let confidence = 45;

let direction:
| "BULLISH"
| "BEARISH"
| "NEUTRAL";


/* -----------------------------------------------------
HARD BREAKDOWN
----------------------------------------------------- */

if (hardBreakdown) {

state = "INTERNAL_BREAKDOWN";

direction = "BEARISH";

confidence = 88;

}


/* -----------------------------------------------------
BEARISH CONFIRMED
----------------------------------------------------- */

else if (bearishConfirmed) {

state = "BEARISH_CONFIRMED";

direction = "BEARISH";

confidence =
bearishStructureSignals >= 7
? 84
: 76;

}


/* -----------------------------------------------------
BULLISH CONFIRMED
----------------------------------------------------- */

else if (bullishConfirmed) {

state = "BULLISH_CONFIRMED";

direction = "BULLISH";

confidence = 82;

}


/* -----------------------------------------------------
BEARISH CONFIRMING
----------------------------------------------------- */

else if (bearishConfirming) {

state = "BEARISH_CONFIRMING";

direction = "BEARISH";

confidence =
bearishStructureSignals >= 5
? 68
: 62;

}


/* -----------------------------------------------------
BULLISH CONFIRMING
----------------------------------------------------- */

else if (bullishConfirming) {

state = "BULLISH_CONFIRMING";

direction = "BULLISH";

confidence = 65;

}


/* -----------------------------------------------------
BEARISH EARLY
----------------------------------------------------- */

else if (
structuralDeterioration ||
bearishStructureSignals >= 2
) {

state = "BEARISH_EARLY";

direction = "BEARISH";

confidence = 48;

}


/* -----------------------------------------------------
BULLISH EARLY
----------------------------------------------------- */

else {

state = "BULLISH_EARLY";

direction = "NEUTRAL";

confidence = 45;

}


/* =====================================================
RECOVERY OVERRIDE
===================================================== */

/*
* Eine echte breite Recovery darf einen alten,
* schwachen bearishen Kontext überwinden.
*
* Aber keinen echten aktuellen Breakdown.
*/

if (
rotationRecovery &&
quality >= 60 &&
sustainability >= 60 &&
falseBreakRisk < 50 &&
!hardBreakdown &&
!bearishConfirmed
) {

state = "BULLISH_CONFIRMING";

direction = "BULLISH";

confidence =
Math.max(confidence, 68);

}


/* =====================================================
CONFIRMATION SEMANTICS
===================================================== */

/*
* Das ist der entscheidende Output für andere Engines.
*
* confirmed bedeutet NICHT mehr:
*
* "bullish confirmed"
*
* Sondern:
*
* "die aktuelle Marktrichtung ist bestätigt"
*/

const confirmed =
state === "BULLISH_CONFIRMED" ||
state === "BEARISH_CONFIRMED" ||
state === "INTERNAL_BREAKDOWN";


const confirming =
state === "BULLISH_CONFIRMING" ||
state === "BEARISH_CONFIRMING";


/* =====================================================
SUMMARY
===================================================== */

let summary = "";


if (
state === "BULLISH_EARLY"
) {

summary =
"No broad directional confirmation yet";

}


if (
state === "BULLISH_CONFIRMING"
) {

summary =
"Bullish rotation improving with partial internal confirmation";

}


if (
state === "BULLISH_CONFIRMED"
) {

summary =
"Broad institutional bullish rotation confirmed";

}


if (
state === "BEARISH_EARLY"
) {

summary =
"Early internal deterioration detected";

}


if (
state === "BEARISH_CONFIRMING"
) {

summary =
"Bearish internal deterioration is building";

}


if (
state === "BEARISH_CONFIRMED"
) {

summary =
"Broad institutional bearish deterioration confirmed";

}


if (
state === "INTERNAL_BREAKDOWN"
) {

summary =
"Current internal structure shows severe breakdown risk";

}


if (narrowLeadership) {
summary += " | Narrow leadership";
}

if (megaCapDistortion) {
summary += " | Mega-cap distortion";
}

if (rotationDecayScore >= 50) {
summary += " | Rotation decay";
}

if (persistentDistributionHistory) {
summary += " | Historical distribution context";
}

if (persistentBreadthWeakness) {
summary += " | Historical breadth weakness";
}

if (persistentParticipationWeakness) {
summary += " | Historical participation weakness";
}

if (persistentLiquidityWeakness) {
summary += " | Historical liquidity weakness";
}

if (persistentFragility) {
summary += " | Historical fragility";
}

if (acceleratingWeaknessRaw) {
summary += " | Historical accelerating weakness";
}

if (rotationRecovery) {
summary += " | Broad recovery attempt";
}


/* =====================================================
RETURN
===================================================== */

return {

state,

direction,

confirmed,

confirming,

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

bearishStructureSignals,

bearishConfirmed,

bearishConfirming,

bullishConfirmed,

bullishConfirming,

summary,


metrics: {

/* -------------------------------------------------
CURRENT ROTATION
------------------------------------------------- */

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


/* -------------------------------------------------
CURRENT FLAGS
------------------------------------------------- */

healthyBreadth,

strongBreadth,

weakBreadth,

severelyWeakBreadth,

healthyInternals,

weakInternals,

neutralInternals,

narrowLeadership,

severeNarrowLeadership,

megaCapDistortion,

internalBreakdown,

currentStructuralBreakdown,

structuralDeterioration,


/* -------------------------------------------------
DIRECTIONAL FLAGS
------------------------------------------------- */

bearishBreadth,

bearishParticipation,

bearishLiquidity,

elevatedFragility,

severeFragility,

elevatedDecay,

severeDecay,

bearishStructureSignals,

bearishConfirmed,

bearishConfirming,

bullishConfirmed,

bullishConfirming,

direction,

confirmed,

confirming,


/* -------------------------------------------------
RECOVERY
------------------------------------------------- */

rotationRecovery,

recoveryScore,


/* -------------------------------------------------
HISTORY RELIABILITY
------------------------------------------------- */

historyReliability,


/* -------------------------------------------------
RAW HISTORY
------------------------------------------------- */

breadthTrend,

breadthAcceleration,

participationTrend:
participationTrendHistory,

participationDecay:
participationDecayHistory,

leadershipDecay:
leadershipDecayHistory,

rotationTrend,

liquidityTrend,

fragilityTrend,

crashTrend,

phasePersistence,

relativeBreadthWeakness,

institutionalPressure:
institutionalPressureRaw,

daysInPhase,

breadthWeakDays,

participationWeakDays,

rotationWeakDays,

liquidityWeakDays,

fragilityHighDays,

distributionDays,


/* -------------------------------------------------
WEIGHTED HISTORY
------------------------------------------------- */

weightedBreadthWeakDays,

weightedParticipationWeakDays,

weightedRotationWeakDays,

weightedLiquidityWeakDays,

weightedFragilityHighDays,

weightedDistributionDays,

weightedPhasePersistence,

weightedInstitutionalPressure,


/* -------------------------------------------------
HISTORY FLAGS
------------------------------------------------- */

persistentBreadthWeakness,

persistentParticipationWeakness,

persistentRotationWeakness,

persistentLiquidityWeakness,

persistentFragility,

persistentDistributionHistory,

prolongedBearRegime:
prolongedBearRegimeRaw,

acceleratingWeakness:
acceleratingWeaknessRaw,


/* -------------------------------------------------
ARCHITECTURE
------------------------------------------------- */

currentStructurePriority:
true,

historyIsContextOnlyForBreakdown:
true,

directionalConfirmation:
true

}

};

}


/* ============================================================
HELPERS
============================================================ */

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


function clamp(
value: number,
min: number,
max: number
): number {

return Math.max(
min,
Math.min(
max,
Math.round(value)
)
);

}
