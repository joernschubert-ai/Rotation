export function formatScore(value: number, max: number = 100) {
return {
value: Math.round(value),
max,
pct: Math.round((value / max) * 100)
};
}

export function getScoreLabel(pct: number) {
if (pct >= 80) return "STRONG";
if (pct >= 60) return "BULLISH";
if (pct >= 40) return "NEUTRAL";
if (pct >= 20) return "WEAK";
return "RISK";
}