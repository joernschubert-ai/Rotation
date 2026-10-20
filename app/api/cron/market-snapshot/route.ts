import { NextResponse } from "next/server";
import { GET as getMarketData } from "@/app/api/market/route";

import { mapBackendToEngine } from "@/lib/adapters/mapBackendToEngine";
import { validateEngineData } from "@/lib/engine/validateEngineData";
import { marketEngine } from "@/lib/engine/marketEngine";
import { historyEngine } from "@/lib/history/historyEngine";
import { createMarketSnapshot } from "@/lib/history/snapshotEngine";
import {
  loadMarketHistory,
  saveMarketSnapshot,
} from "@/lib/history/marketHistory";

/* Without a configured secret the endpoint refuses the request. */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Reuse the server-side handler without an HTTP round trip through
    // deployment protection, redirects or a login page. Do not forward secrets.
    const marketResponse = await getMarketData(
      new Request(new URL("/api/market", request.url))
    );

    if (!marketResponse.ok) {
      throw new Error(
        `Market API failed with status ${marketResponse.status}`
      );
    }

    if (!marketResponse.headers.get("content-type")?.includes("application/json")) {
      throw new Error("Market handler returned a non-JSON response");
    }
    const marketData = await marketResponse.json();
    const mapped = mapBackendToEngine(marketData);
    if (!mapped) {
      throw new Error("mapBackendToEngine returned null");
    }
    if (!validateEngineData(mapped)) {
      throw new Error("Engine data validation failed");
    }

    const history = await loadMarketHistory();

    // Match the live market universe, even before its first snapshot exists.
    const historyMetrics = historyEngine(history, {
      universeVersion: mapped.breadthDataQuality?.universeVersion ?? null,
    });

    const mappedWithHistory = { ...mapped, historyMetrics };
    const engine = marketEngine(mappedWithHistory);
    const snapshot = createMarketSnapshot({
      map: mappedWithHistory,
      engine,
    });

    await saveMarketSnapshot(snapshot);

    return NextResponse.json({
      ok: true,
      timestamp: snapshot.timestamp,
      phase: snapshot.phase,
      masterScore: snapshot.master?.score ?? null,
      masterSignal:
        snapshot.master?.signal ?? snapshot.master?.meta?.signal ?? null,
      historyLength: history.length + 1,
    });
  } catch (error) {
    console.error("Cron Market Snapshot Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
