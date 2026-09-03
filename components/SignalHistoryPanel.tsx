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

  return "#ff4d4f";

}


if (
  value.includes("LONG") ||
  value.includes("CALL")
) {

  return "#52c41a";

}


if (
  value.includes("REDUCE") ||
  value.includes("TRIM")
) {

  return "#faad14";

}


if (
  value.includes("EXIT")
) {

  return "#ff7875";

}


if (
  value.includes("SYSTEM") ||
  value.includes("FORCE")
) {

  return "#9254de";

}


return "#888";

}

function strengthColor(
value: number
) {

if (value >= 80)
  return "#52c41a";

if (value >= 60)
  return "#faad14";

if (value >= 40)
  return "#d4b106";

return "#666";

}

function phaseColor(
phase?: string
) {

switch (phase) {

  case "PHASE_1_EXPANSION":
    return "#52c41a";

  case "PHASE_2_WARNING":
    return "#95de64";

  case "PHASE_3_DISTRIBUTION":
    return "#faad14";

  case "PHASE_4_RISK":
    return "#fa8c16";

  case "PHASE_5_BREAKDOWN":
    return "#ff4d4f";

  case "PHASE_6_ACCELERATION":
    return "#cf1322";

  case "PHASE_7_CAPITULATION":
    return "#820014";

  default:
    return "#666";

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
    background: "#0d0d0d",
    border: "1px solid #222",
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
          color: "#ddd",
          fontSize: "15px",
          letterSpacing: "0.5px"
        }}
      >

        SIGNAL HISTORY

      </h3>


      <div
        style={{
          fontSize: "11px",
          color: "#666",
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
            color: "#555"
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
        color="#ddd"
      />

      <StatItem
        label="Today"
        value={todaySignals}
        color="#bbb"
      />

      <StatItem
        label="Strong"
        value={strongSignals}
        color="#52c41a"
      />

      <StatItem
        label="Weak"
        value={weakSignals}
        color="#faad14"
      />

      <StatItem
        label="Avg"
        value={averageStrength}
        color="#ddd"
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
                ? "#2a2a2a"
                : "#151515",

            border:
              filter === currentFilter
                ? "1px solid #555"
                : "1px solid #292929",

            color:
              filter === currentFilter
                ? "#fff"
                : "#777",

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
        color: "#555",
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
          color: "#ff7875",
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
          color: "#555",
          border:
            "1px dashed #333",
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
                  background: "#101010",

                  border:
                    "1px solid #222",

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
                        "#666",

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
                        "#666",

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
                        "#222",

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
                      "1px solid #1d1d1d"
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        "9px",

                      color:
                        "#555",

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
                        "2px solid #333"
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          "9px",

                        color:
                          "#555",

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
                          "#aaa",

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
                        "#777",

                      lineHeight:
                        "1.5"
                    }}
                  >

                    <span
                      style={{
                        color:
                          "#555",

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
      color: "#666",
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
"#aaa";

if (
numericValue !== null
) {

if (
  label === "DANGER" ||
  label === "HEAT"
) {

  if (numericValue >= 75)
    color = "#ff4d4f";

  else if (numericValue >= 50)
    color = "#faad14";

  else
    color = "#52c41a";

}

else {

  if (numericValue >= 70)
    color = "#52c41a";

  else if (numericValue >= 40)
    color = "#faad14";

  else
    color = "#ff7875";

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
        "#555",

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
