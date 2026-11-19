import { createHash } from "node:crypto";

export const CONSTITUENTS_URL = "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv";
export type BreadthRow = { symbol: string; date?: string; above20?: boolean; above50?: boolean; above200?: boolean; error?: string };

export function parseConstituents(csv: string): string[] {
  if (!csv.startsWith("Symbol,Security,")) throw new Error("Unexpected constituent format");
  const symbols = csv.trim().split(/\r?\n/).slice(1).map(line => line.split(",")[0].trim().replace(/\./g, "-"));
  if (symbols.length < 490 || symbols.length > 520 || new Set(symbols).size !== symbols.length || symbols.some(s => !/^[A-Z][A-Z0-9-]{0,9}$/.test(s))) throw new Error("Invalid constituent list");
  return symbols.sort();
}

export function universeHash(symbols: string[]) { return createHash("sha256").update(symbols.join(",")).digest("hex").slice(0, 16); }

export function summarizeStandardBreadth(symbols: string[], rows: BreadthRow[], referenceDate: string) {
  const bySymbol = new Map(rows.map(row => [row.symbol, row]));
  const valid = symbols.map(s => bySymbol.get(s)).filter((r): r is BreadthRow => Boolean(r && !r.error && r.date === referenceDate && [r.above20, r.above50, r.above200].every(v => typeof v === "boolean")));
  const counts = { above20: valid.filter(r => r.above20).length, above50: valid.filter(r => r.above50).length, above200: valid.filter(r => r.above200).length };
  const coverage = valid.length / symbols.length;
  return {
    definition: "SP500_CURRENT_CONSTITUENTS_EQUAL_WEIGHT", officialIndexBreadth: false,
    historicalMembershipReconstructed: false, source: "YAHOO_DAILY_CLOSE", referenceDate,
    expected: symbols.length, valid: valid.length, coverage, minimumCoverage: 0.75,
    status: coverage >= 0.75 ? "COMPARISON_READY" : "INSUFFICIENT_COVERAGE",
    counts,
    percentages: coverage >= 0.75 ? { b20: 100 * counts.above20 / valid.length, b50: 100 * counts.above50 / valid.length, b200: 100 * counts.above200 / valid.length } : null,
    excluded: symbols.filter(s => !valid.some(r => r.symbol === s)).map(symbol => ({ symbol, reason: bySymbol.get(symbol)?.error ?? "DIFFERENT_OR_MISSING_DATE" })),
    affectsTradingSignals: false
  };
}

export async function fetchComparisonRow(symbol: string, date: string): Promise<BreadthRow> {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2y`, { cache: "no-store", signal: AbortSignal.timeout(7000), headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return { symbol, error: `HTTP_${response.status}` };
    const result = (await response.json())?.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const bars = (result?.timestamp ?? []).map((t: number, i: number) => ({ date: new Date(t * 1000).toISOString().slice(0, 10), close: closes[i] })).filter((b: { date: string }) => b.date <= date);
    const window = bars.slice(-200);
    if (window.length !== 200 || window[199].date !== date || window.some((b: { close: unknown }) => typeof b.close !== "number" || !Number.isFinite(b.close) || b.close <= 0)) return { symbol, error: "INCOMPLETE_OR_DIFFERENT_DATE" };
    const current = window[199].close;
    const above = (period: number) => current > window.slice(-period).reduce((sum: number, b: { close: number }) => sum + b.close, 0) / period;
    return { symbol, date, above20: above(20), above50: above(50), above200: above(200) };
  } catch { return { symbol, error: "FETCH_FAILED" }; }
}
