import { loadMarketHistory } from "@/lib/history/marketHistory";
import { buildAIResearchContext } from "./aiResearchContext";
import { runAIResearch } from "./aiResearchEngine";
import { buildAIResearchDecisionSupport } from "./aiResearchDecisionSupport";
import { synthesizeResearch } from "./aiResearchCloudflare";
import { fetchExternalResearchSources } from "./aiResearchExternalSources";
import { selectTopResearchSources } from "./aiResearchSourceRelevance";
import { fetchCOTData } from "./aiResearchCOTProvider";
import { loadAIResearchHistoricalEvidence } from "./aiResearchHistoricalEvidenceService";
import { enrichAIResearchWithHistoricalEvidence } from "./aiResearchHistoricalEvidenceReport";
import type { AIResearchResult, AIResearchTask } from "./aiResearchTypes";

export interface RunAIResearchFromHistoryInput {
  task: AIResearchTask;
  question?: string;
  allowAIGeneration?: boolean;
}

function message(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "Unknown provider error";
}

export async function runAIResearchFromHistory(
  input: RunAIResearchFromHistoryInput
): Promise<AIResearchResult> {
  const startedAt = Date.now();
  const timings: Record<string, number> = {};
  const timed = async <T>(name: string, work: () => Promise<T>): Promise<T> => {
    const start = Date.now();
    try { return await work(); }
    finally { timings[name] = Date.now() - start; }
  };
  const warnings: string[] = [];
  try {
    const historyPromise = timed("historyMs", () => loadMarketHistory());
    // Historical loading only needs the saved snapshot, not news or COT.
    // Start it as soon as history is ready instead of waiting for all providers.
    const historicalPromise = historyPromise.then(history => {
      const now = Date.now();
      const latest = (Array.isArray(history) ? history : [])
        .filter(item => item && typeof item.timestamp === "string" &&
          Number.isFinite(Date.parse(item.timestamp)) && Date.parse(item.timestamp) <= now)
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
      return latest ? timed("historicalEvidenceMs", () => loadAIResearchHistoricalEvidence(latest.timestamp, latest)) : undefined;
    });
    // Optional providers fail independently. History remains the required basis.
    // Promise.resolve also captures a provider that throws synchronously.
    const [historyLoad, newsLoad, cotLoad, historicalLoad] = await Promise.allSettled([
      historyPromise,
      timed("newsMs", () => fetchExternalResearchSources({ task: input.task })),
      timed("cotMs", () => fetchCOTData()),
      historicalPromise,
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
      if (historicalLoad.status === "rejected") throw historicalLoad.reason;
      historicalEvidence = historicalLoad.value;
      if (historicalEvidence)
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
      // Always retain dated descriptive data, including baselines and failures.
      // A missing current-day match must not silently remove the whole dataset.
      result.report = { ...result.report, historicalEvidence };
      // The existing renderer is used only when matching refers to the snapshot day.
      // Older descriptive results remain cached; they are not relabelled as live matches.
      if (historicalEvidence.currentStates.some(state => state.comparable)) {
        try {
          result.report = enrichAIResearchWithHistoricalEvidence(result.report, historicalEvidence);
        } catch (error) { warnings.push(`Historical report enrichment unavailable: ${message(error)}`); }
      } else {
        warnings.push("Historical live-state matching omitted: no comparable state for the snapshot date. Dated historical data remain attached as descriptive context.");
        result.report = {
          ...result.report,
          summary: `${result.report.summary} Historical dataset as of ${historicalEvidence.asOfDate ?? "UNKNOWN"}; no comparable current-day state match. Dated observations and baseline returns remain descriptive context only.`,
        };
      }
    }
    if (result.status === "SUCCESS" && result.report) {
      result.report = { ...result.report, decisionSupport: buildAIResearchDecisionSupport(result.report, currentSnapshot) };
      try {
        timings.preparationMs = Date.now() - startedAt;
        result.report.aiSynthesis = await timed("synthesisMs", () => synthesizeResearch(researchInput, result.report!, input.allowAIGeneration === true, {
          requestStartedAt: startedAt, deadlineAt: startedAt + 55000, preparationMs: timings.preparationMs,
        }));
      } catch {
        warnings.push("KI-Synthese nicht verfügbar; regelbasierter Bericht bleibt unverändert.");
      }
    }
    result.diagnostics = {
      ...result.diagnostics,
      snapshotTimestamp: currentSnapshot.timestamp,
      historyCount: history.length, sourceCount: rankedSources.length,
      warnings: [...new Set([...(result.diagnostics?.warnings ?? []), ...warnings])],
      timingsMs: { ...timings, totalMs: Date.now() - startedAt },
    };
    return result;
  } catch (error) {
    return { status: "RESEARCH_ERROR", report: null,
      diagnostics: { warnings: [...warnings, message(error)] } };
  }
}
