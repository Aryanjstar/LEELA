import mongoose from "mongoose";
import { validatePlan } from "../../../../../contracts/plan";
import { Draft, Message } from "../../../../../server/db";
import { apiError } from "../../../../../server/http";
import { authed, json } from "../../../../../server/guard";
import { hashPlan } from "../../../../../server/studio";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That note is not here.");
  const message = await Message.findOne({ _id: id, ownerId: auth.user!._id, role: "assistant" });
  if (!message?.candidate || message.candidate.status !== "proposed") {
    return apiError(409, "CONFLICT", "CANDIDATE_CLOSED", "That suggestion is already closed.");
  }
  const body = (await request.json().catch(() => null)) as { expectedRevision?: number } | null;
  const draft = await Draft.findOne({ projectId: message.projectId, ownerId: auth.user!._id });
  if (!draft) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  if (draft.revision !== body?.expectedRevision) {
    return apiError(409, "CONFLICT", "REVISION_CONFLICT", "This draft changed. Reload it.", { currentRevision: draft.revision });
  }
  const checked = validatePlan(message.candidate.plan);
  if (!checked.plan) return apiError(422, "VALIDATION", "PLAN_INVALID", "That suggestion is not valid.");
  draft.plan = checked.plan;
  draft.planValid = true;
  draft.planHash = hashPlan(checked.plan);
  draft.revision += 1;
  draft.markModified("plan");
  await draft.save();
  message.candidate.status = "kept";
  message.markModified("candidate");
  await message.save();
  return json({ draft: { revision: draft.revision, planValid: true, planHash: draft.planHash } });
}
