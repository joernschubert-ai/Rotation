import {beginCronAudit,finishCronAudit} from '@/lib/aiResearch/aiResearchCronAudit';
import {maintainResearchMemory} from '@/lib/aiResearch/aiResearchMemoryService';
export const maxDuration=60;
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
  const requestStartedAt=Date.now();
  let cronAudit:Awaited<ReturnType<typeof beginCronAudit>>|null=null;
  let stage='AUTHORIZATION';
  let snapshotSaved=false;
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    cronAudit=await beginCronAudit(requestStartedAt);
    stage='MARKET_REQUEST';
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
    stage='MARKET_DECODE_AND_VALIDATE';
    const marketData = await marketResponse.json();
    const mapped = mapBackendToEngine(marketData);
    if (!mapped) {
      throw new Error("mapBackendToEngine returned null");
    }
    if (!validateEngineData(mapped)) {
      throw new Error("Engine data validation failed");
    }

    stage='HISTORY_AND_ENGINE';
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

    stage='SNAPSHOT_SAVE';
    await saveMarketSnapshot(snapshot);
    snapshotSaved=true;
    stage='MEMORY_MAINTENANCE';
    // Auxiliary outcome collection is independent of the already committed market snapshot.
    let researchMemory:unknown={ok:false,modelRequestsUsed:0,message:"Gedächtnisauswertung wegen Zeitbudget verschoben."};
    let maintenanceStatus='SKIPPED_TIME_BUDGET';
    if(Date.now()-requestStartedAt<42000)try{researchMemory=await maintainResearchMemory();maintenanceStatus=(researchMemory as {ok?:boolean})?.ok===true?'RETURNED_OK':'RETURNED_NOT_OK';}catch{maintenanceStatus='THREW';researchMemory={ok:false,modelRequestsUsed:0,message:"Gedächtnisauswertung nicht verfügbar; Snapshot bleibt gespeichert."};}
    const cronDiagnostic=await finishCronAudit(cronAudit,{status:'COMPLETED',stage:'FINISHED',snapshotSaved,snapshotTimestamp:snapshot.timestamp,maintenanceStatus,researchMemory});

    return NextResponse.json({
      ok: true,
      timestamp: snapshot.timestamp,
      phase: snapshot.phase,
      masterScore: snapshot.master?.score ?? null,
      masterSignal:
        snapshot.master?.signal ?? snapshot.master?.meta?.signal ?? null,
      historyLength: history.length + 1,
      researchMemory,
      cronDiagnostic,
    });
  } catch (error) {
    const cronDiagnostic=await finishCronAudit(cronAudit,{status:'FAILED',stage,snapshotSaved,maintenanceStatus:'NOT_REACHED',errorCode:'CRON_STEP_FAILED'});
    console.error("Cron Market Snapshot Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        cronDiagnostic,
      },
      { status: 500 }
    );
  }
}
