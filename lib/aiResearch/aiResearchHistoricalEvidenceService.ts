import { buildChartContext, completedDailyCutoff } from "./aiResearchChartContext";
import { verifiedResearchMarketDate } from "./aiResearchSynthesisEvidence";
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
import { buildHistoricalMarketStudies } from "./aiResearchHistoricalMarketStudies";
import { buildHistoricalTemporalValidation } from "./aiResearchHistoricalTemporalValidation";

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
dailyCutoff: string;
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
const [marketLoad, ratesLoad] =
await Promise.allSettled([
loadHistoricalRegimeMarketData(),
loadHistoricalRegimeRatesData(),
]);
if (marketLoad.status === "rejected") throw new Error("Historical index provider failed.");
const marketData = marketLoad.value;
let chartContext: ReturnType<typeof buildChartContext>|undefined;
const chartWarnings:string[]=[];
try{chartContext=buildChartContext(marketData, completedDailyCutoff(new Date()));}catch{chartWarnings.push("Chart calculation unavailable; existing historical studies remain independent.");}

const market =
alignHistoricalRegimeMarketData(
marketData
);

const coverage: NonNullable<AIResearchHistoricalEvidence["coverage"]> = {
  policy: "HISTORICAL_INDEX_STUDIES_V1",
  requestedRange: "15y",
  sourceSeries: Object.entries(marketData).map(([market, series]) => ({
    market, symbol: series.symbol, count: series.count, firstDate: series.firstDate, lastDate: series.lastDate
  })),
  alignedDates: market.count, firstAlignedDate: market.firstDate, lastAlignedDate: market.lastDate,
  ratesAlignedDates: 0,
  omittedModules: ["COT-conditioned outcomes", "ETF leadership/divergence episode controls", "CPI/NFCI/real-yield vintage studies", "historical constituent breadth", "chart-zone studies"]
};
if (market.count === 0) return {
  ...unavailableEvidence("Historical market alignment returned no observations; inspect source coverage."), coverage, chartContext
};
const marketStudies = buildHistoricalMarketStudies(market.days);
let temporalValidation: ReturnType<typeof buildHistoricalTemporalValidation>|undefined;
try { temporalValidation=buildHistoricalTemporalValidation(market.days,completedDailyCutoff(new Date())); }
catch { chartWarnings.push('Episode and chronological diagnostics unavailable; original historical studies retained.'); }
const partial = (warning: string): AIResearchHistoricalEvidence => ({
  ...unavailableEvidence(warning), status: marketStudies.length ? "PARTIAL" : "NOT_AVAILABLE",
  asOfDate: market.lastDate, firstDate: market.firstDate, lastDate: market.lastDate,
  marketStudies, temporalValidation, coverage, chartContext, diagnostics:{...unavailableEvidence(warning).diagnostics,warnings:[warning,...chartWarnings]}
});
// A rates outage must not suppress independent index/rotation studies.
if (ratesLoad.status === "rejected") return partial("Rates provider unavailable; independent market studies remain available.");
const ratesData = ratesLoad.value;

try {
const ratesAligned =
alignHistoricalRegimeRates(
market,
ratesData
);
coverage.ratesAlignedDates = ratesAligned.days.length;
if (!ratesAligned.days.length) return partial("No rates-aligned dates; independent market studies remain available.");

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
marketStudies,
coverage,
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
return partial(
"Historical Price/VIX dataset failed integrity checks."
);
}

return {...evidence, chartContext, temporalValidation, diagnostics:{...evidence.diagnostics,warnings:[...evidence.diagnostics.warnings,...chartWarnings]}};
} catch {
  return partial("Legacy Price/VIX or rates calculation failed; independent market studies remain available.");
}
}

/* =====================================================
PUBLIC SERVICE
===================================================== */

async function loadCachedHistoricalEvidence():
Promise<AIResearchHistoricalEvidence> {
const now = Date.now();

if (
cachedEvidence &&
cachedEvidence.expiresAt > now && cachedEvidence.dailyCutoff === completedDailyCutoff(new Date(now))
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
dailyCutoff: completedDailyCutoff(new Date()),
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


/* A per-request view of the cache. Never change the shared historical result.
 * The cache creation time is not the market observation time.
 * This is descriptive comparison, not point-in-time historical backtesting.
 */
export async function loadAIResearchHistoricalEvidence(
  snapshotTimestamp?: string,
  snapshot?: unknown
): Promise<AIResearchHistoricalEvidence> {
  const evidence = await loadCachedHistoricalEvidence();
  if (!snapshotTimestamp) return evidence;
  const timestamp = Date.parse(snapshotTimestamp);
  if (!Number.isFinite(timestamp)) {
    return unavailableEvidence("Historical comparison requires a valid snapshot timestamp.");
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const part = (name: string) => parts.find(item => item.type === name)?.value ?? "";
  const snapshotDay = `${part("year")}-${part("month")}-${part("day")}`;
  const dateKey = (value: string | null): string | null => {
    if (!value || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) return null;
    const day = value.slice(0, 10);
    const parsed = Date.parse(`${day}T00:00:00Z`);
    return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === day ? day : null;
  };
  // A later dataset can contain outcomes that did not exist at snapshot time.
  // Refuse to reuse it for an older snapshot rather than claim lookahead safety.
  if ([evidence.asOfDate, evidence.lastDate, evidence.coverage?.lastAlignedDate ?? null,
    ...(evidence.marketStudies ?? []).map(study => study.asOfDate)].some(value => {
    const day = dateKey(value); return day !== null && day > snapshotDay;
  })) return unavailableEvidence("Historical dataset is later than the snapshot date; point-in-time comparison is unavailable.");

  const marketDay = (market: string) => verifiedResearchMarketDate(snapshot, market) ?? snapshotDay;
  const timingNote = `Historical dataset as of ${evidence.asOfDate ?? "UNKNOWN"}; last historical day ${evidence.lastDate ?? "UNKNOWN"}; snapshot request date ${snapshotDay}; Nasdaq observation ${marketDay("NASDAQ")}, Russell observation ${marketDay("RUSSELL_2000")}. Daily matching does not establish intraday confirmation or publication-time availability.`;
  const currentStates = evidence.currentStates.map(state => {
    const sameDay = dateKey(state.asOfDate) === marketDay(state.market);
    return { ...state, comparable: state.comparable && sameDay,
      limitations: [...state.limitations, timingNote,
        ...(sameDay ? [] : ["This state is not dated to the snapshot market day; do not treat it as a current-state match."])],
    };
  });
  const matched = currentStates.filter(state => state.comparable).length;
  return {
    ...evidence,
    chartContext: evidence.chartContext && [evidence.chartContext.nasdaq.asOfDate,evidence.chartContext.russell.asOfDate].every(day=>day===null||day<=completedDailyCutoff(new Date(timestamp))) ? evidence.chartContext : undefined,
    marketStudies: evidence.marketStudies?.map(study => ({ ...study,
      currentMatch: study.currentMatch && study.asOfDate === marketDay(study.market),
      limitations: [...study.limitations, timingNote]
    })),
    status: evidence.status === "AVAILABLE" && matched < currentStates.length ? "PARTIAL" : evidence.status,
    currentStates,
    observations: evidence.observations.map(observation => ({
      ...observation, limitations: [...observation.limitations, timingNote],
    })),
    diagnostics: {
      ...evidence.diagnostics,
      matchedCurrentStates: matched,
      unmatchedCurrentStates: currentStates.length - matched,
      warnings: [...evidence.diagnostics.warnings, timingNote],
    },
  };
}

