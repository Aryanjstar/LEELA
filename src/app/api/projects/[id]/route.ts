import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb, Draft, Project, Video } from "../../../../server/db";
import { apiError, originOk } from "../../../../server/http";
import { currentUser } from "../../../../server/session";

type Ctx = { params: Promise<{ id: string }> };

function missing() {
  return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await connectDb();
  } catch {
    return apiError(503, "UNAVAILABLE", "DB_DOWN", "The studio database is not reachable.");
  }
  const user = await currentUser();
  if (!user) return apiError(401, "UNAUTHENTICATED", "NO_SESSION", "Sign in to open the studio.");
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return missing();
  try {
    const project = await Project.findOne({ _id: id, ownerId: user._id }).maxTimeMS(8_000);
    if (!project) return missing();
    const draft = await Draft.findOne({ projectId: project._id, ownerId: user._id }).maxTimeMS(8_000);
    const video = await Video.findOne({ projectId: project._id, ownerId: user._id, state: "ready" }).sort({ createdAt: -1 });
    return NextResponse.json({
      project: {
        id: String(project._id),
        title: project.title,
        mode: project.mode,
        format: project.format,
        targetMs: project.targetMs,
        language: project.language,
        voiceId: project.voiceId,
        styleId: project.styleId,
        badge: project.badge,
        updatedAt: project.updatedAt,
      },
      draft: draft
        ? {
            id: String(draft._id),
            revision: draft.revision,
            idea: draft.idea,
            plan: draft.plan,
            planHash: draft.planHash,
            planValid: draft.planValid,
            traceId: draft.traceId ? String(draft.traceId) : undefined,
          }
        : null,
      video: video
        ? { id: String(video._id), state: video.state, durationMs: video.durationMs, warnings: video.warnings, version: video.version }
        : null,
    });
  } catch {
    return apiError(503, "UNAVAILABLE", "DB_DOWN", "The studio database is not reachable.");
  }
}

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
  if (!mongoose.isValidObjectId(id)) return missing();
  const body = (await request.json().catch(() => null)) as { title?: string } | null;
  const title = body?.title?.trim().slice(0, 120);
  if (!title) return apiError(400, "VALIDATION", "UNKNOWN_FIELD", "A title is required.");
  const project = await Project.findOneAndUpdate({ _id: id, ownerId: user._id }, { title }, { new: true });
  if (!project) return missing();
  return NextResponse.json({
    project: { id: String(project._id), title: project.title },
  });
}

export async function DELETE(request: Request, ctx: Ctx) {
  if (!originOk(request)) return apiError(403, "FORBIDDEN", "ORIGIN", "This request came from the wrong site.");
  try {
    await connectDb();
  } catch {
    return apiError(503, "UNAVAILABLE", "DB_DOWN", "The studio database is not reachable.");
  }
  const user = await currentUser();
  if (!user) return apiError(401, "UNAUTHENTICATED", "NO_SESSION", "Sign in to open the studio.");
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return missing();
  const project = await Project.findOneAndDelete({ _id: id, ownerId: user._id });
  if (!project) return missing();
  await Draft.deleteMany({ projectId: project._id, ownerId: user._id });
  return new NextResponse(null, { status: 204 });
}
