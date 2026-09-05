// /components/panels/StructurePanel.tsx

"use client";
/* ============================================================

STRUCTURE PANEL

AUFGABE DES PANELS

Das Structure Panel zeigt die interne Marktstruktur.

ES ZEIGT:

    Structure Health
    Breadth Participation
    Advance / Decline
    Highs / Lows
    Distribution Pressure
    Regime / Execution Context

WICHTIG:

Rotation, Narrow Leadership und Rotation Decay
werden NICHT erneut bewertet.

Diese Logik gehört zu:

    RotationCompositePanel
    RotationInternalsPanel
    RotationDecayPanel

Das Structure Panel ist ausschließlich für:

    MARKTBREITE
    MARKTPARTIZIPATION
    ADVANCE / DECLINE
    HIGHS / LOWS
    DISTRIBUTION PRESSURE

zuständig.

SEMANTIK:

STRUCTURE HEALTH:
HIGH = GOOD
LOW  = WEAK

BREADTH:
HIGH = GOOD
LOW  = WEAK

A/D:
POSITIVE = GOOD
NEGATIVE = WEAK

HIGHS / LOWS:
POSITIVE = GOOD
NEGATIVE = WEAK

DISTRIBUTION:
HIGH = RISK
LOW  = HEALTHY

REGIME SYNC UND EXECUTION:

Diese Werte sind ausschließlich KONTEXT.

Sie verändern NICHT die Structure-Bewertung
im Panel.

SINGLE SOURCE OF TRUTH:

structure.health.value

kommt direkt aus structureEngine.ts.

Das Panel bewertet Structure Health NICHT erneut.

============================================================ */

export default function StructurePanel({
structure,
regimeSync,
executionState,
}: any) {

if (!structure) {
return null;
}

/* ==========================================================
HELPERS
========================================================== */

function clamp(
value: number,
min = 0,
max = 100
) {

if (!Number.isFinite(value)) {
  return min;
}

return Math.max(
  min,
  Math.min(max, value)
);

}

function safeNumber(
value: unknown,
fallback: number | null = null
) {

if (
  value === null ||
  value === undefined ||
  value === ""
) {
  return fallback;
}

const numeric =
  Number(value);

return Number.isFinite(numeric)
  ? numeric
  : fallback;

}

function fmt(
value: number | null,
decimals = 1
) {

if (
  value === null ||
  value === undefined
) {
  return "–";
}

if (
  Number.isInteger(value)
) {
  return value.toString();
}

return value.toFixed(decimals);

}

function delta(
value: number | null
) {

if (
  value === null ||
  value === undefined
) {
  return "";
}

if (value === 0) {
  return "(0)";
}

return value > 0
  ? `(+${value})`
  : `(${value})`;

}

/* ==========================================================
POSITIVE METRIC COLOR

HIGH = GOOD
LOW  = WEAK
========================================================== */

function positiveColor(
value: number
) {

const safeValue =
  clamp(value);

if (safeValue >= 75) {
  return "#52c41a";
}

if (safeValue >= 60) {
  return "#95de64";
}

if (safeValue >= 45) {
  return "#faad14";
}

if (safeValue >= 30) {
  return "#ff7875";
}

return "#ff4d4f";

}

/* ==========================================================
RISK COLOR

HIGH = BAD
LOW  = GOOD
========================================================== */

function riskColor(
value: number
) {

const safeValue =
  clamp(value);

if (safeValue >= 75) {
  return "#ff4d4f";
}

if (safeValue >= 55) {
  return "#ff7875";
}

if (safeValue >= 35) {
  return "#faad14";
}

if (safeValue >= 20) {
  return "#95de64";
}

return "#52c41a";

}

/* ==========================================================
DIRECTION COLOR

POSITIVE = GOOD
NEGATIVE = BAD
========================================================== */

function directionColor(
value: number | null,
threshold = 0
) {

if (
  value === null ||
  value === undefined
) {
  return "#666";
}

if (
  value > threshold
) {
  return "#52c41a";
}

if (
  value < -threshold
) {
  return "#ff4d4f";
}

return "#faad14";

}

/* ==========================================================
INPUT
========================================================== */

const breadth =
structure?.breadth ?? {};

const ad =
structure?.advanceDecline ?? {};

const hl =
structure?.highsLows ?? {};

const distribution =
structure?.distribution ?? {};

const health =
structure?.health ?? {};

/* ==========================================================
BREADTH
========================================================== */

const b20 =
safeNumber(
breadth?.b20?.value
);

const b50 =
safeNumber(
breadth?.b50?.value
);

const b200 =
safeNumber(
breadth?.b200?.value
);

const b20Delta =
safeNumber(
breadth?.b20?.delta
);

const b50Delta =
safeNumber(
breadth?.b50?.delta
);

const b200Delta =
safeNumber(
breadth?.b200?.delta
);

/* ==========================================================
ADVANCE / DECLINE
========================================================== */

const advances =
safeNumber(
ad?.advances
);

const declines =
safeNumber(
ad?.declines
);

const adNet =
safeNumber(
ad?.value ??
(
advances !== null &&
declines !== null
? advances - declines
: null
)
);

const adDelta =
safeNumber(
ad?.delta
);

/* ==========================================================
HIGHS / LOWS
========================================================== */

const highs =
safeNumber(
hl?.highs
);

const lows =
safeNumber(
hl?.lows
);

const highsDelta =
safeNumber(
hl?.deltaHighs
);

const lowsDelta =
safeNumber(
hl?.deltaLows
);

const hasHLData =
highs !== null &&
lows !== null &&
(
highs !== 0 ||
lows !== 0
);

const netHL =
hasHLData
? highs! - lows!
: null;

const totalHL =
hasHLData
? highs! + lows!
: null;

/*

    Range:
    ●
    -1 = all lows
    0 = balanced
    +1 = all highs
    */

const hlStrength =
totalHL !== null &&
totalHL > 0
? (
highs! - lows!
) / totalHL
: null;

/* ==========================================================
DISTRIBUTION

HIGH = RISK

IMPORTANT:

distribution.value is a raw value.

distributionPercent is used for visual
normalization only.

The engine remains the source of truth.
========================================================== */

const distributionValue =
Math.max(
0,
safeNumber(
distribution?.value ??
distribution?.score,
0
) ?? 0
);

const distributionMax =
Math.max(
1,
safeNumber(
distribution?.max,
7
) ?? 7
);

const distributionPercent =
clamp(
(
distributionValue /
distributionMax
) * 100
);

/* ==========================================================
HEALTH

HIGH = GOOD

SINGLE SOURCE OF TRUTH:

structureEngine.ts
========================================================== */

const healthValue =
clamp(
safeNumber(
health?.value ??
structure?.healthScore,
0
) ?? 0
);

/* ==========================================================
REGIME SYNC

CONTEXT ONLY

HIGH = GOOD
========================================================== */

const syncScore =
clamp(
safeNumber(
regimeSync?.score ??
regimeSync?.regimeSyncScore,
50
) ?? 50
);

const syncState =
regimeSync?.state ??
regimeSync?.regimeSyncState ??
"TRANSITION";

function syncColor() {

if (
  syncState === "ALIGNED"
) {
  return "#52c41a";
}

if (
  syncState === "DIVERGING"
) {
  return "#ff4d4f";
}

return "#faad14";

}

/* ==========================================================
EXECUTION

CONTEXT ONLY
========================================================== */

const executionMode =
executionState?.executionMode ??
"WAIT";

const marketMode =
executionState?.marketMode ??
"TRANSITION";

function marketModeColor() {

if (
  marketMode === "RISK_ON"
) {
  return "#52c41a";
}

if (
  marketMode === "RISK_OFF"
) {
  return "#ff4d4f";
}

return "#faad14";

}

/* ==========================================================
STRUCTURE STATE

IMPORTANT:

This is ONLY a UI classification.

The numeric Structure Health comes directly
from structureEngine.ts.

No new health score is calculated here.
========================================================== */

function structureState() {

if (
  healthValue < 35 ||
  distributionPercent >= 80
) {

  return {
    label:
      "STRUCTURE BREAKDOWN",

    description:
      "Internal market participation is structurally deteriorating",

    color:
      "#ff4d4f",
  };

}

if (
  healthValue < 50 ||
  distributionPercent >= 55
) {

  return {
    label:
      "STRUCTURE FRAGILE",

    description:
      "Market participation is weakening and requires defensive monitoring",

    color:
      "#ff7875",
  };

}

if (
  healthValue < 65 ||
  distributionPercent >= 35
) {

  return {
    label:
      "STRUCTURAL TRANSITION",

    description:
      "Market internals are mixed and structural confirmation is incomplete",

    color:
      "#faad14",
  };

}

return {
  label:
    "STRUCTURE HEALTHY",

  description:
    "Broad market participation supports the current market structure",

  color:
    "#52c41a",
};

}

const currentStructure =
structureState();

/* ==========================================================
BREADTH ROW
========================================================== */

function BreadthRow({
label,
value,
change,
}: {
label: string;
value: number | null;
change: number | null;
}) {

const safeValue =
  clamp(value ?? 0);

const valueColor =
  value !== null
    ? positiveColor(safeValue)
    : "#666";

return (

  <div
    style={{
      marginBottom: "14px",
    }}
  >

    <div
      style={{
        display: "flex",

        justifyContent:
          "space-between",

        alignItems:
          "center",

        marginBottom:
          "5px",
      }}
    >

      <span
        style={{
          color: "#888",

          fontSize: "12px",
        }}
      >
        {label}
      </span>

      <div
        style={{
          display: "flex",

          gap: "8px",

          alignItems:
            "center",
        }}
      >

        <span
          style={{
            color:
              change !== null
                ? directionColor(change)
                : "#666",

            fontSize:
              "10px",
          }}
        >
          {delta(change)}
        </span>

        <span
          style={{
            color:
              valueColor,

            fontWeight:
              "bold",
          }}
        >
          {value !== null
            ? `${fmt(value)}%`
            : "–"}
        </span>

      </div>

    </div>

    <div
      style={{
        height: "6px",

        background:
          "#222",

        borderRadius:
          "4px",

        overflow:
          "hidden",
      }}
    >

      <div
        style={{
          width:
            value !== null
              ? `${safeValue}%`
              : "0%",

          height:
            "100%",

          background:
            valueColor,

          transition:
            "all 0.35s ease",
        }}
      />

    </div>

  </div>

);

}

/* ==========================================================
METRIC CARD
========================================================== */

function MetricCard({
label,
value,
color,
subLabel,
}: {
label: string;
value: string;
color: string;
subLabel?: string;
}) {

return (

  <div
    style={{
      background:
        "#111",

      border:
        "1px solid #222",

      padding:
        "12px",
    }}
  >

    <div
      style={{
        color:
          "#666",

        fontSize:
          "10px",

        marginBottom:
          "6px",

        letterSpacing:
          "0.8px",
      }}
    >
      {label}
    </div>

    <div
      style={{
        color,

        fontSize:
          "16px",

        fontWeight:
          700,
      }}
    >
      {value}
    </div>

    {subLabel && (

      <div
        style={{
          marginTop:
            "5px",

          color:
            "#555",

          fontSize:
            "10px",
        }}
      >
        {subLabel}
      </div>

    )}

  </div>

);

}

/* ==========================================================
RENDER
========================================================== */

return (

<div
  style={{
    background:
      "#0d0d0d",

    border:
      `2px solid ${currentStructure.color}`,

    padding:
      "18px",

    transition:
      "all 0.35s ease",
  }}
>

  {/* ======================================================
  HEADER
  ====================================================== */}

  <div
    className="
      mb-5
      flex
      flex-col
      gap-4
      sm:flex-row
      sm:items-start
      sm:justify-between
    "
  >

    <div>

      <h3
        style={{
          color:
            "#ddd",

          margin:
            "0 0 5px 0",

          fontSize:
            "18px",

          fontWeight:
            700,

          letterSpacing:
            "0.5px",
        }}
      >
        MARKET STRUCTURE
      </h3>

      <div
        style={{
          color:
            "#666",

          fontSize:
            "10px",

          textTransform:
            "uppercase",

          letterSpacing:
            "1px",
        }}
      >
        Breadth & Internal Participation
      </div>

    </div>

    <div
      className="
        text-left
        sm:text-right
      "
    >

      <div
        style={{
          color:
            positiveColor(
              healthValue
            ),

          fontSize:
            "32px",

          fontWeight:
            800,

          lineHeight:
            1,
        }}
      >
        {Math.round(
          healthValue
        )}
      </div>

      <div
        style={{
          color:
            "#777",

          fontSize:
            "10px",

          marginTop:
            "5px",
        }}
      >
        STRUCTURE HEALTH
      </div>

    </div>

  </div>

  {/* ======================================================
  PRIMARY STATE
  ====================================================== */}

  <div
    style={{
      padding:
        "14px",

      marginBottom:
        "18px",

      border:
        `1px solid ${currentStructure.color}`,

      background:
        `${currentStructure.color}10`,
    }}
  >

    <div
      style={{
        color:
          "#777",

        fontSize:
          "10px",

        marginBottom:
          "5px",

        letterSpacing:
          "1px",
      }}
    >
      INTERNAL MARKET STATE
    </div>

    <div
      style={{
        color:
          currentStructure.color,

        fontSize:
          "20px",

        fontWeight:
          800,

        marginBottom:
          "6px",
      }}
    >
      {currentStructure.label}
    </div>

    <div
      style={{
        color:
          "#aaa",

        fontSize:
          "12px",

        lineHeight:
          1.5,
      }}
    >
      {currentStructure.description}
    </div>

  </div>

  {/* ======================================================
  BREADTH
  ====================================================== */}

  <div
    style={{
      borderTop:
        "1px solid #222",

      paddingTop:
        "16px",

      marginBottom:
        "18px",
    }}
  >

    <div
      style={{
        color:
          "#666",

        fontSize:
          "10px",

        marginBottom:
          "14px",

        textTransform:
          "uppercase",

        letterSpacing:
          "1px",
      }}
    >
      Breadth Participation
    </div>

    <BreadthRow
      label="20 Day Breadth"
      value={b20}
      change={b20Delta}
    />

    <BreadthRow
      label="50 Day Breadth"
      value={b50}
      change={b50Delta}
    />

    <BreadthRow
      label="200 Day Breadth"
      value={b200}
      change={b200Delta}
    />

  </div>

  {/* ======================================================
  MARKET PARTICIPATION
  ====================================================== */}

  <div
    style={{
      borderTop:
        "1px solid #222",

      paddingTop:
        "16px",

      marginBottom:
        "18px",
    }}
  >

    <div
      style={{
        color:
          "#666",

        fontSize:
          "10px",

        marginBottom:
          "14px",

        textTransform:
          "uppercase",

        letterSpacing:
          "1px",
      }}
    >
      Market Participation
    </div>

    <div
      className="
        grid
        grid-cols-1
        gap-3
        sm:grid-cols-2
      "
    >

      <MetricCard
        label="ADVANCE / DECLINE"

        value={
          adNet !== null
            ? fmt(adNet)
            : "–"
        }

        color={
          directionColor(
            adNet
          )
        }

        subLabel={
          `Adv ${fmt(
            advances
          )} / Dec ${fmt(
            declines
          )}`
        }
      />

      <MetricCard
        label="A/D MOMENTUM"

        value={
          adDelta !== null
            ? delta(adDelta)
            : "–"
        }

        color={
          directionColor(
            adDelta
          )
        }

        subLabel="Change vs previous observation"
      />

      <MetricCard
        label="NEW HIGHS / LOWS"

        value={
          netHL !== null
            ? fmt(netHL)
            : "–"
        }

        color={
          directionColor(
            netHL
          )
        }

        subLabel={
          `Highs ${fmt(
            highs
          )} / Lows ${fmt(
            lows
          )}`
        }
      />

      <MetricCard
        label="H/L STRENGTH"

        value={
          hlStrength !== null
            ? (
                hlStrength * 100
              ).toFixed(0) + "%"
            : "–"
        }

        color={
          hlStrength !== null
            ? directionColor(
                hlStrength,
                0.05
              )
            : "#666"
        }

        subLabel="Net new high / low balance"
      />

    </div>

  </div>

  {/* ======================================================
  DISTRIBUTION
  ====================================================== */}

  <div
    style={{
      borderTop:
        "1px solid #222",

      paddingTop:
        "16px",

      marginBottom:
        "18px",
    }}
  >

    <div
      style={{
        display:
          "flex",

        justifyContent:
          "space-between",

        alignItems:
          "center",

        marginBottom:
          "8px",
      }}
    >

      <div>

        <div
          style={{
            color:
              "#666",

            fontSize:
              "10px",

            marginBottom:
              "4px",

            textTransform:
              "uppercase",

            letterSpacing:
              "1px",
          }}
        >
          Distribution Pressure
        </div>

        <div
          style={{
            color:
              "#888",

            fontSize:
              "11px",
          }}
        >
          High distribution =
          structural risk
        </div>

      </div>

      <div
        style={{
          color:
            riskColor(
              distributionPercent
            ),

          fontSize:
            "22px",

          fontWeight:
            800,
        }}
      >
        {Math.round(
          distributionValue
        )}
        /
        {Math.round(
          distributionMax
        )}
      </div>

    </div>

    <div
      style={{
        height:
          "7px",

        background:
          "#222",

        borderRadius:
          "5px",

        overflow:
          "hidden",
      }}
    >

      <div
        style={{
          width:
            `${distributionPercent}%`,

          height:
            "100%",

          background:
            riskColor(
              distributionPercent
            ),

          transition:
            "all 0.35s ease",
        }}
      />

    </div>

  </div>

  {/* ======================================================
  REGIME + EXECUTION CONTEXT

  CONTEXT ONLY

  These values do not modify Structure Health.
  ====================================================== */}

  <div
    style={{
      borderTop:
        "1px solid #222",

      paddingTop:
        "16px",
    }}
  >

    <div
      style={{
        color:
          "#666",

        fontSize:
          "10px",

        marginBottom:
          "14px",

        textTransform:
          "uppercase",

        letterSpacing:
          "1px",
      }}
    >
      Regime Context
    </div>

    <div
      className="
        grid
        grid-cols-1
        gap-3
        sm:grid-cols-2
        xl:grid-cols-3
      "
    >

      <MetricCard
        label="REGIME SYNC"

        value={syncState}

        color={syncColor()}

        subLabel={
          `${Math.round(
            syncScore
          )}/100`
        }
      />

      <MetricCard
        label="MARKET MODE"

        value={marketMode}

        color={
          marketModeColor()
        }

        subLabel="Execution environment"
      />

      <MetricCard
        label="EXECUTION"

        value={executionMode}

        color="#aaa"

        subLabel="Current execution posture"
      />

    </div>

  </div>

  {/* ======================================================
  FOOTER
  ====================================================== */}

  <div
    style={{
      marginTop:
        "18px",

      color:
        "#555",

      fontSize:
        "10px",

      lineHeight:
        1.5,
    }}
  >
    Structure Health is calculated exclusively by the
    Structure Engine from breadth, market participation,
    Advance/Decline, High/Low behaviour and distribution
    pressure. Rotation and leadership deterioration are
    evaluated separately by the Rotation system panels.

  </div>

</div>

);

}
