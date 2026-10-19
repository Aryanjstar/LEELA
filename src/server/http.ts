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
  if (origin === expected) return true;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}
