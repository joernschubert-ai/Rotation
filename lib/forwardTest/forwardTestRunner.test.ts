// lib/forwardTest/forwardTestRunner.test.ts

import {
runForwardTest,
type ForwardTestInput,
} from "./forwardTestRunner";

import type {
ForwardEngineSnapshot,
ForwardMarketSnapshot,
} from "./forwardTestTypes";


/* =====================================================
TEST CONFIG
===================================================== */

const TOTAL_SNAPSHOTS = 50;


/* =====================================================
ENGINE SNAPSHOT FACTORY
===================================================== */

function createEngineSnapshot(
timestamp: string,
signal: "CALL" | "PUT" = "CALL"
): ForwardEngineSnapshot {

const isPut = signal === "PUT";

return {

timestamp,

phase: "PHASE_1_EXPANSION",

regimeState:
isPut
? "RISK"
: "LONG",

subPhase: "EXPANSION",

phaseConfidence: 90,

masterScore:
isPut
? 80
: 20,

masterMode:
isPut
? "RISK"
: "LONG",

masterRegime:
isPut
? "RISK"
: "LONG",

netExposure:
isPut
? -40
: 40,

masterSignal:
signal,

signalStrength: 80,

crashScore:
isPut
? 60
: 10,

crashProbability:
isPut
? 50
: 5,

rotationScore:
isPut
? 30
: 80,

rotationConfidence: 80,

rotationDecayScore:
isPut
? 60
: 10,

rotationConfirmConfidence: 80,

breadth20:
isPut
? 35
: 70,

breadth50:
isPut
? 40
: 75,

breadth200:
isPut
? 60
: 80,

participationScore:
isPut
? 40
: 75,

breadthThrustScore:
isPut
? 40
: 80,

breadthVelocityScore:
isPut
? 60
: 10,

liquidityScore:
isPut
? 45
: 75,

marketQualityScore:
isPut
? 40
: 80,

fragilityScore:
isPut
? 70
: 20,

regimeSyncScore:
isPut
? 40
: 80,

dangerScore:
isPut
? 30
: 5,

priceMomentumScore:
isPut
? 30
: 80,

putTimingScore:
isPut
? 10
: 0,

putTimingDecision:
isPut
? "DEFENSIVE_BUILD"
: "NONE",

putTimingTiming:
isPut
? "EARLY"
: "NONE",

putTimingExecution:
isPut
? "SMALL_STARTER"
: "NONE",

nasdaqPutStrength:
isPut
? 80
: 0,

nasdaqCallStrength:
isPut
? 0
: 80,

russellCallStrength:
isPut
? 0
: 60,

};
}


/* =====================================================
MARKET SNAPSHOT FACTORY
===================================================== */

function createMarketSnapshot(
index: number,
mode: "RISING" | "FALLING"
): ForwardMarketSnapshot {

const price =
mode === "RISING"
? 100 + index
: 200 - index;

return {

timestamp:
new Date(
Date.UTC(
2026,
0,
1 + index
)
).toISOString(),

ndx: price,

spx: price,

rut: price,

vix:
mode === "RISING"
? 15
: 25,

};
}


/* =====================================================
ASSERTION
===================================================== */

function assert(
condition: boolean,
message: string
) {

if (!condition) {

throw new Error(
`FAIL: ${message}`
);

}

console.log(
`PASS: ${message}`
);

}


/* =====================================================
TEST 1
RISING MARKET / CALL
===================================================== */

console.log(
"Running forwardTestRunner deterministic tests..."
);

const risingSnapshots:
ForwardTestInput[] = [];

for (
let index = 0;
index < TOTAL_SNAPSHOTS;
index++
) {

const market =
createMarketSnapshot(
index,
"RISING"
);

risingSnapshots.push({

engine:
createEngineSnapshot(
market.timestamp,
"CALL"
),

market,

});

}

const risingResult =
runForwardTest(
risingSnapshots
);


assert(
risingResult.observations.length === 49,
"rising market observation count = 49"
);

assert(
risingResult.observations[0]
?.engine.masterSignal === "CALL",
"rising market CALL signal"
);

assert(
risingResult.observations[0]
?.engine.phase === "PHASE_1_EXPANSION",
"rising market PHASE_1"
);

assert(
risingResult.observations[0]
?.forwardReturns[0]
?.percentageChange === 1,
"CALL T+1 return = +1%"
);

assert(
risingResult.observations[0]
?.forwardReturns[1]
?.percentageChange === 3,
"CALL T+3 return = +3%"
);

assert(
risingResult.observations[0]
?.forwardReturns[2]
?.percentageChange === 5,
"CALL T+5 return = +5%"
);

assert(
risingResult.observations[0]
?.forwardReturns[3]
?.percentageChange === 10,
"CALL T+10 return = +10%"
);

assert(
risingResult.observations[0]
?.forwardReturns[4]
?.percentageChange === 20,
"CALL T+20 return = +20%"
);

assert(
risingResult.observations[0]
?.forwardReturns[5]
?.percentageChange === 40,
"CALL T+40 return = +40%"
);


/* =====================================================
TEST 2
FALLING MARKET / PUT
===================================================== */

const fallingSnapshots:
ForwardTestInput[] = [];

for (
let index = 0;
index < TOTAL_SNAPSHOTS;
index++
) {

const market =
createMarketSnapshot(
index,
"FALLING"
);

fallingSnapshots.push({

engine:
createEngineSnapshot(
market.timestamp,
"PUT"
),

market,

});

}

const fallingResult =
runForwardTest(
fallingSnapshots
);


assert(
fallingResult.observations.length === 49,
"falling market observation count = 49"
);

assert(
fallingResult.observations[0]
?.engine.masterSignal === "PUT",
"falling market PUT signal"
);

assert(
fallingResult.observations[0]
?.forwardReturns[0]
?.direction === "DOWN",
"PUT T+1 direction = DOWN"
);

assert(
fallingResult.observations[0]
?.forwardReturns[0]
?.percentageChange === -0.5,
"PUT T+1 underlying return = -0.5%"
);

assert(
fallingResult.observations[0]
?.forwardReturns[1]
?.percentageChange === -1.5,
"PUT T+3 underlying return = -1.5%"
);

assert(
fallingResult.observations[0]
?.forwardReturns[2]
?.percentageChange === -2.5,
"PUT T+5 underlying return = -2.5%"
);


/* =====================================================
DIRECTION CHECK
===================================================== */

const fallingReturns =
fallingResult.observations
.flatMap(
observation =>
observation.forwardReturns
);

const fallingDownCount =
fallingReturns.filter(
item =>
item.direction === "DOWN"
).length;


assert(
fallingDownCount > 0,
"falling market contains DOWN returns"
);


/* =====================================================
TEST 3
PUT DIRECTIONAL PERFORMANCE
===================================================== */

/*
* The underlying is falling.
*
* Therefore every valid PUT performance
* observation must have the opposite sign
* of the underlying return.
*
* We deliberately do NOT assert a fixed
* average return here because calculatePerformance()
* aggregates all valid PUT observations.
*/

const putPerformance =
fallingResult.signalPerformance.find(
item =>
item.signal === "PUT"
);


assert(
putPerformance !== undefined,
"PUT performance block exists"
);


const putT1 =
putPerformance?.performance.find(
item =>
item.horizon === 1
);


const putT3 =
putPerformance?.performance.find(
item =>
item.horizon === 3
);


const putT5 =
putPerformance?.performance.find(
item =>
item.horizon === 5
);


/*
* The average directional performance
* must be positive for every tested horizon.
*/

assert(
putT1?.averageReturn !== null &&
putT1?.averageReturn !== undefined &&
putT1.averageReturn > 0,
"PUT T+1 directional performance is positive"
);

assert(
putT3?.averageReturn !== null &&
putT3?.averageReturn !== undefined &&
putT3.averageReturn > 0,
"PUT T+3 directional performance is positive"
);

assert(
putT5?.averageReturn !== null &&
putT5?.averageReturn !== undefined &&
putT5.averageReturn > 0,
"PUT T+5 directional performance is positive"
);


/* =====================================================
PUT POSITIVE RETURN RATE
===================================================== */

assert(
putT1?.positiveReturnRate === 100,
"PUT T+1 positive directional return rate = 100%"
);


/* =====================================================
FINAL
===================================================== */

console.log(
"All deterministic forward-test checks passed."
);
