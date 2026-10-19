import { apiError } from "../../../../../server/http";
import { Draft, Storyboard } from "../../../../../server/db";
import { authed, busy, json } from "../../../../../server/guard";
import { hashPlan, ownProject, startJob } from "../../../../../server/studio";
import { validatePlan } from "../../../../../contracts/plan";

export const maxDuration = 60;

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  const project = await ownProject(auth.user!._id, id);
  if (!project) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  const body = (await request.json().catch(() => null)) as { draftRevision?: number; planHash?: string } | null;
  const draft = await Draft.findOne({ projectId: project._id, ownerId: auth.user!._id });
  if (!draft) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  if (draft.revision !== body?.draftRevision) {
    return apiError(409, "CONFLICT", "REVISION_CONFLICT", "This draft changed. Reload it.", { currentRevision: draft.revision });
  }
  const checked = validatePlan(draft.plan);
  if (!checked.plan) return apiError(422, "VALIDATION", "PLAN_INVALID", "The storyboard is not valid yet.");
  const hash = hashPlan(checked.plan);
  if (hash !== body?.planHash) return apiError(409, "CONFLICT", "PLAN_STALE", "The storyboard changed. Approve the latest one.");
  const version = (await Storyboard.countDocuments({ projectId: project._id })) + 1;
  const storyboard = await Storyboard.create({
    ownerId: auth.user!._id,
    projectId: project._id,
    version,
    schemaVersion: 1,
    plan: checked.plan,
    planHash: hash,
    storyHash: hashPlan(checked.plan.scenes.map((scene) => scene.lines.map((line) => line.spoken ?? line.text))),
    traceId: draft.traceId,
    origin: "approve",
    approvedAt: new Date(),
  });
  project.badge = "rendering";
  await project.save();
  try {
    const job = await startJob({
      ownerId: auth.user!._id,
      projectId: project._id,
      type: "render",
      input: { storyboardId: storyboard._id, draftRevision: draft.revision },
      stages: [
        { name: "narrate", state: "done" },
        { name: "compile", state: "done" },
        { name: "render", state: "done" },
      ],
    });
    return json({ jobId: String(job?._id), storyboardId: String(storyboard._id), videoId: job?.result?.videoId ? String(job.result.videoId) : undefined }, 202);
  } catch (error) {
    return busy(error) ?? apiError(500, "FAILED", "FAILED", error instanceof Error ? error.message : "The render failed.");
  }
}
