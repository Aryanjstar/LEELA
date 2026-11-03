import { z } from 'zod';
import { authed, json } from '../../../../../../server/guard';
import { apiError } from '../../../../../../server/http';
import { briefError } from '../../../../../../server/brief-http';
import { approveProjectBrief, ownBriefProject } from '../../../../../../server/briefs';

const bodySchema = z.object({ expectedRevision: z.number().int().positive(), contentHash: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
type Ctx = { params: Promise<{ id: string }> };
export async function POST(request: Request, ctx: Ctx) {
  const auth = await authed(request);
  if (auth.error) return auth.error;
  const project = await ownBriefProject(auth.user!._id, (await ctx.params).id);
  if (!project) return apiError(404, 'NOT_FOUND', 'NOT_FOUND', 'That project is not here.');
  try {
    const body = bodySchema.parse(await request.json());
    return json(await approveProjectBrief(project._id, auth.user!._id, body.expectedRevision, body.contentHash));
  } catch (error) { return briefError(error); }
}
