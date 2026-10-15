import { createHash, randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { AIResearchInput, AIResearchReport } from "./aiResearchTypes";
import type { ResearchSynthesis, ResearchSynthesisContent } from "./aiResearchSynthesisTypes";

import { buildSynthesisEvidence } from "./aiResearchSynthesisEvidence";
import { inspectSynthesis, validateSynthesis, SYNTHESIS_CONTRACT } from "./aiResearchSynthesisValidation";
import { synthesisSchema as schema, RESEARCH_SYSTEM_PROMPT } from "./aiResearchSynthesisContract";
export { buildSynthesisEvidence } from "./aiResearchSynthesisEvidence";
export { validateSynthesis } from "./aiResearchSynthesisValidation";

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const PREFIX = "rotation:research:cf:v1";
// Keep the quota namespace unchanged so the deployment cannot reset daily limits.
const DAILY_LIMIT = 20;
const text = (value: unknown, limit = 650): string => typeof value === "string" ? value.slice(0, limit) : "";

export async function synthesizeResearch(input: AIResearchInput, report: AIResearchReport, allowGeneration = false): Promise<ResearchSynthesis> {
  const snapshotTimestamp = text(input.snapshot?.timestamp, 40);
  const unavailable = (message: string): ResearchSynthesis => ({ status: "UNAVAILABLE", model: MODEL, snapshotTimestamp, cached: false, message });
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account || !/^[a-f0-9]{32}$/i.test(account)) return unavailable("Cloudflare ist noch nicht vollständig eingerichtet. Die regelbasierte Auswertung bleibt verfügbar.");
  const age = Date.now() - Date.parse(snapshotTimestamp);
  if (!Number.isFinite(age) || age < 0 || age > 86400000) return unavailable("Der Snapshot ist nicht aktuell genug für eine neue KI-Einschätzung.");
  const evidence = buildSynthesisEvidence(input, report);
  const quality = { contractVersion: SYNTHESIS_CONTRACT, issues: [] as string[], availableEvidenceIds: evidence.filter(item => item.available).map(item => item.id),
    missingOwnPriceMarkets: evidence.filter(item => item.kind === "PRICE" && item.entryDataReady !== true).map(item => item.market ?? item.id), semanticTruthVerified: false as const,
    inputSummary: {
      prices: evidence.filter(item => item.kind === "PRICE").map(item => ({ market: item.market ?? item.id, current: item.data.current as number | null, momentum5D: item.data.momentum5D as number | null,
        momentum20D: item.data.momentum20D as number | null, quoteTimestamp: item.data.quoteTimestamp as string | null, entryDataReady: item.entryDataReady === true })),
      cotReportDates: [...new Set(evidence.filter(item => item.kind === "COT").flatMap(item => (item.data.summaries as Array<{ reportDate?: string }>).map(summary => summary.reportDate ?? "")).filter(Boolean))],
      historicalAsOf: report.historicalEvidence?.asOfDate ?? null, newsCount: evidence.filter(item => item.kind === "NEWS").length,
    } };
  const payload = JSON.stringify({ contractVersion: SYNTHESIS_CONTRACT, snapshotTimestamp, task: input.context.task, question: text(input.context.question, 500), evidence });
  if (payload.length > 26000) return unavailable("Die Belege überschreiten die festgelegte Eingabegrenze. Keine KI-Anfrage ausgelöst.");
  // Response diagnostics changed; do not reuse a rejection whose wording was discarded.
  // Daily quota, cooldown and lock namespaces deliberately remain unchanged.
  const cacheKey = `${PREFIX}:cache:${SYNTHESIS_CONTRACT}:condition-audit-v1:${createHash("sha256").update(payload).digest("hex")}`;
  // Rejected text is diagnostic only. Keep it addressable even if news/context
  // change between the POST and a later GET for the identical snapshot/task/question.
  const diagnosticKey = `${PREFIX}:rejected:${SYNTHESIS_CONTRACT}:${createHash("sha256").update(JSON.stringify({
    snapshotTimestamp, task: input.context.task, question: text(input.context.question,500)
  })).digest("hex")}`;
  let redis: Redis;
  try { redis = Redis.fromEnv(); } catch { return unavailable("Der dauerhafte KI-Aufrufschutz ist nicht verfügbar. Keine KI-Anfrage ausgelöst."); }
  const lockKey = `${PREFIX}:lock`;
  const lockToken = randomBytes(16).toString("hex");
  let locked = false;
  let stage = "CACHE_READ";
  let providerRequestStarted = false;
  const storeRejectedDiagnosis = async (value: ResearchSynthesis): Promise<void> => {
    try { await redis.set(diagnosticKey, value, { ex: 900 }); }
    catch { /* Optional diagnostic archive must not change validation or trigger retries. */ }
  };
  try {
    const cached = await redis.get<ResearchSynthesis>(cacheKey);
    if (cached?.snapshotTimestamp === snapshotTimestamp && cached.quality?.contractVersion === SYNTHESIS_CONTRACT) {
      if (cached.status === "SUCCESS" && validateSynthesis(cached.content, evidence)) return { ...cached, cached: true };
      if (cached.status === "UNAVAILABLE" && cached.quality.issues.length) {
        if (allowGeneration) await storeRejectedDiagnosis(cached);
        return { ...cached, cached: true };
      }
    }
    if (!allowGeneration) {
      stage = "DIAGNOSTIC_READ";
      const rejected = await redis.get<ResearchSynthesis>(diagnosticKey);
      if (rejected?.status === "UNAVAILABLE" && rejected.snapshotTimestamp === snapshotTimestamp &&
        rejected.quality?.contractVersion === SYNTHESIS_CONTRACT && rejected.quality.rejectedConditions?.length) {
        return { ...rejected, cached: true };
      }
      return unavailable("Noch keine KI-Analyse für diesen Snapshot gespeichert. In der App Research aktualisieren.");
    }
    stage = "LOCK_ACQUIRE";
    locked = Boolean(await redis.set(lockKey, lockToken, { nx: true, ex: 60 }));
    if (!locked) return unavailable("Eine KI-Analyse läuft bereits. Bitte kurz warten.");
    stage = "CACHE_RECHECK";
    const completed = await redis.get<ResearchSynthesis>(cacheKey);
    if (completed?.snapshotTimestamp === snapshotTimestamp && completed.quality?.contractVersion === SYNTHESIS_CONTRACT) {
      if (completed.status === "SUCCESS" && validateSynthesis(completed.content, evidence)) return { ...completed, cached: true };
      if (completed.status === "UNAVAILABLE" && completed.quality.issues.length) {
        await storeRejectedDiagnosis(completed);
        return { ...completed, cached: true };
      }
    }
    // Atomic daily admission AND cooldown. Attempts count, including provider failures.
    const dayKey = `${PREFIX}:day:${new Date().toISOString().slice(0, 10)}`;
    stage = "QUOTA_CHECK";
    const admitted = await redis.eval<[number], number>(
      "if redis.call('EXISTS',KEYS[2])==1 then return -1 end local n=tonumber(redis.call('GET',KEYS[1]) or '0') if n>=tonumber(ARGV[1]) then return -2 end redis.call('INCR',KEYS[1]) redis.call('EXPIRE',KEYS[1],172800) redis.call('SET',KEYS[2],'1','EX',90) return n+1",
      [dayKey, `${PREFIX}:cooldown`], [DAILY_LIMIT]);
    if (admitted === -1) return unavailable("Aufrufpause aktiv. Eine neue KI-Analyse ist nach 90 Sekunden möglich.");
    if (admitted < 0) return unavailable("Das App-Tageslimit von 20 KI-Versuchen ist erreicht. Freigabe wieder ab 00:00 UTC.");
    stage = "CLOUDFLARE_REQUEST";
    providerRequestStarted = true;
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${MODEL}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, cache: "no-store", signal: AbortSignal.timeout(35000),
      body: JSON.stringify({ max_tokens: 1800, temperature: 0.2, response_format: { type: "json_schema", json_schema: schema }, messages: [
        { role: "system", content: RESEARCH_SYSTEM_PROMPT },
        { role: "user", content: payload },
      ] }),
    });
    if (!response.ok) return unavailable(response.status === 429 ? "Cloudflare-Kontingent oder Rate-Limit erreicht. Die regelbasierte Auswertung bleibt verfügbar." : `Cloudflare derzeit nicht verfügbar (HTTP ${response.status}). Die regelbasierte Auswertung bleibt verfügbar.`);
    stage = "CLOUDFLARE_RESPONSE_JSON";
    const body = await response.json();
    if (body.success !== true) return unavailable("Cloudflare konnte keine vollständige KI-Antwort liefern.");
    const raw = body.result?.response;
    let content: unknown;
    try { content = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { content = null; }
    stage = "ANSWER_VALIDATION";
    const issues = inspectSynthesis(content, evidence);
    if (issues.length) {
      const candidate = content && typeof content === "object" ? content as Record<string, unknown> : {};
      const rejectedConditions = (Array.isArray(candidate.flows) ? candidate.flows : []).slice(0,3)
        .filter((flow): flow is Record<string, unknown> => Boolean(flow && typeof flow === "object" && !Array.isArray(flow)))
        .map(flow => ({ instrument: text(flow.instrument,40), confirmation: text(flow.confirmation,1200), invalidation: text(flow.invalidation,1200) }));
      const conditionFailure = issues.every(issue => /UNOBSERVABLE_(CONFIRMATION|INVALIDATION)$/.test(issue));
      const rejected: ResearchSynthesis = { ...unavailable(conditionFailure
        ? "Die KI hat geantwortet, aber ihre Bestätigungs- oder Widerlegungsbedingungen sind nicht eindeutig prüfbar. Deshalb wird keine Einstiegsaussage angezeigt."
        : "KI-Antwort unvollständig oder widersprüchlich: keine KI-Einstiegsaussage übernommen. Die App-Auswertung bleibt verfügbar."),
        quality: { ...quality, issues, rejectedConditions } };
      // Cache rejected answers too; refreshing must not burn quota on the same frame.
      stage = "REJECTED_ANSWER_CACHE_WRITE";
      await storeRejectedDiagnosis(rejected);
      await redis.set(cacheKey, rejected, { ex: 900 });
      return rejected;
    }
    const result: ResearchSynthesis = { status: "SUCCESS", model: MODEL, generatedAt: new Date().toISOString(), snapshotTimestamp, cached: false, message: "Unabhängige KI-Interpretation; Bedingungen und Belegverweise geprüft, wirtschaftliche Richtigkeit nicht bewiesen.", content: content as ResearchSynthesisContent, quality };
    stage = "APPROVED_ANSWER_CACHE_WRITE";
    await redis.set(cacheKey, result, { ex: 900 });
    return result;
  } catch (error) {
    // Do not expose exception messages: providers may include request URLs or credentials.
    const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
    const timeout = name === "TimeoutError" || name === "AbortError";
    const messages: Record<string, string> = {
      CACHE_READ: "Der Research-Zwischenspeicher konnte nicht gelesen werden. Keine neue KI-Anfrage ausgelöst.",
      DIAGNOSTIC_READ: "Die gespeicherte Ablehnungsdiagnose konnte nicht gelesen werden. Keine neue KI-Anfrage ausgelöst.",
      LOCK_ACQUIRE: "Der KI-Aufrufschutz konnte nicht aktiviert werden. Keine neue KI-Anfrage ausgelöst.",
      CACHE_RECHECK: "Der Research-Zwischenspeicher ist bei der erneuten Prüfung ausgefallen. Keine neue KI-Anfrage ausgelöst.",
      QUOTA_CHECK: "Das KI-Tageskontingent konnte nicht geprüft werden. Keine neue KI-Anfrage ausgelöst.",
      CLOUDFLARE_REQUEST: timeout ? "Cloudflare hat innerhalb von 35 Sekunden nicht geantwortet." : "Die Verbindung zu Cloudflare ist fehlgeschlagen.",
      CLOUDFLARE_RESPONSE_JSON: "Cloudflare hat geantwortet, aber die Antwort konnte nicht als JSON gelesen werden.",
      ANSWER_VALIDATION: "Bei der Prüfung der KI-Antwort ist ein interner Verarbeitungsfehler aufgetreten.",
      REJECTED_ANSWER_CACHE_WRITE: "Die KI-Antwort wurde abgelehnt; ihre Diagnose konnte nicht zwischengespeichert werden.",
      APPROVED_ANSWER_CACHE_WRITE: "Eine geprüfte KI-Antwort lag vor, konnte aber nicht zwischengespeichert werden."
    };
    return { ...unavailable(messages[stage] ?? "Research-Verarbeitung fehlgeschlagen."), quality: {
      ...quality, issues: [`FAILURE_STAGE:${stage}`, `PROVIDER_REQUEST_STARTED:${providerRequestStarted}`, `ERROR_CLASS:${timeout ? "TIMEOUT" : "UNCLASSIFIED"}`]
    } };
  }
  finally {
    if (locked) try { await redis.eval("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0", [lockKey], [lockToken]); } catch { /* Lock expires automatically. */ }
  }
}
