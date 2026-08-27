// /lib/engine/rotationDecayEngine.ts

/*
* ============================================================
* ROTATION DECAY ENGINE
* ============================================================
*
* Aufgabe:
*
* Misst ausschließlich die Qualität und Alterung der
* internen Marktrotation.
*
* Gesunde Rotation
* ↓
* Reife Rotation
* ↓
* Fragile Rotation
* ↓
* Narrow Leadership
* ↓
* Distribution
* ↓
* Exhausted Rotation
*
* WICHTIG:
*
* Hoher Score =
* Rotation verliert strukturell an Qualität.
*
* Der Engine bestimmt NICHT direkt:
*
* - Crash
* - Put/Call
* - finale Trade-Ausführung
*
* Diese Entscheidungen bleiben in den darüberliegenden
* Engines.
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
* ============================================================
*/

function clamp(
value: number,
min = 0,
max = 100
): number {
if (!Number.isFinite(value)) {
return min;
}

return Math.max(
min,
Math.min(max, value)
);
}


/*
* Robuster numerischer Wert.
*
* Unterstützt:
*
* 55
* { value: 55 }
* { score: 55 }
* { risk: 55 }
* { current: 55 }
*
* Wichtig:
*
* Direkte numerische Werte werden IMMER zuerst akzeptiert.
*/
function num(
value: unknown,
fallback = 0
): number {

if (
typeof value === "number" &&
Number.isFinite(value)
) {
return value;
}

if (
value !== null &&
typeof value === "object"
) {

const object =
value as Record<string, unknown>;

const candidates = [
object.value,
object.score,
object.risk,
object.current,
object.decay,
object.rotationDecay,
object.rotationDecayScore
];

for (
const candidate of candidates
) {

const numeric =
Number(candidate);

if (
Number.isFinite(numeric)
) {
return numeric;
}
}
}

return fallback;
}


/*
* Relative Strength.
*
* Direkte Werte haben Priorität.
*/
function relativeStrength(
directValue: unknown,
nestedValue: unknown,
fallback = 1
): number {

const direct =
Number(directValue);

if (
Number.isFinite(direct)
) {
return direct;
}

const nested =
Number(nestedValue);

if (
Number.isFinite(nested)
) {
return nested;
}

return fallback;
}


/*
* History-Wert.
*
* Unterstützt sowohl Einzelwerte als auch Arrays.
*/
function latestHistoryValue(
value: unknown,
fallback = 0
): number {

if (
Array.isArray(value)
) {

if (
value.length === 0
) {
return fallback;
}

const latest =
value[value.length - 1];

if (
latest !== null &&
typeof latest === "object"
) {

const object =
latest as Record<string, unknown>;

return num(
object.score ??
object.value ??
object.decay ??
object.rotationDecay ??
object.rotationDecayScore,
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
* ============================================================
*/

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

/* ==========================================================
* CURRENT STRUCTURE
* ==========================================================
*/

/*
* WICHTIG:
*
* Snapshot kann liefern:
*
* structure.breadth.b50 = 55.79
*
* oder:
*
* structure.breadth.b50.value = 55.79
*
* Beide Varianten müssen funktionieren.
*/

const breadth50 =
clamp(
num(
structure?.breadth?.b50,
inputBreadth50
),
0,
100
);

const breadth200 =
clamp(
num(
structure?.breadth?.b200,
inputBreadth200
),
0,
100
);


/* ==========================================================
* PARTICIPATION
* ==========================================================
*/

const participationScore =
clamp(
num(
participation?.score ??
participation,
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


/* ==========================================================
* BREADTH VELOCITY
* ==========================================================
*
* KONVENTION:
*
* breadthVelocity.score:
*
* 100 = starke Verschlechterung
* 50 = neutral
* 0 = starke positive Dynamik
*
* RotationDecay übernimmt diese Konvention.
*/

const breadthVelocityScore =
clamp(
num(
breadthVelocity?.score ??
breadthVelocity,
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
* Da BreadthVelocity bereits ein
* Verschlechterungs-Score ist, wird NICHT
* noch einmal 100 - score gerechnet.
*
* Das verhindert eine doppelte Invertierung.
*/

const breadthDecay =
breadthVelocityScore;


/* ==========================================================
* INTERNAL DIVERGENCE
* ==========================================================
*/

const divergenceScore =
clamp(
num(
internalDivergence?.score ??
internalDivergence,
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


/* ==========================================================
* ROTATION
* ==========================================================
*/

const rotationScore =
clamp(
num(
rotation?.score,
50
)
);

const rsSmall =
relativeStrength(
rotation?.rsSmall,
input?.rotation?.relativeStrength?.small,
1
);

const rsEqual =
relativeStrength(
rotation?.rsEqual,
input?.rotation?.relativeStrength?.equal,
1
);

const rsGrowth =
relativeStrength(
rotation?.rsGrowth,
input?.rotation?.relativeStrength?.growth,
1
);


/*
* Narrow leadership:
*
* Growth bleibt stark,
* während Small Caps und Equal Weight
* zurückbleiben.
*/

const narrowLeadership =
(
rsGrowth > 1.03 &&
rsSmall < 0.995 &&
rsEqual < 0.995
) ||
divergenceNarrowLeadership;


/*
* Mega-cap distortion:
*
* Noch stärker ausgeprägte Konzentration.
*/

const megaCapDistortion =
(
rsGrowth > 1.05 &&
rsSmall < 0.97 &&
rsEqual < 0.97
);


/* ==========================================================
* HISTORY
* ==========================================================
*/

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

const leadershipDecayHistory =
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

const rotationDecayHistory =
latestHistoryValue(
historyMetrics?.rotationDecayHistory,
0
);


/* ==========================================================
* EXECUTION CONTEXT
* ==========================================================
*
* Kein Trade-Entscheid.
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


/* ==========================================================
* RECOVERY DETECTION
* ==========================================================
*/

const recoveryConfidence =
clamp(
num(
regimeSync?.meta?.recoveryConfidence ??
regimeSync?.recoveryConfidence,
50
)
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
(
recoveryScore >= 62 &&
breadth50 >= 58 &&
participationScore >= 55 &&
rotationScore >= 52 &&
!hiddenDistribution &&
!participationCollapse
);


/* ==========================================================
* PARTICIPATION DECAY
* ==========================================================
*/

const participationDecay =
clamp(
100 - participationScore
);


/* ==========================================================
* LEADERSHIP DECAY
* ==========================================================
*/

let leadershipDecayPressure = 0;

/*
* Historischer Leadership-Decay.
*
* Nur negative Werte werden als echte Verschlechterung
* interpretiert.
*/

leadershipDecayPressure +=
Math.max(
0,
-leadershipDecayHistory
) * 5;

/*
* Aktuelle Narrow Leadership.
*/

if (
narrowLeadership
) {
leadershipDecayPressure += 30;
}

/*
* Starke Mega-Cap-Verzerrung.
*/

if (
megaCapDistortion
) {
leadershipDecayPressure += 20;
}

/*
* Relative Breadth Weakness verstärkt
* den Leadership-Druck.
*/

if (
relativeBreadthWeakness > 10
) {
leadershipDecayPressure += 8;
}

if (
relativeBreadthWeakness > 20
) {
leadershipDecayPressure += 8;
}

leadershipDecayPressure =
clamp(
leadershipDecayPressure
);


/* ==========================================================
* DIVERGENCE PRESSURE
* ==========================================================
*/

let divergencePressure =
divergenceSeverity * 0.65;

if (
hiddenDistribution
) {
divergencePressure += 25;
}

if (
participationCollapse
) {
divergencePressure += 20;
}

divergencePressure =
clamp(
divergencePressure
);


/* ==========================================================
* PERSISTENCE PRESSURE
* ==========================================================
*/

let persistencePressure = 0;

persistencePressure +=
clamp(
phasePersistence * 0.70,
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

if (
persistentDistribution
) {
persistencePressure += 15;
}

if (
prolongedBearRegime
) {
persistencePressure += 10;
}

if (
acceleratingWeakness
) {
persistencePressure += 12;
}

if (
rotationDecayHistory >= 45
) {
persistencePressure += 4;
}

if (
rotationDecayHistory >= 65
) {
persistencePressure += 6;
}

persistencePressure =
clamp(
persistencePressure
);


/* ==========================================================
* STRUCTURAL PRESSURE
* ==========================================================
*/

let structuralPressure = 0;

/*
* Current breadth.
*/

if (
breadth50 < 60
) {
structuralPressure +=
(60 - breadth50) * 0.80;
}

if (
breadth50 < 50
) {
structuralPressure += 8;
}

if (
breadth50 < 40
) {
structuralPressure += 12;
}

/*
* Long-term breadth.
*/

if (
breadth200 < 55
) {
structuralPressure +=
(55 - breadth200) * 0.45;
}

if (
breadth200 < 45
) {
structuralPressure += 8;
}

/*
* Historical averages.
*/

if (
averageBreadth < 55
) {
structuralPressure += 5;
}

if (
averageParticipation < 55
) {
structuralPressure += 5;
}

if (
averageRotation < 60
) {
structuralPressure += 4;
}

/*
* Relative Breadth Weakness.
*/

if (
relativeBreadthWeakness > 8
) {
structuralPressure += 5;
}

if (
relativeBreadthWeakness > 15
) {
structuralPressure += 7;
}

structuralPressure =
clamp(
structuralPressure
);


/* ==========================================================
* LIQUIDITY DEPENDENCE
* ==========================================================
*
* Nur relevant, wenn Liquidität selbst noch relativ
* gut aussieht, während Internals schwach werden.
*
* Dadurch erkennen wir:
*
* "Index hält sich trotz schlechter Internals".
*/

const liquidityScore =
clamp(
num(
liquidity?.score ??
liquidity,
marketLiquidityScore
)
);

let liquidityDependence = 0;

if (
liquidityScore >= 65
) {

if (
participationScore < 50
) {
liquidityDependence += 25;
}

if (
narrowLeadership
) {
liquidityDependence += 25;
}

if (
rotationScore < 45
) {
liquidityDependence += 20;
}

if (
breadth50 < 55
) {
liquidityDependence += 15;
}
}

/*
* Positive Gamma kann Volatilität künstlich
* unterdrücken.
*/

if (
gammaExposure > 0 &&
participationScore < 50 &&
narrowLeadership
) {
liquidityDependence += 10;
}

if (
executionStateRisk
) {
liquidityDependence += 5;
}

liquidityDependence =
clamp(
liquidityDependence
);


/* ==========================================================
* FRAGILITY PRESSURE
* ==========================================================
*
* Fragility ist ein Verstärker.
*
* Sie darf RotationDecay nicht alleine bestimmen.
*/

const fragilityScore =
clamp(
num(
fragility?.score ??
fragility,
50
)
);

let fragilityPressure =
Math.max(
0,
fragilityScore - 45
) * 0.65;

if (
vix >= 25
) {
fragilityPressure += 8;
}

if (
vix >= 30
) {
fragilityPressure += 10;
}

if (
creditRatio > 1.10
) {
fragilityPressure += 8;
}

if (
creditRatio > 1.20
) {
fragilityPressure += 10;
}

if (
averageFragility > 60
) {
fragilityPressure += 8;
}

if (
fragility?.state ===
"STRUCTURALLY_UNSTABLE"
) {
fragilityPressure += 12;
}

if (
executionStateScore < 40
) {
fragilityPressure += 5;
}

fragilityPressure =
clamp(
fragilityPressure
);


/* ==========================================================
* BREADTH EXHAUSTION
* ==========================================================
*/

const breadthExhaustion =
(
breadth50 >= 68 &&
participationScore < 55 &&
breadthDecay >= 65
) ||
(
breadthDecay >= 75 &&
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


/* ==========================================================
* NARROW LEADERSHIP RISK
* ==========================================================
*/

let narrowLeadershipScore =
0;

if (
narrowLeadership
) {
narrowLeadershipScore += 40;
}

if (
megaCapDistortion
) {
narrowLeadershipScore += 25;
}

narrowLeadershipScore +=
leadershipDecayPressure * 0.45;

if (
concentrationScore >= 82
) {
narrowLeadershipScore += 20;
}

else if (
concentrationScore >= 70
) {
narrowLeadershipScore += 10;
}

if (
participationScore < 55
) {
narrowLeadershipScore += 15;
}

narrowLeadershipScore =
clamp(
narrowLeadershipScore
);

const narrowLeadershipRisk =
narrowLeadershipScore >= 45;


/* ==========================================================
* INSTITUTIONAL DISTRIBUTION
* ==========================================================
*
* Distribution benötigt mehrere bestätigende Faktoren.
*/

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


/* ==========================================================
* DISTRIBUTION RISK
* ==========================================================
*/

let distributionRisk = 0;

if (
narrowLeadershipRisk
) {
distributionRisk += 20;
}

if (
participationScore < 50
) {
distributionRisk += 20;
}

if (
rotationScore < 45
) {
distributionRisk += 20;
}

if (
hiddenDistribution
) {
distributionRisk += 20;
}

if (
institutionalPressure >= 55
) {
distributionRisk += 10;
}

if (
persistentDistribution
) {
distributionRisk += 15;
}

if (
breadthExhaustion
) {
distributionRisk += 10;
}

if (
executionStateRisk
) {
distributionRisk += 5;
}

distributionRisk =
clamp(
distributionRisk
);


/* ==========================================================
* CORE DECAY SCORE
* ==========================================================
*
* Keine einzelne Dimension darf den Score dominieren.
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

if (
institutionalDistribution
) {
score += 10;
}

if (
breadthExhaustion
) {
score += 5;
}


/*
* Starke Recovery reduziert Decay.
*/

if (
rotationRecovery
) {
score -= 12;
}


/*
* Gesunde Rotation erhält einen kleinen Bonus.
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


/*
* Bei sehr stabiler historischer Struktur darf
* ein einzelner schlechter Tageswert nicht sofort
* einen extremen Decay erzeugen.
*/

if (
averageBreadth >= 65 &&
averageParticipation >= 65 &&
averageRotation >= 60 &&
!institutionalDistribution &&
!breadthExhaustion
) {
score -= 5;
}


score =
clamp(
Math.round(score)
);


/* ==========================================================
* STATE
* ==========================================================
*
* Hier zählt nicht nur der numerische Score.
*
* Aber:
*
* Fragility allein erzeugt keinen EXHAUSTED-Zustand.
*/

let state:
| "HEALTHY_ROTATION"
| "MATURE_ROTATION"
| "FRAGILE_ROTATION"
| "NARROW_ROTATION"
| "DISTRIBUTION_ROTATION"
| "EXHAUSTED_ROTATION";


/*
* EXHAUSTED:
*
* Nur bei sehr hoher Decay-Belastung
* und mehreren Bestätigungen.
*/

if (
score >= 80 &&
(
institutionalDistribution ||
breadthExhaustion
) &&
(
participationScore < 45 ||
narrowLeadershipRisk
)
) {

state =
"EXHAUSTED_ROTATION";

}

/*
* DISTRIBUTION:
*/

else if (
score >= 65 ||
(
institutionalDistribution &&
distributionRisk >= 60
)
) {

state =
"DISTRIBUTION_ROTATION";

}

/*
* NARROW:
*/

else if (
score >= 50 ||
narrowLeadershipRisk ||
breadthExhaustion
) {

state =
"NARROW_ROTATION";

}

/*
* FRAGILE:
*/

else if (
score >= 35
) {

state =
"FRAGILE_ROTATION";

}

/*
* MATURE:
*/

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


/* ==========================================================
* MOMENTUM QUALITY
* ==========================================================
*/

const momentumQuality =
clamp(
Math.round(
100 - score
)
);


/* ==========================================================
* SUMMARY
* ==========================================================
*/

let summary =
"Healthy rotational structure";

if (
state ===
"MATURE_ROTATION"
) {

summary =
"Rotation maturing; internal participation beginning to soften";

}

else if (
state ===
"FRAGILE_ROTATION"
) {

summary =
"Rotation becoming fragile; breadth and participation require confirmation";

}

else if (
state ===
"NARROW_ROTATION"
) {

summary =
"Rotation increasingly dependent on narrow leadership";

}

else if (
state ===
"DISTRIBUTION_ROTATION"
) {

summary =
"Distribution characteristics dominate the rotational structure";

}

else if (
state ===
"EXHAUSTED_ROTATION"
) {

summary =
"Rotation exhausted; internal deterioration is broadly confirmed";

}


if (
rotationRecovery
) {

summary +=
" | Recovery attempt detected";

}

if (
institutionalDistribution
) {

summary +=
" | Institutional distribution";

}

if (
hiddenDistribution
) {

summary +=
" | Hidden distribution";

}

if (
narrowLeadershipRisk
) {

summary +=
" | Narrow leadership";

}

if (
breadthExhaustion
) {

summary +=
" | Breadth exhaustion";

}


/* ==========================================================
* RETURN
* ==========================================================
*/

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

leadershipDecay:
leadershipDecayHistory,

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
