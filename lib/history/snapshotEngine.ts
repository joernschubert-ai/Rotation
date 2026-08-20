// /lib/engine/createMarketSnapshot.ts

export function createMarketSnapshot({
map,
engine,
}: {
map: any;
engine: any;
}) {
const structure = engine.structure ?? {};
const breadth = structure.breadth ?? {};
const highsLows = structure.highsLows ?? {};

const history = map.historyMetrics ?? {};

const rotation = engine.rotation ?? {};
const rotationDecay = engine.rotationDecay ?? {};
const rotationConfirm = engine.rotationConfirm ?? {};

const crash = engine.crash ?? {};
const phase = engine.phaseData ?? {};
const persistence = engine.regimePersistence ?? {};

const participation = engine.participation ?? {};
const liquidity = engine.liquidity ?? {};
const fragility = engine.fragility ?? {};
const breadthThrust = engine.breadthThrust ?? {};
const earlyWarning = engine.earlyWarning ?? {};

const marketQuality = engine.marketQuality ?? {};
const regimeSync = engine.regimeSync ?? {};
const executionState = engine.executionState ?? {};
const dangerZone = engine.dangerZone ?? {};

const priceMomentum = engine.priceMomentum ?? {};
const putTiming = engine.putTiming ?? {};
const russell = engine.russell ?? {};
const nasdaqCall = engine.nasdaqCall ?? {};

const master = engine.master ?? {};
const tradeStack = engine.tradeStack ?? {};
const edgeState = engine.edgeState ?? {};
const signal = engine.signal ?? {};
const superSignal = engine.superSignal ?? {};

return {
timestamp: new Date().toISOString(),

/* =====================================================
MARKET REGIME
===================================================== */

phase: {
phase: engine.phase,
regimeState: phase.regimeState,
subPhase: phase.subPhase,
confidence: phase.confidence,
},

/* =====================================================
MASTER / CENTRAL DECISION
===================================================== */

master: {
score: master.score,
mode: master.mode,
regime: master.regime,
netExposure: master.netExposure,

components: master.components
? {
crash: master.components.crash,
rotation: master.components.rotation,
timing: master.components.timing,
russell: master.components.russell,
participation: master.components.participation,
breadthThrust: master.components.breadthThrust,
breadthVelocity: master.components.breadthVelocity,
rotationDecay: master.components.rotationDecay,
liquidity: master.components.liquidity,
marketQuality: master.components.marketQuality,
fragility: master.components.fragility,
}
: undefined,
},

/* =====================================================
CRASH / RISK
===================================================== */

crash: {
score: crash.score,
probability: crash.probability,
label: crash.label,
eventType: crash.eventType,

structuralFragility:
crash.structuralFragility
? {
score: crash.structuralFragility.score,
state: crash.structuralFragility.state,
}
: undefined,

trigger: crash.trigger,
momentum: crash.momentum,
},

/* =====================================================
MARKET STRUCTURE / BREADTH
===================================================== */

structure: {
breadth: {
b20: breadth.b20?.value,
b50: breadth.b50?.value,
b200: breadth.b200?.value,
},

health: structure.health?.value,

advanceDecline:
structure.advanceDecline?.value,

highsLows: {
highs: highsLows.highs,
lows: highsLows.lows,
},

marketStructure: structure.marketStructure,
},

/* =====================================================
ROTATION
===================================================== */

rotation: {
score: rotation.score,
signal: rotation.signal,
regime: rotation.regime,
state: rotation.state,

rsSmall: rotation.rsSmall,
rsGrowth: rotation.rsGrowth,
rsEqual: rotation.rsEqual,

smallCapLeadership:
rotation.smallCapLeadership,

growthLeadership:
rotation.growthLeadership,
},

rotationDecay: {
score: rotationDecay.score,
state: rotationDecay.state,
trend: rotationDecay.trend,
persistence: rotationDecay.persistence,
exhaustion: rotationDecay.exhaustion,
},

rotationConfirm: {
state: rotationConfirm.state,
score: rotationConfirm.score,
liquiditySupport:
rotationConfirm.liquiditySupport,
rotationDecayScore:
rotationConfirm.rotationDecayScore,
},

/* =====================================================
PARTICIPATION
===================================================== */

participation: {
score: participation.score,
state: participation.state,

breadth:
participation.breadth,

leadership:
participation.leadership,

decay:
participation.decay,

participationFailure:
participation.participationFailure,
},

breadthThrust: {
score: breadthThrust.score,
state: breadthThrust.state,
signal: breadthThrust.signal,
},

/* =====================================================
LIQUIDITY / FRAGILITY
===================================================== */

liquidity: {
score: liquidity.score,
state: liquidity.state,
trend: liquidity.trend,
},

fragility: {
score: fragility.score,
state: fragility.state,
trend: fragility.trend,
},

marketQuality: {
score: marketQuality.score,
state: marketQuality.state,
trend: marketQuality.trend,
},

/* =====================================================
EARLY WARNING
===================================================== */

earlyWarning: {
active: earlyWarning.active,

score:
typeof earlyWarning.score === "object"
? earlyWarning.score?.value
: earlyWarning.score,

state: earlyWarning.state,
reasons: earlyWarning.reasons,
},

/* =====================================================
REGIME PERSISTENCE
===================================================== */

regimePersistence: {
score: persistence.score,
state: persistence.state,

bearishPersistence:
persistence.bearishPersistence,

bullishPersistence:
persistence.bullishPersistence,

trend:
persistence.trend,

regimeAge:
persistence.regimeAge,

distributionRisk:
persistence.distributionRisk,

recoveryQuality:
persistence.recoveryQuality,

falseRecoveryRisk:
persistence.falseRecoveryRisk,

trendStability:
persistence.trendStability,

marketFatigue:
persistence.marketFatigue,
},

/* =====================================================
PRICE MOMENTUM
===================================================== */

priceMomentum: {
score:
priceMomentum.score,

direction:
priceMomentum.direction,

bullishImpulse:
priceMomentum.bullishImpulse,

bearishImpulse:
priceMomentum.bearishImpulse,

ndx:
priceMomentum.ndx
? {
score: priceMomentum.ndx.score,
acceleration:
priceMomentum.ndx.acceleration,
direction:
priceMomentum.ndx.direction,
}
: undefined,
},

/* =====================================================
NASDAQ / PUT / CALL
===================================================== */

putTiming: {
decision: putTiming.decision,
timing: putTiming.timing,
execution: putTiming.execution,
score: putTiming.score,

institutionState:
putTiming.institutionState,

reason:
putTiming.reason,
},

nasdaqCall: {
decision: nasdaqCall.decision,
signal: nasdaqCall.signal,
score: nasdaqCall.score,
timing: nasdaqCall.timing,
state: nasdaqCall.state,
},

russell: {
action: russell.action,
decision: russell.decision,
score: russell.score,
signal: russell.signal,
state: russell.state,
regime: russell.regime,
},

/* =====================================================
REGIME SYNC / EXECUTION
===================================================== */

regimeSync: {
score: regimeSync.score,
state: regimeSync.state,
signal: regimeSync.signal,
transition: regimeSync.transition,
},

executionState: {
state: executionState.state,
signal: executionState.signal,
score: executionState.score,
},

dangerZone: {
score: dangerZone.score,
state: dangerZone.state,
level: dangerZone.level,
},

/* =====================================================
TRADE STACK
===================================================== */

tradeStack: {
decision: tradeStack.decision,
state: tradeStack.state,

nasdaqPut:
tradeStack.nasdaqPut,

nasdaqCall:
tradeStack.nasdaqCall,

russellCall:
tradeStack.russellCall,
},

/* =====================================================
EDGE / SIGNAL
===================================================== */

edgeState: {
score: edgeState.score,
state: edgeState.state,
direction: edgeState.direction,
},

signal: {
active: signal.active,
type: signal.type,
direction: signal.direction,
strength: signal.strength,
score: signal.score,
},

superSignal: {
active: superSignal.active,
signal: superSignal.signal,
direction: superSignal.direction,
score: superSignal.score,
confidence: superSignal.confidence,
},

/* =====================================================
HISTORY — NUR DIE FÜR DIE REGIMEANALYSE WICHTIGEN WERTE
===================================================== */

historyMetrics: {
breadthTrend:
history.breadthTrend,

breadthAcceleration:
history.breadthAcceleration,

participationTrend:
history.participationTrend,

participationDecay:
history.participationDecay,

rotationTrend:
history.rotationTrend,

liquidityTrend:
history.liquidityTrend,

fragilityTrend:
history.fragilityTrend,

relativeBreadthWeakness:
history.relativeBreadthWeakness,

crashTrend:
history.crashTrend,

phasePersistence:
history.phasePersistence,

daysInPhase:
history.daysInPhase,

breadthWeakDays:
history.breadthWeakDays,

participationWeakDays:
history.participationWeakDays,

rotationWeakDays:
history.rotationWeakDays,

liquidityWeakDays:
history.liquidityWeakDays,

fragilityHighDays:
history.fragilityHighDays,

distributionDays:
history.distributionDays,

institutionalPressure:
history.institutionalPressure,

marketCharacter:
history.marketCharacter,

prolongedBearRegime:
history.prolongedBearRegime,

acceleratingWeakness:
history.acceleratingWeakness,

averageBreadth:
history.averageBreadth,

averageParticipation:
history.averageParticipation,

averageRotation:
history.averageRotation,

averageLiquidity:
history.averageLiquidity,

averageFragility:
history.averageFragility,
},

/* =====================================================
MACRO / DRIVERS — KOMPAKT
===================================================== */

marketDrivers: {
score: engine.marketDrivers?.score,
regime: engine.marketDrivers?.regime,
state: engine.marketDrivers?.state,
},

driversCore: {
score: engine.driversCore?.score,
regime: engine.driversCore?.regime,
state: engine.driversCore?.state,
},

/* =====================================================
SYSTEM HEAT
===================================================== */

systemHeat: {
score:
engine.systemHeat?.score,

value:
engine.systemHeat?.value,

state:
engine.systemHeat?.state,
},

/* =====================================================
INDICES
===================================================== */

indices: {
nasdaq:
map.indices?.nasdaq ??
map.indices?.NASDAQ,

sp500:
map.indices?.sp500 ??
map.indices?.SP500,

russell:
map.indices?.russell ??
map.indices?.RUSSELL,

vix:
map.indices?.vix ??
map.indices?.VIX,
},

futures: map.futures
? {
nasdaq: map.futures?.nasdaq,
sp500: map.futures?.sp500,
russell: map.futures?.russell,
}
: undefined,
};
}
