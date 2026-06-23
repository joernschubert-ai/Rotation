"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { marketEngine } from "@/lib/engine/marketEngine";
import { mapBackendToEngine } from "@/lib/adapters/mapBackendToEngine";
import { validateEngineData } from "@/lib/engine/validateEngineData";

import { createMarketSnapshot } from "@/lib/history/snapshotEngine";

/* ================= COMPONENTS ================= */

import MarketDrivers from "@/components/MarketDrivers";
import StructurePanel from "@/components/StructurePanel";
import CrashPanel from "@/components/CrashPanel";
import PutTimingPanel from "@/components/PutTimingPanel";
import RussellPanel from "@/components/RussellPanel";
import MasterPanel from "@/components/MasterPanel";
import PositionSizingPanel from "@/components/PositionSizingPanel";
import PhaseBar from "@/components/PhaseBar";
import IndicesPanel from "@/components/IndicesPanel";
import SystemHeatPanel from "@/components/SystemHeatPanel";
import SystemDotsPanel from "@/components/SystemDotsPanel";
import RotationInternalsPanel from "@/components/RotationInternalsPanel";
import EarlyWarningPanel from "@/components/EarlyWarningPanel";
import PositioningPanel from "@/components/PositioningPanel";
import ExitPanel from "@/components/ExitPanel";
import TradeStackPanel from "@/components/TradeStackPanel";
import SignalPanel from "@/components/SignalPanel";
import SignalHistoryPanel from "@/components/SignalHistoryPanel";
import SystemDiagnosticsPanel from "@/components/SystemDiagnosticsPanel";
import RegimeRibbonPanel from "@/components/RegimeRibbonPanel";
import SuperSignalPanel from "@/components/SuperSignalPanel";

/* ================= 🔥 INSTITUTIONAL PANELS ================= */

import LiquidityPanel from "@/components/LiquidityPanel";
import FragilityPanel from "@/components/FragilityPanel";
import ParticipationPanel from "@/components/ParticipationPanel";
import BreadthThrustPanel from "@/components/BreadthThrustPanel";
import SqueezeRiskPanel from "@/components/SqueezeRiskPanel";

import RotationCompositePanel from "@/components/RotationCompositePanel";
import HistoricalReplayPanel from "@/components/HistoricalReplayPanel";

/* ================= 🔥 NEW ROTATION DECAY ================= */

import RotationDecayPanel from "@/components/RotationDecayPanel";

export default function Home() {
const router = useRouter();

const [engine, setEngine] = useState<any>(null);
const [checkedAuth, setCheckedAuth] = useState(false);


/* =====================================================
LOAD
===================================================== */

useEffect(() => {

const auth = localStorage.getItem("auth");

if (auth !== "true") {
router.replace("/login");
return;
}

setCheckedAuth(true);
load();

}, [router]);


async function load() {

try {

const res =
await fetch("/api/market");

const json =
await res.json();

const mapped =
mapBackendToEngine(json);


/* ================= VALIDATION ================= */

if (!validateEngineData(mapped)) {

console.error(
"ENGINE DATA INVALID",
mapped
);

return;
}

/* ================= ENGINE ================= */

const e =
marketEngine(mapped);

/* SNAPSHOT */

const snapshot =
createMarketSnapshot({
map: mapped,
engine: e
});

console.log(
"SNAPSHOT CREATED",
snapshot.timestamp
);

console.log(
"SNAPSHOT CHECK",
{
phase: snapshot.phase,

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

await fetch("/api/history", {
method: "POST",

headers: {
"Content-Type":
"application/json"
},

body: JSON.stringify({
snapshot
})
});

setEngine(e);


/* ================= AUTO SAVE SIGNAL ================= */

if (e?.signal?.active) {

fetch("/api/signal", {
method: "POST",

headers: {
"Content-Type":
"application/json"
},

body: JSON.stringify({

signal: {

timestamp: Date.now(),

phase: e.phase,

type: e.signal.type,

strength: e.signal.strength,

message: e.signal.message,

priority:
e.signal.priority ?? "MEDIUM"
}

})
})
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
SNAPSHOT
===================================================== */

function copySnapshot() {

if (!engine) return;

const snapshot = {

timestamp:
new Date().toISOString(),

/* ================= CORE ================= */

phase:
engine.phase,

phaseData:
engine.phaseData,

regime:
engine.regime,

master:
engine.master,

decision:
engine.decision,

confidence:
engine.confidence,

/* ================= SIGNAL STACK ================= */

signal:
engine.signal,

superSignal:
engine.superSignal,

execution:
engine.execution,

risk:
engine.risk,

/* ================= ENGINES ================= */

crash:
engine.crash,

putTiming:
engine.putTiming,

russell:
engine.russell,

nasdaq:
engine.nasdaq,

sizing:
engine.sizing,

exit:
engine.exit,

position:
engine.position,

positioning:
engine.positioning,

state:
engine.state,

systemHeat:
engine.systemHeat,

/* ================= INTERNALS ================= */

rotation:
engine.rotation,

rotationConfirm:
engine.rotationConfirm,

rotationDecay:
engine.rotationDecay,

structure:
engine.structure,

earlyWarning:
engine.earlyWarning,

edgeState:
engine.edgeState,

tradeStack:
engine.tradeStack,

divergence:
engine.divergence,

/* ================= FLOW ================= */

executionState:
engine.executionState,

dangerZone:
engine.dangerZone,

regimeSync:
engine.regimeSync,

/* ================= INSTITUTIONAL ================= */

liquidity:
engine.liquidity,

fragility:
engine.fragility,

participation:
engine.participation,

breadthThrust:
engine.breadthThrust,

squeeze:
engine.squeeze,

/* ================= DRIVERS ================= */

driversCore:
engine.driversCore,

marketDrivers:
engine.marketDrivers,

/* ================= MARKETS ================= */

indices:
engine.indices,

futures:
engine.futures
};

navigator.clipboard.writeText(
JSON.stringify(snapshot, null, 2)
);

console.log(
"📸 SNAPSHOT COPIED",
snapshot
);

}

/* =====================================================
UI LOADING
===================================================== */

if (!checkedAuth) {
return null;
}

if (!engine) {

return (
<div className="p-10 text-white bg-black h-screen">
Loading...
</div>
);

}

/* =====================================================
STYLES
===================================================== */

const panel = {
background: "#111",
border: "1px solid #222",
padding: "16px"
};

/* =====================================================
RENDER
===================================================== */

return (

<div className="bg-black text-white min-h-screen p-4 md:p-6 font-mono">

{/* =====================================================
HEADER
===================================================== */}

<div className="flex justify-between items-center mb-6">

<h1 className="text-xl md:text-2xl">
MARKET DASHBOARD
</h1>

<div className="flex gap-2">

<button
onClick={load}
style={{
background: "#222",
padding: "6px 10px",
border: "1px solid #444",
cursor: "pointer"
}}
>
↻
</button>

<button
onClick={copySnapshot}
style={{
background: "#222",
padding: "6px 10px",
border: "1px solid #444",
cursor: "pointer"
}}
>
📸
</button>

<button
onClick={() => {
localStorage.removeItem("auth");
router.push("/login");
}}
style={{
background: "#8b0000",
padding: "6px 10px",
border: "1px solid #444",
cursor: "pointer"
}}
>
🔒
</button>

</div>

</div>

{/* =====================================================
REGIME RIBBON
===================================================== */}
<div className="mb-6">
<RegimeRibbonPanel
executionState={engine.executionState}
regimeSync={engine.regimeSync}
dangerZone={engine.dangerZone}
phase={engine.phase}
/>

</div>

{/* =====================================================
MASTER GRID
===================================================== */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">

<MasterPanel
master={engine.master}
decision={engine.decision}
signal={engine.signal}
nasdaq={engine.nasdaq}
/>

<TradeStackPanel
tradeStack={engine.tradeStack}
sizing={engine.sizing}
edgeState={engine.edgeState}
putTiming={engine.putTiming}
russell={engine.russell}
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

<PositionSizingPanel
sizing={engine.sizing}
decision={engine.decision}
nasdaq={engine.nasdaq}
/>

<CrashPanel
crash={engine.crash}
/>

</div>

{/* =====================================================
SUPER SIGNAL
===================================================== */}

<SuperSignalPanel
superSignal={engine.superSignal}
/>

{/* =====================================================
SIGNAL HISTORY
===================================================== */}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

<SignalHistoryPanel />

<SignalPanel
signal={engine.signal}
/>

</div>

{/* =====================================================
EARLY WARNING
===================================================== */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

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

{/* =====================================================
SYSTEM
===================================================== */}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

<div style={panel}>

<h3>MARKET PHASE</h3>

<PhaseBar
phase={engine.phase}
regime={engine.regime}
/>

</div>

<div style={panel}>

<h3>SYSTEM HEAT</h3>

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

{/* =====================================================
MARKETS
===================================================== */}

<div className="grid grid-cols-1 gap-4 mb-6">

<div style={panel}>

<h3>INDEX MARKETS</h3>

<IndicesPanel
indices={engine.indices}
futures={engine.futures}
/>

</div>

</div>

{/* =====================================================
ROTATION COMPOSITE
===================================================== */}

<div className="grid grid-cols-1 gap-4 mb-6">
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

{/* =====================================================
INTERNALS
===================================================== */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">


<StructurePanel
structure={engine.structure}
regimeSync={engine.regimeSync}
executionState={engine.executionState}
/>

<MarketDrivers
drivers={engine.marketDrivers}
earlyWarning={engine.earlyWarning}
/>

</div>


{/* =====================================================
🔥 INSTITUTIONAL PANELS
===================================================== */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

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
<HistoricalReplayPanel
replay={engine.replay}
/>

{/* =====================================================
🔥 SYSTEM DIAGNOSTIC
===================================================== */}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

<SystemDiagnosticsPanel
engine={engine}
/>


</div>

</div>
);

}


