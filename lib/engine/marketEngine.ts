// /lib/engine/marketEngine.ts

import { rotationEngine } from "./rotationEngine";
import { putTimingEngine } from "./putTimingEngine";
import { positionEngine } from "./positionEngine";
import { crashEngine } from "./crashEngine";
import { russellEngine } from "./russellEngine";
import { rotationDecisionEngine } from "./rotationDecisionEngine";
import { confidenceEngine } from "./confidenceEngine";
import { executionEngine } from "./executionEngine";
import { exitEngine } from "./exitEngine";
import { positionStateEngine } from "./positionStateEngine";
import { masterScoreEngine } from "./masterScoreEngine";
import { positionSizingV2 } from "./positionSizingV2";
import { systemHeatEngine } from "./systemHeatEngine";
import { earlyWarningEngine } from "./earlyWarningEngine";
import { riskLoopEngine } from "./riskLoopEngine";
import { signalEngine } from "./signalEngine";
import { superSignalEngine } from "./superSignalEngine";

import { nasdaqEngine } from "./nasdaqEngine";
import { driversEngine } from "./driversEngine";
import { marketDriversEngine } from "./marketDriversEngine";
import { structureEngine } from "./structureEngine";
import { marketPhaseEngine } from "./marketPhaseEngine";
import { edgeStateEngine } from "./edgeStateEngine";
import { tradeStackEngine } from "./tradeStackEngine";

import { rotationConfirmEngine } from "./rotationConfirmEngine";
import { rotationDecayEngine } from "./rotationDecayEngine";

import { executionStateEngine } from "./executionStateEngine";
import { regimeSyncEngine } from "./regimeSyncEngine";
import { dangerZoneEngine } from "./dangerZoneEngine";

import { liquidityEngine } from "./liquidityEngine";
import { breadthThrustEngine } from "./breadthThrustEngine";
import { fragilityEngine } from "./fragilityEngine";
import { squeezeEngine } from "./squeezeEngine";
import { participationEngine } from "./participationEngine";

/* =====================================================
NEW
===================================================== */

import replay2020 from "@/data/replay/2020.json";
import replay2021 from "@/data/replay/2021.json";
import replay2022 from "@/data/replay/2022.json";
import replay2023 from "@/data/replay/2023.json";
import replay2024 from "@/data/replay/2024.json";
import replay2025 from "@/data/replay/2025.json";

import { historicalReplay } from "./historicalReplay";

export function marketEngine(data: any) {

/* =====================================================
DRIVERS
===================================================== */

const driversCore = driversEngine(data);

const marketDrivers =
marketDriversEngine(data);

/* =====================================================
STRUCTURE
===================================================== */

const structure =
structureEngine(data);

/* =====================================================
CLEAN INPUT
===================================================== */

const breadth20 =
Number(
structure?.breadth?.b20?.value ?? 50
);

const breadth50 =
Number(
structure?.breadth?.b50?.value ?? 50
);

const breadth200 =
Number(
structure?.breadth?.b200?.value ?? 50
);

const vix =
Number(
data.marketData?.["^VIX"]?.current ?? 20
);

/* =====================================================
DIVERGENCE
===================================================== */

const divergence = (() => {

const breadth =
structure?.breadth?.b50?.value ?? 0;

const ad =
structure?.advanceDecline?.value ?? 0;

let score = 0;

if (breadth > 80 && ad < 0) {
score -= 2;
}

if (breadth < 40 && ad > 0) {
score += 2;
}

return {
score,

state:
score > 1
? "BULLISH_DIVERGENCE"
: score < -1
? "BEARISH_DIVERGENCE"
: "NONE"
};

})();

/* =====================================================
LIQUIDITY
===================================================== */

const liquidity =
liquidityEngine({
marketLiquidityScore:
Number(data.marketLiquidityScore ?? 50),

creditRatio:
Number(data.creditRatio ?? 1),

gammaExposure:
Number(data.gammaExposure ?? 0),

vixTermRatio:
Number(data.vixTermRatio ?? 1),

volOfVolRatio:
Number(data.volOfVolRatio ?? 1),

marketData:
data.marketData ?? {},

breadth50,
breadth200,

correlationScore:
Number(data.correlationScore ?? 0)
});

/* =====================================================
FRAGILITY
===================================================== */

const fragility =
fragilityEngine({

crash: {
probability:
Number(data.crashProbability ?? 0)
},

breadth50,
breadth200,

/* 🔥 FIX:
Komplettes Liquidity-Objekt injizieren
NICHT liquidityScore
*/

liquidity,

gammaExposure:
Number(data.gammaExposure ?? 0),

correlationScore:
Number(data.correlationScore ?? 0),

vix,

volOfVolRatio:
Number(data.volOfVolRatio ?? 1),

structure
});


/* =====================================================
SQUEEZE
===================================================== */

const squeeze =
squeezeEngine({
gammaExposure:
Number(data.gammaExposure ?? 0),

vix,

moveIndex:
Number(data.moveIndex ?? 80),

breadth50

});

/* =====================================================
ROTATION BASE
===================================================== */
/*
🔥 WICHTIG:
Erster Pass OHNE participation/breadthThrust,
damit deren Engines initial berechnet werden können.
===================================================== */

const rotationBase = rotationEngine({
...data.rotation,

concentrationScore:
Number(data.concentrationScore ?? 0),

futuresVsCash:
Number(data.futuresVsCash ?? 0),

marketData:
data.marketData ?? {},

liquidity,
fragility,
squeeze,

structure
});

/* =====================================================
PARTICIPATION
===================================================== */

const participation =
participationEngine({
breadth20,
breadth50,
breadth200,

structure,

highs:
Number(
structure?.highsLows?.highs ?? 0
),

lows:
Number(
structure?.highsLows?.lows ?? 0
),

rsEqual:
rotationBase?.rsEqual,

rsSmall:
rotationBase?.rsSmall,

rotation: rotationBase,

divergenceState:
divergence.state,

concentrationScore:
Number(data.concentrationScore ?? 50),

rotationScore:
Number(rotationBase?.score ?? 50)
});

/* =====================================================
BREADTH THRUST
===================================================== */

const breadthThrust =
breadthThrustEngine({
breadth20,
breadth50,
breadth200,

structure,

advanceDecline:
Number(
structure?.advanceDecline?.value ?? 0
),

rsEqual:
rotationBase?.rsEqual,

rsSmall:
rotationBase?.rsSmall,

rotationScore:
rotationBase?.score,

participationScore:
participation?.score,

concentrationScore:
Number(data.concentrationScore ?? 50),

divergenceState:
divergence.state
});

/* =====================================================
FINAL ROTATION
===================================================== */
/*
🔥 FINALER PASS
Jetzt mit vollständigem Injection-Stack
===================================================== */

const rotation = rotationEngine({
...data.rotation,

concentrationScore:
Number(data.concentrationScore ?? 0),

futuresVsCash:
Number(data.futuresVsCash ?? 0),

marketData:
data.marketData ?? {},

liquidity,
fragility,
squeeze,
participation,
breadthThrust,

structure
});

/* =====================================================
CRASH
===================================================== */

const crash = crashEngine({
...data,

vix,

vixTermRatio:
Number(data.vixTermRatio ?? 1),

moveIndex:
Number(
data.moveIndex ??
data.marketDrivers?.raw?.move ??
0
),

volOfVolRatio:
Number(data.volOfVolRatio ?? 1),

gammaExposure:
Number(data.gammaExposure ?? 0),

correlationScore:
Number(data.correlationScore ?? 0),

drivers: driversCore,

historyMetrics
});

/* =====================================================
EARLY WARNING
===================================================== */

const earlyWarning =
earlyWarningEngine(data);

/* =====================================================
TEMP PUT / RUSSELL
===================================================== */

const putTimingTemp =
putTimingEngine({
phase: "TEMP",
rotation,
crash,
earlyWarning,
historyMetrics
});

const russellTemp =
russellEngine({
rsSmall: rotation.rsSmall,
rsGrowth: rotation.rsGrowth,

breadth50,
breadth200,

concentrationScore:
Number(data.concentrationScore ?? 0),

phase: "TEMP",

crash,
vix,
historyMetrics

});

const historyMetrics =
data.historyMetrics ?? {};


/* =====================================================
PHASE
===================================================== */

const phaseData =
marketPhaseEngine({
crash,
rotation,

putTiming: putTimingTemp,

earlyWarning,
structure,

russell: russellTemp,
historyMetrics

});

const phase =
phaseData.phase;

const regime = {
label: phase,
score: crash.score
};

/* =====================================================
FINAL PUT
===================================================== */

const putTiming =
putTimingEngine({
phase,
rotation,
crash,
earlyWarning,
historyMetrics
});

/* =====================================================
FINAL RUSSELL
===================================================== */

const russell =
russellEngine({
rsSmall: rotation.rsSmall,
rsGrowth: rotation.rsGrowth,

breadth50,
breadth200,

concentrationScore:
Number(data.concentrationScore ?? 0),

phase,

crash,
vix,

historyMetrics
});

/* =====================================================
EXECUTION STATE
===================================================== */

const confidence =
confidenceEngine({
...data,
crash,
rotation,
phase
});

const systemHeat =
systemHeatEngine({
crash,

breadth20,
breadth50,

vix,

marketLiquidityScore:
data.marketLiquidityScore,

creditRatio:
data.creditRatio,

vixTermRatio:
data.vixTermRatio,

gammaExposure:
data.gammaExposure
});

/* =====================================================
TEMP REGIME SYNC
===================================================== */

const regimeSyncTemp =
regimeSyncEngine({
phase,

crash,
rotation,
structure,
earlyWarning,

vix,

gammaExposure:
Number(data.gammaExposure ?? 0),

liquidityScore:
Number(liquidity?.score ?? 50),

creditRatio:
Number(data.creditRatio ?? 1),

breadth50,
breadth200,

fragility,
participation,
breadthThrust
});

/* =====================================================
DANGER ZONE
===================================================== */

const dangerZone =
dangerZoneEngine({

crashProbability:
Number(crash?.probability ?? 0),

crashMomentum:
Number(crash?.momentum ?? 0),

breadth50,
breadth200,

liquidityVacuumScore:
Number(data.liquidityVacuumScore ?? 0),

correlationScore:
Number(data.correlationScore ?? 0),

gammaExposure:
Number(data.gammaExposure ?? 0),

volOfVolRatio:
Number(data.volOfVolRatio ?? 1),

creditRatio:
Number(data.creditRatio ?? 1),

vix
});

/* =====================================================
EXECUTION STATE
===================================================== */

const executionState =
executionStateEngine({

regimeSignal:
phase ?? "NEUTRAL",

crashProbability:
Number(crash?.probability ?? 0),

dangerScore:
Number(dangerZone?.score ?? 0),

stressScore:
Math.abs(
Number(systemHeat?.value ?? 0)
) * 10,

rotationSignal:
rotation?.signal ?? "neutral",

rotationStrength:
Number(rotation?.score ?? 0),

breadth200,
breadth50,

gammaExposure:
Number(data.gammaExposure ?? 0),

liquidityScore:
Number(liquidity?.score ?? 50),

volatilityState:
vix > 25
? "HIGH_VOL"
: "NORMAL",

regimeSyncScore:
Number(regimeSyncTemp?.score ?? 50),

regimeSyncState:
regimeSyncTemp?.state ?? "TRANSITION",

confidence:
Number(confidence?.score ?? 50)
});

/* =====================================================
ROTATION DECAY
===================================================== */

const rotationDecay =
rotationDecayEngine({

rotation,

structure,

crash,
earlyWarning,

liquidity,
fragility,
squeeze,
participation,
breadthThrust,

regimeSync: regimeSyncTemp,
executionState,

breadth50,
breadth200,

vix,

concentrationScore:
Number(data.concentrationScore ?? 0),

gammaExposure:
Number(data.gammaExposure ?? 0),

creditRatio:
Number(data.creditRatio ?? 1),

marketLiquidityScore:
Number(data.marketLiquidityScore ?? 50),

breadthTrend:
historyMetrics?.breadthTrend,

breadthAcceleration:
historyMetrics?.breadthAcceleration,

participationDecay:
historyMetrics?.participationDecay,

leadershipDecay:
historyMetrics?.leadershipDecay,

relativeBreadthWeakness:
historyMetrics?.relativeBreadthWeakness,
});

/* =====================================================
ROTATION CONFIRM
===================================================== */

const rotationConfirm =
rotationConfirmEngine({
rotation,
structure,
crash,
earlyWarning,

drivers: marketDrivers,

positioning: {},

volatility: {
vix
},

executionState,
regimeSync: regimeSyncTemp,

liquidity,
fragility,
squeeze,
participation,
breadthThrust,

rotationDecay
});

/* =====================================================
FINAL REGIME SYNC
===================================================== */

const regimeSync =
regimeSyncEngine({
phase,

crash,
rotation,
structure,
earlyWarning,

vix,

gammaExposure:
Number(data.gammaExposure ?? 0),

liquidityScore:
Number(liquidity?.score ?? 50),

creditRatio:
Number(data.creditRatio ?? 1),

breadth50,
breadth200,

fragility,
participation,
breadthThrust
});


/* =====================================================
NASDAQ
===================================================== */

const nasdaq =
nasdaqEngine({
...data,

phase,
crash,
rotation,
putTiming,
earlyWarning
});

/* =====================================================
MASTER
===================================================== */

const master =
masterScoreEngine({
crash,
rotation,
putTiming,
russell,
phaseData,
structure,

participation,
breadthThrust,
liquidity,
fragility,

rotationDecay,
regimeSync,

historyMetrics:
historyMetrics
});

/* =====================================================
EDGE
===================================================== */

const edgeState =
edgeStateEngine({
rotation,
russell,
structure,
earlyWarning,
crash,

master,
rotationDecay,
rotationConfirm,
participation,
divergence,

executionState,
regimeSync,
dangerZone,

marketData: data.marketData ?? {}
});


/* =====================================================
POSITIONING
===================================================== */

const positioning = {

bias:
(rotation.score ?? 0) > 60
? "BULLISH"
: (rotation.score ?? 0) < 40
? "BEARISH"
: "NEUTRAL",

crowding:
structure?.breadth?.b50?.value > 85
? "CROWDED_LONG"
: structure?.breadth?.b50?.value < 30
? "CROWDED_SHORT"
: "BALANCED",

state:
earlyWarning?.active
? "FRAGILE"
: crash?.probability > 40
? "RISK"
: "STABLE",

score: Math.round(
(rotation.score * 0.5) +
((structure?.health?.value ?? 0) * 0.3) -
((crash?.probability ?? 0) * 0.2)
)
};

/* =====================================================
TRADE STACK
===================================================== */

const tradeStack =
tradeStackEngine({
phase,

russell,
putTiming,
edgeState,
master,

rotationConfirm,
rotationDecay,

executionState,
regimeSync,

historyMetrics
});

/* =====================================================
STATE
===================================================== */

const state =
positionStateEngine({
prevState:
data.positionState ?? null,

sizing: {
size: 0
},

exit: {},

pnl:
Number(data.pnl ?? 0)
});

/* =====================================================
SIZING
===================================================== */

const sizing =
positionSizingV2({
master,
crash,
putTiming,
russell,

positioning,
state,

systemHeat,
earlyWarning,

rotation,
structure,

edgeState,
tradeStack,
divergence,

regimeSync,
dangerZone,
executionState,

rotationConfirm,
rotationDecay,

liquidity,
breadthThrust,
fragility,
squeeze,
participation
});

/* =====================================================
EXIT
===================================================== */

const exit =
exitEngine({
position: {
size: sizing.size
},

crash,

vix,
breadth50,

pnl:
Number(data.pnl ?? 0),

phase,
rotation,
rotationConfirm,
rotationDecay,

russell,
systemHeat,

fragility,
liquidity,
participation
});

/* =====================================================
POSITION
===================================================== */

const position =
positionEngine({
pnl:
Number(data.pnl ?? 0),

phase,
crash,
rotation
});

/* =====================================================
DECISION
===================================================== */

const decision =
rotationDecisionEngine({
phase,
crash,
putTiming,
russell,
confidence,
earlyWarning,
master,
positioning,
edgeState
});

/* =====================================================
SIGNAL
===================================================== */

const signalResult =
signalEngine({
phase,
crash,
putTiming,
rotation,
earlyWarning,

exit,
decision,

tradeStack,
divergence,

sizing,

regimeSync,
dangerZone,
executionState,

rotationConfirm,
rotationDecay,

liquidity,
breadthThrust,
fragility,
squeeze,
participation
});

const signal =
{
...(signalResult?.signal ?? { active:false }),
phase
};

/* =====================================================
SUPER SIGNAL
===================================================== */

const superSignal =
superSignalEngine({
signal,

rotationConfirm,
rotationDecay,

tradeStack,

regimeSync,
dangerZone,
executionState,

structure,
marketDrivers,

crash,
rotation,

divergence,

liquidity,
breadthThrust,
fragility,
squeeze,
participation
});

/* =====================================================
EXECUTION
===================================================== */

const execution =
executionEngine({

superSignal,

vix,

breadth20,
breadth50,

crash,
phase,

executionState,
dangerZone,
regimeSync
});

/* =====================================================
RISK
===================================================== */

const risk =
riskLoopEngine({
sizing,
exit,
state
});

/* =====================================================
HISTORICAL REPLAY
===================================================== */

const replaySnapshots = [
...replay2020,
...replay2021,
...replay2022,
...replay2023,
...replay2024,
...replay2025
];

const replay =
historicalReplay(replaySnapshots);

/* =====================================================
RETURN
===================================================== */

return {

crash,

phase,
phaseData,

regime,

rotation,
rotationConfirm,
rotationDecay,

signal,
superSignal,

decision,

execution,
executionState,

regimeSync,
dangerZone,

liquidity,
breadthThrust,
fragility,
squeeze,
participation,

position,
positioning,

sizing,
exit,
risk,

putTiming,
russell,
nasdaq,

master,
confidence,

systemHeat,
earlyWarning,

structure,

tradeStack,
edgeState,
divergence,

driversCore,
marketDrivers,

replay,

state,

historyMetrics,

indices:
data.indices ?? {},

futures:
data.futures ?? {}
};

}
