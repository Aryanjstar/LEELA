import { briefAnswerSchema } from '../../../../../../brief/contract';
import { authed, json } from '../../../../../../server/guard';
import { apiError } from '../../../../../../server/http';
import { briefError } from '../../../../../../server/brief-http';
import { answerProjectBrief, ownBriefProject } from '../../../../../../server/briefs';

type Ctx = { params: Promise<{ id: string }> };
export async function POST(request: Request, ctx: Ctx) {
  const auth = await authed(request);
  if (auth.error) return auth.error;
  const project = await ownBriefProject(auth.user!._id, (await ctx.params).id);
  if (!project) return apiError(404, 'NOT_FOUND', 'NOT_FOUND', 'That project is not here.');
  try {
    const body = briefAnswerSchema.parse(await request.json());
    const brief = await answerProjectBrief(project, auth.user!._id, body.expectedRevision, body.choice);
    return json({ revision: brief.revision, result: brief.result, state: brief.state });
  } catch (error) { return briefError(error); }
}
