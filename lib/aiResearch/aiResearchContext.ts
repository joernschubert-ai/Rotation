// /lib/aiResearch/aiResearchContext.ts

import type {
AIResearchContext,
AIResearchHistory,
AIResearchInput,
AIResearchSnapshot,
AIResearchSource,
AIResearchTask,
} from "./aiResearchTypes";


/* =====================================================
CONSTANTS
===================================================== */

/*
* The AI agent should not receive an unlimited amount
* of historical data.
*
* The complete market history remains stored in Redis.
* This adapter only creates the bounded research context.
*/

const MAX_HISTORY_SNAPSHOTS = 30;


/* =====================================================
TYPES
===================================================== */

export interface BuildAIResearchContextInput {
snapshot: AIResearchSnapshot;

history?: AIResearchHistory;

task: AIResearchTask;

question?: string;

requestedAt?: string;

sources?: AIResearchSource[];
}


/* =====================================================
HELPERS
===================================================== */

function isObject(
value: unknown
): value is Record<string, unknown> {

return (
typeof value === "object" &&
value !== null &&
!Array.isArray(value)
);

}


function getTimestamp(
snapshot: AIResearchSnapshot
): string | null {

const timestamp =
snapshot.timestamp;

if (
typeof timestamp === "string" &&
timestamp.length > 0
) {

return timestamp;

}

return null;

}


function sortHistoryChronologically(
history: AIResearchHistory
): AIResearchHistory {

return [...history].sort(
(a, b) => {

const timestampA =
getTimestamp(a);

const timestampB =
getTimestamp(b);

if (!timestampA && !timestampB) {
return 0;
}

if (!timestampA) {
return -1;
}

if (!timestampB) {
return 1;
}

return (
new Date(timestampA).getTime() -
new Date(timestampB).getTime()
);

}
);

}


function sanitizeHistory(
history: AIResearchHistory
): AIResearchHistory {

const validSnapshots =
history.filter(
(snapshot) =>
isObject(snapshot) &&
getTimestamp(snapshot) !== null
);

const chronological =
sortHistoryChronologically(
validSnapshots
);

/*
* Keep the most recent research window.
*
* Older history remains untouched in Redis.
*/

return chronological.slice(
-MAX_HISTORY_SNAPSHOTS
);

}


/* =====================================================
BUILD RESEARCH CONTEXT
===================================================== */

/**
* Converts the existing Rotation-App snapshot/history
* into the standardized input contract for the
* AI Research Agent.
*
* IMPORTANT:
*
* - Does NOT modify the market engine.
* - Does NOT modify the snapshot.
* - Does NOT call an external AI service.
* - Does NOT make trading decisions.
* - Does NOT generate a CALL/PUT signal.
*
* It only creates the data contract consumed by the
* future research engine.
*/

export function buildAIResearchContext(
input: BuildAIResearchContextInput
): AIResearchInput {

const {

snapshot,

history = [],

task,

question,

requestedAt =
new Date().toISOString(),

sources = [],

} = input;


/* -------------------------------------------------
CURRENT SNAPSHOT
------------------------------------------------- */

if (!isObject(snapshot)) {

throw new Error(
"AI Research Context: invalid snapshot"
);

}


const snapshotTimestamp =
getTimestamp(snapshot);


if (!snapshotTimestamp) {

throw new Error(
"AI Research Context: snapshot has no timestamp"
);

}


/* -------------------------------------------------
HISTORY
------------------------------------------------- */

const sanitizedHistory =
sanitizeHistory(history);


/* -------------------------------------------------
CONTEXT
------------------------------------------------- */

const context: AIResearchContext = {

task,

requestedAt,

...(question
? {
question,
}
: {}),

};


/* -------------------------------------------------
RESULT
------------------------------------------------- */

return {

snapshot,

history:
sanitizedHistory,

context,

sources:
Array.isArray(sources)
? sources
: [],

};

}
