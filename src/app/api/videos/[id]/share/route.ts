import mongoose from "mongoose";
import { ShareLink, Video } from "../../../../../server/db";
import { apiError } from "../../../../../server/http";
import { authed, json } from "../../../../../server/guard";
import { newShareToken } from "../../../../../server/studio";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That video is not here.");
  const video = await Video.findOne({ _id: id, ownerId: auth.user!._id, state: "ready" });
  if (!video) return apiError(422, "VALIDATION", "NOT_SHAREABLE", "That video is not ready to share.");
  const existing = await ShareLink.findOne({ videoId: video._id, ownerId: auth.user!._id, revokedAt: { $exists: false } });
  const origin = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (existing) return json({ url: `${origin}/v/${existing.token}`, allowDownload: existing.allowDownload });
  const body = (await request.json().catch(() => ({}))) as { allowDownload?: boolean };
  const link = await ShareLink.create({
    ownerId: auth.user!._id,
    projectId: video.projectId,
    videoId: video._id,
    token: newShareToken(),
    allowDownload: Boolean(body.allowDownload),
  });
  return json({ url: `${origin}/v/${link.token}`, allowDownload: link.allowDownload }, 201);
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That video is not here.");
  await ShareLink.updateMany({ videoId: id, ownerId: auth.user!._id, revokedAt: { $exists: false } }, { revokedAt: new Date() });
  return new Response(null, { status: 204 });
}
