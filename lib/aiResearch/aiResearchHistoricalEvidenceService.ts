import {
loadHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeProvider";

import {
alignHistoricalRegimeMarketData,
} from "@/lib/historicalRegime/historicalRegimeAlignment";

import {
loadHistoricalRegimeRatesData,
} from "@/lib/historicalRegime/historicalRegimeRatesProvider";

import {
alignHistoricalRegimeRates,
} from "@/lib/historicalRegime/historicalRegimeRatesAlignment";

import {
buildHistoricalRegimeFeatures,
} from "@/lib/historicalRegime/historicalRegimeFeatures";

import {
buildHistoricalRegimePriceVixFeatures,
} from "@/lib/historicalRegime/historicalRegimePriceVixFeatures";

import {
buildHistoricalRegimeOutcomes,
} from "@/lib/historicalRegime/historicalRegimeOutcomes";

import {
buildHistoricalRegimePriceVixForward,
} from "@/lib/historicalRegime/historicalRegimePriceVixForward";

import {
buildAIHistoricalEvidence,
} from "./aiResearchHistoricalEvidenceProvider";

import type {
AIResearchHistoricalEvidence,
} from "./aiResearchHistoricalEvidenceTypes";

/* =====================================================
AI RESEARCH - HISTORICAL EVIDENCE SERVICE
===================================================== */

/*
* Reuses existing historical research calculations.
*
* The service:
*
* - does not modify historical engines
* - does not modify market snapshots
* - does not generate trading signals
* - caches completed results server-side
* - deduplicates concurrent calculations
* - returns partial/unavailable evidence on failure
*
* Cache scope:
*
* Current Node.js process only.
*
* On serverless deployments, a new instance may
* have an empty cache. Persistent storage can be
* added later without changing the public interface.
*/

/* =====================================================
CACHE SETTINGS
===================================================== */

const CACHE_TTL_MS =
24 * 60 * 60 * 1000;

/*
* A completed calculation is reused for 24 hours.
*
* This is an operational cache, not a historical
* data persistence layer.
*/

interface CachedEvidence {
value: AIResearchHistoricalEvidence;
expiresAt: number;
}

let cachedEvidence: CachedEvidence | null = null;

let pendingCalculation:
Promise<AIResearchHistoricalEvidence> | null = null;

/* =====================================================
FALLBACK
===================================================== */

function unavailableEvidence(
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

warnings: [warning],
},
};
}

/* =====================================================
HISTORICAL CALCULATION
===================================================== */

async function calculateHistoricalEvidence():
Promise<AIResearchHistoricalEvidence> {
const [marketData, ratesData] =
await Promise.all([
loadHistoricalRegimeMarketData(),
loadHistoricalRegimeRatesData(),
]);

const market =
alignHistoricalRegimeMarketData(
marketData
);

if (market.count === 0) {
return unavailableEvidence(
"Historical market alignment returned no observations."
);
}

const ratesAligned =
alignHistoricalRegimeRates(
market,
ratesData
);

const marketFeatures =
buildHistoricalRegimeFeatures(
ratesAligned.days
);

const priceVixFeatures =
buildHistoricalRegimePriceVixFeatures(
marketFeatures
);

const outcomes =
buildHistoricalRegimeOutcomes(
market.days
);

const forward =
buildHistoricalRegimePriceVixForward(
priceVixFeatures,
outcomes
);

/*
* Current-state matching uses the latest
* available historical feature day.
*
* This is not necessarily the same timestamp
* as the latest Rotation-App live snapshot.
*/

const latestFeature =
priceVixFeatures.days.length > 0
? priceVixFeatures.days[
priceVixFeatures.days.length - 1
]
: null;

const evidence =
buildAIHistoricalEvidence({
forwardDataset: forward,
currentFeatureDay: latestFeature,
});

/*
* The independent historical API has more
* exhaustive validation checks.
*
* Here we enforce the basic data integrity
* requirements before making the result
* available to AI Research.
*/

const validDataset =
forward.diagnostics.chronological &&
forward.diagnostics.duplicateOutcomeDates === 0 &&
forward.diagnostics.duplicateFeatureDates === 0 &&
forward.diagnostics.unmatchedFeatureDays === 0 &&
forward.diagnostics.usesOnlyHistoricalFeatures &&
forward.diagnostics.matchedFeatureDays ===
priceVixFeatures.count;

if (!validDataset) {
return unavailableEvidence(
"Historical Price/VIX dataset failed integrity checks."
);
}

return evidence;
}

/* =====================================================
PUBLIC SERVICE
===================================================== */

export async function loadAIResearchHistoricalEvidence():
Promise<AIResearchHistoricalEvidence> {
const now = Date.now();

if (
cachedEvidence &&
cachedEvidence.expiresAt > now
) {
return cachedEvidence.value;
}

if (pendingCalculation) {
return pendingCalculation;
}

pendingCalculation = (async () => {
try {
const evidence =
await calculateHistoricalEvidence();

/*
* Cache only successfully constructed
* historical research results.
*
* A failed fetch or unavailable dataset
* should not poison the 24-hour cache.
*/

if (
evidence.status === "AVAILABLE" ||
evidence.status === "PARTIAL"
) {
cachedEvidence = {
value: evidence,
expiresAt:
Date.now() + CACHE_TTL_MS,
};
}

return evidence;
} catch (error) {
const message =
error instanceof Error
? error.message
: "Unknown historical evidence error";

return unavailableEvidence(
`Historical evidence unavailable: ${message}`
);
} finally {
pendingCalculation = null;
}
})();

return pendingCalculation;
}

