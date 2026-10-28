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
HISTORICAL SCENARIO INPUT
===================================================== */

/*
* This structure is deliberately explicit.
*
* Historical scenarios are calibration fixtures.
*
* Their supplied structural values must remain available
* to the phase engine even if marketEngine normally
* recalculates the corresponding live engines.
*/

export interface HistoricalScenarioInput {

historicalScenario: true;

scenarioId: string;

scenarioDate: string;

market: {

vix: number;

breadth50: number;

breadth200: number;

vixTermRatio: number;

};

rotation: {

score: number;

rsSmall: number;

rsEqual: number;

rsGrowth: number;

};

participation: {

score: number;

};

breadthThrust: {

score: number;

};

liquidity: {

score: number;

};

fragility: {

score: number;

};

rotationDecay: {

score: number;

};

internalDivergence: {

score: number;

severity: number;

};

regimeSync: {

score: number;

};

concentrationScore: number;

crash: {

score: number;

probability: number;

};

phaseConfirmation: {

confidence: number;

confirmed: boolean;

};

putTiming: {

score: number;

};

historyMetrics: Record<string, any>;

}


/* =====================================================
ADAPTER
===================================================== */

/*
* Converts a permanent historical scenario into an
* engine-compatible market input.
*
* IMPORTANT:
*
* The adapter does not pretend that historical data is
* live market data.
*
* Instead it explicitly marks the input as a historical
* calibration scenario and preserves the fixture values
* in historicalScenarioInput.
*
* marketEngine can therefore distinguish:
*
* LIVE:
* calculate from raw market inputs
*
* HISTORICAL:
* preserve supplied calibration values for replay
*/

export function historicalScenarioAdapter(
scenario: HistoricalScenario
) {

const historyMetrics =
scenario.historyMetrics ?? {};


const internalDivergenceScore =
Number(
scenario.internalDivergence?.score ?? 0
);


const regimeSyncScore =
Number(
scenario.regimeSync?.score ?? 50
);


const phaseConfirmation = {

confidence:
Number(
scenario.phaseConfirmation?.confidence ?? 70
),

confirmed:
Boolean(
scenario.phaseConfirmation?.confirmed ?? true
)

};


const historicalScenarioInput:
HistoricalScenarioInput = {

historicalScenario: true,

scenarioId:
scenario.id,

scenarioDate:
scenario.date,


/* =================================================
MARKET
================================================= */

market: {

vix:
Number(
scenario.market.vix
),

breadth50:
Number(
scenario.market.breadth50
),

breadth200:
Number(
scenario.market.breadth200
),

vixTermRatio:
Number(
scenario.market.vixTermRatio ?? 1
)

},


/* =================================================
ROTATION
================================================= */

rotation: {

score:
Number(
scenario.rotation.score
),

rsSmall:
Number(
scenario.rotation.rsSmall
),

rsEqual:
Number(
scenario.rotation.rsEqual
),

rsGrowth:
Number(
scenario.rotation.rsGrowth
)

},


/* =================================================
PARTICIPATION
================================================= */

participation: {

score:
Number(
scenario.participation.score
)

},


/* =================================================
BREADTH THRUST
================================================= */

breadthThrust: {

score:
Number(
scenario.breadthThrust.score
)

},


/* =================================================
LIQUIDITY
================================================= */

liquidity: {

score:
Number(
scenario.liquidity.score
)

},


/* =================================================
FRAGILITY
================================================= */

fragility: {

score:
Number(
scenario.fragility.score
)

},


/* =================================================
ROTATION DECAY
================================================= */

rotationDecay: {

score:
Number(
scenario.rotationDecay.score
)

},


/* =================================================
INTERNAL DIVERGENCE
================================================= */

/*
* IMPORTANT:
*
* The phase engine uses severity as the structural
* divergence measure.
*
* Historical fixtures use score.
*
* Therefore both are explicitly supplied.
*/

internalDivergence: {

score:
internalDivergenceScore,

severity:
internalDivergenceScore

},


/* =================================================
REGIME SYNC
================================================= */

regimeSync: {

score:
regimeSyncScore

},


/* =================================================
CONCENTRATION
================================================= */

concentrationScore:
Number(
scenario.concentrationScore ?? 50
),


/* =================================================
CRASH
================================================= */

crash: {

score:
Number(
scenario.crash.score
),

probability:
Number(
scenario.crash.probability
)

},


/* =================================================
PHASE CONFIRMATION
================================================= */

phaseConfirmation,


/* =================================================
PUT TIMING
================================================= */

putTiming: {

score:
Number(
scenario.putTiming?.score ?? 0
)

},


/* =================================================
HISTORY
================================================= */

historyMetrics

};


return {

/* ===================================================
HISTORICAL MODE MARKER
=================================================== */

historicalScenario: true,

scenarioId:
scenario.id,

scenarioDate:
scenario.date,


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

/*
* Both score and severity are provided so the
* historical fixture survives differing consumers.
*/

internalDivergence: {

score:
internalDivergenceScore,

severity:
internalDivergenceScore

},


/* ===================================================
REGIME SYNC
=================================================== */

regimeSync: {

score:
regimeSyncScore

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

phaseConfirmation,


/* ===================================================
PUT TIMING
=================================================== */

putTiming: {

score:
scenario.putTiming?.score ?? 0

},


/* ===================================================
HISTORY
=================================================== */

historyMetrics,


/* ===================================================
CANONICAL HISTORICAL FIXTURE
=================================================== */

historicalScenarioInput

};

}
