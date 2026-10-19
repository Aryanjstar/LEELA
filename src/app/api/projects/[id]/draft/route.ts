import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { validatePlan } from "../../../../../contracts/plan";
import { connectDb, Draft, Project } from "../../../../../server/db";
import { apiError, originOk } from "../../../../../server/http";
import { currentUser } from "../../../../../server/session";
import { hashPlan } from "../../../../../server/studio";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  if (!originOk(request)) return apiError(403, "FORBIDDEN", "ORIGIN", "This request came from the wrong site.");
  try {
    await connectDb();
  } catch {
    return apiError(503, "UNAVAILABLE", "DB_DOWN", "The studio database is not reachable.");
  }
  const user = await currentUser();
  if (!user) return apiError(401, "UNAUTHENTICATED", "NO_SESSION", "Sign in to open the studio.");
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  const project = await Project.findOne({ _id: id, ownerId: user._id });
  if (!project) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  const body = (await request.json().catch(() => null)) as {
    expectedRevision?: number;
    idea?: { topic?: string; audience?: string; notes?: string; mustInclude?: string[] };
    plan?: unknown;
  } | null;
  if (typeof body?.expectedRevision !== "number") {
    return apiError(400, "VALIDATION", "UNKNOWN_FIELD", "The draft revision is required.");
  }
  const draft = await Draft.findOne({ projectId: project._id, ownerId: user._id });
  if (!draft) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  if (draft.revision !== body.expectedRevision) {
    return apiError(409, "CONFLICT", "REVISION_CONFLICT", "This draft changed somewhere else.", {
      currentRevision: draft.revision,
    });
  }
  const idea = body.idea;
  if (idea) {
    draft.idea = {
      topic: (idea.topic ?? draft.idea?.topic ?? "").slice(0, 2000),
      audience: idea.audience?.slice(0, 200),
      notes: idea.notes?.slice(0, 20000),
      mustInclude: Array.isArray(idea.mustInclude) ? idea.mustInclude.slice(0, 12).map((item) => String(item).slice(0, 160)) : draft.idea?.mustInclude ?? [],
    };
    draft.markModified("idea");
  }
  if (body.plan) {
    const checked = validatePlan(body.plan);
    draft.plan = body.plan;
    draft.planValid = Boolean(checked.plan);
    draft.planHash = checked.plan ? hashPlan(checked.plan) : undefined;
    draft.markModified("plan");
  }
  draft.revision += 1;
  await draft.save();
  if (idea?.topic && project.title === "Untitled") {
    project.title = idea.topic.slice(0, 80);
    await project.save();
  }
  return NextResponse.json({ revision: draft.revision, planValid: draft.planValid, issues: [] });
}
