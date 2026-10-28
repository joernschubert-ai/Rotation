import { structureEngine } from "./structureEngine";
import { participationEngine } from "./participationEngine";
import { breadthThrustEngine } from "./breadthThrustEngine";
import { marketQualityEngine } from "./marketQualityEngine";

// General market risk remains shared; only Nasdaq entry structure is index-specific.
export function buildNasdaqStructureContext(data: any, shared: any): any | null {
  const frame = data?.indexBreadth?.nasdaq100;
  const quality = frame?.dataQuality;
  if (quality?.available !== true || quality?.unit !== "FRACTION" || quality?.definition !== "NASDAQ100_CURRENT_CONSTITUENTS_EQUAL_WEIGHT" || !(quality.coverage >= 0.98) || typeof quality.referenceDate !== "string") return null;
  const values = [frame.b20, frame.b50, frame.b200];
  if (values.some(value => typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1)) return null;
  const structure = structureEngine({ ...data, breadth20: frame.b20, breadth50: frame.b50, breadth200: frame.b200,
    advanceDecline: frame.advanceDecline, advances: frame.advances, declines: frame.declines, newHighs: frame.newHighs, newLows: frame.newLows });
  const [breadth20, breadth50, breadth200] = values.map(value => value * 100);
  const participation = participationEngine({ historyMetrics: {}, breadthUnit: "PERCENT", breadth20, breadth50, breadth200,
    structure, highs: frame.newHighs, lows: frame.newLows, rsEqual: shared.rotation?.rsEqual, rsSmall: shared.rotation?.rsSmall,
    rotation: shared.rotation, concentrationScore: Number(data.concentrationScore ?? 50), rotationScore: shared.rotation?.score });
  const breadthThrust = breadthThrustEngine({ breadthUnit: "PERCENT", breadth20, breadth50, breadth200, structure, advanceDecline: frame.advanceDecline,
    rsEqual: shared.rotation?.rsEqual, rsSmall: shared.rotation?.rsSmall, rotationScore: shared.rotation?.score,
    participationScore: participation.score, concentrationScore: Number(data.concentrationScore ?? 50) });
  const marketQuality = marketQualityEngine({ ...shared, structure, participation, breadthThrust, breadth50, breadth200,
    concentrationScore: Number(data.concentrationScore ?? 50) });
  return { structure, breadth20, breadth50, breadth200, participation, breadthThrust, marketQuality,
    diagnostics: { source: "NASDAQ100_CONSTITUENT_BREADTH", universeVersion: quality.universeVersion,
      referenceDate: quality.referenceDate, coverage: quality.coverage, valid: quality.valid, expected: quality.expected,
      breadth20, breadth50, breadth200, participationScore: participation.score, marketQualityScore: marketQuality.score,
      marketQualityState: marketQuality.state, independentNasdaqHistoryUsed: false,
      sharedContext: "GENERAL_MARKET_PHASE_ROTATION_LIQUIDITY_RISK", overridesRussellStructure: false,
      ruleThresholdsRecalibrated: false } };
}
