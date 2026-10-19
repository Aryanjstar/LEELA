import mongoose from "mongoose";
import { Message } from "../../../../../server/db";
import { apiError } from "../../../../../server/http";
import { authed, json } from "../../../../../server/guard";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That note is not here.");
  const message = await Message.findOne({ _id: id, ownerId: auth.user!._id });
  if (!message?.candidate || message.candidate.status !== "proposed") {
    return apiError(409, "CONFLICT", "CANDIDATE_CLOSED", "That suggestion is already closed.");
  }
  message.candidate.status = "discarded";
  message.markModified("candidate");
  await message.save();
  return json({ message: { id: String(message._id), status: "discarded" } });
}
