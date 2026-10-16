import type { ResearchInstrument } from "./aiResearchInstrumentBriefs";

export const BULLISH_TRIGGERS = ["BULLISH_TURN", "UPTREND_CONTINUES", "STRENGTH_WITH_PARTICIPATION"] as const;
export const BEARISH_TRIGGERS = ["BEARISH_TURN", "DOWNTREND_CONTINUES", "FAILED_REBOUND"] as const;
export type ResearchTrigger = typeof BULLISH_TRIGGERS[number] | typeof BEARISH_TRIGGERS[number];

export function allowedResearchTriggers(instrument: ResearchInstrument, role: "confirmation" | "invalidation"): readonly ResearchTrigger[] {
  const bullish = instrument === "NASDAQ_PUT" ? role === "invalidation" : role === "confirmation";
  return bullish ? BULLISH_TRIGGERS : BEARISH_TRIGGERS;
}

/** Future observations, never claims that a condition has already occurred. */
export function renderResearchTrigger(instrument: ResearchInstrument, trigger: ResearchTrigger): { text: string; refs: string[] } {
  const index = instrument === "RUSSELL_CALL" ? "Russell" : "Nasdaq";
  const price = instrument === "RUSSELL_CALL" ? "PRICE_RUSSELL_2000" : "PRICE_NASDAQ";
  const labels: Record<ResearchTrigger, string> = {
    BULLISH_TURN: `${index}-Kurse drehen aufwärts und das eigene kurzfristige Momentum wird positiv.`,
    UPTREND_CONTINUES: `${index}-Kurse setzen ihren Anstieg fort und das eigene kurzfristige Momentum bleibt positiv.`,
    STRENGTH_WITH_PARTICIPATION: `${index}-Kurse gewinnen an Stärke, während eigenes Momentum und breite Marktteilnahme zunehmen.`,
    BEARISH_TURN: `${index}-Kurse drehen abwärts und das eigene kurzfristige Momentum wird negativ.`,
    DOWNTREND_CONTINUES: `${index}-Kurse setzen ihren Rückgang fort und das eigene kurzfristige Momentum bleibt negativ.`,
    FAILED_REBOUND: `${index}-Erholungen scheitern und das eigene kurzfristige Momentum bleibt negativ.`,
  };
  return { text: labels[trigger], refs: trigger === "STRENGTH_WITH_PARTICIPATION" ? [price, "APP"] : [price] };
}
