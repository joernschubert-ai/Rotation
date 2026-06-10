// /lib/engine/nasdaqExecutionKernel.ts

export function nasdaqExecutionKernel(input: any) {

/* ================= INPUT ================= */

const signalType = input?.signal?.type ?? "NONE";
const signalStrength = Number(input?.signal?.strength ?? 0);

const decayScore = Number(input?.rotationDecay?.score ?? 0);
const crashScore = Number(input?.crash?.score ?? 0);

const masterScore = Number(input?.master?.score ?? 50);
const participation = Number(input?.participation?.score ?? 50);
const fragility = Number(input?.fragility?.score ?? 50);
const liquidity = Number(input?.liquidity?.score ?? 50);

/* ================= BASE STATE ================= */

let bias: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
let strength = 0;
let driver = "NONE";

/* ================= HARD RISK OFF ================= */

const STRONG_RISK_OFF =
signalType === "REDUCE" && signalStrength >= 70;

const STRUCTURAL_BREAK =
decayScore >= 65 || fragility >= 60 || crashScore >= 60;

/* ================= PRIMARY LOGIC ================= */

/* 🔴 HARD SHORT */
if (STRONG_RISK_OFF || STRUCTURAL_BREAK) {

bias = "SHORT";
strength = 90;
driver = "NASDAQ_RISK_OFF";
}

/* 🟠 DEFENSIVE SHORT */
else if (signalType === "REDUCE" || decayScore >= 50) {

bias = "SHORT";
strength = 65;
driver = "NASDAQLIGHT_RISK";
}

/* 🟡 NEUTRAL / HEDGE */
else if (fragility >= 45 || participation < 45) {

bias = "NEUTRAL";
strength = 30;
driver = "HEDGE";
}

/* ================= SAFE LONG (rare) ================= */

else if (
masterScore > 60 &&
liquidity > 60 &&
crashScore < 30 &&
decayScore < 40
) {

bias = "LONG";
strength = 50;
driver = "RISK_ON";
}

/* ================= OUTPUT ================= */

return {
leg: "NASDAQ",

bias,
strength,
driver,

metrics: {
signalType,
signalStrength,
decayScore,
crashScore,
masterScore,
participation,
fragility,
liquidity
}
};
}
