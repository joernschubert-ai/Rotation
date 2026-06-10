// /lib/engine/structureEngine.ts

export function structureEngine(data: any) {

/* ================= BREADTH ================= */

const breadth20 =
Number(data.breadth20 ?? 0) * 100;

const breadth50 =
Number(data.breadth50 ?? 0) * 100;

const breadth200 =
Number(data.breadth200 ?? 0) * 100;

const breadth = {
b20: {
value: breadth20,
delta: Number(data.breadth20Delta ?? 0)
},

b50: {
value: breadth50,
delta: Number(data.breadth50Delta ?? 0)
},

b200: {
value: breadth200,
delta: Number(data.breadth200Delta ?? 0)
}
};

/* ================= ADVANCE / DECLINE ================= */

const advances = Number(
data.advances ??
data.advanceDecline?.advances ??
0
);

const declines = Number(
data.declines ??
data.advanceDecline?.declines ??
0
);

const adValue = advances - declines;

const advanceDecline = {
advances,
declines,
value: adValue,
delta: Number(data.adDelta ?? 0)
};

/* ================= HIGHS / LOWS ================= */

const highs = Number(
data.highs ??
data.newHighs ??
0
);

const lows = Number(
data.lows ??
data.newLows ??
0
);

const highsLows = {
highs,
lows,
deltaHighs: Number(data.highsDelta ?? 0),
deltaLows: Number(data.lowsDelta ?? 0)
};

/* ================= DISTRIBUTION ================= */

const distribution = {
value: Number(data.distributionScore ?? 0),
max: 7
};

/* ================= INTERNAL STRUCTURE INPUTS ================= */

const rsEqual =
Number(
data.rsEqual ??
data.rotation?.rsEqual ??
1
);

const rsSmall =
Number(
data.rsSmall ??
data.rotation?.rsSmall ??
1
);

const rotationScore =
Number(
data.rotationScore ??
data.rotation?.score ??
50
);

const participationScore =
Number(
data.participationScore ??
data.participation?.score ??
50
);

const rotationDecayScore =
Number(
data.rotationDecayScore ??
data.rotationDecay?.score ??
0
);

const earlyWarning =
Boolean(
data.earlyWarning?.active ??
false
);

/* ================= BASE HEALTH ================= */

/*
Institutional Logic:

Breadth50:
Intermediate participation

Breadth200:
Structural participation

Breadth20:
Momentum participation

Breadth200 receives LOWER weighting than before
because structural breadth lags heavily during
distribution regimes.
*/

let healthScore =
(
(breadth20 * 0.20) +
(breadth50 * 0.45) +
(breadth200 * 0.35)
);

/* ================= QUALITY PENALTIES ================= */

/* ----- Negative A/D despite strong breadth ----- */

if (
breadth50 > 75 &&
adValue < 0
) {
healthScore -= 8;
}

/* ----- Strong structural breadth but weak Equal Weight ----- */

if (
breadth200 > 70 &&
rsEqual < 0.97
) {
healthScore -= 10;
}

/* ----- Structural divergence ----- */

if (
breadth200 > 70 &&
adValue < 0 &&
rsEqual < 0.97
) {
healthScore -= 15;
}

/* ----- Weak small caps ----- */

if (rsSmall < 0.95) {
healthScore -= 8;
}

/* ----- Narrow leadership ----- */

if (
rsEqual < 0.96 &&
rsSmall < 0.95
) {
healthScore -= 10;
}

/* ----- Participation deterioration ----- */

if (participationScore < 40) {
healthScore -= 10;
}

if (participationScore < 30) {
healthScore -= 8;
}

/* ----- Rotation deterioration ----- */

if (rotationScore < 40) {
healthScore -= 8;
}

if (rotationScore < 30) {
healthScore -= 6;
}

/* ----- Rotation decay / distribution ----- */

if (rotationDecayScore > 70) {
healthScore -= 10;
}

if (rotationDecayScore > 85) {
healthScore -= 10;
}

/* ----- Early warning active ----- */

if (earlyWarning) {
healthScore -= 6;
}

/* ----- Highs vs lows deterioration ----- */

if (
highs <= lows &&
breadth50 > 70
) {
healthScore -= 6;
}

/* ----- Severe internal divergence ----- */

if (
breadth50 > 80 &&
breadth200 > 70 &&
adValue < 0 &&
participationScore < 35
) {
healthScore -= 12;
}

/* ================= CLAMP ================= */

healthScore = Math.max(
0,
Math.min(100, healthScore)
);

/* ================= HEALTH ================= */

const health = {
value: Math.round(healthScore),
max: 100
};

/* ================= RETURN ================= */

return {
breadth,
advanceDecline,
highsLows,
distribution,
health
};

}
