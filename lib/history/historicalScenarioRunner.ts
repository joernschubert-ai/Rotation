// /lib/history/historicalScenarioRunner.ts

import {
marketEngine
} from "@/lib/engine/marketEngine";

import {
historicalScenarioAdapter,
type HistoricalScenario
} from "./historicalScenarioAdapter";


/* =====================================================
RESULT
===================================================== */

export interface HistoricalScenarioResult {

scenario: HistoricalScenario;

engine: any;

actual: {

phase: string;

mode: string;

signal: string;

riskScore: number;

};


evaluation: {

phaseMatch: boolean;

modeMatch: boolean;

signalMatch: boolean;

riskMatch: boolean;

result:
| "PASS"
| "PARTIAL"
| "FAIL";

};

}


/* =====================================================
RUNNER
===================================================== */

export function historicalScenarioRunner(
scenario: HistoricalScenario
): HistoricalScenarioResult {

/* ===================================================
ADAPT
=================================================== */

const input =
historicalScenarioAdapter(
scenario
);


/* ===================================================
REAL ENGINE EXECUTION
=================================================== */

const engine =
marketEngine(
input as any
);


/* ===================================================
ACTUAL OUTPUT
=================================================== */

const actualPhase =
engine?.phase ??
"UNKNOWN";


const actualMode =
engine?.master?.mode ??
engine?.executionState?.executionMode ??
"UNKNOWN";


const actualSignal =
engine?.master?.signal ??
engine?.signal?.type ??
"UNKNOWN";


const actualRiskScore =
Number(
engine?.master?.score ?? 50
);


/* ===================================================
EXPECTED
=================================================== */

const expected =
scenario.expected;


/* ===================================================
PHASE MATCH
=================================================== */

const phaseMatch =
actualPhase === expected.phase;


/* ===================================================
MODE MATCH
=================================================== */

const modeMatch =
actualMode === expected.mode;


/* ===================================================
SIGNAL MATCH
=================================================== */

const signalMatch =
actualSignal === expected.signal;


/* ===================================================
RISK MATCH
=================================================== */

let riskMatch = true;


if (
typeof expected.minRisk === "number" &&
actualRiskScore < expected.minRisk
) {

riskMatch = false;

}


if (
typeof expected.maxRisk === "number" &&
actualRiskScore > expected.maxRisk
) {

riskMatch = false;

}


/* ===================================================
FINAL RESULT
=================================================== */

const matches = [

phaseMatch,

modeMatch,

signalMatch,

riskMatch

].filter(Boolean).length;


let result:
| "PASS"
| "PARTIAL"
| "FAIL";


if (matches === 4) {

result = "PASS";

}

else if (matches >= 2) {

result = "PARTIAL";

}

else {

result = "FAIL";

}


/* ===================================================
RETURN
=================================================== */

return {

scenario,

engine,

actual: {

phase:
actualPhase,

mode:
actualMode,

signal:
actualSignal,

riskScore:
actualRiskScore

},

evaluation: {

phaseMatch,

modeMatch,

signalMatch,

riskMatch,

result

}

};

}
