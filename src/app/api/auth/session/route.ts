import { NextResponse } from "next/server";
import { connectDb } from "../../../../server/db";
import { apiError } from "../../../../server/http";
import { currentUser } from "../../../../server/session";

export async function GET() {
  try {
    await connectDb();
  } catch {
    return apiError(503, "UNAVAILABLE", "DB_DOWN", "The studio database is not reachable.");
  }
  const user = await currentUser();
  if (!user) return apiError(401, "UNAUTHENTICATED", "NO_SESSION", "Sign in to open the studio.");
  return NextResponse.json({
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      isOwner: user.email === (process.env.OWNER_EMAIL || "").toLowerCase(),
      prefs: user.prefs,
    },
  });
}
