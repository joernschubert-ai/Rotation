import { Redis } from "@upstash/redis";
import type { Redis as RedisType } from "@upstash/redis";

let redis: RedisType | undefined;

try {
redis = Redis.fromEnv();
} catch (e) {
console.log("Redis not available");
}

const KEY = "signalHistory";
const MAX_ITEMS = 50;

/* ================= SAVE ================= */

export async function saveSignal(signal: any) {
if (!redis) return;

const entry = {
type: signal.type,
strength: signal.strength,
message: signal.message,
priority: signal.priority,
phase: signal.phase,
timestamp: Date.now()
};

try {
const existing = await redis.get(KEY);

let history: any[] = [];

if (typeof existing === "string") {
history = JSON.parse(existing);
}

history.unshift(entry);
history = history.slice(0, MAX_ITEMS);

console.log("SAVE SIGNAL:", signal);
console.log("CURRENT HISTORY:", history.length);

await redis.set(KEY, JSON.stringify(history));

console.log("SIGNAL SAVED");

} catch (e) {
console.error("Save Signal Error:", e);
}
}

console.log("SIGNAL SAVED");

/* ================= LOAD ================= */

export async function loadSignals() {
if (!redis) return [];

try {
const data = await redis.get(KEY);

console.log("RAW SIGNAL DATA:", data);

if (typeof data === "string") {
return JSON.parse(data);
}

if (Array.isArray(data)) {
return data;
}

console.log(
"RAW SIGNAL DATA:",
data,
typeof data,
Array.isArray(data)
);

return [];
} catch (e) {
console.error("Load Signals Error:", e);
return [];
}
}
