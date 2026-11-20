type Row = Record<string, unknown>;
export interface SequenceEvent { date: string; factor: string; direction: "UP" | "DOWN"; change: number | null; }
export interface SequenceAnalysis {
  version: "OBSERVED_FACTOR_SEQUENCE_V2";
  status: "AVAILABLE" | "INSUFFICIENT_COMPARABLE_HISTORY" | "VERSION_IDENTITY_UNKNOWN";
  asOfDate: string | null;
  observationCount: number;
  dateBasis: "NEW_YORK_CAPTURE_DATE_NOT_VERIFIED_EXCHANGE_SESSION";
  sequence: SequenceEvent[];
  latestValues: { breadth20: number | null; breadth50: number | null; nasdaq: number | null; rsi14: number | null; vix: number | null; smallVsTech: number | null; smallVsTech20: number | null; smallVsTech60: number | null };
  limitations: string[];
  historicalMatches: HistoricalSequenceMatch[];
  russellAbsoluteConfirmation?: {
    status: "CONFIRMED" | "NOT_MET" | "UNAVAILABLE";
    nasdaqFiveIntervalReturnPct: number | null;
    russellFiveIntervalReturnPct: number | null;
    fromDate: string | null;
    toDate: string | null;
    rule: "RUSSELL_5D_NONNEGATIVE_AND_NASDAQ_5D_NEGATIVE";
  };
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
function relative(snapshot: Row, horizon: 20 | 60 = 20): number | null {
  const leadership = obj(snapshot.relativeLeadership);
  const smallVsTech = obj(leadership.smallVsTech);
  const nestedValue = numeric(smallVsTech[horizon === 20 ? "relativeReturnDifference20Pp" : "relativeReturnDifference60Pp"]);
  if (nestedValue !== null) return nestedValue;
  const keys = horizon === 20
    ? ["smallVsTech20Pp", "smallVsTech20D", "smallVsTech20", "rsSmall20", "smallVsTech", "rsSmall"]
    : ["smallVsTech60Pp", "smallVsTech60D", "smallVsTech60", "rsSmall60"];
  for (const key of keys) {
    const value = numeric(leadership[key]); if (value !== null) return value;
  }
  const details = obj(snapshot.rotationDetails);
  const detailValue = numeric(details[horizon === 20 ? "rsSmall20" : "rsSmall60"]);
  if (detailValue !== null && details[horizon === 20 ? "rsSmall20Available" : "rsSmall60Available"] === true) return detailValue * 100;
  // The normalized engine rotation stores the 20-interval relative return as a ratio (1 = parity).
  const rotation = obj(snapshot.rotation);
  const ratio = numeric(rotation[horizon === 20 ? "rsSmall" : "rsSmall60"]);
  return horizon === 20 && ratio !== null ? (ratio - 1) * 100 : null;
}
function move(previous: number | null, current: number | null, percent = false): number | null {
  if (previous === null || current === null || previous === 0) return null;
  return percent ? (current / previous - 1) * 100 : current - previous;
}
const round = (value: number | null) => value === null ? null : Number(value.toFixed(3));

/** Conservative, dated sequence fingerprints; these add one anticyclical area, never an entry rule. */
function matchHistoricalSequences(events: SequenceEvent[], asOfDate: string | null, current: SequenceAnalysis["latestValues"]): HistoricalSequenceMatch[] {
  if (!asOfDate || !Number.isFinite(Date.parse(asOfDate + "T00:00:00Z"))) return [];
  const age = (date: string) => (Date.parse(asOfDate + "T00:00:00Z") - Date.parse(date + "T00:00:00Z")) / 86400000;
  const recent = events.filter(e => Number.isFinite(Date.parse(e.date + "T00:00:00Z")) && age(e.date) >= 0 && age(e.date) <= 90 && typeof e.change === "number");
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
  const call = declines.some(d => stress.some(v => after(d, v, 20) && turns.some(t => after(v, t, 20) && isFresh(t))));
  if (call) {
    const d = declines.find(x => stress.some(v => after(x, v, 20) && turns.some(t => after(v, t, 20) && isFresh(t))));
    const v = stress.find(x => d && after(d, x, 20) && turns.some(t => after(x, t, 20) && isFresh(t)));
    const t = v && turns.find(x => after(v, x, 20) && isFresh(x));
    if (d && v && t) matches.push({ instrument: "NASDAQ_CALL", patternId: "STRESS_THEN_FIRST_TURN", label: "Stress → erste Gegenbewegung", evidenceDates: [...new Set([d.date, v.date, t.date])], summary: `Nach einem Nasdaq-Rückgang folgten VIX-Stress und ein erstes Umkehrzeichen (${d.date} → ${v.date} → ${t.date}); das ergänzt die frühe Call-Abwägung.` });
  }
  const breadthRepair = [...rows("BREADTH20", "UP", n => n >= 5), ...rows("BREADTH50", "UP", n => n >= 5)];
  if (!call) {
    const d = declines.find(x => breadthRepair.some(b => after(x, b, 30) && isFresh(b)));
    const b = d && breadthRepair.find(x => after(d, x, 30) && isFresh(x));
    if (d && b) matches.push({ instrument: "NASDAQ_CALL", patternId: "DRAWDOWN_THEN_BREADTH_REPAIR", label: "Nasdaq-Rückgang → Breitenreparatur", evidenceDates: [...new Set([d.date, b.date])], summary: `Nach Nasdaq-Schwäche verbesserte sich die Breite (${d.date} → ${b.date}); ein früher Call-Gegenhinweis, noch keine bestätigte Trendwende.` });
  }

  // A positive short window while the longer window remains negative is the mixed-horizon catch-up state.
  // Do not require the initial zero-cross to be inside the short retained snapshot window.
  if (current.smallVsTech20 !== null && current.smallVsTech20 > 0 && current.smallVsTech60 !== null && current.smallVsTech60 < 0) {
    matches.push({ instrument: "RUSSELL_CALL", patternId: "SMALL_CAP_CATCHUP_AFTER_LAG", label: "Kurzfristige Russell-Führung, längerer Vergleich noch negativ", evidenceDates: [asOfDate], summary: `Small-vs-Tech 20D +${current.smallVsTech20.toFixed(2)} Pp., 60D ${current.smallVsTech60.toFixed(2)} Pp.: Russell lag längerfristig noch, liegt im kurzen Vergleich aber vorn. Snapshot-/ETF-Balkendatum nicht verifiziert; relativer Beobachtungshinweis, kein absolutes Kaufsignal.` });
  }

  const rallies = rows("NASDAQ_INDEX_OBSERVATION", "UP", n => n >= 2);
  const declinesAfterRally = rows("NASDAQ_INDEX_OBSERVATION", "DOWN", n => n <= -2);
  const breadthWeakening = [...rows("BREADTH20", "DOWN", n => n <= -5), ...rows("BREADTH50", "DOWN", n => n <= -5)];
  const putRally = rallies.find(p => breadthWeakening.some(b => after(p, b, 30) && declinesAfterRally.some(d => after(b, d, 20) && stress.some(v => after(d, v, 10) && isFresh(v)))));
  if (putRally) {
    const b = breadthWeakening.find(x => after(putRally, x, 30) && declinesAfterRally.some(d => after(x, d, 20) && stress.some(v => after(d, v, 10) && isFresh(v))));
    const d = b && declinesAfterRally.find(x => after(b, x, 20) && stress.some(v => after(x, v, 10) && isFresh(v)));
    const v = d && stress.find(x => after(d, x, 10) && isFresh(x));
    if (b && d && v) matches.push({ instrument: "NASDAQ_PUT", patternId: "RALLY_THEN_BREADTH_FAILURE", label: "Erholung → Breitenabbruch → Verkaufsdruck", evidenceDates: [...new Set([putRally.date, b.date, d.date, v.date])], summary: `Auf Nasdaq-Stärke folgten schwächere Breite, erneuter Kursdruck und VIX-Anstieg (${putRally.date} → ${b.date} → ${d.date} → ${v.date}); das ergänzt die frühe Put-Abwägung.` });
  }
  if (!putRally) {
    const b20 = rows("BREADTH20", "DOWN", n => n <= -5);
    const b50 = rows("BREADTH50", "DOWN", n => n <= -5);
    const p = rallies.find(x => b20.some(a => after(x, a, 30) && isFresh(a)) && b50.some(a => after(x, a, 30) && isFresh(a)));
    if (p) {
      const dates = [...new Set([...b20, ...b50].filter(x => after(p, x, 30) && isFresh(x)).map(x => x.date))];
      matches.push({ instrument: "NASDAQ_PUT", patternId: "RALLY_WITH_NARROWING_BREADTH", label: "Nasdaq-Stärke bei schmaler werdender Breite", evidenceDates: [...new Set([p.date, ...dates])], summary: `Der Nasdaq stieg, während sowohl 20- als auch 50-Intervall-Breite deutlich nachließen (${p.date} → ${dates.join(" / ")}); ein Warnhinweis auf schmale Marktführung, kein Put-Auftrag.` });
    }
  }
  return ["NASDAQ_PUT", "NASDAQ_CALL", "RUSSELL_CALL"].flatMap(instrument => {
    const match = matches.find(item => item.instrument === instrument);
    return match ? [match] : [];
  });
}

/** Describes observed direction changes only; it never assigns a score, trigger, or forecast. */
export function buildSequenceAnalysis(history: unknown): SequenceAnalysis {
  const snapshots = (Array.isArray(history) ? history : []).map(obj).filter(row => nyDate(row.timestamp) !== null)
    .sort((a, b) => Date.parse(String(a.timestamp)) - Date.parse(String(b.timestamp)));
  const current = snapshots[snapshots.length - 1];
  const latestValues = current ? { breadth20: breadth(current, "b20"), breadth50: breadth(current, "b50"), nasdaq: index(current, "nasdaq"), rsi14: rsi14(current), vix: index(current, "vix"), smallVsTech: relative(current, 20), smallVsTech20: relative(current, 20), smallVsTech60: relative(current, 60) } : { breadth20: null, breadth50: null, nasdaq: null, rsi14: null, vix: null, smallVsTech: null, smallVsTech20: null, smallVsTech60: null };
  const unknown: SequenceAnalysis = { version: "OBSERVED_FACTOR_SEQUENCE_V2", status: "VERSION_IDENTITY_UNKNOWN", asOfDate: current ? nyDate(current.timestamp) : null, observationCount: 0, dateBasis: "NEW_YORK_CAPTURE_DATE_NOT_VERIFIED_EXCHANGE_SESSION", sequence: [], latestValues: { breadth20: round(latestValues.breadth20), breadth50: round(latestValues.breadth50), nasdaq: round(latestValues.nasdaq), rsi14: round(latestValues.rsi14), vix: round(latestValues.vix), smallVsTech: round(latestValues.smallVsTech), smallVsTech20: round(latestValues.smallVsTech20), smallVsTech60: round(latestValues.smallVsTech60) }, limitations: ["Modell-/Universitätsversion nicht vollständig belegt; keine übergreifende Sequenz gebildet."], historicalMatches: [] };
  if (!current) return { ...unknown, status: "INSUFFICIENT_COMPARABLE_HISTORY", limitations: ["Keine datierten Snapshot-Beobachtungen verfügbar."] };
  const currentSignature = signature(current); if (!currentSignature) return unknown;
  let start = snapshots.length - 1;
  while (start > 0 && signature(snapshots[start - 1]) === currentSignature) start--;
  const comparable = snapshots.slice(start);
  const values = { breadth20: breadth(current, "b20"), breadth50: breadth(current, "b50"), nasdaq: index(current, "nasdaq"), rsi14: rsi14(current), vix: index(current, "vix"), smallVsTech: relative(current, 20), smallVsTech20: relative(current, 20), smallVsTech60: relative(current, 60) };
  const currentDate = nyDate(current.timestamp);
  const base: SequenceAnalysis = { version: "OBSERVED_FACTOR_SEQUENCE_V2", status: comparable.length >= 2 ? "AVAILABLE" : "INSUFFICIENT_COMPARABLE_HISTORY", asOfDate: currentDate, observationCount: comparable.length, dateBasis: "NEW_YORK_CAPTURE_DATE_NOT_VERIFIED_EXCHANGE_SESSION", sequence: [], latestValues: { breadth20: round(values.breadth20), breadth50: round(values.breadth50), nasdaq: round(values.nasdaq), rsi14: round(values.rsi14), vix: round(values.vix), smallVsTech: round(values.smallVsTech), smallVsTech20: round(values.smallVsTech20), smallVsTech60: round(values.smallVsTech60) }, limitations: ["Snapshots sind Beobachtungstage, keine verifizierten Börsensitzungen; ausgelassene Tage sind möglich.", "Richtungswechsel sind beschreibend. Reihenfolge und zeitliche Nähe belegen weder Vorhersagekraft noch Ursache.", "Keine Punktzahl, Einstiegsfreigabe, Positionsgröße oder historische Trefferquote wird daraus berechnet."], historicalMatches: [] };
  if (comparable.length < 2) return base;
  const events: SequenceEvent[] = [];
  const add = (date: string | null, factor: string, delta: number | null) => {
    if (!date || delta === null || delta === 0) return;
    const noiseFloor: Record<string, number> = { BREADTH20: 3, BREADTH50: 3, NASDAQ_INDEX_OBSERVATION: 1, NASDAQ_RSI14: 3, VIX_LEVEL: 3, SMALL_VS_TECH_20: 0.5, SMALL_VS_TECH_60: 0.5 };
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
    const previous20 = relative(previous, 20), next20 = relative(next, 20);
    const previous60 = relative(previous, 60), next60 = relative(next, 60);
    add(date, "SMALL_VS_TECH_20", move(previous20, next20));
    add(date, "SMALL_VS_TECH_60", move(previous60, next60));
    if (date && previous20 !== null && next20 !== null && previous20 <= 0 && next20 > 0) events.push({ date, factor: "SMALL_VS_TECH_20_CROSS", direction: "UP", change: round(next20 - previous20) });
  }
  // Retain enough dated observations to preserve multi-step patterns across several weeks.
  const sequence = events.slice(-90);
  return { ...base, sequence, historicalMatches: matchHistoricalSequences(sequence, currentDate, base.latestValues) };
}
