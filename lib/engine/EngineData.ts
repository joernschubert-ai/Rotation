export type EngineData = {

/* ================= ROTATION ================= */

rotation: {
rsSmall: number;
rsGrowth: number;
rsEqual: number;
signal?: string;
strength?: number;
};

/* ================= CORE ================= */

crash: {
score: number;
probability: number;
momentum: number;
};

/* ================= BREADTH ================= */

breadth20: number;
breadth50: number;
breadth200: number;

/* ================= STRUCTURE ================= */

advanceDecline: number;
advances: number;
declines: number;

newHighs: number;
newLows: number;

distributionScore: number;
concentrationScore: number;

/* ================= DRIVERS ================= */

marketLiquidityScore: number;
gammaExposure: number;
creditRatio: number;
correlationScore: number;

liquidityVacuumScore: number;

/* ================= MARKET DATA ================= */

marketData: any;

/* ================= UI ================= */

indices: any;
futures: any;

};
