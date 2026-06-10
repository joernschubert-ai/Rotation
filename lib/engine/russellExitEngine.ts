export function russellExitEngine(input: any) {

const {
russell,
rotation,
phase,
earlyWarning,
pnl
} = input;

/* ================= DEFAULT ================= */

let action = "HOLD";
let sizeReduction = 0;
let reason = "Trend intact";

/* ================= 🔥 HARD EXIT ================= */

// Breakdown → sofort raus
if (
phase === "PHASE_5_BREAKDOWN" ||
phase === "PHASE_6_ACCELERATION"
) {
return {
action: "EXIT",
sizeReduction: 100,
reason: "Risk regime"
};
}

/* ================= 🔥 ROTATION BREAK ================= */

if (rotation.signal === "RISK_OFF_ROTATION") {
return {
action: "REDUCE",
sizeReduction: 50,
reason: "Rotation reversing"
};
}

/* ================= 🔥 WEAK SIGNAL ================= */

if (russell.score?.value < 4) {
return {
action: "EXIT",
sizeReduction: 100,
reason: "No more edge"
};
}

/* ================= 🔥 PROFIT CONTROL ================= */

if (pnl > 60) {
return {
action: "TRIM",
sizeReduction: 30,
reason: "Secure gains"
};
}

if (pnl > 100) {
return {
action: "TAKE PROFIT",
sizeReduction: 60,
reason: "Extended move"
};
}

/* ================= 🔥 EARLY WARNING ================= */

if (earlyWarning?.active) {
return {
action: "DEFENSIVE REDUCE",
sizeReduction: 30,
reason: "Market fragility"
};
}

/* ================= DEFAULT ================= */

return {
action,
sizeReduction,
reason
};
}
