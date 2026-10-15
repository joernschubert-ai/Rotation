import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const RESEARCH_COOKIE = "rotation_session";
export const SESSION_SECONDS = 12 * 60 * 60;
const sign = (value: string, secret: string) => createHmac("sha256", secret).update(`rotation-session-v1:${value}`).digest("hex");

export function createResearchSession(): string {
  const secret = process.env.APP_PASSWORD?.trim();
  if (!secret) throw new Error("Login is not configured");
  const payload = `${Date.now() + SESSION_SECONDS * 1000}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function researchAuthorized(request: Request): boolean {
  const secret = process.env.APP_PASSWORD?.trim();
  if (!secret) return false;
  const token = (request.headers.get("cookie") ?? "").split(";").map(part => part.trim())
    .find(part => part.startsWith(`${RESEARCH_COOKIE}=`))?.slice(RESEARCH_COOKIE.length + 1);
  if (!token || !/^\d{13}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expiry, nonce, signature] = token.split(".");
  const remaining = Number(expiry) - Date.now();
  if (remaining <= 0 || remaining > SESSION_SECONDS * 1000) return false;
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(sign(`${expiry}.${nonce}`, secret), "hex"));
}
