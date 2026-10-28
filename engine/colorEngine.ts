export function getSignalColor(value: number, max = 100) {

const pct = value / max;

if (pct >= 0.8) return "#52c41a"; // strong green
if (pct >= 0.6) return "#a0d911"; // light green
if (pct >= 0.4) return "#faad14"; // yellow
if (pct >= 0.2) return "#fa8c16"; // orange
return "#ff4d4f"; // red
}

export function getVixColor(vix: number) {
if (vix < 18) return "#52c41a";
if (vix < 25) return "#faad14";
return "#ff4d4f";
}
