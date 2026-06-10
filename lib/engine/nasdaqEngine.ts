export function nasdaqEngine(data: any) {
const { phase, crash, rotation, putTiming, earlyWarning } = data;

/* ================= DEFAULT ================= */

let active = false;
let mode = "OFF";
let strength = 0;
let execution = "NONE";
let note = "No opportunity";
let sizeMultiplier = 0; // 🔥 wichtig für Sizing später

/* ================= CORE CONDITIONS ================= */

const crashProb = crash?.probability ?? 0;
const putScore = putTiming?.score?.value ?? 0;
const rotationScore = rotation?.score ?? 0;

const lowCrash = crashProb < 40;
const earlyPhase =
phase === "PHASE_1_EXPANSION" ||
phase === "PHASE_2_WARNING";

const noPutPressure = putScore < 5;
const noEarlyStress = !earlyWarning?.active;

/* ================= ACTIVATION ================= */

if (lowCrash && earlyPhase && noPutPressure && noEarlyStress) {
active = true;

/* ================= MODE LOGIC ================= */

// 🔹 Pullback Mode (dein Standardfall)
if (rotationScore < 10) {
mode = "PULLBACK_LONG";
strength = 40;
execution = "SMALL PROBE";
note = "Weak rotation → only pullbacks";
sizeMultiplier = 0.3; // 🔥 klein halten
}

// 🔹 Tactical Mode
else if (rotationScore >= 10 && rotationScore < 25) {
mode = "TACTICAL_LONG";
strength = 60;
execution = "LIGHT SCALE IN";
note = "Balanced environment";
sizeMultiplier = 0.5;
}

// 🔹 Momentum Mode (niemals zu groß!)
else if (rotationScore >= 25) {
mode = "MOMENTUM_LONG";
strength = 70;
execution = "FAST ENTRY / QUICK EXIT";
note = "Momentum – take profits fast";
sizeMultiplier = 0.6;
}
}

/* ================= HARD RISK BLOCK ================= */

if (
phase === "PHASE_3_DISTRIBUTION" ||
phase === "PHASE_4_RISK" ||
phase === "PHASE_5_BREAKDOWN" ||
phase === "PHASE_6_ACCELERATION" ||
phase === "PHASE_7_CAPITULATION" ||
crashProb > 55 ||
putScore > 6
) {
active = false;
mode = "OFF";
strength = 0;
execution = "NONE";
note = "Risk regime – Nasdaq disabled";
sizeMultiplier = 0;
}

/* ================= FINAL SAFETY ================= */

// 🔥 niemals gegen starkes Short-Signal arbeiten
if (putScore > 7) {
active = false;
mode = "OFF";
note = "Put pressure dominant";
sizeMultiplier = 0;
}

return {
active,
mode,
strength,
execution,
note,
sizeMultiplier // 🔥 wichtig für Portfolio-Integration
};
}
