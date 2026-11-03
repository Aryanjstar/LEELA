import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { validatePlan } from '../../../../../contracts/plan';
import { connectDb, Draft, Project } from '../../../../../server/db';
import { apiError, originOk } from '../../../../../server/http';
import { currentUser } from '../../../../../server/session';
import { hashPlan } from '../../../../../server/studio';

const bodySchema = z.object({
  expectedRevision: z.number().int().positive(),
  idea: z.object({ topic: z.string().max(2000).optional(), audience: z.string().max(200).optional(), notes: z.string().max(20000).optional(), mustInclude: z.array(z.string().max(160)).max(12).optional() }).strict().optional(),
  plan: z.unknown().optional(),
}).strict();

type Ctx = { params: Promise<{ id: string }> };
export async function GET(_request: Request, ctx: Ctx) {
  try { await connectDb(); } catch { return apiError(503, 'UNAVAILABLE', 'DB_DOWN', 'The studio database is not reachable.'); }
  const user = await currentUser();
  if (!user) return apiError(401, 'UNAUTHENTICATED', 'NO_SESSION', 'Sign in to open the studio.');
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return apiError(404, 'NOT_FOUND', 'NOT_FOUND', 'That project is not here.');
  const project = await Project.findOne({ _id: id, ownerId: user._id });
  if (!project) return apiError(404, 'NOT_FOUND', 'NOT_FOUND', 'That project is not here.');
  const draft = await Draft.findOne({ projectId: project._id, ownerId: user._id });
  if (!draft) return apiError(404, 'NOT_FOUND', 'NOT_FOUND', 'That project is not here.');
  const issues = draft.issues ?? (draft.plan != null ? validatePlan(draft.plan).issues : []);
  return NextResponse.json({ revision: draft.revision, idea: draft.idea, plan: draft.plan ?? null, planValid: draft.planValid, planHash: draft.planHash ?? null, issues });
}
export async function PATCH(request: Request, ctx: Ctx) {
  if (!originOk(request)) return apiError(403, 'FORBIDDEN', 'ORIGIN', 'This request came from the wrong site.');
  try { await connectDb(); } catch { return apiError(503, 'UNAVAILABLE', 'DB_DOWN', 'The studio database is not reachable.'); }
  const user = await currentUser();
  if (!user) return apiError(401, 'UNAUTHENTICATED', 'NO_SESSION', 'Sign in to open the studio.');
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return apiError(404, 'NOT_FOUND', 'NOT_FOUND', 'That project is not here.');
  const project = await Project.findOne({ _id: id, ownerId: user._id });
  if (!project) return apiError(404, 'NOT_FOUND', 'NOT_FOUND', 'That project is not here.');
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, 'VALIDATION', 'INVALID_DRAFT', 'Check the draft fields and revision.');
  const body = parsed.data;
  const set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body.idea ?? {})) if (value !== undefined) set[`idea.${key}`] = value;
  const unset: Record<string, number> = {};
  if (Object.hasOwn(body, 'plan')) {
    if (body.plan === null) { unset.plan = 1; unset.planHash = 1; set.planValid = false; set.issues = []; }
    else {
      const checked = validatePlan(body.plan);
      set.issues = checked.issues;
      set.plan = body.plan;
      set.planValid = Boolean(checked.plan);
      if (checked.plan) set.planHash = hashPlan(checked.plan); else unset.planHash = 1;
    }
  }
  const update: Record<string, unknown> = { $inc: { revision: 1 } };
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;
  const draft = await Draft.findOneAndUpdate({ projectId: project._id, ownerId: user._id, revision: body.expectedRevision }, update, { new: true });
  if (!draft) {
    const current = await Draft.findOne({ projectId: project._id, ownerId: user._id }).select('revision');
    if (!current) return apiError(404, 'NOT_FOUND', 'NOT_FOUND', 'That project is not here.');
    return apiError(409, 'CONFLICT', 'REVISION_CONFLICT', 'This draft changed somewhere else.', { currentRevision: current.revision });
  }
  if (body.idea?.topic) await Project.updateOne({ _id: project._id, ownerId: user._id, title: 'Untitled' }, { $set: { title: body.idea.topic.slice(0, 80) } });
  const issues = draft.issues ?? (draft.plan != null ? validatePlan(draft.plan).issues : []);
  return NextResponse.json({ revision: draft.revision, planValid: draft.planValid, planHash: draft.planHash ?? null, issues });
}
