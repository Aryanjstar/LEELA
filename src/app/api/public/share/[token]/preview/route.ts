import { connectDb, ShareLink, Video } from "../../../../../../server/db";
import { apiError } from "../../../../../../server/http";

export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    await connectDb();
  } catch {
    return apiError(503, "UNAVAILABLE", "DB_DOWN", "The studio database is not reachable.");
  }
  const { token } = await ctx.params;
  const link = await ShareLink.findOne({ token, revokedAt: { $exists: false } });
  const video = link ? await Video.findOne({ _id: link.videoId, state: "ready" }) : null;
  if (!video?.previewHtml) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That video is not available.");
  return new Response(video.previewHtml, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; media-src data:; frame-ancestors 'self'",
      "x-content-type-options": "nosniff",
    },
  });
}
