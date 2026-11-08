"use client";

type Props = {
  executionState: any;
  regimeSync: any;
  dangerZone: any;
  phase: string;
};

/* =====================================================
REGIME RIBBON PANEL

Compact display of existing engine states.
No score recalculation or trading-decision changes.
Execution status replaces the global confidence percentage.
===================================================== */

function safeText(value: unknown, fallback = "N/A"): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function safeBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
}

function getPhaseColor(phaseValue: string): string {
  const value = safeText(phaseValue, "").toUpperCase();
  if (value === "PHASE_1" || value.includes("PHASE_1_EXPANSION")) return "#6ee7b7";
  if (value === "PHASE_2" || value.includes("PHASE_2_WARNING")) return "#a7f3d0";
  if (value === "PHASE_3" || value.includes("PHASE_3_DISTRIBUTION")) return "#fcd34d";
  if (value === "PHASE_4" || value.includes("PHASE_4_RISK")) return "#fdba74";
  if (value === "PHASE_5" || value.includes("PHASE_5_BREAKDOWN")) return "#fda4af";
  if (value === "PHASE_6" || value.includes("PHASE_6_ACCELERATION")) return "#a8071a";
  if (value === "PHASE_7" || value.includes("PHASE_7_CAPITULATION")) return "#7f1d1d";
  return "#64748b";
}

function getModeColor(mode: string): string {
  switch (mode.toUpperCase()) {
    case "RISK_ON": return "#6ee7b7";
    case "RISK_OFF":
    case "RISK": return "#fda4af";
    case "TRANSITION": return "#fcd34d";
    default: return "#94a3b8";
  }
}

function getRiskColor(risk: string): string {
  switch (risk.toUpperCase()) {
    case "STABLE": return "#6ee7b7";
    case "FRAGILE": return "#fdba74";
    case "BREAKDOWN": return "#fda4af";
    case "CRISIS": return "#fda4af";
    default: return "#64748b";
  }
}

function getDangerColor(level: string): string {
  switch (level.toUpperCase()) {
    case "LOW": return "#6ee7b7";
    case "ELEVATED": return "#fcd34d";
    case "HIGH": return "#fda4af";
    case "EXTREME": return "#fda4af";
    default: return "#64748b";
  }
}

function getSyncColor(state: string): string {
  switch (state.toUpperCase()) {
    case "ALIGNED": return "#6ee7b7";
    case "TRANSITION": return "#fcd34d";
    case "FRAGILE": return "#fdba74";
    case "DIVERGING": return "#fda4af";
    case "BREAKDOWN": return "#fda4af";
    case "CRISIS": return "#a8071a";
    default: return "#64748b";
  }
}

function getBiasColor(bias: string): string {
  switch (bias.toUpperCase()) {
    case "BULLISH":
    case "LONG":
    case "LONG_INDEX": return "#6ee7b7";
    case "BEARISH":
    case "SHORT":
    case "SHORT_INDEX": return "#fda4af";
    default: return "#cbd5e1";
  }
}

function getUrgencyColor(urgency: string): string {
  switch (urgency.toUpperCase()) {
    case "EXTREME": return "#fda4af";
    case "HIGH": return "#fda4af";
    case "MEDIUM": return "#fcd34d";
    case "LOW": return "#6ee7b7";
    default: return "#cbd5e1";
  }
}

function RibbonBlock({label, value, color}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{padding: "10px", border: `1px solid ${color}`, background: "#121d2a", textAlign: "center", minHeight: "72px", borderRadius: "6px", minWidth: 0}}>
      <div style={{fontSize: "10px", color: "#64748b", marginBottom: "6px", letterSpacing: "0.5px", whiteSpace: "nowrap"}}>{label}</div>
      <div style={{color, fontWeight: "bold", fontSize: "14px", lineHeight: 1.2, overflowWrap: "anywhere"}}>{value}</div>
    </div>
  );
}

export default function RegimeRibbonPanel({executionState, regimeSync, dangerZone, phase}: Props) {
  if (!executionState) return null;

  const phaseValue = safeText(phase, "UNKNOWN");
  const marketMode = safeText(executionState.marketMode, "UNKNOWN");
  const riskState = safeText(executionState.riskState);
  const syncState = safeText(regimeSync?.state);
  const dangerLevel = safeText(dangerZone?.level);
  const executionMode = safeText(executionState.executionMode, "WAIT");
  const tacticalBias = safeText(executionState.tacticalBias, "NEUTRAL");
  const urgency = safeText(executionState.urgency, "N/A");

  // Preserve explicit false; unknown alignment must remain distinguishable.
  const executionAlignment = safeBoolean(executionState.regimeAlignment);
  const syncAlignment = safeBoolean(regimeSync?.aligned);
  const regimeAlignment = executionAlignment ?? syncAlignment;
  const alignmentText = regimeAlignment === true ? "CONFIRMED" : regimeAlignment === false ? "UNSTABLE" : "UNKNOWN";
  const alignmentColor = regimeAlignment === true ? "#6ee7b7" : regimeAlignment === false ? "#fda4af" : "#94a3b8";
  const phaseColor = getPhaseColor(phaseValue);
  const summary = `${marketMode} | ${tacticalBias} | ${executionMode}`;

  return (
    <div style={{background: "#0e1722", border: `1px solid ${phaseColor}`, padding: "16px", marginBottom: "16px", borderRadius: "8px", width: "100%", boxSizing: "border-box"}}>
      {/* HEADER */}
      <div style={{marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap"}}>
        <div style={{color: "#94a3b8", fontSize: "13px", fontWeight: "bold", letterSpacing: "0.5px"}}>REGIME COMMAND CENTER</div>
        <div style={{color: "#7dd3fc", fontSize: "12px", fontWeight: "bold"}}>Regime-Ausführung: {executionMode}</div>
      </div>

      {/* SUMMARY */}
      <div style={{marginBottom: "16px", padding: "12px", border: `1px solid ${phaseColor}`, color: phaseColor, background: "rgba(255,255,255,0.02)", fontWeight: "bold", textAlign: "center", fontSize: "14px", borderRadius: "6px", overflowWrap: "anywhere"}}>{summary}</div>

      {/* STATE GRID */}
      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", width: "100%"}}>
        <RibbonBlock label="PHASE" value={phaseValue} color={phaseColor} />
        <RibbonBlock label="MODE" value={marketMode} color={getModeColor(marketMode)} />
        <RibbonBlock label="RISK" value={riskState} color={getRiskColor(riskState)} />
        <RibbonBlock label="REGIME SYNC" value={syncState} color={getSyncColor(syncState)} />
        <RibbonBlock label="DANGER" value={dangerLevel} color={getDangerColor(dangerLevel)} />
        <RibbonBlock label="REGIME-AUSFÜHRUNG" value={executionMode} color="#7dd3fc" />
      </div>

      <p style={{fontSize: "11px", color: "#94a3b8", lineHeight: 1.5}}>Allgemeiner Regime-Status. Einzelne Instrumente können trotz WAIT einen begrenzten Starter freigeben; maßgeblich sind Trade Stack und Positionsgröße.</p>

      {/* FOOTER */}
      <div style={{marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "11px", color: "#64748b"}}>
        <div>Bias: <span style={{color: getBiasColor(tacticalBias), fontWeight: "bold"}}>{tacticalBias}</span></div>
        <div>Urgency: <span style={{color: getUrgencyColor(urgency), fontWeight: "bold"}}>{urgency}</span></div>
        <div>Alignment: <span style={{color: alignmentColor, fontWeight: "bold"}}>{alignmentText}</span></div>
      </div>
    </div>
  );
}
