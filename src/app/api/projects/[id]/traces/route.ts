import { Draft, Trace } from "../../../../../server/db";
import { apiError } from "../../../../../server/http";
import { authed, json } from "../../../../../server/guard";
import { ownProject } from "../../../../../server/studio";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  const project = await ownProject(auth.user!._id, id);
  if (!project) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  const raw = await request.text();
  if (raw.length > 3_000_000) return apiError(413, "VALIDATION", "PAYLOAD_TOO_LARGE", "That trace is too big.");
  const body = JSON.parse(raw) as { language?: string; code?: string; entry?: string; input?: unknown; tracerVersion?: string; steps?: { line?: number; event?: string; stack?: unknown[] }[] };
  const steps = body.steps;
  if (!Array.isArray(steps) || steps.length === 0 || steps.length > 2000) {
    return apiError(422, "VALIDATION", "TRACE_INVALID", "A trace needs 1 to 2,000 steps.");
  }
  if (steps.some((step) => typeof step.line !== "number" || !step.event || !Array.isArray(step.stack))) {
    return apiError(422, "VALIDATION", "TRACE_INVALID", "A step needs a line, an event, and a stack.");
  }
  const summary = {
    callCount: steps.filter((step) => step.event === "call").length,
    maxDepth: Math.max(...steps.map((step) => step.stack?.length ?? 0)),
  };
  const trace = await Trace.create({
    ownerId: auth.user!._id,
    projectId: project._id,
    language: body.language || "python",
    entry: body.entry || "main",
    input: body.input ?? [],
    summary,
    tracerVersion: body.tracerVersion || "leela-trace@1",
    steps,
  });
  const draft = await Draft.findOne({ projectId: project._id, ownerId: auth.user!._id });
  if (draft) {
    draft.traceId = trace._id;
    await draft.save();
  }
  return json({ trace: { id: String(trace._id), summary } }, 201);
}
