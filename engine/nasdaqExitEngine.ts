export function nasdaqExitEngine(input: any) {

const {
crash,
phase,
putTiming,
earlyWarning,
position,
pnl
} = input;

/* ================= DEFAULT ================= */

let action = "HOLD";
let sizeReduction = 0;
let reason = "Trend intact";

/* ================= 🔥 HARD EXIT ================= */

// Kapitulation → Gewinne realisieren
if (phase === "PHASE_7_CAPITULATION") {
return {
action: "TAKE PROFIT",
sizeReduction: 70,
reason: "Capitulation"
};
}

// Crash lässt nach → raus
if (crash.probability < 50 && pnl > 0) {
return {
action: "EXIT",
sizeReduction: 100,
reason: "Crash fading"
};
}

/* ================= 🔥 PROFIT MANAGEMENT ================= */

// Großer Gewinn → absichern
if (pnl > 80) {
return {
action: "LOCK PROFITS",
sizeReduction: 60,
reason: "High profit"
};
}

if (pnl > 40) {
return {
action: "PARTIAL TAKE",
sizeReduction: 30,
reason: "Secure gains"
};
}

/* ================= 🔥 TIMING COLLAPSE ================= */

if (putTiming.timing === "WAIT") {
return {
action: "REDUCE",
sizeReduction: 40,
reason: "Timing lost"
};
}

/* ================= 🔥 EARLY WARNING OFF ================= */

if (!earlyWarning?.active && pnl > 0) {
return {
action: "TRIM",
sizeReduction: 25,
reason: "No more stress"
};
}

/* ================= DEFAULT ================= */

return {
action,
sizeReduction,
reason
};
}
