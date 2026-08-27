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
import { phaseConfirmationEngine } from "./phaseConfirmationEngine";
import { nasdaqEngine } from "./nasdaqEngine";
import { driversEngine } from "./driversEngine";
import { marketDriversEngine } from "./marketDriversEngine";
import { structureEngine } from "./structureEngine";
import { marketPhaseEngine } from "./marketPhaseEngine";
import { marketQualityEngine } from "./marketQualityEngine";
import { edgeStateEngine } from "./edgeStateEngine";
import { tradeStackEngine } from "./tradeStackEngine";

import { rotationConfirmEngine } from "./rotationConfirmEngine";
import { rotationDecayEngine } from "./rotationDecayEngine";
import { regimePersistenceEngine } from "./regimePersistenceEngine";

import { executionStateEngine } from "./executionStateEngine";
import { regimeSyncEngine } from "./regimeSyncEngine";
import { dangerZoneEngine } from "./dangerZoneEngine";

import { liquidityEngine } from "./liquidityEngine";
import { breadthThrustEngine } from "./breadthThrustEngine";
import { breadthVelocityEngine } from "./breadthVelocityEngine";
import { internalDivergenceEngine } from "./internalDivergenceEngine";
import { fragilityEngine } from "./fragilityEngine";
import { squeezeEngine } from "./squeezeEngine";
import { participationEngine } from "./participationEngine";
import { priceMomentumEngine } from "./priceMomentumEngine";

/* =====================================================
HISTORICAL REPLAY
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

const driversCore =
driversEngine(data);

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

const historyMetrics =
data.historyMetrics ?? {};


/* =====================================================
HISTORY ACCESS
===================================================== */

/*
* WICHTIG:
*
* structure.breadth.b20 / b50 / b200 besitzen laut
* TypeScript-Typ nur { value, delta }.
*
* Deshalb darf hier NICHT mehr auf
*
* structure.breadth.b20.history
*
* zugegriffen werden.
*
* Historische Werte werden stattdessen bevorzugt aus
* historyMetrics bzw. data.history gelesen.
*/

const history =
Array.isArray(data.history)
? data.history
: Array.isArray(historyMetrics?.history)
? historyMetrics.history
: [];


/*
* Liefert einen historischen Wert aus einem Snapshot.
*
* offset:
* 5 = ungefähr 5 Snapshots zurück
* 10 = ungefähr 10 Snapshots zurück
* 20 = ungefähr 20 Snapshots zurück
*
* Mehrere mögliche Pfade werden unterstützt, damit
* unterschiedliche Snapshot-Strukturen nicht den
* kompletten Engine-Lauf zerstören.
*/

function getHistoryValue(
offset: number,
paths: string[],
fallback: number
): number {

if (
!Array.isArray(history) ||
history.length <= offset
) {
return fallback;
}

const snapshot =
history[history.length - 1 - offset];

if (!snapshot) {
return fallback;
}

for (const path of paths) {

const parts =
path.split(".");

let value =
snapshot;

for (const part of parts) {

if (
value === null ||
value === undefined
) {
value = undefined;
break;
}

value =
value[part];
}

const numeric =
Number(value);

if (Number.isFinite(numeric)) {
return numeric;
}
}

return fallback;
}


/*
* HistoryMetrics kann ebenfalls bereits fertige
* historische Reihen enthalten.
*
* Diese Funktion versucht zuerst eine solche Reihe
* zu verwenden und fällt danach auf data.history
* zurück.
*/

function getHistorySeriesValue(
seriesNames: string[],
offset: number,
paths: string[],
fallback: number
): number {

for (const name of seriesNames) {

const series =
historyMetrics?.[name];

if (
Array.isArray(series) &&
series.length > offset
) {

const value =
Number(
series[
series.length - 1 - offset
]
);

if (Number.isFinite(value)) {
return value;
}
}
}

return getHistoryValue(
offset,
paths,
fallback
);
}


/* =====================================================
HISTORICAL BREADTH VALUES
===================================================== */

const breadth20_5dAgo =
getHistorySeriesValue(
[
"breadth20History"
],
5,
[
"breadth20",
"breadth.b20",
"structure.breadth.b20.value"
],
breadth20
);


const breadth50_5dAgo =
getHistorySeriesValue(
[
"breadth50History"
],
5,
[
"breadth50",
"breadth.b50",
"structure.breadth.b50.value"
],
breadth50
);


const breadth50_10dAgo =
getHistorySeriesValue(
[
"breadth50History"
],
10,
[
"breadth50",
"breadth.b50",
"structure.breadth.b50.value"
],
breadth50
);


const breadth200_10dAgo =
getHistorySeriesValue(
[
"breadth200History"
],
10,
[
"breadth200",
"breadth.b200",
"structure.breadth.b200.value"
],
breadth200
);


const breadth200_20dAgo =
getHistorySeriesValue(
[
"breadth200History"
],
20,
[
"breadth200",
"breadth.b200",
"structure.breadth.b200.value"
],
breadth200
);


const advanceDecline_5dAgo =
getHistorySeriesValue(
[
"advanceDeclineHistory",
"adHistory"
],
5,
[
"advanceDecline",
"ad",
"structure.advanceDecline.value"
],
Number(
structure?.advanceDecline?.value ?? 0
)
);


const spxCurrent =
Number(

data.indices?.spx ??
data.indices?.SPX ??
0
);


const spx5dAgo =
getHistorySeriesValue(
[
"spxHistory",
"SPXHistory"
],
5,
[
"spx",
"SPX",
"indices.spx",
"indices.SPX",
"structure.spx.value"
],
spxCurrent
);


/* =====================================================
PRICE MOMENTUM
===================================================== */

const priceMomentum =
priceMomentumEngine({
historyMetrics,

indices:
data.indices ?? {}
});


/* =====================================================
DIVERGENCE — LEGACY
===================================================== */

/*
* Bestehende Divergence-Logik bleibt
* zunächst bewusst erhalten.
*
* Sie wird parallel zur neuen
* internalDivergenceEngine geführt.
*/

const divergence = (() => {

const breadth =
Number(
structure?.breadth?.b50?.value ?? 0
);

const ad =
Number(
structure?.advanceDecline?.value ?? 0
);

let score = 0;

if (
breadth > 80 &&
ad < 0
) {
score -= 2;
}

if (
breadth < 40 &&
ad > 0
) {
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
Number(
data.marketLiquidityScore ?? 50
),

creditRatio:
Number(
data.creditRatio ?? 1
),

gammaExposure:
Number(
data.gammaExposure ?? 0
),

vixTermRatio:
Number(
data.vixTermRatio ?? 1
),

volOfVolRatio:
Number(
data.volOfVolRatio ?? 1
),

marketData:
data.marketData ?? {},

breadth50,
breadth200,

correlationScore:
Number(
data.correlationScore ?? 0
),

historyMetrics
});


/* =====================================================
FRAGILITY
===================================================== */

const fragility =
fragilityEngine({

historyMetrics,

crash: {
probability:
Number(
data.crashProbability ?? 0
)
},

breadth50,
breadth200,

liquidity,

gammaExposure:
Number(
data.gammaExposure ?? 0
),

correlationScore:
Number(
data.correlationScore ?? 0
),

vix,

volOfVolRatio:
Number(
data.volOfVolRatio ?? 1
),

structure
});


/* =====================================================
SQUEEZE
===================================================== */

const squeeze =
squeezeEngine({

gammaExposure:
Number(
data.gammaExposure ?? 0
),

vix,

moveIndex:
Number(
data.moveIndex ?? 80
),

breadth50
});


/* =====================================================
ROTATION BASE
===================================================== */

const rotationBase =
rotationEngine({

...data.rotation,

concentrationScore:
Number(
data.concentrationScore ?? 0
),

futuresVsCash:
Number(
data.futuresVsCash ?? 0
),

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

historyMetrics,

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

rotation:
rotationBase,

divergenceState:
divergence.state,

concentrationScore:
Number(
data.concentrationScore ?? 50
),

rotationScore:
Number(
rotationBase?.score ?? 50
)
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
Number(
data.concentrationScore ?? 50
),

divergenceState:
divergence.state
});


/* =====================================================
BREADTH VELOCITY
===================================================== */

/*
* Neuer zentraler Breadth-Velocity-State.
*
* WICHTIG:
* Keine .history-Properties mehr aus
* structure.breadth.* lesen.
*
* Historische Werte kommen aus den oben
* vorbereiteten History-Variablen.
*/

const breadthVelocity =
breadthVelocityEngine({

structure,

breadth20,

breadth20_5dAgo,

breadth50,

breadth50_5dAgo,

breadth50_10dAgo,

breadth200,

breadth200_10dAgo,

breadth200_20dAgo,

advanceDecline:
Number(
structure?.advanceDecline?.value ?? 0
),

advanceDecline_5dAgo,

spx:
spxCurrent,

spx5dAgo

});


/* =====================================================
INTERNAL DIVERGENCE
===================================================== */

/*
* Neuer institutioneller Divergence-State.
*
* Parallel zur Legacy-Divergence.
*/

const internalDivergence =
internalDivergenceEngine({

spxTrend:
Number(
breadthVelocity?.slopes?.spxSlope5d ?? 0
),

spxMomentum:
Number(
priceMomentum?.score ?? 0
),

breadth20,
breadth50,
breadth200,

breadth20Slope5d:
Number(
breadthVelocity?.slopes?.b20Slope5d ?? 0
),

breadth50Slope5d:
Number(
breadthVelocity?.slopes?.b50Slope5d ?? 0
),

breadth200Slope10d:
Number(
breadthVelocity?.slopes?.b200Slope10d ?? 0
),

adLine:
Number(
structure?.advanceDecline?.value ?? 0
),

adSlope5d:
Number(
breadthVelocity?.slopes?.adSlope5d ?? 0
),

rsEqual:
Number(
rotationBase?.rsEqual ?? 1
),

rsSmall:
Number(
rotationBase?.rsSmall ?? 1
),

rsGrowth:
Number(
rotationBase?.rsGrowth ?? 1
),

participationScore:
Number(
participation?.score ?? 50
),

rotationScore:
Number(
rotationBase?.score ?? 50
),

concentrationScore:
Number(
data.concentrationScore ?? 50
),

liquidityScore:
Number(
liquidity?.score ?? 50
),

vix,

gammaExposure:
Number(
data.gammaExposure ?? 0
)
});


/* =====================================================
REGIME PERSISTENCE — PRE PHASE
===================================================== */

const regimePersistencePre =
regimePersistenceEngine({

breadth50,
breadth200,

participationScore:
Number(
participation?.score ?? 50
),

rotationDecayScore:
0,

dangerScore:
0,

fragilityScore:
Number(
fragility?.score ?? 50
),

internalDivergenceScore:
Number(
divergence?.score ?? 0
),

breadth50History:
historyMetrics?.breadth50History ?? [],

breadth200History:
historyMetrics?.breadth200History ?? [],

participationHistory:
historyMetrics?.participationHistory ?? [],

rotationDecayHistory:
historyMetrics?.rotationDecayHistory ?? [],

phase:
"PRE_PHASE"
});


/* =====================================================
FINAL ROTATION
===================================================== */

const rotation =
rotationEngine({

...data.rotation,

concentrationScore:
Number(
data.concentrationScore ?? 0
),

futuresVsCash:
Number(
data.futuresVsCash ?? 0
),

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

const crash =
crashEngine({

...data,

historyMetrics,

vix,

vixTermRatio:
Number(
data.vixTermRatio ?? 1
),

moveIndex:
Number(
data.moveIndex ??
data.marketDrivers?.raw?.move ??
0
),

volOfVolRatio:
Number(
data.volOfVolRatio ?? 1
),

gammaExposure:
Number(
data.gammaExposure ?? 0
),

correlationScore:
Number(
data.correlationScore ?? 0
),

drivers:
driversCore
});


/* =====================================================
EARLY WARNING
===================================================== */

const earlyWarning =
earlyWarningEngine({

...data,

historyMetrics
});


/* =====================================================
TEMP PUT
===================================================== */

const putTimingTemp =
putTimingEngine({

phase:
"TEMP",

rotation,
crash,
earlyWarning,

historyMetrics,
priceMomentum
});


/* =====================================================
TEMP RUSSELL
===================================================== */

const russellTemp =
russellEngine({

rsSmall:
rotation.rsSmall,

rsGrowth:
rotation.rsGrowth,

breadth50,
breadth200,

concentrationScore:
Number(
data.concentrationScore ?? 0
),

phase:
"TEMP",

crash,
vix,
historyMetrics
});


/* =====================================================
PHASE
===================================================== */

const phaseData =
marketPhaseEngine({

crash,
rotation,

putTiming:
putTimingTemp,

earlyWarning,
structure,

russell:
russellTemp,

historyMetrics,

priceMomentum,

regimePersistence:
regimePersistencePre
});


const phase =
phaseData.phase;


const regime = {

label:
phase,

score:
crash.score

};


/* =====================================================
PHASE STAGE
===================================================== */

const phaseStage = {

phase,
phaseData

};


/* =====================================================
CONFIDENCE
===================================================== */

const confidence =
confidenceEngine({

...data,

crash,
rotation,
phase

});


/* =====================================================
SYSTEM HEAT
===================================================== */

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
REGIME SYNC — PRE
===================================================== */

const regimeSyncPre =
regimeSyncEngine({

phase,

crash,
rotation,
structure,
earlyWarning,

vix,

gammaExposure:
Number(
data.gammaExposure ?? 0
),

liquidityScore:
Number(
liquidity?.score ?? 50
),

creditRatio:
Number(
data.creditRatio ?? 1
),

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
Number(
crash?.probability ?? 0
),

crashMomentum:
Number(
crash?.momentum ?? 0
),

breadth50,
breadth200,

liquidityVacuumScore:
Number(
data.liquidityVacuumScore ?? 0
),

correlationScore:
Number(
data.correlationScore ?? 0
),

gammaExposure:
Number(
data.gammaExposure ?? 0
),

volOfVolRatio:
Number(
data.volOfVolRatio ?? 1
),

creditRatio:
Number(
data.creditRatio ?? 1
),

vix,

history:
historyMetrics

});


/* =====================================================
EXECUTION STATE — PRE
===================================================== */

const executionStatePre =
executionStateEngine({

regimeSignal:
phase ?? "NEUTRAL",

crashProbability:
Number(
crash?.probability ?? 0
),

dangerScore:
Number(
dangerZone?.score ?? 0
),

stressScore:
Math.abs(
Number(
systemHeat?.value ?? 0
)
) * 10,

rotationSignal:
rotation?.signal ?? "neutral",

rotationStrength:
Number(
rotation?.score ?? 0
),

breadth200,
breadth50,

gammaExposure:
Number(
data.gammaExposure ?? 0
),

liquidityScore:
Number(
liquidity?.score ?? 50
),

volatilityState:
vix > 25
? "HIGH_VOL"
: "NORMAL",

regimeSyncScore:
Number(
regimeSyncPre?.score ?? 50
),

regimeSyncState:
regimeSyncPre?.state ??
"TRANSITION",

confidence:
Number(
confidence?.score ?? 50
),

rotationDecayScore:
0,

fragilityScore:
Number(
fragility?.score ?? 50
),

participationScore:
Number(
participation?.score ?? 50
),

squeezeRisk:
Number(
squeeze?.risk ?? 0
),

divergenceState:
divergence?.state ?? "NONE",

internalDivergence,

regimePersistence:
regimePersistencePre,

concentrationScore:
Number(
data.concentrationScore ?? 50
),

vix,

masterScore:
Number(
data.masterScore ?? 50
)

});


/* =====================================================
ROTATION DECAY
===================================================== */

const rotationDecay =
rotationDecayEngine({

historyMetrics,

rotation,
structure,

crash,
earlyWarning,

liquidity,
fragility,
squeeze,

participation,
breadthThrust,

regimeSync:
regimeSyncPre,

executionState:
executionStatePre,

breadth50,
breadth200,

vix,

concentrationScore:
Number(
data.concentrationScore ?? 0
),

gammaExposure:
Number(
data.gammaExposure ?? 0
),

creditRatio:
Number(
data.creditRatio ?? 1
),

marketLiquidityScore:
Number(
data.marketLiquidityScore ?? 50
),

breadthTrend:
historyMetrics?.breadthTrend,

breadthAcceleration:
historyMetrics?.breadthAcceleration,

participationDecay:
historyMetrics?.participationDecay,

leadershipDecay:
historyMetrics?.leadershipDecay,

relativeBreadthWeakness:
historyMetrics?.relativeBreadthWeakness

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

drivers:
marketDrivers,

positioning: {},

volatility: {
vix
},

executionState:
executionStatePre,

regimeSync:
regimeSyncPre,

liquidity,
fragility,
squeeze,

participation,
breadthThrust,

rotationDecay,

historyMetrics

});


/* =====================================================
FINAL RUSSELL
===================================================== */

const russell =
russellEngine({

rsSmall:
rotation.rsSmall,

rsGrowth:
rotation.rsGrowth,

breadth50,
breadth200,

concentrationScore:
Number(
data.concentrationScore ?? 0
),

phase,

crash,
vix,

historyMetrics,

rotationDecay,
rotationConfirm,

participation,

internalDivergence,

priceMomentum

});


/* =====================================================
PHASE CONFIRMATION
===================================================== */

const phaseConfirmation =
phaseConfirmationEngine({

phase,
phaseData,

rotation,

crash,
earlyWarning,

participation,
breadthThrust,

liquidity,
fragility,

rotationDecay,

historyMetrics

});


/* =====================================================
MARKET QUALITY
===================================================== */

const marketQuality =
marketQualityEngine({

structure,

participation,

rotation,
breadthThrust,

rotationDecay,

liquidity,
fragility,

phaseConfirmation,

internalDivergence,

regimeSync:
regimeSyncPre,

concentrationScore:
Number(
data.concentrationScore ?? 50
)

});


/* =====================================================
REGIME SYNC — FINAL
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
Number(
data.gammaExposure ?? 0
),

liquidityScore:
Number(
liquidity?.score ?? 50
),

creditRatio:
Number(
data.creditRatio ?? 1
),

breadth50,
breadth200,

fragility,
participation,
breadthThrust,

marketQuality

});


/* =====================================================
REGIME PERSISTENCE — FINAL
===================================================== */

const regimePersistence =
regimePersistenceEngine({

breadth50,
breadth200,

participationScore:
Number(
participation?.score ?? 50
),

rotationDecayScore:
Number(
rotationDecay?.score ?? 0
),

dangerScore:
Number(
dangerZone?.score ?? 0
),

fragilityScore:
Number(
fragility?.score ?? 50
),

internalDivergenceScore:
Number(
internalDivergence?.score ??
divergence?.score ??
0
),

breadth50History:
historyMetrics?.breadth50History ?? [],

breadth200History:
historyMetrics?.breadth200History ?? [],

participationHistory:
historyMetrics?.participationHistory ?? [],

rotationDecayHistory:
historyMetrics?.rotationDecayHistory ?? [],

phase:
phase ?? "UNKNOWN"

});


/* =====================================================
FINAL PUT TIMING
===================================================== */

const putTiming =
putTimingEngine({

phase,

rotation,
crash,
earlyWarning,

historyMetrics,
priceMomentum,

participation,
liquidity,

dangerZone,

marketDrivers,

regimeSync,

breadthThrust,
marketQuality,

rotationDecay,

regimePersistence

});


/* =====================================================
MASTER
===================================================== */

const masterInput = {
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
marketQuality,
rotationDecay,
phaseConfirmation,
regimeSync,
phaseStage,
historyMetrics,
priceMomentum,
regimePersistence
};


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

marketQuality,

rotationDecay,
phaseConfirmation,
regimeSync,

phaseStage,

historyMetrics,

priceMomentum,

regimePersistence

});


/* =====================================================
EXECUTION STATE — FINAL
===================================================== */

const executionState =
executionStateEngine({

regimeSignal:
phase ?? "NEUTRAL",

crashProbability:
Number(
crash?.probability ?? 0
),

dangerScore:
Number(
dangerZone?.score ?? 0
),

stressScore:
Math.abs(
Number(
systemHeat?.value ?? 0
)
) * 10,

rotationSignal:
rotation?.signal ?? "neutral",

rotationStrength:
Number(
rotation?.score ?? 0
),

breadth200,
breadth50,

gammaExposure:
Number(
data.gammaExposure ?? 0
),

liquidityScore:
Number(
liquidity?.score ?? 50
),

volatilityState:
vix > 25
? "HIGH_VOL"
: "NORMAL",

regimeSyncScore:
Number(
regimeSync?.score ?? 50
),

regimeSyncState:
regimeSync?.state ??
"TRANSITION",

confidence:
Number(
confidence?.score ?? 50
),

rotationDecayScore:
Number(
rotationDecay?.score ?? 0
),

fragilityScore:
Number(
fragility?.score ?? 50
),

participationScore:
Number(
participation?.score ?? 50
),

squeezeRisk:
Number(
squeeze?.risk ?? 0
),

divergenceState:
divergence?.state ?? "NONE",

internalDivergence,

regimePersistence,

concentrationScore:
Number(
data.concentrationScore ?? 50
),

vix,

masterScore:
Number(
master?.score ?? 50
)

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

marketQuality,

rotationDecay,
rotationConfirm,

participation,

divergence,
priceMomentum,

executionState,
regimeSync,
dangerZone,

marketData:
data.marketData ?? {}

});


/* =====================================================
NASDAQ CALL
===================================================== */

const nasdaqCall =
nasdaqEngine({

...data,

phase,
phaseData,

crash,
rotation,

putTiming,
earlyWarning,

historyMetrics,
priceMomentum,

marketQuality,
participation,
breadthThrust,
liquidity,

regimeSync,
executionState,

master

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

score:
Math.round(
(Number(rotation?.score ?? 50) * 0.5) +
(Number(structure?.health?.value ?? 0) * 0.3) -
(Number(crash?.probability ?? 0) * 0.2)
)

};


/* =====================================================
TRADE STACK
===================================================== */

const tradeStack =
tradeStackEngine({

phase,

putTiming,
nasdaqCall,
russell,

priceMomentum,
edgeState,

master,
marketQuality,
phaseConfirmation,

rotationConfirm,
rotationDecay,

executionState,
regimeSync,

historyMetrics,

regimePersistence

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
Number(
data.pnl ?? 0
)

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
marketQuality,
squeeze,
participation,

phase,
historyMetrics,
priceMomentum,

regimePersistence

});


/* =====================================================
EXIT
===================================================== */

const exit =
exitEngine({

position: {
size:
sizing.size
},

crash,

vix,
breadth50,

pnl:
Number(
data.pnl ?? 0
),

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
Number(
data.pnl ?? 0
),

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

phaseConfirmation,

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
participation,
marketQuality,

priceMomentum,

regimePersistence

});


const signal = {

...(signalResult?.signal ?? {
active: false
}),

phase

};


/* =====================================================
SUPER SIGNAL
===================================================== */

const superSignal =
superSignalEngine({

signal,

phaseConfirmation,

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
participation,
marketQuality,

regimePersistence

});


/* =====================================================
EXECUTION
===================================================== */

const execution =
executionEngine({

superSignal,

marketQuality,

vix,

breadth20,
breadth50,

crash,
phase,

executionState,
dangerZone,
regimeSync,

rotationConfirm,

liquidity,
breadthThrust,
fragility,
squeeze,
participation

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
historicalReplay(
replaySnapshots
);


/* =====================================================
RETURN
===================================================== */

return {

crash,

phase,
phaseData,

priceMomentum,

phaseConfirmation,

regime,

rotation,
rotationConfirm,
rotationDecay,

/*
* Neuer Breadth-Velocity-State.
*/
breadthVelocity,

/*
* Neuer institutioneller Divergence-State.
*/
internalDivergence,

/*
* Finaler Persistence-State.
*/
regimePersistence,

/*
* PRE-State bewusst separat verfügbar,
* damit Debugging möglich bleibt.
*/
regimePersistencePre,

signal,
superSignal,

decision,

execution,

executionState,

/*
* PRE-State ebenfalls nur für Debugging.
*/
executionStatePre,

regimeSync,
regimeSyncPre,

dangerZone,

liquidity,
breadthThrust,
fragility,
squeeze,
participation,
marketQuality,

position,
positioning,

sizing,
exit,
risk,

putTiming,
russell,
nasdaqCall,

master,
confidence,

systemHeat,
earlyWarning,

structure,

tradeStack,
edgeState,

/*
* Legacy divergence bleibt vorerst
* für Vergleich/Regression verfügbar.
*/
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