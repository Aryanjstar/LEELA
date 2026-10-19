import mongoose from "mongoose";
import { Job } from "../../../../server/db";
import { apiError } from "../../../../server/http";
import { authed, json } from "../../../../server/guard";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed();
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That job is not here.");
  const job = await Job.findOne({ _id: id, ownerId: auth.user!._id });
  if (!job) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That job is not here.");
  return json({
    id: String(job._id),
    type: job.type,
    state: job.state,
    stages: job.stages,
    progress: job.progress,
    error: job.error,
    result: job.result,
  });
}
