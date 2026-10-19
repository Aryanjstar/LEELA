import { connectDb, ShareLink, Storyboard, Video } from "../../../../../server/db";
import { apiError } from "../../../../../server/http";
import { json } from "../../../../../server/guard";

export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    await connectDb();
  } catch {
    return apiError(503, "UNAVAILABLE", "DB_DOWN", "The studio database is not reachable.");
  }
  const { token } = await ctx.params;
  const link = await ShareLink.findOne({ token, revokedAt: { $exists: false } });
  if (!link) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That video is not available.");
  const video = await Video.findOne({ _id: link.videoId, state: "ready" });
  const storyboard = video ? await Storyboard.findById(video.storyboardId) : null;
  if (!video || !storyboard) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That video is not available.");
  link.views += 1;
  await link.save();
  return json({
    title: storyboard.plan?.title || "Leela",
    format: video.format,
    durationMs: video.durationMs ?? 0,
    videoUrl: `/api/public/share/${token}/preview`,
    allowDownload: link.allowDownload,
  });
}
