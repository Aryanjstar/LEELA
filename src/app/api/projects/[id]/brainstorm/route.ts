import { apiError } from "../../../../../server/http";
import { authed, busy, json } from "../../../../../server/guard";
import { ownProject, startJob } from "../../../../../server/studio";

export const maxDuration = 60;

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  const project = await ownProject(auth.user!._id, id);
  if (!project) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  try {
    const job = await startJob({
      ownerId: auth.user!._id,
      projectId: project._id,
      type: "brainstorm",
      input: {},
      stages: [{ name: "brainstorm", state: "running" }],
    });
    return json({ jobId: String(job?._id), result: job?.result }, 202);
  } catch (error) {
    return busy(error) ?? apiError(500, "FAILED", "FAILED", "Could not brainstorm.");
  }
}
