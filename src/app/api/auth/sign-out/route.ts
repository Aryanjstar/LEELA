import { NextResponse } from "next/server";
import { connectDb } from "../../../../server/db";
import { originOk } from "../../../../server/http";
import { clearSession } from "../../../../server/session";

export async function POST(request: Request) {
  if (!originOk(request)) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Wrong origin." } }, { status: 403 });
  try {
    await connectDb();
    await clearSession();
  } catch {
    /* still clear the cookie */
    await clearSession().catch(() => undefined);
  }
  return new NextResponse(null, { status: 204 });
}
