import { NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "node:crypto";
import { createResearchSession, RESEARCH_COOKIE, SESSION_SECONDS } from "@/lib/aiResearch/aiResearchSession";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ success: false }, { status: 403 });
    const configured = process.env.APP_PASSWORD?.trim();
    if (!configured) return NextResponse.json({ success: false, error: "Login nicht konfiguriert" }, { status: 500 });
    const body = await request.json();
    const supplied = typeof body.password === "string" ? body.password.trim() : "";
    const digest = (value: string) => createHash("sha256").update(value).digest();
    if (!supplied || !timingSafeEqual(digest(supplied), digest(configured))) return NextResponse.json({ success: false }, { status: 401 });
    const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(RESEARCH_COOKIE, createResearchSession(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_SECONDS });
    return response;
  } catch { return NextResponse.json({ success: false }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ success: false }, { status: 403 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(RESEARCH_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
