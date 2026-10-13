export interface HistoryMetrics {
  breadthTrend: number;
  breadthAcceleration: number;
  participationTrend: number;
  participationDecay: number;
  rotationTrend: number;
  liquidityTrend: number;
  fragilityTrend: number;
  ndxPriceTrend: number;
  ndxMomentum5D: number;
  ndxMomentum20D: number;
  ndxAcceleration: number;
  spxPriceTrend: number;
  spxMomentum5D: number;
  spxMomentum20D: number;
  spxAcceleration: number;
  rutPriceTrend: number;
  rutMomentum5D: number;
  rutMomentum20D: number;
  rutAcceleration: number;
  priceMomentumScore: number;
  priceTrend: "STRONG_BULLISH" | "BULLISH" | "NEUTRAL" | "BEARISH" | "STRONG_BEARISH";
  leadershipTrend: number;
  leadershipDecay: number;
  relativeBreadthWeakness: number;
  crashTrend: number;
  persistenceScore: number;
  phasePersistence: number;
  daysInPhase: number;
  breadthWeakDays: number;
  participationWeakDays: number;
  rotationWeakDays: number;
  liquidityWeakDays: number;
  fragilityHighDays: number;
  distributionDays: number;
  institutionalPressure: number;
  rotationPersistence: number;
  liquidityPersistence: number;
  fragilityPersistence: number;
  dangerPersistence: number;
  executionPersistence: number;
  edgePersistence: number;
  acceleratingWeakness: boolean;
  persistentDistribution: boolean;
  prolongedBearRegime: boolean;
  marketCharacter: "EXPANSION" | "TRANSITION" | "DISTRIBUTION" | "BEAR";
  averageBreadth: number;
  averageParticipation: number;
  averageRotation: number;
  averageLiquidity: number;
  averageFragility: number;
  highestBreadth: number;
  lowestBreadth: number;
  highestRotation: number;
  lowestRotation: number;

  // Chronological daily observations: oldest first, newest last.
  history: any[];
  breadth20History: Array<number | null>;
  breadth50History: Array<number | null>;
  breadth200History: Array<number | null>;
  advanceDeclineHistory: Array<number | null>;
  participationHistory: Array<number | null>;
  rotationDecayHistory: Array<number | null>;
  spxHistory: Array<number | null>;
  ndxHistory: Array<number | null>;
  rutHistory: Array<number | null>;

  dataQuality: {
    priceAvailability: Record<string, { momentum5D: boolean; momentum20D: boolean; acceleration: boolean }>;
    rawSnapshots: number;
    validSnapshots: number;
    invalidSnapshots: number;
    dailyObservations: number;
    collapsedIntradaySnapshots: number;
    has5ObservationWindow: boolean;
    has20ObservationWindow: boolean;
    missingValues: Record<string, number>;
    timeBasis: "LATEST_PER_NEW_YORK_DATE";
  };
}

/* Missing values remain null internally. Zero is a valid measurement. */
function numeric(value: any): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of ["value", "score", "current"]) {
      const candidate = value[key];
      if (typeof candidate === "number" || typeof candidate === "string") {
        const parsed = numeric(candidate);
        if (parsed !== null) return parsed;
      }
    }
  }
  return null;
}

function read(snapshot: any, paths: string[]): number | null {
  for (const path of paths) {
    const value = path.split(".").reduce(
      (current: any, key: string) => current?.[key], snapshot
    );
    const parsed = numeric(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

const readers = {
  breadth20: (s: any) => read(s, ["structure.breadth.b20", "breadth20"]),
  breadth50: (s: any) => read(s, ["structure.breadth.b50", "breadth50"]),
  breadth200: (s: any) => read(s, ["structure.breadth.b200", "breadth200"]),
  ad: (s: any) => read(s, ["structure.advanceDecline", "advanceDecline"]),
  participation: (s: any) => read(s, ["participation.score", "participationScore"]),
  rotation: (s: any) => read(s, ["rotation.score", "rotationScore"]),
  liquidity: (s: any) => read(s, ["liquidity.score", "liquidityScore"]),
  fragility: (s: any) => read(s, ["fragility.score", "fragilityScore"]),
  leadership: (s: any) => read(s, ["participation.leadershipBreadth", "rotation.leadershipBreadth"]),
  crash: (s: any) => read(s, ["crash.probability", "crashProbability"]),
  master: (s: any) => read(s, ["master.score"]),
  highs: (s: any) => read(s, ["structure.highsLows.highs", "newHighs"]),
  danger: (s: any) => read(s, ["dangerZone.score"]),
  edge: (s: any) => read(s, ["edgeState.score"]),
  decay: (s: any) => read(s, ["rotationDecay.score", "rotationDecayScore"]),
  ndx: (s: any) => positive(read(s, ["indices.ndx", "indices.nasdaq", "indices.NASDAQ"])),
  spx: (s: any) => positive(read(s, ["indices.spx", "indices.sp500", "indices.SP500"])),
  rut: (s: any) => positive(read(s, ["indices.rut", "indices.russell", "indices.RUSSELL"]))
};

function positive(value: number | null): number | null {
  return value !== null && value > 0 ? value : null;
}

function phaseOf(s: any): string {
  const phase = s?.phase;
  if (typeof phase === "string") return phase;
  for (const key of ["phase", "name", "state"]) {
    if (typeof phase?.[key] === "string") return phase[key];
  }
  return "";
}

function isDistribution(s: any): boolean {
  const phase = phaseOf(s);
  const sub = s?.phase?.subPhase;
  return phase === "PHASE_3_DISTRIBUTION" || phase === "PHASE_4_RISK" ||
    sub === "INTERNAL_DISTRIBUTION" || sub === "STRUCTURAL_DISTRIBUTION" ||
    sub === "DISTRIBUTION" || s?.phase?.regimeState === "DISTRIBUTION";
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function difference(current: number | null, old: number | null): number {
  return current !== null && old !== null ? current - old : 0;
}

function priceReturn(current: number | null, old: number | null): number {
  return current !== null && old !== null && current > 0 && old > 0
    ? (current / old - 1) * 100 : 0;
}

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit"
});

// Same observed-date window as regimePersistenceEngine.
const PERSISTENCE_OBSERVATIONS = 21;

/*
 * One observation per New York calendar date, not a claimed exchange calendar.
 * Missing dates are not invented. 5D/20D mean 5/20 observed daily intervals.
 * Weekend snapshots are retained; the backend supplies no market-session date.
 * Intraday snapshots in storage are not modified or deleted by this function.
 */
export function historyEngine(history: any[]): HistoryMetrics {
  const raw = Array.isArray(history) ? history : [];
  const valid = raw.flatMap((snapshot: any) => {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return [];
    const timestamp = snapshot.timestamp;
    if (typeof timestamp !== "string" || timestamp.trim() === "") return [];
    if (!/(Z|[+-]\d{2}:\d{2})$/i.test(timestamp)) return [];
    const time = Date.parse(timestamp);
    return Number.isFinite(time) ? [{ snapshot, time }] : [];
  }).sort((a, b) => b.time - a.time);

  const perDate = new Map<string, any>();
  for (const item of valid) {
    const date = dateFormatter.format(new Date(item.time));
    if (!perDate.has(date)) perDate.set(date, item.snapshot);
  }
  const daily = Array.from(perDate.values()); // Newest first.
  const recent = daily.slice(0, PERSISTENCE_OBSERVATIONS);
  const chronological = [...daily].reverse();
  const newest = daily[0];
  const mid = daily[5];
  const oldest = daily[20];
  const has5 = daily.length >= 6;
  const has20 = daily.length >= 21;

  const missingValues: Record<string, number> = {};
  for (const [name, reader] of Object.entries(readers)) {
    missingValues[name] = daily.filter(s => reader(s) === null).length;
  }
  const series = (reader: (s: any) => number | null) => chronological.map(reader);
  const values = (reader: (s: any) => number | null) =>
    recent.map(reader).filter((n): n is number => n !== null);
  const average = (reader: (s: any) => number | null, fallback = 50) => {
    const list = values(reader);
    return list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length * 10) / 10 : fallback;
  };
  const count = (reader: (s: any) => number | null, predicate: (n: number) => boolean) =>
    recent.filter(s => { const n = reader(s); return n !== null && predicate(n); }).length;

  const breadthTrend = difference(readers.breadth50(newest), readers.breadth50(oldest));
  // Compatibility: this field remains the short-window change, not a second derivative.
  const breadthAcceleration = difference(readers.breadth50(newest), readers.breadth50(mid));
  const participationTrend = difference(readers.participation(newest), readers.participation(oldest));
  // Positive decay means deterioration. Participation decay uses new highs.
  const participationDecay = difference(readers.highs(oldest), readers.highs(newest));
  const leadershipTrend = difference(readers.leadership(newest), readers.leadership(oldest));
  const leadershipDecay = -leadershipTrend;
  const rotationTrend = difference(readers.rotation(newest), readers.rotation(oldest));
  const liquidityTrend = difference(readers.liquidity(newest), readers.liquidity(oldest));
  const fragilityTrend = difference(readers.fragility(newest), readers.fragility(oldest));
  const crashTrend = difference(readers.crash(newest), readers.crash(oldest));
  const relativeBreadthWeakness = difference(readers.breadth50(newest), readers.breadth20(newest));

  const ndxNewest = readers.ndx(newest);
  const ndxMid = readers.ndx(mid);
  const ndxOldest = readers.ndx(oldest);
  const spxNewest = readers.spx(newest);
  const spxMid = readers.spx(mid);
  const spxOldest = readers.spx(oldest);
  const rutNewest = readers.rut(newest);
  const rutMid = readers.rut(mid);
  const rutOldest = readers.rut(oldest);
  const priceAvailability = Object.fromEntries([
    ["ndx", ndxNewest, ndxMid, ndxOldest],
    ["spx", spxNewest, spxMid, spxOldest],
    ["rut", rutNewest, rutMid, rutOldest]
  ].map(([name, current, short, medium]) => [name, {
    momentum5D: current !== null && short !== null,
    momentum20D: current !== null && medium !== null,
    acceleration: current !== null && short !== null && medium !== null
  }])) as Record<string, { momentum5D: boolean; momentum20D: boolean; acceleration: boolean }>;
  const ndxMomentum5D = priceReturn(ndxNewest, ndxMid);
  const ndxMomentum20D = priceReturn(ndxNewest, ndxOldest);
  const spxMomentum5D = priceReturn(spxNewest, spxMid);
  const spxMomentum20D = priceReturn(spxNewest, spxOldest);
  const rutMomentum5D = priceReturn(rutNewest, rutMid);
  const rutMomentum20D = priceReturn(rutNewest, rutOldest);
  const ndxAcceleration = ndxNewest !== null && ndxMid !== null && ndxOldest !== null
    ? ndxMomentum5D - ndxMomentum20D / 4 : 0;
  const spxAcceleration = spxNewest !== null && spxMid !== null && spxOldest !== null
    ? spxMomentum5D - spxMomentum20D / 4 : 0;
  const rutAcceleration = rutNewest !== null && rutMid !== null && rutOldest !== null
    ? rutMomentum5D - rutMomentum20D / 4 : 0;
  let priceMomentumScore = 50;
  if (ndxNewest !== null && ndxMid !== null) priceMomentumScore += clamp(ndxMomentum5D * 2, -20, 20);
  if (ndxNewest !== null && ndxOldest !== null) priceMomentumScore += clamp(ndxMomentum20D, -15, 15);
  if (spxNewest !== null && spxMid !== null) priceMomentumScore += clamp(spxMomentum5D, -10, 10);
  if (rutNewest !== null && rutMid !== null) priceMomentumScore += clamp(rutMomentum5D, -5, 5);
  if (ndxAcceleration > 5) priceMomentumScore += 10;
  if (ndxAcceleration < -5) priceMomentumScore -= 10;
  priceMomentumScore = clamp(Math.round(priceMomentumScore));
  const priceTrend: HistoryMetrics["priceTrend"] =
    priceMomentumScore >= 75 && ndxMomentum5D >= 5 ? "STRONG_BULLISH" :
    priceMomentumScore >= 60 ? "BULLISH" :
    priceMomentumScore <= 25 && ndxMomentum5D <= -5 ? "STRONG_BEARISH" :
    priceMomentumScore <= 40 ? "BEARISH" : "NEUTRAL";

  let daysInPhase = 0;
  const newestPhase = phaseOf(newest);
  if (newestPhase) {
    for (const snapshot of daily) {
      if (phaseOf(snapshot) !== newestPhase) break;
      daysInPhase++;
    }
  }
  let currentDistributionStreak = 0;
  for (const snapshot of daily) {
    if (!isDistribution(snapshot)) break;
    currentDistributionStreak++;
  }
  const breadthWeakDays = count(readers.breadth50, n => n < 55);
  const participationWeakDays = count(readers.participation, n => n < 60);
  const rotationWeakDays = count(readers.rotation, n => n < 60);
  const liquidityWeakDays = count(readers.liquidity, n => n < 55);
  const fragilityHighDays = count(readers.fragility, n => n > 60);
  const distributionDays = recent.filter(isDistribution).length;
  const dangerPersistence = count(readers.danger, n => n > 60);
  const edgePersistence = count(readers.edge, n => n < 40);
  // Count explicit risk states. Confidence is not a replacement for a risk score.
  const executionPersistence = recent.filter(s => {
    const risk = s?.executionState?.riskState;
    if (typeof risk === "string") {
      return ["FRAGILE", "INTERNAL_BREAKDOWN", "BREAKDOWN", "CRISIS"].includes(risk);
    }
    const legacy = read(s, ["executionState.score"]);
    return legacy !== null && legacy < 40;
  }).length;

  const averageBreadth = average(readers.breadth50);
  const averageParticipation = average(readers.participation);
  const averageRotation = average(readers.rotation);
  const averageLiquidity = average(readers.liquidity);
  const averageFragility = average(readers.fragility);
  const institutionalPressure = clamp(Math.round(
    Math.min(distributionDays * 4, 30) + Math.min(breadthWeakDays * 3, 20) +
    Math.min(participationWeakDays * 3, 15) + Math.min(rotationWeakDays * 2, 10) +
    Math.min(liquidityWeakDays * 2, 10) + Math.min(fragilityHighDays * 2, 15)
  ));
  const currentFragility = readers.fragility(newest);
  const currentLiquidity = readers.liquidity(newest);
  const currentParticipation = readers.participation(newest);
  const acceleratingWeakness =
    (breadthWeakDays >= 5 && participationWeakDays >= 5 &&
      (breadthTrend < -1 || participationTrend < -1 || breadthAcceleration < -1)) ||
    (currentFragility !== null && currentLiquidity !== null && currentParticipation !== null &&
      currentFragility > 75 && currentLiquidity < 40 && currentParticipation < 50);
  const persistentDistribution = distributionDays >= 7 || currentDistributionStreak >= 5;
  const prolongedBearRegime = distributionDays >= 15 && (
    (values(readers.breadth50).length > 0 && averageBreadth < 55) ||
    (values(readers.participation).length > 0 && averageParticipation < 55) ||
    (values(readers.fragility).length > 0 && averageFragility > 65)
  );
  const marketCharacter: HistoryMetrics["marketCharacter"] = prolongedBearRegime ? "BEAR" :
    persistentDistribution ? "DISTRIBUTION" : institutionalPressure > 35 ? "TRANSITION" : "EXPANSION";
  // Historical extremes still describe the complete supplied archive.
  const breadthValues = daily.map(readers.breadth50).filter((n): n is number => n !== null);
  const rotationValues = daily.map(readers.rotation).filter((n): n is number => n !== null);

  return {
    breadthTrend, breadthAcceleration, participationTrend, participationDecay,
    rotationTrend, liquidityTrend, fragilityTrend,
    ndxPriceTrend: ndxMomentum20D, ndxMomentum5D, ndxMomentum20D, ndxAcceleration,
    spxPriceTrend: spxMomentum20D, spxMomentum5D, spxMomentum20D, spxAcceleration,
    rutPriceTrend: rutMomentum20D, rutMomentum5D, rutMomentum20D, rutAcceleration,
    priceMomentumScore, priceTrend, leadershipTrend, leadershipDecay,
    relativeBreadthWeakness, crashTrend,
    persistenceScore: readers.master(newest) ?? 0,
    phasePersistence: daysInPhase, daysInPhase,
    breadthWeakDays, participationWeakDays, rotationWeakDays, liquidityWeakDays,
    fragilityHighDays, distributionDays, institutionalPressure,
    rotationPersistence: values(readers.rotation).length ? clamp(100 - rotationWeakDays * 5) : 50,
    liquidityPersistence: values(readers.liquidity).length ? clamp(100 - liquidityWeakDays * 5) : 50,
    fragilityPersistence: clamp(fragilityHighDays * 6),
    dangerPersistence, executionPersistence, edgePersistence,
    acceleratingWeakness, persistentDistribution, prolongedBearRegime, marketCharacter,
    averageBreadth, averageParticipation, averageRotation, averageLiquidity, averageFragility,
    highestBreadth: breadthValues.length ? Math.max(...breadthValues) : 50,
    lowestBreadth: breadthValues.length ? Math.min(...breadthValues) : 50,
    highestRotation: rotationValues.length ? Math.max(...rotationValues) : 50,
    lowestRotation: rotationValues.length ? Math.min(...rotationValues) : 50,
    history: chronological,
    breadth20History: series(readers.breadth20), breadth50History: series(readers.breadth50),
    breadth200History: series(readers.breadth200), advanceDeclineHistory: series(readers.ad),
    participationHistory: series(readers.participation), rotationDecayHistory: series(readers.decay),
    spxHistory: series(readers.spx), ndxHistory: series(readers.ndx), rutHistory: series(readers.rut),
    dataQuality: {
      priceAvailability,
      rawSnapshots: raw.length, validSnapshots: valid.length,
      invalidSnapshots: raw.length - valid.length, dailyObservations: daily.length,
      collapsedIntradaySnapshots: valid.length - daily.length,
      has5ObservationWindow: has5, has20ObservationWindow: has20,
      missingValues, timeBasis: "LATEST_PER_NEW_YORK_DATE"
    }
  };
}
