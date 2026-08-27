// /lib/engine/rotationDecayEngine.ts

/*
* ============================================================
* ROTATION DECAY ENGINE
* ============================================================
*
* Aufgabe:
*
* Misst nicht einfach "wie schlecht der Markt ist",
* sondern speziell die Qualität und Alterung der internen
* Marktrotation:
*
* gesunde Rotation
* ↓
* reife Rotation
* ↓
* fragile Rotation
* ↓
* narrow leadership
* ↓
* distribution
* ↓
* exhausted rotation
*
* Der Engine darf NICHT direkt den Marktcrash bestimmen.
*
* Hoher Score =
* Rotation verliert strukturell an Qualität.
*
* ============================================================
*/

export interface RotationDecayInput {
participation?: any;
breadthVelocity?: any;
internalDivergence?: any;

rotation?: any;
structure?: any;

crash?: any;
earlyWarning?: any;

liquidity?: any;
fragility?: any;
squeeze?: any;

breadthThrust?: any;
regimeSync?: any;

executionState?: any;

historyMetrics?: any;

breadth50?: number;
breadth200?: number;

vix?: number;
concentrationScore?: number;
gammaExposure?: number;
creditRatio?: number;
marketLiquidityScore?: number;

// Historical direct inputs
breadthTrend?: number;
breadthAcceleration?: number;
participationDecay?: number;
leadershipDecay?: number;
relativeBreadthWeakness?: number;
}

export interface RotationDecayOutput {
score: number;

state:
| "HEALTHY_ROTATION"
| "MATURE_ROTATION"
| "FRAGILE_ROTATION"
| "NARROW_ROTATION"
| "DISTRIBUTION_ROTATION"
| "EXHAUSTED_ROTATION";

momentumQuality: number;

participationScore: number;
breadthVelocityScore: number;
divergenceScore: number;

decayPersistence: number;

breadthExhaustion: boolean;
breadthExhaustionScore: number;

narrowLeadershipRisk: boolean;
narrowLeadershipScore: number;

institutionalDistribution: boolean;
distributionRisk: number;

rotationRecovery: boolean;
recoveryScore: number;

components: {
participationDecay: number;
breadthDecay: number;
leadershipDecay: number;
divergencePressure: number;
persistencePressure: number;
structuralPressure: number;
liquidityDependence: number;
fragilityPressure: number;
};

history: {
phasePersistence: number;
daysInPhase: number;

participationDecay: number;
breadthTrend: number;
breadthAcceleration: number;
leadershipDecay: number;

relativeBreadthWeakness: number;
institutionalPressure: number;

averageBreadth: number;
averageParticipation: number;
averageRotation: number;
averageLiquidity: number;
averageFragility: number;

persistentDistribution: boolean;
prolongedBearRegime: boolean;
acceleratingWeakness: boolean;
};

summary: string;
}

/* ============================================================
* HELPERS
* ============================================================ */

function clamp(
value: number,
min = 0,
max = 100
): number {
return Math.max(
min,
Math.min(max, value)
);
}

function num(
value: unknown,
fallback = 0
): number {
const n = Number(value);

return Number.isFinite(n)
? n
: fallback;
}

/*
* History kann je nach Pipeline entweder einen einzelnen
* Wert oder ein Array enthalten.
*
* Für RotationDecay benötigen wir hier den aktuellsten
* numerischen Wert.
*/
function latestHistoryValue(
value: unknown,
fallback = 0
): number {

if (Array.isArray(value)) {

if (value.length === 0) {
return fallback;
}

const latest = value[value.length - 1];

if (
typeof latest === "object" &&
latest !== null
) {

const candidate =
(latest as any).score ??
(latest as any).value ??
(latest as any).decay ??
(latest as any).rotationDecay ??
(latest as any).rotationDecayScore;

return num(
candidate,
fallback
);
}

return num(
latest,
fallback
);
}

return num(
value,
fallback
);
}

/* ============================================================
* ENGINE
* ============================================================ */

export function rotationDecayEngine(
input: RotationDecayInput
): RotationDecayOutput {

const {
participation = {},
breadthVelocity = {},
internalDivergence = {},

rotation = {},
structure = {},

crash = {},
earlyWarning = {},

liquidity = {},
fragility = {},
squeeze = {},

breadthThrust = {},
regimeSync = {},

executionState = {},

historyMetrics = {},

breadth50: inputBreadth50 = 50,
breadth200: inputBreadth200 = 50,

vix = 20,
concentrationScore = 50,
gammaExposure = 0,
creditRatio = 1,
marketLiquidityScore = 50

} = input;

/* ============================================================
* CURRENT STRUCTURE
* ============================================================ */

const breadth50 =
num(
structure?.breadth?.b50?.value,
inputBreadth50
);

const breadth200 =
num(
structure?.breadth?.b200?.value,
inputBreadth200
);

/* ============================================================
* PARTICIPATION
* ============================================================ */

const participationScore =
clamp(
num(
participation?.score,
50
)
);

const participationPersistence =
clamp(
num(
participation?.decayPersistence,
0
)
);

/* ============================================================
* BREADTH VELOCITY
* ============================================================ */

const breadthVelocityScore =
clamp(
num(
breadthVelocity?.score,
50
)
);

const breadthVelocityPersistence =
clamp(
num(
breadthVelocity?.decayPersistence,
0
)
);

/*
* 100 = starke Breadth-Dynamik
* 50 = neutral
* 0 = starke Verschlechterung
*/

const breadthDecay =
clamp(
100 - breadthVelocityScore
);

/* ============================================================
* INTERNAL DIVERGENCE
* ============================================================ */

const divergenceScore =
clamp(
num(
internalDivergence?.score,
0
)
);

const divergenceSeverity =
clamp(
num(
internalDivergence?.severity,
divergenceScore
)
);

const hiddenDistribution =
Boolean(
internalDivergence?.hiddenDistribution
);

const participationCollapse =
Boolean(
internalDivergence?.participationCollapse
);

const divergenceNarrowLeadership =
Boolean(
internalDivergence?.narrowLeadership
);

/* ============================================================
* ROTATION
* ============================================================ */

const rotationScore =
clamp(
num(
rotation?.score,
50
)
);

const rsSmall =
num(
rotation?.rsSmall,
1
);

const rsEqual =
num(
rotation?.rsEqual,
1
);

const rsGrowth =
num(
rotation?.rsGrowth,
1
);

/*
* Narrow leadership:
*
* Growth leadership während Small Caps und Equal Weight
* schwach bleiben.
*/

const narrowLeadership =
(
rsGrowth > 1.03 &&
rsSmall < 0.995 &&
rsEqual < 0.995
) ||
divergenceNarrowLeadership;

const megaCapDistortion =
(
rsGrowth > 1.05 &&
rsSmall < 0.97 &&
rsEqual < 0.97
);

/* ============================================================
* HISTORY
* ============================================================ */

const phasePersistence =
num(
historyMetrics?.phasePersistence,
0
);

const daysInPhase =
num(
historyMetrics?.daysInPhase,
0
);

const participationDecayHistory =
num(
historyMetrics?.participationDecay,
0
);

const breadthTrend =
num(
historyMetrics?.breadthTrend,
0
);

const breadthAcceleration =
num(
historyMetrics?.breadthAcceleration,
0
);

const leadershipDecay =
num(
historyMetrics?.leadershipDecay,
0
);

const relativeBreadthWeakness =
num(
historyMetrics?.relativeBreadthWeakness,
0
);

const institutionalPressure =
num(
historyMetrics?.institutionalPressure,
0
);

const averageBreadth =
num(
historyMetrics?.averageBreadth,
50
);

const averageParticipation =
num(
historyMetrics?.averageParticipation,
50
);

const averageRotation =
num(
historyMetrics?.averageRotation,
50
);

const averageLiquidity =
num(
historyMetrics?.averageLiquidity,
50
);

const averageFragility =
num(
historyMetrics?.averageFragility,
50
);

const persistentDistribution =
Boolean(
historyMetrics?.persistentDistribution
);

const prolongedBearRegime =
Boolean(
historyMetrics?.prolongedBearRegime
);

const acceleratingWeakness =
Boolean(
historyMetrics?.acceleratingWeakness
);

/*
* Wichtig:
*
* rotationDecayHistory kann in historyMetrics als Array
* vorliegen. Deshalb nicht direkt mit >= vergleichen.
*
* Wir nehmen den aktuellsten numerischen Wert.
*/
const rotationDecayHistory =
latestHistoryValue(
historyMetrics?.rotationDecayHistory,
0
);

/* ============================================================
* EXECUTION STATE
* ============================================================ */

/*
* ExecutionState ist ein Kontextsignal.
*
* RotationDecay entscheidet weiterhin NICHT selbst
* über die finale Ausführung.
*/

const executionStateScore =
clamp(
num(
executionState?.score,
50
)
);

const executionStateRisk =
Boolean(
executionState?.risk ||
executionState?.state === "RISK" ||
executionState?.state === "BREAKDOWN" ||
executionState?.state === "DISTRIBUTION"
);

/* ============================================================
* RECOVERY DETECTION
* ============================================================ */

const recoveryConfidence =
num(
regimeSync?.meta?.recoveryConfidence ??
regimeSync?.recoveryConfidence,
50
);

const recoveryScore =
clamp(
(
breadth50 * 0.30 +
breadth200 * 0.20 +
participationScore * 0.25 +
rotationScore * 0.15 +
recoveryConfidence * 0.10
)
);

const rotationRecovery =
recoveryScore >= 62 &&
breadth50 >= 58 &&
participationScore >= 55 &&
rotationScore >= 52 &&
!hiddenDistribution &&
!participationCollapse;

/* ============================================================
* PARTICIPATION DECAY
* ============================================================ */

const participationDecay =
clamp(
100 - participationScore
);

/* ============================================================
* LEADERSHIP DECAY
* ============================================================ */

const leadershipDecayPressure =
clamp(
(
Math.max(
0,
-leadershipDecay
) * 6
) +
(
narrowLeadership
? 35
: 0
) +
(
megaCapDistortion
? 20
: 0
)
);

/* ============================================================
* DIVERGENCE PRESSURE
* ============================================================ */

const divergencePressure =
clamp(
divergenceSeverity * 0.65 +
(
hiddenDistribution
? 25
: 0
) +
(
participationCollapse
? 20
: 0
)
);

/* ============================================================
* PERSISTENCE PRESSURE
* ============================================================ */

let persistencePressure = 0;

persistencePressure +=
clamp(
phasePersistence * 0.7,
0,
25
);

persistencePressure +=
clamp(
daysInPhase * 0.20,
0,
15
);

persistencePressure +=
clamp(
participationDecayHistory * 0.35,
0,
15
);

if (persistentDistribution) {
persistencePressure += 15;
}

if (prolongedBearRegime) {
persistencePressure += 10;
}

if (acceleratingWeakness) {
persistencePressure += 12;
}

if (rotationDecayHistory >= 45) {
persistencePressure += 4;
}

if (rotationDecayHistory >= 65) {
persistencePressure += 6;
}

persistencePressure =
clamp(
persistencePressure
);

/* ============================================================
* STRUCTURAL PRESSURE
* ============================================================ */

let structuralPressure = 0;

if (breadth50 < 60) {
structuralPressure +=
(60 - breadth50) * 0.8;
}

if (breadth50 < 50) {
structuralPressure += 8;
}

if (breadth50 < 40) {
structuralPressure += 12;
}

if (breadth200 < 55) {
structuralPressure +=
(55 - breadth200) * 0.45;
}

if (breadth200 < 45) {
structuralPressure += 8;
}

if (averageBreadth < 55) {
structuralPressure += 5;
}

if (averageParticipation < 55) {
structuralPressure += 5;
}

if (averageRotation < 60) {
structuralPressure += 4;
}

if (relativeBreadthWeakness > 8) {
structuralPressure += 5;
}

if (relativeBreadthWeakness > 15) {
structuralPressure += 7;
}

structuralPressure =
clamp(
structuralPressure
);

/* ============================================================
* LIQUIDITY DEPENDENCE
* ============================================================ */

const liquidityScore =
clamp(
num(
liquidity?.score,
marketLiquidityScore
)
);

let liquidityDependence = 0;

if (liquidityScore >= 65) {

if (participationScore < 50) {
liquidityDependence += 25;
}

if (narrowLeadership) {
liquidityDependence += 25;
}

if (rotationScore < 45) {
liquidityDependence += 20;
}

if (breadth50 < 55) {
liquidityDependence += 15;
}
}

/*
* Positive Gamma kann Volatilität künstlich unterdrücken,
* während die Marktinternals bereits schwächer werden.
*/

if (
gammaExposure > 0 &&
participationScore < 50 &&
narrowLeadership
) {
liquidityDependence += 10;
}

if (executionStateRisk) {
liquidityDependence += 5;
}

liquidityDependence =
clamp(
liquidityDependence
);

/* ============================================================
* FRAGILITY PRESSURE
* ============================================================ */

const fragilityScore =
clamp(
num(
fragility?.score,
50
)
);

let fragilityPressure =
Math.max(
0,
fragilityScore - 45
) * 0.65;

if (vix >= 25) {
fragilityPressure += 8;
}

if (vix >= 30) {
fragilityPressure += 10;
}

if (creditRatio > 1.10) {
fragilityPressure += 8;
}

if (creditRatio > 1.20) {
fragilityPressure += 10;
}

if (averageFragility > 60) {
fragilityPressure += 8;
}

if (
Boolean(
fragility?.state ===
"STRUCTURALLY_UNSTABLE"
)
) {
fragilityPressure += 12;
}

if (executionStateScore < 40) {
fragilityPressure += 5;
}

fragilityPressure =
clamp(
fragilityPressure
);

/* ============================================================
* BREADTH EXHAUSTION
* ============================================================ */

const breadthExhaustion =
(
breadth50 >= 68 &&
participationScore < 55 &&
breadthDecay >= 25
) ||
(
breadthDecay >= 65 &&
participationScore < 45
) ||
(
breadthTrend < -4 &&
breadthAcceleration < -2
);

const breadthExhaustionScore =
clamp(
(
breadthDecay * 0.40 +
participationDecay * 0.35 +
Math.max(
0,
-breadthTrend
) * 5 +
Math.max(
0,
-breadthAcceleration
) * 5
)
);

/* ============================================================
* NARROW LEADERSHIP RISK
* ============================================================ */

const narrowLeadershipScore =
clamp(
(
narrowLeadership
? 40
: 0
) +
(
megaCapDistortion
? 25
: 0
) +
leadershipDecayPressure * 0.45 +
(
concentrationScore >= 82
? 20
: concentrationScore >= 70
? 10
: 0
) +
(
participationScore < 55
? 15
: 0
)
);

const narrowLeadershipRisk =
narrowLeadershipScore >= 45;

/* ============================================================
* INSTITUTIONAL DISTRIBUTION
* ============================================================ */

const institutionalDistribution =
(
(
narrowLeadership ||
megaCapDistortion
) &&

participationScore < 50 &&

rotationScore < 45 &&

(
hiddenDistribution ||
rotationDecayHistory >= 45 ||
institutionalPressure >= 55
)
)

||

(
rotationScore < 40 &&
participationScore < 45 &&
rotationDecayHistory >= 50
)

||

(
rotationDecayHistory >= 65 &&
participationScore <= 50
)

||

(
persistentDistribution &&
participationScore < 58
);

/* ============================================================
* DISTRIBUTION RISK
* ============================================================ */

let distributionRisk = 0;

if (narrowLeadershipRisk) {
distributionRisk += 20;
}

if (participationScore < 50) {
distributionRisk += 20;
}

if (rotationScore < 45) {
distributionRisk += 20;
}

if (hiddenDistribution) {
distributionRisk += 20;
}

if (institutionalPressure >= 55) {
distributionRisk += 10;
}

if (persistentDistribution) {
distributionRisk += 15;
}

if (breadthExhaustion) {
distributionRisk += 10;
}

if (executionStateRisk) {
distributionRisk += 5;
}

distributionRisk =
clamp(
distributionRisk
);

/* ============================================================
* CORE SCORE
* ============================================================ */

/*
* RotationDecay ist bewusst kein einfacher:
*
* 100 - participation
*
* Mehrere unabhängige Dimensionen müssen bestätigen,
* dass die Rotation tatsächlich an Qualität verliert.
*/

let score = 0;

score +=
participationDecay * 0.22;

score +=
breadthDecay * 0.14;

score +=
leadershipDecayPressure * 0.15;

score +=
divergencePressure * 0.10;

score +=
persistencePressure * 0.10;

score +=
structuralPressure * 0.08;

score +=
liquidityDependence * 0.07;

score +=
fragilityPressure * 0.08;

/*
* Direkte Distribution-Bestätigung.
*/

if (institutionalDistribution) {
score += 10;
}

if (breadthExhaustion) {
score += 5;
}

/*
* Starke Recovery reduziert Decay.
*/

if (rotationRecovery) {
score -= 10;
}

/*
* Gesunde Rotation erhält einen kleinen stabilisierenden Bonus.
*/

if (
participationScore >= 65 &&
breadth50 >= 65 &&
breadth200 >= 55 &&
rotationScore >= 60 &&
!narrowLeadership &&
!hiddenDistribution
) {
score -= 8;
}

score =
clamp(
Math.round(score)
);

/* ============================================================
* STATE
* ============================================================ */

let state:
| "HEALTHY_ROTATION"
| "MATURE_ROTATION"
| "FRAGILE_ROTATION"
| "NARROW_ROTATION"
| "DISTRIBUTION_ROTATION"
| "EXHAUSTED_ROTATION";

if (score >= 80) {

state =
"EXHAUSTED_ROTATION";

}

else if (
score >= 65 ||
institutionalDistribution ||
distributionRisk >= 70
) {

state =
"DISTRIBUTION_ROTATION";

}

else if (
score >= 50 ||
narrowLeadershipRisk ||
breadthExhaustion
) {

state =
"NARROW_ROTATION";

}

else if (
score >= 35
) {

state =
"FRAGILE_ROTATION";

}

else if (
score >= 20
) {

state =
"MATURE_ROTATION";

}

else {

state =
"HEALTHY_ROTATION";

}

/* ============================================================
* MOMENTUM QUALITY
* ============================================================ */

const momentumQuality =
clamp(
Math.round(
100 - score
)
);

/* ============================================================
* SUMMARY
* ============================================================ */

let summary =
"Healthy rotational structure";

if (
state ===
"MATURE_ROTATION"
) {

summary =
"Rotation maturing; internal participation beginning to soften";

}

if (
state ===
"FRAGILE_ROTATION"
) {

summary =
"Rotation becoming fragile; breadth and participation require confirmation";

}

if (
state ===
"NARROW_ROTATION"
) {

summary =
"Rotation increasingly dependent on narrow leadership";

}

if (
state ===
"DISTRIBUTION_ROTATION"
) {

summary =
"Distribution characteristics dominate the rotational structure";

}

if (
state ===
"EXHAUSTED_ROTATION"
) {

summary =
"Rotation exhausted; internal deterioration is broadly confirmed";

}

if (rotationRecovery) {

summary +=
" | Recovery attempt detected";

}

if (institutionalDistribution) {

summary +=
" | Institutional distribution";

}

if (hiddenDistribution) {

summary +=
" | Hidden distribution";

}

if (narrowLeadershipRisk) {

summary +=
" | Narrow leadership";

}

if (breadthExhaustion) {

summary +=
" | Breadth exhaustion";

}

/* ============================================================
* RETURN
* ============================================================ */

return {

score,

state,

momentumQuality,

participationScore,
breadthVelocityScore,
divergenceScore,

decayPersistence:
Math.round(
Math.max(
participationPersistence,
breadthVelocityPersistence
)
),

breadthExhaustion,
breadthExhaustionScore,

narrowLeadershipRisk,
narrowLeadershipScore,

institutionalDistribution,
distributionRisk,

rotationRecovery,
recoveryScore,

components: {

participationDecay:
Math.round(
participationDecay
),

breadthDecay:
Math.round(
breadthDecay
),

leadershipDecay:
Math.round(
leadershipDecayPressure
),

divergencePressure:
Math.round(
divergencePressure
),

persistencePressure:
Math.round(
persistencePressure
),

structuralPressure:
Math.round(
structuralPressure
),

liquidityDependence:
Math.round(
liquidityDependence
),

fragilityPressure:
Math.round(
fragilityPressure
)
},

history: {

phasePersistence,
daysInPhase,

participationDecay:
participationDecayHistory,

breadthTrend,
breadthAcceleration,
leadershipDecay,

relativeBreadthWeakness,
institutionalPressure,

averageBreadth,
averageParticipation,
averageRotation,
averageLiquidity,
averageFragility,

persistentDistribution,
prolongedBearRegime,
acceleratingWeakness
},

summary
};
}


