// /lib/engine/russellExecutionKernel.ts

export function russellExecutionKernel(input: any) {

/* ================= INPUT ================= */

const rotationScore = Number(input?.rotation?.score ?? 0);
const rotationState = input?.rotation?.state ?? "NONE";

const participation = Number(input?.participation?.score ?? 50);
const breadth = Number(input?.breadth?.score ?? 50);

const liquidity = Number(input?.liquidity?.score ?? 50);
const decayScore = Number(input?.rotationDecay?.score ?? 0);

const rsSmall = Number(input?.rotation?.rsSmall ?? 1);
const rsGrowth = Number(input?.rotation?.rsGrowth ?? 1);

/* ================= BASE ================= */

let bias: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
let strength = 0;
let driver = "NONE";

/* ================= STRUCTURAL WEAKNESS ================= */

const WEAK_STRUCTURE =
rotationScore < 35 || decayScore >= 65;

/* ================= PRIMARY LOGIC ================= */

/* 🔴 NO LONG */
if (WEAK_STRUCTURE && participation < 45) {

bias = "SHORT";
strength = 70;
driver = "RUSSELL_BREAKDOWN";
}

/* 🟠 EARLY ROTATION */
else if (rotationScore >= 40 && rsSmall < 1) {

bias = "NEUTRAL";
strength = 40;
driver = "ROTATION_WEAK";
}

/* 🟢 ROTATION LONG */
else if (
rotationScore >= 50 &&
participation >= 50 &&
breadth >= 55 &&
liquidity >= 50 &&
rsGrowth > 1
) {

bias = "LONG";
strength = 75;
driver = "ROTATION_LONG";
}

/* 🟢 AGGRESSIVE ROTATION */
else if (
rotationScore >= 60 &&
participation >= 60
) {

bias = "LONG";
strength = 90;
driver = "ROTATION_STRONG";
}

/* ================= OUTPUT ================= */

return {
leg: "RUSSELL",

bias,
strength,
driver,

metrics: {
rotationScore,
rotationState,
participation,
breadth,
liquidity,
decayScore,
rsSmall,
rsGrowth
}
};
}
