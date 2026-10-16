import type { InstrumentBrief } from "./aiResearchInstrumentBriefs";
export const SYNTHESIS_CONTRACT = "INDEPENDENT_INSTRUMENT_REVIEW_V9_FIXED_FIELDS";

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
    evidenceRefs: string[];
    confirmationRefs: string[];
    invalidationRefs: string[];
    historyStudyId?: string;
    cotGroups?: string[];
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
  quality?: {
    contractVersion: string;
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
        historyStudyId?: string; cotGroups?: string[]; reasoning?: string; counterargument?: string }>;
    };
    inputSummary?: {
      prices: Array<{ market: string; current: number | null; momentum5D: number | null; momentum20D: number | null; quoteTimestamp: string | null; entryDataReady: boolean }>;
      cotReportDates: string[];
      historicalAsOf: string | null;
      newsCount: number;
    };
  };
}
