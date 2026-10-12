import { NextResponse } from "next/server";

import {
  saveMarketSnapshot,
  loadMarketHistory
} from "@/lib/history/marketHistory";

/* =====================================================
SAVE SNAPSHOT
===================================================== */

export async function POST(req: Request) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid JSON"
      },
      { status: 400 }
    );
  }

  const snapshot = body?.snapshot;

  if (
    !snapshot ||
    typeof snapshot !== "object" ||
    Array.isArray(snapshot)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing or invalid snapshot"
      },
      { status: 400 }
    );
  }

  const timestamp = snapshot.timestamp;

  if (
    typeof timestamp !== "string" ||
    !/(Z|[+-]\d{2}:\d{2})$/i.test(timestamp) ||
    !Number.isFinite(Date.parse(timestamp))
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Snapshot requires a valid timestamp with timezone"
      },
      { status: 400 }
    );
  }

  try {
    await saveMarketSnapshot(snapshot);

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    console.error(
      "History POST error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Snapshot save failed"
      },
      { status: 500 }
    );
  }
}

/* =====================================================
LOAD HISTORY
===================================================== */

export async function GET() {
  const history = await loadMarketHistory();

  return NextResponse.json(history);
}