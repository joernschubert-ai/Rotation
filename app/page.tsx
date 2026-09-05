"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { marketEngine } from "@/lib/engine/marketEngine";
import { mapBackendToEngine } from "@/lib/adapters/mapBackendToEngine";
import { validateEngineData } from "@/lib/engine/validateEngineData";

import {
historyEngine
} from "@/lib/history/historyEngine";

import {
createMarketSnapshot
} from "@/lib/history/snapshotEngine";

/* =====================================================
COMPONENTS
===================================================== */

import MarketDrivers from "@/components/MarketDrivers";
import StructurePanel from "@/components/StructurePanel";
import CrashPanel from "@/components/CrashPanel";
import PutTimingPanel from "@/components/PutTimingPanel";
import RussellPanel from "@/components/RussellPanel";
import NasdaqPanel from "@/components/NasdaqPanel";

import MasterPanel from "@/components/MasterPanel";
import PositionSizingPanel from "@/components/PositionSizingPanel";

import PhaseBar from "@/components/PhaseBar";
import IndicesPanel from "@/components/IndicesPanel";

import SystemHeatPanel from "@/components/SystemHeatPanel";
import SystemDotsPanel from "@/components/SystemDotsPanel";

import EarlyWarningPanel from "@/components/EarlyWarningPanel";
import PositioningPanel from "@/components/PositioningPanel";
import ExitPanel from "@/components/ExitPanel";

import TradeStackPanel from "@/components/TradeStackPanel";

import SignalPanel from "@/components/SignalPanel";
import SignalHistoryPanel from "@/components/SignalHistoryPanel";

import SystemDiagnosticsPanel from "@/components/SystemDiagnosticsPanel";

import RegimeRibbonPanel from "@/components/RegimeRibbonPanel";

import SuperSignalPanel from "@/components/SuperSignalPanel";

/* =====================================================
INSTITUTIONAL PANELS
===================================================== */

import LiquidityPanel from "@/components/LiquidityPanel";
import FragilityPanel from "@/components/FragilityPanel";
import ParticipationPanel from "@/components/ParticipationPanel";
import BreadthThrustPanel from "@/components/BreadthThrustPanel";
import SqueezeRiskPanel from "@/components/SqueezeRiskPanel";

/* =====================================================
ROTATION
===================================================== */

import RotationCompositePanel from "@/components/RotationCompositePanel";

import RotationInternalsPanel from "@/components/RotationInternalsPanel";

/* =====================================================
HISTORY
===================================================== */

import HistoricalReplayPanel from "@/components/HistoricalReplayPanel";

/* =====================================================
HOME
===================================================== */

export default function Home() {

const router = useRouter();

const [engine, setEngine] =
useState<any>(null);

const [checkedAuth, setCheckedAuth] =
useState(false);

/* =====================================================
LOAD
===================================================== */

useEffect(() => {

const auth =
  localStorage.getItem("auth");

if (
  auth !== "true"
) {

  router.replace("/login");

  return;
}

setCheckedAuth(true);

load();

}, [router]);

/* =====================================================
MARKET LOAD
===================================================== */

async function load() {

try {

  /* ================= MARKET ================= */

  const res =
    await fetch("/api/market");

  const json =
    await res.json();


  /* ================= MAP ================= */

  const mapped =
    mapBackendToEngine(json);

  if (!mapped) {

    console.error(
      "MAP FAILED",
      json
    );

    return;
  }


  /* ================= VALIDATION ================= */

  if (
    !validateEngineData(mapped)
  ) {

    console.error(
      "ENGINE DATA INVALID",
      mapped
    );

    return;
  }


  /* ================= HISTORY ================= */

  const historyRes =
    await fetch("/api/history");

  const history =
    await historyRes.json();


  const historyMetrics =
    historyEngine(history);


  /* ================= ENGINE INPUT ================= */

  const mappedWithHistory = {

    ...mapped,

    historyMetrics

  };


  console.log(
    "HISTORY METRICS",
    historyMetrics
  );


  /* ================= MARKET ENGINE ================= */

  const e =
    marketEngine(
      mappedWithHistory
    );


  /* ================= SNAPSHOT ================= */

  const snapshot =
    createMarketSnapshot({

      map:
        mappedWithHistory,

      engine:
        e

    });


  console.log(
    "SNAPSHOT CREATED",
    snapshot.timestamp
  );


  console.log(
    "SNAPSHOT CHECK",
    {

      phase:
        snapshot.phase,

      hasRotationDecay:
        !!snapshot.rotationDecay,

      hasRegimeSync:
        !!snapshot.regimeSync,

      hasTradeStack:
        !!snapshot.tradeStack,

      hasExecutionState:
        !!snapshot.executionState,

      hasLiquidity:
        !!snapshot.liquidity,

      hasFragility:
        !!snapshot.fragility

    }
  );


  /* ================= SAVE HISTORY ================= */

  await fetch(
    "/api/history",
    {

      method:
        "POST",

      headers: {

        "Content-Type":
          "application/json"

      },

      body:
        JSON.stringify({

          snapshot

        })

    }
  );


  /* ================= UPDATE UI ================= */

  setEngine(e);


  /* ================= AUTO SAVE SIGNAL ================= */

  if (
    e?.signal?.active
  ) {

    fetch(
      "/api/signal",
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            signal: {

              timestamp:
                Date.now(),

              phase:
                e.phase,

              type:
                e.signal.type,

              strength:
                e.signal.strength,

              message:
                e.signal.message,

              priority:
                e.signal.priority ??
                "MEDIUM"

            }

          })

      }
    )
    .catch(() => {});

  }

}

catch (err) {

  console.error(
    "LOAD ERROR:",
    err
  );

}

}

/* =====================================================
SNAPSHOT COPY
===================================================== */

function copySnapshot() {

if (!engine) return;


const snapshot =
  createMarketSnapshot({

    map: {

      indices:
        engine.indices,

      futures:
        engine.futures,

      historyMetrics:
        engine.historyMetrics

    },

    engine

  });


navigator.clipboard.writeText(

  JSON.stringify(
    snapshot,
    null,
    2
  )

);


console.log(
  "📸 SNAPSHOT COPIED",
  snapshot
);

}

/* =====================================================
LOADING
===================================================== */

if (!checkedAuth) {

return null;

}

if (!engine) {

return (

  <div className="flex min-h-screen items-center justify-center bg-black p-10 text-white">

    Loading Market Engine...

  </div>

);

}

/* =====================================================
PANEL STYLE
===================================================== */

const panel = {

background:
  "#111",

border:
  "1px solid #222",

padding:
  "16px"

};

/* =====================================================
SECTION HEADER
===================================================== */

function SectionHeader({
title,
subtitle
}: {
title: string;
subtitle?: string;
}) {

return (

  <div className="mb-3 border-b border-[#222] pb-2">

    <h2 className="text-sm font-bold tracking-[0.12em] text-[#888] md:text-base">

      {title}

    </h2>

    {subtitle && (

      <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#555]">

        {subtitle}

      </div>

    )}

  </div>

);

}

/* =====================================================
RENDER
===================================================== */

return (

<main className="min-h-screen bg-black p-3 font-mono text-white sm:p-4 md:p-6 lg:p-8">


  {/* =====================================================
  HEADER
  ===================================================== */}

  <header className="mb-6 flex flex-col gap-4 border-b border-[#222] pb-4 sm:flex-row sm:items-center sm:justify-between">

    <div>

      <h1 className="text-xl font-bold tracking-wide md:text-2xl">

        MARKET DASHBOARD

      </h1>

      <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#555]">

        Institutional Market Structure Engine

      </div>

    </div>


    {/* ACTIONS */}

    <div className="flex gap-2">

      <button
        onClick={load}
        className="border border-[#444] bg-[#222] px-3 py-2 text-sm transition hover:bg-[#333]"
      >
        ↻
      </button>


      <button
        onClick={copySnapshot}
        className="border border-[#444] bg-[#222] px-3 py-2 text-sm transition hover:bg-[#333]"
      >
        📸
      </button>


      <button
        onClick={() => {

          localStorage.removeItem(
            "auth"
          );

          router.push(
            "/login"
          );

        }}
        className="border border-[#444] bg-[#8b0000] px-3 py-2 text-sm transition hover:bg-[#a00000]"
      >
        🔒
      </button>

    </div>

  </header>


  {/* =====================================================
  1. MARKET REGIME
  ===================================================== */}

  <section className="mb-8">

    <SectionHeader
      title="MARKET REGIME"
      subtitle="Current institutional market posture"
    />


    <RegimeRibbonPanel
      executionState={engine.executionState}
      regimeSync={engine.regimeSync}
      dangerZone={engine.dangerZone}
      phase={engine.phase}
    />

  </section>


  {/* =====================================================
  2. TRADE COMMAND CENTER
  ===================================================== */}

  <section className="mb-8">

    <SectionHeader
      title="TRADE COMMAND CENTER"
      subtitle="Master score, execution and directional positioning"
    />


    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">


      <MasterPanel
        master={engine.master}
        decision={engine.decision}
        signal={engine.signal}
        nasdaq={engine.nasdaqCall}
        marketPhase={engine.phase}
        rotationConfirm={engine.rotationConfirm}
      />


      <TradeStackPanel
        tradeStack={engine.tradeStack}
        sizing={engine.sizing}
        rotationConfirm={engine.rotationConfirm}
      />


      <PutTimingPanel
        putTiming={engine.putTiming}
        exit={engine.exit?.short}
      />


      <RussellPanel
        russell={engine.russell}
        exit={engine.exit?.long}
      />


      <NasdaqPanel
        nasdaq={engine.nasdaqCall}
        exit={engine.exit}
      />


      <PositionSizingPanel
        sizing={engine.sizing}
        decision={engine.decision}
      />


      <CrashPanel
        crash={engine.crash}
      />

    </div>

  </section>


  {/* =====================================================
  3. SIGNALS
  ===================================================== */}

  <section className="mb-8">

    <SectionHeader
      title="SIGNALS & POSITIONING"
      subtitle="Signal generation, early warning and exits"
    />


    <div className="mb-4">

      <SuperSignalPanel
        superSignal={engine.superSignal}
      />

    </div>


    <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">

      <SignalHistoryPanel />


      <SignalPanel
        signal={engine.signal}
      />

    </div>


    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

      <EarlyWarningPanel
        earlyWarning={engine.earlyWarning}
      />


      <PositioningPanel
        positioning={engine.positioning}
      />


      <ExitPanel
        exit={engine.exit}
      />

    </div>

  </section>


  {/* =====================================================
  4. SYSTEM STRUCTURE
  ===================================================== */}

  <section className="mb-8">

    <SectionHeader
      title="SYSTEM STRUCTURE"
      subtitle="Market phase, system temperature and index environment"
    />


    <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">


      {/* MARKET PHASE */}

      <div style={panel}>

        <h3 className="mb-4 text-sm text-[#888]">

          MARKET PHASE

        </h3>


        <PhaseBar
          phase={engine.phase}
          regime={engine.regime}
        />

      </div>


      {/* SYSTEM HEAT */}

      <div style={panel}>

        <h3 className="mb-4 text-sm text-[#888]">

          SYSTEM HEAT

        </h3>


        <SystemHeatPanel
          heat={engine.systemHeat}
        />


        <div className="mt-4">

          <SystemDotsPanel
            drivers={engine.marketDrivers}
            structure={engine.structure}
            crash={engine.crash}
          />

        </div>

      </div>

    </div>


    {/* INDEX MARKETS */}

    <div style={panel}>

      <h3 className="mb-4 text-sm text-[#888]">

        INDEX MARKETS

      </h3>


      <IndicesPanel
        indices={engine.indices}
        futures={engine.futures}
      />

    </div>

  </section>


  {/* =====================================================
  5. ROTATION & INTERNALS
  ===================================================== */}

  <section className="mb-8">

    <SectionHeader
      title="ROTATION & INTERNAL MARKET STRUCTURE"
      subtitle="Capital rotation, leadership concentration and internal deterioration"
    />


    {/* ROTATION COMPOSITE */}

    <div className="mb-4">

      <RotationCompositePanel
        rotation={engine.rotation}
        rotationConfirm={engine.rotationConfirm}

        rotationDecay={engine.rotationDecay}

        fragility={engine.fragility}

        liquidity={engine.liquidity}

        squeeze={engine.squeeze}

        participation={engine.participation}

        executionState={engine.executionState}

        regimeSync={engine.regimeSync}

        superSignal={engine.superSignal}
      />

    </div>


    {/* ROTATION INTERNALS + STRUCTURE */}

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">


      <RotationInternalsPanel
        rotation={engine.rotation}

        rotationConfirm={
          engine.rotationConfirm
        }

        rotationDecay={
          engine.rotationDecay
        }

        structureFlags={
          engine.structureFlags
        }
      />


      <StructurePanel
        structure={engine.structure}

        regimeSync={
          engine.regimeSync
        }

        executionState={
          engine.executionState
        }
      />

    </div>


    {/* MARKET DRIVERS */}

    <div className="mt-4">

      <MarketDrivers
drivers={engine.marketDrivers}
earlyWarning={engine.earlyWarning}
regimeSync={engine.regimeSync}
executionState={engine.executionState}
dangerZone={engine.dangerZone}
/>

    </div>

  </section>


  {/* =====================================================
  6. INSTITUTIONAL RISK ENGINES
  ===================================================== */}

  <section className="mb-8">

    <SectionHeader
      title="INSTITUTIONAL MARKET RISK"
      subtitle="Liquidity, fragility, participation and breadth"
    />


    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">


      <LiquidityPanel
        data={engine}
      />


      <FragilityPanel
        data={engine}
      />


      <ParticipationPanel
        data={engine}
      />


      <BreadthThrustPanel
        data={engine}
      />


      <SqueezeRiskPanel
        data={engine}
      />

    </div>

  </section>


  {/* =====================================================
  7. HISTORY
  ===================================================== */}

  <section className="mb-8">

    <SectionHeader
      title="MARKET HISTORY & REPLAY"
      subtitle="Historical structural development"
    />


    <HistoricalReplayPanel
      replay={engine.replay}
    />

  </section>


  {/* =====================================================
  8. DIAGNOSTICS
  ===================================================== */}

  <section className="mb-8">

    <SectionHeader
      title="SYSTEM DIAGNOSTICS"
      subtitle="Engine validation and technical diagnostics"
    />


    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

      <SystemDiagnosticsPanel
        engine={engine}
      />

    </div>

  </section>


</main>

);

}
