// /lib/engine/rotationDecisionEngine.ts
// Report approved instrument actions. Risk context alone never creates an entry.
function numeric(value: unknown, fallback = 0): number {
  if (value && typeof value === "object" && !Array.isArray(value)) return numeric((value as any).value, fallback);
  if (typeof value !== "number" && typeof value !== "string") return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function rotationDecisionEngine(input: any) {
  const data = input ?? {};
  const put = data.putTiming ?? {};
  const stack = data.tradeStack ?? {};
  const sizing = data.sizing ?? {};
  const putMax = numeric(put.maxScore ?? put.score?.max, 24);
  const putScore = Math.max(0, Math.min(100, numeric(put.score) / (putMax > 0 ? putMax : 24) * 100));
  const russellScore = Math.max(0, Math.min(100, numeric(data.russell?.confidence)));
  const conflict = stack.directionalConflict === true || stack.meta?.directionalConflict === true || sizing.portfolio?.directionalConflict === true;
  const panic = put.decision === "PANIC_SHORT" || put.execution === "REDUCE RISK";

  function result(finalAction: string, direction: string, execution: string, reason: string, flows: string[] = []) {
    return {
      finalAction, direction, execution, reason,
      edge: putScore - russellScore,
      edgeState: data.edgeState?.state ?? "NEUTRAL",
      putScore, russellScore, activeFlows: flows,
      diagnostics: {
        policy: "APPROVED_FLOW_ACTIONS_V1",
        riskScoreIsNotEntryAuthorization: true,
        masterNeutralDoesNotBlockApprovedStarter: true,
        scoreDifferenceIsNotStatisticalEdge: true,
        conflict, panic
      }
    };
  }

  if (conflict) return result("WAIT", "NEUTRAL", "NONE", "Directional portfolio conflict");
  if (panic) return result("REDUCE RISK", "DEFENSIVE", "MANAGE EXISTING POSITIONS", "Panic management; no new put entry");

  function approved(name: string) {
    const candidate = stack[name];
    const flow = sizing[name];
    return candidate?.eligible === true && flow?.eligible === true && numeric(flow?.size) > 0 && numeric(candidate?.strength) >= 20 &&
      (!Array.isArray(candidate.blockReasons) || candidate.blockReasons.length === 0);
  }

  const putOpen = ["DEFENSIVE_BUILD", "STRUCTURAL_BUILD", "TACTICAL_BUILD", "STRONG_BUILD"].includes(put.decision) &&
    put.entryWindow === "OPEN" && ["SMALL STARTER", "PARTIAL SIZE", "FULL SIZE"].includes(put.execution);
  const approvedPut = approved("nasdaqPut") && putOpen;
  const approvedNasdaq = approved("nasdaqCall");
  const approvedRussell = approved("russellCall");
  if (approvedPut && (approvedNasdaq || approvedRussell)) return result("WAIT", "NEUTRAL", "NONE", "Opposing approved flows require portfolio resolution");
  if (approvedPut) {
    const starter = put.execution === "SMALL STARTER";
    return result(starter ? "START SMALL PUT" : "BUILD PUTS", starter ? "LIGHT SHORT" : "NET SHORT",
      put.execution, "Put Timing entry approved by Trade Stack and position sizing", ["NASDAQ_PUT"]);
  }
  if (approvedNasdaq || approvedRussell) {
    const flows = [approvedNasdaq ? "NASDAQ_CALL" : null, approvedRussell ? "RUSSELL_CALL" : null].filter((value): value is string => value !== null);
    return result(approvedNasdaq && approvedRussell ? "BUILD APPROVED CALLS" : approvedRussell ? "BUILD RUSSELL" : "BUILD NASDAQ CALLS",
      "NET LONG", "APPROVED SIZE", "Independent call setup approved by Trade Stack and position sizing", flows);
  }
  return result("WAIT", "NEUTRAL", "NONE", "No instrument entry approved by Trade Stack and position sizing");
}
