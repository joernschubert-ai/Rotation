// /lib/engine/edgeTransitionEngine.ts

export function edgeTransitionEngine(current: any, previous: any) {

/* ================= INPUT ================= */

const currState = current?.edgeState?.state ?? "NEUTRAL";
const prevState = previous?.edgeState?.state ?? "NEUTRAL";

const currStrength = current?.edgeState?.strength ?? 0;
const prevStrength = previous?.edgeState?.strength ?? 0;

const currScore = Number(current?.edgeState?.score ?? 0);
const prevScore = Number(previous?.edgeState?.score ?? 0);

const currCrash = Number(current?.crash?.probability ?? 0);

/* ================= LEVEL ================= */

function getLevel(state: string) {
if (state === "BUILD") return 1;
if (state === "CONFIRM") return 2;
if (state === "EXPAND") return 3;
if (state === "ATTACK") return 4;
return 0;
}

const currLevel = getLevel(currState);
const prevLevel = getLevel(prevState);

/* ================= OUTPUT ================= */

let transition = "NONE";
let signal = "HOLD";
let strength = 0;
let description = "";

/* ================= LEVEL UP ================= */

if (currLevel > prevLevel) {

transition = "LEVEL_UP";
strength = currLevel - prevLevel;

if (currState === "BUILD") {
signal = "EARLY ENTRY";
description = "Rotation starting → probe exposure";
}

if (currState === "CONFIRM") {
signal = "ADD RISK";
description = "Rotation confirmed → scale in";
}

if (currState === "EXPAND") {
signal = "PRESS";
description = "Momentum expansion → increase size";
}

if (currState === "ATTACK") {
signal = "MAX RISK";
description = "Full risk-on → aggressive positioning";
}
}

/* ================= LEVEL DOWN ================= */

else if (currLevel < prevLevel) {

transition = "LEVEL_DOWN";
strength = prevLevel - currLevel;

signal = "REDUCE";
description = "Edge deteriorating → reduce exposure";
}

/* ================= STABLE ================= */

else {

if (currScore > prevScore + 5) {
transition = "IMPROVING";
signal = "ADD LIGHT";
strength = 1;
description = "Edge improving inside regime";
} else if (currScore < prevScore - 5) {
transition = "WEAKENING";
signal = "TRIM";
strength = 1;
description = "Edge weakening → be cautious";
} else {
transition = "STABLE";
signal = "HOLD";
description = "No significant change";
}
}

/* ================= RISK OVERLAY ================= */

if (currCrash > 60 && currLevel >= 2) {
description += " | Elevated crash risk";
}

/* ================= EMA AWARENESS NOTE ================= */

/*
IMPORTANT:
Transitions now reflect smoothed edgeScore (EMA),
so signals are less noisy and less flip-prone.
*/

return {
transition,
signal,
strength,

from: prevState,
to: currState,

currentStrength: currStrength,
previousStrength: prevStrength,

delta: Number((currScore - prevScore).toFixed(2)),

description
};

}
