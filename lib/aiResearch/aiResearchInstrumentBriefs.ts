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
  }>;
  cotRef: string;
  cot: Array<{ group: string; reportDate: string; netPosition: number | null; weeklyChange: number | null; change13W: number | null; percentile: number | null }>;
  reading: string[];
}
const object = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
const numeric = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
const format = (value: number | null) => value === null ? "nicht verfügbar" : value.toFixed(2).replace(".", ",");

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
        state: String(study.state ?? ""), asOfDate: study.asOfDate, currentMatch: study.currentMatch === true,
        horizonDays: 20, sampleSize, meanPct: get("meanReturn"), baselineMeanPct: get("baselineMeanReturn"),
        medianPct: get("medianReturn"), p10Pct: get("p10Return"), p90Pct: get("p90Return"), excessMeanPp: get("excessMeanReturn") }];
    });
    const cotSource = byId.get(cotRef);
    const cot: InstrumentBrief["cot"] = cotSource?.available && Array.isArray(cotSource.data.summaries)
      ? cotSource.data.summaries.map(raw => {
        const item = object(raw);
        return { group: String(item.group ?? ""), reportDate: String(item.reportDate ?? ""),
          netPosition: numeric(item.netPosition), weeklyChange: numeric(item.weeklyChange), change13W: numeric(item.change13W), percentile: numeric(item.percentile) };
      }).filter(item => ["ASSET_MANAGER", "LEVERAGED_MONEY"].includes(item.group)) : [];
    const reading = [
      instrument === "NASDAQ_PUT" ? "Für diese Put-Hypothese sind fallende Indexkurse günstig, steigende ungünstig. Keine berechnete Optionsrendite."
        : "Für diese Call-Hypothese sind steigende eigene Indexkurse günstig, fallende ungünstig. Keine berechnete Optionsrendite.",
      `Eigene Kursrendite: 5 Tage ${format(numeric(price.momentum5D))}%, 20 Tage ${format(numeric(price.momentum20D))}%. Unterschiedliche Zeithorizonte getrennt erklären.`,
      ...histories.map(item => `${item.id}: ${item.sampleSize} überlappende Fälle; Index-Folgerendite über 20 Tage: Mittel ${format(item.meanPct)}% gegen ${format(item.baselineMeanPct)}% Vergleich, Median ${format(item.medianPct)}%, p10/p90 ${format(item.p10Pct)}%/${format(item.p90Pct)}%. ${item.currentMatch ? "Zustand zum Snapshot-Markttag." : `Nur datierter Kontext vom ${item.asOfDate}.`}`),
      ...cot.map(item => `${item.group} (${item.reportDate}): netto ${item.netPosition ?? "fehlend"}; Wochenänderung ${item.weeklyChange ?? "fehlend"}; 13-Wochen-Änderung ${item.change13W ?? "fehlend"}. Bestand und Veränderung getrennt erklären.`),
      "Kein kombinierter Historie/COT-Backtest und kein Options-Chance-Risiko-Verhältnis berechnet. Gegensätzliche COT-Gruppen allein beweisen keinen Vorteil."
    ];
    return { instrument, priceRef, price: { current: numeric(price.current), momentum5D: numeric(price.momentum5D), momentum20D: numeric(price.momentum20D) }, histories, cotRef, cot, reading };
  });
}
