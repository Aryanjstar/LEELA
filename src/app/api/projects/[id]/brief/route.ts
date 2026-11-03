import { NextResponse } from 'next/server';
import { Brief } from '../../../../../server/db';
import { authed } from '../../../../../server/guard';
import { apiError } from '../../../../../server/http';
import { ownBriefProject } from '../../../../../server/briefs';

type Ctx = { params: Promise<{ id: string }> };
export async function GET(_request: Request, ctx: Ctx) {
  const auth = await authed();
  if (auth.error) return auth.error;
  const project = await ownBriefProject(auth.user!._id, (await ctx.params).id);
  if (!project) return apiError(404, 'NOT_FOUND', 'NOT_FOUND', 'That project is not here.');
  const brief = await Brief.findOne({ ownerId: auth.user!._id, projectId: project._id });
  if (!brief) return NextResponse.json({ brief: null });
  return NextResponse.json({ brief: { revision: brief.revision, version: brief.version, input: brief.input, result: brief.result, state: brief.state, approvedAt: brief.approvedAt ?? null } });
}
