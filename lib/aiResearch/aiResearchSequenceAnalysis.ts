type Row = Record<string, unknown>;
export interface SequenceEvent { date: string; factor: string; direction: "UP" | "DOWN"; change: number | null; }
export interface SequenceAnalysis {
  version: "OBSERVED_FACTOR_SEQUENCE_V1";
  status: "AVAILABLE" | "INSUFFICIENT_COMPARABLE_HISTORY" | "VERSION_IDENTITY_UNKNOWN";
  asOfDate: string | null;
  observationCount: number;
  dateBasis: "NEW_YORK_CAPTURE_DATE_NOT_VERIFIED_EXCHANGE_SESSION";
  sequence: SequenceEvent[];
  latestValues: { breadth20: number | null; breadth50: number | null; nasdaq: number | null; rsi14: number | null; vix: number | null; smallVsTech: number | null };
  limitations: string[];
  historicalMatches: HistoricalSequenceMatch[];
}
export interface HistoricalSequenceMatch { instrument: "NASDAQ_PUT" | "NASDAQ_CALL" | "RUSSELL_CALL"; patternId: string; label: string; evidenceDates: string[]; summary: string; }
const obj = (value: unknown): Row => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const finite = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
function numeric(value: unknown): number | null {
  const direct = finite(value); if (direct !== null) return direct;
  const row = obj(value);
  for (const key of ["value", "close", "current", "price", "regularMarketPrice"]) {
    const candidate = finite(row[key]); if (candidate !== null) return candidate;
  }
  return null;
}
function signature(snapshot: Row): string | null {
  const universe = obj(snapshot.breadthDataQuality).universeVersion;
  const versions = obj(snapshot.calculationVersions);
  const keys = ["history", "master", "rotation", "liquidity", "rotationDecay", "participation", "marketQuality", "fragility"];
  const values = keys.map(key => versions[key]);
  if (typeof universe !== "string" || !universe.trim() || !values.every(value => typeof value === "string" && value.trim())) return null;
  return JSON.stringify([universe, ...values]);
}
function nyDate(timestamp: unknown): string | null {
  if (typeof timestamp !== "string" || !Number.isFinite(Date.parse(timestamp))) return null;
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(timestamp)); }
  catch { return null; }
}
function breadth(snapshot: Row, key: "b20" | "b50"): number | null {
  const value = numeric(obj(obj(snapshot.structure).breadth)[key]);
  return value !== null && value >= 0 && value <= 1 ? value * 100 : value;
}
function index(snapshot: Row, key: "nasdaq" | "vix"): number | null { return numeric(obj(snapshot.indices)[key]); }
function rsi14(snapshot: Row): number | null {
  const ndx = obj(obj(snapshot.priceMomentum).ndx);
  for (const key of ["rsi14", "rsi14Value", "rsi", "rsiValue"]) { const value = numeric(ndx[key]); if (value !== null) return value; }
  return null;
}
function relative(snapshot: Row): number | null {
  const leadership = obj(snapshot.relativeLeadership);
  for (const key of ["smallVsTech20Pp", "smallVsTech20D", "smallVsTech20", "rsSmall20", "smallVsTech", "rsSmall"]) {
    const value = numeric(leadership[key]); if (value !== null) return value;
  }
  return numeric(obj(snapshot.rotation).rsSmall);
}
function move(previous: number | null, current: number | null, percent = false): number | null {
  if (previous === null || current === null || previous === 0) return null;
  return percent ? (current / previous - 1) * 100 : current - previous;
}
const round = (value: number | null) => value === null ? null : Number(value.toFixed(3));

/** Conservative, dated sequence fingerprints; these add one anticyclical area, never an entry rule. */
function matchHistoricalSequences(events: SequenceEvent[], asOfDate: string | null): HistoricalSequenceMatch[] {
  if (!asOfDate || !Number.isFinite(Date.parse(asOfDate + "T00:00:00Z"))) return [];
  const age = (date: string) => (Date.parse(asOfDate + "T00:00:00Z") - Date.parse(date + "T00:00:00Z")) / 86400000;
  const recent = events.filter(e => Number.isFinite(Date.parse(e.date + "T00:00:00Z")) && age(e.date) >= 0 && age(e.date) <= 60 && typeof e.change === "number");
  const isFresh = (e: SequenceEvent) => age(e.date) <= 5;
  const rows = (factor: string, direction: SequenceEvent["direction"], test: (change: number) => boolean) => recent.filter(e => e.factor === factor && e.direction === direction && e.change !== null && test(e.change));
  const after = (a: SequenceEvent, b: SequenceEvent, days: number) => b.date >= a.date && (Date.parse(b.date + "T00:00:00Z") - Date.parse(a.date + "T00:00:00Z")) <= days * 86400000;
  const matches: HistoricalSequenceMatch[] = [];
  const declines = rows("NASDAQ_INDEX_OBSERVATION", "DOWN", n => n <= -2);
  const stress = rows("VIX_LEVEL", "UP", n => n >= 8);
  const turns = [
    ...rows("NASDAQ_INDEX_OBSERVATION", "UP", n => n >= 1),
    ...rows("VIX_LEVEL", "DOWN", n => n <= -8),
    ...rows("BREADTH20", "UP", n => n >= 5),
    ...rows("BREADTH50", "UP", n => n >= 5),
  ];
  const call = declines.some(d => stress.some(v => after(d, v, 10) && turns.some(t => after(v, t, 10) && isFresh(t))));
  if (call) {
    const chosen = declines.find(d => stress.some(v => after(d, v, 10) && turns.some(t => after(v, t, 10) && isFresh(t))));
    const v = stress.find(x => chosen && after(chosen, x, 10) && turns.some(t => after(x, t, 10) && isFresh(t)));
    const t = v && turns.find(x => after(v, x, 10) && isFresh(x));
    if (chosen && v && t) matches.push({ instrument: "NASDAQ_CALL", patternId: "STRESS_THEN_FIRST_TURN", label: "Stress → erste Gegenbewegung", evidenceDates: [...new Set([chosen.date, v.date, t.date])], summary: `Nach einem Nasdaq-Rückgang folgten VIX-Stress und ein erstes Umkehrzeichen (${chosen.date} → ${v.date} → ${t.date}); das ergänzt die frühe Call-Abwägung.` });
  }
  const breadthRepair = rows("BREADTH50", "UP", n => n >= 5);
  const relativeLead = rows("SMALL_VS_TECH", "UP", n => n >= 1);
  const russellDecline = declines.find(d => breadthRepair.some(b => after(d, b, 30) && relativeLead.some(r => after(b, r, 30) && isFresh(r))));
  if (russellDecline) {
    const b = breadthRepair.find(x => after(russellDecline, x, 30) && relativeLead.some(r => after(x, r, 30) && isFresh(r)));
    const r = b && relativeLead.find(x => after(b, x, 30) && isFresh(x));
    if (b && r) matches.push({ instrument: "RUSSELL_CALL", patternId: "BREADTH_THEN_SMALL_LEADERSHIP", label: "Breitenreparatur → Small-Cap-Führung", evidenceDates: [...new Set([russellDecline.date, b.date, r.date])], summary: `Nach Nasdaq-Schwäche verbesserten sich Breite und Small-vs-Tech nacheinander (${russellDecline.date} → ${b.date} → ${r.date}); das ergänzt die frühe Russell-Call-Abwägung.` });
  }
  const rallies = rows("NASDAQ_INDEX_OBSERVATION", "UP", n => n >= 2);
  const breadthWeakening = [...rows("BREADTH20", "DOWN", n => n <= -5), ...rows("BREADTH50", "DOWN", n => n <= -5)];
  const putRally = rallies.find(p => breadthWeakening.some(b => after(p, b, 10) && stress.some(v => after(b, v, 7) && isFresh(v))));
  if (putRally) {
    const b = breadthWeakening.find(x => after(putRally, x, 10) && stress.some(v => after(x, v, 7) && isFresh(v)));
    const v = b && stress.find(x => after(b, x, 7) && isFresh(x));
    if (b && v) matches.push({ instrument: "NASDAQ_PUT", patternId: "RALLY_THEN_BREADTH_FAILURE", label: "Erholung → Breitenabbruch → Volatilitätsstress", evidenceDates: [...new Set([putRally.date, b.date, v.date])], summary: `Auf einen Nasdaq-Anstieg folgten Breitenverschlechterung und VIX-Stress (${putRally.date} → ${b.date} → ${v.date}); das ergänzt die frühe Put-Abwägung.` });
  }
  return matches;
}

/** Describes observed direction changes only; it never assigns a score, trigger, or forecast. */
export function buildSequenceAnalysis(history: unknown): SequenceAnalysis {
  const snapshots = (Array.isArray(history) ? history : []).map(obj).filter(row => nyDate(row.timestamp) !== null)
    .sort((a, b) => Date.parse(String(a.timestamp)) - Date.parse(String(b.timestamp)));
  const current = snapshots[snapshots.length - 1];
  const latestValues = current ? { breadth20: breadth(current, "b20"), breadth50: breadth(current, "b50"), nasdaq: index(current, "nasdaq"), rsi14: rsi14(current), vix: index(current, "vix"), smallVsTech: relative(current) } : { breadth20: null, breadth50: null, nasdaq: null, rsi14: null, vix: null, smallVsTech: null };
  const unknown: SequenceAnalysis = { version: "OBSERVED_FACTOR_SEQUENCE_V1", status: "VERSION_IDENTITY_UNKNOWN", asOfDate: current ? nyDate(current.timestamp) : null, observationCount: 0, dateBasis: "NEW_YORK_CAPTURE_DATE_NOT_VERIFIED_EXCHANGE_SESSION", sequence: [], latestValues: { breadth20: round(latestValues.breadth20), breadth50: round(latestValues.breadth50), nasdaq: round(latestValues.nasdaq), rsi14: round(latestValues.rsi14), vix: round(latestValues.vix), smallVsTech: round(latestValues.smallVsTech) }, limitations: ["Modell-/Universitätsversion nicht vollständig belegt; keine übergreifende Sequenz gebildet."], historicalMatches: [] };
  if (!current) return { ...unknown, status: "INSUFFICIENT_COMPARABLE_HISTORY", limitations: ["Keine datierten Snapshot-Beobachtungen verfügbar."] };
  const currentSignature = signature(current); if (!currentSignature) return unknown;
  let start = snapshots.length - 1;
  while (start > 0 && signature(snapshots[start - 1]) === currentSignature) start--;
  const comparable = snapshots.slice(start);
  const values = { breadth20: breadth(current, "b20"), breadth50: breadth(current, "b50"), nasdaq: index(current, "nasdaq"), rsi14: rsi14(current), vix: index(current, "vix"), smallVsTech: relative(current) };
  const currentDate = nyDate(current.timestamp);
  const base: SequenceAnalysis = { version: "OBSERVED_FACTOR_SEQUENCE_V1", status: comparable.length >= 2 ? "AVAILABLE" : "INSUFFICIENT_COMPARABLE_HISTORY", asOfDate: currentDate, observationCount: comparable.length, dateBasis: "NEW_YORK_CAPTURE_DATE_NOT_VERIFIED_EXCHANGE_SESSION", sequence: [], latestValues: { breadth20: round(values.breadth20), breadth50: round(values.breadth50), nasdaq: round(values.nasdaq), rsi14: round(values.rsi14), vix: round(values.vix), smallVsTech: round(values.smallVsTech) }, limitations: ["Snapshots sind Beobachtungstage, keine verifizierten Börsensitzungen; ausgelassene Tage sind möglich.", "Richtungswechsel sind beschreibend. Reihenfolge und zeitliche Nähe belegen weder Vorhersagekraft noch Ursache.", "Keine Punktzahl, Einstiegsfreigabe, Positionsgröße oder historische Trefferquote wird daraus berechnet."], historicalMatches: [] };
  if (comparable.length < 2) return base;
  const events: SequenceEvent[] = [];
  const add = (date: string | null, factor: string, delta: number | null) => {
    if (!date || delta === null || delta === 0) return;
    const noiseFloor: Record<string, number> = { BREADTH20: 3, BREADTH50: 3, NASDAQ_INDEX_OBSERVATION: 1, NASDAQ_RSI14: 3, VIX_LEVEL: 3, SMALL_VS_TECH: 0.5 };
    if (Math.abs(delta) < (noiseFloor[factor] ?? 0)) return;
    const direction = delta > 0 ? "UP" : "DOWN";
    events.push({ date, factor, direction, change: round(delta) });
  };
  for (let i = 1; i < comparable.length; i++) {
    const previous = comparable[i - 1], next = comparable[i], date = nyDate(next.timestamp);
    add(date, "BREADTH20", move(breadth(previous, "b20"), breadth(next, "b20")));
    add(date, "BREADTH50", move(breadth(previous, "b50"), breadth(next, "b50")));
    add(date, "NASDAQ_INDEX_OBSERVATION", move(index(previous, "nasdaq"), index(next, "nasdaq"), true));
    add(date, "NASDAQ_RSI14", move(rsi14(previous), rsi14(next)));
    add(date, "VIX_LEVEL", move(index(previous, "vix"), index(next, "vix"), true));
    add(date, "SMALL_VS_TECH", move(relative(previous), relative(next)));
  }
  const sequence = events.slice(-36);
  return { ...base, sequence, historicalMatches: matchHistoricalSequences(sequence, currentDate) };
}
