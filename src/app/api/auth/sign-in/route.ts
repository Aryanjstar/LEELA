import { NextResponse } from "next/server";
import { connectDb, User } from "../../../../server/db";
import { apiError, originOk } from "../../../../server/http";
import { checkPassword, openSession } from "../../../../server/session";

export async function POST(request: Request) {
  if (!originOk(request)) return apiError(403, "FORBIDDEN", "ORIGIN", "This request came from the wrong site.");
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  if (!email || !password) return apiError(400, "VALIDATION", "UNKNOWN_FIELD", "Email and password are required.");
  try {
    await connectDb();
    const user = await User.findOne({ email }).maxTimeMS(8_000);
    const hash = user?.passwordHash || "$2a$12$C6UzMDM.H6dfI/f/IKcEe.1P0n0c0c0c0c0c0c0c0c0c0c0c0c0c0";
    const ok = user ? await checkPassword(password, user.passwordHash) : await checkPassword(password, hash).catch(() => false);
    if (!user || !ok) {
      return apiError(401, "UNAUTHENTICATED", "INVALID_CREDENTIALS", "That email or password is not right.");
    }
    await openSession(user._id, request.headers.get("user-agent"));
    return NextResponse.json({
      user: { id: String(user._id), email: user.email, name: user.name, isOwner: user.email === (process.env.OWNER_EMAIL || "").toLowerCase() },
    });
  } catch {
    return apiError(503, "UNAVAILABLE", "DB_DOWN", "The studio database is not reachable.");
  }
}
