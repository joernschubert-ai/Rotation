// /lib/history/historicalReplay.ts

import {
getHistoricalScenarios
} from "./historicalScenarioLibrary";

import {
historicalScenarioRunner
} from "./historicalScenarioRunner";


/* =====================================================
REPLAY ENGINE
===================================================== */

export function historicalReplay() {


/* ===================================================
LOAD PERMANENT SCENARIOS
=================================================== */

const scenarios =
getHistoricalScenarios();


/* ===================================================
RUN ALL SCENARIOS
=================================================== */

const results =
scenarios.map(
(scenario) =>
historicalScenarioRunner(
scenario
)
);


/* ===================================================
TESTS
=================================================== */

const tests =
results.map(
({
scenario,
actual,
evaluation
}) => {

return {

id:
scenario.id,

year:
scenario.year,

date:
scenario.date,

title:
scenario.title,

description:
scenario.description,


/* EXPECTED */

expectedPhase:
scenario.expected.phase,

expectedMode:
scenario.expected.mode,

expectedSignal:
scenario.expected.signal,


/* ACTUAL */

actualPhase:
actual.phase,

actualMode:
actual.mode,

actualSignal:
actual.signal,

riskScore:
actual.riskScore,


/* EVALUATION */

phaseMatch:
evaluation.phaseMatch,

modeMatch:
evaluation.modeMatch,

signalMatch:
evaluation.signalMatch,

riskMatch:
evaluation.riskMatch,

result:
evaluation.result

};

}
);


/* ===================================================
COUNTS
=================================================== */

const total =
tests.length;


const passCount =
tests.filter(
(test) =>
test.result === "PASS"
).length;


const partialCount =
tests.filter(
(test) =>
test.result === "PARTIAL"
).length;


const failCount =
tests.filter(
(test) =>
test.result === "FAIL"
).length;


/* ===================================================
ROBUSTNESS
=================================================== */

const robustnessScore =
total > 0
? Math.round(
(
(
passCount +
partialCount * 0.5
) /
total
) * 100
)
: 0;


/* ===================================================
PHASE ACCURACY
=================================================== */

const phaseAccuracy =
total > 0
? Math.round(
(
tests.filter(
(test) =>
test.phaseMatch
).length /
total
) * 100
)
: 0;


/* ===================================================
MODE ACCURACY
=================================================== */

const modeAccuracy =
total > 0
? Math.round(
(
tests.filter(
(test) =>
test.modeMatch
).length /
total
) * 100
)
: 0;


/* ===================================================
SIGNAL ACCURACY
=================================================== */

const signalAccuracy =
total > 0
? Math.round(
(
tests.filter(
(test) =>
test.signalMatch
).length /
total
) * 100
)
: 0;


/* ===================================================
RISK ACCURACY
=================================================== */

const riskAccuracy =
total > 0
? Math.round(
(
tests.filter(
(test) =>
test.riskMatch
).length /
total
) * 100
)
: 0;


/* ===================================================
CRITICAL FAILURES
=================================================== */

const criticalFailures =
tests.filter(
(test) => {

const expectedRisk =
test.expectedMode === "CRASH" ||
test.expectedMode === "RISK";


const actualBullish =
test.actualSignal === "CALL";


return (
expectedRisk &&
actualBullish
);

}
).length;


/* ===================================================
FALSE DEFENSIVE
=================================================== */

const falseDefensiveStates =
tests.filter(
(test) => {

const expectedExpansion =
test.expectedMode === "LONG";


const actualDefensive =
test.actualMode === "RISK" ||
test.actualMode === "CRASH";


return (
expectedExpansion &&
actualDefensive
);

}
).length;


/* ===================================================
MISSED CRASHES
=================================================== */

const missedCrashes =
tests.filter(
(test) => {

const expectedCrash =
test.expectedMode === "CRASH";


const actualDefensive =
test.actualMode === "CRASH" ||
test.actualSignal === "PUT";


return (
expectedCrash &&
!actualDefensive
);

}
).length;


/* ===================================================
LATE EXITS
=================================================== */

const lateExits =
tests.filter(
(test) => {

const expectedRisk =
test.expectedMode === "RISK";


const stillLong =
test.actualMode === "LONG" &&
test.actualSignal === "CALL";


return (
expectedRisk &&
stillLong
);

}
).length;


/* ===================================================
RETURN
=================================================== */

return {

robustnessScore,

totalScenarios:
total,

passCount,

partialCount,

failCount,


phaseAccuracy,

modeAccuracy,

signalAccuracy,

riskAccuracy,


falseDefensiveStates,

missedCrashes,

lateExits,

criticalFailures,


tests

};

}
