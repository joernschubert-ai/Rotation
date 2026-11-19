type Row = Record<string, unknown>;
export interface SequenceEvent { date: string; factor: string; direction: "UP" | "DOWN"; change: number | null; }
export interface SequenceAnalysis {
  version: "OBSERVED_FACTOR_SEQUENCE_V1";
  status: "AVAILABLE" | "INSUFFICIENT_COMPARABLE_HISTORY" | "VERSION_IDENTITY_UNKNOWN";
  observationCount: number;
  dateBasis: "NEW_YORK_CAPTURE_DATE_NOT_VERIFIED_EXCHANGE_SESSION";
  sequence: SequenceEvent[];
  latestValues: { breadth20: number | null; breadth50: number | null; nasdaq: number | null; rsi14: number | null; vix: number | null; smallVsTech: number | null };
  limitations: string[];
}
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

/** Describes observed direction changes only; it never assigns a score, trigger, or forecast. */
export function buildSequenceAnalysis(history: unknown): SequenceAnalysis {
  const snapshots = (Array.isArray(history) ? history : []).map(obj).filter(row => nyDate(row.timestamp) !== null)
    .sort((a, b) => Date.parse(String(a.timestamp)) - Date.parse(String(b.timestamp)));
  const current = snapshots[snapshots.length - 1];
  const latestValues = current ? { breadth20: breadth(current, "b20"), breadth50: breadth(current, "b50"), nasdaq: index(current, "nasdaq"), rsi14: rsi14(current), vix: index(current, "vix"), smallVsTech: relative(current) } : { breadth20: null, breadth50: null, nasdaq: null, rsi14: null, vix: null, smallVsTech: null };
  const unknown: SequenceAnalysis = { version: "OBSERVED_FACTOR_SEQUENCE_V1", status: "VERSION_IDENTITY_UNKNOWN", observationCount: 0, dateBasis: "NEW_YORK_CAPTURE_DATE_NOT_VERIFIED_EXCHANGE_SESSION", sequence: [], latestValues: { breadth20: round(latestValues.breadth20), breadth50: round(latestValues.breadth50), nasdaq: round(latestValues.nasdaq), rsi14: round(latestValues.rsi14), vix: round(latestValues.vix), smallVsTech: round(latestValues.smallVsTech) }, limitations: ["Modell-/Universitätsversion nicht vollständig belegt; keine übergreifende Sequenz gebildet."] };
  if (!current) return { ...unknown, status: "INSUFFICIENT_COMPARABLE_HISTORY", limitations: ["Keine datierten Snapshot-Beobachtungen verfügbar."] };
  const currentSignature = signature(current); if (!currentSignature) return unknown;
  let start = snapshots.length - 1;
  while (start > 0 && signature(snapshots[start - 1]) === currentSignature) start--;
  const comparable = snapshots.slice(start);
  const values = { breadth20: breadth(current, "b20"), breadth50: breadth(current, "b50"), nasdaq: index(current, "nasdaq"), rsi14: rsi14(current), vix: index(current, "vix"), smallVsTech: relative(current) };
  const base: SequenceAnalysis = { version: "OBSERVED_FACTOR_SEQUENCE_V1", status: comparable.length >= 2 ? "AVAILABLE" : "INSUFFICIENT_COMPARABLE_HISTORY", observationCount: comparable.length, dateBasis: "NEW_YORK_CAPTURE_DATE_NOT_VERIFIED_EXCHANGE_SESSION", sequence: [], latestValues: { breadth20: round(values.breadth20), breadth50: round(values.breadth50), nasdaq: round(values.nasdaq), rsi14: round(values.rsi14), vix: round(values.vix), smallVsTech: round(values.smallVsTech) }, limitations: ["Snapshots sind Beobachtungstage, keine verifizierten Börsensitzungen; ausgelassene Tage sind möglich.", "Richtungswechsel sind beschreibend. Reihenfolge und zeitliche Nähe belegen weder Vorhersagekraft noch Ursache.", "Keine Punktzahl, Einstiegsfreigabe, Positionsgröße oder historische Trefferquote wird daraus berechnet."] };
  if (comparable.length < 2) return base;
  const seen = new Map<string, "UP" | "DOWN">();
  const events: SequenceEvent[] = [];
  const add = (date: string | null, factor: string, delta: number | null) => {
    if (!date || delta === null || delta === 0) return;
    const direction = delta > 0 ? "UP" : "DOWN";
    if (seen.get(factor) === direction) return;
    seen.set(factor, direction);
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
  return { ...base, sequence: events.slice(-12) };
}
