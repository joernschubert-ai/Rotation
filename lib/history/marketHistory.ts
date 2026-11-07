import { Redis } from "@upstash/redis";
import type { Redis as RedisType } from "@upstash/redis";

let redis: RedisType | undefined;

try {
  redis = Redis.fromEnv({ automaticDeserialization: false });
} catch {
  console.warn("Redis not available");
}

const KEY = "marketHistory";
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

    // Keep the daily archive. Consumers select their own bounded windows.
  }

  return result;
}

/* =====================================================
ATOMIC SAVE

Compare the current data with the previously read data.
A concurrent modification causes a retry.

Compare exact stored bytes, without decoding the archive inside Redis.
Legacy JSON decoding and daily normalization remain in the application.
No write occurs when the comparison fails.
===================================================== */

const SAVE_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if ARGV[3] == 'missing' then
  if raw then return 0 end
elseif not raw or raw ~= ARGV[1] then
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
    process.env.NODE_ENV === "development"
  ) {
    return [];
  }
  if (!redis) throw new Error("Redis not available for history load");

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

    throw error;
  }
}

/* =====================================================
SAVE
===================================================== */

export async function saveMarketSnapshot(
  snapshot: any
): Promise<void> {
  if(snapshot?.volatilityDataQuality?.entryBlocked===true) throw new Error("Context-only volatility frame is not a regular market snapshot");
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
      const current = await redis.get<string>(KEY);
      if (current !== null && typeof current !== "string") {
        throw new Error("History raw read did not return stored text");
      }

      const history = normalizeHistory([
        serializableSnapshot,
        ...decodeHistory(current)
      ]);

      const saved = await redis.eval(
        SAVE_SCRIPT,
        [KEY],
        [
          current ?? "",
          JSON.stringify(history),
          current === null ? "missing" : "present"
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
