import { compactFormationContext } from "./aiResearchFormations";
import type { AIResearchInput, AIResearchReport } from "./aiResearchTypes";

export type SynthesisMarket = "NASDAQ" | "RUSSELL_2000" | "SP500";
export interface SynthesisEvidence {
  id: string;
  kind: "APP" | "PRICE" | "LAYER" | "COT" | "HISTORY" | "NEWS" | "CHART";
  market?: SynthesisMarket;
  available: boolean;
  entryDataReady?: boolean;
  data: Record<string, unknown>;
}
const object = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
const finite = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
const text = (value: unknown, limit = 400): string | null => typeof value === "string" && value.trim() ? value.slice(0, limit) : null;
const pick = (value: unknown, keys: string[]) => {
  const data = object(value);
  return Object.fromEntries(keys.filter(key => finite(data[key]) !== null || typeof data[key] === "boolean" || typeof data[key] === "string")
    .map(key => [key, typeof data[key] === "string" ? text(data[key], 180) : data[key]]));
};
function iso(value: unknown): string | null {
  return typeof value === "string" && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)) ? value : null;
}

/** Verified own index observation date, never inferred from a weekend calendar alone. */
export function verifiedResearchMarketDate(value: unknown, market: string): string | null {
  const snapshot = object(value), indices = object(snapshot.indices);
  const index = market === "NASDAQ" ? "nasdaq" : market === "RUSSELL_2000" ? "russell" : market === "SP500" ? "sp500" : null;
  if (!index) return null;
  const quality = object(object(object(indices[index]).priceMetrics).dataQuality);
  const stamp = iso(quality.currentObservationTimestamp) ?? iso(quality.lastValidBarTimestamp) ?? iso(quality.latestBarTimestamp);
  const time = stamp ? Date.parse(stamp) : NaN, reference = Date.parse(snapshot.timestamp);
  if (!Number.isFinite(time) || !Number.isFinite(reference) || time > reference || reference-time > 5*86400000 || quality.stale === true || quality.freshnessVerified !== true) return null;
  const parts = new Intl.DateTimeFormat("en-US", {timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit"}).formatToParts(new Date(time));
  const part = (name: string) => parts.find(item => item.type === name)?.value ?? "";
  return part("year") + "-" + part("month") + "-" + part("day");
}

function priceEvidence(snapshot: Record<string, any>, market: SynthesisMarket, indexKey: string, momentumKey: string): SynthesisEvidence {
  const quote = object(object(snapshot.indices)[indexKey]);
  const bars = object(quote.priceMetrics);
  const momentum = object(object(snapshot.priceMomentum)[momentumKey]);
  const quality = object(momentum.dataQuality);
  const barsQuality = object(bars.dataQuality);
  const measured = object(quality.measured);
  const current = [quote.value, quote.current, quote.price, bars.current, momentum.value].map(finite).find(value => value !== null && value > 0) ?? null;
  function change(key: "momentum5D" | "momentum20D", barKey: "return5D" | "return20D") {
    if (quality[`${key}Available`] === true) return finite(measured[key]) ?? finite(momentum[key]);
    if (quality[`${key}Available`] === false) return null;
    return barsQuality[`${key}Available`] === true ? finite(bars[barKey]) : null;
  }
  const momentum5D = change("momentum5D", "return5D");
  const momentum20D = change("momentum20D", "return20D");
  const quoteTimestamp = iso(quote.timestamp) ?? iso(quote.asOf) ?? iso(quote.quoteTimestamp);
  const snapshotTime = Date.parse(snapshot.timestamp);
  const quoteAgeHours = quoteTimestamp ? (snapshotTime - Date.parse(quoteTimestamp)) / 3600000 : null;
  const observedTimestamp = iso(barsQuality.currentObservationTimestamp) ?? iso(barsQuality.lastValidBarTimestamp) ?? iso(barsQuality.latestBarTimestamp);
  const observedMarketDate = verifiedResearchMarketDate(snapshot, market);
  return { id: `PRICE_${market}`, kind: "PRICE", market, available: current !== null || momentum5D !== null || momentum20D !== null,
    // Unknown quote time remains explicit; it does not silently become live data.
    entryDataReady: current !== null && momentum5D !== null && momentum20D !== null && (quoteAgeHours === null || quoteAgeHours >= 0 && quoteAgeHours <= 96),
    data: { observedMarketDate, observedTimestamp, current, changeAsProvided: finite(quote.change), quoteTimestamp, quoteAgeHours,
      snapshotTimestampIsNotQuoteTimestamp: true, momentum5D, momentum20D,
      acceleration: quality.accelerationAvailable === true ? finite(measured.acceleration) ?? finite(momentum.acceleration) : null,
      accelerationDefinition: "MOMENTUM_5D_MINUS_MOMENTUM_20D_DIVIDED_BY_4",
      // Bar acceleration uses a different formula; do not merge the two.
      dailyBars: pick(bars, ["return1D", "return3D", "return5D", "return10D", "return20D", "return50D", "ma20", "ma50", "ma200", "distanceFromMA20", "distanceFromMA50", "distanceFromMA200", "drawdown20D", "trend"]),
      provenance: { ...pick(quality, ["source", "momentum5DAvailable", "momentum20DAvailable", "accelerationAvailable"]),
        ...pick(barsQuality, ["dateAlignmentVerified", "latestBarFinality", "timeBasis"]), quoteTimeKnown: quoteTimestamp !== null },
    } };
}

/** Only allowlisted market evidence is sent. No raw snapshot or provider credentials. */
export function buildSynthesisEvidence(input: AIResearchInput, report: AIResearchReport): SynthesisEvidence[] {
  const snapshot = object(input.snapshot);
  const reference = Date.parse(snapshot.timestamp);
  const evidence: SynthesisEvidence[] = [
    { id: "APP", kind: "APP", available: true, data: {
      phase: typeof snapshot.phase === "string" ? snapshot.phase : pick(snapshot.phase, ["phase", "regimeState", "subPhase", "confidence"]),
      master: pick(snapshot.master, ["score", "signal", "mode", "regime"]),
      flows: report.decisionSupport?.flows.map(flow => ({ instrument: flow.instrument, eligible: flow.eligible, modelSize: flow.modelSize, execution: text(flow.execution), reason: text(flow.reason) })),
      putTiming: pick(snapshot.putTiming, ["score", "decision", "timing", "execution", "entryWindow"]),
      nasdaq: pick(snapshot.nasdaqCall, ["score", "decision", "signal", "state"]), russell: pick(snapshot.russell, ["score", "decision", "signal", "state"]),
      participation: pick(snapshot.participation, ["score", "state"]), liquidity: pick(snapshot.liquidity, ["score", "state"]),
      fragility: pick(snapshot.fragility, ["score", "state"]), marketQuality: pick(snapshot.marketQuality, ["score", "state"]),
      crash: pick(snapshot.crash, ["score", "probability"]), squeeze: pick(snapshot.squeeze, ["risk", "state", "squeezeType"]),
      volatility: { vix: finite(object(object(snapshot.indices).vix).current),
        vixTermRatio: finite(object(snapshot.indices).vixTermRatio), termDefinition: "VIX / VIX3M; below one is contango",
        volOfVolRatio: finite(object(snapshot.indices).volOfVolRatio) },
      credit: { ...pick(snapshot.credit, ["rawRatio", "ma50", "ratioToMA50", "distancePct", "signal"]),
        ...pick(object(snapshot.credit).dataQuality, ["available", "ratioDefinition", "normalizedDefinition", "dateAlignmentVerified"]),
        interpretation: "Raw HYG/IEF is a price ratio, not an absolute stress threshold. Interpret its verified signal/ratioToMA50 and data quality." },
      gammaDiagnostics: { ...pick(snapshot.gamma, ["score", "effectiveGamma", "structuralGammaFloor"]), measurementStatus: "Producer model diagnostics; not independently verified dealer exposure" },
      rotation: pick(snapshot.rotation, ["score", "signal", "rsSmall", "rsEqual", "rsGrowth"]),
      instrumentStructure: {
        NASDAQ: { source: "NASDAQ100_PRIMARY_CONSTITUENT_BREADTH", phase: typeof snapshot.phase === "string" ? snapshot.phase : object(snapshot.phase).phase,
          breadth: object(object(snapshot.structure).breadth), participation: finite(object(snapshot.participation).score), quality: finite(object(snapshot.marketQuality).score),
          referenceDate: text(object(snapshot.breadthDataQuality).referenceDate, 10) },
        RUSSELL_2000: (() => {
          const own = object(object(object(snapshot.russell).meta).independentContext);
          return { available: Object.keys(own).length > 0, source: text(own.source), phase: text(own.phase),
            referenceDate: text(own.referenceDate, 10), coverage: finite(own.coverage),
            breadth: Object.fromEntries(["b20", "b50", "b200"].map(key => [key, finite(object(object(own.breadth)[key]).value)])),
            participation: finite(own.participation), quality: finite(own.quality), rotationConfirm: text(own.rotationConfirm),
            missingOwnStructureDoesNotUseNasdaqFallback: true };
        })(),
      },
      breadth: Object.fromEntries(["b20", "b50", "b200"].map(key => { const value = object(object(snapshot.structure).breadth)[key]; return [key, finite(value) ?? finite(object(value).value)]; })),
      limitations: "Shared inputs overlap; App risk and sizing scores are not independent success probabilities. Gamma and liquidity can include model estimates.",
    } },
    priceEvidence(snapshot, "NASDAQ", "nasdaq", "ndx"),
    priceEvidence(snapshot, "RUSSELL_2000", "russell", "rut"),
    priceEvidence(snapshot, "SP500", "sp500", "spx"),
    ...(report.evidenceAssessment?.evidence ?? []).map(block => ({ id: `LAYER_${block.category}`, kind: "LAYER" as const,
      available: block.state !== "NOT_AVAILABLE", data: { category: block.category, state: block.state, summary: text(block.summary, 280),
        evidence: block.evidence.slice(0, 2).map(value => text(value, 180)), heuristicNotIndependent: true } })),
  ];
  for (const market of ["NASDAQ", "RUSSELL_2000"] as const) {
    const summaries = (input.positioning?.summaries ?? []).filter(item => item.market === market && ["ASSET_MANAGER", "LEVERAGED_MONEY"].includes(item.group));
    const fresh = summaries.filter(item => {
      const time = /^\d{4}-\d{2}-\d{2}$/.test(item.reportDate) ? Date.parse(`${item.reportDate}T00:00:00Z`) : NaN;
      return Number.isFinite(time) && time <= reference && reference - time <= 14 * 86400000;
    }).sort((a, b) => b.reportDate.localeCompare(a.reportDate));
    const safe = [...new Map([...fresh].reverse().map(item => [item.group, item])).values()];
    const asset = safe.find(item => item.group === "ASSET_MANAGER");
    const leveraged = safe.find(item => item.group === "LEVERAGED_MONEY");
    const sign = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value) ? Math.sign(value) : null;
    evidence.push({ id: `COT_${market}`, kind: "COT", market, available: safe.length > 0,
      data: { publicationTimeKnown: false, laggedContextOnly: true, summaries: safe.slice(0, 2).map(item => pick(item, ["reportDate", "group", "bias", "netPosition", "weeklyChange", "change4W", "change13W", "change26W", "percentile", "zScore"])), missingOrStale: safe.length === 0,
        groupComparison: {
          bothGroupsPresent: Boolean(asset && leveraged),
          sameObservationDate: Boolean(asset && leveraged && asset.reportDate === leveraged.reportDate),
          oppositeNetPositions: asset && leveraged && asset.reportDate === leveraged.reportDate && sign(asset.netPosition) !== null && sign(leveraged.netPosition) !== null ? sign(asset.netPosition)! * sign(leveraged.netPosition)! < 0 : null,
          opposite13WeekChanges: asset && leveraged && asset.reportDate === leveraged.reportDate && sign(asset.change13W) !== null && sign(leveraged.change13W) !== null ? sign(asset.change13W)! * sign(leveraged.change13W)! < 0 : null,
          interpretation: "Compare BOTH groups; net-position level and change are different. Opposite signs alone are not unusual or proof of a trading edge. Short covering can coexist with net short. No COT-conditioned return study supplied."
        } } });
  }
  const historical = report.historicalEvidence;
  const dateParts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(reference));
  const part = (type: string) => dateParts.find(item => item.type === type)?.value ?? "";
  const marketDate = `${part("year")}-${part("month")}-${part("day")}`;
  const states = (historical?.currentStates ?? []).filter(state => /^\d{4}-\d{2}-\d{2}$/.test(state.asOfDate) && state.asOfDate <= marketDate).slice(0, 6)
    .map(state => ({ ...state, comparable: state.comparable && state.asOfDate === marketDate }));
  // Own trend and five-day price/VIX are already included in the expanded studies.
  // Preserve all original tables in the report, but avoid duplicate prompt evidence.
  const comparisons = states.filter(state => !(historical?.marketStudies?.length &&
    ["PRICE_TREND", "PRICE_VIX_5D"].includes(state.family))).flatMap(state => (historical?.observations ?? [])
    .filter(item => item.family === state.family && item.market === state.market && item.state === state.state)
    .sort((a, b) => a.horizonDays - b.horizonDays).slice(0, 3)
    .map(item => ({ ...pick(item, ["family", "market", "state", "horizonDays", "sampleSize", "averageForwardReturn", "baselineAverageReturn", "excessReturn", "baselineSampleSize", "overlappingObservations", "matchedControl"]), stateAsOf: state.asOfDate, currentMatch: state.comparable })));
  evidence.push({ id: "HISTORY", kind: "HISTORY", available: comparisons.length > 0, data: {
    coverage: historical?.coverage ?? null,
    quality: pick(input.historyQuality, ["policy", "trustedStart", "currentVersionKnown", "retainedPriceDates", "comparableStructureDates"]),
    asOf: historical?.asOfDate ?? null, states: states.map(state => pick(state, ["family", "market", "state", "asOfDate", "comparable"])), comparisons,
    selection: "Only groups matching the supplied dated states; non-current states are descriptive only. Overlapping index returns are not warrant returns or proven alpha.",
  } });
  const ownMarketDate = (market: SynthesisMarket) => {
    const date = evidence.find(item => item.id === `PRICE_${market}`)?.data.observedMarketDate;
    return typeof date === "string" ? date : null;
  };
  const studies = (historical?.marketStudies ?? []).filter(study => study.asOfDate <= marketDate);
  for (const market of ["NASDAQ", "RUSSELL_2000"] as const) {
    const ownStudies = studies.filter(study => study.market === market);
    evidence.push({ id: `HISTORY_${market}`, kind: "HISTORY", market,
      available: ownStudies.some(study => study.statistics.some(stats => stats.sampleSize > 0)),
      data: {
        statisticsColumns: ["horizonDays", "sampleSize", "meanReturn", "medianReturn", "p10Return", "p90Return", "positiveRate", "meanMaximumRise", "meanMaximumFall", "baselineSampleSize", "baselineMeanReturn", "excessMeanReturn", "nonOverlappingSampleSize", "nonOverlappingMeanReturn"],
        studies: ownStudies.map(study => ({ family: study.family, state: study.state, asOfDate: study.asOfDate,
          currentMatch: study.currentMatch && study.asOfDate === ownMarketDate(market),
          snapshotMarketDate: ownMarketDate(market), definition: study.definition,
          // Named fields remove the need for the model to decode an array column
          // before making its main comparison. All horizons remain below.
          focus20D: (() => {
            const stats = study.statistics.find(item => item.horizonDays === 20);
            const rounded = (value: number | null) => value === null ? null : Number(value.toFixed(2));
            return stats && stats.sampleSize > 0 ? {
              sampleSize: stats.sampleSize, meanPct: rounded(stats.meanReturn), medianPct: rounded(stats.medianReturn),
              p10Pct: rounded(stats.p10Return), p90Pct: rounded(stats.p90Return),
              baselineMeanPct: rounded(stats.baselineMeanReturn), excessMeanPp: rounded(stats.excessMeanReturn),
              nonOverlappingCount: stats.nonOverlapping.sampleSize,
            } : null;
          })(),
          statisticsRows: study.statistics.map(stats => {
            const rounded = (value: number | null) => value === null ? null : Number(value.toFixed(4));
            return [stats.horizonDays, stats.sampleSize, rounded(stats.meanReturn), rounded(stats.medianReturn),
              rounded(stats.p10Return), rounded(stats.p90Return), rounded(stats.positiveRate),
              rounded(stats.meanMaximumRise), rounded(stats.meanMaximumFall), stats.baselineSampleSize,
              rounded(stats.baselineMeanReturn), rounded(stats.excessMeanReturn),
              stats.nonOverlapping.sampleSize, rounded(stats.nonOverlapping.meanReturn)];
          }) })),
        interpretation: "Own-index 5/20/60 aligned-observation outcomes. Mean, median and tails are descriptive, not calibrated forecasts. Maximum rise/fall use daily closes including entry zero; reverse their directional meaning for PUT. Non-overlapping subset is not independent validation. No COT-conditioned or combined-factor edge has been established. Do not infer non-existent options-market activity from app permissions."
      } });
  }
  const charts=historical?.chartContext;
  for(const market of ["NASDAQ","RUSSELL_2000"] as const){
    const chart=market==="NASDAQ"?charts?.nasdaq:charts?.russell;
    const available=!!chart?.asOfDate && chart.asOfDate<=marketDate && reference-Date.parse(chart.asOfDate+"T00:00:00Z")<=5*86400000 && chart.momentum.state!=="INSUFFICIENT_DATA";
    evidence.push({id:"CHART_"+market,kind:"CHART",market,available,entryDataReady:false,data:chart?{
      asOfDate:chart.asOfDate,basis:chart.basis,snapshotMarketDate:ownMarketDate(market),sameObservedDate:chart.asOfDate===ownMarketDate(market),
      timing:"COMPLETED_DAILY_CLOSE_CONTEXT_NOT_INTRADAY",momentum:chart.momentum,
      lastClose:chart.lastClose,drawdownFrom252SessionHighClosePct:chart.drawdownFrom252SessionHighClosePct,
      movingAverages:chart.movingAverages,observations:chart.observations,formations:chart.formations?compactFormationContext(chart.formations):null,
      highCloseZone:chart.zones.high,lowCloseZone:chart.zones.low,
      limitations:"Close-based context only. Momentum state is NOT an app phase or confirmed turn. No independent confirmations from repeated price indicators. Supplied P&F targets are conditional price projections, not options asymmetry or calibrated probability."
    }:{missing:true}});
  }
  const sources = report.sources.filter(source => {
    const time = iso(source.publishedAt);
    return time !== null && Date.parse(time) <= reference && reference - Date.parse(time) <= 7 * 86400000;
  }).slice(0, 6);
  sources.forEach((source, index) => evidence.push({ id: `NEWS_${index}`, kind: "NEWS", available: true,
    data: { ...pick(source, ["title", "summary", "publishedAt", "publisher"]), fullArticleVerified: false } }));
  return evidence;
}
