import { loadMarketHistory } from "@/lib/history/marketHistory";

import { buildAIResearchContext } from "./aiResearchContext";
import { runAIResearch } from "./aiResearchEngine";
import { fetchExternalResearchSources } from "./aiResearchExternalSources";
import { selectTopResearchSources } from "./aiResearchSourceRelevance";

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
* Source Relevance / Ranking
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
* Die Relevanzbewertung bestimmt nur,
* welche externen Quellen für die jeweilige
* Research-Aufgabe priorisiert werden.
*
* Sie erzeugt kein Bull/Bear-Signal.
*
* =====================================================
*/


/* =====================================================
* INPUT
* ===================================================== */

export interface RunAIResearchFromHistoryInput {

task:
AIResearchTask;

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
* SOURCE RELEVANCE / RANKING
* -------------------------------------------------
*
* Die externe Quellebeschaffung bleibt unverändert.
*
* Erst hier werden die Quellen für die konkrete
* Research-Aufgabe bewertet und sortiert.
*
* WICHTIG:
*
* relevance bedeutet ausschließlich:
*
* "Wie relevant ist diese Quelle für diese
* Research-Aufgabe?"
*
* Es bedeutet NICHT:
*
* - bullish
* - bearish
* - Call
* - Put
* - Crash-Signal
*
* Anschließend werden nur die relevantesten Quellen
* in den Research-Context übernommen.
*/

const rankedSources =
selectTopResearchSources(
externalSources.sources,
input.task,
12
);


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
rankedSources,

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
rankedSources.length,

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
rankedSources.length,

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
