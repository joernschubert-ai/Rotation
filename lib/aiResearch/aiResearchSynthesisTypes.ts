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
    /** Diagnostic text only. Never an approved recommendation or displayed content. */
    rejectedConditions?: Array<{ instrument: string; confirmation: string; invalidation: string }>;
    inputSummary?: {
      prices: Array<{ market: string; current: number | null; momentum5D: number | null; momentum20D: number | null; quoteTimestamp: string | null; entryDataReady: boolean }>;
      cotReportDates: string[];
      historicalAsOf: string | null;
      newsCount: number;
    };
  };
}
