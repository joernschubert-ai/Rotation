export function mapBackendToEngine(data: any) {
if (!data) return null;

/* ================= INDICES ================= */

const indices = {
dow: {
value: data.marketData?.["^DJI"]?.current ?? 0,
change: data.marketData?.["^DJI"]?.change ?? 0,
},
ndx: {
value: data.marketData?.["^NDX"]?.current ?? 0,
change: data.marketData?.["^NDX"]?.change ?? 0,
},
spx: {
value: data.marketData?.["^GSPC"]?.current ?? 0,
change: data.marketData?.["^GSPC"]?.change ?? 0,
},
rut: {
value: data.marketData?.["^RUT"]?.current ?? 0,
change: data.marketData?.["^RUT"]?.change ?? 0,
},
};

/* ================= FUTURES ================= */

const futures = {
ym: {
value: data.marketData?.["YM=F"]?.current ?? 0,
change: data.marketData?.["YM=F"]?.change ?? 0,
},
nq: {
value: data.marketData?.["NQ=F"]?.current ?? 0,
change: data.marketData?.["NQ=F"]?.change ?? 0,
},
es: {
value: data.marketData?.["ES=F"]?.current ?? 0,
change: data.marketData?.["ES=F"]?.change ?? 0,
},
rty: {
value: data.marketData?.["RTY=F"]?.current ?? 0,
change: data.marketData?.["RTY=F"]?.change ?? 0,
},
};

/* ================= ROTATION ================= */

function toRatio(x: any) {
if (typeof x !== "number" || isNaN(x)) return 1;
return 1 + x; // Backend liefert Dezimal (0.039 = 3.9%)
}

const rsSmall = toRatio(data.rotationDetails?.rsSmall20);
const rsGrowth = toRatio(data.rotationDetails?.rsGrowth20);

/* 🔥 FIX: Equal vs Mega korrekt als Ratio */
const concentrationDivergence = Number(
data.rotationDetails?.concentrationDivergence ?? 0
);

const rsEqual = 1 + (concentrationDivergence / 100);

const rotation = {
rsSmall,
rsGrowth,
rsEqual,
signal: data.rotationSignal ?? "none",
strength: data.rotationStrength ?? 0,
};

/* ================= 🔥 NEW: MARKET DRIVERS INPUT ================= */

const moveIndex = Number(data.moveIndex ?? 0); // 🔥 vorher gefehlt
const vixTermRatio = Number(data.vixTermRatio ?? 1); // 🔥 kritisch
const volOfVolRatio = Number(data.volOfVolRatio ?? 1);
const skewRatio = Number(data.optionsSkewRatio ?? 100);

/* ================= RETURN ================= */

return {
rotation,

/* 🔥 CORE INPUTS */
marketLiquidityScore: Number(data.marketLiquidityScore ?? 0),
gammaExposure: Number(data.gammaExposure ?? 0),
creditRatio: Number(data.creditRatio ?? 0),

/* 🔥 NEW (wichtig für Heat + Crash) */
moveIndex,
vixTermRatio,
volOfVolRatio,
skewRatio,

/* ================= CRASH ================= */

crash: {
score: data.marketStressScore ?? 0,
probability: data.crashProbability ?? 0,
momentum: data.crashMomentum ?? 0,
},

/* ================= BREADTH ================= */

breadth20: data.breadth20 ?? 0,
breadth50: data.breadth50 ?? 0,
breadth200: data.breadth200 ?? 0,

advanceDecline: data.advanceDecline ?? 0,
advances: data.advances ?? 0,
declines: data.declines ?? 0,

newHighs: data.newHighs ?? 0,
newLows: data.newLows ?? 0,

distributionScore: data.distributionScore ?? 0,
concentrationScore: data.rotationDetails?.concentrationScore ?? 0,

correlationScore: data.correlationScore ?? 0,

liquidityVacuumScore: data.liquidityVacuumScore ?? 0,

marketData: data.marketData ?? {},

indices,
futures,
};
}
