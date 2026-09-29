// lib/aiResearch/aiResearchRunner.ts

import { loadMarketHistory } from "@/lib/history/marketHistory";

import { buildAIResearchContext } from "./aiResearchContext";
import { runAIResearch } from "./aiResearchEngine";
import { fetchExternalResearchSources } from "./aiResearchExternalSources";
import { selectTopResearchSources } from "./aiResearchSourceRelevance";
import { fetchCOTData } from "./aiResearchCOTProvider";

import type {
AIResearchResult,
AIResearchTask,
} from "./aiResearchTypes";


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
RUN AI RESEARCH
===================================================== */

export async function runAIResearchFromHistory(
input: RunAIResearchFromHistoryInput
): Promise<AIResearchResult> {

try {

/* =================================================
LOAD DATA IN PARALLEL
================================================= */

const [
history,
externalSources,
positioningResult,
] = await Promise.all([

loadMarketHistory(),

fetchExternalResearchSources({
task:
input.task,
}),

fetchCOTData(),

]);


/* =================================================
HISTORY VALIDATION
================================================= */

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

],

},

};

}


/* =================================================
CURRENT SNAPSHOT
================================================= */

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

],

},

};

}


/* =================================================
EXTERNAL RESEARCH SOURCES
================================================= */

const rankedSources =
selectTopResearchSources(

externalSources.sources,

input.task,

12

);


/* =================================================
BUILD AI RESEARCH CONTEXT
================================================= */

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
positioningResult
.data,

});


/* =================================================
RUN AI RESEARCH
================================================= */

const result =
runAIResearch(
researchInput
);


/* =================================================
DIAGNOSTICS
================================================= */

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

],

};

}

else {

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
