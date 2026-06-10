import { NextResponse } from "next/server";
import { saveSignal, loadSignals } from "@/lib/signal/signalHistory";

/* ================= CONFIG ================= */

const COOLDOWN_MS = 5 * 60 * 1000; // 5 Minuten
const MIN_STRENGTH_DELTA = 10;

/* ================= NORMALIZE ================= */

function normalizeSignal(signal: any) {
return {
type: signal?.type ?? "NONE",
strength: Number(signal?.strength ?? 0),
message: signal?.message ?? "",
priority: signal?.priority ?? "LOW",
phase: signal?.phase ?? "UNKNOWN",
timestamp: signal?.timestamp ?? Date.now()
};
}

/* ================= DEDUP CHECK ================= */

function shouldSave(newSignal: any, lastSignal: any) {

if (!lastSignal) return true;

/* TYPE CHANGE → immer speichern */
if (newSignal.type !== lastSignal.type) return true;

/* STRENGTH CHANGE */
const strengthDiff = Math.abs(newSignal.strength - lastSignal.strength);
if (strengthDiff >= MIN_STRENGTH_DELTA) return true;

/* COOLDOWN */
const timeDiff = newSignal.timestamp - (lastSignal.timestamp ?? 0);
if (timeDiff > COOLDOWN_MS) return true;

/* sonst ignorieren */
return false;
}

/* ================= POST (SAVE) ================= */

export async function POST(req: Request) {
try {
const body = await req.json();

if (!body?.signal) {
return NextResponse.json({ ok: false, error: "No signal provided" });
}

const normalized = normalizeSignal(body.signal);

/* HISTORY LADEN */
const history = await loadSignals();
const lastSignal = history?.[0];

/* DEDUP */
const save = shouldSave(normalized, lastSignal);

if (!save) {
return NextResponse.json({
ok: true,
skipped: true
});
}

/* SPEICHERN */
await saveSignal(normalized);

return NextResponse.json({
ok: true,
saved: true
});

} catch (e) {
console.error("Signal POST error:", e);
return NextResponse.json({ ok: false });
}
}

/* ================= GET (LOAD) ================= */

export async function GET() {
try {
const history = await loadSignals();

/* Safety Normalize (alte Daten absichern) */
const safe = (history || []).map((s: any) => normalizeSignal(s));

return NextResponse.json(safe);

} catch (e) {
console.error("Signal GET error:", e);
return NextResponse.json([]);
}
}
