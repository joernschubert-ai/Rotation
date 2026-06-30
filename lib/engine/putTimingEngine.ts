// /lib/engine/putTimingEngine.ts

export function putTimingEngine(engine: any) {

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
regimePersistence
} = engine;

const historyMetrics =
engine.historyMetrics ?? {};

/* =====================================================
INPUT NORMALIZATION
===================================================== */

const rsSmall =
Number(rotation?.rsSmall ?? 1);

const rsEqual =
Number(rotation?.rsEqual ?? 1);

const rsGrowth =
Number(rotation?.rsGrowth ?? 1);

const decay =
Number(
rotationDecay?.score ?? 0
);

const decayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";

const participationScore =
Number(
participation?.score ?? 50
);

const crashProbability =
Number(
crash?.probability ?? 0
);

const liquidityScore =
Number(
liquidity?.score ?? 50
);

const dangerScore =
Number(
dangerZone?.score ?? 0
);

const breadthThrustScore =
Number(
breadthThrust?.score ??
breadthThrust?.strength ??
50
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

const regimeAligned =
Boolean(
regimeSync?.aligned ?? false
);

const marketQualityScore =
Number(
marketQuality?.score ?? 50
);

const syntheticStrength =
Boolean(
marketQuality?.syntheticStrength ??
false
);

const unhealthyLiquidity =
Boolean(
marketQuality?.unhealthyLiquidity ??
false
);

const liquidityTrap =
Boolean(
marketQuality?.liquidityTrap ??
false
);

const breadthVelocityScore =
Number(
breadthVelocity?.score ?? 50
);

const breadthVelocityDelta =
Number(
breadthVelocity?.delta ?? 0
);

const breadthVelocityNegative =
breadthVelocityDelta < 0;

const bearishPersistence =
Boolean(
regimePersistence?.bearishPersistence ??
false
);

const persistenceScore =
Number(
regimePersistence?.score ?? 50
);

const persistentWeakness =

bearishPersistence &&
persistenceScore >= 60;

/* =====================================================
HISTORY METRICS
===================================================== */

const breadthTrend =
Number(historyMetrics?.breadthTrend ?? 0);

const breadthAcceleration =
Number(historyMetrics?.breadthAcceleration ?? 0);

const participationDecay =
Number(historyMetrics?.participationDecay ?? 0);

const leadershipDecay =
Number(historyMetrics?.leadershipDecay ?? 0);

const crashTrend =
Number(historyMetrics?.crashTrend ?? 0);

const phasePersistence =
Number(historyMetrics?.phasePersistence ?? 0);

const regimePersistenceHistory =
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

const deterioratingBreadth =
breadthTrend <= -2;

const acceleratingBreadthDecay =
breadthAcceleration <= -1;

const participationErosion =
participationDecay > 10;

const severeParticipationErosion =
participationDecay > 20;

const leadershipConcentration =
leadershipDecay <= -2;

const risingCrashRisk =
crashTrend >= 3;

const severeRisingCrashRisk =
crashTrend >= 6;

const prolongedDistribution =
phasePersistence >= 60;

const prolongedRegimeWeakness =
regimePersistenceHistory >= 60;

const severeRegimeWeakness =
regimePersistenceHistory >= 85;

const breadthStructureDamage =
relativeBreadthWeakness > 10;

const severeBreadthStructureDamage =
relativeBreadthWeakness > 20;

/* =====================================================
STRUCTURAL FLAGS
===================================================== */

const narrowLeadership =

rsGrowth > 1.03 &&
rsSmall < 0.995 &&
rsEqual < 0.995;

const structuralBreakdown =

decay > 85 &&
participationScore < 40 &&
breadthThrustScore < 35;

const internalDeterioration =

decay > 75 &&
participationScore < 45 &&
breadthVelocityScore < 40;

const syntheticLiquidityRegime =

syntheticStrength ||
unhealthyLiquidity ||
liquidityTrap;

const panicConfirmed =

crashProbability >= 45 &&
vix > 24 &&
dangerScore >= 40;

const volatilityExpansion =

vix > 24 ||
vixTerm < 0.9;

/* =====================================================
COMPONENTS
===================================================== */

let phaseScore = 0;
let rotationScore = 0;
let crashScore = 0;
let earlyScore = 0;
let decayScore = 0;

/*
NEU:
Structural Short
vs
Panic Short
*/

let structuralScore = 0;
let panicScore = 0;

let contradictionPenalty = 0;

/* =====================================================
PHASE
===================================================== */

if (phase === "PHASE_1_EXPANSION") phaseScore = 1;
if (phase === "PHASE_2_WARNING") phaseScore = 3;
if (phase === "PHASE_3_DISTRIBUTION") phaseScore = 5;
if (phase === "PHASE_4_RISK") phaseScore = 7;
if (phase === "PHASE_5_BREAKDOWN") phaseScore = 8;
if (phase === "PHASE_6_ACCELERATION") phaseScore = 7;
if (phase === "PHASE_7_CAPITULATION") phaseScore = 5;

/* =====================================================
ROTATION
===================================================== */

if (rsSmall < 0.99) rotationScore += 1;
if (rsSmall < 0.97) rotationScore += 2;
if (rsSmall < 0.95) rotationScore += 1;

if (rsEqual < 0.99) rotationScore += 1;

rotationScore =
Math.min(rotationScore, 4);

/* =====================================================
ROTATION DECAY
===================================================== */

if (decay > 45) decayScore += 1;
if (decay > 60) decayScore += 2;
if (decay > 75) decayScore += 1;

decayScore =
Math.min(decayScore, 4);

/* =====================================================
CRASH / PANIC
===================================================== */

if (crashProbability > 40) crashScore += 2;
if (crashProbability > 60) crashScore += 2;
if (crashProbability > 75) crashScore += 2;

crashScore =
Math.min(crashScore, 6);

/* =====================================================
EARLY WARNING
===================================================== */

if (earlyWarning?.active) {

earlyScore = 1;

if (
earlyWarning?.score?.value >= 4
) {
earlyScore = 2;
}

}

/* =====================================================
STRUCTURAL SHORT SCORE
===================================================== */

if (
decay > 60
) {
structuralScore += 2;
}

if (
decay > 80
) {
structuralScore += 2;
}

if (
participationScore < 45
) {
structuralScore += 1;
}

if (
participationScore < 38
) {
structuralScore += 1;
}

if (
breadthThrustScore < 40
) {
structuralScore += 1;
}

if (
breadthVelocityNegative
) {
structuralScore += 1;
}

if (
persistentWeakness
) {
structuralScore += 1;
}

if (
marketQualityScore < 45
) {
structuralScore += 1;
}

if (
syntheticLiquidityRegime
) {
structuralScore += 1;
}

if (
narrowLeadership
) {
structuralScore += 1;
}

if (
deterioratingBreadth
) {
structuralScore += 1;
}

if (
acceleratingBreadthDecay
) {
structuralScore += 1;
}

if (
participationErosion
) {
structuralScore += 1;
}

if (
severeParticipationErosion
) {
structuralScore += 1;
}

if (
leadershipConcentration
) {
structuralScore += 1;
}

if (
risingCrashRisk
) {
structuralScore += 1;
}

if (
severeRisingCrashRisk
) {
structuralScore += 1;
}

if (
prolongedDistribution
) {
structuralScore += 1;
}

if (
prolongedRegimeWeakness
) {
structuralScore += 1;
}

if (
severeRegimeWeakness
) {
structuralScore += 1;
}

if (
breadthStructureDamage
) {
structuralScore += 1;
}

if (
severeBreadthStructureDamage
) {
structuralScore += 1;
}

structuralScore =
Math.min(structuralScore, 10);

/* =====================================================
PANIC SCORE
===================================================== */

if (
vix > 24
) {
panicScore += 2;
}

if (
vix > 30
) {
panicScore += 2;
}

if (
dangerScore > 40
) {
panicScore += 2;
}

if (
dangerScore > 60
) {
panicScore += 2;
}

if (
gamma < 0
) {
panicScore += 1;
}

if (
vixTerm < 0.9
) {
panicScore += 1;
}

if (
credit > 1.05
) {
panicScore += 1;
}

panicScore =
Math.min(panicScore, 10);

/* =====================================================
NEW INSTITUTIONAL CONTRADICTION LOGIC
===================================================== */

/*
2025–2026:
Low VIX darf strukturelle Shorts
NICHT invalidieren.
*/

/* ================= LOW VIX ================= */

if (
vix < 20 &&
!internalDeterioration &&
!structuralBreakdown
) {
contradictionPenalty += 2;
}

if (
vix < 17 &&
!internalDeterioration
) {
contradictionPenalty += 1;
}

/* ================= LIQUIDITY SUPPORT ================= */

if (
liquidityScore > 55 &&
marketQualityScore > 55 &&
decay < 60
) {
contradictionPenalty += 2;
}

if (
liquidityScore > 70 &&
participationScore > 60 &&
!syntheticLiquidityRegime
) {
contradictionPenalty += 1;
}

/* ================= NO PANIC ================= */

if (
dangerScore < 35 &&
!structuralBreakdown
) {
contradictionPenalty += 2;
}

if (
dangerScore < 25 &&
!internalDeterioration
) {
contradictionPenalty += 1;
}

/* ================= GAMMA ================= */

if (
gamma >= 0 &&
!structuralBreakdown
) {
contradictionPenalty += 1;
}

/* ================= TERM STRUCTURE ================= */

if (
vixTerm > 0.90 &&
!panicConfirmed
) {
contradictionPenalty += 1;
}

/* ================= CREDIT ================= */

if (
credit < 1.0 &&
!panicConfirmed
) {
contradictionPenalty += 1;
}

/* ================= REGIME MISALIGNMENT ================= */

if (
!regimeAligned &&
!structuralBreakdown
) {
contradictionPenalty += 1;
}

/* =====================================================
INTERNAL OFFSET
===================================================== */

if (
participationErosion
) {
contradictionPenalty -= 1;
}

if (
acceleratingBreadthDecay
) {
contradictionPenalty -= 1;
}

if (
risingCrashRisk
) {
contradictionPenalty -= 1;
}

if (
prolongedDistribution
) {
contradictionPenalty -= 1;
}

if (
prolongedRegimeWeakness
) {
contradictionPenalty -= 1;
}

if (
breadthStructureDamage
) {
contradictionPenalty -= 1;
}

if (
participationScore < 40
) {
contradictionPenalty -= 1;
}

if (
decay > 85 &&
participationScore < 38
) {
contradictionPenalty -= 2;
}

if (
breadthThrustScore < 35
) {
contradictionPenalty -= 1;
}

if (
marketQualityScore < 40
) {
contradictionPenalty -= 1;
}

if (
syntheticLiquidityRegime
) {
contradictionPenalty -= 1;
}

contradictionPenalty =
Math.max(
0,
contradictionPenalty
);

/* =====================================================
TOTAL
===================================================== */

let totalScore =

phaseScore +
rotationScore +
crashScore +
earlyScore +
decayScore +
structuralScore +
panicScore -

contradictionPenalty;

totalScore = Math.max(
0,
Math.min(24, totalScore)
);

/* =====================================================
TIMING
===================================================== */

let timing = "WAIT";

if (totalScore >= 20) {
timing = "MAX";
}
else if (totalScore >= 16) {
timing = "STRONG";
}
else if (totalScore >= 11) {
timing = "BUILD";
}
else if (totalScore >= 7) {
timing = "EARLY";
}

/* =====================================================
STRUCTURAL OVERRIDE
===================================================== */

if (
structuralBreakdown &&
(
timing === "WAIT" ||
timing === "EARLY"
)
) {

timing = "BUILD";
}

/* =====================================================
DECISION TREE
===================================================== */

function getDecision() {

/* =====================================================
STRUCTURAL SHORT REGIME
===================================================== */

if (
structuralBreakdown
) {

if (
panicConfirmed
) {
return "PANIC_SHORT";
}

return "STRUCTURAL_BUILD";
}

/* =====================================================
INTERNAL DETERIORATION
===================================================== */

if (
internalDeterioration
) {

if (
panicConfirmed
) {
return "TRANSITIONAL_SHORT";
}

return "DEFENSIVE_BUILD";
}

/* =====================================================
PHASE 1
===================================================== */

if (phase === "PHASE_1_EXPANSION") {

if (
rotationScore >= 3 &&
earlyWarning?.active &&
decay >= 60
) {
return "DEFENSIVE_BUILD";
}

return "NO_TRADE";
}

/* =====================================================
PHASE 2
===================================================== */

if (phase === "PHASE_2_WARNING") {

if (
timing === "EARLY"
) {
return "DEFENSIVE_BUILD";
}

if (
timing === "BUILD"
) {
return "STRUCTURAL_BUILD";
}

return "NO_TRADE";
}

/* =====================================================
PHASE 3
===================================================== */

if (phase === "PHASE_3_DISTRIBUTION") {

if (
decay >= 60 &&
rotationScore >= 3 &&
earlyWarning?.active
) {
return "STRUCTURAL_BUILD";
}

if (
timing === "EARLY"
) {
return "DEFENSIVE_BUILD";
}

if (
timing === "BUILD"
) {
return "STRUCTURAL_BUILD";
}

if (
timing === "STRONG"
) {
return "TRANSITIONAL_SHORT";
}

return "NO_TRADE";
}

/* =====================================================
PHASE 4-5
===================================================== */

if (
phase === "PHASE_4_RISK" ||
phase === "PHASE_5_BREAKDOWN"
) {

if (
panicConfirmed
) {

if (
timing === "MAX" ||
timing === "STRONG"
) {
return "PANIC_SHORT";
}

return "TRANSITIONAL_SHORT";
}

if (
timing === "BUILD"
) {
return "STRUCTURAL_BUILD";
}

if (
timing === "STRONG"
) {
return "TRANSITIONAL_SHORT";
}

return "DEFENSIVE_BUILD";
}

/* =====================================================
PHASE 6-7
===================================================== */

if (
phase === "PHASE_6_ACCELERATION" ||
phase === "PHASE_7_CAPITULATION"
) {

if (
panicConfirmed
) {
return "PANIC_SHORT";
}

return "TRANSITIONAL_SHORT";
}

return "NO_TRADE";
}

const decision = getDecision();

/* =====================================================
EXECUTION PROFILE
===================================================== */

let execution =
"NONE";

if (
decision === "DEFENSIVE_BUILD"
) {
execution = "SMALL STARTER";
}

if (
decision === "STRUCTURAL_BUILD"
) {
execution = "PARTIAL SIZE";
}

if (
decision === "TRANSITIONAL_SHORT"
) {
execution = "PARTIAL SIZE";
}

if (
decision === "PANIC_SHORT"
) {

if (
timing === "MAX" &&
panicConfirmed
) {

execution = "FULL SIZE";

} else {

execution = "PARTIAL SIZE";
}
}

/* =====================================================
RETURN
===================================================== */

return {

decision,

timing,

execution,

score: {
value: totalScore,
max: 24
},

meta: {

contradictionPenalty,

panicConfirmed,

structuralBreakdown,

internalDeterioration,

syntheticLiquidityRegime,

liquidityStillSupportive:
liquidityScore > 55,

lowVolatility:
vix < 20,

regimeAligned,

volatilityExpansion,

institutionalState:

decision === "PANIC_SHORT"

? "PANIC_SHORT"

: (
decision === "TRANSITIONAL_SHORT"
)

? "TRANSITIONAL_SHORT"

: (
decision === "STRUCTURAL_BUILD"
)

? "STRUCTURAL_SHORT"

: "DEFENSIVE_SHORT"

},

historyState: {

breadthTrend,
breadthAcceleration,

participationDecay,
leadershipDecay,

crashTrend,

phasePersistence,

regimePersistence:
regimePersistenceHistory,

relativeBreadthWeakness,

prolongedRegimeWeakness,
severeRegimeWeakness,

breadthStructureDamage,
severeBreadthStructureDamage,

deterioratingBreadth,
acceleratingBreadthDecay,

participationErosion,
severeParticipationErosion,

leadershipConcentration,

risingCrashRisk,
severeRisingCrashRisk,

prolongedDistribution

},


components: {

phase: {
value: phaseScore,
max: 8
},

rotation: {
value: rotationScore,
max: 4
},

crash: {
value: crashScore,
max: 6
},

earlyWarning: {
value: earlyScore,
max: 2
},

decay: {
value: decayScore,
max: 4
},

structural: {
value: structuralScore,
max: 10
},

panic: {
value: panicScore,
max: 10
},

contradiction: {
value: contradictionPenalty,
max: 10
}

}

};

}
