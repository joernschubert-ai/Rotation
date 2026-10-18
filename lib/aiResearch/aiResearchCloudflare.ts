import { CHECK_CONTRACT, CHECK_PROMPT, CHECK_SCHEMA, buildComprehensionCheck, gradeComprehensionCheck } from "./aiResearchComprehensionCheck";
import { buildCompactResearchInput } from "./aiResearchReasoningFrame";
import { createHash, randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { AIResearchInput, AIResearchReport } from "./aiResearchTypes";
import type { ResearchSynthesis, ResearchSynthesisContent } from "./aiResearchSynthesisTypes";

import { buildSynthesisEvidence } from "./aiResearchSynthesisEvidence";
import { inspectSynthesis, validateSynthesis, deriveSynthesisConclusion, normalizeSynthesisEnvelope, SYNTHESIS_CONTRACT as PRODUCTION_CONTRACT } from "./aiResearchSynthesisValidation";
import { buildSynthesisSchema, RESEARCH_SYSTEM_PROMPT } from "./aiResearchSynthesisContract";
import { buildInstrumentBriefs } from "./aiResearchInstrumentBriefs";
export { buildSynthesisEvidence } from "./aiResearchSynthesisEvidence";
export { validateSynthesis } from "./aiResearchSynthesisValidation";

const SYNTHESIS_CONTRACT = CHECK_CONTRACT;
const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const PREFIX = "rotation:research:cf:v1";
// Keep the quota namespace unchanged so the deployment cannot reset daily limits.
const DAILY_LIMIT = 20;
const text = (value: unknown, limit = 650): string => typeof value === "string" ? value.slice(0, limit) : "";

export async function synthesizeResearch(input: AIResearchInput, report: AIResearchReport, allowGeneration = false,
  execution: { requestStartedAt?: number; deadlineAt?: number; preparationMs?: number } = {}): Promise<ResearchSynthesis> {
  const synthesisStartedAt = Date.now();
  // Reserve five seconds for validation, storage and returning the response.
  // The dashboard route keeps its existing 60-second limit.
  const deadlineAt = execution.deadlineAt ?? synthesisStartedAt + 50000;
  let providerStartedAt: number | null = null;
  let providerFinishedAt: number | null = null;
  let providerTimeoutMs = 0;
  const snapshotTimestamp = text(input.snapshot?.timestamp, 40);
  const unavailable = (message: string): ResearchSynthesis => ({ status: "UNAVAILABLE", model: MODEL, snapshotTimestamp, cached: false, message });
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account || !/^[a-f0-9]{32}$/i.test(account)) return unavailable("Cloudflare ist noch nicht vollständig eingerichtet. Die regelbasierte Auswertung bleibt verfügbar.");
  const age = Date.now() - Date.parse(snapshotTimestamp);
  if (!Number.isFinite(age) || age < 0 || age > 86400000) return unavailable("Der Snapshot ist nicht aktuell genug für eine neue KI-Einschätzung.");
  const evidence = buildSynthesisEvidence(input, report);
  const briefs = buildInstrumentBriefs(evidence);
  const responseSchema = CHECK_SCHEMA;
  const quality = { contractVersion: SYNTHESIS_CONTRACT, issues: [] as string[], instrumentBriefs: briefs, availableEvidenceIds: evidence.filter(item => item.available).map(item => item.id),
    missingOwnPriceMarkets: evidence.filter(item => item.kind === "PRICE" && item.entryDataReady !== true).map(item => item.market ?? item.id), semanticTruthVerified: false as const,
    inputSummary: {
      prices: evidence.filter(item => item.kind === "PRICE").map(item => ({ market: item.market ?? item.id, current: item.data.current as number | null, momentum5D: item.data.momentum5D as number | null,
        momentum20D: item.data.momentum20D as number | null, quoteTimestamp: item.data.quoteTimestamp as string | null, entryDataReady: item.entryDataReady === true })),
      cotReportDates: [...new Set(evidence.filter(item => item.kind === "COT").flatMap(item => (item.data.summaries as Array<{ reportDate?: string }>).map(summary => summary.reportDate ?? "")).filter(Boolean))],
      historicalAsOf: report.historicalEvidence?.asOfDate ?? null, newsCount: evidence.filter(item => item.kind === "NEWS").length,
    } };
  const payload = JSON.stringify(buildComprehensionCheck(evidence));
  const withTiming = (value: ResearchSynthesis): ResearchSynthesis => ({ ...value, quality: {
    ...(value.quality ?? quality), timing: {
      preparationMs: execution.preparationMs ?? null,
      synthesisMs: Date.now() - synthesisStartedAt,
      providerMs: providerStartedAt === null ? null : (providerFinishedAt ?? Date.now()) - providerStartedAt,
      providerTimeoutMs, inputCharacters: payload.length,
      requestElapsedMs: execution.requestStartedAt === undefined ? null : Date.now() - execution.requestStartedAt,
    }
  } });
  if (payload.length > 26000) return unavailable("Die Belege überschreiten die festgelegte Eingabegrenze. Keine KI-Anfrage ausgelöst.");
  // Response diagnostics changed; do not reuse a rejection whose wording was discarded.
  // Daily quota, cooldown and lock namespaces deliberately remain unchanged.
  const cacheKey = `${PREFIX}:cache:${SYNTHESIS_CONTRACT}:cot-horizons-v1:${createHash("sha256").update(payload).digest("hex")}`;
  // Rejected text is diagnostic only. Keep it addressable even if news/context
  // change between the POST and a later GET for the identical snapshot/task/question.
  const diagnosticKey = `${PREFIX}:rejected:${SYNTHESIS_CONTRACT}:cot-horizons-v1:${createHash("sha256").update(JSON.stringify({
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
    if(cached?.quality?.contractVersion===CHECK_CONTRACT&&cached.snapshotTimestamp===snapshotTimestamp) return {...cached,snapshotTimestamp,cached:true};
    if (cached?.snapshotTimestamp === snapshotTimestamp && cached.quality?.contractVersion === SYNTHESIS_CONTRACT) {
      if (cached.status === "SUCCESS" && validateSynthesis(cached.content, evidence)) return { ...cached, cached: true };
      if (!allowGeneration && cached.status === "UNAVAILABLE" && cached.quality.issues.length) {
        if (allowGeneration) await storeRejectedDiagnosis(cached);
        return { ...cached, cached: true };
      }
    }
    if (!allowGeneration) {
      stage = "DIAGNOSTIC_READ";
      const rejected = await redis.get<ResearchSynthesis>(diagnosticKey);
      if (rejected?.status === "UNAVAILABLE" && rejected.snapshotTimestamp === snapshotTimestamp &&
        rejected.quality?.contractVersion === SYNTHESIS_CONTRACT && rejected.quality.issues?.length) {
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
      if (!allowGeneration && completed.status === "UNAVAILABLE" && completed.quality.issues.length) {
        await storeRejectedDiagnosis(completed);
        return { ...completed, cached: true };
      }
    }
    // Reject an exhausted budget before quota admission, without consuming an attempt.
    if (deadlineAt - Date.now() - 5000 < 5000) {
      const failure = withTiming({ ...unavailable("Die Datenaufbereitung hat das verfügbare Zeitfenster verbraucht. Keine KI-Anfrage ausgelöst."),
        quality: { ...quality, issues: ["FAILURE_STAGE:TIME_BUDGET", "PROVIDER_REQUEST_STARTED:false"] } });
      await storeRejectedDiagnosis(failure);
      return failure;
    }
    // Atomic daily admission AND cooldown. Attempts count, including provider failures.
    const dayKey = `${PREFIX}:day:${new Date().toISOString().slice(0, 10)}`;
    stage = "QUOTA_CHECK";
    const admitted = await redis.eval<[number], number>(
      "if redis.call('EXISTS',KEYS[2])==1 then return -1 end local n=tonumber(redis.call('GET',KEYS[1]) or '0') if n>=tonumber(ARGV[1]) then return -2 end redis.call('INCR',KEYS[1]) redis.call('EXPIRE',KEYS[1],172800) redis.call('SET',KEYS[2],'1','EX',90) return n+1",
      [dayKey, `${PREFIX}:cooldown`], [DAILY_LIMIT]);
    if (admitted === -1) return unavailable("Aufrufpause aktiv. Eine neue KI-Analyse ist nach 90 Sekunden möglich.");
    if (admitted < 0) return unavailable("Das App-Tageslimit von 20 KI-Versuchen ist erreicht. Freigabe wieder ab 00:00 UTC.");
    providerTimeoutMs = Math.min(45000, Math.max(0, Math.floor(deadlineAt - Date.now() - 5000)));
    if (providerTimeoutMs < 5000) {
      const failure = withTiming({ ...unavailable("Die Datenaufbereitung hat das verfügbare Zeitfenster verbraucht. Keine KI-Anfrage ausgelöst."),
        quality: { ...quality, issues: ["FAILURE_STAGE:TIME_BUDGET", "PROVIDER_REQUEST_STARTED:false"] } });
      await storeRejectedDiagnosis(failure);
      return failure;
    }
    stage = "CLOUDFLARE_REQUEST";
    providerRequestStarted = true;
    providerStartedAt = Date.now();
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${MODEL}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, cache: "no-store", signal: AbortSignal.timeout(providerTimeoutMs),
      body: JSON.stringify({ max_tokens: 1800, temperature: 0.2, messages: [
        { role: "system", content: CHECK_PROMPT },
        { role: "user", content: payload },
      ] }),
    });
    if (!response.ok) {
      let jsonModeFailure = false;
      const errorCodes: string[] = [];
      try {
        const failure = await response.json();
        for (const item of Array.isArray(failure?.errors) ? failure.errors.slice(0,5) : []) {
          const code = String(item?.code ?? "");
          if (/^\d{1,8}$/.test(code)) errorCodes.push(code);
          if (typeof item?.message === "string" && /json\s*mode.*(?:couldn.?t|cannot|could not|failed|not.*met)|schema.*(?:invalid|unsupported|failed)/i.test(item.message)) jsonModeFailure = true;
        }
      } catch { /* An HTTP error need not have a JSON response. */ }
      const failure: ResearchSynthesis = { ...unavailable(response.status === 429
        ? "Cloudflare-Kontingent oder Rate-Limit erreicht. Die regelbasierte Auswertung bleibt verfügbar."
        : jsonModeFailure ? `Cloudflare konnte die verlangte JSON-Ausgabe nicht erfüllen (HTTP ${response.status}).`
        : `Cloudflare hat die Anfrage zurückgewiesen (HTTP ${response.status}). Die genaue Ursache ist noch offen.`),
        quality: { ...quality, issues: [`PROVIDER_HTTP:${response.status}`,
          ...(jsonModeFailure ? ["PROVIDER_CATEGORY:JSON_MODE_OR_SCHEMA"] : []),
          ...errorCodes.map(code=>`PROVIDER_CODE:${code}`), `INPUT_CHARACTERS:${payload.length}`] }
      };
      providerFinishedAt = Date.now();
      const diagnosed = withTiming(failure);
      await storeRejectedDiagnosis(diagnosed);
      return diagnosed;
    }
    stage = "CLOUDFLARE_RESPONSE_JSON";
    const body = await response.json();
    providerFinishedAt = Date.now();
    if (body.success !== true) return unavailable("Cloudflare konnte keine vollständige KI-Antwort liefern.");
    const raw = body.result?.response;
    let content: unknown;
    try { content = raw; } catch { content = null; }
    const rawObject = content && typeof content === "object" && !Array.isArray(content) ? content as Record<string, unknown> : {};
    const responseShape = { rootKeys: Object.keys(rawObject).slice(0,20).map(key => key.slice(0,80)),
      flowsIsArray: Array.isArray(rawObject.flows), flowCount: Array.isArray(rawObject.flows) ? rawObject.flows.length : null };
    // Temporary diagnostic: never convert this synthetic task into a trade assessment.
    const check = gradeComprehensionCheck(content,evidence);
    const diagnostic: ResearchSynthesis = {
      generatedAt:new Date().toISOString(),
      ...unavailable(check.passed
        ? "Gebündelter Vergleich ohne erzwungenes JSON: Faktenantworten formal korrekt. Die drei freien Instrumentanalysen stehen im vollständigen Bericht zur inhaltlichen Prüfung. Keine KI-Einstiegsfreigabe."
        : "Gebündelter Vergleich ohne erzwungenes JSON: Mindestens eine Faktenantwort oder ein Abschnitt fehlt oder widerspricht den Daten. Freie Antwort im vollständigen Bericht; bitte nicht erneut aktualisieren."),
      quality: {...quality, responseShape, issues: [check.passed ? "DIAGNOSTIC_PASS_NOT_A_MARKET_ANALYSIS" : "DIAGNOSTIC_FAIL",...check.issues],
        rejectedResponse: {summary:"Numerische und sprachliche Fakten sowie drei freie Instrumentanalysen im selben Aufruf",asymmetry:"Nicht untersucht",counterarguments:[],limitations:["Korrekte Faktenantworten und Textlänge beweisen keine gute freie Interpretation oder Prognosequalität."],references:[{
          instrument:"DIAGNOSTIC_ONLY",evidenceRefs:[],confirmationRefs:[],invalidationRefs:[],
          structuredReview:{answers:check.answers,expected:check.expected,passed:check.passed,testContract:CHECK_CONTRACT}}]}}
    };
    const diagnosedCheck=withTiming(diagnostic);
    await storeRejectedDiagnosis(diagnosedCheck);
    await redis.set(cacheKey,diagnosedCheck,{ex:900});
    return diagnosedCheck;
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
      CLOUDFLARE_REQUEST: timeout ? `Cloudflare hat innerhalb des verfügbaren Zeitfensters von ${(providerTimeoutMs / 1000).toFixed(1)} Sekunden nicht geantwortet.` : "Die Verbindung zu Cloudflare ist fehlgeschlagen.",
      CLOUDFLARE_RESPONSE_JSON: "Cloudflare hat geantwortet, aber die Antwort konnte nicht als JSON gelesen werden.",
      ANSWER_VALIDATION: "Bei der Prüfung der KI-Antwort ist ein interner Verarbeitungsfehler aufgetreten.",
      REJECTED_ANSWER_CACHE_WRITE: "Die KI-Antwort wurde abgelehnt; ihre Diagnose konnte nicht zwischengespeichert werden.",
      APPROVED_ANSWER_CACHE_WRITE: "Eine geprüfte KI-Antwort lag vor, konnte aber nicht zwischengespeichert werden."
    };
    const failure = withTiming({ ...unavailable(messages[stage] ?? "Research-Verarbeitung fehlgeschlagen."), quality: {
      ...quality, issues: [`FAILURE_STAGE:${stage}`, `PROVIDER_REQUEST_STARTED:${providerRequestStarted}`, `ERROR_CLASS:${timeout ? "TIMEOUT" : "UNCLASSIFIED"}`]
    } });
    // Preserve timeouts too: a later GET must explain the failed POST.
    // Do not put transient failures into the exact answer cache; a deliberate
    // new POST may retry after the unchanged cooldown, never automatically.
    if (providerRequestStarted) await storeRejectedDiagnosis(failure);
    return failure;
  }
  finally {
    if (locked) try { await redis.eval("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0", [lockKey], [lockToken]); } catch { /* Lock expires automatically. */ }
  }
}
