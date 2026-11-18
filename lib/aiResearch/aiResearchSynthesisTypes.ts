import type { InstrumentBrief } from "./aiResearchInstrumentBriefs";
import type { ResearchTrigger } from "./aiResearchTriggers";
import type { SourceReview } from "./aiResearchSourceReview";
import type { ResearchConcepts } from "./aiResearchConcepts";
import type { COTExpertReport } from "./aiResearchCOTExpert";
import type { COTDataQuality } from "./aiResearchCOTTypes";
import type { InstrumentPriceReferences } from "./aiResearchPriceReferences";
import type { WeightingContext } from "./aiResearchWeighting";
import type { ScenarioReview } from "./aiResearchScenarioState";

export interface ResearchNarrative {
  format: "PLAIN_RESEARCH_V34";
  text: string;
  truncated: boolean;
  audit?: { findings: Array<{ correction: string; quote?: string }>; scope: string };
}
export interface ResearchInstrumentReview {
  instrument: "NASDAQ_PUT" | "NASDAQ_CALL" | "RUSSELL_CALL";
  status: string;
  issues: string[];
  draft?: { reasoning?: string; assessment?: string; whyNow?: string; counterargument?: string; confirmation?: string; invalidation?: string };
}
export interface PreviousSuccessfulResearchSynthesis {
  snapshotTimestamp: string;
  generatedAt?: string;
  model: string;
  sourceReview?: SourceReview;
  content?: ResearchSynthesisContent;
  narrative?: ResearchNarrative;
}
export const SYNTHESIS_CONTRACT = "INDEPENDENT_INSTRUMENT_REVIEW_V11_HISTORICAL_PATTERNS";

export interface ResearchSynthesisContent {
  conclusion: "WATCH_ONLY" | "PREPARATION" | "CANDIDATES" | "RISK_REVIEW";
  summary: string;
  asymmetry: string;
  flows: Array<{
    instrument: "NASDAQ_PUT" | "NASDAQ_CALL" | "RUSSELL_CALL";
    assessment: "WATCH" | "PREPARE" | "STARTER_CANDIDATE" | "CONFIRM" | "REDUCE";
    reasoning: string;
    whyNow: string;
    counterargument: string;
    confirmation: string;
    invalidation: string;
    assessmentExplanation?: string;
    originalAssessment?: string;
    interpretationNotes?: string[];
    cotInterpretations?: Partial<Record<"ASSET_MANAGER" | "LEVERAGED_MONEY", string>>;
    confirmationDirection?: "UP" | "DOWN";
    invalidationDirection?: "UP" | "DOWN";
    conditionOrigin?: "SERVER_INSTRUMENT_AND_ASSESSMENT";
    weightedReview?: import("./aiResearchWeighting").WeightedReview;
    evidenceRefs: string[];
    confirmationRefs: string[];
    invalidationRefs: string[];
    historyStudyId?: string;
    cotGroups?: string[];
    historyMeanVsBaseline?: "ABOVE" | "BELOW" | "EQUAL" | "UNKNOWN";
    confirmationTrigger?: ResearchTrigger;
    invalidationTrigger?: ResearchTrigger;
    /** Attached by the server from validated source bindings, not model numbers. */
    grounding?: {
      history: InstrumentBrief["histories"][number] | null;
      cot: InstrumentBrief["cot"];
      price: InstrumentBrief["price"];
    };
  }>;
  counterarguments: string[];
  limitations: string[];
}

export interface ResearchSynthesis {
  status: "SUCCESS" | "UNAVAILABLE";
  model: string;
  generatedAt?: string;
  snapshotTimestamp: string;
  cached: boolean;
  message: string;
  content?: ResearchSynthesisContent;
  sourceReview?: SourceReview;
  narrative?: ResearchNarrative;
  modelRequestsUsed?: number;
  previousSuccessful?: PreviousSuccessfulResearchSynthesis;
  weightingContexts?: WeightingContext[];
  priceReferences?: InstrumentPriceReferences[];
  cotDataQuality?: COTDataQuality;
  cotAnalysis?: COTExpertReport;
  domainConcepts?: ResearchConcepts;
  indexScenarios?: Record<string, ScenarioReview>;
  instrumentReviews?: ResearchInstrumentReview[];
  quality?: {
    contractVersion: string;
    issues: string[];
    availableEvidenceIds: string[];
    missingOwnPriceMarkets: string[];
    semanticTruthVerified: false;
    normalizations?: string[];
    providerText?: string;
    providerDiagnostics?: Record<string, unknown>;
    responseShape?: { rootKeys: string[]; flowsIsArray: boolean; flowCount: number | null };
    instrumentBriefs?: InstrumentBrief[];
    timing?: {
      preparationMs: number | null;
      synthesisMs: number;
      providerMs: number | null;
      providerTimeoutMs: number;
      inputCharacters: number;
      requestElapsedMs: number | null;
    };
    /** Diagnostic text only. Never an approved recommendation or displayed content. */
    rejectedConditions?: Array<{ instrument: string; confirmation: string; invalidation: string }>;
    rejectedResponse?: {
      summary: string;
      asymmetry: string;
      counterarguments: string[];
      limitations: string[];
      references: Array<{ instrument: string; evidenceRefs: string[]; confirmationRefs: string[]; invalidationRefs: string[];
        historyStudyId?: string; cotGroups?: string[]; reasoning?: string; counterargument?: string;
        historyMeanVsBaseline?: string; confirmationTrigger?: string; invalidationTrigger?: string }>;
    };
    inputSummary?: {
      prices: Array<{ market: string; current: number | null; momentum5D: number | null; momentum20D: number | null; quoteTimestamp: string | null; entryDataReady: boolean }>;
      cotReportDates: string[];
      historicalAsOf: string | null;
      newsCount: number;
    };
    memoryUseAudit?: {
      version: string;
      status: string;
      eligibleCaseCount: number | null;
      selectedCaseCount: number;
      selectedCases: Array<{ ref: string; tag: string; market: string; direction: string; role: string; issuedDate: string | null; anchorDate: string | null; outcome: string }>;
      includedCaseRefs: string[];
      modelOutputReadable: boolean;
      memoryReviewPresent: boolean;
      fallbackUsed: boolean;
      fallbackStatus: string;
      instruments: Array<{ instrument: string; status: string; retrievedCaseRefs: string[]; includedCaseRefs: string[]; reviewedCases: Array<{ ref: string; decision: string; similarity: string | null; difference: string | null; reason: string | null }>; reviewCoverageComplete: boolean; semanticUseVerified: false }>;
      semanticUseVerified: false;
      meaning: string;
    };
  };
}
