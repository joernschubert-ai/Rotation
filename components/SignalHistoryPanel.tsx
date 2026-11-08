"use client";

import { useEffect, useMemo, useState } from "react";

/* =====================================================
TYPES
===================================================== */

type FilterType =
| "ALL"
| "LONG"
| "PUT"
| "REDUCE"
| "SYSTEM";

interface SignalHistoryItem {
timestamp?: number | string;

type?: string;
phase?: string;

message?: string;

strength?: number;

masterScore?: number;
dangerScore?: number;
tradeStack?: number;
systemHeat?: number;

reason?: string;
summary?: string;
}

/* =====================================================
COMPONENT
===================================================== */

export default function SignalHistoryPanel() {

const [signals, setSignals] =
useState<SignalHistoryItem[]>([]);

const [filter, setFilter] =
useState("ALL");

const [loading, setLoading] =
useState(true);

const [error, setError] =
useState(false);

/* =====================================================
LOAD
===================================================== */

useEffect(() => {

loadSignals();

}, []);

async function loadSignals() {

try {

  setLoading(true);
  setError(false);

  const res =
    await fetch("/api/signal");

  if (!res.ok) {
    throw new Error(
      `Signal API error: ${res.status}`
    );
  }

  const json =
    await res.json();

  setSignals(
    Array.isArray(json)
      ? json
      : []
  );

} catch (e) {

  console.error(
    "Signal History Load Error:",
    e
  );

  setSignals([]);
  setError(true);

} finally {

  setLoading(false);

}

}

/* =====================================================
NORMALIZE TIMESTAMP
===================================================== */

function getTimestamp(
value: number | string | undefined
): number {

if (!value)
  return 0;

if (typeof value === "number")
  return value;

const parsed =
  new Date(value).getTime();

return Number.isFinite(parsed)
  ? parsed
  : 0;

}

/* =====================================================
SORTED SIGNALS
===================================================== */

const sortedSignals =
useMemo(() => {

  return [...signals]
    .sort(
      (a, b) =>
        getTimestamp(b.timestamp) -
        getTimestamp(a.timestamp)
    );

}, [signals]);

/* =====================================================
FILTER
===================================================== */

const filteredSignals =
useMemo(() => {

  if (filter === "ALL")
    return sortedSignals;

  return sortedSignals.filter(
    signal => {

      const type =
        String(
          signal.type ?? ""
        ).toUpperCase();


      switch (filter) {

        case "LONG":

          return (
            type.includes("LONG") ||
            type.includes("CALL")
          );


        case "PUT":

          return (
            type.includes("PUT") ||
            type.includes("SHORT")
          );


        case "REDUCE":

          return (
            type.includes("REDUCE") ||
            type.includes("TRIM") ||
            type.includes("EXIT")
          );


        case "SYSTEM":

          return (
            type.includes("SYSTEM") ||
            type.includes("FORCE")
          );


        default:

          return true;

      }

    }
  );

}, [
  sortedSignals,
  filter
]);

/* =====================================================
TODAY CHECK
===================================================== */

function isToday(
timestamp: number | string | undefined
): boolean {

const time =
  getTimestamp(timestamp);

if (!time)
  return false;

const date =
  new Date(time);

const today =
  new Date();

return (
  date.getFullYear() ===
    today.getFullYear() &&

  date.getMonth() ===
    today.getMonth() &&

  date.getDate() ===
    today.getDate()
);

}

/* =====================================================
STATS
===================================================== */

const totalSignals =
filteredSignals.length;

const todaySignals =
filteredSignals.filter(
signal =>
isToday(signal.timestamp)
).length;

const strongSignals =
filteredSignals.filter(
signal =>
Number(signal.strength ?? 0) >= 80
).length;

const weakSignals =
filteredSignals.filter(
signal =>
Number(signal.strength ?? 0) < 40
).length;

const averageStrength =
filteredSignals.length === 0
? 0
: Math.round(

      filteredSignals.reduce(
        (total, signal) =>
          total +
          Number(
            signal.strength ?? 0
          ),
        0
      )

      /
      filteredSignals.length

    );

const lastSignal =
sortedSignals[0];

/* =====================================================
HELPERS
===================================================== */

function formatTime(
timestamp: number | string | undefined
) {

const time =
  getTimestamp(timestamp);

if (!time)
  return "--:--";

return new Date(time)
  .toLocaleTimeString(
    "de-DE",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}

function formatDate(
timestamp: number | string | undefined
) {

const time =
  getTimestamp(timestamp);

if (!time)
  return "--";

return new Date(time)
  .toLocaleDateString(
    "de-DE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );

}

function signalColor(
type?: string
) {

const value =
  String(type ?? "")
    .toUpperCase();


if (
  value.includes("PUT") ||
  value.includes("SHORT")
) {

  return "#fda4af";

}


if (
  value.includes("LONG") ||
  value.includes("CALL")
) {

  return "#6ee7b7";

}


if (
  value.includes("REDUCE") ||
  value.includes("TRIM")
) {

  return "#fcd34d";

}


if (
  value.includes("EXIT")
) {

  return "#fda4af";

}


if (
  value.includes("SYSTEM") ||
  value.includes("FORCE")
) {

  return "#9254de";

}


return "#94a3b8";

}

function strengthColor(
value: number
) {

if (value >= 80)
  return "#6ee7b7";

if (value >= 60)
  return "#fcd34d";

if (value >= 40)
  return "#d4b106";

return "#64748b";

}

function phaseColor(
phase?: string
) {

switch (phase) {

  case "PHASE_1_EXPANSION":
    return "#6ee7b7";

  case "PHASE_2_WARNING":
    return "#a7f3d0";

  case "PHASE_3_DISTRIBUTION":
    return "#fcd34d";

  case "PHASE_4_RISK":
    return "#fdba74";

  case "PHASE_5_BREAKDOWN":
    return "#fda4af";

  case "PHASE_6_ACCELERATION":
    return "#cf1322";

  case "PHASE_7_CAPITULATION":
    return "#820014";

  default:
    return "#64748b";

}

}

function phaseLabel(
phase?: string
) {

if (!phase)
  return "UNKNOWN";

return phase
  .replace("PHASE_", "P")
  .replace("_EXPANSION", " EXPANSION")
  .replace("_WARNING", " WARNING")
  .replace("_DISTRIBUTION", " DISTRIBUTION")
  .replace("_RISK", " RISK")
  .replace("_BREAKDOWN", " BREAKDOWN")
  .replace("_ACCELERATION", " ACCELERATION")
  .replace("_CAPITULATION", " CAPITULATION");

}

function normalizeStrength(
value?: number
) {

return Math.min(
  100,
  Math.max(
    0,
    Math.round(value ?? 0)
  )
);

}

/* =====================================================
RENDER
===================================================== */

return (

<div
  style={{
    background: "#0e1722",
    border: "1px solid #334155",
    padding: "16px"
  }}
>


  {/* =====================================================
  HEADER
  ===================================================== */}

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "20px",
      marginBottom: "18px",
      flexWrap: "wrap"
    }}
  >


    <div>

      <h3
        style={{
          margin: 0,
          color: "#e2e8f0",
          fontSize: "15px",
          letterSpacing: "0.5px"
        }}
      >

        SIGNAL HISTORY

      </h3>


      <div
        style={{
          fontSize: "11px",
          color: "#64748b",
          marginTop: "4px"
        }}
      >

        Institutional Signal Journal

      </div>


      {lastSignal && (

        <div
          style={{
            marginTop: "8px",
            fontSize: "10px",
            color: "#64748b"
          }}
        >

          LAST SIGNAL ·{" "}

          <span
            style={{
              color:
                signalColor(
                  lastSignal.type
                )
            }}
          >

            {lastSignal.type ?? "-"}

          </span>

          {" · "}

          {formatDate(
            lastSignal.timestamp
          )}

          {" "}

          {formatTime(
            lastSignal.timestamp
          )}

        </div>

      )}

    </div>


    {/* =====================================================
    STATS
    ===================================================== */}

    <div
      style={{
        display: "flex",
        gap: "18px",
        flexWrap: "wrap"
      }}
    >

      <StatItem
        label="Total"
        value={totalSignals}
        color="#e2e8f0"
      />

      <StatItem
        label="Today"
        value={todaySignals}
        color="#cbd5e1"
      />

      <StatItem
        label="Strong"
        value={strongSignals}
        color="#6ee7b7"
      />

      <StatItem
        label="Weak"
        value={weakSignals}
        color="#fcd34d"
      />

      <StatItem
        label="Avg"
        value={averageStrength}
        color="#e2e8f0"
      />

    </div>

  </div>


  {/* =====================================================
  FILTER
  ===================================================== */}

  <div
    style={{
      display: "flex",
      gap: "7px",
      marginBottom: "18px",
      flexWrap: "wrap"
    }}
  >

    {(
      [
        "ALL",
        "LONG",
        "PUT",
        "REDUCE",
        "SYSTEM"
      ] as FilterType[]
    ).map(
      currentFilter => (

        <button
          key={currentFilter}

          onClick={() =>
            setFilter(
              currentFilter
            )
          }

          style={{
            padding: "5px 10px",

            background:
              filter === currentFilter
                ? "#334155"
                : "#121d2a",

            border:
              filter === currentFilter
                ? "1px solid #64748b"
                : "1px solid #292929",

            color:
              filter === currentFilter
                ? "#f8fafc"
                : "#94a3b8",

            cursor: "pointer",

            fontSize: "10px",

            fontWeight:
              filter === currentFilter
                ? "bold"
                : "normal"
          }}
        >

          {currentFilter}

        </button>

      )
    )}

  </div>


  {/* =====================================================
  LOADING
  ===================================================== */}

  {loading && (

    <div
      style={{
        padding: "35px",
        textAlign: "center",
        color: "#64748b",
        fontSize: "12px",
        border: "1px dashed #292929"
      }}
    >

      Loading signal history...

    </div>

  )}


  {/* =====================================================
  ERROR
  ===================================================== */}

  {!loading &&
    error && (

      <div
        style={{
          padding: "30px",
          textAlign: "center",
          color: "#fda4af",
          fontSize: "12px",
          border:
            "1px solid #3a1f1f"
        }}
      >

        Signal history could not be loaded.

      </div>

    )}


  {/* =====================================================
  EMPTY
  ===================================================== */}

  {!loading &&
    !error &&
    filteredSignals.length === 0 && (

      <div
        style={{
          padding: "35px",
          textAlign: "center",
          color: "#64748b",
          border:
            "1px dashed #475569",
          fontSize: "12px"
        }}
      >

        No historical signals available

      </div>

    )}


  {/* =====================================================
  SIGNAL LIST
  ===================================================== */}

  {!loading &&
    !error &&
    filteredSignals.length > 0 && (

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >

        {filteredSignals.map(
          (signal, index) => {

            const color =
              signalColor(
                signal.type
              );

            const strength =
              normalizeStrength(
                signal.strength
              );

            const phase =
              signal.phase ?? "";

            const currentPhaseColor =
              phaseColor(phase);


            return (

              <div
                key={
                  `${getTimestamp(
                    signal.timestamp
                  )}-${index}`
                }

                style={{
                  background: "#121d2a",

                  border:
                    "1px solid #334155",

                  borderLeft:
                    `4px solid ${color}`,

                  padding: "13px"
                }}
              >


                {/* =====================================================
                SIGNAL HEADER
                ===================================================== */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",

                    alignItems:
                      "flex-start",

                    gap: "15px"
                  }}
                >


                  <div>

                    <div
                      style={{
                        fontWeight: "bold",
                        color,
                        fontSize: "13px"
                      }}
                    >

                      {signal.type ?? "UNKNOWN"}

                    </div>


                    <div
                      style={{
                        marginTop: "6px",

                        display:
                          "inline-flex",

                        padding:
                          "3px 7px",

                        border:
                          `1px solid ${currentPhaseColor}`,

                        color:
                          currentPhaseColor,

                        fontSize:
                          "9px",

                        letterSpacing:
                          "0.3px"
                      }}
                    >

                      {phaseLabel(
                        phase
                      )}

                    </div>

                  </div>


                  <div
                    style={{
                      textAlign:
                        "right",

                      fontSize:
                        "10px",

                      color:
                        "#64748b",

                      lineHeight:
                        "1.5"
                    }}
                  >

                    <div>

                      {formatDate(
                        signal.timestamp
                      )}

                    </div>

                    <div>

                      {formatTime(
                        signal.timestamp
                      )}

                    </div>

                  </div>

                </div>


                {/* =====================================================
                MESSAGE
                ===================================================== */}

                {signal.message && (

                  <div
                    style={{
                      marginTop:
                        "11px",

                      fontSize:
                        "12px",

                      color:
                        "#c0c0c0",

                      lineHeight:
                        "1.5"
                    }}
                  >

                    {signal.message}

                  </div>

                )}


                {/* =====================================================
                STRENGTH
                ===================================================== */}

                <div
                  style={{
                    marginTop:
                      "13px"
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      fontSize:
                        "10px",

                      color:
                        "#64748b",

                      marginBottom:
                        "5px"
                    }}
                  >

                    <span>

                      SIGNAL STRENGTH

                    </span>


                    <span
                      style={{
                        color:
                          strengthColor(
                            strength
                          ),

                        fontWeight:
                          "bold"
                      }}
                    >

                      {strength}/100

                    </span>

                  </div>


                  <div
                    style={{
                      height:
                        "5px",

                      background:
                        "#334155",

                      overflow:
                        "hidden"
                    }}
                  >

                    <div
                      style={{
                        height:
                          "100%",

                        width:
                          `${strength}%`,

                        background:
                          strengthColor(
                            strength
                          ),

                        transition:
                          "width 0.3s"
                      }}
                    />

                  </div>

                </div>


                {/* =====================================================
                MARKET CONTEXT
                ===================================================== */}

                <div
                  style={{
                    marginTop:
                      "14px",

                    paddingTop:
                      "12px",

                    borderTop:
                      "1px solid #162232"
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        "9px",

                      color:
                        "#64748b",

                      letterSpacing:
                        "0.7px",

                      marginBottom:
                        "9px"
                    }}
                  >

                    MARKET CONTEXT

                  </div>


                  <div
                    style={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        "repeat(4, minmax(0, 1fr))",

                      gap:
                        "8px"
                    }}
                  >

                    <MetricBox
                      label="MASTER"
                      value={
                        signal.masterScore
                      }
                    />

                    <MetricBox
                      label="DANGER"
                      value={
                        signal.dangerScore
                      }
                    />

                    <MetricBox
                      label="TRADE"
                      value={
                        signal.tradeStack
                      }
                    />

                    <MetricBox
                      label="HEAT"
                      value={
                        signal.systemHeat
                      }
                    />

                  </div>

                </div>


                {/* =====================================================
                REASON
                ===================================================== */}

                {signal.reason && (

                  <div
                    style={{
                      marginTop:
                        "13px",

                      padding:
                        "9px 10px",

                      background:
                        "#0c0c0c",

                      borderLeft:
                        "2px solid #475569"
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          "9px",

                        color:
                          "#64748b",

                        marginBottom:
                          "4px",

                        letterSpacing:
                          "0.5px"
                      }}
                    >

                      SIGNAL REASON

                    </div>


                    <div
                      style={{
                        fontSize:
                          "11px",

                        color:
                          "#cbd5e1",

                        lineHeight:
                          "1.45"
                      }}
                    >

                      {signal.reason}

                    </div>

                  </div>

                )}


                {/* =====================================================
                SUMMARY
                ===================================================== */}

                {signal.summary && (

                  <div
                    style={{
                      marginTop:
                        "10px",

                      fontSize:
                        "11px",

                      color:
                        "#94a3b8",

                      lineHeight:
                        "1.5"
                    }}
                  >

                    <span
                      style={{
                        color:
                          "#64748b",

                        marginRight:
                          "6px",

                        fontSize:
                          "9px",

                        letterSpacing:
                          "0.5px"
                      }}
                    >

                      SUMMARY

                    </span>

                    {signal.summary}

                  </div>

                )}

              </div>

            );

          }
        )}

      </div>

    )}

</div>

);

}

/* =====================================================
STAT ITEM
===================================================== */

function StatItem({
label,
value,
color
}: {
label: string;
value: number;
color: string;
}) {

return (

<div
  style={{
    minWidth: "35px"
  }}
>

  <div
    style={{
      fontSize: "9px",
      color: "#64748b",
      marginBottom: "3px"
    }}
  >

    {label}

  </div>


  <div
    style={{
      fontSize: "13px",
      color,
      fontWeight: "bold"
    }}
  >

    {value}

  </div>

</div>

);

}

/* =====================================================
METRIC BOX
===================================================== */

function MetricBox({
label,
value
}: {
label: string;
value?: number;
}) {

const numericValue =
typeof value === "number"
? Math.round(value)
: null;

let color =
"#cbd5e1";

if (
numericValue !== null
) {

if (
  label === "DANGER" ||
  label === "HEAT"
) {

  if (numericValue >= 75)
    color = "#fda4af";

  else if (numericValue >= 50)
    color = "#fcd34d";

  else
    color = "#6ee7b7";

}

else {

  if (numericValue >= 70)
    color = "#6ee7b7";

  else if (numericValue >= 40)
    color = "#fcd34d";

  else
    color = "#fda4af";

}

}

return (

<div
  style={{
    background:
      "#0c0c0c",

    border:
      "1px solid #1e1e1e",

    padding:
      "8px"
  }}
>

  <div
    style={{
      fontSize:
        "8px",

      color:
        "#64748b",

      marginBottom:
        "5px",

      letterSpacing:
        "0.5px"
    }}
  >

    {label}

  </div>


  <div
    style={{
      fontSize:
        "13px",

      fontWeight:
        "bold",

      color
    }}
  >

    {numericValue ?? "--"}

  </div>

</div>

);

}
