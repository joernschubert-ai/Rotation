import { loadMarketHistory } from "@/lib/history/marketHistory";
import { buildAIResearchContext } from "./aiResearchContext";
import { runAIResearch } from "./aiResearchEngine";
import { fetchExternalResearchSources } from "./aiResearchExternalSources";
import { selectTopResearchSources } from "./aiResearchSourceRelevance";
import { fetchCOTData } from "./aiResearchCOTProvider";
import { loadAIResearchHistoricalEvidence } from "./aiResearchHistoricalEvidenceService";
import { enrichAIResearchWithHistoricalEvidence } from "./aiResearchHistoricalEvidenceReport";
import type { AIResearchResult, AIResearchTask } from "./aiResearchTypes";

export interface RunAIResearchFromHistoryInput {
  task: AIResearchTask;
  question?: string;
}

function message(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "Unknown provider error";
}

export async function runAIResearchFromHistory(
  input: RunAIResearchFromHistoryInput
): Promise<AIResearchResult> {
  const warnings: string[] = [];
  try {
    // Optional providers fail independently. History remains the required basis.
    // Promise.resolve also captures a provider that throws synchronously.
    const [historyLoad, newsLoad, cotLoad] = await Promise.allSettled([
      Promise.resolve().then(() => loadMarketHistory()),
      Promise.resolve().then(() => fetchExternalResearchSources({ task: input.task })),
      Promise.resolve().then(() => fetchCOTData()),
    ]);
    if (historyLoad.status === "rejected") {
      throw new Error(`Required market history unavailable: ${message(historyLoad.reason)}`);
    }
    const sources = newsLoad.status === "fulfilled" ? newsLoad.value.sources : [];
    if (newsLoad.status === "rejected") warnings.push(`External news unavailable: ${message(newsLoad.reason)}`);
    else warnings.push(...(newsLoad.value.diagnostics?.warnings ?? []));
    if (cotLoad.status === "rejected") warnings.push(`COT unavailable: ${message(cotLoad.reason)}`);
    else warnings.push(...(cotLoad.value.diagnostics?.warnings ?? []));

    const now = Date.now();
    // Do not assume storage ordering. Invalid and future snapshots cannot be current.
    const history = (Array.isArray(historyLoad.value) ? historyLoad.value : [])
      .filter(item => item && typeof item === "object" &&
        typeof item.timestamp === "string" &&
        Number.isFinite(Date.parse(item.timestamp)) && Date.parse(item.timestamp) <= now)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    if (!history.length) return {
      status: "INSUFFICIENT_DATA", report: null,
      diagnostics: { historyCount: 0, sourceCount: sources.length,
        warnings: [...warnings, "No valid persisted snapshot available at request time."] },
    };
    const currentSnapshot = history[0];
    warnings.push(`Research uses persisted snapshot ${currentSnapshot.timestamp}; it is not a fresh market fetch.`);
    if (now - Date.parse(currentSnapshot.timestamp) > 86400000) {
      warnings.push("Persisted snapshot is older than 24 calendar hours; this report is not a current live assessment.");
    }

    let rankedSources = sources.slice(0, 12);
    try { rankedSources = selectTopResearchSources(sources, input.task, 12); }
    catch (error) {
      // Do not pass unranked input as ranked evidence.
      rankedSources = [];
      warnings.push(`News ranking unavailable: ${message(error)}`);
    }
    let historicalEvidence: Awaited<ReturnType<typeof loadAIResearchHistoricalEvidence>> | undefined;
    try {
      historicalEvidence = await loadAIResearchHistoricalEvidence(currentSnapshot.timestamp);
      warnings.push(...historicalEvidence.diagnostics.warnings);
    } catch (error) { warnings.push(`Historical evidence unavailable: ${message(error)}`); }

    const researchInput = buildAIResearchContext({
      snapshot: currentSnapshot, history, task: input.task, question: input.question,
      sources: rankedSources,
      positioning: cotLoad.status === "fulfilled" ? cotLoad.value.data : undefined,
      historicalEvidence,
    });
    const result = runAIResearch(researchInput);
    if (result.status === "SUCCESS" && result.report && historicalEvidence) {
      // The existing renderer is used only when matching refers to the snapshot day.
      // Older descriptive results remain cached; they are not relabelled as live matches.
      if (historicalEvidence.currentStates.some(state => state.comparable)) {
        try {
          result.report = enrichAIResearchWithHistoricalEvidence(result.report, historicalEvidence);
        } catch (error) { warnings.push(`Historical report enrichment unavailable: ${message(error)}`); }
      } else warnings.push("Historical live-state matching omitted: no comparable state for the snapshot date. Cached historical data were preserved.");
    }
    result.diagnostics = {
      ...result.diagnostics,
      snapshotTimestamp: currentSnapshot.timestamp,
      historyCount: history.length, sourceCount: rankedSources.length,
      warnings: [...new Set([...(result.diagnostics?.warnings ?? []), ...warnings])],
    };
    return result;
  } catch (error) {
    return { status: "RESEARCH_ERROR", report: null,
      diagnostics: { warnings: [...warnings, message(error)] } };
  }
}
