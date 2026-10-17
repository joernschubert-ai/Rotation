"use client";

import type { ReactNode } from "react";

type Props = {
  sizing: any;
  tradeStack?: any;
  decision?: any;
};

type MetricKind =
  | "neutral"
  | "health"
  | "risk"
  | "heat"
  | "improvement"
  | "deterioration";

function numeric(value: unknown): number | null {
  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown, fallback = "UNKNOWN"): string {
  return typeof value === "string" && value.trim() !== ""
    ? value
    : fallback;
}

function display(
  value: unknown,
  decimals = 0,
  suffix = ""
): string {
  const parsed = numeric(value);

  if (parsed === null) return "—";

  return parsed.toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + suffix;
}

function factor(value: unknown): string {
  const parsed = numeric(value);
  return parsed === null ? "—" : `×${display(parsed, 2)}`;
}

function instrumentLabel(value: unknown): string {
  switch (value) {
    case "NASDAQ_PUT": return "NASDAQ PUT";
    case "NASDAQ_CALL": return "NASDAQ CALL";
    case "RUSSELL_CALL": return "RUSSELL CALL";
    default: return text(value);
  }
}

function normalizeDirection(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");

  if (["SHORT", "LIGHT_SHORT", "NET_SHORT", "SHORT_INDEX", "BEARISH"].includes(normalized)) {
    return "SHORT";
  }

  if (["LONG", "LIGHT_LONG", "NET_LONG", "LONG_INDEX", "BULLISH"].includes(normalized)) {
    return "LONG";
  }

  if (normalized === "MIXED") return "MIXED";

  if (["NEUTRAL", "NONE", "FLAT"].includes(normalized)) {
    return "NEUTRAL";
  }

  return null;
}

function directionColor(value: string): string {
  if (value === "SHORT") return "#ff7875";
  if (value === "LONG") return "#95de64";
  if (value === "MIXED") return "#fa8c16";
  return "#888";
}

function stateColor(value: string): string {
  const normalized = value.toUpperCase();

  if (
    normalized.includes("CRISIS") ||
    normalized.includes("BREAKDOWN") ||
    normalized.includes("EXTREME")
  ) {
    return "#ff7875";
  }

  if (normalized.includes("NO_TRADE") || normalized === "UNKNOWN") {
    return "#777";
  }

  if (normalized.includes("STARTER")) return "#69b1ff";

  if (
    normalized.includes("DEFENSIVE") ||
    normalized.includes("SHORT")
  ) {
    return "#fadb14";
  }

  if (
    normalized.includes("LONG") ||
    normalized.includes("EXPANSION") ||
    normalized === "STABLE"
  ) {
    return "#95de64";
  }

  return "#aaa";
}

function metricColor(value: unknown, kind: MetricKind): string {
  const parsed = numeric(value);

  if (parsed === null) return "#555";
  if (kind === "neutral") return "#aaa";

  if (kind === "heat") {
    return parsed > 0 ? "#95de64" : parsed < 0 ? "#ff7875" : "#aaa";
  }

  if (kind === "improvement") {
    return parsed > 0 ? "#95de64" : parsed < 0 ? "#fa8c16" : "#aaa";
  }

  if (kind === "deterioration") {
    return parsed > 0 ? "#fa8c16" : parsed < 0 ? "#95de64" : "#aaa";
  }

  if (kind === "risk") {
    if (parsed >= 80) return "#ff7875";
    if (parsed >= 60) return "#fa8c16";
    if (parsed >= 40) return "#fadb14";
    return "#95de64";
  }

  if (parsed >= 70) return "#95de64";
  if (parsed >= 50) return "#fadb14";
  if (parsed >= 30) return "#fa8c16";
  return "#ff7875";
}

function Metric({
  label,
  value,
  decimals = 0,
  suffix = "",
  kind = "neutral",
  formatted,
}: {
  label: string;
  value?: unknown;
  decimals?: number;
  suffix?: string;
  kind?: MetricKind;
  formatted?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #222",
        background: "#101010",
        padding: "8px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          color: "#666",
          fontSize: "9px",
          marginBottom: "5px",
          overflowWrap: "anywhere",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: metricColor(value, kind),
          fontSize: "16px",
          fontWeight: "bold",
          overflowWrap: "anywhere",
        }}
      >
        {formatted ?? display(value, decimals, suffix)}
      </div>
    </div>
  );
}

function MetricGrid({
  children,
  minWidth = 110,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          `repeat(auto-fit, minmax(min(${minWidth}px, 100%), 1fr))`,
        gap: "7px",
        marginBottom: "14px",
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        color: "#999",
        fontSize: "10px",
        fontWeight: "bold",
        marginBottom: "8px",
        letterSpacing: "0.3px",
      }}
    >
      {children}
    </div>
  );
}

function StateCard({ label, value }: { label: string; value: unknown }) {
  const rendered = text(value);

  return (
    <div
      style={{
        border: "1px solid #222",
        background: "#101010",
        padding: "9px",
        minWidth: 0,
      }}
    >
      <div style={{ color: "#666", fontSize: "9px" }}>{label}</div>
      <div
        style={{
          color: stateColor(rendered),
          fontSize: "11px",
          fontWeight: "bold",
          marginTop: "5px",
          overflowWrap: "anywhere",
        }}
      >
        {rendered}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <details
      style={{
        borderTop: "1px solid #222",
        paddingTop: "10px",
        marginTop: "10px",
      }}
    >
      <summary style={{ cursor: "pointer", color: "#999", fontSize: "10px" }}>
        {title}
        {subtitle && (
          <span
            style={{
              display: "block",
              color: "#666",
              fontSize: "9px",
              marginTop: "3px",
            }}
          >
            {subtitle}
          </span>
        )}
      </summary>
      <div style={{ marginTop: "10px" }}>{children}</div>
    </details>
  );
}

function Badge({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  return (
    <span
      style={{
        border: `1px solid ${color}`,
        color,
        padding: "4px 7px",
        fontSize: "9px",
        fontWeight: "bold",
      }}
    >
      {children}
    </span>
  );
}

function FlowDiagnostics({ flow }: { flow: any }) {
  const diagnostics = flow?.diagnostics;

  return (
    <>
      <MetricGrid minWidth={95}>
        <Metric label="BEFORE PORTFOLIO CAP" value={flow?.prePortfolioSize} suffix="%" />
        <Metric label="FINAL ALLOCATION" value={flow?.finalSize ?? flow?.size} suffix="%" />
        <Metric label="SIZING FACTOR" formatted={factor(flow?.riskMultiplier)} />
      </MetricGrid>

      {diagnostics && (
        <MetricGrid minWidth={95}>
          <Metric label="BASE SIZE" value={diagnostics.baseSize} decimals={2} suffix="%" />
          <Metric label="AFTER SETUP MODIFIERS" value={diagnostics.supportAdjustedSize} decimals={2} suffix="%" />
          <Metric label="AFTER SIZING FACTOR" value={diagnostics.riskAdjustedSize} decimals={2} suffix="%" />
          <Metric label="AFTER FLOW ADJUSTMENTS" value={diagnostics.safetyAdjustedSize} decimals={2} suffix="%" />
          <Metric label="FLOW CAP" value={diagnostics.maxFlowSize} suffix="%" />
          <Metric label="POST-RISK MINIMUM" value={diagnostics.postRiskMinimumSize} suffix="%" />
        </MetricGrid>
      )}

      <div style={{ color: "#888", fontSize: "10px", lineHeight: 1.5 }}>
        {text(flow?.reason, "No engine reason supplied")}
      </div>
    </>
  );
}

function FlowCard({ title, flow }: { title: string; flow: any }) {
  if (!flow) {
    return (
      <div style={{ border: "1px solid #222", background: "#101010", padding: "12px" }}>
        <strong style={{ fontSize: "12px" }}>{title}</strong>
        <div style={{ color: "#666", marginTop: "8px", fontSize: "10px" }}>
          NO DATA
        </div>
      </div>
    );
  }

  const direction = text(flow.direction, "NONE");
  const finalSize = flow.finalSize ?? flow.size;
  const eligible = flow.eligible === true;

  return (
    <div
      style={{
        border: `1px solid ${eligible ? directionColor(direction) : "#222"}`,
        background: "#101010",
        padding: "12px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <strong style={{ fontSize: "12px" }}>{title}</strong>
        <span style={{ color: directionColor(direction), fontSize: "10px" }}>
          {direction}
        </span>
      </div>

      <div style={{ fontSize: "10px", color: "#666" }}>FINAL ALLOCATION</div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ddd" }}>
        {display(finalSize, 0, "%")}
      </div>

      <div
        style={{
          color: stateColor(text(flow.mode, "NO_TRADE")),
          fontSize: "10px",
          overflowWrap: "anywhere",
          marginTop: "4px",
        }}
      >
        {text(flow.mode, "NO_TRADE")}
      </div>

      <div style={{ color: eligible ? "#95de64" : "#777", fontSize: "10px", margin: "5px 0 10px" }}>
        {eligible ? "ELIGIBLE" : "NO TRADE"}
      </div>

      <StateCard label="CANDIDATE STATE" value={flow.state} />

      <div style={{ marginTop: "9px" }}>
        <MetricGrid minWidth={90}>
          <Metric label="STRENGTH" value={flow.strength} suffix="/100" />
          <Metric label="SETUP SUPPORT" value={flow.confidence} suffix="/100" />
          <Metric label="SIZING FACTOR" formatted={factor(flow.riskMultiplier)} />
        </MetricGrid>
      </div>

      <details>
        <summary style={{ fontSize: "10px", color: "#777", cursor: "pointer" }}>
          {title} · SIZING DETAILS
        </summary>
        <div style={{ marginTop: "9px" }}>
          <FlowDiagnostics flow={flow} />
        </div>
      </details>
    </div>
  );
}

export default function PositionSizingPanel({
  sizing,
  tradeStack,
  decision,
}: Props) {
  if (!sizing) return null;

  const components = sizing.components ?? {};
  const meta = sizing.meta ?? {};
  const portfolio = sizing.portfolio ?? {};
  const risk = sizing.risk ?? {};
  const pipeline = sizing.pipeline ?? {};
  const flowPipeline = sizing.flowPipeline ?? {};

  const totalSize = numeric(sizing.size);
  const direction = text(sizing.direction, "NEUTRAL");
  const mode = text(sizing.mode, "NO_TRADE");
  const primary = sizing.primary ?? null;

  const flows = Array.isArray(sizing.flows) ? sizing.flows : null;
  const activeFlows = Array.isArray(sizing.activeFlows)
    ? sizing.activeFlows
    : null;

  const activeInstruments = Array.isArray(sizing.activeInstruments)
    ? sizing.activeInstruments
    : null;

  const phase = meta.phase ?? pipeline.phase ?? "UNKNOWN";
  const executionMode = meta.executionMode ?? "UNKNOWN";
  const riskState = meta.riskState ?? "UNKNOWN";
  const tacticalBias = meta.tacticalBias ?? "UNKNOWN";

  const directionalConflict =
    meta.tradeStackDirectionalConflict === true ||
    meta.portfolioDirectionalConflict === true ||
    portfolio.directionalConflict === true ||
    portfolio.tradeStackDirectionalConflict === true ||
    tradeStack?.directionalConflict === true ||
    tradeStack?.meta?.directionalConflict === true;

  const decisionDirection = normalizeDirection(decision?.direction);
  const allocationDirection = normalizeDirection(direction);

  let alignment = "RICHTUNG NICHT VERGLEICHBAR";
  let alignmentColor = "#777";

  if (allocationDirection === "NEUTRAL") {
    alignment = "NO EXPOSURE";
  } else if (directionalConflict || allocationDirection === "MIXED") {
    alignment = "DIRECTION CONFLICT";
    alignmentColor = "#fa8c16";
  } else if (decisionDirection === "NEUTRAL") {
    alignment = "NO DIRECTIONAL DECISION";
  } else if (decisionDirection && allocationDirection) {
    const aligned = decisionDirection === allocationDirection;
    alignment = aligned ? "ALIGNED" : "MISALIGNED";
    alignmentColor = aligned ? "#95de64" : "#ff7875";
  }

  const confirmationCount =
    risk.defensiveStructuralConfirmationCount ??
    components.defensiveStructuralConfirmationCount ??
    meta.defensiveStructuralConfirmationCount;

  const defensiveConfirmed =
    risk.defensiveStructuralConfirmed === true ||
    meta.defensiveStructuralConfirmed === true;

  const strongDefensiveConfirmed =
    risk.strongDefensiveStructuralConfirmed === true ||
    meta.strongDefensiveStructuralConfirmed === true;

  const defensiveEnvironment =
    executionMode === "DEFENSIVE" ||
    riskState === "CRISIS" ||
    tacticalBias === "SHORT_INDEX";

  const squeezeRisk = numeric(risk.squeezeRisk);
  const cap = numeric(portfolio.cap);

  const flowSizes = flows?.map((flow: any) => numeric(flow.size));

  const canCheckAllocation =
    totalSize !== null &&
    cap !== null &&
    flowSizes !== undefined &&
    flowSizes.every((value: number | null) => value !== null);

  const flowTotal = canCheckAllocation
    ? flowSizes!.reduce(
        (sum: number, value: number | null) => sum + (value ?? 0),
        0
      )
    : null;

  const allocationIssue = canCheckAllocation &&
    (
      totalSize! < 0 ||
      totalSize! > cap! + 0.000001 ||
      Math.abs(totalSize! - flowTotal!) > 0.000001 ||
      flowSizes!.some((value: number | null) => value !== null && value < 0)
    );

  const dataStatus = !canCheckAllocation
    ? "INCOMPLETE"
    : allocationIssue ? "CHECK" : "OK";

  const nasdaqPut = flowPipeline.nasdaqPut ?? sizing.nasdaqPut;
  const nasdaqCall = flowPipeline.nasdaqCall ?? sizing.nasdaqCall;
  const russellCall = flowPipeline.russellCall ?? sizing.russellCall;

  return (
    <div
      style={{
        background: "#090909",
        border: "1px solid #222",
        padding: "clamp(10px, 2vw, 16px)",
        color: "#ddd",
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "14px",
        }}
      >
        <div>
          <div style={{ color: "#aaa", fontSize: "14px", fontWeight: "bold" }}>
            POSITIONIERUNG
          </div>
          <div style={{ color: "#666", fontSize: "9px", marginTop: "3px" }}>
            POSITION SIZING · PORTFOLIO ALLOCATION
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <Badge color={alignmentColor}>{alignment}</Badge>
          {defensiveEnvironment && <Badge color="#fadb14">DEFENSIVE</Badge>}
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${directionColor(direction)}`,
          background: "#101010",
          padding: "14px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ color: "#777", fontSize: "10px" }}>PORTFOLIO POSITION</div>
            <div style={{ color: directionColor(direction), fontSize: "24px", fontWeight: "bold" }}>
              {direction}
            </div>
            <div style={{ color: "#777", fontSize: "10px", marginTop: "5px" }}>
              {activeFlows ? `${activeFlows.length} ACTIVE FLOW(S)` : "ACTIVE FLOWS —"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "36px", fontWeight: "bold" }}>
              {display(totalSize, 0, "%")}
            </div>
            <div style={{ color: stateColor(mode), fontSize: "10px", overflowWrap: "anywhere" }}>
              {mode}
            </div>
          </div>
        </div>

        {primary && (
          <div style={{ borderTop: "1px solid #222", paddingTop: "10px", marginTop: "12px" }}>
            <MetricGrid minWidth={110}>
              <Metric label="PRIMARY INSTRUMENT" formatted={instrumentLabel(primary.instrument)} />
              <Metric label="PRIMARY ALLOCATION" value={primary.size} suffix="%" />
              <Metric label="PRIMARY STRENGTH" value={primary.strength} suffix="/100" />
              <Metric
                label={`SETUP SUPPORT · ${instrumentLabel(primary.instrument)}`}
                value={primary.confidence}
                suffix="/100"
              />
            </MetricGrid>
          </div>
        )}

        <div style={{ color: "#777", fontSize: "10px", lineHeight: 1.5 }}>
          Setup Support is an instrument-specific model score.
          It is not execution quality or a calibrated success probability.
        </div>
      </div>

      <SectionTitle>REGIME-KONTEXT</SectionTitle>
      <p style={{fontSize: "11px", color: "#999", lineHeight: 1.5}}>Der Regime-Status ist die allgemeine Markteinschätzung. Instrumentfreigaben und Modellgrößen stehen unter Instrument Allocations; ein begrenzter Starter kann trotz WAIT freigegeben sein.</p>
      <MetricGrid minWidth={130}>
        <StateCard label="PHASE" value={phase} />
        <StateCard label="REGIME-AUSFÜHRUNG" value={executionMode} />
        <StateCard label="RISK STATE" value={riskState} />
        <StateCard label="TACTICAL BIAS" value={tacticalBias} />
      </MetricGrid>

      <div
        style={{
          border: "1px solid #44351b",
          background: "#13110d",
          padding: "11px",
          marginBottom: "14px",
        }}
      >
        <SectionTitle>DEFENSIVE MODEL EVIDENCE</SectionTitle>
        <div style={{ color: "#fadb14", fontSize: "13px", fontWeight: "bold" }}>
          {strongDefensiveConfirmed
            ? "STRONG DEFENSIVE EVIDENCE"
            : defensiveConfirmed
              ? "DEFENSIVE EVIDENCE"
              : "NOT CONFIRMED"}
        </div>
        <div style={{ color: "#aaa", fontSize: "11px", marginTop: "6px" }}>
          {display(confirmationCount)} MODEL FLAGS
        </div>
        <div style={{ color: "#777", fontSize: "10px", marginTop: "5px" }}>
          Flags can share underlying inputs; the count is not independent statistical confirmation.
        </div>
      </div>

      <SectionTitle>INSTRUMENT ALLOCATIONS</SectionTitle>
      <MetricGrid minWidth={220}>
        <FlowCard title="NASDAQ PUT" flow={nasdaqPut} />
        <FlowCard title="NASDAQ CALL" flow={nasdaqCall} />
        <FlowCard title="RUSSELL CALL" flow={russellCall} />
      </MetricGrid>

      <SectionTitle>PORTFOLIO LAYER</SectionTitle>
      <MetricGrid>
        <Metric label="BEFORE PORTFOLIO CAP" value={portfolio.rawSize} suffix="%" />
        <Metric label="PORTFOLIO CAP" value={portfolio.cap} suffix="%" />
        <Metric label="PORTFOLIO SCALE" formatted={factor(portfolio.scale)} />
        <Metric label="FINAL ALLOCATION" value={portfolio.totalSize} suffix="%" />
      </MetricGrid>

      <SectionTitle>SIZING ENVIRONMENT</SectionTitle>
      <MetricGrid>
        <Metric label="GLOBAL SIZING FACTOR" formatted={factor(risk.globalMultiplier)} />
        <Metric label="CRASH MODEL" value={risk.crashProbability} suffix="%" kind="risk" />
        <Metric label="DANGER" value={risk.dangerScore} kind="risk" />
        <Metric label="LIQUIDITY" value={risk.liquidityScore} kind="health" />
        <Metric label="FRAGILITY" value={risk.fragilityScore} kind="risk" />
        <Metric label="MARKET QUALITY" value={risk.marketQualityScore} kind="health" />
      </MetricGrid>

      <div style={{ color: "#777", fontSize: "10px", lineHeight: 1.5, marginBottom: "14px" }}>
        Sizing factors multiply the calculated allocation.
        For example, ×0,14 retains 14% of the size entering that step.
      </div>

      {squeezeRisk !== null && squeezeRisk >= 80 && (
        <div
          style={{
            border: "1px solid #5c3618",
            background: "#171008",
            padding: "10px",
            marginBottom: "14px",
          }}
        >
          <div style={{ color: "#fa8c16", fontSize: "11px", fontWeight: "bold" }}>
            EXTREME POSITIONING INSTABILITY · {display(squeezeRisk)}/100
          </div>
          <div style={{ color: "#888", fontSize: "10px", marginTop: "5px", lineHeight: 1.5 }}>
            The squeeze model flags positioning instability.
            This score does not independently confirm a PUT or CALL direction.
          </div>
        </div>
      )}

      <CollapsibleSection title="RISK DETAILS" subtitle="Model inputs used by the sizing layer">
        <MetricGrid>
          <Metric label="PARTICIPATION" value={risk.participationScore} kind="health" />
          <Metric label="ROTATION DECAY" value={risk.rotationDecayScore} kind="risk" />
          <Metric label="ROTATION CONFIRMATION" value={risk.rotationConfidence} suffix="/100" />
          <Metric label="REGIME SYNC" value={risk.regimeSyncScore} kind="health" />
          <Metric label="SQUEEZE MODEL" value={risk.squeezeRisk} kind="risk" />
          <Metric label="SYSTEM HEAT · −2 TO +2" value={risk.heat} decimals={2} kind="heat" />
        </MetricGrid>
      </CollapsibleSection>

      <CollapsibleSection title="PIPELINE INPUTS" subtitle="Actual engine scores entering sizing">
        <MetricGrid>
          <Metric label="MASTER RISK" value={components.masterScore} kind="risk" />
          <Metric label="CRASH SCORE" value={components.crashScore} kind="risk" />
          <Metric label="CONSTRUCTIVE EDGE" value={components.edgeScore} kind="health" />
          <Metric label="LIQUIDITY" value={components.liquidityScore} kind="health" />
          <Metric label="PARTICIPATION" value={components.participationScore} kind="health" />
          <Metric label="FRAGILITY" value={components.fragilityScore} kind="risk" />
          <Metric label="ROTATION DECAY" value={components.rotationDecayScore} kind="risk" />
          <Metric label="ROTATION CONFIRMATION" value={components.rotationConfidence} suffix="/100" />
          <Metric label="MARKET QUALITY" value={components.marketQualityScore} kind="health" />
          <Metric label="BREADTH THRUST" value={components.breadthThrustScore} kind="health" />
          <Metric label="DANGER" value={components.dangerScore} kind="risk" />
          <Metric label="SQUEEZE MODEL" value={components.squeezeRisk} kind="risk" />
        </MetricGrid>
      </CollapsibleSection>

      <CollapsibleSection title="STRUCTURE / HISTORY" subtitle="Measured breadth and historical model context">
        <MetricGrid>
          <Metric label="BREADTH 50" value={components.breadth50} decimals={1} suffix="%" kind="health" />
          <Metric label="BREADTH 200" value={components.breadth200} decimals={1} suffix="%" kind="health" />
          <Metric label="BREADTH TREND" value={components.breadthTrend} decimals={1} kind="improvement" />
          <Metric label="SHORT BREADTH CHANGE" value={components.breadthAcceleration} decimals={1} kind="improvement" />
          <Metric label="NEW-HIGH DECAY" value={components.participationDecay} kind="deterioration" />
          <Metric label="LEADERSHIP DECAY" value={components.leadershipDecay} kind="deterioration" />
          <Metric label="RELATIVE BREADTH" value={components.relativeBreadthWeakness} decimals={1} />
          <Metric label="PHASE OBSERVATIONS" value={components.phasePersistence} />
          <Metric label="PERSISTENCE RISK SCORE" value={components.regimePersistence} kind="risk" />
        </MetricGrid>
      </CollapsibleSection>

      <CollapsibleSection title="FLOW PIPELINE" subtitle="Calculated size before and after model adjustments">
        <MetricGrid minWidth={210}>
          {[
            { title: "NASDAQ PUT", flow: nasdaqPut },
            { title: "NASDAQ CALL", flow: nasdaqCall },
            { title: "RUSSELL CALL", flow: russellCall },
          ].map(({ title, flow }) => (
            <div
              key={title}
              style={{ border: "1px solid #222", padding: "10px", minWidth: 0 }}
            >
              <SectionTitle>{title}</SectionTitle>
              {flow
                ? <FlowDiagnostics flow={flow} />
                : <div style={{ color: "#666", fontSize: "10px" }}>NO DATA</div>}
            </div>
          ))}
        </MetricGrid>
      </CollapsibleSection>

      <div
        style={{
          marginTop: "12px",
          paddingTop: "10px",
          borderTop: "1px solid #222",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          color: "#666",
          fontSize: "9px",
        }}
      >
        <span>ACTIVE {activeFlows ? activeFlows.length : "—"}</span>
        <span>INSTRUMENTS {activeInstruments ? activeInstruments.length : "—"}</span>
        <span style={{ color: directionalConflict ? "#fa8c16" : "#666" }}>
          CONFLICT {directionalConflict ? "YES" : "NO"}
        </span>
        <span style={{ color: allocationIssue ? "#fa8c16" : "#666" }}>
          ALLOCATION CHECK {dataStatus}
        </span>
      </div>
    </div>
  );
}