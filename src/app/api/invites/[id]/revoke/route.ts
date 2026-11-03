import mongoose from "mongoose";
import { Invite } from "../../../../../server/db";
import { authed, json } from "../../../../../server/guard";
import { apiError } from "../../../../../server/http";
import { appEnv } from "../../../../../config/app";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  if (!appEnv().ownerEmail || auth.user!.email !== appEnv().ownerEmail) return apiError(403, "FORBIDDEN", "OWNER_ONLY", "Only the studio owner can manage invitations.");
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That invitation is not here.");
  const invite = await Invite.findOneAndUpdate({ _id: id, createdBy: auth.user!._id, usedAt: { $exists: false }, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } }, { new: true });
  if (!invite) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That invitation is not here.");
  return json({ id: String(invite._id), revokedAt: invite.revokedAt });
}
