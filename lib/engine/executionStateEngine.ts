export interface ExecutionStateInput {
regimeSignal?: string;

crashProbability: number;
dangerScore: number;
stressScore: number;

rotationSignal?: string;
rotationStrength: number;

breadth200: number;
breadth50: number;

gammaExposure: number;
liquidityScore: number;

volatilityState?: string;

regimeSyncScore?: number;
regimeSyncState?: string;

confidence?: number;

rotationDecayScore?: number;
fragilityScore?: number;
participationScore?: number;
falseBreakRisk?: number;
squeezeRisk?: number;

narrowLeadership?: boolean;
divergenceState?: string;

internalDivergence?: any;
regimePersistence?: any;

concentrationScore?: number;
vix?: number;

/*
* Optional contextual input.
*
* IMPORTANT:
* masterScore is intentionally NOT used to determine
* the primary market regime. This avoids a circular
* dependency:
*
* executionState -> master -> executionState
*/
masterScore?: number;
}

export interface ExecutionStateOutput {
marketMode:
| "RISK_ON"
| "RISK_OFF"
| "TRANSITION"
| "DEFENSIVE_TRANSITION"
| "AI_EXPANSION"
| "ROTATIONAL_STRESS"
| "INTERNAL_DISTRIBUTION"
| "VOLATILE_EXPANSION"
| "LATE_CYCLE_MELTUP";

tacticalBias:
| "LONG_SMALL_CAPS"
| "LONG_TECH"
| "DEFENSIVE"
| "SHORT_INDEX"
| "NEUTRAL";

riskState:
| "STABLE"
| "FRAGILE"
| "INTERNAL_BREAKDOWN"
| "BREAKDOWN"
| "CRISIS";

executionMode:
| "ADD_ON_PULLBACKS"
| "BUILD_POSITION"
| "REDUCE_RISK"
| "DEFENSIVE"
| "WAIT";

urgency:
| "LOW"
| "MEDIUM"
| "HIGH"
| "EXTREME";

confidence: number;

regimeAlignment: boolean;

summary: string;
}

export function executionStateEngine(
input: ExecutionStateInput
): ExecutionStateOutput {

const {
regimeSignal: rawRegimeSignal,

crashProbability,
dangerScore,
stressScore,

rotationSignal = "neutral",
rotationStrength,

breadth200,
breadth50,

gammaExposure,
liquidityScore,

volatilityState = "NORMAL",

regimeSyncScore = 50,
regimeSyncState = "TRANSITION",

confidence = 50,

rotationDecayScore = 0,
fragilityScore = 50,
participationScore = 50,
falseBreakRisk = 50,
squeezeRisk = 0,

narrowLeadership = false,
divergenceState = "NONE",

internalDivergence = {},
regimePersistence = {},

concentrationScore = 50,
vix = 20,

masterScore: _masterScore = 50

} = input;

/* =====================================================
SAFE REGIME
===================================================== */

const regimeSignal =
typeof rawRegimeSignal === "string"
? rawRegimeSignal
: "NEUTRAL";


/* =====================================================
INTERNAL DIVERGENCE
===================================================== */

const divergenceSeverity =
Number(
internalDivergence?.severity ?? 0
);

const internalState =
internalDivergence?.state ?? "NONE";

const hiddenDistribution =
internalDivergence?.hiddenDistribution ?? false;

const participationCollapse =
internalDivergence?.participationCollapse ?? false;

const internalNarrowLeadership =
internalDivergence?.narrowLeadership ?? false;


/* =====================================================
REGIME PERSISTENCE
===================================================== */

const persistenceScore =
Number(
regimePersistence?.score ?? 50
);

const persistenceState =
regimePersistence?.state ?? "NEUTRAL";

const persistentWeakness =
regimePersistence?.persistentWeakness ?? false;

const persistentDistribution =
regimePersistence?.persistentDistribution ?? false;

const persistentRisk =
regimePersistence?.persistentRisk ?? false;

const failedRecovery =
regimePersistence?.failedRecovery ?? false;

const bounceLikelyTemporary =
regimePersistence?.bounceLikelyTemporary ?? false;

const recoveryConfidence =
Number(
regimePersistence?.recoveryConfidence ?? 50
);


/* =====================================================
DIVERGENCE CLASSIFICATION
===================================================== */

const bearishDivergence =
divergenceState === "BEARISH_DIVERGENCE" ||
internalState === "HIDDEN_DISTRIBUTION" ||
divergenceSeverity >= 40;


const bullishDivergence =
divergenceState === "BULLISH_DIVERGENCE" &&
divergenceSeverity < 40;


/* =====================================================
LEADERSHIP / CONCENTRATION
===================================================== */

const effectiveNarrowLeadership =
narrowLeadership ||
internalNarrowLeadership;


const aiLeadershipFragility =
concentrationScore >= 82 &&
effectiveNarrowLeadership &&
participationScore < 58;


/* =====================================================
ROTATIONAL COMPRESSION
===================================================== */

const rotationalCompression =
rotationDecayScore >= 38 &&
rotationDecayScore < 65 &&
participationScore < 58 &&
breadth50 > 52;


/* =====================================================
EXPANSION EXHAUSTION
===================================================== */

const expansionExhaustion =
breadth50 > 68 &&
participationScore < 55 &&
rotationDecayScore >= 42;


/* =====================================================
INSTITUTIONAL DISTRIBUTION
===================================================== */

const institutionalDistribution =
effectiveNarrowLeadership &&
participationScore < 50 &&
rotationDecayScore >= 45 &&
(
hiddenDistribution ||
persistentDistribution
);


/* =====================================================
VOLATILE EXPANSION
===================================================== */

const volatileExpansion =
vix >= 22 &&
vix < 35 &&
breadth50 > 58 &&
breadth200 > 52 &&
liquidityScore > 55 &&
!persistentDistribution &&
!institutionalDistribution;


/* =====================================================
LATE CYCLE MELT-UP
===================================================== */

const lateCycleMeltup =
aiLeadershipFragility &&
liquidityScore >= 65 &&
vix < 18 &&
breadth50 > 62 &&
gammaExposure > 0 &&
participationScore >= 50 &&
!persistentDistribution &&
!institutionalDistribution;


/* =====================================================
DEFENSIVE TRANSITION

IMPORTANT:
No masterScore dependency.

This prevents:

executionState
↓
master
↓
executionState

Instead the transition is derived from
independent structural/risk information.
===================================================== */

const defensiveTransition =
(
participationScore < 45 ||
participationCollapse ||
persistentWeakness ||
failedRecovery
) &&
rotationDecayScore >= 35 &&
(
fragilityScore >= 55 ||
dangerScore >= 45 ||
persistentRisk ||
bearishDivergence
);


/* =====================================================
STRUCTURAL WEAKNESS
===================================================== */

const structuralWeakness =
breadth50 < 58 ||
breadth200 < 50 ||
participationScore < 55 ||
effectiveNarrowLeadership ||
bearishDivergence ||
rotationalCompression ||
expansionExhaustion ||
hiddenDistribution ||
institutionalDistribution ||
divergenceSeverity >= 35 ||
persistentWeakness ||
persistentDistribution ||
persistentRisk ||
failedRecovery;


/* =====================================================
CONFIRMED BREAKDOWN
===================================================== */

const confirmedBreakdown =
rotationDecayScore >= 60 &&
(
participationScore < 40 ||
participationCollapse
) &&
breadth50 < 45;


/* =====================================================
INTERNAL BREAKDOWN

Important distinction:

weak internals + low crash probability
does NOT automatically mean market crash.

It means internal deterioration.
===================================================== */

const internalBreakdown =
(
participationScore < 40 ||
participationCollapse
) &&
(
effectiveNarrowLeadership ||
hiddenDistribution ||
bearishDivergence
) &&
crashProbability < 30;


/* =====================================================
PERSISTENT DISTRIBUTION
===================================================== */

const persistentDistributionRegime =
persistentDistribution &&
rotationDecayScore >= 38 &&
participationScore < 58;


/* =====================================================
FRAGILE REGIME
===================================================== */

const fragileRegime =
(
fragilityScore > 50 &&
participationScore < 50 &&
rotationDecayScore >= 30
) ||
bounceLikelyTemporary;


/* =====================================================
CRISIS / BREAKDOWN / FRAGILE
===================================================== */

let riskState:
| "STABLE"
| "FRAGILE"
| "INTERNAL_BREAKDOWN"
| "BREAKDOWN"
| "CRISIS";


/* =====================================================
CRISIS
===================================================== */

if (

crashProbability >= 70 ||

dangerScore >= 82 ||

stressScore >= 8.5 ||

rotationDecayScore >= 75 ||

fragilityScore >= 85 ||

divergenceSeverity >= 70 ||

(
persistentRisk &&
persistenceScore >= 80
) ||

(
structuralWeakness &&
rotationDecayScore >= 70 &&
breadth50 < 45
)

) {

riskState = "CRISIS";

}


/* =====================================================
INTERNAL BREAKDOWN
===================================================== */

else if (

internalBreakdown &&

rotationDecayScore >= 50 &&

fragilityScore < 70

) {

riskState = "INTERNAL_BREAKDOWN";

}


/* =====================================================
BREAKDOWN
===================================================== */

else if (

(
crashProbability >= 40 &&
breadth50 < 45
) ||

dangerScore >= 65 ||

stressScore >= 6.5 ||

fragilityScore >= 70 ||

confirmedBreakdown ||

divergenceSeverity >= 55 ||

(
persistentRisk &&
persistenceScore >= 65
) ||

(
structuralWeakness &&
rotationDecayScore >= 65 &&
participationScore < 42 &&
breadth50 < 45
)

) {

riskState = "BREAKDOWN";

}


/* =====================================================
FRAGILE
===================================================== */

else if (

fragileRegime ||

crashProbability >= 30 ||

dangerScore >= 45 ||

stressScore >= 4.5 ||

rotationDecayScore >= 24 ||

fragilityScore >= 55 ||

structuralWeakness ||

hiddenDistribution ||

institutionalDistribution ||

divergenceSeverity >= 30 ||

persistentWeakness ||

persistentDistribution ||

bounceLikelyTemporary

) {

riskState = "FRAGILE";

}


/* =====================================================
STABLE
===================================================== */

else {

riskState = "STABLE";

}


/* =====================================================
HARD RISK STATE

Centralized because the following MARKET MODE
branches are evaluated after the hard-risk branch.
This also prevents TypeScript control-flow
narrowing errors.
===================================================== */

const hardRiskOff =
riskState === "CRISIS" ||
riskState === "BREAKDOWN";


/* =====================================================
HEALTHY EXPANSION
===================================================== */

const healthyExpansion =

breadth50 > 62 &&

breadth200 > 55 &&

participationScore >= 60 &&

rotationDecayScore < 28 &&

!effectiveNarrowLeadership &&

!bearishDivergence &&

!hiddenDistribution &&

!institutionalDistribution &&

!persistentWeakness &&

!persistentDistribution &&

!persistentRisk &&

!failedRecovery &&

!bounceLikelyTemporary &&

recoveryConfidence >= 60;


/* =====================================================
MARKET MODE
===================================================== */

let marketMode:
| "RISK_ON"
| "RISK_OFF"
| "TRANSITION"
| "DEFENSIVE_TRANSITION"
| "AI_EXPANSION"
| "ROTATIONAL_STRESS"
| "INTERNAL_DISTRIBUTION"
| "VOLATILE_EXPANSION"
| "LATE_CYCLE_MELTUP";


/* =====================================================
1. HARD RISK OFF
===================================================== */

if (

hardRiskOff

) {

marketMode = "RISK_OFF";

}


/* =====================================================
2. DEFENSIVE TRANSITION
===================================================== */

else if (

defensiveTransition &&

!hardRiskOff

) {

marketMode = "DEFENSIVE_TRANSITION";

}


/* =====================================================
3. INTERNAL DISTRIBUTION
===================================================== */

else if (

institutionalDistribution ||

expansionExhaustion ||

hiddenDistribution ||

persistentDistributionRegime ||

divergenceSeverity >= 40 ||

(
bearishDivergence &&
rotationDecayScore >= 40
) ||

(
rotationDecayScore >= 45 &&
participationScore < 55 &&
breadth50 > 60
)

) {

marketMode = "INTERNAL_DISTRIBUTION";

}


/* =====================================================
4. ROTATIONAL STRESS
===================================================== */

else if (

rotationalCompression ||

persistentWeakness

) {

marketMode = "ROTATIONAL_STRESS";

}


/* =====================================================
5. AI EXPANSION
===================================================== */

else if (

aiLeadershipFragility &&

!hardRiskOff &&

liquidityScore >= 60 &&

!persistentDistribution &&

!institutionalDistribution

) {

marketMode = "AI_EXPANSION";

}


/* =====================================================
6. LATE CYCLE MELT-UP
===================================================== */

else if (

lateCycleMeltup &&

!hardRiskOff

) {

marketMode = "LATE_CYCLE_MELTUP";

}


/* =====================================================
7. VOLATILE EXPANSION
===================================================== */

else if (

volatileExpansion &&

!hardRiskOff

) {

marketMode = "VOLATILE_EXPANSION";

}


/* =====================================================
8. HEALTHY RISK ON
===================================================== */

else if (

regimeSignal.includes("RISK_ON") &&

riskState === "STABLE" &&

healthyExpansion

) {

marketMode = "RISK_ON";

}


/* =====================================================
9. RISK OFF SIGNAL
===================================================== */

else if (

regimeSignal.includes("RISK_OFF") &&

riskState !== "STABLE"

) {

marketMode = "RISK_OFF";

}


/* =====================================================
10. TRANSITION
===================================================== */

else {

marketMode = "TRANSITION";

}


/* =====================================================
TACTICAL BIAS
===================================================== */

let tacticalBias:
| "LONG_SMALL_CAPS"
| "LONG_TECH"
| "DEFENSIVE"
| "SHORT_INDEX"
| "NEUTRAL";


if (

marketMode === "RISK_ON" &&

rotationSignal === "strong_risk_on" &&

rotationStrength >= 72 &&

participationScore >= 65 &&

liquidityScore >= 60 &&

!effectiveNarrowLeadership &&

!hiddenDistribution &&

!institutionalDistribution &&

!persistentWeakness &&

!persistentDistribution

) {

tacticalBias = "LONG_SMALL_CAPS";

}


else if (

marketMode === "RISK_ON" ||

marketMode === "AI_EXPANSION" ||

marketMode === "LATE_CYCLE_MELTUP"

) {

tacticalBias = "LONG_TECH";

}


else if (

riskState === "CRISIS"

) {

tacticalBias = "SHORT_INDEX";

}


else if (

marketMode === "RISK_OFF" ||

marketMode === "DEFENSIVE_TRANSITION" ||

marketMode === "INTERNAL_DISTRIBUTION" ||

riskState === "INTERNAL_BREAKDOWN"

) {

tacticalBias = "DEFENSIVE";

}


else {

tacticalBias = "NEUTRAL";

}


/* =====================================================
EXECUTION MODE
===================================================== */

let executionMode:
| "ADD_ON_PULLBACKS"
| "BUILD_POSITION"
| "REDUCE_RISK"
| "DEFENSIVE"
| "WAIT";


/* =====================================================
INSTITUTIONAL CONDITIONS
===================================================== */

const institutionalConditions = (

(
marketMode === "RISK_ON" ||
marketMode === "AI_EXPANSION"
) &&

regimeSyncState === "ALIGNED" &&

breadth200 > 64 &&
breadth50 > 70 &&

liquidityScore > 65 &&

participationScore >= 66 &&

rotationDecayScore < 22 &&

fragilityScore < 42 &&

falseBreakRisk < 55 &&

squeezeRisk < 60 &&

gammaExposure > 0 &&

!effectiveNarrowLeadership &&

!bearishDivergence &&

!hiddenDistribution &&

!institutionalDistribution &&

!persistentWeakness &&

!persistentDistribution &&

!bounceLikelyTemporary &&

divergenceSeverity < 25 &&

recoveryConfidence >= 70 &&

riskState === "STABLE" &&

confidence >= 72

);


if (

institutionalConditions

) {

executionMode =
"ADD_ON_PULLBACKS";

}


/* =====================================================
BUILD POSITION
===================================================== */

else if (

(
marketMode === "RISK_ON" ||
marketMode === "AI_EXPANSION" ||
marketMode === "VOLATILE_EXPANSION"
) &&

breadth50 > 58 &&

liquidityScore > 52 &&

participationScore >= 55 &&

rotationDecayScore < 40 &&

!hiddenDistribution &&

!institutionalDistribution &&

!persistentWeakness &&

!persistentDistribution &&

riskState !== "BREAKDOWN" &&

riskState !== "CRISIS"

) {

executionMode =
"BUILD_POSITION";

}


/* =====================================================
DEFENSIVE
===================================================== */

else if (

riskState === "CRISIS" ||

marketMode === "RISK_OFF"

) {

executionMode =
"DEFENSIVE";

}


/* =====================================================
REDUCE RISK
===================================================== */

else if (

riskState === "BREAKDOWN" ||

riskState === "INTERNAL_BREAKDOWN" ||

marketMode === "INTERNAL_DISTRIBUTION" ||

marketMode === "DEFENSIVE_TRANSITION"

) {

executionMode =
"REDUCE_RISK";

}


/* =====================================================
WAIT
===================================================== */

else {

executionMode =
"WAIT";

}


/* =====================================================
URGENCY
===================================================== */

let urgency:
| "LOW"
| "MEDIUM"
| "HIGH"
| "EXTREME";


if (

dangerScore >= 85 ||

stressScore >= 9 ||

rotationDecayScore >= 70 ||

divergenceSeverity >= 70 ||

(
persistentRisk &&
persistenceScore >= 80
)

) {

urgency = "EXTREME";

}


else if (

dangerScore >= 70 ||

rotationDecayScore >= 55 ||

divergenceSeverity >= 50 ||

persistentDistribution ||

institutionalDistribution ||

marketMode === "DEFENSIVE_TRANSITION" ||

marketMode === "INTERNAL_DISTRIBUTION" ||

riskState === "INTERNAL_BREAKDOWN"

) {

urgency = "HIGH";

}


else if (

dangerScore >= 50 ||

rotationDecayScore >= 24 ||

structuralWeakness ||

hiddenDistribution ||

persistentWeakness ||

failedRecovery

) {

urgency = "MEDIUM";

}


else {

urgency = "LOW";

}


/* =====================================================
REGIME ALIGNMENT
===================================================== */

const regimeAlignment = (

regimeSyncScore >= 70 &&

breadth50 > 60 &&

breadth200 > 54 &&

liquidityScore > 58 &&

participationScore > 58 &&

rotationDecayScore < 30 &&

gammaExposure > 0 &&

!effectiveNarrowLeadership &&

!bearishDivergence &&

!hiddenDistribution &&

!institutionalDistribution &&

!persistentWeakness &&

!persistentDistribution &&

!persistentRisk &&

recoveryConfidence >= 60 &&

riskState === "STABLE"

);


/* =====================================================
CONFIDENCE
===================================================== */

let finalConfidence =
Number(confidence ?? 50);


if (regimeAlignment) {
finalConfidence += 10;
}

if (marketMode === "AI_EXPANSION") {
finalConfidence += 4;
}

if (marketMode === "LATE_CYCLE_MELTUP") {
finalConfidence -= 6;
}

if (marketMode === "ROTATIONAL_STRESS") {
finalConfidence -= 8;
}

if (marketMode === "DEFENSIVE_TRANSITION") {
finalConfidence -= 12;
}

if (marketMode === "INTERNAL_DISTRIBUTION") {
finalConfidence -= 10;
}

if (marketMode === "VOLATILE_EXPANSION") {
finalConfidence -= 4;
}

if (riskState === "CRISIS") {
finalConfidence -= 30;
}

if (riskState === "BREAKDOWN") {
finalConfidence -= 20;
}

if (riskState === "INTERNAL_BREAKDOWN") {
finalConfidence -= 14;
}

if (rotationDecayScore >= 50) {
finalConfidence -= 15;
}

if (rotationDecayScore >= 70) {
finalConfidence -= 20;
}

if (fragilityScore >= 70) {
finalConfidence -= 15;
}

if (liquidityScore < 40) {
finalConfidence -= 10;
}

if (participationScore < 45) {
finalConfidence -= 12;
}

if (gammaExposure < 0) {
finalConfidence -= 10;
}

if (effectiveNarrowLeadership) {
finalConfidence -= 12;
}

if (bullishDivergence) {
finalConfidence += 4;
}

if (bearishDivergence) {
finalConfidence -= 10;
}

if (hiddenDistribution) {
finalConfidence -= 12;
}

if (institutionalDistribution) {
finalConfidence -= 18;
}

if (persistentWeakness) {
finalConfidence -= 14;
}

if (persistentDistribution) {
finalConfidence -= 16;
}

if (persistentRisk) {
finalConfidence -= 12;
}

if (failedRecovery) {
finalConfidence -= 10;
}

if (bounceLikelyTemporary) {
finalConfidence -= 8;
}

finalConfidence -=
Math.round(
divergenceSeverity * 0.22
);


finalConfidence = Math.max(
0,
Math.min(
100,
Math.round(finalConfidence)
)
);


/* =====================================================
SUMMARY
===================================================== */

let summary =
`${marketMode} | ${tacticalBias} | ${riskState}`;


if (marketMode === "DEFENSIVE_TRANSITION") {
summary +=
" | Defensive institutional transition";
}

if (aiLeadershipFragility) {
summary +=
" | AI leadership fragility";
}

if (rotationalCompression) {
summary +=
" | Rotational compression";
}

if (expansionExhaustion) {
summary +=
" | Expansion exhaustion";
}

if (volatileExpansion) {
summary +=
" | Volatile expansion";
}

if (lateCycleMeltup) {
summary +=
" | Late-cycle melt-up";
}

if (institutionalDistribution) {
summary +=
" | Institutional distribution";
}

if (internalBreakdown) {
summary +=
" | Internal breakdown";
}

if (hiddenDistribution) {
summary +=
" | Hidden distribution";
}

if (persistentWeakness) {
summary +=
" | Persistent weakness";
}

if (persistentDistribution) {
summary +=
" | Persistent institutional distribution";
}

if (persistentRisk) {
summary +=
" | Persistent risk";
}

if (failedRecovery) {
summary +=
" | Failed recovery rally";
}

if (bounceLikelyTemporary) {
summary +=
" | Bounce likely temporary";
}

if (effectiveNarrowLeadership) {
summary +=
" | Narrow leadership";
}

if (bearishDivergence) {
summary +=
" | Bearish divergence";
}

if (bullishDivergence) {
summary +=
" | Bullish divergence";
}


/* =====================================================
RETURN
===================================================== */

return {

marketMode,

tacticalBias,

riskState,

executionMode,

urgency,

confidence:
finalConfidence,

regimeAlignment,

summary

};

}
