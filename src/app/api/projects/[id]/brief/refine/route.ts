import { z } from 'zod';
import { authed } from '../../../../../../server/guard';
import { apiError } from '../../../../../../server/http';
import { briefError } from '../../../../../../server/brief-http';
import { ownBriefProject, refineProjectBrief } from '../../../../../../server/briefs';
import { json } from '../../../../../../server/guard';

const bodySchema = z.object({ expectedRevision: z.number().int().min(0), input: z.unknown() }).strict();
type Ctx = { params: Promise<{ id: string }> };
export async function POST(request: Request, ctx: Ctx) {
  const auth = await authed(request);
  if (auth.error) return auth.error;
  const project = await ownBriefProject(auth.user!._id, (await ctx.params).id);
  if (!project) return apiError(404, 'NOT_FOUND', 'NOT_FOUND', 'That project is not here.');
  try {
    const body = bodySchema.parse(await request.json());
    const brief = await refineProjectBrief(project, auth.user!._id, body.expectedRevision, body.input);
    return json({ revision: brief.revision, result: brief.result, state: brief.state });
  } catch (error) { return briefError(error); }
}
