import mongoose from "mongoose";
import { ShareLink, Video } from "../../../../../server/db";
import { apiError } from "../../../../../server/http";
import { authed, json } from "../../../../../server/guard";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That video is not here.");
  const video = await Video.findOne({ _id: id, ownerId: auth.user!._id });
  if (!video) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That video is not here.");
  return apiError(422, "VALIDATION", "NOT_SHAREABLE", "Sharing will be available after a verified video export is ready.");
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That video is not here.");
  await ShareLink.updateMany({ videoId: id, ownerId: auth.user!._id, revokedAt: { $exists: false } }, { revokedAt: new Date() });
  return new Response(null, { status: 204 });
}
