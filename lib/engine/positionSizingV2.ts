// /lib/engine/positionSizingV2.ts

export function positionSizingV2(engine: any) {

/* ================= INPUT ================= */

const master = engine.master ?? {};
const crash = engine.crash ?? {};
const putTiming = engine.putTiming ?? {};
const russell = engine.russell ?? {};
const positioning = engine.positioning ?? {};
const systemHeat = engine.systemHeat ?? {};
const earlyWarning = engine.earlyWarning ?? {};
const rotation = engine.rotation ?? {};
const structure = engine.structure ?? {};
const edgeState = engine.edgeState ?? {};
const tradeStack = engine.tradeStack ?? {};
const divergence = engine.divergence ?? {};

/* 🔥 EXISTING */

const regimeSync = engine.regimeSync ?? {};
const dangerZone = engine.dangerZone ?? {};
const executionState = engine.executionState ?? {};

/* 🔥 NEW */

const liquidity = engine.liquidity ?? {};
const breadthThrust = engine.breadthThrust ?? {};
const fragility = engine.fragility ?? {};
const squeeze = engine.squeeze ?? {};
const participation = engine.participation ?? {};
const rotationDecay = engine.rotationDecay ?? {};
const breadthVelocity = engine.breadthVelocity ?? {};
const regimePersistence = engine.regimePersistence ?? {};
const marketQuality = engine.marketQuality ?? {};

/* ================= HISTORY ================= */

const phasePersistence =
Number(
engine.historyMetrics?.phasePersistence ?? 0
);

const participationDecay =
Number(
engine.historyMetrics?.participationDecay ?? 0
);

const breadthTrend =
Number(
engine.historyMetrics?.breadthTrend ?? 0
);

const breadthAcceleration =
Number(
engine.historyMetrics?.breadthAcceleration ?? 0
);

const leadershipDecay =
Number(
engine.historyMetrics?.leadershipDecay ?? 0
);

const relativeBreadthWeakness =
Number(
engine.historyMetrics?.relativeBreadthWeakness ?? 0
);

const regimePersistenceHistory =
Number(
engine.historyMetrics?.regimePersistence ?? 0
);

/* ================= BASE SIZE ================= */

let base = 40;

/* ================= EDGE ================= */

let edge = 0;

/* ================= FLAGS ================= */

const early =
earlyWarning?.active ?? false;

const breadth50 =
structure?.breadth?.b50?.value ?? 0;

const breadth200 =
structure?.breadth?.b200?.value ?? 0;

const extremeBreadth =
breadth50 > 90;

const strongBreadth =
breadth50 > 80 &&
breadth200 > 70;

const crashProb =
Number(crash?.probability ?? 0);

const rotationScore =
Number(rotation?.score ?? 0);

const russellDecision =
russell?.decision ?? "NONE";

/* ================= REGIME ================= */

const regimeAligned =
regimeSync?.aligned === true ||
regimeSync?.state === "ALIGNED";

const regimeSyncScore =
Number(regimeSync?.score ?? 50);

const dangerLevel =
dangerZone?.level ?? "NORMAL";

const dangerEscalation =
dangerZone?.escalation ?? false;

const executionMode =
executionState?.executionMode ?? "WAIT";

const riskState =
executionState?.riskState ?? "FRAGILE";

const tacticalBias =
executionState?.tacticalBias ?? "NEUTRAL";

/* ================= INTERNALS ================= */

const liquidityScore =
Number(liquidity?.score ?? 50);

const thrustActive =
breadthThrust?.active ?? false;

const thrustStrength =
Number(
breadthThrust?.strength ??
breadthThrust?.score ??
0
);

const fragilityScore =
Number(fragility?.score ?? 50);

const squeezeRisk =
Number(squeeze?.risk ?? 0);

const participationScore =
Number(participation?.score ?? 50);

const rotationDecayScore =
Number(rotationDecay?.score ?? 0);

const rotationDecayState =
rotationDecay?.state ??
"HEALTHY_ROTATION";

const breadthVelocityScore =
Number(
breadthVelocity?.score ?? 50
);

const breadthVelocityDelta =
Number(
breadthVelocity?.delta ?? 0
);

const breadthVelocityState =
breadthVelocity?.state ??
"STABLE";

const breadthVelocityNegative =
breadthVelocityDelta < 0;

const bearishPersistence =
regimePersistence?.bearishPersistence ??
false;

const persistenceScore =
Number(
regimePersistence?.score ?? 50
);

const persistentWeakness =
bearishPersistence &&
persistenceScore >= 60;

/* ================= MARKET QUALITY ================= */

const marketQualityScore =
Number(
marketQuality?.score ?? 50
);

const marketQualityState =
marketQuality?.state ??
"NEUTRAL";

const syntheticStrength =
marketQuality?.syntheticStrength ??
false;

const unhealthyLiquidity =
marketQuality?.unhealthyLiquidity ??
false;

const liquidityTrap =
marketQuality?.liquidityTrap ??
false;

const narrowLiquidity =
marketQuality?.narrowLiquidity ??
false;

const institutionalQuality =
Number(
marketQuality?.institutionalQuality ??
50
);

const participationQuality =
Number(
marketQuality?.participationQuality ??
50
);

/* ================= STRUCTURAL FLAGS ================= */

const poorMarketQuality =
marketQualityScore < 45;

const severeMarketQuality =
marketQualityScore < 35;

const narrowLeadership =

rotation?.rsGrowth > 1.03 &&
rotation?.rsSmall < 0.995 &&
rotation?.rsEqual < 0.995;

const syntheticLiquidityRegime =

(
syntheticStrength ||
unhealthyLiquidity ||
liquidityTrap ||
narrowLiquidity
);

const internalDeterioration =

rotationDecayScore > 75 &&
participationScore < 40 &&
breadthVelocityScore < 40;

const severeInternalBreakdown =

rotationDecayScore > 85 &&
participationScore < 40 &&
thrustStrength < 40;

const fragileExpansion =

narrowLeadership &&
poorMarketQuality;

const structurallyFragile =

(
internalDeterioration &&
poorMarketQuality
) ||

(
syntheticLiquidityRegime &&
persistentWeakness
) ||

(
breadthVelocityNegative &&
rotationDecayScore > 70
);

const deterioratingBreadthTrend =
breadthTrend < -10;

const acceleratingBreadthDamage =
breadthAcceleration < -5;

const severeBreadthDamage =
breadthAcceleration < -10;

const leadershipConcentration =
leadershipDecay > 10;

const severeLeadershipConcentration =
leadershipDecay > 20;

const persistentBreadthWeakness =
relativeBreadthWeakness > 15;

const chronicRegimeWeakness =
regimePersistenceHistory >= 10;

/* =====================================================
VALIDATED LIQUIDITY
===================================================== */

const healthyInternals =

participationScore > 60 &&
marketQualityScore > 60 &&
rotationDecayScore < 45 &&
!breadthVelocityNegative &&
!persistentWeakness;

const healthyLiquidity =

liquidityScore > 70 &&
healthyInternals &&
!syntheticLiquidityRegime;

/* =====================================================
VALIDATED THRUST
===================================================== */

const validatedThrust =

thrustActive &&
thrustStrength > 70 &&
participationScore > 60 &&
marketQualityScore > 60 &&
rotationDecayScore < 45 &&
!narrowLeadership &&
!syntheticLiquidityRegime;

/* =====================================================
POSITIVE EDGE
===================================================== */

if (
rotationScore > 60 &&
russellDecision === "BUILD"
) {
edge += 2;
}

if (
strongBreadth &&
crashProb < 20 &&
!early &&
healthyInternals
) {
edge += 1.5;
}

if (
regimeAligned &&
regimeSyncScore >= 70 &&
!persistentWeakness
) {
edge += 1.5;
}

if (
executionMode === "ADD_ON_PULLBACKS" &&
healthyInternals
) {
edge += 2;
}

if (
executionMode === "BUILD_POSITION" &&
healthyInternals
) {
edge += 1;
}

if (
tacticalBias === "LONG_SMALL_CAPS" &&
healthyInternals
) {
edge += 1;
}

if (
tacticalBias === "LONG_TECH" &&
!narrowLeadership &&
healthyInternals
) {
edge += 0.5;
}

/* ================= VALIDATED POSITIVE ================= */

if (
healthyLiquidity
) {
edge += 1;
}

if (
validatedThrust
) {
edge += 1.5;
}

if (
participationScore > 70 &&
marketQualityScore > 65
) {
edge += 1;
}

/* =====================================================
NEGATIVE EDGE
===================================================== */

if (
early &&
extremeBreadth
) {
edge -= 1.5;
}

if (
rotationScore < 40
) {
edge -= 1;
}

if (
crashProb > 40
) {
edge -= 2;
}

if (
!regimeAligned &&
regimeSyncScore < 45
) {
edge -= 1.5;
}

if (
dangerLevel === "HIGH"
) {
edge -= 2;
}

if (
dangerLevel === "EXTREME"
) {
edge -= 4;
}

if (
dangerEscalation
) {
edge -= 2;
}

if (
executionMode === "REDUCE_RISK"
) {
edge -= 2;
}

if (
executionMode === "DEFENSIVE"
) {
edge -= 4;
}

if (
riskState === "BREAKDOWN"
) {
edge -= 2;
}

if (
riskState === "CRISIS"
) {
edge -= 5;
}

/* ================= STRUCTURAL NEGATIVE ================= */

if (
liquidityScore < 40
) {
edge -= 1.5;
}

if (
fragilityScore > 70
) {
edge -= 3;
}
else if (
fragilityScore > 55
) {
edge -= 1.5;
}

if (
squeezeRisk > 70
) {
edge -= 2;
}

if (
participationScore < 40
) {
edge -= 1.5;
}

if (
poorMarketQuality
) {
edge -= 2;
}

if (
persistentWeakness
) {
edge -= 2;
}

if (
phasePersistence >= 10
) {
edge -= 1;
}

if (
participationDecay > 15
) {
edge -= 1;
}

if (
narrowLeadership
) {
edge -= 2;
}

if (
syntheticLiquidityRegime
) {
edge -= 2;
}

if (
breadthVelocityNegative
) {
edge -= 1.5;
}

if (
internalDeterioration
) {
edge -= 4;
}

if (
severeInternalBreakdown
) {
edge -= 5;
}

if (
deterioratingBreadthTrend
) {
edge -= 1;
}

if (
acceleratingBreadthDamage
) {
edge -= 1;
}

if (
severeBreadthDamage
) {
edge -= 1;
}

if (
leadershipConcentration
) {
edge -= 1;
}

if (
severeLeadershipConcentration
) {
edge -= 1;
}

if (
persistentBreadthWeakness
) {
edge -= 1;
}

if (
chronicRegimeWeakness
) {
edge -= 1;
}


/* =====================================================
DIVERGENCE
===================================================== */

if (
divergence?.state === "BEARISH_DIVERGENCE"
) {
edge -= 1;
}

if (
divergence?.state === "BULLISH_DIVERGENCE" &&
healthyInternals
) {
edge += 1;
}

/* ================= EDGE NORMALIZATION ================= */

edge = Math.max(-8, Math.min(6, edge));

/* =====================================================
OPPORTUNITY
===================================================== */

let opportunity = 0;

if (
tradeStack?.state === "LONG_BUILDING" &&
healthyInternals
) {
opportunity += 5;
}

if (
tradeStack?.state === "SHORT_BUILDING"
) {
opportunity += 5;
}

if (
executionMode === "ADD_ON_PULLBACKS" &&
healthyInternals
) {
opportunity += 5;
}

if (
regimeAligned &&
rotationScore > 70 &&
healthyInternals
) {
opportunity += 3;
}

/* ================= VALIDATED OPPORTUNITY ================= */

if (
validatedThrust
) {
opportunity += 5;
}

/* =====================================================
FRAGILE TAPE BLOCK
===================================================== */

if (
fragileExpansion ||
persistentWeakness ||
poorMarketQuality ||
breadthVelocityNegative ||
narrowLeadership ||
syntheticLiquidityRegime ||

deterioratingBreadthTrend ||
acceleratingBreadthDamage ||
persistentBreadthWeakness ||
leadershipConcentration ||
chronicRegimeWeakness
) {

opportunity = Math.min(opportunity, 2);
}

/* =====================================================
FINAL SIZE
===================================================== */

let size =
base +
(edge * 5) +
opportunity;

const rawSize =
base +
(edge * 5) +
opportunity;

/* =====================================================
RISK CONTROLS
===================================================== */

if (
systemHeat?.value > 0.5
) {
size *= 0.7;
}

if (
crashProb > 50
) {
size *= 0.5;
}

if (
dangerLevel === "EXTREME"
) {
size *= 0.4;
}
else if (
dangerLevel === "HIGH"
) {
size *= 0.7;
}

if (
dangerEscalation
) {
size *= 0.7;
}

if (
riskState === "CRISIS"
) {
size *= 0.3;
}

/* ================= STRUCTURAL RISK CONTROLS ================= */

if (
fragilityScore > 75
) {
size *= 0.5;
}

if (
squeezeRisk > 75
) {
size *= 0.7;
}

if (
liquidityScore < 35
) {
size *= 0.6;
}

if (
persistentWeakness
) {
size *= 0.8;
}

if (
phasePersistence >= 10
) {
size *= 0.9;
}

if (
participationDecay > 15
) {
size *= 0.9;
}

if (
deterioratingBreadthTrend
) {
size *= 0.95;
}

if (
acceleratingBreadthDamage
) {
size *= 0.9;
}

if (
persistentBreadthWeakness
) {
size *= 0.9;
}

if (
leadershipConcentration
) {
size *= 0.9;
}

if (
chronicRegimeWeakness
) {
size *= 0.85;
}


if (
poorMarketQuality
) {
size *= 0.8;
}

if (
narrowLeadership
) {
size *= 0.8;
}

if (
syntheticLiquidityRegime
) {
size *= 0.75;
}

if (
internalDeterioration
) {
size *= 0.6;
}

if (
severeInternalBreakdown
) {
size *= 0.45;
}

/* =====================================================
STRUCTURAL HARD CAPS
===================================================== */

if (
marketQualityScore < 40 &&
rotationDecayScore > 75 &&
participationScore < 40
) {

size = Math.min(size, 35);
}

if (
severeInternalBreakdown
) {

size = Math.min(size, 25);
}

if (
syntheticLiquidityRegime &&
persistentWeakness
) {

size = Math.min(size, 30);
}

if (
fragileExpansion
) {

size = Math.min(size, 40);
}

if (
phasePersistence >= 12 &&
participationDecay > 20
) {

size = Math.min(size, 35);
}

if (
chronicRegimeWeakness &&
persistentBreadthWeakness
)
{
size = Math.min(size, 35);
}

if (
acceleratingBreadthDamage &&
leadershipConcentration
)
{
size = Math.min(size, 30);
}

if (
severeBreadthDamage &&
participationDecay > 20
)
{
size = Math.min(size, 25);
}

/* =====================================================
CLEAN
===================================================== */

size = Math.max(
0,
Math.min(100, Math.round(size))
);

const adjustedSize = size;

const maxSize =
Math.max(
0,
Math.min(
100,
Math.round(base + (edge * 5))
)
);

/* =====================================================
MODE
===================================================== */

let mode = "MODERATE";

if (size > 70) {
mode = "AGGRESSIVE";
}
else if (size < 30) {
mode = "DEFENSIVE";
}

/* =====================================================
CAPITAL PRESERVATION
===================================================== */

if (

dangerLevel === "EXTREME" ||

riskState === "CRISIS" ||

persistentWeakness ||

internalDeterioration ||

syntheticLiquidityRegime ||

narrowLeadership ||

severeMarketQuality

) {

mode = "CAPITAL_PRESERVATION";
}

/* =====================================================
DIRECTION
===================================================== */

let direction = "NEUTRAL";

if (
tradeStack?.type === "LONG"
) {
direction = "LONG";
}

if (
tradeStack?.type === "SHORT"
) {
direction = "SHORT";
}

if (
tacticalBias === "SHORT_INDEX"
) {
direction = "SHORT";
}


/* =====================================================
OUTPUT
===================================================== */

return {

size,
mode,
direction,

edge: edgeState ?? {},

regimeAligned,
dangerLevel,
executionMode,
riskState,

sizingModel: {

maxSize,
adjustedSize,
rawSize
},

components: {

base,
edge,
opportunity,

regimeSyncScore,
rotationScore,
crashProb,

liquidityScore,
thrustStrength,
fragilityScore,
squeezeRisk,
participationScore,

rotationDecayScore,
breadthVelocityScore,
marketQualityScore,
persistenceScore
},

meta: {

tradeStrength:
tradeStack?.strength ?? 0,

riskState,

dangerLevel,

masterMode:
master?.mode ?? "NEUTRAL",

healthyLiquidity,
validatedThrust,

poorMarketQuality,
persistentWeakness,
narrowLeadership,

syntheticLiquidityRegime,
internalDeterioration,
severeInternalBreakdown,

fragileExpansion,
structurallyFragile
}
};

}
