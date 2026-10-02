import type {
HistoricalRegimeFeatures,
} from "./historicalRegimeFeatures";

import type {
HistoricalForwardOutcome,
} from "./historicalRegimeOutcomes";


/* =====================================================
HISTORICAL REGIME OBSERVATIONS

Purpose:
- Join historical features and future outcomes by date
- Keep information at T separate from future outcomes
- Provide deterministic observations for later analysis
- No similarity scoring
- No regime classification
- No synthetic Rotation-App history
===================================================== */


export type HistoricalRegimeObservation = {
date: string;

features: HistoricalRegimeFeatures;

outcomes: HistoricalForwardOutcome;
};


export type HistoricalRegimeObservationDataset = {
observations: HistoricalRegimeObservation[];

count: number;

firstDate: string | null;
lastDate: string | null;

diagnostics: {
featureCount: number;
outcomeCount: number;

missingOutcomeDates: number;

completeMA200Count: number;

completeForward5DCount: number;
completeForward20DCount: number;
completeForward60DCount: number;

fullyUsableCount: number;
};
};


/* =====================================================
BUILD OBSERVATIONS
===================================================== */

export function buildHistoricalRegimeObservations(
features: HistoricalRegimeFeatures[],
outcomes: HistoricalForwardOutcome[]
): HistoricalRegimeObservationDataset {

/* =================================================
OUTCOME LOOKUP BY DATE
================================================= */

const outcomeByDate =
new Map<string, HistoricalForwardOutcome>();


for (const outcome of outcomes) {

if (!outcome?.date) {
continue;
}

outcomeByDate.set(
outcome.date,
outcome
);
}


/* =================================================
JOIN
================================================= */

const observations:
HistoricalRegimeObservation[] = [];


let missingOutcomeDates = 0;


for (const feature of features) {

if (!feature?.date) {
continue;
}


const outcome =
outcomeByDate.get(
feature.date
);


if (!outcome) {

missingOutcomeDates++;

continue;
}


observations.push({
date:
feature.date,

features:
feature,

outcomes:
outcome,
});

}


/* =================================================
DETERMINISTIC ORDER
================================================= */

observations.sort(
(a, b) =>
a.date.localeCompare(
b.date
)
);


/* =================================================
DIAGNOSTICS
================================================= */

let completeMA200Count = 0;

let completeForward5DCount = 0;
let completeForward20DCount = 0;
let completeForward60DCount = 0;

let fullyUsableCount = 0;


for (
const observation
of observations
) {

const feature =
observation.features;

const outcome =
observation.outcomes;


const hasMA200 =
feature.nasdaqMA200 !== null &&
feature.nasdaqDistanceMA200 !== null;


const has5D =
outcome.forward5D !== null;


const has20D =
outcome.forward20D !== null;


const has60D =
outcome.forward60D !== null;


if (hasMA200) {
completeMA200Count++;
}


if (has5D) {
completeForward5DCount++;
}


if (has20D) {
completeForward20DCount++;
}


if (has60D) {
completeForward60DCount++;
}


/*
* "Fully usable" currently means:
*
* - long-term Nasdaq trend is available
* - longest requested forward outcome is available
*
* If those exist, all shorter lookbacks / horizons
* required by the current base model should also
* normally exist.
*
* We still keep the individual diagnostics above
* so this assumption remains visible.
*/

if (
hasMA200 &&
has60D
) {
fullyUsableCount++;
}

}


return {

observations,

count:
observations.length,

firstDate:
observations[0]?.date ??
null,

lastDate:
observations[
observations.length - 1
]?.date ??
null,

diagnostics: {

featureCount:
features.length,

outcomeCount:
outcomes.length,

missingOutcomeDates,

completeMA200Count,

completeForward5DCount,

completeForward20DCount,

completeForward60DCount,

fullyUsableCount,

},

};
}
