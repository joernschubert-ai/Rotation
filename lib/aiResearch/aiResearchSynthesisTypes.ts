export interface ResearchSynthesisContent {
  summary: string;
  asymmetry: string;
  flows: Array<{
    instrument: "NASDAQ_PUT" | "NASDAQ_CALL" | "RUSSELL_CALL";
    assessment: "WATCH" | "PREPARE" | "STARTER_CANDIDATE" | "CONFIRM" | "REDUCE";
    reasoning: string;
    confirmation: string;
    invalidation: string;
    evidenceRefs: string[];
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
}
