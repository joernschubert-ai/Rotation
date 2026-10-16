import type { ResearchSynthesisContent } from "./aiResearchSynthesisTypes";
import type { SynthesisEvidence } from "./aiResearchSynthesisEvidence";
import { buildInstrumentBriefs } from "./aiResearchInstrumentBriefs";

export { SYNTHESIS_CONTRACT } from "./aiResearchSynthesisTypes";
export const SYNTHESIS_INSTRUMENTS = ["NASDAQ_PUT", "NASDAQ_CALL", "RUSSELL_CALL"] as const;
export const SYNTHESIS_ACTIONS = ["WATCH", "PREPARE", "STARTER_CANDIDATE", "CONFIRM", "REDUCE"];
export const SYNTHESIS_SLOTS = { nasdaqPut: "NASDAQ_PUT", nasdaqCall: "NASDAQ_CALL", russellCall: "RUSSELL_CALL" } as const;
const object = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const placeholder = /^(?:keine?|kein(?:e|en|er)? (?:bestätigung|widerlegung|bedingung|gegenargumente?)|nicht (?:vorhanden|verfügbar|bekannt)|unbekannt|abwarten|none|unknown|n a|tbd|not available)[.!\s]*$/i;
const useful = (value: unknown, minimum = 25) => typeof value === "string" && value.trim().length >= minimum && value.length <= 1200 && !placeholder.test(value.trim());

/** Convert complete named slots to the existing display format. Never invent a missing slot. */
export function normalizeSynthesisEnvelope(value: unknown): unknown {
  const data = object(value);
  if (!Object.keys(SYNTHESIS_SLOTS).every(key => data[key] && typeof data[key] === "object" && !Array.isArray(data[key]))) return value;
  if ("flows" in data || Object.entries(SYNTHESIS_SLOTS).some(([key,instrument]) =>
    "instrument" in data[key] && data[key].instrument !== instrument)) return value;
  const flows = Object.entries(SYNTHESIS_SLOTS).map(([key,instrument]) => ({ ...data[key], instrument }));
  const { nasdaqPut, nasdaqCall, russellCall, ...rest } = data;
  return { ...rest, flows };
}

export function hasUnsupportedConditionNumber(value: string): boolean {
  // Index identities are not proposed entry thresholds. Fold common decimal
  // scripts so that a real threshold cannot bypass this check with other digits.
  const normalized = value.normalize("NFKC").replace(/[\u0660-\u0669\u06f0-\u06f9]/g, character =>
    String(character.charCodeAt(0) - (character.charCodeAt(0) >= 0x06f0 ? 0x06f0 : 0x0660)));
  const withoutIndexNames = normalized.replace(/\brussell[\s-]*2000\b/gi,"Russell")
    .replace(/\bnasdaq[\s-]*100\b/gi,"Nasdaq");
  return /\p{N}|%|\bprozent(?:punkt)?(?:e|en)?\b/iu.test(withoutIndexNames);
}

/** A display aggregate is deterministic; no trade assessment or prose is repaired. */
export function deriveSynthesisConclusion(value: unknown): { value: unknown; changed: boolean } {
  const data = object(value);
  if (!Array.isArray(data.flows) || data.flows.length !== 3) return {value,changed:false};
  const seen = new Set<string>();
  for (const flow of data.flows) {
    if (!flow || !SYNTHESIS_INSTRUMENTS.includes(flow.instrument) || seen.has(flow.instrument) ||
      !SYNTHESIS_ACTIONS.includes(flow.assessment)) return {value,changed:false};
    seen.add(flow.instrument);
  }
  const conclusion = synthesisConclusion(data.flows);
  return { value: {...data,conclusion}, changed: data.conclusion !== conclusion };
}

export function synthesisConclusion(flows: ResearchSynthesisContent["flows"]): ResearchSynthesisContent["conclusion"] {
  if (flows.some(flow => ["STARTER_CANDIDATE", "CONFIRM"].includes(flow.assessment))) return "CANDIDATES";
  if (flows.some(flow => flow.assessment === "REDUCE")) return "RISK_REVIEW";
  if (flows.some(flow => flow.assessment === "PREPARE")) return "PREPARATION";
  return "WATCH_ONLY";
}

/** Deterministic checks catch known failure modes; they cannot prove economic truth. */
export function inspectSynthesis(value: unknown, evidence: SynthesisEvidence[]): string[] {
  const data = object(value);
  const issues: string[] = [];
  if (Object.keys(SYNTHESIS_SLOTS).some(key => key in data)) issues.push("UNNORMALIZED_OR_AMBIGUOUS_INSTRUMENT_FIELDS");
  const byId = new Map(evidence.map(item => [item.id, item]));
  const briefs = buildInstrumentBriefs(evidence);
  const numbers: number[] = [];
  function collect(value: unknown): void {
    if (typeof value === "number" && Number.isFinite(value)) numbers.push(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  }
  evidence.forEach(item => collect(item.data));
  const refs = (value: unknown): value is string[] => Array.isArray(value) && value.length >= 1 && value.length <= 8 &&
    value.every(id => typeof id === "string" && byId.has(id)) && new Set(value).size === value.length;
  const texts = (value: unknown) => Array.isArray(value) && value.length >= 1 && value.length <= 5 && value.every(item => useful(item));
  if (!useful(data.summary) || !useful(data.asymmetry) || !texts(data.counterarguments) || !texts(data.limitations)) issues.push("MISSING_MEANINGFUL_SUMMARY_OR_LIMITATIONS");
  if (!Array.isArray(data.flows) || data.flows.length !== 3) return [...issues, "THREE_INSTRUMENTS_REQUIRED"];
  const seen = new Set<string>();
  for (const item of data.flows) {
    const flow = object(item);
    const instrument = flow.instrument;
    if (!SYNTHESIS_INSTRUMENTS.includes(instrument) || seen.has(instrument)) { issues.push("INVALID_OR_DUPLICATE_INSTRUMENT"); continue; }
    seen.add(instrument);
    if (!SYNTHESIS_ACTIONS.includes(flow.assessment)) issues.push(`${instrument}:INVALID_ASSESSMENT`);
    for (const key of ["reasoning", "whyNow", "counterargument", "confirmation", "invalidation"]) {
      if (!useful(flow[key])) issues.push(`${instrument}:EMPTY_OR_PLACEHOLDER_${key.toUpperCase()}`);
    }
    for (const key of ["confirmation", "invalidation"]) {
      // This contract accepts qualitative observable triggers. Numeric trade
      // thresholds require a future, explicitly calculated chart-level schema.
      // Matching a number to any sample count or lookback is not a derivation.
      if (typeof flow[key] === "string" && hasUnsupportedConditionNumber(flow[key])) {
        issues.push(`${instrument}:UNSUPPORTED_NUMERIC_${key.toUpperCase()}`);
      }
      if (typeof flow[key] === "string" && (!/nasdaq|russell|kurs|preis|rendit|momentum|teilnahme|partizipation|liquid|rotation|marktbreit|breadth|participation|durchschnitt|ma(?:20|50|200)/i.test(flow[key]) ||
        !/steig|fall|fäll|sink|dreh|erhol|verschlech|stabilis|bestätig|zurück|schwäch|verbess|unter|über|beschleun|zunehm|abnehm|aktuali|vorlieg|verfüg|halt|hält|ausweit|verlier|verliert|brech|brich|rück|korrektur|rally|abgabe|anstieg|ausbruch|scheiter|höher|tiefer|zuleg|gewinnt|nachgibt|nachgeben/i.test(flow[key]))) issues.push(`${instrument}:UNOBSERVABLE_${key.toUpperCase()}`);
    }
    for (const key of ["evidenceRefs", "confirmationRefs", "invalidationRefs"]) {
      if (!refs(flow[key])) issues.push(`${instrument}:INVALID_${key.toUpperCase()}`);
    }
    const brief = briefs.find(item => item.instrument === instrument);
    const selectedHistory = brief?.histories.find(study => study.id === flow.historyStudyId);
    if (brief?.histories.length) {
      if (!selectedHistory) issues.push(`${instrument}:OWN_HISTORICAL_STUDY_REQUIRED`);
      else if (!refs(flow.evidenceRefs) || !flow.evidenceRefs.includes(selectedHistory.sourceRef)) issues.push(`${instrument}:SELECTED_HISTORY_REFERENCE_REQUIRED`);
      if (typeof flow.reasoning !== "string" || !/histor|vergleich|median|mittel|durchschnitt|folgerendit/i.test(flow.reasoning)) issues.push(`${instrument}:HISTORICAL_INTERPRETATION_REQUIRED`);
    } else if (flow.historyStudyId !== "NONE") issues.push(`${instrument}:HISTORICAL_STUDY_UNAVAILABLE`);
    const requiredGroups = brief?.cot.map(item => item.group) ?? [];
    if (!Array.isArray(flow.cotGroups) || flow.cotGroups.length !== requiredGroups.length || new Set(flow.cotGroups).size !== flow.cotGroups.length ||
      requiredGroups.some(group => !flow.cotGroups.includes(group))) issues.push(`${instrument}:AVAILABLE_COT_GROUPS_REQUIRED`);
    if (requiredGroups.length) {
      if (!refs(flow.evidenceRefs) || !flow.evidenceRefs.includes(brief!.cotRef)) issues.push(`${instrument}:COT_REFERENCE_REQUIRED`);
      const interpretation = [flow.reasoning, flow.whyNow, flow.counterargument].filter(item => typeof item === "string").join(" ");
      if (requiredGroups.includes("ASSET_MANAGER") && !/asset\s*manager|vermögensverwalter/i.test(interpretation)) issues.push(`${instrument}:ASSET_MANAGER_INTERPRETATION_REQUIRED`);
      if (requiredGroups.includes("LEVERAGED_MONEY") && !/leveraged\s*money|hedgefonds/i.test(interpretation)) issues.push(`${instrument}:LEVERAGED_MONEY_INTERPRETATION_REQUIRED`);
    }
    if (typeof flow.confirmation === "string" && typeof flow.invalidation === "string" && normalize(flow.confirmation) === normalize(flow.invalidation)) issues.push(`${instrument}:IDENTICAL_CONFIRMATION_AND_INVALIDATION`);
    if (typeof flow.reasoning === "string" && typeof flow.whyNow === "string" && normalize(flow.reasoning) === normalize(flow.whyNow)) issues.push(`${instrument}:WHY_NOW_REPEATS_REASON`);
    const ownPrice = instrument === "RUSSELL_CALL" ? "PRICE_RUSSELL_2000" : "PRICE_NASDAQ";
    const actionable = ["STARTER_CANDIDATE", "CONFIRM", "REDUCE"].includes(flow.assessment);
    if (actionable) {
      if (byId.get(ownPrice)?.entryDataReady !== true) issues.push(`${instrument}:OWN_PRICE_DATA_INCOMPLETE_OR_STALE`);
      if (flow.assessment === "CONFIRM") {
        const price = byId.get(ownPrice)?.data;
        const daily = object(price?.dailyBars);
        const sign = instrument === "NASDAQ_PUT" ? -1 : 1;
        if (![price?.momentum5D, daily.return1D].some(value => typeof value === "number" && value * sign > 0)) issues.push(`${instrument}:CONFIRM_WITHOUT_OBSERVED_DIRECTIONAL_PRICE`);
      }
      if (!refs(flow.evidenceRefs) || !flow.evidenceRefs.includes(ownPrice)) issues.push(`${instrument}:OWN_PRICE_EVIDENCE_REQUIRED`);
      if (refs(flow.evidenceRefs) && flow.evidenceRefs.some(id => byId.get(id)?.available !== true)) issues.push(`${instrument}:UNAVAILABLE_EVIDENCE_FOR_ACTION`);
      for (const key of ["confirmationRefs", "invalidationRefs"]) {
        if (refs(flow[key]) && !flow[key].some((id: string) => id === ownPrice || ["APP", "LAYER_STRUCTURE", "LAYER_ROTATION", "LAYER_LIQUIDITY"].includes(id))) issues.push(`${instrument}:OBSERVABLE_${key.toUpperCase()}_REQUIRED`);
      }
      // An app permission alone cannot serve as independent reasoning.
      if (typeof flow.reasoning === "string" && /^(tradestack und positionsmodell geben diesen flow frei|no_long_entry_decision|no trade|im snapshot freigegeben)[.!\s]*$/i.test(flow.reasoning.trim())) issues.push(`${instrument}:APP_PERMISSION_IS_NOT_RESEARCH_REASONING`);
    }
  }
  if (seen.size === 3 && SYNTHESIS_ACTIONS.includes(data.flows[0]?.assessment) && data.conclusion !== synthesisConclusion(data.flows)) issues.push("CONCLUSION_DISAGREES_WITH_INSTRUMENTS");
  if (data.conclusion === "CANDIDATES" && typeof data.summary === "string" && /watch\s+oder\s+prepare|(?:nur|ausschließlich)\s+(?:beobachten|abwarten)|keine\s+(?:frühen?\s+)?einstiegskandidaten/i.test(data.summary)) issues.push("SUMMARY_DENIES_ITS_OWN_CANDIDATE");
  // A narrow numerical check catches unsupported percentages and explicit invented trade levels.
  // It cannot establish that an otherwise supplied number was interpreted correctly.
  const prose = [data.summary, data.asymmetry, ...(Array.isArray(data.counterarguments) ? data.counterarguments : []), ...(Array.isArray(data.limitations) ? data.limitations : []),
    ...data.flows.flatMap((flow: any) => [flow?.reasoning, flow?.whyNow, flow?.counterargument, flow?.confirmation, flow?.invalidation])].filter(item => typeof item === "string").join(" ");
  for (const match of prose.matchAll(/([+-]?\d+(?:[.,]\d+)?)\s*%/g)) {
    const value = Number(match[1].replace(",", "."));
    if (!numbers.some(number => Math.abs(value - number) <= 0.051)) issues.push("UNSUPPORTED_PERCENTAGE");
  }
  if (/(?:trefferquote|erfolgswahrscheinlichkeit|gewinnwahrscheinlichkeit|crv|kursziel|stopp?(?:kurs)?)\s*(?:von|bei|:|beträgt|ist|liegt bei)?\s*[+-]?\d|\d+(?:[.,]\d+)?\s*%\s*(?:erfolg|gewinnchance|treffer)/i.test(prose)) issues.push("UNVALIDATED_PROBABILITY_OR_TRADE_LEVEL");
  return [...new Set(issues)];
}

export function validateSynthesis(value: unknown, evidence: SynthesisEvidence[]): value is ResearchSynthesisContent {
  return inspectSynthesis(value, evidence).length === 0;
}
