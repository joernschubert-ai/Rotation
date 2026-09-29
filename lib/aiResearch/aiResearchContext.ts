// lib/aiResearch/aiResearchContext.ts

import type {
AIResearchContext,
AIResearchHistory,
AIResearchInput,
AIResearchSnapshot,
AIResearchSource,
AIResearchTask,
} from "./aiResearchTypes";

import type {
AIResearchCOTData,
} from "./aiResearchCOTTypes";


const MAX_HISTORY_SNAPSHOTS = 30;


/* =====================================================
INPUT
===================================================== */

export interface BuildAIResearchContextInput {

snapshot:
AIResearchSnapshot;

history?:
AIResearchHistory;

task:
AIResearchTask;

question?:
string;

requestedAt?:
string;

sources?:
AIResearchSource[];

/*
* Structured COT positioning data.
*
* COT is deliberately kept separate from
* external news/research sources.
*/

positioning?:
AIResearchCOTData;

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


/* =====================================================
TIMESTAMP
===================================================== */

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


/* =====================================================
HISTORY SORT
===================================================== */

function sortHistoryChronologically(
history: AIResearchHistory
): AIResearchHistory {

return [...history].sort(
(a, b) => {

const timestampA =
getTimestamp(a);

const timestampB =
getTimestamp(b);


if (
!timestampA &&
!timestampB
) {

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


/* =====================================================
HISTORY SANITIZATION
===================================================== */

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


return chronological.slice(
-MAX_HISTORY_SNAPSHOTS
);

}


/* =====================================================
BUILD CONTEXT
===================================================== */

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

positioning,

} = input;


/* ===================================================
SNAPSHOT VALIDATION
=================================================== */

if (
!isObject(snapshot)
) {

throw new Error(
"AI Research Context: invalid snapshot"
);

}


const snapshotTimestamp =
getTimestamp(snapshot);


if (
!snapshotTimestamp
) {

throw new Error(
"AI Research Context: snapshot has no timestamp"
);

}


/* ===================================================
HISTORY
=================================================== */

const sanitizedHistory =
sanitizeHistory(
history
);


/* ===================================================
CONTEXT META
=================================================== */

const context:
AIResearchContext = {

task,

requestedAt,

...(question
? {
question,
}
: {}),

};


/* ===================================================
RETURN
=================================================== */

return {

snapshot,

history:
sanitizedHistory,

context,

sources:
Array.isArray(sources)
? sources
: [],

/*
* Only attach positioning when
* actual COT data was supplied.
*/

...(positioning
? {
positioning,
}
: {}),

};

}
