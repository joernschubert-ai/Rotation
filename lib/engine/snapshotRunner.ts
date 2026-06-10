// /lib/engine/snapshotRunner.ts

import { marketDataAdapter } from "./marketDataAdapter"

import { marketDriversEngine } from "./marketDriversEngine"
import { liquidityEngine } from "./liquidityEngine"
import { participationEngine } from "./participationEngine"
import { breadthThrustEngine } from "./breadthThrustEngine"
import { masterScoreEngine } from "./masterScoreEngine"

/* =====================================================
NEW SUMMARY LAYER
===================================================== */

import { summaryBuilder } from "./summaryBuilder"
import { narrativeEngine } from "./narrativeEngine"

export function snapshotRunner(
rawSnapshot: any
) {

/* =====================================================
NORMALIZE SNAPSHOT
===================================================== */

const adapted =
marketDataAdapter(rawSnapshot)

/* =====================================================
STRUCTURE
===================================================== */

const structure = {
breadth: {
b20: {
value: adapted.breadth20
},

b50: {
value: adapted.breadth50
},

b200: {
value: adapted.breadth200
}
},

advanceDecline: {
value: adapted.ad
},

highsLows: {
highs: adapted.highs,
lows: adapted.lows
},

health: {
value: adapted.structureHealth
}
}

/* =====================================================
DRIVERS
===================================================== */

const drivers =
marketDriversEngine(adapted)

/* =====================================================
LIQUIDITY
===================================================== */

const liquidity =
liquidityEngine({
...adapted,

breadth50:
adapted.breadth50,

breadth200:
adapted.breadth200
})

/* =====================================================
PARTICIPATION
===================================================== */

const participation =
participationEngine({
structure,

breadth20:
adapted.breadth20,

breadth50:
adapted.breadth50,

breadth200:
adapted.breadth200,

rsEqual:
adapted.rsEqual,

rsSmall:
adapted.rsSmall,

rsGrowth:
adapted.rsGrowth,

highs:
adapted.highs,

lows:
adapted.lows,

concentrationScore:
adapted.concentrationScore,

rotationScore:
adapted.rotationScore
})

/* =====================================================
THRUST
===================================================== */

const breadthThrust =
breadthThrustEngine({
structure,

rsEqual:
adapted.rsEqual,

rsSmall:
adapted.rsSmall,

volumeRatio:
adapted.volumeRatio,

participationScore:
participation.score,

rotationScore:
adapted.rotationScore,

concentrationScore:
adapted.concentrationScore
})

/* =====================================================
MASTER SCORE
===================================================== */

const masterScore =
masterScoreEngine({

structure,

liquidity,

participation,

breadthThrust,

crash: adapted.crash,

rotation: {
score:
adapted.rotationScore
},

phaseData: {
phase:
adapted.phase
},

fragility: {
score:
adapted.fragilityScore
},

rotationDecay: {
score:
adapted.rotationDecayScore,

state:
adapted.rotationDecayState,

momentumQuality:
adapted.momentumQuality
},

regimeSync: {
aligned:
adapted.regimeAligned,

score:
adapted.regimeSyncScore
}
})

/* =====================================================
SUMMARY BUILDER
===================================================== */

const summary =
summaryBuilder({

participation,

liquidity,

breadthThrust,

masterScore,

rotation: {
score:
adapted.rotationScore,

rsEqual:
adapted.rsEqual,

rsSmall:
adapted.rsSmall,

rsGrowth:
adapted.rsGrowth
},

breadth: {
breadth20:
adapted.breadth20,

breadth50:
adapted.breadth50,

breadth200:
adapted.breadth200
},

structure,

concentrationScore:
adapted.concentrationScore,

phase:
adapted.phase
})

/* =====================================================
NARRATIVE ENGINE
===================================================== */

const narrative =
narrativeEngine({

participation,

liquidity,

breadthThrust,

masterScore,

summary,

rotation: {
score:
adapted.rotationScore,

rsEqual:
adapted.rsEqual,

rsSmall:
adapted.rsSmall,

rsGrowth:
adapted.rsGrowth
},

breadth: {
breadth20:
adapted.breadth20,

breadth50:
adapted.breadth50,

breadth200:
adapted.breadth200
},

concentrationScore:
adapted.concentrationScore,

phase:
adapted.phase
})

/* =====================================================
RETURN
===================================================== */

return {

date:
adapted.date,

outputs: {

drivers,

liquidity,

participation,

breadthThrust,

masterScore,

/* =====================================================
NEW LAYERS
===================================================== */

summary,

narrative
}
}
}
