export function positionEngine(input: any) {

const { pnl, phase, crash, rotation } = input;

let action = "HOLD";
let sizeAdjustment = 0;
let note = "";

/* ================= PROFIT TAKING ================= */

if (pnl > 120) {
action = "TAKE_PROFIT";
sizeAdjustment = -80;
note = "Take majority off, keep runner (20%)";
}

if (pnl > 80 && phase === "PHASE_6_ACCELERATION") {
action = "TRIM";
sizeAdjustment = -50;
note = "Momentum high, reduce risk";
}

/* ================= CAPITULATION EXIT ================= */

if (phase === "PHASE_7_CAPITULATION") {
action = "EXIT";
sizeAdjustment = -100;
note = "Capitulation – exit into panic";
}

/* ================= RE-ENTRY ================= */

if (
pnl === 0 &&
phase === "PHASE_4_RISK" &&
rotation.signal === "RISK_OFF_ROTATION"
) {
action = "RE-ENTER";
sizeAdjustment = 50;
note = "Re-entry after bounce";
}

/* ================= RISK CONTROL ================= */

if (crash.probability < 30 && phase === "PHASE_2_WARNING") {
action = "LIGHTEN";
sizeAdjustment = -30;
note = "Risk fading";
}

return {
action,
sizeAdjustment,
note
};
}
