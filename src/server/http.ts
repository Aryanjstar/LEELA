import { NextResponse } from "next/server";

export function apiError(
  status: number,
  code: string,
  reason: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    { error: { code, reason, message, fields: {}, requestId: `req_${crypto.randomUUID().slice(0, 8)}`, details } },
    { status },
  );
}

export function originOk(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const expected = process.env.APP_ORIGIN || "http://localhost:3000";
  // The configured origin is authoritative. Forwarded host headers are client-controlled
  // unless a trusted proxy has explicitly sanitized them.
  return origin === expected;
}
