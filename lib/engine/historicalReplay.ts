// /lib/engine/historicalReplay.ts

import { snapshotRunner } from "./snapshotRunner";


/* =====================================================
TYPES
===================================================== */

type ReplayRegime =
| "PHASE_1_EXPANSION"
| "PHASE_2_WARNING"
| "PHASE_3_DISTRIBUTION"
| "PHASE_4_RISK"
| "PHASE_5_BREAKDOWN"
| "PHASE_6_ACCELERATION"
| "PHASE_7_CAPITULATION";


type ReplayClassification =
| "HEALTHY_EXPANSION"
| "LATE_EXPANSION"
| "STRUCTURAL_DISTRIBUTION"
| "DEFENSIVE_SHORT"
| "PANIC_SHORT"
| "CAPITULATION";


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


function normalizePercent(
value: any,
fallback = 50
) {

const number =
safeNumber(
value,
fallback
);

if (
number >= 0 &&
number <= 1
) {

return number * 100;

}

return number;

}


/* =====================================================
PHASE NORMALIZATION
===================================================== */

function normalizePhase(
phase: any
): ReplayRegime {

const value =
String(phase ?? "")
.trim()
.toUpperCase();


if (
value.includes("PHASE_7") ||
value.includes("CAPITULATION")
) {

return "PHASE_7_CAPITULATION";

}


if (
value.includes("PHASE_6") ||
value.includes("ACCELERATION")
) {

return "PHASE_6_ACCELERATION";

}


if (
value.includes("PHASE_5") ||
value.includes("BREAKDOWN")
) {

return "PHASE_5_BREAKDOWN";

}


if (
value.includes("PHASE_4") ||
value === "RISK"
) {

return "PHASE_4_RISK";

}


if (
value.includes("PHASE_3") ||
value.includes("DISTRIBUTION")
) {

return "PHASE_3_DISTRIBUTION";

}


if (
value.includes("PHASE_2") ||
value.includes("WARNING")
) {

return "PHASE_2_WARNING";

}


return "PHASE_1_EXPANSION";

}


/* =====================================================
CLASSIFICATION VALIDATION
===================================================== */

function isClassificationValidForPhase(
regime: ReplayRegime,
classification: ReplayClassification
) {

switch (regime) {

case "PHASE_1_EXPANSION":

return (
classification === "HEALTHY_EXPANSION" ||
classification === "LATE_EXPANSION"
);


case "PHASE_2_WARNING":

return (
classification === "LATE_EXPANSION" ||
classification === "STRUCTURAL_DISTRIBUTION"
);


case "PHASE_3_DISTRIBUTION":

return (
classification === "STRUCTURAL_DISTRIBUTION" ||
classification === "DEFENSIVE_SHORT"
);


case "PHASE_4_RISK":

return (
classification === "STRUCTURAL_DISTRIBUTION" ||
classification === "DEFENSIVE_SHORT"
);


case "PHASE_5_BREAKDOWN":

return (
classification === "DEFENSIVE_SHORT" ||
classification === "PANIC_SHORT"
);


case "PHASE_6_ACCELERATION":

return (
classification === "PANIC_SHORT" ||
classification === "CAPITULATION"
);


case "PHASE_7_CAPITULATION":

return (
classification === "CAPITULATION" ||
classification === "PANIC_SHORT"
);


default:

return false;

}

}


/* =====================================================
MAIN
===================================================== */

export function historicalReplay(
snapshots?: any[]
) {


/* =====================================================
SAFETY
===================================================== */

if (
!Array.isArray(snapshots) ||
snapshots.length === 0
) {

return {

falseDefensiveStates: 0,

missedCrashes: 0,

lateExits: 0,

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

for (
const snap of snapshots
) {

try {


/* =================================================
SNAPSHOT RUNNER
================================================= */

const runner =
snapshotRunner(snap);


const outputs =
(
runner?.outputs ??
runner ??
{}
) as any;


/* =================================================
ENGINE OUTPUTS
================================================= */

const master =
outputs?.master ??
outputs?.masterScore ??
{};


const rotation =
outputs?.rotation ??
{};


const rotationDecay =
outputs?.rotationDecay ??
{};


const liquidity =
outputs?.liquidity ??
{};


const fragility =
outputs?.fragility ??
{};


const participation =
outputs?.participation ??
{};


const crash =
outputs?.crash ??
{};


const regimeSync =
outputs?.regimeSync ??
{};


const phaseOutput =
outputs?.phase ??
outputs?.phaseData ??
snap?.phase ??
{};


/* =================================================
PHASE
================================================= */

const rawPhase =
phaseOutput?.phase ??
phaseOutput?.state ??
snap?.phase ??
snap?.phaseData?.phase ??
"PHASE_1_EXPANSION";


const regime =
normalizePhase(
rawPhase
);


/* =================================================
MARKET DATA
================================================= */

const breadth50 =
clamp(
normalizePercent(
snap?.breadth50 ??
outputs?.structure?.breadth?.b50?.value ??
50
)
);


const breadth200 =
clamp(
normalizePercent(
snap?.breadth200 ??
outputs?.structure?.breadth?.b200?.value ??
50
)
);


const crashProbability =
clamp(
safeNumber(
crash?.probability ??
snap?.crashProbability ??
0
)
);


const vix =
safeNumber(
snap?.marketData?.["^VIX"]?.current ??
outputs?.marketDrivers?.raw?.vix ??
snap?.vix ??
20,
20
);


const liquidityScore =
clamp(
safeNumber(
liquidity?.score ??
snap?.marketLiquidityScore ??
50,
50
)
);


const rotationScore =
clamp(
safeNumber(
rotation?.score ??
snap?.rotationScore ??
50,
50
)
);


const rotationDecayScore =
clamp(
safeNumber(
rotationDecay?.score ??
snap?.rotationDecayScore ??
0
)
);


const fragilityScore =
clamp(
safeNumber(
fragility?.score ??
snap?.fragilityScore ??
50,
50
)
);


const participationScore =
clamp(
safeNumber(
participation?.score ??
snap?.participationScore ??
50,
50
)
);


const marketQualityScore =
clamp(
safeNumber(
master?.components?.marketQuality ??
outputs?.marketQuality?.score ??
snap?.marketQualityScore ??
50,
50
)
);


const regimeSyncScore =
clamp(
safeNumber(
regimeSync?.score ??
snap?.regimeSyncScore ??
50,
50
)
);


/* =================================================
RELATIVE STRENGTH
================================================= */

const rsSmall =
safeNumber(
rotation?.rsSmall ??
snap?.rsSmall ??
1,
1
);


const rsEqual =
safeNumber(
rotation?.rsEqual ??
snap?.rsEqual ??
1,
1
);


const rsGrowth =
safeNumber(
rotation?.rsGrowth ??
snap?.rsGrowth ??
1,
1
);


/* =================================================
STRUCTURAL FLAGS
================================================= */

const narrowLeadership =

Boolean(
snap?.narrowLeadership ??
rotationDecay?.signals?.narrowLeadership ??
master?.meta?.narrowLeadership
) ||

(
rsGrowth > 1.03 &&
rsSmall < 0.99 &&
rsEqual < 0.99
);


const liquidityStress =
Boolean(
rotationDecay?.signals?.liquidityStress
);


const weakParticipation =

Boolean(
rotationDecay?.signals?.weakParticipation
) ||

participationScore < 50;


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
) ||

fragilityScore >= 70;


const hiddenDistribution =
Boolean(
regimeSync?.meta?.hiddenDistribution
);


const participationCollapse =

Boolean(
regimeSync?.meta?.participationCollapse
) ||

participationScore < 35;


const structurallyAligned =
Boolean(
regimeSync?.structurallyAligned
);


/* =================================================
WARNING LAYERS
================================================= */

const falseStability =

breadth50 > 55 &&
breadth200 > 48 &&
narrowLeadership &&

(
participationScore < 48 ||
fragilityScore > 60
);


const liquidityIllusion =

liquidityScore > 70 &&

(
participationScore < 45 ||
breadth50 < 50
) &&

rsGrowth > 1.04;


const passiveFlowRegime =

rsGrowth > 1.05 &&
rsEqual < 0.98 &&
rsSmall < 0.98 &&
participationScore < 50;


/* =================================================
CLASSIFICATION
================================================= */

let classification:
ReplayClassification =
"LATE_EXPANSION";


/* ===============================================
CAPITULATION
=============================================== */

if (
regime ===
"PHASE_7_CAPITULATION"
) {

classification =
"CAPITULATION";

}


/* ===============================================
PANIC
=============================================== */

else if (

regime ===
"PHASE_6_ACCELERATION" ||

(
crashProbability >= 70 &&
vix >= 35
)

) {

classification =
"PANIC_SHORT";

}


/* ===============================================
BREAKDOWN
=============================================== */

else if (

regime ===
"PHASE_5_BREAKDOWN"

) {

classification =
"DEFENSIVE_SHORT";

}


/* ===============================================
DEFENSIVE
=============================================== */

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

hiddenDistribution ||

participationCollapse

) {

classification =
"DEFENSIVE_SHORT";

}


/* ===============================================
DISTRIBUTION
=============================================== */

else if (

regime ===
"PHASE_3_DISTRIBUTION" ||

regime ===
"PHASE_4_RISK" ||

rotationDecayScore >= 45 ||

fragilityScore >= 55 ||

participationScore < 48 ||

marketQualityScore < 48 ||

falseStability ||

liquidityIllusion ||

passiveFlowRegime ||

earlyInstitutionalErosion ||

thrustFailure ||

liquidityStress

) {

classification =
"STRUCTURAL_DISTRIBUTION";

}


/* ===============================================
HEALTHY EXPANSION
=============================================== */

else if (

breadth50 > 62 &&
breadth200 > 58 &&
rotationScore > 60 &&
liquidityScore > 60 &&
regimeSyncScore > 60 &&
participationScore > 60 &&
!narrowLeadership

) {

classification =
"HEALTHY_EXPANSION";

}


/* =================================================
EDGE
================================================= */

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
rotationDecayScore * 0.18;


/* LIQUIDITY */

edge +=
(liquidityScore - 50) * 0.14;


/* FRAGILITY */

edge -=
(fragilityScore - 50) * 0.28;


/* PARTICIPATION */

edge +=
(participationScore - 50) * 0.24;


/* MARKET QUALITY */

edge +=
(marketQualityScore - 50) * 0.22;


/* REGIME SYNC */

edge +=
(regimeSyncScore - 50) * 0.18;


/* CRASH */

edge -=
crashProbability * 0.35;


/* VOLATILITY */

if (
vix > 24
) {

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


/* CONCENTRATION */

const aiConcentration =

rsGrowth > 1.04 &&
rsSmall < 0.98 &&
rsEqual < 0.98;


if (
aiConcentration
) {

edge -= 7;

}


/* WARNING PENALTIES */

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


/* EXIT ESCALATION */

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


edge -=
exitPenalty * 4;


/* HIDDEN DISTRIBUTION */

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


/* REGIME ADJUSTMENT */

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


edge =
clamp(
Math.round(edge)
);


/* =================================================
VALIDATION
================================================= */

const phaseValid =
isClassificationValidForPhase(
regime,
classification
);


const transitionValid =

regime ===
"PHASE_3_DISTRIBUTION" ||

regime ===
"PHASE_4_RISK"

? (
classification ===
"STRUCTURAL_DISTRIBUTION" ||

classification ===
"DEFENSIVE_SHORT"
)

: false;


const crashPhase =

regime ===
"PHASE_5_BREAKDOWN" ||

regime ===
"PHASE_6_ACCELERATION" ||

regime ===
"PHASE_7_CAPITULATION";


const crashValid =

crashPhase

? (

classification ===
"DEFENSIVE_SHORT" ||

classification ===
"PANIC_SHORT" ||

classification ===
"CAPITULATION"

)

: false;


const expansionPhase =

regime ===
"PHASE_1_EXPANSION" ||

regime ===
"PHASE_2_WARNING";


const expansionValid =

expansionPhase

? (

classification ===
"HEALTHY_EXPANSION" ||

classification ===
"LATE_EXPANSION"

)

: false;


/* =================================================
RESULT
================================================= */

const testResult =
phaseValid
? "PASS"
: "FAIL";


/* =================================================
NOTES
================================================= */

const notes: string[] = [];


if (
falseStability
) {

notes.push(
"False stability"
);

}


if (
liquidityIllusion
) {

notes.push(
"Liquidity illusion"
);

}


if (
passiveFlowRegime
) {

notes.push(
"Passive flow"
);

}


if (
narrowLeadership
) {

notes.push(
"Narrow leadership"
);

}


if (
structuralFragility
) {

notes.push(
"Structural fragility"
);

}


/* =================================================
STORE
================================================= */

processed.push({

date:
snap?.timestamp ??
snap?.date ??
null,

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

notes,

snapshot:
snap,

outputs

});


} catch (
err
) {

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
processed.map(
(result, index) => {

const date =
result?.date
? new Date(
result.date
)
: null;


const year =

date &&
!Number.isNaN(
date.getTime()
)

? String(
date.getFullYear()
)

: `RUN-${index + 1}`;


return {

id:
`${year}-${index}`,

year,

regime:
result?.regime ??
"UNKNOWN",

result:
result?.result ??
"FAIL",

classification:
result?.classification ??
"UNKNOWN",

edgePersistence:
Number(
result?.edgePersistence ??
0
),

falseStability:
Boolean(
result?.falseStability
),

liquidityIllusion:
Boolean(
result?.liquidityIllusion
),

passiveFlowRegime:
Boolean(
result?.passiveFlowRegime
),

notes:
Array.isArray(
result?.notes
)

? result.notes.join(" | ")

: ""

};

}
);


/* =====================================================
ANALYTICS
===================================================== */

const falseDefensiveStates =
processed.filter(
(item) =>

(
item.regime ===
"PHASE_1_EXPANSION" ||

item.regime ===
"PHASE_2_WARNING"
) &&

(
item.classification ===
"DEFENSIVE_SHORT" ||

item.classification ===
"PANIC_SHORT" ||

item.classification ===
"CAPITULATION"
)
).length;


const missedCrashes =
processed.filter(
(item) =>

(
item.regime ===
"PHASE_5_BREAKDOWN" ||

item.regime ===
"PHASE_6_ACCELERATION" ||

item.regime ===
"PHASE_7_CAPITULATION"
) &&

!(
item.classification ===
"DEFENSIVE_SHORT" ||

item.classification ===
"PANIC_SHORT" ||

item.classification ===
"CAPITULATION"
)
).length;


const lateExits =
processed.filter(
(item) =>

(
item.regime ===
"PHASE_3_DISTRIBUTION" ||

item.regime ===
"PHASE_4_RISK"
) &&

(
item.classification ===
"HEALTHY_EXPANSION" ||

item.classification ===
"LATE_EXPANSION"
)
).length;


/* =====================================================
WARNING COUNTERS
===================================================== */

const falseStabilityWarnings =
tests.filter(
(test) =>
test.falseStability
).length;


const liquidityIllusionWarnings =
tests.filter(
(test) =>
test.liquidityIllusion
).length;


const passiveFlowWarnings =
tests.filter(
(test) =>
test.passiveFlowRegime
).length;


/* =====================================================
ACCURACY
===================================================== */

const phaseAccuracy =

processed.length > 0

? Math.round(
(
processed.filter(
(item) =>
item.phaseValid
).length /

processed.length
) * 100
)

: 0;


const transitionSamples =
processed.filter(
(item) =>

item.regime ===
"PHASE_3_DISTRIBUTION" ||

item.regime ===
"PHASE_4_RISK"
);


const transitionAccuracy =

transitionSamples.length > 0

? Math.round(
(
transitionSamples.filter(
(item) =>
item.transitionValid
).length /

transitionSamples.length
) * 100
)

: 0;


const crashSamples =
processed.filter(
(item) =>

item.regime ===
"PHASE_5_BREAKDOWN" ||

item.regime ===
"PHASE_6_ACCELERATION" ||

item.regime ===
"PHASE_7_CAPITULATION"
);


const crashAccuracy =

crashSamples.length > 0

? Math.round(
(
crashSamples.filter(
(item) =>
item.crashValid
).length /

crashSamples.length
) * 100
)

: 0;


const expansionSamples =
processed.filter(
(item) =>

item.regime ===
"PHASE_1_EXPANSION" ||

item.regime ===
"PHASE_2_WARNING"
);


const expansionPersistence =

expansionSamples.length > 0

? Math.round(
(
expansionSamples.filter(
(item) =>
item.expansionValid
).length /

expansionSamples.length
) * 100
)

: 0;


/* =====================================================
ROBUSTNESS SCORE
===================================================== */

/*
* Not all errors have equal severity.
*
* Missed crashes are significantly more serious
* than false defensive states.
*/

let robustnessScore =
phaseAccuracy;


robustnessScore -=
missedCrashes * 12;


robustnessScore -=
lateExits * 6;


robustnessScore -=
falseDefensiveStates * 3;


robustnessScore =
clamp(
Math.round(
robustnessScore
)
);


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
