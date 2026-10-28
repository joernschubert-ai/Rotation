// /lib/engine/executionEngine.ts

export function executionEngine(input: any) {

const {
superSignal,
vix,
breadth20,
breadth50,
crash,
phase,

/* 🔥 EXISTING */
executionState = {},
dangerZone = {},
regimeSync = {},
rotationConfirm = {},

/* 🔥 NEW */
liquidity = {},
breadthThrust = {},
fragility = {},
squeeze = {},
participation = {}
} = input;

/* =====================================================
SAFE ACCESS
===================================================== */

const executionMode =
executionState?.executionMode ?? "WAIT";

const tacticalBias =
executionState?.tacticalBias ?? "NEUTRAL";

const riskState =
executionState?.riskState ?? "STABLE";

const regimeAlignment =
executionState?.regimeAlignment ?? false;

const dangerLevel =
dangerZone?.level ?? "LOW";

const escalation =
dangerZone?.escalation ?? false;

const regimeAligned =
regimeSync?.aligned ?? false;

const syncScore =
regimeSync?.score ?? 50;

const regimeState =
regimeSync?.state ?? "STABLE";

/* =====================================================
ROTATION QUALITY
===================================================== */

const rotationState =
rotationConfirm?.state ?? "EARLY";

const rotationConfidence =
rotationConfirm?.confidence ?? 40;

/* =====================================================
NEW ENGINES
===================================================== */

const liquidityScore =
Number(liquidity?.score ?? 50);

const liquidityState =
liquidity?.state ?? "NORMAL";

const thrustActive =
breadthThrust?.active ?? false;

const thrustStrength =
Number(
breadthThrust?.strength ?? 0
);

const fragilityScore =
Number(fragility?.score ?? 50);

const fragilityState =
fragility?.state ?? "NORMAL";

const squeezeRisk =
Number(squeeze?.risk ?? 0);

const squeezeState =
squeeze?.state ?? "NORMAL";

const participationScore =
Number(participation?.score ?? 50);

const participationState =
participation?.state ?? "NARROW";

/* =====================================================
BREAKDOWN CLUSTERS
===================================================== */

const structuralCluster = (

riskState === "BREAKDOWN" ||

regimeState === "BREAKDOWN" ||

fragilityState === "EXTREME" ||

fragilityScore >= 85

);

const participationCluster = (

participationScore < 35 &&

participationState !== "BROAD"

);

const liquidityCluster = (

liquidityScore < 28 ||

liquidityState === "STRESSED"

);

const volatilityCluster = (

vix > 32 ||

squeezeRisk >= 85 ||

squeezeState === "EXTREME"

);

const crashCluster = (

(crash?.score ?? 0) >= 70

);

const breakdownClusters = [

structuralCluster,
participationCluster,
liquidityCluster,
volatilityCluster,
crashCluster

].filter(Boolean).length;

/* =====================================================
BASE
===================================================== */

let action = "WAIT";
let mode = "NONE";
let note = "";

/* =====================================================
EXTREME RISK FILTER
===================================================== */

if (
escalation &&
dangerLevel === "EXTREME" &&
breakdownClusters >= 3
) {

return {
action: "DEFENSIVE",
mode: "RISK_OFF",

note:
"Extreme synchronized breakdown active",

quality: "DEFENSIVE",

institutionalAlignment: false
};
}

/* =====================================================
CONFIRMED BREAKDOWN ONLY
===================================================== */

const confirmedBreakdown = (

breakdownClusters >= 3 &&

(
syncScore < 35 ||
regimeState === "BREAKDOWN"
) &&

(
riskState === "BREAKDOWN" ||
fragilityScore >= 80 ||
(crash?.score ?? 0) >= 65
)

);

if (confirmedBreakdown) {

return {
action: "REDUCE RISK",
mode: "DEFENSIVE",

note:
"Multi-cluster breakdown confirmed",

quality: "RISK_OFF",

institutionalAlignment: false
};
}

/* =====================================================
FRAGILITY FILTER
===================================================== */

if (

fragilityScore > 75 &&

(
participationScore < 45 ||
liquidityScore < 45
)

) {

return {
action: "REDUCE AGGRESSIVELY",
mode: "FRAGILE",

note:
"Fragility confirmed by weak internals",

quality: "LOW",

institutionalAlignment: false
};
}

/* =====================================================
NO SIGNAL
===================================================== */

if (!superSignal?.active) {

if (
executionMode === "ADD_ON_PULLBACKS" &&
regimeAlignment
) {

return {
action: "WAIT FOR PULLBACK",
mode: "TREND",

note:
"Strong regime but no trigger",

quality: "INSTITUTIONAL",

institutionalAlignment: true
};
}

return {
action: "NO TRADE",
mode: "NONE",

note:
"No valid signal",

quality: "LOW",

institutionalAlignment: false
};
}

/* =====================================================
INSTITUTIONAL TREND
===================================================== */

const institutionalTrend = (

regimeAligned &&
regimeAlignment &&
syncScore >= 75 &&

rotationState === "CONFIRMED" &&
rotationConfidence >= 80 &&

liquidityScore >= 65 &&

participationScore >= 65 &&

fragilityScore < 45 &&

squeezeRisk < 60

);

/* =====================================================
HIGH QUALITY BREAKOUT
===================================================== */

if (

superSignal.trigger &&

institutionalTrend &&

thrustActive &&

thrustStrength >= 70 &&

vix < 20 &&
breadth50 > 0.8 &&
(crash?.score ?? 0) < 20 &&

executionMode === "ADD_ON_PULLBACKS"

) {

return {
action: "ENTER AGGRESSIVE",
mode: "INSTITUTIONAL_BREAKOUT",

note:
"Institutional-quality breakout confirmed",

quality: "INSTITUTIONAL",

institutionalAlignment: true
};
}

/* =====================================================
LIQUIDITY FILTER
===================================================== */

if (
liquidityScore < 35 ||
liquidityState === "STRESSED"
) {

return {
action: "SMALL SIZE ONLY",
mode: "LOW_LIQUIDITY",

note:
"Liquidity conditions weak",

quality: "TACTICAL",

institutionalAlignment: false
};
}

/* =====================================================
SQUEEZE FILTER
===================================================== */

if (
squeezeRisk >= 70 ||
squeezeState === "EXTREME"
) {

return {
action: "SMALL SIZE ONLY",
mode: "SQUEEZE_RISK",

note:
"Squeeze risk elevated",

quality: "TACTICAL",

institutionalAlignment: false
};
}

/* =====================================================
PARTICIPATION FILTER
===================================================== */

if (
participationScore < 45 &&
!thrustActive
) {

return {
action: "WAIT",
mode: "NARROW_MARKET",

note:
"Participation too narrow",

quality: "LOW",

institutionalAlignment: false
};
}

/* =====================================================
PULLBACK ADDING
===================================================== */

if (
superSignal.active &&
institutionalTrend &&
vix >= 18 &&
vix <= 25 &&
breadth20 < breadth50
) {

return {
action: "ADD ON PULLBACK",
mode: "TREND ADD",

note:
"Institutional pullback entry",

quality: "HIGH",

institutionalAlignment: true
};
}

/* =====================================================
EARLY BUILD
===================================================== */

if (
superSignal.active &&
rotationState === "CONFIRMING"
) {

return {
action: "START BUILD",
mode: "EARLY_ROTATION",

note:
"Rotation improving but not fully confirmed",

quality: "MEDIUM",

institutionalAlignment: false
};
}

/* =====================================================
TACTICAL LONG
===================================================== */

if (
superSignal.active &&
rotationState === "EARLY"
) {

return {
action: "SMALL POSITION",
mode: "TACTICAL",

note:
"Early participation only",

quality: "TACTICAL",

institutionalAlignment: false
};
}

/* =====================================================
TACTICAL SHORT
===================================================== */

if (
tacticalBias === "SHORT_INDEX" &&
riskState !== "STABLE"
) {

return {
action: "SHORT RALLIES",
mode: "DEFENSIVE_SHORT",

note:
"Crisis regime active",

quality: "HIGH",

institutionalAlignment: false
};
}

/* =====================================================
DEFAULT TREND
===================================================== */

return {
action: "HOLD / SCALE",
mode: "TREND",

note:
"Trend intact",

quality:
institutionalTrend
? "HIGH"
: "MEDIUM",

institutionalAlignment:
institutionalTrend
};

}
