import { apiError } from "../../../../../server/http";
import { authed, busy, json } from "../../../../../server/guard";
import { Draft } from "../../../../../server/db";
import { ownProject, startJob } from "../../../../../server/studio";

export const maxDuration = 60;

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  const project = await ownProject(auth.user!._id, id);
  if (!project) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  const draft = await Draft.findOne({ projectId: project._id, ownerId: auth.user!._id });
  if (!draft?.idea?.topic?.trim()) return apiError(400, "VALIDATION", "VALIDATION", "Write a topic before planning.");
  if (project.mode === "code_lab" && !draft.traceId) {
    return apiError(400, "VALIDATION", "VALIDATION", "Trace the code before planning a Code Lab film.");
  }
  try {
    const job = await startJob({
      ownerId: auth.user!._id,
      projectId: project._id,
      type: "plan",
      input: { draftRevision: draft.revision },
      stages: [{ name: "plan", state: "running" }],
    });
    return json({ jobId: String(job?._id) }, 202);
  } catch (error) {
    return busy(error) ?? apiError(500, "FAILED", "FAILED", error instanceof Error ? error.message : "The plan failed.");
  }
}
