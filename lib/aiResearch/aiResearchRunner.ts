import { loadMarketHistory } from "@/lib/history/marketHistory";

import { buildAIResearchContext } from "./aiResearchContext";
import { runAIResearch } from "./aiResearchEngine";
import { fetchExternalResearchSources } from "./aiResearchExternalSources";
import { selectTopResearchSources } from "./aiResearchSourceRelevance";
import { fetchCOTData } from "./aiResearchCOTProvider";

import {
loadAIResearchHistoricalEvidence,
} from "./aiResearchHistoricalEvidenceService";

import type {
AIResearchResult,
AIResearchTask,
} from "./aiResearchTypes";

import type {
AIResearchHistoricalEvidence,
} from "./aiResearchHistoricalEvidenceTypes";

/* =====================================================
INPUT
===================================================== */

export interface RunAIResearchFromHistoryInput {

task:
AIResearchTask;

question?:
string;

}

/* =====================================================
HISTORICAL EVIDENCE FALLBACK
===================================================== */

/*
* Historical research is supplementary.
*
* A historical data failure must not prevent
* the AI Research Agent from interpreting the
* current market snapshot.
*/

function unavailableHistoricalEvidence(
warning: string
): AIResearchHistoricalEvidence {

return {

asOfDate: null,

firstDate: null,

lastDate: null,

status: "NOT_AVAILABLE",

currentStates: [],

observations: [],

diagnostics: {

totalHistoricalDays: 0,

totalObservations: 0,

totalGroups: 0,

matchedCurrentStates: 0,

unmatchedCurrentStates: 0,

forwardOutcomesUseFuturePrices: false,

historicalFeaturesAvoidLookahead: false,

predictiveEdgeValidated: false,

warnings: [
warning,
],

},

};

}

/* =====================================================
SAFE HISTORICAL EVIDENCE LOAD
===================================================== */

async function loadHistoricalEvidenceSafely():
Promise<AIResearchHistoricalEvidence> {

try {

return await loadAIResearchHistoricalEvidence();

} catch (error) {

const message =
error instanceof Error
? error.message
: "Unknown historical evidence error";

return unavailableHistoricalEvidence(
`Historical evidence unavailable: ${message}`
);

}

}

/* =====================================================
RUN AI RESEARCH
===================================================== */

export async function runAIResearchFromHistory(
input: RunAIResearchFromHistoryInput
): Promise<AIResearchResult> {

try {

/* =================================================
* LOAD DATA IN PARALLEL
* ================================================= */

const [
history,
externalSources,
positioningResult,
historicalEvidence,
] = await Promise.all([

loadMarketHistory(),

fetchExternalResearchSources({
task:
input.task,
}),

fetchCOTData(),

loadHistoricalEvidenceSafely(),

]);

const historicalWarnings =
historicalEvidence.diagnostics.warnings;

/* =================================================
* HISTORY VALIDATION
* ================================================= */

if (
!Array.isArray(history) ||
history.length === 0
) {

return {

status:
"INSUFFICIENT_DATA",

report:
null,

diagnostics: {

historyCount:
0,

sourceCount:
externalSources.sources.length,

warnings: [

"No persisted market history available.",

...externalSources
.diagnostics
.warnings,

...positioningResult
.diagnostics
.warnings,

...historicalWarnings,

],

},

};

}

/* =================================================
* CURRENT SNAPSHOT
* ================================================= */

const currentSnapshot =
history[0];

if (
!currentSnapshot ||
typeof currentSnapshot !== "object"
) {

return {

status:
"INSUFFICIENT_DATA",

report:
null,

diagnostics: {

historyCount:
history.length,

sourceCount:
externalSources.sources.length,

warnings: [

"Latest market history entry is invalid.",

...externalSources
.diagnostics
.warnings,

...positioningResult
.diagnostics
.warnings,

...historicalWarnings,

],

},

};

}

/* =================================================
* EXTERNAL RESEARCH SOURCES
* ================================================= */

const rankedSources =
selectTopResearchSources(

externalSources.sources,

input.task,

12

);

/* =================================================
* BUILD AI RESEARCH CONTEXT
* ================================================= */

const researchInput =
buildAIResearchContext({

snapshot:
currentSnapshot,

history,

task:
input.task,

question:
input.question,

sources:
rankedSources,

positioning:
positioningResult.data,

/*
* Historical evidence is supplied as a
* separate research input.
*
* It is never merged into trusted recent
* snapshot history.
*/

historicalEvidence,

});

/* =================================================
* RUN AI RESEARCH
* ================================================= */

const result =
runAIResearch(
researchInput
);

/* =================================================
* DIAGNOSTICS
* ================================================= */

if (
result.diagnostics
) {

result.diagnostics = {

...result.diagnostics,

historyCount:
history.length,

sourceCount:
rankedSources.length,

warnings: [

...(
result
.diagnostics
.warnings ?? []
),

...externalSources
.diagnostics
.warnings,

...positioningResult
.diagnostics
.warnings,

...historicalWarnings,

],

};

} else {

result.diagnostics = {

snapshotTimestamp:

typeof currentSnapshot.timestamp ===
"string"

? currentSnapshot.timestamp

: undefined,

historyCount:
history.length,

sourceCount:
rankedSources.length,

warnings: [

...externalSources
.diagnostics
.warnings,

...positioningResult
.diagnostics
.warnings,

...historicalWarnings,

],

};

}

return result;

} catch (error) {

return {

status:
"RESEARCH_ERROR",

report:
null,

diagnostics: {

warnings: [

error instanceof Error

? error.message

: "Unknown AI research error",

],

},

};

}

}

