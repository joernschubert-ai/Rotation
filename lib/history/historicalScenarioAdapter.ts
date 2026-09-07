// /lib/history/historicalScenarioAdapter.ts

export interface HistoricalScenario {

id: string;

date: string;

year: number;

title: string;

description: string;


/* =====================================================
EXPECTED RESULT
===================================================== */

expected: {

phase:
| "PHASE_1_EXPANSION"
| "PHASE_2_WARNING"
| "PHASE_3_DISTRIBUTION"
| "PHASE_4_RISK"
| "PHASE_5_BREAKDOWN"
| "PHASE_6_ACCELERATION"
| "PHASE_7_CAPITULATION";

mode:
| "LONG"
| "NEUTRAL"
| "RISK"
| "CRASH";

signal:
| "CALL"
| "NEUTRAL"
| "PUT";

minRisk?: number;

maxRisk?: number;

};


/* =====================================================
MARKET
===================================================== */

market: {

vix: number;

breadth50: number;

breadth200: number;

vixTermRatio?: number;

};


/* =====================================================
ROTATION
===================================================== */

rotation: {

score: number;

rsSmall: number;

rsEqual: number;

rsGrowth: number;

};


/* =====================================================
PARTICIPATION
===================================================== */

participation: {

score: number;

};


/* =====================================================
BREADTH
===================================================== */

breadthThrust: {

score: number;

};


/* =====================================================
LIQUIDITY
===================================================== */

liquidity: {

score: number;

};


/* =====================================================
FRAGILITY
===================================================== */

fragility: {

score: number;

};


/* =====================================================
ROTATION DECAY
===================================================== */

rotationDecay: {

score: number;

};


/* =====================================================
INTERNAL DIVERGENCE
===================================================== */

internalDivergence?: {

score: number;

};


/* =====================================================
REGIME SYNC
===================================================== */

regimeSync?: {

score: number;

};


/* =====================================================
CONCENTRATION
===================================================== */

concentrationScore?: number;


/* =====================================================
CRASH
===================================================== */

crash: {

score: number;

probability: number;

};


/* =====================================================
PHASE CONFIRMATION
===================================================== */

phaseConfirmation?: {

confidence: number;

confirmed: boolean;

};


/* =====================================================
PUT TIMING
===================================================== */

putTiming?: {

score: number;

};


/* =====================================================
HISTORY METRICS
===================================================== */

historyMetrics?: Record<string, any>;

}


/* =====================================================
ADAPTER
===================================================== */

/*
* Converts a permanent historical scenario into an
* engine-compatible market input.
*
* The goal is NOT to fake a live API response.
*
* The goal is to provide the actual marketEngine with
* the same structural inputs that its sub-engines use.
*/

export function historicalScenarioAdapter(
scenario: HistoricalScenario
) {

const historyMetrics =
scenario.historyMetrics ?? {};


return {

/* ===================================================
MARKET DATA
=================================================== */

marketData: {

"^VIX": {

current:
scenario.market.vix

}

},


/* ===================================================
STRUCTURE
=================================================== */

structure: {

breadth: {

b50: {

value:
scenario.market.breadth50

},

b200: {

value:
scenario.market.breadth200

}

}

},


/* ===================================================
DIRECT BREADTH VALUES
=================================================== */

breadth50:
scenario.market.breadth50,

breadth200:
scenario.market.breadth200,


/* ===================================================
VIX
=================================================== */

vix:
scenario.market.vix,

vixTermRatio:
scenario.market.vixTermRatio ?? 1,


/* ===================================================
ROTATION
=================================================== */

rotation: {

score:
scenario.rotation.score,

rsSmall:
scenario.rotation.rsSmall,

rsEqual:
scenario.rotation.rsEqual,

rsGrowth:
scenario.rotation.rsGrowth

},


/* ===================================================
PARTICIPATION
=================================================== */

participation: {

score:
scenario.participation.score

},

participationScore:
scenario.participation.score,


/* ===================================================
BREADTH THRUST
=================================================== */

breadthThrust: {

score:
scenario.breadthThrust.score

},

breadthThrustScore:
scenario.breadthThrust.score,


/* ===================================================
LIQUIDITY
=================================================== */

liquidity: {

score:
scenario.liquidity.score

},

liquidityScore:
scenario.liquidity.score,


/* ===================================================
FRAGILITY
=================================================== */

fragility: {

score:
scenario.fragility.score

},

fragilityScore:
scenario.fragility.score,


/* ===================================================
ROTATION DECAY
=================================================== */

rotationDecay: {

score:
scenario.rotationDecay.score

},


/* ===================================================
INTERNAL DIVERGENCE
=================================================== */

internalDivergence: {

score:
scenario.internalDivergence?.score ?? 0

},


/* ===================================================
REGIME SYNC
=================================================== */

regimeSync: {

score:
scenario.regimeSync?.score ?? 50

},


/* ===================================================
CONCENTRATION
=================================================== */

concentrationScore:
scenario.concentrationScore ?? 50,


/* ===================================================
CRASH
=================================================== */

crash: {

score:
scenario.crash.score,

probability:
scenario.crash.probability

},


/* ===================================================
PHASE CONFIRMATION
=================================================== */

phaseConfirmation: {

confidence:
scenario.phaseConfirmation?.confidence ?? 70,

confirmed:
scenario.phaseConfirmation?.confirmed ?? true

},


/* ===================================================
PUT TIMING
=================================================== */

putTiming: {

score:
scenario.putTiming?.score ?? 0

},


/* ===================================================
HISTORY METRICS
=================================================== */

historyMetrics

};

}
