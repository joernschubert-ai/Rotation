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

if (typeof data === "string") {
history = JSON.parse(data);
}

history.unshift(snapshot);

history = history.slice(0, MAX_ITEMS);

await redis.set(
KEY,
JSON.stringify(history)
);

} catch (e) {
console.error(
"Save Market Snapshot Error:",
e
);
}
}
