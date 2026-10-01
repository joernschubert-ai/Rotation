// /lib/aiResearch/aiResearchEngine.ts

import type {
AIDivergence,
AIForwardTestClaim,
AIRegimeAssessment,
AIResearchContradictionLevel,
AIResearchEntryMaturity,
AIResearchEvidenceAssessment,
AIResearchEvidenceBlock,
AIResearchEvidenceState,
AIResearchEvidenceStrength,
AIResearchHistory,
AIResearchInput,
AIResearchOpportunityState,
AIResearchReport,
AIResearchResult,
AIResearchRisk,
AIResearchStructuralBias,
AIResearchTensionAssessment,
AIResearchTensionState,
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


function optionalNumber(
value: unknown
): number | null {

const parsed =
Number(value);

return Number.isFinite(parsed)
? parsed
: null;

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


function booleanValue(
value: unknown,
fallback = false
): boolean {

return typeof value === "boolean"
? value
: fallback;

}


function uniqueStrings(
values: string[]
): string[] {

return [
...new Set(
values.filter(
(value) =>
value.trim().length > 0
)
),
];

}


/* =====================================================
INDEX PRICE EXTRACTION
===================================================== */

interface ExtractedIndexPrice {

value: number;

change: number | null;

return1D: number | null;

return3D: number | null;

return5D: number | null;

return10D: number | null;

return20D: number | null;

return50D: number | null;

distanceFromMA20: number | null;

distanceFromMA50: number | null;

distanceFromMA200: number | null;

drawdown20D: number | null;

acceleration: number | null;

trend: string;

}


function extractIndexPrice(
indices: Record<string, unknown>,
key: string
): ExtractedIndexPrice {

const index =
getNested(
indices,
key
);

const priceMetrics =
getNested(
index,
"priceMetrics"
);


/*
* Current snapshots store indices as objects:
*
* indices.nasdaq.value
* indices.nasdaq.priceMetrics.return20D
*
* The fallback to indices[key] keeps the extractor
* tolerant of older snapshots that may have stored
* a naked numeric index value.
*/

const rawIndex =
indices[key];

const fallbackValue =
typeof rawIndex === "number"
? rawIndex
: 0;


return {

value:
numberValue(
index["value"],
fallbackValue
),

change:
optionalNumber(
index["change"]
),

return1D:
optionalNumber(
priceMetrics["return1D"]
),

return3D:
optionalNumber(
priceMetrics["return3D"]
),

return5D:
optionalNumber(
priceMetrics["return5D"]
),

return10D:
optionalNumber(
priceMetrics["return10D"]
),

return20D:
optionalNumber(
priceMetrics["return20D"]
),

return50D:
optionalNumber(
priceMetrics["return50D"]
),

distanceFromMA20:
optionalNumber(
priceMetrics["distanceFromMA20"]
),

distanceFromMA50:
optionalNumber(
priceMetrics["distanceFromMA50"]
),

distanceFromMA200:
optionalNumber(
priceMetrics["distanceFromMA200"]
),

drawdown20D:
optionalNumber(
priceMetrics["drawdown20D"]
),

acceleration:
optionalNumber(
priceMetrics["acceleration"]
),

trend:
stringValue(
priceMetrics["trend"],
"UNKNOWN"
),

};

}


/* =====================================================
SNAPSHOT EXTRACTION
===================================================== */

interface ExtractedSnapshot {

timestamp: string;

masterScore: number;

masterSignal: string;

masterMode: string;

masterRegime: string;

phase: string;

phaseConfidence: number;

rotationScore: number;

rotationSignal: string;

rotationState: string;

rotationConfidence: number;

rsSmall: number | null;

rsGrowth: number | null;

rsEqual: number | null;

rotationDecayScore: number;

rotationDecayState: string;

rotationConfirmState: string;

rotationConfirmConfidence: number;

falseBreakRisk: number;

breadthVelocityScore: number;

breadthVelocityState: string;

breadthThrustScore: number;

breadthThrustState: string;

participationScore: number;

participationState: string;

liquidityScore: number;

liquidityState: string;

fragilityScore: number;

fragilityState: string;

marketQualityScore: number;

marketQualityState: string;

regimeSyncScore: number;

regimeSyncState: string;

internalDivergenceScore: number;

internalDivergenceState: string;

squeezeRisk: number;

squeezeState: string;

crashScore: number;

crashProbability: number;

priceMomentumScore: number;

priceMomentumDirection: string;

priceMomentumTrend: string;

putTimingScore: number;

putTimingDecision: string;

putTimingTiming: string;

putTimingExecution: string;

tradeStackState: string;

nasdaqPutState: string;

nasdaqPutStrength: number;

positionSizingMode: string;

positionSizingSize: number;

daysInPhase: number;

distributionDays: number;

breadthWeakDays: number;

participationWeakDays: number;

rotationWeakDays: number;

liquidityWeakDays: number;

fragilityHighDays: number;

institutionalPressure: number;

marketCharacter: string;

prolongedBearRegime: boolean;

phasePersistence: number;

breadthTrend: number;

breadthAcceleration: number;

participationTrend: number;

participationDecay: number;

rotationTrend: number;

liquidityTrend: number;

fragilityTrend: number;

averageBreadth: number;

averageParticipation: number;

averageRotation: number;

averageLiquidity: number;

averageFragility: number;

nasdaq: ExtractedIndexPrice;

russell: ExtractedIndexPrice;

sp500: ExtractedIndexPrice;

dow: ExtractedIndexPrice;

}


function extractSnapshot(
snapshot: AIResearchInput["snapshot"]
): ExtractedSnapshot {

const master =
getNested(
snapshot,
"master"
);

const masterMeta =
getNested(
master,
"meta"
);

const crash =
getNested(
snapshot,
"crash"
);

const phase =
getNested(
snapshot,
"phase"
);

const rotation =
getNested(
snapshot,
"rotation"
);

const rotationDecay =
getNested(
snapshot,
"rotationDecay"
);

const rotationConfirm =
getNested(
snapshot,
"rotationConfirm"
);

const breadthVelocity =
getNested(
snapshot,
"breadthVelocity"
);

const breadthThrust =
getNested(
snapshot,
"breadthThrust"
);

const participation =
getNested(
snapshot,
"participation"
);

const liquidity =
getNested(
snapshot,
"liquidity"
);

const fragility =
getNested(
snapshot,
"fragility"
);

const marketQuality =
getNested(
snapshot,
"marketQuality"
);

const regimeSync =
getNested(
snapshot,
"regimeSync"
);

const internalDivergence =
getNested(
snapshot,
"internalDivergence"
);

const squeeze =
getNested(
snapshot,
"squeeze"
);

const priceMomentum =
getNested(
snapshot,
"priceMomentum"
);

const putTiming =
getNested(
snapshot,
"putTiming"
);

const tradeStack =
getNested(
snapshot,
"tradeStack"
);

const nasdaqPut =
getNested(
tradeStack,
"nasdaqPut"
);

const positionSizing =
getNested(
snapshot,
"positionSizing"
);

const historyMetrics =
getNested(
snapshot,
"historyMetrics"
);

const indices =
getNested(
snapshot,
"indices"
);


/*
* IMPORTANT SCORE SEMANTICS
*
* We deliberately read the ORIGINAL engine outputs
* from their respective snapshot blocks.
*
* Examples:
*
* participation.score = 0 can mean WEAK
* marketQuality.score = 0 can mean STRUCTURAL_BREAKDOWN
* breadthThrust.score = 9 can mean BREAKDOWN
* regimeSync.score = 16 can mean BREAKDOWN
*
* We do NOT substitute the risk-transformed values
* from master.components here.
*
* This avoids accidental double inversion.
*/

return {

timestamp:
stringValue(
snapshot.timestamp
),

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

masterMode:
stringValue(
master["mode"],
stringValue(
masterMeta["mode"],
"UNKNOWN"
)
),

masterRegime:
stringValue(
master["regime"],
stringValue(
masterMeta["regime"],
"UNKNOWN"
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

rotationSignal:
stringValue(
rotation["signal"],
"UNKNOWN"
),

rotationState:
stringValue(
rotation["state"],
"UNKNOWN"
),

rotationConfidence:
numberValue(
rotation["confidence"],
0
),

rsSmall:
optionalNumber(
rotation["rsSmall"]
),

rsGrowth:
optionalNumber(
rotation["rsGrowth"]
),

rsEqual:
optionalNumber(
rotation["rsEqual"]
),

rotationDecayScore:
numberValue(
rotationDecay["score"],
0
),

rotationDecayState:
stringValue(
rotationDecay["state"],
"UNKNOWN"
),

rotationConfirmState:
stringValue(
rotationConfirm["state"],
"UNKNOWN"
),

rotationConfirmConfidence:
numberValue(
rotationConfirm["confidence"],
0
),

falseBreakRisk:
numberValue(
rotationConfirm["falseBreakRisk"],
0
),

breadthVelocityScore:
numberValue(
breadthVelocity["score"],
50
),

breadthVelocityState:
stringValue(
breadthVelocity["state"],
"UNKNOWN"
),

breadthThrustScore:
numberValue(
breadthThrust["score"],
50
),

breadthThrustState:
stringValue(
breadthThrust["state"],
"UNKNOWN"
),

participationScore:
numberValue(
participation["score"],
50
),

participationState:
stringValue(
participation["state"],
"UNKNOWN"
),

liquidityScore:
numberValue(
liquidity["score"],
50
),

liquidityState:
stringValue(
liquidity["state"],
"UNKNOWN"
),

fragilityScore:
numberValue(
fragility["score"],
50
),

fragilityState:
stringValue(
fragility["state"],
"UNKNOWN"
),

marketQualityScore:
numberValue(
marketQuality["score"],
50
),

marketQualityState:
stringValue(
marketQuality["state"],
"UNKNOWN"
),

regimeSyncScore:
numberValue(
regimeSync["score"],
50
),

regimeSyncState:
stringValue(
regimeSync["state"],
"UNKNOWN"
),

internalDivergenceScore:
numberValue(
internalDivergence["score"],
0
),

internalDivergenceState:
stringValue(
internalDivergence["state"],
"UNKNOWN"
),

squeezeRisk:
numberValue(
squeeze["risk"],
0
),

squeezeState:
stringValue(
squeeze["state"],
"UNKNOWN"
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

priceMomentumDirection:
stringValue(
priceMomentum["direction"],
"UNKNOWN"
),

priceMomentumTrend:
stringValue(
priceMomentum["trend"],
"UNKNOWN"
),

putTimingScore:
numberValue(
putTiming["score"],
0
),

putTimingDecision:
stringValue(
putTiming["decision"],
"UNKNOWN"
),

putTimingTiming:
stringValue(
putTiming["timing"],
"UNKNOWN"
),

putTimingExecution:
stringValue(
putTiming["execution"],
"UNKNOWN"
),

tradeStackState:
stringValue(
tradeStack["state"],
"UNKNOWN"
),

nasdaqPutState:
stringValue(
nasdaqPut["state"],
"UNKNOWN"
),

nasdaqPutStrength:
numberValue(
nasdaqPut["strength"],
0
),

positionSizingMode:
stringValue(
positionSizing["mode"],
"UNKNOWN"
),

positionSizingSize:
numberValue(
positionSizing["size"],
0
),

daysInPhase:
numberValue(
historyMetrics["daysInPhase"],
0
),

distributionDays:
numberValue(
historyMetrics["distributionDays"],
0
),

breadthWeakDays:
numberValue(
historyMetrics["breadthWeakDays"],
0
),

participationWeakDays:
numberValue(
historyMetrics["participationWeakDays"],
0
),

rotationWeakDays:
numberValue(
historyMetrics["rotationWeakDays"],
0
),

liquidityWeakDays:
numberValue(
historyMetrics["liquidityWeakDays"],
0
),

fragilityHighDays:
numberValue(
historyMetrics["fragilityHighDays"],
0
),

institutionalPressure:
numberValue(
historyMetrics["institutionalPressure"],
0
),

marketCharacter:
stringValue(
historyMetrics["marketCharacter"],
"UNKNOWN"
),

prolongedBearRegime:
booleanValue(
historyMetrics["prolongedBearRegime"],
false
),

phasePersistence:
numberValue(
historyMetrics["phasePersistence"],
0
),

breadthTrend:
numberValue(
historyMetrics["breadthTrend"],
0
),

breadthAcceleration:
numberValue(
historyMetrics["breadthAcceleration"],
0
),

participationTrend:
numberValue(
historyMetrics["participationTrend"],
0
),

participationDecay:
numberValue(
historyMetrics["participationDecay"],
0
),

rotationTrend:
numberValue(
historyMetrics["rotationTrend"],
0
),

liquidityTrend:
numberValue(
historyMetrics["liquidityTrend"],
0
),

fragilityTrend:
numberValue(
historyMetrics["fragilityTrend"],
0
),

averageBreadth:
numberValue(
historyMetrics["averageBreadth"],
50
),

averageParticipation:
numberValue(
historyMetrics["averageParticipation"],
50
),

averageRotation:
numberValue(
historyMetrics["averageRotation"],
50
),

averageLiquidity:
numberValue(
historyMetrics["averageLiquidity"],
50
),

averageFragility:
numberValue(
historyMetrics["averageFragility"],
50
),

nasdaq:
extractIndexPrice(
indices,
"nasdaq"
),

russell:
extractIndexPrice(
indices,
"russell"
),

sp500:
extractIndexPrice(
indices,
"sp500"
),

dow:
extractIndexPrice(
indices,
"dow"
),

};

}


/* =====================================================
HISTORY ANALYSIS
===================================================== */

interface HistoryResearchSummary {

available: boolean;

snapshotCount: number;

uniqueTradingDays: number;

defensiveSnapshotCount: number;

defensiveShare: number;

highFragilitySnapshotCount: number;

weakParticipationSnapshotCount: number;

structuralBreakdownSnapshotCount: number;

priceStructureTensionCount: number;

consecutiveTensionSnapshots: number;

consecutiveTensionTradingDays: number;

latestMasterScoreChange: number | null;

masterScoreTrend: number | null;

}


function isWeakParticipation(
data: ExtractedSnapshot
): boolean {

return (
data.participationState === "WEAK" ||
data.participationState === "BREAKDOWN" ||
data.participationScore <= 35
);

}


function isPoorMarketQuality(
data: ExtractedSnapshot
): boolean {

return (
data.marketQualityState === "STRUCTURAL_BREAKDOWN" ||
data.marketQualityState === "WEAK" ||
data.marketQualityScore <= 35
);

}


function isStructuralBreakdown(
data: ExtractedSnapshot
): boolean {

return (
data.internalDivergenceScore >= 60 ||
data.internalDivergenceState === "INSTITUTIONAL_DISTRIBUTION" ||
data.rotationConfirmState === "INTERNAL_BREAKDOWN" ||
data.fragilityScore >= 70 ||
isWeakParticipation(data) ||
isPoorMarketQuality(data)
);

}


function isNasdaqPriceConstructive(
data: ExtractedSnapshot
): boolean {

const return20D =
data.nasdaq.return20D;

const return10D =
data.nasdaq.return10D;

const bullishTrend =
data.nasdaq.trend === "BULLISH" ||
data.nasdaq.trend === "STRONG_BULLISH";


return (
bullishTrend ||
(
return20D !== null &&
return20D > 0
) ||
(
return10D !== null &&
return10D > 0
)
);

}


function hasDefensivePriceStructureTension(
data: ExtractedSnapshot
): boolean {

const structuralRisk =
data.masterScore >= 65 &&
isStructuralBreakdown(data);

return (
structuralRisk &&
isNasdaqPriceConstructive(data)
);

}


function getTradingDayKey(
timestamp: string
): string | null {

if (!timestamp) {

return null;

}


const parsed =
new Date(timestamp);

if (
!Number.isFinite(
parsed.getTime()
)
) {

return null;

}


return parsed
.toISOString()
.slice(0, 10);

}


function buildHistoryResearchSummary(
history: AIResearchHistory
): HistoryResearchSummary {

const extracted =
history
.map(
(snapshot) =>
extractSnapshot(snapshot)
)
.filter(
(snapshot) =>
snapshot.timestamp.length > 0
);


if (
extracted.length === 0
) {

return {

available:
false,

snapshotCount:
0,

uniqueTradingDays:
0,

defensiveSnapshotCount:
0,

defensiveShare:
0,

highFragilitySnapshotCount:
0,

weakParticipationSnapshotCount:
0,

structuralBreakdownSnapshotCount:
0,

priceStructureTensionCount:
0,

consecutiveTensionSnapshots:
0,

consecutiveTensionTradingDays:
0,

latestMasterScoreChange:
null,

masterScoreTrend:
null,

};

}


const chronological =
[...extracted].sort(
(a, b) =>
new Date(a.timestamp).getTime() -
new Date(b.timestamp).getTime()
);


const defensiveSnapshotCount =
chronological.filter(
(snapshot) =>
snapshot.masterScore >= 65
).length;


const highFragilitySnapshotCount =
chronological.filter(
(snapshot) =>
snapshot.fragilityScore >= 70
).length;


const weakParticipationSnapshotCount =
chronological.filter(
(snapshot) =>
isWeakParticipation(snapshot)
).length;


const structuralBreakdownSnapshotCount =
chronological.filter(
(snapshot) =>
isStructuralBreakdown(snapshot)
).length;


const priceStructureTensionCount =
chronological.filter(
(snapshot) =>
hasDefensivePriceStructureTension(
snapshot
)
).length;


/*
* Count consecutive tension snapshots backwards
* from the latest historical observation.
*
* Multiple development snapshots can exist on the
* same trading day. Therefore we also separately
* count unique trading days.
*/

let consecutiveTensionSnapshots = 0;

const consecutiveTradingDays =
new Set<string>();


for (
let index =
chronological.length - 1;

index >= 0;

index--
) {

const snapshot =
chronological[index];


if (
!hasDefensivePriceStructureTension(
snapshot
)
) {

break;

}


consecutiveTensionSnapshots++;


const tradingDay =
getTradingDayKey(
snapshot.timestamp
);


if (tradingDay) {

consecutiveTradingDays.add(
tradingDay
);

}

}


const tradingDays =
new Set<string>();


for (
const snapshot of chronological
) {

const tradingDay =
getTradingDayKey(
snapshot.timestamp
);

if (tradingDay) {

tradingDays.add(
tradingDay
);

}

}


const latest =
chronological[
chronological.length - 1
];


const previous =
chronological.length >= 2
? chronological[
chronological.length - 2
]
: null;


const latestMasterScoreChange =
previous
? latest.masterScore -
previous.masterScore
: null;


/*
* Simple history-window trend:
*
* latest Master Score minus oldest Master Score.
*
* This is deliberately descriptive and is NOT a
* newly invented market-engine score.
*/

const oldest =
chronological[0];


const masterScoreTrend =
chronological.length >= 2
? latest.masterScore -
oldest.masterScore
: null;


return {

available:
true,

snapshotCount:
chronological.length,

uniqueTradingDays:
tradingDays.size,

defensiveSnapshotCount,

defensiveShare:
defensiveSnapshotCount /
chronological.length,

highFragilitySnapshotCount,

weakParticipationSnapshotCount,

structuralBreakdownSnapshotCount,

priceStructureTensionCount,

consecutiveTensionSnapshots,

consecutiveTensionTradingDays:
consecutiveTradingDays.size,

latestMasterScoreChange,

masterScoreTrend,

};

}


/* =====================================================
COT POSITIONING
===================================================== */

/*
* IMPORTANT:
*
* COT remains a separate positioning layer.
*
* In this development step we deliberately preserve
* the existing COT interpretation.
*
* Detailed market/group interpretation will be added
* in a separate bounded step after the history and
* price-vs-structure layer has been verified.
*/

interface COTResearchSummary {

available: boolean;

observationCount: number;

summaryCount: number;

divergenceCount: number;

extremeCount: number;

}


function extractCOTResearchSummary(
positioning: AIResearchInput["positioning"]
): COTResearchSummary {

if (!positioning) {

return {

available:
false,

observationCount:
0,

summaryCount:
0,

divergenceCount:
0,

extremeCount:
0,

};

}


const observations =
Array.isArray(
positioning.observations
)
? positioning.observations
: [];


const summaries =
Array.isArray(
positioning.summaries
)
? positioning.summaries
: [];


const divergences =
Array.isArray(
positioning.divergences
)
? positioning.divergences
: [];


let extremeCount = 0;


for (
const observation of observations
) {

const observationObject =
objectValue(
observation
);


if (
Boolean(
observationObject["isExtreme"]
)
) {

extremeCount++;

continue;

}


const positions =
Array.isArray(
observationObject["positions"]
)
? observationObject["positions"]
: [];


for (
const position of positions
) {

const positionObject =
objectValue(
position
);

const extreme =
objectValue(
positionObject["extreme"]
);


if (
Boolean(
positionObject["isExtreme"]
) ||
Boolean(
extreme["isExtreme"]
)
) {

extremeCount++;

break;

}

}

}


return {

available:
true,

observationCount:
observations.length,

summaryCount:
summaries.length,

divergenceCount:
divergences.length,

extremeCount,

};

}


/* =====================================================
RESEARCH REGIME ASSESSMENT
===================================================== */

/*
* IMPORTANT SEMANTIC RULE
*
* This is NOT the Rotation-App regime.
*
* It is an AI research interpretation of the current
* risk configuration.
*/

function buildRegimeAssessment(
data: ExtractedSnapshot
): AIRegimeAssessment {

const score =
clamp(
data.masterScore
);


let bias:
AIRegimeAssessment["bias"];


if (
score <= 35
) {

bias =
"CONSTRUCTIVE";

}

else if (
score <= 64
) {

bias =
"NEUTRAL";

}

else {

/*
* Elevated risk remains DEFENSIVE here.
*
* CRISIS is intentionally not generated from
* Master Score alone.
*/

bias =
"DEFENSIVE";

}


/*
* Rotation confidence can legitimately be zero
* while rotationConfirm carries strong confidence.
*
* Prefer the stronger explicit confirmation value
* when available.
*/

const rotationResearchConfidence =
Math.max(
data.rotationConfidence,
data.rotationConfirmConfidence
);


const confidence =
clamp(
(
data.phaseConfidence +
rotationResearchConfidence
) / 2
);


return {

bias,

confidence:
Math.round(
confidence
),

summary:
[
`Research risk posture ${bias}.`,
`Master Score ${Math.round(score)}.`,
`Official phase ${data.phase}.`,
`Official Master Mode ${data.masterMode}.`,
`Official Master Regime ${data.masterRegime}.`,
].join(" "),

};

}


/* =====================================================
STRUCTURAL BIAS
===================================================== */

function determineStructuralBias(
data: ExtractedSnapshot
): AIResearchStructuralBias {

if (
data.masterScore >= 65
) {

return "BEARISH";

}


if (
data.masterScore <= 35
) {

return "BULLISH";

}


const bearishInternals =
data.fragilityScore >= 70 ||
isWeakParticipation(data) ||
isPoorMarketQuality(data) ||
data.internalDivergenceScore >= 60 ||
data.rotationConfirmState ===
"INTERNAL_BREAKDOWN";


const constructivePrice =
isNasdaqPriceConstructive(data);


if (
bearishInternals &&
constructivePrice
) {

return "MIXED";

}


return "NEUTRAL";

}


/* =====================================================
EVIDENCE HELPERS
===================================================== */

function evidenceStrengthFromCount(
count: number
): AIResearchEvidenceStrength {

if (
count >= 4
) {

return "VERY_HIGH";

}


if (
count === 3
) {

return "HIGH";

}


if (
count === 2
) {

return "MODERATE";

}


return "LOW";

}


function buildStructureEvidence(
data: ExtractedSnapshot,
structuralBias: AIResearchStructuralBias
): AIResearchEvidenceBlock {

const evidence:
string[] = [];


let bearishEvidenceCount = 0;


if (
data.masterScore >= 65
) {

bearishEvidenceCount++;

evidence.push(
`Master Score ${Math.round(
data.masterScore
)} is in the defensive risk zone.`
);

}


if (
data.fragilityScore >= 70
) {

bearishEvidenceCount++;

evidence.push(
`Fragility ${Math.round(
data.fragilityScore
)} (${data.fragilityState}).`
);

}


if (
data.internalDivergenceScore >= 60
) {

bearishEvidenceCount++;

evidence.push(
`Internal divergence ${Math.round(
data.internalDivergenceScore
)} (${data.internalDivergenceState}).`
);

}


if (
isWeakParticipation(data)
) {

bearishEvidenceCount++;

evidence.push(
`Participation is ${data.participationState} with score ${Math.round(
data.participationScore
)}.`
);

}


if (
isPoorMarketQuality(data)
) {

bearishEvidenceCount++;

evidence.push(
`Market quality is ${data.marketQualityState} with score ${Math.round(
data.marketQualityScore
)}.`
);

}


if (
data.rotationConfirmState ===
"INTERNAL_BREAKDOWN"
) {

bearishEvidenceCount++;

evidence.push(
`Rotation confirmation reports INTERNAL_BREAKDOWN with confidence ${Math.round(
data.rotationConfirmConfidence
)}.`
);

}


let state:
AIResearchEvidenceState =
"NEUTRAL";


if (
structuralBias === "BEARISH"
) {

state =
bearishEvidenceCount >= 2
? "SUPPORTS"
: "UNRESOLVED";

}

else if (
structuralBias === "BULLISH"
) {

state =
bearishEvidenceCount >= 2
? "CONTRADICTS"
: "SUPPORTS";

}


return {

category:
"STRUCTURE",

state,

strength:
evidenceStrengthFromCount(
bearishEvidenceCount
),

confidence:
clamp(
50 +
bearishEvidenceCount * 8
),

summary:
bearishEvidenceCount > 0
? `${bearishEvidenceCount} defensive structural condition(s) are present.`
: "No predefined defensive structural condition dominates the current snapshot.",

evidence:
uniqueStrings(
evidence
),

};

}


function buildHistoryEvidence(
data: ExtractedSnapshot,
history: HistoryResearchSummary,
structuralBias: AIResearchStructuralBias
): AIResearchEvidenceBlock {

if (
!history.available
) {

return {

category:
"HISTORY",

state:
"NOT_AVAILABLE",

strength:
"LOW",

confidence:
0,

summary:
"No usable trusted research-history snapshots are available for persistence analysis.",

evidence:
[],

};

}


const evidence:
string[] = [];


/*
* ===================================================
* TRUSTED RESEARCH HISTORY
* ===================================================
*
* IMPORTANT:
*
* input.history has already been sanitized by
* aiResearchContext.ts.
*
* Only snapshots from the trusted AI Research
* history window are allowed to determine:
*
* - persistence
* - HISTORY evidence state
* - HISTORY evidence strength
* - HISTORY confidence
*
* Long-running historyMetrics embedded in the
* current snapshot may include legacy observations
* from before the trusted research-history boundary.
*
* They remain useful engine context, but they must
* NOT increase AI Research history confirmation.
* ===================================================
*/


const defensivePersistence =
history.defensiveShare >= 0.6;


const structuralPersistence =
history.structuralBreakdownSnapshotCount /
Math.max(
history.snapshotCount,
1
) >= 0.6;


const highFragilityPersistence =
history.highFragilitySnapshotCount /
Math.max(
history.snapshotCount,
1
) >= 0.6;


const weakParticipationPersistence =
history.weakParticipationSnapshotCount /
Math.max(
history.snapshotCount,
1
) >= 0.6;


/*
* Trusted research-history evidence.
*/

if (
defensivePersistence
) {

evidence.push(
`${history.defensiveSnapshotCount} of ${history.snapshotCount} trusted research snapshots were in the defensive Master Score zone.`
);

}


if (
structuralPersistence
) {

evidence.push(
`${history.structuralBreakdownSnapshotCount} of ${history.snapshotCount} trusted research snapshots contained structural deterioration.`
);

}


if (
highFragilityPersistence
) {

evidence.push(
`${history.highFragilitySnapshotCount} of ${history.snapshotCount} trusted research snapshots showed elevated structural fragility.`
);

}


if (
weakParticipationPersistence
) {

evidence.push(
`${history.weakParticipationSnapshotCount} of ${history.snapshotCount} trusted research snapshots showed weak participation.`
);

}


evidence.push(
`Trusted research history currently spans ${history.uniqueTradingDays} trading day(s).`
);


if (
history.masterScoreTrend !== null
) {

evidence.push(
`Master Score changed ${history.masterScoreTrend >= 0 ? "+" : ""}${history.masterScoreTrend.toFixed(
1
)} points across the trusted research-history window.`
);

}


/*
* ===================================================
* LEGACY-DERIVED ENGINE CONTEXT
* ===================================================
*
* These values come from historyMetrics embedded in
* the current Rotation-App snapshot.
*
* They may span observations from before the trusted
* AI Research history boundary.
*
* Therefore they are shown only as contextual
* information and do NOT influence:
*
* - state
* - strength
* - confidence
* ===================================================
*/

if (
data.daysInPhase > 0
) {

evidence.push(
`Rotation-App engine history reports current phase age ${Math.round(
data.daysInPhase
)} day(s); this metric may include legacy observations outside the trusted AI Research window.`
);

}


if (
data.distributionDays > 0
) {

evidence.push(
`Rotation-App engine history reports ${Math.round(
data.distributionDays
)} distribution day(s); this metric may include legacy observations outside the trusted AI Research window.`
);

}


if (
data.fragilityHighDays > 0
) {

evidence.push(
`Rotation-App engine history reports elevated fragility across ${Math.round(
data.fragilityHighDays
)} tracked day(s); this metric may include legacy observations outside the trusted AI Research window.`
);

}


if (
data.institutionalPressure >= 70
) {

evidence.push(
`Rotation-App engine history reports institutional pressure at ${Math.round(
data.institutionalPressure
)}; this is contextual engine history and does not increase trusted AI Research persistence strength.`
);

}


/*
* ===================================================
* EVIDENCE STATE
* ===================================================
*
* Only trusted research-history observations are
* allowed to determine the state.
*/

const trustedPersistence =
defensivePersistence ||
structuralPersistence ||
highFragilityPersistence ||
weakParticipationPersistence;


let state:
AIResearchEvidenceState =
"NEUTRAL";


if (
structuralBias === "BEARISH"
) {

if (
trustedPersistence
) {

state =
"SUPPORTS";

}

}

else if (
structuralBias === "BULLISH"
) {

if (
trustedPersistence
) {

state =
"CONTRADICTS";

}

}


/*
* ===================================================
* EVIDENCE STRENGTH
* ===================================================
*
* Again: only trusted research-history persistence
* contributes.
*/

let persistenceCount = 0;


if (
defensivePersistence
) {

persistenceCount++;

}


if (
structuralPersistence
) {

persistenceCount++;

}


if (
highFragilityPersistence
) {

persistenceCount++;

}


if (
weakParticipationPersistence
) {

persistenceCount++;

}


/*
* A very short trusted history window should not be
* labelled VERY_HIGH merely because several related
* structural conditions agree.
*
* The number of unique trading days therefore caps
* the maximum historical evidence strength.
*/

let strength =
evidenceStrengthFromCount(
persistenceCount
);


if (
history.uniqueTradingDays < 5
) {

strength =
"LOW";

}

else if (
history.uniqueTradingDays < 10 &&
(
strength === "HIGH" ||
strength === "VERY_HIGH"
)
) {

strength =
"MODERATE";

}

else if (
history.uniqueTradingDays < 15 &&
strength === "VERY_HIGH"
) {

strength =
"HIGH";

}


/*
* Confidence grows with both agreement and actual
* trusted trading-day coverage.
*
* It is deliberately capped while the trusted
* history window is still relatively young.
*/

const coverageConfidence =
clamp(
history.uniqueTradingDays * 4,
0,
60
);


const persistenceConfidence =
persistenceCount * 8;


const confidence =
clamp(
25 +
coverageConfidence +
persistenceConfidence
);


return {

category:
"HISTORY",

state,

strength,

confidence:
Math.round(
confidence
),

summary:
state === "SUPPORTS"
? `Trusted research history supports the current structural thesis across ${history.uniqueTradingDays} trading day(s).`
: state === "CONTRADICTS"
? `Trusted research history contradicts the current structural thesis across ${history.uniqueTradingDays} trading day(s).`
: `Trusted research history does not yet strongly confirm the current structural thesis across ${history.uniqueTradingDays} trading day(s).`,

evidence:
uniqueStrings(
evidence
),

};

}



function buildPriceEvidence(
data: ExtractedSnapshot,
structuralBias: AIResearchStructuralBias
): AIResearchEvidenceBlock {

const evidence:
string[] = [];


if (
data.nasdaq.return10D !== null
) {

evidence.push(
`NASDAQ 10D return ${data.nasdaq.return10D.toFixed(
2
)}%.`
);

}


if (
data.nasdaq.return20D !== null
) {

evidence.push(
`NASDAQ 20D return ${data.nasdaq.return20D.toFixed(
2
)}%.`
);

}


if (
data.nasdaq.return50D !== null
) {

evidence.push(
`NASDAQ 50D return ${data.nasdaq.return50D.toFixed(
2
)}%.`
);

}


if (
data.nasdaq.distanceFromMA200 !== null
) {

evidence.push(
`NASDAQ is ${data.nasdaq.distanceFromMA200.toFixed(
2
)}% from MA200.`
);

}


if (
data.nasdaq.acceleration !== null
) {

evidence.push(
`NASDAQ price acceleration is ${data.nasdaq.acceleration.toFixed(
2
)}.`
);

}


evidence.push(
`NASDAQ price trend is ${data.nasdaq.trend}.`
);


const constructive =
isNasdaqPriceConstructive(data);


const clearlyWeak =
(
data.nasdaq.return20D !== null &&
data.nasdaq.return20D < -2
) ||
data.nasdaq.trend === "BEARISH" ||
data.nasdaq.trend === "STRONG_BEARISH";


let state:
AIResearchEvidenceState =
"NEUTRAL";


if (
structuralBias === "BEARISH"
) {

if (
clearlyWeak
) {

state =
"SUPPORTS";

}

else if (
constructive
) {

state =
"CONTRADICTS";

}

else {

state =
"UNRESOLVED";

}

}

else if (
structuralBias === "BULLISH"
) {

if (
constructive
) {

state =
"SUPPORTS";

}

else if (
clearlyWeak
) {

state =
"CONTRADICTS";

}

else {

state =
"UNRESOLVED";

}

}


let strength:
AIResearchEvidenceStrength =
"MODERATE";


if (
data.nasdaq.return20D !== null &&
Math.abs(
data.nasdaq.return20D
) >= 5
) {

strength =
"HIGH";

}


if (
data.nasdaq.distanceFromMA200 !== null &&
Math.abs(
data.nasdaq.distanceFromMA200
) >= 10
) {

strength =
"VERY_HIGH";

}


return {

category:
"PRICE",

state,

strength,

confidence:
evidence.length >= 4
? 90
: 75,

summary:
state === "CONTRADICTS"
? "NASDAQ price behavior currently contradicts the structural thesis."
: state === "SUPPORTS"
? "NASDAQ price behavior confirms the structural thesis."
: "NASDAQ price behavior does not yet provide decisive confirmation.",

evidence:
uniqueStrings(
evidence
),

};

}


function buildRotationEvidence(
data: ExtractedSnapshot,
structuralBias: AIResearchStructuralBias
): AIResearchEvidenceBlock {

const evidence:
string[] = [];


evidence.push(
`Rotation signal is ${data.rotationSignal} (${data.rotationState}).`
);


evidence.push(
`Rotation confirmation is ${data.rotationConfirmState} with confidence ${Math.round(
data.rotationConfirmConfidence
)}.`
);


evidence.push(
`Rotation decay is ${Math.round(
data.rotationDecayScore
)} (${data.rotationDecayState}).`
);


if (
data.rsGrowth !== null
) {

evidence.push(
`Growth relative strength is ${data.rsGrowth.toFixed(
3
)}.`
);

}


if (
data.rsSmall !== null
) {

evidence.push(
`Small-cap relative strength is ${data.rsSmall.toFixed(
3
)}.`
);

}


const relative20D =
data.nasdaq.return20D !== null &&
data.russell.return20D !== null
? data.nasdaq.return20D -
data.russell.return20D
: null;


const relative50D =
data.nasdaq.return50D !== null &&
data.russell.return50D !== null
? data.nasdaq.return50D -
data.russell.return50D
: null;


if (
relative20D !== null
) {

evidence.push(
`NASDAQ outperformance versus Russell over 20D is ${relative20D >= 0 ? "+" : ""}${relative20D.toFixed(
2
)} percentage points.`
);

}


if (
relative50D !== null
) {

evidence.push(
`NASDAQ outperformance versus Russell over 50D is ${relative50D >= 0 ? "+" : ""}${relative50D.toFixed(
2
)} percentage points.`
);

}


const defensiveRotation =
data.rotationSignal ===
"RISK_OFF_ROTATION" ||
data.rotationConfirmState ===
"INTERNAL_BREAKDOWN";


let state:
AIResearchEvidenceState =
"NEUTRAL";


if (
structuralBias === "BEARISH"
) {

state =
defensiveRotation
? "SUPPORTS"
: "UNRESOLVED";

}

else if (
structuralBias === "BULLISH"
) {

state =
defensiveRotation
? "CONTRADICTS"
: "UNRESOLVED";

}


const strength =
data.rotationConfirmConfidence >= 80
? "HIGH"
: data.rotationConfirmConfidence >= 60
? "MODERATE"
: "LOW";


return {

category:
"ROTATION",

state,

strength,

confidence:
clamp(
Math.max(
data.rotationConfidence,
data.rotationConfirmConfidence
)
),

summary:
defensiveRotation
? "Rotation evidence indicates defensive internal behavior."
: "Rotation evidence does not currently provide strong directional confirmation.",

evidence:
uniqueStrings(
evidence
),

};

}


function buildLiquidityEvidence(
data: ExtractedSnapshot,
structuralBias: AIResearchStructuralBias
): AIResearchEvidenceBlock {

const evidence = [

`Liquidity score ${Math.round(
data.liquidityScore
)} (${data.liquidityState}).`,

`Liquidity trend ${data.liquidityTrend >= 0 ? "+" : ""}${data.liquidityTrend.toFixed(
1
)}.`,

`Average historical liquidity ${data.averageLiquidity.toFixed(
1
)}.`,

];


const weakLiquidity =
data.liquidityScore < 40 ||
data.liquidityState === "WEAK" ||
data.liquidityState === "CRITICAL";


const supportiveLiquidity =
data.liquidityScore >= 65 ||
data.liquidityState === "STRONG" ||
data.liquidityState === "SUPPORTIVE";


let state:
AIResearchEvidenceState =
"NEUTRAL";


if (
structuralBias === "BEARISH"
) {

if (
weakLiquidity
) {

state =
"SUPPORTS";

}

else if (
supportiveLiquidity
) {

state =
"CONTRADICTS";

}

}

else if (
structuralBias === "BULLISH"
) {

if (
supportiveLiquidity
) {

state =
"SUPPORTS";

}

else if (
weakLiquidity
) {

state =
"CONTRADICTS";

}

}


return {

category:
"LIQUIDITY",

state,

strength:
weakLiquidity ||
supportiveLiquidity
? "MODERATE"
: "LOW",

confidence:
75,

summary:
state === "SUPPORTS"
? "Liquidity conditions support the structural thesis."
: state === "CONTRADICTS"
? "Liquidity conditions contradict the structural thesis."
: "Liquidity remains neutral and does not yet confirm the structural thesis.",

evidence:
uniqueStrings(
evidence
),

};

}


/* =====================================================
TENSION ASSESSMENT
===================================================== */

function determineTensionState(
currentTension: boolean,
history: HistoryResearchSummary
): AIResearchTensionState {

if (
!currentTension
) {

return "NONE";

}


const age =
history.consecutiveTensionTradingDays;


if (
age >= 15
) {

return "EXTREME";

}


if (
age >= 8
) {

return "PERSISTENT";

}


if (
age >= 3
) {

return "ESTABLISHED";

}


return "BUILDING";

}


function buildTensionAssessment(
data: ExtractedSnapshot,
history: HistoryResearchSummary
): AIResearchTensionAssessment {

const currentTension =
hasDefensivePriceStructureTension(
data
);


const state =
determineTensionState(
currentTension,
history
);


if (
!currentTension
) {

return {

state:
"NONE",

ageSnapshots:
0,

ageTradingDays:
0,

confidence:
80,

summary:
"No predefined defensive price-vs-structure tension is currently detected.",

};

}


const evidenceCount =
[
data.masterScore >= 65,
data.fragilityScore >= 70,
data.internalDivergenceScore >= 60,
isWeakParticipation(data),
isPoorMarketQuality(data),
isNasdaqPriceConstructive(data),
]
.filter(Boolean)
.length;


return {

state,

ageSnapshots:
Math.max(
1,
history.consecutiveTensionSnapshots
),

ageTradingDays:
Math.max(
1,
history.consecutiveTensionTradingDays
),

confidence:
clamp(
50 +
evidenceCount * 7
),

summary:
[
"Defensive structural evidence conflicts with constructive NASDAQ price behavior.",
`Tension state ${state}.`,
history.available
? `Observed across ${Math.max(
1,
history.consecutiveTensionTradingDays
)} consecutive trading day(s) in available research history.`
: "Historical duration cannot yet be established reliably.",
].join(" "),

};

}


/* =====================================================
CONFIRMATION / CONTRADICTION
===================================================== */

function evidenceWeight(
strength: AIResearchEvidenceStrength
): number {

switch (strength) {

case "VERY_HIGH":
return 4;

case "HIGH":
return 3;

case "MODERATE":
return 2;

case "LOW":
default:
return 1;

}

}


function determineConfirmation(
evidence: AIResearchEvidenceBlock[]
):
| "NONE"
| "WEAK"
| "PARTIAL"
| "STRONG"
| "VERY_STRONG" {

const independentEvidence =
evidence.filter(
(item) =>
item.category !== "STRUCTURE" &&
item.state !== "NOT_AVAILABLE"
);


const supportWeight =
independentEvidence
.filter(
(item) =>
item.state === "SUPPORTS"
)
.reduce(
(total, item) =>
total +
evidenceWeight(
item.strength
),
0
);


if (
supportWeight >= 8
) {

return "VERY_STRONG";

}


if (
supportWeight >= 5
) {

return "STRONG";

}


if (
supportWeight >= 3
) {

return "PARTIAL";

}


if (
supportWeight >= 1
) {

return "WEAK";

}


return "NONE";

}


function determineContradiction(
evidence: AIResearchEvidenceBlock[]
): AIResearchContradictionLevel {

const contradictionWeight =
evidence
.filter(
(item) =>
item.state === "CONTRADICTS"
)
.reduce(
(total, item) =>
total +
evidenceWeight(
item.strength
),
0
);


if (
contradictionWeight >= 8
) {

return "VERY_HIGH";

}


if (
contradictionWeight >= 5
) {

return "HIGH";

}


if (
contradictionWeight >= 3
) {

return "MODERATE";

}


if (
contradictionWeight >= 1
) {

return "LOW";

}


return "NONE";

}


/* =====================================================
ENTRY MATURITY / OPPORTUNITY STATE
===================================================== */

function determineEntryMaturity(
structuralBias: AIResearchStructuralBias,
confirmation:
| "NONE"
| "WEAK"
| "PARTIAL"
| "STRONG"
| "VERY_STRONG",
contradiction: AIResearchContradictionLevel,
tension: AIResearchTensionAssessment,
data: ExtractedSnapshot
): AIResearchEntryMaturity {

if (
structuralBias === "NEUTRAL" ||
structuralBias === "MIXED"
) {

return "IMMATURE";

}


/*
* A strongly developed price move in the same
* direction as the thesis can make a new entry late.
*
* For the current defensive use case we only mark
* exhaustion after material downside has already
* occurred.
*/

if (
structuralBias === "BEARISH" &&
data.nasdaq.return20D !== null &&
data.nasdaq.return20D <= -8
) {

return "EXHAUSTED";

}


if (
structuralBias === "BULLISH" &&
data.nasdaq.return20D !== null &&
data.nasdaq.return20D >= 10
) {

return "EXHAUSTED";

}


if (
confirmation === "VERY_STRONG" &&
contradiction === "NONE"
) {

return "MATURE";

}


if (
(
confirmation === "STRONG" ||
confirmation === "VERY_STRONG"
) &&
(
contradiction === "NONE" ||
contradiction === "LOW"
)
) {

return "CONFIRMING";

}


/*
* EARLY explicitly allows structural evidence to be
* strong while price confirmation is still missing.
*
* High contradiction keeps the setup early rather
* than falsely calling it confirmed.
*/

if (
tension.state === "ESTABLISHED" ||
tension.state === "PERSISTENT" ||
tension.state === "EXTREME"
) {

return "EARLY";

}


if (
confirmation === "PARTIAL" ||
confirmation === "STRONG"
) {

return "EARLY";

}


return "DEVELOPING";

}


function determineOpportunityState(
structuralBias: AIResearchStructuralBias,
confirmation:
| "NONE"
| "WEAK"
| "PARTIAL"
| "STRONG"
| "VERY_STRONG",
contradiction: AIResearchContradictionLevel,
entryMaturity: AIResearchEntryMaturity,
tension: AIResearchTensionAssessment
): AIResearchOpportunityState {

if (
structuralBias === "NEUTRAL" ||
structuralBias === "MIXED"
) {

return "WAIT";

}


if (
entryMaturity === "EXHAUSTED"
) {

return "REDUCE";

}


if (
contradiction === "VERY_HIGH"
) {

return "WATCH";

}


/*
* Strong price-vs-structure tension is intentionally
* ARMED rather than automatically EARLY_STARTER.
*
* This is the central protection against converting
* "structurally bearish" directly into "buy PUT".
*/

if (
(
tension.state === "ESTABLISHED" ||
tension.state === "PERSISTENT" ||
tension.state === "EXTREME"
) &&
(
contradiction === "HIGH" ||
contradiction === "MODERATE"
)
) {

return "ARMED";

}


if (
entryMaturity === "MATURE" &&
(
confirmation === "STRONG" ||
confirmation === "VERY_STRONG"
)
) {

return "SCALE_IN";

}


if (
entryMaturity === "CONFIRMING"
) {

return "CONFIRM";

}


if (
entryMaturity === "EARLY" &&
(
confirmation === "PARTIAL" ||
confirmation === "STRONG"
) &&
(
contradiction === "NONE" ||
contradiction === "LOW"
)
) {

return "EARLY_STARTER";

}


if (
entryMaturity === "DEVELOPING" ||
entryMaturity === "EARLY"
) {

return "WATCH";

}


return "WAIT";

}


/* =====================================================
EVIDENCE ASSESSMENT
===================================================== */

function buildEvidenceAssessment(
data: ExtractedSnapshot,
history: HistoryResearchSummary,
cot: COTResearchSummary,
sourceCount: number
): AIResearchEvidenceAssessment {

const structuralBias =
determineStructuralBias(
data
);


const structureEvidence =
buildStructureEvidence(
data,
structuralBias
);


const historyEvidence =
buildHistoryEvidence(
data,
history,
structuralBias
);


const priceEvidence =
buildPriceEvidence(
data,
structuralBias
);


const rotationEvidence =
buildRotationEvidence(
data,
structuralBias
);


const liquidityEvidence =
buildLiquidityEvidence(
data,
structuralBias
);


/*
* COT and external research are deliberately exposed
* in the evidence model but NOT interpreted yet.
*
* This makes the current limitation explicit instead
* of silently pretending that these data have already
* influenced the opportunity assessment.
*/

const positioningEvidence:
AIResearchEvidenceBlock = {

category:
"POSITIONING",

state:
cot.available
? "UNRESOLVED"
: "NOT_AVAILABLE",

strength:
"LOW",

confidence:
cot.available
? 25
: 0,

summary:
cot.available
? "COT positioning data are available but detailed market/group interpretation is not yet part of this evidence-synthesis step."
: "COT positioning data are not available.",

evidence:
cot.available
? [
`${cot.observationCount} COT observation(s) available.`,
`${cot.summaryCount} market/group positioning summary(ies) available.`,
`${cot.divergenceCount} trader-group divergence(s) detected.`,
`${cot.extremeCount} historical extreme(s) detected.`,
]
: [],

};


const externalEvidence:
AIResearchEvidenceBlock = {

category:
"EXTERNAL",

state:
sourceCount > 0
? "UNRESOLVED"
: "NOT_AVAILABLE",

strength:
"LOW",

confidence:
sourceCount > 0
? 20
: 0,

summary:
sourceCount > 0
? "External research sources are available but are not yet directionally synthesized in this development step."
: "No external research sources are available.",

evidence:
sourceCount > 0
? [
`${sourceCount} ranked external research source(s) available.`,
]
: [],

};


const evidence:
AIResearchEvidenceBlock[] = [

structureEvidence,

historyEvidence,

priceEvidence,

rotationEvidence,

liquidityEvidence,

positioningEvidence,

externalEvidence,

];


const confirmation =
determineConfirmation(
evidence
);


const contradiction =
determineContradiction(
evidence
);


const tension =
buildTensionAssessment(
data,
history
);


const entryMaturity =
determineEntryMaturity(
structuralBias,
confirmation,
contradiction,
tension,
data
);


const opportunityState =
determineOpportunityState(
structuralBias,
confirmation,
contradiction,
entryMaturity,
tension
);


return {

structuralBias,

confirmation,

contradiction,

entryMaturity,

opportunityState,

tension,

evidence,

summary:
[
`Structural bias ${structuralBias}.`,
`Independent confirmation ${confirmation}.`,
`Contradiction ${contradiction}.`,
`Entry maturity ${entryMaturity}.`,
`Research opportunity state ${opportunityState}.`,
`Price-vs-structure tension ${tension.state}.`,
].join(" "),

};

}


/* =====================================================
DIVERGENCES
===================================================== */

function buildDivergences(
data: ExtractedSnapshot,
history: HistoryResearchSummary
): AIDivergence[] {

const divergences:
AIDivergence[] = [];


/* -----------------------------------------------------
PRICE VS INTERNALS
----------------------------------------------------- */

if (
hasDefensivePriceStructureTension(
data
)
) {

divergences.push({

type:
"PRICE_VS_INTERNALS",

observation:
[
`Master Score is ${Math.round(
data.masterScore
)}`,
`while NASDAQ price trend is ${data.nasdaq.trend}`,
data.nasdaq.return20D !== null
? `with a 20D return of ${data.nasdaq.return20D.toFixed(
2
)}%`
: "",
]
.filter(Boolean)
.join(" ") +
".",

significance:
[
"Defensive internal structure is not yet fully confirmed by NASDAQ price behavior.",
history.consecutiveTensionTradingDays > 0
? `The conflict has persisted for ${history.consecutiveTensionTradingDays} trading day(s) in available research history.`
: "",
]
.filter(Boolean)
.join(" "),

confidence:
90,

});

}


/* -----------------------------------------------------
NASDAQ VS RUSSELL
----------------------------------------------------- */

const relative20D =
data.nasdaq.return20D !== null &&
data.russell.return20D !== null
? data.nasdaq.return20D -
data.russell.return20D
: null;


const relative50D =
data.nasdaq.return50D !== null &&
data.russell.return50D !== null
? data.nasdaq.return50D -
data.russell.return50D
: null;


if (
relative20D !== null &&
Math.abs(
relative20D
) >= 3
) {

divergences.push({

type:
"NASDAQ_VS_RUSSELL",

observation:
`NASDAQ versus Russell 20D performance spread is ${relative20D >= 0 ? "+" : ""}${relative20D.toFixed(
2
)} percentage points.`,

significance:
[
"The leadership gap is based on normalized multi-day returns rather than absolute index levels.",
relative50D !== null
? `The 50D spread is ${relative50D >= 0 ? "+" : ""}${relative50D.toFixed(
2
)} percentage points.`
: "",
]
.filter(Boolean)
.join(" "),

confidence:
85,

});

}


/* -----------------------------------------------------
ROTATION VS PRICE
----------------------------------------------------- */

if (
data.rotationConfirmState ===
"INTERNAL_BREAKDOWN" &&
isNasdaqPriceConstructive(data)
) {

divergences.push({

type:
"ROTATION_VS_PRICE",

observation:
`Rotation confirmation reports INTERNAL_BREAKDOWN while NASDAQ price remains ${data.nasdaq.trend}.`,

significance:
"Internal rotation deterioration is occurring before clear NASDAQ price confirmation.",

confidence:
clamp(
data.rotationConfirmConfidence
),

});

}


/* -----------------------------------------------------
PRICE VS FRAGILITY
----------------------------------------------------- */

if (
data.fragilityScore >= 70 &&
isNasdaqPriceConstructive(data)
) {

divergences.push({

type:
"PRICE_VS_FRAGILITY",

observation:
`Structural fragility is ${Math.round(
data.fragilityScore
)} (${data.fragilityState}) while NASDAQ price remains ${data.nasdaq.trend}.`,

significance:
"Elevated structural fragility is not yet reflected in a comparable degree of price weakness.",

confidence:
85,

});

}


/* -----------------------------------------------------
PRICE VS LIQUIDITY
----------------------------------------------------- */

if (
data.liquidityScore < 35 &&
isNasdaqPriceConstructive(data)
) {

divergences.push({

type:
"PRICE_VS_LIQUIDITY",

observation:
"Liquidity conditions are weak while NASDAQ price remains constructive.",

significance:
"Liquidity deterioration can weaken the durability of apparently strong index-level price action.",

confidence:
70,

});

}


/* -----------------------------------------------------
REGIME VS PRICE
----------------------------------------------------- */

if (
data.regimeSyncScore < 35 &&
isNasdaqPriceConstructive(data)
) {

divergences.push({

type:
"REGIME_VS_PRICE",

observation:
`Regime synchronization is ${Math.round(
data.regimeSyncScore
)} (${data.regimeSyncState}) while NASDAQ price remains ${data.nasdaq.trend}.`,

significance:
"The market regime is internally unsynchronized despite resilient index-level price behavior.",

confidence:
80,

});

}


return divergences;

}


/* =====================================================
THESIS
===================================================== */

function buildThesis(
data: ExtractedSnapshot,
divergences: AIDivergence[],
cot: COTResearchSummary,
evidenceAssessment: AIResearchEvidenceAssessment
): AIResearchThesis {

const supportingEvidence:
string[] = [];

const counterEvidence:
string[] = [];

const invalidationConditions:
string[] = [];


/* -----------------------------------------------------
STRUCTURAL EVIDENCE
----------------------------------------------------- */

if (
data.masterScore >= 65
) {

supportingEvidence.push(
`Official Master Score is elevated at ${Math.round(
data.masterScore
)}.`
);

}

else {

counterEvidence.push(
`Official Master Score is below the defensive threshold at ${Math.round(
data.masterScore
)}.`
);

}


supportingEvidence.push(
`Official engine phase is ${data.phase}.`
);


if (
data.masterMode !== "UNKNOWN"
) {

supportingEvidence.push(
`Official Master Mode is ${data.masterMode}.`
);

}


if (
data.masterRegime !== "UNKNOWN"
) {

supportingEvidence.push(
`Official Master Regime is ${data.masterRegime}.`
);

}


if (
data.fragilityScore >= 70
) {

supportingEvidence.push(
`Structural fragility is elevated at ${Math.round(
data.fragilityScore
)} (${data.fragilityState}).`
);

}

else {

counterEvidence.push(
`Structural fragility is not in the highest-risk zone (${Math.round(
data.fragilityScore
)}).`
);

}


if (
data.internalDivergenceScore >= 60
) {

supportingEvidence.push(
`Internal divergence is elevated at ${Math.round(
data.internalDivergenceScore
)} (${data.internalDivergenceState}).`
);

}


if (
data.rotationConfirmState ===
"INTERNAL_BREAKDOWN"
) {

supportingEvidence.push(
`Rotation confirmation reports INTERNAL_BREAKDOWN with confidence ${Math.round(
data.rotationConfirmConfidence
)}.`
);

}


if (
data.rotationDecayScore >= 60
) {

supportingEvidence.push(
`Rotation decay is elevated at ${Math.round(
data.rotationDecayScore
)}.`
);

}


if (
data.liquidityScore < 40
) {

supportingEvidence.push(
`Liquidity score is weak at ${Math.round(
data.liquidityScore
)}.`
);

}

else if (
data.liquidityScore >= 40 &&
data.liquidityScore <= 60
) {

counterEvidence.push(
`Liquidity remains neutral at ${Math.round(
data.liquidityScore
)} and does not yet confirm a breakdown.`
);

}


/* -----------------------------------------------------
PRICE COUNTER-EVIDENCE
----------------------------------------------------- */

if (
evidenceAssessment.structuralBias ===
"BEARISH" &&
isNasdaqPriceConstructive(data)
) {

if (
data.nasdaq.return20D !== null
) {

counterEvidence.push(
`NASDAQ price remains constructive with a 20D return of ${data.nasdaq.return20D.toFixed(
2
)}%.`
);

}


counterEvidence.push(
`NASDAQ price trend remains ${data.nasdaq.trend}.`
);

}


if (
data.falseBreakRisk >= 60
) {

counterEvidence.push(
`Rotation false-break risk is elevated at ${Math.round(
data.falseBreakRisk
)}.`
);

}


/* -----------------------------------------------------
HISTORY / TENSION
----------------------------------------------------- */

if (
evidenceAssessment.tension.state !==
"NONE"
) {

supportingEvidence.push(
`Price-vs-structure tension is ${evidenceAssessment.tension.state}.`
);

}


/* -----------------------------------------------------
COT POSITIONING
----------------------------------------------------- */

if (
cot.available
) {

if (
cot.observationCount > 0
) {

supportingEvidence.push(
`COT positioning layer contains ${cot.observationCount} weekly observation(s).`
);

}


if (
cot.summaryCount > 0
) {

supportingEvidence.push(
`COT positioning contains ${cot.summaryCount} market/group positioning summary(ies).`
);

}


if (
cot.extremeCount > 0
) {

supportingEvidence.push(
`${cot.extremeCount} COT positioning observation(s) are at historical extremes.`
);

}


if (
cot.divergenceCount > 0
) {

supportingEvidence.push(
`${cot.divergenceCount} COT positioning divergence(s) detected between trader groups.`
);

}

}


/* -----------------------------------------------------
DIVERGENCES
----------------------------------------------------- */

for (
const divergence of divergences
) {

if (
divergence.type ===
"PRICE_VS_INTERNALS" ||
divergence.type ===
"PRICE_VS_FRAGILITY" ||
divergence.type ===
"ROTATION_VS_PRICE" ||
divergence.type ===
"REGIME_VS_PRICE"
) {

/*
* These divergences describe a conflict.
*
* The structural component supports the thesis,
* while resilient price is simultaneously
* counter-evidence.
*
* Do not blindly classify every divergence as
* supporting evidence.
*/

continue;

}


supportingEvidence.push(
divergence.observation
);

}


/* -----------------------------------------------------
INVALIDATION
----------------------------------------------------- */

invalidationConditions.push(
"Aggregate risk score returns sustainably below the defensive zone."
);

invalidationConditions.push(
"Breadth, participation and liquidity improve materially together."
);

invalidationConditions.push(
"Internal divergence and structural fragility normalize while price remains constructive."
);

invalidationConditions.push(
"Rotation confirmation recovers from internal breakdown and false-break risk declines."
);


/* -----------------------------------------------------
RESEARCH THESIS
----------------------------------------------------- */

let statement =
"Market structure is currently balanced; no dominant research thesis is confirmed.";


if (
evidenceAssessment.structuralBias ===
"BEARISH"
) {

if (
evidenceAssessment.contradiction ===
"HIGH" ||
evidenceAssessment.contradiction ===
"VERY_HIGH"
) {

statement =
"Market structure supports a defensive thesis, but resilient price behavior and other counter-evidence create a material timing conflict. Structural risk is elevated without full price confirmation.";

}

else {

statement =
"Market structure supports a defensive thesis and independent evidence is increasingly confirming the structural risk configuration.";

}

}

else if (
evidenceAssessment.structuralBias ===
"BULLISH"
) {

statement =
"Market structure is constructive, subject to confirmation from price, liquidity and broader participation.";

}

else if (
evidenceAssessment.structuralBias ===
"MIXED"
) {

statement =
"Market evidence is mixed, with meaningful disagreement between structural internals and current price behavior.";

}


if (
cot.available &&
(
cot.extremeCount > 0 ||
cot.divergenceCount > 0
)
) {

statement +=
" COT positioning provides additional context but has not yet been directionally synthesized in this research version.";

}


return {

statement,

supportingEvidence:
uniqueStrings(
supportingEvidence
),

counterEvidence:
uniqueStrings(
counterEvidence
),

invalidationConditions:
uniqueStrings(
invalidationConditions
),

};

}


/* =====================================================
RISKS
===================================================== */

function buildRisks(
data: ExtractedSnapshot,
divergences: AIDivergence[],
cot: COTResearchSummary,
history: HistoryResearchSummary,
evidenceAssessment: AIResearchEvidenceAssessment
): AIResearchRisk[] {

const risks:
AIResearchRisk[] = [];


/* -----------------------------------------------------
CRASH PROBABILITY
----------------------------------------------------- */

if (
data.crashProbability >= 50
) {

risks.push({

risk:
"Elevated crash probability",

explanation:
`Crash Engine probability is ${Math.round(
data.crashProbability
)}%.`,

evidenceType:
"SNAPSHOT",

});

}


/* -----------------------------------------------------
STRUCTURAL FRAGILITY
----------------------------------------------------- */

if (
data.fragilityScore >= 70
) {

risks.push({

risk:
"Structural fragility",

explanation:
`Fragility score is ${Math.round(
data.fragilityScore
)} (${data.fragilityState}).`,

evidenceType:
"SNAPSHOT",

});

}


/* -----------------------------------------------------
ROTATION DECAY
----------------------------------------------------- */

if (
data.rotationDecayScore >= 60
) {

risks.push({

risk:
"Rotation decay",

explanation:
`Rotation decay score is ${Math.round(
data.rotationDecayScore
)}.`,

evidenceType:
"SNAPSHOT",

});

}


/* -----------------------------------------------------
LIQUIDITY
----------------------------------------------------- */

if (
data.liquidityScore < 40
) {

risks.push({

risk:
"Liquidity deterioration",

explanation:
`Liquidity score is ${Math.round(
data.liquidityScore
)}.`,

evidenceType:
"SNAPSHOT",

});

}


/* -----------------------------------------------------
FALSE BREAK
----------------------------------------------------- */

if (
data.falseBreakRisk >= 60
) {

risks.push({

risk:
"False-break risk",

explanation:
`Rotation confirmation reports false-break risk of ${Math.round(
data.falseBreakRisk
)}.`,

evidenceType:
"SNAPSHOT",

});

}


/* -----------------------------------------------------
PERSISTENT PRICE / STRUCTURE TENSION
----------------------------------------------------- */

if (
evidenceAssessment.tension.state ===
"ESTABLISHED" ||
evidenceAssessment.tension.state ===
"PERSISTENT" ||
evidenceAssessment.tension.state ===
"EXTREME"
) {

risks.push({

risk:
"Persistent price-vs-structure tension",

explanation:
history.available
? `Defensive internals coexist with constructive NASDAQ price behavior across ${Math.max(
1,
history.consecutiveTensionTradingDays
)} consecutive trading day(s) in available research history.`
: "Defensive internals coexist with constructive NASDAQ price behavior.",

evidenceType:
"HISTORY",

});

}


/* -----------------------------------------------------
COT
----------------------------------------------------- */

if (
cot.available &&
(
cot.extremeCount > 0 ||
cot.divergenceCount > 0
)
) {

risks.push({

risk:
"COT positioning divergence",

explanation:
[
cot.extremeCount > 0
? `${cot.extremeCount} historical COT extreme(s)`
: "",

cot.divergenceCount > 0
? `${cot.divergenceCount} trader-group divergence(s)`
: "",
]
.filter(Boolean)
.join(" and ") +
" detected in the COT positioning layer.",

evidenceType:
"COMBINED",

});

}


/* -----------------------------------------------------
DIVERGENCES
----------------------------------------------------- */

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


/* -----------------------------------------------------
NO DOMINANT RISK
----------------------------------------------------- */

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
data: ExtractedSnapshot,
evidenceAssessment: AIResearchEvidenceAssessment
): AIForwardTestClaim[] {

const claims:
AIForwardTestClaim[] = [];


/* -----------------------------------------------------
DEFENSIVE STRUCTURE
----------------------------------------------------- */

if (
evidenceAssessment.structuralBias ===
"BEARISH"
) {

claims.push({

claim:
evidenceAssessment.tension.state !==
"NONE"
? "Defensive internal structure with resilient price should be monitored for either delayed downside confirmation or structural invalidation."
: "Elevated defensive structure should be monitored for continued weakness or failed recovery.",

expectedDirection:
"DOWN",

horizonDays:
5,

confirmationCondition:
"Master Score remains >= 65 and price begins to confirm existing structural weakness without material improvement in breadth, participation or liquidity.",

invalidationCondition:
"Master Score falls below 50 together with improving breadth, participation, market quality and liquidity.",

confidence:
evidenceAssessment.confirmation ===
"VERY_STRONG"
? 70
: evidenceAssessment.confirmation ===
"STRONG"
? 65
: evidenceAssessment.confirmation ===
"PARTIAL"
? 58
: 50,

});

}


/* -----------------------------------------------------
CONSTRUCTIVE STRUCTURE
----------------------------------------------------- */

if (
evidenceAssessment.structuralBias ===
"BULLISH"
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
"Master Score rises above 50 with simultaneous deterioration in breadth, participation or liquidity.",

confidence:
evidenceAssessment.confirmation ===
"VERY_STRONG"
? 70
: evidenceAssessment.confirmation ===
"STRONG"
? 65
: 55,

});

}


/* -----------------------------------------------------
FRAGILITY WARNING
----------------------------------------------------- */

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
divergences: AIDivergence[],
cot: COTResearchSummary,
history: HistoryResearchSummary,
evidenceAssessment: AIResearchEvidenceAssessment
): string {

return [

`Research risk posture: ${regime.bias}.`,

`Official Master Score: ${Math.round(
data.masterScore
)}.`,

`Official phase: ${data.phase}.`,

`Official Master Mode: ${data.masterMode}.`,

`Official Master Regime: ${data.masterRegime}.`,

`Structural research bias: ${evidenceAssessment.structuralBias}.`,

`Independent confirmation: ${evidenceAssessment.confirmation}.`,

`Contradiction: ${evidenceAssessment.contradiction}.`,

`Entry maturity: ${evidenceAssessment.entryMaturity}.`,

`Research opportunity state: ${evidenceAssessment.opportunityState}.`,

`Price-vs-structure tension: ${evidenceAssessment.tension.state}.`,

history.available
? `Research history: ${history.snapshotCount} snapshot(s) across ${history.uniqueTradingDays} trading day(s).`
: "Research history: not available.",

`Detected divergences: ${divergences.length}.`,

`Crash Engine probability: ${Math.round(
data.crashProbability
)}%.`,

`COT positioning: ${
cot.available
? `${cot.observationCount} observation(s), ${cot.summaryCount} market/group summary(ies), ${cot.divergenceCount} divergence(s), ${cot.extremeCount} extreme(s).`
: "not available."
}`,

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


const history =
buildHistoryResearchSummary(
input.history
);


const cot =
extractCOTResearchSummary(
input.positioning
);


const regime =
buildRegimeAssessment(
data
);


const evidenceAssessment =
buildEvidenceAssessment(
data,
history,
cot,
input.sources?.length ?? 0
);


const divergences =
buildDivergences(
data,
history
);


const thesis =
buildThesis(
data,
divergences,
cot,
evidenceAssessment
);


const risks =
buildRisks(
data,
divergences,
cot,
history,
evidenceAssessment
);


const forwardTestClaims =
buildForwardTestClaims(
data,
evidenceAssessment
);


const report:
AIResearchReport = {

generatedAt:
new Date().toISOString(),

task:
input.context.task,

regime,

evidenceAssessment,

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
divergences,
cot,
history,
evidenceAssessment
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