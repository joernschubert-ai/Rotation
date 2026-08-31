"use client";

import type { CSSProperties } from "react";

export default function MasterPanel({
master,
decision,
signal,
nasdaq
}: any) {

if (!master) return null;

/* =====================================================
MASTER SCORE SEMANTICS

 0   = CALL / CONSTRUCTIVE
 50  = NEUTRAL / TRANSITION
 100 = PUT / DEFENSIVE

 IMPORTANT:
 The engine already returns RISK-oriented values.
 The panel MUST NOT invert them.

===================================================== */

const score = Math.max(
0,
Math.min(
100,
Number(master.score ?? 0)
)
);

/* =====================================================
COLOR SYSTEM
===================================================== */

const COLORS = {
green: "#52c41a",
greenSoft: "#95de64",

yellow: "#fadb14",
yellowSoft: "#ffe58f",

orange: "#fa8c16",
orangeSoft: "#ffc069",

red: "#ff4d4f",
redSoft: "#ff7875",

blue: "#40a9ff",

text: "#ddd",
textMuted: "#888",
textDim: "#666",

background: "#0d0d0d",
backgroundCard: "#141414",
backgroundStrong: "#111",

border: "#242424",
borderSoft: "#1d1d1d"

};

/* =====================================================
MASTER SCORE COLOR
===================================================== */

function getScoreColor(value: number) {

if (value >= 65) {
  return COLORS.red;
}

if (value >= 36) {
  return COLORS.yellow;
}

return COLORS.green;

}

/* =====================================================
MASTER SCORE LABEL
===================================================== */

function getScoreLabel(value: number) {

if (value <= 35) {
  return "CALL / CONSTRUCTIVE";
}

if (value <= 64) {
  return "NEUTRAL / TRANSITION";
}

return "PUT / DEFENSIVE";

}

/* =====================================================
MASTER SCORE DESCRIPTION
===================================================== */

function getScoreDescription(value: number) {

if (value <= 35) {
  return "Constructive market structure";
}

if (value <= 64) {
  return "No clear directional edge";
}

return "Defensive market structure";

}

/* =====================================================
MODE COLOR
===================================================== */

function getModeColor(mode: string) {

if (mode === "LONG") {
  return COLORS.green;
}

if (mode === "RISK") {
  return COLORS.orange;
}

if (mode === "CRASH") {
  return COLORS.red;
}

return COLORS.textMuted;

}

/* =====================================================
REGIME COLOR
===================================================== */

function getRegimeColor(regime: string) {

if (regime === "CRASH") {
  return COLORS.red;
}

if (regime === "RISK") {
  return COLORS.orange;
}

if (regime === "TRANSITION") {
  return COLORS.yellow;
}

if (regime === "LONG") {
  return COLORS.green;
}

return COLORS.textMuted;

}

/* =====================================================
EXPOSURE COLOR
===================================================== */

function getExposureColor(exp: number) {

if (exp <= -70) {
  return COLORS.red;
}

if (exp <= -40) {
  return COLORS.orange;
}

if (exp <= -10) {
  return COLORS.yellow;
}

if (exp > 0) {
  return COLORS.green;
}

return COLORS.textMuted;

}

/* =====================================================
RISK COLOR

 HIGH = RISK / PUT
 LOW  = CONSTRUCTIVE / CALL

===================================================== */

function getRiskColor(value: number) {

if (value >= 75) {
  return COLORS.red;
}

if (value >= 65) {
  return COLORS.orange;
}

if (value >= 35) {
  return COLORS.yellow;
}

return COLORS.green;

}

/* =====================================================
SAFE VALUE
===================================================== */

function safeScore(value: any) {

const number =
  Number(value);

if (!Number.isFinite(number)) {
  return 0;
}

return Math.max(
  0,
  Math.min(
    100,
    number
  )
);

}

/* =====================================================
COMPONENT BAR
===================================================== */

function bar(value: number) {

const safeValue =
  safeScore(value);

return {
  width: `${safeValue}%`,
  height: "5px",
  background:
    getRiskColor(safeValue),
  borderRadius: "3px",
  transition:
    "width 0.25s ease"
};

}

/* =====================================================
SIGNAL
===================================================== */

const signalFromMaster =
master.signal ??
signal?.type ??
"NO SIGNAL";

function getSignalColor(type: string) {

if (!type) {
  return COLORS.textMuted;
}

const normalized =
  String(type)
    .toUpperCase();

if (
  normalized.includes("PUT") ||
  normalized.includes("SHORT") ||
  normalized.includes("RISK")
) {
  return COLORS.red;
}

if (
  normalized.includes("CALL") ||
  normalized.includes("LONG") ||
  normalized.includes("RUSSELL")
) {
  return COLORS.green;
}

if (
  normalized.includes("BUILD") ||
  normalized.includes("WAIT") ||
  normalized.includes("SETUP")
) {
  return COLORS.yellow;
}

return COLORS.textMuted;

}

function getSignalText() {

const type =
  String(signalFromMaster)
    .toUpperCase();

if (
  type === "STRONG_PUT"
) {
  return "ADD PUTS AGGRESSIVELY";
}

if (
  type === "PUT_BUILD"
) {
  return "BUILD PUT POSITION";
}

if (
  type === "LONG_RUSSELL"
) {
  return "ROTATE INTO RUSSELL";
}

if (
  type === "REDUCE"
) {
  return "REDUCE EXPOSURE";
}

if (
  type === "SHORT_SETUP"
) {
  return "SHORT SETUP";
}

if (
  type === "NO_SIGNAL"
) {
  return "NO SIGNAL";
}

return type
  .replaceAll("_", " ");

}

/* =====================================================
GLOBAL DECISION
===================================================== */

const globalDecision =
decision?.finalAction ??
"WAIT";

const globalDirection =
decision?.direction ??
"NEUTRAL";

function getDecisionColor(
action: string
) {

const normalized =
  String(action)
    .toUpperCase();

if (
  normalized.includes("PUT") ||
  normalized.includes("SHORT") ||
  normalized.includes("DEFENSIVE")
) {
  return COLORS.red;
}

if (
  normalized.includes("RUSSELL") ||
  normalized.includes("LONG") ||
  normalized.includes("CALL")
) {
  return COLORS.green;
}

if (
  normalized.includes("WAIT")
) {
  return COLORS.yellow;
}

return COLORS.textMuted;

}

/* =====================================================
EXECUTION
===================================================== */

function getExecution() {

if (!decision) {
  return "NO DATA";
}

const action =
  String(globalDecision)
    .toUpperCase();

if (
  action.includes("MAX")
) {
  return "FULL POSITION";
}

if (
  action.includes("AGGRESSIVE")
) {
  return "ADD FAST";
}

if (
  action.includes("BUILD")
) {
  return "SCALE IN";
}

if (
  action.includes("ENTER")
) {
  return "INITIATE";
}

if (
  action.includes("WAIT")
) {
  return "HOLD / WAIT";
}

return "MANAGE";

}

/* =====================================================
MASTER SUMMARY
===================================================== */

const masterSummary =
master.summary ??
"No summary available";

function getSummaryColor() {

const normalized =
  String(
    master.signal ??
    signalFromMaster ??
    ""
  ).toUpperCase();

if (
  normalized.includes("PUT") ||
  normalized.includes("SHORT")
) {
  return COLORS.red;
}

if (
  normalized.includes("CALL") ||
  normalized.includes("LONG")
) {
  return COLORS.green;
}

if (
  master.mode === "RISK"
) {
  return COLORS.orange;
}

return COLORS.yellow;

}

/* =====================================================
NASDAQ
===================================================== */

function getNasdaqColor() {

if (!nasdaq?.active) {
  return COLORS.textDim;
}

if (
  nasdaq.mode === "MOMENTUM_LONG" ||
  nasdaq.mode === "TACTICAL_LONG" ||
  nasdaq.mode === "PULLBACK_LONG"
) {
  return COLORS.blue;
}

return COLORS.textMuted;

}

function getNasdaqText() {

if (!nasdaq?.active) {
  return "NASDAQ OFF";
}

if (
  nasdaq.mode === "MOMENTUM_LONG"
) {
  return "MOMENTUM LONG";
}

if (
  nasdaq.mode === "TACTICAL_LONG"
) {
  return "TACTICAL LONG";
}

if (
  nasdaq.mode === "PULLBACK_LONG"
) {
  return "PULLBACK LONG";
}

return String(
  nasdaq.mode ??
  "ACTIVE"
).replaceAll("_", " ");

}

/* =====================================================
COMPONENTS
===================================================== */

const components =
master.components ?? {};

const crash =
safeScore(
components.crash
);

const rotation =
safeScore(
components.rotation
);

const priceMomentum =
safeScore(
components.priceMomentum
);

const timing =
safeScore(
components.timing
);

const russell =
safeScore(
components.russell
);

const participation =
safeScore(
components.participation
);

const breadthThrust =
safeScore(
components.breadthThrust
);

const breadthVelocity =
safeScore(
components.breadthVelocity
);

const rotationDecay =
safeScore(
components.rotationDecay
);

const liquidity =
safeScore(
components.liquidity
);

const marketQuality =
safeScore(
components.marketQuality
);

const fragility =
safeScore(
components.fragility
);

const regimeSync =
safeScore(
components.regimeSync
);

const dangerZone =
safeScore(
components.dangerZone
);

const regimePersistence =
safeScore(
components.regimePersistence
);

const distributionRisk =
safeScore(
components.distributionRisk
);

const falseRecoveryRisk =
safeScore(
components.falseRecoveryRisk
);

const marketFatigue =
safeScore(
components.marketFatigue
);

/* =====================================================
META
===================================================== */

const meta =
master.meta ?? {};

/* =====================================================
STRUCTURAL FLAGS
===================================================== */

const weakInternals =
Boolean(
meta.weakInternals
);

const narrowLeadership =
Boolean(
meta.narrowLeadership
);

const defensiveEvidenceCount =
Number(
meta.defensiveEvidenceCount ?? 0
);

const defensiveStructuralConfirmation =
Boolean(
meta.defensiveStructuralConfirmation
);

const strongDefensiveStructure =
Boolean(
meta.strongDefensiveStructure
);

/* =====================================================
PHASE RESOLUTION

 We deliberately check several possible
 locations because the panel should not display
 UNKNOWN merely because the engine moved the phase
 property into another object.

===================================================== */

const phaseCandidates = [
meta.phase,
master.phase,
master.rotationPhase,
master.rotation?.phase,
master.regimePhase,
master.structure?.phase,
decision?.phase,
decision?.rotationPhase,
decision?.regimePhase
];

const phase =
phaseCandidates.find(
(value: any) =>
value !== undefined &&
value !== null &&
String(value).trim() !== "" &&
String(value).toUpperCase() !== "UNKNOWN"
) ?? "UNKNOWN";

/* =====================================================
PHASE CONFIDENCE
===================================================== */

const phaseConfidence =
safeScore(
meta.phaseConfidence ??
master.phaseConfidence ??
master.rotationPhaseConfidence ??
decision?.phaseConfidence ??
0
);

/* =====================================================
PHASE CONFIRMATION
===================================================== */

const phaseConfirmed =
Boolean(
meta.phaseConfirmed ??
master.phaseConfirmed ??
decision?.phaseConfirmed ??
false
);

/* =====================================================
QUALITY / RISK
===================================================== */

const currentQuality =
safeScore(
meta.currentQuality
);

const structuralQuality =
safeScore(
meta.structuralQuality
);

const historicalQuality =
safeScore(
meta.historicalQuality
);

const crashRisk =
safeScore(
meta.crashRisk ??
crash
);

const timingRisk =
safeScore(
meta.timingRisk ??
timing
);

const russellRisk =
safeScore(
meta.russellRisk ??
russell
);

/* =====================================================
RESPONSIVE STYLES
===================================================== */

const panelStyle: CSSProperties = {
background:
COLORS.background,

border:
  `1px solid ${COLORS.border}`,

padding:
  "clamp(10px, 2vw, 16px)",

color:
  COLORS.text,

width:
  "100%",

maxWidth:
  "100%",

minWidth:
  0,

boxSizing:
  "border-box",

overflow:
  "hidden",

borderRadius:
  "4px"

};

const headerStyle: CSSProperties = {
display:
"flex",

flexWrap:
  "wrap",

alignItems:
  "center",

justifyContent:
  "space-between",

gap:
  "8px",

marginBottom:
  "10px"

};

const gridStyle: CSSProperties = {
display:
"grid",

gridTemplateColumns:
  "repeat(auto-fit, minmax(min(100%, 145px), 1fr))",

gap:
  "8px",

width:
  "100%",

minWidth:
  0

};

const cardStyle: CSSProperties = {
background:
COLORS.backgroundCard,

border:
  `1px solid ${COLORS.border}`,

padding:
  "8px",

minWidth:
  0,

boxSizing:
  "border-box",

borderRadius:
  "3px",

overflow:
  "hidden"

};

const labelStyle: CSSProperties = {
color:
COLORS.textMuted,

fontSize:
  "9px",

textTransform:
  "uppercase",

letterSpacing:
  "0.05em",

marginBottom:
  "4px",

lineHeight:
  1.2

};

const valueStyle: CSSProperties = {
fontSize:
"14px",

fontWeight:
  "bold",

lineHeight:
  1.25,

overflowWrap:
  "anywhere",

wordBreak:
  "break-word",

minWidth:
  0

};

const progressBackgroundStyle: CSSProperties = {
background:
"#222",

marginTop:
  "5px",

borderRadius:
  "3px",

overflow:
  "hidden",

width:
  "100%"

};

const detailsStyle: CSSProperties = {
marginTop:
"10px",

border:
  `1px solid ${COLORS.border}`,

background:
  "#101010",

borderRadius:
  "3px",

overflow:
  "hidden"

};

const summaryButtonStyle: CSSProperties = {
cursor:
"pointer",

padding:
  "9px 10px",

color:
  COLORS.textMuted,

fontSize:
  "10px",

fontWeight:
  "bold",

textTransform:
  "uppercase",

letterSpacing:
  "0.05em",

userSelect:
  "none",

listStyle:
  "none"

};

const detailsContentStyle: CSSProperties = {
padding:
"0 8px 8px 8px"
};

/* =====================================================
SMALL COMPONENT
===================================================== */

function MetricCard({
label,
value,
color,
progress
}: {
label: string;
value: string | number;
color?: string;
progress?: number;
}) {

return (
  <div style={cardStyle}>

    <div style={labelStyle}>
      {label}
    </div>

    <div
      style={{
        ...valueStyle,
        color:
          color ??
          COLORS.text
      }}
    >
      {value}
    </div>

    {progress !== undefined && (
      <div
        style={
          progressBackgroundStyle
        }
      >
        <div
          style={
            bar(progress)
          }
        />
      </div>
    )}

  </div>
);

}

/* =====================================================
RENDER
===================================================== */

return (

<div style={panelStyle}>

  {/* =================================================
     HEADER
  ================================================= */}

  <div style={headerStyle}>

    <h3
      style={{
        color:
          "#aaa",

        margin:
          0,

        fontSize:
          "13px",

        letterSpacing:
          "0.06em"
      }}
    >
      MASTER CONTROL
    </h3>

    <div
      style={{
        color:
          getModeColor(
            master.mode
          ),

        border:
          `1px solid ${getModeColor(
            master.mode
          )}`,

        padding:
          "3px 7px",

        fontSize:
          "9px",

        fontWeight:
          "bold",

        whiteSpace:
          "nowrap"
      }}
    >
      MODE: {master.mode ?? "UNKNOWN"}
    </div>

  </div>

  {/* =================================================
     COMPACT MASTER SCORE
  ================================================= */}

  <div
    style={{
      border:
        `1px solid ${getScoreColor(score)}`,

      background:
        COLORS.backgroundStrong,

      padding:
        "10px",

      marginBottom:
        "10px",

      boxSizing:
        "border-box",

      borderRadius:
        "3px",

      width:
        "100%",

      minWidth:
        0
    }}
  >

    <div
      style={{
        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",

        gap:
          "10px",

        minWidth:
          0,

        flexWrap:
          "wrap"
      }}
    >

      <div
        style={{
          minWidth:
            0,

          flex:
            "1 1 110px"
        }}
      >

        <div
          style={{
            ...labelStyle,
            marginBottom:
              "3px"
          }}
        >
          MASTER SCORE · RISK
        </div>

        <div
          style={{
            color:
              getScoreColor(score),

            fontSize:
              "clamp(24px, 7vw, 32px)",

            fontWeight:
              "bold",

            lineHeight:
              1
          }}
        >
          {score}/100
        </div>

      </div>

      <div
        style={{
          flex:
            "1 1 130px",

          minWidth:
            0,

          textAlign:
            "right",

          color:
            getScoreColor(score),

          fontSize:
            "clamp(11px, 3vw, 14px)",

          fontWeight:
            "bold",

          overflowWrap:
            "anywhere"
        }}
      >
        {getScoreLabel(score)}
      </div>

    </div>

    <div
      style={{
        marginTop:
          "6px",

        color:
          COLORS.textMuted,

        fontSize:
          "10px",

        lineHeight:
          1.35
      }}
    >
      {getScoreDescription(score)}
    </div>

    {/* SCORE SCALE */}

    <div
      style={{
        marginTop:
          "9px",

        position:
          "relative",

        height:
          "5px",

        background:
          "linear-gradient(to right, #52c41a 0%, #52c41a 35%, #fadb14 35%, #fadb14 65%, #ff4d4f 65%, #ff4d4f 100%)",

        borderRadius:
          "3px",

        width:
          "100%"
      }}
    >

      <div
        style={{
          position:
            "absolute",

          top:
            "-3px",

          left:
            `calc(${score}% - 2px)`,

          width:
            "4px",

          height:
            "11px",

          background:
            "#fff",

          borderRadius:
            "2px",

          boxShadow:
            "0 0 4px rgba(255,255,255,0.8)"
        }}
      />

    </div>

    <div
      style={{
        display:
          "flex",

        justifyContent:
          "space-between",

        color:
          COLORS.textDim,

        fontSize:
          "8px",

        marginTop:
          "4px",

        gap:
          "4px"
      }}
    >
      <span>
        CALL 0
      </span>

      <span>
        NEUTRAL 50
      </span>

      <span>
        PUT 100
      </span>
    </div>

  </div>

  {/* =================================================
     DECISION HERO
  ================================================= */}

  <div
    style={{
      border:
        `2px solid ${getDecisionColor(
          globalDecision
        )}`,

      background:
        "#151515",

      padding:
        "10px",

      marginBottom:
        "10px",

      borderRadius:
        "3px",

      minWidth:
        0
    }}
  >

    <div
      style={{
        display:
          "flex",

        flexWrap:
          "wrap",

        justifyContent:
          "space-between",

        alignItems:
          "center",

        gap:
          "8px"
      }}
    >

      <div>

        <div style={labelStyle}>
          DECISION
        </div>

        <div
          style={{
            color:
              getDecisionColor(
                globalDecision
              ),

            fontSize:
              "clamp(14px, 4vw, 18px)",

            fontWeight:
              "bold",

            overflowWrap:
              "anywhere"
          }}
        >
          {globalDecision}
        </div>

      </div>

      <div
        style={{
          color:
            COLORS.textMuted,

          fontSize:
            "10px",

          textAlign:
            "right",

          overflowWrap:
            "anywhere"
        }}
      >
        {globalDirection}
      </div>

    </div>

    <div
      style={{
        marginTop:
          "7px",

        color:
          COLORS.textMuted,

        fontSize:
          "10px",

        textTransform:
          "uppercase"
      }}
    >
      EXECUTION:{" "}
      <span
        style={{
          color:
            COLORS.text,

          fontWeight:
            "bold"
        }}
      >
        {getExecution()}
      </span>
    </div>

  </div>

  {/* =================================================
     SIGNAL
  ================================================= */}

  <div
    style={{
      marginBottom:
        "10px",

      padding:
        "9px",

      border:
        `1px solid ${getSignalColor(
          signalFromMaster
        )}`,

      background:
        "#181818",

      color:
        getSignalColor(
          signalFromMaster
        ),

      fontWeight:
        "bold",

      fontSize:
        "clamp(11px, 3vw, 13px)",

      textAlign:
        "center",

      overflowWrap:
        "anywhere",

      boxShadow:
        `0 0 7px ${getSignalColor(
          signalFromMaster
        )}22`,

      borderRadius:
        "3px"
    }}
  >
    {getSignalText()}
  </div>

  {/* =================================================
     PRIMARY STATUS
  ================================================= */}

  <div style={gridStyle}>

    <MetricCard
      label="Regime"
      value={
        master.regime ??
        "—"
      }
      color={
        getRegimeColor(
          master.regime
        )
      }
    />

    <MetricCard
      label="Net Exposure"
      value={`${Number(
        master.netExposure ?? 0
      )}%`}
      color={
        getExposureColor(
          Number(
            master.netExposure ?? 0
          )
        )
      }
    />

    <MetricCard
      label="Signal Strength"
      value={`${Number(
        master.signalStrength ?? 0
      )}%`}
      color={
        getScoreColor(score)
      }
    />

    <MetricCard
      label="Phase"
      value={
        String(phase)
          .replaceAll("_", " ")
      }
      color={
        phaseConfirmed
          ? COLORS.orange
          : phase !== "UNKNOWN"
          ? COLORS.yellow
          : COLORS.textMuted
      }
    />

  </div>

  {/* =================================================
     SUMMARY
  ================================================= */}

  <div
    style={{
      marginTop:
        "10px",

      padding:
        "9px",

      border:
        `1px solid ${getSummaryColor()}`,

      color:
        getSummaryColor(),

      background:
        "#111",

      fontSize:
        "10px",

      lineHeight:
        1.4,

      overflowWrap:
        "anywhere",

      borderRadius:
        "3px"
    }}
  >
    {masterSummary}
  </div>

  {/* =================================================
     NASDAQ
  ================================================= */}

  <div
    style={{
      marginTop:
        "10px",

      padding:
        "8px",

      border:
        `1px solid ${getNasdaqColor()}`,

      background:
        COLORS.backgroundCard,

      color:
        getNasdaqColor(),

      fontSize:
        "10px",

      textAlign:
        "center",

      overflowWrap:
        "anywhere",

      borderRadius:
        "3px"
    }}
  >

    <strong>
      {getNasdaqText()}
    </strong>

    {nasdaq?.execution && (
      <>
        {" · "}

        <span
          style={{
            opacity:
              0.75
          }}
        >
          {nasdaq.execution}
        </span>
      </>
    )}

  </div>

  {/* =================================================
     COLLAPSIBLE DETAILS
     
     These are intentionally hidden by default.
     The user can open them when required.
  ================================================= */}

  <details style={detailsStyle}>

    <summary
      style={summaryButtonStyle}
    >
      Risk Components
    </summary>

    <div style={detailsContentStyle}>

      <div style={gridStyle}>

        <MetricCard
          label="Rotation"
          value={`${rotation}/100`}
          progress={rotation}
        />

        <MetricCard
          label="Crash"
          value={`${crash}/100`}
          progress={crash}
        />

        <MetricCard
          label="Price Momentum"
          value={`${priceMomentum}/100`}
          progress={priceMomentum}
        />

        <MetricCard
          label="Timing"
          value={`${timing}/100`}
          progress={timing}
        />

        <MetricCard
          label="Russell"
          value={`${russell}/100`}
          progress={russell}
        />

        <MetricCard
          label="Participation"
          value={`${participation}/100`}
          progress={participation}
        />

        <MetricCard
          label="Breadth Thrust"
          value={`${breadthThrust}/100`}
          progress={breadthThrust}
        />

        <MetricCard
          label="Breadth Velocity"
          value={`${breadthVelocity}/100`}
          progress={breadthVelocity}
        />

        <MetricCard
          label="Rotation Decay"
          value={`${rotationDecay}/100`}
          progress={rotationDecay}
        />

        <MetricCard
          label="Liquidity"
          value={`${liquidity}/100`}
          progress={liquidity}
        />

        <MetricCard
          label="Market Quality"
          value={`${marketQuality}/100`}
          progress={marketQuality}
        />

        <MetricCard
          label="Fragility"
          value={`${fragility}/100`}
          progress={fragility}
        />

        <MetricCard
          label="Regime Sync"
          value={`${regimeSync}/100`}
          progress={regimeSync}
        />

        <MetricCard
          label="Danger Zone"
          value={`${dangerZone}/100`}
          progress={dangerZone}
        />

      </div>

    </div>

  </details>

  {/* =================================================
     REGIME PERSISTENCE
  ================================================= */}

  <details style={detailsStyle}>

    <summary
      style={summaryButtonStyle}
    >
      Regime Persistence
    </summary>

    <div style={detailsContentStyle}>

      <div style={gridStyle}>

        <MetricCard
          label="Persistence"
          value={`${regimePersistence}/100`}
          progress={regimePersistence}
        />

        <MetricCard
          label="Distribution Risk"
          value={`${distributionRisk}/100`}
          progress={distributionRisk}
        />

        <MetricCard
          label="False Recovery Risk"
          value={`${falseRecoveryRisk}/100`}
          progress={falseRecoveryRisk}
        />

        <MetricCard
          label="Market Fatigue"
          value={`${marketFatigue}/100`}
          progress={marketFatigue}
        />

      </div>

    </div>

  </details>

  {/* =================================================
     STRUCTURAL DIAGNOSTICS
  ================================================= */}

  <details style={detailsStyle}>

    <summary
      style={summaryButtonStyle}
    >
      Structural Diagnostics
    </summary>

    <div style={detailsContentStyle}>

      <div style={gridStyle}>

        <MetricCard
          label="Current Quality"
          value={`${currentQuality}/100`}
          color={
            getRiskColor(
              currentQuality
            )
          }
        />

        <MetricCard
          label="Structural Quality"
          value={`${structuralQuality}/100`}
          color={
            getRiskColor(
              structuralQuality
            )
          }
        />

        <MetricCard
          label="Historical Quality"
          value={`${historicalQuality}/100`}
          color={
            getRiskColor(
              historicalQuality
            )
          }
        />

        <MetricCard
          label="Crash Risk"
          value={`${crashRisk}/100`}
          color={
            getRiskColor(
              crashRisk
            )
          }
        />

        <MetricCard
          label="Timing Risk"
          value={`${timingRisk}/100`}
          color={
            getRiskColor(
              timingRisk
            )
          }
        />

        <MetricCard
          label="Russell Risk"
          value={`${russellRisk}/100`}
          color={
            getRiskColor(
              russellRisk
            )
          }
        />

        <MetricCard
          label="Defensive Evidence"
          value={
            defensiveEvidenceCount
          }
          color={
            defensiveEvidenceCount >= 3
              ? COLORS.red
              : defensiveEvidenceCount >= 2
              ? COLORS.orange
              : COLORS.textMuted
          }
        />

        <MetricCard
          label="Phase Confidence"
          value={`${phaseConfidence}%`}
          color={
            phaseConfidence >= 70
              ? COLORS.green
              : phaseConfidence >= 40
              ? COLORS.yellow
              : COLORS.red
          }
        />

      </div>

    </div>

  </details>

  {/* =================================================
     STRUCTURAL STATE
  ================================================= */}

  <details style={detailsStyle}>

    <summary
      style={summaryButtonStyle}
    >
      Structural State
    </summary>

    <div style={detailsContentStyle}>

      <div style={gridStyle}>

        <MetricCard
          label="Phase"
          value={
            String(phase)
              .replaceAll("_", " ")
          }
          color={
            phaseConfirmed
              ? COLORS.orange
              : phase !== "UNKNOWN"
              ? COLORS.yellow
              : COLORS.textMuted
          }
        />

        <MetricCard
          label="Phase Confirmation"
          value={
            phaseConfirmed
              ? "CONFIRMED"
              : "UNCONFIRMED"
          }
          color={
            phaseConfirmed
              ? COLORS.green
              : COLORS.textMuted
          }
        />

        <MetricCard
          label="Weak Internals"
          value={
            weakInternals
              ? "ACTIVE"
              : "CLEAR"
          }
          color={
            weakInternals
              ? COLORS.red
              : COLORS.green
          }
        />

        <MetricCard
          label="Narrow Leadership"
          value={
            narrowLeadership
              ? "ACTIVE"
              : "NORMAL"
          }
          color={
            narrowLeadership
              ? COLORS.orange
              : COLORS.green
          }
        />

        <MetricCard
          label="Defensive Structure"
          value={
            strongDefensiveStructure
              ? "STRONG"
              : defensiveStructuralConfirmation
              ? "CONFIRMED"
              : "NOT CONFIRMED"
          }
          color={
            strongDefensiveStructure
              ? COLORS.red
              : defensiveStructuralConfirmation
              ? COLORS.orange
              : COLORS.textMuted
          }
        />

      </div>

    </div>

  </details>

  {/* =================================================
     ENGINE SEMANTICS
  ================================================= */}

  <div
    style={{
      marginTop:
        "10px",

      paddingTop:
        "8px",

      borderTop:
        `1px solid ${COLORS.borderSoft}`,

      color:
        COLORS.textDim,

      fontSize:
        "8px",

      lineHeight:
        1.4,

      textAlign:
        "center"
    }}
  >
    MASTER SCORE SEMANTICS:
    LOW = CALL / CONSTRUCTIVE ·
    HIGH = PUT / RISK
  </div>

</div>

);
}
