export type PriceTrend = "STRONG_BULLISH" | "BULLISH" | "NEUTRAL" | "BEARISH" | "STRONG_BEARISH";
export type PriceDirection = "UP" | "DOWN" | "FLAT";
export type PriceMomentumState = "STRONG_BULLISH" | "BULLISH" | "BULLISH_COOLING" | "NEUTRAL" | "BEARISH_BUILDING" | "BEARISH" | "STRONG_BEARISH";
export type PriceStructureAlignment = "CONFIRMED_BULLISH" | "BULLISH" | "NEUTRAL" | "CONFLICT" | "BEARISH" | "CONFIRMED_BEARISH";

export interface PriceMomentumInput {
  historyMetrics?: any;
  indices?: {
    ndx?: { value?: number; change?: number };
    spx?: { value?: number; change?: number };
    rut?: { value?: number; change?: number };
  };
  rotation?: any;
  structure?: any;
  participation?: any;
  breadthThrust?: any;
  liquidity?: any;
  fragility?: any;
  crash?: any;
}

interface IndexMomentum {
  dataQuality: { momentum5DAvailable: boolean; momentum20DAvailable: boolean; accelerationAvailable: boolean; measured: { momentum5D: number | null; momentum20D: number | null; acceleration: number | null }; source: string };
  value: number;
  momentum5D: number;
  momentum20D: number;
  acceleration: number;
  trend: PriceTrend;
  direction: PriceDirection;
  score: number;
}

export interface PriceMomentumResult {
  dataQuality: Record<string, any>;
  ndx: IndexMomentum;
  spx: IndexMomentum;
  rut: IndexMomentum;
  momentum5D: number;
  momentum20D: number;
  acceleration: number;
  score: number;
  trend: PriceTrend;
  direction: PriceDirection;
  state: PriceMomentumState;
  structureScore: number;
  structureAlignment: PriceStructureAlignment | "UNKNOWN";
  earlyBullish: boolean;
  earlyBearish: boolean;
  bullishImpulse: boolean;
  bearishImpulse: boolean;
  cooling: boolean;
  accelerating: boolean;
  decelerating: boolean;
  priceLeadingStructure: boolean;
  structureLeadingPrice: boolean;
  conflict: boolean;
  summary: string;
}

function numeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const object = value as Record<string, unknown>;
    for (const key of ["value", "score", "current"]) {
      const candidate = object[key];
      if (typeof candidate === "number" || typeof candidate === "string") {
        const n = numeric(candidate);
        if (n !== null) return n;
      }
    }
  }
  return null;
}

function num(value: unknown, fallback = 0): number {
  return numeric(value) ?? fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function momentumScore(short: number, medium: number): number {
  return Math.round(clamp(
    50 + clamp(short * 5, -50, 50) * 0.55 +
    clamp(medium * 3, -50, 50) * 0.45,
    0, 100
  ));
}

function classifyTrend(score: number): PriceTrend {
  if (score >= 75) return "STRONG_BULLISH";
  if (score >= 60) return "BULLISH";
  if (score <= 25) return "STRONG_BEARISH";
  if (score <= 40) return "BEARISH";
  return "NEUTRAL";
}

function direction(short: number, medium: number): PriceDirection {
  const combined = short * 0.6 + medium * 0.4;
  if (combined > 0.5) return "UP";
  if (combined < -0.5) return "DOWN";
  return "FLAT";
}

function getStructure(input: PriceMomentumInput) {
  const values = [
    numeric(input.structure?.breadth?.b50),
    numeric(input.participation?.score),
    numeric(input.rotation?.score),
    numeric(input.liquidity?.score),
    numeric(input.fragility?.score)
  ];
  const available = values.every(value => value !== null);
  const [breadth, participation, rotation, liquidity, fragility] =
    values.map(value => clamp(value ?? 50, 0, 100));
  const score = Math.round(clamp(
    breadth * 0.30 + participation * 0.25 + rotation * 0.20 +
    liquidity * 0.10 + (100 - fragility) * 0.15,
    0, 100
  ));
  return { score, available };
}

function classifyAlignment(price: number, structure: number): PriceStructureAlignment {
  const priceBull = price >= 60;
  const priceBear = price <= 40;
  const structureBull = structure >= 60;
  const structureBear = structure <= 40;
  if (priceBull && structureBull) return "CONFIRMED_BULLISH";
  if (priceBear && structureBear) return "CONFIRMED_BEARISH";
  if ((priceBull && structureBear) || (priceBear && structureBull)) return "CONFLICT";
  if (priceBull) return "BULLISH";
  if (priceBear) return "BEARISH";
  return "NEUTRAL";
}

function classifyState(score: number, short: number, medium: number, acceleration: number): PriceMomentumState {
  if (short >= 3 && medium >= 5 && acceleration >= 0) return "STRONG_BULLISH";
  if (medium >= 4 && short >= 0 && acceleration < 0) return "BULLISH_COOLING";
  if (score >= 65) return "BULLISH";
  if (short <= -3 && medium <= -4 && acceleration <= 0) return "STRONG_BEARISH";
  if (medium <= -4 && short <= 0 && acceleration > 0) return "BEARISH_BUILDING";
  if (score <= 35) return "BEARISH";
  return "NEUTRAL";
}

export function priceMomentumEngine(input: PriceMomentumInput): PriceMomentumResult {
  const safeInput = input ?? {};
  const history = safeInput.historyMetrics ?? {};
  function index(name: "ndx" | "spx" | "rut"): IndexMomentum {
    const availability = history.dataQuality?.priceAvailability?.[name];
    // Older history producers expose nullable chronological series instead.
    const series = history[`${name}History`];
    function available(key: string, offset: number): boolean {
      if (typeof availability?.[key] === "boolean") return availability[key];
      if (Array.isArray(series)) {
        return series.length > offset && (numeric(series[series.length - 1]) ?? 0) > 0 && (numeric(series[series.length - 1 - offset]) ?? 0) > 0;
      }
      // Legacy numeric metrics without provenance do not establish valid endpoints.
      return false;
    }
    const shortMeasured = available("momentum5D", 5) ? numeric(history[`${name}Momentum5D`]) : null;
    const mediumMeasured = available("momentum20D", 20) ? numeric(history[`${name}Momentum20D`]) : null;
    const accelerationMeasured = shortMeasured !== null && mediumMeasured !== null && available("acceleration", 20) ? numeric(history[`${name}Acceleration`]) : null;
    const short = shortMeasured ?? 0;
    const medium = mediumMeasured ?? 0;
    const acceleration = accelerationMeasured ?? 0;
    const score = momentumScore(short, medium);
    return {
      dataQuality: { momentum5DAvailable: shortMeasured !== null, momentum20DAvailable: mediumMeasured !== null, accelerationAvailable: accelerationMeasured !== null, measured: { momentum5D: shortMeasured, momentum20D: mediumMeasured, acceleration: accelerationMeasured }, source: availability ? "HISTORY_ENDPOINT_FLAGS" : Array.isArray(series) ? "HISTORY_SERIES_ENDPOINTS" : "UNVERIFIED" },
      value: num(safeInput.indices?.[name]?.value),
      momentum5D: short,
      momentum20D: medium,
      acceleration,
      score,
      trend: classifyTrend(score),
      direction: direction(short, medium)
    };
  }
  const ndx = index("ndx");
  const spx = index("spx");
  const rut = index("rut");
  const all = [ndx, spx, rut];
  const shortAvailable = all.every(index => index.dataQuality.momentum5DAvailable);
  const mediumAvailable = all.every(index => index.dataQuality.momentum20DAvailable);
  const accelerationAvailable = all.every(index => index.dataQuality.accelerationAvailable);
  const complete = shortAvailable && mediumAvailable && accelerationAvailable;
  const momentum5D = ndx.momentum5D * 0.50 + rut.momentum5D * 0.30 + spx.momentum5D * 0.20;
  const momentum20D = ndx.momentum20D * 0.50 + rut.momentum20D * 0.30 + spx.momentum20D * 0.20;
  const acceleration = ndx.acceleration * 0.50 + rut.acceleration * 0.30 + spx.acceleration * 0.20;
  const score = momentumScore(momentum5D, momentum20D);
  const trend = classifyTrend(score);
  const dir = direction(momentum5D, momentum20D);
  const state = complete ? classifyState(score, momentum5D, momentum20D, acceleration) : "NEUTRAL";
  const structure = getStructure(safeInput);
  const structureScore = structure.score;
  const structureAlignment: PriceMomentumResult["structureAlignment"] = structure.available && shortAvailable && mediumAvailable
    ? classifyAlignment(score, structureScore)
    : "UNKNOWN";

  const earlyBullish = complete && momentum5D >= 1 && momentum20D >= 2 && acceleration >= -0.5;
  const earlyBearish = complete && momentum5D <= -1 && momentum20D <= -2 && acceleration <= 0.5;
  const bullishImpulse = shortAvailable && accelerationAvailable && momentum5D >= 3 && acceleration >= 0.5;
  const bearishImpulse = shortAvailable && accelerationAvailable && momentum5D <= -3 && acceleration <= -0.5;
  const cooling = complete && momentum20D > 2 && momentum5D < momentum20D * 0.35 && acceleration < 0;
  const accelerating = accelerationAvailable && acceleration >= 0.5;
  const decelerating = accelerationAvailable && acceleration <= -0.5;
  const priceLeadingStructure = complete && structure.available && score >= 60 && structureScore < 55;
  const structureLeadingPrice = complete && structure.available && structureScore >= 60 && score < 55;
  const conflict = structureAlignment === "CONFLICT";
  const shortText = `${momentum5D >= 0 ? "+" : ""}${momentum5D.toFixed(2)}% 5D`;
  const mediumText = `${momentum20D >= 0 ? "+" : ""}${momentum20D.toFixed(2)}% 20D`;
  const accelerationText = `${acceleration >= 0 ? "+" : ""}${acceleration.toFixed(2)}`;
  const summary = `PRICE ${complete ? state : "INCOMPLETE"} | ${shortAvailable ? shortText : "5D UNKNOWN"} | ${mediumAvailable ? mediumText : "20D UNKNOWN"} | ACC ${accelerationAvailable ? accelerationText : "UNKNOWN"} | STRUCTURE ${structureAlignment}`;
  return {
    dataQuality: { complete, momentum5DAvailable: shortAvailable, momentum20DAvailable: mediumAvailable, accelerationAvailable, measured: { momentum5D: shortAvailable ? momentum5D : null, momentum20D: mediumAvailable ? momentum20D : null, acceleration: accelerationAvailable ? acceleration : null }, numericFallbackIsMeasurement: false, scoreIsPartial: !complete, classificationAvailable: complete, timeBasis: history.dataQuality?.timeBasis ?? "UNKNOWN", weightsRenormalized: false },
    ndx, spx, rut, momentum5D, momentum20D, acceleration, score, trend,
    direction: dir, state, structureScore, structureAlignment,
    earlyBullish, earlyBearish, bullishImpulse, bearishImpulse, cooling,
    accelerating, decelerating, priceLeadingStructure, structureLeadingPrice,
    conflict, summary
  };
}
