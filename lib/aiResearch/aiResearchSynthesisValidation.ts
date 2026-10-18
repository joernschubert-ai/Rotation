import { COT_HORIZONS, RISK_MECHANISMS, historyDirectionEffect, cotHorizonFact, aggregateReviewedFlows, TIMING_FOCUS, STRUCTURE_FOCUS, renderReviewedContext, inspectPositioningInterpretation } from "./aiResearchReasoningFrame";
import type { ResearchSynthesisContent } from "./aiResearchSynthesisTypes";
import type { SynthesisEvidence } from "./aiResearchSynthesisEvidence";
import { buildInstrumentBriefs } from "./aiResearchInstrumentBriefs";
import { allowedResearchTriggers, renderResearchTrigger } from "./aiResearchTriggers";
import type { ResearchTrigger } from "./aiResearchTriggers";

export { SYNTHESIS_CONTRACT } from "./aiResearchSynthesisTypes";
export const SYNTHESIS_INSTRUMENTS = ["NASDAQ_PUT", "NASDAQ_CALL", "RUSSELL_CALL"] as const;
export const SYNTHESIS_ACTIONS = ["WATCH", "PREPARE", "STARTER_CANDIDATE", "CONFIRM", "REDUCE"];
export const SYNTHESIS_SLOTS = { nasdaqPut: "NASDAQ_PUT", nasdaqCall: "NASDAQ_CALL", russellCall: "RUSSELL_CALL" } as const;
const object = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const placeholder = /^(?:keine?|kein(?:e|en|er)? (?:bestätigung|widerlegung|bedingung|gegenargumente?)|nicht (?:vorhanden|verfügbar|bekannt)|unbekannt|abwarten|none|unknown|n a|tbd|not available)[.!\s]*$/i;
const useful = (value: unknown, minimum = 25) => typeof value === "string" && value.trim().length >= minimum && value.length <= 1200 && !placeholder.test(value.trim());

/** Narrow checks for observed factual errors; not a general semantic proof. */
export function inspectHistoricalClaims(prose: string, relation?: string): string[] {
  const issues: string[] = [];
  if (/rendit(?:e|en)\s+(?:der|des|von)\s+(?:nasdaq|russell)[_\s-]*(?:put|call)\b/iu.test(prose)) issues.push("INDEX_RETURNS_MISLABELED_AS_OPTION_RETURNS");
  const comparisons = /(?:historisch\w*\s+rendit\w*|mittel\w*|durchschnitt\w*)[^.!?]{0,120}?\b(höher|größer|niedriger|geringer|kleiner)\s+als\s+(?:(?:die|der|dem)\s+)?(?:unbedingt\w*\s+)?vergleichs?rendit\w*/giu;
  for (const match of prose.matchAll(comparisons)) {
    if (/\bnicht\b|median|perzentil|p10|p90/iu.test(match[0])) continue;
    const higher = /höher|größer/iu.test(match[1]);
    if (relation && (higher ? relation !== "ABOVE" : relation !== "BELOW")) issues.push("HISTORICAL_PROSE_COMPARISON_DISAGREES_WITH_DATA");
  }
  return issues;
}

/** Narrow regression checks for explicit present/past claims, not future hypotheses. */
export function inspectPriceProse(prose: string, fiveDay: unknown, twentyDay: unknown): string[] {
  if (typeof fiveDay !== "number" || typeof twentyDay !== "number") return [];
  const sentences = prose.split(/[.!?]/u);
  const issues: string[] = [];
  for (const sentence of sentences) {
    if (!/in den letzten (?:tagen|fünf tagen|5 tagen)|über (?:fünf|5) tage/iu.test(sentence)) continue;
    if (/könnt|würde|falls|wenn|sollte|möglicherweise|hypothes|künftig|zukünftig/iu.test(sentence)) continue;
    const pastUp = /(?:gestiegen|zugelegt|angestiegen)(?:\s+\p{L}+){0,2}\s+(?:ist|sind|hat|haben)|(?:ist|sind|hat|haben)(?:\s+\p{L}+){0,4}\s+(?:gestiegen|zugelegt|angestiegen)/iu.test(sentence);
    const pastDown = /(?:gefallen|gesunken|zurückgegangen)(?:\s+\p{L}+){0,2}\s+(?:ist|sind|hat|haben)|(?:ist|sind|hat|haben)(?:\s+\p{L}+){0,4}\s+(?:gefallen|gesunken|zurückgegangen)/iu.test(sentence);
    if (fiveDay < 0 && twentyDay < 0 && pastUp && !/nicht gestiegen|nicht zugelegt/iu.test(sentence)) issues.push("RECENT_PRICE_RISE_CONTRADICTS_OWN_RETURNS");
    if (fiveDay > 0 && twentyDay > 0 && pastDown && !/nicht gefallen|nicht gesunken/iu.test(sentence)) issues.push("RECENT_PRICE_FALL_CONTRADICTS_OWN_RETURNS");
  }
  return [...new Set(issues)];
}

/** Narrow factual check: explicit overhang size must agree with selected dated fact. */
export function inspectCOTFactDirection(prose: unknown, fact: string | null): string[] {
  if (typeof prose !== "string" || !fact) return [];
  const expected = /überhang größer/iu.test(fact) ? "größer" : /überhang kleiner/iu.test(fact) ? "kleiner" : null;
  if (!expected) return [];
  for (const sentence of prose.split(/[.!?;]/u)) {
    if (/falls|wenn|würde|könnte|nicht größer|nicht kleiner/iu.test(sentence)) continue;
    const claim = sentence.match(/(?:netto[ -]?)?(?:short|long)überhang(?:[ -]veränderung)?(?:\s+\p{L}+){0,4}?\s+(größer|kleiner)/iu);
    if (claim && claim[1].toLowerCase() !== expected) return ["COT_OVERHANG_DIRECTION_CONTRADICTS_SELECTED_FACT"];
  }
  return [];
}

/** Convert complete named slots to the existing display format. Never invent a missing slot. */
export function normalizeSynthesisEnvelope(value: unknown, evidence?: SynthesisEvidence[]): unknown {
  const data = object(value);
  if (!Object.keys(SYNTHESIS_SLOTS).every(key => data[key] && typeof data[key] === "object" && !Array.isArray(data[key]))) return value;
  if ("flows" in data || Object.entries(SYNTHESIS_SLOTS).some(([key,instrument]) =>
    "instrument" in data[key] && data[key].instrument !== instrument)) return value;
  const flows = Object.entries(SYNTHESIS_SLOTS).map(([key,instrument]) => {
    const flow = { ...data[key], instrument };
    if (evidence) {
      const brief = buildInstrumentBriefs(evidence).find(item => item.instrument === instrument);
      const study = brief?.histories.find(item => item.id === flow.historyStudyId);
      flow.historyEffect = historyDirectionEffect(instrument, study?.meanPct);
      const fiveDay = brief?.price.momentum5D;
      flow.opportunityMechanism = flow.assessment === "WATCH" || flow.assessment === "REDUCE" || typeof fiveDay !== "number" || fiveDay === 0 ? "NONE"
        : fiveDay * (instrument === "NASDAQ_PUT" ? -1 : 1) > 0 ? "CONTINUATION" : "REVERSAL";
      const renderedContext=renderReviewedContext(instrument,flow.timingFocus,flow.structureFocus,flow.riskMechanism,evidence);
      flow.whyNow=renderedContext.whyNow;flow.counterargument=renderedContext.counterargument;
      flow.confirmationTrigger=instrument==="NASDAQ_PUT"?"FAILED_REBOUND":"STRENGTH_WITH_PARTICIPATION";
      flow.invalidationTrigger=instrument==="NASDAQ_PUT"?"STRENGTH_WITH_PARTICIPATION":"FAILED_REBOUND";
      // Source bindings are server facts, not model-authored interpretations.
      flow.cotGroups = brief?.cot.map(item => item.group) ?? [];
      flow.historyMeanVsBaseline = study?.meanVsBaseline ?? "UNKNOWN";
      flow.evidenceRefs = [brief?.priceRef, ...(study ? [study.sourceRef] : []), ...(brief?.cot.length ? [brief.cotRef] : [])].filter((id): id is string => Boolean(id));
    }
    if (evidence) {
      const brief = buildInstrumentBriefs(evidence).find(item => item.instrument === instrument);
      const reviews = object(flow.cotReview);
      flow.cotInterpretations = Object.fromEntries((brief?.cot ?? []).map(group => {
        const review = object(reviews[group.group]);
        const fact = cotHorizonFact(group, review.horizon);
        return [group.group, fact && typeof review.interpretation === "string" ? fact + " KI-Einordnung: " + review.interpretation : ""];
      }));
    }
    for (const role of ["confirmation", "invalidation"] as const) {
      const trigger = flow[`${role}Trigger`];
      if (allowedResearchTriggers(instrument, role).includes(trigger)) {
        const condition = renderResearchTrigger(instrument, trigger);
        flow[role] = condition.text; flow[`${role}Refs`] = condition.refs;
      }
    }
    return flow;
  });
  const { nasdaqPut, nasdaqCall, russellCall, ...rest } = data;
  const overview = aggregateReviewedFlows(flows);
  return { ...rest, ...overview, flows,
    counterarguments: flows.map(flow => flow.counterargument),
    limitations: ["Datierte Indexstudien und verzögerte TFF-COT-Daten sind Kontext, keine validierte Optionsstrategie. Faktenbindung beweist keine wirtschaftliche Richtigkeit."] };

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
      const trigger = flow[`${key}Trigger`] as ResearchTrigger;
      if (!allowedResearchTriggers(instrument, key as "confirmation" | "invalidation").includes(trigger)) {
        issues.push(`${instrument}:INVALID_${key.toUpperCase()}_DIRECTION_TRIGGER`);
      } else {
        const rendered = renderResearchTrigger(instrument, trigger);
        if (flow[key] !== rendered.text) issues.push(`${instrument}:CONDITION_TEXT_DISAGREES_WITH_TRIGGER`);
      }
      // This contract accepts qualitative observable triggers. Numeric trade
      // thresholds require a future, explicitly calculated chart-level schema.
      // Matching a number to any sample count or lookback is not a derivation.
      if (typeof flow[key] === "string" && hasUnsupportedConditionNumber(flow[key])) {
        issues.push(`${instrument}:UNSUPPORTED_NUMERIC_${key.toUpperCase()}`);
      }
      if (typeof flow[key] === "string" && (!/nasdaq|russell|kurs|preis|rendit|momentum|teilnahme|partizipation|liquid|rotation|marktbreit|breadth|participation|durchschnitt|ma(?:20|50|200)/i.test(flow[key]) ||
        !/aufwärts|abwärts|steig|fall|fäll|sink|dreh|erhol|verschlech|stabilis|bestätig|zurück|schwäch|verbess|unter|über|beschleun|zunehm|abnehm|aktuali|vorlieg|verfüg|halt|hält|ausweit|verlier|verliert|brech|brich|rück|korrektur|rally|abgabe|anstieg|ausbruch|scheiter|höher|tiefer|zuleg|gewinnt|nachgibt|nachgeben/i.test(flow[key]))) issues.push(`${instrument}:UNOBSERVABLE_${key.toUpperCase()}`);
    }
    for (const key of ["evidenceRefs", "confirmationRefs", "invalidationRefs"]) {
      if (!refs(flow[key])) issues.push(`${instrument}:INVALID_${key.toUpperCase()}`);
    }
    const brief = briefs.find(item => item.instrument === instrument);
    const selectedHistory = brief?.histories.find(study => study.id === flow.historyStudyId);
    if (!(TIMING_FOCUS as readonly unknown[]).includes(flow.timingFocus)) issues.push(`${instrument}:INVALID_TIMING_FOCUS`);
    if (!(STRUCTURE_FOCUS as readonly unknown[]).includes(flow.structureFocus)) issues.push(`${instrument}:INVALID_STRUCTURE_FOCUS`);
    const ownPriceFacts = byId.get(instrument === "RUSSELL_CALL" ? "PRICE_RUSSELL_2000" : "PRICE_NASDAQ")?.data;
    for (const issue of inspectPriceProse([flow.reasoning, flow.whyNow, flow.counterargument].filter(item => typeof item === "string").join(". "), ownPriceFacts?.momentum5D, ownPriceFacts?.momentum20D)) issues.push(`${instrument}:${issue}`);
    if (instrument === "NASDAQ_PUT" && typeof selectedHistory?.meanPct === "number" && selectedHistory.meanPct > 0 && typeof flow.reasoning === "string" &&
      /histor|folgerendit/iu.test(flow.reasoning) && /renditen[^.!?]{0,100}höher/iu.test(flow.reasoning) && /unterstützt diese these/iu.test(flow.reasoning) &&
      !/gegenargument|ungünstig|widerspr|spricht gegen|risiko|nicht/iu.test(flow.reasoning)) issues.push(`${instrument}:POSITIVE_INDEX_HISTORY_USED_AS_PUT_SUPPORT`);
    if (instrument === "NASDAQ_PUT" && typeof selectedHistory?.meanPct === "number" && selectedHistory.meanPct > 0 && typeof flow.reasoning === "string" &&
      /historisch[^.!?]{0,90}unterstütz[^.!?]{0,50}(?:nasdaq[ -]?)?put/iu.test(flow.reasoning)) issues.push(`${instrument}:POSITIVE_INDEX_HISTORY_USED_AS_PUT_SUPPORT`);
    const factualProse = [flow.reasoning, flow.whyNow, flow.counterargument].filter(item => typeof item === "string").join(" ");
    for (const issue of inspectHistoricalClaims(factualProse, selectedHistory?.meanVsBaseline)) issues.push(`${instrument}:${issue}`);
    if (brief?.histories.length) {
      if (!selectedHistory) issues.push(`${instrument}:OWN_HISTORICAL_STUDY_REQUIRED`);
      else if (!refs(flow.evidenceRefs) || !flow.evidenceRefs.includes(selectedHistory.sourceRef)) issues.push(`${instrument}:SELECTED_HISTORY_REFERENCE_REQUIRED`);
      if (selectedHistory && flow.historyMeanVsBaseline !== selectedHistory.meanVsBaseline) issues.push(`${instrument}:HISTORICAL_COMPARISON_DISAGREES_WITH_DATA`);
      if (typeof flow.reasoning !== "string" || !/histor|vergleich|median|mittel|durchschnitt|folgerendit/i.test(flow.reasoning)) issues.push(`${instrument}:HISTORICAL_INTERPRETATION_REQUIRED`);
    } else {
      if (flow.historyStudyId !== "NONE") issues.push(`${instrument}:HISTORICAL_STUDY_UNAVAILABLE`);
      if (flow.historyMeanVsBaseline !== "UNKNOWN") issues.push(`${instrument}:HISTORICAL_COMPARISON_UNAVAILABLE`);
    }
    if (flow.historyEffect !== historyDirectionEffect(instrument, selectedHistory?.meanPct)) issues.push(`${instrument}:HISTORY_DIRECTION_EFFECT_DISAGREES`);
    const riskMechanisms = RISK_MECHANISMS[instrument as keyof typeof RISK_MECHANISMS] as readonly string[];
    if (!riskMechanisms.includes(flow.riskMechanism)) issues.push(`${instrument}:INVALID_RISK_MECHANISM`);
    if (!["CONTINUATION", "REVERSAL", "NONE"].includes(flow.opportunityMechanism)) issues.push(`${instrument}:INVALID_OPPORTUNITY_MECHANISM`);
    const ownFiveDay = ownPriceFacts?.momentum5D;
    if (typeof ownFiveDay === "number" && ownFiveDay !== 0 && ["CONTINUATION", "REVERSAL"].includes(flow.opportunityMechanism)) {
      const sign = instrument === "NASDAQ_PUT" ? -1 : 1;
      const expected = ownFiveDay * sign > 0 ? "CONTINUATION" : "REVERSAL";
      if (flow.opportunityMechanism !== expected) issues.push(`${instrument}:OPPORTUNITY_DIRECTION_DISAGREES_WITH_5D_DEFINITION`);
    }
    if (typeof flow.whyNow === "string" && !/phase|breite|breadth|teilnahme|partizipation|participation|qualität|quality|durchschnitt|ma50|ma200/iu.test(flow.whyNow)) issues.push(`${instrument}:OWN_STRUCTURE_REQUIRED_IN_WHY_NOW`);
    if (typeof flow.whyNow === "string" && !(instrument === "RUSSELL_CALL" ? /russell/iu : /nasdaq/iu).test(flow.whyNow)) issues.push(`${instrument}:OWN_INSTRUMENT_REQUIRED_IN_WHY_NOW`);
    if (instrument !== "NASDAQ_PUT" && typeof flow.counterargument === "string" && /short[ -]?squeeze/iu.test(flow.counterargument) && !/kein gegenargument|nicht (?:als )?(?:gegenargument|risiko)|volatilität|volatilitäts|zeitwert|bereits|schon gelaufen/iu.test(flow.counterargument)) issues.push(`${instrument}:UPSIDE_SQUEEZE_IS_NOT_CALL_COUNTERARGUMENT`);
    if (flow.timingFocus === "DIRECTION_CONFIRMED") {
      const direction = instrument === "NASDAQ_PUT" ? -1 : 1;
      if (!(typeof ownFiveDay === "number" && ownFiveDay * direction > 0)) issues.push(`${instrument}:TIMING_CONFIRMATION_WITHOUT_OWN_5D_DIRECTION`);
    }
    if (typeof flow.reasoning === "string" && /%|\bprozent/iu.test(flow.reasoning)) issues.push(`${instrument}:MODEL_MUST_NOT_REPEAT_NUMERIC_FACTS`);
    for(const issue of inspectPositioningInterpretation(instrument,flow.reasoning)) issues.push(`${instrument}:${issue}`);
    const requiredGroups = brief?.cot.map(item => item.group) ?? [];
    const cotReview = object(flow.cotReview);
    for (const group of requiredGroups) {
      const review = object(cotReview[group]);
      for(const issue of inspectPositioningInterpretation(instrument,review.interpretation,true)) issues.push(`${instrument}:${group}:${issue}`);
      const sourceGroup = brief?.cot.find(item=>item.group===group);
      const sourceFact = sourceGroup ? cotHorizonFact(sourceGroup,review.horizon) : null;
      for (const issue of inspectCOTFactDirection(review.interpretation, sourceFact)) issues.push(`${instrument}:${group}:${issue}`);
      if (sourceFact && typeof review.interpretation==="string" && normalize(sourceFact)===normalize(review.interpretation)) issues.push(`${instrument}:${group}_INTERPRETATION_ONLY_COPIES_FACT`);
      if (typeof review.interpretation==="string" && /%|\bprozent/iu.test(review.interpretation)) issues.push(`${instrument}:MODEL_MUST_NOT_REPEAT_NUMERIC_FACTS`);
      if (!(COT_HORIZONS as readonly unknown[]).includes(review.horizon) || !useful(review.interpretation)) issues.push(`${instrument}:${group}_DATED_CHANGE_REVIEW_REQUIRED`);
      if (typeof review.interpretation === "string" && !/veränder|zunehm|abnehm|größer|kleiner|gestieg|gesunk|verbess|verschlech|aufbau|abbau|reduz|erhöh|rückgang|zuwachs|verring|unverändert|fehlt|nicht verfügbar/iu.test(review.interpretation)) issues.push(`${instrument}:${group}_CHANGE_INTERPRETATION_REQUIRED`);
    }
    const cotInterpretations = object(flow.cotInterpretations);
    for (const group of requiredGroups) {
      if (!useful(cotInterpretations[group])) issues.push(`${instrument}:${group}_INTERPRETATION_FIELD_REQUIRED`);
    }
    if (Object.keys(cotInterpretations).some(group => !requiredGroups.includes(group))) issues.push(`${instrument}:UNKNOWN_COT_INTERPRETATION_GROUP`);
    if (!Array.isArray(flow.cotGroups) || flow.cotGroups.length !== requiredGroups.length || new Set(flow.cotGroups).size !== flow.cotGroups.length ||
      requiredGroups.some(group => !flow.cotGroups.includes(group))) issues.push(`${instrument}:AVAILABLE_COT_GROUPS_REQUIRED`);
    if (requiredGroups.length) {
      for (const sentence of factualProse.split(/[.!?]/u)) {
        if (!/leveraged\s*money|hedgefonds/iu.test(sentence) || !/netto[ -]?short/iu.test(sentence) || !/erhöht|ausgebaut|vergrößert|reduziert|verkleinert/iu.test(sentence) || /nicht|könnt|falls|wenn|würde/iu.test(sentence)) continue;
        const horizons = [
          {matches: /(?:eine|einer|1|letzte|letzten)\s+woche|wochenvergleich/iu.test(sentence), key: "weeklyChange"},
          {matches: /(?:vier|4)\s*wochen/iu.test(sentence), key: "change4W"},
          {matches: /(?:dreizehn|13)\s*wochen/iu.test(sentence), key: "change13W"}
        ].filter(item => item.matches);
        if (horizons.length !== 1) { issues.push(`${instrument}:COT_CHANGE_REQUIRES_EXPLICIT_HORIZON`); continue; }
        const group = brief?.cot.find(item => item.group === "LEVERAGED_MONEY");
        const change = group?.[horizons[0].key as "weeklyChange" | "change4W" | "change13W"];
        const larger = /erhöht|ausgebaut|vergrößert/iu.test(sentence);
        if (typeof group?.netPosition === "number" && group.netPosition < 0 && typeof change === "number" && change !== 0 && (larger ? change > 0 : change < 0)) issues.push(`${instrument}:NET_SHORT_CHANGE_CONTRADICTS_SELECTED_HORIZON`);
      }
      if (!refs(flow.evidenceRefs) || !flow.evidenceRefs.includes(brief!.cotRef)) issues.push(`${instrument}:COT_REFERENCE_REQUIRED`);
      const interpretation = [flow.reasoning, flow.whyNow, flow.counterargument, ...Object.values(cotInterpretations)].filter(item => typeof item === "string").join(" ");
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
  const thesisTexts=data.flows.map((flow:any)=>typeof flow?.reasoning==="string"?normalize(flow.reasoning):"").filter(Boolean);
  if(new Set(thesisTexts).size!==thesisTexts.length) issues.push("IDENTICAL_INSTRUMENT_THESES");
  const whyNowTexts = data.flows.map((flow: any) => typeof flow?.whyNow === "string" ? normalize(flow.whyNow) : "").filter(Boolean);
  if (new Set(whyNowTexts).size !== whyNowTexts.length) issues.push("IDENTICAL_INSTRUMENT_WHY_NOW");
  const overview = aggregateReviewedFlows(data.flows);
  if (data.summary !== overview.summary || data.asymmetry !== overview.asymmetry) issues.push("GLOBAL_OVERVIEW_NOT_DERIVED_FROM_REVIEWED_FLOWS");
  if (seen.size === 3 && SYNTHESIS_ACTIONS.includes(data.flows[0]?.assessment) && data.conclusion !== synthesisConclusion(data.flows)) issues.push("CONCLUSION_DISAGREES_WITH_INSTRUMENTS");
  if (data.conclusion === "CANDIDATES" && typeof data.summary === "string" && /watch\s+oder\s+prepare|(?:nur|ausschließlich)\s+(?:beobachten|abwarten)|keine\s+(?:frühen?\s+)?einstiegskandidaten/i.test(data.summary)) issues.push("SUMMARY_DENIES_ITS_OWN_CANDIDATE");
  // A narrow numerical check catches unsupported percentages and explicit invented trade levels.
  // It cannot establish that an otherwise supplied number was interpreted correctly.
  const prose = [data.summary, data.asymmetry, ...(Array.isArray(data.counterarguments) ? data.counterarguments : []), ...(Array.isArray(data.limitations) ? data.limitations : []),
    ...data.flows.flatMap((flow: any) => [flow?.reasoning, flow?.whyNow, flow?.counterargument, flow?.confirmation, flow?.invalidation])].filter(item => typeof item === "string").join(" ");
  if (inspectHistoricalClaims(prose).includes("INDEX_RETURNS_MISLABELED_AS_OPTION_RETURNS")) issues.push("INDEX_RETURNS_MISLABELED_AS_OPTION_RETURNS");
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
