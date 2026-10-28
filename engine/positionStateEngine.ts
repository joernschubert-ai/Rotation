export function positionStateEngine(input: any) {

const {
prevState,
sizing,
exit,
pnl
} = input;

let state = prevState;

/* ================= INIT ================= */

if (!state) {
state = {
size: sizing.size ?? 0, // 🔥 DIREKT INITIAL
entryPrice: 0,
pnl: pnl ?? 0,
realized: 0,
hasReduced: false,
isRunner: false
};

return state; // 👈 WICHTIG: beim ersten Tick fertig
}

/* ================= UPDATE PNL ================= */

state.pnl = pnl ?? 0;

/* ================= APPLY EXIT ================= */

if (exit?.sizeReduction > 0 && state.size > 0) {

const reduction = (state.size * exit.sizeReduction) / 100;

state.size = Math.max(0, state.size - reduction);

state.realized += reduction;

if (exit.sizeReduction >= 50) {
state.hasReduced = true;
}

if (state.size <= 20) {
state.isRunner = true;
}
}

/* ================= RE-ENTRY ================= */

if (state.size === 0 && sizing.size > 0) {
state.size = sizing.size;
state.hasReduced = false;
state.isRunner = false;
state.realized = 0;
}

return state;
}
