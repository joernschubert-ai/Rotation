// /lib/engine/historicalReplay.ts

import { snapshotRunner } from "./snapshotRunner";

export function historicalReplay(
snapshots?: any[]
) {

/* =====================================================
SAFETY
===================================================== */

if (
!snapshots ||
!Array.isArray(snapshots) ||
snapshots.length === 0
) {

return {

falseDefensiveStates: 0,
missedCrashes: 0,
lateExits: 0,

/* NEW */
falseStabilityWarnings: 0,
liquidityIllusionWarnings: 0,
passiveFlowWarnings: 0,

robustnessScore: 0,

phaseAccuracy: 0,
transitionAccuracy: 0,
crashAccuracy: 0,
expansionPersistence: 0,

tests: []
};
}

/* =====================================================
PROCESS
===================================================== */

const processed: any[] = [];

/* =====================================================
LOOP
===================================================== */

for (const snap of snapshots) {

try {

/* =====================================================
SNAPSHOT
===================================================== */

const runner =
snapshotRunner(snap);

const outputs =
runner?.outputs ??
runner ??
{};

/* =====================================================
OUTPUTS
===================================================== */

const master =
outputs?.master ?? outputs?.masterScore ?? {};

const rotation =
outputs?.rotation ?? {};

const rotationDecay =
outputs?.rotationDecay ?? {};

const liquidity =
outputs?.liquidity ?? {};

const fragility =
outputs?.fragility ?? {};

const participation =
outputs?.participation ?? {};

const crash =
outputs?.crash ?? {};

const regimeSync =
outputs?.regimeSync ?? {};

/* =====================================================
VALUES
===================================================== */

const breadth50 =
Number(
snap?.breadth50 ??
outputs?.structure?.breadth?.b50?.value ??
50
);

const breadth200 =
Number(
snap?.breadth200 ??
outputs?.structure?.breadth?.b200?.value ??
50
);

const crashProbability =
Number(
crash?.probability ??
snap?.crashProbability ??
0
);

const vix =
Number(
snap?.marketData?.["^VIX"]?.current ??
outputs?.marketDrivers?.raw?.vix ??
20
);

const liquidityScore =
Number(
liquidity?.score ??
snap?.marketLiquidityScore ??
50
);

const liquidityState =
liquidity?.state ??
"NORMAL";

const rotationScore =
Number(
rotation?.score ??
snap?.rotationScore ??
50
);

/* =====================================================
NEW REPLAY INPUTS
===================================================== */

const rotationDecayScore =
Number(
rotationDecay?.score ??
snap?.rotationDecayScore ??
0
);

const fragilityScore =
Number(
fragility?.score ??
snap?.fragilityScore ??
50
);

const participationScore =
Number(
participation?.score ??
snap?.participationScore ??
50
);

const marketQualityScore =
Number(
master?.components?.marketQuality ??
snap?.marketQualityScore ??
50
);

const regimeSyncScore =
Number(
regimeSync?.score ??
snap?.regimeSyncScore ??
50
);

const marketQuality =
marketQualityScore;

const rsSmall =
Number(
rotation?.rsSmall ??
1
);

const rsEqual =
Number(
rotation?.rsEqual ??
1
);

const rsGrowth =
Number(
rotation?.rsGrowth ??
1
);

/* =====================================================
STRUCTURAL STATES
===================================================== */

const narrowLeadership =
Boolean(

snap?.narrowLeadership ??

rotationDecay?.signals?.narrowLeadership ??

master?.meta?.narrowLeadership

);

const liquidityStress =
Boolean(
rotationDecay?.signals?.liquidityStress
);

const weakParticipation =
Boolean(
rotationDecay?.signals?.weakParticipation
);

const thrustFailure =
Boolean(
rotationDecay?.signals?.thrustFailure
);

const earlyInstitutionalErosion =
Boolean(
rotationDecay?.signals?.earlyInstitutionalErosion
);

const confirmedInstitutionalErosion =
Boolean(
rotationDecay?.signals?.confirmedInstitutionalErosion
);

const structuralFragility =
Boolean(
rotationDecay?.signals?.structuralFragility
);

const hiddenDistribution =
Boolean(
regimeSync?.meta?.hiddenDistribution
);

const participationCollapse =
Boolean(
regimeSync?.meta?.participationCollapse
);

const structurallyAligned =
Boolean(
regimeSync?.structurallyAligned
);

/* =====================================================
NEW WARNING LAYERS
===================================================== */

const falseStability = (

breadth50 > 55 &&
breadth200 > 48 &&

narrowLeadership &&

(
participationScore < 48 ||
fragilityScore > 60
)

);

const liquidityIllusion = (

liquidityScore > 70 &&

(
participationScore < 45 ||
breadth50 < 50
) &&

rsGrowth > 1.04

);

const passiveFlowRegime = (

rsGrowth > 1.05 &&
rsEqual < 0.98 &&
rsSmall < 0.98 &&

participationScore < 50

);

/* =====================================================
REGIME
===================================================== */

let regime = "PHASE_1";

if (

crashProbability >= 85 ||
vix >= 55 ||

(
breadth50 < 20 &&
breadth200 < 25
)

) {

regime = "PHASE_6";
}

else if (

crashProbability >= 60 ||
vix >= 40 ||
breadth50 < 30

) {

regime = "PHASE_5";
}

else if (

crashProbability >= 35 ||
vix >= 25 ||
breadth50 < 50 ||

rotationDecayScore > 70 ||
fragilityScore > 65 ||

(
rotationDecayScore > 35 &&
participationScore < 45
)

) {

regime = "PHASE_4";
}

else if (

breadth50 > 62 &&
breadth200 > 55 &&
rotationScore > 60

) {

regime = "PHASE_2";
}

/* =====================================================
CLASSIFICATION
===================================================== */

let classification =
"LATE_EXPANSION";

/* =====================================================
CAPITULATION
===================================================== */

if (

regime === "PHASE_6" ||

(
crashProbability >= 90 &&
vix >= 60
)

) {

classification =
"CAPITULATION";
}

/* =====================================================
PANIC
===================================================== */

else if (

regime === "PHASE_5" ||

(
crashProbability >= 70 &&
vix >= 35
)

) {

classification =
"PANIC_SHORT";
}

/* =====================================================
DEFENSIVE SHORT
===================================================== */

else if (

rotationDecayScore >= 70 ||

(
narrowLeadership &&
weakParticipation
) ||

confirmedInstitutionalErosion ||

structuralFragility ||

(
falseStability &&
fragilityScore >= 68
) ||

(
liquidityIllusion &&
participationScore < 40
) ||

(
passiveFlowRegime &&
breadth50 < 45
) ||

(
rotationDecayScore > 35 &&
participationScore < 45
) ||

hiddenDistribution ||
participationCollapse

) {

classification =
"DEFENSIVE_SHORT";
}

/* =====================================================
STRUCTURAL DISTRIBUTION
===================================================== */

else if (

rotationDecayScore >= 45 ||
fragilityScore >= 55 ||
participationScore < 48 ||
marketQuality < 48 ||

falseStability ||
liquidityIllusion ||
passiveFlowRegime ||

(
rotationDecayScore > 35 &&
participationScore < 45
)

) {

classification =
"STRUCTURAL_DISTRIBUTION";
}

/* =====================================================
HEALTHY EXPANSION
===================================================== */

else if (

breadth50 > 62 &&
breadth200 > 58 &&

rotationScore > 60 &&
liquidityScore > 60 &&

regimeSyncScore > 60 &&

!narrowLeadership

) {

classification =
"HEALTHY_EXPANSION";
}

/* =====================================================
EDGE
===================================================== */

let edge = 50;

/* STRUCTURE */

edge +=
(breadth50 - 50) * 0.20;

edge +=
(breadth200 - 50) * 0.18;

/* ROTATION */

edge +=
(rotationScore - 50) * 0.28;

edge -=
(rotationDecayScore - 50) * 0.28;

/* LIQUIDITY */

edge +=
(liquidityScore - 50) * 0.14;

/* FRAGILITY */

edge -=
(fragilityScore - 50) * 0.28;

/* PARTICIPATION */

edge +=
(participationScore - 50) * 0.24;

/* QUALITY */

edge +=
(marketQuality - 50) * 0.22;

/* REGIME SYNC */

edge +=
(regimeSyncScore - 50) * 0.18;

/* CRASH */

edge -=
crashProbability * 0.35;

/* VOL */

if (vix > 24) {

edge -=
(vix - 24) * 0.40;
}

/* EROSION */

if (
earlyInstitutionalErosion
) {

edge -= 6;
}

if (
confirmedInstitutionalErosion
) {

edge -= 12;
}

/* AI CONCENTRATION */

const aiConcentration = (

rsGrowth > 1.04 &&
rsSmall < 0.98 &&
rsEqual < 0.98

);

if (
aiConcentration
) {

edge -= 7;
}

/* NEW WARNING PENALTIES */

if (
falseStability
) {

edge -= 4;
}

if (
liquidityIllusion
) {

edge -= 5;
}

if (
passiveFlowRegime
) {

edge -= 4;
}

/* NEW EXIT ESCALATION */

let exitPenalty = 0;

if (
rotationDecayScore > 35 &&
participationScore < 45
) {
exitPenalty += 1;
}

if (
rotationDecayScore > 50 &&
participationScore < 42
) {
exitPenalty += 2;
}

if (
rotationDecayScore > 65 &&
participationScore < 38
) {
exitPenalty += 3;
}

edge -= exitPenalty * 4;

/* HIDDEN */

if (
hiddenDistribution
) {

edge -= 6;
}

if (
participationCollapse
) {

edge -= 8;
}

if (
structuralFragility
) {

edge -= 10;
}

/* REGIME */

if (
classification ===
"HEALTHY_EXPANSION"
) {

edge += 10;
}

if (
classification ===
"DEFENSIVE_SHORT"
) {

edge -= 10;
}

if (
classification ===
"PANIC_SHORT"
) {

edge -= 20;
}

if (
classification ===
"CAPITULATION"
) {

edge -= 25;
}

/* ALIGNMENT */

if (
structurallyAligned
) {

edge += 4;
}

/* CLAMP */

edge = Math.max(
0,
Math.min(
100,
Math.round(edge)
)
);

/* =====================================================
RESULT
===================================================== */

let testResult = "FAIL";

/* EXPANSION */

if (

regime === "PHASE_2" &&

(
classification ===
"HEALTHY_EXPANSION" ||

classification ===
"LATE_EXPANSION"
)

) {

testResult = "PASS";
}

/* PHASE 4 */

else if (

regime === "PHASE_4" &&

(
classification ===
"STRUCTURAL_DISTRIBUTION" ||

classification ===
"DEFENSIVE_SHORT"
)

) {

testResult = "PASS";
}

/* CRASH */

else if (

(
regime === "PHASE_5" ||
regime === "PHASE_6"
) &&

(
classification ===
"PANIC_SHORT" ||

classification ===
"CAPITULATION"
)

) {

testResult = "PASS";
}

/* EARLY */

else if (

regime === "PHASE_1" &&

classification !==
"PANIC_SHORT" &&

classification !==
"CAPITULATION"

) {

testResult = "PASS";
}

/* =====================================================
QUALITY
===================================================== */

const phaseValid = (

(
regime === "PHASE_2" &&

(
classification ===
"HEALTHY_EXPANSION" ||

classification ===
"LATE_EXPANSION"
)
) ||

(
regime === "PHASE_4" &&

(
classification ===
"STRUCTURAL_DISTRIBUTION" ||

classification ===
"DEFENSIVE_SHORT"
)
) ||

(
(
regime === "PHASE_5" ||
regime === "PHASE_6"
) &&

(
classification ===
"PANIC_SHORT" ||

classification ===
"CAPITULATION"
)
)
);

const transitionValid = (

classification ===
"STRUCTURAL_DISTRIBUTION"

);

const crashValid = (

classification ===
"PANIC_SHORT" ||

classification ===
"CAPITULATION"

);

const expansionValid = (

classification ===
"HEALTHY_EXPANSION"

);

/* =====================================================
STORE
===================================================== */

processed.push({

date:
snap?.date ?? null,

regime,

result:
testResult,

classification,

edgePersistence:
edge,

falseStability,
liquidityIllusion,
passiveFlowRegime,

phaseValid,
transitionValid,
crashValid,
expansionValid,

snapshot:
snap,

outputs
});

} catch (err) {

console.error(
"HISTORICAL REPLAY SNAPSHOT ERROR",
err
);
}
}

/* =====================================================
TESTS
===================================================== */

const tests =
processed.map((r, index) => {

const year =
r?.date
? String(r.date).slice(0, 4)
: `RUN-${index}`;

return {

id:
`${year}-${index}`,

year,

regime:
r?.regime ?? "UNKNOWN",

result:
r?.result ?? "FAIL",

classification:
r?.classification ??
"UNKNOWN",

edgePersistence:
Number(
r?.edgePersistence ?? 0
),

falseStability:
r?.falseStability ?? false,

liquidityIllusion:
r?.liquidityIllusion ?? false,

passiveFlowRegime:
r?.passiveFlowRegime ?? false
};
});

/* =====================================================
ANALYTICS
===================================================== */

const falseDefensiveStates =
tests.filter(
(t) =>

t.regime === "PHASE_2" &&

(
t.classification ===
"DEFENSIVE_SHORT" ||

t.classification ===
"PANIC_SHORT" ||

t.classification ===
"CAPITULATION"
)
).length;

const missedCrashes =
tests.filter(
(t) =>

(
t.regime === "PHASE_5" ||
t.regime === "PHASE_6"
) &&

(
t.classification !==
"PANIC_SHORT" &&

t.classification !==
"CAPITULATION"
)
).length;

const lateExits =
tests.filter(
(t) =>

t.regime === "PHASE_4" &&

(
t.classification ===
"HEALTHY_EXPANSION" ||

t.classification ===
"LATE_EXPANSION"
)
).length;

/* =====================================================
NEW WARNINGS
===================================================== */

const falseStabilityWarnings =
tests.filter(
(t) => t.falseStability
).length;

const liquidityIllusionWarnings =
tests.filter(
(t) => t.liquidityIllusion
).length;

const passiveFlowWarnings =
tests.filter(
(t) => t.passiveFlowRegime
).length;

/* =====================================================
ROBUSTNESS
===================================================== */

const robustnessScore =
tests.length > 0

? Math.round(

(
tests.filter(
(t) =>
t.result === "PASS"
).length

/

tests.length

) * 100
)

: 0;

/* =====================================================
METRICS
===================================================== */

const phaseAccuracy =

processed.length > 0

? Math.round(

(
processed.filter(
(p) => p.phaseValid
).length

/

processed.length

) * 100
)

: 0;

const transitionAccuracy =

processed.length > 0

? Math.round(

(
processed.filter(
(p) => p.transitionValid
).length

/

processed.length

) * 100
)

: 0;

const crashAccuracy =

processed.filter(
(p) =>

p.regime === "PHASE_5" ||
p.regime === "PHASE_6"

).length > 0

? Math.round(

(
processed.filter(
(p) => p.crashValid
).length

/

processed.filter(
(p) =>

p.regime === "PHASE_5" ||
p.regime === "PHASE_6"

).length

) * 100
)

: 0;

const expansionPersistence =

processed.filter(
(p) =>
p.regime === "PHASE_2"
).length > 0

? Math.round(

(
processed.filter(
(p) => p.expansionValid
).length

/

processed.filter(
(p) =>
p.regime === "PHASE_2"
).length

) * 100
)

: 0;

/* =====================================================
RETURN
===================================================== */

return {

falseDefensiveStates,

missedCrashes,

lateExits,

falseStabilityWarnings,
liquidityIllusionWarnings,
passiveFlowWarnings,

robustnessScore,

phaseAccuracy,
transitionAccuracy,
crashAccuracy,
expansionPersistence,

tests
};
}
