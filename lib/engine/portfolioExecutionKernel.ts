// /lib/engine/portfolioExecutionKernel.ts

export function portfolioExecutionKernel({
nasdaq,
russell
}: any) {

/* ================= INPUT ================= */

const nqBias = nasdaq?.bias ?? "NEUTRAL";
const nqStrength = Number(nasdaq?.strength ?? 0);

const rtBias = russell?.bias ?? "NEUTRAL";
const rtStrength = Number(russell?.strength ?? 0);

/* ================= FINAL EXPOSURE ================= */

let nasdaqExposure = 0;
let russellExposure = 0;

/* ================= MAP ================= */

if (nqBias === "SHORT") nasdaqExposure = -1;
if (nqBias === "NEUTRAL") nasdaqExposure = 0;
if (nqBias === "LONG") nasdaqExposure = 1;

if (rtBias === "SHORT") russellExposure = -1;
if (rtBias === "NEUTRAL") russellExposure = 0;
if (rtBias === "LONG") russellExposure = 1;

/* ================= COMBINATION LOGIC ================= */

const netExposure = nasdaqExposure + russellExposure;

let portfolioBias = "NEUTRAL";

if (netExposure <= -1) portfolioBias = "DEFENSIVE";
if (netExposure === 0) portfolioBias = "NEUTRAL";
if (netExposure >= 1) portfolioBias = "RISK_ON";

/* ================= FINAL OUTPUT ================= */

return {

portfolioBias,
netExposure,

legs: {
nasdaq: {
bias: nqBias,
strength: nqStrength,
exposure: nasdaqExposure
},
russell: {
bias: rtBias,
strength: rtStrength,
exposure: russellExposure
}
},

summary:
`${portfolioBias} | NQ:${nqBias} | RT:${rtBias}`
};
}
