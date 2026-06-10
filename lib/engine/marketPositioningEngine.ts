export function marketPositioningEngine(data: any) {

/* ================= INPUT ================= */

const putCall = Number(data.putCallRatio ?? 1); // >1 = bearish
const gamma = Number(data.dealerGamma ?? 0); // >0 stabil, <0 instabil
const skew = Number(data.skew ?? 1); // >1 = downside hedging
const vix = Number(data.vix ?? 20);

/* ================= COMPONENTS ================= */

let sentimentScore = 0; // max 40
let gammaScore = 0; // max 30
let skewScore = 0; // max 30

/* ================= PUT/CALL ================= */

// Contrarian lesen!
if (putCall > 1.2) sentimentScore += 30; // bearish crowd → bullish potential
else if (putCall > 1.0) sentimentScore += 20;
else if (putCall < 0.8) sentimentScore -= 20;
else if (putCall < 0.7) sentimentScore -= 30;

/* ================= GAMMA ================= */

if (gamma > 0) gammaScore += 20; // stabil
else gammaScore -= 20; // fragil

if (gamma < -1) gammaScore -= 10; // acceleration risk

/* ================= SKEW ================= */

if (skew > 1.1) skewScore += 20; // hedging hoch → bullish contrarian
else if (skew < 0.9) skewScore -= 20; // complacency

/* ================= TOTAL ================= */

let total =
sentimentScore +
gammaScore +
skewScore;

// normalize → 0–100
total = Math.max(0, Math.min(100, 50 + total));

/* ================= BIAS ================= */

let bias = "NEUTRAL";

if (total > 65) bias = "BULLISH";
else if (total < 35) bias = "BEARISH";

/* ================= CROWDING ================= */

let crowding = "CLEAN";

if (putCall < 0.7 && skew < 0.9) {
crowding = "CROWDED LONG";
}

if (putCall > 1.3 && skew > 1.2) {
crowding = "CROWDED SHORT";
}

if (gamma < 0 && Math.abs(total - 50) < 10) {
crowding = "SQUEEZE ZONE";
}

/* ================= STATE ================= */

let state = "NEUTRAL";

if (gamma < 0) state = "UNSTABLE";
if (gamma > 0 && vix < 20) state = "RISK_ON";
if (gamma < 0 && vix > 25) state = "RISK_OFF";

/* ================= RETURN ================= */

return {
bias,
crowding,
state,

score: Math.round(total),

components: {
putCall,
gamma,
skew
}
};
}
