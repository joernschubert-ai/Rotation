import type { SynthesisEvidence } from "./aiResearchSynthesisEvidence";

export type ResearchInstrument = "NASDAQ_PUT" | "NASDAQ_CALL" | "RUSSELL_CALL";
export interface InstrumentBrief {
  instrument: ResearchInstrument;
  priceRef: string;
  price: { current: number | null; momentum5D: number | null; momentum20D: number | null };
  histories: Array<{
    id: string; sourceRef: string; family: string; state: string; asOfDate: string;
    currentMatch: boolean; horizonDays: number; sampleSize: number;
    meanPct: number | null; baselineMeanPct: number | null; medianPct: number | null;
    p10Pct: number | null; p90Pct: number | null; excessMeanPp: number | null;
    meanVsBaseline?: "ABOVE" | "BELOW" | "EQUAL" | "UNKNOWN";
    meanDirection?: "POSITIVE" | "NEGATIVE" | "ZERO" | "UNKNOWN";
    comparisonFact?: string;
  }>;
  cotRef: string;
  cot: Array<{ group: string; reportDate: string; netPosition: number | null; weeklyChange: number | null; change13W: number | null; percentile: number | null;
    netState?: "NET_LONG" | "NET_SHORT" | "FLAT" | "UNKNOWN";
    weeklyFact?: string; change13WFact?: string; previousWeekNet?: number | null; previous13WeekNet?: number | null }>;
  reading: string[];
}
const object = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
const numeric = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
const format = (value: number | null) => value === null ? "nicht verfügbar" : value.toFixed(2).replace(".", ",");

export function historicalComparisonFact(mean: number | null, baseline: number | null) {
  mean = numeric(mean); baseline = numeric(baseline);
  const meanDirection = mean === null ? "UNKNOWN" : mean > 0 ? "POSITIVE" : mean < 0 ? "NEGATIVE" : "ZERO";
  const meanVsBaseline = mean === null || baseline === null ? "UNKNOWN" : Math.abs(mean - baseline) < 1e-8 ? "EQUAL" : mean > baseline ? "ABOVE" : "BELOW";
  const comparisonFact = meanVsBaseline === "UNKNOWN" ? "Kein vollständiger Vergleich der Index-Folgerenditen verfügbar."
    : `Historische Index-Folgerendite im Mittel ${meanDirection === "POSITIVE" ? "positiv" : meanDirection === "NEGATIVE" ? "negativ" : "null"} (${format(mean)}%), ${meanVsBaseline === "ABOVE" ? "über" : meanVsBaseline === "BELOW" ? "unter" : "gleich"} der unbedingten Index-Vergleichsrendite (${format(baseline)}%). Keine Put-/Call-Produktrendite.`;
  return { meanDirection, meanVsBaseline, comparisonFact } as const;
}

/** Changes in NET positioning do not identify gross long additions/short covering. */
export function cotChangeFact(current: number | null, change: number | null): { previous: number | null; fact: string } {
  current = numeric(current); change = numeric(change);
  if (current === null || change === null) return { previous: null, fact: "Bestand oder Netto-Veränderung fehlt; Entwicklung nicht vollständig bestimmbar." };
  const previous = current - change;
  let fact: string;
  if (change === 0) fact = "Nettoposition unverändert";
  else if (current > 0 && previous < 0) fact = "Wechsel von netto short zu netto long";
  else if (current < 0 && previous > 0) fact = "Wechsel von netto long zu netto short";
  else if (current === 0) fact = "Nettoposition ausgeglichen";
  else if (current < 0) fact = change > 0 ? "Netto short, aber Netto-Shortüberhang kleiner" : "Netto short und Netto-Shortüberhang größer";
  else fact = change > 0 ? "Netto long und Netto-Longüberhang größer" : "Netto long, aber Netto-Longüberhang kleiner";
  return { previous, fact: `${fact} (${previous} → ${current} Kontrakte).` };
}

/** Dated source facts, never entry scores or inferred option returns. */
export function buildInstrumentBriefs(evidence: SynthesisEvidence[]): InstrumentBrief[] {
  const byId = new Map(evidence.map(item => [item.id, item]));
  return (["NASDAQ_PUT", "NASDAQ_CALL", "RUSSELL_CALL"] as const).map(instrument => {
    const market = instrument === "RUSSELL_CALL" ? "RUSSELL_2000" : "NASDAQ";
    const priceRef = `PRICE_${market}`, historyRef = `HISTORY_${market}`, cotRef = `COT_${market}`;
    const price = object(byId.get(priceRef)?.data), history = object(byId.get(historyRef)?.data);
    const columns: string[] = Array.isArray(history.statisticsColumns) ? history.statisticsColumns : [];
    const histories: InstrumentBrief["histories"] = (Array.isArray(history.studies) ? history.studies : []).flatMap((raw: unknown) => {
      const study = object(raw);
      const row = (Array.isArray(study.statisticsRows) ? study.statisticsRows : []).find((row: unknown) => Array.isArray(row) && row[columns.indexOf("horizonDays")] === 20);
      if (!Array.isArray(row) || typeof study.family !== "string" || typeof study.asOfDate !== "string") return [];
      const get = (name: string) => numeric(row[columns.indexOf(name)]);
      const sampleSize = get("sampleSize");
      if (sampleSize === null || sampleSize <= 0 || get("meanReturn") === null || get("baselineMeanReturn") === null) return [];
      return [{ id: `${historyRef}:${study.family}`, sourceRef: historyRef, family: study.family,
        ...historicalComparisonFact(get("meanReturn"), get("baselineMeanReturn")),
        state: String(study.state ?? ""), asOfDate: study.asOfDate, currentMatch: study.currentMatch === true,
        horizonDays: 20, sampleSize, meanPct: get("meanReturn"), baselineMeanPct: get("baselineMeanReturn"),
        medianPct: get("medianReturn"), p10Pct: get("p10Return"), p90Pct: get("p90Return"), excessMeanPp: get("excessMeanReturn") }];
    });
    const cotSource = byId.get(cotRef);
    const cot: InstrumentBrief["cot"] = cotSource?.available && Array.isArray(cotSource.data.summaries)
      ? cotSource.data.summaries.map(raw => {
        const item = object(raw);
        const netPosition = numeric(item.netPosition);
        const weekly = cotChangeFact(netPosition, numeric(item.weeklyChange)), longTerm = cotChangeFact(netPosition, numeric(item.change13W));
        return { group: String(item.group ?? ""), reportDate: String(item.reportDate ?? ""),
          netState: netPosition === null ? "UNKNOWN" as const : netPosition > 0 ? "NET_LONG" as const : netPosition < 0 ? "NET_SHORT" as const : "FLAT" as const,
          weeklyFact: weekly.fact, change13WFact: longTerm.fact, previousWeekNet: weekly.previous, previous13WeekNet: longTerm.previous,
          netPosition: numeric(item.netPosition), weeklyChange: numeric(item.weeklyChange), change13W: numeric(item.change13W), percentile: numeric(item.percentile) };
      }).filter(item => ["ASSET_MANAGER", "LEVERAGED_MONEY"].includes(item.group)) : [];
    const reading = [
      instrument === "NASDAQ_PUT" ? "Für diese Put-Hypothese sind fallende Indexkurse günstig, steigende ungünstig. Keine berechnete Optionsrendite."
        : "Für diese Call-Hypothese sind steigende eigene Indexkurse günstig, fallende ungünstig. Keine berechnete Optionsrendite.",
      `Eigene Kursrendite: 5 Tage ${format(numeric(price.momentum5D))}%, 20 Tage ${format(numeric(price.momentum20D))}%. Unterschiedliche Zeithorizonte getrennt erklären.`,
      ...histories.map(item => `${item.id}: ${item.sampleSize} überlappende Fälle; 20 Tage. ${item.comparisonFact} Median ${format(item.medianPct)}%, p10/p90 ${format(item.p10Pct)}%/${format(item.p90Pct)}%. ${item.currentMatch ? "Zustand zum Snapshot-Markttag." : `Nur datierter Kontext vom ${item.asOfDate}.`}`),
      ...cot.map(item => `${item.group} (${item.reportDate}): 1 Woche: ${item.weeklyFact} 13 Wochen: ${item.change13WFact}`),
      "Netto-Veränderungen beweisen keine einzelnen Brutto-Long-/Short-Transaktionen. Kein kombinierter Historie/COT-Backtest oder Options-Chance-Risiko-Verhältnis berechnet. Gegensätzliche COT-Gruppen allein beweisen keinen Vorteil."
    ];
    return { instrument, priceRef, price: { current: numeric(price.current), momentum5D: numeric(price.momentum5D), momentum20D: numeric(price.momentum20D) }, histories, cotRef, cot, reading };
  });
}
