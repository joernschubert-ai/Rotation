import type { InstrumentBrief } from "./aiResearchInstrumentBriefs";
import type { ResearchTrigger } from "./aiResearchTriggers";
export const SYNTHESIS_CONTRACT = "QWEN_LIVE_FORMATION_FRAME_V13";

export interface ResearchSynthesisContent {
  conclusion: "WATCH_ONLY" | "PREPARATION" | "CANDIDATES" | "RISK_REVIEW";
  summary: string;
  asymmetry: string;
  flows: Array<{
    instrument: "NASDAQ_PUT" | "NASDAQ_CALL" | "RUSSELL_CALL";
    assessment: "WATCH" | "PREPARE" | "STARTER_CANDIDATE" | "CONFIRM" | "REDUCE";
    reasoning: string;
    reasoningParts?: { supporting: string; opposing: string; earlyOpportunity: string };
    whyNow: string;
    counterargument: string;
    confirmation: string;
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
  status: "SUCCESS" | "UNAVAILABLE";
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
