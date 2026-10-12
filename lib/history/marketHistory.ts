import { Redis } from "@upstash/redis";
import type { Redis as RedisType } from "@upstash/redis";

let redis: RedisType | undefined;

try {
  redis = Redis.fromEnv();
} catch {
  console.warn("Redis not available");
}

const KEY = "marketHistory";
const MAX_ITEMS = 120;
const MAX_RETRIES = 5;

/* =====================================================
DAY GROUPING

One observation per New York calendar day.
This does not guarantee trading days or closing prices.
===================================================== */

const sessionDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

/* =====================================================
LEGACY FORMAT SUPPORT
===================================================== */

function decodeHistory(value: unknown): any[] {
  let decoded = value;

  for (
    let i = 0;
    i < 2 && typeof decoded === "string";
    i++
  ) {
    decoded = JSON.parse(decoded);
  }

  if (
    decoded === null ||
    decoded === undefined
  ) {
    return [];
  }

  if (!Array.isArray(decoded)) {
    throw new Error("Invalid market history format");
  }

  return decoded;
}

/* =====================================================
TIMESTAMP VALIDATION
===================================================== */

function timestampOf(snapshot: any): number | null {
  if (
    !snapshot ||
    typeof snapshot !== "object" ||
    Array.isArray(snapshot) ||
    typeof snapshot.timestamp !== "string"
  ) {
    return null;
  }

  /*
   * Require an explicit timezone.
   * Server timezone must not change chronological order.
   */
  if (
    !/(Z|[+-]\d{2}:\d{2})$/i.test(
      snapshot.timestamp
    )
  ) {
    return null;
  }

  const timestamp = Date.parse(snapshot.timestamp);

  return Number.isFinite(timestamp)
    ? timestamp
    : null;
}

/* =====================================================
NORMALIZE

Newest first.
Keep the newest snapshot per calendar day.
Ignore invalid historical entries.
===================================================== */

function normalizeHistory(history: any[]): any[] {
  const sorted = history
    .map(snapshot => ({
      snapshot,
      timestamp: timestampOf(snapshot)
    }))
    .filter(
      (
        item
      ): item is {
        snapshot: any;
        timestamp: number;
      } => item.timestamp !== null
    )
    .sort(
      (a, b) => b.timestamp - a.timestamp
    );

  const days = new Set<string>();
  const result: any[] = [];

  for (const item of sorted) {
    const day = sessionDate.format(
      new Date(item.timestamp)
    );

    if (days.has(day)) {
      continue;
    }

    days.add(day);
    result.push(item.snapshot);

    if (result.length === MAX_ITEMS) {
      break;
    }
  }

  return result;
}

/* =====================================================
ATOMIC SAVE

Compare the current data with the previously read data.
A concurrent modification causes a retry.

Decode legacy JSON strings before comparison.
No write occurs when the comparison fails.
===================================================== */

const SAVE_SCRIPT = `
local function decode(value)
  for i = 1, 2 do
    if type(value) ~= 'string' then break end
    value = cjson.decode(value)
  end
  return value
end

local function equal(a, b)
  if type(a) ~= type(b) then return false end
  if type(a) ~= 'table' then return a == b end

  for k, v in pairs(a) do
    if not equal(v, b[k]) then return false end
  end

  for k, _ in pairs(b) do
    if a[k] == nil then return false end
  end

  return true
end

local raw = redis.call('GET', KEYS[1])
local expected = cjson.decode(ARGV[1])

if not raw then
  if expected ~= cjson.null then return 0 end
elseif not equal(decode(raw), decode(expected)) then
  return 0
end

redis.call('SET', KEYS[1], ARGV[2])
return 1
`;

/* =====================================================
LOAD
===================================================== */

export async function loadMarketHistory(): Promise<any[]> {
  if (
    process.env.NODE_ENV === "development" ||
    !redis
  ) {
    return [];
  }

  try {
    const data = await redis.get(KEY);

    return normalizeHistory(
      decodeHistory(data)
    );
  } catch (error) {
    console.error(
      "Load Market History Error:",
      error
    );

    return [];
  }
}

/* =====================================================
SAVE
===================================================== */

export async function saveMarketSnapshot(
  snapshot: any
): Promise<void> {
  if (
    process.env.NODE_ENV === "development"
  ) {
    return;
  }

  if (!redis) {
    throw new Error(
      "Redis not available for snapshot save"
    );
  }

  if (timestampOf(snapshot) === null) {
    throw new Error(
      "Snapshot requires a valid timestamp with timezone"
    );
  }

  /*
   * Validate serialization before writing.
   * Preserve all serializable snapshot fields.
   */
  const serializableSnapshot = JSON.parse(
    JSON.stringify(snapshot)
  );

  if (
    timestampOf(serializableSnapshot) === null
  ) {
    throw new Error(
      "Invalid serialized snapshot timestamp"
    );
  }

  try {
    for (
      let attempt = 0;
      attempt < MAX_RETRIES;
      attempt++
    ) {
      const current = await redis.get(KEY);

      const history = normalizeHistory([
        serializableSnapshot,
        ...decodeHistory(current)
      ]);

      const saved = await redis.eval(
        SAVE_SCRIPT,
        [KEY],
        [
          JSON.stringify(current ?? null),
          JSON.stringify(history)
        ]
      );

      if (Number(saved) === 1) {
        return;
      }
    }

    throw new Error(
      "Concurrent snapshot saves exceeded retry limit"
    );
  } catch (error) {
    console.error(
      "Save Market Snapshot Error:",
      error
    );

    throw error;
  }
}