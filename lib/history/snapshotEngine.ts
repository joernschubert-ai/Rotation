export function createMarketSnapshot({
map,
engine,
}: {
map: any;
engine: any;
}) {
return {
timestamp: new Date().toISOString(),

historyMetrics: map.historyMetrics,

phase: engine.phase,
phaseData: engine.phaseData,

master: engine.master,

crash: engine.crash,

putTiming: engine.putTiming,
russell: engine.russell,

rotation: engine.rotation,
rotationConfirm: engine.rotationConfirm,
rotationDecay: engine.rotationDecay,

participation: engine.participation,

liquidity: engine.liquidity,
fragility: engine.fragility,

breadthThrust: engine.breadthThrust,
squeeze: engine.squeeze,

earlyWarning: engine.earlyWarning,

tradeStack: engine.tradeStack,

signal: engine.signal,
superSignal: engine.superSignal,

sizing: engine.sizing,
positioning: engine.positioning,

dangerZone: engine.dangerZone,
regimeSync: engine.regimeSync,

executionState: engine.executionState,

decision: engine.decision,

confidence: engine.confidence,

execution: engine.execution,

risk: engine.risk,

exit: engine.exit,

edgeState: engine.edgeState,

state: engine.state,

structure: engine.structure,

indices: map.indices,

futures: map.futures,

marketDrivers: engine.marketDrivers,
driversCore: engine.driversCore,

systemHeat: engine.systemHeat

};
}
