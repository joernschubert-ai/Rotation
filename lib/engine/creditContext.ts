// /lib/engine/creditContext.ts

export interface CreditContextInput {
  creditRatio?: unknown;
  creditRatioMA50?: unknown;
  creditRatioToMA50?: unknown;
  creditDistancePct?: unknown;
  creditSignal?: unknown;
  creditDataQuality?: any;
}

function numeric(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function positive(value: unknown): number | null {
  const parsed = numeric(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

export function getCreditContext(input: CreditContextInput = {}) {
  const data = input ?? {};
  const rawRatio = positive(data.creditRatio);
  const ma50 = positive(data.creditRatioMA50);
  const ratioToMA50 = positive(data.creditRatioToMA50);
  const suppliedDistance = numeric(data.creditDistancePct);
  let reason: string | null = null;
  if (data.creditDataQuality?.available === false) reason = "PRODUCER_UNAVAILABLE";
  else if (rawRatio === null || ma50 === null || ratioToMA50 === null) reason = "MISSING_CREDIT_COMPARISON";
  else {
    const expected = rawRatio / ma50;
    if (!Number.isFinite(expected) || Math.abs(expected - ratioToMA50) > 1e-10 * Math.max(1, expected, ratioToMA50)) {
      reason = "INCONSISTENT_CREDIT_COMPARISON";
    }
  }
  const distancePct = ratioToMA50 === null ? null : (ratioToMA50 - 1) * 100;
  if (!reason && suppliedDistance !== null && distancePct !== null && Math.abs(suppliedDistance - distancePct) > 1e-8) {
    reason = "INCONSISTENT_CREDIT_DISTANCE";
  }
  const signal = ratioToMA50 === null ? "unknown" : ratioToMA50 > 1 ? "risk_on" : ratioToMA50 < 1 ? "risk_off" : "neutral";
  const suppliedSignal = typeof data.creditSignal === "string" ? data.creditSignal.toLowerCase() : "unknown";
  if (!reason && ["risk_on", "risk_off", "neutral"].includes(suppliedSignal) && suppliedSignal !== signal) {
    reason = "INCONSISTENT_CREDIT_SIGNAL";
  }
  const available = reason === null;
  return {
    available, reason, rawRatio, ma50, ratioToMA50, distancePct,
    signal: available ? signal : "unknown",
    riskOn: available && signal === "risk_on",
    riskOff: available && signal === "risk_off",
    neutral: available && signal === "neutral",
    dateAlignmentVerified: data.creditDataQuality?.dateAlignmentVerified === true,
    ratioDefinition: "HYG / IEF",
    comparisonDefinition: "(HYG / IEF) / MA50(HYG / IEF)",
    intensityCalibrated: false
  };
}
