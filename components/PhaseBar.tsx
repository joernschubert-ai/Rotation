"use client";

type Props = {
  phase?: string;
  regime?: any;
  marketPhase?: any;
};

const phases = [
  {
    key: "PHASE_1_EXPANSION",
    label: "Phase 1 – Expansion",
    description: "Broad Participation",
    context: "LONG REGIME",
    interpretation: "Broad participation supports a constructive phase",
    color: "#6ee7b7",
  },
  {
    key: "PHASE_2_WARNING",
    label: "Phase 2 – Warning",
    description: "Early Internal Deterioration",
    context: "LONG / SELECTIVE",
    interpretation: "Monitor emerging internal deterioration",
    color: "#fcd34d",
  },
  {
    key: "PHASE_3_DISTRIBUTION",
    label: "Phase 3 – Distribution",
    description: "Institutional Distribution",
    context: "TRANSITION",
    interpretation: "Distribution phase with incomplete regime transition",
    color: "#fdba74",
  },
  {
    key: "PHASE_4_RISK",
    label: "Phase 4 – Risk",
    description: "Structural Deterioration",
    context: "DEFENSIVE",
    interpretation: "Structural deterioration requires a defensive posture",
    color: "#fa541c",
  },
  {
    key: "PHASE_5_BREAKDOWN",
    label: "Phase 5 – Breakdown",
    description: "Structural Breakdown",
    context: "RISK OFF",
    interpretation: "Structural breakdown phase",
    color: "#fda4af",
  },
  {
    key: "PHASE_6_ACCELERATION",
    label: "Phase 6 – Acceleration",
    description: "Forced Liquidation",
    context: "CRISIS MANAGEMENT",
    interpretation: "Downside acceleration and forced liquidation phase",
    color: "#722ed1",
  },
  {
    key: "PHASE_7_CAPITULATION",
    label: "Phase 7 – Capitulation",
    description: "Panic Exhaustion",
    context: "CAPITULATION MANAGEMENT",
    interpretation: "Panic exhaustion with elevated reversal risk",
    color: "#391085",
  },
];

function safeText(value: unknown, fallback = "UNKNOWN"): string {
  return typeof value === "string" && value.trim() !== ""
    ? value
    : fallback;
}

function safeConfidence(value: unknown): number | null {
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

  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
    ? parsed
    : null;
}

function getRegimeColor(state: string): string {
  const value = state.toUpperCase();

  if (value.includes("CAPITULATION")) return "#391085";
  if (value.includes("CRISIS")) return "#722ed1";

  if (
    value.includes("RISK_OFF") ||
    value.includes("BREAKDOWN")
  ) {
    return "#fda4af";
  }

  if (value.includes("FRAGILE")) return "#fa541c";

  if (
    value.includes("TRANSITION") ||
    value.includes("DISTRIBUTION")
  ) {
    return "#fdba74";
  }

  // Check this before the broader EXPANSION match.
  if (value.includes("LATE_EXPANSION")) return "#fcd34d";

  if (
    value.includes("RISK_ON") ||
    value.includes("EXPANSION")
  ) {
    return "#6ee7b7";
  }

  return "#94a3b8";
}

function confidenceColor(value: number | null): string {
  if (value === null) return "#94a3b8";
  if (value >= 85) return "#6ee7b7";
  if (value >= 70) return "#13c2c2";
  if (value >= 55) return "#fcd34d";
  return "#94a3b8";
}

function confidenceLabel(value: number | null): string {
  if (value === null) return "UNAVAILABLE";
  if (value >= 85) return "HIGH";
  if (value >= 70) return "CONFIRMED";
  if (value >= 55) return "MODERATE";
  return "LOW";
}

export default function PhaseBar({
  phase,
  regime,
  marketPhase,
}: Props) {
  const phaseData =
    marketPhase &&
    typeof marketPhase === "object" &&
    !Array.isArray(marketPhase)
      ? marketPhase
      : null;

  const currentPhaseKey = safeText(
    phaseData?.phase ?? phase ?? regime?.phase
  );

  // The phase producer is authoritative when supplied.
  const regimeState = safeText(
    phaseData
      ? phaseData.regimeState
      : regime?.regimeState
  );

  const subPhase = safeText(
    phaseData
      ? phaseData.subPhase
      : regime?.subPhase
  );

  // Never substitute regime.score or crash.score.
  const confidence = safeConfidence(
    phaseData
      ? phaseData.confidence
      : regime?.confidence
  );

  const activeIndex = phases.findIndex(
    item => item.key === currentPhaseKey
  );

  const currentPhase =
    activeIndex >= 0 ? phases[activeIndex] : null;

  const phaseColor = currentPhase?.color ?? "#94a3b8";
  const regimeColor = getRegimeColor(regimeState);
  const confColor = confidenceColor(confidence);

  const confidenceText = confidence === null
    ? "—"
    : `${confidence.toLocaleString("de-DE", {
        maximumFractionDigits: 1,
      })}%`;

  const box = {
    background: "#121d2a",
    border: "1px solid #334155",
    padding: "10px",
    minWidth: 0,
  };

  return (
    <div
      style={{
        background: "#0e1722",
        border: "1px solid #334155",
        padding: "16px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: "#cbd5e1", fontSize: "15px" }}>
            MARKET REGIME
          </h3>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
            Institutional 7-Phase Market Model
          </div>
        </div>

        <div
          style={{
            color: phaseColor,
            border: `1px solid ${phaseColor}`,
            padding: "5px 9px",
            fontSize: "10px",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          {currentPhase?.context ?? "PHASE UNAVAILABLE"}
        </div>
      </div>

      <div
        style={{
          background: "#121d2a",
          border: `1px solid ${phaseColor}`,
          borderLeft: `4px solid ${phaseColor}`,
          padding: "12px",
          marginBottom: "14px",
        }}
      >
        <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px" }}>
          CURRENT MARKET PHASE
        </div>

        <div style={{ color: phaseColor, fontWeight: "bold", fontSize: "17px" }}>
          ● {currentPhase?.label ?? "Unknown Market Phase"}
        </div>

        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
          {currentPhase?.description ?? "No recognized phase supplied"}
        </div>

        <div
          style={{
            fontSize: "11px",
            color: "#94a3b8",
            marginTop: "8px",
            lineHeight: "1.4",
          }}
        >
          {currentPhase?.interpretation ?? "Phase interpretation unavailable"}
        </div>
      </div>

      <div style={{ marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
        <div style={{ minWidth: "420px" }}>
          <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
            {phases.map((item, index) => {
              const active = index === activeIndex;
              const lower = activeIndex >= 0 && index < activeIndex;

              return (
                <div
                  key={item.key}
                  style={{
                    flex: 1,
                    height: active ? "12px" : "8px",
                    marginTop: active ? "0" : "2px",
                    background: active
                      ? item.color
                      : lower ? "#475569" : "#162232",
                    borderRadius: "4px",
                    transition: "all 0.3s ease",
                    boxShadow: active
                      ? `0 0 8px ${item.color}55`
                      : "none",
                  }}
                />
              );
            })}
          </div>

          <div style={{ display: "flex", fontSize: "10px", color: "#64748b" }}>
            {phases.map((item, index) => (
              <span
                key={item.key}
                style={{
                  flex: 1,
                  textAlign: "center",
                  color: index === activeIndex ? phaseColor : "#64748b",
                  fontWeight: index === activeIndex ? "bold" : "normal",
                }}
              >
                {index + 1}
              </span>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "5px",
              fontSize: "9px",
              color: "#64748b",
            }}
          >
            {phases.map((item, index) => (
              <div
                key={item.key}
                style={{
                  flex: 1,
                  textAlign: "center",
                  color: index === activeIndex ? phaseColor : "#64748b",
                  whiteSpace: "nowrap",
                }}
              >
                {activeIndex < 0
                  ? "UNKNOWN"
                  : index === activeIndex
                    ? "ACTIVE"
                    : index < activeIndex
                      ? "LOWER"
                      : "HIGHER"}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        <div style={box}>
          <div style={{ fontSize: "10px", color: "#64748b" }}>
            REGIME STATE
          </div>
          <div
            style={{
              marginTop: "5px",
              color: regimeColor,
              fontWeight: "bold",
              fontSize: "15px",
              overflowWrap: "anywhere",
            }}
          >
            {regimeState}
          </div>
        </div>

        <div style={box}>
          <div style={{ fontSize: "10px", color: "#64748b" }}>
            SUB PHASE
          </div>
          <div
            style={{
              marginTop: "5px",
              color: "#e2e8f0",
              fontWeight: "bold",
              fontSize: "13px",
              lineHeight: "1.35",
              overflowWrap: "anywhere",
            }}
          >
            {subPhase}
          </div>
        </div>

        <div style={box}>
          <div style={{ fontSize: "10px", color: "#64748b" }}>
            PHASE CONFIDENCE
          </div>
          <div
            style={{
              marginTop: "5px",
              fontSize: "16px",
              fontWeight: "bold",
              color: confColor,
            }}
          >
            {confidenceText}
          </div>
          <div style={{ marginTop: "2px", fontSize: "10px", color: confColor }}>
            {confidenceLabel(confidence)}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "11px",
          border: "1px solid #334155",
          borderLeft: `3px solid ${phaseColor}`,
          fontSize: "11px",
          lineHeight: "1.55",
          color: "#94a3b8",
          background: "#121d2a",
          overflowWrap: "anywhere",
        }}
      >
        <span style={{ color: "#64748b" }}>MARKET CLASSIFICATION</span>
        <br />
        <span style={{ color: phaseColor, fontWeight: "bold" }}>
          {currentPhase?.label ?? currentPhaseKey}
        </span>
        {" · "}
        <span style={{ color: regimeColor, fontWeight: "bold" }}>
          {regimeState}
        </span>
        {" · "}
        <span style={{ color: "#e2e8f0", fontWeight: "bold" }}>
          {subPhase}
        </span>
      </div>
    </div>
  );
}