// /lib/forwardTest/forwardTestRunner.ts

import {
buildForwardExcursion,
buildForwardReturn,
} from "./forwardTestMetrics";

import {
FORWARD_HORIZONS,
type ForwardEngineSnapshot,
type ForwardExcursion,
type ForwardHorizon,
type ForwardMarketSnapshot,
type ForwardPhasePerformance,
type ForwardReturn,
type ForwardSignalPerformance,
type ForwardTestObservation,
type ForwardTestPerformance,
type ForwardTestResult,
type ForwardTestSignal,
} from "./forwardTestTypes";


/* =====================================================
* INPUT
* ===================================================== */

export interface ForwardTestInput {

engine: ForwardEngineSnapshot;

market: ForwardMarketSnapshot;

}


/* =====================================================
* INTERNAL SORTED SNAPSHOT
* ===================================================== */

interface SortedSnapshot {

engine: ForwardEngineSnapshot;

market: ForwardMarketSnapshot;

timestampMs: number;

}


/* =====================================================
* HELPERS
* ===================================================== */

function parseTimestamp(
timestamp: string
): number {

const value =
new Date(
timestamp
).getTime();

return Number.isFinite(value)
? value
: NaN;

}


function sortSnapshots(
snapshots: ForwardTestInput[]
): SortedSnapshot[] {

return snapshots
.map(
snapshot => ({

engine:
snapshot.engine,

market:
snapshot.market,

timestampMs:
parseTimestamp(
snapshot.market.timestamp
),

})
)
.filter(
snapshot =>
Number.isFinite(
snapshot.timestampMs
)
)
.sort(
(
a,
b
) =>
a.timestampMs -
b.timestampMs
);

}


function roundMetric(
value: number,
decimals = 2
): number {

if (
!Number.isFinite(value)
) {

return 0;

}

const factor =
Math.pow(
10,
decimals
);

return (
Math.round(
value * factor
) /
factor
);

}


function median(
values: number[]
): number | null {

if (
values.length === 0
) {

return null;

}

const sorted =
[...values]
.sort(
(
a,
b
) =>
a - b
);

const middle =
Math.floor(
sorted.length / 2
);

if (
sorted.length % 2 === 0
) {

return (
sorted[middle - 1] +
sorted[middle]
) / 2;

}

return sorted[middle];

}


/* =====================================================
* HORIZON SNAPSHOT
* ===================================================== */

/**
* Horizon means subsequent market observations,
* not calendar days.
*
* T+1 = next snapshot
* T+3 = third subsequent snapshot
* etc.
*/
function getFutureSnapshot(
snapshots: SortedSnapshot[],
entryIndex: number,
horizon: ForwardHorizon
): SortedSnapshot | null {

const futureIndex =
entryIndex +
horizon;

if (
futureIndex >=
snapshots.length
) {

return null;

}

return (
snapshots[
futureIndex
] ?? null
);

}


/* =====================================================
* EXCURSION WINDOW
* ===================================================== */

function getFutureWindow(
snapshots: SortedSnapshot[],
entryIndex: number,
horizon: ForwardHorizon
): ForwardMarketSnapshot[] {

const start =
entryIndex + 1;

const end =
Math.min(
entryIndex +
horizon,
snapshots.length - 1
);

if (
start > end
) {

return [];

}

return snapshots
.slice(
start,
end + 1
)
.map(
snapshot =>
snapshot.market
);

}


/* =====================================================
* SIGNAL DIRECTION
* ===================================================== */

function signalDirection(
signal: ForwardTestSignal
): "CALL" | "PUT" | null {

if (
signal === "CALL"
) {

return "CALL";

}

if (
signal === "PUT"
) {

return "PUT";

}

return null;

}


/* =====================================================
* BUILD OBSERVATION
* ===================================================== */

function buildObservation(
snapshots: SortedSnapshot[],
entryIndex: number
): ForwardTestObservation {

const entry =
snapshots[
entryIndex
];

const signal =
entry.engine.masterSignal;

const direction =
signalDirection(
signal
);

const forwardReturns:
ForwardReturn[] = [];

/*
* IMPORTANT:
*
* ForwardTestObservation requires:
*
* excursions: ForwardExcursion[]
*
* Therefore null values are never stored.
*
* buildForwardExcursion() may return null when
* insufficient price data exists. Those values are
* simply skipped.
*/

const excursions:
ForwardExcursion[] = [];

for (
const horizon
of FORWARD_HORIZONS
) {

const future =
getFutureSnapshot(
snapshots,
entryIndex,
horizon
);

if (
future === null
) {

continue;

}

const forwardReturn =
buildForwardReturn(
entry.market,
future.market,
horizon
);

if (
forwardReturn !== null
) {

forwardReturns.push(
forwardReturn
);

}

/*
* Neutral signals have no directional MFE/MAE.
*/

if (
direction !== null
) {

const futureWindow =
getFutureWindow(
snapshots,
entryIndex,
horizon
);

const excursion =
buildForwardExcursion(
entry.market,
futureWindow,
horizon,
direction
);

if (
excursion !== null
) {

excursions.push(
excursion
);

}

}

}

return {

id:
`${entry.market.timestamp}-${entryIndex}`,

timestamp:
entry.market.timestamp,

engine:
entry.engine,

market:
entry.market,

forwardReturns,

excursions,

};

}


/* =====================================================
* PERFORMANCE
* ===================================================== */

function calculatePerformance(
observations: ForwardTestObservation[],
horizon: ForwardHorizon
): ForwardTestPerformance {

const returns =
observations
.flatMap(
observation =>
observation.forwardReturns
)
.filter(
forwardReturn =>
forwardReturn.horizon ===
horizon
)
.map(
forwardReturn =>
forwardReturn.percentageChange
)
.filter(
(
value
): value is number =>
value !== null &&
Number.isFinite(value)
);

const favorableExcursions =
observations
.flatMap(
observation =>
observation.excursions
)
.filter(
excursion =>
excursion.horizon ===
horizon
)
.map(
excursion =>
excursion.maximumFavorableExcursion
)
.filter(
(
value
): value is number =>
value !== null &&
Number.isFinite(value)
);

const adverseExcursions =
observations
.flatMap(
observation =>
observation.excursions
)
.filter(
excursion =>
excursion.horizon ===
horizon
)
.map(
excursion =>
excursion.maximumAdverseExcursion
)
.filter(
(
value
): value is number =>
value !== null &&
Number.isFinite(value)
);

const positiveCount =
returns.filter(
value =>
value > 0
).length;

const negativeCount =
returns.filter(
value =>
value < 0
).length;

const flatCount =
returns.filter(
value =>
value === 0
).length;

const count =
returns.length;

return {

horizon,

observationCount:
count,

averageReturn:
count > 0
? roundMetric(
returns.reduce(
(
sum,
value
) =>
sum + value,
0
) / count
)
: null,

medianReturn:
count > 0
? roundMetric(
median(
returns
) ?? 0
)
: null,

positiveReturnRate:
count > 0
? roundMetric(
(
positiveCount /
count
) * 100
)
: null,

negativeReturnRate:
count > 0
? roundMetric(
(
negativeCount /
count
) * 100
)
: null,

flatReturnRate:
count > 0
? roundMetric(
(
flatCount /
count
) * 100
)
: null,

averageMaximumFavorableExcursion:
favorableExcursions.length > 0
? roundMetric(
favorableExcursions.reduce(
(
sum,
value
) =>
sum + value,
0
) /
favorableExcursions.length
)
: null,

averageMaximumAdverseExcursion:
adverseExcursions.length > 0
? roundMetric(
adverseExcursions.reduce(
(
sum,
value
) =>
sum + value,
0
) /
adverseExcursions.length
)
: null,

};

}


/* =====================================================
* SIGNAL PERFORMANCE
* ===================================================== */

function calculateSignalPerformance(
observations: ForwardTestObservation[]
): ForwardSignalPerformance[] {

const signals:
ForwardTestSignal[] = [
"CALL",
"NEUTRAL",
"PUT",
];

return signals.map(
signal => {

const filtered =
observations.filter(
observation =>
observation.engine.masterSignal ===
signal
);

return {

signal,

observationCount:
filtered.length,

performance:
FORWARD_HORIZONS.map(
horizon =>
calculatePerformance(
filtered,
horizon
)
),

};

}
);

}


/* =====================================================
* PHASE PERFORMANCE
* ===================================================== */

function calculatePhasePerformance(
observations: ForwardTestObservation[]
): ForwardPhasePerformance[] {

const phases = [
"PHASE_1_EXPANSION",
"PHASE_2_WARNING",
"PHASE_3_DISTRIBUTION",
"PHASE_4_RISK",
"PHASE_5_BREAKDOWN",
"PHASE_6_ACCELERATION",
"PHASE_7_CAPITULATION",
] as const;

return phases.map(
phase => {

const filtered =
observations.filter(
observation =>
observation.engine.phase ===
phase
);

return {

phase,

observationCount:
filtered.length,

performance:
FORWARD_HORIZONS.map(
horizon =>
calculatePerformance(
filtered,
horizon
)
),

};

}
);

}


/* =====================================================
* MAIN RUNNER
* ===================================================== */

export function runForwardTest(
input: ForwardTestInput[]
): ForwardTestResult {

const snapshots =
sortSnapshots(
input
);

if (
snapshots.length === 0
) {

const now =
new Date().toISOString();

return {

generatedAt:
now,

startDate:
now,

endDate:
now,

observations: [],

signalPerformance: [],

phasePerformance: [],

};

}

const observations:
ForwardTestObservation[] = [];

/*
* Only observations with at least one future
* horizon are useful.
*/

for (
let index = 0;
index < snapshots.length;
index++
) {

const hasFuture =
FORWARD_HORIZONS.some(
horizon =>
index +
horizon <
snapshots.length
);

if (
!hasFuture
) {

continue;

}

observations.push(
buildObservation(
snapshots,
index
)
);

}

return {

generatedAt:
new Date().toISOString(),

startDate:
snapshots[0]
.market
.timestamp,

endDate:
snapshots[
snapshots.length - 1
]
.market
.timestamp,

observations,

signalPerformance:
calculateSignalPerformance(
observations
),

phasePerformance:
calculatePhasePerformance(
observations
),

};

}


/* =====================================================
* SINGLE OBSERVATION HELPER
* ===================================================== */

export function runForwardTestObservation(
snapshots: ForwardTestInput[],
index: number
): ForwardTestObservation | null {

const sorted =
sortSnapshots(
snapshots
);

if (
index < 0 ||
index >= sorted.length
) {

return null;

}

const hasFuture =
FORWARD_HORIZONS.some(
horizon =>
index +
horizon <
sorted.length
);

if (
!hasFuture
) {

return null;

}

return buildObservation(
sorted,
index
);

}
