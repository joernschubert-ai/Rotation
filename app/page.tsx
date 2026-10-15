"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { marketEngine } from "@/lib/engine/marketEngine";
import { mapBackendToEngine } from "@/lib/adapters/mapBackendToEngine";
import { validateEngineData } from "@/lib/engine/validateEngineData";
import { historyEngine } from "@/lib/history/historyEngine";
import { createMarketSnapshot } from "@/lib/history/snapshotEngine";

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
import RegimeRibbonPanel from "@/components/RegimeRibbonPanel";
import SuperSignalPanel from "@/components/SuperSignalPanel";
import AIResearchPanel from "@/components/AIResearchPanel";
import LiquidityPanel from "@/components/LiquidityPanel";
import FragilityPanel from "@/components/FragilityPanel";
import ParticipationPanel from "@/components/ParticipationPanel";
import BreadthThrustPanel from "@/components/BreadthThrustPanel";
import SqueezeRiskPanel from "@/components/SqueezeRiskPanel";
import GammaPanel from "@/components/GammaPanel";
import RotationCompositePanel from "@/components/RotationCompositePanel";
import RotationInternalsPanel from "@/components/RotationInternalsPanel";
import HistoricalReplayPanel from "@/components/HistoricalReplayPanel";

type LoadedMarket = {
  engine: any;
  map: any;
  snapshot: any;
};

function SectionHeader({
  title,
  subtitle,
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

export default function Home() {
  const router = useRouter();
  const [loadedMarket, setLoadedMarket] = useState<LoadedMarket | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [researchSnapshotTimestamp, setResearchSnapshotTimestamp] = useState<string | null>(null);

  // Unlike state, this lock changes immediately.
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsReloading(true);
    setLoadError(null);
    setSaveError(null);

    try {
      const marketRes = await fetch("/api/market", {
        cache: "no-store",
      });

      if (!marketRes.ok) {
        throw new Error(`MARKET REQUEST FAILED: ${marketRes.status}`);
      }

      const marketJson = await marketRes.json();
      const mapped = mapBackendToEngine(marketJson);

      if (!mapped) {
        throw new Error("Market data mapping failed");
      }

      if (!validateEngineData(mapped)) {
        throw new Error("Engine input validation failed");
      }

      const historyRes = await fetch("/api/history", {
        cache: "no-store",
      });

      if (!historyRes.ok) {
        throw new Error(`HISTORY REQUEST FAILED: ${historyRes.status}`);
      }

      const history = await historyRes.json();

      if (!Array.isArray(history)) {
        throw new Error("History response is not an array");
      }

      // Use the universe of the currently loaded market data, including on
      // the first refresh before any snapshot of that universe has been saved.
      const historyMetrics = historyEngine(history, {
        universeVersion: mapped.breadthDataQuality?.universeVersion ?? null,
      });
      const mappedWithHistory = {
        ...mapped,
        historyMetrics,
      };

      const result = marketEngine(mappedWithHistory);
      const snapshot = createMarketSnapshot({
        map: mappedWithHistory,
        engine: result,
      });

      /*
       * Publish the map, engine and exact snapshot together.
       * A failed refresh leaves the previous complete frame intact.
       */
      setLoadedMarket({
        engine: result,
        map: mappedWithHistory,
        snapshot,
      });

      try {
        const saveRes = await fetch("/api/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ snapshot }),
        });

        if (!saveRes.ok) {
          throw new Error(`History save failed: ${saveRes.status}`);
        }

        const saveResult = await saveRes.json();

        if (saveResult?.ok !== true) {
          throw new Error("History save was not confirmed");
        }
        setResearchSnapshotTimestamp(snapshot.timestamp);
      } catch (error) {
        console.error("HISTORY SNAPSHOT SAVE FAILED", error);
        setSaveError(
          "Market data loaded, but the history snapshot could not be saved."
        );
      }

      if (result?.signal?.active) {
        void fetch("/api/signal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            signal: {
              timestamp: Date.now(),
              phase: result.phase,
              type: result.signal.type,
              strength: result.signal.strength,
              message: result.signal.message,
              priority: result.signal.priority ?? "MEDIUM",
            },
          }),
        })
          .then(response => {
            if (!response.ok) {
              console.error("SIGNAL SAVE FAILED", response.status);
            }
          })
          .catch(error => {
            console.error("SIGNAL SAVE FAILED", error);
          });
      }
    } catch (error) {
      console.error("LOAD ERROR", error);
      setLoadError(
        "Market refresh failed. Any displayed values remain from the previous successful load."
      );
    } finally {
      loadingRef.current = false;
      setIsReloading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("auth") !== "true") {
      router.replace("/login");
      return;
    }

    setCheckedAuth(true);
    void load();
  }, [router, load]);

  async function copySnapshot() {
    if (!loadedMarket) return;

    try {
      /*
       * Copy the loaded snapshot exactly.
       * Do not create a new timestamp for an older engine result.
       */
      await navigator.clipboard.writeText(
        JSON.stringify(loadedMarket.snapshot, null, 2)
      );
    } catch (error) {
      console.error("SNAPSHOT COPY FAILED", error);
      setLoadError("The snapshot could not be copied to the clipboard.");
    }
  }

  if (!checkedAuth) return null;

  if (!loadedMarket) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black p-10 text-white">
        <div>{loadError ?? "Loading Market Engine..."}</div>
        {loadError && (
          <button
            type="button"
            onClick={() => void load()}
            disabled={isReloading}
            className="border border-[#444] bg-[#222] px-3 py-2 disabled:opacity-50"
          >
            {isReloading ? "Refreshing..." : "Retry"}
          </button>
        )}
      </div>
    );
  }

  const engine = loadedMarket.engine;

  const panel = {
    background: "#111",
    border: "1px solid #222",
    padding: "16px",
  };

  return (
    <main className="min-h-screen bg-black p-3 font-mono text-white sm:p-4 md:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-[#222] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-wide md:text-2xl">
            MARKET DASHBOARD
          </h1>
          <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#555]">
            Institutional Market Structure Engine
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={isReloading}
            title={isReloading ? "Market data is refreshing" : "Refresh market data"}
            className="border border-[#444] bg-[#222] px-3 py-2 text-sm transition hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isReloading ? "↻ ..." : "↻"}
          </button>

          <button
            type="button"
            onClick={copySnapshot}
            title="Copy the snapshot of the displayed market result"
            className="border border-[#444] bg-[#222] px-3 py-2 text-sm transition hover:bg-[#333]"
          >
            📸
          </button>

          <button
            type="button"
              onClick={async () => {
                await fetch("/api/login", { method: "DELETE" }).catch(() => undefined);
              localStorage.removeItem("auth");
              router.push("/login");
            }}
            className="border border-[#444] bg-[#8b0000] px-3 py-2 text-sm transition hover:bg-[#a00000]"
          >
            🔒
          </button>
        </div>
      </header>

      {loadError && (
        <div role="alert" className="mb-4 border border-red-800 p-3 text-sm text-red-300">
          {loadError}
        </div>
      )}

      {saveError && (
        <div role="alert" className="mb-4 border border-amber-800 p-3 text-sm text-amber-300">
          {saveError}
        </div>
      )}

      <section className="mb-8">
        <SectionHeader
          title="RESEARCH · ENTSCHEIDUNGSHILFE"
          subtitle="Marktlage, frühe Einstiegskandidaten, Modellanteile und Gegenargumente"
        />
        <AIResearchPanel
          expectedSnapshotTimestamp={loadedMarket.snapshot.timestamp}
          marketReady={!isReloading && !loadError && researchSnapshotTimestamp === loadedMarket.snapshot.timestamp}
        />
      </section>

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
          <CrashPanel crash={engine.crash} />
        </div>
      </section>

      <section className="mb-8">
        <SectionHeader
          title="SIGNALS & POSITIONING"
          subtitle="Signal generation, early warning and exits"
        />
        <div className="mb-4">
          <SuperSignalPanel superSignal={engine.superSignal} />
        </div>
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SignalHistoryPanel />
          <SignalPanel signal={engine.signal} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <EarlyWarningPanel earlyWarning={engine.earlyWarning} />
          <PositioningPanel positioning={engine.positioning} />
          <ExitPanel exit={engine.exit} />
        </div>
      </section>

      <section className="mb-8">
        <SectionHeader
          title="SYSTEM STRUCTURE"
          subtitle="Market phase, system temperature and index environment"
        />
        <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div style={panel}>
            <h3 className="mb-4 text-sm text-[#888]">MARKET PHASE</h3>
            <PhaseBar
              phase={engine.phase}
              regime={engine.regime}
              marketPhase={engine.phaseData}
            />
          </div>

          <div style={panel}>
            <h3 className="mb-4 text-sm text-[#888]">SYSTEM HEAT</h3>
            <SystemHeatPanel heat={engine.systemHeat} />
            <div className="mt-4">
              <SystemDotsPanel
                drivers={engine.marketDrivers}
                structure={engine.structure}
                crash={engine.crash}
              />
            </div>
          </div>
        </div>

        <div style={panel}>
          <h3 className="mb-4 text-sm text-[#888]">INDEX MARKETS</h3>
          <IndicesPanel
            indices={engine.indices}
            futures={engine.futures}
          />
        </div>
      </section>

      <section className="mb-8">
        <SectionHeader
          title="ROTATION & INTERNAL MARKET STRUCTURE"
          subtitle="Capital rotation, leadership concentration and internal deterioration"
        />

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

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <RotationInternalsPanel
            rotation={engine.rotation}
            rotationConfirm={engine.rotationConfirm}
            rotationDecay={engine.rotationDecay}
            structureFlags={engine.structureFlags}
          />
          <StructurePanel
            structure={engine.structure}
            regimeSync={engine.regimeSync}
            executionState={engine.executionState}
          />
        </div>

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

      <section className="mb-8">
        <SectionHeader
          title="INSTITUTIONAL MARKET RISK"
          subtitle="Liquidity, fragility, participation and breadth"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <LiquidityPanel data={engine} />
          <FragilityPanel data={engine} />
          <ParticipationPanel data={engine} />
          <BreadthThrustPanel data={engine} />
          <GammaPanel data={engine} />
          <SqueezeRiskPanel data={engine} />
        </div>
      </section>

      <section className="mb-8">
        <SectionHeader
          title="MARKET HISTORY & REPLAY"
          subtitle="Historical structural development and regime validation"
        />
        <HistoricalReplayPanel replay={engine.replay} />
      </section>

    </main>
  );
}
