import mongoose from 'mongoose';
import { validatePlan } from '../../../../../contracts/plan';
import { Draft, Message } from '../../../../../server/db';
import { apiError } from '../../../../../server/http';
import { authed, json } from '../../../../../server/guard';
import { hashPlan } from '../../../../../server/studio';

class Conflict extends Error { constructor(public reason: string, public revision?: number) { super(reason); } }
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ('error' in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return apiError(404, 'NOT_FOUND', 'NOT_FOUND', 'That note is not here.');
  const body = await request.json().catch(() => null) as { expectedRevision?: unknown } | null;
  if (!Number.isInteger(body?.expectedRevision) || (body?.expectedRevision as number) < 1) return apiError(400, 'VALIDATION', 'INVALID_REVISION', 'The draft revision is required.');
  const revision = body!.expectedRevision as number;
  const session = await mongoose.startSession();
  try {
    let result: { revision: number; planValid: boolean; planHash: string } | undefined;
    await session.withTransaction(async () => {
      const message = await Message.findOne({ _id: id, ownerId: auth.user!._id, role: 'assistant' }).session(session);
      if (!message?.candidate || message.candidate.status !== 'proposed') throw new Conflict('CANDIDATE_CLOSED');
      if (message.candidate.sourceRevision !== revision) throw new Conflict('REVISION_CONFLICT');
      const checked = validatePlan(message.candidate.plan);
      if (!checked.plan) throw new Conflict('PLAN_INVALID');
      const planHash = hashPlan(checked.plan);
      const draft = await Draft.findOneAndUpdate({ projectId: message.projectId, ownerId: auth.user!._id, revision }, { $set: { plan: checked.plan, planValid: true, planHash, issues: [] }, $inc: { revision: 1 } }, { session, new: true });
      if (!draft) {
        const current = await Draft.findOne({ projectId: message.projectId, ownerId: auth.user!._id }).session(session).select('revision');
        throw new Conflict('REVISION_CONFLICT', current?.revision);
      }
      const updated = await Message.updateOne({ _id: message._id, ownerId: auth.user!._id, 'candidate.status': 'proposed', 'candidate.sourceRevision': revision }, { $set: { 'candidate.status': 'kept' } }, { session });
      if (updated.modifiedCount !== 1) throw new Conflict('CANDIDATE_CLOSED');
      result = { revision: draft.revision, planValid: true, planHash };
    });
    return json({ draft: result });
  } catch (error) {
    if (error instanceof Conflict) {
      if (error.reason === 'PLAN_INVALID') return apiError(422, 'VALIDATION', 'PLAN_INVALID', 'That suggestion is not valid.');
      return apiError(409, 'CONFLICT', error.reason, error.reason === 'CANDIDATE_CLOSED' ? 'That suggestion is already closed.' : 'This draft changed. Reload it.', error.revision ? { currentRevision: error.revision } : undefined);
    }
    throw error;
  } finally { await session.endSession(); }
}
