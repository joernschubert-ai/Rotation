import { NextResponse } from "next/server";
import { runAIResearchFromHistory } from "@/lib/aiResearch/aiResearchRunner";
import { researchAuthorized } from "@/lib/aiResearch/aiResearchSession";
import type { AIResearchTask } from "@/lib/aiResearch/aiResearchTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const tasks: AIResearchTask[] = ["DAILY_MARKET_REVIEW", "REGIME_REVIEW", "ROTATION_REVIEW", "CRASH_RISK_REVIEW", "TRADE_SETUP_REVIEW", "ANOMALY_REVIEW", "FORWARD_TEST_REVIEW"];

async function handle(request: Request, generate: boolean) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!researchAuthorized(request)) return NextResponse.json({ ok: false, error: "Bitte einmal abmelden und erneut anmelden; die Research-Sitzung fehlt oder ist abgelaufen." }, { status: 401, headers });
  if (generate && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ ok: false, error: "Ungültiger Anfrageursprung" }, { status: 403, headers });
  try {
    const url = new URL(request.url);
    const parameter = url.searchParams.get("task") as AIResearchTask;
    const task = tasks.includes(parameter) ? parameter : "DAILY_MARKET_REVIEW";
    const question = url.searchParams.get("question")?.slice(0, 500);
    const result = await runAIResearchFromHistory({ task, question, allowAIGeneration: generate });
    return NextResponse.json({ ok: result.status === "SUCCESS", ...result }, { headers });
  } catch { return NextResponse.json({ ok: false, error: "Research derzeit nicht verfügbar" }, { status: 500, headers }); }
}
// GET reads an exact-frame cache, never starts a paid/free model request.
export async function GET(request: Request) { return handle(request, false); }
export async function POST(request: Request) { return handle(request, true); }
