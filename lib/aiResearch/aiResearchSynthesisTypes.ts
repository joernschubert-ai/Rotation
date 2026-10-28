import type { ScenarioReview } from "./aiResearchScenarioState";
import type { COTExpertReport } from "./aiResearchCOTExpert";
import type { COTDataQuality } from "./aiResearchCOTTypes";
import type { InstrumentPriceReferences } from "./aiResearchPriceReferences";
import type { WeightingContext, WeightedReview } from "./aiResearchWeighting";
import type { InstrumentBrief } from "./aiResearchInstrumentBriefs";
import type { ResearchTrigger } from "./aiResearchTriggers";
export const SYNTHESIS_CONTRACT = "GEMMA_SOURCE_REVIEW_V79";

export interface ResearchSynthesisContent {
  conclusion: "WATCH_ONLY" | "PREPARATION" | "CANDIDATES" | "RISK_REVIEW";
  summary: string;
  asymmetry: string;
  flows: Array<{
    instrument: "NASDAQ_PUT" | "NASDAQ_CALL" | "RUSSELL_CALL";
    weightedReview?: WeightedReview;
    interpretationNotes?: string[];
    originalAssessment?: string;
    assessmentExplanation?: string;
    assessment: "WATCH" | "PREPARE" | "STARTER_CANDIDATE" | "CONFIRM" | "REDUCE";
    reasoning: string;
    reasoningParts?: { supporting: string; opposing: string; earlyOpportunity: string };
    whyNow: string;
    counterargument: string;
    confirmation: string;
    conditionOrigin?: "SERVER_INSTRUMENT_AND_ASSESSMENT";
    confirmationDirection?: "UP" | "DOWN";
    invalidationDirection?: "UP" | "DOWN";
    invalidation: string;
    evidenceRefs: string[];
    confirmationRefs: string[];
    invalidationRefs: string[];
    timingFocus?: "ALREADY_MOVED" | "EARLY_DIVERGENCE" | "WAIT_FOR_TURN" | "DIRECTION_CONFIRMED" | "DATA_INCOMPLETE";
    structureFocus?: "BREADTH" | "PARTICIPATION" | "PHASE" | "QUALITY";
    historyEffect?: "SUPPORTS_DIRECTION" | "OPPOSES_DIRECTION" | "NEUTRAL" | "UNKNOWN";
    opportunityMechanism?: "CONTINUATION" | "REVERSAL" | "NONE";
    riskMechanism?: string;
    cotReview?: Partial<Record<"ASSET_MANAGER" | "LEVERAGED_MONEY", {horizon: "WEEK" | "FOUR_WEEKS" | "THIRTEEN_WEEKS"; interpretation: string}>>;
    cotInterpretations?: Partial<Record<"ASSET_MANAGER" | "LEVERAGED_MONEY", string>>;
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
  sourceReview?:import('./aiResearchSourceReview').SourceReview;
  domainConcepts?:import("./aiResearchConcepts").ResearchConcepts;
  narrative?:{format:'PLAIN_RESEARCH_V34';text:string;truncated:boolean;audit?:import('./aiResearchNarrativeAudit').NarrativeAudit};
  cotAnalysis?:COTExpertReport;
  modelRequestsUsed?:number;
  indexScenarios?:Record<string,ScenarioReview>;
  previousSuccessful?:{sourceReview?:ResearchSynthesis['sourceReview'];snapshotTimestamp:string;generatedAt?:string;model:string;content?:ResearchSynthesisContent;narrative?:ResearchSynthesis["narrative"]};
  status: "SUCCESS" | "UNAVAILABLE";
  weightingContexts?: WeightingContext[];
  priceReferences?: InstrumentPriceReferences[];
  cotDataQuality?:COTDataQuality;
  model: string;
  generatedAt?: string;
  snapshotTimestamp: string;
  cached: boolean;
  message: string;
  content?: ResearchSynthesisContent;
  instrumentReviews?: Array<{instrument: "NASDAQ_PUT" | "NASDAQ_CALL" | "RUSSELL_CALL"; status: "CHECKED" | "WITHHELD" | "MISSING"; issues: string[]; draft?: ResearchSynthesisContent["flows"][number]}>;
  quality?: {
    contractVersion: string;
    providerText?: string;
    providerDiagnostics?: {finishReason: string | null; completionTokens: number | null; promptTokens: number | null; responseCharacters: number; outputLimitReported: boolean};
    issues: string[];
    availableEvidenceIds: string[];
    missingOwnPriceMarkets: string[];
    semanticTruthVerified: false;
    normalizations?: string[];
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
        structuredReview?: Record<string, unknown>; historyStudyId?: string; cotGroups?: string[]; reasoning?: string; whyNow?: string; counterargument?: string; cotInterpretations?: Partial<Record<"ASSET_MANAGER" | "LEVERAGED_MONEY", string>>;
        historyMeanVsBaseline?: string; confirmationTrigger?: string; invalidationTrigger?: string }>;
    };
    inputSummary?: {
      prices: Array<{ market: string; current: number | null; momentum5D: number | null; momentum20D: number | null; quoteTimestamp: string | null; entryDataReady: boolean }>;
      cotReportDates: string[];
      historicalAsOf: string | null;
      newsCount: number;
    };
  };
}
