import { Connection } from "../../../server/db";
import { apiError } from "../../../server/http";
import { authed, json } from "../../../server/guard";

export async function GET() {
  const auth = await authed();
  if ("error" in auth && auth.error) return auth.error;
  const items = await Connection.find({ ownerId: auth.user!._id });
  return json({
    items: items.map((item) => ({ id: String(item._id), provider: item.provider, status: item.status, label: item.label })),
    youtube: Boolean(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
    instagram: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
  });
}

export async function POST(request: Request) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const body = (await request.json().catch(() => null)) as { provider?: string } | null;
  if (body?.provider === "youtube") {
    if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
      return apiError(422, "VALIDATION", "NOT_CONFIGURED", "YouTube needs YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET on the server before anyone can connect.");
    }
  }
  if (body?.provider === "instagram") {
    if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
      return apiError(422, "VALIDATION", "NOT_CONFIGURED", "Instagram needs a Meta app id and secret before anyone can connect.");
    }
  }
  if (body?.provider !== "youtube" && body?.provider !== "instagram") {
    return apiError(400, "VALIDATION", "VALIDATION", "Choose YouTube or Instagram.");
  }
  return apiError(422, "VALIDATION", "NOT_CONFIGURED", "The OAuth redirect is not switched on yet.");
}
