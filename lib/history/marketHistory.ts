import { Redis } from "@upstash/redis";
import type { Redis as RedisType } from "@upstash/redis";

let redis: RedisType | undefined;

try {
redis = Redis.fromEnv();
} catch {
console.log("Redis not available");
}

const KEY = "marketHistory";
const MAX_ITEMS = 120;

/* =====================================================
LOAD
===================================================== */

export async function loadMarketHistory() {
if (!redis) return [];

try {
const data = await redis.get(KEY);

console.log("RAW MARKET DATA:", data);

if (Array.isArray(data)) {

console.log(
"FIRST SNAPSHOT CHECK",
{
phase: (data as any[])?.[0]?.phase,

hasRotationDecay:
!!(data as any[])?.[0]?.rotationDecay,

hasRegimeSync:
!!(data as any[])?.[0]?.regimeSync,

hasExecutionState:
!!(data as any[])?.[0]?.executionState,

hasLiquidity:
!!(data as any[])?.[0]?.liquidity
}
);

return data;
}

if (typeof data === "string") {
return JSON.parse(data);
}

return [];
} catch (e) {
console.error("Load Market History Error:", e);
return [];
}
}



/* =====================================================
SAVE
===================================================== */

export async function saveMarketSnapshot(
snapshot: any
) {
if (!redis) return;

try {
const data = await redis.get(KEY);

let history: any[] = [];

if (Array.isArray(data)) {
history = data;
}

history.unshift(snapshot);

history = history.slice(0, MAX_ITEMS);

console.log(
"HISTORY LENGTH:",
history.length
);

console.log(
"LATEST SNAPSHOT:",
history[0]?.timestamp
);


await redis.set(KEY, history);

} catch (e) {
console.error(
"Save Market Snapshot Error:",
e
);
}
}
