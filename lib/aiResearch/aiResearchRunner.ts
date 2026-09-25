// /lib/aiResearch/aiResearchRunner.ts

import {
loadMarketHistory,
} from "@/lib/history/marketHistory";

import {
buildAIResearchContext,
} from "./aiResearchContext";

import {
runAIResearch,
} from "./aiResearchEngine";

import type {
AIResearchResult,
AIResearchTask,
} from "./aiResearchTypes";


/* =====================================================
INPUT
===================================================== */

export interface RunAIResearchFromHistoryInput {

task: AIResearchTask;

question?: string;

}


/* =====================================================
RUN RESEARCH
===================================================== */

/**
* Loads the persisted Rotation-App market history,
* takes the newest snapshot as the current market state,
* builds the AI research context and runs the research
* engine.
*
* IMPORTANT:
*
* This function does NOT:
*
* - modify market history
* - modify the Market Engine
* - modify the Master Score
* - create trades
* - call an external AI service
*
* It is purely an analysis layer.
*/

export async function runAIResearchFromHistory(
input: RunAIResearchFromHistoryInput
): Promise<AIResearchResult> {

try {

/* -------------------------------------------------
LOAD HISTORY
------------------------------------------------- */

const history =
await loadMarketHistory();


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
0,

warnings: [

"No persisted market history available.",

],

},

};

}


/* -------------------------------------------------
CURRENT SNAPSHOT
------------------------------------------------- */

/*
* marketHistory stores newest snapshots first.
*
* The adapter still receives the complete history
* and independently limits the research window.
*/

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
0,

warnings: [

"Latest market history entry is invalid.",

],

},

};

}


/* -------------------------------------------------
BUILD CONTEXT
------------------------------------------------- */

const researchInput =
buildAIResearchContext({

snapshot:
currentSnapshot,

history,

task:
input.task,

question:
input.question,

});


/* -------------------------------------------------
RUN ENGINE
------------------------------------------------- */

return runAIResearch(
researchInput
);

}

catch (error) {

return {

status:
"RESEARCH_ERROR",

report:
null,

diagnostics: {

warnings: [

error instanceof Error
? error.message
: "Unknown AI research runner error",

],

},

};

}

}
