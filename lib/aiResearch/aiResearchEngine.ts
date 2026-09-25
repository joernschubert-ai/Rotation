// /lib/aiResearch/aiResearchEngine.ts

import type {
AIDivergence,
AIForwardTestClaim,
AIRegimeAssessment,
AIResearchInput,
AIResearchReport,
AIResearchResult,
AIResearchRisk,
AIResearchThesis,
} from "./aiResearchTypes";


/* =====================================================
HELPERS
===================================================== */

function clamp(
value: number,
min = 0,
max = 100
): number {

return Math.max(
min,
Math.min(max, value)
);

}


function numberValue(
value: unknown,
fallback = 0
): number {

const parsed =
Number(value);

return Number.isFinite(parsed)
? parsed
: fallback;

}


function stringValue(
value: unknown,
fallback = ""
): string {

return typeof value === "string"
? value
: fallback;

}


function objectValue(
value: unknown
): Record<string, unknown> {

if (
typeof value === "object" &&
value !== null &&
!Array.isArray(value)
) {

return value as Record<string, unknown>;

}

return {};

}


function getNested(
object: Record<string, unknown>,
key: string
): Record<string, unknown> {

return objectValue(
object[key]
);

}


/* =====================================================
SNAPSHOT EXTRACTION
===================================================== */

interface ExtractedSnapshot {

masterScore: number;

masterSignal: string;

phase: string;

phaseConfidence: number;

rotationScore: number;

rotationConfidence: number;

rotationDecayScore: number;

breadthVelocityScore: number;

breadthThrustScore: number;

participationScore: number;

liquidityScore: number;

fragilityScore: number;

marketQualityScore: number;

regimeSyncScore: number;

crashScore: number;

crashProbability: number;

priceMomentumScore: number;

putTimingScore: number;

nasdaq: number;

russell: number;

}


function extractSnapshot(
snapshot: AIResearchInput["snapshot"]
): ExtractedSnapshot {

const master =
getNested(snapshot, "master");

const masterMeta =
getNested(master, "meta");

const crash =
getNested(snapshot, "crash");

const phase =
getNested(snapshot, "phase");

const rotation =
getNested(snapshot, "rotation");

const rotationDecay =
getNested(snapshot, "rotationDecay");

const breadthVelocity =
getNested(snapshot, "breadthVelocity");

const breadthThrust =
getNested(snapshot, "breadthThrust");

const participation =
getNested(snapshot, "participation");

const liquidity =
getNested(snapshot, "liquidity");

const fragility =
getNested(snapshot, "fragility");

const marketQuality =
getNested(snapshot, "marketQuality");

const regimeSync =
getNested(snapshot, "regimeSync");

const priceMomentum =
getNested(snapshot, "priceMomentum");

const putTiming =
getNested(snapshot, "putTiming");

const indices =
getNested(snapshot, "indices");


return {

masterScore:
numberValue(
master["score"],
50
),

masterSignal:
stringValue(
masterMeta["signal"],
stringValue(
master["signal"],
"NEUTRAL"
)
),

phase:
stringValue(
phase["phase"],
"UNKNOWN"
),

phaseConfidence:
numberValue(
phase["confidence"],
0
),

rotationScore:
numberValue(
rotation["score"],
50
),

rotationConfidence:
numberValue(
rotation["confidence"],
0
),

rotationDecayScore:
numberValue(
rotationDecay["score"],
0
),

breadthVelocityScore:
numberValue(
breadthVelocity["score"],
50
),

breadthThrustScore:
numberValue(
breadthThrust["score"],
50
),

participationScore:
numberValue(
participation["score"],
50
),

liquidityScore:
numberValue(
liquidity["score"],
50
),

fragilityScore:
numberValue(
fragility["score"],
50
),

marketQualityScore:
numberValue(
marketQuality["score"],
50
),

regimeSyncScore:
numberValue(
regimeSync["score"],
50
),

crashScore:
numberValue(
crash["score"],
0
),

crashProbability:
numberValue(
crash["probability"],
0
),

priceMomentumScore:
numberValue(
priceMomentum["score"],
50
),

putTimingScore:
numberValue(
putTiming["score"],
0
),

nasdaq:
numberValue(
indices["nasdaq"],
0
),

russell:
numberValue(
indices["russell"],
0
),

};

}


/* =====================================================
REGIME ASSESSMENT
===================================================== */

function buildRegimeAssessment(
data: ExtractedSnapshot
): AIRegimeAssessment {

const score =
clamp(
data.masterScore
);

let bias:
AIRegimeAssessment["bias"];

if (score <= 35) {

bias = "CONSTRUCTIVE";

}

else if (score <= 64) {

bias = "NEUTRAL";

}

else if (score <= 85) {

bias = "DEFENSIVE";

}

else {

bias = "CRISIS";

}


const confidence =
clamp(
(
data.phaseConfidence +
data.rotationConfidence
) / 2
);


return {

bias,

confidence:
Math.round(confidence),

summary:
`Master Score ${Math.round(score)} | ${bias} | Phase ${data.phase}`,

};

}


/* =====================================================
DIVERGENCES
===================================================== */

function buildDivergences(
data: ExtractedSnapshot
): AIDivergence[] {

const divergences:
AIDivergence[] = [];


/*
* Price vs breadth / internals.
*/

if (
data.masterScore >= 65 &&
(
data.breadthVelocityScore < 45 ||
data.participationScore < 45
)
) {

divergences.push({

type:
"PRICE_VS_INTERNALS",

observation:
"Risk score is elevated while breadth/participation remain weak.",

significance:
"The market structure is more defensive than index-level price action alone may suggest.",

confidence:
80,

});

}


/*
* Nasdaq vs Russell.
*/

if (
data.nasdaq > 0 &&
data.russell > 0
) {

const relativePerformance =
(
data.nasdaq -
data.russell
) /
Math.max(
Math.abs(data.russell),
1
);


if (
Math.abs(relativePerformance) > 0.02
) {

divergences.push({

type:
"NASDAQ_VS_RUSSELL",

observation:
`NASDAQ/Russell relative level difference detected (${(
relativePerformance * 100
).toFixed(2)}%).`,

significance:
"A persistent leadership gap can be relevant for rotation analysis.",

confidence:
55,

});

}

}


/*
* Rotation vs price.
*/

if (
data.rotationDecayScore >= 60 &&
data.rotationScore >= 45
) {

divergences.push({

type:
"ROTATION_VS_PRICE",

observation:
"Rotation remains relatively constructive while rotation decay is elevated.",

significance:
"The current rotation state may be losing persistence even if the headline rotation score has not fully deteriorated.",

confidence:
75,

});

}


/*
* Price vs fragility.
*/

if (
data.fragilityScore >= 70 &&
data.masterScore < 65
) {

divergences.push({

type:
"PRICE_VS_FRAGILITY",

observation:
"Structural fragility is elevated while the overall Master Score remains below the defensive threshold.",

significance:
"The internal structure may be weakening before the aggregate risk score confirms it.",

confidence:
75,

});

}


/*
* Liquidity divergence.
*/

if (
data.liquidityScore < 35 &&
data.masterScore < 65
) {

divergences.push({

type:
"PRICE_VS_LIQUIDITY",

observation:
"Liquidity conditions are materially weaker than the aggregate market regime.",

significance:
"Liquidity deterioration can precede broader market deterioration.",

confidence:
70,

});

}


/*
* Regime vs price.
*/

if (
data.regimeSyncScore < 35 &&
data.masterScore < 65
) {

divergences.push({

type:
"REGIME_VS_PRICE",

observation:
"Regime synchronization is weak while the aggregate score remains below the defensive threshold.",

significance:
"The market may be transitioning between regimes rather than exhibiting a stable directional state.",

confidence:
65,

});

}


return divergences;

}


/* =====================================================
THESIS
===================================================== */

function buildThesis(
data: ExtractedSnapshot,
divergences: AIDivergence[]
): AIResearchThesis {

const supportingEvidence:
string[] = [];

const counterEvidence:
string[] = [];

const invalidationConditions:
string[] = [];


if (
data.masterScore >= 65
) {

supportingEvidence.push(
`Master Score is elevated at ${Math.round(data.masterScore)}.`
);

}

else {

counterEvidence.push(
`Master Score is below the defensive threshold at ${Math.round(data.masterScore)}.`
);

}


if (
data.fragilityScore >= 70
) {

supportingEvidence.push(
`Fragility is elevated at ${Math.round(data.fragilityScore)}.`
);

}

else {

counterEvidence.push(
`Fragility is not in the highest-risk zone (${Math.round(data.fragilityScore)}).`
);

}


if (
data.rotationDecayScore >= 60
) {

supportingEvidence.push(
`Rotation decay is elevated at ${Math.round(data.rotationDecayScore)}.`
);

}


if (
data.liquidityScore < 40
) {

supportingEvidence.push(
`Liquidity score is weak at ${Math.round(data.liquidityScore)}.`
);

}


if (
data.priceMomentumScore >= 60
) {

counterEvidence.push(
`Price momentum remains constructive at ${Math.round(data.priceMomentumScore)}.`
);

}

else if (
data.priceMomentumScore < 40
) {

supportingEvidence.push(
`Price momentum is weak at ${Math.round(data.priceMomentumScore)}.`
);

}


for (
const divergence of divergences
) {

supportingEvidence.push(
divergence.observation
);

}


invalidationConditions.push(
"Aggregate risk score returns sustainably below the defensive zone."
);

invalidationConditions.push(
"Breadth, participation and liquidity improve materially together."
);

invalidationConditions.push(
"Rotation decay falls while regime synchronization improves."
);


let statement =
"Market structure is currently balanced; no dominant research thesis is confirmed.";


if (
data.masterScore >= 85
) {

statement =
"Market structure shows a high defensive-risk configuration that warrants continued monitoring for confirmation and persistence.";

}

else if (
data.masterScore >= 65
) {

statement =
"Market structure is defensive, with internal conditions requiring confirmation before treating the move as a persistent regime change.";

}

else if (
data.masterScore <= 35
) {

statement =
"Market structure is constructive, with no current aggregate defensive confirmation.";

}


return {

statement,

supportingEvidence,

counterEvidence,

invalidationConditions,

};

}


/* =====================================================
RISKS
===================================================== */

function buildRisks(
data: ExtractedSnapshot,
divergences: AIDivergence[]
): AIResearchRisk[] {

const risks:
AIResearchRisk[] = [];


if (
data.crashProbability >= 50
) {

risks.push({

risk:
"Elevated crash probability",

explanation:
`Crash probability is ${Math.round(data.crashProbability)}%.`,

evidenceType:
"SNAPSHOT",

});

}


if (
data.fragilityScore >= 70
) {

risks.push({

risk:
"Structural fragility",

explanation:
`Fragility score is ${Math.round(data.fragilityScore)}.`,

evidenceType:
"SNAPSHOT",

});

}


if (
data.rotationDecayScore >= 60
) {

risks.push({

risk:
"Rotation decay",

explanation:
`Rotation decay score is ${Math.round(data.rotationDecayScore)}.`,

evidenceType:
"SNAPSHOT",

});

}


if (
data.liquidityScore < 40
) {

risks.push({

risk:
"Liquidity deterioration",

explanation:
`Liquidity score is ${Math.round(data.liquidityScore)}.`,

evidenceType:
"SNAPSHOT",

});

}


if (
divergences.length > 0
) {

risks.push({

risk:
"Internal divergence",

explanation:
`${divergences.length} structural divergence(s) detected.`,

evidenceType:
"COMBINED",

});

}


if (
risks.length === 0
) {

risks.push({

risk:
"No dominant structural risk",

explanation:
"Current snapshot does not contain a predefined high-risk structural trigger.",

evidenceType:
"SNAPSHOT",

});

}


return risks;

}


/* =====================================================
FORWARD TEST CLAIMS
===================================================== */

function buildForwardTestClaims(
data: ExtractedSnapshot
): AIForwardTestClaim[] {

const claims:
AIForwardTestClaim[] = [];


/*
* Defensive configuration.
*/

if (
data.masterScore >= 65
) {

claims.push({

claim:
"Elevated defensive structure should be monitored for continued weakness or failed recovery.",

expectedDirection:
"DOWN",

horizonDays:
5,

confirmationCondition:
"Master Score remains >= 65 and structural risk metrics do not materially improve.",

invalidationCondition:
"Master Score falls below 50 together with improving breadth, participation and liquidity.",

confidence:
60,

});

}


/*
* Strong constructive configuration.
*/

if (
data.masterScore <= 35
) {

claims.push({

claim:
"Constructive market structure should be monitored for continuation of positive price behavior.",

expectedDirection:
"UP",

horizonDays:
5,

confirmationCondition:
"Master Score remains <= 35 and structural quality remains stable or improves.",

invalidationCondition:
"Master Score rises above 50 with simultaneous deterioration in breadth or liquidity.",

confidence:
60,

});

}


/*
* Fragility warning.
*/

if (
data.fragilityScore >= 70 &&
data.masterScore < 65
) {

claims.push({

claim:
"Elevated fragility may precede deterioration of the aggregate market regime.",

expectedDirection:
"DOWN",

horizonDays:
5,

confirmationCondition:
"Fragility remains >= 70 while Master Score rises toward the defensive zone.",

invalidationCondition:
"Fragility falls below 55 while breadth and participation improve.",

confidence:
55,

});

}


return claims;

}


/* =====================================================
SUMMARY
===================================================== */

function buildSummary(
data: ExtractedSnapshot,
regime: AIRegimeAssessment,
divergences: AIDivergence[]
): string {

return [
`Research regime: ${regime.bias}.`,
`Master Score: ${Math.round(data.masterScore)}.`,
`Phase: ${data.phase}.`,
`Detected divergences: ${divergences.length}.`,
`Crash probability: ${Math.round(data.crashProbability)}%.`,
].join(" ");

}


/* =====================================================
ENGINE
===================================================== */

export function runAIResearch(
input: AIResearchInput
): AIResearchResult {

try {

const data =
extractSnapshot(
input.snapshot
);


const regime =
buildRegimeAssessment(
data
);


const divergences =
buildDivergences(
data
);


const thesis =
buildThesis(
data,
divergences
);


const risks =
buildRisks(
data,
divergences
);


const forwardTestClaims =
buildForwardTestClaims(
data
);


const report: AIResearchReport = {

generatedAt:
new Date().toISOString(),

task:
input.context.task,

regime,

thesis,

divergences,

risks,

forwardTestClaims,

sources:
input.sources ?? [],

summary:
buildSummary(
data,
regime,
divergences
),

};


return {

status:
"SUCCESS",

report,

diagnostics: {

snapshotTimestamp:
stringValue(
input.snapshot.timestamp
),

historyCount:
input.history.length,

sourceCount:
input.sources?.length ?? 0,

},

};

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
: "Unknown AI research error",

],

},

};

}

}
