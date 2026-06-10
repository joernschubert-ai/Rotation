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

rotationDecay
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
structure?.breadth?.b20?.value ?? 0
);

const breadth50 =
Number(
structure?.breadth?.b50?.value ?? 0
);

const breadth200 =
Number(
structure?.breadth?.b200?.value ?? 0
);

const ad =
Number(
structure?.advanceDecline?.value ?? 0
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
earlyWarning?.active ?? false;

const earlyScore =
Number(
earlyWarning?.score?.value ??
earlyWarning?.score ??
0
);

const gamma =
Number(drivers?.raw?.gamma ?? 0);

const correlation =
Number(
drivers?.raw?.correlation ?? 1
);

const vix =
Number(drivers?.raw?.vix ?? 20);

const move =
Number(drivers?.raw?.move ?? 80);

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
FLAGS
===================================================== */

const strongBreadth =
breadth50 > 70 &&
breadth200 > 60;

const healthyBreadth =
breadth50 > 58 &&
breadth200 > 52;

const healthyInternals =
ad > 0 &&
highs > lows;

const calmVolatility =
vix < 20;

const narrowLeadership =
rsGrowth > 1.03 &&
rsSmall < 1 &&
rsEqual < 1;

const severeNarrowLeadership =
rsGrowth > 1.05 &&
rsSmall < 0.95 &&
rsEqual < 0.95;

/* =====================================================
QUALITY
===================================================== */

let quality = 55;

if (healthyBreadth) {
quality += 10;
}

if (strongBreadth) {
quality += 10;
}

if (healthyInternals) {
quality += 8;
}

if (participationScore > 55) {
quality += 6;
}

if (thrustScore > 60) {
quality += 5;
}

if (liquidityScore > 65) {
quality += 5;
}

if (gamma > 0) {
quality += 4;
}

if (calmVolatility) {
quality += 4;
}

/* =====================================================
NEGATIVE
===================================================== */

/*
FIX:
Narrow leadership schwächt nur leicht,
solange Breadth + AD stabil bleiben.
*/

if (narrowLeadership) {
quality -= 4;
}

if (severeNarrowLeadership) {
quality -= 8;
}

if (rotationDecayScore > 60) {
quality -= 10;
}
else if (rotationDecayScore > 40) {
quality -= 5;
}

if (fragilityScore > 75) {
quality -= 8;
}

if (crashProbability > 55) {
quality -= 10;
}

if (early) {
quality -= 4;
}

quality = Math.max(
0,
Math.min(
100,
Math.round(quality)
)
);

/* =====================================================
SUSTAINABILITY
===================================================== */

let sustainability = 55;

if (healthyBreadth) {
sustainability += 10;
}

if (healthyInternals) {
sustainability += 8;
}

if (participationScore > 55) {
sustainability += 6;
}

if (gamma > 0) {
sustainability += 5;
}

if (liquidityScore > 65) {
sustainability += 5;
}

if (calmVolatility) {
sustainability += 4;
}

if (narrowLeadership) {
sustainability -= 4;
}

if (severeNarrowLeadership) {
sustainability -= 8;
}

if (rotationDecayScore > 60) {
sustainability -= 12;
}

sustainability = Math.max(
0,
Math.min(
100,
Math.round(sustainability)
)
);

/* =====================================================
FALSE BREAK RISK
===================================================== */

let falseBreakRisk = 25;

if (narrowLeadership) {
falseBreakRisk += 5;
}

if (severeNarrowLeadership) {
falseBreakRisk += 8;
}

if (rotationDecayScore > 60) {
falseBreakRisk += 10;
}

if (crashProbability > 55) {
falseBreakRisk += 10;
}

if (gamma < 0) {
falseBreakRisk += 8;
}

falseBreakRisk = Math.max(
0,
Math.min(
100,
Math.round(falseBreakRisk)
)
);

/* =====================================================
STATE
===================================================== */

let state = "EARLY";
let confidence = 45;

if (
healthyBreadth &&
healthyInternals &&
quality >= 60
) {

state = "CONFIRMING";
confidence = 65;
}

if (
strongBreadth &&
quality >= 72 &&
sustainability >= 68 &&
falseBreakRisk < 40
) {

state = "CONFIRMED";
confidence = 82;
}

if (
rotationDecayScore >= 60
) {

state = "INTERNAL_BREAKDOWN";
confidence = 28;
}

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Selective rotation with stable internals";

if (
narrowLeadership &&
healthyInternals
) {

summary =
"Mega-cap leadership but breadth still stable";
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
"Internal participation deterioration accelerating";
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

rsSmall,
rsGrowth,
rsEqual,

breadth20,
breadth50,
breadth200,

ad,
highs,
lows,

vix,
move,

crashProbability,

participation:
participationScore,

rotationDecay:
rotationDecayScore
}
};

}
