import { loadMarketHistory } from "@/lib/history/marketHistory";

import { buildAIResearchContext } from "./aiResearchContext";
import { runAIResearch } from "./aiResearchEngine";
import { fetchExternalResearchSources } from "./aiResearchExternalSources";

import type {
AIResearchResult,
AIResearchTask,
} from "./aiResearchTypes";


/*
* =====================================================
* AI RESEARCH RUNNER
* =====================================================
*
* Gesamtpipeline:
*
* Market History
* +
* External Research Sources
* ↓
* AI Research Context
* ↓
* AI Research Engine
* ↓
* Research Report
*
* WICHTIG:
*
* Dieser Runner verändert keine bestehenden
* Market-Engine-Werte.
*
* Er führt ausschließlich die Research-Schicht
* zusammen.
*
* =====================================================
*/


/* =====================================================
* INPUT
* ===================================================== */

export interface RunAIResearchFromHistoryInput {

task: AIResearchTask;

question?: string;

}


/* =====================================================
* MAIN RUNNER
* ===================================================== */

export async function runAIResearchFromHistory(
input: RunAIResearchFromHistoryInput
): Promise<AIResearchResult> {

try {

/*
* -------------------------------------------------
* MARKET HISTORY + EXTERNAL SOURCES
* -------------------------------------------------
*
* Beide Datenquellen sind voneinander unabhängig.
*
* Deshalb parallel laden.
*/

const [
history,
externalSources,
] = await Promise.all([

loadMarketHistory(),

fetchExternalResearchSources({

task:
input.task,

}),

]);


/* -------------------------------------------------
* HISTORY VALIDATION
* ------------------------------------------------- */

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

...externalSources.diagnostics.warnings,

],

},

};

}


/* -------------------------------------------------
* CURRENT SNAPSHOT
* ------------------------------------------------- */

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

...externalSources.diagnostics.warnings,

],

},

};

}


/* -------------------------------------------------
* BUILD AI RESEARCH CONTEXT
* ------------------------------------------------- */

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
externalSources.sources,

});


/* -------------------------------------------------
* RUN RESEARCH ENGINE
* ------------------------------------------------- */

const result =
runAIResearch(
researchInput
);


/* -------------------------------------------------
* MERGE DIAGNOSTICS
* ------------------------------------------------- */

if (
result.diagnostics
) {

result.diagnostics = {

...result.diagnostics,

historyCount:
history.length,

sourceCount:
externalSources.sources.length,

warnings: [

...(result.diagnostics.warnings ?? []),

...externalSources.diagnostics.warnings,

],

};

}

else {

result.diagnostics = {

snapshotTimestamp:
typeof currentSnapshot.timestamp === "string"
? currentSnapshot.timestamp
: undefined,

historyCount:
history.length,

sourceCount:
externalSources.sources.length,

warnings:
externalSources.diagnostics.warnings,

};

}


return result;

} catch (
error
) {

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
