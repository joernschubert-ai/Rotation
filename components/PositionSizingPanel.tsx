// /components/PositionSizingPanel.tsx

"use client";

import { getSignalColor } from "@/lib/engine/colorEngine";

type Props = {
  sizing: any;
  tradeStack?: any;
  decision?: any;
};

export default function PositionSizingPanel({
  sizing,
  tradeStack,
  decision
}: Props) {

  if (!sizing) return null;

  /* =====================================================
     SAFE HELPERS
  ===================================================== */

  const num = (
    value: any,
    fallback = 0
  ): number => {

    const n = Number(value);

    return Number.isFinite(n)
      ? n
      : fallback;
  };


  const components =
    sizing?.components ?? {};

  const meta =
    sizing?.meta ?? {};

  const portfolio =
    sizing?.portfolio ?? {};

  const risk =
    sizing?.risk ?? {};

  const pipeline =
    sizing?.pipeline ?? {};

  const flowPipeline =
    sizing?.flowPipeline ?? {};


  /* =====================================================
     CORE
  ===================================================== */

  const totalSize =
    num(sizing?.size);

  const direction =
    sizing?.direction ??
    "NEUTRAL";

  const mode =
    sizing?.mode ??
    "NO_TRADE";


  const activeFlows =
    Array.isArray(sizing?.activeFlows)
      ? sizing.activeFlows
      : [];


  const activeInstruments =
    Array.isArray(sizing?.activeInstruments)
      ? sizing.activeInstruments
      : [];


  /* =====================================================
     PRIMARY
  ===================================================== */

  const primary =
    sizing?.primary ?? null;


  /* =====================================================
     ENGINE INPUTS
  ===================================================== */

  const masterScore =
    num(components?.masterScore);

  const crashScore =
    num(components?.crashScore);

  const crashProbability =
    num(
      components?.crashProbability
    );

  const edgeScore =
    num(components?.edgeScore);

  const liquidityScore =
    num(components?.liquidityScore);

  const participationScore =
    num(components?.participationScore);

  const fragilityScore =
    num(components?.fragilityScore);

  const rotationDecayScore =
    num(components?.rotationDecayScore);

  const rotationConfidence =
    num(components?.rotationConfidence);

  const marketQualityScore =
    num(components?.marketQualityScore);

  const breadthThrustScore =
    num(components?.breadthThrustScore);

  const squeezeRisk =
    num(components?.squeezeRisk);

  const regimeSyncScore =
    num(components?.regimeSyncScore);

  const dangerScore =
    num(components?.dangerScore);

  const systemHeat =
    num(components?.systemHeat);

  const breadth50 =
    num(components?.breadth50);

  const breadth200 =
    num(components?.breadth200);

  const breadthTrend =
    num(components?.breadthTrend);

  const breadthAcceleration =
    num(components?.breadthAcceleration);

  const participationDecay =
    num(components?.participationDecay);

  const leadershipDecay =
    num(components?.leadershipDecay);

  const relativeBreadthWeakness =
    num(components?.relativeBreadthWeakness);

  const phasePersistence =
    num(components?.phasePersistence);

  const regimePersistence =
    num(components?.regimePersistence);


  /* =====================================================
     STATES
  ===================================================== */

  const phase =
    meta?.phase ??
    pipeline?.phase ??
    "UNKNOWN";

  const executionMode =
    meta?.executionMode ??
    "UNKNOWN";

  const riskState =
    meta?.riskState ??
    "UNKNOWN";

  const tacticalBias =
    meta?.tacticalBias ??
    "UNKNOWN";

  const directionalConflict =
    meta?.directionalConflict === true;


  /* =====================================================
     ALIGNMENT
  ===================================================== */

  const decisionDirection =
    decision?.direction ??
    "NEUTRAL";

  const aligned =
    decisionDirection === "NEUTRAL" ||
    direction === "NEUTRAL" ||
    decisionDirection === direction;


  /* =====================================================
     COLORS
  ===================================================== */

  function directionColor(
    value: string
  ) {

    if (value === "SHORT")
      return "#ff4d4f";

    if (value === "LONG")
      return "#52c41a";

    return "#777";
  }


  function modeColor(
    value: string
  ) {

    switch (value) {

      case "AGGRESSIVE":
        return "#ff4d4f";

      case "MODERATE":
        return "#fa8c16";

      case "DEFENSIVE":
        return "#fadb14";

      case "CAPITAL_PRESERVATION":
        return "#ff7875";

      case "NO_TRADE":
        return "#777";

      default:
        return "#aaa";
    }
  }


  function riskColor(
    value: number
  ) {

    if (value >= 80)
      return "#ff4d4f";

    if (value >= 60)
      return "#fa8c16";

    if (value >= 40)
      return "#fadb14";

    return "#52c41a";
  }


  function qualityColor(
    value: number
  ) {

    if (value >= 70)
      return "#52c41a";

    if (value >= 50)
      return "#fadb14";

    if (value >= 30)
      return "#fa8c16";

    return "#ff4d4f";
  }


  function instrumentLabel(
    instrument: string
  ) {

    switch (instrument) {

      case "NASDAQ_PUT":
        return "NASDAQ PUT";

      case "NASDAQ_CALL":
        return "NASDAQ CALL";

      case "RUSSELL_CALL":
        return "RUSSELL CALL";

      default:
        return instrument;
    }
  }


  /* =====================================================
     METRIC CARD
  ===================================================== */

  function Metric({
    label,
    value,
    inverse = false,
    decimals = 0
  }: {
    label: string;
    value: number;
    inverse?: boolean;
    decimals?: number;
  }) {

    const display =
      decimals > 0
        ? value.toFixed(decimals)
        : Math.round(value);

    return (
      <div
        style={{
          border: "1px solid #222",
          background: "#101010",
          padding: "8px"
        }}
      >

        <div
          style={{
            color: "#666",
            fontSize: "8px",
            marginBottom: "4px"
          }}
        >
          {label}
        </div>

        <div
          style={{
            color:
              inverse
                ? riskColor(value)
                : qualityColor(value),
            fontSize: "17px",
            fontWeight: "bold"
          }}
        >
          {display}
        </div>

      </div>
    );
  }


  /* =====================================================
     FLOW CARD
  ===================================================== */

  function FlowCard({
    title,
    flow
  }: {
    title: string;
    flow: any;
  }) {

    if (!flow) {

      return (
        <div
          style={{
            border: "1px solid #222",
            background: "#101010",
            padding: "10px"
          }}
        >
          <div
            style={{
              color: "#777",
              fontSize: "11px",
              fontWeight: "bold"
            }}
          >
            {title}
          </div>

          <div
            style={{
              color: "#555",
              fontSize: "9px",
              marginTop: "8px"
            }}
          >
            NO DATA
          </div>
        </div>
      );
    }


    const strength =
      num(flow?.strength);

    const confidence =
      num(flow?.confidence);

    const finalSize =
      num(flow?.finalSize);

    const rawSize =
      num(flow?.rawSize);

    const preCap =
      num(flow?.prePortfolioSize);

    const flowRisk =
      num(flow?.riskMultiplier);

    const flowDirection =
      flow?.direction ??
      "NONE";

    const flowMode =
      flow?.mode ??
      "NO_TRADE";

    const flowState =
      flow?.state ??
      "NEUTRAL";

    const eligible =
      flow?.eligible === true;

    const reason =
      flow?.reason ??
      "No engine reason";


    return (

      <div
        style={{
          border: "1px solid #252525",
          background: "#101010",
          padding: "11px"
        }}
      >

        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px"
          }}
        >

          <div
            style={{
              color: "#ddd",
              fontSize: "11px",
              fontWeight: "bold"
            }}
          >
            {title}
          </div>

          <div
            style={{
              color:
                directionColor(
                  flowDirection
                ),
              fontSize: "10px",
              fontWeight: "bold"
            }}
          >
            {flowDirection}
          </div>

        </div>


        {/* FINAL */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px"
          }}
        >

          <div>

            <div
              style={{
                color: "#666",
                fontSize: "8px"
              }}
            >
              FINAL
            </div>

            <div
              style={{
                color:
                  finalSize > 0
                    ? getSignalColor(
                        finalSize,
                        100
                      )
                    : "#555",
                fontSize: "24px",
                fontWeight: "bold"
              }}
            >
              {finalSize}%
            </div>

          </div>


          <div
            style={{
              textAlign: "right"
            }}
          >

            <div
              style={{
                color:
                  modeColor(flowMode),
                fontSize: "9px",
                fontWeight: "bold"
              }}
            >
              {flowMode}
            </div>

            <div
              style={{
                color:
                  eligible
                    ? "#52c41a"
                    : "#777",
                fontSize: "8px",
                marginTop: "3px"
              }}
            >
              {eligible
                ? "ELIGIBLE"
                : "NO TRADE"}
            </div>

          </div>

        </div>


        {/* STATE */}

        <div
          style={{
            borderTop: "1px solid #222",
            paddingTop: "8px",
            marginBottom: "8px"
          }}
        >

          <div
            style={{
              color: "#666",
              fontSize: "8px"
            }}
          >
            STATE
          </div>

          <div
            style={{
              color: "#aaa",
              fontSize: "10px",
              fontWeight: "bold"
            }}
          >
            {flowState}
          </div>

        </div>


        {/* METRICS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap: "5px"
          }}
        >

          <MiniMetric
            label="STRENGTH"
            value={strength}
          />

          <MiniMetric
            label="CONFIDENCE"
            value={confidence}
          />

          <MiniMetric
            label="RISK"
            value={flowRisk}
            decimals={2}
          />

          <MiniMetric
            label="RAW"
            value={rawSize}
          />

          <MiniMetric
            label="PRE-CAP"
            value={preCap}
          />

          <MiniMetric
            label="FINAL"
            value={finalSize}
          />

        </div>


        {/* ENGINE REASON */}

        <div
          style={{
            marginTop: "8px",
            paddingTop: "7px",
            borderTop: "1px solid #222"
          }}
        >

          <div
            style={{
              color: "#555",
              fontSize: "8px",
              marginBottom: "3px"
            }}
          >
            ENGINE
          </div>

          <div
            style={{
              color:
                eligible
                  ? "#999"
                  : "#777",
              fontSize: "9px",
              lineHeight: "1.35"
            }}
          >
            {reason}
          </div>

        </div>

      </div>
    );
  }


  function MiniMetric({
    label,
    value,
    decimals = 0
  }: {
    label: string;
    value: number;
    decimals?: number;
  }) {

    return (
      <div
        style={{
          background: "#0b0b0b",
          padding: "5px"
        }}
      >

        <div
          style={{
            color: "#555",
            fontSize: "7px"
          }}
        >
          {label}
        </div>

        <div
          style={{
            color: "#aaa",
            fontSize: "11px",
            fontWeight: "bold",
            marginTop: "2px"
          }}
        >
          {decimals > 0
            ? value.toFixed(decimals)
            : Math.round(value)}
        </div>

      </div>
    );
  }


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div
      style={{
        background: "#090909",
        border: "1px solid #222",
        padding: "14px",
        color: "#ddd"
      }}
    >

      {/* =================================================
         HEADER
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px"
        }}
      >

        <div
          style={{
            color: "#aaa",
            fontSize: "13px",
            fontWeight: "bold"
          }}
        >
          POSITIONIERUNG
        </div>

        <div
          style={{
            color:
              aligned
                ? "#52c41a"
                : "#ff4d4f",
            fontSize: "9px",
            fontWeight: "bold"
          }}
        >
          {aligned
            ? "ALIGNED"
            : "MISALIGNED"}
        </div>

      </div>


      {/* =================================================
         PORTFOLIO POSITION
      ================================================= */}

      <div
        style={{
          border: "1px solid #333",
          background: "#111",
          padding: "12px",
          marginBottom: "12px"
        }}
      >

        <div
          style={{
            color: "#666",
            fontSize: "8px",
            marginBottom: "6px"
          }}
        >
          PORTFOLIO POSITION
        </div>


        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >

          <div>

            <div
              style={{
                color:
                  directionColor(direction),
                fontSize: "16px",
                fontWeight: "bold"
              }}
            >
              {direction}
            </div>

            <div
              style={{
                color: "#666",
                fontSize: "9px",
                marginTop: "3px"
              }}
            >
              {activeFlows.length} ACTIVE FLOWS
            </div>

          </div>


          <div
            style={{
              textAlign: "right"
            }}
          >

            <div
              style={{
                color:
                  totalSize > 0
                    ? getSignalColor(
                        totalSize,
                        100
                      )
                    : "#555",
                fontSize: "28px",
                fontWeight: "bold"
              }}
            >
              {totalSize}%
            </div>

            <div
              style={{
                color:
                  modeColor(mode),
                fontSize: "9px"
              }}
            >
              {mode}
            </div>

          </div>

        </div>


        {primary && (

          <div
            style={{
              marginTop: "9px",
              paddingTop: "8px",
              borderTop: "1px solid #222",
              color: "#777",
              fontSize: "8px"
            }}
          >
            PRIMARY:{" "}
            <span
              style={{
                color: "#aaa"
              }}
            >
              {instrumentLabel(
                primary.instrument
              )}
            </span>
          </div>

        )}

      </div>


      {/* =================================================
         INDEPENDENT FLOWS
      ================================================= */}

      <SectionTitle>
        INDEPENDENT FLOWS
      </SectionTitle>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: "8px",
          marginBottom: "12px"
        }}
      >

        <FlowCard
          title="NASDAQ PUT"
          flow={
            flowPipeline?.nasdaqPut ??
            sizing?.nasdaqPut
          }
        />

        <FlowCard
          title="NASDAQ CALL"
          flow={
            flowPipeline?.nasdaqCall ??
            sizing?.nasdaqCall
          }
        />

        <FlowCard
          title="RUSSELL CALL"
          flow={
            flowPipeline?.russellCall ??
            sizing?.russellCall
          }
        />

      </div>


      {/* =================================================
         PORTFOLIO LAYER
      ================================================= */}

      <SectionTitle>
        PORTFOLIO LAYER
      </SectionTitle>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, 1fr)",
          gap: "7px",
          marginBottom: "12px"
        }}
      >

        <Metric
          label="RAW TOTAL"
          value={
            num(portfolio?.rawSize)
          }
        />

        <Metric
          label="CAP"
          value={
            num(portfolio?.cap)
          }
        />

        <Metric
          label="SCALE"
          value={
            num(portfolio?.scale, 1) * 100
          }
        />

        <Metric
          label="FINAL"
          value={
            num(portfolio?.totalSize)
          }
        />

      </div>


      {/* =================================================
         GLOBAL RISK
      ================================================= */}

      <SectionTitle>
        GLOBAL RISK
      </SectionTitle>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5, 1fr)",
          gap: "7px",
          marginBottom: "12px"
        }}
      >

        <Metric
          label="GLOBAL RISK"
          value={
            num(
              risk?.globalMultiplier
            ) * 100
          }
          inverse
        />

        <Metric
          label="CRASH PROB"
          value={
            num(
              risk?.crashProbability
            )
          }
          inverse
        />

        <Metric
          label="DANGER"
          value={
            num(
              risk?.dangerScore
            )
          }
          inverse
        />

        <Metric
          label="HEAT"
          value={
            num(risk?.heat) * 100
          }
          inverse
          decimals={1}
        />

        <Metric
          label="LIQUIDITY"
          value={
            num(
              risk?.liquidityScore
            )
          }
          inverse
        />

        <Metric
          label="FRAGILITY"
          value={
            num(
              risk?.fragilityScore
            )
          }
          inverse
        />

        <Metric
          label="PARTICIPATION"
          value={
            num(
              risk?.participationScore
            )
          }
        />

        <Metric
          label="QUALITY"
          value={
            num(
              risk?.marketQualityScore
            )
          }
        />

        <Metric
          label="ROT. DECAY"
          value={
            num(
              risk?.rotationDecayScore
            )
          }
          inverse
        />

        <Metric
          label="ROT. CONFIRM"
          value={
            num(
              risk?.rotationConfidence
            )
          }
        />

        <Metric
          label="REGIME SYNC"
          value={
            num(
              risk?.regimeSyncScore
            )
          }
        />

        <Metric
          label="SQUEEZE"
          value={
            num(
              risk?.squeezeRisk
            )
          }
          inverse
        />

      </div>


      {/* =================================================
         PIPELINE INPUTS
      ================================================= */}

      <SectionTitle>
        PIPELINE INPUTS
      </SectionTitle>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, 1fr)",
          gap: "7px",
          marginBottom: "12px"
        }}
      >

        <Metric
          label="MASTER"
          value={masterScore}
        />

        <Metric
          label="CRASH"
          value={crashScore}
          inverse
        />

        <Metric
          label="EDGE"
          value={edgeScore}
        />

        <Metric
          label="LIQUIDITY"
          value={liquidityScore}
          inverse
        />

        <Metric
          label="PARTICIPATION"
          value={participationScore}
        />

        <Metric
          label="FRAGILITY"
          value={fragilityScore}
          inverse
        />

        <Metric
          label="ROT. DECAY"
          value={rotationDecayScore}
          inverse
        />

        <Metric
          label="ROT. CONFIRM"
          value={rotationConfidence}
        />

        <Metric
          label="QUALITY"
          value={marketQualityScore}
        />

        <Metric
          label="BREADTH THRUST"
          value={breadthThrustScore}
        />

        <Metric
          label="DANGER"
          value={dangerScore}
          inverse
        />

        <Metric
          label="SQUEEZE"
          value={squeezeRisk}
          inverse
        />

      </div>


      {/* =================================================
         STRUCTURE / HISTORY
      ================================================= */}

      <SectionTitle>
        STRUCTURE / HISTORY
      </SectionTitle>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, 1fr)",
          gap: "7px",
          marginBottom: "12px"
        }}
      >

        <Metric
          label="BREADTH 50"
          value={breadth50}
        />

        <Metric
          label="BREADTH 200"
          value={breadth200}
        />

        <Metric
          label="BREADTH TREND"
          value={breadthTrend}
          decimals={1}
        />

        <Metric
          label="BREADTH ACCEL."
          value={breadthAcceleration}
          decimals={1}
        />

        <Metric
          label="PART. DECAY"
          value={participationDecay}
        />

        <Metric
          label="LEADERSHIP DECAY"
          value={leadershipDecay}
        />

        <Metric
          label="REL. BREADTH"
          value={relativeBreadthWeakness}
          decimals={1}
        />

        <Metric
          label="PHASE PERSIST."
          value={phasePersistence}
        />

        <Metric
          label="REGIME PERSIST."
          value={regimePersistence}
        />

      </div>


      {/* =================================================
         REGIME
      ================================================= */}

      <SectionTitle>
        REGIME / EXECUTION
      </SectionTitle>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, 1fr)",
          gap: "7px",
          marginBottom: "12px"
        }}
      >

        <StateCard
          label="REGIME"
          value={phase}
        />

        <StateCard
          label="EXECUTION"
          value={executionMode}
        />

        <StateCard
          label="RISK STATE"
          value={riskState}
        />

        <StateCard
          label="TACTICAL BIAS"
          value={tacticalBias}
        />

      </div>


      {/* =================================================
         FLOW PIPELINE
      ================================================= */}

      <SectionTitle>
        FLOW PIPELINE / DECISION
      </SectionTitle>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: "8px",
          marginBottom: "10px"
        }}
      >

        <FlowPipelineCard
          title="NASDAQ PUT"
          flow={
            flowPipeline?.nasdaqPut
          }
        />

        <FlowPipelineCard
          title="NASDAQ CALL"
          flow={
            flowPipeline?.nasdaqCall
          }
        />

        <FlowPipelineCard
          title="RUSSELL CALL"
          flow={
            flowPipeline?.russellCall
          }
        />

      </div>


      {/* =================================================
         DATA INTEGRITY
      ================================================= */}

      <div
        style={{
          marginTop: "8px",
          paddingTop: "8px",
          borderTop: "1px solid #1c1c1c",
          color: "#555",
          fontSize: "8px",
          display: "flex",
          justifyContent: "space-between"
        }}
      >

        <span>
          POSITION SIZING V3
        </span>

        <span>
          ACTIVE {activeFlows.length}
        </span>

        <span>
          INSTRUMENTS {activeInstruments.length}
        </span>

        <span>
          CONFLICT{" "}
          {directionalConflict
            ? "YES"
            : "NO"}
        </span>

      </div>

    </div>
  );
}


/* =====================================================
 SECTION TITLE
===================================================== */

function SectionTitle({
  children
}: {
  children: React.ReactNode;
}) {

  return (

    <div
      style={{
        color: "#999",
        fontSize: "9px",
        fontWeight: "bold",
        marginBottom: "7px"
      }}
    >
      {children}
    </div>
  );
}


/* =====================================================
 STATE CARD
===================================================== */

function StateCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {

  return (

    <div
      style={{
        border: "1px solid #222",
        background: "#101010",
        padding: "8px"
      }}
    >

      <div
        style={{
          color: "#555",
          fontSize: "7px"
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#aaa",
          fontSize: "9px",
          fontWeight: "bold",
          marginTop: "3px",
          lineHeight: "1.3"
        }}
      >
        {value}
      </div>

    </div>
  );
}

function MiniMetric({
label,
value,
decimals = 0
}: {
label: string;
value: number;
decimals?: number;
}) {
return (
<div
style={{
background: "#0b0b0b",
padding: "5px"
}}
>
<div
style={{
color: "#555",
fontSize: "7px"
}}
>
{label}
</div>

<div
style={{
color: "#aaa",
fontSize: "11px",
fontWeight: "bold",
marginTop: "2px"
}}
>
{decimals > 0
? value.toFixed(decimals)
: Math.round(value)}
</div>
</div>
);
}


/* =====================================================
 FLOW PIPELINE CARD
===================================================== */

function FlowPipelineCard({
  title,
  flow
}: {
  title: string;
  flow: any;
}) {

  if (!flow) return null;

  const strength =
    Number(flow?.strength ?? 0);

  const confidence =
    Number(flow?.confidence ?? 0);

  const finalSize =
    Number(flow?.finalSize ?? 0);

  const eligible =
    flow?.eligible === true;

  return (

    <div
      style={{
        border: "1px solid #222",
        background: "#0f0f0f",
        padding: "9px"
      }}
    >

      <div
        style={{
          color: "#777",
          fontSize: "8px",
          marginBottom: "6px"
        }}
      >
        {title}
      </div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: "5px"
        }}
      >

        <MiniMetric
          label="STRENGTH"
          value={strength}
        />

        <MiniMetric
          label="CONF"
          value={confidence}
        />

        <MiniMetric
          label="FINAL"
          value={finalSize}
        />

      </div>


      <div
        style={{
          marginTop: "7px",
          color:
            eligible
              ? "#52c41a"
              : "#777",
          fontSize: "8px",
          fontWeight: "bold"
        }}
      >
        {eligible
          ? "ELIGIBLE"
          : "NO TRADE"}
      </div>

    </div>
  );
}

