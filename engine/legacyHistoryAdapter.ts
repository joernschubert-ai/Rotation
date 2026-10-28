/** Preserve observation slots and units while exposing saved snapshot measurements
 * to the older structural engines. No scores or missing measurements are invented. */
export function legacyHistoryAdapter(history: any[]): any[] {
  const number = (value: any): number | undefined => {
    if (value && typeof value === "object") return number(value.value ?? value.score);
    if (typeof value !== "number" && typeof value !== "string") return undefined;
    if (typeof value === "string" && !value.trim()) return undefined;
    const n = Number(value); return Number.isFinite(n) ? n : undefined;
  };
  return history.map(s => ({
    ...s,
    breadth20: number(s.structure?.breadth?.b20 ?? s.breadth20),
    breadth50: number(s.structure?.breadth?.b50 ?? s.breadth50),
    breadth200: number(s.structure?.breadth?.b200 ?? s.breadth200),
    participationScore: number(s.participation?.score ?? s.participationScore),
    liquidityScore: number(s.liquidity?.score ?? s.liquidityScore),
    marketLiquidityScore: number(s.liquidity?.marketLiquidityScore ?? s.liquidity?.metrics?.liquidity ?? s.marketLiquidityScore),
    marketQualityScore: number(s.marketQuality?.score ?? s.marketQualityScore),
    leadershipBreadth: number(s.participation?.leadershipBreadth ?? s.leadershipBreadth),
    passiveDependence: number(s.participation?.passiveDependence ?? s.passiveDependence),
    rsSmall: number(s.rotation?.rsSmall ?? s.rsSmall),
    rsEqual: number(s.rotation?.rsEqual ?? s.rsEqual),
    rsGrowth: number(s.rotation?.rsGrowth ?? s.rsGrowth),
    growthBreadth: number(s.participation?.growthBreadth ?? s.growthBreadth),
    creditRatio: number(s.credit?.rawRatio ?? s.creditRatio),
  }));
}
