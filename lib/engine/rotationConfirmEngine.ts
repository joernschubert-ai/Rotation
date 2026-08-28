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
Number(
crash?.score ?? 0
);

const crashProbability =
Number(
crash?.probability ?? 0
);

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
liquidity?.score ?? 50
);

const fragilityScore =
Number(
fragility?.score ?? 50
);

const participationScore =
Number(
participation?.score ?? 50
);

const thrustScore =
Number(
breadthThrust?.score ?? 50
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

/*
* IMPORTANT:
*
* Die History kann aus einer Phase stammen, in der einzelne
* Engines noch nicht korrekt kalibriert waren.
*
* Deshalb wird historische Information NICHT mehr als
* absolute Wahrheit behandelt.
*
* Aktuelle Marktstruktur besitzt Priorität.
*
* Die History dient vor allem:
*
* - Persistenz
* - Richtung
* - strukturellem Kontext
* - längerfristiger Warnung
*
* und nicht als alleiniger Trigger für einen Breakdown.
*/


/* -----------------------------------------------------
HISTORY RELIABILITY
----------------------------------------------------- */

/*
* Übergangsparameter.
*
* 1.00 = vollständiges Vertrauen
* 0.75 = hohes Vertrauen
* 0.55 = vorsichtiges Übergangsvertrauen
* 0.25 = sehr geringe historische Aussagekraft
* 0.00 = History ignorieren
*
* Da die History seit Juli teilweise mit noch nicht
* vollständig kalibrierten Engines erzeugt wurde,
* verwenden wir aktuell bewusst 0.55.
*
* Dieser Wert kann später erhöht werden, wenn die
* Engine über längere Zeit stabil läuft.
*/

const historyReliability =
0.55;


/* -----------------------------------------------------
RAW HISTORY
----------------------------------------------------- */

const breadthTrend =
Number(
historyMetrics?.breadthTrend ?? 0
);

const breadthAcceleration =
Number(
historyMetrics?.breadthAcceleration ?? 0
);

const participationTrendHistory =
Number(
historyMetrics?.participationTrend ?? 0
);

const participationDecayHistory =
Number(
historyMetrics?.participationDecay ?? 0
);

const leadershipDecayHistory =
Number(
historyMetrics?.leadershipDecay ?? 0
);

const rotationTrend =
Number(
historyMetrics?.rotationTrend ?? 0
);

const liquidityTrend =
Number(
historyMetrics?.liquidityTrend ?? 0
);

const fragilityTrend =
Number(
historyMetrics?.fragilityTrend ?? 0
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

const institutionalPressureRaw =
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

const prolongedBearRegimeRaw =
Boolean(
historyMetrics?.prolongedBearRegime
);

const persistentDistributionRaw =
Boolean(
historyMetrics?.persistentDistribution
);

const acceleratingWeaknessRaw =
Boolean(
historyMetrics?.acceleratingWeakness
);


/* =====================================================
HISTORY-DERIVED STRUCTURAL FLAGS
===================================================== */

/*
* Diese Flags bleiben zunächst RAW.
*
* Sie werden später nicht blind als Boolean-Trigger
* verwendet, sondern über die History-Reliability
* gewichtet.
*/

const persistentBreadthWeaknessRaw =
breadthWeakDays >= 20;

const persistentParticipationWeaknessRaw =
participationWeakDays >= 20;

const persistentRotationWeaknessRaw =
rotationWeakDays >= 30;

const persistentLiquidityWeaknessRaw =
liquidityWeakDays >= 30;

const persistentFragilityRaw =
fragilityHighDays >= 30;

const persistentDistributionHistoryRaw =
distributionDays >= 20 ||
persistentDistributionRaw;


/* =====================================================
WEIGHTED HISTORY
===================================================== */

/*
* Historische Zähler werden auf eine Vertrauensbasis
* reduziert.
*
* Beispiel:
*
* 120 Rotation Weak Days
*
* werden bei Reliability 0.55 zu:
*
* 66 gewichteten Tagen.
*
* Wichtig:
* Die RAW-Werte bleiben erhalten und werden im Debug
* weiterhin ausgegeben.
*/

const weightedBreadthWeakDays =
breadthWeakDays *
historyReliability;

const weightedParticipationWeakDays =
participationWeakDays *
historyReliability;

const weightedRotationWeakDays =
rotationWeakDays *
historyReliability;

const weightedLiquidityWeakDays =
liquidityWeakDays *
historyReliability;

const weightedFragilityHighDays =
fragilityHighDays *
historyReliability;

const weightedDistributionDays =
distributionDays *
historyReliability;

const weightedPhasePersistence =
phasePersistence *
historyReliability;

const weightedInstitutionalPressure =
institutionalPressureRaw *
historyReliability;


/* =====================================================
WEIGHTED STRUCTURAL FLAGS
===================================================== */

/*
* Wichtig:
*
* Diese Flags dürfen nicht einfach wieder auf den
* ursprünglichen RAW-Werten basieren.
*
* Sonst wäre die Reliability-Schicht wirkungslos.
*/

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
FLAGS
===================================================== */

/*
* Breadth:
*
* >70 / >60 = strong
* >58 / >52 = healthy
* <50 = weak
* <42 / <45 = severe
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


/* -----------------------------------------------------
INTERNALS
----------------------------------------------------- */

const healthyInternals =
ad > 0 &&
highs > lows;

const weakInternals =
ad < 0 ||
lows > highs;

const neutralInternals =
ad === 0 &&
highs === lows;


/* -----------------------------------------------------
VOLATILITY
----------------------------------------------------- */

const calmVolatility =
vix < 20;


/* -----------------------------------------------------
NARROW LEADERSHIP
----------------------------------------------------- */

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

/*
* Diese Flags beziehen sich ausschließlich auf den
* aktuellen Snapshot.
*
* Sie werden NICHT durch die History abgeschwächt.
*/

const internalBreakdown =
weakBreadth &&
weakInternals;


/*
* Aktueller harter Breakdown:
*
* Die Kombination aus sehr hoher Fragility,
* Liquiditätsstress, schwacher Participation und
* sehr schwacher Rotation kann einen Breakdown auch
* ohne historische Bestätigung auslösen.
*
* Dadurch bleibt die Engine auch dann handlungsfähig,
* wenn die History noch unzuverlässig ist.
*/

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
QUALITY
===================================================== */

/*
* Quality beantwortet:
*
* "Wie gesund ist die Rotation?"
*
* Nicht:
*
* "Ist der Markt bullish oder bearish?"
*/

let quality =
55;


/* -----------------------------------------------------
POSITIVE CURRENT STRUCTURE
----------------------------------------------------- */

if (
healthyBreadth
) {
quality += 10;
}

if (
strongBreadth
) {
quality += 10;
}

if (
healthyInternals
) {
quality += 8;
}

if (
participationScore > 55
) {
quality += 6;
}

if (
thrustScore > 60
) {
quality += 5;
}

if (
liquidityScore > 65
) {
quality += 5;
}

if (
gamma > 0
) {
quality += 4;
}

if (
calmVolatility
) {
quality += 4;
}


/* -----------------------------------------------------
NEGATIVE CURRENT STRUCTURE
----------------------------------------------------- */

if (
weakBreadth
) {
quality -= 8;
}

if (
severelyWeakBreadth
) {
quality -= 8;
}

if (
weakInternals
) {
quality -= 8;
}

if (
narrowLeadership
) {
quality -= 4;
}

if (
severeNarrowLeadership
) {
quality -= 8;
}

if (
megaCapDistortion
) {
quality -= 8;
}

if (
participationScore < 45
) {
quality -= 8;
}

if (
liquidityScore < 40
) {
quality -= 6;
}

if (
fragilityScore > 75
) {
quality -= 8;
}

if (
crashProbability > 55
) {
quality -= 10;
}

if (
early
) {
quality -= 4;
}


/* -----------------------------------------------------
HISTORICAL CONTEXT
----------------------------------------------------- */

/*
* Historische Informationen wirken nur mit der
* Reliability.
*
* Dadurch kann die History Quality verschlechtern,
* aber nicht mehr ungebremst zerstören.
*/

if (
weightedPhasePersistence >= 20
) {
quality -= 2;
}

if (
weightedPhasePersistence >= 40
) {
quality -= 3;
}

if (
persistentDistributionHistory
) {
quality -=
Math.round(
6 * historyReliability
);
}

if (
persistentBreadthWeakness
) {
quality -=
Math.round(
5 * historyReliability
);
}

if (
persistentParticipationWeakness
) {
quality -=
Math.round(
5 * historyReliability
);
}

if (
persistentRotationWeakness
) {
quality -=
Math.round(
5 * historyReliability
);
}

if (
persistentLiquidityWeakness
) {
quality -=
Math.round(
4 * historyReliability
);
}

if (
persistentFragility
) {
quality -=
Math.round(
5 * historyReliability
);
}

if (
prolongedBearRegimeRaw
) {
quality -=
Math.round(
5 * historyReliability
);
}

if (
weightedInstitutionalPressure > 60
) {
quality -=
Math.round(
4 * historyReliability
);
}

if (
participationDecayHistory > 20
) {
quality -=
Math.round(
4 * historyReliability
);
}

if (
breadthTrend < -1
) {
quality -=
Math.round(
3 * historyReliability
);
}

if (
breadthAcceleration < -1
) {
quality -=
Math.round(
3 * historyReliability
);
}

if (
relativeBreadthWeakness > 10
) {
quality -=
Math.round(
3 * historyReliability
);
}

if (
acceleratingWeaknessRaw
) {
quality -=
Math.round(
5 * historyReliability
);
}


/* -----------------------------------------------------
CURRENT ROTATION DECAY
----------------------------------------------------- */

/*
* RotationDecay ist ein aktueller Engine-Wert und wird
* deshalb NICHT über die History-Reliability reduziert.
*/

if (
rotationDecayScore > 60
) {

quality -= 10;

}

else if (
rotationDecayScore > 40
) {

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

let sustainability =
55;


/* -----------------------------------------------------
POSITIVE
----------------------------------------------------- */

if (
healthyBreadth
) {
sustainability += 10;
}

if (
strongBreadth
) {
sustainability += 8;
}

if (
healthyInternals
) {
sustainability += 8;
}

if (
participationScore > 55
) {
sustainability += 6;
}

if (
gamma > 0
) {
sustainability += 5;
}

if (
liquidityScore > 65
) {
sustainability += 5;
}

if (
calmVolatility
) {
sustainability += 4;
}


/* -----------------------------------------------------
NEGATIVE CURRENT
----------------------------------------------------- */

if (
weakBreadth
) {
sustainability -= 8;
}

if (
severelyWeakBreadth
) {
sustainability -= 8;
}

if (
weakInternals
) {
sustainability -= 8;
}

if (
narrowLeadership
) {
sustainability -= 4;
}

if (
severeNarrowLeadership
) {
sustainability -= 8;
}

if (
megaCapDistortion
) {
sustainability -= 8;
}

if (
participationScore < 45
) {
sustainability -= 8;
}

if (
liquidityScore < 40
) {
sustainability -= 6;
}

if (
rotationDecayScore > 60
) {
sustainability -= 12;
}


/* -----------------------------------------------------
HISTORICAL
----------------------------------------------------- */

if (
persistentDistributionHistory
) {
sustainability -=
Math.round(
6 * historyReliability
);
}

if (
persistentBreadthWeakness
) {
sustainability -=
Math.round(
5 * historyReliability
);
}

if (
persistentParticipationWeakness
) {
sustainability -=
Math.round(
5 * historyReliability
);
}

if (
persistentRotationWeakness
) {
sustainability -=
Math.round(
5 * historyReliability
);
}

if (
persistentLiquidityWeakness
) {
sustainability -=
Math.round(
4 * historyReliability
);
}

if (
persistentFragility
) {
sustainability -=
Math.round(
5 * historyReliability
);
}

if (
prolongedBearRegimeRaw
) {
sustainability -=
Math.round(
5 * historyReliability
);
}

if (
participationDecayHistory > 20
) {
sustainability -=
Math.round(
4 * historyReliability
);
}

if (
breadthTrend < -1
) {
sustainability -=
Math.round(
3 * historyReliability
);
}

if (
breadthAcceleration < -1
) {
sustainability -=
Math.round(
3 * historyReliability
);
}

if (
acceleratingWeaknessRaw
) {
sustainability -=
Math.round(
6 * historyReliability
);
}

if (
weightedInstitutionalPressure >= 80
) {
sustainability -=
Math.round(
5 * historyReliability
);
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
* FalseBreakRisk bleibt überwiegend ein aktuelles
* Signal.
*
* Historische Werte werden nur gedämpft berücksichtigt.
*/

let falseBreakRisk =
25;


if (
narrowLeadership
) {
falseBreakRisk += 5;
}

if (
severeNarrowLeadership
) {
falseBreakRisk += 8;
}

if (
megaCapDistortion
) {
falseBreakRisk += 6;
}

if (
weakBreadth
) {
falseBreakRisk += 6;
}

if (
weakInternals
) {
falseBreakRisk += 6;
}

if (
rotationDecayScore > 60
) {
falseBreakRisk += 10;
}

else if (
rotationDecayScore > 40
) {
falseBreakRisk += 5;
}

if (
crashProbability > 55
) {
falseBreakRisk += 10;
}

if (
gamma < 0
) {
falseBreakRisk += 8;
}


/* -----------------------------------------------------
HISTORICAL FALSE-BREAK CONTEXT
----------------------------------------------------- */

if (
persistentDistributionHistory
) {
falseBreakRisk +=
Math.round(
8 * historyReliability
);
}

if (
persistentBreadthWeakness
) {
falseBreakRisk +=
Math.round(
5 * historyReliability
);
}

if (
persistentParticipationWeakness
) {
falseBreakRisk +=
Math.round(
5 * historyReliability
);
}

if (
persistentRotationWeakness
) {
falseBreakRisk +=
Math.round(
5 * historyReliability
);
}

if (
prolongedBearRegimeRaw
) {
falseBreakRisk +=
Math.round(
6 * historyReliability
);
}

if (
crashTrend > 5
) {
falseBreakRisk +=
Math.round(
4 * historyReliability
);
}

if (
breadthAcceleration < -1
) {
falseBreakRisk +=
Math.round(
5 * historyReliability
);
}

if (
acceleratingWeaknessRaw
) {
falseBreakRisk +=
Math.round(
6 * historyReliability
);
}

if (
weightedInstitutionalPressure >= 80
) {
falseBreakRisk +=
Math.round(
5 * historyReliability
);
}


/* -----------------------------------------------------
POSITIVE CURRENT CONFIRMATION
----------------------------------------------------- */

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
* Recovery muss breit sein.
*
* Die Recovery-Berechnung verwendet bewusst primär
* CURRENT DATA.
*
* Alte History darf eine Erholung nicht künstlich
* verhindern.
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
CURRENT DISTRIBUTION
===================================================== */

/*
* Aktuelle Distribution muss unabhängig von der alten
* History sichtbar bleiben.
*/

const currentDistribution =
rotationDecayScore >= 50 ||
participationScore < 45 ||
liquidityScore < 40 ||
fragilityScore > 75;


/* =====================================================
HISTORY DISTRIBUTION CONFIDENCE
===================================================== */

/*
* Die History kann weiterhin anzeigen:
*
* "Da war über längere Zeit Distribution."
*
* Aber daraus wird nicht mehr automatisch:
*
* "Der Markt befindet sich heute definitiv im Breakdown."
*/

const historicalDistributionConfidence =
clamp(
weightedDistributionDays * 3,
0,
60
);


/* =====================================================
STATE
===================================================== */

let state =
"EARLY";

let confidence =
45;


/* =====================================================
HARD CURRENT BREAKDOWN
===================================================== */

/*
* Aktuelle Marktstruktur hat Vorrang.
*
* Wenn Fragility, Liquidity, Participation und Rotation
* gleichzeitig extrem schlecht sind, darf die Engine
* unabhängig von der History INTERNAL_BREAKDOWN melden.
*/

if (
currentStructuralBreakdown
) {

state =
"INTERNAL_BREAKDOWN";

confidence =
78;

}


/* =====================================================
HISTORICAL + CURRENT BREAKDOWN
===================================================== */

/*
* Historische Distribution darf einen Breakdown
* verstärken, aber nur wenn CURRENT STRUCTURE ebenfalls
* schwach ist.
*
* Wichtig:
*
* persistentDistributionHistory allein reicht NICHT.
*/

else if (
persistentDistributionHistory &&
participationScore < 50 &&
liquidityScore < 40 &&
rotationScore < 35 &&
fragilityScore > 70
) {

state =
"INTERNAL_BREAKDOWN";

confidence =
70;

}


/* =====================================================
STRONG CURRENT INTERNAL BREAKDOWN
===================================================== */

/*
* Auch ohne historische Bestätigung:
*
* sehr schwache Breadth
* + negative Internals
* + schwache Participation
* + schlechte Rotation
*/

else if (
severelyWeakBreadth &&
weakInternals &&
participationScore < 45 &&
rotationScore < 30
) {

state =
"INTERNAL_BREAKDOWN";

confidence =
74;

}


/* =====================================================
CONFIRMED
===================================================== */

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


/* =====================================================
CONFIRMING
===================================================== */

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


/* =====================================================
EARLY
===================================================== */

else {

state =
"EARLY";

confidence =
45;

}


/* =====================================================
RECOVERY OVERRIDE
===================================================== */

/*
* Eine echte breite Erholung darf einen alten EARLY /
* stale breakdown Zustand überwinden.
*
* Sie darf jedoch keinen aktuell extremen Breakdown
* überschreiben.
*/

if (
rotationRecovery &&
quality >= 60 &&
sustainability >= 60 &&
falseBreakRisk < 50 &&
!currentStructuralBreakdown
) {

state =
"CONFIRMING";

confidence =
Math.max(
confidence,
68
);

}


/* =====================================================
HISTORICAL OVERRIDE BLOCK
===================================================== */

/*
* WICHTIG:
*
* Alte History darf jetzt NICHT mehr allein einen
* INTERNAL_BREAKDOWN erzwingen.
*
* Wir verwenden sie lediglich als Kontext.
*
* Dadurch verschwindet genau das bisherige Problem:
*
* distributionDays = 118
* institutionalPressure = 100
*
* => nicht mehr automatisch INTERNAL_BREAKDOWN.
*/


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
"Current internal structure shows meaningful breakdown risk";

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
currentDistribution
) {

summary +=
" | Current distribution pressure";

}


if (
persistentDistributionHistory
) {

summary +=
" | Historical distribution context";

}


if (
prolongedBearRegimeRaw
) {

summary +=
" | Historical prolonged bearish context";

}


if (
persistentBreadthWeakness
) {

summary +=
" | Historical breadth weakness";

}


if (
persistentParticipationWeakness
) {

summary +=
" | Historical participation weakness";

}


if (
persistentRotationWeakness
) {

summary +=
" | Historical rotation weakness";

}


if (
persistentLiquidityWeakness
) {

summary +=
" | Historical liquidity weakness";

}


if (
persistentFragility
) {

summary +=
" | Historical fragility";

}


if (
acceleratingWeaknessRaw
) {

summary +=
" | Historical accelerating weakness";

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

/* -------------------------------------------------
* CURRENT ROTATION
* ------------------------------------------------- */

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
* CURRENT FLAGS
* ------------------------------------------------- */

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

currentDistribution,

rotationRecovery,
recoveryScore,


/* -------------------------------------------------
* HISTORY RELIABILITY
* ------------------------------------------------- */

historyReliability,

historicalDistributionConfidence,


/* -------------------------------------------------
* RAW HISTORY
* ------------------------------------------------- */

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

persistentBreadthWeaknessRaw,
persistentParticipationWeaknessRaw,
persistentRotationWeaknessRaw,
persistentLiquidityWeaknessRaw,
persistentFragilityRaw,
persistentDistributionHistoryRaw,

prolongedBearRegimeRaw,
persistentDistributionRaw,
acceleratingWeaknessRaw,


/* -------------------------------------------------
* WEIGHTED HISTORY
* ------------------------------------------------- */

weightedBreadthWeakDays,
weightedParticipationWeakDays,
weightedRotationWeakDays,
weightedLiquidityWeakDays,
weightedFragilityHighDays,
weightedDistributionDays,

weightedPhasePersistence,

weightedInstitutionalPressure,

persistentBreadthWeakness,
persistentParticipationWeakness,
persistentRotationWeakness,
persistentLiquidityWeakness,
persistentFragility,
persistentDistributionHistory,


/* -------------------------------------------------
* HISTORY FLAGS
* ------------------------------------------------- */

prolongedBearRegime:
prolongedBearRegimeRaw,

acceleratingWeakness:
acceleratingWeaknessRaw,


/* -------------------------------------------------
* CURRENT / HISTORY DISTINCTION
* ------------------------------------------------- */

currentStructurePriority:
true,

historyIsContextOnlyForBreakdown:
true

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


/* ============================================================
CLAMP
============================================================ */

function clamp(
value: number,
min: number,
max: number
): number {

return Math.max(
min,
Math.min(
max,
value
)
);

}
