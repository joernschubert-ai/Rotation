import type {
  AIResearchContext, AIResearchHistory, AIResearchInput, AIResearchSnapshot,
  AIResearchSource, AIResearchTask,
} from "./aiResearchTypes";
import type { AIResearchCOTData } from "./aiResearchCOTTypes";
import type { AIResearchHistoricalEvidence } from "./aiResearchHistoricalEvidenceTypes";

const HISTORY_WINDOW = 30;
const VERSION_KEYS = ["history", "master", "rotation", "liquidity", "rotationDecay", "participation", "marketQuality", "fragility"];

export interface BuildAIResearchContextInput {
  snapshot: AIResearchSnapshot;
  history?: AIResearchHistory;
  task: AIResearchTask;
  question?: string;
  requestedAt?: string;
  sources?: AIResearchSource[];
  positioning?: AIResearchCOTData;
  historicalEvidence?: AIResearchHistoricalEvidence;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function timestamp(snapshot: AIResearchSnapshot): number {
  const value = snapshot.timestamp;
  // Require a timezone so the server's local timezone cannot change the result.
  return typeof value === "string" && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
}
function marketDate(time: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(time));
  const get = (key: string) => parts.find(item => item.type === key)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function signature(snapshot: AIResearchSnapshot): string | null {
  const universe = object(snapshot.breadthDataQuality).universeVersion;
  const versions = object(snapshot.calculationVersions);
  if (typeof universe !== "string" || !universe.trim()) return null;
  const values = VERSION_KEYS.map(key => versions[key]);
  if (!values.every(value => typeof value === "string" && value.trim().length > 0)) return null;
  return JSON.stringify([universe, ...values]);
}

export function buildAIResearchContext(input: BuildAIResearchContextInput): AIResearchInput {
  const snapshot = input.snapshot;
  const asOf = timestamp(object(snapshot));
  if (!Number.isFinite(asOf)) throw new Error("AI Research requires a snapshot timestamp with timezone.");
  const valid = (Array.isArray(input.history) ? input.history : [])
    .filter(item => item && typeof item === "object" && !Array.isArray(item))
    .filter(item => {
      const time = timestamp(item);
      return Number.isFinite(time) && time <= asOf;
    });
  // Include the authoritative current frame even if it has not been stored yet.
  const frames = [...valid, snapshot].sort((a, b) => timestamp(a) - timestamp(b));
  const daily = new Map<string, AIResearchSnapshot>();
  for (const frame of frames) daily.set(marketDate(timestamp(frame)), frame);
  const archive = [...daily.values()].sort((a, b) => timestamp(a) - timestamp(b));
  const currentSignature = signature(snapshot);
  const comparable: AIResearchHistory = [];
  // A known different/unknown version breaks persistence. Do not jump over it.
  if (currentSignature !== null) {
    for (let index = archive.length - 1; index >= 0; index--) {
      if (signature(archive[index]) !== currentSignature) break;
      comparable.unshift(archive[index]);
    }
  }
  const history = archive.slice(-HISTORY_WINDOW);
  const context: AIResearchContext = {
    task: input.task,
    requestedAt: input.requestedAt ?? new Date().toISOString(),
    ...(input.question ? { question: input.question } : {}),
  };
  return {
    snapshot, history, context, sources: Array.isArray(input.sources) ? input.sources : [],
    // Raw index references are retained separately; no legacy structural scores
    // are smuggled into comparable-history counts through this archive.
    priceHistory: archive.map(frame => ({ timestamp: frame.timestamp, indices: frame.indices })),
    historyQuality: {
      policy: "LEGACY_RESEARCH_HISTORY_RESTORED_V55",
      trustedStart: archive.length ? marketDate(timestamp(archive[0])) : marketDate(asOf), currentVersionKnown: currentSignature !== null,
      retainedPriceDates: archive.length, comparableStructureDates: comparable.slice(-HISTORY_WINDOW).length,
      warnings: [
        "Persistence counts observed New York market dates, not a verified exchange-session calendar.",
        "The last 30 retained daily snapshots, including legacy structural scores, are used as user-requested historical context. Universe/model changes can distort trends and persistence; this is not a homogeneous current-model sample.",
        ...(currentSignature === null ? ["Current universe/model identity is incomplete; retained legacy history remains available as mixed-method context."] : []),
      ],
    },
    ...(input.positioning ? { positioning: input.positioning } : {}),
    ...(input.historicalEvidence ? { historicalEvidence: input.historicalEvidence } : {}),
  };
}
