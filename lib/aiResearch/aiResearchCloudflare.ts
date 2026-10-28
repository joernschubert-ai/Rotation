import {prepareSourceReview,evaluateSourceReview,recheckSourceReview} from './aiResearchSourceReview';
import {SOURCE_REVIEW_PROMPT} from './aiResearchSourceReviewPrompt';
import { RESEARCH_MODEL, RESEARCH_TRANSPORT_PROFILE, researchTransport } from './aiResearchModel';
import { buildResearchConcepts, CONCEPT_VERSION, type ResearchConcepts } from "./aiResearchConcepts";
import { freezeRequest, saveFrozenRequest } from "./aiResearchComparison";
import { auditNarrative } from "./aiResearchNarrativeAudit";
import { buildNarrativePayload } from "./aiResearchNarrativePayload";
import { buildNarrativeFacts } from "./aiResearchNarrativeFacts";
import { APP_FACTS_POLICY } from "./aiResearchAppFacts";
import { NARRATIVE_PROMPT, narrativeFromProvider, hasNarrative } from './aiResearchNarrative';
import { buildScenarioStates, type ScenarioReview } from "./aiResearchScenarioState";
import type { COTExpertReport } from "./aiResearchCOTExpert";
import { buildStructuredInput, STRUCTURED_PROMPT, structuredResponseFormat, structuredToNamedFields, attachStructuredReferences } from "./aiResearchStructured";
import { buildInstrumentPriceReferences } from "./aiResearchPriceReferences";
import { buildWeightingContexts, type WeightingContext } from "./aiResearchWeighting";
import { reviewInstrumentFlows, contentForFlows, describeProviderResponse } from "./aiResearchLiveQwen";
import { buildCompactResearchInput } from "./aiResearchReasoningFrame";
import { createHash, randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { AIResearchInput, AIResearchReport } from "./aiResearchTypes";
import type { ResearchSynthesis, ResearchSynthesisContent } from "./aiResearchSynthesisTypes";

import { buildSynthesisEvidence } from "./aiResearchSynthesisEvidence";
import { inspectSynthesis, validateSynthesis, deriveSynthesisConclusion, normalizeSynthesisEnvelope, SYNTHESIS_CONTRACT } from "./aiResearchLiveQwen";
import { buildLiveInput, LIVE_RESEARCH_PROMPT as RESEARCH_SYSTEM_PROMPT } from "./aiResearchLiveQwen";
import { buildInstrumentBriefs } from "./aiResearchInstrumentBriefs";
export { buildSynthesisEvidence } from "./aiResearchSynthesisEvidence";
export { validateSynthesis } from "./aiResearchLiveQwen";

const MODEL = RESEARCH_MODEL;
// Isolate the sampling comparison from prompts, schema, specialist and quota policy.
export const SYNTHESIS_GENERATION_PROFILE = { id: "V79_3_GEMMA_SOURCE_REVIEW_07", temperature: 0.7, maxTokens: 2200 } as const;
const PREFIX = "rotation:research:cf:v1";
// Keep the quota namespace unchanged so the deployment cannot reset daily limits.
const DAILY_LIMIT = 20;
const text = (value: unknown, limit = 650): string => typeof value === "string" ? value.slice(0, limit) : "";

async function synthesizeCurrentResearch(input: AIResearchInput, report: AIResearchReport, allowGeneration = false,
  execution: { requestStartedAt?: number; deadlineAt?: number; preparationMs?: number } = {}): Promise<ResearchSynthesis> {
  const synthesisStartedAt = Date.now();
  // Reserve five seconds for validation, storage and returning the response.
  // The dashboard route keeps its existing 60-second limit.
  const deadlineAt = execution.deadlineAt ?? synthesisStartedAt + 50000;
  let providerStartedAt: number | null = null;
  let providerFinishedAt: number | null = null;
  let providerTimeoutMs = 0;
  const snapshotTimestamp = text(input.snapshot?.timestamp, 40);
  let weightingContexts:WeightingContext[]=[];
  let cotAnalysis:COTExpertReport|undefined;
  let domainConcepts:ResearchConcepts|undefined;
  let modelRequestsUsed=0;
  let indexScenarios:Record<string,ScenarioReview>|undefined;
  let priceReferences:ReturnType<typeof buildInstrumentPriceReferences>=[];
  const cotDataQuality=input.positioning?.dataQuality;
  const unavailable = (message: string): ResearchSynthesis => ({ status: "UNAVAILABLE", model: MODEL, snapshotTimestamp, cached: false, message, weightingContexts, priceReferences, cotDataQuality, cotAnalysis, domainConcepts, modelRequestsUsed, indexScenarios });
  if(report.appFacts?.version!==APP_FACTS_POLICY)return unavailable("Verbindliche App-Fakten fehlen; keine neue KI-Anfrage ausgelöst.");
  if(report.appFacts.snapshotTimestamp!==snapshotTimestamp)return unavailable('App-Fakten und Snapshot gehören nicht zum selben Stand. Keine neue KI-Anfrage ausgelöst.');
  priceReferences=buildInstrumentPriceReferences(buildSynthesisEvidence(input,report),snapshotTimestamp);
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account || !/^[a-f0-9]{32}$/i.test(account)) return unavailable("Cloudflare ist noch nicht vollständig eingerichtet. Die regelbasierte Auswertung bleibt verfügbar.");
  const age = Date.now() - Date.parse(snapshotTimestamp);
  if (!Number.isFinite(age) || age < 0 || age > 86400000) return unavailable("Der Snapshot ist nicht aktuell genug für eine neue KI-Einschätzung.");
  const evidence = buildSynthesisEvidence(input, report);
  const briefs = buildInstrumentBriefs(evidence);
  weightingContexts=buildWeightingContexts(evidence,snapshotTimestamp);

  const quality = { normalizations:["GENERATION_PROFILE:"+SYNTHESIS_GENERATION_PROFILE.id,"TRANSPORT_PROFILE:"+RESEARCH_TRANSPORT_PROFILE], contractVersion: SYNTHESIS_CONTRACT, issues: [] as string[], instrumentBriefs: briefs, availableEvidenceIds: evidence.filter(item => item.available).map(item => item.id),
    missingOwnPriceMarkets: evidence.filter(item => item.kind === "PRICE" && item.entryDataReady !== true).map(item => item.market ?? item.id), semanticTruthVerified: false as const,
    inputSummary: {
      prices: evidence.filter(item => item.kind === "PRICE").map(item => ({ market: item.market ?? item.id, current: item.data.current as number | null, momentum5D: item.data.momentum5D as number | null,
        momentum20D: item.data.momentum20D as number | null, quoteTimestamp: item.data.quoteTimestamp as string | null, entryDataReady: item.entryDataReady === true })),
      cotReportDates: [...new Set(evidence.filter(item => item.kind === "COT").flatMap(item => (item.data.summaries as Array<{ reportDate?: string }>).map(summary => summary.reportDate ?? "")).filter(Boolean))],
      historicalAsOf: report.historicalEvidence?.asOfDate ?? null, newsCount: evidence.filter(item => item.kind === "NEWS").length,
    } };
  const structuredInput=buildNarrativeFacts(evidence);
  domainConcepts=buildResearchConcepts(structuredInput);
  let sourceRequest:ReturnType<typeof prepareSourceReview>;
  try{sourceRequest=prepareSourceReview(report.appFacts,input.context.task,text(input.context.question,500));}catch{return unavailable('Die App-Belege können nicht vollständig aufbereitet werden oder überschreiten die Eingabegrenze. Keine KI-Anfrage ausgelöst.');}
  const identity = JSON.stringify({model:MODEL,transportProfile:RESEARCH_TRANSPORT_PROFILE,generationProfile:SYNTHESIS_GENERATION_PROFILE,prompt:SOURCE_REVIEW_PROMPT,domainVersion:CONCEPT_VERSION,contractVersion:SYNTHESIS_CONTRACT,snapshotTimestamp,task:input.context.task,
    question:text(input.context.question,500),appFactsPolicy:APP_FACTS_POLICY,appFacts:report.appFacts??null,...structuredInput});
  let payload=sourceRequest.payload;
  const withTiming = (value: ResearchSynthesis): ResearchSynthesis => ({ ...value, weightingContexts, priceReferences, cotDataQuality, cotAnalysis, domainConcepts, modelRequestsUsed, indexScenarios:indexScenarios??value.indexScenarios, quality: {
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
  const cacheKey = `${PREFIX}:cache:${SYNTHESIS_CONTRACT}:cot-horizons-v1:${createHash("sha256").update(identity).digest("hex")}`;
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
    // V49: COT semantics come from deterministic source facts, no specialist inference.
    await saveFrozenRequest(redis,freezeRequest(snapshotTimestamp,SOURCE_REVIEW_PROMPT,sourceRequest.payload,SYNTHESIS_GENERATION_PROFILE.temperature,SYNTHESIS_GENERATION_PROFILE.maxTokens));
    const cached = await redis.get<ResearchSynthesis>(cacheKey);
    if (cached?.model === MODEL && cached.snapshotTimestamp === snapshotTimestamp && cached.quality?.contractVersion === SYNTHESIS_CONTRACT) {
      if (cached.sourceReview) {const sourceReview=recheckSourceReview(cached.sourceReview,report.appFacts);if(!sourceReview)return unavailable('Der gespeicherte Quellenbericht gehört zu einem anderen Faktenbestand. Keine Anfrage ausgelöst.');if(sourceReview.status==='VALID_SELECTION'||!allowGeneration)return {...cached,status:sourceReview.status==='VALID_SELECTION'?'SUCCESS':'UNAVAILABLE',sourceReview,message:sourceReview.status==='PARTIAL_SELECTION'?'Quellenwahl teilweise übernommen. Ungültige Instrumentteile bleiben zurückgehalten; Originalantwort unverändert.':cached.message,narrative:undefined,content:undefined,cached:true,weightingContexts,priceReferences,cotDataQuality,cotAnalysis,domainConcepts,modelRequestsUsed};}
      if (!allowGeneration && cached.status === "UNAVAILABLE" && cached.quality.issues.length) {
        if (allowGeneration) await storeRejectedDiagnosis(cached);
        return { ...cached, cached: true, weightingContexts, priceReferences, cotDataQuality, cotAnalysis, domainConcepts, modelRequestsUsed };
      }
    }
    if (!allowGeneration) {
      stage = "DIAGNOSTIC_READ";
      const rejected = await redis.get<ResearchSynthesis>(diagnosticKey);
      if (rejected?.status === "UNAVAILABLE" && rejected.snapshotTimestamp === snapshotTimestamp &&
        rejected.quality?.contractVersion === SYNTHESIS_CONTRACT && rejected.quality.issues?.length) {
        if(rejected.sourceReview){const sourceReview=recheckSourceReview(rejected.sourceReview,report.appFacts);if(!sourceReview)return unavailable('Die gespeicherte Diagnose gehört zu einem anderen Faktenbestand. Keine neue Anfrage ausgelöst.');return {...rejected,sourceReview,cached:true,weightingContexts,priceReferences,cotDataQuality,cotAnalysis,domainConcepts,modelRequestsUsed};}
        return { ...rejected, cached: true, weightingContexts, priceReferences, cotDataQuality, cotAnalysis, domainConcepts, modelRequestsUsed };
      }
      return unavailable("Noch keine KI-Analyse für diesen Snapshot gespeichert. In der App Research aktualisieren.");
    }
    stage = "LOCK_ACQUIRE";
    locked = Boolean(await redis.set(lockKey, lockToken, { nx: true, ex: 60 }));
    if (!locked) return unavailable("Eine KI-Analyse läuft bereits. Bitte kurz warten.");
    stage = "CACHE_RECHECK";
    const completed = await redis.get<ResearchSynthesis>(cacheKey);
    if (completed?.model === MODEL && completed.snapshotTimestamp === snapshotTimestamp && completed.quality?.contractVersion === SYNTHESIS_CONTRACT) {
      if (completed.sourceReview) {const sourceReview=recheckSourceReview(completed.sourceReview,report.appFacts);if(!sourceReview)return unavailable('Der gespeicherte Quellenbericht gehört zu einem anderen Faktenbestand. Keine Anfrage ausgelöst.');if(sourceReview.status==='VALID_SELECTION'||!allowGeneration)return {...completed,status:sourceReview.status==='VALID_SELECTION'?'SUCCESS':'UNAVAILABLE',sourceReview,message:sourceReview.status==='PARTIAL_SELECTION'?'Quellenwahl teilweise übernommen. Ungültige Instrumentteile bleiben zurückgehalten; Originalantwort unverändert.':completed.message,narrative:undefined,content:undefined,cached:true,weightingContexts,priceReferences,cotDataQuality,cotAnalysis,domainConcepts,modelRequestsUsed};}
      if (!allowGeneration && completed.status === "UNAVAILABLE" && completed.quality.issues.length) {
        await storeRejectedDiagnosis(completed);
        return { ...completed, cached: true, weightingContexts, priceReferences, cotDataQuality, cotAnalysis, domainConcepts, modelRequestsUsed };
      }
    }
    // Reject an exhausted budget before quota admission, without consuming an attempt.
    if (deadlineAt - Date.now() - 5000 < 5000) {
      const failure = withTiming({ ...unavailable("Die Datenaufbereitung hat das verfügbare Zeitfenster verbraucht. Keine KI-Anfrage ausgelöst."),
        quality: { ...quality, issues: ["FAILURE_STAGE:TIME_BUDGET", "PROVIDER_REQUEST_STARTED:false"] } });
      await storeRejectedDiagnosis(failure);
      return failure;
    }
    payload=sourceRequest.payload;
    if(payload.length>26000)return withTiming(unavailable('Das vollständige Synthesepaket überschreitet die Eingabegrenze. Keine neue Modellanfrage gestartet.'));
    // Atomic daily admission AND cooldown. Attempts count, including provider failures.

    const dayKey = `${PREFIX}:day:${new Date().toISOString().slice(0, 10)}`;
    stage = "QUOTA_CHECK";
    const admitted = await redis.eval<[number], number>(
      "if redis.call('EXISTS',KEYS[2])==1 then return -1 end local n=tonumber(redis.call('GET',KEYS[1]) or '0') if n>=tonumber(ARGV[1]) then return -2 end redis.call('INCR',KEYS[1]) redis.call('EXPIRE',KEYS[1],172800) redis.call('SET',KEYS[2],'1','EX',90) return n+1",
      [dayKey, `${PREFIX}:cooldown`], [DAILY_LIMIT]);
    if (admitted === -1) return unavailable("Aufrufpause aktiv. Eine neue KI-Analyse ist nach 90 Sekunden möglich.");
    if (admitted < 0) return unavailable("Das App-Tageslimit von 20 KI-Versuchen ist erreicht. Freigabe wieder ab 00:00 UTC.");
    // The single admission covers the main synthesis. Domain interpretation needs no model call.
    await saveFrozenRequest(redis,freezeRequest(snapshotTimestamp,SOURCE_REVIEW_PROMPT,payload,SYNTHESIS_GENERATION_PROFILE.temperature,SYNTHESIS_GENERATION_PROFILE.maxTokens));
    providerTimeoutMs = Math.min(45000, Math.max(0, Math.floor(deadlineAt - Date.now() - 5000)));
    if (providerTimeoutMs < 5000) {
      const failure = withTiming({ ...unavailable("Die Datenaufbereitung hat das verfügbare Zeitfenster verbraucht. Keine KI-Anfrage ausgelöst."),
        quality: { ...quality, issues: ["FAILURE_STAGE:TIME_BUDGET", "PROVIDER_REQUEST_STARTED:false"] } });
      await storeRejectedDiagnosis(failure);
      return failure;
    }
    stage = "CLOUDFLARE_REQUEST";
    providerRequestStarted = true;modelRequestsUsed++;
    providerStartedAt = Date.now();
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${MODEL}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, cache: "no-store", signal: AbortSignal.timeout(providerTimeoutMs),
      body: JSON.stringify(researchTransport({ max_tokens: SYNTHESIS_GENERATION_PROFILE.maxTokens, temperature: SYNTHESIS_GENERATION_PROFILE.temperature, messages: [
        { role: "system", content: SOURCE_REVIEW_PROMPT },
        { role: "user", content: payload },
      ] })),
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
    const raw = body.result?.choices?.[0]?.message?.content ?? body.result?.response;
    const providerDiagnostics=describeProviderResponse(body);
    stage='ANSWER_VALIDATION';
    const sourceReview=evaluateSourceReview(raw,providerDiagnostics.finishReason,report.appFacts);
    const accepted=sourceReview.status==='VALID_SELECTION';
    const result:ResearchSynthesis={status:accepted?'SUCCESS':'UNAVAILABLE',model:MODEL,generatedAt:new Date().toISOString(),snapshotTimestamp,cached:false,
      message:accepted?'Quellenwahl geprüft. Sachliche Zustandsbeschreibung aus App-Daten; KI-Abwägung bleibt ungeprüft. Keine zusätzliche Einstiegsfreigabe.':sourceReview.status==='PARTIAL_SELECTION'?'Quellenwahl teilweise übernommen. Ungültige Instrumentteile bleiben zurückgehalten; App-Fakten und unveränderte Originalantwort bleiben sichtbar. Keine automatische Wiederholung.':'Die Quellenantwort ist unvollständig oder ungültig. App-Fakten bleiben verfügbar; keine automatische Wiederholung.',
      sourceReview,quality:{...quality,providerDiagnostics,providerText:typeof raw==='string'?raw:undefined,
       issues:accepted?[]:[...sourceReview.validation.issues.map(i=>i.code),...(sourceReview.status==='OUTPUT_INCOMPLETE'?['PROVIDER_OUTPUT_LIMIT_REACHED']:[])],
       normalizations:[...quality.normalizations,'APP_DERIVED_STATE_AND_SOURCE_FRAGMENTS','UNMODIFIED_HYPOTHESIS_UNVERIFIED']}};
    stage=accepted?'APPROVED_ANSWER_CACHE_WRITE':'REJECTED_ANSWER_CACHE_WRITE';
    const diagnosed=withTiming(result);
    if(!accepted)await storeRejectedDiagnosis(diagnosed);
    await redis.set(cacheKey,diagnosed,{ex:900});
    return diagnosed;
  } catch (error) {
    // Do not expose exception messages: providers may include request URLs or credentials.
    const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
    const timeout = name === "TimeoutError" || name === "AbortError";
    const messages: Record<string, string> = {
      COT_AI_REQUEST: "Die getrennte COT-Fachanalyse konnte nicht vollständig geladen oder geprüft werden. Keine automatische Wiederholung und keine Gesamtsynthese gestartet.",
      COT_AI_CACHE_WRITE: "COT-Fachanalyse lag vor, konnte aber nicht gespeichert werden. Keine Gesamtsynthese gestartet.",
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

/** Persist the last successful result separately; failures never overwrite it. */
export async function synthesizeResearch(input:AIResearchInput,report:AIResearchReport,allowGeneration=false,
 execution:{requestStartedAt?:number;deadlineAt?:number;preparationMs?:number}={}):Promise<ResearchSynthesis>{
 const result=await synthesizeCurrentResearch(input,report,allowGeneration,execution);
 const key=PREFIX+':last-success:v27:'+input.context.task;
 async function bounded<T>(promise:Promise<T>):Promise<T>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Last report store timeout')),800);})]);}
  finally{if(timer)clearTimeout(timer);}
 };
 try{
  const redis=Redis.fromEnv();
  if(result.status==='SUCCESS'&&!result.narrative?.truncated&&(result.sourceReview?.status==='VALID_SELECTION'||result.content||hasNarrative(result.narrative))){
   const previousSuccessful={snapshotTimestamp:result.snapshotTimestamp,generatedAt:result.generatedAt,model:result.model,sourceReview:result.sourceReview,content:result.content,narrative:result.narrative};
   await bounded(redis.eval<string[],number>(
    "-- LAST_SUCCESS_V27\nlocal prev=redis.call('GET',KEYS[1]) if prev then local ok,v=pcall(cjson.decode,prev) if ok and type(v)=='table' and tonumber(v.snapshotTime or '0')>tonumber(ARGV[2]) then return 0 end end redis.call('SET',KEYS[1],ARGV[1],'EX',2592000) return 1",
    [key],[JSON.stringify({...previousSuccessful,snapshotTime:Date.parse(result.snapshotTimestamp)}),String(Date.parse(result.snapshotTimestamp))]));
  }else{
   const previous=await bounded(redis.get<ResearchSynthesis['previousSuccessful']>(key));
   if(previous&&typeof previous.snapshotTimestamp==='string'&&(previous.sourceReview?.status==='VALID_SELECTION'||(Array.isArray(previous.content?.flows)&&previous.content.flows.length)||hasNarrative(previous.narrative))&&Date.parse(previous.snapshotTimestamp)<=Date.now())result.previousSuccessful=previous;
  }
 }catch{/* Optional last-report preservation does not trigger model calls or suppress the current result. */}
 return result;
}










