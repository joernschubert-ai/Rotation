// lib/forwardTest/historyToForwardSnapshots.ts

import type {
ForwardEngineSnapshot,
ForwardMarketSnapshot,
} from "./forwardTestTypes";


/* =====================================================
TYPES
===================================================== */

export interface PersistedMarketSnapshot {
timestamp?: string;

phase?: {
phase?: string;
regimeState?: string;
subPhase?: string;
confidence?: number;
};

master?: {
score?: number;
mode?: string;
regime?: string;
netExposure?: number;
signal?: string;
signalStrength?: number;

meta?: {
signal?: string;
signalStrength?: number;
};

components?: Record<string, number>;
};

crash?: {
score?: number;
probability?: number;
};

rotation?: {
score?: number;
confidence?: number;
};

rotationDecay?: {
score?: number;
};

rotationConfirm?: {
confidence?: number;
};

structure?: {
breadth?: {
b20?: number;
b50?: number;
b200?: number;
};
};

participation?: {
score?: number;
};

breadthThrust?: {
score?: number;
};

breadthVelocity?: {
score?: number;
};

liquidity?: {
score?: number;
};

marketQuality?: {
score?: number;
};

fragility?: {
score?: number;
};

regimeSync?: {
score?: number;
};

dangerZone?: {
score?: number;
};

priceMomentum?: {
score?: number;
};

putTiming?: {
score?: number;
decision?: string;
timing?: string;
execution?: string;
};

russell?: {
confidence?: number;
};

tradeStack?: {
nasdaqPut?: {
strength?: number;
score?: number;
};

nasdaqCall?: {
strength?: number;
score?: number;
};

russellCall?: {
strength?: number;
score?: number;
};
};

indices?: {
dow?: {
value?: number;
change?: number;
};

nasdaq?: {
value?: number;
change?: number;
};

sp500?: {
value?: number;
change?: number;
};

russell?: {
value?: number;
change?: number;
};

vix?: {
current?: number;
value?: number;
change?: number;
};

vixTermRatio?: number | null;
volOfVolRatio?: number | null;
};

futures?: {
dow?: {
value?: number;
change?: number;
};

nasdaq?: {
value?: number;
change?: number;
};

sp500?: {
value?: number;
change?: number;
};

russell?: {
value?: number;
change?: number;
};
};

[key: string]: unknown;
}


/* =====================================================
HELPERS
===================================================== */

function finiteNumber(
value: unknown,
fallback = 0
): number {

const number =
Number(value);

return Number.isFinite(number)
? number
: fallback;
}


function nullableNumber(
value: unknown
): number | null {

const number =
Number(value);

return Number.isFinite(number)
? number
: null;
}


function getTimestamp(
snapshot: PersistedMarketSnapshot
): string | null {

if (
typeof snapshot.timestamp !== "string"
) {

return null;

}

const timestamp =
new Date(snapshot.timestamp);

if (
Number.isNaN(
timestamp.getTime()
)
) {

return null;

}

return snapshot.timestamp;

}


/* =====================================================
DATE KEY
===================================================== */

function getUtcDateKey(
timestamp: string
): string {

return timestamp.slice(0, 10);

}


/* =====================================================
LAST SNAPSHOT PER DAY
===================================================== */

export function selectLastSnapshotPerDay(
history: PersistedMarketSnapshot[]
): PersistedMarketSnapshot[] {

const validSnapshots =
history
.filter(
(snapshot) =>
getTimestamp(snapshot) !== null
)
.sort(
(a, b) =>
new Date(
a.timestamp as string
).getTime()
-
new Date(
b.timestamp as string
).getTime()
);

const byDay =
new Map<
string,
PersistedMarketSnapshot
>();

for (
const snapshot
of validSnapshots
) {

const timestamp =
getTimestamp(snapshot);

if (!timestamp) {
continue;
}

const day =
getUtcDateKey(timestamp);

byDay.set(
day,
snapshot
);

}

return Array.from(
byDay.values()
).sort(
(a, b) =>
new Date(
a.timestamp as string
).getTime()
-
new Date(
b.timestamp as string
).getTime()
);

}


/* =====================================================
ENGINE SNAPSHOT
===================================================== */

export function mapHistorySnapshotToEngineSnapshot(
snapshot: PersistedMarketSnapshot
): ForwardEngineSnapshot {

const phase =
snapshot.phase ?? {};

const master =
snapshot.master ?? {};

const masterMeta =
master.meta ?? {};

const rotation =
snapshot.rotation ?? {};

const rotationDecay =
snapshot.rotationDecay ?? {};

const rotationConfirm =
snapshot.rotationConfirm ?? {};

const structure =
snapshot.structure ?? {};

const breadth =
structure.breadth ?? {};

const crash =
snapshot.crash ?? {};

const participation =
snapshot.participation ?? {};

const breadthThrust =
snapshot.breadthThrust ?? {};

const breadthVelocity =
snapshot.breadthVelocity ?? {};

const liquidity =
snapshot.liquidity ?? {};

const marketQuality =
snapshot.marketQuality ?? {};

const fragility =
snapshot.fragility ?? {};

const regimeSync =
snapshot.regimeSync ?? {};

const dangerZone =
snapshot.dangerZone ?? {};

const priceMomentum =
snapshot.priceMomentum ?? {};

const putTiming =
snapshot.putTiming ?? {};

const tradeStack =
snapshot.tradeStack ?? {};


/* ===================================================
MASTER SIGNAL
=================================================== */

const masterSignal =
masterMeta.signal ??
master.signal ??
"NEUTRAL";

const signalStrength =
finiteNumber(
masterMeta.signalStrength ??
master.signalStrength ??
0
);


return {

timestamp:
snapshot.timestamp as string,

phase:
phase.phase as ForwardEngineSnapshot["phase"],

regimeState:
phase.regimeState as ForwardEngineSnapshot["regimeState"],

subPhase:
phase.subPhase as ForwardEngineSnapshot["subPhase"],

phaseConfidence:
finiteNumber(
phase.confidence
),

masterScore:
finiteNumber(
master.score,
50
),

masterMode:
master.mode as ForwardEngineSnapshot["masterMode"],

masterRegime:
master.regime as ForwardEngineSnapshot["masterRegime"],

netExposure:
finiteNumber(
master.netExposure
),

masterSignal:
masterSignal as ForwardEngineSnapshot["masterSignal"],

signalStrength,

crashScore:
finiteNumber(
crash.score
),

crashProbability:
finiteNumber(
crash.probability
),

rotationScore:
finiteNumber(
rotation.score
),

rotationConfidence:
finiteNumber(
rotation.confidence
),

rotationDecayScore:
finiteNumber(
rotationDecay.score
),

rotationConfirmConfidence:
finiteNumber(
rotationConfirm.confidence
),

breadth20:
finiteNumber(
breadth.b20
),

breadth50:
finiteNumber(
breadth.b50
),

breadth200:
finiteNumber(
breadth.b200
),

participationScore:
finiteNumber(
participation.score
),

breadthThrustScore:
finiteNumber(
breadthThrust.score
),

breadthVelocityScore:
finiteNumber(
breadthVelocity.score
),

liquidityScore:
finiteNumber(
liquidity.score
),

marketQualityScore:
finiteNumber(
marketQuality.score
),

fragilityScore:
finiteNumber(
fragility.score
),

regimeSyncScore:
finiteNumber(
regimeSync.score
),

dangerScore:
finiteNumber(
dangerZone.score
),

priceMomentumScore:
finiteNumber(
priceMomentum.score
),

putTimingScore:
finiteNumber(
putTiming.score
),

putTimingDecision:
putTiming.decision ?? "NONE",

putTimingTiming:
putTiming.timing ?? "NONE",

putTimingExecution:
putTiming.execution ?? "NONE",

nasdaqPutStrength:
finiteNumber(
tradeStack.nasdaqPut?.strength ??
tradeStack.nasdaqPut?.score
),

nasdaqCallStrength:
finiteNumber(
tradeStack.nasdaqCall?.strength ??
tradeStack.nasdaqCall?.score
),

russellCallStrength:
finiteNumber(
tradeStack.russellCall?.strength ??
tradeStack.russellCall?.score
),

};

}


/* =====================================================
MARKET SNAPSHOT
===================================================== */

export function mapHistorySnapshotToMarketSnapshot(
snapshot: PersistedMarketSnapshot
): ForwardMarketSnapshot {

const indices =
snapshot.indices ?? {};

const nasdaq =
indices.nasdaq ?? {};

const sp500 =
indices.sp500 ?? {};

const russell =
indices.russell ?? {};

const vix =
indices.vix ?? {};


return {

timestamp:
snapshot.timestamp as string,

ndx:
nullableNumber(
nasdaq.value
),

spx:
nullableNumber(
sp500.value
),

rut:
nullableNumber(
russell.value
),

vix:
nullableNumber(
vix.current ??
vix.value
),

};

}


/* =====================================================
COMPLETE HISTORY ADAPTER
===================================================== */

export interface ForwardHistoryData {

engineSnapshots:
ForwardEngineSnapshot[];

marketSnapshots:
ForwardMarketSnapshot[];

}


/*
* Converts persisted Market History into the exact
* chronological input required by the Forward Test.
*
* Multiple snapshots per day are collapsed first.
*
* Therefore:
*
* T+1 = next available market day
* T+3 = third available market day
* T+5 = fifth available market day
*/

export function buildForwardHistory(
history: PersistedMarketSnapshot[]
): ForwardHistoryData {

const dailySnapshots =
selectLastSnapshotPerDay(
history
);

const engineSnapshots =
dailySnapshots.map(
mapHistorySnapshotToEngineSnapshot
);

const marketSnapshots =
dailySnapshots.map(
mapHistorySnapshotToMarketSnapshot
);

return {

engineSnapshots,

marketSnapshots,

};

}
